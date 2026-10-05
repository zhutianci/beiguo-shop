import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo/private-page'
import { brandMetadata } from '@/lib/storefront/brand-meta'

// 私密/登录态页面：noindex，理由见 lib/seo/private-page.ts。
// 这一页的内容尤其敏感（税号、开户行、银行账号），绝不能进索引。
const metadata: Metadata = privatePageMetadata('抬头管理', '管理开具发票时常用的抬头信息。')

/** 渠道改了站名时把标题里的「贝果科技」换掉；主站原样（src/lib/storefront/brand-meta.ts） */
export async function generateMetadata(): Promise<Metadata> {
  return brandMetadata(metadata)
}

export default function InvoiceTitlesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
