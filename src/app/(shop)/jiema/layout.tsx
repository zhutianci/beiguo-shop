import type { Metadata } from 'next'
import { notFoundOnChannel } from '@/lib/storefront/resolve'
import { readSmsConfigCached } from '@/lib/jiema/config'
import { jiemaPublicOpen } from '@/lib/jiema-config-schema'
import { SITE_NAME } from '@/lib/product-seo'

/**
 * 短信接码页面组（docs/短信接码-设计.md §1.3、D11、D28、附录 B 第 11 条）。
 *
 * 【只在主站】第一行 notFoundOnChannel()，不包进 try：渠道 Host 上整组页面（/jiema 及以后的号码页、记录页）404。
 * 【灰度期 noindex】只在「总开关开 + 受众全部用户 + 接码下单已交付」时允许收录（Q6）；此外一律 noindex（页面对普通用户只是「即将开放」）。
 * canonical 固定 /jiema：?s=&c=&op= 只用来恢复选择状态（分享、登录回跳），不当成独立页面。
 * 标题与描述里不主动出现国内平台名称（Q6）；中文关键词对全部用户开放前要用 Google 下拉建议实测（站点惯例），见部署说明。
 */
const TITLE = `短信接码 - 海外手机号在线接收验证码 - ${SITE_NAME}`
const DESCRIPTION = '选服务、选国家/地区，拿一个海外手机号在线接收短信验证码。没收到短信整单退回站内余额，收码前可免费换号。'

export async function generateMetadata(): Promise<Metadata> {
  const open = jiemaPublicOpen(await readSmsConfigCached())
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: '/jiema' },
    robots: open ? { index: true, follow: true } : { index: false, follow: true },
  }
}

export default async function JiemaLayout({ children }: { children: React.ReactNode }) {
  await notFoundOnChannel()
  return <>{children}</>
}
