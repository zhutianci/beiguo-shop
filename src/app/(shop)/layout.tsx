import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { FloatingContact } from '@/components/floating-contact'
import { LiveOrderNotification } from '@/components/live-order-notification'
import { AnnouncementModal } from '@/components/announcement-modal'
import { PageViewBeacon } from '@/components/page-view-beacon'
import { MailLanding } from '@/components/mail-landing'
import { SuspendedBanner } from '@/components/storefront/suspended-banner'
import { ClosedPageGate } from '@/components/storefront/closed-page'
import { getCurrentUser } from '@/lib/auth'
import { getStorefront, requireShopStorefront } from '@/lib/storefront/resolve'
import { storefrontFeatures } from '@/lib/storefront/public'

/*
 * 【渠道分站：前台外壳按店面渲染（设计 4.4、6.7、11.2）】
 *  · requireShopStorefront：没有店面（严格期未知 Host、域名停用）→ 404；DRAFT 只放行 previewUserIds 里的登录用户。
 *    **不包进 try**（店面解析 / notFound 靠异常实现控制流，吞掉会让页面按主站结果渲染给所有 Host）。
 *  · 只有 DRAFT 店面才需要知道「你是谁」：主站与已开业渠道不为此多查一次库（每个前台页面都经过这里）。
 *  · SUSPENDED：顶部横幅；TERMINATED：首页与商品页换成停业页，订单、收据、兑换、登录照常（6.7）。
 *    外壳的入口跟着收（终审第 2 轮）：TERMINATED 不再显示「商品」导航与页脚「全部商品」（点进去只是停业页）；
 *    TERMINATED 与 DRAFT（预览用户）不显示「注册」（注册接口对这两种状态 403，入口留着只会让人填完表单才被拒）。
 *  · 实时成交、公告、营销落地清推广码按 features 挂载；流量埋点只在主站（P0 不记渠道流量，/api/track 在渠道 Host 404，
 *    挂着就会产生 404 请求，验收 W1-9）。
 * 休眠时店面恒为主站（ACTIVE、features 全开），渲染结果与改造前逐字相同。
 */
export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const probe = await getStorefront()
  const userId = probe?.status === 'DRAFT' ? ((await getCurrentUser())?.id ?? null) : null
  const sf = await requireShopStorefront({ userId })
  const features = storefrontFeatures(sf)
  const isPlatform = sf.kind === 'PLATFORM'
  // 主站恒为 ACTIVE：两者恒为 true，Header / Footer 渲染与改造前逐字相同
  const catalogOpen = sf.status !== 'TERMINATED'
  const registrationOpen = !(sf.kind === 'CHANNEL' && (sf.status === 'DRAFT' || sf.status === 'TERMINATED'))

  // shop-shell 只做一件事：把「固定头部有多高」以 --header-h 的形式挂到整棵前台子树上
  // （移动端/md 112px，lg 起 96px，定义见 globals.css）。
  //
  // 顶部留白刻意不写在 main 上：写在这里会和页面自己的 padding 叠加，首屏直接空出 256px。
  // 各前台页面统一用 .page-top（/news 那两页要保留手机端贴头部的节奏，写 `pt-28 sm:page-top`），
  // 它从 --header-h 推导：移动端 128px（与旧的 pt-32 完全一致），lg 收到 112px。
  // 全站 pt-32 已于 2026-09-07 迁移完毕，新页面请直接用 .page-top，不要再写死数值。
  return (
    <div className="shop-shell flex min-h-screen flex-col">
      <Header catalogOpen={catalogOpen} registrationOpen={registrationOpen} />
      {sf.status === 'SUSPENDED' && <SuspendedBanner />}
      <main className="flex-1">{sf.status === 'TERMINATED' ? <ClosedPageGate>{children}</ClosedPageGate> : children}</main>
      <Footer catalogOpen={catalogOpen} />
      <FloatingContact />
      {features.liveOrders && <LiveOrderNotification />}
      {/* 站点公告：买家进入前台任意页面即弹窗展示（后台「系统设置」发布） */}
      {features.announcement && <AnnouncementModal />}
      {/* 流量埋点：停留 3 秒后上报。放在前台 layout 上，后台与带 token 的页面不会经过这里；
          服务端还会再按 shouldSkipPath 挡一道 */}
      {isPlatform && <PageViewBeacon />}
      {/* 从营销邮件（链接带 via=mail）点进来时清掉本机旧的推广码：邮件里的券与价格不能被它顶掉。
          营销邮件与推广码都只属于主站（渠道站忽略 ref，设计 7.6） */}
      {features.referral && <MailLanding />}
    </div>
  )
}
