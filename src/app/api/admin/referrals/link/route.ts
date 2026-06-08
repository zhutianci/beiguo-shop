export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

const schema = z.object({ userId: z.number().int().positive() })

// 删除内推链接：清除推广人内推码 + 其专属价/单独基础价（返现历史与余额保留）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const { userId } = parsed.data

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { referralCode: null } }),
      prisma.referralPrice.deleteMany({ where: { userId } }),
      prisma.referrerBasePrice.deleteMany({ where: { userId } }),
    ])
    return success({ ok: true }, '已删除该推广人的内推链接')
  } catch (err) {
    console.error('Delete referral link error:', err)
    return error('删除失败')
  }
}
