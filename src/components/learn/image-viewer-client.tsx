'use client'

/**
 * 提示词详情的效果图查看器：主图 + 缩略图条 + 全屏灯箱（← → 切换、Esc 关闭、点背景关闭）。
 * 主图按真实比例占位（宽高来自上传记录），切换缩略图不跳版。灯箱打开时锁住页面滚动。
 * 首帧：服务端就渲染出第 1 张主图（eager），交互挂载后才有。
 */
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'

export interface ViewerImage {
  src: string
  w: number | null
  h: number | null
}

export function ImageViewer({ images, title }: { images: ViewerImage[]; title: string }) {
  const [idx, setIdx] = useState(0)
  const [open, setOpen] = useState(false)
  const cur = images[idx]
  const go = useCallback((d: number) => setIdx((i) => (i + d + images.length) % images.length), [images.length])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, go])

  if (!cur) {
    return <div className="learn-card flex aspect-[4/5] items-center justify-center text-sm text-white/30">待出图</div>
  }
  const ratio = cur.w && cur.h ? `${cur.w} / ${cur.h}` : '4 / 5'

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="learn-media group relative block w-full cursor-zoom-in"
        style={{ aspectRatio: ratio, maxHeight: '78vh' }}
        aria-label="放大查看"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cur.src} alt={`${title} 效果图 ${idx + 1}`} className="absolute inset-0 h-full w-full object-contain" loading="eager" />
        <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-white/85">AI 生成</span>
        <span className="absolute right-3 top-3 rounded-full bg-black/55 p-2 text-white/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100 lite:opacity-100">
          <Expand className="h-4 w-4" />
        </span>
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] tabular-nums text-white/80">
            {idx + 1} / {images.length}
          </span>
        )}
      </button>

      {images.length > 1 && (
        <div className="learn-scroll-x mt-3 flex gap-2">
          {images.map((im, i) => (
            <button
              key={im.src}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`第 ${i + 1} 张`}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border transition-all duration-300 ${
                i === idx ? 'border-white opacity-100' : 'border-white/10 opacity-55 hover:opacity-90'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={im.src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="查看效果图"
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cur.src}
            alt={`${title} 效果图 ${idx + 1}`}
            className="max-h-[92vh] max-w-[94vw] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20" aria-label="关闭">
            <X className="h-5 w-5" />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  go(-1)
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                aria-label="上一张"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  go(1)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                aria-label="下一张"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
