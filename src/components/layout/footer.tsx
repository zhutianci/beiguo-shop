'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ContactModal } from '@/components/contact-modal'

export function Footer() {
  const [contactOpen, setContactOpen] = useState(false)

  return (
    <>
      <footer className="relative border-t border-white/5">
        {/* 背景渐变 */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/10 to-transparent pointer-events-none" />

        <div className="container relative py-16 lg:py-20 xl:py-24">
          {/*
            md(768~1023)：沿用 4 栏，品牌占 2 栏。
            lg 起换 12 栅格：品牌 5 栏 + 链接组从第 7 栏起（3+3），
            中间空出的一栏在 1440px 以上把「品牌」和「链接」明确分成两块，
            否则 4 等分会让三块内容摊得又平又散，右侧还贴不到容器边。
          */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-12 lg:gap-x-10 xl:gap-x-16">
            {/* Brand */}
            <div className="md:col-span-2 lg:col-span-5">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-lg lg:text-xl">
                  贝
                </div>
                <span className="font-bold text-xl lg:text-2xl lg:tracking-tight">贝果科技</span>
              </Link>
              {/* 简介是纯正文：max-w-sm(384px) 在 1920px 下会被强行断成很多短行，
                  lg 放宽到 max-w-md 并把字号/行高抬一档，行长落在 40 字左右的舒适区 */}
              <p className="text-white/40 text-sm lg:text-[15px] max-w-sm lg:max-w-md leading-relaxed lg:leading-[1.85]">
                贝果科技 - 专业的 AI 订阅服务平台，为您提供 Claude、ChatGPT 等顶级 AI 服务的快速开通与持续保障。
              </p>
              <div className="mt-6 lg:mt-8">
                <button
                  onClick={() => setContactOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 lg:px-6 lg:py-3 rounded-full glass hover:bg-white/10 text-sm lg:text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
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
            <div className="lg:col-span-3 lg:col-start-7">
              <h4 className="font-semibold mb-4 lg:mb-5 lg:text-[15px] lg:text-white/90 lg:tracking-wide">商品</h4>
              <ul className="space-y-3 lg:space-y-3.5">
                <li>
                  <Link href="/products?category=1" className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors">
                    Claude 订阅
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=2" className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors">
                    ChatGPT 订阅
                  </Link>
                </li>
                <li>
                  <Link href="/products" className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors">
                    全部商品
                  </Link>
                </li>
                <li>
                  <Link href="/iptools" className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors">
                    IP 工具
                  </Link>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-3">
              <h4 className="font-semibold mb-4 lg:mb-5 lg:text-[15px] lg:text-white/90 lg:tracking-wide">客户服务</h4>
              <ul className="space-y-3 lg:space-y-3.5">
                <li>
                  <Link href="/lookup" className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors">
                    订阅查询
                  </Link>
                </li>
                <li>
                  <Link href="/support" className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors">
                    常见问题
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-white/40 hover:text-white text-sm lg:text-[15px] transition-colors">
                    关于我们
                  </Link>
                </li>
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
          <div className="mt-16 lg:mt-20 pt-8 lg:pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/30 text-sm">
              &copy; {new Date().getFullYear()} 贝果科技. 保留所有权利.
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
