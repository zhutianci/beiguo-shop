'use client'

import { useEffect, useRef, useState } from 'react'

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
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !startedRef.current) {
          startedRef.current = true
          animate()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(ref.current)

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
