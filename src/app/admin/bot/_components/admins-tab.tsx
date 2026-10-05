'use client'

/**
 * 「管理员」标签（docs/微信机器人-设计.md §7.1、§10、§14）。
 * 机器人只认「登记过的管理员的微信（wxid）」：后台添加一个管理员 → 生成认领码 → 该管理员用自己的微信私聊小号发「认领 <码>」，
 * 中枢把那条私聊的发送人 wxid 记成该管理员的微信身份（认领只认私聊，群里发无效）。
 *  · 认领码明文只在生成的那一次响应里出现（库里只存哈希），这里只放在弹窗的组件状态里，关掉就没了；
 *  · 停用管理员、停用 / 启用某个微信身份都要确认；最高级别往上调也要确认（T3 = 能提卡、补货）。
 * 手机丢了 / 微信被盗的处置：概览里锁定 → 这里停用对应的微信身份 → 找回后重新认领 → 概览里解锁（§11.7）。
 */
import { useState } from 'react'
import { CheckCircle2, Copy, KeyRound, RefreshCw, UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/admin/marketing/modal'
import { cn } from '@/lib/utils'
import type { AdminDTO, AdminIdentityDTO, ClaimCodeDTO } from '../types'
import { api, Badge, bjTime, FlashNote, inputCls, Note, TIER_TEXT, useApi, type Flash } from './shared'

const TIERS = [0, 1, 2, 3]

export function AdminsTab() {
  const admins = useApi<{ list: AdminDTO[] }>('/api/admin/bot/admins')
  const [flash, setFlash] = useState<Flash>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [claim, setClaim] = useState<{ admin: AdminDTO; code: ClaimCodeDTO } | null>(null)
  // 添加
  const [name, setName] = useState('')
  const [tier, setTier] = useState(3)
  const [linkSelf, setLinkSelf] = useState(false)
  const [withCode, setWithCode] = useState(true)

  const list = admins.data?.list ?? []

  const genCode = async (a: AdminDTO): Promise<void> => {
    if (a.claimPending && !window.confirm(`「${a.name}」还有一个没用掉的认领码（${bjTime(a.claimExpiresAt)} 前有效），重新生成会让它作废。继续？`)) return
    setBusy(`claim:${a.id}`)
    setFlash(null)
    const r = await api<ClaimCodeDTO>(`/api/admin/bot/admins/${a.id}/claim`, { method: 'POST' })
    setBusy(null)
    if (!r.ok || !r.data) {
      setFlash({ tone: 'err', text: r.error || '生成认领码失败' })
      return
    }
    setClaim({ admin: a, code: r.data })
    void admins.reload()
  }

  const add = async () => {
    const n = name.trim()
    if (!n) {
      setFlash({ tone: 'err', text: '请填写管理员名称' })
      return
    }
    setBusy('add')
    setFlash(null)
    const r = await api<{ admin: AdminDTO }>('/api/admin/bot/admins', { body: { name: n, maxTier: tier, linkSelf } })
    setBusy(null)
    if (!r.ok || !r.data) {
      setFlash({ tone: 'err', text: r.error || '添加管理员失败' })
      return
    }
    setName('')
    void admins.reload()
    if (withCode) await genCode(r.data.admin)
    else setFlash({ tone: 'ok', text: r.message || '已添加' })
  }

  const patchAdmin = async (a: AdminDTO, body: Record<string, unknown>) => {
    setBusy(`admin:${a.id}`)
    setFlash(null)
    const r = await api<{ admin: AdminDTO; revokedTokens?: number }>(`/api/admin/bot/admins/${a.id}`, { method: 'PATCH', body })
    setBusy(null)
    setFlash(r.ok ? { tone: 'ok', text: `「${a.name}」：${r.message || '已保存'}` } : { tone: 'err', text: r.error || '保存失败' })
    void admins.reload()
  }

  const toggleAdmin = (a: AdminDTO, enabled: boolean) => {
    const text = enabled
      ? `重新启用管理员「${a.name}」？\n\n该管理员名下的微信身份会原样恢复。如果怀疑其中某个微信被盗，请先在下面停用那个微信身份。`
      : `停用管理员「${a.name}」？\n\n停用立即生效：该管理员的所有微信发的指令都不会再被执行，没用掉的认领码与该管理员发起的补货链接一并作废。之后可以重新启用。`
    if (!window.confirm(text)) return
    void patchAdmin(a, { enabled })
  }

  const changeTier = (a: AdminDTO, t: number) => {
    if (t === a.maxTier) return
    if (t > a.maxTier && !window.confirm(`把「${a.name}」的最高级别从「${TIER_TEXT[a.maxTier]}」提到「${TIER_TEXT[t]}」？`)) return
    void patchAdmin(a, { maxTier: t })
  }

  const toggleIdentity = async (a: AdminDTO, i: AdminIdentityDTO) => {
    const who = i.nickname ? `${i.nickname}（${i.wxid}）` : i.wxid
    const text = i.enabled
      ? `停用微信身份「${who}」？\n\n停用后这个微信发的指令不会再被执行（该管理员的其它微信不受影响）。找回微信后，让该管理员重新认领即可恢复。`
      : `重新启用微信身份「${who}」？\n\n请先确认这个微信号没有落到别人手里。`
    if (!window.confirm(text)) return
    setBusy(`id:${i.id}`)
    setFlash(null)
    const r = await api<{ admin: AdminDTO }>(`/api/admin/bot/admins/${a.id}/identities/${i.id}`, { method: 'PATCH', body: { enabled: !i.enabled } })
    setBusy(null)
    setFlash(r.ok ? { tone: 'ok', text: r.message || '已保存' } : { tone: 'err', text: r.error || '保存失败' })
    void admins.reload()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-gray-500" /> 添加管理员
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
            <label className="block">
              <span className="text-gray-700">名称</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="例如：站长、客服小李" className={cn(inputCls, 'mt-1 w-full')} />
            </label>
            <label className="block">
              <span className="text-gray-700">最高级别</span>
              <select value={tier} onChange={(e) => setTier(Number(e.target.value))} className={cn(inputCls, 'mt-1 w-full')}>
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {TIER_TEXT[t]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" checked={linkSelf} onChange={(e) => setLinkSelf(e.target.checked)} />
              <span>
                关联当前登录的站内账号<span className="ml-1 text-xs text-gray-400">（添加的是自己时勾上：该管理员在机器人里的操作，审计的操作人就记成这个账号）</span>
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" checked={withCode} onChange={(e) => setWithCode(e.target.checked)} />
              <span>添加后立即生成认领码</span>
            </label>
          </div>
          <Button onClick={add} loading={busy === 'add'} disabled={busy !== null}>
            添加
          </Button>
          <p className="text-xs text-gray-500">
            级别：T0 帮助、状态；T1 查经营数据；T2 改机器人设置、绑定、锁定；T3 提卡、补货。给客服同事只开 T1 即可。小号要先加该管理员为微信好友，认领只认私聊。
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>管理员（{list.length}）</CardTitle>
          <Button variant="outline" size="sm" onClick={() => void admins.reload()}>
            <RefreshCw className={cn('mr-1 h-4 w-4', admins.loading && 'animate-spin')} /> 刷新
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {admins.err && <Note tone="err">{admins.err}</Note>}
          <FlashNote flash={flash} onClose={() => setFlash(null)} />
          {!admins.data && !admins.err ? (
            <div className="py-10 text-center text-gray-400">加载中...</div>
          ) : list.length === 0 ? (
            <div className="py-10 text-center text-gray-400">还没有管理员。先在上面添加，再让该管理员私聊小号认领。</div>
          ) : (
            list.map((a) => (
              <div key={a.id} className={cn('rounded-xl border border-gray-200 p-4', !a.enabled && 'bg-gray-50')}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('text-base font-semibold', a.enabled ? 'text-gray-900' : 'text-gray-500')}>{a.name}</span>
                    <span className="text-xs text-gray-400">#{a.id}</span>
                    <Badge tone={a.enabled ? 'green' : 'gray'}>{a.enabled ? '启用' : '已停用'}</Badge>
                    {a.claimPending && <Badge tone="blue">认领码有效至 {bjTime(a.claimExpiresAt)}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => void genCode(a)} disabled={!a.enabled || busy !== null} loading={busy === `claim:${a.id}`}>
                      <KeyRound className="mr-1 h-4 w-4" /> 生成认领码
                    </Button>
                    {a.enabled ? (
                      <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => toggleAdmin(a, false)} disabled={busy !== null}>
                        停用
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => toggleAdmin(a, true)} disabled={busy !== null}>
                        启用
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                  <div className="text-gray-600">
                    站内账号：
                    {a.siteUser ? (
                      <span className="text-gray-900">
                        {a.siteUser.label}（#{a.siteUser.id}）
                      </span>
                    ) : (
                      <span className="text-gray-400">未关联（审计里只有名字）</span>
                    )}
                  </div>
                  <label className="flex flex-wrap items-center gap-2 text-gray-600">
                    最高级别：
                    <select value={a.maxTier} onChange={(e) => changeTier(a, Number(e.target.value))} disabled={busy !== null} className={inputCls}>
                      {TIERS.map((t) => (
                        <option key={t} value={t}>
                          {TIER_TEXT[t]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="mt-3">
                  <div className="text-xs font-medium text-gray-500">微信身份（{a.identities.length}）</div>
                  {a.identities.length === 0 ? (
                    <div className="mt-1 text-sm text-gray-400">还没有认领：生成认领码，让该管理员用自己的微信私聊小号发「认领 认领码」。</div>
                  ) : (
                    <ul className="mt-1 divide-y divide-gray-100 rounded-lg border border-gray-100">
                      {a.identities.map((i) => (
                        <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                          <div className="min-w-0">
                            <span className={cn('font-medium', !i.enabled && 'text-gray-400')}>{i.nickname || '（没有昵称）'}</span>
                            <span className="ml-2 break-all font-mono text-xs text-gray-500">{i.wxid}</span>
                            <span className="ml-2 text-xs text-gray-400">
                              {i.adapter} · {bjTime(i.createdAt, true)} 认领
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge tone={i.enabled ? 'green' : 'gray'}>{i.enabled ? '有效' : '已停用'}</Badge>
                            <button
                              type="button"
                              onClick={() => void toggleIdentity(a, i)}
                              disabled={busy !== null}
                              className={cn('rounded px-2 py-1 text-xs hover:bg-gray-100 disabled:opacity-40', i.enabled ? 'text-red-600' : 'text-green-700')}
                            >
                              {i.enabled ? '停用' : '启用'}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {!a.enabled && a.identities.some((i) => i.enabled) && (
                    <div className="mt-1 text-xs text-gray-400">管理员已停用：上面标「有效」的微信身份现在也不会被认（重新启用管理员后恢复）。</div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {claim && <ClaimModal data={claim} onClose={() => setClaim(null)} />}
    </div>
  )
}

/** 认领码弹窗：明文只显示这一次（关掉就看不到了），带「复制整句」按钮 */
function ClaimModal({ data, onClose }: { data: { admin: AdminDTO; code: ClaimCodeDTO }; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const phrase = `认领 ${data.code.code}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(phrase)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 剪贴板不可用（非安全上下文、浏览器拒绝）：退回手动复制
      window.prompt('复制下面这句话：', phrase)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`认领码 · ${data.admin.name}`}
      subtitle={`${data.code.ttlMinutes} 分钟内有效（到 ${bjTime(data.code.expiresAt, true)}），只能用一次`}
      footer={<Button onClick={onClose}>已发给该管理员，关闭</Button>}
    >
      <div className="space-y-4 text-sm text-gray-700">
        <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 text-center">
          <div className="select-all font-mono text-3xl font-bold tracking-[0.3em] text-primary-700">{data.code.code}</div>
        </div>
        <div>
          请该管理员在 <b>{data.code.ttlMinutes} 分钟内</b>，用<b>自己的微信私聊小号</b>发：
        </div>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 break-all rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono">{phrase}</code>
          <Button variant="outline" size="sm" onClick={() => void copy()}>
            {copied ? <CheckCircle2 className="mr-1 h-4 w-4 text-green-600" /> : <Copy className="mr-1 h-4 w-4" />}
            {copied ? '已复制' : '复制'}
          </Button>
        </div>
        <Note tone="warn">
          认领码明文只显示这一次，关掉就看不到了（库里只存哈希）；再生成一个会让这个作废。认领只认私聊、群里发无效；小号要先加该管理员为微信好友。
          认领成功后，小号会私聊回复「已认领」，这里的微信身份列表也会多一行。
        </Note>
      </div>
    </Modal>
  )
}
