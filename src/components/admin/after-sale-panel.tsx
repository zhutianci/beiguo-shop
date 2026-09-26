'use client'

/**
 * 订单详情里的「售后申请」面板（设计 8.4、12.2）：本单上渠道发起的退款 / 补发 / 升级申请与处理按钮。
 *  · 退款类：点「处理退款」打开退款弹窗（金额、承担方、冲销与结案同一事务），这里不提供「已处理」；
 *  · 补发类：先用订单页的「补发卡密」执行，再点「已处理」；
 *  · 升级类：「清除升级」= 清掉订单的 escalatedAt 并结案；
 *  · 任何一类都可以「驳回」（说明必填，渠道可见）。
 * 售后列表页（/admin/after-sales）用同一套动作按钮（AfterSaleActions）。
 */

import { useState } from 'react'

export interface AfterSaleRow {
  id: number
  requestNo: string
  kind: string
  status: string
  reason: string
  suggestedBearer: string | null
  suggestedGoodsCents: number | null
  resultNote: string | null
  bearer?: string | null
  refundGoodsCents?: number | null
  refundTaxCents?: number | null
  lossCents?: number | null
  createdAt: string
  handledAt: string | null
}

export const AFTER_SALE_KIND: Record<string, string> = { REFUND: '退款', REISSUE: '补发', ESCALATE: '升级给站长', BAN_REQUEST: '申请全局封禁' }
export const AFTER_SALE_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: '待处理', cls: 'bg-amber-100 text-amber-800' },
  DONE: { label: '已处理', cls: 'bg-green-100 text-green-700' },
  REJECTED: { label: '已驳回', cls: 'bg-gray-200 text-gray-600' },
  CANCELLED: { label: '渠道已撤回', cls: 'bg-gray-100 text-gray-500' },
}

const yuan = (c: number | null | undefined) => (c == null ? '—' : `¥${(c / 100).toFixed(2)}`)
const fmt = (s: string | null) => (s ? new Date(s).toLocaleString('zh-CN', { hour12: false }) : '—')

/** 驳回 / 已处理 / 清除升级。返回 true = 已改动，调用方刷新 */
export async function handleAfterSale(id: number, action: 'REJECT' | 'DONE' | 'CLEAR_ESCALATION'): Promise<boolean> {
  const note =
    action === 'REJECT'
      ? prompt('驳回说明（渠道可见，必填）：')
      : prompt(action === 'CLEAR_ESCALATION' ? '处理说明（渠道可见，选填）：' : '处理说明（渠道可见，选填）：', '')
  if (note === null) return false
  if (action === 'REJECT' && !note.trim()) {
    alert('驳回必须填写说明')
    return false
  }
  const res = await fetch(`/api/admin/after-sales/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, note: note.trim() || null }),
  })
  const d = await res.json().catch(() => null)
  if (!d?.success) {
    alert(d?.error || '操作失败')
    return false
  }
  return true
}

export function AfterSaleActions({
  row,
  onRefund,
  onChanged,
}: {
  row: Pick<AfterSaleRow, 'id' | 'kind' | 'status'>
  onRefund?: () => void
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)
  if (row.status !== 'PENDING') return null
  const run = async (a: 'REJECT' | 'DONE' | 'CLEAR_ESCALATION') => {
    setBusy(true)
    try {
      if (await handleAfterSale(row.id, a)) onChanged()
    } finally {
      setBusy(false)
    }
  }
  const btn = 'rounded px-2 py-1 text-xs disabled:opacity-40'
  return (
    <span className="inline-flex flex-wrap gap-1">
      {row.kind === 'REFUND' && onRefund && (
        <button disabled={busy} onClick={onRefund} className={`${btn} bg-primary-600 text-white hover:bg-primary-700`}>
          处理退款
        </button>
      )}
      {row.kind === 'ESCALATE' && (
        <button disabled={busy} onClick={() => run('CLEAR_ESCALATION')} className={`${btn} bg-violet-100 text-violet-700 hover:bg-violet-200`}>
          清除升级
        </button>
      )}
      {row.kind !== 'REFUND' && row.kind !== 'ESCALATE' && (
        <button disabled={busy} onClick={() => run('DONE')} className={`${btn} bg-green-100 text-green-700 hover:bg-green-200`}>
          已处理
        </button>
      )}
      <button disabled={busy} onClick={() => run('REJECT')} className={`${btn} bg-gray-100 text-gray-600 hover:bg-gray-200`}>
        驳回
      </button>
    </span>
  )
}

export default function AfterSalePanel({
  rows,
  escalatedAt,
  onRefund,
  onChanged,
}: {
  rows: AfterSaleRow[]
  escalatedAt?: string | null
  onRefund: (row: AfterSaleRow) => void
  onChanged: () => void
}) {
  if (!rows.length && !escalatedAt) return null
  return (
    <div className="rounded-lg border border-violet-200 p-4 text-sm">
      <h4 className="mb-2 font-medium text-gray-800">
        售后申请
        {escalatedAt && <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-medium text-red-700">渠道已升级给站长 · {fmt(escalatedAt)}</span>}
      </h4>
      {rows.length === 0 ? (
        <div className="text-xs text-gray-400">没有售后申请记录</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const st = AFTER_SALE_STATUS[r.status] ?? { label: r.status, cls: 'bg-gray-100 text-gray-600' }
            return (
              <div key={r.id} className="rounded bg-gray-50 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs text-gray-500">{r.requestNo}</span>
                  <span className="text-xs">
                    <b>{AFTER_SALE_KIND[r.kind] ?? r.kind}</b>
                    <span className={`ml-2 rounded px-1.5 py-0.5 ${st.cls}`}>{st.label}</span>
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-700">原因：{r.reason}</div>
                {(r.suggestedBearer || r.suggestedGoodsCents != null) && (
                  <div className="text-xs text-gray-500">
                    渠道建议：{r.suggestedBearer ?? '—'} · {yuan(r.suggestedGoodsCents)}
                  </div>
                )}
                {r.status !== 'PENDING' && (
                  <div className="text-xs text-gray-500">
                    {fmt(r.handledAt)} 处理{r.resultNote ? `：${r.resultNote}` : ''}
                    {r.refundGoodsCents != null ? ` · 退货款 ${yuan(r.refundGoodsCents)} 税费 ${yuan(r.refundTaxCents)} · ${r.bearer ?? ''}` : ''}
                  </div>
                )}
                <div className="mt-1.5 flex justify-end">
                  <AfterSaleActions row={r} onRefund={() => onRefund(r)} onChanged={onChanged} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
