'use client'

import { useEffect, useState } from 'react'

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

  // 光标闪烁
  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor((p) => !p)
    }, 500)
    return () => clearInterval(cursorTimer)
  }, [])

  // 打字逻辑
  useEffect(() => {
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
  }, [charIndex, isDeleting, textIndex, texts, typeSpeed, deleteSpeed, pauseTime])

  return (
    <span className={className}>
      {(texts[textIndex] ?? '').slice(0, charIndex)}
      <span className={`inline-block w-[3px] ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
        |
      </span>
    </span>
  )
}
