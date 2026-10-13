'use client'

/**
 * 命令面板（Ctrl K / ⌘K，控制台改版 2026-10-13）。
 *
 * 后台有近 30 个菜单，找一个页面要在侧栏里滚着找。这里是各家控制台通用的做法：按一个快捷键、敲两个字、回车就到。
 *  · 检索菜单：按标签、分组名、英文名、拼音首字母做「包含」匹配（清单在 shell/nav.ts 的 kw）。
 *  · 没输入时先列「最近访问」（本机记最近 6 个后台页面），再列全部菜单。
 *  · 有输入时多给两条直达：在订单里搜这串字、在用户里搜这串字——订单号、邮箱粘进来回车就行。
 *  · ↑ ↓ 选择，Enter 打开，Esc 关闭；鼠标悬停与键盘选择是同一个高亮。
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CornerDownLeft, Search, ShoppingCart, Users, type LucideIcon } from 'lucide-react'
import { navGroups, type NavItem } from './nav'

interface Entry {
  key: string
  href: string
  label: string
  hint: string
  icon: LucideIcon
}

const ALL: Array<{ item: NavItem; group: string; hay: string }> = navGroups.flatMap((g) =>
  g.items.map((item) => ({ item, group: g.group, hay: `${item.label} ${g.group} ${item.kw ?? ''} ${item.href}`.toLowerCase() }))
)

export function CommandPalette({ open, onClose, recent }: { open: boolean; onClose: () => void; recent: string[] }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    setQ('')
    setActive(0)
    // 等面板渲染出来再聚焦
    const t = window.setTimeout(() => inputRef.current?.focus(), 20)
    return () => window.clearTimeout(t)
  }, [open])

  const sections = useMemo(() => {
    const kw = q.trim().toLowerCase()
    const toEntry = (x: (typeof ALL)[number]): Entry => ({ key: x.item.href, href: x.item.href, label: x.item.label, hint: x.group, icon: x.item.icon })
    if (!kw) {
      const rec = recent.map((h) => ALL.find((x) => x.item.href === h)).filter((x): x is (typeof ALL)[number] => !!x)
      return [
        ...(rec.length ? [{ title: '最近访问', entries: rec.map((x) => ({ ...toEntry(x), key: `r:${x.item.href}` })) }] : []),
        { title: '全部功能', entries: ALL.map(toEntry) },
      ]
    }
    const hits = ALL.filter((x) => kw.split(/\s+/).every((w) => x.hay.includes(w))).map(toEntry)
    const raw = q.trim()
    const jump: Entry[] = [
      { key: 'q:orders', href: `/admin/orders?q=${encodeURIComponent(raw)}`, label: `在订单里搜索「${raw}」`, hint: '订单号 / 邮箱 / 商品名', icon: ShoppingCart },
      { key: 'q:users', href: `/admin/users?q=${encodeURIComponent(raw)}`, label: `在用户里搜索「${raw}」`, hint: '邮箱 / 昵称', icon: Users },
    ]
    return [...(hits.length ? [{ title: '功能', entries: hits }] : []), { title: '直达搜索', entries: jump }]
  }, [q, recent])

  const flat = useMemo(() => sections.flatMap((s) => s.entries), [sections])
  useEffect(() => {
    setActive(0)
  }, [q])

  // 键盘移动时把选中项滚进可视区
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  const go = (e: Entry | undefined) => {
    if (!e) return
    onClose()
    router.push(e.href)
  }

  let idx = -1
  return (
    <div className="fixed inset-0 z-[250] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="命令面板">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="admin-pop relative w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_32px_80px_-24px_rgba(15,23,42,0.5)]">
        <div className="flex items-center gap-3 border-b border-gray-100 px-4">
          <Search className="h-[18px] w-[18px] shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((i) => (flat.length ? (i + 1) % flat.length : 0))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                go(flat[active])
              } else if (e.key === 'Escape') {
                e.preventDefault()
                onClose()
              }
            }}
            placeholder="搜索功能，或粘贴订单号 / 邮箱…"
            className="admin-bare h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-gray-400"
            aria-label="搜索功能"
          />
          <kbd className="hidden shrink-0 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-500 sm:block">Esc</kbd>
        </div>
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
          {sections.map((s) => (
            <div key={s.title} className="mb-1 last:mb-0">
              <div className="px-3 pb-1 pt-2 text-[11px] font-medium tracking-wide text-gray-400">{s.title}</div>
              {s.entries.map((e) => {
                idx++
                const i = idx
                const on = i === active
                return (
                  <button
                    key={e.key}
                    data-idx={i}
                    onMouseMove={() => setActive(i)}
                    onClick={() => go(e)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${on ? 'bg-primary-50 text-primary-800' : 'text-gray-700'}`}
                  >
                    <e.icon className={`h-4 w-4 shrink-0 ${on ? 'text-primary-600' : 'text-gray-400'}`} />
                    <span className="min-w-0 flex-1 truncate">{e.label}</span>
                    <span className="shrink-0 text-xs text-gray-400">{e.hint}</span>
                    {on && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-primary-500" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 border-t border-gray-100 bg-gray-50/70 px-4 py-2 text-[11px] text-gray-500">
          <span>
            <kbd className="rounded border border-gray-200 bg-white px-1">↑</kbd> <kbd className="rounded border border-gray-200 bg-white px-1">↓</kbd> 选择
          </span>
          <span>
            <kbd className="rounded border border-gray-200 bg-white px-1">Enter</kbd> 打开
          </span>
          <span className="ml-auto">随时按 Ctrl K 呼出</span>
        </div>
      </div>
    </div>
  )
}
