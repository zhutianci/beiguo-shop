'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { X, Loader2, Info, Wallet, AlertTriangle, ShieldAlert } from 'lucide-react'
import { useHydrated } from '@/lib/use-hydrated'
import { useUserStore } from '@/store/user'
import { fmtYuan } from '@/lib/jiema/pricing'
import {
  payPlan,
  defaultPayWith,
  effectivePayWith,
  payButtonLabel,
  changeDialog,
  shouldRenewOrderToken,
  jiemaSelectionPath,
  loginHref,
  topupHref,
  termsChangedSinceLast,
  termsReaction,
  payPlanSummary,
  type PayWith,
  type ChangeDialog,
} from '@/lib/jiema/ui'
import { JIEMA_TERMS_PATH, JIEMA_TERMS_TITLE, JIEMA_TERMS_VERSION, WALLET_TERMS_TITLE, WALLET_TERMS_VERSION, walletTermsFor } from '@/lib/terms/jiema-wallet'
import { cn } from '@/lib/utils'
import { ConsentDialog } from './consent-dialog'

/**
 * 确认面板的「付款方式 → 去支付」（docs/短信接码-设计.md §1.8、§1.9、§1.14、D1、D24、D27、D32–D34、D37）。
 *
 * 【限高与滚动】（09-24 开票弹窗事故的教训）面板最大高度 100dvh − 页头 − 16px，主体 overflow-y:auto，
 * 按钮、金额与退款说明钉在底栏；内容最长的组合（组合支付 + 首单双条款 + 展开高级选项 + 指定运营商）照样看得到、点得到按钮。
 * 【抵扣额由服务端算】面板上的数字来自 GET /api/account/wallet?brief=1（两格，先充值格），提交 payWith + expectBalanceCents；
 * 服务端锁住用户行后重算，409 PRICE_CHANGED / BALANCE_CHANGED 时一个弹窗同时确认价格与拆分（ui.changeDialog），不会弹第二次。
 * 【登录门禁】先等 useHydrated 再看登录态；没登录点按钮 → /login?redirect=<整段编码的 /jiema?s=&c=&op=&confirm=1>。
 * 【去充值】新标签页打开 /wallet/topup?returnTo=…；回到本页（visibilitychange）重新拉一次余额。
 * 【幂等】clientToken 跟着这一次提交走：服务端已经建单又关掉的（PAY_BUSY、事后复核超限）换一个，其余失败保留（重试时同一张单原样返回）。
 * 【付款前免责弹窗】（§8.6，2026-09-30）面板里不再有条款勾选框：点底栏按钮 → 先弹「下单须知与免责声明」（consent-dialog.tsx，**每一单都弹**，
 * 三种付款方式都走这一步）→ 勾选同意、点「同意并下单」才真正提交（agree: true + 两份条款版本）；取消 = 不下单。
 * 价格 / 余额变化的二次确认（changeDialog）沿用这一次的同意，不再弹第二遍。409 TERMS：服务端带回的版本与本页打包的对不上 → 提示刷新页面
 * （页面是旧的，弹窗里的正文也是旧的）；对得上 → 重新弹窗、清空勾选（ui.termsReaction）。
 */

interface Brief {
  topupCents: number
  cashCents: number
}

interface OpenPayment {
  kind: 'SMS' | 'TOPUP' | 'ORDER'
  orderNo: string
  href: string
  payUrl: string
  amountCents: number
  expiresAt: string
}

export interface CheckoutPanelProps {
  service: { code: string; name: string }
  country: { id: number; name: string; dial: string | null; flag: React.ReactNode }
  op: string | null
  opName: string
  fallback: boolean
  priceCents: number | null
  approx: boolean
  maxReplace: number
  anyOtherNote: string | null
  advanced: React.ReactNode
  orderAvailable: boolean
  payDisabledLabel: string
  balancePayOn: boolean
  lastTerms: { jiema: string | null; wallet: string | null } | null
  onClose: () => void
}

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

const KIND_LABEL: Record<OpenPayment['kind'], string> = { SMS: '短信接码', TOPUP: '余额充值', ORDER: '商品订单' }

export function CheckoutPanel(p: CheckoutPanelProps) {
  const router = useRouter()
  const hydrated = useHydrated()
  const user = useUserStore((s) => s.user)
  const loggedIn = hydrated && !!user
  const returnPath = jiemaSelectionPath(p.service.code, p.country.id, p.op, true)

  // ---------- 余额（两格）----------
  const [brief, setBrief] = useState<Brief | null>(null)
  const [briefErr, setBriefErr] = useState(false)
  const loadBrief = useCallback(async () => {
    try {
      const res = await fetch('/api/account/wallet?brief=1', { cache: 'no-store' })
      if (res.status === 401) {
        setBrief(null)
        return
      }
      const d = await res.json().catch(() => null)
      if (d?.success) {
        setBrief({ topupCents: Number(d.data.topupCents) || 0, cashCents: Number(d.data.cashCents) || 0 })
        setBriefErr(false)
      } else setBriefErr(true)
    } catch {
      setBriefErr(true)
    }
  }, [])
  useEffect(() => {
    if (!loggedIn) return
    void loadBrief()
    // 「去充值」在新标签页：回到本页时重新拉一次余额（§1.8）
    const onVis = () => {
      if (document.visibilityState === 'visible') void loadBrief()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [loggedIn, loadBrief])
  const avail = brief ? brief.topupCents + brief.cashCents : 0

  // ---------- 付款方式（默认：余额 > 0 且余额支付开着 → 余额抵扣）----------
  const [payWith, setPayWith] = useState<PayWith | null>(null)
  const touched = useRef(false)
  // 下单时收到 503 BALANCE_PAY_OFF（余额支付刚被急停）：本面板按「余额支付关」算，切回页面也不再默认回余额（S2b 评审修复）
  const [balanceOff, setBalanceOff] = useState(false)
  const balanceOn = p.balancePayOn && !balanceOff
  useEffect(() => {
    if (!brief || touched.current) return
    setPayWith(defaultPayWith(avail, balanceOn))
  }, [brief, avail, balanceOn])
  // 界面显示与提交共用同一个判定：可用余额为 0 时一律按支付宝（不再「显示支付宝、提交余额」）
  const payWithNow: PayWith = effectivePayWith(payWith, avail, balanceOn)
  const price = p.priceCents ?? 0
  const plan = useMemo(() => payPlan(price, brief?.topupCents ?? 0, brief?.cashCents ?? 0, payWithNow), [price, brief, payWithNow])

  // ---------- 条款：每一单付款前弹「下单须知与免责声明」，勾选同意后才提交（§8.6）----------
  const termsUpdated = termsChangedSinceLast(p.lastTerms, { jiema: JIEMA_TERMS_VERSION, wallet: WALLET_TERMS_VERSION })
  const [consentOpen, setConsentOpen] = useState(false)
  // 这一次提交是否已在弹窗里同意（只由「同意并下单」置 true；每次点底栏按钮重新置 false 再弹窗）
  const agreed = useRef(false)
  // 409 TERMS 且服务端版本与本页不同：本页的条款正文已过期，只能刷新
  const [termsStale, setTermsStale] = useState(false)

  // ---------- 提交 ----------
  const token = useRef<string>(uuid())
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [openPays, setOpenPays] = useState<OpenPayment[] | null>(null)
  const [dialog, setDialog] = useState<ChangeDialog | null>(null)

  /** 底栏按钮：登录门禁之后先弹免责弹窗（不直接提交） */
  const askConsent = () => {
    if (!p.orderAvailable || submitting || p.priceCents == null) return
    if (!hydrated) return
    if (!user) {
      router.push(loginHref(returnPath))
      return
    }
    if (termsStale) {
      window.location.reload()
      return
    }
    agreed.current = false
    setMsg(null)
    setConsentOpen(true)
  }

  const onConsent = () => {
    agreed.current = true
    setConsentOpen(false)
    void submit()
  }

  const submit = async (over?: ChangeDialog['next']) => {
    if (!p.orderAvailable || submitting || p.priceCents == null) return
    if (!hydrated) return
    if (!user) {
      router.push(loginHref(returnPath))
      return
    }
    if (!agreed.current) {
      // 只有弹窗里点「同意并下单」之后才会走到这里；兜底：没同意就重新弹窗，不提交
      setConsentOpen(true)
      return
    }
    setSubmitting(true)
    setMsg(null)
    setOpenPays(null)
    const pw = over ? over.payWith : payWithNow
    const expectPrice = over ? over.expectPriceCents : price
    const expectBal = over ? over.expectBalanceCents : pw === 'BALANCE' ? plan.balanceCents : null
    try {
      const res = await fetch('/api/jiema/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: p.service.code,
          country: p.country.id,
          operator: p.op,
          operatorFallback: p.op ? p.fallback : true,
          expectPriceCents: expectPrice,
          payWith: pw,
          expectBalanceCents: pw === 'BALANCE' ? expectBal : null,
          clientToken: token.current,
          agree: true,
          termsVersion: JIEMA_TERMS_VERSION,
          walletTermsVersion: WALLET_TERMS_VERSION,
        }),
      })
      const d = await res.json().catch(() => null)
      if (res.status === 401) {
        router.push(loginHref(returnPath))
        return
      }
      if (d?.success) {
        const r = d.data as { orderNo: string; next: 'NUMBER' | 'CASHIER'; payUrl?: string }
        if (r.next === 'CASHIER' && r.payUrl && /^\/pay\/[0-9A-Za-z]+$/.test(r.payUrl)) router.push(r.payUrl)
        else router.push(`/jiema/order/${encodeURIComponent(r.orderNo)}`)
        return
      }
      const code = (d?.code as string) || ''
      if (shouldRenewOrderToken(res.status, code, { released: d?.released })) token.current = uuid()
      if (code === 'PRICE_CHANGED' || code === 'BALANCE_CHANGED') {
        const dlg = changeDialog(code, { oldPriceCents: expectPrice, payWith: pw }, d ?? {})
        if (dlg) {
          setDialog(dlg)
          if (code === 'BALANCE_CHANGED') void loadBrief()
          return
        }
      }
      if (code === 'TERMS') {
        agreed.current = false
        if (termsReaction(d, { jiema: JIEMA_TERMS_VERSION, wallet: WALLET_TERMS_VERSION }) === 'RELOAD') {
          setTermsStale(true)
          setMsg(`《${JIEMA_TERMS_TITLE}》或《${WALLET_TERMS_TITLE}》已更新，请刷新页面后重新阅读并同意`)
        } else {
          setMsg((d?.error as string) || '请先阅读「下单须知与免责声明」，勾选同意后再下单')
          setConsentOpen(true)
        }
        return
      }
      if (code === 'OPEN_PAYMENTS' && Array.isArray(d?.items)) setOpenPays(d.items as OpenPayment[])
      if (code === 'BALANCE_PAY_OFF') {
        touched.current = true
        setBalanceOff(true)
        setPayWith('ALIPAY')
      }
      setMsg((d?.error as string) || `下单失败（${res.status}），请稍后再试`)
    } catch {
      setMsg('网络不稳定，请重试（不会重复下单）')
    } finally {
      setSubmitting(false)
    }
  }

  const continueDialog = () => {
    const d = dialog
    setDialog(null)
    if (!d) return
    touched.current = true
    setPayWith(d.next.payWith)
    void submit(d.next)
  }

  const btnLabel = !p.orderAvailable ? p.payDisabledLabel : !hydrated ? '去支付' : !user ? '登录后去支付' : termsStale ? '刷新页面后重新下单' : payButtonLabel(plan)
  const walletTerms = walletTermsFor(balanceOn)
  // 弹窗底栏的本单摘要：服务 · 国家/地区 · 与底栏按钮同一个付款文案
  const consentSummary = `${p.service.name} · ${p.country.name}${p.op ? ` · ${p.opName}` : ''} · ${payPlanSummary(plan)}`

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="确认订单">
      <button className="absolute inset-0 bg-black/60" aria-label="关闭" onClick={p.onClose} />
      <div
        className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0b0b12] shadow-2xl"
        style={{ maxHeight: 'calc(100dvh - var(--header-h, 7rem) - 16px)' }}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <span className="text-sm font-medium text-white/85">确认订单</span>
          <button onClick={p.onClose} aria-label="关闭" className="rounded-full p-1 text-white/60 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4 text-sm">
          <div className="grid grid-cols-[4.5rem_1fr] gap-y-2">
            <span className="text-white/45">服务</span>
            <span className="text-white/85">{p.service.name}</span>
            <span className="text-white/45">国家/地区</span>
            <span className="flex items-center gap-2 text-white/85">
              {p.country.flag}
              {p.country.name}
              {p.country.dial ? ` +${p.country.dial}` : ''}
            </span>
            <span className="text-white/45">有效期</span>
            <span className="text-white/85">20 分钟 · 收码前可免费换号 {p.maxReplace} 次</span>
          </div>
          {p.anyOtherNote && <p className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100/85">{p.anyOtherNote}</p>}
          {p.advanced}
          <div className="flex items-baseline justify-between">
            <span className="text-white/45">应付</span>
            <span className="text-xl font-semibold tabular-nums">{p.priceCents != null ? `${p.approx ? '约 ' : ''}${fmtYuan(p.priceCents)}` : '—'}</span>
          </div>
          {p.approx && <p className="text-xs text-white/40">这个价格来自每 10 分钟的全量报价，下单时以实时价格为准。</p>}

          {/* 付款方式（§1.8 的三种显示） */}
          <div className="space-y-2">
            <div className="text-white/45">付款方式</div>
            {!hydrated ? (
              <div className="h-10 animate-pulse rounded-xl bg-white/[0.05]" />
            ) : !user ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[13px] text-white/60">
                支付宝付款；登录后可以用站内余额抵扣（余额够时免扫码）。
              </div>
            ) : (
              <>
                {balanceOn ? (
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5',
                      payWithNow === 'BALANCE' ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-white/10 bg-white/[0.03]',
                      avail <= 0 && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    <input
                      type="radio"
                      name="payWith"
                      className="mt-1"
                      disabled={avail <= 0}
                      checked={payWithNow === 'BALANCE'}
                      onChange={() => {
                        touched.current = true
                        setPayWith('BALANCE')
                      }}
                    />
                    <span className="min-w-0 flex-1 text-[13px]">
                      <span className="flex flex-wrap items-center gap-x-2 text-white/85">
                        <Wallet className="h-3.5 w-3.5 text-cyan-300" />
                        {avail >= price && price > 0 ? (
                          <>
                            余额付清 {fmtYuan(price)} · <span className="text-emerald-300">无需扫码</span>
                          </>
                        ) : (
                          <>余额抵扣</>
                        )}
                        <span className="text-white/45">
                          {brief == null ? (briefErr ? '余额读取失败' : '读取余额…') : `可用 ${fmtYuan(avail)}（充值余额 ${fmtYuan(brief.topupCents)} · 返现余额 ${fmtYuan(brief.cashCents)}）`}
                        </span>
                        <a href={topupHref(returnPath)} target="_blank" rel="noopener" className="text-cyan-300/90 hover:underline" onClick={(e) => e.stopPropagation()}>
                          去充值
                        </a>
                      </span>
                      {payWithNow === 'BALANCE' && plan.mode === 'MIXED' && (
                        <span className="mt-1 block text-xs leading-relaxed text-white/55">
                          余额抵扣 {fmtYuan(plan.balanceCents)}，还需支付宝 {fmtYuan(plan.alipayCents)}。余额部分下单时先预扣；20 分钟内付完支付宝才算成功，超时或取消订单，预扣的余额自动退回。
                        </span>
                      )}
                    </span>
                  </label>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/45">余额支付暂时维护中，请选择支付宝（已预扣的订单不受影响）</div>
                )}
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[13px]',
                    payWithNow === 'ALIPAY' ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-white/10 bg-white/[0.03]',
                  )}
                >
                  <input
                    type="radio"
                    name="payWith"
                    checked={payWithNow === 'ALIPAY'}
                    onChange={() => {
                      touched.current = true
                      setPayWith('ALIPAY')
                    }}
                  />
                  <span className="text-white/85">支付宝 {fmtYuan(price)}</span>
                </label>
              </>
            )}
          </div>

          {/* 条款（§8.6）：不在面板里勾选；点底栏按钮后弹「下单须知与免责声明」，每一单都要勾选同意（不论哪种付款方式：
              没收到码时支付宝付的部分同样退进充值余额，受《余额与充值规则》约束） */}
          <p className="flex items-start gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-white/60">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
            <span>
              本服务仅限用于学习交流、软件开发测试与本人合法注册验证等合法用途，严禁用于违法犯罪。付款前会弹出「下单须知与免责声明」，阅读并勾选同意
              <a href={JIEMA_TERMS_PATH} target="_blank" rel="noopener" className="mx-0.5 text-cyan-300/90 hover:underline">
                《{JIEMA_TERMS_TITLE}》
              </a>
              与《{WALLET_TERMS_TITLE}》后才会下单。
            </span>
          </p>

          {openPays && openPays.length > 0 && (
            <ul className="space-y-1 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/85">
              {openPays.map((x) => (
                <li key={`${x.kind}:${x.orderNo}`} className="flex flex-wrap items-center gap-2">
                  <span>
                    {KIND_LABEL[x.kind]} {fmtYuan(x.amountCents)}
                  </span>
                  <Link href={x.payUrl} className="text-cyan-200 hover:underline">
                    继续付款
                  </Link>
                  <Link href={x.href} className="text-white/60 hover:underline">
                    查看
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <p className="text-xs text-white/40">
            暂不支持开票，可
            <Link href="/support" target="_blank" className="text-cyan-300/90 hover:underline">
              联系客服
            </Link>
            开票处理
          </p>
        </div>

        {/* 底栏（钉住，永远可见）：按钮 + 金额 + 退款说明 */}
        <div className="border-t border-white/10 bg-[#0b0b12] px-5 py-3">
          {msg && (
            <p role="alert" className="mb-2 flex items-start gap-1.5 text-xs leading-relaxed text-amber-200">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {msg}
            </p>
          )}
          <button
            onClick={askConsent}
            disabled={!p.orderAvailable || submitting || p.priceCents == null}
            className="ui-btn ui-btn-brand min-h-[48px] w-full rounded-xl px-5 text-base"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {btnLabel}
          </button>
          <p className="mt-2 flex items-start gap-1 text-[11px] leading-relaxed text-white/45">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            号码 20 分钟有效。没收到短信的，号码到期或你主动取消后，本单整单退回站内余额（含支付宝付的部分）；退回的余额不能提现、不退回支付宝，目前可用于短信接码。
          </p>
        </div>

        {dialog && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 px-5" role="alertdialog" aria-modal="true">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#12121c] p-5">
              <p className="text-sm leading-relaxed text-white/85">{dialog.text}</p>
              <div className="mt-4 flex gap-2">
                <button onClick={continueDialog} className="ui-btn ui-btn-brand min-h-[40px] flex-1 rounded-xl px-4 text-sm">
                  {dialog.confirmLabel}
                </button>
                <button onClick={() => { setDialog(null); p.onClose() }} className="flex-1 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/75 hover:bg-white/10">
                  重新选择
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 付款前免责弹窗（每一单都弹；每次打开重新挂载，勾选从「未勾」开始） */}
      {consentOpen && (
        <ConsentDialog
          walletLines={walletTerms}
          updated={termsUpdated}
          summary={consentSummary}
          onCancel={() => {
            agreed.current = false
            setConsentOpen(false)
          }}
          onConfirm={onConsent}
        />
      )}
    </div>
  )
}
