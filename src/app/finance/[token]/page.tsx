'use client'

/**
 * 财务开票台。企业微信「发票可开具」通知里的链接指向这里。
 *
 * 免登录（令牌即凭证）：财务多半不是后台管理员，也多半在手机上看企微。
 * 令牌只能做两件事——看待开清单、把某一张标记为已开具，且有效期短（默认 3 天）。
 *
 * 页面本身是一张「工作台」而不是文档：一屏看清还有几张要开、每张的抬头税号
 * 可一键复制（财务要往开票系统里粘），开完点一下就更新状态并邮件通知客户。
 */

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Mail,
  MailWarning,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface Invoice {
  id: number
  invoiceNo: string
  title: string | null
  taxNumber: string | null
  address: string | null
  phone: string | null
  bankName: string | null
  bankAccount: string | null
  email: string | null
  showAiWording: boolean | null
  subscriptionType: string
  claudeAccount: string | null
  sellingPrice: number | null
  invoiceAmount: number | null
  taxFee: number | null
  paidAt: string | null
  submittedAt: string | null
}

interface Issued {
  invoiceNo: string
  title: string | null
  invoiceAmount: number | null
  issuedAt: string | null
}

function fmt(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
const money = (n: number | null) => (n == null ? '—' : `¥${n.toFixed(2)}`)

export default function FinanceDeskPage() {
  const params = useParams()
  const token = String(params.token || '')

  const [pending, setPending] = useState<Invoice[]>([])
  const [issued, setIssued] = useState<Issued[]>([])
  const [state, setState] = useState<'loading' | 'ok' | 'invalid'>('loading')
  const [errMsg, setErrMsg] = useState('')
  const [busy, setBusy] = useState<number | null>(null)
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null)
  const [open, setOpen] = useState<number | null>(null)
  const [copied, setCopied] = useState('')
  const [emailOn, setEmailOn] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/finance/invoices/${token}`)
      const d = await res.json()
      if (d.success) {
        setPending(d.data.pending)
        setIssued(d.data.recentIssued)
        setState('ok')
      } else {
        setErrMsg(d.error || '链接无效')
        setState('invalid')
      }
    } catch {
      setErrMsg('网络错误，请重试')
      setState('invalid')
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      setTimeout(() => setCopied(''), 1500)
    } catch {
      /* 剪贴板不可用时静默失败，用户可以手动选中 */
    }
  }

  const markIssued = async (iv: Invoice) => {
    if (!confirm(`确认「${iv.invoiceNo}」已开具？\n\n抬头：${iv.title || '—'}\n金额：${money(iv.invoiceAmount)}`)) return
    setBusy(iv.id)
    setToast(null)
    try {
      const res = await fetch(`/api/finance/invoices/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: iv.id, notifyCustomer: emailOn }),
      })
      const d = await res.json()
      setToast({ ok: !!d.success, text: d.success ? d.message : d.error || '操作失败' })
      if (d.success) {
        setPending((prev) => prev.filter((x) => x.id !== iv.id))
        setOpen(null)
      }
    } catch {
      setToast({ ok: false, text: '网络错误，请重试' })
    } finally {
      setBusy(null)
      setTimeout(() => setToast(null), 5000)
    }
  }

  if (state === 'loading') {
    return <div className="min-h-screen bg-[#0b0d12] flex items-center justify-center text-white/40 text-sm">加载中…</div>
  }

  if (state === 'invalid') {
    return (
      <div className="min-h-screen bg-[#0b0d12] flex flex-col items-center justify-center px-8 text-center">
        <AlertCircle className="w-10 h-10 text-amber-400/80 mb-3" />
        <p className="text-white/80 text-base">{errMsg || '链接无效或已过期'}</p>
        <p className="text-white/35 text-xs mt-2 leading-relaxed">开票台链接有效期 3 天，过期后请让管理员重新发送。</p>
      </div>
    )
  }

  const totalAmount = pending.reduce((s, x) => s + (x.invoiceAmount || 0), 0)

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0b0d12]/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span className="text-[15px] font-semibold">开票台</span>
          </div>
          <button
            onClick={load}
            aria-label="刷新"
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center active:bg-white/10"
          >
            <RefreshCw className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-3 text-[12px]">
          <span className="text-white/50">
            待开 <b className="text-amber-300 tabular-nums text-[15px]">{pending.length}</b> 张
          </span>
          <span className="text-white/50">
            合计 <b className="text-white/80 tabular-nums">{money(totalAmount)}</b>
          </span>
        </div>
      </header>

      {toast && (
        <div
          className={`mx-4 mt-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[13px] ${
            toast.ok
              ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/25 bg-red-500/10 text-red-200'
          }`}
        >
          {toast.ok ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <span className="leading-relaxed">{toast.text}</span>
        </div>
      )}

      <main className="px-4 py-4 space-y-3">
        <label className="flex items-center gap-2 text-[12px] text-white/45 px-1">
          <input
            type="checkbox"
            checked={emailOn}
            onChange={(e) => setEmailOn(e.target.checked)}
            className="accent-purple-500"
          />
          标记开具后邮件通知客户（含「检查垃圾箱」提示）
        </label>

        {pending.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-400/70 mx-auto mb-3" />
            <p className="text-white/60 text-sm">当前没有待开的发票</p>
          </div>
        ) : (
          pending.map((iv) => {
            const expanded = open === iv.id
            return (
              <div key={iv.id} className="rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden">
                <button
                  onClick={() => setOpen(expanded ? null : iv.id)}
                  className="w-full text-left px-4 py-3 active:bg-white/[0.02]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[15px] font-medium truncate">{iv.title || '（无抬头）'}</div>
                      <div className="mt-0.5 text-[11px] font-mono text-white/40 truncate">{iv.invoiceNo}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[15px] font-semibold tabular-nums text-amber-300">
                        {money(iv.invoiceAmount)}
                      </div>
                      <div className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-white/35">
                        {fmt(iv.paidAt)}
                        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                    <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-white/55">
                      {iv.subscriptionType}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 ${
                        iv.showAiWording === false
                          ? 'bg-amber-500/12 border-amber-500/30 text-amber-300'
                          : 'bg-white/5 border-white/10 text-white/50'
                      }`}
                    >
                      {iv.showAiWording == null
                        ? 'AI 字眼：未选择'
                        : iv.showAiWording
                          ? 'AI 字眼：展示'
                          : 'AI 字眼：不展示'}
                    </span>
                    {iv.email ? (
                      <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-white/45 inline-flex items-center gap-1">
                        <Mail className="w-3 h-3" /> 有邮箱
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-500/10 border border-red-500/25 px-2 py-0.5 text-red-300 inline-flex items-center gap-1">
                        <MailWarning className="w-3 h-3" /> 无邮箱
                      </span>
                    )}
                  </div>
                </button>

                {expanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/8">
                    <dl className="text-[13px] divide-y divide-white/5">
                      {(
                        [
                          ['抬头', iv.title],
                          ['税号', iv.taxNumber],
                          ['地址', iv.address],
                          ['电话', iv.phone],
                          ['开户行', iv.bankName],
                          ['银行账号', iv.bankAccount],
                          ['接收邮箱', iv.email],
                          ['项目', iv.subscriptionType],
                          ['订阅账户', iv.claudeAccount],
                        ] as [string, string | null][]
                      ).map(([k, v]) => (
                        <div key={k} className="flex items-start gap-3 py-2">
                          <dt className="w-20 shrink-0 text-white/40 text-[12px]">{k}</dt>
                          <dd className="flex-1 min-w-0 break-all text-white/85">{v || '—'}</dd>
                          {v && (
                            <button
                              onClick={() => copy(`${iv.id}-${k}`, v)}
                              aria-label={`复制${k}`}
                              className="shrink-0 w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center active:bg-white/10"
                            >
                              {copied === `${iv.id}-${k}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-white/40" />
                              )}
                            </button>
                          )}
                        </div>
                      ))}
                      <div className="flex items-center gap-3 py-2">
                        <dt className="w-20 shrink-0 text-white/40 text-[12px]">金额</dt>
                        <dd className="flex-1 text-white/85 tabular-nums">
                          售价 {money(iv.sellingPrice)} · 税费 {money(iv.taxFee)} ·{' '}
                          <b className="text-amber-300">开票 {money(iv.invoiceAmount)}</b>
                        </dd>
                      </div>
                    </dl>

                    <button
                      onClick={() => markIssued(iv)}
                      disabled={busy === iv.id}
                      className="mt-3 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold text-[15px] disabled:opacity-50 active:scale-[0.99] transition-transform flex items-center justify-center gap-2"
                    >
                      {busy === iv.id ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      开票完成
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}

        {issued.length > 0 && (
          <section className="pt-4">
            <h2 className="text-[12px] text-white/35 px-1 mb-2">最近已开具</h2>
            <div className="rounded-2xl bg-white/[0.02] border border-white/8 divide-y divide-white/5">
              {issued.map((r) => (
                <div key={r.invoiceNo} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[12px]">
                  <div className="min-w-0">
                    <div className="text-white/60 truncate">{r.title || '—'}</div>
                    <div className="font-mono text-white/25 text-[10px] truncate">{r.invoiceNo}</div>
                  </div>
                  <div className="shrink-0 text-right text-white/40">
                    <div className="tabular-nums">{money(r.invoiceAmount)}</div>
                    <div className="text-[10px] text-white/25">{fmt(r.issuedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <p className="pt-4 pb-8 text-center text-[11px] text-white/20 leading-relaxed">
          本页含客户抬头与税号，请勿转发链接。链接 3 天后自动失效。
        </p>
      </main>
    </div>
  )
}
