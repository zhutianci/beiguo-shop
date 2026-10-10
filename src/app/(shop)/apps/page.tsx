import type { Metadata } from 'next'
import { ContentListPage, contentListMetadata, sortParam } from '@/components/content/content-list-page'
import { pageParam } from '@/components/learn/ui'
import { moduleMetadata } from '@/lib/storefront/module-meta'

export const dynamic = 'force-dynamic'

type Props = { searchParams: { page?: string | string[]; sort?: string | string[] } }

function pageMetadata({ searchParams }: Props): Promise<Metadata> {
  return contentListMetadata('APP', 'ROOT', undefined, pageParam(searchParams.page), sortParam(searchParams.sort))
}

export default function AppsPage({ searchParams }: Props) {
  return <ContentListPage section="APP" kind="ROOT" page={pageParam(searchParams.page)} sort={sortParam(searchParams.sort)} />
}

// 内容模块下放：渠道站换站名 / 地址 / robots（主站原样返回，lib/storefront/module-meta.ts）
export async function generateMetadata(props: Parameters<typeof pageMetadata>[0]): Promise<Metadata> {
  return moduleMetadata(await pageMetadata(props))
}
