'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, ExternalLink, Trash2, Plus, GripVertical, X, FilePlus } from 'lucide-react'
import { rmbCapital } from '@/lib/rmb'

interface Receipt {
  id: number
  receiptNo: string
  token: string | null
  source: string
  claudeAccount: string | null
  subscriptionType: string | null
  payerTitle: string
  payee: string
  amount: number
  itemCount: number
  remark: string | null
  issuedAt: string
  createdAt: string
}

interface DiyItem {
  key: number
  label: string
  value: string
}

const SOURCE_LABELS: Record<string, { label: string; cls: string }> = {
  BUYER: { label: '买家提交', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  MANUAL: { label: '手动开具', cls: 'bg-purple-50 text-purple-700 border-purple-100' },
}

function fmt(s: string) {
  return new Date(s).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// datetime-local 需要「本地时区的 YYYY-MM-DDTHH:mm」，不能直接用 toISOString（那是 UTC）
function localDatetimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminReceiptsPage() {
  const [list, setList] = useState<Receipt[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<{ buyer: number; manual: number } | null>(null)
  const [keyword, setKeyword] = useState('')
  const [debounced, setDebounced] = useState('')
  const [source, setSource] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showDiy, setShowDiy] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // 搜索防抖
  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), 350)
    return () => clearTimeout(t)
  }, [keyword])

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setLoading(true)
    try {
      const q = new URLSearchParams({ page: String(page), pageSize: '20' })
      if (debounced) q.set('keyword', debounced)
      if (source) q.set('source', source)
      const res = await fetch(`/api/admin/receipts?${q}`, { signal: ac.signal })
      const data = await res.json()
      if (ac.signal.aborted) return
      if (data.success) {
        setList(data.data.list)
        setTotal(data.data.total)
        setTotalPages(data.data.totalPages || 1)
        setStats(data.data.stats)
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error(e)
    } finally {
      if (!ac.signal.aborted) setLoading(false)
    }
  }, [page, debounced, source])

  useEffect(() => {
    load()
  }, [load])

  // 筛选变更回到第 1 页，避免筛完停在空白页
  useEffect(() => {
    setPage(1)
  }, [debounced, source])

  const del = async (id: number) => {
    if (!confirm('删除该收据？买家提交的删除后可重新申请生成。')) return
    const res = await fetch(`/api/admin/receipts/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) load()
    else alert(data.error || '删除失败')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            收据管理（共 {total} 条）
            {stats && (
              <span className="ml-3 text-xs font-normal text-gray-500">
                买家提交 {stats.buyer} · 手动开具 {stats.manual}
              </span>
            )}
          </CardTitle>
          <Button onClick={() => setShowDiy(true)}>
            <FilePlus className="w-4 h-4 mr-1" /> 手动开具收据
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索账户/抬头/收据号..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">全部来源</option>
              <option value="BUYER">买家提交</option>
              <option value="MANUAL">手动开具</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无收据</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-800">
                  <thead>
                    <tr className="border-b text-left text-gray-500 text-xs">
                      <th className="pb-2 pr-3">收据号</th>
                      <th className="pb-2 pr-3">来源</th>
                      <th className="pb-2 pr-3">付款人(抬头)</th>
                      <th className="pb-2 pr-3">账户</th>
                      <th className="pb-2 pr-3">项目</th>
                      <th className="pb-2 pr-3">金额</th>
                      <th className="pb-2 pr-3">开具时间</th>
                      <th className="pb-2 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((r) => {
                      const s = SOURCE_LABELS[r.source] || { label: r.source, cls: 'bg-gray-100 text-gray-600 border-gray-200' }
                      return (
                        <tr key={r.id} className="border-b hover:bg-gray-50/60">
                          <td className="py-2 pr-3 font-mono text-xs">{r.receiptNo}</td>
                          <td className="py-2 pr-3">
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${s.cls}`}>{s.label}</span>
                          </td>
                          <td className="py-2 pr-3 font-medium">{r.payerTitle}</td>
                          <td className="py-2 pr-3 font-mono text-xs">{r.claudeAccount || '—'}</td>
                          <td className="py-2 pr-3 text-xs">
                            {r.subscriptionType || (r.itemCount > 0 ? `自定义 ${r.itemCount} 项` : '—')}
                          </td>
                          <td className="py-2 pr-3">¥{r.amount.toFixed(2)}</td>
                          <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">{fmt(r.issuedAt)}</td>
                          <td className="py-2 text-right whitespace-nowrap">
                            <a
                              href={`/receipt/${r.token}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-blue-600 hover:bg-blue-50"
                              title="查看收据"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> 查看
                            </a>
                            <button
                              onClick={() => del(r.id)}
                              className="ml-1 inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> 删除
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm">
                  <span className="text-gray-500">
                    第 {page} / {totalPages} 页
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      上一页
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {showDiy && (
        <DiyReceiptModal
          onClose={() => setShowDiy(false)}
          onDone={() => {
            setShowDiy(false)
            setPage(1)
            load()
          }}
        />
      )}
    </div>
  )
}

// ---------------- 手动开具（DIY）收据 ----------------

function DiyReceiptModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [receiptNo, setReceiptNo] = useState('')
  const [payerTitle, setPayerTitle] = useState('')
  const [account, setAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [issuedAt, setIssuedAt] = useState(() => localDatetimeValue(new Date()))
  const [remark, setRemark] = useState('')
  const [items, setItems] = useState<DiyItem[]>([
    { key: 1, label: '收款账户及支付方式', value: '' },
    { key: 2, label: '项目', value: '' },
  ])
  const seq = useRef(3)
  const dragIdx = useRef<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const amountNum = Number(amount)
  const amountValid = amount.trim() !== '' && isFinite(amountNum) && amountNum > 0

  const addItem = () => setItems((v) => [...v, { key: seq.current++, label: '', value: '' }])
  const removeItem = (key: number) => setItems((v) => v.filter((x) => x.key !== key))
  const patchItem = (key: number, patch: Partial<DiyItem>) =>
    setItems((v) => v.map((x) => (x.key === key ? { ...x, ...patch } : x)))

  // 拖动排序：原生 HTML5 DnD，不引第三方库
  const onDrop = (target: number) => {
    const from = dragIdx.current
    dragIdx.current = null
    setOverIdx(null)
    if (from === null || from === target) return
    setItems((v) => {
      const next = [...v]
      const [moved] = next.splice(from, 1)
      next.splice(target, 0, moved)
      return next
    })
  }

  const submit = async () => {
    if (!payerTitle.trim()) return setMsg('请填写付款人(抬头)')
    if (!amountValid) return setMsg('金额必须大于 0')
    const bad = items.find((it) => !it.label.trim() && it.value.trim())
    if (bad) return setMsg('有条目填了内容但没填名称')

    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptNo: receiptNo.trim() || null,
          payerTitle: payerTitle.trim(),
          account: account.trim() || null,
          amount: amountNum,
          issuedAt: issuedAt || null,
          items: items.filter((it) => it.label.trim()).map((it) => ({ label: it.label.trim(), value: it.value.trim() })),
          remark: remark.trim() || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        window.open(`/receipt/${data.data.token}`, '_blank')
        onDone()
      } else setMsg(data.error || '开具失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-8 rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">手动开具收据</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* 固定字段 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="收据号">
              <Input value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)} placeholder="留空自动生成" />
            </Field>
            <Field label="开具时间">
              <Input type="datetime-local" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} />
            </Field>
            <Field label="付款人(抬头)" required>
              <Input value={payerTitle} onChange={(e) => setPayerTitle(e.target.value)} placeholder="付款单位或个人名称" />
            </Field>
            <Field label="账户">
              <Input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="选填，展示在「账户」行" />
            </Field>
            <Field label="金额（元）" required>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </Field>
            <Field label="付款金额（大写）">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 min-h-[38px]">
                {amountValid ? rmbCapital(amountNum) : <span className="text-gray-400">按金额自动生成</span>}
              </div>
            </Field>
          </div>

          {/* DIY 条目 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">自定义条目</label>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" /> 添加条目
              </Button>
            </div>
            <p className="text-xs text-gray-400 mb-2">
              按住左侧手柄可拖动调整顺序，顺序即收据上的展示顺序。名称留空的条目不会被保存。
            </p>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div
                  key={it.key}
                  draggable
                  onDragStart={() => (dragIdx.current = i)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setOverIdx(i)
                  }}
                  onDragLeave={() => setOverIdx((v) => (v === i ? null : v))}
                  onDrop={(e) => {
                    e.preventDefault()
                    onDrop(i)
                  }}
                  onDragEnd={() => {
                    dragIdx.current = null
                    setOverIdx(null)
                  }}
                  className={`flex items-center gap-2 rounded-lg border bg-white p-2 ${
                    overIdx === i ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'
                  }`}
                >
                  <span className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing" title="拖动排序">
                    <GripVertical className="w-4 h-4" />
                  </span>
                  {/* Input 自带 w-full 外层 div，宽度控制放在包裹层上 */}
                  <div className="w-56 shrink-0">
                    <Input
                      value={it.label}
                      onChange={(e) => patchItem(it.key, { label: e.target.value })}
                      placeholder="条目名称，如：收款账户及支付方式"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Input
                      value={it.value}
                      onChange={(e) => patchItem(it.key, { value: e.target.value })}
                      placeholder="内容"
                    />
                  </div>
                  <button
                    onClick={() => removeItem(it.key)}
                    className="text-gray-300 hover:text-red-500 px-1"
                    title="删除该条目"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {items.length === 0 && <div className="text-sm text-gray-400 py-2">暂无自定义条目</div>}
            </div>
          </div>

          <Field label="备注">
            <Input value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="选填，展示在收据末行" />
          </Field>

          <p className="text-xs text-gray-400">
            手动开具的收据不挂订单，展示格式与买家提交的收据一致（含公章）。开具后会自动打开收据页面。
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          {msg && <span className="mr-auto text-sm text-red-600">{msg}</span>}
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={submit} loading={saving}>
            开具并预览
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
