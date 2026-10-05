/**
 * 路由（docs/微信机器人-设计.md §5.3）：bot_events → 每个目标会话一条 bot_outbox。
 *
 *  1. 主站事件（notify，site 为空）→ ACTIVE 的管理群中订阅了该类别的
 *  2. 渠道告警（带 site 的 notify、alertPlatform）→ 管理群（站长 Q7），标「站名（代码）」；永不投分站群
 *  3. 分站事件（tenant_id = X ≠ 1）→ 只投 tenant_id = X 的 ACTIVE 分站群；永不投别的分站群，也不投管理群
 *  4. 免打扰时段的非紧急事件推迟到免打扰结束（合并成汇总）；新号保护期内分站群推迟到保护期结束
 *  5. 分站群的文本过黑名单扫描，命中就不入队并告警（fail closed）
 */
import { prisma } from '../db'
import { storefrontById } from '../storefront/resolve'
import { botConfigForDelivery, linkOrigin } from './config'
import { NOTIFY_EVENT_DEFS, isSubscribed } from './events/catalog'
import { tenantBlacklistHit } from './mask'
import { enqueueMany, quietUntil, type EnqueueInput } from './outbox'
import { renderEventText, summaryLine } from './render'
import { inNewAccountQuiet, readBotState } from './state'
import { PRIORITY, type BotCategory, type BotLine } from './types'

export const PLATFORM_SITE_LABEL = '贝果科技'

interface ConvRow {
  id: number
  kind: string
  tenantId: number | null
  subs: unknown
  quietFrom: number | null
  quietTo: number | null
}

interface EventRow {
  id: number
  source: string
  type: string
  category: string
  tenantId: number
  siteCode: string | null
  urgent: boolean
  title: string
  lines: unknown
  link: string | null
  linkText: string | null
  createdAt: Date
}

/** 分站的显示信息（站名、代码、站点地址），一次路由内缓存 */
async function siteInfo(cache: Map<string, { name: string; code: string; origin: string } | null>, key: { tenantId?: number; code?: string }) {
  const k = key.tenantId ? `id:${key.tenantId}` : `code:${key.code}`
  if (cache.has(k)) return cache.get(k)!
  let tenantId = key.tenantId ?? null
  if (!tenantId && key.code) {
    const t = await prisma.tenant.findUnique({ where: { code: key.code }, select: { id: true } }).catch(() => null)
    tenantId = t?.id ?? null
  }
  let v: { name: string; code: string; origin: string } | null = null
  if (tenantId) {
    const sf = await storefrontById(tenantId).catch(() => null)
    if (sf) v = { name: sf.brand?.name || sf.code, code: sf.code, origin: sf.origin }
  }
  if (!v && key.code) v = { name: key.code, code: key.code, origin: '' }
  cache.set(k, v)
  return v
}

/** 事件是不是「需要显式订阅才推」的（目录里 defaultOn=false 的单个事件，如 wallet.topup） */
function optInOnly(ev: EventRow): boolean {
  if (ev.source !== 'notify') return false
  const def = NOTIFY_EVENT_DEFS[ev.type as keyof typeof NOTIFY_EVENT_DEFS]
  return !!def && !def.defaultOn
}

function subscribed(conv: ConvRow, ev: EventRow): boolean {
  if (!isSubscribed(conv.subs, ev.category as BotCategory)) return false
  if (optInOnly(ev)) {
    const subs = (conv.subs && typeof conv.subs === 'object' ? conv.subs : {}) as Record<string, unknown>
    return subs[`ev:${ev.type}`] === true
  }
  return true
}

/** 处理一批未路由的事件；返回入队条数 */
export async function routePendingEvents(limit = 200, now: Date = new Date()): Promise<number> {
  const events: EventRow[] = await prisma.botEvent.findMany({
    where: { routedAt: null },
    orderBy: { id: 'asc' },
    take: limit,
    select: { id: true, source: true, type: true, category: true, tenantId: true, siteCode: true, urgent: true, title: true, lines: true, link: true, linkText: true, createdAt: true },
  })
  if (!events.length) return 0

  const cfg = await botConfigForDelivery()
  if (!cfg.enabled) {
    // 后台「推送运行开关」关着（bot_config.enabled = false）：停用期间的动态直接作废——标已路由、不入队，
    // 打开之后不会把积压的旧动态一口气补发出去。指令回复不经过这里，照常
    await prisma.botEvent.updateMany({ where: { id: { in: events.map((e) => e.id) }, routedAt: null }, data: { routedAt: now } })
    return 0
  }
  const state = await readBotState()
  const newAccount = inNewAccountQuiet(state, cfg.newAccountQuietHours, now)
  const newAccountEnd = newAccount && state.loginAt ? new Date(Date.parse(state.loginAt) + cfg.newAccountQuietHours * 3600_000) : null
  const convs: ConvRow[] = await prisma.botConversation.findMany({
    where: { status: 'ACTIVE', kind: { in: ['MGMT', 'TENANT'] } },
    select: { id: true, kind: true, tenantId: true, subs: true, quietFrom: true, quietTo: true },
  })
  const mgmt = convs.filter((c) => c.kind === 'MGMT')
  const mainOrigin = linkOrigin(cfg)
  const cache = new Map<string, { name: string; code: string; origin: string } | null>()

  const items: EnqueueInput[] = []
  for (const ev of events) {
    const lines = (Array.isArray(ev.lines) ? ev.lines : []) as BotLine[]
    const renderable = { title: ev.title, lines, link: ev.link, linkText: ev.linkText }
    const isChannelAlert = ev.tenantId === 1 && (ev.source === 'platform_alert' || !!ev.siteCode)
    const priority = ev.urgent ? PRIORITY.URGENT : PRIORITY.EVENT

    if (ev.tenantId === 1) {
      // 规则 1、2：只投管理群
      let siteLabel = PLATFORM_SITE_LABEL
      if (isChannelAlert && ev.siteCode) {
        const info = await siteInfo(cache, { code: ev.siteCode })
        siteLabel = info ? `${info.name}（${info.code}）` : `渠道（${ev.siteCode}）`
      } else if (isChannelAlert) {
        siteLabel = '渠道'
      }
      const text = renderEventText(renderable, { siteLabel, origin: mainOrigin })
      for (const c of mgmt) {
        if (!subscribed(c, ev)) continue
        items.push({
          conversationId: c.id,
          eventId: ev.id,
          kind: ev.urgent ? 'ALERT' : 'EVENT',
          priority,
          text,
          category: ev.category,
          summary: summaryLine(renderable, ev.createdAt),
          dedupeKey: `ev:${ev.id}`,
        })
      }
      continue
    }

    // 规则 3：分站事件只投该分站的群
    const targets = convs.filter((c) => c.kind === 'TENANT' && c.tenantId === ev.tenantId && subscribed(c, ev))
    if (!targets.length) continue
    const info = await siteInfo(cache, { tenantId: ev.tenantId })
    const text = renderEventText(renderable, { siteLabel: info?.name || '分站', origin: info?.origin || mainOrigin })
    const hit = tenantBlacklistHit(text)
    if (hit) {
      // fail closed：不入队、告警（只记日志 + 管理群一条，原文不外发）
      console.error(`[bot] 分站群消息命中黑名单（${hit}），已拦下 event=${ev.id} type=${ev.type}`)
      for (const c of mgmt) {
        items.push({
          conversationId: c.id,
          kind: 'ALERT',
          text: `🚨 机器人拦下了一条分站推送｜${PLATFORM_SITE_LABEL}\n原因：内容含不该进分站群的信息（${hit}）\n事件：${ev.type} #${ev.id}\n请到后台「微信机器人 → 指令日志」核对`,
          dedupeKey: `blk:${ev.id}`,
        })
      }
      continue
    }
    for (const c of targets) {
      let notBefore: Date | undefined
      if (!ev.urgent) {
        const q = quietUntil(now, c.quietFrom, c.quietTo)
        if (q) notBefore = q
      }
      if (newAccountEnd && (!notBefore || notBefore < newAccountEnd)) notBefore = newAccountEnd
      items.push({
        conversationId: c.id,
        eventId: ev.id,
        kind: ev.urgent ? 'ALERT' : 'EVENT',
        priority,
        text,
        category: ev.category,
        summary: summaryLine(renderable, ev.createdAt),
        dedupeKey: `ev:${ev.id}`,
        notBefore,
        expiresAt: notBefore ? new Date(notBefore.getTime() + 12 * 3600_000) : undefined,
      })
    }
  }

  const n = await enqueueMany(items, now)
  await prisma.botEvent.updateMany({ where: { id: { in: events.map((e) => e.id) }, routedAt: null }, data: { routedAt: now } })
  return n
}
