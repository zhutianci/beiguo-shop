'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle, AlertCircle, Trash2, Search, FileText, Sparkles } from 'lucide-react'

interface ParsedRow {
  startDate: string // ISO date YYYY-MM-DD
  expireDate: string
  subscriptionType: string
  xianyuNickname: string
  claudeAccount: string
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
  importBatch: string | null
  updatedAt: string
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
  // 用任意空白字符（包括 tab）分割，至少 4 段
  const parts = raw.trim().split(/\s+/)
  if (parts.length < 4) {
    return {
      raw,
      startDate: '',
      expireDate: '',
      subscriptionType: '',
      xianyuNickname: '',
      claudeAccount: '',
      error: '至少需要 4 个字段',
    }
  }

  // 第一段为日期，第二段为类型，倒数第一为邮箱，剩下的是昵称（昵称可能含空格）
  const startStr = parts[0]
  const subscriptionType = parts[1]
  const claudeAccount = parts[parts.length - 1]
  const xianyuNickname = parts.slice(2, -1).join(' ')

  const startDate = parseDate(startStr)
  if (!startDate) {
    return {
      raw,
      startDate: '',
      expireDate: '',
      subscriptionType: '',
      xianyuNickname: '',
      claudeAccount: '',
      error: `无法解析日期 "${startStr}"`,
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claudeAccount)) {
    return {
      raw,
      startDate: '',
      expireDate: '',
      subscriptionType: '',
      xianyuNickname: '',
      claudeAccount: '',
      error: `账户邮箱格式不正确 "${claudeAccount}"`,
    }
  }

  const expireDate = addOneMonth(startDate)
  return {
    raw,
    startDate: toIsoDate(startDate),
    expireDate: toIsoDate(expireDate),
    subscriptionType,
    xianyuNickname,
    claudeAccount,
  }
}

export default function ExternalOrdersPage() {
  const [text, setText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; updated: number; skipped: number; total: number } | null>(null)

  const [orders, setOrders] = useState<ExternalOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')

  const parsed = useMemo(() => {
    if (!text.trim()) return []
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map(parseLine)
  }, [text])

  const validRows = parsed.filter((p) => !p.error)
  const errorRows = parsed.filter((p) => p.error)

  const loadOrders = async () => {
    setLoading(true)
    try {
      const url = keyword
        ? `/api/admin/external-orders?keyword=${encodeURIComponent(keyword)}&pageSize=100`
        : `/api/admin/external-orders?pageSize=100`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) setOrders(data.data.list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
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
      }))
      const res = await fetch('/api/admin/external-orders/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
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

  const isExpired = (expire: string) => new Date(expire) < new Date()

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
                <li>每行一条订单，字段用<strong>空格或 Tab</strong>分隔</li>
                <li>字段顺序：<code className="bg-blue-100 px-1 rounded">开通时间 订阅类型 闲鱼昵称 Claude账户</code></li>
                <li>到期时间会自动计算（开通时间 + 1 个月）</li>
                <li>已存在的订单（按账户+开通时间+类型识别）会自动更新</li>
              </ol>
              <div className="mt-3 p-2 bg-blue-100 rounded font-mono text-xs">
                2026年4月23日    max100    hijkkkk    linyanan421@gmail.com<br />
                2026年5月23日    max100    hijkkkk    linyanan421@gmail.com<br />
                2026年1月13日    pro    爱吃啤酒肉丝的清潭    liaoliang226@gmail.com
              </div>
            </div>

            <div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="在这里粘贴订单数据，每行一条..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 font-mono text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                rows={10}
              />
            </div>

            {parsed.length > 0 && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    解析结果：
                    <span className="text-green-600 ml-2">✓ {validRows.length} 条有效</span>
                    {errorRows.length > 0 && (
                      <span className="text-red-600 ml-2">✗ {errorRows.length} 条错误</span>
                    )}
                  </div>
                </div>

                {/* 错误行 */}
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

                {/* 有效预览 */}
                {validRows.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="text-xs w-full">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-2 py-1 text-left">开通时间</th>
                          <th className="px-2 py-1 text-left">到期时间</th>
                          <th className="px-2 py-1 text-left">订阅类型</th>
                          <th className="px-2 py-1 text-left">闲鱼昵称</th>
                          <th className="px-2 py-1 text-left">Claude账户</th>
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {validRows.length > 10 && (
                      <div className="text-xs text-gray-500 mt-2 text-center">还有 {validRows.length - 10} 条...</div>
                    )}
                  </div>
                )}

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
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500 text-xs">
                    <th className="pb-2">开通时间</th>
                    <th className="pb-2">到期时间</th>
                    <th className="pb-2">订阅类型</th>
                    <th className="pb-2">闲鱼昵称</th>
                    <th className="pb-2">Claude账户</th>
                    <th className="pb-2">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b">
                      <td className="py-2">{o.startDate.slice(0, 10)}</td>
                      <td className="py-2">{o.expireDate.slice(0, 10)}</td>
                      <td className="py-2 font-medium">{o.subscriptionType}</td>
                      <td className="py-2">{o.xianyuNickname || '-'}</td>
                      <td className="py-2 font-mono">{o.claudeAccount}</td>
                      <td className="py-2">
                        {isExpired(o.expireDate) ? (
                          <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-red-100 text-red-700">已过期</span>
                        ) : (
                          <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-green-100 text-green-700">有效</span>
                        )}
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
