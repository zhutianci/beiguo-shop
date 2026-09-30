'use client'

import { useRef, useState, ReactNode } from 'react'
import { useLite } from '@/lib/use-lite'

interface TiltCardProps {
  children: ReactNode
  className?: string
  maxTilt?: number
  perspective?: number
  scale?: number
}

export function TiltCard({
  children,
  className = '',
  maxTilt = 10,
  perspective = 1000,
  scale = 1.02,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState('')
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 })
  const [isHovering, setIsHovering] = useState(false)
  /*
   * 手机端轻量模式（2026-10-01，站长要求电脑端不变）：触屏不倾斜、不出反光。
   * iOS 点一下会补发 mouseenter / mousemove，卡片就定格在倾斜 + 放大的样子并挂上一层 mix-blend 反光，
   * 还可能让 iOS 把第一次点击当成「悬停」、要点第二次才进商品页；preserve-3d 也会把卡片里的毛玻璃拖进 3D 合成。
   */
  const lite = useLite()

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    const rotateY = (x - 0.5) * 2 * maxTilt
    const rotateX = -(y - 0.5) * 2 * maxTilt

    setTransform(
      `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`
    )
    setGlarePos({ x: x * 100, y: y * 100 })
  }

  const handleMouseEnter = () => setIsHovering(true)
  const handleMouseLeave = () => {
    setTransform('')
    setIsHovering(false)
  }

  return (
    <div
      ref={ref}
      onMouseMove={lite ? undefined : handleMouseMove}
      onMouseEnter={lite ? undefined : handleMouseEnter}
      onMouseLeave={lite ? undefined : handleMouseLeave}
      style={{
        transform,
        transition: transform ? 'transform 0.08s ease-out' : 'transform 0.4s ease-out',
        transformStyle: lite ? undefined : 'preserve-3d',
      }}
      className={`relative ${className}`}
    >
      {children}

      {/* 反光高光层 */}
      {isHovering && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.15) 0%, transparent 50%)`,
            mixBlendMode: 'overlay',
          }}
        />
      )}
    </div>
  )
}
