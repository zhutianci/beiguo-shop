'use client'

/**
 * 批量改价（设计 7.2）：范围（勾选 / 全部已授权）→ 模式（进货价 ×(1+x%) / 进货价 + 固定金额 / 一口价）→ 取整 → 预览 → 提交。
 * 预览返回每行改前 / 改后售价、进货价、单件余额与预计打款、拒绝原因，以及服务端加密签名的 previewToken；
 * 提交时原样带回同一组参数与令牌，服务端逐行按进货价版本 CAS——预览之后站长改过进货价的行会被跳过（「进货价已变动，请重新预览」）。
 * 单次最多 200 个商品、每分钟最多 10 次提交（服务端限制）。
 */
import { useState } from 'react'
import { gotoLogin, partnerApi } from '../common/api'
import { notSellableText, yuan } from '../common/format'
import { Button, Field, inputCls, Modal, Notice } from '../common/ui'

type Mode = 'MARKUP_PCT' | 'MARKUP_FIXED' | 'FIXED'
type Rounding = 'NONE' | 'JIAO' | 'YUAN' | 'YUAN_UP'

interface PreviewRow {
  listingNo: string
  name: string
  supplyCents: number | null
  oldRetailCents: number | null
  newRetailCents: number | null
  unitBalanceCents: number | null
  unitPayoutCents: number | null
  reject?: string
}

const MODE_TEXT: Record<Mode, { label: string; unit: string; hint: string }> = {
  MARKUP_PCT: { label: '进货价 × (1 + x%)', unit: '%', hint: '例如 12.5 表示在进货价上加 12.5%' },
  MARKUP_FIXED: { label: '进货价 + 固定金额', unit: '元', hint: '例如 20 表示每件比进货价高 20 元' },
  FIXED: { label: '一口价', unit: '元', hint: '所有选中商品设为同一个售价' },
}
const ROUNDING_TEXT: Record<Rounding, string> = { NONE: '不取整', JIAO: '到角（四舍五入）', YUAN: '到元（四舍五入）', YUAN_UP: '到元（向上）' }

export function BatchPriceDialog({ open, onClose, selected, onDone }: { open: boolean; onClose: () => void; selected: string[]; onDone: (text: string) => void }) {
  const [scope, setScope] = useState<'selected' | 'all'>(selected.length ? 'selected' : 'all')
  const [mode, setMode] = useState<Mode>('MARKUP_PCT')
  const [value, setValue] = useState('')
  const [rounding, setRounding] = useState<Rounding>('YUAN')
  const [preview, setPreview] = useState<{ rows: PreviewRow[]; previewToken: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const params = () => ({ ...(scope === 'selected' ? { listingNos: selected } : { all: true as const }), mode, value: value.trim(), rounding })

  const reset = () => setPreview(null)

  const doPreview = async () => {
    setErr('')
    if (!value.trim()) return setErr('请输入数值')
    setLoading(true)
    const r = await partnerApi<{ rows: PreviewRow[]; previewToken: string }>('/api/partner/listings/price/preview', { method: 'POST', body: params() })
    setLoading(false)
    if (r.ok) setPreview(r.data)
    else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }

  const doCommit = async () => {
    if (!preview) return
    setErr('')
    setLoading(true)
    const r = await partnerApi<{ updated: number; skipped: { listingNo: string; reason: string }[] }>('/api/partner/listings/price/commit', {
      method: 'POST',
      body: { ...params(), previewToken: preview.previewToken },
    })
    setLoading(false)
    if (!r.ok) {
      if (r.needLogin) return gotoLogin()
      setErr(r.error)
      return
    }
    const sk = r.data.skipped
    const changed = sk.some((s) => s.reason === 'VERSION_CHANGED')
    onDone(`已改价 ${r.data.updated} 个${sk.length ? `，跳过 ${sk.length} 个${changed ? '（其中有进货价已变动的商品，请重新预览）' : ''}` : ''}`)
  }

  const okCount = preview ? preview.rows.filter((r) => !r.reject).length : 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="批量改价"
      wide
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          {preview ? (
            <>
              <Button onClick={reset}>修改规则</Button>
              <Button variant="primary" loading={loading} disabled={okCount === 0} onClick={doCommit}>
                确认提交（{okCount} 个）
              </Button>
            </>
          ) : (
            <Button variant="primary" loading={loading} onClick={doPreview}>
              预览
            </Button>
          )}
        </>
      }
    >
      {!preview ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="范围">
            <select className={inputCls} value={scope} onChange={(e) => setScope(e.target.value as 'selected' | 'all')}>
              <option value="selected" disabled={!selected.length}>
                已勾选的 {selected.length} 个商品
              </option>
              <option value="all">全部已授权商品</option>
            </select>
          </Field>
          <Field label="改价方式">
            <select className={inputCls} value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              {(Object.keys(MODE_TEXT) as Mode[]).map((m) => (
                <option key={m} value={m}>
                  {MODE_TEXT[m].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`数值（${MODE_TEXT[mode].unit}）`} hint={MODE_TEXT[mode].hint}>
            <input className={inputCls} value={value} inputMode="decimal" onChange={(e) => setValue(e.target.value)} placeholder="最多两位小数" />
          </Field>
          <Field label="取整" hint="取整后仍会校验：售价必须大于 0 且不低于进货价">
            <select className={inputCls} value={rounding} onChange={(e) => setRounding(e.target.value as Rounding)}>
              {(Object.keys(ROUNDING_TEXT) as Rounding[]).map((k) => (
                <option key={k} value={k}>
                  {ROUNDING_TEXT[k]}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Notice tone="blue">永远以当前进货价为基准计算；单件预计打款 = 售价 − 售价 × 手续费率 − 进货价。单次最多 200 个商品。</Notice>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            共 {preview.rows.length} 个，其中 {okCount} 个将被修改；标红的行不会被修改。
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-2">商品</th>
                  <th className="px-3 py-2 text-right">进货价</th>
                  <th className="px-3 py-2 text-right">原售价</th>
                  <th className="px-3 py-2 text-right">新售价</th>
                  <th className="px-3 py-2 text-right">单件余额</th>
                  <th className="px-3 py-2 text-right">单件预计打款</th>
                  <th className="px-3 py-2">说明</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.rows.map((r) => (
                  <tr key={r.listingNo} className={r.reject ? 'bg-red-50/60' : ''}>
                    <td className="px-3 py-1.5">{r.name || r.listingNo}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{yuan(r.supplyCents)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-gray-500">{yuan(r.oldRetailCents)}</td>
                    <td className="px-3 py-1.5 text-right font-medium tabular-nums">{yuan(r.newRetailCents)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{yuan(r.unitBalanceCents)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{yuan(r.unitPayoutCents)}</td>
                    <td className="px-3 py-1.5 text-xs text-red-600">{r.reject ? notSellableText(r.reject) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
    </Modal>
  )
}
