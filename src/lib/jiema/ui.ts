/**
 * 短信接码 · 买家页面的纯函数（docs/短信接码-设计.md §1.8–§1.10、§1.14、§6.6 第 27、30 条、§8.2、D24、D37、附录 A）。
 *
 * 【零依赖、客户端能 import】只引用同样零依赖的 wallet/buckets（两格拆分）与 pricing（金额格式）；不 import prisma、不 import 上游客户端。
 * 确认面板、号码页、「我的订单」、登录 / 注册回跳共用这里的判定，scripts/check-jiema-s2b.ts 直接断言，
 * 免得页面里各写一套（例如「余额付清单停在 PENDING_PAY 时不给任何支付按钮」在号码页与我的订单两处口径不一致）。
 */
import { splitDebit } from '../wallet/buckets'
import { fmtYuan } from './pricing'

// ───────────────────────── 确认面板：付款方式（§1.8、D1、D32–D34） ─────────────────────────

export type PayWith = 'BALANCE' | 'ALIPAY'
export type PayMode = 'BALANCE' | 'MIXED' | 'ALIPAY'

export interface PayPlan {
  mode: PayMode
  /** 余额部分（= 服务端下单时预扣的金额；先充值格、后返现格） */
  balanceCents: number
  topupCents: number
  cashCents: number
  /** 支付宝部分（不含识别尾差） */
  alipayCents: number
}

/**
 * 按「应付 + 两格可用余额 + 买家选的付款方式」算拆分，与服务端下单事务里的 splitDebit / payModeOf 同一口径：
 * 选余额且可用 > 0 → 余额 ≥ 应付为「余额付清」，否则「组合」；选支付宝或可用为 0 → 支付宝全额。
 * 面板显示与提交的 expectBalanceCents 都用它（服务端锁住用户行后重算，不一致返回 409 BALANCE_CHANGED）。
 */
export function payPlan(priceCents: number, topupCents: number, cashCents: number, payWith: PayWith): PayPlan {
  const price = Math.max(0, Math.trunc(priceCents))
  const t = Math.max(0, Math.trunc(topupCents))
  const c = Math.max(0, Math.trunc(cashCents))
  if (payWith === 'ALIPAY' || t + c <= 0 || price <= 0) return { mode: 'ALIPAY', balanceCents: 0, topupCents: 0, cashCents: 0, alipayCents: price }
  const s = splitDebit(t, c, price)
  const bal = s.topupCents + s.cashCents
  return { mode: bal >= price ? 'BALANCE' : 'MIXED', balanceCents: bal, topupCents: s.topupCents, cashCents: s.cashCents, alipayCents: price - bal }
}

/** 默认选中（§1.8）：余额 > 0 且余额支付开关打开时默认「余额抵扣」，否则默认「支付宝」 */
export function defaultPayWith(availCents: number, balancePayOn: boolean): PayWith {
  return balancePayOn && availCents > 0 ? 'BALANCE' : 'ALIPAY'
}

/**
 * 实际生效（界面显示与提交共用）的付款方式（S2b 评审修复）：只有「余额支付开着、买家选了余额、可用余额 > 0」才是 BALANCE，
 * 其余一律 ALIPAY。原来两个 radio 按「可用 ≤ 0」显示成支付宝，提交的却还是买家早先选的 BALANCE（expectBalanceCents=0），
 * 于是多弹一次「余额已用完，改用支付宝？」；余额支付被急停（503 BALANCE_PAY_OFF）后面板也要按「关」算，不能切回页面又默认回余额。
 */
export function effectivePayWith(payWith: PayWith | null, availCents: number, balancePayOn: boolean): PayWith {
  return balancePayOn && payWith === 'BALANCE' && availCents > 0 ? 'BALANCE' : 'ALIPAY'
}

/** 「确认支付」按钮文案：余额付清写一段、组合写清两段、支付宝全额写一段（§1.8「付款方式的三种显示」） */
export function payButtonLabel(p: Pick<PayPlan, 'mode' | 'balanceCents' | 'alipayCents'>): string {
  if (p.mode === 'BALANCE') return `确认支付（余额 ${fmtYuan(p.balanceCents)}）`
  if (p.mode === 'MIXED') return `确认支付：余额 ${fmtYuan(p.balanceCents)} + 支付宝 ${fmtYuan(p.alipayCents)}`
  return `确认支付（支付宝 ${fmtYuan(p.alipayCents)}）`
}

/**
 * 409 PRICE_CHANGED / BALANCE_CHANGED 的「一个弹窗同时确认价格和拆分」（§1.8）：
 *  · 价格变了：「价格已更新为 ¥1.86（原 ¥1.70）：余额抵扣 ¥1.20 + 支付宝 ¥0.66，是否继续？」
 *  · 余额变了：「你的可用余额刚刚变化：余额抵扣 ¥0.80 + 支付宝 ¥0.90，是否继续？」
 *  · 余额用完（服务端带 suggestPayWith='ALIPAY'）：「你的余额已用完，本单改用支付宝 ¥1.70 支付？」
 * 返回弹窗文案与继续时要提交的新 expect 值；前端只在服务端给了 suggestPayWith 时改付款方式，不自己猜。
 */
export interface ChangeDialog {
  text: string
  confirmLabel: string
  next: { expectPriceCents: number; payWith: PayWith; expectBalanceCents: number | null }
}
export function changeDialog(
  code: 'PRICE_CHANGED' | 'BALANCE_CHANGED',
  ctx: { oldPriceCents: number; payWith: PayWith },
  extra: { priceCents?: unknown; balanceCents?: unknown; alipayCents?: unknown; suggestPayWith?: unknown },
): ChangeDialog | null {
  const num = (v: unknown) => (typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : null)
  const bal = num(extra.balanceCents) ?? 0
  const ali = num(extra.alipayCents)
  if (ali == null) return null
  const price = code === 'PRICE_CHANGED' ? num(extra.priceCents) : ctx.oldPriceCents
  if (price == null || price !== bal + ali) return null
  const split = (b: number, a: number) => (b > 0 && a > 0 ? `余额抵扣 ${fmtYuan(b)} + 支付宝 ${fmtYuan(a)}` : b > 0 ? `余额付清 ${fmtYuan(b)}` : `支付宝 ${fmtYuan(a)}`)
  if (code === 'BALANCE_CHANGED' && extra.suggestPayWith === 'ALIPAY') {
    return {
      text: `你的余额已用完，本单改用支付宝 ${fmtYuan(price)} 支付？`,
      confirmLabel: '用支付宝支付',
      next: { expectPriceCents: price, payWith: 'ALIPAY', expectBalanceCents: null },
    }
  }
  const payWith: PayWith = ctx.payWith === 'BALANCE' && bal > 0 ? 'BALANCE' : 'ALIPAY'
  const text =
    code === 'PRICE_CHANGED'
      ? `价格已更新为 ${fmtYuan(price)}（原 ${fmtYuan(ctx.oldPriceCents)}）：${split(payWith === 'BALANCE' ? bal : 0, payWith === 'BALANCE' ? ali : price)}，是否继续？`
      : `你的可用余额刚刚变化：${split(bal, ali)}，是否继续？`
  return { text, confirmLabel: '继续支付', next: { expectPriceCents: price, payWith, expectBalanceCents: payWith === 'BALANCE' ? bal : null } }
}

/** 下单失败后要不要换一个 clientToken：服务端**已经建过单又关掉**（事后复核超限、发起收款失败）的，同一个 token 会把那张已关的单还回来 */
export function shouldRenewOrderToken(status: number, code: string | null | undefined, extra: { released?: unknown } = {}): boolean {
  if (code === 'PAY_BUSY') return true
  if (code === 'OPEN_PAYMENTS' && extra.released === true) return true
  // 5xx 之类的未知失败：单可能建了也可能没建。保留 token（重试时服务端按幂等把同一张单还回来，不会重复建单）
  return false
}

// ───────────────────────── 登录 / 注册回跳（D24、§6.6 第 30 条） ─────────────────────────

const CODE_RE = /^[a-z0-9]{2,4}$/
const OP_RE = /^[a-z0-9_]{1,40}$/i

/** 当前选择的 /jiema 地址（带 confirm=1：回来自动打开确认面板，服务、国家/地区、运营商都不丢） */
export function jiemaSelectionPath(s: string, c: number, op: string | null, confirm = true): string {
  const q = new URLSearchParams()
  if (CODE_RE.test(s)) q.set('s', s)
  if (Number.isInteger(c) && c >= 1 && c <= 999) q.set('c', String(c))
  if (op && OP_RE.test(op) && op !== 'any') q.set('op', op)
  if (confirm) q.set('confirm', '1')
  const qs = q.toString()
  return `/jiema${qs ? `?${qs}` : ''}`
}

/** 登录地址：回跳地址**整段** encodeURIComponent（否则 &c=、&op=、&confirm= 会被登录页当成自己的参数吃掉） */
export function loginHref(returnPath: string): string {
  return `/login?redirect=${encodeURIComponent(returnPath)}`
}

/** 登录页 ↔ 注册页带同一个 redirect（实现在 lib/safe-redirect.ts，登录 / 注册页直接从那里 import，不把接码代码打进它们的包） */
export { withRedirect } from '../safe-redirect'

/** 「去充值」：新标签页打开充值页，带 returnTo（充值页只收 /jiema 开头、≤120 字的） */
export function topupHref(returnPath: string): string {
  return returnPath.startsWith('/jiema') && returnPath.length <= 120 ? `/wallet/topup?returnTo=${encodeURIComponent(returnPath)}` : '/wallet/topup'
}

// ───────────────────────── 号码页（§1.10） ─────────────────────────

/** 本地号的显示分组（3-4-4 或 3-3-4），只影响显示，复制出来不带空格 */
export function groupNational(national: string): string {
  const d = national.replace(/\D/g, '')
  if (d.length === 11) return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7)}`
  if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
  if (d.length > 11) return `${d.slice(0, d.length - 8)} ${d.slice(-8, -4)} ${d.slice(-4)}`
  if (d.length >= 7) return `${d.slice(0, d.length - 4)} ${d.slice(-4)}`
  return d
}

/** 两个复制按钮的文本：「复制完整号码」+区号连号、「复制不含区号」只有本地号；都不带空格 */
export function copyTexts(n: { full: string; national: string }): { full: string; national: string } {
  const full = `+${n.full.replace(/\D/g, '')}`
  return { full, national: n.national.replace(/\D/g, '') }
}

/** mm:ss（超过 1 小时 h:mm:ss）；负数按 0 */
export function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

/** 在后台时继续低频轮询的状态（§1.10：WAITING、REPLACING、CANCELLING；复制号码后切去目标平台等码是最常见的操作） */
export const BACKGROUND_POLL_STATES: readonly string[] = Object.freeze(['WAITING', 'REPLACING', 'CANCELLING'])
export const BACKGROUND_POLL_MS = 12_000

/**
 * 下一次轮询的间隔（毫秒；0 = 不再轮询）：终态（服务端 pollMs=0）停；页面在前台按服务端建议（通常 3 秒）；
 * 在后台只有等码 / 换号 / 取消中的单以 12 秒低频继续，其余状态在后台暂停（回到前台立即拉一次）。
 */
export function pollDelay(state: string, serverPollMs: number, hidden: boolean): number {
  if (!serverPollMs || serverPollMs <= 0) return 0
  if (!hidden) return Math.max(1000, serverPollMs)
  return BACKGROUND_POLL_STATES.includes(state) ? BACKGROUND_POLL_MS : 0
}

/** 开票提示（D37 清单第 ④ 项）：RECEIVED / FINISHED / REFUNDED / CANCELLED 四种状态显示；PENDING_PAY、CLOSED 等不显示 */
export function showInvoiceNoticeFor(state: string): boolean {
  return state === 'RECEIVED' || state === 'FINISHED' || state === 'REFUNDED' || state === 'CANCELLED'
}

/** 收到码时闪烁的标题（§1.10：「【验证码 482917】」；没识别出验证码时「【收到短信】」） */
export function flashTitle(code: string | null | undefined): string {
  const c = (code ?? '').trim()
  return c ? `【验证码 ${c.slice(0, 16)}】` : '【收到短信】'
}

/** 重新发起支付失败时，哪些返回码表示服务端**已经关单**（预扣已在同一事务退回，§1.9、§6.6 第 26 条） */
export function payErrorClosedOrder(code: string | null | undefined): boolean {
  return code === 'HOLD' || code === 'UNAVAILABLE' || code === 'QUOTE_EXPIRED'
}

/** 重新发起支付的其他失败（订单没被关）：固定提示；纯支付宝单没有预扣，去掉括号里那句（§1.9、§1.14） */
export function payRetryText(payMode: string): string {
  return payMode === 'ALIPAY' ? '发起支付失败，可以重试，或取消订单' : '发起支付失败，可以重试，或取消订单（预扣的余额立即退回）'
}

/** 号码页状态徽章（文案 + 色调；等待琥珀、收到绿、退款与取消中性灰、异常红，§1.13） */
export function stateBadge(state: string): { label: string; tone: 'amber' | 'green' | 'gray' | 'red' | 'cyan' } {
  switch (state) {
    case 'PENDING_PAY':
      return { label: '待支付', tone: 'amber' }
    case 'READY':
      return { label: '已付款 · 待开始', tone: 'cyan' }
    case 'ACQUIRING':
      return { label: '正在分配号码', tone: 'cyan' }
    case 'WAITING':
      return { label: '等待短信', tone: 'amber' }
    case 'REPLACING':
      return { label: '换号中', tone: 'amber' }
    case 'CANCELLING':
    case 'REFUNDING':
      return { label: '正在取消', tone: 'gray' }
    case 'RECEIVED':
      return { label: '已收到短信', tone: 'green' }
    case 'FINISHED':
      return { label: '已完成', tone: 'green' }
    case 'CANCELLED':
      return { label: '已取消 · 已退回余额', tone: 'gray' }
    case 'REFUNDED':
      return { label: '已退款 · 已退回余额', tone: 'gray' }
    case 'CLOSED':
      return { label: '未支付 · 已关闭', tone: 'gray' }
    case 'MANUAL':
      return { label: '人工处理中', tone: 'red' }
    default:
      return { label: state, tone: 'gray' }
  }
}

/**
 * 「复制订单信息」（§8.2，方便粘贴到微信）：
 *   【短信接码售后】/ 订单号 / 服务 / 国家或地区（运营商）/ 号码（第 N 个号）/ 下单时间 · 状态（剩余）/ 问题：
 * 时间一律按北京时间写（客服与买家对得上）。
 */
export function orderInfoText(
  v: {
    orderNo: string
    state: string
    createdAt: string | null
    service: { name: string }
    country: { name: string }
    operator: { name: string } | null
    number: { dial: string | null; national: string; seq: number; endsAt: string } | null
  },
  nowMs: number,
): string {
  const when = v.createdAt ? bjTime(v.createdAt) : '—'
  const num = v.number ? `${v.number.dial ? `+${v.number.dial} ` : '+'}${groupNational(v.number.national)}（第 ${v.number.seq} 个号）` : '—'
  const left = v.number && ['WAITING', 'RECEIVED', 'REPLACING'].includes(v.state) ? `（剩余 ${fmtCountdown(Date.parse(v.number.endsAt) - nowMs)}）` : ''
  return [
    '【短信接码售后】',
    `订单号：${v.orderNo}`,
    `服务 / 国家或地区：${v.service.name} / ${v.country.name}（${v.operator ? v.operator.name : '任意运营商'}）`,
    `号码：${num}`,
    `下单：${when} · 状态：${stateBadge(v.state).label}${left}`,
    '问题：',
  ].join('\n')
}

/** ISO → 北京时间「2026-09-29 14:03」（不依赖运行环境时区） */
export function bjTime(iso: string): string {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return '—'
  const d = new Date(t + 8 * 3600_000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
}

// ───────────────────────── 「我的订单」里的接码单（§6.6 第 27 条、§12.2 第 93 条） ─────────────────────────

export interface JiemaCardInput {
  payStatus: string
  deliveryStatus: string
  jiema: { state: string; payMode: string; holdCents: number; holdState: string | null } | null
}

export interface JiemaCard {
  /** 状态徽章 */
  label: string
  /** 卡片下方的一行提示（null = 不显示） */
  hint: string | null
  tone: 'amber' | 'blue' | 'gray' | 'green'
  /** 「支付宝支付」按钮：接码单一律不给，付款只走号码页（否则余额付清单会被 vmq/create 报「已用余额付清」） */
  showAlipay: false
  /** 「去付款（号码页）」按钮：待支付、不是余额付清 */
  showGoPay: boolean
  /** 「查看号码 →」：所有接码单不论状态都有 */
  showNumberLink: true
  /** 开票提示一行（D37 清单第 ⑤ 项）：payStatus 为 PAID 或 REFUNDED 才显示 */
  showInvoiceNotice: boolean
  /** 在线沟通按钮：接码单任何状态都能留言（§6.6 第 29 条） */
  showChat: true
}

/**
 * 纯函数：一张接码单在「我的订单」里怎么显示（不用「超时取消」的说法，与 §1.11 同一口径）。
 * S2b 评审修复：**先看接码单状态**，再看付款状态——MANUAL（E44 钱到了却翻不了 PAID、T19 失败…）不再显示「待支付 + 去付款」，
 * 已付款的 READY 显示「已付款 · 待开始」（要买家点「开始接码」，24 小时不点自动退回）；组合单的「余额已预扣」只在预扣还是 HELD 时写。
 */
export function jiemaOrderCard(o: JiemaCardInput): JiemaCard {
  const base = { showAlipay: false as const, showNumberLink: true as const, showChat: true as const, showInvoiceNotice: o.payStatus === 'PAID' || o.payStatus === 'REFUNDED' }
  const j = o.jiema
  if (j?.state === 'MANUAL' && o.deliveryStatus !== 'CANCELLED' && o.payStatus !== 'REFUNDED') {
    // 人工处理中：不论订单付没付款都不给「去付款」（钱可能已经到了，只是还没确认），与号码页的「人工处理中」一致
    return { ...base, label: '人工处理中', hint: '订单需要人工核实，客服会尽快处理；如已付款请勿重复付款', tone: 'amber', showGoPay: false }
  }
  if (o.payStatus === 'UNPAID') {
    if (o.deliveryStatus === 'CANCELLED' || j?.state === 'CLOSED') {
      // 用过余额的加「预扣已退回」；纯支付宝的关闭单什么都没退，不写「已退回」（徽章已经是「未支付 · 已关闭」，不再重复一行）
      const back = j && j.holdCents > 0 && j.holdState === 'RELEASED' ? `未支付 · 已关闭，预扣 ${fmtYuan(j.holdCents)} 已退回` : null
      return { ...base, label: '未支付 · 已关闭', hint: back, tone: 'gray', showGoPay: false }
    }
    if (j && (j.payMode === 'BALANCE' || j.state !== 'PENDING_PAY')) return { ...base, label: '正在确认付款', hint: '正在确认付款（无需再付），请稍候', tone: 'blue', showGoPay: false }
    const held = !!j && j.payMode === 'MIXED' && j.holdState === 'HELD' && j.holdCents > 0
    const hint = held ? `余额已预扣 ${fmtYuan(j!.holdCents)}，还需支付宝付款，请在号码页完成` : '请在号码页完成付款'
    return { ...base, label: '待支付', hint, tone: 'amber', showGoPay: true }
  }
  if (o.payStatus === 'REFUNDED') {
    const after = j?.state === 'REFUNDED'
    return {
      ...base,
      label: after ? '已退款 · 已退回余额' : '已取消 · 已退回余额',
      hint: after ? '售后审核通过，已整单退回余额' : '没有收到短信，已整单退回余额，可用于下次购物抵扣',
      tone: 'gray',
      showGoPay: false,
    }
  }
  if (o.payStatus === 'PAID') {
    // 收到码时订单已是 DELIVERED（交付完成），但号码还能继续收短信：先按接码单状态显示「已收到短信」
    if (j?.state === 'RECEIVED') return { ...base, label: '已收到短信', hint: '已收到短信，点「查看号码」看验证码', tone: 'green', showGoPay: false }
    if (o.deliveryStatus === 'DELIVERED' || j?.state === 'FINISHED') return { ...base, label: '已完成', hint: null, tone: 'green', showGoPay: false }
    if (j?.state === 'CANCELLING' || j?.state === 'REFUNDING') return { ...base, label: '正在取消', hint: '没有收到短信，正在整单退回余额', tone: 'gray', showGoPay: false }
    if (j?.state === 'READY') return { ...base, label: '已付款 · 待开始', hint: '付款确认晚了一些：请到号码页点「开始接码」或取消退回余额（24 小时不操作自动退回余额）', tone: 'amber', showGoPay: false }
    return { ...base, label: '正在接码', hint: '正在接码，点「查看号码」', tone: 'blue', showGoPay: false }
  }
  return { ...base, label: '已取消', hint: null, tone: 'gray', showGoPay: false }
}

/**
 * 「我的订单」接码卡片右侧的金额（S2b 评审修复）：大字**一律是订单金额 amount**（不再用 payable——余额付清单停在待支付时 payable = 0，
 * 会显示成「¥0.00 订单金额」）；待支付且预扣还是 HELD 时下面分两行写「余额已预扣 ¥x」「还需支付宝 ¥y」（y = payable，只给收银台逻辑用；为 0 不写）。
 */
export function jiemaAmountLines(o: { amount: number; payable: number; payStatus: string; deliveryStatus: string; jiema: JiemaCardInput['jiema'] }): { main: number; lines: string[] } {
  const j = o.jiema
  const lines: string[] = []
  if (o.payStatus === 'UNPAID' && o.deliveryStatus !== 'CANCELLED' && j && j.state === 'PENDING_PAY' && j.holdState === 'HELD' && j.holdCents > 0) {
    lines.push(`余额已预扣 ${fmtYuan(j.holdCents)}`)
    const rest = Math.round(o.payable * 100)
    if (rest > 0) lines.push(`还需支付宝 ${fmtYuan(rest)}`)
  }
  return { main: o.amount, lines }
}

/** 金额显示：接码单按分（¥1.70 不能显示成「¥2」，§6.6 第 27 条）；普通商品维持原来的取整显示 */
export function orderAmountText(amount: number, deliveryType: string | null | undefined): string {
  return deliveryType === 'SMS_POOL' ? `¥${amount.toFixed(2)}` : `¥${amount.toFixed(0)}`
}

// ───────────────────────── 条款（§1.8：首单必勾，之后同一版默认勾选；任一份升版后重新勾选） ─────────────────────────

export function termsPreTicked(last: { jiema: string | null; wallet: string | null } | null, cur: { jiema: string; wallet: string }): boolean {
  return !!last && last.jiema === cur.jiema && last.wallet === cur.wallet
}
