'use client'

import { useEffect } from 'react'
import { markReadLocal } from '@/lib/news/read-state'
import { reportNewsView } from '@/lib/news/share'

/**
 * 详情页唯一必须在客户端跑的东西。页面主体是 Server Component，
 * 正文渲染刻意不交给客户端——正文要能被搜索引擎与微信直接读到。
 *
 * 停留 3 秒后再上报：爬虫不执行 JS，天然被排除；秒退也不计数。
 * 具体的上报口径（匿名 id 走 body、sendBeacon 兜底 keepalive fetch）在 lib/news/share.ts，
 * 这里不另写一份。
 *
 * 顺带把本条标成已读，回到时间流时卡片会降权——已读集合与列表页共用 read-state.ts。
 */
export function ViewBeacon({ eventId }: { eventId: number }) {
  useEffect(() => {
    markReadLocal(eventId)
    const timer = setTimeout(() => reportNewsView(eventId), 3000)
    return () => clearTimeout(timer)
  }, [eventId])
  return null
}
