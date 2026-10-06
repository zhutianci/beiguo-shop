'use client'

/**
 * 我的学习空间（内容平台 P2）：通知 · 收藏 · 合集 · 关注 · 我的投稿 · 积分。
 * P3 加了「积分兑换」（积分换优惠券）与「创作者」（认证申请、作者内推返现状态）两个页签。
 * 纯客户端页（个人数据，不进搜索引擎）；未登录跳登录页。打开「通知」页签即全部标为已读。
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BadgeCheck, Bell, Bookmark, FolderOpen, Gift, PenLine, Sparkles, Trash2, Users } from 'lucide-react'
import { useUserStore } from '@/store/user'
import { useHydrated } from '@/lib/use-hydrated'
import { withRedirect } from '@/lib/safe-redirect'
import { PromptMasonry, GuideRows } from './ui'
import type { ContentCard } from '@/lib/content/queries'

type Tab = 'inbox' | 'favorites' | 'collections' | 'following' | 'posts' | 'shop' | 'creator'
const TABS: Tab[] = ['inbox', 'favorites', 'collections', 'following', 'posts', 'shop', 'creator']

interface Summary {
  unread: number
  points: number
  level: { lv: number; name: string; next: number | null }
  coBuilder: boolean
  handle: string | null
  favorites: number
  following: number
  followers: number
}

const REVIEW_LABEL: Record<string, { t: string; c: string }> = {
  PENDING: { t: '审核中', c: 'text-amber-200 bg-amber-300/15' },
  APPROVED: { t: '已公开', c: 'text-emerald-200 bg-emerald-400/15' },
  REJECTED: { t: '未通过', c: 'text-red-200 bg-red-400/15' },
}
const TYPE_LABEL: Record<string, string> = { PROMPT: '提示词', GUIDE: '教程', DISCUSSION: '讨论' }

function useJson<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null)
  const reload = useCallback(() => {
    if (!url) return
    fetch(url)
      .then((r) => r.json())
      .then((d) => d.success && setData(d.data))
      .catch(() => {})
  }, [url])
  useEffect(() => reload(), [reload])
  return { data, reload }
}

export function MeClient() {
  const router = useRouter()
  const hydrated = useHydrated()
  const { user } = useUserStore()
  const [tab, setTab] = useState<Tab>('inbox')
  const summary = useJson<Summary & { loggedIn: boolean }>('/api/me/summary')

  useEffect(() => {
    if (hydrated && !user) router.replace(withRedirect('/login', '/learn/me'))
  }, [hydrated, user, router])

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('tab') as Tab | null
    if (q && TABS.includes(q)) setTab(q)
  }, [])

  const s = summary.data
  const tabs: { k: Tab; t: string; icon: typeof Bell; n?: number }[] = [
    { k: 'inbox', t: '通知', icon: Bell, n: s?.unread },
    { k: 'favorites', t: '收藏', icon: Bookmark, n: s?.favorites },
    { k: 'collections', t: '合集', icon: FolderOpen },
    { k: 'following', t: '关注', icon: Users, n: s?.following },
    { k: 'posts', t: '我的投稿', icon: PenLine },
    { k: 'shop', t: '积分兑换', icon: Gift },
    { k: 'creator', t: '创作者', icon: BadgeCheck },
  ]

  return (
    <div>
      {/* 顶部：等级与积分 */}
      <section className="learn-card learn-in mb-10 grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
        <div>
          <p className="learn-eyebrow mb-3">My Space · 学习空间</p>
          <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
            {user?.nickname && !user.nickname.includes('@') ? user.nickname : '我的学习空间'}
          </h1>
          {s && (
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/55">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-black">
                <Sparkles className="h-3 w-3" /> Lv{s.level.lv} {s.level.name}
              </span>
              {s.coBuilder && <span className="rounded-full bg-amber-300/20 px-2.5 py-0.5 text-xs text-amber-200">共建者</span>}
              <span className="tabular-nums">{s.points} 积分</span>
              {s.level.next !== null && <span className="text-white/35">距下一级还差 {s.level.next - s.points}</span>}
              <span className="text-white/35">· {s.followers} 位关注者</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {s?.handle && (
            <Link href={`/u/${s.handle}`} className="inline-flex h-10 items-center rounded-full border border-white/15 px-4 text-sm text-white/80 hover:text-white">
              我的主页
            </Link>
          )}
          <Link href="/forum/new?type=PROMPT" className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-black">
            投稿
          </Link>
        </div>
      </section>

      <div className="learn-scroll-x mb-8 flex gap-2">
        {tabs.map((t) => (
          <button key={t.k} type="button" onClick={() => setTab(t.k)} data-active={tab === t.k} className="learn-chip">
            <t.icon className="h-3.5 w-3.5" /> {t.t}
            {!!t.n && <span className="text-[11px] opacity-60 tabular-nums">{t.n}</span>}
          </button>
        ))}
      </div>

      {tab === 'inbox' && <Inbox onRead={summary.reload} />}
      {tab === 'favorites' && <Favorites />}
      {tab === 'collections' && <Collections />}
      {tab === 'following' && <Following />}
      {tab === 'posts' && <MyPosts />}
      {tab === 'shop' && <PointsShop onChange={summary.reload} />}
      {tab === 'creator' && <Creator />}

      <p className="mt-16 text-xs text-white/30">
        积分怎么来：内容公开 +5、被精选 +50、被收藏 +2、被做同款 +10、回答被采纳 +20、获得月度精选奖 +100；举报核实的违规 −50。积分达到 300 自动成为创作者（发布免审）。兑换优惠券只扣可用积分，不影响等级。
      </p>
    </div>
  )
}

function Inbox({ onRead }: { onRead: () => void }) {
  const { data } = useJson<{ list: { id: number; kind: string; title: string; body: string | null; link: string | null; readAt: string | null; createdAt: string }[] }>(
    '/api/me/notifications',
  )
  useEffect(() => {
    if (!data) return
    if (data.list.some((n) => !n.readAt)) {
      fetch('/api/me/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(onRead).catch(() => {})
    }
  }, [data, onRead])
  if (!data) return <div className="learn-skeleton h-40" />
  if (!data.list.length) return <p className="text-sm text-white/45">还没有通知。有人评论、收藏、做同款，或你的投稿审核有结果时，会在这里告诉你。</p>
  return (
    <ul className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
      {data.list.map((n) => {
        const inner = (
          <div className="flex items-start gap-3 py-4">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.readAt ? 'bg-white/10' : 'bg-amber-300'}`} />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] text-white/90">{n.title}</p>
              {n.body && <p className="mt-1 line-clamp-2 text-sm text-white/45">{n.body}</p>}
              <p className="mt-1 text-xs text-white/30">{new Date(n.createdAt).toLocaleString('zh-CN')}</p>
            </div>
          </div>
        )
        return <li key={n.id}>{n.link ? <Link href={n.link} className="block hover:bg-white/[0.02]">{inner}</Link> : inner}</li>
      })}
    </ul>
  )
}

function Favorites() {
  const { data } = useJson<{ list: ContentCard[] }>('/api/me/favorites')
  if (!data) return <div className="learn-skeleton h-40" />
  if (!data.list.length) return <p className="text-sm text-white/45">还没有收藏。在提示词或教程页点「收藏」，就会出现在这里。</p>
  const prompts = data.list.filter((c) => c.type === 'PROMPT')
  const rest = data.list.filter((c) => c.type !== 'PROMPT')
  return (
    <div className="space-y-12">
      {prompts.length > 0 && <PromptMasonry items={prompts} eager={0} />}
      {rest.length > 0 && <GuideRows items={rest} />}
    </div>
  )
}

function Collections() {
  const { data, reload } = useJson<{ list: { id: number; title: string; intro: string | null; isPublic: boolean; count: number }[] }>('/api/me/collections')
  const [title, setTitle] = useState('')
  const create = async () => {
    if (!title.trim()) return
    const res = await fetch('/api/me/collections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: title.trim() }) })
    const d = await res.json()
    if (d.success) {
      setTitle('')
      reload()
    } else alert(d.error || '创建失败')
  }
  const remove = async (id: number) => {
    if (!confirm('删除这个合集？里面的内容不受影响。')) return
    await fetch(`/api/me/collections/${id}`, { method: 'DELETE' })
    reload()
  }
  return (
    <div>
      <div className="mb-6 flex max-w-lg gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder="新建合集，例如：科研绘图工具箱"
          className="h-11 flex-1 rounded-full border border-white/10 bg-white/5 px-4 text-sm outline-none focus:border-white/30"
          onKeyDown={(e) => e.key === 'Enter' && create()}
        />
        <button type="button" onClick={create} className="h-11 rounded-full bg-white px-5 text-sm font-semibold text-black">新建</button>
      </div>
      {!data ? (
        <div className="learn-skeleton h-32" />
      ) : !data.list.length ? (
        <p className="text-sm text-white/45">把常用的提示词和教程整理成合集，方便自己用，也可以公开分享。</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.list.map((c) => (
            <div key={c.id} className="learn-card flex items-center justify-between gap-3 p-5">
              <Link href={`/collections/${c.id}`} className="min-w-0">
                <p className="truncate font-medium">{c.title}</p>
                <p className="mt-1 text-xs text-white/40">{c.count} 条 · {c.isPublic ? '公开' : '仅自己可见'}</p>
              </Link>
              <button type="button" onClick={() => remove(c.id)} className="rounded-full p-2 text-white/30 hover:bg-white/5 hover:text-red-300" aria-label="删除合集">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Following() {
  const { data } = useJson<{ list: { name: string; handle: string; points: number }[]; collections?: { id: number; title: string; count: number }[] }>('/api/me/following')
  if (!data) return <div className="learn-skeleton h-32" />
  if (!data.list.length && !data.collections?.length) return <p className="text-sm text-white/45">还没有关注作者或合集。关注后，他们发布新内容、合集有更新时你会收到通知。</p>
  return (
    <div className="space-y-10">
      {data.collections && data.collections.length > 0 && (
        <div>
          <p className="learn-eyebrow mb-3">关注的合集</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.collections.map((c) => (
              <Link key={c.id} href={`/collections/${c.id}`} className="learn-card learn-lift flex items-center gap-3 p-4">
                <FolderOpen className="h-5 w-5 shrink-0 text-white/50" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{c.title}</span>
                  <span className="block text-xs text-white/40">{c.count} 条</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
      {data.list.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.list.map((u) => (
            <Link key={u.handle} href={`/u/${u.handle}`} className="learn-card learn-lift flex items-center gap-3 p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 text-sm font-bold text-black">{u.name.slice(0, 1)}</span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{u.name}</span>
                <span className="block text-xs text-white/40">{u.points} 积分</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function MyPosts() {
  const { data } = useJson<{
    list: { id: number; type: string; title: string; path: string; reviewStatus: string; reviewNote: string | null; status: number; featured: boolean; favoriteCount: number; copyCount: number; commentCount: number; ctaVisits?: number; ctaOrders?: number; createdAt: string }[]
  }>('/api/me/posts')
  if (!data) return <div className="learn-skeleton h-40" />
  if (!data.list.length) return <p className="text-sm text-white/45">还没有投稿。</p>
  return (
    <ul className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
      {data.list.map((p) => {
        const r = REVIEW_LABEL[p.reviewStatus] ?? REVIEW_LABEL.PENDING
        return (
          <li key={p.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-white/40">{TYPE_LABEL[p.type] ?? p.type}</span>
                <span className={`rounded-full px-2 py-0.5 ${r.c}`}>{p.status === 1 ? r.t : '已隐藏'}</span>
                {p.featured && <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-black">精选</span>}
              </div>
              <Link href={p.path} className="text-[15px] text-white/90 hover:text-white">{p.title}</Link>
              {p.reviewStatus === 'REJECTED' && p.reviewNote && <p className="mt-1 text-xs text-red-200/80">原因：{p.reviewNote}</p>}
            </div>
            <div className="flex shrink-0 gap-4 text-xs tabular-nums text-white/40">
              <span>收藏 {p.favoriteCount}</span>
              {p.type === 'PROMPT' && <span>复制 {p.copyCount}</span>}
              <span>评论 {p.commentCount}</span>
              {!!p.ctaVisits && <span title="读者从这篇的开通入口点到落地页的人次">带来访问 {p.ctaVisits}</span>}
              {!!p.ctaOrders && <span title="读者从这篇进来、7 天内付款的订单数">带来订单 {p.ctaOrders}</span>}
              <Link href={`/forum/${p.id}/edit`} className="text-white/60 hover:text-white">编辑</Link>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ─────────────────────────────── 积分兑换（P3） ───────────────────────────────

interface ShopData {
  points: number
  available: number
  usedThisMonth: number
  monthlyLimit: number
  options: { key: string; label: string; cost: number; discount: number; minAmount: number; days: number }[]
  history: { id: number; cost: number; name: string; createdAt: string; endAt: string | null }[]
}

function PointsShop({ onChange }: { onChange: () => void }) {
  const { data, reload } = useJson<ShopData>('/api/me/points-shop')
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  if (!data) return <div className="learn-skeleton h-40" />
  const left = data.monthlyLimit - data.usedThisMonth
  const redeem = async (key: string, label: string, cost: number) => {
    if (!confirm(`用 ${cost} 积分兑换「${label}」？兑换后不能退回积分。`)) return
    setBusy(key)
    setMsg(null)
    try {
      const res = await fetch('/api/me/points-shop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) })
      const d = await res.json()
      setMsg({ ok: !!d.success, t: d.success ? d.message : d.error || '兑换失败' })
      if (d.success) {
        reload()
        onChange()
      }
    } finally {
      setBusy(null)
    }
  }
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end gap-x-10 gap-y-4">
        <div>
          <p className="text-xs text-white/40">可用积分</p>
          <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight">{data.available}</p>
        </div>
        <p className="pb-1 text-sm text-white/45">
          累计获得 {data.points} · 本月还能兑换 {Math.max(0, left)} 次
        </p>
      </div>
      {msg && <p className={`mb-6 text-sm ${msg.ok ? 'text-emerald-300' : 'text-red-300'}`}>{msg.t}</p>}
      {!data.options.length ? (
        <p className="text-sm text-white/45">兑换暂未开放。</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.options.map((o) => {
            const short = data.available < o.cost
            const disabled = short || left <= 0 || busy !== null
            return (
              <div key={o.key} className="learn-card flex flex-col gap-4 p-5">
                <div>
                  <p className="text-2xl font-semibold tabular-nums">¥{o.discount}</p>
                  <p className="mt-1 text-sm text-white/70">{o.label}</p>
                  <p className="mt-1 text-xs text-white/35">
                    {o.minAmount > 0 ? `订单满 ${o.minAmount} 元可用` : '无门槛'} · 兑换后 {o.days} 天内有效 · 不能与内推价同用
                  </p>
                </div>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => redeem(o.key, o.label, o.cost)}
                  className="mt-auto h-10 rounded-full bg-white text-sm font-semibold text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {busy === o.key ? '兑换中…' : short ? `需要 ${o.cost} 积分` : `${o.cost} 积分兑换`}
                </button>
              </div>
            )
          })}
        </div>
      )}
      {data.history.length > 0 && (
        <div className="mt-12">
          <p className="learn-eyebrow mb-3">兑换记录</p>
          <ul className="divide-y divide-white/[0.07] border-y border-white/[0.07] text-sm">
            {data.history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="text-white/80">{h.name}</span>
                <span className="text-xs tabular-nums text-white/40">
                  −{h.cost} 积分 · {new Date(h.createdAt).toLocaleDateString('zh-CN')}
                  {h.endAt && ` · ${new Date(h.endAt).toLocaleDateString('zh-CN')} 到期`}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/coupons" className="mt-3 inline-block text-sm text-white/60 hover:text-white">
            去「我的优惠券」查看 →
          </Link>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────── 创作者：认证 + 作者返现（P3） ───────────────────────────────

interface CreatorState {
  certified: boolean
  certTitle: string | null
  works: number
  minWorks: number
  latest: { status: string; field: string; reviewNote: string | null; createdAt: string } | null
  reapplyAt: string | null
  canApply: boolean
  level: number
  hasReferralCode: boolean
  refActive: boolean
}

function Creator() {
  const { data, reload } = useJson<CreatorState>('/api/me/creator-application')
  const [form, setForm] = useState({ field: '', works: '', intro: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  if (!data) return <div className="learn-skeleton h-40" />
  const submit = async () => {
    setBusy(true)
    setErr('')
    try {
      const res = await fetch('/api/me/creator-application', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const d = await res.json()
      if (d.success) reload()
      else setErr(d.error || '提交失败')
    } finally {
      setBusy(false)
    }
  }
  const input = 'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30'
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="learn-card p-6">
        <p className="learn-eyebrow mb-3">创作者认证</p>
        {data.certified ? (
          <>
            <p className="flex items-center gap-2 text-xl font-semibold">
              <BadgeCheck className="h-5 w-5 text-sky-300" /> {data.certTitle || '认证创作者'}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/55">你的主页和作品上会显示认证徽章；发布内容免审，可以在 AI 应用区发作者自荐。</p>
          </>
        ) : data.latest?.status === 'PENDING' ? (
          <p className="text-sm leading-relaxed text-white/60">你的申请（{data.latest.field}）正在审核，结果会在「通知」里告诉你。</p>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-white/55">
              通过认证：作品上显示认证徽章、发布免审、可发作者自荐，开通入口可以带上你的内推码。需要至少 {data.minWorks} 条公开的提示词、教程或应用。
            </p>
            {data.latest?.status === 'REJECTED' && (
              <p className="mt-3 text-sm text-red-200/80">
                上次申请未通过{data.latest.reviewNote ? `：${data.latest.reviewNote}` : ''}
                {data.reapplyAt && !data.canApply ? `，${new Date(data.reapplyAt).toLocaleDateString('zh-CN')} 后可以再申请` : ''}
              </p>
            )}
            {data.works < data.minWorks ? (
              <Link href="/forum/new?type=PROMPT" className="mt-5 inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-black">
                先去发布作品
              </Link>
            ) : data.canApply ? (
              <div className="mt-5 space-y-3">
                <input
                  className={input}
                  maxLength={40}
                  placeholder="创作领域，例如：AI 绘画 / 科研绘图 / 短视频脚本"
                  value={form.field}
                  onChange={(e) => setForm({ ...form, field: e.target.value })}
                />
                <textarea
                  className={`${input} min-h-[88px]`}
                  maxLength={1000}
                  placeholder="代表作链接（站内作品或小红书、B 站、GitHub 等），每行一个"
                  value={form.works}
                  onChange={(e) => setForm({ ...form, works: e.target.value })}
                />
                <textarea
                  className={`${input} min-h-[88px]`}
                  maxLength={500}
                  placeholder="介绍一下你自己和你打算分享的内容（20 字以上）"
                  value={form.intro}
                  onChange={(e) => setForm({ ...form, intro: e.target.value })}
                />
                {err && <p className="text-sm text-red-300">{err}</p>}
                <button type="button" disabled={busy} onClick={submit} className="h-10 rounded-full bg-white px-5 text-sm font-semibold text-black disabled:opacity-40">
                  {busy ? '提交中…' : '提交申请'}
                </button>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="learn-card p-6">
        <p className="learn-eyebrow mb-3">作者内推返现</p>
        <p className="text-sm leading-relaxed text-white/55">
          读者从你内容页上的「开通」入口下单，订单完成后按本站内推规则把返现记到你的可提现余额。入口由系统统一放置，正文里手写的购买链接不会带上你的内推码。
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          <li className={data.level >= 2 ? 'text-emerald-300' : 'text-white/45'}>{data.level >= 2 ? '✓' : '○'} 达到创作者等级（3 篇精选、积分 ≥300 或通过认证）</li>
          <li className={data.hasReferralCode ? 'text-emerald-300' : 'text-white/45'}>{data.hasReferralCode ? '✓' : '○'} 开通内推码</li>
        </ul>
        <p className={`mt-4 text-sm font-medium ${data.refActive ? 'text-emerald-300' : 'text-white/60'}`}>
          {data.refActive ? '已生效：你的公开内容会带上你的内推码' : '还没生效'}
        </p>
        <Link href="/profile/referral" className="mt-4 inline-block text-sm text-white/60 hover:text-white">
          {data.hasReferralCode ? '查看推广返现与提现 →' : '去开通内推码 →'}
        </Link>
      </section>
    </div>
  )
}
