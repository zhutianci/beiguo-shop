/**
 * 渠道后台前端的格式化与文案（WP6；WP7 的页面也可以复用）。
 *
 * 纯函数、无 import：边界检查规则 1 只允许 partner 组件 import partner 目录、tenant/{types,perms} 等少数模块，
 * 所以金额格式化不用 src/lib/money、日期不用第三方库，都在这里写。
 * 服务端给的金额一律是「分」（Int），这里只负责显示；前端绝不参与任何金额计算（按分求和除外）。
 */

/** 分 → 「¥1,234.56」；null / undefined → 「—」 */
export function yuan(cents: number | null | undefined, opts: { sign?: boolean } = {}): string {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) return '—'
  const neg = cents < 0
  const abs = Math.abs(Math.round(cents))
  const int = Math.floor(abs / 100)
  const dec = String(abs % 100).padStart(2, '0')
  const intText = String(int).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const sign = neg ? '−' : opts.sign && cents > 0 ? '+' : ''
  return `${sign}¥${intText}.${dec}`
}

/**
 * 扣减项（进货款、手续费）按「对余额的实际方向」显示：服务端给的是正的扣减量（balances.ts 的订单视图 / 构成口径），
 * 正数显示成「−¥x」；退款冲回后扣减量变负（进货款退回给渠道、手续费随货款一起冲回），显示成「+¥x」。
 * 不能用 −|x|：冲回时会把本该加回余额的钱也画成扣减，页面上「货款 − 进货款 … = 余额」「余额 − 手续费 = 预计打款」
 * 就对不上了（终审第 2 轮：退款 ¥10 后显示 余额 −2.14、手续费 −0.15、预计打款 −1.99，三者自相矛盾）。
 */
export function deduct(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) return '—'
  return yuan(-cents, { sign: true })
}

/** 分 → 输入框里的「元」字符串（123.40） */
export function centsToYuanInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return ''
  return (cents / 100).toFixed(2)
}

/** ISO → 东八区「2026-09-26 14:05」；null → 「—」 */
export function cnTime(iso: string | null | undefined, withSeconds = false): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const t = new Date(d.getTime() + 8 * 3600_000)
  const p = (n: number) => String(n).padStart(2, '0')
  const base = `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())} ${p(t.getUTCHours())}:${p(t.getUTCMinutes())}`
  return withSeconds ? `${base}:${p(t.getUTCSeconds())}` : base
}

/** 比例 bp → 「1.5%」 */
export function bpText(bp: number | null | undefined): string {
  if (bp === null || bp === undefined) return '—'
  return `${(bp / 100).toFixed(2).replace(/\.?0+$/, '')}%`
}

function label(map: Record<string, string>, v: string | null | undefined, empty = '—'): string {
  if (!v) return empty
  return map[v] ?? v
}

export const PAY_STATUS_TEXT: Record<string, string> = { UNPAID: '未付款', PAID: '已付款', REFUNDED: '已退款' }
export const DELIVERY_STATUS_TEXT: Record<string, string> = { PENDING: '待交付', PROCESSING: '处理中', DELIVERED: '已交付', CANCELLED: '已取消' }
export const SETTLE_TEXT: Record<string, string> = {
  ACCRUED: '冻结中',
  RELEASED: '已解冻',
  REVERSED: '已冲销',
  EXCLUDED: '不计余额',
  MISSING: '待补记',
}
export const INV_SHARE_TEXT: Record<string, string> = { ACCRUED: '冻结中', RELEASED: '已解冻', REVERSED: '已冲回' }
export const AFTER_SALE_STATUS_TEXT: Record<string, string> = { PENDING: '待处理', REJECTED: '已驳回', DONE: '已处理', CANCELLED: '已取消' }
export const AFTER_SALE_KIND_TEXT: Record<string, string> = { REFUND: '申请退款', REISSUE: '申请补发', ESCALATE: '升级给站长', BAN_REQUEST: '申请全局封禁' }
export const BEARER_TEXT: Record<string, string> = { PROPORTIONAL: '按比例分担（平台原因）', CHANNEL: '渠道承担（渠道原因）', PLATFORM: '站长承担' }
export const NOT_SELLABLE_TEXT: Record<string, string> = {
  NOT_LISTED: '未上架',
  NOT_GRANTED: '未授权',
  NO_SUPPLY: '未设进货价',
  NOT_PRICED: '未定价',
  BELOW_SUPPLY: '售价低于进货价',
  OUT_OF_RANGE: '售价超出范围',
  PRODUCT_OFF: '商品已停售',
  TENANT_INACTIVE: '店铺未营业',
  VERSION_CHANGED: '进货价已变动，请重新预览',
}
export const DELISTED_TEXT: Record<string, string> = {
  SUPPLY_ABOVE_RETAIL: '进货价上调高于售价，已自动下架',
  PRODUCT_OFF: '商品停售，已自动下架',
  REVOKED: '站长撤销授权，已下架',
  // 站长改了售价上下限后本店售价不再合规（WP5 偏差 7；集成阶段 D16 补文案）：调整售价后可重新上架
  OUT_OF_RANGE: '售价超出平台设置的范围，已自动下架，请调整售价后重新上架',
  NOT_PRICED: '售价被清空，已自动下架，请重新设置售价后上架',
}
export const INVOICE_STATUS_TEXT: Record<string, string> = {
  UNAPPLIED: '未申请',
  AWAIT_PAY: '待付税费',
  SUBMITTED: '已提交开票',
  ISSUED: '已开具',
  CANNOT: '不可开具',
}
export const SMS_STATUS_TEXT: Record<string, string> = { WAITING: '等码中', CODE: '已收码', TIMEOUT: '已超时', CANCELLED: '已取消', FAILED: '取号失败' }

export const payText = (v: string | null | undefined) => label(PAY_STATUS_TEXT, v)
export const deliveryText = (v: string | null | undefined) => label(DELIVERY_STATUS_TEXT, v)
export const settleText = (v: string | null | undefined) => label(SETTLE_TEXT, v, '未计提')
export const invShareText = (v: string | null | undefined) => label(INV_SHARE_TEXT, v, '—')
export const afterSaleStatusText = (v: string | null | undefined) => label(AFTER_SALE_STATUS_TEXT, v, '—')
export const afterSaleKindText = (v: string | null | undefined) => label(AFTER_SALE_KIND_TEXT, v)
export const notSellableText = (v: string | null | undefined) => label(NOT_SELLABLE_TEXT, v, '')
export const delistedText = (v: string | null | undefined) => label(DELISTED_TEXT, v, '')
export const invoiceStatusText = (v: string | null | undefined) => label(INVOICE_STATUS_TEXT, v)
export const smsStatusText = (v: string | null | undefined) => label(SMS_STATUS_TEXT, v)
