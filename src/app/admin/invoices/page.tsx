'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { SourceBadge, SourceFilter, type SiteOption, type SourceSite } from '@/components/admin/source-site'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Eye, X, Download, Plus, AlertCircle, Link2, Copy, Check } from 'lucide-react'
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
  /** 发票来源：BUYER / MANUAL / null（历史数据、后台按订单建的空壳） */
  source?: string | null
  userId?: number | null
  /** true = 挂的外部订单已被删除（只会在按 id 深链打开时出现），改状态只能按发票 id */
  orphan?: boolean
  /** 关联的站内订单（lib/order-link.ts 的 ShopOrderBrief）；手动录入 / 纯外部导入为 null */
  shopOrder?: ShopOrderBrief | null
  /** 挂着的外部订单原始信息；手动录入 / 孤儿发票为 null */
  ext?: ExtInfo | null
  /** 来源站（设计 12.2）：source 已被录入方式占用，所以叫 site */
  site?: SourceSite
}

interface ShopOrderBrief {
  id: number
  orderNo: string
  productName: string
  quantity: number
  amount: number
  invoiceTaxFee: number | null
  payStatus: string
  deliveryStatus: string
  createdAt: string
  paidAt: string | null
  user: { id: number; email: string | null; nickname: string | null }
}

interface ExtInfo {
  id: number
  claudeAccount: string
  subscriptionType: string
  xianyuNickname: string | null
  importBatch: string | null
  startDate: string
  expireDate: string
  quote: number | null
  shopOrderId: number | null
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

/** 没有外部订单可挂（手动录入 / 孤儿发票）→ 只能按发票 id 改状态 */
function byInvoiceId(row: InvoiceRow) {
  return !!row.manual || row.externalOrderId == null
}

const ORDER_PAY_STATUS: Record<string, string> = { UNPAID: '待支付', PAID: '已支付', REFUNDED: '已退款' }
const ORDER_DELIVERY_STATUS: Record<string, string> = {
  PENDING: '待处理',
  PROCESSING: '处理中',
  DELIVERED: '已完成',
  CANCELLED: '已取消',
}

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
function fmtFull(s: string | null | undefined) {
  return s ? new Date(s).toLocaleString('zh-CN', { hour12: false }) : '—'
}
/** @db.Date 列（开通 / 到期）按 UTC 零点存，直接取日期部分，不做时区换算 */
function day(s: string | null | undefined) {
  return s ? s.slice(0, 10) : '—'
}
function money(n: number | null) {
  return n == null ? '-' : `¥${Number(n).toFixed(2)}`
}

const PAGE_SIZE = 20

// useSearchParams 必须包在 Suspense 里（与卡密页同一写法）
export default function AdminInvoicesPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-400">加载中...</div>}>
      <InvoicesInner />
    </Suspense>
  )
}

function InvoicesInner() {
  const sp = useSearchParams()
  const router = useRouter()
  /** 深链 /admin/invoices?invoiceId=123：从订单详情「在发票管理中查看」过来 */
  const deepLinkId = sp.get('invoiceId')
  const [list, setList] = useState<InvoiceRow[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('SUBMITTED')
  /** 'MANUAL' = 只看手动录入的站外发票（与状态筛选互斥） */
  const [sourceFilter, setSourceFilter] = useState('')
  // 来源站筛选（设计 12.2）：'' = 全部
  const [siteFilter, setSiteFilter] = useState('')
  const [sites, setSites] = useState<SiteOption[]>([])
  const [creating, setCreating] = useState(false)
  /** 「生成填写链接」弹窗 —— 手动录入的第二种方式：金额我定，抬头客户自己填 */
  const [linkCreating, setLinkCreating] = useState(false)
  /** 生成新链接后 +1，让下方「开票填写链接」列表重新拉取 */
  const [linksReload, setLinksReload] = useState(0)
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
      if (siteFilter) q.set('tenantId', siteFilter)
      const res = await fetch(`/api/admin/invoices?${q}`, { signal: controller.signal })
      const data = await res.json()
      if (data.success && abortRef.current === controller) {
        setList(data.data.list)
        setTotals(data.data.totals)
        setTotal(data.data.total || 0)
        setTotalPages(data.data.totalPages || 1)
        setSites(data.data.sites || [])
      }
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }, [page, debouncedKeyword, statusFilter, sourceFilter, siteFilter])

  useEffect(() => {
    load()
  }, [load])

  // 深链：按发票 id 单独取一行开弹窗 —— 那张票多半不在当前页（列表默认只看「已提交开票」）
  useEffect(() => {
    const id = parseInt(deepLinkId || '')
    if (!Number.isSafeInteger(id) || id <= 0) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/invoices/${id}`)
        const d = await res.json()
        if (cancelled) return
        if (d.success) setDetail(d.data as InvoiceRow)
        else alert(d.error || '发票不存在')
      } catch {
        if (!cancelled) alert('网络错误，发票详情加载失败')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [deepLinkId])

  // 关弹窗时顺手去掉地址栏的 ?invoiceId=，否则刷新页面会再弹一次
  const closeDetail = () => {
    setDetail(null)
    if (deepLinkId) router.replace('/admin/invoices', { scroll: false })
  }

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
      // 导出按当前来源站筛选（税局模板的列不变）
      const res = await fetch(`/api/admin/invoices/export${siteFilter ? `?tenantId=${siteFilter}` : ''}`)
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
  const setStatus = async (row: InvoiceRow, status: string, taxRefund?: Record<string, unknown>) => {
    const payload = JSON.stringify({ status, ...(taxRefund ? { taxRefund } : {}) })
    const res = byInvoiceId(row)
      ? await fetch(`/api/admin/invoices/${row.invoiceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        })
      : await fetch(`/api/admin/invoices/by-order/${row.externalOrderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
        })
    const data = await res.json()
    if (data.success) {
      load()
      closeDetail()
      return
    }
    /*
     * 渠道订单的发票改「不可开据」或撤回「已开具」、而税费已收（设计 8.4 末段）：必须决定税费退不退。
     * 退 → 同一事务冲销发票分成（要带订单的结算版本号，并发时 409）；不退 → 原因必填、写审计。
     */
    if (data.code === 'TAX_DECISION_REQUIRED' && !taxRefund && row.invoiceId) {
      const v = prompt(
        `${data.error}` + String.fromCharCode(10) + String.fromCharCode(10) + '输入要退还的税费金额（元）；输入 0 表示「保留税费、不退」：',
        row.taxFee != null ? row.taxFee.toFixed(2) : '',
      )
      if (v === null) return
      const yuan = Number(v.trim())
      if (!Number.isFinite(yuan) || yuan < 0) {
        alert('金额格式不正确')
        return
      }
      if (yuan === 0) {
        const reason = prompt('保留税费的原因（必填，仅超管可见）：')
        if (!reason || reason.trim().length < 2) return
        await setStatus(row, status, { keep: true, reason: reason.trim() })
        return
      }
      const info = await fetch(`/api/admin/invoices/${row.invoiceId}`).then((r) => r.json()).catch(() => null)
      const ver = info?.data?.channelOrder?.settleVersion
      if (typeof ver !== 'number') {
        alert('读取订单结算版本失败，请刷新后重试')
        return
      }
      const requestId = `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
      await setStatus(row, status, { refundTaxCents: Math.round(yuan * 100), expectedVersion: ver, requestId })
      return
    }
    alert(data.error || '操作失败')
  }

  const removeManual = async (row: InvoiceRow) => {
    if (!row.invoiceId) return
    if (!confirm(`删除手动录入的发票「${row.title || row.invoiceNo}」？此操作不可恢复。`)) return
    const res = await fetch(`/api/admin/invoices/${row.invoiceId}`, { method: 'DELETE' })
    const d = await res.json()
    if (d.success) {
      load()
      closeDetail()
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
            <SourceFilter
              value={siteFilter}
              onChange={(v) => {
                setSiteFilter(v)
                setPage(1)
              }}
              options={sites}
              className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900"
            />
            <Button variant="outline" onClick={load}>
              <Search className="w-4 h-4 mr-1" /> 刷新
            </Button>
            <Button variant="outline" onClick={() => setCreating(true)}>
              <Plus className="w-4 h-4 mr-1" /> 手动录入发票
            </Button>
            <Button variant="outline" onClick={() => setLinkCreating(true)} title="定好含税金额，生成链接发给客户，由客户自己填抬头税号">
              <Link2 className="w-4 h-4 mr-1" /> 生成填写链接
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
                    <th className="pb-2 pr-3">来源站</th>
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
                        {iv.shopOrder && (
                          <Link
                            href={`/admin/orders?orderId=${iv.shopOrder.id}`}
                            className="text-[11px] text-gray-400 font-mono hover:text-primary-600 hover:underline"
                            title="打开这张站内订单的详情"
                          >
                            订单 {iv.shopOrder.orderNo}
                          </Link>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <SourceBadge source={iv.site} />
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
                          {(byInvoiceId(iv) ? MANUAL_STATUS_OPTIONS : STATUS_OPTIONS)
                            // 税费已收的票不能重置成「未开发票」（那等于删票，服务端会拒），
                            // 也不能改回「待支付税费」（买家会看到一个付不了的「去支付」）；当前值仍要能显示
                            .filter(
                              (s) =>
                                !((s === 'UNAPPLIED' || s === 'AWAIT_PAY') && iv.payStatus === 'PAID' && iv.status !== s)
                            )
                            .map((s) => (
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

      <InvoiceRequestsCard reloadKey={linksReload} onCreate={() => setLinkCreating(true)} />

      {creating && (
        <ManualInvoiceModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false)
            setSourceFilter('MANUAL')
            setPage(1)
            load()
          }}
          onSwitchToLink={() => {
            setCreating(false)
            setLinkCreating(true)
          }}
        />
      )}

      {linkCreating && (
        <InvoiceLinkModal onClose={() => setLinkCreating(false)} onCreated={() => setLinksReload((n) => n + 1)} />
      )}

      {/* 详情弹窗 */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeDetail}>
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">发票详情</h3>
              <button onClick={closeDetail} className="p-1 rounded hover:bg-gray-100 text-gray-500"><X className="w-5 h-5" /></button>
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
                ['税费支付时间', fmtFull(detail.paidAt)],
                ['提交开票时间', fmtFull(detail.submittedAt)],
                ['开具时间', fmtFull(detail.issuedAt)],
                ['记录创建时间', fmtFull(detail.createdAt)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-gray-100 py-1.5">
                  <span className="text-gray-500 shrink-0">{k}</span>
                  <span className="text-right break-all font-medium">{v}</span>
                </div>
              ))}
            </div>
            <LinkedOrder row={detail} />
            <div className="flex flex-wrap justify-end gap-2 pt-5">
              {detail.manual && (
                <Button variant="outline" onClick={() => removeManual(detail)}>
                  删除这条录入
                </Button>
              )}
              {(byInvoiceId(detail) ? MANUAL_STATUS_OPTIONS : STATUS_OPTIONS)
                .filter((s) => s !== detail.status)
                .filter((s) => !((s === 'UNAPPLIED' || s === 'AWAIT_PAY') && detail.payStatus === 'PAID'))
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
 * 发票详情里的「关联订单」：站内订单 / 站外导入的外部订单 / 手动录入，三种情况分开说清楚。
 * 线索规则（shopOrderId → 'order:<id>' → 发票上的 sourceKey 快照）在服务端 lib/order-link.ts。
 */
function LinkedOrder({ row }: { row: InvoiceRow }) {
  const kv = (k: string, v: React.ReactNode) => (
    <div key={k} className="flex justify-between gap-4 border-b border-gray-100 py-1.5">
      <span className="text-gray-500 shrink-0">{k}</span>
      <span className="text-right break-all font-medium">{v}</span>
    </div>
  )

  let body: React.ReactNode
  const o = row.shopOrder
  if (o) {
    body = (
      <>
        {kv('订单号', <span className="font-mono text-xs">{o.orderNo}</span>)}
        {kv('商品', `${o.productName} × ${o.quantity}`)}
        {kv('货款（不含税）', money(o.amount))}
        {kv('随单税费', o.invoiceTaxFee == null ? '—（下单时未勾选开票）' : money(o.invoiceTaxFee))}
        {kv('支付状态', ORDER_PAY_STATUS[o.payStatus] || o.payStatus)}
        {kv('交付状态', ORDER_DELIVERY_STATUS[o.deliveryStatus] || o.deliveryStatus)}
        {kv('买家邮箱', o.user.email || o.user.nickname || `用户#${o.user.id}`)}
        {kv('下单时间', fmtFull(o.createdAt))}
        {kv('付款时间', fmtFull(o.paidAt))}
        <div className="pt-2 text-right">
          <Link href={`/admin/orders?orderId=${o.id}`} className="text-xs text-primary-600 hover:underline">
            打开订单详情 →
          </Link>
        </div>
      </>
    )
  } else if (row.manual) {
    body = <p className="text-gray-500">手动录入（站外客户），无关联订单</p>
  } else if (row.ext) {
    const e = row.ext
    body = (
      <>
        {kv('账户', <span className="font-mono text-xs">{e.claudeAccount}</span>)}
        {kv('闲鱼昵称', e.xianyuNickname || '—')}
        {kv('开通 / 到期', `${day(e.startDate)} ~ ${day(e.expireDate)}`)}
        {kv('导入批次', e.importBatch || '—')}
        <p className="pt-2 text-xs text-gray-400">站外订单，无站内订单</p>
      </>
    )
  } else {
    body = <p className="text-gray-500">原外部订单已被删除，找不到关联订单</p>
  }

  return (
    <div className="mt-5">
      <h4 className="mb-2 text-sm font-semibold text-gray-900">关联订单</h4>
      <div className="text-sm text-gray-800">{body}</div>
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
function ManualInvoiceModal({
  onClose,
  onSaved,
  onSwitchToLink,
}: {
  onClose: () => void
  onSaved: () => void
  /** 切换到第二种方式：生成填写链接，让客户自己填抬头 */
  onSwitchToLink: () => void
}) {
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

        {/* 两种录入方式并列摆出来：抬头税号往往要找客户要，来回转述最容易抄错一位 */}
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-lg border-2 border-primary-500 bg-primary-50 px-3 py-2.5">
            <div className="text-sm font-medium text-gray-900">① 我来填写全部信息</div>
            <div className="mt-0.5 text-xs text-gray-500">抬头、税号都已拿到，直接在下面录入</div>
          </div>
          <button
            type="button"
            onClick={onSwitchToLink}
            className="rounded-lg border border-gray-200 px-3 py-2.5 text-left transition-colors hover:border-primary-300 hover:bg-gray-50"
          >
            <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
              <Link2 className="h-4 w-4 text-primary-600" /> ② 生成填写链接（让客户自己填抬头）
            </div>
            <div className="mt-0.5 text-xs text-gray-500">只填含税金额，把链接发给客户，客户提交后自动进待开清单</div>
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

// ============ 开票填写链接 ============

/** 后台列表行（api/admin/invoice-requests 的 toRow） */
interface InvoiceRequestRow {
  id: number
  /** PENDING 待填写 / SUBMITTED 已提交 / CANCELLED 已作废 / EXPIRED 已过期（PENDING 且过了有效期，现算） */
  status: string
  invoiceAmount: number
  sellingPrice: number
  taxFee: number
  subscriptionType: string | null
  account: string | null
  note: string | null
  url: string
  expiresAt: string | null
  createdAt: string
  submittedAt: string | null
  invoiceId: number | null
  invoiceNo: string | null
  title: string | null
}

const REQ_TABS: { key: string; label: string }[] = [
  { key: 'PENDING', label: '待填写' },
  { key: 'SUBMITTED', label: '已提交' },
  { key: 'EXPIRED', label: '已过期' },
  { key: 'CANCELLED', label: '已作废' },
  { key: 'all', label: '全部' },
]
const REQ_STATUS_LABELS: Record<string, string> = {
  PENDING: '待填写',
  SUBMITTED: '已提交',
  EXPIRED: '已过期',
  CANCELLED: '已作废',
}
const REQ_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  SUBMITTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  EXPIRED: 'bg-gray-100 text-gray-500 border-gray-200',
  CANCELLED: 'bg-gray-100 text-gray-400 border-gray-200',
}
const REQ_PAGE_SIZE = 20

/**
 * 复制到剪贴板。navigator.clipboard 只在 HTTPS / localhost 下可用（后台偶尔会走内网 http 访问），
 * 不可用时退回 execCommand('copy')；两条都失败返回 false，由调用方让管理员手动选中复制。
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* 权限被拒等，走下面的兜底 */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '0'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/** 与服务端 splitInvoiceAmount / createManualInvoice 同一算法：按分算，售价 = round(含税/1.06)，税额由减法得出 */
function splitPreview(amount: number) {
  const inv = Math.round(amount * 100)
  const sell = Math.round(inv / 1.06)
  return { sell: sell / 100, tax: (inv - sell) / 100 }
}

/**
 * 生成开票填写链接：管理员只定含税金额（和可选的开票内容），抬头税号交给客户自己填。
 *
 * 【为什么金额必须由这边定】链接是公开的，谁拿到都能打开。金额放给客户填，
 * 就等于任何人都能给自己开一张任意金额的票进待开清单。客户页只读显示金额。
 */
function InvoiceLinkModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [f, setF] = useState({ invoiceAmount: '', subscriptionType: '', account: '', note: '', validDays: '30' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [created, setCreated] = useState<InvoiceRequestRow | null>(null)
  const [copied, setCopied] = useState(false)
  const urlRef = useRef<HTMLInputElement | null>(null)

  const rawAmount = f.invoiceAmount.trim()
  const amount = Number(rawAmount)
  // 与服务端 zod 同口径：> 0、≤ 1,000,000、最多两位小数
  const amountOk = /^\d+(\.\d{1,2})?$/.test(rawAmount) && amount > 0 && amount <= 1_000_000
  const preview = amountOk ? splitPreview(amount) : null
  const days = f.validDays.trim() === '' ? 30 : Number(f.validDays)
  const daysOk = Number.isInteger(days) && days >= 0 && days <= 365

  const set = (key: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((v) => ({ ...v, [key]: e.target.value }))

  const submit = async () => {
    setErr(null)
    if (!rawAmount) return setErr('请填写开票金额（含税）')
    if (!amountOk) return setErr('开票金额需大于 0、不超过 1,000,000，且最多两位小数')
    if (!preview || preview.sell <= 0) return setErr('开票金额过小')
    if (!daysOk) return setErr('有效期请填 0~365 的整数天（0 = 长期有效）')
    if (!f.subscriptionType.trim()) return setErr('请填写开票内容（客户选择「展示」时印在规格型号上）')
    setSaving(true)
    try {
      const res = await fetch('/api/admin/invoice-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceAmount: amount,
          subscriptionType: f.subscriptionType.trim() || null,
          account: f.account.trim() || null,
          note: f.note.trim() || null,
          validDays: days,
        }),
      })
      const d = await res.json()
      if (!d.success) return setErr(d.error || '生成失败')
      setCreated(d.data as InvoiceRequestRow)
      setCopied(false)
      onCreated()
    } catch {
      setErr('网络错误，请重试')
    } finally {
      setSaving(false)
    }
  }

  const copy = async () => {
    if (!created) return
    if (await copyText(created.url)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return
    }
    // 两种复制方式都失败：把链接选中，让管理员自己 Ctrl+C
    urlRef.current?.focus()
    urlRef.current?.select()
    alert('浏览器不允许自动复制，链接已选中，请按 Ctrl+C（手机长按）手动复制')
  }

  const label = (text: string, required?: boolean) => (
    <label className="mb-1 block text-xs text-gray-500">
      {text}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-lg font-semibold text-gray-900">
            <Link2 className="h-5 w-5 text-primary-600" /> 生成开票填写链接
          </h3>
          <button onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {created ? (
          <div>
            <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              链接已生成。复制后发给客户，客户填好抬头提交后，会自动进入「已提交开票」待开清单并推送企业微信。
            </div>
            <div className="mt-4">
              {label('填写链接')}
              <div className="flex gap-2">
                <input
                  ref={urlRef}
                  readOnly
                  value={created.url}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-900"
                />
                <Button onClick={copy} className="shrink-0">
                  {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                  {copied ? '已复制' : '复制链接'}
                </Button>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 text-sm text-gray-700">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">开票金额（含税）</span>
                <span className="font-medium tabular-nums">¥{created.invoiceAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">换算</span>
                <span className="tabular-nums text-gray-500">
                  不含税 ¥{created.sellingPrice.toFixed(2)} + 税额 ¥{created.taxFee.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">开票内容</span>
                <span className="text-right">{created.subscriptionType || '技术咨询服务（默认）'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">有效期</span>
                <span>{created.expiresAt ? `至 ${fmtFull(created.expiresAt)}` : '长期有效'}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-5">
              <Button
                variant="outline"
                onClick={() => {
                  setCreated(null)
                  setF({ invoiceAmount: '', subscriptionType: '', account: '', note: '', validDays: '30' })
                }}
              >
                再生成一个
              </Button>
              <Button onClick={onClose}>完成</Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-500">
              只需定好<strong className="text-gray-700">开票金额（含税）</strong>——客户实付多少就填多少，客户页上只读、改不了。
              客户需要填写：抬头、税号、接收邮箱、是否展示 ChatGPT/Claude 字眼（必填），地址电话开户行卡号（选填）。
              每个链接只能提交一次。
            </div>

            <div className="space-y-3">
              <div>
                {label('开票金额（含税）', true)}
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={f.invoiceAmount}
                  onChange={set('invoiceAmount')}
                  placeholder="例如 1060.00"
                />
                {preview && (
                  <p className="mt-1 text-xs text-gray-400">
                    不含税 ¥{preview.sell.toFixed(2)} + 税额 ¥{preview.tax.toFixed(2)} = ¥{amount.toFixed(2)}
                  </p>
                )}
              </div>
              <div>
                {label('开票内容 / 规格型号 *')}
                <Input
                  value={f.subscriptionType}
                  onChange={set('subscriptionType')}
                  maxLength={100}
                  placeholder="例如 ChatGPT Plus 会员"
                />
                <p className="mt-1 text-xs text-gray-400">客户选择「展示字眼」时印在规格型号上；选「不展示」则只印「技术咨询服务」</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  {label('客户标识')}
                  <Input value={f.account} onChange={set('account')} maxLength={255} placeholder="选填，显示在列表「账户」列" />
                </div>
                <div>
                  {label('有效期（天）')}
                  <Input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min="0"
                    max="365"
                    value={f.validDays}
                    onChange={set('validDays')}
                    placeholder="30"
                  />
                  <p className="mt-1 text-xs text-gray-400">默认 30 天，填 0 = 长期有效</p>
                </div>
              </div>
              <div>
                {label('后台备注')}
                <Input value={f.note} onChange={set('note')} maxLength={255} placeholder="选填，仅后台可见，客户看不到" />
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
                生成链接
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 「开票填写链接」列表：看哪些客户还没填、哪些已经提交成了哪张发票。
 * 已提交的直接链到上面的发票详情（?invoiceId= 深链，本页已支持）。
 */
function InvoiceRequestsCard({ reloadKey, onCreate }: { reloadKey: number; onCreate: () => void }) {
  const [tab, setTab] = useState('PENDING')
  const [page, setPage] = useState(1)
  const [list, setList] = useState<InvoiceRequestRow[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    try {
      const q = new URLSearchParams({ status: tab, page: String(page), pageSize: String(REQ_PAGE_SIZE) })
      const res = await fetch(`/api/admin/invoice-requests?${q}`, { signal: controller.signal })
      const d = await res.json()
      if (abortRef.current !== controller) return
      if (d.success) {
        setList(d.data.list)
        setCounts(d.data.counts || {})
        setTotalPages(d.data.totalPages || 1)
      }
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
    // reloadKey：上面生成了新链接，要重新拉
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, reloadKey])

  useEffect(() => {
    load()
  }, [load])

  const copy = async (row: InvoiceRequestRow) => {
    if (await copyText(row.url)) {
      setCopiedId(row.id)
      setTimeout(() => setCopiedId((v) => (v === row.id ? null : v)), 2000)
      return
    }
    // 兜底：prompt 会把链接放进一个已全选的输入框里，管理员直接 Ctrl+C
    window.prompt('浏览器不允许自动复制，请手动复制下面的链接：', row.url)
  }

  const cancel = async (row: InvoiceRequestRow) => {
    if (
      !confirm(
        `作废这个开票填写链接？\n\n含税金额 ¥${row.invoiceAmount.toFixed(2)}${row.account ? ` · ${row.account}` : ''}\n\n作废后客户打开链接会看到「已失效」，无法再提交。此操作不可恢复。`
      )
    )
      return
    const res = await fetch(`/api/admin/invoice-requests/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CANCEL' }),
    })
    const d = await res.json().catch(() => null)
    if (d?.success) load()
    else {
      alert(d?.error || '操作失败')
      load() // 多半是客户刚好提交了，刷新看最新状态
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          开票填写链接
          <span className="ml-3 text-xs font-normal text-gray-500">生成链接发给客户自己填抬头，提交后自动进入待开清单</span>
        </CardTitle>
        <Button size="sm" variant="outline" onClick={onCreate}>
          <Link2 className="mr-1 h-4 w-4" /> 生成填写链接
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {REQ_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key)
                setPage(1)
              }}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                tab === t.key
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.label}
              <span className="ml-1 tabular-nums text-gray-400">{counts[t.key] ?? 0}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400">加载中...</div>
        ) : list.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">暂无链接</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-800">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500">
                  <th className="pb-2 pr-3">创建时间</th>
                  <th className="pb-2 pr-3 text-right">含税金额</th>
                  <th className="pb-2 pr-3">开票内容</th>
                  <th className="pb-2 pr-3">客户标识 / 备注</th>
                  <th className="pb-2 pr-3">状态</th>
                  <th className="pb-2 pr-3">链接</th>
                  <th className="pb-2 pr-3">提交后的发票</th>
                  <th className="pb-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-b align-top hover:bg-gray-50/60">
                    <td className="whitespace-nowrap py-2 pr-3 text-xs text-gray-500">{fmt(r.createdAt)}</td>
                    <td className="whitespace-nowrap py-2 pr-3 text-right">
                      <div className="font-medium tabular-nums">¥{r.invoiceAmount.toFixed(2)}</div>
                      <div className="text-[11px] tabular-nums text-gray-400">
                        {r.sellingPrice.toFixed(2)} + 税 {r.taxFee.toFixed(2)}
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-xs">
                      {r.subscriptionType || <span className="text-gray-400">技术咨询服务（默认）</span>}
                    </td>
                    <td className="max-w-[220px] py-2 pr-3 text-xs">
                      {r.account && <div className="break-all font-mono">{r.account}</div>}
                      {r.note && <div className="break-all text-gray-400">{r.note}</div>}
                      {!r.account && !r.note && <span className="text-gray-300">—</span>}
                    </td>
                    <td className="whitespace-nowrap py-2 pr-3">
                      <span className={`inline-flex rounded border px-2 py-0.5 text-xs ${REQ_STATUS_STYLES[r.status] || ''}`}>
                        {REQ_STATUS_LABELS[r.status] || r.status}
                      </span>
                      <div className="mt-0.5 text-[11px] text-gray-400">
                        {r.status === 'SUBMITTED' && r.submittedAt
                          ? `${fmt(r.submittedAt)} 提交`
                          : r.status === 'PENDING' || r.status === 'EXPIRED'
                            ? r.expiresAt
                              ? `${r.status === 'EXPIRED' ? '已于' : '有效至'} ${fmt(r.expiresAt)}`
                              : '长期有效'
                            : null}
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-2 pr-3">
                      {r.status === 'PENDING' ? (
                        <button
                          onClick={() => copy(r)}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-primary-600 hover:bg-primary-50"
                          title={r.url}
                        >
                          {copiedId === r.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedId === r.id ? '已复制' : '复制链接'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-xs">
                      {r.invoiceId && r.invoiceNo ? (
                        <>
                          <Link
                            href={`/admin/invoices?invoiceId=${r.invoiceId}`}
                            scroll={false}
                            className="font-mono text-primary-600 hover:underline"
                            title="打开这张发票的详情"
                          >
                            {r.invoiceNo}
                          </Link>
                          {r.title && <div className="max-w-[200px] break-all text-gray-500">{r.title}</div>}
                        </>
                      ) : r.status === 'SUBMITTED' ? (
                        // 链接表与发票表之间没有外键：管理员在上面删掉那张手动录入的发票后，这里只剩一个悬空 id
                        <span className="text-gray-400">发票已删除</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap py-2 text-right">
                      {r.status === 'PENDING' ? (
                        <button
                          onClick={() => cancel(r)}
                          className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          作废
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
              上一页
            </Button>
            <span className="text-sm tabular-nums text-gray-500">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            >
              下一页
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
