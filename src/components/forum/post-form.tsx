'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, AlertCircle, Tag } from 'lucide-react'
import { MarkdownEditor } from './markdown-editor'
import { forumFetch } from '@/lib/forum-client'
import { useUserStore } from '@/store/user'

interface Category {
  id: number
  name: string
  slug: string
  icon: string | null
}

interface Initial {
  title: string
  content: string
  images: string[]
  tags: string[]
  categoryId: number
}

export function PostForm({ postId, initial }: { postId?: number; initial?: Initial }) {
  const router = useRouter()
  const { user } = useUserStore()
  const isEdit = !!postId

  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState<number | null>(initial?.categoryId ?? null)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [images, setImages] = useState<string[]>(initial?.images ?? [])
  const [tags, setTags] = useState((initial?.tags ?? []).join(' '))
  const [anonName, setAnonName] = useState('')
  const [anonEmail, setAnonEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/forum/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setCategories(d.data)
          if (!categoryId && d.data.length) setCategoryId(d.data[0].id)
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = async () => {
    setErr(null)
    if (!categoryId) return setErr('请选择板块')
    if (title.trim().length < 2) return setErr('标题至少 2 个字')
    if (!content.trim()) return setErr('内容不能为空')

    setSubmitting(true)
    try {
      const payload: any = { categoryId, title, content, tags, images }
      if (!user && !isEdit) {
        payload.anonName = anonName
        payload.anonEmail = anonEmail || undefined
      }
      const url = isEdit ? `/api/forum/posts/${postId}` : '/api/forum/posts'
      const res = await forumFetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        router.push(`/forum/${isEdit ? postId : data.data.id}`)
      } else {
        setErr(data.error || '提交失败')
      }
    } catch {
      setErr('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-6 space-y-5">
      {/* 板块 */}
      <div>
        <label className="block text-sm text-white/60 mb-2">选择板块</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={`px-4 py-2 rounded-xl text-sm transition-all ${
                categoryId === c.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'glass text-white/70 hover:text-white'
              }`}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* 标题 */}
      <div>
        <label className="block text-sm text-white/60 mb-2">标题</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="一句话说明你的主题"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-lg placeholder:text-white/30 outline-none focus:border-purple-500/50"
        />
      </div>

      {/* 正文 */}
      <div>
        <label className="block text-sm text-white/60 mb-2">正文</label>
        <MarkdownEditor value={content} onChange={setContent} images={images} onImagesChange={setImages} />
      </div>

      {/* 标签 */}
      <div>
        <label className="block text-sm text-white/60 mb-2 flex items-center gap-1">
          <Tag className="w-3.5 h-3.5" /> 标签（空格分隔，最多 5 个）
        </label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="例如：建议 bug 续费"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 outline-none focus:border-purple-500/50"
        />
      </div>

      {/* 匿名信息 */}
      {!user && !isEdit && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-white/60 mb-2">昵称（匿名发帖）</label>
            <input
              value={anonName}
              onChange={(e) => setAnonName(e.target.value)}
              maxLength={30}
              placeholder="留空则显示“匿名用户”"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 outline-none focus:border-purple-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">邮箱（选填，不公开）</label>
            <input
              value={anonEmail}
              onChange={(e) => setAnonEmail(e.target.value)}
              placeholder="便于我们回复你"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 outline-none focus:border-purple-500/50"
            />
          </div>
        </div>
      )}

      {err && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {err}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40">
          {user ? `以 ${user.nickname || user.email} 身份发布` : '当前为匿名发布，登录后可管理自己的帖子'}
        </p>
        <button
          onClick={submit}
          disabled={submitting}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-semibold flex items-center gap-2 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all disabled:opacity-50"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {isEdit ? '保存修改' : '发布'}
        </button>
      </div>
    </div>
  )
}
