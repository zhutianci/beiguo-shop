'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Trash2, Ban, RotateCcw, Upload } from 'lucide-react'

interface Product {
  id: number
  name: string
  deliveryType?: string
}
interface CardRow {
  id: number
  status: string
  secret: string
  orderId: number | null
  batch: string | null
  remark: string | null
  usedAt: string | null
  createdAt: string
}
interface Stats {
  unused: number
  used: number
  disabled: number
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  UNUSED: { label: '未使用', cls: 'bg-green-100 text-green-700' },
  USED: { label: '已发出', cls: 'bg-gray-100 text-gray-500' },
  DISABLED: { label: '已停用', cls: 'bg-red-100 text-red-600' },
}

function fmt(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('zh-CN', { hour12: false })
}

export default function AdminCardKeysPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-400">加载中...</div>}>
      <CardKeysInner />
    </Suspense>
  )
}

function CardKeysInner() {
  const sp = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [productId, setProductId] = useState<number>(0)
  const [list, setList] = useState<CardRow[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [reveal, setReveal] = useState(false)
  const [loading, setLoading] = useState(false)

  // 导入
  const [importText, setImportText] = useState('')
  const [batch, setBatch] = useState('')
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState('')

  useEffect(() => {
    fetch('/api/admin/products')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const auto = d.data.filter((p: Product) => p.deliveryType === 'AUTO')
          setProducts(auto)
          const fromUrl = parseInt(sp.get('productId') || '0')
          setProductId(fromUrl || auto[0]?.id || 0)
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = useCallback(async () => {
    if (!productId) {
      setList([])
      setStats(null)
      return
    }
    setLoading(true)
    try {
      const q = new URLSearchParams({ productId: String(productId), pageSize: '200' })
      if (statusFilter) q.set('status', statusFilter)
      if (reveal) q.set('reveal', '1')
      const res = await fetch(`/api/admin/cardkeys?${q}`)
      const data = await res.json()
      if (data.success) {
        setList(data.data.list)
        setStats(data.data.stats)
      }
    } finally {
      setLoading(false)
    }
  }, [productId, statusFilter, reveal])

  useEffect(() => {
    load()
  }, [load])

  const doImport = async () => {
    if (!productId) return alert('请先选择商品')
    if (!importText.trim()) return alert('请粘贴卡密')
    setImporting(true)
    setImportMsg('')
    try {
      const res = await fetch('/api/admin/cardkeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, content: importText, batch: batch.trim() || null }),
      })
      const data = await res.json()
      if (data.success) {
        setImportMsg(`导入完成：新增 ${data.data.created}，跳过重复 ${data.data.skipped}，共 ${data.data.total}`)
        setImportText('')
        load()
      } else setImportMsg(data.error || '导入失败')
    } finally {
      setImporting(false)
    }
  }

  const setStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/admin/cardkeys/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (data.success) load()
    else alert(data.error || '操作失败')
  }
  const del = async (id: number) => {
    if (!confirm('删除该卡密？')) return
    const res = await fetch(`/api/admin/cardkeys/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) load()
    else alert(data.error || '删除失败')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>卡密管理（自动发货商品）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={productId}
              onChange={(e) => setProductId(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value={0}>请选择自动发货商品</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {products.length === 0 && (
              <span className="text-sm text-gray-400">暂无「自动发货」商品，请先在商品管理把发货方式设为自动发货。</span>
            )}
          </div>

          {stats && (
            <div className="grid grid-cols-3 gap-3 max-w-md">
              <div className="rounded-xl border border-green-100 bg-green-50 p-3">
                <div className="text-xs text-green-700">未使用</div>
                <div className="text-2xl font-bold text-green-700">{stats.unused}</div>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <div className="text-xs text-gray-500">已发出</div>
                <div className="text-2xl font-bold text-gray-700">{stats.used}</div>
              </div>
              <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                <div className="text-xs text-red-600">已停用</div>
                <div className="text-2xl font-bold text-red-600">{stats.disabled}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {productId > 0 && (
        <>
          {/* 导入 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">批量导入卡密</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-500">每行一条卡密（如 <code>账号----密码</code> 或一段充值码）。加密存储，同商品内自动去重。</p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={6}
                placeholder={'卡密1\n卡密2\n卡密3'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
              />
              <div className="flex flex-wrap items-center gap-3">
                <input
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  placeholder="批次备注（选填）"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <Button onClick={doImport} loading={importing}>
                  <Upload className="w-4 h-4 mr-1" /> 导入
                </Button>
                {importMsg && <span className="text-sm text-gray-600">{importMsg}</span>}
              </div>
            </CardContent>
          </Card>

          {/* 列表 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">卡密列表（共 {list.length}）</CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
                >
                  <option value="">全部</option>
                  <option value="UNUSED">未使用</option>
                  <option value="USED">已发出</option>
                  <option value="DISABLED">已停用</option>
                </select>
                <Button variant="outline" size="sm" onClick={() => setReveal((v) => !v)}>
                  {reveal ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  {reveal ? '隐藏明文' : '显示明文'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-10 text-gray-400">加载中...</div>
              ) : list.length === 0 ? (
                <div className="text-center py-10 text-gray-400">暂无卡密</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-gray-800">
                    <thead>
                      <tr className="border-b text-left text-gray-500 text-xs">
                        <th className="pb-2 pr-3">卡密</th>
                        <th className="pb-2 pr-3">状态</th>
                        <th className="pb-2 pr-3">订单</th>
                        <th className="pb-2 pr-3">批次</th>
                        <th className="pb-2 pr-3">发出/创建</th>
                        <th className="pb-2 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((c) => (
                        <tr key={c.id} className="border-b hover:bg-gray-50/60">
                          <td className="py-2 pr-3 font-mono text-xs break-all max-w-[280px]">{c.secret}</td>
                          <td className="py-2 pr-3">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${STATUS_LABELS[c.status]?.cls || ''}`}>
                              {STATUS_LABELS[c.status]?.label || c.status}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-xs text-gray-500">{c.orderId ? `#${c.orderId}` : '—'}</td>
                          <td className="py-2 pr-3 text-xs text-gray-500">{c.batch || '—'}</td>
                          <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">{fmt(c.usedAt || c.createdAt)}</td>
                          <td className="py-2 text-right whitespace-nowrap">
                            {c.status === 'UNUSED' && (
                              <button onClick={() => setStatus(c.id, 'DISABLED')} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50" title="停用">
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {c.status === 'DISABLED' && (
                              <button onClick={() => setStatus(c.id, 'UNUSED')} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-green-600 hover:bg-green-50" title="启用">
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {c.status !== 'USED' && (
                              <button onClick={() => del(c.id)} className="ml-1 inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50" title="删除">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        </>
      )}
    </div>
  )
}
