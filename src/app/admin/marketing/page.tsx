'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Copy, Megaphone, Plus, Search, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CAMPAIGN_STATUSES,
  CAMPAIGN_STATUS_LABEL,
  type CampaignDetail,
  type CampaignListItem,
  type CampaignStatus,
  type HaltState,
} from '@/lib/marketing/types'
import { fmtInt, fmtMoney, fmtPct, fmtShortTime, isAbortError, mktFetch, ratio } from '@/components/admin/marketing/api'
import { CampaignStatusBadge, TopicBadge } from '@/components/admin/marketing/status-badge'
import { HaltBanner } from '@/components/admin/marketing/halt-banner'
import { NewCampaignDialog } from '@/components/admin/marketing/new-campaign-dialog'
import { cn } from '@/lib/utils'

/**
 * 营销推广 · 活动列表。
 *
 * 一行一个活动：状态、进度、送达/点击、退订、带来的订单与货款（不含税）一眼看完；
 * 顶部横幅提示「总开关关了 / 全局急停 / 演示模式」—— 这三种情况下活动显示发送中却一封没出去。
 */

interface ListResponse {
  list: CampaignListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  enabled: boolean
  halt: HaltState & { active: boolean }
  dryRun: boolean
}

const PAGE_SIZE = 20

/** 「时间」列按状态取最有意义的那个时间 */
function timeCell(c: CampaignListItem): { label: string; at: string | null } {
  switch (c.status) {
    case 'SCHEDULED':
      return { label: '定时', at: c.scheduledAt }
    case 'SENDING':
    case 'PAUSED':
      return { label: '开始', at: c.startedAt || c.scheduledAt }
    case 'COMPLETED':
      return { label: '完成', at: c.completedAt }
    default:
      return { label: '更新', at: c.updatedAt }
  }
}

export default function MarketingCampaignsPage() {
  const router = useRouter()
  const [data, setData] = useState<ListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [status, setStatus] = useState<CampaignStatus | ''>('')
  const [keyword, setKeyword] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [newOpen, setNewOpen] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), 350)
    return () => clearTimeout(t)
  }, [keyword])

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    try {
      const q = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (status) q.set('status', status)
      if (debounced) q.set('keyword', debounced)
      const r = await mktFetch<ListResponse>(`/api/admin/marketing/campaigns?${q}`, { signal: controller.signal })
      if (abortRef.current !== controller) return
      if (r.ok && r.data) {
        setData(r.data)
        setErr('')
      } else {
        setErr(r.error || '加载失败')
      }
    } catch (e) {
      if (isAbortError(e)) return
      setErr('加载失败')
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }, [page, status, debounced])

  useEffect(() => {
    load()
  }, [load])
  useEffect(() => () => abortRef.current?.abort(), [])

  // 有活动在发送时，列表里的进度每 30 秒刷新一次（后台标签页不刷）
  const anyLive = !!data?.list.some((c) => c.status === 'SENDING' || c.status === 'SCHEDULED')
  useEffect(() => {
    if (!anyLive) return
    const t = setInterval(() => {
      if (!document.hidden) load()
    }, 30_000)
    return () => clearInterval(t)
  }, [anyLive, load])

  const duplicate = async (c: CampaignListItem) => {
    setBusyId(c.id)
    try {
      const r = await mktFetch<CampaignDetail>(`/api/admin/marketing/campaigns/${c.id}/duplicate`, { body: {} })
      if (!r.ok || !r.data) return alert(r.error || '复制失败')
      router.push(`/admin/marketing/${r.data.id}`)
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (c: CampaignListItem) => {
    if (!confirm(`删除草稿「${c.name}」？\n\n删除后不能恢复。`)) return
    setBusyId(c.id)
    try {
      const r = await mktFetch<null>(`/api/admin/marketing/campaigns/${c.id}`, { method: 'DELETE' })
      if (!r.ok) return alert(r.error || '删除失败')
      load()
    } finally {
      setBusyId(null)
    }
  }

  const list = data?.list || []
  const total = data?.total || 0
  const totalPages = Math.max(1, data?.totalPages || 1)

  return (
    <div className="space-y-6">
      {data && <HaltBanner enabled={data.enabled} halt={data.halt} dryRun={data.dryRun} onChanged={load} />}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              营销活动
            </CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              给注册用户发推广邮件：排版 → 选人 → 测试 → 检查 → 发送。邮件经专用营销地址匀速发出，自带一键退订与投诉保护。
            </p>
          </div>
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            新建活动
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
              {(['', ...CAMPAIGN_STATUSES] as const).map((s) => (
                <button
                  key={s || 'all'}
                  type="button"
                  onClick={() => {
                    setStatus(s)
                    setPage(1)
                  }}
                  className={cn(
                    'rounded-md px-3 py-1 text-sm transition-colors',
                    status === s ? 'bg-white font-medium text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  )}
                >
                  {s ? CAMPAIGN_STATUS_LABEL[s] : '全部'}
                </button>
              ))}
            </div>
            <div className="relative ml-auto">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setPage(1)
                }}
                placeholder="搜活动名或邮件主题"
                className="w-64 rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          {err && !data ? (
            <div className="py-12 text-center text-sm text-red-600">
              {err}
              <button className="ml-2 underline" onClick={load}>
                重试
              </button>
            </div>
          ) : loading && !data ? (
            <div className="py-12 text-center text-gray-400">加载中...</div>
          ) : list.length === 0 ? (
            <div className="py-14 text-center">
              {status || debounced ? (
                <p className="text-sm text-gray-400">没有符合条件的活动</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">还没有营销活动。</p>
                  <p className="text-xs text-gray-400">
                    第一次发之前，建议先到「发送设置」填好联系邮箱、添加测试收件人，并确认发信地址已在阿里云验证。
                  </p>
                  <Button onClick={() => setNewOpen(true)}>
                    <Plus className="mr-1 h-4 w-4" />
                    新建第一个活动
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className={cn('overflow-x-auto', loading && 'opacity-70')}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                    <th className="pb-3 pr-3 font-medium">名称</th>
                    <th className="pb-3 pr-3 font-medium">状态</th>
                    <th className="pb-3 pr-3 text-right font-medium">收件人</th>
                    <th className="pb-3 pr-3 font-medium">进度</th>
                    <th className="pb-3 pr-3 text-right font-medium" title="送达 ÷ 已发送（回执陆续回来，发送后几小时内会继续变化）">
                      送达率
                    </th>
                    <th className="pb-3 pr-3 text-right font-medium" title="点过链接的人数 ÷ 送达（已排除机器点击）">
                      点击率
                    </th>
                    <th className="pb-3 pr-3 text-right font-medium">退订</th>
                    <th className="pb-3 pr-3 text-right font-medium" title="末次点击归因的订单数与货款（不含税）">
                      订单 · 货款
                    </th>
                    <th className="pb-3 pr-3 font-medium">时间</th>
                    <th className="pb-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => {
                    // 列表项没有 materializedAt：收件人数 > 0 即已生成名单（草稿、未到点的定时活动都是 0）
                    const materialized = c.recipientCount > 0
                    const processed = c.counts.sent + c.counts.failed + c.counts.skipped + c.counts.unknown
                    const percent = c.recipientCount > 0 ? Math.min(100, (processed / c.recipientCount) * 100) : 0
                    const deliveryRate = ratio(c.delivered, c.counts.sent)
                    const clickRate = ratio(c.uniqueClicks, c.delivered || c.counts.sent)
                    const tc = timeCell(c)
                    return (
                      <tr
                        key={c.id}
                        onClick={() => router.push(`/admin/marketing/${c.id}`)}
                        className="cursor-pointer border-b border-gray-50 align-top transition-colors hover:bg-gray-50"
                      >
                        <td className="max-w-[280px] py-3 pr-3">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-medium text-gray-900" title={c.name}>
                              {c.name}
                            </span>
                            <TopicBadge topic={c.topic} />
                          </div>
                          <div className="mt-0.5 truncate text-xs text-gray-500" title={c.subject}>
                            {c.subject || <span className="text-gray-300">（未填主题）</span>}
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <CampaignStatusBadge status={c.status} note={c.statusNote} />
                          {c.statusNote && (
                            <div className="mt-1 max-w-[180px] truncate text-[11px] text-amber-700" title={c.statusNote}>
                              {c.statusNote}
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-3 text-right tabular-nums text-gray-700">{materialized ? fmtInt(c.recipientCount) : '—'}</td>
                        <td className="w-36 py-3 pr-3">
                          {materialized ? (
                            <div
                              title={`已发送 ${c.counts.sent} · 排队 ${c.counts.queued} · 失败 ${c.counts.failed} · 跳过 ${c.counts.skipped} · 结果未知 ${c.counts.unknown}`}
                            >
                              <div className="text-xs tabular-nums text-gray-700">
                                {fmtInt(c.counts.sent)} <span className="text-gray-400">/ {fmtInt(c.recipientCount)}</span>
                              </div>
                              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className={cn('h-full rounded-full', c.status === 'PAUSED' ? 'bg-amber-400' : c.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-primary-500')}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-3 text-right tabular-nums text-gray-700">{fmtPct(deliveryRate)}</td>
                        <td className="py-3 pr-3 text-right tabular-nums text-gray-700">{fmtPct(clickRate)}</td>
                        <td className="py-3 pr-3 text-right tabular-nums">
                          <span className={c.unsubscribes > 0 ? 'text-amber-700' : 'text-gray-400'}>{fmtInt(c.unsubscribes)}</span>
                          {c.complaints > 0 && (
                            <div className="text-[11px] text-red-600" title="被标记为垃圾邮件">
                              投诉 {c.complaints}
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-3 text-right tabular-nums">
                          {c.orders > 0 ? (
                            <>
                              <div className="text-gray-900">{fmtInt(c.orders)} 单</div>
                              <div className="text-xs text-emerald-700">{fmtMoney(c.revenue)}</div>
                            </>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap py-3 pr-3 text-xs text-gray-500">
                          <span className="text-gray-400">{tc.label}</span> {fmtShortTime(tc.at)}
                        </td>
                        <td className="py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              title="复制为新草稿"
                              disabled={busyId === c.id}
                              onClick={() => duplicate(c)}
                              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            {c.status === 'DRAFT' && (
                              <button
                                type="button"
                                title="删除草稿"
                                disabled={busyId === c.id}
                                onClick={() => remove(c)}
                                className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            <ChevronRight className="h-4 w-4 text-gray-300" />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-gray-500">
                共 {total} 个 · 第 {page} / {totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
                  上一页
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(p + 1, totalPages))}>
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <NewCampaignDialog open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  )
}
