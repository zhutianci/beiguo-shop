'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User, ShoppingBag } from 'lucide-react'
import { useUserStore } from '@/store/user'
import { cn } from '@/lib/utils'

// 标签刻意短：桌面导航 8 项，768~900px 之间靠缩短文案 + 收紧间距才不换行
const navLinks = [
  { href: '/', label: '首页' },
  { href: '/products', label: '商品' },
  { href: '/news', label: 'AI圈大事记' },
  { href: '/iptools', label: 'IP工具' },
  { href: '/forum', label: '论坛' },
  { href: '/support', label: '客服' },
  { href: '/games', label: '游戏' },
  { href: '/about', label: '关于' },
]

/**
 * 导航高亮判定。原来是 pathname === link.href 的精确相等，
 * 结果 /news/xxx、/products/12 这类详情页不会点亮所属导航项。
 * 非根路径改为「相等或以 href + '/' 开头」，'/' 仍必须精确匹配，否则会一直亮着。
 */
function isNavActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Header() {
  const pathname = usePathname()
  const { user, setUser, logout } = useUserStore()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 页面加载时与服务端同步登录状态（避免本地 user 与 cookie 不同步）
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.user) {
          setUser(data.data.user)
        } else {
          setUser(null)
        }
      })
      .catch(() => {})
  }, [setUser])

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          isScrolled ? 'py-4' : 'py-6'
        )}
      >
        <div className="container">
          <div
            className={cn(
              'flex items-center justify-between px-6 py-3 rounded-full transition-all duration-500',
              isScrolled ? 'glass-strong' : 'bg-transparent'
            )}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-lg overflow-hidden">
                <span className="relative z-10">贝</span>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {/* md 区间要把宽度让给 8 项导航，品牌名只在 lg 以上出现 */}
              <span className="font-bold text-lg hidden lg:block">贝果科技</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-0.5 lg:gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative whitespace-nowrap px-2.5 lg:px-4 py-2 text-[13px] lg:text-sm font-medium transition-colors',
                    isNavActive(pathname, link.href) ? 'text-white' : 'text-white/60 hover:text-white'
                  )}
                >
                  {link.label}
                  {isNavActive(pathname, link.href) && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 rounded-full bg-white/10"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link
                    href="/orders"
                    className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </Link>
                  <div className="relative group">
                    <button className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-48 py-2 glass rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <div className="px-4 py-2 border-b border-white/10">
                        <div className="text-sm font-medium truncate">{user.nickname || user.email}</div>
                      </div>
                      <Link href="/profile" className="block px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5">
                        个人中心
                      </Link>
                      <Link href="/orders" className="block px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5">
                        我的订单
                      </Link>
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5"
                      >
                        退出登录
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden sm:block px-5 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    className="px-5 py-2 text-sm font-medium bg-white text-black rounded-full hover:bg-white/90 transition-colors"
                  >
                    注册
                  </Link>
                </>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden w-10 h-10 rounded-full glass flex items-center justify-center"
              >
                {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            {/* 8 项在小屏上会顶满，收紧行距并允许滚动，避免最后一项被裁掉 */}
            <nav className="relative flex h-full flex-col items-center justify-center gap-6 overflow-y-auto py-24">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      'text-2xl sm:text-3xl font-bold',
                      isNavActive(pathname, link.href) ? 'gradient-text-accent' : 'text-white/60'
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              {!user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex gap-4 mt-8"
                >
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-8 py-3 glass rounded-full font-medium"
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-8 py-3 bg-white text-black rounded-full font-medium"
                  >
                    注册
                  </Link>
                </motion.div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
