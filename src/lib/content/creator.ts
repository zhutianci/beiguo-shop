/**
 * 作者公开主页的短码（/u/{handle}）。理由见 schema 里 CreatorProfile 的注释：不能用自增 userId。
 */
import crypto from 'crypto'
import { prisma } from '../db'

const HANDLE_RE = /^[a-z0-9]{8}$/

export function isHandle(s: string): boolean {
  return HANDLE_RE.test(s)
}

function newHandle(): string {
  // 8 位 [a-z0-9]：36^8 ≈ 2.8e12，撞了就重试
  const bytes = crypto.randomBytes(8)
  return Array.from(bytes, (b) => '0123456789abcdefghijklmnopqrstuvwxyz'[b % 36]).join('')
}

/** 取（没有就建）某个会员的短码。并发两次同时建时，唯一约束保证只有一个成功，另一个读回已有的 */
export async function ensureHandle(userId: number): Promise<string> {
  const existing = await prisma.creatorProfile.findUnique({ where: { userId }, select: { handle: true } })
  if (existing) return existing.handle
  for (let i = 0; i < 5; i++) {
    try {
      const row = await prisma.creatorProfile.create({ data: { userId, handle: newHandle() }, select: { handle: true } })
      return row.handle
    } catch {
      const again = await prisma.creatorProfile.findUnique({ where: { userId }, select: { handle: true } })
      if (again) return again.handle
    }
  }
  throw new Error('creator handle: 连续 5 次生成失败')
}

/** 作者链接：只给会员；建不出来（库异常）就不给链接，不影响页面渲染 */
export async function authorHref(userId: number | null): Promise<string | null> {
  if (!userId) return null
  try {
    return `/u/${await ensureHandle(userId)}`
  } catch (e) {
    console.error('[creator authorHref]', e)
    return null
  }
}
