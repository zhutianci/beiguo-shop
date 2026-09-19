import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo/private-page'

// 私密/登录态页面：noindex，理由见 lib/seo/private-page.ts
export const metadata: Metadata = privatePageMetadata('订阅查询', '输入下单邮箱，查询订阅类型、开通日期与剩余天数。')

export default function LookupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
