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
  const [charIndex, setCharIndex] = useState(0)
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
    const currentText = texts[textIndex]

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
      {texts[textIndex].slice(0, charIndex)}
      <span className={`inline-block w-[3px] ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
        |
      </span>
    </span>
  )
}
