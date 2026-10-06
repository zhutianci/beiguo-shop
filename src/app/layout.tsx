import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthFetchPatch } from '@/components/auth-fetch-patch'
import { StorefrontProvider } from '@/components/storefront-provider'
import { siteOrigin } from '@/lib/news/format'
import { getStorefront } from '@/lib/storefront/resolve'
import { toPublicStorefront } from '@/lib/storefront/public'
import { initialIconDataUrl, isWhiteLabel, type StoreBrand } from '@/lib/brand-base'
import { brandShareImages, withBrandName } from '@/lib/storefront/brand-meta'

/*
 * 【渠道分站：根布局按请求渲染（设计 4.8）】
 * 同一个 Next 进程同时服务 bigolab.com 与 lulu.bigolab.com。构建期被预渲染的页面（about、terms、login、
 * /_not-found 等）会把同一份 HTML 发给所有 Host——渠道站就会拿到 metadataBase、canonical、og:url 都指向主站、
 * 且没有 noindex 的页面。force-dynamic 放在根布局，全站随之按请求渲染；generateMetadata 里读店面（headers()）
 * 本身也会把页面转成动态，这里显式写出来是双保险。
 * 代价：about / terms / login 等原本静态的页面改为每次请求渲染（设计 4.10 ②，发布说明已列）。
 */
export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ['latin'] })

const SITE_NAME = '贝果科技'
/*
 * 【这是兜底文案，不是首页文案】没有自己 metadata 的页面（以及 404）都继承这里，所以只写品牌和业务概括
 * （docs/SEO-重构/SEO-重构设计.md §6.8，A 包）：
 *  · 不写「代充」：零需求词与自称不进 title（§3.4）；「代开 / 代购 / 代订阅」2026-09-19 已删（Google 下拉联想数为 0）。
 *  · 不写开票：写到开票就必须同时写「标价不含税，开票另付 6%」（§3.1），兜底值塞不下完整口径，干脆不写；
 *    原来那句「可开增值税发票」不带 6%，被所有没写 metadata 的页面继承。
 *  · 不写短信接码：兜底值在灰度期（仅管理员）同样会被继承，写了就等于在可收录的页面上宣传一个没开放的业务（设计评审 #36、#52）。
 *  · 品牌写「贝果科技 BigoLab」：「贝果科技」被台湾同名公司占着，加 BigoLab 区分（§0.3 #5）。
 * 首页、关于页、各落地页都有自己的 title / description，不受这里影响。
 */
const TITLE = '贝果科技 BigoLab - AI 订阅充值与 AI 行业动态'
const DESCRIPTION =
  '贝果科技（bigolab.com）提供 ChatGPT、Claude 等 AI 订阅充值：卡密自助兑换，支付宝付款，无需境外信用卡；另有 AI 圈大事记，按事件整理 AI 行业动态并附原文出处。'
/*
 * 【渠道站的兜底文案单独一份】上面两句写了主站域名和大事记，而渠道 Host 上大事记（features.news）是关的（/news 404），
 * 域名也不是这家店的地址。渠道站上没写 openGraph 的页面（privatePageMetadata 只给 title / description 的登录、订单、钱包等页，
 * 以及 404）会把兜底的 og:title / og:description / twitter 带进分享卡片——所以渠道分支只写品牌和充值：不写域名、不提大事记、
 * 不写短信接码（渠道站也关着）。渠道站整站 noindex，这里只影响分享卡片（A 包评审修复，itest-tenant/wp1 W1-5 有断言）。
 */
const CHANNEL_TITLE = '贝果科技 BigoLab - AI 订阅充值'
const CHANNEL_DESCRIPTION = '贝果科技提供 ChatGPT、Claude 等 AI 订阅充值：卡密自助兑换，支付宝付款，无需境外信用卡。'

/**
 * 站点级 metadata。子页面（如 /news/[slug] 的 generateMetadata）只需要覆盖
 * title / description / openGraph，其余字段自动继承这里。
 *
 * 【metadataBase 是必需的】没有它，子页面里写的相对 og:image / canonical
 * 会被 Next 原样输出成相对路径，而微信与各家爬虫都不接受相对地址的 og:image——
 * 表现是「本地预览没问题、发到群里没缩略图」，很难查。
 *
 * 【图标】public/ 下的站标、favicon、苹果桌面图标与分享图都由 scripts/gen-brand-assets.py 从
 *   docs/brand/bigo-logo-source.webp 离线生成（2026-09-26 换成站长定稿的新 logo）
 * （零依赖手写 PNG 编码，不用 next/og：standalone 下它有内存泄漏，
 * satori 的 WASM 还会把 CPU 打到 300%，这台 1.8G 内存的机器扛不住）。
 */
// 明确告诉浏览器前台是深色页面。
// 不声明的话，iOS Safari / 微信内置浏览器在系统暗夜模式下会对页面做自动反色：
// bg-white/5 这类近乎透明的底色被强制成不透明浅色、文字仍是白色，
// 买家看到的就是白底白字——卡密区曾因此完全不可见。
export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#000000',
}

/**
 * 各站长平台的归属验证 meta。值全部来自服务端环境变量，没配就不输出那一条。
 * 这些串是公开值（会明文出现在 HTML 里），不是密钥，但仍然走环境变量——
 * 换域名、换验证方式时不用改代码。
 */
function otherVerification(): Record<string, string> | undefined {
  const out: Record<string, string> = {}
  if (process.env.BING_SITE_VERIFICATION) out['msvalidate.01'] = process.env.BING_SITE_VERIFICATION
  if (process.env.BAIDU_SITE_VERIFICATION) {
    out['baidu-site-verification'] = process.env.BAIDU_SITE_VERIFICATION
  }
  return Object.keys(out).length ? out : undefined
}

/** 换站标时 +1。理由见下面 icons 那段注释。3 = 2026-09-26 换成站长定稿的新 logo（同时用于分享图地址） */
const ICON_VERSION = 3

/**
 * 主站的站点级 metadata：与改造前的模块级常量逐字段相同（主站 origin 就是 siteOrigin()）。
 * 渠道站在它的基础上只改三处（设计 4.8）：metadataBase 换成渠道 origin（子页面相对的 canonical / og:url
 * 随之落到渠道域名）、robots 改为 noindex + follow（子页面继承；全仓没有页面显式写 index:true）、
 * 不输出站长平台验证 meta（那是主站域名的归属证明）。统一品牌下站名、分享图不变。
 * 2026-09-30 起兜底 title / description（含 og、twitter）另用渠道版（CHANNEL_TITLE / CHANNEL_DESCRIPTION，理由见其注释）。
 */
function siteMetadata(origin: string, isPlatform: boolean): Metadata {
  const base: Metadata = {
    metadataBase: new URL(origin),
    // 刻意不用 title.template：新闻详情页的 <title> 会被微信直接当分享标题读走，
    // 再自动追加一截站名只会把它挤爆。各页面自己写全标题。
    title: TITLE,
    description: DESCRIPTION,
    // 不写 keywords（2026-09-30 删，设计 §0.3 #26）：谷歌 2009 年就公开说过不读这个标签；原来的值全站相同，还带着零需求词「代充」
    applicationName: SITE_NAME,
    // 这里刻意不写 alternates.canonical：Next 的 metadata 是逐段继承的，
    // 在根布局写死 canonical:'/' 会让全站每个页面都自称「我是首页的副本」，
    // 结果是除首页外全部被搜索引擎丢弃。canonical 只能由各页面自己声明。
    /*
     * 【图标地址必须带版本号】favicon 是浏览器缓存得最狠的一类资源：地址不变时
     * 即使服务端文件已经换了，老访客的标签页上仍然是旧图标，可能挂好几周，
     * 而且 Ctrl+F5 都不一定刷得掉（favicon 走的是独立的缓存）。
     * 2026-09-22 换站标时就撞上了这个：服务端发的明明是新图，页面上还是旧的。
     * 换图标时把 ?v= 往上加一位，这是唯一可靠的办法。
     */
    icons: {
      // favicon.ico 放在最前：多尺寸（16/32/48）的小图在标签页上比 512 缩下来的清楚；
      // 苹果桌面图标单独一张白底图（iOS 会把透明底渲染成黑色，见 gen-brand-assets.py）
      icon: [
        { url: `/favicon.ico?v=${ICON_VERSION}`, sizes: '16x16 32x32 48x48' },
        { url: `/logo-square.png?v=${ICON_VERSION}`, type: 'image/png', sizes: '512x512' },
      ],
      shortcut: [`/favicon.ico?v=${ICON_VERSION}`],
      apple: [{ url: `/apple-touch-icon.png?v=${ICON_VERSION}`, sizes: '180x180' }],
    },
    /*
     * 站长平台的归属验证 meta。值从环境变量来，没配就整条不输出。
     *
     * 【为什么走 meta 而不是上传 HTML 文件】验证文件一旦丢了（换服务器、清 public/）
     * 站点会被静默移出站长平台，而这件事没有任何告警。meta 跟着代码走，重建镜像就还在。
     *
     * 取值方法：
     *   Google → Search Console 添加「网址前缀」资源 → 选「HTML 标记」→
     *            复制 content="..." 里的那串，填进 GOOGLE_SITE_VERIFICATION
     *   Bing   → Webmaster Tools 可直接从 Google Search Console 导入，
     *            要手动验证就取 msvalidate.01 的值填 BING_SITE_VERIFICATION
     *   百度   → 百度搜索资源平台 → 站点管理 → 添加网站 → 选「HTML 标签验证」→
     *            取 baidu-site-verification 的值填 BAIDU_SITE_VERIFICATION
     *
     * 【为什么用一个对象拼而不是三个三元表达式】Next 的 verification.other 是一条
     * Record，给它 undefined 才会整段不输出。用展开的方式拼，缺哪个就少哪个键，
     * 再在最后判断「一个都没有就返回 undefined」——否则空对象会渲染出一个空的 meta 容器。
     */
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
      other: otherVerification(),
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'zh_CN',
      // 同样不写 url：继承下去会让所有页面的 og:url 都指向首页，转发链接会点错地方
      title: TITLE,
      description: DESCRIPTION,
      images: [{ url: `/og-default.png?v=${ICON_VERSION}`, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: TITLE,
      description: DESCRIPTION,
      images: [`/og-default.png?v=${ICON_VERSION}`],
    },
    robots: {
      index: true,
      follow: true,
      // 允许富摘要与大图预览，否则搜索结果里只有一行纯文字
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    formatDetection: {
      // iOS Safari 会把订单号、卡密里的数字串自动变成可拨打的电话链接，很难看且会误触
      telephone: false,
    },
    /*
     * 【百度移动适配声明】本站是响应式单 URL，同一个地址同时服务 PC 与手机。
     * applicable-device 告诉百度「这一页两端都适用」，免得它去找一个不存在的移动版。
     * 刻意不写 mobile-agent：那是「PC 页与移动页分属两个 URL」时才用的跳转声明，写了反而是错的。
     * 禁止百度转码（no-transform / no-siteapp）是 http-equiv 形式，Metadata API 的 other
     * 只能输出 name=，所以那两条写在下面 RootLayout 的 <head> 里。
     */
    other: {
      'applicable-device': 'pc,mobile',
    },
  }
  if (isPlatform) return base
  const { verification: _verification, ...rest } = base
  return {
    ...rest,
    title: CHANNEL_TITLE,
    description: CHANNEL_DESCRIPTION,
    openGraph: { ...base.openGraph, title: CHANNEL_TITLE, description: CHANNEL_DESCRIPTION },
    twitter: { ...base.twitter, title: CHANNEL_TITLE, description: CHANNEL_DESCRIPTION },
    robots: { index: false, follow: true },
  }
}

/**
 * 渠道白标（docs/多渠道分销-渠道品牌与公告.md）：在渠道 metadata 上再换站名、标题、描述、图标与分享图。
 * 没有白标（没改站名也没传 logo）的渠道原样返回——与改造前逐字相同。
 *  · 图标：有 logo 用 logo（标签页、苹果桌面图标同一张）；只改了站名没 logo 用站名首字生成的 SVG（不落盘）；
 *  · 分享图：有 logo 用 logo，没有就不给（og-default.png 上印着贝果字标）；
 *  · 标题 / 描述：渠道填了浏览器标题、分享摘要就用，没填则把原文里的「贝果科技」换成渠道站名。
 */
function brandedMetadata(meta: Metadata, brand: StoreBrand): Metadata {
  if (!isWhiteLabel(brand)) return meta
  // 只用于渠道站：兜底文案取渠道版 CHANNEL_TITLE / CHANNEL_DESCRIPTION（不带主站域名与大事记，A 包评审修复），再换站名。
  // keywords 2026-09-30 起全站不写（A 包），这里也不再补一个空的
  const title = brand.seoTitle ?? withBrandName(CHANNEL_TITLE, brand)
  const description = brand.seoDescription ?? withBrandName(CHANNEL_DESCRIPTION, brand)
  const icon = brand.logoUrl ?? initialIconDataUrl(brand.name)
  return brandShareImages(
    {
      ...meta,
      title,
      description,
      applicationName: brand.name,
      icons: { icon: [{ url: icon }], shortcut: [icon], apple: brand.logoUrl ? [{ url: brand.logoUrl }] : [] },
      openGraph: { ...meta.openGraph, siteName: brand.name, title, description },
      twitter: { ...meta.twitter, title, description },
    },
    brand,
  )
}

/**
 * 不包进 try（设计 4.4 第 7 条）：店面解析在构建期抛 DynamicServerError 把页面转为动态，吞掉就会按主站结果预渲染。
 * 没有店面（严格期未知 Host、域名停用）时按「非主站」处理：noindex，metadataBase 用平台 origin（该请求的页面本就 404）。
 */
export async function generateMetadata(): Promise<Metadata> {
  const sf = await getStorefront()
  if (sf && sf.kind === 'PLATFORM') return siteMetadata(sf.origin, true)
  const meta = siteMetadata(sf ? sf.origin : siteOrigin(), false)
  return sf ? brandedMetadata(meta, sf.brand) : meta
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 只把 code / kind / origin / features 交给客户端（toPublicStorefront 显式挑字段），费率、进货价、tenantId 不进 HTML
  const sf = await getStorefront()
  return (
    <html lang="zh-CN">
      {/* 百度转码退出声明（百度搜索资源平台的写法）：不许把页面转成它自己的「百度转码页 / site app」
          再呈现给手机用户——转码会丢掉样式与交互，买家看到的就不是我们的页面了。
          必须是 http-equiv：Next 的 metadata.other 只输出 name=，百度不认，所以直接写在 <head> 里，
          Next 会把它和 metadata 生成的标签合并。 */}
      <head>
        <meta httpEquiv="Cache-Control" content="no-transform" />
        <meta httpEquiv="Cache-Control" content="no-siteapp" />
      </head>
      <body className={inter.className}>
        <StorefrontProvider value={toPublicStorefront(sf)}>
          <AuthFetchPatch />
          {children}
        </StorefrontProvider>
      </body>
    </html>
  )
}
