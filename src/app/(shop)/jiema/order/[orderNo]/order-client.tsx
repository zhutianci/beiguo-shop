'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Globe2,
  HelpCircle,
  Loader2,
  MessageCircle,
  RefreshCw,
  Volume2,
  VolumeX,
  Wallet,
  X,
  XCircle,
} from 'lucide-react'
import OrderChat from '@/components/order-chat'
import { ContactModal } from '@/components/contact-modal'
import { useStorefront } from '@/components/storefront-provider'
import { useHydrated } from '@/lib/use-hydrated'
import { useUserStore } from '@/store/user'
import { fmtYuan } from '@/lib/jiema/pricing'
import type { JiemaOrderView } from '@/lib/jiema/dto'
import {
  bjTime,
  copyTexts,
  flashTitle,
  fmtCountdown,
  groupNational,
  jiemaSelectionPath,
  loginHref,
  orderInfoText,
  payErrorClosedOrder,
  payRetryText,
  pollDelay,
  showInvoiceNoticeFor,
  stateBadge,
} from '@/lib/jiema/ui'
import { cn } from '@/lib/utils'

/**
 * 号码页（docs/短信接码-设计.md §1.10、§1.9、§8.2、§1.13、§1.14、附录 A）。
 *
 * 【只查我方数据库】GET /api/jiema/orders/[orderNo] 返回白名单视图（dto.toJiemaOrderView）；服务端顺带惰性推进（有节流，§6.5），
 * 后台轮询不会放大上游调用。前台每 3 秒（服务端 pollMs）一次；**页面进入后台时只要是 WAITING / REPLACING / CANCELLING 就以 12 秒低频继续**，
 * 回到前台立即拉一次（ui.pollDelay）。所有倒计时用 serverNow 校正本机时钟。
 * 【收到码的提醒】标题闪烁「【验证码 482917】」10 秒（后台也生效，因为后台仍在低频轮询）、震动 200ms、提示音（默认关，偏好存 localStorage）、aria-live 播报。
 * 【按钮上的倒计时】换号、取消的倒计时直接写在按钮上（触屏看不到 tooltip），从 canActAt 算起。
 * 【钱的说法】已取消卡片按 refund 的两格拆分显示「已退回到你的余额，下次购买可直接抵扣（目前可用于短信接码）」并写明不能提现、不退回支付宝；
 * 开票提示只在 RECEIVED / FINISHED / REFUNDED / CANCELLED 显示（D37 清单第 ④ 项），页面上没有任何开票 / 收据按钮。
 * 【联系客服】右上角打开抽屉：订单内留言（接码单任何状态都能读写，§6.6 第 29 条）+ 微信 + 「复制订单信息」；留言接口不可用时微信放最上面。
 * 【品牌红线】不出现上游名称；上游 details 原文不给买家看（视图里本来就没有）。
 */

type View = JiemaOrderView
type Kind = 'close' | 'replace' | 'cancel' | 'finish' | 'start' | 'refund-ready'

const REASONS: Array<[string, string]> = [
  ['USED', '号码已被注册'],
  ['REJECTED', '号码被拒绝'],
  ['NO_SMS', '一直没短信'],
  ['OTHER', '其他'],
]

/** 「收不到短信？」按服务给建议（§1.10） */
function tipsFor(code: string): string[] {
  const base = '确认填对了区号；有的平台要等 1–2 分钟。'
  if (code === 'dr') return ['部分虚拟号会被拒，可以换号或换国家/地区。', base]
  if (code === 'tg') return ['请用手机 App 发送验证码，桌面端可能不发短信。', base]
  if (code === 'acz') return ['部分虚拟号会被拒，可以换号或换国家/地区。', base]
  return [base]
}

const SOUND_KEY = 'jiema:sound'
function readSound(): boolean {
  try {
    return window.localStorage.getItem(SOUND_KEY) === '1'
  } catch {
    return false
  }
}
function writeSound(v: boolean): void {
  try {
    window.localStorage.setItem(SOUND_KEY, v ? '1' : '0')
  } catch {
    /* 隐私模式：只是不记偏好 */
  }
}
function beep(): void {
  try {
    const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as typeof AudioContext | undefined
    if (!Ctx) return
    const ctx = new Ctx()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.frequency.value = 880
    g.gain.value = 0.08
    o.connect(g)
    g.connect(ctx.destination)
    o.start()
    setTimeout(() => {
      o.stop()
      void ctx.close()
    }, 350)
  } catch {
    /* 浏览器不允许就算了 */
  }
}

function Flag({ iso2 }: { iso2: string | null }) {
  if (!iso2) return <Globe2 aria-hidden="true" className="h-4 w-6 shrink-0 text-white/45" />
  return (
    <span aria-hidden="true" className="inline-flex h-4 w-6 shrink-0 items-center justify-center rounded border border-white/15 bg-white/[0.06] text-[9px] font-semibold tracking-wide text-white/70">
      {iso2.toUpperCase()}
    </span>
  )
}

const TONE: Record<string, string> = {
  amber: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  green: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  gray: 'border-white/15 bg-white/[0.06] text-white/60',
  red: 'border-red-400/30 bg-red-500/10 text-red-200',
  cyan: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100',
}

export function JiemaOrderClient({ orderNo }: { orderNo: string }) {
  const router = useRouter()
  const hydrated = useHydrated()
  const user = useUserStore((s) => s.user)
  const { contact } = useStorefront()
  const enc = encodeURIComponent(orderNo)

  const [view, setView] = useState<View | null>(null)
  const viewRef = useRef<View | null>(null)
  const [loadErr, setLoadErr] = useState<'NOT_FOUND' | 'LOAD' | null>(null)
  const [flaky, setFlaky] = useState(false)
  const offset = useRef(0)
  const [now, setNow] = useState(() => Date.now())
  const [busy, setBusy] = useState<string | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [confirmBox, setConfirmBox] = useState<{ text: string; ok: string; run: () => void } | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [reason, setReason] = useState<string>('NO_SMS')
  const [contactOpen, setContactOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [olderOpen, setOlderOpen] = useState(false)
  const [sound, setSound] = useState(false)
  const [live, setLive] = useState('')
  const seen = useRef<Set<number> | null>(null)
  const acquiringSince = useRef<number | null>(null)
  const origTitle = useRef<string>('')
  const flashTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setSound(readSound())
    origTitle.current = document.title
    return () => {
      if (flashTimer.current) clearInterval(flashTimer.current)
      document.title = origTitle.current
    }
  }, [])

  const serverNow = now + offset.current

  const showToast = useCallback((t: string) => {
    setToast(t)
    setTimeout(() => setToast((cur) => (cur === t ? null : cur)), 2200)
  }, [])

  const copy = useCallback(
    async (text: string, label = '已复制') => {
      try {
        await navigator.clipboard.writeText(text)
        showToast(label)
      } catch {
        showToast('复制失败，请长按手动复制')
      }
    },
    [showToast],
  )

  /** 收到新短信：标题闪烁 10 秒、震动、提示音（打开时）、读屏播报 */
  const alertNewSms = useCallback((code: string | null) => {
    const t = flashTitle(code)
    if (flashTimer.current) clearInterval(flashTimer.current)
    let on = true
    const started = Date.now()
    flashTimer.current = setInterval(() => {
      if (Date.now() - started > 10_000) {
        if (flashTimer.current) clearInterval(flashTimer.current)
        flashTimer.current = null
        document.title = origTitle.current
        return
      }
      document.title = on ? t : origTitle.current
      on = !on
    }, 700)
    try {
      navigator.vibrate?.(200)
    } catch {
      /* 不支持 */
    }
    if (readSound()) beep()
    setLive(code ? `收到验证码 ${code.split('').join(' ')}` : '收到一条短信')
  }, [])

  const applyView = useCallback(
    (v: View) => {
      offset.current = Date.parse(v.serverNow) - Date.now()
      const ids = new Set(v.messages.map((m) => m.id))
      if (seen.current == null) seen.current = ids
      else {
        const fresh = v.messages.filter((m) => !seen.current!.has(m.id))
        if (fresh.length) alertNewSms(fresh[0].code)
        seen.current = ids
      }
      if (v.state === 'ACQUIRING') acquiringSince.current = acquiringSince.current ?? Date.now()
      else acquiringSince.current = null
      viewRef.current = v
      setView(v)
      setFlaky(false)
      setLoadErr(null)
    },
    [alertNewSms],
  )

  // ---------- 拉取与轮询 ----------
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inflight = useRef(false)
  const stopped = useRef(false)
  const loadRef = useRef<() => Promise<void>>(async () => undefined)

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    if (stopped.current) return
    const v = viewRef.current
    const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden'
    const d = v ? pollDelay(v.state, v.pollMs, hidden) : hidden ? 0 : 5000
    if (d > 0) timer.current = setTimeout(() => void loadRef.current(), d)
  }, [])

  const load = useCallback(async () => {
    if (inflight.current) return
    inflight.current = true
    try {
      const res = await fetch(`/api/jiema/orders/${enc}`, { cache: 'no-store' })
      if (res.status === 401) {
        stopped.current = true
        router.replace(loginHref(`/jiema/order/${orderNo}`))
        return
      }
      if (res.status === 404) {
        stopped.current = true
        setLoadErr('NOT_FOUND')
        return
      }
      if (res.status === 429) return
      const d = await res.json().catch(() => null)
      if (d?.success) applyView(d.data as View)
      else if (viewRef.current) setFlaky(true)
      else setLoadErr('LOAD')
    } catch {
      if (viewRef.current) setFlaky(true)
      else setLoadErr('LOAD')
    } finally {
      inflight.current = false
      schedule()
    }
  }, [enc, orderNo, router, applyView, schedule])
  loadRef.current = load

  // 登录门禁：先等水合再看登录态（水合那一次渲染 user 恒为 null）
  useEffect(() => {
    if (!hydrated) return
    if (!user) {
      router.replace(loginHref(`/jiema/order/${orderNo}`))
      return
    }
    stopped.current = false
    void load()
    const onVis = () => {
      if (document.visibilityState === 'visible') void loadRef.current()
      else schedule()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      stopped.current = true
      document.removeEventListener('visibilitychange', onVis)
      if (timer.current) clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, user?.id])

  // 倒计时：每秒刷新一次本地时钟（显示用 serverNow 校正）
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // ---------- 操作 ----------
  const act = useCallback(
    async (kind: Kind, extra: Record<string, unknown> = {}) => {
      const v = viewRef.current
      if (!v || busy) return
      setBusy(kind)
      setErrMsg(null)
      try {
        const res = await fetch(`/api/jiema/orders/${enc}/${kind}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ version: v.version, ...extra }),
        })
        if (res.status === 401) {
          router.replace(loginHref(`/jiema/order/${orderNo}`))
          return
        }
        const d = await res.json().catch(() => null)
        if (d?.success) applyView(d.data as View)
        else {
          if (d?.view) applyView(d.view as View)
          setErrMsg((d?.error as string) || '操作失败，请稍后重试')
        }
      } catch {
        setErrMsg('网络不稳定，请重试')
      } finally {
        setBusy(null)
        schedule()
      }
    },
    [busy, enc, orderNo, router, applyView, schedule],
  )

  const pay = useCallback(async () => {
    const v = viewRef.current
    if (!v || busy) return
    if (v.cashierUrl) {
      router.push(v.cashierUrl)
      return
    }
    setBusy('pay')
    setErrMsg(null)
    try {
      const res = await fetch('/api/pay/vmq/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderNo: v.orderNo }) })
      const d = await res.json().catch(() => null)
      if (d?.success && typeof d.data?.payUrl === 'string') {
        router.push(d.data.payUrl)
        return
      }
      const code = (d?.code as string) || ''
      if (payErrorClosedOrder(code) || code === 'PAID_PROCESSING' || code === 'BALANCE_PAID' || code === 'STATE') {
        // 服务端已经关单（预扣在同一事务退回）或状态已变：显示服务端按付款方式拼好的文案，并立刻刷新成最新状态
        setErrMsg((d?.error as string) || '订单状态已变化')
        await load()
      } else {
        setErrMsg(payRetryText(v.pay.mode))
      }
    } catch {
      setErrMsg(payRetryText(v.pay.mode))
    } finally {
      setBusy(null)
    }
  }, [busy, router, load])

  // 同服务的其他可选国家/地区（已取消卡片，§1.10）
  const [alts, setAlts] = useState<Array<{ id: number; name: string; priceCents: number; iso2: string | null }> | null>(null)
  useEffect(() => {
    if (!view || (view.state !== 'CANCELLED' && view.state !== 'REFUNDED') || alts) return
    let alive = true
    fetch(`/api/jiema/catalog/${encodeURIComponent(view.service.code)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !d?.success) return
        const rec: number[] = d.data.sort?.recommended ?? []
        const idx = new Map(rec.map((id, i) => [id, i]))
        type C = { id: number; name: string; priceCents: number | null; level: string; paused: string | null; flag: string | null }
        const list = (d.data.countries as C[])
          .filter((c) => c.id !== view.country.id && c.priceCents != null && c.level !== 'OUT' && !c.paused)
          .sort((a, b) => (idx.get(a.id) ?? 1e6) - (idx.get(b.id) ?? 1e6) || (a.priceCents ?? 0) - (b.priceCents ?? 0))
          .slice(0, 3)
          .map((c) => ({ id: c.id, name: c.name, priceCents: c.priceCents as number, iso2: c.flag }))
        setAlts(list)
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [view, alts])

  const toggleSound = () => {
    const v = !sound
    setSound(v)
    writeSound(v)
    if (v) beep()
  }

  // =====================================================================
  if (!hydrated || (hydrated && !user)) {
    return <div className="py-24 text-center text-sm text-white/40">加载中…</div>
  }
  if (loadErr === 'NOT_FOUND') {
    return (
      <div className="glass rounded-3xl px-6 py-16 text-center">
        <XCircle className="mx-auto h-8 w-8 text-white/40" />
        <h1 className="mt-3 text-xl font-semibold">订单不存在</h1>
        <p className="mt-2 text-sm text-white/50">请确认链接是否完整，或到「我的订单」里查看。</p>
        <div className="mt-6 flex justify-center gap-3 text-sm">
          <Link href="/jiema" className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2">
            去接码
          </Link>
          <Link href="/orders" className="rounded-full border border-white/15 px-5 py-2 text-white/75">
            我的订单
          </Link>
        </div>
      </div>
    )
  }
  if (!view) {
    return (
      <div className="space-y-3" aria-busy="true">
        {loadErr === 'LOAD' ? (
          <div className="glass rounded-3xl px-6 py-12 text-center text-sm text-white/55">
            加载失败
            <button onClick={() => void load()} className="ml-2 text-cyan-300/90 hover:underline">
              重试
            </button>
          </div>
        ) : (
          <>
            <div className="h-24 animate-pulse rounded-3xl bg-white/[0.05]" />
            <div className="h-48 animate-pulse rounded-3xl bg-white/[0.05]" />
          </>
        )}
      </div>
    )
  }

  const v = view
  const badge = stateBadge(v.state)
  const n = v.number
  const canActIn = n ? Date.parse(n.canActAt) - serverNow : 0
  const waitTarget = n ? Date.parse(n.waitUntil ?? n.endsAt) : 0
  const leftMs = n ? waitTarget - serverNow : 0
  const endsLeft = n ? Date.parse(n.endsAt) - serverNow : 0
  const latest = v.messages[0] ?? null
  const older = v.messages.slice(1)
  const again = jiemaSelectionPath(v.service.code, v.country.id, v.operator?.code ?? null, true)
  const otherCountry = `/jiema?s=${encodeURIComponent(v.service.code)}`
  const pendingDeadline = v.cashierExpiresAt ?? v.quoteExpiresAt
  const refunded = v.state === 'CANCELLED' || v.state === 'REFUNDED'
  const busyReplace = busy === 'replace' || v.state === 'REPLACING'

  const confirmThen = (text: string, ok: string, run: () => void) => setConfirmBox({ text, ok, run })

  return (
    <div className="space-y-4">
      <div aria-live="polite" className="sr-only">
        {live}
      </div>
      {flaky && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> 网络不稳定，正在重试
        </div>
      )}

      {/* 顶部：订单摘要 */}
      <section className="glass rounded-3xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-white/40">
              短信接码 · 订单 <span className="font-mono">{v.orderNo}</span>
              <button onClick={() => void copy(v.orderNo, '订单号已复制')} className="ml-1 align-middle text-white/40 hover:text-white" aria-label="复制订单号">
                <Copy className="inline h-3 w-3" />
              </button>
            </div>
            <h1 className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-semibold text-white/90 sm:text-lg">
              <span>{v.service.name}</span>
              <span className="text-white/30">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Flag iso2={v.country.iso2} />
                {v.country.name}
              </span>
              <span className="text-white/30">·</span>
              <span className="text-sm font-normal text-white/60">{v.operator ? v.operator.name : '任意运营商'}</span>
            </h1>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className={cn('rounded-full border px-2.5 py-1 text-xs', TONE[badge.tone])}>● {badge.label}</span>
            <button onClick={() => setContactOpen(true)} className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-xs text-white/75 hover:bg-white/10">
              <MessageCircle className="h-3.5 w-3.5" /> 联系客服
            </button>
          </div>
        </div>
      </section>

      {/* 关单后 / 重复付款退入余额的横幅（D41） */}
      {v.lateCredits.map((l, i) => (
        <div key={`${l.at}-${i}`} className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {l.kind === 'LATE' ? `这张订单关闭后收到一笔 ${fmtYuan(l.cents)} 付款，已退回你的余额，可用于下次购物抵扣（${bjTime(l.at).slice(5)}）` : `这张订单收到一笔重复付款 ${fmtYuan(l.cents)}，已退回你的余额，可用于下次购物抵扣（${bjTime(l.at).slice(5)}）`}
        </div>
      ))}

      {(errMsg || v.notice) && (
        <div role="alert" className="flex items-start gap-2 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errMsg ?? v.notice}</span>
        </div>
      )}

      {/* ───── 待支付 ───── */}
      {v.state === 'PENDING_PAY' && (
        <section className="glass space-y-3 rounded-3xl p-5">
          {v.pay.mode === 'BALANCE' ? (
            <p className="flex items-center gap-2 text-sm text-white/75">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-300" /> 正在确认付款（余额付清，无需再付），通常几秒内完成。
            </p>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-white/50">应付</span>
                <span className="text-2xl font-semibold tabular-nums">{fmtYuan(v.priceCents)}</span>
              </div>
              {v.pay.mode === 'MIXED' ? (
                <p className="text-sm leading-relaxed text-white/70">
                  余额已预扣 {fmtYuan(v.pay.balanceCents)}（充值 {fmtYuan(v.pay.balanceTopupCents)} · 返现 {fmtYuan(v.pay.balanceCashCents)}），还需支付宝{' '}
                  <b className="text-white">{fmtYuan(v.pay.alipayCents)}</b>
                  {pendingDeadline && <>，请在 <b className="tabular-nums text-amber-200">{fmtCountdown(Date.parse(pendingDeadline) - serverNow)}</b> 内完成</>}；超时或取消订单，预扣的余额自动退回。
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-white/70">
                  支付宝付款 <b className="text-white">{fmtYuan(v.pay.alipayCents)}</b>
                  {pendingDeadline && <>，请在 <b className="tabular-nums text-amber-200">{fmtCountdown(Date.parse(pendingDeadline) - serverNow)}</b> 内完成</>}。付款后自动跳到这一页分配号码。
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {v.actions.pay && (
                  <button onClick={() => void pay()} disabled={!!busy} className="inline-flex items-center gap-1.5 rounded-xl bg-[#1677FF] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0e5fd8] disabled:opacity-60">
                    {busy === 'pay' && <Loader2 className="h-4 w-4 animate-spin" />}去支付
                  </button>
                )}
                {v.actions.close && (
                  <button
                    onClick={() =>
                      confirmThen(
                        `如果你已经扫码付了款，请不要取消——到账确认可能要几十秒；取消后才到的钱会退回你的余额，但这张订单不会恢复。${v.pay.mode === 'MIXED' ? '取消后预扣的余额立即退回。' : ''}确定取消订单吗？`,
                        '确定取消订单',
                        () => void act('close'),
                      )
                    }
                    disabled={!!busy}
                    className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/75 hover:bg-white/10 disabled:opacity-60"
                  >
                    取消订单
                  </button>
                )}
                {v.pay.mode === 'ALIPAY' && (
                  <Link href={otherCountry} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:bg-white/10">
                    换一个组合
                  </Link>
                )}
              </div>
            </>
          )}
        </section>
      )}

      {/* ───── 已付款、待开始（付款确认迟到） ───── */}
      {v.state === 'READY' && (
        <section className="glass space-y-3 rounded-3xl p-5 text-sm leading-relaxed text-white/75">
          <p>付款已确认，但比报价有效期晚了一些。点「开始接码」按原价分配号码；如果现在的价格已经超出原价，会自动取消并退回余额。24 小时不操作，自动取消并退回余额。</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void act('start')} disabled={!!busy || !v.actions.start} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-medium disabled:opacity-50">
              {busy === 'start' && <Loader2 className="h-4 w-4 animate-spin" />}开始接码
            </button>
            <button
              onClick={() => confirmThen('取消后整单退回余额（含支付宝付的部分，退进充值余额，不能提现），确定吗？', '取消并退回余额', () => void act('refund-ready'))}
              disabled={!!busy || !v.actions.refundReady}
              className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/75 hover:bg-white/10 disabled:opacity-50"
            >
              取消并退回余额
            </button>
          </div>
          {/* 组合停售中（actions.start=false）：写明原因，别让买家对着一个灰按钮猜（§1.10、附录 A） */}
          {!v.actions.start && <p className="text-xs text-amber-200/80">该组合暂停销售，可以取消并退回余额</p>}
        </section>
      )}

      {/* ───── 正在分配号码 ───── */}
      {v.state === 'ACQUIRING' && (
        <section className="glass space-y-3 rounded-3xl p-5">
          <div className="h-12 animate-pulse rounded-2xl bg-white/[0.06]" />
          <p className="flex items-center gap-2 text-sm text-white/70">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
            {v.progress?.confirming
              ? '服务商响应慢，正在确认号码（最长约 3 分钟），期间不会重复扣费'
              : (v.progress?.tries ?? 0) >= 2 || (acquiringSince.current != null && Date.now() - acquiringSince.current > 20_000)
                ? `号码紧张，正在重试（第 ${Math.max(2, v.progress?.tries ?? 2)}/${v.progress?.maxTries ?? 3} 次）`
                : '正在分配号码…通常 3 秒内完成'}
          </p>
        </section>
      )}

      {/* ───── 号码卡片 ───── */}
      {n && (
        <section className="glass relative overflow-hidden rounded-3xl p-5">
          {busyReplace && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/55 text-sm text-white/85">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 正在换号…
              {v.progress?.confirming && <span className="ml-2 text-xs text-white/60">服务商响应慢，正在确认（不会重复扣费）</span>}
            </div>
          )}
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono">
            {n.dial && <span className="text-xl text-white/55 sm:text-2xl">+{n.dial}</span>}
            <span className="text-2xl font-semibold tracking-wider text-white sm:text-3xl">{groupNational(n.national)}</span>
            {n.seq > 1 && <span className="font-sans text-xs text-white/40">第 {n.seq} 个号</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => void copy(copyTexts(n).full, '已复制完整号码')} className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-sm hover:bg-white/10">
              <Copy className="h-3.5 w-3.5" /> 复制完整号码
            </button>
            <button onClick={() => void copy(copyTexts(n).national, '已复制（不含区号）')} className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-sm hover:bg-white/10">
              <Copy className="h-3.5 w-3.5" /> 复制不含区号
            </button>
            <button onClick={toggleSound} className="ml-auto inline-flex items-center gap-1 rounded-xl px-2 py-2 text-xs text-white/50 hover:text-white/80" aria-pressed={sound}>
              {sound ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />} 提示音{sound ? '开' : '关'}
            </button>
          </div>
          {(v.state === 'WAITING' || v.state === 'REPLACING') && (
            <div className="mt-4">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-amber-400/80 transition-all" style={{ width: `${Math.max(0, Math.min(100, (leftMs / (20 * 60_000)) * 100))}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-white/55">
                <Clock className="mr-1 inline h-3 w-3" />
                剩余 <b className="tabular-nums text-amber-200">{fmtCountdown(leftMs)}</b> · 到时没收到短信自动取消并退回余额
              </p>
              <p className="mt-0.5 text-[11px] text-white/35">切到其他页面后，提醒可能延迟一分钟左右</p>
            </div>
          )}
          {v.state === 'RECEIVED' && (
            <p className="mt-3 text-xs leading-relaxed text-white/55">
              {n.canGetAnotherSms
                ? `号码还能继续收短信（剩余 ${fmtCountdown(endsLeft - 30_000)}），新短信会自动显示，不另收费。`
                : '这个号码不支持再次收码；验证码有问题可以联系客服。'}
            </p>
          )}
          {v.state === 'CANCELLING' && <p className="mt-3 text-xs leading-relaxed text-white/55">正在释放号码，确认后整单退回余额，通常 1 分钟内到账。</p>}
        </section>
      )}

      {/* ───── 取消 / 退款中（号码已不显示时） ───── */}
      {(v.state === 'REFUNDING' || (v.state === 'CANCELLING' && !n)) && (
        <section className="glass rounded-3xl p-5 text-sm leading-relaxed text-white/70">
          <p className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> 正在释放号码，确认后整单退回余额，通常 1 分钟内到账。
          </p>
          <p className="mt-1 text-xs text-white/45">如果服务商暂时联系不上：正在向服务商确认，确认后自动退回余额；服务异常时可能在号码到期后约 1 小时内到账。</p>
        </section>
      )}

      {/* ───── 短信 ───── */}
      {(n || v.messages.length > 0) && !refunded && (
        <section className="glass rounded-3xl p-5">
          <div className="mb-3 text-sm font-medium text-white/80">短信（{v.messages.length}）</div>
          {!latest ? (
            <p className="text-sm leading-relaxed text-white/50">去目标平台填入号码并发送验证码，短信到了会自动显示在这里，不用刷新。</p>
          ) : (
            <div className="space-y-3">
              <MessageCard m={latest} big onCopy={copy} />
              {older.length > 0 && (
                <div>
                  <button onClick={() => setOlderOpen((x) => !x)} className="flex items-center gap-1 text-xs text-white/50 hover:text-white/80">
                    {olderOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}更早的 {older.length} 条
                  </button>
                  {olderOpen && (
                    <div className="mt-2 space-y-2">
                      {older.map((m) => (
                        <MessageCard key={m.id} m={m} onCopy={copy} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ───── 操作条 ───── */}
      {v.state === 'WAITING' && n && (
        <section className="space-y-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              onClick={() => void act('replace')}
              disabled={!!busy || !v.actions.replace || canActIn > 0}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/15 bg-white/[0.05] px-4 py-3 text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {busy === 'replace' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              换号{canActIn > 0 ? `（${fmtCountdown(canActIn)}）` : ''}
            </button>
            <button
              onClick={() => confirmThen('取消后号码立即释放，本单整单退回余额（含支付宝付的部分，退进充值余额，不能提现）。确定取消吗？', '取消并退回余额', () => void act('cancel'))}
              disabled={!!busy || !v.actions.cancel || canActIn > 0}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/15 bg-white/[0.05] px-4 py-3 text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {busy === 'cancel' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              取消 · 退回余额{canActIn > 0 ? `（${fmtCountdown(canActIn)}）` : ''}
            </button>
            <button onClick={() => setHelpOpen(true)} className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70 hover:bg-white/10">
              <HelpCircle className="h-4 w-4" /> 收不到短信？
            </button>
          </div>
          <p className="text-xs text-white/45">
            {v.replaceBlocked === 'THREADS'
              ? '当前号码资源紧张，暂不能换号；可以继续等待，或取消并退回余额。'
              : v.replace.left > 0
                ? `收码前还可免费换 ${v.replace.left} 次 · 没收到短信，到期后整单自动退回余额`
                : '换号次数已用完，可以继续等待，或取消（整单退回余额）'}
          </p>
        </section>
      )}
      {v.state === 'RECEIVED' && (
        <section className="space-y-2">
          <p className="text-xs text-white/45">已收到短信，按平台规则不能再换号或取消。</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => confirmThen('释放后这个号码不再接收短信，确定吗？', '确定释放', () => void act('finish'))}
              disabled={!!busy || !v.actions.finish}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 disabled:opacity-50"
            >
              {busy === 'finish' && <Loader2 className="h-4 w-4 animate-spin" />}我已用完，释放号码
            </button>
            <Link href={again} className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-medium">
              再来一单
            </Link>
          </div>
        </section>
      )}
      {v.state === 'FINISHED' && (
        <section className="flex flex-wrap gap-2">
          <Link href={again} className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-medium">
            再来一单（同服务同国家/地区）
          </Link>
          <Link href={otherCountry} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/75 hover:bg-white/10">
            换个国家/地区
          </Link>
        </section>
      )}

      {/* ───── 已取消 / 已退款 ───── */}
      {refunded && (
        <section className="glass space-y-3 rounded-3xl p-5 text-sm leading-relaxed">
          <div className="flex items-center gap-2 text-base font-semibold text-white/85">
            <CheckCircle2 className="h-5 w-5 text-white/50" />
            {v.state === 'REFUNDED' ? '已退款 · 已退回余额' : '已取消 · 已退回余额'}
          </div>
          <p className="text-white/65">{v.state === 'REFUNDED' ? '售后审核通过。' : `没有收到短信，号码已释放，本单不收任何费用。${v.refund ? `（${v.refund.reason}）` : ''}`}</p>
          {v.refund ? (
            <p className="text-white/75">
              实付 {fmtYuan(v.refund.cents)} 已全部退回你的余额（{bjTime(v.refund.at).slice(11)}）：
              {v.refund.topupCents > 0 && <>充值余额 +{fmtYuan(v.refund.topupCents)}</>}
              {v.refund.topupCents > 0 && v.refund.cashCents > 0 && ' · '}
              {v.refund.cashCents > 0 && <>返现余额 +{fmtYuan(v.refund.cashCents)}</>}
            </p>
          ) : (
            <p className="text-white/60">正在退回余额，通常 1 分钟内到账。</p>
          )}
          <p className="text-white/75">已退回到你的余额，下次购买可直接抵扣（目前可用于短信接码）。</p>
          <div className="flex flex-wrap gap-2">
            <Link href={again} className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-medium">
              再试一次（同服务同国家/地区）
            </Link>
            <Link href={otherCountry} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/75 hover:bg-white/10">
              换个国家/地区
            </Link>
            <Link href="/wallet" className="inline-flex items-center gap-1 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/75 hover:bg-white/10">
              <Wallet className="h-4 w-4" /> 查看余额明细
            </Link>
          </div>
          {alts && alts.length > 0 && (
            <p className="text-xs text-white/55">
              同服务其他可选：
              {alts.map((a, i) => (
                <span key={a.id}>
                  {i > 0 && ' · '}
                  <Link href={jiemaSelectionPath(v.service.code, a.id, null, true)} className="inline-flex items-center gap-1 text-cyan-300/90 hover:underline">
                    <Flag iso2={a.iso2} />
                    {a.name} {fmtYuan(a.priceCents)}
                  </Link>
                </span>
              ))}
            </p>
          )}
          <p className="text-[11px] text-white/40">退回的余额不能提现、不退回支付宝，目前可用于短信接码。</p>
        </section>
      )}

      {/* ───── 已关闭（未支付） ───── */}
      {v.state === 'CLOSED' && (
        <section className="glass space-y-3 rounded-3xl p-5 text-sm leading-relaxed">
          <div className="text-base font-semibold text-white/85">订单未支付，已关闭</div>
          {v.pay.holdState === 'RELEASED' && v.pay.balanceCents > 0 && <p className="text-white/70">预扣的 {fmtYuan(v.pay.balanceCents)} 已退回余额。</p>}
          <Link href={again} className="inline-block rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-medium">
            重新下单
          </Link>
          {v.lateCredits.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/60">
              <div className="mb-1 font-medium text-white/80">我已经付了款？</div>
              不要再付第二次。关单后到账的钱会退回你的余额：能自动确认的，通常到账后几分钟内；需要客服核实的，会在客服在线时间（9:00–22:00）内处理，通常当天完成。30 分钟后余额里还没有，可以先联系客服。
              <div className="mt-2">
                <button onClick={() => setContactOpen(true)} className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-xs text-white/80 hover:bg-white/10">
                  <MessageCircle className="h-3.5 w-3.5" /> 联系客服
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ───── 人工处理中 ───── */}
      {v.state === 'MANUAL' && (
        <section className="glass space-y-3 rounded-3xl p-5 text-sm text-white/70">
          <p>订单需要人工核实，客服会尽快处理，你也可以直接联系客服。</p>
          <button onClick={() => setContactOpen(true)} className="inline-flex items-center gap-1 rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/10">
            <MessageCircle className="h-4 w-4" /> 联系客服
          </button>
        </section>
      )}

      {/* ───── 历史号码（折叠） ───── */}
      {v.history.length > 0 && (
        <section className="rounded-2xl border border-white/10 px-4 py-3">
          <button onClick={() => setHistoryOpen((x) => !x)} className="flex w-full items-center gap-1 text-left text-sm text-white/60">
            {historyOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}历史号码（{v.history.length}）
          </button>
          {historyOpen && (
            <ul className="mt-2 space-y-1 text-xs text-white/55">
              {v.history.map((h) => (
                <li key={h.seq} className="flex flex-wrap gap-x-3 font-mono">
                  <span>第 {h.seq} 个</span>
                  <span>+{h.phone}</span>
                  <span className="font-sans">{h.outcome === 'REPLACED' ? '已换下' : h.outcome === 'RECEIVED' ? '收到过短信' : h.outcome === 'FAILED' ? '取号失败' : '已释放'}</span>
                  <span className="font-sans text-white/35">{bjTime(h.at).slice(5)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ───── 规则说明 ───── */}
      <section className="space-y-1 rounded-2xl border border-white/10 px-4 py-3 text-xs leading-relaxed text-white/45">
        <p>号码 20 分钟有效；取号 2 分钟后可以换号或取消；收到短信前可免费换号，收到短信后不能换号或取消。</p>
        <p>没收到短信的，号码到期或你主动取消后，本单整单退回站内余额（含支付宝付的部分）；退回的余额不能提现、不退回支付宝，目前可用于短信接码。</p>
        {showInvoiceNoticeFor(v.state) && (
          <p>
            暂不支持开票，可
            <button onClick={() => setContactOpen(true)} className="text-cyan-300/90 hover:underline">
              联系客服
            </button>
            开票处理
          </p>
        )}
      </section>

      {/* ───── 「收不到短信？」 ───── */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="收不到短信？">
          <button className="absolute inset-0 bg-black/60" aria-label="关闭" onClick={() => setHelpOpen(false)} />
          <div className="relative max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0b0b12] p-5 sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between text-sm font-medium">
              收不到短信？
              <button onClick={() => setHelpOpen(false)} aria-label="关闭" className="rounded-full p-1 text-white/60 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-white/65">
              {tipsFor(v.service.code).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <div className="mt-4 text-xs text-white/45">原因（只用来统计，不需要人工处理）</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {REASONS.map(([k, label]) => (
                <label key={k} className={cn('flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-[13px]', reason === k ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-white/10')}>
                  <input type="radio" name="reason" checked={reason === k} onChange={() => setReason(k)} />
                  {label}
                </label>
              ))}
            </div>
            <button
              onClick={() => {
                setHelpOpen(false)
                void act('replace', { reason })
              }}
              disabled={!!busy || !v.actions.replace || canActIn > 0}
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-sm font-medium disabled:opacity-45"
            >
              <RefreshCw className="h-4 w-4" /> 换一个号{canActIn > 0 ? `（${fmtCountdown(canActIn)} 后可换）` : ''}
            </button>
            {v.replaceBlocked === 'THREADS' && <p className="mt-2 text-xs text-amber-200/80">当前号码资源紧张，暂不能换号；可以继续等待，或取消并退回余额。</p>}
          </div>
        </div>
      )}

      {/* ───── 二次确认 ───── */}
      {confirmBox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5" role="alertdialog" aria-modal="true">
          <button className="absolute inset-0 bg-black/60" aria-label="关闭" onClick={() => setConfirmBox(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#12121c] p-5">
            <p className="text-sm leading-relaxed text-white/85">{confirmBox.text}</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  const r = confirmBox.run
                  setConfirmBox(null)
                  r()
                }}
                className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-medium"
              >
                {confirmBox.ok}
              </button>
              <button onClick={() => setConfirmBox(null)} className="flex-1 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/75 hover:bg-white/10">
                再想想
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───── 联系客服抽屉（§8.2） ───── */}
      {contactOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end" role="dialog" aria-modal="true" aria-label="联系客服">
          <button className="absolute inset-0 bg-black/60" aria-label="关闭" onClick={() => setContactOpen(false)} />
          <div className="relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0b0b12] sm:max-h-none sm:max-w-md sm:rounded-none sm:rounded-l-3xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-sm font-medium">
              联系客服
              <button onClick={() => setContactOpen(false)} aria-label="关闭" className="rounded-full p-1 text-white/60 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 text-sm">
              {!v.actions.message && <WechatBlock wechat={contact.wechat} hours={contact.hours} onQr={() => setQrOpen(true)} onCopyInfo={() => void copy(orderInfoText(v, serverNow), '订单信息已复制')} />}
              {v.actions.message && (
                <div>
                  <div className="mb-1 text-[13px] text-white/80">【推荐】在线留言（自动附带订单信息，客服回复会显示在这里）</div>
                  <div className="mb-2 rounded-lg bg-white/[0.04] px-3 py-1.5 text-xs text-white/50">
                    订单 {v.orderNo} · {v.service.name} · {v.country.name} · {badge.label}
                  </div>
                  <OrderChat apiBase={`/api/orders/${v.orderId}/messages`} selfRole="BUYER" theme="dark" />
                  <p className="mt-2 text-xs text-white/40">需要发截图请用微信（在线留言暂不支持图片）。</p>
                </div>
              )}
              {v.actions.message && <WechatBlock wechat={contact.wechat} hours={contact.hours} onQr={() => setQrOpen(true)} onCopyInfo={() => void copy(orderInfoText(v, serverNow), '订单信息已复制')} />}
            </div>
          </div>
        </div>
      )}
      <ContactModal open={qrOpen} onClose={() => setQrOpen(false)} />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-black/85 px-4 py-2 text-sm text-white shadow-lg">
          <Check className="mr-1 inline h-4 w-4 text-emerald-300" />
          {toast}
        </div>
      )}
    </div>
  )
}

function MessageCard({ m, big, onCopy }: { m: JiemaOrderView['messages'][number]; big?: boolean; onCopy: (t: string, label?: string) => Promise<void> }) {
  return (
    <div className={cn('rounded-2xl border px-4 py-3', big ? 'border-emerald-400/30 bg-emerald-500/[0.07]' : 'border-white/10 bg-white/[0.03]')}>
      {m.code ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className={cn('font-mono font-semibold tracking-[0.3em] text-emerald-200', big ? 'text-3xl sm:text-4xl' : 'text-lg')}>{m.code}</span>
          <button onClick={() => void onCopy(m.code as string, '验证码已复制')} className="inline-flex items-center gap-1 rounded-xl border border-emerald-400/30 px-3 py-1.5 text-sm text-emerald-100 hover:bg-emerald-500/15">
            <Copy className="h-3.5 w-3.5" /> 复制验证码
          </button>
        </div>
      ) : m.text ? (
        <button onClick={() => void onCopy(m.text as string, '短信全文已复制')} className="mb-1 inline-flex items-center gap-1 rounded-xl border border-white/15 px-3 py-1.5 text-xs text-white/75 hover:bg-white/10">
          <Copy className="h-3 w-3" /> 复制全文
        </button>
      ) : null}
      {m.text ? <p className="mt-2 break-words text-[13px] leading-relaxed text-white/70">{m.text}</p> : !m.code ? <p className="text-xs text-white/40">短信内容已按保存期限清除</p> : null}
      <p className="mt-1.5 text-[11px] text-white/40">
        {m.sender ? `发件人 ${m.sender} · ` : ''}
        {bjTime(m.at).slice(11)} · 第 {m.seq} 个号{m.toOldNumber ? '（发到换下的旧号）' : ''}
      </p>
    </div>
  )
}

function WechatBlock({ wechat, hours, onQr, onCopyInfo }: { wechat: string | null; hours: string | null; onQr: () => void; onCopyInfo: () => void }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-[13px] text-white/70">
      {wechat ? (
        <p>
          或者微信联系：<b className="font-mono text-white">{wechat}</b>
          {hours ? `（在线 ${hours}）` : ''}
        </p>
      ) : (
        <p>或者扫码添加客服微信{hours ? `（在线 ${hours}）` : ''}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <button onClick={onQr} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80 hover:bg-white/10">
          显示二维码
        </button>
        <button onClick={onCopyInfo} className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 text-xs text-white/80 hover:bg-white/10">
          <Copy className="h-3 w-3" /> 复制订单信息
        </button>
      </div>
    </div>
  )
}
