'use client'

import { useEffect, useState } from 'react'
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
  referrerBasePrice?: string | number | null
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
  referrerBasePrice: '' as string | number,
  features: '',
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/products').then((r) => r.json()),
        fetch('/api/admin/categories').then((r) => r.json()),
      ])
      if (productsRes.success) setProducts(productsRes.data)
      if (categoriesRes.success) setCategories(categoriesRes.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      referrerBasePrice: product.referrerBasePrice != null ? Number(product.referrerBasePrice) : '',
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
          <CardTitle>商品列表</CardTitle>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            添加商品
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索商品..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : filteredProducts.length === 0 ? (
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
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-gray-50">
                      <td className="py-4 text-gray-500">{product.id}</td>
                      <td className="py-4 font-medium text-gray-900">{product.name}</td>
                      <td className="py-4 text-gray-600">{product.category.name}</td>
                      <td className="py-4 text-gray-900">¥{Number(product.price).toFixed(2)}</td>
                      <td className="py-4">
                        {product.deliveryType === 'AUTO' ? (
                          <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-blue-100 text-blue-700">自动发卡密</span>
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
                </select>
                {formData.deliveryType === 'AUTO' && (
                  <p className="mt-1 text-xs text-blue-600">
                    自动发货商品的「库存」由卡密数量自动管理；保存后到列表点
                    <KeyRound className="inline w-3 h-3 mx-0.5" />
                    录入卡密。
                  </p>
                )}
              </div>

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
