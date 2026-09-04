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

// 获取商品列表
// 向后兼容：默认仍返回裸数组（卡密管理页、卡密分析组件依赖这个形状）；
// 传 paged=1 时才返回分页结构 { list, total, page, pageSize, totalPages }。
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paged = searchParams.get('paged') === '1'
    const keyword = searchParams.get('keyword')?.trim()
    const categoryId = parseInt(searchParams.get('categoryId') || '0')
    const status = searchParams.get('status')

    const where: Prisma.ProductWhereInput = {}
    if (keyword) where.name = { contains: keyword }
    if (categoryId) where.categoryId = categoryId
    if (status === '0' || status === '1') where.status = parseInt(status)

    const include = { category: { select: { id: true, name: true } } }
    const orderBy: Prisma.ProductOrderByWithRelationInput[] = [
      { sortOrder: 'asc' },
      { createdAt: 'desc' },
    ]

    if (!paged) {
      // 旧调用方：无参数调用，行为不变（仅加 take 上限兜底）
      const products = await prisma.product.findMany({ where, include, orderBy, take: 1000 })
      return success(products)
    }

    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20'), 1), 100)

    const [list, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ])

    return success({ list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) })
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
