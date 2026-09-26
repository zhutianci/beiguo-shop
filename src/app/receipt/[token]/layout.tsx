import type { Metadata, Viewport } from 'next'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getStorefront } from '@/lib/storefront/resolve'
import { tenantOrigin } from '@/lib/storefront/origin'
import { channelsEnabled } from '@/lib/storefront/hosts'

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

/**
 * 【跨店面跳转】（设计 4.5、W2-9）收据属于别的站时，302 到那个站的同一收据地址：收据邮件、订单页里的链接
 * 都按订单的站生成，买家从别处拿到链接打开时也能落到正确的站。origin 取自 tenants.origin（库里配置），
 * 绝不从 Host 拼。页面本身是客户端组件，所以跳转放在这个服务端 layout 里做。
 * getStorefront() 与 redirect() 都不包进 try（设计 4.4 第 7 条）。
 * 休眠（CHANNELS_ENABLED 未开）时店面恒为主站、没有别的站可跳，不查库：行为与改造前相同（设计 4.10）。
 */
export default async function ReceiptLayout({ children, params }: { children: React.ReactNode; params: { token: string } }) {
  const sf = await getStorefront()
  const token = (params?.token || '').trim()
  if (sf && channelsEnabled() && token.length >= 16 && token.length <= 64) {
    const r = await prisma.receipt.findUnique({ where: { token }, select: { tenantId: true } })
    if (r && r.tenantId !== sf.id) {
      redirect(`${await tenantOrigin(r.tenantId)}/receipt/${encodeURIComponent(token)}`)
    }
  }
  return <>{children}</>
}
