'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface Msg {
  id: number
  sender: string // BUYER | ADMIN
  content: string
  createdAt: string
}

interface Props {
  apiBase: string // GET/POST 地址，如 /api/orders/123/messages
  selfRole: 'BUYER' | 'ADMIN'
  theme?: 'dark' | 'light'
}

function fmt(s: string) {
  return new Date(s).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function OrderChat({ apiBase, selfRole, theme = 'light' }: Props) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const dark = theme === 'dark'

  const load = async () => {
    try {
      const res = await fetch(apiBase)
      const data = await res.json()
      if (data.success) setMessages(data.data.messages)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const id = setInterval(load, 4000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = async () => {
    const content = text.trim()
    if (!content) return
    setSending(true)
    try {
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()
      if (data.success) {
        setText('')
        load()
      } else {
        alert(data.error || '发送失败')
      }
    } finally {
      setSending(false)
    }
  }

  const boxCls = dark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
  const otherBubble = dark ? 'bg-white/10 text-white/90' : 'bg-white text-gray-800 border border-gray-200'
  const selfBubble = dark ? 'bg-purple-600 text-white' : 'bg-primary-600 text-white'
  const timeCls = dark ? 'text-white/30' : 'text-gray-400'

  return (
    <div>
      <div className={`rounded-xl border ${boxCls} p-3 h-64 overflow-y-auto space-y-2`}>
        {loading ? (
          <div className={`text-center py-10 text-sm ${dark ? 'text-white/40' : 'text-gray-400'}`}>加载中...</div>
        ) : messages.length === 0 ? (
          <div className={`text-center py-10 text-sm ${dark ? 'text-white/40' : 'text-gray-400'}`}>
            还没有消息，发送第一条开始沟通
          </div>
        ) : (
          messages.map((m) => {
            const isSelf = m.sender === selfRole
            return (
              <div key={m.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[78%]">
                  <div className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${isSelf ? selfBubble : otherBubble}`}>
                    {m.content}
                  </div>
                  <div className={`text-[10px] mt-0.5 ${timeCls} ${isSelf ? 'text-right' : 'text-left'}`}>
                    {m.sender === 'ADMIN' ? '客服' : '买家'} · {fmt(m.createdAt)}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-2 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder="输入消息，回车发送"
          className={`flex-1 rounded-xl px-3 py-2 text-sm outline-none border ${
            dark
              ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-purple-500/50'
              : 'bg-white border-gray-300 text-gray-900 focus:border-primary-500'
          }`}
        />
        <button
          onClick={send}
          disabled={sending}
          className={`px-4 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-1.5 disabled:opacity-50 ${
            dark ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          发送
        </button>
      </div>
    </div>
  )
}
