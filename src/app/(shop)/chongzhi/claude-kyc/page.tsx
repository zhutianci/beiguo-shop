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
import { OG_IMAGES, OG_SITE, TWITTER_IMAGES } from '@/lib/seo/og'

/**
 * Claude KYC 认证落地页——这一批页面里竞争最低、但最容易写飘的一页。
 *
 * 【选词依据】2026-09-19 Google 中文下拉建议实测：
 *   · `claude kyc` 返回 9 条联想（怎么过 / 是什么 / 身份验证 / 中国护照 / 香港 /
 *     verification …），而中文内容侧几乎空白——有真实查询量、没有像样的中文答案，
 *     是这一批词里投入产出比最高的一个。
 *   · **主词必须是「Claude KYC 认证」，不能退化成「Claude 认证」**：后者被
 *     「认证架构师 / 认证工程师 / 认证课程」整片污染，搜出来的是考证人群，
 *     和这一页要接的「账号被弹了验证」人群完全不是同一批人。所以 H1、H2 与正文里
 *     出现「认证」时一律带 KYC，并且专门写了一节把两者拆开——那一节同时也是
 *     给搜索引擎的消歧信号。
 *   · 「会员」这个词对 Claude 成立（claude 会员 返回 10 条满额联想），所以本页
 *     在指向 Claude Pro 充值时可以放心用「会员」；ChatGPT 侧不行，那边另有说明。
 *   · 「代充」只有 3 条联想且全是信任审查意图（靠谱吗 / 知乎 / v2ex），不当主词，
 *     只在 FAQ 里用一条来承接那批在查「你是不是骗子」的人。
 *
 * 【为什么不是 doorway page】这一页不是「claude kyc」这个词的关键词页，
 * 它承载的是一个完整的求助场景：怎么确认自己遇到的是不是 KYC、被弹之后哪些动作
 * 会让情况更糟、准备什么、失败了还剩多少空间、以及要不要找人代办。
 * 内容是这个站独有的——真实价格、真实成交数、真实的服务边界与退款口径，
 * 并且它进入 /chongzhi 这个可浏览层级，在 hub 页、footer 和兄弟页之间互链。
 *
 * 【克制线，改这一页的人务必先读】Anthropic 没有公开过 KYC 的触发条件与判定标准。
 * 因此本页**不写**：通过率数字、具体证件清单、界面截图位置、触发规则、重试次数上限。
 * 能写的只有四类：KYC 这个概念本身、如何把它和封禁/登录/支付问题区分开、
 * 通用的「别把唯一一次机会浪费掉」的行为建议、以及本站这项服务自己的交付口径
 * （人工交付、半小时内完成、失败不收费）。后者的事实来源是后台商品 8 的描述字段，
 * 改商品文案时要回来核对这一页。
 *
 * 【交付方式与其他页不同】站上其他商品发的是卡密，这一项是 MANUAL（人工）。
 * 价格表下面的说明、Steps 第 3 步都必须把「不会给你兑换码，要联系客服」写死，
 * 否则买家会一直在订单页等一串卡密。
 */

const DEF = findLanding('claude-kyc')

export async function generateMetadata(): Promise<Metadata> {
  const all = await getLandingProducts()
  const items = matchProducts(all, DEF.match)
  const low = lowestPrice(items)
  // description 里那个价格数字取实时最低价，不写死——商品调价之后 SERP 上的数字
  // 还停在旧值，是比没有数字更糟的情况。
  const description = withLivePrice(DEF.description, low)

  return {
    title: DEF.title,
    description,
    alternates: { canonical: landingPath(DEF.slug) },
    openGraph: {
      ...OG_SITE,
      images: OG_IMAGES,
      type: 'website',
      title: DEF.title,
      description,
      url: landingPath(DEF.slug),
    },
    twitter: { images: TWITTER_IMAGES, card: 'summary_large_image', title: DEF.title, description },
  }
}

// 【这一份 FAQS 同时喂给页面与 JSON-LD】标记页面上看不到的内容是明令禁止的，
// 所以不存在「只给爬虫看的那一份」。问题写成用户会敲进搜索框的原话。
const FAQS: { q: string; a: string }[] = [
  {
    q: 'Claude KYC 是什么意思？',
    a: 'KYC 是 know your customer 的缩写，是金融与互联网服务里通用的说法，指服务方要求你证明自己是一个真实存在、可被识别的人。放到 Claude 上，它表现为账号被要求完成一次身份验证，在完成之前，账号的部分或全部功能会被挡住。它和你买的是 Pro 还是 Max、和你花了多少钱没有关系，也不是什么账号等级。',
  },
  {
    q: 'Claude 突然要求 KYC 身份验证，我的账号是不是废了？',
    a: '被要求做 KYC 是一道验证，不是一份判决，和账号被停用是两回事——两者在界面上的提示措辞完全不同。如果你看到的是要求你完成身份验证，账号还在流程里；如果看到的是账号已停用、违反使用政策一类的说法，那属于封禁，不在这一页讨论的范围内，代办也帮不上忙。先按屏幕上的原文分清楚是哪一种，再决定下一步。',
  },
  {
    q: 'Claude KYC 怎么过？有没有必过的办法？',
    a: '没有。Anthropic 没有公开过 KYC 的判定标准，任何人告诉你「按这几步做就一定过」都是在编。现实里能提高结果的只有两件事：按界面上实际要求的东西准备，以及一次做对、不要靠反复提交去碰运气。我们提供的是人工协助把流程走完，不是保证通过——正因为不能保证，才有「认证失败不收费」这一条。',
  },
  {
    q: '中国护照能过 Claude KYC 吗？',
    a: '这是搜索里出现最多的具体问题，但诚实的答案是：没有任何公开规则说明哪一类证件一定可以或一定不可以，我们也不会给你一个拍脑袋的结论。界面上要求什么就以什么为准。你手上有哪些材料，下单前先发给客服，由客服看过再判断这单要不要做——这比在网上找一个别人的成功截图去赌划算得多。',
  },
  {
    q: '香港身份或者香港手机号，对 Claude KYC 有帮助吗？',
    a: '同上，没有公开依据可以支持这个说法。网上关于地区、证件、手机号归属地的各种经验帖互相矛盾，谁都拿不出可验证的规则。与其为这一步特地去折腾一套新身份，不如先把屏幕上实际要求的内容拿给客服看一眼。',
  },
  {
    q: 'Claude KYC 失败了还能再试吗？',
    a: '能重试的次数不是无限的，具体几次官方没有公开说法。正因为不知道上限，最稳妥的做法是按「只有一次机会」来准备。如果你已经自己试过好几次，请在下单时如实告诉客服——剩余空间会直接影响这单值不值得做，瞒着下单最后浪费的是你自己的时间。',
  },
  {
    q: '不做 KYC 行不行？换个新号是不是更快？',
    a: '如果这个账号上有你在用的会员、有重要的历史对话，换号的代价要你自己算。如果只是一个空号，重新注册确实是一条路，但注册 Claude 本身也有几个固定的坑（号码类型、验证码、网络环境），本站的 Claude 注册页把这几步按顺序讲清楚了，可以先去看一眼再决定走哪条路。',
  },
  {
    q: '你们的 Claude KYC 认证代办是卖账号吗？要不要我的密码？',
    a: '不是卖账号，我们不会给你一个新号，做的是你现有账号上的这一道验证。这项服务的交付方式是人工协助，下单后由客服跟你对接，需要你提供什么、哪些环节必须你本人实时配合，客服会按你账号当下的界面提示告诉你。需要提醒的是这一项和站上其他商品不同：它不发卡密，付款后不会有兑换码，要主动联系客服。',
  },
  {
    q: '「付款后半小时内完成」是怎么算的？认证失败真的不收费吗？',
    a: '商品页写明的口径就是「付款后半小时内完成，认证失败不收费」。需要提醒的是这套流程要真人参与，你本人得能同步配合，所以下单后请及时联系客服对接。失败不收费的退款走客服，具体以服务条款为准。',
  },
  {
    q: 'Claude 代充、KYC 代办这类服务靠谱吗，我怎么判断你们不是骗子？',
    a: '这个行业里无照个人卖家占多数，怀疑是合理的。可核验的标准就几条：卖家有没有真实经营主体、能不能开票、退款规则是不是公开写死的、以及有没有在承诺它根本控制不了的结果。本站由益阳市赫山区必高科技有限公司运营，价格与累计成交数公开在页面上，可开增值税发票（标价不含税，开票需另付 6% 税费），并且明确写着不保证通过、失败不收费。反过来说，任何跟你讲「内部通道」「百分百秒过」的卖家，可以直接排除。',
  },
]

export default async function ClaudeKycLandingPage() {
  const all = await getLandingProducts()
  const items = matchProducts(all, DEF.match)

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
          // 这一页列的是可选服务、不是单个商品，所以用 ItemList 而不是 Product。
          // Product/Offer 标记留在 /products/[id]——那才是「买家能在上面完成购买」的页面，
          // 也是 Google 对 merchant listing 资格的明确要求。HowTo 一律不出（2023 年已下架）。
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
              用得好好的 Claude，某一次打开之后突然被拦下，要求你完成身份验证——这一页处理的就是这个场景。
              第一反应通常是「账号是不是要没了」，但真正要紧的是先弄清两件事：
              <strong className="text-white/80">你遇到的到底是不是 KYC，以及在弄清楚之前不要乱点</strong>
              。这道流程能重试的次数不是无限的，做错一次，机会就少一次。
            </p>
            <p>
              下面讲清楚 Claude KYC 身份认证是什么、它和「Claude 认证工程师」那类考证完全没有关系、
              被弹出来之后哪些动作会让情况更糟、以及本站的活人认证代办实际做什么。
              同时也会明说我们不知道的部分：KYC 的判定规则不是公开信息，
              <strong className="text-white/80">谁跟你保证「百分百能过」，谁就在编</strong>。
            </p>
          </>
        }
      >
        <Section id="price" heading="价格与档位">
          <PriceTable
            items={items}
            note={
              <>
                <strong className="text-white/60">这一项和站上其他商品不一样：交付方式是人工服务，不是卡密。</strong>{' '}
                付款后不会给你一串兑换码，需要你主动联系客服对接，具体见下面「从下单到完成」。
                价格随上游成本浮动，以下单时页面显示的实付金额为准；「累计成交」是本站真实订单数，不是装饰数字。
                如果你要的其实是 Claude 会员本身而不是这道验证，走{' '}
                <Link href={landingPath('claude-pro')} className="text-purple-400 hover:text-purple-300">
                  Claude Pro 充值
                </Link>
                ，那边是充值卡（卡密）自助兑换，和这一项是两回事。
              </>
            }
          />
        </Section>

        <Section id="what-is-kyc" heading="Claude KYC 认证是什么">
          <SubSection heading="一句话：它是身份验证，不是账号等级，也不是考试">
            <p>
              KYC 是 know your customer 的缩写，金融和互联网服务里通用的说法，意思是服务方要求你证明
              「屏幕前的这个人是真实存在、可以被识别的」。落到 Claude 上，它表现为账号被要求完成一次
              身份验证（界面上多半写作 verification 或身份验证），在完成之前，账号的部分或全部功能被挡住。
            </p>
            <p>
              它和你开的是 Pro 还是 Max 没关系，和你充过多少钱也没关系。它不会因为你多买一个月会员就消失，
              也不是可以用钱绕过去的东西——这一点先想明白，能省掉很多无效动作。
            </p>
          </SubSection>

          <SubSection heading="和「Claude 认证工程师 / 认证课程」完全是两码事">
            <p>
              如果你只搜「Claude 认证」，搜出来的大概率是各种「认证工程师」「认证架构师」「AI 认证课程」，
              那是培训考证的赛道，和你账号上弹出来的这个东西没有半点关系。
              要找到对的内容，搜索词里必须带上 KYC 三个字母（比如
              <span className="text-white/60">claude kyc 身份验证</span>
              ），否则搜到的全是考证内容。
            </p>
          </SubSection>

          <SubSection heading="先确认你遇到的到底是不是 KYC">
            <p>
              「账号用不了」有好几种，处理方式完全不同，认错了就是白忙。对照你屏幕上实际显示的提示：
            </p>
            <ul className="space-y-2.5 list-disc pl-5 marker:text-white/25">
              <li>
                要求你完成身份验证、提交材料或按提示实时核验 —— 这一页说的 KYC，往下看。
              </li>
              <li>
                提示账号已停用、违反使用政策一类的说法 —— 那是封禁，不是 KYC。这种情况代办救不回来，
                能做的只有走官方给出的申诉入口，其他任何声称能解封的渠道都不要信。
              </li>
              <li>
                登录不进去、收不到验证码、注册就被拦 —— 那是注册与登录环节的问题，去看{' '}
                <Link href={landingPath('claude-zhuce')} className="text-purple-400 hover:text-purple-300">
                  Claude 注册
                </Link>
                ，那一页按顺序讲了号码、IP、验证码这三个固定的坑。
              </li>
              <li>
                付款失败、会员充不上、订阅没生效 —— 那是支付链路的问题，去看{' '}
                <Link href={landingPath('claude-pro')} className="text-purple-400 hover:text-purple-300">
                  Claude Pro 充值
                </Link>
                。
              </li>
            </ul>
            <p>
              判断依据只能是你自己屏幕上的原文，不要拿别人发的截图对号入座——不同账号看到的措辞并不一样。
              拿不准的话，把提示原文发给客服先问一句，再决定要不要下单，这一步是免费的。
            </p>
          </SubSection>
        </Section>

        <Section id="why-me" heading="为什么偏偏是我：关于触发条件，能说的和不能说的">
          <p>
            先把话说死：<strong className="text-white/80">Anthropic 没有公开过 KYC 的触发条件和判定标准</strong>。
            任何一份「满足这几条就会被弹、改掉这几条就不会被弹」的清单，都是猜的。
            论坛和群里流传的说法——换过 IP、用了某个第三方客户端、调用量太大、账号太新、号给别人用过——
            彼此之间互相矛盾，而且没有一条能被验证。把这些当成因果去改，只是在给自己增加变量。
          </p>
          <p>
            能确定的只有一件事：它是一道验证，不是一份判决。被要求做 KYC 不等于账号已经出了问题，
            更不等于已经被封——真正被封的提示长得完全不一样，上一节已经列过怎么区分。
          </p>
          <p>
            所以别在归因上耗时间。你现在唯一能控制的变量只有一个：这一次验证怎么做，才不会把机会白白用掉。
            顺带提醒一句，如果有人一口咬定「你是因为某某原因被风控的，我这边有内部渠道能解」，
            可以直接判定为不可信——触发规则本身就不是公开信息，没有谁有所谓的「内部」。
          </p>
        </Section>

        <Section id="dont-do" heading="被弹 KYC 之后，先别急着做这几件事">
          <p>
            这一节比「怎么过」更重要。大部分求助最后变成无解，不是因为验证本身太难，
            而是因为在搞清楚状况之前已经先做错了几步。
          </p>
          <ul className="space-y-3 list-disc pl-5 marker:text-white/25">
            <li>
              <strong className="text-white/80">不要反复提交。</strong>
              能重试的次数不是无限的，具体上限没有公开说法，所以按「只有一次机会」来准备最稳妥。
              同一份不符合要求的材料，提交十次也不会因为次数多就通过，只会把剩余机会消耗掉。
            </li>
            <li>
              <strong className="text-white/80">不要拿不是本人的信息去凑。</strong>
              这道流程的全部目的就是核对「屏幕前的人」和「材料上的人」是不是同一个。
              用别人的信息去试，最可能的结果是这一次机会当场作废。
            </li>
            <li>
              <strong className="text-white/80">不要先去充会员。</strong>
              账号还被挡在验证后面的时候花钱开会员，风险是钱花了、账号照样用不了。
              先把验证解决掉再谈充值——这句话对我们自己的生意不利，但它是对的。
            </li>
            <li>
              <strong className="text-white/80">不要为了这一步特地换网络环境碰运气。</strong>
              切到一个你从来没用过的环境，只会给这次验证多加一个不确定因素。
              在你平时登录这个账号的环境里做，是更少变量的选择。
            </li>
            <li>
              <strong className="text-white/80">不要信「秒过」「包过」「内部通道」。</strong>
              判定权不在卖家手里，承诺得越满，收了钱之后越有可能让你自己承担失败的后果。
              一个肯明说「不保证通过、失败不收费」的报价，比一个拍胸脯的报价可靠。
            </li>
          </ul>
        </Section>

        <Section id="prepare" heading="需要准备什么：以界面提示为准，其余的别自己加戏">
          <p>
            唯一可靠的材料清单在你自己的屏幕上。界面要求什么就准备什么，
            不同账号、不同时间点看到的要求并不一致，所以这一页不会给你一份「证件清单」——
            <strong className="text-white/80">给了就是编的</strong>。这一点上，宁可少写，也不骗你。
          </p>
          <p>
            「活人认证」这四个字的意思是：这套流程需要一个真实的人按提示实时配合走完，
            不是填个表、传张图就结束的事，也不是脚本能刷过去的东西。
            所以准备工作里最要紧的一项其实很朴素——
            <strong className="text-white/80">留出一段能安静配合、不会被打断的时间</strong>，一次做完。
            中途被电话打断、网络断掉、人临时走开，都可能让这一次只能重来——而重来的余地有多少，没有人能替你保证。
          </p>
          <p>
            至于中国护照能不能用、香港身份有没有帮助，这两个是搜索里出现最多的具体问题，
            但没有公开规则支持任何一个确定答案。你手上有什么，下单前先发给客服，
            让客服看过之后再判断这单要不要做——这比找一个陌生人的成功案例去赌要理性得多。
          </p>
          <Warning>
            如果你已经自己试过很多次、界面上已经不给你继续提交的机会，
            <strong>请在下单前如实告诉客服</strong>。剩余空间会直接决定这单还值不值得做。
            瞒着下单，最后浪费的是你自己的时间；而我们也不希望接一单明知做不成的活。
          </Warning>
        </Section>

        <Section id="service" heading="这项代办到底做什么、不做什么">
          <p>
            先说做什么。这一项在站上的交付方式是人工，不是卡密，所以它的边界要写得比别的商品更清楚：
          </p>
          <CheckList
            items={[
              <>
                <strong className="text-white/80">人工协助完成 KYC 认证流程</strong>
                ：下单后由客服跟你对接，按你账号当下的实际界面提示，协助把这套需要真人参与的验证走完。
              </>,
              <>
                <strong className="text-white/80">商品页写的是付款后半小时内完成、认证失败不收费</strong>
                ：这套流程要真人参与，你本人得能同步配合，下单后请及时联系客服对接。
              </>,
              <>
                <strong className="text-white/80">认证失败不收费</strong>
                ：这是这项服务里最实在的一条。结果不好就退，不用你先赌一笔钱进去。
              </>,
              <>
                <strong className="text-white/80">可开票</strong>
                ：订单完成后在站内申请，支持增值税发票或收据。页面标价不含税，开发票需另付 6% 税费，收据不涉及税费。抬头由你自己填（公司名或个人都行），
                票据上盖的是益阳市赫山区必高科技有限公司的章。
              </>,
            ]}
          />
          <p className="pt-2">再说不做什么。这几条如果有一条你不能接受，就不要下单：</p>
          <ul className="space-y-3 list-disc pl-5 marker:text-white/25">
            <li>
              <strong className="text-white/80">不是卖账号。</strong>
              我们不会给你一个新号，做的是你现有账号上的这道验证。想要新号是另一回事，去看注册那一页。
            </li>
            <li>
              <strong className="text-white/80">不承诺一定通过。</strong>
              判定权在对方手里，任何「保证通过」的说法都不成立。正因为不能保证，才用「失败不收费」来分担风险。
            </li>
            <li>
              <strong className="text-white/80">已经被封禁的账号做不了。</strong>
              如果你收到的是停用或违反政策的提示，那不是 KYC，这项服务帮不上忙，付了钱也只能退回来。
            </li>
            <li>
              <strong className="text-white/80">不碰你的密码去做别的事。</strong>
              对接过程中需要你提供什么，客服会当场说明用途，范围仅限完成这一次验证。
            </li>
          </ul>
        </Section>

        <Section id="steps" heading="从下单到完成">
          <Steps
            steps={[
              {
                title: '先确认是 KYC，不是封禁',
                body: (
                  <>
                    对照上面「先确认你遇到的到底是不是 KYC」那一节。拿不准就把屏幕上的提示原文发给客服，
                    先问再下单——问清楚不收钱，买错了才麻烦。
                  </>
                ),
              },
              {
                title: '下单并付款',
                body: (
                  <>
                    在上面的价格表里点进商品，用支付宝付款。这一项是人工服务，
                    <strong>付款后不会发卡密</strong>，订单会停在处理中等客服跟你对接。
                  </>
                ),
              },
              {
                title: '联系客服对接（这一步不能省）',
                body: (
                  <>
                    这一项是人工交付，<strong>付款后不会给你卡密，订单页也不会出现兑换码</strong>。
                    请主动加客服微信 <span className="font-mono text-white/60">GenuineMarxist</span>，
                    或到{' '}
                    <Link href="/support" className="text-purple-400 hover:text-purple-300">
                      客服中心
                    </Link>{' '}
                    留言，把订单号和屏幕上的提示原文一起发过去。订单号可以在{' '}
                    <Link href="/orders" className="text-purple-400 hover:text-purple-300">
                      我的订单
                    </Link>{' '}
                    里看到。
                  </>
                ),
              },
              {
                title: '按指引一次做完',
                body: (
                  <>
                    需要你本人实时配合的环节，客服会提前说明。开始之前请留出一段不会被打断的时间，
                    中途断开重来，消耗的是你为数不多的机会。
                  </>
                ),
              },
              {
                title: '结果与收尾',
                body: (
                  <>
                    通过就继续用；没通过按「认证失败不收费」处理，联系客服走退款，具体口径以{' '}
                    <Link href="/terms" className="text-purple-400 hover:text-purple-300">
                      服务条款
                    </Link>{' '}
                    为准。账号后续能不能正常使用由服务提供方决定，这一点我们无法代为承诺。
                  </>
                ),
              },
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
