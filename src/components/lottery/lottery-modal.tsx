'use client'

import { useStorefront } from '@/components/storefront-provider'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X, Gift, PartyPopper, Ticket, MessageSquare, AlertCircle, Loader2 } from 'lucide-react'
// 只取类型：lib/lottery 间接引用了 lib/coupon（带 prisma 与 node crypto），值导入会把它们打进前端包
import type { BuyerLotteryView } from '@/lib/lottery'

/** /api/lottery/info 的返回（奖池只有名称与说明，没有概率） */
interface PublicLotteryInfo {
  enabled: boolean
  minOrderAmount: number
  rules: string
  prizes: { name: string; type: string; label: string }[]
}

type Phase = 'closed' | 'opening' | 'result'

/**
 * 「開」按钮至少转这么久再揭晓。接口通常几十毫秒就回来了，结果瞬间弹出来
 * 就没有「拆」的感觉；系统开了「减弱动态效果」时不等，直接出结果。
 */
const MIN_OPENING_MS = 1000

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * 下单有奖 · 拆红包弹窗。
 *
 *  · 未抽（PENDING）：拉 /api/lottery/info 展示奖池与规则，点金色「開」→ POST /api/lottery/draw
 *  · 已抽（DRAWN）：直接显示当时的结果，不再请求接口（结果以订单列表里带下来的为准）
 *
 * 中奖与否只由服务端决定，这里只负责展示；抽完通过 onDrawn 把结果交回订单页更新那一张卡片，
 * 不整页重拉（买家可能已经「加载更多」翻了好几页）。
 */
function LotteryModalInner({
  orderNo,
  productName,
  view,
  canDraw,
  onClose,
  onDrawn,
  onContact,
}: {
  orderNo: string
  productName?: string
  view: BuyerLotteryView
  canDraw: boolean
  onClose: () => void
  onDrawn: (view: BuyerLotteryView) => void
  /** 自定义奖品「与客服沟通兑奖」：由订单页打开这张订单的在线沟通 */
  onContact?: () => void
}) {
  const reduced = !!useReducedMotion()
  const startDrawn = view.state === 'DRAWN'
  const [phase, setPhase] = useState<Phase>(startDrawn ? 'result' : 'closed')
  const [result, setResult] = useState<BuyerLotteryView | null>(startDrawn ? view : null)
  /** 本次弹窗里刚拆开的才播「信纸升起」动画；重看旧结果直接显示 */
  const [justOpened, setJustOpened] = useState(false)
  const [info, setInfo] = useState<PublicLotteryInfo | null>(null)
  const [infoState, setInfoState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [err, setErr] = useState<string | null>(null)
  const busy = useRef(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // Esc 关闭（与点遮罩一致）
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const loadInfo = useCallback(async () => {
    setInfoState('loading')
    try {
      const r = await fetch('/api/lottery/info', { cache: 'no-store' })
      const d = await r.json()
      if (!mounted.current) return
      if (d?.success && d.data && Array.isArray(d.data.prizes)) {
        setInfo(d.data as PublicLotteryInfo)
        setInfoState('ok')
      } else {
        setInfoState('error')
      }
    } catch {
      if (mounted.current) setInfoState('error')
    }
  }, [])

  useEffect(() => {
    if (!startDrawn) loadInfo()
    // 只在打开时拉一次；已抽过的直接看结果，不需要奖池
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /*
   * 【奖池为空时不让拆】后台临时把奖项全停掉的时候，服务端会以 409「奖池暂未开放」拒绝并保留资格
   * （lib/lottery-server.ts drawForOrder）。按钮在这里先拦住，省一次必然失败的请求；
   * 真正的判定仍在服务端。
   */
  const ready = canDraw && phase === 'closed' && infoState === 'ok' && !!info && info.prizes.length > 0

  const draw = async () => {
    if (busy.current || !ready) return
    busy.current = true
    setErr(null)
    setPhase('opening')
    const minWait = new Promise<void>((resolve) => setTimeout(resolve, reduced ? 0 : MIN_OPENING_MS))
    try {
      const [res] = await Promise.all([
        fetch('/api/lottery/draw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNo }),
        }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) })),
        minWait,
      ])
      const v: BuyerLotteryView | undefined = res.body?.success ? res.body.data?.view : undefined
      if (v && v.state === 'DRAWN') {
        // 先交回订单页：即使买家在转圈时已经关掉弹窗，卡片也要变成「已中奖 / 未中奖」
        onDrawn(v)
        if (!mounted.current) return
        setResult(v)
        setJustOpened(true)
        setPhase('result')
        return
      }
      if (!mounted.current) return
      // 服务端的报错文案是写给买家看的（「订单付款后才能抽奖」等），原样展示
      setErr(res.status === 401 ? '登录已过期，请重新登录后再试' : res.body?.error || '抽奖失败，请稍后重试')
      setPhase('closed')
    } catch {
      if (!mounted.current) return
      setErr('网络错误，请重试')
      setPhase('closed')
    } finally {
      busy.current = false
    }
  }

  const opening = phase === 'opening'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="下单有奖"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: reduced ? 0.15 : 0.3 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm max-h-[90vh] lg:max-h-[82vh] overflow-y-auto overflow-x-hidden rounded-3xl border border-amber-300/25 bg-gradient-to-b from-[#d93a33] via-[#c52a25] to-[#9f1a17] text-white shadow-[0_24px_80px_rgba(220,38,38,0.35)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-amber-50/90 transition-colors hover:bg-black/30"
        >
          <X className="h-4 w-4" />
        </button>

        <AnimatePresence mode="wait" initial={false}>
          {phase !== 'result' || !result ? (
            <motion.div
              key="envelope"
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -48 }}
              transition={{ duration: reduced ? 0.1 : 0.35, ease: 'easeIn' }}
            >
              {/* 封盖：弧形下沿 + 骑缝的金色「開」 */}
              <div className="relative">
                <div className="rounded-b-[50%_32%] bg-gradient-to-b from-[#ea5a50] to-[#c9302a] px-6 pb-12 pt-9 text-center shadow-[0_10px_20px_rgba(90,0,0,0.35)]">
                  <div className="text-2xl font-bold tracking-wide text-[#fde68a]">下单有奖</div>
                  <div className="mt-1.5 text-xs text-amber-50/75">
                    订单 <span className="font-mono">{orderNo}</span>
                  </div>
                  {productName && <div className="mt-0.5 truncate text-xs text-amber-50/60">{productName}</div>}
                </div>
                {/* 定位与旋转分两层：framer-motion 写的 transform 会盖掉 Tailwind 的 translate */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                  <motion.button
                    type="button"
                    onClick={draw}
                    disabled={!ready}
                    aria-label="開 —— 拆红包"
                    style={{ transformPerspective: 600 }}
                    animate={opening && !reduced ? { rotateY: 360 } : { rotateY: 0 }}
                    transition={
                      opening && !reduced ? { repeat: Infinity, duration: 0.7, ease: 'linear' } : { duration: 0.2 }
                    }
                    whileTap={ready && !reduced ? { scale: 0.94 } : undefined}
                    className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-[#fde68a] to-[#f59e0b] text-3xl font-bold text-[#7c2d12] shadow-[0_6px_20px_rgba(245,158,11,0.45),inset_0_-3px_0_rgba(154,52,18,0.25)] ring-4 ring-amber-300/30 transition-opacity ${
                      // 转圈时按钮同样是 disabled（防连点），但不能跟着变灰 —— 那一下正是「拆」的动画
                      opening ? '' : 'disabled:cursor-not-allowed disabled:opacity-60'
                    }`}
                  >
                    {opening && reduced ? <Loader2 className="h-7 w-7 animate-spin" /> : '開'}
                  </motion.button>
                </div>
              </div>

              <div className="px-5 pb-6 pt-14">
                <p className="text-center text-sm text-amber-50/85">
                  {opening ? '正在拆红包…' : '点「開」拆红包，每笔订单可抽一次'}
                </p>

                {err && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200/30 bg-black/25 px-3 py-2 text-sm text-amber-50">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
                    <span>{err}</span>
                  </div>
                )}

                {/* 奖池：只有奖项名与券面额，概率不对外 */}
                <div className="mt-4 rounded-2xl border border-amber-200/20 bg-black/15 p-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-amber-200">
                    <Gift className="h-3.5 w-3.5" /> 奖池
                  </div>
                  {infoState === 'loading' && (
                    <div className="flex justify-center py-3 text-amber-50/60">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                  {infoState === 'error' && (
                    <button
                      type="button"
                      onClick={loadInfo}
                      className="w-full py-2 text-center text-sm text-amber-50/80 underline underline-offset-2 hover:text-amber-50"
                    >
                      奖池加载失败，点此重试
                    </button>
                  )}
                  {infoState === 'ok' && info && info.prizes.length === 0 && (
                    <p className="py-1 text-sm text-amber-50/75">奖池暂未开放，请稍后再来拆红包</p>
                  )}
                  {infoState === 'ok' && info && info.prizes.length > 0 && (
                    <ul className="space-y-2">
                      {info.prizes.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-300" />
                          <span className="min-w-0">
                            <span className="font-medium text-amber-50">{p.name}</span>
                            {p.label && p.label !== p.name && (
                              <span className="ml-1.5 text-xs text-amber-100/65">{p.label}</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {info?.rules?.trim() && (
                  <div className="mt-3 rounded-2xl border border-amber-200/15 bg-black/15 p-4">
                    <div className="mb-1.5 text-xs font-medium text-amber-200">活动规则</div>
                    <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-amber-50/80">
                      {info.rules.trim()}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="px-5 pb-6 pt-8"
            >
              <div className="pr-8 text-center text-xs text-amber-100/75">
                下单有奖 · 订单 <span className="font-mono">{orderNo}</span>
              </div>
              <ResultCard
                result={result}
                animate={justOpened && !reduced}
                onContact={onContact}
              />
              {result.won && result.prizeType === 'COUPON' && result.couponState !== 'VOID' && (
                <Link
                  href="/coupons"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#fde68a] to-[#f59e0b] py-3 text-sm font-semibold text-[#7c2d12] transition-shadow hover:shadow-[0_0_24px_rgba(245,158,11,0.45)]"
                >
                  <Ticket className="h-4 w-4" />
                  查看我的优惠券
                </Link>
              )}
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full rounded-xl bg-black/20 py-3 text-sm font-medium text-amber-50/90 transition-colors hover:bg-black/30"
              >
                关闭
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/** 拆开后的「信纸」：奶白底深红字，与红包封面形成对比 */
function ResultCard({
  result,
  animate,
  onContact,
}: {
  result: BuyerLotteryView
  animate: boolean
  onContact?: () => void
}) {
  const won = !!result.won
  const isCoupon = won && result.prizeType === 'COUPON'
  const isCustom = won && !isCoupon
  return (
    <motion.div
      initial={animate ? { y: 56, opacity: 0, scale: 0.96 } : false}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mt-4 rounded-2xl bg-[#fff7ed] px-5 py-6 text-center text-[#7c2d12] shadow-[0_12px_32px_rgba(60,0,0,0.35)]"
    >
      {won ? (
        <>
          <PartyPopper className="mx-auto h-9 w-9 text-[#dc2626]" />
          <div className="mt-2 text-sm text-[#9a3412]">恭喜，抽中了</div>
          <div className="mt-1 break-words text-2xl font-bold text-[#b91c1c]">
            {result.prizeName || result.prizeLabel || '奖品'}
          </div>
          {result.prizeLabel && result.prizeLabel !== result.prizeName && (
            <div className="mt-1 text-sm font-medium text-[#9a3412]">{result.prizeLabel}</div>
          )}
          {result.description && (
            <p className="mt-3 whitespace-pre-wrap break-words text-left text-xs leading-relaxed text-[#7c2d12]/85">
              {result.description}
            </p>
          )}

          {isCoupon && (
            <>
              <div className="mt-3 text-xs text-[#9a3412]/85">
                {result.expiresAt ? `有效期至 ${formatDate(result.expiresAt)}` : '长期有效'}
              </div>
              {result.couponState === 'VOID' ? (
                // 订单退款 / 取消后这张券已被作废（lib/lottery-server.ts 的 voidLotteryForOrder）
                <div className="mt-3 rounded-xl bg-black/5 px-3 py-2 text-sm text-[#7c2d12]/80">
                  该奖品已作废，如有疑问请联系客服
                </div>
              ) : (
                <div className="mt-3 rounded-xl bg-[#fee2e2] px-3 py-2 text-sm font-medium text-[#991b1b]">
                  已发放到「我的优惠券」
                </div>
              )}
            </>
          )}

          {isCustom && (
            <>
              {result.fulfillState === 'DONE' ? (
                <div className="mt-4 rounded-xl bg-[#dcfce7] px-3 py-2 text-sm font-medium text-[#166534]">奖品已兑现</div>
              ) : result.fulfillState === 'VOID' ? (
                <div className="mt-4 rounded-xl bg-[#f5f5f4] px-3 py-2 text-sm text-[#57534e]">
                  该奖品已作废，如有疑问请联系客服
                </div>
              ) : (
                <>
                  <div className="mt-4 rounded-xl bg-[#fee2e2] px-3 py-2 text-sm font-medium text-[#991b1b]">
                    请在该订单内「与客服在线沟通」兑奖
                  </div>
                  {onContact && (
                    <button
                      type="button"
                      onClick={onContact}
                      className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#dc2626] to-[#b91c1c] px-4 py-2 text-sm font-medium text-amber-50 transition-shadow hover:shadow-[0_0_18px_rgba(220,38,38,0.35)]"
                    >
                      <MessageSquare className="h-4 w-4" />
                      与客服在线沟通
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <Gift className="mx-auto h-9 w-9 text-[#c2410c]/70" />
          <div className="mt-3 text-base font-medium text-[#7c2d12]">很遗憾，这次没有中奖，感谢参与</div>
        </>
      )}
      {result.drawnAt && <div className="mt-4 text-[11px] text-[#9a3412]/70">抽奖时间 {formatDate(result.drawnAt)}</div>}
    </motion.div>
  )
}

/**
 * 渠道分站（实施分包 WP1）：抽奖在渠道站关闭（设计 7.6）。
 * 只控制显示；对应接口在渠道 Host 上服务端 404（denyOnChannel）。组件本体改名为 LotteryModalInner、原样不动，
 * 由这层按店面决定挂不挂：不渲染就不会发出任何请求（验收 W1-9：渠道站页面零 404 请求）。主站恒为渲染，行为不变。
 */
export function LotteryModal(props: React.ComponentProps<typeof LotteryModalInner>) {
  const { features } = useStorefront()
  if (!(features.lottery)) return null
  return <LotteryModalInner {...props} />
}

export default LotteryModal
