'use client'

/**
 * 后台：定时放量队列（内容扩容 10-07，lib/content/release.ts）。显示队列里还有多少、今天放了几条 / 每天上限，
 * 可以「立即放出 N 条」（不看每天上限，但计入今天的条数）。每天上限改 .env.production 的 CONTENT_RELEASE_PER_DAY（0 = 暂停）后重启 app。
 */
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CONTENT_TYPE_LABELS, type ContentType } from '@/lib/content/policy'

interface Stats {
  perDay: number
  releasedToday: number
  scheduled: number
  byType: Record<string, number>
}

export function ContentReleaseCard({ onShowQueue, onReleased }: { onShowQueue: () => void; onReleased: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [count, setCount] = useState('20')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/content/release')
      const d = await res.json()
      if (d.success) setStats(d.data)
    } catch {
      /* 卡片加载失败不影响页面其他部分 */
    }
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const release = async () => {
    const n = parseInt(count, 10)
    if (!Number.isInteger(n) || n < 1) return alert('请输入要放出的条数')
    if (!confirm(`立即公开定时队列里接下来的 ${n} 条？（计入今天的放量条数）`)) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/content/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: n }),
      })
      const d = await res.json()
      alert(d.success ? d.message : d.error || '放量失败')
      load()
      onReleased()
    } finally {
      setBusy(false)
    }
  }

  if (!stats) return null
  const parts = Object.entries(stats.byType)
    .map(([t, n]) => `${CONTENT_TYPE_LABELS[t as ContentType] ?? t} ${n}`)
    .join(' · ')
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4 text-sm text-gray-700">
      <div className="space-y-1">
        <div>
          定时发布队列：
          <button type="button" onClick={onShowQueue} className="font-semibold text-sky-700 hover:underline">
            {stats.scheduled} 条
          </button>
          {parts && <span className="ml-2 text-gray-500">（{parts}）</span>}
        </div>
        <div className="text-xs text-gray-500">
          {stats.perDay === 0 ? '每天自动放量已暂停（CONTENT_RELEASE_PER_DAY=0）' : `每天 10:00 自动放出，上限 ${stats.perDay} 条`}；今天已放出 {stats.releasedToday} 条
          {stats.perDay > 0 && stats.scheduled > 0 && `，按当前速度约 ${Math.ceil(stats.scheduled / stats.perDay)} 天放完`}
        </div>
      </div>
      {stats.scheduled > 0 && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={200}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
            aria-label="放出条数"
          />
          <Button size="sm" variant="outline" onClick={release} loading={busy}>
            立即放出
          </Button>
        </div>
      )}
    </div>
  )
}
