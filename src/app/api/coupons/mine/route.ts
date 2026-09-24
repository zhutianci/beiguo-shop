export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { quoteOrder, couponLabel, grantUsable, parseProductIds, rejectReason, type GrantState } from '@/lib/coupon'

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
  /** 内推码。带了才能算出「服务端真正会收多少」，否则结算页会显示错的价 */
  ref: z.string().trim().max(40).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const parsed = schema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const { productId, quantity, usableOnly, ref } = parsed.data

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
          select: {
            kind: true,
            minAmount: true,
            discount: true,
            productIds: true,
            name: true,
            status: true,
            source: true,
          },
        },
      },
    })

    /*
     * 结算页场景：算出这一单能不能用、减多少、最终付多少。
     *
     * 【必须自己查定价，不能信前端传来的价】带 ?ref= 访问时 /api/products 会把
     * 返回给前端的 price **覆盖成推广专属价**，前端手里那个数不是定价。
     * 这里直接读库拿定价，再单独查专属价，两者都交给 quoteOrder ——
     * 这样结算页显示的就是服务端建单时会算出的同一个数。
     */
    let listPrice = 0
    let referralUnitPrice: number | null = null
    if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId }, select: { price: true } })
      if (product) listPrice = Number(product.price)

      if (ref && listPrice > 0) {
        const referrer = await prisma.user.findUnique({
          where: { referralCode: ref },
          select: { id: true, status: true },
        })
        if (referrer && referrer.status === 1 && referrer.id !== user.id) {
          const rp = await prisma.referralPrice.findUnique({
            where: { userId_productId: { userId: referrer.id, productId } },
          })
          // 推广人没单独设价时按网站定价卖，与下单接口口径一致
          referralUnitPrice = rp ? Number(rp.price) : listPrice
        }
      }
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
      let finalAmount: number | null = null
      let reason: string | null = usable.ok ? null : usable.reason
      if (batchDead) {
        applicable = false
        reason = '该活动已结束'
      } else if (productId && listPrice > 0 && usable.ok) {
        // 用与下单接口**同一个** quoteOrder，保证页面显示的价就是将来实收的价
        const q = quoteOrder({ productId, listPrice, quantity, referralUnitPrice, rule })
        applicable = q.applied === 'coupon'
        discount = q.discount
        finalAmount = q.amount
        if (!applicable) {
          // 门槛类单独给一句带具体金额的话，比通用文案更好懂；其余走全站统一的 rejectReason
          reason =
            q.reject === 'BELOW_THRESHOLD'
              ? `订单需满 ¥${rule.minAmount.toFixed(2)} 才能使用`
              : q.reject
                ? rejectReason(q.reject)
                : '本单用不上这张券'
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
        /** 选了这张券之后服务端会收的钱。前台直接显示这个数，不要自己再算 */
        finalAmount,
        reason,
        /** 批次来源：null = 公开领取的活动券；'LOTTERY' = 「下单有奖」抽中的券 */
        source: g.coupon.source,
        fromLottery: g.coupon.source === 'LOTTERY',
      }
    })

    const baselineQuote =
      productId && listPrice > 0
        ? quoteOrder({ productId, listPrice, quantity, referralUnitPrice, rule: null })
        : null

    /*
     * 【内推单直接把券列表清空】规则是「走内推就不能用券」。
     * 与其返回一串全都标着「本单不可用」的券让买家在结算页上困惑，
     * 不如一张都不给 —— 前台据 referral 标志整块隐藏优惠券区。
     * usableOnly=1 是结算页在问，个人中心（usableOnly=0）仍要看到自己所有的券。
     */
    const isReferral = referralUnitPrice != null
    const visible = usableOnly === '1' ? (isReferral ? [] : list.filter((c) => c.state === 'AVAILABLE')) : list

    return success({
      list: visible,
      /** 这一单是不是内推单。true 时前台应隐藏整个优惠券区并说明原因 */
      referral: isReferral,
      /** 不使用任何券时应付多少（内推单即专属价）。前台直接显示这个数，不要自己算 */
      baseline: baselineQuote ? baselineQuote.amount : null,
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
