// Server Component：必须 force-dynamic，理由同 /news —— builder 容器连不上库。
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarRange, ChevronRight, ListOrdered } from 'lucide-react'
import { AiNoticeBlock } from '@/components/news/ai-notice-block'
import { ShareBar } from '@/components/news/share-bar'
import { AI_BADGE, AI_DISCLAIMER } from '@/lib/news/constants'
import { absUrl } from '@/lib/news/seo'
import { dayKey, formatDayHeading, ogImageForCategory, siteOrigin, sourceLabel } from '@/lib/news/format'
import {
  DIGEST_SLUG,
  formatPeriodLabel,
  getDigest,
  listDigests,
  parseDigestType,
  type DigestDto,
} from '@/lib/news/digest'

/**
 * 日报 / 周报详情页。
 *
 * 管线早就在生成 news_digests 了（每天 21:00 日报、每周一 09:00 周报），
 * 但一直没有前台入口 —— 数据攒着没人看得到。这一页把它露出来，并支持分享。
 *
 * 【路由为什么是 /news/digest/daily/2026-09-07 这种显式两段】
 * 一段式（如 /news/digest/2026-09-07）就得靠约定区分日报周报，容易和
 * /news/[slug]、/news/archive/[month] 互相干扰。多写一段路径换掉全部歧义，很划算。
 */

const RECENT_DAILY = 3
const RECENT_WEEKLY = 4

interface Params {
  params: { type: string; period: string }
}

async function load(params: Params['params']) {
  const type = parseDigestType(params.type)
  if (!type) return null
  const period = decodeURIComponent(params.period || '')
  const digest = await getDigest(type, period)
  return digest ? { type, digest } : null
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const hit = await load(params).catch(() => null)
  if (!hit) return { title: '内容不存在 - AI 圈大事记' }
  const { digest } = hit
  const description = (digest.intro || `本期收录 ${digest.events.length} 条 AI 行业动态。`)
    .replace(/\s+/g, ' ')
    .slice(0, 110)
  const path = `/news/digest/${DIGEST_SLUG[digest.type]}/${digest.period}`
  return {
    metadataBase: new URL(siteOrigin()),
    title: `${digest.title} - AI 圈大事记`,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      title: digest.title,
      description,
      url: path,
      siteName: '贝果科技',
      images: [{ url: ogImageForCategory(null), width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title: digest.title, description },
    // AI 标识的第 4 处法定位置。新增页面最容易漏这一行
    other: { 'ai-generated': 'true' },
  }
}

export default async function DigestPage({ params }: Params) {
  const hit = await load(params)
  if (!hit) notFound()
  const { type, digest } = hit

  // 切换器：最近几期。查询失败不能拖垮正文
  let daily: Awaited<ReturnType<typeof listDigests>> = []
  let weekly: Awaited<ReturnType<typeof listDigests>> = []
  try {
    ;[daily, weekly] = await Promise.all([listDigests('DAILY', RECENT_DAILY), listDigests('WEEKLY', RECENT_WEEKLY)])
  } catch (e) {
    console.error('[news/digest list]', e)
  }

  const shareUrl = absUrl(`/news/digest/${DIGEST_SLUG[digest.type]}/${digest.period}`)
  const isDaily = type === 'DAILY'

  return (
    <div className="min-h-screen pb-20 pt-28 sm:page-top">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none fixed left-1/4 top-24 h-[420px] w-[420px] rounded-full bg-purple-500/10 blur-[128px]" />

      <div className="container relative max-w-3xl">
        <Link
          href="/news"
          className="inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white/80 lg:text-[15px]"
        >
          <ArrowLeft className="h-4 w-4" />
          AI 圈大事记
        </Link>

        <article className="mt-5 lg:mt-7">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5">
            <CalendarRange className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-xs text-white/65 lg:text-[13px]">
              {isDaily ? '每日速览' : '每周回顾'} · {formatPeriodLabel(digest)}
            </span>
          </div>

          <h1 className="text-balance text-[26px] font-bold leading-tight tracking-tight sm:text-4xl lg:text-[40px] lg:leading-[1.2]">
            {digest.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-white/40 lg:text-sm">
            <span className="tabular-nums text-white/55">
              {formatDayHeading(digest.periodStart)}
              {digest.periodStart !== digest.periodEnd && ` — ${formatDayHeading(digest.periodEnd)}`}
            </span>
            <span className="h-3 w-px bg-white/12" />
            <span className="inline-flex items-center gap-1">
              <ListOrdered className="h-3.5 w-3.5" />
              {digest.events.length} 条
            </span>
          </div>

          {/* AI 标识（法定位置：正文开头）。榜单本身也是 AI 生成的排序与导语 */}
          <AiNoticeBlock className="mt-6 lg:mt-7" />

          {digest.intro && (
            <p className="mt-6 text-[16px] leading-[1.9] text-white/80 sm:text-[17px] lg:mt-8 lg:text-[18px] lg:leading-[1.95]">
              {digest.intro}
            </p>
          )}

          {/* ============ 榜单 ============ */}
          {digest.events.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-white/10 px-4 py-12 text-center text-sm text-white/40">
              本期收录的内容都已下线。
            </p>
          ) : (
            <ol className="mt-8 space-y-2.5 lg:mt-10 lg:space-y-3">
              {digest.events.map((ev, i) => (
                <li key={ev.id}>
                  <Link
                    href={`/news/${ev.slug}`}
                    className="group flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 transition-colors hover:border-white/20 hover:bg-white/[0.07] lg:gap-4 lg:px-5 lg:py-4"
                  >
                    <span className="mt-0.5 shrink-0 font-mono text-[13px] font-semibold tabular-nums text-purple-300/60 lg:text-sm">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <h2 className="text-balance text-[15px] font-medium leading-snug text-white/85 group-hover:text-white lg:text-[17px]">
                        {ev.headline}
                      </h2>
                      {ev.whyItMatters && (
                        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-white/50 lg:text-sm">
                          {ev.whyItMatters}
                        </p>
                      )}
                      <span className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] tabular-nums text-white/30 lg:text-xs">
                        <span>{formatDayHeading(dayKey(ev.happenedAt))}</span>
                        <span>·</span>
                        <span>{sourceLabel(ev.sources, ev.sourceCount)}</span>
                        <span>·</span>
                        <span>AI {ev.aiScore}</span>
                      </span>
                    </span>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-white/50" />
                  </Link>
                </li>
              ))}
            </ol>
          )}

          {/* 有条目在生成后被下线时如实说明，不假装这一期本来就这么少 */}
          {digest.missing > 0 && (
            <p className="mt-4 text-[12px] text-white/30">
              本期原有 {digest.events.length + digest.missing} 条，其中 {digest.missing} 条已下线，不再展示。
            </p>
          )}

          <p className="mt-9 border-t border-white/10 pt-5 text-[12px] leading-relaxed text-white/35 lg:mt-12 lg:pt-6 lg:text-[13px]">
            {AI_DISCLAIMER}
          </p>
        </article>

        {/* ============ 分享 ============ */}
        {/* 复用事件页那套面板：复制文案里带「AI 摘要」字样由 buildShareText 统一保证。
            日报没有 eventId，分享数记不了 —— reportNewsShare 会静默跳过 */}
        <div className="mt-8 lg:mt-10">
          <ShareBar
            slug={`digest-${DIGEST_SLUG[digest.type]}-${digest.period}`}
            headline={digest.title}
            summary={digest.intro || `本期收录 ${digest.events.length} 条 AI 行业动态。`}
            sources={digest.events.slice(0, 3).flatMap((e) => e.sources.slice(0, 1).map((s) => s.name))}
            happenedAt={`${digest.periodStart}T00:00:00.000Z`}
            url={shareUrl}
            className="flex flex-wrap items-center gap-2"
          />
        </div>

        {/* ============ 往期切换 ============ */}
        <PeriodSwitcher current={digest} daily={daily} weekly={weekly} />
      </div>
    </div>
  )
}

function PeriodSwitcher({
  current,
  daily,
  weekly,
}: {
  current: DigestDto
  daily: Awaited<ReturnType<typeof listDigests>>
  weekly: Awaited<ReturnType<typeof listDigests>>
}) {
  const Row = ({ label, items }: { label: string; items: typeof daily }) => {
    if (!items.length) return null
    return (
      <div className="mt-4">
        <h3 className="mb-2 text-[13px] font-medium text-white/45">{label}</h3>
        <div className="flex flex-wrap gap-2">
          {items.map((d) => {
            const active = d.type === current.type && d.period === current.period
            return (
              <Link
                key={`${d.type}-${d.period}`}
                href={`/news/digest/${DIGEST_SLUG[d.type]}/${d.period}`}
                aria-current={active ? 'page' : undefined}
                className={
                  active
                    ? 'inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-medium text-black'
                    : 'inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-[13px] text-white/60 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white/85'
                }
              >
                {formatPeriodLabel(d)}
                <span className={active ? 'tabular-nums text-black/40' : 'tabular-nums text-white/30'}>{d.count}</span>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  if (!daily.length && !weekly.length) return null
  return (
    <nav aria-label="往期速览" className="mt-12 border-t border-white/10 pt-6 lg:mt-16 lg:pt-8">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-white/70 lg:text-[15px]">
        <CalendarRange className="h-4 w-4 text-white/40" />
        往期
      </h2>
      <Row label={`最近 ${daily.length} 期日报`} items={daily} />
      <Row label="近期周报" items={weekly} />
      <p className="mt-4 text-[12px] text-white/30">
        日报每天 21:00 生成，周报每周一 09:00 生成上一周。内容与排序均由 AI 依据公开信源自动整理（{AI_BADGE}）。
      </p>
    </nav>
  )
}
