import type { Metadata } from 'next'
import { ContentListPage, contentListMetadata } from '@/components/content/content-list-page'
import { pageParam } from '@/components/learn/ui'

export const dynamic = 'force-dynamic'

type Props = { searchParams: { page?: string | string[] } }

export function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  return contentListMetadata('GUIDE', 'ROOT', undefined, pageParam(searchParams.page))
}

export default function GuidesPage({ searchParams }: Props) {
  return <ContentListPage section="GUIDE" kind="ROOT" page={pageParam(searchParams.page)} />
}
