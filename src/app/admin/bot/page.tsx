'use client'

/**
 * 后台「微信机器人」（docs/微信机器人-设计.md §14）。
 * 数据全部经 /api/admin/bot/*（每个接口第一句 adminGuard，改动写审计）；页面本身不是闸门。
 *
 * 六个标签：概览 / 会话 / 管理员 / 提卡与补货 / 指令日志 / 设置；?tab=<id> 直接打开某个标签。
 * 概览数据放在页面这一层：锁定状态与配置读取失败要在每个标签的最上面都看得见（锁定期间提卡、补货与改设置全部暂停）。
 * 概览标签停留时每 60 秒刷新一次（读缓存，不打协议服务）；标签页在后台时不拉。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OverviewDTO, TabId } from './types'
import { api, bjTime } from './_components/shared'
import { OverviewTab, type LiveSnapshot } from './_components/overview-tab'
import { ConversationsTab } from './_components/conversations-tab'
import { AdminsTab } from './_components/admins-tab'
import { IssuesTab } from './_components/issues-tab'
import { CommandsTab } from './_components/commands-tab'
import { SettingsTab } from './_components/settings-tab'

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: '概览' },
  { id: 'conversations', label: '会话' },
  { id: 'admins', label: '管理员' },
  { id: 'issues', label: '提卡与补货' },
  { id: 'commands', label: '指令日志' },
  { id: 'settings', label: '设置' },
]

const OVERVIEW_REFRESH_MS = 60_000

export default function AdminBotPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const [ov, setOv] = useState<OverviewDTO | null>(null)
  const [ovErr, setOvErr] = useState<string | null>(null)
  const [ovLoading, setOvLoading] = useState(false)
  const [live, setLive] = useState<LiveSnapshot | null>(null)
  const seq = useRef(0)

  /** live=true 现查一次协议服务（最多等 10 秒）；现查结果单独保存，之后读缓存的刷新不会把它冲掉 */
  const loadOverview = useCallback(async (liveCheck = false) => {
    const my = ++seq.current
    setOvLoading(true)
    const r = await api<OverviewDTO>(`/api/admin/bot/overview${liveCheck ? '?live=1' : ''}`)
    if (liveCheck && r.ok && r.data?.live) setLive({ at: r.data.serverTime, status: r.data.live })
    if (my !== seq.current) return
    setOvLoading(false)
    if (r.ok && r.data) {
      setOv(r.data)
      setOvErr(null)
    } else setOvErr(r.error || '读取概览失败')
  }, [])

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab')
    if (t && TABS.some((x) => x.id === t)) setTab(t as TabId)
    void loadOverview()
  }, [loadOverview])

  useEffect(() => {
    if (tab !== 'overview') return
    const t = setInterval(() => {
      if (document.visibilityState === 'hidden') return
      void loadOverview()
    }, OVERVIEW_REFRESH_MS)
    return () => clearInterval(t)
  }, [tab, loadOverview])

  const switchTab = (id: TabId) => {
    setTab(id)
    if (id === 'overview') void loadOverview()
  }

  const cfg = ov?.config

  return (
    <div className="space-y-4">
      {cfg?.locked && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <Lock className="h-4 w-4 shrink-0" />
          <b>机器人已锁定</b>
          <span>
            （{cfg.lockedBy || '—'}，{bjTime(cfg.lockedAt)}）：提卡、补货与改设置的指令全部暂停，查询与推送照常。
          </span>
          {tab !== 'overview' && (
            <button type="button" className="underline" onClick={() => switchTab('overview')}>
              去概览解锁
            </button>
          )}
        </div>
      )}
      {cfg && !cfg.ok && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          机器人配置读取失败（{cfg.reason}）：提卡、补货与改设置的指令一律拒绝，推送按出厂默认照常。
        </div>
      )}

      <div className="-mx-1 overflow-x-auto px-1">
        <div className="flex min-w-max gap-1 border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTab(t.id)}
              className={cn(
                '-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm sm:px-4',
                tab === t.id ? 'border-primary-600 font-medium text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-800'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' && <OverviewTab ov={ov} err={ovErr} loading={ovLoading} live={live} onReload={loadOverview} />}
      {tab === 'conversations' && <ConversationsTab />}
      {tab === 'admins' && <AdminsTab />}
      {tab === 'issues' && <IssuesTab />}
      {tab === 'commands' && <CommandsTab />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  )
}
