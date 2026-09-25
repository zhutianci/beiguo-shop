'use client'

/**
 * 商品选择器（单选 / 多选）与公开券批次选择器。数据来自 GET /api/admin/marketing/catalog
 * （在售商品的公开字段、可领的公开券批次），由编辑器外壳加载一次放进上下文。
 */
import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Check, Plus, RotateCcw, Search, ShoppingBag, X } from 'lucide-react'
import type { CatalogResponse, ProductCard } from '@/lib/marketing/types'
import { cn } from '@/lib/utils'
import { useEditorCtx } from './editor-context'
import { Field, Hint } from './fields'

function money(s: string | null | undefined): string {
  const n = Number(s)
  return Number.isFinite(n) ? `¥${n.toFixed(2)}` : '—'
}

function ProductThumb({ p, size = 40 }: { p: ProductCard | null; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-50"
      style={{ width: size, height: size }}
    >
      {p?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <ShoppingBag className="h-4 w-4 text-gray-300" />
      )}
    </div>
  )
}

function ProductLine({ p, right }: { p: ProductCard; right?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <ProductThumb p={p} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-gray-800">{p.name}</div>
        <div className="flex items-baseline gap-1.5 text-xs">
          <span className="font-medium text-gray-900">{money(p.price)}</span>
          {p.originalPrice && <span className="text-gray-400 line-through">{money(p.originalPrice)}</span>}
          <span className="text-gray-400">#{p.id}</span>
        </div>
      </div>
      {right}
    </div>
  )
}

function CatalogState() {
  const { catalogState, reloadCatalog } = useEditorCtx()
  if (catalogState === 'loading') return <p className="py-3 text-center text-xs text-gray-400">正在加载商品…</p>
  if (catalogState === 'error')
    return (
      <p className="py-3 text-center text-xs text-red-600">
        商品目录加载失败
        <button type="button" onClick={reloadCatalog} className="ml-2 inline-flex items-center gap-0.5 text-primary-600 hover:underline">
          <RotateCcw className="h-3 w-3" />
          重试
        </button>
      </p>
    )
  return null
}

/** 搜索 + 列表面板（内嵌在表单里展开，不用浮层：左栏是滚动容器，浮层容易被裁掉） */
function ProductList({
  selected,
  onPick,
  isDisabled,
  onClose,
  multi,
}: {
  selected: Set<number>
  onPick: (p: ProductCard) => void
  isDisabled?: (p: ProductCard) => boolean
  onClose: () => void
  multi?: boolean
}) {
  const { catalog, catalogState } = useEditorCtx()
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const k = q.trim().toLowerCase()
    if (!k) return catalog.products
    return catalog.products.filter((p) => p.name.toLowerCase().includes(k) || String(p.id) === k.replace(/^#/, ''))
  }, [catalog.products, q])
  return (
    <div className="mt-2 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 px-2.5 py-1.5">
        <Search className="h-3.5 w-3.5 text-gray-400" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation()
              onClose()
            }
          }}
          placeholder="搜索商品名或 #ID"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm focus:outline-none focus:ring-0"
        />
        <button type="button" onClick={onClose} className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="收起">
          {multi ? <span className="px-1 text-xs text-primary-600">完成</span> : <X className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto overscroll-contain py-1">
        {catalogState !== 'ready' ? (
          <CatalogState />
        ) : list.length === 0 ? (
          <p className="py-3 text-center text-xs text-gray-400">{catalog.products.length ? '没有匹配的商品' : '没有在售商品'}</p>
        ) : (
          list.map((p) => {
            const on = selected.has(p.id)
            const dis = !on && !!isDisabled?.(p)
            return (
              <button
                key={p.id}
                type="button"
                disabled={dis}
                onClick={() => onPick(p)}
                className={cn(
                  'block w-full px-2.5 py-1.5 text-left transition-colors',
                  on ? 'bg-primary-50' : 'hover:bg-gray-50',
                  dis && 'cursor-not-allowed opacity-40'
                )}
              >
                <ProductLine
                  p={p}
                  right={
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                        on ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 bg-white'
                      )}
                    >
                      {on && <Check className="h-3 w-3" />}
                    </span>
                  }
                />
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

export function ProductPicker({ label = '商品', value, onChange }: { label?: React.ReactNode; value: number; onChange: (id: number) => void }) {
  const { productMap, catalogState, readOnly } = useEditorCtx()
  const p = productMap.get(value) || null
  const [open, setOpen] = useState(!p)
  return (
    <Field label={label}>
      {p ? (
        <div className="rounded-lg border border-gray-200 bg-white p-2">
          <ProductLine
            p={p}
            right={
              <button
                type="button"
                disabled={readOnly}
                onClick={() => setOpen((o) => !o)}
                className="shrink-0 rounded-md px-2 py-1 text-xs text-primary-600 hover:bg-primary-50"
              >
                {open ? '收起' : '更换'}
              </button>
            }
          />
        </div>
      ) : catalogState === 'ready' ? (
        <Hint tone="error">{value > 0 ? `商品 #${value} 已下架或不存在，请重新选择` : '请选择一个商品'}</Hint>
      ) : (
        <CatalogState />
      )}
      {open && !readOnly && (
        <ProductList
          selected={new Set([value])}
          onPick={(x) => {
            onChange(x.id)
            setOpen(false)
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </Field>
  )
}

export function ProductMultiPicker({
  label = '商品',
  value,
  onChange,
  min = 0,
  max,
  hint,
}: {
  label?: React.ReactNode
  value: number[]
  onChange: (ids: number[]) => void
  min?: number
  max: number
  hint?: React.ReactNode
}) {
  const { productMap, catalogState, readOnly } = useEditorCtx()
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => new Set(value), [value])
  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= value.length) return
    const next = value.slice()
    const [x] = next.splice(i, 1)
    next.splice(j, 0, x)
    onChange(next)
  }
  const missing = value.filter((id) => !productMap.has(id))
  return (
    <Field
      label={label}
      right={
        <span className={cn('tabular-nums', value.length < min || value.length > max ? 'text-red-500' : '')}>
          {value.length}/{max}
        </span>
      }
      hint={hint}
    >
      {value.length > 0 && (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {value.map((id, i) => {
            const p = productMap.get(id)
            const dup = value.indexOf(id) !== i
            return (
              <div key={`${id}-${i}`} className={cn('flex items-center gap-1 px-2 py-1.5', dup && 'bg-amber-50')} title={dup ? '重复的商品' : undefined}>
                <div className="min-w-0 flex-1">
                  {p ? (
                    <ProductLine p={p} />
                  ) : (
                    <div className="text-xs text-red-600">{catalogState === 'ready' ? `#${id} 已下架或不存在` : `#${id}`}</div>
                  )}
                </div>
                <button type="button" disabled={readOnly || i === 0} onClick={() => move(i, -1)} className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30" title="上移">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={readOnly || i === value.length - 1}
                  onClick={() => move(i, 1)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                  title="下移"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="移除"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
      {!open && !readOnly && (
        <button
          type="button"
          disabled={value.length >= max}
          onClick={() => setOpen(true)}
          className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-gray-300 py-1.5 text-xs text-gray-600 hover:border-primary-400 hover:text-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          {value.length >= max ? `最多 ${max} 个` : '添加商品'}
        </button>
      )}
      {open && (
        <ProductList
          multi
          selected={selected}
          isDisabled={() => value.length >= max}
          onPick={(p) => onChange(selected.has(p.id) ? value.filter((x) => x !== p.id) : value.concat([p.id]))}
          onClose={() => setOpen(false)}
        />
      )}
      {value.length < min && <Hint tone="error">至少选 {min} 个商品</Hint>}
      {new Set(value).size !== value.length && <Hint tone="warn">有重复的商品，建议移除重复项</Hint>}
      {missing.length > 0 && catalogState === 'ready' && <Hint tone="error">有商品已下架或不存在，请移除后重新选择</Hint>}
    </Field>
  )
}

/* ============================== 公开券批次 ============================== */

type CatalogCoupon = CatalogResponse['coupons'][number]

export function couponRuleText(c: { kind: 'THRESHOLD' | 'PRODUCT'; discount: string | number; minAmount: string | number }): string {
  const d = Number(c.discount)
  const m = Number(c.minAmount)
  const dt = Number.isFinite(d) ? String(Number(d.toFixed(2))) : String(c.discount)
  const mt = Number.isFinite(m) ? String(Number(m.toFixed(2))) : String(c.minAmount)
  if (c.kind === 'PRODUCT') return m > 0 ? `指定商品满 ${mt} 减 ${dt}` : `指定商品立减 ${dt}`
  return m > 0 ? `满 ${mt} 减 ${dt}` : `无门槛减 ${dt}`
}

function shortDate(iso: string | null): string {
  if (!iso) return '长期有效'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  // 仅展示用：北京日期（固定 +8，不依赖本机时区）
  const s = new Date(d.getTime() + 8 * 3600_000).toISOString()
  return `${s.slice(0, 10)} 截止`
}

export function ClaimCouponPicker({ value, onChange }: { value: string | undefined; onChange: (code: string) => void }) {
  const { catalog, catalogState, readOnly } = useEditorCtx()
  const found = value ? catalog.coupons.find((c) => c.code === value) : undefined
  return (
    <Field label="选择公开券批次" hint="只列出正在进行、未过期、还有余量的公开券（不含抽奖券与邮件直发券）">
      {catalogState !== 'ready' ? (
        <CatalogState />
      ) : catalog.coupons.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 px-3 py-3 text-center text-xs text-gray-500">
          没有可领的公开券批次，请先到「优惠券」页创建
        </div>
      ) : (
        <div className="max-h-64 divide-y divide-gray-100 overflow-y-auto overscroll-contain rounded-lg border border-gray-200 bg-white">
          {catalog.coupons.map((c: CatalogCoupon) => {
            const on = c.code === value
            return (
              <button
                key={c.code}
                type="button"
                disabled={readOnly}
                onClick={() => onChange(c.code)}
                className={cn('flex w-full items-center gap-2.5 px-2.5 py-2 text-left', on ? 'bg-primary-50' : 'hover:bg-gray-50')}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                    on ? 'border-primary-600 bg-primary-600' : 'border-gray-300 bg-white'
                  )}
                >
                  {on && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-gray-800">{c.name}</div>
                  <div className="text-xs text-gray-500">
                    {couponRuleText(c)} · 剩 {c.remaining} 张 · {shortDate(c.endAt)}
                  </div>
                </div>
                <code className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">{c.code}</code>
              </button>
            )
          })}
        </div>
      )}
      {value && catalogState === 'ready' && !found && (
        <Hint tone="error">当前领取码「{value}」已不可领（过期、领完或已停用），请重新选择</Hint>
      )}
    </Field>
  )
}
