'use client'

/**
 * 渠道单退款弹窗（设计 8.4 ②、8.6；契约见实施分包 7.4）。站长线下原路退款之后，在这里记账：
 *  · 本次退的货款（可按件：默认 = 件数 × 售价，不超过未退货款）、本次退的开票税费（只有未开票或红冲后才退）；
 *  · 承担方（系统不自动推断）：PROPORTIONAL（平台原因，默认）/ CHANNEL（渠道原因，另扣平台损失）/ PLATFORM（站长补偿渠道）；
 *  · CHANNEL 的损失默认 = 本次退件中已交付部分的进货价分摊（服务端 defaultLossCents 计算，**从不读成本**），只能下调；
 *    「参考：真实成本」只显示、不预填（设计 8.4：LOSS 分录渠道看得见，按成本预填等于泄露成本）；
 *  · 应退现金 = 本次货款 + 本次税费 − 尚未抵扣的少付额；预览走服务端同一段代码（refund.preview），数字不会两套口径。
 * 保存：PUT /api/admin/orders/[id] { refund }：订单 CAS + 冲销分录 + 售后申请结案 + 审计同一事务；并发保存 → 409。
 */

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, X } from 'lucide-react'

export interface RefundContext {
  amountCents: number
  /** 可退税费上限的参考：结账随单税费，或事后开票已付的税费（服务端按关联发票复核） */
  taxCents: number
  refundedGoodsCents: number
  refundedTaxCents: number
  refundedQty: number
  quantity: number
  unitPriceCents: number
  supplyCents: number | null
  shortUnappliedCents: number
  deliveredQty: number
  deliveryType: string
  costRefYuan: number | null
  settleVersion: number
  settleState: string | null
  payStatus: string
  deliveryStatus: string
}

export interface RefundAfterSale {
  id: number
  requestNo: string
  reason: string
  suggestedBearer: string | null
  suggestedGoodsCents: number | null
}

type Bearer = 'PROPORTIONAL' | 'CHANNEL' | 'PLATFORM'
type Full = '' | 'CANCELLED' | 'REFUNDED'

const BEARER_LABEL: Record<Bearer, string> = {
  PROPORTIONAL: '按比例（平台原因：缺货、卡密无效、上游故障）',
  CHANNEL: '渠道承担（渠道承诺、虚假宣传等），另扣平台损失',
  PLATFORM: '平台承担（站长补偿渠道，渠道余额不冲销）',
}

const REASON_TEXT: Record<string, string> = {
  OVER_REFUND: '超出可退金额（累计退款不能超过货款 / 税费 / 件数）',
  LOSS_TOO_HIGH: '损失金额超过本次冲回的进货款',
  TAX_KEPT_UNCONFIRMED: '全额退货款但未退税费：请勾选「税费不退」确认',
  NOT_FULL: '选择了取消 / 已退款，但累计退货款还没到全额',
  EMPTY: '本次退款金额为 0',
  CONFLICT: '订单结算状态已变化（可能刚有人保存或解冻），请关闭弹窗刷新后重试',
  NOT_PAID: '订单未付款',
}

function newRequestId(): string {
  const r = Math.random().toString(36).slice(2, 10)
  return `rf_${Date.now().toString(36)}_${r}`
}
function toCentsInput(v: string): number | null {
  const t = v.trim()
  if (!t) return null
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return NaN
  const [a, b = ''] = t.split('.')
  return Number(a) * 100 + Number((b + '00').slice(0, 2))
}
const yuan = (c: number | null | undefined) => (c == null ? '—' : `¥${(c / 100).toFixed(2)}`)

export default function RefundDialog({
  orderId,
  orderNo,
  ctx,
  afterSale,
  initialFull = '',
  onClose,
  onDone,
}: {
  orderId: number
  orderNo: string
  ctx: RefundContext
  afterSale?: RefundAfterSale | null
  initialFull?: Full
  onClose: () => void
  onDone: (msg: string, warnings: string[]) => void
}) {
  const [requestId] = useState(newRequestId)
  const leftGoods = Math.max(0, ctx.amountCents - ctx.refundedGoodsCents)
  const leftTax = Math.max(0, ctx.taxCents - ctx.refundedTaxCents)
  const leftQty = Math.max(0, ctx.quantity - ctx.refundedQty)
  const [qty, setQty] = useState(String(initialFull ? leftQty : 0))
  // 渠道的「建议退款额」只是建议：按本单剩余可退货款封顶（渠道可能对已部分退款的单建议了超过剩余的数）
  const [goods, setGoods] = useState(((initialFull ? leftGoods : Math.min(afterSale?.suggestedGoodsCents ?? 0, leftGoods)) / 100).toFixed(2))
  const [tax, setTax] = useState('0.00')
  // 承担方由站长判定（设计 8.4「系统不自动推断」）：默认 PROPORTIONAL，渠道的建议只在上方显示、不预选
  const [bearer, setBearer] = useState<Bearer>('PROPORTIONAL')
  const [loss, setLoss] = useState('')
  const [tradeNo, setTradeNo] = useState('')
  const [full, setFull] = useState<Full>(initialFull)
  const [taxKept, setTaxKept] = useState(false)
  const [note, setNote] = useState('')
  const [preview, setPreview] = useState<{ lossDefaultCents: number; cashRefundCents: number; reversedPurchaseCents: number; deliveredQty: number } | null>(null)
  const [previewErr, setPreviewErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  // 按件：件数一变，货款默认 = 件数 × 售价（不超过未退货款）
  const onQty = (v: string) => {
    setQty(v)
    const n = parseInt(v)
    if (Number.isInteger(n) && n >= 0) setGoods((Math.min(leftGoods, n * ctx.unitPriceCents) / 100).toFixed(2))
  }

  const body = useMemo(() => {
    const g = toCentsInput(goods)
    const t = toCentsInput(tax)
    const l = toCentsInput(loss)
    const q = parseInt(qty || '0')
    if (g == null || Number.isNaN(g) || t == null || Number.isNaN(t) || (l != null && Number.isNaN(l)) || !Number.isInteger(q) || q < 0) return null
    return {
      refundGoodsCents: g,
      refundTaxCents: t,
      refundQty: q,
      bearer,
      ...(bearer === 'CHANNEL' && l != null ? { lossCents: l } : {}),
      refundTradeNo: tradeNo.trim() || null,
      requestId,
      expectedVersion: ctx.settleVersion,
      ...(full ? { fullStatus: full } : {}),
      ...(taxKept ? { confirmTaxKept: true } : {}),
      ...(afterSale ? { afterSaleId: afterSale.id } : {}),
      note: note.trim() || null,
    }
  }, [goods, tax, loss, qty, bearer, tradeNo, requestId, ctx.settleVersion, full, taxKept, afterSale, note])

  /*
   * 预览请求不带手填损失：应退现金与损失无关，而手填值超过默认值时服务端会拒绝，
   * 带上它会让预览失败、连默认值都看不到。手填值另在本地按预览出的默认值校验（服务端保存时再校验一次）
   */
  const previewBody = useMemo(() => {
    if (!body) return null
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { lossCents: _omit, ...rest } = body as typeof body & { lossCents?: number }
    return rest
  }, [body])

  // 预览（防抖）：默认损失、应退现金。只读，服务端在事务里算完即回滚
  useEffect(() => {
    if (!previewBody || (previewBody.refundGoodsCents === 0 && previewBody.refundTaxCents === 0)) {
      setPreview(null)
      setPreviewErr('')
      return
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/orders/${orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refund: { ...previewBody, preview: true } }),
        })
        const d = await res.json()
        if (d.success && d.data?.preview) {
          setPreview(d.data.preview)
          setPreviewErr('')
        } else {
          setPreview(null)
          setPreviewErr(REASON_TEXT[d.code] || d.error || '预览失败')
        }
      } catch {
        setPreviewErr('网络错误，预览失败')
      }
    }, 400)
    return () => clearTimeout(t)
  }, [previewBody, orderId])

  // 手填损失超过默认值（只能下调）：本地先拦，免得点了保存才被服务端退回
  const lossInput = bearer === 'CHANNEL' ? toCentsInput(loss) : null
  const lossTooHigh = preview != null && lossInput != null && !Number.isNaN(lossInput) && lossInput > preview.lossDefaultCents

  const submit = async () => {
    if (!body) {
      setErr('金额格式不正确（最多两位小数）')
      return
    }
    const cash = preview?.cashRefundCents
    if (!confirm(`确认已线下原路退给买家${cash != null ? ` ${yuan(cash)}` : ''}，并按「${BEARER_LABEL[bearer].split('（')[0]}」记账？`)) return
    setBusy(true)
    setErr('')
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refund: body }),
      })
      const d = await res.json()
      if (!d.success) {
        setErr(REASON_TEXT[d.code] || d.error || '保存失败')
        return
      }
      onDone(d.message || '退款已记录', Array.isArray(d.data?.warnings) ? d.data.warnings : [])
    } catch {
      setErr('网络错误，请重试')
    } finally {
      setBusy(false)
    }
  }

  const fullGoods = body ? ctx.refundedGoodsCents + body.refundGoodsCents >= ctx.amountCents : false

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 max-h-[90vh] overflow-y-auto text-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">渠道单退款 · {orderNo}</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100" aria-label="关闭">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
          <span>货款 {yuan(ctx.amountCents)}（已退 {yuan(ctx.refundedGoodsCents)}）</span>
          <span>税费 {yuan(ctx.taxCents)}（已退 {yuan(ctx.refundedTaxCents)}）</span>
          <span>件数 {ctx.quantity}（已退 {ctx.refundedQty}，已交付 {ctx.deliveredQty}）</span>
          <span>进货款 {yuan(ctx.supplyCents)}</span>
          {ctx.shortUnappliedCents > 0 && <span className="col-span-2 text-amber-700">尚未抵扣的少付额 {yuan(ctx.shortUnappliedCents)}（会从应退现金里扣掉）</span>}
          <span className="col-span-2">结算状态 {ctx.settleState ?? '未计提'} · 版本 v{ctx.settleVersion}</span>
        </div>

        {afterSale && (
          <div className="mb-3 rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs text-violet-800">
            处理渠道退款申请 {afterSale.requestNo}：{afterSale.reason}
            {afterSale.suggestedBearer ? ` · 建议承担方 ${afterSale.suggestedBearer}` : ''}
            {afterSale.suggestedGoodsCents != null ? ` · 建议退 ${yuan(afterSale.suggestedGoodsCents)}` : ''}
            <div className="mt-1 text-violet-600">保存后该申请自动标为已处理，并通知渠道。</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs text-gray-500">按件退（件数，按金额让利填 0）</span>
            <input type="number" min={0} max={leftQty} value={qty} onChange={(e) => onQty(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500">本次退货款（元，未退 {yuan(leftGoods)}）</span>
            <input value={goods} onChange={(e) => setGoods(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono" />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500">本次退税费（元，未退 {yuan(leftTax)}；已开票需先红冲）</span>
            <input value={tax} onChange={(e) => setTax(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono" />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500">退款流水号（选填）</span>
            <input value={tradeNo} onChange={(e) => setTradeNo(e.target.value)} maxLength={64} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono" />
          </label>
        </div>

        <label className="mt-3 block">
          <span className="text-xs text-gray-500">承担方（必选，系统不自动推断）</span>
          <select value={bearer} onChange={(e) => setBearer(e.target.value as Bearer)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2">
            {(Object.keys(BEARER_LABEL) as Bearer[]).map((b) => (
              <option key={b} value={b}>
                {BEARER_LABEL[b]}
              </option>
            ))}
          </select>
        </label>

        {bearer === 'CHANNEL' && (
          <label className="mt-3 block">
            <span className="text-xs text-gray-500">
              平台损失（元）：留空 = 默认 {preview ? yuan(preview.lossDefaultCents) : '（按进货价分摊，预览后显示）'}，只能下调（未交付的件为 0）
              {preview ? `；本次冲回的进货款 ${yuan(preview.reversedPurchaseCents)}` : ''}
            </span>
            <input value={loss} onChange={(e) => setLoss(e.target.value)} placeholder="留空用默认值" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono" />
            {lossTooHigh && preview && (
              <span className="mt-1 block text-xs text-red-600">不能高于默认值 {yuan(preview.lossDefaultCents)}，只能下调</span>
            )}
            {ctx.costRefYuan != null && (
              <span className="mt-1 block text-[11px] text-gray-400">参考：真实成本 ¥{ctx.costRefYuan.toFixed(2)}（仅供参考，不会预填；渠道看不到）</span>
            )}
          </label>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-1.5">
            <input type="radio" checked={full === ''} onChange={() => setFull('')} /> 部分退款（订单状态不变）
          </label>
          <label className="inline-flex items-center gap-1.5">
            <input type="radio" checked={full === 'CANCELLED'} onChange={() => setFull('CANCELLED')} /> 全额退并取消订单
          </label>
          <label className="inline-flex items-center gap-1.5">
            <input type="radio" checked={full === 'REFUNDED'} onChange={() => setFull('REFUNDED')} /> 全额退并标为已退款
          </label>
        </div>
        {full && !fullGoods && <p className="mt-1 text-xs text-amber-700">取消 / 已退款要求累计退货款达到全额。</p>}
        {fullGoods && leftTax > 0 && (toCentsInput(tax) ?? 0) < leftTax && (
          <label className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-800">
            <input type="checkbox" checked={taxKept} onChange={(e) => setTaxKept(e.target.checked)} /> 税费不退（发票已开或另有约定），确认
          </label>
        )}

        <label className="mt-3 block">
          <span className="text-xs text-gray-500">处理说明（选填；有售后申请时渠道可见）</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
        </label>

        <div className="mt-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
          {preview ? (
            <>
              本次应退给买家的现金：<b className="text-sm">{yuan(preview.cashRefundCents)}</b>
              {bearer === 'CHANNEL' && <span className="ml-2">平台损失 {loss ? `（手填）` : `默认 ${yuan(preview.lossDefaultCents)}`}</span>}
            </>
          ) : previewErr ? (
            <span className="text-red-600">{previewErr}</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-blue-500">
              <Loader2 className="h-3 w-3 animate-spin" /> 填写金额后自动预览应退现金
            </span>
          )}
        </div>

        {err && <p className="mt-3 rounded bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={submit} loading={busy} disabled={!body || lossTooHigh}>
            确认已退款并记账
          </Button>
        </div>
      </div>
    </div>
  )
}
