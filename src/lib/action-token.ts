/**
 * 带作用域的签名操作令牌。
 *
 * 用途：把「一次性的、限定动作的」能力用链接发出去，收件人不需要登录后台。
 * 目前有两处：
 *   reply   — 企业微信留言通知里的一键回复（限定到单张订单）
 *   invoice — 待开发票清单给财务（限定到「看待开列表 + 标记已开具」）
 *
 * 令牌即凭证，所以每一处都必须自问：泄露了能干什么？
 * 因此令牌里带 scope，校验时必须传入期望的 scope——
 * 一个订单回复令牌拿去调发票接口会直接被拒，两个能力不会互相串。
 *
 * 格式：<scope>.<subject>.<过期时间36进制>.<HMAC-SHA256 签名>
 * 自包含、不占数据库、过期自动失效。
 */
import crypto from 'crypto'

export type TokenScope = 'reply' | 'invoice'

function secret(): string {
  const s = process.env.JWT_SECRET || ''
  if (!s) throw new Error('JWT_SECRET 未配置，无法签发操作令牌')
  return s
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
}

export function issueActionToken(scope: TokenScope, subject: string | number, ttlMs: number): string {
  const exp = Date.now() + ttlMs
  const payload = `${scope}.${subject}.${exp.toString(36)}`
  return `${payload}.${sign(payload)}`
}

export interface ActionClaim {
  scope: TokenScope
  subject: string
  expiresAt: Date
}

/**
 * 校验令牌。scope 必须与签发时一致，否则拒绝。
 * 任何一步不对都返回 null，不区分原因——不给试探者任何反馈。
 */
export function verifyActionToken(expectScope: TokenScope, token: string): ActionClaim | null {
  if (!token || token.length > 300) return null
  const parts = token.split('.')
  if (parts.length !== 4) return null
  const [scope, subject, expStr, sig] = parts
  if (scope !== expectScope) return null

  const payload = `${scope}.${subject}.${expStr}`
  const expected = sign(payload)
  if (sig.length !== expected.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null

  const exp = parseInt(expStr, 36)
  if (!exp || Number.isNaN(exp) || Date.now() > exp) return null

  return { scope: scope as TokenScope, subject, expiresAt: new Date(exp) }
}

export function siteBase(): string {
  return (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://bigolab.com').replace(/\/$/, '')
}

/**
 * 财务待开发票清单链接。
 *
 * 有效期刻意比订单回复短：这个页面会展示所有待开发票的抬头、税号与联系邮箱，
 * 比单张订单的对话敏感得多，链接不该长期漂在聊天记录里。
 */
export function financeInvoiceUrl(ttlDays = Number(process.env.FINANCE_LINK_TTL_DAYS || 3)): string {
  return `${siteBase()}/finance/${issueActionToken('invoice', 'pending', ttlDays * 86400_000)}`
}
