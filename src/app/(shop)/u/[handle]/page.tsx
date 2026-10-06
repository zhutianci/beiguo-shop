import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { memberDisplayName } from '@/lib/forum'
import { isHandle } from '@/lib/content/creator'
import { countIndexable, listContent } from '@/lib/content/queries'
import { SITE_NAME } from '@/lib/product-seo'
import { OG_IMAGES, OG_SITE } from '@/lib/seo/og'
import { JsonLd } from '@/lib/seo/jsonld'
import { absUrl } from '@/lib/news/seo'
import { siteOrigin } from '@/lib/news/format'
import { ArticleList, ListShell, PromptGrid } from '@/components/content/content-ui'

/**
 * 作者公开主页（内容平台 P1，设计 §4.1 / §11.4 ProfilePage）。地址用随机短码，不用 userId（理由见 lib/content/creator.ts）。
 * 只列公开内容；一条公开内容都没有的作者 404（不给空页面）。有可收录内容且总开关打开时才可被收录。
 */
export const dynamic = 'force-dynamic'

type Props = { params: { handle: string } }

const getCreator = cache(async (handle: string) => {
  if (!isHandle(handle)) return null
  const profile = await prisma.creatorProfile.findUnique({ where: { handle } })
  if (!profile) return null
  const user = await prisma.user.findUnique({ where: { id: profile.userId }, select: { id: true, nickname: true, status: true, createdAt: true } })
  if (!user || user.status !== 1) return null
  const [prompts, guides, discussions] = await Promise.all([
    listContent({ type: 'PROMPT', userId: user.id, page: 1, pageSize: 24 }),
    listContent({ type: 'GUIDE', userId: user.id, page: 1, pageSize: 20 }),
    listContent({ type: 'DISCUSSION', userId: user.id, page: 1, pageSize: 20 }),
  ])
  if (prompts.total + guides.total + discussions.total === 0) return null
  return { profile, user, name: memberDisplayName(user.nickname, user.id), prompts, guides, discussions }
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCreator(params.handle)
  if (!c) return { title: `作者不存在 - ${SITE_NAME}`, robots: { index: false, follow: false } }
  const indexable = (await countIndexable({ userId: c.user.id })) > 0
  const title = `${c.name}的 AI 提示词与教程 - ${SITE_NAME}`
  const description = c.profile.bio || `${c.name} 在贝果分享的 ${c.prompts.total} 条提示词、${c.guides.total} 篇教程。`
  return {
    metadataBase: new URL(siteOrigin()),
    title,
    description,
    alternates: { canonical: `/u/${c.profile.handle}` },
    ...(indexable ? {} : { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } }),
    openGraph: { ...OG_SITE, type: 'profile', title, description, url: `/u/${c.profile.handle}`, images: OG_IMAGES },
  }
}

export default async function CreatorPage({ params }: Props) {
  const c = await getCreator(params.handle)
  if (!c) notFound()
  const url = absUrl(`/u/${c.profile.handle}`)
  const total = c.prompts.total + c.guides.total + c.discussions.total
  const profileLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url,
    dateCreated: c.user.createdAt.toISOString(),
    mainEntity: {
      '@type': 'Person',
      name: c.name,
      identifier: c.profile.handle,
      ...(c.profile.bio ? { description: c.profile.bio } : {}),
      agentInteractionStatistic: { '@type': 'InteractionCounter', interactionType: 'https://schema.org/WriteAction', userInteractionCount: total },
    },
  }
  return (
    <>
      <JsonLd data={profileLd} />
      <ListShell
        crumbs={[{ name: '首页', path: '/' }, { name: '作者' }, { name: c.name }]}
        h1={c.name}
        lede={c.profile.bio || `${c.user.createdAt.getFullYear()} 年加入 · ${c.prompts.total} 条提示词 · ${c.guides.total} 篇教程 · ${c.discussions.total} 个讨论`}
      >
        <div className="space-y-10">
          {c.prompts.total > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4">提示词（{c.prompts.total}）</h2>
              <PromptGrid items={c.prompts.items} />
            </section>
          )}
          {c.guides.total > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4">教程（{c.guides.total}）</h2>
              <ArticleList items={c.guides.items} />
            </section>
          )}
          {c.discussions.total > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4">讨论（{c.discussions.total}）</h2>
              <ArticleList items={c.discussions.items} />
            </section>
          )}
        </div>
      </ListShell>
    </>
  )
}
