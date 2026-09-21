export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { PUBLIC_PRODUCT_SELECT } from '@/lib/product-select'

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

    // 【必须 select 白名单，不能 include】include 会把整行吐给外网，
    // 里面有 referrerBasePrice（内推底价，等于公开毛利）和 cardRedeemUrl（上游货源站）。
    // 理由与清单见 lib/product-select.ts。status 单独取出来做上架判断，不进响应。
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { ...PUBLIC_PRODUCT_SELECT, status: true },
    })

    if (!product || product.status !== 1) {
      return notFound('商品不存在')
    }
    const { status: _status, ...pub } = product

    // 内推：带 ?ref=CODE 时用推广人专属价覆盖
    const ref = new URL(request.url).searchParams.get('ref')?.trim()
    if (ref) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: ref }, select: { id: true, status: true } })
      if (referrer && referrer.status === 1) {
        const rp = await prisma.referralPrice.findUnique({
          where: { userId_productId: { userId: referrer.id, productId } },
        })
        if (rp) {
          return success({ ...pub, price: rp.price, originalPrice: pub.originalPrice ?? pub.price })
        }
      }
    }

    return success(pub)
  } catch (err) {
    console.error('Get product error:', err)
    return error('获取商品详情失败')
  }
}
