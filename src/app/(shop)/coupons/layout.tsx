import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo/private-page'

// 私密/登录态页面：noindex，理由见 lib/seo/private-page.ts
export const metadata: Metadata = privatePageMetadata('我的优惠券', '查看已领取的优惠券与可用门槛。')

export default function CouponsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
