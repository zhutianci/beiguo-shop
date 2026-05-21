'use client'

import { useEffect, useState } from 'react'

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

  useEffect(() => {
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
  }, [])

  return (
    <div
      aria-hidden
      className="fixed pointer-events-none z-0 rounded-full"
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
