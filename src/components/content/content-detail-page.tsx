/**
 * 提示词 / 教程详情页的服务端外壳（内容平台 P1，2026-10-06 改版为 AI 学习平台的独立设计）。
 * /prompts/[idSlug] 与 /guides/[idSlug] 两个路由各一行调用这里。
 *
 *  - 提示词：左侧效果图查看器（灯箱）/ 右侧吸顶的提示词面板，下方「心得与说明」、相关内容、评论
 *  - 教程：阅读型长文（编辑字阶、侧栏目录滚动高亮、顶部阅读进度），下方相关教程、评论
 *
 * 地址规则（设计 §4.2）：路由只按 id 取数据；slug 不对、或者走错了栏目（/guides/12 其实是提示词）一律 308 到规范地址。
 * 能不能收录只看 lib/content/queries 的 contentIndexable（总开关 INDEXING_OPEN 关着时一律 noindex）。
 * 首屏全部服务端直出；因人而异的状态（点赞、编辑权限、管理员操作）由 ContentActions 挂载后补。
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { BadgeCheck, CalendarCheck2, Clock3, EyeOff, UserRound, XCircle } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { renderMarkdown, plainExcerpt, tocFromHtml } from '@/lib/markdown'
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
import {
  authorNameOf,
  contentIndexable,
  dimsFor,
  getContentPost,
  imagesOf,
  readingMinutes,
  relatedContent,
  tagsOf,
  type ContentRow,
} from '@/lib/content/queries'
import { authorHref } from '@/lib/content/creator'
import { LANDINGS } from '@/lib/landing/registry'
import { SITE_NAME } from '@/lib/product-seo'
import { OG_IMAGES, OG_SITE } from '@/lib/seo/og'
import { JsonLd } from '@/lib/seo/jsonld'
import { breadcrumbJsonLd, type Crumb } from '@/lib/seo/graph'
import { absUrl } from '@/lib/news/seo'
import { siteOrigin } from '@/lib/news/format'
import { CommentsSection, type CommentPage } from '@/components/forum/comments'
import { Crumbs, GuideRows, LEARN_HOME, LearnPage, MetaDot, PromptMasonry, ReadTime, hubHref } from '@/components/learn/ui'
import { ImageViewer } from '@/components/learn/image-viewer-client'
import { PromptPanel } from '@/components/learn/prompt-panel-client'
import { ReadingProgress, Toc } from '@/components/learn/reading-client'
import { ContentActions } from '@/components/learn/actions-client'

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
  return { href: tag.landingPath, label: landing ? landing.navLabel : '相关订阅' }
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

function crumbsOf(post: ContentRow, type: 'PROMPT' | 'GUIDE'): Crumb[] {
  const lead = tagsOf(post, type === 'PROMPT' ? 'MODEL' : 'PRODUCT')[0]
  return [
    { name: LEARN_HOME.name, path: LEARN_HOME.path },
    { name: type === 'PROMPT' ? '提示词库' : '教程', path: SECTION_BASE[type] },
    ...(lead ? [{ name: lead.name, path: hubHref(lead) }] : []),
    { name: post.title },
  ]
}

/** 审核状态提示：非公开的内容只有作者本人和管理员能打开，看到它的人就是该看到的人 */
function ReviewNotice({ post }: { post: ContentRow }) {
  if (post.reviewStatus === 'PENDING') {
    return (
      <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-300/25 bg-amber-300/[0.07] px-5 py-4 text-sm text-amber-100">
        <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
        <span>审核中：目前只有你自己能看到，审核通过后公开（工作日 24 小时内处理）。</span>
      </div>
    )
  }
  if (post.reviewStatus === 'REJECTED') {
    return (
      <div className="mb-8 flex items-start gap-3 rounded-2xl border border-red-300/25 bg-red-400/[0.07] px-5 py-4 text-sm text-red-100">
        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>未通过审核{post.reviewNote ? `：${post.reviewNote}` : ''}。按意见修改后保存，会重新进入审核。</span>
      </div>
    )
  }
  if (post.status !== 1) {
    return (
      <div className="mb-8 flex items-start gap-3 rounded-2xl border border-white/12 bg-white/[0.04] px-5 py-4 text-sm text-white/70">
        <EyeOff className="mt-0.5 h-4 w-4 shrink-0" />
        <span>这篇内容已被隐藏，目前只有你自己能看到。</span>
      </div>
    )
  }
  return null
}

function Originality({ post }: { post: ContentRow }) {
  if (post.originality === 'ORIGINAL_FIRST') return <span className="text-emerald-300/90">原创首发</span>
  return (
    <span>
      {post.originality === 'REPOST' ? '转载' : '原创 · 首发于他处'}
      {post.sourceUrl && (
        <>
          {' '}
          <a href={post.sourceUrl} target="_blank" rel="ugc nofollow noopener noreferrer" className="underline decoration-white/30 underline-offset-2 hover:text-white">
            原文
          </a>
        </>
      )}
    </span>
  )
}

export async function ContentDetailPage({ type, raw }: { type: 'PROMPT' | 'GUIDE'; raw: string }) {
  const post = await resolve(type, raw)
  if (!post) notFound()
  const user = await getCurrentUser().catch(() => null)
  const isAdmin = user?.role === 'ADMIN'
  if (!canView(post, { userId: user?.id ?? null, isAdmin })) notFound()
  const publicPost = isPublic(post)

  const images = imagesOf(post)
  const [comments, href, related, dims] = await Promise.all([
    publicPost
      ? loadCommentPage(post.id, 1, COMMENT_PAGE_SIZE, null)
      : Promise.resolve({ list: [], total: 0, page: 1, pageSize: COMMENT_PAGE_SIZE, totalPages: 1 }),
    authorHref(post.userId),
    publicPost ? relatedContent(post) : Promise.resolve([]),
    dimsFor(images),
  ])
  const initialComments = JSON.parse(JSON.stringify(comments)) as CommentPage
  const authorName = authorNameOf(post)
  const crumbs = crumbsOf(post, type)
  const html = renderMarkdown(post.content)
  const gate = !publicPost ? 'not-public' : post.locked && !isAdmin ? 'locked' : 'open'
  const editHref = `/forum/${post.id}/edit`
  const model = modelOf(post)

  const meta = (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13px] text-white/45">
      {href ? (
        <Link href={href} className="inline-flex items-center gap-2 text-white/75 hover:text-white">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 text-[11px] font-bold text-black">
            {authorName.slice(0, 1)}
          </span>
          {authorName}
        </Link>
      ) : (
        <span className="text-white/75">{authorName}</span>
      )}
      <MetaDot />
      <time dateTime={post.createdAt.toISOString()}>{post.createdAt.toISOString().slice(0, 10)}</time>
      <MetaDot />
      <Originality post={post} />
      {post.aiAssist !== 'NONE' && (
        <>
          <MetaDot />
          <span>{post.aiAssist === 'MAJOR' ? '正文主要由 AI 生成' : 'AI 辅助撰写'}</span>
        </>
      )}
    </div>
  )

  const tested = (post.testedOn || post.accountTier || post.verifiedAt) && (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-white/50">
      {post.testedOn && (
        <span className="inline-flex items-center gap-1.5">
          <CalendarCheck2 className="h-3.5 w-3.5" /> 作者测试于 {post.testedOn.toISOString().slice(0, 10)}
        </span>
      )}
      {post.accountTier && (
        <span className="inline-flex items-center gap-1.5">
          <UserRound className="h-3.5 w-3.5" /> {ACCOUNT_TIER_LABELS[post.accountTier as AccountTier] ?? post.accountTier} 账号
        </span>
      )}
      {post.verifiedAt && (
        <span className="inline-flex items-center gap-1.5 text-emerald-300">
          <BadgeCheck className="h-3.5 w-3.5" /> 编辑实测可用
        </span>
      )}
    </div>
  )

  const tagChips = (
    <div className="flex flex-wrap gap-2">
      {tagsOf(post).map((t) => (
        <Link key={t.slug} href={hubHref(t)} className="learn-chip">
          {t.name}
        </Link>
      ))}
    </div>
  )

  const actions = (
    <ContentActions
      postId={post.id}
      likeCount={post.likeCount}
      editHref={editHref}
      backHref={SECTION_BASE[type]}
      admin={{ reviewStatus: post.reviewStatus, status: post.status, featured: post.featured, verified: !!post.verifiedAt, typed: true }}
    />
  )

  const commentsBlock = (
    <div className="mx-auto mt-20 max-w-3xl">
      <CommentsSection postId={post.id} initial={initialComments} commentCount={post.commentCount} gate={gate} />
    </div>
  )

  const ld = (
    <JsonLd data={[...(publicPost ? [postingJsonLd(post, authorName, href, initialComments)] : []), breadcrumbJsonLd(crumbs)]} />
  )

  if (type === 'PROMPT' && post.prompt) {
    return (
      <>
        {ld}
        <LearnPage>
          <Crumbs crumbs={crumbs} />
          <ReviewNotice post={post} />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-12">
            <div className="learn-in">
              <ImageViewer images={images.map((src) => ({ src, w: dims.get(src)?.w ?? null, h: dims.get(src)?.h ?? null }))} title={post.title} />
            </div>
            <aside className="learn-in space-y-6 lg:sticky lg:top-[calc(var(--header-h,7rem)+1.5rem)] lg:self-start" style={{ animationDelay: '80ms' }}>
              <div className="space-y-4">
                <h1 className="text-[28px] font-semibold leading-tight tracking-tight lg:text-[34px]">{post.title}</h1>
                <p className="text-[15px] leading-relaxed text-white/60">{post.prompt.useCase}</p>
                {meta}
                {tested}
              </div>
              <PromptPanel
                postId={post.id}
                prompt={post.prompt.prompt}
                negativePrompt={post.prompt.negativePrompt}
                modelLabel={post.prompt.modelLabel}
                modelName={model?.name ?? null}
                modelHref={model ? hubHref(model) : null}
                aspectRatio={post.prompt.aspectRatio}
                needsRefImage={post.prompt.needsRefImage}
                variables={promptVariables(post.prompt.prompt)}
                copyCount={post.copyCount}
                cta={ctaOf(post)}
              />
              {tagChips}
              {actions}
            </aside>
          </div>

          {post.content.trim() && (
            <section className="mx-auto mt-20 max-w-3xl">
              <h2 className="mb-6 text-2xl font-semibold tracking-tight">心得与说明</h2>
              <div className="prose-forum learn-prose" dangerouslySetInnerHTML={{ __html: html }} />
            </section>
          )}

          {related.map((g) => (
            <section key={g.title} className="mt-20">
              <h2 className="mb-6 text-xl font-semibold tracking-tight lg:text-2xl">{g.title}</h2>
              <PromptMasonry items={JSON.parse(JSON.stringify(g.items))} eager={0} />
            </section>
          ))}

          {commentsBlock}
        </LearnPage>
      </>
    )
  }

  // —— 教程 ——
  const toc = tocFromHtml(html)
  const cta = ctaOf(post)
  return (
    <>
      {ld}
      <ReadingProgress targetId="article-body" />
      <LearnPage>
        <Crumbs crumbs={crumbs} />
        <ReviewNotice post={post} />
        <header className="learn-in mx-auto max-w-3xl lg:mx-0">
          <div className="mb-5 flex flex-wrap gap-2">
            {tagsOf(post).map((t) => (
              <Link key={t.slug} href={hubHref(t)} className="learn-chip">
                {t.name}
              </Link>
            ))}
          </div>
          <h1 className="text-[30px] font-semibold leading-[1.15] tracking-tight lg:text-[44px]">{post.title}</h1>
          {post.excerpt && <p className="mt-5 text-[16px] leading-relaxed text-white/55 lg:text-[18px]">{post.excerpt}</p>}
          <div className="mt-7 space-y-2.5 border-t border-white/[0.08] pt-5">
            {meta}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-white/50">
              <ReadTime minutes={readingMinutes(post.content)} />
            </div>
            {tested}
          </div>
        </header>

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_220px] xl:gap-20">
          <article id="article-body" className="min-w-0 max-w-[720px]">
            <div className="prose-forum learn-prose" dangerouslySetInnerHTML={{ __html: html }} />
            {cta && (
              <div className="learn-card mt-12 flex flex-wrap items-center justify-between gap-3 px-6 py-5">
                <span className="text-sm text-white/65">需要开通或续费？</span>
                <Link href={cta.href} className="text-sm font-medium text-white hover:underline">
                  {cta.label} →
                </Link>
              </div>
            )}
            <div className="mt-10">{actions}</div>
          </article>
          <aside className="hidden lg:block">
            <div className="sticky top-[calc(var(--header-h,7rem)+1.5rem)]">
              <Toc items={toc} />
            </div>
          </aside>
        </div>

        {related.map((g) => (
          <section key={g.title} className="mx-auto mt-20 max-w-3xl lg:mx-0 lg:max-w-[720px]">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">{g.title}</h2>
            <GuideRows items={JSON.parse(JSON.stringify(g.items))} />
          </section>
        ))}

        <div className="lg:max-w-[720px]">{commentsBlock}</div>
      </LearnPage>
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
