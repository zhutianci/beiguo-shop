import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import type { CatalogService } from '@/lib/jiema/dto'
import { JIEMA_SEO_SERVICES, jiemaSvcHref } from '@/lib/jiema/seo-whitelist'
import { JIEMA_TERMS_PATH, JIEMA_TERMS_TITLE } from '@/lib/terms/jiema-wallet'
import { LANDING_HUB } from '@/lib/landing/registry'

/**
 * 首页服务端直出的跨业务区块（docs/SEO-重构/SEO-重构设计.md §1.10，批 2 的 C 包）。全部是 Server Component，只在主站渲染（page.tsx 判）。
 *
 *  · 短信接码（支柱三）：只在 features.jiema && jiemaPublicOpen 时出现（灰度期首页没有任何 href="/jiema"，D28）；
 *    服务取 SEO 白名单常量（不取后台 hotRank，排除 Telegram、国内平台、金融类，§0.3 #34），链接用本站 slug（?svc=）；
 *    起价取目录快照（与下单同源），读不到目录就只给入口、不写价格。
 *  · AI 学习（提示词与教程）：内容平台的几个总览页入口；跟 features.forum（渠道站关）。
 *  · 关于本站：品牌级问答 4 条，事实与 /about、/terms、落地页同口径；**不标 FAQPage**（首页只出 Organization + WebSite，§3.2-A、§4.1）。
 *    开票只写一句并链到充值总览那条完整问答（§3.1「开票问答的完整版只有一份」）。
 */

function fromText(s: CatalogService | undefined): string | null {
  if (!s || s.level !== 'OK' || s.fromCents == null) return null
  return `${s.approx ? '约 ' : ''}￥${(s.fromCents / 100).toFixed(2).replace(/\.00$/, '')} 起`
}

const H2 = 'text-2xl font-bold lg:text-3xl'
const CARD = 'group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 transition-colors hover:border-white/20 hover:bg-white/[0.04]'

export function HomeJiemaSection({ services }: { services: CatalogService[] | null }) {
  const byCode = new Map((services ?? []).map((s) => [s.code, s]))
  // 目录读不到时也列白名单前 6 个（只给入口，不写价格）；读得到时只列目录里确实有的
  const rows = (services ? JIEMA_SEO_SERVICES.filter((w) => byCode.has(w.code)) : JIEMA_SEO_SERVICES).slice(0, 6)
  return (
    <section className="container relative pb-20" aria-labelledby="home-jiema-heading">
      <div className="mx-auto max-w-6xl">
        <h2 id="home-jiema-heading" className={`${H2} mb-3`}>
          短信接码：海外手机号在线接收验证码
        </h2>
        <p className="mb-8 max-w-3xl text-sm leading-relaxed text-white/45 lg:text-[15px]">
          注册或验证境外服务时手边没有海外手机号：选服务、选国家/地区，付款后拿一个号码接收这一次的短信验证码，按服务和国家/地区实时报价。
          没收到短信整单退回站内余额（不可提现），收码前可以免费换号。仅限本人合法注册验证、软件开发测试等合法用途。
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((w) => {
            const price = fromText(byCode.get(w.code))
            return (
              <a key={w.slug} href={jiemaSvcHref(w.slug)} className={CARD}>
                <span className="min-w-0">
                  <span className="block font-semibold text-white transition-colors group-hover:text-cyan-200">{w.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-white/40">{w.use}</span>
                </span>
                {price && <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-white/80">{price}</span>}
              </a>
            )
          })}
        </div>
        <p className="mt-6 text-sm text-white/40">
          其余服务在{' '}
          <Link href="/jiema" className="text-cyan-300/90 hover:text-cyan-200">
            短信接码
          </Link>{' '}
          页里按名称搜索；下单前请阅读
          <Link href={JIEMA_TERMS_PATH} className="mx-0.5 text-cyan-300/90 hover:text-cyan-200">
            《{JIEMA_TERMS_TITLE}》
          </Link>
          。
        </p>
      </div>
    </section>
  )
}

const LEARN_LINKS: { href: string; name: string; desc: string }[] = [
  { href: '/prompts/image', name: 'AI 绘画提示词', desc: 'GPT-Image、Nano Banana 等生图提示词，附效果图' },
  { href: '/prompts/video', name: 'AI 视频提示词', desc: 'Seedance、可灵、Veo：镜头、运镜与节奏' },
  { href: '/prompts/text', name: 'ChatGPT 提示词', desc: '科研、写作、文案、编程的结构化模板' },
  { href: '/guides', name: 'AI 使用教程', desc: 'ChatGPT、Claude、Claude Code 实测教程，注明测试日期' },
]

export function HomeLearnSection() {
  return (
    <section className="container relative pb-20" aria-labelledby="home-learn-heading">
      <div className="mx-auto max-w-6xl">
        <h2 id="home-learn-heading" className={`${H2} mb-3`}>
          AI 学习：可复制的提示词与实测教程
        </h2>
        <p className="mb-8 max-w-3xl text-sm leading-relaxed text-white/45 lg:text-[15px]">
          买了会员之后怎么用好：提示词附效果图和适用模型，复制就能用；教程写清测试日期和账号类型。
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {LEARN_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 transition-colors hover:border-white/20 hover:bg-white/[0.04]">
              <span className="font-semibold text-white transition-colors group-hover:text-purple-300">{l.name}</span>
              <span className="mt-1 text-xs leading-relaxed text-white/40">{l.desc}</span>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-sm text-white/40">
          <Link href="/learn" className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300">
            进入 AI 学习平台
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </p>
      </div>
    </section>
  )
}

/**
 * 品牌级问答（§1.10 第 6 条）。每一条都对得上：主体名称与 /about、Organization.legalName 同一个；
 * 「没有隶属、授权或合作关系」与落地页 BrandDisclaimer 同口径；开票口径「标价不含税，开票另付 6%」（lib/invoice TAX_RATE）、
 * 接码开票是 D37 原文；付款方式：充值只收支付宝、接码按 canUseForJiema。
 */
export function HomeBrandFaq({ jiema, jiemaPay, news, invoiceTaxText }: { jiema: boolean; jiemaPay: string; news: boolean; invoiceTaxText: string }) {
  const biz = ['ChatGPT、Claude 等 AI 订阅充值', ...(jiema ? ['短信接码'] : []), ...(news ? ['AI 圈大事记（AI 行业动态聚合）'] : [])]
  const items: { q: string; a: ReactNode }[] = [
    {
      q: '贝果科技是什么公司？',
      a: <>贝果科技 BigoLab（bigolab.com）由益阳市赫山区必高科技有限公司运营，提供 {biz.join('、')}。经营主体、付款与售后口径见<Link href="/about" className="mx-0.5 text-purple-400 hover:text-purple-300">关于我们</Link>。</>,
    },
    {
      q: '和 OpenAI、Anthropic 是什么关系？',
      a: <>没有关系：本站是独立的第三方服务商，与 OpenAI、Anthropic、Google 及其他服务提供商没有任何隶属、授权或合作关系，各服务的功能范围、账号状态与政策由其提供方决定。</>,
    },
    {
      q: '怎么付款，能开发票吗？',
      a: (
        <>
          充值类商品只收支付宝，登录后下单，可开增值税发票（{invoiceTaxText}），完整说明见
          <Link href={LANDING_HUB.path} className="mx-0.5 text-purple-400 hover:text-purple-300">
            AI 会员充值总览
          </Link>
          的开票问答。{jiema ? `短信接码${jiemaPay}付款，暂不支持开票，可联系客服开票处理。` : ''}
        </>
      ),
    },
    {
      q: '出了问题找谁？',
      a: <>先看<Link href="/support" className="mx-0.5 text-purple-400 hover:text-purple-300">常见问题与售后</Link>；找不到答案就点页面右下角添加客服微信，订单里也可以直接给客服留言。</>,
    },
  ]
  return (
    <section className="container relative pb-24" aria-labelledby="home-about-heading">
      <div className="mx-auto max-w-6xl">
        <h2 id="home-about-heading" className={`${H2} mb-6`}>
          关于贝果科技
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((f) => (
            <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="mb-2 font-semibold text-white">{f.q}</h3>
              <p className="text-sm leading-[1.9] text-white/55">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
