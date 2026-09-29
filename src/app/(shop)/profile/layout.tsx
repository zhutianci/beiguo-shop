import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo/private-page'
import { getStorefront } from '@/lib/storefront/resolve'
import { storefrontFeatures } from '@/lib/storefront/public'
import { readSmsConfigCached } from '@/lib/jiema/config'
import { jiemaPublicOpen } from '@/lib/jiema-config-schema'
import { JiemaOpenProvider } from './jiema-open'

// 私密/登录态页面：noindex，理由见 lib/seo/private-page.ts
export const metadata: Metadata = privatePageMetadata('个人中心', '管理账号信息、余额与优惠券。')

/**
 * 个人中心快捷功能「我的接码记录」（docs/短信接码-设计.md §1.2）与导航、页脚同一个判定：静态开关 features.jiema（渠道站恒关）
 * && 主站 && sms_config 整份校验通过 && enabled && audience=ALL && 接码下单已交付（jiemaPublicOpen；进程内缓存 60 秒，读取失败按关）。
 * 不包进 try：店面解析靠异常实现控制流（前台外壳已经解析过一次，这里同一请求内命中缓存）。
 */
export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const sf = await getStorefront()
  const jiemaOpen = !!sf && sf.kind === 'PLATFORM' && storefrontFeatures(sf).jiema && jiemaPublicOpen(await readSmsConfigCached().catch(() => null))
  return <JiemaOpenProvider value={jiemaOpen}>{children}</JiemaOpenProvider>
}
