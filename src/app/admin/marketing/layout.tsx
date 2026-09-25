'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

/*
 * 营销推广后台的四个分区共用一条标签栏（与 AI大事记 同一写法）。侧边栏只占一项，具体分区在这里切。
 *
 * 活动详情页 /admin/marketing/<id> 也保留标签栏并高亮「活动」：全屏编辑器是 fixed 覆盖层，
 * 盖住整个后台，不受标签栏影响；而详情页本身有标签栏，站长随时能一跳回列表或设置页。
 */
const tabs = [
  { href: '/admin/marketing', label: '活动' },
  { href: '/admin/marketing/templates', label: '模板' },
  { href: '/admin/marketing/subscribers', label: '订阅与退订' },
  { href: '/admin/marketing/settings', label: '发送设置' },
]

function isActive(href: string, pathname: string): boolean {
  if (href === '/admin/marketing') {
    // 「活动」= 列表 + 任意活动详情；其余三个分区不算
    if (pathname === href) return true
    return pathname.startsWith(href + '/') && !tabs.some((t) => t.href !== href && pathname.startsWith(t.href))
  }
  return pathname === href || pathname.startsWith(href + '/')
}

export default function MarketingAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ''

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              '-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              isActive(t.href, pathname)
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  )
}
