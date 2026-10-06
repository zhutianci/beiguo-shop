'use client'

/**
 * 提示词面板（详情页右侧吸顶）：提示词全文（[变量] 高亮）→ 复制 → 去开通。
 *
 * 文字在服务端 HTML 里（客户端组件也会被服务端渲染一次），复制是唯一的交互。
 * 复制计数走 POST /api/content/[id]/copy（按访客每天去重），计数失败不影响复制。
 * 复制成功有一个轻量的确认态（按钮变色 + 文案），不弹窗、不打断。
 */
import { useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Check, Copy, ImageIcon, Ratio, Sparkles } from 'lucide-react'

export interface PromptPanelProps {
  postId: number
  prompt: string
  negativePrompt: string | null
  modelLabel: string | null
  modelName: string | null
  modelHref: string | null
  aspectRatio: string | null
  needsRefImage: boolean
  variables: string[]
  copyCount: number
  cta: { href: string; label: string } | null
}

function highlight(prompt: string) {
  return prompt.split(/(\[[^[\]\n]{1,20}\])/g).map((part, i) =>
    /^\[[^[\]\n]{1,20}\]$/.test(part) ? (
      <mark key={i} className="rounded-md bg-violet-400/20 px-1 text-violet-200">{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

export function PromptPanel(p: PromptPanelProps) {
  const [copied, setCopied] = useState(false)
  const [count, setCount] = useState(p.copyCount)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(p.prompt)
    } catch {
      // 非 https / 老浏览器：选中文本让用户手动复制
      const el = document.getElementById(`prompt-${p.postId}`)
      if (el) {
        const range = document.createRange()
        range.selectNodeContents(el)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
      }
      return
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
    fetch(`/api/content/${p.postId}/copy`, { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && typeof d.data?.copyCount === 'number') setCount(d.data.copyCount)
      })
      .catch(() => {})
  }

  return (
    <section aria-label="提示词" className="learn-card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.07] px-5 py-3.5 text-xs">
        {p.modelName &&
          (p.modelHref ? (
            <Link href={p.modelHref} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-white/80 hover:text-white">
              <Sparkles className="h-3.5 w-3.5" /> {p.modelName}
              {p.modelLabel ? ` · ${p.modelLabel}` : ''}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-white/80">
              <Sparkles className="h-3.5 w-3.5" /> {p.modelName}
            </span>
          ))}
        {p.aspectRatio && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-white/70">
            <Ratio className="h-3.5 w-3.5" /> {p.aspectRatio}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-white/70">
          <ImageIcon className="h-3.5 w-3.5" /> {p.needsRefImage ? '需上传参考图' : '纯文字生成'}
        </span>
      </div>

      <pre
        id={`prompt-${p.postId}`}
        className="max-h-[42vh] overflow-y-auto whitespace-pre-wrap break-words px-5 py-4 font-mono text-[13.5px] leading-[1.75] text-white/90"
      >
        {highlight(p.prompt)}
      </pre>

      {p.variables.length > 0 && (
        <p className="px-5 pb-1 text-xs text-white/40">高亮处换成你自己的内容：{p.variables.map((v) => `[${v}]`).join('、')}</p>
      )}

      {p.negativePrompt && (
        <details className="px-5 pt-2 text-sm text-white/60">
          <summary className="cursor-pointer select-none text-xs text-white/45">负面提示词</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-black/30 px-3 py-2 font-mono text-[13px]">{p.negativePrompt}</pre>
        </details>
      )}

      <div className="flex flex-col gap-2.5 p-5 pt-4">
        <button
          type="button"
          onClick={copy}
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-all duration-300 ${
            copied ? 'bg-emerald-400 text-black' : 'bg-white text-black hover:-translate-y-0.5'
          }`}
        >
          {copied ? <Check className="h-4.5 w-4.5" /> : <Copy className="h-4 w-4" />}
          {copied ? '已复制到剪贴板' : '复制提示词'}
        </button>
        {p.cta && (
          <Link
            href={p.cta.href}
            className="group inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-white/12 text-sm text-white/75 transition-colors hover:border-white/25 hover:text-white"
          >
            {p.cta.label}
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        )}
        <p className="text-center text-[11px] tabular-nums text-white/30">已被复制 {count} 次</p>
      </div>
    </section>
  )
}
