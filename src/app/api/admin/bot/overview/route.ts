export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { prisma } from '@/lib/db'
import { bjDayStart } from '@/lib/marketing/time'
import { adapterName, getAdapter, wxpadEnvStatus } from '@/lib/bot/adapters'
import { botEnabledByEnv, linkOrigin as resolveLinkOrigin, readBotConfig } from '@/lib/bot/config'
import { inNewAccountQuiet, readBotState } from '@/lib/bot/state'
import type { LiveStatusDTO, OverviewDTO } from '@/app/admin/bot/types'

/**
 * 概览（docs/微信机器人-设计.md §14「概览」）：
 *  · 协议服务与小号状态——默认读最近一次在线检查（每分钟 cron 写在 settings.bot_wxpad 里），不打协议服务；
 *    带 ?live=1 才现查一次（最多等 10 秒），页面「刷新状态」用；
 *  · 今日发送 / 失败 / 待发 / 被拦截 / 过期，会话与管理员数量，锁定状态，运行开关。
 * 协议服务的授权码（authKey）永远不出现在响应里，只告诉页面「有没有」。
 */
export async function GET(request: NextRequest) {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const live = request.nextUrl.searchParams.get('live') === '1'
    const now = new Date()
    const dayStart = bjDayStart(now)

    const [state, cfg] = await Promise.all([readBotState(), readBotConfig({ fresh: true })])

    let liveStatus: LiveStatusDTO | null = null
    if (live) {
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10_000))
      const st = await Promise.race([getAdapter().status().catch(() => null), timeout])
      liveStatus = st
        ? { reachable: st.reachable, online: st.online, detail: st.detail ?? null, botWxid: st.botWxid ?? null, nickname: st.nickname ?? null }
        : { reachable: false, online: false, detail: '查询超时（10 秒内协议服务没有响应）', botWxid: null, nickname: null }
    }

    const [sent, failed, pending, expired, blockedRows, blkAlerts, convGroups, adminsEnabled, identities] = await Promise.all([
      prisma.botOutbox.count({ where: { status: 'SENT', sentAt: { gte: dayStart } } }),
      prisma.botOutbox.count({ where: { status: 'FAILED', updatedAt: { gte: dayStart } } }),
      prisma.botOutbox.count({ where: { status: { in: ['PENDING', 'SENDING'] } } }),
      prisma.botOutbox.count({ where: { status: 'EXPIRED', updatedAt: { gte: dayStart } } }),
      prisma.botOutbox.count({ where: { status: 'BLOCKED', updatedAt: { gte: dayStart } } }),
      // 分站群黑名单扫描命中后（route.ts）不入分站队列，而是在每个管理群各发一条 dedupe_key = blk:<事件 id> 的告警：按事件去重后就是「被拦下的条数」
      prisma.botOutbox.findMany({ where: { dedupeKey: { startsWith: 'blk:' }, createdAt: { gte: dayStart } }, select: { dedupeKey: true }, distinct: ['dedupeKey'], take: 500 }),
      prisma.botConversation.groupBy({ by: ['kind', 'status'], where: { status: { not: 'REVOKED' } }, _count: { _all: true } }),
      prisma.botAdmin.count({ where: { enabled: true } }),
      prisma.botAdminIdentity.count({ where: { enabled: true } }),
    ])

    const convs = { mgmt: 0, tenant: 0, dm: 0, paused: 0, unreachable: 0 }
    convGroups.forEach((g) => {
      const n = g._count._all
      if (g.kind === 'MGMT') convs.mgmt += n
      else if (g.kind === 'TENANT') convs.tenant += n
      else if (g.kind === 'DM') convs.dm += n
      if (g.status === 'PAUSED') convs.paused += n
      if (g.status === 'UNREACHABLE') convs.unreachable += n
    })

    const config = cfg.ok ? cfg.config : null
    const hours = config?.newAccountQuietHours ?? 48
    const newAccountActive = inNewAccountQuiet(state, hours, now)
    const dto: OverviewDTO = {
      serverTime: now.toISOString(),
      env: {
        botEnabled: botEnabledByEnv(),
        adapter: adapterName(),
        ...wxpadEnvStatus(),
        linkOrigin: resolveLinkOrigin(config ?? undefined),
      },
      state: {
        botWxid: state.botWxid,
        nickname: state.nickname,
        loginAt: state.loginAt,
        checkedAt: state.checkedAt,
        online: state.online,
        offlineSince: state.offlineSince,
        offlineAlerted: state.offlineAlerted,
        detail: state.detail,
        hasAuthKey: !!state.authKey,
      },
      newAccount: {
        active: newAccountActive,
        until: newAccountActive && state.loginAt ? new Date(Date.parse(state.loginAt) + hours * 3600_000).toISOString() : null,
        hours,
      },
      live: liveStatus,
      config: {
        ok: cfg.ok,
        reason: cfg.ok ? null : cfg.reason,
        enabled: config?.enabled ?? true,
        locked: config?.locked ?? false,
        lockedAt: config?.lockedAt ?? null,
        lockedBy: config?.lockedBy ?? null,
        version: config?.version ?? null,
      },
      // 被拦截：两个来源取大——BLOCKED 行（设计 §13 的状态）与黑名单告警（当前 route.ts 的实现），避免将来两者同时出现时重复计数
      today: { sent, failed, pending, blocked: Math.max(blockedRows, blkAlerts.length), expired, since: dayStart.toISOString() },
      convs,
      admins: { enabled: adminsEnabled, identities },
    }
    const res = success(dto)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (e) {
    console.error('[bot-admin] overview 失败', e)
    return error('读取概览失败', 500)
  }
}
