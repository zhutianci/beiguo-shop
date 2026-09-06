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
          // 移动端保持原节奏（py-6 / py-4）。
          // lg 以上笔记本屏「宽而矮」（1366×768 这类），首屏高度比宽度金贵，
          // 头部外边距收一档，整条头部从 112px 降到 96px，把 16px 还给内容。
          isScrolled ? 'py-4 lg:py-3' : 'py-6 lg:py-4'
        )}
      >
        <div className="container">
          <div
            className={cn(
              // 药丸内边距：md(768~1023) 是最挤的一段——8 项导航 + 登录/注册要塞进
              // 不到 500px，所以这里反而比移动端收窄一点，把宽度让给导航文字；
              // lg 回到 px-6，xl 再放开到 px-8，让药丸和更大的字号成比例。
              'flex items-center justify-between px-6 md:px-5 lg:px-6 xl:px-8 py-3 rounded-full transition-all duration-500',
              isScrolled ? 'glass-strong' : 'bg-transparent'
            )}
          >
            {/* Logo：图标固定 40px，配合导航项 py-2.5 + leading-5 = 40px，
                保证药丸高度在所有断点上都是 64px，头部高度可预测（页面顶部留白按此计算） */}
            <Link
              href="/"
              className="flex shrink-0 items-center gap-3 group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-lg overflow-hidden">
                <span className="relative z-10">贝</span>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {/* md 区间要把宽度让给 8 项导航，品牌名只在 lg 以上出现；
                  xl 上导航字号升到 16px，品牌名同步升一档才不会被导航压过去。
                  中文标题字距默认偏松，tracking-tight 让四个字更像一个整体 */}
              <span className="hidden lg:block font-bold text-lg xl:text-xl tracking-tight">贝果科技</span>
            </Link>

            {/* Desktop Nav
                字号阶梯：md 14px / lg 15px / xl 16px。
                md 靠 px-2 + gap-0 省出的宽度把字号从原来的 13px 抬回 14px——
                14px 是中文在深色背景上不糊的下限，比多留几像素间距重要。 */}
            <nav className="hidden md:flex items-center md:gap-0 lg:gap-1 xl:gap-1.5">
              {navLinks.map((link) => {
                const active = isNavActive(pathname, link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative whitespace-nowrap rounded-full transition-colors duration-200',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                      // leading-5 显式锁死 20px 行高：text-[15px]/text-base 这类
                      // 任意值/大字号会继承 1.5 行高把药丸撑高，锁住后 py-2.5 + 20 = 40px 恒定
                      'px-2 py-2.5 text-sm leading-5',
                      // md 断点跨了 768~1023 一整段，实测 768 时左右只各剩 50px 余量，
                      // 到 900 就空出 116px——一路用 14px 会让 900~1023 显得字小而缝大。
                      // 这里插一个 900px 的中间档，把富余的宽度换成字号
                      'min-[900px]:px-3 min-[900px]:text-[15px] min-[900px]:leading-5',
                      'lg:px-3 lg:text-[15px] lg:leading-5 lg:tracking-[0.01em]',
                      'xl:px-4 xl:text-base xl:leading-5',
                      active
                        // 中文小字号下 font-medium 容易糊成一团，所以只给高亮项加字重，
                        // 未选中项用 font-normal，靠透明度而不是字重拉开层级
                        ? 'text-white font-medium'
                        : 'text-white/60 font-normal hover:text-white hover:bg-white/[0.06]'
                    )}
                  >
                    {/* 高亮药丸是绝对定位且排在文字之后，不给文字 z-10 会被半透明底色压暗 */}
                    <span className="relative z-10">{link.label}</span>
                    {active && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute inset-0 rounded-full bg-white/10"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Right Actions：shrink-0 防止 md 段导航变长时把登录/注册挤压换行 */}
            <div className="flex shrink-0 items-center gap-3">
              {user ? (
                <>
                  <Link
                    href="/orders"
                    aria-label="我的订单"
                    className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </Link>
                  <div className="relative group">
                    <button
                      aria-label="账户菜单"
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center transition-transform md:hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    >
                      <User className="w-4 h-4" />
                    </button>
                    {/* 原来只有 group-hover，键盘 Tab 进来菜单不展开；补 focus-within 后键盘可达。
                        lg 上菜单和导航字号一起放大一档，避免头部变大后菜单显得局促 */}
                    <div className="absolute right-0 top-full mt-2 w-48 lg:w-52 py-2 glass rounded-xl opacity-0 invisible transition-all group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible">
                      <div className="px-4 py-2 border-b border-white/10">
                        <div className="text-sm lg:text-[15px] font-medium truncate">{user.nickname || user.email}</div>
                      </div>
                      <Link href="/profile" className="block px-4 py-2 text-sm lg:text-[15px] text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                        个人中心
                      </Link>
                      <Link href="/orders" className="block px-4 py-2 text-sm lg:text-[15px] text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                        我的订单
                      </Link>
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-sm lg:text-[15px] text-red-400 hover:bg-white/5 transition-colors"
                      >
                        退出登录
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* md 段整行最紧，登录/注册的左右内边距收一档换给导航；lg 起恢复并跟随导航升到 15px。
                      登录原来只有变色反馈，桌面端补一层浅底 hover，和导航项的反馈保持一致 */}
                  <Link
                    href="/login"
                    className="hidden sm:block whitespace-nowrap rounded-full px-5 md:px-4 lg:px-5 py-2 text-sm lg:text-[15px] lg:leading-5 font-medium text-white/80 transition-colors hover:text-white md:hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    className="whitespace-nowrap px-5 md:px-4 lg:px-5 py-2 text-sm lg:text-[15px] lg:leading-5 font-medium bg-white text-black rounded-full transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
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
