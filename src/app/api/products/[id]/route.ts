export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { PUBLIC_PRODUCT_SELECT } from '@/lib/product-select'
import { publicStock } from '@/lib/stock-level'
import { effectiveBasePrice, referralSellUnit } from '@/lib/referral'
import { getStorefront } from '@/lib/storefront/resolve'
import { getStorefrontProduct } from '@/lib/pricing'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 店面解析不进 try（设计 4.4 第 7 条）
  const sf = await getStorefront()
  if (!sf) return notFound('商品不存在')
  try {
    const { id } = await params
    const productId = parseInt(id)

    if (isNaN(productId)) {
      return notFound('商品不存在')
    }

    /*
     * 【渠道站】商品不在本店可售（没上架、没授权、进货价未配、站长已下架）一律「商品不存在」；
     * price = 本店售价，ref 忽略，没有站长价 / 进货价（lib/pricing.ts）。下面的主站分支一行没动。
     */
    if (sf.kind === 'CHANNEL') {
      const previewUserId = sf.status === 'DRAFT' ? ((await getCurrentUser())?.id ?? null) : null
      const p = await getStorefrontProduct(sf, productId, { previewUserId })
      return p ? success(p) : notFound('商品不存在')
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
    // 库存只下发档位代表值（lib/stock-level.ts publicStock）
    const { status: _status, stock, ...rest } = product
    const pub = { ...rest, stock: publicStock(stock) }

    // 内推：带 ?ref=CODE 时用推广人专属价覆盖
    const ref = new URL(request.url).searchParams.get('ref')?.trim()
    if (ref) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: ref }, select: { id: true, status: true } })
      if (referrer && referrer.status === 1) {
        const rp = await prisma.referralPrice.findUnique({
          where: { userId_productId: { userId: referrer.id, productId } },
        })
        if (rp) {
          // 专属价低于推广人当前基础价（站长保存后又涨了价）→ 显示基础价，与建单实收同一口径（lib/referral.ts）。
          // 保持 Decimal 类型：JSON 形状不变；仍不单独下发 referrerBasePrice
          const list = Number(pub.price)
          const effBase = (await effectiveBasePrice(referrer.id, productId)) ?? list
          const unit = referralSellUnit(Number(rp.price), effBase, list)
          const price = unit === Number(rp.price) ? rp.price : new Prisma.Decimal(unit.toFixed(2))
          return success({ ...pub, price, originalPrice: pub.originalPrice ?? pub.price })
        }
      }
    }

    return success(pub)
  } catch (err) {
    console.error('Get product error:', err)
    return error('获取商品详情失败')
  }
}
