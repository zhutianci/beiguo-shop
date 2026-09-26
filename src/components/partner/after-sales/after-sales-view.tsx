'use client'

/**
 * 售后申请列表（设计 12.1）：本店发起的退款 / 补发 / 升级 / 全局封禁申请，状态与站长处理说明；待处理的可以撤回。
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import type { PartnerAfterSaleRow } from '@/lib/tenant/types'
import { gotoLogin, partnerApi, qs } from '../common/api'
import { AFTER_SALE_KIND_TEXT, AFTER_SALE_STATUS_TEXT, afterSaleKindText, afterSaleStatusText, cnTime } from '../common/format'
import { Badge, Button, Card, Empty, ErrorBox, inputCls, Loading, Notice, PageTitle } from '../common/ui'

export function AfterSalesView({ readOnly, initialStatus }: { readOnly?: boolean; initialStatus?: string }) {
  const [status, setStatus] = useState(initialStatus && Object.prototype.hasOwnProperty.call(AFTER_SALE_STATUS_TEXT, initialStatus) ? initialStatus : '')
  const [kind, setKind] = useState('')
  const [rows, setRows] = useState<PartnerAfterSaleRow[] | null>(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState<{ tone: 'green' | 'red'; text: string } | null>(null)
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    setErr('')
    const r = await partnerApi<{ rows: PartnerAfterSaleRow[] }>(`/api/partner/after-sales${qs({ status, kind })}`)
    if (r.ok) setRows(r.data.rows)
    else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }, [status, kind])

  useEffect(() => {
    load()
  }, [load])

  const cancel = async (requestNo: string) => {
    if (!window.confirm(`确定撤回申请 ${requestNo}？`)) return
    setBusy(requestNo)
    setMsg(null)
    const r = await partnerApi(`/api/partner/after-sales/${encodeURIComponent(requestNo)}/cancel`, { method: 'POST' })
    setBusy('')
    if (r.ok) {
      setMsg({ tone: 'green', text: `已撤回 ${requestNo}` })
      load()
    } else if (r.needLogin) gotoLogin()
    else setMsg({ tone: 'red', text: r.error })
  }

  return (
    <div className="space-y-4">
      <PageTitle title="售后申请" desc="退款、补发、升级与全局封禁申请由站长处理；处理结果会出现在这里并通知你。" />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <Card>
        <div className="flex flex-wrap gap-2">
          <select className={inputCls + ' w-auto'} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">全部状态</option>
            {Object.keys(AFTER_SALE_STATUS_TEXT).map((k) => (
              <option key={k} value={k}>
                {AFTER_SALE_STATUS_TEXT[k]}
              </option>
            ))}
          </select>
          <select className={inputCls + ' w-auto'} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">全部类型</option>
            {Object.keys(AFTER_SALE_KIND_TEXT).map((k) => (
              <option key={k} value={k}>
                {AFTER_SALE_KIND_TEXT[k]}
              </option>
            ))}
          </select>
        </div>
      </Card>
      {err ? (
        <ErrorBox message={err} onRetry={load} />
      ) : !rows ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Card>
          <Empty text="暂无售后申请" />
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-3 py-2">申请号 / 时间</th>
                <th className="px-3 py-2">类型</th>
                <th className="px-3 py-2">订单 / 客户</th>
                <th className="px-3 py-2">原因</th>
                <th className="px-3 py-2">状态</th>
                <th className="px-3 py-2">站长说明</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.requestNo} className="align-top">
                  <td className="px-3 py-2">
                    <div className="font-mono text-xs">{r.requestNo}</div>
                    <div className="text-xs text-gray-400">{cnTime(r.createdAt)}</div>
                  </td>
                  <td className="px-3 py-2">{afterSaleKindText(r.kind)}</td>
                  <td className="px-3 py-2">
                    {r.orderNo ? (
                      <Link href={`/partner/orders/${encodeURIComponent(r.orderNo)}`} className="text-primary-600 hover:underline">
                        {r.orderNo}
                      </Link>
                    ) : r.customerNo ? (
                      // 申请全局封禁没有订单，只针对某位客户：给客户编号，点进客户详情
                      <Link href={`/partner/customers/${encodeURIComponent(r.customerNo)}`} className="text-primary-600 hover:underline">
                        客户 {r.customerNo}
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="max-w-xs px-3 py-2 text-gray-700">
                    <div className="line-clamp-3 whitespace-pre-wrap break-words">{r.reason}</div>
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={r.status === 'PENDING' ? 'amber' : r.status === 'DONE' ? 'green' : r.status === 'REJECTED' ? 'red' : 'gray'}>{afterSaleStatusText(r.status)}</Badge>
                    {r.handledAt && <div className="mt-1 text-xs text-gray-400">{cnTime(r.handledAt)}</div>}
                  </td>
                  <td className="max-w-xs px-3 py-2 text-gray-600">{r.resultNote || '—'}</td>
                  <td className="px-3 py-2 text-right">
                    {r.status === 'PENDING' && !readOnly && (
                      <Button size="sm" loading={busy === r.requestNo} onClick={() => cancel(r.requestNo)}>
                        撤回
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
