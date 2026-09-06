'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// AI大事记后台的三个子页共用一条标签栏。侧边栏只占一项，具体分区在这里切。
const tabs = [
  { href: '/admin/news', label: '事件管理', exact: true },
  { href: '/admin/news/sources', label: '信源管理' },
  { href: '/admin/news/runs', label: '管线与成本' },
]

export default function NewsAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 border-b border-gray-200">
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.href : pathname.startsWith(t.href)
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800'
              )}
            >
              {t.label}
            </Link>
          )
        })}
      </div>
      {children}
    </div>
  )
}
