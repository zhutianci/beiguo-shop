'use client'

/*
 * 商品详情页的交互层。原本整页就是这一个客户端组件，
 * 2026-09-14 拆出同目录的 page.tsx 作为 Server 外壳，只为了能写 generateMetadata
 * 与 Product 结构化数据 —— 客户端组件用不了它们，导致此前每个商品页的
 * <title> 和 <meta description> 全站一模一样。
 *
 * 2026-09-19 再改一次：外壳把商品数据作为 initialProduct 传进来。
 *
 * 【为什么必须这么做】客户端组件在 Next 里**是会被服务端渲染的**，
 * 但此前数据来自 useEffect 里的 fetch —— SSR 那一刻 product 还是 null，
 * 渲染出来的是「加载中…」。结果是全站最赚钱的一类页面，
 * 服务端 HTML 里既没有 H1、也没有商品名、价格、说明，一个字都没有
 * （线上实测 /products/16：`<h1` 出现 0 次）。
 *
 * 传了 initialProduct 之后，SSR 直接用真实数据渲染整页，H1 与正文都进 HTML；
 * 挂载后那次 fetch 照常跑——它还有用：带 ?ref= 时要把价格换成推广人的专属价。
 * 也就是说服务端 HTML 里永远是公开定价（与 canonical、JSON-LD 一致），
 * 专属价在水合之后才出现，这正是我们要的。
 *
 * 2026-09-24 第三次：
 *   · 去掉 framer-motion。它把每个 motion 元素的 initial（opacity:0）原样写进 SSR 标记，
 *     线上 /products/16 有 10 个元素带着 style="opacity:0"——面包屑、H1 卡片、流程、
 *     须知、整个价格框，对不执行 JS 的读者（百度基本不跑 JS）是「在 DOM 里但看不见」。
 *     入场动效改用 globals.css 的 .rise-in（纯 CSS，SSR 标记里没有内联隐藏）。
 *   · 「开通流程」「购买须知」搬进服务端直出的「商品介绍」区（components/products/product-intro.tsx，
 *     经 page.tsx 作为 children 传进来），并且按交付方式分口径。
 *     这里原来对全部商品无条件渲染「开通后有效期为 30 天」「即时发卡 / 付款后立即发放」
 *     「正规渠道」——对年费档、接码档、人工档都不成立，「正规渠道」则无从核验。
 *   · 保留 'use client'：购买与联系客服两个弹窗要用状态。
 */

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Building2, Check, Clock, Headphones } from 'lucide-react'
import { PurchaseModal } from '@/components/purchase-modal'
import { ContactModal } from '@/components/contact-modal'
import { PRODUCT_GRADIENT, deliveryBadge, productTag } from '@/components/products/gradient'
import { captureRefFromUrl } from '@/lib/ref'
import { useStorefront } from '@/components/storefront-provider'
import { STOCK_TONE_CLASS, stockLevel } from '@/lib/stock-level'

interface Product {
  id: number
  name: string
  description: string | null
  price: string | number
  originalPrice: string | number | null
  features: string | null
  image?: string | null
  stock: number
  sales: number
  deliveryType?: string
  category: { id: number; name: string }
}

/**
 * features 是 TEXT 列里的 JSON 字符串数组。
 *
 * 【只保留字符串项】原来「是数组就原样返回」：后台填进 [{"title":"x"}] 这种对象数组，
 * 渲染时就是「Objects are not valid as a React child」——整页 SSR 500。
 * 与 lib/product-intro.ts 的 parseFeatures 同一口径（那个文件依赖 node:crypto，客户端组件不能 import），
 * 改一处要一起改；后台保存时也已经按同一条规则校验（isFeaturesJson）。
 */
function parseFeatures(features: string | null): string[] {
  if (!features) return []
  try {
    const parsed: unknown = JSON.parse(features)
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
 * 价格框下面那三条「为什么可以放心下」。每一条都必须对这个商品成立：
 * 交付那一条按交付方式分三种说法（口径同 lib/vmq.ts fulfillOrder：AUTO 发卡密、
 * 卡池不足转人工补发；SMS 付款后自动取号；其余置为处理中等人工）。
 * 原来这里写的是「正规渠道 / 安全可靠有保障」（无从核验）和对全部商品一样的「即时发卡」。
 */
function deliveryPromise(t?: string): { title: string; desc: string } {
  if (t === 'AUTO') return { title: '自动发卡', desc: '付款到账后自动发放，缺货时人工补发' }
  if (t === 'SMS') return { title: '自动取号', desc: '付款后系统自动取号接码，不发卡密' }
  return { title: '人工服务', desc: '付款后联系客服对接，不发卡密' }
}

export default function ProductDetailClient({
  initialProduct = null,
  children,
}: {
  /** 外壳查库后传进来的公开定价版本：用于 SSR 直出，顺带免掉首屏那一下「加载中」 */
  initialProduct?: Product | null
  /** 服务端直出的「商品介绍」区（page.tsx 装配），放进左栏、主视觉下面 */
  children?: ReactNode
}) {
  const params = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(initialProduct)
  // 有初始数据就不能再进 loading 分支——否则 SSR 渲染出来仍然是「加载中」，等于白传
  const [loading, setLoading] = useState(!initialProduct)
  const [notFound, setNotFound] = useState(false)
  // 没有 SSR 数据（外壳查库失败）且客户端这次也没取到——给「稍后重试」而不是「商品不存在」
  const [loadFailed, setLoadFailed] = useState(false)
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)

  const referralOn = useStorefront().features.referral
  useEffect(() => {
    // 渠道站内推硬关（设计 7.6）：不读、不记 ref；服务端本来也忽略它，这里是少发一个无意义的参数
    const r = referralOn ? captureRefFromUrl() : null
    /*
     * 【只有真正的 404 才算「商品不存在」】原来 success:false 一律 setNotFound(true)：
     * 接口偶发一次库超时（error('获取商品详情失败')，HTTP 400），
     * 就会把服务端已经正确渲染好的整页换成「商品不存在」。
     * 现在：404 → 商品确实下架/不存在；其余失败 → 有 SSR 数据就保持原样（只是拿不到专属价），
     * 没有 SSR 数据才提示稍后重试。
     */
    fetch(`/api/products/${params.id}${r ? `?ref=${encodeURIComponent(r)}` : ''}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null)
        if (data?.success) {
          setProduct(data.data)
        } else if (res.status === 404) {
          setNotFound(true)
        } else if (!initialProduct) {
          setLoadFailed(true)
        }
      })
      .catch(() => {
        if (!initialProduct) setLoadFailed(true)
      })
      .finally(() => setLoading(false))
    // initialProduct 只在首屏用一次，不应该让它的引用变化触发重取
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen page-top pb-20 flex items-center justify-center">
        <div className="text-white/40">加载中...</div>
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen page-top pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white/40 mb-4">
            {loadFailed && !notFound ? '商品信息暂时取不到，请稍后刷新重试' : '商品不存在'}
          </div>
          <Link href="/products" className="text-purple-400 hover:text-purple-300">
            返回商品列表
          </Link>
        </div>
      </div>
    )
  }

  const gradient = PRODUCT_GRADIENT(product.id)
  // 认不出档位就不显示标签——原来的兜底是「NEW」，挂在已售 117 单的商品上
  const tag = productTag(product.name)
  const badge = deliveryBadge(product.deliveryType)
  const isAuto = product.deliveryType === 'AUTO'
  const isSms = product.deliveryType === 'SMS'
  const features = parseFeatures(product.features)
  const price = Number(product.price)
  const rawOriginal = product.originalPrice == null ? null : Number(product.originalPrice)
  /*
   * 【划线价只在确实高于现价时显示】带 ?ref= 时接口回的是
   * originalPrice: 公开原价 ?? 公开价——专属价高于公开价、且商品没设原价时，
   * 原来会显示成「¥150 划线¥140」。列表页一直有这道判断，详情页漏了。
   */
  const originalPrice = rawOriginal != null && rawOriginal > price ? rawOriginal : null
  const savings = originalPrice != null ? originalPrice - price : 0
  const promise = deliveryPromise(product.deliveryType)

  return (
    /* 顶部留白走 .page-top，不再写死 pt-32：它从 globals.css 的 --header-h 推导，
       移动端仍是 112+16=128px（与原来的 pt-32 完全一致），lg 起跟着矮下来的
       头部收到 96+16=112px。以后改头部高度只改 --header-h 一处，不用再追七八个文件 */
    <div className="min-h-screen page-top pb-20 lg:pb-28">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container relative">
        {/* 面包屑。原来这里只有一个「返回商品列表」，换成完整路径有两个收益：
            ① 页面外壳（page.tsx）里输出的 BreadcrumbList 结构化数据必须对应
               页面上**看得见**的面包屑，否则属于「标记了用户看不到的内容」，是违规标记；
            ② 搜索结果里那行 `贝果科技 › 商品 › ChatGPT` 会替换掉裸 URL，点击率更好。
            返回箭头保留在最前面，移动端的返回手感不变。 */}
        <nav aria-label="面包屑" className="rise-in flex items-center gap-2 text-sm text-white/40 mb-12 flex-wrap">
          <Link href="/products" className="text-white/60 hover:text-white transition-colors group inline-flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            返回
          </Link>
          <span className="text-white/20">|</span>
          <Link href="/" className="hover:text-white transition-colors">
            首页
          </Link>
          <span className="text-white/20">/</span>
          <Link href="/products" className="hover:text-white transition-colors">
            全部商品
          </Link>
          {/* 【这里刻意没有分类那一级】分类是 /products?category=N 这个筛选视图，
              它的 canonical 指回 /products。把它写进层级，页面上可见的面包屑
              就会比 page.tsx 里输出的 BreadcrumbList 多一级，两边对不上——
              而「标记与页面不一致」本身就是结构化数据政策要挡的东西。 */}
          <span className="text-white/20">/</span>
          <span className="text-white/70 truncate max-w-[16rem]">{product.name}</span>
        </nav>

        {/* 桌面端「左内容 / 右下单卡」两栏：lg 起 2:1 分栏，右栏 sticky 跟随滚动，
            购买入口在整页任何位置都留在视野内；xl 再把栏间距拉到 40px，避免两栏黏在一起。

            【三块而不是两列】主视觉 / 价格框 / 商品介绍按这个顺序写在 DOM 里：
            手机端单列时价格框紧跟在主视觉后面——商品介绍有六七节，
            要是价格框排在它后面，手机上得划过一整篇说明才找得到「立即购买」。
            桌面端用显式的行列把价格框放回右栏，并让它跨两行、sticky 跟随。 */}
        <div className="grid lg:grid-cols-3 gap-8 xl:gap-10">
          <div className="relative rise-in lg:col-span-2 lg:row-start-1">
            <div className={`absolute -inset-[1px] bg-gradient-to-r ${gradient} rounded-3xl opacity-30 blur-md`} />

            {/*
              主视觉。结构照着「标题整行 → 图片左 / 说明右」来：
              图片单独占一块正方形，而不是浮在标题上方的一个小方块——
              之前那版就是这么写的，图片孤零零挂在左上角，和整张卡片没有任何关系。

              【右栏必须有「一定有内容」的东西】库里多数商品的 description 只有几个字
              （商品 16 就四个字「自助充值」），features 目前全是空的。
              如果右栏只放描述，两栏会比一栏更空。所以右栏底部固定放一组关键信息
              （交付方式 / 库存 / 累计成交 / 分类）——这些每个商品都有，
              而且正好是买家在这一屏想确认的事。

              【没有图时不留空格】不是把图片换成占位块，而是整块退回单栏——
              占位块只是把「空」换了个位置。
            */}
            <div className="relative glass rounded-3xl p-6 sm:p-8 md:p-10">
              {/* 徽章行 */}
              <div className="flex items-center gap-2.5 mb-5 flex-wrap">
                {tag && (
                  <div className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${gradient}`}>{tag}</div>
                )}
                <span className="text-sm text-white/40">{product.category.name}</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${badge.cls}`}>
                  {badge.label}
                </span>
              </div>

              {/* 标题整行。原来是 text-5xl/6xl（48–60px）——那个尺寸压在一张
                  240px 的图上面，比例是失衡的，长商品名还会占掉三四行。
                  降一档之后标题仍然是这一屏的第一视觉，但不再压住下面整块。 */}
              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight leading-[1.15]">
                {product.name}
              </h1>

              {/* 图片左 / 说明右。没有图时整块退回单栏 */}
              <div
                className={
                  product.image
                    ? 'mt-7 grid gap-6 sm:gap-8 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]'
                    : 'mt-7'
                }
              >
                {product.image && (
                  <div className="relative mx-auto w-full max-w-[15rem] md:mx-0">
                    {/* 图片背后压一层同色渐变辉光：让它和整张卡片是一体的，
                        而不是「一张贴上去的图」。blur 之后只剩氛围，不会喧宾夺主 */}
                    <div
                      className={`absolute -inset-2 rounded-3xl bg-gradient-to-br ${gradient} opacity-20 blur-xl`}
                      aria-hidden="true"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image}
                      alt={product.name}
                      width={480}
                      height={480}
                      className="relative aspect-square w-full rounded-2xl border border-white/10 object-cover"
                    />
                  </div>
                )}

                {/* flex 列 + 下面那块 mt-auto：让关键信息贴着图片底边。
                    多数商品的描述只有几个字，不这么做右下角会空掉一大块，
                    整张卡片看起来像是没排完 */}
                <div className="flex min-w-0 flex-col">
                  {product.description && (
                    <p className="text-white/60 text-[15px] sm:text-base leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  {/* 特性只以标签的形式出现一次。原来前 4 条还会再渲染成一组「服务亮点」卡片，
                      每张卡的说明都是同一句「专业服务保障」——重复内容加一句无从核验的空话 */}
                  {features.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {features.map((feature, i) => (
                        <div
                          key={i}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm text-white/80"
                        >
                          <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 关键信息。每个商品都有，右栏不会因为描述短就空掉 */}
                  <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/[0.07] pt-5 text-sm md:mt-auto">
                    <div>
                      <dt className="text-white/35 text-xs mb-1">交付方式</dt>
                      <dd className="text-white/80">
                        {isAuto ? '付款后自动发卡' : isSms ? '付款后自动取号' : '人工对接'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-white/35 text-xs mb-1">库存</dt>
                      <dd>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STOCK_TONE_CLASS[stockLevel(product.stock).tone]}`}
                        >
                          {stockLevel(product.stock).label}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-white/35 text-xs mb-1">累计成交</dt>
                      <dd className="text-white/80">{product.sales} 笔</dd>
                    </div>
                    <div>
                      <dt className="text-white/35 text-xs mb-1">所属分类</dt>
                      <dd className="text-white/80 truncate">{product.category.name}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div
            className="rise-in lg:col-start-3 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-32 self-start"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="relative">
              <div className={`absolute -inset-[1px] bg-gradient-to-r ${gradient} rounded-3xl opacity-50 blur-md`} />

              <div className="relative glass rounded-3xl p-8 xl:p-9">
                <div className="mb-6">
                  <div className="text-sm text-white/50 mb-2">服务价格</div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl xl:text-6xl font-bold">¥{price.toFixed(0)}</span>
                    {originalPrice != null && (
                      <span className="text-lg text-white/30 line-through">¥{originalPrice.toFixed(0)}</span>
                    )}
                  </div>
                  {/* 原来这里还跟着一句「限时优惠」——没有任何截止时间，不能这么写 */}
                  {savings > 0 && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r ${gradient}`}>
                        省 ¥{savings.toFixed(0)}
                      </span>
                    </div>
                  )}

                  {/* 计费披露就放在价格旁边：这一页就是下单页，而此前全页正文里没有一个字提到不含税。
                      6% 即 lib/invoice.ts 的 TAX_RATE——那个文件 import 了 node:crypto，
                      客户端组件不能直接引，只能在这里写死；改税点时这里要一起改。 */}
                  <p className="mt-3 text-xs leading-relaxed text-white/45">
                    标价不含税，开票另付 6% · 仅支持支付宝 · 登录后下单
                  </p>

                  {/* 销量 + 库存。
                      库存只给档位不给具体数字——理由见 lib/stock-level.ts：
                      具体数量对买家没用，对同行有用。能不能下单仍由服务端按真实库存判定。 */}
                  <div className="flex items-center gap-3 mt-4 text-sm text-white/50">
                    <span>已售 <span className="text-white/80 font-medium">{product.sales}</span></span>
                    <span className="text-white/20">·</span>
                    {(() => {
                      const lv = stockLevel(product.stock)
                      return (
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STOCK_TONE_CLASS[lv.tone]}`}
                        >
                          {lv.label}
                        </span>
                      )
                    })()}
                  </div>
                </div>

                <button
                  onClick={() => setPurchaseOpen(true)}
                  className={`group w-full py-4 xl:py-[18px] xl:text-lg rounded-xl font-semibold bg-gradient-to-r ${gradient} flex items-center justify-center gap-2 hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all mb-3`}
                >
                  立即购买
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setContactOpen(true)}
                  className="w-full py-4 xl:py-[18px] xl:text-lg rounded-xl font-medium glass hover:bg-white/10 transition-colors"
                >
                  联系客服
                </button>

                <div className="my-6 h-px bg-white/10" />

                <div className="space-y-3">
                  {/* 原来是「正规渠道 / 安全可靠有保障」：无从核验，还和「封号不质保」自相矛盾。
                      换成买家自己查得到的事实：经营主体。开票口径就在上面价格旁边那一行
                      （把「能开票」当背书讲时必须跟着「标价不含税、另付 6%」，这里不再单说一遍） */}
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-white/5 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <div className="font-medium">经营主体可查</div>
                      <div className="text-xs text-white/40">益阳市赫山区必高科技有限公司</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-white/5 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <div className="font-medium">{promise.title}</div>
                      <div className="text-xs text-white/40">{promise.desc}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-white/5 flex items-center justify-center">
                      <Headphones className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <div className="font-medium">客服时间</div>
                      {/* 原来写「7×12 小时」，和购买须知里的「9:00-22:00」（13 小时）自相矛盾 */}
                      <div className="text-xs text-white/40">9:00-22:00 · 微信 GenuineMarxist</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 商品介绍：服务端组件，经 page.tsx 传进来。库挂了那一次 SSR 没有它，这里就什么都不放 */}
          {children && <div className="rise-in min-w-0 lg:col-span-2 lg:row-start-2">{children}</div>}
        </div>
      </div>

      <PurchaseModal
        open={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        product={{
          id: product.id,
          name: product.name,
          price: price,
          originalPrice: originalPrice ?? price,
          gradient,
        }}
      />

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  )
}
