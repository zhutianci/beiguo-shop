'use client'

/**
 * /admin/tenants/[id]/statements：结算单与打款（设计 10.9、10.10）。
 * 流程：生成 → 开始打款（认领，醒目提示「X 已开始打款」）→ 按结算单号备注转账 → 登记打款（流水号、代扣、凭证类型、渠道发票号、凭证文件）。
 * 异常：放弃认领（必须确认未转出）、退回（金额按明细转回可结算，下期重出）、退票（已打款后银行退回）。
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, COMPONENT_LABEL, Field, Modal, Notice, STATEMENT_STATE_LABEL, SubmitRow, TYPE_LABEL, TenantTabs, api, fmtTime, inputCls, newRequestId, parseYuan, useApi, yuan } from './common'

interface StmtRow {
  id: number
  statementNo: string
  seq: number
  origin: string
  periodEnd: string
  lineCount: number
  goodsCents: number
  purchaseCents: number
  invShareCents: number
  feeCents: number
  otherCents: number
  grossCents: number
  netCents: number
  state: string
  payeeName: string
  payeeMethod: string
  payeeAccountMasked: string
  payingByName: string | null
  payingAt: string | null
  payingOverdue: boolean
  createdAt: string
  createdByName: string | null
  returnReason: string | null
  payout: null | { amountCents: number; withholdCents: number; method: string; externalTradeNo: string; paidAt: string; hasProof: boolean; operatorName: string | null }
  bouncedCents: number
}

const ORIGIN_LABEL: Record<string, string> = { SCHEDULE: '周期', REQUEST: '渠道申请', MANUAL: '手动' }
const STATE_TONE: Record<string, string> = {
  GENERATED: 'bg-blue-100 text-blue-700',
  PAYING: 'bg-amber-100 text-amber-800',
  PAID: 'bg-green-100 text-green-700',
  RECEIVED: 'bg-green-100 text-green-700',
  RETURNED: 'bg-gray-200 text-gray-600',
}

export default function TenantStatements({ id }: { id: string }) {
  const [page, setPage] = useState(1)
  const list = useApi<{ total: number; rows: StmtRow[] }>(`/api/admin/tenants/${id}/statements?page=${page}`)
  const [gen, setGen] = useState(false)
  const [open, setOpen] = useState<StmtRow | null>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const pages = list.data ? Math.max(1, Math.ceil(list.data.total / 20)) : 1
  const refresh = (m?: { kind: 'ok' | 'error'; text: string }) => {
    if (m) setMsg(m)
    list.reload()
  }
  return (
    <div className="space-y-4">
      <TenantTabs id={id} active="statements" />
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>结算单</CardTitle>
          <Button onClick={() => setGen(true)}>生成结算单</Button>
        </CardHeader>
        <CardContent>
          {list.error && <Notice kind="error">{list.error}</Notice>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">结算单</th>
                  <th className="pb-2">状态</th>
                  <th className="pb-2 text-right">余额</th>
                  <th className="pb-2 text-right">手续费</th>
                  <th className="pb-2 text-right">打款额</th>
                  <th className="pb-2">收款人（快照）</th>
                  <th className="pb-2">打款</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {(list.data?.rows ?? []).map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 align-top">
                    <td className="py-2">
                      <div className="font-mono font-medium">{s.statementNo}</div>
                      <div className="text-xs text-gray-400">
                        第 {s.seq} 期 · {ORIGIN_LABEL[s.origin] ?? s.origin} · 截止 {fmtTime(s.periodEnd)} · {s.lineCount} 条
                      </div>
                    </td>
                    <td className="py-2">
                      <Badge tone={STATE_TONE[s.state]}>{STATEMENT_STATE_LABEL[s.state] ?? s.state}</Badge>
                      {s.state === 'PAYING' && (
                        <div className={`mt-1 text-xs ${s.payingOverdue ? 'font-semibold text-red-600' : 'text-amber-700'}`}>
                          {s.payingByName ?? '有人'} 于 {fmtTime(s.payingAt)} 已开始打款，请勿重复转账{s.payingOverdue && '（已超过 24 小时）'}
                        </div>
                      )}
                    </td>
                    <td className="py-2 text-right">{yuan(s.grossCents)}</td>
                    <td className="py-2 text-right">{yuan(-s.feeCents)}</td>
                    <td className="py-2 text-right font-semibold">{yuan(s.netCents)}</td>
                    <td className="py-2 text-xs">
                      {s.payeeName} · {s.payeeMethod} · {s.payeeAccountMasked}
                    </td>
                    <td className="py-2 text-xs">
                      {s.payout ? (
                        <>
                          {yuan(s.payout.amountCents)}
                          {s.payout.withholdCents > 0 && ` + 代扣 ${yuan(s.payout.withholdCents)}`}
                          <div className="text-gray-400">
                            {fmtTime(s.payout.paidAt)} · 流水 {s.payout.externalTradeNo}
                          </div>
                          {s.bouncedCents > 0 && <div className="text-red-600">已退票 {yuan(s.bouncedCents)}</div>}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => setOpen(s)}>
                        详情 / 操作
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2 text-sm">
            <span className="text-gray-500">
              共 {list.data?.total ?? 0} 张 · 第 {page}/{pages} 页
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
      {gen && (
        <GenerateDialog
          id={id}
          onClose={() => setGen(false)}
          onDone={(m) => {
            setGen(false)
            refresh(m)
          }}
        />
      )}
      {open && (
        <StatementDialog
          row={open}
          onClose={() => {
            setOpen(null)
            refresh()
          }}
          onMsg={(m) => {
            setOpen(null)
            refresh(m)
          }}
        />
      )}
    </div>
  )
}

function GenerateDialog({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: (m: { kind: 'ok' | 'error'; text: string }) => void }) {
  const [requestId] = useState(newRequestId)
  const [origin, setOrigin] = useState<'SCHEDULE' | 'MANUAL'>('SCHEDULE')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    const r = await api<{ statementNo: string; netCents: number }>(`/api/admin/tenants/${id}/statements`, { body: { origin, requestId } })
    setBusy(false)
    if (!r.success) return setErr(r.error)
    onDone({ kind: 'ok', text: `结算单 ${r.data.statementNo} 已生成，打款额 ${yuan(r.data.netCents)}` })
  }
  return (
    <Modal title="生成结算单" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3 text-sm">
        <Field label="类型">
          <select className={inputCls} value={origin} onChange={(e) => setOrigin(e.target.value as typeof origin)}>
            <option value="SCHEDULE">周期结算（截止东八区本周一 00:00；受最低结算额限制）</option>
            <option value="MANUAL">手动出单（截止现在；不受最低结算额限制，如终止合作清算）</option>
          </select>
        </Field>
        <Notice>出单前会先跑一遍该渠道的钱类对账，失败则拒绝出单并暂停打款。只收截止时间之前、已解冻、未进过结算单的分录，一个事件整组取舍。</Notice>
        {err && <Notice kind="error">{err}</Notice>}
        <SubmitRow onCancel={onClose} loading={busy} label="生成" />
      </form>
    </Modal>
  )
}

interface Detail {
  id: number
  statementNo: string
  state: string
  netCents: number
  grossCents: number
  goodsCents: number
  purchaseCents: number
  invShareCents: number
  feeCents: number
  otherCents: number
  payoutHold: boolean
  payoutHoldReason?: string | null
  requirePartnerInvoice: boolean
  payee: { name: string; method: string; accountMasked: string }
  hasPayeeAccount: boolean
  lines: { at: string; type: string; component: string; amountCents: number; orderNo: string | null }[]
  payout: null | { amountCents: number; withholdCents: number; method: string; externalTradeNo: string; paidAt: string; hasProof: boolean }
  bouncedCents: number
  returnReason: string | null
  partnerInvoiceNo: string | null
}

function StatementDialog({ row, onClose, onMsg }: { row: StmtRow; onClose: () => void; onMsg: (m: { kind: 'ok' | 'error'; text: string }) => void }) {
  const { data: d, error } = useApi<Detail>(`/api/admin/statements/${row.id}`)
  const [act, setAct] = useState<null | 'payout' | 'return' | 'bounce' | 'unpaying'>(null)
  const [plain, setPlain] = useState<string | null>(null)
  const call = async (path: string, body: unknown, ok: string) => {
    const r = await api(`/api/admin/statements/${row.id}/${path}`, { body })
    onMsg(r.success ? { kind: 'ok', text: r.message || ok } : { kind: 'error', text: r.error })
  }
  const reveal = async () => {
    const r = await api<{ account: string }>(`/api/admin/statements/${row.id}/payee`, { body: {} })
    if (r.success) setPlain(r.data.account)
    else alert(r.error)
  }
  return (
    <Modal title={`结算单 ${row.statementNo}`} onClose={onClose} wide>
      {error && <Notice kind="error">{error}</Notice>}
      {!d ? (
        <div className="py-8 text-center text-gray-400">加载中...</div>
      ) : (
        <div className="space-y-4 text-sm">
          {d.payoutHold && (
            <Notice kind="error">
              {/* 原因分两种：对账失败自动置（以「对账失败」开头）才让去对账自检；站长手动暂停就显示他填的原因 */}
              该渠道已暂停打款{d.payoutHoldReason?.startsWith('对账失败') ? '（对账异常）' : ''}：{d.payoutHoldReason || '未填写原因'}。不能认领新的打款
              {d.payoutHoldReason?.startsWith('对账失败') ? '，请到「对账自检」查看失败项，处理后在渠道详情解除' : '，解除请到渠道详情操作'}。已认领的单子可以照实登记。
            </Notice>
          )}
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <div>货款 {yuan(d.goodsCents)}</div>
            <div>进货款 {yuan(d.purchaseCents)}</div>
            <div>发票分成 {yuan(d.invShareCents)}</div>
            <div>其他 {yuan(d.otherCents)}</div>
            <div>余额 {yuan(d.grossCents)}</div>
            <div>手续费 {yuan(-d.feeCents)}</div>
            <div className="font-semibold">打款额 {yuan(d.netCents)}</div>
            <div>状态 {STATEMENT_STATE_LABEL[d.state] ?? d.state}</div>
          </div>
          <div className="rounded border border-gray-100 p-3">
            收款人（出单时快照）：{d.payee.name} · {d.payee.method} · {plain ?? d.payee.accountMasked}
            {!plain && d.hasPayeeAccount && (
              <button className="ml-2 text-xs text-primary-600 hover:underline" onClick={reveal}>
                查看完整账号（记审计）
              </button>
            )}
            <div className="mt-1 text-xs text-gray-500">转账备注必须写结算单号 {d.statementNo}</div>
          </div>
          {d.payout && (
            <div className="rounded border border-gray-100 p-3">
              已打款 {yuan(d.payout.amountCents)}（代扣 {yuan(d.payout.withholdCents)}）· {d.payout.method} · 流水 {d.payout.externalTradeNo} · {fmtTime(d.payout.paidAt)}
              {d.partnerInvoiceNo && ` · 渠道发票 ${d.partnerInvoiceNo}`}
              {d.bouncedCents > 0 && <span className="text-red-600"> · 已退票 {yuan(d.bouncedCents)}</span>}
              <div className="mt-1">
                {d.payout.hasProof ? (
                  <a className="text-primary-600 hover:underline" href={`/api/admin/statements/${d.id}/proof`} target="_blank" rel="noreferrer">
                    查看打款凭证
                  </a>
                ) : (
                  <ProofUpload sid={d.id} onDone={onMsg} />
                )}
              </div>
            </div>
          )}
          {d.returnReason && <Notice>退回原因：{d.returnReason}</Notice>}
          <div className="flex flex-wrap gap-2">
            {(d.state === 'GENERATED' || d.state === 'CONFIRMED') && (
              <Button onClick={() => confirm('确认开始打款？认领后其他管理员会看到「你已开始打款」。') && call('paying', {}, '已认领')}>开始打款（认领）</Button>
            )}
            {d.state === 'PAYING' && <Button onClick={() => setAct('payout')}>登记打款</Button>}
            {d.state === 'PAYING' && (
              <Button variant="outline" onClick={() => setAct('unpaying')}>
                放弃认领
              </Button>
            )}
            {['GENERATED', 'CONFIRMED', 'DISPUTED', 'PAYING'].includes(d.state) && (
              <Button variant="outline" onClick={() => setAct('return')}>
                退回
              </Button>
            )}
            {(d.state === 'PAID' || d.state === 'RECEIVED') && (
              <Button variant="outline" onClick={() => setAct('bounce')}>
                登记退票
              </Button>
            )}
            <a href={`/api/admin/statements/${d.id}/export`} className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              导出对账单 CSV
            </a>
          </div>
          {act === 'payout' && <PayoutForm d={d} onDone={onMsg} onCancel={() => setAct(null)} />}
          {act === 'unpaying' && <UnpayingForm sid={d.id} onDone={onMsg} onCancel={() => setAct(null)} />}
          {act === 'return' && <ReturnForm d={d} onDone={onMsg} onCancel={() => setAct(null)} />}
          {act === 'bounce' && <BounceForm sid={d.id} onDone={onMsg} onCancel={() => setAct(null)} />}
          <div>
            <div className="mb-1 font-medium">纳入明细（{d.lines.length} 条）</div>
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-xs">
                <tbody>
                  {d.lines.map((l, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-1">{fmtTime(l.at)}</td>
                      <td className="py-1">{l.orderNo ?? '—'}</td>
                      <td className="py-1">{TYPE_LABEL[l.type] ?? l.type}</td>
                      <td className="py-1">{COMPONENT_LABEL[l.component] ?? l.component}</td>
                      <td className={`py-1 text-right ${l.amountCents < 0 ? 'text-red-600' : ''}`}>{yuan(l.amountCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

type Msg = (m: { kind: 'ok' | 'error'; text: string }) => void

function PayoutForm({ d, onDone, onCancel }: { d: Detail; onDone: Msg; onCancel: () => void }) {
  const [f, setF] = useState({
    amount: (d.netCents / 100).toFixed(2),
    withhold: '0',
    method: d.payee.method || 'ALIPAY',
    tradeNo: '',
    paidAt: new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
    voucherType: d.requirePartnerInvoice ? 'INVOICE' : 'SMALL_RECEIPT',
    invNo: '',
    invAmount: (d.netCents / 100).toFixed(2),
  })
  const [file, setFile] = useState<File | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const a = parseYuan(f.amount)
    const w = parseYuan(f.withhold) ?? 0
    if (a == null || Number.isNaN(a) || Number.isNaN(w) || a < 0 || w < 0) return setErr('金额格式不对')
    if (a + w !== d.netCents) return setErr(`打款 + 代扣必须等于 ${yuan(d.netCents)}`)
    const form = new FormData()
    form.set('amountCents', String(a))
    form.set('withholdCents', String(w))
    form.set('method', f.method)
    form.set('externalTradeNo', f.tradeNo.trim())
    form.set('paidAt', new Date(f.paidAt).toISOString())
    form.set('voucherType', f.voucherType)
    if (f.invNo.trim()) {
      const ia = parseYuan(f.invAmount)
      if (ia == null || Number.isNaN(ia)) return setErr('发票金额格式不对')
      form.set('partnerInvoiceNo', f.invNo.trim())
      form.set('partnerInvoiceAmountCents', String(ia))
    }
    if (file) form.set('proof', file)
    setBusy(true)
    const r = await api(`/api/admin/statements/${d.id}/payout`, { form })
    setBusy(false)
    if (!r.success) return setErr(r.error)
    onDone({ kind: 'ok', text: r.message || '已登记打款' })
  }
  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border border-primary-100 bg-primary-50/30 p-4 md:grid-cols-4">
      <Field label="实际打款（元）">
        <input className={inputCls} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
      </Field>
      <Field label="代扣个税（元）">
        <input className={inputCls} value={f.withhold} onChange={(e) => setF({ ...f, withhold: e.target.value })} />
      </Field>
      <Field label="打款方式">
        <select className={inputCls} value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
          <option value="ALIPAY">支付宝</option>
          <option value="BANK">银行卡</option>
          <option value="WECHAT">微信</option>
        </select>
      </Field>
      <Field label="转账流水号" hint="全局唯一，重复会被拒绝">
        <input className={inputCls} value={f.tradeNo} onChange={(e) => setF({ ...f, tradeNo: e.target.value })} required />
      </Field>
      <Field label="打款时间">
        <input type="datetime-local" className={inputCls} value={f.paidAt} onChange={(e) => setF({ ...f, paidAt: e.target.value })} required />
      </Field>
      <Field label="凭证类型">
        <select className={inputCls} value={f.voucherType} onChange={(e) => setF({ ...f, voucherType: e.target.value })}>
          <option value="INVOICE">渠道开具发票</option>
          <option value="AGENT_INVOICE">代开发票</option>
          <option value="SMALL_RECEIPT">小额零星凭证</option>
          <option value="WITHHOLD_RECORD">代扣个税记录</option>
        </select>
      </Field>
      <Field label={`渠道发票号${d.requirePartnerInvoice ? '（必填）' : ''}`}>
        <input className={inputCls} value={f.invNo} onChange={(e) => setF({ ...f, invNo: e.target.value })} />
      </Field>
      <Field label="发票金额（元）" hint="= 打款 + 代扣">
        <input className={inputCls} value={f.invAmount} onChange={(e) => setF({ ...f, invAmount: e.target.value })} />
      </Field>
      <Field label="打款凭证（PNG / JPG / PDF，≤ 5MB）">
        <input type="file" accept="image/png,image/jpeg,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </Field>
      <div className="md:col-span-4">
        {err && <Notice kind="error">{err}</Notice>}
        <SubmitRow onCancel={onCancel} loading={busy} label="登记打款" />
      </div>
    </form>
  )
}

function UnpayingForm({ sid, onDone, onCancel }: { sid: number; onDone: Msg; onCancel: () => void }) {
  const [ok, setOk] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok) return
    const r = await api(`/api/admin/statements/${sid}/unpaying`, { body: { confirmNotTransferred: true } })
    onDone(r.success ? { kind: 'ok', text: r.message || '已放弃认领' } : { kind: 'error', text: r.error })
  }
  return (
    <form onSubmit={submit} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
        我确认这笔钱<strong>没有转出</strong>
      </label>
      <SubmitRow onCancel={onCancel} label="放弃认领" />
    </form>
  )
}

function ReturnForm({ d, onDone, onCancel }: { d: Detail; onDone: Msg; onCancel: () => void }) {
  const [reason, setReason] = useState('')
  const [ok, setOk] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const r = await api(`/api/admin/statements/${d.id}/return`, { body: { reason, confirmNotTransferred: ok } })
    onDone(r.success ? { kind: 'ok', text: r.message || '已退回' } : { kind: 'error', text: r.error })
  }
  return (
    <form onSubmit={submit} className="space-y-2 rounded-lg border border-gray-200 p-4">
      <Field label="退回原因">
        <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} required />
      </Field>
      {d.state === 'PAYING' && (
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
          我确认这笔钱<strong>没有转出</strong>
        </label>
      )}
      <SubmitRow onCancel={onCancel} label="退回" />
    </form>
  )
}

function BounceForm({ sid, onDone, onCancel }: { sid: number; onDone: Msg; onCancel: () => void }) {
  const [f, setF] = useState({ amount: '', no: '' })
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const c = parseYuan(f.amount)
    if (c == null || Number.isNaN(c) || c <= 0) return alert('金额必须大于 0')
    const r = await api(`/api/admin/statements/${sid}/bounce`, { body: { amountCents: c, externalNo: f.no.trim() } })
    onDone(r.success ? { kind: 'ok', text: r.message || '已登记退票' } : { kind: 'error', text: r.error })
  }
  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border border-gray-200 p-4 md:grid-cols-2">
      <Field label="退票金额（元）" hint="累计不能超过实际打款额">
        <input className={inputCls} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} required />
      </Field>
      <Field label="退票流水号">
        <input className={inputCls} value={f.no} onChange={(e) => setF({ ...f, no: e.target.value })} required />
      </Field>
      <div className="md:col-span-2">
        <SubmitRow onCancel={onCancel} label="登记退票" />
      </div>
    </form>
  )
}

function ProofUpload({ sid, onDone }: { sid: number; onDone: Msg }) {
  const [busy, setBusy] = useState(false)
  const up = async (file: File | undefined) => {
    if (!file) return
    const form = new FormData()
    form.set('proof', file)
    setBusy(true)
    const r = await api(`/api/admin/statements/${sid}/proof`, { form })
    setBusy(false)
    onDone(r.success ? { kind: 'ok', text: '凭证已上传' } : { kind: 'error', text: r.error })
  }
  return (
    <label className="text-xs text-gray-600">
      还没有凭证，补传：{' '}
      <input type="file" accept="image/png,image/jpeg,application/pdf" disabled={busy} onChange={(e) => up(e.target.files?.[0])} />
    </label>
  )
}
