'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus, Pencil, Trash2, Search, Pin, Star, Lock, Eye, EyeOff, ExternalLink, X, MessageCircle, ThumbsUp,
} from 'lucide-react'

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  sortOrder: number
  status: number
  postCount: number
}
interface AdminPost {
  id: number
  title: string
  authorName: string
  isMember: boolean
  category: { name: string; icon: string | null } | null
  pinned: boolean
  featured: boolean
  locked: boolean
  status: number
  views: number
  likeCount: number
  commentCount: number
  createdAt: string
}

export default function AdminForumPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<Category> | null>(null)
  const [saving, setSaving] = useState(false)
  const [catErr, setCatErr] = useState<string | null>(null)

  const loadCategories = async () => {
    const res = await fetch('/api/admin/forum/categories')
    const data = await res.json()
    if (data.success) setCategories(data.data)
  }
  const loadPosts = async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ pageSize: '50' })
      if (keyword) q.set('keyword', keyword)
      if (statusFilter) q.set('status', statusFilter)
      const res = await fetch(`/api/admin/forum/posts?${q}`)
      const data = await res.json()
      if (data.success) setPosts(data.data.list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
    loadPosts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveCategory = async () => {
    if (!editing) return
    setCatErr(null)
    setSaving(true)
    try {
      const isNew = !editing.id
      const url = isNew ? '/api/admin/forum/categories' : `/api/admin/forum/categories/${editing.id}`
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editing.name,
          slug: editing.slug,
          description: editing.description || null,
          icon: editing.icon || null,
          color: editing.color || null,
          sortOrder: editing.sortOrder ?? 0,
          ...(isNew ? {} : { status: editing.status }),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setEditing(null)
        loadCategories()
      } else {
        setCatErr(data.error || '保存失败')
      }
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (c: Category) => {
    if (!confirm(`删除板块「${c.name}」？`)) return
    const res = await fetch(`/api/admin/forum/categories/${c.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) loadCategories()
    else alert(data.error || '删除失败')
  }

  const postAction = async (id: number, patch: Record<string, unknown>) => {
    const res = await fetch(`/api/forum/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json()
    if (data.success) loadPosts()
    else alert(data.error || '操作失败')
  }
  const deletePost = async (id: number) => {
    if (!confirm('确定删除该帖子？')) return
    const res = await fetch(`/api/forum/posts/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) loadPosts()
    else alert(data.error || '删除失败')
  }

  return (
    <div className="space-y-6">
      {/* 板块管理 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>板块管理</CardTitle>
          <Button size="sm" onClick={() => setEditing({ sortOrder: categories.length + 1, status: 1, icon: '💬' })}>
            <Plus className="w-4 h-4 mr-1" /> 新建板块
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-800">
              <thead>
                <tr className="border-b text-left text-gray-500 text-xs">
                  <th className="pb-2 pr-3">排序</th>
                  <th className="pb-2 pr-3">板块</th>
                  <th className="pb-2 pr-3">slug</th>
                  <th className="pb-2 pr-3">帖子数</th>
                  <th className="pb-2 pr-3">状态</th>
                  <th className="pb-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50/60">
                    <td className="py-2 pr-3 text-gray-400">{c.sortOrder}</td>
                    <td className="py-2 pr-3 font-medium">{c.icon} {c.name}<div className="text-xs text-gray-400 font-normal">{c.description}</div></td>
                    <td className="py-2 pr-3 font-mono text-xs">{c.slug}</td>
                    <td className="py-2 pr-3">{c.postCount}</td>
                    <td className="py-2 pr-3">
                      {c.status === 1 ? (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-green-100 text-green-700">启用</span>
                      ) : (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-gray-100 text-gray-500">停用</span>
                      )}
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <button onClick={() => setEditing(c)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-blue-600 hover:bg-blue-50">
                        <Pencil className="w-3 h-3" /> 编辑
                      </button>
                      <button onClick={() => deleteCategory(c)} className="ml-1 inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3 h-3" /> 删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 帖子管理 */}
      <Card>
        <CardHeader>
          <CardTitle>帖子管理（共 {posts.length} 条）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索标题/作者..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadPosts()}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900"
            >
              <option value="">全部状态</option>
              <option value="1">正常</option>
              <option value="0">已隐藏</option>
            </select>
            <Button variant="outline" onClick={loadPosts}>
              <Search className="w-4 h-4 mr-1" /> 查询
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无帖子</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="border-b text-left text-gray-500 text-xs">
                    <th className="pb-2 pr-3">标题</th>
                    <th className="pb-2 pr-3">作者</th>
                    <th className="pb-2 pr-3">板块</th>
                    <th className="pb-2 pr-3">数据</th>
                    <th className="pb-2 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p.id} className={`border-b hover:bg-gray-50/60 ${p.status === 0 ? 'opacity-50' : ''}`}>
                      <td className="py-2 pr-3 max-w-[280px]">
                        <div className="flex items-center gap-1.5">
                          {p.pinned && <Pin className="w-3 h-3 text-red-500" />}
                          {p.featured && <Star className="w-3 h-3 text-amber-500" />}
                          {p.locked && <Lock className="w-3 h-3 text-gray-400" />}
                          <span className="font-medium truncate">{p.title}</span>
                        </div>
                      </td>
                      <td className="py-2 pr-3">{p.authorName}{!p.isMember && <span className="text-xs text-gray-400">·匿名</span>}</td>
                      <td className="py-2 pr-3 text-xs">{p.category?.icon} {p.category?.name}</td>
                      <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">
                        <span className="inline-flex items-center gap-0.5 mr-2"><Eye className="w-3 h-3" />{p.views}</span>
                        <span className="inline-flex items-center gap-0.5 mr-2"><ThumbsUp className="w-3 h-3" />{p.likeCount}</span>
                        <span className="inline-flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{p.commentCount}</span>
                      </td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <a href={`/forum/${p.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs px-1.5 py-1 rounded text-gray-500 hover:bg-gray-100" title="查看">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button onClick={() => postAction(p.id, { pinned: !p.pinned })} className={`ml-0.5 text-xs px-1.5 py-1 rounded hover:bg-gray-100 ${p.pinned ? 'text-red-500' : 'text-gray-500'}`} title="置顶"><Pin className="w-3.5 h-3.5" /></button>
                        <button onClick={() => postAction(p.id, { featured: !p.featured })} className={`text-xs px-1.5 py-1 rounded hover:bg-gray-100 ${p.featured ? 'text-amber-500' : 'text-gray-500'}`} title="加精"><Star className="w-3.5 h-3.5" /></button>
                        <button onClick={() => postAction(p.id, { locked: !p.locked })} className={`text-xs px-1.5 py-1 rounded hover:bg-gray-100 ${p.locked ? 'text-gray-800' : 'text-gray-500'}`} title="锁帖"><Lock className="w-3.5 h-3.5" /></button>
                        <button onClick={() => postAction(p.id, { status: p.status === 1 ? 0 : 1 })} className="text-xs px-1.5 py-1 rounded text-gray-500 hover:bg-gray-100" title={p.status === 1 ? '隐藏' : '恢复'}>{p.status === 1 ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                        <button onClick={() => deletePost(p.id)} className="text-xs px-1.5 py-1 rounded text-red-600 hover:bg-red-50" title="删除"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 板块编辑弹窗 */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !saving && setEditing(null)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">{editing.id ? '编辑板块' : '新建板块'}</h3>
              <button onClick={() => setEditing(null)} className="p-1 rounded hover:bg-gray-100 text-gray-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-[80px_1fr] gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">图标</label>
                  <input value={editing.icon || ''} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="💬" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-center" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">名称</label>
                  <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">slug（英文唯一标识，建后不建议改）</label>
                <input value={editing.slug || ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} disabled={!!editing.id} placeholder="feedback" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 font-mono text-sm disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">描述</label>
                <input value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">排序</label>
                  <input type="number" value={editing.sortOrder ?? 0} onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900" />
                </div>
                {editing.id != null && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">状态</label>
                    <select value={editing.status ?? 1} onChange={(e) => setEditing({ ...editing, status: parseInt(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900">
                      <option value={1}>启用</option>
                      <option value={0}>停用</option>
                    </select>
                  </div>
                )}
              </div>
              {catErr && <p className="text-sm text-red-600">{catErr}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>取消</Button>
                <Button onClick={saveCategory} loading={saving}>保存</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
