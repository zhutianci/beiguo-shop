'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  Search,
  PlusCircle,
  Pin,
  Star,
  Eye,
  ThumbsUp,
  MessageCircle,
  Flame,
  Clock,
  Lock,
  Sparkles,
} from 'lucide-react'
import { timeAgo } from '@/lib/forum-client'

interface Category {
  id: number
  name: string
  slug: string
  icon: string | null
  postCount: number
}
interface PostItem {
  id: number
  title: string
  excerpt: string
  authorName: string
  isMember: boolean
  category: { name: string; slug: string; icon: string | null }
  tags: string[]
  pinned: boolean
  featured: boolean
  locked: boolean
  views: number
  likeCount: number
  commentCount: number
  lastReplyAt: string | null
  createdAt: string
}

const SORTS = [
  { key: 'latest', label: '最新', icon: Clock },
  { key: 'hot', label: '最热', icon: Flame },
  { key: 'featured', label: '精华', icon: Sparkles },
]

export default function ForumPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [posts, setPosts] = useState<PostItem[]>([])
  const [cat, setCat] = useState('all')
  const [sort, setSort] = useState('latest')
  const [keyword, setKeyword] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/forum/categories')
      .then((r) => r.json())
      .then((d) => d.success && setCategories(d.data))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams({ category: cat, sort, page: String(page), pageSize: '20' })
      if (search) q.set('keyword', search)
      const res = await fetch(`/api/forum/posts?${q}`)
      const data = await res.json()
      if (data.success) {
        setPosts(data.data.list)
        setTotalPages(data.data.totalPages)
        setTotal(data.data.total)
      }
    } finally {
      setLoading(false)
    }
  }, [cat, sort, page, search])

  useEffect(() => {
    load()
  }, [load])

  const totalPostCount = categories.reduce((s, c) => s + c.postCount, 0)

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container relative max-w-5xl">
        {/* 标题 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white/80">社区论坛</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="gradient-text">交流</span>
            <span className="gradient-text-accent"> · 反馈 · 分享</span>
          </h1>
          <p className="text-white/50">已有 {totalPostCount} 个主题，欢迎一起讨论</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          {/* 侧栏：板块 */}
          <aside className="space-y-2">
            <button
              onClick={() => {
                setCat('all')
                setPage(1)
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${
                cat === 'all' ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white' : 'glass text-white/70 hover:text-white'
              }`}
            >
              <span>🗂 全部板块</span>
              <span className="text-xs opacity-70">{totalPostCount}</span>
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCat(c.slug)
                  setPage(1)
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${
                  cat === c.slug ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white' : 'glass text-white/70 hover:text-white'
                }`}
              >
                <span>{c.icon} {c.name}</span>
                <span className="text-xs opacity-70">{c.postCount}</span>
              </button>
            ))}
            <Link
              href="/forum/new"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition-colors mt-4"
            >
              <PlusCircle className="w-4 h-4" /> 发帖
            </Link>
          </aside>

          {/* 主区 */}
          <main>
            {/* 工具栏 */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="flex items-center gap-1 glass rounded-xl p-1">
                {SORTS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setSort(s.key)
                      setPage(1)
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all ${
                      sort === s.key ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'
                    }`}
                  >
                    <s.icon className="w-3.5 h-3.5" /> {s.label}
                  </button>
                ))}
              </div>
              <div className="flex-1 flex items-center gap-2 glass rounded-xl px-3">
                <Search className="w-4 h-4 text-white/40" />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSearch(keyword.trim())
                      setPage(1)
                    }
                  }}
                  placeholder="搜索帖子标题或内容..."
                  className="flex-1 bg-transparent py-2.5 text-white placeholder:text-white/30 outline-none text-sm"
                />
                {search && (
                  <button
                    onClick={() => {
                      setKeyword('')
                      setSearch('')
                      setPage(1)
                    }}
                    className="text-xs text-white/40 hover:text-white"
                  >
                    清除
                  </button>
                )}
              </div>
            </div>

            {/* 列表 */}
            {loading ? (
              <div className="text-center py-20 text-white/40">加载中...</div>
            ) : posts.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50 mb-4">这里还没有帖子，来发第一篇吧</p>
                <Link href="/forum/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 font-medium">
                  <PlusCircle className="w-4 h-4" /> 发帖
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link href={`/forum/${p.id}`} className="block glass rounded-2xl p-5 hover:bg-white/[0.07] transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            {p.pinned && (
                              <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">
                                <Pin className="w-3 h-3" /> 置顶
                              </span>
                            )}
                            {p.featured && (
                              <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                                <Star className="w-3 h-3" /> 精华
                              </span>
                            )}
                            <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                              {p.category.icon} {p.category.name}
                            </span>
                            {p.locked && <Lock className="w-3 h-3 text-white/40" />}
                          </div>
                          <h3 className="font-semibold text-lg text-white truncate">{p.title}</h3>
                          {p.excerpt && <p className="text-sm text-white/40 mt-1 line-clamp-2">{p.excerpt}</p>}
                          <div className="flex items-center gap-3 mt-3 text-xs text-white/40 flex-wrap">
                            <span className="text-white/60">{p.authorName}{!p.isMember && ' · 匿名'}</span>
                            <span>{timeAgo(p.lastReplyAt || p.createdAt)}</span>
                            {p.tags.map((t) => (
                              <span key={t} className="text-purple-300/70">#{t}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 text-xs text-white/40 shrink-0">
                          <span className="inline-flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{p.commentCount}</span>
                          <span className="inline-flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" />{p.likeCount}</span>
                          <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{p.views}</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 rounded-lg glass text-sm disabled:opacity-40 hover:bg-white/10"
                >
                  上一页
                </button>
                <span className="text-sm text-white/50 px-2">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-lg glass text-sm disabled:opacity-40 hover:bg-white/10"
                >
                  下一页
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
