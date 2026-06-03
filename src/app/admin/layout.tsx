'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  FileUp,
  BellRing,
  MessagesSquare,
  Receipt,
  Stamp,
} from 'lucide-react'

const sidebarItems = [
  { href: '/admin', label: '仪表盘', icon: LayoutDashboard },
  { href: '/admin/products', label: '商品管理', icon: Package },
  { href: '/admin/categories', label: '分类管理', icon: FolderTree },
  { href: '/admin/orders', label: '订单管理', icon: ShoppingCart },
  { href: '/admin/external-orders', label: '订单导入', icon: FileUp },
  { href: '/admin/reminders', label: '到期提醒', icon: BellRing },
  { href: '/admin/invoices', label: '发票管理', icon: Receipt },
  { href: '/admin/receipts', label: '收据管理', icon: Stamp },
  { href: '/admin/forum', label: '论坛管理', icon: MessagesSquare },
  { href: '/admin/users', label: '用户管理', icon: Users },
  { href: '/admin/settings', label: '系统设置', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="admin-area flex min-h-screen bg-gray-100">
      {/* 侧边栏 */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <Link href="/admin" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold">
              贝
            </div>
            <span className="text-lg font-bold text-gray-900">贝果科技 · 管理后台</span>
          </Link>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 space-y-1 p-4">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* 底部 */}
        <div className="border-t border-gray-200 p-4">
          <Link
            href="/"
            className="flex items-center space-x-3 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="h-5 w-5" />
            <span>返回前台</span>
          </Link>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="ml-64 flex-1">
        {/* 顶部栏 */}
        <header className="sticky top-0 z-30 h-16 border-b border-gray-200 bg-white">
          <div className="flex h-full items-center justify-between px-6">
            <h1 className="text-lg font-semibold text-gray-900">
              {sidebarItems.find((item) =>
                pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href))
              )?.label || '管理后台'}
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">管理员</span>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
