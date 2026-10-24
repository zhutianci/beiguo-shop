/**
 * SmsForwarder Webhook 签名校验（2026-10-24 第二轮加固 P2，docs/安全-第二轮加固-1024.md 2.1；用在 api/pay/sms-notify）。
 *
 * SmsForwarder 的 Webhook 填了「Secret」之后，请求体里的 [timestamp] / [sign] 占位符被替换成毫秒时间戳与
 *   sign = URL 编码( Base64( HMAC-SHA256(key = secret, msg = timestamp + "\n" + secret) ) )（源码 utils/sender/WebhookUtils.kt）。
 * secret 本身不出现在请求里；只认 windowMs 内的时间戳，处理成功的签名作废（重放无效）。
 * 抽成独立模块是为了能单测（scripts/check-security-1015.ts）；路由里不再自己拼 HMAC。
 */
import crypto from 'crypto'

export const SIGN_WINDOW_MS = 10 * 60_000

export type SignReject = 'no_sign' | 'stale' | 'bad_sign' | 'replay'

/** 与 SmsForwarder 相同的算法（未 URL 编码的 Base64） */
export function smsForwarderSign(secret: string, timestamp: string): string {
  return crypto.createHmac('sha256', secret).update(`${timestamp}\n${secret}`, 'utf8').digest('base64')
}

/** 各自 sha256 成定长再比，长度不同也不短路；空串一律不通过 */
function safeEqual(a: string, b: string): boolean {
  if (!a || !b) return false
  const x = crypto.createHash('sha256').update(a).digest()
  const y = crypto.createHash('sha256').update(b).digest()
  return crypto.timingSafeEqual(x, y)
}

export interface SignVerifier {
  /** reason = null 表示通过；key 用于处理成功后 markUsed */
  check(timestamp: string, sign: string, now?: number): { reason: SignReject | null; key: string }
  markUsed(key: string, now?: number): void
}

/**
 * 处理成功的签名（timestamp|sign → 到期时间）记在进程内：发版清空后，窗口内的旧签名理论上能再用一次，
 * 但重放的是同一条通知原文，lib/vmq.ts 按原文摘要去重（vmq_seen:*），不会二次入账。
 */
export function createSignVerifier(secret: string, windowMs: number = SIGN_WINDOW_MS): SignVerifier {
  const used = new Map<string, number>()
  return {
    check(timestamp, sign, now = Date.now()) {
      if (!secret) return { reason: 'bad_sign', key: '' }
      if (!timestamp || !sign) return { reason: 'no_sign', key: '' }
      if (!/^\d{12,14}$/.test(timestamp)) return { reason: 'bad_sign', key: '' }
      if (Math.abs(now - Number(timestamp)) > windowMs) return { reason: 'stale', key: '' }
      let provided = sign
      try {
        // 请求体里是 URL 编码过的 Base64（+ / = 被编码）；容忍已解码的写法
        if (/%[0-9A-Fa-f]{2}/.test(provided)) provided = decodeURIComponent(provided)
      } catch {
        return { reason: 'bad_sign', key: '' }
      }
      if (!safeEqual(provided, smsForwarderSign(secret, timestamp))) return { reason: 'bad_sign', key: '' }
      const key = `${timestamp}|${provided}`
      if (used.size > 2000) used.forEach((exp, k) => exp < now && used.delete(k))
      const exp = used.get(key)
      if (exp !== undefined && exp > now) return { reason: 'replay', key }
      return { reason: null, key }
    },
    markUsed(key, now = Date.now()) {
      if (key) used.set(key, now + 2 * windowMs)
    },
  }
}
