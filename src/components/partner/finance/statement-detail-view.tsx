'use client'

/**
 * 结算单详情（设计 10.9、12.1）：成分拆分、纳入明细、收款人快照（账号只给掩码）、打款日期、流水号后四位、凭证类型、
 * 下载对账单 CSV（合计 = 打款净额）。
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import type { StatementDetailDTO } from '@/lib/tenant/types'
import { gotoLogin, partnerApi } from '../common/api'
import { cnTime, yuan } from '../common/format'
import { Badge, Button, Card, Empty, ErrorBox, Loading, Notice, PageTitle, Stat } from '../common/ui'
import { downloadCsv } from '../customers/csv-download'
import { COMPONENT_TEXT, LEDGER_TYPE_TEXT, PAYEE_METHOD_TEXT, STATEMENT_ORIGIN_TEXT, STATEMENT_STATE_TEXT, VOUCHER_TEXT, txt } from './finance-text'
import { stateTone } from './statements-view'

export function StatementDetailView({ statementNo }: { statementNo: string }) {
  const [d, setD] = useState<StatementDetailDTO | null>(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState<{ tone: 'green' | 'red'; text: string } | null>(null)
  const [downloading, setDownloading] = useState(false)
  const base = `/api/partner/finance/statements/${encodeURIComponent(statementNo)}`

  const load = useCallback(async () => {
    setErr('')
    const r = await partnerApi<StatementDetailDTO>(base)
    if (r.ok) setD(r.data)
    else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }, [base])

  useEffect(() => {
    load()
  }, [load])

  const download = async () => {
    setDownloading(true)
    setMsg(null)
    const r = await downloadCsv(`${base}/export`, `statement-${statementNo}.csv`)
    setDownloading(false)
    if (!r.ok) setMsg({ tone: 'red', text: r.error })
  }

  if (err) return <ErrorBox message={err} onRetry={load} />
  if (!d) return <Loading />

  return (
    <div className="space-y-4">
      <Link href="/partner/finance/statements" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4" />
        返回结算单列表
      </Link>
      <PageTitle
        title={`结算单 ${d.statementNo}`}
        desc={`第 ${d.seq} 期 · ${txt(STATEMENT_ORIGIN_TEXT, d.origin)} · 截止 ${cnTime(d.periodEnd)}`}
        extra={
          <div className="flex items-center gap-2">
            <Badge tone={stateTone(d.state)}>{txt(STATEMENT_STATE_TEXT, d.state)}</Badge>
            <Button size="sm" onClick={download} loading={downloading}>
              <Download className="h-4 w-4" />
              对账单 CSV
            </Button>
          </div>
        }
      />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <Stat label="货款" value={yuan(d.goodsCents)} />
        <Stat label="进货款" value={yuan(d.purchaseCents)} />
        <Stat label="发票分成" value={yuan(d.invShareCents)} />
        <Stat label="售后与调整" value={yuan(d.otherCents)} />
        <Stat label="余额" value={yuan(d.grossCents)} />
        <Stat label="手续费" value={yuan(d.feeCents)} />
        <Stat label="打款净额" value={yuan(d.netCents)} tone="green" />
      </div>
      <Card title="收款与打款">
        <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-gray-500">收款人（出单时快照）</dt>
            <dd>
              {d.payee.name} · {txt(PAYEE_METHOD_TEXT, d.payee.method)} · {d.payee.accountMasked}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">凭证类型</dt>
            <dd>{txt(VOUCHER_TEXT, d.voucherType)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">打款时间</dt>
            <dd>{cnTime(d.paidAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">转账流水号</dt>
            <dd>
              {d.tradeNoLast4 ? `尾号 ${d.tradeNoLast4}` : '—'}
              {d.proofUploaded ? ' · 已上传打款凭证' : ''}
            </dd>
          </div>
        </dl>
      </Card>
      <Card title={`纳入明细（${d.lines.length} 条）`}>
        {d.lines.length === 0 ? (
          <Empty />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-gray-500">
                <tr>
                  <th className="px-2 py-2 font-medium">时间</th>
                  <th className="px-2 py-2 font-medium">类型</th>
                  <th className="px-2 py-2 font-medium">成分</th>
                  <th className="px-2 py-2 font-medium">订单</th>
                  <th className="px-2 py-2 text-right font-medium">金额</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {d.lines.map((l, i) => (
                  <tr key={i}>
                    <td className="whitespace-nowrap px-2 py-2 text-gray-500">{cnTime(l.at, true)}</td>
                    <td className="px-2 py-2">{txt(LEDGER_TYPE_TEXT, l.type)}</td>
                    <td className="px-2 py-2">{txt(COMPONENT_TEXT, l.component)}</td>
                    <td className="px-2 py-2 font-mono text-xs">
                      {l.orderNo ? (
                        <Link href={`/partner/orders/${encodeURIComponent(l.orderNo)}`} className="text-primary-700 hover:underline">
                          {l.orderNo}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={`px-2 py-2 text-right tabular-nums ${l.amountCents < 0 ? 'text-red-600' : ''}`}>{yuan(l.amountCents, { sign: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
