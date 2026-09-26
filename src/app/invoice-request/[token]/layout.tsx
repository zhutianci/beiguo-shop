import type { Metadata, Viewport } from 'next'
import { notFoundOnChannel } from '@/lib/storefront/resolve'

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

/*
 * 渠道分站（设计 7.6 / 11.2；主会话 D4）：这是平台令牌页，渠道站关闭，渠道 Host 上整页 404（背后的接口也各自 404）。
 * 页面本身是客户端组件，没法在里面 notFound()，所以放在这一层做成异步服务端 layout；第一行、不进 try。
 * 休眠期对任何 Host 恒放行，主站渲染不变。
 */
export default async function InvoiceRequestLayout({ children }: { children: React.ReactNode }) {
  await notFoundOnChannel()
  return <>{children}</>
}
