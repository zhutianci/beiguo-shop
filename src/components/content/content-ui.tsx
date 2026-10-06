/**
 * 内容平台的服务端积木（列表卡片、列表页外壳、分页、标签条）。
 *
 * 全部是服务端组件、不加 'use client'：卡片标题、摘要、链接、分页都要出现在服务端 HTML 里
 * （交接文档：以前论坛整页客户端渲染，爬虫一个字都看不到）。需要交互的部分放在 prompt-block.tsx。
 */
import Link from 'next/link'
import type { ReactNode } from 'react'
import { BadgeCheck, Copy, MessageCircle, Star, ThumbsUp } from 'lucide-react'
import { Breadcrumbs } from '@/components/landing/landing-ui'
import type { Crumb } from '@/lib/seo/graph'
import type { ContentCard } from '@/lib/content/queries'

export function PageBackdrop() {
  return (
    <>
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      {/* lite-blob：手机端轻量模式下大模糊光斑换成渐变遮罩（规则见 globals.css 末尾，判定逻辑勿改） */}
      <div className="fixed top-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[128px] lite-blob pointer-events-none" />
    </>
  )
}

/** 列表页外壳：面包屑 · H1 · 站方介绍 · 标签条 · 主体 · 分页 */
export function ListShell({
  crumbs,
  h1,
  lede,
  introHtml,
  nav,
  action,
  children,
}: {
  crumbs: Crumb[]
  h1: string
  lede?: string
  introHtml?: string | null
  nav?: ReactNode
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-screen page-top pb-20">
      <PageBackdrop />
      <div className="container relative">
        <Breadcrumbs crumbs={crumbs} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">
              <span className="gradient-text">{h1}</span>
            </h1>
            {lede && <p className="text-white/50 lg:text-lg max-w-3xl">{lede}</p>}
          </div>
          {action}
        </div>
        {introHtml && (
          <div
            className="prose-forum glass rounded-2xl p-5 lg:p-6 mb-6 text-white/80 max-w-4xl"
            dangerouslySetInnerHTML={{ __html: introHtml }}
          />
        )}
        {nav}
        {children}
      </div>
    </div>
  )
}

export function TagNav({
  groups,
  active,
}: {
  groups: { label: string; items: { name: string; href: string }[] }[]
  active?: string
}) {
  return (
    <nav aria-label="分类" className="mb-6 space-y-2">
      {groups
        .filter((g) => g.items.length)
        .map((g) => (
          <div key={g.label} className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-white/40 w-10 shrink-0">{g.label}</span>
            {g.items.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`text-sm px-3 py-1 rounded-full transition-colors ${
                  active === t.href ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'glass text-white/65 hover:text-white'
                }`}
              >
                {t.name}
              </Link>
            ))}
          </div>
        ))}
    </nav>
  )
}

/** 提示词：图片卡片网格（效果图在前，设计 §5.1） */
export function PromptGrid({ items }: { items: ContentCard[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
      {items.map((c) => (
        <Link key={c.id} href={c.path} className="group glass rounded-2xl overflow-hidden flex flex-col hover:bg-white/10 transition-colors">
          <div className="relative aspect-square bg-white/5">
            {c.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.cover} alt={c.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/20 text-sm">无预览图</div>
            )}
            {/* AI 生成内容的显式标识（《人工智能生成合成内容标识办法》，设计 §6.6） */}
            {c.cover && <span className="absolute left-2 bottom-2 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white/80">AI 生成</span>}
            {c.featured && (
              <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/90 text-black font-semibold">
                <Star className="w-3 h-3" /> 精选
              </span>
            )}
          </div>
          <div className="p-3 flex-1 flex flex-col gap-1.5">
            <h2 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-white">{c.title}</h2>
            <div className="mt-auto flex items-center justify-between gap-2 text-[11px] text-white/40">
              <span className="truncate">{c.modelName ?? c.authorName}</span>
              <span className="inline-flex items-center gap-2 shrink-0">
                {c.verified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" aria-label="实测可用" />}
                <span className="inline-flex items-center gap-0.5"><Copy className="w-3 h-3" />{c.copyCount}</span>
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

/** 教程 / 讨论：文字列表 */
export function ArticleList({ items }: { items: ContentCard[] }) {
  return (
    <div className="space-y-3">
      {items.map((c) => (
        <Link key={c.id} href={c.path} className="block glass rounded-2xl p-4 lg:p-5 hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {c.featured && (
              <span className="inline-flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                <Star className="w-3 h-3" /> 精选
              </span>
            )}
            {c.tags
              .filter((t) => t.kind === 'PRODUCT')
              .map((t) => (
                <span key={t.slug} className="text-[11px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">{t.name}</span>
              ))}
          </div>
          <h2 className="text-base lg:text-lg font-semibold mb-1">{c.title}</h2>
          <p className="text-sm text-white/50 line-clamp-2">{c.excerpt}</p>
          <div className="mt-2 flex items-center gap-4 text-xs text-white/35">
            <span>{c.authorName}</span>
            <span>{c.createdAt.slice(0, 10)}</span>
            <span className="inline-flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{c.likeCount}</span>
            <span className="inline-flex items-center gap-1"><MessageCircle className="w-3 h-3" />{c.commentCount}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

/**
 * 分页：真实的 <a href="?page=n">（设计 §4.2：每页独立 URL、canonical 自指；无限滚动只能是增强）。
 * 第 1 页的链接不带 ?page=1，免得同一页两个地址。
 */
export function Pagination({ basePath, page, totalPages }: { basePath: string; page: number; totalPages: number }) {
  if (totalPages <= 1) return null
  const href = (n: number) => (n <= 1 ? basePath : `${basePath}?page=${n}`)
  const pages: number[] = []
  for (let n = Math.max(1, page - 2); n <= Math.min(totalPages, page + 2); n++) pages.push(n)
  return (
    <nav aria-label="分页" className="mt-8 flex items-center justify-center gap-2 text-sm">
      {page > 1 && <Link href={href(page - 1)} rel="prev" className="px-3 py-1.5 rounded-lg glass text-white/70 hover:text-white">上一页</Link>}
      {pages.map((n) =>
        n === page ? (
          <span key={n} aria-current="page" className="px-3 py-1.5 rounded-lg bg-white/15 text-white">{n}</span>
        ) : (
          <Link key={n} href={href(n)} className="px-3 py-1.5 rounded-lg glass text-white/60 hover:text-white">{n}</Link>
        ),
      )}
      {page < totalPages && <Link href={href(page + 1)} rel="next" className="px-3 py-1.5 rounded-lg glass text-white/70 hover:text-white">下一页</Link>}
    </nav>
  )
}

export function EmptyState({ text, href, cta }: { text: string; href?: string; cta?: string }) {
  return (
    <div className="glass rounded-2xl p-10 text-center text-white/50">
      <p className="mb-4">{text}</p>
      {href && cta && (
        <Link href={href} className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold">
          {cta}
        </Link>
      )}
    </div>
  )
}

/** 详情页底部：相关内容分组 */
export function RelatedGroups({ groups, type }: { groups: { title: string; items: ContentCard[] }[]; type: string }) {
  if (!groups.length) return null
  return (
    <section className="mt-10 space-y-8">
      {groups.map((g) => (
        <div key={g.title}>
          <h2 className="text-lg font-bold mb-4">{g.title}</h2>
          {type === 'PROMPT' ? <PromptGrid items={g.items} /> : <ArticleList items={g.items} />}
        </div>
      ))}
    </section>
  )
}

/** ?page= 解析：非正整数一律当 1；超出范围由页面自己 404 */
export function pageParam(v: string | string[] | undefined): number {
  const n = Number(Array.isArray(v) ? v[0] : v)
  return Number.isInteger(n) && n > 0 ? n : 1
}
