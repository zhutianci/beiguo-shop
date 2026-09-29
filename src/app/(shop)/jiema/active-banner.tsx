'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, ClipboardList, Clock } from 'lucide-react'
import { useHydrated } from '@/lib/use-hydrated'
import { useUserStore } from '@/store/user'
import { bannerText, recordStatusText } from '@/lib/jiema/ui'
import type { JiemaRecordItem } from '@/lib/jiema/dto'
import { cn } from '@/lib/utils'

/**
 * /jiema 顶部「进行中订单提示条」与「我的接码记录 →」入口（docs/短信接码-设计.md §1.4、E18；S3）。
 *
 * 只在登录后请求（先等 useHydrated 再看登录态：水合那一次渲染 user 恒为 null）：GET /api/jiema/orders?tab=active，最多显示 3 条，
 * 每条带倒计时（等码到主动取消时刻、收码后到号码结束、待支付到收银台截止；用服务端时间校正），一键进号码页。
 * 号码按分钟倒计时：买家回到板块首页时要能一眼找回它，也免得不知情时再下一单撞上「同时进行中 ≤3」的上限（D27）。
 * 回到前台时重新拉一次；每 30 秒刷新一次（只在页面可见时）。拉不到就不显示（提示条只是提醒）。
 */
const MAX_ROWS = 3

export function JiemaActiveBanner() {
  const hydrated = useHydrated()
  const user = useUserStore((s) => s.user)
  const [items, setItems] = useState<JiemaRecordItem[] | null>(null)
  const [total, setTotal] = useState(0)
  const offset = useRef(0)
  const [now, setNow] = useState(() => Date.now())

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/jiema/orders?tab=active&page=1', { cache: 'no-store' })
      if (!res.ok) return
      const d = await res.json().catch(() => null)
      if (!d?.success) return
      offset.current = Date.parse(d.data.serverNow) - Date.now()
      setItems(d.data.items as JiemaRecordItem[])
      setTotal(Number(d.data.counts?.active) || 0)
    } catch {
      /* 提示条拉不到就不显示 */
    }
  }, [])

  useEffect(() => {
    if (!hydrated || !user) return
    void load()
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, 30_000)
    const onVis = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [hydrated, user, load])

  useEffect(() => {
    if (!items?.length) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [items])

  if (!hydrated || !user) return null
  const serverNow = now + offset.current
  const rows = (items ?? []).slice(0, MAX_ROWS)
  return (
    <div className="mt-3 space-y-2">
      {rows.length > 0 && (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.07] px-3 py-2.5" role="status" aria-live="polite">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs text-amber-100/90">
            <Clock className="h-3.5 w-3.5" />
            你有 {total} 个接码订单正在进行
            {total > rows.length && (
              <Link href="/jiema/records?tab=active" className="ml-1 text-cyan-300/90 hover:underline">
                查看全部
              </Link>
            )}
          </div>
          <ul className="space-y-1">
            {rows.map((r) => {
              const b = recordStatusText(r, serverNow)
              return (
                <li key={r.orderNo}>
                  <Link
                    href={`/jiema/order/${encodeURIComponent(r.orderNo)}`}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-[13px] text-white/80 hover:bg-white/[0.06]"
                  >
                    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px]', b.tone === 'green' ? 'bg-emerald-500/15 text-emerald-200' : b.tone === 'amber' ? 'bg-amber-500/15 text-amber-200' : 'bg-white/10 text-white/60')}>
                      {b.label}
                    </span>
                    <span className="min-w-0 flex-1 truncate tabular-nums">
                      {bannerText({ ...r, serviceName: r.service.name, countryName: r.country.name }, serverNow)}
                    </span>
                    <span className="inline-flex shrink-0 items-center text-xs text-cyan-300/90">
                      查看 <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      <div className="flex justify-end">
        <Link href="/jiema/records" className="inline-flex items-center gap-1 text-xs text-white/55 hover:text-white/85">
          <ClipboardList className="h-3.5 w-3.5" /> 我的接码记录 <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
