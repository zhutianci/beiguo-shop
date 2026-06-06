'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Bell, Link2, ChevronDown, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react'

interface Binding {
  id: number
  accountEmail: string
  platform: string
  label: string | null
  orderCount: number
  latest: { subscriptionType: string; startDate: string; expireDate: string } | null
  active: boolean
  contact: { email: string; phone: string; notifyEmail: boolean; notifyPhone: boolean }
}

const PLATFORM_LABELS: Record<string, string> = { CLAUDE: 'Claude', CHATGPT: 'ChatGPT', OTHER: '其他' }
const PLATFORM_STYLES: Record<string, string> = {
  CLAUDE: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  CHATGPT: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  OTHER: 'bg-white/10 text-white/60 border-white/20',
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default function AccountBindings() {
  const [list, setList] = useState<Binding[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

  // 新增绑定表单
  const [newEmail, setNewEmail] = useState('')
  const [newPlatform, setNewPlatform] = useState('CLAUDE')
  const [newLabel, setNewLabel] = useState('')
  const [binding, setBinding] = useState(false)
  const [err, setErr] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/account/bindings')
      const data = await res.json()
      if (data.success) setList(data.data.list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleBind = async () => {
    setErr('')
    if (!newEmail.trim()) {
      setErr('请输入要绑定的账户邮箱')
      return
    }
    setBinding(true)
    try {
      const res = await fetch('/api/account/bindings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountEmail: newEmail.trim(), platform: newPlatform, label: newLabel.trim() || null }),
      })
      const data = await res.json()
      if (data.success) {
        setNewEmail('')
        setNewLabel('')
        load()
      } else setErr(data.error || '绑定失败')
    } finally {
      setBinding(false)
    }
  }

  const handleUnbind = async (b: Binding) => {
    if (!confirm(`确定解绑账户 ${b.accountEmail} 吗？`)) return
    const res = await fetch(`/api/account/bindings/${b.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) load()
    else alert(data.error || '解绑失败')
  }

  return (
    <div className="glass rounded-3xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Link2 className="w-5 h-5 text-purple-400" />
          我的账户
        </h2>
        <span className="text-xs text-white/40">绑定 Claude / ChatGPT 账户，统一管理订阅与提醒</span>
      </div>

      {/* 新增绑定 */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-6">
        <div className="grid sm:grid-cols-[1fr_auto_1fr_auto] gap-3 items-center">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="账户邮箱，如 you@gmail.com"
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-purple-500/50 text-sm"
          />
          <select
            value={newPlatform}
            onChange={(e) => setNewPlatform(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-purple-500/50 text-sm [&>option]:bg-gray-900"
          >
            <option value="CLAUDE">Claude</option>
            <option value="CHATGPT">ChatGPT</option>
            <option value="OTHER">其他</option>
          </select>
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="备注名（选填）"
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-purple-500/50 text-sm"
          />
          <button
            onClick={handleBind}
            disabled={binding}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
          >
            {binding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            绑定
          </button>
        </div>
        {err && <p className="mt-2 text-sm text-red-400">{err}</p>}
      </div>

      {/* 绑定列表 */}
      {loading ? (
        <div className="text-center py-10 text-white/40 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> 加载中...
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-10 text-white/40">还没有绑定任何账户，绑定后即可在此管理订阅与到期提醒。</div>
      ) : (
        <div className="space-y-3">
          {list.map((b) => (
            <div key={b.id} className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${PLATFORM_STYLES[b.platform] || PLATFORM_STYLES.OTHER}`}>
                        {PLATFORM_LABELS[b.platform] || b.platform}
                      </span>
                      <span className="font-mono text-sm text-white/90 truncate">{b.accountEmail}</span>
                      {b.label && <span className="text-xs text-white/40">（{b.label}）</span>}
                    </div>
                    <div className="mt-2 text-xs text-white/50 flex flex-wrap gap-x-4 gap-y-1">
                      {b.latest ? (
                        <>
                          <span>订阅：{b.latest.subscriptionType}</span>
                          <span>到期：{fmtDate(b.latest.expireDate)}</span>
                          <span>
                            状态：
                            {b.active ? (
                              <span className="text-green-400">有效</span>
                            ) : (
                              <span className="text-red-400">已过期</span>
                            )}
                          </span>
                          <span>共 {b.orderCount} 笔订单</span>
                        </>
                      ) : (
                        <span className="text-white/40">暂无订单记录</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/lookup?email=${encodeURIComponent(b.accountEmail)}`}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70"
                      title="查看订单/发票/收据"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> 订单
                    </Link>
                    <button
                      onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70"
                      title="到期提醒设置"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      提醒
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded === b.id ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleUnbind(b)}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-white/50"
                      title="解绑"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {expanded === b.id && (
                <ReminderEditor binding={b} onSaved={load} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ReminderEditor({ binding, onSaved }: { binding: Binding; onSaved: () => void }) {
  const [notifyEmail, setNotifyEmail] = useState(binding.contact.notifyEmail)
  const [notifyPhone, setNotifyPhone] = useState(binding.contact.notifyPhone)
  const [email, setEmail] = useState(binding.contact.email)
  const [phone, setPhone] = useState(binding.contact.phone)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const save = async () => {
    setMsg('')
    setErr('')
    setSaving(true)
    try {
      const res = await fetch('/api/account/bindings/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountEmail: binding.accountEmail, notifyEmail, notifyPhone, email, phone }),
      })
      const data = await res.json()
      if (data.success) {
        setMsg('已保存')
        onSaved()
      } else setErr(data.error || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border-t border-white/10 bg-white/[0.02] p-4 space-y-3">
      <p className="text-xs text-white/40">会员到期前会按下列方式提醒你续费。</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-2 text-sm text-white/70 mb-1.5 cursor-pointer">
            <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} className="accent-purple-600 w-4 h-4" />
            邮箱提醒
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="默认为账户邮箱"
            disabled={!notifyEmail}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-purple-500/50 text-sm disabled:opacity-40"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm text-white/70 mb-1.5 cursor-pointer">
            <input type="checkbox" checked={notifyPhone} onChange={(e) => setNotifyPhone(e.target.checked)} className="accent-purple-600 w-4 h-4" />
            短信提醒
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="手机号"
            disabled={!notifyPhone}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:border-purple-500/50 text-sm disabled:opacity-40"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          保存提醒设置
        </button>
        {msg && <span className="text-sm text-green-400">{msg}</span>}
        {err && <span className="text-sm text-red-400">{err}</span>}
      </div>
    </div>
  )
}
