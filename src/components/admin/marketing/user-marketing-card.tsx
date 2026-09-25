'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Loader2, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SUPPRESSION_REASON_LABEL, TOPIC_LABEL, type UserMarketingSummary } from '@/lib/marketing/types'
import { cn } from '@/lib/utils'
import { fmtShortTime, fmtTime, isAbortError, mktFetch } from './api'
import {
  CONSENT_ACTION_LABEL,
  CONSENT_SOURCE_LABEL,
  CONSENT_STATUS_CLS,
  CONSENT_STATUS_LABEL,
  DELIVERY_CLS,
  DELIVERY_LABEL,
  SUPPRESSION_CLS,
} from './labels'
import { MessageStatusBadge } from './status-badge'
import { runSubscriberAction, type SubscriberAction } from './subscriber-actions'

/**
 * 用户详情页的「营销邮件」卡：订阅状态、关闭的分类、暂停、抑制、留痕，以及最近 20 封营销邮件。
 * 客服收到「别再给我发了」时，站长在这里一步处理（退订 / 暂停 / 加入抑制，备注必填）。
 */
export function UserMarketingCard({ userId }: { userId: number }) {
  const [data, setData] = useState<UserMarketingSummary | null>(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<SubscriberAction | null>(null)
  const [flash, setFlash] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    try {
      const r = await mktFetch<UserMarketingSummary>(`/api/admin/marketing/users/${userId}`, { signal: ctrl.signal })
      if (abortRef.current !== ctrl) return
      if (r.ok && r.data) {
        setData(r.data)
        setErr('')
      } else setErr(r.error || '加载失败')
    } catch (e) {
      if (!isAbortError(e)) setErr('加载失败')
    } finally {
      if (abortRef.current === ctrl) setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
    return () => abortRef.current?.abort()
  }, [load])

  const act = async (action: SubscriberAction) => {
    if (!data) return
    setBusy(action)
    try {
      const msg = await runSubscriberAction({
        action,
        userId: data.userId,
        email: action === 'suppress' ? data.email || undefined : undefined,
        who: `用户 #${data.userId}${data.email ? `（${data.email}）` : ''}`,
      })
      if (msg) {
        setFlash(msg)
        load()
      }
    } finally {
      setBusy(null)
    }
  }

  const paused = !!data?.pausedUntil && new Date(data.pausedUntil).getTime() > Date.now()

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-gray-400" />
          <CardTitle>营销邮件</CardTitle>
        </div>
        {data && (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" loading={busy === 'unsubscribe'} disabled={!!busy || data.status === 'UNSUBSCRIBED'} onClick={() => act('unsubscribe')}>
              退订
            </Button>
            <Button size="sm" variant="outline" loading={busy === 'pause'} disabled={!!busy || paused || data.status === 'UNSUBSCRIBED'} onClick={() => act('pause')}>
              暂停 30 天
            </Button>
            <Button size="sm" variant="outline" loading={busy === 'suppress'} disabled={!!busy || !!data.suppressed || !data.email} onClick={() => act('suppress')}>
              加入抑制
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {err && !data ? (
          <p className="py-6 text-center text-sm text-red-600">{err}</p>
        ) : !data ? (
          <div className="flex justify-center py-6 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <>
            {flash && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{flash}</p>}
            <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <dt className="text-xs text-gray-500">订阅状态</dt>
                <dd className="mt-1">
                  <span className={cn('inline-flex rounded px-1.5 py-0.5 text-xs', CONSENT_STATUS_CLS[data.status])}>{CONSENT_STATUS_LABEL[data.status]}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">关闭的分类</dt>
                <dd className="mt-1 text-gray-800">{data.topicsOff.length ? data.topicsOff.map((t) => TOPIC_LABEL[t]).join('、') : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">暂停接收</dt>
                <dd className="mt-1 text-gray-800">{paused ? <span className="text-amber-700">到 {fmtTime(data.pausedUntil)}</span> : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">抑制名单</dt>
                <dd className="mt-1">
                  {data.suppressed ? (
                    <span title={data.suppressed.detail || undefined}>
                      <span className={cn('inline-flex rounded px-1.5 py-0.5 text-xs', SUPPRESSION_CLS[data.suppressed.reason])}>
                        {SUPPRESSION_REASON_LABEL[data.suppressed.reason]}
                      </span>
                      <span className="ml-1 text-xs text-gray-400">{fmtShortTime(data.suppressed.at)}</span>
                    </span>
                  ) : (
                    <span className="text-gray-800">—</span>
                  )}
                </dd>
              </div>
            </dl>
            {!data.email && <p className="text-xs text-gray-400">该用户没有邮箱，不会收到营销邮件。</p>}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700">订阅留痕</h4>
                {data.logs.length === 0 ? (
                  <p className="text-sm text-gray-400">暂无记录</p>
                ) : (
                  <ol className="max-h-72 space-y-2 overflow-y-auto border-l border-gray-200 pl-3">
                    {data.logs.map((l, i) => (
                      <li key={`${l.at}-${i}`} className="text-sm">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="font-medium text-gray-800">{CONSENT_ACTION_LABEL[l.action] || l.action}</span>
                          <span className="text-xs text-gray-400">{CONSENT_SOURCE_LABEL[l.source] || l.source}</span>
                          <span className="text-xs text-gray-400">{fmtTime(l.at)}</span>
                        </div>
                        {l.detail && <div className="break-all text-xs text-gray-500">{l.detail}</div>}
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="min-w-0">
                <h4 className="mb-2 text-sm font-medium text-gray-700">最近的营销邮件</h4>
                {data.messages.length === 0 ? (
                  <p className="text-sm text-gray-400">还没有给这位用户发过营销邮件</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-gray-500">
                          <th className="pb-2 pr-3">活动</th>
                          <th className="pb-2 pr-3">状态</th>
                          <th className="pb-2 pr-3 whitespace-nowrap">发送</th>
                          <th className="pb-2 pr-3">投递</th>
                          <th className="pb-2 whitespace-nowrap">点击 / 退订</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.messages.map((m, i) => (
                          <tr key={`${m.campaignId}-${i}`} className="border-b border-gray-50">
                            <td className="max-w-[200px] py-1.5 pr-3">
                              <Link href={`/admin/marketing/${m.campaignId}`} className="block truncate text-primary-600 hover:underline" title={m.campaignName}>
                                {m.campaignName}
                              </Link>
                            </td>
                            <td className="py-1.5 pr-3">
                              <MessageStatusBadge status={m.status} />
                            </td>
                            <td className="py-1.5 pr-3 text-xs text-gray-500 whitespace-nowrap">{fmtShortTime(m.sentAt)}</td>
                            <td className="py-1.5 pr-3 text-xs">
                              {m.delivery ? <span className={DELIVERY_CLS[m.delivery]}>{DELIVERY_LABEL[m.delivery]}</span> : <span className="text-gray-300">—</span>}
                            </td>
                            <td className="py-1.5 text-xs whitespace-nowrap">
                              {m.unsubscribedAt ? (
                                <span className="text-amber-700">退订 {fmtShortTime(m.unsubscribedAt)}</span>
                              ) : m.clickedAt ? (
                                <span className="text-primary-700">点击 {fmtShortTime(m.clickedAt)}</span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs leading-relaxed text-gray-400">
              管理员只能减少来信（退订 / 暂停 / 抑制），不能替用户恢复订阅 —— 需要用户本人在个人中心「邮件订阅」里打开。
              {loading && <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
