'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Ban,
  Clock,
  Download,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Undo2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  MESSAGE_STATUSES,
  MESSAGE_STATUS_LABEL,
  SKIP_REASON_LABEL,
  type CampaignReport,
  type MessageRow,
  type MessageStatus,
  type SkipReason,
} from '@/lib/marketing/types'
import { fmtInt, fmtMoney, fmtPct, fmtShortTime, fmtTime, isAbortError, mktFetch } from './api'
import { AUDIT_ACTION_LABEL, DELIVERY_CLS, DELIVERY_LABEL } from './labels'
import { CampaignStatusBadge, MessageStatusBadge, TopicBadge } from './status-badge'
import { ProgressBar, StatTile } from './stat-tile'
import { ContentPreview } from './content-preview'

const AUTO_REFRESH_MS = 10_000

export type ControlAction = 'pause' | 'resume' | 'cancel' | 'unschedule' | 'requeue'

/**
 * 已提交（非草稿）活动的报表：进度与「为什么还没发」、控制按钮、漏斗、比率、链接排行、归因订单、
 * 券、时间线、收件人明细，以及冻结内容的只读预览。
 *
 * 发送中 / 待发送时每 10 秒自动刷新（页面在后台标签页时不刷，回到前台立即刷一次）。
 */
export function CampaignReportView({ campaignId, onChanged }: { campaignId: number; onChanged: () => void }) {
  const [report, setReport] = useState<CampaignReport | null>(null)
  const [loadErr, setLoadErr] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null)
  const [busy, setBusy] = useState<ControlAction | null>(null)
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const statusRef = useRef<string | null>(null)
  // 页面每次渲染都会传一个新的 onChanged；放进 ref，免得 load 跟着变、触发重复请求
  const onChangedRef = useRef(onChanged)
  onChangedRef.current = onChanged

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setRefreshing(true)
    try {
      const r = await mktFetch<CampaignReport>(`/api/admin/marketing/campaigns/${campaignId}/report`, { signal: ctrl.signal })
      if (abortRef.current !== ctrl) return
      if (r.ok && r.data) {
        const prevStatus = statusRef.current
        setReport(r.data)
        setLoadErr('')
        setLastLoadedAt(Date.now())
        statusRef.current = r.data.campaign.status
        // 状态变了（发完、被自动暂停、另一个窗口撤回成草稿…）：通知页面重新拉活动，页面据此切换视图
        if (prevStatus && prevStatus !== r.data.campaign.status) onChangedRef.current()
      } else {
        setLoadErr(r.error || '加载报表失败')
      }
    } catch (e) {
      if (!isAbortError(e)) setLoadErr('加载报表失败')
    } finally {
      if (abortRef.current === ctrl) setRefreshing(false)
    }
  }, [campaignId])

  useEffect(() => {
    load()
    return () => abortRef.current?.abort()
  }, [load])

  const live = report?.campaign.status === 'SENDING' || report?.campaign.status === 'SCHEDULED'
  useEffect(() => {
    if (!live) return
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      load()
    }, AUTO_REFRESH_MS)
    const onVis = () => {
      if (!document.hidden) load()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [live, load])

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 8000)
    return () => clearTimeout(t)
  }, [flash])

  if (!report) {
    return loadErr ? (
      <Card>
        <CardContent className="py-12 text-center text-sm text-red-600">
          {loadErr}
          <button className="ml-2 underline" onClick={load}>
            重试
          </button>
        </CardContent>
      </Card>
    ) : (
      <div className="flex justify-center py-16 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  const c = report.campaign

  const control = async (action: ControlAction) => {
    const texts: Record<ControlAction, string> = {
      pause:
        `暂停「${c.name}」？\n\n暂停后不再发出新的邮件；已经发出的不受影响，排队中的 ${fmtInt(report.progress.queued)} 封保留。\n` +
        '随时可以点「继续」接着发。',
      resume:
        `继续发送「${c.name}」？\n\n` +
        '· 熔断统计从现在重新计算\n· 今天会先发一小批试探，回执正常后再放量\n· 仍然只在发送时段内、按每日额度匀速发送',
      cancel:
        `取消「${c.name}」？\n\n还没发出的 ${fmtInt(report.progress.queued)} 封全部作废，不能恢复（只能复制成新活动重新发）。\n` +
        '已经发出的不受影响；已经发到用户账户里的直发券保留。',
      unschedule:
        `撤回定时发送？\n\n活动会退回草稿，可以继续修改后重新发送（需要重新检查；内容改了还要重新测试）。` +
        (c.couponId ? '\n还没发出的直发券批次会一并删除，重新发送时再建。' : ''),
      requeue:
        '把可以安全重发的邮件重新排队？\n\n只会重排两类：\n' +
        '· 失败原因属于「可重试」的（网络中断、阿里云临时错误）\n' +
        '· 结果未知、并且已经和阿里云对账确认「没有被受理」的\n\n' +
        '其他「结果未知」的不会重排 —— 阿里云可能已经发出，重排会让对方收到两封。',
    }
    if (!confirm(texts[action])) return
    setBusy(action)
    try {
      const r = await mktFetch<{ message?: string }>(`/api/admin/marketing/campaigns/${campaignId}/control`, { body: { action } })
      if (!r.ok) {
        setFlash({ ok: false, text: r.error || '操作失败' })
      } else {
        setFlash({ ok: true, text: r.message || r.data?.message || '已完成' })
      }
      await load()
      onChangedRef.current()
    } finally {
      setBusy(null)
    }
  }

  return (
    <ReportBody
      report={report}
      campaignId={campaignId}
      busy={busy}
      flash={flash}
      refreshing={refreshing}
      live={live}
      lastLoadedAt={lastLoadedAt}
      onControl={control}
      onRefresh={load}
    />
  )
}

/**
 * 报表主体（纯展示，数据与操作都由外层传入）。单独拆出来，scripts/check-marketing-admin-ui.ts
 * 能用假数据做服务端渲染冒烟，确认各种状态组合下不会渲染崩溃。
 */
export function ReportBody({
  report,
  campaignId,
  busy,
  flash,
  refreshing,
  live,
  lastLoadedAt,
  onControl,
  onRefresh,
}: {
  report: CampaignReport
  campaignId: number
  busy: ControlAction | null
  flash: { ok: boolean; text: string } | null
  refreshing: boolean
  live: boolean
  lastLoadedAt: number | null
  onControl: (action: ControlAction) => void
  onRefresh: () => void
}) {
  const c = report.campaign
  const f = report.funnel
  const materialized = !!c.materializedAt
  const control = onControl
  const load = onRefresh

  const canPause = c.status === 'SCHEDULED' || c.status === 'SENDING'
  const canResume = c.status === 'PAUSED'
  const canCancel = c.status === 'SCHEDULED' || c.status === 'SENDING' || c.status === 'PAUSED'
  const canUnschedule = c.status === 'SCHEDULED' && !materialized
  const canRequeue = (c.status === 'COMPLETED' || c.status === 'SENDING' || c.status === 'PAUSED') && f.failed + f.unknown > 0

  const excluded = (Object.entries(report.skipReasons) as [SkipReason, number][]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])
  const totalLinkClicks = report.links.reduce((s, l) => s + l.clicks, 0)
  const links = [...report.links].sort((a, b) => b.clicks - a.clicks)

  return (
    <div className="space-y-6">
      {/* 状态与控制 */}
      <Card>
        <CardContent className="space-y-4 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <CampaignStatusBadge status={c.status} />
                <TopicBadge topic={c.topic} />
                <span className="text-xs text-gray-400">
                  {c.scheduledAt && <>定时 {fmtTime(c.scheduledAt)} · </>}
                  {c.startedAt && <>开始 {fmtTime(c.startedAt)} · </>}
                  {c.completedAt && <>完成 {fmtTime(c.completedAt)} · </>}
                  创建 {fmtTime(c.createdAt)}
                </span>
              </div>
              <div className="break-all text-sm text-gray-600">
                主题：<span className="text-gray-900">{c.subject}</span>
              </div>
              {c.statusNote && (
                <div className="rounded-md bg-amber-50 px-3 py-1.5 text-sm text-amber-800">
                  <span className="font-medium">说明：</span>
                  {c.statusNote}
                </div>
              )}
              {report.waiting.code !== 'none' && (
                <div className="flex items-start gap-1.5 text-sm text-sky-800">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
                  <span>
                    {report.waiting.text}
                    {report.waiting.until && <span className="ml-1 text-sky-600">（预计 {fmtTime(report.waiting.until)}）</span>}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canPause && (
                <Button size="sm" variant="outline" loading={busy === 'pause'} disabled={!!busy} onClick={() => control('pause')}>
                  <Pause className="mr-1 h-3.5 w-3.5" /> 暂停
                </Button>
              )}
              {canResume && (
                <Button size="sm" loading={busy === 'resume'} disabled={!!busy} onClick={() => control('resume')}>
                  <Play className="mr-1 h-3.5 w-3.5" /> 继续发送
                </Button>
              )}
              {canUnschedule && (
                <Button size="sm" variant="outline" loading={busy === 'unschedule'} disabled={!!busy} onClick={() => control('unschedule')}>
                  <Undo2 className="mr-1 h-3.5 w-3.5" /> 撤回定时
                </Button>
              )}
              {canRequeue && (
                <Button size="sm" variant="outline" loading={busy === 'requeue'} disabled={!!busy} onClick={() => control('requeue')}>
                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> 重新排队
                </Button>
              )}
              {canCancel && (
                <Button size="sm" variant="danger" loading={busy === 'cancel'} disabled={!!busy} onClick={() => control('cancel')}>
                  <Ban className="mr-1 h-3.5 w-3.5" /> 取消活动
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={load} disabled={refreshing} title="刷新">
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {flash && (
            <div className={`rounded-md px-3 py-2 text-sm ${flash.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>{flash.text}</div>
          )}

          <div>
            <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span className="text-gray-600">
                进度 <span className="font-semibold tabular-nums text-gray-900">{fmtInt(report.progress.done)}</span> /{' '}
                <span className="tabular-nums">{fmtInt(report.progress.total)}</span>
                {report.progress.queued > 0 && <span className="ml-2 text-xs text-gray-400">排队中 {fmtInt(report.progress.queued)}</span>}
              </span>
              <span className="text-xs text-gray-400">
                {!materialized && c.status === 'SCHEDULED'
                  ? '到点后生成收件人名单'
                  : `${Math.round(report.progress.percent)}%`}
                {live && lastLoadedAt && <span className="ml-2">· 每 10 秒自动刷新</span>}
              </span>
            </div>
            <ProgressBar percent={report.progress.percent} tone={c.status === 'PAUSED' ? 'warn' : c.status === 'COMPLETED' ? 'good' : 'brand'} />
          </div>
        </CardContent>
      </Card>

      {/* 漏斗 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <StatTile label="收件人" value={fmtInt(f.recipients)} hint="生成名单时写入的全部行（含被排除、跳过的）" />
        <StatTile label="已发送" value={fmtInt(f.sent)} sub={f.failed > 0 ? `失败 ${fmtInt(f.failed)}` : undefined} tone="brand" />
        <StatTile label="送达" value={fmtInt(f.delivered)} sub={fmtPct(report.rates.deliveryRate)} tone="good" hint="阿里云回执确认投递成功（回执通常几分钟到几小时陆续回来）" />
        <StatTile label="无效地址" value={fmtInt(f.invalid)} tone={f.invalid > 0 ? 'bad' : 'muted'} hint="对方邮箱不存在等，已自动加入抑制名单" />
        <StatTile label="进垃圾箱" value={fmtInt(f.spam)} tone={f.spam > 0 ? 'warn' : 'muted'} />
        <StatTile
          label="结果未知"
          value={fmtInt(f.unknown)}
          tone={f.unknown > 0 ? 'warn' : 'muted'}
          hint="请求发出后没拿到明确结果（超时、进程中断）。不会自动重发，由回执同步对账；确认没被受理的可以「重新排队」"
        />
        <StatTile label="跳过" value={fmtInt(f.skipped)} tone="muted" hint="生成名单或发送前复核时被排除（原因见下方）" />
        <StatTile
          label="点击（已去机器）"
          value={fmtInt(f.uniqueClicks)}
          sub={f.botClicks > 0 ? `机器点击 ${fmtInt(f.botClicks)} 已排除` : fmtPct(report.rates.clickRate)}
          tone="brand"
          hint="点过邮件里任意链接的人数。邮箱安全扫描、预取等机器访问已排除"
        />
        <StatTile
          label="打开（仅供参考）"
          value={fmtInt(f.uniqueOpens)}
          tone="muted"
          hint="靠图片像素统计：Apple 邮件、QQ 邮箱代理会预取图片导致偏高，很多客户端默认不显示图片又会偏低。不要拿它做判断"
        />
        <StatTile label="退订" value={fmtInt(f.unsubscribes)} sub={fmtPct(report.rates.unsubscribeRate, 2)} tone={f.unsubscribes > 0 ? 'warn' : 'muted'} />
        <StatTile label="投诉" value={fmtInt(f.complaints)} sub={fmtPct(report.rates.complaintRate, 2)} tone={f.complaints > 0 ? 'bad' : 'muted'} hint="收件人点了「这是垃圾邮件」。投诉过的人永久不再发送" />
        <StatTile label="订单" value={fmtInt(f.orders)} tone="good" hint="点击邮件后规定天数内付款（末次点击归因），已付款且未取消" />
        <StatTile label="货款（不含税）" value={fmtMoney(f.revenue)} tone="good" hint="上述订单的 Order.amount 合计，不含开票税费" />
        <StatTile
          label="影响订单"
          value={fmtInt(f.influencedOrders)}
          sub={fmtMoney(f.influencedRevenue)}
          tone="muted"
          hint="邮件已送达、没点击，但送达后 5 天内付了款。单列参考，不计入上面的订单"
        />
        {report.coupon && (
          <Link
            href={`/admin/coupons?source=CAMPAIGN&keyword=${encodeURIComponent(report.coupon.code)}`}
            className="block rounded-lg transition-shadow hover:shadow-md"
            title="在优惠券管理里查看这批直发券"
          >
            <StatTile
              label="直发券 已发 / 已用"
              value={
                <>
                  {fmtInt(report.coupon.granted)}
                  <span className="text-base font-normal text-gray-400"> / {fmtInt(report.coupon.used)}</span>
                </>
              }
              sub={<span className="text-pink-600">查看券批次 →</span>}
              tone="brand"
              className="border-pink-200 bg-pink-50/40"
            />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <RateTile label="送达率" v={report.rates.deliveryRate} />
        <RateTile label="点击率" v={report.rates.clickRate} />
        <RateTile label="点击 / 打开" v={report.rates.clickToOpen} hint="打开数不可靠，这个比率同样只供参考" />
        <RateTile label="退订率" v={report.rates.unsubscribeRate} digits={2} warnOver={0.005} />
        <RateTile label="投诉率" v={report.rates.complaintRate} digits={2} warnOver={0.001} />
        <RateTile label="无效率" v={report.rates.invalidRate} digits={1} warnOver={0.03} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* 跳过原因 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">为什么有人没收到（跳过原因）</CardTitle>
          </CardHeader>
          <CardContent>
            {excluded.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">没有被跳过的收件人</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {excluded.map(([k, n]) => (
                    <tr key={k} className="border-b border-gray-50">
                      <td className="py-1.5 text-gray-700">{SKIP_REASON_LABEL[k] || k}</td>
                      <td className="py-1.5 text-right tabular-nums text-gray-900">{fmtInt(n)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="mt-3 text-xs text-gray-400">在下方「收件人明细」里按状态筛「已跳过」能看到每个人的具体原因。</p>
          </CardContent>
        </Card>

        {/* 链接排行 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">链接点击排行</CardTitle>
            {totalLinkClicks > 0 && <span className="text-xs text-gray-400">有效点击合计 {fmtInt(totalLinkClicks)}</span>}
          </CardHeader>
          <CardContent>
            {links.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">{materialized ? '还没有有效点击' : '开始发送后这里会显示每个链接的点击数'}</p>
            ) : (
              <ul className="space-y-2">
                {links.map((l) => (
                  <li key={l.idx} className="text-sm">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-gray-800" title={l.url}>
                        {l.label || '（无文字）'}
                      </span>
                      <span className="shrink-0 tabular-nums text-gray-900">{fmtInt(l.clicks)}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-primary-400" style={{ width: `${totalLinkClicks ? (l.clicks / totalLinkClicks) * 100 : 0}%` }} />
                      </div>
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="max-w-[45%] truncate text-xs text-gray-400 hover:text-primary-600" title={l.url}>
                        {l.url.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 归因订单 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">带来的订单（末次点击归因）</CardTitle>
          <span className="text-sm text-gray-500">
            {fmtInt(f.orders)} 单 · 货款 {fmtMoney(f.revenue)}（不含税）
          </span>
        </CardHeader>
        <CardContent>
          {report.orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">还没有归因到本活动的订单</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2 pr-3">订单号</th>
                    <th className="pb-2 pr-3">用户</th>
                    <th className="pb-2 pr-3">商品</th>
                    <th className="pb-2 pr-3 text-right">货款</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">点击时间</th>
                    <th className="pb-2 whitespace-nowrap">付款时间</th>
                  </tr>
                </thead>
                <tbody>
                  {report.orders.map((o) => (
                    <tr key={o.orderNo} className="border-b border-gray-50">
                      <td className="py-2 pr-3 font-mono text-xs">{o.orderNo}</td>
                      <td className="py-2 pr-3">
                        <Link href={`/admin/users/${o.userId}`} className="text-primary-600 hover:underline">
                          {o.email || `用户#${o.userId}`}
                        </Link>
                      </td>
                      <td className="py-2 pr-3 text-gray-700">{o.productName}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{fmtMoney(o.amount)}</td>
                      <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">{fmtShortTime(o.clickedAt)}</td>
                      <td className="py-2 text-xs text-gray-500 whitespace-nowrap">{fmtShortTime(o.paidAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <MessagesTable campaignId={campaignId} materialized={materialized} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* 时间线 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">操作记录</CardTitle>
          </CardHeader>
          <CardContent>
            {report.timeline.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">暂无记录</p>
            ) : (
              <ol className="relative max-h-[480px] space-y-3 overflow-y-auto border-l border-gray-200 pl-4">
                {report.timeline.map((t, i) => (
                  <li key={`${t.at}-${i}`} className="relative">
                    <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-gray-300" />
                    <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                      <span className="font-medium text-gray-900">{AUDIT_ACTION_LABEL[t.action] || t.action}</span>
                      <span className="text-xs text-gray-400">{fmtTime(t.at)}</span>
                      {t.actor && <span className="text-xs text-gray-400">· {t.actor}</span>}
                    </div>
                    {t.detail && <div className="mt-0.5 break-all text-xs leading-relaxed text-gray-500">{t.detail}</div>}
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* 内容只读预览 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">邮件内容</CardTitle>
            <span className="text-xs text-gray-400">只读 · 已提交的活动内容不能再改</span>
          </CardHeader>
          <CardContent>
            <div className="max-h-[640px] overflow-y-auto rounded-lg border border-gray-100">
              <ContentPreview doc={c.doc} subject={c.subject} preheader={c.preheader} topic={c.topic} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function RateTile({ label, v, digits = 1, hint, warnOver }: { label: string; v: number | null; digits?: number; hint?: string; warnOver?: number }) {
  const warn = warnOver != null && v != null && v > warnOver
  return (
    <div title={hint} className={`rounded-lg border border-gray-200 bg-white px-3 py-2 ${hint ? 'cursor-help' : ''}`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-base font-semibold tabular-nums ${warn ? 'text-red-600' : 'text-gray-800'}`}>{fmtPct(v, digits)}</div>
    </div>
  )
}

/* ============================== 收件人明细 ============================== */

const PAGE_SIZE = 20

function MessagesTable({ campaignId, materialized }: { campaignId: number; materialized: boolean }) {
  const [list, setList] = useState<MessageRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [status, setStatus] = useState<MessageStatus | ''>('')
  const [clickedNoOrder, setClickedNoOrder] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [debounced, setDebounced] = useState('')
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), 350)
    return () => clearTimeout(t)
  }, [keyword])

  const query = useCallback(
    (extra: Record<string, string> = {}) => {
      const q = new URLSearchParams(extra)
      if (status) q.set('status', status)
      if (debounced) q.set('keyword', debounced)
      if (clickedNoOrder) q.set('filter', 'clicked_no_order')
      return q
    },
    [status, debounced, clickedNoOrder]
  )

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    try {
      const q = query({ page: String(page), pageSize: String(PAGE_SIZE) })
      const r = await mktFetch<{ list: MessageRow[]; total: number; totalPages: number }>(
        `/api/admin/marketing/campaigns/${campaignId}/messages?${q}`,
        { signal: ctrl.signal }
      )
      if (abortRef.current !== ctrl) return
      if (r.ok && r.data) {
        setList(r.data.list)
        setTotal(r.data.total)
        setTotalPages(Math.max(1, r.data.totalPages || 1))
        setErr('')
      } else {
        setErr(r.error || '加载失败')
      }
    } catch (e) {
      if (!isAbortError(e)) setErr('加载失败')
    } finally {
      if (abortRef.current === ctrl) setLoading(false)
    }
  }, [campaignId, page, query])

  useEffect(() => {
    load()
  }, [load])
  useEffect(() => () => abortRef.current?.abort(), [])

  const csvHref = `/api/admin/marketing/campaigns/${campaignId}/messages?${query({ format: 'csv' })}`

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
        <CardTitle className="text-base">收件人明细</CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(1)
              }}
              placeholder="搜邮箱 / 昵称"
              className="w-44 rounded-lg border border-gray-300 py-1.5 pl-8 pr-3 text-sm"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as MessageStatus | '')
              setPage(1)
            }}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm"
          >
            <option value="">全部状态</option>
            {MESSAGE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {MESSAGE_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-700" title="点过邮件链接、但归因期内没有付款的人 —— 适合跟进">
            <input
              type="checkbox"
              className="h-3.5 w-3.5"
              checked={clickedNoOrder}
              onChange={(e) => {
                setClickedNoOrder(e.target.checked)
                setPage(1)
              }}
            />
            点了没买
          </label>
          <a
            href={csvHref}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            title="按当前筛选导出 CSV（Excel 可直接打开，最多 2 万行）"
          >
            <Download className="h-3.5 w-3.5" /> 导出 CSV
          </a>
        </div>
      </CardHeader>
      <CardContent>
        {!materialized && total === 0 && !loading ? (
          <p className="py-8 text-center text-sm text-gray-400">到点开始发送时才会生成收件人名单。</p>
        ) : err ? (
          <p className="py-8 text-center text-sm text-red-600">{err}</p>
        ) : loading && list.length === 0 ? (
          <div className="flex justify-center py-8 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">没有符合条件的收件人</p>
        ) : (
          <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500">
                  <th className="pb-2 pr-3">收件人</th>
                  <th className="pb-2 pr-3">状态</th>
                  <th className="pb-2 pr-3 whitespace-nowrap">发送时间</th>
                  <th className="pb-2 pr-3">投递</th>
                  <th className="pb-2 pr-3 whitespace-nowrap">打开</th>
                  <th className="pb-2 pr-3 whitespace-nowrap">点击</th>
                  <th className="pb-2">退订 / 投诉</th>
                </tr>
              </thead>
              <tbody>
                {list.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 align-top">
                    <td className="py-2 pr-3">
                      {m.userId ? (
                        <Link href={`/admin/users/${m.userId}`} className="text-gray-900 hover:text-primary-600 hover:underline">
                          {m.email}
                        </Link>
                      ) : (
                        <span className="text-gray-900">{m.email}</span>
                      )}
                      {m.nickname && <div className="text-xs text-gray-400">{m.nickname}</div>}
                    </td>
                    <td className="py-2 pr-3">
                      <MessageStatusBadge status={m.status} />
                      {m.skipReason && <div className="mt-0.5 text-xs text-gray-500">{SKIP_REASON_LABEL[m.skipReason] || m.skipReason}</div>}
                      {m.errorCode && (
                        <div className="mt-0.5 max-w-[180px] truncate font-mono text-[11px] text-red-500" title={m.errorCode}>
                          {m.errorCode}
                        </div>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">{fmtShortTime(m.sentAt)}</td>
                    <td className="py-2 pr-3 text-xs">
                      {m.delivery ? (
                        <span className={DELIVERY_CLS[m.delivery]} title={m.deliveryDetail || undefined}>
                          {DELIVERY_LABEL[m.delivery] || m.delivery}
                        </span>
                      ) : m.status === 'SENT' ? (
                        <span className="text-gray-400">等待回执</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                      {m.deliveryDetail && m.delivery !== 'DELIVERED' && (
                        <div className="mt-0.5 max-w-[200px] truncate text-[11px] text-gray-400" title={m.deliveryDetail}>
                          {m.deliveryDetail}
                        </div>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">{m.openedAt ? fmtShortTime(m.openedAt) : '—'}</td>
                    <td className="py-2 pr-3 text-xs whitespace-nowrap">
                      {m.clickedAt ? (
                        <span className="text-primary-700">
                          {fmtShortTime(m.clickedAt)}
                          {m.clickCount > 1 && <span className="ml-1 text-gray-400">×{m.clickCount}</span>}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-2 text-xs">
                      {m.complainedAt ? (
                        <span className="text-red-600">投诉 {fmtShortTime(m.complainedAt)}</span>
                      ) : m.unsubscribedAt ? (
                        <span className="text-amber-600">退订 {fmtShortTime(m.unsubscribedAt)}</span>
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

        {total > 0 && (
          <div className="flex items-center justify-between pt-3">
            <span className="text-xs text-gray-500">
              共 {fmtInt(total)} 条 · 第 {page} / {totalPages} 页
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                上一页
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                下一页
              </Button>
            </div>
          </div>
        )}
        <p className="mt-2 text-xs text-gray-400">
          时间均为北京时间。「等待回执」：已交给阿里云，投递结果一般几分钟到几小时内同步回来。
        </p>
      </CardContent>
    </Card>
  )
}
