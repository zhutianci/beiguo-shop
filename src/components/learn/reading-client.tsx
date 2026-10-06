'use client'

/**
 * 教程阅读体验：顶部阅读进度条 + 侧栏目录（滚动高亮当前小节）。
 *
 * 进度条用 transform: scaleX，rAF 节流，不触发重新排版（手机端轻量模式下同样流畅）。
 * 目录高亮用 IntersectionObserver，不监听 scroll 逐帧算位置。
 */
import { useEffect, useRef, useState } from 'react'

export function ReadingProgress({ targetId }: { targetId: string }) {
  const bar = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const el = document.getElementById(targetId)
      if (!el || !bar.current) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight * 0.6
      const done = Math.min(Math.max(-rect.top / Math.max(total, 1), 0), 1)
      bar.current.style.transform = `scaleX(${done})`
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [targetId])
  return <div ref={bar} className="learn-progress" style={{ transform: 'scaleX(0)' }} aria-hidden />
}

export function Toc({ items }: { items: { id: string; level: 2 | 3; text: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '')
  useEffect(() => {
    if (!items.length) return
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    items.forEach((t) => {
      const el = document.getElementById(t.id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [items])

  if (items.length < 2) return null
  return (
    <nav aria-label="目录" className="text-[13px]">
      <p className="learn-eyebrow mb-3">目录</p>
      <ul className="space-y-1 border-l border-white/[0.08]">
        {items.map((t) => (
          <li key={t.id}>
            <a
              href={`#${t.id}`}
              className={`-ml-px block border-l py-1 transition-colors duration-300 ${t.level === 3 ? 'pl-6' : 'pl-3.5'} ${
                active === t.id ? 'border-white text-white' : 'border-transparent text-white/45 hover:text-white/80'
              }`}
            >
              {t.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
