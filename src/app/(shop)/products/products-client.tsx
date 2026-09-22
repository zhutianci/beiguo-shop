'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, LayoutGrid, List as ListIcon, Sparkles } from 'lucide-react'
import { ContactModal } from '@/components/contact-modal'
import { captureRefFromUrl } from '@/lib/ref'
import { ProductThumb } from '@/components/products/product-thumb'
import { PRODUCT_GRADIENT, deliveryBadge, productTag } from '@/components/products/gradient'
import { STOCK_TONE_CLASS, stockLevel } from '@/lib/stock-level'

/**
 * 商品列表页。
 *
 * 【这一版把取数从客户端搬回了服务端】原来整页靠 useEffect + fetch('/api/products')
 * 分页拉数据，有三个问题：
 *   1. 服务端 HTML 里一个商品名都没有（robots.txt 还 disallow 了 /api/，
 *      「Google 会执行 JS」这条退路不成立）；
 *   2. 每次切分类都要发一次请求，肉眼可见的等待；
 *   3. 首屏要等一个往返才有内容。
 * 现在 20 个在售商品由服务端一次取好当 props 传进来——客户端组件同样会被 SSR，
 * 所以商品名、价格、分类全部落在首屏 HTML 里。切分类、换视图都是内存操作，零请求。
 * 商品只有二十来个，全量下发比分页简单得多，也快得多；真涨到几百个再谈分页。
 *
 * 【两种视图】列表模式信息密度高（一屏扫完型号和价格），是默认；
 * 卡片模式是原来那套，保留给习惯它的人。选择记在 localStorage。
 * 服务端固定渲染列表模式，客户端挂载后才读偏好——避免 hydration 不一致。
 *
 * 【库存只给档位不给数字】理由见 lib/stock-level.ts。
 * 能不能下单仍由服务端下单接口按真实库存判定，这里只管显示。
 */

export interface ListProduct {
  id: number
  categoryId: number
  name: string
  description: string | null
  price: number
  originalPrice: number | null
  image: string | null
  stock: number
  sales: number
  deliveryType?: string | null
  categoryName: string
}

type ViewMode = 'list' | 'card'
const VIEW_KEY = 'bg_products_view'
const ALL = 0

export default function ProductsClient({ products }: { products: ListProduct[] }) {
  const [mode, setMode] = useState<ViewMode>('list')
  const [category, setCategory] = useState<number>(ALL)
  const [contactOpen, setContactOpen] = useState(false)
  const [ref, setRef] = useState<string | null>(null)
  /** 内推专属价覆盖表：productId → price。拿不到就用列表价，不阻塞渲染 */
  const [refPrice, setRefPrice] = useState<Record<number, number>>({})

  // 挂载后再读偏好与内推码：这两样都只存在于浏览器，在渲染期读会造成 hydration 不一致
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY)
      if (saved === 'card' || saved === 'list') setMode(saved)
    } catch {
      // 隐私模式下 localStorage 会抛，用默认值就行
    }
    setRef(captureRefFromUrl())
  }, [])

  // 带内推码时覆盖价格。只发这一次，失败就沿用列表价（宁可显示原价，也不要空白）
  useEffect(() => {
    if (!ref) return
    let alive = true
    fetch(`/api/products?ref=${encodeURIComponent(ref)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive || !d?.success) return
        const rows = Array.isArray(d.data) ? d.data : d.data?.list
        if (!Array.isArray(rows)) return
        const map: Record<number, number> = {}
        for (const p of rows) map[p.id] = Number(p.price)
        setRefPrice(map)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [ref])

  function pick(m: ViewMode) {
    setMode(m)
    try {
      localStorage.setItem(VIEW_KEY, m)
    } catch {
      /* 存不下不影响使用 */
    }
  }

  const priceOf = (p: ListProduct) => refPrice[p.id] ?? p.price

  // 分类取自商品本身，不另查一张表：这样不会出现「点进去是空的」的分类
  const categories = useMemo(() => {
    const m = new Map<number, string>()
    for (const p of products) if (!m.has(p.categoryId)) m.set(p.categoryId, p.categoryName)
    return Array.from(m, ([id, name]) => ({ id, name }))
  }, [products])

  const visible = useMemo(
    () => (category === ALL ? products : products.filter((p) => p.categoryId === category)),
    [products, category]
  )

  /** 列表模式：按分类分组，组内按价格升序（便宜的在前，买家先看得起的那一档） */
  const grouped = useMemo(() => {
    const m = new Map<string, ListProduct[]>()
    for (const p of visible) {
      const arr = m.get(p.categoryName)
      if (arr) arr.push(p)
      else m.set(p.categoryName, [p])
    }
    // 用 Array.from 而不是 for...of 直接迭代 Map：tsconfig 的 target 不开
    // downlevelIteration，直接迭代 MapIterator 编译不过
    const entries = Array.from(m.entries())
    for (const [, arr] of entries) arr.sort((a, b) => priceOf(a) - priceOf(b))
    return entries
    // priceOf 依赖 refPrice，内推价到了要重排
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, refPrice])

  return (
    /* 【不要在这里再写 page-top】page.tsx 里那个面包屑容器已经带了一层
       （padding-top = --header-h + 1rem = 128px）。两层叠起来是 256px 的顶部空白，
       首屏进来看到的是一大片黑。这里只留一点和面包屑之间的呼吸感。 */
    <div className="min-h-screen pt-4 pb-20 lg:pb-28">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container relative">
        <div className="text-center mb-10 lg:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-white/80">全部在售商品</span>
          </div>
          <h1 className="text-headline mb-4">
            <span className="gradient-text">AI 会员充值</span>
            <span className="gradient-text-accent"> 价目表</span>
          </h1>
          {/* 原来这里写的是「专业团队，正规渠道，快速开通，售后无忧」——四句都无从核验。
              换成买家真正要确认的三件事，每一条页面上都兑现得了 */}
          <p className="text-white/50 text-base lg:text-lg max-w-2xl mx-auto leading-relaxed">
            卡密自助兑换，账号不经手；支付宝付款，无需境外支付方式；
            <br className="hidden sm:block" />
            标价均为不含税价，需要增值税发票的另付 6% 税费。
          </p>
        </div>

        {ref && (
          <div className="max-w-xl mx-auto mb-8 text-center text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2">
            🎁 你正在通过专属推广链接访问，已应用专属价格
          </div>
        )}

        {/* 分类 + 视图切换。sticky 让它在长列表里一直够得着，
            top 跟着 --header-h 走，不写死数值 */}
        {/* 吸顶只在 sm 以上开。手机端头部本身就占 112px（--header-h），
            再吸一条筛选栏，812px 的屏幕去掉三分之一，列表反而看不见几行。 */}
        <div
          className="z-20 mb-8 -mx-4 px-4 py-3 sm:sticky sm:backdrop-blur-xl"
          style={{ top: 'var(--header-h, 96px)' }}
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full glass flex-wrap justify-center">
              <CatBtn active={category === ALL} onClick={() => setCategory(ALL)}>
                全部
                <span className="ml-1.5 text-[11px] opacity-50">{products.length}</span>
              </CatBtn>
              {categories.map((c) => {
                const n = products.filter((p) => p.categoryId === c.id).length
                return (
                  <CatBtn key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
                    {c.name}
                    <span className="ml-1.5 text-[11px] opacity-50">{n}</span>
                  </CatBtn>
                )
              })}
            </div>

            <div className="inline-flex items-center gap-1 p-1.5 rounded-full glass" role="group" aria-label="展示方式">
              <ViewBtn active={mode === 'list'} onClick={() => pick('list')} label="列表模式">
                <ListIcon className="w-4 h-4" />
              </ViewBtn>
              <ViewBtn active={mode === 'card'} onClick={() => pick('card')} label="卡片模式">
                <LayoutGrid className="w-4 h-4" />
              </ViewBtn>
            </div>
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="text-center py-20 text-white/40">该分类下暂无在售商品</p>
        ) : mode === 'list' ? (
          <div className="mx-auto max-w-5xl space-y-10">
            {grouped.map(([cat, items]) => (
              <section key={cat} aria-labelledby={`cat-${cat}`}>
                <div className="mb-3 flex items-baseline gap-3">
                  <h2 id={`cat-${cat}`} className="text-lg lg:text-xl font-semibold text-white/90">
                    {cat}
                  </h2>
                  <span className="text-xs text-white/30">{items.length} 款 · 按价格从低到高</span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10 divide-y divide-white/[0.06]">
                  {items.map((p) => (
                    <ProductRow key={p.id} p={p} price={priceOf(p)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
            {visible.map((p) => (
              <ProductCard key={p.id} p={p} price={priceOf(p)} />
            ))}
          </div>
        )}

        <div className="mt-16 lg:mt-20 text-center">
          <button
            onClick={() => setContactOpen(true)}
            className="inline-flex items-center gap-6 lg:gap-8 px-8 py-4 lg:px-10 rounded-full glass hover:bg-white/10 text-sm lg:text-[15px] text-white/60 transition-colors"
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
        </div>
      </div>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  )
}

/* ---------------------------------------------------------------- */

function CatBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}

function ViewBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`rounded-full p-2 transition-colors ${
        active ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}

function StockPill({ stock }: { stock: number }) {
  const s = stockLevel(stock)
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${STOCK_TONE_CLASS[s.tone]}`}
    >
      {s.label}
    </span>
  )
}

/**
 * 列表模式的一行。整行可点，命中区域比「只有标题是链接」大得多。
 *
 * 【手机端要单独想过】375px 宽下，把「名称 + 档位标签 + 交付方式 + 描述 + 库存 + 价格」
 * 挤在一行里会换到三行、缩略图和价格错位、整行高度失控。实测之后改成：
 *   · 名称单行截断（truncate + min-w-0），保证每一行等高、缩略图和价格永远对齐
 *   · 第二行放交付方式和库存档位——这两条是下单前必须看见的，不能藏
 *   · 描述和档位标签属于「有更好、没有也不影响决策」，只在 sm 以上出现
 * 库存档位原来写的是 hidden sm:block，等于手机端完全看不到库存，这是漏的。
 */
function ProductRow({ p, price }: { p: ListProduct; price: number }) {
  const badge = deliveryBadge(p.deliveryType || undefined)
  const tag = productTag(p.name)
  const cut = p.originalPrice != null && p.originalPrice > price
  return (
    <Link
      href={`/products/${p.id}`}
      className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.04] focus-visible:bg-white/[0.06] focus-visible:outline-none sm:gap-4 sm:px-5 sm:py-4"
    >
      <ProductThumb id={p.id} name={p.name} image={p.image} size={44} className="sm:hidden" />
      <ProductThumb id={p.id} name={p.name} image={p.image} size={52} className="hidden sm:block" />

      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium text-white/90 transition-colors group-hover:text-white">
            {p.name}
          </span>
          {tag && (
            <span
              className={`hidden shrink-0 rounded px-1.5 py-px text-[10px] font-bold text-white sm:inline bg-gradient-to-r ${PRODUCT_GRADIENT(p.id)}`}
            >
              {tag}
            </span>
          )}
        </div>
        <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${badge.cls}`}>
            {badge.label}
          </span>
          <StockPill stock={p.stock} />
          {p.description && (
            <span className="hidden truncate text-xs text-white/30 sm:inline">{p.description}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-right">
          <div className="whitespace-nowrap text-base font-bold text-white sm:text-lg">
            ￥{price.toFixed(0)}
          </div>
          {cut && (
            <div className="whitespace-nowrap text-[11px] text-white/30 line-through">
              ￥{p.originalPrice!.toFixed(0)}
            </div>
          )}
          <div className="whitespace-nowrap text-[11px] text-white/30">已售 {p.sales}</div>
        </div>
        <ArrowRight className="hidden h-4 w-4 shrink-0 text-white/25 transition-transform group-hover:translate-x-0.5 group-hover:text-white/60 sm:block" />
      </div>
    </Link>
  )
}

/** 卡片模式。保留原来的观感，只把库存换成档位、图片接进来 */
function ProductCard({ p, price }: { p: ListProduct; price: number }) {
  const gradient = PRODUCT_GRADIENT(p.id)
  const badge = deliveryBadge(p.deliveryType || undefined)
  const cut = p.originalPrice != null && p.originalPrice > price
  return (
    <Link href={`/products/${p.id}`} className="group block h-full">
      <div className="relative h-full">
        <div
          className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r ${gradient} opacity-0 blur-sm transition-opacity duration-500 group-hover:opacity-100`}
        />
        <div className="relative flex h-full flex-col rounded-2xl glass p-6 hover-lift lg:p-7">
          <div className="mb-4 flex items-start justify-between gap-3">
            <ProductThumb id={p.id} name={p.name} image={p.image} size={48} />
            <div className="text-right">
              <div className="text-2xl font-bold lg:text-3xl">￥{price.toFixed(0)}</div>
              {cut && (
                <div className="text-sm text-white/30 line-through">￥{p.originalPrice!.toFixed(0)}</div>
              )}
            </div>
          </div>

          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold">{p.name}</h3>
            <span className={`rounded-full border px-2 py-0.5 text-[11px] ${badge.cls}`}>
              {badge.label}
            </span>
          </div>

          {p.description && (
            <p className="mb-6 flex-1 text-sm leading-relaxed text-white/50 lg:text-[15px]">
              {p.description}
            </p>
          )}

          <div className="mb-4 flex items-center justify-between px-1 text-xs text-white/40 lg:text-sm">
            <span>已售 {p.sales}</span>
            <StockPill stock={p.stock} />
          </div>

          <div
            className={`flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${gradient} py-3 font-medium transition-all group-hover:shadow-lg group-hover:shadow-purple-500/20 lg:py-3.5 lg:text-[15px]`}
          >
            查看详情
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  )
}
