'use client'

/**
 * 渠道快速回复页的交互部分（docs/微信机器人-设计.md §5.5）。首屏数据由服务端 page.tsx 校验令牌后直接给（不再先转圈），
 * 刷新与回复走 /api/partner-reply/<令牌>。版式照平台快捷回复页（src/app/reply/[token]/page.tsx）：手机上看、一屏读完、底部回复框。
 *
 * 【时间】一律按北京时间手算（bjTime），不用 toLocaleString：首屏 HTML 是服务端渲染的，容器时区与手机时区不同会让水合对不上。
 * 【文案】回复人是「渠道客服」（本店），买家那边看到的一律是「客服」；站长的回复标「站长客服」（与渠道后台留言面板同一套称呼）。
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Headphones, RefreshCw, Send, Store, User } from 'lucide-react'
import type { PartnerQuickReplyRow, PartnerQuickReplyView } from '@/lib/partner-services/messages'

const PAY_LABEL: Record<string, string> = { UNPAID: '待支付', PAID: '已支付', REFUNDED: '已退款' }
const DELIVERY_LABEL: Record<string, string> = {
  PENDING: '待处理',
  PROCESSING: '处理中',
  DELIVERED: '已完成',
  CANCELLED: '已取消',
}
const SENDER_LABEL: Record<PartnerQuickReplyRow['sender'], string> = { BUYER: '买家', PLATFORM: '站长客服', PARTNER: '本店' }

/** 北京时间「MM-DD HH:mm」：服务端与浏览器算出同一个字符串，不依赖任何一端的时区设置 */
function bjTime(iso: string): string {
  const t = new Date(new Date(iso).getTime() + 8 * 3600_000)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())} ${p(t.getUTCHours())}:${p(t.getUTCMinutes())}`
}

const yuan = (cents: number) => (cents / 100).toFixed(2)

export interface PartnerReplyClientProps {
  token: string
  /** 分站品牌名（店面的 brand.name；没设置站名的渠道是平台默认名） */
  brandName: string
  initial: PartnerQuickReplyView
  /** 链接到期时刻（令牌里的 exp） */
  expiresAt: string
  /** 店铺暂停营业：只能看、不能回 */
  readOnly: boolean
  maxLen: number
}

export function PartnerReplyClient({ token, brandName, initial, expiresAt, readOnly, maxLen }: PartnerReplyClientProps) {
  const [view, setView] = useState<PartnerQuickReplyView>(initial)
  const [expired, setExpired] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const api = `/api/partner-reply/${encodeURIComponent(token)}`
  const { order, rows } = view

  const flash = useCallback((ok: boolean, msg: string) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current)
    setNotice({ ok, text: msg })
    noticeTimer.current = setTimeout(() => setNotice(null), ok ? 2500 : 4000)
  }, [])

  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current)
    },
    [],
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [rows.length])

  const refresh = useCallback(async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      const res = await fetch(api, { cache: 'no-store' })
      const d = await res.json().catch(() => null)
      if (d?.success) setView({ order: d.data.order, rows: d.data.rows })
      else if (res.status === 404) setExpired(true)
      else flash(false, d?.error || '加载失败，请重试')
    } catch {
      flash(false, '网络错误，请重试')
    } finally {
      setRefreshing(false)
    }
  }, [api, flash, refreshing])

  const send = async () => {
    const content = text.trim()
    if (!content || sending || readOnly) return
    setSending(true)
    try {
      const res = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const d = await res.json().catch(() => null)
      if (d?.success) {
        const row = d.data.row as PartnerQuickReplyRow
        setView((v) => ({ ...v, rows: [...v.rows, row] }))
        setText('')
        flash(true, d.message || '已回复')
      } else if (res.status === 404) setExpired(true)
      else flash(false, d?.error || '发送失败')
    } catch {
      flash(false, '网络错误，请重试')
    } finally {
      setSending(false)
    }
  }

  const backendHref = `/partner/orders/${encodeURIComponent(order.orderNo)}`

  if (expired) {
    return (
      <div className="min-h-screen bg-[#0b0d12] flex flex-col items-center justify-center px-8 text-center">
        <AlertCircle className="w-10 h-10 text-amber-400/80 mb-3" />
        <p className="text-white/80 text-base">链接已过期或已失效</p>
        <p className="text-white/35 text-xs mt-2 leading-relaxed">请登录渠道后台，在订单详情里查看与回复留言。</p>
        <a href={backendHref} className="mt-4 text-xs text-purple-300 underline underline-offset-4">
          打开渠道后台
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white flex flex-col">
      {/* 店名 + 订单信息条 */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0d12]/95 backdrop-blur px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-white/45">
              <Store className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{brandName} · 渠道客服</span>
            </div>
            <div className="mt-1 text-[15px] font-semibold truncate">{order.productName}</div>
            <div className="mt-0.5 text-[11px] text-white/40 font-mono truncate">{order.orderNo}</div>
          </div>
          <button
            onClick={refresh}
            disabled={refreshing}
            aria-label="刷新"
            className="shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center active:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-white/50 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 tabular-nums text-white/60">
            ¥{yuan(order.amountCents)}
            {order.quantity > 1 ? ` · ${order.quantity} 件` : ''}
          </span>
          {order.invoiceTaxCents > 0 && (
            <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 tabular-nums text-white/60" title="买家勾了开票，另付的发票税费">
              发票税费 ¥{yuan(order.invoiceTaxCents)}
            </span>
          )}
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-emerald-300">
            {PAY_LABEL[order.payStatus] || order.payStatus}
          </span>
          <span className="rounded-full bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 text-blue-300">
            {DELIVERY_LABEL[order.deliveryStatus] || order.deliveryStatus}
          </span>
          <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 tabular-nums text-white/45">下单 {bjTime(order.createdAt)}</span>
        </div>
      </header>

      {/* 对话 */}
      <main className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
        {rows.length === 0 && <p className="text-center text-white/30 text-sm py-8">还没有留言</p>}
        {rows.map((m, i) => {
          const mine = m.sender !== 'BUYER'
          return (
            <div key={i} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
              <div
                className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  mine ? 'bg-purple-500/15 text-purple-300' : 'bg-white/8 text-white/50'
                }`}
              >
                {mine ? <Headphones className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              </div>
              <div className={`max-w-[76%] ${mine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap break-words ${
                    mine
                      ? 'bg-purple-600/25 border border-purple-500/30 rounded-tr-sm'
                      : 'bg-white/[0.06] border border-white/10 rounded-tl-sm'
                  }`}
                >
                  {m.messageText}
                </div>
                <span className="text-[10px] text-white/25 tabular-nums px-1">
                  {SENDER_LABEL[m.sender]} · {bjTime(m.createdAt)}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </main>

      {/* 回复框 */}
      <footer className="sticky bottom-0 border-t border-white/10 bg-[#0b0d12]/95 backdrop-blur px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {notice && (
          <div className={`mb-2 flex items-center gap-1.5 text-xs px-1 ${notice.ok ? 'text-emerald-400' : 'text-red-400'}`}>
            {notice.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {notice.text}
          </div>
        )}
        {readOnly ? (
          <p className="px-1 py-2 text-xs text-amber-300/80">店铺暂停营业中，暂时只能查看留言、不能回复。</p>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={1}
              maxLength={maxLen}
              placeholder="以渠道客服身份回复…"
              className="flex-1 resize-none rounded-2xl bg-white/[0.06] border border-white/12 px-4 py-2.5 text-[15px] leading-relaxed placeholder:text-white/25 outline-none focus:border-purple-500/50 max-h-32"
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 128) + 'px'
              }}
            />
            <button
              onClick={send}
              disabled={!text.trim() || sending}
              aria-label="发送"
              className="shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center disabled:opacity-35 active:scale-95 transition-transform"
            >
              {sending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
        <p className="mt-2 px-1 text-[10px] leading-relaxed text-white/30">
          买家看到的是「客服」，并会收到邮件提醒。链接 {bjTime(expiresAt)} 前有效，过期后请到
          <a href={backendHref} className="mx-0.5 underline underline-offset-2">
            渠道后台
          </a>
          回复。
        </p>
      </footer>
    </div>
  )
}
