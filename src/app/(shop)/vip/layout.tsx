import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo/private-page'

// 私密/登录态页面：noindex，理由见 lib/seo/private-page.ts
export const metadata: Metadata = privatePageMetadata('会员中心', '查看会员等级、升级进度与各等级权益。')

export default function VipLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
