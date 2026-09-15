'use client'

/**
 * 兑换页交互层。
 *
 * 【这个组件完全不知道上游是谁】它只认 /api/redeem/<provider>/* 返回的
 * 那套与厂商无关的结构：state、message、fields[]。
 * 接第二家平台时，只要新适配器吐出同样的结构，这个文件一行都不用改 ——
 * 这就是整套设计的验收标准。
 *
 * 【凭据不留在浏览器里】输入框的值只存在 React state 里，
 * 不写 localStorage、不进 URL、提交完就清空。
 */

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { KeyRound, ShieldCheck, CheckCircle2, AlertTriangle, Clock, LifeBuoy, ExternalLink } from 'lucide-react'

interface RedeemField {
  name: string
  kind: string
  label: string
  help: string
  placeholder?: string
  pattern?: string
  required: boolean
  multiline?: boolean
}
interface GuideStep {
  title: string
  detail: string
  link?: { label: string; url: string }
}
interface CheckResult {
  state: string
  message: string
  productName?: string
  fields: RedeemField[]
  guide?: GuideStep[]
  guideIntro?: string
  account?: string
  completedAt?: string
  cooldownSeconds?: number
  notice?: { level: string; text: string } | null
}
interface ActivateResult {
  state: string
  message: string
  account?: string
  completedAt?: string
  retryAfter?: number
  retriable: boolean
}

const STATE_TONE: Record<string, 'ok' | 'warn' | 'bad' | 'info'> = {
  READY: 'info',
  COMPLETED: 'ok',
  PROCESSING: 'warn',
  COOLDOWN: 'warn',
  OUT_OF_STOCK: 'warn',
  VOID: 'bad',
  NOT_FOUND: 'bad',
  ERROR: 'bad',
}

function Banner({ tone, children }: { tone: 'ok' | 'warn' | 'bad' | 'info'; children: React.ReactNode }) {
  const cls = {
    ok: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    warn: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    bad: 'bg-red-500/10 text-red-300 border-red-500/30',
    info: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  }[tone]
  const Icon = tone === 'ok' ? CheckCircle2 : tone === 'info' ? ShieldCheck : tone === 'warn' ? Clock : AlertTriangle
  return (
    <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm leading-relaxed ${cls}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export default function RedeemClient({
  providerKey,
  systemName,
  supportsRebind,
}: {
  providerKey: string
  systemName: string
  supportsRebind: boolean
}) {
  const searchParams = useSearchParams()
  const [cdk, setCdk] = useState('')
  const [checking, setChecking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [check, setCheck] = useState<CheckResult | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ActivateResult | null>(null)
  const [err, setErr] = useState('')
  const [rebindMode, setRebindMode] = useState(false)

  const doCheck = useCallback(
    async (key: string) => {
      const k = key.trim()
      if (!k) {
        setErr('请输入卡密')
        return
      }
      setChecking(true)
      setErr('')
      setResult(null)
      setCheck(null)
      setValues({})
      setRebindMode(false)
      try {
        const res = await fetch(`/api/redeem/${providerKey}/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cdk: k }),
        })
        const d = await res.json()
        if (!d.success) {
          setErr(d.error || '查询失败')
          return
        }
        setCheck(d.data as CheckResult)
      } catch {
        setErr('网络错误，请重试')
      } finally {
        setChecking(false)
      }
    },
    [providerKey]
  )

  /*
   * 支持 /redeem/sysa?cdk=XXXX 直接带卡密进来并自动查询一次。
   * 订单页的「去充值」按钮就是这么拼的，买家不用手动复制粘贴。
   * 【只查询不提交】账号字段必须由买家自己填 —— 自动提交等于替他决定充到哪个号上。
   */
  useEffect(() => {
    const pre = searchParams.get('cdk')
    if (pre && pre.trim()) {
      setCdk(pre.trim())
      void doCheck(pre.trim())
    }
    // 只在首次挂载时预填，后续不跟着 URL 变
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeFields: RedeemField[] = rebindMode
    ? [
        {
          name: 'session_key',
          kind: 'session_key',
          label: 'Claude SessionKey',
          help: '需要使用当初充值时那个账号的 sessionKey，以 sk-ant-sid 开头。',
          placeholder: 'sk-ant-sid...',
          required: true,
          multiline: true,
        },
      ]
    : check?.fields || []

  const submit = async () => {
    setErr('')
    // 前端只做「必填有没有填」这一层。真正的校验在服务端与上游，
    // 这里拦一下纯粹是省一次往返
    const missing = activeFields.filter((f) => f.required && !(values[f.name] || '').trim())
    if (missing.length) {
      setErr(`请填写${missing[0].label}`)
      return
    }
    // 【either/or 判定必须排除 toggle】不排除的话，买家只勾了「强制充值」
    // 就会被当成「已经填了账号」，然后带着空凭据提交上去
    const accountFields = activeFields.filter((f) => f.kind !== 'toggle')
    if (accountFields.length > 0 && accountFields.every((f) => !f.required)) {
      const any = accountFields.some((f) => (values[f.name] || '').trim())
      if (!any) {
        setErr(`请至少填写「${accountFields[0].label}」`)
        return
      }
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/redeem/${providerKey}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cdk: cdk.trim(), values, rebind: rebindMode }),
      })
      const d = await res.json()
      if (!d.success) {
        setErr(d.error || '提交失败')
        return
      }
      setResult(d.data as ActivateResult)
      // 【提交完立刻清空凭据】它已经用完了，没有任何理由继续留在内存或表单里
      setValues({})
    } catch {
      setErr('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const showForm = !result && (rebindMode || check?.state === 'READY') && activeFields.length > 0

  return (
    <div className="pt-28 sm:page-top pb-20">
      <div className="mx-auto w-full max-w-2xl px-4">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">{systemName}</h1>
          <p className="mt-2 text-sm text-white/45">输入购买后获得的卡密，填写要充值的账号，即可自助完成充值</p>
        </div>

        <Card className="glass">
          <CardContent className="space-y-5 p-6">
            <div>
              <label className="mb-2 block text-sm text-white/70">卡密</label>
              <div className="flex gap-2">
                <Input
                  value={cdk}
                  onChange={(e) => setCdk(e.target.value)}
                  placeholder="粘贴购买后获得的卡密"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void doCheck(cdk)
                  }}
                  className="flex-1"
                />
                <Button onClick={() => void doCheck(cdk)} loading={checking} variant="outline">
                  查询
                </Button>
              </div>
            </div>

            {err && <Banner tone="bad">{err}</Banner>}

            {check && !result && (
              <Banner tone={STATE_TONE[check.state] || 'info'}>
                <div>{check.message}</div>
                {check.productName && <div className="mt-1 text-xs opacity-70">商品：{check.productName}</div>}
                {check.account && <div className="mt-1 text-xs opacity-70">账号：{check.account}</div>}
                {check.completedAt && <div className="mt-1 text-xs opacity-70">完成时间：{check.completedAt}</div>}
                {typeof check.cooldownSeconds === 'number' && check.cooldownSeconds > 0 && (
                  <div className="mt-1 text-xs opacity-70">冷却剩余约 {check.cooldownSeconds} 秒</div>
                )}
              </Banner>
            )}

            {check?.notice && !result && <Banner tone="warn">{check.notice.text}</Banner>}

            {/* 取号指引。内容由适配器按产品给出 —— Claude 6 步、ChatGPT 4 步 */}
            {showForm && !rebindMode && check?.guide && check.guide.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 text-sm font-medium text-white/80">操作指南</div>
                {check.guideIntro && (
                  <p className="mb-3 text-xs leading-relaxed text-white/45">{check.guideIntro}</p>
                )}
                <ol className="space-y-3">
                  {check.guide.map((g, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-purple-500/20 text-[11px] font-semibold text-purple-300">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white/75">{g.title}</div>
                        <div className="mt-0.5 text-xs leading-relaxed text-white/45">{g.detail}</div>
                        {g.link && (
                          <a
                            href={g.link.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200"
                          >
                            {g.link.label}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {showForm && (
              <div className="space-y-4">
                {activeFields.filter((f) => f.kind !== 'toggle').length > 1 && (
                  <p className="text-xs text-white/40">以下两项任选其一填写，推荐使用第一项。</p>
                )}
                {activeFields.map((f) =>
                  f.kind === 'toggle' ? (
                    // 开关型字段（如 GPT 的强制充值）。默认关闭，文案要把代价说在前面
                    <label
                      key={f.name}
                      className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3"
                    >
                      <input
                        type="checkbox"
                        checked={values[f.name] === '1'}
                        onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.checked ? '1' : '' }))}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-amber-500"
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-amber-200">{f.label}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-amber-200/55">{f.help}</span>
                      </span>
                    </label>
                  ) : (
                  <div key={f.name}>
                    <label className="mb-1.5 block text-sm text-white/70">
                      {f.label}
                      {f.required && <span className="ml-1 text-red-400">*</span>}
                    </label>
                    {f.multiline ? (
                      <textarea
                        value={values[f.name] || ''}
                        onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                        placeholder={f.placeholder}
                        rows={3}
                        spellCheck={false}
                        autoComplete="off"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/25 focus:border-purple-400/50"
                      />
                    ) : (
                      <Input
                        value={values[f.name] || ''}
                        onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                        placeholder={f.placeholder}
                        autoComplete="off"
                      />
                    )}
                    <p className="mt-1.5 text-xs leading-relaxed text-white/35">{f.help}</p>
                  </div>
                  )
                )}

                <Banner tone="info">
                  你填写的账号凭据只用于本次充值，<b>不会被保存</b>。充值完成后建议到账号设置里
                  退出全部设备登录，即可让该凭据失效。
                </Banner>

                <Button onClick={submit} loading={submitting} className="w-full" size="lg">
                  {rebindMode ? '提交重新绑定' : '确认充值'}
                </Button>
              </div>
            )}

            {result && (
              <>
                <Banner tone={STATE_TONE[result.state] || 'info'}>
                  <div className="font-medium">{result.message}</div>
                  {result.account && <div className="mt-1 text-xs opacity-70">账号：{result.account}</div>}
                  {result.completedAt && <div className="mt-1 text-xs opacity-70">完成时间：{result.completedAt}</div>}
                  {result.retryAfter ? (
                    <div className="mt-1 text-xs opacity-70">请等待约 {result.retryAfter} 秒后再试</div>
                  ) : null}
                </Banner>
                {result.retriable && (
                  <Button variant="outline" className="w-full" onClick={() => void doCheck(cdk)}>
                    重新查询状态
                  </Button>
                )}
              </>
            )}

            {/* 售后入口：只在上游支持重绑、且这张卡已经提交过时出现 */}
            {supportsRebind && !rebindMode && check && ['COMPLETED', 'PROCESSING'].includes(check.state) && (
              <button
                type="button"
                onClick={() => {
                  setRebindMode(true)
                  setResult(null)
                  setValues({})
                  setErr('')
                }}
                className="flex w-full items-center justify-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white/70"
              >
                <LifeBuoy className="h-3.5 w-3.5" />
                已充值但订阅没到账？点此重新绑定
              </button>
            )}
            {rebindMode && (
              <button
                type="button"
                onClick={() => {
                  setRebindMode(false)
                  setValues({})
                  setErr('')
                }}
                className="w-full text-xs text-white/40 transition-colors hover:text-white/70"
              >
                返回
              </button>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs leading-relaxed text-white/30">
          充值遇到问题？请在个人中心提交工单，并附上卡密，我们会尽快处理。
        </p>
      </div>
    </div>
  )
}
