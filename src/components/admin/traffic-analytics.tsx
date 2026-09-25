'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  DoorOpen,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Layers,
  Minus,
  Monitor,
  MousePointerClick,
  Repeat,
  Search,
  Smartphone,
  Target,
  UserPlus,
  Users,
} from 'lucide-react'

/* ──────────────────────────────────────────────────────────────────────────
 * 站级流量分析。数据源：PageView / Visitor 两张表，由 /api/track/view 采集，
 * 聚合在 /api/admin/analytics/traffic 里做完再下发。
 *
 * 【这个页面要回答的问题只有一个：这一轮 SEO 值不值】
 * 所以「按来源看流量」和「/chongzhi/* 落地页表现」占据最显眼的位置，
 * 其余分块都是给这两块做旁证的。指向不了决策的数字不该加进来。
 *
 * 【为什么不引图表库】这台服务器只有 1.8G 内存，构建已经很吃紧。
 * 折线图手写 SVG；柱状图用 div + 像素高度——原因见 cardkey-analytics.tsx 里的注释：
 * flex item 上的百分比高度在部分浏览器会退化成 auto，柱子会直接消失。
 * ────────────────────────────────────────────────────────────────────────── */

/* ========================= 数据模型 ========================= */

interface DailyPoint {
  date: string
  pv: number
  uv: number
}
interface Totals {
  pv: number
  uv: number
  newVisitors: number
  /** 回访率，百分数（接口已经乘过 100） */
  returningRate: number
  pagesPerVisitor: number
  /** 跳出率，百分数。分母是「访客·天」不是人，口径说明见界面 */
  bounceRate: number
  visitorDays: number
  bouncedVisitorDays: number
}
interface SourceRow {
  source: string
  pv: number
  uv: number
}
interface EngineRow {
  engine: string
  pv: number
  uv: number
}
interface PageRow {
  path: string
  pv: number
  uv: number
}
interface LandingRow extends PageRow {
  /** 该页逐日 PV，画 sparkline 用。接口只给前 N 个页面的序列，拿不到就不画线 */
  spark: number[]
}
interface RefRow {
  host: string
  source: string
  pv: number
  uv: number
}
interface EntryRow {
  path: string
  visitors: number
}
interface DeviceRow {
  device: string
  pv: number
  uv: number
}
/** /chongzhi 落地页专项 */
interface Chongzhi {
  pv: number
  searchPv: number
  searchUv: number
  /** 落地页流量里搜索引擎的占比，百分数 */
  searchShare: number
  pages: LandingRow[]
  daily: DailyPoint[]
  bySource: SourceRow[]
}

interface TrafficData {
  prevStart: string
  prevEnd: string
  totals: Totals
  /** 上一等长区间的同口径指标；接口没给就为 null，界面上不显示环比 */
  previous: Totals | null
  daily: DailyPoint[]
  bySource: SourceRow[]
  byEngine: EngineRow[]
  chongzhi: Chongzhi
  topPages: PageRow[]
  topGroups: PageRow[]
  referrers: RefRow[]
  entryPages: EntryRow[]
  byDevice: DeviceRow[]
  /** 24 个格子，索引即小时（东八区） */
  byHour: number[]
}

/* ========================= 解析 =========================
 * 字段名按接口实际返回取，同时保留几个同义候选：接口与本组件由两个人并行写，
 * 与其让一处拼写差异把整页打成白屏，不如取不到就落回 0 / 空数组，
 * 各分块自己会渲染成「还没有数据」。这一层只负责「读」，不做业务换算。
 */

type Raw = Record<string, unknown>

const PV_KEYS = ['pv', 'views', 'count', 'total', 'value']
const UV_KEYS = ['uv', 'visitors', 'uniques', 'users']
const PATH_KEYS = ['path', 'page', 'group', 'url', 'key', 'name']
const DATE_KEYS = ['day', 'date', 'dayKey', 'key']

function isObj(v: unknown): v is Raw {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}
function pick(o: Raw | undefined, keys: string[]): unknown {
  if (!o) return undefined
  for (const k of keys) {
    const v = o[k]
    if (v !== undefined && v !== null) return v
  }
  return undefined
}
function optNum(o: Raw | undefined, keys: string[]): number | null {
  const v = pick(o, keys)
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isFinite(n) ? n : null
}
function num(o: Raw | undefined, keys: string[], fallback = 0): number {
  return optNum(o, keys) ?? fallback
}
function str(o: Raw | undefined, keys: string[], fallback = ''): string {
  const v = pick(o, keys)
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return fallback
}
function objAt(o: Raw | undefined, keys: string[]): Raw | undefined {
  const v = pick(o, keys)
  return isObj(v) ? v : undefined
}
function rowsAt(o: Raw | undefined, keys: string[]): Raw[] {
  const v = pick(o, keys)
  return Array.isArray(v) ? v.filter(isObj) : []
}
function points(o: Raw | undefined, keys: string[]): DailyPoint[] {
  return rowsAt(o, keys).map((r) => ({
    date: str(r, DATE_KEYS),
    pv: num(r, PV_KEYS),
    uv: num(r, UV_KEYS),
  }))
}

/**
 * 比率字段一律按「已经是百分数」处理，不做 0-1 归一化猜测。
 * 接口那边 pct() 已经乘过 100，再猜一次会把真实的 0.5%（回访率极低时完全可能）
 * 误放大成 50%——宁可显示得难看，也不能显示得错。
 */
function readTotals(o: Raw | undefined): Totals | null {
  if (!o) return null
  const pv = num(o, PV_KEYS)
  const uv = num(o, UV_KEYS)
  const newVisitors = num(o, ['newVisitors', 'newVisitor', 'newUv', 'new'])
  // 回访率 / 人均页数接口不给就现算：它们完全由 pv / uv / 新访客推出，没有额外信息
  const returning = optNum(o, ['returningRate', 'returnRate', 'repeatRate'])
  const perVisitor = optNum(o, ['pagesPerVisitor', 'pagesPerUv', 'pvPerUv', 'depth'])
  return {
    pv,
    uv,
    newVisitors,
    returningRate: returning ?? (uv > 0 ? ((uv - newVisitors) / uv) * 100 : 0),
    pagesPerVisitor: perVisitor ?? (uv > 0 ? pv / uv : 0),
    bounceRate: num(o, ['bounceRate', 'bounce']),
    visitorDays: num(o, ['visitorDays']),
    bouncedVisitorDays: num(o, ['bouncedVisitorDays', 'bounced']),
  }
}

const EMPTY_CHONGZHI: Chongzhi = {
  pv: 0,
  searchPv: 0,
  searchUv: 0,
  searchShare: 0,
  pages: [],
  daily: [],
  bySource: [],
}

function readChongzhi(raw: Raw, topPages: PageRow[]): Chongzhi {
  const cz = objAt(raw, ['chongzhi', 'landing', 'landingPages', 'seo'])
  if (!cz) {
    // 接口没给专项块时，至少从热门页面里把 /chongzhi 挑出来。
    // 这一块不能缺——它是整个页面存在的理由。
    const fallback = topPages.filter((p) => p.path.startsWith('/chongzhi'))
    return {
      ...EMPTY_CHONGZHI,
      pv: fallback.reduce((s, p) => s + p.pv, 0),
      pages: fallback.map((p) => ({ ...p, spark: [] })),
    }
  }

  // 逐页折线单独一块，按 path join 回页面表
  const sparkOf = new Map<string, number[]>()
  for (const s of rowsAt(cz, ['pageSeries', 'series', 'sparklines'])) {
    const path = str(s, PATH_KEYS)
    if (!path) continue
    const raws = pick(s, ['points', 'daily', 'series', 'spark'])
    if (!Array.isArray(raws)) continue
    sparkOf.set(
      path,
      raws.map((it) => (typeof it === 'number' ? it : isObj(it) ? num(it, PV_KEYS) : 0))
    )
  }

  return {
    pv: num(cz, ['pv', 'totalPv']),
    searchPv: num(cz, ['searchPv']),
    searchUv: num(cz, ['searchUv']),
    searchShare: num(cz, ['searchShare']),
    pages: rowsAt(cz, ['pages', 'items', 'rows']).map((r) => {
      const path = str(r, PATH_KEYS)
      return { path, pv: num(r, PV_KEYS), uv: num(r, UV_KEYS), spark: sparkOf.get(path) ?? [] }
    }),
    daily: points(cz, ['daily', 'trend']),
    bySource: rowsAt(cz, ['bySource', 'sources']).map((r) => ({
      source: str(r, ['source', 'key', 'name'], 'other'),
      pv: num(r, PV_KEYS),
      uv: num(r, UV_KEYS),
    })),
  }
}

function parse(raw: unknown): TrafficData | null {
  if (!isObj(raw)) return null
  const summary = objAt(raw, ['summary', 'totals', 'overview'])
  const totals =
    readTotals(objAt(summary, ['current'])) ?? readTotals(summary) ?? readTotals(raw)
  if (!totals) return null

  const range = objAt(raw, ['range', 'meta'])
  const topPages = rowsAt(raw, ['topPages', 'pages', 'byPath']).map((r) => ({
    path: str(r, PATH_KEYS),
    pv: num(r, PV_KEYS),
    uv: num(r, UV_KEYS),
  }))

  // byHour 接口给的是补齐到 24 项的 [{hour, pv, uv}]，这里再归一次位，
  // 免得少给几项时柱状图的 x 轴缩成七八根柱子、看不出「凌晨没人」这个形状
  const hourRaw = pick(raw, ['byHour', 'hourly', 'hours'])
  const byHour = Array.from({ length: 24 }, (_, h) => {
    if (!Array.isArray(hourRaw)) return 0
    const hit = hourRaw.find((it) => isObj(it) && num(it, ['hour', 'h', 'bucket'], -1) === h)
    if (isObj(hit)) return num(hit, PV_KEYS)
    const byIndex = hourRaw[h]
    if (typeof byIndex === 'number') return byIndex
    return 0
  })

  return {
    prevStart: str(range, ['prevStart']),
    prevEnd: str(range, ['prevEnd']),
    totals,
    previous: readTotals(objAt(summary, ['previous'])) ?? readTotals(objAt(raw, ['previous', 'prev'])),
    daily: points(raw, ['daily', 'trend', 'byDay']),
    bySource: rowsAt(raw, ['bySource', 'sources']).map((r) => ({
      source: str(r, ['source', 'key', 'name'], 'other'),
      pv: num(r, PV_KEYS),
      uv: num(r, UV_KEYS),
    })),
    byEngine: rowsAt(raw, ['byEngine', 'engines', 'searchEngines']).map((r) => ({
      engine: str(r, ['engine', 'key', 'name'], 'other'),
      pv: num(r, PV_KEYS),
      uv: num(r, UV_KEYS),
    })),
    chongzhi: readChongzhi(raw, topPages),
    topPages,
    /*
     * 【归类视图的 uv 是「各成员页面 UV 之和」，不是去重人数】
     * 后端刻意把它命名为 uvSum 来防止前端当 UV 展示——第一版前端没认这个名字，
     * 结果整列恒为 0。这里显式读它，同时**表头与「人均」列在归类模式下另作处理**
     * （见 pageMode === 'group' 的分支），不能照抄原始路径视图那一套。
     */
    topGroups: rowsAt(raw, ['topPageGroups', 'topGroups', 'pageGroups', 'byGroup']).map((r) => ({
      path: str(r, PATH_KEYS),
      pv: num(r, PV_KEYS),
      uv: num(r, ['uvSum', ...UV_KEYS]),
    })),
    referrers: rowsAt(raw, ['topReferrers', 'referrers', 'byRefHost']).map((r) => ({
      host: str(r, ['host', 'refHost', 'referrer', 'domain', 'key'], '(未知)'),
      source: str(r, ['source', 'type'], ''),
      pv: num(r, PV_KEYS),
      uv: num(r, UV_KEYS),
    })),
    entryPages: rowsAt(raw, ['topLandings', 'entryPages', 'landings', 'byEntry']).map((r) => ({
      path: str(r, ['landing', ...PATH_KEYS]),
      visitors: num(r, ['visitors', 'count', 'uv', 'value']),
    })),
    byDevice: rowsAt(raw, ['byDevice', 'devices']).map((r) => ({
      device: str(r, ['device', 'key', 'name'], 'desktop'),
      pv: num(r, PV_KEYS),
      uv: num(r, UV_KEYS),
    })),
    byHour,
  }
}

/* ========================= 展示用常量 ========================= */

const SOURCE_META: Record<string, { label: string; color: string }> = {
  search: { label: '搜索引擎', color: '#10b981' },
  // AI 助手单列一类：上线埋点第一天 chatgpt.com 就是最大的外部来源，
  // 混进「社交」或「外链引荐」等于看不见这条渠道
  ai: { label: 'AI 助手 / AI 搜索', color: '#ec4899' },
  // 营销邮件与交易邮件里的链接：网页邮箱的 referrer + 落地 URL 带 utm_medium=email 的访问
  //（口径见 lib/analytics/classify.ts 的 WEBMAIL_HOSTS / EMAIL_REFERRER_MARKER）
  email: { label: '邮件', color: '#ef4444' },
  direct: { label: '直接访问', color: '#9ca3af' },
  social: { label: '社交 / 社区', color: '#8b5cf6' },
  referral: { label: '外链引荐', color: '#f59e0b' },
  // 会话归因之后新数据基本不会再出现这一类，留着是为了旧数据还能正常显示
  internal: { label: '站内跳转', color: '#38bdf8' },
}
const ENGINE_LABEL: Record<string, string> = {
  google: 'Google',
  bing: 'Bing',
  baidu: '百度',
  sogou: '搜狗',
  '360': '360 搜索',
  yandex: 'Yandex',
  duckduckgo: 'DuckDuckGo',
  ecosia: 'Ecosia',
  brave: 'Brave',
  naver: 'Naver',
  yahoo: 'Yahoo',
  other: '未识别',
}
const sourceMeta = (s: string) => SOURCE_META[s] || { label: s || '未知', color: '#cbd5e1' }

/* ========================= 小工具 ========================= */

/** 东八区的今天。管理员都在国内，浏览器本地日历日与业务日切点一致 */
function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}
function shiftDays(day: string, delta: number) {
  const t = Date.parse(`${day}T00:00:00.000Z`)
  if (!Number.isFinite(t)) return day
  return new Date(t + delta * 86400000).toISOString().slice(0, 10)
}
function daysBetween(start: string, end: string) {
  const a = Date.parse(`${start}T00:00:00.000Z`)
  const b = Date.parse(`${end}T00:00:00.000Z`)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
  return Math.floor((b - a) / 86400000) + 1
}
function int(n: number) {
  return Math.round(n).toLocaleString('zh-CN')
}
function pct(n: number, digits = 1) {
  if (!Number.isFinite(n)) return '—'
  return `${(Math.round(n * 10 ** digits) / 10 ** digits).toFixed(digits)}%`
}
function short(n: number) {
  if (n >= 10000) return `${Math.round(n / 1000)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

/** 一行灰色小字，说明「这个数字怎么看」。这些说明是本页有没有用的关键，不是装饰 */
function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-2.5 text-xs leading-relaxed text-gray-400">{children}</p>
}

function Empty({ loading, text = '还没有数据' }: { loading?: boolean; text?: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 py-10 text-sm text-gray-400">
      {loading ? '加载中...' : text}
    </div>
  )
}

/* ========================= 环比 ========================= */

/**
 * 环比。
 * mode='pp'：本身就是百分比的指标（跳出率、回访率）比的是百分点差。
 * 说「跳出率涨了 3 个百分点」有意义，说「涨了 7%」会被读成绝对值，那是两回事。
 */
function Delta({
  cur,
  prev,
  goodWhen = 'up',
  mode = 'rel',
}: {
  cur: number
  prev: number | null
  goodWhen?: 'up' | 'down'
  mode?: 'rel' | 'pp'
}) {
  if (prev === null) return null
  if (mode === 'rel' && prev <= 0) {
    return <span className="text-xs text-gray-400">{cur > 0 ? '上期无数据' : '—'}</span>
  }
  const diff = mode === 'pp' ? cur - prev : ((cur - prev) / prev) * 100
  const flat = Math.abs(diff) < 0.05
  const up = diff > 0
  const good = flat ? null : up === (goodWhen === 'up')
  const cls = flat ? 'text-gray-400' : good ? 'text-green-600' : 'text-red-500'
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`inline-flex shrink-0 items-center gap-0.5 text-xs font-medium ${cls}`}>
      <Icon className="h-3 w-3" />
      {flat
        ? '持平'
        : `${Math.abs(Math.round(diff * 10) / 10).toFixed(1)}${mode === 'pp' ? 'pp' : '%'}`}
    </span>
  )
}

/* ========================= 双折线图 ========================= */

const CW = 880
const PAD_L = 46
const PAD_R = 14
const PAD_T = 16
const PAD_B = 34

/** 取一个「好看」的 Y 轴上限，否则刻度会是 137 / 274 这种读不出来的数 */
function niceMax(v: number) {
  if (v <= 0) return 4
  const exp = 10 ** Math.floor(Math.log10(v))
  const f = v / exp
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
  return nice * exp
}

function DualLineChart({ daily, height = 300 }: { daily: DailyPoint[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const plotH = height - PAD_T - PAD_B
  const plotW = CW - PAD_L - PAD_R
  const n = daily.length
  const top = niceMax(Math.max(1, ...daily.map((d) => Math.max(d.pv, d.uv))))
  // 只有一个点时画不出线，把它摆在正中间画个圆点
  const x = (i: number) => (n <= 1 ? PAD_L + plotW / 2 : PAD_L + (i / (n - 1)) * plotW)
  const y = (v: number) => PAD_T + plotH - (v / top) * plotH
  const line = (key: 'pv' | 'uv') => daily.map((d, i) => `${x(i)},${y(d[key])}`).join(' ')
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => top * f)
  // X 轴日期密集时隔几个显示一个，否则挤成一团黑
  const step = Math.max(1, Math.ceil(n / 9))
  const band = n <= 1 ? plotW : plotW / (n - 1)
  const hd = hover !== null ? daily[hover] : null

  return (
    <svg
      viewBox={`0 0 ${CW} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-auto w-full select-none"
      role="img"
      onMouseLeave={() => setHover(null)}
    >
      {/* Y 轴刻度线与数值 */}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD_L} x2={CW - PAD_R} y1={y(t)} y2={y(t)} stroke="#f1f5f9" strokeWidth={1} />
          <text x={PAD_L - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#94a3b8">
            {Number.isInteger(t) ? short(t) : t.toFixed(1)}
          </text>
        </g>
      ))}

      {/* X 轴日期 */}
      {daily.map((d, i) =>
        i % step === 0 || i === n - 1 ? (
          <text
            key={d.date || i}
            x={x(i)}
            y={height - PAD_B + 18}
            textAnchor="middle"
            fontSize={11}
            fill="#94a3b8"
          >
            {d.date.slice(5)}
          </text>
        ) : null
      )}

      {/* 折线：PV 蓝、UV 绿 */}
      {n > 1 && (
        <>
          <polyline
            points={line('pv')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polyline
            points={line('uv')}
            fill="none"
            stroke="#10b981"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </>
      )}
      {n === 1 && (
        <>
          <circle cx={x(0)} cy={y(daily[0].pv)} r={4} fill="#3b82f6" />
          <circle cx={x(0)} cy={y(daily[0].uv)} r={4} fill="#10b981" />
        </>
      )}

      {/* hover 高亮 */}
      {hd && hover !== null && (
        <>
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={PAD_T}
            y2={PAD_T + plotH}
            stroke="#cbd5e1"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <circle cx={x(hover)} cy={y(hd.pv)} r={4} fill="#3b82f6" stroke="#fff" strokeWidth={2} />
          <circle cx={x(hover)} cy={y(hd.uv)} r={4} fill="#10b981" stroke="#fff" strokeWidth={2} />
        </>
      )}

      {/* 命中区：每天一条通栏透明矩形。让鼠标去精准命中 2px 宽的折线是不现实的 */}
      {daily.map((d, i) => (
        <rect
          key={`hit-${d.date || i}`}
          x={x(i) - band / 2}
          y={PAD_T}
          width={band}
          height={plotH}
          fill="transparent"
          onMouseEnter={() => setHover(i)}
        />
      ))}

      {/* tooltip 直接用 viewBox 坐标画，不换算鼠标像素，图被缩放时位置也不会飘 */}
      {hd && hover !== null && (
        <g
          transform={`translate(${Math.min(
            Math.max(x(hover) + 12, PAD_L),
            CW - PAD_R - 150
          )}, ${PAD_T + 8})`}
          pointerEvents="none"
        >
          <rect width={150} height={70} rx={8} fill="#0f172a" opacity={0.92} />
          <text x={12} y={22} fontSize={12} fill="#e2e8f0">
            {hd.date}
          </text>
          <circle cx={17} cy={39} r={4} fill="#3b82f6" />
          <text x={28} y={43} fontSize={12} fill="#f8fafc">
            PV {int(hd.pv)}
          </text>
          <circle cx={17} cy={57} r={4} fill="#10b981" />
          <text x={28} y={61} fontSize={12} fill="#f8fafc">
            UV {int(hd.uv)}
          </text>
        </g>
      )}
    </svg>
  )
}

/* ========================= sparkline ========================= */

function Sparkline({ values, color = '#10b981' }: { values: number[]; color?: string }) {
  if (!values.length) return <span className="text-xs text-gray-300">—</span>
  const w = 120
  const h = 28
  const top = Math.max(1, ...values)
  const n = values.length
  const pts = values
    .map((v, i) => `${n <= 1 ? w / 2 : (i / (n - 1)) * w},${h - (v / top) * (h - 4) - 2}`)
    .join(' ')
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="h-7 w-full max-w-[120px]"
      role="img"
    >
      <title>{`逐日 PV：${values.join(' / ')}（峰值 ${top}）`}</title>
      {n > 1 ? (
        <polyline points={pts} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      ) : (
        <circle cx={w / 2} cy={h / 2} r={2.5} fill={color} />
      )}
    </svg>
  )
}

/* ========================= 环形图 ========================= */

function Donut({ items }: { items: { label: string; value: number; color: string }[] }) {
  const total = items.reduce((s, it) => s + it.value, 0)
  const R = 54
  const SW = 22
  const C = 2 * Math.PI * R
  let acc = 0
  return (
    <svg viewBox="0 0 160 160" preserveAspectRatio="xMidYMid meet" className="h-40 w-40 shrink-0">
      <circle cx={80} cy={80} r={R} fill="none" stroke="#f1f5f9" strokeWidth={SW} />
      {total > 0 &&
        items.map((it) => {
          const len = (it.value / total) * C
          const off = acc
          acc += len
          return (
            <circle
              key={it.label}
              cx={80}
              cy={80}
              r={R}
              fill="none"
              stroke={it.color}
              strokeWidth={SW}
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-off}
              transform="rotate(-90 80 80)"
            >
              <title>{`${it.label} ${int(it.value)}（${pct((it.value / total) * 100)}）`}</title>
            </circle>
          )
        })}
      <text x={80} y={76} textAnchor="middle" fontSize={20} fontWeight={700} fill="#111827">
        {short(total)}
      </text>
      <text x={80} y={94} textAnchor="middle" fontSize={11} fill="#9ca3af">
        总 PV
      </text>
    </svg>
  )
}

/* ========================= 主组件 ========================= */

export default function TrafficAnalytics() {
  const today = iso(new Date())
  const [start, setStart] = useState(shiftDays(today, -6))
  const [end, setEnd] = useState(today)
  const [data, setData] = useState<TrafficData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errMsg, setErrMsg] = useState('')
  const [pageMode, setPageMode] = useState<'raw' | 'group'>('group')
  const [engineOpen, setEngineOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setErrMsg('')
    try {
      const q = new URLSearchParams({ start, end })
      const res = await fetch(`/api/admin/analytics/traffic?${q}`, { signal: controller.signal })
      const json = await res.json()
      if (abortRef.current !== controller) return
      if (json?.success) {
        setData(parse(json.data))
      } else {
        setData(null)
        setErrMsg(json?.error || '统计失败')
      }
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return
      setData(null)
      setErrMsg('网络异常，请重试')
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }, [start, end])

  // 区间变化自动重查（首次挂载也会触发）
  useEffect(() => {
    load()
  }, [load])

  /*
   * 【没有「近 90 天」是有原因的】明细按 90 天保留（/api/cron/cleanup，
   * 那个数字又和 /privacy 里对买家的承诺绑定）。选 90 天区间的话，
   * 环比对象是更早的 90 天——那批数据已经被清理掉了，六张卡会一齐显示
   * 「上期无数据」，而看的人第一反应是怀疑埋点坏了。
   * 接口那边 MAX_DAYS 也相应设成 45：区间 + 等长环比区间正好落在保留期内。
   */
  const presets: { label: string; days: number }[] = [
    { label: '今天', days: 1 },
    { label: '近 7 天', days: 7 },
    { label: '近 30 天', days: 30 },
    { label: '近 45 天', days: 45 },
  ]
  const applyPreset = (days: number) => {
    const t = iso(new Date())
    setStart(shiftDays(t, -(days - 1)))
    setEnd(t)
  }

  const spanDays = daysBetween(start, end)
  const prevStart = data?.prevStart || shiftDays(start, -spanDays)
  const prevEnd = data?.prevEnd || shiftDays(start, -1)

  const t = data?.totals
  const p = data?.previous ?? null

  const metricCards = [
    {
      key: 'pv',
      title: '浏览量 PV',
      value: t ? int(t.pv) : '--',
      icon: Eye,
      color: 'bg-blue-500',
      cur: t?.pv ?? 0,
      prev: p?.pv ?? null,
      goodWhen: 'up' as const,
      mode: 'rel' as const,
      sub: '去重后的页面浏览',
    },
    {
      key: 'uv',
      title: '独立访客 UV',
      value: t ? int(t.uv) : '--',
      icon: Users,
      color: 'bg-emerald-500',
      cur: t?.uv ?? 0,
      prev: p?.uv ?? null,
      goodWhen: 'up' as const,
      mode: 'rel' as const,
      sub: '区间内按人去重',
    },
    {
      key: 'new',
      title: '新访客',
      value: t ? int(t.newVisitors) : '--',
      icon: UserPlus,
      color: 'bg-violet-500',
      cur: t?.newVisitors ?? 0,
      prev: p?.newVisitors ?? null,
      goodWhen: 'up' as const,
      mode: 'rel' as const,
      sub: t && t.uv > 0 ? `占 UV ${pct((t.newVisitors / t.uv) * 100, 0)}` : '第一次进站的人',
    },
    {
      key: 'ret',
      title: '回访率',
      value: t ? pct(t.returningRate) : '--',
      icon: Repeat,
      color: 'bg-cyan-500',
      cur: t?.returningRate ?? 0,
      prev: p?.returningRate ?? null,
      goodWhen: 'up' as const,
      mode: 'pp' as const,
      sub: '以前来过的人占比',
    },
    {
      key: 'depth',
      title: '人均页数',
      value: t ? (Math.round(t.pagesPerVisitor * 100) / 100).toFixed(2) : '--',
      icon: Layers,
      color: 'bg-amber-500',
      cur: t?.pagesPerVisitor ?? 0,
      prev: p?.pagesPerVisitor ?? null,
      goodWhen: 'up' as const,
      mode: 'rel' as const,
      sub: 'PV ÷ UV',
    },
    {
      key: 'bounce',
      title: '跳出率（近似）',
      value: t ? pct(t.bounceRate) : '--',
      icon: MousePointerClick,
      color: 'bg-rose-500',
      cur: t?.bounceRate ?? 0,
      prev: p?.bounceRate ?? null,
      goodWhen: 'down' as const,
      mode: 'pp' as const,
      sub: t && t.visitorDays > 0 ? `基于 ${int(t.visitorDays)} 个访客·天` : '当天只看了一页',
    },
  ]

  const hasDaily = !!data && data.daily.some((d) => d.pv > 0 || d.uv > 0)

  // 来源构成按 PV 倒序。search 的绝对值与环比是判断 SEO 成效的主指标
  const sourceRows = useMemo(
    () => (data?.bySource ?? []).slice().sort((a, b) => b.pv - a.pv),
    [data]
  )
  const sourceTotalPv = sourceRows.reduce((s, r) => s + r.pv, 0)
  const searchRow = sourceRows.find((r) => r.source === 'search')
  const engineRows = useMemo(
    () => (data?.byEngine ?? []).slice().sort((a, b) => b.pv - a.pv),
    [data]
  )

  const cz = data?.chongzhi ?? EMPTY_CHONGZHI
  const czPages = useMemo(() => cz.pages.slice().sort((a, b) => b.pv - a.pv), [cz])
  const czMaxPv = Math.max(1, ...czPages.map((r) => r.pv))
  const czHasDaily = cz.daily.some((d) => d.pv > 0 || d.uv > 0)
  const czSourceTotal = cz.bySource.reduce((s, r) => s + r.pv, 0)

  const pageRows = (pageMode === 'raw' ? data?.topPages : data?.topGroups) ?? []
  const pageMaxPv = Math.max(1, ...pageRows.map((r) => r.pv))

  const referrers = (data?.referrers ?? []).slice(0, 20)
  const entryPages = (data?.entryPages ?? []).slice(0, 15)
  const entryMax = Math.max(1, ...entryPages.map((r) => r.visitors))

  const deviceRows = (data?.byDevice ?? []).slice().sort((a, b) => b.pv - a.pv)
  const deviceTotal = deviceRows.reduce((s, r) => s + r.pv, 0)

  const hours = data?.byHour ?? []
  const hourMax = Math.max(1, ...hours)
  const hasHour = hours.some((v) => v > 0)
  // 柱高算成像素而不是百分比：父级是 flex 且高度由内容决定，
  // 百分比高度在 flex item 上解析不稳定（部分浏览器退化成 auto，柱子直接看不见）
  const HOUR_BAR_PX = 120
  const peakHour = hasHour ? hours.indexOf(hourMax) : -1

  return (
    <div className="space-y-6">
      {/* ───────── 区间选择 ───────── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">开始日期</label>
              <input
                type="date"
                value={start}
                max={end}
                onChange={(e) => setStart(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">结束日期</label>
              <input
                type="date"
                value={end}
                min={start}
                onChange={(e) => setEnd(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <Button onClick={load} loading={loading}>
              查询
            </Button>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((x) => (
                <button
                  key={x.label}
                  onClick={() => applyPreset(x.days)}
                  className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-50"
                >
                  {x.label}
                </button>
              ))}
            </div>
          </div>
          <Hint>
            当前区间共 {spanDays} 天（日切点 UTC+8）。所有卡片的环比对象是紧邻的等长区间{' '}
            <span className="text-gray-500">
              {prevStart} ~ {prevEnd}
            </span>
            。埋点口径：访客停留满 3 秒才上报，且同一人同一页同一小时只记一次——
            所以这里的数比服务器日志小得多，小掉的那部分（爬虫、预取、秒退）本来就不该拿来做决策。
          </Hint>
          {errMsg && (
            <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              {errMsg}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ───────── 指标卡 ───────── */}
      <div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metricCards.map((c) => (
            <Card key={c.key}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-gray-500">{c.title}</p>
                  <div className={`rounded-lg ${c.color} p-1.5`}>
                    <c.icon className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
                <p className="mt-1.5 truncate text-2xl font-bold text-gray-900">
                  {loading && !data ? '...' : c.value}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Delta cur={c.cur} prev={c.prev} goodWhen={c.goodWhen} mode={c.mode} />
                  <span className="truncate text-[11px] text-gray-400">{c.sub}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Hint>
          环比＝与上一个等长区间相比；比率型指标（回访率、跳出率）比的是
          <span className="text-gray-500">百分点差（pp）</span>，不是相对涨幅。
          <span className="text-gray-500">跳出率是近似值</span>
          ：本站没有会话（session）概念，它按「一个访客在某一天里只看过 1 个页面」来算，
          分母是访客·天而不是人次，同一个人来两天算两份。因此它和 GA 那类工具的口径对不上，
          只适合自己跟自己比趋势，不要拿去和行业均值比。
        </Hint>
      </div>

      {/* ───────── 主图：每日 PV / UV ───────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              每日流量趋势
            </span>
            <span className="flex items-center gap-3 text-xs font-normal text-gray-500">
              <span className="inline-flex items-center gap-1">
                <span className="h-0.5 w-3 rounded bg-blue-500" />
                PV
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-0.5 w-3 rounded bg-emerald-500" />
                UV
              </span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasDaily ? <Empty loading={loading} /> : <DualLineChart daily={data!.daily} />}
          <Hint>
            鼠标悬停可以看某一天的具体数值。两条线的间距＝人均看了几页：
            贴在一起说明来的人看完一页就走。SEO 生效的典型形状是 UV 先抬头、人均页数滞后几周才跟上；
            如果只有 PV 涨而 UV 不动，那多半是同一批老访客翻得更勤，不是新流量。
          </Hint>
        </CardContent>
      </Card>

      {/* ───────── SEO 成效：落地页专项（本页存在的主要理由） ───────── */}
      <Card className="border-emerald-200">
        <CardHeader className="border-emerald-100 bg-emerald-50/60">
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-600" />
              SEO 落地页专项 · /chongzhi
            </span>
            <span className="text-xs font-normal text-gray-500">
              合计 PV <b className="text-gray-900">{int(cz.pv)}</b>
              {t && t.pv > 0 && <> · 占全站 {pct((cz.pv / t.pv) * 100, 0)}</>}
              {cz.pv > 0 && (
                <>
                  {' '}
                  · 其中搜索带来{' '}
                  <b className="text-emerald-600">
                    {int(cz.searchPv)}（{pct(cz.searchShare, 0)}）
                  </b>
                  ，对应 {int(cz.searchUv)} 人
                </>
              )}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 落地页整体走势 */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700">这批页面的整体走势</h4>
            {!czHasDaily ? (
              <Empty loading={loading} />
            ) : (
              <DualLineChart daily={cz.daily} height={220} />
            )}
          </div>

          {/* 落地页来源构成：这批页面到底是不是靠搜索活着 */}
          {czSourceTotal > 0 && (
            <div className="flex flex-wrap gap-2">
              {cz.bySource
                .slice()
                .sort((a, b) => b.pv - a.pv)
                .map((r) => (
                  <span
                    key={r.source}
                    className="rounded-full px-2.5 py-1 text-xs"
                    style={{
                      background: `${sourceMeta(r.source).color}1a`,
                      color: sourceMeta(r.source).color,
                    }}
                  >
                    {sourceMeta(r.source).label} {int(r.pv)} · {pct((r.pv / czSourceTotal) * 100, 0)}
                  </span>
                ))}
            </div>
          )}

          {/* 逐页明细 + sparkline */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700">逐页表现</h4>
            {czPages.length === 0 ? (
              <Empty loading={loading} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-gray-400">
                      <th className="pb-1 pr-2 font-medium">落地页</th>
                      <th className="pb-1 pr-2 text-right font-medium">PV</th>
                      <th className="pb-1 pr-2 text-right font-medium">UV</th>
                      <th className="pb-1 pr-2 text-right font-medium">人均</th>
                      <th className="pb-1 pr-2 font-medium">占比</th>
                      <th className="pb-1 font-medium">逐日趋势</th>
                    </tr>
                  </thead>
                  <tbody>
                    {czPages.map((r, i) => (
                      <tr key={`${r.path}-${i}`} className="border-b border-gray-50">
                        <td className="max-w-[260px] py-2 pr-2">
                          <div className="truncate font-medium text-gray-700" title={r.path}>
                            {r.path}
                          </div>
                        </td>
                        <td className="py-2 pr-2 text-right font-semibold tabular-nums text-gray-900">
                          {int(r.pv)}
                        </td>
                        <td className="py-2 pr-2 text-right tabular-nums text-gray-500">
                          {int(r.uv)}
                        </td>
                        <td className="py-2 pr-2 text-right tabular-nums text-gray-400">
                          {r.uv > 0 ? (r.pv / r.uv).toFixed(2) : '—'}
                        </td>
                        <td className="w-[110px] py-2 pr-2">
                          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${Math.min((r.pv / czMaxPv) * 100, 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="w-[130px] py-2">
                          <Sparkline values={r.spark} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <Hint>
            这批页面是专门为搜索流量做的，所以它们的曲线就是「这一轮 SEO 值不值」最直接的答案。
            看法：先看<span className="text-gray-500">搜索占比</span>
            ——低说明这些页还没吃到搜索流量，现在的量是站内互点来的，不能算 SEO 成果；
            再看<span className="text-gray-500">人均页数</span>，等于 1 说明进来的人看完就走，
            多半是标题与内容对不上，这种流量再多也不转化；
            某一页长期为 0 就是没收录或没排名，该改那一页的标题和内容，而不是继续加新页。
            排名生效通常要 2-6 周，别拿单日的起伏下结论。
            <span className="text-gray-500"> 注意这里不提供「落地页整体 UV」</span>
            ：逐页 UV 相加会把跨页浏览的同一个人重复计算，那个数没有意义，所以干脆不给。
            逐日趋势只给流量最高的前几页。
          </Hint>
        </CardContent>
      </Card>

      {/* ───────── 来源构成 ───────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Compass className="h-5 w-5 text-emerald-500" />
            全站流量来源构成
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sourceTotalPv <= 0 ? (
            <Empty loading={loading} />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="flex flex-wrap items-center gap-5">
                <Donut
                  items={sourceRows.map((r) => ({
                    label: sourceMeta(r.source).label,
                    value: r.pv,
                    color: sourceMeta(r.source).color,
                  }))}
                />
                <div className="min-w-[170px] flex-1 space-y-2">
                  {sourceRows.map((r) => (
                    <div key={r.source} className="flex items-center gap-2 text-xs">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ background: sourceMeta(r.source).color }}
                      />
                      <span className="flex-1 truncate text-gray-600">
                        {sourceMeta(r.source).label}
                      </span>
                      <span className="tabular-nums text-gray-900">{int(r.pv)}</span>
                      <span className="w-12 text-right tabular-nums text-gray-400">
                        {pct((r.pv / sourceTotalPv) * 100, 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 明细表：search 可展开看各搜索引擎 */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-gray-400">
                      <th className="pb-1 pr-2 font-medium">来源</th>
                      <th className="pb-1 pr-2 text-right font-medium">PV</th>
                      <th className="pb-1 pr-2 text-right font-medium">UV</th>
                      <th className="pb-1 text-right font-medium">占比</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourceRows.map((r) => {
                      const expandable = r.source === 'search' && engineRows.length > 0
                      return (
                        <tr key={r.source} className="border-b border-gray-50">
                          <td className="py-1.5 pr-2">
                            {expandable ? (
                              <button
                                onClick={() => setEngineOpen((v) => !v)}
                                className="inline-flex items-center gap-1 text-gray-700 hover:text-primary-600"
                              >
                                {engineOpen ? (
                                  <ChevronDown className="h-3.5 w-3.5" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5" />
                                )}
                                {sourceMeta(r.source).label}
                                <span className="text-xs text-gray-400">
                                  （{engineRows.length} 个引擎）
                                </span>
                              </button>
                            ) : (
                              <span className="pl-[18px] text-gray-700">
                                {sourceMeta(r.source).label}
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 pr-2 text-right tabular-nums text-gray-900">
                            {int(r.pv)}
                          </td>
                          <td className="py-1.5 pr-2 text-right tabular-nums text-gray-500">
                            {int(r.uv)}
                          </td>
                          <td className="py-1.5 text-right tabular-nums text-gray-500">
                            {pct((r.pv / sourceTotalPv) * 100, 0)}
                          </td>
                        </tr>
                      )
                    })}
                    {engineOpen &&
                      engineRows.map((e) => (
                        <tr key={e.engine} className="border-b border-gray-50 bg-gray-50/60">
                          <td className="py-1.5 pl-8 pr-2 text-xs text-gray-600">
                            <Search className="mr-1 inline h-3 w-3 text-gray-400" />
                            {ENGINE_LABEL[e.engine] || e.engine}
                          </td>
                          <td className="py-1.5 pr-2 text-right text-xs tabular-nums text-gray-700">
                            {int(e.pv)}
                          </td>
                          <td className="py-1.5 pr-2 text-right text-xs tabular-nums text-gray-500">
                            {int(e.uv)}
                          </td>
                          <td className="py-1.5 text-right text-xs tabular-nums text-gray-400">
                            {searchRow && searchRow.pv > 0
                              ? pct((e.pv / searchRow.pv) * 100, 0)
                              : '—'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <Hint>
            <span className="text-gray-500">direct 不等于「记住了网址的人」</span>
            ：它真正的含义是「拿不到 referrer」，包含直接输网址、书签、App 内打开、
            以及对方站设了 referrer policy 的 https 跳转，是个大杂烩。
            判断 SEO 成效只看 <span className="text-gray-500">search 的绝对值和它的环比</span>，
            别拿 direct 的涨跌说事。
            展开 search 能看到各引擎分布——国内站如果 Google 远多于百度，说明百度那边还没被收录。
            <br />
            <span className="text-gray-500">来源是会话归因</span>
            ：一次访问从哪进来，这次访问里的每一页都算那个来源，
            所以这张表回答的是「人是谁带来的」，不是「上一页点的是哪」。
            <span className="text-gray-500">AI 助手</span>
            这一类是 ChatGPT、Claude、Perplexity、豆包这些在回答里引用本站带来的点击，
            现在它已经是最大的外部来源，值得单独盯。
            internal 是 2026-09-19 改成会话归因之前留下的旧数据，新数据基本不会再有这一类。
          </Hint>
        </CardContent>
      </Card>

      {/* ───────── 热门页面 ───────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              热门页面
            </span>
            <span className="inline-flex overflow-hidden rounded-lg border border-gray-200 text-xs">
              {(
                [
                  { k: 'group', label: '归类后' },
                  { k: 'raw', label: '原始路径' },
                ] as const
              ).map((o) => (
                <button
                  key={o.k}
                  onClick={() => setPageMode(o.k)}
                  className={`px-3 py-1.5 font-normal transition-colors ${
                    pageMode === o.k
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pageRows.length === 0 ? (
            <Empty loading={loading} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-400">
                    <th className="pb-1 pr-2 font-medium">#</th>
                    <th className="pb-1 pr-2 font-medium">
                      {pageMode === 'raw' ? '路径' : '页面类型'}
                    </th>
                    <th className="pb-1 pr-2 text-right font-medium">PV</th>
                    <th
                      className="pb-1 pr-2 text-right font-medium"
                      title={
                        pageMode === 'group'
                          ? '各成员页面 UV 之和，未跨页去重：同一个人看了三篇新闻会被数三次'
                          : '独立访客数'
                      }
                    >
                      {pageMode === 'raw' ? 'UV' : 'UV 之和'}
                    </th>
                    {/* 归类模式下不出「人均」：uvSum 不是人数，pv/uvSum 也就不是人均页数，
                        算出来是个看着合理、实则没有含义的数字 */}
                    {pageMode === 'raw' && (
                      <th className="pb-1 pr-2 text-right font-medium">人均</th>
                    )}
                    <th className="pb-1 font-medium">占比</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r, i) => (
                    <tr key={`${r.path}-${i}`} className="border-b border-gray-50">
                      <td className="py-1.5 pr-2 text-xs tabular-nums text-gray-300">{i + 1}</td>
                      <td className="max-w-[320px] py-1.5 pr-2">
                        <div className="truncate text-gray-700" title={r.path}>
                          {r.path}
                        </div>
                      </td>
                      <td className="py-1.5 pr-2 text-right tabular-nums text-gray-900">
                        {int(r.pv)}
                      </td>
                      <td className="py-1.5 pr-2 text-right tabular-nums text-gray-500">
                        {int(r.uv)}
                      </td>
                      {pageMode === 'raw' && (
                        <td className="py-1.5 pr-2 text-right tabular-nums text-gray-400">
                          {r.uv > 0 ? (r.pv / r.uv).toFixed(2) : '—'}
                        </td>
                      )}
                      <td className="w-[140px] py-1.5">
                        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{ width: `${Math.min((r.pv / pageMaxPv) * 100, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Hint>
            「归类后」把 /news/xxx、/products/123 这类详情页各自收敛成一类（/news/*、/products/*）。
            不这么做，榜上永远是几百条各看了一两次的新闻页，真正要盯的 /chongzhi 反而被挤没了；
            要定位具体是哪一篇，再切到「原始路径」。
            归类视图的「UV 之和」是各成员页面 UV 相加，**没有跨页去重**——
            同一个人看了三篇新闻会被数三次，所以它只能横向比大小，不能当人数读；
            要看准确人数请切到「原始路径」。
            /admin、/api 以及带凭据的收据、支付、回复页从来不采集，所以这里看不到它们——
            不是漏了，是故意的。
          </Hint>
        </CardContent>
      </Card>

      {/* ───────── 外部来源站 + 入口页 ───────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ExternalLink className="h-5 w-5 text-amber-500" />
              外部来源站 Top 20
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referrers.length === 0 ? (
              <Empty loading={loading} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-gray-400">
                      <th className="pb-1 pr-2 font-medium">来源域名</th>
                      <th className="pb-1 pr-2 font-medium">类别</th>
                      <th className="pb-1 pr-2 text-right font-medium">PV</th>
                      <th className="pb-1 text-right font-medium">UV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrers.map((r, i) => (
                      <tr key={`${r.host}-${i}`} className="border-b border-gray-50">
                        <td className="max-w-[220px] py-1.5 pr-2">
                          <div className="truncate text-gray-700" title={r.host}>
                            {r.host}
                          </div>
                        </td>
                        <td className="py-1.5 pr-2">
                          {r.source ? (
                            <span
                              className="rounded px-1.5 py-0.5 text-[11px]"
                              style={{
                                background: `${sourceMeta(r.source).color}1a`,
                                color: sourceMeta(r.source).color,
                              }}
                            >
                              {sourceMeta(r.source).label}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="py-1.5 pr-2 text-right tabular-nums text-gray-900">
                          {int(r.pv)}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-gray-500">
                          {int(r.uv)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Hint>
              只记录来源域名，不存完整 URL——对方站的链接里可能带他们用户的隐私参数。
              所以这张表能告诉你「哪个站在给你带人」，但说不出「是他站内的哪一篇」，
              那个得去对方站或 Search Console 查。搜索引擎的域名也会混在这张表里，
              看外链效果时先按类别过滤掉它们。
            </Hint>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DoorOpen className="h-5 w-5 text-sky-500" />
              入口页 Top 15
            </CardTitle>
          </CardHeader>
          <CardContent>
            {entryPages.length === 0 ? (
              <Empty loading={loading} />
            ) : (
              <div className="space-y-2">
                {entryPages.map((r, i) => (
                  <div key={`${r.path}-${i}`}>
                    <div className="mb-0.5 flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-gray-600" title={r.path}>
                        {r.path || '(未知)'}
                      </span>
                      <span className="shrink-0 tabular-nums text-gray-900">
                        {int(r.visitors)} 人
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{ width: `${Math.min((r.visitors / entryMax) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Hint>
              统计的是每个访客<span className="text-gray-500">这辈子第一次进站</span>落在哪一页，
              一人只计一次，所以量级明显小于「热门页面」，两张表不能横着比。
              它回答的是「新人是从哪扇门进来的」：如果 /chongzhi 那批页面不在前列，
              说明它们还没成为真正的入口，SEO 还没生效。
            </Hint>
          </CardContent>
        </Card>
      </div>

      {/* ───────── 设备 + 分时段 ───────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-5 w-5 text-violet-500" />
              设备构成
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deviceTotal <= 0 ? (
              <Empty loading={loading} />
            ) : (
              <div className="space-y-3">
                {deviceRows.map((d) => {
                  const isMobile = d.device === 'mobile'
                  const Icon = isMobile ? Smartphone : Monitor
                  const ratio = (d.pv / deviceTotal) * 100
                  return (
                    <div key={d.device}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <Icon className="h-4 w-4 text-gray-400" />
                          {isMobile ? '移动端' : '桌面端'}
                        </span>
                        <span className="tabular-nums text-gray-900">
                          {int(d.pv)}
                          <span className="ml-1 text-xs text-gray-400">{pct(ratio, 0)}</span>
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${
                            isMobile ? 'bg-violet-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(ratio, 100)}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">UV {int(d.uv)}</p>
                    </div>
                  )
                })}
              </div>
            )}
            <Hint>
              只分移动端 / 桌面端两类，平板按 UA 归进移动端。不细分品牌与浏览器版本是故意的：
              这个站没有任何一条决策取决于「iPad 占比多少」。这个比例唯一的用处是——
              移动端过半就意味着 /chongzhi 那批落地页的首屏必须在手机上一眼看完。
            </Hint>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                分时段访问（0-23 点）
              </span>
              {peakHour >= 0 && (
                <span className="text-xs font-normal text-gray-500">
                  高峰 {String(peakHour).padStart(2, '0')}:00 · {int(hourMax)} PV
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hasHour ? (
              <Empty loading={loading} />
            ) : (
              <div className="flex items-end gap-1" style={{ height: HOUR_BAR_PX + 24 }}>
                {hours.map((v, h) => (
                  <div
                    key={h}
                    className="group flex flex-1 flex-col items-center justify-end"
                    title={`${String(h).padStart(2, '0')}:00 — ${int(v)} PV`}
                  >
                    <div
                      className={`w-full rounded-t transition-colors ${
                        h === peakHour ? 'bg-orange-500' : 'bg-orange-300 group-hover:bg-orange-400'
                      }`}
                      style={{
                        height:
                          v === 0 ? 1 : Math.max(Math.round((v / hourMax) * HOUR_BAR_PX), 2),
                      }}
                    />
                    <span className="mt-1 text-[10px] tabular-nums text-gray-400">
                      {h % 3 === 0 ? String(h).padStart(2, '0') : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Hint>
              按东八区小时聚合，跨多天时是各天同一小时的合计，区间越长曲线越平滑。
              它的用处只有一个：决定发新内容、发论坛帖、推朋友圈的时间点——
              在高峰前一两小时发，而不是在你自己有空的时候发。
            </Hint>
          </CardContent>
        </Card>
      </div>

      {/* 全页空态兜底：库里一条数据都没有时，别让人对着一排空框发呆 */}
      {!loading && !errMsg && data && data.totals.pv === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Globe className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">这个区间还没有数据</p>
            <p className="mt-1 text-xs text-gray-400">
              埋点要访客在前台页面停留满 3 秒才会产生第一条记录。换个更长的区间再看看。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
