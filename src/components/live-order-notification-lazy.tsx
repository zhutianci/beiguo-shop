'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { hideLiveOrdersOn } from '@/lib/floating-widgets'

/*
 * 【左下角成交弹窗：按需加载（性能优化 2026-10-07）】
 * 弹窗本体 live-order-notification.tsx 与 /api/orders/recent 按站长 2026-09-30 的决定保留、**逐字不改**；这里只改「怎么加载」。
 *
 * 弹窗用 framer-motion，原来由 (shop)/layout 直接 import，framer-motion（约 44KB gzip）因此进了每一个前台页面的首屏 JS——
 * 落地页、大事记、商品页、学习平台本身都不用它。改成 next/dynamic + ssr:false 之后它是一个单独的 chunk，水合后才去取：
 *  · 服务端 HTML 不变：弹窗本来就是水合后几秒才出现（服务端渲染恒为空，check-seo-b 第 2 节），ssr:false 渲染出的也是空；
 *  · 出现时机不变：chunk 走 Cloudflare 缓存，取回后照旧 fetch('/api/orders/recent')、首条延迟 3 秒，此后 8–15 秒一条；
 *  · /jiema/*、/wallet/* 本来就不渲染弹窗（hideLiveOrdersOn），在这里先判一次，这两类页面连 chunk 都不取；
 *    组件本体里同样的判断原样保留，两处结果相同。渠道站由 layout 按 features.liveOrders 不挂这一层，与原来一致。
 */
const LiveOrderNotificationChunk = dynamic(
  () => import('@/components/live-order-notification').then((m) => m.LiveOrderNotification),
  { ssr: false },
)

export function LiveOrderNotificationLazy() {
  const pathname = usePathname()
  if (hideLiveOrdersOn(pathname)) return null
  return <LiveOrderNotificationChunk />
}
