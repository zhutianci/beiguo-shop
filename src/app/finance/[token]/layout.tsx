import type { Metadata, Viewport } from 'next'

/*
 * 财务开票台（企微「发票可开具」通知里的链接）。
 *
 * URL 里的令牌就是凭证：凭它能看全部待开发票的抬头、税号、开户行账号、客户邮箱，还能把发票标记为已开具。
 * 此前这一页没有自己的 layout，继承根 layout 的 index:true 和站点标题/分享卡片文字，所以：
 *  - robots.ts Disallow /finance/，这里再声明 noindex + nofollow（页面上没有值得跟随的站内链接）
 *  - referrer: no-referrer —— 页面上任何跳转/资源请求都不带出这个地址
 *  - 标题与分享卡片文字中性：链接会在企微里转给财务，预览里不该出现商品宣传
 * 埋点那一道在 lib/analytics/classify.ts 的 shouldSkipPath。
 */
const TITLE = '财务开票台 - 贝果科技'
const DESCRIPTION = '待开发票清单'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: '开票',
  openGraph: { title: TITLE, description: DESCRIPTION },
  twitter: { title: TITLE, description: DESCRIPTION },
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

/* 深色独立页（bg-[#0b0d12]），与根布局同为深色；themeColor 跟页面底色走，手机地址栏不会是一条纯黑 */
export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0b0d12',
}

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
