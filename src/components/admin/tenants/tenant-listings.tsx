'use client'

/**
 * /admin/tenants/[id]/listings：商品授权与进货价（设计 7.1、12.2）。
 *  · 逐个：授权开关、进货价、售价上下限、代改售价（通知渠道）；
 *  · 批量：按成本加价 / 按主站售价比例 / 一口价，取整，预览（改前改后、成本、毛利预估、会不会自动下架）后提交；
 *  · 渠道售价与上架状态在这里只读（代改走「代改售价」，记为平台操作）。
 * 成本、基准、毛利只出现在超管页面，渠道任何接口都拿不到（设计 6.4.2）。
 */
import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, Field, Modal, Notice, SubmitRow, TenantTabs, api, centsToInput, inputCls, parseYuan, useApi, yuan } from './common'

interface Row {
  productId: number
  productName: string
  categoryName: string | null
  productStatus: number
  deliveryType: string
  mainPriceCents: number
  stock: number
  costCents: number | null
  listing: null | {
    listingNo: string
    granted: boolean
    supplyCents: number | null
    supplyBaseKind: string | null
    supplyBaseCents: number | null
    minRetailCents: number | null
    maxRetailCents: number | null
    retailCents: number | null
    status: number
    sales: number
    delistedReason: string | null
    sellableReason: string | null
  }
}

const REASON: Record<string, string> = {
  NOT_LISTED: '渠道未上架',
  NOT_GRANTED: '未授权',
  NO_SUPPLY: '未设进货价',
  NOT_PRICED: '渠道未定价',
  BELOW_SUPPLY: '售价低于进货价',
  OUT_OF_RANGE: '售价超出上下限',
  PRODUCT_OFF: '商品已停售',
  TENANT_INACTIVE: '店铺未营业',
}
const DELIST: Record<string, string> = { SUPPLY_ABOVE_RETAIL: '进货价高于售价', PRODUCT_OFF: '商品停售', REVOKED: '撤销授权', OUT_OF_RANGE: '超出售价范围', NOT_PRICED: '售价被清空' }
const BASE_LABEL: Record<string, string> = { COST: '按成本', MAIN_PRICE: '按主站价', MANUAL: '一口价' }

export default function TenantListings({ id }: { id: string }) {
  const [only, setOnly] = useState<'all' | 'listed' | 'granted'>('all')
  const [q, setQ] = useState('')
  const [kw, setKw] = useState('')
  const url = `/api/admin/tenants/${id}/listings?only=${only}${kw ? `&q=${encodeURIComponent(kw)}` : ''}`
  const { data, error, loading, reload } = useApi<Row[]>(url)
  const [edit, setEdit] = useState<Row | null>(null)
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [batch, setBatch] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const rows = data ?? []
  const toggle = (pid: number) => {
    const s = new Set(picked)
    if (s.has(pid)) s.delete(pid)
    else s.add(pid)
    setPicked(s)
  }
  return (
    <div className="space-y-4">
      <TenantTabs id={id} active="listings" />
      {msg && <Notice kind="ok">{msg}</Notice>}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>商品授权与进货价</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <select className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" value={only} onChange={(e) => setOnly(e.target.value as typeof only)}>
              <option value="all">全部商品</option>
              <option value="listed">已建上架行</option>
              <option value="granted">已授权</option>
            </select>
            <input className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" placeholder="商品名" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setKw(q.trim())} />
            <Button variant="outline" size="sm" onClick={() => setKw(q.trim())}>
              搜索
            </Button>
            <Button size="sm" onClick={() => setBatch(true)}>
              批量设进货价{picked.size ? `（已选 ${picked.size}）` : ''}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && <Notice kind="error">{error}</Notice>}
          {loading && !data ? (
            <div className="py-12 text-center text-gray-400">加载中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="pb-2">
                      <input
                        type="checkbox"
                        checked={rows.length > 0 && picked.size === rows.length}
                        onChange={(e) => setPicked(e.target.checked ? new Set(rows.map((r) => r.productId)) : new Set())}
                      />
                    </th>
                    <th className="pb-2 font-medium">商品</th>
                    <th className="pb-2 text-right font-medium">主站价</th>
                    <th className="pb-2 text-right font-medium">成本（仅超管）</th>
                    <th className="pb-2 font-medium">授权</th>
                    <th className="pb-2 text-right font-medium">进货价</th>
                    <th className="pb-2 text-right font-medium">渠道售价</th>
                    <th className="pb-2 font-medium">上架 / 可售</th>
                    <th className="pb-2 text-right font-medium">销量</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const l = r.listing
                    return (
                      <tr key={r.productId} className="border-b border-gray-50 align-top">
                        <td className="py-2">
                          <input type="checkbox" checked={picked.has(r.productId)} onChange={() => toggle(r.productId)} />
                        </td>
                        <td className="py-2">
                          <div className="font-medium text-gray-900">{r.productName}</div>
                          <div className="text-xs text-gray-400">
                            #{r.productId} · {r.categoryName ?? '—'} · {r.deliveryType} {r.productStatus !== 1 && <Badge tone="bg-gray-200 text-gray-600">已下架</Badge>}
                          </div>
                        </td>
                        <td className="py-2 text-right">{yuan(r.mainPriceCents)}</td>
                        <td className="py-2 text-right text-gray-500">{yuan(r.costCents)}</td>
                        <td className="py-2">{l?.granted ? <Badge tone="bg-green-100 text-green-700">已授权</Badge> : <Badge>未授权</Badge>}</td>
                        <td className="py-2 text-right">
                          {yuan(l?.supplyCents)}
                          {l?.supplyBaseKind && <div className="text-xs text-gray-400">{BASE_LABEL[l.supplyBaseKind] ?? l.supplyBaseKind}</div>}
                          {l?.minRetailCents != null && <div className="text-xs text-gray-400">下限 {yuan(l.minRetailCents)}</div>}
                        </td>
                        <td className="py-2 text-right">{yuan(l?.retailCents)}</td>
                        <td className="py-2 text-xs">
                          {l ? (l.status === 1 ? <Badge tone="bg-green-100 text-green-700">上架</Badge> : <Badge>下架</Badge>) : '—'}
                          {l?.delistedReason && <div className="text-amber-700">自动下架：{DELIST[l.delistedReason] ?? l.delistedReason}</div>}
                          {l?.granted && l.sellableReason && <div className="text-gray-500">{REASON[l.sellableReason] ?? l.sellableReason}</div>}
                        </td>
                        <td className="py-2 text-right">{l?.sales ?? 0}</td>
                        <td className="py-2 text-right">
                          <Button size="sm" variant="outline" onClick={() => setEdit(r)}>
                            编辑
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      {edit && (
        <EditDialog
          id={id}
          row={edit}
          onClose={() => setEdit(null)}
          onDone={(m) => {
            setEdit(null)
            setMsg(m)
            reload()
          }}
        />
      )}
      {batch && (
        <BatchDialog
          id={id}
          picked={Array.from(picked)}
          onClose={() => setBatch(false)}
          onDone={(m) => {
            setBatch(false)
            setMsg(m)
            setPicked(new Set())
            reload()
          }}
        />
      )}
    </div>
  )
}

function EditDialog({ id, row, onClose, onDone }: { id: string; row: Row; onClose: () => void; onDone: (m: string) => void }) {
  const l = row.listing
  const [f, setF] = useState({
    granted: l?.granted ?? false,
    supply: centsToInput(l?.supplyCents),
    min: centsToInput(l?.minRetailCents),
    max: centsToInput(l?.maxRetailCents),
    retail: centsToInput(l?.retailCents),
  })
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    const body: Record<string, unknown> = { productId: row.productId }
    if (f.granted !== (l?.granted ?? false)) body.granted = f.granted
    const fields: [string, string, number | null | undefined][] = [
      ['supplyCents', f.supply, l?.supplyCents],
      ['minRetailCents', f.min, l?.minRetailCents],
      ['maxRetailCents', f.max, l?.maxRetailCents],
      ['retailCents', f.retail, l?.retailCents],
    ]
    for (const [k, v, old] of fields) {
      const c = parseYuan(v)
      if (c !== null && (Number.isNaN(c) || c <= 0)) return setErr('金额格式不对（大于 0，最多两位小数）')
      if (c !== (old ?? null)) body[k] = c
    }
    if (Object.keys(body).length === 1) return setErr('没有改动')
    if ('retailCents' in body && !confirm('代改售价会记为平台操作并通知渠道，确认？')) return
    setBusy(true)
    const r = await api<{ delisted: boolean }>(`/api/admin/tenants/${id}/listings`, { method: 'PUT', body })
    setBusy(false)
    if (!r.success) return setErr(r.error)
    onDone(r.message || '已保存')
  }
  return (
    <Modal title={`编辑：${row.productName}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3 text-sm">
        <div className="text-gray-500">
          主站价 {yuan(row.mainPriceCents)} · 成本 {yuan(row.costCents)}（成本只有超管可见）
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={f.granted} disabled={!f.granted && row.productStatus !== 1} onChange={(e) => setF({ ...f, granted: e.target.checked })} />
          授权给该渠道{row.productStatus !== 1 && '（商品已下架，不能授权）'}
        </label>
        <Field label="进货价（元）" hint="改动后 supplyVersion + 1；售价低于新进货价的上架行会自动下架并通知渠道">
          <input className={inputCls} value={f.supply} onChange={(e) => setF({ ...f, supply: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="售价下限（元，可空）" hint="Q4 推荐 = 主站价">
            <input className={inputCls} value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} />
          </Field>
          <Field label="售价上限（元，可空）">
            <input className={inputCls} value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} />
          </Field>
        </div>
        <Field label="渠道售价（元）—— 代改" hint="一般由渠道自己改；这里改记为平台操作并通知渠道">
          <input className={inputCls} value={f.retail} onChange={(e) => setF({ ...f, retail: e.target.value })} />
        </Field>
        {err && <Notice kind="error">{err}</Notice>}
        <SubmitRow onCancel={onClose} loading={busy} />
      </form>
    </Modal>
  )
}

interface PreviewRow {
  productId: number
  productName: string
  oldSupplyCents: number | null
  newSupplyCents: number | null
  baseCents: number | null
  costCents: number | null
  marginCents: number | null
  retailCents: number | null
  willDelist: boolean
  skipReason?: string
}

function BatchDialog({ id, picked, onClose, onDone }: { id: string; picked: number[]; onClose: () => void; onDone: (m: string) => void }) {
  const [scopeKind, setScopeKind] = useState<'picked' | 'all'>(picked.length ? 'picked' : 'all')
  const [base, setBase] = useState<'COST' | 'MAIN_PRICE' | 'MANUAL'>('COST')
  const [mode, setMode] = useState<'PCT' | 'ADD' | 'SUB'>('PCT')
  const [value, setValue] = useState('')
  const [rounding, setRounding] = useState<'NONE' | 'JIAO' | 'YUAN' | 'YUAN_UP'>('YUAN')
  const [grant, setGrant] = useState(false)
  const [preview, setPreview] = useState<{ rows: PreviewRow[]; previewToken: string } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const rule = useMemo(() => {
    const v = value.trim()
    if (base === 'MANUAL') {
      const c = parseYuan(v)
      return c && c > 0 ? { base, cents: c } : null
    }
    if (mode === 'PCT') {
      const n = Number(v)
      if (!v || !Number.isFinite(n) || n < 0) return null
      return { base, mode: 'PCT', value: Math.round(n * 100) }
    }
    const c = parseYuan(v)
    return c != null && !Number.isNaN(c) && c >= 0 ? { base, mode, value: c } : null
  }, [base, mode, value])

  const doPreview = async () => {
    setErr(null)
    if (!rule) return setErr('请填写规则数值')
    setBusy(true)
    const r = await api<{ rows: PreviewRow[]; previewToken: string }>(`/api/admin/tenants/${id}/listings/batch/preview`, {
      body: { scope: scopeKind === 'picked' ? { productIds: picked } : { all: true }, rule, rounding },
    })
    setBusy(false)
    if (!r.success) return setErr(r.error)
    setPreview(r.data)
  }
  const doCommit = async () => {
    if (!preview) return
    setBusy(true)
    const r = await api<{ updated: number; skipped: { productId: number; reason: string }[]; delisted: number; unchanged: number; granted: number }>(
      `/api/admin/tenants/${id}/listings/batch/commit`,
      { body: { previewToken: preview.previewToken, grant } },
    )
    setBusy(false)
    if (!r.success) return setErr(r.error)
    const d = r.data
    const vc = d.skipped.filter((s) => s.reason === 'VERSION_CHANGED').length
    const off = d.skipped.filter((s) => s.reason === 'PRODUCT_OFF').length
    onDone(
      `已更新 ${d.updated} 行${d.granted ? `（新授权 ${d.granted}）` : ''}，自动下架 ${d.delisted}，无需改动 ${d.unchanged}` +
        (vc ? `；${vc} 行进货价在预览后被改过，已跳过，请重新预览` : '') +
        (off ? `；${off} 行商品已下架，未授权` : ''),
    )
  }
  const modes = base === 'COST' ? (['PCT', 'ADD'] as const) : base === 'MAIN_PRICE' ? (['PCT', 'SUB'] as const) : []
  const modeLabel: Record<string, string> = { PCT: base === 'COST' ? '加百分比（%）' : '乘百分比（%）', ADD: '加固定金额（元）', SUB: '减固定金额（元）' }
  return (
    <Modal title="批量设置进货价" onClose={onClose} wide>
      <div className="space-y-4 text-sm">
        <Notice>永远从基准重算（同一规则提交多少次结果都一样）。取整后 ≤ 0 的行不写；低于成本只标红。提交时逐行比对版本，预览后被改过的行会跳过。渠道只收到新旧进货价，看不到规则、成本与毛利。</Notice>
        <div className="grid gap-3 md:grid-cols-5">
          <Field label="范围">
            <select className={inputCls} value={scopeKind} onChange={(e) => setScopeKind(e.target.value as typeof scopeKind)}>
              <option value="picked" disabled={!picked.length}>
                已勾选（{picked.length}）
              </option>
              <option value="all">全部在售商品</option>
            </select>
          </Field>
          <Field label="基准">
            <select
              className={inputCls}
              value={base}
              onChange={(e) => {
                const b = e.target.value as typeof base
                setBase(b)
                setMode('PCT')
                setPreview(null)
              }}
            >
              <option value="COST">按成本加价</option>
              <option value="MAIN_PRICE">按主站售价</option>
              <option value="MANUAL">一口价</option>
            </select>
          </Field>
          {modes.length > 0 && (
            <Field label="方式">
              <select className={inputCls} value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
                {modes.map((m) => (
                  <option key={m} value={m}>
                    {modeLabel[m]}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label={base === 'MANUAL' ? '一口价（元）' : modeLabel[mode]}>
            <input className={inputCls} value={value} onChange={(e) => setValue(e.target.value)} placeholder={mode === 'PCT' ? (base === 'COST' ? '2.8' : '85') : '10.00'} />
          </Field>
          <Field label="取整">
            <select className={inputCls} value={rounding} onChange={(e) => setRounding(e.target.value as typeof rounding)}>
              <option value="NONE">不取整</option>
              <option value="JIAO">到角</option>
              <option value="YUAN">到元（四舍五入）</option>
              <option value="YUAN_UP">到元（向上）</option>
            </select>
          </Field>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={grant} onChange={(e) => setGrant(e.target.checked)} />
            同时授权给该渠道（只对在售商品生效）
          </label>
          <Button variant="outline" onClick={doPreview} loading={busy}>
            预览
          </Button>
        </div>
        {err && <Notice kind="error">{err}</Notice>}
        {preview && (
          <>
            <div className="max-h-[50vh] overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-1">商品</th>
                    <th className="py-1 text-right">基准</th>
                    <th className="py-1 text-right">成本</th>
                    <th className="py-1 text-right">改前</th>
                    <th className="py-1 text-right">改后</th>
                    <th className="py-1 text-right">毛利预估</th>
                    <th className="py-1 text-right">渠道售价</th>
                    <th className="py-1">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r) => (
                    <tr key={r.productId} className={`border-b border-gray-50 ${r.skipReason ? 'text-gray-400' : ''}`}>
                      <td className="py-1">{r.productName}</td>
                      <td className="py-1 text-right">{yuan(r.baseCents)}</td>
                      <td className="py-1 text-right">{yuan(r.costCents)}</td>
                      <td className="py-1 text-right">{yuan(r.oldSupplyCents)}</td>
                      <td className="py-1 text-right font-medium">{yuan(r.newSupplyCents)}</td>
                      <td className={`py-1 text-right ${r.marginCents != null && r.marginCents < 0 ? 'font-semibold text-red-600' : ''}`}>{yuan(r.marginCents)}</td>
                      <td className="py-1 text-right">{yuan(r.retailCents)}</td>
                      <td className="py-1">
                        {r.skipReason === 'NO_COST' && '无成本数据，跳过'}
                        {r.skipReason === 'NON_POSITIVE' && '取整后 ≤ 0，跳过'}
                        {r.willDelist && <span className="text-amber-700">将自动下架（售价低于新进货价）</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button onClick={doCommit} loading={busy}>
                提交 {preview.rows.filter((r) => r.newSupplyCents != null).length} 行
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
