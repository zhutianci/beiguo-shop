'use client'

/**
 * 商品池（设计 12.1、7.2）：站长授权给本店的商品；单品改价 / 上下架 / 排序，批量上下架与批量改价（预览 → 提交）。
 * 售价低于进货价、为 0、超出站长设的范围一律由服务端拦截（这里的提示只是体验，规则以服务端为准）。
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import type { PartnerListingDTO } from '@/lib/tenant/types'
import { gotoLogin, partnerApi, qs } from '../common/api'
import { centsToYuanInput, delistedText, notSellableText, yuan } from '../common/format'
import { Badge, Button, Card, Empty, ErrorBox, inputCls, Loading, Notice, PageTitle } from '../common/ui'
import { BatchPriceDialog } from './batch-price-dialog'

type Msg = { tone: 'green' | 'red' | 'amber'; text: string } | null

export function ProductsView({ readOnly }: { readOnly?: boolean }) {
  const [rows, setRows] = useState<PartnerListingDTO[] | null>(null)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'' | '0' | '1'>('')
  const [category, setCategory] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [msg, setMsg] = useState<Msg>(null)
  const [busy, setBusy] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)

  const load = useCallback(async () => {
    setErr('')
    const r = await partnerApi<{ rows: PartnerListingDTO[] }>(`/api/partner/catalog${qs({ q: q.trim(), status })}`)
    if (r.ok) {
      setRows(r.data.rows)
      setSelected(new Set())
    } else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }, [q, status])

  useEffect(() => {
    load()
    // 只在筛选条件变化时拉取；关键字在点「搜索」时才生效
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const categories = useMemo(() => Array.from(new Set((rows ?? []).map((r) => r.category || '未分类'))), [rows])
  const visible = useMemo(() => (rows ?? []).filter((r) => !category || (r.category || '未分类') === category), [rows, category])

  const replaceRow = (dto: PartnerListingDTO) => setRows((old) => (old ? old.map((r) => (r.listingNo === dto.listingNo ? dto : r)) : old))

  const toggleAll = () => {
    if (visible.every((r) => selected.has(r.listingNo))) setSelected(new Set())
    else setSelected(new Set(visible.map((r) => r.listingNo)))
  }

  const batchStatus = async (s: 0 | 1) => {
    if (selected.size === 0) return
    setBusy(true)
    setMsg(null)
    const r = await partnerApi<{ updated: number; rejected: { listingNo: string; reason: string }[] }>('/api/partner/listings/status', {
      method: 'POST',
      body: { listingNos: Array.from(selected), status: s },
    })
    setBusy(false)
    if (!r.ok) {
      if (r.needLogin) return gotoLogin()
      setMsg({ tone: 'red', text: r.error })
      return
    }
    const rej = r.data.rejected
    setMsg({
      tone: rej.length ? 'amber' : 'green',
      text: `已${s === 1 ? '上架' : '下架'} ${r.data.updated} 个${rej.length ? `；${rej.length} 个未处理：${rej.slice(0, 5).map((x) => `${nameOf(x.listingNo)}（${notSellableText(x.reason)}）`).join('、')}${rej.length > 5 ? ' 等' : ''}` : ''}`,
    })
    load()
  }

  const nameOf = (no: string) => rows?.find((r) => r.listingNo === no)?.name ?? no

  return (
    <div className="space-y-4">
      <PageTitle
        title="商品池"
        desc="站长授权给本店的商品。售价不能低于进货价；进货价上调到售价之上时系统会自动下架并通知你。"
        extra={
          <Button onClick={load} size="sm">
            <RefreshCw className="h-3.5 w-3.5" />
            刷新
          </Button>
        }
      />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <Card>
        <div className="flex flex-wrap items-end gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input className={inputCls + ' pl-9'} placeholder="搜索商品名" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
          </div>
          <select className={inputCls + ' w-auto'} value={status} onChange={(e) => setStatus(e.target.value as '' | '0' | '1')}>
            <option value="">全部状态</option>
            <option value="1">已上架</option>
            <option value="0">已下架</option>
          </select>
          <select className={inputCls + ' w-auto'} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">全部分类</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Button onClick={load}>搜索</Button>
        </div>
        {!readOnly && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 text-sm">
            <span className="text-gray-500">已选 {selected.size} 个</span>
            <Button size="sm" disabled={!selected.size} loading={busy} onClick={() => batchStatus(1)}>
              批量上架
            </Button>
            <Button size="sm" disabled={!selected.size} loading={busy} onClick={() => batchStatus(0)}>
              批量下架
            </Button>
            <Button size="sm" variant="primary" disabled={!rows?.length} onClick={() => setBatchOpen(true)}>
              批量改价
            </Button>
          </div>
        )}
      </Card>

      {err ? (
        <ErrorBox message={err} onRetry={load} />
      ) : !rows ? (
        <Loading />
      ) : visible.length === 0 ? (
        <Card>
          <Empty text="没有商品。站长授权商品并设置进货价后会出现在这里。" />
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                {!readOnly && (
                  <th className="px-3 py-2">
                    <input type="checkbox" checked={visible.length > 0 && visible.every((r) => selected.has(r.listingNo))} onChange={toggleAll} />
                  </th>
                )}
                <th className="px-3 py-2">商品</th>
                <th className="px-3 py-2 text-right">进货价</th>
                <th className="px-3 py-2 text-right">主站售价参考</th>
                <th className="px-3 py-2">库存</th>
                <th className="px-3 py-2">我的售价</th>
                <th className="px-3 py-2 text-right">单件余额 / 预计打款</th>
                <th className="px-3 py-2">状态</th>
                <th className="px-3 py-2">排序</th>
                <th className="px-3 py-2 text-right">本店销量</th>
                {/* 全站销量 = 前台两站显示的那个数（二期 M1），只读；与本店销量分开，免得店主以为前台数字是自己卖的 */}
                <th className="px-3 py-2 text-right" title="主站与各渠道合计，与前台商品页显示的销量一致">
                  全站销量
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((r) => (
                <ListingRow
                  key={r.listingNo}
                  r={r}
                  readOnly={readOnly}
                  checked={selected.has(r.listingNo)}
                  onCheck={(on) =>
                    setSelected((old) => {
                      const s = new Set(old)
                      if (on) s.add(r.listingNo)
                      else s.delete(r.listingNo)
                      return s
                    })
                  }
                  onSaved={replaceRow}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {batchOpen && rows && (
        <BatchPriceDialog
          open={batchOpen}
          onClose={() => setBatchOpen(false)}
          selected={Array.from(selected)}
          onDone={(text) => {
            setBatchOpen(false)
            setMsg({ tone: 'green', text })
            load()
          }}
        />
      )}
    </div>
  )
}

function ListingRow({
  r,
  readOnly,
  checked,
  onCheck,
  onSaved,
}: {
  r: PartnerListingDTO
  readOnly?: boolean
  checked: boolean
  onCheck: (on: boolean) => void
  onSaved: (dto: PartnerListingDTO) => void
}) {
  const [price, setPrice] = useState(centsToYuanInput(r.retailCents))
  const [sort, setSort] = useState(String(r.sortOrder))
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    setPrice(centsToYuanInput(r.retailCents))
    setSort(String(r.sortOrder))
  }, [r.retailCents, r.sortOrder])

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true)
    setErr('')
    const res = await partnerApi<PartnerListingDTO>(`/api/partner/listings/${encodeURIComponent(r.listingNo)}`, { method: 'PATCH', body })
    setSaving(false)
    if (res.ok) onSaved(res.data)
    else if (res.needLogin) gotoLogin()
    else setErr(res.reason ? notSellableText(res.reason) || res.error : res.error)
  }

  const priceDirty = price.trim() !== centsToYuanInput(r.retailCents)
  const sortDirty = sort.trim() !== String(r.sortOrder)

  return (
    <tr className="align-top">
      {!readOnly && (
        <td className="px-3 py-2">
          <input type="checkbox" checked={checked} onChange={(e) => onCheck(e.target.checked)} />
        </td>
      )}
      <td className="px-3 py-2">
        <div className="font-medium text-gray-900">{r.name}</div>
        <div className="mt-0.5 flex flex-wrap gap-1 text-xs text-gray-400">
          <span>{r.category || '未分类'}</span>
          <span>· 编号 {r.listingNo}</span>
        </div>
        {r.delistedReason && <div className="mt-1 text-xs text-amber-600">{delistedText(r.delistedReason)}</div>}
      </td>
      <td className="px-3 py-2 text-right tabular-nums">{yuan(r.supplyCents)}</td>
      <td className="px-3 py-2 text-right tabular-nums text-gray-500">{yuan(r.mainPriceCents)}</td>
      <td className="px-3 py-2 text-gray-600">{r.stockLevel}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <input
            className={inputCls + ' w-24 py-1'}
            value={price}
            disabled={readOnly || saving}
            inputMode="decimal"
            onChange={(e) => setPrice(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && priceDirty && patch({ retailYuan: price.trim() })}
          />
          {!readOnly && priceDirty && (
            <Button size="sm" variant="primary" loading={saving} onClick={() => patch({ retailYuan: price.trim() })}>
              保存
            </Button>
          )}
        </div>
        {r.minRetailCents != null && <div className="mt-0.5 text-xs text-gray-400">最低 {yuan(r.minRetailCents)}</div>}
        {err && <div className="mt-1 text-xs text-red-600">{err}</div>}
      </td>
      <td className="px-3 py-2 text-right tabular-nums">
        <div className={(r.unitBalanceCents ?? 0) < 0 ? 'text-red-600' : ''}>{yuan(r.unitBalanceCents)}</div>
        <div className="text-xs text-gray-400">{yuan(r.unitPayoutCents)}</div>
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-col items-start gap-1">
          {r.status === 1 ? <Badge tone="green">已上架</Badge> : <Badge>已下架</Badge>}
          {!r.sellable && r.reason && <Badge tone={r.status === 1 ? 'red' : 'amber'}>{notSellableText(r.reason)}</Badge>}
          {!readOnly && (
            <Button size="sm" variant="ghost" loading={saving} onClick={() => patch({ status: r.status === 1 ? 0 : 1 })}>
              {r.status === 1 ? '下架' : '上架'}
            </Button>
          )}
        </div>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <input
            className={inputCls + ' w-16 py-1'}
            value={sort}
            disabled={readOnly || saving}
            inputMode="numeric"
            onChange={(e) => setSort(e.target.value.replace(/[^\d]/g, ''))}
          />
          {!readOnly && sortDirty && sort !== '' && (
            <Button size="sm" loading={saving} onClick={() => patch({ sortOrder: Number(sort) })}>
              保存
            </Button>
          )}
        </div>
      </td>
      <td className="px-3 py-2 text-right tabular-nums">{r.sales}</td>
      <td className="px-3 py-2 text-right tabular-nums text-gray-500">{r.globalSales}</td>
    </tr>
  )
}
