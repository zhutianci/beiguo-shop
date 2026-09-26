'use client'

/**
 * 个人中心「邮件订阅」卡：营销邮件的总开关、三个主题、暂停 30 天、确认订阅。
 *
 * 【暗色商城样式，不用 components/ui】那套 Card/Button 是后台的浅色组件，放在前台深色页上
 * 会变成白底白字（交接文档二十.10）。这里沿用个人中心其它卡片的 glass 面板写法。
 *
 * 【三种状态】DEFAULT（注册时已告知、没明确表态）/ SUBSCRIBED（亲手点过确认订阅）/ UNSUBSCRIBED。
 * 调主题、暂停都不改变这三态 —— 否则 opt-out 下的一次微调会被误记成「明确同意」。
 * 总开关的「开」对 DEFAULT 用户取决于站点是否对默认用户发送（defaultEligible）：
 * 站点改成「只发给明确订阅者」后，DEFAULT 用户实际收不到，开关就如实显示为关。
 */

import { useStorefront } from '@/components/storefront-provider'
import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, BadgeCheck, Clock, Loader2, Mail } from 'lucide-react'
import { useHydrated } from '@/lib/use-hydrated'
import { TOPICS, TOPIC_LABEL, type AccountMarketingState, type Topic } from '@/lib/marketing/types'
import { bjDateCn } from '@/lib/marketing/time'

const TOPIC_DESC: Record<Topic, string> = {
  PROMO: '优惠券、限时折扣等活动',
  PRODUCT: '新上架的商品与服务',
  NEWS: '使用教程与行业资讯',
}

const PAUSE_DAYS = 30

type Body =
  | { action: 'subscribe' }
  | { action: 'unsubscribe' }
  | { action: 'topics'; topicsOff: Topic[] }
  | { action: 'pause'; days: number }
  | { action: 'resume' }

function fmtDay(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : bjDateCn(d)
}

function MarketingSubscriptionInner() {
  const hydrated = useHydrated()
  const [state, setState] = useState<AccountMarketingState | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadFailed(false)
    try {
      const res = await fetch('/api/account/marketing', { cache: 'no-store' })
      const d = await res.json().catch(() => null)
      if (d?.success) setState(d.data as AccountMarketingState)
      else setLoadFailed(true)
    } catch {
      setLoadFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  // 等水合完成再拉：登录态在 localStorage 里，水合那一次渲染拿不到（见 lib/use-hydrated.ts）
  useEffect(() => {
    if (hydrated) load()
  }, [hydrated, load])

  const send = async (key: string, body: Body, okText: string) => {
    if (busy) return
    setBusy(key)
    setErr('')
    setMsg('')
    try {
      const res = await fetch('/api/account/marketing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json().catch(() => null)
      if (d?.success) {
        setState(d.data as AccountMarketingState)
        setMsg(okText)
      } else {
        setErr(d?.error || '保存失败，请稍后重试')
      }
    } catch {
      setErr('网络错误，请稍后重试')
    } finally {
      setBusy(null)
    }
  }

  const receiving = !!state && (state.status === 'SUBSCRIBED' || (state.status === 'DEFAULT' && state.defaultEligible))
  const paused = !!state?.pausedUntil

  return (
    <div className="glass rounded-3xl p-6 sm:p-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-bold lg:text-2xl">
          <Mail className="h-5 w-5 text-purple-400" />
          邮件订阅
        </h2>
        <span className="text-xs text-white/40">订单、验证码、发票等交易邮件不受影响</span>
      </div>

      {!hydrated || loading ? (
        <div className="flex justify-center py-6 text-white/30">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : loadFailed || !state ? (
        <p className="py-6 text-center text-sm text-white/40">
          订阅设置加载失败，
          <button type="button" onClick={load} className="text-purple-300 underline-offset-2 hover:underline">
            点此重试
          </button>
        </p>
      ) : (
        <div className="space-y-4">
          {!state.email && (
            <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
              你的账户还没有邮箱，暂时收不到任何邮件。
            </p>
          )}

          {/* 总开关 */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 font-medium text-white/90">
                接收优惠与上新邮件（标题带 AD）
                {state.status === 'SUBSCRIBED' && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                    <BadgeCheck className="h-3 w-3" />
                    已确认订阅
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-white/45">
                {receiving
                  ? '我们会不定期发送优惠活动、新品上架等信息，频率有上限，随时可以关闭。'
                  : state.status === 'UNSUBSCRIBED'
                    ? '你已退订营销邮件，不会再收到。'
                    : '目前不会向你发送营销邮件。'}
              </p>
            </div>
            <Switch
              on={receiving}
              busy={busy === 'switch'}
              disabled={!!busy}
              label="接收优惠与上新邮件"
              onChange={(next) =>
                send('switch', next ? { action: 'subscribe' } : { action: 'unsubscribe' }, next ? '已开启营销邮件' : '已退订营销邮件')
              }
            />
          </div>

          {/* 默认用户：确认订阅（opt-out 下的明确同意，站点以后改成只发订阅者时仍能收到） */}
          {state.status === 'DEFAULT' && (
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] px-4 py-4">
              <p className="text-sm leading-relaxed text-white/70">
                你注册时已看到营销邮件的说明，目前按默认设置{state.defaultEligible ? '接收' : '不接收'}。
                点「确认订阅」表示你明确愿意收到：即使以后改为仅向订阅者发送，你仍会收到。
              </p>
              <button
                type="button"
                onClick={() => send('subscribe', { action: 'subscribe' }, '已确认订阅')}
                disabled={!!busy}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                {busy === 'subscribe' ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                确认订阅
              </button>
            </div>
          )}

          {/* 主题与暂停：只有在接收时才有意义 */}
          {receiving && (
            <>
              <div>
                <div className="mb-2 text-sm text-white/50">只接收这些内容</div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {TOPICS.map((t) => {
                    const on = !state.topicsOff.includes(t)
                    return (
                      <button
                        key={t}
                        type="button"
                        role="switch"
                        aria-checked={on}
                        disabled={!!busy}
                        onClick={() => {
                          const nextOff = on
                            ? Array.from(new Set([...state.topicsOff, t]))
                            : state.topicsOff.filter((x) => x !== t)
                          send(`topic-${t}`, { action: 'topics', topicsOff: nextOff }, on ? `已关闭「${TOPIC_LABEL[t]}」` : `已开启「${TOPIC_LABEL[t]}」`)
                        }}
                        className={`flex items-start justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors disabled:opacity-60 ${
                          on ? 'border-purple-400/40 bg-purple-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                        }`}
                      >
                        <span className="min-w-0">
                          <span className={`block text-sm font-medium ${on ? 'text-white/90' : 'text-white/50'}`}>{TOPIC_LABEL[t]}</span>
                          <span className="mt-0.5 block text-xs text-white/40">{TOPIC_DESC[t]}</span>
                        </span>
                        <span className="mt-0.5 shrink-0">
                          {busy === `topic-${t}` ? (
                            <Loader2 className="h-4 w-4 animate-spin text-white/50" />
                          ) : (
                            <span
                              className={`flex h-4 w-4 items-center justify-center rounded border ${
                                on ? 'border-purple-400 bg-purple-500' : 'border-white/25'
                              }`}
                            >
                              {on && <span className="h-1.5 w-1.5 rounded-sm bg-white" />}
                            </span>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-sm text-white/60">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
                  {paused ? (
                    <span>已暂停到 {fmtDay(state.pausedUntil)}，期间不会收到营销邮件，到期自动恢复。</span>
                  ) : (
                    <span>最近不想收？可以先暂停 {PAUSE_DAYS} 天。</span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    paused
                      ? send('pause', { action: 'resume' }, '已恢复接收')
                      : send('pause', { action: 'pause', days: PAUSE_DAYS }, `已暂停 ${PAUSE_DAYS} 天`)
                  }
                  disabled={!!busy}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 disabled:opacity-50"
                >
                  {busy === 'pause' && <Loader2 className="h-4 w-4 animate-spin" />}
                  {paused ? '恢复接收' : `暂停 ${PAUSE_DAYS} 天`}
                </button>
              </div>
            </>
          )}

          {err && (
            <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {err}
            </p>
          )}
          {msg && !err && (
            <p role="status" className="text-sm text-emerald-400">
              {msg}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function Switch({
  on,
  busy,
  disabled,
  label,
  onChange,
}: {
  on: boolean
  busy: boolean
  disabled: boolean
  label: string
  onChange: (next: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors disabled:opacity-60 ${
        on ? 'border-purple-400/60 bg-gradient-to-r from-violet-600 to-purple-600' : 'border-white/15 bg-white/10'
      }`}
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-6' : 'translate-x-1'
        }`}
      >
        {busy && <Loader2 className="h-3 w-3 animate-spin text-purple-600" />}
      </span>
    </button>
  )
}

/**
 * 渠道分站（实施分包 WP1）：营销邮件是平台专属（设计 11.3），渠道站不渲染订阅设置。
 * 只控制显示；对应接口在渠道 Host 上服务端 404（denyOnChannel）。组件本体改名为 MarketingSubscriptionInner、原样不动，
 * 由这层按店面决定挂不挂：不渲染就不会发出任何请求（验收 W1-9：渠道站页面零 404 请求）。主站恒为渲染，行为不变。
 */
export default function MarketingSubscription() {
  const { kind } = useStorefront()
  if (!(kind === 'PLATFORM')) return null
  return <MarketingSubscriptionInner />
}
