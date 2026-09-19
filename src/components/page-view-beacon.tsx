'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getAnonId } from '@/lib/forum-client'

/**
 * 站级浏览上报。挂在 (shop)/layout.tsx 上，前台每个页面都会跑。
 *
 * 【为什么停留 3 秒才报】这是整套统计能不能用的关键，不是性能优化：
 * 爬虫不执行 JS，所以「停留 3 秒 + beacon」把 Googlebot、各种扫描器
 * 和链接预取全挡在外面了。如果改成在 middleware 里数请求，
 * 记下来的一大半是机器人——数字更好看，但没有任何决策能建立在那种数字上。
 * 顺带也挡掉了「点进来一眼就退」的那一类，那本来也不该算一次有效浏览。
 *
 * 【为什么监听 pathname 而不是只跑一次】App Router 的路由切换不重新挂载 layout，
 * 只跑一次的话整个 SPA 会话里只会记到第一个页面。依赖数组里放 pathname，
 * 每次路由变化都重新计时、重新上报。
 *
 * 【卸载时清掉定时器】用户 3 秒内又跳走了，这一页不该计数。
 * 不清的话会在下一个页面上报出上一个页面的路径。
 *
 * 【referrer 只在会话第一个页面有意义】站内跳转时 document.referrer 是上一个站内页面，
 * 服务端会把它归成 internal，不会污染来源统计。所以这里原样传，不做判断。
 */
export function PageViewBeacon() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    const timer = setTimeout(() => {
      try {
        const payload = JSON.stringify({
          p: pathname,
          r: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
          k: getAnonId() || undefined,
        })
        if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
          navigator.sendBeacon('/api/track/view', new Blob([payload], { type: 'application/json' }))
          return
        }
        // 少数内核没有 sendBeacon，退回 keepalive fetch（同 lib/news/share.ts 的处理）
        fetch('/api/track/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {})
      } catch {
        // 埋点失败只影响统计精度，绝不向用户抛错
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [pathname])

  return null
}
