import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { FloatingContact } from '@/components/floating-contact'
import { LiveOrderNotification } from '@/components/live-order-notification'
import { AnnouncementModal } from '@/components/announcement-modal'

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // shop-shell 只做一件事：把「固定头部有多高」以 --header-h 的形式挂到整棵前台子树上
  // （移动端/md 112px，lg 起 96px，定义见 globals.css）。
  //
  // 顶部留白没有直接写在这里，是因为各页面自己带着 pt-32——写在 main 上会和页面的
  // padding 叠加，首屏直接空出 256px。正确做法是页面把 pt-32 换成 .page-top，
  // 它从 --header-h 推导：移动端仍是 128px（零变化），lg 收到 112px。
  // 页面级替换由各页面负责人来做，这里先把变量和工具类备好。
  return (
    <div className="shop-shell flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingContact />
      <LiveOrderNotification />
      {/* 站点公告：买家进入前台任意页面即弹窗展示（后台「系统设置」发布） */}
      <AnnouncementModal />
    </div>
  )
}
