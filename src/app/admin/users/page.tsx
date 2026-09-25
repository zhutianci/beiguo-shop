'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Ban, CheckCircle, ChevronRight, Megaphone } from 'lucide-react'

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
  // 多选只针对当前页（翻页、换搜索词即清空）：跨页累积的勾选看不见，容易误把上一页的人也发了
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [creatingCampaign, setCreatingCampaign] = useState(false)

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
        setSelected(new Set())
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

  const selectedUsers = useMemo(() => users.filter((u) => selected.has(u.id)), [users, selected])
  const allChecked = users.length > 0 && users.every((u) => selected.has(u.id))
  const someChecked = selected.size > 0 && !allChecked
  const noEmailCount = selectedUsers.filter((u) => !u.email).length
  const disabledCount = selectedUsers.filter((u) => u.status !== 1).length

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleAll = () => {
    setSelected((prev) => (users.every((u) => prev.has(u.id)) ? new Set<number>() : new Set(users.map((u) => u.id))))
  }

  /**
   * 选中的用户 → 新建一个「手工指定」受众的营销草稿，直接跳过去排版。
   * 能不能真的收到（有无邮箱、是否退订、抑制名单、频控）由营销模块在预估与发送时判断，这里不重复过滤。
   */
  const sendMarketing = async () => {
    const userIds = Array.from(selected)
    if (userIds.length === 0) return
    setCreatingCampaign(true)
    try {
      const res = await fetch('/api/admin/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audience: { type: 'USERS', userIds } }),
      })
      const data = await res.json().catch(() => null)
      if (!data?.success || !data.data?.id) {
        alert(data?.error || '创建营销活动失败')
        return
      }
      router.push(`/admin/marketing/${data.data.id}`)
    } catch {
      alert('网络错误，创建营销活动失败')
    } finally {
      setCreatingCampaign(false)
    }
  }

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

          {/* 批量操作条（与卡密页同一范式） */}
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary-100 bg-primary-50/60 px-3 py-2">
              <span className="text-sm text-gray-700">已选 {selected.size} 人（本页）</span>
              <Button size="sm" onClick={sendMarketing} loading={creatingCampaign}>
                <Megaphone className="mr-1 h-3.5 w-3.5" />
                发营销邮件（{selected.size}）
              </Button>
              <Button variant="ghost" size="sm" disabled={creatingCampaign} onClick={() => setSelected(new Set())}>
                取消选择
              </Button>
              {(noEmailCount > 0 || disabledCount > 0) && (
                <span className="text-xs text-amber-600">
                  {noEmailCount > 0 && `${noEmailCount} 人没有邮箱`}
                  {noEmailCount > 0 && disabledCount > 0 && '、'}
                  {disabledCount > 0 && `${disabledCount} 人已禁用`}
                  ，不会收到；已退订或在抑制名单里的也会自动跳过
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-gray-400">加载中...</div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-gray-400">暂无用户</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-sm text-gray-500">
                    <th className="w-8 pb-3 pr-2">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        ref={(el) => {
                          if (el) el.indeterminate = someChecked
                        }}
                        onChange={toggleAll}
                        className="h-4 w-4 cursor-pointer"
                        title="全选本页"
                        aria-label="全选本页"
                      />
                    </th>
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
                      {/* 勾选框所在格子拦住点击冒泡：点歪一点也不会误跳详情页 */}
                      <td className="py-4 pr-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(user.id)}
                          onChange={() => toggleOne(user.id)}
                          className="h-4 w-4 cursor-pointer"
                          aria-label={`选择用户 ${user.id}`}
                        />
                      </td>
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
