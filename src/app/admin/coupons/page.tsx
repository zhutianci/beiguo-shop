'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, Loader2, Plus, Search, Ticket } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * 优惠券管理。列表分页与筛选照抄站内其他后台页的范式，不另起一套。
 *
 * 【为什么「结束活动」要单独确认】它会把所有未使用的券作废掉，是不可撤销的。
 * 已锁定（挂在待支付订单上）和已核销的券不动 —— 前者的订单金额已经是优惠后的，
 * 作废掉会让买家按优惠价付了款却没有核销记录，对账对不上。
 */

interface CouponRow {
  id: number
  code: string
  name: string
  kind: string
  minAmount: number
  discount: number
  label: string
  productIds: number[]
  total: number
  claimed: number
  remaining: number
  startAt: string | null
  endAt: string | null
  forever: boolean
  status: string
  note: string | null
  createdAt: string
  stats: { available: number; locked: number; used: number; expired: number; void: number }
  claimPath: string
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '发放中',
  PAUSED: '已暂停',
  ENDED: '已结束',
}
const STATUS_CLS: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PAUSED: 'bg-amber-50 text-amber-700 border-amber-200',
  ENDED: 'bg-gray-100 text-gray-500 border-gray-200',
}

export default function AdminCouponsPage() {
  const [list, setList] = useState<CouponRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ page: String(page) })
      if (keyword.trim()) q.set('keyword', keyword.trim())
      if (status) q.set('status', status)
      const res = await fetch(`/api/admin/coupons?${q}`)
      const d = await res.json()
      if (d.success) {
        setList(d.data.list)
        setTotal(d.data.total)
        setTotalPages(d.data.totalPages)
      }
    } finally {
      setLoading(false)
    }
  }, [page, keyword, status])

  useEffect(() => {
    load()
  }, [load])

  const patch = async (id: number, body: Record<string, unknown>, confirmText?: string) => {
    if (confirmText && !confirm(confirmText)) return
    const res = await fetch('/api/admin/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...body }),
    })
    const d = await res.json()
    if (!d.success) return alert(d.error || '操作失败')
    if (d.message) alert(d.message)
    load()
  }

  const copyLink = async (row: CouponRow) => {
    const url = `${window.location.origin}${row.claimPath}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(row.id)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      prompt('复制这条链接：', url)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              优惠券管理
            </CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              建一批券会生成一条共享领取链接，谁点谁领。每个 IP / 账户 / 浏览器各限领 1 张。
              券与内推专属价不叠加，系统自动取对买家更便宜的那个。
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            共 <span className="font-semibold text-gray-800">{total}</span> 批
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (setPage(1), load())}
                placeholder="搜活动名或短码"
                className="w-56 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">全部状态</option>
              <option value="ACTIVE">发放中</option>
              <option value="PAUSED">已暂停</option>
              <option value="ENDED">已结束</option>
            </select>
            <Button size="sm" onClick={() => setCreating(true)} className="ml-auto">
              <Plus className="mr-1 h-4 w-4" />
              建一批券
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">还没有优惠券，点右上角建一批。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="px-3 py-2">活动</th>
                    <th className="px-3 py-2">规则</th>
                    <th className="px-3 py-2">领取情况</th>
                    <th className="px-3 py-2">核销</th>
                    <th className="px-3 py-2">有效期</th>
                    <th className="px-3 py-2">状态</th>
                    <th className="px-3 py-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 align-top">
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-900">{r.name}</div>
                        <div className="mt-0.5 font-mono text-xs text-gray-400">{r.code}</div>
                        {r.note && <div className="mt-1 max-w-[200px] text-xs text-gray-400">{r.note}</div>}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-gray-700">{r.label}</div>
                        {r.productIds.length > 0 && (
                          <div className="mt-0.5 text-xs text-gray-400">限商品 {r.productIds.join(', ')}</div>
                        )}
                      </td>
                      <td className="px-3 py-3 tabular-nums">
                        <span className="font-medium text-gray-800">{r.claimed}</span>
                        <span className="text-gray-400"> / {r.total}</span>
                        <div className="mt-0.5 text-xs text-gray-400">剩 {r.remaining}</div>
                      </td>
                      <td className="px-3 py-3 text-xs tabular-nums text-gray-500">
                        <div>已用 {r.stats.used}</div>
                        <div>占用中 {r.stats.locked}</div>
                        <div>未用 {r.stats.available}</div>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500">
                        {r.forever ? (
                          <span className="text-emerald-600">长期有效</span>
                        ) : (
                          new Date(r.endAt as string).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded border px-2 py-0.5 text-xs ${STATUS_CLS[r.status]}`}>
                          {STATUS_LABEL[r.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => copyLink(r)}>
                            {copied === r.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                            <span className="ml-1">{copied === r.id ? '已复制' : '领取链接'}</span>
                          </Button>
                          {r.status === 'ACTIVE' && (
                            <Button size="sm" variant="outline" onClick={() => patch(r.id, { status: 'PAUSED' })}>
                              暂停发放
                            </Button>
                          )}
                          {r.status === 'PAUSED' && (
                            <Button size="sm" variant="outline" onClick={() => patch(r.id, { status: 'ACTIVE' })}>
                              恢复发放
                            </Button>
                          )}
                          {r.status !== 'ENDED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                patch(
                                  r.id,
                                  { status: 'ENDED' },
                                  `确定结束「${r.name}」？\n\n会把买家手里还没用的 ${r.stats.available} 张一并作废，不可撤销。\n已经挂在待支付订单上的 ${r.stats.locked} 张与已核销的 ${r.stats.used} 张不受影响。`
                                )
                              }
                            >
                              结束活动
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const n = prompt('追加发行多少张？（只能加不能减）')
                              const v = Number(n)
                              if (!n || !Number.isInteger(v) || v < 1) return
                              patch(r.id, { addTotal: v })
                            }}
                          >
                            加量
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                上一页
              </Button>
              <span className="text-sm tabular-nums text-gray-500">
                {page} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {creating && (
        <CreateModal
          onClose={() => setCreating(false)}
          onDone={() => {
            setCreating(false)
            setPage(1)
            load()
          }}
        />
      )}
    </div>
  )
}

function CreateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [kind, setKind] = useState<'THRESHOLD' | 'PRODUCT'>('THRESHOLD')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [minAmount, setMinAmount] = useState('0')
  const [discount, setDiscount] = useState('')
  const [productIds, setProductIds] = useState('')
  const [count, setCount] = useState('100')
  const [endAt, setEndAt] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toLowerCase(),
          name: name.trim(),
          kind,
          minAmount: kind === 'THRESHOLD' ? Number(minAmount || 0) : 0,
          discount: Number(discount),
          productIds:
            kind === 'PRODUCT'
              ? productIds
                  .split(/[,，\s]+/)
                  .map((s) => Number(s.trim()))
                  .filter((n) => Number.isInteger(n) && n > 0)
              : undefined,
          total: Number(count),
          // datetime-local 给的是本地时间字符串，转成 ISO 再传，避免时区歧义
          endAt: endAt ? new Date(endAt).toISOString() : null,
          note: note.trim() || undefined,
        }),
      })
      const d = await res.json()
      if (!d.success) return alert(d.error || '创建失败')
      alert(d.message)
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-6">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold">建一批优惠券</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">券类型</label>
            <div className="flex gap-2">
              {(
                [
                  { k: 'THRESHOLD', label: '满减券', hint: '门槛填 0 即无门槛' },
                  { k: 'PRODUCT', label: '商品券', hint: '只能用于指定商品' },
                ] as const
              ).map((t) => (
                <button
                  key={t.k}
                  type="button"
                  onClick={() => setKind(t.k)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm ${
                    kind === t.k ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                  }`}
                >
                  <div className="font-medium">{t.label}</div>
                  <div className="text-xs text-gray-400">{t.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <Input label="活动名称" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          <div>
            <Input
              label="领取短码（进 URL）"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="如 spring100"
              maxLength={32}
            />
            <p className="mt-1 text-xs text-gray-400">
              只能用小写字母、数字与连字符。领取链接会是 /coupon/{code || '你填的短码'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {kind === 'THRESHOLD' && (
              <Input
                label="满多少（0 = 无门槛）"
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
            )}
            <Input
              label={kind === 'THRESHOLD' ? '减多少' : '优惠金额'}
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>

          {kind === 'PRODUCT' && (
            <div>
              <Input
                label="限定商品 id（逗号分隔）"
                value={productIds}
                onChange={(e) => setProductIds(e.target.value)}
                placeholder="如 3,7,12"
              />
              <p className="mt-1 text-xs text-gray-400">在「商品管理」里能看到每个商品的 id</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label="发行数量" type="number" value={count} onChange={(e) => setCount(e.target.value)} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">截止时间</label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
              />
              <p className="mt-1 text-xs text-gray-400">留空 = 长期有效</p>
            </div>
          </div>

          <Input label="备注（仅后台可见）" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />

          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-700">
            券面额会被限制在「不把订单金额打到 0」的范围内 —— 站内收款按唯一金额匹配到账，
            0 元订单没有「到账」这件事，会永远停在待支付。所以无门槛券建议设得低于最便宜的商品价。
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={submit} disabled={saving || !code.trim() || !name.trim() || !discount}>
            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            创建
          </Button>
        </div>
      </div>
    </div>
  )
}
