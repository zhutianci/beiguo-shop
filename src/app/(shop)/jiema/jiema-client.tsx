'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Search, X, ChevronDown, ChevronRight, Globe2, Loader2, ArrowLeft, Eye } from 'lucide-react'
import { searchServices, searchCountries, effectiveQuery, serviceTokens, toSearchable } from '@/lib/jiema/search'
import { stockApprox, fmtYuan } from '@/lib/jiema/pricing'
import type { CatalogCountry, CatalogOperator, CatalogService } from '@/lib/jiema/dto'
import { cn } from '@/lib/utils'
import { CheckoutPanel } from './checkout-panel'

/**
 * /jiema 的交互部分（docs/短信接码-设计.md §1.4–§1.8、§1.13、§1.14）。
 *
 * 【三步】① 选服务（中文 / 拼音 / 别名 / 轻量纠错，搜不到引导「其他服务 Any other」）→ ② 选国家/地区（国旗、价格、库存三档、
 * 推荐 / 最便宜 / 库存多排序）→ ③ 确认面板（运营商收在「高级选项」里）。桌面两栏 + 底部固定确认条；手机分步全屏 + 底部抽屉。
 * 【状态进 URL】?s=&c=&op=&confirm=1：刷新、分享、登录回跳都不丢；桌面 replaceState，手机每进一步 pushState 并监听 popstate
 * （系统返回键 = 回到上一步，不离开 /jiema）。
 * 【不屏蔽任何平台】（D25）没有「不提供」的提示；搜索不看上游代码。
 * 【下单】（S2b）确认面板的付款方式、条款、提交与 409 弹窗在 checkout-panel.tsx；orderAvailable=false（总开关关着 / 普通用户灰度期）时「去支付」不可用，
 * 管理员预览时顶部有横幅说明（总开关开 + 仅管理员 = 管理员真钱验收）。
 * 【限高与滚动】确认面板最大高度 100dvh − 页头 − 16px，主体可滚动，按钮与退款说明钉在底栏（09-24 开票弹窗事故的教训）。
 * localStorage（排序偏好）一律 try/catch；换服务时不重置排序（§1.4）。
 * 【预取只给热门】（§1.4）悬停热门服务 150ms（或手指按下）才预取它的国家列表，每个服务每次打开页面最多预取一次、在途请求去重、
 * 带 ?pf=1（服务端不因预取触发上游刷新）；全部服务列表与搜索结果不预取——否则滚一下列表就把每分钟 60 次的限流用完（S1 评审修复）。
 */

export interface JiemaClientProps {
  services: CatalogService[]
  anyOther: CatalogService | null
  updatedAt: string | null
  stale: boolean
  degraded: boolean
  maintenance: boolean
  preview: boolean
  orderAvailable: boolean
  maxReplace: number
  /** 余额支付开关（wallet_config.balancePayEnabled，读不到按关）：关着时确认面板只有支付宝（§1.8） */
  balancePayOn: boolean
  /** 本人最近一张接码单同意过的两份条款版本（首单必勾，之后同一版默认勾选，§1.8）；没登录 / 没下过单为 null */
  lastTerms: { jiema: string | null; wallet: string | null } | null
}

interface CountryPayload {
  service: { code: string; name: string; en: string }
  durationMin: number
  countries: CatalogCountry[]
  sort: { recommended: number[] }
  stockKnown: boolean
  maintenance: boolean
}

type Step = 'service' | 'country' | 'confirm'
type SortMode = 'rec' | 'cheap' | 'stock'

const ROW_H = 56
const SORT_KEY = 'jiema:sort'
const CODE_RE = /^[a-z0-9]{2,4}$/

function readSort(): SortMode {
  try {
    const v = window.localStorage.getItem(SORT_KEY)
    return v === 'cheap' || v === 'stock' || v === 'rec' ? v : 'rec'
  } catch {
    return 'rec'
  }
}
function writeSort(v: SortMode): void {
  try {
    window.localStorage.setItem(SORT_KEY, v)
  } catch {
    /* 隐私模式 / 禁用存储：只是不记偏好 */
  }
}

function isDesktop(): boolean {
  try {
    return window.matchMedia('(min-width: 1024px)').matches
  } catch {
    return false
  }
}

/** URL → 选择状态 */
function parseUrl(search: string): { s: string | null; c: number | null; op: string | null; confirm: boolean } {
  const q = new URLSearchParams(search)
  const s = q.get('s')
  const cRaw = q.get('c')
  const op = q.get('op')
  return {
    s: s && CODE_RE.test(s) ? s : null,
    c: cRaw && /^\d{1,3}$/.test(cRaw) ? Number(cRaw) : null,
    op: op && /^[a-z0-9_]{1,40}$/i.test(op) && op !== 'any' ? op : null,
    confirm: q.get('confirm') === '1',
  }
}
function buildUrl(s: string | null, c: number | null, op: string | null, confirm: boolean): string {
  const q = new URLSearchParams()
  if (s) q.set('s', s)
  if (s && c != null) q.set('c', String(c))
  if (s && c != null && op) q.set('op', op)
  if (s && c != null && confirm) q.set('confirm', '1')
  const qs = q.toString()
  return `/jiema${qs ? `?${qs}` : ''}`
}

/** 字母头像：颜色按代码哈希确定（没有自托管图标时的兜底，§1.5） */
function Avatar({ code, label }: { code: string; label: string }) {
  let h = 0
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) % 360
  const ch = (label.trim()[0] || code[0] || '?').toUpperCase()
  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white/90"
      style={{ background: `hsl(${h} 55% 38% / 0.85)` }}
    >
      {ch}
    </span>
  )
}

/** 国家/地区标识：有旗帜键时显示 ISO2 徽标；台湾（flag=null）显示中性的地球图标（D44） */
function Flag({ flag }: { flag: string | null }) {
  if (!flag) return <Globe2 aria-hidden="true" className="h-5 w-7 shrink-0 text-white/45" />
  return (
    <span aria-hidden="true" className="flex h-5 w-7 shrink-0 items-center justify-center rounded border border-white/15 bg-white/[0.06] text-[10px] font-semibold tracking-wide text-white/70">
      {flag.toUpperCase()}
    </span>
  )
}

function StockTag({ c }: { c: CatalogCountry }) {
  const map: Record<string, [string, string]> = {
    PLENTY: ['bg-emerald-400', '充足'],
    MANY: ['bg-lime-300', '较多'],
    LOW: ['bg-amber-400', '紧张'],
    OUT: ['bg-white/25', '售罄'],
    AVAILABLE: ['bg-emerald-400', '有货'],
  }
  const [dot, text] = map[c.level] ?? map.OUT
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-white/55">
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
      {text}
      {c.stock != null && c.level !== 'OUT' && c.level !== 'AVAILABLE' ? ` ${stockApprox(c.stock)}` : ''}
    </span>
  )
}

/** 超过 60 行时虚拟滚动（固定行高），否则普通列表 */
function RowList<T>({ items, height, keyOf, render }: { items: T[]; height: number; keyOf: (t: T) => string | number; render: (t: T) => React.ReactNode }) {
  const [top, setTop] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // 列表内容整体换掉时回到顶部（换服务、换排序、搜索词变了）
    setTop(0)
    if (ref.current) ref.current.scrollTop = 0
  }, [items])
  if (items.length <= 60) {
    return (
      <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: height }}>
        {items.map((t) => (
          <div key={keyOf(t)} style={{ height: ROW_H }}>
            {render(t)}
          </div>
        ))}
      </div>
    )
  }
  const start = Math.max(0, Math.floor(top / ROW_H) - 8)
  const end = Math.min(items.length, Math.ceil((top + height) / ROW_H) + 8)
  return (
    <div ref={ref} className="overflow-y-auto overscroll-contain" style={{ height }} onScroll={(e) => setTop(e.currentTarget.scrollTop)}>
      <div style={{ height: items.length * ROW_H, position: 'relative' }}>
        {items.slice(start, end).map((t, i) => (
          <div key={keyOf(t)} style={{ position: 'absolute', top: (start + i) * ROW_H, left: 0, right: 0, height: ROW_H }}>
            {render(t)}
          </div>
        ))}
      </div>
    </div>
  )
}

function fromText(s: CatalogService): string {
  if (s.level === 'OUT') return '暂无号码'
  if (s.level === 'UNKNOWN' || s.fromCents == null) return '起价以实际为准'
  return `${s.approx ? '约 ' : ''}${fmtYuan(s.fromCents)} 起`
}

const ANY_OTHER_NOTE = '「其他服务」用于列表里没有的平台。列表里已有的平台（如 OpenAI、Telegram）请选对应项，选这里多半收不到它们的短信，收不到时整单退回余额（不可提现）。'

export function JiemaClient(props: JiemaClientProps) {
  const { services, anyOther, maxReplace } = props
  const byCode = useMemo(() => new Map(services.map((s) => [s.code, s])), [services])

  // ---------- 选择状态（与 URL 同步） ----------
  const [svc, setSvc] = useState<string | null>(null)
  const [country, setCountry] = useState<number | null>(null)
  const [op, setOp] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('service')
  const pushed = useRef(0)

  const apply = useCallback(
    (next: { s: string | null; c: number | null; op: string | null; step: Step }, mode: 'push' | 'replace' | 'none') => {
      setSvc(next.s)
      setCountry(next.c)
      setOp(next.op)
      setStep(next.step)
      if (mode === 'none') return
      const url = buildUrl(next.s, next.c, next.op, next.step === 'confirm')
      try {
        if (mode === 'push' && !isDesktop()) {
          window.history.pushState({ jiema: true }, '', url)
          pushed.current++
        } else window.history.replaceState(window.history.state, '', url)
      } catch {
        /* 老浏览器：不同步 URL */
      }
    },
    [],
  )

  // 首次进入：从 URL 恢复（登录回跳、分享、刷新）；之后监听系统返回
  useEffect(() => {
    const fromLocation = () => {
      const p = parseUrl(window.location.search)
      const s = p.s && byCode.has(p.s) ? p.s : null
      const c = s ? p.c : null
      const st: Step = s && c != null && p.confirm ? 'confirm' : s ? 'country' : 'service'
      apply({ s, c, op: c != null ? p.op : null, step: st }, 'none')
    }
    fromLocation()
    const onPop = () => {
      if (pushed.current > 0) pushed.current--
      fromLocation()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [apply, byCode])

  /** 回到上一步：手机上自己 push 过的就 history.back()（与系统返回键同一条路），否则直接改状态 */
  const back = useCallback(
    (to: Step) => {
      if (!isDesktop() && pushed.current > 0) {
        window.history.back()
        return
      }
      // 选择都保留（「点 × 回到上一步，其他选择保留」，§1.4）
      apply({ s: svc, c: country, op, step: to }, 'replace')
    },
    [apply, svc, country, op],
  )

  // ---------- 服务搜索（输入法组字期间不过滤） ----------
  const [input, setInput] = useState('')
  const [composing, setComposing] = useState(false)
  const [committed, setCommitted] = useState('')
  const query = effectiveQuery(input, composing, committed).trim()
  // 目录 DTO 的中文名在 name 里：先转成可搜索的形状（cn = name、pop = 人气顺序），片段预先算好（S1 评审修复：原来中文名搜不到）
  const searchable = useMemo(() => toSearchable(services), [services])
  const tokens = useMemo(() => new Map(searchable.map((s) => [s, serviceTokens(s)] as const)), [searchable])
  const hits = useMemo(() => (query ? searchServices(query, searchable, { tokens }).map((h) => h.item as CatalogService) : null), [query, searchable, tokens])
  const hot = useMemo(() => services.filter((s) => s.hot != null && s.code !== anyOther?.code).sort((a, b) => (a.hot ?? 0) - (b.hot ?? 0)), [services, anyOther])

  // ---------- 列表高度（虚拟滚动用） ----------
  const [listH, setListH] = useState(480)
  useEffect(() => {
    const f = () => setListH(isDesktop() ? 520 : Math.max(320, window.innerHeight - 300))
    f()
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])

  // ---------- 国家/地区（按服务缓存；只对热门服务预取，§1.4） ----------
  const cache = useRef(new Map<string, CountryPayload>())
  /** 在途请求去重：预取还没回来时点了同一个服务，复用那一个请求，不发第二次 */
  const inflight = useRef(new Map<string, Promise<{ ok: true; data: CountryPayload } | { ok: false; error: string }>>())
  const [cData, setCData] = useState<{ code: string; loading: boolean; error: string | null; data: CountryPayload | null } | null>(null)
  const fetchCountries = useCallback((code: string, prefetch: boolean) => {
    let p = inflight.current.get(code)
    if (!p) {
      p = (async () => {
        try {
          const res = await fetch(`/api/jiema/catalog/${encodeURIComponent(code)}${prefetch ? '?pf=1' : ''}`)
          const d = await res.json().catch(() => null)
          if (d?.success) {
            cache.current.set(code, d.data as CountryPayload)
            return { ok: true as const, data: d.data as CountryPayload }
          }
          return { ok: false as const, error: (d?.error as string) || '国家/地区列表加载失败' }
        } catch {
          return { ok: false as const, error: '国家/地区列表加载失败' }
        } finally {
          inflight.current.delete(code)
        }
      })()
      inflight.current.set(code, p)
    }
    return p
  }, [])
  const loadCountries = useCallback(
    async (code: string, opts: { force?: boolean } = {}) => {
      const hit = cache.current.get(code)
      if (hit && !opts.force) {
        setCData({ code, loading: false, error: null, data: hit })
        return
      }
      setCData({ code, loading: true, error: null, data: null })
      const r = await fetchCountries(code, false)
      setCData((cur) => (cur && cur.code !== code ? cur : r.ok ? { code, loading: false, error: null, data: r.data } : { code, loading: false, error: r.error, data: null }))
    },
    [fetchCountries],
  )
  useEffect(() => {
    if (svc) loadCountries(svc)
    else setCData(null)
  }, [svc, loadCountries])
  /** 每个服务每次打开页面最多预取一次（失败也不再重试：点进去时正常加载，有「重试」） */
  const prefetched = useRef(new Set<string>())
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoverStart = useCallback(
    (code: string) => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current)
      hoverTimer.current = null
      if (cache.current.has(code) || prefetched.current.has(code)) return
      hoverTimer.current = setTimeout(() => {
        hoverTimer.current = null
        if (cache.current.has(code) || prefetched.current.has(code)) return
        prefetched.current.add(code)
        void fetchCountries(code, true)
      }, 150)
    },
    [fetchCountries],
  )
  const hoverEnd = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = null
  }, [])
  useEffect(() => hoverEnd, [hoverEnd])

  // ---------- 排序（偏好存 localStorage，换服务不重置） ----------
  const [sort, setSortState] = useState<SortMode>('rec')
  useEffect(() => setSortState(readSort()), [])
  const setSort = (v: SortMode) => {
    setSortState(v)
    writeSort(v)
  }
  const [cQuery, setCQuery] = useState('')
  useEffect(() => setCQuery(''), [svc])

  const payload = cData && cData.code === svc ? cData.data : null
  const sortedCountries = useMemo(() => {
    if (!payload) return []
    const list = payload.countries.slice()
    const buyable = (c: CatalogCountry) => c.level !== 'OUT' && !c.paused && c.priceCents != null
    const tail = (a: CatalogCountry, b: CatalogCountry) => Number(buyable(b)) - Number(buyable(a))
    const mode: SortMode = sort === 'stock' && !payload.stockKnown ? 'rec' : sort
    if (mode === 'rec' && payload.sort.recommended.length) {
      const idx = new Map(payload.sort.recommended.map((id, i) => [id, i]))
      list.sort((a, b) => tail(a, b) || (idx.get(a.id) ?? 1e6) - (idx.get(b.id) ?? 1e6))
    } else if (mode === 'stock') {
      list.sort((a, b) => tail(a, b) || (b.stock ?? 0) - (a.stock ?? 0) || (a.priceCents ?? 1e9) - (b.priceCents ?? 1e9))
    } else {
      // 最便宜（「推荐」没有上游排序数据时也按价格）
      list.sort((a, b) => tail(a, b) || (a.priceCents ?? 1e9) - (b.priceCents ?? 1e9) || a.id - b.id)
    }
    return cQuery.trim() ? searchCountries(cQuery, list) : list
  }, [payload, sort, cQuery])
  const allOut = !!payload && payload.countries.length > 0 && payload.countries.every((c) => c.level === 'OUT' || !!c.paused)
  const picked = payload?.countries.find((c) => c.id === country) ?? null
  const service = svc ? (byCode.get(svc) ?? null) : null

  // ---------- 运营商（确认面板的高级选项） ----------
  const [advOpen, setAdvOpen] = useState(false)
  const [fallback, setFallback] = useState(true)
  const [ops, setOps] = useState<{ key: string; list: CatalogOperator[] | null; error: boolean } | null>(null)
  useEffect(() => {
    if (!svc || country == null || step !== 'confirm') return
    const key = `${svc}:${country}`
    if (ops?.key === key) return
    setOps({ key, list: null, error: false })
    fetch(`/api/jiema/catalog/${encodeURIComponent(svc)}/${country}/operators`)
      .then((r) => r.json())
      .then((d) => setOps((cur) => (cur && cur.key !== key ? cur : { key, list: d?.success ? (d.data.operators as CatalogOperator[]) : [], error: !d?.success })))
      .catch(() => setOps((cur) => (cur && cur.key !== key ? cur : { key, list: [], error: true })))
  }, [svc, country, step, ops?.key])
  const opName = op ? (ops?.list?.find((o) => o.code === op)?.name ?? op) : '任意'
  const onFallback = (v: boolean) => {
    if (!v && !window.confirm('该运营商可能没有号码。取不到号时本单会取消，钱退回站内余额（不可提现），确定只要这个运营商吗？')) return
    setFallback(v)
  }

  // ---------- 操作 ----------
  const chooseService = (code: string) => {
    const keepCountry = code === svc ? country : null
    apply({ s: code, c: keepCountry, op: keepCountry != null ? op : null, step: 'country' }, 'push')
    setInput('')
    setCommitted('')
  }
  const chooseCountry = (c: CatalogCountry) => {
    if (c.level === 'OUT' || c.paused || c.priceCents == null) return
    apply({ s: svc, c: c.id, op: c.id === country ? op : null, step: 'country' }, 'replace')
  }
  const openConfirm = () => {
    if (!svc || country == null) return
    apply({ s: svc, c: country, op, step: 'confirm' }, 'push')
  }
  const chooseOp = (code: string | null) => apply({ s: svc, c: country, op: code, step }, 'replace')

  const payLabel = props.orderAvailable ? '去支付' : props.preview ? '管理员预览：总开关关着，暂不能下单' : '即将开放'

  // =====================================================================
  return (
    <div>
      {props.preview && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-3 text-[13px] text-cyan-50/90">
          <Eye className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            管理员预览：普通用户现在看到的是「短信接码即将开放」，导航与 sitemap 里也没有这一页。
            {props.orderAvailable ? '总开关已打开（受众仅管理员）：可以真钱下单验收，号码页、后台订单与成本利润都能看到。' : '总开关关着：可以试选服务、国家/地区和运营商，「去支付」不可用。'}
          </span>
        </div>
      )}
      {props.maintenance && (
        <div className="mb-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-100/90">
          接码服务维护中，预计很快恢复。已付款的订单照常处理；因服务异常取不到号的，会自动取消并退回余额。
        </div>
      )}
      <p className="mb-3 text-xs text-white/40">
        价格每 10 分钟更新，下单时以实时价格为准
        {props.stale && props.updatedAt ? `（最近更新 ${new Date(props.updatedAt).toLocaleString('zh-CN', { hour12: false })}）` : ''}
      </p>

      {/* 步骤条 */}
      <ol className="mb-4 flex items-center gap-2 text-xs text-white/45">
        {(['service', 'country', 'confirm'] as Step[]).map((k, i) => {
          const done = (k === 'service' && !!svc) || (k === 'country' && country != null)
          const cur = step === k
          return (
            <li key={k} className="flex items-center gap-2">
              {i > 0 && <span className="h-px w-6 bg-white/15 sm:w-10" />}
              <span className={cn('inline-flex items-center gap-1', cur ? 'text-white' : done ? 'text-white/70' : '')}>
                <span className={cn('h-2 w-2 rounded-full', cur ? 'bg-cyan-300' : done ? 'bg-white/60' : 'border border-white/30')} />
                {k === 'service' ? '选服务' : k === 'country' ? '选国家/地区' : '确认支付'}
              </span>
            </li>
          )
        })}
      </ol>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-5">
        {/* ① 服务 */}
        <section aria-label="选择服务" className={cn('glass rounded-3xl p-4 sm:p-5', step !== 'service' && 'hidden lg:block')}>
          <div className="mb-3 text-sm font-medium text-white/80">① 选择服务</div>
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 focus-within:border-cyan-400/50">
            <Search className="h-4 w-4 text-white/40" />
            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                if (!composing) setCommitted(e.target.value)
              }}
              onCompositionStart={() => setComposing(true)}
              onCompositionEnd={(e) => {
                setComposing(false)
                setCommitted((e.target as HTMLInputElement).value)
              }}
              placeholder="搜索服务：电报 / telegram / 微信"
              aria-label="搜索服务"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
            />
            {input && (
              <button onClick={() => { setInput(''); setCommitted('') }} aria-label="清空" className="text-white/40 hover:text-white/80">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>

          {services.length === 0 ? (
            // 目录由服务端同步预取：真正加载失败时整页 500，走不到这里；能走到这里的是目录为空（刚部署还没同步、全部手动下架…）
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/50">
              目录还在同步中，请稍后再来
              {props.preview && <div className="mt-2 text-xs text-white/40">管理员：到后台「短信接码 → 目录」点「全部同步」</div>}
            </div>
          ) : hits ? (
            hits.length ? (
              <div className="mt-3">
                <RowList items={hits} height={listH} keyOf={(s) => s.code} render={(s) => <ServiceRow s={s} active={s.code === svc} onPick={chooseService} />} />
              </div>
            ) : (
              <div className="mt-3">
                {anyOther && (
                  <div style={{ height: ROW_H }}>
                    <ServiceRow s={anyOther} active={svc === anyOther.code} onPick={chooseService} sub="列表里没有的平台才选" />
                  </div>
                )}
                <p className="mt-3 text-[13px] leading-relaxed text-white/50">
                  没找到「{query}」。可以选「其他服务」接收任意平台的短信。注意：列表里已有的平台请选对应项，选「其他服务」可能收不到它们的短信。换个说法搜？比如英文名、App 名称。
                </p>
              </div>
            )
          ) : (
            <div className="mt-4 space-y-4">
              {hot.length > 0 && (
                <div>
                  <div className="mb-1.5 text-xs text-white/40">热门</div>
                  {hot.map((s) => (
                    <div key={s.code} style={{ height: ROW_H }}>
                      <ServiceRow s={s} active={s.code === svc} onPick={chooseService} onHover={hoverStart} onLeave={hoverEnd} />
                    </div>
                  ))}
                  {anyOther && (
                    <div style={{ height: ROW_H }}>
                      <ServiceRow s={anyOther} active={svc === anyOther.code} onPick={chooseService} onHover={hoverStart} onLeave={hoverEnd} sub="列表里没有的平台才选" />
                    </div>
                  )}
                </div>
              )}
              <div>
                <div className="mb-1.5 text-xs text-white/40">全部服务（{services.length}）· 按人气</div>
                <RowList items={services} height={listH} keyOf={(s) => s.code} render={(s) => <ServiceRow s={s} active={s.code === svc} onPick={chooseService} />} />
              </div>
            </div>
          )}
        </section>

        {/* ② 国家/地区 */}
        <section aria-label="选择国家/地区" className={cn('glass mt-0 rounded-3xl p-4 sm:p-5 lg:mt-0', step === 'service' && 'hidden lg:block')}>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-medium text-white/80">
            <button onClick={() => back('service')} className="-ml-1 rounded-full p-1 text-white/60 hover:bg-white/10 lg:hidden" aria-label="返回选服务">
              <ArrowLeft className="h-4 w-4" />
            </button>
            ② 选择国家/地区
            {service && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-0.5 text-xs text-white/80">
                {service.name}
                <button onClick={() => back('service')} aria-label="重选服务" className="text-white/50 hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
          </div>
          {!svc ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center text-sm text-white/40">先在左边选一个服务</div>
          ) : (
            <>
              {svc === anyOther?.code && <p className="mb-3 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100/85">{ANY_OTHER_NOTE}</p>}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <label className="flex min-w-[10rem] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 focus-within:border-cyan-400/50">
                  <Search className="h-4 w-4 text-white/40" />
                  <input value={cQuery} onChange={(e) => setCQuery(e.target.value)} placeholder="国家/地区 / 区号" aria-label="搜索国家/地区" className="w-full bg-transparent text-sm outline-none placeholder:text-white/35" />
                </label>
                <div className="flex gap-1 text-xs">
                  {(
                    [
                      ['rec', '推荐'],
                      ['cheap', '最便宜'],
                      ['stock', '库存多'],
                    ] as Array<[SortMode, string]>
                  ).map(([k, label]) => {
                    const disabled = k === 'stock' && !!payload && !payload.stockKnown
                    return (
                      <button
                        key={k}
                        disabled={disabled}
                        onClick={() => setSort(k)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-35',
                          sort === k && !disabled ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-100' : 'border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/10',
                        )}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
                <span className="ml-auto text-xs text-white/40">有效期 {payload?.durationMin ?? 20} 分钟</span>
              </div>
              {!cData || cData.loading ? (
                <div className="space-y-2" aria-busy="true">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-11 animate-pulse rounded-xl bg-white/[0.05]" />
                  ))}
                </div>
              ) : cData.error ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-white/50">
                  {cData.error}
                  <button onClick={() => svc && loadCountries(svc, { force: true })} className="ml-2 text-cyan-300/90 hover:underline">
                    重试
                  </button>
                </div>
              ) : !payload || payload.countries.length === 0 || allOut ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-white/55">
                  {allOut && payload && payload.countries.length ? '该服务暂时没有可用号码。可以稍后再来，或选择「其他服务」' : '该服务暂时没有可用号码'}
                  {anyOther && svc !== anyOther.code && (
                    <button onClick={() => chooseService(anyOther.code)} className="ml-2 text-cyan-300/90 hover:underline">
                      选其他服务
                    </button>
                  )}
                </div>
              ) : sortedCountries.length === 0 ? (
                <div className="py-10 text-center text-sm text-white/45">没有找到这个国家/地区</div>
              ) : (
                <RowList
                  items={sortedCountries}
                  height={listH}
                  keyOf={(c) => c.id}
                  render={(c) => <CountryRow c={c} active={c.id === country} onPick={chooseCountry} />}
                />
              )}
            </>
          )}
        </section>
      </div>

      {/* 底部固定确认条（z-50，高于右下角客服按钮与左下角成交弹窗的 z-40） */}
      {service && picked && step !== 'confirm' && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="container flex max-w-6xl items-center gap-3 py-3">
            <Flag flag={picked.flag} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-white/85">
                <span className="hidden sm:inline">{service.name} · </span>
                {picked.name}
                <span className="hidden sm:inline"> · 运营商：{opName}</span>
              </div>
              <div className="hidden truncate text-xs text-white/45 sm:block">20 分钟有效 · 取号 2 分钟后可换号或取消 · 没收到短信整单退回站内余额（不可提现）</div>
            </div>
            <div className="text-lg font-semibold tabular-nums">{picked.priceCents != null ? `${picked.approx ? '约 ' : ''}${fmtYuan(picked.priceCents)}` : '—'}</div>
            <button onClick={openConfirm} className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-medium">
              <span className="lg:hidden">下一步</span>
              <span className="hidden lg:inline">确认订单</span>
            </button>
          </div>
        </div>
      )}

      {/* ③ 确认面板：桌面是确认条展开，手机是第 3 步抽屉；限高、主体滚动、按钮与退款说明钉在底栏（checkout-panel.tsx） */}
      {service && picked && step === 'confirm' && (
        <CheckoutPanel
          service={{ code: service.code, name: service.name }}
          country={{ id: picked.id, name: picked.name, dial: picked.dial, flag: <Flag flag={picked.flag} /> }}
          op={op}
          opName={opName}
          fallback={fallback}
          priceCents={picked.priceCents}
          approx={picked.approx}
          maxReplace={maxReplace}
          anyOtherNote={svc === anyOther?.code ? ANY_OTHER_NOTE : null}
          orderAvailable={props.orderAvailable}
          payDisabledLabel={payLabel}
          balancePayOn={props.balancePayOn}
          lastTerms={props.lastTerms}
          onClose={() => back('country')}
          advanced={
            <div className="rounded-xl border border-white/10 bg-white/[0.03]">
              <button onClick={() => setAdvOpen((v) => !v)} className="flex w-full items-center gap-1 px-3 py-2 text-left text-[13px] text-white/70">
                {advOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                高级选项（运营商：{opName}）
              </button>
              {advOpen && (
                <div className="space-y-2 border-t border-white/10 px-3 py-3 text-[13px]">
                  {!ops || ops.list == null ? (
                    <div className="flex items-center gap-2 text-white/45">
                      <Loader2 className="h-4 w-4 animate-spin" /> 正在加载运营商…
                    </div>
                  ) : ops.error ? (
                    <div className="text-white/45">
                      运营商加载失败，暂按任意运营商
                      <button onClick={() => setOps(null)} className="ml-2 text-cyan-300/90 hover:underline">
                        重试
                      </button>
                    </div>
                  ) : ops.list.length === 0 ? (
                    <div className="text-white/45">这个国家/地区不支持指定运营商，将使用任意运营商。</div>
                  ) : (
                    <>
                      <label className="flex flex-wrap items-center gap-2 text-white/70">
                        运营商
                        <select
                          value={op ?? ''}
                          onChange={(e) => chooseOp(e.target.value || null)}
                          className="rounded-lg border border-white/15 bg-[#15151f] px-2 py-1.5 text-white outline-none"
                        >
                          <option value="">任意运营商（推荐）</option>
                          {ops.list.map((o) => (
                            <option key={o.code} value={o.code}>
                              {o.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <p className="text-xs leading-relaxed text-white/45">同一国家/地区内按运营商挑号，不影响价格。指定后可选的号码会变少，有的运营商可能没有号码。</p>
                      {op && (
                        <label className="flex items-start gap-2 text-xs text-white/65">
                          <input type="checkbox" className="mt-0.5" checked={fallback} onChange={(e) => onFallback(e.target.checked)} />
                          指定的运营商没号时，自动改用任意运营商
                        </label>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          }
        />
      )}
    </div>
  )
}

/** onHover 只传给热门那一段（§1.4：只预取热门服务的国家列表）；全部服务与搜索结果不传 */
function ServiceRow({ s, active, onPick, onHover, onLeave, sub }: { s: CatalogService; active: boolean; onPick: (code: string) => void; onHover?: (code: string) => void; onLeave?: () => void; sub?: string }) {
  const out = s.level === 'OUT'
  return (
    <button
      onClick={() => onPick(s.code)}
      onMouseEnter={onHover ? () => onHover(s.code) : undefined}
      onMouseLeave={onLeave}
      onTouchStart={onHover ? () => onHover(s.code) : undefined}
      onTouchMove={onLeave}
      className={cn(
        'flex h-full w-full items-center gap-3 rounded-xl px-2 text-left transition-colors',
        active ? 'bg-cyan-500/10 ring-1 ring-cyan-400/40' : 'hover:bg-white/[0.06]',
        out && 'opacity-50',
      )}
    >
      <Avatar code={s.code} label={s.en || s.name} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-white/90">
          {s.name}
          {s.en && s.en !== s.name && <span className="text-white/40"> · {s.en}</span>}
        </span>
        {sub && <span className="block truncate text-[11px] text-white/40">{sub}</span>}
      </span>
      <span className={cn('shrink-0 text-xs tabular-nums', out ? 'text-white/35' : 'text-white/70')}>{fromText(s)}</span>
    </button>
  )
}

function CountryRow({ c, active, onPick }: { c: CatalogCountry; active: boolean; onPick: (c: CatalogCountry) => void }) {
  const disabled = c.level === 'OUT' || !!c.paused || c.priceCents == null
  return (
    <button
      onClick={() => onPick(c)}
      disabled={disabled}
      title={c.paused ?? undefined}
      className={cn(
        'flex h-full w-full items-center gap-3 rounded-xl px-2 text-left transition-colors disabled:cursor-not-allowed',
        active ? 'bg-cyan-500/10 ring-1 ring-cyan-400/40' : 'hover:bg-white/[0.06]',
        disabled && 'opacity-45',
      )}
    >
      <Flag flag={c.flag} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-white/90">
          {c.name}
          {c.dial && <span className="text-white/40"> +{c.dial}</span>}
          {c.tags.map((t) => (
            <span key={t} className="ml-1.5 rounded-full bg-purple-500/20 px-1.5 py-0.5 align-middle text-[10px] text-purple-200">
              {t}
            </span>
          ))}
        </span>
        {c.paused ? <span className="block truncate text-[11px] text-amber-200/70">{c.paused}</span> : <StockTag c={c} />}
      </span>
      <span className="shrink-0 text-sm font-medium tabular-nums text-white/85">
        {c.level === 'OUT' || c.priceCents == null ? '—' : `${c.approx ? '约 ' : ''}${fmtYuan(c.priceCents)}`}
      </span>
    </button>
  )
}
