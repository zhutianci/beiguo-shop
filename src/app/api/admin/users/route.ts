export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

// 获取所有用户：关键词（服务端检索，避免只搜当前页）+ 分页
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = (searchParams.get('keyword') || '').trim()
    const page = Math.max(parseInt(searchParams.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20') || 20, 1), 100)

    const where: Prisma.UserWhereInput = {}
    if (keyword) {
      const or: Prisma.UserWhereInput[] = [
        { email: { contains: keyword } },
        { nickname: { contains: keyword } },
        { phone: { contains: keyword } },
        { referralCode: { contains: keyword } },
      ]
      // 纯数字关键词同时按用户 ID 精确匹配
      const asId = Number(keyword)
      if (Number.isInteger(asId) && asId > 0) or.push({ id: asId })
      where.OR = or
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          nickname: true,
          avatar: true,
          balance: true,
          vipLevel: true,
          role: true,
          status: true,
          createdAt: true,
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ])

    return success({
      list: users,
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    })
  } catch (err) {
    console.error('Get users error:', err)
    return error('获取用户列表失败')
  }
}
