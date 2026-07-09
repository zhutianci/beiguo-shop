'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Search } from 'lucide-react'

interface DispenseRow {
  id: number
  client: string
  externalNo: string
  productId: number
  productName: string
  apiSku: string | null
  quantity: number
  delivered: number
  status: string
  cards: string[]
  createdAt: string
  updatedAt: string
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: '待处理', cls: 'bg-gray-100 text-gray-500' },
  PROCESSING: { label: '发卡中', cls: 'bg-blue-100 text-blue-700' },
  FULFILLED: { label: '已发足', cls: 'bg-green-100 text-green-700' },
  PARTIAL: { label: '缺货/待补', cls: 'bg-amber-100 text-amber-700' },
}

function fmt(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('zh-CN', { hour12: false })
}

export default function AdminDispensesPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('')
  const [reveal, setReveal] = useState(false)
  const [page, setPage] = useState(1)

  const [list, setList] = useState<DispenseRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [delivered, setDelivered] = useState(0)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // 搜索防抖
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    try {
      const q = new URLSearchParams({ page: String(page), pageSize: '20' })
      if (debouncedSearch) q.set('keyword', debouncedSearch)
      if (status) q.set('status', status)
      if (reveal) q.set('reveal', '1')
      const res = await fetch(`/api/admin/dispenses?${q}`, { signal: controller.signal })
      const data = await res.json()
      if (data.success && abortRef.current === controller) {
        setList(data.data.list)
        setTotal(data.data.total || 0)
        setTotalPages(data.data.totalPages || 1)
        setDelivered(data.data.stats?.delivered || 0)
      }
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }, [page, debouncedSearch, status, reveal])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>外部平台发卡记录</CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              其他站点通过库存 API 领走的卡密记录（与本站自动发货共用同一批卡密）。
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            共 <span className="font-semibold text-gray-800">{total}</span> 条 · 累计发出{' '}
            <span className="font-semibold text-gray-800">{delivered}</span> 张
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 筛选栏 */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="搜索：平台 / 外部订单号 / SKU / 商品名"
                className="w-72 rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">全部状态</option>
              <option value="FULFILLED">已发足</option>
              <option value="PARTIAL">缺货/待补</option>
              <option value="PROCESSING">发卡中</option>
              <option value="PENDING">待处理</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => setReveal((v) => !v)}>
              {reveal ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
              {reveal ? '隐藏卡密' : '显示卡密'}
            </Button>
          </div>

          {/* 列表 */}
          {loading ? (
            <div className="py-10 text-center text-gray-400">加载中...</div>
          ) : list.length === 0 ? (
            <div className="py-10 text-center text-gray-400">暂无发卡记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2 pr-3 whitespace-nowrap">时间</th>
                    <th className="pb-2 pr-3">平台</th>
                    <th className="pb-2 pr-3">外部订单号</th>
                    <th className="pb-2 pr-3">商品 / SKU</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">数量</th>
                    <th className="pb-2 pr-3">状态</th>
                    <th className="pb-2">发出的卡密</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.id} className="border-b align-top hover:bg-gray-50/60">
                      <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">{fmt(r.createdAt)}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{r.client}</td>
                      <td className="py-2 pr-3 font-mono text-xs break-all">{r.externalNo}</td>
                      <td className="py-2 pr-3">
                        <div>{r.productName}</div>
                        {r.apiSku && <div className="font-mono text-xs text-gray-400">{r.apiSku}</div>}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <span className={r.delivered < r.quantity ? 'text-amber-600 font-medium' : ''}>
                          {r.delivered}
                        </span>
                        <span className="text-gray-400"> / {r.quantity}</span>
                      </td>
                      <td className="py-2 pr-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${STATUS_LABELS[r.status]?.cls || 'bg-gray-100 text-gray-500'}`}>
                          {STATUS_LABELS[r.status]?.label || r.status}
                        </span>
                      </td>
                      <td className="py-2">
                        {r.cards.length === 0 ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <div className="space-y-0.5">
                            {r.cards.map((c, i) => (
                              <div key={i} className="font-mono text-xs break-all max-w-[320px]">{c}</div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-gray-500">
                共 {total} 条 · 第 {page} / {totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
                  上一页
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(p + 1, totalPages))}>
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
