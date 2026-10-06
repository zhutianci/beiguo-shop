/**
 * AI 学习平台的服务端积木（/learn、/prompts、/guides、专题、作者页共用，内容平台改版 2026-10-06）。
 *
 * 设计语言见 globals.css「AI 学习平台」一段：编辑型暗色、大留白、强字阶、发丝细线、克制的强调色。
 * 这里全是服务端组件（不加 'use client'）：标题、摘要、链接、分页都要在服务端 HTML 里。交互在 learn/ 下的 *-client.tsx。
 */
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight, ArrowUpRight, BadgeCheck, Clock, Copy, MessageCircle, Star } from 'lucide-react'
import type { Crumb } from '@/lib/seo/graph'
import type { ContentCard } from '@/lib/content/queries'

export const LEARN_HOME = { name: 'AI 学习', path: '/learn' }

/** 页面外壳：学习平台专属背景 + 版心 */
export function LearnPage({ children, wide = true }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="learn-page min-h-screen page-top pb-24">
      <div className={`container relative ${wide ? 'max-w-7xl' : 'max-w-5xl'}`}>{children}</div>
    </div>
  )
}

/** 小号面包屑（与 BreadcrumbList JSON-LD 逐级一致，最后一级不带链接） */
export function Crumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="面包屑" className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] text-white/40">
      {crumbs.map((c, i) => (
        <span key={`${c.name}-${i}`} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-white/20">/</span>}
          {c.path ? (
            <Link href={c.path} className="hover:text-white transition-colors">
              {c.name}
            </Link>
          ) : (
            <span className="text-white/65">{c.name}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

/** 页首：眉标 · 大标题 · 导语 · 右侧动作 · 下方数据行 */
export function PageHead({
  eyebrow,
  title,
  accent,
  lede,
  action,
  stats,
}: {
  eyebrow?: string
  title: string
  accent?: string
  lede?: string
  action?: ReactNode
  stats?: { label: string; value: string | number }[]
}) {
  return (
    <header className="learn-in mb-10 lg:mb-14">
      {eyebrow && <p className="learn-eyebrow mb-4">{eyebrow}</p>}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h1 className="learn-display">
            {title}
            {accent && <span className="learn-accent-text"> {accent}</span>}
          </h1>
          {lede && <p className="mt-5 text-[15px] lg:text-[17px] leading-relaxed text-white/55">{lede}</p>}
        </div>
        {action}
      </div>
      {stats && stats.length > 0 && (
        <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3 border-t border-white/[0.08] pt-6">
          {stats.map((s) => (
            <div key={s.label} className="flex items-baseline gap-2">
              <dt className="sr-only">{s.label}</dt>
              <dd className="text-2xl font-semibold tabular-nums text-white">{s.value}</dd>
              <span className="text-sm text-white/40">{s.label}</span>
            </div>
          ))}
        </dl>
      )}
    </header>
  )
}

export function PrimaryAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-transform duration-300 hover:-translate-y-0.5 lg:self-auto"
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
    </Link>
  )
}

/** 区块标题：左标题、右「查看全部」 */
export function SectionHead({ title, desc, href, more = '查看全部' }: { title: string; desc?: string; href?: string; more?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl lg:text-2xl font-semibold tracking-tight">{title}</h2>
        {desc && <p className="mt-1.5 text-sm text-white/45">{desc}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1 text-sm text-white/55 hover:text-white">
          {more}
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  )
}

/**
 * 吸顶筛选条：横向滚动的胶囊。全部是 <a>（服务端渲染、可抓取），当前项高亮。
 * 不用毛玻璃（手机端轻量模式），底色近乎不透明。
 */
export function FilterBar({ groups, active }: { groups: { label: string; items: { name: string; href: string; count?: number }[] }[]; active: string }) {
  const visible = groups.filter((g) => g.items.length)
  if (!visible.length) return null
  return (
    <div className="learn-sticky -mx-4 mb-8 px-4 pb-4 pt-2 lg:-mx-0 lg:px-0">
      <div className="space-y-2.5">
        {visible.map((g) => (
          <div key={g.label} className="flex items-center gap-3">
            <span className="hidden w-8 shrink-0 text-xs text-white/35 sm:block">{g.label}</span>
            <div className="learn-scroll-x -mr-4 flex gap-2 pr-6 lg:mr-0">
              {g.items.map((t) => (
                <Link key={t.href} href={t.href} data-active={active === t.href} className="learn-chip" scroll={false}>
                  {t.name}
                  {typeof t.count === 'number' && <span className="text-[11px] opacity-50 tabular-nums">{t.count}</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────── 提示词卡片 ───────────────────────────────

/** 瀑布流里的提示词：图按真实比例占位（没有记录宽高的按 4:5），信息在图下方 */
export function PromptShot({ c, priority = false }: { c: ContentCard; priority?: boolean }) {
  const ratio = c.coverW && c.coverH ? `${c.coverW} / ${c.coverH}` : '4 / 5'
  return (
    <Link href={c.path} className="learn-shot group block">
      <div className="learn-media relative" style={{ aspectRatio: ratio }}>
        {c.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.cover}
            alt={c.title}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-white/25">待出图</div>
        )}
        {/* AI 生成内容的显式标识（《人工智能生成合成内容标识办法》，设计 §6.6） */}
        {c.cover && <span className="absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-white/80">AI 生成</span>}
        {c.featured && (
          <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-black">
            <Star className="h-3 w-3" /> 精选
          </span>
        )}
      </div>
      <div className="px-1 pt-3">
        <h3 className="line-clamp-2 text-[14.5px] font-medium leading-snug text-white/90 group-hover:text-white">{c.title}</h3>
        <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-white/40">
          <span className="truncate">{c.modelName ?? c.authorName}</span>
          <span className="inline-flex shrink-0 items-center gap-2 tabular-nums">
            {c.verified && <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" aria-label="实测可用" />}
            <span className="inline-flex items-center gap-0.5">
              <Copy className="h-3 w-3" />
              {c.copyCount}
            </span>
          </span>
        </div>
      </div>
    </Link>
  )
}

export function PromptMasonry({ items, eager = 4 }: { items: ContentCard[]; eager?: number }) {
  return (
    <div className="learn-masonry">
      {items.map((c, i) => (
        <div key={c.id} className="learn-in" style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}>
          <PromptShot c={c} priority={i < eager} />
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────── 教程卡片 ───────────────────────────────

function productNames(c: ContentCard) {
  return c.tags.filter((t) => t.kind === 'PRODUCT').map((t) => t.name)
}

/** 头条教程：大卡（首页与教程页第一篇） */
export function GuideFeature({ c }: { c: ContentCard }) {
  return (
    <Link href={c.path} className="learn-card learn-lift group flex h-full flex-col justify-between overflow-hidden p-7 lg:p-9">
      <div>
        <div className="mb-5 flex flex-wrap gap-2">
          {productNames(c).map((n) => (
            <span key={n} className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-white/60">{n}</span>
          ))}
          {c.featured && <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-black">精选</span>}
        </div>
        <h3 className="text-2xl lg:text-[28px] font-semibold leading-tight tracking-tight">{c.title}</h3>
        <p className="mt-4 line-clamp-3 text-[15px] leading-relaxed text-white/55">{c.excerpt}</p>
      </div>
      <div className="mt-8 flex items-center justify-between text-sm text-white/40">
        <span>{c.authorName}</span>
        <span className="inline-flex items-center gap-1 text-white/70 group-hover:text-white">
          阅读 <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}

/** 教程列表行：编号 + 标题 + 摘要 + 元信息 */
export function GuideRows({ items, start = 1 }: { items: ContentCard[]; start?: number }) {
  return (
    <ol className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
      {items.map((c, i) => (
        <li key={c.id}>
          <Link href={c.path} className="group grid grid-cols-[2.5rem_1fr] gap-4 py-5 lg:grid-cols-[3rem_1fr_auto] lg:items-center">
            <span className="pt-0.5 text-sm tabular-nums text-white/25">{String(start + i).padStart(2, '0')}</span>
            <div className="min-w-0">
              <h3 className="text-[15.5px] lg:text-[17px] font-medium leading-snug text-white/90 transition-colors group-hover:text-white">{c.title}</h3>
              <p className="mt-1 line-clamp-1 text-sm text-white/45">{c.excerpt}</p>
            </div>
            <div className="col-start-2 flex items-center gap-4 text-xs text-white/35 lg:col-start-3">
              {productNames(c).slice(0, 2).map((n) => (
                <span key={n}>{n}</span>
              ))}
              <span className="inline-flex items-center gap-1 tabular-nums">
                <MessageCircle className="h-3 w-3" />
                {c.commentCount}
              </span>
              <ArrowUpRight className="hidden h-4 w-4 text-white/30 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white lg:block" />
            </div>
          </Link>
        </li>
      ))}
    </ol>
  )
}

/** 讨论帖（作者页用）：沿用教程行样式 */
export const DiscussionRows = GuideRows

// ─────────────────────────────── 专题卡 ───────────────────────────────

export interface HubTile {
  slug: string
  name: string
  kind: string
  count: number
  covers: string[]
}

export function hubHref(t: { kind: string; slug: string }): string {
  return t.kind === 'MODEL' ? `/prompts/m/${t.slug}` : t.kind === 'TOPIC' ? `/prompts/t/${t.slug}` : `/guides/p/${t.slug}`
}

/** 模型专题卡：三张最新出图拼成封面 */
export function ModelTile({ t }: { t: HubTile }) {
  const covers = t.covers.slice(0, 3)
  return (
    <Link href={hubHref(t)} className="learn-card learn-lift group block overflow-hidden p-2">
      <div className="grid aspect-[16/10] grid-cols-3 gap-1 overflow-hidden rounded-[14px]">
        {[0, 1, 2].map((i) =>
          covers[i] ? (
            <div key={i} className="learn-media relative rounded-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={covers[i]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          ) : (
            <div key={i} className="bg-white/[0.04]" />
          ),
        )}
      </div>
      <div className="flex items-center justify-between px-3 pb-2 pt-3.5">
        <span className="font-medium">{t.name}</span>
        <span className="text-xs tabular-nums text-white/40">{t.count} 条</span>
      </div>
    </Link>
  )
}

export function Pager({ basePath, page, totalPages }: { basePath: string; page: number; totalPages: number }) {
  if (totalPages <= 1) return null
  const href = (n: number) => (n <= 1 ? basePath : `${basePath}?page=${n}`)
  const pages: number[] = []
  for (let n = Math.max(1, page - 2); n <= Math.min(totalPages, page + 2); n++) pages.push(n)
  const cls = 'inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm transition-colors'
  return (
    <nav aria-label="分页" className="mt-14 flex items-center justify-center gap-1.5">
      {page > 1 && <Link href={href(page - 1)} rel="prev" className={`${cls} text-white/60 hover:bg-white/5 hover:text-white`}>上一页</Link>}
      {pages.map((n) =>
        n === page ? (
          <span key={n} aria-current="page" className={`${cls} bg-white font-semibold text-black`}>{n}</span>
        ) : (
          <Link key={n} href={href(n)} className={`${cls} text-white/60 hover:bg-white/5 hover:text-white`}>{n}</Link>
        ),
      )}
      {page < totalPages && <Link href={href(page + 1)} rel="next" className={`${cls} text-white/60 hover:bg-white/5 hover:text-white`}>下一页</Link>}
    </nav>
  )
}

export function Empty({ title, desc, href, cta }: { title: string; desc?: string; href?: string; cta?: string }) {
  return (
    <div className="learn-card flex flex-col items-center px-6 py-16 text-center">
      <p className="text-lg font-medium text-white/80">{title}</p>
      {desc && <p className="mt-2 max-w-md text-sm text-white/45">{desc}</p>}
      {href && cta && (
        <Link href={href} className="mt-6 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black">
          {cta}
        </Link>
      )}
    </div>
  )
}

export function MetaDot() {
  return <span className="text-white/20">·</span>
}

export function ReadTime({ minutes }: { minutes: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Clock className="h-3.5 w-3.5" /> {minutes} 分钟读完
    </span>
  )
}

/** 骨架屏（loading.tsx 用）：瀑布流 */
export function MasonrySkeleton({ n = 12 }: { n?: number }) {
  const ratios = ['4 / 5', '1 / 1', '3 / 4', '4 / 5', '2 / 3', '1 / 1']
  return (
    <div className="learn-masonry">
      {Array.from({ length: n }, (_, i) => (
        <div key={i}>
          <div className="learn-skeleton" style={{ aspectRatio: ratios[i % ratios.length] }} />
          <div className="learn-skeleton mt-3 h-4 w-3/4" />
        </div>
      ))}
    </div>
  )
}

/** ?page= 解析：非正整数一律当 1；超出范围由页面自己 404 */
export function pageParam(v: string | string[] | undefined): number {
  const n = Number(Array.isArray(v) ? v[0] : v)
  return Number.isInteger(n) && n > 0 ? n : 1
}
