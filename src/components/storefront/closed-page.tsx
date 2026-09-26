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
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** 停业后换成停业页的路径：首页、商品列表与商品详情。其余页面（订单、个人中心、兑换、登录等）照常 */
export function isClosedPath(pathname: string | null): boolean {
  if (!pathname || pathname === '/') return true
  return pathname === '/products' || pathname.startsWith('/products/')
}

export function ClosedPage() {
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
        </div>
      </div>
    </div>
  )
}

/** 包在 (shop) 布局的 main 里：停业店面的首页与商品页换成停业页，其余路径原样渲染 children */
export function ClosedPageGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return isClosedPath(pathname) ? <ClosedPage /> : <>{children}</>
}
