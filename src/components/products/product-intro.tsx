import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight, BookOpen, HelpCircle, Layers, ListOrdered, Receipt, ShieldCheck, Truck } from 'lucide-react'
import type { ProductIntro } from '@/lib/product-intro'
import { PRODUCT_GRADIENT } from '@/components/products/gradient'

/**
 * 商品详情页的「商品介绍」区。内容由 lib/product-intro.ts 装配，这里只管排版。
 *
 * 【必须是 Server Component，不要加 'use client'】这一块存在的意义是让正文真的出现在
 * 服务端 HTML 里——百度几乎不执行 JS，旧版商品页的正文就是因为 framer-motion 的
 * initial={{opacity:0}} 被写进 SSR 标记，对不跑 JS 的爬虫整块不可见。
 * 它经由 page.tsx 作为 children 传进客户端组件 ProductDetailClient，渲染在左栏里，
 * 客户端组件只是摆放位置，不参与它的渲染。
 *
 * 【标题层级】H1 是商品名（在客户端组件里），这里每一节是 H2，步骤与问答是 H3。
 * 刻意不输出 FAQPage 结构化数据：商品页只出 Product/Offer + Organization + BreadcrumbList，
 * 问答在这里只是给人看的正文。
 *
 * 配色：店铺前台是深色玻璃风，不能用 components/ui 的 Card / Button（那是白底后台组件）。
 */

const PANEL = 'rounded-2xl border border-white/10 bg-white/[0.04] p-6 lg:p-8'
/* 左栏在桌面端约 810px，16px 字号下一行能塞进 50 个汉字，超出中文舒适阅读区（约 35~45 字）。
   行长封顶 680px（≈42 字）；用 px 不用 ch——ch 按西文 "0" 算，对中文会少算近一半 */
const PROSE = 'text-sm lg:text-base leading-relaxed lg:leading-[1.9] text-white/65 lg:max-w-[680px]'

function Heading({ id, icon, children }: { id: string; icon: ReactNode; children: ReactNode }) {
  return (
    <h2 id={id} className="scroll-below-header mb-5 flex items-center gap-2 text-xl font-bold lg:text-2xl">
      {icon}
      {children}
    </h2>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className={`space-y-2.5 ${PROSE}`}>
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2">
          <span className="mt-[0.1em] text-white/30" aria-hidden="true">
            ·
          </span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

export function ProductIntroSection({ intro, productId }: { intro: ProductIntro; productId: number }) {
  const gradient = PRODUCT_GRADIENT(productId)

  return (
    <div className="space-y-6 lg:space-y-8">
      {intro.about && (
        <section className={PANEL} aria-labelledby="intro-about">
          <Heading id="intro-about" icon={<BookOpen className="h-5 w-5 text-purple-400" />}>
            商品说明
          </Heading>
          <p className={PROSE}>{intro.about}</p>
        </section>
      )}

      <section className={PANEL} aria-labelledby="intro-delivery">
        <Heading id="intro-delivery" icon={<Truck className="h-5 w-5 text-emerald-400" />}>
          交付方式与时效
        </Heading>
        <Bullets items={intro.deliveryPoints} />
        <p className="mt-4 text-sm text-white/40">
          订单与交付结果都在{' '}
          <Link href="/orders" className="text-purple-400 hover:text-purple-300">
            我的订单
          </Link>{' '}
          里查看。
        </p>
      </section>

      <section aria-labelledby="intro-steps">
        <Heading id="intro-steps" icon={<ListOrdered className="h-5 w-5 text-cyan-400" />}>
          购买步骤
        </Heading>
        <ol className="grid gap-4 sm:grid-cols-2">
          {intro.steps.map((s, i) => (
            <li key={s.title} className="glass rounded-2xl p-6 lg:p-7">
              <div
                className={`mb-3 bg-gradient-to-r ${gradient} bg-clip-text text-3xl font-bold text-transparent`}
                aria-hidden="true"
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="mb-1.5 font-bold">{s.title}</h3>
              <p className="text-sm leading-relaxed text-white/55">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={PANEL} aria-labelledby="intro-pricing">
        <Heading id="intro-pricing" icon={<Receipt className="h-5 w-5 text-amber-300" />}>
          价格与发票
        </Heading>
        <Bullets items={intro.pricing} />
      </section>

      {/* 「购买须知」原来是 H3，挂在 H2「开通流程」下面，可它和流程是并列的两件事，不是它的子项 */}
      <section className={PANEL} aria-labelledby="intro-notices">
        <Heading id="intro-notices" icon={<ShieldCheck className="h-5 w-5 text-green-400" />}>
          购买须知
        </Heading>
        <Bullets items={intro.notices} />
        <p className="mt-4 text-sm text-white/40">
          完整的退款与质保口径见{' '}
          <Link href="/terms" className="text-purple-400 hover:text-purple-300">
            服务条款
          </Link>
          。
        </p>
      </section>

      {intro.siblings.length > 0 && (
        <section className={PANEL} aria-labelledby="intro-series">
          <Heading id="intro-series" icon={<Layers className="h-5 w-5 text-pink-400" />}>
            同系列其他档位
          </Heading>
          {/* 价格与库存和落地页价格表是同一份实时数据；带 ?ref= 的专属价只作用于本商品，这里一律是公开价 */}
          <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/10">
            {intro.siblings.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/products/${s.id}`}
                  className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04]"
                >
                  <span className="min-w-0 flex-1 text-sm text-white/80 transition-colors group-hover:text-white lg:text-[15px]">
                    {s.name}
                  </span>
                  <span className="shrink-0 whitespace-nowrap font-semibold text-white">￥{s.price.toFixed(0)}</span>
                  {s.inStock ? (
                    <span className="shrink-0 whitespace-nowrap text-xs text-emerald-400">有货</span>
                  ) : (
                    <span className="shrink-0 whitespace-nowrap text-xs text-white/30">补货中</span>
                  )}
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/25 transition-transform group-hover:translate-x-0.5 group-hover:text-white/60" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={PANEL} aria-labelledby="intro-faq">
        <Heading id="intro-faq" icon={<HelpCircle className="h-5 w-5 text-purple-400" />}>
          常见问题
        </Heading>
        <div className="space-y-5">
          {intro.faqs.map((f) => (
            <div key={f.q}>
              <h3 className="mb-1.5 font-semibold text-white">{f.q}</h3>
              <p className={PROSE}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {intro.guide && (
        <Link
          href={intro.guide.href}
          className="group flex items-center justify-between gap-4 rounded-2xl border border-purple-400/20 bg-purple-500/[0.06] px-6 py-5 transition-colors hover:border-purple-400/40 hover:bg-purple-500/10"
        >
          <span>
            <span className="block font-semibold text-white transition-colors group-hover:text-purple-200">
              {intro.guide.label}
            </span>
            <span className="mt-1 block text-sm text-white/45">
              这一类商品的完整说明：实时价格对照、下单前要确认的事与常见问题
            </span>
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-purple-300 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  )
}
