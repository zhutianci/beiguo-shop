import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo/private-page'

// 私密/登录态页面：noindex，理由见 lib/seo/private-page.ts
export const metadata: Metadata = privatePageMetadata('注册', '注册贝果科技账号。')

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
