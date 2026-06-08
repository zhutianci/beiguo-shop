'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Copy, CheckCircle2 } from 'lucide-react'

interface Referrer {
  id: number
  name: string
  code: string
  link: string
  balance: number
  settledTotal: number
  settledCount: number
}
interface Reward {
  id: number
  orderId: number
  referrer: string
  buyer: string
  product: string
  amount: number
  status: string
  createdAt: string
  settledAt: string | null
}
interface Data {
  referrers: Referrer[]
  rewards: Reward[]
  totals: { settledTotal: number; rewardCount: number; referrerCount: number }
}

function fmt(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('zh-CN', { hour12: false })
}

export default function AdminReferralsPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(0)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/referrals')
      const d = await res.json()
      if (d.success) setData(d.data)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [])

  const copy = (text: string, id: number) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(0), 1500)
  }

  return (
    <div className="space-y-6">
      {data && (
        <div className="grid grid-cols-3 gap-3 max-w-2xl">
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="text-xs text-gray-500">推广人数</div>
            <div className="text-2xl font-bold text-gray-900">{data.totals.referrerCount}</div>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 p-4">
            <div className="text-xs text-green-700">已结算返现合计</div>
            <div className="text-2xl font-bold text-green-700">¥{data.totals.settledTotal.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="text-xs text-gray-500">返现笔数</div>
            <div className="text-2xl font-bold text-gray-900">{data.totals.rewardCount}</div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>推广人 / 内推链接</CardTitle>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> 刷新
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-gray-400">加载中...</div>
          ) : !data || data.referrers.length === 0 ? (
            <div className="text-center py-10 text-gray-400">暂无推广人</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="border-b text-left text-gray-500 text-xs">
                    <th className="pb-2 pr-3">推广人</th>
                    <th className="pb-2 pr-3">内推码</th>
                    <th className="pb-2 pr-3 text-right">余额</th>
                    <th className="pb-2 pr-3 text-right">累计返现</th>
                    <th className="pb-2 pr-3 text-right">成交单</th>
                    <th className="pb-2 text-right">链接</th>
                  </tr>
                </thead>
                <tbody>
                  {data.referrers.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50/60">
                      <td className="py-2 pr-3 font-medium">{r.name}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{r.code}</td>
                      <td className="py-2 pr-3 text-right">¥{r.balance.toFixed(2)}</td>
                      <td className="py-2 pr-3 text-right text-green-600">¥{r.settledTotal.toFixed(2)}</td>
                      <td className="py-2 pr-3 text-right text-gray-600">{r.settledCount}</td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => copy(r.link, r.id)}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-blue-600 hover:bg-blue-50"
                          title={r.link}
                        >
                          {copied === r.id ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                          复制链接
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

      <Card>
        <CardHeader>
          <CardTitle>返现明细</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-gray-400">加载中...</div>
          ) : !data || data.rewards.length === 0 ? (
            <div className="text-center py-10 text-gray-400">暂无返现记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="border-b text-left text-gray-500 text-xs">
                    <th className="pb-2 pr-3">订单</th>
                    <th className="pb-2 pr-3">推广人</th>
                    <th className="pb-2 pr-3">买家</th>
                    <th className="pb-2 pr-3">商品</th>
                    <th className="pb-2 pr-3 text-right">返现</th>
                    <th className="pb-2 pr-3">状态</th>
                    <th className="pb-2">结算时间</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rewards.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50/60">
                      <td className="py-2 pr-3 text-xs">#{r.orderId}</td>
                      <td className="py-2 pr-3">{r.referrer}</td>
                      <td className="py-2 pr-3 text-gray-600">{r.buyer}</td>
                      <td className="py-2 pr-3 text-xs">{r.product}</td>
                      <td className="py-2 pr-3 text-right text-green-600 font-medium">¥{r.amount.toFixed(2)}</td>
                      <td className="py-2 pr-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${r.status === 'SETTLED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {r.status === 'SETTLED' ? '已入余额' : r.status}
                        </span>
                      </td>
                      <td className="py-2 text-xs text-gray-500 whitespace-nowrap">{fmt(r.settledAt)}</td>
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
