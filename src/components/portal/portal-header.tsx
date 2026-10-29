'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 门户站（docs/门户站-bigoai.md）的页头：只有首页、AI学习、AI圈大事记、关于我们四项，没有登录 / 注册 / 充值 / 客服入口。
 * 样式沿用主站页头的药丸（Header 绑着登录态、商品、接码、简繁切换，门户站一样都不要，单独一份更清楚）。
 * 高度与主站一致（--header-h），各页面的 .page-top 留白不用改。
 */
const LINKS: { href: string; label: string; also?: string[] }[] = [
  { href: '/', label: '首页' },
  { href: '/learn', label: 'AI学习', also: ['/prompts', '/guides', '/apps', '/skills', '/u', '/collections'] },
  { href: '/news', label: 'AI圈大事记' },
  { href: '/about', label: '关于我们' },
]

function isActive(pathname: string, href: string, also: string[] = []) {
  if (href === '/') return pathname === '/'
  return [href, ...also].some((h) => pathname === h || pathname.startsWith(`${h}/`))
}

export function PortalHeader({ siteName }: { siteName: string }) {
  const pathname = usePathname() || '/'
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  return (
    <>
      <header className={cn('fixed top-0 left-0 right-0 z-50 transition-[padding] duration-300 ease-out', scrolled ? 'py-4 lg:py-3' : 'py-6 lg:py-4')}>
        <div className="container">
          <div
            className={cn(
              'flex items-center justify-between px-6 lg:px-8 py-3 rounded-full transition-[background-color,box-shadow] duration-300 ease-out',
              scrolled ? 'glass-strong shadow-[0_12px_32px_-16px_rgba(0,0,0,0.9)] lite:shadow-none' : 'bg-transparent',
            )}
          >
            <Link href="/" aria-label={`${siteName}首页`} className="flex shrink-0 items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
              <img src="/logo-mark.webp?v=3" alt="" width={40} height={40} decoding="async" className="w-10 h-10 shrink-0" />
              <span className="font-bold text-lg xl:text-xl tracking-tight">{siteName}</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 xl:gap-1.5">
              {LINKS.map((l) => {
                const active = isActive(pathname, l.href, l.also)
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'whitespace-nowrap rounded-full px-3 xl:px-4 py-2.5 text-[15px] xl:text-base leading-5 transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                      active ? 'bg-white/[0.08] text-white font-medium' : 'text-white/60 hover:text-white hover:bg-white/[0.06]',
                    )}
                  >
                    {l.label}
                  </Link>
                )
              })}
            </nav>

            <button type="button" aria-label={open ? '关闭菜单' : '打开菜单'} onClick={() => setOpen((v) => !v)} className="md:hidden -mr-2 p-2 text-white/80">
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden ui-drop-in">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xl lite:bg-[#050506]" />
          <nav className="relative mx-auto flex h-full max-w-md flex-col overflow-y-auto px-8 pt-28 pb-12">
            <ul className="border-t border-white/[0.08]">
              {LINKS.map((l) => {
                const active = isActive(pathname, l.href, l.also)
                return (
                  <li key={l.href} className="border-b border-white/[0.08]">
                    <Link
                      href={l.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn('flex items-center justify-between py-4 text-xl font-semibold tracking-tight', active ? 'text-white' : 'text-white/60')}
                    >
                      {l.label}
                      {active && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-violet-300" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      )}
    </>
  )
}
