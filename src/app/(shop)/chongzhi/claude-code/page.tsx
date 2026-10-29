// 【必须 force-dynamic】价格要连库，而 builder 容器没有 DATABASE_URL（同其他落地页）
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { siteOrganizationJsonLd } from '@/lib/seo/pillars'
import { getLandingProducts, lowestPrice, matchProducts, withLivePrice, type LandingProduct } from '@/lib/landing/products'
import { findLanding, LANDING_HUB, landingPath } from '@/lib/landing/registry'
import { JsonLd } from '@/lib/seo/jsonld'
import { breadcrumbJsonLd, faqJsonLd } from '@/lib/seo/graph'
import { LandingFactCard, SUBSCRIPTION_AFTERSALE } from '@/components/seo/fact-card'
import { RelatedPillars } from '@/components/landing/related-pillars'
import { BrandDisclaimer, CheckList, FaqList, LandingShell, RelatedLandings, Section, SubSection, Warning } from '@/components/landing/landing-ui'
import { OG_IMAGES, OG_SITE, TWITTER_IMAGES } from '@/lib/seo/og'

/**
 * Claude Code 订阅落地页（SEO 批 3 的 D2，设计 §3.3 支柱一、§5.2）。
 *
 * 【这一页不卖新东西】Claude Code 没有单独的订阅，它随 Claude Pro / Max 提供。本站在卖的就是
 * claude-pro、claude-max 两页价格表里那几档，这一页只做摘要并链过去（registry 里 ownsProducts: false），
 * 承接的是那两页接不住的意图：「Claude Code 额度够不够用」「订阅和 API 有什么区别」「为什么被按 API 扣钱」。
 *
 * 【官方事实，2026-10-29 对照下面三个页面核实】
 *   · support.claude.com 11145838：Pro / Max 一个订阅同时用网页、桌面、手机端和 Claude Code；
 *     Pro 与 Max 都有 5 小时会话限额 + 每周限额，「shared across Claude and Claude Code」；
 *     设置了 ANTHROPIC_API_KEY 时 Claude Code 用这把 Key 鉴权、按 API 计费而不用订阅额度；
 *     已用 Console 按量付费登录的，在 Claude Code 里 /login 切回订阅；Max 附带的月度 API 额度不能用在 Claude Code 里
 *   · claude.com/pricing：Free 不含 Claude Code，Pro 与 Max 5x / 20x 含；Pro 月付 20 美元（年付折合 17）、Max 起 100 美元；
 *     Max 是 Pro 的 5 倍或 20 倍用量；付费档可开 usage credits，超出后按标准 API 价继续用
 *   · code.claude.com/docs/en/overview：多数入口需要 Claude 订阅或 Anthropic Console 账号
 * Anthropic 调整套餐很频繁：每月核对一次，改了就同时改这里和 registry 的 reviewedAt。
 * 正文每一句关于本站的操作说明，都对得上 claude-pro / claude-max 两页与商品说明的现行口径。
 */

const DEF = findLanding('claude-code')

const OFFICIAL = {
  help: 'https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan',
  pricing: 'https://claude.com/pricing',
  docs: 'https://code.claude.com/docs/en/overview',
}

function ext(href: string, text: string) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
      {text}
    </a>
  )
}

function tierPrices(all: LandingProduct[]) {
  const pro = matchProducts(all, findLanding('claude-pro').match)
  const max = matchProducts(all, findLanding('claude-max').match)
  return {
    pro: lowestPrice(pro),
    max5: lowestPrice(max.filter((p) => /5x/i.test(p.name))),
    max20: lowestPrice(max.filter((p) => /20x/i.test(p.name))),
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { pro } = tierPrices(await getLandingProducts())
  const description = withLivePrice(DEF.description, pro)
  return {
    title: DEF.title,
    description,
    alternates: { canonical: landingPath(DEF.slug) },
    openGraph: { ...OG_SITE, images: OG_IMAGES, type: 'website', title: DEF.title, description, url: landingPath(DEF.slug) },
    twitter: { images: TWITTER_IMAGES, card: 'summary_large_image', title: DEF.title, description },
  }
}

// 同一份数组喂 FaqList 和 FAQPage（标记页面上看不见的内容是结构化数据政策禁止的）
function buildFaqs(pro: number | null): { q: string; a: string }[] {
  return [
    {
      q: 'Claude Code 要单独订阅吗？',
      a: '不用。按 Anthropic 官方定价页，Claude Code 包含在 Pro、Max 5x、Max 20x 这些付费档里，Free 档不含。一个 Pro 或 Max 订阅同时覆盖网页、桌面、手机端和 Claude Code，没有另外一笔「Claude Code 会员」可买。',
    },
    {
      q: 'Claude Pro 的 Claude Code 额度够用吗？',
      a: 'Pro 和 Max 都是「5 小时会话限额 + 每周限额」，而且网页端和 Claude Code 共用同一份额度，官方不公布固定条数。偶尔让它改几个文件、写个脚本，Pro 一般够；整天让它在大仓库里跑长任务、频繁读大量文件，就容易在 5 小时窗口里撞上限。先用 Pro 跑一个周期看自己会不会撞到，再决定要不要换到 Max。',
    },
    {
      q: '明明买了订阅，为什么 Claude Code 还在按 API 扣钱？',
      a: '最常见的原因是电脑上设置了 ANTHROPIC_API_KEY 环境变量。官方帮助页写明：有这个变量时，Claude Code 会用这把 Key 鉴权、按 API 标准价计费，而不是用订阅里包含的额度。删掉这个变量，或者在 Claude Code 里运行 /login 用订阅账号重新登录即可。',
    },
    {
      q: 'Max 送的 API 额度能在 Claude Code 里用吗？',
      a: '不能。官方帮助页说明 Max 附带的月度 API 额度不能用在 Claude Code 或 Claude 应用里（也不能拿来抵 usage credits）。在 Claude Code 里用的是订阅本身的会话与每周额度。',
    },
    {
      q: '额度用完了怎么办？',
      a: '等 5 小时窗口或每周额度重置；或者在 Claude 账号里开启 usage credits，超出部分按 API 标准价继续计费（需要你自己在 Anthropic 那边能付款，本站不经手这一部分）；用量长期不够的，换到 Max 5x 或 20x。',
    },
    {
      q: '在本站买 Claude Pro / Max，Claude Code 能直接用吗？',
      a: `能。本站卖的就是 Claude Pro 与 Claude Max 的充值卡密，充到你自己的 Claude 账号上之后，用同一个账号在 Claude Code 里 /login 登录即可。${pro ? `Pro 当前 ￥${pro.toFixed(0)} 起，` : ''}各档实时价格和兑换前要核对的账户状态，分别写在 Claude Pro 充值、Claude Max 充值两页。`,
    },
    {
      q: '用 API 按量付费和买订阅，哪个更划算？',
      a: '取决于用量是否稳定。订阅是固定月费换一份有上限的额度，适合每天都在用的人；API 按 token 计费、没有月费，适合偶尔用或者要接进自己程序里批量调用的场景。官方 API 价格以 Anthropic 页面为准，本站不卖 API 额度。',
    },
  ]
}

const TOC = [
  { id: 'price', label: '价格与档位' },
  { id: 'included', label: '哪些订阅包含' },
  { id: 'limits', label: '额度怎么算' },
  { id: 'pro-enough', label: 'Pro 够不够用' },
  { id: 'api-vs-sub', label: 'API 与订阅' },
  { id: 'buy', label: '在本站怎么买' },
  { id: 'faq', label: '常见问题' },
]

export default async function ClaudeCodeLandingPage() {
  const all = await getLandingProducts()
  const items = matchProducts(all, DEF.match)
  const { pro, max5, max20 } = tierPrices(all)
  const faqs = buildFaqs(pro)
  const proPath = landingPath('claude-pro')
  const maxPath = landingPath('claude-max')
  const crumbs = [{ name: '首页', path: '/' }, { name: LANDING_HUB.navLabel, path: LANDING_HUB.path }, { name: DEF.navLabel }]

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs),
          faqJsonLd(faqs, { path: landingPath(DEF.slug), reviewedAt: DEF.reviewedAt }),
          await siteOrganizationJsonLd(),
          // 不出 ItemList：档位的归属页是 claude-pro / claude-max，这里只是摘要
        ]}
      />

      <LandingShell
        toc={TOC}
        crumbs={crumbs}
        h1={DEF.h1}
        reviewedAt={DEF.reviewedAt}
        meta={
          <LandingFactCard
            product="可用于 Claude Code 的 Claude Pro / Max"
            count={items.length}
            low={pro}
            delivery="交付卡密，由你自己在兑换页发起充值"
            aftersale={SUBSCRIPTION_AFTERSALE}
            reviewedAt={DEF.reviewedAt}
          />
        }
        lede={
          <>
            <p>
              先说结论：<strong className="text-white/80">Claude Code 没有单独的订阅</strong>，它跟着 Claude Pro / Max 走 ——
              按 Anthropic {ext(OFFICIAL.pricing, '官方定价页')}，Pro、Max 5x、Max 20x 都包含 Claude Code，Free 不含。
              所以「Claude Code 怎么充值」其实就是「给你的 Claude 账号开 Pro 或 Max」。
            </p>
            <p>
              这一页讲订阅之外最容易踩坑的三件事：额度是怎么算的、Pro 到底够不够写代码用、
              以及为什么有人买了订阅还被按 API 扣钱。本站在卖的 Pro / Max 档位与兑换规则，
              详见{' '}
              <Link href={proPath} className="text-purple-400 hover:text-purple-300">Claude Pro 充值</Link>
              {' '}和{' '}
              <Link href={maxPath} className="text-purple-400 hover:text-purple-300">Claude Max 充值</Link>
              {' '}两页。
            </p>
          </>
        }
      >
        <Section id="price" heading="价格与档位：Pro、Max 5x、Max 20x">
          <p>
            官方公开定价（以 {ext(OFFICIAL.pricing, 'claude.com/pricing')} 为准，官方会调整）：Pro 月付 20 美元、年付折合每月 17 美元；
            Max 每月 100 美元起，分 5x 与 20x 两档，分别是 Pro 用量的 5 倍和 20 倍。
          </p>
          <CheckList
            items={[
              <>
                <strong className="text-white/80">Claude Pro</strong>：{pro ? `本站 ￥${pro.toFixed(0)} 起` : '本站实时价格见 Pro 页价格表'}，
                档位、价格与兑换前的两项检查见{' '}
                <Link href={proPath} className="text-purple-400 hover:text-purple-300">Claude Pro 充值</Link>。
              </>,
              <>
                <strong className="text-white/80">Claude Max 5x / 20x</strong>：
                {max5 ? `5x 本站 ￥${max5.toFixed(0)}` : '5x 实时价格见 Max 页'}
                {max20 ? `，20x 本站 ￥${max20.toFixed(0)}` : ''}，额度差别与兑换前的四项检查见{' '}
                <Link href={maxPath} className="text-purple-400 hover:text-purple-300">Claude Max 充值</Link>。
              </>,
            ]}
          />
          <p className="text-sm text-white/45">
            本站价格随上游成本浮动，以下单时商品页显示的实付金额为准；标价不含税，开增值税发票另付 6%。
          </p>
        </Section>

        <Section id="included" heading="哪些订阅包含 Claude Code：Free 不含，Pro 和 Max 都含">
          <p>
            官方帮助页的原意是：有 Pro 或 Max 订阅，就能用一个订阅同时使用网页、桌面、手机端的 Claude 和 Claude Code
            （{ext(OFFICIAL.help, 'Using Claude Code with your Pro or Max plan')}）。Free 档在定价页的功能表里写的是不含。
          </p>
          <p>
            Claude Code 有终端命令行、VS Code / JetBrains 插件、桌面端与网页版等入口，
            按 {ext(OFFICIAL.docs, 'Claude Code 官方文档')}，多数入口需要 Claude 订阅或 Anthropic Console（API）账号二选一登录。
            用订阅账号登录，消耗的就是订阅里的额度。
          </p>
        </Section>

        <Section id="limits" heading="额度怎么算：5 小时会话限额 + 每周限额，网页端与 Claude Code 共用">
          <p>
            Pro 和 Max 都有两层限制：一个按 5 小时滚动的会话限额，外加每周限额。关键在于
            <strong className="text-white/80">这份额度是网页端、App 和 Claude Code 共用的</strong> ——
            白天在网页上长聊过，晚上开 Claude Code 就会发现剩得不多。
          </p>
          <p>
            官方不公布固定的「每 5 小时多少条」：消耗和模型、上下文长度、读进去的文件量都有关。
            Claude Code 会自动读仓库里的文件、跑多轮工具调用，同样一句话，比在网页上问要耗得多，这是它比网页端更容易撞上限的原因。
          </p>
          <SubSection heading="撞上限之后能做什么">
            <p>
              三个办法：等窗口重置；在账号里开启 usage credits，超出部分按 API 标准价继续计费
              （要你自己在 Anthropic 那边能付款，本站不经手）；用量长期不够，就换到 Max。
            </p>
          </SubSection>
        </Section>

        <Section id="pro-enough" heading="Pro 的 Claude Code 额度够不够用">
          <p>大致可以按用法来判断（经验判断，不是官方数字）：</p>
          <CheckList
            items={[
              <>
                <strong className="text-white/80">一般够</strong>：每天让它改几个文件、写脚本、解释报错、补测试，单次任务不长。
              </>,
              <>
                <strong className="text-white/80">容易不够</strong>：在大仓库里整天跑长任务、一次让它通读几十个文件、同时开好几个会话并行干活。
              </>,
            ]}
          />
          <p>
            稳妥的顺序是先用 Pro 跑满一个周期，看自己会不会真的撞到上限。经常撞到再换 Max ——
            Max 5x 和 20x 怎么选、什么情况下值得从 Pro 换上去，写在{' '}
            <Link href={maxPath} className="text-purple-400 hover:text-purple-300">Claude Max 充值</Link> 那一页。
          </p>
        </Section>

        <Section id="api-vs-sub" heading="API 按量付费和订阅的区别，以及「买了订阅还被扣 API 费」">
          <p>
            订阅是固定月费换一份有上限的额度；API（Anthropic Console）按 token 计费、没有月费，按官方 API 标准价结算。
            两者在 Claude Code 里是两种不同的登录方式，钱也是两笔账。
          </p>
          <Warning>
            <strong>电脑上设置了 ANTHROPIC_API_KEY 环境变量，Claude Code 会优先用这把 Key、按 API 计费</strong>，
            订阅里包含的额度反而用不上 —— 这是官方帮助页专门提醒的一点。买了订阅想走订阅额度，
            先删掉这个变量，或在 Claude Code 里运行 <code className="font-mono">/login</code> 用订阅账号重新登录。
          </Warning>
          <p>
            另外，Max 附带的月度 API 额度不能用在 Claude Code 或 Claude 应用里。只是偶尔用一下、
            或者要把 Claude 接进自己的程序批量调用，API 往往更合适；每天都在用，订阅更省心。本站不卖 API 额度。
          </p>
        </Section>

        <Section id="buy" heading="在本站怎么买：充 Pro / Max 到自己的账号，再在 Claude Code 里登录">
          <CheckList
            items={[
              <>
                在{' '}
                <Link href={proPath} className="text-purple-400 hover:text-purple-300">Claude Pro 充值</Link> 或{' '}
                <Link href={maxPath} className="text-purple-400 hover:text-purple-300">Claude Max 充值</Link>{' '}
                选档位，支付宝或微信支付，登录后下单。
              </>,
              <>付款后拿到卡密，按兑换页提示把会员充到你自己的 Claude 账号上，账号密码不用交给任何人。</>,
              <>
                在 Claude Code 里运行 <code className="font-mono">/login</code>，用同一个 Claude 账号登录（确认没有设置 ANTHROPIC_API_KEY）。
              </>,
            ]}
          />
          <Warning>
            兑换前务必按对应页面核对账户状态（例如当前还有没到期的会员、账单里有逾期账单时充值不会到账）。
            卡密提交即核销，前提不满足也退不了；封号不质保。完整口径见{' '}
            <Link href="/terms" className="text-purple-400 hover:text-purple-300">服务条款</Link>。
          </Warning>
        </Section>

        <Section id="faq" heading="常见问题">
          <FaqList faqs={faqs} />
          <p className="pt-4 text-sm text-white/40">
            还有别的问题，可以翻{' '}
            <Link href="/support" className="text-purple-400 hover:text-purple-300">客服中心</Link>
            ，或加客服微信 <span className="font-mono text-white/60">GenuineMarxist</span>。
          </p>
        </Section>

        <RelatedPillars learn={[{ href: '/guides/p/claude', anchor: 'Claude 与 Claude Code 使用教程' }]} />
        <RelatedLandings currentSlug={DEF.slug} />
        <BrandDisclaimer />
      </LandingShell>
    </>
  )
}
