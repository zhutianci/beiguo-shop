import type { Metadata } from 'next'
import { ContentListPage, contentListMetadata, sortParam } from '@/components/content/content-list-page'
import { pageParam } from '@/components/learn/ui'

export const dynamic = 'force-dynamic'

type Props = { searchParams: { page?: string | string[]; sort?: string | string[] } }

export function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return contentListMetadata('APP', 'SHOWCASE', undefined, pageParam(searchParams.page), sortParam(searchParams.sort))
}

export default function ShowcasePage({ searchParams }: Props) {
  return <ContentListPage section="APP" kind="SHOWCASE" page={pageParam(searchParams.page)} sort={sortParam(searchParams.sort)} />
}
