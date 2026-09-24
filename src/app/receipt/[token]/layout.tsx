import type { Metadata, Viewport } from 'next'

/*
 * 收据页的 <head>。
 *
 * 【标题必须中性，任何情况下都不带 ChatGPT / Claude】买家申请收据时可以选「不展示字眼」
 * （项目一栏印「技术咨询服务」）。而这一页原来没有自己的 metadata，标题继承根 layout 的
 * 「贝果科技 - ChatGPT Plus / Claude Pro 充值与代充」—— 浏览器「打印 / 保存为 PDF」会拿标题当
 * 文件名、默认页眉也会印出标题，微信里打开或转发给财务时显示的也是它，买家的选择就白选了。
 * 描述与分享卡片的文字同理一并覆盖。
 *
 * 带令牌的页面：robots.ts 里已 Disallow /receipt/，这里再声明 noindex 双保险无害（抓不到就读不到）。
 */
const TITLE = '收据 - 贝果科技'

export const metadata: Metadata = {
  title: TITLE,
  description: '付款收据',
  keywords: '收据',
  openGraph: { title: TITLE, description: '付款收据' },
  twitter: { title: TITLE, description: '付款收据' },
  robots: { index: false, follow: false },
}

// 收据是白底打印样式，根 layout 声明的是深色配色
export const viewport: Viewport = { colorScheme: 'light' }

export default function ReceiptLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
