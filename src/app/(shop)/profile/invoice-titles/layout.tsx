import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo/private-page'

// 私密/登录态页面：noindex，理由见 lib/seo/private-page.ts。
// 这一页的内容尤其敏感（税号、开户行、银行账号），绝不能进索引。
export const metadata: Metadata = privatePageMetadata('抬头管理', '管理开具发票时常用的抬头信息。')

export default function InvoiceTitlesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
