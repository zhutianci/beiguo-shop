'use client'

/**
 * 短信接码后台（docs/短信接码-设计.md 第 7 章的 S1 部分：§7.3 定价、§7.4 目录、§7.6 设置，外加 §7.1 顶部的状态行与停售规则）。
 * 数据全部经 adminGuard 的 /api/admin/jiema/*；页面本身不是闸门，改动都由接口写审计。
 *
 * 【定价预览与列表价、下单价同一个函数】预览表直接用 lib/jiema/pricing.ts 的纯函数（priceCombo → salePriceCents，覆盖规则按
 * resolveRule 解析）现算「当前 → 新」：当前 = 已保存的配置 + 已生效的规则；新 = 表单里还没保存的值 + 同一套规则（正在编辑的规则也算进去）。
 * 【0.8 规则】dr、acz 的每一行并排显示对应旧单品现价（同服务同国家/地区，或随机地区；取高者），新售价 ≥ 单品 × 0.8 显示 ✓，否则 ✗ 整行标红；
 * 保存时有 ✗ 弹二次确认（不拦保存，由站长决定，D13、Q1）。保存配置、保存规则之前都单独拉 dr、acz 的**全部**组合核对
 * （legacyRatioFailures；不受预览筛选与「最便宜 8 个」的限制，S1 评审修复）。
 * 【手动下架 / 停售出厂为空】（D25）服务 / 国家的 OFF 要填原因；disabled 规则要写备注；「+ 手动停售」要写原因。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import {
  priceCombo,
  realCostCents,
  resolveRule,
  meetsLegacyRatio,
  legacyFloorCents,
  legacyRatioFailures,
  canonicalScopeKey,
  canonicalHoldKey,
  LEGACY_GUARDED_SERVICES,
  microToUsd4,
  usdToCentsCeil,
  type PriceRuleLike,
} from '@/lib/jiema/pricing'
import { FACTORY_SMS_CONFIG, settingsNumberValue, type SmsConfig } from '@/lib/jiema-config-schema'
import { OverviewTab, type OverviewS2 } from './overview-tab'
import { OrdersTab } from './orders-tab'

type Tab = 'overview' | 'orders' | 'pricing' | 'catalog' | 'settings'
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: '概览' },
  { id: 'orders', label: '订单' },
  { id: 'pricing', label: '定价' },
  { id: 'catalog', label: '目录' },
  { id: 'settings', label: '设置' },
]

interface Overview {
  sale: { configOk: boolean; configReason: string | null; enabled: boolean; audience: string | null; version: number; publicOpen: boolean; orderAvailable: boolean }
  pricing: { saleCoef4: number; costFx4: number; markupCents: number; minPriceCents: number; rounding: string } | null
  catalog: {
    catalogAt: string | null
    staticAt: string | null
    pricesAt: string | null
    pricesFails: number
    lastError: string | null
    counts: { services: number; countries: number; combos: number } | null
    stale: boolean
    staticStale: boolean
    degraded: boolean
  }
  manual: { servicesOff: number; countriesOff: number; adminHolds: number; activeHolds: number; globalHold: boolean; disabledRules: number; rules: number }
  upstream: { configured: boolean }
  /** 生效中的停售（sms_holds） */
  holds?: Array<{ key: string; until: string | null; source: string }>
  /** S2b：上游余额、在途占用、今日单量与成本利润、需要处理、组合表（§7.1）；读失败为 null */
  s2?: OverviewS2 | null
  s2Error?: string | null
}

interface ConfigResp {
  config: SmsConfig | null
  reason: string | null
  errors: Record<string, string> | null
  storedVersion: number
  factory: SmsConfig
  orderAvailable: boolean
  warnings: string[]
}

interface Rule {
  id: number
  scopeKey: string
  markupCents: number | null
  tolerancePct: number | null
  disabled: boolean
  note: string | null
  updatedAt: string
}

interface PreviewRow {
  service: string
  serviceName: string
  country: number
  countryName: string
  flag: string | null
  costMicro: number
  source: 'OFFERS' | 'PRICES'
  legacy: { priceCents: number; names: string[] } | null
}

// ───────────────────────── 小工具 ─────────────────────────

function yuan(cents: number | null | undefined): string {
  if (cents == null) return '—'
  const neg = cents < 0
  const a = Math.abs(cents)
  return `${neg ? '-' : ''}¥${Math.floor(a / 100)}.${String(a % 100).padStart(2, '0')}`
}
const usd = (micro: number | null | undefined) => (micro == null ? '—' : `$${microToUsd4(micro)}`)
function fmt(s: string | null | undefined) {
  if (!s) return '—'
  return new Date(s).toLocaleString('zh-CN', { hour12: false })
}
function ago(s: string | null | undefined): string {
  if (!s) return '从未'
  const m = Math.floor((Date.now() - Date.parse(s)) / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  return h < 48 ? `${h} 小时前` : `${Math.floor(h / 24)} 天前`
}
/** 「8.00」→ 80000（×10000）；不合法 null。不经过浮点乘法 */
function parseCoef(s: string): number | null {
  const m = /^\s*(\d{1,3})(?:\.(\d{1,4}))?\s*$/.exec(s)
  if (!m) return null
  return Number(m[1]) * 10000 + Number((m[2] ?? '').padEnd(4, '0'))
}
const coefStr = (c4: number) => `${Math.floor(c4 / 10000)}.${String(c4 % 10000).padStart(4, '0').replace(/0{1,2}$/, '')}`
/** 「1.50」→ 150 分 */
function parseYuan(s: string): number | null {
  const m = /^\s*(\d{1,4})(?:\.(\d{1,2}))?\s*$/.exec(s)
  if (!m) return null
  return Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'))
}
const yuanStr = (c: number) => `${Math.floor(c / 100)}.${String(c % 100).padStart(2, '0')}`
/** 「0.024」→ 24000 微美元 */
function parseUsdMicro(s: string): number | null {
  const m = /^\s*(\d{1,4})(?:\.(\d{1,6}))?\s*$/.exec(s)
  if (!m) return null
  return Number(m[1]) * 1_000_000 + Number((m[2] ?? '').padEnd(6, '0'))
}
const intOr = (s: string): number | null => (/^\s*-?\d{1,9}\s*$/.test(s) ? Number(s) : null)

function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const seq = useRef(0)
  const reload = useCallback(async () => {
    if (!url) return
    const my = ++seq.current
    setErr(null)
    try {
      const res = await fetch(url, { cache: 'no-store' })
      const d = await res.json().catch(() => null)
      if (my !== seq.current) return
      if (d?.success) setData(d.data as T)
      else setErr(d?.error || `加载失败（HTTP ${res.status}）`)
    } catch {
      if (my === seq.current) setErr('网络异常，加载失败')
    }
  }, [url])
  useEffect(() => {
    reload()
  }, [reload])
  return { data, err, reload }
}

async function send(method: string, url: string, body?: unknown): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
    const d = await res.json().catch(() => null)
    return { ok: !!d?.success, status: res.status, data: d }
  } catch {
    return { ok: false, status: 0, data: { error: '网络异常' } }
  }
}

function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

const inputCls = 'rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none'

// ───────────────────────── 页面 ─────────────────────────

export default function AdminJiemaPage() {
  // 默认页是「概览」（§7.1）；?tab=orders&q=<订单号> 从推送 / 告警直接进订单（接码单留言推送里的「后台详情」）
  const [tab, setTab] = useState<Tab>('overview')
  const [initialQ, setInitialQ] = useState<string | null>(null)
  const [openId, setOpenId] = useState<number | null>(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const t = sp.get('tab') as Tab | null
    if (t && TABS.some((x) => x.id === t)) setTab(t)
    const q = sp.get('q')
    if (q && /^[0-9A-Za-z]{4,32}$/.test(q)) setInitialQ(q)
    setReady(true)
  }, [])
  const openOrder = (id: number) => {
    setOpenId(id)
    setTab('orders')
  }
  const unhold = async (key: string) => {
    if (!window.confirm(`解除停售 ${key}？`)) return
    const r = await send('DELETE', `/api/admin/jiema/holds?key=${encodeURIComponent(key)}`)
    if (!r.ok) window.alert(r.data?.error || '解除失败')
    ov.reload()
  }
  const ov = useApi<Overview>('/api/admin/jiema/overview')
  const cfg = useApi<ConfigResp>('/api/admin/jiema/config')
  const reloadAll = () => {
    ov.reload()
    cfg.reload()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">短信接码</h1>
        <Button variant="outline" size="sm" onClick={reloadAll}>
          <RefreshCw className="mr-1 h-4 w-4" /> 刷新
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-1.5 py-4 text-sm text-gray-700">
          {ov.err && <div className="text-red-600">{ov.err}</div>}
          {!ov.data && !ov.err && <div className="text-gray-400">加载中...</div>}
          {ov.data && (
            <>
              <div>
                销售：
                {!ov.data.sale.configOk ? (
                  <span className="font-medium text-red-600">✗ sms_config 读取失败（{ov.data.sale.configReason}），接码按关闭处理 → 到「设置」修复</span>
                ) : ov.data.sale.publicOpen ? (
                  <span className="text-green-700">● 营业中（全部用户）</span>
                ) : (
                  <span>
                    ○ 未对全部用户开放（总开关{ov.data.sale.enabled ? '开' : '关'} · 受众{ov.data.sale.audience === 'ALL' ? '全部用户' : '仅管理员'}
                    {!ov.data.sale.orderAvailable && ' · 下单功能尚未上线（S2）'}）
                  </span>
                )}
                <span className="ml-2 text-xs text-gray-400">配置版本 {ov.data.sale.version}</span>
                {!ov.data.upstream.configured && <span className="ml-2 text-xs text-red-600">上游 key 没配置（HEROSMS_API_KEY）</span>}
              </div>
              <div>
                目录同步 {ago(ov.data.catalog.catalogAt)}{' '}
                {ov.data.catalog.stale ? <span className="text-red-600">✗ 超过 60 分钟没同步成功</span> : <span className="text-green-700">✓</span>}
                {ov.data.catalog.counts && (
                  <>
                    {' '}
                    · 服务 {ov.data.catalog.counts.services} · 国家/地区 {ov.data.catalog.counts.countries} · 组合 {ov.data.catalog.counts.combos.toLocaleString('zh-CN')}
                  </>
                )}
                {ov.data.catalog.staticStale && <span className="ml-2 text-red-600">✗ 服务 / 国家目录（静态）{ago(ov.data.catalog.staticAt)}同步成功，超过 26 小时</span>}
                {ov.data.catalog.degraded && <span className="ml-2 text-amber-700">getPrices 连续失败 {ov.data.catalog.pricesFails} 次，列表起价已降级</span>}
                {ov.data.catalog.lastError && <div className="text-xs text-amber-700">最近一次错误：{ov.data.catalog.lastError}</div>}
              </div>
              <div>
                手动下架 {ov.data.manual.servicesOff} 个服务、{ov.data.manual.countriesOff} 个国家/地区 · 手动停售 {ov.data.manual.adminHolds} 条 · disabled 规则{' '}
                {ov.data.manual.disabledRules} 条 <span className="text-xs text-gray-400">（出厂都为空，不屏蔽任何平台）</span>
                {ov.data.manual.globalHold && <span className="ml-2 font-medium text-red-600">全局停售中</span>}
              </div>
              {ov.data.pricing && (
                <div>
                  售价系数 x {coefStr(ov.data.pricing.saleCoef4)} · 成本汇率 {coefStr(ov.data.pricing.costFx4)} · 加价 y {yuan(ov.data.pricing.markupCents)} · 最低售价{' '}
                  {yuan(ov.data.pricing.minPriceCents)} · 取整到{ov.data.pricing.rounding === 'JIAO' ? '角' : '分'}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm ${tab === t.id ? 'border-primary-600 font-medium text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab s2={ov.data?.s2 ?? null} s2Error={ov.err ?? ov.data?.s2Error ?? null} holds={ov.data?.holds ?? []} onOpenOrder={openOrder} onUnhold={(k) => void unhold(k)} />}
      {tab === 'orders' && ready && <OrdersTab openId={openId} onOpened={() => setOpenId(null)} initialQ={initialQ} />}
      {tab === 'pricing' && <PricingTab cfg={cfg.data} cfgErr={cfg.err} onSaved={reloadAll} />}
      {tab === 'catalog' && <CatalogTab onChanged={ov.reload} />}
      {tab === 'settings' && <SettingsTab cfg={cfg.data} cfgErr={cfg.err} onSaved={reloadAll} />}
    </div>
  )
}

// ───────────────────────── 保存配置（定价与设置共用） ─────────────────────────

async function saveConfig(next: SmsConfig, expectVersion: number, zeroCheck?: () => boolean): Promise<{ ok: boolean; errors?: Record<string, string>; message: string }> {
  if (zeroCheck && !zeroCheck()) return { ok: false, message: '已取消' }
  let r = await send('PUT', '/api/admin/jiema/config', { config: next, expectVersion })
  if (!r.ok && r.status === 409 && r.data?.needConfirm === 'lowCoef') {
    if (!window.confirm(r.data.error)) return { ok: false, message: '已取消' }
    r = await send('PUT', '/api/admin/jiema/config', { config: next, expectVersion, confirmLowCoef: true })
  }
  if (r.ok) return { ok: true, message: r.data?.message || '已保存' }
  return { ok: false, errors: r.data?.errors ?? undefined, message: r.data?.error || '保存失败' }
}

// ───────────────────────── 定价 ─────────────────────────

/**
 * 保存前核对 0.8 规则（D13、Q1、§7.3）：单独拉 dr、acz 的**全部**组合（?service=dr / ?service=acz，不受预览筛选影响），
 * 用「保存之后会生效的」配置与规则逐行算（legacyRatioFailures，与列表价同一个纯函数）。有 ✗ 弹二次确认（不拦保存）。
 * 拉不到数据时也要确认（宁可多问一次，也不悄悄跳过）。返回 true = 继续保存。
 */
async function confirmLegacyRatio(cfgAfter: SmsConfig, rulesAfter: (base: PriceRuleLike[]) => PriceRuleLike[]): Promise<boolean> {
  const got = await Promise.all(
    LEGACY_GUARDED_SERVICES.map(async (svc) => {
      try {
        const res = await fetch(`/api/admin/jiema/pricing?service=${svc}`, { cache: 'no-store' })
        const d = await res.json().catch(() => null)
        return d?.success ? (d.data as { rows: PreviewRow[]; rules: Rule[] }) : null
      } catch {
        return null
      }
    }),
  )
  if (got.some((d) => d == null)) return window.confirm('没拿到 dr / acz 的全部组合，没法核对「≥ 旧单品 × 0.8」，仍然保存吗？')
  const baseRules: PriceRuleLike[] = (got[0]?.rules ?? []).map((r) => ({ scopeKey: r.scopeKey, markupCents: r.markupCents, tolerancePct: r.tolerancePct, disabled: r.disabled }))
  const rows = got.flatMap((d) => d?.rows ?? [])
  const fails = legacyRatioFailures(rows, rulesAfter(baseRules), cfgAfter)
  if (!fails.length) return true
  const eg = fails
    .slice(0, 5)
    .map((f) => `${f.service}:${f.country} ${yuan(f.priceCents)} < ${yuan(legacyFloorCents(f.legacyCents))}`)
    .join('\n')
  return window.confirm(`${fails.length} 个 dr / acz 组合低于旧单品价格的 8 成（✗）：\n${eg}${fails.length > 5 ? '\n…' : ''}\n\n仍然保存吗？`)
}

/** 规则编辑器的输入 → 规则（不合法的项标出来，不进预览、不让保存；容差负数会让 capMicro 抛 RangeError，S1 评审修复） */
function parseRuleEdit(e: { scopeKey: string; markup: string; tol: string; disabled: boolean }): { rule: PriceRuleLike | null; error: string | null } {
  const key = canonicalScopeKey(e.scopeKey.trim().toLowerCase())
  const m = e.markup.trim() ? parseYuan(e.markup) : null
  const t = e.tol.trim() ? intOr(e.tol) : null
  if (e.markup.trim() && (m == null || m > 5000)) return { rule: null, error: '加价写成 0–50 元，例如 4.40' }
  if (e.tol.trim() && (t == null || t < 0 || t > 100)) return { rule: null, error: '容差是 0–100 的整数（%）' }
  if (!key) return { rule: null, error: e.scopeKey.trim() ? '范围写成「服务:国家」「服务:*」或「*:国家」（例如 dr:187、acz:*、*:6）' : null }
  return { rule: { scopeKey: key, markupCents: m, tolerancePct: t, disabled: e.disabled }, error: null }
}

/** 把一条（新的或改过的）规则放进规则表：同范围的、以及被编辑的那条原规则（范围可能改了）先去掉 */
function withRule(base: PriceRuleLike[], rule: PriceRuleLike, origKey: string | null): PriceRuleLike[] {
  return [...base.filter((x) => x.scopeKey !== rule.scopeKey && x.scopeKey !== origKey), rule]
}

function PricingTab({ cfg, cfgErr, onSaved }: { cfg: ConfigResp | null; cfgErr: string | null; onSaved: () => void }) {
  const saved: SmsConfig = cfg?.config ?? cfg?.factory ?? FACTORY_SMS_CONFIG
  const [f, setF] = useState({ x: '', fx: '', y: '', minPrice: '', rounding: 'CENT' as 'CENT' | 'JIAO', tol: '', margin: '', ttl: '', replace: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    setF({
      x: coefStr(saved.saleCoef4),
      fx: coefStr(saved.costFx4),
      y: yuanStr(saved.markupCents),
      minPrice: yuanStr(saved.minPriceCents),
      rounding: saved.rounding,
      tol: String(saved.tolerancePct),
      margin: yuanStr(saved.minMarginCents),
      ttl: String(saved.quoteTtlSec),
      replace: String(saved.maxReplace),
    })
    setErrors({})
  }, [saved])

  const draft: SmsConfig | null = useMemo(() => {
    const x = parseCoef(f.x)
    const fx = parseCoef(f.fx)
    const y = parseYuan(f.y)
    const mp = parseYuan(f.minPrice)
    const tol = intOr(f.tol)
    const mg = parseYuan(f.margin)
    const ttl = intOr(f.ttl)
    const rp = intOr(f.replace)
    if (x == null || fx == null || y == null || mp == null || tol == null || mg == null || ttl == null || rp == null || x <= 0 || fx <= 0 || mp < 1 || tol < 0) return null
    return { ...saved, saleCoef4: x, costFx4: fx, markupCents: y, minPriceCents: mp, rounding: f.rounding, tolerancePct: tol, minMarginCents: mg, quoteTtlSec: ttl, maxReplace: rp }
  }, [f, saved])

  // 预览数据（成本、旧单品对照、规则）
  const [svcFilter, setSvcFilter] = useState('')
  const pv = useApi<{ rows: PreviewRow[]; rules: Rule[]; services: { code: string; name: string }[] }>(`/api/admin/jiema/pricing${svcFilter ? `?service=${svcFilter}` : ''}`)
  const rules = pv.data?.rules ?? []
  const [ruleEdit, setRuleEdit] = useState<{ id: number | null; scopeKey: string; markup: string; tol: string; disabled: boolean; note: string } | null>(null)
  const ruleParsed = useMemo(() => (ruleEdit ? parseRuleEdit(ruleEdit) : null), [ruleEdit])
  const ruleOrigKey = ruleEdit?.id != null ? (rules.find((x) => x.id === ruleEdit.id)?.scopeKey ?? null) : null
  const draftRules: PriceRuleLike[] = useMemo(() => {
    const base: PriceRuleLike[] = rules.map((r) => ({ scopeKey: r.scopeKey, markupCents: r.markupCents, tolerancePct: r.tolerancePct, disabled: r.disabled }))
    // 编辑中的规则有不合法的项（容差负数等）时不计入预览：算不出价的输入不能让整页白屏
    if (!ruleParsed?.rule) return base
    return withRule(base, ruleParsed.rule, ruleOrigKey)
  }, [rules, ruleParsed, ruleOrigKey])

  const rows = useMemo(() => {
    const list = pv.data?.rows ?? []
    // 每一行单独 try：某一行算不出价（配置或规则不合法）显示「—」，异常不冒泡成整页错误
    const safe = <T,>(f: () => T): T | null => {
      try {
        return f()
      } catch {
        return null
      }
    }
    return list.map((r) => {
      const cur = safe(() => priceCombo(r.costMicro, resolveRule(rules, r.service, r.country, saved), saved))
      const newRule = draft ? safe(() => resolveRule(draftRules, r.service, r.country, draft)) : null
      const nw = draft && newRule ? safe(() => priceCombo(r.costMicro, newRule, draft)) : null
      const profit = nw && draft ? safe(() => nw.priceCents - realCostCents(r.costMicro, draft.costFx4)) : null
      const worst = nw && draft ? safe(() => nw.priceCents - realCostCents(nw.capMicro, draft.costFx4)) : null
      const legacyOk = r.legacy && nw ? meetsLegacyRatio(nw.priceCents, r.legacy.priceCents) : null
      return { r, cur, nw, profit, worst, legacyOk, disabled: !!newRule?.disabled, ruleKey: newRule?.ruleKey ?? null }
    })
  }, [pv.data, rules, saved, draft, draftRules])
  // 只是预览里这些行的 ✗ 计数；保存前的核对按 dr、acz 的全部组合另算（confirmLegacyRatio）
  const failing = rows.filter((x) => LEGACY_GUARDED_SERVICES.includes(x.r.service) && x.legacyOk === false && !x.disabled)

  // 试算
  const [trial, setTrial] = useState('0.024')
  const trialMicro = parseUsdMicro(trial)
  const trialRes = draft && trialMicro && trialMicro > 0 ? priceCombo(trialMicro, { markupCents: draft.markupCents, tolerancePct: draft.tolerancePct, ruleKey: null }, draft) : null

  const save = async () => {
    if (!draft || !cfg) return
    setSaving(true)
    setMsg(null)
    // 0.8 规则按 dr、acz 的全部组合核对（不只是预览里显示的那些行）：保存配置后生效的 = 草稿配置 + 已保存的规则
    if (!(await confirmLegacyRatio(draft, (base) => base))) {
      setSaving(false)
      setMsg('已取消')
      return
    }
    const r = await saveConfig(draft, cfg.storedVersion)
    setSaving(false)
    setErrors(r.errors ?? {})
    setMsg(r.message)
    if (r.ok) onSaved()
  }

  const saveRule = async () => {
    if (!ruleEdit) return
    const parsed = parseRuleEdit(ruleEdit)
    if (!parsed.rule) return window.alert(parsed.error || '范围写成「服务:国家」「服务:*」或「*:国家」')
    const rule = parsed.rule
    const body = { scopeKey: rule.scopeKey, markupCents: rule.markupCents, tolerancePct: rule.tolerancePct, disabled: rule.disabled, note: ruleEdit.note }
    // 规则同样要过 0.8 核对（§7.3「覆盖规则表的编辑弹窗里同样即时显示…」）：保存后生效的 = 已保存的配置 + 换上这条规则
    const origKey = ruleOrigKey
    if (!(await confirmLegacyRatio(saved, (base) => withRule(base, rule, origKey)))) return
    const r = ruleEdit.id == null ? await send('POST', '/api/admin/jiema/rules', body) : await send('PUT', `/api/admin/jiema/rules/${ruleEdit.id}`, body)
    if (!r.ok) return window.alert(r.data?.error || '保存失败')
    setRuleEdit(null)
    pv.reload()
    onSaved()
  }
  const delRule = async (rule: Rule) => {
    if (!window.confirm(`删除规则 ${rule.scopeKey}？`)) return
    const r = await send('DELETE', `/api/admin/jiema/rules/${rule.id}`)
    if (!r.ok) return window.alert(r.data?.error || '删除失败')
    pv.reload()
    onSaved()
  }

  if (cfgErr) return <div className="text-red-600">{cfgErr}</div>
  if (!cfg) return <div className="text-gray-400">加载中...</div>
  const E = (k: string) => (errors[k] ? <div className="text-xs text-red-600">{errors[k]}</div> : null)

  return (
    <div className="space-y-6">
      {!cfg.config && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">sms_config 读取失败（{cfg.reason}）：下面按出厂值填好了，保存一次即可修复。</div>
      )}
      <Card>
        <CardContent className="space-y-4 py-5 text-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              售价系数 x <input className={`${inputCls} ml-2 w-24`} value={f.x} onChange={(e) => setF({ ...f, x: e.target.value })} />
              <span className="ml-2 text-xs text-gray-500">定价用，一般高于真实汇率（1.00–30.00）</span>
              {E('saleCoef4')}
            </label>
            <label className="block">
              成本汇率 <input className={`${inputCls} ml-2 w-24`} value={f.fx} onChange={(e) => setF({ ...f, fx: e.target.value })} />
              <span className="ml-2 text-xs text-gray-500">记账用：你给上游充值时实际的换汇价（含手续费摊销，5.00–9.00）</span>
              {E('costFx4')}
            </label>
            <label className="block">
              加价 y <input className={`${inputCls} ml-2 w-20`} value={f.y} onChange={(e) => setF({ ...f, y: e.target.value })} /> 元
              <span className="ml-3">最低售价</span> <input className={`${inputCls} ml-1 w-20`} value={f.minPrice} onChange={(e) => setF({ ...f, minPrice: e.target.value })} /> 元
              <span className="ml-3">取整</span>
              <select className={`${inputCls} ml-1`} value={f.rounding} onChange={(e) => setF({ ...f, rounding: e.target.value as 'CENT' | 'JIAO' })}>
                <option value="CENT">向上到分</option>
                <option value="JIAO">向上到角</option>
              </select>
              {E('markupCents')}
              {E('minPriceCents')}
            </label>
            <label className="block">
              容差 <input className={`${inputCls} ml-1 w-16`} value={f.tol} onChange={(e) => setF({ ...f, tol: e.target.value })} />%
              <span className="ml-3">最低毛利</span> <input className={`${inputCls} ml-1 w-20`} value={f.margin} onChange={(e) => setF({ ...f, margin: e.target.value })} /> 元
              <span className="ml-1 text-xs text-gray-500">（按成本汇率算）</span>
              {E('tolerancePct')}
              {E('minMarginCents')}
            </label>
            <label className="block">
              锁价 <input className={`${inputCls} ml-1 w-20`} value={f.ttl} onChange={(e) => setF({ ...f, ttl: e.target.value })} /> 秒
              <span className="ml-3">换号</span> <input className={`${inputCls} ml-1 w-16`} value={f.replace} onChange={(e) => setF({ ...f, replace: e.target.value })} /> 次
              {E('quoteTtlSec')}
              {E('maxReplace')}
            </label>
          </div>
          {!draft && <div className="text-xs text-red-600">有项目格式不对（系数写成 8.00、金额写成 1.50）</div>}
          {draft && draft.saleCoef4 < draft.costFx4 && <div className="text-xs text-amber-700">⚠ 售价系数低于成本汇率：只靠加价 y 赚钱（保存时要二次确认）</div>}
          {draft && draft.markupCents < draft.minMarginCents && draft.minPriceCents <= draft.minMarginCents && (
            <div className="text-xs text-amber-700">⚠ 加价 y 低于最低毛利、最低售价也兜不住：部分组合没有容差</div>
          )}

          <div className="rounded-lg border border-gray-200 p-3">
            <div className="mb-2 font-medium text-gray-800">试算</div>
            报价成本 $ <input className={`${inputCls} w-24`} value={trial} onChange={(e) => setTrial(e.target.value)} />
            {trialRes && draft && trialMicro ? (
              <div className="mt-2 space-y-0.5 text-gray-700">
                <div>
                  售价 <strong>{yuan(trialRes.priceCents)}</strong>（⌈{microToUsd4(trialMicro)} × {coefStr(draft.saleCoef4)} × 100⌉ = {usdToCentsCeil(trialMicro, draft.saleCoef4)} 分 + {draft.markupCents} 分
                  {draft.minPriceCents > usdToCentsCeil(trialMicro, draft.saleCoef4) + draft.markupCents ? `，按最低售价 ${draft.minPriceCents} 分` : ''}
                  {draft.rounding === 'JIAO' ? '，到角' : ''}）
                </div>
                <div>
                  真实成本 {yuan(realCostCents(trialMicro, draft.costFx4))} · 预计毛利 {yuan(trialRes.priceCents - realCostCents(trialMicro, draft.costFx4))}
                </div>
                <div>
                  cap {usd(trialRes.capMicro)} · 最坏毛利 {yuan(trialRes.priceCents - realCostCents(trialRes.capMicro, draft.costFx4))}
                </div>
              </div>
            ) : (
              <span className="ml-2 text-xs text-gray-400">填一个大于 0 的美元金额</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={save} loading={saving} disabled={!draft}>
              保存（版本 {cfg.storedVersion} → {cfg.storedVersion + 1}）
            </Button>
            {msg && <span className="text-sm text-gray-600">{msg}</span>}
            <span className="text-xs text-gray-500">只影响之后下的单（锁价快照）；已下单未结束的单仍按下单时的成本汇率核算</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-5 text-sm">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="font-medium text-gray-800">热门组合预览（当前 → 新）</span>
            <select className={inputCls} value={svcFilter} onChange={(e) => setSvcFilter(e.target.value)}>
              <option value="">热门服务 × 最便宜的 8 个国家/地区（含有旧单品对照、规则点名的）</option>
              {(pv.data?.services ?? []).map((s) => (
                <option key={s.code} value={s.code}>
                  只看 {s.name}（{s.code}）的全部国家/地区
                </option>
              ))}
            </select>
            {svcFilter && (
              <button className="text-xs text-primary-600" onClick={() => setSvcFilter('')}>
                回到热门
              </button>
            )}
            {failing.length > 0 && <span className="text-xs font-medium text-red-600">预览里 ✗ {failing.length} 个 dr / acz 组合低于旧单品 × 0.8</span>}
          </div>
          {pv.err && <div className="text-red-600">{pv.err}</div>}
          {!pv.data && !pv.err && <div className="text-gray-400">加载中...</div>}
          {pv.data && rows.length === 0 && <div className="text-gray-400">还没有价格数据（先到「目录」同步一次）</div>}
          {rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-gray-500">
                  <tr>
                    <th className="py-1 pr-3">组合</th>
                    <th className="pr-3">报价成本</th>
                    <th className="pr-3">售价（当前 → 新）</th>
                    <th className="pr-3">预计毛利</th>
                    <th className="pr-3">cap / 最坏毛利</th>
                    <th className="pr-3">≥ 单品 × 0.8</th>
                    <th>规则</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ r, cur, nw, profit, worst, legacyOk, disabled, ruleKey }) => (
                    <tr key={`${r.service}:${r.country}`} className={`border-t border-gray-100 ${legacyOk === false && (r.service === 'dr' || r.service === 'acz') ? 'bg-red-50' : ''}`}>
                      <td className="py-1 pr-3">
                        {r.serviceName} · {r.countryName} <span className="text-gray-400">{r.service}:{r.country}</span>
                        {r.source === 'PRICES' && <span className="ml-1 text-gray-400">（getPrices）</span>}
                      </td>
                      <td className="pr-3 tabular-nums">{usd(r.costMicro)}</td>
                      <td className="pr-3 tabular-nums">
                        {yuan(cur?.priceCents)} → <strong className={nw && cur && nw.priceCents !== cur.priceCents ? 'text-primary-700' : ''}>{yuan(nw?.priceCents)}</strong>
                      </td>
                      <td className="pr-3 tabular-nums">{yuan(profit)}</td>
                      <td className="pr-3 tabular-nums">
                        {usd(nw?.capMicro)} / {yuan(worst)}
                      </td>
                      <td className="pr-3">
                        {r.legacy ? (
                          <span title={r.legacy.names.join('、')} className={legacyOk ? 'text-green-700' : 'font-medium text-red-600'}>
                            {legacyOk ? '✓' : '✗'} 单品 {yuan(r.legacy.priceCents)} × 0.8 = {yuan(legacyFloorCents(r.legacy.priceCents))}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="text-gray-500">
                        {ruleKey ?? ''}
                        {disabled && <span className="ml-1 text-red-600">停售</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-5 text-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-medium text-gray-800">覆盖规则（服务:国家 &gt; 服务:* &gt; *:国家 &gt; 全局）</span>
            <Button size="sm" onClick={() => setRuleEdit({ id: null, scopeKey: '', markup: '', tol: '', disabled: false, note: '' })}>
              + 新增
            </Button>
          </div>
          {rules.length === 0 ? (
            <div className="text-gray-400">没有规则（出厂为空）。dr、acz 上线前按「≥ 旧单品现价 × 0.8」配加价。</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="text-gray-500">
                <tr>
                  <th className="py-1">范围</th>
                  <th>加价</th>
                  <th>容差</th>
                  <th>停售</th>
                  <th>备注</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className="border-t border-gray-100">
                    <td className="py-1 font-mono">{r.scopeKey}</td>
                    <td>{r.markupCents == null ? '—' : yuan(r.markupCents)}</td>
                    <td>{r.tolerancePct == null ? '—' : `${r.tolerancePct}%`}</td>
                    <td>{r.disabled ? <span className="text-red-600">是</span> : '否'}</td>
                    <td className="max-w-xs truncate text-gray-600">{r.note}</td>
                    <td className="whitespace-nowrap text-right">
                      <button
                        className="mr-2 text-primary-600"
                        onClick={() =>
                          setRuleEdit({ id: r.id, scopeKey: r.scopeKey, markup: r.markupCents == null ? '' : yuanStr(r.markupCents), tol: r.tolerancePct == null ? '' : String(r.tolerancePct), disabled: r.disabled, note: r.note ?? '' })
                        }
                      >
                        编辑
                      </button>
                      <button className="text-red-600" onClick={() => delRule(r)}>
                        删
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {ruleEdit && (
            <div className="mt-4 space-y-2 rounded-lg border border-primary-200 bg-primary-50/40 p-3">
              <div className="flex flex-wrap items-center gap-3">
                范围 <input className={`${inputCls} w-28 font-mono`} placeholder="dr:187" value={ruleEdit.scopeKey} onChange={(e) => setRuleEdit({ ...ruleEdit, scopeKey: e.target.value })} />
                加价 <input className={`${inputCls} w-20`} placeholder="留空=不覆盖" value={ruleEdit.markup} onChange={(e) => setRuleEdit({ ...ruleEdit, markup: e.target.value })} /> 元
                容差 <input className={`${inputCls} w-16`} placeholder="—" value={ruleEdit.tol} onChange={(e) => setRuleEdit({ ...ruleEdit, tol: e.target.value })} />%
                <label className="inline-flex items-center gap-1">
                  <input type="checkbox" checked={ruleEdit.disabled} onChange={(e) => setRuleEdit({ ...ruleEdit, disabled: e.target.checked })} /> 停售这个组合
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                备注 <input className={`${inputCls} w-96 max-w-full`} value={ruleEdit.note} onChange={(e) => setRuleEdit({ ...ruleEdit, note: e.target.value })} placeholder="例如：单品「Codex 美区」¥12.00 × 0.8 = ¥9.60" />
                <Button size="sm" onClick={saveRule}>
                  保存规则
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRuleEdit(null)}>
                  取消
                </Button>
              </div>
              {ruleParsed?.error && <div className="text-xs text-red-600">{ruleParsed.error}</div>}
              <div className="text-xs text-gray-500">编辑中的规则已计入上面预览的「新」一列（逐行 ✓ / ✗ 即时变化）；保存时按 dr、acz 的全部组合核对 0.8 规则。停售规则必须写备注。</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ───────────────────────── 目录 ─────────────────────────

type CatSub = 'services' | 'countries' | 'operators' | 'holds'

function CatalogTab({ onChanged }: { onChanged: () => void }) {
  const [sub, setSub] = useState<CatSub>('services')
  const st = useApi<{ state: { catalogAt: string | null; staticAt: string | null; pricesAt: string | null; pricesFails: number; lastError: string | null; lastRunAt: string | null } }>('/api/admin/jiema/catalog')
  const [busy, setBusy] = useState<string | null>(null)
  const sync = async (part: 'all' | 'static' | 'prices') => {
    setBusy(part)
    const r = await send('POST', '/api/admin/jiema/catalog', { part })
    setBusy(null)
    window.alert(r.data?.message || r.data?.error || (r.ok ? '已同步' : '同步失败'))
    st.reload()
    onChanged()
  }
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-4 text-sm text-gray-700">
          {st.data ? (
            <span>
              静态目录 {ago(st.data.state.staticAt)} · 价格 {ago(st.data.state.pricesAt)} · 最近一次运行 {fmt(st.data.state.lastRunAt)}
              {st.data.state.lastError && <span className="ml-2 text-amber-700">（{st.data.state.lastError}）</span>}
            </span>
          ) : (
            <span className="text-gray-400">{st.err ?? '加载中...'}</span>
          )}
          <span className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" loading={busy === 'static'} onClick={() => sync('static')}>
              同步服务 / 国家 / 运营商
            </Button>
            <Button size="sm" variant="outline" loading={busy === 'prices'} onClick={() => sync('prices')}>
              同步价格
            </Button>
            <Button size="sm" loading={busy === 'all'} onClick={() => sync('all')}>
              全部同步
            </Button>
          </span>
        </CardContent>
      </Card>
      <div className="flex gap-2 text-sm">
        {(
          [
            ['services', '服务'],
            ['countries', '国家/地区'],
            ['operators', '运营商显示名'],
            ['holds', '停售'],
          ] as Array<[CatSub, string]>
        ).map(([k, l]) => (
          <button key={k} onClick={() => setSub(k)} className={`rounded-full px-3 py-1 ${sub === k ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {l}
          </button>
        ))}
      </div>
      {sub === 'services' && <ServicesPanel onChanged={onChanged} />}
      {sub === 'countries' && <CountriesPanel onChanged={onChanged} />}
      {sub === 'operators' && <OperatorsPanel />}
      {sub === 'holds' && <HoldsPanel onChanged={onChanged} />}
    </div>
  )
}

interface AdminServiceRow {
  code: string
  nameEn: string
  nameCn: string | null
  aliases: string[]
  hotRank: number | null
  status: string
  offNote: string | null
  stockCountries: number
  minCostMicro: number | null
  source: string
}

function ServicesPanel({ onChanged }: { onChanged: () => void }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [hot, setHot] = useState(false)
  const [page, setPage] = useState(1)
  const q = useDebounced(search)
  useEffect(() => setPage(1), [q, status, hot])
  const url = `/api/admin/jiema/services?search=${encodeURIComponent(q)}&status=${status}&hot=${hot ? 1 : 0}&page=${page}`
  const list = useApi<{ list: AdminServiceRow[]; total: number; page: number; totalPages: number }>(url)
  const [edit, setEdit] = useState<{ code: string; nameCn: string; aliases: string; hotRank: string } | null>(null)
  const [importing, setImporting] = useState<string | null>(null)

  const put = async (code: string, body: Record<string, unknown>) => {
    const r = await send('PUT', `/api/admin/jiema/services/${code}`, body)
    if (!r.ok) {
      window.alert(r.data?.error || '保存失败')
      return false
    }
    if (r.data?.data?.changed === false) window.alert('没有改动')
    list.reload()
    onChanged()
    return true
  }
  const toggle = async (s: AdminServiceRow) => {
    if (s.status === 'ON') {
      const note = window.prompt(`手动下架「${s.nameCn || s.nameEn}」（${s.code}）：下架原因（必填，写审计）`)
      if (!note || !note.trim()) return
      await put(s.code, { status: 'OFF', offNote: note.trim() })
    } else {
      if (!window.confirm(`重新上架「${s.nameCn || s.nameEn}」？`)) return
      await put(s.code, { status: 'ON' })
    }
  }
  const refresh = async (code: string) => {
    const r = await send('POST', '/api/admin/jiema/catalog', { part: 'offers', service: code })
    window.alert(r.data?.message || r.data?.error || '已刷新')
    list.reload()
  }
  const doImport = async () => {
    if (!importing) return
    const r = await send('POST', '/api/admin/jiema/services', { csv: importing })
    window.alert(r.ok ? `${r.data?.message}${r.data?.data?.skipped?.length ? `\n跳过：\n${r.data.data.skipped.join('\n')}` : ''}` : r.data?.error || '导入失败')
    if (r.ok) {
      setImporting(null)
      list.reload()
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 py-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <input className={`${inputCls} w-56`} placeholder="代码 / 名字 / 别名" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">全部状态</option>
            <option value="ON">ON</option>
            <option value="OFF">OFF（手动下架）</option>
          </select>
          <label className="inline-flex items-center gap-1 text-gray-600">
            <input type="checkbox" checked={hot} onChange={(e) => setHot(e.target.checked)} /> 只看热门
          </label>
          <span className="ml-auto flex gap-2">
            <a href="/api/admin/jiema/services?format=csv" className="rounded-lg border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50">
              导出 CSV
            </a>
            <Button size="sm" variant="outline" onClick={() => setImporting('code,nameCn,aliases,hotRank\n')}>
              导入 CSV
            </Button>
          </span>
        </div>
        {importing != null && (
          <div className="space-y-2 rounded-lg border border-gray-200 p-3">
            <div className="text-xs text-gray-500">
              粘贴 CSV（表头含 code，可选 nameCn、aliases（用 | 分隔）、hotRank）。只改中文名、别名、热门序号；下架要逐个填原因，不走批量。
              中文名、别名留空 = 不改（要清空请在列表里逐个编辑）；热门序号留空 = 不是热门。与现在相同的行不算改动、不写审计。
            </div>
            <textarea className={`${inputCls} h-40 w-full font-mono text-xs`} value={importing} onChange={(e) => setImporting(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" onClick={doImport}>
                导入
              </Button>
              <Button size="sm" variant="outline" onClick={() => setImporting(null)}>
                取消
              </Button>
            </div>
          </div>
        )}
        {list.err && <div className="text-red-600">{list.err}</div>}
        {list.data && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-gray-500">
                  <tr>
                    <th className="py-1 pr-2">代码</th>
                    <th className="pr-2">英文名</th>
                    <th className="pr-2">中文名</th>
                    <th className="pr-2">别名</th>
                    <th className="pr-2">热门</th>
                    <th className="pr-2">状态</th>
                    <th className="pr-2">有货国家</th>
                    <th className="pr-2">最低成本</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {list.data.list.map((s) => (
                    <tr key={s.code} className={`border-t border-gray-100 ${s.status === 'OFF' ? 'bg-gray-50 text-gray-400' : ''}`}>
                      <td className="py-1 pr-2 font-mono">{s.code}</td>
                      <td className="pr-2">{s.nameEn}</td>
                      <td className="pr-2">{s.nameCn || <span className="text-gray-300">—</span>}</td>
                      <td className="max-w-[16rem] truncate pr-2" title={s.aliases.join('、')}>
                        {s.aliases.join('、')}
                      </td>
                      <td className="pr-2">{s.hotRank ?? ''}</td>
                      <td className="pr-2">{s.status === 'OFF' ? <span title={s.offNote ?? ''} className="text-red-600">OFF</span> : 'ON'}</td>
                      <td className="pr-2">
                        {s.stockCountries}
                        <span className="text-gray-400">{s.source === 'OFFERS' ? '' : s.source === 'PRICES' ? '（getPrices）' : ''}</span>
                      </td>
                      <td className="pr-2 tabular-nums">{usd(s.minCostMicro)}</td>
                      <td className="whitespace-nowrap text-right">
                        <button className="mr-2 text-primary-600" onClick={() => setEdit({ code: s.code, nameCn: s.nameCn ?? '', aliases: s.aliases.join(','), hotRank: s.hotRank == null ? '' : String(s.hotRank) })}>
                          编辑
                        </button>
                        <button className="mr-2 text-primary-600" onClick={() => refresh(s.code)}>
                          刷新价格
                        </button>
                        <button className={s.status === 'ON' ? 'text-red-600' : 'text-green-700'} onClick={() => toggle(s)}>
                          {s.status === 'ON' ? '下架' : '上架'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              共 {list.data.total} 个
              <button disabled={page <= 1} className="disabled:opacity-40" onClick={() => setPage(page - 1)}>
                上一页
              </button>
              {list.data.page} / {list.data.totalPages}
              <button disabled={page >= list.data.totalPages} className="disabled:opacity-40" onClick={() => setPage(page + 1)}>
                下一页
              </button>
            </div>
          </>
        )}
        {edit && (
          <div className="space-y-2 rounded-lg border border-primary-200 bg-primary-50/40 p-3">
            <div className="font-medium">编辑 {edit.code}</div>
            <div className="flex flex-wrap items-center gap-2">
              中文名 <input className={`${inputCls} w-48`} value={edit.nameCn} onChange={(e) => setEdit({ ...edit, nameCn: e.target.value })} />
              热门序号 <input className={`${inputCls} w-16`} value={edit.hotRank} placeholder="留空" onChange={(e) => setEdit({ ...edit, hotRank: e.target.value })} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              别名 <input className={`${inputCls} w-[32rem] max-w-full`} value={edit.aliases} onChange={(e) => setEdit({ ...edit, aliases: e.target.value })} placeholder="逗号分隔：俗称、全拼、首字母、英文缩写" />
            </div>
            <div className="text-xs text-gray-500">搜索不看上游代码（wx=Apple、wb=WeChat…），常用缩写要写进别名。清空中文名 / 别名后，之后的目录同步不会再用种子填回去。</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={async () => {
                  if (await put(edit.code, { nameCn: edit.nameCn, aliases: edit.aliases, hotRank: edit.hotRank })) setEdit(null)
                }}
              >
                保存
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEdit(null)}>
                取消
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface AdminCountryRow {
  id: number
  nameEn: string
  nameCn: string | null
  nameLocked: boolean
  iso2: string | null
  flag: string | null
  dialCode: string | null
  status: string
  offNote: string | null
  sortBoost: number
}

function CountriesPanel({ onChanged }: { onChanged: () => void }) {
  const [search, setSearch] = useState('')
  const q = useDebounced(search)
  const list = useApi<{ list: AdminCountryRow[] }>(`/api/admin/jiema/countries?search=${encodeURIComponent(q)}`)
  const [edit, setEdit] = useState<{ id: number; locked: boolean; nameCn: string; iso2: string; dial: string; boost: string } | null>(null)
  const put = async (id: number, body: Record<string, unknown>) => {
    const r = await send('PUT', `/api/admin/jiema/countries/${id}`, body)
    if (!r.ok) {
      window.alert(r.data?.error || '保存失败')
      return false
    }
    list.reload()
    onChanged()
    return true
  }
  const toggle = async (c: AdminCountryRow) => {
    if (c.status === 'ON') {
      const note = window.prompt(`手动下架「${c.nameCn || c.nameEn}」：下架原因（必填，写审计）`)
      if (!note || !note.trim()) return
      await put(c.id, { status: 'OFF', offNote: note.trim() })
    } else if (window.confirm(`重新上架「${c.nameCn || c.nameEn}」？`)) await put(c.id, { status: 'ON' })
  }
  return (
    <Card>
      <CardContent className="space-y-3 py-4 text-sm">
        <input className={`${inputCls} w-56`} placeholder="名字 / ISO2 / 区号 / id" value={search} onChange={(e) => setSearch(e.target.value)} />
        {list.err && <div className="text-red-600">{list.err}</div>}
        {list.data && (
          <div className="max-h-[36rem] overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-white text-gray-500">
                <tr>
                  <th className="py-1 pr-2">id</th>
                  <th className="pr-2">英文名</th>
                  <th className="pr-2">中文名</th>
                  <th className="pr-2">ISO2 / 旗帜</th>
                  <th className="pr-2">区号</th>
                  <th className="pr-2">状态</th>
                  <th className="pr-2">排序加权</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.data.list.map((c) => (
                  <tr key={c.id} className={`border-t border-gray-100 ${c.status === 'OFF' ? 'bg-gray-50 text-gray-400' : ''}`}>
                    <td className="py-1 pr-2">{c.id}</td>
                    <td className="pr-2">{c.nameEn}</td>
                    <td className="pr-2">
                      {c.nameCn || <span className="text-gray-300">—</span>}
                      {c.nameLocked && <span className="ml-1 text-gray-400">（固定）</span>}
                    </td>
                    <td className="pr-2">
                      {c.iso2 || '—'} {c.flag ? '' : <span className="text-gray-400">（无旗帜）</span>}
                    </td>
                    <td className="pr-2">{c.dialCode ? `+${c.dialCode}` : '—'}</td>
                    <td className="pr-2">{c.status === 'OFF' ? <span title={c.offNote ?? ''} className="text-red-600">OFF</span> : 'ON'}</td>
                    <td className="pr-2">{c.sortBoost}</td>
                    <td className="whitespace-nowrap text-right">
                      <button
                        className="mr-2 text-primary-600"
                        onClick={() => setEdit({ id: c.id, locked: c.nameLocked, nameCn: c.nameCn ?? '', iso2: c.iso2 ?? '', dial: c.dialCode ?? '', boost: String(c.sortBoost) })}
                      >
                        编辑
                      </button>
                      <button className={c.status === 'ON' ? 'text-red-600' : 'text-green-700'} onClick={() => toggle(c)}>
                        {c.status === 'ON' ? '下架' : '上架'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {edit && (
          <div className="space-y-2 rounded-lg border border-primary-200 bg-primary-50/40 p-3">
            <div className="font-medium">编辑 #{edit.id}</div>
            <div className="flex flex-wrap items-center gap-2">
              中文名 <input className={`${inputCls} w-40`} disabled={edit.locked} value={edit.nameCn} onChange={(e) => setEdit({ ...edit, nameCn: e.target.value })} />
              {edit.locked && <span className="text-xs text-gray-500">这个地区的名称固定，不能修改</span>}
              ISO2 <input className={`${inputCls} w-14`} value={edit.iso2} onChange={(e) => setEdit({ ...edit, iso2: e.target.value })} />
              区号 <input className={`${inputCls} w-20`} value={edit.dial} onChange={(e) => setEdit({ ...edit, dial: e.target.value })} />
              排序加权 <input className={`${inputCls} w-16`} value={edit.boost} onChange={(e) => setEdit({ ...edit, boost: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={async () => {
                  const body: Record<string, unknown> = { iso2: edit.iso2, dialCode: edit.dial, sortBoost: edit.boost }
                  if (!edit.locked) body.nameCn = edit.nameCn
                  if (await put(edit.id, body)) setEdit(null)
                }}
              >
                保存
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEdit(null)}>
                取消
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function OperatorsPanel() {
  const list = useApi<{ list: { code: string; name: string; custom: string | null; countries: number }[]; fetchedAt: string | null }>('/api/admin/jiema/operators')
  const [names, setNames] = useState<Record<string, string>>({})
  useEffect(() => {
    const m: Record<string, string> = {}
    for (const o of list.data?.list ?? []) if (o.custom) m[o.code] = o.custom
    setNames(m)
  }, [list.data])
  const [filter, setFilter] = useState('')
  const save = async () => {
    const r = await send('PUT', '/api/admin/jiema/operators', { names })
    window.alert(r.ok ? '已保存' : r.data?.error || '保存失败')
    if (r.ok) list.reload()
  }
  const rows = (list.data?.list ?? []).filter((o) => !filter || o.code.includes(filter.toLowerCase()) || o.name.toLowerCase().includes(filter.toLowerCase()))
  return (
    <Card>
      <CardContent className="space-y-3 py-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <input className={`${inputCls} w-48`} placeholder="筛选代码 / 名称" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <span className="text-xs text-gray-500">运营商列表每天同步一次（{fmt(list.data?.fetchedAt)}）；留空 = 用出厂映射或首字母大写</span>
          <Button size="sm" className="ml-auto" onClick={save}>
            保存
          </Button>
        </div>
        {list.err && <div className="text-red-600">{list.err}</div>}
        <div className="max-h-[36rem] overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-white text-gray-500">
              <tr>
                <th className="py-1 pr-2">代码</th>
                <th className="pr-2">当前显示名</th>
                <th className="pr-2">自定义</th>
                <th>国家数</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.code} className="border-t border-gray-100">
                  <td className="py-1 pr-2 font-mono">{o.code}</td>
                  <td className="pr-2">{o.name}</td>
                  <td className="pr-2">
                    <input
                      className={`${inputCls} w-40`}
                      value={names[o.code] ?? ''}
                      onChange={(e) => setNames((m) => {
                        const n = { ...m }
                        if (e.target.value.trim()) n[o.code] = e.target.value
                        else delete n[o.code]
                        return n
                      })}
                    />
                  </td>
                  <td>{o.countries}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function HoldsPanel({ onChanged }: { onChanged: () => void }) {
  const list = useApi<{ list: { key: string; until: string | null; reason: string; source: string; note: string | null; active: boolean; createdAt: string }[] }>('/api/admin/jiema/holds')
  const [form, setForm] = useState({ key: '', note: '', until: '' })
  // 同一范围已有生效中的停售：表单里直接显示（自动停售不能被手动停售覆盖；手动停售只能延长，服务端 adminHoldConflict 同样拒绝）
  const typedKey = canonicalHoldKey(form.key)
  const existing = typedKey ? (list.data?.list ?? []).find((h) => h.key === typedKey && h.active) ?? null : null
  const add = async () => {
    const r = await send('POST', '/api/admin/jiema/holds', { key: form.key, note: form.note, until: form.until ? new Date(form.until).toISOString() : null })
    if (!r.ok) return window.alert(r.data?.error || '保存失败')
    setForm({ key: '', note: '', until: '' })
    list.reload()
    onChanged()
  }
  const del = async (key: string) => {
    if (!window.confirm(`解除停售 ${key}？`)) return
    const r = await send('DELETE', `/api/admin/jiema/holds?key=${encodeURIComponent(key)}`)
    if (!r.ok) return window.alert(r.data?.error || '解除失败')
    list.reload()
    onChanged()
  }
  return (
    <Card>
      <CardContent className="space-y-3 py-4 text-sm">
        <div className="text-xs text-gray-500">
          停售是运维开关（出厂为空）。自动停售（成功率低、封禁、熔断等）在下单功能上线后由系统写入，也在这里显示、可以解除。上游余额不设停售线（只告警）。
        </div>
        {list.err && <div className="text-red-600">{list.err}</div>}
        {list.data && list.data.list.length === 0 && <div className="text-gray-400">没有停售规则</div>}
        {list.data && list.data.list.length > 0 && (
          <table className="w-full text-left text-xs">
            <thead className="text-gray-500">
              <tr>
                <th className="py-1 pr-2">范围</th>
                <th className="pr-2">来源</th>
                <th className="pr-2">原因</th>
                <th className="pr-2">到期</th>
                <th className="pr-2">备注</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.data.list.map((h) => (
                <tr key={h.key} className={`border-t border-gray-100 ${h.active ? '' : 'text-gray-400'}`}>
                  <td className="py-1 pr-2 font-mono">{h.key}</td>
                  <td className="pr-2">{h.source === 'ADMIN' ? '手动' : h.source === 'AUTO' ? '自动' : h.source}</td>
                  <td className="pr-2">{h.reason}</td>
                  <td className="pr-2">{h.until ? fmt(h.until) : '手动解除'}{!h.active && '（已过期）'}</td>
                  <td className="max-w-xs truncate pr-2">{h.note}</td>
                  <td className="text-right">
                    <button className="text-red-600" onClick={() => del(h.key)}>
                      解除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 p-3">
          + 手动停售
          <input className={`${inputCls} w-40 font-mono`} placeholder="svc:wb / combo:dr:187" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
          <input className={`${inputCls} w-64`} placeholder="原因（必填）" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <input type="datetime-local" className={inputCls} value={form.until} onChange={(e) => setForm({ ...form, until: e.target.value })} />
          <span className="text-xs text-gray-500">到期留空 = 手动解除</span>
          <Button size="sm" onClick={add}>
            停售
          </Button>
          {existing && (
            <div className="w-full text-xs text-amber-700">
              {existing.key} 已有生效中的{existing.source === 'ADMIN' ? '手动' : '自动'}停售（{existing.reason}，{existing.until ? `到 ${fmt(existing.until)}` : '需要手动解除'}）：
              {existing.source === 'ADMIN' ? '只能延长或改成手动解除，不能缩短。' : '手动停售不能覆盖它，要改请先「解除」。'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ───────────────────────── 设置 ─────────────────────────

type FieldSpec = { path: string; label: string; kind: 'int' | 'num' | 'bool'; hint?: string }
const SETTINGS_FIELDS: { group: string; fields: FieldSpec[] }[] = [
  {
    group: '限额（D27）',
    fields: [
      { path: 'limits.activePerUser', label: '同时进行中的单（含待支付）', kind: 'int' },
      { path: 'limits.perHour', label: '每小时单数', kind: 'int' },
      { path: 'limits.perDay', label: '每天单数', kind: 'int' },
      { path: 'limits.maxActiveNumbers', label: '新板块同时在途号码上限（给旧单品留线程）', kind: 'int' },
      { path: 'acquireTries', label: '取号尝试次数（下单时快照）', kind: 'int' },
    ],
  },
  {
    group: '上游（Q4：不设停售线与日上限）',
    fields: [
      { path: 'upstream.balanceAlertUsd', label: '上游余额告警线（美元，只告警）', kind: 'num' },
      { path: 'upstream.legacyReserveThreads', label: '给旧单品保留的线程', kind: 'int' },
    ],
  },
  {
    group: '自动停售（D43）',
    fields: [
      { path: 'autoHold.zero.minAttempts', label: '「0 收码」停售：号码数 ≥', kind: 'int' },
      { path: 'autoHold.zero.windowH', label: '「0 收码」窗口（小时）', kind: 'int' },
      { path: 'autoHold.ratio.minAttempts', label: '低收码率：号码数 ≥', kind: 'int' },
      { path: 'autoHold.ratio.minRatePct', label: '低收码率：收码率 < %', kind: 'int' },
      { path: 'autoHold.ratio.windowH', label: '低收码率窗口（小时）', kind: 'int' },
      { path: 'autoHold.upstreamCombo.minCount', label: '上游口径组合：号码数 ≥', kind: 'int' },
      { path: 'autoHold.upstreamCombo.minRatePct', label: '上游口径组合：成功率 < %', kind: 'int' },
      { path: 'autoHold.upstreamAccount.minCount', label: '上游口径账户：号码数 ≥', kind: 'int' },
      { path: 'autoHold.upstreamAccount.minRatePct', label: '上游口径账户：成功率 < %', kind: 'int' },
      { path: 'autoHold.holdH', label: '自动停售时长（小时）', kind: 'int' },
    ],
  },
  {
    group: '熔断',
    fields: [
      { path: 'breaker.windowSec', label: '窗口（秒）', kind: 'int' },
      { path: 'breaker.minFails', label: '最少失败次数', kind: 'int' },
      { path: 'breaker.minRatio', label: '失败占比（0–1）', kind: 'num' },
      { path: 'breaker.closeAfterSec', label: '恢复探测（秒）', kind: 'int' },
    ],
  },
  {
    group: '其他',
    fields: [
      { path: 'longDurationVerified', label: '例外时长（40/45/60 分钟）已用真钱验证（D42；只影响之后下的单）', kind: 'bool' },
      { path: 'complaintWindowH', label: '售后申请窗口（小时）', kind: 'int' },
    ],
  },
]

function getPath(o: Record<string, any>, p: string): unknown {
  return p.split('.').reduce<any>((a, k) => (a == null ? a : a[k]), o)
}
function setPath(o: Record<string, any>, p: string, v: unknown): Record<string, any> {
  const keys = p.split('.')
  const out = { ...o }
  let cur: Record<string, any> = out
  for (let i = 0; i < keys.length - 1; i++) {
    cur[keys[i]] = { ...(cur[keys[i]] ?? {}) }
    cur = cur[keys[i]]
  }
  cur[keys[keys.length - 1]] = v
  return out
}

function SettingsTab({ cfg, cfgErr, onSaved }: { cfg: ConfigResp | null; cfgErr: string | null; onSaved: () => void }) {
  const [draft, setDraft] = useState<SmsConfig | null>(null)
  const [hot, setHot] = useState('')
  /** 数字输入框的原文（按字段路径）；没有就显示草稿里的值 */
  const [texts, setTexts] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    const base = cfg?.config ?? null
    setDraft(base)
    setHot((base?.hotServices ?? []).join(','))
    setTexts({})
    setErrors({})
  }, [cfg])
  if (cfgErr) return <div className="text-red-600">{cfgErr}</div>
  if (!cfg) return <div className="text-gray-400">加载中...</div>
  if (!draft) {
    return (
      <Card>
        <CardContent className="space-y-3 py-5 text-sm">
          <div className="text-red-600">sms_config 读取失败（{cfg.reason}）：接码按关闭处理（fail-closed，不回落出厂值）。</div>
          {cfg.errors && <pre className="whitespace-pre-wrap text-xs text-gray-600">{JSON.stringify(cfg.errors, null, 2)}</pre>}
          <Button size="sm" onClick={() => { setDraft({ ...cfg.factory }); setHot(cfg.factory.hotServices.join(',')); setTexts({}) }}>
            填入出厂值
          </Button>
        </CardContent>
      </Card>
    )
  }
  const save = async () => {
    const next = { ...draft, hotServices: hot.split(/[,，\s]+/).map((x) => x.trim()).filter(Boolean) }
    const r = await saveConfig(next, cfg.storedVersion)
    setErrors(r.errors ?? {})
    setMsg(r.message)
    if (r.ok) onSaved()
  }
  return (
    <Card>
      <CardContent className="space-y-5 py-5 text-sm">
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />
            总开关
          </label>
          <label className="inline-flex items-center gap-2">
            受众
            <select className={inputCls} value={draft.audience} onChange={(e) => setDraft({ ...draft, audience: e.target.value as SmsConfig['audience'] })}>
              <option value="ADMIN_ONLY">仅管理员</option>
              <option value="ALL" disabled={!cfg.orderAvailable}>
                全部用户{cfg.orderAvailable ? '' : '（下单功能上线后才能选）'}
              </option>
            </select>
          </label>
          {errors.audience && <span className="text-xs text-red-600">{errors.audience}</span>}
          <span className="text-xs text-gray-500">只有「总开关开 + 全部用户」时导航、页脚和 sitemap 才出现「短信接码」；管理员随时可以直接访问 /jiema 预览。</span>
        </div>
        {SETTINGS_FIELDS.map((g) => (
          <div key={g.group}>
            <div className="mb-2 font-medium text-gray-800">{g.group}</div>
            <div className="grid gap-2 md:grid-cols-2">
              {g.fields.map((fs) => {
                const v = getPath(draft as unknown as Record<string, any>, fs.path)
                return (
                  <label key={fs.path} className="flex flex-wrap items-center gap-2">
                    {fs.kind === 'bool' ? (
                      <>
                        <input type="checkbox" checked={!!v} onChange={(e) => setDraft(setPath(draft as unknown as Record<string, any>, fs.path, e.target.checked) as unknown as SmsConfig)} />
                        {fs.label}
                      </>
                    ) : (
                      <>
                        <span className="w-64 text-gray-600">{fs.label}</span>
                        <input
                          className={`${inputCls} w-24`}
                          inputMode={fs.kind === 'num' ? 'decimal' : 'numeric'}
                          value={texts[fs.path] ?? String(v ?? '')}
                          onChange={(e) => {
                            const raw = e.target.value
                            setTexts((t) => ({ ...t, [fs.path]: raw }))
                            setDraft(setPath(draft as unknown as Record<string, any>, fs.path, settingsNumberValue(raw)) as unknown as SmsConfig)
                          }}
                        />
                      </>
                    )}
                    {errors[fs.path] && <span className="text-xs text-red-600">{errors[fs.path]}</span>}
                  </label>
                )
              })}
            </div>
          </div>
        ))}
        <div>
          <div className="mb-1 font-medium text-gray-800">热门服务（出厂列表）</div>
          <input className={`${inputCls} w-full`} value={hot} onChange={(e) => setHot(e.target.value)} />
          <div className="mt-1 text-xs text-gray-500">只在第一次目录同步时用来初始化热门序号；之后热门以「目录 → 服务」里的热门序号为准。{errors.hotServices && <span className="text-red-600"> {errors.hotServices}</span>}</div>
        </div>
        <div className="text-xs text-gray-500">
          P2 预留（未实现，不能打开）：转售商模式 {draft.resellerMode ? '开' : '关'} · Webhook {draft.webhookEnabled ? '开' : '关'} · 旧单品迁入新引擎 {draft.legacyOnNewEngine ? '开' : '关'}。
          售价系数、成本汇率、加价、最低售价、取整、容差、锁价、换号次数在「定价」页；余额支付急停与充值开关在「余额与充值 → 设置」。
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={save}>保存（版本 {cfg.storedVersion} → {cfg.storedVersion + 1}）</Button>
          {msg && <span className="text-sm text-gray-600">{msg}</span>}
          {Object.keys(errors).length > 0 && <span className="text-xs text-red-600">{Object.entries(errors).map(([k, v]) => `${k}：${v}`).join('；')}</span>}
        </div>
      </CardContent>
    </Card>
  )
}
