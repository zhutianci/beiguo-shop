/**
 * 站点级结构化数据（Organization / WebSite / BreadcrumbList / FAQPage / ItemList）。
 *
 * 【与已有两个文件的分工】
 *   lib/product-seo.ts   → 单个商品的 Product/Offer（不动）
 *   lib/news/seo.ts      → 新闻详情页的 Article（不动，那边还带法律定性的约束）
 *   本文件               → 全站共用的那几类，以及商业落地页要用的 FAQ/面包屑
 * 绝对地址统一复用 news/seo.ts 的 absUrl，不另起一套拼域名的写法。
 *
 * 【刻意不做的事】
 *   - 不输出 aggregateRating / review：站上没有真实评价体系，编一个是最典型的
 *     结构化数据造假，人工处罚影响的是整个域名而不止一页（product-seo.ts 已写过一次）。
 *   - FAQPage 照规范输出，但**不要指望它出富摘要**：Google 2023 年 8 月起
 *     把 FAQ 富结果收窄到「权威政府与健康类站点」，普通商业站标了也不会显示。
 *     它在这里的价值是把问答关系说清楚（对 AI 摘要/对话式检索仍有用），不是抢 SERP 面积。
 */
import { absUrl, SITE_LOGO } from '@/lib/news/seo'
import { siteOrigin } from '@/lib/news/format'

export const SITE_NAME = '贝果科技'
// alternateName 里不要重复 name 本身，只列真正的「别名」
export const SITE_ALT_NAMES = ['BigoLab', 'bigolab']

/** 稳定的 @id。用锚点而不是裸 URL，这样一个页面里的多个节点可以互相引用而不打架 */
export const ORG_ID = `${siteOrigin()}/#organization`
export const SITE_ID = `${siteOrigin()}/#website`

/*
 * 【渠道分站（设计 4.5、11.1）】模块级常量是「构建 / 加载时的主站地址」，渠道站不能用：
 *  · Organization（ORG_ID、legalName、logo）统一品牌、主体相同，**保持平台值**，两站都引用同一个主体；
 *  · WebSite（SITE_ID、url）与站内地址（面包屑、ItemList）是「这个站点」自己的，要按当前店面 origin 生成。
 * 下面几个函数都加了可选的 origin 参数：不传 = 主站（siteOrigin()），输出与改造前逐字相同；
 * 渠道页面由调用方传 sf.origin（店面来自 getStorefront()，绝不从 Host 头拼地址）。
 */
export function siteIdFor(origin?: string): string {
  return origin ? `${trimOrigin(origin)}/#website` : SITE_ID
}

function trimOrigin(origin: string): string {
  return origin.replace(/\/+$/, '')
}

/** absUrl 的按店面版本：不传 origin 时就是 absUrl（主站） */
function urlFor(path: string, origin?: string): string {
  if (!origin) return absUrl(path)
  return `${trimOrigin(origin)}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Organization。首页输出一次即可，其他页面通过 @id 引用。
 *
 * 【联系方式只写真实存在的】微信客服号是站上公开写着的，邮箱同理；
 * 编一个电话或地址去凑「信息完整度」是负资产——Google 对不一致的主体信息比对缺失更敏感。
 */
export function organizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE_NAME,
    alternateName: SITE_ALT_NAMES,
    /*
     * 【legalName 是这个站最被低估的一项资产】真实经营主体此前只出现在收据与发票里，
     * 前台任何一个页面都看不到。而这一行恰恰是本站相对同行（绝大多数是无照个人卖家）
     * 唯一的结构性优势：能开增值税发票、主体可查。
     * Google 对「卖东西的站点是谁在卖」这件事的判断依赖的就是这类可核验信息。
     * 注意：这里写的名字必须与营业执照、发票抬头、收据上的完全一致，
     * 对不上比不写更糟——不一致的主体信息是负信号。
     */
    legalName: '益阳市赫山区必高科技有限公司',
    url: siteOrigin(),
    logo: {
      '@type': 'ImageObject',
      url: absUrl(SITE_LOGO),
      width: 512,
      height: 512,
    },
    image: absUrl(SITE_LOGO),
    description:
      '贝果科技提供 ChatGPT Plus / Pro、Claude Pro / Max 等 AI 会员的代充值与订阅开通服务，卡密自助充值，支持支付宝付款，可开具增值税发票。',
    slogan: 'AI 会员代充与订阅开通',
    areaServed: { '@type': 'Country', name: 'CN' },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        availableLanguage: ['zh-CN'],
        url: absUrl('/support'),
      },
    ],
  }
}

/**
 * WebSite + SearchAction。
 *
 * 【SearchAction 指向真实存在的搜索】站内唯一的「按输入查东西」是订阅查询 /lookup，
 * 但那是按邮箱查订单、不是站内内容搜索，而且 /lookup 在 robots.txt 里是 disallow 的。
 * 把它写成 SearchAction 等于给搜索引擎一个它抓不到、也不该抓的端点。
 * 所以这里**只输出 WebSite，不带 potentialAction** —— 站内搜索框做出来之前，这一段是空头承诺。
 */
export function webSiteJsonLd(origin?: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': siteIdFor(origin),
    url: origin ? trimOrigin(origin) : siteOrigin(),
    name: SITE_NAME,
    alternateName: SITE_ALT_NAMES,
    inLanguage: 'zh-CN',
    publisher: { '@id': ORG_ID },
  }
}

export interface Crumb {
  name: string
  /** 站内路径，以 / 开头。最后一级可以省略（当前页自身） */
  path?: string
}

/**
 * BreadcrumbList。
 *
 * 【为什么值得做】面包屑是 Google 少数几个仍然稳定显示的富结果：搜索结果里
 * 那一行 `贝果科技 › AI 会员代充 › ChatGPT Plus 代充` 会替换掉裸 URL，
 * 点击率的提升是实打实的。而且它还向 Google 交代了站点层级，对新页面的理解有帮助。
 *
 * 【页面上必须真的有这条面包屑】只写 JSON-LD、页面上看不见，属于「标记了用户看不到的内容」，
 * 是 Google 结构化数据政策明令禁止的。所以落地页组件里同时渲染了可见的面包屑导航。
 */
export function breadcrumbJsonLd(crumbs: Crumb[], origin?: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      ...(c.path ? { item: urlFor(c.path, origin) } : {}),
    })),
  }
}

export interface Faq {
  q: string
  a: string
}

/** FAQPage。富摘要资格见文件头说明，别对它抱有 SERP 面积上的期待 */
export function faqJsonLd(faqs: Faq[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

/**
 * ItemList 只需要 id 与名字。
 * 【刻意不要 price】列表项里不输出价格：价格属于 Offer，而 Offer 在商品详情页的
 * Product 标记里已经有一份。这里再放一份只会多出一个需要同步的数字，
 * 而且把 price 写进接口会逼每个调用方先做一次 Decimal → number 转换才能传参。
 */
export interface ListedProduct {
  id: number
  name: string
}

/**
 * 商品列表页的 ItemList。
 *
 * 【只输出顺序与链接，不在列表里重复整个 Product】ItemList 里嵌一堆完整 Product
 * 会与商品详情页自己的 Product 标记重复，Google 反而更难判断哪一页是该展示的那一页。
 * 列表页要交代的信息只有「这一页列了哪些东西、什么顺序」。
 */
export function productItemListJsonLd(products: ListedProduct[], listPath: string, origin?: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${urlFor(listPath, origin)}#itemlist`,
    // 「代充」是信任审查意图的次要词（交接文档第二十四节的实测），不适合作列表名
    name: 'AI 会员充值商品',
    numberOfItems: products.length,
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: urlFor(`/products/${p.id}`, origin),
      name: p.name,
    })),
  }
}
