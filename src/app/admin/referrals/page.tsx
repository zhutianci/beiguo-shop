'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Copy, CheckCircle2, SlidersHorizontal, X, Wallet, Trash2 } from 'lucide-react'

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

interface BaseRow {
  productId: number
  name: string
  websitePrice: number
  defaultBase: number
  override: number | null
}

export default function AdminReferralsPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(0)

  // 单独基础价编辑
  const [baseFor, setBaseFor] = useState<Referrer | null>(null)
  const [baseRows, setBaseRows] = useState<BaseRow[]>([])
  const [baseInputs, setBaseInputs] = useState<Record<number, string>>({})
  const [baseLoading, setBaseLoading] = useState(false)
  const [baseSaving, setBaseSaving] = useState(false)

  const openBase = async (r: Referrer) => {
    setBaseFor(r)
    setBaseLoading(true)
    setBaseRows([])
    try {
      const res = await fetch(`/api/admin/referrals/base?userId=${r.id}`)
      const d = await res.json()
      if (d.success) {
        setBaseRows(d.data.products)
        const map: Record<number, string> = {}
        d.data.products.forEach((p: BaseRow) => (map[p.productId] = p.override != null ? String(p.override) : ''))
        setBaseInputs(map)
      }
    } finally {
      setBaseLoading(false)
    }
  }

  const saveBase = async () => {
    if (!baseFor) return
    setBaseSaving(true)
    try {
      const prices = baseRows.map((p) => {
        const v = (baseInputs[p.productId] ?? '').trim()
        return { productId: p.productId, price: v === '' ? null : Number(v) }
      })
      const res = await fetch('/api/admin/referrals/base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: baseFor.id, prices }),
      })
      const d = await res.json()
      if (d.success) {
        setBaseFor(null)
        load()
      } else alert(d.error || '保存失败')
    } finally {
      setBaseSaving(false)
    }
  }

  // 余额提现/调整
  const [balFor, setBalFor] = useState<Referrer | null>(null)
  const [bal, setBal] = useState<{ balance: number; logs: { id: number; delta: number; balanceAfter: number; type: string; note: string | null; createdAt: string }[] } | null>(null)
  const [balDelta, setBalDelta] = useState('')
  const [balNote, setBalNote] = useState('')
  const [balBusy, setBalBusy] = useState(false)

  const openBal = async (r: Referrer) => {
    setBalFor(r)
    setBal(null)
    setBalDelta('')
    setBalNote('')
    const res = await fetch(`/api/admin/referrals/balance?userId=${r.id}`)
    const d = await res.json()
    if (d.success) setBal(d.data)
  }
  const saveBal = async () => {
    if (!balFor) return
    const delta = Number(balDelta)
    if (!delta) return alert('请输入变动金额（提现填负数，如 -50）')
    setBalBusy(true)
    try {
      const res = await fetch('/api/admin/referrals/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: balFor.id, delta, note: balNote.trim() || null }),
      })
      const d = await res.json()
      if (d.success) {
        await openBal(balFor)
        setBalDelta('')
        setBalNote('')
        load()
      } else alert(d.error || '操作失败')
    } finally {
      setBalBusy(false)
    }
  }

  const delLink = async (r: Referrer) => {
    if (!confirm(`删除「${r.name}」的内推链接？其专属价/基础价将清除，链接失效（返现历史与余额保留）。`)) return
    const res = await fetch('/api/admin/referrals/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: r.id }),
    })
    const d = await res.json()
    if (d.success) load()
    else alert(d.error || '删除失败')
  }

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
                      <td className="py-2 text-right whitespace-nowrap">
                        <button
                          onClick={() => openBal(r)}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-emerald-600 hover:bg-emerald-50"
                          title="提现/调整余额"
                        >
                          <Wallet className="w-3.5 h-3.5" /> 提现/调整
                        </button>
                        <button
                          onClick={() => openBase(r)}
                          className="ml-1 inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-purple-600 hover:bg-purple-50"
                          title="为该推广人单独设置基础价"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" /> 基础价
                        </button>
                        <button
                          onClick={() => copy(r.link, r.id)}
                          className="ml-1 inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-blue-600 hover:bg-blue-50"
                          title={r.link}
                        >
                          {copied === r.id ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                          复制链接
                        </button>
                        <button
                          onClick={() => delLink(r)}
                          className="ml-1 inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50"
                          title="删除内推链接"
                        >
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

      {/* 单独基础价编辑弹窗 */}
      {baseFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !baseSaving && setBaseFor(null)}>
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">为「{baseFor.name}」设置单独基础价</h3>
              <button onClick={() => !baseSaving && setBaseFor(null)} className="p-1 rounded hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">留空 = 使用商品默认推广价。基础价越低，推广人加价空间越大、你每单留存越少。不影响网站售价。</p>
            {baseLoading ? (
              <div className="text-center py-10 text-gray-400">加载中...</div>
            ) : (
              <div className="space-y-2">
                {baseRows.map((p) => (
                  <div key={p.productId} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-gray-400">网站售价 ¥{p.websitePrice.toFixed(2)} · 默认基础价 ¥{p.defaultBase.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400 text-sm">¥</span>
                      <input
                        type="number"
                        step="0.01"
                        value={baseInputs[p.productId] ?? ''}
                        onChange={(e) => setBaseInputs({ ...baseInputs, [p.productId]: e.target.value })}
                        placeholder={p.defaultBase.toFixed(2)}
                        className="w-28 px-3 py-1.5 rounded-lg border border-gray-300 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setBaseFor(null)} disabled={baseSaving}>取消</Button>
              <Button onClick={saveBase} loading={baseSaving}>保存</Button>
            </div>
          </div>
        </div>
      )}

      {/* 提现/调整余额弹窗 */}
      {balFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !balBusy && setBalFor(null)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">「{balFor.name}」余额管理</h3>
              <button onClick={() => !balBusy && setBalFor(null)} className="p-1 rounded hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 mb-4">
              <div className="text-xs text-emerald-700">当前余额</div>
              <div className="text-3xl font-bold text-emerald-700">¥{bal ? bal.balance.toFixed(2) : '...'}</div>
            </div>

            <div className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-gray-700">变动金额（提现/扣减填负数，如 -50；补偿填正数）</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={balDelta}
                  onChange={(e) => setBalDelta(e.target.value)}
                  placeholder="如 -50"
                  className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  value={balNote}
                  onChange={(e) => setBalNote(e.target.value)}
                  placeholder="备注（如：已微信打款）"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <Button onClick={saveBal} loading={balBusy}>提交</Button>
              </div>
              <p className="text-xs text-gray-400">提现是你线下打款后，在此把对应金额从余额扣减（填负数）。扣减后余额不能为负。</p>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">余额流水</div>
              {!bal ? (
                <div className="text-center py-6 text-gray-400 text-sm">加载中...</div>
              ) : bal.logs.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">暂无流水</div>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 border-b">
                        <th className="pb-1 pr-2">类型</th>
                        <th className="pb-1 pr-2 text-right">变动</th>
                        <th className="pb-1 pr-2 text-right">余额</th>
                        <th className="pb-1">备注/时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bal.logs.map((l) => (
                        <tr key={l.id} className="border-b border-gray-50">
                          <td className="py-1.5 pr-2 text-xs">
                            {l.type === 'REFERRAL' ? '返现' : l.type === 'WITHDRAW' ? '提现' : '调整'}
                          </td>
                          <td className={`py-1.5 pr-2 text-right font-medium ${l.delta < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {l.delta > 0 ? '+' : ''}{l.delta.toFixed(2)}
                          </td>
                          <td className="py-1.5 pr-2 text-right text-gray-600">{l.balanceAfter.toFixed(2)}</td>
                          <td className="py-1.5 text-xs text-gray-400">
                            {l.note || '-'} · {fmt(l.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
