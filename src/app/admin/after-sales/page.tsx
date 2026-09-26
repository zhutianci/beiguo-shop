'use client'

/**
 * 超管「售后申请」（设计 8.4、12.2）：渠道发起的退款 / 补发 / 升级 / 申请全局封禁，按渠道、类型、状态筛选。
 *  · 退款类：「处理退款」跳到订单页并直接打开退款弹窗（金额、承担方、冲销分录与结案同一事务）；
 *  · 补发类：到订单页用「补发卡密」执行后，回来点「已处理」；
 *  · 升级类：「清除升级」；全局封禁申请：到用户页操作（禁用账号 / 平台拉黑）后点「已处理」；
 *  · 任何一类都能「驳回」（说明渠道可见）。
 */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SourceBadge, SourceFilter, type SiteOption, type SourceSite } from '@/components/admin/source-site'
import { AfterSaleActions, AFTER_SALE_KIND, AFTER_SALE_STATUS } from '@/components/admin/after-sale-panel'

interface Row {
  id: number
  requestNo: string
  source: SourceSite
  orderNo: string | null
  orderId: number | null
  kind: string
  status: string
  reason: string
  suggestedBearer: string | null
  suggestedGoodsCents: number | null
  resultNote: string | null
  createdAt: string
  handledAt: string | null
  order: { productName: string; amount: number; payStatus: string; deliveryStatus: string; escalatedAt: string | null } | null
  customer: { customerNo: string; userId: number; email: string | null; nickname: string | null; userStatus: number; blockedInSite: boolean } | null
}

const yuan = (c: number | null | undefined) => (c == null ? '—' : `¥${(c / 100).toFixed(2)}`)
const fmt = (s: string | null) => (s ? new Date(s).toLocaleString('zh-CN', { hour12: false }) : '—')

export default function AfterSalesPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [pendingTotal, setPendingTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [site, setSite] = useState('')
  const [sites, setSites] = useState<SiteOption[]>([])
  const [kind, setKind] = useState('')
  const [status, setStatus] = useState('PENDING')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page: String(page) })
      if (site) p.set('tenantId', site)
      if (kind) p.set('kind', kind)
      if (status) p.set('status', status)
      const res = await fetch(`/api/admin/after-sales?${p.toString()}`)
      const d = await res.json()
      if (d.success) {
        setRows(d.data.rows)
        setTotal(d.data.total)
        setPendingTotal(d.data.pendingTotal)
        setTotalPages(d.data.totalPages)
        setSites(d.data.sites || [])
      }
    } finally {
      setLoading(false)
    }
  }, [page, site, kind, status])

  useEffect(() => {
    load()
  }, [load])

  const sel = 'rounded-lg border border-gray-300 px-3 py-2 text-sm'
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          售后申请 {pendingTotal > 0 && <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{pendingTotal} 待处理</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-3">
          <SourceFilter
            value={site}
            onChange={(v) => {
              setSite(v)
              setPage(1)
            }}
            options={sites}
            className={sel}
          />
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value)
              setPage(1)
            }}
            className={sel}
          >
            <option value="">全部类型</option>
            {Object.entries(AFTER_SALE_KIND).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className={sel}
          >
            <option value="">全部状态</option>
            {Object.entries(AFTER_SALE_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400">加载中...</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-gray-400">没有符合条件的售后申请</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-3 font-medium">申请号</th>
                  <th className="pb-2 pr-3 font-medium">渠道</th>
                  <th className="pb-2 pr-3 font-medium">类型</th>
                  <th className="pb-2 pr-3 font-medium">订单 / 客户</th>
                  <th className="pb-2 pr-3 font-medium">原因与建议</th>
                  <th className="pb-2 pr-3 font-medium">状态</th>
                  <th className="pb-2 pr-3 font-medium">时间</th>
                  <th className="pb-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const st = AFTER_SALE_STATUS[r.status] ?? { label: r.status, cls: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={r.id} className="border-b border-gray-50 align-top">
                      <td className="py-3 pr-3 font-mono text-xs">{r.requestNo}</td>
                      <td className="py-3 pr-3">
                        <SourceBadge source={r.source} />
                      </td>
                      <td className="py-3 pr-3">{AFTER_SALE_KIND[r.kind] ?? r.kind}</td>
                      <td className="py-3 pr-3 text-xs">
                        {r.orderId ? (
                          <Link href={`/admin/orders?orderId=${r.orderId}`} className="text-primary-600 hover:underline">
                            {r.orderNo}
                          </Link>
                        ) : (
                          '—'
                        )}
                        {r.order && (
                          <div className="text-gray-400">
                            {r.order.productName} · ¥{r.order.amount.toFixed(2)}
                            {r.order.escalatedAt ? ' · 已升级' : ''}
                          </div>
                        )}
                        {r.customer && (
                          <div className="text-gray-500">
                            <Link href={`/admin/users/${r.customer.userId}`} className="hover:underline">
                              {r.customer.email || r.customer.nickname}
                            </Link>
                            {r.customer.userStatus !== 1 ? '（已全局禁用）' : ''}
                            {r.customer.blockedInSite ? '（本站已拉黑）' : ''}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-xs">
                        <div className="max-w-xs break-words">{r.reason}</div>
                        {(r.suggestedBearer || r.suggestedGoodsCents != null) && (
                          <div className="text-gray-400">
                            建议 {r.suggestedBearer ?? '—'} · {yuan(r.suggestedGoodsCents)}
                          </div>
                        )}
                        {r.resultNote && <div className="text-gray-500">处理说明：{r.resultNote}</div>}
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`rounded px-1.5 py-0.5 text-xs ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="py-3 pr-3 text-xs text-gray-500 whitespace-nowrap">
                        {fmt(r.createdAt)}
                        {r.handledAt && <div>处理 {fmt(r.handledAt)}</div>}
                      </td>
                      <td className="py-3">
                        <AfterSaleActions
                          row={r}
                          onRefund={
                            r.orderId
                              ? () => router.push(`/admin/orders?orderId=${r.orderId}&refund=1&afterSaleId=${r.id}`)
                              : undefined
                          }
                          onChanged={load}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && total > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <span>
              共 {total} 条 · 第 {page} / {totalPages} 页
            </span>
            <span className="flex gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                上一页
              </Button>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                下一页
              </Button>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
