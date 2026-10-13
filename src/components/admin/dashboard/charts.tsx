'use client'

/**
 * 仪表盘用的三种图：趋势曲线（TrendChart）、迷你走势（Sparkline）、柱状（ColumnChart）。
 *
 * 【为什么手写 SVG 而不引图表库】生产机 1.8G 内存，next build 已经要靠换页才跑得完（交接文档「构建」各节），
 * recharts / echarts 这一级的依赖会把构建内存与后台首包都再推高一截；这里要的只是三种固定形态，几百行 SVG 足够。
 *
 * 约定：
 *  · 一张图只有一个纵轴、从 0 起（利润有负值时轴向下延伸，0 线加深）；流水与利润量级不同，分成两张图，不做双轴。
 *  · 线 2px、面积只是同色 10% 左右的淡染；网格是 1px 实线；文字一律用灰阶，不用数据色。
 *  · 悬停：整块绘图区都是命中区，吸附到最近的一天，出竖线 + 圆点 + 浮层；触屏按住拖动同样有效。
 */

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'

const INK_MUTED = '#8a8f98'
const GRID = '#eef0f3'
const AXIS = '#d5d9df'

/** 容器宽度（SVG 按真实像素画，文字不会被 viewBox 拉伸） */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const apply = () => setWidth(Math.floor(el.getBoundingClientRect().width))
    apply()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

/** 纵轴刻度：取 1 / 2 / 2.5 / 5 × 10^n 的整步长，保证含 0 且盖住数据 */
export function niceScale(min: number, max: number, target = 4): { lo: number; hi: number; ticks: number[] } {
  const lo0 = Math.min(0, min)
  const hi0 = Math.max(0, max)
  const span = hi0 - lo0 || 1
  const raw = span / target
  const pow = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow
  const lo = Math.floor(lo0 / step) * step
  const hi = Math.ceil(hi0 / step) * step || step
  const ticks: number[] = []
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 100) / 100)
  return { lo, hi, ticks }
}

/** 轴上的数字：整数加千分位；过万写成「1.2万」省宽度 */
export function axisNumber(v: number): string {
  const a = Math.abs(v)
  if (a >= 10000) return `${Math.round((v / 10000) * 10) / 10}万`
  return v.toLocaleString('zh-CN', { maximumFractionDigits: a < 10 && a % 1 !== 0 ? 1 : 0 })
}

/**
 * 单调三次插值（Fritsch–Carlson）：曲线平滑但不会在两点之间拱出比两端更高 / 更低的假峰值——
 * 普通的贝塞尔平滑会把「某天 0 元」画成跌到负数，金额图上那是错的。
 */
function monotonePath(pts: Array<[number, number]>): string {
  const n = pts.length
  if (n === 0) return ''
  if (n === 1) return `M${pts[0][0]},${pts[0][1]}`
  const dx: number[] = []
  const slope: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0])
    slope.push((pts[i + 1][1] - pts[i][1]) / (dx[i] || 1))
  }
  const m: number[] = [slope[0]]
  for (let i = 1; i < n - 1; i++) m.push(slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2)
  m.push(slope[n - 2])
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      m[i] = 0
      m[i + 1] = 0
      continue
    }
    const a = m[i] / slope[i]
    const b = m[i + 1] / slope[i]
    const h = Math.hypot(a, b)
    if (h > 3) {
      m[i] = (3 * a * slope[i]) / h
      m[i + 1] = (3 * b * slope[i]) / h
    }
  }
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    const t = dx[i] / 3
    d += `C${x0 + t},${y0 + m[i] * t} ${x1 - t},${y1 - m[i + 1] * t} ${x1},${y1}`
  }
  return d
}

/** 横轴上挑哪几天写日期：两端必写，中间按宽度均匀取 */
function tickIndexes(n: number, plotW: number, minGap = 64): number[] {
  if (n <= 1) return n === 1 ? [0] : []
  const count = Math.max(2, Math.min(n, Math.floor(plotW / minGap) + 1))
  const out = new Set<number>()
  for (let i = 0; i < count; i++) out.add(Math.round((i * (n - 1)) / (count - 1)))
  return Array.from(out).sort((a, b) => a - b)
}

export interface ChartPoint {
  /** YYYY-MM-DD */
  date: string
  value: number
}

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
export function dateLabel(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  return `${date.slice(5).replace('-', '月')}日 ${WEEK[d.getUTCDay()]}`
}

function HoverCard({ x, plotLeft, plotRight, children }: { x: number; plotLeft: number; plotRight: number; children: ReactNode }) {
  // 光标在右半边时浮层放左边，避免顶出卡片
  const right = x > (plotLeft + plotRight) / 2
  return (
    <div
      className="pointer-events-none absolute top-2 z-10 min-w-[168px] rounded-xl border border-gray-200/80 bg-white/95 px-3.5 py-2.5 text-xs text-gray-600 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.28)] backdrop-blur-sm"
      style={right ? { right: `calc(100% - ${x - 12}px)` } : { left: x + 12 }}
    >
      {children}
    </div>
  )
}

/** 趋势曲线：一条线 + 淡面积，悬停出某一天的明细 */
export function TrendChart({
  data,
  color,
  height = 248,
  ariaLabel,
  renderTooltip,
}: {
  data: ChartPoint[]
  color: string
  height?: number
  ariaLabel: string
  renderTooltip: (index: number) => ReactNode
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const gid = useId().replace(/:/g, '')

  const M = { l: 46, r: 14, t: 14, b: 26 }
  const plotW = Math.max(0, width - M.l - M.r)
  const plotH = height - M.t - M.b

  const geo = useMemo(() => {
    const values = data.map((d) => d.value)
    const scale = niceScale(Math.min(...values, 0), Math.max(...values, 0))
    const n = data.length
    const x = (i: number) => M.l + (n <= 1 ? plotW / 2 : (i * plotW) / (n - 1))
    const y = (v: number) => M.t + plotH - ((v - scale.lo) / (scale.hi - scale.lo || 1)) * plotH
    const pts = data.map((d, i) => [x(i), y(d.value)] as [number, number])
    const line = monotonePath(pts)
    const y0 = y(0)
    const area = pts.length > 1 ? `${line}L${pts[pts.length - 1][0]},${y0}L${pts[0][0]},${y0}Z` : ''
    return { scale, x, y, pts, line, area, y0 }
    // M 是常量
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, plotW, plotH])

  const onMove = (clientX: number, target: HTMLElement) => {
    if (!data.length || plotW <= 0) return
    const rx = clientX - target.getBoundingClientRect().left
    const i = data.length <= 1 ? 0 : Math.round(((rx - M.l) / plotW) * (data.length - 1))
    setHover(Math.max(0, Math.min(data.length - 1, i)))
  }

  const ticks = tickIndexes(data.length, plotW)
  const hp = hover != null ? geo.pts[hover] : null

  return (
    <div
      ref={ref}
      className="relative select-none touch-pan-y"
      style={{ height }}
      onPointerMove={(e) => onMove(e.clientX, e.currentTarget)}
      onPointerDown={(e) => onMove(e.clientX, e.currentTarget)}
      onPointerLeave={() => setHover(null)}
    >
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block">
          <defs>
            <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {geo.scale.ticks.map((t) => (
            <g key={t}>
              <line x1={M.l} x2={width - M.r} y1={geo.y(t)} y2={geo.y(t)} stroke={t === 0 ? AXIS : GRID} strokeWidth={1} shapeRendering="crispEdges" />
              <text x={M.l - 8} y={geo.y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={INK_MUTED} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {axisNumber(t)}
              </text>
            </g>
          ))}
          {ticks.map((i) => (
            <text
              key={i}
              x={geo.x(i)}
              y={height - 6}
              textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}
              fontSize={11}
              fill={INK_MUTED}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {data[i].date.slice(5)}
            </text>
          ))}
          {geo.area && <path d={geo.area} fill={`url(#g${gid})`} />}
          <path d={geo.line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {/* 只有一天数据时线画不出来，给一个点 */}
          {geo.pts.length === 1 && <circle cx={geo.pts[0][0]} cy={geo.pts[0][1]} r={4} fill={color} stroke="#fff" strokeWidth={2} />}
          {hp && (
            <>
              <line x1={hp[0]} x2={hp[0]} y1={M.t} y2={M.t + plotH} stroke={AXIS} strokeWidth={1} shapeRendering="crispEdges" />
              <circle cx={hp[0]} cy={hp[1]} r={4.5} fill={color} stroke="#fff" strokeWidth={2} />
            </>
          )}
        </svg>
      )}
      {hp && hover != null && (
        <HoverCard x={hp[0]} plotLeft={M.l} plotRight={width - M.r}>
          {renderTooltip(hover)}
        </HoverCard>
      )}
    </div>
  )
}

/** 柱状：每天一根，柱宽封顶 22px，数据端圆角、基线端平 */
export function ColumnChart({
  data,
  color,
  height = 248,
  ariaLabel,
  renderTooltip,
}: {
  data: ChartPoint[]
  color: string
  height?: number
  ariaLabel: string
  renderTooltip: (index: number) => ReactNode
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const M = { l: 34, r: 8, t: 14, b: 26 }
  const plotW = Math.max(0, width - M.l - M.r)
  const plotH = height - M.t - M.b
  const n = data.length
  const band = n ? plotW / n : 0
  const barW = Math.max(2, Math.min(22, band - 2))
  const scale = useMemo(() => {
    const max = Math.max(...data.map((d) => d.value), 0)
    // 单数是整数：最大值很小时刻度不要出现 0.5
    const s = niceScale(0, Math.max(max, 4))
    return s
  }, [data])
  const y = (v: number) => M.t + plotH - (v / (scale.hi || 1)) * plotH
  const cx = (i: number) => M.l + band * i + band / 2

  const onMove = (clientX: number, target: HTMLElement) => {
    if (!n || band <= 0) return
    const rx = clientX - target.getBoundingClientRect().left
    setHover(Math.max(0, Math.min(n - 1, Math.floor((rx - M.l) / band))))
  }
  const ticks = tickIndexes(n, plotW - band)

  return (
    <div
      ref={ref}
      className="relative select-none touch-pan-y"
      style={{ height }}
      onPointerMove={(e) => onMove(e.clientX, e.currentTarget)}
      onPointerDown={(e) => onMove(e.clientX, e.currentTarget)}
      onPointerLeave={() => setHover(null)}
    >
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block">
          {scale.ticks.map((t) => (
            <g key={t}>
              <line x1={M.l} x2={width - M.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? AXIS : GRID} strokeWidth={1} shapeRendering="crispEdges" />
              <text x={M.l - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={INK_MUTED} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {axisNumber(t)}
              </text>
            </g>
          ))}
          {hover != null && <rect x={M.l + band * hover} y={M.t} width={band} height={plotH} fill="#0f172a" opacity={0.04} />}
          {data.map((d, i) => {
            if (d.value <= 0) return null
            const top = y(d.value)
            const h = Math.max(1, y(0) - top)
            const r = Math.min(4, barW / 2, h)
            const x0 = cx(i) - barW / 2
            // 顶端圆角、底端直角
            const path = `M${x0},${top + h}V${top + r}Q${x0},${top} ${x0 + r},${top}H${x0 + barW - r}Q${x0 + barW},${top} ${x0 + barW},${top + r}V${top + h}Z`
            return <path key={d.date} d={path} fill={color} opacity={hover == null || hover === i ? 1 : 0.55} />
          })}
          {ticks.map((i) => (
            <text key={i} x={cx(i)} y={height - 6} textAnchor="middle" fontSize={11} fill={INK_MUTED} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {data[i].date.slice(5)}
            </text>
          ))}
        </svg>
      )}
      {hover != null && n > 0 && (
        <HoverCard x={cx(hover)} plotLeft={M.l} plotRight={width - M.r}>
          {renderTooltip(hover)}
        </HoverCard>
      )}
    </div>
  )
}

/** 迷你走势：没有轴、没有交互，只表达形状；末端一个点标出「现在」 */
export function Sparkline({ values, color, width = 120, height = 36 }: { values: number[]; color: string; width?: number; height?: number }) {
  const gid = useId().replace(/:/g, '')
  if (values.length < 2) return <svg width={width} height={height} aria-hidden />
  const pad = 4
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 0)
  const span = max - min || 1
  const pts = values.map(
    (v, i) => [pad + (i * (width - pad * 2)) / (values.length - 1), pad + (height - pad * 2) * (1 - (v - min) / span)] as [number, number]
  )
  const line = monotonePath(pts)
  const base = pad + (height - pad * 2) * (1 - (0 - min) / span)
  const last = pts[pts.length - 1]
  return (
    <svg width={width} height={height} aria-hidden className="block overflow-visible">
      <defs>
        <linearGradient id={`s${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line}L${last[0]},${base}L${pts[0][0]},${base}Z`} fill={`url(#s${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={3} fill={color} />
    </svg>
  )
}
