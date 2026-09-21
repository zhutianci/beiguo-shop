'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * 数字滚动。
 *
 * 【初始值必须是 end，不能是 0】这一点是被线上数据打脸之后改的：
 * 原来写的是 useState(0) —— 客户端组件同样会被服务端渲染，于是首页服务端 HTML 里
 * 三个信任数字全都是 `0 + 服务用户`、`0.0 % 成功率`、`0 min`。
 * 而 2026-09-21 的日志显示 **ChatGPT-User 抓了首页 29 次**
 * （那个 UA 的含义是「真实用户此刻在 ChatGPT 里问到本站，ChatGPT 实时去抓」）。
 * 也就是说，有 29 次真人问起这个站，模型读到的是一个自称「0 个用户、0% 成功率」的网站。
 * 真人首屏也会闪一下 0。
 *
 * 【那动画怎么办】挂载时先看这个元素在不在视口里：
 *   · 已经在视口里 → 保持真值不动。此时做动画只会让用户看见数字从真值闪回 0，
 *     比没有动画更糟。
 *   · 还在屏幕外 → 归零，等滚到可视区再滚上去。归零发生在看不见的地方，没有闪烁。
 * 另外尊重 prefers-reduced-motion：用户关了动效就直接显示真值。
 */

interface CountUpProps {
  end: number
  duration?: number
  suffix?: string
  prefix?: string
  decimals?: number
}

export function CountUp({
  end,
  duration = 2000,
  suffix = '',
  prefix = '',
  decimals = 0,
}: CountUpProps) {
  // 服务端与首帧直接是真值，爬虫读到的就是真值
  const [count, setCount] = useState(end)
  const ref = useRef<HTMLSpanElement>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    // 已经看得见就别动它——从真值闪回 0 比不做动画难看得多
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) return

    setCount(0)

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !startedRef.current) {
          startedRef.current = true
          animate()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)

    function animate() {
      const startTime = performance.now()

      function step(now: number) {
        const progress = Math.min((now - startTime) / duration, 1)
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        setCount(eased * end)

        if (progress < 1) {
          requestAnimationFrame(step)
        } else {
          setCount(end)
        }
      }

      requestAnimationFrame(step)
    }

    return () => observer.disconnect()
  }, [end, duration])

  return (
    <span ref={ref}>
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  )
}
