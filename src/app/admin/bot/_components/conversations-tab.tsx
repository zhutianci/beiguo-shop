'use client'

/**
 * 「会话」标签（docs/微信机器人-设计.md §4、§14）：已登记的群与私聊。
 *  · 列表：编号、群名、类型、分站、状态、订阅、免打扰、允许提卡补货、最后送达、待发条数；勾「显示已解绑」带上 REVOKED 的（?all=1）；
 *  · 行内：暂停 / 恢复推送、订阅（安全类不可关）、免打扰（只有分站群）、允许提卡补货（只有管理群，开通前确认）、解绑（确认）；
 *  · 新建绑定：从协议服务的群列表选群（已登记的灰掉），或手动填群 ID；分站群先 dryRun 显示「将绑定到哪个分站」再确认。
 * 私聊会话只回指令、不收推送，这里只展示不改（停用某个人请到「管理员」）。
 */
import { useMemo, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/admin/marketing/modal'
import { cn } from '@/lib/utils'
import { CATEGORY_LABELS, LOCKED_CATEGORIES, MGMT_CATEGORIES, TENANT_CATEGORIES, type BotCategory } from '@/lib/bot/types'
import type { ChatDTO, ChatListDTO, ConvDTO, ConvListDTO, SiteResolveDTO } from '../types'
import {
  api,
  Badge,
  bjTime,
  CONV_STATUS,
  FlashNote,
  hhmm,
  inputCls,
  KIND_LABEL,
  minuteOf,
  Note,
  SITE_STATUS,
  TableWrap,
  tdCls,
  thCls,
  useApi,
  type Flash,
} from './shared'

/** 管理群里单独开关的「充值到账」知会（与 api/admin/bot/_lib/dto.ts 的 WALLET_TOPUP_KEY 同一个键） */
const TOPUP_KEY = 'ev:wallet.topup'

function subKeysOf(kind: string): string[] {
  if (kind === 'MGMT') return MGMT_CATEGORIES.map((c) => c as string).concat(TOPUP_KEY)
  if (kind === 'TENANT') return TENANT_CATEGORIES.map((c) => c as string)
  return []
}

function subLabel(k: string): string {
  if (k === TOPUP_KEY) return '充值到账'
  return CATEGORY_LABELS[k as BotCategory] ?? k
}

function isLockedSub(k: string): boolean {
  return LOCKED_CATEGORIES.has(k as BotCategory)
}

type Prefill = { externalId: string; name: string }

export function ConversationsTab() {
  const [showAll, setShowAll] = useState(false)
  const convs = useApi<ConvListDTO>(`/api/admin/bot/conversations${showAll ? '?all=1' : ''}`)
  const [flash, setFlash] = useState<Flash>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [subsFor, setSubsFor] = useState<ConvDTO | null>(null)
  const [quietFor, setQuietFor] = useState<ConvDTO | null>(null)
  const [creating, setCreating] = useState<{ prefill: Prefill | null } | null>(null)

  const data = convs.data
  const list = data?.list ?? []

  const patch = async (c: ConvDTO, body: Record<string, unknown>): Promise<boolean> => {
    setBusyId(c.id)
    setFlash(null)
    const r = await api<{ conversation: ConvDTO; cancelled: number }>(`/api/admin/bot/conversations/${c.id}`, { method: 'PATCH', body })
    setBusyId(null)
    if (r.ok) {
      setFlash({ tone: 'ok', text: `#${c.id} ${c.name || ''}：${r.message || '已保存'}` })
      void convs.reload()
      return true
    }
    setFlash({ tone: 'err', text: r.error || '保存失败' })
    if (r.status === 409) void convs.reload()
    return false
  }

  const setStatus = (c: ConvDTO, status: 'ACTIVE' | 'PAUSED') => {
    if (status === 'PAUSED') {
      const ok = window.confirm(
        `暂停「${c.name || '未命名'}」（#${c.id}）的推送？\n\n${c.pending ? `还没发出的 ${c.pending} 条消息会作废。` : ''}之后可以随时恢复。`
      )
      if (!ok) return
    } else if (c.status === 'UNREACHABLE') {
      if (!window.confirm(`恢复「${c.name || '未命名'}」（#${c.id}）的推送？\n\n请先确认机器人还在这个群里（多半是被移出了群）；恢复后失败计数清零。`)) return
    }
    void patch(c, { status })
  }

  const setAllowT3 = (c: ConvDTO, on: boolean) => {
    if (on) {
      const ok = window.confirm(
        `允许在「${c.name || '未命名'}」（#${c.id}）里提卡、补货？\n\n开通后，这个群里的管理员可以直接提卡（核销链接会发进这个群）、发起补货。只给只有管理员和小号的群开。`
      )
      if (!ok) return
    }
    void patch(c, { allowT3: on })
  }

  const unbind = async (c: ConvDTO) => {
    const ok = window.confirm(
      `解绑「${c.name || '未命名'}」（#${c.id}，${KIND_LABEL[c.kind] ?? c.kind}${c.site ? ` · ${c.site.name}` : ''}）？\n\n` +
        `解绑后这个群不再收任何推送，${c.pending ? `还没发出的 ${c.pending} 条消息立即作废，` : ''}这个群发起的、还没用的补货链接一并失效。\n以后可以在「新建绑定」里重新绑定。`
    )
    if (!ok) return
    setBusyId(c.id)
    setFlash(null)
    const r = await api<{ cancelled: number; revokedTokens: number }>(`/api/admin/bot/conversations/${c.id}`, { method: 'DELETE' })
    setBusyId(null)
    setFlash(r.ok ? { tone: 'ok', text: `#${c.id} ${c.name || ''}：${r.message || '已解绑'}` } : { tone: 'err', text: r.error || '解绑失败' })
    void convs.reload()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>会话</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-sm text-gray-600">
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              显示已解绑的
            </label>
            <Button variant="outline" size="sm" onClick={() => void convs.reload()}>
              <RefreshCw className={cn('mr-1 h-4 w-4', convs.loading && 'animate-spin')} /> 刷新
            </Button>
            <Button size="sm" onClick={() => setCreating({ prefill: null })}>
              <Plus className="mr-1 h-4 w-4" /> 新建绑定
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {data && (
            <div className="text-sm text-gray-600">
              管理群 {data.summary.mgmt} · 分站群 {data.summary.tenant} · 私聊 {data.summary.dm}
              <span className="text-gray-400">
                {' '}
                （已暂停 {data.summary.paused} · 发不出去 {data.summary.unreachable} · 已解绑 {data.summary.revoked}）
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500">
            群也可以在微信里绑定：管理员在群里发「@贝果助手 设为管理群」或「@贝果助手 创建 &lt;分站域名&gt;」。一个分站可以绑多个群，一个群只能绑一个分站；要改绑先解绑。
          </p>
          {convs.err && <Note tone="err">{convs.err}</Note>}
          <FlashNote flash={flash} onClose={() => setFlash(null)} />

          {!data && !convs.err ? (
            <div className="py-10 text-center text-gray-400">加载中...</div>
          ) : list.length === 0 ? (
            <div className="py-10 text-center text-gray-400">还没有登记任何会话。点右上角「新建绑定」，或在群里 @贝果助手 发「设为管理群」。</div>
          ) : (
            <TableWrap>
              <table className="w-full min-w-[1100px] text-sm text-gray-800">
                <thead>
                  <tr className="border-b">
                    <th className={thCls}>编号</th>
                    <th className={thCls}>群名</th>
                    <th className={thCls}>类型</th>
                    <th className={thCls}>分站</th>
                    <th className={thCls}>状态</th>
                    <th className={thCls}>订阅</th>
                    <th className={thCls}>免打扰</th>
                    <th className={thCls}>允许提卡补货</th>
                    <th className={thCls}>最后送达</th>
                    <th className={thCls}>待发</th>
                    <th className={cn(thCls, 'text-right')}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <ConvRow
                      key={c.id}
                      c={c}
                      currentAdapter={data?.currentAdapter ?? 'wxpad'}
                      busy={busyId === c.id}
                      onStatus={(s) => setStatus(c, s)}
                      onAllowT3={(on) => setAllowT3(c, on)}
                      onSubs={() => setSubsFor(c)}
                      onQuiet={() => setQuietFor(c)}
                      onUnbind={() => void unbind(c)}
                      onRebind={() => setCreating({ prefill: { externalId: c.externalId, name: c.name || '' } })}
                    />
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </CardContent>
      </Card>

      {subsFor && <SubsModal conv={subsFor} onClose={() => setSubsFor(null)} onSave={(subs) => patch(subsFor, { subs })} />}
      {quietFor && <QuietModal conv={quietFor} onClose={() => setQuietFor(null)} onSave={(quiet) => patch(quietFor, { quiet })} />}
      {creating && (
        <CreateModal
          prefill={creating.prefill}
          onClose={() => setCreating(null)}
          onCreated={(msg) => {
            setCreating(null)
            setFlash({ tone: 'ok', text: msg })
            void convs.reload()
          }}
        />
      )}
    </div>
  )
}

function ConvRow({
  c,
  currentAdapter,
  busy,
  onStatus,
  onAllowT3,
  onSubs,
  onQuiet,
  onUnbind,
  onRebind,
}: {
  c: ConvDTO
  currentAdapter: string
  busy: boolean
  onStatus: (s: 'ACTIVE' | 'PAUSED') => void
  onAllowT3: (on: boolean) => void
  onSubs: () => void
  onQuiet: () => void
  onUnbind: () => void
  onRebind: () => void
}) {
  const revoked = c.status === 'REVOKED'
  const editable = !revoked && c.kind !== 'DM'
  const st = CONV_STATUS[c.status] ?? { text: c.status, tone: 'gray' as const }
  const keys = subKeysOf(c.kind)
  const off = keys.filter((k) => !c.subs[k])
  const btn = 'whitespace-nowrap rounded px-2 py-1 text-xs hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <tr className={cn('border-b', revoked && 'text-gray-400')}>
      <td className={cn(tdCls, 'font-mono text-xs')}>#{c.id}</td>
      <td className={cn(tdCls, 'min-w-[11rem] max-w-[16rem]')}>
        <div className="break-words font-medium">{c.name || '未命名'}</div>
        <div className="break-all font-mono text-[11px] text-gray-400">{c.externalId}</div>
        {c.adapter !== currentAdapter && (
          <div className="text-[11px] text-amber-600">
            属于 {c.adapter} 适配器（当前用 {currentAdapter}），发不出去
          </div>
        )}
        {c.boundAt && (
          <div className="text-[11px] text-gray-400">
            {bjTime(c.boundAt)} 绑定{c.boundByName ? ` · ${c.boundByName}` : ''}
          </div>
        )}
      </td>
      <td className={cn(tdCls, 'whitespace-nowrap')}>{KIND_LABEL[c.kind] ?? c.kind}</td>
      <td className={cn(tdCls, 'min-w-[8rem]')}>
        {c.site ? (
          <>
            <div>{c.site.name}</div>
            <div className="text-[11px] text-gray-400">
              {c.site.code}
              {c.site.status !== 'ACTIVE' && <span className="ml-1 text-amber-600">{SITE_STATUS[c.site.status] ?? c.site.status}</span>}
            </div>
          </>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className={tdCls}>
        <Badge tone={st.tone}>{st.text}</Badge>
        {c.failStreak > 0 && !revoked && <div className="mt-0.5 text-[11px] text-red-500">连续失败 {c.failStreak} 次</div>}
      </td>
      <td className={cn(tdCls, 'min-w-[8rem]')}>
        {c.kind === 'DM' ? (
          <span className="text-xs text-gray-400">只回指令，不收推送</span>
        ) : (
          <>
            <div className="whitespace-nowrap">
              {keys.length - off.length}/{keys.length} 类
              {editable && (
                <button type="button" className="ml-2 text-xs text-primary-600 hover:underline" onClick={onSubs} disabled={busy}>
                  修改
                </button>
              )}
            </div>
            {off.length > 0 && <div className="text-[11px] text-gray-400">未订：{off.map(subLabel).join('、')}</div>}
          </>
        )}
      </td>
      <td className={cn(tdCls, 'whitespace-nowrap')}>
        {c.kind === 'TENANT' ? (
          <>
            {c.quietFrom != null && c.quietTo != null ? `${hhmm(c.quietFrom)}–${hhmm(c.quietTo)}` : <span className="text-gray-400">关闭</span>}
            {editable && (
              <button type="button" className="ml-2 text-xs text-primary-600 hover:underline" onClick={onQuiet} disabled={busy}>
                修改
              </button>
            )}
          </>
        ) : (
          <span className="text-xs text-gray-400">不设</span>
        )}
      </td>
      <td className={tdCls}>
        {c.kind === 'MGMT' ? (
          <label className="flex items-center gap-1.5 whitespace-nowrap">
            <input type="checkbox" checked={c.allowT3} disabled={!editable || busy} onChange={(e) => onAllowT3(e.target.checked)} />
            <span className={c.allowT3 ? 'text-gray-900' : 'text-gray-400'}>{c.allowT3 ? '允许' : '不允许'}</span>
          </label>
        ) : c.kind === 'DM' ? (
          <span className="text-xs text-gray-400">{c.allowT3 ? '允许（私聊默认）' : '不允许'}</span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className={cn(tdCls, 'whitespace-nowrap text-xs text-gray-500')}>{bjTime(c.lastSentAt)}</td>
      <td className={cn(tdCls, 'text-center', c.pending ? 'font-semibold' : 'text-gray-400')}>{c.pending}</td>
      <td className={cn(tdCls, 'text-right')}>
        <div className="flex flex-wrap justify-end gap-1">
          {editable && c.status === 'ACTIVE' && (
            <button type="button" className={cn(btn, 'text-amber-700')} onClick={() => onStatus('PAUSED')} disabled={busy}>
              暂停推送
            </button>
          )}
          {editable && (c.status === 'PAUSED' || c.status === 'UNREACHABLE') && (
            <button type="button" className={cn(btn, 'text-green-700')} onClick={() => onStatus('ACTIVE')} disabled={busy}>
              恢复推送
            </button>
          )}
          {editable && (
            <button type="button" className={cn(btn, 'text-red-600 hover:bg-red-50')} onClick={onUnbind} disabled={busy}>
              解绑
            </button>
          )}
          {revoked && (
            <button type="button" className={cn(btn, 'text-primary-600')} onClick={onRebind}>
              重新绑定
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ───────────────────────── 订阅 ─────────────────────────

function SubsModal({ conv, onClose, onSave }: { conv: ConvDTO; onClose: () => void; onSave: (changed: Record<string, boolean>) => Promise<boolean> }) {
  const keys = subKeysOf(conv.kind)
  const [val, setVal] = useState<Record<string, boolean>>(() => ({ ...conv.subs }))
  const [busy, setBusy] = useState(false)
  const changed = keys.filter((k) => !!val[k] !== !!conv.subs[k])

  const save = async () => {
    if (!changed.length) {
      onClose()
      return
    }
    // 只提交改了的类别：没动过的保持「缺省 = 事件目录默认值」，以后目录默认值调整时还能跟着变
    const body: Record<string, boolean> = {}
    changed.forEach((k) => {
      body[k] = !!val[k]
    })
    setBusy(true)
    const ok = await onSave(body)
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      busy={busy}
      title={`订阅 · #${conv.id} ${conv.name || ''}`}
      subtitle={`${KIND_LABEL[conv.kind] ?? conv.kind}：勾上的类别会推送到这个群`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            取消
          </Button>
          <Button onClick={save} loading={busy} disabled={busy}>
            保存{changed.length ? `（改了 ${changed.length} 项）` : ''}
          </Button>
        </>
      }
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {keys.map((k) => {
          const locked = isLockedSub(k)
          return (
            <label key={k} className={cn('flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm', locked && 'bg-gray-50')}>
              <input type="checkbox" checked={locked ? true : !!val[k]} disabled={locked || busy} onChange={(e) => setVal((v) => ({ ...v, [k]: e.target.checked }))} />
              <span>{subLabel(k)}</span>
              {locked && <span className="ml-auto text-[11px] text-gray-400">不可关闭</span>}
              {k === TOPUP_KEY && <span className="ml-auto text-[11px] text-gray-400">运营类里单独的开关，默认关</span>}
            </label>
          )
        })}
      </div>
      {conv.kind === 'TENANT' && <p className="mt-3 text-xs text-gray-500">分站群只能订阅本站的动态；资金异常、库存、渠道告警、运营、安全这些平台类别只进管理群。</p>}
    </Modal>
  )
}

// ───────────────────────── 免打扰 ─────────────────────────

function QuietModal({ conv, onClose, onSave }: { conv: ConvDTO; onClose: () => void; onSave: (quiet: { from: number; to: number } | null) => Promise<boolean> }) {
  const [on, setOn] = useState(conv.quietFrom != null && conv.quietTo != null)
  const [from, setFrom] = useState(hhmm(conv.quietFrom ?? 23 * 60))
  const [to, setTo] = useState(hhmm(conv.quietTo ?? 8 * 60))
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setErr(null)
    let quiet: { from: number; to: number } | null = null
    if (on) {
      const f = minuteOf(from)
      const t = minuteOf(to)
      if (f === null || t === null) {
        setErr('时间格式不对')
        return
      }
      if (f === t) {
        setErr('开始与结束不能相同')
        return
      }
      quiet = { from: f, to: t }
    }
    setBusy(true)
    const ok = await onSave(quiet)
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      busy={busy}
      title={`免打扰 · #${conv.id} ${conv.name || ''}`}
      subtitle="北京时间；免打扰时段里的普通动态推迟到结束后合并成一条，紧急消息与日报不受限"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            取消
          </Button>
          <Button onClick={save} loading={busy} disabled={busy}>
            保存
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" checked={on} onChange={() => setOn(true)} /> 开启免打扰
        </label>
        <div className={cn('flex flex-wrap items-center gap-2 pl-6', !on && 'opacity-50')}>
          <input type="time" step={60} value={from} onChange={(e) => setFrom(e.target.value)} disabled={!on} className={inputCls} />
          <span>到</span>
          <input type="time" step={60} value={to} onChange={(e) => setTo(e.target.value)} disabled={!on} className={inputCls} />
          <span className="text-xs text-gray-400">可以跨零点，例如 23:00 到 08:00</span>
        </div>
        <label className="flex items-center gap-2">
          <input type="radio" checked={!on} onChange={() => setOn(false)} /> 关闭免打扰（全天推送）
        </label>
        {err && <Note tone="err">{err}</Note>}
      </div>
    </Modal>
  )
}

// ───────────────────────── 新建绑定 ─────────────────────────

function CreateModal({ prefill, onClose, onCreated }: { prefill: Prefill | null; onClose: () => void; onCreated: (msg: string) => void }) {
  const chats = useApi<ChatListDTO>('/api/admin/bot/chats')
  const [picked, setPicked] = useState<Prefill | null>(prefill)
  const [q, setQ] = useState('')
  const [manualId, setManualId] = useState(prefill?.externalId ?? '')
  const [manualName, setManualName] = useState(prefill?.name ?? '')
  const [kind, setKind] = useState<'TENANT' | 'MGMT'>('TENANT')
  const [site, setSite] = useState('')
  const [resolved, setResolved] = useState<{ input: string; site: SiteResolveDTO['site'] } | null>(null)
  const [busy, setBusy] = useState<'resolve' | 'create' | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const shown = useMemo(() => {
    const all = chats.data?.chats ?? []
    const s = q.trim().toLowerCase()
    return s ? all.filter((c) => c.name.toLowerCase().includes(s) || c.externalId.toLowerCase().includes(s)) : all
  }, [chats.data, q])

  const pickChat = (c: ChatDTO) => {
    setPicked({ externalId: c.externalId, name: c.name })
    setErr(null)
  }

  const pickManual = () => {
    const id = manualId.trim()
    if (!id) {
      setErr('请填写群 ID（形如 12345678@chatroom）')
      return
    }
    setPicked({ externalId: id, name: manualName.trim() })
    setErr(null)
  }

  const siteInput = site.trim()
  const resolvedFresh = !!resolved && resolved.input === siteInput

  const resolve = async () => {
    if (!picked) return
    if (!siteInput) {
      setErr('请填写分站域名或渠道代码，例如 tibo.pw')
      return
    }
    setBusy('resolve')
    setErr(null)
    const r = await api<SiteResolveDTO>('/api/admin/bot/conversations', {
      body: { externalId: picked.externalId, name: picked.name, kind: 'TENANT', site: siteInput, dryRun: true },
    })
    setBusy(null)
    if (r.ok && r.data?.site) setResolved({ input: siteInput, site: r.data.site })
    else {
      setResolved(null)
      setErr(r.error || '解析分站失败')
    }
  }

  const create = async () => {
    if (!picked) return
    if (kind === 'TENANT' && !resolvedFresh) {
      setErr('请先点「检查分站」，核对将绑定到哪个分站')
      return
    }
    if (kind === 'MGMT') {
      const ok = window.confirm(
        `把「${picked.name || picked.externalId}」设为主站管理群？\n\n管理群会收到主站的全部动态、渠道告警，以后还会出现提卡核销链接——群里只能有管理员和小号。`
      )
      if (!ok) return
    }
    setBusy('create')
    setErr(null)
    const r = await api<{ conversation: unknown; reactivated: boolean }>('/api/admin/bot/conversations', {
      body: { externalId: picked.externalId, name: picked.name, kind, ...(kind === 'TENANT' ? { site: siteInput } : {}) },
    })
    setBusy(null)
    if (r.ok) onCreated(r.message || '已绑定')
    else setErr(r.error || '绑定失败')
  }

  return (
    <Modal
      open
      onClose={onClose}
      busy={busy !== null}
      width="max-w-2xl"
      title="新建绑定"
      subtitle={picked ? '第 2 步：选类型' : '第 1 步：选群'}
      footer={
        picked ? (
          <>
            <Button variant="ghost" onClick={onClose} disabled={busy !== null}>
              取消
            </Button>
            <Button onClick={create} loading={busy === 'create'} disabled={busy !== null || (kind === 'TENANT' && !resolvedFresh)}>
              确认绑定
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
        )
      }
    >
      {!picked ? (
        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="按群名或群 ID 搜索" className={cn(inputCls, 'min-w-0 flex-1')} />
            <Button variant="outline" size="sm" onClick={() => void chats.reload()}>
              <RefreshCw className={cn('mr-1 h-4 w-4', chats.loading && 'animate-spin')} /> 重新读取
            </Button>
          </div>
          {chats.err && <Note tone="err">{chats.err}</Note>}
          {!chats.data && !chats.err ? (
            <div className="py-6 text-center text-gray-400">正在向协议服务读取群列表...</div>
          ) : chats.data && chats.data.chats.length === 0 ? (
            <Note tone="warn">
              协议服务没有给出任何群
              {chats.data.status
                ? `（协议服务${chats.data.status.reachable ? '连得上' : '连不上'}、小号${chats.data.status.online ? '在线' : '不在线'}${chats.data.status.detail ? `：${chats.data.status.detail}` : ''}）`
                : ''}
              。群列表来自通讯录，没有「保存到通讯录」的群不会出现，可以在下面手动填写群 ID。
            </Note>
          ) : (
            <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200">
              {shown.length === 0 && <div className="px-3 py-4 text-center text-gray-400">没有匹配的群</div>}
              {shown.map((c) => (
                <button
                  key={c.externalId}
                  type="button"
                  disabled={!!c.registered}
                  onClick={() => pickChat(c)}
                  className="flex w-full items-start justify-between gap-3 border-b border-gray-100 px-3 py-2 text-left last:border-b-0 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <span className="min-w-0">
                    <span className="block break-words font-medium">{c.name}</span>
                    <span className="block break-all font-mono text-[11px] text-gray-400">{c.externalId}</span>
                  </span>
                  <span className="shrink-0 text-right text-xs">
                    {c.memberCount != null && <span className="block text-gray-400">{c.memberCount} 人</span>}
                    {c.registered && (
                      <span className="block">
                        已登记 #{c.registered.id}（{KIND_LABEL[c.registered.kind] ?? c.registered.kind}
                        {c.registered.siteCode ? ` · ${c.registered.siteCode}` : ''}）
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="rounded-lg border border-dashed border-gray-300 p-3">
            <div className="mb-2 text-xs text-gray-500">群不在列表里？手动填写（群 ID 可以在指令日志、协议服务日志里找到）：</div>
            <div className="grid gap-2 sm:grid-cols-[2fr_1fr_auto]">
              <input value={manualId} onChange={(e) => setManualId(e.target.value)} placeholder="群 ID，如 12345678@chatroom" className={cn(inputCls, 'font-mono')} />
              <input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="群名（可不填）" maxLength={100} className={inputCls} />
              <Button variant="outline" size="sm" onClick={pickManual}>
                下一步
              </Button>
            </div>
          </div>
          {err && <Note tone="err">{err}</Note>}
        </div>
      ) : (
        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="min-w-0">
              <div className="break-words font-medium">{picked.name || '（未填群名）'}</div>
              <div className="break-all font-mono text-[11px] text-gray-500">{picked.externalId}</div>
            </div>
            <button
              type="button"
              className="text-xs text-primary-600 hover:underline"
              onClick={() => {
                setPicked(null)
                setResolved(null)
                setErr(null)
              }}
              disabled={busy !== null}
            >
              换一个群
            </button>
          </div>

          <div className="space-y-2">
            <label className="flex items-start gap-2">
              <input type="radio" className="mt-1" checked={kind === 'TENANT'} onChange={() => setKind('TENANT')} />
              <span>
                <b>分站群</b>：只收绑定分站的动态与该分站的日报（渠道视角，不出现站长成本与利润、买家邮箱）
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input type="radio" className="mt-1" checked={kind === 'MGMT'} onChange={() => setKind('MGMT')} />
              <span>
                <b>主站管理群</b>：收主站全部动态、渠道告警与主站日报；「允许提卡补货」默认只开第一个管理群，其余到列表里勾选
              </span>
            </label>
          </div>

          {kind === 'TENANT' ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  placeholder="分站域名或渠道代码，如 tibo.pw / lulu.bigolab.com / mysticboy"
                  className={cn(inputCls, 'min-w-0 flex-1')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void resolve()
                  }}
                />
                <Button variant="outline" size="sm" onClick={resolve} loading={busy === 'resolve'} disabled={busy !== null}>
                  检查分站
                </Button>
              </div>
              {resolved && (
                <Note tone={resolvedFresh ? 'ok' : 'warn'}>
                  {resolvedFresh ? '将绑定到：' : '（分站已改，请重新检查）上次检查：'}
                  <b>
                    {resolved.site.name}（{resolved.site.code}）
                  </b>{' '}
                  · {SITE_STATUS[resolved.site.status] ?? resolved.site.status} · {resolved.site.origin}
                </Note>
              )}
              <p className="text-xs text-gray-500">绑定后不会自动往群里发欢迎语；需要核对时到「概览」发一条测试消息。新建的分站群会套用「设置」里的默认免打扰。</p>
            </div>
          ) : (
            <Note tone="warn">管理群里会出现提卡核销链接等敏感信息：群里只能有管理员和小号。</Note>
          )}
          {err && <Note tone="err">{err}</Note>}
        </div>
      )}
    </Modal>
  )
}
