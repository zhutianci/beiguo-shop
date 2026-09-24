import crypto from 'crypto'

// 收款人（固定）
export const PAYEE = '益阳市赫山区必高科技有限公司'

export function genReceiptNo(): string {
  return 'SJ' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase()
}

// 不可枚举的公开访问令牌（128-bit）
export function genReceiptToken(): string {
  return crypto.randomBytes(16).toString('hex')
}

// 金额大写实现放在 ./rmb（无 node 依赖，客户端可直接 import），此处再导出保持既有引用不变。
export { rmbCapital } from './rmb'

/**
 * 收据「项目」一栏印什么。
 *
 * 与发票同一口径（lib/invoice-export.ts 的「项目名称」）：买家申请时选了**不展示**
 * ChatGPT/Claude 字眼 → 只印「技术咨询服务」；选了展示、或历史收据（没做过这个选择，NULL）
 * → 与原来一致，「<订阅类型> 会员订阅」。手动开具（DIY）的收据没有订阅类型，返回 null 不印这一行。
 */
export const RECEIPT_NEUTRAL_PROJECT = '技术咨询服务'

export function receiptProjectLabel(subscriptionType: string | null, showAiWording: boolean | null): string | null {
  if (showAiWording === false) return RECEIPT_NEUTRAL_PROJECT
  const t = (subscriptionType || '').trim()
  return t ? `${t} 会员订阅` : null
}
