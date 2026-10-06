import type { Metadata } from 'next'
import { ContentListPage, contentListMetadata } from '@/components/content/content-list-page'
import { pageParam } from '@/components/content/content-ui'

export const dynamic = 'force-dynamic'

type Props = { params: { slug: string }; searchParams: { page?: string | string[] } }

export function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  return contentListMetadata('PROMPT', 'TOPIC', params.slug, pageParam(searchParams.page))
}

export default function TopicHubPage({ params, searchParams }: Props) {
  return <ContentListPage section="PROMPT" kind="TOPIC" slug={params.slug} page={pageParam(searchParams.page)} />
}
