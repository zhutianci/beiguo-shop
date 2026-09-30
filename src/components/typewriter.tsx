'use client'

import { useEffect, useState } from 'react'
import { useLite } from '@/lib/use-lite'

interface TypewriterProps {
  texts: string[]
  className?: string
  typeSpeed?: number
  deleteSpeed?: number
  pauseTime?: number
}

export function Typewriter({
  texts,
  className = '',
  typeSpeed = 100,
  deleteSpeed = 50,
  pauseTime = 2000,
}: TypewriterProps) {
  const [textIndex, setTextIndex] = useState(0)
  /*
   * 【charIndex 从「第一句的完整长度」起步，不是 0】
   * 从 0 起步时，服务端渲染出来的这个组件里**一个字都没有**——
   * 只有一个光标 `|`。它以前被用在首页 H1 里，于是全站最重要的那个 H1
   * 在爬虫和读屏软件眼里是空的（线上实测过）。
   * 从完整长度起步后，首屏 HTML 里就是完整的第一句；
   * 挂载后第一个 effect 分支（charIndex === currentText.length）照常触发，
   * 停 pauseTime 再开始删除——动画节奏和原来完全一致，只是少了一次「从零打出来」。
   */
  const [charIndex, setCharIndex] = useState(() => texts[0]?.length ?? 0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  /*
   * 手机端轻量模式（2026-10-01，站长要求电脑端不变）：不逐字打、光标不闪，整句每 3.5 秒左右换一次。
   * 逐字打字每 80~150ms 重渲染一次、光标每 500ms 再一次，每次都让 iOS WebKit 重排、重绘整个 hero
   * （连同压在上面的毛玻璃），是首页「停不下来」的来源之一。四个卖点照样轮换，只是一次换一整句。
   * 服务端与水合那次 lite 恒为 false，输出与电脑版相同（完整的第一句 + 光标），光标在手机上由 CSS（lite:hidden）藏起。
   */
  const lite = useLite()

  // 光标闪烁
  useEffect(() => {
    if (lite) return
    const cursorTimer = setInterval(() => {
      setShowCursor((p) => !p)
    }, 500)
    return () => clearInterval(cursorTimer)
  }, [lite])

  // 手机端轻量模式：整句轮换。离开轻量模式（如平板接上触控板）时 charIndex 归零，电脑版的打字逻辑从当前这句重新打起
  useEffect(() => {
    if (!lite || texts.length < 2) return
    setIsDeleting(false)
    const timer = setInterval(() => {
      setTextIndex((i) => (i + 1) % texts.length)
    }, Math.max(pauseTime + 1000, 3000))
    return () => {
      clearInterval(timer)
      setCharIndex(0)
    }
  }, [lite, texts.length, pauseTime])

  // 打字逻辑
  useEffect(() => {
    if (lite) return
    // texts 可能为空数组，或 textIndex 一时越界（texts 变短时）——这两处才是真会崩的地方
    const currentText = texts[textIndex] ?? ''

    if (!isDeleting && charIndex === currentText.length) {
      const timer = setTimeout(() => setIsDeleting(true), pauseTime)
      return () => clearTimeout(timer)
    }

    if (isDeleting && charIndex === 0) {
      setIsDeleting(false)
      setTextIndex((textIndex + 1) % texts.length)
      return
    }

    const timer = setTimeout(
      () => {
        setCharIndex(isDeleting ? charIndex - 1 : charIndex + 1)
      },
      isDeleting ? deleteSpeed : typeSpeed
    )

    return () => clearTimeout(timer)
  }, [lite, charIndex, isDeleting, textIndex, texts, typeSpeed, deleteSpeed, pauseTime])

  const phrase = texts[textIndex] ?? ''
  return (
    <span className={className}>
      {lite ? phrase : phrase.slice(0, charIndex)}
      <span className={`inline-block w-[3px] ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity lite:hidden`}>
        |
      </span>
    </span>
  )
}
