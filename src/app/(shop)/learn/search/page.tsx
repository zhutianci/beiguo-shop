import type { Metadata } from 'next'
import type { Prisma } from '@prisma/client'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'
import { searchThrottled } from '@/lib/search-throttle'
import { PUBLIC_WHERE, cardsByIds } from '@/lib/content/queries'
import { SITE_NAME } from '@/lib/product-seo'
import { Crumbs, Empty, GuideRows, LEARN_HOME, LearnPage, PromptMasonry, SearchBox } from '@/components/learn/ui'

/**
 * 学习平台站内搜索（内容平台 P2）。
 *
 * 不收录（noindex），robots.txt 也屏蔽 /learn/search：站内搜索结果页是百度劲风算法点名的「恶劣聚合页」类型，
 * 而且每个查询词都会生成一个新 URL。
 * 实现：标题 / 摘要 / 提示词 / 使用场景 / 正文的 LIKE 匹配，按「标题命中 > 提示词命中 > 正文命中」粗排。
 * 中文分词全文索引（MySQL ngram）要改表，量级上来再换（设计 §12.2）；几千条以内 LIKE 足够快。
 */
export const dynamic = 'force-dynamic'

type Props = { searchParams: { q?: string | string[] } }

function queryOf(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v || '').trim().slice(0, 60)
}

export function generateMetadata({ searchParams }: Props): Metadata {
  const q = queryOf(searchParams.q)
  return { title: `${q ? `搜索「${q}」` : '搜索'} - AI 学习 - ${SITE_NAME}`, robots: { index: false, follow: true } }
}

export default async function LearnSearchPage({ searchParams }: Props) {
  const q = queryOf(searchParams.q)
  // 多个词按空格切开，每个词都要命中（AND）
  const words = q.split(/\s+/).filter(Boolean).slice(0, 5)
  let ids: number[] = []
  // 限频（lib/search-throttle）：命中时不查库，页面照常渲染、提示稍后再试
  const throttled = words.length > 0 && searchThrottled(headers(), 'learn')
  if (words.length && !throttled) {
    const where: Prisma.ForumPostWhereInput = {
      ...PUBLIC_WHERE,
      AND: words.map((w) => ({
        OR: [
          { title: { contains: w } },
          { excerpt: { contains: w } },
          { content: { contains: w } },
          { prompt: { prompt: { contains: w } } },
          { prompt: { useCase: { contains: w } } },
          { postTags: { some: { tag: { name: { contains: w } } } } },
        ],
      })),
    }
    const rows = await prisma.forumPost.findMany({
      where,
      take: 120,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, title: true, prompt: { select: { prompt: true } } },
    })
    const rank = (r: (typeof rows)[number]) =>
      words.reduce((n, w) => n + (r.title.includes(w) ? 4 : 0) + (r.prompt?.prompt.includes(w) ? 2 : 0), 0)
    ids = rows.sort((a, b) => rank(b) - rank(a)).map((r) => r.id)
  }
  const cards = JSON.parse(JSON.stringify(await cardsByIds(ids)))
  const prompts = cards.filter((c: { type: string }) => c.type === 'PROMPT')
  const rest = cards.filter((c: { type: string }) => c.type !== 'PROMPT')

  return (
    <LearnPage>
      <Crumbs crumbs={[{ name: LEARN_HOME.name, path: LEARN_HOME.path }, { name: '搜索' }]} />
      <h1 className="learn-display mb-8 !text-3xl lg:!text-5xl">{q ? <>搜索「<span className="learn-accent-text">{q}</span>」</> : '搜索'}</h1>
      <SearchBox defaultValue={q} />
      <div className="mt-10">
        {!q ? (
          <p className="text-sm text-white/45">输入关键词，搜索提示词、教程和讨论。</p>
        ) : throttled ? (
          <p className="text-sm text-white/45">搜索太频繁了，请稍等一分钟再试。</p>
        ) : cards.length === 0 ? (
          <Empty title="没有找到相关内容" desc="换个说法试试，或者到提示词库按模型、场景浏览。" href="/prompts" cta="浏览提示词库" />
        ) : (
          <div className="space-y-14">
            <p className="text-sm text-white/45">找到 {cards.length} 条</p>
            {prompts.length > 0 && (
              <section>
                <h2 className="mb-5 text-xl font-semibold">提示词（{prompts.length}）</h2>
                <PromptMasonry items={prompts} />
              </section>
            )}
            {rest.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold">教程与讨论（{rest.length}）</h2>
                <GuideRows items={rest} />
              </section>
            )}
          </div>
        )}
      </div>
    </LearnPage>
  )
}
