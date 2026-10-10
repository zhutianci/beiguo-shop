/**
 * 内容模块页面在渠道站上的 metadata（docs/多渠道分销-内容模块下放.md 第 4 节）。
 *
 * 内容模块（AI学习 / AI圈大事记 / IP工具）的页面都把 metadataBase 写死成主站（siteOrigin()），标题带「贝果科技」，
 * 还会自带 robots: index。开到渠道站后要换三件事，主站一字不动：
 *  1. 站名：白标渠道把「贝果科技」换成渠道站名、分享图换成渠道 logo（同 brandMetadata）；
 *  2. 地址：metadataBase 改成渠道自己的 origin（og:url、相对分享图跟着走渠道域名）；canonical 指向主站同一页面——
 *     内容的原始出处在主站，渠道站整站 noindex，canonical 只是把信号归回主站；
 *  3. robots：一律 noindex, follow（页面里写的 index 会盖过根布局给渠道设的 noindex）。
 *
 * 用法：页面的 generateMetadata 最后包一层 moduleMetadata(...)。主站与没有店面的请求原样返回同一个对象。
 * 不要包进 try（getStorefront 见 resolve.ts 文件头第 7 条）。
 */
import type { Metadata } from 'next'
import { siteOrigin } from '../news/format'
import { brandMetadata } from './brand-meta'
import { getStorefront } from './resolve'

export async function moduleMetadata(meta: Metadata): Promise<Metadata> {
  const sf = await getStorefront()
  if (!sf || sf.kind === 'PLATFORM') return meta
  const branded = await brandMetadata(meta)
  const out: Metadata = { ...branded, metadataBase: new URL(sf.origin), robots: { index: false, follow: true } }
  const canonical = branded.alternates?.canonical
  if (typeof canonical === 'string' && canonical.startsWith('/')) {
    out.alternates = { ...branded.alternates, canonical: siteOrigin().replace(/\/+$/, '') + canonical }
  }
  return out
}
