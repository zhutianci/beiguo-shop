'use client'

import { useEffect, useRef, useState } from 'react'
import { useLite } from '@/lib/use-lite'

interface MouseSpotlightProps {
  size?: number
  color?: string
}

/** 光晕中心 → transform（元素钉在视口左上角，靠位移把中心对到鼠标上；与原来 left/top + translate(-50%,-50%) 完全重合） */
function placeAt(x: number, y: number, size: number): string {
  return `translate3d(${x - size / 2}px, ${y - size / 2}px, 0)`
}

/**
 * 鼠标跟随光晕（仅在父容器内移动时显示）
 * 用法：把这个组件放在一个 relative 容器内，光晕会跟随鼠标在该容器内移动
 *
 * 【性能优化 2026-10-07：跟随鼠标只改 transform，不再 setState】
 * 原来每一帧 setPos 改的是 left / top：组件每帧重渲染一次，浏览器每帧还要为这块 600px 的 fixed 元素重新排版、重绘。
 * 现在位置直接写进元素的 transform（合成线程挪图层，不排版、不重绘、不经过 React），只有显隐还走 state（进出页面各一次）。
 * 看上去与原来一模一样：同样的位置、同样的 0.4s 淡入淡出。will-change 只加在这一个元素上（电脑端首页、IP 工具页各一处）。
 */
export function MouseSpotlight({
  size = 600,
  color = 'rgba(168, 85, 247, 0.18)',
}: MouseSpotlightProps) {
  const ref = useRef<HTMLDivElement>(null)
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
        if (ref.current) ref.current.style.transform = placeAt(e.clientX, e.clientY, size)
        setVisible(true) // 已经是 true 时 React 直接跳过，不会重渲染
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
  }, [lite, size])

  return (
    <div
      ref={ref}
      aria-hidden
      className="fixed pointer-events-none z-0 rounded-full lite:hidden"
      style={{
        left: 0,
        top: 0,
        width: size,
        height: size,
        transform: placeAt(-1000, -1000, size),
        willChange: lite ? undefined : 'transform',
        background: `radial-gradient(circle, ${color} 0%, transparent 60%)`,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease-out',
      }}
    />
  )
}
