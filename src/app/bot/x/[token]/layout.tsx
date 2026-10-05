import type { Metadata, Viewport } from 'next'
import { notFoundOnChannel } from '@/lib/storefront/resolve'

/*
 * 微信机器人的一次性补货页（docs/微信机器人-设计.md §9）：管理群里「@贝果助手 补货」回的链接指向这里。
 * URL 里的令牌就是凭证（5 分钟、提交成功后作废），所以同 /reply/：
 *  - robots.ts Disallow /bot/，这里再声明 noindex + nofollow；
 *  - referrer: no-referrer —— 页面上任何跳转 / 资源请求都不带出这个地址；
 *  - 标题中性，微信里转发时预览不出现业务信息。
 * 平台内部工具：渠道 Host 上整页 404（接口 /api/bot/x/restock 也各自 404）。店面解析不进 try。
 */
const TITLE = '补货 - 贝果科技'

export const metadata: Metadata = {
  title: TITLE,
  description: '补货',
  openGraph: { title: TITLE, description: '补货' },
  twitter: { title: TITLE, description: '补货' },
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0b0d12',
}

export default async function BotRestockLayout({ children }: { children: React.ReactNode }) {
  await notFoundOnChannel()
  return <>{children}</>
}
