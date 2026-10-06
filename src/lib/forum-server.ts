/**
 * 论坛的服务端公用逻辑：信任等级查询、风险检测的站点域名、同源校验、评论分页取数。
 *
 * 评论分页同时给 GET /api/forum/posts/[id]/comments 和服务端直出的详情页用——
 * 同一份「哪些评论对外可见、楼中楼怎么拼」只能有一处实现，否则爬虫看到的和买家看到的会不一样。
 */
import { prisma } from './db'
import { error } from './api'
import { memberDisplayName } from './forum'
import { crossSiteReason, hostnameOf, type HeaderLike } from './same-origin'
import { contentFlags, trustLevelFrom, type ContentFlag, type TrustLevel } from './content/policy'

/** 本站域名（风险检测里「站内链接不算外链」用） */
export function siteHosts(): string[] {
  const hosts = new Set<string>(['bigolab.com'])
  for (const v of [process.env.NEXT_PUBLIC_APP_URL, process.env.APP_URL]) {
    const h = hostnameOf(v)
    if (h) hosts.add(h.replace(/^www\./, ''))
  }
  return Array.from(hosts)
}

export function flagsOf(...texts: (string | null | undefined)[]): ContentFlag[] {
  return contentFlags(texts.filter(Boolean).join('\n'), siteHosts())
}

/**
 * 当前用户的信任等级（设计 §8.1）。两次 count 都走 forum_posts 的 user_id 索引，量级很小。
 * 「过审数」不排除已删除的帖子：等级只升不降。
 * 注册时间另查一次：getCurrentUser 的返回字段刻意保持不变（lib/auth.ts loadSessionUser），不往里加列。
 */
export async function trustLevelOf(user: { id: number; role: string }): Promise<TrustLevel> {
  if (user.role === 'ADMIN') return 9
  const [row, approvedPosts, featuredPosts] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { createdAt: true } }),
    prisma.forumPost.count({ where: { userId: user.id, reviewStatus: 'APPROVED' } }),
    prisma.forumPost.count({ where: { userId: user.id, reviewStatus: 'APPROVED', featured: true } }),
  ])
  return trustLevelFrom({ role: user.role, createdAt: row?.createdAt ?? new Date(), approvedPosts, featuredPosts })
}

/**
 * 论坛写接口（发帖、评论、编辑、删除、点赞）的同源校验（规则见 lib/same-origin.ts，审计 G09）。
 *
 * 这些接口都是「浏览器发起、带登录 cookie、会改状态」的，正是 same-origin.ts 说的适用范围：
 * 以前管理员在详情页点「隐藏 / 加精」走的就是这里的公开接口，兄弟子域的 simple POST
 * 能借管理员的 Lax cookie 改帖子状态。curl / 脚本不带 Origin 与 Sec-Fetch-Site，照常可用。
 */
export function forumCrossSite(headers: HeaderLike): Response | null {
  const reason = crossSiteReason(headers)
  if (!reason) return null
  console.warn('[forum] 拒绝非同源的写请求:', reason)
  return error('请求来源不合法，请刷新页面后重试', 403)
}

// ─────────────────────────────── 评论分页 ───────────────────────────────

export interface CommentViewer {
  userId: number | null
  anonId: string | null
  isAdmin: boolean
}

export interface CommentDto {
  id: number
  parentId: number | null
  content: string
  authorName: string
  avatar: string | null
  isMember: boolean
  likeCount: number
  likedByMe: boolean
  canDelete: boolean
  createdAt: Date
  replies?: CommentDto[]
}

export interface CommentPageDto {
  list: CommentDto[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** 顶层评论分页，楼中楼回复跟随其父评论一起返回（不单独分页）。只返回已过审、未隐藏的 */
export async function loadCommentPage(
  postId: number,
  page: number,
  pageSize: number,
  viewer: CommentViewer | null,
): Promise<CommentPageDto> {
  const include = { user: { select: { nickname: true, avatar: true } } }
  const visible = { status: 1, reviewStatus: 'APPROVED' }
  const topWhere = { postId, parentId: null, ...visible }

  const [topComments, total] = await Promise.all([
    prisma.forumComment.findMany({
      where: topWhere,
      // id 兜底，保证翻页稳定（不重不漏）
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      include,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.forumComment.count({ where: topWhere }),
  ])

  const topIds = topComments.map((c) => c.id)
  const replies = topIds.length
    ? await prisma.forumComment.findMany({
        where: { postId, parentId: { in: topIds }, ...visible },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        include,
      })
    : []

  // 当前用户点赞过的评论（只查本页涉及的评论 id）；服务端直出时 viewer 为 null，不查
  const allIds = [...topIds, ...replies.map((r) => r.id)]
  let likedSet = new Set<number>()
  if (viewer && (viewer.userId || viewer.anonId) && allIds.length) {
    const likes = await prisma.forumLike.findMany({
      where: {
        commentId: { in: allIds },
        ...(viewer.userId ? { userId: viewer.userId } : { anonId: viewer.anonId }),
      },
      select: { commentId: true },
    })
    likedSet = new Set(likes.map((l) => l.commentId!).filter(Boolean))
  }

  const shape = (c: (typeof topComments)[number]): CommentDto => ({
    id: c.id,
    parentId: c.parentId,
    content: c.content,
    // 会员按当前昵称现算：库里旧快照可能是邮箱前缀（审计 G48）
    authorName: c.userId ? memberDisplayName(c.user?.nickname, c.userId) : c.authorName,
    avatar: c.user?.avatar || null,
    isMember: !!c.userId,
    likeCount: c.likeCount,
    likedByMe: likedSet.has(c.id),
    canDelete: !!viewer && (viewer.isAdmin || (!!c.userId && c.userId === viewer.userId)),
    createdAt: c.createdAt,
  })

  // 按父评论分组，避免 O(n²) 过滤
  const repliesByParent = new Map<number, CommentDto[]>()
  for (const r of replies) {
    const pid = r.parentId!
    const arr = repliesByParent.get(pid)
    if (arr) arr.push(shape(r))
    else repliesByParent.set(pid, [shape(r)])
  }

  return {
    list: topComments.map((c) => ({ ...shape(c), replies: repliesByParent.get(c.id) || [] })),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  }
}
