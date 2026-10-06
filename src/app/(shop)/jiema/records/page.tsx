import type { Metadata } from 'next'
import { privatePageMetadata } from '@/lib/seo/private-page'
import { notFoundOnChannel } from '@/lib/storefront/resolve'
import { JiemaRecordsClient } from './records-client'

export const dynamic = 'force-dynamic'

/**
 * 我的接码记录 /jiema/records（docs/短信接码-设计.md §1.11、§1.3；S3）。
 *
 * 【只在主站】第一行 notFoundOnChannel()（页面组 layout 已经调过一次；这里再调一次，免得以后有人把 layout 改掉），不包进 try。
 * 【noindex】个人记录页一律不收录（layout 对 /jiema 按灰度状态给 robots，这里覆盖成 noindex）。
 * 【数据全在客户端】需要登录（先等 useHydrated 再判断）；接口 GET /api/jiema/orders 只查本人、no-store。
 * tab / 号码 / 日期存在 URL 里（?tab=&q=&days=），刷新与分享都不丢。
 */
// SEO 批 2 的 AJ（设计 §1.3）：noindex,follow（原来是 nofollow：私密页的风险是内容被收录、不是链接被跟随，页头页脚的站内链接要能被跟随）
export const metadata: Metadata = privatePageMetadata('我的接码记录')

export default async function JiemaRecordsPage() {
  await notFoundOnChannel()
  return (
    <div className="page-top container max-w-3xl pb-28">
      <JiemaRecordsClient />
    </div>
  )
}
