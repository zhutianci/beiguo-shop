import type { Metadata } from 'next'
import { ContentListPage, contentListMetadata } from '@/components/content/content-list-page'
import { pageParam } from '@/components/learn/ui'

export const dynamic = 'force-dynamic'

type Props = { params: { slug: string }; searchParams: { page?: string | string[] } }

export function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  return contentListMetadata('GUIDE', 'PRODUCT', params.slug, pageParam(searchParams.page))
}

export default function ProductHubPage({ params, searchParams }: Props) {
  return <ContentListPage section="GUIDE" kind="PRODUCT" slug={params.slug} page={pageParam(searchParams.page)} />
}
