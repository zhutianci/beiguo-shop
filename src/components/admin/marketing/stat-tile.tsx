'use client'

import { cn } from '@/lib/utils'

type Tone = 'default' | 'good' | 'warn' | 'bad' | 'muted' | 'brand'

const TONE_CLS: Record<Tone, string> = {
  default: 'text-gray-900',
  good: 'text-emerald-600',
  warn: 'text-amber-600',
  bad: 'text-red-600',
  muted: 'text-gray-400',
  brand: 'text-primary-700',
}

/**
 * 数字小卡片。hint 放在 title 上（悬停看口径），sub 是卡片内的第二行小字。
 * 统计口径必须能在界面上查到 —— 「打开」「点击」这类数字不讲清楚口径，站长会拿它和别的平台硬比。
 */
export function StatTile({
  label,
  value,
  sub,
  hint,
  tone = 'default',
  className,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  hint?: string
  tone?: Tone
  className?: string
}) {
  return (
    <div
      title={hint}
      className={cn('min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2.5', hint && 'cursor-help', className)}
    >
      <div className="truncate text-xs text-gray-500">{label}</div>
      <div className={cn('mt-0.5 truncate text-xl font-semibold tabular-nums', TONE_CLS[tone])}>{value}</div>
      {sub != null && <div className="mt-0.5 truncate text-xs text-gray-400">{sub}</div>}
    </div>
  )
}

/** 细进度条（0–100） */
export function ProgressBar({ percent, className, tone = 'brand' }: { percent: number; className?: string; tone?: 'brand' | 'good' | 'warn' }) {
  const p = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0))
  const bar = tone === 'good' ? 'bg-emerald-500' : tone === 'warn' ? 'bg-amber-500' : 'bg-primary-500'
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-gray-100', className)}>
      <div className={cn('h-full rounded-full transition-[width] duration-500', bar)} style={{ width: `${p}%` }} />
    </div>
  )
}
