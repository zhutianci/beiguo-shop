'use client'

/**
 * 兑换页交互层。
 *
 * 【这个组件完全不知道上游是谁】它只认 /api/redeem/<provider>/* 返回的
 * 那套与厂商无关的结构：state、message、fields[]、guide[]。
 * 接第二家平台时，只要新适配器吐出同样的结构，这个文件一行都不用改 ——
 * 这就是整套设计的验收标准。
 *
 * 【凭据不留在浏览器里】输入框的值只存在 React state 里，
 * 不写 localStorage、不进 URL、提交完就清空。
 *
 * 【配色必须自己写，不要用 components/ui 里的 Card / Input / Button】
 * 那三个是**后台浅色主题**的：Card 带 bg-white、Input 是白底、Button 的 outline
 * 是深灰字。商城这边是深色渐变背景，套上去就是白底白字、整页看不见 ——
 * 这个页面第一版就是这么翻车的。
 * 而且 `.glass` 定义在 @layer components 里，**优先级低于 utility class**，
 * 所以 <Card className="glass"> 里赢的是 Card 自带的 bg-white，不是 glass。
 * 商城侧一律用原生元素 + 下面这套 token。
 */

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { KeyRound, ShieldCheck, CheckCircle2, AlertTriangle, Clock, LifeBuoy, ExternalLink, Loader2, UserCheck } from 'lucide-react'

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
interface Variant {
  code: string
  label: string
  hint?: string
  fields: RedeemField[]
  guide?: GuideStep[]
  guideIntro?: string
}
interface CheckResult {
  state: string
  message: string
  productName?: string
  fields: RedeemField[]
  guide?: GuideStep[]
  guideIntro?: string
  variants?: Variant[]
  variantDefault?: string
  variantLabel?: string
  variantHint?: string
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

/** 深色主题下的输入框样式。CDK 输入框与多行凭据框共用，保证视觉一致 */
const FIELD_CLS =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/90 outline-none transition-colors placeholder:text-white/25 focus:border-purple-400/50'

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
    ok: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/30',
    warn: 'bg-amber-500/10 text-amber-200 border-amber-500/30',
    bad: 'bg-red-500/10 text-red-200 border-red-500/30',
    info: 'bg-blue-500/10 text-blue-200 border-blue-500/30',
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
  /** 买家选中的充值渠道。只有适配器返回 variants 的平台才用得上 */
  const [variant, setVariant] = useState('')

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
      setVariant('')
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
        const data = d.data as CheckResult
        setCheck(data)
        /*
         * 服务端按本站商品名自动判出了渠道，就直接选上 —— 买家不用自己选。
         * 判不出来时 variantDefault 为空，下面的选择器才会让他挑。
         */
        if (data.variantDefault) setVariant(data.variantDefault)
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

  const selectedVariant = check?.variants?.find((v) => v.code === variant) || null
  const activeGuide = rebindMode ? undefined : check?.variants ? selectedVariant?.guide : check?.guide
  const activeGuideIntro = rebindMode ? undefined : check?.variants ? selectedVariant?.guideIntro : check?.guideIntro

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
    : check?.variants
      ? selectedVariant?.fields || []
      : check?.fields || []

  const submit = async () => {
    setErr('')
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
        body: JSON.stringify({ cdk: cdk.trim(), values, rebind: rebindMode, variant: variant || undefined }),
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

  /**
   * 从粘贴的 Session JSON 里自动认出账号邮箱。
   *
   * 【纯前端解析，不发给服务端】这一步的全部价值是让买家在**提交之前**
   * 看见「我这是在给哪个号充值」。卡密一旦提交就扣掉了，充错账号无法撤回 ——
   * 多一行确认，少一单客诉。解析不出来也不拦，只是不显示。
   */
  const detectEmail = (raw: string): string | null => {
    const t = (raw || '').trim()
    if (!t.startsWith('{')) return null
    try {
      const o = JSON.parse(t) as { user?: { email?: unknown }; email?: unknown }
      const e = o?.user?.email ?? o?.email
      return typeof e === 'string' && e.includes('@') ? e : null
    } catch {
      return null
    }
  }

  return (
    <div className="pt-28 sm:page-top pb-20">
      <div className="mx-auto w-full max-w-2xl px-4">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600">
            <KeyRound className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{systemName}</h1>
          <p className="mt-2 text-sm text-white/45">输入购买后获得的卡密，填写要充值的账号，即可自助完成充值</p>
        </div>

        <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:p-6">
          <div>
            <label className="mb-2 block text-sm text-white/70">卡密</label>
            <div className="flex gap-2">
              <input
                value={cdk}
                onChange={(e) => setCdk(e.target.value)}
                placeholder="粘贴购买后获得的卡密"
                autoComplete="off"
                spellCheck={false}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void doCheck(cdk)
                }}
                className={`flex-1 font-mono ${FIELD_CLS}`}
              />
              <button
                type="button"
                onClick={() => void doCheck(cdk)}
                disabled={checking}
                className="shrink-0 rounded-xl border border-white/12 bg-white/[0.06] px-5 text-sm font-medium text-white/80 transition-colors hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : '查询'}
              </button>
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

          {/*
            渠道选择。只有适配器返回 variants 的平台才出现（sysb 有三条通道）。
            sysa 只有一条路径、不返回 variants，这一块自动不渲染 —— 前端零改动。

            【为什么必须让买家选】sysb 的上游明确禁止预检卡密，我们无从得知
            这张卡属于哪条通道；而 ChatGPT 的信用卡通道与 iOS 通道是两个不同产品，
            卡密前缀（PLUS-/5X-）只说明档位、区分不了通道。
          */}
          {!result && !rebindMode && check?.variants && check.variants.length > 0 && (
            <div>
              <label className="mb-2 block text-sm text-white/70">
                {check.variantLabel || '充值渠道'}
                {check.variantDefault && (
                  <span className="ml-2 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] text-emerald-300">
                    已自动识别
                  </span>
                )}
              </label>
              <div className="grid gap-2 sm:grid-cols-3">
                {check.variants.map((v) => {
                  const on = v.code === variant
                  return (
                    <button
                      key={v.code}
                      type="button"
                      onClick={() => {
                        setVariant(v.code)
                        // 换渠道要清掉已填内容：不同渠道要的凭据类型不一样，
                        // 留着上一条的值只会连着提交上去
                        setValues({})
                        setErr('')
                      }}
                      className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                        on
                          ? 'border-purple-400/60 bg-purple-500/15'
                          : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
                      }`}
                    >
                      <span className={`block text-xs font-medium ${on ? 'text-purple-100' : 'text-white/80'}`}>
                        {v.label}
                      </span>
                      {v.hint && <span className="mt-0.5 block text-[11px] leading-relaxed text-white/40">{v.hint}</span>}
                    </button>
                  )
                })}
              </div>
              {check.variantHint && <p className="mt-2 text-xs leading-relaxed text-white/35">{check.variantHint}</p>}
            </div>
          )}

          {/* 取号指引。内容由适配器按产品给出 —— Claude 6 步、ChatGPT 4 步 */}
          {showForm && !rebindMode && activeGuide && activeGuide.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 text-sm font-medium text-white/80">操作指南</div>
              {activeGuideIntro && <p className="mb-3 text-xs leading-relaxed text-white/45">{activeGuideIntro}</p>}
              <ol className="space-y-3">
                {activeGuide.map((g, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-purple-500/20 text-[11px] font-semibold text-purple-200">
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
                          className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-300 transition-colors hover:text-emerald-200"
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
                        className={`${FIELD_CLS} resize-y font-mono text-xs`}
                      />
                    ) : (
                      <input
                        value={values[f.name] || ''}
                        onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                        placeholder={f.placeholder}
                        autoComplete="off"
                        spellCheck={false}
                        className={`${FIELD_CLS} font-mono`}
                      />
                    )}
                    {/*
                      自动认出账号邮箱。卡密一旦提交就扣掉了、充错账号无法撤回，
                      所以在提交前把「这是在给哪个号充值」明确摆出来。
                      纯前端解析，这个值不会发给服务端。
                    */}
                    {f.kind === 'session_json' &&
                      (values[f.name] || '').trim() &&
                      (detectEmail(values[f.name] || '') ? (
                        <div className="mt-2 flex items-start gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.08] px-3 py-2">
                          <UserCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                          <span className="text-xs leading-relaxed text-emerald-200">
                            将为这个账号充值：
                            <b className="ml-1 break-all font-medium">{detectEmail(values[f.name] || '')}</b>
                            <span className="mt-0.5 block text-emerald-200/55">请确认是你要充值的号，充错无法撤回。</span>
                          </span>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.08] px-3 py-2">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                          <span className="text-xs leading-relaxed text-amber-200">
                            没能从这段内容里识别出账号邮箱，可能没复制完整。请回到 session 页面全选复制整段 JSON。
                          </span>
                        </div>
                      ))}
                    <p className="mt-1.5 text-xs leading-relaxed text-white/35">{f.help}</p>
                  </div>
                )
              )}

              <Banner tone="info">
                你填写的账号凭据只用于本次充值，<b>不会被保存</b>。充值完成后建议到账号设置里退出全部设备登录，
                即可让该凭据失效。
              </Banner>

              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3.5 text-sm font-semibold text-white transition-all hover:shadow-[0_0_24px_rgba(139,92,246,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {rebindMode ? '提交重新绑定' : '确认充值'}
              </button>
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
                <button
                  type="button"
                  onClick={() => void doCheck(cdk)}
                  className="w-full rounded-xl border border-white/12 bg-white/[0.06] py-3 text-sm text-white/80 transition-colors hover:bg-white/[0.12]"
                >
                  重新查询状态
                </button>
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
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-white/30">
          充值遇到问题？请在个人中心提交工单，并附上卡密，我们会尽快处理。
        </p>
      </div>
    </div>
  )
}
