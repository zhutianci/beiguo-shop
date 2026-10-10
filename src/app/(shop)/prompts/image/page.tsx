import type { Metadata } from 'next'
import { ContentListPage, contentListMetadata, sortParam } from '@/components/content/content-list-page'
import { pageParam } from '@/components/learn/ui'
import { moduleMetadata } from '@/lib/storefront/module-meta'

// 提示词大类页（内容平台 P2）：/prompts/image。静态段优先于 [idSlug]，不会和 /prompts/{id} 冲突
export const dynamic = 'force-dynamic'

type Props = { searchParams: { page?: string | string[]; sort?: string | string[] } }

function pageMetadata({ searchParams }: Props): Promise<Metadata> {
  return contentListMetadata('PROMPT', 'FACET', 'image', pageParam(searchParams.page), sortParam(searchParams.sort))
}

export default function FacetPage({ searchParams }: Props) {
  return <ContentListPage section="PROMPT" kind="FACET" slug="image" page={pageParam(searchParams.page)} sort={sortParam(searchParams.sort)} />
}

// 内容模块下放：渠道站换站名 / 地址 / robots（主站原样返回，lib/storefront/module-meta.ts）
export async function generateMetadata(props: Parameters<typeof pageMetadata>[0]): Promise<Metadata> {
  return moduleMetadata(await pageMetadata(props))
}
