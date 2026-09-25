'use client'

/**
 * 编辑器内的对话框：保存冲突、关闭确认。渲染在编辑器覆盖层内部（不用 portal，留在 .admin-area 里）。
 */
import { useEffect, useRef } from 'react'
import { CircleAlert, TriangleAlert } from 'lucide-react'
import type { CampaignDetail } from '@/lib/marketing/types'
import { Button } from '@/components/ui/button'
import { bjDateTime } from '@/lib/marketing/time'

function Modal({ children, onEscape, labelledBy }: { children: React.ReactNode; onEscape?: () => void; labelledBy: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // 打开时把焦点移进对话框，Esc 关闭（若允许）
    const first = ref.current?.querySelector<HTMLElement>('button')
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.stopPropagation()
        onEscape()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onEscape])
  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-[1px]">
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelledBy} className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        {children}
      </div>
    </div>
  )
}

export function ConflictDialog({
  server,
  onUseServer,
  onOverwrite,
}: {
  server: CampaignDetail
  onUseServer: () => void
  onOverwrite: () => void
}) {
  let when = ''
  try {
    when = bjDateTime(new Date(server.updatedAt))
  } catch {
    when = ''
  }
  return (
    <Modal labelledBy="mkt-conflict-title">
      <div className="px-6 pb-2 pt-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <TriangleAlert className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 id="mkt-conflict-title" className="text-base font-semibold text-gray-900">
              内容已在别处被修改
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-gray-600">
              这个活动在另一个标签页或被另一位管理员保存过{when ? `（${when}）` : ''}，和你正在编辑的版本不一致。请选择保留哪一份：
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>
                <span className="font-medium text-gray-800">使用服务器版本</span>：丢掉你这边未保存的修改（可按 Ctrl+Z 找回）
              </li>
              <li>
                <span className="font-medium text-gray-800">用我的覆盖</span>：以你现在的内容覆盖服务器上的版本
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 px-6 pb-5 pt-4">
        <Button variant="outline" size="sm" onClick={onUseServer}>
          使用服务器版本
        </Button>
        <Button variant="primary" size="sm" onClick={onOverwrite}>
          用我的覆盖
        </Button>
      </div>
    </Modal>
  )
}

export function ConfirmDialog({
  title,
  message,
  confirmText,
  cancelText = '继续编辑',
  danger,
  onConfirm,
  onCancel,
}: {
  title: string
  message: React.ReactNode
  confirmText: string
  cancelText?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal labelledBy="mkt-confirm-title" onEscape={onCancel}>
      <div className="px-6 pb-2 pt-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
            <CircleAlert className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 id="mkt-confirm-title" className="text-base font-semibold text-gray-900">
              {title}
            </h3>
            <div className="mt-1.5 text-sm leading-6 text-gray-600">{message}</div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 px-6 pb-5 pt-4">
        <Button variant="primary" size="sm" onClick={onCancel}>
          {cancelText}
        </Button>
        <Button variant={danger ? 'danger' : 'outline'} size="sm" onClick={onConfirm}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}
