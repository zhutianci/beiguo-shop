'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/*
 * 【路由切换进度条（性能优化 2026-10-07）】
 * 前台页面全是按请求渲染（根布局 force-dynamic），而落地页、商品页、大事记这些要被收录的页面刻意不加 loading.tsx
 * （加了会把页面正文放进流式的隐藏块里，不执行 JS 的爬虫看到的是 <div hidden>）。于是点一个站内链接，
 * 在服务端返回之前页面一动不动，买家会以为没点上、再点一次。
 *
 * 这里只在客户端给一个反馈：点下站内链接 150ms 后还没切过去，就在页面最顶上出现一条细进度条，新页面一出来就走完并淡出。
 *  · 不改任何页面的服务端 HTML（服务端渲染恒为一个不可见的空条），不影响收录与首帧；
 *  · 只用 transform / opacity（合成线程），一层；prefers-reduced-motion 下不做过渡，只显示一条静止的条；
 *  · 判定「站内跳转」：同源、左键无修饰键、没有 target / download、不是只改 #锚点、不是当前地址；
 *    其余（新标签、外链、mailto）一律不管。点击被别的处理器取消、迟迟没有跳转时 8 秒后自动收起。
 *  · 完成的信号是 pathname / search 变化（新页面已经提交渲染），与 next/link、router.push 都无关，不用改写 history。
 */
type Phase = 'idle' | 'run' | 'done'

function RouteProgressInner() {
  const pathname = usePathname()
  const search = useSearchParams()
  const [phase, setPhase] = useState<Phase>('idle')
  const timers = useRef<number[]>([])

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }

  // 新页面提交渲染：正在跑就走完、淡出
  const key = `${pathname}?${search?.toString() ?? ''}`
  const lastKey = useRef(key)
  useEffect(() => {
    if (lastKey.current === key) return
    lastKey.current = key
    clear()
    setPhase((p) => (p === 'idle' ? 'idle' : 'done'))
    timers.current.push(window.setTimeout(() => setPhase('idle'), 400))
  }, [key])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a')
      if (!a || !a.href || a.hasAttribute('download')) return
      const target = a.getAttribute('target')
      if (target && target !== '_self') return
      let url: URL
      try {
        url = new URL(a.href, location.href)
      } catch {
        return
      }
      if (url.origin !== location.origin) return
      // 只改锚点、或者就是当前地址：不会有服务端往返
      if (url.pathname === location.pathname && url.search === location.search) return
      clear()
      timers.current.push(
        window.setTimeout(() => setPhase('run'), 150),
        window.setTimeout(() => setPhase('idle'), 8000),
      )
    }
    // 捕获阶段：next/link 会在冒泡阶段 preventDefault，等到冒泡就分不清是不是站内跳转了
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      clear()
    }
  }, [])

  return <div aria-hidden="true" className="route-progress" data-phase={phase} />
}

export function RouteProgress() {
  return (
    <Suspense fallback={null}>
      <RouteProgressInner />
    </Suspense>
  )
}
