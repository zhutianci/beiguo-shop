/**
 * 快捷回复令牌。
 *
 * 用途：企业微信群机器人是单向的（只能发、收不到你在群里的回复），
 * 所以留言通知里带一条一键回复链接——点开就是手机端回复页，不用登录后台。
 *
 * 令牌本身就是凭证，所以设计上刻意收紧：
 *  - 只对【一张订单】有效，换不到其他订单的数据
 *  - 只能做两件事：读该订单的留言、以客服身份回一条
 *  - 有过期时间，签名用 HMAC-SHA256，密钥复用 JWT_SECRET（见下方 rootKey() 的说明）
 *  - 不包含任何用户身份，泄露了也只影响这一张订单的对话
 *
 * 与收据 token 的区别：收据 token 是长期随机串存库；这里是自包含的签名令牌，
 * 不占数据库、不需要清理，过期即自动失效。
 */
import crypto from 'crypto'
import { getJwtSecret } from './jwt-secret'

const TTL_MS = Number(process.env.QUICK_REPLY_TTL_DAYS || 7) * 86400_000

/**
 * 密钥（审计 G10）：仍是 getJwtSecret()（= JWT_SECRET，与登录 JWT 同一把），刻意不换派生子密钥。
 * 子密钥从同一把根密钥派生，解决不了「轮换 JWT_SECRET 牵连这类链接」的问题，
 * 反而要么让群里已发出的链接当场失效、要么得挂一个带截止日的新旧双密钥过渡窗口，镜像一回滚新链接又全废。
 * 真正挡住「登录 JWT 被当成回复令牌」的是 verifyQuickReplyToken 里的显式格式白名单：
 * JWT 的 header 恒以 eyJ 开头，过不了「orderId 纯数字」这一关。
 * 以后要放宽格式时，务必先确认登录 JWT 仍然过不了白名单（scripts/check-action-tokens.ts 钉着）。
 */
function rootKey(): string | null {
  return getJwtSecret() // 未配置 / 公开默认值时为 null：签发抛错、验签一律 null（fail closed）
}

function sign(payload: string, key: string): string {
  return crypto.createHmac('sha256', key).update(payload).digest('base64url')
}

/** 生成令牌：<orderId>.<过期时间戳36进制>.<签名> */
export function issueQuickReplyToken(orderId: number, ttlMs = TTL_MS): string {
  const root = rootKey()
  // 调用方（notifyBuyerMessage）会 catch，回落到后台链接
  if (!root) throw new Error('JWT_SECRET 未配置，无法签发快捷回复令牌')
  if (!Number.isSafeInteger(orderId) || orderId <= 0) throw new Error('orderId 非法')
  const exp = Date.now() + ttlMs
  const payload = `${orderId}.${exp.toString(36)}`
  return `${payload}.${sign(payload, root)}`
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
  // 显式格式白名单（签发端格式：orderId 纯数字、exp 为 36 进制小写、签名为 SHA256 的 43 位 base64url）。
  // 同密钥时代的登录 JWT（header 恒以 eyJ 开头，不是纯数字）在这里就被拒，
  // 不再依赖后面 parseInt 恰好得 NaN 这种隐式行为。
  if (!/^[1-9]\d{0,9}$/.test(idStr)) return null
  if (!/^[0-9a-z]{1,11}$/.test(expStr)) return null
  if (!/^[A-Za-z0-9_-]{43}$/.test(sig)) return null

  const payload = `${idStr}.${expStr}`
  const root = rootKey()
  if (!root) return null
  const sigBuf = Buffer.from(sig)
  const expected = Buffer.from(sign(payload, root))
  // 定长比较，避免时序侧信道
  if (expected.length !== sigBuf.length || !crypto.timingSafeEqual(sigBuf, expected)) return null

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
