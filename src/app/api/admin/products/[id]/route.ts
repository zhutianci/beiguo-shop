export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
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
  deliveryType: z.enum(['MANUAL', 'AUTO']).optional(),
  referrerBasePrice: z.number().nonnegative().optional().nullable(),
  cardUsage: z.string().optional().nullable(),
  cardRedeemUrl: z
    .string()
    .trim()
    .refine((v) => v === '' || /^https?:\/\//i.test(v), '充值链接需以 http:// 或 https:// 开头')
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

    const product = await prisma.product.update({
      where: { id: productId },
      data: result.data,
    })
    if (product.deliveryType === 'AUTO') await syncAutoStock(product.id)

    return success(product, '商品更新成功')
  } catch (err) {
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
