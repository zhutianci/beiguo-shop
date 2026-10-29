import Link from 'next/link'
import { LANDING_HUB, LANDINGS, landingPath, type LandingSlug } from '@/lib/landing/registry'
import { lowestPrice, matchProducts, type LandingProduct } from '@/lib/landing/products'
import { TAX_RATE } from '@/lib/invoice'

/**
 * 教程页的本站服务卡（2026-10-29，SEO 批 3 的转化改造）。
 *
 * 【为什么要改】10-15～10-28 自然搜索两周约 2.9 万访客，九成以上落在 /guides 教程页（Bing 为主），
 * 其中只有约 3% 去了充值页、约 0.1% 走到订单页。原来的入口只有正文末尾一行字和桌面端侧栏一个小框，
 * 手机端读完全文之前看不到任何入口，而且一律写「需要开通或续费？」，没有价格、付款方式和交付方式。
 *
 * 【做法】
 *   · 先按标题意图选落地页（intentSlug），再按标签上登记的落地页，最后才是充值总览：
 *     「Claude Code 额度」那篇应该去 claude-code，而不是被 Claude 标签带到 claude-pro；
 *     「Codex 手机号验证」去 codex-jiema，而不是被 Codex 标签带到 chatgpt-plus。
 *   · 卡片上只写可核验的事实：实时起价（与落地页价格表同源）、付款方式、交付方式、开票口径。
 *     不写「秒到」「最低价」「官方合作」这类话（设计 §9.2）。
 *   · 正文里放一张（第二个 H2 之前，读者已经确认这篇对题之后），正文末尾放一张；侧栏保留。
 */

/** 标题里的意图，按顺序第一个命中的生效（全部小写比较）。只放有明确对应商品的意图 */
const INTENTS: { test: (t: string) => boolean; slug: LandingSlug }[] = [
  { test: (t) => /claude\s*code/.test(t), slug: 'claude-code' },
  { test: (t) => /codex/.test(t) && /(手机|验证码|接码|短信|收不到码)/.test(t), slug: 'codex-jiema' },
  { test: (t) => /claude/.test(t) && /(kyc|身份验证|身份认证|实名)/.test(t), slug: 'claude-kyc' },
  { test: (t) => /claude/.test(t) && /(注册|手机号|验证码)/.test(t), slug: 'claude-zhuce' },
  { test: (t) => /claude/.test(t) && /\bmax\b/.test(t), slug: 'claude-max' },
  { test: (t) => /chatgpt/.test(t) && /\bpro\b/.test(t) && !/plus/.test(t), slug: 'chatgpt-pro' },
  { test: (t) => /(grok|xai)/.test(t), slug: 'grok-super' },
  { test: (t) => /(谷歌|google|gmail)/.test(t) && /(账号|账户|注册|邮箱)/.test(t), slug: 'google-zhanghao' },
]

export function intentSlug(title: string): LandingSlug | null {
  const t = title.toLowerCase()
  return INTENTS.find((i) => i.test(t))?.slug ?? null
}

/** 交付方式的短写法：与各落地页正文的口径一致，不是每一页都发卡密 */
const DELIVERY: Partial<Record<LandingSlug, string>> = {
  'codex-jiema': '付款后在线接收验证码',
  'claude-zhuce': '接码与注册普号',
  'claude-kyc': '人工对接，失败不收费',
  'google-zhanghao': '付款后即时发货',
}

export interface ServiceCta {
  href: string
  label: string
  /** null = 充值总览 */
  slug: LandingSlug | null
}

/** 这一张卡要展示的数据：价格取落地页同一份在售快照（getLandingProducts，同一请求内已缓存） */
export function serviceCardData(cta: ServiceCta, all: LandingProduct[]) {
  const def = cta.slug ? LANDINGS.find((l) => l.slug === cta.slug) : null
  const low = def ? lowestPrice(matchProducts(all, def.match)) : null
  return {
    href: cta.href,
    title: def ? def.navLabel : LANDING_HUB.navLabel,
    blurb: def ? def.blurb : 'ChatGPT Plus / Pro、Claude Pro / Max、Grok 会员充值与 Codex、Claude 接码，价格实时公开。',
    low,
    delivery: (cta.slug && DELIVERY[cta.slug]) || '卡密自助兑换，账号不用交给别人',
    path: def ? landingPath(def.slug) : LANDING_HUB.path,
  }
}

export type ServiceCardData = ReturnType<typeof serviceCardData>

const taxPercent = `${Math.round(TAX_RATE * 100)}%`

/** variant：inline = 正文中间的紧凑版；end = 正文末尾的完整版 */
export function ServiceCard({ data, variant }: { data: ServiceCardData; variant: 'inline' | 'end' }) {
  const facts = [
    data.low != null ? `￥${data.low.toFixed(0)} 起` : null,
    '支付宝或微信支付',
    data.delivery,
    variant === 'end' ? `可开增值税发票（标价不含税，开票另付 ${taxPercent}）` : null,
  ].filter(Boolean) as string[]
  return (
    <aside
      aria-label="本站服务"
      className={`learn-card not-prose flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${variant === 'inline' ? 'my-8' : 'mt-12 px-6 py-5'}`}
    >
      <div className="min-w-0">
        <p className="text-[11px] tracking-wide text-white/40">本站服务 · 贝果科技</p>
        <p className="mt-1 text-[15px] font-semibold text-white">{data.title}</p>
        {variant === 'end' && <p className="mt-1 text-[13px] leading-relaxed text-white/55">{data.blurb}</p>}
        <p className="mt-1.5 text-[13px] text-white/60">{facts.join(' · ')}</p>
      </div>
      <Link
        href={data.href}
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black hover:bg-white/90"
      >
        查看价格与说明 →
      </Link>
    </aside>
  )
}

/**
 * 把正文 HTML 从第二个 H2 之前切开（读者看完第一节、确认这篇对题之后再出现服务卡）。
 * 没有第二个 H2 的短文不切，只在末尾放一张。只认 renderMarkdown 输出的 `<h2`，不解析别的标签。
 */
export function splitForInlineCard(html: string): [string, string] | null {
  const first = html.indexOf('<h2')
  if (first < 0) return null
  const second = html.indexOf('<h2', first + 3)
  if (second < 0) return null
  return [html.slice(0, second), html.slice(second)]
}
