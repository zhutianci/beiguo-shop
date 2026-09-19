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
 * Codex 接码落地页——这一批页面里客单价最低、但尾部词最肥的一页。
 *
 * 【选词依据】2026-09-19 Google 中文下拉建议实测：
 *   · 「codex 接码」返回 9 条联想，是全部冷门种子词里尾巴最长的一组：
 *     codex接码 / codex接码 linux do / codex接码验证 / codex接码是什么意思 /
 *     codex接码手机号 / codex 接 码 购买 / codex接码平台sms / codex接码教程 / codex接码sms。
 *     九条里有信息意图（是什么意思 / 教程）、有交易意图（购买）、有信任审查（linux do），
 *     一页把三种意图一起吃掉才划算，拆成三页就是 doorway 的形态。
 *   · 头部词「接码平台」的 10 条联想里，最后一条正是「接码平台 codex」——
 *     说明 Codex 这个场景已经反向挤进了通用接码词的联想池，不是我们臆想出来的需求。
 *   · 「codex接码是什么意思」这一条很关键：有相当一批人根本不知道接码是什么。
 *     所以开头必须先用几句话把「借一个号收一条一次性验证码」讲明白，
 *     但不能写成百科条目——他们是来解决注册卡壳的，不是来学名词的。
 *   · 【必须做消歧】叫 Codex 的产品与站点不止一个，不写死「OpenAI Codex」
 *     会被同名站整体淹没。H1 与首段都出现「OpenAI Codex」是硬要求。
 *   · 「代开」「代购」「代订阅」「ai代充」联想数全部为 0，正文里一个都不用。
 *     「代充」只在 FAQ 里出现一次，用来承接那批在查「你是不是骗子」的人。
 *   · 「兑换码 / 充值卡 / 卡密」有真实联想，而本站交付的就是卡密——自然出现，不堆砌。
 *   · 「会员」这个词对 ChatGPT 侧不成立（chatgpt会员 返回的是亚美尼亚语联想），
 *     所以这一页通篇说「订阅」「充值」，不说「ChatGPT 会员」。
 *
 * 【为什么不是 doorway page】Google 判 doorway 看四条：换域名做变体、批量地域词页、
 * 纯中转页、批量近似页。这一页承载的是一整组同意图查询（接码是什么 / 怎么用 / 去哪买 /
 * 收不到码怎么办 / 靠不靠谱），正文是这个站独有的运营知识：两个档位号码来源的真实差别、
 * 商品页写着的质保口径、已核销不退的边界、以及「什么时候该停止接码改买订阅」——
 * 最后这一条是把用户劝离本页商品的内容，中转页不会这么写。
 * 它同时进入 /chongzhi 这个可浏览层级，hub 页与 footer 都有入口。
 *
 * 【正文里的事实来源】价格、库存、累计成交实时取库，不写死。
 * 「包过，不成功不收费」是商品 10 的 description 原话，不是我们替它承诺的；
 * 「单次接码」取自商品 10 的商品名。商品 28（随机地区）后台没有同类表述，
 * 所以这一页明确写「不要默认它有同样口径」——改商品文案时要回来核对这一页。
 *
 * 【运营定位】客单价只有十几块，这一页按引流页做：正文里把重度用户导向
 * /chongzhi/chatgpt-pro 与 /chongzhi/chatgpt-plus。反复接码注册新号的人
 * 长期算下来花得更多，把这笔账摊开给他看，比多卖一张 15 块的卡密值钱。
 */

const DEF = findLanding('codex-jiema')

export async function generateMetadata(): Promise<Metadata> {
  const all = await getLandingProducts()
  const items = matchProducts(all, DEF.match)
  // 【这里不能用 lowestPrice】description 里的「￥15/次」特指美区实体卡那一档，
  // 而全站最低价是随机地区档。拿最低价去替换会写出「美区实体手机卡接码（￥8/次）」这种假话。
  const physical = items.find((p) => p.name.includes('实体'))
  // 【这里不能用全站最低价】description 里那个数字特指美区实体卡那一档，
  // 而最低价是随机地区档（更便宜）。拿最低价替换会写出「美区实体手机卡接码（￥8/次）」这种假话。
  // 模式限定到「￥数字/次」，格式漂了会在日志里告警而不是静默发旧价。
  const description = withLivePrice(DEF.description, physical?.price ?? null, /￥\d+(?:\.\d+)?\/次/)

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
    q: 'codex 接码是什么意思？',
    a: '接码就是借一个能收短信的手机号，用它接收一条一次性的验证码，收完这一次就结束。号码不归你，也不是买号、租号或者共享账号。注册 OpenAI Codex 用的是 ChatGPT 账号，如果注册过程里卡在「请输入手机号码」那一步、国内号码又过不去，用得上的就是这个。本站交付的是卡密：付款后拿到兑换码，自己到兑换页取号码收码，账号全程在你手里。',
  },
  {
    q: '注册 OpenAI Codex 一定要手机验证码吗？',
    a: '不是每个人都会被要求，但被要求的比例很高，而且触发与否由 OpenAI 判断，你改不了。比较常见的是换了网络环境、同一环境下注册过多个账号、或者账号在使用过程中被要求补验证。会不会弹、什么时候弹，以你注册时页面上的提示为准。',
  },
  {
    q: '接码平台的虚拟号能不能用来注册 Codex？',
    a: '大概率不行。手机号验证这一步会看号码的运营商类型，网络电话（VoIP）这类号段是明确不收的；更现实的问题是公共接码平台的号池被反复使用，同一个号码给几十上百个账号收过码，在风控侧早就挂了名。这也正是本站美区实体手机卡那一档比随机地区档贵的原因——贵在号码本身的干净程度，不是贵在服务。',
  },
  {
    q: '美区实体手机卡和随机地区，我该买哪一档？',
    a: '想一次过就买美区实体手机卡那一档，它的商品页原话是「包过，不成功不收费，有问题及时联系客服」。随机地区那一档更便宜，适合你只是想先试一下、失败了也无所谓的场景；它的商品页上没有同样的包过表述，需要确认口径请先问客服，不要默认两档一样。另外提醒一句：两档差价只有几块钱，而失败一次要重新走一遍注册流程，为省这几块钱多折腾一轮通常不划算。',
  },
  {
    q: '一张卡密能接几次码？',
    a: '美区实体手机卡那一档的商品名里写明是「单次接码」，一张卡密对应一次收码，要再收一次得再买一张。随机地区那一档如果你需要多次使用，下单前请找客服确认。',
  },
  {
    q: '号码收不到验证码，钱退不退？',
    a: '美区实体手机卡那一档商品页写的是「包过，不成功不收费，有问题及时联系客服」，按这个口径处理，遇到问题直接找客服。其他情况按本站统一规则：未使用的卡密可以退，已经核销的（也就是号码已经发给你、接码已经发起）按已使用处理，退不了。所以建议拿到号码之前先把注册页面准备到手机验证那一步，别拿到号码再回头研究下一步该点哪里。',
  },
  {
    q: '这个号码以后还能用来登录或者做二次验证吗？',
    a: '不要这么用。单次接码保证的只是这一次能收到验证码，号码不属于你，之后落到谁手里、还会不会给你转发短信，都不在你的控制范围内。如果你的账号需要一个长期可用的号码（比如后续可能被要求重新验证），这不是单次接码能解决的事，请先联系客服说明用途。',
  },
  {
    q: 'codex 接码靠不靠谱，会不会被骗？',
    a: '搜「codex 接码 linux do」或者「代充 靠谱吗」的人，都是在找有人用过的证据，这种谨慎是对的。可以核验的有几条：本站由益阳市赫山区必高科技有限公司运营，能开具增值税发票（标价不含税，开票需另付 6% 税费）；价格、库存、累计成交数直接显示在本页的表里，成交数是真实订单数；交付的是卡密，不需要你交出任何账号密码；退款与质保规则公开写在服务条款里。最便宜的一档只要几块钱，不放心就先花这个钱把流程跑通一次再说。',
  },
  {
    q: '收不到码的时候，我可以一直点重新发送吗？',
    a: '先分清是「没收到」还是「号码被拒」。页面直接提示这个号码不能用于验证，那是被拒，再点多少次也不会来，应该联系客服换号码。如果页面显示已发送，等一会儿再看，同一个流程里反复触发重发没有好处。具体等待时长和重发次数以你看到的页面提示为准，本页不给一个编出来的数字。',
  },
  {
    q: '接码成功注册好账号，就能直接用 Codex 了吗？',
    a: 'Codex 的可用范围和用量跟着这个 ChatGPT 账号的订阅等级走，具体以 OpenAI 页面上显示的为准。接码只解决「有没有一个能收码的号码」这一关，不解决额度，也不解决账号后续会不会被风控。如果你是每天都要用 Codex 的人，比起被封一次就重新注册一次，把订阅充够更省事也更省钱——本站的 ChatGPT Plus 与 Pro 5x 充值都在站内，见本页下方的相关链接。',
  },
]

export default async function CodexJiemaLandingPage() {
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
              注册 <strong className="text-white/80">OpenAI Codex</strong>
              （也就是用 ChatGPT 账号登录的那个编程智能体）时，很多人是卡在「请输入手机号码」这一步的：
              国内号码填进去要么直接被判定不可用，要么根本不发短信。
              <strong className="text-white/80">接码</strong>
              就是为这一步准备的——借一个能收短信的号码，接收一条一次性验证码，收完这一次就结束。
              号码不归你，不是买号，也不是把账号交给别人。
            </p>
            <p>
              这一页讲三件事：为什么便宜的虚拟号在 OpenAI 这边基本过不去、美区实体手机卡贵在哪、
              以及收不到验证码时该按什么顺序排查。最后还有一节讲什么时候该停止接码——
              如果你是被封一次就重新注册一次的那种用法，这笔账算下来并不便宜
              {low ? `。当前最低 ￥${low.toFixed(0)} 接一次码。` : '。'}
            </p>
          </>
        }
      >
        <Section id="price" heading="价格与档位">
          <PriceTable
            items={items}
            note={
              <>
                价格随上游成本浮动，以下单时页面显示的实付金额为准。「累计成交」是本站真实订单数，
                不是展示用的装饰数字——两档之间成交数的差距，本身就说明了大家实际在买哪一档。
                美区实体手机卡那一档的商品名里写明是「单次接码」，一张卡密对应一次收码；
                随机地区那一档如果你需要多次使用，下单前先找客服确认口径。
              </>
            }
          />
        </Section>

        <Section id="what-is" heading="接码到底是什么：三句话说完">
          <p>
            <strong className="text-white/80">接码 = 借一个能收短信的手机号，用它接一条一次性的验证码。</strong>
            你在 OpenAI 的注册页面填上这个号码，OpenAI 往它发一条六位数的短信，
            你从提供号码的那一方拿到这六位数，填回注册页面，这一单就结束了。号码不会转给你，
            你也不会拿到任何别人的账号——账号是你自己注册的，密码是你自己设的，全程在你手里。
          </p>
          <p>
            所以接码解决的问题很窄：<strong className="text-white/80">只解决「有没有一个号码能收到这条短信」</strong>。
            它不解决你的网络环境，不解决注册完之后账号会不会被风控，更不解决额度问题。
            把它当成一把开门的钥匙就对了，别指望它顺带解决屋里的事。
          </p>

          <SubSection heading="先消个歧：这里说的是 OpenAI Codex">
            <p>
              叫 Codex 的东西不止一个，网上同名的产品和站点都有。本页从头到尾说的都是
              <strong className="text-white/80">OpenAI 的 Codex</strong>
              ——它用的就是 ChatGPT 账号体系，你要注册的其实是一个 OpenAI 账号，
              手机验证这一关也是 OpenAI 那边的。如果你要找的是别家的同名产品，这一页对你没用。
            </p>
            <p>
              顺带一提，Codex 这个名字 OpenAI 用过两轮：早年是那个代码补全模型，
              后来这个名字被放到了新的编程智能体上。搜索结果里两种含义混在一起是正常的，
              但注册流程要看的只有一个，就是现在 ChatGPT 账号那一套。
            </p>
          </SubSection>
        </Section>

        <Section id="physical-vs-virtual" heading="美区实体手机卡 vs 随机地区：钱到底花在哪">
          <p>
            这是这一页最值得看的一节。两个档位交付的动作是一样的——给你一个号码、你收一条短信——
            但号码的来源完全不同，而 OpenAI 那边看的恰恰就是号码的来源。
          </p>

          <div className="overflow-x-auto rounded-2xl border border-white/10 my-6">
            <table className="w-full text-sm lg:text-[15px]">
              <thead>
                <tr className="bg-white/5 text-left text-white/50">
                  <th scope="col" className="px-4 py-3 font-medium">对比项</th>
                  <th scope="col" className="px-4 py-3 font-medium">美区实体手机卡</th>
                  <th scope="col" className="px-4 py-3 font-medium">随机地区</th>
                </tr>
              </thead>
              <tbody className="text-white/70">
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">号码来源</td>
                  <td className="px-4 py-3">美国运营商发行的实体 SIM 卡</td>
                  <td className="px-4 py-3">号池分配，地区随机</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">这个号码被用过多少次</td>
                  <td className="px-4 py-3">少</td>
                  <td className="px-4 py-3">不确定，可能很多</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">价格</td>
                  <td className="px-4 py-3">高</td>
                  <td className="px-4 py-3">低</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">商品页的质保口径</td>
                  <td className="px-4 py-3">写着「包过，不成功不收费」</td>
                  <td className="px-4 py-3">没有同类表述，需问客服</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">适合谁</td>
                  <td className="px-4 py-3">要一次过、不想重来的人</td>
                  <td className="px-4 py-3">想先花最少的钱试一下的人</td>
                </tr>
              </tbody>
            </table>
          </div>

          <SubSection heading="为什么虚拟号在 OpenAI 这边容易被拒">
            <p>
              两个原因，而且是叠加的。第一个是号码类型：手机验证这一步会去查这个号码属于哪一类，
              网络电话（VoIP）、网页短信服务这类号段是被明确排除的，填进去连短信都不会发，
              页面直接告诉你这个号码不能用于验证。
            </p>
            <p>
              第二个原因更致命，也更少被人提起：<strong className="text-white/80">号池是被反复使用的</strong>。
              便宜的接码服务背后就那么一批号码，一个号码给几十上百个账号收过验证码，
              在风控那边等于早就登记在册。你拿到它的时候，它可能已经「为 OpenAI 服务」过很多次了。
              号码类型这一关就算过了，历史这一关也过不去。
            </p>
          </SubSection>

          <SubSection heading="实体卡为什么成功率高">
            <p>
              实体卡就是真的插在设备上的运营商号码，号段和普通美国用户没有区别，
              在号码类型这一关天然是干净的。更重要的是它有物理成本——一张卡就是一张卡，
              不可能像号池那样被摊薄到几百次使用上去，所以单张卡承载的注册量少得多。
            </p>
            <p>
              这两条加起来就是差价的全部来源：你多付的那几块钱买的不是「更好的服务」，
              是<strong className="text-white/80">一个被用得更少、类型更正常的号码</strong>。
              这一页不会给你一个成功率百分比——那个数字我们没有可信的统计口径，编一个出来没意义。
              能确定的只有商品页上写着的那句「包过，不成功不收费」。
            </p>
          </SubSection>

          <Warning>
            便宜档失败一次，损失的不只是那几块钱。
            <strong>号码一旦发给你、接码已经发起，这张卡密就按已核销处理，退不了</strong>
            ——不管你最后有没有收到码（美区实体卡那一档另有商品页写明的包过口径，见上表）。
            算上重新走一遍注册流程的时间，两档之间那点差价通常不值得省。
          </Warning>
        </Section>

        <Section id="steps" heading="从下单到收到验证码">
          <Steps
            steps={[
              {
                title: '先把注册页面准备好，再下单',
                body: (
                  <>
                    这一步顺序反了是最常见的失误。先在 OpenAI 那边把注册走到「请输入手机号码」这一屏，
                    确认自己下一步该点哪里，再回来下单。
                    <strong>付款之后系统会立刻自动取号，号码一取出就开始计时</strong>，
                    这时候再去研究流程等于在浪费这次机会。
                  </>
                ),
              },
              {
                title: '选档位并下单',
                body: (
                  <>
                    在上面的价格表里点进对应商品，用支付宝付款。
                    <strong>这一类商品不发卡密</strong>——付款确认后系统会自动为这一单取一个号码。
                  </>
                ),
              },
              {
                title: '到订单里拿号码',
                body: (
                  <>
                    打开{' '}
                    <Link href="/orders" className="text-purple-400 hover:text-purple-300">
                      我的订单
                    </Link>{' '}
                    ，这一单下面会出现分配给你的手机号和一个倒计时。页面会自己刷新，不用手动重进。
                    如果显示取号失败，订单备注里会写明并转客服处理，这种情况不会白扣。
                  </>
                ),
              },
              {
                title: '填号码、收码、填回去',
                body: (
                  <>
                    把订单里那个号码填进 OpenAI 的手机验证那一屏，触发发送，然后回到订单页等验证码——
                    收到之后会直接显示在同一个位置，复制填回 OpenAI 即可。
                    中间任何一步卡住，直接联系客服，不要自己反复重试到把机会耗光。
                  </>
                ),
              },
            ]}
          />
        </Section>

        <Section id="troubleshoot" heading="收不到验证码：按这个顺序排查">
          <p>
            下面是排查的顺序，不是清单——从上往下走，走到哪一条对上了就停在那里处理。
            本页不给「等几秒」「最多重试几次」这种具体数字，因为那取决于当时的链路，
            编一个出来只会让你在错误的时间点做错误的动作。
          </p>

          <SubSection heading="第一步：分清「没收到」和「号码被拒」">
            <p>
              这两件事看起来都是「码没来」，处理方式完全相反。
              如果 OpenAI 的页面直接提示这个号码不能用于验证、或者不接受这类号码，
              那是<strong className="text-white/80">被拒</strong>——短信根本没发出来，
              你再等、再点重发都不会有结果，应该直接联系客服换号码。
              如果页面显示已发送、只是短信还没到，那才是真正意义上的「没收到」。
            </p>
          </SubSection>

          <SubSection heading="第二步：号码本身有没有填错">
            <p>
              最常见的三种填法错误：国家区号选错、把区号和号码重复填了一遍、
              以及沿用国内习惯在号码前多加了一个 0。国际号码在不同页面上的填法不统一，
              有的地方要带加号和国家码，有的地方国家码在下拉框里选。
              删掉重填一次，比继续等有用。
            </p>
          </SubSection>

          <SubSection heading="第三步：确认你触发的是短信，不是语音">
            <p>
              验证环节通常有短信和语音电话两个选项，有些页面会在多次失败后默认切到语音。
              接码服务收的是短信，选成语音自然什么都收不到。回去看一眼当前选的是哪一个。
            </p>
          </SubSection>

          <SubSection heading="第四步：确认注册流程没有中途断掉">
            <p>
              中途换浏览器、清 cookie、开新窗口重进、或者网络环境变了，
              都可能让这个注册会话失效。流程重来之后，之前发出去的那条短信对应的是旧会话，
              就算收到了也填不进去。这种情况要重新触发一次发送——
              而如果你买的是单次接码，重新触发是否还在同一次服务范围内，以客服的说明为准。
            </p>
          </SubSection>

          <SubSection heading="第五步：还是不行就找客服，不要自己耗">
            <p>
              带上订单号、你填的号码、以及 OpenAI 页面上的原话截图去找客服，
              这三样齐了排查最快。美区实体手机卡那一档的商品页原话是
              「包过，不成功不收费，有问题及时联系客服」，遇到问题按这个口径走。
              客服微信是 <span className="font-mono text-white/60">GenuineMarxist</span>，
              也可以从{' '}
              <Link href="/support" className="text-purple-400 hover:text-purple-300">
                客服中心
              </Link>{' '}
              进。
            </p>
          </SubSection>

          <p className="pt-2">
            另外两件不要做的事：不要把卡密或者拿到的号码贴到公开论坛里求助，
            贴出去等于把它交给所有人；不要在同一屏上无限点「重新发送」，
            那不会让短信更快，只会让这次会话更难排查。
          </p>
        </Section>

        <Section id="platform" heading="为什么不自己去接码平台买">
          <p>
            搜「接码平台 codex」「codex 接码平台 sms」的人，找的多半是一个能自助下单的网站。
            这类平台确实存在，价格也确实可以做到比这里更低，该说的实话是：
            <strong className="text-white/80">本站这两档本质上也是接码，没有什么神秘的东西</strong>。
            区别在下面这几处，你自己判断值不值这个差价。
          </p>
          <CheckList
            items={[
              <>
                <strong className="text-white/80">计费口径看清楚</strong>
                ：各家不一样，有的按「号码发放」计费而不是按「成功收到码」计费。
                这两种口径在你失败的时候差别很大，下单前一定要看清楚写的是哪一种。
              </>,
              <>
                <strong className="text-white/80">号池的干净程度不透明</strong>
                ：价格压得越低，号码被复用的次数通常越多。你付款之前看不到这个号码之前干过什么。
              </>,
              <>
                <strong className="text-white/80">出了问题能不能找到人</strong>
                ：本站有中文客服、有订单号、有可核验的经营主体（益阳市赫山区必高科技有限公司），
                能开增值税发票（标价不含税，开票需另付 6% 税费）。这三样在纯自助平台上通常都没有。
              </>,
              <>
                <strong className="text-white/80">交付的是卡密，不碰你的账号</strong>
                ：你拿到的是一串兑换码，注册动作从头到尾是你自己做的，
                我们不需要、也不会要你的账号密码。
              </>,
              <>
                <strong className="text-white/80">先小后大</strong>
                ：不放心就先买最便宜的一档跑通一次流程，几块钱的事，比看十条评价都管用。
              </>,
            ]}
          />
        </Section>

        <Section id="when-to-stop" heading="接码只解决一关：什么时候该停下来">
          <p>
            这一节对我们是减少一笔生意，但它是这一页最该写的部分。
            接码解决的是号码这一关，不解决后面的任何一关——账号注册出来之后会不会被风控、
            能用多久、有多少额度，跟你用哪个号码收的验证码没有关系。
          </p>
          <p>
            所以如果你现在做的事情是「号被封了就再注册一个」，请把账算一遍：
            每封一次就要再买一次接码，再配一遍环境，再登录一遍，
            而之前那个账号里的会话记录、设置、正在进行的工作全部不会跟过来。
            接码本身不贵，贵的是每一轮重来的时间，以及新号一开始就带着的不确定性。
          </p>
          <p>
            Codex 的可用范围和用量是跟着这个 ChatGPT 账号的订阅等级走的，
            具体以 OpenAI 页面上显示的为准。真正每天都在用 Codex 写代码的人，
            稳定的做法是把一个号养住、把订阅充够，而不是在注册页面上反复投硬币。
            本站{' '}
            <Link href={landingPath('chatgpt-pro')} className="text-purple-400 hover:text-purple-300">
              ChatGPT Pro 5x 充值
            </Link>{' '}
            和{' '}
            <Link href={landingPath('chatgpt-plus')} className="text-purple-400 hover:text-purple-300">
              ChatGPT Plus 充值
            </Link>{' '}
            都在站内，同样是卡密自助兑换，不需要信用卡。
          </p>
          <p>
            反过来说，如果你只是想开一个号试试 Codex 能干什么，那就买这一页上最便宜的一档，
            花几块钱把门打开。这两种需求本来就不该用同一个方案。
          </p>
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
