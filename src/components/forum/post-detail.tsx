'use client'

/**
 * 帖子详情的交互层（内容平台 P0 起由服务端外壳 app/(shop)/forum/[id]/page.tsx 直出首屏）。
 *
 * 服务端把「对所有人都一样」的东西（标题、正文 HTML、作者、第 1 页评论）作为 initial* 传进来，
 * 所以正文就在服务端 HTML 里——以前整页 'use client'、正文从被 robots 禁抓的 /api/ 拉，爬虫一个字都看不到。
 * 挂载后再请求一次接口，补上因人而异的部分（我赞过没有、能不能编辑、是不是管理员）并计一次浏览。
 */
import { useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ThumbsUp, Eye, MessageCircle, Pin, Star, Lock, Unlock,
  Pencil, Trash2, Send, CornerDownRight, EyeOff, ShieldCheck, Clock, XCircle, CheckCircle2,
} from 'lucide-react'
import { forumFetch, timeAgo } from '@/lib/forum-client'
import { useUserStore } from '@/store/user'
import { CommentsSection, type Comment, type CommentPage } from './comments'

export type { Comment, CommentPage }

export interface Detail {
  id: number
  title: string
  html: string
  authorName: string
  isMember: boolean
  category: { name: string; slug: string; icon: string | null }
  tags: string[]
  pinned: boolean
  featured: boolean
  locked: boolean
  status: number
  reviewStatus: string
  reviewNote: string | null
  originality: string
  sourceUrl: string | null
  aiAssist: string
  views: number
  likeCount: number
  commentCount: number
  /** 作者公开主页（/u/{handle}）；匿名旧帖或取不到时为空 */
  authorHref?: string | null
  likedByMe: boolean
  canEdit: boolean
  isAdmin: boolean
  createdAt: string
}

/**
 * section：返回链接与编辑地址按内容类型走（论坛 / 提示词 / 教程共用这一个组件）。
 * topSlot / bottomSlot：服务端渲染好的块（提示词块、出图、相关内容），原样插进正文前后——
 * 服务端组件可以作为 props 传给客户端组件，它们仍然在服务端渲染。
 */
export interface DetailSection {
  backHref: string
  backLabel: string
}

export function PostDetail({
  initialPost,
  initialComments,
  section = { backHref: '/forum', backLabel: '返回论坛' },
  topSlot,
  bottomSlot,
  afterSlot,
}: {
  initialPost: Detail
  initialComments: CommentPage
  section?: DetailSection
  topSlot?: ReactNode
  bottomSlot?: ReactNode
  afterSlot?: ReactNode
}) {
  const router = useRouter()
  const id = initialPost.id
  const { user } = useUserStore()
  // 「以 xxx 评论」只显示昵称，不显示邮箱（公开作者名已不再回落到邮箱，审计 G48）。
  // 注意 userName 同时是「是否登录」的开关（为空时会冒出匿名昵称输入框），登录用户必须保持非空
  const commentAs = user
    ? user.nickname && !user.nickname.includes('@')
      ? user.nickname
      : '会员（未设置昵称）'
    : null

  const [post, setPost] = useState<Detail | null>(initialPost)
  const [notFound, setNotFound] = useState(false)

  const loadPost = useCallback(async () => {
    const res = await forumFetch(`/api/forum/posts/${id}`)
    const data = await res.json()
    if (data.success) setPost(data.data)
    else setNotFound(true)
  }, [id])

  // 首屏已由服务端给出；挂载后补「因人而异」的状态（点赞、编辑权限）并计浏览
  useEffect(() => {
    loadPost()
    // 仅在帖子 id 变化时重新初始化
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // 请求在途时忽略再次点击：服务端对同一人同一目标的点赞有进程内互斥，双击的第二下会拿到 429
  // 并弹「操作过于频繁」—— 那是给刷赞的，不该让手快双击的正常用户看到
  const likeBusy = useRef(false)
  const toggleLike = async () => {
    if (!post || likeBusy.current) return
    likeBusy.current = true
    try {
      const res = await forumFetch(`/api/forum/posts/${id}/like`, { method: 'POST' })
      const data = await res.json()
      if (data.success) setPost({ ...post, likedByMe: data.data.liked, likeCount: data.data.likeCount })
      else if (data.error) alert(data.error) // 被限流（429）时让人看得到原因
    } finally {
      likeBusy.current = false
    }
  }

  // 运营操作走后台接口（adminGuard：查库复核 + 同源校验），不再借用前台的公开 PATCH
  const adminAction = async (patch: Record<string, unknown>) => {
    if (patch.reviewStatus === 'REJECTED') {
      const note = prompt('驳回原因（作者会看到）：')
      if (!note?.trim()) return
      patch = { ...patch, reviewNote: note.trim() }
    }
    const res = await fetch(`/api/admin/forum/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json()
    if (data.success) loadPost()
    else alert(data.error || '操作失败')
  }

  const deletePost = async () => {
    if (!confirm('确定删除这篇帖子吗？')) return
    const res = await forumFetch(`/api/forum/posts/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) router.push(section.backHref)
    else alert(data.error || '删除失败')
  }

  if (notFound || !post)
    return (
      <div className="min-h-screen page-top text-center">
        <p className="text-white/50 mb-4">帖子不存在或已被删除</p>
        <Link href={section.backHref} className="text-purple-400">{section.backLabel}</Link>
      </div>
    )

  return (
    <div className="min-h-screen page-top pb-20">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      {/* lite-blob：手机端轻量模式（2026-10-01，站长要求电脑端不变）下大模糊光斑换成渐变遮罩（iOS WebKit 画大模糊太贵，滑动出黑块），规则见 globals.css 末尾 */}
      <div className="fixed top-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px] lite-blob pointer-events-none" />
      {/*
        帖子详情属于正文型页面：桌面端不放宽容器（max-w-3xl ≈ 768px，
        在 16.5px 正文下约 40 个汉字 / 一行，正好是阅读舒适区），
        只把字号、行高与留白往上提一档。
      */}
      <div className="container relative max-w-3xl">
        <Link href={section.backHref} className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 text-sm lg:text-[15px]">
          <ArrowLeft className="w-4 h-4" /> {section.backLabel}
        </Link>

        <ReviewBanner post={post} />

        {/* 帖子主体 */}
        <article className="glass rounded-2xl p-6 md:p-8 lg:p-10">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {post.pinned && <Badge color="red" icon={Pin}>置顶</Badge>}
            {post.featured && <Badge color="amber" icon={Star}>精华</Badge>}
            {post.locked && <Badge color="gray" icon={Lock}>已锁定</Badge>}
            {post.status === 0 && <Badge color="gray" icon={EyeOff}>已隐藏</Badge>}
            <Link href={`/forum?category=${post.category.slug}`} className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/60">
              {post.category.icon} {post.category.name}
            </Link>
            <OriginalityBadge originality={post.originality} sourceUrl={post.sourceUrl} />
            {post.aiAssist !== 'NONE' && (
              <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/45">
                {post.aiAssist === 'MAJOR' ? '主要由 AI 生成' : 'AI 辅助撰写'}
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-[34px] lg:leading-tight font-bold mb-4 lg:mb-5">{post.title}</h1>

          <div className="flex items-center gap-3 text-sm text-white/40 mb-6 lg:mb-8 flex-wrap">
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
              {post.authorName.slice(0, 1)}
            </span>
            {post.authorHref ? (
              <Link href={post.authorHref} className="text-white/70 hover:text-white">{post.authorName}</Link>
            ) : (
              <span className="text-white/70">{post.authorName}</span>
            )}
            {post.isMember && <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />}
            {/* 相对时间在服务端与浏览器各算一次，跨过分钟边界会不一致：这里的差异是预期内的 */}
            <span suppressHydrationWarning>· {timeAgo(post.createdAt)}</span>
            <span className="inline-flex items-center gap-1">· <Eye className="w-3.5 h-3.5" />{post.views}</span>
          </div>

          {/* 正文。
              .prose-forum 的 font-size/line-height 是 globals.css 里的普通规则，
              写在 @tailwind utilities 之后，同优先级下会按源码顺序压过 lg:text-*，
              所以这里必须用 `!` 才能在桌面端把 15px 提到 16.5px。 */}
          {topSlot}
          <div
            className="prose-forum text-white/90 lg:!text-[16.5px] lg:!leading-[1.85]"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          {/* 标签 */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {post.tags.map((t) => (
                <span key={t} className="text-xs px-2 py-1 rounded-full bg-white/5 text-purple-300/80">#{t}</span>
              ))}
            </div>
          )}

          {/* 操作栏 */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-white/10 flex-wrap gap-3">
            <button
              onClick={toggleLike}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${
                post.likedByMe ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'glass text-white/70 hover:text-white'
              }`}
            >
              <ThumbsUp className="w-4 h-4" /> {post.likeCount > 0 ? post.likeCount : '点赞'}
            </button>

            <div className="flex items-center gap-2">
              {post.canEdit && (
                <Link href={`/forum/${id}/edit`} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg glass text-sm text-white/60 hover:text-white">
                  <Pencil className="w-3.5 h-3.5" /> 编辑
                </Link>
              )}
              {post.canEdit && (
                <button onClick={deletePost} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg glass text-sm text-red-400 hover:bg-red-500/10">
                  <Trash2 className="w-3.5 h-3.5" /> 删除
                </button>
              )}
            </div>
          </div>

          {/* 管理员运营操作 */}
          {post.isAdmin && (
            <div className="flex items-center gap-2 flex-wrap mt-4 pt-4 border-t border-white/10">
              <span className="text-xs text-white/40">管理：</span>
              <AdminToggle active={post.pinned} onClick={() => adminAction({ pinned: !post.pinned })} icon={Pin}>{post.pinned ? '取消置顶' : '置顶'}</AdminToggle>
              <AdminToggle active={post.featured} onClick={() => adminAction({ featured: !post.featured })} icon={Star}>{post.featured ? '取消精华' : '加精'}</AdminToggle>
              <AdminToggle active={post.locked} onClick={() => adminAction({ locked: !post.locked })} icon={post.locked ? Unlock : Lock}>{post.locked ? '解锁' : '锁帖'}</AdminToggle>
              <AdminToggle active={post.status === 0} onClick={() => adminAction({ status: post.status === 1 ? 0 : 1 })} icon={EyeOff}>{post.status === 1 ? '隐藏' : '恢复'}</AdminToggle>
              {post.reviewStatus !== 'APPROVED' && (
                <AdminToggle active={false} onClick={() => adminAction({ reviewStatus: 'APPROVED' })} icon={CheckCircle2}>审核通过</AdminToggle>
              )}
              {post.reviewStatus !== 'REJECTED' && (
                <AdminToggle active={false} onClick={() => adminAction({ reviewStatus: 'REJECTED' })} icon={XCircle}>驳回</AdminToggle>
              )}
            </div>
          )}
          {bottomSlot}
        </article>

        {afterSlot}

        <CommentsSection
          postId={id}
          initial={initialComments}
          commentCount={post.commentCount}
          gate={post.reviewStatus !== 'APPROVED' || post.status !== 1 ? 'not-public' : post.locked && !post.isAdmin ? 'locked' : 'open'}
          onChanged={loadPost}
          qa
        />

      </div>
    </div>
  )
}

function Badge({ color, icon: Icon, children }: { color: string; icon: any; children: React.ReactNode }) {
  const map: Record<string, string> = {
    red: 'bg-red-500/20 text-red-300',
    amber: 'bg-amber-500/20 text-amber-300',
    gray: 'bg-white/10 text-white/50',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${map[color]}`}>
      <Icon className="w-3 h-3" /> {children}
    </span>
  )
}

function AdminToggle({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: any; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
        active ? 'bg-purple-600/30 text-purple-200' : 'glass text-white/60 hover:text-white'
      }`}
    >
      <Icon className="w-3 h-3" /> {children}
    </button>
  )
}

/** 审核状态提示条：只有作者本人和管理员能打开非公开的帖子，所以这里看到的人就是该看到的人 */
function ReviewBanner({ post }: { post: Detail }) {
  if (post.reviewStatus === 'PENDING') {
    return (
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        <Clock className="mt-0.5 h-4 w-4 shrink-0" />
        <span>审核中：这篇内容目前只有你自己能看到，审核通过后公开显示（工作日 24 小时内处理）。</span>
      </div>
    )
  }
  if (post.reviewStatus === 'REJECTED') {
    return (
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          未通过审核{post.reviewNote ? `：${post.reviewNote}` : ''}。按意见修改后保存，会重新进入审核。
        </span>
      </div>
    )
  }
  if (post.status !== 1) {
    return (
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/60">
        <EyeOff className="mt-0.5 h-4 w-4 shrink-0" />
        <span>这篇内容已被隐藏，目前只有你自己能看到。</span>
      </div>
    )
  }
  return null
}

/** 原创声明（内容平台设计 §6.1）。非首发 / 转载附原文链接（ugc nofollow，与正文外链同口径） */
function OriginalityBadge({ originality, sourceUrl }: { originality: string; sourceUrl: string | null }) {
  if (originality === 'ORIGINAL_FIRST') {
    return <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300">原创首发</span>
  }
  const label = originality === 'REPOST' ? '转载' : '原创 · 首发于他处'
  return (
    <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-white/50">
      {label}
      {sourceUrl && (
        <>
          {' · '}
          <a href={sourceUrl} target="_blank" rel="ugc nofollow noopener noreferrer" className="underline hover:text-white/80">
            原文
          </a>
        </>
      )}
    </span>
  )
}
