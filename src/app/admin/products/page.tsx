'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Search, KeyRound } from 'lucide-react'

interface Product {
  id: number
  categoryId: number
  name: string
  description: string | null
  price: string | number
  originalPrice: string | number | null
  stock: number
  sales: number
  sortOrder: number
  status: number
  deliveryType?: string
  smsService?: string | null
  smsCountry?: string | null
  smsMaxPrice?: string | number | null
  referrerBasePrice?: string | number | null
  apiSku?: string | null
  features: string | null
  category: { id: number; name: string }
}

interface Category {
  id: number
  name: string
}

const emptyForm = {
  categoryId: 0,
  name: '',
  description: '',
  price: 0,
  originalPrice: 0,
  stock: -1,
  sortOrder: 0,
  status: 1,
  deliveryType: 'MANUAL',
  smsService: '',
  smsCountry: '',
  smsMaxPrice: '' as string | number,
  referrerBasePrice: '' as string | number,
  apiSku: '',
  features: '',
}

const PAGE_SIZE = 20

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // 搜索防抖
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350)
    return () => clearTimeout(t)
  }, [searchTerm])

  // 商品列表：服务端分页 + 服务端搜索/分类筛选
  const loadData = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    try {
      const q = new URLSearchParams({ paged: '1', page: String(page), pageSize: String(PAGE_SIZE) })
      if (debouncedSearch) q.set('keyword', debouncedSearch)
      if (categoryFilter) q.set('categoryId', categoryFilter)
      const res = await fetch(`/api/admin/products?${q}`, { signal: controller.signal })
      const data = await res.json()
      if (data.success && abortRef.current === controller) {
        setProducts(data.data.list)
        setTotal(data.data.total || 0)
        setTotalPages(data.data.totalPages || 1)
      }
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }, [page, debouncedSearch, categoryFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 分类数量很少，一次性拉取即可（新建/编辑商品的下拉框依赖它）
  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data)
      })
      .catch(() => {})
  }, [])

  const handleEdit = (product: Product) => {
    setEditingId(product.id)
    setFormData({
      categoryId: product.categoryId,
      name: product.name,
      description: product.description || '',
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : 0,
      stock: product.stock,
      sortOrder: product.sortOrder,
      status: product.status,
      deliveryType: product.deliveryType || 'MANUAL',
      smsService: product.smsService || '',
      smsCountry: product.smsCountry || '',
      smsMaxPrice: product.smsMaxPrice != null ? Number(product.smsMaxPrice) : '',
      referrerBasePrice: product.referrerBasePrice != null ? Number(product.referrerBasePrice) : '',
      apiSku: product.apiSku || '',
      features: product.features || '',
    })
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingId(null)
    setFormData({
      ...emptyForm,
      categoryId: categories[0]?.id || 0,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.categoryId) {
      alert('请选择分类')
      return
    }
    if (!formData.name.trim()) {
      alert('请输入商品名称')
      return
    }

    setSubmitting(true)
    try {
      const url = editingId
        ? `/api/admin/products/${editingId}`
        : '/api/admin/products'
      const method = editingId ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        categoryId: Number(formData.categoryId),
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice) || null,
        stock: Number(formData.stock),
        sortOrder: Number(formData.sortOrder),
        status: Number(formData.status),
        smsMaxPrice: formData.smsMaxPrice === '' ? null : Number(formData.smsMaxPrice),
        referrerBasePrice: formData.referrerBasePrice === '' ? null : Number(formData.referrerBasePrice),
        description: formData.description || null,
        features: formData.features || null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!data.success) {
        alert(data.error || '操作失败')
        return
      }

      setShowModal(false)
      loadData()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除该商品吗？')) return

    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    const data = await res.json()

    if (!data.success) {
      alert(data.error || '删除失败')
      return
    }

    loadData()
  }

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === 1 ? 0 : 1
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const data = await res.json()
    if (!data.success) {
      alert(data.error || '操作失败')
      return
    }
    loadData()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>商品列表（共 {total} 条）</CardTitle>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            添加商品
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索商品..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900"
            >
              <option value="">全部分类</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无商品</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-sm text-gray-500">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">商品名称</th>
                    <th className="pb-3 font-medium">分类</th>
                    <th className="pb-3 font-medium">售价</th>
                    <th className="pb-3 font-medium">发货</th>
                    <th className="pb-3 font-medium">库存</th>
                    <th className="pb-3 font-medium">销量</th>
                    <th className="pb-3 font-medium">状态</th>
                    <th className="pb-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-50">
                      <td className="py-4 text-gray-500">{product.id}</td>
                      <td className="py-4 font-medium text-gray-900">{product.name}</td>
                      <td className="py-4 text-gray-600">{product.category.name}</td>
                      <td className="py-4 text-gray-900">¥{Number(product.price).toFixed(2)}</td>
                      <td className="py-4">
                        {product.deliveryType === 'AUTO' ? (
                          <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-blue-100 text-blue-700">自动发卡密</span>
                        ) : product.deliveryType === 'SMS' ? (
                          <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-teal-100 text-teal-700">短信接码</span>
                        ) : (
                          <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-gray-100 text-gray-600">手工发货</span>
                        )}
                      </td>
                      <td className="py-4 text-gray-600">
                        {product.deliveryType === 'AUTO' ? (
                          <span title="可用卡密数">{product.stock}</span>
                        ) : product.stock === -1 ? (
                          '无限'
                        ) : (
                          product.stock
                        )}
                      </td>
                      <td className="py-4 text-gray-600">{product.sales}</td>
                      <td className="py-4">
                        <button
                          onClick={() => handleToggleStatus(product)}
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            product.status === 1
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {product.status === 1 ? '上架' : '下架'}
                        </button>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          {product.deliveryType === 'AUTO' && (
                            <Link
                              href={`/admin/cardkeys?productId=${product.id}`}
                              className="rounded p-1 text-blue-500 hover:bg-blue-50"
                              title="管理卡密"
                            >
                              <KeyRound className="h-4 w-4" />
                            </Link>
                          )}
                          <button
                            onClick={() => handleEdit(product)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="mb-4 text-lg font-semibold">
              {editingId ? '编辑商品' : '添加商品'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">分类</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  required
                >
                  <option value={0}>请选择分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="商品名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入商品名称"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="售价"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  required
                />
                <Input
                  label="原价（选填）"
                  type="number"
                  step="0.01"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="库存（-1为无限）"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                />
                <Input
                  label="排序"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">商品描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  rows={3}
                  placeholder="请输入商品描述"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  特性列表（JSON 数组，如：[&quot;无限对话&quot;,&quot;优先访问&quot;]）
                </label>
                <textarea
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  rows={2}
                  placeholder='["特性1","特性2"]'
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">发货方式</label>
                <select
                  value={formData.deliveryType}
                  onChange={(e) => setFormData({ ...formData, deliveryType: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="MANUAL">手工发货（买家下单后联系客服处理）</option>
                  <option value="AUTO">自动发货（付款后自动发卡密）</option>
                  <option value="SMS">短信接码（付款后自动取号、收验证码）</option>
                </select>
                {formData.deliveryType === 'AUTO' && (
                  <p className="mt-1 text-xs text-blue-600">
                    自动发货商品的「库存」由卡密数量自动管理；保存后到列表点
                    <KeyRound className="inline w-3 h-3 mx-0.5" />
                    录入卡密。
                  </p>
                )}
              </div>

              {formData.deliveryType === 'AUTO' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">对外发卡 SKU（选填）</label>
                  <input
                    type="text"
                    value={formData.apiSku}
                    onChange={(e) => setFormData({ ...formData, apiSku: e.target.value })}
                    placeholder="外部站点按此编码调库存 API 领卡，如 claude-pro-1m"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    留空则该商品不对外共享库存。多个站点用同一 SKU 即共用这批卡密，付款先到先得，绝不重复发卡。仅允许字母、数字和 _ . - :
                  </p>
                </div>
              )}

              {formData.deliveryType === 'SMS' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">hero-sms 服务代码</label>
                    <input
                      type="text"
                      value={formData.smsService}
                      onChange={(e) => setFormData({ ...formData, smsService: e.target.value })}
                      placeholder="如 OpenAI 的 service code"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">hero-sms 国家/卡类代码</label>
                    <input
                      type="text"
                      value={formData.smsCountry}
                      onChange={(e) => setFormData({ ...formData, smsCountry: e.target.value })}
                      placeholder="如 美国物理卡的 country code"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">最高价 maxPrice（选填）</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.smsMaxPrice}
                      onChange={(e) => setFormData({ ...formData, smsMaxPrice: e.target.value })}
                      placeholder="留空=不限价；填后只接受不超过此价的号码"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                  <p className="col-span-2 text-xs text-blue-600">
                    付款成功后系统自动向 hero-sms 取号（带上 maxPrice 控成本）并展示给买家；收到验证码自动完成订单，超时未收到自动取消并标记待退款。代码/价格可在 hero-sms 后台查到。
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">推广人默认基础价（进货价，选填）</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.referrerBasePrice}
                  onChange={(e) => setFormData({ ...formData, referrerBasePrice: e.target.value })}
                  placeholder="留空则用网站售价作为推广人基础价"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                <p className="mt-1 text-xs text-gray-400">
                  推广人收益 = 他设的专属价 − 基础价。可在「内推管理」为重量级推广人单独设更低基础价。不影响网站售价。
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value={1}>上架</option>
                  <option value={0}>下架</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>
                  取消
                </Button>
                <Button type="submit" loading={submitting}>
                  保存
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
