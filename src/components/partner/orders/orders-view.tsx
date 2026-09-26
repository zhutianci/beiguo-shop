'use client'

/**
 * 订单列表（设计 12.1）：分页、筛选、搜索（订单号前缀、买家邮箱、卡密精确匹配、状态、时间、开票、售后），导出 CSV（仅店主）。
 * 列表里没有任何交付凭据；卡密、交付信息、验证码只在订单详情里点「查看」才加载（每次查看留痕）。
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Download, MessageCircle, Search } from 'lucide-react'
import type { PartnerListingDTO, PartnerOrderListRow } from '@/lib/tenant/types'
import { gotoLogin, partnerApi, qs } from '../common/api'
import { afterSaleStatusText, cnTime, deliveryText, payText, settleText, yuan } from '../common/format'
import { Badge, Button, Card, Empty, ErrorBox, Field, inputCls, Loading, Notice, PageTitle, Pager } from '../common/ui'

interface Filters {
  orderNo: string
  email: string
  card: string
  /** 商品：上架编号（服务端换算成商品） */
  listingNo: string
  /** '1' = 只看有未读买家留言的订单 */
  unread: string
  payStatus: string
  deliveryStatus: string
  settle: string
  invoice: string
  afterSale: string
  from: string
  to: string
}
const EMPTY: Filters = { orderNo: '', email: '', card: '', listingNo: '', unread: '', payStatus: '', deliveryStatus: '', settle: '', invoice: '', afterSale: '', from: '', to: '' }
const PAGE_SIZE = 20

export function payTone(s: string): 'green' | 'gray' | 'red' {
  return s === 'PAID' ? 'green' : s === 'REFUNDED' ? 'red' : 'gray'
}
export function deliveryTone(s: string): 'green' | 'amber' | 'gray' | 'red' {
  return s === 'DELIVERED' ? 'green' : s === 'CANCELLED' ? 'red' : s === 'PROCESSING' ? 'amber' : 'gray'
}

export function OrdersView({ canExport, canCatalog, initialUnread }: { canExport?: boolean; canCatalog?: boolean; initialUnread?: boolean }) {
  const initial: Filters = initialUnread ? { ...EMPTY, unread: '1' } : EMPTY
  const [draft, setDraft] = useState<Filters>(initial)
  const [filters, setFilters] = useState<Filters>(initial)
  // 商品下拉的选项：本店商品池（catalog.read）。没有该权限的成员不显示商品筛选（接口会 404）
  const [listings, setListings] = useState<{ listingNo: string; name: string }[] | null>(null)
  useEffect(() => {
    if (!canCatalog) return
    let alive = true
    partnerApi<{ rows: PartnerListingDTO[] }>('/api/partner/catalog').then((r) => {
      if (alive && r.ok) setListings(r.data.rows.map((l) => ({ listingNo: l.listingNo, name: l.name })))
    })
    return () => {
      alive = false
    }
  }, [canCatalog])
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ total: number; rows: PartnerOrderListRow[] } | null>(null)
  const [err, setErr] = useState('')
  const [exporting, setExporting] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'red' | 'green'; text: string } | null>(null)

  const query = useCallback((f: Filters) => ({ ...f, card: f.card }), [])

  const load = useCallback(async () => {
    setErr('')
    const r = await partnerApi<{ total: number; rows: PartnerOrderListRow[] }>(`/api/partner/orders${qs({ ...query(filters), page, pageSize: PAGE_SIZE })}`)
    if (r.ok) setData(r.data)
    else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }, [filters, page, query])

  useEffect(() => {
    load()
  }, [load])

  const set = (k: keyof Filters) => (e: { target: { value: string } }) => setDraft((d) => ({ ...d, [k]: e.target.value }))
  const search = () => {
    setPage(1)
    setFilters({ ...draft })
  }
  const clear = () => {
    setDraft(EMPTY)
    setFilters(EMPTY)
    setPage(1)
  }

  const doExport = async () => {
    setExporting(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/partner/orders/export${qs({ ...query(filters) })}`, { credentials: 'same-origin', cache: 'no-store' })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        if (res.status === 401) return gotoLogin()
        setMsg({ tone: 'red', text: j?.error || '导出失败' })
        return
      }
      const blob = await res.blob()
      const cd = res.headers.get('content-disposition') || ''
      const name = /filename="([^"]+)"/.exec(cd)?.[1] || 'orders.csv'
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(a.href), 5000)
      setMsg({ tone: 'green', text: '已导出（文件首行带导出人与时间水印，仅用于本店售后）' })
    } catch {
      setMsg({ tone: 'red', text: '网络异常，导出失败' })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageTitle
        title="订单"
        desc="本店的全部订单。按卡密搜索需输入完整卡密（精确匹配）。"
        extra={
          canExport && (
            <Button onClick={doExport} loading={exporting} size="sm">
              <Download className="h-3.5 w-3.5" />
              导出 CSV
            </Button>
          )
        }
      />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="订单号">
            <input className={inputCls} value={draft.orderNo} onChange={set('orderNo')} placeholder="订单号或前缀" />
          </Field>
          <Field label="买家邮箱">
            <input className={inputCls} value={draft.email} onChange={set('email')} placeholder="至少 3 个字符" />
          </Field>
          <Field label="卡密">
            <input className={inputCls} value={draft.card} onChange={set('card')} placeholder="完整卡密" />
          </Field>
          {listings && (
            <Field label="商品">
              <select className={inputCls} value={draft.listingNo} onChange={set('listingNo')}>
                <option value="">全部</option>
                {listings.map((l) => (
                  <option key={l.listingNo} value={l.listingNo}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="买家留言">
            <select className={inputCls} value={draft.unread} onChange={set('unread')}>
              <option value="">全部</option>
              <option value="1">有未读留言</option>
            </select>
          </Field>
          <Field label="支付状态">
            <select className={inputCls} value={draft.payStatus} onChange={set('payStatus')}>
              <option value="">全部</option>
              <option value="UNPAID">未付款</option>
              <option value="PAID">已付款</option>
              <option value="REFUNDED">已退款</option>
            </select>
          </Field>
          <Field label="交付状态">
            <select className={inputCls} value={draft.deliveryStatus} onChange={set('deliveryStatus')}>
              <option value="">全部</option>
              <option value="PENDING">待交付</option>
              <option value="PROCESSING">处理中</option>
              <option value="DELIVERED">已交付</option>
              <option value="CANCELLED">已取消</option>
            </select>
          </Field>
          <Field label="结算状态">
            <select className={inputCls} value={draft.settle} onChange={set('settle')}>
              <option value="">全部</option>
              <option value="ACCRUED">冻结中</option>
              <option value="RELEASED">已解冻</option>
              <option value="REVERSED">已冲销</option>
              <option value="EXCLUDED">不计余额</option>
              <option value="MISSING">待补记</option>
              <option value="NONE">未计提</option>
            </select>
          </Field>
          <Field label="开票">
            <select className={inputCls} value={draft.invoice} onChange={set('invoice')}>
              <option value="">全部</option>
              <option value="yes">有开票</option>
              <option value="no">未开票</option>
            </select>
          </Field>
          <Field label="售后">
            <select className={inputCls} value={draft.afterSale} onChange={set('afterSale')}>
              <option value="">全部</option>
              <option value="pending">有待处理申请</option>
              <option value="any">申请过售后</option>
              <option value="none">从未申请</option>
            </select>
          </Field>
          <Field label="下单日期从">
            <input className={inputCls} type="date" value={draft.from} onChange={set('from')} />
          </Field>
          <Field label="到">
            <input className={inputCls} type="date" value={draft.to} onChange={set('to')} />
          </Field>
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="primary" onClick={search}>
            <Search className="h-4 w-4" />
            查询
          </Button>
          <Button onClick={clear}>重置</Button>
        </div>
      </Card>

      {err ? (
        <ErrorBox message={err} onRetry={load} />
      ) : !data ? (
        <Loading />
      ) : data.rows.length === 0 ? (
        <Card>
          <Empty text="没有符合条件的订单" />
        </Card>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-2">订单号 / 下单时间</th>
                  <th className="px-3 py-2">商品</th>
                  <th className="px-3 py-2">买家</th>
                  <th className="px-3 py-2 text-right">货款</th>
                  <th className="px-3 py-2">支付 / 交付</th>
                  <th className="px-3 py-2">结算</th>
                  <th className="px-3 py-2">售后</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.rows.map((o) => (
                  <tr key={o.orderNo} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <Link href={`/partner/orders/${encodeURIComponent(o.orderNo)}`} className="font-medium text-primary-600 hover:underline">
                        {o.orderNo}
                      </Link>
                      <div className="text-xs text-gray-400">{cnTime(o.createdAt)}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="max-w-[240px] truncate text-gray-800" title={o.productName}>
                        {o.productName}
                      </div>
                      <div className="text-xs text-gray-400">× {o.quantity}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-gray-700">{o.buyer.email}</div>
                      {o.unreadMessages > 0 && (
                        <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-red-600">
                          <MessageCircle className="h-3 w-3" />
                          {o.unreadMessages} 条未读
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {yuan(o.amountCents)}
                      {o.invoiceTaxCents > 0 && <div className="text-xs text-gray-400">税费 {yuan(o.invoiceTaxCents)}</div>}
                      {o.refundedGoodsCents > 0 && <div className="text-xs text-red-500">已退 {yuan(o.refundedGoodsCents)}</div>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col items-start gap-1">
                        <Badge tone={payTone(o.payStatus)}>{payText(o.payStatus)}</Badge>
                        <Badge tone={deliveryTone(o.deliveryStatus)}>{deliveryText(o.deliveryStatus)}</Badge>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">{o.payStatus === 'UNPAID' ? '—' : settleText(o.settleState)}</td>
                    <td className="px-3 py-2">
                      {o.afterSaleStatus ? <Badge tone={o.afterSaleStatus === 'PENDING' ? 'amber' : 'gray'}>{afterSaleStatusText(o.afterSaleStatus)}</Badge> : <span className="text-gray-300">—</span>}
                      {o.escalatedAt && (
                        <div className="mt-1">
                          <Badge tone="purple">已升级</Badge>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-3 pb-3">
            <Pager page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}
