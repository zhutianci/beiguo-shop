'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Trash2, Ban, RotateCcw, Upload, Save, Search, X, Coins, Tag } from 'lucide-react'

interface Product {
  id: number
  name: string
  deliveryType?: string
}

interface CardRow {
  id: number
  productId: number
  status: string
  secret: string
  orderId: number | null
  externalRef: string | null
  batch: string | null
  remark: string | null
  cost: number | null
  soldPrice: number | null
  profit: number | null
  redeemUrl: string | null
  usedAt: string | null
  createdAt: string
}

interface Stats {
  unused: number
  used: number
  disabled: number
  totalCost: number
  totalRevenue: number
  totalProfit: number
}

interface OrderPayment {
  id: number
  tradeNo: string | null
  payMethod: string
  amount: number
  status: number
  createdAt: string
}

interface CardOrderDetail {
  kind: 'LOCAL' | 'EXTERNAL'
  card: {
    id: number
    batch: string | null
    remark: string | null
    cost: number | null
    soldPrice: number | null
    profit: number | null
    redeemUrl: string | null
    usedAt: string | null
    createdAt: string
  }
  note?: string
  order?: {
    id: number
    orderNo: string
    productName: string
    productPrice: number
    categoryName: string | null
    quantity: number
    amount: number
    payMethod: string | null
    payStatus: string
    deliveryStatus: string
    remark: string | null
    referralReward: number | null
    createdAt: string
    paidAt: string | null
    deliveredAt: string | null
    cardCount: number
    user: { id: number; email: string | null; nickname: string | null } | null
    payments: OrderPayment[]
  }
  dispense?: {
    client: string
    externalNo: string
    found: boolean
    productName: string | null
    apiSku: string | null
    quantity: number | null
    delivered: number | null
    status: string | null
    createdAt: string | null
  }
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  UNUSED: { label: '未使用', cls: 'bg-green-100 text-green-700' },
  USED: { label: '已发出', cls: 'bg-gray-100 text-gray-500' },
  DISABLED: { label: '已停用', cls: 'bg-red-100 text-red-600' },
}

const PAY_STATUS_LABELS: Record<string, string> = {
  UNPAID: '未支付',
  PAID: '已支付',
  REFUNDED: '已退款',
}
const DELIVERY_STATUS_LABELS: Record<string, string> = {
  PENDING: '待处理',
  PROCESSING: '处理中',
  DELIVERED: '已交付',
  CANCELLED: '已取消',
}
const PAY_METHOD_LABELS: Record<string, string> = {
  ALIPAY: '支付宝',
  WECHAT: '微信',
  BALANCE: '余额',
}
const DISPENSE_STATUS_LABELS: Record<string, string> = {
  PENDING: '待处理',
  PROCESSING: '发卡中',
  FULFILLED: '已发足',
  PARTIAL: '缺货/待补',
}

function fmt(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('zh-CN', { hour12: false })
}

function money(n: number | null | undefined) {
  if (n == null) return '—'
  return `¥${n.toFixed(2)}`
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

  // 列表 + 筛选 + 分页
  const [list, setList] = useState<CardRow[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [statusFilter, setStatusFilter] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [hasOrder, setHasOrder] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [reveal, setReveal] = useState(false)
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // 多选 + 批量
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [batchBusy, setBatchBusy] = useState(false)
  const [batchMsg, setBatchMsg] = useState('')
  const [priceModal, setPriceModal] = useState<{ action: 'SET_COST' | 'SET_PRICE'; value: string } | null>(null)

  // 导入
  const [importText, setImportText] = useState('')
  const [batch, setBatch] = useState('')
  const [importCost, setImportCost] = useState('')
  const [importRedeemUrl, setImportRedeemUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState('')

  // 使用说明 + 充值链接（商品级默认）
  const [usage, setUsage] = useState('')
  const [redeemUrl, setRedeemUrl] = useState('')
  const [savingUsage, setSavingUsage] = useState(false)
  const [usageMsg, setUsageMsg] = useState('')

  // 订单详情弹窗
  const [detail, setDetail] = useState<CardOrderDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailErr, setDetailErr] = useState('')

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

  // 搜索防抖
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    if (!productId) {
      setList([])
      setStats(null)
      setTotal(0)
      setTotalPages(1)
      return
    }
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    try {
      const q = new URLSearchParams({
        productId: String(productId),
        page: String(page),
        pageSize: String(pageSize),
      })
      if (statusFilter) q.set('status', statusFilter)
      if (batchFilter.trim()) q.set('batch', batchFilter.trim())
      if (debouncedSearch) q.set('keyword', debouncedSearch)
      if (hasOrder) q.set('hasOrder', hasOrder)
      if (reveal) q.set('reveal', '1')
      const res = await fetch(`/api/admin/cardkeys?${q}`, { signal: controller.signal })
      const data = await res.json()
      if (data.success && abortRef.current === controller) {
        setList(data.data.list)
        setStats(data.data.stats)
        setTotal(data.data.total || 0)
        setTotalPages(data.data.totalPages || 1)
        setUsage(data.data.cardUsage || '')
        setRedeemUrl(data.data.cardRedeemUrl || '')
      }
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }, [productId, page, pageSize, statusFilter, batchFilter, debouncedSearch, hasOrder, reveal])

  useEffect(() => {
    load()
  }, [load])

  // 筛选/翻页后清空选择，避免误操作到看不见的行
  useEffect(() => {
    setSelected(new Set())
  }, [productId, page, pageSize, statusFilter, batchFilter, debouncedSearch, hasOrder])

  // 筛选条件变更回到第一页
  const resetPage = () => setPage(1)

  const saveUsage = async () => {
    if (!productId) return
    setSavingUsage(true)
    setUsageMsg('')
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardUsage: usage, cardRedeemUrl: redeemUrl.trim() }),
      })
      const data = await res.json()
      setUsageMsg(data.success ? '已保存' : data.error || '保存失败')
    } finally {
      setSavingUsage(false)
    }
  }

  const doImport = async () => {
    if (!productId) return alert('请先选择商品')
    if (!importText.trim()) return alert('请粘贴卡密')
    const costNum = importCost.trim() === '' ? 0 : Number(importCost)
    if (!Number.isFinite(costNum) || costNum < 0) return alert('本批成本填写有误')
    const url = importRedeemUrl.trim()
    if (url && !/^https?:\/\//i.test(url)) return alert('兑换地址需以 http:// 或 https:// 开头')
    setImporting(true)
    setImportMsg('')
    try {
      const res = await fetch('/api/admin/cardkeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          content: importText,
          batch: batch.trim() || null,
          cost: costNum,
          redeemUrl: url || null,
        }),
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

  // ---- 多选 ----
  const selectedRows = useMemo(() => list.filter((c) => selected.has(c.id)), [list, selected])
  const hasUsedSelected = selectedRows.some((c) => c.status === 'USED')
  const hasUnusedSelected = selectedRows.some((c) => c.status !== 'USED')
  const allChecked = list.length > 0 && list.every((c) => selected.has(c.id))

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleAll = () => {
    setSelected((prev) => (list.every((c) => prev.has(c.id)) ? new Set<number>() : new Set(list.map((c) => c.id))))
  }

  const runBatch = async (payload: {
    action: 'REUSE' | 'DISABLE' | 'DELETE' | 'SET_COST' | 'SET_PRICE'
    cost?: number
    soldPrice?: number
  }) => {
    if (selected.size === 0) return
    setBatchBusy(true)
    setBatchMsg('')
    try {
      const res = await fetch('/api/admin/cardkeys/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected), ...payload }),
      })
      const data = await res.json()
      if (data.success) {
        const reasons: string[] = data.data.reasons || []
        setBatchMsg(
          `成功 ${data.data.affected} 条，跳过 ${data.data.skipped} 条${reasons.length ? '：' + reasons.join('；') : ''}`
        )
        setSelected(new Set())
        load()
      } else {
        setBatchMsg(data.error || '批量操作失败')
      }
    } finally {
      setBatchBusy(false)
    }
  }

  const submitPriceModal = async () => {
    if (!priceModal) return
    const n = Number(priceModal.value)
    if (!Number.isFinite(n) || n < 0) return alert('请填写有效金额')
    const payload = priceModal.action === 'SET_COST' ? { action: 'SET_COST' as const, cost: n } : { action: 'SET_PRICE' as const, soldPrice: n }
    setPriceModal(null)
    await runBatch(payload)
  }

  // ---- 订单详情 ----
  const openDetail = async (row: CardRow) => {
    if (row.status !== 'USED') return
    setDetail(null)
    setDetailErr('')
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/cardkeys/${row.id}/order`)
      const data = await res.json()
      if (data.success) setDetail(data.data)
      else setDetailErr(data.error || '查询失败')
    } catch {
      setDetailErr('查询失败')
    } finally {
      setDetailLoading(false)
    }
  }
  const closeDetail = () => {
    setDetail(null)
    setDetailErr('')
    setDetailLoading(false)
  }
  const detailOpen = detailLoading || !!detail || !!detailErr

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
              onChange={(e) => {
                setProductId(Number(e.target.value))
                resetPage()
              }}
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-3" title="该商品全部卡密的进货成本之和">
                <div className="text-xs text-amber-700">成本合计</div>
                <div className="text-xl font-bold text-amber-700">{money(stats.totalCost)}</div>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-3" title="已发出卡密的售价快照之和；外部站发卡不计入">
                <div className="text-xs text-blue-700">流水合计</div>
                <div className="text-xl font-bold text-blue-700">{money(stats.totalRevenue)}</div>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3" title="已落库的利润之和（不现算）">
                <div className="text-xs text-emerald-700">利润合计</div>
                <div className={`text-xl font-bold ${stats.totalProfit < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {money(stats.totalProfit)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {productId > 0 && (
        <>
          {/* 使用说明 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">使用说明 / 充值链接（商品级默认，展示给买家）</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">充值 / 兑换链接</label>
                <input
                  value={redeemUrl}
                  onChange={(e) => setRedeemUrl(e.target.value)}
                  placeholder="https://...（买家拿到卡密后点「去充值」会跳转此链接，留空则不显示按钮）"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-gray-400">
                  需以 http:// 或 https:// 开头。卡密可带自己的兑换地址（导入时按批填写），买家看到的优先是卡密专属地址，没有才回落到这里的默认链接。
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">使用说明</label>
                <p className="text-xs text-gray-500 mb-1.5">
                  买家付款后会在订单详情的卡密区域看到。可写：如何使用卡密充值、注意事项、售后/客服联系方式等。
                </p>
                <textarea
                  value={usage}
                  onChange={(e) => setUsage(e.target.value)}
                  rows={6}
                  placeholder={'例如：\n1. 打开 xxx 官网/App，登录你的账号\n2. 进入「充值/兑换」，输入上方卡密\n3. 兑换成功即到账\n\n售后：如卡密无效，请在 24 小时内联系客服微信 xxx，并提供订单号。'}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={saveUsage} loading={savingUsage}>
                  <Save className="w-4 h-4 mr-1" /> 保存
                </Button>
                {usageMsg && <span className="text-sm text-gray-600">{usageMsg}</span>}
              </div>
            </CardContent>
          </Card>

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
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">批次备注（选填）</label>
                  <input
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    placeholder="如 20260904-A"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">本批成本（元/张）</label>
                  <input
                    value={importCost}
                    onChange={(e) => setImportCost(e.target.value)}
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="不填按 0 计"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">本批兑换地址（选填）</label>
                  <input
                    value={importRedeemUrl}
                    onChange={(e) => setImportRedeemUrl(e.target.value)}
                    placeholder="https://...，留空回落商品默认链接"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
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
              <CardTitle className="text-base">卡密列表（共 {total}）</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setReveal((v) => !v)}>
                {reveal ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {reveal ? '隐藏明文' : '显示明文'}
              </Button>
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
                      resetPage()
                    }}
                    placeholder="搜索：备注 / 批次"
                    className="w-56 rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm"
                  />
                </div>
                <input
                  value={batchFilter}
                  onChange={(e) => {
                    setBatchFilter(e.target.value)
                    resetPage()
                  }}
                  placeholder="按批次精确筛选"
                  className="w-44 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    resetPage()
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">全部状态</option>
                  <option value="UNUSED">未使用</option>
                  <option value="USED">已发出</option>
                  <option value="DISABLED">已停用</option>
                </select>
                <select
                  value={hasOrder}
                  onChange={(e) => {
                    setHasOrder(e.target.value)
                    resetPage()
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">订单归属：全部</option>
                  <option value="1">本站订单发出</option>
                  <option value="0">无本站订单（含外部站/未发出）</option>
                </select>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    resetPage()
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value={20}>每页 20</option>
                  <option value={50}>每页 50</option>
                  <option value={100}>每页 100</option>
                  <option value={200}>每页 200</option>
                </select>
              </div>

              {/* 批量操作条 */}
              {selected.size > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary-100 bg-primary-50/60 px-3 py-2">
                  <span className="text-sm text-gray-700">已选 {selected.size} 条</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={batchBusy || hasUsedSelected}
                    title={hasUsedSelected ? '选中项含已发出卡密，不可改状态' : '重新启用为未使用'}
                    onClick={() => runBatch({ action: 'REUSE' })}
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" /> 批量启用
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={batchBusy || hasUsedSelected}
                    title={hasUsedSelected ? '选中项含已发出卡密，不可作废' : '作废（停用）'}
                    onClick={() => runBatch({ action: 'DISABLE' })}
                  >
                    <Ban className="mr-1 h-3.5 w-3.5" /> 批量作废
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={batchBusy || hasUsedSelected}
                    title={hasUsedSelected ? '选中项含已发出卡密，不可删除' : '删除'}
                    onClick={() => {
                      if (confirm(`确认删除选中的 ${selected.size} 条卡密？`)) runBatch({ action: 'DELETE' })
                    }}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> 批量删除
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={batchBusy}
                    onClick={() => setPriceModal({ action: 'SET_COST', value: '' })}
                  >
                    <Coins className="mr-1 h-3.5 w-3.5" /> 批量改成本
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={batchBusy || !hasUsedSelected}
                    title={!hasUsedSelected ? '只有已发出的卡密才有售价' : '批量改售价，利润自动重算'}
                    onClick={() => setPriceModal({ action: 'SET_PRICE', value: '' })}
                  >
                    <Tag className="mr-1 h-3.5 w-3.5" /> 批量改售价
                  </Button>
                  <Button variant="ghost" size="sm" disabled={batchBusy} onClick={() => setSelected(new Set())}>
                    取消选择
                  </Button>
                  {hasUsedSelected && hasUnusedSelected && (
                    <span className="text-xs text-amber-600">选中项混合了已发出与未发出的卡密，部分操作会被服务端跳过。</span>
                  )}
                  {batchMsg && <span className="text-xs text-gray-600">{batchMsg}</span>}
                </div>
              )}

              {loading ? (
                <div className="text-center py-10 text-gray-400">加载中...</div>
              ) : list.length === 0 ? (
                <div className="text-center py-10 text-gray-400">暂无卡密</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-gray-800">
                    <thead>
                      <tr className="border-b text-left text-gray-500 text-xs">
                        <th className="pb-2 pr-2 w-8">
                          <input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4 cursor-pointer" />
                        </th>
                        <th className="pb-2 pr-3">卡密</th>
                        <th className="pb-2 pr-3">状态</th>
                        <th className="pb-2 pr-3">批次</th>
                        <th className="pb-2 pr-3 whitespace-nowrap">创建时间</th>
                        <th className="pb-2 pr-3 whitespace-nowrap">发出时间</th>
                        <th className="pb-2 pr-3 text-right whitespace-nowrap">成本</th>
                        <th className="pb-2 pr-3 text-right whitespace-nowrap">售价</th>
                        <th className="pb-2 pr-3 text-right whitespace-nowrap">利润</th>
                        <th className="pb-2 pr-3">订单</th>
                        <th className="pb-2 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((c) => {
                        const used = c.status === 'USED'
                        return (
                          <tr
                            key={c.id}
                            className={`border-b hover:bg-gray-50/60 ${used ? 'cursor-pointer' : ''}`}
                            onClick={() => openDetail(c)}
                            title={used ? '点击查看该卡密的订单详情' : undefined}
                          >
                            <td className="py-2 pr-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selected.has(c.id)}
                                onChange={() => toggleOne(c.id)}
                                className="h-4 w-4 cursor-pointer"
                              />
                            </td>
                            <td className="py-2 pr-3 font-mono text-xs break-all max-w-[240px]">
                              {c.secret}
                              {c.redeemUrl && (
                                <div className="mt-0.5 text-[11px] text-gray-400 break-all" title="该卡专属兑换地址（优先于商品默认链接）">
                                  兑换：{c.redeemUrl}
                                </div>
                              )}
                            </td>
                            <td className="py-2 pr-3">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${STATUS_LABELS[c.status]?.cls || ''}`}>
                                {STATUS_LABELS[c.status]?.label || c.status}
                              </span>
                            </td>
                            <td className="py-2 pr-3 text-xs text-gray-500">{c.batch || '—'}</td>
                            <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">{fmt(c.createdAt)}</td>
                            <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">{fmt(c.usedAt)}</td>
                            <td className="py-2 pr-3 text-right text-xs whitespace-nowrap">{money(c.cost)}</td>
                            <td className="py-2 pr-3 text-right text-xs whitespace-nowrap">{money(c.soldPrice)}</td>
                            <td className="py-2 pr-3 text-right text-xs whitespace-nowrap">
                              {c.profit == null ? (
                                <span className="text-gray-400" title="外部站发卡，收入未回传">未知</span>
                              ) : (
                                <span className={c.profit < 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                                  {money(c.profit)}
                                </span>
                              )}
                            </td>
                            <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">
                              {c.orderId ? (
                                `#${c.orderId}`
                              ) : c.externalRef ? (
                                <span className="text-purple-600" title={`外部站发卡：${c.externalRef}`}>外部站</span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="py-2 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
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
                              {used && (
                                <button onClick={() => openDetail(c)} className="text-xs px-2 py-1 rounded text-primary-600 hover:bg-primary-50">
                                  订单详情
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
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
        </>
      )}

      {/* 批量改成本 / 改售价 弹窗 */}
      {priceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6">
            <h3 className="mb-1 text-lg font-semibold">
              {priceModal.action === 'SET_COST' ? '批量修改成本' : '批量修改售价'}
            </h3>
            <p className="mb-4 text-xs text-gray-500">
              {priceModal.action === 'SET_COST'
                ? `将选中的 ${selected.size} 条卡密成本统一改为下方金额；已发出且有售价的卡，利润会同步重算。`
                : `仅对选中项中「已发出」的卡密生效，利润 = 新售价 − 成本，自动重算并落库。`}
            </p>
            <input
              type="number"
              min={0}
              step="0.01"
              autoFocus
              value={priceModal.value}
              onChange={(e) => setPriceModal({ ...priceModal, value: e.target.value })}
              placeholder="请输入金额（元）"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setPriceModal(null)}>取消</Button>
              <Button size="sm" onClick={submitPriceModal}>确定</Button>
            </div>
          </div>
        </div>
      )}

      {/* 已售出卡密的订单详情 */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeDetail}>
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">卡密去向</h3>
              <button onClick={closeDetail} className="rounded p-1 text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            {detailLoading ? (
              <div className="py-10 text-center text-gray-400">加载中...</div>
            ) : detailErr ? (
              <div className="py-10 text-center text-red-500">{detailErr}</div>
            ) : detail ? (
              <div className="space-y-4 text-sm">
                {/* 卡密自身 */}
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-gray-500">批次：</span>{detail.card.batch || '—'}</div>
                    <div><span className="text-gray-500">发出时间：</span>{fmt(detail.card.usedAt)}</div>
                    <div><span className="text-gray-500">成本：</span>{money(detail.card.cost)}</div>
                    <div><span className="text-gray-500">售价：</span>{money(detail.card.soldPrice)}</div>
                    <div>
                      <span className="text-gray-500">利润：</span>
                      {detail.card.profit == null ? (
                        <span className="text-gray-400">未知</span>
                      ) : (
                        <span className={detail.card.profit < 0 ? 'text-red-600' : 'text-green-600'}>
                          {money(detail.card.profit)}
                        </span>
                      )}
                    </div>
                    <div className="col-span-2 break-all">
                      <span className="text-gray-500">专属兑换地址：</span>{detail.card.redeemUrl || '（回落商品默认链接）'}
                    </div>
                  </div>
                </div>

                {detail.kind === 'LOCAL' && detail.order ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-gray-500">订单号：</span><span className="font-medium">{detail.order.orderNo}</span></div>
                      <div><span className="text-gray-500">订单 ID：</span>#{detail.order.id}</div>
                      <div className="col-span-2">
                        <span className="text-gray-500">商品：</span>
                        {detail.order.productName}
                        {detail.order.categoryName && <span className="ml-1 text-xs text-gray-400">（{detail.order.categoryName}）</span>}
                      </div>
                      <div><span className="text-gray-500">数量：</span>{detail.order.quantity} 张（本单已发 {detail.order.cardCount} 张）</div>
                      <div><span className="text-gray-500">订单金额：</span><span className="font-medium text-primary-600">{money(detail.order.amount)}</span></div>
                      <div><span className="text-gray-500">支付状态：</span>{PAY_STATUS_LABELS[detail.order.payStatus] || detail.order.payStatus}</div>
                      <div><span className="text-gray-500">交付状态：</span>{DELIVERY_STATUS_LABELS[detail.order.deliveryStatus] || detail.order.deliveryStatus}</div>
                      <div><span className="text-gray-500">支付方式：</span>{detail.order.payMethod ? PAY_METHOD_LABELS[detail.order.payMethod] || detail.order.payMethod : '—'}</div>
                      <div><span className="text-gray-500">内推返现：</span>{money(detail.order.referralReward)}</div>
                      <div><span className="text-gray-500">下单时间：</span>{fmt(detail.order.createdAt)}</div>
                      <div><span className="text-gray-500">付款时间：</span>{fmt(detail.order.paidAt)}</div>
                      <div><span className="text-gray-500">交付时间：</span>{fmt(detail.order.deliveredAt)}</div>
                      <div className="col-span-2">
                        <span className="text-gray-500">买家：</span>
                        {detail.order.user
                          ? `${detail.order.user.nickname || '未设昵称'} · ${detail.order.user.email || '无邮箱'}（#${detail.order.user.id}）`
                          : '—'}
                      </div>
                      {detail.order.remark && (
                        <div className="col-span-2"><span className="text-gray-500">备注：</span>{detail.order.remark}</div>
                      )}
                    </div>

                    <div>
                      <div className="mb-1 text-xs font-medium text-gray-500">支付流水</div>
                      {detail.order.payments.length === 0 ? (
                        <div className="text-xs text-gray-400">暂无支付记录</div>
                      ) : (
                        <div className="space-y-1">
                          {detail.order.payments.map((p) => (
                            <div key={p.id} className="flex flex-wrap items-center gap-2 rounded border border-gray-100 px-2 py-1 text-xs">
                              <span>{fmt(p.createdAt)}</span>
                              <span>{PAY_METHOD_LABELS[p.payMethod] || p.payMethod}</span>
                              <span className="font-medium">{money(p.amount)}</span>
                              <span className={p.status === 1 ? 'text-green-600' : p.status === 2 ? 'text-red-600' : 'text-gray-400'}>
                                {p.status === 1 ? '成功' : p.status === 2 ? '失败' : '待支付'}
                              </span>
                              {p.tradeNo && <span className="font-mono text-gray-400 break-all">{p.tradeNo}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : detail.dispense ? (
                  <>
                    <div className="rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 text-xs text-purple-700">
                      {detail.note || '外部站发卡，本站无售价与利润'}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-gray-500">外部站：</span><span className="font-medium">{detail.dispense.client}</span></div>
                      <div className="break-all"><span className="text-gray-500">外部单号：</span><span className="font-mono">{detail.dispense.externalNo || '—'}</span></div>
                      <div><span className="text-gray-500">商品：</span>{detail.dispense.productName || '—'}</div>
                      <div><span className="text-gray-500">SKU：</span><span className="font-mono text-xs">{detail.dispense.apiSku || '—'}</span></div>
                      <div>
                        <span className="text-gray-500">发卡数：</span>
                        {detail.dispense.delivered ?? '—'} / {detail.dispense.quantity ?? '—'}
                      </div>
                      <div>
                        <span className="text-gray-500">发卡状态：</span>
                        {detail.dispense.status ? DISPENSE_STATUS_LABELS[detail.dispense.status] || detail.dispense.status : '—'}
                      </div>
                      <div className="col-span-2"><span className="text-gray-500">领卡时间：</span>{fmt(detail.dispense.createdAt)}</div>
                    </div>
                    {!detail.dispense.found && (
                      <div className="text-xs text-amber-600">未找到对应的外部发卡记录（可能已被清理），以上仅为卡密上的归属标记。</div>
                    )}
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
