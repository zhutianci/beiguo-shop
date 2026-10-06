import type { Metadata } from 'next'
import { ContentListPage, contentListMetadata, sortParam } from '@/components/content/content-list-page'
import { pageParam } from '@/components/learn/ui'

export const dynamic = 'force-dynamic'

type Props = { params: { slug: string }; searchParams: { page?: string | string[]; sort?: string | string[] } }

export function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  return contentListMetadata('PROMPT', 'MODEL', params.slug, pageParam(searchParams.page), sortParam(searchParams.sort))
}

export default function ModelHubPage({ params, searchParams }: Props) {
  return <ContentListPage section="PROMPT" kind="MODEL" slug={params.slug} page={pageParam(searchParams.page)} sort={sortParam(searchParams.sort)} />
}
