export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { syncAutoStock } from '@/lib/cardkey'

const updateProductSchema = z.object({
  categoryId: z.number().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  price: z.number().min(0).optional(),
  originalPrice: z.number().optional().nullable(),
  image: z.string().optional().nullable(),
  stock: z.number().optional(),
  sortOrder: z.number().optional(),
  status: z.number().optional(),
  deliveryType: z.enum(['MANUAL', 'AUTO', 'SMS']).optional(),
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

// 更新商品
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)

    if (isNaN(productId)) {
      return notFound('商品不存在')
    }

    const body = await request.json()
    const result = updateProductSchema.safeParse(body)

    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    // apiSku：未提交则不动；提交空串则清空为 null（避免唯一约束下多个 '' 冲突）
    const { apiSku, ...rest } = result.data
    const data = apiSku === undefined ? rest : { ...rest, apiSku: apiSku ? apiSku : null }

    const product = await prisma.product.update({
      where: { id: productId },
      data,
    })
    if (product.deliveryType === 'AUTO') await syncAutoStock(product.id)

    return success(product, '商品更新成功')
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return error('对外发卡 SKU 已被占用，请换一个')
    }
    console.error('Update product error:', err)
    return error('更新商品失败')
  }
}

// 删除商品
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)

    if (isNaN(productId)) {
      return notFound('商品不存在')
    }

    await prisma.product.delete({
      where: { id: productId },
    })

    return success(null, '商品删除成功')
  } catch (err) {
    console.error('Delete product error:', err)
    return error('删除商品失败')
  }
}
