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
 * Claude 注册落地页——这一批页面里唯一一个「问题页」而不是「商品页」。
 *
 * 【选词依据】2026-09-19 Google 中文下拉建议实测：
 *   · `claude 注册` 与 `claude账号注册` 两个种子词**各返回 10 条满额联想**，
 *     而且清一色是故障描述而不是购买意图：claude注册需要手机号 / claude注册手机号 /
 *     claude注册不了 / claude 账号 注册 需要 手机 号 验证 的 解决 办法 / claude 账号 注册 机。
 *     这是全站少有的「搜的人正卡在半路上、手边就缺一样东西」的词组。
 *   · 这三条故障各自对应本站一个在售 SKU：号码类型 → 接码（荷兰 / 美区实体卡），
 *     IP 环境 → 家宽注册普号，验证码收不到 → 还是号码类型。
 *     所以这一页按「注册会死在哪三个地方」组织，而不是按商品列表组织——
 *     结构跟着用户的故障走，商品只是每一节末尾的那个出口。
 *   · 「会员」这个词对 Claude 成立（`claude 会员` 返回 10 条满额联想：价格 / 购买 / 共享 /
 *     额度 / 账号 / 等级 / 优惠 / 订阅 / 档位），所以正文里可以自然用「会员」，
 *     这在 ChatGPT 侧是不成立的（`chatgpt会员` 返回的是亚美尼亚语联想）。
 *   · 「代充」只有 3 条联想且全是信任审查（靠谱吗 / 知乎 / v2ex），不当主词，
 *     只在 FAQ 里放一条去接那批在查「你是不是骗子」的人。
 *   · 「代开 / 代购 / 代订阅 / ai会员代充 / ai代充」联想数全部为 0，正文里一个都不用。
 *
 * 【为什么不是 doorway page】Google 判定 doorway 看四条：换域名做变体、批量地域词页、
 * 纯中转页、批量近似页。这一页承载的是一整组同意图查询（注册需要手机号吗 / 注册不了 /
 * 收不到验证码 / 注册机 / 家宽是什么），正文是这个站独有的运营知识——
 * 机房 IP 与家宽 IP 在注册环节的实际差别、频繁变动 IP 与封号的关系、
 * 普号到手的处置顺序（先验邮箱再改密码）、质保只到首登的边界。
 * 它进入 /chongzhi 这个可浏览层级，在 hub 页与 footer 都有入口，
 * 并且向下链到 claude-pro（注册完的下一步）与 claude-kyc（被弹认证时的去处）。
 *
 * 【正文里的事实来源】价格、库存、累计成交实时取库；
 * 号码地区（Netherlands）、「包过，不成功不收费」、发货格式「账号----密码」、
 * 邮箱登录网页 mail.com、推荐 Edge、先验邮箱再改密码、「质保首登」「不懂勿拍」，
 * 全部取自后台商品 14 / 15 / 22 的名称与 description，不是编的。
 * 改这三个商品的文案时要回来核对这一页。
 */

const DEF = findLanding('claude-zhuce')

export async function generateMetadata(): Promise<Metadata> {
  const all = await getLandingProducts()
  const items = matchProducts(all, DEF.match)
  const low = lowestPrice(items)
  // 描述里那个价格数字取实时最低价，不写死：接码这一档的成本跟着上游走，
  // 写死之后 SERP 上摆着一个早就不对的数字，比没有数字更糟。
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
 * 页面上显示的问答与 FAQPage 结构化数据**共用这一个常量**。
 * 标记页面上看不到的内容是 Google 结构化数据政策明令禁止的，
 * 两边分开维护迟早会漂移，所以从源头上只留一份。
 */
const FAQS: { q: string; a: string }[] = [
  {
    q: 'Claude 注册需要手机号吗？国内手机号能用吗？',
    a: '注册流程里会要求做一次手机号验证。中国大陆的 +86 号码在这一步基本走不通，这不是你填错了，而是号码归属地本身就在被拒的范围里。可行的办法是用一个能正常收到验证码的境外号码完成这一次验证，本站的注册验证码就是为这一步准备的，按次计费，验证完这个号码的任务就结束了。',
  },
  {
    q: '为什么我的手机号收不到 Claude 的验证码？',
    a: '先分清是「压根没发出来」还是「发了没收到」。页面提示号码无效、或者点了发送什么反应都没有，多半是号码类型被判定为虚拟号、网络号段，这种情况换同类号码没有意义；如果提示已发送但迟迟不到，常见原因是同一个号码短时间内请求次数过多被限频。反复点重新发送不会更快，只会让这个号码和当前 IP 更快进入限制。号码本身有问题可以联系客服处理。',
  },
  {
    q: 'Claude 注册不了、注册页一直报错，是什么原因？',
    a: '按顺序排查三样东西：一是号码类型（虚拟号收不到码），二是网络环境（机房 IP 在注册环节容易被判定），三是账号本身（同一个邮箱或同一环境反复失败后会被临时限制）。绝大多数「注册不了」不是随机的运气问题，而是这三项里某一项不满足。本页前三节分别讲了这三项怎么处理。',
  },
  {
    q: '注册验证码，荷兰号和美区实体卡该选哪一个？',
    a: '荷兰这一档更便宜，商品名里写的是 Netherlands +31，用的时候在注册页的地区下拉里直接选 Netherlands，不用自己去推算或手填区号。美区实体卡这一档贵一些，商品页写的口径是「包过，不成功不收费，号码有问题请联系客服」。两档的实时价格与库存以本页价格表为准。预算优先选荷兰，更在意一次过选美区实体卡。',
  },
  {
    q: '什么是家宽 IP？用机场节点或者自己的 VPS 注册可以吗？',
    a: '家宽 IP 指运营商分配给住宅用户的宽带地址，ASN 属于电信、联通这类 ISP；机房 IP 来自数据中心，ASN 属于云服务商。绝大多数便宜的共享节点和自建 VPS 用的都是机房 IP。同一个节点你能正常打开网页，不代表能顺利注册——注册这一步的风控阈值比浏览严得多，而机房 IP 段往往已经被大量注册行为消耗掉了信誉。所以本站有一档在家宽环境下注册好的普号，直接跳过这一关。',
  },
  {
    q: 'Claude 普号是什么？里面带会员吗？',
    a: '普号就是一个能正常登录的普通 Claude 账号，商品描述里写得很直接：「普通账号，无任何订阅套餐，不懂勿拍」。它不含 Pro、不含 Max，额度就是免费账号的额度。想要会员要在这个账号上另外充，做法见 Claude Pro 充值那一页。当前是否有货以本页价格表里的库存状态为准。',
  },
  {
    q: '买到普号之后第一件事做什么？',
    a: '发货格式是「账号----密码」，中间四个连字符就是分隔符。到手先做两件事，顺序不能反：第一，去邮箱登录网页 mail.com 确认这个邮箱能正常登录（推荐用 Microsoft Edge 浏览器），邮箱登不上后续 Claude 那边一旦要验证就彻底被动；第二，确认邮箱没问题之后再改密码。充会员之前务必把邮箱这一步走完，不要跳过。',
  },
  {
    q: '有没有 Claude 注册机，能不能批量注册？',
    a: '本站不提供注册机，也不建议你去找。批量工具跑出来的账号在环境特征上高度一致，是风控最容易成片处理的一类，注册当天能用不代表下周还在。如果你需要的只是一个能用的号，买一个在正常家宽环境下注册好的普号，比折腾工具省事得多；如果你需要很多个，请直接联系客服说明用途。',
  },
  {
    q: 'Claude 代充、代注册这类服务靠谱吗，会不会被骗？',
    a: '这个行业里无照个人卖家占多数，判断标准其实就几条：有没有可核验的经营主体、退款与质保规则是不是写在明处、交付的是卡密和账号还是要你先把自己的账号交出去。本站由益阳市赫山区必高科技有限公司运营，价格、库存、累计成交数都是后台实时数据，退款口径写在服务条款里。不放心就先买最便宜的一档验证一次，跑通了再买贵的。',
  },
  {
    q: '注册好的账号被封、或者突然要求身份验证怎么办？',
    a: '被要求做身份验证（KYC）是另一套流程，机会有限、做错一次少一次，先看 Claude KYC 认证那一页再动手。账号被封不在质保范围内——封号通常与账号本身的使用方式、环境稳定性有关，和这一笔交易无关，这条口径下单前请先确认能接受。频繁更换登录 IP 是我们见得最多的一类触发原因，注册用什么环境，之后就尽量固定用什么环境。',
  },
]

export default async function ClaudeZhuceLandingPage() {
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
          // 这一页列的是三个档位，不是单个商品，所以用 ItemList 而不是 Product。
          // Product/Offer 标记留在 /products/[id]——那才是「买家能在上面完成购买」的页面，
          // 也是 Google 对 merchant listing 资格的明确要求。
          // 同理不出 HowTo：Google 2023 年已经把 HowTo 富结果整体下架了。
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
              注册 Claude 这件事，流程本身只有几步，但在中国大陆几乎没人是一次过的。卡住的位置高度集中在三个地方：
              <strong className="text-white/80">手机号验证过不去、网络环境被判定、验证码根本收不到</strong>
              。这三样不是运气问题，每一样都有明确的成因，也有明确的解法。
            </p>
            <p>
              这一页按这三道坎的顺序讲：为什么国内号码和虚拟号在验证这一步走不通、什么是家宽 IP
              以及机房 IP 到底差在哪、收不到码该按什么顺序排查，最后才是「不想自己折腾」的那条路——
              直接买一个在家宽环境下注册好的账号
              {low ? `。本页最低一档 ￥${low.toFixed(0)}。` : '。'}
            </p>
          </>
        }
      >
        <Section id="price" heading="价格与档位">
          <PriceTable
            items={items}
            note={
              <>
                这三档解决的不是同一个问题：验证码是按次消耗的一次性服务，普号是一个已经注册好的账号本身。
                价格、库存、累计成交都是后台实时数据，「补货中」就是当前真的没有，不是话术；
                需要补货提醒可以先{' '}
                <Link href="/support" className="text-purple-400 hover:text-purple-300">
                  联系客服
                </Link>
                。
              </>
            }
          />
        </Section>

        <Section id="three-walls" heading="注册 Claude 会死在哪三个地方">
          <p>
            先把地图摆出来。把「注册不了」拆开，几乎所有情况都落在下面三格里的某一格，
            而且它们有先后顺序——前一格不解决，后面怎么试都是白试。
          </p>

          <div className="overflow-x-auto rounded-2xl border border-white/10 my-6">
            <table className="w-full text-sm lg:text-[15px]">
              <thead>
                <tr className="bg-white/5 text-left text-white/50">
                  <th scope="col" className="px-4 py-3 font-medium">卡在哪</th>
                  <th scope="col" className="px-4 py-3 font-medium">你看到的现象</th>
                  <th scope="col" className="px-4 py-3 font-medium">根因</th>
                  <th scope="col" className="px-4 py-3 font-medium">出口</th>
                </tr>
              </thead>
              <tbody className="text-white/70">
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">① 手机号</td>
                  <td className="px-4 py-3">填了号码提示无效，或者点发送没反应</td>
                  <td className="px-4 py-3">号码归属地与号码类型被拒</td>
                  <td className="px-4 py-3">换一个能收码的境外实体号码</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">② IP 环境</td>
                  <td className="px-4 py-3">页面能打开，但一到注册就失败或注册完很快异常</td>
                  <td className="px-4 py-3">当前出口是机房 IP，段内信誉已被消耗</td>
                  <td className="px-4 py-3">换家宽环境，或直接用家宽注册好的账号</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">③ 验证码</td>
                  <td className="px-4 py-3">提示已发送但一直不到</td>
                  <td className="px-4 py-3">号码类型不对，或短时间内请求过多被限频</td>
                  <td className="px-4 py-3">停手，先换号码类型，别继续点重发</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            顺序很重要。IP 环境不干净的时候，你就算收到了验证码，注册出来的账号也未必稳；
            反过来，环境再好，号码类型不对一样收不到码。所以下面三节按 ①②③ 的顺序讲，
            建议也按这个顺序对一遍自己的情况。
          </p>
        </Section>

        <Section id="phone" heading="第一道坎：手机号验证，为什么虚拟号会被拒">
          <p>
            注册过程里有一步是手机号验证。这一步对号码的要求比大多数人预期的高——它看的不只是
            「这个号码格式对不对」，还看这个号段是谁分配的、历史上被用来注册过多少次。
          </p>

          <SubSection heading="+86 的号码基本走不通">
            <p>
              中国大陆号码在这一步被拒是普遍现象，不是你填错了国家代码。换一张大陆的卡结果一样，
              这条路上没有可以调整的变量，不用在这里浪费时间。
            </p>
          </SubSection>

          <SubSection heading="虚拟号、网络号段同样过不去">
            <p>
              网上那些能免费收短信的在线号码、以及各类 VoIP 号段，属于最容易被识别的一类：
              它们的号段是公开的，被批量用来注册过无数次，风控侧只要按号段判断就能整段拒掉。
              现象通常是点了发送没有任何反应，或者直接提示号码无效。这种情况下再找一个同类型的号码，
              结果不会有任何变化——变量不是「哪一个号」，而是「哪一类号」。
            </p>
          </SubSection>

          <SubSection heading="能过的是实体卡号码">
            <p>
              真正能稳定收到码的是运营商实体卡对应的号码。本站的注册验证码就是这一类，按次卖，
              一次下单对应一次验证，用完这个号码的任务就结束了，它不是你账号的长期绑定号。
            </p>
            <p>
              两个档位的差别在地区与价格：荷兰这一档便宜，商品名里写的是 Netherlands +31，
              <strong className="text-white/80">用的时候在注册页的地区下拉里直接选 Netherlands 就行</strong>
              ，不需要你自己去推算或者手填区号；美区实体卡这一档贵一些，
              商品页写的口径是「包过，不成功不收费，号码有问题请联系客服」。
              实时价格和库存以本页上面的价格表为准。
            </p>
          </SubSection>

          <Warning>
            「单次接码」的意思就是一次，而且
            <strong>号码一旦取出、接码流程已经发起，这张卡密就按已核销处理，退不了</strong>
            （通用口径见{' '}
            <Link href="/terms" className="text-amber-200 underline underline-offset-2">
              服务条款
            </Link>{' '}
            第四节）。号码取出后的有效时间很短，以取号页当时显示的倒计时为准。
            所以<strong>请走到注册页真的需要发验证码的那一步再下单</strong>，不要提前囤着。
            美区实体卡那一档商品页写着「包过，不成功不收费」——这说的是号码本身不可用的情况，
            由客服判定后处理；与「已经取出号码、只是你那边没走完流程」是两回事，
            拿不准就先问客服再下单。具体怎么取号、怎么把收到的码交给你，按商品页与客服给出的说明操作。
          </Warning>
        </Section>

        <Section id="home-ip" heading="第二道坎：家宽 IP 与机房 IP，差别到底在哪">
          <p>
            这是被低估得最厉害的一项。很多人第一反应是「我能正常打开 Claude 的网页，说明我的网络没问题」，
            但浏览和注册是两个完全不同的风控档位：浏览只要不是明显的爬虫就放行，
            注册则要判断「这个新账号大概率是不是垃圾账号」，而 IP 是这个判断里权重很高的一项。
          </p>

          <SubSection heading="家宽 IP 和机房 IP 是两类东西">
            <p>
              家宽 IP，指运营商分配给住宅宽带用户的地址，在 IP 归属信息里它的 ASN 属于电信、联通、
              Comcast 这类面向个人的 ISP。机房 IP 则来自数据中心，ASN 属于各家云服务商。
              绝大多数便宜的共享节点、以及你自己在云上开的 VPS，出口都是机房 IP。
              想确认自己属于哪一类，随便找一个能查 IP 归属与 ASN 的工具看一眼即可：
              ASN 写着云服务商名字的就是机房 IP，写着运营商名字的才是家宽。
            </p>
          </SubSection>

          <SubSection heading="为什么机房 IP 在注册这一步吃亏">
            <p>
              不是因为「机房」这个身份本身有罪，而是因为这些 IP 段的历史太脏。
              一个数据中心的 IP 段上，过去可能已经有成千上万次注册尝试，
              其中相当一部分是批量行为。等到你用这个段去注册第一个账号时，
              这个段的信誉早就被别人消耗完了。共享节点尤其明显——你和另外几百个人共用一个出口，
              别人做过什么你不知道，但后果一起承担。
            </p>
            <p>
              表现出来就是两种：要么注册环节直接失败，要么勉强注册成功，但账号很快就异常，
              或者一登录就被要求做额外验证。后一种更麻烦，因为你已经投入了一个号码和一次时间。
            </p>
          </SubSection>

          <SubSection heading="注册之后，环境要稳定，别来回跳">
            <p>
              这是我们在日常售后里见得最多的一类问题，值得单独说：
              <strong className="text-white/80">频繁变动 IP 是 Claude 封号的常见原因</strong>
              。一个账号今天从美国登录、明天从日本、后天又换成另一个机房出口，
              这种跳变对风控来说是非常强的异常信号——正常人不会每天换一个国家。
            </p>
            <p>
              所以合理的做法是：注册时用什么环境，之后就尽量固定用什么环境。
              不要一会儿用手机流量、一会儿用电脑上的节点、一会儿又换一个新买的节点来回切。
              节点本身的稳定性比它的速度更重要。这一条和你是自己注册还是买的账号无关，都适用。
            </p>
          </SubSection>

          <SubSection heading="不想折腾环境的那条路">
            <p>
              如果你手上只有共享节点，又不想为了注册一个账号专门去搞住宅网络，
              那么直接买一个已经在家宽环境下注册好的普号是更省事的选择——这一档的名字里
              「家宽注册」说的就是这件事。当前是否有货，以上面表格里的库存状态为准。
            </p>
          </SubSection>
        </Section>

        <Section id="no-code" heading="第三道坎：验证码收不到，按这个顺序排查">
          <p>
            收不到码的时候，最没用的动作是反复点「重新发送」。它不会让码更快到达，
            反而会把这个号码、这个 IP 更快推进限制状态。正确的做法是先判断卡在哪一层。
          </p>
          <CheckList
            items={[
              <>
                <strong className="text-white/80">第一步：分清「没发出去」还是「发了没到」</strong>
                。点发送后页面毫无反应、或提示号码无效，属于前者，是号码类型被拒，换同类号码没有意义；
                提示已发送但迟迟不到，属于后者，才有排查空间。
              </>,
              <>
                <strong className="text-white/80">第二步：看这个号码今天被请求过几次</strong>
                。同一个号码短时间内反复请求会触发限频，这时候唯一有效的动作是停下来等，
                而不是继续点。
              </>,
              <>
                <strong className="text-white/80">第三步：看你的出口环境</strong>
                。同一个 IP 上短时间内发起多次注册，即使号码没问题也会被压。
                这一层和上一节讲的是同一件事。
              </>,
              <>
                <strong className="text-white/80">第四步：号码本身有问题就找客服</strong>
                。本站的接码商品里，美区实体卡那一档商品页写的是「包过，不成功不收费，
                号码有问题请联系客服」。属于号码的问题不要自己硬扛，
                <Link href="/support" className="text-purple-400 hover:text-purple-300">
                  客服中心
                </Link>
                在这里。
              </>,
            ]}
          />
          <p className="pt-2">
            另外提醒一句：注册页面上的验证方式如果有多种，别在几种之间来回切换重试。
            每切一次都会留下一条失败记录，失败记录攒多了，本来能过的也过不去了。
          </p>
        </Section>

        <Section id="puhao" heading="买家宽注册的普号：先搞清楚它是什么，再看到手先做什么">
          <p>
            普号这个词在这里的含义很窄，商品描述写得非常直接：
            <strong className="text-white/80">「普通账号，无任何订阅套餐，不懂勿拍」</strong>
            。它就是一个能正常登录的 Claude 账号，额度是免费账号的额度，
            不带 Pro、不带 Max。买它解决的是「我注册不出来」这个问题，不是「我想要会员」这个问题。
          </p>

          <SubSection heading="发货格式与登录方式">
            <p>
              发货格式是 <span className="font-mono text-white/70">账号----密码</span>，
              中间那四个连字符就是分隔符，不是内容的一部分。
              账号对应的邮箱在 <span className="font-mono text-white/70">mail.com</span> 上登录网页版查看，
              商品说明里推荐使用 Microsoft Edge 浏览器打开。
            </p>
          </SubSection>

          <SubSection heading="到手先做两件事，顺序不要反">
            <p>
              第一件事是<strong className="text-white/80">先确认邮箱能正常登录</strong>。
              这一步是商品说明里专门点出来的：充会员之前务必检查邮箱是否能正常登录，
              以免变成死邮箱、后续无法登录 Claude。邮箱是这个账号的命根子——
              一旦 Claude 那边要求邮箱验证而你进不去邮箱，账号就等于废了，
              而这种情况发生在你已经充了会员之后，损失就不只是账号本身。
            </p>
            <p>
              第二件事是<strong className="text-white/80">改密码</strong>。
              确认邮箱没问题之后，第一时间把密码改掉。这两件事都做完，再考虑充会员的事。
            </p>
          </SubSection>

          <SubSection heading="「质保首登」是什么意思">
            <p>
              商品名里带的「质保首登」，字面意思就是质保范围到首次登录成功为止：
              拿到的账号密码登不上，找客服；登上去之后账号怎么用、后续是否稳定，
              那取决于你的使用环境和使用方式，不在质保内。这条边界看着不好看，但它是真话——
              没有人能对一个不在自己手里的账号的长期状态做担保。具体口径以商品页与客服说明为准。
            </p>
          </SubSection>

          <Warning>
            下单前请先确认三件事能接受：
            <strong>账号被封不在质保范围内</strong>；这一档不含任何会员，想要 Pro 得另外充；
            商品描述里那句「不懂勿拍」是认真的——如果你看完这一页还不确定自己需要的是不是它，
            先问客服，别先付款。
          </Warning>
        </Section>

        <Section id="next" heading="注册成功之后：会员怎么充，被弹认证怎么办">
          <p>
            账号到手只是起点。账号本身是免费额度，跑几轮长对话就会碰到限制，
            这时候要做的是在这个账号上充会员——做法、价格和兑换前必须核对的账户状态，
            都在{' '}
            <Link href={landingPath('claude-pro')} className="text-purple-400 hover:text-purple-300">
              Claude Pro 充值
            </Link>{' '}
            那一页；需要更大额度的话看{' '}
            <Link href={landingPath('claude-max')} className="text-purple-400 hover:text-purple-300">
              Claude Max 充值
            </Link>
            。提醒一次：充值之前一定要先把上一节那两件事（验邮箱、改密码）做完。
          </p>
          <p>
            另一种情况是账号在使用中被要求做身份验证。这属于另一套流程，
            材料准备和触发条件都有讲究，而且机会有限、做错一次少一次，
            动手之前先看{' '}
            <Link href={landingPath('claude-kyc')} className="text-purple-400 hover:text-purple-300">
              Claude KYC 认证
            </Link>{' '}
            那一页。
          </p>
          <p>
            如果你同时也在折腾 OpenAI 那边的注册，验证码的逻辑是相通的，
            可以顺带看看{' '}
            <Link href={landingPath('codex-jiema')} className="text-purple-400 hover:text-purple-300">
              Codex 接码
            </Link>
            。
          </p>
        </Section>

        <Section id="steps" heading="从下单到到账">
          <Steps
            steps={[
              {
                title: '先判断你缺的是哪一块',
                body: (
                  <>
                    缺号码就买接码，缺环境就买家宽注册好的普号，三样都缺就直接买普号——
                    它把前两步一起解决了。判断不了就对照本页第二节那张表。
                  </>
                ),
              },
              {
                title: '在价格表里下单',
                body: (
                  <>
                    点进对应商品，用支付宝付款。
                    <strong>这一页的两类商品交付方式不一样</strong>：
                    接码档付款后由系统自动取号，号码和验证码直接显示在订单里，不发卡密；
                    普号档才会发卡密（格式是「账号----密码」），同时发一份到你的账号邮箱。
                  </>
                ),
              },
              {
                title: '拿到卡密或账号',
                body: (
                  <>
                    付款确认后即时发放，可以在{' '}
                    <Link href="/orders" className="text-purple-400 hover:text-purple-300">
                      我的订单
                    </Link>{' '}
                    里看到，同时会发到你的账号邮箱。内容会一直留在订单里，找不到了随时回去看。
                  </>
                ),
              },
              {
                title: '按商品说明使用',
                body: (
                  <>
                    接码：走到注册页需要发送验证码的那一步再用，地区下拉按商品名里写的地区选。
                    普号：先在 mail.com 上验证邮箱能登录，再改密码。
                    卡密类商品的兑换在{' '}
                    <Link href="/orders" className="text-purple-400 hover:text-purple-300">
                      我的订单
                    </Link>
                    ，具体填什么以兑换页的提示为准。
                  </>
                ),
              },
              {
                title: '需要会员再往下走',
                body: (
                  <>
                    账号能正常登录、密码也改好之后，再去{' '}
                    <Link href={landingPath('claude-pro')} className="text-purple-400 hover:text-purple-300">
                      Claude Pro 充值
                    </Link>{' '}
                    这一页。顺序反了容易出问题。
                  </>
                ),
              },
            ]}
          />
          <p className="pt-2 text-sm text-white/40">
            未使用的卡密长期有效、可退；但只要已经被上游核销，无论结果如何都不能退。
            完整的退款与质保口径写在{' '}
            <Link href="/terms" className="text-white/60 underline underline-offset-2 hover:text-white/80">
              服务条款
            </Link>{' '}
            里，下单前值得花两分钟看一遍。
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
