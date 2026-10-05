'use client'

/**
 * 「概览」标签（docs/微信机器人-设计.md §14、§11.5、§10）：
 *  · 协议服务 / 小号状态（默认读每分钟健康检查写下的缓存；「刷新状态」现查一次协议服务）、环境配置是否齐全、新号保护期、今日发送统计；
 *  · 登录小号：「唤醒登录」放在扫码前面（部署教程：首次掉线不唤醒、直接重新扫码会明显提高风控风险）；
 *    扫码二维码只放在组件状态里（不写 localStorage、不写日志），每 3 秒问一次进度，最多 3 分钟；
 *  · 锁定 / 解锁：解锁只能在后台，弹窗里勾选确认后才发请求；
 *  · 发一条测试消息到某个群，轮询到「已发出 / 失败 / 作废」或超时。
 */
import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Lock, LockOpen, QrCode, RefreshCw, Send, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/admin/marketing/modal'
import { cn } from '@/lib/utils'
import type { ConvListDTO, LiveStatusDTO, LockResultDTO, LoginProgressDTO, LoginQrDTO, OverviewDTO, TestMessageDTO, TestMessageStatusDTO } from '../types'
import { ago, api, Badge, bjTime, FlashNote, inputCls, KIND_LABEL, Note, OUTBOX_STATUS, useApi, type Flash } from './shared'

export interface LiveSnapshot {
  at: string
  status: LiveStatusDTO
}

export function OverviewTab({
  ov,
  err,
  loading,
  live,
  onReload,
}: {
  ov: OverviewDTO | null
  err: string | null
  loading: boolean
  live: LiveSnapshot | null
  onReload: (live?: boolean) => Promise<void>
}) {
  return (
    <div className="space-y-6">
      <StatusCard ov={ov} err={err} loading={loading} live={live} onReload={onReload} />
      <LoginCard adapter={ov?.env.adapter ?? null} onDone={() => void onReload(false)} />
      <LockCard ov={ov} onChanged={() => void onReload(false)} />
      <TestMessageCard botEnabled={ov ? ov.env.botEnabled : null} />
    </div>
  )
}

// ───────────────────────── 运行状态 ─────────────────────────

function Check({ ok, optional }: { ok: boolean; optional?: boolean }) {
  if (ok) return <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
  return optional ? <span className="inline-block h-4 w-4 shrink-0 text-center text-gray-400">—</span> : <XCircle className="h-4 w-4 shrink-0 text-red-500" />
}

function Tile({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0 rounded-xl border border-gray-200 p-4', className)}>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 space-y-0.5 text-sm text-gray-800">{children}</div>
    </div>
  )
}

function StatusCard({ ov, err, loading, live, onReload }: { ov: OverviewDTO | null; err: string | null; loading: boolean; live: LiveSnapshot | null; onReload: (live?: boolean) => Promise<void> }) {
  const [refreshing, setRefreshing] = useState(false)
  const refreshLive = async () => {
    setRefreshing(true)
    await onReload(true)
    setRefreshing(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>运行状态</CardTitle>
        <Button variant="outline" size="sm" onClick={refreshLive} disabled={refreshing} title="现查一次协议服务（最多等 10 秒）">
          <RefreshCw className={cn('mr-1 h-4 w-4', refreshing && 'animate-spin')} /> 刷新状态
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {err && <Note tone="err">{err}</Note>}
        {!ov ? (
          <div className="py-8 text-center text-gray-400">{loading ? '加载中...' : '加载失败，请点「刷新状态」'}</div>
        ) : (
          <StatusBody ov={ov} live={live} />
        )}
      </CardContent>
    </Card>
  )
}

function StatusBody({ ov, live }: { ov: OverviewDTO; live: LiveSnapshot | null }) {
  const st = ov.state
  const env = ov.env
  // 现查的结果比缓存新时以现查为准（缓存每分钟才更新一次）
  const useLive = !!live && (!st.checkedAt || Date.parse(live.at) >= Date.parse(st.checkedAt))
  const online = useLive && live ? live.status.online : st.online
  const envItems =
    env.adapter === 'wxpad'
      ? [
          { ok: env.botEnabled, label: 'BOT_ENABLED=1（机器人总开关）', optional: false },
          { ok: env.adminKeyConfigured, label: 'BOT_WXPAD_ADMIN_KEY（协议服务管理密钥）', optional: false },
          { ok: env.hookSecretConfigured, label: 'BOT_WXPAD_HOOK_SECRET（回调密钥，至少 32 位）', optional: false },
          { ok: env.proxyConfigured, label: 'BOT_WXPAD_PROXY（同城代理：默认不配；只有扫码后频繁被要求重新登录时才考虑）', optional: true },
        ]
      : [{ ok: env.botEnabled, label: 'BOT_ENABLED=1（机器人总开关）', optional: false }]
  const missing = envItems.filter((i) => !i.optional && !i.ok)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile label="小号" className={online ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <div className={cn('font-semibold', online ? 'text-green-700' : 'text-red-700')}>{online ? '● 在线' : '○ 不在线'}</div>
          <div>{st.nickname || '（还没登录过）'}</div>
          {st.botWxid && <div className="break-all font-mono text-xs text-gray-500">{st.botWxid}</div>}
          <div className="text-xs text-gray-500">
            登录于 {bjTime(st.loginAt)} · 最近检查 {ago(st.checkedAt)}
          </div>
          {!st.online && st.offlineSince && (
            <div className="text-xs text-red-600">
              离线自 {bjTime(st.offlineSince)}
              {st.offlineAlerted ? '（已发企业微信告警）' : ''}
            </div>
          )}
          {st.detail && <div className="break-words text-xs text-gray-500">{st.detail}</div>}
        </Tile>
        <Tile label={`今日发送（${bjTime(ov.today.since)} 起）`}>
          <div className="text-xl font-bold text-gray-900">{ov.today.sent} 条</div>
          <div className={cn('text-xs', ov.today.failed ? 'text-red-600' : 'text-gray-500')}>失败 {ov.today.failed} 条</div>
          <div className="text-xs text-gray-500">
            待发 {ov.today.pending} · 被拦截 {ov.today.blocked} · 过期 {ov.today.expired}
          </div>
        </Tile>
        <Tile label="会话">
          <div>
            管理群 {ov.convs.mgmt} · 分站群 {ov.convs.tenant} · 私聊 {ov.convs.dm}
          </div>
          <div className={cn('text-xs', ov.convs.unreachable ? 'text-red-600' : 'text-gray-500')}>
            已暂停 {ov.convs.paused} · 发不出去 {ov.convs.unreachable}
          </div>
        </Tile>
        <Tile label="管理员">
          <div>启用 {ov.admins.enabled} 人</div>
          <div className="text-xs text-gray-500">已认领的微信 {ov.admins.identities} 个</div>
        </Tile>
      </div>

      {live && (
        <Note tone={live.status.online ? 'ok' : 'warn'}>
          现查（{bjTime(live.at)}）：协议服务{live.status.reachable ? '连得上' : '连不上'} · 小号{live.status.online ? '在线' : '不在线'}
          {live.status.nickname ? ` · ${live.status.nickname}` : ''}
          {live.status.detail ? ` · ${live.status.detail}` : ''}
        </Note>
      )}
      {!ov.config.ok && (
        <Note tone="err">
          机器人配置（settings.bot_config）读取失败：{ov.config.reason}。读取失败期间提卡、补货与改设置的指令一律拒绝，推送按出厂默认照常。
        </Note>
      )}
      {ov.config.ok && !ov.config.enabled && <Note tone="warn">「设置」里的推送运行开关已关闭。</Note>}
      {ov.newAccount.active && (
        <Note tone="warn">
          新号保护期：小号登录未满 {ov.newAccount.hours} 小时（到 {bjTime(ov.newAccount.until)}），这段时间只给管理群发消息，分站群的推送推迟到保护期结束。
          新号头两天请少发、不要加好友、不要一下子被拉进很多群（每天不超过 3 个）。
        </Note>
      )}

      <div className="rounded-xl border border-gray-200 p-4 text-sm">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="font-medium text-gray-900">环境配置</span>
          {missing.length ? <Badge tone="red">不齐全：缺 {missing.length} 项</Badge> : <Badge tone="green">齐全</Badge>}
          <span className="text-xs text-gray-400">
            适配器：{env.adapter === 'console' ? 'console（本地测试，不连微信）' : 'wxpad（WeChatPadPro）'}
          </span>
        </div>
        <ul className="space-y-1">
          {envItems.map((i) => (
            <li key={i.label} className="flex items-start gap-2">
              <Check ok={i.ok} optional={i.optional} />
              <span className={cn(!i.ok && !i.optional ? 'text-red-700' : 'text-gray-700')}>{i.label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 break-all text-xs text-gray-500">
          推送链接域名：{env.linkOrigin}（「设置」里可改，留空则用环境变量 BOT_LINK_ORIGIN / APP_URL）
        </div>
        <div className="mt-1 text-xs text-gray-400">环境变量的值只在服务器上，这里只显示「配没配」；改了要重建 app 容器才生效。</div>
      </div>
    </>
  )
}

// ───────────────────────── 登录小号 ─────────────────────────

/** 扫码登录最多等多久（接口那边的登录会话是 4 分钟，留一分钟余量） */
const LOGIN_WAIT_MS = 3 * 60_000
const LOGIN_POLL_MS = 3000

type LoginPhase =
  | { kind: 'idle' }
  | { kind: 'qr'; src: string; startedAt: number; state: LoginProgressDTO['state']; error: string | null }
  | { kind: 'done'; wxid: string | null; nickname: string | null }
  | { kind: 'ended'; reason: string }

const LOGIN_STATE_TEXT: Record<LoginProgressDTO['state'], string> = {
  WAITING: '等待扫码…',
  SCANNED: '已扫码，请在小号手机上点「确认登录」',
  DONE: '登录成功',
  EXPIRED: '二维码已过期',
  ERROR: '查询登录进度出错，正在重试…',
}

function LoginCard({ adapter, onDone }: { adapter: 'wxpad' | 'console' | null; onDone: () => void }) {
  const [phase, setPhase] = useState<LoginPhase>({ kind: 'idle' })
  const [busy, setBusy] = useState<'wake' | 'qr' | null>(null)
  const [flash, setFlash] = useState<Flash>(null)
  const [now, setNow] = useState(() => Date.now())
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  const qrStartedAt = phase.kind === 'qr' ? phase.startedAt : null

  // 倒计时
  useEffect(() => {
    if (qrStartedAt === null) return
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [qrStartedAt])

  // 每 3 秒问一次登录进度（上一次回来之后才发下一次，不会叠请求）；离开页面 / 取消 / 结束即停
  useEffect(() => {
    if (qrStartedAt === null) return
    let alive = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const poll = async () => {
      if (!alive) return
      if (Date.now() - qrStartedAt >= LOGIN_WAIT_MS) {
        setPhase({ kind: 'ended', reason: '3 分钟内没有完成扫码登录，二维码已作废；需要的话重新获取' })
        return
      }
      const r = await api<LoginProgressDTO>('/api/admin/bot/login/progress')
      if (!alive) return
      const p = r.ok ? r.data : null
      if (p?.state === 'DONE') {
        setPhase({ kind: 'done', wxid: p.wxid, nickname: p.nickname })
        doneRef.current()
        return
      }
      if (p?.state === 'EXPIRED') {
        setPhase({ kind: 'ended', reason: p.error || '二维码已过期，请重新获取' })
        return
      }
      setPhase((cur) =>
        cur.kind === 'qr' && cur.startedAt === qrStartedAt ? { ...cur, state: p ? p.state : cur.state, error: p ? p.error : r.error } : cur
      )
      timer = setTimeout(poll, LOGIN_POLL_MS)
    }
    timer = setTimeout(poll, LOGIN_POLL_MS)
    return () => {
      alive = false
      if (timer) clearTimeout(timer)
    }
  }, [qrStartedAt])

  const wake = async () => {
    setBusy('wake')
    setFlash(null)
    const r = await api<{ ok: boolean }>('/api/admin/bot/login/wake', { method: 'POST' })
    setBusy(null)
    setFlash(
      r.ok
        ? { tone: 'ok', text: `${r.message || '已发出唤醒登录请求'}。约 1 分钟后点上面的「刷新状态」看小号是否恢复在线（小号手机上可能要点一下确认）；唤醒不成功再扫码。` }
        : { tone: 'err', text: r.error || '唤醒登录失败' }
    )
  }

  const getQr = async () => {
    setBusy('qr')
    setFlash(null)
    const r = await api<LoginQrDTO>('/api/admin/bot/login/qr', { method: 'POST' })
    setBusy(null)
    if (!r.ok || !r.data) {
      setFlash({ tone: 'err', text: r.error || '获取二维码失败' })
      return
    }
    setPhase({ kind: 'qr', src: r.data.qr, startedAt: Date.now(), state: 'WAITING', error: null })
  }

  const left = qrStartedAt === null ? 0 : Math.max(0, Math.ceil((LOGIN_WAIT_MS - (now - qrStartedAt)) / 1000))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-gray-500" /> 登录小号
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600">
          小号掉线后<b>先点「唤醒登录」</b>（首次掉线不唤醒、直接重新扫码会明显提高风控风险）；唤醒不成功，再「扫码登录」。
          扫码要用<b>小号自己的手机</b>；小号在手机上一直登着，服务器上是平板形态登录，默认不配同城代理（扫码后频繁被要求重新登录时再考虑）。
        </p>
        {adapter === 'console' && <Note tone="info">当前是 console 适配器（本地测试，不连微信），不需要登录小号。</Note>}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={wake} disabled={adapter === 'console' || busy !== null || phase.kind === 'qr'} loading={busy === 'wake'}>
            唤醒登录
          </Button>
          <Button onClick={getQr} disabled={adapter === 'console' || busy !== null || phase.kind === 'qr'} loading={busy === 'qr'}>
            扫码登录
          </Button>
        </div>
        <FlashNote flash={flash} onClose={() => setFlash(null)} />

        {phase.kind === 'qr' && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-start">
            {/* 二维码相当于小号的登录凭证：只放在内存里显示，不缓存、不落地 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={phase.src} alt="小号登录二维码" className="h-56 w-56 shrink-0 rounded-lg border border-gray-200 bg-white object-contain p-2" referrerPolicy="no-referrer" />
            <div className="min-w-0 space-y-2 text-sm">
              <div className="font-medium text-gray-900">{LOGIN_STATE_TEXT[phase.state]}</div>
              <div className="text-gray-600">
                用<b>小号的手机</b>微信「扫一扫」，再在手机上确认登录。二维码 <b>{left}</b> 秒后作废。
              </div>
              {phase.error && <div className="break-words text-xs text-red-600">{phase.error}</div>}
              <Button variant="outline" size="sm" onClick={() => setPhase({ kind: 'idle' })}>
                取消
              </Button>
            </div>
          </div>
        )}
        {phase.kind === 'done' && (
          <Note tone="ok" className="flex flex-wrap items-center justify-between gap-2">
            <span>
              登录成功：{phase.nickname || '（没拿到昵称）'}
              {phase.wxid ? `（${phase.wxid}）` : ''}。登录后头 48 小时是新号保护期，只给管理群发消息。
            </span>
            <button type="button" className="text-xs underline" onClick={() => setPhase({ kind: 'idle' })}>
              知道了
            </button>
          </Note>
        )}
        {phase.kind === 'ended' && (
          <Note tone="warn" className="flex flex-wrap items-center justify-between gap-2">
            <span>{phase.reason}</span>
            <button type="button" className="text-xs underline" onClick={() => setPhase({ kind: 'idle' })}>
              关闭
            </button>
          </Note>
        )}
      </CardContent>
    </Card>
  )
}

// ───────────────────────── 锁定 / 解锁 ─────────────────────────

function LockCard({ ov, onChanged }: { ov: OverviewDTO | null; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState<Flash>(null)
  const [unlockOpen, setUnlockOpen] = useState(false)
  const cfg = ov?.config ?? null

  const lock = async () => {
    const ok = window.confirm(
      '确定紧急锁定机器人？\n\n锁定后：提卡、补货与所有改设置的指令全部暂停，还没用的补货链接立即作废；查询与推送照常。\n解锁只能在后台操作。'
    )
    if (!ok) return
    setBusy(true)
    setFlash(null)
    const r = await api<LockResultDTO>('/api/admin/bot/lock', { method: 'POST' })
    setBusy(false)
    setFlash(r.ok ? { tone: 'ok', text: r.message || '已锁定' } : { tone: 'err', text: r.error || '锁定失败' })
    onChanged()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {cfg?.locked ? <Lock className="h-5 w-5 text-red-600" /> : <LockOpen className="h-5 w-5 text-gray-500" />} 锁定与解锁
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!cfg ? (
          <div className="text-gray-400">加载中...</div>
        ) : cfg.locked ? (
          <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-red-800">
              <div className="font-semibold">🔒 已锁定</div>
              <div>
                锁定人：{cfg.lockedBy || '—'} · 锁定时间：{bjTime(cfg.lockedAt, true)}
              </div>
              <div className="text-xs text-red-700">提卡、补货与所有改设置的指令都暂停了，查询与推送照常。解锁只能在后台。</div>
            </div>
            <Button variant="outline" className="shrink-0 border-red-300 text-red-700 hover:bg-red-100" onClick={() => setUnlockOpen(true)}>
              解锁…
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-gray-700">
              <div className="font-semibold text-green-700">未锁定</div>
              <div className="text-xs text-gray-500">
                发现不认识的提卡记录、管理员手机丢了、怀疑协议服务异常时，立即锁定。群里任何已登记的会话里发「@贝果助手 锁定」效果相同；解锁只能在这里。
              </div>
            </div>
            <Button variant="danger" className="shrink-0" onClick={lock} loading={busy} disabled={busy}>
              <Lock className="mr-1 h-4 w-4" /> 紧急锁定
            </Button>
          </div>
        )}
        <FlashNote flash={flash} onClose={() => setFlash(null)} />
      </CardContent>
      {cfg?.locked && (
        <UnlockModal
          open={unlockOpen}
          lockedAt={cfg.lockedAt}
          lockedBy={cfg.lockedBy}
          onClose={() => setUnlockOpen(false)}
          onResult={(res) => {
            if (res.ok) {
              setUnlockOpen(false)
              setFlash({ tone: 'ok', text: res.text })
            }
            onChanged()
          }}
        />
      )}
    </Card>
  )
}

/** 解锁的二次确认：说明「解锁只能在后台」与解锁前该排查什么，勾选确认后才能点「确认解锁」 */
function UnlockModal({
  open,
  lockedAt,
  lockedBy,
  onClose,
  onResult,
}: {
  open: boolean
  lockedAt: string | null
  lockedBy: string | null
  onClose: () => void
  onResult: (r: { ok: boolean; text: string }) => void
}) {
  const [checked, setChecked] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setChecked(false)
      setErr(null)
    }
  }, [open])

  const submit = async () => {
    setBusy(true)
    setErr(null)
    // 带上页面看到的锁定时间：期间有人又锁了一次，接口回 409，不会把新的锁定顺手解掉
    const r = await api<LockResultDTO>('/api/admin/bot/unlock', { method: 'POST', body: { lockedAt } })
    setBusy(false)
    if (r.ok) {
      onResult({ ok: true, text: r.message || '已解锁' })
      return
    }
    setErr(r.error || '解锁失败')
    if (r.status === 409) onResult({ ok: false, text: r.error || '' })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      title="解锁机器人"
      subtitle={`锁定人：${lockedBy || '—'} · 锁定时间：${bjTime(lockedAt, true)}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            取消
          </Button>
          <Button variant="danger" onClick={submit} disabled={!checked || busy} loading={busy}>
            确认解锁
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-gray-700">
        <Note tone="warn" className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>解锁只能在后台：群里发「解锁」不会被执行。解锁后，提卡、补货与改设置的指令立即恢复可用，并抄送企业微信。</span>
        </Note>
        <div>解锁前请确认已经排查清楚：</div>
        <ul className="list-disc space-y-1 pl-5">
          <li>「指令日志」与「提卡与补货」里没有不认识的操作；</li>
          <li>手机丢了 / 微信被盗的管理员，已在「管理员」里停用对应的微信身份；</li>
          <li>协议服务没有异常（上面的运行状态正常）。</li>
        </ul>
        <label className="flex items-start gap-2 rounded-lg border border-gray-200 p-3">
          <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          <span>我已排查完毕，确认解锁</span>
        </label>
        {err && <Note tone="err">{err}</Note>}
      </div>
    </Modal>
  )
}

// ───────────────────────── 测试消息 ─────────────────────────

/** 测试消息最多跟踪多久：发送器要按节奏排队，小号不在线时会一直等（10 分钟发不出去作废） */
const TEST_TRACK_MS = 3 * 60_000
const TEST_POLL_MS = 3000
const TEST_DONE = new Set(['SENT', 'FAILED', 'EXPIRED', 'CANCELLED', 'BLOCKED', 'MERGED'])
const TEST_MAX = 200

interface TestTrack {
  id: number
  startedAt: number
  label: string
  status: TestMessageStatusDTO | null
  timedOut: boolean
  error: string | null
}

function TestMessageCard({ botEnabled }: { botEnabled: boolean | null }) {
  const convs = useApi<ConvListDTO>('/api/admin/bot/conversations')
  const list = (convs.data?.list ?? []).filter((c) => c.status === 'ACTIVE' && c.adapter === convs.data?.currentAdapter)
  const [convId, setConvId] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState<Flash>(null)
  const [track, setTrack] = useState<TestTrack | null>(null)

  const trackId = track && !track.timedOut && !(track.status && TEST_DONE.has(track.status.status)) ? track.id : null
  const trackStarted = track?.startedAt ?? 0

  useEffect(() => {
    if (trackId === null) return
    let alive = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const poll = async () => {
      if (!alive) return
      if (Date.now() - trackStarted >= TEST_TRACK_MS) {
        setTrack((t) => (t && t.id === trackId ? { ...t, timedOut: true } : t))
        return
      }
      const r = await api<TestMessageStatusDTO>(`/api/admin/bot/test-message?id=${trackId}`)
      if (!alive) return
      setTrack((t) => (t && t.id === trackId ? { ...t, status: r.ok && r.data ? r.data : t.status, error: r.ok ? null : r.error } : t))
      if (r.ok && r.data && TEST_DONE.has(r.data.status)) return
      timer = setTimeout(poll, TEST_POLL_MS)
    }
    timer = setTimeout(poll, 1500)
    return () => {
      alive = false
      if (timer) clearTimeout(timer)
    }
  }, [trackId, trackStarted])

  const send = async () => {
    const id = Number(convId)
    if (!id) {
      setFlash({ tone: 'err', text: '请先选一个会话' })
      return
    }
    const c = list.find((x) => x.id === id)
    setBusy(true)
    setFlash(null)
    const r = await api<TestMessageDTO>('/api/admin/bot/test-message', { body: { conversationId: id, text: text.trim() || undefined } })
    setBusy(false)
    if (!r.ok || !r.data) {
      setFlash({ tone: 'err', text: r.error || '发送失败' })
      return
    }
    setFlash({ tone: 'ok', text: r.message || '已放进发送队列' })
    if (r.data.outboxId) {
      setTrack({
        id: r.data.outboxId,
        startedAt: Date.now(),
        label: c ? `#${c.id} ${c.name || '未命名'}` : `#${id}`,
        status: r.data.status ? { id: r.data.outboxId, status: r.data.status, attempts: 0, lastError: null, sentAt: null } : null,
        timedOut: false,
        error: null,
      })
    }
  }

  const st = track?.status ?? null
  const stMeta = st ? OUTBOX_STATUS[st.status] : null
  const len = Array.from(text.trim()).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-gray-500" /> 发一条测试消息
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-gray-600">绑定新群、换小号或群恢复推送之后，发一条确认「机器人到这个群的推送是通的」。每多发一条都多一分风控风险，别频繁发。</p>
        {botEnabled === false && <Note tone="warn">机器人没有启用（环境变量 BOT_ENABLED 不是 1），发送器不工作，测试消息发不出去。</Note>}
        {convs.err && <Note tone="err">读取会话列表失败：{convs.err}</Note>}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-gray-700">发到哪个会话</span>
            <select value={convId} onChange={(e) => setConvId(e.target.value)} className={cn(inputCls, 'mt-1 w-full')}>
              <option value="">{convs.loading && !convs.data ? '加载中...' : list.length ? '请选择（只列推送中的会话）' : '没有推送中的会话'}</option>
              {list.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.id} {c.name || '未命名'}（{KIND_LABEL[c.kind] ?? c.kind}
                  {c.site ? ` · ${c.site.name}` : ''}）
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-gray-700">
              内容（可不填）<span className="ml-1 text-xs text-gray-400">{len}/{TEST_MAX}</span>
            </span>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={TEST_MAX * 2}
              placeholder="不填 = 「🤖 测试消息：机器人到本群的推送正常（时间）」"
              className={cn(inputCls, 'mt-1 w-full', len > TEST_MAX && 'border-red-500')}
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={send} disabled={busy || !convId || len > TEST_MAX || botEnabled === false} loading={busy}>
            <Send className="mr-1 h-4 w-4" /> 发送测试消息
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void convs.reload()}>
            刷新会话列表
          </Button>
        </div>
        <FlashNote flash={flash} onClose={() => setFlash(null)} />
        {track && (
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-gray-700">测试消息 #{track.id} → {track.label}</span>
              {stMeta ? <Badge tone={stMeta.tone}>{stMeta.text}</Badge> : <Badge tone="blue">查询中</Badge>}
              {trackId !== null && <RefreshCw className="h-3.5 w-3.5 animate-spin text-gray-400" />}
            </div>
            {st?.sentAt && <div className="mt-1 text-xs text-gray-500">发出时间：{bjTime(st.sentAt, true)}</div>}
            {st && st.attempts > 0 && <div className="mt-1 text-xs text-gray-500">已尝试 {st.attempts} 次</div>}
            {st?.lastError && <div className="mt-1 break-words text-xs text-red-600">最近一次错误：{st.lastError}</div>}
            {track.error && <div className="mt-1 text-xs text-red-600">{track.error}</div>}
            {track.timedOut && (
              <div className="mt-1 text-xs text-amber-700">
                3 分钟内还没发出：消息仍在队列里，10 分钟内发不出去会自动作废。可能小号不在线，或发送器在按节奏排队。
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
