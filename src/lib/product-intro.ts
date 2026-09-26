/**
 * 商品详情页「商品介绍」区的内容装配。纯函数：不连库、不依赖 React，
 * scripts/check-product-intro.ts 直接拿它跑断言。
 *
 * 【为什么要有这一块】商品页是全站最薄的一类页面（/products/16 可见正文 802 字符，
 * 其中约 450 是导航页脚），而它恰恰是买家真正下单、Product/Offer 结构化数据所在的那一页。
 * 落地页（/chongzhi/*）写得很厚，但商品页上一个指向它的链接都没有。
 *
 * 【这里的每一句话都必须能在代码或商品数据里找到出处】写法上三条硬约束：
 *   1. **按交付方式分口径**。AUTO 发卡密；SMS 付款后服务端自动取号、全程没有卡密；
 *      MANUAL 是客服对接、同样没有卡密。三种交付对同一句「付款后即时发卡」
 *      有三种真假，这类错误在旧版商品页上对全部商品无条件渲染过。
 *      出处：lib/vmq.ts fulfillOrder（发卡 / 卡池不足转「处理中」/ SMS 取号）、
 *      lib/sms.ts（换号、超时标记待退款）、components/order-sms.tsx（买家看到的措辞）、
 *      lib/mail.ts sendOrderPaidEmail（邮件发到账号邮箱）、orders 页的「发货详情」
 *      「去充值 / 兑换」「与客服在线沟通」三个按钮。
 *   2. **落地页相关的说法只从对应落地页搬**（那 9 页是逐条对过商品文案重写的），
 *      并且只搬对这一页匹配到的**全部**商品都成立的句子；
 *      只对个别档位成立的事实（如某一档的前提条件）留给商品自己的 description 去说。
 *   3. **绝不渲染 Product.cardUsage**。那是内部发货说明（含「封号99%」这类会被 LLM
 *      误读的原话），第二十八节审计明确叫停。这个模块的输入类型里根本没有这个字段。
 *
 * 【措辞】不写「官方」二字（哪怕是「被官方封禁」），用 OpenAI / Anthropic / xAI 直呼其名：
 * 全站约定是不出现任何可能被读成「官方授权/官方渠道」的字眼。
 * 不写「10 分钟」这类时效承诺，不写微信支付，不写下单要填邮箱。
 *
 * 【改这里之前】改了落地页 FAQ、改了商品档位、改了交付流程，都要回来核对这一份，
 * 然后跑 npx tsx scripts/check-product-intro.ts。
 */
import {
  CHATGPT_ANNUAL_MATCH,
  LANDINGS,
  findLanding,
  inStock,
  landingPath,
  matchProducts,
  type LandingDef,
  type LandingSlug,
  type ProductMatch,
} from './landing/registry'
// 税点只认 lib/invoice.ts 这一处。那个文件 import 了 node:crypto，
// 所以本模块只能在服务端（Server Component / 脚本）用，别拿到客户端组件里 import
import { TAX_RATE } from './invoice'
import { PLATFORM_CONTACT, type StoreContact } from './contact-base'

// ============ 输入输出 ============

export type DeliveryKind = 'AUTO' | 'SMS' | 'MANUAL'

/** 与 components/products/gradient.ts deliveryBadge 同一口径：认不出来的一律按人工交付 */
export function deliveryKind(t: string | null | undefined): DeliveryKind {
  if (t === 'AUTO') return 'AUTO'
  if (t === 'SMS') return 'SMS'
  return 'MANUAL'
}

/**
 * 装配只需要这几个字段。刻意不收 description（首屏已显示）和 cardUsage（绝不能进正文，
 * 理由见文件头）——类型上就收不进来，比在渲染时记得过滤可靠。
 */
export interface IntroProduct {
  id: number
  name: string
  categoryName?: string | null
  deliveryType?: string | null
}

/** 同系列档位用的在售商品快照（lib/landing/products.ts getLandingProducts 的子集） */
export interface IntroCatalogItem {
  id: number
  name: string
  price: number
  stock: number
  categoryName: string | null
}

export interface IntroFaq {
  q: string
  a: string
}

export interface IntroStep {
  title: string
  body: string
}

export interface IntroSibling {
  id: number
  name: string
  price: number
  inStock: boolean
}

export interface ProductIntro {
  delivery: DeliveryKind
  /** 匹配到的落地页；direct=false 表示是兜底归类（如年费档），落地页里的档位说法不套用 */
  landing: { slug: LandingSlug; navLabel: string; direct: boolean } | null
  /**
   * 商品说明：按落地页写的「这一类商品是什么、怎么交付」。
   * 商品自己的 description 已经在页面首屏（H1 下面）显示过，这里不再重复一遍——
   * 同一段话在一页里出现两次，对读者是噪音，对搜索引擎是重复内容。
   * 兜底归类或没有落地页的商品为 null，这一节不渲染。
   */
  about: string | null
  deliveryPoints: string[]
  steps: IntroStep[]
  pricing: string[]
  notices: string[]
  siblings: IntroSibling[]
  faqs: IntroFaq[]
  /** 「完整购买指南：xxx →」 */
  guide: { href: string; label: string } | null
}

// ============ 商品 → 落地页 ============

/**
 * 主规则匹配不到时的兜底归类。只放「落地页刻意排除、但确实属于那一页话题」的商品：
 * 年费档被 Plus 页的 nameNone:['年费'] 排除在价格表外，但 Plus 页价格说明里单独链着它。
 */
const FALLBACK_LANDINGS: { match: ProductMatch; slug: LandingSlug }[] = [
  { match: CHATGPT_ANNUAL_MATCH, slug: 'chatgpt-plus' },
]

/** 落地页价格表之外、但属于同一系列的商品（出现在「同系列其他档位」里） */
const EXTRA_SIBLINGS: Partial<Record<LandingSlug, ProductMatch>> = {
  'chatgpt-plus': CHATGPT_ANNUAL_MATCH,
}

function asMatchable(p: { name: string; categoryName?: string | null }) {
  return { name: p.name, categoryName: p.categoryName ?? null }
}

/**
 * 商品归属哪个落地页。按注册表顺序取第一个命中的，规则与落地页价格表完全同一套
 * （matchProducts，trim + 忽略大小写），所以「落地页表里有它」与「它链回那个落地页」永远一致。
 */
export function landingForProduct(p: {
  name: string
  categoryName?: string | null
}): { def: LandingDef; direct: boolean } | null {
  const m = [asMatchable(p)]
  const hit = LANDINGS.find((l) => matchProducts(m, l.match).length > 0)
  if (hit) return { def: hit, direct: true }
  const fb = FALLBACK_LANDINGS.find((f) => matchProducts(m, f.match).length > 0)
  if (fb) return { def: findLanding(fb.slug), direct: false }
  return null
}

// ============ features ============

/**
 * 商品 features 字段的解析（TEXT 列里存 JSON 字符串数组）。
 *
 * 【只保留字符串】原来的写法是「是数组就原样返回」：后台有人填进 [{"title":"x"}]，
 * 渲染时就是「Objects are not valid as a React child」——SSR 直接 500。
 * 现在非字符串项一律丢掉，首尾空白去掉，空串也丢掉。
 * （product-client.tsx 是客户端组件，不能 import 本文件——本文件依赖 lib/invoice.ts 的 node:crypto——
 *   那边有一份同口径的本地实现，改这里要一起改。）
 */
export function parseFeatures(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((x): x is string => typeof x === 'string')
      .map((s) => s.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

/**
 * 后台保存商品时 features 的合法性：null / 空串 / JSON 字符串数组。
 * 放在这里而不是 route.ts：route.ts 只能导出 HTTP handler，而新建、编辑两个接口要用同一条规则。
 */
export function isFeaturesJson(raw: string | null | undefined): boolean {
  if (raw == null || raw.trim() === '') return true
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')
  } catch {
    return false
  }
}

export const FEATURES_FORMAT_ERROR = '商品特性需为 JSON 字符串数组，例如 ["特性1","特性2"]，不需要可留空'

// ============ 通用口径（按交付方式） ============

const TAX_PERCENT = `${Math.round(TAX_RATE * 100)}%`

/*
 * 【客服信息按店面取（二期改动 4.2）】原来这里写死客服微信号与服务时间两个常量，渠道站的商品介绍会把主站客服微信写进服务端 HTML。
 * 现在由 buildProductIntro 的第三个参数传入当前店面的 contact（主站 = PLATFORM_CONTACT，拼出来的句子与原来逐字相同；
 * scripts/itest-tenant/mods-p3.ts 对比）。渠道可能只设了二维码（wechat=null）：句子里不写出空的微信号，
 * 退回「加客服微信对接」这类不带号码的说法。服务时间与 products 列表页底部、商品页「客服时间」同一口径（同一个值）。
 */

/** 「加客服微信 X 对接」里「对接」前面那半句：有微信号带上号码（号码两侧留空格，与原文一致），没有就只说「加客服微信」 */
function wechatAdd(c: StoreContact): string {
  return c.wechat ? `加客服微信 ${c.wechat} ` : '加客服微信'
}

/**
 * AUTO 商品到手之后怎么用：
 *   redeem  卡密 + 订单里的「去充值 / 兑换」跳兑换页（会员充值类）
 *   account 发的是账号信息本身（谷歌成品号、普号）
 *   generic 没匹配到落地页，只说「按订单里的说明」
 */
type AutoUse = 'redeem' | 'account' | 'generic'

function deliveryPoints(d: DeliveryKind, use: AutoUse, c: StoreContact): string[] {
  if (d === 'SMS') {
    return [
      '短信接码，不发卡密：付款到账后，系统自动为这一单取一个手机号，号码一取出就开始计时。',
      '号码、倒计时和收到的验证码都显示在「我的订单」这一单的「发货详情」里，页面会自动刷新，不用反复进出。',
      '收不到验证码可以在订单里点「换一个号」重试（次数有限）；等到超时仍未收到的，系统会取消这个号码并把订单标记为退款处理，联系客服即可。取号失败同样由客服处理。',
    ]
  }
  if (d === 'MANUAL') {
    return [
      '人工服务，不发卡密：付款后订单进入「处理中」，需要你在「我的订单」里点「与客服在线沟通」，或加客服微信对接。',
      '处理完成后，结果写在这一单的「发货详情」里，并发邮件到你登录本站所用的账号邮箱。',
      c.hours ? `具体时效以本商品说明为准；客服时间 ${c.hours}。` : '具体时效以本商品说明为准。',
    ]
  }
  const what = use === 'account' ? '账号信息' : '卡密'
  const last =
    use === 'redeem'
      ? '兑换由你自己发起：「去充值 / 兑换」按钮在「我的订单」这一单上，不在商品页。卡密会一直留在订单里，随时可以回去复制。'
      : use === 'account'
        ? '账号信息会一直留在订单里，随时可以回去查看。'
        : '卡密会一直留在订单里，按订单里给出的使用说明操作即可。'
  return [
    `自动发货：付款到账后，系统自动把${what}发到这一单的「发货详情」里，同时发一份到你登录本站所用的账号邮箱。`,
    '卡池不足时订单会显示「处理中」，由人工补发，补发后同样在订单里查看。',
    last,
  ]
}

function steps(d: DeliveryKind, use: AutoUse, c: StoreContact): IntroStep[] {
  const pay: IntroStep = {
    title: '登录并用支付宝付款',
    body: '登录本站账号后点「立即购买」，收银台只支持支付宝。需要发票的可以在结算时勾选随单开具。',
  }
  if (d === 'SMS') {
    return [
      {
        title: '先把要验证的页面准备好',
        body: '在需要手机验证的网站把流程走到「输入手机号」那一步，再回来下单——付款后系统会立即取号并开始计时。',
      },
      pay,
      {
        title: '在订单里查看号码',
        body: '到「我的订单」打开这一单的「发货详情」，号码和倒计时显示在「短信接码」一栏。',
      },
      {
        title: '填号码、等验证码',
        body: '把号码填进验证页面并触发发送，验证码到达后会显示在同一位置。收不到可以换号重试，不要在验证页面上反复点重新发送。',
      },
    ]
  }
  if (d === 'MANUAL') {
    return [
      {
        title: '下单前先确认',
        body: '人工服务的前提因账号而异，拿不准的话先联系客服描述情况，再决定要不要下单。',
      },
      pay,
      {
        title: '付款后主动联系客服',
        body: `订单会停在「处理中」，在「我的订单」里点「与客服在线沟通」，或${wechatAdd(c)}对接。这一项不发卡密，不用在订单里等兑换码。`,
      },
      {
        title: '按指引配合完成',
        body: '按客服的指引配合完成，结果写在这一单的「发货详情」里，并邮件通知你。',
      },
    ]
  }
  const choose: IntroStep = {
    title: '选对档位',
    body: '同系列有多个档位时，先对照下面的「同系列其他档位」和本页说明确认选对了，再点「立即购买」。',
  }
  if (use === 'account') {
    return [
      choose,
      pay,
      {
        title: '在订单里拿到账号信息',
        body: '付款到账后，到「我的订单」打开这一单的「发货详情」查看账号信息，同时会发到你的账号邮箱。',
      },
      {
        title: '先登录验证，再改密码',
        body: '按订单里的说明尽早完成首次登录，确认能进去之后再改密码，顺序不要反。',
      },
    ]
  }
  return [
    choose,
    pay,
    {
      title: '在订单里拿到卡密',
      body: '付款到账后，到「我的订单」打开这一单的「发货详情」查看卡密，同时会发到你的账号邮箱。',
    },
    use === 'redeem'
      ? {
          title: '核对账号状态后兑换',
          body: '先按下面的「购买须知」核对账号状态，再点这一单上的「去充值 / 兑换」跳到兑换页，粘贴卡密并按页面提示完成。处理中不要重复提交。',
        }
      : {
          title: '按说明使用',
          body: '按订单「发货详情」里给出的使用说明操作，拿不准的地方先问客服。',
        },
  ]
}

function pricing(): string[] {
  return [
    '页面标价为不含税价。价格随上游成本浮动，以下单时页面显示的实付金额为准。',
    `需要增值税发票：可以在结算时勾选「同时开具增值税发票」，税费按货款的 ${TAX_PERCENT} 随货款一起支付（票面金额 = 商品金额 × ${(1 + TAX_RATE).toFixed(2)}）；也可以付款后在「我的订单」里单独申请。收据不涉及税费。`,
    '收银台只支持支付宝，下单需要先登录本站账号。',
  ]
}

function genericNotices(d: DeliveryKind, use: AutoUse, c: StoreContact): string[] {
  const out: string[] = []
  if (d === 'AUTO' && use !== 'account') {
    // 服务条款第四节原话的口径：未使用可退、已核销不退
    out.push('卡密一旦提交兑换、被上游核销，无论充值结果如何都不退；未使用的卡密可按服务条款申请退款。')
  }
  out.push('退款与质保以本商品说明和服务条款为准。')
  // 主站：「客服时间 9:00-22:00，微信 GenuineMarxist；…」（与原文逐字相同）；渠道按实际有的项拼，客服邮箱有就带上
  const ways = [c.hours ? `客服时间 ${c.hours}` : '', c.wechat ? `微信 ${c.wechat}` : '', c.email ? `客服邮箱 ${c.email}` : ''].filter(Boolean)
  out.push(ways.length ? `${ways.join('，')}；拿不准的情况先问再下单。` : '拿不准的情况先问客服再下单。')
  return out
}

function genericFaqs(d: DeliveryKind, use: AutoUse, c: StoreContact): IntroFaq[] {
  const invoice: IntroFaq = {
    q: '可以开发票吗？',
    a: `可以。页面标价是不含税价：结算时勾选「同时开具增值税发票」，税费按货款的 ${TAX_PERCENT} 随货款一起支付；也可以付款后在「我的订单」里单独申请。支持增值税发票与收据，收据不涉及税费。`,
  }
  if (d === 'SMS') {
    return [
      {
        q: '收不到验证码怎么办？钱退不退？',
        a: '号码显示在订单里之后，如果迟迟收不到验证码，可以在订单里点「换一个号」重试（次数有限，两次之间要间隔一段时间）。一直等到超时仍未收到的，系统会取消这个号码并把订单标记为退款处理，联系客服即可；取号失败同样由客服处理。',
      },
      invoice,
    ]
  }
  if (d === 'MANUAL') {
    return [
      {
        q: '付款之后要做什么？多久能处理？',
        a: `这一项是人工服务，不发卡密。付款后请尽快在「我的订单」里点「与客服在线沟通」，或${wechatAdd(c)}对接；具体时效以商品说明为准${c.hours ? `，客服时间 ${c.hours}` : ''}。`,
      },
      invoice,
    ]
  }
  return [
    {
      q: use === 'account' ? '付完款多久能拿到账号？' : '付完款多久能拿到卡密？',
      a: `卡池正常时付款到账后自动发放，在「我的订单」这一单的「发货详情」里能看到，同时发到你登录本站所用的账号邮箱。卡池不足时订单会显示「处理中」，由人工补发。${
        use === 'redeem' ? '兑换动作由你自己发起，兑换页显示处理中就等它跑完，不要重复提交。' : ''
      }`,
    },
    invoice,
  ]
}

/** 没有匹配到落地页时，FAQ 至少要凑够 3 条有用的，不拿空话凑 */
function unmatchedExtraFaq(d: DeliveryKind): IntroFaq {
  if (d === 'SMS') {
    return {
      q: '这个号码以后还能用来登录或者做二次验证吗？',
      a: '不要这么用。接码只保证这一次能收到验证码，号码不属于你，之后落到谁手里、还会不会给你转发短信，都不在你的控制范围内。需要长期可用的号码，请先联系客服说明用途。',
    }
  }
  if (d === 'MANUAL') {
    return {
      q: '这一项会有兑换码吗？',
      a: '没有，也不发卡密。人工服务付款后订单停在「处理中」，由客服与你对接完成，结果写在订单的「发货详情」里。',
    }
  }
  return {
    q: '卡密买了暂时不用，能退吗？',
    a: '未使用的卡密可以按服务条款申请退款；已成功充值或卡密已被上游核销的，不支持退款。所以兑换前务必先确认账号状态满足商品说明里的条件。',
  }
}

// ============ 按落地页的口径 ============

interface LandingNote {
  /** 商品说明区的第二段：这一类商品是什么、怎么交付。必须对该落地页匹配的全部商品成立 */
  context: string
  /** 购买须知里放在最前面的前提条件 */
  preflight: string[]
  /** 从落地页 FAQ 搬来的问答（去掉「本页」「见上方」这类只在落地页成立的指代） */
  faqs: IntroFaq[]
  /** 「完整购买指南」链到落地页的哪一节 */
  anchor: string
  use: AutoUse
}

/*
 * 每一条的出处都是对应落地页（src/app/(shop)/chongzhi/<slug>/page.tsx）。
 * 搬过来时做的改动只有三类：「官方」换成直呼其名、去掉「本页 / 上面那张表」这类指代、
 * 删掉只对单个档位成立的半句（那部分由商品自己的 description 在「商品说明」里说）。
 */
function landingNote(slug: LandingSlug, d: DeliveryKind): LandingNote {
  switch (slug) {
    case 'chatgpt-plus':
      return {
        context:
          '这是 ChatGPT Plus 的卡密充值：在本站用支付宝付人民币，拿到卡密后自己到兑换页完成充值，不需要信用卡或任何境外支付方式。本站 Plus 有信用卡充值与 iOS 订阅充值两种方式，充上去的是同一个 Plus 会员，功能没有区别，区别只在充值链路：信用卡档兑换时填账号邮箱，iOS 订阅档兑换时要粘贴账号 session（登录凭据）。',
        preflight: [
          '无论哪一档，提交兑换前都要先确认账号当前没有有效订阅、也没有未结清的异常账单。不满足就提交，卡密会被上游核销而充值不会成功，按已核销处理，退不了。',
        ],
        faqs: [
          {
            q: '信用卡充值和 iOS 订阅充值，我该选哪一个？',
            a: '看你的账号当前状态。没有任何有效订阅、想要最低价，选信用卡档；已经在用 iOS 端、或者担心账号被风控，选 iOS 订阅档。两者充上去的都是同一个 Plus 会员，功能没有区别，区别只在充值链路。',
          },
          {
            q: '国内没有信用卡，能开 ChatGPT Plus 吗？',
            a: '可以。这正是卡密充值存在的原因——你不需要有任何境外支付方式，用支付宝在本站付人民币，拿到卡密之后到兑换页完成充值即可。整个过程不需要绑卡，也不需要虚拟信用卡。',
          },
          {
            q: '充上去之后掉订阅了怎么办？',
            a: '订阅期内非因你自身原因掉订阅，按剩余未使用天数折算退款。但账号被 OpenAI 封禁不在质保范围内——封号通常是账号本身或使用方式的问题，与这一笔充值无关。这条口径写在服务条款里，下单前请先确认能接受。',
          },
        ],
        anchor: 'how-to-choose',
        use: 'redeem',
      }
    case 'chatgpt-pro':
      return {
        context:
          '这是 ChatGPT Pro 的卡密充值：支付宝付人民币，拿到卡密后自己到兑换页完成充值，不需要境外银行卡。Pro 各档位的商品名后面都跟着一句括号，写明能不能覆盖账号上已有的订阅（如「可覆盖plus」「不可覆盖plus」）——它决定了你现有的订阅会被顶掉，还是会挡住这次充值。',
        preflight: [
          '先看商品名括号里写的能不能覆盖，再看价格。选错档提交，卡密会被核销，已核销的卡密不退；拿不准就先问客服。',
          '兑换页上的【强制充值】用于覆盖已有套餐：原套餐会直接作废，并扣除原套餐已使用的额度。主动覆盖造成的损失不属于「掉订阅」，不在质保范围内。',
        ],
        faqs: [
          {
            q: '我账号上已经有 Plus，能直接充 Pro 吗？',
            a: '看商品名括号：写着「可覆盖…」的档位是为这种情况准备的；写着「不可覆盖…」或「无法覆盖…」的档位，前提是账号上没有需要被顶掉的订阅。买错了卡密会被核销，而核销之后不退。拿不准就先问客服，别自己试。',
          },
          {
            q: '兑换页上的「强制充值」是干什么的，代价是什么？',
            a: '它用于覆盖账号上已有的套餐。代价有两层：一是原有套餐直接作废，二是升级之后 OpenAI 那边会自动扣除原有套餐已经用掉的那部分额度，也就是你不是从满额开始算。扣多少由 OpenAI 计算，我们看不到明细。主动按下这个按钮造成的损失不属于「掉订阅」，不在质保范围内。',
          },
          {
            q: '充上去之后掉订阅了、或者账号被封了怎么算？',
            a: '订阅期间掉订阅，扣掉已经用掉的天数，按剩余未使用天数折算退款。账号被 OpenAI 封禁不质保——封号通常是账号本身或使用方式的问题，和这一笔充值无关。规则写在服务条款里，不接受就别下单。',
          },
        ],
        anchor: 'override',
        use: 'redeem',
      }
    case 'claude-pro':
      return {
        context:
          '这是 Claude Pro 会员的卡密充值，走 iOS 订阅充值，无需上号：你在本站用支付宝付款拿到卡密，在卡密附带的兑换页按提示完成充值，账号密码不用交给任何人。未使用的卡密永久有效，只要手上有卡密，24 小时都能自助兑换，不用等客服上班。',
        preflight: [
          '当前账号上有没过期的会员、或者账单里存在逾期账单，这笔充值无法到账。卡密一旦提交就被核销，充值没成功也无法退款，请先自己检测无误再提交。',
        ],
        faqs: [
          {
            q: '充值需要把我的 Claude 账号密码给你们吗？',
            a: '不需要。这一档走的是 iOS 订阅充值，无需上号——你不用交出账号密码，也不用交出登录后的凭据，充值动作由你自己在兑换页发起，账号全程在你手里。',
          },
          {
            q: '我账号上还有没到期的会员，能先充上叠一个月吗？',
            a: '不能。当前有会员没过期、或者账单里存在逾期账单的账号，这笔充值不会到账。更要紧的是卡密提交之后就被核销了，充值没成功也退不了。想续期请等当期走完再充，或者先联系客服确认。',
          },
          {
            q: '充完之后账号被封了，能退款吗？',
            a: '不能，封号不质保，介意请不要下单。封号是 Anthropic 单方面判定的，绝大多数是 Claude 普号本身的问题，跟这一笔充值走哪条链路关系不大。我们见得最多的封号原因是频繁变动 IP，固定一个干净的出口环境比换任何一种充值方式都管用。',
          },
        ],
        anchor: 'before-redeem',
        use: 'redeem',
      }
    case 'claude-max':
      return {
        context:
          '这是 Claude Max 会员的卡密充值，走苹果订阅充值链路：支付宝付款拿到卡密，自己在兑换页完成充值，不需要信用卡，也不用把账号密码交出来。Anthropic 用「相对 Pro 的倍数」描述 Max 的额度：5x 约为 Pro 用量的 5 倍、20x 约为 20 倍，当期的准确口径以 Anthropic 页面为准。',
        preflight: [
          '兑换前确认四件事：账号上没有有效订阅（已取消但还没到期的也算）、Billing 里没有未结清欠款或异常退款记录、Organization 没有被 Shadow Ban、能在 Claude 网页端正常发送消息。任意一条不满足就提交，卡密会被核销而充值不会成功，这种情况不退。',
        ],
        faqs: [
          {
            q: 'Claude Max 5x 和 20x 有什么区别，值得直接上 20x 吗？',
            a: 'Anthropic 用「相对 Pro 的倍数」描述这两档：5x 大约是 Pro 用量的五倍、20x 大约是二十倍，网页端定价分别是每月 100 和 200 美元（以 Anthropic 页面为准）。价格翻一倍、额度翻四倍，所以真把 5x 用满的人上 20x 单位成本更低；反过来，如果你现在连 Pro 的额度都不是天天用完，20x 的钱基本是浪费。',
          },
          {
            q: '账号上已经有 Pro 订阅，能直接充 Max 吗？',
            a: '不能，兑换前的四项检查第一条就是「没有有效订阅」。已经有订阅时提交，卡密会被上游核销掉而充值不会成功，这种情况按已核销处理，退不了。要么等当期订阅到期之后再兑换，要么下单前先联系客服说明你的账号现状。',
          },
          {
            q: 'Organization ID 被 Shadow Ban 是什么意思，我怎么知道自己有没有？',
            a: 'Claude 的账号在后台都归属于一个组织，Organization ID 就是这个组织的标识。被 shadow ban 的特点是不会有任何封禁提示：能登录、能打开对话界面，但消息发不出去，或者一直转圈、直接报错。自查不需要找那串 ID——用 Claude 网页端（不要用第三方客户端）新开一个对话，发一条最普通的消息，能正常收到回复就算过；发不出去就先别兑换。',
          },
        ],
        anchor: 'preflight',
        use: 'redeem',
      }
    case 'claude-kyc':
      return {
        context:
          '这是 Claude 账号 KYC 身份验证的人工协助服务：做的是你现有账号上的这一道验证，不卖账号，也不发卡密。Anthropic 没有公开 KYC 的判定标准，本站不承诺通过；时效与失败退款的口径以本商品说明为准。',
        preflight: [
          '这一项需要你本人实时配合，付款后请及时联系客服对接。',
          '已经自己试过几次 KYC 的，下单前如实告诉客服——剩余的重试空间会直接影响这单值不值得做。',
        ],
        faqs: [
          {
            q: '你们的 Claude KYC 认证代办是卖账号吗？要不要我的密码？',
            a: '不是卖账号，我们不会给你一个新号，做的是你现有账号上的这一道验证。这项服务的交付方式是人工协助，下单后由客服跟你对接，需要你提供什么、哪些环节必须你本人实时配合，客服会按你账号当下的界面提示告诉你。它不发卡密，付款后不会有兑换码，要主动联系客服。',
          },
          {
            q: 'Claude KYC 怎么过？有没有必过的办法？',
            a: '没有。Anthropic 没有公开过 KYC 的判定标准，任何人告诉你「按这几步做就一定过」都是在编。现实里能提高结果的只有两件事：按界面上实际要求的东西准备，以及一次做对、不要靠反复提交去碰运气。我们提供的是人工协助把流程走完，不是保证通过。',
          },
          {
            q: 'Claude 突然要求 KYC 身份验证，我的账号是不是废了？',
            a: '被要求做 KYC 是一道验证，不是一份判决，和账号被停用是两回事——两者在界面上的提示措辞完全不同。如果看到的是要求你完成身份验证，账号还在流程里；如果看到的是账号已停用、违反使用政策一类的说法，那属于封禁，代办也帮不上忙。先按屏幕上的原文分清楚是哪一种，再决定下一步。',
          },
        ],
        anchor: 'service',
        use: 'generic',
      }
    case 'claude-zhuce':
      if (d === 'SMS') {
        return {
          context:
            '这是 Claude 注册环节的手机号验证码服务（单次接码）：付款后系统自动为这一单取一个号码，你把它填进 Claude 的手机验证页面，验证码显示在订单里，收完这一次就结束。号码不归你，也不是你账号的长期绑定号。',
          preflight: [
            '请走到注册页真的需要发验证码的那一步再下单，不要提前囤着——付款后会立即取号，号码的有效时间以订单里的倒计时为准。',
          ],
          faqs: [
            {
              q: 'Claude 注册需要手机号吗？国内手机号能用吗？',
              a: '注册流程里会要求做一次手机号验证。中国大陆的 +86 号码在这一步基本走不通，这不是你填错了，而是号码归属地本身就在被拒的范围里。可行的办法是用一个能正常收到验证码的境外号码完成这一次验证，注册验证码就是为这一步准备的，按次计费，验证完这个号码的任务就结束了。',
            },
            {
              q: 'Claude 注册不了、注册页一直报错，是什么原因？',
              a: '按顺序排查三样东西：一是号码类型（虚拟号收不到码），二是网络环境（机房 IP 在注册环节容易被判定），三是账号本身（同一个邮箱或同一环境反复失败后会被临时限制）。绝大多数「注册不了」不是随机的运气问题，而是这三项里某一项不满足。',
            },
          ],
          anchor: 'phone',
          use: 'generic',
        }
      }
      return {
        context:
          '这是在家宽环境下注册好的 Claude 普通账号（普号）：一个能正常登录的普通账号，不含 Pro、不含 Max，额度就是免费账号的额度，想要会员需要在这个账号上另外充值。',
        preflight: ['到手先确认账号和对应邮箱都能正常登录，再改密码；充会员之前务必先把这一步走完。'],
        faqs: [
          {
            q: 'Claude 普号是什么？里面带会员吗？',
            a: '普号就是一个能正常登录的普通 Claude 账号，不含 Pro、不含 Max，额度就是免费账号的额度。想要会员要在这个账号上另外充，做法见 Claude Pro 充值那一页。',
          },
        ],
        anchor: 'puhao',
        use: 'account',
      }
    case 'codex-jiema':
      return {
        context:
          '这是注册 OpenAI Codex（用 ChatGPT 账号登录的那个编程智能体）时用的手机号接码：借一个能收短信的号码接收一条一次性验证码，收完这一次就结束。号码不归你，不是买号，也不是把账号交给别人；付款后系统自动取号，不发卡密。',
        preflight: [
          '先在 OpenAI 那边把注册走到「请输入手机号码」这一屏，确认下一步该点哪里，再回来下单：付款后系统会立刻自动取号，号码一取出就开始计时。',
        ],
        faqs: [
          {
            q: 'codex 接码是什么意思？',
            a: '接码就是借一个能收短信的手机号，用它接收一条一次性的验证码，收完这一次就结束。号码不归你，也不是买号、租号或者共享账号。注册 OpenAI Codex 用的是 ChatGPT 账号，如果注册过程里卡在「请输入手机号码」那一步、国内号码又过不去，用得上的就是这个。本站这一类不发卡密：付款后系统自动取号，号码和验证码直接显示在订单里，账号全程在你手里。',
          },
          {
            q: '接码平台的虚拟号能不能用来注册 Codex？',
            a: '大概率不行。手机号验证这一步会看号码的运营商类型，网络电话（VoIP）这类号段是明确不收的；更现实的问题是公共接码平台的号池被反复使用，同一个号码给几十上百个账号收过码，在风控侧早就挂了名。',
          },
          {
            q: '这个号码以后还能用来登录或者做二次验证吗？',
            a: '不要这么用。单次接码保证的只是这一次能收到验证码，号码不属于你，之后落到谁手里、还会不会给你转发短信，都不在你的控制范围内。如果你的账号需要一个长期可用的号码，这不是单次接码能解决的事，请先联系客服说明用途。',
          },
        ],
        anchor: 'steps',
        use: 'generic',
      }
    case 'google-zhanghao':
      return {
        context:
          '这是已经注册好的谷歌成品号，不是代注册：付款后系统直接把账号信息发给你，不需要你提供任何个人资料。发过来的是一串用四个连字符分段的文本，前三段是 Google 用户名、密码、辅助邮箱，第四段决定登录方式——是接码入口就走辅助邮箱收验证码，是一串 2fa 字符就走动态验证码。',
        preflight: [
          '到手先用拿到的账号密码完整登录一次，确认能进去之后再改密码，顺序不要反。',
          '质保范围以商品说明为准，只覆盖说明里写的期限内的首次登录，买回来别先放着。账号被封不在质保范围内。',
        ],
        faqs: [
          {
            q: '发过来的是什么格式？怎么登录？',
            a: '发给你的是一串用四个连字符分段的文本，一共四段。前三段固定是 Google 用户名、密码、辅助邮箱；第四段决定你用哪种方式登录——第四段是一个接码入口，就走「辅助邮箱收验证码」那条路；第四段是一串 2fa 字符，就走「动态验证码」那条路。具体怎么操作以订单里给出的说明为准。',
          },
          {
            q: '账号到手第一件事做什么？',
            a: '两件事，顺序不能反：第一，先用拿到的账号密码完整登录一次，确认能进去；第二，确认能登录之后再改密码。顺序反了最常见的后果是——密码改到一半卡在二次验证那一步，原密码已经不能用、新密码又没设成，账号两头不着。',
          },
          {
            q: '我买号是为了用 Gemini，可以吗？',
            a: '这个号是一个可以正常登录的谷歌账号，登录之后能用哪些谷歌服务、在你所在的地区有没有限制、有没有额外的开通条件，全部由谷歌自己决定——这部分我们既不掌握也不做承诺。我们能负责的只有一件事：交付给你的账号信息在质保范围内可以正常登录。',
          },
        ],
        anchor: 'login',
        use: 'account',
      }
    case 'grok-super':
      return {
        context:
          '这是 xAI Grok Super 会员的卡密充值，走 iOS 订阅充值：支付宝付人民币，拿到卡密后自己到兑换页完成充值，不需要境外信用卡。兑换时需要按商品说明提供一段登录凭据，用途仅限执行这一笔充值。',
        preflight: [
          '兑换前先核对账户状态：账号上已有生效中的订阅、账单里有未结清或异常记录、或者刚刚充值过还在节流里，提交都可能失败。卡密一旦被上游核销就不能退，无论充值成功与否。',
        ],
        faqs: [
          {
            q: 'Grok Super 各档位有什么区别，我该买哪个？',
            a: '差别在时长和档次，不在充值方式——都是走 iOS 订阅充值。按月那档适合先试；三个月那档对应一次 90 美元的额度，单位成本比按月低一点；Super Heavy 是更高的档次，xAI 定价每月 300 美元，只有确实需要那一档的人才值得买。每一档具体能用什么模型、额度多少，以 xAI 页面为准，本站核验不了，不替它做承诺。',
          },
          {
            q: '需要把账号密码给你们吗？',
            a: '这一类走的是 iOS 订阅充值，兑换时需要你提供一段登录凭据用于执行这一笔充值，用途仅限于此。本站交付的是卡密，充值动作由你自己在兑换页发起。',
          },
          {
            q: '兑换失败了，卡密还能用吗？',
            a: '账号状态类与凭据类的报错通常不消耗卡密，把账号那一侧处理好、或按商品说明重新取一次凭据再提交即可。但只要卡密已被上游核销（也就是充值动作已经发生），无论结果如何都不能退。如果兑换页明确提示需要人工确认，请立刻带着订单号联系客服，不要重复提交。',
          },
        ],
        anchor: 'tiers',
        use: 'redeem',
      }
  }
}

// ============ 装配 ============

const MAX_FAQS = 5

/**
 * 同系列其他档位：同一个落地页匹配到的商品（外加 EXTRA_SIBLINGS），去掉自己，按价格从低到高。
 * 没有落地页的商品退回「同分类」。价格与库存取自调用方传进来的在售快照，和落地页价格表同一份数据。
 */
function siblingsOf(p: IntroProduct, catalog: IntroCatalogItem[], def: LandingDef | null): IntroSibling[] {
  let pool: IntroCatalogItem[]
  if (def) {
    pool = matchProducts(catalog, def.match)
    const extra = EXTRA_SIBLINGS[def.slug as LandingSlug]
    if (extra) pool = pool.concat(matchProducts(catalog, extra))
  } else {
    const cat = (p.categoryName ?? '').trim().toLowerCase()
    pool = cat ? catalog.filter((c) => (c.categoryName ?? '').trim().toLowerCase() === cat) : []
  }
  const seen = new Set<number>([p.id])
  const out: IntroSibling[] = []
  pool.forEach((c) => {
    if (seen.has(c.id)) return
    seen.add(c.id)
    out.push({ id: c.id, name: c.name, price: c.price, inStock: inStock(c) })
  })
  // 稳定排序：同价时保持快照里的顺序（sortOrder），与落地页价格表一致
  return out.sort((a, b) => a.price - b.price)
}

/**
 * 自动发货商品里「发的是账号信息本身」的那一类（谷歌成品号、Claude 普号）。
 * 商品页的 meta description / Product JSON-LD（lib/product-seo.ts）要据此换掉「卡密自助兑换」的口径，
 * 与页面上「商品介绍」的说法保持一致 —— 结构化数据不能与可见内容打架。
 */
export function isAccountProduct(p: { name: string; categoryName?: string | null; deliveryType?: string | null }): boolean {
  const delivery = deliveryKind(p.deliveryType)
  if (delivery !== 'AUTO') return false
  const hit = landingForProduct(p)
  if (!hit || !hit.direct) return false
  return landingNote(hit.def.slug as LandingSlug, delivery).use === 'account'
}

/**
 * contact：当前店面的客服信息（页面传 getStorefront().contact）。缺省 = 主站常量，只为兼容 scripts/check-product-intro.ts
 * 这类不关心店面的调用；渠道页面必须显式传，否则渠道商品页会写出主站客服微信。
 */
export function buildProductIntro(p: IntroProduct, catalog: IntroCatalogItem[], contact: StoreContact = PLATFORM_CONTACT): ProductIntro {
  const delivery = deliveryKind(p.deliveryType)
  const hit = landingForProduct(p)
  // 兜底归类（direct=false）的商品只借落地页的链接与同系列列表，不套用它的档位口径：
  // 年费档的前提（会覆盖现有套餐）和 Plus 月付档（要求没有有效订阅）正好相反
  const note = hit && hit.direct ? landingNote(hit.def.slug as LandingSlug, delivery) : null
  const use: AutoUse = note ? note.use : 'generic'

  const faqs = note ? note.faqs.slice() : []
  genericFaqs(delivery, use, contact).forEach((f) => faqs.push(f))
  if (faqs.length < 3) faqs.push(unmatchedExtraFaq(delivery))

  const anchor = note ? note.anchor : 'price'
  return {
    delivery,
    landing: hit ? { slug: hit.def.slug as LandingSlug, navLabel: hit.def.navLabel, direct: hit.direct } : null,
    about: note ? note.context : null,
    deliveryPoints: deliveryPoints(delivery, use, contact),
    steps: steps(delivery, use, contact),
    pricing: pricing(),
    notices: (note ? note.preflight : []).concat(genericNotices(delivery, use, contact)),
    siblings: siblingsOf(p, catalog, hit ? hit.def : null),
    faqs: faqs.slice(0, MAX_FAQS),
    guide: hit
      ? { href: `${landingPath(hit.def.slug)}#${anchor}`, label: `完整购买指南：${hit.def.navLabel}` }
      : null,
  }
}
