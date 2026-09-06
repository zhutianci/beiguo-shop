'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATEGORIES, TAG_WHITELIST, categoryLabel } from '@/lib/news/constants'
import {
  AlertTriangle,
  ExternalLink,
  Pin,
  RefreshCw,
  Scissors,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'

/**
 * 【AI圈大事记】事件管理。
 *
 * 全站是全自动发布，needsReview 是唯一的人工闸口，所以列表里它必须刺眼——
 * 待复核队列一旦堆到三位数，管理员就会直接放弃审核，这是所有人工审核机制的真实死法。
 *
 * 下线一律走 status='UNLISTED'，界面上不提供物理删除：出侵权投诉时要拿得出原始记录。
 */

interface EventRow {
  id: number
  slug: string
  headline: string
  category: string
  tags: string[]
  aiScore: number
  score: number
  sourceCount: number
  tier1Count: number
  status: string
  needsReview: boolean
  reviewNote: string | null
  reviewedAt: string | null
  pinned: boolean
  composeState: string
  happenedAt: string
  publishedAt: string | null
  updatedAt: string
}

interface DetailItem {
  index: number
  id: number
  title: string
  url: string
  summaryRaw: string | null
  publishedAt: string
  fetchedAt: string
  triageState: string
  blocked: boolean
  blockReason: string | null
  category: string | null
  entities: string[]
  confidence: number | null
  points: number
  comments: number
  source: { id: number; key: string; name: string; tier: number; role: string; kind: string; lang: string }
}

interface ScorePart {
  key: string
  label: string
  raw: number
  points: number
}
interface ScoreBreakdown {
  score: number
  base: number
  decay: number
  parts: ScorePart[]
}

interface EventDetail {
  event: {
    id: number
    slug: string
    headline: string
    summary: string
    whyItMatters: string | null
    facts: { text: string; sourceIndex: number }[]
    category: string
    tags: string[]
    aiScore: number
    score: number
    sourceCount: number
    tier1Count: number
    hnPoints: number
    viewCount: number
    shareCount: number
    likeCount: number
    status: string
    needsReview: boolean
    reviewNote: string | null
    reviewedAt: string | null
    pinned: boolean
    composeState: string
    rewriteCount: number
    happenedAt: string
    publishedAt: string | null
  }
  scoreDebug: ScoreBreakdown | null
  scoreLive: ScoreBreakdown
  items: DetailItem[]
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: '草稿', cls: 'bg-gray-100 text-gray-600' },
  PUBLISHED: { label: '已发布', cls: 'bg-green-100 text-green-700' },
  UNLISTED: { label: '已下线', cls: 'bg-red-100 text-red-700' },
}

const TIER_LABELS: Record<number, { label: string; cls: string }> = {
  1: { label: '一手', cls: 'bg-primary-100 text-primary-700' },
  2: { label: '媒体', cls: 'bg-blue-50 text-blue-700' },
  3: { label: '社区', cls: 'bg-gray-100 text-gray-600' },
}

function fmt(s: string | null | undefined) {
  if (!s) return '—'
  return new Date(s).toLocaleString('zh-CN', { hour12: false })
}
function fmtDay(s: string | null | undefined) {
  if (!s) return '—'
  return new Date(s).toLocaleString('zh-CN', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function AdminNewsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [review, setReview] = useState('')
  const [sort, setSort] = useState('time')
  const [page, setPage] = useState(1)

  const [list, setList] = useState<EventRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [pendingReview, setPendingReview] = useState(0)
  const [pendingCap, setPendingCap] = useState(20)
  const [loading, setLoading] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // 搜索防抖（范式同 /admin/dispenses）
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    try {
      const q = new URLSearchParams({ page: String(page), pageSize: '20', sort })
      if (debouncedSearch) q.set('keyword', debouncedSearch)
      if (status) q.set('status', status)
      if (category) q.set('category', category)
      if (review) q.set('review', review)
      const res = await fetch(`/api/admin/news/events?${q}`, { signal: controller.signal })
      const data = await res.json()
      if (data.success && abortRef.current === controller) {
        setList(data.data.list)
        setTotal(data.data.total || 0)
        setTotalPages(data.data.totalPages || 1)
        setPendingReview(data.data.stats?.pendingReview || 0)
        setPendingCap(data.data.stats?.pendingCap || 20)
      }
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }, [page, debouncedSearch, status, category, review, sort])

  useEffect(() => {
    load()
  }, [load])

  const patch = async (payload: Record<string, unknown>, okMsg?: string) => {
    const res = await fetch('/api/admin/news/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!data.success) {
      alert(data.error || '操作失败')
      return false
    }
    if (okMsg) alert(okMsg)
    load()
    return true
  }

  const overCap = pendingReview > pendingCap

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>AI 大事记 · 事件管理</CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              全自动发布，可疑事件仍会发布但不进首页热点与重点榜。下线只改状态不删记录，用于留存证据。
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            共 <span className="font-semibold text-gray-800">{total}</span> 条 · 待复核{' '}
            <span className={overCap ? 'font-bold text-red-600' : 'font-semibold text-amber-600'}>{pendingReview}</span>
            <span className="text-gray-400"> / 上限 {pendingCap}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {overCap && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                待复核已有 {pendingReview} 条，超过上限 {pendingCap}。队列堆到三位数就没人会审了，
                请先按热度从高到低清理，或调低进入待审的敏感度。
              </span>
            </div>
          )}

          {/* 筛选栏 */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="搜索：标题 / 摘要 / 标签"
                className="w-72 rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">全部状态</option>
              <option value="PUBLISHED">已发布</option>
              <option value="DRAFT">草稿</option>
              <option value="UNLISTED">已下线</option>
            </select>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">全部分类</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={review}
              onChange={(e) => {
                setReview(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">复核状态不限</option>
              <option value="1">只看待复核</option>
              <option value="0">只看已复核</option>
            </select>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="time">按发生时间</option>
              <option value="score">按热度分</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => load()}>
              <RefreshCw className="mr-1 h-4 w-4" />
              刷新
            </Button>
          </div>

          {/* 列表 */}
          {loading ? (
            <div className="py-10 text-center text-gray-400">加载中...</div>
          ) : list.length === 0 ? (
            <div className="py-10 text-center text-gray-400">暂无事件</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2 pr-3">标题</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">分类</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">信源数</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">AI 评分</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">热度分</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">状态</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">复核</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">发生时间</th>
                    <th className="pb-2 whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr
                      key={r.id}
                      className={
                        r.needsReview
                          ? 'border-b border-l-4 border-l-amber-400 bg-amber-50/70 align-top hover:bg-amber-50'
                          : 'border-b align-top hover:bg-gray-50/60'
                      }
                    >
                      <td className="max-w-[380px] py-2 pr-3">
                        <button
                          onClick={() => setDetailId(r.id)}
                          className="text-left font-medium text-gray-900 hover:text-primary-700"
                        >
                          {r.pinned && <Pin className="mr-1 inline h-3.5 w-3.5 text-primary-600" />}
                          {r.headline}
                        </button>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          {r.tags.map((t) => (
                            <span key={t} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                              {t}
                            </span>
                          ))}
                          {r.composeState !== 'DONE' && (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                              摘要 {r.composeState}
                            </span>
                          )}
                        </div>
                        {r.needsReview && r.reviewNote && (
                          <div className="mt-1 text-xs text-amber-700">⚠ {r.reviewNote}</div>
                        )}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap text-gray-600">{categoryLabel(r.category)}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <span className={r.sourceCount >= 3 ? 'font-semibold text-gray-900' : 'text-gray-600'}>
                          {r.sourceCount}
                        </span>
                        {r.tier1Count > 0 && (
                          <span className="ml-1 rounded bg-primary-50 px-1 text-xs text-primary-700">
                            一手 {r.tier1Count}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap text-gray-600">{r.aiScore}</td>
                      <td className="py-2 pr-3 whitespace-nowrap font-mono text-gray-800">{r.score.toFixed(2)}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                            STATUS_LABELS[r.status]?.cls || 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {STATUS_LABELS[r.status]?.label || r.status}
                        </span>
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {r.needsReview ? (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                            待复核
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">已复核</span>
                        )}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap text-xs text-gray-500">{fmtDay(r.happenedAt)}</td>
                      <td className="py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" onClick={() => setDetailId(r.id)}>
                            详情
                          </Button>
                          {r.needsReview && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => patch({ id: r.id, reviewed: true })}
                              title="标记已复核"
                            >
                              <ShieldCheck className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => patch({ id: r.id, pinned: !r.pinned })}
                            title={r.pinned ? '取消置顶' : '置顶'}
                          >
                            <Pin className={`h-4 w-4 ${r.pinned ? 'text-primary-600' : 'text-gray-400'}`} />
                          </Button>
                          {r.status === 'UNLISTED' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => patch({ id: r.id, status: 'PUBLISHED' })}
                              title="恢复发布"
                            >
                              恢复
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('确认下线？记录会保留（状态改为 UNLISTED），不会物理删除。')) {
                                  patch({ id: r.id, status: 'UNLISTED' })
                                }
                              }}
                              title="下线（保留记录）"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-gray-500">
                共 {total} 条 · 第 {page} / {totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {detailId !== null && (
        <EventDetailModal
          id={detailId}
          onClose={() => setDetailId(null)}
          onChanged={() => load()}
        />
      )}
    </div>
  )
}

// ---------------- 详情 / 编辑弹窗 ----------------

function ScoreTable({ b, title }: { b: ScoreBreakdown; title: string }) {
  return (
    <div className="rounded-lg border border-gray-200">
      <div className="border-b border-gray-100 px-3 py-2 text-xs font-semibold text-gray-600">{title}</div>
      <table className="w-full text-xs">
        <tbody>
          {b.parts?.map((p) => (
            <tr key={p.key} className="border-b border-gray-50 last:border-0">
              <td className="px-3 py-1.5 text-gray-600">{p.label}</td>
              <td className="px-3 py-1.5 text-right font-mono text-gray-500">{p.raw}</td>
              <td className="px-3 py-1.5 text-right font-mono text-gray-900">+{p.points}</td>
            </tr>
          ))}
          <tr className="bg-gray-50">
            <td className="px-3 py-1.5 text-gray-600">小计 × 时间衰减</td>
            <td className="px-3 py-1.5 text-right font-mono text-gray-500">
              {b.base} × {b.decay}
            </td>
            <td className="px-3 py-1.5 text-right font-mono font-semibold text-gray-900">{b.score}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function EventDetailModal({ id, onClose, onChanged }: { id: number; onClose: () => void; onChanged: () => void }) {
  const [data, setData] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<number[]>([])

  const [headline, setHeadline] = useState('')
  const [summary, setSummary] = useState('')
  const [whyItMatters, setWhyItMatters] = useState('')
  const [category, setCategory] = useState('industry')
  const [tags, setTags] = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/news/events/${id}`)
      const d = await res.json()
      if (d.success) {
        const detail = d.data as EventDetail
        setData(detail)
        setHeadline(detail.event.headline)
        setSummary(detail.event.summary)
        setWhyItMatters(detail.event.whyItMatters || '')
        setCategory(detail.event.category)
        setTags(detail.event.tags)
        setSelected([])
      } else {
        alert(d.error || '加载失败')
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/news/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, headline, summary, whyItMatters, category, tags }),
      })
      const d = await res.json()
      if (!d.success) return alert(d.error || '保存失败')
      alert('已保存')
      onChanged()
      load()
    } finally {
      setSaving(false)
    }
  }

  const quick = async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/admin/news/events', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    })
    const d = await res.json()
    if (!d.success) return alert(d.error || '操作失败')
    onChanged()
    load()
  }

  const doSplit = async (action: 'split' | 'detach') => {
    if (selected.length === 0) return alert('请先勾选要处理的信源条目')
    let headlineForNew: string | null = null
    if (action === 'split') {
      headlineForNew = prompt(
        '新事件的临时标题（留空则用最早那条信源的标题）。\n新事件会建成草稿，compose 段会重新生成正式标题与摘要后自动发布。',
        ''
      )
      if (headlineForNew === null) return
    } else if (!confirm(`确认把选中的 ${selected.length} 条信源移出本事件？\n它们会被标记为不再参与聚类，避免下一轮又聚回来。`)) {
      return
    }
    const res = await fetch(`/api/admin/news/events/${id}/split`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        itemIds: selected,
        ...(headlineForNew ? { headline: headlineForNew } : {}),
      }),
    })
    const d = await res.json()
    if (!d.success) return alert(d.error || '操作失败')
    alert(d.message || '已处理')
    onChanged()
    load()
  }

  const ev = data?.event

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="w-full max-w-5xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">事件详情 #{id}</h3>
            {ev && (
              <p className="mt-0.5 font-mono text-xs text-gray-400">
                {ev.slug} · 发生 {fmt(ev.happenedAt)} · 摘要状态 {ev.composeState} · 已重写 {ev.rewriteCount} 次
              </p>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading || !data || !ev ? (
          <div className="py-16 text-center text-gray-400">加载中...</div>
        ) : (
          <div className="max-h-[75vh] space-y-6 overflow-y-auto px-6 py-5">
            {/* 复核提示 */}
            {ev.needsReview && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <div className="font-semibold">待人工复核</div>
                  <div className="mt-0.5">{ev.reviewNote || '命中可疑规则'}</div>
                  <div className="mt-1 text-xs text-amber-700">
                    数字回查只能证明「摘要里的数字出现在原材料里」，拦不住「A 收购 B」写成「B 收购 A」这类关系颠倒，
                    请对照下方信源逐条核对。
                  </div>
                </div>
              </div>
            )}

            {/* 快捷操作 */}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant={ev.needsReview ? 'primary' : 'outline'} size="sm" onClick={() => quick({ reviewed: !ev.needsReview })}>
                <ShieldCheck className="mr-1 h-4 w-4" />
                {ev.needsReview ? '标记已复核' : '打回待复核'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => quick({ pinned: !ev.pinned })}>
                <Pin className="mr-1 h-4 w-4" />
                {ev.pinned ? '取消置顶' : '置顶'}
              </Button>
              {ev.status === 'UNLISTED' ? (
                <Button variant="outline" size="sm" onClick={() => quick({ status: 'PUBLISHED' })}>
                  恢复发布
                </Button>
              ) : (
                <>
                  {ev.status === 'DRAFT' && (
                    <Button variant="outline" size="sm" onClick={() => quick({ status: 'PUBLISHED' })}>
                      发布
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('确认下线？记录会保留（UNLISTED），不会物理删除。')) quick({ status: 'UNLISTED' })
                    }}
                  >
                    <Trash2 className="mr-1 h-4 w-4 text-red-500" />
                    下线
                  </Button>
                </>
              )}
              <span className="ml-auto text-xs text-gray-400">
                浏览 {ev.viewCount} · 分享 {ev.shareCount} · 点赞 {ev.likeCount} · HN {ev.hnPoints}
              </span>
            </div>

            {/* 编辑区 */}
            <div className="space-y-4 rounded-lg border border-gray-200 p-4">
              <Input label="标题" value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={300} />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">摘要</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                <p className="mt-1 text-xs text-gray-400">
                  {summary.length} 字。自写摘要，不得整段复制原文；不要出现「记者」「编辑部」「独家」「本站原创」等采编口径的字眼。
                </p>
              </div>
              <Input
                label="推荐理由（≤60 字）"
                value={whyItMatters}
                onChange={(e) => setWhyItMatters(e.target.value)}
                maxLength={300}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">分类</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.label} —— {c.hint}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    标签（只能从白名单选，最多 8 个）
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      const v = e.target.value
                      if (v && !tags.includes(v) && tags.length < 8) setTags([...tags, v])
                    }}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
                  >
                    <option value="">+ 添加标签</option>
                    {TAG_WHITELIST.filter((t) => !tags.includes(t)).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                      >
                        {t}
                        <button onClick={() => setTags(tags.filter((x) => x !== t))} className="text-gray-400 hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {tags.length === 0 && <span className="text-xs text-gray-400">暂无标签</span>}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button size="sm" loading={saving} onClick={save}>
                  保存修改
                </Button>
              </div>
            </div>

            {/* 关键事实：每条标注来自第几个信源，用于一键复核 */}
            {ev.facts.length > 0 && (
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="mb-2 text-sm font-semibold text-gray-700">关键事实与出处</div>
                <ul className="space-y-1.5 text-sm text-gray-700">
                  {ev.facts.map((f, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="shrink-0 rounded bg-primary-50 px-1.5 text-xs text-primary-700">
                        信源 #{f.sourceIndex}
                      </span>
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 热度分明细：这条为什么排第一 */}
            <div className="grid gap-4 md:grid-cols-2">
              <ScoreTable b={data.scoreLive} title="热度分明细（按当前计数实时重算）" />
              {data.scoreDebug?.parts ? (
                <ScoreTable b={data.scoreDebug} title="热度分明细（rank 段落库值）" />
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 p-4 text-xs text-gray-400">
                  尚无落库的 scoreDebug —— rank 段还没跑过这条，或落库格式与预期不符。
                </div>
              )}
            </div>

            {/* 原始信源条目 */}
            <div className="rounded-lg border border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
                <div className="text-sm font-semibold text-gray-700">
                  原始信源条目（{data.items.length} 条 · 去重后计 {ev.sourceCount} 个信源）
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">已选 {selected.length}</span>
                  <Button variant="outline" size="sm" disabled={selected.length === 0} onClick={() => doSplit('detach')}>
                    <X className="mr-1 h-4 w-4" />
                    从事件移除
                  </Button>
                  <Button variant="outline" size="sm" disabled={selected.length === 0} onClick={() => doSplit('split')}>
                    <Scissors className="mr-1 h-4 w-4" />
                    拆分为新事件
                  </Button>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {data.items.map((it) => (
                  <div key={it.id} className="flex gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(it.id)}
                      onChange={(e) =>
                        setSelected((s) => (e.target.checked ? [...s, it.id] : s.filter((x) => x !== it.id)))
                      }
                      className="mt-1 h-4 w-4"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-500">#{it.index}</span>
                        <span className="font-medium text-gray-700">{it.source.name}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 ${TIER_LABELS[it.source.tier]?.cls || 'bg-gray-100 text-gray-600'}`}
                        >
                          {TIER_LABELS[it.source.tier]?.label || `tier${it.source.tier}`}
                        </span>
                        {it.source.role !== 'feed' && (
                          <span className="rounded bg-purple-50 px-1.5 py-0.5 text-purple-700">{it.source.role}</span>
                        )}
                        {it.blocked && (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700">
                            已拦截{it.blockReason ? `：${it.blockReason}` : ''}
                          </span>
                        )}
                        {it.confidence != null && (
                          <span className={it.confidence < 0.7 ? 'text-amber-700' : 'text-gray-400'}>
                            置信度 {it.confidence.toFixed(2)}
                          </span>
                        )}
                        {it.points > 0 && <span className="text-gray-400">热度 {it.points}</span>}
                      </div>
                      <div className="mt-1 text-sm text-gray-900">{it.title}</div>
                      {it.summaryRaw && <div className="mt-1 line-clamp-2 text-xs text-gray-500">{it.summaryRaw}</div>}
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <a
                          href={it.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex items-center gap-1 text-primary-600 hover:underline"
                        >
                          原文 <ExternalLink className="h-3 w-3" />
                        </a>
                        <span>发布 {fmt(it.publishedAt)}</span>
                        <span>抓取 {fmt(it.fetchedAt)}</span>
                        {it.entities.length > 0 && <span>实体：{it.entities.join('、')}</span>}
                      </div>
                    </div>
                  </div>
                ))}
                {data.items.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">该事件下已没有信源条目</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
