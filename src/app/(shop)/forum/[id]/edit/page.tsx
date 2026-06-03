'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { PostForm } from '@/components/forum/post-form'
import { forumFetch } from '@/lib/forum-client'

export default function EditPostPage() {
  const params = useParams()
  const id = Number(params.id)
  const [initial, setInitial] = useState<any>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'denied' | 'notfound'>('loading')

  useEffect(() => {
    forumFetch(`/api/forum/posts/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return setState('notfound')
        if (!d.data.canEdit) return setState('denied')
        setInitial({
          title: d.data.title,
          content: d.data.content,
          images: d.data.images || [],
          tags: d.data.tags || [],
          categoryId: d.data.categoryId,
        })
        setState('ok')
      })
      .catch(() => setState('notfound'))
  }, [id])

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="container relative max-w-3xl">
        <Link href={`/forum/${id}`} className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> 返回帖子
        </Link>
        <h1 className="text-3xl font-bold mb-6 gradient-text">编辑帖子</h1>
        {state === 'loading' && <div className="text-white/40">加载中...</div>}
        {state === 'denied' && <div className="glass rounded-2xl p-8 text-center text-white/60">你没有权限编辑这篇帖子</div>}
        {state === 'notfound' && <div className="glass rounded-2xl p-8 text-center text-white/60">帖子不存在</div>}
        {state === 'ok' && initial && <PostForm postId={id} initial={initial} />}
      </div>
    </div>
  )
}
