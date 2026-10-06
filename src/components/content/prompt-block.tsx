'use client'

/**
 * 提示词块（设计 §5.1 第 2–3 点）：提示词全文（[变量] 高亮）+【复制】+ 去生成的入口。
 *
 * 文字本身在服务端 HTML 里（客户端组件也会被服务端渲染一次），复制按钮是唯一的交互。
 * 复制计数走 POST /api/content/[id]/copy，按访客每天去重（content_events 唯一约束）；
 * 计数失败不影响复制本身。
 */
import { useState } from 'react'
import Link from 'next/link'
import { Check, Copy, ImageIcon, Ratio, Sparkles } from 'lucide-react'

export interface PromptBlockProps {
  postId: number
  prompt: string
  negativePrompt: string | null
  modelLabel: string | null
  modelName: string | null
  aspectRatio: string | null
  needsRefImage: boolean
  useCase: string
  variables: string[]
  copyCount: number
  cta: { href: string; label: string } | null
}

/** 把 [变量] 包成高亮的 <mark>；只做字符串切分，不碰 HTML（React 负责转义） */
function highlight(prompt: string) {
  const parts = prompt.split(/(\[[^[\]\n]{1,20}\])/g)
  return parts.map((part, i) =>
    /^\[[^[\]\n]{1,20}\]$/.test(part) ? (
      <mark key={i} className="rounded bg-purple-500/25 px-0.5 text-purple-200">{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

export function PromptBlock(p: PromptBlockProps) {
  const [copied, setCopied] = useState(false)
  const [count, setCount] = useState(p.copyCount)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(p.prompt)
    } catch {
      // 老浏览器 / 非 https：退回到选中文本让用户手动复制
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
    setTimeout(() => setCopied(false), 2000)
    fetch(`/api/content/${p.postId}/copy`, { method: 'POST' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && typeof d.data?.copyCount === 'number') setCount(d.data.copyCount)
      })
      .catch(() => {})
  }

  return (
    <section aria-label="提示词" className="mb-6 space-y-3">
      <p className="text-white/70 lg:text-[16px]">{p.useCase}</p>

      <div className="flex flex-wrap gap-2 text-xs">
        {p.modelName && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-white/75">
            <Sparkles className="w-3.5 h-3.5" /> {p.modelName}
            {p.modelLabel ? ` · ${p.modelLabel}` : ''}
          </span>
        )}
        {p.aspectRatio && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-white/75">
            <Ratio className="w-3.5 h-3.5" /> {p.aspectRatio}
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-white/75">
          <ImageIcon className="w-3.5 h-3.5" /> {p.needsRefImage ? '需要上传参考图' : '不需要参考图'}
        </span>
      </div>

      <div className="relative rounded-2xl border border-white/10 bg-black/40">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2 text-xs text-white/45">
          <span>提示词{p.variables.length ? `（高亮处换成你自己的内容）` : ''}</span>
          <span>已被复制 {count} 次</span>
        </div>
        <pre
          id={`prompt-${p.postId}`}
          className="whitespace-pre-wrap break-words px-4 py-3 font-mono text-[13.5px] leading-relaxed text-white/90 lg:text-[14.5px]"
        >
          {highlight(p.prompt)}
        </pre>
      </div>

      {p.variables.length > 0 && (
        <p className="text-xs text-white/45">可替换：{p.variables.map((v) => `[${v}]`).join('、')}</p>
      )}

      {p.negativePrompt && (
        <details className="text-sm text-white/60">
          <summary className="cursor-pointer text-white/50">负面提示词</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-black/30 px-3 py-2 font-mono text-[13px]">{p.negativePrompt}</pre>
        </details>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          onClick={copy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-semibold"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? '已复制' : '复制提示词'}
        </button>
        {p.cta && (
          <Link href={p.cta.href} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass text-sm text-white/80 hover:text-white">
            {p.cta.label}
          </Link>
        )}
      </div>
    </section>
  )
}
