// 【必须 force-dynamic】首页底部那块「按服务找」要连库取实时最低价，
// 而 builder 容器没有 DATABASE_URL，被当成静态路由预渲染会让整个构建失败。
export const dynamic = 'force-dynamic'

// Server 外壳：首页此前整页是客户端组件，于是拿不到 canonical，也输出不了任何结构化数据
// （线上实测：首页 JSON-LD 块数 = 0）。交互与动效全留在 home-client.tsx。
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { JsonLd } from '@/lib/seo/jsonld'
import { organizationJsonLd, webSiteJsonLd } from '@/lib/seo/graph'
import { getLandingProducts, inStock, lowestPrice, matchProducts } from '@/lib/landing/products'
import { LANDING_HUB, LANDINGS, landingPath } from '@/lib/landing/registry'
import HomeClient from './home-client'

/**
 * 首页标题与描述。
 *
 * 【为什么要改掉原来那条】原标题是「贝果科技 - Claude & ChatGPT AI 订阅服务」，
 * 描述里写的是「专业的 AI 服务代开平台」。问题出在「代开」这个词上：
 * 2026-09-19 实测 Google 中文下拉建议，`chatgpt代开` 与 `claude代开` 的联想数都是 **0**，
 * 而同位置 `chatgpt充值` 有 8 条、`chatgpt plus 购买` 有 10 条。
 * 也就是说全站把主营业务写成了一个没有人搜的词——不是排得靠后，是根本没有 query 能匹配进来。
 *
 * 【主词的选择】「充值」最贴合本站的卡密交付方式，「代充」只有 3 条联想
 * 且全是信任审查意图（靠谱吗 / 知乎 / v2ex），所以「代充」不当首页主词，
 * 放到 /chongzhi 那一页去承接。品牌词放最后：搜「贝果科技」的人本来就找得到，
 * 最前面的位置该留给品类词。
 */
const TITLE = 'ChatGPT Plus / Claude Pro 充值代充 - 卡密自助兑换 - 贝果科技'
const DESCRIPTION =
  '贝果科技提供 ChatGPT Plus / Pro、Claude Pro / Max 5x 会员充值与代充：卡密自助兑换，无需信用卡，支付宝付款，可开增值税发票。另有 Codex 接码、Claude 注册与 KYC 认证。'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // 根 layout 刻意不写 canonical（写了会让全站每页都自称首页副本），
  // 所以首页自己的 canonical 只能写在这里。带 ?ref= / ?s= 的分享链接全部指回这条干净地址。
  alternates: { canonical: '/' },
  openGraph: { type: 'website', title: TITLE, description: DESCRIPTION, url: '/' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
}

export default async function HomePage() {
  const all = await getLandingProducts()
  // 复用 lowestPrice，不要在这里再实现一遍——两份实现迟早会漂。
  // hasStock 也要带上：唯一档位缺货的服务不能在首页被当成有货推出去。
  const cards = LANDINGS.map((l) => {
    const items = matchProducts(all, l.match)
    return { def: l, low: lowestPrice(items), hasStock: items.some(inStock) }
  })

  // 首页那条信任数据带的数字。复用上面同一份快照，不额外打库。
  // 传给客户端组件是有意的：客户端组件同样会被服务端渲染，值会进服务端 HTML——
  // 而这正是要解决的问题（原来写死 useState(0)，爬虫读到的是「0 个用户」）。
  const stats = {
    totalSales: all.reduce((n, p) => n + (p.sales || 0), 0),
    skuCount: all.length,
  }

  return (
    <>
      {/* Organization 与 WebSite 全站只在首页输出一次，其余页面通过 @id 引用即可。
          每页都重复一遍不会加分，只会让每一页多出几百字节。 */}
      <JsonLd data={[organizationJsonLd(), webSiteJsonLd()]} />

      <HomeClient stats={stats} />

      {/*
        服务端直出的「按服务找」区块。
        首页原本的商品卡片是 home-client.tsx 里 useEffect + fetch('/api/products') 拉的，
        服务端 HTML 里一个商品词、一个价格都没有；而 robots.txt 里 disallow 了 /api/，
        连 Googlebot 的渲染器都不会去抓那个接口——「反正 Google 会执行 JS」这条退路不成立。
        这一块补上真实价格与带关键词的内链，同时它也是买家真的用得上的一个入口。
      */}
      {cards.length > 0 && (
        <section className="container relative pb-24" aria-labelledby="home-services-heading">
          <div className="mx-auto max-w-6xl">
            <h2 id="home-services-heading" className="mb-3 text-2xl font-bold lg:text-3xl">
              按服务找：充值、注册与认证
            </h2>
            <p className="mb-8 text-sm text-white/40 lg:text-[15px]">
              每一项都有独立的说明页，写清楚了当前价格、该选哪个档位，以及兑换前必须先确认的事。
              <br />
              <strong className="text-white/60">所有标价均为不含税价</strong>
              ，需要发票的在售价之外另付 6% 税费，收据不涉及税费。
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map(({ def, low, hasStock }) => (
                <Link
                  key={def.slug}
                  href={landingPath(def.slug)}
                  className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <span className="font-semibold text-white transition-colors group-hover:text-purple-300">
                      {def.navLabel}
                    </span>
                    {low != null && (
                      <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-white/80">
                        ￥{low.toFixed(0)} 起
                      </span>
                    )}
                  </div>
                  <span className="mb-4 flex-1 text-sm leading-relaxed text-white/45">{def.blurb}</span>
                  <span className="inline-flex items-center gap-1 text-sm text-purple-400">
                    {hasStock ? '查看详情' : '查看详情（补货中）'}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>

            <p className="mt-8 text-sm text-white/40">
              也可以看{' '}
              <Link href={LANDING_HUB.path} className="text-purple-400 hover:text-purple-300">
                充值总览与价格表
              </Link>
              ，或直接翻{' '}
              <Link href="/products" className="text-purple-400 hover:text-purple-300">
                全部商品
              </Link>
              。第一次买建议先看{' '}
              <Link href="/support" className="text-purple-400 hover:text-purple-300">
                常见问题
              </Link>
              。
            </p>
          </div>
        </section>
      )}
    </>
  )
}
