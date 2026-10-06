/**
 * 商品详情页的「相关教程与提示词」（内容平台 P1，设计 §11.6）。服务端组件。
 *
 * 两个用处：把商品页的站内权重导给新内容；让全站最薄的商品页（交接文档 §28）多一块真实有用的正文。
 * 按商品的分类 / 名称匹配产品标签（ChatGPT / Claude / Gemini）；匹配不上、或者没有公开内容就整块不渲染。
 * 只在主站渲染（调用方判断渠道站），内容平台本身不对渠道站开放。
 */
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { contentPath } from '@/lib/content/policy'
import { PUBLIC_WHERE } from '@/lib/content/queries'

const PRODUCT_RULES: { slug: string; match: RegExp }[] = [
  { slug: 'chatgpt', match: /chatgpt|gpt|codex/i },
  { slug: 'claude', match: /claude/i },
  { slug: 'gemini', match: /gemini|google/i },
]

export async function RelatedContentForProduct({ categoryName, name }: { categoryName: string | null; name: string }) {
  const hay = `${categoryName ?? ''} ${name}`
  const rule = PRODUCT_RULES.find((r) => r.match.test(hay))
  if (!rule) return null
  let rows: { id: number; type: string; slug: string | null; title: string }[] = []
  try {
    // 产品标签挂在教程上；提示词挂的是模型标签——用「模型标签的落地页与产品标签一致」把两边连起来
    const productTag = await prisma.tag.findFirst({ where: { slug: rule.slug, kind: 'PRODUCT', status: 1 }, select: { id: true, landingPath: true } })
    if (!productTag) return null
    const modelTagIds = productTag.landingPath
      ? (await prisma.tag.findMany({ where: { kind: 'MODEL', status: 1, landingPath: productTag.landingPath }, select: { id: true } })).map((t) => t.id)
      : []
    rows = await prisma.forumPost.findMany({
      where: {
        ...PUBLIC_WHERE,
        type: { in: ['GUIDE', 'PROMPT'] },
        postTags: { some: { tagId: { in: [productTag.id, ...modelTagIds] } } },
      },
      orderBy: [{ featured: 'desc' }, { featuredAt: 'desc' }, { createdAt: 'desc' }],
      take: 6,
      select: { id: true, type: true, slug: true, title: true },
    })
  } catch (e) {
    console.error('[related-for-product]', e)
    return null
  }
  if (!rows.length) return null
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold mb-3">相关教程与提示词</h2>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id}>
            <Link href={contentPath(r.type, r.id, r.slug)} className="flex items-baseline gap-2 text-white/75 hover:text-white">
              <span className="text-xs text-white/40 shrink-0">{r.type === 'PROMPT' ? '提示词' : '教程'}</span>
              <span>{r.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
