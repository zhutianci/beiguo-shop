'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Category {
  id: number
  name: string
  icon: string | null
  sortOrder: number
  status: number
  _count: { products: number }
}

const emptyForm = {
  name: '',
  icon: '',
  sortOrder: 0,
  status: 1,
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      if (data.success) setCategories(data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      icon: category.icon || '',
      sortOrder: category.sortOrder,
      status: category.status,
    })
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingId(null)
    setFormData(emptyForm)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('请输入分类名称')
      return
    }

    setSubmitting(true)
    try {
      const url = editingId
        ? `/api/admin/categories/${editingId}`
        : '/api/admin/categories'
      const method = editingId ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        sortOrder: Number(formData.sortOrder),
        status: Number(formData.status),
        icon: formData.icon || null,
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

  const handleDelete = async (category: Category) => {
    if (category._count.products > 0) {
      alert(`该分类下还有 ${category._count.products} 个商品，无法删除`)
      return
    }
    if (!confirm('确定要删除该分类吗？')) return

    const res = await fetch(`/api/admin/categories/${category.id}`, {
      method: 'DELETE',
    })
    const data = await res.json()

    if (!data.success) {
      alert(data.error || '删除失败')
      return
    }

    loadData()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>分类列表</CardTitle>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            添加分类
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无分类</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-sm text-gray-500">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">分类名称</th>
                    <th className="pb-3 font-medium">排序</th>
                    <th className="pb-3 font-medium">商品数</th>
                    <th className="pb-3 font-medium">状态</th>
                    <th className="pb-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {categories.map((category) => (
                    <tr key={category.id} className="border-b border-gray-50">
                      <td className="py-4 text-gray-500">{category.id}</td>
                      <td className="py-4 font-medium text-gray-900">{category.name}</td>
                      <td className="py-4 text-gray-600">{category.sortOrder}</td>
                      <td className="py-4 text-gray-600">{category._count.products}</td>
                      <td className="py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            category.status === 1
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {category.status === 1 ? '启用' : '禁用'}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
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
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">
              {editingId ? '编辑分类' : '添加分类'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="分类名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入分类名称"
                required
              />
              <Input
                label="图标（选填）"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="emoji 或图片 URL"
              />
              <Input
                label="排序"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                placeholder="数字越小越靠前"
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
                >
                  <option value={1}>启用</option>
                  <option value={0}>禁用</option>
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
