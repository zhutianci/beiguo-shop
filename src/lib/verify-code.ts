import crypto from 'crypto'
import { prisma } from './db'
import { rateLimited } from './news/rate-limit'

const TTL_MIN = 10 // 验证码有效期（分钟）
const RESEND_SECONDS = 60 // 重发冷却
// 每张码最多校验 5 次。6 位码不限次数就是可以穷举的（2026-09-25 审计：找回密码可在
// 几小时内猜中任意账号的码，包括后台管理员）。第 6 次起这张码作废，需要重新获取。
const MAX_ATTEMPTS = 5

// LOOKUP：匿名「邮箱查订阅」证明邮箱归属（lib/email-proof.ts）。EmailCode.purpose 是 VarChar(20)，不用改表
// NOTICE（二期改动 3.2）：渠道站长把「通知邮箱」设成非登录邮箱时证明归属（tenant/partner-facade.ts 发码与校验）。
//   单独一个用途：码不能拿去注册 / 找回密码，反之亦然；lib/marketing/audience.ts 只认 REGISTER，不受影响
export type CodePurpose = 'REGISTER' | 'RESET' | 'LOOKUP' | 'NOTICE'
export type ConsumeResult = 'OK' | 'INVALID' | 'TOO_MANY'

export function genCode(): string {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0')
}

// 是否过于频繁（60 秒内已发过）。进程内的同步冷却在 lib/auth-throttle.ts，这里是容器重启后的数据库兜底
export async function tooFrequent(email: string, purpose: CodePurpose): Promise<boolean> {
  const last = await prisma.emailCode.findFirst({
    where: { email, purpose },
    orderBy: { id: 'desc' },
  })
  if (!last) return false
  return Date.now() - last.createdAt.getTime() < RESEND_SECONDS * 1000
}

export async function createCode(email: string, purpose: CodePurpose): Promise<string> {
  // 作废该邮箱该用途的旧码。用「立即过期」而不是 used=true：
  // lib/marketing/audience.ts 把「REGISTER 且 used=true」当作「邮箱验证过」，
  // 被作废的码不能冒充一次成功验证
  await prisma.emailCode.updateMany({
    where: { email, purpose, used: false, expiresAt: { gt: new Date() } },
    data: { expiresAt: new Date() },
  })
  const code = genCode()
  await prisma.emailCode.create({
    data: { email, code, purpose, expiresAt: new Date(Date.now() + TTL_MIN * 60_000) },
  })
  return code
}

/**
 * 校验并消费验证码。
 *  - 只认该邮箱该用途**最新一张**有效码（createCode 会作废旧码）
 *  - **先记次再比对**：按码 id 计数，同步调用，并发猜测也只有前 MAX_ATTEMPTS 个能走到比对；
 *    发新码自然清零（新码新 id）
 *  - 消费用 CAS（where used=false 且未过期），并发双提交只有一个成功
 */
export async function consumeCode(email: string, purpose: CodePurpose, code: string): Promise<ConsumeResult> {
  const rec = await prisma.emailCode.findFirst({
    where: { email, purpose, used: false, expiresAt: { gt: new Date() } },
    orderBy: { id: 'desc' },
  })
  if (!rec) return 'INVALID'
  if (rateLimited(`vcf:${rec.id}`, { windowMs: TTL_MIN * 60_000, max: MAX_ATTEMPTS })) {
    // 同上，用过期作废而不是 used=true
    await prisma.emailCode.updateMany({ where: { id: rec.id, used: false }, data: { expiresAt: new Date() } })
    return 'TOO_MANY'
  }
  const a = Buffer.from(code.trim())
  const b = Buffer.from(rec.code)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return 'INVALID'
  const r = await prisma.emailCode.updateMany({
    where: { id: rec.id, used: false, expiresAt: { gt: new Date() } },
    data: { used: true },
  })
  return r.count === 1 ? 'OK' : 'INVALID'
}
