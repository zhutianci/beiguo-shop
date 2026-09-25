import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { FloatingContact } from '@/components/floating-contact'
import { LiveOrderNotification } from '@/components/live-order-notification'
import { AnnouncementModal } from '@/components/announcement-modal'
import { PageViewBeacon } from '@/components/page-view-beacon'
import { MailLanding } from '@/components/mail-landing'

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // shop-shell 只做一件事：把「固定头部有多高」以 --header-h 的形式挂到整棵前台子树上
  // （移动端/md 112px，lg 起 96px，定义见 globals.css）。
  //
  // 顶部留白刻意不写在 main 上：写在这里会和页面自己的 padding 叠加，首屏直接空出 256px。
  // 各前台页面统一用 .page-top（/news 那两页要保留手机端贴头部的节奏，写 `pt-28 sm:page-top`），
  // 它从 --header-h 推导：移动端 128px（与旧的 pt-32 完全一致），lg 收到 112px。
  // 全站 pt-32 已于 2026-09-07 迁移完毕，新页面请直接用 .page-top，不要再写死数值。
  return (
    <div className="shop-shell flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingContact />
      <LiveOrderNotification />
      {/* 站点公告：买家进入前台任意页面即弹窗展示（后台「系统设置」发布） */}
      <AnnouncementModal />
      {/* 流量埋点：停留 3 秒后上报。放在前台 layout 上，后台与带 token 的页面不会经过这里；
          服务端还会再按 shouldSkipPath 挡一道 */}
      <PageViewBeacon />
      {/* 从营销邮件（链接带 via=mail）点进来时清掉本机旧的推广码：邮件里的券与价格不能被它顶掉 */}
      <MailLanding />
    </div>
  )
}
