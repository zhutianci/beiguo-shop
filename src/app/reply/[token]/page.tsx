'use client'

/**
 * 客服快捷回复页。企业微信通知里的链接指向这里。
 *
 * 刻意做成免登录（令牌即凭证）：企微是在手机上看的，让老板先登录一次后台
 * 才能回一句话，等于这个功能不存在。令牌只对单张订单有效、7 天过期、
 * 只能读该订单留言和回一条，泄露的影响面被限制在这一张订单内。
 *
 * 放在 (shop) 之外：这是内部工具，不需要站点导航/页脚，也不该被
 * LiveOrderNotification 之类的营销组件打扰。
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Send, RefreshCw, CheckCircle2, AlertCircle, User, Headphones } from 'lucide-react'

interface Msg {
  id: number
  sender: 'BUYER' | 'ADMIN' | string
  content: string
  createdAt: string
}

interface OrderInfo {
  orderNo: string
  productName: string
  amount: number
  payStatus: string
  deliveryStatus: string
  buyer: string
  createdAt: string
}

const PAY_LABEL: Record<string, string> = { UNPAID: '待支付', PAID: '已支付', REFUNDED: '已退款' }
const DELIVERY_LABEL: Record<string, string> = {
  PENDING: '待处理',
  PROCESSING: '处理中',
  DELIVERED: '已完成',
  CANCELLED: '已取消',
}

function fmt(s: string) {
  return new Date(s).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export default function QuickReplyPage() {
  const params = useParams()
  const token = String(params.token || '')

  const [order, setOrder] = useState<OrderInfo | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [state, setState] = useState<'loading' | 'ok' | 'invalid'>('loading')
  const [errMsg, setErrMsg] = useState('')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sentOk, setSentOk] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/quick-reply/${token}`)
      const d = await res.json()
      if (d.success) {
        setOrder(d.data.order)
        setMessages(d.data.messages)
        setState('ok')
      } else {
        setErrMsg(d.error || '链接无效')
        setState('invalid')
      }
    } catch {
      setErrMsg('网络错误，请重试')
      setState('invalid')
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = async () => {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setSentOk(false)
    try {
      const res = await fetch(`/api/quick-reply/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const d = await res.json()
      if (d.success) {
        setMessages((prev) => [...prev, d.data.message])
        setText('')
        setSentOk(true)
        setTimeout(() => setSentOk(false), 2500)
      } else {
        setErrMsg(d.error || '发送失败')
        setTimeout(() => setErrMsg(''), 4000)
      }
    } catch {
      setErrMsg('网络错误，请重试')
      setTimeout(() => setErrMsg(''), 4000)
    } finally {
      setSending(false)
    }
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[#0b0d12] flex items-center justify-center text-white/40 text-sm">加载中…</div>
    )
  }

  if (state === 'invalid') {
    return (
      <div className="min-h-screen bg-[#0b0d12] flex flex-col items-center justify-center px-8 text-center">
        <AlertCircle className="w-10 h-10 text-amber-400/80 mb-3" />
        <p className="text-white/80 text-base">{errMsg || '链接无效或已过期'}</p>
        <p className="text-white/35 text-xs mt-2 leading-relaxed">
          快捷回复链接有效期 7 天。过期后请到管理后台的订单管理里回复。
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white flex flex-col">
      {/* 订单信息条 */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0d12]/95 backdrop-blur px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[15px] font-semibold truncate">{order?.productName}</div>
            <div className="mt-0.5 text-[11px] text-white/40 font-mono truncate">{order?.orderNo}</div>
          </div>
          <button
            onClick={load}
            aria-label="刷新"
            className="shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center active:bg-white/10"
          >
            <RefreshCw className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-white/60">
            {order?.buyer}
          </span>
          <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 tabular-nums text-white/60">
            ¥{order?.amount.toFixed(2)}
          </span>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-emerald-300">
            {PAY_LABEL[order?.payStatus || ''] || order?.payStatus}
          </span>
          <span className="rounded-full bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 text-blue-300">
            {DELIVERY_LABEL[order?.deliveryStatus || ''] || order?.deliveryStatus}
          </span>
        </div>
      </header>

      {/* 对话 */}
      <main className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
        {messages.length === 0 && <p className="text-center text-white/30 text-sm py-8">还没有留言</p>}
        {messages.map((m) => {
          const mine = m.sender === 'ADMIN'
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
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
                  {m.content}
                </div>
                <span className="text-[10px] text-white/25 tabular-nums px-1">{fmt(m.createdAt)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </main>

      {/* 回复框 */}
      <footer className="sticky bottom-0 border-t border-white/10 bg-[#0b0d12]/95 backdrop-blur px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {(sentOk || errMsg) && (
          <div
            className={`mb-2 flex items-center gap-1.5 text-xs px-1 ${
              sentOk ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {sentOk ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {sentOk ? '已回复，客户在订单页即可看到' : errMsg}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder="输入回复…"
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
      </footer>
    </div>
  )
}
