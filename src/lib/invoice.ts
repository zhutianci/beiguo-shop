import crypto from 'crypto'

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

export function calcInvoiceAmounts(sellingPrice: number) {
  const round2 = (n: number) => Math.round(n * 100) / 100
  return {
    invoiceAmount: round2(sellingPrice * (1 + TAX_RATE)), // 含税 售价*1.06
    taxFee: round2(sellingPrice * TAX_RATE), // 应付 售价*0.06
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
