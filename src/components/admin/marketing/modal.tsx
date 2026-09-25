'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 营销后台的弹窗外壳：限高 90vh、正文区独立滚动、页脚按钮常驻可见。
 *
 * 【z-[60]】测试发送弹窗会从全屏编辑器（fixed inset-0 z-50）顶栏里打开，必须压在编辑器上面。
 * 【不用 portal】后台的浅色样式挂在 .admin-area 上，portal 到 body 会落进前台的暗色全局样式里（设计 7.3）。
 * 【Esc 关闭 + 点遮罩关闭】busy 时两者都不响应 —— 发送请求在路上时关掉弹窗，站长就看不到结果了。
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'max-w-lg',
  busy = false,
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  subtitle?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  width?: string
  busy?: boolean
}) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const busyRef = useRef(busy)
  busyRef.current = busy

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busyRef.current) {
        e.stopPropagation()
        closeRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        // 只认「按下就在遮罩上」：在弹窗里拖选文字、松手落到遮罩上时不应关闭
        if (e.target === e.currentTarget && !busy) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn('flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl bg-white shadow-xl', width)}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && <div className="mt-0.5 text-sm text-gray-500">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-gray-100 px-6 py-3">{footer}</div>}
      </div>
    </div>
  )
}
