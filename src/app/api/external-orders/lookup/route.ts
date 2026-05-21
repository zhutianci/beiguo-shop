export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

const querySchema = z.object({
  email: z.string().email('请输入正确的邮箱'),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const result = querySchema.safeParse({ email: searchParams.get('email') })
    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    const orders = await prisma.externalOrder.findMany({
      where: { claudeAccount: result.data.email.trim().toLowerCase() },
      orderBy: [{ expireDate: 'desc' }, { startDate: 'desc' }],
      select: {
        id: true,
        startDate: true,
        expireDate: true,
        subscriptionType: true,
        xianyuNickname: true,
        claudeAccount: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return success({ orders, count: orders.length })
  } catch (err) {
    console.error('Lookup error:', err)
    return error('查询失败')
  }
}
