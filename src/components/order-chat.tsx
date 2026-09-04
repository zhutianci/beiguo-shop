'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Send, Loader2, ChevronUp } from 'lucide-react'

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

const POLL_MS = 4000

// 服务端在 SSR 阶段没有 layout effect，避免 React 警告
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

function fmt(s: string) {
  return new Date(s).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function OrderChat({ apiBase, selfRole, theme = 'light' }: Props) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [hasMore, setHasMore] = useState(false)      // 是否还有更早的历史消息
  const [loadingMore, setLoadingMore] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  const boxRef = useRef<HTMLDivElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const lastIdRef = useRef(0)                        // 已拿到的最大消息 id，增量轮询用
  const pollingRef = useRef(false)                   // 轮询在途标记，避免请求堆积
  const prependHeightRef = useRef<number | null>(null) // 「加载更早」前的 scrollHeight，用于保持视口位置
  const dark = theme === 'dark'

  // 追加（或前置）消息时按 id 去重合并，保持升序
  const mergeMessages = useCallback((prev: Msg[], incoming: Msg[], position: 'head' | 'tail') => {
    if (incoming.length === 0) return prev
    const known = new Set(prev.map((m) => m.id))
    const fresh = incoming.filter((m) => !known.has(m.id))
    if (fresh.length === 0) return prev
    return position === 'head' ? [...fresh, ...prev] : [...prev, ...fresh]
  }, [])

  // 首屏：只取最近 N 条（服务端默认 100），并拿到 hasMore
  useEffect(() => {
    const ctrl = new AbortController()
    let alive = true

    setMessages([])
    setHasMore(false)
    setLoading(true)
    lastIdRef.current = 0
    prependHeightRef.current = null

    ;(async () => {
      try {
        const res = await fetch(apiBase, { signal: ctrl.signal })
        const data = await res.json()
        if (!alive) return
        if (data.success) {
          const list: Msg[] = data.data.messages || []
          setMessages(list)
          setHasMore(!!data.data.hasMore)
          if (list.length > 0) lastIdRef.current = list[list.length - 1].id
        }
      } catch {
        // 组件卸载 / 切换订单导致的中断，忽略
      } finally {
        if (alive) setLoading(false)
      }
    })()

    return () => {
      alive = false
      ctrl.abort()
    }
  }, [apiBase])

  // 增量轮询：只拉比 lastId 新的消息
  useEffect(() => {
    const ctrl = new AbortController()
    const timer = setInterval(async () => {
      if (pollingRef.current) return
      pollingRef.current = true
      try {
        // 还没拿到任何消息时退回首屏请求（只取最近 N 条），之后一律走增量
        const url = lastIdRef.current > 0 ? `${apiBase}?after=${lastIdRef.current}` : apiBase
        const res = await fetch(url, { signal: ctrl.signal })
        const data = await res.json()
        if (data.success) {
          const list: Msg[] = data.data.messages || []
          if (list.length > 0) {
            const first = lastIdRef.current === 0
            lastIdRef.current = Math.max(lastIdRef.current, list[list.length - 1].id)
            if (first) setHasMore(!!data.data.hasMore)
            setMessages((prev) => mergeMessages(prev, list, 'tail'))
          }
        }
      } catch {
        // 忽略单次轮询失败，下个周期继续
      } finally {
        pollingRef.current = false
      }
    }, POLL_MS)

    return () => {
      clearInterval(timer)
      ctrl.abort()
      pollingRef.current = false
    }
  }, [apiBase, mergeMessages])

  // 加载更早的消息（向上翻页）
  const loadEarlier = async () => {
    if (loadingMore || messages.length === 0) return
    setLoadingMore(true)
    prependHeightRef.current = boxRef.current?.scrollHeight ?? null
    try {
      const res = await fetch(`${apiBase}?before=${messages[0].id}`)
      const data = await res.json()
      if (data.success) {
        const list: Msg[] = data.data.messages || []
        setHasMore(!!data.data.hasMore)
        if (list.length > 0) setMessages((prev) => mergeMessages(prev, list, 'head'))
        else prependHeightRef.current = null
      } else {
        prependHeightRef.current = null
      }
    } catch {
      prependHeightRef.current = null
    } finally {
      setLoadingMore(false)
    }
  }

  // 新消息滚到底部；加载更早时保持原来的阅读位置
  useIsomorphicLayoutEffect(() => {
    const box = boxRef.current
    if (prependHeightRef.current !== null) {
      if (box) box.scrollTop += box.scrollHeight - prependHeightRef.current
      prependHeightRef.current = null
      return
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
        // 直接把服务端返回的这条追加进去，不再整包重拉
        const msg: Msg | undefined = data.data?.message
        if (msg) {
          lastIdRef.current = Math.max(lastIdRef.current, msg.id)
          setMessages((prev) => mergeMessages(prev, [msg], 'tail'))
        }
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
  const moreBtnCls = dark
    ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'

  return (
    <div>
      <div ref={boxRef} className={`rounded-xl border ${boxCls} p-3 h-64 overflow-y-auto space-y-2`}>
        {loading ? (
          <div className={`text-center py-10 text-sm ${dark ? 'text-white/40' : 'text-gray-400'}`}>加载中...</div>
        ) : messages.length === 0 ? (
          <div className={`text-center py-10 text-sm ${dark ? 'text-white/40' : 'text-gray-400'}`}>
            还没有消息，发送第一条开始沟通
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center pb-1">
                <button
                  onClick={loadEarlier}
                  disabled={loadingMore}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] disabled:opacity-50 ${moreBtnCls}`}
                >
                  {loadingMore ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronUp className="w-3 h-3" />}
                  加载更早的消息
                </button>
              </div>
            )}
            {messages.map((m) => {
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
            })}
          </>
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
