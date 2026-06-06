'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface PayInfo {
  orderId: string
  bizType: string
  price: number
  reallyPrice: number
  type: number
  state: number
  createdAt: string
  timeoutMin: number
  payDate: string | null
}

// 收款码图片：把你的支付宝个人收款码图片放到 public/vmq-alipay-qr.png
const QR_IMG = '/vmq-alipay-qr.png'

export default function VmqCashierPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = String(params.orderId || '')
  const [info, setInfo] = useState<PayInfo | null>(null)
  const [state, setState] = useState<'loading' | 'pending' | 'paid' | 'expired' | 'notfound'>('loading')
  const [remain, setRemain] = useState<number>(0)
  const [qrOk, setQrOk] = useState(true)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = async () => {
    try {
      const res = await fetch(`/api/pay/vmq/status?orderId=${encodeURIComponent(orderId)}`)
      const data = await res.json()
      if (!data.success) {
        setState('notfound')
        return
      }
      const d: PayInfo = data.data
      setInfo(d)
      if (d.state === 1) setState('paid')
      else if (d.state === -1) setState('expired')
      else setState('pending')
    } catch {
      setState('notfound')
    }
  }

  useEffect(() => {
    load()
    timer.current = setInterval(load, 3000)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  // 倒计时
  useEffect(() => {
    if (!info || state !== 'pending') return
    const deadline = new Date(info.createdAt).getTime() + info.timeoutMin * 60_000
    const tick = () => setRemain(Math.max(0, Math.floor((deadline - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [info, state])

  // 支付成功后停止轮询并跳转
  useEffect(() => {
    if (state === 'paid' && timer.current) {
      clearInterval(timer.current)
      const dest = info?.bizType === 'invoice' ? '/lookup' : '/orders'
      const t = setTimeout(() => router.push(dest), 2500)
      return () => clearTimeout(t)
    }
  }, [state, info, router])

  const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-[#1677FF] font-semibold">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.97 17.96c-.83-.27-3.05-.96-5.85-1.97 1.65-2.85 2.39-5.97 1.66-6.6-.83-.71-3.05.45-4.91 1.55-.94-1.36-2.18-2.7-3.6-3.6.93-.5 1.95-.92 2.84-1.16.78-.22 1.56-.27 2.18-.07.43.14.66.39.66.74 0 .42-.39.96-1.31 1.43-.18.09-.27.31-.18.5.07.13.21.2.36.2.07 0 .14-.02.21-.05 1.13-.59 1.78-1.28 1.94-2.03.12-.61-.07-1.21-.55-1.66-.62-.55-1.64-.83-2.88-.55-1.13.27-2.43.84-3.62 1.55C9.07 5.51 8.04 5 7.04 4.71c-1.36-.4-2.61-.13-3.34.71-1.27 1.43-.5 4.21 1.91 6.84-.36.16-.7.34-1.01.52-1.86 1.09-2.98 2.41-3.13 3.75-.13 1.14.43 2.17 1.55 2.86 1.14.7 2.71.83 4.46.36 1.7-.45 3.55-1.45 5.21-2.81.16.18.32.36.48.52 2.43 2.43 5.55 3.74 7.13 2.16 1.45-1.45.21-3.81-2.07-6.21l3.94-1.59c.18-.07.29-.27.21-.45-.07-.21-.27-.32-.43-.25z" />
            </svg>
            支付宝扫码支付
          </div>
        </div>

        {state === 'loading' && <div className="text-center py-12 text-gray-400">加载中...</div>}
        {state === 'notfound' && <div className="text-center py-12 text-gray-500">订单不存在</div>}

        {state === 'paid' && (
          <div className="text-center py-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">支付成功</h2>
            <p className="text-gray-500 text-sm">正在跳转...</p>
          </div>
        )}

        {state === 'expired' && (
          <div className="text-center py-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2">订单已过期</h2>
            <p className="text-gray-500 text-sm mb-6">该支付订单已超时，请返回重新发起支付。</p>
            <button onClick={() => router.back()} className="px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium">
              返回
            </button>
          </div>
        )}

        {state === 'pending' && info && (
          <>
            <div className="text-center mb-5">
              <div className="text-sm text-gray-500">请使用支付宝精确支付</div>
              <div className="text-4xl font-bold text-gray-900 mt-1">¥{info.reallyPrice.toFixed(2)}</div>
              {info.reallyPrice !== info.price && (
                <div className="text-xs text-amber-600 mt-1">
                  为区分订单已自动微调金额（原价 ¥{info.price.toFixed(2)}），请按上方金额付款
                </div>
              )}
            </div>

            <div className="flex justify-center mb-5">
              <div className="p-3 rounded-xl border border-gray-200">
                {qrOk ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={QR_IMG} alt="支付宝收款码" onError={() => setQrOk(false)} className="w-56 h-56 object-contain" />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-center text-xs text-gray-400 px-4">
                    未配置收款码图片
                    <br />
                    （请将收款码放到 public/vmq-alipay-qr.png）
                  </div>
                )}
              </div>
            </div>

            <div className="text-center text-sm text-gray-500 mb-4">
              {remain > 0 ? (
                <>
                  支付剩余时间 <span className="font-mono font-semibold text-gray-900">{mmss(remain)}</span>
                </>
              ) : (
                '即将过期...'
              )}
            </div>

            <ol className="text-xs text-gray-500 space-y-1 bg-gray-50 rounded-lg p-4">
              <li>1. 打开支付宝「扫一扫」，扫描上方收款码</li>
              <li>2. <span className="text-red-500 font-medium">务必</span>输入金额 <span className="font-semibold text-gray-900">¥{info.reallyPrice.toFixed(2)}</span>（与上方一致）后付款</li>
              <li>3. 付款成功后本页面会自动跳转，无需手动操作</li>
            </ol>

            <p className="mt-4 text-center text-[11px] text-gray-400">
              到账确认依赖收款监控，正常 1~30 秒内自动确认；若长时间未跳转请联系客服并提供支付截图。
            </p>
          </>
        )}
      </div>
    </div>
  )
}
