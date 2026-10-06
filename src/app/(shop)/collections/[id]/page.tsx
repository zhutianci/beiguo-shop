import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { memberDisplayName } from '@/lib/forum'
import { cardsByIds } from '@/lib/content/queries'
import { SITE_NAME } from '@/lib/product-seo'
import { CollectionFollowButton } from '@/components/learn/social-client'
import { Crumbs, Empty, GuideRows, LEARN_HOME, LearnPage, PageHead, PromptMasonry } from '@/components/learn/ui'

/**
 * 合集公开页（内容平台 P2，设计 §7.5）。用户整理的一组内容（自己的或别人的）。
 * 不收录：合集是「指向别处的链接列表」，没有独立正文，收录了就是薄聚合页（劲风算法打击对象）。
 * 非公开合集只有主人能打开。
 */
export const dynamic = 'force-dynamic'

type Props = { params: { id: string } }

const getCollection = cache(async (id: number) => {
  if (!Number.isInteger(id) || id <= 0) return null
  const c = await prisma.collection.findUnique({ where: { id }, include: { items: { orderBy: { sortOrder: 'asc' }, take: 200 } } })
  if (!c) return null
  const owner = await prisma.user.findUnique({ where: { id: c.userId }, select: { id: true, nickname: true } })
  const handle = await prisma.creatorProfile.findUnique({ where: { userId: c.userId }, select: { handle: true } })
  return { c, ownerName: owner ? memberDisplayName(owner.nickname, owner.id) : '会员', ownerHandle: handle?.handle ?? null }
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await getCollection(Number(params.id))
  return {
    title: d ? `${d.c.title}（合集）- ${SITE_NAME}` : `合集不存在 - ${SITE_NAME}`,
    description: d?.c.intro ?? undefined,
    robots: { index: false, follow: true },
  }
}

export default async function CollectionPage({ params }: Props) {
  const d = await getCollection(Number(params.id))
  if (!d) notFound()
  if (!d.c.isPublic) {
    const me = await getCurrentUser().catch(() => null)
    if (me?.id !== d.c.userId) notFound()
  }
  const cards = JSON.parse(JSON.stringify(await cardsByIds(d.c.items.map((i) => i.postId))))
  const prompts = cards.filter((x: { type: string }) => x.type === 'PROMPT')
  const rest = cards.filter((x: { type: string }) => x.type !== 'PROMPT')
  return (
    <LearnPage>
      <Crumbs crumbs={[{ name: LEARN_HOME.name, path: LEARN_HOME.path }, { name: '合集' }, { name: d.c.title }]} />
      <PageHead
        eyebrow="Collection · 合集"
        title={d.c.title}
        lede={d.c.intro || undefined}
        stats={[{ label: '条内容', value: cards.length }]}
        action={
          <div className="flex flex-wrap gap-2">
            {d.c.isPublic && <CollectionFollowButton id={d.c.id} />}
            {d.ownerHandle && (
              <Link href={`/u/${d.ownerHandle}`} className="inline-flex h-10 items-center rounded-full border border-white/15 px-4 text-sm text-white/75 hover:text-white">
                整理者：{d.ownerName}
              </Link>
            )}
          </div>
        }
      />
      {cards.length === 0 ? (
        <Empty title="这个合集还是空的" />
      ) : (
        <div className="space-y-14">
          {prompts.length > 0 && <PromptMasonry items={prompts} />}
          {rest.length > 0 && <GuideRows items={rest} />}
        </div>
      )}
    </LearnPage>
  )
}
