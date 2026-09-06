/**
 * 快捷回复令牌。
 *
 * 用途：企业微信群机器人是单向的（只能发、收不到你在群里的回复），
 * 所以留言通知里带一条一键回复链接——点开就是手机端回复页，不用登录后台。
 *
 * 令牌本身就是凭证，所以设计上刻意收紧：
 *  - 只对【一张订单】有效，换不到其他订单的数据
 *  - 只能做两件事：读该订单的留言、以客服身份回一条
 *  - 有过期时间，签名用 HMAC-SHA256，密钥复用 JWT_SECRET
 *  - 不包含任何用户身份，泄露了也只影响这一张订单的对话
 *
 * 与收据 token 的区别：收据 token 是长期随机串存库；这里是自包含的签名令牌，
 * 不占数据库、不需要清理，过期即自动失效。
 */
import crypto from 'crypto'

const TTL_MS = Number(process.env.QUICK_REPLY_TTL_DAYS || 7) * 86400_000

function secret(): string {
  const s = process.env.JWT_SECRET || ''
  if (!s) throw new Error('JWT_SECRET 未配置，无法签发快捷回复令牌')
  return s
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url')
}

/** 生成令牌：<orderId>.<过期时间戳36进制>.<签名> */
export function issueQuickReplyToken(orderId: number, ttlMs = TTL_MS): string {
  const exp = Date.now() + ttlMs
  const payload = `${orderId}.${exp.toString(36)}`
  return `${payload}.${sign(payload)}`
}

export interface QuickReplyClaim {
  orderId: number
  expiresAt: Date
}

/** 校验令牌。任何一步不对都返回 null，不区分原因（不给试探者反馈） */
export function verifyQuickReplyToken(token: string): QuickReplyClaim | null {
  if (!token || token.length > 200) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [idStr, expStr, sig] = parts

  const payload = `${idStr}.${expStr}`
  const expected = sign(payload)
  // 定长比较，避免时序侧信道
  if (sig.length !== expected.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null

  const orderId = parseInt(idStr, 10)
  const exp = parseInt(expStr, 36)
  if (!orderId || !exp || Number.isNaN(exp)) return null
  if (Date.now() > exp) return null

  return { orderId, expiresAt: new Date(exp) }
}

/** 拼出完整的回复页地址，用于放进企业微信通知 */
export function quickReplyUrl(orderId: number): string {
  const base = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://bigolab.com').replace(/\/$/, '')
  return `${base}/reply/${issueQuickReplyToken(orderId)}`
}
