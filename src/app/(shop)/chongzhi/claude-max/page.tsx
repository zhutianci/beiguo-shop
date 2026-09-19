// 【必须 force-dynamic】价格表要连库，而 builder 容器没有 DATABASE_URL，
// 被当成静态路由预渲染会让整个构建失败（/news、/links、sitemap 同理）。
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { getLandingProducts, inStock, lowestPrice, matchProducts, withLivePrice } from '@/lib/landing/products'
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
 * Claude Max 5x 充值落地页——这一批页面里客单价最高、但搜索量最窄的一页。
 *
 * 【选词依据】2026-09-19 Google 中文下拉建议实测：
 *   · `claude max` 这一族联想是完整的：`claude max 购买` / `claude max 账号 购买` /
 *     `claude max价格` / `claude max 5x` / `claude max 20x` / `claude max 订阅` /
 *     `claude max 额度` 都有返回。**全是型号词与规格词，没有一条是「claude 是什么」**——
 *     说明搜 Max 的人已经做完功课了，他在比档位、比额度、比价格，不是在了解产品。
 *     所以这一页不写任何科普段落，开篇直接给规格对照。
 *   · 「会员」这个词对 Claude 成立（`claude 会员` 返回 10 条满额联想：价格 / 购买 /
 *     共享 / 额度 / 账号 / 等级 / 优惠 / 订阅 / 档位），对 ChatGPT 不成立
 *     （`chatgpt会员` 返回的是亚美尼亚语联想）。所以 Claude 这一族页面可以正常用「会员」。
 *   · 「代开」「代购」「代订阅」「ai会员代充」「ai代充」联想数全部为 0 ——
 *     零需求词，正文里一个都不用。
 *   · 「代充」只有 3 条联想且全是信任审查意图（靠谱吗 / 知乎 / v2ex），
 *     所以它不当主词，只在正文与 FAQ 里承接那批在查「你是不是骗子」的人。
 *   · 「兑换码 / 充值卡 / 礼品卡」有真实联想，而本站交付的就是卡密——自然写进正文。
 *
 * 【这一页真正的独占内容】不是价格，是「兑换前的四项检查」，尤其是
 * Organization ID 被 Shadow Ban 这一条——中文互联网上几乎没有人讲，
 * 而它恰恰是本站这个档位最常见的一种「卡密核销了但充值没成功」。
 * 一张 Max 卡密的金额不小，这一节能省掉的纠纷金额比整页的流量还值钱。
 *
 * 【为什么不是 doorway page】Google 判定 doorway 看四条：换域名做变体、批量地域词页、
 * 纯中转页、批量近似页。这一页承载的是一整组同意图查询（Max 多少钱 / 5x 和 20x 差别 /
 * 要不要从 Pro 升上来 / 怎么充 / 兑换前要确认什么），内容是这个站独有的运营知识
 * （真实价格与成交数、iOS 订阅充值这条链路的实际前提、售后里踩出来的四项检查、
 * 退款与封号口径），并且它进入 /chongzhi 这个可浏览层级、在 footer 与 hub 页都有入口。
 * 它与 /chongzhi/claude-pro 的区别是档位决策本身，不是关键词换皮。
 *
 * 【正文里的事实来源】价格、库存、累计成交实时取库，页面上不写死任何数字；
 * 兑换前四项检查、质保口径取自后台商品的 cardUsage 文案（商品 2），不是编的。
 * 官方定价（Pro 20 / Max 5x 100 / Max 20x 200 美元每月、苹果内购 125 美元每月）
 * 是公开信息，正文里每次出现都带「以官方页面为准」。改商品文案时要回来核对这一页。
 */

const DEF = findLanding('claude-max')

export async function generateMetadata(): Promise<Metadata> {
  const all = await getLandingProducts()
  const items = matchProducts(all, DEF.match)
  const low = lowestPrice(items)
  // description 里的价格取实时最低价，不写死：Max 这一档单价高，
  // 上游成本一动就是几十块，SERP 上挂一个过期数字比不挂数字更糟。
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

// 【这一份 FAQS 同时喂给页面上的 FaqList 和 JSON-LD 的 FAQPage】
// 两边必须是同一份数据。标记页面上看不到的内容是结构化数据政策明令禁止的。
const FAQS: { q: string; a: string }[] = [
  {
    q: 'Claude Max 一个月多少钱？',
    a: '官方网页端订阅的公开定价是 Max 5x 每月 100 美元、Max 20x 每月 200 美元，苹果内购渠道更贵，Max 5x 是每月 125 美元（以官方页面为准，官方会调整）。本站上架的是 Max 5x 档，走苹果订阅充值，人民币价格以本页价格表里显示的实付金额为准，随上游成本浮动。',
  },
  {
    q: 'Claude Max 5x 和 20x 有什么区别，值得直接上 20x 吗？',
    a: '官方是用「相对 Pro 的倍数」来描述这两档的，5x 大约是 Pro 用量的五倍、20x 大约是二十倍，价格也正好是 100 和 200 美元的关系——注意价格翻一倍、额度翻四倍，所以真把 5x 用满的人上 20x 单位成本更低。但反过来说，如果你现在连 Pro 的额度都不是天天用完，20x 的钱基本是浪费。稳妥的顺序是先上 5x 跑满一个周期，看看到底会不会撞到上限。',
  },
  {
    q: '我现在用 Claude Pro，什么情况下该升到 Max？',
    a: '一个可操作的判断标准：你在一个正常工作日里，是不是经常在下午就被提示用量到顶、只能等下一个窗口。如果一周里有三四天是这样，升 Max 是省时间的；如果一个月才撞上一两次，那你要的是把长对话拆开、把大文件裁掉，不是换档位。另一种明确该升的情况是你主要在用 Claude Code 跑长任务——那个场景的消耗和聊天完全不是一个量级。',
  },
  {
    q: '页面上显示补货中，还能下单吗？什么时候到货？',
    a: '库存是实时的，以本页价格表里那一列显示的状态为准：显示有货就能直接下单，显示补货中就是当前确实没有现货。Max 这一档单价高、上游放货不稳定，补货时间我们自己也不总能提前知道，所以不给承诺时间——想要的话直接联系客服登记，到货通知你，或者先看 Claude Pro 档顶一段时间。',
  },
  {
    q: '充值需要把我的 Claude 账号密码给你们吗？',
    a: '不需要。本站交付的是卡密（也就是常说的兑换码、充值卡），充值动作由你自己在兑换页发起，账号密码全程不经过我们。兑换时要按页面提示填写要充值的账号信息，具体填哪一项以兑换页上的提示为准。',
  },
  {
    q: 'Organization ID 被 Shadow Ban 是什么意思，我怎么知道自己有没有？',
    a: 'Claude 的账号在后台都归属于一个组织（个人账号也有属于自己的那一个），Organization ID 就是这个组织的标识。被 shadow ban 的特点是不会有任何封禁提示：你能登录、能打开对话界面、看起来一切正常，但消息发不出去，或者一直转圈、直接报错。自查不需要你去找那串 ID——到 Claude 官方网站新开一个对话，用网页端而不是第三方客户端，发一条最普通的消息，能正常收到回复这一项就算过；发不出去就先别兑换。',
  },
  {
    q: '账号上已经有 Pro 订阅，能直接充 Max 吗？',
    a: '不能，兑换前的四项检查第一条就是「没有有效订阅」。已经有订阅时提交，卡密会被上游核销掉而充值不会成功，这种情况按已核销处理，退不了。要么等当期订阅到期之后再兑换，要么下单前先联系客服说明你的账号现状，让客服帮你判断。',
  },
  {
    q: 'Claude 代充到底靠不靠谱，会不会被骗？',
    a: '这个行业里无照个人卖家占多数，收钱跑路、或者要你把账号交出去的都有，所以这个疑虑是合理的。可以核验的几点：本站由益阳市赫山区必高科技有限公司运营，能开具增值税发票（标价不含税，开票需另付 6% 税费）；价格、库存、累计成交数全部公开在页面上；交付卡密而不碰你的账号密码；退款规则（掉订阅按剩余天数退、未使用卡密可退、已核销不退、封号不质保）写在服务条款里。不放心可以先在 Claude Pro 那一档买一次小额的跑通流程，再回来买 Max。',
  },
  {
    q: '充上去之后被封号了，能退钱吗？',
    a: '不能。商品说明里写得很直白：质保订阅，不质保封号，介意勿拍。订阅期内非因你自身原因掉订阅的，按剩余未使用天数折算退款；但账号被官方封禁不在质保范围内——封号通常是账号本身的历史或使用方式带来的，与这一笔充值无关。Max 这一档金额不小，这条口径请在下单前就确认能接受。',
  },
  {
    q: '卡密买了先放着不兑换，会过期吗？可以退吗？',
    a: '未使用的卡密不设统一有效期，具体以对应商品页的说明为准（Claude Pro 那一档明示永久有效），没用过的也可以按服务条款申请退款。但一旦卡密被上游核销——也就是充值动作已经发生——无论结果是成功还是失败都不能退。所以真正要紧的不是有效期，而是兑换前把四项检查过一遍。',
  },
]

export default async function ClaudeMaxLandingPage() {
  const all = await getLandingProducts()
  const items = matchProducts(all, DEF.match)
  const low = lowestPrice(items)
  // 库存是实时的：不在正文里写死「缺货」，而是按当下的真实状态决定要不要多给一条退路。
  const anyInStock = items.some(inStock)

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
              会搜 Claude Max 的人一般已经在用 Pro 了，问题不是「Claude 是什么」，
              而是<strong className="text-white/80">这一档到底值不值、5x 够不够、怎么在国内付钱</strong>。
              这一页就按这个顺序讲：先给 Pro / Max 5x / Max 20x 的规格与定价对照，
              再讲什么情况下升档是划算的、什么情况下是白花钱，最后是下单与兑换。
            </p>
            <p>
              本站交付的是卡密（兑换码、充值卡），用支付宝付人民币，
              拿到卡密自己去兑换页完成充值，不需要信用卡，也不需要把账号密码交出来
              {low ? `。当前 Max 档最低 ￥${low.toFixed(0)}。` : '。'}
              下单前请务必先看「兑换前必须确认的四件事」那一节——
              这四条里任意一条不满足就提交，卡密会被核销掉而充值不会成功，这种情况退不了。
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
                不是展示用的装饰数字；「库存」也是实时的，显示什么就是什么。
                上面列出的就是本站当前在售的全部 Max 档位——没看到的档位就是暂时没有上架。
                {!anyInStock && (
                  <>
                    {' '}
                    当前没有现货的话，可以先看{' '}
                    <Link href={landingPath('claude-pro')} className="text-purple-400 hover:text-purple-300">
                      Claude Pro 充值
                    </Link>{' '}
                    顶一段时间，或者联系客服登记，到货通知你。Max 这一档上游放货不稳定，
                    补货时间我们不做承诺。
                  </>
                )}
              </>
            }
          />
        </Section>

        <Section id="tiers" heading="Pro / Max 5x / Max 20x：规格与定价对照">
          <p>
            先把公开定价摆清楚。下面这几个数字是官方页面上写着的，但官方随时会调整，
            也会因为地区与结算币种不同而有差异，<strong className="text-white/80">一切以官方页面为准</strong>。
            这里列出来只是为了让你有一个换算的基准，好判断本站的人民币价格处在什么位置。
          </p>

          <div className="overflow-x-auto rounded-2xl border border-white/10 my-6">
            <table className="w-full text-sm lg:text-[15px]">
              <thead>
                <tr className="bg-white/5 text-left text-white/50">
                  <th scope="col" className="px-4 py-3 font-medium">对比项</th>
                  <th scope="col" className="px-4 py-3 font-medium">Pro</th>
                  <th scope="col" className="px-4 py-3 font-medium">Max 5x</th>
                  <th scope="col" className="px-4 py-3 font-medium">Max 20x</th>
                </tr>
              </thead>
              <tbody className="text-white/70">
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">官方网页端月费</td>
                  <td className="px-4 py-3">20 美元</td>
                  <td className="px-4 py-3">100 美元</td>
                  <td className="px-4 py-3">200 美元</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">苹果内购月费</td>
                  <td className="px-4 py-3">以 App Store 显示为准</td>
                  <td className="px-4 py-3">125 美元</td>
                  <td className="px-4 py-3">以 App Store 显示为准</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">用量口径</td>
                  <td className="px-4 py-3">基准</td>
                  <td className="px-4 py-3">约为 Pro 的 5 倍</td>
                  <td className="px-4 py-3">约为 Pro 的 20 倍</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">每「一份 Pro 用量」的钱</td>
                  <td className="px-4 py-3">20 美元</td>
                  <td className="px-4 py-3">20 美元（与 Pro 持平）</td>
                  <td className="px-4 py-3">10 美元（前提是真用得完）</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">典型用户</td>
                  <td className="px-4 py-3">日常问答、偶尔写代码</td>
                  <td className="px-4 py-3">每天写代码、长文档处理</td>
                  <td className="px-4 py-3">整天跑 Claude Code 的重度用户</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            有三件事值得单独说。第一，
            <strong className="text-white/80">Claude 这一档在苹果渠道比官方网页端贵</strong>：
            Max 5x 网页端 100 美元，苹果渠道 125 美元。不同产品在苹果渠道是否加价、加多少并不一致，
            以你在 App Store 里看到的价格为准。本站这一档走的就是苹果订阅充值链路，
            人民币价格是按 125 美元那条线折下来的，比价时别拿它去对 100 美元。
          </p>
          <p>
            第二，
            <strong className="text-white/80">Max 的额度官方是用「相对 Pro 的倍数」来描述的，不是一个固定条数</strong>。
            实际能发多少消息取决于对话长度、附件大小、用的是哪个模型、以及官方当期的限流策略，
            这几项官方都会调整。所以任何一个把「Max 每天能发多少条」写成确定数字的页面，
            要么是在抄很久以前的文章，要么是在编。想知道当期的准确口径，看官方页面。
          </p>
          <p>
            第三，把上面那张表的倒数第二行读一遍：
            <strong className="text-white/80">
              Max 5x 的「单位用量成本」和 Pro 其实是一样的
            </strong>
            ——100 美元买五份，一份还是 20 美元，你多花的钱换来的是「不用等窗口重置」，不是折扣。
            真正便宜的是 Max 20x：价格只翻一倍而用量翻四倍，一份摊下来大约 10 美元。
            所以决策其实很清楚：5x 是花钱买「不被打断」，20x 才是花钱买「便宜」，
            而后者只对天天把额度用满的人成立。用不满的话，20x 那多出来的 100 美元纯属浪费。
          </p>
        </Section>

        <Section id="upgrade" heading="什么情况下值得从 Pro 升到 Max">
          <p>
            Max 比 Pro 贵五倍，这个差价只在一种情况下划算：你确实在被额度卡住，而且被卡住的代价是你的时间。
            下面几种情形分开说，对号入座就行。
          </p>

          <SubSection heading="一周有三四天在下午就用满了">
            <p>
              这是最清楚的升级信号。撞上限之后你只能等窗口重置，等待期里的工作是停摆的。
              如果这种情况一周发生三四次，Max 5x 买回来的是那几个小时，算法很简单。
              反过来，如果一个月才撞上一两次，那你要解决的是使用习惯——把超长对话开新窗口重来、
              把塞进上下文的大文件先裁一遍——而不是换档位。
            </p>
          </SubSection>

          <SubSection heading="主要在用 Claude Code 跑长任务">
            <p>
              这是 Max 最典型的用户画像。命令行里跑的任务会持续读写文件、反复迭代，
              消耗和聊天窗口里一问一答完全不是一个量级，Pro 的额度在这种用法下撑不了多久。
              Max 档对 Claude Code 的可用量、以及对更高能力模型的使用额度都比 Pro 宽，
              具体哪些模型在哪个档位可用、当期的限额是多少，官方会随版本调整，以官方页面为准。
            </p>
          </SubSection>

          <SubSection heading="每天处理长文档、大代码库">
            <p>
              一次性喂进去几十页合同、整个仓库的代码，单次请求的消耗就很高，
              Pro 的额度容易在几轮之内见底。这种用法升 Max 是合理的，
              但先确认一件事：你是不是每次都把用不到的部分也一起塞进去了。
              把输入裁准往往比升档省钱。
            </p>
          </SubSection>

          <SubSection heading="什么情况下不值得升">
            <p>
              三种：一是你只是想要「更好的模型」——档位主要影响的是用量，不是把你换到另一个产品；
              二是你一个月只有几天忙——这种情况下常年挂着 Max 不划算，但也别指望「忙起来买一次、闲了退回 Pro」这样来回切：按上面兑换前的第一条，账号上有有效订阅（含已取消但还没到期的）就兑换不了，想换档得等当期整个走完；
              三是你打算和别人合用——共享账号既违反官方使用条款，也是最常见的封号原因之一，
              而封号在本站是不质保的，省下来的钱不够赔那个风险。
            </p>
          </SubSection>
        </Section>

        <Section id="preflight" heading="兑换前必须确认的四件事">
          <p>
            这是整页最要紧的一节。本站的 Max 卡密走苹果订阅充值链路，
            <strong className="text-white/80">上游是否成功，取决于你的账号在兑换那一刻的状态</strong>。
            四条前提里任意一条不满足，提交之后卡密照样会被核销，而充值不会成功——
            这种情况按已核销处理，不退。Max 这一档金额不小，花三分钟对一遍是这一页能给你的最实在的东西。
          </p>

          <CheckList
            items={[
              <>
                <strong className="text-white/80">账号上没有有效订阅</strong>
                ：Pro 也算，正在生效的 Max 也算。有订阅在跑就不能充。
              </>,
              <>
                <strong className="text-white/80">Billing 里没有未结清欠款，也没有异常退款记录</strong>
                ：历史上发起过争议扣款、或者有一笔没扣成功挂在那里，都会挡住这次订阅。
              </>,
              <>
                <strong className="text-white/80">Organization ID 没有被 Shadow Ban</strong>
                ：这一条最隐蔽，下面单独讲怎么自查。
              </>,
              <>
                <strong className="text-white/80">能在 Claude 官方网站正常发送消息</strong>
                ：这是前三条的一个总体检——发得出去、收得到回复，说明账号目前是活的。
              </>,
            ]}
          />

          <SubSection heading="第一条：什么叫「有效订阅」">
            <p>
              只要账号上还有一个正在计费周期内的订阅，无论是 Pro 还是 Max，都属于有效订阅。
              注意「已取消但还没到期」也算——取消只是不再续费，当期权益还在，充值同样进不去。
              要充就等当期结束之后再兑换。如果你不确定自己的订阅什么时候到期，
              在账号的订阅设置里能看到下一个计费日，那个日期之后再动手。
            </p>
          </SubSection>

          <SubSection heading="第二条：Billing 里的欠款与异常退款记录">
            <p>
              有两种常见情形。一种是之前某次自动续费扣款失败，账号上挂着一笔未结清的费用，
              这笔不清掉，新的订阅建不起来。另一种是你曾经向发卡行发起过争议扣款（chargeback），
              或者有过被判定为异常的退款——这类记录会长期留在账号上，
              触发的往往不只是这一次充值失败，而是更严格的风控。
              这两种情况我们这边没有办法绕过去，得你自己在官方的账单页面处理干净。
            </p>
          </SubSection>

          <SubSection heading="第三条：Organization ID 被 Shadow Ban 是怎么回事">
            <p>
              Claude 的账号在后台都归属于一个组织（个人账号也有属于自己的那一个），
              Organization ID 就是这个组织的标识。所谓 shadow ban，
              意思是<strong className="text-white/80">官方限制了这个组织，但不给你任何通知</strong>——
              没有封禁邮件，没有弹窗，账号看起来完全正常。
            </p>
            <p>
              典型表现是这几种：能登录、能打开对话界面、历史记录都在，
              但一发消息就一直转圈不出结果；或者立刻报一个含糊的错误，刷新之后还是一样；
              或者换网络、换设备、换浏览器都无效——这一点很关键，
              因为它能把「网络问题」和「账号问题」区分开。如果你换了个完全干净的网络环境还是发不出去，
              那大概率不是网络的事。
            </p>
            <p>
              自查不需要你去找那串 ID。方法就一句话：
              <strong className="text-white/80">
                到 Claude 官方网站，用网页端（不要用第三方客户端、不要用 API），
                新开一个对话，发一条最普通的消息
              </strong>
              。能正常收到回复，这一项就算过了；发不出去、或者反复报错，就先别兑换。
              这个检查花不了三十秒，而它挡掉的是一整张 Max 卡密。
            </p>
            <p>
              至于被 shadow ban 之后怎么办——老实说，这不是充值服务能解决的问题，
              它属于账号本身的状态，得走官方的申诉渠道。
              我们能做的只是在你兑换之前提醒你别把卡密丢进去。
              如果客服在排查时需要你提供 Organization ID，会告诉你从哪里取，
              日常自查你不需要知道这串 ID。
            </p>
          </SubSection>

          <SubSection heading="第四条：能不能正常发消息——它同时也是第三条的自查动作">
            <p>
              第三条说的「到官网新开一个对话、发一条最普通的消息」，做的就是第四条。
              两条一起过：消息发得出去、回复收得回来，说明即便有你没想到的其他限制，
              账号此刻也是可用状态；发不出去，前三条对了也没用，先别提交卡密。
            </p>
          </SubSection>

          <Warning>
            这四条是<strong>兑换前</strong>的检查，不是<strong>下单前</strong>的。
            卡密本身没兑换就还能退，一旦提交到兑换页、上游核销掉，无论成功失败都不退。
            所以正确的顺序是：下单 → 拿到卡密 → 把这四条过一遍 → 再去兑换。
            拿不准就先别提交，联系客服问一句，比丢一张 Max 卡密便宜太多。
          </Warning>
        </Section>

        <Section id="steps" heading="从下单到到账，一共四步">
          <Steps
            steps={[
              {
                title: '在价格表里选档位下单',
                body: (
                  <>
                    点进对应商品，用支付宝付款。卡密会发到你登录本站所用的账号邮箱，
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
                    里看到，同时会发到你的账号邮箱。内容会一直留在订单里，找不到了随时回去看。订单里会附上对应的兑换页地址。
                  </>
                ),
              },
              {
                title: '过一遍上面那四项检查',
                body: (
                  <>
                    没有有效订阅、Billing 干净、没被 shadow ban、官网能正常发消息。
                    这一步别跳过——理由和后果都写在上一节里了。这一步做完之前，卡密还是可退的。
                  </>
                ),
              },
              {
                title: '兑换',
                body: (
                  <>
                    打开订单里给出的兑换页，输入卡密，按页面提示填写要充值的账号信息
                    （具体填哪一项以兑换页上的提示为准），提交后等待处理完成。
                    处理中不要重复提交——重复提交不会更快，只会让排查变复杂。
                    兑换成功后到官方账号的订阅页面确认一下档位已经变成 Max。
                  </>
                ),
              },
            ]}
          />
        </Section>

        <Section id="risk" heading="质保到哪儿、不质保什么">
          <p>
            Max 这一档单价高，把边界说清楚比说漂亮话有用。商品说明里写的是
            「质保订阅，不质保封号，介意勿拍」，展开就是下面几条：
          </p>
          <CheckList
            items={[
              <>
                <strong className="text-white/80">订阅期内非因你自身原因掉订阅</strong>
                ：按剩余未使用天数折算退款。
              </>,
              <>
                <strong className="text-white/80">未使用的卡密</strong>
                ：长期有效，不设过期时间，没兑换过的可以按服务条款申请退款。
              </>,
              <>
                <strong className="text-white/80">已被上游核销的卡密</strong>
                ：无论充值成功与否都不退。这是本站售后纠纷里占比最高的一类，
                而它几乎全部来自跳过了兑换前的四项检查。
              </>,
              <>
                <strong className="text-white/80">账号被官方封禁</strong>
                ：不在质保范围。封号通常来自账号本身的历史、共享使用、或者违反官方使用条款的行为，
                与这一笔充值无关，我们也没有任何渠道去捞。
              </>,
            ]}
          />
          <p className="pt-2">
            完整口径写在{' '}
            <Link href="/terms" className="text-purple-400 hover:text-purple-300">
              服务条款
            </Link>{' '}
            里。这些规则不好看，但它们是明确的——下单前请先确认能接受，别买完再来谈。
          </p>
        </Section>

        <Section id="trust" heading="第一次在这儿买，怎么判断靠不靠谱">
          <p>
            搜「Claude 代充」的人里有相当一部分是在查「会不会被骗」，这个疑虑很合理：
            这个行业里无照个人卖家占多数，收钱跑路、或者要你把账号密码交出来的都有。
            下面这几点是你可以自己核验的，不是我们自说自话：
          </p>
          <CheckList
            items={[
              <>
                <strong className="text-white/80">有可核验的经营主体</strong>
                ：本站由益阳市赫山区必高科技有限公司运营，能开具增值税发票（页面标价不含税，开票需另付 6% 税费），票据上盖的是这家公司的章。
              </>,
              <>
                <strong className="text-white/80">交付卡密，不碰你的账号密码</strong>
                ：兑换动作由你自己发起，账号全程在你手里。
              </>,
              <>
                <strong className="text-white/80">价格、库存、累计成交都公开在页面上</strong>
                ：上面那张表里的成交数是真实订单数，没货就显示补货中，不做假有货。
              </>,
              <>
                <strong className="text-white/80">先小后大</strong>：Max 这一档不便宜，
                不放心完全可以先去{' '}
                <Link href={landingPath('claude-pro')} className="text-purple-400 hover:text-purple-300">
                  Claude Pro 充值
                </Link>{' '}
                买一次小额的，把下单、收卡密、兑换这条链路跑通一遍，再回来买 Max。
              </>,
              <>
                <strong className="text-white/80">没有账号也能从头开始</strong>：如果你连 Claude 账号还没有，
                先看{' '}
                <Link href={landingPath('claude-zhuce')} className="text-purple-400 hover:text-purple-300">
                  Claude 注册
                </Link>{' '}
                —— 注册这一步卡住的人比充值卡住的还多。
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
