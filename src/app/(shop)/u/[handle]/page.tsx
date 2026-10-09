import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { memberDisplayName } from '@/lib/forum'
import { isHandle } from '@/lib/content/creator'
import { countIndexable, listContent } from '@/lib/content/queries'
import { SITE_NAME } from '@/lib/product-seo'
import { OG_IMAGES, OG_SITE } from '@/lib/seo/og'
import { absUrl } from '@/lib/news/seo'
import { siteOrigin } from '@/lib/news/format'
import { Crumbs, GuideRows, LEARN_HOME, LearnPage, PageHead, PromptMasonry } from '@/components/learn/ui'
import { FollowButton } from '@/components/learn/social-client'
import { CreatorAdmin } from '@/components/learn/creator-admin-client'
import { levelOf } from '@/lib/content/points'
import { moduleMetadata } from '@/lib/storefront/module-meta'
import { currentBrand } from '@/lib/storefront/brand-meta'
import type { StoreBrand } from '@/lib/brand-base'
import { PlatformJsonLd } from '@/components/seo/platform-json-ld'

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
  const followers = await prisma.follow.count({ where: { followeeId: user.id } })
  return { profile, user, name: memberDisplayName(user.nickname, user.id), prompts, guides, discussions, followers }
})

async function pageMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCreator(params.handle)
  if (!c) return { title: `作者不存在 - ${SITE_NAME}`, robots: { index: false, follow: false } }
  const indexable = (await countIndexable({ userId: c.user.id }, 1)) > 0
  const title = `${c.name}的 AI 提示词与教程 - ${SITE_NAME}`
  // 白标渠道（内容模块下放）：「贝果」换成渠道站名
  const site = siteShortName(await currentBrand())
  const description = c.profile.bio || `${c.name} 在${site}分享的 ${c.prompts.total} 条提示词、${c.guides.total} 篇教程。`
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
  const site = siteShortName(await currentBrand())
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
      <PlatformJsonLd data={profileLd} />
      <LearnPage>
        <Crumbs crumbs={[{ name: LEARN_HOME.name, path: LEARN_HOME.path }, { name: '作者' }, { name: c.name }]} />
        <PageHead
          eyebrow="Creator · 作者"
          title={c.name}
          lede={c.profile.bio || `${c.user.createdAt.getFullYear()} 年加入${site}。`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-black">
                Lv{levelOf(c.profile.points).lv} {levelOf(c.profile.points).name}
              </span>
              {c.profile.coBuilder && <span className="inline-flex h-10 items-center rounded-full bg-amber-300/20 px-4 text-sm text-amber-200">共建者</span>}
              {c.profile.certifiedAt && (
                <span className="inline-flex h-10 items-center rounded-full bg-sky-400/15 px-4 text-sm text-sky-200">认证 · {c.profile.certTitle || '创作者'}</span>
              )}
              <FollowButton handle={c.profile.handle} />
            </div>
          }
          stats={[
            { label: '条提示词', value: c.prompts.total },
            { label: '篇教程', value: c.guides.total },
            { label: '积分', value: c.profile.points },
            { label: '关注者', value: c.followers },
          ]}
        />
        <CreatorAdmin handle={c.profile.handle} coBuilder={c.profile.coBuilder} certTitle={c.profile.certifiedAt ? c.profile.certTitle || '认证创作者' : null} />
        <div className="space-y-20">
          {c.prompts.total > 0 && (
            <section>
              <h2 className="mb-6 text-xl font-semibold tracking-tight lg:text-2xl">提示词</h2>
              <PromptMasonry items={c.prompts.items} />
            </section>
          )}
          {c.guides.total > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold tracking-tight lg:text-2xl">教程</h2>
              <GuideRows items={c.guides.items} />
            </section>
          )}
          {c.discussions.total > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold tracking-tight lg:text-2xl">讨论</h2>
              <GuideRows items={c.discussions.items} />
            </section>
          )}
        </div>
      </LearnPage>
    </>
  )
}

// 内容模块下放：渠道站换站名 / 地址 / robots（主站原样返回，lib/storefront/module-meta.ts）
export async function generateMetadata(props: Parameters<typeof pageMetadata>[0]): Promise<Metadata> {
  return moduleMetadata(await pageMetadata(props))
}

/** 「在贝果分享」「加入贝果」里的站名：主站与没改名的渠道是「贝果」，改了名的渠道是渠道站名 */
function siteShortName(brand: StoreBrand): string {
  return brand.custom ? brand.name : '贝果'
}
