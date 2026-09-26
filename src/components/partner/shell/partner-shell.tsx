'use client'

/**
 * 渠道后台外壳（WP6）：侧边导航 + 顶栏（通知红点、退出）+ 只读提示。
 *
 * 【每个成员页面自己包一层】`src/app/partner/**\/page.tsx` 先 `requirePartnerPage(perm)`，通过后再渲染
 * `<PartnerShell readOnly={ctx.readOnly} role={ctx.role}>…</PartnerShell>`。外壳不放进 layout：layout 同时包着
 * 登录页与邀请页（面向非成员），而且 layout 在客户端导航时不重新执行，放在 layout 里就等于让非成员看到后台导航。
 * WP7 的页面（客户、结算中心、结算单、通知、操作日志、设置）同样这样包。
 *
 * 导航项固定包含 WP7 的页面路径（实施分包 10.4）。STAFF 为 P2，P0 只有 OWNER，所以导航不按权限点隐藏；
 * 越权访问由页面守卫 404（layout 之外每个 page 都有守卫，客户端导航到无权页面同样 404）。
 * 通知红点调用 WP7 的 GET /api/partner/notices/unread-count；接口未上线或失败时不显示红点，不影响其他功能。
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  Bell,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Package,
  ScrollText,
  Settings,
  ShoppingCart,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { partnerApi } from '../common/api'

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; badge?: 'notices' }

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: '经营',
    items: [
      { href: '/partner', label: '看板', icon: LayoutDashboard },
      { href: '/partner/products', label: '商品池', icon: Package },
      { href: '/partner/orders', label: '订单', icon: ShoppingCart },
      { href: '/partner/after-sales', label: '售后', icon: LifeBuoy },
      { href: '/partner/customers', label: '客户', icon: Users },
    ],
  },
  {
    group: '结算',
    items: [
      { href: '/partner/finance', label: '结算中心', icon: Wallet },
      { href: '/partner/finance/statements', label: '结算单', icon: FileText },
    ],
  },
  {
    group: '店铺',
    items: [
      { href: '/partner/notices', label: '通知', icon: Bell, badge: 'notices' },
      { href: '/partner/audit', label: '操作日志', icon: ScrollText },
      { href: '/partner/settings', label: '设置', icon: Settings },
    ],
  },
]
const FLAT = NAV.flatMap((g) => g.items)

function matches(href: string, path: string): boolean {
  if (href === '/partner') return path === '/partner'
  return path === href || path.startsWith(href + '/')
}

export function PartnerShell({ children, readOnly, role }: { children: ReactNode; readOnly?: boolean; role?: 'OWNER' | 'STAFF' }) {
  const pathname = usePathname() || '/partner'
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  // 最长匹配：/partner/finance/statements 不能让「结算中心」也亮
  const active = FLAT.reduce<NavItem | null>((best, it) => (matches(it.href, pathname) && (!best || it.href.length > best.href.length) ? it : best), null)

  const loadUnread = useCallback(async () => {
    try {
      const r = await partnerApi<{ count: number }>('/api/partner/notices/unread-count')
      if (r.ok && typeof r.data?.count === 'number') setUnread(r.data.count)
    } catch {
      /* 红点失败不影响页面 */
    }
  }, [])

  useEffect(() => {
    loadUnread()
    const t = window.setInterval(loadUnread, 60_000)
    return () => window.clearInterval(t)
  }, [loadUnread])

  useEffect(() => setOpen(false), [pathname])

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
    } catch {
      /* 忽略：下面照样跳登录页 */
    }
    try {
      window.localStorage.removeItem('auth-token')
    } catch {
      /* 隐私模式 */
    }
    window.location.href = '/partner/login'
  }

  const nav = (
    <nav className="flex-1 overflow-y-auto p-3">
      {NAV.map((g) => (
        <div key={g.group} className="mb-4 last:mb-0">
          <div className="px-3 pb-1 text-[11px] font-semibold tracking-widest text-gray-400">{g.group}</div>
          <div className="space-y-0.5">
            {g.items.map((it) => {
              const on = active?.href === it.href
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    on ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  <it.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{it.label}</span>
                  {it.badge === 'notices' && unread > 0 && (
                    <span className="rounded-full bg-red-500 px-1.5 text-[11px] font-semibold leading-5 text-white">{unread > 99 ? '99+' : unread}</span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 侧栏：桌面常驻，手机抽屉 */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-gray-200 bg-white transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-4">
          <Link href="/partner" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 font-bold text-white">贝</span>
            <span className="text-base font-bold text-gray-900">渠道后台</span>
          </Link>
          <button type="button" className="rounded p-1 text-gray-400 hover:bg-gray-100 lg:hidden" onClick={() => setOpen(false)} aria-label="收起菜单">
            <X className="h-5 w-5" />
          </button>
        </div>
        {nav}
        <div className="border-t border-gray-100 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white/90 px-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <button type="button" className="rounded p-1 text-gray-500 hover:bg-gray-100 lg:hidden" onClick={() => setOpen(true)} aria-label="打开菜单">
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-gray-800">{active?.label ?? '渠道后台'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            {role && <span className="hidden sm:inline">{role === 'OWNER' ? '店主' : '员工'}</span>}
            <Link href="/partner/notices" className="relative rounded p-1.5 hover:bg-gray-100" aria-label="通知">
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-red-500" />}
            </Link>
          </div>
        </header>
        {readOnly && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            店铺已暂停营业：后台只读，改价、上下架、回复与售后申请暂不可用；已付订单的查询不受影响。
          </div>
        )}
        <main className="mx-auto max-w-7xl p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
