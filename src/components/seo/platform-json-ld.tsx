import { JsonLd } from '@/lib/seo/jsonld'
import { getStorefront } from '@/lib/storefront/resolve'

/**
 * 只在主站输出的 JSON-LD（docs/多渠道分销-内容模块下放.md 第 4 节）。内容模块的结构化数据写的是贝果的机构、主站地址；
 * 渠道站整站 noindex，输出它没有收益，白标渠道还会在源码里露出贝果。渠道店面渲染为空，主站与 <JsonLd> 逐字相同。
 * Server Component，不要加 'use client'。
 */
export async function PlatformJsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const sf = await getStorefront()
  if (!sf || sf.kind !== 'PLATFORM') return null
  return <JsonLd data={data} />
}

/** 同上，包任意只在主站输出的结构化数据组件（如新闻详情的 <ArticleJsonLd>）。不加任何 DOM */
export async function PlatformOnly({ children }: { children: React.ReactNode }) {
  const sf = await getStorefront()
  if (!sf || sf.kind !== 'PLATFORM') return null
  return <>{children}</>
}
