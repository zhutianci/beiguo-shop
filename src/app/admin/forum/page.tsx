'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus, Pencil, Trash2, Search, Pin, Star, Lock, Eye, EyeOff, ExternalLink, X, MessageCircle, ThumbsUp,
  CheckCircle2, XCircle, RotateCcw, BadgeCheck, Link2,
} from 'lucide-react'
import { CONTENT_TYPE_LABELS, ORIGINALITY_LABELS, type ContentType, type Originality } from '@/lib/content/policy'
import { ContentTagsCard } from '@/components/admin/content-tags-card'
import { ContentReportsCard } from '@/components/admin/content-reports-card'
import { ContentDigestButton } from '@/components/admin/content-digest-button'
import { ContentConversionCard, CreatorApplicationsCard, MonthlyAwardsCard, PointsShopCard, SponsorsCard } from '@/components/admin/content-growth-cards'

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  sortOrder: number
  status: number
  postCount: number
}
interface AdminPost {
  id: number
  title: string
  authorName: string
  isMember: boolean
  category: { name: string; icon: string | null } | null
  pinned: boolean
  featured: boolean
  locked: boolean
  status: number
  reviewStatus: string
  reviewNote: string | null
  originality: string
  sourceUrl: string | null
  aiAssist: string
  deletedAt: string | null
  type: string
  slug: string | null
  excerpt: string | null
  path: string
  verified: boolean
  tagNames: string[]
  qualityReason: string | null
  views: number
  likeCount: number
  commentCount: number
  createdAt: string
}
interface AdminComment {
  id: number
  postId: number
  postTitle: string
  authorName: string
  content: string
  reviewStatus: string
  createdAt: string
}

const PAGE_SIZE = 20

const REVIEW_BADGE: Record<string, { text: string; cls: string }> = {
  PENDING: { text: '待审', cls: 'bg-amber-100 text-amber-700' },
  APPROVED: { text: '已通过', cls: 'bg-green-100 text-green-700' },
  REJECTED: { text: '已驳回', cls: 'bg-red-100 text-red-700' },
}



export default function AdminForumPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [reviewFilter, setReviewFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [pendingCounts, setPendingCounts] = useState({ posts: 0, comments: 0 })
  const [comments, setComments] = useState<AdminComment[]>([])
  const [showComments, setShowComments] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<Category> | null>(null)
  const [saving, setSaving] = useState(false)
  const [catErr, setCatErr] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const loadCategories = async () => {
    const res = await fetch('/api/admin/forum/categories')
    const data = await res.json()
    if (data.success) setCategories(data.data)
  }

  // 搜索防抖
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 350)
    return () => clearTimeout(t)
  }, [keyword])

  const loadPosts = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    try {
      const q = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (debouncedKeyword) q.set('keyword', debouncedKeyword)
      if (statusFilter) q.set('status', statusFilter)
      if (reviewFilter) q.set('review', reviewFilter)
      if (typeFilter) q.set('type', typeFilter)
      const res = await fetch(`/api/admin/forum/posts?${q}`, { signal: controller.signal })
      const data = await res.json()
      if (data.success && abortRef.current === controller) {
        setPosts(data.data.list)
        setTotal(data.data.total || 0)
        setTotalPages(data.data.totalPages || 1)
        if (data.data.pending) setPendingCounts(data.data.pending)
      }
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }, [page, debouncedKeyword, statusFilter, reviewFilter, typeFilter])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  const loadComments = useCallback(async () => {
    const res = await fetch('/api/admin/forum/comments?review=PENDING&pageSize=50')
    const data = await res.json()
    if (data.success) setComments(data.data.list)
  }, [])

  useEffect(() => {
    if (showComments) loadComments()
  }, [showComments, loadComments])

  const reviewComment = async (id: number, reviewStatus: 'APPROVED' | 'REJECTED' | 'DELETE') => {
    if (reviewStatus === 'DELETE' && !confirm('删除这条评论？')) return
    const res = await fetch(`/api/admin/forum/comments/${id}`, {
      method: reviewStatus === 'DELETE' ? 'DELETE' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: reviewStatus === 'DELETE' ? undefined : JSON.stringify({ reviewStatus }),
    })
    const data = await res.json()
    if (data.success) {
      loadComments()
      loadPosts()
    } else alert(data.error || '操作失败')
  }

  // 地址栏 ?review=PENDING / ?tab=comments（待审通知里「去审核」链接带的就是这两个）。
  // 挂载后再读：放进 useState 初始值会让服务端与客户端首帧不一致（水合告警）
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const review = q.get('review')
    if (review === 'PENDING' || review === 'APPROVED' || review === 'REJECTED') setReviewFilter(review)
    if (q.get('tab') === 'comments') setShowComments(true)
  }, [])

  useEffect(() => {
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveCategory = async () => {
    if (!editing) return
    setCatErr(null)
    setSaving(true)
    try {
      const isNew = !editing.id
      const url = isNew ? '/api/admin/forum/categories' : `/api/admin/forum/categories/${editing.id}`
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editing.name,
          slug: editing.slug,
          description: editing.description || null,
          icon: editing.icon || null,
          color: editing.color || null,
          sortOrder: editing.sortOrder ?? 0,
          ...(isNew ? {} : { status: editing.status }),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setEditing(null)
        loadCategories()
      } else {
        setCatErr(data.error || '保存失败')
      }
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (c: Category) => {
    if (!confirm(`删除板块「${c.name}」？`)) return
    const res = await fetch(`/api/admin/forum/categories/${c.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) loadCategories()
    else alert(data.error || '删除失败')
  }

  // 运营与审核操作走后台接口（adminGuard：查库复核 + 同源校验），不再借用前台公开接口
  const postAction = async (id: number, patch: Record<string, unknown>) => {
    if (patch.reviewStatus === 'REJECTED') {
      const note = prompt('驳回原因（作者会在帖子页看到）：')
      if (!note?.trim()) return
      patch = { ...patch, reviewNote: note.trim() }
    }
    const res = await fetch(`/api/admin/forum/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const data = await res.json()
    if (data.success) loadPosts()
    else alert(data.error || '操作失败')
  }
  // 编辑字段：slug（ASCII，决定 URL 后缀）与摘要。用 prompt 输入，够用且不占版面
  const editSlug = (p: AdminPost) => {
    const slug = prompt('URL 后缀 slug（小写字母、数字、连字符；留空 = 只用 id）：', p.slug ?? '')
    if (slug === null) return
    postAction(p.id, { slug: slug.trim() })
  }
  const editExcerpt = (p: AdminPost) => {
    const excerpt = prompt('摘要（160 字以内，显示在列表与搜索结果里；留空 = 自动截取）：', p.excerpt ?? '')
    if (excerpt === null) return
    postAction(p.id, { excerpt: excerpt.trim() })
  }

  const deletePost = async (id: number) => {
    if (!confirm('确定删除该帖子？（软删除，可在「已删除」里恢复）')) return
    const res = await fetch(`/api/admin/forum/posts/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) loadPosts()
    else alert(data.error || '删除失败')
  }

  return (
    <div className="space-y-6">
      {/* 板块管理 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>板块管理</CardTitle>
          <Button size="sm" onClick={() => setEditing({ sortOrder: categories.length + 1, status: 1, icon: '💬' })}>
            <Plus className="w-4 h-4 mr-1" /> 新建板块
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-800">
              <thead>
                <tr className="border-b text-left text-gray-500 text-xs">
                  <th className="pb-2 pr-3">排序</th>
                  <th className="pb-2 pr-3">板块</th>
                  <th className="pb-2 pr-3">slug</th>
                  <th className="pb-2 pr-3">帖子数</th>
                  <th className="pb-2 pr-3">状态</th>
                  <th className="pb-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50/60">
                    <td className="py-2 pr-3 text-gray-400">{c.sortOrder}</td>
                    <td className="py-2 pr-3 font-medium">{c.icon} {c.name}<div className="text-xs text-gray-400 font-normal">{c.description}</div></td>
                    <td className="py-2 pr-3 font-mono text-xs">{c.slug}</td>
                    <td className="py-2 pr-3">{c.postCount}</td>
                    <td className="py-2 pr-3">
                      {c.status === 1 ? (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-green-100 text-green-700">启用</span>
                      ) : (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-xs bg-gray-100 text-gray-500">停用</span>
                      )}
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <button onClick={() => setEditing(c)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-blue-600 hover:bg-blue-50">
                        <Pencil className="w-3 h-3" /> 编辑
                      </button>
                      <button onClick={() => deleteCategory(c)} className="ml-1 inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3 h-3" /> 删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ContentDigestButton />

      <ContentReportsCard />

      <ContentTagsCard />

      {/* 内容平台 P3：增长与变现 */}
      <CreatorApplicationsCard />
      <MonthlyAwardsCard />
      <PointsShopCard />
      <SponsorsCard />
      <ContentConversionCard />

      {/* 待审评论 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            待审评论
            {pendingCounts.comments > 0 && (
              <span className="ml-2 inline-flex rounded-full px-2 py-0.5 text-xs bg-amber-100 text-amber-700">{pendingCounts.comments}</span>
            )}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowComments((v) => !v)}>
            {showComments ? '收起' : '展开'}
          </Button>
        </CardHeader>
        {showComments && (
          <CardContent>
            {comments.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">没有待审评论</div>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="rounded-lg border p-3 text-sm text-gray-800">
                    <div className="flex items-center justify-between gap-2 text-xs text-gray-500">
                      <span>
                        {c.authorName} · 评论于{' '}
                        <a href={`/forum/${c.postId}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{c.postTitle}</a>
                      </span>
                      <span>{new Date(c.createdAt).toLocaleString('zh-CN')}</span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap break-words">{c.content}</p>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => reviewComment(c.id, 'APPROVED')} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-green-700 hover:bg-green-50"><CheckCircle2 className="w-3.5 h-3.5" /> 通过</button>
                      <button onClick={() => reviewComment(c.id, 'REJECTED')} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-amber-700 hover:bg-amber-50"><XCircle className="w-3.5 h-3.5" /> 驳回</button>
                      <button onClick={() => reviewComment(c.id, 'DELETE')} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /> 删除</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* 帖子管理 */}
      <Card>
        <CardHeader>
          <CardTitle>
            帖子管理（共 {total} 条）
            {pendingCounts.posts > 0 && (
              <button
                onClick={() => {
                  setReviewFilter('PENDING')
                  setPage(1)
                }}
                className="ml-2 inline-flex rounded-full px-2 py-0.5 text-xs bg-amber-100 text-amber-700 hover:bg-amber-200"
              >
                {pendingCounts.posts} 篇待审
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索标题/作者..."
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900"
            >
              <option value="">全部状态</option>
              <option value="1">正常</option>
              <option value="0">已隐藏</option>
              <option value="deleted">已删除</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900"
            >
              <option value="">全部类型</option>
              <option value="DISCUSSION">讨论</option>
              <option value="PROMPT">提示词</option>
              <option value="GUIDE">教程</option>
              <option value="APP">AI 应用</option>
            </select>
            <select
              value={reviewFilter}
              onChange={(e) => {
                setReviewFilter(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900"
            >
              <option value="">全部审核状态</option>
              <option value="PENDING">待审（先到先审）</option>
              <option value="APPROVED">已通过</option>
              <option value="REJECTED">已驳回</option>
            </select>
            <Button variant="outline" onClick={loadPosts}>
              <Search className="w-4 h-4 mr-1" /> 刷新
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无帖子</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="border-b text-left text-gray-500 text-xs">
                    <th className="pb-2 pr-3">标题</th>
                    <th className="pb-2 pr-3">作者</th>
                    <th className="pb-2 pr-3">板块</th>
                    <th className="pb-2 pr-3">数据</th>
                    <th className="pb-2 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p.id} className={`border-b hover:bg-gray-50/60 ${p.status === 0 ? 'opacity-50' : ''}`}>
                      <td className="py-2 pr-3 max-w-[280px]">
                        <div className="flex items-center gap-1.5">
                          {p.pinned && <Pin className="w-3 h-3 text-red-500" />}
                          {p.featured && <Star className="w-3 h-3 text-amber-500" />}
                          {p.locked && <Lock className="w-3 h-3 text-gray-400" />}
                          <span className="font-medium truncate">{p.title}</span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px]">
                          <span className="rounded px-1.5 bg-indigo-50 text-indigo-700">{CONTENT_TYPE_LABELS[p.type as ContentType] ?? p.type}</span>
                          {p.verified && <span className="rounded px-1.5 bg-emerald-50 text-emerald-700">实测可用</span>}
                          {p.tagNames.length > 0 && <span className="text-gray-500">{p.tagNames.join(' / ')}</span>}
                          {p.qualityReason && <span className="text-gray-400" title="总开关打开后也不会被收录的原因">不收录：{p.qualityReason}</span>}
                          <span className={`rounded px-1.5 ${REVIEW_BADGE[p.reviewStatus]?.cls ?? 'bg-gray-100 text-gray-500'}`}>
                            {REVIEW_BADGE[p.reviewStatus]?.text ?? p.reviewStatus}
                          </span>
                          <span className="rounded px-1.5 bg-gray-100 text-gray-600">
                            {ORIGINALITY_LABELS[p.originality as Originality] ?? p.originality}
                          </span>
                          {p.aiAssist === 'MAJOR' && <span className="rounded px-1.5 bg-gray-100 text-gray-600">AI 主笔</span>}
                          {p.deletedAt && <span className="rounded px-1.5 bg-red-50 text-red-600">已删除</span>}
                          {p.reviewNote && <span className="text-gray-400 truncate" title={p.reviewNote}>原因：{p.reviewNote}</span>}
                        </div>
                      </td>
                      <td className="py-2 pr-3">{p.authorName}{!p.isMember && <span className="text-xs text-gray-400">·匿名</span>}</td>
                      <td className="py-2 pr-3 text-xs">{p.category?.icon} {p.category?.name}</td>
                      <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">
                        <span className="inline-flex items-center gap-0.5 mr-2"><Eye className="w-3 h-3" />{p.views}</span>
                        <span className="inline-flex items-center gap-0.5 mr-2"><ThumbsUp className="w-3 h-3" />{p.likeCount}</span>
                        <span className="inline-flex items-center gap-0.5"><MessageCircle className="w-3 h-3" />{p.commentCount}</span>
                      </td>
                      <td className="py-2 text-right whitespace-nowrap">
                        <a href={p.path} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs px-1.5 py-1 rounded text-gray-500 hover:bg-gray-100" title="查看">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        {p.deletedAt ? (
                          <button onClick={() => postAction(p.id, { restore: true })} className="ml-0.5 text-xs px-1.5 py-1 rounded text-blue-600 hover:bg-blue-50" title="恢复"><RotateCcw className="w-3.5 h-3.5" /></button>
                        ) : (
                          <>
                            {p.reviewStatus !== 'APPROVED' && (
                              <button onClick={() => postAction(p.id, { reviewStatus: 'APPROVED' })} className="ml-0.5 text-xs px-1.5 py-1 rounded text-green-600 hover:bg-green-50" title="审核通过"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                            )}
                            {p.reviewStatus !== 'REJECTED' && (
                              <button onClick={() => postAction(p.id, { reviewStatus: 'REJECTED' })} className="text-xs px-1.5 py-1 rounded text-amber-600 hover:bg-amber-50" title="驳回（需填原因）"><XCircle className="w-3.5 h-3.5" /></button>
                            )}
                            {p.type !== 'DISCUSSION' && (
                              <>
                                <button onClick={() => postAction(p.id, { verified: !p.verified })} className={`text-xs px-1.5 py-1 rounded hover:bg-gray-100 ${p.verified ? 'text-emerald-600' : 'text-gray-500'}`} title="实测可用（编辑亲自复现成功后再点）"><BadgeCheck className="w-3.5 h-3.5" /></button>
                                <button onClick={() => editSlug(p)} className="text-xs px-1.5 py-1 rounded text-gray-500 hover:bg-gray-100" title={`URL 后缀：${p.slug || '（未设）'}`}><Link2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => editExcerpt(p)} className="text-xs px-1.5 py-1 rounded text-gray-500 hover:bg-gray-100" title="编辑摘要"><Pencil className="w-3.5 h-3.5" /></button>
                              </>
                            )}
                          </>
                        )}
                        <button onClick={() => postAction(p.id, { pinned: !p.pinned })} className={`ml-0.5 text-xs px-1.5 py-1 rounded hover:bg-gray-100 ${p.pinned ? 'text-red-500' : 'text-gray-500'}`} title="置顶"><Pin className="w-3.5 h-3.5" /></button>
                        <button onClick={() => postAction(p.id, { featured: !p.featured })} className={`text-xs px-1.5 py-1 rounded hover:bg-gray-100 ${p.featured ? 'text-amber-500' : 'text-gray-500'}`} title="加精"><Star className="w-3.5 h-3.5" /></button>
                        <button onClick={() => postAction(p.id, { locked: !p.locked })} className={`text-xs px-1.5 py-1 rounded hover:bg-gray-100 ${p.locked ? 'text-gray-800' : 'text-gray-500'}`} title="锁帖"><Lock className="w-3.5 h-3.5" /></button>
                        <button onClick={() => postAction(p.id, { status: p.status === 1 ? 0 : 1 })} className="text-xs px-1.5 py-1 rounded text-gray-500 hover:bg-gray-100" title={p.status === 1 ? '隐藏' : '恢复'}>{p.status === 1 ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                        <button onClick={() => deletePost(p.id)} className="text-xs px-1.5 py-1 rounded text-red-600 hover:bg-red-50" title="删除"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-sm text-gray-500">
                共 {total} 条 · 第 {page} / {totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
                  上一页
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(p + 1, totalPages))}>
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 板块编辑弹窗 */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !saving && setEditing(null)}>
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">{editing.id ? '编辑板块' : '新建板块'}</h3>
              <button onClick={() => setEditing(null)} className="p-1 rounded hover:bg-gray-100 text-gray-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-[80px_1fr] gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">图标</label>
                  <input value={editing.icon || ''} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="💬" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-center" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">名称</label>
                  <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">slug（英文唯一标识，建后不建议改）</label>
                <input value={editing.slug || ''} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} disabled={!!editing.id} placeholder="feedback" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 font-mono text-sm disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">描述</label>
                <input value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">排序</label>
                  <input type="number" value={editing.sortOrder ?? 0} onChange={(e) => setEditing({ ...editing, sortOrder: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900" />
                </div>
                {editing.id != null && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">状态</label>
                    <select value={editing.status ?? 1} onChange={(e) => setEditing({ ...editing, status: parseInt(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900">
                      <option value={1}>启用</option>
                      <option value={0}>停用</option>
                    </select>
                  </div>
                )}
              </div>
              {catErr && <p className="text-sm text-red-600">{catErr}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>取消</Button>
                <Button onClick={saveCategory} loading={saving}>保存</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
