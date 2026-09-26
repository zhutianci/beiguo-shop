'use client'

/**
 * 停业页（设计 6.7 TERMINATED）。
 *
 * 渠道终止后买家的售后权利不能切断：「我的订单」、订单详情、取卡、留言、收据、开票、兑换页与登录要照常可用至少 1 年；
 * 只有「首页」与「商品页」换成固定的停业页（商品接口本身也已返回空：可售判定要求 ACTIVE，WP0 sellable）。
 *
 * 【为什么用客户端按路径判断】(shop)/layout.tsx 是服务端布局，Next 14 的布局拿不到当前路径
 * （middleware 的 matcher 固定四项、不覆盖前台页面，不能靠它注入路径头）。停业页只是展示层：
 * 被它遮住的页面即使服务端照常渲染，也拿不到可售商品（服务端已按 ACTIVE 过滤），不构成泄漏或绕过。
 * 主站永远不是 TERMINATED，不会挂载这个组件。
 */
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ContactModal } from '@/components/contact-modal'

/** 停业后换成停业页的路径：首页、商品列表与商品详情。其余页面（订单、个人中心、兑换、登录等）照常 */
export function isClosedPath(pathname: string | null): boolean {
  if (!pathname || pathname === '/') return true
  return pathname === '/products' || pathname.startsWith('/products/')
}

/**
 * 停业后买家最需要的是「找得到人」做售后（二期改动 4.2「停业页可补客服入口」）：加一个「联系客服」按钮，
 * 弹窗里是本店的客服信息（ContactModal 按店面取，渠道没设则回退主站客服）。只在渠道 TERMINATED 时挂载，主站不受影响。
 */
export function ClosedPage() {
  const [contactOpen, setContactOpen] = useState(false)
  return (
    <div className="page-top container pb-24">
      <div className="mx-auto max-w-lg rounded-2xl glass p-8 text-center">
        <h1 className="text-2xl font-bold">本店已停止营业</h1>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          感谢你的光顾。本店已不再销售商品；已购买的订单仍可在「我的订单」中查看、取卡与联系客服。
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/orders" className="rounded-full bg-white px-6 py-2.5 text-sm font-medium text-black hover:bg-white/90">
            我的订单
          </Link>
          <Link href="/login" className="rounded-full glass px-6 py-2.5 text-sm font-medium hover:bg-white/10">
            登录
          </Link>
          <button type="button" onClick={() => setContactOpen(true)} className="rounded-full glass px-6 py-2.5 text-sm font-medium hover:bg-white/10">
            联系客服
          </button>
        </div>
      </div>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  )
}

/**
 * 筹备期（DRAFT）店面给非预览访客看的整站页面：与 nginx/closed.html 同一句「本站暂停访问」。
 *
 * 【为什么不再是 404】设计 4.4 原定 DRAFT 对外 404。站长 2026-09-26 要求开业全程在超管后台完成：
 * 应用开关与 nginx 分流一次性打开后，开不开门只由后台把状态改成 ACTIVE 决定。
 * 这之前公网看到的必须和 N 段的静态停业页一样，不能从「本站暂停访问」变成 404。
 * 只换展示：可售判定照旧（DRAFT 期商品接口对非预览访客返回空列表），这一页不带任何数据。
 * 不放登录 / 注册入口：预览买家走 /partner/login?next=/，渠道主走 /partner/login（都不在 (shop) 下）。
 */
export function DraftClosedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-24">
      <div className="w-full max-w-md rounded-2xl glass p-8 text-center">
        <h1 className="text-2xl font-bold">本站暂停访问</h1>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          站点正在维护或尚未开放，请稍后再来。
          <br />
          已购买的订单不受影响，如需帮助请联系原购买渠道的客服。
        </p>
        <div className="mt-6 text-xs tracking-widest text-white/40">贝果科技</div>
      </div>
    </div>
  )
}

/** 包在 (shop) 布局的 main 里：停业店面的首页与商品页换成停业页，其余路径原样渲染 children */
export function ClosedPageGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return isClosedPath(pathname) ? <ClosedPage /> : <>{children}</>
}
