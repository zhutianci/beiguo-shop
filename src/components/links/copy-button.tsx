'use client'

import { useState } from 'react'
import { Check, Copy, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 复制按钮，带降级。
 *
 * 【为什么不能裸调 navigator.clipboard】它只在安全上下文（https / localhost）里存在，
 * 部分微信内置浏览器里也拿不到。站内已有三处复制是裸调的（contact-modal /
 * floating-contact / referral-panel），在 http 直连 IP 的场景下会静默抛异常、
 * 用户点了没反应也没提示。这个页面的核心动作就是「把本站信息复制走」，不能重蹈覆辙。
 *
 * 降级顺序：Clipboard API → 隐藏 textarea + execCommand('copy') → 明确告知失败，
 * 让用户自己长按选中（文本本来就在页面上以 font-mono 明文展示着）。
 */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* 继续走降级 */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    // 必须留在视口内且可聚焦，iOS 上 display:none / visibility:hidden 的元素选不中
    ta.style.position = 'fixed'
    ta.style.top = '0'
    ta.style.left = '0'
    ta.style.opacity = '0'
    ta.setAttribute('readonly', '')
    document.body.appendChild(ta)
    ta.select()
    ta.setSelectionRange(0, ta.value.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

export function CopyButton({
  value,
  label = '复制',
  /** 无障碍名称。一排按钮都叫「复制」时，读屏用户听不出自己要复制的是哪一条 */
  ariaLabel,
  className,
}: {
  value: string
  label?: string
  ariaLabel?: string
  className?: string
}) {
  const [state, setState] = useState<'idle' | 'done' | 'fail'>('idle')

  const onClick = async () => {
    const ok = await copyText(value)
    setState(ok ? 'done' : 'fail')
    setTimeout(() => setState('idle'), 2200)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || label}
      aria-live="polite"
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all',
        state === 'done'
          ? 'border border-green-500/30 bg-green-500/20 text-green-400'
          : state === 'fail'
            ? 'border border-red-500/30 bg-red-500/15 text-red-300'
            : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white',
        className
      )}
    >
      {state === 'done' ? (
        <>
          <Check className="h-3.5 w-3.5" /> 已复制
        </>
      ) : state === 'fail' ? (
        <>
          <X className="h-3.5 w-3.5" /> 请手动选中
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" /> {label}
        </>
      )}
    </button>
  )
}
