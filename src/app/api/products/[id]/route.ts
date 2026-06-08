export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id)

    if (isNaN(productId)) {
      return notFound('商品不存在')
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!product || product.status !== 1) {
      return notFound('商品不存在')
    }

    // 内推：带 ?ref=CODE 时用推广人专属价覆盖
    const ref = new URL(request.url).searchParams.get('ref')?.trim()
    if (ref) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: ref }, select: { id: true, status: true } })
      if (referrer && referrer.status === 1) {
        const rp = await prisma.referralPrice.findUnique({
          where: { userId_productId: { userId: referrer.id, productId } },
        })
        if (rp) {
          return success({ ...product, price: rp.price, originalPrice: product.originalPrice ?? product.price })
        }
      }
    }

    return success(product)
  } catch (err) {
    console.error('Get product error:', err)
    return error('获取商品详情失败')
  }
}
