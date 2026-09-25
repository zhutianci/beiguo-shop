'use client'

import { Info } from 'lucide-react'
import {
  CAMPAIGN_STATUS_LABEL,
  MESSAGE_STATUS_LABEL,
  TOPIC_LABEL,
  type CampaignStatus,
  type MessageStatus,
  type Topic,
} from '@/lib/marketing/types'
import { CAMPAIGN_STATUS_CLS, MESSAGE_STATUS_CLS } from './labels'
import { cn } from '@/lib/utils'

/**
 * 活动状态徽章。statusNote（暂停原因、自动暂停说明）挂在 title 上悬停可见，并显示一个小图标提示「这里有说明」——
 * 自动暂停时站长最想知道的就是「为什么停了」，不能让他点进详情才看到。
 */
export function CampaignStatusBadge({
  status,
  note,
  className,
}: {
  status: CampaignStatus
  note?: string | null
  className?: string
}) {
  return (
    <span
      title={note || undefined}
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded border px-2 py-0.5 text-xs font-medium',
        CAMPAIGN_STATUS_CLS[status] || 'border-gray-200 bg-gray-100 text-gray-600',
        className
      )}
    >
      {status === 'SENDING' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />}
      {CAMPAIGN_STATUS_LABEL[status] || status}
      {note && <Info className="h-3 w-3 opacity-70" />}
    </span>
  )
}

export function MessageStatusBadge({ status }: { status: MessageStatus }) {
  return (
    <span
      className={cn(
        'inline-flex whitespace-nowrap rounded px-1.5 py-0.5 text-xs',
        MESSAGE_STATUS_CLS[status] || 'bg-gray-100 text-gray-600'
      )}
    >
      {MESSAGE_STATUS_LABEL[status] || status}
    </span>
  )
}

const TOPIC_CLS: Record<Topic, string> = {
  PROMO: 'bg-pink-50 text-pink-700',
  PRODUCT: 'bg-sky-50 text-sky-700',
  NEWS: 'bg-teal-50 text-teal-700',
}

export function TopicBadge({ topic }: { topic: Topic }) {
  return (
    <span className={cn('inline-flex whitespace-nowrap rounded px-1.5 py-0.5 text-xs', TOPIC_CLS[topic] || 'bg-gray-100')}>
      {TOPIC_LABEL[topic] || topic}
    </span>
  )
}
