'use client'

/**
 * 邮件订阅设置 · 退订页（公开，免登录，token 即凭证）。
 *
 * 【GET 绝不改状态】邮件安全网关、聊天软件的链接预览都会打开这个页面；
 * 打开只读取状态，退订必须由人点按钮（POST）。RFC 8058 的一键退订走的是另一个端点。
 *
 * 【恢复订阅 / 打开主题 / 取消暂停只在发送后 30 天内可用】服务端判（canIncrease），这里只是
 * 把不可用的按钮置灰并说明原因：旧邮件会被转发，拿到它的人不该能替收件人「重新同意」。
 *
 * 风格与开票填写页（/invoice-request/[token]）一致：浅色、白卡片、手机优先。
 * /unsubscribe/test 是测试邮件用的演示页：顶部有横幅，操作不会生效（服务端空转）。
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { AlertCircle, CheckCircle2, Clock, Loader2, MailX, XCircle } from 'lucide-react'
import { TOPICS, TOPIC_LABEL, type PrefsState, type Topic } from '@/lib/marketing/types'
import { bjDateCn } from '@/lib/marketing/time'
import { useStorefront } from '@/components/storefront-provider'

const TOPIC_DESC: Record<Topic, string> = {
  PROMO: '优惠券、限时折扣等活动',
  PRODUCT: '新上架的商品与服务',
  NEWS: '使用教程与行业资讯',
}

type Action =
  | { action: 'unsubscribe' }
  | { action: 'resubscribe' }
  | { action: 'topics'; topicsOff: Topic[] }
  | { action: 'pause'; days: number }
  | { action: 'resume' }

const PAUSE_DAYS = 30

function fmtDay(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : bjDateCn(d)
}

export default function UnsubscribePage() {
  const params = useParams()
  const token = String(params.token || '')
  /*
   * 渠道分站（设计 11.2「平台专用令牌链接」）：开票填写 / 退订链接永远按平台 origin 生成，渠道 Host 上一律当作不存在。
   * 本页是客户端组件，调不了 notFoundOnChannel()；服务端的真 404 在接口层（denyOnChannel）与 nginx 白名单。
   * 这里在渠道店面直接显示「链接无效」、不发请求（主站 features 全开，行为不变）。
   */
  const { kind: storefrontKind } = useStorefront()

  const [state, setState] = useState<PrefsState | null>(null)
  const [phase, setPhase] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading')
  const [loadErr, setLoadErr] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [needLogin, setNeedLogin] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  /** 主题勾选的草稿：勾上 = 接收 */
  const [draftOff, setDraftOff] = useState<Topic[]>([])
  const prefsRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    if (storefrontKind !== 'PLATFORM') {
      setPhase('notfound')
      return
    }
    try {
      const res = await fetch(`/api/mkt/prefs/${encodeURIComponent(token)}`, { cache: 'no-store' })
      const d = await res.json().catch(() => null)
      if (d?.success) {
        setState(d.data as PrefsState)
        setDraftOff((d.data as PrefsState).topicsOff)
        setPhase('ok')
      } else if (res.status === 404) {
        setPhase('notfound')
      } else {
        setLoadErr(d?.error || '加载失败，请刷新重试')
        setPhase('error')
      }
    } catch {
      setLoadErr('网络错误，请刷新重试')
      setPhase('error')
    }
  }, [token, storefrontKind])

  useEffect(() => {
    load()
  }, [load])

  // 邮件底部「调整订阅」链接带 ?v=prefs：直接滚到「只想少收一点？」
  useEffect(() => {
    if (phase !== 'ok') return
    try {
      if (new URLSearchParams(window.location.search).get('v') === 'prefs') {
        prefsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } catch {
      // 忽略
    }
  }, [phase])

  const send = async (key: string, body: Action, okText: string) => {
    if (busy) return
    setBusy(key)
    setErr(null)
    setNeedLogin(false)
    setNotice(null)
    try {
      const res = await fetch(`/api/mkt/prefs/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json().catch(() => null)
      if (d?.success) {
        const next = d.data as PrefsState
        setState(next)
        setDraftOff(next.topicsOff)
        setNotice(okText)
        return
      }
      if (res.status === 404) {
        setPhase('notfound')
        return
      }
      if (res.status === 403) setNeedLogin(true)
      setErr(d?.error || '操作失败，请稍后重试')
    } catch {
      setErr('网络错误，请重试')
    } finally {
      setBusy(null)
    }
  }

  if (phase === 'loading') {
    return (
      <Shell>
        <div className="flex items-center justify-center py-24 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ml-2 text-sm">加载中...</span>
        </div>
      </Shell>
    )
  }

  if (phase === 'notfound') {
    return (
      <Shell>
        <Notice icon={<XCircle className="h-10 w-10 text-gray-300" />} title="链接无效或已过期">
          请确认链接是否完整复制。你也可以
          <a href="/login?redirect=/profile" className="mx-1 font-medium text-sky-600 underline-offset-2 hover:underline">
            登录
          </a>
          后在「个人中心 → 邮件订阅」里随时退订营销邮件。
        </Notice>
        <Footnote />
      </Shell>
    )
  }

  if (phase === 'error' || !state) {
    return (
      <Shell>
        <Notice icon={<AlertCircle className="h-10 w-10 text-amber-400" />} title="暂时无法加载">
          {loadErr || '加载失败，请刷新重试'}
        </Notice>
        <Footnote />
      </Shell>
    )
  }

  const unsubscribed = state.status === 'UNSUBSCRIBED'
  const paused = !!state.pausedUntil
  const topicsDirty =
    draftOff.length !== state.topicsOff.length || draftOff.some((t) => !state.topicsOff.includes(t))
  // 草稿里重新勾上了原本关着的主题 = 增加来信；30 天外的旧邮件不允许
  const draftReopens = state.topicsOff.some((t) => !draftOff.includes(t))
  const allOff = draftOff.length === TOPICS.length

  return (
    <Shell>
      {state.test && (
        <div role="status" className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>这是测试邮件的演示页面，操作不会生效</span>
        </div>
      )}

      {/* ---------- 主卡：退订 / 已退订 ---------- */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs text-gray-500">收件邮箱</div>
            <div className="mt-0.5 break-all text-base font-semibold text-gray-900">{state.emailMasked}</div>
          </div>
          <StatusPill unsubscribed={unsubscribed} pausedUntil={state.pausedUntil} />
        </div>

        {unsubscribed ? (
          <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-4 text-emerald-800 ring-1 ring-emerald-100">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div className="min-w-0 text-sm leading-relaxed">
                <p className="font-medium">已退订，你不会再收到贝果科技的营销邮件。</p>
                {state.canIncrease ? (
                  <p className="mt-1.5 text-emerald-700">
                    点错了？
                    <button
                      type="button"
                      onClick={() => send('resubscribe', { action: 'resubscribe' }, '已恢复订阅')}
                      disabled={!!busy}
                      className="ml-0.5 inline-flex items-center gap-1 font-semibold text-emerald-800 underline underline-offset-2 disabled:opacity-60"
                    >
                      {busy === 'resubscribe' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      恢复订阅
                    </button>
                  </p>
                ) : (
                  <p className="mt-1.5 text-emerald-700">
                    如需恢复订阅，请
                    <a href="/login?redirect=/profile" className="mx-0.5 font-semibold underline underline-offset-2">
                      登录
                    </a>
                    后在个人中心操作。
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              不想再收到贝果科技的优惠活动、新品上架等营销邮件？点下面的按钮即可退订，立即生效。
            </p>
            <button
              type="button"
              onClick={() => send('unsubscribe', { action: 'unsubscribe' }, '已退订')}
              disabled={!!busy}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-base font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === 'unsubscribe' ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailX className="h-4 w-4" />}
              退订全部营销邮件
            </button>
          </>
        )}

        {err && (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {err}
              {needLogin && (
                <a href="/login?redirect=/profile" className="ml-1 font-semibold underline underline-offset-2">
                  去登录
                </a>
              )}
            </span>
          </div>
        )}
        {notice && !err && (
          <p role="status" className="mt-3 text-center text-xs text-emerald-600">
            {notice}
          </p>
        )}
      </div>

      {/* ---------- 次级区：少收一点 ---------- */}
      {!unsubscribed && (
        <div ref={prefsRef} className="mt-4 scroll-mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:p-6">
          <h2 className="text-base font-semibold text-gray-900">只想少收一点？</h2>
          <p className="mt-1 text-sm text-gray-500">只保留你感兴趣的内容，或者先暂停一段时间。</p>

          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-medium text-gray-700">我想接收</legend>
            <div className="space-y-2">
              {TOPICS.map((t) => {
                const on = !draftOff.includes(t)
                const wasOff = state.topicsOff.includes(t)
                // 原本关着的主题，30 天外的旧邮件不能在这里重新打开
                const locked = wasOff && !state.canIncrease
                return (
                  <label
                    key={t}
                    className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors ${
                      locked ? 'cursor-not-allowed border-gray-200 bg-gray-50' : 'cursor-pointer border-gray-200 hover:bg-gray-50'
                    } ${on ? 'ring-1 ring-sky-500/40' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={locked || !!busy}
                      onChange={(e) =>
                        setDraftOff((prev) => (e.target.checked ? prev.filter((x) => x !== t) : Array.from(new Set([...prev, t]))))
                      }
                      className="mt-0.5 h-4 w-4 shrink-0 accent-sky-600"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900">{TOPIC_LABEL[t]}</span>
                      <span className="mt-0.5 block text-xs text-gray-500">
                        {locked ? '已关闭；重新打开请登录后在个人中心操作' : TOPIC_DESC[t]}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
            {allOff && <p className="mt-2 text-xs text-amber-700">三项都不勾，等于不再收到任何营销邮件。</p>}
            <button
              type="button"
              onClick={() => send('topics', { action: 'topics', topicsOff: draftOff }, '主题设置已保存')}
              disabled={!topicsDirty || !!busy || (draftReopens && !state.canIncrease)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === 'topics' && <Loader2 className="h-4 w-4 animate-spin" />}
              保存主题设置
            </button>
          </fieldset>

          <div className="mt-5 border-t border-gray-100 pt-4">
            {paused ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-start gap-2 text-sm text-gray-600">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <span>已暂停到 {fmtDay(state.pausedUntil)}，期间不会收到营销邮件。</span>
                </p>
                <button
                  type="button"
                  onClick={() => send('resume', { action: 'resume' }, '已恢复接收')}
                  disabled={!!busy || !state.canIncrease}
                  title={state.canIncrease ? undefined : '请登录后在个人中心操作'}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy === 'resume' && <Loader2 className="h-4 w-4 animate-spin" />}
                  现在恢复接收
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-600">最近不想收？先暂停 {PAUSE_DAYS} 天，到期自动恢复。</p>
                <button
                  type="button"
                  onClick={() => send('pause', { action: 'pause', days: PAUSE_DAYS }, `已暂停 ${PAUSE_DAYS} 天`)}
                  disabled={!!busy}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy === 'pause' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                  暂停 {PAUSE_DAYS} 天
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Footnote />
    </Shell>
  )
}

function StatusPill({ unsubscribed, pausedUntil }: { unsubscribed: boolean; pausedUntil: string | null }) {
  if (unsubscribed) {
    return <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">已退订</span>
  }
  if (pausedUntil) {
    return (
      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
        暂停至 {fmtDay(pausedUntil)}
      </span>
    )
  }
  return (
    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
      接收中
    </span>
  )
}

/** 页面外壳：浅色背景 + 品牌抬头。color-scheme 就地声明为 light（根布局是深色） */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 text-gray-900 sm:py-12" style={{ colorScheme: 'light' }}>
      <div className="mx-auto w-full max-w-md">
        <div className="mb-5 flex items-center gap-3">
          {/* 纯 <img>：这台机器内存小，不走 next/image 的服务端缩放 */}
          <img
            src="/logo-mark.png"
            alt="贝果科技"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-xl bg-gray-900 p-1.5"
          />
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight">邮件订阅设置</h1>
            <p className="text-xs text-gray-500">贝果科技 · bigolab.com</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

function Footnote() {
  return (
    <div className="mt-5 space-y-1.5 px-1 text-center text-xs leading-relaxed text-gray-500">
      <p>订单、验证码、发票等交易邮件不受影响。</p>
      <p className="text-gray-400">
        贝果科技（益阳市赫山区必高科技有限公司）·{' '}
        <a href="/privacy" className="underline-offset-2 hover:underline">
          隐私政策
        </a>
      </p>
    </div>
  )
}

function Notice({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white px-5 py-12 text-center shadow-sm ring-1 ring-gray-200">
      <div className="flex justify-center">{icon}</div>
      <h2 className="mt-3 text-base font-semibold text-gray-900">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{children}</p>
    </div>
  )
}
