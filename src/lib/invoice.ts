import crypto from 'crypto'

// 税号归一化拆在无依赖的 ./tax-number 里，前台组件要用同一份规则
// （本文件 import 了 node:crypto，客户端组件不能直接引）
export { normalizeTaxNumber, TAX_NUMBER_MAX_LEN } from './tax-number'

export const TAX_RATE = 0.06 // 6% 税点

// 归一化名称用于匹配（小写 + 去掉非字母数字）："Claude MAX 5x" -> "claudemax5x"
export function normalizeName(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

// 从商品列表里按订阅类型匹配售价（精确归一化优先，其次包含）
export function matchPriceFromProducts(
  products: { name: string; price: unknown }[],
  subscriptionType: string
): number | null {
  const norm = normalizeName(subscriptionType)
  if (!norm) return null
  let best: { price: number; score: number } | null = null
  for (const p of products) {
    const pn = normalizeName(p.name)
    if (!pn) continue
    let score = 0
    if (pn === norm) score = 3
    else if (norm.includes(pn) || pn.includes(norm)) score = 2
    if (score > 0 && (!best || score > best.score)) {
      best = { price: Number(p.price), score }
    }
  }
  return best ? best.price : null
}

/**
 * 售价 → { 含税开票金额, 应付税费 }。
 *
 * 【必须在「分」上算，且税费由减法导出，不能两边各自四舍五入】
 * 原来写的是 round2(p*1.06) 与 round2(p*0.06) 两次独立取整，
 * 0.01~5000.00 区间里有 **2030 个价格**（全是 .25/.75 结尾）会让
 * `售价 + 税费 ≠ 开票金额`：p=2.75 时开票 2.92、税费 0.16，加起来 2.91。
 * 原因是 2.75*0.06 在双精度下是 0.16499999999999998，四舍五入掉到 0.16。
 *
 * 以前这一分钱看不见 —— 货款和税费是两笔分开收的，没人把它们加起来。
 * 现在下单可以「货款+税费一次付清」，买家实付的那个数必须精确等于票面金额，
 * 否则公司报销时付款记录和发票对不上，正是这次改造要解决的问题本身。
 */
export function calcInvoiceAmounts(sellingPrice: number) {
  const sellCents = Math.round(sellingPrice * 100)
  const invoiceCents = Math.round(sellCents * (1 + TAX_RATE)) // 含税 售价*1.06
  return {
    invoiceAmount: invoiceCents / 100,
    taxFee: (invoiceCents - sellCents) / 100, // 恒等于 开票金额 − 售价
  }
}

export function genInvoiceNo(): string {
  return 'INV' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(3).toString('hex').toUpperCase()
}

// 发票状态文案
export const INVOICE_STATUS_LABELS: Record<string, string> = {
  UNAPPLIED: '可开据·未开发票',
  AWAIT_PAY: '可开据·待支付税费',
  SUBMITTED: '可开具·已提交开票',
  ISSUED: '已开具',
  CANNOT: '不可开据',
}
