'use client'

import { useCallback, useRef, useState } from 'react'
import { Download, Image as ImageIcon, Link2, Loader2, Share2, X } from 'lucide-react'
import { POSTER_H, POSTER_W, paintPoster } from '@/lib/news/poster'
import {
  buildShareText,
  clamp,
  copyText,
  isWeChat,
  reportNewsShare,
  withChannel,
} from '@/lib/news/share'

/**
 * 分享海报：前端 Canvas 画一张竖版长图。绘制逻辑在 lib/news/poster.ts，
 * 这里只负责交互、状态与降级。
 *
 * 国内做分享，海报是比 og 标签实用得多的路径——域名未备案拿不到微信 JS-SDK 签名，
 * 自定义分享卡片本期做不到，但一张图谁都能转发到朋友圈。
 *
 * 【为什么必须两次点击】navigator.share 需要 transient activation，
 * Safari 要求它出现在用户手势的**同一个同步 task** 里。而 canvas.toBlob 是异步的，
 * 「画完顺手 share」必然已经丢掉激活态，调用会被拒。
 * 所以拆成：第一次点「生成海报」（异步画完并把 blob 预备好），
 * 第二次点「保存 / 分享」（同步拿现成的 blob 调用）。这不是多余的一步，是唯一跑得通的顺序。
 */

interface Props {
  eventId: number
  slug: string
  headline: string
  summary?: string | null
  whyItMatters?: string | null
  category?: string | null
  /** 信源媒体名，海报上只画文字 */
  sources?: string[]
  happenedAt?: string | null
  /** 详情页绝对地址（含协议与域名） */
  url: string
  className?: string
}

export function SharePoster(props: Props) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [tip, setTip] = useState<string | null>(null)
  const blobRef = useRef<Blob | null>(null)

  /** 第一次点击：异步画完，同时把 blob 备好供第二次点击同步使用 */
  const generate = useCallback(async () => {
    setBusy(true)
    setFailed(false)
    setTip(null)
    setOpen(true)
    try {
      // 让出一帧让蒙层先出来，否则低端机上会有一段「点了没反应」
      await new Promise((r) => setTimeout(r, 16))

      const canvas = document.createElement('canvas')
      canvas.width = POSTER_W
      canvas.height = POSTER_H
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('no 2d context')

      paintPoster(ctx, {
        headline: props.headline,
        summary: props.summary,
        whyItMatters: props.whyItMatters,
        category: props.category,
        sources: props.sources,
        happenedAt: props.happenedAt,
        url: withChannel(props.url, 'poster'),
      })

      // toDataURL 在 canvas 被污染时抛 SecurityError。本组件不画任何外部图片，
      // 理论上不会发生，但内存不足时同样会抛，所以照样包起来降级为「复制链接」。
      setDataUrl(canvas.toDataURL('image/png'))

      await new Promise<void>((resolve) => {
        try {
          canvas.toBlob((b) => {
            blobRef.current = b
            resolve()
          }, 'image/png')
        } catch {
          resolve()
        }
      })
      reportNewsShare(props.eventId, 'poster')
    } catch (e) {
      console.error('[share-poster] 生成失败', e)
      setFailed(true)
      setDataUrl(null)
      blobRef.current = null
    } finally {
      setBusy(false)
    }
  }, [props])

  /** 第二次点击：必须保持同步，中间不能出现 await，否则 Safari 会因失去激活态拒绝 */
  const shareImage = () => {
    const blob = blobRef.current
    const nav = navigator as Navigator & {
      canShare?: (d: ShareData) => boolean
      share?: (d: ShareData) => Promise<void>
    }
    if (blob && nav.share && nav.canShare) {
      try {
        const file = new File([blob], `${props.slug}.png`, { type: 'image/png' })
        if (nav.canShare({ files: [file] })) {
          nav.share({ files: [file], title: props.headline }).catch(() => {
            // 用户取消也会 reject，不当错误处理
          })
          return
        }
      } catch {
        // 落到下面的下载分支
      }
    }
    // 没有系统分享就走 <a download>。微信内置浏览器多半会忽略 download 属性，
    // 所以蒙层上始终显示「长按图片保存」的提示，两条路互为兜底。
    if (dataUrl) {
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${props.slug}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTip('若未自动保存，请长按上方图片保存到相册')
    }
  }

  /** 生成失败时的降级：复制文案（同样带「AI 摘要」标识，法定要求） */
  const fallbackCopy = async () => {
    const ok = await copyText(
      buildShareText({ headline: props.headline, summary: props.summary, url: props.url })
    )
    setTip(ok ? '已复制分享文案（含 AI 摘要标识）' : '复制失败，请手动复制地址栏链接')
  }

  return (
    <>
      <button
        type="button"
        onClick={generate}
        className={
          props.className ||
          'inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/[0.09]'
        }
      >
        <ImageIcon className="h-4 w-4" />
        生成分享海报
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-h-full w-full max-w-[360px] overflow-y-auto rounded-2xl bg-slate-900 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-white/80">分享海报</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-white/50 hover:bg-white/10 hover:text-white"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {busy && (
              <div className="flex h-64 items-center justify-center text-white/60">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                正在生成…
              </div>
            )}

            {!busy && failed && (
              <div className="space-y-3 py-6 text-center">
                <p className="text-sm text-white/70">海报生成失败，可以改用复制文案分享</p>
                <button
                  type="button"
                  onClick={fallbackCopy}
                  className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-500"
                >
                  <Link2 className="h-4 w-4" />
                  复制分享文案
                </button>
              </div>
            )}

            {!busy && dataUrl && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dataUrl}
                  alt={clamp(props.headline, 40)}
                  className="w-full rounded-xl"
                  style={{ aspectRatio: `${POSTER_W} / ${POSTER_H}` }}
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={shareImage}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-500"
                  >
                    {typeof navigator !== 'undefined' && 'share' in navigator ? (
                      <Share2 className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    保存 / 分享
                  </button>
                  <button
                    type="button"
                    onClick={fallbackCopy}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/75 hover:bg-white/[0.09]"
                  >
                    <Link2 className="h-4 w-4" />
                    复制文案
                  </button>
                </div>
                <p className="mt-2 text-center text-xs text-white/45">
                  {isWeChat() ? '微信内请长按图片保存到相册，再发给朋友' : '长按或右键图片可保存'}
                </p>
              </>
            )}

            {tip && <p className="mt-2 text-center text-xs text-primary-300">{tip}</p>}
          </div>
        </div>
      )}
    </>
  )
}
