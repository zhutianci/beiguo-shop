'use client'

import { useMemo } from 'react'
import { Check, LayoutTemplate } from 'lucide-react'
import type { TemplateItem } from '@/lib/marketing/types'
import { getPreset } from '@/lib/marketing/presets'
import { cn } from '@/lib/utils'
import { PresetThumb } from './content-preview'
import { TopicBadge } from './status-badge'
import { fmtTime } from './api'

export const PRESET_PREFIX = 'preset:'
export const TEMPLATE_PREFIX = 'tpl:'

/** TemplateItem.key → 新建活动接口的参数（preset 或 templateId） */
export function templateCreateBody(key: string): { preset: string } | { templateId: number } | null {
  if (key.startsWith(PRESET_PREFIX)) return { preset: key.slice(PRESET_PREFIX.length) }
  if (key.startsWith(TEMPLATE_PREFIX)) {
    const id = Number(key.slice(TEMPLATE_PREFIX.length))
    return Number.isInteger(id) && id > 0 ? { templateId: id } : null
  }
  return null
}

export function templateIdOf(key: string): number | null {
  const b = templateCreateBody(key)
  return b && 'templateId' in b ? b.templateId : null
}

/**
 * 模板卡片：内置模板带真实缩略图（浏览器端同构渲染），自存模板没有文档数据（列表接口只给元信息），用占位图。
 */
export function TemplateCard({
  item,
  selected,
  onClick,
  onDoubleClick,
  footer,
}: {
  item: TemplateItem
  selected?: boolean
  onClick?: () => void
  onDoubleClick?: () => void
  footer?: React.ReactNode
}) {
  const preset = useMemo(() => (item.key.startsWith(PRESET_PREFIX) ? getPreset(item.key.slice(PRESET_PREFIX.length)) : null), [item.key])
  const clickable = !!onClick
  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={(e) => {
        if (clickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick?.()
        }
      }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border bg-white text-left transition-shadow',
        clickable && 'cursor-pointer hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        selected ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-200'
      )}
    >
      <div className="flex justify-center bg-gray-100">
        {preset ? (
          <PresetThumb preset={preset} scale={0.38} height={220} />
        ) : (
          <div className="flex h-[220px] w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-sky-50 to-violet-50 text-gray-400">
            <LayoutTemplate className="h-8 w-8" />
            <span className="px-3 text-center text-xs">{item.builtIn ? item.name : '我保存的模板'}</span>
          </div>
        )}
      </div>
      {selected && (
        <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-white shadow">
          <Check className="h-4 w-4" />
        </span>
      )}
      <div className="flex flex-1 flex-col gap-1 border-t border-gray-100 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-sm font-medium text-gray-900" title={item.name}>
            {item.name}
          </span>
          <TopicBadge topic={item.topic} />
        </div>
        {item.description && <p className="line-clamp-2 text-xs leading-relaxed text-gray-500">{item.description}</p>}
        {!item.builtIn && item.updatedAt && <p className="text-[11px] text-gray-400">更新于 {fmtTime(item.updatedAt)}</p>}
        {footer && <div className="mt-auto pt-1.5">{footer}</div>}
      </div>
    </div>
  )
}
