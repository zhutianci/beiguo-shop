'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Filter, Loader2, Sparkles } from 'lucide-react'
import { ContactModal } from '@/components/contact-modal'
import { captureRefFromUrl } from '@/lib/ref'

interface Category {
  id: number
  name: string
  icon: string | null
}

interface Product {
  id: number
  categoryId: number
  name: string
  description: string | null
  price: string | number
  originalPrice: string | number | null
  features: string | null
  stock: number
  sales: number
  deliveryType?: string
  category: { id: number; name: string }
}

const gradients = [
  'from-violet-600 to-purple-600',
  'from-purple-600 to-pink-600',
  'from-pink-600 to-rose-600',
  'from-emerald-600 to-teal-600',
  'from-teal-600 to-cyan-600',
  'from-cyan-600 to-blue-600',
  'from-amber-600 to-orange-600',
]

function getGradient(id: number) {
  return gradients[id % gradients.length]
}

function getTag(product: Product) {
  const name = product.name.toLowerCase()
  if (name.includes('20x')) return 'ULTIMATE'
  if (name.includes('5x')) return '5X POWER'
  if (name.includes('pro') && name.includes('chatgpt')) return 'o1 ACCESS'
  if (name.includes('plus')) return 'GPT-4'
  if (name.includes('pro')) return 'POPULAR'
  return 'NEW'
}

function parseFeatures(features: string | null): string[] {
  if (!features) return []
  try {
    const parsed = JSON.parse(features)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// 每次加载的商品数量（分段懒加载）
const PAGE_SIZE = 12

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState(0)
  const [contactOpen, setContactOpen] = useState(false)
  const [ref, setRef] = useState<string | null>(null)
  // 内推码要在浏览器里读，读到之前先不发商品请求，避免重复拉一次
  const [refReady, setRefReady] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // 首次挂载：读内推码 + 拉分类
  useEffect(() => {
    setRef(captureRefFromUrl())
    setRefReady(true)
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.data)
      })
      .catch(() => {})
  }, [])

  // 拉某一页商品：append=true 追加到列表尾部（加载更多）
  const loadPage = useCallback(
    async (targetPage: number, append: boolean) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      if (append) setLoadingMore(true)
      else setLoading(true)
      try {
        const q = new URLSearchParams({ page: String(targetPage), pageSize: String(PAGE_SIZE) })
        if (selectedCategory) q.set('categoryId', String(selectedCategory))
        if (ref) q.set('ref', ref)
        const res = await fetch(`/api/products?${q}`, { signal: controller.signal })
        const data = await res.json()
        if (data.success && abortRef.current === controller) {
          const d = data.data as { list: Product[]; total: number; page: number; totalPages: number }
          setProducts((prev) => (append ? [...prev, ...d.list] : d.list))
          setPage(d.page)
          setTotalPages(d.totalPages)
          setTotal(d.total)
        }
      } catch (e) {
        if ((e as { name?: string })?.name === 'AbortError') return
      } finally {
        if (abortRef.current === controller) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [selectedCategory, ref]
  )

  // 切换分类（或拿到内推码后）：清空并重新从第 1 页拉
  useEffect(() => {
    if (!refReady) return
    setProducts([])
    setPage(1)
    setTotalPages(1)
    loadPage(1, false)
  }, [refReady, loadPage])

  const hasMore = page < totalPages

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white/80">精选订阅服务</span>
          </div>
          <h1 className="text-headline mb-4">
            <span className="gradient-text">选择你的</span>
            <span className="gradient-text-accent"> AI 助手</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            专业团队，正规渠道，快速开通，售后无忧
          </p>
        </motion.div>

        {ref && (
          <div className="max-w-xl mx-auto mb-8 text-center text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2">
            🎁 您正在通过专属推广链接访问，已为您应用专属价格
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex items-center gap-2 p-1.5 rounded-full glass flex-wrap justify-center">
            <button
              onClick={() => setSelectedCategory(0)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === 0
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <span>✨</span>
              <span>全部</span>
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-white text-black'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-20 text-white/40">加载中...</div>
        ) : products.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Filter className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40">该分类下暂无商品</p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => {
              const gradient = getGradient(product.id)
              const tag = getTag(product)
              const features = parseFeatures(product.features)
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: (index % PAGE_SIZE) * 0.05 }}
                  layout
                >
                  <Link href={`/products/${product.id}`}>
                    <div className="group relative h-full">
                      <div
                        className={`absolute -inset-[1px] bg-gradient-to-r ${gradient} rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500`}
                      />

                      <div className="relative h-full glass rounded-2xl p-6 hover-lift flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${gradient}`}
                          >
                            {tag}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              ¥{Number(product.price).toFixed(0)}
                            </div>
                            {product.originalPrice && (
                              <div className="text-sm text-white/30 line-through">
                                ¥{Number(product.originalPrice).toFixed(0)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-2xl font-bold">{product.name}</h3>
                          {product.deliveryType === 'AUTO' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                              ⚡ 自动发货
                            </span>
                          ) : product.deliveryType === 'SMS' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-teal-500/15 text-teal-300 border border-teal-500/30 whitespace-nowrap">
                              📱 短信接码
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-white/60 border border-white/15 whitespace-nowrap">
                              👤 手工发货
                            </span>
                          )}
                        </div>
                        <p className="text-white/50 text-sm mb-6">
                          {product.description}
                        </p>

                        {features.length > 0 && (
                          <div className="flex-1 grid grid-cols-2 gap-2 mb-4">
                            {features.map((feature, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-sm text-white/60"
                              >
                                <div
                                  className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${gradient}`}
                                />
                                {feature}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 销量 + 库存 */}
                        <div className="flex items-center justify-between text-xs text-white/40 mb-4 px-1">
                          <span>已售 {product.sales}</span>
                          <span>
                            {product.stock === -1
                              ? '现货充足'
                              : product.stock === 0
                                ? '已售罄'
                                : `余量 ${product.stock}`}
                          </span>
                        </div>

                        <div
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r ${gradient} font-medium group-hover:shadow-lg group-hover:shadow-purple-500/20 transition-all`}
                        >
                          立即购买
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* 分段加载：加载更多 */}
        {!loading && products.length > 0 && (
          <div className="mt-12 flex flex-col items-center gap-3">
            {hasMore ? (
              <button
                onClick={() => loadPage(page + 1, true)}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full glass text-sm text-white/80 hover:bg-white/10 disabled:opacity-40 transition-colors"
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                {loadingMore ? '加载中...' : '加载更多'}
              </button>
            ) : (
              <span className="text-sm text-white/30">没有更多了</span>
            )}
            <span className="text-xs text-white/30">
              已显示 {products.length} / {total} 件商品
            </span>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-20 text-center"
        >
          <button
            onClick={() => setContactOpen(true)}
            className="inline-flex items-center gap-6 px-8 py-4 rounded-full glass hover:bg-white/10 text-sm text-white/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              在线客服
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div>微信: GenuineMarxist</div>
            <div className="w-px h-4 bg-white/10" />
            <div>9:00 - 22:00</div>
          </button>
        </motion.div>
      </div>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  )
}
