'use client'

/**
 * /admin/tenants/[id]/ledger：渠道账本（设计 10.3–10.8、12.2）。三个数 + 流水（含 eventKey、内部备注、操作人，仅超管）
 * + 调账 / 保证金与回款 / 核销。
 * 【幂等】每个弹窗打开时生成一个 requestId（外部流水号类操作用流水号本身）：双击、网络重试只入账一次，第二次提示「已处理」。
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BUCKET_LABEL,
  COMPONENT_LABEL,
  Field,
  Modal,
  Notice,
  SubmitRow,
  TYPE_LABEL,
  TenantTabs,
  Triple,
  api,
  fmtTime,
  inputCls,
  newRequestId,
  parseYuan,
  useApi,
  yuan,
} from './common'

interface Balances {
  available: { balanceCents: number; feeCents: number; payoutCents: number }
  pending: { balanceCents: number; feeCents: number; payoutCents: number }
  inPayoutCents: number
  depositCents: number
  paidTotalCents: number
  withheldTotalCents: number
  negative: boolean
}
interface LedgerRow {
  id: number
  eventKey: string
  at: string
  type: string
  component: string
  bucket: string
  amountCents: number
  orderNo: string | null
  statementNo: string | null
  publicMemo: string | null
  memo: string | null
  operatorName: string
}

export default function TenantLedger({ id }: { id: string }) {
  const bal = useApi<Balances>(`/api/admin/tenants/${id}/balances`)
  const [page, setPage] = useState(1)
  const [type, setType] = useState('')
  const [component, setComponent] = useState('')
  const url = `/api/admin/tenants/${id}/ledger?page=${page}&pageSize=50${type ? `&type=${type}` : ''}${component ? `&component=${component}` : ''}`
  const led = useApi<{ total: number; rows: LedgerRow[] }>(url)
  const [dialog, setDialog] = useState<null | 'adjust' | 'deposit' | 'writeoff'>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const done = (m: string) => {
    setDialog(null)
    setMsg(m)
    bal.reload()
    led.reload()
  }
  const b = bal.data
  const pages = led.data ? Math.max(1, Math.ceil(led.data.total / 50)) : 1
  return (
    <div className="space-y-4">
      <TenantTabs id={id} active="ledger" />
      {msg && <Notice kind="ok">{msg}</Notice>}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>余额</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setDialog('adjust')}>
              调账
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDialog('deposit')}>
              保证金 / 回款
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDialog('writeoff')}>
              核销负余额
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {bal.error && <Notice kind="error">{bal.error}</Notice>}
          {b && (
            <div className="grid gap-3 md:grid-cols-3">
              <Triple label={b.negative ? '可结算（为负，待抵扣）' : '可结算'} t={b.available} />
              <Triple label="冻结中" t={b.pending} />
              <div className="rounded-lg border border-gray-100 p-3 text-sm text-gray-600">
                <div>结算中：{yuan(b.inPayoutCents)}</div>
                <div>保证金：{yuan(b.depositCents)}</div>
                <div>累计已打款：{yuan(b.paidTotalCents)}</div>
                <div>累计代扣：{yuan(b.withheldTotalCents)}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>流水</CardTitle>
          <div className="flex gap-2">
            <select className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" value={type} onChange={(e) => (setType(e.target.value), setPage(1))}>
              <option value="">全部事件</option>
              {Object.entries(TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" value={component} onChange={(e) => (setComponent(e.target.value), setPage(1))}>
              <option value="">全部成分</option>
              {Object.entries(COMPONENT_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {led.error && <Notice kind="error">{led.error}</Notice>}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2">时间</th>
                  <th className="py-2">事件</th>
                  <th className="py-2">成分</th>
                  <th className="py-2">桶</th>
                  <th className="py-2 text-right">金额</th>
                  <th className="py-2">订单 / 结算单</th>
                  <th className="py-2">说明（渠道可见 / 内部）</th>
                  <th className="py-2">操作人</th>
                  <th className="py-2">事件键</th>
                </tr>
              </thead>
              <tbody>
                {(led.data?.rows ?? []).map((r) => (
                  <tr key={r.id} className="border-b border-gray-50">
                    <td className="py-1.5 whitespace-nowrap">{fmtTime(r.at)}</td>
                    <td className="py-1.5">{TYPE_LABEL[r.type] ?? r.type}</td>
                    <td className="py-1.5">{COMPONENT_LABEL[r.component] ?? r.component}</td>
                    <td className="py-1.5">{BUCKET_LABEL[r.bucket] ?? r.bucket}</td>
                    <td className={`py-1.5 text-right font-medium ${r.amountCents < 0 ? 'text-red-600' : 'text-green-700'}`}>{yuan(r.amountCents)}</td>
                    <td className="py-1.5">{r.orderNo ?? r.statementNo ?? '—'}</td>
                    <td className="py-1.5">
                      {r.publicMemo ?? ''}
                      {r.memo && <div className="text-gray-400">内部：{r.memo}</div>}
                    </td>
                    <td className="py-1.5">{r.operatorName}</td>
                    <td className="py-1.5 font-mono text-gray-400">{r.eventKey}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2 text-sm">
            <span className="text-gray-500">
              共 {led.data?.total ?? 0} 条 · 第 {page}/{pages} 页
            </span>
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              上一页
            </Button>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>
              下一页
            </Button>
          </div>
        </CardContent>
      </Card>
      {dialog === 'adjust' && <AdjustDialog id={id} onClose={() => setDialog(null)} onDone={done} />}
      {dialog === 'deposit' && <DepositDialog id={id} onClose={() => setDialog(null)} onDone={done} />}
      {dialog === 'writeoff' && <WriteoffDialog id={id} onClose={() => setDialog(null)} onDone={done} />}
    </div>
  )
}

function AdjustDialog({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: (m: string) => void }) {
  const [requestId] = useState(newRequestId)
  const [f, setF] = useState({ amount: '', reasonCode: 'OTHER', reason: '', publicMemo: '' })
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const c = parseYuan(f.amount)
    if (c == null || Number.isNaN(c) || c === 0) return setErr('金额填非零数字（负数 = 扣减），最多两位小数')
    setBusy(true)
    const r = await api(`/api/admin/tenants/${id}/adjust`, { body: { amountCents: c, reasonCode: f.reasonCode, reason: f.reason, publicMemo: f.publicMemo || undefined, requestId } })
    setBusy(false)
    if (!r.success) return setErr(r.error)
    onDone(r.message || '已调账')
  }
  return (
    <Modal title="调账" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Notice>直接进入「可结算」。渠道只看到金额与「渠道可见说明」，看不到原因与内部备注。本弹窗重复提交只入账一次。</Notice>
        <Field label="金额（元）" hint="正数 = 补给渠道；负数 = 扣回">
          <input className={inputCls} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} required />
        </Field>
        <Field label="原因分类">
          <select className={inputCls} value={f.reasonCode} onChange={(e) => setF({ ...f, reasonCode: e.target.value })}>
            <option value="COMPENSATE">补偿</option>
            <option value="CORRECTION">更正</option>
            <option value="PENALTY">违约扣款</option>
            <option value="DISPUTE">结算异议处理</option>
            <option value="OTHER">其他</option>
          </select>
        </Field>
        <Field label="原因（仅超管可见）">
          <input className={inputCls} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} required />
        </Field>
        <Field label="渠道可见说明（可空）">
          <input className={inputCls} value={f.publicMemo} onChange={(e) => setF({ ...f, publicMemo: e.target.value })} />
        </Field>
        {err && <Notice kind="error">{err}</Notice>}
        <SubmitRow onCancel={onClose} loading={busy} label="入账" />
      </form>
    </Modal>
  )
}

function DepositDialog({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: (m: string) => void }) {
  const [requestId] = useState(newRequestId)
  const [f, setF] = useState({ action: 'IN', amount: '', externalNo: '' })
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const needNo = f.action !== 'APPLY'
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const c = parseYuan(f.amount)
    if (c == null || Number.isNaN(c) || c <= 0) return setErr('金额必须大于 0')
    setBusy(true)
    const body = needNo ? { action: f.action, amountCents: c, externalNo: f.externalNo.trim() } : { action: f.action, amountCents: c, requestId }
    const r = await api(`/api/admin/tenants/${id}/deposit`, { body })
    setBusy(false)
    if (!r.success) return setErr(r.error)
    onDone(r.message || '已入账')
  }
  return (
    <Modal title="保证金与回款" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="操作">
          <select className={inputCls} value={f.action} onChange={(e) => setF({ ...f, action: e.target.value })}>
            <option value="IN">收保证金（进保证金，不进结算单）</option>
            <option value="APPLY">保证金抵扣负余额（保证金 → 可结算）</option>
            <option value="REFUND">退还保证金</option>
            <option value="REPAY">渠道回款（负余额时渠道把钱打回来 → 可结算）</option>
          </select>
        </Field>
        <Field label="金额（元）">
          <input className={inputCls} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} required />
        </Field>
        {needNo && (
          <Field label="转账流水号" hint="同一流水号只入账一次">
            <input className={inputCls} value={f.externalNo} onChange={(e) => setF({ ...f, externalNo: e.target.value })} required />
          </Field>
        )}
        {err && <Notice kind="error">{err}</Notice>}
        <SubmitRow onCancel={onClose} loading={busy} label="入账" />
      </form>
    </Modal>
  )
}

function WriteoffDialog({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: (m: string) => void }) {
  const [requestId] = useState(newRequestId)
  const [f, setF] = useState({ amount: '', reason: '' })
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const c = parseYuan(f.amount)
    if (c == null || Number.isNaN(c) || c <= 0) return setErr('金额必须大于 0')
    setBusy(true)
    const r = await api(`/api/admin/tenants/${id}/writeoff`, { body: { amountCents: c, reason: f.reason, requestId } })
    setBusy(false)
    if (!r.success) return setErr(r.error)
    onDone(r.message || '已核销')
  }
  return (
    <Modal title="核销负余额（站长承担）" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Notice kind="warn">核销 = 站长自己承担这部分负余额（设计建议超过 180 天仍收不回再核销）。必须写原因。</Notice>
        <Field label="金额（元）">
          <input className={inputCls} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} required />
        </Field>
        <Field label="原因">
          <input className={inputCls} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} required />
        </Field>
        {err && <Notice kind="error">{err}</Notice>}
        <SubmitRow onCancel={onClose} loading={busy} label="核销" />
      </form>
    </Modal>
  )
}
