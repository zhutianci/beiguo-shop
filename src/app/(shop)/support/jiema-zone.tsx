'use client'

import { createContext, useContext, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ClipboardList, MessageCircle, MessageSquareText, Wallet } from 'lucide-react'
import type { JiemaSupportData } from '@/lib/jiema/support-zone'

/**
 * 客服页「短信接码」分区（#jiema；docs/短信接码-设计.md §8.3、§6.6 第 33 条）。
 *
 * 数据由 support/layout.tsx 在服务端算好（lib/jiema/support-zone.ts：只在主站、接码对全部用户开放或管理员预览时有值），
 * 经这个 context 交给页面——同一个对象也进了 layout 输出的 FAQPage 结构化数据（只在 OPEN 时），页面与结构化数据逐字一致。
 * 没有 Provider（渠道站、灰度期普通访客、以及只渲染页面组件的测试）时 context 为 null：分区不渲染，页面与改造前逐字相同。
 */
const Ctx = createContext<JiemaSupportData | null>(null)

export function JiemaSupportProvider({ value, children }: { value: JiemaSupportData | null; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useJiemaSupport(): JiemaSupportData | null {
  return useContext(Ctx)
}

export function JiemaSupportSection({ data, onContact }: { data: JiemaSupportData; onContact: () => void }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section id="jiema" aria-labelledby="jiema-support-title" className="mb-20 scroll-below-header">
      <h2 id="jiema-support-title" className="mb-6 flex flex-wrap items-center gap-3 text-2xl font-bold lg:text-3xl">
        <MessageSquareText className="h-6 w-6 text-cyan-300" />
        短信接码
        {data.mode === 'PREVIEW' && (
          <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-normal text-amber-200">仅管理员预览：对全部用户开放后买家才看得到</span>
        )}
      </h2>
      <div className="glass rounded-2xl p-6 lg:p-7">
        <div className="mb-2 text-sm font-medium text-white/80">规则一览</div>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-white/65 lg:text-[15px]">
          {data.rules.map((r) => (
            <li key={r}>
              {r === '暂不支持开票，可联系客服开票处理' ? (
                <>
                  暂不支持开票，可
                  <button onClick={onContact} className="text-cyan-300/90 hover:underline">
                    联系客服
                  </button>
                  开票处理
                </>
              ) : (
                r
              )}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          <Link href="/jiema/records" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-white/80 hover:bg-white/10">
            <ClipboardList className="h-4 w-4" /> 我的接码记录
          </Link>
          <Link href="/wallet" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-white/80 hover:bg-white/10">
            <Wallet className="h-4 w-4" /> 我的余额
          </Link>
          <Link href="/jiema" className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 font-medium">
            <MessageSquareText className="h-4 w-4" /> 去接码
          </Link>
          <button onClick={onContact} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-white/80 hover:bg-white/10">
            <MessageCircle className="h-4 w-4" /> 联系客服
          </button>
        </div>
        {/* 条款与举报入口（2026-09-30 评审修复：条款第五节承诺依法报告，站内要有受理举报的入口；处理步骤见 docs/短信接码-设计.md §10.1） */}
        <p className="mt-4 text-xs leading-relaxed text-white/45">
          使用规则见
          <Link href="/jiema/terms" className="mx-0.5 text-cyan-300/90 hover:underline">
            《短信接码服务条款》
          </Link>
          ；发现有人利用本服务从事电信网络诈骗等违法犯罪活动，
          <Link href="/jiema/terms#report" className="mx-0.5 text-cyan-300/90 hover:underline">
            点这里举报
          </Link>
          。
        </p>
      </div>

      <h3 className="mb-4 mt-8 text-lg font-bold lg:text-xl">短信接码与余额 · 常见问题（{data.faqs.length} 条）</h3>
      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-3 lg:space-y-0">
        {data.faqs.map((f, i) => {
          const on = open === i
          return (
            <div key={f.q} className="glass overflow-hidden rounded-xl">
              <button onClick={() => setOpen(on ? null : i)} aria-expanded={on} className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.03]">
                <span className={`flex-1 font-medium lg:text-[17px] ${on ? 'text-white' : 'text-white/80'}`}>
                  {f.q}
                </span>
                <ChevronDown className={`ml-3 h-4 w-4 flex-shrink-0 text-white/40 transition-transform ${on ? 'rotate-180' : ''}`} />
              </button>
              {/* 答案常驻 DOM（收起时 hidden）：结构化数据里的问答在首屏 HTML 里就能找到对应的可见内容 */}
              <div hidden={!on} className="px-5 pb-4 text-sm leading-relaxed text-white/60 lg:text-[15px] lg:leading-[1.8]">
                {f.a}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
