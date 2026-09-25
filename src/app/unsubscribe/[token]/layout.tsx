import type { Metadata, Viewport } from 'next'

/*
 * 邮件订阅设置页（营销邮件底部「退订营销邮件 / 调整订阅」链接的落点）。
 *
 * 【为什么是顶层路由、不在 (shop) 里】(shop) 布局会带上页头页脚、公告弹窗、成交滚动提示和流量埋点 ——
 * 在退订页上弹营销弹窗是最糟糕的体验，埋点也不该记录一个带凭证的地址。
 *
 * URL 里的 token 就是凭证（凭它能改这个人的订阅），所以：
 *  - robots.ts Disallow /unsubscribe/，这里再声明 noindex + nofollow
 *  - referrer: no-referrer —— 页面上任何跳转/资源请求都不带出这个地址
 *  - 标题与分享卡片文字中性：邮件会被转发，链接会被贴进聊天，预览里不该出现商品宣传
 */
const TITLE = '邮件订阅设置 - 贝果科技'
const DESCRIPTION = '管理贝果科技营销邮件的订阅与退订'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: '邮件订阅',
  openGraph: { title: TITLE, description: DESCRIPTION },
  twitter: { title: TITLE, description: DESCRIPTION },
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

/* 浅色独立页：根布局声明的是深色 color-scheme，不覆盖的话手机上的原生复选框会按深色画 */
export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f3f4f6',
}

export default function UnsubscribeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
