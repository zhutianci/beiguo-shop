import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight, Check, ShieldAlert } from 'lucide-react'
import { inStock, type LandingProduct } from '@/lib/landing/products'
import { LANDING_HUB, LANDING_REVIEWED_AT, LANDINGS, landingPath } from '@/lib/landing/registry'
import type { RedeemErrorGroup } from '@/lib/landing/redeem-errors'

/**
 * 充值落地页的公共积木。
 *
 * 【全部是 Server Component】这一批页面存在的意义就是让正文、价格、内链
 * 真的出现在服务端 HTML 里。只要有一个积木加了 'use client'，
 * 这一页就退回成「爬虫看到一个空壳」，和改造之前的 /products 一模一样。
 * 所以这里不用 framer-motion、不用任何 hook——需要动效就用 CSS。
 *
 * 【可见性是硬要求】页面上渲染什么，JSON-LD 里才能标什么。
 * 面包屑、价格、FAQ、步骤全部是买家肉眼能看到的内容，
 * 不存在「只给爬虫看的那一份」。那是 cloaking，处罚是站点级的。
 */

// ============ 面包屑 ============

export interface Crumb {
  name: string
  path?: string
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="面包屑" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-white/40">
      {crumbs.map((c, i) => (
        <span key={`${c.name}-${i}`} className="flex items-center gap-2">
          {i > 0 && <span className="text-white/20">/</span>}
          {c.path ? (
            <Link href={c.path} className="hover:text-white transition-colors">
              {c.name}
            </Link>
          ) : (
            <span className="text-white/70">{c.name}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

// ============ 页面外壳 ============

export function LandingShell({
  crumbs,
  h1,
  lede,
  children,
}: {
  crumbs: Crumb[]
  h1: string
  /** H1 下面那段导语。写清楚「这一页能帮你解决什么」，不要写成品牌口号 */
  lede: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-screen page-top pb-24">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container relative">
        <Breadcrumbs crumbs={crumbs} />
        <header className="max-w-4xl mb-12">
          <h1 className="text-3xl lg:text-5xl font-bold leading-tight mb-3">{h1}</h1>
          {/* 【诚实的新鲜度信号】对手那几个内容站都在标题里写更新年月。我们只写真的做过的事：
              哪一天把正文和代码、商品数据逐条对过（日期是 registry 里手动维护的常量，
              不是每次请求的「今天」）；价格和库存本来就是实时取库的，一并说明 */}
          <p className="mb-6 text-xs lg:text-sm text-white/35">
            内容核对于 <time dateTime={LANDING_REVIEWED_AT}>{LANDING_REVIEWED_AT}</time>
            <span className="text-white/20"> · </span>
            价格与库存为实时数据
          </p>
          <div className="text-white/60 text-base lg:text-lg leading-[1.9] space-y-4">{lede}</div>
        </header>
        {children}
      </div>
    </div>
  )
}

/** 正文小节。H2 统一在这里出，保证全站落地页的标题层级一致 */
export function Section({
  id,
  heading,
  children,
}: {
  id?: string
  heading: string
  children: ReactNode
}) {
  return (
    <section id={id} className="mb-14 scroll-below-header">
      <h2 className="text-2xl lg:text-3xl font-bold mb-6">{heading}</h2>
      <div className="max-w-4xl text-white/70 leading-[1.95] text-[15px] lg:text-base space-y-4">
        {children}
      </div>
    </section>
  )
}

/** 小节里的一个问题块。每个 H3 承载一条长尾查询，所以标题要写成用户的原话 */
export function SubSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-lg lg:text-xl font-semibold text-white mb-3">{heading}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

// ============ 价格表 ============

/**
 * 真实价格表。
 *
 * 【这是本站相对内容站唯一的独占资产】排在前面的几个中文竞品全是教程站，
 * 没有一个给得出真实人民币价格与到账方式——它们靠外链到中转站变现。
 * 价格、库存、累计成交都直接取自库里的在售商品，不做任何加工：
 * 结构化数据政策明令禁止标记「用户在页面上看不到的内容」，
 * 而这张表就是 Product/Offer 标记的唯一来源，两边必须是同一份数字。
 */
export function PriceTable({ items, note }: { items: LandingProduct[]; note?: ReactNode }) {
  if (!items.length) {
    return (
      <p className="text-white/40 text-sm">
        价格暂时取不到，请直接到{' '}
        <Link href="/products" className="text-purple-400 hover:text-purple-300">
          商品页
        </Link>{' '}
        查看，或联系客服。
      </p>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full text-sm lg:text-[15px]">
          <thead>
            <tr className="bg-white/5 text-left text-white/50">
              <th scope="col" className="px-4 py-3 font-medium">档位</th>
              <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">价格</th>
              <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">库存</th>
              <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">累计成交</th>
              <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">下单</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t border-white/5">
                <td className="px-4 py-3">
                  <Link href={`/products/${p.id}`} className="text-white/85 hover:text-white transition-colors">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-semibold text-white">
                  ￥{p.price.toFixed(0)}
                  {p.originalPrice != null && p.originalPrice > p.price && (
                    <span className="ml-2 font-normal text-white/30 line-through">
                      ￥{p.originalPrice.toFixed(0)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {inStock(p) ? (
                    <span className="text-emerald-400">有货</span>
                  ) : (
                    <span className="text-white/30">补货中</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-white/50">{p.sales} 单</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link
                    href={`/products/${p.id}`}
                    className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    去下单
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="mt-4 text-sm text-white/40 leading-relaxed">{note}</p>}
    </div>
  )
}

// ============ 步骤 ============

export function Steps({ steps }: { steps: { title: string; body: ReactNode }[] }) {
  return (
    <ol className="space-y-5">
      {steps.map((s, i) => (
        <li key={s.title} className="flex gap-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-sm font-semibold text-purple-300">
            {i + 1}
          </span>
          <div>
            <div className="mb-1 font-semibold text-white">{s.title}</div>
            <div className="text-white/60 leading-[1.9]">{s.body}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}

// ============ FAQ ============

/**
 * 可见的问答区。
 *
 * 【不要为了富摘要做这一块】Google 已经把 FAQ 富结果从结构化数据图库里整体下架，
 * 普通商业站标了也不会在 SERP 里显示成折叠问答。这一块的价值在两处：
 * 一是每个 H3 都是一条可以被匹配的长尾查询，二是它真的在回答买家下单前的疑虑。
 */
export function FaqList({ faqs }: { faqs: { q: string; a: ReactNode }[] }) {
  return (
    <div className="space-y-6">
      {faqs.map((f) => (
        <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 lg:p-6">
          <h3 className="mb-2 font-semibold text-white">{f.q}</h3>
          <div className="text-white/60 leading-[1.9] text-[15px]">{f.a}</div>
        </div>
      ))}
    </div>
  )
}

// ============ 要点清单 ============

export function CheckList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-3">
          <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  )
}

/** 提醒框。用于「买错了退不了」这类必须让买家先看到的前提条件 */
export function Warning({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 lg:p-5 text-amber-100/80 leading-[1.9]">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
      <div>{children}</div>
    </div>
  )
}

// ============ 站内互链 ============

/**
 * 相关页面。
 *
 * 【这不是装饰】Google 判定 doorway page 的第 4 条看的是这些页面有没有进入
 * 一个可浏览的站内层级。每一页都能从 hub、footer 和彼此点到，
 * 「它们是一个真实的站点结构」才成立，而不是一批为关键词而生的孤岛。
 */
export function RelatedLandings({ currentSlug }: { currentSlug?: string }) {
  // 【不要再截断】落地页数量已经超过原来写死的 6 个，再 slice 就是靠数组顺序
  // 决定谁拿不到内链——最后加的那一页永远第一个被砍。全部展示，栅格自己会排。
  const others = LANDINGS.filter((l) => l.slug !== currentSlug)
  return (
    <section className="mb-14">
      <h2 className="text-2xl lg:text-3xl font-bold mb-6">其他充值与账号服务</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {others.map((l) => (
          <Link
            key={l.slug}
            href={landingPath(l.slug)}
            className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
          >
            <div className="mb-2 font-semibold text-white group-hover:text-purple-300 transition-colors">
              {l.navLabel}
            </div>
            <div className="text-sm leading-relaxed text-white/45">{l.blurb}</div>
          </Link>
        ))}
      </div>
      <p className="mt-5 text-sm text-white/40">
        也可以回到{' '}
        <Link href={LANDING_HUB.path} className="text-purple-400 hover:text-purple-300">
          充值总览
        </Link>{' '}
        看全部价格，或直接翻{' '}
        <Link href="/products" className="text-purple-400 hover:text-purple-300">
          商品列表
        </Link>
        。
      </p>
    </section>
  )
}

// ============ 免责声明 ============

/**
 * 与品牌方无隶属关系的声明。
 *
 * 【为什么每一页都要有】这批页面通篇出现 ChatGPT / Claude / OpenAI / Anthropic。
 * Google 自然搜索本身没有商标条款，真正会咬人的是 Merchant Center 的
 * misrepresentation 政策，它明文禁止「让人以为你得到了另一个品牌的支持」，
 * 而且那条政策管到网站本身、不只是投放的广告。
 * 品牌词当名词描述服务对象是安全的（指示性使用），暗示授权不是。
 * 所以「官方授权」「官方合作」「官方渠道」这类字眼一个都不能写，
 * 并且要主动把关系说清楚——这段话既是合规底线，也是对买家的诚实。
 */
export function BrandDisclaimer() {
  return (
    <p className="mt-12 border-t border-white/10 pt-6 text-xs leading-relaxed text-white/30">
      贝果科技（益阳市赫山区必高科技有限公司）是独立的第三方充值服务商，
      与 OpenAI、Anthropic、Google 及其他服务提供商
      <strong className="text-white/40">没有任何隶属、授权或合作关系</strong>。
      ChatGPT、Claude、Codex、Gemini、Google 等名称与商标归其各自权利人所有，本页使用这些名称仅用于说明所充值服务的对象。
      各服务的功能范围、账号状态与政策由其提供方自行决定。下单前请阅读{' '}
      <Link href="/terms" className="text-white/50 underline underline-offset-2 hover:text-white/70">
        服务条款
      </Link>
      。
    </p>
  )
}

// ============ 兑换报错对照 ============

/**
 * 兑换报错对照表。
 *
 * 【这一块是有意做成表格而不是 FAQ 的】买家兑换失败时的行为是
 * 「把错误提示整句复制、粘进搜索框」。所以每一行的第一列必须是**提示原话**，
 * 而且要能被文本匹配到——折叠起来、或者改写成「XX 问题怎么办」都会丢掉这个入口。
 *
 * 数据来自 lib/landing/redeem-errors.ts，那边有维护约定。
 */
export function RedeemErrorHelp({ groups, scope }: { groups: RedeemErrorGroup[]; scope: string }) {
  return (
    <div className="space-y-10">
      {/* 【这一句不能省】站内注册了两家兑换适配器，文案不同；而且多数档位根本不在站内兑换、
          会跳到对应的兑换站点，那边是第三方自己的措辞。不写清楚作用域，
          这张表就是在误导另一半买家。 */}
      <p className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-[1.9] text-white/50">
        {scope}
      </p>
      {groups.map((g) => (
        <div key={g.title}>
          <h3 className="mb-2 text-lg lg:text-xl font-semibold text-white">{g.title}</h3>
          <p className="mb-4 text-white/55 leading-[1.9]">{g.intro}</p>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm lg:text-[15px]">
              <thead>
                <tr className="bg-white/5 text-left text-white/50">
                  <th scope="col" className="px-4 py-3 font-medium">什么情况 / 你可能看到的提示</th>
                  <th scope="col" className="px-4 py-3 font-medium">这是什么意思</th>
                  <th scope="col" className="px-4 py-3 font-medium">该怎么办</th>
                  <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">卡密</th>
                </tr>
              </thead>
              <tbody className="text-white/70">
                {g.items.map((e) => (
                  <tr key={e.situation} className="border-t border-white/5 align-top">
                    <td className="px-4 py-3 min-w-[15rem]">
                      <div className="font-medium text-white/85">{e.situation}</div>
                      {/* 实际措辞按通道不同，逐条列出来是为了让人能对上号——
                          有人就是把屏幕上那句话整段粘进搜索框的 */}
                      <ul className="mt-2 space-y-1">
                        {e.seen.map((m) => (
                          <li key={m} className="text-xs leading-relaxed text-white/40">
                            「{m}」
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 leading-[1.8] min-w-[15rem]">{e.meaning}</td>
                    <td className="px-4 py-3 leading-[1.8] min-w-[15rem]">{e.action}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {e.cardStatus === 'safe' ? (
                        <span className="text-emerald-400">不消耗</span>
                      ) : (
                        <span className="text-amber-300">看提示</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
