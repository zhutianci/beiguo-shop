'use client'

import { AlertTriangle, CalendarClock, CheckCircle2, Ticket, Users, XCircle } from 'lucide-react'
import { SKIP_REASON_LABEL, type CheckResult, type LintIssue, type SkipReason } from '@/lib/marketing/types'
import { addBjDays, bjDateKey } from '@/lib/marketing/time'
import { fmtInt, fmtMoney, fmtTime } from './api'
import { BLOCKED_BY_LABEL } from './labels'

/** 检查问题列表：错误在前（红，阻断发送），警告在后（黄，只提示） */
export function IssueList({ issues, max }: { issues: LintIssue[]; max?: number }) {
  const sorted = [...issues].sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1))
  const shown = max ? sorted.slice(0, max) : sorted
  if (issues.length === 0) return null
  return (
    <ul className="space-y-1.5">
      {shown.map((i, idx) => (
        <li
          key={`${i.code}-${i.blockId || ''}-${idx}`}
          className={`flex gap-2 rounded-md px-3 py-1.5 text-sm leading-relaxed ${
            i.level === 'error' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'
          }`}
        >
          {i.level === 'error' ? (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          )}
          <span className="min-w-0">
            {i.message}
            {i.blockId && <span className="ml-1.5 rounded bg-white/70 px-1 font-mono text-[10px] text-gray-500">区块 {i.blockId}</span>}
          </span>
        </li>
      ))}
      {max && sorted.length > max && <li className="px-3 text-xs text-gray-400">…还有 {sorted.length - max} 条</li>}
    </ul>
  )
}

export function issueCounts(issues: LintIssue[]) {
  let errors = 0
  let warns = 0
  for (const i of issues) {
    if (i.level === 'error') errors++
    else warns++
  }
  return { errors, warns }
}

/**
 * 检查结果（第 ③ 步与「发送」弹窗共用）：问题、受众、预计进度、券让利。
 * 「预计完成时间」是站长决定「今天发还是定时」的依据，所以每天发多少、被什么限住都要摊开给他看。
 */
export function CheckResultView({ check, compact = false }: { check: CheckResult; compact?: boolean }) {
  const { errors, warns } = issueCounts(check.issues)
  const excluded = (Object.entries(check.audience.excluded) as [SkipReason, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
  const eta = check.eta
  const days = eta.perDay.filter((d) => d.count > 0)

  return (
    <div className="space-y-4">
      {!compact && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
            check.canLaunch ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {check.canLaunch ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-red-500" />}
          {check.canLaunch
            ? `检查通过，可以发送${warns ? `（有 ${warns} 条提示，建议看一眼）` : ''}`
            : `还有 ${errors} 个问题要先解决${warns ? `，另有 ${warns} 条提示` : ''}`}
        </div>
      )}

      {check.issues.length > 0 && <IssueList issues={check.issues} />}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <Users className="h-3.5 w-3.5" /> 收件人
          </div>
          <div className="text-2xl font-semibold tabular-nums text-gray-900">
            {fmtInt(check.audience.eligible)}
            <span className="ml-1 text-sm font-normal text-gray-500">人可发</span>
          </div>
          <div className="text-xs text-gray-500">命中 {fmtInt(check.audience.matched)} 人</div>
          {excluded.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs text-gray-600">
              {excluded.map(([k, n]) => (
                <li key={k} className="flex justify-between gap-2">
                  <span>{SKIP_REASON_LABEL[k] || k}</span>
                  <span className="tabular-nums">{fmtInt(n)}</span>
                </li>
              ))}
            </ul>
          )}
          {check.audience.freqCapEstimate > 0 && (
            <p className="mt-2 text-xs text-amber-700">约 {fmtInt(check.audience.freqCapEstimate)} 人可能因频率上限被跳过或推迟</p>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <CalendarClock className="h-3.5 w-3.5" /> 预计进度（北京时间）
          </div>
          <div className="space-y-0.5 text-sm text-gray-700">
            <div>
              开始：<span className="font-medium text-gray-900">{fmtTime(eta.startAt)}</span>
            </div>
            <div>
              完成：<span className="font-medium text-gray-900">{eta.finishAt ? fmtTime(eta.finishAt) : '—'}</span>
              {days.length > 1 && <span className="ml-1 text-xs text-amber-700">（要分 {days.length} 天发完）</span>}
            </div>
          </div>
          {days.length > 0 && (
            <div className="mt-2 max-h-36 overflow-y-auto">
              <table className="w-full text-xs">
                <tbody>
                  {days.map((d) => (
                    <tr key={d.date} className="border-b border-gray-50">
                      <td className="py-0.5 text-gray-500">{dayLabel(d.date)}</td>
                      <td className="py-0.5 text-right tabular-nums text-gray-800">{fmtInt(d.count)} 封</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {eta.blockedBy.length > 0 && (
            <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
              <div className="text-xs text-gray-500">主要受限于：</div>
              {eta.blockedBy.map((b) => (
                <div key={b} className="text-xs leading-relaxed text-gray-600">
                  · {BLOCKED_BY_LABEL[b] || b}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {check.coupon && (
        <div className="flex items-start gap-2 rounded-lg border border-pink-200 bg-pink-50 px-3 py-2.5 text-sm text-pink-900">
          <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-pink-600" />
          <div>
            <div className="font-medium">
              直发优惠券：最多发出 {fmtInt(check.coupon.maxCount)} 张 · 最高让利 {fmtMoney(check.coupon.maxGiveaway)}
            </div>
            <div className="mt-0.5 text-xs text-pink-700">
              每位收件人发信前自动放一张到账户；信没发成功券也保留（宁可多送一张，不可「邮件说有券却没有」）。
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** 「今天 / 明天 / 10-07」 */
function dayLabel(date: string): string {
  const todayKey = bjDateKey()
  if (date === todayKey) return `今天 ${date.slice(5)}`
  if (date === addBjDays(todayKey, 1)) return `明天 ${date.slice(5)}`
  return date.slice(5)
}
