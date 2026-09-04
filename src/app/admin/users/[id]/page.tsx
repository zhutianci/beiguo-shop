'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  ShoppingCart,
  Wallet,
  CreditCard,
  Gift,
  Link2,
  ShieldCheck,
} from 'lucide-react'

interface DetailUser {
  id: number
  email: string | null
  phone: string | null
  nickname: string | null
  avatar: string | null
  balance: string | number
  vipLevel: number
  role: string
  status: number
  referralCode: string | null
  createdAt: string
}

interface OrderRow {
  id: number
  orderNo: string
  productName: string
  quantity: number
  amount: string | number
  payMethod: string | null
  payStatus: string
  deliveryStatus: string
  createdAt: string
  paidAt: string | null
}

interface PaymentRow {
  id: number
  tradeNo: string | null
  orderNo: string | null
  payMethod: string
  amount: string | number
  status: number
  createdAt: string
}

interface BalanceLogRow {
  id: number
  delta: string | number
  balanceAfter: string | number
  type: string
  note: string | null
  createdAt: string
}

interface BoundAccountRow {
  id: number
  accountEmail: string
  platform: string
  label: string | null
  createdAt: string
}

interface Paged<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface UserDetail {
  user: DetailUser
  stats: {
    orderCount: number
    paidOrderCount: number
    deliveredOrderCount: number
    totalPaidAmount: number
    balance: number
    referralRewardTotal: number
    boundAccountCount: number
  }
  orders: Paged<OrderRow>
  payments: Paged<PaymentRow>
  balanceLogs: Paged<BalanceLogRow>
  boundAccounts: BoundAccountRow[]
  referral: {
    referralCode: string | null
    referralPriceCount: number
    referrerBasePriceCount: number
    rewardCount: number
    rewardTotal: number
  }
}

const PAY_STATUS: Record<string, { label: string; cls: string }> = {
  UNPAID: { label: '未支付', cls: 'bg-gray-100 text-gray-500' },
  PAID: { label: '已支付', cls: 'bg-green-100 text-green-700' },
  REFUNDED: { label: '已退款', cls: 'bg-amber-100 text-amber-700' },
}

const DELIVERY_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: '待处理', cls: 'bg-gray-100 text-gray-500' },
  PROCESSING: { label: '处理中', cls: 'bg-blue-100 text-blue-700' },
  DELIVERED: { label: '已交付', cls: 'bg-green-100 text-green-700' },
  CANCELLED: { label: '已取消', cls: 'bg-red-100 text-red-600' },
}

const PAY_METHOD: Record<string, string> = {
  ALIPAY: '支付宝',
  WECHAT: '微信',
  BALANCE: '余额',
}

const PAYMENT_STATUS: Record<number, { label: string; cls: string }> = {
  0: { label: '待支付', cls: 'bg-gray-100 text-gray-500' },
  1: { label: '成功', cls: 'bg-green-100 text-green-700' },
  2: { label: '失败', cls: 'bg-red-100 text-red-600' },
}

const BALANCE_TYPE: Record<string, string> = {
  REFERRAL: '内推返现',
  ADJUST: '管理员调整',
  WITHDRAW: '提现',
}

function fmt(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('zh-CN', { hour12: false })
}

function money(v: string | number | null | undefined) {
  return `¥${Number(v || 0).toFixed(2)}`
}

// 区块分页器
function Pager({
  page,
  totalPages,
  total,
  onChange,
}: {
  page: number
  totalPages: number
  total: number
  onChange: (p: number) => void
}) {
  if (total === 0) return null
  return (
    <div className="flex items-center justify-between pt-3">
      <span className="text-xs text-gray-500">
        共 {total} 条 · 第 {page} / {totalPages} 页
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(Math.max(page - 1, 1))}
        >
          上一页
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(Math.min(page + 1, totalPages))}
        >
          下一页
        </Button>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof ShoppingCart
  label: string
  value: string
  sub?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-gray-500">{label}</div>
          <div className="truncate text-xl font-semibold text-gray-900">{value}</div>
          {sub && <div className="text-xs text-gray-400">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const userId = params?.id ?? ''

  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [orderPage, setOrderPage] = useState(1)
  const [payPage, setPayPage] = useState(1)
  const [balancePage, setBalancePage] = useState(1)

  // 权限表单（只在首次加载时初始化，避免翻页时覆盖未保存的修改）
  const [form, setForm] = useState<{ role: string; status: number; vipLevel: number } | null>(null)
  const [saving, setSaving] = useState(false)

  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    try {
      const q = new URLSearchParams({
        orderPage: String(orderPage),
        payPage: String(payPage),
        balancePage: String(balancePage),
      })
      const res = await fetch(`/api/admin/users/${userId}/detail?${q}`, {
        signal: controller.signal,
      })
      const data = await res.json()
      if (abortRef.current !== controller) return
      if (data.success) {
        const d = data.data as UserDetail
        setDetail(d)
        setLoadError('')
        setForm((prev) =>
          prev ?? { role: d.user.role, status: d.user.status, vipLevel: d.user.vipLevel }
        )
      } else {
        setLoadError(data.error || '加载失败')
      }
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return
      setLoadError('网络错误，加载失败')
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }, [userId, orderPage, payPage, balancePage])

  useEffect(() => {
    load()
  }, [load])

  const handleSavePermission = async () => {
    if (!form) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: form.role,
          status: form.status,
          vipLevel: form.vipLevel,
        }),
      })
      const data = await res.json()
      if (!data.success) {
        alert(data.error || '保存失败')
        // 保存被拒时回滚表单，避免界面显示与实际权限不一致
        if (detail) {
          setForm({
            role: detail.user.role,
            status: detail.user.status,
            vipLevel: detail.user.vipLevel,
          })
        }
        return
      }
      const saved = data.data as { role: string; status: number; vipLevel: number }
      setForm({ role: saved.role, status: saved.status, vipLevel: saved.vipLevel })
      alert('权限已更新')
      await load()
    } finally {
      setSaving(false)
    }
  }

  if (loadError && !detail) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => router.push('/admin/users')}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回用户管理
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-gray-400">{loadError}</CardContent>
        </Card>
      </div>
    )
  }

  if (!detail) {
    return <div className="py-16 text-center text-gray-400">加载中...</div>
  }

  const { user, stats, orders, payments, balanceLogs, boundAccounts, referral } = detail
  const initial = (user.nickname || user.email || 'U').trim().charAt(0).toUpperCase()

  return (
    <div className="space-y-6">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/users" className="hover:text-gray-900">
          用户管理
        </Link>
        <span>/</span>
        <span className="text-gray-900">用户 #{user.id}</span>
      </div>

      {/* 用户头部 */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-100 bg-cover bg-center text-lg font-bold text-primary-700"
              style={user.avatar ? { backgroundImage: `url(${user.avatar})` } : undefined}
            >
              {user.avatar ? '' : initial}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">
                  {user.nickname || '未设置昵称'}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {user.role === 'ADMIN' ? '管理员' : '用户'}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.status === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {user.status === 1 ? '正常' : '禁用'}
                </span>
                {user.vipLevel > 0 && (
                  <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    VIP{user.vipLevel}
                  </span>
                )}
              </div>
              <div className="mt-1 space-x-3 text-sm text-gray-500">
                <span>{user.email || '无邮箱'}</span>
                {user.phone && <span>{user.phone}</span>}
                <span>注册于 {fmt(user.createdAt)}</span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回用户管理
          </Button>
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ShoppingCart}
          label="订单数"
          value={String(stats.orderCount)}
          sub={`已支付 ${stats.paidOrderCount} · 已交付 ${stats.deliveredOrderCount}`}
        />
        <StatCard
          icon={CreditCard}
          label="消费总额"
          value={money(stats.totalPaidAmount)}
          sub="已支付订单金额合计"
        />
        <StatCard icon={Wallet} label="账户余额" value={money(stats.balance)} />
        <StatCard
          icon={Gift}
          label="内推返现"
          value={money(stats.referralRewardTotal)}
          sub={`${referral.rewardCount} 笔已结算`}
        />
      </div>

      {/* 权限 */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-gray-400" />
          <CardTitle>权限设置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">角色</label>
              <select
                value={form?.role ?? user.role}
                onChange={(e) => setForm((f) => (f ? { ...f, role: e.target.value } : f))}
                className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="USER">用户</option>
                <option value="ADMIN">管理员</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">状态</label>
              <select
                value={String(form?.status ?? user.status)}
                onChange={(e) =>
                  setForm((f) => (f ? { ...f, status: Number(e.target.value) } : f))
                }
                className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="1">正常</option>
                <option value="0">禁用</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">VIP 等级</label>
              <input
                type="number"
                min={0}
                max={99}
                value={form?.vipLevel ?? user.vipLevel}
                onChange={(e) =>
                  setForm((f) =>
                    f ? { ...f, vipLevel: Math.max(0, Math.min(99, Number(e.target.value) || 0)) } : f
                  )
                }
                className="w-40 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <Button onClick={handleSavePermission} loading={saving}>
              保存权限
            </Button>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            禁用后该用户无法登录下单；系统会保留至少一个可用管理员账号。
          </p>
        </CardContent>
      </Card>

      {/* 订单 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>订单记录</CardTitle>
          <span className="text-sm text-gray-500">共 {orders.total} 条</span>
        </CardHeader>
        <CardContent>
          {orders.list.length === 0 ? (
            <div className="py-8 text-center text-gray-400">暂无订单</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2 pr-3 whitespace-nowrap">下单时间</th>
                    <th className="pb-2 pr-3">订单号</th>
                    <th className="pb-2 pr-3">商品</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">数量</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">金额</th>
                    <th className="pb-2 pr-3">支付</th>
                    <th className="pb-2 pr-3">发货</th>
                    <th className="pb-2 whitespace-nowrap">到账时间</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.list.map((o) => (
                    <tr key={o.id} className="border-b hover:bg-gray-50/60">
                      <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">
                        {fmt(o.createdAt)}
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs break-all">{o.orderNo}</td>
                      <td className="py-2 pr-3">{o.productName}</td>
                      <td className="py-2 pr-3">{o.quantity}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{money(o.amount)}</td>
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                            PAY_STATUS[o.payStatus]?.cls || 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {PAY_STATUS[o.payStatus]?.label || o.payStatus}
                        </span>
                        {o.payMethod && (
                          <span className="ml-1 text-xs text-gray-400">
                            {PAY_METHOD[o.payMethod] || o.payMethod}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                            DELIVERY_STATUS[o.deliveryStatus]?.cls || 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {DELIVERY_STATUS[o.deliveryStatus]?.label || o.deliveryStatus}
                        </span>
                      </td>
                      <td className="py-2 text-xs text-gray-500 whitespace-nowrap">
                        {fmt(o.paidAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pager
            page={orderPage}
            totalPages={orders.totalPages}
            total={orders.total}
            onChange={setOrderPage}
          />
        </CardContent>
      </Card>

      {/* 付款记录 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>付款记录</CardTitle>
          <span className="text-sm text-gray-500">共 {payments.total} 条</span>
        </CardHeader>
        <CardContent>
          {payments.list.length === 0 ? (
            <div className="py-8 text-center text-gray-400">暂无付款记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2 pr-3 whitespace-nowrap">时间</th>
                    <th className="pb-2 pr-3">订单号</th>
                    <th className="pb-2 pr-3">支付流水号</th>
                    <th className="pb-2 pr-3">方式</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">金额</th>
                    <th className="pb-2">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.list.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50/60">
                      <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">
                        {fmt(p.createdAt)}
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs break-all">{p.orderNo || '—'}</td>
                      <td className="py-2 pr-3 font-mono text-xs break-all">{p.tradeNo || '—'}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {PAY_METHOD[p.payMethod] || p.payMethod}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">{money(p.amount)}</td>
                      <td className="py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                            PAYMENT_STATUS[p.status]?.cls || 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {PAYMENT_STATUS[p.status]?.label || p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pager
            page={payPage}
            totalPages={payments.totalPages}
            total={payments.total}
            onChange={setPayPage}
          />
        </CardContent>
      </Card>

      {/* 余额流水 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>余额流水</CardTitle>
          <span className="text-sm text-gray-500">共 {balanceLogs.total} 条</span>
        </CardHeader>
        <CardContent>
          {balanceLogs.list.length === 0 ? (
            <div className="py-8 text-center text-gray-400">暂无余额变动</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2 pr-3 whitespace-nowrap">时间</th>
                    <th className="pb-2 pr-3">类型</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">变动</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">变动后余额</th>
                    <th className="pb-2">备注</th>
                  </tr>
                </thead>
                <tbody>
                  {balanceLogs.list.map((b) => {
                    const delta = Number(b.delta || 0)
                    return (
                      <tr key={b.id} className="border-b hover:bg-gray-50/60">
                        <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">
                          {fmt(b.createdAt)}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {BALANCE_TYPE[b.type] || b.type}
                        </td>
                        <td
                          className={`py-2 pr-3 font-medium whitespace-nowrap ${
                            delta >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {delta >= 0 ? '+' : '-'}
                          {Math.abs(delta).toFixed(2)}
                        </td>
                        <td className="py-2 pr-3 whitespace-nowrap">{money(b.balanceAfter)}</td>
                        <td className="py-2 text-gray-500">{b.note || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pager
            page={balancePage}
            totalPages={balanceLogs.totalPages}
            total={balanceLogs.total}
            onChange={setBalancePage}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* 绑定账户 */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Link2 className="h-5 w-5 text-gray-400" />
            <CardTitle>绑定账户（{boundAccounts.length}）</CardTitle>
          </CardHeader>
          <CardContent>
            {boundAccounts.length === 0 ? (
              <div className="py-8 text-center text-gray-400">未绑定订阅账户</div>
            ) : (
              <div className="space-y-2">
                {boundAccounts.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm text-gray-900">{a.accountEmail}</div>
                      <div className="text-xs text-gray-400">
                        {a.platform}
                        {a.label ? ` · ${a.label}` : ''}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">{fmt(a.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 内推信息 */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Gift className="h-5 w-5 text-gray-400" />
            <CardTitle>内推信息</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-gray-500">内推码</dt>
                <dd className="mt-1 font-mono text-gray-900">{referral.referralCode || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">返现合计</dt>
                <dd className="mt-1 font-medium text-gray-900">{money(referral.rewardTotal)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">专属价商品数</dt>
                <dd className="mt-1 text-gray-900">{referral.referralPriceCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">专属基础价条数</dt>
                <dd className="mt-1 text-gray-900">{referral.referrerBasePriceCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">返现笔数</dt>
                <dd className="mt-1 text-gray-900">{referral.rewardCount}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <Link href="/admin/referrals" className="text-sm text-primary-600 hover:underline">
                前往内推管理 →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading && <div className="pb-4 text-center text-xs text-gray-400">加载中...</div>}
    </div>
  )
}
