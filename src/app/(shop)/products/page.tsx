// 【必须 force-dynamic】这一页现在要连库（服务端直出价格表 + ItemList 结构化数据），
// 而 next build 的 builder 容器不在 app-network 上、没有 DATABASE_URL。
// 一旦被当成静态路由预渲染，整个构建会直接失败（/news、/links、sitemap 同理）。
export const dynamic = 'force-dynamic'

import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { SITE_NAME } from '@/lib/product-seo'
import { JsonLd } from '@/lib/seo/jsonld'
import { breadcrumbJsonLd, productItemListJsonLd } from '@/lib/seo/graph'
import { Breadcrumbs } from '@/components/landing/landing-ui'
import ProductsClient from './products-client'

/**
 * 商品列表页。
 *
 * 【这一页此前在 Google 眼里几乎是空的】商品卡片全靠 products-client.tsx 的
 * useEffect + fetch('/api/products') 客户端取数，服务端 HTML 里一个商品名都没有。
 * 更要命的是 robots.txt 里 disallow 了 /api/ —— 连 Googlebot 的渲染器都不会去抓那个接口，
 * 所以「Google 会执行 JS」这条退路在这里是不成立的。
 * 结果就是：全站最该吃「ChatGPT 代充」「Claude 充值」这类词的列表页，
 * 正文里没有任何一个商品词、没有任何一个价格。
 *
 * 【改法：加一张服务端直出的价格表，而不是重写那 383 行】
 * 让客户端组件接收服务端数据要改它的取数、筛选、分页三条逻辑，风险不划算。
 * 这里在卡片区下面补一张「全部商品与价格一览」——
 *   · 对买家：一屏扫完所有型号与价格，比翻卡片快，本来就是列表页该有的东西；
 *   · 对爬虫：商品名、价格、库存状态、内链全部落在首屏 HTML 里。
 * 它**不是**给爬虫看的隐藏内容（那是 cloaking，会吃处罚），是真实可见的一块内容。
 */

const getProducts = cache(async () => {
  try {
    return await prisma.product.findMany({
      where: { status: 1 },
      select: {
        id: true,
        name: true,
        price: true,
        originalPrice: true,
        stock: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }],
      take: 200,
    })
  } catch (err) {
    // 库挂了不能让整页 500：价格表这一块直接不渲染，上面的客户端卡片区照常工作
    console.error('Products list SEO query error:', err)
    return []
  }
})

const TITLE = `AI 会员代充商品与价格 - ChatGPT Plus / Claude Pro 充值 - ${SITE_NAME}`
const DESCRIPTION =
  'ChatGPT Plus / Pro、Claude Pro / Max 5x 会员代充值价目表，另有 Codex 与 Claude 注册验证码接码、谷歌邮箱成品号。卡密自助充值，支持支付宝，可开增值税发票。'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  // 列表页会被带 ?ref= / ?category= 分享与抓取，canonical 一律指回干净地址
  alternates: { canonical: '/products' },
  openGraph: { type: 'website', title: TITLE, description: DESCRIPTION, url: '/products' },
}

export default async function ProductsPage() {
  const products = await getProducts()

  // 按分类分组，价格表按分类分段展示（买家找型号是按「我要充 ChatGPT 还是 Claude」找的）
  const groups = new Map<string, typeof products>()
  for (const p of products) {
    const key = p.category?.name || '其他'
    const arr = groups.get(key)
    if (arr) arr.push(p)
    else groups.set(key, [p])
  }

  return (
    <>
      <JsonLd
        data={[
          // 库不可达时 products 是空数组，这时不要输出一个 numberOfItems:0 的空 ItemList——
          // 那等于主动告诉搜索引擎「这个列表页什么都没有」，比不输出更糟
          ...(products.length
            ? [productItemListJsonLd(products, '/products')]
            : []),
          breadcrumbJsonLd([{ name: '首页', path: '/' }, { name: '全部商品' }]),
        ]}
      />
      {/* 可见面包屑。上面输出了 BreadcrumbList，页面上就必须真的有这一条——
          标记用户看不到的内容是 Google 结构化数据政策明令禁止的。
          放在客户端组件之前，它自己带 page-top 顶部留白，这里只占一行。 */}
      <div className="container relative page-top pb-0">
        <Breadcrumbs crumbs={[{ name: '首页', path: '/' }, { name: '全部商品' }]} />
      </div>
      <ProductsClient />

      {products.length > 0 && (
        <section className="container relative pb-20" aria-labelledby="price-table-heading">
          <div className="max-w-5xl mx-auto">
            <h2 id="price-table-heading" className="text-2xl lg:text-3xl font-bold mb-3">
              全部商品与价格一览
            </h2>
            <p className="text-white/40 text-sm lg:text-[15px] mb-8">
              价格随上游成本与汇率浮动，以下单时页面显示的实付金额为准。带「自助充值」字样的商品下单后发放卡密，
              你可以随时自行兑换；未使用的卡密长期有效。
            </p>

            {Array.from(groups.entries()).map(([categoryName, items]) => (
              <div key={categoryName} className="mb-10">
                <h3 className="text-lg font-semibold text-white/90 mb-4">{categoryName}</h3>
                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full text-sm lg:text-[15px]">
                    <thead>
                      <tr className="bg-white/5 text-white/50 text-left">
                        <th scope="col" className="px-4 py-3 font-medium">商品</th>
                        <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">价格</th>
                        <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((p) => {
                        const inStock = p.stock === -1 || p.stock > 0
                        return (
                          <tr key={p.id} className="border-t border-white/5">
                            <td className="px-4 py-3">
                              <Link
                                href={`/products/${p.id}`}
                                className="text-white/80 hover:text-white transition-colors"
                              >
                                {p.name}
                              </Link>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap font-semibold text-white">
                              ￥{Number(p.price).toFixed(0)}
                              {p.originalPrice != null && Number(p.originalPrice) > Number(p.price) && (
                                <span className="ml-2 text-white/30 font-normal line-through">
                                  ￥{Number(p.originalPrice).toFixed(0)}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {inStock ? (
                                <span className="text-emerald-400">有货</span>
                              ) : (
                                <span className="text-white/30">补货中</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <p className="text-white/40 text-sm">
              不确定该买哪一个？先看{' '}
              <Link href="/support" className="text-purple-400 hover:text-purple-300">
                常见问题
              </Link>
              ，或直接联系客服微信 <span className="font-mono text-white/60">GenuineMarxist</span>。
            </p>
          </div>
        </section>
      )}
    </>
  )
}
