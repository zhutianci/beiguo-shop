export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { ensureReferralCode } from '@/lib/referral'

// GET：内推码 + 收益概览 + 各商品基础价/我的专属价
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const code = await ensureReferralCode(user.id)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bigolab.com'
    const link = `${appUrl}/products?ref=${code}`

    const [me, products, myPrices, myBases, rewards] = await Promise.all([
      prisma.user.findUnique({ where: { id: user.id }, select: { balance: true } }),
      prisma.product.findMany({
        where: { status: 1 },
        select: { id: true, name: true, price: true, referrerBasePrice: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.referralPrice.findMany({ where: { userId: user.id } }),
      prisma.referrerBasePrice.findMany({ where: { userId: user.id } }),
      prisma.referralReward.findMany({ where: { referrerId: user.id, status: 'SETTLED' }, select: { amount: true } }),
    ])

    const priceMap = new Map(myPrices.map((p) => [p.productId, Number(p.price)]))
    const baseOverride = new Map(myBases.map((b) => [b.productId, Number(b.price)]))
    const list = products.map((p) => ({
      productId: p.id,
      name: p.name,
      // 我的基础价(进货价)：单独覆盖 → 商品默认推广价 → 网站售价
      basePrice: baseOverride.has(p.id)
        ? baseOverride.get(p.id)!
        : Number(p.referrerBasePrice ?? p.price),
      customPrice: priceMap.has(p.id) ? priceMap.get(p.id)! : null,
    }))

    const totalReward = rewards.reduce((s, r) => s + Number(r.amount), 0)

    return success({
      code,
      link,
      balance: Number(me?.balance ?? 0),
      totalReward: Math.round(totalReward * 100) / 100,
      rewardCount: rewards.length,
      products: list,
    })
  } catch (err) {
    console.error('Get referral error:', err)
    return error('获取失败')
  }
}

const saveSchema = z.object({
  prices: z.array(
    z.object({
      productId: z.number().int().positive(),
      price: z.number().nonnegative().nullable(), // null/0 => 取消专属价
    })
  ),
})

// POST：保存专属价（须 ≥ 基础售价；空/0 取消）
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    await ensureReferralCode(user.id)

    const body = await request.json()
    const parsed = saveSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const ids = parsed.data.prices.map((p) => p.productId)
    const [products, overrides] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, price: true, referrerBasePrice: true } }),
      prisma.referrerBasePrice.findMany({ where: { userId: user.id, productId: { in: ids } } }),
    ])
    const defBase = new Map(products.map((p) => [p.id, Number(p.referrerBasePrice ?? p.price)]))
    const ovBase = new Map(overrides.map((o) => [o.productId, Number(o.price)]))
    const baseOf = (pid: number) => (ovBase.has(pid) ? ovBase.get(pid)! : defBase.get(pid))

    for (const item of parsed.data.prices) {
      const base = baseOf(item.productId)
      if (base == null) continue
      if (item.price == null || item.price <= 0) {
        await prisma.referralPrice.deleteMany({ where: { userId: user.id, productId: item.productId } })
        continue
      }
      if (item.price < base) {
        return error(`专属价不能低于你的基础价（¥${base.toFixed(2)}）`)
      }
      await prisma.referralPrice.upsert({
        where: { userId_productId: { userId: user.id, productId: item.productId } },
        create: { userId: user.id, productId: item.productId, price: item.price },
        update: { price: item.price },
      })
    }

    return success({ ok: true }, '已保存')
  } catch (err) {
    console.error('Save referral prices error:', err)
    return error('保存失败')
  }
}
