import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo/private-page'
import { notFoundOnChannel } from '@/lib/storefront/resolve'

// 私密/登录态页面：noindex，理由见 lib/seo/private-page.ts。
// 不能只靠 profile/layout.tsx 继承：那样 noindex 有了，标题却会是「个人中心」
export const metadata: Metadata = privatePageMetadata('推荐有奖', '分享你的专属推广链接，好友下单完成后返现自动计入账户余额。')

// 渠道分站（设计 11.2、实施分包 WP1）：本模块在渠道站关闭，渠道 Host 上整组页面 404（第一行、不包进 try）。
// 主站（含休眠期的任何 Host）照常渲染；接口层另有 denyOnChannel 与 nginx 白名单兜底
export default async function ReferralLayout({ children }: { children: React.ReactNode }) {
  await notFoundOnChannel()
  return <>{children}</>
}
