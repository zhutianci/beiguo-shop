'use client'

/**
 * 开票填写链接 · 客户页（公开，免登录）。
 *
 * 管理员在后台「发票管理 → 生成填写链接」定好含税金额，把链接发给站外客户；
 * 客户在这里填抬头/税号/邮箱/是否展示字眼并提交，提交即生成一张进待开清单的发票。
 *
 * 【为什么是一张独立的浅色页，不在 (shop) 布局里】客户多半不是本站用户，
 * 给他一整套商城页头页脚、登录入口只会让人困惑「我是不是还得注册」。
 * 风格与收据页（/receipt/[token]）一致：白底、干净、像一张单据。
 *
 * 前端校验与服务端同一口径（lib/invoice-input.ts）：税号用 lib/tax-number 同一份归一化规则，
 * 自己写 /\s/ 会漏掉零宽字符，出现「前台说 21 位、服务端算出 18 位」的偏差。
 */

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AlertCircle, CheckCircle2, ChevronDown, Clock, FileText, Loader2, XCircle } from 'lucide-react'
import { normalizeTaxNumber, TAX_NUMBER_MAX_LEN } from '@/lib/tax-number'
import { maskEmail } from '@/lib/mask'
import { useStorefront } from '@/components/storefront-provider'

interface Submitted {
  title: string | null
  taxNumber: string | null
  /** 服务端已打码 */
  email: string
  showAiWording: boolean | null
  invoiceNo: string
  /** 发票状态：SUBMITTED 待开 / ISSUED 已开 / CANNOT 不可开 */
  status: string
}

interface View {
  status: 'PENDING' | 'SUBMITTED' | 'CANCELLED' | 'EXPIRED'
  invoiceAmount: number
  subscriptionType: string | null
  expiresAt: string | null
  submittedAt: string | null
  submitted: Submitted | null
}

const INVOICE_STATUS_TEXT: Record<string, string> = {
  SUBMITTED: '已提交，等待开具',
  ISSUED: '已开具，请查收邮箱',
  CANNOT: '暂无法开具，请联系客服',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function fmtTime(s: string | null) {
  if (!s) return ''
  return new Date(s).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// iOS Safari 在输入框字号 < 16px 时聚焦会自动放大整页，所以输入框统一 text-base
const INPUT_CLS =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'

export default function InvoiceRequestPage() {
  const params = useParams()
  const token = String(params.token || '')
  /*
   * 渠道分站（设计 11.2「平台专用令牌链接」）：开票填写 / 退订链接永远按平台 origin 生成，渠道 Host 上一律当作不存在。
   * 本页是客户端组件，调不了 notFoundOnChannel()；服务端的真 404 在接口层（denyOnChannel）与 nginx 白名单。
   * 这里在渠道店面直接显示「链接无效」、不发请求（主站 features 全开，行为不变）。
   */
  const { kind: storefrontKind } = useStorefront()

  const [view, setView] = useState<View | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading')
  const [loadErr, setLoadErr] = useState('')

  const [title, setTitle] = useState('')
  const [taxNumber, setTaxNumber] = useState('')
  const [email, setEmail] = useState('')
  // 必选、无默认：发票上印不印 ChatGPT/Claude 字眼，只能客户自己表态
  const [showAiWording, setShowAiWording] = useState<boolean | null>(null)
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [moreOpen, setMoreOpen] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  /** 本次提交成功后的回执（与 GET 回来的「已提交」同一形状，共用一张卡片） */
  const [done, setDone] = useState<Submitted | null>(null)

  const load = useCallback(async () => {
    if (storefrontKind !== 'PLATFORM') {
      setState('notfound')
      return
    }
    try {
      const res = await fetch(`/api/invoice-requests/${token}`, { cache: 'no-store' })
      const d = await res.json().catch(() => null)
      if (d?.success) {
        setView(d.data as View)
        setState('ok')
      } else if (res.status === 404) {
        setState('notfound')
      } else {
        setLoadErr(d?.error || '加载失败，请刷新重试')
        setState('error')
      }
    } catch {
      setLoadErr('网络错误，请刷新重试')
      setState('error')
    }
  }, [token, storefrontKind])

  useEffect(() => {
    load()
  }, [load])

  const cleanTax = normalizeTaxNumber(taxNumber)
  const taxTooLong = cleanTax.length > TAX_NUMBER_MAX_LEN

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setErr(null)
    if (!title.trim()) return setErr('请填写发票抬头')
    if (!cleanTax) return setErr('请填写税号')
    if (taxTooLong) {
      return setErr(`税号去掉空格后为 ${cleanTax.length} 位，超过 ${TAX_NUMBER_MAX_LEN} 位，请检查是否填错`)
    }
    if (!EMAIL_RE.test(email.trim())) return setErr('请填写正确的接收邮箱')
    if (showAiWording === null) return setErr('请选择发票中是否展示 ChatGPT/Claude 等字眼')

    setSubmitting(true)
    try {
      const res = await fetch(`/api/invoice-requests/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          taxNumber: taxNumber.trim(),
          email: email.trim(),
          showAiWording,
          address: address.trim() || null,
          phone: phone.trim() || null,
          bankName: bankName.trim() || null,
          bankAccount: bankAccount.trim() || null,
        }),
      })
      const d = await res.json().catch(() => null)
      if (d?.success) {
        setDone({
          title: title.trim(),
          taxNumber: cleanTax,
          email: maskEmail(email.trim().toLowerCase()),
          showAiWording,
          invoiceNo: d.data.invoiceNo,
          status: 'SUBMITTED',
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      // 409 已被提交（可能是另一个标签页/另一个人）、410 过期或作废：
      // 重新拉一次状态，直接切到对应的页面，比一行红字更说得清楚
      if (res.status === 409 || res.status === 410) {
        await load()
        return
      }
      setErr(d?.error || '提交失败，请稍后重试')
    } catch {
      setErr('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  // ---------- 各状态 ----------

  if (state === 'loading') {
    return (
      <Shell>
        <div className="flex items-center justify-center py-24 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ml-2 text-sm">加载中...</span>
        </div>
      </Shell>
    )
  }

  if (state === 'notfound') {
    return (
      <Shell>
        <Notice icon={<XCircle className="h-10 w-10 text-gray-300" />} title="链接不存在或已失效">
          请确认链接是否完整复制，或联系客服重新获取开票链接。
        </Notice>
      </Shell>
    )
  }

  if (state === 'error' || !view) {
    return (
      <Shell>
        <Notice icon={<AlertCircle className="h-10 w-10 text-amber-400" />} title="暂时无法加载">
          {loadErr || '加载失败，请刷新重试'}
        </Notice>
      </Shell>
    )
  }

  const receipt = done || (view.status === 'SUBMITTED' ? view.submitted : null)

  if (receipt || view.status === 'SUBMITTED') {
    return (
      <Shell>
        <AmountCard view={view} editable={false} />
        <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:p-6">
          <div className={`flex items-center gap-2 ${receipt?.status === 'CANNOT' ? 'text-amber-600' : 'text-emerald-600'}`}>
            {receipt?.status === 'CANNOT' ? (
              <AlertCircle className="h-5 w-5 shrink-0" />
            ) : (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            )}
            <h2 className="text-base font-semibold">
              {receipt ? INVOICE_STATUS_TEXT[receipt.status] || '已提交' : '开票信息已提交'}
            </h2>
          </div>
          {receipt ? (
            <dl className="mt-4 space-y-0 text-sm">
              <SummaryRow label="发票申请号" value={<span className="font-mono">{receipt.invoiceNo}</span>} />
              <SummaryRow label="抬头" value={receipt.title || '—'} />
              {receipt.taxNumber && <SummaryRow label="税号" value={<span className="font-mono">{receipt.taxNumber}</span>} />}
              <SummaryRow label="接收邮箱" value={receipt.email} />
              {receipt.showAiWording != null && (
                // 标签刻意写短：375px 宽时长标签会把值挤成三行
                <SummaryRow
                  label="展示字眼"
                  value={
                    receipt.showAiWording
                      ? view.subscriptionType
                        ? `展示（规格型号印：${view.subscriptionType}）`
                        : '展示'
                      : '不展示（只印「技术咨询服务」）'
                  }
                />
              )}
              {!done && view.submittedAt && <SummaryRow label="提交时间" value={fmtTime(view.submittedAt)} />}
            </dl>
          ) : null}
          <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-500">
            {receipt?.status === 'ISSUED'
              ? '发票已开具并发送到接收邮箱，如未收到请检查垃圾邮件或联系客服。'
              : '发票开具后会发送到接收邮箱。信息提交后不能在此修改，如填错请联系客服处理。'}
          </p>
        </div>
      </Shell>
    )
  }

  if (view.status === 'EXPIRED' || view.status === 'CANCELLED') {
    const expired = view.status === 'EXPIRED'
    return (
      <Shell>
        <Notice
          icon={
            expired ? <Clock className="h-10 w-10 text-gray-300" /> : <XCircle className="h-10 w-10 text-gray-300" />
          }
          title={expired ? '链接已过期' : '链接已失效'}
        >
          {expired ? '这个开票链接已过期' : '这个开票链接已被作废'}，请联系客服重新获取。
        </Notice>
      </Shell>
    )
  }

  // ---------- 待填写：表单 ----------

  const showDesc = view.subscriptionType ? `规格型号印：${view.subscriptionType}` : '印订阅相关的开票内容'

  return (
    <Shell>
      <AmountCard view={view} editable />

      <form
        noValidate
        onSubmit={submit}
        className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:p-6"
      >
        <h2 className="mb-4 text-base font-semibold text-gray-900">开票信息</h2>

        <div className="space-y-4">
          <Field label="抬头" required>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="公司名称 / 个人姓名"
              maxLength={200}
              autoComplete="organization"
              className={INPUT_CLS}
            />
          </Field>

          <Field
            label="税号"
            required
            hint={
              cleanTax ? (
                <span className={taxTooLong ? 'text-red-600' : undefined}>
                  去空格后 {cleanTax.length} 位
                  {taxTooLong ? `，超过 ${TAX_NUMBER_MAX_LEN} 位，请检查是否填错` : ''}
                </span>
              ) : (
                `统一社会信用代码，最长 ${TAX_NUMBER_MAX_LEN} 位，空格会自动去掉`
              )
            }
          >
            <input
              value={taxNumber}
              onChange={(e) => setTaxNumber(e.target.value)}
              placeholder="纳税人识别号"
              maxLength={64}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className={`${INPUT_CLS} font-mono`}
            />
          </Field>

          <Field label="接收邮箱" required hint="发票开具后会发送到这个邮箱">
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              maxLength={255}
              autoComplete="email"
              autoCapitalize="off"
              spellCheck={false}
              className={INPUT_CLS}
            />
          </Field>

          <div>
            <div id="ai-wording-label" className="mb-1.5 text-sm font-medium text-gray-700">
              是否在发票中展示 ChatGPT/Claude 等字眼<span className="ml-0.5 text-red-500">*</span>
            </div>
            <div role="radiogroup" aria-labelledby="ai-wording-label" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { v: true, label: '展示', desc: showDesc },
                { v: false, label: '不展示', desc: '发票项目只印「技术咨询服务」' },
              ].map((opt) => {
                const on = showAiWording === opt.v
                return (
                  <button
                    key={String(opt.v)}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setShowAiWording(opt.v)}
                    className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                      on ? 'border-sky-500 bg-sky-50 ring-1 ring-sky-500' : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        on ? 'border-sky-500' : 'border-gray-300'
                      }`}
                    >
                      {on && <span className="h-2 w-2 rounded-full bg-sky-500" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900">{opt.label}</span>
                      <span className="mt-0.5 block break-words text-xs text-gray-500">{opt.desc}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 选填项默认收起：多数个人/小公司只需要抬头 + 税号，四个空框摆出来只会让人以为都得填 */}
          <div className="rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              className="flex w-full items-center justify-between px-3.5 py-3 text-left text-sm text-gray-600"
            >
              <span>选填：地址、电话、开户行、银行账号</span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>
            {moreOpen && (
              <div className="space-y-3 border-t border-gray-200 px-3.5 pb-4 pt-3">
                <Field label="地址">
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    maxLength={255}
                    autoComplete="street-address"
                    className={INPUT_CLS}
                  />
                </Field>
                <Field label="电话">
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={50}
                    autoComplete="tel"
                    className={INPUT_CLS}
                  />
                </Field>
                <Field label="开户行">
                  <input value={bankName} onChange={(e) => setBankName(e.target.value)} maxLength={128} className={INPUT_CLS} />
                </Field>
                <Field label="银行账号">
                  <input
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    maxLength={64}
                    inputMode="numeric"
                    autoComplete="off"
                    className={`${INPUT_CLS} font-mono`}
                  />
                </Field>
              </div>
            )}
          </div>
        </div>

        {err && (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{err}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-base font-semibold text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? '提交中...' : '提交开票信息'}
        </button>
        <p className="mt-2 text-center text-xs text-gray-400">提交后不能在此修改，请核对抬头与税号</p>
      </form>
    </Shell>
  )
}

/** 页面外壳：浅色背景 + 标题。color-scheme 就地声明为 light（根布局是深色，原生控件会跟着画成深色） */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 text-gray-900 sm:py-12" style={{ colorScheme: 'light' }}>
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold leading-tight">填写开票信息</h1>
            <p className="text-xs text-gray-500">贝果科技 · 增值税发票</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

/** 金额卡：含税金额是管理员定的，客户只能看不能改 */
function AmountCard({ view, editable }: { view: View; editable: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:p-6">
      <div className="text-sm text-gray-500">开票金额（含税）</div>
      <div className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-gray-900">
        ¥{view.invoiceAmount.toFixed(2)}
      </div>
      {/* 不显示「不含税 + 税额」的拆分：发票上印的税额按票面征收率算（lib/invoice-export.ts 的 税率），
          与站内收取的 6% 不是一回事，按 6% 拆给客户看会和他收到的发票对不上 */}
      {editable && (
        <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-500">
          金额由商家根据你的实付款设定，这里无法修改；如有疑问请先联系客服。
          {view.expiresAt && <span className="block">链接有效期至 {fmtTime(view.expiresAt)}</span>}
        </p>
      )}
    </div>
  )
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  )
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-2 last:border-0">
      <dt className="shrink-0 text-gray-500">{label}</dt>
      <dd className="min-w-0 break-all text-right font-medium text-gray-900">{value}</dd>
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
