/**
 * 每日零时日报（docs/微信机器人-设计.md §6.1–6.3；格式见附录 A「主站日报」「分站日报」；附录 B 第 13 条）。
 * cron 每天 00:01 POST /api/cron/bot-daily → runDailyReports()，返回值原样回 JSON（便于在 cron 日志里核对）。
 *
 * - 窗口 = 刚结束的北京自然日 [今天 0 点 − 1 天, 今天 0 点)（window.yesterdayWindow，bjDayStart / addBjDays，不依赖容器 TZ）。
 * - 锁 bot:daily（10 分钟，lock.ts）：拿不到 = 上一趟还在跑，直接返回 skipped。
 * - BOT_ENABLED 未开或 bot_config.enabled = false 时跳过；配置读坏了按出厂默认继续（推送路径同一规则，config.botConfigForDelivery）。
 * - 发给谁：ACTIVE 的主站管理群（MGMT）每群一份主站日报（核心数据、明细与待办两条）；ACTIVE 的分站群（TENANT）只发本群绑定分站的那份，
 *   同一分站被几个群绑定只统计一次。私聊（DM）不推动态，也不推日报。
 * - 新号保护期内（state.inNewAccountQuiet，§5.6）只发管理群；分站群这一天的日报不补发。
 * - 幂等：每个会话每条一行 bot_outbox，dedupe_key = daily:<YYYY-MM-DD>:<第几条>；重跑只补缺——已经有这一天日报的会话整份跳过
 *   （同一会话的几条用一次 createMany 写入，要么全有要么全无；万一并发重跑，(conversation_id, dedupe_key) 唯一键兜底）。
 * - 错峰：管理群 00:02；分站群按会话编号依次 00:02 + 序号 × 45 秒 + 0–20 秒随机（20 个群约 00:17 发完）。重跑时已过 00:02 就从现在起排。
 *   日报不受免打扰限制（直接写出队，不走路由的免打扰顺延）；过期时间 = 计划发出时刻 + 12 小时。
 * - 某个分站取数或入队失败只跳过这个分站（记进返回值 errors），不影响别的群；主站那份失败同样不挡分站群。
 */
import { prisma } from '../../db'
import { bjDayStart } from '../../marketing/time'
import { botConfigForDelivery, botEnabledByEnv } from '../config'
import { acquireBotLock, releaseBotLock } from '../lock'
import { enqueueMany, type EnqueueInput } from '../outbox'
import { kickSender } from '../sender'
import { inNewAccountQuiet, readBotState } from '../state'
import { collectMainReport } from './main'
import { collectTenantReport } from './tenant'
import { renderMainDaily, renderTenantDaily } from './text'
import { yesterdayWindow } from './window'

const LOCK_TTL_MS = 10 * 60_000
/** 00:02 起发：给 23:59 付款、零点之后才提交的事务留一分钟（§6.1） */
const SEND_OFFSET_MS = 2 * 60_000
/** 分站群之间的错峰间隔与随机抖动 */
const TENANT_STAGGER_MS = 45_000
const TENANT_JITTER_MS = 20_000
/** 日报发不出去多久作废（比普通动态的 12 小时同级；第二天还没发出去的日报没意义） */
const REPORT_TTL_MS = 12 * 3600_000

export interface DailyRunResult {
  /** 报的是哪一天（北京日期）；跳过时可能为 null */
  day: string | null
  skipped?: string
  mgmt: { conversations: number; messages: number }
  tenant: { tenants: number; conversations: number; messages: number; held: number }
  /** 实际新写入的出队行数 */
  enqueued: number
  /** 已经有这一天日报、整份跳过的会话数（重跑） */
  already: number
  errors: string[]
}

function emptyResult(day: string | null, skipped?: string): DailyRunResult {
  return { day, ...(skipped ? { skipped } : {}), mgmt: { conversations: 0, messages: 0 }, tenant: { tenants: 0, conversations: 0, messages: 0, held: 0 }, enqueued: 0, already: 0, errors: [] }
}

/** 一个会话的几条日报：daily:<日期>:1、:2 …，同一会话一次写入 */
function itemsFor(conversationId: number, day: string, texts: string[], notBefore: Date): EnqueueInput[] {
  return texts.map((text, i) => ({
    conversationId,
    kind: 'REPORT' as const,
    text,
    dedupeKey: `daily:${day}:${i + 1}`,
    notBefore,
    expiresAt: new Date(notBefore.getTime() + REPORT_TTL_MS),
  }))
}

export async function runDailyReports(now: Date = new Date()): Promise<DailyRunResult> {
  const w = yesterdayWindow(now)
  const day = w.dayFrom
  if (!botEnabledByEnv()) return emptyResult(day, 'BOT_ENABLED 未开')
  const token = await acquireBotLock('daily', LOCK_TTL_MS)
  if (!token) return emptyResult(day, '上一趟日报还没跑完')
  try {
    const cfg = await botConfigForDelivery()
    if (!cfg.enabled) return emptyResult(day, '后台已停用机器人（bot_config.enabled = false）')
    const out = emptyResult(day)

    const convs = await prisma.botConversation.findMany({
      where: { status: 'ACTIVE', kind: { in: ['MGMT', 'TENANT'] } },
      select: { id: true, kind: true, tenantId: true },
      orderBy: { id: 'asc' },
    })
    if (!convs.length) return { ...out, skipped: '没有推送中的群' }
    // 重跑只补缺：已有这一天日报的会话整份跳过（(conversation_id, dedupe_key) 唯一索引的前缀查询）
    const doneRows = await prisma.botOutbox.findMany({
      where: { conversationId: { in: convs.map((c) => c.id) }, dedupeKey: { startsWith: `daily:${day}:` } },
      select: { conversationId: true },
      distinct: ['conversationId'],
    })
    const done = new Set(doneRows.map((r) => r.conversationId))
    out.already = done.size

    const sendBase = new Date(Math.max(bjDayStart(now).getTime() + SEND_OFFSET_MS, now.getTime()))

    // ── 主站管理群：一份主站日报发给每个管理群 ──
    const mgmt = convs.filter((c) => c.kind === 'MGMT' && !done.has(c.id))
    if (mgmt.length) {
      try {
        const texts = renderMainDaily(await collectMainReport(w, { issueUserId: cfg.issueUserId, now }))
        for (const c of mgmt) {
          const n = await enqueueMany(itemsFor(c.id, day, texts, sendBase), now)
          out.enqueued += n
          out.mgmt.conversations++
          out.mgmt.messages += n
        }
      } catch (e) {
        console.error('[bot] 主站日报生成失败', e)
        out.errors.push(`主站：${(e as Error)?.message ?? String(e)}`.slice(0, 200))
      }
    }

    // ── 分站群：按绑定的分站分组，每个分站只统计一次；序号按会话编号（全部推送中的分站群里的位置）错峰 ──
    const tenantConvs = convs.filter((c) => c.kind === 'TENANT' && c.tenantId != null && c.tenantId >= 2)
    const state = await readBotState()
    if (tenantConvs.length && inNewAccountQuiet(state, cfg.newAccountQuietHours, now)) {
      // 新号保护期内只发管理群（§5.6）
      out.tenant.held = tenantConvs.filter((c) => !done.has(c.id)).length
    } else {
      const seq = new Map(tenantConvs.map((c, i) => [c.id, i + 1]))
      const byTenant = new Map<number, number[]>()
      for (const c of tenantConvs) {
        if (done.has(c.id)) continue
        const list = byTenant.get(c.tenantId!) ?? []
        list.push(c.id)
        byTenant.set(c.tenantId!, list)
      }
      for (const [tenantId, ids] of Array.from(byTenant.entries())) {
        try {
          const texts = renderTenantDaily(await collectTenantReport(tenantId, w))
          out.tenant.tenants++
          for (const id of ids) {
            const notBefore = new Date(sendBase.getTime() + (seq.get(id) ?? 1) * TENANT_STAGGER_MS + Math.floor(Math.random() * TENANT_JITTER_MS))
            const n = await enqueueMany(itemsFor(id, day, texts, notBefore), now)
            out.enqueued += n
            out.tenant.conversations++
            out.tenant.messages += n
          }
        } catch (e) {
          console.error(`[bot] 分站日报生成失败（tenant=${tenantId}）`, e)
          out.errors.push(`分站 ${tenantId}：${(e as Error)?.message ?? String(e)}`.slice(0, 200))
        }
      }
    }

    if (out.enqueued) kickSender()
    return out
  } finally {
    await releaseBotLock('daily', token)
  }
}
