'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Check, Loader2, Ticket } from 'lucide-react'
import { getAnonId } from '@/lib/forum-client'

/**
 * 领券面板。
 *
 * 【为什么把「立即领取」做成登录后才拦】页面本身是公开的（见 page.tsx 的注释），
 * 用户先看到能拿多少，再去登录，转化率完全不同。未登录时点按钮会带着
 * ?redirect= 跳登录页，登录完自动回到这里 —— 不能让人登录完落到首页，
 * 那等于让他重新去群里翻链接。
 *
 * 【浏览器指纹】x-anon-id 复用论坛那套 localStorage UUID（getAnonId）。
 * 它拦不住换浏览器/无痕，但能拦住同一浏览器反复点，这正是站长要的三限之一。
 */

interface Props {
  code: string
  name: string
  label: string
  kind: string
  discount: number
  minAmount: number
  productNames: string[]
  remaining: number
  total: number
  endAt: string | null
  /** 批次层面不可领时的原因；可领则为 null */
  blocked: string | null
}

type Phase = 'idle' | 'claiming' | 'done' | 'failed'

export function ClaimPanel(props: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('idle')
  const [message, setMessage] = useState('')
  const [authed, setAuthed] = useState<boolean | null>(null)

  // 登录态只在挂载后查，保证服务端直出的 HTML 与首帧一致（避免 hydration 失配）
  useEffect(() => {
    let alive = true
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => alive && setAuthed(!!d?.success && !!d?.data))
      .catch(() => alive && setAuthed(false))
    return () => {
      alive = false
    }
  }, [])

  const claim = useCallback(async () => {
    if (authed === false) {
      // 带上回跳地址，登录完直接回到这张券，而不是丢回首页
      router.push(`/login?redirect=${encodeURIComponent(`/coupon/${props.code}`)}`)
      return
    }
    setPhase('claiming')
    setMessage('')
    try {
      const res = await fetch('/api/coupons/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-anon-id': getAnonId() },
        body: JSON.stringify({ code: props.code }),
      })
      const d = await res.json()
      if (d.success) {
        setPhase('done')
        setMessage(d.message || '领取成功')
      } else {
        setPhase('failed')
        setMessage(d.error || '领取失败')
      }
    } catch {
      setPhase('failed')
      setMessage('网络异常，请稍后重试')
    }
  }, [authed, props.code, router])

  const soldOut = props.remaining <= 0
  const disabled = !!props.blocked || soldOut || phase === 'claiming' || phase === 'done'

  return (
    <div className="mx-auto">
      {/* 券面 */}
      <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-purple-600/20 via-white/[0.06] to-pink-600/15 p-6 lg:p-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1">
          <Ticket className="h-3.5 w-3.5 text-purple-300" />
          <span className="text-xs text-white/70">{props.name}</span>
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-[15px] text-white/60">¥</span>
          <span className="text-6xl font-bold tabular-nums text-white">{props.discount.toFixed(2)}</span>
        </div>
        <p className="mt-2 text-[15px] text-white/70">{props.label}</p>

        {props.productNames.length > 0 && (
          <p className="mt-3 text-[13px] leading-relaxed text-white/50">
            可用于：{props.productNames.slice(0, 3).join('、')}
            {props.productNames.length > 3 && ` 等 ${props.productNames.length} 款`}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-white/45">
          <span className="tabular-nums">
            剩余 <span className="text-white/70">{props.remaining}</span> / {props.total} 张
          </span>
          <span>·</span>
          <span>{props.endAt ? `${new Date(props.endAt).toLocaleDateString('zh-CN')} 前有效` : '长期有效'}</span>
        </div>
      </div>

      {/* 领取按钮 */}
      <div className="mt-5">
        {props.blocked ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white/45">
            <AlertCircle className="h-4 w-4" />
            {props.blocked}
          </div>
        ) : phase === 'done' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3.5 text-sm text-emerald-300">
              <Check className="h-4 w-4" />
              {message}
            </div>
            <div className="flex gap-2">
              <Link
                href="/products"
                className="flex-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-center text-sm font-medium text-white transition-shadow hover:shadow-[0_0_28px_rgba(168,85,247,0.32)]"
              >
                去挑一件用掉
              </Link>
              <Link
                href="/profile"
                className="rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-center text-sm text-white/70 transition-colors hover:bg-white/[0.09]"
              >
                我的券
              </Link>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={claim}
              disabled={disabled}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3.5 text-[15px] font-medium text-white transition-shadow hover:shadow-[0_0_28px_rgba(168,85,247,0.32)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              {phase === 'claiming' && <Loader2 className="h-4 w-4 animate-spin" />}
              {soldOut ? '已被领完' : authed === false ? '登录后领取' : '立即领取'}
            </button>
            {phase === 'failed' && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[13px] text-amber-300/80">
                <AlertCircle className="h-3.5 w-3.5" />
                {message}
              </p>
            )}
          </>
        )}
      </div>

      {/* 规则说明。写清楚能省掉大量客服问答 */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-[13px] leading-relaxed text-white/45">
        <p className="mb-1.5 font-medium text-white/60">使用规则</p>
        <ul className="space-y-1">
          <li>· 每个账户限领 1 张，领取后绑定本账户，仅限本人使用</li>
          <li>· 在商品结算页选择使用，订单按优惠后的金额支付</li>
          <li>· 与推广专属价不叠加，系统自动为你选更便宜的那个</li>
          <li>· 发票税费等场景不可使用</li>
          {props.endAt && <li>· 请在有效期内使用，过期自动失效</li>}
        </ul>
      </div>
    </div>
  )
}
