import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo/private-page'

// 私密/登录态页面：noindex，理由见 lib/seo/private-page.ts
export const metadata: Metadata = privatePageMetadata('我的订单', '查看你的订单、卡密与售后进度。')

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
