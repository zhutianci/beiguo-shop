/**
 * 带作用域的签名操作令牌。
 *
 * 用途：把「一次性的、限定动作的」能力用链接发出去，收件人不需要登录后台。
 * 目前只有一处：
 *   invoice — 待开发票清单给财务（限定到「看待开列表 + 标记已开具」）
 * （企业微信留言的一键回复走的是 lib/quick-reply 自己的令牌格式，不用这里；
 *   以前这里还列了一个从未签发过的 'reply' scope，已删，免得有人误以为两处通用。）
 *
 * 令牌即凭证，所以每一处都必须自问：泄露了能干什么？
 * 因此令牌里带 scope，校验时必须传入期望的 scope——
 * 一个订单回复令牌拿去调发票接口会直接被拒，两个能力不会互相串。
 *
 * 格式：<scope>.<subject>.<过期时间36进制>.<HMAC-SHA256 签名>
 * 自包含、不占数据库、过期自动失效。
 *
 * 密钥（审计 G10）：仍是 getJwtSecret()（= JWT_SECRET），与登录 JWT、快捷回复令牌共用，刻意不换派生子密钥——
 * 子密钥解决不了轮换牵连，还会让已发给财务的链接失效或留下带截止日的双密钥过渡（理由同 lib/quick-reply）。
 * 三者靠显式格式白名单隔离：本令牌 4 段且首段必须等于 scope、回复令牌 3 段、登录 JWT 首段恒为 eyJ…，
 * 谁也冒充不了谁（scripts/check-action-tokens.ts 钉着）。密钥未配置 / 公开默认值时签发抛错、验签一律 null。
 */
import crypto from 'crypto'
import { getJwtSecret } from './jwt-secret'

export type TokenScope = 'invoice'

function sign(payload: string, key: string): string {
  return crypto.createHmac('sha256', key).update(payload).digest('base64url')
}

// 与 verifyActionToken 的格式白名单一致：签得出来的一定验得过，反之亦然
const SUBJECT_RE = /^[A-Za-z0-9_-]{1,64}$/
const EXP_RE = /^[0-9a-z]{1,11}$/
const SIG_RE = /^[A-Za-z0-9_-]{43}$/

export function issueActionToken(scope: TokenScope, subject: string | number, ttlMs: number): string {
  const root = getJwtSecret()
  // 调用方（vmq 的发票可开具通知）会 catch，通知失败不影响业务
  if (!root) throw new Error('JWT_SECRET 未配置，无法签发操作令牌')
  if (!SUBJECT_RE.test(String(subject))) throw new Error('subject 格式非法')
  const exp = Date.now() + ttlMs
  const payload = `${scope}.${subject}.${exp.toString(36)}`
  return `${payload}.${sign(payload, root)}`
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
  // 显式格式白名单：不靠后面 parseInt 的隐式行为挡住形状不对的输入
  if (!SUBJECT_RE.test(subject) || !EXP_RE.test(expStr) || !SIG_RE.test(sig)) return null

  const payload = `${scope}.${subject}.${expStr}`
  const root = getJwtSecret()
  if (!root) return null // fail closed：没有密钥 = 谁都不认
  const sigBuf = Buffer.from(sig)
  const expected = Buffer.from(sign(payload, root))
  // 定长比较，避免时序侧信道
  if (expected.length !== sigBuf.length || !crypto.timingSafeEqual(sigBuf, expected)) return null

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
