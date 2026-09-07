'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Loader2 } from 'lucide-react'
import { AI_BADGE } from '@/lib/news/constants'
import {
  dayKey,
  formatDayHeading,
  sourceLabel,
  type NewsEventDto,
} from '@/lib/news/format'

/**
 * 归档页的列表与「加载更多」。
 *
 * 首屏由 Server Component 直出（SEO + 首屏速度），这里只接管翻页。
 * 刻意不复用 /news 的 NewsStream：那个组件带着分类切换、已读标记、重点层、
 * sticky 日期头一整套时间流逻辑，归档页一个都不需要，塞进去只会让两边互相牵制。
 *
 * 性能红线与时间流一致：卡片不带 backdrop-blur（低端安卓上 20+ 个 blur 层会把滚动帧率打到个位数）。
 */
export function ArchiveList({
  initial,
  month,
  total,
}: {
  initial: NewsEventDto[]
  month: string
  total: number
}) {
  const [list, setList] = useState<NewsEventDto[]>(initial)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  /** 接口已经不再返回新条目 —— 比 list.length < total 更可靠的收尾判据 */
  const [drained, setDrained] = useState(false)

  const hasMore = !drained && list.length < total

  const loadMore = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const q = new URLSearchParams({ page: String(page + 1), month, sort: 'score' })
      const res = await fetch(`/api/news/list?${q}`)
      const data = await res.json()
      if (data.success) {
        const incoming: NewsEventDto[] = data.data.list || []
        setList((prev) => {
          // 按 id 去重。首屏页大小与接口页大小理论上已经对齐，但这层兜底不能省：
          // 一旦哪天有人只改了一边，症状是「静默重复渲染 + 尾部条目永远拿不到」，
          // 不报错、不进日志，只能靠肉眼在页面上发现。这里去重后最坏也只是少几条。
          const seen = new Set(prev.map((e) => e.id))
          return [...prev, ...incoming.filter((e) => !seen.has(e.id))]
        })
        // 接口给不出新条目就收尾，不要再靠计数猜
        if (incoming.length === 0) setDrained(true)
        setPage((p) => p + 1)
      } else {
        setFailed(true)
      }
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [page, month])

  return (
    <>
      <ol className="space-y-2.5 lg:space-y-3">
        {list.map((ev, i) => (
          <li key={ev.id}>
            <Link
              href={`/news/${ev.slug}`}
              className="group flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 transition-colors hover:border-white/20 hover:bg-white/[0.07] lg:gap-4 lg:px-5 lg:py-4"
            >
              <span className="mt-1 shrink-0 font-mono text-[11px] tabular-nums text-white/25 lg:text-xs">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <h2 className="text-balance text-[15px] font-medium leading-snug text-white/85 group-hover:text-white lg:text-[17px]">
                    {ev.headline}
                  </h2>
                  {/* AI 标识第 1 处：列表卡片徽章。归档页也是列表页，同样要有 */}
                  <span className="shrink-0 rounded-full bg-purple-500/12 px-1.5 py-0.5 text-[10px] text-purple-200/80">
                    {AI_BADGE}
                  </span>
                </span>
                <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-white/45 lg:text-sm">
                  {ev.summary}
                </p>
                <span className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] tabular-nums text-white/30 lg:text-xs">
                  <span>{formatDayHeading(dayKey(ev.happenedAt))}</span>
                  <span>·</span>
                  <span>{sourceLabel(ev.sources, ev.sourceCount)}</span>
                  <span>·</span>
                  <span>AI {ev.aiScore}</span>
                  {ev.backfilled && (
                    <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-white/35" title="事件发生较早，摘要是后来补写的">
                      补录
                    </span>
                  )}
                  {ev.needsReview && (
                    <span className="rounded-full border border-white/10 px-1.5 py-0.5 text-white/30">待复核</span>
                  )}
                </span>
              </span>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-white/50" />
            </Link>
          </li>
        ))}
      </ol>

      {failed && (
        <p className="mt-4 text-center text-sm text-white/40">
          加载失败，
          <button onClick={loadMore} className="text-purple-300/80 underline underline-offset-2">
            重试
          </button>
        </p>
      )}

      {hasMore ? (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/[0.09] disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            加载更多（还有 {Math.max(0, total - list.length)} 条）
          </button>
        </div>
      ) : (
        <p className="mt-6 text-center text-[13px] text-white/30">
          本月共 {total} 条，已列出 {list.length} 条
        </p>
      )}
    </>
  )
}
