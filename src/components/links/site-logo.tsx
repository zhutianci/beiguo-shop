'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * 友链站点图标。两层降级：对方 logo（加载失败即失效）→ 站名首字渐变方块。
 *
 * 【为什么不用 next/image】logo 来自任意外站。走 /_next/image 等于让本站的 Node 进程
 * （output: 'standalone'）去代理抓取任意外站图片——对方超时或图片巨大就会占住优化线程，
 * 这台 1.8G 内存的机器扛不住。而且 next.config.js 已设 images.unoptimized（图片优化整体关闭），
 * /_next/image 一律 404，不会替任何人去抓外站图。原生 img + lazy + onError 兜底是这里唯一合理的选择。
 *
 * 【为什么不抓 favicon】第三方 favicon 服务（google s2 之类）会把访客 IP 交给第三方，
 * 国内连通性也差；直连对方 /favicon.ico 命中率低，16×16 拉到 44px 还是糊的。
 * 站名首字的渐变方块本来就是本站的视觉语言（头部那个「贝」字方块），复用它最自然。
 *
 * 【为什么要 bg-white/[0.06] 托盘】很多站的 logo 是深色或透明 PNG，
 * 直接摆在纯黑背景上等于看不见。托盘给它一层浅底，又不会像贴纸一样突兀。
 */
const LOGO_GRADIENTS = [
  'from-violet-500 to-purple-500',
  'from-purple-500 to-pink-500',
  'from-pink-500 to-rose-500',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-500',
]

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function SiteLogo({
  name,
  host,
  logo,
  size = 'md',
}: {
  name: string
  host: string
  logo?: string | null
  size?: 'md' | 'lg'
}) {
  const [failed, setFailed] = useState(false)

  const box = size === 'lg' ? 'w-16 h-16 rounded-2xl' : 'w-11 h-11 rounded-xl'
  const pad = size === 'lg' ? 'p-2.5' : 'p-2'
  const textSize = size === 'lg' ? 'text-2xl' : 'text-base'

  if (logo && !failed) {
    return (
      <div
        className={cn(
          box,
          pad,
          'flex shrink-0 items-center justify-center bg-white/[0.06] transition-colors group-hover:bg-white/10'
        )}
      >
        <img
          src={logo}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      </div>
    )
  }

  // Array.from 而不是 name[0]：emoji 与部分生僻字是代理对，下标取一位会截出半个字符
  const initial = Array.from(name)[0]?.toUpperCase() || '#'
  const gradient = LOGO_GRADIENTS[hashStr(host || name) % LOGO_GRADIENTS.length]

  return (
    <div
      className={cn(
        box,
        textSize,
        'flex shrink-0 items-center justify-center bg-gradient-to-br font-bold text-white',
        gradient
      )}
    >
      {initial}
    </div>
  )
}
