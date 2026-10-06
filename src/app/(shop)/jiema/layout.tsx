import type { Metadata } from 'next'
import { notFoundOnChannel } from '@/lib/storefront/resolve'
import { readSmsConfigCached } from '@/lib/jiema/config'
import { jiemaPublicOpen } from '@/lib/jiema-config-schema'

/**
 * 短信接码页面组（docs/短信接码-设计.md §1.3、D11、D28、附录 B 第 11 条）。
 *
 * 【只在主站】第一行 notFoundOnChannel()，不包进 try：渠道 Host 上整组页面（/jiema 及以后的号码页、记录页）404。
 * 【灰度期 noindex】只在「总开关开 + 受众全部用户 + 接码下单已交付」时允许收录（Q6）；此外一律 noindex（页面对普通用户只是「即将开放」）。
 * 【SEO 批 2 的 AJ（docs/SEO-重构/SEO-重构设计.md §1.3、§8.2 AJ）】这里**只留 robots**，作为整组 fail-closed 的默认值：
 *   open ? index,follow : noindex,follow。子页面只允许收得更严（records、order 用 privatePageMetadata；以后的服务页不过闸就 noindex）。
 *   canonical、title、description 挪到各 page 自己写：layout 的 metadata 会被所有子路由继承，canonical 写在这里
 *   等于让 /jiema/terms、/jiema/records 都自称 /jiema（交接文档 §28 第 ④ 条的教训）。?s=、?svc=、?c=、?op= 只恢复选择状态，
 *   canonical 由 page.tsx 固定指 /jiema。
 * 标题与描述里不主动出现国内平台名称（Q6）；中文关键词按 Google 下拉建议实测（docs/SEO-重构/kw7）。
 */
export async function generateMetadata(): Promise<Metadata> {
  const open = jiemaPublicOpen(await readSmsConfigCached())
  return {
    robots: open ? { index: true, follow: true } : { index: false, follow: true },
  }
}

export default async function JiemaLayout({ children }: { children: React.ReactNode }) {
  await notFoundOnChannel()
  return <>{children}</>
}
