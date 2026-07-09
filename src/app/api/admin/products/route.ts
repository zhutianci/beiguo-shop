export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
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
  deliveryType: z.enum(['MANUAL', 'AUTO', 'SMS']).default('MANUAL'),
  smsService: z.string().trim().max(40).optional().nullable(),
  smsCountry: z.string().trim().max(40).optional().nullable(),
  smsMaxPrice: z.number().nonnegative().optional().nullable(),
  referrerBasePrice: z.number().nonnegative().optional().nullable(),
  cardUsage: z.string().optional().nullable(),
  cardRedeemUrl: z
    .string()
    .trim()
    .refine((v) => v === '' || /^https?:\/\//i.test(v), '充值链接需以 http:// 或 https:// 开头')
    .optional()
    .nullable(),
  apiSku: z
    .string()
    .trim()
    .max(64)
    .regex(/^[A-Za-z0-9_.:-]*$/, '对外发卡 SKU 仅允许字母、数字和 _ . - :')
    .optional()
    .nullable(),
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

    // 空 SKU 归一为 null（唯一约束下多个 '' 会冲突，多个 null 不会）
    const { apiSku, ...rest } = result.data
    const data = { ...rest, apiSku: apiSku ? apiSku : null }

    const product = await prisma.product.create({ data })
    if (product.deliveryType === 'AUTO') await syncAutoStock(product.id)

    return success(product, '商品创建成功')
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return error('对外发卡 SKU 已被占用，请换一个')
    }
    console.error('Create product error:', err)
    return error('创建商品失败')
  }
}
