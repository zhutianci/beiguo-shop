import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo/private-page'

// 私密/登录态页面：noindex，理由见 lib/seo/private-page.ts
export const metadata: Metadata = privatePageMetadata('账户余额', '查看账户余额、推荐返现与余额变动明细。')

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
