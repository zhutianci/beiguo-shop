'use client'

/**
 * 发起售后申请（设计 8.4）：退款 / 补发 / 升级给站长。渠道只能「申请」，处理全在站长后台；
 * 同一订单同一类型同时只能有一个待处理申请（服务端唯一约束，重复提交返回 409）。
 * 退款可附「建议承担方」与「建议退款金额」，只作参考，最终由站长在退款弹窗里定。
 */
import { useState } from 'react'
import { gotoLogin, partnerApi } from '../common/api'
import { BEARER_TEXT, yuan } from '../common/format'
import { Button, Field, inputCls, Notice } from '../common/ui'

type Kind = 'REFUND' | 'REISSUE' | 'ESCALATE'
const KIND_OPTIONS: { v: Kind; label: string; needPaid: boolean }[] = [
  { v: 'REFUND', label: '申请退款', needPaid: true },
  { v: 'REISSUE', label: '申请补发', needPaid: true },
  { v: 'ESCALATE', label: '升级给站长', needPaid: false },
]

export function AfterSaleForm({ orderNo, paid, amountCents, onDone }: { orderNo: string; paid: boolean; amountCents: number; onDone: () => void }) {
  const [kind, setKind] = useState<Kind>(paid ? 'REFUND' : 'ESCALATE')
  const [reason, setReason] = useState('')
  const [bearer, setBearer] = useState('')
  const [goods, setGoods] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'green' | 'red'; text: string } | null>(null)

  const submit = async () => {
    setMsg(null)
    if (reason.trim().length < 5) return setMsg({ tone: 'red', text: '原因至少 5 个字' })
    setLoading(true)
    const body: Record<string, unknown> = { kind, reason: reason.trim() }
    if (kind === 'REFUND') {
      if (bearer) body.suggestedBearer = bearer
      if (goods.trim()) body.suggestedGoodsYuan = goods.trim()
    }
    const r = await partnerApi<{ requestNo: string }>(`/api/partner/orders/${encodeURIComponent(orderNo)}/after-sales`, { method: 'POST', body })
    setLoading(false)
    if (r.ok) {
      setMsg({ tone: 'green', text: `已提交，申请号 ${r.data.requestNo}。站长处理后会通知你。` })
      setReason('')
      setGoods('')
      onDone()
    } else if (r.needLogin) gotoLogin()
    else setMsg({ tone: 'red', text: r.error })
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="类型">
          <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
            {KIND_OPTIONS.map((o) => (
              <option key={o.v} value={o.v} disabled={o.needPaid && !paid}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        {kind === 'REFUND' && (
          <Field label="建议承担方（可选）">
            <select className={inputCls} value={bearer} onChange={(e) => setBearer(e.target.value)}>
              <option value="">由站长判断</option>
              {Object.keys(BEARER_TEXT).map((k) => (
                <option key={k} value={k}>
                  {BEARER_TEXT[k]}
                </option>
              ))}
            </select>
          </Field>
        )}
        {kind === 'REFUND' && (
          <Field label="建议退款货款（元，可选）" hint={`不超过货款 ${yuan(amountCents)}`}>
            <input className={inputCls} inputMode="decimal" value={goods} onChange={(e) => setGoods(e.target.value)} />
          </Field>
        )}
      </div>
      <Field label="原因（5–500 字）">
        <textarea className={inputCls + ' min-h-[72px]'} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <Button variant="primary" size="sm" loading={loading} onClick={submit}>
        提交申请
      </Button>
    </div>
  )
}
