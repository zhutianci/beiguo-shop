import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Home } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { getStorefront } from '@/lib/storefront/resolve'
import { storefrontFeatures } from '@/lib/storefront/public'
import { readSmsConfigCached } from '@/lib/jiema/config'
import { jiemaPublicOpen } from '@/lib/jiema-config-schema'
import { SITE_NAME } from '@/lib/product-seo'

/**
 * 全站 404（docs/SEO-重构/SEO-重构设计.md §3.2-K、§6.8，A 包）。
 *
 * 【为什么要有】没有这个文件时，Next 给的是英文的「404 | This page could not be found.」白底页：
 * 没有页头页脚，买家从搜索结果、旧分享链接点进一个下架商品，看到的是一张和本站毫无关系的空白页，只能关掉。
 *
 * 【它渲染在哪】根 not-found 只包在根 layout 里：不论是没匹配到的地址，还是 (shop) 下页面自己 notFound()，
 * 渲染出来的都是这一页，**不经过 (shop)/layout**（那是营销会话的文件，本方案不动它）。所以页头页脚在这里自己挂，
 * 取值口径与 (shop)/layout 一致：catalogOpen / registrationOpen 按店面状态、jiemaOpen = features.jiema && 主站 && jiemaPublicOpen。
 *
 * 【入口按店面给】
 *  · 主站：业务入口（充值、商品、接码〔只在对全部用户开放时〕、大事记）和客服入口；
 *  · 渠道站：只给首页和商品入口（渠道站关着落地页、大事记、接码，给了就是另一个 404）；
 *  · 渠道筹备期 / 已停业、以及没有店面的 Host：只给首页，也不挂页头页脚（DRAFT 对非预览访客整站是「暂停访问」页，不能在这里露出导航）。
 *
 * 【robots 不在这里写】Next 会给 404 自动加 noindex；根 layout 的 robots（含 googleBot 的 index）按设计维持原样，
 * 404 页因此同时有两条 robots，Google 取更严的 noindex，记为已知、无害（§6.8：改它要动 itest-tenant/wp1.ts:478 的断言）。
 */
export const metadata: Metadata = {
  title: `页面不存在 - ${SITE_NAME}`,
  description: '你访问的页面不存在，可能已下线、地址有变，或链接输入有误。可以从首页或下面的入口继续浏览。',
}

type Entry = { href: string; label: string; desc: string }

export default async function NotFound() {
  // 店面解析不进 try（设计 4.4 第 7 条）；没有店面（未知 Host）时为 null
  const sf = await getStorefront()
  const isPlatform = !!sf && sf.kind === 'PLATFORM'
  const features = storefrontFeatures(sf)
  // 渠道筹备期（非预览访客看到的是整站暂停页）与已停业：不露导航，只给首页
  const shellOpen = !!sf && (isPlatform || sf.status === 'ACTIVE' || sf.status === 'SUSPENDED')
  const catalogOpen = shellOpen
  const registrationOpen = isPlatform || (!!sf && sf.status !== 'DRAFT' && sf.status !== 'TERMINATED')
  let jiemaOpen = false
  if (isPlatform && features.jiema) {
    // 读不到按关（fail-closed）：404 页不能因为接码配置坏了变成 500
    jiemaOpen = jiemaPublicOpen(await readSmsConfigCached().catch(() => null))
  }

  const entries: Entry[] = []
  if (isPlatform) {
    if (features.landing) entries.push({ href: '/chongzhi', label: 'AI 会员充值', desc: 'ChatGPT、Claude、Grok 各档位的价格与购买方式' })
    entries.push({ href: '/products', label: '全部商品', desc: '在售商品与实时价格' })
    if (jiemaOpen) entries.push({ href: '/jiema', label: '短信接码', desc: '海外手机号在线接收验证码' })
    if (features.news) entries.push({ href: '/news', label: 'AI 圈大事记', desc: '按事件整理的 AI 行业动态' })
    entries.push({ href: '/support', label: '常见问题与客服', desc: '订单、退款、开票问题与客服联系方式' })
  } else if (catalogOpen) {
    entries.push({ href: '/products', label: '全部商品', desc: '在售商品与价格' })
  }

  const body = (
    <div className="relative flex-1 page-top pb-24">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="container relative">
        <div className="mx-auto max-w-2xl text-center">
          <p className="ui-eyebrow mb-4 font-mono">404</p>
          <h1 className="mb-5 text-3xl font-semibold tracking-tight md:text-5xl">
            <span className="gradient-text">页面不存在</span>
          </h1>
          <p className="text-base leading-relaxed text-white/60 md:text-lg">
            你访问的地址没有对应的页面：可能已经下线、地址有变，或者链接输入有误。
            {entries.length > 0 ? '可以回到首页，或从下面的入口继续。' : '可以回到首页继续浏览。'}
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="ui-btn ui-btn-primary px-7"
            >
              <Home className="h-4 w-4" />
              返回首页
            </Link>
          </div>
        </div>

        {entries.length > 0 && (
          <nav aria-label="继续浏览" className="mx-auto mt-14 grid max-w-3xl gap-3 sm:grid-cols-2">
            {entries.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className="group ui-card ui-card-link flex items-center justify-between gap-4 px-5 py-4"
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-white/90">{e.label}</span>
                  <span className="mt-0.5 block text-sm text-white/45">{e.desc}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/35 transition-transform group-hover:translate-x-0.5 group-hover:text-white/70" />
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  )

  if (!shellOpen) return <div className="flex min-h-screen flex-col">{body}</div>

  // 与 (shop)/layout 同一个外壳类名：--header-h（.page-top 从它推导）挂在这一层
  return (
    <div className="shop-shell flex min-h-screen flex-col">
      <Header catalogOpen={catalogOpen} registrationOpen={registrationOpen} jiemaOpen={jiemaOpen} />
      <main className="flex flex-1 flex-col">{body}</main>
      <Footer catalogOpen={catalogOpen} jiemaOpen={jiemaOpen} />
    </div>
  )
}
