'use client'

/**
 * 评论区（从论坛帖子详情里拆出来，论坛 / 提示词 / 教程共用，内容平台改版 2026-10-06）。
 *
 * 首屏评论由服务端给出（initial），挂载后按当前访客再取一次（补「我赞过没有」「能不能删」）。
 * 评论数（count）由组件自己维护：发表 / 删除之后重新取一次帖子的 commentCount，并回调 onChanged 让外层同步。
 * 评论须登录（内容平台 P0 关闭了匿名评论）；命中风险检测的评论进待审，不出现在列表里，会明确提示作者。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ThumbsUp, MessageCircle, Lock, Trash2, Send, CornerDownRight, ShieldCheck } from 'lucide-react'
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
// 评论每页条数（顶层评论，楼中楼回复跟随父评论返回）
export const COMMENT_PAGE_SIZE = 20

export interface CommentPage {
  list: Comment[]
  total: number
  page: number
  totalPages: number
}


export type CommentGate = 'open' | 'locked' | 'not-public'

export function CommentsSection({
  postId,
  initial,
  commentCount,
  gate,
  onChanged,
}: {
  postId: number
  initial: CommentPage
  commentCount: number
  gate: CommentGate
  onChanged?: () => void
}) {
  const { user } = useUserStore()
  // 「以 xxx 评论」只显示昵称，不显示邮箱（公开作者名已不再回落到邮箱，审计 G48）。
  // userName 同时是「是否登录」的开关：为空时评论框换成「登录后参与评论」
  const commentAs = user ? (user.nickname && !user.nickname.includes('@') ? user.nickname : '会员（未设置昵称）') : null
  const [comments, setComments] = useState<Comment[]>(initial.list)
  const [count, setCount] = useState(commentCount)
  useEffect(() => setCount(commentCount), [commentCount])
  // 评论分段加载状态
  const [cPage, setCPage] = useState(initial.page) // 已加载到第几页
  const [cTotalPages, setCTotalPages] = useState(initial.totalPages)
  const [cTotal, setCTotal] = useState(initial.total)
  const [cLoading, setCLoading] = useState(false)
  const [cHint, setCHint] = useState('')

  const fetchCommentPage = useCallback(
    async (target: number): Promise<CommentPage | null> => {
      const res = await forumFetch(
        `/api/forum/posts/${postId}/comments?page=${target}&pageSize=${COMMENT_PAGE_SIZE}`
      )
      const data = await res.json()
      return data.success ? (data.data as CommentPage) : null
    },
    [postId]
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


  const afterChange = useCallback(async () => {
    try {
      const res = await forumFetch(`/api/forum/posts/${postId}`)
      const data = await res.json()
      if (data.success) setCount(data.data.commentCount)
    } catch {
      /* 计数刷新失败不影响评论本身 */
    }
    onChanged?.()
  }, [postId, onChanged])

  // 挂载后按当前访客重取第 1 页（补点赞状态与删除权限）
  useEffect(() => {
    reloadComments(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  return (
    <section className="mt-8 lg:mt-12">
          <h2 className="text-lg lg:text-xl font-bold mb-4 lg:mb-5 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-purple-400" /> {count} 条评论
          </h2>

          {/* 发表评论（只有公开的帖子能评论：待审帖下面先盖楼没有意义，接口也会拒） */}
          {gate === 'not-public' ? (
            <div className="glass rounded-2xl p-4 text-center text-white/40 text-sm mb-6">帖子公开后才能评论</div>
          ) : gate === 'locked' ? (
            <div className="glass rounded-2xl p-4 text-center text-white/40 text-sm mb-6">
              <Lock className="w-4 h-4 inline mr-1" /> 该帖已锁定，暂不可回复
            </div>
          ) : (
            <CommentBox postId={postId} onDone={() => { refreshAfterChange(true); afterChange() }} userName={commentAs} />
          )}

          {cHint && (
            <p className="mt-3 text-center text-xs text-emerald-300/80">{cHint}</p>
          )}

          {/* 评论列表 */}
          <div className="space-y-4 mt-6">
            {comments.map((c) => (
              <CommentItem key={c.id} comment={c} postId={postId} locked={gate !== 'open'} userName={commentAs} onChange={() => { refreshAfterChange(false); afterChange() }} />
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
