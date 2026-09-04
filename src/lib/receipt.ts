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
