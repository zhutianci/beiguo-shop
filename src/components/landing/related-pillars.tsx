import Link from 'next/link'
import type { ReactNode } from 'react'
import { sitePillars } from '@/lib/seo/pillars'
import { jiemaSvcHref } from '@/lib/jiema/seo-whitelist'

/**
 * 充值落地页的「相关服务」跨业务区块（docs/SEO-重构/SEO-重构设计.md §2.5、§3.1「内链」、§7.4，批 2 的 C / D1a）。Server Component。
 *
 * 每页至少 1 条跨业务线的桥接链接：
 *  · 短信接码：只在 features.jiema && jiemaPublicOpen 时出现（灰度期全站没有 href="/jiema"，D28），链接用本站 slug（?svc=）预选服务；
 *    锚文本中性（§2.5：不写「更便宜」「嫌实体卡贵」，本站不能指定号码类型，D26）。
 *  · AI 学习：对应产品的教程 / 提示词总览（内容平台 §11.6「商品页和 /chongzhi → 内容」）；跟 features.forum。
 *  · AI 圈大事记：/news（跟 features.news）。
 * 【只放在非 AI 引用页、非对照组】（/chongzhi、chatgpt-plus、claude-kyc、google-zhanghao 不放，§7.6、§8.2 D1a 验收）。
 * 渠道站：落地页整组 404，这里不会被渲染；sitePillars 在渠道 Host 上也全是 false。
 */
export async function RelatedPillars({
  jiema,
  learn,
}: {
  /** 预选的接码服务（seo-whitelist 的 slug）与锚文本；不传 = 不出接码这一条 */
  jiema?: { slug: string; anchor: string; note?: string }
  /** 学习平台入口（站内路径 + 锚文本），1–3 条 */
  learn?: { href: string; anchor: string }[]
}) {
  const p = await sitePillars()
  const items: { key: string; node: ReactNode }[] = []
  if (jiema && p.jiema) {
    items.push({
      key: 'jiema',
      node: (
        <>
          <a href={jiemaSvcHref(jiema.slug)} className="text-purple-400 hover:text-purple-300">
            {jiema.anchor}
          </a>
          <span className="text-white/45">
            {jiema.note ?? '：短信接码按服务和国家/地区实时报价，没收到短信整单退回站内余额；号码能否通过验证由对方平台决定。'}
          </span>
        </>
      ),
    })
  }
  if (learn && p.learn) {
    for (const l of learn) {
      items.push({
        key: l.href,
        node: (
          <Link href={l.href} className="text-purple-400 hover:text-purple-300">
            {l.anchor}
          </Link>
        ),
      })
    }
  }
  if (p.news) {
    items.push({
      key: 'news',
      node: (
        <>
          <Link href="/news" className="text-purple-400 hover:text-purple-300">
            AI 圈大事记
          </Link>
          <span className="text-white/45">：模型发布与产品更新，按事件整理，每条附原文链接（AI 自动整理）。</span>
        </>
      ),
    })
  }
  if (!items.length) return null
  return (
    <section className="mb-14" aria-labelledby="related-pillars">
      <h2 id="related-pillars" className="mb-5 text-2xl font-bold lg:text-3xl">
        相关服务与教程
      </h2>
      <ul className="space-y-3 text-[15px] leading-[1.9]">
        {items.map((it) => (
          <li key={it.key} className="flex gap-2">
            <span aria-hidden className="mt-[0.8em] h-1 w-1 shrink-0 rounded-full bg-white/30" />
            <span>{it.node}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
