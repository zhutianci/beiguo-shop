'use client'

/**
 * 复制按钮（Skill 库的安装命令，2026-10-10）。命令文字本身由父级服务端组件渲染在 HTML 里（爬虫、没开 JS 的人都看得到、选得中），
 * 这里只负责「点一下复制」这一个交互：成功后按钮短暂变成「已复制」，不弹窗。
 * 首帧与服务端输出完全一致（没有只在客户端才有的初始状态），不会有水合差异。
 */
import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

export function CopyButton({ text, label = '复制', size = 'sm', selectId }: { text: string; label?: string; size?: 'sm' | 'md'; /** 复制不了时选中这个元素里的文字，让人自己按 Ctrl+C */ selectId?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    let ok = false
    try {
      await navigator.clipboard.writeText(text)
      ok = true
    } catch {
      // 非 https（本地用 IP 访问）/ 老浏览器：退回隐藏文本框 + execCommand
      try {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.top = '-1000px'
        document.body.appendChild(ta)
        ta.select()
        ok = document.execCommand('copy')
        document.body.removeChild(ta)
      } catch {
        ok = false
      }
    }
    if (!ok) {
      // 浏览器不给写剪贴板（内嵌网页、权限被拒）：选中命令文字，至少能手动复制（同提示词面板的做法）
      const el = selectId ? document.getElementById(selectId) : null
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
  }

  const cls =
    size === 'md'
      ? 'h-9 gap-1.5 px-3.5 text-[13px]'
      : 'h-7 gap-1 px-2.5 text-xs'
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`${label}：${text.length > 60 ? `${text.slice(0, 60)}…` : text}`}
      className={`inline-flex shrink-0 items-center rounded-full border font-medium transition-colors duration-200 ${cls} ${
        copied ? 'border-emerald-300/40 bg-emerald-300/10 text-emerald-200' : 'border-white/15 text-white/75 hover:border-white/30 hover:text-white'
      }`}
    >
      {copied ? <Check className={size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} /> : <Copy className={size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />}
      <span aria-live="polite">{copied ? '已复制' : label}</span>
    </button>
  )
}
