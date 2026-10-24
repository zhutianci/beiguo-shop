'use client'

/**
 * 后台外壳（控制台改版 2026-10-13）：可折叠侧栏 + 面包屑顶栏 + 命令面板 + 待办中心 + 用户菜单 + 全局消息提示。
 *
 * 这是各家管理控制台通用的那一套布局（Ant Design Pro 的 ProLayout、云厂商控制台都是它），照搬范式而不是自创：
 *  · 侧栏：电脑上可收成只剩图标的窄栏（记在本机，下次进来还是上次的样子）；小屏上变成抽屉，点左上角按钮滑出、点遮罩或选完菜单收回。
 *    原来侧栏是固定 256px 且不可收起，手机上内容区只剩半屏，基本没法用。
 *  · 顶栏：左边是「分组 / 页面」面包屑（回答「我在哪」），右边是搜索（Ctrl K）、待办、打开前台、账号菜单。
 *  · 待办中心：待发货、未回复留言、待开票、渠道售后、接码售后五个数，一个接口（/api/admin/todo）每 60 秒拉一次；
 *    侧栏对应菜单上的红点用同一份数据。
 *  · 导航清单在 components/admin/shell/nav.ts，侧栏、面包屑、命令面板共用。
 *
 * 没有引入组件库：生产机构建内存已到极限（部署说明各节），外壳连同全局规范（globals.css「后台控制台规范」一节）都用现有 Tailwind 写。
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, ChevronDown, ChevronRight, ExternalLink, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, UserRound, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RouteProgress } from '@/components/route-progress'
import { AdminToaster } from '@/components/admin/shell/toaster'
import { SudoGate } from '@/components/admin/sudo-gate'
import { CommandPalette } from '@/components/admin/shell/command-palette'
import { flatNavItems, matchesPath, navGroups, type NavItem } from '@/components/admin/shell/nav'
import { useUserStore } from '@/store/user'

interface Todo {
  processing: number
  unreplied: number
  invoices: number
  afterSales: number
  jiemaComplaints: number
}
const EMPTY_TODO: Todo = { processing: 0, unreplied: 0, invoices: 0, afterSales: 0, jiemaComplaints: 0 }

/** 菜单红点上的数：订单 = 待发货 + 未回复留言（都是「这张订单等你处理」） */
function badgeCount(badge: NavItem['badge'], t: Todo): number {
  if (badge === 'orders') return t.processing + t.unreplied
  if (badge === 'invoices') return t.invoices
  if (badge === 'afterSales') return t.afterSales
  if (badge === 'jiemaComplaints') return t.jiemaComplaints
  return 0
}

const COLLAPSE_KEY = 'admin:nav-collapsed'
const RECENT_KEY = 'admin:recent'

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function writeLocal(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* 存储不可用：只是不记住，不影响使用 */
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useUserStore()

  // 电脑端：侧栏是否收成窄栏（本机记忆）。首帧按展开渲染，挂载后再读——服务端不知道本机的选择
  const [collapsed, setCollapsed] = useState(false)
  // 小屏：抽屉是否打开
  const [drawer, setDrawer] = useState(false)
  const [palette, setPalette] = useState(false)
  const [menu, setMenu] = useState<'todo' | 'user' | null>(null)
  const [recent, setRecent] = useState<string[]>([])
  const [todo, setTodo] = useState<Todo>(EMPTY_TODO)

  useEffect(() => {
    setCollapsed(readLocal(COLLAPSE_KEY) === '1')
    try {
      const r = JSON.parse(readLocal(RECENT_KEY) || '[]')
      if (Array.isArray(r)) setRecent(r.filter((x) => typeof x === 'string').slice(0, 6))
    } catch {
      /* 记录坏了就当没有 */
    }
  }, [])

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      writeLocal(COLLAPSE_KEY, c ? '0' : '1')
      return !c
    })

  const currentItem = flatNavItems.reduce<NavItem | null>((best, item) => {
    if (!matchesPath(item.href, pathname)) return best
    return !best || item.href.length > best.href.length ? item : best
  }, null)
  const currentGroup = currentItem ? navGroups.find((g) => g.items.includes(currentItem)) : null

  // 换页：收起抽屉与下拉；把当前页记进「最近访问」（命令面板用）
  const currentHref = currentItem?.href
  useEffect(() => {
    setDrawer(false)
    setMenu(null)
    if (!currentHref) return
    setRecent((list) => {
      const next = [currentHref, ...list.filter((h) => h !== currentHref)].slice(0, 6)
      writeLocal(RECENT_KEY, JSON.stringify(next))
      return next
    })
  }, [pathname, currentHref])

  /*
   * 待办计数：进后台时、每 60 秒、切回这个标签页时各拉一次；标签页在后台时不拉。失败静默（红点只是提醒）。
   * 不随页面切换重拉：那样每点一次菜单都多一个请求，和新页面自己的数据请求抢数据库连接。
   */
  const loadTodo = useCallback(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
    fetch('/api/admin/todo')
      .then((r) => r.json())
      .then((d) => {
        if (d?.success) setTodo({ ...EMPTY_TODO, ...d.data })
      })
      .catch(() => {})
  }, [])
  useEffect(() => {
    loadTodo()
    const t = setInterval(loadTodo, 60_000)
    document.addEventListener('visibilitychange', loadTodo)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', loadTodo)
    }
  }, [loadTodo])

  // Ctrl K / ⌘K 呼出命令面板（输入框里也生效：这是「去别处」的快捷键，不是文本编辑键）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setMenu(null)
        setPalette((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const todoItems: { label: string; desc: string; count: number; href: string }[] = [
    { label: '待发货 / 处理中', desc: '已付款、还没完成的订单', count: todo.processing, href: '/admin/orders?status=PROCESSING' },
    { label: '买家留言未回复', desc: '订单里有没读的买家留言', count: todo.unreplied, href: '/admin/orders?unreplied=1' },
    { label: '待开具发票', desc: '买家已提交、等开票', count: todo.invoices, href: '/admin/invoices' },
    { label: '渠道售后申请', desc: '渠道发起、等你处理', count: todo.afterSales, href: '/admin/after-sales' },
    { label: '接码售后', desc: '短信接码的售后申请', count: todo.jiemaComplaints, href: '/admin/jiema' },
  ]
  const todoTotal = todoItems.reduce((s, t) => s + t.count, 0)

  const accountName = user?.nickname || user?.email || '管理员'

  const sidebar = (narrow: boolean) => (
    <>
      <div className={cn('flex h-14 shrink-0 items-center border-b border-gray-100', narrow ? 'justify-center px-0' : 'px-4')}>
        <Link href="/admin" className="flex min-w-0 items-center gap-2.5" title="贝果科技 · 管理后台">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-bold text-white shadow-sm">
            贝
          </span>
          {!narrow && (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[15px] font-semibold text-gray-900">贝果科技</span>
              <span className="block text-[11px] text-gray-400">管理控制台</span>
            </span>
          )}
        </Link>
      </div>

      {/* 搜索入口放在侧栏最上面：比滚着找菜单快 */}
      <div className={cn('shrink-0 pt-3', narrow ? 'px-2' : 'px-3')}>
        <button
          onClick={() => setPalette(true)}
          title="搜索功能（Ctrl K）"
          className={cn(
            'flex h-9 w-full items-center rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-400 transition-colors hover:border-gray-300 hover:bg-white hover:text-gray-600',
            narrow ? 'justify-center' : 'gap-2 px-3'
          )}
        >
          <Search className="h-4 w-4 shrink-0" />
          {!narrow && (
            <>
              <span className="flex-1 text-left">搜索功能…</span>
              <kbd className="rounded border border-gray-200 bg-white px-1.5 text-[10px] text-gray-400">Ctrl K</kbd>
            </>
          )}
        </button>
      </div>

      {/* 分组多、总高度超过一屏，导航区自己滚动，底部的操作不被挤出去 */}
      <nav className={cn('admin-scroll flex-1 overflow-y-auto py-3', narrow ? 'px-2' : 'px-3')} aria-label="后台导航">
        {navGroups.map((group, gi) => {
          const groupActive = group.items.some((item) => matchesPath(item.href, pathname))
          return (
            <div key={group.group} className="mb-3 last:mb-0">
              {/* 组标题不可点、不折叠：后台是高频操作界面，折叠意味着每次跳转多一次展开。窄栏下用一条分隔线代替标题 */}
              {narrow ? (
                gi > 0 && <div className="mx-2 mb-3 border-t border-gray-100" />
              ) : (
                <div className={cn('px-3 pb-1 pt-1 text-[11px] font-medium tracking-wider', groupActive ? 'text-primary-600' : 'text-gray-400')}>{group.group}</div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  // 只高亮「最长匹配」的那一项：/admin/tenants/overview 同时命中 /admin/tenants 与它自己
                  const isActive = currentItem?.href === item.href
                  const n = badgeCount(item.badge, todo)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={narrow ? item.label : undefined}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'group relative flex h-9 items-center rounded-lg text-sm transition-colors',
                        narrow ? 'justify-center' : 'gap-3 px-3',
                        isActive ? 'bg-primary-50 font-medium text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      <item.icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600')} />
                      {!narrow && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                      {n > 0 &&
                        (narrow ? (
                          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" aria-label={`${n} 项待处理`} />
                        ) : (
                          <span className="rounded-full bg-red-500 px-1.5 text-[11px] font-semibold leading-5 text-white" aria-label={`${n} 项待处理`}>
                            {n > 99 ? '99+' : n}
                          </span>
                        ))}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>
    </>
  )

  return (
    <div className="admin-area min-h-screen bg-[#f5f6f8]">
      {/* 点菜单后 150ms 还没切过去，就在顶上走一条细进度条（与前台同一个组件，只用 transform / opacity） */}
      <RouteProgress />
      <AdminToaster />
      {/* 敏感操作二次验证：后台接口回 needSudo 时弹框要密码、验过自动重放（lib/security/sudo.ts） */}
      <SudoGate />
      <CommandPalette open={palette} onClose={() => setPalette(false)} recent={recent} />

      {/* 电脑端侧栏：固定在左侧，可收成窄栏 */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-gray-200/80 bg-white transition-[width] duration-200 lg:flex',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {sidebar(collapsed)}
        <div className={cn('shrink-0 border-t border-gray-100 py-2', collapsed ? 'px-2' : 'px-3')}>
          <button
            onClick={toggleCollapsed}
            title={collapsed ? '展开侧栏' : '收起侧栏'}
            className={cn('flex h-9 w-full items-center rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900', collapsed ? 'justify-center' : 'gap-3 px-3')}
          >
            {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
            {!collapsed && <span>收起侧栏</span>}
          </button>
        </div>
      </aside>

      {/* 小屏抽屉 */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="导航菜单">
          <div className="absolute inset-0 bg-gray-900/45" onClick={() => setDrawer(false)} />
          <aside className="admin-drawer absolute inset-y-0 left-0 flex w-[272px] max-w-[84vw] flex-col bg-white shadow-2xl">
            <button
              onClick={() => setDrawer(false)}
              className="absolute right-2 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="关闭菜单"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar(false)}
          </aside>
        </div>
      )}

      <div className={cn('min-w-0 transition-[padding] duration-200', collapsed ? 'lg:pl-16' : 'lg:pl-60')}>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-gray-200/80 bg-white/90 px-3 backdrop-blur sm:px-5">
          <button
            onClick={() => setDrawer(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
            aria-label="打开菜单"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* 面包屑：分组 / 页面。分组不是页面，不可点 */}
          <nav className="flex min-w-0 items-center gap-1.5 text-sm" aria-label="当前位置">
            {currentGroup && (
              <>
                <span className="hidden shrink-0 text-gray-400 sm:inline">{currentGroup.group}</span>
                <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-gray-300 sm:inline" />
              </>
            )}
            <h1 className="truncate text-[15px] font-semibold text-gray-900">{currentItem?.label || '管理后台'}</h1>
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setPalette(true)}
              className="flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              title="搜索功能、订单号、邮箱（Ctrl K）"
            >
              <Search className="h-[18px] w-[18px]" />
              <span className="hidden xl:inline">搜索</span>
              <kbd className="hidden rounded border border-gray-200 bg-gray-50 px-1.5 text-[10px] text-gray-400 xl:inline">Ctrl K</kbd>
            </button>

            {/* 待办中心 */}
            <div className="relative">
              <button
                onClick={() => setMenu((m) => (m === 'todo' ? null : 'todo'))}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-haspopup="true"
                aria-expanded={menu === 'todo'}
                title={todoTotal > 0 ? `${todoTotal} 项待办` : '待办'}
              >
                <Bell className="h-[18px] w-[18px]" />
                {todoTotal > 0 && (
                  <span className="absolute right-1 top-1 min-w-[16px] rounded-full bg-red-500 px-1 text-center text-[10px] font-semibold leading-4 text-white ring-2 ring-white">
                    {todoTotal > 99 ? '99+' : todoTotal}
                  </span>
                )}
              </button>
              {menu === 'todo' && (
                <Popover onClose={() => setMenu(null)} className="w-[300px]">
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <span className="text-sm font-semibold text-gray-900">待办</span>
                    <span className="text-xs text-gray-400">{todoTotal > 0 ? `共 ${todoTotal} 项` : '都处理完了'}</span>
                  </div>
                  <div className="p-1.5">
                    {todoItems.map((t) => (
                      <Link key={t.label} href={t.href} className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-gray-50">
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-gray-800">{t.label}</span>
                          <span className="block truncate text-xs text-gray-400">{t.desc}</span>
                        </span>
                        <span
                          className={cn(
                            'min-w-[26px] rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums',
                            t.count > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400'
                          )}
                        >
                          {t.count}
                        </span>
                      </Link>
                    ))}
                  </div>
                </Popover>
              )}
            </div>

            <a
              href="/"
              target="_blank"
              rel="noopener"
              className="hidden h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 sm:flex"
              title="在新标签页打开前台"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden md:inline">前台</span>
            </a>

            {/* 账号菜单 */}
            <div className="relative">
              <button
                onClick={() => setMenu((m) => (m === 'user' ? null : 'user'))}
                className="flex h-9 items-center gap-2 rounded-lg pl-1.5 pr-2 hover:bg-gray-100"
                aria-haspopup="true"
                aria-expanded={menu === 'user'}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-xs font-semibold text-white">
                  {accountName.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden max-w-[140px] truncate text-sm text-gray-700 md:inline">{accountName}</span>
                <ChevronDown className="hidden h-3.5 w-3.5 text-gray-400 md:inline" />
              </button>
              {menu === 'user' && (
                <Popover onClose={() => setMenu(null)} className="w-56">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <div className="truncate text-sm font-medium text-gray-900">{accountName}</div>
                    <div className="mt-0.5 truncate text-xs text-gray-400">{user?.email || '管理员'}</div>
                  </div>
                  <div className="p-1.5 text-sm text-gray-700">
                    <Link href="/profile" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-gray-50">
                      <UserRound className="h-4 w-4 text-gray-400" />
                      个人中心
                    </Link>
                    <Link href="/" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-gray-50">
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                      返回前台
                    </Link>
                    <button
                      onClick={() => {
                        logout()
                        window.location.href = '/login'
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" />
                      退出登录
                    </button>
                  </div>
                </Popover>
              )}
            </div>
          </div>
        </header>

        <main className="p-3 sm:p-5 lg:p-6">{children}</main>
      </div>
    </div>
  )
}

/** 顶栏下拉：点外面 / 按 Esc 关闭 */
function Popover({ children, onClose, className }: { children: React.ReactNode; onClose: () => void; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      // 点的是触发按钮自己（在 ref 的父级里）：交给按钮的 onClick 去切换，这里不抢着关
      if (ref.current && !ref.current.parentElement?.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])
  return (
    <div
      ref={ref}
      className={cn('admin-pop absolute right-0 top-11 z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_20px_48px_-16px_rgba(15,23,42,0.3)]', className)}
    >
      {children}
    </div>
  )
}
