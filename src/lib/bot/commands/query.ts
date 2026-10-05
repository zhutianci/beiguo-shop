/**
 * 查询类指令（T1，docs/微信机器人-设计.md §7.2、§7.3、§7.5，附录 B 第 2、3、15 条）：
 * 分站、订单、查卡、待办、货号、库存、利润、结算、未匹配、提卡记录。
 *
 * 【范围由会话决定】（§7.2）管理群 / 私聊 = 主站与全部分站；分站群里只有「订单 <完整订单号>」，且只查本站单。
 *  scopeOf：分站群却没有绑定分站（数据坏了）→ 拒绝，绝不退化成全站范围。业务数据一律经 src/lib/bot/data/** 取（边界检查 B4），
 *  每次调用都把范围显式传进去；只给管理群的取数函数收到分站范围会直接抛错（第二道）。
 * 【分站群里永不出现】买家邮箱（整条回复再过一遍 dropEmails）、平台后台链接（只给渠道后台 <分站 origin>/partner/orders/<订单号>）、
 *  卡密、成本与利润（附录 B 第 3 条）。
 * 【卡密】只有「查卡」碰卡：解密与打码在 data/cards.ts 里做完，这里拿到的已经是首尾各最多 4 位的串；任何回复都不出现兑换链接（cdk=）。
 *  bot_commands.result_summary 只写条数，不写卡、邮箱（附录 B 第 15 条）。
 * 【回复】首行「图标 指令名｜…」写明是哪条指令的结果（§7.5）；每条 ≤ 900 字（render.ts 的 fitLines，放不下时先换更简略的写法）；
 *  金额一律从「分」经 money.ts 的 fromCents 再 yuan；时间 bjMinute（北京时间）；参数个数或格式不对回用法、不猜（§7.4）。
 * 解析与拼文本都是纯函数（导出给 scripts/check-bot-query.ts 自测），取数只在 run 里。
 */
import { complaintReasonText } from '../../jiema/complaint-rules'
import { addBjDays, bjDateKey, bjDateToStart, bjDayStart } from '../../marketing/time'
import { fromCents } from '../../money'
import { normalizeBotCode } from '../../product-status'
import { linkOrigin } from '../config'
import { dropEmails, maskEmails, oneLine, sanitizeUserText, truncate } from '../mask'
import { stripBrackets } from '../resolve-site'
import { bjMinute, fitLines, MAX_MESSAGE_CHARS, yuan } from '../render'
import { orderCardsView, type OrderCards } from '../data/cards'
import { cardIssuesIn, type IssueList } from '../data/issues'
import { lookupOrders, SUFFIX_LOOKBACK_DAYS, type OrderBrief, type OrderLookupResult, type OrderQuery } from '../data/orders'
import { findProductByCode, listIssuableProducts, stockDetail, stockOverview, type IssuableProduct, type ProductRef, type StockDetail, type StockRow } from '../data/products'
import { profitByProduct, type ProfitResult } from '../data/profit'
import { PLATFORM_TENANT_ID, type BotScope, type TimeWindow } from '../data/scope'
import { settlementOverview, siteMoney, STATEMENT_STATE_LABEL, type SettleRow, type SiteMoney } from '../data/settle'
import {
  boundGroups,
  channelOriginFor,
  findSiteForQuery,
  listChannelSites,
  siteDayStats,
  siteDomains,
  siteLabel,
  siteNames,
  type BoundGroup,
  type SiteDayStats,
  type SiteDomains,
  type SiteInfo,
} from '../data/sites'
import { todoSnapshot, type TodoSnapshot } from '../data/todo'
import { openUnmatched, type UnmatchedList } from '../data/unmatched'
import { toHalfWidth } from './parse'
import type { BotCommandDef, BotContext, BotReply, ParseResult } from './types'

// ---------------------------------------------------------------------------------------------
// 通用小工具
// ---------------------------------------------------------------------------------------------

type Help = { summary: string; usage: string; example?: string }

/** 参数不对时的回复：与「帮助 <指令>」同一种写法 */
export function usageOf(h: Help): string {
  return `用法：@贝果助手 ${h.usage}${h.example ? `\n例：@贝果助手 ${h.example}` : ''}`
}

/** 分 → ¥1,234.00；null → — */
export function cny(cents: number | null | undefined): string {
  return cents == null ? '—' : yuan(fromCents(cents))
}

/** 北京时间 MM-DD */
function mmdd(d: Date): string {
  return bjDateKey(d).slice(5)
}

/** 北京时间 HH:mm */
function hhmm(d: Date): string {
  return bjMinute(d).slice(6)
}

/** 系统字段（商品名、批次名……）压成一行并截断 */
function short(s: string | null | undefined, max: number): string {
  return oneLine(s ?? '', max)
}

/**
 * 别人写的字（买家备注、群名、通知来源）：先在整段上做脱敏与网址中性化，再截断。
 * 不能直接 sanitizeUserText(s, { max })：它先截断再中性化，截断点落在网址中间时残留的「https://xxx…」认不出来、不会被中性化。
 */
function othersText(s: string | null | undefined, max: number): string {
  return truncate(sanitizeUserText(s ?? '', { max: 500 }), max)
}

/** 群名是群成员能改的：按别人写的字处理 */
function groupName(s: string | null): string {
  return s ? othersText(s, 16) || '未命名群' : '未命名群'
}

function siteTag(code: string | null | undefined): string {
  return code ? `［${code}］` : ''
}

const PAY_LABEL: Readonly<Record<string, string>> = { UNPAID: '待支付', PAID: '已支付', REFUNDED: '已退款' }
const DELIVERY_LABEL: Readonly<Record<string, string>> = { PENDING: '待处理', PROCESSING: '处理中', DELIVERED: '已完成', CANCELLED: '已取消' }
const CARD_STATUS_LABEL: Readonly<Record<string, string>> = { UNUSED: '未使用', USED: '已发出', DISABLED: '已停用' }
const REDEEM_ACTION_LABEL: Readonly<Record<string, string>> = { CHECK: '查询', ACTIVATE: '兑换', REBIND: '换绑' }
const REDEEM_STATE_LABEL: Readonly<Record<string, string>> = {
  READY: '可提交',
  PROCESSING: '处理中',
  COMPLETED: '已完成',
  COOLDOWN: '冷却中',
  OUT_OF_STOCK: '上游缺货',
  VOID: '已作废',
  NOT_FOUND: '上游查无此卡',
  ERROR: '异常',
}
/** 与后台「售后申请」同一组文字（src/components/admin/after-sale-panel.tsx AFTER_SALE_KIND） */
const AFTER_SALE_KIND_LABEL: Readonly<Record<string, string>> = { REFUND: '退款', REISSUE: '补发', ESCALATE: '升级给站长', BAN_REQUEST: '申请全局封禁' }
const CONV_STATUS_LABEL: Readonly<Record<string, string>> = { ACTIVE: '推送中', PAUSED: '已暂停', UNREACHABLE: '发不出去' }
/** 旧单品接码（sms_activations.status）停在哪：这几种都要客服处理（多半是退款） */
const LEGACY_SMS_LABEL: Readonly<Record<string, string>> = { TIMEOUT: '超时没收到码', CANCELLED: '被取消', FAILED: '取号失败' }

function statusText(pay: string, delivery: string): string {
  return `${PAY_LABEL[pay] ?? pay} · ${DELIVERY_LABEL[delivery] ?? delivery}`
}

/** 几种写法从详到略，取第一个整条装得下 900 字的；都装不下就用最略的一种按行截断（fitLines 注明「其余见后台」） */
export function fitBest(variants: string[][], tail: string | null): string {
  for (let i = 0; i < variants.length; i++) {
    const all = tail ? variants[i].concat([tail]) : variants[i]
    const fits = Array.from(all.join('\n')).length <= MAX_MESSAGE_CHARS && all.every((l) => Array.from(l).length <= 300)
    if (fits) return fitLines(variants[i], tail)
  }
  return fitLines(variants[variants.length - 1], tail)
}

/**
 * 本次指令的数据范围（§7.2）：分站群 = 本站（必须是合法的分站 id，否则 null = 拒绝）；管理群 / 私聊 = 全部（null 范围）。
 * 其余（未登记的群）一律 null。
 */
export function scopeOf(ctx: Pick<BotContext, 'conv' | 'scopeTenantId'>): BotScope | null {
  if (ctx.conv.kind === 'TENANT') {
    const t = ctx.scopeTenantId
    return t != null && Number.isInteger(t) && t > PLATFORM_TENANT_ID ? { tenantId: t } : null
  }
  if (ctx.conv.kind === 'MGMT' || ctx.conv.kind === 'DM') return ctx.scopeTenantId === null ? { tenantId: null } : null
  return null
}

const SCOPE_ERROR = '本群的数据范围不对（分站群没有绑定分站？），请在管理群发「@贝果助手 群列表」检查'

/** 只给管理群 / 私聊的指令：拿全站范围；拿不到返回拒绝的回复 */
function platformScope(ctx: BotContext, head: string): BotScope | BotReply {
  const s = scopeOf(ctx)
  if (!s || s.tenantId !== null) return { text: `${head}｜该指令只能在主站管理群使用`, summary: 'scope' }
  return s
}

function isReply(x: BotScope | BotReply): x is BotReply {
  return (x as BotReply).text !== undefined
}

// ---------------------------------------------------------------------------------------------
// 参数解析（纯函数）
// ---------------------------------------------------------------------------------------------

/** 一个参数的规范写法：全角转半角、去掉照抄用法带进来的括号（<…>、[…]、(…)，§7.4）、去首尾空白 */
function bare(s: string | undefined): string {
  return stripBrackets(toHalfWidth(String(s ?? ''))).trim()
}

/**
 * 「订单」的参数：含 @ → 邮箱；恰好 6 位字母数字 → 订单号后 6 位；北京日期 8 位数字 + 1–8 位字母数字 → 完整订单号
 * （generateOrderNo 的形状）。其余返回 null（回用法，不猜）。字母一律转大写（订单号存的就是大写）。
 */
export function classifyOrderArg(raw: string): OrderQuery | null {
  const s = bare(raw)
  if (!s || s.length > 200) return null
  if (s.includes('@')) return /^[^\s@]{1,64}@[^\s@]+\.[A-Za-z]{2,}$/.test(s) ? { kind: 'email', email: s } : null
  const u = s.toUpperCase()
  if (/^[0-9A-Z]{6}$/.test(u)) return { kind: 'suffix', suffix: u }
  if (/^\d{8}[0-9A-Z]{1,8}$/.test(u)) return { kind: 'no', orderNo: u }
  return null
}

export type PeriodKey = 'today' | 'yesterday' | 'week' | 'month'

const PERIOD_WORDS: ReadonlyMap<string, PeriodKey> = new Map<string, PeriodKey>([
  ['今日', 'today'],
  ['今天', 'today'],
  ['昨日', 'yesterday'],
  ['昨天', 'yesterday'],
  ['本周', 'week'],
  ['本月', 'month'],
])

/**
 * 统计窗口（北京时间，与进程时区无关）：今日 = 今天 0 点到现在；昨日 = 昨天整天；本周 = 本周一 0 点到现在；本月 = 本月 1 日 0 点到现在。
 */
export function periodWindow(key: PeriodKey, now: Date): TimeWindow & { label: string } {
  const today = bjDateKey(now)
  if (key === 'yesterday') {
    const y = addBjDays(today, -1)
    return { from: bjDateToStart(y), to: bjDateToStart(today), label: `昨日（${y.slice(5)}）` }
  }
  if (key === 'week') {
    // 北京时间的星期几：0 = 周日。周一为一周的第一天
    const dow = new Date(bjDayStart(now).getTime() + 8 * 3600_000).getUTCDay()
    const monday = addBjDays(today, -((dow + 6) % 7))
    return { from: bjDateToStart(monday), to: now, label: `本周（${monday.slice(5)} 起）` }
  }
  if (key === 'month') {
    const first = `${today.slice(0, 8)}01`
    return { from: bjDateToStart(first), to: now, label: `本月（${first.slice(5)} 起）` }
  }
  return { from: bjDayStart(now), to: now, label: `今日（${today.slice(5)}）` }
}

/** 「利润」的参数：[货号] [今日/昨日/本周/本月]，两项顺序不限、各最多一个；缺省今日。不认识的写法返回 null */
export function parseProfitArgs(args: string[]): { code: string | null; period: PeriodKey } | null {
  if (args.length > 2) return null
  let code: string | null = null
  let period: PeriodKey | null = null
  for (let i = 0; i < args.length; i++) {
    const a = bare(args[i])
    const p = PERIOD_WORDS.get(a)
    if (p) {
      if (period) return null
      period = p
      continue
    }
    const c = normalizeBotCode(a)
    if (!c || code) return null
    code = c
  }
  return { code, period: period ?? 'today' }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** 年月日 → YYYY-MM-DD；不是真实存在的日期返回 null */
function dateKeyOf(y: number, m: number, d: number): string | null {
  if (!Number.isInteger(y) || y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null
  const t = new Date(Date.UTC(y, m - 1, d))
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null
  return `${y}-${pad2(m)}-${pad2(d)}`
}

/**
 * 「提卡记录」的日期 → 北京日期 YYYY-MM-DD。缺省今天；认「10-05」「2026-10-05」（也认 / 与 . 分隔）与「今天 / 昨天」。
 * 只写月日时取今年；那一天比今天还晚就是去年（1 月初查「12-30」）。格式不对或日期不存在返回 null。
 */
export function parseDateArg(arg: string | undefined, now: Date): string | null {
  const today = bjDateKey(now)
  if (arg === undefined) return today
  const s = bare(arg)
  if (s === '今天' || s === '今日') return today
  if (s === '昨天' || s === '昨日') return addBjDays(today, -1)
  const full = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)
  if (full) return dateKeyOf(Number(full[1]), Number(full[2]), Number(full[3]))
  const md = s.match(/^(\d{1,2})[-/.](\d{1,2})$/)
  if (!md) return null
  const year = Number(today.slice(0, 4))
  const key = dateKeyOf(year, Number(md[1]), Number(md[2]))
  if (key && key > today) return dateKeyOf(year - 1, Number(md[1]), Number(md[2]))
  return key
}

// ---------------------------------------------------------------------------------------------
// 拼文本（纯函数）
// ---------------------------------------------------------------------------------------------

export interface OrderRenderOpts {
  /** true = 管理群范围：显示站点、货号、打码邮箱、备注、未读数、平台后台链接；false = 分站群：这些一律不显示，只给渠道后台链接 */
  platform: boolean
  /** 平台后台链接的域名（linkOrigin(cfg)） */
  adminOrigin: string
  /** 分站群：本站的 origin（storefrontById）；取不到为 null（就不带链接） */
  channelOrigin: string | null
  /** 管理群范围：渠道单的站名与代码 */
  sites: Map<number, { code: string; name: string }>
}

function adminOrderLink(adminOrigin: string, id: number): string {
  return `${adminOrigin}/admin/orders?orderId=${id}`
}

function orderDetail(o: OrderBrief, opt: OrderRenderOpts): { lines: string[]; tail: string | null } {
  const lines: string[] = []
  if (opt.platform) {
    const s = opt.sites.get(o.tenantId)
    lines.push(`站点：${o.tenantId === PLATFORM_TENANT_ID ? '主站' : s ? siteLabel(s) : `分站 #${o.tenantId}`}`)
  }
  lines.push(`商品：${short(o.productName, 40)} ×${o.quantity}${opt.platform && o.botCode ? `（货号 ${o.botCode}）` : ''}`)
  lines.push(`金额：${cny(o.amountCents)}${o.invoiceTaxCents ? `（另付发票税费 ${cny(o.invoiceTaxCents)}）` : ''}`)
  const cards = o.deliveryType === 'AUTO' && o.payStatus !== 'UNPAID' ? ` · 卡密已发 ${o.cardsSent}/${o.quantity} 张` : ''
  lines.push(`状态：${statusText(o.payStatus, o.deliveryStatus)}${cards}`)
  if (opt.platform && o.userEmail) lines.push(`买家：${maskEmails(short(o.userEmail, 120))}`)
  const times = [`下单 ${bjMinute(o.createdAt)}`]
  if (o.paidAt) times.push(`付款 ${bjMinute(o.paidAt)}`)
  if (o.deliveredAt) times.push(`交付 ${bjMinute(o.deliveredAt)}`)
  lines.push(`时间：${times.join(' · ')}`)
  if (opt.platform) {
    if (o.unreadForAdmin > 0) lines.push(`留言：买家未读 ${o.unreadForAdmin} 条`)
    // 备注 = 买家原话 + 系统追加（「待人工补发」「【待退款】」…）：按别人写的字脱敏
    const remark = othersText(o.remark, 80)
    if (remark) lines.push(`备注：${remark}`)
    if (o.cardsSent > 0) lines.push(`看卡：@贝果助手 查卡 ${o.orderNo}`)
  }
  const tail = opt.platform
    ? `后台：${adminOrderLink(opt.adminOrigin, o.id)}`
    : opt.channelOrigin
      ? `渠道后台：${opt.channelOrigin}/partner/orders/${encodeURIComponent(o.orderNo)}`
      : null
  return { lines, tail }
}

function orderListLine(o: OrderBrief, opt: OrderRenderOpts): string {
  const site = opt.platform && o.tenantId !== PLATFORM_TENANT_ID ? siteTag(opt.sites.get(o.tenantId)?.code ?? `#${o.tenantId}`) : ''
  return `· ${o.orderNo} ${short(o.productName, 16)} ×${o.quantity} ${cny(o.amountCents)} ${PAY_LABEL[o.payStatus] ?? o.payStatus}·${DELIVERY_LABEL[o.deliveryStatus] ?? o.deliveryStatus} ${bjMinute(o.createdAt)}${site}`
}

/** 「订单」的回复：一条结果给摘要，多条给列表（最多 5 条，管理群每条带后台链接）；分站群整条再去一遍邮箱 */
export function renderOrderReply(res: OrderLookupResult, q: OrderQuery, opt: OrderRenderOpts): string {
  let text: string
  if (!res.list.length) {
    let msg: string
    if (q.kind === 'no') msg = opt.platform ? `没有找到订单 ${q.orderNo}` : `本站没有订单 ${q.orderNo}`
    else if (q.kind === 'email') msg = res.userFound === false ? `没有用 ${maskEmails(q.email)} 注册的用户` : `${maskEmails(q.email)} 还没有下过单`
    else msg = `最近 ${SUFFIX_LOOKBACK_DAYS} 天没有订单号以 ${q.suffix} 结尾的订单`
    text = `🔎 订单｜${msg}`
  } else if (res.total === 1) {
    const d = orderDetail(res.list[0], opt)
    text = fitLines([`🔎 订单｜${res.list[0].orderNo}`].concat(d.lines), d.tail)
  } else {
    const what = q.kind === 'email' ? `邮箱 ${maskEmails(q.email)}` : q.kind === 'suffix' ? `尾号 ${q.suffix}` : q.orderNo
    const lines = [`🔎 订单｜${what}：共 ${res.total} 单${res.total > res.list.length ? `，列最近 ${res.list.length} 单` : ''}`]
    res.list.forEach((o) => {
      lines.push(orderListLine(o, opt))
      if (opt.platform) lines.push(`  后台：${adminOrderLink(opt.adminOrigin, o.id)}`)
    })
    text = fitLines(lines, null)
  }
  return opt.platform ? text : dropEmails(text)
}

/** 「查卡」的回复。卡已经在数据层打过码；兑换记录先给最近 3 条带提示语，装不下就逐级减少 */
export function renderCardsReply(v: OrderCards | null, orderNo: string, opt: { adminOrigin: string; site: { code: string; name: string } | null }): string {
  if (!v) return `🎫 查卡｜没有找到订单 ${orderNo}`
  const o = v.order
  const head = `🎫 查卡｜${o.orderNo}`
  const info = `商品：${short(o.productName, 30)} ×${o.quantity} · ${statusText(o.payStatus, o.deliveryStatus)}${o.tenantId !== PLATFORM_TENANT_ID ? siteTag(opt.site?.code ?? `#${o.tenantId}`) : ''}`
  const tail = `后台：${adminOrderLink(opt.adminOrigin, o.id)}`
  if (!v.cards.length) return fitLines([head, info, o.deliveryType === 'AUTO' ? '这一单还没有发出卡密' : '这一单没有卡密（不是自动发货商品）'], tail)
  const variant = (logs: number, withMsg: boolean): string[] => {
    const lines = [head, info]
    v.cards.forEach((c, i) => {
      const parts = [`卡 ${i + 1}：${c.masked}`, `${CARD_STATUS_LABEL[c.status] ?? c.status}${c.usedAt ? ` ${bjMinute(c.usedAt)}` : ''}`]
      if (c.batch) parts.push(`批次 ${short(c.batch, 40)}`)
      lines.push(parts.join('｜'))
      if (c.redeemTotal === 0) {
        lines.push('  没有兑换记录')
        return
      }
      const shown = c.redeem.slice(0, logs)
      if (!shown.length) {
        lines.push(`  兑换记录 ${c.redeemTotal} 条`)
        return
      }
      shown.forEach((r) => {
        const msg = withMsg && r.message ? `：${r.message}` : ''
        lines.push(`  · ${bjMinute(r.at)} ${REDEEM_ACTION_LABEL[r.action] ?? r.action} ${REDEEM_STATE_LABEL[r.state] ?? r.state}（${short(r.provider, 12)}）${msg}`)
      })
      if (c.redeemTotal > shown.length) lines.push(`  · 另有 ${c.redeemTotal - shown.length} 条`)
    })
    if (v.totalCards > v.cards.length) lines.push(`（共 ${v.totalCards} 张，只列前 ${v.cards.length} 张）`)
    return lines
  }
  return fitBest([variant(3, true), variant(1, false), variant(0, false)], tail)
}

/** 「待办」的一种写法：每类最多列 per 条 */
function todoLines(s: TodoSnapshot, per: number): string[] {
  const t = { manual: s.manual.total, invoice: s.invoice.total, message: s.message.total, refund: s.refund.total, afterSale: s.afterSale.total }
  const lines = [`📝 待办｜待人工发货 ${t.manual} · 待开票 ${t.invoice} · 未读留言 ${t.message} · 待退款 ${t.refund} · 售后申请 ${t.afterSale}`]
  if (!t.manual && !t.invoice && !t.message && !t.refund && !t.afterSale) {
    lines.push('都处理完了')
    return lines
  }
  const more = (total: number, shown: number) => {
    if (total > shown) lines.push(`· 另有 ${total - shown} 条`)
  }
  if (t.manual) {
    lines.push(`【待人工发货 ${t.manual}】`)
    const items = s.manual.items.slice(0, per)
    items.forEach((i) => lines.push(`· ${i.orderNo} ${short(i.productName, 14)} ×${i.quantity} ${cny(i.amountCents)}${i.at ? ` 付款 ${bjMinute(i.at)}` : ''}${siteTag(i.siteCode)}`))
    more(t.manual, items.length)
  }
  if (t.invoice) {
    lines.push(`【待开票 ${t.invoice}】`)
    const items = s.invoice.items.slice(0, per)
    items.forEach((i) => lines.push(`· ${i.invoiceNo} ${cny(i.amountCents)}${i.at ? ` 付款 ${bjMinute(i.at)}` : ''}${siteTag(i.siteCode)}`))
    more(t.invoice, items.length)
  }
  if (t.message) {
    lines.push(`【未读留言 ${t.message}】`)
    const items = s.message.items.slice(0, per)
    items.forEach((i) =>
      lines.push(`· ${i.orderNo} ${short(i.productName, 12)}（${i.unread} 条${i.at ? ` ${bjMinute(i.at)}` : ''}）${siteTag(i.siteCode)}${i.preview ? ` 买家写：${i.preview}` : ''}`)
    )
    more(t.message, items.length)
  }
  if (t.refund) {
    lines.push(`【待退款 ${t.refund}】（接码售后 ${s.refund.complaints} · 旧单品接码 ${s.refund.legacySms}）`)
    const items = s.refund.items.slice(0, per)
    items.forEach((i) => {
      const what = i.kind === 'COMPLAINT' ? `接码售后：${complaintReasonText(i.reason)}` : `旧接码${LEGACY_SMS_LABEL[i.reason] ?? i.reason}`
      lines.push(`· ${i.orderNo ?? '—'} ${what} ${cny(i.amountCents)}${i.at ? ` ${bjMinute(i.at)}` : ''}${siteTag(i.siteCode)}`)
    })
    more(t.refund, items.length)
  }
  if (t.afterSale) {
    lines.push(`【售后申请 ${t.afterSale}】`)
    const items = s.afterSale.items.slice(0, per)
    items.forEach((i) =>
      lines.push(`· ${AFTER_SALE_KIND_LABEL[i.kind] ?? i.kind} ${i.requestNo}${i.orderNo ? ` 订单 ${i.orderNo}` : ''} ${bjMinute(i.at)}${siteTag(i.siteCode)}`)
    )
    more(t.afterSale, items.length)
  }
  return lines
}

/** 「待办」的回复：每类先列 5 条，装不下 900 字就 3 条、2 条、1 条 */
export function renderTodoReply(s: TodoSnapshot): string {
  return fitBest([todoLines(s, 5), todoLines(s, 3), todoLines(s, 2), todoLines(s, 1)], null)
}

/** 「货号」的回复：商品多时换成每行更短的写法 */
export function renderProductsReply(list: IssuableProduct[]): string {
  if (!list.length) return '🔖 货号｜还没有可提卡的商品：在后台商品编辑页给自动发货商品填「机器人货号」'
  const head = `🔖 货号｜可提卡商品 ${list.length} 个`
  const full = [head].concat(
    list.map((p) => {
      const cost = p.avgCostCents == null ? '均成本 —' : `均成本 ${cny(p.avgCostCents)}`
      const missing = p.costMissing > 0 && p.avgCostCents != null ? `（${p.costMissing} 张没录成本）` : ''
      return `· ${p.botCode} ${short(p.name, 20)}｜站价 ${cny(p.priceCents)}｜未用 ${p.unused} 张｜${cost}${missing}${p.status === 1 ? '' : '｜已下架'}`
    })
  )
  const compact = [head].concat(
    list.map((p) => `· ${p.botCode} ${short(p.name, 10)} ${cny(p.priceCents)} 未用${p.unused} 均${p.avgCostCents == null ? '—' : cny(p.avgCostCents)}${p.status === 1 ? '' : ' 下架'}`)
  )
  return fitBest([full, compact], '提卡：@贝果助手 提卡 <货号> <单价> [数量]')
}

/** 「库存」不带货号的回复：商品多时换成每行更短的写法 */
export function renderStockOverviewReply(rows: StockRow[]): string {
  if (!rows.length) return '📦 库存｜还没有自动发货商品'
  const head = `📦 库存｜自动发货商品 ${rows.length} 个`
  const full = [head].concat(
    rows.map((p) => `· ${p.botCode ?? '（无货号）'} ${short(p.name, 20)}：未用 ${p.unused} · 已用 ${p.used} · 停用 ${p.disabled}${p.status === 1 ? '' : '｜已下架'}`)
  )
  const compact = [head].concat(rows.map((p) => `· ${p.botCode ?? '—'} ${short(p.name, 10)} 未用${p.unused}/已用${p.used}/停用${p.disabled}${p.status === 1 ? '' : ' 下架'}`))
  return fitBest([full, compact], '看单个商品：@贝果助手 库存 <货号>')
}

/** 「库存 <货号>」的回复 */
export function renderStockDetailReply(p: ProductRef, d: StockDetail): string {
  const lines = [`📦 库存｜${short(p.name, 30)}${p.botCode ? `（${p.botCode}）` : ''}`]
  lines.push(`状态：${p.status === 1 ? '上架中' : '已下架'} · 站价 ${cny(p.priceCents)}`)
  lines.push(`卡池：未用 ${d.unused} 张 · 已用 ${d.used} 张 · 停用 ${d.disabled} 张`)
  if (d.unused > 0) {
    const shown = d.costBuckets.slice(0, 6).map((b) => `${b.costCents == null ? '没录成本' : cny(b.costCents)}×${b.count}`)
    const rest = d.costBuckets.length > 6 ? ` 等 ${d.costBuckets.length} 档` : ''
    lines.push(`未用卡成本：${shown.join(' · ')}${rest}${d.avgCostCents != null ? `（均价 ${cny(d.avgCostCents)}）` : ''}`)
  }
  if (d.lastImport) {
    const batch = d.lastImport.batch ? ` · 批次 ${short(d.lastImport.batch, 40)}${d.lastImport.batchCount != null ? `（这批 ${d.lastImport.batchCount} 张）` : ''}` : ''
    lines.push(`最近一次导入：${bjMinute(d.lastImport.at)}${batch}`)
  } else lines.push('最近一次导入：还没有导入过卡密')
  return fitLines(lines, null)
}

const PROFIT_NOTE = '口径：按付款时间，含之后退款的单；主站单 = 卡密利润 − 已结算返现，渠道单 = 站长利润；不含接码与充值'

/** 「利润」的回复：不带货号列成交额前 10 个商品 + 全部商品的合计；带货号给这一个商品的明细 */
export function renderProfitReply(r: ProfitResult, periodLabel: string, product: ProductRef | null): string {
  const truncated = r.channelTruncated ? '渠道单太多（超过 5000 单），这次没有计算渠道利润' : null
  if (product) {
    const head = `💹 利润｜${short(product.name, 30)}${product.botCode ? `（${product.botCode}）` : ''} · ${periodLabel}`
    const row = r.rows[0]
    if (!row) return fitLines([head, '这段时间还没有成交'], null)
    const lines = [head, `成交：${row.quantity} 件 / ${row.orders} 单 · ${cny(row.amountCents)}`]
    const split = row.mainProfitCents != null && row.channelProfitCents != null ? `（主站 ${cny(row.mainProfitCents)} · 渠道 ${cny(row.channelProfitCents)}）` : ''
    lines.push(`利润：${row.profitCents == null ? '—（没有卡密利润可算）' : cny(row.profitCents)}${split}`)
    if (row.unknownOrders > 0) lines.push(`另有 ${row.unknownOrders} 单利润未知（有卡没录成本或渠道单成本未登记）`)
    if (truncated) lines.push(truncated)
    lines.push(PROFIT_NOTE)
    return fitLines(lines, null)
  }
  const head = `💹 利润｜${periodLabel}`
  if (!r.rows.length) return fitLines([head, '这段时间还没有成交'], null)
  const total = { orders: 0, quantity: 0, amount: 0, profit: 0, unknown: 0 }
  r.rows.forEach((x) => {
    total.orders += x.orders
    total.quantity += x.quantity
    total.amount += x.amountCents
    total.profit += x.profitCents ?? 0
    total.unknown += x.unknownOrders
  })
  // 合计按全部商品，列表按成交额取前 top 个；装不下 900 字就少列几个、去掉口径说明
  const variant = (top: number, note: boolean): string[] => {
    const lines = [head]
    const shown = r.rows.slice(0, top)
    shown.forEach((x) => {
      lines.push(
        `· ${x.botCode ? `${x.botCode} ` : ''}${short(x.name, 18)}：${x.quantity} 件 / ${x.orders} 单 · ${cny(x.amountCents)} · 利润 ${cny(x.profitCents)}${x.unknownOrders ? `（${x.unknownOrders} 单未知）` : ''}`
      )
    })
    if (r.rows.length > shown.length) lines.push(`另有 ${r.rows.length - shown.length} 个商品没有列出（按成交额取前 ${shown.length}）`)
    lines.push(`合计：${total.quantity} 件 / ${total.orders} 单 · ${cny(total.amount)} · 利润 ${cny(total.profit)}${total.unknown ? `（另 ${total.unknown} 单利润未知）` : ''}`)
    if (truncated) lines.push(truncated)
    if (note) lines.push(PROFIT_NOTE)
    return lines
  }
  return fitBest([variant(10, true), variant(10, false), variant(5, false)], null)
}

function moneyLine(m: SiteMoney): string {
  return `可结算 ${cny(m.availableCents)}（预计打款 ${cny(m.payoutCents)}）· 冻结中 ${cny(m.pendingCents)}${m.negative ? '｜可结算为负' : ''}`
}

function openStatementLine(s: SiteMoney['open'][number]): string {
  return `待打款：${s.statementNo} ${STATEMENT_STATE_LABEL[s.state] ?? s.state} ${cny(s.netCents)}（${bjMinute(s.createdAt)} 生成${s.payingOverdue ? '，打款中已超过 24 小时' : ''}）`
}

/** 「结算」的回复 */
export function renderSettleReply(rows: SettleRow[], adminOrigin: string): string {
  if (!rows.length) return '💳 结算｜没有需要结算的渠道分站'
  const lines = [`💳 结算｜${rows.length} 个分站的余额与待打款`]
  const sum = { avail: 0, pending: 0, open: 0, openNet: 0 }
  rows.forEach(({ site, money }) => {
    sum.avail += money.availableCents
    sum.pending += money.pendingCents
    lines.push(`· ${siteLabel(site)}：${moneyLine(money)}${site.payoutHold ? '｜已暂停出结算单' : ''}`)
    money.open.forEach((s) => {
      sum.open += 1
      sum.openNet += s.netCents
      lines.push(`  ${openStatementLine(s)}`)
    })
  })
  lines.push(`合计：可结算 ${cny(sum.avail)} · 冻结中 ${cny(sum.pending)} · 待打款 ${sum.open} 张 ${cny(sum.openNet)}`)
  return fitLines(lines, `后台：${adminOrigin}/admin/tenants`)
}

/** 与后台「收款监控 → 待人工核实的到账」同一组说法的短版（src/app/admin/vmq/page.tsx unmatchedText） */
function unmatchedReasonText(reason: string, repeatForward: boolean): string {
  switch (reason) {
    case 'no_pending_match':
      return '没有对应的待支付单（付错金额 / 收款单过期后才付）'
    case 'closed_while_matching':
      return '对上的收款单恰好同时被关闭，没有自动履约'
    case 'maybe_duplicate':
      return repeatForward ? '与 1 分钟内的通知原文相同，多半是重复转发' : '10 分钟内同金额刚到过一笔，可能是买家付了两次'
    case 'ambiguous_match':
      return '同一金额命中多张待支付单，没有自动履约'
    case 'duplicate_payment':
      return '这一单此前已付款 / 已退款，疑似重复付款（要退款，别补单）'
    case 'ambiguous_amount':
      return '一条通知里有多个金额，没有自动取用'
    case 'untrusted_source':
      return '通知来源不是支付宝 App，没有自动取用'
    default:
      return short(reason, 30) || '原因未知'
  }
}

/** 「未匹配」的回复 */
export function renderUnmatchedReply(u: UnmatchedList, adminOrigin: string): string {
  const tail = `后台：${adminOrigin}/admin/vmq`
  if (!u.total) return fitLines(['💸 未匹配到账｜没有待核实的到账'], tail)
  const lines = [`💸 未匹配到账｜待核实 ${u.total} 笔，合计 ${cny(u.totalCents)}`]
  u.items.forEach((i) => {
    const from = i.reason === 'untrusted_source' && i.from ? `（来源 ${othersText(i.from, 30)}）` : ''
    lines.push(`· ${bjMinute(i.at)} ${cny(i.cents)}｜${unmatchedReasonText(i.reason, i.repeatForward)}${from}${i.outTradeNo ? `｜单号 ${short(i.outTradeNo, 40)}` : ''}`)
  })
  if (u.total > u.items.length) lines.push(`· 另有 ${u.total - u.items.length} 笔，见后台`)
  return fitLines(lines, tail)
}

/** 「提卡记录」的回复（不出卡密、不出核销链接） */
export function renderIssuesReply(list: IssueList, dateKey: string, now: Date, adminOrigin: string): string {
  const d = dateKey.slice(0, 4) === bjDateKey(now).slice(0, 4) ? dateKey.slice(5) : dateKey
  if (!list.total) return `🧾 提卡记录｜${d} 没有提卡`
  const s = list.sum
  const lines = [
    `🧾 提卡记录｜${d}：${list.total} 次 · ${s.quantity} 张 · ${cny(s.amountCents)} · 利润 ${cny(s.profitCents)}${s.costUnknown ? `（${s.costUnknown} 次成本未知）` : ''}`,
  ]
  list.list.forEach((r) => {
    lines.push(
      `· ${hhmm(r.at)} ${r.botCode ? `${r.botCode} ` : ''}${short(r.productName ?? '', 16)} ×${r.quantity} 单价 ${cny(r.unitPriceCents)} 金额 ${cny(r.amountCents)} 利润 ${cny(r.profitCents)}｜${short(r.adminName, 12)}｜${r.orderNo}`
    )
  })
  if (list.total > list.list.length) lines.push(`· 另有 ${list.total - list.list.length} 次，见后台`)
  return fitLines(lines, `后台：${adminOrigin}/admin/bot`)
}

function groupsText(gs: BoundGroup[] | undefined): string {
  if (!gs || !gs.length) return '未绑定'
  return gs.map((g) => `#${g.id} ${groupName(g.name)}${g.status !== 'ACTIVE' ? `（${CONV_STATUS_LABEL[g.status] ?? g.status}）` : ''}`).join('、')
}

const EMPTY_STATS: SiteDayStats = { created: 0, paid: 0, paidCents: 0 }

/** 「分站」不带参数的回复：各分站今日下单 / 成交 / 金额与绑定的群；已停业且没有绑群的不列。分站多时群只写编号 */
export function renderSiteListReply(sites: SiteInfo[], stats: Map<number, SiteDayStats>, groups: Map<number, BoundGroup[]>, dayLabel: string): string {
  if (!sites.length) return '🏪 分站｜还没有渠道分站'
  const shown = sites.filter((s) => s.status !== 'TERMINATED' || (groups.get(s.id)?.length ?? 0) > 0)
  const variant = (compact: boolean): string[] => {
    const lines = [`🏪 分站｜${shown.length} 个分站 · ${dayLabel}`]
    shown.forEach((s) => {
      const st = stats.get(s.id) ?? EMPTY_STATS
      const gs = groups.get(s.id) ?? []
      if (compact) {
        lines.push(`· ${siteLabel(s)} ${s.statusLabel}：下单 ${st.created} · 成交 ${st.paid} · ${cny(st.paidCents)}｜群 ${gs.length ? gs.map((g) => `#${g.id}`).join(' ') : '未绑定'}`)
        return
      }
      lines.push(`· ${siteLabel(s)} ${s.statusLabel}：下单 ${st.created} · 成交 ${st.paid} · ${cny(st.paidCents)}`)
      lines.push(`  群：${groupsText(gs)}`)
    })
    if (sites.length > shown.length) lines.push(`另有 ${sites.length - shown.length} 个已停业的分站没有列出`)
    return lines
  }
  return fitBest([variant(false), variant(true)], '看详情：@贝果助手 分站 <站名或代码>')
}

/** 「分站 <站名或代码>」的回复 */
export function renderSiteDetailReply(
  site: SiteInfo,
  d: SiteDomains,
  st: SiteDayStats | undefined,
  m: SiteMoney | undefined,
  gs: BoundGroup[] | undefined,
  dayLabel: string,
  adminOrigin: string
): string {
  const lines = [`🏪 分站｜${siteLabel(site)}`]
  lines.push(`状态：${site.statusLabel}${site.payoutHold ? '（已暂停出结算单与打款）' : ''}`)
  lines.push(`网址：${d.origin ?? '—'}`)
  const doms = d.domains.map((x) => `${x.host}${x.primary ? '（主）' : ''}${x.enabled ? '' : '（已停用）'}`)
  lines.push(`域名：${doms.length ? doms.join('、') : '—'}`)
  const s = st ?? EMPTY_STATS
  lines.push(`${dayLabel}：下单 ${s.created} · 成交 ${s.paid} · 成交额 ${cny(s.paidCents)}`)
  if (m) {
    lines.push(`余额：${moneyLine(m)}`)
    m.open.forEach((x) => lines.push(openStatementLine(x)))
  }
  lines.push(`群：${gs && gs.length ? groupsText(gs) : '未绑定（在代理群里 @贝果助手 创建 <分站域名>）'}`)
  return fitLines(lines, `后台：${adminOrigin}/admin/tenants/${site.id}`)
}

// ---------------------------------------------------------------------------------------------
// 指令
// ---------------------------------------------------------------------------------------------

const siteHelp: Help = { summary: '各分站今日下单、成交与绑定的群；带站名或代码看该分站详情', usage: '分站 [站名或代码]', example: '分站 mysticboy' }

export const siteCmd: BotCommandDef<{ q: string }> = {
  name: '分站',
  aliases: ['渠道'],
  scopes: ['MGMT', 'DM'],
  tier: 1,
  // 站名里可能有空格（「Tibo AI 商店」）：多个参数按空格拼回去
  parse: (args) => (args.length <= 6 ? { ok: true, value: { q: args.join(' ') } } : { ok: false, usage: usageOf(siteHelp) }),
  async run(ctx, a) {
    const sc = platformScope(ctx, '🏪 分站')
    if (isReply(sc)) return sc
    const w: TimeWindow = { from: bjDayStart(ctx.now), to: ctx.now }
    const dayLabel = `今日（${mmdd(ctx.now)}）`
    if (!a.q) {
      const sites = await listChannelSites(sc)
      const ids = sites.map((s) => s.id)
      const [stats, groups] = await Promise.all([siteDayStats(sc, w, ids), boundGroups(sc, ids)])
      return { text: renderSiteListReply(sites, stats, groups, dayLabel), summary: `分站 ${sites.length}` }
    }
    const f = await findSiteForQuery(sc, a.q)
    if (!f.ok) return { text: `🏪 分站｜${f.error}`, summary: 'not-found' }
    const id = f.site.id
    const [doms, stats, money, groups] = await Promise.all([siteDomains(sc, id), siteDayStats(sc, w, [id]), siteMoney(sc, [id], ctx.now), boundGroups(sc, [id])])
    return {
      text: renderSiteDetailReply(f.site, doms, stats.get(id), money.get(id), groups.get(id), dayLabel, linkOrigin(ctx.config)),
      summary: `分站 ${f.site.code}`,
    }
  },
  help: siteHelp,
}

const orderHelp: Help = { summary: '查订单摘要与后台链接（分站群只能按完整订单号查本站单）', usage: '订单 <订单号/邮箱/订单号后6位>', example: '订单 20261005K3F9Q2AB' }

export const orderCmd: BotCommandDef<{ q: OrderQuery }> = {
  name: '订单',
  aliases: ['查单'],
  scopes: ['MGMT', 'DM', 'TENANT'],
  tier: 1,
  parse: (args): ParseResult<{ q: OrderQuery }> => {
    const q = args.length === 1 ? classifyOrderArg(args[0]) : null
    return q ? { ok: true, value: { q } } : { ok: false, usage: usageOf(orderHelp) }
  },
  async run(ctx, a) {
    const sc = scopeOf(ctx)
    if (!sc) return { text: `🔎 订单｜${SCOPE_ERROR}`, summary: 'scope' }
    const platform = sc.tenantId === null
    if (!platform && a.q.kind !== 'no') {
      return { text: '🔎 订单｜分站群里只能按完整订单号查本站订单，例如：@贝果助手 订单 20261005K3F9Q2AB', summary: 'tenant-kind' }
    }
    const res = await lookupOrders(sc, a.q, ctx.now, 5)
    const sites = platform && res.list.length ? await siteNames(sc, res.list.map((o) => o.tenantId)) : new Map<number, { code: string; name: string }>()
    const channelOrigin = !platform && res.list.length ? await channelOriginFor(sc) : null
    const text = renderOrderReply(res, a.q, { platform, adminOrigin: linkOrigin(ctx.config), channelOrigin, sites })
    return { text, summary: `订单 ${res.list.length}/${res.total}` }
  },
  help: orderHelp,
}

const cardHelp: Help = { summary: '看一单的卡（只露首尾）、状态与兑换记录', usage: '查卡 <订单号>', example: '查卡 20261005K3F9Q2AB' }

export const cardCmd: BotCommandDef<{ orderNo: string }> = {
  name: '查卡',
  scopes: ['MGMT', 'DM'],
  tier: 1,
  parse: (args): ParseResult<{ orderNo: string }> => {
    const q = args.length === 1 ? classifyOrderArg(args[0]) : null
    return q && q.kind === 'no' ? { ok: true, value: { orderNo: q.orderNo } } : { ok: false, usage: usageOf(cardHelp) }
  },
  async run(ctx, a) {
    const sc = platformScope(ctx, '🎫 查卡')
    if (isReply(sc)) return sc
    const v = await orderCardsView(sc, a.orderNo, { maxCards: 10, redeemPerCard: 3 })
    const site = v && v.order.tenantId !== PLATFORM_TENANT_ID ? (await siteNames(sc, [v.order.tenantId])).get(v.order.tenantId) ?? null : null
    return { text: renderCardsReply(v, a.orderNo, { adminOrigin: linkOrigin(ctx.config), site }), summary: v ? `查卡 ${v.cards.length}/${v.totalCards} 张` : 'not-found' }
  },
  help: cardHelp,
}

const todoHelp: Help = { summary: '待人工发货、待开票、未读留言、待退款、售后申请：数量与前几条', usage: '待办' }

export const todoCmd: BotCommandDef<null> = {
  name: '待办',
  aliases: ['todo'],
  scopes: ['MGMT', 'DM'],
  tier: 1,
  parse: (args) => (args.length ? { ok: false, usage: usageOf(todoHelp) } : { ok: true, value: null }),
  async run(ctx) {
    const sc = platformScope(ctx, '📝 待办')
    if (isReply(sc)) return sc
    const s = await todoSnapshot(sc, 5)
    const n = s.manual.total + s.invoice.total + s.message.total + s.refund.total + s.afterSale.total
    return { text: renderTodoReply(s), summary: `待办 ${n}` }
  },
  help: todoHelp,
}

const productsHelp: Help = { summary: '可提卡商品：货号、站价、未用卡数与平均成本', usage: '货号' }

export const productsCmd: BotCommandDef<null> = {
  name: '货号',
  aliases: ['商品'],
  scopes: ['MGMT', 'DM'],
  tier: 1,
  parse: (args) => (args.length ? { ok: false, usage: usageOf(productsHelp) } : { ok: true, value: null }),
  async run(ctx) {
    const sc = platformScope(ctx, '🔖 货号')
    if (isReply(sc)) return sc
    const list = await listIssuableProducts(sc)
    return { text: renderProductsReply(list), summary: `货号 ${list.length}` }
  },
  help: productsHelp,
}

const stockHelp: Help = { summary: '卡池：未用 / 已用 / 停用、未用卡成本分布、最近一次导入', usage: '库存 [货号]', example: '库存 GPT1' }

export const stockCmd: BotCommandDef<{ code: string | null }> = {
  name: '库存',
  scopes: ['MGMT', 'DM'],
  tier: 1,
  parse: (args): ParseResult<{ code: string | null }> => {
    if (!args.length) return { ok: true, value: { code: null } }
    const code = args.length === 1 ? normalizeBotCode(bare(args[0])) : null
    return code ? { ok: true, value: { code } } : { ok: false, usage: usageOf(stockHelp) }
  },
  async run(ctx, a) {
    const sc = platformScope(ctx, '📦 库存')
    if (isReply(sc)) return sc
    if (!a.code) {
      const rows = await stockOverview(sc)
      return { text: renderStockOverviewReply(rows), summary: `库存 ${rows.length}` }
    }
    const p = await findProductByCode(sc, a.code)
    if (!p) return { text: `📦 库存｜没有货号为 ${a.code} 的商品（发送「@贝果助手 货号」查看）`, summary: 'not-found' }
    if (p.deliveryType !== 'AUTO') return { text: `📦 库存｜「${short(p.name, 30)}」不是自动发货商品，没有卡池`, summary: 'not-auto' }
    const d = await stockDetail(sc, p.id)
    return { text: renderStockDetailReply(p, d), summary: `库存 ${a.code}` }
  },
  help: stockHelp,
}

const profitHelp: Help = { summary: '按商品的成交件数、成交额与利润（默认今日）', usage: '利润 [货号] [今日/昨日/本周/本月]', example: '利润 GPT1 本周' }

export const profitCmd: BotCommandDef<{ code: string | null; period: PeriodKey }> = {
  name: '利润',
  scopes: ['MGMT', 'DM'],
  tier: 1,
  parse: (args): ParseResult<{ code: string | null; period: PeriodKey }> => {
    const p = parseProfitArgs(args)
    return p ? { ok: true, value: p } : { ok: false, usage: usageOf(profitHelp) }
  },
  async run(ctx, a) {
    const sc = platformScope(ctx, '💹 利润')
    if (isReply(sc)) return sc
    const w = periodWindow(a.period, ctx.now)
    let product: ProductRef | null = null
    if (a.code) {
      product = await findProductByCode(sc, a.code)
      if (!product) return { text: `💹 利润｜没有货号为 ${a.code} 的商品（发送「@贝果助手 货号」查看）`, summary: 'not-found' }
    }
    const r = await profitByProduct(sc, w, product ? product.id : null)
    return { text: renderProfitReply(r, w.label, product), summary: `利润 ${a.period} ${r.rows.length}` }
  },
  help: profitHelp,
}

const settleHelp: Help = { summary: '各分站可结算、冻结中与待打款的结算单', usage: '结算' }

export const settleCmd: BotCommandDef<null> = {
  name: '结算',
  scopes: ['MGMT', 'DM'],
  tier: 1,
  parse: (args) => (args.length ? { ok: false, usage: usageOf(settleHelp) } : { ok: true, value: null }),
  async run(ctx) {
    const sc = platformScope(ctx, '💳 结算')
    if (isReply(sc)) return sc
    const rows = await settlementOverview(sc, ctx.now)
    return { text: renderSettleReply(rows, linkOrigin(ctx.config)), summary: `结算 ${rows.length}` }
  },
  help: settleHelp,
}

const unmatchedHelp: Help = { summary: '收款监控里已到账、没对上订单的待核实记录', usage: '未匹配' }

export const unmatchedCmd: BotCommandDef<null> = {
  name: '未匹配',
  scopes: ['MGMT', 'DM'],
  tier: 1,
  parse: (args) => (args.length ? { ok: false, usage: usageOf(unmatchedHelp) } : { ok: true, value: null }),
  async run(ctx) {
    const sc = platformScope(ctx, '💸 未匹配到账')
    if (isReply(sc)) return sc
    const u = await openUnmatched(sc, 10)
    return { text: renderUnmatchedReply(u, linkOrigin(ctx.config)), summary: `未匹配 ${u.total}` }
  },
  help: unmatchedHelp,
}

const issuesHelp: Help = { summary: '某天的提卡记录（默认今天，北京时间）', usage: '提卡记录 [日期]', example: '提卡记录 10-05' }

export const issuesCmd: BotCommandDef<{ date: string | undefined }> = {
  name: '提卡记录',
  scopes: ['MGMT', 'DM'],
  tier: 1,
  // 只校验写法；「10-05」是哪一年要按指令执行时的北京时间算，放到 run 里
  parse: (args): ParseResult<{ date: string | undefined }> =>
    args.length <= 1 && parseDateArg(args[0], new Date()) ? { ok: true, value: { date: args[0] } } : { ok: false, usage: usageOf(issuesHelp) },
  async run(ctx, a) {
    const sc = platformScope(ctx, '🧾 提卡记录')
    if (isReply(sc)) return sc
    const key = parseDateArg(a.date, ctx.now)
    if (!key) return { text: usageOf(issuesHelp), summary: 'usage' }
    const w: TimeWindow = { from: bjDateToStart(key), to: bjDateToStart(addBjDays(key, 1)) }
    const list = await cardIssuesIn(sc, w, 30)
    return { text: renderIssuesReply(list, key, ctx.now, linkOrigin(ctx.config)), summary: `提卡记录 ${key} ${list.total}` }
  },
  help: issuesHelp,
}

/** 查询类指令；由 commands/index.ts 登记进注册表 */
export const QUERY_COMMANDS: readonly BotCommandDef<any>[] = [
  siteCmd,
  orderCmd,
  cardCmd,
  todoCmd,
  productsCmd,
  stockCmd,
  profitCmd,
  settleCmd,
  unmatchedCmd,
  issuesCmd,
]
