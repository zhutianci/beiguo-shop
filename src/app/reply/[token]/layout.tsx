import type { Metadata, Viewport } from 'next'

/*
 * 客服快捷回复页（企微新留言通知里的链接）。
 *
 * URL 里的令牌就是凭证：凭它能看这张订单的买家、金额、全部留言，还能以客服身份回复。
 * 此前这一页没有自己的 layout，继承根 layout 的 index:true 和站点标题/分享卡片文字，所以：
 *  - robots.ts Disallow /reply/，这里再声明 noindex + nofollow（页面上没有值得跟随的站内链接）
 *  - referrer: no-referrer —— 页面上任何跳转/资源请求都不带出这个地址
 *  - 标题与分享卡片文字中性：企微里转发时预览里不该出现商品宣传
 * 埋点那一道在 lib/analytics/classify.ts 的 shouldSkipPath。
 */
const TITLE = '订单回复 - 贝果科技'
const DESCRIPTION = '订单留言回复'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: '订单回复',
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

export default function ReplyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
