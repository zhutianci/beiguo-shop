// 【必须 force-dynamic】价格表要连库，而 builder 容器没有 DATABASE_URL，
// 被当成静态路由预渲染会让整个构建失败。
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { getLandingProducts, lowestPrice, matchProducts, withLivePrice } from '@/lib/landing/products'
import { findLanding, LANDING_HUB, landingPath } from '@/lib/landing/registry'
import { JsonLd } from '@/lib/seo/jsonld'
import { breadcrumbJsonLd, faqJsonLd, productItemListJsonLd } from '@/lib/seo/graph'
import { OG_IMAGES, TWITTER_IMAGES } from '@/lib/seo/og'
import {
  BrandDisclaimer,
  CheckList,
  FaqList,
  LandingShell,
  PriceTable,
  RelatedLandings,
  Section,
  Steps,
  SubSection,
  Warning,
} from '@/components/landing/landing-ui'

/**
 * Grok Super 充值落地页。
 *
 * 【这一页为什么存在，先说清楚】不是按搜索需求立项的。其余八页的主词都经过
 * 2026-09-19 的 Google 下拉建议实测，Grok 这一批**没有实测数据**——
 * 服务器在国内连不上那个接口（实测超时），浏览器侧也被拒。
 * 立项的理由只有一条：站上在卖 3 个 Grok 商品，而充值总览页的服务分类里找不到 Grok，
 * 买家在那一页根本发现不了这三个 SKU。这是站内一致性的缺口，和 SEO 无关。
 *
 * 【所以篇幅刻意比别的页短】没有需求数据就照着 chatgpt-plus 那种体量写，
 * 是在赌一个没验证过的假设。这一页只写买家下单前真正要确认的事：
 * 三档差多少钱、怎么交付、兑换前要满足什么、出问题怎么算。
 * 等能实测关键词了再决定要不要加厚。
 *
 * 【正文里的事实来源】价格、库存、累计成交实时取库；美元官方价取自后台商品名与描述
 * （Super $30/月、三个月 $90、Super Heavy $300/月）。改商品时回来核对这一页。
 * **不写 Grok 各档具体能用什么模型、有什么额度**——那些本站核验不了，
 * 写了就是替 xAI 做承诺，出入了是本站承担。
 */

const DEF = findLanding('grok-super')

export async function generateMetadata(): Promise<Metadata> {
  const all = await getLandingProducts()
  const items = matchProducts(all, DEF.match)
  const description = withLivePrice(DEF.description, lowestPrice(items))
  return {
    title: DEF.title,
    description,
    alternates: { canonical: landingPath(DEF.slug) },
    openGraph: {
      images: OG_IMAGES,
      type: 'website',
      title: DEF.title,
      description,
      url: landingPath(DEF.slug),
    },
    twitter: { images: TWITTER_IMAGES, card: 'summary_large_image', title: DEF.title, description },
  }
}

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Grok Super 一个月多少钱人民币？',
    a: '官方定价是每月 30 美元，Super Heavy 是每月 300 美元。本站的人民币价格以本页价格表为准（那张表直接取自后台实时数据），随上游成本与汇率浮动，下单时页面显示的实付金额才是最终金额。',
  },
  {
    q: '三个档位有什么区别，我该买哪个？',
    a: '差别在时长和档次，不在充值方式——三档都是走 iOS 订阅充值。按月那档适合先试；三个月那档是一次付 90 美元对应的额度，单位成本比按月低一点；Super Heavy 是更高的档次，官方价每月 300 美元，价格差了近十倍，只有确实需要那一档的人才值得买。至于每一档具体能用什么模型、额度多少，以 xAI 官方页面为准——这一点本站核验不了，不替它做承诺。',
  },
  {
    q: '需要把账号密码给你们吗？',
    a: '这一类走的是 iOS 订阅充值，兑换时需要你提供一段登录凭据用于执行这一笔充值，用途仅限于此。本站交付的是卡密，充值动作由你自己在兑换页发起。',
  },
  {
    q: '国内没有境外支付方式，能充吗？',
    a: '可以，这正是卡密充值存在的原因。你在本站用支付宝付人民币，拿到兑换码自己去兑换页完成充值，全程不需要境外信用卡，也不需要海外 Apple ID 的支付方式。',
  },
  {
    q: '显示补货中是什么意思，什么时候有货？',
    a: '库存是实时的，以本页价格表里那一列为准：显示有货就能直接下单，显示补货中就是当前确实没有现货。Grok 这一类单价高、上游放货不稳定，补货时间我们自己也不总能提前知道，所以不给承诺时间——想要的话直接联系客服登记，到货通知你。',
  },
  {
    q: '兑换失败了，卡密还能用吗？',
    a: '账号状态类与凭据类的报错通常不消耗卡密，把账号那一侧处理好、或按商品说明重新取一次凭据再提交即可。但只要卡密已被上游核销（也就是充值动作已经发生），无论结果如何都不能退。所以兑换前务必先核对账户状态。如果兑换页明确提示需要人工确认，请立刻带着订单号联系客服，不要重复提交。',
  },
  {
    q: '可以开发票吗？',
    a: '可以。订单完成后在站内申请，支持增值税发票与收据。需要注意：页面标价是不含税价，开发票要在售价之外另付 6% 税费（开票金额 = 售价 × 1.06），收据不涉及税费。',
  },
]

export default async function GrokSuperLandingPage() {
  const all = await getLandingProducts()
  const items = matchProducts(all, DEF.match)
  const low = lowestPrice(items)

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: '首页', path: '/' },
            { name: LANDING_HUB.navLabel, path: LANDING_HUB.path },
            { name: DEF.navLabel },
          ]),
          faqJsonLd(FAQS),
          // 这一页列的是档位不是单个商品，所以用 ItemList；
          // Product/Offer 留在 /products/[id]——那才是买家能完成购买的页面
          ...(items.length ? [productItemListJsonLd(items, landingPath(DEF.slug))] : []),
        ]}
      />

      <LandingShell
        crumbs={[
          { name: '首页', path: '/' },
          { name: LANDING_HUB.navLabel, path: LANDING_HUB.path },
          { name: DEF.navLabel },
        ]}
        h1={DEF.h1}
        lede={
          <>
            <p>
              xAI 的 Grok 会员在国内卡的还是那一步：付款。境内发行的信用卡在这类订阅的收银台上
              大多过不去，海外 Apple ID 也得先有能用的支付方式。绕过这一步的办法是
              <strong className="text-white/80">用卡密充值</strong>
              —— 你在本站用支付宝付人民币，拿到兑换码自己去兑换，全程不需要任何境外支付方式。
            </p>
            <p>
              这一页把该说清楚的说清楚：三个档位现在各多少钱、差在哪、怎么交付、
              兑换前必须先确认什么，以及出了问题按什么口径处理
              {low ? `。当前最低 ￥${low.toFixed(0)} 起。` : '。'}
            </p>
          </>
        }
      >
        <Section id="price" heading="价格与档位">
          <PriceTable
            items={items}
            note={
              <>
                价格随上游成本与汇率浮动，以下单时页面显示的实付金额为准。「累计成交」是本站真实订单数。
                <strong className="text-white/80">标价均为不含税价</strong>
                ，需要增值税发票的在售价之外另付 6% 税费。显示「补货中」就是当前确实没有现货，
                补货时间不做承诺。
              </>
            }
          />
        </Section>

        <Section id="tiers" heading="三个档位怎么选">
          <p>
            三档走的是同一条充值链路（iOS 订阅充值），差别只在时长和档次。
            价格跨度很大，从两百出头到一千六百多，选错的代价不小，所以先看清楚。
          </p>
          <SubSection heading="按月那一档：先试">
            <p>
              官方价每月 30 美元。适合还没确定要长期用、想先跑一个周期看看的人。
              这一档也是本站唯一有过成交记录的档位。
            </p>
          </SubSection>
          <SubSection heading="三个月那一档：单位成本低一点">
            <p>
              对应官方 90 美元（三个月）。本站这一档标了划线原价，实际比按月连买三次便宜一些。
              前提是你确定这三个月会一直用——卡密一旦核销就不能退，用不满是自己承担。
            </p>
          </SubSection>
          <SubSection heading="Super Heavy：确实需要再买">
            <p>
              官方价每月 300 美元，是按月档的十倍。
              <strong className="text-white/80">
                这一档我们不给「值不值」的建议
              </strong>
              ——每一档具体能用什么模型、额度多少、限制在哪，以 xAI 官方页面为准，
              本站核验不了，不替它做承诺。只有你自己确认过那一档的额度是你需要的，才值得下单。
            </p>
          </SubSection>
        </Section>

        <Section id="delivery" heading="怎么交付、怎么兑换">
          <p>
            三档都是<strong className="text-white/80">付款后即时发卡密</strong>
            ，不需要等人工。卡密发到你的订单里，兑换动作由你自己在兑换页发起。
          </p>
          <Steps
            steps={[
              { title: '下单付款', body: '支付宝付人民币，不需要任何境外支付方式。' },
              { title: '拿到卡密', body: '付款确认后卡密即时发放到订单里，随时可以回来查看。' },
              {
                title: '按商品说明取一段登录凭据',
                body: 'iOS 订阅充值这条链路需要一段凭据来执行这一笔充值，用途仅限于此。具体怎么取以对应商品页的说明为准。',
              },
              { title: '在兑换页提交', body: '提交后等待轮询结束，不要重复提交——重复提交可能消耗掉第二张卡密。' },
            ]}
          />
          <Warning>
            <strong className="text-white/80">兑换前先核对账户状态。</strong>
            账号上已有生效中的订阅、账单里有未结清或异常记录、或者刚刚充值过还在节流里，
            这几种情况提交都可能失败。账号状态类与凭据类的报错通常不消耗卡密，
            但<strong className="text-white/80">卡密一旦被上游核销就不能退</strong>
            ，无论充值成功与否。
          </Warning>
        </Section>

        <Section id="trust" heading="下单前值得核验的几件事">
          <p>这个行业无照个人卖家占多数，下面几条是你现在就能自己核验的，不是承诺：</p>
          <CheckList
            items={[
              <>
                <strong className="text-white/80">经营主体可查</strong>
                ：本站由益阳市赫山区必高科技有限公司运营，能开具增值税发票，发票抬头由你自己填。
              </>,
              <>
                <strong className="text-white/80">价格与成交数是实时数据</strong>
                ：上面那张表直接取自后台，「累计成交」是真实订单数，不是展示用的装饰数字。
              </>,
              <>
                <strong className="text-white/80">交付的是卡密，不碰你的账号</strong>
                ：充值动作由你自己发起，我们不需要你的账号密码。
              </>,
              <>
                <strong className="text-white/80">规则写在明处</strong>
                ：退款口径、质保边界都公开写在服务条款里，不是出事之后才解释。
              </>,
            ]}
          />
          <p>
            还是不放心的话，先从便宜得多的档位试起也是合理的做法——本站{' '}
            <Link href={landingPath('claude-pro')} className="text-purple-400 hover:text-purple-300">
              Claude Pro
            </Link>{' '}
            与{' '}
            <Link href={landingPath('chatgpt-plus')} className="text-purple-400 hover:text-purple-300">
              ChatGPT Plus
            </Link>{' '}
            都是一百多块的档位，跑通一次流程再买贵的。
          </p>
        </Section>

        <Section id="risk" heading="风险与退款口径，说在前面">
          <p>
            这一类商品客单价高，边界必须提前讲明白，不能等出事再解释：
          </p>
          <CheckList
            items={[
              <>
                <strong className="text-white/80">封号不质保。</strong>
                账号被服务商封禁通常源于账号本身或使用方式（频繁变动 IP 是最常见的一条），
                和这一笔充值没有直接关系，这种情况我们赔不了。
              </>,
              <>
                <strong className="text-white/80">已核销的卡密不退。</strong>
                充值动作一旦发生，无论结果如何都不能退。所以兑换前的账户状态核对不是走过场。
              </>,
              <>
                <strong className="text-white/80">订阅期内非因你自身原因掉订阅</strong>
                ，按剩余未使用天数折算退款。
              </>,
              <>
                <strong className="text-white/80">额度与功能不在质保范围内。</strong>
                每一档能用什么、额度多少由 xAI 决定且可能调整，本站只负责把这一笔充值充上去。
              </>,
            ]}
          />
        </Section>

        <Section id="faq" heading="常见问题">
          <FaqList faqs={FAQS} />
        </Section>

        <RelatedLandings currentSlug={DEF.slug} />
        <BrandDisclaimer />
      </LandingShell>
    </>
  )
}
