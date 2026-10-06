'use client'

/**
 * 我的学习空间（内容平台 P2）：通知 · 收藏 · 合集 · 关注 · 我的投稿 · 积分。
 * 纯客户端页（个人数据，不进搜索引擎）；未登录跳登录页。打开「通知」页签即全部标为已读。
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Bookmark, FolderOpen, PenLine, Sparkles, Trash2, Users } from 'lucide-react'
import { useUserStore } from '@/store/user'
import { useHydrated } from '@/lib/use-hydrated'
import { withRedirect } from '@/lib/safe-redirect'
import { PromptMasonry, GuideRows } from './ui'
import type { ContentCard } from '@/lib/content/queries'

type Tab = 'inbox' | 'favorites' | 'collections' | 'following' | 'posts'

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
    if (q && ['inbox', 'favorites', 'collections', 'following', 'posts'].includes(q)) setTab(q)
  }, [])

  const s = summary.data
  const tabs: { k: Tab; t: string; icon: typeof Bell; n?: number }[] = [
    { k: 'inbox', t: '通知', icon: Bell, n: s?.unread },
    { k: 'favorites', t: '收藏', icon: Bookmark, n: s?.favorites },
    { k: 'collections', t: '合集', icon: FolderOpen },
    { k: 'following', t: '关注', icon: Users, n: s?.following },
    { k: 'posts', t: '我的投稿', icon: PenLine },
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

      <p className="mt-16 text-xs text-white/30">
        积分怎么来：内容公开 +5、被精选 +50、被收藏 +2、被做同款 +10、回答被采纳 +20；举报核实的违规 −50。积分达到 300 自动成为创作者（发布免审）。
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
  const { data } = useJson<{ list: { name: string; handle: string; points: number }[] }>('/api/me/following')
  if (!data) return <div className="learn-skeleton h-32" />
  if (!data.list.length) return <p className="text-sm text-white/45">还没有关注作者。关注后，他们发布新内容时你会收到通知。</p>
  return (
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
  )
}

function MyPosts() {
  const { data } = useJson<{
    list: { id: number; type: string; title: string; path: string; reviewStatus: string; reviewNote: string | null; status: number; featured: boolean; favoriteCount: number; copyCount: number; commentCount: number; createdAt: string }[]
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
              <Link href={`/forum/${p.id}/edit`} className="text-white/60 hover:text-white">编辑</Link>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
