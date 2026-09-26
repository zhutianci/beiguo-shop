export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { claimHash, couponClaimable, couponLabel, parseProductIds } from '@/lib/coupon'
import { clientIp, rateLimited } from '@/lib/news/rate-limit'
import { ipKey } from '@/lib/auth-throttle'
import { denyOnChannel } from '@/lib/storefront/resolve'

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

// 客户端 IP 用 lib/news/rate-limit 的 clientIp（与登录、发码限流同一个取法，nginx 会把三个 IP 头覆盖成核实过的地址）。
// 原来这里自己抄了一份，两处取法迟早会漂移

export async function POST(request: NextRequest) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    // 挡脚本连点：每次领取都会开事务、短暂锁住 coupon 行。真人一分钟点不到 10 次
    if (rateLimited(`cpn-u:${user.id}`, { windowMs: 60_000, max: 10 })) return error('操作过于频繁，请稍后再试', 429)

    const body = await request.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const coupon = await prisma.coupon.findUnique({ where: { code: parsed.data.code } })
    // source 非空 = 系统发的券（如「下单有奖」中奖时建的单张批次），不是公开领取活动。
    // 必须与「不存在」同一句话、同一个状态码：否则拿到一个抽奖券 code 的人
    // 能从报错里分辨出「这个 code 存在」，还可能领走别人的奖
    if (!coupon || coupon.source != null) return error('活动不存在或已下线')

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
    const ip = clientIp(request.headers)
    // 「每 IP 一张」按网段算：IPv6 按 /64 聚合，和登录、发码限流同一口径（lib/auth-throttle.ts ipKey）。
    // 经 Cloudflare 进来的 IPv6 访客通常持有整段 /64，按单个地址限领，换个地址就绕过了。
    // IPv4 与 ::ffff:x.x.x.x 原样还原成 IPv4，已有 IPv4 领取记录的哈希不变
    const ipLimit = ipKey(ip)

    const scopes: { scope: 'USER' | 'IP' | 'DEVICE'; value: string }[] = [
      { scope: 'USER', value: String(user.id) },
      { scope: 'IP', value: ipLimit },
    ]
    // 前端没带指纹就不加这一限，而不是拿空串当指纹 ——
    // 空串会让「所有没带指纹的人」共用一条记录，第二个人就再也领不到了
    if (device) scopes.push({ scope: 'DEVICE', value: device })

    try {
      const grant = await prisma.$transaction(async (tx) => {
        // ① 原子扣减库存：条件里带 claimed < total，抢不到就是被领完了。
        //    用 updateMany 的条件更新做 CAS，不是「读出来加一再写回去」
        //    source: null 是第二道闸：上面已经拒过系统批次，这里在写入条件上再钉一次
        const taken = await tx.coupon.updateMany({
          where: { id: coupon.id, status: 'ACTIVE', source: null, claimed: { lt: coupon.total } },
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
      //
      // 【三限都只在本批次内生效】唯一约束是 [couponId, scope, value]，
      // 换个批次（不同 couponId）就是另一组键，领过第一批不影响领第二批。
      // 文案必须把「本次活动」讲出来 —— 只说「你已经领过了」，
      // 买家会以为整个站只能领一张，把正常的多批次活动当成 bug。
      if ((e as { code?: string })?.code === 'P2002') {
        // 自己已经持有本批次的券：可以直说，反正「我的优惠券」里本来就看得到
        const mine = await prisma.couponGrant.findFirst({
          where: { couponId: coupon.id, userId: user.id },
          select: { id: true },
        })
        return error(
          mine
            ? '你已经领过本次活动的券了，可在「我的优惠券」中查看'
            : // 撞的是 IP 或设备那一限。不点破是哪一条 —— 说清楚等于在教人绕过
              '本次活动每人限领 1 张，你所在的网络或这台设备已经领取过'
        )
      }
      throw e
    }
  } catch (err) {
    console.error('Claim coupon error:', err)
    return error('领取失败，请稍后再试')
  }
}

class ClaimError extends Error {}
