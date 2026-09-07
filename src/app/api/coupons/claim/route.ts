export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { claimHash, couponClaimable, couponLabel, parseProductIds } from '@/lib/coupon'

/**
 * 领券。**必须登录**（站长要求：券绑定到具体账户，只能本人在有效期内使用）。
 *
 * 三限（每 IP / 每账户 / 每浏览器各 1 张）全部靠**数据库唯一约束**保证，
 * 不用「先查有没有领过、再插入」那种写法 —— 那在并发下必然失效：
 * 同一个人同时点两下，两个请求都能查到「没领过」，然后各插一条。
 * 这里改成先插三行 CouponClaim（唯一约束 [couponId, scope, value]），
 * 谁插进去谁算领到，冲突方直接被数据库拦下。
 */

const schema = z.object({
  code: z.string().trim().min(1, '缺少活动码').max(32),
})

/** 真实客户端 IP。Cloudflare Tunnel 在最前面，cf-connecting-ip 才是来源 IP。
 *  取错了会变成全站共用一个内网地址，「每 IP 一张」这条限制就完全失效。
 *  取法与 lib/news/rate-limit.ts 保持一致，不另起一套。 */
function clientIp(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body = await request.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const coupon = await prisma.coupon.findUnique({ where: { code: parsed.data.code } })
    if (!coupon) return error('活动不存在或已下线')

    const now = new Date()
    const claimable = couponClaimable(
      {
        status: coupon.status,
        total: coupon.total,
        claimed: coupon.claimed,
        startAt: coupon.startAt,
        endAt: coupon.endAt,
      },
      now
    )
    if (!claimable.ok) return error(claimable.reason)

    // 浏览器指纹由前端带来（与论坛匿名 id 同源，localStorage 里那个 UUID）。
    // 它拦不住「换个浏览器/开无痕」，但能拦住同一浏览器反复点 —— 这正是站长要的那一限。
    const device = (request.headers.get('x-anon-id') || '').trim().slice(0, 120)
    const ip = clientIp(request)

    const scopes: { scope: 'USER' | 'IP' | 'DEVICE'; value: string }[] = [
      { scope: 'USER', value: String(user.id) },
      { scope: 'IP', value: ip },
    ]
    // 前端没带指纹就不加这一限，而不是拿空串当指纹 ——
    // 空串会让「所有没带指纹的人」共用一条记录，第二个人就再也领不到了
    if (device) scopes.push({ scope: 'DEVICE', value: device })

    try {
      const grant = await prisma.$transaction(async (tx) => {
        // ① 原子扣减库存：条件里带 claimed < total，抢不到就是被领完了。
        //    用 updateMany 的条件更新做 CAS，不是「读出来加一再写回去」
        const taken = await tx.coupon.updateMany({
          where: { id: coupon.id, status: 'ACTIVE', claimed: { lt: coupon.total } },
          data: { claimed: { increment: 1 } },
        })
        if (taken.count !== 1) throw new ClaimError('已被领完')

        // ② 三限占位。任一冲突 → P2002 → 整个事务回滚（库存也退回去）
        await tx.couponClaim.createMany({
          data: scopes.map((s) => ({
            couponId: coupon.id,
            scope: s.scope,
            value: claimHash(s.scope, s.value),
          })),
        })

        // ③ 发券。有效期是**快照**：批次以后改期不影响已经发出去的这张
        return tx.couponGrant.create({
          data: {
            couponId: coupon.id,
            userId: user.id,
            state: 'AVAILABLE',
            expiresAt: coupon.endAt,
            claimIp: claimHash('IP', ip),
            claimDevice: device ? claimHash('DEVICE', device) : null,
          },
        })
      })

      return success(
        {
          id: grant.id,
          label: couponLabel({
            kind: coupon.kind,
            minAmount: Number(coupon.minAmount),
            discount: Number(coupon.discount),
          }),
          expiresAt: grant.expiresAt,
          productIds: parseProductIds(coupon.productIds),
        },
        '领取成功'
      )
    } catch (e) {
      if (e instanceof ClaimError) return error(e.message)
      // P2002 = 唯一约束冲突。三限里任意一条命中都会走到这里。
      // 不区分是哪一限：告诉用户「你已经领过」就够了，
      // 细分到「你这个 IP 领过」反而是在教人怎么绕过。
      if ((e as { code?: string })?.code === 'P2002') {
        return error('你已经领过这张券了')
      }
      throw e
    }
  } catch (err) {
    console.error('Claim coupon error:', err)
    return error('领取失败，请稍后再试')
  }
}

class ClaimError extends Error {}
