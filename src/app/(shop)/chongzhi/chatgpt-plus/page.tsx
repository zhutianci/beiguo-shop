// 【必须 force-dynamic】价格表要连库，而 builder 容器没有 DATABASE_URL，
// 被当成静态路由预渲染会让整个构建失败（/news、/links、sitemap 同理）。
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { getLandingProducts, lowestPrice, matchProducts, withLivePrice } from '@/lib/landing/products'
import { findLanding, LANDING_HUB, landingPath } from '@/lib/landing/registry'
import { JsonLd } from '@/lib/seo/jsonld'
import { breadcrumbJsonLd, faqJsonLd, productItemListJsonLd } from '@/lib/seo/graph'
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
 * ChatGPT Plus 充值落地页——这一批页面里的主力页。
 *
 * 【选词依据】2026-09-19 Google 中文下拉建议实测：
 *   · `chatgpt plus 国内` 返回 10 条联想，**无一条是纯信息词**（国内购买 / 国内订阅 /
 *     国内 如何 购买 / 国内 visa / 国内 怎么 充值 / 国内 银行 卡 / 国内代充 …）
 *     —— 全站商业密度最高的一组词，而且「国内」这个修饰词天然把海外内容排除在外。
 *   · 「信用卡被拒 / 付款未获批准」集群在三个独立种子词下反复出现，是重复率最高的痛点。
 *     搜这组词的人卡刚被拒、正在实时找替代方案，而本站的卡密正好就是那个替代方案——
 *     这一页的转化预期高于任何交易词。
 *   · 「代充」只有 3 条联想且全是信任审查（靠谱吗 / 知乎 / v2ex），所以它不当主词，
 *     而是放进正文与 FAQ 去承接那批在查「你是不是骗子」的人。
 *   · 「兑换码 / 充值卡 / 礼品卡」有真实联想，而本站交付的就是卡密——
 *     这三个词必须在正文里自然出现，是白捡的语义匹配。
 *
 * 【为什么不是 doorway page】Google 对 doorway 的判定看四条：换域名做变体、
 * 批量地域词页、纯中转页、批量近似页。这一页承载的是一整组同意图查询
 * （怎么充 / 多少钱 / 国内怎么买 / 信用卡被拒 / 两种方式怎么选），内容是这个站独有的
 * 运营知识（真实价格、真实成交数、两条兑换链路的实际差别、退款口径），
 * 且它进入 /chongzhi 这个可浏览层级、在 footer 和 hub 页都有入口。
 * 反面教材是把「代充 / 充值 / 怎么充值 / 多少钱」拆成四个近似页——那正是被点名的形态。
 *
 * 【正文里的事实来源】价格与成交数实时取库；兑换流程、质保口径、封号边界
 * 取自后台商品的 cardUsage 文案（商品 4 与商品 21），不是编的。
 * 改商品文案时要回来核对这一页。
 */

const DEF = findLanding('chatgpt-plus')

export async function generateMetadata(): Promise<Metadata> {
  const all = await getLandingProducts()
  const items = matchProducts(all, DEF.match)
  const low = lowestPrice(items)
  // 描述里带一个真实价格数字：竞品那几个教程站的 description 要么抓不到、要么没有数字，
  // 在 SERP 上摆一个「￥135 起」是免费的点击率优势。价格取实时最低价，不写死。
  const description = withLivePrice(DEF.description, low)

  return {
    title: DEF.title,
    description,
    alternates: { canonical: landingPath(DEF.slug) },
    openGraph: {
      type: 'website',
      title: DEF.title,
      description,
      url: landingPath(DEF.slug),
    },
    twitter: { card: 'summary_large_image', title: DEF.title, description },
  }
}

const FAQS: { q: string; a: string }[] = [
  {
    q: 'ChatGPT Plus 一个月多少钱人民币？',
    a: '官方定价是每月 20 美元，按汇率折算大约 145 元，实际扣款还会受发卡行汇率与手续费影响。本站两个档位的当前价格以本页上方的价格表为准（那张表直接取自后台实时数据），价格随上游成本与汇率浮动，下单时页面显示的实付金额才是最终金额。',
  },
  {
    q: '国内没有信用卡，能开 ChatGPT Plus 吗？',
    a: '可以。这正是卡密充值存在的原因——你不需要有任何境外支付方式，用支付宝在本站付人民币，拿到卡密之后到兑换页完成充值即可。整个过程不需要绑卡，也不需要虚拟信用卡。',
  },
  {
    q: '信用卡充值和 iOS 订阅充值，我该选哪一个？',
    a: '看你的账号当前状态。没有任何有效订阅、想要最低价，选信用卡档；已经在用 iOS 端、或者担心账号被风控，选 iOS 订阅档。两者充上去的都是同一个 Plus 会员，功能没有区别，区别只在充值链路。详见本页「两种充值方式怎么选」。',
  },
  {
    q: '为什么我自己的信用卡充值时提示「您的信用卡被拒绝了」？',
    a: '最常见的三个原因：卡的发卡行在中国大陆、账单地址与卡不匹配、以及 OpenAI 的风控直接拒绝了这张卡的 BIN 段。这不是你操作错了，国内双币卡被拒是普遍现象。与其反复试卡（试多了账号会被标记），不如直接走卡密充值。',
  },
  {
    q: '充值需要把我的账号密码给你们吗？',
    a: '不需要。本站交付的是卡密，你自己去兑换页完成充值，全程账号在你手里。iOS 订阅档需要你提供一段 session（登录凭据），这是兑换流程要求的，用途仅限执行这一笔充值。',
  },
  {
    q: '多久能到账？',
    a: '付款后卡密即时发放，兑换动作由你自己发起，兑换成功通常在几分钟内生效。如果兑换页显示处理中，等待轮询结束即可，不要重复提交。',
  },
  {
    q: '充上去之后掉订阅了怎么办？',
    a: '订阅期内非因你自身原因掉订阅，按剩余未使用天数折算退款。但账号被官方封禁不在质保范围内——封号通常是账号本身或使用方式的问题，与这一笔充值无关。这条口径写在服务条款里，下单前请先确认能接受。',
  },
  {
    q: '卡密买了没用完会过期吗？',
    a: '未使用的卡密不设统一有效期，具体以对应商品页的说明为准（Claude Pro 那一档明示永久有效）。但请注意：一旦卡密已被上游核销（也就是充值动作已经发生），无论结果如何都不能退。所以兑换前务必先核对账户状态。',
  },
  {
    q: 'ChatGPT 代充到底靠不靠谱，会不会被骗？',
    a: '这个行业确实鱼龙混杂，判断标准只有几个：卖家有没有可核验的经营主体、有没有公开的售后与退款规则、交付的是卡密还是让你交出账号。本站由益阳市赫山区必高科技有限公司运营，价格、累计成交数、退款规则全部公开在页面上，交付卡密而不碰你的账号。你可以先买最便宜的一档试。',
  },
  {
    q: '可以开发票吗？',
    a: '可以。订单完成后在站内申请，支持开具增值税发票或收据。需要注意：页面标价是不含税价，开发票要在售价之外另付 6% 税费（开票金额 = 售价 × 1.06），收据不涉及税费。开票时可以选择是否在票面上展示「ChatGPT」字样，抬头由你自己填。',
  },
]

export default async function ChatgptPlusLandingPage() {
  const all = await getLandingProducts()
  const items = matchProducts(all, DEF.match)
  const annual = all.filter((p) => p.categoryName === 'ChatGPT' && p.name.includes('年费'))
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
          // 这一页列的是档位、不是单个商品，所以用 ItemList 而不是 Product。
          // Product/Offer 标记留在 /products/[id]——那才是「买家能在上面完成购买」的页面，
          // 也是 Google 对 merchant listing 资格的明确要求。
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
              在中国大陆开通 ChatGPT Plus，卡在支付这一步的人远多于卡在别处的人：境内发行的
              信用卡大多会被直接拒绝，虚拟卡的成功率也在持续下降。绕过这一步的办法是
              <strong className="text-white/80">用卡密（也就是常说的兑换码、充值卡）充值</strong>
              ——你在本站用支付宝付人民币，拿到卡密自己去兑换，全程不需要任何境外支付方式。
            </p>
            <p>
              这一页把该说清楚的都说清楚：现在多少钱、两种充值方式的实际区别、下单到到账要做哪几步、
              信用卡被拒的几种情况分别怎么处理，以及哪些前提不满足就不要下单
              {low ? `。当前最低 ￥${low.toFixed(0)} 一个月。` : '。'}
            </p>
          </>
        }
      >
        <Section id="price" heading="价格与档位">
          <PriceTable
            items={items}
            note={
              <>
                价格随上游成本与汇率浮动，以下单时页面显示的实付金额为准。「累计成交」是本站真实订单数，
                不是展示用的装饰数字。
                {annual.length > 0 && (
                  <>
                    {' '}
                    需要包一年的话，另有{' '}
                    <Link href={`/products/${annual[0].id}`} className="text-purple-400 hover:text-purple-300">
                      {annual[0].name}
                    </Link>{' '}
                    ￥{annual[0].price.toFixed(0)}。
                  </>
                )}
              </>
            }
          />
        </Section>

        <Section id="how-to-choose" heading="两种充值方式怎么选">
          <p>
            两个档位充上去的都是同一个 ChatGPT Plus 会员，能用的模型和功能完全一样。
            区别只在「钱是怎么进到 OpenAI 那边的」，而这条链路决定了它对你的账号状态有什么要求。
          </p>

          <div className="overflow-x-auto rounded-2xl border border-white/10 my-6">
            <table className="w-full text-sm lg:text-[15px]">
              <thead>
                <tr className="bg-white/5 text-left text-white/50">
                  <th scope="col" className="px-4 py-3 font-medium">对比项</th>
                  <th scope="col" className="px-4 py-3 font-medium">信用卡充值档</th>
                  <th scope="col" className="px-4 py-3 font-medium">iOS 订阅充值档</th>
                </tr>
              </thead>
              <tbody className="text-white/70">
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">走的通道</td>
                  <td className="px-4 py-3">上游用信用卡为你的账号订阅</td>
                  <td className="px-4 py-3">通过苹果 App Store 的订阅体系</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">你要提供什么</td>
                  <td className="px-4 py-3">账号邮箱</td>
                  <td className="px-4 py-3">账号 session（登录凭据）</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">价格</td>
                  <td className="px-4 py-3">更低</td>
                  <td className="px-4 py-3">略高</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">适合谁</td>
                  <td className="px-4 py-3">账号干净、没有有效订阅、要最低价</td>
                  <td className="px-4 py-3">已在 iOS 端使用、或更在意风控</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Warning>
            无论选哪一档，<strong>提交前都要先确认账号当前没有有效订阅、也没有未结清的异常账单</strong>。
            不满足前提就提交，卡密会被上游核销掉，而充值不会成功——这种情况按已核销处理，退不了。
            这是本站售后里最常见的一类纠纷，花一分钟核对能省掉它。
          </Warning>
        </Section>

        <Section id="steps" heading="从下单到到账，一共四步">
          <Steps
            steps={[
              {
                title: '选档位并下单',
                body: (
                  <>
                    在上面的价格表里点进对应商品，用支付宝付款。卡密会发到你登录本站所用的账号邮箱，
                    要保证这个邮箱能正常收信。
                  </>
                ),
              },
              {
                title: '拿到卡密',
                body: (
                  <>
                    卡池正常时付款确认后即时发放（极少数缺货情况下会转人工补发，订单页会标注），可以在{' '}
                    <Link href="/orders" className="text-purple-400 hover:text-purple-300">
                      我的订单
                    </Link>{' '}
                    里看到，同时会发到你的账号邮箱。卡密会一直留在订单里，找不到了随时回去看，
                    还是找不到就联系客服。
                  </>
                ),
              },
              {
                title: '核对账户状态',
                body: <>确认账号没有有效订阅、账单里没有未结清或异常退款记录。这一步别跳过，理由见上面那条提醒。</>,
              },
              {
                title: '兑换',
                body: (
                  <>
                    在{' '}
                    <Link href="/orders" className="text-purple-400 hover:text-purple-300">
                      我的订单
                    </Link>{' '}
                    里复制卡密，点这一单上的「去充值 / 兑换」跳到兑换页，把卡密粘进去，
                    按页面提示填写邮箱或粘贴 session，提交后等待处理完成。处理中不要重复提交——
                    重复提交不会更快，只会让排查变复杂。
                  </>
                ),
              },
            ]}
          />
        </Section>

        <Section id="card-declined" heading="信用卡被拒、付款未获批准：先分清是哪一种">
          <p>
            「您的信用卡被拒绝了」这句提示底下藏着好几种完全不同的原因，处理方式也不一样。
            按下面的顺序对一遍，比反复换卡试有用得多——而且反复失败的支付尝试本身会让账号更容易进风控。
          </p>

          <SubSection heading="境内发行的信用卡被拒">
            <p>
              这是最常见的一种，也是最没得救的一种。中国大陆发行的卡（包括双币卡）在 OpenAI 的支付
              环节被拒是普遍现象，不是你的卡有问题，换一张境内卡结果一样。这种情况直接走卡密充值。
            </p>
          </SubSection>

          <SubSection heading="虚拟信用卡被拒 / 余额充足也扣不了">
            <p>
              虚拟卡的 BIN 段被大批量识别后会整段失效，昨天能用今天不能用是常态。还有一种情况是
              卡里余额够，但发卡方不支持这一类订阅扣款。这两种都不值得继续折腾。
            </p>
          </SubSection>

          <SubSection heading="提示「付款未获批准」但卡是好的">
            <p>
              这通常是账单地址与发卡信息对不上，或者同一账号短时间内失败次数过多被临时限制。
              后者等 24 小时再试有时能过，但如果你已经失败过好几次，继续试的收益很低。
            </p>
          </SubSection>

          <SubSection heading="已经有订阅了，还想再充">
            <p>
              账号上已经有一个有效订阅时，无论哪条链路都充不进去。要么等当期到期，要么联系客服说明情况。
              直接提交只会白白核销一张卡密。
            </p>
          </SubSection>

          <p className="pt-2">
            如果你已经走到「试了好几张卡都不行」这一步，卡密充值就是为这个场景准备的。它不经过你的卡，
            也不需要你有任何境外支付方式。
          </p>
        </Section>

        <Section id="trust" heading="为什么这一单可以放心下">
          <p>
            搜「ChatGPT 代充」的人，一半是在问「会不会被骗」。这个疑虑是合理的——这个行业里
            无照个人卖家占多数，收了钱跑路、或者把你的账号密码要走的都有。下面是可以核验的部分：
          </p>
          <CheckList
            items={[
              <>
                <strong className="text-white/80">有可核验的经营主体</strong>
                ：本站由益阳市赫山区必高科技有限公司运营，能开具增值税发票（页面标价不含税，开票需另付 6% 税费），发票和收据上盖的是这家公司的章。
              </>,
              <>
                <strong className="text-white/80">交付的是卡密，不碰你的账号密码</strong>
                ：充值动作由你自己发起，账号全程在你手里。
              </>,
              <>
                <strong className="text-white/80">价格、库存、累计成交都公开在页面上</strong>
                ：上面那张表里的成交数是真实订单数，不是摆着看的。
              </>,
              <>
                <strong className="text-white/80">退款规则写在明处</strong>：掉订阅按剩余天数退、
                未使用的卡密可退、已核销的不退、封号不质保。规则不好看但不含糊，全部写在{' '}
                <Link href="/terms" className="text-purple-400 hover:text-purple-300">
                  服务条款
                </Link>{' '}
                里。
              </>,
              <>
                <strong className="text-white/80">先小后大</strong>：不放心就先买最便宜的一档试，
                跑通一次再买贵的。
              </>,
            ]}
          />
        </Section>

        <Section id="faq" heading="常见问题">
          <FaqList faqs={FAQS.map((f) => ({ q: f.q, a: f.a }))} />
          <p className="pt-4 text-sm text-white/40">
            还有别的问题，可以翻{' '}
            <Link href="/support" className="text-purple-400 hover:text-purple-300">
              客服中心
            </Link>
            ，或加客服微信 <span className="font-mono text-white/60">GenuineMarxist</span>。
          </p>
        </Section>

        <RelatedLandings currentSlug={DEF.slug} />
        <BrandDisclaimer />
      </LandingShell>
    </>
  )
}
