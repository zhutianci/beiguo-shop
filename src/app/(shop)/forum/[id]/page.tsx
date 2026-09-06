'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, ThumbsUp, Eye, MessageCircle, Pin, Star, Lock, Unlock,
  Pencil, Trash2, Send, CornerDownRight, EyeOff, ShieldCheck,
} from 'lucide-react'
import { forumFetch, timeAgo } from '@/lib/forum-client'
import { useUserStore } from '@/store/user'

interface Comment {
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
interface Detail {
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

interface CommentPage {
  list: Comment[]
  total: number
  page: number
  totalPages: number
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)
  const { user } = useUserStore()

  const [post, setPost] = useState<Detail | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // 评论分段加载状态
  const [cPage, setCPage] = useState(1) // 已加载到第几页
  const [cTotalPages, setCTotalPages] = useState(1)
  const [cTotal, setCTotal] = useState(0)
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

  useEffect(() => {
    Promise.all([loadPost(), reloadComments(1)]).finally(() => setLoading(false))
    // 仅在帖子 id 变化时重新初始化
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const toggleLike = async () => {
    if (!post) return
    const res = await forumFetch(`/api/forum/posts/${id}/like`, { method: 'POST' })
    const data = await res.json()
    if (data.success) setPost({ ...post, likedByMe: data.data.liked, likeCount: data.data.likeCount })
  }

  const adminAction = async (patch: Record<string, unknown>) => {
    const res = await forumFetch(`/api/forum/posts/${id}`, {
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

  if (loading) return <div className="min-h-screen pt-32 text-center text-white/40">加载中...</div>
  if (notFound || !post)
    return (
      <div className="min-h-screen pt-32 text-center">
        <p className="text-white/50 mb-4">帖子不存在或已被删除</p>
        <Link href="/forum" className="text-purple-400">返回论坛</Link>
      </div>
    )

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed top-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />
      {/*
        帖子详情属于正文型页面：桌面端不放宽容器（max-w-3xl ≈ 768px，
        在 16.5px 正文下约 40 个汉字 / 一行，正好是阅读舒适区），
        只把字号、行高与留白往上提一档。
      */}
      <div className="container relative max-w-3xl">
        <Link href="/forum" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 text-sm lg:text-[15px]">
          <ArrowLeft className="w-4 h-4" /> 返回论坛
        </Link>

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
            </div>
          )}
        </article>

        {/* 评论区 */}
        <section className="mt-8 lg:mt-12">
          <h2 className="text-lg lg:text-xl font-bold mb-4 lg:mb-5 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-400" /> {post.commentCount} 条评论
          </h2>

          {/* 发表评论 */}
          {post.locked && !post.isAdmin ? (
            <div className="glass rounded-2xl p-4 text-center text-white/40 text-sm mb-6">
              <Lock className="w-4 h-4 inline mr-1" /> 该帖已锁定，暂不可回复
            </div>
          ) : (
            <CommentBox postId={id} onDone={() => { refreshAfterChange(true); loadPost() }} userName={user?.nickname || user?.email || null} />
          )}

          {cHint && (
            <p className="mt-3 text-center text-xs text-emerald-300/80">{cHint}</p>
          )}

          {/* 评论列表 */}
          <div className="space-y-4 mt-6">
            {comments.map((c) => (
              <CommentItem key={c.id} comment={c} postId={id} locked={post.locked && !post.isAdmin} userName={user?.nickname || user?.email || null} onChange={() => { refreshAfterChange(false); loadPost() }} />
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
  const [anonName, setAnonName] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async () => {
    if (!content.trim()) return
    setSending(true)
    try {
      const res = await forumFetch(`/api/forum/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentId: parentId || undefined, anonName: userName ? undefined : anonName }),
      })
      const data = await res.json()
      if (data.success) {
        setContent('')
        onDone()
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
      <div className="flex items-center justify-between gap-2 mt-2">
        {!userName ? (
          <input
            value={anonName}
            onChange={(e) => setAnonName(e.target.value)}
            placeholder="昵称（选填）"
            maxLength={30}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white placeholder:text-white/30 outline-none text-sm w-40"
          />
        ) : (
          <span className="text-xs text-white/40">以 {userName} 评论</span>
        )}
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

  const toggleLike = async () => {
    const res = await forumFetch(`/api/forum/comments/${comment.id}/like`, { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      setLiked(data.data.liked)
      setLikeCount(data.data.likeCount)
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

  const toggleLike = async () => {
    const res = await forumFetch(`/api/forum/comments/${reply.id}/like`, { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      setLiked(data.data.liked)
      setLikeCount(data.data.likeCount)
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
