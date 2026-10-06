'use client'

/**
 * 后台：举报队列（内容平台 P2，设计 §10.1）。按目标聚合，显示被举报次数与理由。
 *  - 举报成立：内容下线（帖子软删除 / 评论驳回），作者 −50 积分
 *  - 驳回举报：恢复被自动隐藏的内容（3 人举报会自动隐藏）
 */
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Group {
  targetKey: string
  postId: number | null
  commentId: number | null
  count: number
  reasons: string[]
  details: string[]
  post: { id: number; title: string; status: number } | null
  comment: { id: number; content: string; postId: number; reviewStatus: string } | null
}

const REASON: Record<string, string> = { SPAM: '垃圾', AD: '广告引流', PLAGIARISM: '抄袭搬运', WRONG: '错误失效', ILLEGAL: '违法违规', OTHER: '其他' }

export function ContentReportsCard() {
  const [list, setList] = useState<Group[] | null>(null)
  const [open, setOpen] = useState(false)
  const load = async () => {
    const res = await fetch('/api/admin/content/reports')
    const d = await res.json()
    if (d.success) setList(d.data.list)
  }
  useEffect(() => {
    load()
    if (new URLSearchParams(window.location.search).get('tab') === 'reports') setOpen(true)
  }, [])
  const act = async (targetKey: string, action: 'uphold' | 'dismiss') => {
    if (action === 'uphold' && !confirm('确认举报成立？内容将下线，作者扣 50 积分。')) return
    const res = await fetch('/api/admin/content/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetKey, action }) })
    const d = await res.json()
    if (d.success) load()
    else alert(d.error || '操作失败')
  }
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          举报队列
          {!!list?.length && <span className="ml-2 inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">{list.length}</span>}
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>{open ? '收起' : '展开'}</Button>
      </CardHeader>
      {open && (
        <CardContent>
          {!list ? (
            <div className="py-6 text-center text-sm text-gray-400">加载中…</div>
          ) : !list.length ? (
            <div className="py-6 text-center text-sm text-gray-400">没有待处理的举报</div>
          ) : (
            <div className="space-y-3">
              {list.map((g) => (
                <div key={g.targetKey} className="rounded-lg border p-3 text-sm text-gray-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      {g.post ? (
                        <a href={`/forum/${g.post.id}`} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline">
                          {g.post.title}
                        </a>
                      ) : g.comment ? (
                        <a href={`/forum/${g.comment.postId}#c-${g.comment.id}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                          评论：{g.comment.content.slice(0, 60)}
                        </a>
                      ) : (
                        <span className="text-gray-400">（目标已不存在）</span>
                      )}
                      {(g.post?.status === 0 || g.comment?.reviewStatus === 'PENDING') && <span className="ml-2 rounded bg-amber-100 px-1.5 text-xs text-amber-700">已自动隐藏</span>}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => act(g.targetKey, 'uphold')} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">举报成立（下线）</button>
                      <button type="button" onClick={() => act(g.targetKey, 'dismiss')} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">驳回举报（恢复）</button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {g.count} 人举报：{Array.from(new Set(g.reasons)).map((r) => REASON[r] ?? r).join('、')}
                    {g.details.length > 0 && ` —— ${g.details.slice(0, 3).join(' / ')}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
