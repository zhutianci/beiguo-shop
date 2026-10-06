import type { Metadata } from 'next'
import { ContentDetailPage, contentDetailMetadata } from '@/components/content/content-detail-page'

export const dynamic = 'force-dynamic'

type Props = { params: { idSlug: string } }

export function generateMetadata({ params }: Props): Promise<Metadata> {
  return contentDetailMetadata('APP', params.idSlug)
}

export default function AppDetailPage({ params }: Props) {
  return <ContentDetailPage type="APP" raw={params.idSlug} />
}
