// Server Component：必须 force-dynamic（要连库，builder 容器没有 DATABASE_URL）
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { couponClaimable, couponLabel, parseProductIds } from '@/lib/coupon'
import { ClaimPanel } from './claim-panel'

/**
 * 领券落地页。这是要发到群里、朋友圈的那条链接。
 *
 * 【为什么页面本身不要求登录】要求登录才能**看**会在第一步就流失大半人：
 * 从群里点进来看到的是登录框，多数人直接退了。所以页面公开可见、
 * 券面额与剩余量直接展示，只有点「立即领取」才要求登录 ——
 * 那时用户已经知道自己能拿到什么，登录的动力完全不同。
 * 领取接口本身仍然强制登录（券必须绑定到账户）。
 *
 * 【为什么用 noindex】领券页被搜索引擎收录没有好处：活动结束后会留下一批
 * 死链，而且优惠信息被长期挂在搜索结果里容易引发「为什么我没有这个价」的纠纷。
 */

interface Params {
  params: { code: string }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const code = decodeURIComponent(params.code || '')
  const coupon = await prisma.coupon
    .findUnique({
      where: { code },
      select: { name: true, kind: true, minAmount: true, discount: true, source: true },
    })
    .catch(() => null)
  // 系统批次（source 非空，如「下单有奖」的中奖券）与不存在同样处理，连标题都不能透出券名
  if (!coupon || coupon.source != null) {
    return { title: '活动不存在 - 贝果科技', robots: { index: false, follow: false } }
  }
  const label = couponLabel({
    kind: coupon.kind,
    minAmount: Number(coupon.minAmount),
    discount: Number(coupon.discount),
  })
  return {
    title: `${coupon.name} · ${label} - 贝果科技`,
    description: `${label}，登录后即可领取。`,
    robots: { index: false, follow: false },
  }
}

export default async function CouponClaimPage({ params }: Params) {
  const code = decodeURIComponent(params.code || '')
  if (!code || code.length > 32) notFound()

  const coupon = await prisma.coupon.findUnique({ where: { code } }).catch(() => null)
  // source 非空 = 系统发给某个具体买家的券（「下单有奖」中奖券等），不是公开领取活动：
  // 按不存在处理，领取接口那边同样拒绝（api/coupons/claim）
  if (!coupon || coupon.source != null) notFound()

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

  const productIds = parseProductIds(coupon.productIds)
  // 商品券要告诉用户能用在什么上，只说「指定商品」等于没说
  let productNames: string[] = []
  if (productIds.length) {
    const rows = await prisma.product
      .findMany({ where: { id: { in: productIds } }, select: { name: true }, take: 20 })
      .catch(() => [])
    productNames = rows.map((r) => r.name)
  }

  return (
    <div className="min-h-screen pb-20 page-top">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none fixed left-1/4 top-24 h-[420px] w-[420px] rounded-full bg-purple-500/10 blur-[128px]" />

      <div className="container relative max-w-lg">
        <ClaimPanel
          code={coupon.code}
          name={coupon.name}
          label={couponLabel({
            kind: coupon.kind,
            minAmount: Number(coupon.minAmount),
            discount: Number(coupon.discount),
          })}
          discount={Number(coupon.discount)}
          minAmount={Number(coupon.minAmount)}
          kind={coupon.kind}
          productNames={productNames}
          remaining={Math.max(0, coupon.total - coupon.claimed)}
          total={coupon.total}
          endAt={coupon.endAt ? coupon.endAt.toISOString() : null}
          blocked={claimable.ok ? null : claimable.reason}
        />
      </div>
    </div>
  )
}
