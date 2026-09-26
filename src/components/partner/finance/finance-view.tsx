'use client'

/**
 * 结算中心（设计 10.8、12.1）：三个数（余额 / 手续费 / 预计打款）与构成、冻结中与结算中、累计打款、保证金、
 * 固定公式、预计可结算日历、申请结算（显示不可申请的原因）、流水与订单明细两个标签页。
 * 页面不做任何金额计算：全部数字来自服务端（分录求和），这里只格式化显示。
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import type { BalanceComposition, BalanceTriple, GenerateResult, LedgerRowDTO, OrderSettlementView, TenantBalances } from '@/lib/tenant/types'
import { gotoLogin, partnerApi, qs } from '../common/api'
import { BEARER_TEXT, bpText, cnTime, invShareText, settleText, deduct, yuan } from '../common/format'
import { Badge, Button, Card, Empty, ErrorBox, Field, inputCls, Loading, Modal, Notice, PageTitle, Pager, Stat } from '../common/ui'
import { APPLY_REASON_TEXT, BUCKET_TEXT, COMPONENT_TEXT, LEDGER_TYPE_TEXT, newRequestId, txt } from './finance-text'

interface Summary {
  balances: TenantBalances
  composition: { available: BalanceComposition; pending: BalanceComposition }
  rates: { feeRateBp: number; invoiceShareRateBp: number; holdDays: number; minPayoutCents: number; requestIntervalDays: number }
  formula: string
  canApply: boolean
  applyBlockReason?: string
  nextApplyAt?: string
  releaseCalendar: { date: string; payoutCents: number }[]
}
type FinOrderRow = OrderSettlementView & {
  productName: string
  quantity: number
  paidAt: string | null
  refundedGoodsCents: number
  refundedTaxCents: number
  settleBearer: string | null
}

/** 扣减项（进货款、手续费）按实际方向显示：正常扣减「−」、退款冲回「+」（format.ts deduct 的注释） */
const neg = deduct

function Triple({ title, t, c, tone }: { title: string; t: BalanceTriple; c?: BalanceComposition; tone?: 'main' }) {
  return (
    <Card title={title}>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="余额" value={yuan(t.balanceCents)} tone={t.balanceCents < 0 ? 'red' : undefined} sub={t.balanceCents < 0 ? '待抵扣' : undefined} />
        <Stat label="手续费" value={neg(t.feeCents)} />
        <Stat label="预计打款" value={yuan(t.payoutCents)} tone={t.payoutCents < 0 ? 'red' : tone === 'main' ? 'green' : undefined} />
      </div>
      {/* 余额构成（设计 10.8、12.1）：货款 − 进货款 + 发票分成 ± 售后与调整 = 余额；余额 − 手续费 = 预计打款 */}
      {c && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-gray-100 pt-2 text-xs text-gray-500">
          <span>
            货款 <span className="tabular-nums text-gray-700">{yuan(c.goodsCents)}</span>
          </span>
          <span>
            进货款 <span className="tabular-nums text-gray-700">{neg(c.purchaseCents)}</span>
          </span>
          <span>
            发票分成 <span className="tabular-nums text-gray-700">{yuan(c.invShareCents)}</span>
          </span>
          <span>
            售后与调整 <span className="tabular-nums text-gray-700">{yuan(c.otherCents)}</span>
          </span>
          <span>
            手续费 <span className="tabular-nums text-gray-700">{neg(c.feeCents)}</span>
          </span>
        </div>
      )}
    </Card>
  )
}

/** 冲销原因与承担方（订单明细一列）：退了多少货款 / 税费、由谁承担；成员自买等不计余额的单显示状态本身 */
function reversalText(o: FinOrderRow): string {
  const parts: string[] = []
  if (o.refundedGoodsCents > 0) parts.push(`买家退款 ${yuan(o.refundedGoodsCents)}`)
  if (o.refundedTaxCents > 0) parts.push(`退税费 ${yuan(o.refundedTaxCents)}`)
  if (!parts.length) return o.settleState === 'EXCLUDED' ? '不计余额' : '—'
  return `${parts.join('、')}${o.settleBearer ? ` · ${BEARER_TEXT[o.settleBearer] ?? o.settleBearer}` : ''}`
}

export function FinanceView({ canApply: mayApply }: { canApply?: boolean }) {
  const [s, setS] = useState<Summary | null>(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState<{ tone: 'green' | 'red' | 'amber'; text: string } | null>(null)
  const [applyOpen, setApplyOpen] = useState(false)
  const [reqId, setReqId] = useState('')
  const [applying, setApplying] = useState(false)
  const [tab, setTab] = useState<'ledger' | 'orders'>('orders')

  const load = useCallback(async () => {
    setErr('')
    const r = await partnerApi<Summary>('/api/partner/finance/summary')
    if (r.ok) setS(r.data)
    else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openApply = () => {
    setReqId(newRequestId())
    setApplyOpen(true)
  }
  const apply = async () => {
    setApplying(true)
    const r = await partnerApi<GenerateResult>('/api/partner/finance/apply', { method: 'POST', body: { requestId: reqId } })
    setApplying(false)
    setApplyOpen(false)
    if (!r.ok) {
      if (r.needLogin) return gotoLogin()
      setMsg({ tone: 'red', text: r.error })
      return
    }
    const g = r.data
    if (g.ok) setMsg({ tone: 'green', text: `已生成结算单 ${g.statementNo}，打款金额 ${yuan(g.netCents)}，站长打款后会通知你` })
    else setMsg({ tone: 'amber', text: txt(APPLY_REASON_TEXT, g.reason) })
    load()
  }

  if (err) return <ErrorBox message={err} onRetry={load} />
  if (!s) return <Loading />
  const b = s.balances

  return (
    <div className="space-y-4">
      <PageTitle
        title="结算中心"
        desc={`手续费 ${bpText(s.rates.feeRateBp)} · 发票分成 ${bpText(s.rates.invoiceShareRateBp)} · 冻结期 ${s.rates.holdDays} 天 · 最低结算 ${yuan(s.rates.minPayoutCents)} · 申请间隔 ${s.rates.requestIntervalDays} 天`}
        extra={
          <div className="flex items-center gap-2">
            <Link href="/partner/finance/statements" className="text-sm text-primary-700 hover:underline">
              结算单
            </Link>
            {mayApply && (
              <Button variant="primary" onClick={openApply} disabled={!s.canApply} title={s.canApply ? '' : txt(APPLY_REASON_TEXT, s.applyBlockReason)}>
                申请结算
              </Button>
            )}
          </div>
        }
      />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {mayApply && !s.canApply && s.applyBlockReason && (
        <Notice tone="amber">
          暂不能申请结算：{txt(APPLY_REASON_TEXT, s.applyBlockReason)}
          {s.nextApplyAt ? `（最早 ${cnTime(s.nextApplyAt)}）` : ''}
        </Notice>
      )}
      {b.negative && <Notice tone="red">可结算余额为负：后续订单的收入会先抵扣这部分，抵扣完之前不能申请结算。</Notice>}

      <Triple title="可结算" t={b.available} c={s.composition?.available} tone="main" />
      <Triple title="冻结中（交付后满冻结期自动转为可结算）" t={b.pending} c={s.composition?.pending} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="结算中（已出单待打款）" value={yuan(b.inPayoutCents)} />
        <Stat label="累计已打款" value={yuan(b.paidTotalCents)} />
        <Stat label="累计代扣" value={yuan(b.withheldTotalCents)} />
        <Stat label="保证金" value={yuan(b.depositCents)} />
      </div>
      <Notice tone="blue">{s.formula}</Notice>

      <Card title="预计可结算日历（冻结中的订单按交付时间 + 冻结期）">
        {s.releaseCalendar.length === 0 ? (
          <Empty text="暂无冻结中的订单" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {s.releaseCalendar.map((c) => (
              <div key={c.date} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                <div className="text-xs text-gray-500">{c.date}</div>
                <div className="font-semibold tabular-nums">{yuan(c.payoutCents)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex gap-2">
        <Button variant={tab === 'orders' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('orders')}>
          订单明细
        </Button>
        <Button variant={tab === 'ledger' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('ledger')}>
          流水
        </Button>
      </div>
      {tab === 'orders' ? <FinanceOrders /> : <Ledger />}

      <Modal
        open={applyOpen}
        title="申请结算"
        onClose={() => setApplyOpen(false)}
        footer={
          <>
            <Button onClick={() => setApplyOpen(false)}>取消</Button>
            <Button variant="primary" onClick={apply} loading={applying}>
              确认申请
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            将按当前全部可结算金额（预计打款 <b className="text-gray-900">{yuan(b.available.payoutCents)}</b>）生成一张结算单，不能自选金额。
          </p>
          <p>结算单生成后由站长打款到你登记的收款账户；每次申请之间至少间隔 {s.rates.requestIntervalDays} 天。</p>
        </div>
      </Modal>
    </div>
  )
}

const PAGE_SIZE = 20

function FinanceOrders() {
  const [state, setState] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ total: number; rows: FinOrderRow[] } | null>(null)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setErr('')
    const r = await partnerApi<{ total: number; rows: FinOrderRow[] }>(`/api/partner/finance/orders${qs({ state, from, to, page, pageSize: PAGE_SIZE })}`)
    if (r.ok) setData(r.data)
    else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }, [state, from, to, page])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Card>
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="结算状态">
          <select className={inputCls} value={state} onChange={(e) => {
            setPage(1)
            setState(e.target.value)
          }}>
            <option value="">全部</option>
            <option value="ACCRUED">冻结中</option>
            <option value="RELEASED">已解冻</option>
            <option value="REVERSED">已冲销</option>
            <option value="EXCLUDED">不计余额</option>
            <option value="MISSING">待补记</option>
          </select>
        </Field>
        <Field label="付款日期起">
          <input type="date" className={inputCls} value={from} onChange={(e) => {
            setPage(1)
            setFrom(e.target.value)
          }} />
        </Field>
        <Field label="付款日期止">
          <input type="date" className={inputCls} value={to} onChange={(e) => {
            setPage(1)
            setTo(e.target.value)
          }} />
        </Field>
      </div>
      {err ? (
        <ErrorBox message={err} onRetry={load} />
      ) : !data ? (
        <Loading />
      ) : data.rows.length === 0 ? (
        <Empty />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs text-gray-500">
              <tr>
                <th className="px-2 py-2 font-medium">订单</th>
                <th className="px-2 py-2 text-right font-medium">货款</th>
                <th className="px-2 py-2 text-right font-medium">进货款</th>
                <th className="px-2 py-2 text-right font-medium">发票分成</th>
                <th className="px-2 py-2 text-right font-medium">手续费</th>
                <th className="px-2 py-2 text-right font-medium">售后与调整</th>
                <th className="px-2 py-2 font-medium">冲销原因 / 承担方</th>
                <th className="px-2 py-2 text-right font-medium">余额</th>
                <th className="px-2 py-2 text-right font-medium">预计打款</th>
                <th className="px-2 py-2 font-medium">状态</th>
                <th className="px-2 py-2 font-medium">预计可结算</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.rows.map((o) => (
                <tr key={o.orderNo}>
                  <td className="px-2 py-2">
                    <Link href={`/partner/orders/${encodeURIComponent(o.orderNo)}`} className="font-mono text-primary-700 hover:underline">
                      {o.orderNo}
                    </Link>
                    <div className="text-xs text-gray-400">
                      {o.productName} × {o.quantity} · {cnTime(o.paidAt)}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{yuan(o.goodsCents)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{neg(o.purchaseCents)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {yuan(o.invShareCents)}
                    {o.invShareState && <div className="text-xs text-gray-400">{invShareText(o.invShareState)}</div>}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{neg(o.feeCents)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{yuan(o.otherCents)}</td>
                  <td className="px-2 py-2 text-xs text-gray-500">{reversalText(o)}</td>
                  <td className="px-2 py-2 text-right tabular-nums">{yuan(o.balanceCents)}</td>
                  <td className="px-2 py-2 text-right font-medium tabular-nums">{yuan(o.payoutCents)}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-col gap-1">
                      <Badge tone={o.settleState === 'REVERSED' ? 'red' : o.settleState === 'RELEASED' ? 'green' : 'gray'}>{settleText(o.settleState)}</Badge>
                      <span className="text-xs text-gray-400">
                        {txt(BUCKET_TEXT, o.bucket)}
                        {o.statementNo ? ` · ${o.statementNo}` : ''}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-gray-500">{cnTime(o.releaseEta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />
        </div>
      )}
    </Card>
  )
}

function Ledger() {
  const [type, setType] = useState('')
  const [component, setComponent] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ total: number; rows: LedgerRowDTO[] } | null>(null)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setErr('')
    const r = await partnerApi<{ total: number; rows: LedgerRowDTO[] }>(`/api/partner/finance/ledger${qs({ type, component, from, to, page, pageSize: PAGE_SIZE })}`)
    if (r.ok) setData(r.data)
    else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }, [type, component, from, to, page])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Card>
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Field label="类型">
          <select className={inputCls} value={type} onChange={(e) => {
            setPage(1)
            setType(e.target.value)
          }}>
            <option value="">全部</option>
            {Object.keys(LEDGER_TYPE_TEXT).map((k) => (
              <option key={k} value={k}>
                {LEDGER_TYPE_TEXT[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="成分">
          <select className={inputCls} value={component} onChange={(e) => {
            setPage(1)
            setComponent(e.target.value)
          }}>
            <option value="">全部</option>
            {Object.keys(COMPONENT_TEXT).map((k) => (
              <option key={k} value={k}>
                {COMPONENT_TEXT[k]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="日期起">
          <input type="date" className={inputCls} value={from} onChange={(e) => {
            setPage(1)
            setFrom(e.target.value)
          }} />
        </Field>
        <Field label="日期止">
          <input type="date" className={inputCls} value={to} onChange={(e) => {
            setPage(1)
            setTo(e.target.value)
          }} />
        </Field>
      </div>
      {err ? (
        <ErrorBox message={err} onRetry={load} />
      ) : !data ? (
        <Loading />
      ) : data.rows.length === 0 ? (
        <Empty />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs text-gray-500">
              <tr>
                <th className="px-2 py-2 font-medium">时间</th>
                <th className="px-2 py-2 font-medium">类型</th>
                <th className="px-2 py-2 font-medium">成分</th>
                <th className="px-2 py-2 font-medium">位置</th>
                <th className="px-2 py-2 text-right font-medium">金额</th>
                <th className="px-2 py-2 font-medium">订单 / 结算单</th>
                <th className="px-2 py-2 font-medium">说明</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.rows.map((l, i) => (
                <tr key={`${l.at}-${i}`}>
                  <td className="whitespace-nowrap px-2 py-2 text-gray-500">{cnTime(l.at, true)}</td>
                  <td className="px-2 py-2">{txt(LEDGER_TYPE_TEXT, l.type)}</td>
                  <td className="px-2 py-2">{txt(COMPONENT_TEXT, l.component)}</td>
                  <td className="px-2 py-2">{txt(BUCKET_TEXT, l.bucket)}</td>
                  <td className={`px-2 py-2 text-right tabular-nums ${l.amountCents < 0 ? 'text-red-600' : ''}`}>{yuan(l.amountCents, { sign: true })}</td>
                  <td className="px-2 py-2 font-mono text-xs">
                    {l.orderNo ? (
                      <Link href={`/partner/orders/${encodeURIComponent(l.orderNo)}`} className="text-primary-700 hover:underline">
                        {l.orderNo}
                      </Link>
                    ) : l.statementNo ? (
                      <Link href={`/partner/finance/statements/${encodeURIComponent(l.statementNo)}`} className="text-primary-700 hover:underline">
                        {l.statementNo}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-2 py-2 text-gray-500">{l.publicMemo || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pager page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />
        </div>
      )}
    </Card>
  )
}
