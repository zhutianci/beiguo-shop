import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo/private-page'
import { brandMetadata } from '@/lib/storefront/brand-meta'

// 私密/登录态页面：noindex，理由见 lib/seo/private-page.ts
const metadata: Metadata = privatePageMetadata('登录', '登录贝果科技账号，查看订单、卡密与余额。')

/** 渠道改了站名时把标题里的「贝果科技」换掉；主站原样（src/lib/storefront/brand-meta.ts） */
export async function generateMetadata(): Promise<Metadata> {
  return brandMetadata(metadata)
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
