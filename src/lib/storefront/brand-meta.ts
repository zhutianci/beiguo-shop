/**
 * 页面 metadata 的品牌替换（docs/多渠道分销-渠道品牌与公告.md 第 4 节）。
 *
 * 各页面的标题、描述历来写死「… - 贝果科技」（刻意不用 title.template，理由见根布局）。渠道设了自己的站名后，
 * 这些字样要换成渠道站名——但不能把几十处标题改成函数调用、更不能动主站：主站与未改名的渠道原样返回同一个对象。
 *
 * 用法（页面 / layout）：把 `export const metadata = {...}` 改成
 *   const metadata: Metadata = {...}
 *   export async function generateMetadata() { return brandMetadata(metadata) }
 * 有 generateMetadata 的页面在 return 处包一层 brandMetadata(...)。
 *
 * 只替换字符串里的「贝果科技」四个字；URL、图片、robots 等一概不碰。不要包进 try（getStorefront 见 resolve.ts 文件头第 7 条）。
 */
import type { Metadata } from 'next'
import { isWhiteLabel, PLATFORM_BRAND, PLATFORM_BRAND_NAME, type StoreBrand } from '../brand-base'
import { getStorefront } from './resolve'

/** 当前请求店面的品牌；没有店面（该请求本应 404）按主站 */
export async function currentBrand(): Promise<StoreBrand> {
  const sf = await getStorefront()
  return sf?.brand ?? { ...PLATFORM_BRAND }
}

/** 把字符串里的「贝果科技」换成渠道站名；没改名原样返回 */
export function withBrandName(text: string, brand: StoreBrand): string {
  return brand.custom ? text.split(PLATFORM_BRAND_NAME).join(brand.name) : text
}

const TEXT_KEYS = new Set(['title', 'description', 'absolute', 'default', 'siteName', 'alt', 'applicationName', 'keywords'])

function swap(v: unknown, brand: StoreBrand, key: string, depth: number): unknown {
  if (depth > 6) return v
  if (typeof v === 'string') return TEXT_KEYS.has(key) ? withBrandName(v, brand) : v
  if (Array.isArray(v)) return v.map((x) => swap(x, brand, key, depth + 1))
  if (v && typeof v === 'object' && !(v instanceof URL)) {
    const out: Record<string, unknown> = {}
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) out[k] = swap(x, brand, k, depth + 1)
    return out
  }
  return v
}

/**
 * 白标站的分享图：主站分享图 og-default.png 上印着贝果的字标，白标站换成渠道 logo（相对地址按渠道 metadataBase 解析）；
 * 没有 logo 就不给分享图（微信 / 社交平台退回只显示标题与摘要）。
 */
export function brandShareImages(meta: Metadata, brand: StoreBrand): Metadata {
  if (!isWhiteLabel(brand)) return meta
  const images = brand.logoUrl ? [{ url: brand.logoUrl, alt: brand.name }] : []
  const out: Metadata = { ...meta }
  if (meta.openGraph) out.openGraph = { ...meta.openGraph, images }
  if (meta.twitter) out.twitter = { ...meta.twitter, card: 'summary', images: brand.logoUrl ? [brand.logoUrl] : [] } as Metadata['twitter']
  return out
}

/** 页面 metadata → 按当前店面换站名与分享图。主站与没有白标的渠道返回原对象（逐字不变） */
export async function brandMetadata(meta: Metadata): Promise<Metadata> {
  const brand = await currentBrand()
  if (!isWhiteLabel(brand)) return meta
  return brandShareImages(swap(meta, brand, '', 0) as Metadata, brand)
}
