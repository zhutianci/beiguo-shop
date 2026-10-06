'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ContactModal } from '@/components/contact-modal'
import { LANDING_HUB, LANDINGS, landingPath } from '@/lib/landing/registry'
import { useStorefront } from '@/components/storefront-provider'
import { isWhiteLabel, OPERATOR_LINE } from '@/lib/brand-base'

/**
 * catalogOpen：渠道店面 TERMINATED 时为 false，去掉整栏「商品」（点进去只是停业页，设计 6.7）；主站恒为 true。
 * jiemaOpen：短信接码对全部用户开放（前台外壳在服务端读 sms_config 算，docs/短信接码-设计.md §1.2、D28）；灰度期不出现入口。
 */
export function Footer({ catalogOpen = true, jiemaOpen = false }: { catalogOpen?: boolean; jiemaOpen?: boolean } = {}) {
  const [contactOpen, setContactOpen] = useState(false)
  /*
   * 渠道分站（设计 11.1、11.2）：页脚品牌、主体与主站完全相同；只把渠道站已关闭模块的入口去掉
   * （充值落地页、IP 工具、订阅查询、友链——它们在渠道 Host 上服务端 404）。
   * 客服（二期改动 4.2）：两个「客服」按钮打开的 ContactModal 按店面取客服信息（渠道自己设的，未设回退主站），
   * 页脚本身不写具体微信号，所以这里不用改。
   * 不只是「点进去 404」的体验问题：生产环境 next/link 会对视口内的链接预取，留着入口就会产生 404 请求（验收 W1-9）。
   * 主站 features 全开，渲染结果与原来逐字相同。
   */
  const { features, brand } = useStorefront()
  // 渠道白标（docs/多渠道分销-渠道品牌与公告.md）：换站名 / logo / 简介，底部保留经营主体小字（收款方、开票方）
  const white = isWhiteLabel(brand)

  return (
    <>
      <footer className="relative">
        {/* 背景渐变 */}
        {/* 设计精修 2026-10-07：原来是整块紫色渐变雾；改成顶边中间一道很淡的细光，页脚本身保持纯黑 */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent pointer-events-none" />

        <div className="container relative py-16 lg:py-20 xl:py-24">
          {/*
            md(768~1023)：两栏，四个块正好排成 2×2（品牌块不再独占整行，
            否则会变成 1 + 2 + 1 的残行，最后一列空着）。lg 起换 12 栅格，品牌 3 栏 + 三组链接各 3 栏。
            2026-09-19 从「品牌 5 + 两组链接」改成「品牌 3 + 三组链接」：
            新增的充值落地页必须有一个稳定的站内入口。这不是排版偏好——
            Google 判定 doorway page 的第四条看的就是这些页面有没有进入
            一个清晰、可浏览的层级；只挂在 sitemap 里、页脚点不到的关键词页正是被点名的形态。
          */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-x-8 xl:gap-x-12">
            {/* Brand */}
            <div className="lg:col-span-3">
              {/* 页脚用完整字标（图标 + bigo tech + 域名 + 副标）。
                  它是透明底图，而页脚是深色，白色字标在这里正好成立。
                  alt 写全称：这是页脚唯一一处品牌名，图挂了也要读得出是谁。
                  SEO 重构 B 包（设计 §6.6-4）：原来是 640px 的 PNG（220KB），显示只有 112~128px 高，
                  还被 React 自动 preload 进每一页的 <head>。换成 256px 高的 WebP（约 20KB，显示高度的 2 倍），
                  并 loading="lazy"：页脚在首屏之外，滚到附近才下载，<head> 里也不再有它的 preload。
                  width / height 写图片的真实像素，保证加载前就按正确宽高比占位（CLS）。
                  改图重跑 scripts/gen-brand-assets.py，不要手工改 public/ 里的产物。
                  白标渠道（渠道品牌与公告）用渠道自己的 logo，不走这张图 */}
              {white ? (
                <Link href="/" className="inline-flex items-center gap-3 mb-6">
                  {brand.logoUrl ? (
                    <img src={brand.logoUrl} alt="" width={56} height={56} loading="lazy" decoding="async" className="h-14 w-14 rounded-xl object-contain" />
                  ) : (
                    <span aria-hidden className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold">
                      {Array.from(brand.name)[0]}
                    </span>
                  )}
                  <span className="text-2xl font-bold tracking-tight">{brand.name}</span>
                </Link>
              ) : (
                <Link href="/" className="inline-flex items-center mb-6">
                  <img
                    src="/logo-full.webp?v=3"
                    alt="贝果科技 bigo tech - bigolab.com"
                    width={261}
                    height={256}
                    loading="lazy"
                    decoding="async"
                    className="h-28 w-auto lg:h-32"
                  />
                </Link>
              )}
              {/* 简介是纯正文：max-w-sm(384px) 在 1920px 下会被强行断成很多短行，
                  lg 放宽到 max-w-md 并把字号/行高抬一档，行长落在 40 字左右的舒适区 */}
              {/* 原文「专业的 AI 订阅服务平台…快速开通与持续保障」无从核验，却出现在全站每一页。
                  换成买家查得到的事实：经营主体、做什么、怎么付钱、能不能开票 */}
              <p className="text-white/40 text-sm lg:text-[15px] max-w-sm lg:max-w-md leading-relaxed lg:leading-[1.85]">
                {brand.intro
                  ? brand.intro
                  : white
                    ? `${brand.name}提供 ChatGPT、Claude 等 AI 会员充值与账号服务，支付宝付款，可开增值税发票（标价不含税，开票另付 6% 税费）。`
                    : '贝果科技（益阳市赫山区必高科技有限公司）提供 ChatGPT、Claude 等 AI 会员充值与账号服务，支付宝付款，可开增值税发票（标价不含税，开票另付 6% 税费）。'}
              </p>
              <div className="mt-6 lg:mt-8">
                <button
                  onClick={() => setContactOpen(true)}
                  className="ui-btn ui-btn-secondary text-sm lg:text-[15px]"
                >
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.691 2C4.768 2 1.5 4.65 1.5 7.913c0 1.873 1.075 3.534 2.715 4.642a.522.522 0 01.222.434.677.677 0 01-.027.187l-.352 1.336c-.016.072-.04.144-.04.216 0 .144.117.262.262.262.058 0 .115-.019.166-.047l1.722-.998a.766.766 0 01.4-.115c.077 0 .15.013.222.034a8.49 8.49 0 002.32.317c.207 0 .413-.013.617-.034A4.886 4.886 0 019.5 12.5c0-2.945 2.842-5.336 6.353-5.336.137 0 .272.005.404.013C15.677 4.06 12.477 2 8.691 2z" />
                  </svg>
                  添加客服微信
                </button>
              </div>
            </div>

            {/* Links
                链接文字在 lg 起从 14px 升到 15px、行距从 12px 放到 14px：
                桌面端鼠标目标比手指小，但阅读距离更远，字太小反而更难扫读。
                标题在 lg 起用 white/90 + 更松的字距，和下面 white/40 的链接拉开层级；
                移动端一律不动，保持原样。 */}
            {/* 充值落地页。从注册表渲染，新增一页不用回来改这里（渠道站不渲染：落地页带主站价，设计 11.1） */}
            {features.landing && (
            <div className="lg:col-span-3">
              <h4 className="text-sm font-semibold text-white/90 tracking-wide mb-4 lg:mb-5 lg:text-[15px]">
                <Link href={LANDING_HUB.path} className="hover:text-purple-300 transition-colors">
                  {LANDING_HUB.navLabel}
                </Link>
              </h4>
              <ul className="space-y-3 lg:space-y-3.5">
                {LANDINGS.map((l) => (
                  <li key={l.slug}>
                    <Link
                      href={landingPath(l.slug)}
                      className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors"
                    >
                      {l.navLabel}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            )}

            {catalogOpen && (
            <div className="lg:col-span-3">
              <h4 className="text-sm font-semibold text-white/90 tracking-wide mb-4 lg:mb-5 lg:text-[15px]">{features.news || features.forum ? '商品与服务' : '商品'}</h4>
              <ul className="space-y-3 lg:space-y-3.5">
                {/* 原来是 /products?category=1 与 ?category=2：列表页从不读这个参数（进去看到的是全部商品），
                    canonical 又指回 /products——全站每一页各浪费两条链接。改指对应的充值页，
                    文字用实测有量的说法（claude 会员、chatgpt充值），和左边那一栏的落地页名字错开 */}
                {features.landing && (
                  <>
                    <li>
                      <Link href={landingPath('claude-pro')} className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors">
                        Claude 会员充值
                      </Link>
                    </li>
                    <li>
                      <Link href={landingPath('chatgpt-plus')} className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors">
                        ChatGPT 充值
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <Link href="/products" className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors">
                    全部商品
                  </Link>
                </li>
                {features.jiema && jiemaOpen && (
                  <li>
                    <Link href="/jiema" className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors">
                      短信接码
                    </Link>
                  </li>
                )}
                {/* SEO 批 2 的 C 包（设计 §1.9）：大事记与学习平台原来只在顶部导航里有入口，页脚补上（渠道站 features 全关，不渲染）。
                    学习平台给总览 + 提示词库 + 教程三条：它们是内容平台的三个 hub，从每一页都点得到，离首页不超过两次点击 */}
                {features.news && (
                  <li>
                    <Link href="/news" className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors">
                      AI 圈大事记
                    </Link>
                  </li>
                )}
                {features.forum && (
                  <>
                    <li>
                      <Link href="/learn" className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors">
                        AI 学习
                      </Link>
                    </li>
                    <li>
                      <Link href="/prompts" className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors">
                        AI 提示词库
                      </Link>
                    </li>
                    <li>
                      <Link href="/guides" className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors">
                        AI 使用教程
                      </Link>
                    </li>
                  </>
                )}
                {features.iptools && (
                  <li>
                    <Link href="/iptools" className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors">
                      IP 工具
                    </Link>
                  </li>
                )}
              </ul>
            </div>
            )}

            <div className="lg:col-span-3">
              <h4 className="text-sm font-semibold text-white/90 tracking-wide mb-4 lg:mb-5 lg:text-[15px]">客户服务</h4>
              <ul className="space-y-3 lg:space-y-3.5">
                {features.lookup && (
                  <li>
                    <Link href="/lookup" className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors">
                      订阅查询
                    </Link>
                  </li>
                )}
                <li>
                  <Link href="/support" className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors">
                    常见问题
                  </Link>
                </li>
                <li>
                  {/* 「关于」已从顶部导航下架，页面本身还在，入口靠这里和首页保留 */}
                  <Link href="/about" className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors">
                    关于我们
                  </Link>
                </li>
                {features.links && (
                  <li>
                    <Link href="/links" className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors">
                      友情链接
                    </Link>
                  </li>
                )}
                <li>
                  <button
                    onClick={() => setContactOpen(true)}
                    className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors"
                  >
                    联系客服
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom：栏目内容在 lg 变高之后，分隔线的上下留白同步放开，
              否则版权行会紧贴上一块内容，显得整个页脚「下沉」 */}
          <div className="mt-16 lg:mt-20 pt-8 lg:pt-10 border-t border-white/[0.08] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/30 text-sm">
              {/* 非白标原样保留这一行 JSX（React 会在相邻文本节点之间插注释，写法一变主站 HTML 就不再逐字相同） */}
              {white ? (
                <>
                  &copy; {new Date().getFullYear()} {brand.name}. 保留所有权利.
                  <span className="block mt-1 text-xs text-white/25">{OPERATOR_LINE}</span>
                </>
              ) : (
                <>
              &copy; {new Date().getFullYear()} 贝果科技. 保留所有权利.
                </>
              )}
            </p>
            <div className="flex gap-6 lg:gap-8 text-sm text-white/30">
              <Link href="/privacy" className="hover:text-white transition-colors">
                隐私政策
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                服务条款
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  )
}
