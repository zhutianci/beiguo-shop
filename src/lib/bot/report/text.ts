/**
 * 日报与日报类指令的文本渲染（docs/微信机器人-设计.md §6.1–6.4，格式照附录 A「主站日报」「分站日报」）。
 * 纯函数，不连库：输入 report/main.ts、report/tenant.ts 取好的指标对象，输出要发的文本。scripts/check-bot-report.ts 逐字比对。
 *
 * 【几条消息】
 *  - 零点日报（renderMainDaily / renderTenantDaily）：主站两条——「核心数据」「明细与待办」；分站一条。
 *    每条 ≤ 900 字（§5.4「超长按行切分（日报）」）：装不下就按行切成下一条，标题加「（续）」，不丢内容。
 *  - 指令回复（renderMainReply / renderTenantReply）：核心 + 明细合成一条，超长用 render.fitLines 截断（「……（其余见后台）」），
 *    补看历史时末尾那行说明（余额、待办是当前值；浏览数据只保留 90 天）永远保留。
 *
 * 【格式规则】
 *  - 一行里的几项用「 · 」隔开；上一项以全角括号「）」结尾时只用「· 」（附录 A 的写法：「（另 2 单利润未知）· 接码」）。
 *  - 金额全部按「分」整数传进来，显示 ¥1,234.00，负数 -¥12.00；件数、人数带千分位。
 *  - 百分比：分母为 0 显示「—」；≥ 10% 取整，< 10% 保留一位小数（6.4%）。
 *  - 值为 0 的可选项不显示：发票税费、仍未付款、退款、售后与调整、自动下架、【其它】里的各项（全为 0 时写「无」）。
 *  - 对比（较前日 / 较上周同日 / 较昨日同时段 / 较上周同期 / 较上月同期），每个指标一行：
 *      相等 → 「持平」；前值为 0、现值大于 0 → 「↑（前值为 0）」；
 *      其余 → 「↑N%」或「↓N%」，N = |现 − 前| ÷ 前 × 100 四舍五入取整，变化不足 1% 也记作 1%（不出现「↑0%」）。
 *    主站：成交额、成交单、访客（访客只在整日窗口比：今日 / 本周 / 本月的流量按整天的 day_key 存，没法截到同一时刻）；
 *    分站：成交额、成交单（§6.3）。
 *
 * 【分站群的文本】只用 TenantReport 里的字段——这个类型本身就没有站长成本、卡差价、站长利润、别的分站、买家邮箱（附录 B 第 3 条），
 * 发送器出队前还会再过一遍分站群黑名单扫描（mask.tenantBlacklistHit）。
 */
import { oneLine, truncate } from '../mask'
import { fitLines, MAX_MESSAGE_CHARS, yuan } from '../render'
import { cnDay, type ReportWindow } from './window'

// ───────────────────────── 指标对象（main.ts / tenant.ts 产出） ─────────────────────────

/** 流量（page_views / visitors，按站） */
export interface TrafficBlock {
  /** 浏览量：「人·页·小时」去重后的行数 */
  pv: number
  /** 访客：COUNT(DISTINCT viewer_key) */
  uv: number
  /** 新访客：visitors.first_seen 落在窗口内（不超过 uv） */
  newVisitors: number
  /** 来源构成（按浏览量降序） */
  sources: { source: string; pv: number }[]
  /** 手机端浏览量（手机占比 = mobilePv / pv） */
  mobilePv: number
}

/** 订单（按站；金额是分） */
export interface OrderBlock {
  /** 下单数：窗口内创建（含未付款；主站不含提卡单） */
  created: number
  /** 下单人数 */
  createdUsers: number
  /** 窗口内下单、已付款（含之后退款）的单数：支付转化的分子 */
  createdPaid: number
  /** 取消 / 过期：窗口内下单、UNPAID 且已取消 */
  cancelled: number
  /** 仍未付款：窗口内下单、到统计时仍 UNPAID 且没取消 */
  unpaid: number
  /** 退款：REFUNDED 且最后更新在窗口内（没有退款时间列，近似） */
  refunded: number
  /** 成交单数：窗口内付款（PAID / REFUNDED） */
  paid: number
  /** 成交人数（主站不含提卡账号） */
  paidUsers: number
  /** 成交额（不含税；渠道单 = 渠道售价） */
  amountCents: number
  /** 发票税费（只在主站显示） */
  taxCents: number
}

/** 一个对比窗口里的值（与当前值比） */
export interface CompareRow {
  label: string
  paid: number
  amountCents: number
  /** null = 这个窗口不比访客 */
  uv: number | null
}

/** 主站日报里「分站」块的一行（站长视角，只发管理群） */
export interface ChannelSummaryRow {
  /** 站名（getTenantBrand）；管理群里写「站名（代码）」 */
  name: string
  code: string
  created: number
  paid: number
  /** 成交额（渠道售价） */
  amountCents: number
  /** 站长所得货款 G（lib/admin/channel-profit.ts） */
  ownerGoodsCents: number
  /** 站长利润（只加算得出的单） */
  profitCents: number
  /** 利润算不出的单数（缺快照 / 成本未登记） */
  profitUnknown: number
  newCustomers: number
}

export interface MainReport {
  siteLabel: string
  window: ReportWindow
  /** 补看历史（指令里的昨日 / 日报 <日期>）：待办、库存、到期是当前值，回复里注明 */
  historical: boolean
  traffic: TrafficBlock
  users: { registered: number; total: number }
  orders: OrderBlock
  profit: {
    /** 卡密利润（已扣已结算的内推返现，同后台订单列表合计） */
    cardCents: number
    cardUnknownOrders: number
    /** 接码利润（定稿口径，预估） */
    jiemaCents: number
    /** 渠道带来的站长利润 */
    channelCents: number
    channelUnknownOrders: number
  }
  /** 热销前三：件数、金额 */
  top: { name: string; qty: number; amountCents: number }[]
  /** 待办快照；本周 / 本月不带（null） */
  todo: { processing: number; invoices: number; unreadOrders: number; afterSales: number } | null
  /** 库存告警（已按库存升序）；null = 不带 */
  lowStock: { name: string; stock: number }[] | null
  /** 未来 3 天到期的订阅；null = 不带 */
  expiring: { count: number; items: { date: string; account: string; type: string }[] } | null
  others: { topupCount: number; topupCents: number; jiemaOrders: number; couponsUsed: number; invoices: number; receipts: number; lotteryWins: number }
  /** 分站汇总；null = 还没有任何分站 */
  channels: { rows: ChannelSummaryRow[]; idle: number } | null
  compares: CompareRow[]
  /** 机器人运行情况；null = 不带（本周 / 本月） */
  robot: { sent: number; failed: number; offlineMinutes: number | null } | null
}

export interface TenantReport {
  /** 站名（分站群里只写站名） */
  siteName: string
  window: ReportWindow
  historical: boolean
  /** null = 本站还没有任何流量数据（埋点开关打开前） */
  traffic: TrafficBlock | null
  /** 本站流量数据的第一天（page_views 最早的 day_key）；窗口第一天不晚于它时注明「自 X 起统计」 */
  trafficSince: string | null
  /** 新注册客户（users.registered_tenant_id = 本站） */
  registered: number
  orders: OrderBlock
  /** 收益：窗口内付款的本站订单逐单结算视图之和（渠道后台首页同一套） */
  income: { goodsCents: number; purchaseCents: number; invShareCents: number; feeCents: number; otherCents: number; balanceCents: number; payoutCents: number }
  /** 余额快照；null = 读失败（不出错，只是不显示） */
  balances: { availableCents: number; availablePayoutCents: number; pendingCents: number } | null
  top: { name: string; qty: number }[]
  todo: { unreadMessages: number; afterSales: number; autoDelisted: number }
  compares: CompareRow[]
}

// ───────────────────────── 格式化 ─────────────────────────

/** 件数、人数：1,234 */
export function count(v: number): string {
  return Math.trunc(Number(v) || 0).toLocaleString('en-US')
}

/** 金额（分）：¥1,234.00；负数 -¥12.00 */
export function money(cents: number): string {
  const c = Math.round(Number(cents) || 0)
  return c < 0 ? `-${yuan(-c / 100)}` : yuan(c / 100)
}

/** 百分比：分母为 0 → —；≥ 10% 取整；< 10% 一位小数 */
export function pctText(part: number, whole: number): string {
  if (!whole) return '—'
  const permille = Math.round((part * 1000) / whole)
  if (Math.abs(permille) >= 100) return `${Math.round((part * 100) / whole)}%`
  return `${(permille / 10).toFixed(1).replace(/\.0$/, '')}%`
}

/** 对比：持平 / ↑（前值为 0）/ ↑N% / ↓N%（规则见文件头） */
export function trendText(cur: number, prev: number): string {
  if (cur === prev) return '持平'
  if (prev === 0) return cur > 0 ? '↑（前值为 0）' : '↓（前值为 0）'
  const p = Math.max(1, Math.round((Math.abs(cur - prev) * 100) / Math.abs(prev)))
  return `${cur > prev ? '↑' : '↓'}${p}%`
}

/** 一行里的几项：「 · 」分隔；上一项以「）」结尾时只用「· 」（附录 A 写法）。sep 也可以是「/」 */
export function joinItems(parts: string[], sep = '·'): string {
  let out = ''
  parts.forEach((p, i) => {
    if (i > 0) out += `${parts[i - 1].endsWith('）') ? '' : ' '}${sep} `
    out += p
  })
  return out
}

/** 来源分类 → 简称（分类见 lib/analytics/classify.ts；后台流量分析页的全称见 components/admin/traffic-analytics.tsx） */
const SOURCE_LABEL: Readonly<Record<string, string>> = {
  search: '搜索',
  ai: 'AI',
  email: '邮件',
  direct: '直接',
  social: '社交',
  referral: '外链',
  internal: '站内',
}

/** 商品名、站名等：单行、限长 */
const label = (s: string, max = 30) => oneLine(s, max)

const charLen = (s: string) => Array.from(s).length

/**
 * 指令回复交给 fitLines 的上限：fitLines 截断时追加的「……（其余见后台）」一行（9 字 + 换行）不计在它的预算里，
 * 先让出这 10 个字，保证回复整条 ≤ 900 字
 */
const REPLY_BUDGET = MAX_MESSAGE_CHARS - 10

/**
 * 按行装进多条消息（日报用）：一条装不下就开下一条，标题换成 contHead，不丢行。
 * 单行先截到 300 字（与 fitLines 一致），所以任何一条都不会超过 max。
 */
export function packMessages(head: string, lines: string[], contHead: string, max = MAX_MESSAGE_CHARS): string[] {
  const out: string[] = []
  let cur: string[] = [head]
  let len = charLen(head)
  for (const raw of lines) {
    const line = truncate(raw, 300)
    const add = charLen(line) + 1
    if (len + add > max && cur.length > 1) {
      out.push(cur.join('\n'))
      cur = [contHead]
      len = charLen(contHead)
    }
    cur.push(line)
    len += add
  }
  out.push(cur.join('\n'))
  return out
}

// ───────────────────────── 共用的块 ─────────────────────────

function trafficLines(t: TrafficBlock, extra: string[] = []): string[] {
  const parts = [`浏览 ${count(t.pv)}`, `访客 ${count(t.uv)}（新 ${count(t.newVisitors)}）`]
  if (t.pv > 0) parts.push(`手机 ${pctText(t.mobilePv, t.pv)}`)
  const out = [`【流量】${joinItems([...parts, ...extra])}`]
  if (t.pv > 0 && t.sources.length) {
    out.push(`来源：${joinItems(t.sources.slice(0, 3).map((s) => `${SOURCE_LABEL[s.source] ?? label(s.source, 12)} ${pctText(s.pv, t.pv)}`))}`)
  }
  return out
}

/** 客单价：成交额 ÷ 成交单数（分，四舍五入）；没有成交 → — */
function avgTicket(o: OrderBlock): string {
  return o.paid > 0 ? money(Math.round(o.amountCents / o.paid)) : '—'
}

/** 「取消/过期 · 仍未付款 · 退款」：后两项为 0 不显示 */
function closeItems(o: OrderBlock): string[] {
  const parts = [`取消/过期 ${count(o.cancelled)} 单`]
  if (o.unpaid > 0) parts.push(`仍未付款 ${count(o.unpaid)} 单`)
  if (o.refunded > 0) parts.push(`退款 ${count(o.refunded)} 单`)
  return parts
}

function compareLines(cur: { paid: number; amountCents: number; uv: number | null }, rows: CompareRow[]): string[] {
  if (!rows.length) return []
  const metric = (name: string, get: (x: { paid: number; amountCents: number; uv: number | null }) => number) =>
    `${name} ${joinItems(rows.map((r) => `${r.label} ${trendText(get(cur), get(r))}`))}`
  const out = [`【对比】${metric('成交额', (x) => x.amountCents)}`, metric('成交单', (x) => x.paid)]
  if (cur.uv !== null && rows.every((r) => r.uv !== null)) out.push(metric('访客', (x) => x.uv ?? 0))
  return out
}

// ───────────────────────── 主站（管理群 / 私聊） ─────────────────────────

function mainHead(r: MainReport): string {
  return `📊 ${r.siteLabel} · ${r.window.kind === 'day' ? `${r.window.title} 日报` : r.window.title}`
}

/** 第一条「核心数据」：流量、用户、订单、利润、对比 */
export function mainCoreLines(r: MainReport): string[] {
  const o = r.orders
  const out = [...trafficLines(r.traffic)]
  out.push(`【用户】新注册 ${count(r.users.registered)} 人（累计 ${count(r.users.total)}）`)
  const placed = [`下单 ${count(o.created)} 单 / ${count(o.createdUsers)} 人（含未付款）`]
  if (r.traffic.uv > 0) placed.push(`访客下单率 ${pctText(o.createdUsers, r.traffic.uv)}`)
  out.push(`【订单】${joinItems(placed)}`)
  out.push(joinItems([`成交 ${count(o.paid)} 单 / ${count(o.paidUsers)} 人`, `支付转化 ${pctText(o.createdPaid, o.created)}`]))
  const amount = [`成交额 ${money(o.amountCents)}`, `客单价 ${avgTicket(o)}`]
  if (o.taxCents > 0) amount.push(`发票税费 ${money(o.taxCents)}`)
  out.push(joinItems(amount))
  out.push(joinItems(closeItems(o)))
  const p = r.profit
  out.push(
    `【利润】${joinItems([
      `卡密 ${money(p.cardCents)}${p.cardUnknownOrders > 0 ? `（另 ${count(p.cardUnknownOrders)} 单利润未知）` : ''}`,
      `接码 ${money(p.jiemaCents)}（预估）`,
      `渠道带来 ${money(p.channelCents)}${p.channelUnknownOrders > 0 ? `（另 ${count(p.channelUnknownOrders)} 单未知）` : ''}`,
    ])}`
  )
  out.push(...compareLines({ paid: o.paid, amountCents: o.amountCents, uv: r.window.kind === 'day' ? r.traffic.uv : null }, r.compares))
  return out
}

function othersLine(x: MainReport['others']): string {
  const parts: string[] = []
  if (x.topupCount > 0) parts.push(`充值 ${count(x.topupCount)} 笔 ${money(x.topupCents)}`)
  if (x.jiemaOrders > 0) parts.push(`接码 ${count(x.jiemaOrders)} 单`)
  if (x.couponsUsed > 0) parts.push(`用券 ${count(x.couponsUsed)} 张`)
  if (x.invoices > 0) parts.push(`开票 ${count(x.invoices)} 张`)
  if (x.receipts > 0) parts.push(`收据 ${count(x.receipts)} 张`)
  if (x.lotteryWins > 0) parts.push(`中奖 ${count(x.lotteryWins)} 次`)
  return `【其它】${parts.length ? joinItems(parts) : '无'}`
}

function channelLine(c: ChannelSummaryRow): string {
  return `${label(c.name, 20)}（${c.code}）：${joinItems(
    [
      `下单 ${count(c.created)}`,
      `成交 ${count(c.paid)}`,
      money(c.amountCents),
      `所得货款 ${money(c.ownerGoodsCents)}`,
      `利润 ${money(c.profitCents)}${c.profitUnknown > 0 ? `（另 ${count(c.profitUnknown)} 单未知）` : ''}`,
      `新客户 ${count(c.newCustomers)}`,
    ],
    '/'
  )}`
}

/** 第二条「明细与待办」：热销、待办、库存告警、到期、其它、分站、机器人 */
export function mainDetailLines(r: MainReport): string[] {
  const out: string[] = []
  if (!r.top.length) out.push('【热销】无')
  r.top.forEach((t, i) => out.push(`${i === 0 ? '【热销】' : ''}${i + 1}. ${label(t.name)} ×${count(t.qty)} ${money(t.amountCents)}`))
  if (r.todo) {
    const d = r.todo
    out.push(`【待办】${joinItems([`待人工发货 ${count(d.processing)}`, `待开票 ${count(d.invoices)}`, `未读留言 ${count(d.unreadOrders)}`, `售后 ${count(d.afterSales)}`])}`)
  }
  if (r.lowStock) {
    const shown = r.lowStock.slice(0, 5).map((s) => `${label(s.name)} 剩 ${count(s.stock)} 张`)
    out.push(`【库存告警】${shown.length ? joinItems(shown) : '无'}${r.lowStock.length > 5 ? ` 等 ${count(r.lowStock.length)} 个` : ''}`)
  }
  if (r.expiring) {
    if (r.expiring.count === 0) out.push('【到期】未来 3 天没有到期的订阅')
    else {
      out.push(`【到期】未来 3 天到期的订阅 ${count(r.expiring.count)} 个`)
      for (const e of r.expiring.items.slice(0, 5)) out.push(`· ${e.date} ${label(e.account, 40)} ${label(e.type, 20)}`)
    }
  }
  out.push(othersLine(r.others))
  if (r.channels && (r.channels.rows.length || r.channels.idle)) {
    if (!r.channels.rows.length) out.push(`【分站】${count(r.channels.idle)} 个分站均无动态`)
    else {
      r.channels.rows.forEach((c, i) => out.push(`${i === 0 ? '【分站】' : ''}${channelLine(c)}`))
      if (r.channels.idle > 0) out.push(`其余 ${count(r.channels.idle)} 个分站无动态`)
    }
  }
  if (r.robot) {
    const parts = [`${r.window.relWord}发送 ${count(r.robot.sent)} 条`, `失败 ${count(r.robot.failed)}`]
    if (r.robot.offlineMinutes !== null) parts.push(`离线 ${count(Math.round(r.robot.offlineMinutes))} 分钟`)
    out.push(`【机器人】${joinItems(parts)}`)
  }
  return out
}

export const MAIN_HISTORY_NOTE = '注：补看历史时，待办、库存告警、到期是当前值，不是当天 0 点的；浏览数据只保留 90 天'
export const TENANT_HISTORY_NOTE = '注：补看历史时，余额、待办是当前值，不是当天 0 点的；浏览数据只保留 90 天'

/** 零点日报（管理群）：核心一条 + 明细一条（各自超长再按行切） */
export function renderMainDaily(r: MainReport): string[] {
  const head = mainHead(r)
  const dHead = `📊 ${r.window.title} 明细`
  const detail = mainDetailLines(r)
  if (r.historical) detail.push(MAIN_HISTORY_NOTE)
  return [...packMessages(head, mainCoreLines(r), `${head}（续）`), ...packMessages(dHead, detail, `${dHead}（续）`)]
}

/** 指令回复（管理群 / 私聊）：一条，超长截断 */
export function renderMainReply(r: MainReport): string {
  return fitLines([mainHead(r), ...mainCoreLines(r), ...mainDetailLines(r)], r.historical ? MAIN_HISTORY_NOTE : null, REPLY_BUDGET)
}

// ───────────────────────── 分站（分站群，渠道视角） ─────────────────────────

function tenantHead(r: TenantReport): string {
  return `📊 ${label(r.siteName, 20)} · ${r.window.kind === 'day' ? `${r.window.title} 日报` : r.window.title}`
}

export function tenantLines(r: TenantReport): string[] {
  const o = r.orders
  const out: string[] = []
  if (!r.traffic) out.push('【流量】暂无数据（本站流量自开启统计起才有数据）')
  else {
    // 窗口第一天不晚于统计开始的那天：这段的流量不完整（§6.5 第 7 条「第一份分站日报注明本站流量自 X 月 X 日起统计」）
    const since = r.trafficSince && r.trafficSince >= r.window.dayFrom ? [`自 ${cnDay(r.trafficSince)} 起统计`] : []
    out.push(...trafficLines(r.traffic, since))
  }
  out.push(`【客户】新注册 ${count(r.registered)} 人`)
  out.push(`【订单】下单 ${count(o.created)} 单 / ${count(o.createdUsers)} 人（含未付款）`)
  out.push(joinItems([`成交 ${count(o.paid)} 单 / ${count(o.paidUsers)} 人`, `成交额 ${money(o.amountCents)}`, `客单价 ${avgTicket(o)}`]))
  out.push(joinItems([`支付转化 ${pctText(o.createdPaid, o.created)}`, ...closeItems(o)]))
  const g = r.income
  const income = [`货款 ${money(g.goodsCents)}`, `进货 ${money(g.purchaseCents)}`, `发票分成 ${money(g.invShareCents)}`]
  if (g.otherCents !== 0) income.push(`售后与调整 ${money(g.otherCents)}`)
  out.push(`【收益】${joinItems(income)}`)
  out.push(joinItems([`${r.window.word}收益 ${money(g.balanceCents)}`, `手续费 ${money(g.feeCents)}`, `预计打款 ${money(g.payoutCents)}`]))
  if (r.balances) {
    const b = r.balances
    out.push(`【余额】${joinItems([`可结算 ${money(b.availableCents)}（预计打款 ${money(b.availablePayoutCents)}）`, `冻结中 ${money(b.pendingCents)}`])}`)
  }
  out.push(r.top.length ? `【热销】${joinItems(r.top.map((t) => `${label(t.name)} ×${count(t.qty)}`))}` : '【热销】无')
  const todo = [`未读留言 ${count(r.todo.unreadMessages)}`, `售后 ${count(r.todo.afterSales)}`]
  if (r.todo.autoDelisted > 0) todo.push(`自动下架 ${count(r.todo.autoDelisted)}`)
  out.push(`【待办】${joinItems(todo)}`)
  out.push(...compareLines({ paid: o.paid, amountCents: o.amountCents, uv: null }, r.compares))
  return out
}

/** 零点日报（分站群）：一条；超长按行切 */
export function renderTenantDaily(r: TenantReport): string[] {
  const head = tenantHead(r)
  const lines = tenantLines(r)
  if (r.historical) lines.push(TENANT_HISTORY_NOTE)
  return packMessages(head, lines, `${head}（续）`)
}

/** 指令回复（分站群）：一条，超长截断 */
export function renderTenantReply(r: TenantReport): string {
  return fitLines([tenantHead(r), ...tenantLines(r)], r.historical ? TENANT_HISTORY_NOTE : null, REPLY_BUDGET)
}
