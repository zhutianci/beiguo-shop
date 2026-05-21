'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Ban, CheckCircle } from 'lucide-react'

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
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.success) setUsers(data.data.list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredUsers = users.filter(
    (u) =>
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.nickname && u.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
  )

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

    loadData()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索邮箱/昵称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无用户</div>
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
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-50">
                      <td className="py-4 text-gray-500">{user.id}</td>
                      <td className="py-4 font-medium text-gray-900">{user.email}</td>
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
                        {user.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleToggleStatus(user)}
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
