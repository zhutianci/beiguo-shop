import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo/private-page'

// 私密/登录态页面：noindex，理由见 lib/seo/private-page.ts。
// 不能只靠 profile/layout.tsx 继承：那样 noindex 有了，标题却会是「个人中心」
export const metadata: Metadata = privatePageMetadata('推荐有奖', '分享你的专属推广链接，好友下单完成后返现自动计入账户余额。')

export default function ReferralLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
