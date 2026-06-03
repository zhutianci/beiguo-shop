'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, CheckCircle, XCircle, Trash2, Eye, X } from 'lucide-react'

interface Invoice {
  id: number
  invoiceNo: string
  claudeAccount: string
  subscriptionType: string
  sellingPrice: string | number
  invoiceAmount: string | number
  taxFee: string | number
  title: string
  taxNumber: string
  address: string | null
  phone: string | null
  bankName: string | null
  bankAccount: string | null
  email: string
  status: string
  payStatus: string
  paidAt: string | null
  issuedAt: string | null
  createdAt: string
}

const STATUS_LABELS: Record<string, string> = {
  AWAIT_PAY: '待支付税费',
  SUBMITTED: '已提交开票',
  ISSUED: '已开具',
  CANNOT: '不可开据',
}
const STATUS_STYLES: Record<string, string> = {
  AWAIT_PAY: 'bg-amber-100 text-amber-700',
  SUBMITTED: 'bg-cyan-100 text-cyan-700',
  ISSUED: 'bg-green-100 text-green-700',
  CANNOT: 'bg-gray-100 text-gray-500',
}

function fmt(s: string) {
  return new Date(s).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function AdminInvoicesPage() {
  const [list, setList] = useState<Invoice[]>([])
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<Invoice | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ pageSize: '100' })
      if (keyword) q.set('keyword', keyword)
      if (statusFilter) q.set('status', statusFilter)
      const res = await fetch(`/api/admin/invoices?${q}`)
      const data = await res.json()
      if (data.success) setList(data.data.list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const action = async (id: number, status: string) => {
    const res = await fetch(`/api/admin/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (data.success) {
      load()
      setDetail(null)
    } else alert(data.error || '操作失败')
  }

  const del = async (id: number) => {
    if (!confirm('确定删除这条发票申请？')) return
    const res = await fetch(`/api/admin/invoices/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) load()
    else alert(data.error || '删除失败')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>发票管理（共 {list.length} 条）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索账户/抬头/税号/发票号..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && load()}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900"
            >
              <option value="">全部状态</option>
              <option value="AWAIT_PAY">待支付税费</option>
              <option value="SUBMITTED">已提交开票</option>
              <option value="ISSUED">已开具</option>
              <option value="CANNOT">不可开据</option>
            </select>
            <Button variant="outline" onClick={load}>
              <Search className="w-4 h-4 mr-1" /> 查询
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无发票申请</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="border-b text-left text-gray-500 text-xs">
                    <th className="pb-2 pr-3">抬头 / 账户</th>
                    <th className="pb-2 pr-3">订阅</th>
                    <th className="pb-2 pr-3">开票金额</th>
                    <th className="pb-2 pr-3">税费</th>
                    <th className="pb-2 pr-3">状态</th>
                    <th className="pb-2 pr-3">申请时间</th>
                    <th className="pb-2 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((iv) => (
                    <tr key={iv.id} className="border-b hover:bg-gray-50/60">
                      <td className="py-2 pr-3">
                        <div className="font-medium">{iv.title}</div>
                        <div className="text-xs text-gray-400 font-mono">{iv.claudeAccount}</div>
                      </td>
                      <td className="py-2 pr-3 text-xs">{iv.subscriptionType}</td>
                      <td className="py-2 pr-3">¥{Number(iv.invoiceAmount).toFixed(2)}</td>
                      <td className="py-2 pr-3">
                        ¥{Number(iv.taxFee).toFixed(2)}
                        <span className={`ml-1 text-xs ${iv.payStatus === 'PAID' ? 'text-green-600' : 'text-gray-400'}`}>
                          {iv.payStatus === 'PAID' ? '已付' : '未付'}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[iv.status] || ''}`}>
                          {STATUS_LABELS[iv.status] || iv.status}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">{fmt(iv.createdAt)}</td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <button onClick={() => setDetail(iv)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-gray-600 hover:bg-gray-100" title="详情">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {iv.status === 'SUBMITTED' && (
                          <button onClick={() => action(iv.id, 'ISSUED')} className="ml-1 inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-green-600 hover:bg-green-50" title="标记已开具">
                            <CheckCircle className="w-3.5 h-3.5" /> 开具
                          </button>
                        )}
                        {iv.status !== 'CANNOT' && iv.status !== 'ISSUED' && (
                          <button onClick={() => action(iv.id, 'CANNOT')} className="ml-1 inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-gray-500 hover:bg-gray-100" title="不可开据">
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => del(iv.id)} className="ml-1 inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50" title="删除">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                ['发票号', detail.invoiceNo],
                ['抬头', detail.title],
                ['税号', detail.taxNumber],
                ['接收邮箱', detail.email],
                ['地址', detail.address || '-'],
                ['电话', detail.phone || '-'],
                ['开户行', detail.bankName || '-'],
                ['卡号', detail.bankAccount || '-'],
                ['订阅', detail.subscriptionType],
                ['账户', detail.claudeAccount],
                ['售价', `¥${Number(detail.sellingPrice).toFixed(2)}`],
                ['开票金额（含税）', `¥${Number(detail.invoiceAmount).toFixed(2)}`],
                ['税费（6%）', `¥${Number(detail.taxFee).toFixed(2)} · ${detail.payStatus === 'PAID' ? '已支付' : '未支付'}`],
                ['状态', STATUS_LABELS[detail.status] || detail.status],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-gray-100 py-1.5">
                  <span className="text-gray-500 shrink-0">{k}</span>
                  <span className="text-right break-all font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-5">
              {detail.status === 'SUBMITTED' && (
                <Button onClick={() => action(detail.id, 'ISSUED')}>
                  <CheckCircle className="w-4 h-4 mr-1" /> 标记已开具
                </Button>
              )}
              {detail.status !== 'CANNOT' && detail.status !== 'ISSUED' && (
                <Button variant="outline" onClick={() => action(detail.id, 'CANNOT')}>不可开据</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
