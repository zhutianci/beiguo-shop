import Link from 'next/link'
import { ArrowRight, BookOpen, LayoutGrid, Newspaper, Sparkles } from 'lucide-react'
import { hotNewsEvents } from '@/lib/news/hot'
import type { NewsEventDto } from '@/lib/news/format'
import { storefrontCached } from '@/lib/storefront/cache'
import { OPERATOR_NAME } from '@/lib/portal'

/**
 * 门户站首页（docs/门户站-bigoai.md）：站点介绍 + AI学习各栏目入口 + 大事记热点。
 * 不出任何商品、价格、充值、支付字样（门户站只做内容；主站首页那套 HomeClient 整份不用）。
 * 热点与主站首页同一口径（lib/news/hot.ts），缓存 60 秒；取不到就不出这一块，不让首页 500。
 */
const cachedHot = storefrontCached('portal-hot-news', async (_id: number) => hotNewsEvents(6), 60_000)

const LEARN = [
  { href: '/prompts', name: '提示词库', desc: '写作、编程、科研、图像生成的结构化提示词，附适用模型与效果示例，可直接复制', icon: Sparkles },
  { href: '/guides', name: '使用教程', desc: '常见 AI 工具的上手与进阶教程，写清测试日期与操作步骤', icon: BookOpen },
  { href: '/apps', name: 'AI 应用', desc: '实用的 AI 应用与工具介绍，说明适合做什么、怎么开始用', icon: LayoutGrid },
  { href: '/news', name: 'AI圈大事记', desc: '按事件聚合的 AI 行业动态：模型发布、产品更新、论文与开源工具，每条附原文出处', icon: Newspaper },
]

function day(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export async function PortalHome({ siteName }: { siteName: string }) {
  let hot: NewsEventDto[] = []
  try {
    hot = await cachedHot(0)
  } catch (e) {
    console.error('[portal-home] hot news', e)
  }

  return (
    <div className="page-top pb-20">
      <section className="container relative pb-16 pt-6 lg:pb-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm tracking-[0.2em] text-white/40">AI 学习 · AI 行业动态</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight lg:text-6xl">{siteName}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/55 lg:text-lg">
            整理可复制的 AI 提示词与实测教程，按事件汇总每天的 AI 行业动态，帮你更快学会用好 AI 工具。
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/learn" className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-white/90">
              进入 AI 学习
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/news" className="inline-flex h-12 items-center rounded-full border border-white/15 px-6 text-sm text-white/80 hover:border-white/30 hover:text-white">
              看今日 AI 动态
            </Link>
          </div>
        </div>
      </section>

      <section className="container relative pb-16" aria-labelledby="portal-learn-heading">
        <div className="mx-auto max-w-6xl">
          <h2 id="portal-learn-heading" className="mb-8 text-2xl font-bold lg:text-3xl">栏目</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LEARN.map(({ href, name, desc, icon: Icon }) => (
              <Link key={href} href={href} className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.04]">
                <Icon className="mb-4 h-5 w-5 text-purple-300" />
                <span className="font-semibold text-white transition-colors group-hover:text-purple-300">{name}</span>
                <span className="mt-2 text-sm leading-relaxed text-white/45">{desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {hot.length > 0 && (
        <section className="container relative pb-16" aria-labelledby="portal-news-heading">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-end justify-between gap-4">
              <h2 id="portal-news-heading" className="text-2xl font-bold lg:text-3xl">AI 圈热点</h2>
              <Link href="/news" className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300">
                全部动态
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ul className="divide-y divide-white/[0.06] rounded-2xl border border-white/10 bg-white/[0.02]">
              {hot.map((e) => (
                <li key={e.id}>
                  <Link href={`/news/${e.slug}`} className="group block px-5 py-4 transition-colors hover:bg-white/[0.03]">
                    <div className="mb-1 flex items-center gap-2 text-xs text-white/35">
                      <span>{e.categoryLabel}</span>
                      <span aria-hidden>·</span>
                      <span>{day(e.happenedAt)}</span>
                    </div>
                    <div className="font-medium text-white/90 group-hover:text-white">{e.headline}</div>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-white/45">{e.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="container relative" aria-labelledby="portal-about-heading">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-white/[0.02] p-6 lg:p-8">
          <h2 id="portal-about-heading" className="mb-3 text-lg font-semibold">关于本站</h2>
          <p className="text-sm leading-relaxed text-white/50">
            {siteName}由{OPERATOR_NAME}运营。大事记由 AI 依据公开信源整理摘要，每条都附原文链接，请以原文为准；教程与提示词注明了测试日期，AI 工具更新频繁，界面与功能可能有变化。
            <Link href="/about" className="ml-1 text-purple-400 hover:text-purple-300">了解更多</Link>
          </p>
        </div>
      </section>
    </div>
  )
}
