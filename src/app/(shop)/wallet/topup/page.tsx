'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, PlusCircle, Info, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { ContactModal } from '@/components/contact-modal'
import { useHydrated } from '@/lib/use-hydrated'
import { useUserStore } from '@/store/user'
import { WALLET_TERMS_TITLE, walletTermsFor } from '@/lib/terms/jiema-wallet'
import { parseCustomYuan, shouldResetTopupToken, CUSTOM_YUAN_MAX_LEN } from '@/lib/wallet/topup-input'

/**
 * 余额充值 /wallet/topup（docs/短信接码-设计.md §1.16、D35、D36、D37）。
 *
 * 【档位与上下限都来自接口】GET /api/wallet/topup 的 tiersCents / minCents / maxCents（wallet_config，后台可在 ¥1–1,000 内调），
 * 文案按它拼（「请输入 {min}–{max} 之间的整数金额」），不写死 1–1000。**不设充值余额总额上限**：没有「剩余额度」「本次最多可充」。
 * 【自定义金额只收整数元】收银台按分递增分配唯一金额，整数元让识别尾差一目了然（¥12.03 = 充值 ¥12 + 3 分识别尾差）。
 *   输入框保留原文、不「修正」：输入 0.5 / 12.5 / 12.50 当场提示「请输入 {min}–{max} 之间的整数金额」并置灰「去支付」
 *   （原来删掉小数点把 12.5 变成 125，B1 评审修复；判断在 lib/wallet/topup-input.ts，check-wallet-b1 直接测）。
 * 【规则全文】第 2 条（余额付接码、预扣）只在 canUseForJiema 时出现（walletTermsFor，§1.15 同一口径）。
 * 【幂等】clientToken 跟着「这一次选定的金额」走：换了金额就换一个 token（否则服务端会把上一次那张不同金额的单返回来）。
 * 【登录门禁】先等 useHydrated 再看登录态（水合那一次渲染 user 恒为 null）。
 * 【开票】说明区固定一行「暂不支持开票，可联系客服开票处理」（D37 清单第 ① 项）。
 */

interface Pending {
  orderNo: string
  amountCents: number
  payCents: number
  payUrl: string
  expiresAt: string
}
interface TopupData {
  enabled: boolean
  tiersCents?: number[]
  minCents?: number
  maxCents?: number
  balanceCents?: number
  topupCents?: number
  termsVersion?: string
  termsAgreed?: boolean
  canUseForJiema?: boolean
  pending?: Pending[]
}

function yuan(cents: number): string {
  return `¥${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`
}
const yuanInt = (cents: number) => String(Math.round(cents / 100))

function uuid(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  } catch {
    /* 退回下面的写法 */
  }
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

function mmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function WalletTopupPage() {
  const router = useRouter()
  const hydrated = useHydrated()
  const user = useUserStore((s) => s.user)
  const [data, setData] = useState<TopupData | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [picked, setPicked] = useState<number | 'custom' | null>(null)
  const [custom, setCustom] = useState('')
  const [agree, setAgree] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')
  const [contactOpen, setContactOpen] = useState(false)
  const [copied, setCopied] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const tokenRef = useRef<{ amount: number; token: string } | null>(null)
  const returnTo = useRef<string | null>(null)

  const load = useCallback(async () => {
    setFailed(false)
    try {
      const res = await fetch('/api/wallet/topup', { cache: 'no-store' })
      if (res.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent('/wallet/topup')}`)
        return
      }
      const d = await res.json()
      if (!d.success) {
        setFailed(true)
        return
      }
      const v = d.data as TopupData
      setData(v)
      if (v.termsAgreed) setAgree(true)
      setPicked((p) => (p == null && v.tiersCents?.length ? v.tiersCents[v.tiersCents.length - 1] : p))
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (!hydrated) return
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent('/wallet/topup' + (typeof window !== 'undefined' ? window.location.search : ''))}`)
      return
    }
    try {
      const r = new URLSearchParams(window.location.search).get('returnTo')
      returnTo.current = r && r.startsWith('/jiema') && r.length <= 120 ? r : null
    } catch {
      returnTo.current = null
    }
    load()
  }, [hydrated, user, router, load])

  // 待支付条目的倒计时
  useEffect(() => {
    if (!data?.pending?.length) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [data?.pending?.length])

  const min = data?.minCents ?? 100
  const max = data?.maxCents ?? 100000
  const rangeMsg = `请输入 ${yuanInt(min)}–${yuanInt(max)} 之间的整数金额`

  /** 当前选定的金额（分）；自定义不合法时为 null */
  const amountCents = useMemo<number | null>(() => {
    if (picked == null) return null
    if (picked !== 'custom') return picked
    return parseCustomYuan(custom, min, max)
  }, [picked, custom, min, max])
  const customBad = picked === 'custom' && custom.trim() !== '' && amountCents == null

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(text)
        setTimeout(() => setCopied(''), 1500)
      },
      () => undefined,
    )
  }

  const submit = async () => {
    if (amountCents == null || !agree || submitting || !data?.termsVersion) return
    setMsg('')
    if (!tokenRef.current || tokenRef.current.amount !== amountCents) tokenRef.current = { amount: amountCents, token: uuid() }
    setSubmitting(true)
    try {
      const res = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents, clientToken: tokenRef.current.token, termsVersion: data.termsVersion, returnTo: returnTo.current }),
      })
      const d = await res.json().catch(() => null)
      if (d?.success && d.data?.payUrl) {
        window.location.href = d.data.payUrl
        return
      }
      if (res.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent('/wallet/topup')}`)
        return
      }
      // 那一笔已关闭 / 已到账，或服务端已在同一请求里把它关掉（BUSY、OPEN_PAYMENTS）：换一个 token，下次按新的一笔下单
      if (shouldResetTopupToken(d?.code)) tokenRef.current = null
      setMsg(d?.error || '发起充值失败，请稍后再试')
      if (d?.code === 'TOO_MANY_PENDING' || d?.code === 'TERMS' || d?.code === 'AMOUNT') load()
    } catch {
      setMsg('网络异常，请稍后再试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen page-top pb-20">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none fixed left-1/4 top-24 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[128px]" />

      <div className="container relative max-w-xl">
        <Link href="/wallet" className="inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white/80">
          <ArrowLeft className="h-4 w-4" />
          账户余额
        </Link>
        <header className="mb-6 mt-5">
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <PlusCircle className="h-6 w-6 text-cyan-300" />
            余额充值
          </h1>
        </header>

        {loading ? (
          <div className="flex justify-center py-16 text-white/30">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : failed || !data ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center">
            <p className="text-sm text-white/45">加载失败</p>
            <button onClick={() => load()} className="mt-3 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm text-white/70 hover:bg-white/10">
              重试
            </button>
          </div>
        ) : !data.enabled ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center">
            <p className="text-base text-white/70">余额充值即将开放</p>
            <Link href="/wallet" className="mt-4 inline-block text-sm text-cyan-300/90 hover:underline">
              返回账户余额
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="text-sm text-white/60">
              当前余额 <span className="font-semibold tabular-nums text-white/90">{yuan(data.balanceCents ?? 0)}</span>
              <span className="text-white/40">（充值余额 {yuan(data.topupCents ?? 0)}）</span>
            </div>

            {(data.pending ?? []).map((p) => {
              const left = new Date(p.expiresAt).getTime() - now
              return (
                <div key={p.orderNo} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-100/90">
                  <span className="min-w-0 flex-1">
                    你有 1 笔充值 {yuan(p.amountCents)} 待支付{left > 0 ? `（剩余 ${mmss(left)}）` : '（即将超时关闭）'}
                  </span>
                  <a href={p.payUrl} className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-amber-50 hover:bg-amber-500/30">
                    继续支付
                  </a>
                  <button onClick={() => copy(p.orderNo)} className="inline-flex items-center gap-1 text-xs text-amber-100/70 hover:text-amber-50">
                    {copied === p.orderNo ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    复制充值单号
                  </button>
                </div>
              )
            })}

            <section className="glass rounded-3xl p-5 sm:p-6">
              <div className="mb-3 text-sm text-white/60">选择金额</div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {(data.tiersCents ?? []).map((t) => (
                  <button
                    key={t}
                    onClick={() => setPicked(t)}
                    className={`rounded-xl border px-2 py-2.5 text-sm tabular-nums transition-colors ${
                      picked === t ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-100' : 'border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/10'
                    }`}
                  >
                    ¥{yuanInt(t)}
                  </button>
                ))}
                <button
                  onClick={() => setPicked('custom')}
                  className={`rounded-xl border px-2 py-2.5 text-sm transition-colors ${
                    picked === 'custom' ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-100' : 'border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/10'
                  }`}
                >
                  其他
                </button>
              </div>
              {picked === 'custom' && (
                <div className="mt-3">
                  <label className="flex flex-wrap items-center gap-2 text-sm text-white/70">
                    其他金额
                    <input
                      value={custom}
                      onChange={(e) => setCustom(e.target.value.slice(0, CUSTOM_YUAN_MAX_LEN))}
                      inputMode="numeric"
                      autoFocus
                      className="w-28 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-white outline-none focus:border-cyan-400/60"
                    />
                    元<span className="text-xs text-white/40">（{yuanInt(min)}–{yuanInt(max)} 的整数）</span>
                  </label>
                  {customBad && <p className="mt-1.5 text-xs text-rose-300">{rangeMsg}</p>}
                </div>
              )}

              <ul className="mt-5 space-y-1.5 border-t border-white/10 pt-4 text-[13px] leading-relaxed text-white/50">
                <li>· {data.canUseForJiema ? '充值余额可用于支付短信接码订单；没有有效期。' : '充值余额没有有效期。'}</li>
                <li>· 充值余额不能提现。</li>
                <li>
                  · 暂不支持开票，可
                  <button onClick={() => setContactOpen(true)} className="text-cyan-300/90 underline-offset-2 hover:underline">
                    联系客服
                  </button>
                  开票处理。
                </li>
                <li>· 收银台金额可能带几分钱尾数，实付多少到账多少。</li>
              </ul>

              <div className="mt-4 text-[13px] text-white/60">
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-0.5" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                  <span>
                    我已阅读
                    <button onClick={() => setTermsOpen((v) => !v)} className="inline-flex items-center text-cyan-300/90 hover:underline">
                      《{WALLET_TERMS_TITLE}》
                      {termsOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                  </span>
                </label>
                {termsOpen && (
                  <ol className="mt-2 list-decimal space-y-1 rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-8 pr-4 text-xs leading-relaxed text-white/55">
                    {walletTermsFor(!!data.canUseForJiema).map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ol>
                )}
              </div>

              {msg && <p className="mt-4 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-200">{msg}</p>}

              <button
                onClick={submit}
                disabled={amountCents == null || !agree || submitting}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3 text-base font-medium disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                去支付{amountCents != null ? ` ${yuan(amountCents)}` : ''}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1 text-xs text-white/40">
                <Info className="h-3.5 w-3.5" />
                付了款没到账？
                <button onClick={() => setContactOpen(true)} className="text-cyan-300/90 hover:underline">
                  联系客服
                </button>
              </p>
            </section>
          </div>
        )}
      </div>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  )
}
