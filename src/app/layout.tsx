import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthFetchPatch } from '@/components/auth-fetch-patch'
import { siteOrigin } from '@/lib/news/format'

const inter = Inter({ subsets: ['latin'] })

const SITE_NAME = '贝果科技'
const TITLE = '贝果科技 - ChatGPT Plus / Claude Pro 充值与代充'
/*
 * 【2026-09-19 改词，不是润色】原文写的是「AI 服务代开平台」。
 * 实测 Google 中文下拉建议：`chatgpt代开`、`claude代开` 的联想数都是 **0**，
 * 而同位置 `chatgpt充值` 有 8 条、`chatgpt plus 购买` 有 10 条、`chatgpt代充` 有 3 条。
 * 也就是说「代开」这个词没有人搜——全站把主营业务写成了一个零需求词，
 * 搜索引擎没有任何 query 能把这个站匹配进来。
 * 主词改为「充值 / 购买」，「代充」作为次要说法保留（搜它的人是在查你靠不靠谱，
 * 是转化率很高的一批），「代开 / 代购 / 代订阅」全部删掉。
 */
const DESCRIPTION =
  '贝果科技提供 ChatGPT Plus / Pro、Claude Pro / Max 会员充值与代充：卡密自助兑换，支持支付宝付款，无需信用卡，可开增值税发票。'

/**
 * 站点级 metadata。子页面（如 /news/[slug] 的 generateMetadata）只需要覆盖
 * title / description / openGraph，其余字段自动继承这里。
 *
 * 【metadataBase 是必需的】没有它，子页面里写的相对 og:image / canonical
 * 会被 Next 原样输出成相对路径，而微信与各家爬虫都不接受相对地址的 og:image——
 * 表现是「本地预览没问题、发到群里没缩略图」，很难查。
 *
 * 【图标】public/logo-square.png 与 og-default.png 由 scripts/gen-og-image.js 离线生成
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

/** 换站标时 +1。理由见下面 icons 那段注释 */
const ICON_VERSION = 2

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  // 刻意不用 title.template：新闻详情页的 <title> 会被微信直接当分享标题读走，
  // 再自动追加一截站名只会把它挤爆。各页面自己写全标题。
  title: TITLE,
  description: DESCRIPTION,
  // keywords 这个 meta 谷歌 2009 年就公开说过完全不参与排序，留着只是不让它写错。
  keywords: '贝果科技,ChatGPT Plus 充值,ChatGPT 代充,Claude Pro 充值,Claude 会员,AI 订阅充值',
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
    icon: [{ url: `/logo-square.png?v=${ICON_VERSION}`, type: 'image/png', sizes: '512x512' }],
    shortcut: [`/logo-square.png?v=${ICON_VERSION}`],
    apple: [{ url: `/logo-square.png?v=${ICON_VERSION}`, sizes: '512x512' }],
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
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og-default.png'],
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AuthFetchPatch />
        {children}
      </body>
    </html>
  )
}
