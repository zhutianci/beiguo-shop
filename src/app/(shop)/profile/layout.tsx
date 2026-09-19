import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo/private-page'

// 私密/登录态页面：noindex，理由见 lib/seo/private-page.ts
export const metadata: Metadata = privatePageMetadata('个人中心', '管理账号信息、余额与优惠券。')

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
