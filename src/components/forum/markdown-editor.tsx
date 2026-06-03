'use client'

import { useRef, useState } from 'react'
import { Bold, Italic, Heading, List, Quote, Code, Link2, Image as ImageIcon, Eye, Pencil } from 'lucide-react'
import { renderMarkdown } from '@/lib/markdown'
import { forumFetch } from '@/lib/forum-client'

interface Props {
  value: string
  onChange: (v: string) => void
  images: string[]
  onImagesChange: (imgs: string[]) => void
  placeholder?: string
  minHeight?: number
}

export function MarkdownEditor({ value, onChange, images, onImagesChange, placeholder, minHeight = 240 }: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const [uploading, setUploading] = useState(false)

  const wrap = (before: string, after = before, placeholderText = '') => {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.slice(start, end) || placeholderText
    const next = value.slice(0, start) + before + selected + after + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = start + before.length
      ta.selectionEnd = start + before.length + selected.length
    })
  }

  const prefixLine = (prefix: string) => {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart)
    onChange(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = ta.selectionEnd = start + prefix.length
    })
  }

  const insert = (text: string) => {
    const ta = taRef.current
    const pos = ta ? ta.selectionStart : value.length
    onChange(value.slice(0, pos) + text + value.slice(pos))
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const newImgs: string[] = []
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await forumFetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (data.success) {
          newImgs.push(data.data.url)
          insert(`\n![图片](${data.data.url})\n`)
        } else {
          alert(data.error || '上传失败')
        }
      }
      if (newImgs.length) onImagesChange([...images, ...newImgs])
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const tools = [
    { icon: Bold, label: '粗体', fn: () => wrap('**', '**', '粗体') },
    { icon: Italic, label: '斜体', fn: () => wrap('*', '*', '斜体') },
    { icon: Heading, label: '标题', fn: () => prefixLine('## ') },
    { icon: List, label: '列表', fn: () => prefixLine('- ') },
    { icon: Quote, label: '引用', fn: () => prefixLine('> ') },
    { icon: Code, label: '代码', fn: () => wrap('`', '`', 'code') },
    { icon: Link2, label: '链接', fn: () => wrap('[', '](https://)', '链接文字') },
  ]

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-0.5 flex-wrap">
          {tools.map((t) => (
            <button
              key={t.label}
              type="button"
              title={t.label}
              onClick={t.fn}
              className="w-8 h-8 rounded-md flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <t.icon className="w-4 h-4" />
            </button>
          ))}
          <button
            type="button"
            title="上传图片"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-8 h-8 rounded-md flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1 ${tab === 'write' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'}`}
          >
            <Pencil className="w-3 h-3" /> 编写
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1 ${tab === 'preview' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'}`}
          >
            <Eye className="w-3 h-3" /> 预览
          </button>
        </div>
      </div>

      {tab === 'write' ? (
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '支持 Markdown：**粗体**、## 标题、- 列表、`代码`、图片等'}
          style={{ minHeight }}
          className="w-full bg-transparent px-4 py-3 text-white placeholder:text-white/30 outline-none resize-y text-[15px] leading-relaxed"
        />
      ) : (
        <div
          className="prose-forum px-4 py-3 text-white/90 overflow-auto"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value) || '<p class="text-white/30">暂无内容预览</p>' }}
        />
      )}
    </div>
  )
}
