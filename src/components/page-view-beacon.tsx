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
 */
export function PageViewBeacon() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    const timer = setTimeout(() => {
      try {
        const payload = JSON.stringify({
          p: pathname,
          r: entryReferrer(),
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

/* ---------------------------------------------------------------- */

const ENTRY_REF_KEY = 'bg_entry_ref'

/** 本次文档加载内只解析一次，后面每个软跳转都复用同一个值 */
let resolved: { v: string | undefined } | null = null

/**
 * 本次访问的**入口** referrer。
 *
 * 【为什么不能直接用 document.referrer】这是上线当天就踩到的坑，而且踩得很隐蔽。
 * App Router 的路由切换走的是 history.pushState，**不会更新 document.referrer**——
 * 它只在真正的文档加载时才变。所以原来「站内跳转时 document.referrer 是上一个站内页面、
 * 服务端会归成 internal」这个假设是错的：一个人从 ChatGPT 点进 /chongzhi 之后，
 * 在站内点了五页，五条记录的 referrer 全都还是 chatgpt.com。
 * 而同一个人如果用的是普通 <a> 整页跳转，那几条又会变成 internal。
 * 同一个动作因为链接实现方式不同而记成两种来源，这才是真正要命的地方——
 * 数据没法用，图上还完全看不出来。
 *
 * 【定成会话归因，而不是逐跳归因】统一成「这次访问是从哪进来的」，
 * 整个访问期间的每条浏览都带同一个来源。这与 GA 的口径一致，
 * 也正是运营真正要回答的问题：/chongzhi 上的人是谁带来的。
 * 逐跳归因的结果会是「八成流量来自站内跳转」，那句话没有任何用。
 *
 * 【什么时候重新开始归因】同一个标签页里再次从站外进来（document.referrer 是外站）
 * 就覆盖缓存——那是一次新的获客。站内整页跳转（referrer 是自己）和直接访问
 * 都沿用已缓存的入口来源。
 *
 * sessionStorage 被禁用（隐私模式、某些内置浏览器）时退回 document.referrer，
 * 也就是退回到旧行为：统计精度略降，但不会报错、不会丢数据。
 */
function entryReferrer(): string | undefined {
  if (resolved) return resolved.v
  const raw = typeof document !== 'undefined' ? document.referrer || '' : ''
  const fromOutside = raw !== '' && !raw.startsWith(`${location.origin}/`) && raw !== location.origin
  let v: string | undefined
  try {
    if (fromOutside) {
      sessionStorage.setItem(ENTRY_REF_KEY, raw)
      v = raw
    } else {
      const cached = sessionStorage.getItem(ENTRY_REF_KEY)
      if (cached !== null) {
        // 空串是有意义的：表示这次访问的入口就是直接访问，别再回头去看 document.referrer
        v = cached || undefined
      } else {
        sessionStorage.setItem(ENTRY_REF_KEY, raw)
        v = raw || undefined
      }
    }
  } catch {
    v = raw || undefined
  }
  resolved = { v }
  return v
}
