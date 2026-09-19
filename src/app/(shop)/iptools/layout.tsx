import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/product-seo'

/**
 * IP 工具页是站上少有的「非商业但有真实搜索需求」的内容：
 * 「ip查询」「我的ip地址」「ip归属地查询」这类词量大、意图明确，
 * 而且与目标客群（要用海外 AI 服务、关心网络环境的人）高度重合。
 * 给它一份自己的标题，是把一页本来就有的资产从「首页的副本」里救出来。
 */
const TITLE = `IP 地址查询与网络检测工具合集 - ${SITE_NAME}`
const DESCRIPTION =
  '免费在线 IP 工具合集：查询本机 IP 与归属地、检测代理与 DNS、测速与连通性排查，帮你确认当前网络环境是否适合访问 ChatGPT、Claude 等海外 AI 服务。'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/iptools' },
  openGraph: { type: 'website', title: TITLE, description: DESCRIPTION, url: '/iptools' },
}

export default function IpToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
