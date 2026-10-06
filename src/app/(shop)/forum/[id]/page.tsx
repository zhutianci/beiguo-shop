import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { renderMarkdown, plainExcerpt } from '@/lib/markdown'
import { memberDisplayName } from '@/lib/forum'
import { loadCommentPage } from '@/lib/forum-server'
import { canView, contentPath, isPublic } from '@/lib/content/policy'
import { contentIndexable } from '@/lib/content/queries'
import { authorHref } from '@/lib/content/creator'
import { SITE_NAME } from '@/lib/product-seo'
import { OG_IMAGES, OG_SITE } from '@/lib/seo/og'
import { JsonLd } from '@/lib/seo/jsonld'
import { absUrl } from '@/lib/news/seo'
import { siteOrigin } from '@/lib/news/format'
import { PostDetail, type CommentPage, type Detail } from '@/components/forum/post-detail'

/**
 * 帖子详情的服务端外壳（内容平台 P0，设计 §11.2）。
 *
 * 以前整页 'use client'、正文从 /api/ 拉，而 robots 禁抓 /api/——爬虫看到的是一个空壳，
 * 标题还继承列表页（交接文档 §28 第 9 条）。现在标题、正文、第 1 页评论都在服务端 HTML 里，
 * 每帖有自己的 title / description / canonical 和 DiscussionForumPosting。
 *
 * 能不能被收录只由 lib/content/policy 的 isIndexable 决定（P0 总开关关着：一律 noindex,follow）。
 */
export const dynamic = 'force-dynamic'

const COMMENT_PAGE_SIZE = 20

const getPost = cache(async (id: number) => {
  if (!Number.isInteger(id) || id <= 0) return null
  try {
    return await prisma.forumPost.findUnique({
      where: { id },
      include: {
        category: { select: { name: true, slug: true, icon: true, color: true } },
        user: { select: { nickname: true, avatar: true } },
        prompt: { select: { prompt: true } },
        postTags: { select: { tag: { select: { kind: true, status: true } } } },
      },
    })
  } catch (e) {
    // 查询失败按「不存在」处理，不让整页 500（发版时序错了、新列还没建好时也能降级成 404）
    console.error('[forum/detail getPost]', e)
    return null
  }
})

type PostRow = NonNullable<Awaited<ReturnType<typeof getPost>>>

function authorOf(p: PostRow): string {
  // 会员按当前昵称现算：库里旧快照可能是邮箱前缀（审计 G48）
  return p.userId ? memberDisplayName(p.user?.nickname, p.userId) : p.authorName
}

function imagesOf(p: PostRow): string[] {
  try {
    return p.images ? (JSON.parse(p.images) as string[]).filter((u) => typeof u === 'string') : []
  } catch {
    return []
  }
}

const NOINDEX = { index: false, follow: true, googleBot: { index: false, follow: true } }

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const post = await getPost(Number(params.id))
  // 提示词 / 教程的规范地址不在 /forum 下（页面本体会 308 过去，这里只给一个不收录的兜底）
  if (post && post.type !== 'DISCUSSION') return { robots: { index: false, follow: true } }
  // 非公开（待审 / 驳回 / 隐藏）的帖子能打开的只有作者和管理员；给一个通用标题且不收录
  if (!post || !isPublic(post)) {
    return { title: `社区讨论 - ${SITE_NAME}`, robots: { index: false, follow: false } }
  }
  const description = plainExcerpt(post.content, 110) || post.title
  const url = `/forum/${post.id}`
  const firstImage = imagesOf(post)[0]
  const images = firstImage ? [{ url: absUrl(firstImage), alt: post.title }] : OG_IMAGES
  return {
    metadataBase: new URL(siteOrigin()),
    title: `${post.title} - 社区讨论 - ${SITE_NAME}`,
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
      images,
    },
  }
}

export default async function ForumPostPage({ params }: { params: { id: string } }) {
  const post = await getPost(Number(params.id))
  if (!post) notFound()
  // 内容平台 P1：提示词 / 教程挪到了 /prompts、/guides。老链接（含 P1 之前从论坛发出去的）永久跳到新地址（设计 §4.2）
  if (post.type !== 'DISCUSSION' && isPublic(post)) permanentRedirect(contentPath(post.type, post.id, post.slug))

  const user = await getCurrentUser().catch(() => null)
  const viewer = { userId: user?.id ?? null, isAdmin: user?.role === 'ADMIN' }
  if (!canView(post, viewer)) notFound()
  const publicPost = isPublic(post)

  // 第 1 页评论：服务端不带访客身份取（点赞状态、删除权限挂载后由客户端补）
  const href = await authorHref(post.userId)
  const comments = publicPost
    ? await loadCommentPage(post.id, 1, COMMENT_PAGE_SIZE, null)
    : { list: [], total: 0, page: 1, pageSize: COMMENT_PAGE_SIZE, totalPages: 1 }
  // Date → 字符串：交给客户端组件的 props 必须可序列化
  const initialComments = JSON.parse(JSON.stringify(comments)) as CommentPage

  const authorName = authorOf(post)
  const initialPost: Detail = {
    id: post.id,
    title: post.title,
    html: renderMarkdown(post.content),
    authorName,
    authorHref: href,
    isMember: !!post.userId,
    category: post.category,
    tags: post.tags ? post.tags.split(',').filter(Boolean) : [],
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
    // 因人而异的部分先给保守值，挂载后由 GET /api/forum/posts/[id] 补
    likedByMe: false,
    canEdit: false,
    isAdmin: false,
    createdAt: post.createdAt.toISOString(),
  }

  return (
    <>
      {publicPost && <JsonLd data={postingJsonLd(post, authorName, initialComments)} />}
      <PostDetail initialPost={initialPost} initialComments={initialComments} />
    </>
  )
}

/**
 * DiscussionForumPosting（Google 文档：只用于用户发的帖子；站方编辑文章要用 Article）。
 * comment 按页面上的顺序嵌套（第 1 页顶层评论 + 各自的楼中楼），只放页面上真实可见的内容。
 */
function postingJsonLd(post: PostRow, authorName: string, comments: CommentPage): Record<string, unknown> {
  const url = absUrl(`/forum/${post.id}`)
  const toComment = (c: CommentPage['list'][number]): Record<string, unknown> => ({
    '@type': 'Comment',
    text: c.content,
    datePublished: c.createdAt,
    author: { '@type': 'Person', name: c.authorName },
    ...(c.replies && c.replies.length ? { comment: c.replies.map(toComment) } : {}),
  })
  const images = imagesOf(post).map((u) => absUrl(u))
  return {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    mainEntityOfPage: url,
    url,
    headline: post.title,
    text: plainExcerpt(post.content, 5000),
    datePublished: post.createdAt.toISOString(),
    dateModified: (post.contentUpdatedAt ?? post.createdAt).toISOString(),
    author: { '@type': 'Person', name: authorName },
    ...(images.length ? { image: images } : {}),
    commentCount: post.commentCount,
    interactionStatistic: [
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/LikeAction', userInteractionCount: post.likeCount },
      { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: post.commentCount },
    ],
    ...(comments.list.length ? { comment: comments.list.map(toComment) } : {}),
  }
}
