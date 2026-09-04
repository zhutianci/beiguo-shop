export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

const categorySchema = z.object({
  name: z.string().min(1, '请输入分类名称'),
  icon: z.string().optional().nullable(),
  sortOrder: z.number().default(0),
  status: z.number().default(1),
})

// 获取所有分类
// 分类是运营手工维护的枚举型数据（十几条量级），不做分页；仅加 take 上限兜底，
// 保证异常情况下也不会一次性把整表读进内存。返回仍是裸数组（商品页的分类下拉依赖它）。
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
      take: 200,
    })

    return success(categories)
  } catch (err) {
    console.error('Get categories error:', err)
    return error('获取分类列表失败')
  }
}

// 创建分类
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = categorySchema.safeParse(body)

    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    const category = await prisma.category.create({
      data: result.data,
    })

    return success(category, '分类创建成功')
  } catch (err) {
    console.error('Create category error:', err)
    return error('创建分类失败')
  }
}
