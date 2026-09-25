'use client'

/**
 * 图片字段：上传（选择文件 / 拖放 / 粘贴截图）或填 https 地址，带缩略图与体积提示。
 * 预处理规则见 image-process.ts。
 */
import { useEffect, useRef, useState } from 'react'
import { ImageOff, Link2, Loader2, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEditorCtx } from './editor-context'
import { Field, Hint } from './fields'
import { ImageRejectError, prepareImage, uploadImage } from './image-process'
import { imageUrlProblem } from './util'

export function ImageField({
  label = '图片',
  value,
  onChange,
  optional,
}: {
  label?: React.ReactNode
  value: string | undefined
  onChange: (url: string | undefined) => void
  /** 可以不放图（头图横幅的图片是可选的） */
  optional?: boolean
}) {
  const { readOnly } = useEditorCtx()
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [info, setInfo] = useState<{ note: string | null; warn: string | null } | null>(null)
  const [mode, setMode] = useState<'upload' | 'url'>('upload')
  const [urlText, setUrlText] = useState(value || '')
  const [drag, setDrag] = useState(false)
  const [broken, setBroken] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  // 审查 C23：上传要 1-3 秒，回来时必须用「最新一次渲染」的 onChange。区块表单的 onChange 是 setter(当时的区块)，
  // 用开始上传那次渲染的旧闭包会写回 {...旧区块, src}，把上传期间改的替代文字 / 标题等整块冲掉
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    setUrlText(value || '')
    setBroken(false)
  }, [value])
  useEffect(() => () => abortRef.current?.abort(), [])

  const handleFile = async (file: File | null | undefined) => {
    if (!file || readOnly) return
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    setErr(null)
    setInfo(null)
    try {
      setBusy('正在压缩…')
      const prepared = await prepareImage(file)
      if (ac.signal.aborted) return
      setBusy('正在上传…')
      const url = await uploadImage(prepared, ac.signal)
      if (ac.signal.aborted) return
      onChangeRef.current(url) // 取最新一次渲染的回调，见 onChangeRef 的注释（审查 C23）
      setInfo({ note: prepared.note, warn: prepared.warn })
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return
      setErr(e instanceof ImageRejectError ? e.message : '图片处理失败，请换一张试试')
    } finally {
      if (abortRef.current === ac) {
        abortRef.current = null
        setBusy(null)
      }
    }
  }

  const applyUrl = () => {
    const t = urlText.trim()
    if (!t) {
      if (optional) onChange(undefined)
      return
    }
    const p = imageUrlProblem(t)
    if (p?.level === 'error') {
      setErr(p.message)
      return
    }
    setErr(null)
    setInfo(p ? { note: null, warn: p.message } : null)
    if (t !== value) onChange(t)
    setMode('upload')
  }

  const valueProblem = value ? imageUrlProblem(value) : null

  return (
    <Field label={label}>
      <div
        onDragOver={(e) => {
          if (readOnly) return
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          void handleFile(e.dataTransfer.files?.[0])
        }}
        onPaste={(e) => {
          const f = Array.from(e.clipboardData?.files || []).find((x) => x.type.startsWith('image/'))
          if (f) {
            e.preventDefault()
            void handleFile(f)
          }
        }}
        className={cn(
          'rounded-lg border border-dashed bg-gray-50/60 p-2.5 transition-colors',
          drag ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
        )}
      >
        <div className="flex gap-3">
          <div className="flex h-[72px] w-[96px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white">
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
            ) : value && !broken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="h-full w-full object-contain" onError={() => setBroken(true)} referrerPolicy="no-referrer" />
            ) : (
              <ImageOff className="h-5 w-5 text-gray-300" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            {busy ? (
              <p className="pt-1 text-xs text-gray-600">{busy}</p>
            ) : mode === 'upload' ? (
              <>
                <div className="flex flex-wrap gap-1.5">
                  <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={readOnly} onClick={() => fileRef.current?.click()}>
                    <Upload className="mr-1 h-3.5 w-3.5" />
                    {value ? '换一张' : '上传图片'}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" disabled={readOnly} onClick={() => setMode('url')}>
                    <Link2 className="mr-1 h-3.5 w-3.5" />
                    填地址
                  </Button>
                  {value && (
                    <Button
                      title="移除图片"
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-gray-500"
                      disabled={readOnly}
                      onClick={() => {
                        onChange(optional ? undefined : '')
                        setInfo(null)
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <p className="text-[11px] leading-4 text-gray-400">JPG / PNG / GIF，可拖放或粘贴截图；自动压缩到 1200px 宽</p>
              </>
            ) : (
              <>
                <input
                  autoFocus
                  value={urlText}
                  onChange={(e) => setUrlText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      applyUrl()
                    }
                  }}
                  placeholder="https://…/banner.jpg"
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                <div className="flex gap-1.5">
                  <Button type="button" size="sm" className="h-6 px-2 text-xs" onClick={applyUrl}>
                    使用
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setMode('upload')}>
                    返回上传
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif"
          className="hidden"
          onChange={(e) => {
            void handleFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
      {err ? (
        <Hint tone="error">{err}</Hint>
      ) : broken && value ? (
        <Hint tone="warn">图片加载失败，请检查地址是否可以公开访问</Hint>
      ) : valueProblem ? (
        <Hint tone={valueProblem.level === 'error' ? 'error' : 'warn'}>{valueProblem.message}</Hint>
      ) : info?.warn ? (
        <Hint tone="warn">{info.warn}</Hint>
      ) : info?.note ? (
        <Hint>{info.note}</Hint>
      ) : null}
    </Field>
  )
}

export default ImageField
