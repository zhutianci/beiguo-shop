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
  type TypedSection,
} from '@/lib/content/policy'
import {
  authorNameOf,
  contentIndexable,
  dimsFor,
  facetOf,
  getContentPost,
  imagesOf,
  readingMinutes,
  relatedContent,
  tagsOf,
  type ContentRow,
} from '@/lib/content/queries'
import { authorHref, creatorBadge } from '@/lib/content/creator'
import { authorRefCode, ctaHref } from '@/lib/content/cta'
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
import { FollowButton } from '@/components/learn/social-client'
import { prisma } from '@/lib/db'
import { cardsByIds } from '@/lib/content/queries'
import { Shuffle } from 'lucide-react'

const COMMENT_PAGE_SIZE = 20
const NOINDEX = { index: false, follow: true, googleBot: { index: false, follow: true } }

const SECTION: Record<TypedSection, { backHref: string; backLabel: string; name: string }> = {
  PROMPT: { backHref: '/prompts', backLabel: '返回提示词库', name: '提示词' },
  GUIDE: { backHref: '/guides', backLabel: '返回教程', name: '教程' },
  APP: { backHref: '/apps', backLabel: '返回 AI 应用', name: 'AI 应用' },
}

/** 解析路由参数并处理「走错栏目 / slug 不对」的 308；返回可用的帖子或 null（→ 404） */
async function resolve(type: TypedSection, raw: string): Promise<ContentRow | null> {
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

const SECTION_BASE: Record<TypedSection, string> = { PROMPT: '/prompts', GUIDE: '/guides', APP: '/apps' }

function modelOf(post: ContentRow) {
  return tagsOf(post, 'MODEL')[0] ?? null
}

/** 内容页的转化入口：按标签上登记的落地页（设计 §11.6「只在相关处出现」）。没有登记就不出。带来源与作者内推码（lib/content/cta.ts） */
function ctaOf(post: ContentRow, refCode: string | null): { href: string; label: string } | null {
  const tag = [...tagsOf(post, 'MODEL'), ...tagsOf(post, 'PRODUCT')].find((t) => t.landingPath)
  if (!tag?.landingPath) return null
  const landing = LANDINGS.find((l) => `/chongzhi/${l.slug}` === tag.landingPath)
  return { href: ctaHref(tag.landingPath, post.id, refCode), label: landing ? landing.navLabel : '相关订阅' }
}

function titleFor(post: ContentRow): string {
  if (post.type === 'PROMPT') {
    const model = modelOf(post)
    return `${post.title}：${model ? `${model.name} ` : 'AI '}提示词（可复制）- ${SITE_NAME}`
  }
  if (post.type === 'APP' && post.app) return `${post.app.name} 怎么样：${post.title} - ${SITE_NAME}`
  // 亲测写「实测」；站方据官方文档整理的只写「更新」，不冒充实测
  if (post.testedOn) return `${post.title}（${post.testedOn.toISOString().slice(0, 7)} 实测）- ${SITE_NAME}`
  if (post.checkedOn) return `${post.title}（${post.checkedOn.toISOString().slice(0, 7)} 更新）- ${SITE_NAME}`
  return `${post.title} - ${SITE_NAME}`
}

function descriptionFor(post: ContentRow): string {
  return (post.excerpt || post.prompt?.useCase || plainExcerpt(post.content, 110) || post.title).slice(0, 160)
}

export async function contentDetailMetadata(type: TypedSection, raw: string): Promise<Metadata> {
  const post = await resolve(type, raw)
  /*
   * 【不存在就在 metadata 这一步 404（SEO 批 2，软 404）】这几组路由有 loading.tsx：页面体里再 notFound()，
   * 流式响应的状态码已经是 200 了，爬虫拿到的是「200 + 找不到页面」的软 404。generateMetadata 在首包之前解析，
   * 在这里 notFound() 才能返回真正的 404。只对「真的没有这条」生效；非公开但存在的（作者 / 管理员能看）照旧 noindex，由页面体判权限。
   */
  if (!post) notFound()
  if (!isPublic(post)) return { title: `${SECTION[type].name} - ${SITE_NAME}`, robots: { index: false, follow: false } }
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

function crumbsOf(post: ContentRow, type: TypedSection): Crumb[] {
  const lead = type === 'APP' ? (post.app?.selfPromo ? { name: '作者自荐', path: '/apps/showcase' } : null) : tagsOf(post, type === 'PROMPT' ? 'MODEL' : 'PRODUCT')[0]
  return [
    { name: LEARN_HOME.name, path: LEARN_HOME.path },
    { name: type === 'PROMPT' ? '提示词库' : type === 'APP' ? 'AI 应用' : '教程', path: SECTION_BASE[type] },
    ...(lead ? [{ name: lead.name, path: 'path' in lead ? lead.path : hubHref(lead) }] : []),
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

export async function ContentDetailPage({ type, raw }: { type: TypedSection; raw: string }) {
  const post = await resolve(type, raw)
  if (!post) notFound()
  const user = await getCurrentUser().catch(() => null)
  const isAdmin = user?.role === 'ADMIN'
  if (!canView(post, { userId: user?.id ?? null, isAdmin })) notFound()
  const publicPost = isPublic(post)

  const images = imagesOf(post)
  // 二创链（P2）：这条是谁的同款；以及谁做了这条的同款
  const [remixOrigin, remixIds] = await Promise.all([
    post.remixOfId
      ? prisma.forumPost.findFirst({ where: { id: post.remixOfId, status: 1, reviewStatus: 'APPROVED', deletedAt: null }, select: { id: true, type: true, slug: true, title: true } })
      : Promise.resolve(null),
    publicPost && type === 'PROMPT'
      ? prisma.forumPost.findMany({ where: { remixOfId: post.id, status: 1, reviewStatus: 'APPROVED', deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 12, select: { id: true } })
      : Promise.resolve([]),
  ])
  const remixes = JSON.parse(JSON.stringify(await cardsByIds(remixIds.map((r) => r.id))))

  const [comments, href, related, dims, refCode, badge] = await Promise.all([
    publicPost
      ? loadCommentPage(post.id, 1, COMMENT_PAGE_SIZE, null)
      : Promise.resolve({ list: [], total: 0, page: 1, pageSize: COMMENT_PAGE_SIZE, totalPages: 1 }),
    authorHref(post.userId),
    publicPost ? relatedContent(post) : Promise.resolve([]),
    dimsFor(images),
    // 作者内推返现只给公开内容（未公开的页面只有作者和管理员看得到，带 ref 没有意义）
    publicPost ? authorRefCode(post) : Promise.resolve(null),
    creatorBadge(post.userId),
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
      {badge && (
        <span title={`贝果认证：${badge}`} className="inline-flex items-center gap-1 rounded-full bg-sky-400/15 px-2 py-0.5 text-[11px] text-sky-200">
          <BadgeCheck className="h-3 w-3" /> {badge}
        </span>
      )}
      {href && <FollowButton handle={href.slice(3)} compact />}
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

  const tested = (post.testedOn || post.checkedOn || post.accountTier || post.verifiedAt) && (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-white/50">
      {post.testedOn && (
        <span className="inline-flex items-center gap-1.5">
          <CalendarCheck2 className="h-3.5 w-3.5" /> 作者测试于 {post.testedOn.toISOString().slice(0, 10)}
        </span>
      )}
      {!post.testedOn && post.checkedOn && (
        <span className="inline-flex items-center gap-1.5">
          <CalendarCheck2 className="h-3.5 w-3.5" /> 资料核对于 {post.checkedOn.toISOString().slice(0, 10)} · 依据官方文档与公开资料整理
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
      favoriteCount={post.favoriteCount}
      editHref={editHref}
      backHref={SECTION_BASE[type]}
      admin={{ reviewStatus: post.reviewStatus, status: post.status, featured: post.featured, verified: !!post.verifiedAt, typed: type !== 'APP', ctaRefOff: post.ctaRefOff }}
    />
  )

  // 同款：上游（这条改自哪条）与下游（二创墙）
  const remixFrom = remixOrigin && (
    <p className="text-[13px] text-white/50">
      <Shuffle className="mr-1 inline h-3.5 w-3.5" />
      同款自{' '}
      <Link href={contentPath(remixOrigin.type, remixOrigin.id, remixOrigin.slug)} className="text-white/80 underline decoration-white/25 underline-offset-2 hover:text-white">
        {remixOrigin.title}
      </Link>
    </p>
  )
  const remixWall =
    type === 'PROMPT' && publicPost ? (
      <section className="mt-20">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight lg:text-2xl">同款作品{post.remixCount > 0 ? `（${post.remixCount}）` : ''}</h2>
            <p className="mt-1.5 text-sm text-white/45">用这条提示词做出来的作品；原作者会因此获得积分</p>
          </div>
          <Link href={`/forum/new?type=PROMPT&remix=${post.id}`} className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm text-white/80 hover:border-white/30 hover:text-white">
            <Shuffle className="h-4 w-4" /> 做同款
          </Link>
        </div>
        {remixes.length > 0 ? <PromptMasonry items={remixes} eager={0} /> : <p className="text-sm text-white/35">还没有同款，来做第一个。</p>}
      </section>
    ) : null

  const commentsBlock = (
    <div className="mx-auto mt-20 max-w-3xl">
      <CommentsSection postId={post.id} initial={initialComments} commentCount={post.commentCount} gate={gate} />
    </div>
  )

  const ld = (
    <JsonLd data={[...(publicPost ? [postingJsonLd(post, authorName, href, initialComments)] : []), breadcrumbJsonLd(crumbs)]} />
  )

  // 示例图来源（来自开源仓库的示例图要署名；为空 = 作者自己的出图）
  let credit: { by?: string; url?: string; license?: string } | null = null
  try {
    credit = post.mediaCredit ? JSON.parse(post.mediaCredit) : null
  } catch {
    credit = null
  }
  const creditLine = credit && (
    <p className="mt-3 text-xs text-white/35">
      示例图来源：
      {credit.url ? (
        <a href={credit.url} target="_blank" rel="nofollow noopener noreferrer" className="underline decoration-white/20 underline-offset-2 hover:text-white/70">
          {credit.by || '原作者'}
        </a>
      ) : (
        credit.by || '原作者'
      )}
      {credit.license ? ` · ${credit.license}` : ''}
    </p>
  )

  const facet = type === 'PROMPT' ? facetOf(post) : null

  // —— 文本类提示词（科研、文案、编程……）：没有效果图，提示词面板居中加宽，下面是使用说明与示例输出 ——
  if (type === 'PROMPT' && post.prompt && (facet === 'TEXT' || images.length === 0)) {
    return (
      <>
        {ld}
        <LearnPage>
          <Crumbs crumbs={crumbs} />
          <ReviewNotice post={post} />
          <div className="mx-auto max-w-4xl">
            <header className="learn-in space-y-4">
              <h1 className="text-[28px] font-semibold leading-tight tracking-tight lg:text-[40px]">{post.title}</h1>
              <p className="text-[16px] leading-relaxed text-white/60 lg:text-[17px]">{post.prompt.useCase}</p>
              {meta}
              {tested}
              {remixFrom}
            </header>
            <div className="learn-in mt-8" style={{ animationDelay: '80ms' }}>
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
                cta={ctaOf(post, refCode)}
                tall
              />
            </div>
            <div className="mt-6 space-y-5">
              {tagChips}
              {actions}
            </div>
            {post.content.trim() && (
              <section className="mt-16">
                <h2 className="mb-6 text-2xl font-semibold tracking-tight">使用说明</h2>
                <div className="prose-forum learn-prose" dangerouslySetInnerHTML={{ __html: html }} />
              </section>
            )}
          </div>

          {remixWall}

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
              {creditLine}
            </div>
            <aside className="learn-in space-y-6 lg:sticky lg:top-[calc(var(--header-h,7rem)+1.5rem)] lg:self-start" style={{ animationDelay: '80ms' }}>
              <div className="space-y-4">
                <h1 className="text-[28px] font-semibold leading-tight tracking-tight lg:text-[34px]">{post.title}</h1>
                <p className="text-[15px] leading-relaxed text-white/60">{post.prompt.useCase}</p>
                {meta}
                {tested}
                {remixFrom}
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
                cta={ctaOf(post, refCode)}
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

          {remixWall}

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

  // —— 教程 / AI 应用（应用复用教程的阅读布局，正文是「我用它解决了什么」）——
  const toc = tocFromHtml(html)
  const cta = type === 'APP' ? null : ctaOf(post, refCode)
  const app = type === 'APP' ? post.app : null
  // 作者自荐的外链一律 sponsored（Google 对推广链接的要求，设计 §9.2），普通分享是 ugc
  const appRel = app?.selfPromo ? 'sponsored nofollow noopener noreferrer' : 'ugc nofollow noopener noreferrer'
  const RELATION: Record<string, string> = { AUTHOR: '作者本人开发', EMPLOYEE: '作者在该公司工作', OTHER: '作者与该产品有其他利益关系' }
  const appCard = app && (
    <aside className="learn-card mt-8 grid gap-5 p-6 sm:grid-cols-[1fr_auto] sm:items-center lg:p-7">
      <div className="min-w-0">
        <p className="learn-eyebrow mb-2">AI App</p>
        <p className="text-2xl font-semibold tracking-tight">{app.name}</p>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/55">
          {app.pricing && (
            <div>
              <dt className="inline text-white/35">价格 </dt>
              <dd className="inline">{app.pricing}</dd>
            </div>
          )}
          {app.platforms && (
            <div>
              <dt className="inline text-white/35">平台 </dt>
              <dd className="inline">{app.platforms}</dd>
            </div>
          )}
          {app.trialNote && (
            <div>
              <dt className="inline text-white/35">试用 </dt>
              <dd className="inline">{app.trialNote}</dd>
            </div>
          )}
        </dl>
      </div>
      <a href={app.url} target="_blank" rel={appRel} className="inline-flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black">
        访问官网 ↗
      </a>
    </aside>
  )
  const disclosure = app?.selfPromo && (
    <div className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-300/[0.06] px-5 py-3.5 text-sm text-amber-100">
      作者自荐 · {RELATION[app.relation ?? 'OTHER'] ?? RELATION.OTHER}。本页内容由作者提供，链接为推广链接，请自行判断。
    </div>
  )
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
          {disclosure}
          {appCard}
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
