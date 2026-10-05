/**
 * 回扫渠道站内通知（tenant_notices）→ bot_events（docs/微信机器人-设计.md §5.1）。
 *
 * 为什么回扫而不是在 emitTenantNotice 里加旁路：通知有一半随业务事务写入，在事务里多写一张表就多一个失败点；
 * 回扫用事务外的连接，天然只看得到已提交的行，回滚了的永远看不到。
 *
 * 为什么按主键水位而不是按时间：tenant_notices 只有 (tenant_id, read_at, id) 一个索引、没有清理任务，
 * 按 created_at 扫会全表扫描。这里在 settings.bot_tn_wm 里记一串「(时间, 当时看到的最大 id)」，
 * 每次从「15 分钟前记下的最大 id」往后按主键扫：大 id 先提交、小 id 后提交（长事务）的行，15 分钟内都还能被扫到；
 * 重复插入由 bot_events.dedupe_key = 'tn:<id>' 的唯一键挡掉。
 *
 * 第一次运行只记水位、不补发历史通知（否则一上线就把几个月的旧通知推进群）。
 */
import { prisma } from '../db'
import { storefrontById } from '../storefront/resolve'
import { TENANT_NOTICE_DEFS } from './events/catalog'
import { oneLine, sanitizeSystemValue, sanitizeUserText } from './mask'
import { tenantReplyLink } from './tenant-reply'
import type { TenantNoticeKind } from '../tenant/types'
import type { BotLine } from './types'

export const TN_WATERMARK_KEY = 'bot_tn_wm'
const LOOKBACK_MS = 15 * 60_000
const KEEP_MS = 30 * 60_000
const PAGE = 300
const MAX_PAGES = 10

/** 不推的通知：渠道「发送测试」（只推企业微信）、邮件超限说明（设计上就不推送），§5.1 */
const SKIP_DEDUPE_PREFIXES = ['whtest:', 'mailcap:']

type Mark = { t: number; id: number }

async function readMarks(): Promise<Mark[] | null> {
  const row = await prisma.setting.findUnique({ where: { key: TN_WATERMARK_KEY } })
  if (!row) return null
  try {
    const arr = JSON.parse(row.value)
    if (!Array.isArray(arr)) return []
    return arr
      .filter((m) => m && Number.isFinite(m.t) && Number.isInteger(m.id))
      .map((m) => ({ t: Number(m.t), id: Number(m.id) }))
      .sort((a, b) => a.t - b.t)
  } catch {
    return []
  }
}

async function writeMarks(marks: Mark[]): Promise<void> {
  const value = JSON.stringify(marks)
  await prisma.setting.upsert({ where: { key: TN_WATERMARK_KEY }, create: { key: TN_WATERMARK_KEY, value }, update: { value } })
}

/** 水位下界：15 分钟前（含）最新的一条记录；没有那么旧的记录时用最旧的一条 */
export function lowerBound(marks: Mark[], now: number): number {
  let best: Mark | null = null
  for (const m of marks) if (m.t <= now - LOOKBACK_MS && (!best || m.t > best.t)) best = m
  if (best) return best.id
  return marks.length ? Math.min(...marks.map((m) => m.id)) : 0
}

/** 修剪：保留 30 分钟内的记录，外加一条更早的（作为下界） */
export function pruneMarks(marks: Mark[], now: number): Mark[] {
  const sorted = [...marks].sort((a, b) => a.t - b.t)
  const recent = sorted.filter((m) => m.t > now - KEEP_MS)
  const older = sorted.filter((m) => m.t <= now - KEEP_MS)
  return older.length ? [older[older.length - 1], ...recent] : recent
}

interface NoticeRow {
  id: number
  tenantId: number
  kind: string
  title: string
  body: string | null
  refType: string | null
  refKey: string | null
  dedupeKey: string | null
}

const REF_LABEL: Record<string, string> = {
  order: '订单号',
  customer: '客户编号',
  statement: '结算单号',
  after_sale: '售后单号',
  listing: '商品编号',
}

/** 一条通知 → 事件字段。BUYER_MESSAGE 补上留言摘要与快速回复链接（站长 Q10） */
async function toEvent(n: NoticeRow) {
  const kind = n.kind as TenantNoticeKind
  const def = TENANT_NOTICE_DEFS[kind]
  if (!def) return null
  const lines: BotLine[] = []
  if (n.refType && n.refKey && REF_LABEL[n.refType]) lines.push({ label: REF_LABEL[n.refType], value: oneLine(n.refKey, 40) })
  if (n.body) lines.push({ label: '详情', value: sanitizeSystemValue(n.body, { dropEmail: true, max: 300 }) })

  const sf = await storefrontById(n.tenantId).catch(() => null)
  const origin = sf?.origin || ''
  let link: string | null = null
  let linkText: string | null = null
  if (n.refType === 'order' && n.refKey && origin) {
    link = `${origin}/partner/orders/${encodeURIComponent(n.refKey)}`
    linkText = '渠道后台查看'
  } else if (origin) {
    link = `${origin}/partner/notices`
    linkText = '渠道后台查看'
  }

  if (kind === 'BUYER_MESSAGE' && n.dedupeKey?.startsWith('msg:')) {
    const msgId = Number(n.dedupeKey.slice(4))
    if (Number.isInteger(msgId) && msgId > 0) {
      const msg = await prisma.orderMessage
        .findUnique({ where: { id: msgId }, select: { content: true, orderId: true, sender: true } })
        .catch(() => null)
      if (msg && msg.sender === 'BUYER') {
        lines.push({ label: '买家写', value: sanitizeUserText(msg.content, { dropEmail: true, max: 100 }) })
        const reply = await tenantReplyLink(msg.orderId, n.tenantId).catch(() => null)
        if (reply) {
          link = reply
          linkText = '快速回复'
        }
      }
    }
  }

  return {
    source: 'tenant_notice',
    type: `tn.${kind}`,
    category: def.category,
    tenantId: n.tenantId,
    siteCode: null,
    urgent: !!def.urgent,
    title: `${def.emoji} ${oneLine(n.title, 100)}`,
    lines: lines as unknown as object,
    link,
    linkText,
    refType: n.refType,
    refKey: n.refKey ? n.refKey.slice(0, 64) : null,
    dedupeKey: `tn:${n.id}`,
  }
}

/** 扫一次；返回新记下的事件数 */
export async function scanTenantNotices(now: Date = new Date()): Promise<number> {
  const nowMs = now.getTime()
  const marks = await readMarks()
  if (marks === null || marks.length === 0) {
    // 第一次：只记水位，不补发历史
    const agg = await prisma.tenantNotice.aggregate({ _max: { id: true } })
    await writeMarks([{ t: nowMs, id: agg._max.id ?? 0 }])
    return 0
  }
  let cursor = lowerBound(marks, nowMs)
  let maxSeen = Math.max(...marks.map((m) => m.id))
  let inserted = 0
  for (let page = 0; page < MAX_PAGES; page++) {
    const rows: NoticeRow[] = await prisma.tenantNotice.findMany({
      where: { id: { gt: cursor } },
      orderBy: { id: 'asc' },
      take: PAGE,
      select: { id: true, tenantId: true, kind: true, title: true, body: true, refType: true, refKey: true, dedupeKey: true },
    })
    if (!rows.length) break
    // 回看窗口里大部分是上一趟已记下的：先按 tn:<id> 查掉，省得逐条再查店面、留言、签链接
    const done = new Set(
      (
        await prisma.botEvent.findMany({
          where: { dedupeKey: { in: rows.map((r) => `tn:${r.id}`) } },
          select: { dedupeKey: true },
        })
      ).map((e) => e.dedupeKey)
    )
    const data = []
    for (const r of rows) {
      if (r.id > maxSeen) maxSeen = r.id
      if (done.has(`tn:${r.id}`)) continue
      if (r.tenantId === 1) continue
      if (r.dedupeKey && SKIP_DEDUPE_PREFIXES.some((p) => r.dedupeKey!.startsWith(p))) continue
      const ev = await toEvent(r).catch((e) => {
        console.error('[bot] 渠道通知转事件失败', r.id, (e as Error)?.message)
        return null
      })
      if (ev) data.push(ev)
    }
    if (data.length) {
      const res = await prisma.botEvent.createMany({ data, skipDuplicates: true })
      inserted += res.count
    }
    cursor = rows[rows.length - 1].id
    if (rows.length < PAGE) break
  }
  await writeMarks(pruneMarks([...marks, { t: nowMs, id: maxSeen }], nowMs))
  return inserted
}
