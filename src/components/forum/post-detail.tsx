'use client'

/**
 * 帖子详情的交互层（内容平台 P0 起由服务端外壳 app/(shop)/forum/[id]/page.tsx 直出首屏）。
 *
 * 服务端把「对所有人都一样」的东西（标题、正文 HTML、作者、第 1 页评论）作为 initial* 传进来，
 * 所以正文就在服务端 HTML 里——以前整页 'use client'、正文从被 robots 禁抓的 /api/ 拉，爬虫一个字都看不到。
 * 挂载后再请求一次接口，补上因人而异的部分（我赞过没有、能不能编辑、是不是管理员）并计一次浏览。
 */
import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ThumbsUp, Eye, MessageCircle, Pin, Star, Lock, Unlock,
  Pencil, Trash2, Send, CornerDownRight, EyeOff, ShieldCheck, Clock, XCircle, CheckCircle2,
} from 'lucide-react'
import { forumFetch, timeAgo } from '@/lib/forum-client'
import { useUserStore } from '@/store/user'
import { withRedirect } from '@/lib/safe-redirect'

export interface Comment {
  id: number
  parentId: number | null
  content: string
  authorName: string
  isMember: boolean
  likeCount: number
  likedByMe: boolean
  canDelete: boolean
  createdAt: string
  replies?: Comment[]
}
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
  likedByMe: boolean
  canEdit: boolean
  isAdmin: boolean
  createdAt: string
}

// 评论每页条数（顶层评论，楼中楼回复跟随父评论返回）
const COMMENT_PAGE_SIZE = 20

export interface CommentPage {
  list: Comment[]
  total: number
  page: number
  totalPages: number
}

export function PostDetail({ initialPost, initialComments }: { initialPost: Detail; initialComments: CommentPage }) {
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
  const [comments, setComments] = useState<Comment[]>(initialComments.list)
  const [notFound, setNotFound] = useState(false)

  // 评论分段加载状态
  const [cPage, setCPage] = useState(initialComments.page) // 已加载到第几页
  const [cTotalPages, setCTotalPages] = useState(initialComments.totalPages)
  const [cTotal, setCTotal] = useState(initialComments.total)
  const [cLoading, setCLoading] = useState(false)
  const [cHint, setCHint] = useState('')

  const loadPost = useCallback(async () => {
    const res = await forumFetch(`/api/forum/posts/${id}`)
    const data = await res.json()
    if (data.success) setPost(data.data)
    else setNotFound(true)
  }, [id])

  const fetchCommentPage = useCallback(
    async (target: number): Promise<CommentPage | null> => {
      const res = await forumFetch(
        `/api/forum/posts/${id}/comments?page=${target}&pageSize=${COMMENT_PAGE_SIZE}`
      )
      const data = await res.json()
      return data.success ? (data.data as CommentPage) : null
    },
    [id]
  )

  // 重新拉取「第 1 页 ~ 第 upTo 页」，保持已展开的评论范围不丢
  const reloadComments = useCallback(
    async (upTo: number) => {
      const last = Math.max(upTo, 1)
      setCLoading(true)
      try {
        const pages = await Promise.all(
          Array.from({ length: last }, (_, i) => fetchCommentPage(i + 1))
        )
        if (pages.some((p) => p === null)) return
        const ok = pages as CommentPage[]
        setComments(ok.flatMap((p) => p.list))
        const tail = ok[ok.length - 1]
        setCPage(tail.page)
        setCTotalPages(tail.totalPages)
        setCTotal(tail.total)
      } finally {
        setCLoading(false)
      }
    },
    [fetchCommentPage]
  )

  // 加载更多评论：追加到列表尾部
  const loadMoreComments = useCallback(async () => {
    setCLoading(true)
    setCHint('')
    try {
      const d = await fetchCommentPage(cPage + 1)
      if (!d) return
      setComments((prev) => [...prev, ...d.list])
      setCPage(d.page)
      setCTotalPages(d.totalPages)
      setCTotal(d.total)
    } finally {
      setCLoading(false)
    }
  }, [fetchCommentPage, cPage])

  // 发表/删除评论后刷新：新顶层评论排在最后，尽量把它所在的页也拉出来
  const refreshAfterChange = useCallback(
    async (isNewTopComment: boolean) => {
      setCHint('')
      const needPages = Math.max(Math.ceil((cTotal + 1) / COMMENT_PAGE_SIZE), 1)
      // 新顶层评论排在最末页：最多往后多拉一页，避免中间出现空档
      // 回复/删除只影响已加载范围，原样刷新即可
      const upTo = isNewTopComment ? Math.min(needPages, cPage + 1) : cPage
      await reloadComments(upTo)
      if (isNewTopComment && needPages > upTo) {
        setCHint('评论已发表，点击下方「加载更多评论」即可看到')
      }
    },
    [cTotal, cPage, reloadComments]
  )

  // 首屏已由服务端给出；挂载后补「因人而异」的状态（点赞、编辑权限）并计浏览
  useEffect(() => {
    loadPost()
    reloadComments(1)
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
    if (data.success) router.push('/forum')
    else alert(data.error || '删除失败')
  }

  if (notFound || !post)
    return (
      <div className="min-h-screen page-top text-center">
        <p className="text-white/50 mb-4">帖子不存在或已被删除</p>
        <Link href="/forum" className="text-purple-400">返回论坛</Link>
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
        <Link href="/forum" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 text-sm lg:text-[15px]">
          <ArrowLeft className="w-4 h-4" /> 返回论坛
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
            <span className="text-white/70">{post.authorName}</span>
            {post.isMember && <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />}
            <span>· {timeAgo(post.createdAt)}</span>
            <span className="inline-flex items-center gap-1">· <Eye className="w-3.5 h-3.5" />{post.views}</span>
          </div>

          {/* 正文。
              .prose-forum 的 font-size/line-height 是 globals.css 里的普通规则，
              写在 @tailwind utilities 之后，同优先级下会按源码顺序压过 lg:text-*，
              所以这里必须用 `!` 才能在桌面端把 15px 提到 16.5px。 */}
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
        </article>

        {/* 评论区 */}
        <section className="mt-8 lg:mt-12">
          <h2 className="text-lg lg:text-xl font-bold mb-4 lg:mb-5 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-400" /> {post.commentCount} 条评论
          </h2>

          {/* 发表评论（只有公开的帖子能评论：待审帖下面先盖楼没有意义，接口也会拒） */}
          {post.reviewStatus !== 'APPROVED' || post.status !== 1 ? (
            <div className="glass rounded-2xl p-4 text-center text-white/40 text-sm mb-6">帖子公开后才能评论</div>
          ) : post.locked && !post.isAdmin ? (
            <div className="glass rounded-2xl p-4 text-center text-white/40 text-sm mb-6">
              <Lock className="w-4 h-4 inline mr-1" /> 该帖已锁定，暂不可回复
            </div>
          ) : (
            <CommentBox postId={id} onDone={() => { refreshAfterChange(true); loadPost() }} userName={commentAs} />
          )}

          {cHint && (
            <p className="mt-3 text-center text-xs text-emerald-300/80">{cHint}</p>
          )}

          {/* 评论列表 */}
          <div className="space-y-4 mt-6">
            {comments.map((c) => (
              <CommentItem key={c.id} comment={c} postId={id} locked={post.locked && !post.isAdmin} userName={commentAs} onChange={() => { refreshAfterChange(false); loadPost() }} />
            ))}
            {comments.length === 0 && !cLoading && <p className="text-center text-white/30 py-8 text-sm">还没有评论，来抢沙发～</p>}
          </div>

          {/* 分段加载：加载更多评论 */}
          {comments.length > 0 && (
            <div className="mt-6 flex flex-col items-center gap-2">
              {cPage < cTotalPages ? (
                <button
                  onClick={loadMoreComments}
                  disabled={cLoading}
                  className="px-6 py-2.5 rounded-xl glass text-sm text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
                >
                  {cLoading ? '加载中...' : '加载更多评论'}
                </button>
              ) : (
                <span className="text-xs text-white/25">没有更多评论了</span>
              )}
              <span className="text-xs text-white/25">
                已显示 {comments.length} / {cTotal} 条主楼评论
              </span>
            </div>
          )}
        </section>
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

// 评论输入框（顶层评论或回复）
function CommentBox({
  postId, parentId, onDone, userName, compact,
}: { postId: number; parentId?: number; onDone: () => void; userName: string | null; compact?: boolean }) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')

  // 内容平台 P0 起评论须登录（匿名评论已关闭）。userName 为空 = 未登录
  if (!userName) {
    return (
      <div className={compact ? 'mt-3 text-xs text-white/40' : 'glass rounded-2xl p-4 text-center text-sm text-white/50'}>
        <Link href={withRedirect('/login', `/forum/${postId}`)} className="text-purple-400 hover:text-purple-300">
          登录
        </Link>{' '}
        后参与评论
      </div>
    )
  }

  const submit = async () => {
    if (!content.trim()) return
    setSending(true)
    setNotice('')
    try {
      const res = await forumFetch(`/api/forum/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentId: parentId || undefined }),
      })
      const data = await res.json()
      if (data.success) {
        setContent('')
        // 命中风险检测的评论进待审：不出现在列表里，要明确告诉作者，免得以为没发出去又发一遍
        if (data.data?.pending) setNotice(data.message || '评论已提交，审核通过后显示')
        else onDone()
      } else {
        alert(data.error || '评论失败')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className={compact ? 'mt-3' : 'glass rounded-2xl p-4'}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? '回复…' : '友善发言，理性讨论…'}
        rows={compact ? 2 : 3}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder:text-white/30 outline-none focus:border-purple-500/50 text-sm resize-y"
      />
      {notice && <p className="mt-2 text-xs text-amber-300/90">{notice}</p>}
      <div className="flex items-center justify-between gap-2 mt-2">
        <span className="text-xs text-white/40">以 {userName} 评论</span>
        <button
          onClick={submit}
          disabled={sending || !content.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-medium disabled:opacity-40"
        >
          <Send className="w-3.5 h-3.5" /> 发送
        </button>
      </div>
    </div>
  )
}

function CommentItem({
  comment, postId, locked, userName, onChange,
}: { comment: Comment; postId: number; locked: boolean; userName: string | null; onChange: () => void }) {
  const [replying, setReplying] = useState(false)
  const [liked, setLiked] = useState(comment.likedByMe)
  const [likeCount, setLikeCount] = useState(comment.likeCount)

  const likeBusy = useRef(false) // 请求在途时忽略再次点击，理由见帖子点赞处
  const toggleLike = async () => {
    if (likeBusy.current) return
    likeBusy.current = true
    try {
      const res = await forumFetch(`/api/forum/comments/${comment.id}/like`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setLiked(data.data.liked)
        setLikeCount(data.data.likeCount)
      } else if (data.error) alert(data.error) // 被限流（429）时让人看得到原因
    } finally {
      likeBusy.current = false
    }
  }

  const del = async () => {
    if (!confirm('删除这条评论？')) return
    const res = await forumFetch(`/api/forum/comments/${comment.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) onChange()
    else alert(data.error || '删除失败')
  }

  return (
    <div className="glass rounded-2xl p-4 lg:p-5">
      <div className="flex items-start gap-3">
        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
          {comment.authorName.slice(0, 1)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-white/80 font-medium">{comment.authorName}</span>
            {comment.isMember && <ShieldCheck className="w-3 h-3 text-cyan-400" />}
            <span className="text-white/30 text-xs">{timeAgo(comment.createdAt)}</span>
          </div>
          {/* 评论正文在桌面端提到 15px/1.8：14px 在 1440px 屏上偏小、行距也偏挤 */}
          <p className="text-white/80 text-sm lg:text-[15px] lg:leading-[1.8] mt-1.5 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
            <button onClick={toggleLike} className={`inline-flex items-center gap-1 hover:text-white ${liked ? 'text-purple-400' : ''}`}>
              <ThumbsUp className="w-3.5 h-3.5" /> {likeCount > 0 ? likeCount : '赞'}
            </button>
            {!locked && (
              <button onClick={() => setReplying((v) => !v)} className="inline-flex items-center gap-1 hover:text-white">
                <CornerDownRight className="w-3.5 h-3.5" /> 回复
              </button>
            )}
            {comment.canDelete && (
              <button onClick={del} className="inline-flex items-center gap-1 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" /> 删除
              </button>
            )}
          </div>

          {replying && (
            <CommentBox
              postId={postId}
              parentId={comment.id}
              userName={userName}
              compact
              onDone={() => {
                setReplying(false)
                onChange()
              }}
            />
          )}

          {/* 楼中楼 */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3 pl-4 border-l border-white/10">
              {comment.replies.map((r) => (
                <ReplyItem key={r.id} reply={r} onChange={onChange} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ReplyItem({ reply, onChange }: { reply: Comment; onChange: () => void }) {
  const [liked, setLiked] = useState(reply.likedByMe)
  const [likeCount, setLikeCount] = useState(reply.likeCount)

  const likeBusy = useRef(false) // 请求在途时忽略再次点击，理由见帖子点赞处
  const toggleLike = async () => {
    if (likeBusy.current) return
    likeBusy.current = true
    try {
      const res = await forumFetch(`/api/forum/comments/${reply.id}/like`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setLiked(data.data.liked)
        setLikeCount(data.data.likeCount)
      } else if (data.error) alert(data.error) // 被限流（429）时让人看得到原因
    } finally {
      likeBusy.current = false
    }
  }
  const del = async () => {
    if (!confirm('删除这条回复？')) return
    const res = await forumFetch(`/api/forum/comments/${reply.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) onChange()
    else alert(data.error || '删除失败')
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-white/70 font-medium">{reply.authorName}</span>
        {reply.isMember && <ShieldCheck className="w-3 h-3 text-cyan-400" />}
        <span className="text-white/30 text-xs">{timeAgo(reply.createdAt)}</span>
      </div>
      <p className="text-white/75 text-sm lg:text-[15px] lg:leading-[1.8] mt-1 whitespace-pre-wrap break-words">
        {reply.content}
      </p>
      <div className="flex items-center gap-4 mt-1.5 text-xs text-white/40">
        <button onClick={toggleLike} className={`inline-flex items-center gap-1 hover:text-white ${liked ? 'text-purple-400' : ''}`}>
          <ThumbsUp className="w-3 h-3" /> {likeCount > 0 ? likeCount : '赞'}
        </button>
        {reply.canDelete && (
          <button onClick={del} className="inline-flex items-center gap-1 hover:text-red-400">
            <Trash2 className="w-3 h-3" /> 删除
          </button>
        )}
      </div>
    </div>
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
