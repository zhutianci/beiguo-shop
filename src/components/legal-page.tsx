import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * 条款类页面（隐私政策 / 服务条款）的统一版式。
 *
 * 【为什么单独做一个组件而不是各写一遍】这两页的价值不在版式，在于**它们存在**：
 * footer 每一页都链到 /privacy 与 /terms，而这两条链接长期 404 ——
 * 全站每个页面都挂着两条死链，对一个卖虚拟商品、要买家掏钱的站点来说，
 * 这是最廉价也最刺眼的不可信信号（Google 的 E-E-A-T 里「主体信息可核实」是硬指标）。
 *
 * 【Server Component】没有任何交互，不需要 'use client'；
 * 纯服务端渲染意味着正文全部落在首屏 HTML 里，爬虫不用执行 JS 就能读到。
 */
export function LegalPage({
  title,
  updatedAt,
  intro,
  children,
}: {
  title: string
  /** 形如 2026-09-19。改了实质条款就要同步改这个日期 */
  updatedAt: string
  intro: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-h-screen page-top pb-20">
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="container relative">
        <nav aria-label="面包屑" className="mb-6 text-sm text-white/40">
          <Link href="/" className="hover:text-white transition-colors">
            首页
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white/70">{title}</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">{title}</h1>
          <p className="text-white/40 text-sm">最后更新：{updatedAt}</p>
        </header>

        <div className="prose-width space-y-6 text-white/70 leading-[1.9] text-[15px] lg:text-base">
          {intro}
          {children}
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 text-sm text-white/40">
          对本页内容有疑问，可通过{' '}
          <Link href="/support" className="text-purple-400 hover:text-purple-300">
            客服中心
          </Link>{' '}
          联系我们（客服微信 <span className="font-mono text-white/60">GenuineMarxist</span>）。
        </div>
      </div>
    </div>
  )
}

/** 条款里的一节。h2 单独抽出来是为了让标题层级在两页之间保持一致 */
export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl lg:text-2xl font-semibold text-white pt-4">{heading}</h2>
      {children}
    </section>
  )
}
