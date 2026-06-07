export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { syncAutoStock } from '@/lib/cardkey'

const productSchema = z.object({
  categoryId: z.number(),
  name: z.string().min(1, '请输入商品名称'),
  description: z.string().optional().nullable(),
  price: z.number().min(0, '价格不能为负'),
  originalPrice: z.number().optional().nullable(),
  image: z.string().optional().nullable(),
  stock: z.number().default(-1),
  sortOrder: z.number().default(0),
  status: z.number().default(1),
  deliveryType: z.enum(['MANUAL', 'AUTO']).default('MANUAL'),
  cardUsage: z.string().optional().nullable(),
  features: z.string().optional().nullable(),
})

// 获取所有商品
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return success(products)
  } catch (err) {
    console.error('Get products error:', err)
    return error('获取商品列表失败')
  }
}

// 创建商品
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = productSchema.safeParse(body)

    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    const product = await prisma.product.create({
      data: result.data,
    })
    if (product.deliveryType === 'AUTO') await syncAutoStock(product.id)

    return success(product, '商品创建成功')
  } catch (err) {
    console.error('Create product error:', err)
    return error('创建商品失败')
  }
}
