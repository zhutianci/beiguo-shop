'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BellRing,
  Mail,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  Play,
  RefreshCw,
} from 'lucide-react'

interface ReminderRow {
  id: number
  startDate: string
  expireDate: string
  subscriptionType: string
  xianyuNickname: string | null
  claudeAccount: string
  daysLeft: number
  lastRemindedAt: string | null
  autoReminded: boolean
  contact: {
    email: string | null
    phone: string | null
    notifyEmail: boolean
    notifyPhone: boolean
    isDefault: boolean
  }
  hasChannel: boolean
}

interface ConfigStatus {
  email: boolean
  sms: boolean
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
function fmtDateTime(s: string) {
  return new Date(s).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export default function RemindersPage() {
  const [rows, setRows] = useState<ReminderRow[]>([])
  const [config, setConfig] = useState<ConfigStatus>({ email: false, sms: false })
  const [withinDays, setWithinDays] = useState(7)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [sendingId, setSendingId] = useState<number | null>(null)
  const [batchSending, setBatchSending] = useState(false)
  const [runningAuto, setRunningAuto] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const load = async (days = withinDays) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reminders?days=${days}`)
      const data = await res.json()
      if (data.success) {
        setRows(data.data.list)
        setConfig(data.data.config)
        setSelected(new Set())
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggle = (id: number) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const toggleAll = () => {
    const sendable = rows.filter((r) => r.hasChannel).map((r) => r.id)
    if (selected.size === sendable.length) setSelected(new Set())
    else setSelected(new Set(sendable))
  }

  const sendOrders = async (orderIds: number[]) => {
    setMsg(null)
    const res = await fetch('/api/admin/reminders/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderIds }),
    })
    const data = await res.json()
    if (data.success) {
      setMsg({ type: 'ok', text: data.message || '提醒已发送' })
      load()
    } else {
      setMsg({ type: 'err', text: data.error || '发送失败' })
    }
    return data.success
  }

  const handleSendOne = async (id: number) => {
    setSendingId(id)
    try {
      await sendOrders([id])
    } finally {
      setSendingId(null)
    }
  }

  const handleBatchSend = async () => {
    if (selected.size === 0) return
    if (!confirm(`确定向选中的 ${selected.size} 条订单发送提醒？`)) return
    setBatchSending(true)
    try {
      await sendOrders(Array.from(selected))
    } finally {
      setBatchSending(false)
    }
  }

  const handleRunAuto = async () => {
    if (!confirm('立即执行一次自动提醒任务？\n（与每天中午12点的定时任务逻辑相同，会跳过已提醒的订单）')) return
    setRunningAuto(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/reminders/run-auto', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setMsg({ type: 'ok', text: data.message || '自动提醒已执行' })
        load()
      } else {
        setMsg({ type: 'err', text: data.error || '执行失败' })
      }
    } finally {
      setRunningAuto(false)
    }
  }

  const sendableCount = rows.filter((r) => r.hasChannel).length

  return (
    <div className="space-y-6">
      {/* 服务配置状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="w-5 h-5" />
            到期提醒
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <ConfigBadge label="阿里云邮件服务" ok={config.email} icon={<Mail className="w-4 h-4" />} />
            <ConfigBadge label="阿里云短信服务" ok={config.sms} icon={<Smartphone className="w-4 h-4" />} />
          </div>
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900 space-y-1">
            <p>• 系统每天 <strong>中午 12:00</strong> 自动提醒所有 <strong>{withinDays} 日内</strong>到期的用户。</p>
            <p>• 已提醒过的订单不会重复自动提醒；续费后到期日变化会重新纳入提醒。</p>
            <p>• 下方可对单条 / 批量订单 <strong>手动提醒</strong>（手动不受“已提醒”限制）。</p>
            <p>• 用户未填写联系方式时，默认发送到其 Claude 账户邮箱。</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <Button onClick={handleRunAuto} loading={runningAuto}>
              <Play className="w-4 h-4 mr-1" />
              立即执行自动提醒
            </Button>
            <Button variant="outline" onClick={() => load()} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>显示范围</span>
              <select
                value={withinDays}
                onChange={(e) => {
                  const d = parseInt(e.target.value)
                  setWithinDays(d)
                  load(d)
                }}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
              >
                <option value={3}>3 日内</option>
                <option value={7}>7 日内</option>
                <option value={15}>15 日内</option>
                <option value={30}>30 日内</option>
              </select>
            </div>
          </div>
          {msg && (
            <div
              className={`mt-4 rounded-lg px-4 py-3 text-sm flex items-start gap-2 ${
                msg.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
              }`}
            >
              {msg.type === 'ok' ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              {msg.text}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 即将到期列表 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {withinDays} 日内到期（共 {rows.length} 条）
          </CardTitle>
          <Button size="sm" onClick={handleBatchSend} loading={batchSending} disabled={selected.size === 0}>
            <Send className="w-4 h-4 mr-1" />
            提醒选中 ({selected.size})
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-gray-400 flex flex-col items-center gap-2">
              <CheckCircle className="w-8 h-8 text-green-400" />
              太好了，{withinDays} 日内没有即将到期的订单
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="border-b text-left text-gray-500 text-xs">
                    <th className="pb-2 pr-3">
                      <input
                        type="checkbox"
                        checked={sendableCount > 0 && selected.size === sendableCount}
                        onChange={toggleAll}
                        className="rounded"
                      />
                    </th>
                    <th className="pb-2 pr-3">订阅 / 账户</th>
                    <th className="pb-2 pr-3">到期</th>
                    <th className="pb-2 pr-3">剩余</th>
                    <th className="pb-2 pr-3">提醒方式</th>
                    <th className="pb-2 pr-3">状态</th>
                    <th className="pb-2 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50/60 transition-colors align-top">
                      <td className="py-3 pr-3">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggle(r.id)}
                          disabled={!r.hasChannel}
                          className="rounded mt-0.5"
                        />
                      </td>
                      <td className="py-3 pr-3">
                        <div className="font-medium">{r.subscriptionType}</div>
                        <div className="font-mono text-xs text-gray-500 break-all">{r.claudeAccount}</div>
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap">{fmtDate(r.expireDate)}</td>
                      <td className="py-3 pr-3 whitespace-nowrap">
                        {r.daysLeft <= 0 ? (
                          <span className="text-red-600 font-semibold">今天</span>
                        ) : (
                          <span className={r.daysLeft <= 3 ? 'text-amber-600 font-semibold' : ''}>
                            {r.daysLeft} 天
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex flex-col gap-1 text-xs">
                          {r.contact.notifyEmail && r.contact.email && (
                            <span className="inline-flex items-center gap-1 text-gray-600">
                              <Mail className="w-3 h-3" />
                              <span className="break-all">{r.contact.email}</span>
                            </span>
                          )}
                          {r.contact.notifyPhone && r.contact.phone && (
                            <span className="inline-flex items-center gap-1 text-gray-600">
                              <Smartphone className="w-3 h-3" />
                              {r.contact.phone}
                            </span>
                          )}
                          {r.contact.isDefault && (
                            <span className="text-gray-400">默认邮箱（用户未设置）</span>
                          )}
                          {!r.hasChannel && (
                            <span className="text-red-500">无可用渠道</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap">
                        {r.autoReminded ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-gray-100 text-gray-600">
                            <CheckCircle className="w-3 h-3" />
                            已自动提醒
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-amber-50 text-amber-700">
                            <Clock className="w-3 h-3" />
                            待提醒
                          </span>
                        )}
                        {r.lastRemindedAt && (
                          <div className="text-[11px] text-gray-400 mt-1">
                            最近 {fmtDateTime(r.lastRemindedAt)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendOne(r.id)}
                          loading={sendingId === r.id}
                          disabled={!r.hasChannel}
                        >
                          <Send className="w-3 h-3 mr-1" />
                          提醒
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ConfigBadge({ label, ok, icon }: { label: string; ok: boolean; icon: React.ReactNode }) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
        ok ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
      }`}
    >
      <span className="flex items-center gap-2 text-sm text-gray-700">
        {icon}
        {label}
      </span>
      {ok ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
          <CheckCircle className="w-4 h-4" />
          已配置
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
          <AlertCircle className="w-4 h-4" />
          未配置
        </span>
      )}
    </div>
  )
}
