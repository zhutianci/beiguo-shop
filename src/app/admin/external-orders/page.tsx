'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, AlertCircle, Trash2, Search, FileText, Sparkles, Pencil, X } from 'lucide-react'

interface ParsedRow {
  startDate: string // ISO date YYYY-MM-DD
  expireDate: string
  subscriptionType: string
  xianyuNickname: string
  claudeAccount: string
  cost: number | null
  quote: number | null
  profit: number | null
  error?: string
  raw: string
}

interface ExternalOrder {
  id: number
  startDate: string
  expireDate: string
  subscriptionType: string
  xianyuNickname: string | null
  claudeAccount: string
  cost: string | number | null
  quote: string | number | null
  profit: string | number | null
  importBatch: string | null
  invoiceStatus?: string | null
  invoiceNo?: string | null
  updatedAt: string
}

interface EditingOrder {
  id: number
  startDate: string  // YYYY-MM-DD
  expireDate: string // YYYY-MM-DD
  subscriptionType: string
  xianyuNickname: string
  claudeAccount: string
  cost: string
  quote: string
  profit: string
}

// 发票状态文案（与 lib/invoice 保持一致；此处独立定义避免把 node crypto 引入客户端包）
const INVOICE_STATUS_LABELS: Record<string, string> = {
  UNAPPLIED: '可开据·未开发票',
  AWAIT_PAY: '可开据·待支付税费',
  SUBMITTED: '可开具·已提交开票',
  ISSUED: '已开具',
  CANNOT: '不可开据',
}

// 解析金额，空 / 非数字返回 null
function parseNum(s: string | undefined): number | null {
  if (s == null) return null
  const t = s.replace(/[¥,\s]/g, '').trim()
  if (!t) return null
  const n = Number(t)
  return isFinite(n) ? n : null
}

// 解析 "2026年4月23日" 或 "2026-04-23" 或 "2026/04/23"
function parseDate(s: string): Date | null {
  const cn = s.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日?$/)
  if (cn) {
    const [, y, m, d] = cn
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
  }
  const std = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/)
  if (std) {
    const [, y, m, d] = std
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
  }
  return null
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addOneMonth(d: Date): Date {
  const r = new Date(d)
  r.setMonth(r.getMonth() + 1)
  return r
}

function parseLine(raw: string): ParsedRow {
  // ✨ 只用 Tab 分隔（从 Excel / 表格复制就是 Tab）
  // 这样订阅类型/昵称里可以包含空格而不会被错误拆分
  const parts = raw.split(/\t+/).map((p) => p.trim())
  const fail = (error: string): ParsedRow => ({
    raw,
    startDate: '',
    expireDate: '',
    subscriptionType: '',
    xianyuNickname: '',
    claudeAccount: '',
    cost: null,
    quote: null,
    profit: null,
    error,
  })

  if (parts.length < 4) {
    return fail('至少需要 4 个字段，用 Tab 分隔（直接从 Excel / 表格复制即可）')
  }

  const [startStr, subscriptionType, xianyuNickname, claudeAccount, costStr, quoteStr, profitStr] = parts

  const startDate = parseDate(startStr)
  if (!startDate) {
    return fail(`无法解析日期 "${startStr}"`)
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claudeAccount)) {
    return fail(`账户邮箱格式不正确 "${claudeAccount}"`)
  }

  const cost = parseNum(costStr)
  const quote = parseNum(quoteStr)
  // 利润：粘贴了就用粘贴的；否则若有报价和成本则自动计算
  let profit = parseNum(profitStr)
  if (profit == null && quote != null && cost != null) {
    profit = Math.round((quote - cost) * 100) / 100
  }

  const expireDate = addOneMonth(startDate)
  return {
    raw,
    startDate: toIsoDate(startDate),
    expireDate: toIsoDate(expireDate),
    subscriptionType: subscriptionType.trim(),
    xianyuNickname: xianyuNickname.trim(),
    claudeAccount: claudeAccount.trim(),
    cost,
    quote,
    profit,
  }
}

export default function ExternalOrdersPage() {
  const [text, setText] = useState('')
  const [importing, setImporting] = useState(false)
  const [notifyOnImport, setNotifyOnImport] = useState(true)
  const [importResult, setImportResult] = useState<{ created: number; updated: number; skipped: number; total: number; notified?: { total: number; sent: number; failed: number } } | null>(null)

  const [orders, setOrders] = useState<ExternalOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')

  // 编辑/删除状态
  const [editing, setEditing] = useState<EditingOrder | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const parsed = useMemo(() => {
    if (!text.trim()) return []
    return text
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+$/, '')) // 只去尾空，保留行内 Tab
      .filter((line) => line.trim().length > 0)
      .map(parseLine)
  }, [text])

  const validRows = parsed.filter((p) => !p.error)
  const errorRows = parsed.filter((p) => p.error)

  const loadOrders = async () => {
    setLoading(true)
    try {
      const url = keyword
        ? `/api/admin/external-orders?keyword=${encodeURIComponent(keyword)}&pageSize=200`
        : `/api/admin/external-orders?pageSize=200`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) setOrders(data.data.list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleImport = async () => {
    if (validRows.length === 0) {
      alert('没有有效记录可导入')
      return
    }
    setImporting(true)
    setImportResult(null)
    try {
      const items = validRows.map((r) => ({
        startDate: r.startDate,
        expireDate: r.expireDate,
        subscriptionType: r.subscriptionType,
        xianyuNickname: r.xianyuNickname || null,
        claudeAccount: r.claudeAccount,
        cost: r.cost,
        quote: r.quote,
        profit: r.profit,
      }))
      const res = await fetch('/api/admin/external-orders/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, notify: notifyOnImport }),
      })
      const data = await res.json()
      if (data.success) {
        setImportResult(data.data)
        setText('')
        loadOrders()
      } else {
        alert(data.error || '导入失败')
      }
    } finally {
      setImporting(false)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('确定要清空所有订单数据吗？此操作不可恢复！')) return
    const res = await fetch('/api/admin/external-orders', { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      alert(data.message)
      loadOrders()
    } else {
      alert(data.error || '清空失败')
    }
  }

  const handleStartEdit = (o: ExternalOrder) => {
    setEditError(null)
    setEditing({
      id: o.id,
      startDate: o.startDate.slice(0, 10),
      expireDate: o.expireDate.slice(0, 10),
      subscriptionType: o.subscriptionType,
      xianyuNickname: o.xianyuNickname || '',
      claudeAccount: o.claudeAccount,
      cost: o.cost == null ? '' : String(o.cost),
      quote: o.quote == null ? '' : String(o.quote),
      profit: o.profit == null ? '' : String(o.profit),
    })
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    setSavingEdit(true)
    setEditError(null)
    try {
      const res = await fetch(`/api/admin/external-orders/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: editing.startDate,
          expireDate: editing.expireDate,
          subscriptionType: editing.subscriptionType,
          xianyuNickname: editing.xianyuNickname || null,
          claudeAccount: editing.claudeAccount,
          cost: parseNum(editing.cost),
          quote: parseNum(editing.quote),
          profit: parseNum(editing.profit),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setEditing(null)
        loadOrders()
      } else {
        setEditError(data.error || '更新失败')
      }
    } catch (e) {
      setEditError(e instanceof Error ? e.message : '更新失败')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleSetInvoiceStatus = async (orderId: number, status: string) => {
    const res = await fetch(`/api/admin/invoices/by-order/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (data.success) loadOrders()
    else alert(data.error || '更新发票状态失败')
  }

  const handleDeleteOne = async (o: ExternalOrder) => {
    if (!confirm(`确定删除订单：\n${o.subscriptionType} · ${o.claudeAccount} · ${o.startDate.slice(0, 10)}？`)) return
    const res = await fetch(`/api/admin/external-orders/${o.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      loadOrders()
    } else {
      alert(data.error || '删除失败')
    }
  }

  const isExpired = (expire: string) => new Date(expire) < new Date()

  // 当编辑开通时间时，自动更新到期时间为 +1 月（用户仍可手动改）
  const handleEditStartDateChange = (v: string) => {
    if (!editing) return
    const d = parseDate(v.replace(/-/g, '-')) || new Date(v)
    if (isNaN(d.getTime())) {
      setEditing({ ...editing, startDate: v })
      return
    }
    setEditing({ ...editing, startDate: v, expireDate: toIsoDate(addOneMonth(d)) })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>批量导入订单（粘贴模式）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
              <div className="font-medium mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                使用说明
              </div>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>每行一条订单，字段用 <strong>Tab</strong> 分隔（从 Excel / 表格直接复制即可）</li>
                <li>字段顺序：<code className="bg-blue-100 px-1 rounded">开通时间 ⇥ 订阅类型 ⇥ 闲鱼昵称 ⇥ Claude账户 ⇥ 本单成本 ⇥ 报价 ⇥ 利润</code></li>
                <li>订阅类型与昵称内可以包含空格</li>
                <li>到期时间自动计算（开通时间 + 1 个月）</li>
                <li><strong>本单成本 / 报价 / 利润</strong> 为选填；利润留空时自动按「报价 − 成本」计算</li>
                <li>已存在的订单（账户+开通时间+类型）会自动更新</li>
              </ol>
              <div className="mt-3 p-2 bg-blue-100 rounded font-mono text-xs whitespace-pre">
                {'2026年4月23日\tClaude Max 20x\thijkkkk\tlinyanan421@gmail.com\t120\t199\t79\n2026年5月23日\tClaude Pro\t黄河清不清\tInnifredIenow5213@outlook.com\t60\t99\n2026年1月13日\tChatGPT Plus\t爱吃啤酒肉丝的清潭\tliaoliang226@gmail.com'}
              </div>
            </div>

            <div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={'在这里粘贴订单数据，每行一条（Tab 分隔）...'}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 font-mono text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                rows={10}
              />
            </div>

            {parsed.length > 0 && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700">
                    解析结果：
                    <span className="text-green-600 ml-2">✓ {validRows.length} 条有效</span>
                    {errorRows.length > 0 && (
                      <span className="text-red-600 ml-2">✗ {errorRows.length} 条错误</span>
                    )}
                  </div>
                </div>

                {errorRows.length > 0 && (
                  <div className="rounded-lg bg-red-50 p-3 space-y-1 text-xs">
                    {errorRows.slice(0, 10).map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-red-700">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-mono">{r.raw}</div>
                          <div className="text-red-500">{r.error}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {validRows.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="text-xs w-full text-gray-800">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-2 py-1 text-left">开通时间</th>
                          <th className="px-2 py-1 text-left">到期时间</th>
                          <th className="px-2 py-1 text-left">订阅类型</th>
                          <th className="px-2 py-1 text-left">闲鱼昵称</th>
                          <th className="px-2 py-1 text-left">Claude账户</th>
                          <th className="px-2 py-1 text-right">成本</th>
                          <th className="px-2 py-1 text-right">报价</th>
                          <th className="px-2 py-1 text-right">利润</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validRows.slice(0, 10).map((r, i) => (
                          <tr key={i} className="border-b">
                            <td className="px-2 py-1">{r.startDate}</td>
                            <td className="px-2 py-1">{r.expireDate}</td>
                            <td className="px-2 py-1">{r.subscriptionType}</td>
                            <td className="px-2 py-1">{r.xianyuNickname}</td>
                            <td className="px-2 py-1 font-mono">{r.claudeAccount}</td>
                            <td className="px-2 py-1 text-right">{r.cost ?? '-'}</td>
                            <td className="px-2 py-1 text-right">{r.quote ?? '-'}</td>
                            <td className="px-2 py-1 text-right">{r.profit ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {validRows.length > 10 && (
                      <div className="text-xs text-gray-500 mt-2 text-center">还有 {validRows.length - 10} 条...</div>
                    )}
                  </div>
                )}

                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifyOnImport}
                    onChange={(e) => setNotifyOnImport(e.target.checked)}
                    className="w-4 h-4 rounded accent-primary-600"
                  />
                  导入后给<strong>新增</strong>订单发送「充值成功」邮件（重复导入的不发）
                </label>

                <Button onClick={handleImport} loading={importing} className="w-full" disabled={validRows.length === 0}>
                  导入 {validRows.length} 条订单
                </Button>
              </div>
            )}

            {importResult && (
              <div className="rounded-lg bg-green-50 p-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-900">
                  <div className="font-medium">导入完成</div>
                  <div className="mt-1">
                    共 {importResult.total} 条 · 新增 {importResult.created} · 更新 {importResult.updated} · 跳过 {importResult.skipped}
                  </div>
                  {importResult.notified && importResult.notified.total > 0 && (
                    <div className="mt-1">
                      充值成功邮件：发送 {importResult.notified.sent} 封
                      {importResult.notified.failed > 0 && (
                        <span className="text-red-600"> · 失败 {importResult.notified.failed}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>当前订单（共 {orders.length} 条）</CardTitle>
          <Button variant="danger" size="sm" onClick={handleClearAll}>
            <Trash2 className="w-4 h-4 mr-1" />
            清空全部
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索账户/昵称/订阅类型..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
                className="pl-10"
              />
            </div>
            <Button onClick={loadOrders} variant="outline">
              <Search className="w-4 h-4 mr-1" />
              搜索
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
              <FileText className="w-8 h-8" />
              暂无订单
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="border-b text-left text-gray-500 text-xs">
                    <th className="pb-2 pr-3">开通时间</th>
                    <th className="pb-2 pr-3">到期时间</th>
                    <th className="pb-2 pr-3">订阅类型</th>
                    <th className="pb-2 pr-3">闲鱼昵称</th>
                    <th className="pb-2 pr-3">Claude账户</th>
                    <th className="pb-2 pr-3 text-right">成本</th>
                    <th className="pb-2 pr-3 text-right">报价</th>
                    <th className="pb-2 pr-3 text-right">利润</th>
                    <th className="pb-2 pr-3">发票</th>
                    <th className="pb-2 pr-3">状态</th>
                    <th className="pb-2 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b hover:bg-gray-50/60 transition-colors">
                      <td className="py-2 pr-3">{o.startDate.slice(0, 10)}</td>
                      <td className="py-2 pr-3">{o.expireDate.slice(0, 10)}</td>
                      <td className="py-2 pr-3 font-medium">{o.subscriptionType}</td>
                      <td className="py-2 pr-3">{o.xianyuNickname || '-'}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{o.claudeAccount}</td>
                      <td className="py-2 pr-3 text-right text-gray-600">{o.cost == null ? '-' : `¥${Number(o.cost).toFixed(2)}`}</td>
                      <td className="py-2 pr-3 text-right text-gray-600">{o.quote == null ? '-' : `¥${Number(o.quote).toFixed(2)}`}</td>
                      <td className="py-2 pr-3 text-right font-medium text-green-600">{o.profit == null ? '-' : `¥${Number(o.profit).toFixed(2)}`}</td>
                      <td className="py-2 pr-3">
                        <select
                          value={o.invoiceStatus || 'UNAPPLIED'}
                          onChange={(e) => handleSetInvoiceStatus(o.id, e.target.value)}
                          title={o.invoiceNo || '设置发票状态'}
                          className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900"
                        >
                          {Object.keys(INVOICE_STATUS_LABELS).map((s) => (
                            <option key={s} value={s}>{INVOICE_STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        {isExpired(o.expireDate) ? (
                          <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-red-100 text-red-700">已过期</span>
                        ) : (
                          <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-green-100 text-green-700">有效</span>
                        )}
                      </td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleStartEdit(o)}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil className="w-3 h-3" />
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeleteOne(o)}
                          className="ml-1 inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                          删除
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

      {/* 编辑弹窗 */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => !savingEdit && setEditing(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">编辑订单 #{editing.id}</h3>
              <button
                onClick={() => !savingEdit && setEditing(null)}
                className="p-1 rounded hover:bg-gray-100 text-gray-500"
                aria-label="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">开通时间</label>
                  <input
                    type="date"
                    value={editing.startDate}
                    onChange={(e) => handleEditStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">到期时间</label>
                  <input
                    type="date"
                    value={editing.expireDate}
                    onChange={(e) => setEditing({ ...editing, expireDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">订阅类型</label>
                <input
                  type="text"
                  value={editing.subscriptionType}
                  onChange={(e) => setEditing({ ...editing, subscriptionType: e.target.value })}
                  placeholder="如：Claude Max 20x"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">闲鱼昵称</label>
                <input
                  type="text"
                  value={editing.xianyuNickname}
                  onChange={(e) => setEditing({ ...editing, xianyuNickname: e.target.value })}
                  placeholder="选填"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Claude 账户</label>
                <input
                  type="email"
                  value={editing.claudeAccount}
                  onChange={(e) => setEditing({ ...editing, claudeAccount: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-mono focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">本单成本</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editing.cost}
                    onChange={(e) => {
                      const cost = e.target.value
                      // 报价与成本都有值且利润为空时自动补利润
                      const q = parseNum(editing.quote)
                      const c = parseNum(cost)
                      const profit = !editing.profit && q != null && c != null ? String(Math.round((q - c) * 100) / 100) : editing.profit
                      setEditing({ ...editing, cost, profit })
                    }}
                    placeholder="选填"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">报价</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editing.quote}
                    onChange={(e) => {
                      const quote = e.target.value
                      const q = parseNum(quote)
                      const c = parseNum(editing.cost)
                      const profit = !editing.profit && q != null && c != null ? String(Math.round((q - c) * 100) / 100) : editing.profit
                      setEditing({ ...editing, quote, profit })
                    }}
                    placeholder="选填"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">利润</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editing.profit}
                    onChange={(e) => setEditing({ ...editing, profit: e.target.value })}
                    placeholder="自动 = 报价−成本"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

              {editError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {editError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditing(null)} disabled={savingEdit}>
                  取消
                </Button>
                <Button onClick={handleSaveEdit} loading={savingEdit}>
                  保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
