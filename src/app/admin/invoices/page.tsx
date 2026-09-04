'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Eye, X } from 'lucide-react'

interface InvoiceRow {
  externalOrderId: number
  invoiceId: number | null
  invoiceNo: string | null
  claudeAccount: string
  subscriptionType: string
  xianyuNickname: string | null
  orderStartDate: string | null
  orderExpireDate: string | null
  title: string | null
  taxNumber: string | null
  address: string | null
  phone: string | null
  bankName: string | null
  bankAccount: string | null
  email: string | null
  showAiWording: boolean | null
  sellingPrice: number | null
  invoiceAmount: number | null
  taxFee: number | null
  status: string
  payStatus: string
  paidAt: string | null
  submittedAt: string | null
  issuedAt: string | null
  createdAt: string
}

interface Totals {
  count: Record<string, number>
  paidTaxFee: number
  issuedInvoiceAmount: number
}

const STATUS_LABELS: Record<string, string> = {
  UNAPPLIED: '未开发票',
  AWAIT_PAY: '待支付税费',
  SUBMITTED: '已提交开票',
  ISSUED: '已开具',
  CANNOT: '不可开据',
}
const STATUS_STYLES: Record<string, string> = {
  UNAPPLIED: 'bg-gray-100 text-gray-600',
  AWAIT_PAY: 'bg-amber-100 text-amber-700',
  SUBMITTED: 'bg-cyan-100 text-cyan-700',
  ISSUED: 'bg-green-100 text-green-700',
  CANNOT: 'bg-gray-200 text-gray-500',
}
const STATUS_OPTIONS = ['UNAPPLIED', 'AWAIT_PAY', 'SUBMITTED', 'ISSUED', 'CANNOT']

function fmt(s: string) {
  return new Date(s).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
}
function money(n: number | null) {
  return n == null ? '-' : `¥${Number(n).toFixed(2)}`
}

const PAGE_SIZE = 20

export default function AdminInvoicesPage() {
  const [list, setList] = useState<InvoiceRow[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('SUBMITTED')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<InvoiceRow | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // 搜索防抖
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 350)
    return () => clearTimeout(t)
  }, [keyword])

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    try {
      const q = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (debouncedKeyword) q.set('keyword', debouncedKeyword)
      if (statusFilter) q.set('status', statusFilter)
      const res = await fetch(`/api/admin/invoices?${q}`, { signal: controller.signal })
      const data = await res.json()
      if (data.success && abortRef.current === controller) {
        setList(data.data.list)
        setTotals(data.data.totals)
        setTotal(data.data.total || 0)
        setTotalPages(data.data.totalPages || 1)
      }
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }, [page, debouncedKeyword, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const setStatus = async (externalOrderId: number, status: string) => {
    const res = await fetch(`/api/admin/invoices/by-order/${externalOrderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (data.success) {
      load()
      setDetail(null)
    } else alert(data.error || '操作失败')
  }

  return (
    <div className="space-y-6">
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {STATUS_OPTIONS.map((s) => (
            <div key={s} className="rounded-xl border border-gray-100 bg-white p-3">
              <div className="text-xs text-gray-500">{STATUS_LABELS[s]}</div>
              <div className="text-xl font-semibold text-gray-900">{totals.count[s] || 0}</div>
            </div>
          ))}
        </div>
      )}
      {totals && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
            <div className="text-xs text-amber-700">已支付税费合计（报价×0.06）</div>
            <div className="text-xl font-semibold text-amber-800">¥{totals.paidTaxFee.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 p-3">
            <div className="text-xs text-green-700">已开具发票金额合计（含税，报价×1.06）</div>
            <div className="text-xl font-semibold text-green-800">¥{totals.issuedInvoiceAmount.toFixed(2)}</div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>发票管理（共 {total} 条 · 同步全部订单）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索账户/订阅类型/闲鱼昵称..."
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900"
            >
              <option value="">全部状态</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <Button variant="outline" onClick={load}>
              <Search className="w-4 h-4 mr-1" /> 刷新
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无订单</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="border-b text-left text-gray-500 text-xs">
                    <th className="pb-2 pr-3">抬头 / 账户</th>
                    <th className="pb-2 pr-3">订阅</th>
                    <th className="pb-2 pr-3 text-right">开票金额(含税)</th>
                    <th className="pb-2 pr-3 text-right">税费</th>
                    <th className="pb-2 pr-3">状态</th>
                    <th className="pb-2 pr-3">提交时间</th>
                    <th className="pb-2 pr-3">设置状态</th>
                    <th className="pb-2 text-right">详情</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((iv) => (
                    <tr key={iv.externalOrderId} className="border-b hover:bg-gray-50/60">
                      <td className="py-2 pr-3">
                        <div className="font-medium">{iv.title || <span className="text-gray-400">（未填抬头）</span>}</div>
                        <div className="text-xs text-gray-400 font-mono">{iv.claudeAccount}</div>
                      </td>
                      <td className="py-2 pr-3 text-xs">{iv.subscriptionType}</td>
                      <td className="py-2 pr-3 text-right">{money(iv.invoiceAmount)}</td>
                      <td className="py-2 pr-3 text-right whitespace-nowrap">
                        {money(iv.taxFee)}
                        <span className={`ml-1 text-xs ${iv.payStatus === 'PAID' ? 'text-green-600' : 'text-gray-400'}`}>
                          {iv.payStatus === 'PAID' ? '已付' : '未付'}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[iv.status] || ''}`}>
                          {STATUS_LABELS[iv.status] || iv.status}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">{iv.submittedAt ? fmt(iv.submittedAt) : '—'}</td>
                      <td className="py-2 pr-3">
                        <select
                          value={iv.status}
                          onChange={(e) => setStatus(iv.externalOrderId, e.target.value)}
                          className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <button onClick={() => setDetail(iv)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-gray-600 hover:bg-gray-100" title="详情">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
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

      {/* 详情弹窗 */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDetail(null)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">发票详情</h3>
              <button onClick={() => setDetail(null)} className="p-1 rounded hover:bg-gray-100 text-gray-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2 text-sm text-gray-800">
              {[
                ['发票号', detail.invoiceNo || '-'],
                ['抬头', detail.title || '-'],
                ['税号', detail.taxNumber || '-'],
                ['接收邮箱', detail.email || '-'],
                [
                  '发票展示 ChatGPT/Claude 字眼',
                  detail.showAiWording == null ? '—（申请前的历史记录）' : detail.showAiWording ? '展示' : '不展示',
                ],
                ['地址', detail.address || '-'],
                ['电话', detail.phone || '-'],
                ['开户行', detail.bankName || '-'],
                ['卡号', detail.bankAccount || '-'],
                ['订阅', detail.subscriptionType],
                ['账户', detail.claudeAccount],
                ['报价（售价）', money(detail.sellingPrice)],
                ['开票金额（含税 = 报价×1.06）', money(detail.invoiceAmount)],
                ['发票税费（报价×0.06）', `${money(detail.taxFee)} · ${detail.payStatus === 'PAID' ? '已支付' : '未支付'}`],
                ['状态', STATUS_LABELS[detail.status] || detail.status],
                ['提交开票时间', detail.submittedAt ? fmt(detail.submittedAt) : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-gray-100 py-1.5">
                  <span className="text-gray-500 shrink-0">{k}</span>
                  <span className="text-right break-all font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-5">
              {STATUS_OPTIONS.filter((s) => s !== detail.status).map((s) => (
                <Button key={s} variant="outline" onClick={() => setStatus(detail.externalOrderId, s)}>
                  改为「{STATUS_LABELS[s]}」
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
