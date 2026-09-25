/**
 * 内置模板与区块工厂（同构）。
 * 模板只用站内已有素材（/logo-mark.png）与色块，不依赖任何图片也要好看；每个都内置 {{nickname|朋友}} 尊称。
 *
 * 【实现方：渲染器】签名是契约。
 *
 * 文案纪律（改模板前必读）：
 * - 不出现微信/QQ/二维码/群/网盘（阿里云禁发），不用「最/第一/唯一/独家/顶级」等绝对化用语；
 * - 只写站上真实成立的事：支付宝付款、自动发货商品付款后卡密发到账号邮箱（接码/人工商品不发卡密）、
 *   可开发票（另付 6% 税费）、质保与退款口径写在服务条款里。不编造「官方」「全网」「限量」之类无法证明的说法；
 * - 交付方式因商品而异（AUTO 发卡密 / SMS 在订单页看号码 / MANUAL 客服处理，见 mail.ts）：写卡密发邮箱
 *   必须限定「自动发货的商品」，不许写成全站通用的「付款后即时发卡」（审查 C6；product-seo.ts 已为同一句话返工过一次）；
 * - 文案里若默认读者「买过」（上次下单、好久不见、回归券…），模板必须带 audience 限定付过款的人（审查 C13）。
 * - 主题/预览文字不写死券面额与天数：管理员改了券参数，主题不会跟着变，会变成虚假宣传。
 * - 商品区块用占位 productId（PLACEHOLDER_PRODUCT_ID），编辑器会提示管理员重新选择。
 */
import type { AudienceSpec, Block, BlockType, EmailDoc, RichDoc, RichInline, RichMark, Topic } from './types'
import { DEFAULT_SETTINGS } from './render'
import { emptyRichDoc, mixHex } from './richtext'

export interface Preset {
  key: string
  name: string
  description: string
  topic: Topic
  subject: string
  preheader: string
  doc: EmailDoc
  /**
   * 用这个模板新建活动时的默认受众（不给 = 全部活跃用户）。文案里有「上次下单」之类前提的模板必须给，
   * 否则默认发给所有人，对没买过的人就是一句假话（审查 C13）
   */
  audience?: AudienceSpec
}

/** 模板里商品区块的占位商品（编辑器提示「请选择商品」） */
export const PLACEHOLDER_PRODUCT_ID = 4

/** 尊称变量的标准写法 */
export const GREETING_TAG = '{{nickname|朋友}}'

/* ============================== 富文本构造小工具 ============================== */

type Seg = string | { text: string; bold?: boolean; href?: string; color?: string }

function inl(segs: Seg[]): RichInline[] {
  return segs.map((s) => {
    if (typeof s === 'string') return { type: 'text', text: s }
    const marks: RichMark[] = []
    if (s.bold) marks.push({ type: 'bold' })
    if (s.color) marks.push({ type: 'textStyle', attrs: { color: s.color } })
    if (s.href) marks.push({ type: 'link', attrs: { href: s.href } })
    return marks.length ? { type: 'text', text: s.text, marks } : { type: 'text', text: s.text }
  })
}

const para = (...segs: Seg[]): RichDoc['content'][number] => ({ type: 'paragraph', content: inl(segs) })
const bullets = (...items: Seg[][]): RichDoc['content'][number] => ({
  type: 'bulletList',
  content: items.map((segs) => ({ type: 'listItem', content: [{ type: 'paragraph', content: inl(segs) }] })),
})
const numbered = (...items: Seg[][]): RichDoc['content'][number] => ({
  type: 'orderedList',
  content: items.map((segs) => ({ type: 'listItem', content: [{ type: 'paragraph', content: inl(segs) }] })),
})
const rich = (...content: RichDoc['content']): RichDoc => ({ type: 'doc', content })

/* ============================== 区块工厂 ============================== */

export function newBlockId(): string {
  return 'b' + Math.random().toString(36).slice(2, 10)
}

/** 新建一个区块（带合理默认值与新 id）。productId 等需要选择的字段给占位值，由编辑器提示选择 */
export function newBlock(type: BlockType, settings?: EmailDoc['settings']): Block {
  const s = settings || DEFAULT_SETTINGS
  const id = newBlockId()
  switch (type) {
    case 'header':
      return { id, type, logo: true, title: '贝果科技', bg: s.brand, bg2: s.accent, color: '#ffffff', align: 'left' }
    case 'hero':
      return {
        id,
        type,
        title: '在这里写一句醒目的标题',
        subtitle: '用一两句话说明这封邮件要告诉读者什么。',
        bg: mixHex(s.brand, '#ffffff', 0.93),
        bg2: mixHex(s.accent, '#ffffff', 0.93),
        color: s.text,
        align: 'center',
        button: { label: '立即查看', href: '/products', bg: s.brand, color: '#ffffff' },
      }
    case 'heading':
      return { id, type, content: emptyRichDoc('小标题'), level: 2, align: 'left' }
    case 'text':
      return { id, type, content: emptyRichDoc('在这里输入正文。'), align: 'left', size: 16 }
    case 'image':
      return { id, type, src: '', alt: '', width: 100, align: 'center' }
    case 'button':
      return { id, type, label: '立即查看', href: '/products', bg: s.brand, color: '#ffffff', radius: 10, align: 'center', fullWidth: false, size: 'md' }
    case 'product':
      return { id, type, productId: PLACEHOLDER_PRODUCT_ID, layout: 'card', ctaLabel: '立即购买', showOriginalPrice: false, showFeatures: true }
    case 'productGrid':
      return { id, type, productIds: [PLACEHOLDER_PRODUCT_ID, PLACEHOLDER_PRODUCT_ID], ctaLabel: '立即购买', showFeatures: false }
    case 'coupon':
      return {
        id,
        type,
        mode: 'grant',
        title: '邮件专享券',
        ctaLabel: '去使用',
        bg: s.brand,
        color: '#ffffff',
        grant: { kind: 'THRESHOLD', discount: 20, minAmount: 99, productIds: [], validity: { mode: 'days', days: 7 } },
      }
    case 'callout':
      return { id, type, content: emptyRichDoc('在这里写需要读者特别留意的一句话。'), tone: 'brand' }
    case 'divider':
      return { id, type, color: mixHex(s.text, s.canvas, 0.87), thickness: 1, widthPct: 100 }
    case 'spacer':
      return { id, type, height: 24 }
    default: {
      const never: never = type
      throw new Error(`未知区块类型：${String(never)}`)
    }
  }
}

/* ============================== 内置模板 ============================== */

const S = DEFAULT_SETTINGS
const TINT = mixHex(S.brand, '#ffffff', 0.93)
const TINT2 = mixHex(S.accent, '#ffffff', 0.93)

const header = (id = 'hdr'): Block => ({ id, type: 'header', logo: true, title: '贝果科技', bg: S.brand, bg2: S.accent, color: '#ffffff', align: 'left' })
const signOff = (id: string, ...lines: string[]): Block => ({
  id,
  type: 'text',
  content: rich(...lines.map((l) => para(l))),
  align: 'left',
  size: 15,
})

const newProduct: Preset = {
  key: 'new-product',
  name: '新品上架',
  description: '渐变页眉 + 浅色头图 + 商品卡片，介绍新上架的会员订阅',
  topic: 'PRODUCT',
  subject: '新品上架｜AI 会员订阅又添新选择',
  // 不写「付款后即时发卡」：短信接码与人工商品不发卡密（审查 C6）
  preheader: '支付宝付款，可开发票；订单进度可在「我的订单」查看。',
  doc: {
    v: 1,
    settings: { ...S },
    blocks: [
      header(),
      {
        id: 'hero',
        type: 'hero',
        title: '新品上架',
        subtitle: '本期上新的 AI 会员订阅已经可以下单。和往常一样：支付宝付款，可开发票。',
        bg: TINT,
        bg2: TINT2,
        color: S.text,
        align: 'center',
        button: { label: '查看新品', href: '/products', bg: S.brand, color: '#ffffff' },
      },
      {
        id: 'greet',
        type: 'text',
        content: rich(
          para(`${GREETING_TAG}，你好：`),
          para('贝果科技上架了新的 AI 会员订阅。商品页里写清了价格、权益、使用说明与质保范围，下单前可以先花一分钟看一看。')
        ),
        align: 'left',
        size: 16,
      },
      { id: 'prod', type: 'product', productId: PLACEHOLDER_PRODUCT_ID, layout: 'card', ctaLabel: '立即购买', showOriginalPrice: false, showFeatures: true },
      {
        id: 'tips',
        type: 'callout',
        tone: 'brand',
        content: rich(
          para({ text: '下单前请留意', bold: true }),
          bullets(
            ['页面标价不含税；需要发票可在结账时勾选，另付 6% 税费。'],
            // 交付方式因商品而异，只对自动发货的商品承诺卡密发邮箱（审查 C6）
            ['自动发货的商品，卡密会发到你的账号邮箱；各商品的交付方式以商品页说明为准，进度都可以在「我的订单」里查看。'],
            ['质保与退款口径写在服务条款里，购买前建议看一下。']
          )
        ),
      },
      { id: 'cta', type: 'button', label: '浏览全部商品', href: '/products', bg: S.brand, color: '#ffffff', radius: 10, align: 'center', fullWidth: false, size: 'md' },
      signOff('bye', '有任何问题，直接回复这封邮件即可，我们会尽快答复。', '— 贝果科技'),
    ],
  },
}

const couponPreset: Preset = {
  key: 'coupon',
  name: '限时优惠券',
  description: '直发一张优惠券到收件人账户（不用领取），附商品推荐',
  topic: 'PROMO',
  subject: `${GREETING_TAG}，一张邮件专享券已放入你的账户`,
  preheader: '不用领取，结账时直接选用。券有有效期，记得在到期前使用。',
  doc: {
    v: 1,
    settings: { ...S },
    blocks: [
      header(),
      {
        id: 'greet',
        type: 'text',
        content: rich(
          para(`${GREETING_TAG}，你好：`),
          // 这个模板默认发给全部活跃用户（含没下过单的），不写「一直以来的支持」这类默认读者买过的话（审查 C13）
          para('感谢你关注贝果科技。我们给你准备了一张邮件专享优惠券，已经直接放进你的账户——不用领取，结账时选用即可。')
        ),
        align: 'left',
        size: 16,
      },
      {
        id: 'coupon',
        type: 'coupon',
        mode: 'grant',
        title: '邮件专享券',
        note: '在「我的优惠券」里可以随时查看这张券。',
        ctaLabel: '去使用',
        bg: S.brand,
        color: '#ffffff',
        grant: { kind: 'THRESHOLD', discount: 20, minAmount: 99, productIds: [], validity: { mode: 'days', days: 7 } },
      },
      { id: 'h2', type: 'heading', content: rich(para('适合用券的会员订阅')), level: 2, align: 'left' },
      { id: 'prod', type: 'product', productId: PLACEHOLDER_PRODUCT_ID, layout: 'row', ctaLabel: '去看看', showOriginalPrice: false, showFeatures: true },
      {
        id: 'how',
        type: 'callout',
        tone: 'info',
        content: rich(
          // 券对所有商品可用（含接码/人工商品），不能笼统承诺「卡密即时发到邮箱」（审查 C6）
          para({ text: '怎么用：', bold: true }, '在结账页选择这张券即可抵扣。页面标价不含税，开发票需另付 6% 税费；交付方式以商品页说明为准。')
        ),
      },
      signOff('bye', '祝使用愉快！', '— 贝果科技'),
    ],
  },
}

const winback: Preset = {
  key: 'winback',
  name: '老客召回',
  description: '给一段时间没回来的老客户，附一张直发回归券',
  topic: 'PROMO',
  subject: `${GREETING_TAG}，好久不见，送你一张回归券`,
  preheader: '续订 AI 会员前，先看看账户里的这张券。',
  // 文案写了「上次下单」「好久不见」：默认只发给付过款、且 90 天没再付款的人（= 受众芯片「lapsed」+ 排除长期不活跃）。
  // 不给的话新建草稿会落到「全部活跃用户」，对没买过的人就是假话，还白送一张券（审查 C13）
  audience: { type: 'SEGMENT', rules: { paid: 'yes', noPaidWithinDays: 90, excludeInactive: true } },
  doc: {
    v: 1,
    settings: { ...S },
    blocks: [
      header(),
      {
        id: 'hero',
        type: 'hero',
        title: '好久不见',
        subtitle: '你的账户里多了一张回归券，续订 AI 会员时用得上。',
        bg: TINT,
        bg2: TINT2,
        color: S.text,
        align: 'center',
      },
      {
        id: 'greet',
        type: 'text',
        content: rich(
          para(`${GREETING_TAG}，你好：`),
          para('距离你上次在贝果科技下单已经有一段时间了。如果你的 AI 会员已经到期或快要到期，这张回归券可以帮你省一点。')
        ),
        align: 'left',
        size: 16,
      },
      {
        id: 'coupon',
        type: 'coupon',
        mode: 'grant',
        title: '回归专享券',
        ctaLabel: '去使用',
        bg: S.brand,
        color: '#ffffff',
        grant: { kind: 'THRESHOLD', discount: 15, minAmount: 99, productIds: [], validity: { mode: 'days', days: 14 } },
      },
      {
        id: 'why',
        type: 'callout',
        tone: 'brand',
        content: rich(
          para({ text: '在贝果科技购买', bold: true }),
          bullets(
            ['支付宝付款，不需要境外银行卡。'],
            ['自动发货的会员订阅，付款后卡密发到你的账号邮箱。'], // 审查 C6：限定自动发货
            ['可开发票（另付 6% 税费），质保与退款口径写在服务条款里。']
          )
        ),
      },
      { id: 'prod', type: 'product', productId: PLACEHOLDER_PRODUCT_ID, layout: 'card', ctaLabel: '立即购买', showOriginalPrice: false, showFeatures: true },
      { id: 'cta', type: 'button', label: '看看在售的会员', href: '/products', bg: S.brand, color: '#ffffff', radius: 10, align: 'center', fullWidth: false, size: 'md' },
      signOff('bye', '如果你不想再收到这类邮件，点击下方「退订营销邮件」即可，我们不会再打扰。', '— 贝果科技'),
    ],
  },
}

// 简洁通知：白底页眉、单栏文字信 —— QQ 邮箱等对「重设计」邮件更敏感的收件箱里，文字信的送达与观感都更稳
const NOTICE_SETTINGS = { ...S, radius: 8 }
const notice: Preset = {
  key: 'notice',
  name: '简洁通知',
  description: '白底文字信，适合服务说明、使用提醒；在 QQ 邮箱里显示稳定',
  topic: 'NEWS',
  subject: '贝果科技｜关于下单与卡密的几点说明',
  preheader: '交付与卡密、付款方式、发票与质保，一封信说清楚。',
  doc: {
    v: 1,
    settings: NOTICE_SETTINGS,
    blocks: [
      { id: 'hdr', type: 'header', logo: true, title: '贝果科技', bg: '#ffffff', color: S.brand, align: 'left' },
      { id: 'line', type: 'divider', color: mixHex(S.text, S.canvas, 0.9), thickness: 1, widthPct: 100, box: { padTop: 0, padBottom: 8 } },
      { id: 'h1', type: 'heading', content: rich(para('关于下单与卡密的几点说明')), level: 1, align: 'left' },
      {
        id: 'body',
        type: 'text',
        content: rich(
          para(`${GREETING_TAG}，你好：`),
          para('最近收到不少关于下单流程的询问，我们把常被问到的几点整理在这里，方便你随时查阅：'),
          numbered(
            // 这封是发给所有人的下单说明：按三种交付方式分别说，接码/人工商品没有卡密（审查 C6）
            [
              { text: '交付与卡密：', bold: true },
              '自动发货的商品，付款成功后卡密会发到你登录本站所用的账号邮箱；短信接码商品请在「我的订单 → 订单详情」查看号码与验证码；人工服务类商品由客服处理，进度在「我的订单」里跟进。',
            ],
            [{ text: '付款方式：', bold: true }, '本站收银台只支持支付宝，不需要境外银行卡。'],
            [{ text: '发票：', bold: true }, '页面标价不含税；需要发票可在结账时勾选，另付 6% 税费。'],
            [{ text: '质保与退款：', bold: true }, '具体口径写在', { text: '服务条款', href: '/terms' }, '里，下单前建议花一分钟看一下。']
          ),
          para('如果还有其他问题，直接回复这封邮件即可，我们会尽快答复。')
        ),
        align: 'left',
        size: 16,
      },
      { id: 'cta', type: 'button', label: '查看我的订单', href: '/orders', bg: S.brand, color: '#ffffff', radius: 8, align: 'left', fullWidth: false, size: 'md' },
      signOff('bye', '贝果科技 敬上'),
    ],
  },
}

const blank: Preset = {
  key: 'blank',
  name: '空白',
  description: '只有页眉和尊称，从零开始排版',
  topic: 'PROMO',
  subject: '',
  preheader: '',
  doc: {
    v: 1,
    settings: { ...S },
    blocks: [
      header(),
      {
        id: 'greet',
        type: 'text',
        content: rich(para(`${GREETING_TAG}，你好：`), para('在这里写正文……')),
        align: 'left',
        size: 16,
      },
    ],
  },
}

/** 新品上架 / 限时优惠券 / 老客召回 / 简洁通知 / 空白 */
export const PRESETS: Preset[] = [newProduct, couponPreset, winback, notice, blank]

export function getPreset(key: string): Preset | null {
  const p = PRESETS.find((x) => x.key === key)
  // 深拷贝：调用方（新建草稿、编辑器）会就地修改 doc，不能污染模块级常量
  return p ? (JSON.parse(JSON.stringify(p)) as Preset) : null
}
