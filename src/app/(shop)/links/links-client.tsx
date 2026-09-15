'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Crown, Handshake, Link2, ShieldCheck, Sparkles } from 'lucide-react'
import { ContactModal } from '@/components/contact-modal'
import { ApplyModal } from '@/components/links/apply-modal'
import { CopyButton } from '@/components/links/copy-button'
import { LinkCard, SponsorCard, SponsorMiniCard, SponsorSlot } from '@/components/links/link-card'
import type { LinksPageData } from '@/lib/friend-link'

/**
 * 友链页的交互层。数据由 page.tsx（Server Component）取好传进来，
 * 这里只负责渲染与弹窗/复制/打点 —— 「为什么必须服务端取数」写在 page.tsx 顶部。
 *
 * 【为什么所有链接都直出而不做客户端筛选】友链交换的价值就在于对方那条出站链接
 * 真的出现在我们页面的 HTML 里。做成 tab 筛选会让大半链接默认藏起来，
 * 对 SEO 和对方站长都是减分的。分组只用锚点与视觉分区，不做显示/隐藏。
 */

/**
 * HTML 属性转义。这段片段是给对方**原样粘进自己页面**的成品代码：
 * 简介里只要出现一个英文引号，title 属性就会提前闭合，对方的 CMS / Markdown 编辑器
 * 多半会把这段当脏 HTML 过滤掉 —— 反向链接就这么静默丢了，双方都收不到任何提示。
 */
function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export default function LinksClient({ data }: { data: LinksPageData }) {
  const [applyOpen, setApplyOpen] = useState(false)
  const [applySlot, setApplySlot] = useState<'FRIEND' | 'SPONSOR'>('FRIEND')
  const [contactOpen, setContactOpen] = useState(false)

  // 后台把「前台在线申请」关掉时，页面上这四个入口不能还照旧弹表单——
  // 让人填完六个字段再告诉他「申请已关闭」是最糟的交互。直接改走联系方式弹窗。
  const openApply = (slot: 'FRIEND' | 'SPONSOR') => {
    if (!data.config.applyOpen) {
      setContactOpen(true)
      return
    }
    setApplySlot(slot)
    setApplyOpen(true)
  }

  const cfg = data.config
  const sponsors = data.sponsors
  const friends = data.friends
  const sponsorFree = data.sponsorFree

  // 给对方直接粘走的代码片段。锚文本固定用站名，不塞商业关键词——
  // 互指商业锚文本是搜索引擎识别链接交换网络的首要特征
  const snippets = useMemo(() => {
    const name = cfg.siteName || '贝果科技'
    const url = cfg.siteUrl || ''
    const desc = cfg.siteDescription || ''
    const logo = cfg.siteLogo || ''
    return {
      html: `<a href="${escAttr(url)}" target="_blank" rel="noopener" title="${escAttr(desc)}">${escAttr(name)}</a>`,
      // Markdown 的方括号/圆括号会截断链接语法，各自处理一下
      markdown: `[${name.replace(/\]/g, '\\]')}](${url.replace(/\)/g, '%29')}) - ${desc}`,
      all: `站点名称：${name}\n站点地址：${url}\n站点简介：${desc}\nLogo 地址：${logo}`,
    }
  }, [cfg])

  return (
    <div className="min-h-screen page-top pb-20">
      {/* 背景：紫在左上、青在右下，与 /about、/forum 一致 */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      <div className="fixed left-1/4 top-1/4 h-[600px] w-[600px] rounded-full bg-purple-500/10 blur-[128px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[128px] pointer-events-none" />

      <div className="container relative max-w-6xl">
        {/* ---------------- Hero ---------------- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-12 max-w-3xl text-center lg:mb-16"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-2">
            <Link2 className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-white/80">
              友情链接{friends.length + sponsors.length > 0 ? ` · 已收录 ${friends.length + sponsors.length} 站` : ''}
            </span>
          </div>
          <h1 className="text-headline mb-4">
            <span className="gradient-text">友情</span>
            <span className="gradient-text-accent">链接</span>
          </h1>
          <p className="text-lg leading-relaxed text-white/50 lg:text-xl lg:leading-[1.8]">{cfg.intro}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={() => openApply('FRIEND')}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-medium transition-all hover:shadow-[0_0_30px_rgba(168,85,247,0.35)]"
            >
              {cfg.applyOpen ? '申请友链' : '联系我们申请'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href="#site-info"
              className="inline-flex items-center justify-center gap-2 rounded-full glass px-6 py-3 font-medium transition-colors hover:bg-white/10"
            >
              <Sparkles className="h-4 w-4 text-white/50" />
              获取本站信息
            </a>
          </div>
        </motion.div>

        {/* ---------------- 招商区 ---------------- */}
        <section id="sponsors" className="scroll-below-header mb-14">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="h-5 w-1 rounded-full bg-gradient-to-b from-amber-300 to-orange-500" />
            <h2 className="text-lg font-bold">{cfg.sponsorTitle}</h2>
            <span className="rounded-full border border-amber-300/25 bg-amber-400/10 px-2.5 py-0.5 text-xs text-amber-200">
              招商中
            </span>
            <span className="ml-auto tabular-nums text-xs text-white/25">
              {sponsors.length} 席已合作 · 虚位以待 {sponsorFree} 席
            </span>
          </div>

          {sponsors.length > 0 && <SponsorCard item={sponsors[0]} />}

          {(sponsors.length > 1 || sponsorFree > 0) && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {sponsors.slice(1).map((s) => (
                <SponsorMiniCard key={s.id} item={s} />
              ))}
              {/* 空位最多画 4 个：配置里写 20 席也不该让空卡片占满整屏 */}
              {Array.from({ length: Math.min(sponsorFree, 4) }).map((_, i) => (
                <SponsorSlot key={`slot-${i}`} onClick={() => openApply('SPONSOR')} />
              ))}
            </div>
          )}

          {/* 招商说明条。比「广告位招租」的大横幅体面得多，信息量还更大 */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
            <p className="mb-3 text-[13px] leading-relaxed text-white/50">{cfg.sponsorIntro}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-white/45">
              {cfg.sponsorBenefits.map((b, i) => (
                <span key={i} className="inline-flex items-center gap-1.5">
                  <Crown className="h-3.5 w-3.5 shrink-0 text-amber-300/70" />
                  {b}
                </span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/5 pt-3 text-[13px]">
              <button
                onClick={() => openApply('SPONSOR')}
                className="text-amber-200/90 transition-colors hover:text-amber-200"
              >
                {cfg.applyOpen ? '在线洽谈招商位 →' : '联系商务洽谈 →'}
              </button>
              <button
                onClick={() => setContactOpen(true)}
                className="text-white/45 transition-colors hover:text-white/80"
              >
                加客服微信
              </button>
              {cfg.contact && <span className="font-mono text-white/35">{cfg.contact}</span>}
            </div>
          </div>
        </section>

        {/* ---------------- 友链墙 ---------------- */}
        <section id="friends" className="scroll-below-header mb-14">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="h-5 w-1 rounded-full bg-gradient-to-b from-purple-400 to-pink-500" />
            <h2 className="text-lg font-bold">友情链接</h2>
            <span className="rounded-full glass px-2.5 py-0.5 text-xs text-purple-300">人工逐个审核</span>
            <span className="ml-auto tabular-nums text-xs text-white/25">{friends.length} 站</span>
          </div>

          {friends.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {friends.map((f, i) => (
                <LinkCard key={f.id} item={f} index={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-16 text-center text-sm text-white/40">
              还没有友链，欢迎成为第一个 —— 点上面的「申请友链」。
            </div>
          )}
        </section>

        {/* ---------------- 互链须知 + 本站信息 ---------------- */}
        <section id="site-info" className="scroll-below-header">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="h-5 w-1 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500" />
            <h2 className="text-lg font-bold">本站信息 · 互链须知</h2>
            <span className="ml-auto text-xs text-white/25">申请前请先把本站加到贵站</span>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            {/* 须知 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white/80">
                <ShieldCheck className="h-4 w-4 text-cyan-300" />
                我们的收录标准
              </div>
              <ul className="space-y-2.5 text-[13px] leading-relaxed text-white/50">
                {cfg.requirements.map((r, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-cyan-400/60" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
              {cfg.contactNote && <p className="mt-4 text-xs text-white/30">{cfg.contactNote}</p>}
            </div>

            {/* 本站信息 */}
            <div className="relative overflow-hidden rounded-2xl glass-strong p-6">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-purple-500/10 blur-[80px]" />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-white/80">把这些填到贵站</span>
                  <CopyButton value={snippets.all} label="复制全部" />
                </div>

                <div className="space-y-2.5">
                  {[
                    { k: '站点名称', v: cfg.siteName },
                    { k: '站点地址', v: cfg.siteUrl },
                    { k: '站点简介', v: cfg.siteDescription },
                    { k: 'Logo 地址', v: cfg.siteLogo },
                  ].map((row) => (
                    <div key={row.k} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                      <div className="mb-1 text-xs text-white/40">{row.k}</div>
                      <div className="flex items-center justify-between gap-3">
                        {/* 明文展示是复制失败时的最后兜底：用户至少能长按选中 */}
                        <span className="truncate font-mono text-[13px] text-white/85">{row.v || '—'}</span>
                        {row.v && <CopyButton value={row.v} ariaLabel={`复制${row.k}`} />}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    { label: 'HTML', code: snippets.html },
                    { label: 'Markdown', code: snippets.markdown },
                  ].map((s) => (
                    <div key={s.label}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-white/40">{s.label}</span>
                        <CopyButton value={s.code} />
                      </div>
                      <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/35 p-3 font-mono text-[12px] leading-relaxed text-white/70">
                        <code>{s.code}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- 申请 CTA ---------------- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative mt-16"
        >
          <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 opacity-30 blur-xl" />
          <div className="relative rounded-3xl glass p-10 text-center md:p-14">
            <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
              <Handshake className="h-7 w-7" />
            </div>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">想和贝果科技互挂友链？</h2>
            <p className="mx-auto mb-8 max-w-xl text-white/50 lg:text-lg">
              先在贵站放上本站链接，再提交申请，我们 1~3 个工作日内人工审核并回复。
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <button
                onClick={() => openApply('FRIEND')}
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 font-semibold transition-all hover:shadow-[0_0_40px_rgba(168,85,247,0.4)]"
              >
                {cfg.applyOpen ? '提交申请' : '联系我们'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => setContactOpen(true)}
                className="rounded-full glass px-8 py-4 font-medium transition-colors hover:bg-white/10"
              >
                商务合作 / 赞助洽谈
              </button>
            </div>
          </div>
        </motion.div>

        <p className="mt-10 text-center text-xs leading-relaxed text-white/40">
          本页所列站点均为独立运营的第三方网站，其内容与服务由对方自行负责。
          标注「广告」的为付费展位。发现任何违规内容，欢迎通过客服微信告知，我们会尽快下线。
        </p>
      </div>

      <ApplyModal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        defaultSlot={applySlot}
        requirements={cfg.requirements}
      />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  )
}
