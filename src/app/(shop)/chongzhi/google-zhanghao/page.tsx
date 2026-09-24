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
 * 谷歌账号落地页——这一批页面里唯一一个「账号类商品」页，不是充值页。
 *
 * 【选词依据】2026-09-19 Google 中文下拉建议实测：
 *   · `谷歌邮箱购买` 联想数 **0**。这是个零需求词，而后台商品名
 *     「谷歌邮箱成品号」用的偏偏就是它——商品名一时不动，但对外页面的主词必须换掉。
 *   · `谷歌账号购买` 有真实联想，并且带出三个修饰：`谷歌账号购买网站`、
 *     `谷歌账号购买微信支付`、`谷歌账号购买gemini`。所以 slug 取 google-zhanghao，
 *     正文通篇用「谷歌账号」，「谷歌邮箱」只在解释用词差异的那一小节出现。
 *   · 「谷歌账号购买gemini」这条修饰词是这一页的内容方向：有一批人买号的目的很具体，
 *     就是为了在这个账号上用 Gemini。所以专门写一节讲这件事的边界——
 *     **只写有把握的（账号可用性、地区与政策以谷歌一侧为准），不替谷歌承诺任何功能**。
 *   · 「谷歌账号购买微信支付」这条得如实回答而不是回避：本站收银台只支持支付宝，
 *     没有微信支付。搜这个词的人进来看到的是实话，比看到一句含糊话要好。
 *
 * 【为什么不是 doorway page】Google 判定 doorway 看四条：换域名做变体、批量地域词页、
 * 纯中转页、批量近似页。这一页承载的是一整组同意图查询（成品号是什么 / 发过来什么格式 /
 * 辅助邮箱怎么回事 / 2fa 怎么用 / 到手先做什么 / 质保保到哪 / 能不能开 Gemini），
 * 正文是这个站独有的运营知识——卡密的两种格式与判别方法、到手处置顺序、
 * 质保只到首登的边界、账号类商品与订阅类商品在退款口径上的根本差别。
 * 它进入 /chongzhi 这个可浏览层级，在 hub 页与 footer 都有入口。
 *
 * 【正文里的事实来源】价格、库存、累计成交实时取库；
 * 注册年份区间（2020-2025）、「2FA登录方式」、「质保3天内首登」、
 * 卡密的两种格式与登录方法，全部取自后台商品 24 的名称、description 与 cardUsage，不是编的。
 * 改这个商品的文案时要回来核对这一页。
 *
 * 【刻意没写进页面的东西】商品 cardUsage 里带了两个第三方取码工具的地址。
 * 那属于交付细节，只该出现在订单里，不该出现在公开页面上，所以页面一律写
 * 「按订单里给出的说明操作」。同理不出现任何上游站点的品牌与域名。
 */

const DEF = findLanding('google-zhanghao')

export async function generateMetadata(): Promise<Metadata> {
  const all = await getLandingProducts()
  const items = matchProducts(all, DEF.match)
  const low = lowestPrice(items)
  // 描述里那个价格数字取实时最低价，不写死：这一类商品的成本跟着上游走，
  // SERP 上挂一个早就不对的数字，比没有数字更糟。
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

/**
 * 页面上显示的问答与 FAQPage 结构化数据**共用这一个常量**。
 * 标记页面上看不到的内容是 Google 结构化数据政策明令禁止的，
 * 两边分开维护迟早会漂移，所以从源头上只留一份。
 */
const FAQS: { q: string; a: string }[] = [
  {
    q: '谷歌账号购买，一个多少钱？',
    a: '以本页上方那张价格表为准，它直接取自后台实时数据，不是手写的。在售的是 2020-2025 年注册的成品号，页面上同时显示当前库存和累计成交数。价格会随上游成本浮动，下单时页面显示的实付金额才是最终金额。页面标价是不含税价，需要发票的话见下面关于发票那一条。',
  },
  {
    q: '你们是帮我注册一个新号，还是卖已经注册好的号？',
    a: '卖的是已经注册好的成品号，不是代注册服务。付款之后系统直接把账号信息发给你，中间没有「等我们去给你注册」这个环节，也不需要你提供任何个人资料。反过来说，这个号在到你手上之前就已经存在了一段时间，它的历史不由我们创造，我们能给的信息就是商品名里写的注册年份区间。',
  },
  {
    q: '发过来的是什么格式？怎么登录？',
    a: '发给你的是一串用四个连字符分段的文本，一共四段。前三段固定是 Google 用户名、密码、辅助邮箱；第四段决定你用哪种方式登录——第四段是一个接码入口，就走「辅助邮箱收验证码」那条路；第四段是一串 2fa 字符，就走「动态验证码」那条路。登录时输入账号密码点下一步，按页面提示选择第一个辅助邮箱来接收验证码即可。具体怎么操作以订单里给出的说明为准。',
  },
  {
    q: '「辅助邮箱」是什么？为什么登录还要多这一步？',
    a: '辅助邮箱是这个谷歌账号预先设置好的第二联系方式。谷歌在判断本次登录不是这个账号的常用环境时，会要求你用账号密码之外的另一种方式证明是本人，辅助邮箱就是承接这一步的通道——验证码发到那里，你取出来填回登录页。你是新设备、新网络、新地区，第一次登录被要这一步是正常的，不代表账号有问题。',
  },
  {
    q: '卡密最后一段是 2fa 字符串的那种，怎么用？',
    a: '那一段不是验证码本身，是用来生成动态验证码的种子。需要把它放进支持两步验证的验证码工具里，由工具换算出当前这一刻的 6 位动态码，再填回登录页。动态码会按固定周期滚动，所以要现取现用，不要保存下来下次再填。用哪个工具、怎么填，按订单里给出的说明操作。',
  },
  {
    q: '账号到手第一件事做什么？',
    a: '两件事，顺序不能反：第一，先用拿到的账号密码完整登录一次，确认能进去；第二，确认能登录之后再改密码。顺序反了最常见的后果是——密码改到一半卡在二次验证那一步，原密码已经不能用、新密码又没设成，账号两头不着。这个口径和本站 Claude 普号那一档是一样的：先验证可用性，再动账号设置。',
  },
  {
    q: '「质保 3 天内首登」到底保什么？',
    a: '照商品描述的原话理解就行：质保范围是拿到账号之后 3 天之内的首次登录。这 3 天里你按说明操作却登不上去，找客服处理；超过 3 天才第一次去登，或者已经登录成功之后账号出现的任何状况，都不在这个范围里。它保的是「交付给你的这串信息是可用的」，不是「这个账号以后一直没事」。具体判定以商品页说明与客服口径为准。',
  },
  {
    q: '我买号是为了用 Gemini，可以吗？',
    a: '这个号是一个可以正常登录的谷歌账号，登录之后能用哪些谷歌服务、在你所在的地区有没有限制、有没有额外的开通条件，全部由谷歌自己决定，以他们当时的说明为准——这部分我们既不掌握也不做承诺，请不要把本站的任何说法当作谷歌的政策。我们能负责的只有一件事：交付给你的账号信息在质保范围内可以正常登录。另外提醒一句，如果你要的是谷歌那边的付费订阅，那是在这个账号上另外花钱的事，和买号是两回事，付款环节的要求同样以谷歌一侧为准。',
  },
  {
    q: '登录时被要求做额外验证，或者账号被封了，怎么办？',
    a: '被要求额外验证在首次登录时很常见，按上面讲的辅助邮箱或动态码流程走即可，这本身不是故障。真正的麻烦是账号被判定异常甚至停用——账号类商品的固有风险就在这里，账号被封不在质保范围内，这条下单前请先确认能接受。能降低概率的做法是：登录环境别来回跳，不要今天一个地区明天换一个；到手先按顺序做完验证和改密码；别用它去做任何可能触发风控的批量操作。账号一旦被停用，只能走谷歌自己的账号申诉流程，这一步我们帮不上忙。',
  },
  {
    q: '支持微信支付吗？能开发票吗？',
    a: '本站收银台只支持支付宝，没有微信支付，这一点先说清楚免得你走到最后一步才发现。下单需要先登录本站账号，不用另填邮箱，账号信息会发到你注册时用的那个邮箱，所以要保证它能正常收信。发票可以开：订单完成后在站内申请，支持增值税发票或收据。注意页面标价是不含税价，开发票要在售价之外另付 6% 税费（开票金额 = 售价 × 1.06），收据不涉及税费。',
  },
]

export default async function GoogleZhanghaoLandingPage() {
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
              谷歌账号购买这件事，绝大多数人卡住的不是「去哪买」，而是买回来之后的头十分钟：
              发过来的是一串用连字符分段的文本，看不懂哪一段是什么；登录到一半被要求输验证码，
              不知道该去哪收；或者急着先改密码，结果把自己锁在门外。
              <strong className="text-white/80">这些都不是账号有问题，是没人提前把规则讲清楚。</strong>
            </p>
            <p>
              这一页讲的就是这些：成品号到底是什么、不是什么，两种登录方式（辅助邮箱接码与 2FA
              动态码）怎么分辨、分别怎么走，到手第一件事该做什么、第二件事才是什么，
              「质保 3 天内首登」这句话的边界在哪，以及买号是为了开 Gemini 的话有哪些事得先知道
              {low ? `。当前最低一档 ￥${low.toFixed(0)}。` : '。'}
            </p>
          </>
        }
      >
        <Section id="price" heading="价格与档位">
          <PriceTable
            items={items}
            note={
              <>
                这一档是<strong className="text-white/80">自动发货</strong>：付款确认后账号信息立刻出现在订单里，
                没有「等人工对接」也没有「去兑换页换一次」这两个环节。
                库存是后台实时数字，显示「补货中」就是当前真的没有，不是话术；
                「累计成交」也是真实订单数。需要补货提醒可以先{' '}
                <Link href="/support" className="text-purple-400 hover:text-purple-300">
                  联系客服
                </Link>
                。
              </>
            }
          />
        </Section>

        <Section id="chengpinhao" heading="成品号是什么，以及它不是什么">
          <p>
            「成品号」这个词在这里的含义很窄，值得先框清楚，因为买错预期是这类商品最常见的纠纷来源。
          </p>

          <SubSection heading="它是一个已经存在的账号，不是代注册服务">
            <p>
              你付的钱买的是一串已经可以登录的账号信息，不是「委托我们去帮你注册一个新号」。
              这两件事的区别不只是流程上的——代注册意味着账号是按你的信息新建的，
              而成品号的历史在到你手上之前就已经发生了。我们能提供的关于这段历史的信息，
              就是商品名里标出来的注册年份区间（2020-2025 年注册），除此之外的细节我们也不掌握，
              不会替它编一个故事。
            </p>
            <p>
              同样地，我们不会说「老号一定更稳」。一个账号在谷歌那边是什么状态，
              由谷歌的判定决定，不由注册年份决定，也不由卖家的说法决定。
              把注册年份写在商品名里是因为它是一项客观信息，不是因为它是一项承诺。
            </p>
          </SubSection>

          <SubSection heading="它不附带任何付费服务">
            <p>
              买到的是账号本身。谷歌那边任何需要付费才能用的东西，都不包含在这一单里，
              也不会因为买了这个号就自动获得。如果你的目标是某项付费服务，
              那是在拿到账号之后另外要处理的事，和这一笔交易是两件事。
            </p>
          </SubSection>

          <SubSection heading="顺带解释一句：为什么这一页叫「谷歌账号」而不是「谷歌邮箱」">
            <p>
              后台的商品名写的是「谷歌邮箱成品号」，但这一页通篇用的是「谷歌账号」。
              原因很实际：我们在 2026 年 9 月实测过 Google 的中文下拉建议，
              <strong className="text-white/80">「谷歌邮箱购买」这个说法几乎没有人在搜</strong>
              ，而「谷歌账号购买」是有真实搜索量的。更重要的是，「邮箱」这个词会让人以为
              买到的只是一个收发邮件的地址——实际上你拿到的是一个谷歌账号，
              邮箱只是它附带的一项服务。用「账号」这个词，描述得更准确。
            </p>
          </SubSection>
        </Section>

        <Section id="login" heading="两种登录方式：辅助邮箱接码，还是 2FA 动态码">
          <p>
            这是整页最要紧的一节。发货内容是一串用
            <span className="font-mono text-white/70"> ---- </span>
            （四个连字符）分段的文本，一共四段。
            <strong className="text-white/80">前三段固定，第四段决定你走哪条登录路径</strong>
            ——先看清楚第四段是什么，再动手登录。
          </p>

          <div className="overflow-x-auto rounded-2xl border border-white/10 my-6">
            <table className="w-full text-sm lg:text-[15px]">
              <thead>
                <tr className="bg-white/5 text-left text-white/50">
                  <th scope="col" className="px-4 py-3 font-medium">对比项</th>
                  <th scope="col" className="px-4 py-3 font-medium">辅助邮箱接码</th>
                  <th scope="col" className="px-4 py-3 font-medium">2FA 动态码</th>
                </tr>
              </thead>
              <tbody className="text-white/70">
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">卡密格式</td>
                  <td className="px-4 py-3 font-mono text-[13px] leading-relaxed">
                    用户名----密码----辅助邮箱----辅助邮箱接码平台
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px] leading-relaxed">
                    用户名----密码----辅助邮箱----2fa
                  </td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">第四段是什么</td>
                  <td className="px-4 py-3">一个用来收辅助邮箱来信的入口</td>
                  <td className="px-4 py-3">一串用来生成动态码的字符</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">验证码从哪来</td>
                  <td className="px-4 py-3">谷歌发到辅助邮箱，你去那个入口里取</td>
                  <td className="px-4 py-3">不用等谷歌发，由工具按那串字符实时算出来</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">时效</td>
                  <td className="px-4 py-3">收到的验证码有有效期，过期要重新触发</td>
                  <td className="px-4 py-3">动态码按固定周期滚动，必须现取现填</td>
                </tr>
                <tr className="border-t border-white/5">
                  <td className="px-4 py-3 text-white/50">最容易出的错</td>
                  <td className="px-4 py-3">在登录页选错了验证方式，码发去了别的地方</td>
                  <td className="px-4 py-3">把那串字符本身当成验证码直接填进去</td>
                </tr>
              </tbody>
            </table>
          </div>

          <SubSection heading="辅助邮箱这一条路怎么走">
            <p>
              在登录页输入用户名和密码，点下一步。谷歌会让你选一种方式来完成额外验证——
              <strong className="text-white/80">选第一个辅助邮箱那一项</strong>
              ，让验证码发到卡密里第三段那个地址。然后到第四段给出的入口里把这封信收出来，
              把码填回登录页即可。整个过程就是「让谷歌把码发到一个你能打开的信箱，再取出来」。
            </p>
            <p>
              这里最常见的失手是选错验证方式：登录页有时会同时列出好几种选项，
              顺手点了别的那一项，码就发去了一个你打不开的地方，还得退回来重来。
              退回来重来本身不致命，但同一账号短时间内反复触发验证会让后面更难走，
              所以第一次就看清楚再点。
            </p>
          </SubSection>

          <SubSection heading="2FA 这一条路怎么走">
            <p>
              如果第四段是一串 2fa 字符，那它
              <strong className="text-white/80">不是验证码本身，而是用来生成验证码的种子</strong>
              。把这串字符放进支持两步验证的验证码工具里，工具会算出当前这一刻的 6 位动态码，
              把动态码填回登录页。动态码每隔一小段时间就换一次，
              所以要在填写前的那一刻取，不要提前截图保存下来下次再用。
            </p>
            <p>
              具体用哪个工具、怎么把那串字符导进去，按订单里给出的说明操作。
              这部分属于交付细节，我们不在公开页面上写死——工具会变，
              写在页面上迟早变成过时的错误指引。
            </p>
          </SubSection>

          <SubSection heading="为什么会有「辅助邮箱」这一环">
            <p>
              很多人第一次买成品号会疑惑：有账号和密码了，为什么还要多一个邮箱？
              因为谷歌在判断这次登录不是这个账号的常用环境时，会要求你在密码之外
              再提供一重证明——新设备、新网络、新的地理位置，都会触发这一步。
              成品号从卖家手里换到你手里，环境必然发生变化，所以
              <strong className="text-white/80">第一次登录被要求额外验证是预期之内的，不是账号有问题</strong>
              。辅助邮箱就是为了让你能顺利过掉这一步而预先配置好的通道，
              它是交付内容的一部分，不是多余的东西。
            </p>
          </SubSection>

          <Warning>
            收到账号信息之后，
            <strong>先把整串内容原样留一份在手边再开始操作</strong>
            ，尤其是第三、第四段。不少人登录成功之后顺手把这些「用不上的东西」清掉，
            结果下次换设备登录又被要求验证，那时候辅助邮箱信息已经找不到了。
            内容会一直留在你的{' '}
            <Link href="/orders" className="text-amber-200 underline underline-offset-2">
              订单
            </Link>{' '}
            里，随时可以回去看——但养成先留底的习惯，比每次回去翻要省事。
          </Warning>
        </Section>

        <Section id="first-steps" heading="到手第一件事：先确认能登录，再改密码">
          <p>
            顺序很重要，反过来做是这类商品最常见的自伤方式。本站在 Claude 普号那一档用的是同一个口径，
            道理是一样的：
            <strong className="text-white/80">先验证交付物可用，再动账号设置。</strong>
          </p>

          <SubSection heading="第一步：完整登录一次">
            <p>
              用拿到的用户名和密码走完整个登录流程，包括上面讲的那一重额外验证，
              一直走到真的进入账号为止。中途被要求验证是正常的，按对应方式过掉即可。
              这一步的意义是确认「交付给你的这串信息确实能用」——
              这也正是质保覆盖的那件事，所以要尽早做，别拖。
            </p>
          </SubSection>

          <SubSection heading="第二步：确认能进去之后，再改密码">
            <p>
              登录成功、确认账号能正常使用之后，第一时间把密码改掉。
              这一步是为了让这个账号从此只有你能进。
            </p>
            <p>
              为什么不能先改？因为改密码这个动作本身通常也需要过一次验证，
              而你还没确认自己能不能顺利过那一关。万一卡在中间，旧密码可能已经失效、
              新密码又没设置成功，账号就两头不着，本来只是一次简单操作，
              变成要走申诉流程。先登录、后改密码，这个顺序能把这种情况整个避掉。
            </p>
          </SubSection>

          <SubSection heading="第三步：把辅助邮箱与验证方式的信息收好">
            <p>
              改完密码不代表辅助邮箱就没用了。以后换设备、换网络登录，
              同样可能再被要求验证一次。所以卡密里的第三、第四段要留着，
              别因为「已经登进去了」就当垃圾清掉。
            </p>
          </SubSection>
        </Section>

        <Section id="warranty" heading="「质保 3 天内首登」到底保什么">
          <p>
            商品描述里的原话是
            <strong className="text-white/80">「质保 3 天内首登」</strong>
            。这句话短，容易被两头误读，所以按字面拆一遍：
          </p>
          <CheckList
            items={[
              <>
                <strong className="text-white/80">保的是「首次登录」这一件事</strong>
                ：交付给你的账号信息，你按说明操作却登不上去，属于质保范围，找客服处理。
              </>,
              <>
                <strong className="text-white/80">时限是拿到之后 3 天</strong>
                ：这 3 天是留给你去验证的窗口期。所以别买回来先放着，
                空出十分钟当天就把登录跑通，这是对你自己最有利的做法。
              </>,
              <>
                <strong className="text-white/80">登录成功之后的事不在这个范围里</strong>
                ：账号后续是否稳定、会不会被要求进一步验证、会不会被限制，
                取决于你的使用方式与使用环境，这些我们无法担保，也没有人能担保一个不在自己手里的账号。
              </>,
              <>
                <strong className="text-white/80">账号被封不质保</strong>
                ：这是账号类商品的通行口径，也写在{' '}
                <Link href="/terms" className="text-purple-400 hover:text-purple-300">
                  服务条款
                </Link>{' '}
                里。下单前请先确认能接受这一条。
              </>,
            ]}
          />
          <p className="pt-2">
            我们不打算把这句话解释得比它本身更宽，也不会解释得比它更窄。
            以上是对商品描述原话的拆解，真正的判定以商品页说明与客服口径为准；
            拿不准自己的情况算不算，先{' '}
            <Link href="/support" className="text-purple-400 hover:text-purple-300">
              问客服
            </Link>
            ，别先猜。
          </p>

          <SubSection heading="顺便说清楚：这一档和充值类商品的退款口径不一样">
            <p>
              站内大部分商品是会员充值，那一类的口径是「订阅期内非因你自身原因掉订阅，
              扣掉已用天数、按剩余未使用天数折算退款」。
              <strong className="text-white/80">那套口径在这一页不适用</strong>
              ——你买的不是一段订阅时长，而是一个账号本身，不存在「剩余天数」这个东西。
              这一档的边界就是上面那四条。另外，「未使用卡密永久有效」这句话
              是本站 Claude Pro 那一档商品页上写的，只对那一档成立，不要当成全站承诺；
              这一页的商品以其商品页说明为准。
            </p>
          </SubSection>
        </Section>

        <Section id="gemini" heading="买号是为了开 Gemini：先把边界说清楚">
          <p>
            搜「谷歌账号购买」的人里有一批目的很明确——手上没有谷歌账号，
            想拿一个来用谷歌那边的 AI 服务。这一节专门讲这件事，而且要先讲不能讲的部分。
          </p>

          <SubSection heading="我们能负责的，和不能负责的">
            <p>
              我们能负责的只有一件事：
              <strong className="text-white/80">交付给你的账号信息在质保范围内可以正常登录。</strong>
            </p>
            <p>
              我们不能负责的是：这个账号登录之后能用哪些谷歌服务、在你所在的地区有没有限制、
              有没有额外的开通条件或资格要求、以后会不会变。这些全部由谷歌自己决定，
              以他们当时的说明为准。
              <strong className="text-white/80">请不要把本站的任何说法当成谷歌的政策</strong>
              ——我们既不掌握也不代表他们，写一句「保证可以用」是最容易做的事，
              也是最不负责任的事。
            </p>
          </SubSection>

          <SubSection heading="如果你要的是付费服务，那是另一笔开销">
            <p>
              谷歌那边需要另外付费才能用的东西，不包含在这一单里。买号解决的是
              「我没有一个可登录的谷歌账号」这个问题，不是「我想要某项付费服务」这个问题。
              付费环节需要什么条件、支持什么付款方式，同样以谷歌一侧的要求为准，这一步我们帮不上忙。
            </p>
          </SubSection>

          <SubSection heading="真正值得你提前想清楚的一件事">
            <p>
              如果这个账号会承载对你重要的内容，那么它的长期稳定性就比省下的那点钱更要紧。
              成品号的优势是便宜、立刻能用、不用折腾注册环节；
              代价是它的历史不由你掌握，而且账号类商品天然没有长期担保。
              拿它来做探索、试用、临时用途，是合适的；
              拿它去承载你不能丢的东西，请先掂量一下这个取舍再下单。
            </p>
          </SubSection>
        </Section>

        <Section id="risk" heading="风险要说实话：这一单的边界在哪">
          <p>
            账号类商品有一些绕不开的固有风险。把它们写出来不是为了免责，
            是因为你在下单前就该知道——知道了还买，和不知道就买，是两回事。
          </p>

          <SubSection heading="账号可能被判定异常">
            <p>
              谷歌有自己的一套判定机制，什么情况下会要求二次验证、什么情况下会限制甚至停用账号，
              规则不公开，我们也无从得知。已知会明显提高概率的行为包括：
              登录地点频繁跳变（今天一个地区、明天换一个）、
              在同一环境下集中操作大量账号、用它去做批量或自动化的动作。
              反过来，登录环境保持稳定、把这个号当成一个正常人的账号来用，是最朴素也最有效的做法。
            </p>
            <p>
              这条经验来自本站在其他账号类商品上的日常售后，不是谷歌公布的规则。
              我们把它写出来是因为它对你有用，但它是经验，不是保证。
            </p>
          </SubSection>

          <SubSection heading="被停用之后我们帮不上忙">
            <p>
              账号一旦被停用，恢复只能走谷歌自己的账号申诉流程，卖家在这件事上没有任何特权，
              也不掌握任何后台。这就是「封号不质保」这条口径背后的真实原因——
              不是我们不想管，是这件事在物理上就不在我们的能力范围内。
            </p>
          </SubSection>

          <SubSection heading="本站这一侧能做到的">
            <p>
              有经营主体可核验（益阳市赫山区必高科技有限公司），能开增值税发票；
              价格、库存、累计成交数全部是后台实时数据，不是摆着看的装饰；
              质保与退款口径写在明处，好看不好看都照实写。
              不放心的话，这一档本身就是站内最便宜的商品之一，先买一个验证一次流程，
              跑通了再考虑别的。
            </p>
          </SubSection>
        </Section>

        <Section id="steps" heading="从下单到到手">
          <Steps
            steps={[
              {
                title: '先登录本站，再下单',
                body: (
                  <>
                    下单需要先登录本站账号，页面上不需要你另外填邮箱——
                    <strong>账号信息会发到你注册本站时用的那个邮箱</strong>
                    ，所以要确认它能正常收信。收银台
                    <strong>只支持支付宝</strong>
                    ，没有微信支付，这一点先知道免得走到最后一步才发现。
                  </>
                ),
              },
              {
                title: '付款后即时收到账号信息',
                body: (
                  <>
                    这一档是自动发货，付款确认后立刻发放，可以在{' '}
                    <Link href="/orders" className="text-purple-400 hover:text-purple-300">
                      我的订单
                    </Link>{' '}
                    里看到，同时发一份到你的账号邮箱。内容会一直留在订单里，找不到了随时回去看。
                    （站内一共三种交付方式：自动发卡密、付款后由服务端自动取号、人工对接。
                    这一档是第一种。）
                  </>
                ),
              },
              {
                title: '看清四段内容，判断走哪种登录方式',
                body: (
                  <>
                    用四个连字符分段，前三段是用户名、密码、辅助邮箱，
                    <strong>第四段决定登录路径</strong>：是接码入口就走辅助邮箱收码，
                    是一串 2fa 字符就走动态码。分不清就对照本页「两种登录方式」那张表。
                  </>
                ),
              },
              {
                title: '当天就把首次登录跑通',
                body: (
                  <>
                    质保只覆盖 3 天内的首次登录，所以别买回来先放着。
                    登录中被要求额外验证是正常的，按对应方式过掉即可。
                  </>
                ),
              },
              {
                title: '确认能用之后再改密码',
                body: <>顺序不要反，理由见本页「到手第一件事」那一节。改完密码，辅助邮箱信息继续留着。</>,
              },
            ]}
          />
          <p className="pt-2 text-sm text-white/40">
            需要发票的话，订单完成后在站内申请即可。页面标价是不含税价，
            开发票要在售价之外另付 6% 税费（开票金额 = 售价 × 1.06），收据不涉及税费。
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
            ，或加客服微信 <span className="font-mono text-white/60">GenuineMarxist</span>
            。需要在这个账号之外再配 AI 会员的话，可以看{' '}
            <Link href={landingPath('chatgpt-plus')} className="text-purple-400 hover:text-purple-300">
              ChatGPT Plus 充值
            </Link>{' '}
            或{' '}
            <Link href={landingPath('claude-pro')} className="text-purple-400 hover:text-purple-300">
              Claude Pro 充值
            </Link>
            。
          </p>
        </Section>

        <RelatedLandings currentSlug={DEF.slug} />
        <BrandDisclaimer />
      </LandingShell>
    </>
  )
}
