import Link from 'next/link'
import { CATEGORIES, type CategorySlug } from '@/lib/news/constants'

/**
 * 六个分类页的服务端 <a>（SEO 批 3 的 E1）：/news 与 /news/c/* 都放一排，
 * 给爬虫一条从大事记首页走到分类分页、再走到每一条可索引事件的路（时间流的分类按钮是客户端切换，不产生链接）。
 */
export function CategoryNav({ current, className = 'mt-5' }: { current?: CategorySlug; className?: string }) {
  return (
    <nav aria-label="按分类浏览" className={`${className} flex flex-wrap gap-2`}>
      {CATEGORIES.map((c) => (
        <Link
          key={c.slug}
          href={`/news/c/${c.slug}`}
          aria-current={c.slug === current ? 'page' : undefined}
          title={c.hint}
          className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${c.slug === current ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20 hover:text-white/85'}`}
        >
          {c.label}
        </Link>
      ))}
    </nav>
  )
}
