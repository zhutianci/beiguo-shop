'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Flame } from 'lucide-react'
import { AI_BADGE } from '@/lib/news/constants'
import { relativeTime, sourceLabel, type NewsEventDto } from '@/lib/news/format'

/**
 * 首页「AI 圈今日热点」区块。
 *
 * 两条硬性约束：
 * 1. 固定高度 skeleton 占位——首页是卖货主线，热点区抖一下会把「精选服务」挤走，是实打实的 CLS 事故。
 * 2. 请求失败 / 无内容整块 return null 静默降级——新闻挂了绝不能影响卖货。
 */

const LIMIT = 5
// 行高写死，skeleton 与真实行严格一致，加载完成前后高度不变
const ROW_H = 'h-[84px]'

export function NewsHotSection() {
  const [items, setItems] = useState<NewsEventDto[] | null>(null)
  const [dead, setDead] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    abortRef.current = ac
    fetch(`/api/news/hot?limit=${LIMIT}`, { signal: ac.signal })
      .then((r) => r.json())
      .then((data) => {
        if (ac.signal.aborted) return
        const list: NewsEventDto[] = data?.success ? data.data?.list || [] : []
        if (!data?.success || list.length === 0) setDead(true)
        else setItems(list)
      })
      .catch((e) => {
        if ((e as Error).name === 'AbortError') return
        setDead(true)
      })
    return () => ac.abort()
  }, [])

  if (dead) return null

  return (
    <section className="relative py-24">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute right-1/4 top-10 h-[300px] w-[420px] rounded-full bg-purple-500/10 blur-[128px]" />

      <div className="container relative z-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs text-white/65">公开信源聚合 · AI 自动整理</span>
            </div>
            <h2 className="text-headline">
              <span className="gradient-text">AI 圈今日热点</span>
            </h2>
          </div>
          <Link
            href="/news"
            className="group inline-flex shrink-0 items-center gap-1 text-sm text-white/50 transition-colors hover:text-white"
          >
            查看全部
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          {items === null
            ? Array.from({ length: LIMIT }, (_, i) => (
                <div
                  key={i}
                  className={`${ROW_H} flex items-center gap-4 border-b border-white/[0.06] px-4 last:border-b-0 sm:px-6`}
                >
                  <div className="h-4 w-6 shrink-0 animate-pulse rounded bg-white/[0.06]" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.06]" />
                    <div className="h-3 w-1/3 animate-pulse rounded bg-white/[0.04]" />
                  </div>
                </div>
              ))
            : items.map((ev, i) => (
                <Link
                  key={ev.id}
                  href={`/news/${ev.slug}`}
                  className={`${ROW_H} group flex items-center gap-4 border-b border-white/[0.06] px-4 transition-colors last:border-b-0 hover:bg-white/[0.05] sm:px-6`}
                >
                  <span
                    className={`shrink-0 font-mono text-sm tabular-nums ${
                      i === 0 ? 'text-amber-300/80' : 'text-white/25'
                    }`}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-balance text-[15px] font-medium leading-snug text-white/85 transition-colors group-hover:text-white">
                      {ev.headline}
                    </span>
                    <span className="mt-1 flex items-center gap-2 text-[11px] text-white/30">
                      <span className="truncate">{sourceLabel(ev.sources, ev.sourceCount)}</span>
                      <span>·</span>
                      <span className="shrink-0 tabular-nums">{relativeTime(ev.happenedAt)}</span>
                      <span className="hidden shrink-0 sm:inline">·</span>
                      <span className="hidden shrink-0 tabular-nums sm:inline">AI 评分 {ev.aiScore}</span>
                    </span>
                  </span>
                  {/* AI 标识：列表位徽章 */}
                  <span className="hidden shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/30 sm:inline">
                    {AI_BADGE}
                  </span>
                </Link>
              ))}
        </div>
      </div>
    </section>
  )
}
