'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { DEFAULT_CONFIG, DEFAULT_GREETING_NAME, type EmailDoc, type LintIssue, type Topic } from '@/lib/marketing/types'
import type { Preset } from '@/lib/marketing/presets'
import { renderEmail } from '@/lib/marketing/render'
import { PreviewFrame } from './preview-frame'
import { isAbortError, mktFetch } from './api'
import { cn } from '@/lib/utils'

export interface RenderResponse {
  html: string
  sizeBytes: number
  imageCount: number
  issues: LintIssue[]
}

/**
 * 服务端权威预览：POST /api/admin/marketing/render（商品、券按库里的真实数据解析），结果放进 PreviewFrame。
 *
 * 【绝不 dangerouslySetInnerHTML】邮件 HTML 一律进无脚本权限的沙箱 iframe（设计 12 节第 12 条）。
 * scale < 1 时做成缩略图：iframe 仍按 600px 排版，外层 transform 缩小 —— 这样看到的换行与真实邮件一致。
 */
export function ContentPreview({
  doc,
  subject,
  preheader,
  topic,
  scale = 1,
  height,
  width = 600,
  onRendered,
  className,
  imagesOff,
}: {
  doc: EmailDoc
  subject: string
  preheader: string
  topic: Topic
  scale?: number
  /** 外框高度（缩略图用，超出部分裁掉）；不传则随内容 */
  height?: number
  width?: number
  onRendered?: (r: RenderResponse | null) => void
  className?: string
  imagesOff?: boolean
}) {
  const [res, setRes] = useState<RenderResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const cbRef = useRef(onRendered)
  cbRef.current = onRendered
  const key = useMemo(() => JSON.stringify([doc, subject, preheader, topic, !!imagesOff]), [doc, subject, preheader, topic, imagesOff])

  useEffect(() => {
    const t = setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      setLoading(true)
      setErr('')
      try {
        const r = await mktFetch<RenderResponse>('/api/admin/marketing/render', {
          body: { doc, subject, preheader, topic, imagesOff: !!imagesOff },
          signal: ctrl.signal,
        })
        if (abortRef.current !== ctrl) return
        if (r.ok && r.data) {
          setRes(r.data)
          cbRef.current?.(r.data)
        } else {
          setErr(r.error || '预览生成失败')
          cbRef.current?.(null)
        }
      } catch (e) {
        if (!isAbortError(e)) setErr('预览生成失败')
      } finally {
        if (abortRef.current === ctrl) setLoading(false)
      }
    }, 250)
    return () => clearTimeout(t)
    // key 已涵盖全部输入
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => () => abortRef.current?.abort(), [])

  return (
    <ScaledFrame html={res?.html || ''} scale={scale} width={width} height={height} className={className}>
      {!res && (
        <div className="flex h-full min-h-[160px] items-center justify-center text-sm text-gray-400">
          {err ? <span className="px-4 text-center text-red-500">{err}</span> : <Loader2 className="h-5 w-5 animate-spin" />}
        </div>
      )}
      {res && loading && (
        <div className="absolute right-2 top-2 rounded bg-white/80 p-1 shadow-sm">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
        </div>
      )}
    </ScaledFrame>
  )
}

/** 缩放外壳：内部按 width 排版，整体按 scale 缩小，外框尺寸按缩放后计算，避免留出大块空白 */
export function ScaledFrame({
  html,
  scale = 1,
  width = 600,
  height,
  className,
  children,
}: {
  html: string
  scale?: number
  width?: number
  height?: number
  className?: string
  children?: React.ReactNode
}) {
  const scaled = scale !== 1
  return (
    <div
      className={cn('relative overflow-hidden bg-gray-100', className)}
      style={{ width: scaled ? Math.round(width * scale) : '100%', maxWidth: '100%', height }}
    >
      {html && (
        <div
          className={scaled ? 'pointer-events-none origin-top-left' : 'mx-auto'}
          style={scaled ? { width, transform: `scale(${scale})` } : { width, maxWidth: '100%' }}
        >
          <PreviewFrame html={html} width={width} minHeight={scaled ? undefined : 200} />
        </div>
      )}
      {children}
    </div>
  )
}

/**
 * 内置模板的预览 HTML（浏览器端同构渲染，不查库）。商品区块没有商品数据，由渲染器画占位；
 * 页脚用默认配置 —— 真实页脚以发送设置为准，服务端预览/发送时再套。抛错由调用方兜底。
 */
export function presetPreviewHtml(preset: Preset, origin: string): string {
  const { companyName, brandName, contactEmail, footerNote, subjectPrefix } = DEFAULT_CONFIG
  return renderEmail(preset.doc, {
    mode: 'preview',
    subject: preset.subject,
    preheader: preset.preheader,
    origin,
    footer: { companyName, brandName, contactEmail, footerNote, subjectPrefix },
    products: {},
    coupon: null,
    vars: { nickname: DEFAULT_GREETING_NAME },
  }).html
}

/**
 * 内置模板缩略图：直接在浏览器里用同构渲染器渲染（内置模板只用 logo 与色块，不需要查库）。
 * 渲染器报错时退回占位卡片 —— 缩略图只是锦上添花，不能让整个模板库白屏。
 */
export function PresetThumb({ preset, scale = 0.42, height = 260 }: { preset: Preset; scale?: number; height?: number }) {
  const html = useMemo(() => {
    try {
      return presetPreviewHtml(preset, typeof window !== 'undefined' ? window.location.origin : 'https://bigolab.com')
    } catch {
      return ''
    }
  }, [preset])
  if (!html) {
    return (
      <div
        className="flex items-center justify-center rounded-t-lg bg-gradient-to-br from-violet-100 to-pink-100 text-sm font-medium text-violet-700"
        style={{ height }}
      >
        {preset.name}
      </div>
    )
  }
  return <ScaledFrame html={html} scale={scale} height={height} className="rounded-t-lg" />
}
