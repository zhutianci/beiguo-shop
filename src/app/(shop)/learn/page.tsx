import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, BookOpen, Camera, MessagesSquare, Sparkles } from 'lucide-react'
import { countIndexable, learnHomeData } from '@/lib/content/queries'
import { isHubIndexable } from '@/lib/content/policy'
import { SITE_NAME } from '@/lib/product-seo'
import { OG_IMAGES, OG_SITE } from '@/lib/seo/og'
import { siteOrigin } from '@/lib/news/format'
import {
  GuideFeature,
  GuideRows,
  LearnPage,
  ModelTile,
  PromptMasonry,
  SectionHead,
  hubHref,
} from '@/components/learn/ui'

/**
 * AI 学习平台首页（内容平台改版 2026-10-06）。
 *
 * 不沿用论坛的「板块 + 帖子列表」架构，按「学什么」组织：精选提示词（看得见的效果）→ 模型专题 → 教程 → 主题 → 创作者 → 投稿。
 * 全部服务端直出；收录跟随内容平台的总开关（公开内容够数才放开，policy.isHubIndexable 的 ROOT 门槛）。
 */
export const dynamic = 'force-dynamic'

const TITLE = `AI 学习平台：可复制的提示词、实测教程与玩法案例 - ${SITE_NAME}`
const DESCRIPTION = 'ChatGPT、Claude、GPT-Image、Nano Banana、Seedance 等工具的实测教程与可复制提示词，每条附效果图、模型和测试日期。'

export async function generateMetadata(): Promise<Metadata> {
  // 与 /sitemap-content.xml 同一个口径：按「可收录」的提示词 + 教程条数算，不按公开条数
  const indexable = isHubIndexable('ROOT', 0, await countIndexable({ type: { in: ['PROMPT', 'GUIDE'] } }))
  return {
    metadataBase: new URL(siteOrigin()),
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: '/learn' },
    ...(indexable ? {} : { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } }),
    openGraph: { ...OG_SITE, type: 'website', title: TITLE, description: DESCRIPTION, url: '/learn', images: OG_IMAGES },
  }
}

export default async function LearnHome() {
  const d = await learnHomeData()
  const models = d.hubs.filter((h) => h.kind === 'MODEL')
  const topics = d.hubs.filter((h) => h.kind === 'TOPIC')
  const products = d.hubs.filter((h) => h.kind === 'PRODUCT')
  const heroShots = d.prompts.filter((p) => p.cover).slice(0, 5)

  return (
    <LearnPage>
      {/* —— 首屏 —— */}
      <section className="learn-in grid items-center gap-12 pb-16 pt-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:pb-24 lg:pt-10">
        <div>
          <p className="learn-eyebrow mb-6">Bigo AI Learning · AI 学习平台</p>
          <h1 className="learn-display">
            学会用 AI，
            <br />
            <span className="learn-accent-text">从可复制的实战开始</span>
          </h1>
          <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/55 lg:text-[18px]">
            每一条提示词都附作者自己的出图和模型参数，每一篇教程都写明测试日期与账号类型。不搬运、不注水，拿来就能用。
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/prompts" className="group inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-black transition-transform duration-300 hover:-translate-y-0.5">
              浏览提示词库 <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link href="/guides" className="inline-flex h-12 items-center gap-2 rounded-full border border-white/15 px-6 text-[15px] text-white/80 transition-colors hover:border-white/30 hover:text-white">
              看教程
            </Link>
          </div>
          <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-3">
            {[
              { v: d.totals.prompt, l: '条提示词' },
              { v: d.totals.guide, l: '篇教程' },
              { v: d.totals.discussion, l: '个讨论' },
            ].map((x) => (
              <div key={x.l} className="flex items-baseline gap-2">
                <dd className="text-3xl font-semibold tabular-nums">{x.v}</dd>
                <dt className="text-sm text-white/40">{x.l}</dt>
              </div>
            ))}
          </dl>
        </div>

        {/* 右侧：最新出图拼贴（没有内容时显示三张抽象占位，不留空洞） */}
        <div className="relative hidden h-[460px] lg:block" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => {
            const shot = heroShots[i]
            const pos = [
              'left-[6%] top-[4%] h-[58%] w-[40%] rotate-[-4deg]',
              'left-[50%] top-0 h-[44%] w-[34%] rotate-[3deg]',
              'left-[34%] top-[40%] h-[56%] w-[36%] rotate-[-1deg]',
              'left-[74%] top-[46%] h-[40%] w-[26%] rotate-[5deg]',
              'left-0 top-[66%] h-[32%] w-[30%] rotate-[2deg]',
            ][i]
            return (
              <div
                key={i}
                className={`learn-media absolute ${pos} border border-white/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] transition-transform duration-700 hover:rotate-0`}
              >
                {shot?.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shot.cover} alt="" className="h-full w-full object-cover" loading={i < 2 ? 'eager' : 'lazy'} />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{
                      background: [
                        'linear-gradient(135deg,#4c1d95,#be185d)',
                        'linear-gradient(135deg,#0f766e,#1e3a8a)',
                        'linear-gradient(135deg,#7c2d12,#a21caf)',
                        'linear-gradient(135deg,#1e293b,#6d28d9)',
                        'linear-gradient(135deg,#155e75,#4338ca)',
                      ][i],
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* —— 四个入口 —— */}
      <section className="mb-20 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: '/prompts', icon: Camera, t: '提示词库', s: '生图与视频，复制即用' },
          { href: '/guides', icon: BookOpen, t: '教程', s: 'ChatGPT / Claude / Codex 实测' },
          { href: '/forum', icon: MessagesSquare, t: '讨论', s: '提问、反馈、经验交流' },
          { href: '/forum/new?type=PROMPT', icon: Sparkles, t: '投稿', s: '原创首发，优先精选' },
        ].map((x, i) => (
          <Link key={x.href} href={x.href} className="learn-card learn-lift learn-in group flex items-center gap-4 p-5" style={{ animationDelay: `${i * 50}ms` }}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-white/80 transition-colors group-hover:bg-white group-hover:text-black">
              <x.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-medium">{x.t}</span>
              <span className="block truncate text-sm text-white/45">{x.s}</span>
            </span>
            <ArrowUpRight className="ml-auto h-4 w-4 text-white/25 transition-colors group-hover:text-white" />
          </Link>
        ))}
      </section>

      {/* —— 精选提示词 —— */}
      {d.prompts.length > 0 && (
        <section className="mb-24">
          <SectionHead title="精选提示词" desc="作者实测、附出图；高亮的 [变量] 换成你的内容就能用" href="/prompts" />
          <PromptMasonry items={d.prompts} />
        </section>
      )}

      {/* —— 模型专题 —— */}
      {models.length > 0 && (
        <section className="mb-24">
          <SectionHead title="按模型学" desc="同一类效果，在不同模型上的写法不一样" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {models.map((m) => (
              <ModelTile key={m.slug} t={m} />
            ))}
          </div>
        </section>
      )}

      {/* —— 教程 —— */}
      {d.guides.length > 0 && (
        <section className="mb-24">
          <SectionHead title="最新教程" desc="每篇注明测试日期与账号类型；功能在变，日期就是可信度" href="/guides" />
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
            <GuideFeature c={d.guides[0]} />
            {d.guides.length > 1 ? <GuideRows items={d.guides.slice(1)} start={2} /> : <div />}
          </div>
          {products.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {products.map((p) => (
                <Link key={p.slug} href={hubHref(p)} className="learn-chip">
                  {p.name} 教程 <span className="text-[11px] opacity-50">{p.count}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* —— 主题 —— */}
      {topics.length > 0 && (
        <section className="mb-24">
          <SectionHead title="按场景找" desc="证件照、电商主图、海报、手办……从你要做的东西出发" />
          <div className="flex flex-wrap gap-2.5">
            {topics.map((t) => (
              <Link key={t.slug} href={hubHref(t)} className="learn-chip !px-5 !py-2.5 !text-[15px]">
                {t.name} <span className="text-xs opacity-50">{t.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* —— 创作者 + 投稿 —— */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="learn-card p-7 lg:p-9">
          <p className="learn-eyebrow mb-4">Creators · 创作者</p>
          {d.creators.length ? (
            <ol className="space-y-3">
              {d.creators.map((c, i) => (
                <li key={c.href}>
                  <Link href={c.href} className="group flex items-center gap-3">
                    <span className="w-5 text-sm tabular-nums text-white/30">{i + 1}</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 text-xs font-bold text-black">
                      {c.name.slice(0, 1)}
                    </span>
                    <span className="flex-1 truncate text-white/80 group-hover:text-white">{c.name}</span>
                    <span className="text-xs tabular-nums text-white/40">{c.count} 篇</span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-white/45">还没有上榜的创作者，第一位就是你。</p>
          )}
        </div>
        <div className="learn-card relative overflow-hidden p-7 lg:p-9">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(167,139,250,0.35),transparent)]" />
          <p className="learn-eyebrow mb-4">Contribute · 投稿</p>
          <h2 className="text-2xl font-semibold tracking-tight lg:text-3xl">分享你亲手跑通的东西</h2>
          <ul className="mt-5 space-y-2 text-[15px] text-white/60">
            <li>· 提示词附上你自己的出图，教程写明测试日期</li>
            <li>· 原创首发的内容优先进入精选，署名展示</li>
            <li>· 新人内容先审后发，工作日 24 小时内处理</li>
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/forum/new?type=PROMPT" className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-black">分享提示词</Link>
            <Link href="/forum/new?type=GUIDE" className="inline-flex h-11 items-center rounded-full border border-white/15 px-5 text-sm text-white/80 hover:text-white">写一篇教程</Link>
          </div>
        </div>
      </section>
    </LearnPage>
  )
}
