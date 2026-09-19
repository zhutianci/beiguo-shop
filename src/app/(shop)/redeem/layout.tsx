import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo/private-page'

// 私密页面：noindex，理由见 lib/seo/private-page.ts
//
// 【这个目录下没有 page.tsx，是故意的】/redeem 这个裸路径不存在（访问是 404）。
// 站内兑换是按卡走的动态路由 /redeem/<provider>?cdk=…，入口在「我的订单」里
// 每张卡自己的「去充值 / 兑换」按钮上。这一层 layout 的作用只有一个：
// 给 /redeem/[provider] 这些带卡密参数的页面挂上 noindex。
// 不要因为「这里有个 layout」就以为该补一个 /redeem 首页，那是个不存在的入口。
export const metadata: Metadata = privatePageMetadata('卡密兑换', '输入卡密完成自助充值。')

export default function RedeemLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
