export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { PUBLIC_PRODUCT_SELECT } from '@/lib/product-select'
import { publicStock } from '@/lib/stock-level'
import { effectiveBasePrices, referralSellUnit } from '@/lib/referral'

// 商品列表
// 向后兼容：不传 page 时返回裸数组（旧行为）；传了 page 才返回 { list, total, page, pageSize, totalPages }
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    // 分类筛选：新参数 categoryId，兼容旧参数 category
    const categoryRaw = searchParams.get('categoryId') ?? searchParams.get('category')

    const where: { status: number; categoryId?: number } = { status: 1 }
    if (categoryRaw) {
      const cid = parseInt(categoryRaw)
      if (!Number.isNaN(cid)) where.categoryId = cid
    }

    // 分页参数（可选）
    const pageRaw = searchParams.get('page')
    const paged = pageRaw !== null
    const page = Math.max(parseInt(pageRaw || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '24') || 24, 1), 60)

    const [rows, total] = await Promise.all([
      prisma.product.findMany({
        where,
        // 【必须 select 白名单，不能 include】理由与清单见 lib/product-select.ts：
        // include 会把 referrerBasePrice（内推底价）和 cardRedeemUrl（上游货源站）一起发给外网。
        select: PUBLIC_PRODUCT_SELECT,
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'desc' },
          { id: 'desc' }, // 兜底排序，保证翻页结果稳定（不重不漏）
        ],
        ...(paged ? { skip: (page - 1) * pageSize, take: pageSize } : {}),
      }),
      paged ? prisma.product.count({ where }) : Promise.resolve(0),
    ])

    // 库存只下发档位代表值（精确数 = 同行能算出备货节奏），理由见 lib/stock-level.ts 的 publicStock
    const products = rows.map((p) => ({ ...p, stock: publicStock(p.stock) }))

    // 内推：带 ?ref=CODE 时，用推广人的「专属价」覆盖售价（只查本页商品）
    let list = products
    const ref = searchParams.get('ref')?.trim()
    if (ref && products.length > 0) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: ref }, select: { id: true, status: true } })
      if (referrer && referrer.status === 1) {
        const ids = products.map((p) => p.id)
        const [rps, bases] = await Promise.all([
          prisma.referralPrice.findMany({ where: { userId: referrer.id, productId: { in: ids } } }),
          effectiveBasePrices(referrer.id, ids),
        ])
        const priceMap = new Map(rps.map((r) => [r.productId, r.price]))
        list = products.map((p) => {
          const custom = priceMap.get(p.id)
          if (custom == null) return p
          // 专属价低于推广人当前基础价 → 显示基础价，与建单实收同一口径（lib/referral.ts referralSellUnit）。
          // 没被兜底时原样返回 Decimal，JSON 形状与类型推断都不变
          const list0 = Number(p.price)
          const unit = referralSellUnit(Number(custom), bases.get(p.id) ?? list0, list0)
          const price = unit === Number(custom) ? custom : new Prisma.Decimal(unit.toFixed(2))
          return { ...p, price, originalPrice: p.originalPrice ?? p.price }
        })
      }
    }

    if (!paged) return success(list)

    return success({
      list,
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    })
  } catch (err) {
    console.error('Get products error:', err)
    return error('获取商品列表失败')
  }
}
