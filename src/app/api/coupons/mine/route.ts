export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { calcCoupon, couponLabel, grantUsable, parseProductIds, type GrantState } from '@/lib/coupon'

/**
 * 我的券。个人中心与结算页共用这一个接口。
 *
 * 【不返回券 id 的原始值】站长明确要求「买家可在个人账户查询可用的券（不展示券 id）」。
 * 但结算页要选券又必须有个标识 —— 所以这里返回的是 grant.id（用户自己的券实例 id），
 * 它只对本人有意义：所有用到它的接口都会校验 grant.userId === 当前登录用户，
 * 拿到别人的 id 也用不了。页面上不展示这个数字，只用于表单取值。
 *
 * 传 productId + quantity 时，会顺带算出每张券在这一单上能不能用、能减多少，
 * 这样结算页不用自己复刻一遍规则（复刻就会两处算得不一样）。
 */

const schema = z.object({
  productId: z.coerce.number().int().positive().optional(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
  /** 只看可用的（结算页用）还是全部（个人中心用） */
  usableOnly: z.enum(['0', '1']).default('0'),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const parsed = schema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const { productId, quantity, usableOnly } = parsed.data

    const now = new Date()

    // 顺手把过期的券刷成 EXPIRED。放在读接口里做是刻意的：
    // 买家一进个人中心就能看到真实状态，不用等某个定时任务跑过
    await prisma.couponGrant
      .updateMany({
        where: { userId: user.id, state: 'AVAILABLE', expiresAt: { not: null, lte: now } },
        data: { state: 'EXPIRED' },
      })
      .catch(() => {})

    const grants = await prisma.couponGrant.findMany({
      where: {
        userId: user.id,
        ...(usableOnly === '1' ? { state: 'AVAILABLE' } : {}),
      },
      orderBy: [{ state: 'asc' }, { expiresAt: 'asc' }, { id: 'desc' }],
      take: 100,
      include: {
        coupon: {
          select: { kind: true, minAmount: true, discount: true, productIds: true, name: true, status: true },
        },
      },
    })

    // 结算页场景：算出这一单能不能用、减多少
    let baseAmount = 0
    if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId }, select: { price: true } })
      if (product) baseAmount = Math.round(Number(product.price) * quantity * 100) / 100
    }

    const list = grants.map((g) => {
      const rule = {
        kind: g.coupon.kind as 'THRESHOLD' | 'PRODUCT',
        minAmount: Number(g.coupon.minAmount),
        discount: Number(g.coupon.discount),
        productIds: parseProductIds(g.coupon.productIds),
      }
      const usable = grantUsable({ state: g.state as GrantState, expiresAt: g.expiresAt }, now)
      // 批次被管理员 ENDED 之后，已发出的券一并失效
      const batchDead = g.coupon.status === 'ENDED'

      let applicable: boolean | null = null
      let discount = 0
      let reason: string | null = usable.ok ? null : usable.reason
      if (batchDead) {
        applicable = false
        reason = '该活动已结束'
      } else if (productId && baseAmount > 0 && usable.ok) {
        // 这里只判「券本身能不能用在这个商品/金额上」，不比内推 ——
        // 内推与券取更优是下单时的事，结算页展示券面额即可，否则文案会很难解释
        const calc = calcCoupon(rule, { productId, baseAmount, referralAmount: baseAmount })
        applicable = calc.usable
        discount = calc.discount
        if (!calc.usable && calc.reject) {
          reason =
            calc.reject === 'KIND_PRODUCT_MISMATCH'
              ? '该券只能用于指定商品'
              : calc.reject === 'BELOW_THRESHOLD'
                ? `订单需满 ¥${rule.minAmount.toFixed(2)} 才能使用`
                : '该券在这一单上抵扣不了金额'
        }
      }

      return {
        // 只对本人有意义的实例 id，页面不展示，仅作表单取值
        id: g.id,
        name: g.coupon.name,
        label: couponLabel(rule),
        kind: rule.kind,
        minAmount: rule.minAmount,
        discount: rule.discount,
        state: batchDead && g.state === 'AVAILABLE' ? 'VOID' : g.state,
        expiresAt: g.expiresAt,
        /** 长期有效 */
        forever: !g.expiresAt,
        applicable,
        applicableDiscount: discount,
        reason,
      }
    })

    return success({
      list: usableOnly === '1' ? list.filter((c) => c.state === 'AVAILABLE') : list,
      counts: {
        available: list.filter((c) => c.state === 'AVAILABLE').length,
        locked: list.filter((c) => c.state === 'LOCKED').length,
        used: list.filter((c) => c.state === 'USED').length,
      },
    })
  } catch (err) {
    console.error('List my coupons error:', err)
    return error('获取优惠券失败')
  }
}
