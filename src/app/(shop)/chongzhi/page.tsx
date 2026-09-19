// 【必须 force-dynamic】总价格表要连库，builder 容器没有 DATABASE_URL，
// 被当成静态路由预渲染会让整个构建失败。
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getLandingProducts, inStock, matchProducts } from '@/lib/landing/products'
import { LANDING_HUB, LANDINGS, landingPath } from '@/lib/landing/registry'
import { JsonLd } from '@/lib/seo/jsonld'
import { breadcrumbJsonLd, faqJsonLd, productItemListJsonLd } from '@/lib/seo/graph'
import {
  BrandDisclaimer,
  CheckList,
  FaqList,
  LandingShell,
  Section,
  SubSection,
} from '@/components/landing/landing-ui'

/**
 * 充值总览页——这一批落地页的 hub。
 *
 * 【它存在的首要理由不是排名，是结构】Google 判定 doorway page 的第四条看的是
 * 这些页面有没有进入「一个清晰、可浏览的层级」。一批只挂在 sitemap 里、
 * 彼此不通、站内点不到的关键词页，正是被点名的形态。
 * 有了这一页（并且它进了 footer），/chongzhi/* 下面每一页都有真实的站内入口，
 * 面包屑也有了合法的父级。
 *
 * 【它顺带承接的那组词】「代充」在 Google 中文下拉里只有 3 条联想，
 * 而且全是信任审查意图：chatgpt代充靠谱吗 / chatgpt 代充 知乎 / chatgpt 代充 v2ex，
 * 另有 claude代充网站 / claude代充原理 / gpt代充 知乎。
 * 这批人不是在找商品，是在查「你会不会骗我」。所以这一页除了价格总表，
 * 还要把「代充到底是怎么回事」「怎么分辨靠不靠谱」讲透——
 * 本站有可核验的经营主体，这是相对无照个人卖家的结构性优势，
 * 埋在页脚里没有意义，要做成一个能被搜到的页面。
 *
 * 【刻意不做的事】不建「AI 会员代充」这类品类聚合页作为主词页：
 * 实测 ai会员代充 / ai代充 / gemini 代充 / cursor 代充 联想数全部为 0，
 * 中文用户不搜品类，只搜具体产品名。这一页的主词是「AI 会员充值」+ 品牌，
 * 真正的流量入口在下面那七个按产品分的子页。
 */

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: LANDING_HUB.title,
    description: LANDING_HUB.description,
    alternates: { canonical: LANDING_HUB.path },
    openGraph: {
      type: 'website',
      title: LANDING_HUB.title,
      description: LANDING_HUB.description,
      url: LANDING_HUB.path,
    },
    twitter: { card: 'summary_large_image', title: LANDING_HUB.title, description: LANDING_HUB.description },
  }
}

const FAQS: { q: string; a: string }[] = [
  {
    q: 'AI 会员代充到底是怎么回事，钱是怎么充进去的？',
    a: '这类服务的本质是「用你没有的支付能力替你完成一笔订阅」。本站的做法是发卡密：你用支付宝在本站付人民币，拿到一串兑换码，自己到兑换页提交，由上游通道完成实际扣款。所以你买到的不是账号，是一次充值的凭据，整个过程账号在你自己手里。',
  },
  {
    q: '代充靠谱吗？怎么分辨会不会被骗？',
    a: '看四件事：卖家有没有可核验的经营主体（能不能开发票、发票上是谁）、退款规则有没有写在明处、交付的是卡密还是要你交出账号密码、以及能不能先买最便宜的一档试。本站由益阳市赫山区必高科技有限公司运营，价格与累计成交数公开在页面上，规则写在服务条款里。',
  },
  {
    q: '为什么不直接自己用信用卡充？',
    a: '如果你有能用的境外信用卡，自己充当然更划算。卡密充值是给「卡被拒了」的人准备的——中国大陆发行的卡在这些服务的支付环节被拒是普遍现象，虚拟卡的 BIN 段也在持续失效。',
  },
  {
    q: '需要把账号密码给你们吗？',
    a: '不需要。绝大多数商品交付的是卡密，由你自己完成兑换。个别档位（如 iOS 订阅充值）需要你提供一段登录凭据用于执行这一笔充值，用途仅限于此。如果有卖家一上来就要你的账号密码，那是完全不同的风险等级。',
  },
  {
    q: '充上去之后会不会被封号？',
    a: '会有这个风险，而且我们不质保封号——这一点写在每个商品页上。封号通常来自账号本身的问题或使用方式（比如频繁变动 IP），与这一笔充值没有直接关系。质保的是订阅：订阅期内非因你自身原因掉订阅，按剩余天数退款。',
  },
  {
    q: '卡密买了没用完会过期吗？',
    a: '未使用的卡密长期有效。但卡密一旦被上游核销（也就是充值动作已经发生），无论结果如何都不能退，所以兑换前务必先核对账户状态。',
  },
  {
    q: '可以开发票吗？',
    a: '可以。订单完成后在站内申请，支持增值税发票与收据。要先说清楚：页面标价是不含税价，开发票需要在售价之外另付 6% 税费（开票金额 = 售价 × 1.06），收据不涉及税费。开发票时可以自选票面上是否展示具体服务名称，抬头由你自己填。',
  },
  {
    q: '下单之后多久到账？',
    a: '卡池正常时付款确认后即时发放（极少数缺货情况下会转人工补发，订单页会标注）。兑换动作由你自己发起，兑换成功通常很快生效。人工交付的商品（如 KYC 认证代办）按商品页说明的时效处理。',
  },
]

export default async function ChongzhiHubPage() {
  const all = await getLandingProducts()

  // 每个子页对应哪些商品、最低价多少，直接在这里算好，卡片上给一个真实的「￥X 起」
  const cards = LANDINGS.map((l) => {
    const items = matchProducts(all, l.match)
    const available = items.filter(inStock)
    const pool = available.length ? available : items
    const low = pool.length ? Math.min(...pool.map((p) => p.price)) : null
    return { def: l, items, low, hasStock: available.length > 0 }
  })

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([{ name: '首页', path: '/' }, { name: LANDING_HUB.navLabel }]),
          faqJsonLd(FAQS),
          ...(all.length ? [productItemListJsonLd(all, LANDING_HUB.path)] : []),
        ]}
      />

      <LandingShell
        crumbs={[{ name: '首页', path: '/' }, { name: LANDING_HUB.navLabel }]}
        h1={LANDING_HUB.h1}
        lede={
          <>
            <p>
              这一页是全站充值服务的总入口：ChatGPT Plus / Pro、Claude Pro / Max 的会员充值，
              以及注册环节要用到的接码、家宽普号与 KYC 认证代办。
              全部走<strong className="text-white/80">卡密自助兑换</strong>——
              你用支付宝付人民币，拿到兑换码自己充，不需要任何境外支付方式，也不用把账号交出去。
            </p>
            <p>
              按你要充的东西点进去，每一页都有当前真实价格、该走哪个档位、
              以及兑换前必须先确认的那几件事。
            </p>
          </>
        }
      >
        <Section id="catalog" heading="按服务分类">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 not-prose">
            {cards.map(({ def, low, hasStock }) => (
              <Link
                key={def.slug}
                href={landingPath(def.slug)}
                className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <span className="font-semibold text-white transition-colors group-hover:text-purple-300">
                    {def.navLabel}
                  </span>
                  {low != null && (
                    <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-white/80">
                      ￥{low.toFixed(0)} 起
                    </span>
                  )}
                </div>
                <span className="mb-4 flex-1 text-sm leading-relaxed text-white/45">{def.blurb}</span>
                <span className="inline-flex items-center gap-1 text-sm text-purple-400">
                  {hasStock ? '查看详情' : '查看详情（部分档位补货中）'}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
          <p className="pt-6 text-sm text-white/40">
            想直接看全部商品与价格，去{' '}
            <Link href="/products" className="text-purple-400 hover:text-purple-300">
              商品列表
            </Link>
            。
          </p>
        </Section>

        <Section id="how-it-works" heading="卡密充值是怎么运作的">
          <p>
            这一节是给第一次接触这类服务的人看的。如果你只是想下单，直接点上面的卡片就行。
          </p>
          <SubSection heading="你买到的是什么">
            <p>
              是一串兑换码——也就是常说的卡密、充值卡或礼品卡形式的凭据，不是账号。
              付款后卡密即时发到你的订单里，你自己拿着它到兑换页提交，由上游通道完成实际的扣款动作。
              未使用的卡密不设统一有效期，具体以对应商品页的说明为准（Claude Pro 那一档明示永久有效）。
            </p>
          </SubSection>
          <SubSection heading="为什么要绕这一圈">
            <p>
              因为国内的支付手段在这些服务的收银台上大多过不去。境内发行的信用卡（含双币卡）
              被直接拒绝是普遍现象，虚拟卡的 BIN 段被批量识别后会整段失效。
              卡密这条路把「谁来付这笔美元」和「谁在用这个账号」拆开了，你只需要付人民币。
            </p>
          </SubSection>
          <SubSection heading="风险在哪里，说实话">
            <p>
              有两个，都不小，而且我们不回避：
              <strong className="text-white/80">第一，封号不质保</strong>
              ——账号被服务商封禁通常源于账号本身或使用方式（频繁变动 IP 是最常见的一条），
              和这一笔充值没有直接关系，这种情况我们赔不了。
              <strong className="text-white/80">第二，卡密一旦被上游核销就不能退</strong>
              ——所以每个商品页都会列出兑换前要确认的条件（有没有有效订阅、账单有没有未结清），
              不满足就提交，卡会白白消耗掉。这两条是这门生意的真实边界，
              愿意接受再下单，不接受就别下。
            </p>
          </SubSection>
        </Section>

        <Section id="trust" heading="怎么分辨一个代充卖家靠不靠谱">
          <p>
            搜「代充」的人里有相当一部分在查的是「会不会被骗」，这个疑虑完全合理——
            这个行业里无照个人卖家占多数。下面这几条是通用的判断方法，不只适用于本站：
          </p>
          <CheckList
            items={[
              <>
                <strong className="text-white/80">有没有可核验的经营主体</strong>
                ：能不能开发票、发票抬头是谁。个人卖家开不出增值税发票。
                本站的经营主体是益阳市赫山区必高科技有限公司。
              </>,
              <>
                <strong className="text-white/80">退款规则是不是写在明处</strong>
                ：什么情况退、什么情况不退，应该在下单前就能看到，而不是出事之后才由客服口头解释。
              </>,
              <>
                <strong className="text-white/80">交付的是卡密还是要你的账号密码</strong>
                ：要账号密码的风险等级完全不同。卡密模式下账号始终在你手里。
              </>,
              <>
                <strong className="text-white/80">价格是不是离谱地低</strong>
                ：明显低于成本的报价通常意味着用了随时会翻车的通道，或者根本没打算发货。
              </>,
              <>
                <strong className="text-white/80">能不能先小额试一次</strong>
                ：任何正经卖家都不会拒绝你先买最便宜的一档。
              </>,
            ]}
          />
          <p className="pt-2">
            本站的价格、库存与累计成交数都实时显示在每一页上，
            规则写在{' '}
            <Link href="/terms" className="text-purple-400 hover:text-purple-300">
              服务条款
            </Link>{' '}
            里，售后入口在{' '}
            <Link href="/support" className="text-purple-400 hover:text-purple-300">
              客服中心
            </Link>
            。
          </p>
        </Section>

        <Section id="faq" heading="常见问题">
          <FaqList faqs={FAQS.map((f) => ({ q: f.q, a: f.a }))} />
        </Section>

        <BrandDisclaimer />
      </LandingShell>
    </>
  )
}
