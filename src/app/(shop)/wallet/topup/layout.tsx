import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo/private-page'

// 私密 / 登录态页面：noindex（理由见 lib/seo/private-page.ts）。渠道站 404 由上一级 wallet/layout.tsx 的 notFoundOnChannel 负责
export const metadata: Metadata = privatePageMetadata('余额充值', '用支付宝充值站内余额。')

export default function WalletTopupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
