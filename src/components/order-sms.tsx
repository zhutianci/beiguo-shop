'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Copy, Loader2, Phone, RefreshCw, ShieldCheck } from 'lucide-react'

interface SmsData {
  exists: boolean
  status?: string // WAITING | CODE | TIMEOUT | CANCELLED | FAILED
  phone?: string | null
  code?: string | null
  expireAt?: string
  retryCount?: number
  maxRetry?: number
  /** 绝对时间。到了这个点才允许换号 */
  canRetryAt?: string
}

export default function OrderSms({ orderId }: { orderId: number }) {
  const [data, setData] = useState<SmsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [remain, setRemain] = useState(0)
  const [cool, setCool] = useState(0)
  const [retrying, setRetrying] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
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

  // 两个倒计时：号码有效期、换号冷却。
  // 都按「绝对时间 - 现在」每秒重算，而不是自减——切后台再回来时自减会走慢
  useEffect(() => {
    if (data?.status !== 'WAITING') return
    const tick = () => {
      if (data.expireAt) {
        setRemain(Math.max(0, Math.floor((new Date(data.expireAt).getTime() - Date.now()) / 1000)))
      }
      if (data.canRetryAt) {
        setCool(Math.max(0, Math.ceil((new Date(data.canRetryAt).getTime() - Date.now()) / 1000)))
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [data])

  const copy = (t: string) => navigator.clipboard.writeText(t)
  const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const used = data?.retryCount ?? 0
  const max = data?.maxRetry ?? 0
  const left = Math.max(0, max - used)

  async function retry() {
    if (retrying) return
    setRetrying(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/orders/${orderId}/sms/retry`, { method: 'POST' })
      const d = await res.json()
      if (d.success) setMsg('已换新号码，请用下面这个重新获取验证码')
      else setMsg(d.error || '换号失败')
    } catch {
      setMsg('网络异常，请重试')
    } finally {
      setRetrying(false)
      // 成功失败都重新拉一次：失败时剩余次数/冷却也可能已经变了
      load()
    }
  }

  if (loading) return <div className="text-white/40 text-sm py-3">加载接码信息...</div>
  if (!data?.exists) return <div className="text-white/40 text-sm py-3">正在为你取号，请稍候刷新...</div>

  return (
    <div className="space-y-3">
      {/* 号码 */}
      {data.phone && (
        <div>
          <div className="text-white/50 mb-1 text-sm flex items-center gap-1.5">
            <Phone className="w-4 h-4" /> 接码号码
            {used > 0 && <span className="text-[11px] text-white/30">（已换 {used} 次）</span>}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 rounded-lg bg-white/5 border border-white/10 font-mono text-base">{data.phone}</div>
            <button
              onClick={() => copy(data.phone!)}
              aria-label="复制号码"
              className="px-3 py-2 rounded-lg glass hover:bg-white/10 text-xs"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-white/40 mt-1">用此号码在对应平台获取验证码（OpenAI 等）。</p>
        </div>
      )}

      {/* 验证码 */}
      {data.status === 'CODE' && data.code && (
        <div>
          <div className="text-white/50 mb-1 text-sm flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-green-400" /> 验证码
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 rounded-lg bg-green-500/10 border border-green-500/30 font-mono text-2xl font-bold tracking-widest text-green-300">
              {data.code}
            </div>
            <button
              onClick={() => copy(data.code!)}
              aria-label="复制验证码"
              className="px-3 py-2 rounded-lg glass hover:bg-white/10 text-xs"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {data.status === 'WAITING' && (
        <>
          <div className="flex items-center gap-2 text-sm text-amber-300 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            等待验证码中…{remain > 0 && <span className="font-mono">剩余 {mmss(remain)}</span>}
          </div>

          {/*
            换号。号码取到手不代表收得到码——目标平台可能拉黑了这个号段，
            或者这个号刚被别人用过。与其让买家干等到超时再找客服退款，
            不如直接给一个换号按钮。
            冷却 120 秒是必要的：上游对刚取的号通常不允许立刻取消，
            而且短信本来也可能要等一两分钟才到。
          */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm text-white/70">收不到验证码？</div>
                <div className="text-[11px] text-white/40 mt-0.5">
                  {left > 0 ? (
                    <>换一个号码重试，还可换 {left} 次{cool > 0 && <>（{cool} 秒后可用）</>}</>
                  ) : (
                    <>已达换号次数上限，请联系客服处理</>
                  )}
                </div>
              </div>
              <button
                onClick={retry}
                disabled={retrying || cool > 0 || left <= 0}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium glass transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {retrying ? '换号中' : cool > 0 ? `${cool}s` : '换一个号'}
              </button>
            </div>
            {msg && <div className="mt-2 text-[11px] text-white/60">{msg}</div>}
          </div>
        </>
      )}

      {(data.status === 'TIMEOUT' || data.status === 'CANCELLED') && (
        <div className="flex items-start gap-2 text-sm text-red-300 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          未能收到验证码，订单已标记退款处理，请联系客服。
        </div>
      )}

      {data.status === 'FAILED' && (
        <div className="flex items-start gap-2 text-sm text-red-300 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          取号失败，请联系客服处理。
        </div>
      )}
    </div>
  )
}
