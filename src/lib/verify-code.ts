import crypto from 'crypto'
import { prisma } from './db'

const TTL_MIN = 10 // 验证码有效期（分钟）
const RESEND_SECONDS = 60 // 重发冷却

export type CodePurpose = 'REGISTER' | 'RESET'

export function genCode(): string {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0')
}

// 是否过于频繁（60 秒内已发过）
export async function tooFrequent(email: string, purpose: CodePurpose): Promise<boolean> {
  const last = await prisma.emailCode.findFirst({
    where: { email, purpose },
    orderBy: { id: 'desc' },
  })
  if (!last) return false
  return Date.now() - last.createdAt.getTime() < RESEND_SECONDS * 1000
}

export async function createCode(email: string, purpose: CodePurpose): Promise<string> {
  // 作废该邮箱该用途的旧码
  await prisma.emailCode.updateMany({ where: { email, purpose, used: false }, data: { used: true } })
  const code = genCode()
  await prisma.emailCode.create({
    data: { email, code, purpose, expiresAt: new Date(Date.now() + TTL_MIN * 60_000) },
  })
  return code
}

// 校验并消费验证码：成功标记 used 并返回 true
export async function consumeCode(email: string, purpose: CodePurpose, code: string): Promise<boolean> {
  const rec = await prisma.emailCode.findFirst({
    where: { email, purpose, code: code.trim(), used: false, expiresAt: { gt: new Date() } },
    orderBy: { id: 'desc' },
  })
  if (!rec) return false
  await prisma.emailCode.update({ where: { id: rec.id }, data: { used: true } })
  return true
}
