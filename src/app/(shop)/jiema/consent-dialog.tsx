'use client'

import { useEffect, useRef, useState } from 'react'
import { X, ShieldAlert, Scale, FileText, ChevronRight, ExternalLink } from 'lucide-react'
import {
  CONSENT_CHECKBOX,
  CONSENT_TITLE,
  GIST_LABEL,
  GIST_NOTE,
  JIEMA_DISCLAIMER,
  JIEMA_TERMS_SECTIONS,
  LEGAL_ARTICLES,
  LEGAL_NOTE,
  STRONG_NOTE,
  TERMS_MISC,
  articleLabel,
  isStrong,
  itemText,
  type TermsItem,
} from '@/lib/terms/jiema-legal'
import { JIEMA_TERMS, JIEMA_TERMS_PATH, JIEMA_TERMS_STRONG, JIEMA_TERMS_TITLE, JIEMA_TERMS_VERSION, WALLET_TERMS_TITLE, WALLET_TERMS_VERSION } from '@/lib/terms/jiema-wallet'
import { cn } from '@/lib/utils'

/**
 * 付款前弹窗「下单须知与免责声明」（docs/短信接码-设计.md §1.8、§8.6；站长 2026-09-30 需求）。
 *
 * 确认面板点「去支付 / 确认支付」→ 先弹这里（**每一单都弹**，三种付款方式都走这一步）；勾选
 * 「我已阅读并同意上述条款，承诺不将本服务用于任何违法犯罪活动，并自行承担使用后果」之后「同意并下单」才可点；取消 = 不下单。
 * 每次打开都是新挂载的组件：勾选状态从「未勾」开始，不记住上一单。
 *
 * 【限高与滚动】（09-24 开票弹窗事故的教训）卡片最大高度 min(100dvh − 16px, 880px)，标题与底栏（勾选 + 两个按钮）钉住，
 * 中间免责声明与法条 overflow-y:auto；手机是贴底的整宽抽屉，桌面居中。**不支持 dvh 的浏览器**（iOS 15.4 以下、Chromium 108 以下）会丢掉整条
 * 内联 max-height，所以 class 里另有 100vh 的兜底（内联样式在支持时覆盖它），否则卡片长到内容全高、标题和免责声明被推出屏幕。
 * 法条逐条 <details> 折叠：折叠时显示「要点（非原文）」（斜体灰字，和原文区分开），展开是条文原文、版本与官方来源。
 * 【醒目提示】红框「免责声明」不折叠、最后一条是重点条款提示；《短信接码服务条款》全文里免除或者减轻平台责任、加重你的责任、
 * 限制你的权利的条款加粗标色（TermsItem.strong / JIEMA_TERMS_STRONG，与 /jiema/terms 同一口径；民法典第四百九十六条第二款）。
 * 【正文来源】全部是 lib/terms 的代码常量（与 /jiema/terms 条款页同一份），版本号 JIEMA_TERMS_VERSION / WALLET_TERMS_VERSION 随提交一起送到服务端。
 */
export function ConsentDialog(p: {
  /** 《余额与充值规则》按「余额能付接码」取的条（walletTermsFor） */
  walletLines: readonly string[]
  /** 本人上一张接码单之后条款升过版（顶部提示「条款已更新」） */
  updated: boolean
  /** 本单摘要（服务 · 国家/地区 · 付款方式与金额），写在按钮上方，提醒买家同意的是哪一单 */
  summary: string
  onCancel: () => void
  onConfirm: () => void
}) {
  const [checked, setChecked] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    boxRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') p.onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="jiema-consent-title">
      <button className="absolute inset-0 bg-black/75" aria-label="取消" onClick={p.onCancel} />
      <div
        ref={boxRef}
        tabIndex={-1}
        className="relative flex max-h-[min(calc(100vh_-_16px),880px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0b0b12] shadow-2xl outline-none sm:rounded-3xl"
        style={{ maxHeight: 'min(calc(100dvh - 16px), 880px)' }}
      >
        {/* 标题（钉住） */}
        <div className="border-b border-white/10 px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="jiema-consent-title" className="flex items-center gap-2 text-base font-semibold text-white">
              <ShieldAlert className="h-5 w-5 shrink-0 text-amber-300" />
              {CONSENT_TITLE}
            </h2>
            <button onClick={p.onCancel} aria-label="关闭" className="rounded-full p-1 text-white/60 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/75">
            下单即表示你已阅读并同意
            <a href={JIEMA_TERMS_PATH} target="_blank" rel="noopener" className="mx-0.5 text-cyan-300 hover:underline">
              《{JIEMA_TERMS_TITLE}》
            </a>
            及《{WALLET_TERMS_TITLE}》
            <span className="ml-1 text-white/40">
              （版本 {JIEMA_TERMS_VERSION} / {WALLET_TERMS_VERSION}）
            </span>
          </p>
          {p.updated && <p className="mt-1.5 inline-block rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-200">条款已更新，请重新阅读</p>}
        </div>

        {/* 正文（限高滚动） */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 text-[13px] leading-relaxed">
          <section aria-labelledby="jiema-consent-disclaimer" className="rounded-2xl border border-rose-400/30 bg-rose-500/[0.07] p-4">
            <h3 id="jiema-consent-disclaimer" className="mb-2 font-semibold text-rose-200">
              免责声明（请逐条阅读）
            </h3>
            <ol className="list-decimal space-y-1.5 pl-5 text-white/85">
              {JIEMA_DISCLAIMER.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="jiema-consent-laws">
            <h3 id="jiema-consent-laws" className="mb-1 flex items-center gap-1.5 font-semibold text-white/90">
              <Scale className="h-4 w-4 text-cyan-300" />
              相关法律条文
            </h3>
            <p className="mb-2 text-xs text-white/45">
              {LEGAL_NOTE}
              {GIST_NOTE}
            </p>
            <ul className="space-y-1.5">
              {LEGAL_ARTICLES.map((a) => (
                <li key={a.id}>
                  <details className="group rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <summary className="flex cursor-pointer list-none items-start gap-1.5 marker:hidden">
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40 transition-transform group-open:rotate-90" />
                      <span className="min-w-0">
                        <span className="font-medium text-white/85">
                          {articleLabel(a)}
                          <span className="text-white/50"> · {a.topic}</span>
                        </span>
                        <span className="mt-0.5 block text-xs italic text-white/45">
                          <span className="not-italic text-white/35">{GIST_LABEL}</span>
                          {a.gist}
                        </span>
                      </span>
                    </summary>
                    <div className="mt-2 space-y-1 border-t border-white/10 pt-2 pl-5 text-xs text-white/70">
                      <p className="text-[11px] text-white/40">条文原文：</p>
                      {a.text.map((x) => (
                        <p key={x}>{x}</p>
                      ))}
                      <p className="pt-1 text-[11px] text-white/40">
                        {a.version}。来源：
                        <a href={a.source.url} target="_blank" rel="noopener noreferrer" className="break-all text-cyan-300/80 hover:underline">
                          {a.source.name}
                        </a>
                        {a.current && (
                          <>
                            ；现行文本：
                            <a href={a.current.url} target="_blank" rel="noopener noreferrer" className="break-all text-cyan-300/80 hover:underline">
                              {a.current.name}
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-1.5">
            <details className="group rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 font-medium text-white/85 marker:hidden">
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/40 transition-transform group-open:rotate-90" />
                <FileText className="h-3.5 w-3.5 text-white/50" />《{JIEMA_TERMS_TITLE}》全文
              </summary>
              <div className="mt-2 space-y-2 border-t border-white/10 pt-2 text-xs text-white/65">
                <p className="font-medium text-amber-200">{STRONG_NOTE}</p>
                <p className="font-medium text-white/80">一、服务与退款</p>
                <ol className="list-decimal space-y-1 pl-5">
                  {JIEMA_TERMS.map((t, i) => (
                    <li key={t}>{JIEMA_TERMS_STRONG.includes(i) ? <Strong>{t}</Strong> : t}</li>
                  ))}
                </ol>
                {JIEMA_TERMS_SECTIONS.map((s) => (
                  <div key={s.id} className="space-y-1">
                    <p className="font-medium text-white/80">{s.heading}</p>
                    {s.lead && <p>{s.lead}</p>}
                    {s.items.map((t) => termsItem(t))}
                  </div>
                ))}
                <p className="font-medium text-white/80">七、相关法律条文（见上）</p>
                <p className="font-medium text-white/80">八、其他</p>
                {TERMS_MISC.map((t) => termsItem(t))}
                <a href={JIEMA_TERMS_PATH} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-cyan-300/90 hover:underline">
                  在新页面打开条款全文
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </details>
            <details className="group rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 font-medium text-white/85 marker:hidden">
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/40 transition-transform group-open:rotate-90" />
                <FileText className="h-3.5 w-3.5 text-white/50" />《{WALLET_TERMS_TITLE}》
              </summary>
              <ol className="mt-2 list-decimal space-y-1 border-t border-white/10 pt-2 pl-5 text-xs text-white/65">
                {p.walletLines.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ol>
            </details>
          </section>
        </div>

        {/* 底栏（钉住）：勾选 + 本单摘要 + 两个按钮 */}
        <div className="border-t border-white/10 bg-[#0b0b12] px-5 py-3">
          <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed text-white/85">
            <input type="checkbox" className="mt-1 h-4 w-4 shrink-0" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
            <span>{CONSENT_CHECKBOX}</span>
          </label>
          {/* 两行封顶：服务名很长时也不把末尾的付款方式与金额截掉 */}
          <p className="mt-1.5 line-clamp-2 break-words text-[11px] text-white/45" title={p.summary}>
            本单：{p.summary}
          </p>
          <div className="mt-2.5 flex gap-2">
            <button onClick={p.onCancel} className="flex-1 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/75 hover:bg-white/10">
              取消
            </button>
            <button
              onClick={() => checked && p.onConfirm()}
              disabled={!checked}
              title={checked ? undefined : '请先勾选同意'}
              className={cn(
                'flex-[2] rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-medium',
                !checked && 'cursor-not-allowed opacity-40',
              )}
            >
              同意并下单
            </button>
          </div>
          {!checked && <p className="mt-1.5 text-center text-[11px] text-white/40">勾选上方同意后才能下单</p>}
        </div>
      </div>
    </div>
  )
}

/** 加粗标色：免除或者减轻平台责任、加重你的责任、限制你的权利的条款（与 /jiema/terms 同一口径） */
function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-amber-200">{children}</strong>
}

/** 一条条款（与 /jiema/terms 同一写法：普通函数，strong 条款加粗标色） */
function termsItem(it: TermsItem) {
  return <p key={itemText(it)}>{isStrong(it) ? <Strong>{itemText(it)}</Strong> : itemText(it)}</p>
}
