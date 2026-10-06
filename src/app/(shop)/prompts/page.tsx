import type { Metadata } from 'next'
import { ContentListPage, contentListMetadata } from '@/components/content/content-list-page'
import { pageParam } from '@/components/content/content-ui'

export const dynamic = 'force-dynamic'

type Props = { searchParams: { page?: string | string[] } }

export function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return contentListMetadata('PROMPT', 'ROOT', undefined, pageParam(searchParams.page))
}

export default function PromptsPage({ searchParams }: Props) {
  return <ContentListPage section="PROMPT" kind="ROOT" page={pageParam(searchParams.page)} />
}
