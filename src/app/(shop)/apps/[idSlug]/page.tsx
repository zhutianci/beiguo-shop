import type { Metadata } from 'next'
import { ContentDetailPage, contentDetailMetadata } from '@/components/content/content-detail-page'
import { moduleMetadata } from '@/lib/storefront/module-meta'

export const dynamic = 'force-dynamic'

type Props = { params: { idSlug: string } }

function pageMetadata({ params }: Props): Promise<Metadata> {
  return contentDetailMetadata('APP', params.idSlug)
}

export default function AppDetailPage({ params }: Props) {
  return <ContentDetailPage type="APP" raw={params.idSlug} />
}

// 内容模块下放：渠道站换站名 / 地址 / robots（主站原样返回，lib/storefront/module-meta.ts）
export async function generateMetadata(props: Parameters<typeof pageMetadata>[0]): Promise<Metadata> {
  return moduleMetadata(await pageMetadata(props))
}
