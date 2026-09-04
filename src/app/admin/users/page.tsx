'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Ban, CheckCircle, ChevronRight } from 'lucide-react'

interface User {
  id: number
  email: string | null
  phone: string | null
  nickname: string | null
  balance: string | number
  vipLevel: number
  role: string
  status: number
  createdAt: string
  _count: { orders: number }
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const abortRef = useRef<AbortController | null>(null)

  // 搜索防抖
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    try {
      const q = new URLSearchParams({ page: String(page), pageSize: '20' })
      if (debouncedSearch) q.set('keyword', debouncedSearch)
      const res = await fetch(`/api/admin/users?${q}`, { signal: controller.signal })
      const data = await res.json()
      if (data.success && abortRef.current === controller) {
        setUsers(data.data.list)
        setTotal(data.data.total || 0)
        setTotalPages(data.data.totalPages || 1)
      }
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    load()
  }, [load])

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 1 ? 0 : 1
    const action = newStatus === 1 ? '启用' : '禁用'
    if (!confirm(`确定要${action}该用户吗？`)) return

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const data = await res.json()

    if (!data.success) {
      alert(data.error || '操作失败')
      return
    }

    load()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>用户列表</CardTitle>
          <span className="text-sm text-gray-500">
            共 <span className="font-semibold text-gray-800">{total}</span> 位用户
          </span>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="搜索：ID / 邮箱 / 昵称 / 手机号 / 内推码"
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400">加载中...</div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-gray-400">暂无用户</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-sm text-gray-500">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">邮箱</th>
                    <th className="pb-3 font-medium">昵称</th>
                    <th className="pb-3 font-medium">角色</th>
                    <th className="pb-3 font-medium">余额</th>
                    <th className="pb-3 font-medium">订单数</th>
                    <th className="pb-3 font-medium">状态</th>
                    <th className="pb-3 font-medium">注册时间</th>
                    <th className="pb-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                      className="cursor-pointer border-b border-gray-50 transition-colors hover:bg-gray-50"
                      title="查看用户详情"
                    >
                      <td className="py-4 text-gray-500">{user.id}</td>
                      <td className="py-4 font-medium text-gray-900">{user.email || '-'}</td>
                      <td className="py-4 text-gray-600">{user.nickname || '-'}</td>
                      <td className="py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            user.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {user.role === 'ADMIN' ? '管理员' : '用户'}
                        </span>
                      </td>
                      <td className="py-4 text-gray-900">¥{Number(user.balance).toFixed(2)}</td>
                      <td className="py-4 text-gray-600">{user._count.orders}</td>
                      <td className="py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            user.status === 1
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {user.status === 1 ? '正常' : '禁用'}
                        </span>
                      </td>
                      <td className="py-4 text-gray-500">
                        {new Date(user.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1">
                          {user.role !== 'ADMIN' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleStatus(user)
                              }}
                              className={`rounded p-1 ${
                                user.status === 1
                                  ? 'text-gray-400 hover:bg-red-50 hover:text-red-600'
                                  : 'text-gray-400 hover:bg-green-50 hover:text-green-600'
                              }`}
                              title={user.status === 1 ? '禁用用户' : '启用用户'}
                            >
                              {user.status === 1 ? (
                                <Ban className="h-4 w-4" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          <ChevronRight className="h-4 w-4 text-gray-300" />
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
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-gray-500">
                共 {total} 条 · 第 {page} / {totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
