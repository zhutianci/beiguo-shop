'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, ClipboardPaste, Loader2, Search, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  MAX_USERS_AUDIENCE,
  SEGMENT_PRESETS,
  SKIP_REASON_LABEL,
  type AudiencePreview,
  type AudienceSpec,
  type CatalogResponse,
  type SegmentRules,
  type SkipReason,
  type Topic,
} from '@/lib/marketing/types'
import { cn } from '@/lib/utils'
import { fmtInt, isAbortError, mktFetch } from './api'

/**
 * 受众选择：全部活跃用户 / 按条件筛选 / 手工指定，右侧实时预估可发人数与排除原因。
 *
 * 这是受控组件：只负责把界面操作翻译成 AudienceSpec 交给 onChange，保存（带 baseUpdatedAt 的 PUT）
 * 由页面统一做 —— 编辑器也在保存同一条活动，两处各自存会互相 409。
 *
 * 【预估只是预估】按「现在」的订阅状态、抑制名单、频控历史算；真正发送时每一封都会在发出前再复核一次
 * （退订立即生效是法律要求），所以实际发出数只会 ≤ 这里的数字。界面上要讲清楚，免得站长拿两个数对账。
 */

interface Option {
  id: number
  label: string
  sub?: string
}

interface VipTierLite {
  level: number
  name: string
  minSpend: number
}

const DAY_MIN = 1
const DAY_MAX = 3650

/** 忽略 undefined 与 excludeInactive 后做稳定序列化，用来判断当前规则是否等于某个预设 */
export function rulesKey(r: SegmentRules): string {
  const entries = Object.entries(r)
    .filter(([k, v]) => k !== 'excludeInactive' && v !== undefined && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => [k, Array.isArray(v) ? [...v].sort((a, b) => Number(a) - Number(b)) : v] as const)
    .sort(([a], [b]) => a.localeCompare(b))
  return JSON.stringify(entries)
}

export function cleanRules(r: SegmentRules): SegmentRules {
  const out: SegmentRules = {}
  for (const [k, v] of Object.entries(r) as [keyof SegmentRules, unknown][]) {
    if (v === undefined || v === null) continue
    if (Array.isArray(v) && v.length === 0) continue
    ;(out as Record<string, unknown>)[k] = v
  }
  return out
}

export function AudienceBuilder({
  value,
  topic,
  onChange,
  disabled = false,
  onPreview,
}: {
  value: AudienceSpec
  topic: Topic
  onChange: (spec: AudienceSpec) => void
  disabled?: boolean
  onPreview?: (p: AudiencePreview | null) => void
}) {
  /* ---------- 选项数据：商品、分类、会员档位（任何一个拿不到都只降级为显示 id，不挡操作） ---------- */
  const [products, setProducts] = useState<Option[]>([])
  const [categories, setCategories] = useState<Option[]>([])
  const [tiers, setTiers] = useState<VipTierLite[]>([])

  useEffect(() => {
    const ctrl = new AbortController()
    ;(async () => {
      try {
        const [cat, cats, vip] = await Promise.all([
          mktFetch<CatalogResponse>('/api/admin/marketing/catalog', { signal: ctrl.signal }),
          mktFetch<{ id: number; name: string; _count?: { products: number } }[]>('/api/admin/categories', {
            signal: ctrl.signal,
          }),
          mktFetch<{ tiers: VipTierLite[] }>('/api/admin/vip/config', { signal: ctrl.signal }),
        ])
        if (cat.ok && cat.data) {
          setProducts(cat.data.products.map((p) => ({ id: p.id, label: p.name, sub: `¥${p.price}` })))
        }
        if (cats.ok && Array.isArray(cats.data)) {
          setCategories(cats.data.map((c) => ({ id: c.id, label: c.name, sub: c._count ? `${c._count.products} 个商品` : undefined })))
        }
        if (vip.ok && vip.data?.tiers) setTiers(vip.data.tiers)
      } catch (e) {
        if (!isAbortError(e)) console.warn('[marketing] audience options load failed')
      }
    })()
    return () => ctrl.abort()
  }, [])

  /* ---------- 实时预估 ---------- */
  const [preview, setPreview] = useState<AudiencePreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const previewAbort = useRef<AbortController | null>(null)
  const onPreviewRef = useRef(onPreview)
  onPreviewRef.current = onPreview
  const specKey = JSON.stringify(value) + '|' + topic

  useEffect(() => {
    // 防抖：连续输入天数时不要每个字都打一次预估（预估要扫全体用户，不便宜）
    const t = setTimeout(async () => {
      previewAbort.current?.abort()
      const ctrl = new AbortController()
      previewAbort.current = ctrl
      setPreviewLoading(true)
      setPreviewError('')
      try {
        const r = await mktFetch<AudiencePreview>('/api/admin/marketing/audience/preview', {
          body: { audience: value, topic },
          signal: ctrl.signal,
        })
        if (previewAbort.current !== ctrl) return
        if (r.ok && r.data) {
          setPreview(r.data)
          onPreviewRef.current?.(r.data)
        } else {
          setPreviewError(r.error || '预估失败')
          onPreviewRef.current?.(null)
        }
      } catch (e) {
        if (isAbortError(e)) return
        setPreviewError('预估失败')
      } finally {
        if (previewAbort.current === ctrl) setPreviewLoading(false)
      }
    }, 500)
    return () => clearTimeout(t)
    // specKey 已经涵盖 value 与 topic
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specKey])

  useEffect(() => () => previewAbort.current?.abort(), [])

  /* ---------- 类型切换：各类型的输入各自记住，切回来不丢 ---------- */
  const memo = useRef<{ ALL?: AudienceSpec; SEGMENT?: AudienceSpec; USERS?: AudienceSpec }>({})
  memo.current[value.type] = value

  const switchType = (type: AudienceSpec['type']) => {
    if (disabled || type === value.type) return
    const remembered = memo.current[type]
    if (remembered) return onChange(remembered)
    if (type === 'ALL') onChange({ type: 'ALL', excludeInactive: true })
    else if (type === 'SEGMENT') onChange({ type: 'SEGMENT', rules: {} })
    else onChange({ type: 'USERS', userIds: [] })
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        {/* 三种受众 */}
        <div className="grid gap-2 sm:grid-cols-3">
          {(
            [
              { t: 'ALL', title: '全部活跃用户', desc: '所有有邮箱的注册用户（默认排除长期不活跃）' },
              { t: 'SEGMENT', title: '按条件筛选', desc: '注册时间、付款、消费、买过什么、会员档位' },
              { t: 'USERS', title: '手工指定', desc: '粘贴用户 ID / 邮箱，或从用户管理勾选' },
            ] as const
          ).map((o) => (
            <button
              key={o.t}
              type="button"
              disabled={disabled}
              onClick={() => switchType(o.t)}
              className={cn(
                'rounded-lg border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed',
                value.type === o.t ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full border',
                    value.type === o.t ? 'border-primary-600 bg-primary-600' : 'border-gray-300'
                  )}
                >
                  {value.type === o.t && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                {o.title}
              </div>
              <div className="mt-1 text-xs leading-relaxed text-gray-500">{o.desc}</div>
            </button>
          ))}
        </div>

        {value.type === 'ALL' && (
          <div className="rounded-lg border border-gray-200 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4"
                checked={value.excludeInactive}
                disabled={disabled}
                onChange={(e) => onChange({ type: 'ALL', excludeInactive: e.target.checked })}
              />
              <span>
                <span className="text-sm font-medium text-gray-900">排除长期不活跃的用户（推荐）</span>
                <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                  注册超过 180 天、近 365 天没有付过款、近 180 天也没点过营销邮件的人不发。
                  这些地址最容易已经废弃或把邮件标成垃圾，发给他们几乎没有回报，却会拉低整个发信地址的信誉。
                </span>
              </span>
            </label>
            {!value.excludeInactive && (
              <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700">
                已关闭排除：会发给所有有邮箱的注册用户。首次向老用户群发时不建议这样做。
              </p>
            )}
          </div>
        )}

        {value.type === 'SEGMENT' && (
          <SegmentForm
            rules={value.rules}
            disabled={disabled}
            onChange={(rules) => onChange({ type: 'SEGMENT', rules: cleanRules(rules) })}
            products={products}
            categories={categories}
            tiers={tiers}
          />
        )}

        {value.type === 'USERS' && (
          <UsersPicker
            userIds={value.userIds}
            disabled={disabled}
            onChange={(ids) => onChange({ type: 'USERS', userIds: ids })}
            sample={preview?.sample || []}
          />
        )}
      </div>

      <PreviewPanel preview={preview} loading={previewLoading} error={previewError} audienceType={value.type} />
    </div>
  )
}

/* ============================== 条件筛选 ============================== */

function SegmentForm({
  rules,
  disabled,
  onChange,
  products,
  categories,
  tiers,
}: {
  rules: SegmentRules
  disabled: boolean
  onChange: (r: SegmentRules) => void
  products: Option[]
  categories: Option[]
  tiers: VipTierLite[]
}) {
  const set = <K extends keyof SegmentRules>(k: K, v: SegmentRules[K]) => onChange({ ...rules, [k]: v })
  const currentKey = rulesKey(rules)

  // 「买过 Claude / 买过 ChatGPT」：优先按分类匹配（分类名稳定），没有对应分类再按商品名匹配
  const brandChips = useMemo(() => {
    const mk = (label: string, re: RegExp) => {
      const cats = categories.filter((c) => re.test(c.label)).map((c) => c.id)
      if (cats.length) return { key: label, label: `买过 ${label}`, rules: { boughtCategoryIds: cats } as SegmentRules }
      const prods = products.filter((p) => re.test(p.label)).map((p) => p.id)
      if (prods.length) return { key: label, label: `买过 ${label}`, rules: { boughtProductIds: prods.slice(0, 100) } as SegmentRules }
      return { key: label, label: `买过 ${label}`, rules: null }
    }
    return [mk('Claude', /claude/i), mk('ChatGPT', /chatgpt|gpt/i)]
  }, [categories, products])

  const warnings: string[] = []
  if (rules.registeredWithinDays && rules.registeredBeforeDays && rules.registeredWithinDays <= rules.registeredBeforeDays) {
    warnings.push('「注册不超过 N 天」要大于「注册超过 N 天」，否则没有人同时满足。')
  }
  if (rules.paid === 'no' && (rules.lastPaidWithinDays || rules.spendMin || rules.boughtProductIds?.length || rules.boughtCategoryIds?.length)) {
    warnings.push('选了「从没付过款」，又设了付款/消费/买过的条件，结果会是 0 人。')
  }
  if (rules.spendMin != null && rules.spendMax != null && rules.spendMin > rules.spendMax) {
    warnings.push('累计消费的下限大于上限。')
  }
  if (rules.lastPaidWithinDays && rules.noPaidWithinDays && rules.lastPaidWithinDays <= rules.noPaidWithinDays) {
    warnings.push('「最近 N 天内付过款」要大于「最近 N 天内没付过款」才可能有人同时满足。')
  }
  const empty = rulesKey(rules) === '[]'

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 p-4">
      <div>
        <div className="mb-2 text-xs font-medium text-gray-500">一键预设（点一下替换当前条件）</div>
        <div className="flex flex-wrap gap-2">
          {SEGMENT_PRESETS.map((p) => {
            const active = rulesKey(p.rules) === currentKey
            return (
              <button
                key={p.key}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...p.rules, excludeInactive: rules.excludeInactive })}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors',
                  active ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600 hover:border-gray-400'
                )}
              >
                {active && <Check className="-ml-0.5 mr-1 inline h-3 w-3" />}
                {p.label}
              </button>
            )
          })}
          {brandChips.map((c) => {
            const active = !!c.rules && rulesKey(c.rules) === currentKey
            return (
              <button
                key={c.key}
                type="button"
                disabled={disabled || !c.rules}
                title={c.rules ? undefined : `没找到名称含 ${c.key} 的分类或在售商品`}
                onClick={() => c.rules && onChange({ ...c.rules, excludeInactive: rules.excludeInactive })}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                  active ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600 hover:border-gray-400'
                )}
              >
                {active && <Check className="-ml-0.5 mr-1 inline h-3 w-3" />}
                {c.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
        <Field label="注册时间">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            注册不超过
            <NumInput value={rules.registeredWithinDays} min={DAY_MIN} max={DAY_MAX} disabled={disabled} onChange={(v) => set('registeredWithinDays', v)} />
            天
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            注册已超过
            <NumInput value={rules.registeredBeforeDays} min={DAY_MIN} max={DAY_MAX} disabled={disabled} onChange={(v) => set('registeredBeforeDays', v)} />
            天
          </div>
        </Field>

        <Field label="付款情况">
          <select
            value={rules.paid || 'any'}
            disabled={disabled}
            onChange={(e) => set('paid', e.target.value === 'any' ? undefined : (e.target.value as 'yes' | 'no'))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm"
          >
            <option value="any">不限</option>
            <option value="yes">付过款（至少一单）</option>
            <option value="no">从没付过款</option>
          </select>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            最近
            <NumInput value={rules.lastPaidWithinDays} min={DAY_MIN} max={DAY_MAX} disabled={disabled} onChange={(v) => set('lastPaidWithinDays', v)} />
            天内付过款
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            最近
            <NumInput value={rules.noPaidWithinDays} min={DAY_MIN} max={DAY_MAX} disabled={disabled} onChange={(v) => set('noPaidWithinDays', v)} />
            天内没付过款
          </div>
        </Field>

        <Field label="累计消费（货款，不含税）" hint="与会员等级同口径：已付款且未取消订单的货款合计">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            ¥
            <NumInput value={rules.spendMin} min={0} max={10_000_000} decimal disabled={disabled} onChange={(v) => set('spendMin', v)} placeholder="不限" />
            至 ¥
            <NumInput value={rules.spendMax} min={0} max={10_000_000} decimal disabled={disabled} onChange={(v) => set('spendMax', v)} placeholder="不限" />
          </div>
        </Field>

        <Field label="会员档位" hint="按累计消费自动定级（与站内会员等级一致）">
          {tiers.length === 0 ? (
            <p className="text-xs text-gray-400">会员档位加载中或未配置</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {tiers.map((t) => {
                const on = rules.vipLevels?.includes(t.level) ?? false
                return (
                  <button
                    key={t.level}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      const cur = new Set(rules.vipLevels || [])
                      if (on) cur.delete(t.level)
                      else cur.add(t.level)
                      set('vipLevels', Array.from(cur).sort((a, b) => a - b))
                    }}
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-xs',
                      on ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    )}
                    title={`累计消费 ≥ ¥${t.minSpend}`}
                  >
                    {t.name}
                  </button>
                )
              })}
            </div>
          )}
        </Field>

        <Field label="买过的分类" hint="买过其中任意一个分类下的商品（已付款）">
          <ChipPicker
            options={categories}
            value={rules.boughtCategoryIds || []}
            disabled={disabled}
            max={100}
            placeholder="搜索分类"
            onChange={(ids) => set('boughtCategoryIds', ids)}
          />
        </Field>

        <Field label="买过的商品" hint="买过其中任意一个（已付款）；列表只含在售商品，已下架的会显示为 #id">
          <ChipPicker
            options={products}
            value={rules.boughtProductIds || []}
            disabled={disabled}
            max={100}
            placeholder="搜索商品"
            onChange={(ids) => set('boughtProductIds', ids)}
          />
        </Field>
      </div>

      <label className="flex cursor-pointer items-center gap-2 border-t border-gray-100 pt-3 text-sm text-gray-700">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={!!rules.excludeInactive}
          disabled={disabled}
          onChange={(e) => set('excludeInactive', e.target.checked || undefined)}
        />
        同时排除长期不活跃的用户
        <span className="text-xs text-gray-400">（注册超 180 天、近 365 天没付款、近 180 天没点过营销邮件）</span>
      </label>

      {empty && (
        <p className="rounded bg-sky-50 px-3 py-2 text-xs text-sky-800">
          还没有设置任何条件 —— 现在等于「全部有邮箱的用户」。点上面的预设或填写条件来缩小范围。
        </p>
      )}
      {warnings.map((w) => (
        <p key={w} className="rounded bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {w}
        </p>
      ))}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 text-sm font-medium text-gray-700">
        {label}
        {hint && <span className="ml-1 text-xs font-normal text-gray-400">· {hint}</span>}
      </div>
      {children}
    </div>
  )
}

/**
 * 数字输入：本地保留原始字符串，合法时才上报，清空 = 不设此条件。
 * 直接受控于数字会让「删掉重打」的中间态（空串、「0」）立刻被夹回去，打字很别扭。
 */
function NumInput({
  value,
  onChange,
  min,
  max,
  decimal = false,
  disabled,
  placeholder = '—',
}: {
  value: number | undefined
  onChange: (v: number | undefined) => void
  min: number
  max: number
  decimal?: boolean
  disabled?: boolean
  placeholder?: string
}) {
  const [text, setText] = useState(value == null ? '' : String(value))
  // 最近一次由本输入框上报的值：外部值与它不同（例如点了预设）才覆盖输入框里的文字，
  // 否则用户打到一半的「36500」会因为非法被上报成「不设」、又被这里清空
  const last = useRef<number | undefined>(value)
  useEffect(() => {
    if (value !== last.current) {
      last.current = value
      setText(value == null ? '' : String(value))
    }
  }, [value])
  const report = (v: number | undefined) => {
    last.current = v
    onChange(v)
  }
  const isValid = (n: number) => Number.isFinite(n) && n >= min && n <= max && (decimal || Number.isInteger(n))
  const invalid = text.trim() !== '' && !isValid(Number(text))
  return (
    <input
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      value={text}
      disabled={disabled}
      placeholder={placeholder}
      title={invalid ? `请输入 ${min}–${max} 之间的${decimal ? '数字' : '整数'}` : undefined}
      onChange={(e) => {
        const t = e.target.value.replace(decimal ? /[^\d.]/g : /\D/g, '')
        setText(t)
        const n = Number(t)
        // 非法值按「不设此条件」上报（输入框标红提示），绝不悄悄保留上一个合法值 —— 那样界面与实际条件对不上
        if (t.trim() === '' || !isValid(n)) return report(undefined)
        report(decimal ? Math.round(n * 100) / 100 : n)
      }}
      className={cn(
        'w-20 rounded-md border px-2 py-1 text-center text-sm tabular-nums',
        invalid ? 'border-red-400 bg-red-50' : 'border-gray-300'
      )}
    />
  )
}

/** 可搜索的多选：已选显示为标签，下面一个搜索框 + 候选列表 */
function ChipPicker({
  options,
  value,
  onChange,
  disabled,
  max,
  placeholder,
}: {
  options: Option[]
  value: number[]
  onChange: (ids: number[]) => void
  disabled?: boolean
  max: number
  placeholder: string
}) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options])
  const selected = new Set(value)
  const kw = q.trim().toLowerCase()
  const filtered = options.filter((o) => !kw || o.label.toLowerCase().includes(kw) || String(o.id) === kw).slice(0, 80)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const toggle = (id: number) => {
    if (selected.has(id)) onChange(value.filter((v) => v !== id))
    else if (value.length < max) onChange([...value, id])
  }

  return (
    <div ref={boxRef} className="relative">
      {value.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {value.map((id) => (
            <span key={id} className="inline-flex max-w-full items-center gap-1 rounded bg-primary-50 px-1.5 py-0.5 text-xs text-primary-800">
              <span className="truncate">{byId.get(id)?.label || `#${id}`}</span>
              {!disabled && (
                <button type="button" onClick={() => toggle(id)} className="text-primary-500 hover:text-primary-800" aria-label="移除">
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          placeholder={options.length ? placeholder : '加载中…'}
          className="w-full rounded-lg border border-gray-300 py-1.5 pl-8 pr-3 text-sm"
        />
      </div>
      {open && !disabled && (
        <div className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">{options.length ? '没有匹配项' : '暂无可选项'}</div>
          ) : (
            filtered.map((o) => {
              const on = selected.has(o.id)
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggle(o.id)}
                  className={cn('flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50', on && 'bg-primary-50/60')}
                >
                  <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border', on ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300')}>
                    {on && <Check className="h-3 w-3" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-gray-800">{o.label}</span>
                  {o.sub && <span className="shrink-0 text-xs text-gray-400">{o.sub}</span>}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

/* ============================== 手工指定 ============================== */

const SHOW_IDS = 120

function UsersPicker({
  userIds,
  onChange,
  disabled,
  sample,
}: {
  userIds: number[]
  onChange: (ids: number[]) => void
  disabled: boolean
  sample: AudiencePreview['sample']
}) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ added: number; dup: number; notFound: string[]; capped: number } | null>(null)
  const [err, setErr] = useState('')
  const sampleMap = useMemo(() => new Map(sample.map((s) => [s.id, s])), [sample])

  const paste = async () => {
    if (!text.trim()) return
    setBusy(true)
    setErr('')
    setResult(null)
    try {
      const r = await mktFetch<{ userIds: number[]; notFound: string[] }>('/api/admin/marketing/audience/paste', { body: { text } })
      if (!r.ok || !r.data) {
        setErr(r.error || '识别失败')
        return
      }
      const cur = new Set(userIds)
      const next = [...userIds]
      let added = 0
      let dup = 0
      let capped = 0
      for (const id of r.data.userIds) {
        if (cur.has(id)) {
          dup++
          continue
        }
        if (next.length >= MAX_USERS_AUDIENCE) {
          capped++
          continue
        }
        cur.add(id)
        next.push(id)
        added++
      }
      onChange(next)
      setResult({ added, dup, notFound: r.data.notFound, capped })
      if (r.data.notFound.length === 0) setText('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-gray-700">
          已选 <span className="font-semibold text-gray-900">{fmtInt(userIds.length)}</span> 人
          <span className="ml-1 text-xs text-gray-400">（最多 {fmtInt(MAX_USERS_AUDIENCE)} 人）</span>
        </div>
        {userIds.length > 0 && !disabled && (
          <button
            type="button"
            onClick={() => {
              if (confirm(`清空已选的 ${userIds.length} 人？`)) onChange([])
            }}
            className="text-xs text-red-600 hover:underline"
          >
            清空
          </button>
        )}
      </div>

      {userIds.length === 0 ? (
        <p className="rounded bg-gray-50 px-3 py-4 text-center text-xs leading-relaxed text-gray-500">
          还没有选人。在下面粘贴用户 ID 或邮箱，或者去
          <Link href="/admin/users" className="mx-1 text-primary-600 hover:underline">
            用户管理
          </Link>
          勾选用户后点「发营销邮件」。
        </p>
      ) : (
        <div className="flex max-h-40 flex-wrap gap-1 overflow-y-auto rounded bg-gray-50 p-2">
          {userIds.slice(0, SHOW_IDS).map((id) => {
            const s = sampleMap.get(id)
            return (
              <span key={id} className="inline-flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-xs text-gray-700 shadow-sm" title={s?.email}>
                #{id}
                {s?.email && <span className="max-w-[140px] truncate text-gray-400">{s.email}</span>}
                {!disabled && (
                  <button type="button" onClick={() => onChange(userIds.filter((x) => x !== id))} className="text-gray-400 hover:text-red-600" aria-label="移除">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </span>
            )
          })}
          {userIds.length > SHOW_IDS && <span className="px-1 text-xs text-gray-400">…等 {fmtInt(userIds.length)} 人</span>}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">粘贴用户 ID 或邮箱</label>
        <textarea
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder={'每行一个，或用逗号 / 空格分隔，ID 与邮箱可以混着贴，例如：\n12\n35, 88\nsomeone@qq.com'}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs"
        />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button size="sm" variant="outline" onClick={paste} loading={busy} disabled={disabled || !text.trim()}>
            <ClipboardPaste className="mr-1 h-3.5 w-3.5" />
            识别并加入
          </Button>
          {err && <span className="text-xs text-red-600">{err}</span>}
          {result && (
            <span className="text-xs text-gray-600">
              新加入 {result.added} 人
              {result.dup > 0 && `，${result.dup} 人已在名单里`}
              {result.capped > 0 && <span className="text-amber-600">，{result.capped} 人超出 {MAX_USERS_AUDIENCE} 人上限未加入</span>}
            </span>
          )}
        </div>
        {result && result.notFound.length > 0 && (
          <div className="mt-2 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <div className="font-medium">没找到对应用户的 {result.notFound.length} 项（已留在输入框里，可以修改后再识别）：</div>
            <div className="mt-1 break-all font-mono">
              {result.notFound.slice(0, 50).join('、')}
              {result.notFound.length > 50 && ` …等 ${result.notFound.length} 项`}
            </div>
            <div className="mt-1 text-amber-700">只能发给本站注册用户；不是注册用户的邮箱不会被加入（设计上刻意不做）。</div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================== 预估面板 ============================== */

function PreviewPanel({
  preview,
  loading,
  error,
  audienceType,
}: {
  preview: AudiencePreview | null
  loading: boolean
  error: string
  audienceType: AudienceSpec['type']
}) {
  const excluded = preview
    ? (Object.entries(preview.excluded) as [SkipReason, number][]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])
    : []
  return (
    <div className="h-fit rounded-lg border border-gray-200 bg-gray-50/60 p-4 lg:sticky lg:top-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Users className="h-4 w-4 text-gray-400" />
          预计收件人
        </div>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
      </div>

      {error && !preview ? (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      ) : !preview ? (
        <p className="mt-4 text-sm text-gray-400">计算中…</p>
      ) : (
        <div className={cn('transition-opacity', loading && 'opacity-60')}>
          <div className="mt-3">
            <span className="text-3xl font-semibold tabular-nums text-gray-900">{fmtInt(preview.eligible)}</span>
            <span className="ml-1 text-sm text-gray-500">人可发</span>
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {audienceType === 'USERS' ? '名单' : '条件'}命中 {fmtInt(preview.matched)} 人
          </div>
          {error && <p className="mt-1 text-xs text-red-600">{error}（显示的是上一次的结果）</p>}

          {excluded.length > 0 && (
            <div className="mt-4">
              <div className="mb-1 text-xs font-medium text-gray-500">不会发给（原因）</div>
              <ul className="space-y-1 text-xs">
                {excluded.map(([k, n]) => (
                  <li key={k} className="flex justify-between gap-2 text-gray-600">
                    <span className="truncate">{SKIP_REASON_LABEL[k] || k}</span>
                    <span className="tabular-nums">{fmtInt(n)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.freqCapEstimate > 0 && (
            <p className="mt-3 rounded bg-amber-50 px-2 py-1.5 text-xs leading-relaxed text-amber-700">
              其中约 {fmtInt(preview.freqCapEstimate)} 人最近已收过营销邮件，发送时会因频率上限被跳过或推迟。
            </p>
          )}

          {preview.eligible === 0 && (
            <p className="mt-3 rounded bg-red-50 px-2 py-1.5 text-xs text-red-700">可发人数为 0，这样是不能提交发送的。</p>
          )}

          {preview.sample.length > 0 && (
            <div className="mt-4">
              <div className="mb-1 text-xs font-medium text-gray-500">样本（前 {preview.sample.length} 人）</div>
              <ul className="max-h-48 space-y-0.5 overflow-y-auto text-xs">
                {preview.sample.map((u) => (
                  <li key={u.id} className="truncate">
                    <Link href={`/admin/users/${u.id}`} target="_blank" className="text-gray-700 hover:text-primary-600 hover:underline">
                      {u.email}
                    </Link>
                    {u.nickname && <span className="ml-1 text-gray-400">{u.nickname}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-4 border-t border-gray-200 pt-2 text-[11px] leading-relaxed text-gray-400">
            按现在的订阅状态估算。真正发送时每一封都会在发出前再复核一次（中途退订的人立即生效），实际发出数只会小于等于这个数。
          </p>
        </div>
      )}
    </div>
  )
}
