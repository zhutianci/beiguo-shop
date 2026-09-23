'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Eye, X, Download, Plus, AlertCircle } from 'lucide-react'
import { normalizeTaxNumber, TAX_NUMBER_MAX_LEN } from '@/lib/tax-number'

interface InvoiceRow {
  /** 手动录入的站外发票没有订单，这里是 null */
  externalOrderId: number | null
  invoiceId: number | null
  invoiceNo: string | null
  claudeAccount: string
  subscriptionType: string
  xianyuNickname: string | null
  orderStartDate: string | null
  orderExpireDate: string | null
  title: string | null
  taxNumber: string | null
  address: string | null
  phone: string | null
  bankName: string | null
  bankAccount: string | null
  email: string | null
  showAiWording: boolean | null
  sellingPrice: number | null
  invoiceAmount: number | null
  taxFee: number | null
  status: string
  payStatus: string
  paidAt: string | null
  submittedAt: string | null
  issuedAt: string | null
  createdAt: string
  /** true = 管理员手动录入的站外客户发票（没有订单） */
  manual?: boolean
}

interface Totals {
  count: Record<string, number>
  manualTotal: number
  paidTaxFee: number
  issuedInvoiceAmount: number
}



const STATUS_LABELS: Record<string, string> = {
  UNAPPLIED: '未开发票',
  AWAIT_PAY: '待支付税费',
  SUBMITTED: '已提交开票',
  ISSUED: '已开具',
  CANNOT: '不可开据',
}
const STATUS_STYLES: Record<string, string> = {
  UNAPPLIED: 'bg-gray-100 text-gray-600',
  AWAIT_PAY: 'bg-amber-100 text-amber-700',
  SUBMITTED: 'bg-cyan-100 text-cyan-700',
  ISSUED: 'bg-green-100 text-green-700',
  CANNOT: 'bg-gray-200 text-gray-500',
}
const STATUS_OPTIONS = ['UNAPPLIED', 'AWAIT_PAY', 'SUBMITTED', 'ISSUED', 'CANNOT']
/* 手动录入的发票没有订单，「未开发票」在 by-order 那边等价于删除记录，不放进下拉 */
const MANUAL_STATUS_OPTIONS = ['SUBMITTED', 'ISSUED', 'CANNOT']

/**
 * 税号去空格后仍超长 → 导出前必须人工核实（这一批会被税局整批退回）。
 * 【必须用 lib/tax-number 那一份】JS 的 \s 不含零宽字符，自己写正则会和服务端算出不同的位数。
 */
function longTax(v: string | null) {
  return !!v && normalizeTaxNumber(v).length > TAX_NUMBER_MAX_LEN
}

function fmt(s: string) {
  return new Date(s).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
}
function money(n: number | null) {
  return n == null ? '-' : `¥${Number(n).toFixed(2)}`
}

const PAGE_SIZE = 20

export default function AdminInvoicesPage() {
  const [list, setList] = useState<InvoiceRow[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('SUBMITTED')
  /** 'MANUAL' = 只看手动录入的站外发票（与状态筛选互斥） */
  const [sourceFilter, setSourceFilter] = useState('')
  const [creating, setCreating] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportTip, setExportTip] = useState<{ ok: boolean; text: string } | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<InvoiceRow | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // 搜索防抖
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 350)
    return () => clearTimeout(t)
  }, [keyword])

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    try {
      const q = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (debouncedKeyword) q.set('keyword', debouncedKeyword)
      // 「手动开票」是独立视图（以发票为主表），不叠加状态筛选
      if (sourceFilter) q.set('source', sourceFilter)
      else if (statusFilter) q.set('status', statusFilter)
      const res = await fetch(`/api/admin/invoices?${q}`, { signal: controller.signal })
      const data = await res.json()
      if (data.success && abortRef.current === controller) {
        setList(data.data.list)
        setTotals(data.data.totals)
        setTotal(data.data.total || 0)
        setTotalPages(data.data.totalPages || 1)
      }
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }, [page, debouncedKeyword, statusFilter, sourceFilter])

  useEffect(() => {
    load()
  }, [load])

  /*
   * 导出当前所有待开发票（status=SUBMITTED 且税费已到账）为税局官方批量导入模板。
   *
   * 【不能照抄本页其它请求的 `const data = await res.json()`】成功时服务端返回的是
   * xlsx 二进制，json() 会直接抛。所以先看 res.ok：成功走 blob 下载，
   * 失败才按 JSON 解析错误信息 —— 服务端出错时确实返回 JSON。
   */
  const exportPending = async () => {
    setExporting(true)
    setExportTip(null)
    try {
      const res = await fetch('/api/admin/invoices/export')
      if (!res.ok) {
        const d = await res.json().catch(() => null)
        setExportTip({ ok: false, text: d?.error || `导出失败（HTTP ${res.status}）` })
        return
      }
      const blob = await res.blob()
      // 文件名由服务端用 RFC 5987 给出（含中文），这里解出来；解不出就用一个兜底名
      const cd = res.headers.get('Content-Disposition') || ''
      const m = cd.match(/filename\*=UTF-8''([^;]+)/i)
      const filename = m ? decodeURIComponent(m[1]) : `待开发票批量导入.xlsx`

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      // 立刻 revoke 在部分浏览器上会打断尚未开始的下载，挪到下一轮事件循环
      setTimeout(() => URL.revokeObjectURL(url), 10_000)

      const n = res.headers.get('X-Invoice-Count')
      setExportTip({ ok: true, text: `已导出 ${n || ''} 张待开发票，请用该文件在开票系统里批量导入` })
    } catch {
      setExportTip({ ok: false, text: '网络错误，请重试' })
    } finally {
      setExporting(false)
      setTimeout(() => setExportTip(null), 8000)
    }
  }

  /**
   * 改状态。两条路：
   *   · 挂订单的走 by-order（旧接口，会在需要时顺带建/删发票记录）
   *   · 手动录入的没有订单，只能按发票 id 改（PATCH /api/admin/invoices/[id]）
   * 手动录入的也不提供「未开发票」这个目标态 —— by-order 把 UNAPPLIED 实现成
   * 「删掉发票记录」，对一条凭空录入的记录来说那等于删除，不该藏在一个下拉里。
   */
  const setStatus = async (row: InvoiceRow, status: string) => {
    const res = row.manual
      ? await fetch(`/api/admin/invoices/${row.invoiceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
      : await fetch(`/api/admin/invoices/by-order/${row.externalOrderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
    const data = await res.json()
    if (data.success) {
      load()
      setDetail(null)
    } else alert(data.error || '操作失败')
  }

  const removeManual = async (row: InvoiceRow) => {
    if (!row.invoiceId) return
    if (!confirm(`删除手动录入的发票「${row.title || row.invoiceNo}」？此操作不可恢复。`)) return
    const res = await fetch(`/api/admin/invoices/${row.invoiceId}`, { method: 'DELETE' })
    const d = await res.json()
    if (d.success) {
      load()
      setDetail(null)
    } else alert(d.error || '删除失败')
  }

  return (
    <div className="space-y-6">
      {totals && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
          {STATUS_OPTIONS.map((s) => (
            <div key={s} className="rounded-xl border border-gray-100 bg-white p-3">
              <div className="text-xs text-gray-500">{STATUS_LABELS[s]}</div>
              <div className="text-xl font-semibold text-gray-900">{totals.count[s] || 0}</div>
            </div>
          ))}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
            <div className="text-xs text-indigo-600">手动录入（站外）</div>
            <div className="text-xl font-semibold text-indigo-800">{totals.manualTotal || 0}</div>
          </div>
        </div>
      )}
      {totals && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
            <div className="text-xs text-amber-700">已支付税费合计（报价×0.06）</div>
            <div className="text-xl font-semibold text-amber-800">¥{totals.paidTaxFee.toFixed(2)}</div>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50 p-3">
            <div className="text-xs text-green-700">已开具发票金额合计（含税，报价×1.06）</div>
            <div className="text-xl font-semibold text-green-800">¥{totals.issuedInvoiceAmount.toFixed(2)}</div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>发票管理（共 {total} 条 · 同步全部订单）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索账户/订阅类型/闲鱼昵称..."
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
            <select
              value={sourceFilter ? '__MANUAL__' : statusFilter}
              onChange={(e) => {
                const v = e.target.value
                if (v === '__MANUAL__') {
                  setSourceFilter('MANUAL')
                } else {
                  setSourceFilter('')
                  setStatusFilter(v)
                }
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900"
            >
              <option value="">全部状态</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
              <option value="__MANUAL__">— 只看手动录入（站外）—</option>
            </select>
            <Button variant="outline" onClick={load}>
              <Search className="w-4 h-4 mr-1" /> 刷新
            </Button>
            <Button variant="outline" onClick={() => setCreating(true)}>
              <Plus className="w-4 h-4 mr-1" /> 手动录入发票
            </Button>
            <Button variant="outline" onClick={exportPending} loading={exporting}>
              <Download className="w-4 h-4 mr-1" /> 导出待开发票
            </Button>
          </div>

          {exportTip && (
            <div
              className={`mb-4 rounded-lg px-3 py-2 text-sm ${
                exportTip.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {exportTip.text}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : list.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无订单</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="border-b text-left text-gray-500 text-xs">
                    <th className="pb-2 pr-3">抬头 / 账户</th>
                    <th className="pb-2 pr-3">订阅</th>
                    <th className="pb-2 pr-3 text-right">开票金额(含税)</th>
                    <th className="pb-2 pr-3 text-right">税费</th>
                    <th className="pb-2 pr-3">状态</th>
                    <th className="pb-2 pr-3">提交时间</th>
                    <th className="pb-2 pr-3">设置状态</th>
                    <th className="pb-2 text-right">详情</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((iv) => (
                    <tr
                      key={iv.manual ? `m${iv.invoiceId}` : `o${iv.externalOrderId}`}
                      className="border-b hover:bg-gray-50/60"
                    >
                      <td className="py-2 pr-3">
                        <div className="flex items-center gap-1.5 font-medium">
                          {iv.title || <span className="text-gray-400">（未填抬头）</span>}
                          {iv.manual && (
                            <span className="shrink-0 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] text-indigo-700">
                              站外
                            </span>
                          )}
                          {longTax(iv.taxNumber) && (
                            <span
                              className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] text-red-700"
                              title={`税号 ${iv.taxNumber?.length} 位，超过税局模板允许的 ${TAX_NUMBER_MAX_LEN} 位，这一批都会被退回`}
                            >
                              税号超长
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">{iv.claudeAccount}</div>
                      </td>
                      <td className="py-2 pr-3 text-xs">{iv.subscriptionType}</td>
                      <td className="py-2 pr-3 text-right">{money(iv.invoiceAmount)}</td>
                      <td className="py-2 pr-3 text-right whitespace-nowrap">
                        {money(iv.taxFee)}
                        <span className={`ml-1 text-xs ${iv.payStatus === 'PAID' ? 'text-green-600' : 'text-gray-400'}`}>
                          {iv.payStatus === 'PAID' ? '已付' : '未付'}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[iv.status] || ''}`}>
                          {STATUS_LABELS[iv.status] || iv.status}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">{iv.submittedAt ? fmt(iv.submittedAt) : '—'}</td>
                      <td className="py-2 pr-3">
                        <select
                          value={iv.status}
                          onChange={(e) => setStatus(iv, e.target.value)}
                          className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900"
                        >
                          {(iv.manual ? MANUAL_STATUS_OPTIONS : STATUS_OPTIONS).map((s) => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <button onClick={() => setDetail(iv)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-gray-600 hover:bg-gray-100" title="详情">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
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

      {creating && (
        <ManualInvoiceModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false)
            setSourceFilter('MANUAL')
            setPage(1)
            load()
          }}
        />
      )}

      {/* 详情弹窗 */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDetail(null)}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">发票详情</h3>
              <button onClick={() => setDetail(null)} className="p-1 rounded hover:bg-gray-100 text-gray-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2 text-sm text-gray-800">
              {[
                ['发票号', detail.invoiceNo || '-'],
                ['抬头', detail.title || '-'],
                ['税号', detail.taxNumber || '-'],
                ['接收邮箱', detail.email || '-'],
                [
                  '发票展示 ChatGPT/Claude 字眼',
                  detail.showAiWording == null ? '—（申请前的历史记录）' : detail.showAiWording ? '展示' : '不展示',
                ],
                ['地址', detail.address || '-'],
                ['电话', detail.phone || '-'],
                ['开户行', detail.bankName || '-'],
                ['卡号', detail.bankAccount || '-'],
                ['订阅', detail.subscriptionType],
                ['账户', detail.claudeAccount],
                ['报价（售价）', money(detail.sellingPrice)],
                ['开票金额（含税 = 报价×1.06）', money(detail.invoiceAmount)],
                ['发票税费（报价×0.06）', `${money(detail.taxFee)} · ${detail.payStatus === 'PAID' ? '已支付' : '未支付'}`],
                ['状态', STATUS_LABELS[detail.status] || detail.status],
                ['提交开票时间', detail.submittedAt ? fmt(detail.submittedAt) : '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-gray-100 py-1.5">
                  <span className="text-gray-500 shrink-0">{k}</span>
                  <span className="text-right break-all font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-5">
              {detail.manual && (
                <Button variant="outline" onClick={() => removeManual(detail)}>
                  删除这条录入
                </Button>
              )}
              {(detail.manual ? MANUAL_STATUS_OPTIONS : STATUS_OPTIONS)
                .filter((s) => s !== detail.status)
                .map((s) => (
                  <Button key={s} variant="outline" onClick={() => setStatus(detail, s)}>
                    改为「{STATUS_LABELS[s]}」
                  </Button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 手动录入发票申请（站外客户）。
 *
 * 面向「没在本站下过单、但要和站内订单一起批量开票」的客户。
 *
 * 【金额填的是开票金额（含税）】客户线下实付多少就填多少，这个数原样进税局模板。
 * 不含税额与税额由服务端按 1.06 倒推，只用于后台展示与「已收税费」统计。
 *
 * 【抬头与税号是硬性必填】导出的 xlsx 里这两列为空，税局退回的是整批，不是这一行。
 */
function ManualInvoiceModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    invoiceAmount: '',
    title: '',
    taxNumber: '',
    address: '',
    phone: '',
    bankName: '',
    bankAccount: '',
    email: '',
    subscriptionType: '',
    account: '',
  })
  const [showAiWording, setShowAiWording] = useState(false)
  const [status, setStatus] = useState<'SUBMITTED' | 'ISSUED'>('SUBMITTED')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // 服务端用的是同一套「按分算、税额由减法导出」的口径，这里只是把结果提前显示出来
  const amount = Number(f.invoiceAmount)
  const preview = (() => {
    if (!isFinite(amount) || amount <= 0) return null
    const inv = Math.round(amount * 100)
    const sell = Math.round(inv / 1.06)
    return { sell: sell / 100, tax: (inv - sell) / 100 }
  })()

  // 与服务端 assertTaxNumber 共用同一份归一化规则，避免两边算出不同的位数
  const cleanTax = normalizeTaxNumber(f.taxNumber)
  const taxTooLong = cleanTax.length > TAX_NUMBER_MAX_LEN

  const submit = async () => {
    setErr(null)
    if (!preview) return setErr('请填写正确的开票金额')
    if (!f.title.trim()) return setErr('请填写抬头')
    if (!cleanTax) return setErr('请填写税号')
    if (taxTooLong) return setErr(`税号去掉空格后为 ${cleanTax.length} 位，超过税务系统允许的 ${TAX_NUMBER_MAX_LEN} 位`)
    setSaving(true)
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceAmount: amount,
          title: f.title.trim(),
          taxNumber: f.taxNumber.trim(),
          address: f.address.trim() || null,
          phone: f.phone.trim() || null,
          bankName: f.bankName.trim() || null,
          bankAccount: f.bankAccount.trim() || null,
          email: f.email.trim() || null,
          subscriptionType: f.subscriptionType.trim() || null,
          account: f.account.trim() || null,
          showAiWording,
          status,
        }),
      })
      const d = await res.json()
      if (d.success) return onSaved()
      setErr(d.error || '录入失败')
    } catch {
      setErr('网络错误，请重试')
    } finally {
      setSaving(false)
    }
  }

  const field = (label: string, key: keyof typeof f, opts?: { required?: boolean; placeholder?: string; type?: string }) => (
    <div>
      <label className="mb-1 block text-xs text-gray-500">
        {label}
        {opts?.required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <Input
        type={opts?.type || 'text'}
        value={f[key]}
        onChange={(e) => setF((v) => ({ ...v, [key]: e.target.value }))}
        placeholder={opts?.placeholder}
      />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">手动录入发票（站外客户）</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-500">
          用于没在本站下过单的客户，录入后与站内发票一起出现在「导出待开发票」的批量模板里。
          <br />
          金额请填<strong className="text-gray-700">开票金额（含税）</strong>——
          客户实付多少就填多少，这个数原样进税局模板。
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            {field('开票金额（含税）', 'invoiceAmount', { required: true, type: 'number', placeholder: '例如 1060.00' })}
            {preview && (
              <p className="mt-1 text-xs text-gray-400">
                换算：不含税 ¥{preview.sell.toFixed(2)} + 税额 ¥{preview.tax.toFixed(2)} = ¥{amount.toFixed(2)}
              </p>
            )}
          </div>
          <div className="sm:col-span-2">{field('抬头', 'title', { required: true, placeholder: '公司名称 / 个人' })}</div>
          <div className="sm:col-span-2">
            {field('税号', 'taxNumber', { required: true, placeholder: '纳税人识别号（带空格会自动去掉）' })}
            {cleanTax && (
              <p className={`mt-1 text-xs ${taxTooLong ? 'text-red-600' : 'text-gray-400'}`}>
                去空格后 {cleanTax.length} 位{taxTooLong ? `，超过上限 ${TAX_NUMBER_MAX_LEN} 位，税局会退回整批` : ''}
              </p>
            )}
          </div>
          {field('地址', 'address', { placeholder: '选填' })}
          {field('电话', 'phone', { placeholder: '选填' })}
          {field('开户行', 'bankName', { placeholder: '选填' })}
          {field('卡号', 'bankAccount', { placeholder: '选填' })}
          {field('接收邮箱', 'email', { type: 'email', placeholder: '选填，标记已开具时给客户发通知用' })}
          {field('客户标识', 'account', { placeholder: '选填，显示在列表「账户」列' })}
          <div className="sm:col-span-2">
            {field('开票内容', 'subscriptionType', { placeholder: '留空则按默认「技术咨询服务」开具' })}
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">发票展示具体服务名称</label>
            <select
              value={showAiWording ? '1' : '0'}
              onChange={(e) => setShowAiWording(e.target.value === '1')}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            >
              <option value="0">不展示（只开「技术咨询服务」）</option>
              <option value="1">展示（规格型号写开票内容）</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">录入后的状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'SUBMITTED' | 'ISSUED')}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            >
              <option value="SUBMITTED">已提交开票（进待开清单，会被批量导出）</option>
              <option value="ISSUED">已开具（只做存档，不进待开清单）</option>
            </select>
          </div>
        </div>

        {err && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" /> {err}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-5">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={submit} loading={saving}>
            录入
          </Button>
        </div>
      </div>
    </div>
  )
}
