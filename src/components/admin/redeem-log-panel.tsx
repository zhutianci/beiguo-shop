'use client'

/**
 * 卡密使用情况（兑换日志）面板（设计 5.5、12.2）：嵌在订单详情与卡密页。超管侧全字段（ip、requestId、orderRef、
 * provider 内部键），带来源站徽章、可按来源站筛选。数据来自 GET /api/admin/redeem-logs。
 * 渠道看到的是同一批日志的子集（动作、结果、说明、时间），追溯「渠道查看卡密的时间 vs 首次兑换时间」时对照用（S7）。
 */

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { SourceBadge, SourceFilter, type SiteOption, type SourceSite } from './source-site'

interface Row {
  id: number
  cardKeyId: number | null
  provider: string
  action: string
  state: string
  message: string | null
  requestId: string | null
  orderRef: string | null
  ip: string | null
  createdAt: string
  source: SourceSite
  orderId: number | null
  orderNo: string | null
}

const fmt = (s: string) => new Date(s).toLocaleString('zh-CN', { hour12: false })

export default function RedeemLogPanel({
  orderId,
  cardKeyId,
  title = '卡密使用情况（兑换日志）',
  showSiteFilter = false,
}: {
  orderId?: number
  cardKeyId?: number
  title?: string
  /** 卡密页的全局面板才需要按来源站筛；订单详情里只有本单一个来源站 */
  showSiteFilter?: boolean
}) {
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [site, setSite] = useState('')
  const [sites, setSites] = useState<SiteOption[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setErr('')
    try {
      const p = new URLSearchParams({ page: String(page), pageSize: '20' })
      if (orderId) p.set('orderId', String(orderId))
      if (cardKeyId) p.set('cardKeyId', String(cardKeyId))
      if (site) p.set('tenantId', site)
      const res = await fetch(`/api/admin/redeem-logs?${p.toString()}`)
      const d = await res.json()
      if (d.success) {
        setRows(d.data.rows)
        setTotal(d.data.total)
        setSites(d.data.sites || [])
      } else setErr(d.error || '加载失败')
    } catch {
      setErr('网络错误')
    } finally {
      setLoading(false)
    }
  }, [orderId, cardKeyId, site, page])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="rounded-lg border border-gray-200 p-4 text-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-medium text-gray-800">
          {title} <span className="text-xs font-normal text-gray-400">共 {total} 条</span>
        </h4>
        {showSiteFilter && (
          <SourceFilter
            value={site}
            onChange={(v) => {
              setSite(v)
              setPage(1)
            }}
            options={sites}
            className="rounded border border-gray-300 px-2 py-1 text-xs"
          />
        )}
      </div>
      {loading ? (
        <div className="flex items-center gap-2 py-2 text-xs text-gray-400">
          <Loader2 className="h-3 w-3 animate-spin" /> 加载中
        </div>
      ) : err ? (
        <div className="text-xs text-red-600">{err}</div>
      ) : rows.length === 0 ? (
        <div className="text-xs text-gray-400">没有兑换记录</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left text-gray-400">
                <th className="py-1 pr-2">时间</th>
                <th className="py-1 pr-2">来源站</th>
                <th className="py-1 pr-2">卡</th>
                <th className="py-1 pr-2">平台</th>
                <th className="py-1 pr-2">动作</th>
                <th className="py-1 pr-2">结果</th>
                <th className="py-1 pr-2">说明</th>
                <th className="py-1 pr-2">requestId / orderRef</th>
                <th className="py-1">IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 align-top">
                  <td className="py-1 pr-2 whitespace-nowrap text-gray-500">{fmt(r.createdAt)}</td>
                  <td className="py-1 pr-2">
                    <SourceBadge source={r.source} />
                  </td>
                  <td className="py-1 pr-2 font-mono">
                    {r.cardKeyId ? `#${r.cardKeyId}` : '—'}
                    {r.orderNo && <div className="text-[10px] text-gray-400">{r.orderNo}</div>}
                  </td>
                  <td className="py-1 pr-2">{r.provider}</td>
                  <td className="py-1 pr-2">{r.action}</td>
                  <td className="py-1 pr-2">{r.state}</td>
                  <td className="py-1 pr-2 break-all">{r.message || '—'}</td>
                  <td className="py-1 pr-2 font-mono break-all text-gray-500">
                    {r.requestId || '—'}
                    {r.orderRef && <div>{r.orderRef}</div>}
                  </td>
                  <td className="py-1 font-mono text-gray-500">{r.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {total > 20 && (
            <div className="mt-2 flex justify-end gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border px-2 py-0.5 disabled:opacity-40">
                上一页
              </button>
              <button disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)} className="rounded border px-2 py-0.5 disabled:opacity-40">
                下一页
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
