'use client'

/**
 * 内容页的操作条：点赞、复制链接；作者看得到编辑 / 删除；管理员多一排审核与运营操作。
 *
 * 服务端只渲染「对所有人都一样」的部分（点赞数），挂载后请求 GET /api/forum/posts/[id]
 * 补上因人而异的状态（我赞过没有、能不能编辑、是不是管理员），顺带计一次浏览（接口内按 1 小时去重）。
 * 管理员操作走 /api/admin/forum/posts/[id]（adminGuard），完成后 router.refresh() 让服务端重新渲染。
 */
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BadgeCheck, Bookmark, Check, CheckCircle2, EyeOff, Link2, Pencil, Star, ThumbsUp, Trash2, XCircle } from 'lucide-react'
import { forumFetch } from '@/lib/forum-client'
import { withRedirect } from '@/lib/safe-redirect'
import { CollectButton, ReportButton } from './social-client'

interface State {
  likedByMe: boolean
  likeCount: number
  favoritedByMe: boolean
  favoriteCount: number
  canEdit: boolean
  isAdmin: boolean
}

export function ContentActions({
  postId,
  likeCount,
  favoriteCount = 0,
  editHref,
  backHref,
  admin,
}: {
  postId: number
  likeCount: number
  favoriteCount?: number
  editHref: string
  backHref: string
  admin: { reviewStatus: string; status: number; featured: boolean; verified: boolean; typed: boolean; ctaRefOff?: boolean }
}) {
  const router = useRouter()
  const [st, setSt] = useState<State>({ likedByMe: false, likeCount, favoritedByMe: false, favoriteCount, canEdit: false, isAdmin: false })
  const [copied, setCopied] = useState(false)
  const busy = useRef(false)

  useEffect(() => {
    forumFetch(`/api/forum/posts/${postId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success)
          setSt({
            likedByMe: d.data.likedByMe,
            likeCount: d.data.likeCount,
            favoritedByMe: !!d.data.favoritedByMe,
            favoriteCount: d.data.favoriteCount ?? 0,
            canEdit: d.data.canEdit,
            isAdmin: d.data.isAdmin,
          })
      })
      .catch(() => {})
  }, [postId])

  const like = async () => {
    if (busy.current) return
    busy.current = true
    // 先改界面再请求（乐观更新），失败回滚：点赞的手感要即时
    const prev = st
    setSt({ ...st, likedByMe: !st.likedByMe, likeCount: st.likeCount + (st.likedByMe ? -1 : 1) })
    try {
      const res = await forumFetch(`/api/forum/posts/${postId}/like`, { method: 'POST' })
      const data = await res.json()
      if (data.success) setSt((s) => ({ ...s, likedByMe: data.data.liked, likeCount: data.data.likeCount }))
      else {
        setSt(prev)
        if (data.error) alert(data.error)
      }
    } catch {
      setSt(prev)
    } finally {
      busy.current = false
    }
  }

  // 收藏：须登录（未登录跳登录页）；乐观更新
  const favorite = async () => {
    const prev = st
    setSt({ ...st, favoritedByMe: !st.favoritedByMe, favoriteCount: st.favoriteCount + (st.favoritedByMe ? -1 : 1) })
    const res = await fetch(`/api/content/${postId}/favorite`, { method: 'POST' })
    if (res.status === 401) {
      setSt(prev)
      router.push(withRedirect('/login', window.location.pathname))
      return
    }
    const data = await res.json().catch(() => ({}))
    if (data.success) setSt((s) => ({ ...s, favoritedByMe: data.data.favorited, favoriteCount: data.data.favoriteCount }))
    else setSt(prev)
  }

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href.split('#')[0])
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* 不支持剪贴板就算了 */
    }
  }

  const remove = async () => {
    if (!confirm('确定删除这篇内容吗？')) return
    const res = await forumFetch(`/api/forum/posts/${postId}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) router.push(backHref)
    else alert(data.error || '删除失败')
  }

  const adminPatch = async (patch: Record<string, unknown>) => {
    if (patch.reviewStatus === 'REJECTED') {
      const note = prompt('驳回原因（作者会看到）：')
      if (!note?.trim()) return
      patch = { ...patch, reviewNote: note.trim() }
    }
    const res = await fetch(`/api/admin/forum/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json()
    if (data.success) router.refresh()
    else alert(data.error || '操作失败')
  }

  const pill = 'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition-all duration-300'
  const adminBtn = 'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs transition-colors'

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={like}
          aria-pressed={st.likedByMe}
          className={`${pill} ${st.likedByMe ? 'border-white bg-white text-black' : 'border-white/12 text-white/75 hover:border-white/25 hover:text-white'}`}
        >
          <ThumbsUp className={`h-4 w-4 transition-transform duration-300 ${st.likedByMe ? 'scale-110' : ''}`} />
          <span className="tabular-nums">{st.likeCount > 0 ? st.likeCount : '有用'}</span>
        </button>
        <button
          type="button"
          onClick={favorite}
          aria-pressed={st.favoritedByMe}
          className={`${pill} ${st.favoritedByMe ? 'border-amber-200 bg-amber-200 text-black' : 'border-white/12 text-white/75 hover:border-white/25 hover:text-white'}`}
        >
          <Bookmark className={`h-4 w-4 ${st.favoritedByMe ? 'fill-current' : ''}`} />
          <span className="tabular-nums">{st.favoritedByMe ? '已收藏' : '收藏'}{st.favoriteCount > 0 ? ` ${st.favoriteCount}` : ''}</span>
        </button>
        <CollectButton postId={postId} />
        <button type="button" onClick={share} className={`${pill} border-white/12 text-white/75 hover:border-white/25 hover:text-white`}>
          {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
          {copied ? '链接已复制' : '复制链接'}
        </button>
        {!st.canEdit && <ReportButton postId={postId} />}
        {st.canEdit && (
          <>
            <Link href={editHref} className={`${pill} border-white/12 text-white/60 hover:text-white`}>
              <Pencil className="h-4 w-4" /> 编辑
            </Link>
            <button type="button" onClick={remove} className={`${pill} border-white/12 text-red-300/80 hover:border-red-300/40 hover:text-red-300`}>
              <Trash2 className="h-4 w-4" /> 删除
            </button>
          </>
        )}
      </div>

      {st.isAdmin && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5 rounded-2xl border border-dashed border-white/12 p-2.5">
          <span className="px-1.5 text-xs text-white/35">管理</span>
          {admin.reviewStatus !== 'APPROVED' && (
            <button type="button" onClick={() => adminPatch({ reviewStatus: 'APPROVED' })} className={`${adminBtn} bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/25`}>
              <CheckCircle2 className="h-3.5 w-3.5" /> 审核通过
            </button>
          )}
          {admin.reviewStatus !== 'REJECTED' && (
            <button type="button" onClick={() => adminPatch({ reviewStatus: 'REJECTED' })} className={`${adminBtn} bg-white/[0.06] text-white/70 hover:bg-white/10`}>
              <XCircle className="h-3.5 w-3.5" /> 驳回
            </button>
          )}
          <button type="button" onClick={() => adminPatch({ featured: !admin.featured })} className={`${adminBtn} ${admin.featured ? 'bg-amber-300/20 text-amber-200' : 'bg-white/[0.06] text-white/70 hover:bg-white/10'}`}>
            <Star className="h-3.5 w-3.5" /> {admin.featured ? '取消精选' : '精选'}
          </button>
          {admin.typed && (
            <button type="button" onClick={() => adminPatch({ verified: !admin.verified })} className={`${adminBtn} ${admin.verified ? 'bg-emerald-400/15 text-emerald-200' : 'bg-white/[0.06] text-white/70 hover:bg-white/10'}`}>
              <BadgeCheck className="h-3.5 w-3.5" /> {admin.verified ? '取消实测可用' : '实测可用'}
            </button>
          )}
          {admin.ctaRefOff !== undefined && (
            <button
              type="button"
              title="作者内推返现：L2 以上作者的内容，CTA 会带上作者的内推码"
              onClick={() => adminPatch({ ctaRefOff: !admin.ctaRefOff })}
              className={`${adminBtn} ${admin.ctaRefOff ? 'bg-red-400/15 text-red-200' : 'bg-white/[0.06] text-white/70 hover:bg-white/10'}`}
            >
              {admin.ctaRefOff ? '恢复作者返现' : '关闭作者返现'}
            </button>
          )}
          <button type="button" onClick={() => adminPatch({ status: admin.status === 1 ? 0 : 1 })} className={`${adminBtn} bg-white/[0.06] text-white/70 hover:bg-white/10`}>
            <EyeOff className="h-3.5 w-3.5" /> {admin.status === 1 ? '隐藏' : '恢复'}
          </button>
        </div>
      )}
    </div>
  )
}
