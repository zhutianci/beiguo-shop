'use client'

/**
 * 结算单列表（设计 10.9、12.1）：期次、来源（周期 / 申请 / 临时）、截止时间、成分拆分、打款净额、状态、打款日期与流水号后四位。
 * 结算单金额生成后永不修改；有问题由站长退回或下期调账。
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import type { StatementDetailDTO } from '@/lib/tenant/types'
import { gotoLogin, partnerApi, qs } from '../common/api'
import { cnTime, yuan } from '../common/format'
import { Badge, Card, Empty, ErrorBox, Loading, PageTitle, Pager } from '../common/ui'
import { STATEMENT_ORIGIN_TEXT, STATEMENT_STATE_TEXT, txt } from './finance-text'

type Row = Omit<StatementDetailDTO, 'lines' | 'payee'>

export function stateTone(s: string): 'green' | 'amber' | 'red' | 'gray' | 'blue' {
  return s === 'PAID' || s === 'RECEIVED' ? 'green' : s === 'PAYING' ? 'blue' : s === 'RETURNED' ? 'red' : s === 'DISPUTED' ? 'amber' : 'gray'
}

export function StatementsView() {
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ total: number; rows: Row[]; pageSize: number } | null>(null)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setErr('')
    const r = await partnerApi<{ total: number; rows: Row[]; pageSize: number }>(`/api/partner/finance/statements${qs({ page })}`)
    if (r.ok) setData(r.data)
    else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-4">
      <PageTitle
        title="结算单"
        desc="每张结算单的打款净额 = 纳入明细之和；站长打款时转账备注会写结算单号，方便你对账。"
        extra={
          <Link href="/partner/finance" className="text-sm text-primary-700 hover:underline">
            返回结算中心
          </Link>
        }
      />
      {err ? (
        <ErrorBox message={err} onRetry={load} />
      ) : !data ? (
        <Loading />
      ) : data.rows.length === 0 ? (
        <Card>
          <Empty text="还没有结算单" />
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">结算单</th>
                <th className="px-3 py-2 font-medium">来源</th>
                <th className="px-3 py-2 font-medium">截止</th>
                <th className="px-3 py-2 text-right font-medium">货款</th>
                <th className="px-3 py-2 text-right font-medium">进货款</th>
                <th className="px-3 py-2 text-right font-medium">发票分成</th>
                <th className="px-3 py-2 text-right font-medium">手续费</th>
                <th className="px-3 py-2 text-right font-medium">其他</th>
                <th className="px-3 py-2 text-right font-medium">打款净额</th>
                <th className="px-3 py-2 font-medium">状态</th>
                <th className="px-3 py-2 font-medium">打款</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.rows.map((s) => (
                <tr key={s.statementNo} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <Link href={`/partner/finance/statements/${encodeURIComponent(s.statementNo)}`} className="font-mono text-primary-700 hover:underline">
                      {s.statementNo}
                    </Link>
                    <div className="text-xs text-gray-400">第 {s.seq} 期</div>
                  </td>
                  <td className="px-3 py-2">{txt(STATEMENT_ORIGIN_TEXT, s.origin)}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-500">{cnTime(s.periodEnd)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{yuan(s.goodsCents)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{yuan(s.purchaseCents)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{yuan(s.invShareCents)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{yuan(s.feeCents)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{yuan(s.otherCents)}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{yuan(s.netCents)}</td>
                  <td className="px-3 py-2">
                    <Badge tone={stateTone(s.state)}>{txt(STATEMENT_STATE_TEXT, s.state)}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">
                    {s.paidAt ? `${cnTime(s.paidAt)} · 尾号 ${s.tradeNoLast4 ?? '—'}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-3 pb-3">
            <Pager page={page} pageSize={data.pageSize || 20} total={data.total} onChange={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}
