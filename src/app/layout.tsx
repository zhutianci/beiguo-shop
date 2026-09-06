import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthFetchPatch } from '@/components/auth-fetch-patch'
import { siteOrigin } from '@/lib/news/format'

const inter = Inter({ subsets: ['latin'] })

const SITE_NAME = '贝果科技'
const TITLE = '贝果科技 - Claude & ChatGPT AI 订阅服务'
const DESCRIPTION =
  '贝果科技 - 专业的 AI 服务代开平台，提供 Claude Pro、Claude MAX、ChatGPT Plus、ChatGPT Pro 等订阅服务'

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

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  // 刻意不用 title.template：新闻详情页的 <title> 会被微信直接当分享标题读走，
  // 再自动追加一截站名只会把它挤爆。各页面自己写全标题。
  title: TITLE,
  description: DESCRIPTION,
  keywords: '贝果科技,Claude,ChatGPT,AI,代开,订阅,Pro,MAX,Plus',
  applicationName: SITE_NAME,
  // 这里刻意不写 alternates.canonical：Next 的 metadata 是逐段继承的，
  // 在根布局写死 canonical:'/' 会让全站每个页面都自称「我是首页的副本」，
  // 结果是除首页外全部被搜索引擎丢弃。canonical 只能由各页面自己声明。
  icons: {
    icon: [{ url: '/logo-square.png', type: 'image/png', sizes: '512x512' }],
    shortcut: ['/logo-square.png'],
    apple: [{ url: '/logo-square.png', sizes: '512x512' }],
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
