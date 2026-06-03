'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, ExternalLink, Trash2 } from 'lucide-react'

interface Receipt {
  id: number
  receiptNo: string
  claudeAccount: string
  subscriptionType: string
  payerTitle: string
  payee: string
  amount: string | number
  createdAt: string
}

function fmt(s: string) {
  return new Date(s).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function AdminReceiptsPage() {
  const [list, setList] = useState<Receipt[]>([])
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ pageSize: '100' })
      if (keyword) q.set('keyword', keyword)
      const res = await fetch(`/api/admin/receipts?${q}`)
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

  const del = async (id: number) => {
    if (!confirm('删除该收据？删除后买家可重新申请生成。')) return
    const res = await fetch(`/api/admin/receipts/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) load()
    else alert(data.error || '删除失败')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>收据管理（共 {list.length} 条）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索账户/抬头/收据号..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && load()}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={load}>
              <Search className="w-4 h-4 mr-1" /> 查询
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无收据</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="border-b text-left text-gray-500 text-xs">
                    <th className="pb-2 pr-3">收据号</th>
                    <th className="pb-2 pr-3">付款人(抬头)</th>
                    <th className="pb-2 pr-3">账户</th>
                    <th className="pb-2 pr-3">订阅</th>
                    <th className="pb-2 pr-3">金额</th>
                    <th className="pb-2 pr-3">开具时间</th>
                    <th className="pb-2 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50/60">
                      <td className="py-2 pr-3 font-mono text-xs">{r.receiptNo}</td>
                      <td className="py-2 pr-3 font-medium">{r.payerTitle}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{r.claudeAccount}</td>
                      <td className="py-2 pr-3 text-xs">{r.subscriptionType}</td>
                      <td className="py-2 pr-3">¥{Number(r.amount).toFixed(2)}</td>
                      <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">{fmt(r.createdAt)}</td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <a href={`/receipt/${r.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-blue-600 hover:bg-blue-50" title="查看收据">
                          <ExternalLink className="w-3.5 h-3.5" /> 查看
                        </a>
                        <button onClick={() => del(r.id)} className="ml-1 inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50" title="删除重开">
                          <Trash2 className="w-3.5 h-3.5" /> 删除
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
    </div>
  )
}
