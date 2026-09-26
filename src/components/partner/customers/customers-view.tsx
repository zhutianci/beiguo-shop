'use client'

/**
 * 本站用户列表（设计 12.1）：明文邮箱、首次到店、本站订单数 / 实付 / 退款 / 开票数、最近下单、标签、拉黑状态。
 * 搜索：邮箱（含 @ 时精确或前缀，≥ 3 字符）或昵称；标签、是否拉黑、时间范围（最近下单 / 首单 / 首次到店）。
 * 所有汇总只统计本站订单；这里看不到用户在主站或其他渠道的任何数据。导出 CSV 仅店主、每日 5 次、带水印。
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Download, Search } from 'lucide-react'
import type { PartnerCustomerRow } from '@/lib/tenant/types'
import { gotoLogin, partnerApi, qs } from '../common/api'
import { cnTime, yuan } from '../common/format'
import { Badge, Button, Card, Empty, ErrorBox, Field, inputCls, Loading, Notice, PageTitle, Pager } from '../common/ui'
import { downloadCsv } from './csv-download'

interface Filters {
  q: string
  tag: string
  blocked: string
  dateBy: string
  from: string
  to: string
  sort: string
}
const EMPTY: Filters = { q: '', tag: '', blocked: '', dateBy: 'last', from: '', to: '', sort: 'recent' }
const PAGE_SIZE = 20

export function CustomersView({ canExport }: { canExport?: boolean }) {
  const [draft, setDraft] = useState<Filters>(EMPTY)
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ total: number; rows: PartnerCustomerRow[] } | null>(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState<{ tone: 'red' | 'green'; text: string } | null>(null)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    setErr('')
    const r = await partnerApi<{ total: number; rows: PartnerCustomerRow[] }>(`/api/partner/customers${qs({ ...filters, page, pageSize: PAGE_SIZE })}`)
    if (r.ok) setData(r.data)
    else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }, [filters, page])

  useEffect(() => {
    load()
  }, [load])

  const set = (k: keyof Filters) => (e: { target: { value: string } }) => setDraft((d) => ({ ...d, [k]: e.target.value }))
  const search = () => {
    setPage(1)
    setFilters(draft)
  }
  const reset = () => {
    setDraft(EMPTY)
    setFilters(EMPTY)
    setPage(1)
  }
  const doExport = async () => {
    setExporting(true)
    setMsg(null)
    const r = await downloadCsv(`/api/partner/customers/export${qs({ ...filters })}`, 'customers.csv')
    setExporting(false)
    setMsg(r.ok ? { tone: 'green', text: '已导出（文件首行带导出人与时间水印，仅用于本店售后）' } : { tone: 'red', text: r.error })
  }

  return (
    <div className="space-y-4">
      <PageTitle
        title="客户"
        desc="在本店注册或下过单的用户。订单数、实付、退款、开票都只统计本店订单。"
        extra={
          canExport ? (
            <Button size="sm" onClick={doExport} loading={exporting}>
              <Download className="h-4 w-4" />
              导出 CSV
            </Button>
          ) : null
        }
      />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="邮箱或昵称" hint="邮箱支持精确或前缀（至少 3 个字符）">
            <input className={inputCls} value={draft.q} onChange={set('q')} onKeyDown={(e) => e.key === 'Enter' && search()} maxLength={128} placeholder="name@ 或 昵称" />
          </Field>
          <Field label="标签">
            <input className={inputCls} value={draft.tag} onChange={set('tag')} maxLength={12} placeholder="精确匹配一个标签" />
          </Field>
          <Field label="本站限制下单">
            <select className={inputCls} value={draft.blocked} onChange={set('blocked')}>
              <option value="">全部</option>
              <option value="yes">已限制</option>
              <option value="no">未限制</option>
            </select>
          </Field>
          <Field label="排序">
            <select className={inputCls} value={draft.sort} onChange={set('sort')}>
              <option value="recent">最近下单</option>
              <option value="joined">首次到店</option>
            </select>
          </Field>
          <Field label="时间按">
            <select className={inputCls} value={draft.dateBy} onChange={set('dateBy')}>
              <option value="last">最近下单</option>
              <option value="first">首单</option>
              <option value="joined">首次到店</option>
            </select>
          </Field>
          <Field label="起始日期">
            <input type="date" className={inputCls} value={draft.from} onChange={set('from')} />
          </Field>
          <Field label="截止日期">
            <input type="date" className={inputCls} value={draft.to} onChange={set('to')} />
          </Field>
          <div className="flex items-end gap-2">
            <Button variant="primary" onClick={search}>
              <Search className="h-4 w-4" />
              搜索
            </Button>
            <Button onClick={reset}>重置</Button>
          </div>
        </div>
      </Card>

      {err ? (
        <ErrorBox message={err} onRetry={load} />
      ) : !data ? (
        <Loading />
      ) : data.rows.length === 0 ? (
        <Card>
          <Empty text="没有符合条件的客户" />
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">客户</th>
                <th className="px-3 py-2 font-medium">首次到店</th>
                <th className="px-3 py-2 font-medium">最近下单</th>
                <th className="px-3 py-2 text-right font-medium">订单</th>
                <th className="px-3 py-2 text-right font-medium">实付</th>
                <th className="px-3 py-2 text-right font-medium">退款 / 开票</th>
                <th className="px-3 py-2 font-medium">标签</th>
                <th className="px-3 py-2 font-medium">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.rows.map((c) => (
                <tr key={c.customerNo} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <Link href={`/partner/customers/${encodeURIComponent(c.customerNo)}`} className="font-medium text-primary-700 hover:underline">
                      {c.email}
                    </Link>
                    <div className="text-xs text-gray-400">
                      {c.nickname || '—'} · {c.customerNo}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">{cnTime(c.firstSeenAt)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">{cnTime(c.lastOrderAt)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{c.orderCount}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{yuan(c.paidCents)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {c.refundCount} / {c.invoiceCount}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.map((t) => (
                        <Badge key={t} tone="blue">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">{c.blocked ? <Badge tone="red">{c.blockedByPlatform ? '平台限制' : '本站限制'}</Badge> : <Badge tone="green">正常</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-3 pb-3">
            <Pager page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}
