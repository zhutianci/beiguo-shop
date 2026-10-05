/**
 * 每分钟的兜底任务（cron /api/cron/bot-tick，docs/微信机器人-设计.md §12.2）：
 * 回扫渠道通知 → 路由 → 作废过期 → 收回租约 → 查小号在线状态并告警 → 唤醒发送器。
 * 整趟持有 bot:tick 锁（防 cron 重叠）；任何一步出错只记日志，后面的步骤照跑。
 */
import { prisma } from '../db'
import { notify } from '../notify'
import { ensureWxpadSocket, getAdapter } from './adapters'
import { botEnabledByEnv } from './config'
import { acquireBotLock, releaseBotLock } from './lock'
import { enqueueMany, expireOld, recoverLeases } from './outbox'
import { bjMinute } from './render'
import { PLATFORM_SITE_LABEL, routePendingEvents } from './route'
import { scanTenantNotices } from './scan'
import { kickSender } from './sender'
import { addOfflineMinutes, offlineStepMinutes, patchBotState, readBotState } from './state'
import { bjDateKey } from '../marketing/time'

/** 离线超过多久才告警（避免协议服务偶尔抖一下就刷屏） */
const OFFLINE_ALERT_AFTER_MS = 5 * 60_000

export interface TickResult {
  scanned: number
  routed: number
  expired: number
  recovered: number
  online: boolean | null
  skipped?: string
}

async function step<T>(name: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    console.error(`[bot] tick ${name} 失败`, (e as Error)?.message)
    return fallback
  }
}

/** 查在线状态；离线满 5 分钟发企业微信告警，恢复时发恢复通知并在管理群说明过期了多少条 */
export async function checkHealth(now: Date = new Date()): Promise<boolean | null> {
  const adapter = getAdapter()
  const st = await adapter.status()
  const prev = await readBotState()
  if (st.online) {
    if (prev.offlineAlerted) {
      const since = prev.offlineSince ? new Date(prev.offlineSince) : null
      const expired = since ? await prisma.botOutbox.count({ where: { status: 'EXPIRED', updatedAt: { gte: since } } }) : 0
      notify('bot.online', [
        { label: '恢复时间', value: bjMinute(now) },
        { label: '离线期间过期的动态', value: `${expired} 条` },
      ])
      const mgmt = await prisma.botConversation.findMany({ where: { kind: 'MGMT', status: 'ACTIVE' }, select: { id: true } })
      await enqueueMany(
        mgmt.map((c) => ({
          conversationId: c.id,
          kind: 'ALERT' as const,
          text: `✅ 机器人已恢复｜${PLATFORM_SITE_LABEL}\n离线期间有 ${expired} 条动态已过期没发出，可在后台「微信机器人」查看`,
          dedupeKey: `online:${now.getTime()}`,
        })),
        now
      )
    }
    await patchBotState({
      online: true,
      checkedAt: now.toISOString(),
      offlineSince: null,
      offlineAlerted: false,
      detail: st.detail ?? null,
      ...(st.botWxid ? { botWxid: st.botWxid } : {}),
    })
    return true
  }
  // 离线（或连不上）。从没登录过的不告警（还在部署阶段）
  const offlineSince = prev.offlineSince ?? now.toISOString()
  let alerted = prev.offlineAlerted
  if (prev.loginAt && !alerted && now.getTime() - Date.parse(offlineSince) >= OFFLINE_ALERT_AFTER_MS) {
    notify('bot.offline', [
      { label: '离线开始', value: offlineSince },
      { label: '状态', value: st.detail || '未知' },
      { label: '处理', value: '后台「微信机器人 → 概览」先点「唤醒登录」，不行再扫码登录（见设计文档故障手册）' },
    ], { link: '/admin/bot', linkText: '前往后台' })
    alerted = true
  }
  // 日报「机器人运行情况」的离线分钟（§6.2）：登录过之后，每次查到离线就把距上次检查的时间（最多 5 分钟）记到今天的北京日期上
  const offlineMinutes = prev.loginAt ? addOfflineMinutes(prev.offlineMinutes, bjDateKey(now), offlineStepMinutes(prev.checkedAt, now)) : prev.offlineMinutes
  await patchBotState({ online: false, checkedAt: now.toISOString(), offlineSince, offlineAlerted: alerted, detail: st.detail ?? null, offlineMinutes })
  return false
}

export async function runTick(now: Date = new Date()): Promise<TickResult> {
  if (!botEnabledByEnv()) return { scanned: 0, routed: 0, expired: 0, recovered: 0, online: null, skipped: 'BOT_ENABLED 未开' }
  const token = await acquireBotLock('tick', 55_000)
  if (!token) return { scanned: 0, routed: 0, expired: 0, recovered: 0, online: null, skipped: '上一趟还没跑完' }
  try {
    const scanned = await step('scan', () => scanTenantNotices(now), 0)
    const routed = await step('route', () => routePendingEvents(500, now), 0)
    const expired = await step('expire', () => expireOld(now), 0)
    const recovered = await step('recover', () => recoverLeases(now), 0)
    const online = await step('health', () => checkHealth(now), null)
    // 收消息走 WebSocket 时（BOT_WXPAD_RECEIVE=ws）：连接断了在这里补连；webhook 模式什么都不做
    await step('socket', () => ensureWxpadSocket(), undefined)
    kickSender()
    return { scanned, routed, expired, recovered, online }
  } finally {
    await releaseBotLock('tick', token)
  }
}
