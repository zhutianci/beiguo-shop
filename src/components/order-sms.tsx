'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, Loader2, Phone, ShieldCheck, AlertTriangle } from 'lucide-react'

interface SmsData {
  exists: boolean
  status?: string // WAITING | CODE | TIMEOUT | CANCELLED | FAILED
  phone?: string | null
  code?: string | null
  expireAt?: string
}

export default function OrderSms({ orderId }: { orderId: number }) {
  const [data, setData] = useState<SmsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [remain, setRemain] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/sms`)
      const d = await res.json()
      if (d.success) setData(d.data)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    load()
    timer.current = setInterval(load, 5000)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [load])

  // 收到码/结束后停止轮询
  useEffect(() => {
    if (data && data.status !== 'WAITING' && timer.current) {
      clearInterval(timer.current)
      timer.current = null
    }
  }, [data])

  // 倒计时
  useEffect(() => {
    if (!data?.expireAt || data.status !== 'WAITING') return
    const tick = () => setRemain(Math.max(0, Math.floor((new Date(data.expireAt!).getTime() - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [data])

  const copy = (t: string) => navigator.clipboard.writeText(t)
  const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  if (loading) return <div className="text-white/40 text-sm py-3">加载接码信息...</div>
  if (!data?.exists) return <div className="text-white/40 text-sm py-3">正在为你取号，请稍候刷新...</div>

  return (
    <div className="space-y-3">
      {/* 号码 */}
      {data.phone && (
        <div>
          <div className="text-white/50 mb-1 text-sm flex items-center gap-1.5"><Phone className="w-4 h-4" /> 接码号码</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 rounded-lg bg-white/5 border border-white/10 font-mono text-base">{data.phone}</div>
            <button onClick={() => copy(data.phone!)} className="px-3 py-2 rounded-lg glass hover:bg-white/10 text-xs"><Copy className="w-3.5 h-3.5" /></button>
          </div>
          <p className="text-[11px] text-white/40 mt-1">用此号码在对应平台获取验证码（OpenAI 等）。</p>
        </div>
      )}

      {/* 验证码 / 状态 */}
      {data.status === 'CODE' && data.code && (
        <div>
          <div className="text-white/50 mb-1 text-sm flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-green-400" /> 验证码</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 rounded-lg bg-green-500/10 border border-green-500/30 font-mono text-2xl font-bold tracking-widest text-green-300">{data.code}</div>
            <button onClick={() => copy(data.code!)} className="px-3 py-2 rounded-lg glass hover:bg-white/10 text-xs"><Copy className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}

      {data.status === 'WAITING' && (
        <div className="flex items-center gap-2 text-sm text-amber-300 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Loader2 className="w-4 h-4 animate-spin" />
          等待验证码中…{remain > 0 && <span className="font-mono">剩余 {mmss(remain)}</span>}
        </div>
      )}

      {(data.status === 'TIMEOUT' || data.status === 'CANCELLED') && (
        <div className="flex items-start gap-2 text-sm text-red-300 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 mt-0.5" />
          未能收到验证码，订单已标记退款处理，请联系客服。
        </div>
      )}

      {data.status === 'FAILED' && (
        <div className="flex items-start gap-2 text-sm text-red-300 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 mt-0.5" />
          取号失败，请联系客服处理。
        </div>
      )}
    </div>
  )
}
