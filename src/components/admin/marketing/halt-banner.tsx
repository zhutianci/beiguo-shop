'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, FlaskConical, PauseOctagon, PowerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { HaltState } from '@/lib/marketing/types'
import { fmtTime, mktFetch } from './api'

/**
 * 营销模块的全局状态横幅：总开关关闭 / 全局急停 / 演示模式（dry-run）。
 *
 * 这三种状态下活动「看起来在发送中却一封没出去」，站长如果不知道就会以为系统坏了、去反复点暂停继续。
 * 所以活动列表、发送设置页顶部都挂这条横幅。
 */
export function HaltBanner({
  enabled,
  halt,
  dryRun,
  onChanged,
  showSettingsLink = true,
}: {
  enabled: boolean
  halt: (HaltState & { active: boolean }) | null
  dryRun: boolean
  onChanged?: () => void
  showSettingsLink?: boolean
}) {
  const [busy, setBusy] = useState(false)

  const clearHalt = async () => {
    if (!halt) return
    const ok = confirm(
      `确定解除全局急停？\n\n急停原因：${halt.reason || '（未记录）'}\n\n` +
        '解除后，排队中的活动会在下一分钟起继续发送。\n' +
        '请先确认已经处理了导致急停的问题（额度、账号状态、投诉、发信地址配置等），否则很可能马上再次触发，' +
        '反复触发会拖累发信信誉。'
    )
    if (!ok) return
    setBusy(true)
    try {
      const r = await mktFetch('/api/admin/marketing/config', { method: 'PUT', body: { action: 'clearHalt' } })
      if (!r.ok) {
        alert(r.error || '解除失败')
        return
      }
      onChanged?.()
    } finally {
      setBusy(false)
    }
  }

  if (enabled && !halt?.active && !dryRun) return null

  return (
    <div className="space-y-2">
      {halt?.active && (
        <div className="flex flex-wrap items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <PauseOctagon className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="min-w-0 flex-1 leading-relaxed">
            <div className="font-semibold">全局急停中：所有营销邮件暂停发送</div>
            <div className="mt-0.5">
              原因：{halt.reason || '（未记录）'}
              {halt.until && <span className="ml-2 text-red-600">自动恢复时间：{fmtTime(halt.until)}（北京时间）</span>}
              {halt.at && <span className="ml-2 text-red-500">触发于 {fmtTime(halt.at)}</span>}
            </div>
            <div className="mt-0.5 text-xs text-red-600">
              急停由系统在发现风险时自动触发（额度用尽、账号异常、连续结果未知、投诉/无效率超标等）。排队中的邮件都保留，解除后接着发。
            </div>
          </div>
          <Button size="sm" variant="danger" loading={busy} onClick={clearHalt}>
            解除急停
          </Button>
        </div>
      )}
      {!enabled && (
        <div className="flex flex-wrap items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <PowerOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1 leading-relaxed">
            <div className="font-semibold">营销发送总开关已关闭</div>
            <div className="mt-0.5">
              所有活动都不会发出（排队保留）。可以照常编辑、测试发送、提交发送，打开开关后才会真正开始发。
            </div>
          </div>
          {showSettingsLink && (
            <Link href="/admin/marketing/settings" className="shrink-0 text-sm font-medium text-amber-700 hover:underline">
              去发送设置 →
            </Link>
          )}
        </div>
      )}
      {dryRun && (
        <div className="flex items-start gap-3 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
          <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
          <div className="leading-relaxed">
            <span className="font-semibold">演示模式（MARKETING_DRY_RUN）：</span>
            不会调用阿里云、不会真的发出任何邮件，流程与统计照常走（返回假的投递编号）。只应出现在本地或预发环境 ——
            <span className="font-semibold">如果你在正式站看到这条，请立刻检查部署配置。</span>
          </div>
        </div>
      )}
    </div>
  )
}

/** 小号告警条（页面内复用） */
export function WarnNote({ children, tone = 'amber' }: { children: React.ReactNode; tone?: 'amber' | 'red' | 'sky' }) {
  const cls =
    tone === 'red'
      ? 'border-red-200 bg-red-50 text-red-700'
      : tone === 'sky'
        ? 'border-sky-200 bg-sky-50 text-sky-800'
        : 'border-amber-200 bg-amber-50 text-amber-800'
  return (
    <div className={`flex gap-2 rounded-lg border px-3 py-2 text-xs leading-relaxed ${cls}`}>
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
