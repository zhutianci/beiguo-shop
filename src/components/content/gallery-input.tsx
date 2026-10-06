'use client'

/**
 * 效果图上传（提示词的出图，设计 §5.1）。只维护图片地址数组，不往正文里插 Markdown——
 * 出图在详情页单独成一个画廊放在最前面（效果图在前），正文是「心得与说明」。
 * 上传走 /api/upload（须登录、会去 EXIF，见 lib/image-meta.ts）。
 */
import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { forumFetch } from '@/lib/forum-client'

const MAX = 9

export function GalleryInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    try {
      const added: string[] = []
      for (const file of Array.from(files).slice(0, MAX - value.length)) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await forumFetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (data.success) added.push(data.data.url)
        else alert(data.error || '上传失败')
      }
      if (added.length) onChange([...value, ...added])
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
      {value.map((src, i) => (
        <div key={src} className="relative aspect-square overflow-hidden rounded-xl bg-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`效果图 ${i + 1}`} className="h-full w-full object-cover" />
          {i === 0 && <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 text-[10px] text-white/80">封面</span>}
          <button
            type="button"
            onClick={() => onChange(value.filter((v) => v !== src))}
            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white/80 hover:text-white"
            aria-label="移除"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {value.length < MAX && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="aspect-square rounded-xl border border-dashed border-white/20 text-white/50 hover:text-white hover:border-white/40 flex flex-col items-center justify-center gap-1 text-xs disabled:opacity-50"
        >
          <ImagePlus className="h-5 w-5" />
          {uploading ? '上传中…' : '上传效果图'}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={(e) => upload(e.target.files)} />
    </div>
  )
}
