'use client'

/**
 * /admin/tenants/overview：运营概览（仅超管，设计 10.13、12.2）。各渠道 GMV、货款、进货款（站长营收）、发票利润、手续费收入、卡差价、
 * 待结算、负余额、退款率、待处理售后。口径说明写在表下，数字来自分录与订单实时汇总。
 */
import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge, Notice, StatusBadge, useApi, yuan } from './common'

interface Row {
  tenantId: number
  code: string
  status: string
  gmvCents: number
  goodsCents: number
  purchaseCents: number
  invoiceProfitCents: number
  feeIncomeCents: number
  cardMarginCents: number
  platformBorneRefundCents: number
  lossCents: number
  availableCents: number
  pendingCents: number
  negative: boolean
  refundRateBp: number
  pendingAfterSales: number
}

export default function OverviewView() {
  const [range, setRange] = useState<'month' | 'lastMonth' | 'all'>('month')
  const { data, error, loading } = useApi<{ range: string; rows: Row[] }>(`/api/admin/tenants/overview?range=${range}`)
  const rows = data?.rows ?? []
  const sum = (k: keyof Row) => rows.reduce((s, r) => s + (Number(r[k]) || 0), 0)
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>渠道运营概览</CardTitle>
        <select className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" value={range} onChange={(e) => setRange(e.target.value as typeof range)}>
          <option value="month">本月（东八区）</option>
          <option value="lastMonth">上月</option>
          <option value="all">全部</option>
        </select>
      </CardHeader>
      <CardContent>
        {error && <Notice kind="error">{error}</Notice>}
        {loading && !data ? (
          <div className="py-12 text-center text-gray-400">加载中...</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-gray-400">还没有渠道</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">渠道</th>
                  <th className="pb-2 text-right">GMV</th>
                  <th className="pb-2 text-right">货款</th>
                  <th className="pb-2 text-right">进货款（站长营收）</th>
                  <th className="pb-2 text-right">卡差价</th>
                  <th className="pb-2 text-right">发票利润</th>
                  <th className="pb-2 text-right">手续费收入</th>
                  <th className="pb-2 text-right">站长承担退款</th>
                  <th className="pb-2 text-right">渠道承担损失</th>
                  <th className="pb-2 text-right">可结算</th>
                  <th className="pb-2 text-right">冻结中</th>
                  <th className="pb-2 text-right">退款率</th>
                  <th className="pb-2 text-right">待处理售后</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.tenantId} className="border-b border-gray-50">
                    <td className="py-2">
                      <Link className="font-medium text-primary-700 hover:underline" href={`/admin/tenants/${r.tenantId}`}>
                        {r.code}
                      </Link>{' '}
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-2 text-right">{yuan(r.gmvCents)}</td>
                    <td className="py-2 text-right">{yuan(r.goodsCents)}</td>
                    <td className="py-2 text-right">{yuan(r.purchaseCents)}</td>
                    <td className={`py-2 text-right ${r.cardMarginCents < 0 ? 'text-red-600' : ''}`}>{yuan(r.cardMarginCents)}</td>
                    <td className="py-2 text-right">{yuan(r.invoiceProfitCents)}</td>
                    <td className="py-2 text-right">{yuan(r.feeIncomeCents)}</td>
                    <td className={`py-2 text-right ${r.platformBorneRefundCents > 0 ? 'text-red-600' : ''}`}>{yuan(-r.platformBorneRefundCents)}</td>
                    <td className="py-2 text-right">{yuan(r.lossCents)}</td>
                    <td className={`py-2 text-right ${r.negative ? 'font-semibold text-red-600' : ''}`}>
                      {yuan(r.availableCents)} {r.negative && <Badge tone="bg-red-100 text-red-700">负</Badge>}
                    </td>
                    <td className="py-2 text-right">{yuan(r.pendingCents)}</td>
                    <td className="py-2 text-right">{(r.refundRateBp / 100).toFixed(2)}%</td>
                    <td className="py-2 text-right">{r.pendingAfterSales}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-2">合计</td>
                  <td className="py-2 text-right">{yuan(sum('gmvCents'))}</td>
                  <td className="py-2 text-right">{yuan(sum('goodsCents'))}</td>
                  <td className="py-2 text-right">{yuan(sum('purchaseCents'))}</td>
                  <td className="py-2 text-right">{yuan(sum('cardMarginCents'))}</td>
                  <td className="py-2 text-right">{yuan(sum('invoiceProfitCents'))}</td>
                  <td className="py-2 text-right">{yuan(sum('feeIncomeCents'))}</td>
                  <td className="py-2 text-right">{yuan(-sum('platformBorneRefundCents'))}</td>
                  <td className="py-2 text-right">{yuan(sum('lossCents'))}</td>
                  <td className="py-2 text-right">{yuan(sum('availableCents'))}</td>
                  <td className="py-2 text-right">{yuan(sum('pendingCents'))}</td>
                  <td />
                  <td className="py-2 text-right">{sum('pendingAfterSales')}</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3 text-xs text-gray-400">
              按付款时间归期。GMV = 买家货款（不含税，含后来退掉的）；货款 / 进货款 / 手续费为冲销后的净值；卡差价 = 进货款 − 已发卡与接码的登记成本（人工交付没有成本记录，按 0）；
              发票利润 = 实收税费净额 − 发票分成净额；站长承担退款 = 站长承担、退给买家的货款（负数 = 站长出钱）；渠道承担损失 = 售后里由渠道承担、记给站长的损失（LOSS）。
              站长所得 ≈ 卡差价 + 发票利润 + 手续费收入 + 渠道承担损失 + 站长承担退款（设计 10.13）；可结算 / 冻结中为当前的预计打款口径（不分时段）。唯一金额尾差与少付不计入。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
