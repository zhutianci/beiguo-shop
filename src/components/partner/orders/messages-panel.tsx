'use client'

/**
 * 订单留言（设计 11.4 售后闭环）：渠道读买家留言、回复（买家看到的是「客服」，并收到与站长回复相同的邮件提醒）。
 * 打开面板即把本单买家留言标为渠道已读（只影响渠道侧红点，不影响站长侧）。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import type { PartnerMessageRow } from '@/lib/tenant/types'
import { gotoLogin, partnerApi } from '../common/api'
import { cnTime } from '../common/format'
import { Button, Card, inputCls } from '../common/ui'

const SENDER_TEXT: Record<PartnerMessageRow['sender'], string> = { BUYER: '买家', PLATFORM: '站长客服', PARTNER: '本店' }

export function MessagesPanel({ orderNo, readOnly }: { orderNo: string; readOnly?: boolean }) {
  const [rows, setRows] = useState<PartnerMessageRow[] | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const r = await partnerApi<{ rows: PartnerMessageRow[] }>(`/api/partner/orders/${encodeURIComponent(orderNo)}/messages`)
    if (r.ok) setRows(r.data.rows)
    else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }, [orderNo])

  useEffect(() => {
    load().then(() => {
      // 看过即已读（只读店铺也允许：已读不是业务写操作，但服务端对只读店铺会拒绝，这里失败静默）
      if (!readOnly) partnerApi(`/api/partner/orders/${encodeURIComponent(orderNo)}/read`, { method: 'POST' }).catch(() => {})
    })
  }, [load, orderNo, readOnly])

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [rows])

  const send = async () => {
    const t = text.trim()
    if (!t) return
    setSending(true)
    setErr('')
    const r = await partnerApi(`/api/partner/orders/${encodeURIComponent(orderNo)}/messages`, { method: 'POST', body: { messageText: t } })
    setSending(false)
    if (r.ok) {
      setText('')
      load()
    } else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }

  return (
    <Card title="留言">
      <div ref={listRef} className="max-h-80 space-y-2 overflow-y-auto pr-1">
        {!rows ? (
          <p className="text-sm text-gray-400">加载中…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-400">暂无留言</p>
        ) : (
          rows.map((m, i) => (
            <div key={i} className={clsx('flex', m.sender === 'BUYER' ? 'justify-start' : 'justify-end')}>
              <div className={clsx('max-w-[85%] rounded-lg px-3 py-2 text-sm', m.sender === 'BUYER' ? 'bg-gray-100 text-gray-800' : 'bg-primary-50 text-gray-800')}>
                <div className="mb-0.5 text-[11px] text-gray-400">
                  {SENDER_TEXT[m.sender]}
                  {m.mine ? '（我）' : ''} · {cnTime(m.createdAt)}
                </div>
                <div className="whitespace-pre-wrap break-words">{m.messageText}</div>
              </div>
            </div>
          ))
        )}
      </div>
      {!readOnly && (
        <div className="mt-3 space-y-2">
          <textarea
            className={inputCls + ' min-h-[72px]'}
            maxLength={2000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="回复买家（买家看到的是「客服」，并会收到邮件提醒）"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-red-600">{err}</span>
            <Button variant="primary" size="sm" loading={sending} disabled={!text.trim()} onClick={send}>
              发送回复
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
