/**
 * 提示词 / 教程详情页的服务端外壳（内容平台 P1，设计 §5.1 / §5.2 / §11）。
 * /prompts/[idSlug] 与 /guides/[idSlug] 两个路由各一行调用这里。交互层复用论坛的 PostDetail。
 *
 * 地址规则（设计 §4.2）：路由只按 id 取数据；slug 不对、或者走错了栏目（/guides/12 其实是提示词）一律 308 到规范地址。
 * 能不能收录只看 lib/content/queries 的 contentIndexable（总开关 INDEXING_OPEN 关着时一律 noindex）。
 */
import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { BadgeCheck, CalendarCheck2, UserRound } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { renderMarkdown, plainExcerpt } from '@/lib/markdown'
import { loadCommentPage } from '@/lib/forum-server'
import {
  ACCOUNT_TIER_LABELS,
  canView,
  contentPath,
  isPublic,
  parseIdSlug,
  promptVariables,
  type AccountTier,
} from '@/lib/content/policy'
import { authorNameOf, contentIndexable, getContentPost, imagesOf, relatedContent, tagsOf, type ContentRow } from '@/lib/content/queries'
import { authorHref } from '@/lib/content/creator'
import { LANDINGS } from '@/lib/landing/registry'
import { SITE_NAME } from '@/lib/product-seo'
import { OG_IMAGES, OG_SITE } from '@/lib/seo/og'
import { JsonLd } from '@/lib/seo/jsonld'
import { absUrl } from '@/lib/news/seo'
import { siteOrigin } from '@/lib/news/format'
import { PostDetail, type CommentPage, type Detail } from '@/components/forum/post-detail'
import { PromptBlock } from '@/components/content/prompt-block'
import { RelatedGroups } from '@/components/content/content-ui'

const COMMENT_PAGE_SIZE = 20
const NOINDEX = { index: false, follow: true, googleBot: { index: false, follow: true } }

const SECTION: Record<'PROMPT' | 'GUIDE', { backHref: string; backLabel: string; name: string }> = {
  PROMPT: { backHref: '/prompts', backLabel: '返回提示词库', name: '提示词' },
  GUIDE: { backHref: '/guides', backLabel: '返回教程', name: '教程' },
}

/** 解析路由参数并处理「走错栏目 / slug 不对」的 308；返回可用的帖子或 null（→ 404） */
async function resolve(type: 'PROMPT' | 'GUIDE', raw: string): Promise<ContentRow | null> {
  const parsed = parseIdSlug(decodeURIComponent(raw))
  if (!parsed) return null
  const post = await getContentPost(parsed.id)
  if (!post || post.deletedAt) return null
  const canonical = contentPath(post.type, post.id, post.slug)
  // 只对公开内容做跳转：非公开的帖子能打开的只有作者和管理员，没必要也不该向访客暴露它的规范地址
  if (isPublic(post) && (post.type !== type || canonical !== `${SECTION_BASE[type]}/${raw}`)) permanentRedirect(canonical)
  if (post.type !== type) return null
  return post
}

const SECTION_BASE: Record<'PROMPT' | 'GUIDE', string> = { PROMPT: '/prompts', GUIDE: '/guides' }

function modelOf(post: ContentRow) {
  return tagsOf(post, 'MODEL')[0] ?? null
}

/** 内容页的转化入口：按标签上登记的落地页（设计 §11.6「只在相关处出现」）。没有登记就不出 */
function ctaOf(post: ContentRow): { href: string; label: string } | null {
  const tag = [...tagsOf(post, 'MODEL'), ...tagsOf(post, 'PRODUCT')].find((t) => t.landingPath)
  if (!tag?.landingPath) return null
  const landing = LANDINGS.find((l) => `/chongzhi/${l.slug}` === tag.landingPath)
  return { href: tag.landingPath, label: landing ? `${landing.navLabel} →` : '相关订阅 →' }
}

function titleFor(post: ContentRow): string {
  if (post.type === 'PROMPT') {
    const model = modelOf(post)
    return `${post.title}：${model ? `${model.name} ` : 'AI '}提示词（可复制）- ${SITE_NAME}`
  }
  const month = post.testedOn ? post.testedOn.toISOString().slice(0, 7) : null
  return `${post.title}${month ? `（${month} 实测）` : ''} - ${SITE_NAME}`
}

function descriptionFor(post: ContentRow): string {
  return (post.excerpt || post.prompt?.useCase || plainExcerpt(post.content, 110) || post.title).slice(0, 160)
}

export async function contentDetailMetadata(type: 'PROMPT' | 'GUIDE', raw: string): Promise<Metadata> {
  const post = await resolve(type, raw)
  if (!post || !isPublic(post)) return { title: `${SECTION[type].name} - ${SITE_NAME}`, robots: { index: false, follow: false } }
  const url = contentPath(post.type, post.id, post.slug)
  const description = descriptionFor(post)
  const firstImage = imagesOf(post)[0]
  return {
    metadataBase: new URL(siteOrigin()),
    title: titleFor(post),
    description,
    alternates: { canonical: url },
    ...(contentIndexable(post) ? {} : { robots: NOINDEX }),
    openGraph: {
      ...OG_SITE,
      type: 'article',
      title: post.title,
      description,
      url,
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: (post.contentUpdatedAt ?? post.createdAt).toISOString(),
      images: firstImage ? [{ url: absUrl(firstImage), alt: post.title }] : OG_IMAGES,
    },
  }
}

export async function ContentDetailPage({ type, raw }: { type: 'PROMPT' | 'GUIDE'; raw: string }) {
  const post = await resolve(type, raw)
  if (!post) notFound()
  const user = await getCurrentUser().catch(() => null)
  if (!canView(post, { userId: user?.id ?? null, isAdmin: user?.role === 'ADMIN' })) notFound()
  const publicPost = isPublic(post)

  const [comments, href, related] = await Promise.all([
    publicPost
      ? loadCommentPage(post.id, 1, COMMENT_PAGE_SIZE, null)
      : Promise.resolve({ list: [], total: 0, page: 1, pageSize: COMMENT_PAGE_SIZE, totalPages: 1 }),
    authorHref(post.userId),
    publicPost ? relatedContent(post) : Promise.resolve([]),
  ])
  const initialComments = JSON.parse(JSON.stringify(comments)) as CommentPage
  const authorName = authorNameOf(post)
  const images = imagesOf(post)

  const initialPost: Detail = {
    id: post.id,
    title: post.title,
    html: renderMarkdown(post.content),
    authorName,
    authorHref: href,
    isMember: !!post.userId,
    category: post.category,
    tags: [],
    pinned: post.pinned,
    featured: post.featured,
    locked: post.locked,
    status: post.status,
    reviewStatus: post.reviewStatus,
    reviewNote: publicPost ? null : post.reviewNote,
    originality: post.originality,
    sourceUrl: post.sourceUrl,
    aiAssist: post.aiAssist,
    views: post.views,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    likedByMe: false,
    canEdit: false,
    isAdmin: false,
    createdAt: post.createdAt.toISOString(),
  }

  const tagLinks = (
    <div className="flex flex-wrap gap-2 mb-5">
      {tagsOf(post).map((t) => (
        <Link
          key={t.slug}
          href={t.kind === 'PRODUCT' ? `/guides/p/${t.slug}` : t.kind === 'MODEL' ? `/prompts/m/${t.slug}` : `/prompts/t/${t.slug}`}
          className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/70 hover:text-white"
        >
          #{t.name}
        </Link>
      ))}
    </div>
  )

  const testedLine = (post.testedOn || post.accountTier || post.verifiedAt) && (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/50 mb-5">
      {post.testedOn && (
        <span className="inline-flex items-center gap-1">
          <CalendarCheck2 className="w-3.5 h-3.5" /> 作者测试于 {post.testedOn.toISOString().slice(0, 10)}
        </span>
      )}
      {post.accountTier && (
        <span className="inline-flex items-center gap-1">
          <UserRound className="w-3.5 h-3.5" /> {ACCOUNT_TIER_LABELS[post.accountTier as AccountTier] ?? post.accountTier}
        </span>
      )}
      {post.verifiedAt && (
        <span className="inline-flex items-center gap-1 text-emerald-300">
          <BadgeCheck className="w-3.5 h-3.5" /> 编辑实测可用（{post.verifiedAt.toISOString().slice(0, 10)}）
        </span>
      )}
    </div>
  )

  const topSlot =
    type === 'PROMPT' && post.prompt ? (
      <>
        {tagLinks}
        {images.length > 0 && (
          <div className={`grid gap-2 mb-5 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'}`}>
            {images.map((src, i) => (
              <figure key={src} className="relative overflow-hidden rounded-xl bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`${post.title} 效果图 ${i + 1}`} loading={i === 0 ? 'eager' : 'lazy'} className="w-full h-auto" />
                {/* AI 生成内容的显式标识（设计 §6.6 / 国内标识办法） */}
                <figcaption className="absolute left-2 bottom-2 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white/80">AI 生成</figcaption>
              </figure>
            ))}
          </div>
        )}
        {testedLine}
        <PromptBlock
          postId={post.id}
          prompt={post.prompt.prompt}
          negativePrompt={post.prompt.negativePrompt}
          modelLabel={post.prompt.modelLabel}
          modelName={modelOf(post)?.name ?? null}
          aspectRatio={post.prompt.aspectRatio}
          needsRefImage={post.prompt.needsRefImage}
          useCase={post.prompt.useCase}
          variables={promptVariables(post.prompt.prompt)}
          copyCount={post.copyCount}
          cta={ctaOf(post)}
        />
        {post.content.trim() && <h2 className="text-lg font-bold mt-8 mb-3">心得与说明</h2>}
      </>
    ) : (
      <>
        {tagLinks}
        {testedLine}
      </>
    )

  const cta = type === 'GUIDE' ? ctaOf(post) : null
  const bottomSlot = cta && (
    <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 flex flex-wrap items-center justify-between gap-2">
      <span>需要开通或续费？</span>
      <Link href={cta.href} className="text-purple-300 hover:text-purple-200">{cta.label}</Link>
    </div>
  )

  return (
    <>
      {publicPost && <JsonLd data={postingJsonLd(post, authorName, href, initialComments)} />}
      <PostDetail
        initialPost={initialPost}
        initialComments={initialComments}
        section={SECTION[type]}
        topSlot={topSlot}
        bottomSlot={bottomSlot}
        afterSlot={<RelatedGroups groups={JSON.parse(JSON.stringify(related))} type={type} />}
      />
    </>
  )
}

/**
 * DiscussionForumPosting：提示词与教程都是用户发的内容（Google 文档：站方编辑文章才用 Article）。
 * 出图写成 ImageObject，带 creator / creditText（设计 §6.5）；许可证字段等 P2 有了许可选择再加。
 */
function postingJsonLd(post: ContentRow, authorName: string, href: string | null, comments: CommentPage): Record<string, unknown> {
  const url = absUrl(contentPath(post.type, post.id, post.slug))
  const author = { '@type': 'Person', name: authorName, ...(href ? { url: absUrl(href) } : {}) }
  const toComment = (c: CommentPage['list'][number]): Record<string, unknown> => ({
    '@type': 'Comment',
    text: c.content,
    datePublished: c.createdAt,
    author: { '@type': 'Person', name: c.authorName },
    ...(c.replies && c.replies.length ? { comment: c.replies.map(toComment) } : {}),
  })
  const text = [post.prompt?.useCase, post.prompt?.prompt, plainExcerpt(post.content, 5000)].filter(Boolean).join('\n\n')
  const images = imagesOf(post).map((u) => ({
    '@type': 'ImageObject',
    contentUrl: absUrl(u),
    creator: author,
    creditText: authorName,
  }))
  return {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    mainEntityOfPage: url,
    url,
    headline: post.title,
    text,
    datePublished: post.createdAt.toISOString(),
    dateModified: (post.contentUpdatedAt ?? post.createdAt).toISOString(),
    author,
    ...(images.length ? { image: images } : {}),
    commentCount: post.commentCount,
    interactionStatistic: [
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: post.likeCount },
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: post.commentCount },
    ],
    ...(comments.list.length ? { comment: comments.list.map(toComment) } : {}),
  }
}

