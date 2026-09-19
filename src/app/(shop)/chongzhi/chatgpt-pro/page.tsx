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
 * ChatGPT Pro 5x 充值落地页——客单价最高、也最容易买错的一页。
 *
 * 【选词依据】2026-09-19 Google 中文下拉建议实测：
 *   · `chatgpt pro 价格`、`chatgpt pro 5x`、`chatgpt pro和plus的区别`、`chatgpt pro充值`、
 *     `chatgpt pro 哪个 国家 最 便宜` 都有真实联想 —— Pro 这个词自己撑得起一页，
 *     不需要靠 Plus 页去分流量。「和 plus 的区别」是其中商业意图最强的一条：
 *     搜它的人已经在用 Plus、正在犹豫要不要加钱，离下单只差一次比较。
 *   · 「会员」这个词对 ChatGPT **不成立**（chatgpt会员 返回的是亚美尼亚语联想，
 *     Google 没把它和中文商业意图关联），所以这一页通篇不用「会员」当主词，
 *     只用「充值 / 订阅 / 价格 / 区别」。「会员」留给 Claude 那几页。
 *   · 「代开」「代购」「代订阅」「ai会员代充」「ai代充」联想数全部为 0 —— 一个都不写。
 *   · 「代充」只有 3 条联想且全是信任审查（靠谱吗 / 知乎 / v2ex），
 *     所以它不当主词，只放进正文最后一节和 FAQ，去接那批在查「你是不是骗子」的人。
 *   · 「兑换码 / 充值卡 / 礼品卡」有真实联想，而本站交付的就是卡密——自然写进正文。
 *
 * 【为什么不是 doorway page】这一页和 /chongzhi/chatgpt-plus 不是同一批词的两个变体：
 * 它承载的是 Pro 独有的一组决策问题——两个档位能不能盖掉现有 Plus、【强制充值】
 * 会让你损失什么、5 倍价差值不值得。这些内容在 Plus 页上一句都没有，
 * 也不可能靠换个关键词复制出来。页面进入 /chongzhi 这个可浏览层级，
 * 在 hub 页、footer 和兄弟页的相关链接里都有入口，不是只挂在 sitemap 里的孤儿页。
 *
 * 【正文里的事实来源】价格、库存、累计成交实时取库，一个数字都不写死；
 * 「不可覆盖plus / 可覆盖plus」「强制充值会作废原有套餐并扣除已用额度」
 * 「无需自备 APPLE 账号」「掉订阅按剩余天数折算退款、封号不质保」「接码验证属官方风控、
 * 可联系客服付费解决」全部取自后台商品 29 与商品 7 的 cardUsage 与质保文案，不是编的。
 * 除此之外的操作细节一律以兑换页提示与客服口径为准，本页不替上游作任何承诺。
 * 改这两个商品的文案时要回来核对这一页。
 */

const DEF = findLanding('chatgpt-pro')

export async function generateMetadata(): Promise<Metadata> {
  const all = await getLandingProducts()
  const items = matchProducts(all, DEF.match)
  const low = lowestPrice(items)
  // description 里那个「￥720 起」换成实时最低价：SERP 上有个真实数字是免费的点击率优势，
  // 但它必须跟页面上那张表对得上，所以取库不写死。
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

// 【这一份 FAQS 同时喂给页面和 JSON-LD】标记页面上看不到的内容是结构化数据政策
// 明令禁止的，所以这里只有一个数据源，不存在「只给爬虫看的那一份」。
const FAQS: { q: string; a: string }[] = [
  {
    q: 'ChatGPT Pro 5x 一个月多少钱？',
    a: 'OpenAI 那边这一档的原价是每月 100 美元，是 Plus（每月 20 美元）的五倍。本站的人民币价格以本页价格表上显示的实付金额为准，两个档位不同价，价格还会随上游成本浮动，所以这里不写死数字，看表就行。',
  },
  {
    q: 'ChatGPT Pro 和 Plus 到底差在哪，值得升吗？',
    a: '主要差别是用量规格——档位名里的「5x」说的就是这件事。价差是五倍，所以判断标准很简单：你现在是不是经常把 Plus 的额度用到被限流、并且被打断的是正经工作。如果是，Pro 省下的是等待时间；如果你一周只用几十次，升上去大部分额度会浪费掉。至于两档在功能上还有没有别的差异、每个模型各能用多少，都由 OpenAI 自己定义且会随版本变动，以你账号内当时的说明为准。',
  },
  {
    q: '我账号上已经有 Plus，能直接充 Pro 吗？',
    a: '这正是两个档位的分水岭。商品名里写着「可覆盖plus」的那一档是为这种情况准备的；写着「不可覆盖plus」的那一档，前提是账号上没有需要被顶掉的订阅。买错了卡密会被核销，而核销之后不退。拿不准就先问客服，别自己试。',
  },
  {
    q: '兑换页上的「强制充值」是干什么的，代价是什么？',
    a: '它用于覆盖账号上已有的 pro5x 或 plus 套餐。代价有两层：一是原有套餐直接作废，二是升级之后官方会自动扣除原有套餐已经用掉的那部分额度，也就是你不是从满额开始算。扣多少由官方那边计算，我们看不到明细。主动按下这个按钮造成的损失不属于「掉订阅」，不在质保范围内。',
  },
  {
    q: '信用卡充值档和 iOS 订阅充值档，我该选哪个？',
    a: '先看能不能覆盖：账号上已有 Plus 要顶掉，选 iOS 订阅档（商品名里标着可覆盖）；账号干净、只想要更低的价格，选信用卡档（标着不可覆盖）。其次看库存，两档库存不一样，售罄时价格表里会显示补货中。iOS 订阅档不需要你自己准备 Apple 账号。',
  },
  {
    q: '兑换的时候提示要手机号验证码怎么办？',
    a: '这种情况是账号本身被官方风控了，和你充的这一笔订阅没有关系。需要接码验证可以联系客服付费解决——注意这是一项额外收费的服务，不包含在充值里。',
  },
  {
    q: '充值需要把 ChatGPT 账号密码交给你们吗？',
    a: '本站交付的是卡密，兑换动作由你自己在兑换页发起。兑换过程中需要按充值页面的提示获取并填写账号信息，具体要填哪些以兑换页当时的提示为准。有拿不准的地方先问客服，不要照着任何第三方教程截图乱填。',
  },
  {
    q: '付款之后多久能用上？',
    a: '卡池正常时付款确认后即时发放（极少数缺货情况下会转人工补发，订单页会标注），可以在订单页看到，也会发到你的账号邮箱。之后的兑换是你自己发起的，处理时长以兑换页当时的提示为准，本页不给一个会过期的数字。提交之后耐心等页面给结果，别反复提交——重复提交不会更快，只会让出问题时更难排查。',
  },
  {
    q: '充上去之后掉订阅了、或者账号被封了怎么算？',
    a: '订阅期间掉订阅，扣掉已经用掉的天数，按剩余未使用天数折算退款。账号被官方封禁不质保——封号通常是账号本身或使用方式的问题，和这一笔充值无关，这一条 Pro 档金额大，尤其要先想清楚能不能接受。规则写在服务条款里，不接受就别下单。',
  },
  {
    q: 'ChatGPT Pro 代充靠不靠谱，会不会收了钱不办事？',
    a: 'Pro 档单价高，这个疑虑是合理的。可以核验的部分：本站由益阳市赫山区必高科技有限公司运营，能开具增值税发票（标价不含税，开票需另付 6% 税费）；价格、库存、累计成交数都公开在页面上；交付的是卡密，充值动作在你自己手里；退款规则（掉订阅按天退、已核销不退、封号不质保）写在明处。真不放心，可以先在便宜得多的 Plus 档跑通一次流程，再回来买 Pro。',
  },
]

export default async function ChatgptProLandingPage() {
  const all = await getLandingProducts()
  const items = matchProducts(all, DEF.match)
  // 【先判「不可覆盖」再判「可覆盖」】'可覆盖plus' 是 '不可覆盖plus' 的子串，
  // 顺序反了两个档位会指向同一个商品。
  const nonOverride = items.find((p) => p.name.includes('不可覆盖'))
  const canOverride = items.find((p) => p.name.includes('可覆盖') && !p.name.includes('不可覆盖'))
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
              ChatGPT Pro 5x 在 OpenAI 那边的原价是每月 100 美元，是 Plus 的五倍。
              这个价位上买错一次的代价不小，而这一页要讲的第一件事就是最容易买错的那个点：
              <strong className="text-white/80">两个档位的商品名后面各跟着一句「可覆盖plus」或「不可覆盖plus」</strong>
              ——它决定了你账号上已有的 Plus 订阅会被顶掉还是会挡住这次充值。
            </p>
            <p>
              下面按顺序讲清楚：现在多少钱、两个档位差在哪、【强制充值】按下去会损失什么、
              Pro 和 Plus 的五倍价差值不值、下单到充值完成要做哪几步、哪些情况不质保
              {low ? `。当前最低 ￥${low.toFixed(0)}。` : '。'}
              交付方式是卡密（也就是常说的兑换码、充值卡），付款用支付宝，不需要你有境外银行卡。
            </p>
          </>
        }
      >
        <Section id="price" heading="价格与档位">
          <PriceTable
            items={items}
            note={
              <>
                价格随上游成本与汇率浮动，以下单时页面显示的实付金额为准。「库存」和「累计成交」都是实时的：
                累计成交是本站真实订单数，不是摆着看的装饰数字，两个档位分别成交了多少，表里可以直接对比。
                两档的库存并不同步，售罄时会显示补货中。
              </>
            }
          />

          <Warning>
            <strong>先看商品名后面那半句括号，再看价格。</strong>
            标着「不可覆盖plus」的那一档，前提是你的账号上没有需要被顶掉的订阅；
            标着「可覆盖plus」的那一档才是为「已经在用 Plus、现在想上 Pro」准备的。
            选错档提交，卡密会被核销掉，而<strong>已核销的卡密不退</strong>——
            这是本页金额最大、也最不可逆的一个坑。三十秒确认一下账号当前的订阅状态，能省掉它。
          </Warning>
        </Section>

        <Section id="override" heading="「可覆盖 plus」和「不可覆盖 plus」差在哪">
          <p>
            这两个档位最终充上去的都是 ChatGPT Pro 5x，规格一样。差别在于钱是走哪条链路进到 OpenAI 那边的，
            而这条链路决定了它对你账号当前状态的要求。用一句话概括：
            信用卡充值那一档要求账号是「干净」的，iOS 订阅充值那一档可以顶掉你现有的 Plus。
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
                  <td className="px-4 py-3 text-white/50">商品名里的括号</td>
                  <td className="px-4 py-3">不可覆盖 plus</td>
                  <td className="px-4 py-3">可覆盖 plus</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">走的通道</td>
                  <td className="px-4 py-3">上游用信用卡为你的账号订阅</td>
                  <td className="px-4 py-3">通过苹果 App Store 的订阅体系</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">账号上已有 Plus</td>
                  <td className="px-4 py-3">不适用，先处理掉现有订阅</td>
                  <td className="px-4 py-3">这一档就是为这种情况准备的</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">要不要自备 Apple 账号</td>
                  <td className="px-4 py-3">不涉及</td>
                  <td className="px-4 py-3">不需要自备</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">价格</td>
                  <td className="px-4 py-3">更低</td>
                  <td className="px-4 py-3">略高</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">适合谁</td>
                  <td className="px-4 py-3">账号上没有有效订阅、要最低价</td>
                  <td className="px-4 py-3">正在用 Plus 想升上去、或更在意风控</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">在哪下单</td>
                  <td className="px-4 py-3">
                    {nonOverride ? (
                      <Link
                        href={`/products/${nonOverride.id}`}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        {nonOverride.name}
                      </Link>
                    ) : (
                      '见上方价格表'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {canOverride ? (
                      <Link
                        href={`/products/${canOverride.id}`}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        {canOverride.name}
                      </Link>
                    ) : (
                      '见上方价格表'
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <SubSection heading="账号上没有任何订阅，选哪个">
            <p>
              选信用卡充值那一档，它更便宜，而且「不可覆盖」这个限制对你不构成限制——
              本来就没有东西需要被覆盖。这是最省钱也最省事的一种情况。
            </p>
          </SubSection>

          <SubSection heading="账号上有正在生效的 Plus，选哪个">
            <p>
              选 iOS 订阅充值那一档。但在按下之前请先算一笔账：你现有的 Plus 还剩多少天、
              这一期的额度用掉了多少。原因见下一节——覆盖不是免费的，你会同时损失剩余时间和已用额度这两样东西。
              如果 Plus 只剩三五天，等它自然到期再充是更划算的做法。
            </p>
          </SubSection>

          <SubSection heading="账号上已经有 Pro 5x，想续">
            <p>
              这属于覆盖已有 pro5x 的情况，和覆盖 Plus 走的是同一个入口，同样有作废与扣额度的代价。
              续费的时机很重要，最好在当期快到期时再操作。具体这一单该怎么走，下单前先问客服，
              别自己在兑换页上试——试错的成本是一整张卡密。
            </p>
          </SubSection>
        </Section>

        <Section id="force" heading="【强制充值】按下去会损失什么">
          <p>
            兑换页上有一个叫「强制充值」的入口，它的作用是覆盖账号上已有的 pro5x 或 plus 套餐。
            很多人把它当成「不管什么情况都能一键搞定」的万能按钮，这是这一页第二个要提醒的地方——
            它能用，但不是免费的。代价有两层，两层都不可逆：
          </p>

          <CheckList
            items={[
              <>
                <strong className="text-white/80">原有套餐直接作废</strong>
                ：不是暂停、不是排队接在后面，是当场失效。剩下的天数不会折价补给你，
                这部分损失也不属于「掉订阅」，所以不在本站的质保范围内——
                质保覆盖的是订阅期间非你主动造成的掉订阅，不是你自己按下的覆盖。
              </>,
              <>
                <strong className="text-white/80">官方会自动扣除原有套餐已使用的额度</strong>
                ：升级之后你不是从满额开始算，原套餐这一期消耗掉的那部分会被计入。
                所以如果你当期 Plus 的额度已经用得七七八八，紧接着强制升 Pro，
                到手的可用量会明显低于预期。具体扣多少由官方那边计算，我们这边看不到明细。
              </>,
            ]}
          />

          <p>
            把这两条合起来看，结论很直白：<strong className="text-white/80">越接近原套餐到期、额度用得越少的时候覆盖，损失越小</strong>。
            最差的时点是原套餐刚续上、额度又已经用掉一大半——那等于同时扔掉时间和额度两样东西。
            真的赶时间必须马上升，那也是一笔明知道要交学费的账，心里先有数比事后来问要好。
          </p>

          <Warning>
            兑换页上具体哪个按钮对应哪种行为、你手上这张卡密能不能用它盖掉现有订阅，
            <strong>一律以兑换页当时的提示为准</strong>。拿不准就先联系客服，不要抱着「试一下看看」的心态提交——
            卡密一旦被上游核销，无论结果如何都不能退，这一条对 Pro 档尤其贵。
          </Warning>
        </Section>

        <Section id="pro-vs-plus" heading="Pro 5x 和 Plus 的差别：五倍价差买的是什么">
          <p>
            官方原价摆在那里：Plus 每月 20 美元，Pro 5x 每月 100 美元，整整五倍。
            这个差价主要买的是<strong className="text-white/80">用量规格</strong>——
            档位名里的「5x」说的就是这件事。至于两档在功能上还有没有别的差异、
            每个模型具体每天或每周能用多少次、哪些新功能先给哪一档，
            都由 OpenAI 自己定义并且会随版本变动，本页不抄一份随时会过期的数字，
            以你账号内当时的说明为准。
          </p>

          <SubSection heading="什么样的人升 Pro 是划算的">
            <p>
              判断标准只有一个，而且很好验证：你现在是不是经常把 Plus 的额度撞满、
              然后被限流打断正在做的事。如果每周都要为此停下来等，那 Pro 买回来的是不被打断的工作时间，
              五倍价差是划得来的。典型的是整天挂着做长文档、连续跑代码、批量处理资料的人。
            </p>
          </SubSection>

          <SubSection heading="什么样的人不该升">
            <p>
              一周只用几十次、主要拿来写点邮件和查资料的，升上去大部分额度会白白浪费。
              还有一种常见的误判：把「贵的档位回答质量更好」当成升级理由。
              这个差价买的主要是用量，如果你的痛点是回答不满意而不是用不够，
              先确认换档位能不能解决——多半不能。
              这种情况留在{' '}
              <Link href={landingPath('chatgpt-plus')} className="text-purple-400 hover:text-purple-300">
                ChatGPT Plus 充值
              </Link>{' '}
              那一档就够了，省下的钱是实打实的。
            </p>
          </SubSection>
        </Section>

        <Section id="before-you-buy" heading="下单前要确认的四件事">
          <p>
            Pro 档的售后纠纷几乎都能追溯到下面这四条里的某一条没确认。花几分钟核对，
            比出了问题再来找客服省事得多——很多情况一旦卡密被核销，谁也帮不了你。
          </p>
          <CheckList
            items={[
              <>
                <strong className="text-white/80">账号当前的订阅状态</strong>
                ：有没有生效中的 Plus 或 Pro，还剩多少天。这一条决定你该买哪个档位。
              </>,
              <>
                <strong className="text-white/80">你买的那一档能不能覆盖</strong>
                ：商品名括号里那半句就是答案。不确定就照上面那张对比表再看一遍，或者直接问客服。
              </>,
              <>
                <strong className="text-white/80">账号本身有没有在风控里</strong>
                ：如果你登录时经常被要求手机号验证，那是账号被官方风控了，与订阅无关。
                这种情况需要接码验证，可以联系客服付费解决，但要知道那是一项额外收费的服务。
              </>,
              <>
                <strong className="text-white/80">能不能接受「封号不质保」</strong>
                ：这是本站的明确口径，Pro 档金额大，更要先想清楚。不接受就不要下单，
                这话说在前面对双方都好。
              </>,
            ]}
          />
        </Section>

        <Section id="steps" heading="从下单到充值完成">
          <Steps
            steps={[
              {
                title: '按「能不能覆盖」选档位，然后下单',
                body: (
                  <>
                    在上面的价格表里点进对应商品，用支付宝付款。先看括号再看价格，别只比数字。
                    卡密会发到你登录本站所用的账号邮箱，要保证这个邮箱能正常收信。
                  </>
                ),
              },
              {
                title: '拿到并复制卡密',
                body: (
                  <>
                    卡池正常时付款确认后即时发放（极少数缺货情况下会转人工补发，订单页会标注），可以在{' '}
                    <Link href="/orders" className="text-purple-400 hover:text-purple-300">
                      我的订单
                    </Link>{' '}
                    里看到，同时会发到你的账号邮箱。内容会一直留在订单里，找不到了随时回去看。
                  </>
                ),
              },
              {
                title: '在兑换页输入卡密并兑换',
                body: (
                  <>
                    在{' '}
                    <Link href="/orders" className="text-purple-400 hover:text-purple-300">
                      我的订单
                    </Link>{' '}
                    里复制卡密，点这一单上的「去充值 / 兑换」跳到兑换页，把卡密粘进去点兑换。
                    如果你要覆盖账号上已有的 pro5x 或 plus，对应的入口是【强制充值】——
                    按之前请先读完上面那一节，代价是不可逆的。
                  </>
                ),
              },
              {
                title: '按提示获取账号信息并填入充值网站',
                body: (
                  <>
                    兑换之后，按充值页面的提示获取账号信息，并把要求的信息全部填进充值网站。
                    具体要填哪几项以兑换页当时的提示为准，本页不给一份会过期的清单。
                    有一项拿不准就先问客服，不要照着任何第三方教程的截图乱填。
                  </>
                ),
              },
              {
                title: '点击充值完成，等结果',
                body: (
                  <>
                    提交后耐心等页面给结果，不要反复提交——重复提交不会更快，
                    只会在出问题时让排查变复杂。有异常直接把订单号发给客服。
                  </>
                ),
              },
            ]}
          />
        </Section>

        <Section id="warranty" heading="质保与退款：把难听的话说在前面">
          <p>
            这一节没有一句好话，但你下单前应该看到。规则不好看不要紧，含糊才要命。
          </p>
          <CheckList
            items={[
              <>
                <strong className="text-white/80">订阅期间掉订阅</strong>
                ：扣掉已经用掉的天数，按剩余未使用天数折算退款。
              </>,
              <>
                <strong className="text-white/80">账号被官方封禁：不质保</strong>
                ：封号通常是账号本身或使用方式的问题，与这一笔充值无关。Pro 档单价高，
                这条的分量也就更重，不能接受就不要下单。
              </>,
              <>
                <strong className="text-white/80">已核销的卡密不退</strong>
                ：只要充值动作已经发生，无论结果如何都不退。所以兑换前的核对不是走过场。
              </>,
              <>
                <strong className="text-white/80">没用过的卡密可以退</strong>
                ：未使用的卡密不设过期时间，买了暂时不用也不会作废。
              </>,
              <>
                <strong className="text-white/80">接码验证是额外收费项</strong>
                ：账号被官方风控要求手机号验证时可联系客服付费解决，这部分不包含在充值价格里。
              </>,
            ]}
          />
          <p className="pt-2">
            完整口径以{' '}
            <Link href="/terms" className="text-purple-400 hover:text-purple-300">
              服务条款
            </Link>{' '}
            为准。有任何一条你觉得接受不了，下单前告诉客服，别等充完再说。
          </p>
        </Section>

        <Section id="trust" heading="「ChatGPT Pro 代充靠谱吗」：可以核验的部分">
          <p>
            搜这个词的人一半是在问「会不会被骗」，Pro 档几百块一单，这个疑虑完全合理。
            这个行业里无照个人卖家占多数，收了钱跑路的、把你账号密码要走的都有。
            下面这几条不是承诺，是你现在就能自己核验的东西：
          </p>
          <CheckList
            items={[
              <>
                <strong className="text-white/80">有可核验的经营主体</strong>
                ：本站由益阳市赫山区必高科技有限公司运营，能开具增值税发票
                （标价不含税，开票需另付 6% 税费），发票和收据上盖的是这家公司的章。
              </>,
              <>
                <strong className="text-white/80">交付的是卡密，充值动作在你手里</strong>
                ：卡密发给你，兑换由你自己发起，不是让你把账号交出去等消息。
              </>,
              <>
                <strong className="text-white/80">价格、库存、累计成交都公开在页面上</strong>
                ：上面那张表里的成交数是真实订单数，实时取的，不是摆着看的装饰。
              </>,
              <>
                <strong className="text-white/80">退款规则写在明处</strong>
                ：掉订阅按天退、未使用的卡密可退、已核销不退、封号不质保。规则不好看但不含糊。
              </>,
              <>
                <strong className="text-white/80">先小后大</strong>
                ：不放心就先在便宜得多的{' '}
                <Link href={landingPath('chatgpt-plus')} className="text-purple-400 hover:text-purple-300">
                  ChatGPT Plus
                </Link>{' '}
                档跑通一次流程，再回来买 Pro。
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
