'use client'

/**
 * 「概览」里的「微信绑定」卡片（iLink，docs/微信机器人-设计.md 附录 E；BOT_ADAPTER=ilink 时代替「登录小号」）：
 *  · 列出每个绑定：推送窗口还开着没有（从对方最近一条消息起约 24 小时）、收消息循环、待发与搁置的条数；
 *  · 新建绑定：选「管理员」（可勾「允许提卡补货」）或「分站代理」→ 生成二维码 → 用要绑定的那个微信扫码确认
 *    （或复制链接发给对方、在微信里点开）；微信要配对码时输入手机上显示的数字；每 2 秒问一次进度；
 *  · 暂停 / 恢复 / 解绑 / 订阅在「会话」标签里改（与群会话同一套）。
 * 二维码与链接等同于绑定凭据（谁先扫绑到谁）：只放在组件状态里，不写 localStorage。
 */
import { useEffect, useRef, useState } from 'react'
import { Copy, QrCode, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { IlinkBindViewDTO, IlinkBindingDTO, IlinkOverviewDTO } from '../types'
import { ago, api, Badge, bjTime, CONV_STATUS, FlashNote, inputCls, Note, SITE_STATUS, useApi, type Flash } from './shared'

const POLL_MS = 2000

const STATE_TEXT: Record<IlinkBindViewDTO['state'], string> = {
  WAITING: '等待扫码…',
  SCANNED: '已扫码，请在手机微信上确认',
  NEED_CODE: '请输入手机微信上显示的数字',
  DONE: '绑定成功',
  ALREADY: '这个微信已经绑定过了',
  EXPIRED: '二维码已过期',
  ERROR: '绑定失败',
  CANCELLED: '已取消',
}

const FINAL: readonly IlinkBindViewDTO['state'][] = ['DONE', 'ALREADY', 'EXPIRED', 'ERROR', 'CANCELLED']

export function IlinkCard({ onChanged }: { onChanged?: () => void }) {
  const { data, err, loading, reload } = useApi<IlinkOverviewDTO>('/api/admin/bot/ilink')
  const [kind, setKind] = useState<'MGMT' | 'TENANT'>('MGMT')
  const [adminId, setAdminId] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [allowT3, setAllowT3] = useState(false)
  const [busy, setBusy] = useState<'start' | 'code' | null>(null)
  const [flash, setFlash] = useState<Flash>(null)
  const [bind, setBind] = useState<IlinkBindViewDTO | null>(null)
  const [code, setCode] = useState('')
  const [now, setNow] = useState(() => Date.now())
  const changedRef = useRef(onChanged)
  changedRef.current = onChanged

  const activeId = bind && !FINAL.includes(bind.state) ? bind.id : null

  // 进行中：每 2 秒问一次进度（上一次回来之后才发下一次）；结束即停
  useEffect(() => {
    if (!activeId) return
    let alive = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const poll = async () => {
      if (!alive) return
      const r = await api<IlinkBindViewDTO>(`/api/admin/bot/ilink/bind?id=${activeId}`)
      if (!alive) return
      if (r.ok && r.data) {
        const v = r.data
        setBind(v)
        if (FINAL.includes(v.state)) {
          if (v.state === 'DONE') {
            void reload()
            changedRef.current?.()
          }
          return
        }
      } else if (r.status === 404) {
        setBind((cur) => (cur && cur.id === activeId ? { ...cur, state: 'EXPIRED', qr: null, link: null, message: r.error } : cur))
        return
      }
      timer = setTimeout(poll, POLL_MS)
    }
    timer = setTimeout(poll, POLL_MS)
    return () => {
      alive = false
      if (timer) clearTimeout(timer)
    }
  }, [activeId, reload])

  // 倒计时
  useEffect(() => {
    if (!activeId) return
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [activeId])

  const start = async () => {
    setFlash(null)
    const body = kind === 'MGMT' ? { kind, adminId: Number(adminId), allowT3 } : { kind, tenantId: Number(tenantId) }
    if (kind === 'MGMT' && !adminId) return setFlash({ tone: 'err', text: '请选择要绑定的管理员' })
    if (kind === 'TENANT' && !tenantId) return setFlash({ tone: 'err', text: '请选择分站' })
    setBusy('start')
    const r = await api<IlinkBindViewDTO>('/api/admin/bot/ilink/bind', { method: 'POST', body })
    setBusy(null)
    if (!r.ok || !r.data) return setFlash({ tone: 'err', text: r.error || '生成二维码失败' })
    setCode('')
    setBind(r.data)
  }

  const submitCode = async () => {
    if (!bind) return
    setBusy('code')
    const r = await api<{ ok: boolean }>('/api/admin/bot/ilink/bind/code', { method: 'POST', body: { id: bind.id, code: code.trim() } })
    setBusy(null)
    if (!r.ok) return setFlash({ tone: 'err', text: r.error || '提交失败' })
    setBind({ ...bind, codeWrong: false, message: '已提交，正在核对…' })
  }

  const cancel = async () => {
    if (!bind) return
    await api(`/api/admin/bot/ilink/bind?id=${bind.id}`, { method: 'DELETE' })
    setBind({ ...bind, state: 'CANCELLED', qr: null, link: null, message: '已取消' })
  }

  const copyLink = async () => {
    if (!bind?.link) return
    try {
      await navigator.clipboard.writeText(bind.link)
      setFlash({ tone: 'ok', text: '链接已复制。只发给要绑定的那个人：谁先在微信里点开，就绑到谁的微信上。' })
    } catch {
      setFlash({ tone: 'warn', text: '复制失败，请手动选中链接复制' })
    }
  }

  const left = bind && activeId ? Math.max(0, Math.ceil((Date.parse(bind.expiresAt) - now) / 1000)) : 0
  const admins = data?.admins.filter((a) => a.enabled) ?? []
  const tenants = data?.tenants ?? []
  const blocked = !data || !data.adapterIsIlink || !data.cardKeyConfigured

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-gray-500" /> 微信绑定（微信官方 ClawBot · 一对一）
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => void reload()} disabled={loading}>
          <RefreshCw className={cn('mr-1 h-4 w-4', loading && 'animate-spin')} /> 刷新
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          不用小号、没有群：每个人用<b>自己的微信</b>扫码，绑定成一个只属于他的对话。<b>管理员</b>绑定收全站动态、能发指令（提卡、补货要单独允许）；
          <b>分站代理</b>绑定只收本分站的动态与日报。微信规定机器人只能在对方最近一条消息后约 <b>24 小时</b>内发消息：对方一天没回复，推送会暂停，
          对方回任意一个字就恢复（搁置的消息补发，过期的会说明条数）。
        </p>
        {err && <Note tone="err">{err}</Note>}
        {data && !data.adapterIsIlink && <Note tone="warn">当前机器人不是 iLink 方式：.env.production 设 BOT_ADAPTER=ilink 后重建 app 才能绑定。</Note>}
        {data && !data.botEnabled && <Note tone="warn">BOT_ENABLED 没开：可以先绑定，但要开了才会收发消息。</Note>}
        {data && !data.cardKeyConfigured && <Note tone="err">没有配置 CARDKEY_SECRET：绑定凭据要用它加密保存，没配不能绑定。</Note>}

        {data &&
          (data.bindings.length ? (
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
              {data.bindings.map((b) => (
                <BindingRow key={b.id} b={b} />
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">还没有绑定。先把你自己的微信绑成管理员（下面选「管理员」）。</div>
          ))}

        {bind ? (
          <div className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-start">
            {bind.qr && (
              // 二维码 = 绑定凭据：只在内存里显示，不缓存、不落地
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bind.qr} alt="微信绑定二维码" className="h-56 w-56 shrink-0 rounded-lg border border-gray-200 bg-white object-contain p-2" />
            )}
            <div className="min-w-0 flex-1 space-y-2 text-sm">
              <div className="font-medium text-gray-900">
                {bind.name}：{STATE_TEXT[bind.state]}
              </div>
              {bind.message && <div className={cn('break-words', bind.state === 'ERROR' || bind.codeWrong ? 'text-red-600' : 'text-gray-700')}>{bind.message}</div>}
              {activeId && (
                <div className="text-gray-600">
                  用<b>要绑定的那个微信</b>「扫一扫」并确认；或者把链接发给对方，在微信里点开。<b>{left}</b> 秒后结束（二维码中途过期会自动换新）。
                </div>
              )}
              {bind.link && (
                <div className="flex flex-wrap items-center gap-2">
                  <code className="min-w-0 break-all rounded bg-gray-50 px-2 py-1 text-xs text-gray-700">{bind.link}</code>
                  <Button variant="outline" size="sm" onClick={copyLink}>
                    <Copy className="mr-1 h-4 w-4" /> 复制链接
                  </Button>
                </div>
              )}
              {bind.state === 'NEED_CODE' && (
                <div className="flex flex-wrap items-center gap-2">
                  <input className={cn(inputCls, 'w-36')} inputMode="numeric" maxLength={8} placeholder="手机上显示的数字" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
                  <Button size="sm" onClick={submitCode} loading={busy === 'code'} disabled={busy !== null || code.length < 4}>
                    提交
                  </Button>
                </div>
              )}
              {activeId ? (
                <Button variant="outline" size="sm" onClick={cancel}>
                  取消
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setBind(null)}>
                  关闭
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-gray-200 p-4 text-sm">
            <div className="font-medium text-gray-900">新建绑定</div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <label className="flex items-center gap-2">
                <input type="radio" checked={kind === 'MGMT'} onChange={() => setKind('MGMT')} /> 管理员（收全站动态、能发指令）
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={kind === 'TENANT'} onChange={() => setKind('TENANT')} /> 分站代理（只收本站动态）
              </label>
            </div>
            {kind === 'MGMT' ? (
              <div className="space-y-2">
                <select className={cn(inputCls, 'max-w-xs')} value={adminId} onChange={(e) => setAdminId(e.target.value)}>
                  <option value="">选择管理员…</option>
                  {admins.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                {data && !admins.length && <Note tone="warn">还没有启用的管理员：先到「管理员」标签添加一位（填你自己）。</Note>}
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" checked={allowT3} onChange={(e) => setAllowT3(e.target.checked)} />
                  <span>允许在这个微信里提卡、补货（只有扫码的这个微信能用；之后也能在「会话」里改）</span>
                </label>
              </div>
            ) : (
              <select className={cn(inputCls, 'max-w-xs')} value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
                <option value="">选择分站…</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}（{t.code}）{t.status !== 'ACTIVE' ? ` · ${SITE_STATUS[t.status] || t.status}` : ''}
                  </option>
                ))}
              </select>
            )}
            <div>
              <Button onClick={start} loading={busy === 'start'} disabled={busy !== null || blocked}>
                生成二维码
              </Button>
            </div>
          </div>
        )}
        <FlashNote flash={flash} onClose={() => setFlash(null)} />
      </CardContent>
    </Card>
  )
}

function BindingRow({ b }: { b: IlinkBindingDTO }) {
  const status = b.stale ? { text: '已失效，需重新扫码', tone: 'red' as const } : CONV_STATUS[b.status] || { text: b.status, tone: 'gray' as const }
  const loop = b.loop
  return (
    <li className="space-y-1 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-gray-900">{b.name || `#${b.id}`}</span>
        <Badge tone={b.kind === 'MGMT' ? 'blue' : 'gray'}>{b.kind === 'MGMT' ? `管理员${b.adminName ? ` · ${b.adminName}` : ''}` : `分站 ${b.tenantCode || ''}`}</Badge>
        <Badge tone={status.tone}>{status.text}</Badge>
        {b.kind === 'MGMT' && b.allowT3 && <Badge tone="amber">可提卡补货</Badge>}
        <span className="text-xs text-gray-400">#{b.id} · 绑定于 {bjTime(b.boundAt)}</span>
      </div>
      {!b.credsOk && <div className="text-xs text-red-600">绑定凭据解不开（CARDKEY_SECRET 换了？）：请在「会话」里解绑后重新绑定。</div>}
      <div className={cn('text-xs', b.windowOpen ? 'text-green-700' : 'text-amber-700')}>
        推送窗口：
        {b.windowOpen
          ? `开着（到 ${bjTime(b.windowEndsAt)}，对方再回复会顺延）`
          : b.ctxAt
            ? `关着——对方 ${ago(b.ctxAt)}回复过，超过 24 小时；对方回任意一个字即可恢复`
            : '还没收到对方的第一条消息（微信规定要对方先发一条，之后才能推送）'}
      </div>
      <div className="text-xs text-gray-500">
        收消息：{loop ? (loop.running ? (loop.lastError ? `出错（${loop.lastError}），自动重试中` : `正常${loop.lastOkAt ? `（${ago(loop.lastOkAt)}）` : ''}`) : '已停止') : '未运行（每分钟自动拉起）'}
        {' · '}待发 {b.pending} 条{b.deferred ? `（其中 ${b.deferred} 条在等对方回复）` : ''}
        {b.lastInboundAt ? ` · 最近消息 ${ago(b.lastInboundAt)}` : ''}
      </div>
    </li>
  )
}
