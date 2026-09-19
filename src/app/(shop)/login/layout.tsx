import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo/private-page'

// 私密/登录态页面：noindex，理由见 lib/seo/private-page.ts
export const metadata: Metadata = privatePageMetadata('登录', '登录贝果科技账号，查看订单、卡密与余额。')

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
