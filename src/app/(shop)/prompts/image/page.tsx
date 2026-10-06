import type { Metadata } from 'next'
import { ContentListPage, contentListMetadata, sortParam } from '@/components/content/content-list-page'
import { pageParam } from '@/components/learn/ui'

// 提示词大类页（内容平台 P2）：/prompts/image。静态段优先于 [idSlug]，不会和 /prompts/{id} 冲突
export const dynamic = 'force-dynamic'

type Props = { searchParams: { page?: string | string[]; sort?: string | string[] } }

export function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return contentListMetadata('PROMPT', 'FACET', 'image', pageParam(searchParams.page), sortParam(searchParams.sort))
}

export default function FacetPage({ searchParams }: Props) {
  return <ContentListPage section="PROMPT" kind="FACET" slug="image" page={pageParam(searchParams.page)} sort={sortParam(searchParams.sort)} />
}
