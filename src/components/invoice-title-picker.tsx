'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { BookUser, Plus, Check } from 'lucide-react'

/**
 * 已保存抬头的一键带入。
 *
 * 三个开票入口共用（下单弹窗 / 我的订单补开 / 邮箱查单补开），所以这个组件
 * **只负责「选中一条并把字段吐出去」**，不碰表单布局、不发提交请求 ——
 * 三处的表单样式和提交接口各不相同，塞进来只会让它变成一个谁都不敢动的大组件。
 *
 * 未登录 / 一条都没存 时整块不渲染：没有内容的空壳分区比没有更糟。
 */

export interface SavedTitle {
  id: number
  title: string
  taxNumber: string
  address: string | null
  phone: string | null
  bankName: string | null
  bankAccount: string | null
  email: string | null
  isDefault: boolean
}

/**
 * 拉取当前登录用户的抬头档案。
 *
 * 未登录时接口回 401，这里当成「没有抬头」而不是错误 ——
 * 匿名「邮箱查订阅」页面也会调它，报错弹窗对那些买家毫无意义。
 *
 * 【authed 与 titles.length 是两回事】「已登录但一条抬头都没存」是很常见的状态。
 * 用 titles.length > 0 当作「已登录」的替身，会让这批人永远看不到「保存抬头」的开关，
 * 也就永远存不上第一条。所以单独返回一个 authed。
 */
export function useSavedTitles(enabled: boolean) {
  const [titles, setTitles] = useState<SavedTitle[]>([])
  const [loaded, setLoaded] = useState(false)
  const [authed, setAuthed] = useState(false)
  /*
   * 请求代次。结算弹窗的 enabled 是 `open && user`，开-关-开会连发两次请求，
   * 先发的那次若后到就会用旧列表盖掉新列表 —— 而自动带入默认抬头的 effect
   * 读的正是这个列表。只认最后一次发起的结果。
   */
  const gen = useRef(0)

  const load = useCallback(async (): Promise<void> => {
    const mine = ++gen.current
    try {
      const res = await fetch('/api/invoice-titles')
      if (mine !== gen.current) return
      if (res.status === 401) {
        setAuthed(false)
        setTitles([])
        return
      }
      const d = await res.json()
      if (mine !== gen.current) return
      setAuthed(!!d?.success)
      setTitles(d?.success ? d.data.list || [] : [])
    } catch {
      if (mine === gen.current) setTitles([])
    } finally {
      if (mine === gen.current) setLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    load()
    // 卸载/重入时把代次推进一格，在途的旧请求回来就自己丢掉
    return () => {
      gen.current++
    }
  }, [enabled, load])

  return { titles, loaded, authed, reload: load }
}

export function InvoiceTitlePicker({
  titles,
  selectedId,
  onPick,
  onNew,
  tone = 'dark',
}: {
  titles: SavedTitle[]
  /** 当前选中的抬头 id；null 表示「手动填写」 */
  selectedId: number | null
  onPick: (t: SavedTitle) => void
  onNew: () => void
  /** dark = 前台玻璃拟态；light = 后台白底 */
  tone?: 'dark' | 'light'
}) {
  if (titles.length === 0) return null

  const light = tone === 'light'
  const base = light
    ? 'border-gray-200 bg-white hover:bg-gray-50'
    : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
  const active = light
    ? 'border-purple-400 bg-purple-50'
    : 'border-purple-500/60 bg-purple-500/15'

  return (
    <div className="mb-4">
      <div className={`mb-2 flex items-center gap-1.5 text-xs ${light ? 'text-gray-500' : 'text-white/50'}`}>
        <BookUser className="h-3.5 w-3.5" />
        已保存的抬头（点选自动填入，仍可修改）
      </div>
      <div className="flex flex-wrap gap-2">
        {titles.map((t) => {
          const on = selectedId === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onPick(t)}
              className={`max-w-full rounded-xl border px-3 py-2 text-left transition-colors ${on ? active : base}`}
            >
              <span className="flex items-center gap-1.5">
                {on && <Check className={`h-3.5 w-3.5 shrink-0 ${light ? 'text-purple-600' : 'text-purple-300'}`} />}
                <span className={`truncate text-sm ${light ? 'text-gray-900' : 'text-white/90'}`}>{t.title}</span>
                {t.isDefault && (
                  <span
                    className={`shrink-0 rounded px-1 py-0.5 text-[10px] ${
                      light ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    默认
                  </span>
                )}
              </span>
              <span className={`mt-0.5 block truncate font-mono text-[11px] ${light ? 'text-gray-400' : 'text-white/35'}`}>
                {t.taxNumber}
              </span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={onNew}
          className={`rounded-xl border border-dashed px-3 py-2 text-sm transition-colors ${
            selectedId === null
              ? active
              : light
                ? 'border-gray-300 text-gray-500 hover:bg-gray-50'
                : 'border-white/15 text-white/50 hover:bg-white/[0.06]'
          }`}
        >
          <span className="flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" />
            填新抬头
          </span>
        </button>
      </div>
    </div>
  )
}
