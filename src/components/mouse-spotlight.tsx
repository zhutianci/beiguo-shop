'use client'

import { useEffect, useState } from 'react'
import { useLite } from '@/lib/use-lite'

interface MouseSpotlightProps {
  size?: number
  color?: string
}

/**
 * 鼠标跟随光晕（仅在父容器内移动时显示）
 * 用法：把这个组件放在一个 relative 容器内，光晕会跟随鼠标在该容器内移动
 */
export function MouseSpotlight({
  size = 600,
  color = 'rgba(168, 85, 247, 0.18)',
}: MouseSpotlightProps) {
  const [pos, setPos] = useState({ x: -1000, y: -1000 })
  const [visible, setVisible] = useState(false)
  /*
   * 手机端轻量模式（2026-10-01，站长要求电脑端不变）：触屏没有鼠标，不挂 mousemove。
   * iOS 点一下会补发一次兼容的 mousemove，这块 600px 的 fixed 光晕就停在点过的地方不走了，
   * 还逼着上面所有内容单独合成图层（iOS WebKit 本来就在为毛玻璃和常驻动画满负荷重绘）。
   */
  const lite = useLite()

  useEffect(() => {
    if (lite) return
    let raf = 0
    const handleMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        setPos({ x: e.clientX, y: e.clientY })
        setVisible(true)
      })
    }
    const handleLeave = () => setVisible(false)

    window.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseleave', handleLeave)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseleave', handleLeave)
      cancelAnimationFrame(raf)
    }
  }, [lite])

  return (
    <div
      aria-hidden
      className="fixed pointer-events-none z-0 rounded-full lite:hidden"
      style={{
        left: pos.x,
        top: pos.y,
        width: size,
        height: size,
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(circle, ${color} 0%, transparent 60%)`,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease-out',
      }}
    />
  )
}
