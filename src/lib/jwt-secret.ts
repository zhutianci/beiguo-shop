/**
 * 登录 JWT 签名密钥。middleware（Edge）与 lib/auth（Node）共用 —— 本文件**不得 import 任何 Node 模块**。
 *
 * 规则同 lib/cron-auth：没有密钥 = 拒绝，绝不回落到人人都知道的默认值。
 * 以前是 `process.env.JWT_SECRET || 'your-secret-key'`：服务器 .env.production 里漏掉这一行，
 * 任何人都能用公开的默认值自签一张 userId=1 的管理员 token（2026-09-25 审计 G06）。
 *
 * 只硬拒「空值」与「代码里公开过的默认值」；过短或模板占位值只告警不拒绝——
 * 硬拒会在配置不合格时让全站登录与下单瘫痪，轮换是站长的运维决定。
 * 不 trim 原值：保证与已签发 token 的密钥字节完全一致（trim 只用来判空）。
 */
const PUBLIC_DEFAULT = 'your-secret-key'
const TEMPLATE_PLACEHOLDERS = new Set([
  'your-jwt-secret-key-change-this-in-production', // .env.example
  'change_this_to_a_very_long_random_secret_key', // .env.production.example
  'your_64_char_random_secret_here', // DEPLOY.md
])

let warnedMissing = false
let warnedWeak = false

/** 返回原值；未配置或为公开默认值时返回 null，调用方一律按鉴权失败处理 */
export function getJwtSecret(): string | null {
  const s = process.env.JWT_SECRET || ''
  if (!s.trim() || s === PUBLIC_DEFAULT) {
    if (!warnedMissing) {
      warnedMissing = true
      console.error('[auth] JWT_SECRET 未配置或为公开默认值：登录态一律拒绝。请在 .env.production 设置 openssl rand -base64 48 的结果并重建 app 容器')
    }
    return null
  }
  if (!warnedWeak && (s.length < 32 || TEMPLATE_PLACEHOLDERS.has(s))) {
    warnedWeak = true
    console.error('[auth] JWT_SECRET 过短或为模板占位值，建议轮换（当前登录不受影响）')
  }
  return s
}
