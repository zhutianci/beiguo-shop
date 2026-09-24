import type { Metadata, Viewport } from 'next'

/*
 * 开票填写链接页：URL 里的令牌就是凭证，收录即泄漏。
 * 与 /receipt/ 同一类，robots.ts 里 Disallow，这里再声明 noindex + nofollow
 * （这一页上没有任何值得爬虫跟随的站内链接）。
 */
export const metadata: Metadata = {
  title: '填写开票信息 - 贝果科技',
  robots: { index: false, follow: false },
}

/*
 * 这一页是浅色的独立页面（不在 (shop) 布局里，客户不一定是本站用户）。
 * 根布局声明的是深色 color-scheme，不覆盖的话手机浏览器的原生控件（单选、输入框、
 * 自动填充底色）会按深色画，在白底上一片漆黑。
 */
export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f3f4f6',
}

export default function InvoiceRequestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
