'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Send, AlertCircle, Tag, ShieldCheck } from 'lucide-react'
import { MarkdownEditor } from './markdown-editor'
import { forumFetch } from '@/lib/forum-client'
import { useUserStore } from '@/store/user'
import { useHydrated } from '@/lib/use-hydrated'
import { withRedirect } from '@/lib/safe-redirect'
import {
  AI_ASSIST, AI_ASSIST_LABELS, ORIGINALITY, ORIGINALITY_LABELS, type AiAssist, type Originality,
} from '@/lib/content/policy'

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
  originality?: string
  sourceUrl?: string | null
  aiAssist?: string
}

export function PostForm({ postId, initial }: { postId?: number; initial?: Initial }) {
  const router = useRouter()
  const { user } = useUserStore()
  const hydrated = useHydrated()
  const isEdit = !!postId

  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState<number | null>(initial?.categoryId ?? null)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [images, setImages] = useState<string[]>(initial?.images ?? [])
  const [tags, setTags] = useState((initial?.tags ?? []).join(' '))
  // 原创声明与 AI 辅助披露（内容平台设计 §6.1 / §6.3）：必选，默认值是最常见的情况
  const [originality, setOriginality] = useState<Originality>(
    (ORIGINALITY as readonly string[]).includes(initial?.originality ?? '') ? (initial!.originality as Originality) : 'ORIGINAL_FIRST',
  )
  const [sourceUrl, setSourceUrl] = useState(initial?.sourceUrl ?? '')
  const [aiAssist, setAiAssist] = useState<AiAssist>(
    (AI_ASSIST as readonly string[]).includes(initial?.aiAssist ?? '') ? (initial!.aiAssist as AiAssist) : 'NONE',
  )
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
    if (originality !== 'ORIGINAL_FIRST' && !/^https?:\/\//i.test(sourceUrl.trim())) {
      return setErr('非首发或转载的内容，请填写原文地址（http:// 或 https:// 开头）')
    }

    setSubmitting(true)
    try {
      const payload = {
        categoryId, title, content, tags, images, originality, aiAssist,
        sourceUrl: originality === 'ORIGINAL_FIRST' ? '' : sourceUrl.trim(),
      }
      const url = isEdit ? `/api/forum/posts/${postId}` : '/api/forum/posts'
      const res = await forumFetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        // 进待审的也跳到帖子页：作者能看到「审核中」提示条（只有本人和管理员能打开）
        router.push(`/forum/${isEdit ? postId : data.data.id}`)
        router.refresh()
      } else {
        setErr(data.error || '提交失败')
      }
    } catch {
      setErr('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  // 内容平台 P0 起发帖须登录（匿名发帖已关闭）。等水合完再判断：zustand persist 在水合那一帧返回 user=null
  if (hydrated && !user) {
    return (
      <div className="glass rounded-2xl p-8 text-center space-y-3">
        <p className="text-white/70">登录后才能发帖</p>
        <p className="text-xs text-white/40">社区内容需要署名；新人发布的内容会先经过审核，工作日 24 小时内处理。</p>
        <Link
          href={withRedirect('/login', isEdit ? `/forum/${postId}/edit` : '/forum/new')}
          className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-semibold"
        >
          去登录
        </Link>
      </div>
    )
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

      {/* 原创声明 + AI 辅助披露 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-white/60 mb-2 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 原创声明
          </label>
          <select
            value={originality}
            onChange={(e) => setOriginality(e.target.value as Originality)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-purple-500/50 [&>option]:bg-gray-900"
          >
            {ORIGINALITY.map((o) => (
              <option key={o} value={o}>{ORIGINALITY_LABELS[o]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-2">正文是否使用 AI 撰写</label>
          <select
            value={aiAssist}
            onChange={(e) => setAiAssist(e.target.value as AiAssist)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-purple-500/50 [&>option]:bg-gray-900"
          >
            {AI_ASSIST.map((o) => (
              <option key={o} value={o}>{AI_ASSIST_LABELS[o]}</option>
            ))}
          </select>
        </div>
      </div>
      {originality !== 'ORIGINAL_FIRST' && (
        <div>
          <label className="block text-sm text-white/60 mb-2">原文地址（必填）</label>
          <input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            maxLength={500}
            placeholder="https://…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 outline-none focus:border-purple-500/50"
          />
        </div>
      )}
      <p className="text-xs text-white/35 leading-relaxed">
        「原创首发」指本站是第一个发布的地方（发到本站前 7 天内只在自己的公众号、博客发过也算）。
        只有原创首发的内容会进入精选；转载请注明来源，并确认已获得授权。出图、截图本身是 AI 生成的不影响这一项，这里问的是文字。
      </p>

      {err && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {err}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40">
          {/* 只显示昵称不显示邮箱：公开作者名已不再回落到邮箱（审计 G48），提示要和实际显示一致 */}
          {user
            ? `以 ${user.nickname && !user.nickname.includes('@') ? user.nickname : '会员（未设置昵称，可在个人中心设置）'} 身份发布 · 新人内容审核后公开`
            : ''}
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
