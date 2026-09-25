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
  QrCode,
  KeyRound,
  Gift,
  Share2,
  Newspaper,
  Ticket,
  Link2,
  BarChart3,
  PartyPopper,
  Megaphone,
} from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
}

type NavGroup = {
  group: string
  items: NavItem[]
}

/**
 * 侧边栏按「业务对象」分组，而不是按页面新旧或使用频率分组。
 *
 * 18 个菜单平铺时，找一个入口要从头扫到尾；分组之后眼睛先定位到一个业务域（4~5 个组标题），
 * 再在组内 2~4 项里挑，扫描成本从 O(18) 降到 O(7)+O(4)。
 * 之所以按业务对象切，是因为站长的心智是「我现在要处理订单的事 / 要处理钱的事」，
 * 而不是「我要用那个上周新加的功能」。
 *
 * 新增菜单往哪放：先问这个页面操作的主体是什么——
 *   看数据不改数据 → 概览；商品/卡密库存 → 商品与卡密；一笔交易的生命周期 → 订单与营销；
 *   钱的进出与凭证 → 财务；人 → 客户；对外展示的内容 → 内容；只有站长自己会碰 → 系统。
 * 判断不了就放「系统」，不要新开一组：组数超过 8 个，分组本身又变成了噪音。
 */
const navGroups: NavGroup[] = [
  {
    // 只读的决策面板放最上面：每天第一眼看的是「昨天怎么样」，而不是某个具体表单
    group: '概览',
    items: [
      { href: '/admin', label: '仪表盘', icon: LayoutDashboard },
      { href: '/admin/analytics/traffic', label: '流量分析', icon: BarChart3 },
    ],
  },
  {
    // 外部发卡本质是卡密的出库渠道，跟着卡密走，不跟着订单走
    group: '商品与卡密',
    items: [
      { href: '/admin/products', label: '商品管理', icon: Package },
      { href: '/admin/cardkeys', label: '卡密管理', icon: KeyRound },
      { href: '/admin/categories', label: '分类管理', icon: FolderTree },
      { href: '/admin/dispenses', label: '外部发卡', icon: Share2 },
    ],
  },
  {
    // 优惠券、下单有奖和内推都是「促成一笔订单」的手段，和订单放一起才能连着看转化
    group: '订单与营销',
    items: [
      { href: '/admin/orders', label: '订单管理', icon: ShoppingCart },
      { href: '/admin/external-orders', label: '订单导入', icon: FileUp },
      { href: '/admin/coupons', label: '优惠券', icon: Ticket },
      // 紧挨着优惠券：抽中的券就是优惠券系统里的单张批次
      { href: '/admin/lottery', label: '抽奖管理', icon: PartyPopper },
      { href: '/admin/referrals', label: '内推管理', icon: Gift },
    ],
  },
  {
    // 收款监控放在发票/收据之前：钱有没有到账是高频动作，开票是低频的售后动作
    group: '财务',
    items: [
      { href: '/admin/vmq', label: '收款监控', icon: QrCode },
      { href: '/admin/invoices', label: '发票管理', icon: Receipt },
      { href: '/admin/receipts', label: '收据管理', icon: Stamp },
    ],
  },
  {
    // 到期提醒操作的对象是「某个用户的订阅要到期了」，所以归到客户而不是订单
    group: '客户',
    items: [
      { href: '/admin/users', label: '用户管理', icon: Users },
      { href: '/admin/reminders', label: '到期提醒', icon: BellRing },
      // 营销邮件的对象是「一群用户」（按条件筛人、管订阅与退订），不是某张订单，所以跟用户放一起；
      // 它和「到期提醒」都是往用户邮箱发信，挨着放便于对照两类邮件
      { href: '/admin/marketing', label: '营销推广', icon: Megaphone },
    ],
  },
  {
    // 这三项的共同点是产出对外可见的页面内容（同时也是 SEO 的抓手）
    group: '内容',
    items: [
      { href: '/admin/news', label: 'AI大事记', icon: Newspaper },
      { href: '/admin/forum', label: '论坛管理', icon: MessagesSquare },
      { href: '/admin/links', label: '友链与招商', icon: Link2 },
    ],
  },
  {
    group: '系统',
    items: [{ href: '/admin/settings', label: '系统设置', icon: Settings }],
  },
]

// 顶部标题要按「最长匹配」取，不能取第一个命中的：
// /admin/analytics/traffic 这类多级路径如果将来出现父级菜单，前缀匹配会先命中父级，标题就错了。
const flatNavItems = navGroups.flatMap((g) => g.items)

function matchesPath(href: string, pathname: string) {
  // /admin 是所有后台路径的前缀，只能精确匹配，否则它会永远处于选中态
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(href + '/')
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const currentItem = flatNavItems.reduce<NavItem | null>((best, item) => {
    if (!matchesPath(item.href, pathname)) return best
    return !best || item.href.length > best.href.length ? item : best
  }, null)

  return (
    <div className="admin-area flex min-h-screen bg-gray-100">
      {/* 侧边栏 */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center border-b border-gray-200 px-6">
          <Link href="/admin" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold">
              贝
            </div>
            <span className="text-lg font-bold text-gray-900">贝果科技 · 管理后台</span>
          </Link>
        </div>

        {/*
          导航菜单。
          加上分组标题后总高度超过一屏（尤其是笔记本 768px 高度），所以这里必须能独立滚动，
          否则底部「返回前台」会被挤出可视区域。
        */}
        <nav className="flex-1 overflow-y-auto p-4">
          {navGroups.map((group) => {
            const groupActive = group.items.some((item) => matchesPath(item.href, pathname))
            return (
              <div key={group.group} className="mb-4 last:mb-0">
                {/*
                  组标题是纯文本不可点击、也不做折叠：
                  后台是高频操作界面，折叠意味着每次跳转都多一次展开，比多扫几行更费事。
                  当前页所在的组标题变主色，用来快速定位「我现在在哪一块」。
                */}
                <div
                  className={cn(
                    'px-4 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-widest',
                    groupActive ? 'text-primary-600' : 'text-gray-400'
                  )}
                >
                  {group.group}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = matchesPath(item.href, pathname)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center space-x-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* 底部 */}
        <div className="shrink-0 border-t border-gray-200 p-4">
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
              {currentItem?.label || '管理后台'}
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
