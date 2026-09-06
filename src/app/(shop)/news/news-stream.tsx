'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, Flame, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AI_BADGE } from '@/lib/news/constants'
import { loadReadIds, saveReadIds } from '@/lib/news/read-state'
import {
  CATEGORY_CHIPS,
  dayKey,
  dayRelativeTag,
  formatClock,
  formatDayHeading,
  relativeTime,
  sourceLabel,
  type NewsEventDto,
} from '@/lib/news/format'

/**
 * 时间流 + 重点层。首屏由 Server Component 直出（SEO 与首屏速度），
 * 这里只接管三件必须在客户端做的事：切分类、加载更多、已读标记。
 *
 * 性能红线：列表卡片一律 bg-white/[0.04] + border，**不带 backdrop-blur**。
 * 低端安卓 X5 内核上 20+ 个 blur 层会把滚动帧率打到个位数。
 * 全页只有 sticky 日期头这一处允许 blur。
 */

interface Props {
  initial: NewsEventDto[]
  initialTotalPages: number
  total: number
  /**
   * 服务端渲染时刻。「3 小时前」「今天」这类相对文案必须用同一个基准，
   * 否则服务端 HTML 与客户端 hydration 结果会差一个分钟桶，React 会报 hydration 不匹配。
   */
  now: string
  highlights: {
    today: NewsEventDto[]
    week: NewsEventDto[]
    /** 今日无重点时回退到最近 72 小时，前端据此文案化说明，而不是渲染空列表 */
    fallbackRange: string | null
  }
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function NewsStream({ initial, initialTotalPages, total, now, highlights }: Props) {
  const router = useRouter()
  const nowDate = useMemo(() => new Date(now), [now])
  const [list, setList] = useState<NewsEventDto[]>(initial)
  const [cat, setCat] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [count, setCount] = useState(total)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [failed, setFailed] = useState(false)
  const [readIds, setReadIds] = useState<Set<number>>(new Set())
  const [focusId, setFocusId] = useState<number | null>(null)
  const [rail, setRail] = useState<'today' | 'week'>('today')

  const abortRef = useRef<AbortController | null>(null)
  const pendingFocusRef = useRef<NewsEventDto | null>(null)
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 已读集合只在挂载后注入，保证服务端直出的 HTML 与首次客户端渲染一致
  useEffect(() => {
    setReadIds(new Set(loadReadIds()))
  }, [])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    }
  }, [])

  const markRead = useCallback((id: number) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      saveReadIds(Array.from(next))
      return next
    })
  }, [])

  const load = useCallback(async (nextCat: string, nextPage: number, append: boolean) => {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    if (append) setLoadingMore(true)
    else setLoading(true)
    setFailed(false)
    try {
      const q = new URLSearchParams({ page: String(nextPage) })
      if (nextCat) q.set('cat', nextCat)
      const res = await fetch(`/api/news/list?${q}`, { signal: ac.signal })
      const data = await res.json()
      if (ac.signal.aborted) return
      if (data.success) {
        const d = data.data
        setList((prev) => (append ? [...prev, ...d.list] : d.list))
        setPage(d.page)
        setTotalPages(d.totalPages || 1)
        setCount(d.total ?? 0)
      } else {
        setFailed(true)
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      setFailed(true)
    } finally {
      if (!ac.signal.aborted) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [])

  const switchCat = (next: string) => {
    if (next === cat || loading) return
    setCat(next)
    load(next, 1, false)
  }

  // 重点条 → 滚动定位到时间流里对应条目并高亮
  const scrollToEvent = useCallback((ev: NewsEventDto) => {
    const el = document.getElementById(`ev-${ev.id}`)
    if (!el) return false
    el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
    setFocusId(ev.id)
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setFocusId(null), 2400)
    return true
  }, [])

  const openHighlight = (ev: NewsEventDto) => {
    if (scrollToEvent(ev)) return
    // 当前正筛着某个分类，条目被过滤掉了：先回到「全部」再定位
    if (cat) {
      pendingFocusRef.current = ev
      setCat('')
      load('', 1, false)
      return
    }
    // 不在已加载的页里（多半是几天前的周榜条目）：直接进详情页，比连翻几页更快
    router.push(`/news/${ev.slug}`)
  }

  // 切回全部后列表已就位，再尝试定位；仍找不到就退到详情页
  useEffect(() => {
    const ev = pendingFocusRef.current
    if (!ev || loading) return
    pendingFocusRef.current = null
    const raf = requestAnimationFrame(() => {
      if (!scrollToEvent(ev)) router.push(`/news/${ev.slug}`)
    })
    return () => cancelAnimationFrame(raf)
  }, [list, loading, router, scrollToEvent])

  // 按天分组。列表已按 happenedAt 倒序，Map 的插入顺序即展示顺序
  const groups = useMemo(() => {
    const map = new Map<string, NewsEventDto[]>()
    for (const ev of list) {
      const key = dayKey(ev.happenedAt)
      const bucket = map.get(key)
      if (bucket) bucket.push(ev)
      else map.set(key, [ev])
    }
    return Array.from(map, ([key, items]) => ({ key, items }))
  }, [list])

  const railItems = rail === 'today' ? highlights.today : highlights.week
  const hasRail = highlights.today.length > 0 || highlights.week.length > 0

  return (
    <>
      {/* ============ 重点层：时间流之上的高亮，不是另一个割裂的列表 ============ */}
      {hasRail && (
        <section className="mb-10 lg:mb-14">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 lg:mb-4">
            <div className="flex items-center gap-3">
              <h2 className="flex items-center gap-1.5 text-base font-semibold text-white/90 lg:text-lg">
                <Flame className="h-4 w-4 text-amber-400" />
                重点
              </h2>
              <div className="flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.04] p-0.5">
                {(
                  [
                    { id: 'today', label: '今日' },
                    { id: 'week', label: '本周' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setRail(t.id)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                      rail === t.id ? 'bg-white text-black' : 'text-white/50 hover:text-white/80'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            {rail === 'today' && highlights.fallbackRange && (
              <span className="text-xs text-white/35">今日暂无重点，展示最近三天</span>
            )}
          </div>

          {railItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/35">
              {rail === 'today' ? '今日还没有够格进重点的条目' : '本周还没有够格进重点的条目'}
            </div>
          ) : (
            /*
              横滑只是移动端的空间妥协：md 起屏幕放得下，就该平铺成网格，
              否则桌面端用户既看不出还有内容在右边、又没有触摸可以滑。
              `!` 是必需的——.news-rail 的 display:flex / overflow-x:auto 写在 globals.css
              里 @tailwind utilities 之后，同优先级下按源码顺序会压过 md:grid。
            */
            <div className="news-rail -mx-6 flex gap-3 px-6 pb-2 sm:mx-0 sm:px-0 md:!grid md:grid-cols-2 md:!overflow-visible md:pb-0 lg:grid-cols-3 lg:gap-4">
              {railItems.map((ev, i) => (
                <button
                  key={ev.id}
                  onClick={() => openHighlight(ev)}
                  className="news-in group w-[264px] shrink-0 snap-start rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition-colors hover:border-white/20 hover:bg-white/[0.07] sm:w-[300px] md:w-auto lg:p-5"
                  style={{ animationDelay: `${Math.min(i, 6) * 45}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] tabular-nums text-white/25">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <ScorePill score={ev.aiScore} compact />
                  </div>
                  <h3 className="mt-2 line-clamp-3 text-balance text-sm font-semibold leading-snug text-white/90 lg:text-[15px]">
                    {ev.headline}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-white/45 lg:text-[13px]">
                    {ev.whyItMatters || ev.summary}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-white/30 lg:text-[12px]">
                    <span className="truncate">{sourceLabel(ev.sources, ev.sourceCount)}</span>
                    <span>·</span>
                    <span className="shrink-0 tabular-nums">{relativeTime(ev.happenedAt, nowDate)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ============ 分类芯片 ============ */}
      {/* sm 起已经换行平铺；桌面端只需把间距和字号放开一档，避免一排小胶囊挤在一起 */}
      <div className="news-rail -mx-6 mb-6 flex gap-2 px-6 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 lg:mb-8 lg:gap-2.5">
        {CATEGORY_CHIPS.map((c) => (
          <button
            key={c.slug || 'all'}
            onClick={() => switchCat(c.slug)}
            title={c.hint || undefined}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors lg:px-5 lg:py-2 lg:text-[15px]',
              cat === c.slug
                ? 'bg-white text-black'
                : 'border border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.08] hover:text-white/85'
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* ============ 时间流 ============ */}
      {loading ? (
        // 骨架屏跟真实列表用同一套栅格，切分类时才不会先单列闪一下再变两列
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[172px] animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      ) : failed ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-10 text-center">
          <p className="text-sm text-white/50">内容加载失败</p>
          <button
            onClick={() => load(cat, 1, false)}
            className="mt-3 rounded-full border border-white/15 px-4 py-1.5 text-sm text-white/70 transition-colors hover:bg-white/10"
          >
            重试
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center">
          <p className="text-sm text-white/45">这个分类下还没有整理好的条目</p>
          {cat && (
            <button
              onClick={() => switchCat('')}
              className="mt-3 text-sm text-purple-300 transition-colors hover:text-purple-200"
            >
              看全部动态
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8 lg:space-y-12">
          {groups.map((group) => {
            const tag = dayRelativeTag(group.key, nowDate)
            return (
              <section key={group.key}>
                {/* 全页唯一允许 backdrop-blur 的地方。
                    lg 起吸顶位置下移到 96px：滚动后的固定头部在 lg 上高 88px（py-3 + 64px 药丸），
                    仍用 72px 的话日期胶囊会有一截压在头部底下（头部 z-50 盖住它）。 */}
                <div className="sticky top-[72px] z-20 -mx-1 mb-3 px-1 py-1 lg:top-24 lg:mb-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3.5 py-1.5 backdrop-blur-md lg:px-4 lg:py-2">
                    <h2 className="text-sm font-semibold tracking-wide text-white/90 lg:text-[15px]">
                      {formatDayHeading(group.key)}
                    </h2>
                    <span className="text-xs tabular-nums text-white/35 lg:text-[13px]">· {group.items.length} 条</span>
                    {tag && (
                      <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[11px] text-purple-200/90">
                        {tag}
                      </span>
                    )}
                  </div>
                </div>

                {/*
                  lg 起同一天的条目改成两列：容器已放宽到 1024/1152px，
                  再单列的话每条摘要会拉到 70+ 个汉字/行，既难读又浪费右半屏。
                  两列后单列宽度回到 ~520px（≈35 字/行），仍在舒适区。
                  space-y 与 grid 会重复叠加间距，所以 lg 下要把 space-y 归零。
                */}
                <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                  {group.items.map((ev, i) => (
                    <EventCard
                      key={ev.id}
                      ev={ev}
                      index={i}
                      read={readIds.has(ev.id)}
                      focused={focusId === ev.id}
                      onOpen={() => markRead(ev.id)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      {/* ============ 加载更多（追加式） ============ */}
      {!loading && !failed && list.length > 0 && (
        <div className="mt-8 flex flex-col items-center gap-2 lg:mt-12">
          {page < totalPages ? (
            <button
              onClick={() => load(cat, page + 1, true)}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.09] disabled:opacity-50 lg:px-8 lg:py-3 lg:text-[15px]"
            >
              {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
              {loadingMore ? '加载中...' : '加载更多'}
            </button>
          ) : (
            <span className="text-xs text-white/25">到底了，共 {count} 条</span>
          )}
        </div>
      )}
    </>
  )
}

/** AI 评分：把模型判断透明化展示，不藏在后台 */
function ScorePill({ score, compact = false }: { score: number; compact?: boolean }) {
  const tone =
    score >= 80
      ? 'text-amber-300/90 border-amber-400/25 bg-amber-400/10'
      : score >= 60
        ? 'text-purple-200/90 border-purple-400/25 bg-purple-400/10'
        : 'text-white/45 border-white/10 bg-white/[0.04]'
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', tone)}
      title="AI 对这条重要性的判断"
    >
      <span className={compact ? 'hidden' : 'text-[10px] opacity-70'}>AI 评分</span>
      <span className="tabular-nums">{score}</span>
      <span className="text-[10px] opacity-50">/100</span>
    </span>
  )
}

function EventCard({
  ev,
  index,
  read,
  focused,
  onOpen,
}: {
  ev: NewsEventDto
  index: number
  read: boolean
  focused: boolean
  onOpen: () => void
}) {
  return (
    <article
      id={`ev-${ev.id}`}
      style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
      className={cn(
        'news-in group scroll-mt-28 rounded-2xl border bg-white/[0.04] transition-colors',
        focused ? 'news-flash border-purple-400/50' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
      )}
    >
      {/* 桌面端卡片内边距与字号整体上一档：手机上的紧凑排版在 1440px 上会显得又小又挤 */}
      <Link href={`/news/${ev.slug}`} onClick={onOpen} className="block p-4 sm:p-5 lg:p-6">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[12px] text-white/40 lg:gap-x-3 lg:text-[13px]">
          <time dateTime={ev.happenedAt} className="tabular-nums text-white/55">
            {formatClock(ev.happenedAt)}
          </time>
          <span className="h-3 w-px bg-white/12" />
          <span className="max-w-[45%] truncate text-white/55">{sourceLabel(ev.sources, ev.sourceCount)}</span>
          <span className="h-3 w-px bg-white/12" />
          <span className="text-white/45">{ev.categoryLabel}</span>
          <ScorePill score={ev.aiScore} />
          {ev.needsReview && (
            <span
              className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/35"
              title="尚未人工复核，请以原文为准"
            >
              待复核
            </span>
          )}
        </div>

        <h3
          className={cn(
            'mt-2 text-balance text-[17px] font-semibold leading-snug transition-colors sm:text-lg lg:mt-2.5 lg:text-[19px]',
            read ? 'text-white/50' : 'text-white'
          )}
        >
          {ev.headline}
        </h3>

        <p
          className={cn(
            'mt-1.5 line-clamp-3 text-sm leading-relaxed lg:mt-2 lg:text-[15px] lg:leading-[1.75]',
            read ? 'text-white/35' : 'text-white/55'
          )}
        >
          {ev.summary}
        </p>

        {ev.whyItMatters && (
          <div className="mt-3 flex gap-2.5 rounded-xl border-l-2 border-purple-400/40 bg-white/[0.03] px-3 py-2 lg:px-4 lg:py-2.5">
            <span className="mt-px shrink-0 text-[11px] font-medium text-purple-300/75 lg:text-[12px]">推荐理由</span>
            <p className="text-[13px] leading-relaxed text-white/55 lg:text-sm">{ev.whyItMatters}</p>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between lg:mt-4">
          {/* AI 标识的第 1 处法定位置：列表卡片徽章 */}
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/40 lg:text-[12px]">
            {AI_BADGE}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[12px] text-white/30 transition-colors group-hover:text-white/70 lg:text-[13px]">
            展开
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>
    </article>
  )
}
