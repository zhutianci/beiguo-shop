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
  return (
    <div className="flex min-h-screen flex-col">
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
