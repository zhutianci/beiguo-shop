'use client'

/**
 * 看板（设计 12.1）：今日 / 近 7 日 / 本月的订单数与各成分金额；冻结中与可结算两组「余额 / 手续费 / 预计打款」并列写公式；
 * 待办（未读留言、待处理售后、被自动下架的商品、可申请结算提示）；本月销量 Top 商品。
 * 金额全部来自服务端（经账本门面按单求和），前端只负责显示。
 * 没有 finance.read 的成员（STAFF）：服务端不给 balances 与 canApply（null），这里就整块不渲染余额卡片与「申请结算」待办；
 * 三个时段里的「余额 / 预计打款」也为 null（主会话 D5），同样不渲染。
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import type { TenantBalances } from '@/lib/tenant/types'
import { gotoLogin, partnerApi } from '../common/api'
import { deduct, yuan } from '../common/format'
import { Card, ErrorBox, Loading, PageTitle, Stat } from '../common/ui'

interface PeriodStats {
  orders: number
  goodsCents: number
  purchaseCents: number
  invShareCents: number
  feeCents: number
  /** 无 finance.read 时服务端给 null（主会话 D5），这里不渲染这两格 */
  balanceCents: number | null
  payoutCents: number | null
}
interface Dashboard {
  today: PeriodStats
  d7: PeriodStats
  month: PeriodStats
  balances: TenantBalances | null
  todo: { unreadMessages: number; pendingAfterSales: number; autoDelisted: number; canApply: boolean | null }
  topProducts: { name: string; qty: number }[]
}

/** 扣减项（进货款、手续费）按实际方向显示：正常扣减「−」、退款冲回「+」（format.ts deduct 的注释） */
const neg = deduct

function PeriodCard({ title, s }: { title: string; s: PeriodStats }) {
  return (
    <Card title={title}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="订单数" value={s.orders} />
        <Stat label="货款" value={yuan(s.goodsCents)} />
        <Stat label="进货款" value={neg(s.purchaseCents)} />
        <Stat label="发票分成" value={yuan(s.invShareCents)} />
        <Stat label="手续费" value={neg(s.feeCents)} />
        {s.balanceCents !== null && <Stat label="余额" value={yuan(s.balanceCents)} tone={s.balanceCents < 0 ? 'red' : undefined} />}
        {s.payoutCents !== null && <Stat label="预计打款" value={yuan(s.payoutCents)} tone={s.payoutCents < 0 ? 'red' : 'green'} />}
      </div>
    </Card>
  )
}

export function DashboardView() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setErr('')
    const r = await partnerApi<Dashboard>('/api/partner/dashboard')
    if (r.ok) setData(r.data)
    else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (err) return <ErrorBox message={err} onRetry={load} />
  if (!data) return <Loading />
  const b = data.balances

  return (
    <div className="space-y-4">
      <PageTitle title="看板" desc="按付款时间统计本店订单；金额为扣除退款冲销后的当前值" />

      {b && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="可结算">
              <div className="grid grid-cols-3 gap-2">
                <Stat label="余额" value={yuan(b.available.balanceCents)} tone={b.available.balanceCents < 0 ? 'red' : undefined} sub={b.available.balanceCents < 0 ? '待抵扣' : undefined} />
                <Stat label="手续费" value={neg(b.available.feeCents)} />
                <Stat label="预计打款" value={yuan(b.available.payoutCents)} tone={b.available.payoutCents < 0 ? 'red' : 'green'} />
              </div>
            </Card>
            <Card title="冻结中">
              <div className="grid grid-cols-3 gap-2">
                <Stat label="余额" value={yuan(b.pending.balanceCents)} />
                <Stat label="手续费" value={neg(b.pending.feeCents)} />
                <Stat label="预计打款" value={yuan(b.pending.payoutCents)} />
              </div>
            </Card>
          </div>
          <p className="text-xs text-gray-500">
            余额 = 货款 + 发票分成 − 进货款 ± 售后与调整；手续费 =（货款 + 发票分成）× 费率，逐单四舍五入；预计打款 = 余额 − 手续费。
            结算中：{yuan(b.inPayoutCents)}　累计已打款：{yuan(b.paidTotalCents)}
            {b.depositCents ? `　保证金：${yuan(b.depositCents)}` : ''}
          </p>
          {b.negative && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4" />
              可结算余额为负（售后冲销所致），将从后续订单中抵扣。
            </div>
          )}
        </>
      )}

      <Card title="待办">
        <div className={`grid gap-2 ${data.todo.canApply === null ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}>
          <TodoLink href="/partner/orders?unread=1" label="未读买家留言" n={data.todo.unreadMessages} />
          <TodoLink href="/partner/after-sales?status=PENDING" label="待处理售后申请" n={data.todo.pendingAfterSales} />
          <TodoLink href="/partner/products" label="被自动下架的商品" n={data.todo.autoDelisted} />
          {data.todo.canApply !== null && (
            <Link href="/partner/finance" className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm hover:bg-gray-100">
              <span className="text-gray-600">申请结算</span>
              <span className={data.todo.canApply ? 'font-semibold text-emerald-600' : 'text-gray-400'}>{data.todo.canApply ? '可申请' : '暂不可申请'}</span>
            </Link>
          )}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <PeriodCard title="今日" s={data.today} />
        <PeriodCard title="近 7 日" s={data.d7} />
        <PeriodCard title="本月" s={data.month} />
      </div>

      <Card title="本月销量 Top">
        {data.topProducts.length === 0 ? (
          <p className="text-sm text-gray-400">本月暂无成交</p>
        ) : (
          <ol className="space-y-1.5 text-sm">
            {data.topProducts.map((p, i) => (
              <li key={p.name + i} className="flex justify-between">
                <span className="text-gray-700">
                  {i + 1}. {p.name}
                </span>
                <span className="tabular-nums text-gray-500">{p.qty} 件</span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  )
}

function TodoLink({ href, label, n }: { href: string; label: string; n: number }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm hover:bg-gray-100">
      <span className="text-gray-600">{label}</span>
      <span className="flex items-center gap-1">
        <span className={n > 0 ? 'font-semibold text-red-600' : 'text-gray-400'}>{n}</span>
        <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
      </span>
    </Link>
  )
}
