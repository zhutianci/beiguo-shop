import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { SKILLS_PATH, SKILL_TAG_SLUG } from '@/lib/content/skill-lib'
import { ContentListPage, contentListMetadata, sortParam } from '@/components/content/content-list-page'
import { pageParam } from '@/components/learn/ui'
import { moduleMetadata } from '@/lib/storefront/module-meta'

export const dynamic = 'force-dynamic'

type Props = { params: { slug: string }; searchParams: { page?: string | string[]; sort?: string | string[] } }

function pageMetadata({ params, searchParams }: Props): Promise<Metadata> {
  // 「Skill 库」是挂在 AI 应用上的主题标签，它的聚合页是 /skills 目录，不是提示词主题页（lib/content/skill-lib.ts）
  if (params.slug === SKILL_TAG_SLUG) permanentRedirect(SKILLS_PATH)
  return contentListMetadata('PROMPT', 'TOPIC', params.slug, pageParam(searchParams.page), sortParam(searchParams.sort))
}

export default function TopicHubPage({ params, searchParams }: Props) {
  if (params.slug === SKILL_TAG_SLUG) permanentRedirect(SKILLS_PATH)
  return <ContentListPage section="PROMPT" kind="TOPIC" slug={params.slug} page={pageParam(searchParams.page)} sort={sortParam(searchParams.sort)} />
}

// 内容模块下放：渠道站换站名 / 地址 / robots（主站原样返回，lib/storefront/module-meta.ts）
export async function generateMetadata(props: Parameters<typeof pageMetadata>[0]): Promise<Metadata> {
  return moduleMetadata(await pageMetadata(props))
}
