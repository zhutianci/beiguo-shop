'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, ShieldAlert } from 'lucide-react'

/*
 * 后台「安全」卡片（2026-10-15 攻防加固，docs/安全-攻防加固设计-1015.md）：
 * 注册邮箱分级的两份后台名单、被自动封禁的 IP、最近的安全记录。接口 /api/admin/security。
 */

interface SecEvent {
  id: number
  at: string
  action: string
  actorUserId: number | null
  targetType: string | null
  targetId: string | null
  reason: string | null
  ip: string | null
}

type Policy = 'STRICT' | 'TIERED'

interface SecData {
  policy: Policy
  trusted: string
  blocked: string
  builtin: { trusted: number; blocked: number }
  ipBans: { key: string; until: number; reason: string }[]
  events: SecEvent[]
  edge?: { enabled: boolean; bans: { key: string; until: number; reason: string; country: string | null; count: number }[]; whitelist: string }
}

const ACTION_LABEL: Record<string, string> = {
  'sec.ban': '封禁账号',
  'sec.ipban': '封禁 IP',
  'sec.probe.pay_callback': '盲猜支付回调',
  'sec.probe.admin_denied': '普通用户试后台',
  'sec.probe.api_404': '探测不存在的接口',
  'sec.probe.idor': '越权访问别人的订单',
  'sec.edgeban': '⛔ Cloudflare 边缘封禁',
  'sec.edgeunban': '解除边缘封禁',
  'sec.sudo': '二次验证',
}

const REASON_LABEL: Record<string, string> = {
  PAY_CALLBACK: '盲猜支付回调',
  ADMIN_DENIED: '普通用户试后台',
  API_404: '探测不存在的接口',
}

function fmtTime(s: string | number): string {
  return new Date(s).toLocaleString('zh-CN', { hour12: false })
}

const textareaCls =
  'w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20'

export default function SecurityCard() {
  const [data, setData] = useState<SecData | null>(null)
  const [loading, setLoading] = useState(true)
  const [policy, setPolicy] = useState<Policy>('STRICT')
  const [trusted, setTrusted] = useState('')
  const [blocked, setBlocked] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgOk, setMsgOk] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/security')
      const d = await res.json()
      if (d.success) {
        setData(d.data)
        setPolicy(d.data.policy)
        setTrusted(d.data.trusted)
        setBlocked(d.data.blocked)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const save = async () => {
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/admin/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy, trusted, blocked }),
      })
      const d = await res.json()
      setMsgOk(!!d.success)
      setMsg(d.success ? d.message || '已保存' : d.error || '保存失败')
      if (d.success) {
        setPolicy((d.data.policy as Policy) ?? policy)
        setTrusted(d.data.trusted ?? trusted)
        setBlocked(d.data.blocked ?? blocked)
      }
    } catch {
      setMsgOk(false)
      setMsg('网络错误')
    } finally {
      setSaving(false)
    }
  }

  const unban = async (key: string) => {
    if (!confirm(`解封 ${key}？`)) return
    const res = await fetch('/api/admin/security', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unbanIp: key }),
    })
    const d = await res.json()
    if (!d.success) return alert(d.error || '操作失败')
    load()
  }

  // Cloudflare 边缘封禁（lib/security/edge-ban.ts，2026-10-25）
  const [edgeWl, setEdgeWl] = useState('')
  useEffect(() => {
    if (data?.edge) setEdgeWl(data.edge.whitelist)
  }, [data])
  const edgeUnban = async (key: string) => {
    if (!confirm(`解除 ${key} 的边缘封禁？（误封时用；这个 IP 马上就能再访问网站）`)) return
    const res = await fetch('/api/admin/security', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edgeUnban: key }),
    })
    const d = await res.json()
    if (!d.success) return alert(d.error || '操作失败')
    load()
  }
  const saveEdgeWl = async () => {
    const res = await fetch('/api/admin/security', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ edgeWhitelist: edgeWl }),
    })
    const d = await res.json()
    if (!d.success) return alert(d.error || '保存失败')
    setEdgeWl(d.data.edgeWhitelist ?? edgeWl)
    alert('白名单已保存，2 分钟内生效')
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          安全
        </CardTitle>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-1" /> 刷新
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">注册邮箱</h3>
          <p className="text-sm text-gray-500 mb-3">
            主流邮箱（QQ、163、126、139、189、华为、Gmail、Outlook、iCloud 等 {data?.builtin.trusted ?? '—'} 个）、教育 / 政府域名和下面「信任」名单里的域名永远能注册。
            只影响新注册，老用户登录、找回密码不受影响。保存后立即生效。
          </p>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            {(
              [
                { v: 'STRICT', t: '严格白名单', d: '只有上面这些能注册，其余一律提示「该邮箱类型暂不支持注册」' },
                { v: 'TIERED', t: '分级', d: `一次性邮箱（内置 ${data?.builtin.blocked ?? '—'} 个）与「拦截」名单不让注册；其余能注册，但新号头 24 小时只能有 1 笔待付订单` },
              ] as { v: Policy; t: string; d: string }[]
            ).map((o) => (
              <label
                key={o.v}
                className={`flex flex-1 cursor-pointer gap-2 rounded-lg border px-3 py-2 text-sm ${policy === o.v ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}
              >
                <input type="radio" name="email-policy" className="mt-1" checked={policy === o.v} onChange={() => setPolicy(o.v)} />
                <span>
                  <span className="font-medium text-gray-900">{o.t}</span>
                  <span className="block text-xs text-gray-500">{o.d}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">信任的邮箱域名（客户的企业邮箱等）</label>
              <textarea value={trusted} onChange={(e) => setTrusted(e.target.value)} rows={6} placeholder={'transwarp.io\nanker-in.com'} className={textareaCls} />
              <p className="mt-1 text-xs text-gray-400">已知的一次性邮箱填进来不会生效（防误操作）。</p>
            </div>
            <div className={policy === 'STRICT' ? 'opacity-50' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">拦截的邮箱域名（只在「分级」模式下用）</label>
              <textarea value={blocked} onChange={(e) => setBlocked(e.target.value)} rows={6} placeholder="maxxspace.com" className={textareaCls} />
              <p className="mt-1 text-xs text-gray-400">严格白名单下不在信任名单里的本来就不能注册；主流邮箱填进来也不会生效。</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-3">
            {msg && <span className={`mr-auto text-sm ${msgOk ? 'text-green-700' : 'text-red-600'}`}>{msg}</span>}
            <Button onClick={save} loading={saving} disabled={loading}>
              保存
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">被自动封禁的 IP</h3>
          <p className="text-sm text-gray-500 mb-2">
            盲猜支付回调、大量探测不存在的接口、普通用户反复试后台时自动封 1 小时，只挡登录 / 注册 / 下单 / 付款 / 上传，浏览不受影响。发版重启后清空。
          </p>
          {!data?.ipBans.length ? (
            <div className="text-sm text-gray-400">当前没有</div>
          ) : (
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {data.ipBans.map((b) => (
                <div key={b.key} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="font-mono">{b.key}</span>
                  <span className="text-gray-500">{REASON_LABEL[b.reason] ?? b.reason}</span>
                  <span className="text-gray-400 text-xs">至 {fmtTime(b.until)}</span>
                  <button onClick={() => unban(b.key)} className="text-xs text-primary-600 hover:underline">
                    解封
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Cloudflare 边缘封禁（整站不可访问）</h3>
          <p className="text-sm text-gray-500 mb-2">
            {data?.edge?.enabled
              ? '确认恶意的 IP（盲猜支付回调、越权、大量探测接口、扫描敏感文件；10 分钟快速触发或 24 小时累计）会被推到 Cloudflare，整站都打不开。境外首次 24 小时、7 天内再犯 7 天；国内首次 2 小时、再犯 24 小时，到期自动解封。收款手机与你登录后台用过的 IP 永远不封。'
              : '未启用：服务器没有配置 Cloudflare 接口（CF_API_TOKEN / CF_ZONE_ID），或被 EDGE_BAN=0 关掉了。'}
          </p>
          {!data?.edge?.bans.length ? (
            <div className="text-sm text-gray-400">当前没有</div>
          ) : (
            <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {data.edge.bans.map((b) => (
                <div key={b.key} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2 text-sm">
                  <span className="font-mono">
                    {b.key}
                    {b.country ? <span className="ml-1 text-xs text-gray-400">{b.country}</span> : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-gray-500" title={b.reason}>
                    {b.reason}
                  </span>
                  <span className="text-gray-400 text-xs">至 {fmtTime(b.until)}</span>
                  <button onClick={() => edgeUnban(b.key)} className="text-xs text-primary-600 hover:underline">
                    解封
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="mt-3 block text-sm font-medium text-gray-700 mb-1.5">永不封禁的 IP（白名单，每行一个；IPv6 整段 /64 生效）</label>
          <textarea value={edgeWl} onChange={(e) => setEdgeWl(e.target.value)} rows={3} placeholder="例如公司出口 IP" className={textareaCls} />
          <div className="mt-2 flex justify-end">
            <Button variant="outline" size="sm" onClick={saveEdgeWl} disabled={loading}>
              保存白名单
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">最近的安全记录</h3>
          {loading && !data ? (
            <div className="text-sm text-gray-400">加载中...</div>
          ) : !data?.events.length ? (
            <div className="text-sm text-gray-400">暂无</div>
          ) : (
            <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">时间</th>
                    <th className="px-3 py-2 text-left font-medium">事件</th>
                    <th className="px-3 py-2 text-left font-medium">账号 / 对象</th>
                    <th className="px-3 py-2 text-left font-medium">IP</th>
                    <th className="px-3 py-2 text-left font-medium">说明</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.events.map((e) => (
                    <tr key={e.id} className="align-top">
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">{fmtTime(e.at)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{ACTION_LABEL[e.action] ?? e.action}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {e.targetType === 'user' ? `用户 #${e.targetId}` : e.actorUserId ? `用户 #${e.actorUserId}` : e.targetId ?? '—'}
                      </td>
                      <td className="px-3 py-2 font-mono whitespace-nowrap">{e.ip ?? '—'}</td>
                      <td className="px-3 py-2 break-all text-gray-600">{e.reason ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
