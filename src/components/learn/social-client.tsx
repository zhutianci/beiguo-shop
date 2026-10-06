'use client'

/**
 * 学习平台的社交小组件（内容平台 P2）：关注按钮、举报弹层、加入合集弹层。
 * 未登录时点击统一跳登录页（带回跳地址）。所有写请求都是同源 fetch（服务端有同源校验）。
 */
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Flag, FolderPlus, Plus, UserPlus, X } from 'lucide-react'
import { withRedirect } from '@/lib/safe-redirect'

function goLogin(router: ReturnType<typeof useRouter>) {
  router.push(withRedirect('/login', window.location.pathname))
}

async function post(url: string, body?: unknown, method = 'POST') {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
  return { status: res.status, data: await res.json().catch(() => ({})) }
}

// ─────────────────────────────── 关注 ───────────────────────────────

export function FollowButton({ handle, compact = false }: { handle: string; compact?: boolean }) {
  const router = useRouter()
  const [st, setSt] = useState<{ following: boolean; followers: number; isSelf: boolean } | null>(null)
  useEffect(() => {
    fetch(`/api/content/follow?handle=${handle}`)
      .then((r) => r.json())
      .then((d) => d.success && setSt(d.data))
      .catch(() => {})
  }, [handle])
  if (!st || st.isSelf) return null
  const toggle = async () => {
    const prev = st
    setSt({ ...st, following: !st.following, followers: st.followers + (st.following ? -1 : 1) })
    const { status, data } = await post('/api/content/follow', { handle })
    if (status === 401) return goLogin(router)
    if (data.success) setSt((s) => (s ? { ...s, ...data.data } : s))
    else setSt(prev)
  }
  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 rounded-full border transition-all duration-300 ${compact ? 'h-7 px-2.5 text-xs' : 'h-10 px-4 text-sm'} ${
        st.following ? 'border-white/15 text-white/60 hover:text-white' : 'border-white bg-white font-medium text-black'
      }`}
    >
      {st.following ? <Check className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
      {st.following ? '已关注' : '关注'}
      {!compact && <span className="tabular-nums opacity-60">{st.followers}</span>}
    </button>
  )
}

// ─────────────────────────────── 弹层外壳 ───────────────────────────────

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="learn-in w-full max-w-md rounded-t-3xl border border-white/10 bg-[#111114] p-6 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white" aria-label="关闭">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─────────────────────────────── 举报 ───────────────────────────────

const REASONS = [
  { v: 'SPAM', t: '垃圾内容 / 灌水' },
  { v: 'AD', t: '广告或引流（联系方式、外链推广）' },
  { v: 'PLAGIARISM', t: '抄袭或未注明来源的搬运' },
  { v: 'WRONG', t: '内容错误、已失效' },
  { v: 'ILLEGAL', t: '违法违规' },
  { v: 'OTHER', t: '其他' },
] as const

export function ReportButton({ postId, commentId, small = false }: { postId?: number; commentId?: number; small?: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string>('SPAM')
  const [detail, setDetail] = useState('')
  const [msg, setMsg] = useState('')
  const submit = async () => {
    const { status, data } = await post('/api/content/report', { postId, commentId, reason, detail: detail.trim() || undefined })
    if (status === 401) return goLogin(router)
    setMsg(data.message || data.error || '已提交')
    if (data.success) setTimeout(() => setOpen(false), 1200)
  }
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMsg('')
          setOpen(true)
        }}
        className={
          small
            ? 'inline-flex items-center gap-1 hover:text-white'
            : 'inline-flex h-10 items-center gap-2 rounded-full border border-white/12 px-4 text-sm text-white/55 transition-colors hover:text-white'
        }
      >
        <Flag className={small ? 'h-3 w-3' : 'h-4 w-4'} /> 举报
      </button>
      {open && (
        <Sheet title="举报" onClose={() => setOpen(false)}>
          <div className="space-y-2">
            {REASONS.map((r) => (
              <label key={r.v} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${reason === r.v ? 'border-white/40 bg-white/[0.06]' : 'border-white/10 hover:border-white/20'}`}>
                <input type="radio" name="reason" value={r.v} checked={reason === r.v} onChange={() => setReason(r.v)} className="accent-white" />
                {r.t}
              </label>
            ))}
          </div>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            maxLength={300}
            rows={2}
            placeholder="补充说明（选填）"
            className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/30"
          />
          {msg && <p className="mt-3 text-sm text-white/70">{msg}</p>}
          <button type="button" onClick={submit} className="mt-4 h-11 w-full rounded-full bg-white text-sm font-semibold text-black">
            提交举报
          </button>
        </Sheet>
      )}
    </>
  )
}

// ─────────────────────────────── 加入合集 ───────────────────────────────

interface MyCollection {
  id: number
  title: string
  count: number
  hasPost: boolean
}

export function CollectButton({ postId }: { postId: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [list, setList] = useState<MyCollection[] | null>(null)
  const [title, setTitle] = useState('')
  const busy = useRef(false)

  const load = async () => {
    const res = await fetch(`/api/me/collections?postId=${postId}`)
    if (res.status === 401) return goLogin(router)
    const d = await res.json()
    if (d.success) setList(d.data.list)
  }
  const toggle = async (c: MyCollection) => {
    if (busy.current) return
    busy.current = true
    setList((l) => l?.map((x) => (x.id === c.id ? { ...x, hasPost: !x.hasPost, count: x.count + (x.hasPost ? -1 : 1) } : x)) ?? null)
    try {
      if (c.hasPost) await fetch(`/api/me/collections/${c.id}/items?postId=${postId}`, { method: 'DELETE' })
      else await post(`/api/me/collections/${c.id}/items`, { postId })
    } finally {
      busy.current = false
    }
  }
  const create = async () => {
    if (!title.trim()) return
    const { data } = await post('/api/me/collections', { title: title.trim() })
    if (data.success) {
      await post(`/api/me/collections/${data.data.id}/items`, { postId })
      setTitle('')
      load()
    } else alert(data.error || '创建失败')
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          load()
        }}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-white/12 px-4 text-sm text-white/75 transition-all duration-300 hover:border-white/25 hover:text-white"
      >
        <FolderPlus className="h-4 w-4" /> 加入合集
      </button>
      {open && (
        <Sheet title="加入合集" onClose={() => setOpen(false)}>
          {list === null ? (
            <div className="learn-skeleton h-24" />
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {list.length === 0 && <p className="text-sm text-white/45">还没有合集，在下面新建一个。</p>}
              {list.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${c.hasPost ? 'border-white/40 bg-white/[0.06]' : 'border-white/10 hover:border-white/20'}`}
                >
                  <span className="truncate">{c.title}</span>
                  <span className="flex items-center gap-2 text-xs text-white/45">
                    {c.count} 条 {c.hasPost && <Check className="h-4 w-4 text-white" />}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="新建合集，例如：论文写作必备"
              className="h-11 flex-1 rounded-full border border-white/10 bg-white/5 px-4 text-sm outline-none focus:border-white/30"
              onKeyDown={(e) => e.key === 'Enter' && create()}
            />
            <button type="button" onClick={create} className="inline-flex h-11 items-center gap-1 rounded-full bg-white px-4 text-sm font-semibold text-black">
              <Plus className="h-4 w-4" /> 新建
            </button>
          </div>
        </Sheet>
      )}
    </>
  )
}
