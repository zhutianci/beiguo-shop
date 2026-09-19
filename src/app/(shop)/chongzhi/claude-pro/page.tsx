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
 * Claude Pro 充值落地页。
 *
 * 【选词依据】2026-09-19 Google 中文下拉建议实测：
 *   · `claude pro 购买` 返回 10 条满额联想，而且全是商业意图：
 *     claude pro 账号 购买 / claude code pro 购买 / claude pro 怎么 购买 /
 *     claude pro 成品 号 购买 / claude pro 账户 购买 / 国内 如何 购买 claude pro。
 *     `claude pro充值` 同样有联想 —— 所以这一页的主词是「Claude Pro 充值 / 购买」。
 *   · 裸词「claude充值」零联想。Claude 这一侧的用户不搜裸品牌词，必须带产品名（pro / max）
 *     才会形成查询，标题与 H1 里「Claude Pro」四个字不能拆开、也不能省。
 *   · 「claude 会员」返回 10 条满额（价格 / 购买 / 共享 / 额度 / 账号 / 等级 / 优惠 / 订阅 / 档位），
 *     所以这一页可以放心用「会员」这个词 —— 注意它只对 Claude 成立，
 *     ChatGPT 侧的「会员」返回的是亚美尼亚语联想，那边的页面不能用。
 *   · 「代开」「代购」「代订阅」「ai会员代充」「ai代充」联想数全部为 0，正文一个都不用。
 *     「代充」只有 3 条且全是信任审查（靠谱吗 / 知乎 / v2ex），所以它不当主词，
 *     只在「靠不靠谱」那一节和 FAQ 里出现，用来接住那批在查「你是不是骗子」的人。
 *   · 「兑换码 / 充值卡 / 礼品卡」有真实联想，而本站交付的就是卡密 —— 白捡的语义匹配，
 *     在正文里自然出现即可，不堆。
 *
 * 【为什么不是 doorway page】这一页不是把「claude pro 充值 / 购买 / 多少钱 / 怎么买」
 * 拆成四个近似页里的一个，它承载的是一整组同意图查询，内容是这个站独有的运营知识：
 * iOS 订阅充值与上号充值在链路上的实际差别、兑换前必须核对的两项账户状态、
 * 频繁变动 IP 与封号的关系、Pro 升 Max 的真实路径。这些在别处查不到，
 * 也不是把商品描述换个说法重排一遍。它进入 /chongzhi 这个可浏览层级，
 * 在 hub 页、footer 和其他落地页之间互相可达，不是只挂在 sitemap 上的孤儿页。
 *
 * 【正文里的事实来源】价格、库存、累计成交实时取库，页面上不写死任何数字；
 * 兑换前提、永久有效、24 小时自助、Pro 升 Max、封号不质保与「频繁变动 IP」这条封号原因，
 * 全部取自后台商品 16（Claude pro 自助充值 | iOS订阅充值）的 cardUsage 文案，不是编的。
 * 改商品文案时要回来核对这一页。
 */

const DEF = findLanding('claude-pro')

export async function generateMetadata(): Promise<Metadata> {
  const all = await getLandingProducts()
  const items = matchProducts(all, DEF.match)
  const low = lowestPrice(items)
  // SERP 上摆一个真实价格数字是免费的点击率优势，但数字必须取实时最低价，不写死。
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

/**
 * FAQ 是一个函数而不是模块级常量：这一页的两条答案里要出现实时价格，
 * 写死数字会在调价那天变成谎话。同一份数组同时喂给 FAQPage 标记和页面上的问答区 ——
 * 标记页面上看不见的内容是结构化数据政策明令禁止的，两边不能是两份文案。
 */
function buildFaqs(low: number | null): { q: string; a: string }[] {
  const priceLine = low ? `本站这一档 ${low.toFixed(0)} 元` : '本站的实时价格见本页价格表'
  return [
    {
      q: 'Claude Pro 会员一个月多少钱？',
      a: `${priceLine}。充值周期以商品页与兑换页显示的为准，价格随上游成本浮动，下单时页面上的实付金额是准的。Anthropic 那边按美元月付计价，用苹果内购开通时还会受汇率与商店定价影响，具体数字以 Claude 自己的定价页面和 App Store 上显示的为准，本站不替它报价。`,
    },
    {
      q: '国内怎么购买 Claude Pro？没有信用卡能开吗？',
      a: '能。你在本站用支付宝付人民币，拿到一张卡密（也就是常说的兑换码、充值卡），自己到卡密附带的兑换页完成充值，全程不需要信用卡、虚拟卡或任何境外支付方式。',
    },
    {
      q: '充值需要把我的 Claude 账号密码给你们吗？',
      a: '不需要。这一档走的是 iOS 订阅充值，无需上号 —— 你不用交出账号密码，也不用交出登录后的凭据，充值动作由你自己在兑换页发起，账号全程在你手里。这也是它相比「把号给别人去订阅」最实在的区别。',
    },
    {
      q: '我账号上还有没到期的会员，能先充上叠一个月吗？',
      a: '不能。当前有会员没过期、或者账单里存在逾期账单的账号，这笔充值不会到账。更要紧的是卡密提交之后就被核销了，充值没成功也退不了。想续期请等当期走完再充，或者先联系客服确认。',
    },
    {
      q: '付完款多久能拿到卡密？晚上下单有人处理吗？',
      a: '卡池正常时付款确认后即时发放（极少数缺货情况下会转人工补发，订单页会标注），在「我的订单」里能看到，同时发到你的账号邮箱。兑换是自助的，只要手上有卡密，24 小时都可以自己充，不用等客服上班。兑换页显示处理中就等它跑完，不要重复提交。',
    },
    {
      q: '卡密买了先不用，会过期吗？',
      a: '未使用的卡密永久有效，不会过期，可以先买着等当期会员到期再用。反过来说，一旦提交核销就不能退 —— 所以宁可放着，也不要在账户状态没核对清楚的时候先试一下。',
    },
    {
      q: 'Claude Pro 能升级成 Max 吗？怎么升？',
      a: 'Pro 可以升级为 Max。做法是在本店下单后联系客服完成升级，这一步不是在兑换页自助点一下就行的。差价与具体操作以客服答复为准；如果你本来就确定要用 Max，直接看 Claude Max 充值那一页更省事。',
    },
    {
      q: '充完之后账号被封了，能退款吗？',
      a: '不能，封号不质保，介意请不要下单。这条写在商品说明第一行，我们不打算含糊过去：封号是 Anthropic 单方面判定的，绝大多数是 Claude 普号本身的问题，跟这一笔充值走哪条链路关系不大。能降低的是「因为上号而被风控」这一类风险，不是全部风险。',
    },
    {
      q: 'Claude 代充靠不靠谱，会不会收了钱就跑？',
      a: '这个行业确实鱼龙混杂，可核验的东西只有几样：卖家有没有真实经营主体、能不能开发票、退款与质保规则是否公开、交付的是卡密还是让你交出账号。本站由益阳市赫山区必高科技有限公司运营，价格、库存、累计成交数都实时显示在页面上，规则写在服务条款里，交付卡密而不碰你的账号。',
    },
    {
      q: '我的 Claude 账号老是被封，和充值有关系吗？',
      a: '多数情况下没关系。我们见得最多的封号原因是频繁变动 IP —— 同一个账号短时间内从差别很大的网络出口访问，风控会当成账号被共享或被盗。固定一个干净的出口环境，比换任何一种充值方式都管用。',
    },
  ]
}

export default async function ClaudeProLandingPage() {
  const all = await getLandingProducts()
  const items = matchProducts(all, DEF.match)
  // Max 档位不属于这一页，但「Pro 升 Max」那一节要给一个真实的去处，所以顺手捞出来。
  const maxItems = all.filter(
    (p) => p.categoryName === 'Claude' && p.name.toLowerCase().includes('max'),
  )
  const low = lowestPrice(items)
  const faqs = buildFaqs(low)

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: '首页', path: '/' },
            { name: LANDING_HUB.navLabel, path: LANDING_HUB.path },
            { name: DEF.navLabel },
          ]),
          faqJsonLd(faqs),
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
              买 Claude Pro 会员，国内用户真正犹豫的往往不是价格，而是两件事：
              <strong className="text-white/80">要不要把账号交出去</strong>，以及
              <strong className="text-white/80">充完了会不会被封</strong>。
              本站这一档走的是 iOS 订阅充值，无需上号 —— 你拿到的是一张卡密
              （也就是常说的兑换码、充值卡），自己在兑换页把会员充上，账号密码不用给任何人。
            </p>
            <p>
              这一页把该讲的都讲完：现在多少钱、iOS 订阅充值到底是怎么一回事、
              兑换前必须核对的两项账户状态、频繁变动 IP 为什么是最常见的一类封号触发原因、
              Pro 怎么升到 Max。坏消息也写在里面 —— 封号不质保，
              前提不满足就提交会白白核销掉一张卡密，这笔钱退不回来
              {low ? `。当前 ￥${low.toFixed(0)} 起，充值周期以商品页显示的为准。` : '。'}
            </p>
          </>
        }
      >
        <Section id="price" heading="价格与档位">
          <PriceTable
            items={items}
            note={
              <>
                价格随上游成本浮动，以下单时商品页显示的实付金额为准。库存与「累计成交」都取自后台实时数据，
                成交数是真实订单数，不是摆着看的装饰数字。
                {maxItems.length > 0 && (
                  <>
                    {' '}
                    用量更大、要更高额度的话，另有{' '}
                    <Link
                      href={`/products/${maxItems[0].id}`}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      {maxItems[0].name}
                    </Link>{' '}
                    ￥{maxItems[0].price.toFixed(0)}。
                  </>
                )}
              </>
            }
          />
        </Section>

        <Section id="ios-subscription" heading="iOS 订阅充值是什么意思：为什么不用把账号交出去">
          <p>
            给 Claude 账号充会员，市面上大致就两条路，差别不在价格，在你要交出什么。
          </p>

          <SubSection heading="第一条：把账号交给对方，让对方登录你的号去订阅">
            <p>
              这是最常见、也是最省事的一种 —— 对方要你的邮箱和密码，或者要你登录之后的一段凭据，
              然后用他那边的设备和网络登进你的账号，把订阅开上。问题不在于对方是不是好人，
              在于这个动作本身：你的账号在一段时间里被一台陌生设备、一个陌生网络环境登录过，
              而这恰好是风控系统最敏感的信号之一。号出事的时候，你没法判断是充值导致的，
              还是你自己平时的用法导致的。
            </p>
          </SubSection>

          <SubSection heading="第二条：走 iOS 订阅充值，也就是本站这一档">
            <p>
              这条路径不需要任何人登录你的账号。你在本站付款后拿到卡密，
              在卡密附带的兑换页按提示操作即可，兑换页会告诉你这一步要填什么。
              整个过程里你交出去的只有一串卡密的使用权，账号密码始终在你自己手里。
              商品说明里那句「无需上号，使用 Claude 即可充值」，说的就是这件事。
            </p>
          </SubSection>

          <SubSection heading="关于「封号率降低 99%」这个说法">
            <p>
              上游给这一档的原话是「封号率降低 99%」。这个数字我们没有办法替它验证，
              所以不当卖点反复讲。能验证的是机制：这条链路里少了一次异地登录，
              也就少了一类最容易触发风控的动作。它去掉的是「因为充值而被盯上」这一类风险，
              不是你账号上的全部风险 —— 你自己怎么用、从哪里用，仍然决定着大部分结果。
              这也是为什么下面还要单独讲一节 IP。
            </p>
          </SubSection>
        </Section>

        <Section id="before-redeem" heading="兑换前必须核对的两件事，错了就白损失一张卡密">
          <Warning>
            <strong>当前账号上有没过期的会员，或者账单里存在逾期账单，这笔充值无法到账。</strong>
            请在提交前自己检测无误再提交 —— 卡密一旦提交就被核销，充值没成功也无法退款。
            这是本站售后里最常见的一类纠纷，花一分钟核对能整个省掉。
          </Warning>

          <SubSection heading="第一件：账号上还有没走完的会员">
            <p>
              不管这个会员是你自己买的、别人送的，还是上个月充的还没到期，只要当期还没结束，
              这一笔都充不进去。想无缝续上的心情可以理解，但系统不认这个。
              正确的做法是等当期走完再兑换 —— 反正未使用的卡密永久有效，放着不会烂。
              确实有特殊情况的，先联系客服问清楚，别自己试。
            </p>
          </SubSection>

          <SubSection heading="第二件：账单里有逾期账单">
            <p>
              如果这个账号以前扣款失败过、留下了没有结清的欠费记录，充值同样不会到账。
              这种情况下要先把账单状态处理干净，再回来兑换。你自己在账号的账单页面能看到，
              如果看不明白，把情况发给客服一起判断，比直接提交划算得多。
            </p>
          </SubSection>

          <SubSection heading="为什么这两条要写得这么重">
            <p>
              因为代价不对称。核对一遍花你一分钟，跳过这一步的代价是一张卡密作废。
              需要说清楚的是：这不是店家想赖账，而是卡密提交之后在上游那边已经实际消耗掉了，
              我们手上并没有一张能收回来的东西。所以这条规则没得商量，也不会因为是谁下的单而例外。
            </p>
          </SubSection>
        </Section>

        <Section id="ip-ban" heading="频繁变动 IP：最常见的一类封号触发原因">
          <p>
            做这门生意时间长了，回来问「我号怎么没了」的人里，真正和充值有关的是少数。
            按商品说明的口径，封号的大头是普号本身的问题；而在「你自己能控制的那一部分」里，
            出现频率最高的是网络环境 —— 更具体地说，是
            <strong className="text-white/80">短时间内频繁变动出口 IP</strong>。
            Claude 这边对这件事比很多人以为的要敏感。
          </p>
          <p>
            典型的踩雷方式有这么几种：在节点列表里随手点，一天里换了七八个出口；
            手机、电脑、平板各走各的线路，同一个账号同时出现在三个相距很远的地方；
            白天在公司走一条线，晚上回家换一条，路上还用手机流量顶一段。
            这些在你看来只是网络切换，在风控那边看到的是「这个账号正在被多个人共享」
            或者「这个账号被盗了」。判定一旦落下来，你手里没有申诉的抓手。
          </p>
          <p>
            能做的事其实很朴素：固定一个出口，别频繁换；
            机房类的 IP 比家庭宽带更容易被判定为异常，条件允许就用家宽环境；
            不要把一个号同时给好几个人用 —— 「共享」这件事在搜索联想里很热，
            但它同时也是最快把号玩没的方式之一。
          </p>
          <p>
            如果你还在更前面的阶段就卡住了 —— 注册收不到验证码、注册完立刻被封、
            提示所在环境不可用 —— 那多半也是 IP 和号码的问题，不是运气问题。
            这部分单独写在{' '}
            <Link href={landingPath('claude-zhuce')} className="text-purple-400 hover:text-purple-300">
              Claude 注册
            </Link>{' '}
            那一页，包含家宽环境下的注册普号与接码。
          </p>
          <Warning>
            要把话说到底：以上是运营经验，不是保证。
            <strong>封号由 Anthropic 单方面判定，本站不质保封号</strong>，
            商品说明里也是这么写的。按上面的方式用，是把概率往下压，不是把风险清零。
          </Warning>
        </Section>

        <Section id="pro-to-max" heading="Pro 够不够用，什么时候该升 Max">
          <p>
            Pro 是入门那一档，对绝大多数「每天问几十个问题、偶尔让它读份文档」的用法完全够。
            真正会撞上限的是另一类人：长时间连续对话不清上下文、一次丢进去几十个文件、
            或者拿 Claude Code 之类的方式高频调用。这类用法在 Pro 上的体感就是频繁被额度打断，
            而额度打断这件事，换账号解决不了，只能往上一档走。
          </p>
          <p>
            所以顺序建议是：先用 Pro 跑一个周期，看自己会不会真的撞到上限。
            撞不到就没必要多花那份钱；经常撞到，再升。
          </p>
          <SubSection heading="已经在本店买了 Pro，想升 Max 怎么办">
            <p>
              Pro 可以升级为 Max，做法是在本店下单后联系客服完成升级 ——
              这一步不是在兑换页自助点一下就能完成的，需要人工接一手。
              差价与具体操作请以客服答复为准，我们不在这里写死一个可能会变的数字。
            </p>
          </SubSection>
          <SubSection heading="本来就确定要用 Max">
            <p>
              那就别绕 Pro 这一圈，直接看{' '}
              <Link href={landingPath('claude-max')} className="text-purple-400 hover:text-purple-300">
                Claude Max 充值
              </Link>{' '}
              那一页，上面有额度差别和兑换前的检查清单。
              {maxItems.length > 0 && (
                <>
                  {' '}
                  也可以直接看商品：{' '}
                  <Link
                    href={`/products/${maxItems[0].id}`}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    {maxItems[0].name}
                  </Link>
                  。
                </>
              )}
            </p>
          </SubSection>
        </Section>

        <Section id="cardkey" heading="卡密怎么用：永久有效、24 小时自助、已核销不退">
          <p>
            付款之后你拿到的不是一个「订单待处理」的状态，而是一串可以立刻使用的卡密。
            这三条规则决定了你该怎么安排时间：
          </p>
          <CheckList
            items={[
              <>
                <strong className="text-white/80">未使用的卡密永久有效</strong>
                ，不会过期。所以当期会员还没走完的时候，完全可以先买下来放着，等到期那天再兑换。
              </>,
              <>
                <strong className="text-white/80">只要有卡密，24 小时都能自助充值</strong>
                ，不依赖客服在不在线。半夜发现会员到期了，自己就能处理完。
              </>,
              <>
                <strong className="text-white/80">已核销的卡密不退</strong>
                ，无论充值结果如何。这就是前面那一节反复强调「先核对再提交」的原因。
              </>,
            ]}
          />
          <p className="pt-2">
            兑换页上的具体提示以页面显示为准。如果它要求你确认某项信息、或者显示处理中，
            按它说的做、等它跑完就行，不要因为等得着急而重复提交 ——
            重复提交不会更快，只会让出问题时的排查变复杂。
          </p>
        </Section>

        <Section id="steps" heading="从下单到到账，一共四步">
          <Steps
            steps={[
              {
                title: '选档位并下单',
                body: (
                  <>
                    在上面的价格表里点进商品，用支付宝付款。卡密会发到你登录本站所用的账号邮箱，
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
                    里看到，同时会发到你的账号邮箱。内容会一直留在订单里，找不到了随时回去看。
                  </>
                ),
              },
              {
                title: '核对账户状态',
                body: (
                  <>
                    确认账号上没有还没过期的会员，账单里也没有逾期账单。这一步别跳过，
                    理由见上面那条提醒 —— 不满足前提提交，卡密会被核销而充值不会成功。
                  </>
                ),
              },
              {
                title: '自助兑换',
                body: (
                  <>
                    {/* 【不要在这里写死兑换站域名】实际生效的兑换地址由卡密所属批次决定，
                        站内 redeem 页的注释也写明「上游的品牌与域名不出现在买家面前，货源是商业信息」。
                        写死一个域名，换批次之后这一句就是错的，而且买家会拿它去争论。 */}
                    在{' '}
                    <Link href="/orders" className="text-purple-400 hover:text-purple-300">
                      我的订单
                    </Link>{' '}
                    里复制卡密，点这一单上的「去充值 / 兑换」——按钮会带你到这批卡对应的兑换页。
                    输入卡密，按页面提示完成充值。
                    有任何一步和你预期的不一样，先停下来问客服，别硬着头皮往下点。
                  </>
                ),
              },
            ]}
          />
        </Section>

        <Section id="trust" heading="Claude Pro 代充靠不靠谱：可以核验的几件事">
          <p>
            搜「代充靠谱吗」的人，问的其实是「你会不会收了钱跑」。
            这个疑虑完全合理 —— 这个行业里无照个人卖家占多数，收款跑路、
            或者拿到你的账号之后顺手转卖的都有。与其让我们自夸，不如看下面这几样能不能核验：
          </p>
          <CheckList
            items={[
              <>
                <strong className="text-white/80">有可核验的经营主体</strong>
                ：本站由益阳市赫山区必高科技有限公司运营，能开具增值税发票，票据上盖的是这家公司的章。
              </>,
              <>
                <strong className="text-white/80">交付卡密，不碰你的账号密码</strong>
                ：这一档本身就是「无需上号」的链路，我们连拿你账号的机会都没有。
              </>,
              <>
                <strong className="text-white/80">价格、库存、累计成交都公开在页面上</strong>
                ：上面那张表里的数字直接取自后台，卖了多少单就显示多少单。
              </>,
              <>
                <strong className="text-white/80">规则写在明处，包括不好听的那几条</strong>
                ：封号不质保、已核销的卡密不退、前提不满足充值不到账。我们把这几条写在页面最显眼的地方，
                而不是藏在下单之后的小字里，完整口径见{' '}
                <Link href="/terms" className="text-purple-400 hover:text-purple-300">
                  服务条款
                </Link>
                。
              </>,
              <>
                <strong className="text-white/80">下单前可以先问</strong>
                ：拿不准自己的账号状态符不符合条件，先到客服那里描述清楚再付款，
                比付完了再来处理省事得多。
              </>,
            ]}
          />
        </Section>

        <Section id="faq" heading="常见问题">
          <FaqList faqs={faqs.map((f) => ({ q: f.q, a: f.a }))} />
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
