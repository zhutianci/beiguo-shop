'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, XCircle, RefreshCw, Megaphone, Plus, Pencil, Trash2, X, Eye, EyeOff } from 'lucide-react'

// ---------------- 类型 ----------------

interface Feature {
  key: string
  label: string
  configured: boolean
  note: string
}

interface SettingsData {
  app: { appUrl: string; nodeEnv: string; timeZone: string; serverTime: string }
  features: Feature[]
  counts: {
    products: number
    autoProducts: number
    unusedCards: number
    orders: number
    users: number
    receipts: number
    invoices: number
  }
}

interface Announcement {
  id: number
  title: string
  content: string
  level: string
  enabled: boolean
  pinned: boolean
  startAt: string | null
  endAt: string | null
  createdAt: string
  updatedAt: string
}

const LEVEL_LABELS: Record<string, { label: string; cls: string }> = {
  INFO: { label: '通知', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  WARN: { label: '重要提醒', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  SUCCESS: { label: '好消息', cls: 'bg-green-50 text-green-700 border-green-100' },
}

const COUNT_LABELS: [keyof SettingsData['counts'], string][] = [
  ['products', '商品'],
  ['autoProducts', '自动发货商品'],
  ['unusedCards', '未使用卡密'],
  ['orders', '订单'],
  ['users', '用户'],
  ['invoices', '发票'],
  ['receipts', '收据'],
]

function fmt(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// datetime-local 需要「本地时区的 YYYY-MM-DDTHH:mm」，不能用 toISOString（那是 UTC）
function toLocalInput(s: string | null): string {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 与服务端 /api/announcement 的取用规则保持一致：启用 + 在生效时间窗内 */
function isLive(a: Announcement): boolean {
  if (!a.enabled) return false
  const now = Date.now()
  if (a.startAt && new Date(a.startAt).getTime() > now) return false
  if (a.endAt && new Date(a.endAt).getTime() < now) return false
  return true
}

// ---------------- 页面 ----------------

export default function AdminSettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null)
  const [loading, setLoading] = useState(true)

  const [list, setList] = useState<Announcement[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loadingList, setLoadingList] = useState(true)
  const [editing, setEditing] = useState<Announcement | 'new' | null>(null)

  const [testing, setTesting] = useState(false)
  const [testMsg, setTestMsg] = useState('')
  const [testOk, setTestOk] = useState(false)

  const testNotify = async () => {
    setTesting(true)
    setTestMsg('')
    try {
      const res = await fetch('/api/admin/settings/test-notify', { method: 'POST' })
      const d = await res.json()
      setTestOk(!!d.success)
      setTestMsg(d.success ? d.message || '已发送' : d.error || '发送失败')
    } catch {
      setTestOk(false)
      setTestMsg('网络错误')
    } finally {
      setTesting(false)
    }
  }

  const loadStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      const d = await res.json()
      if (d.success) setData(d.data)
    } finally {
      setLoading(false)
    }
  }

  const loadList = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await fetch(`/api/admin/announcements?page=${page}&pageSize=10`)
      const d = await res.json()
      if (d.success) {
        setList(d.data.list)
        setTotal(d.data.total)
        setTotalPages(d.data.totalPages || 1)
      }
    } finally {
      setLoadingList(false)
    }
  }, [page])

  useEffect(() => {
    loadStatus()
  }, [])
  useEffect(() => {
    loadList()
  }, [loadList])

  const toggle = async (a: Announcement, field: 'enabled' | 'pinned') => {
    const res = await fetch(`/api/admin/announcements/${a.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: !a[field] }),
    })
    const d = await res.json()
    if (d.success) loadList()
    else alert(d.error || '操作失败')
  }

  const remove = async (a: Announcement) => {
    if (!confirm(`删除公告「${a.title}」？`)) return
    const res = await fetch(`/api/admin/announcements/${a.id}`, { method: 'DELETE' })
    const d = await res.json()
    if (d.success) loadList()
    else alert(d.error || '删除失败')
  }

  const liveOne = list.find(isLive)

  return (
    <div className="space-y-6">
      {/* ---------- 公告管理 ---------- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-purple-600" />
            站点公告（共 {total} 条）
          </CardTitle>
          <Button onClick={() => setEditing('new')}>
            <Plus className="w-4 h-4 mr-1" /> 发布公告
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            启用后，买家进入前台任意页面会自动弹窗展示。同时有多条生效时，
            <b>强提醒优先，其次取最新发布的一条</b>。普通公告买家关闭后不再重复弹；
            勾选「强提醒」则每次进站都弹。修改内容后会重新弹给已经看过的买家。
          </p>

          {liveOne ? (
            <div className="mb-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm">
              <span className="text-green-700 font-medium">当前生效：</span>
              <span className="text-gray-800">{liveOne.title}</span>
              {liveOne.pinned && <span className="ml-2 text-xs text-amber-700">（强提醒）</span>}
            </div>
          ) : (
            <div className="mb-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-500">
              当前没有生效中的公告，前台不会弹窗。
            </div>
          )}

          {loadingList ? (
            <div className="text-center py-10 text-gray-400">加载中...</div>
          ) : list.length === 0 ? (
            <div className="text-center py-10 text-gray-400">还没有公告</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-800">
                  <thead>
                    <tr className="border-b text-left text-gray-500 text-xs">
                      <th className="pb-2 pr-3">标题</th>
                      <th className="pb-2 pr-3">类型</th>
                      <th className="pb-2 pr-3">状态</th>
                      <th className="pb-2 pr-3">生效时间</th>
                      <th className="pb-2 pr-3">失效时间</th>
                      <th className="pb-2 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((a) => {
                      const lv = LEVEL_LABELS[a.level] || LEVEL_LABELS.INFO
                      const live = isLive(a)
                      return (
                        <tr key={a.id} className="border-b hover:bg-gray-50/60">
                          <td className="py-2 pr-3">
                            <div className="font-medium">{a.title}</div>
                            <div className="text-xs text-gray-400 line-clamp-1 max-w-md">{a.content}</div>
                          </td>
                          <td className="py-2 pr-3">
                            <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${lv.cls}`}>
                              {lv.label}
                            </span>
                          </td>
                          <td className="py-2 pr-3">
                            {live ? (
                              <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                                生效中
                              </span>
                            ) : a.enabled ? (
                              <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                                已启用·不在时间窗
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                                未启用
                              </span>
                            )}
                            {a.pinned && (
                              <span className="ml-1 inline-flex rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs text-amber-700">
                                强提醒
                              </span>
                            )}
                          </td>
                          <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">{fmt(a.startAt)}</td>
                          <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">{fmt(a.endAt)}</td>
                          <td className="py-2 text-right whitespace-nowrap">
                            <button
                              onClick={() => toggle(a, 'enabled')}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-gray-600 hover:bg-gray-100"
                              title={a.enabled ? '停用' : '启用'}
                            >
                              {a.enabled ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              {a.enabled ? '停用' : '启用'}
                            </button>
                            <button
                              onClick={() => setEditing(a)}
                              className="ml-1 inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-blue-600 hover:bg-blue-50"
                            >
                              <Pencil className="w-3.5 h-3.5" /> 编辑
                            </button>
                            <button
                              onClick={() => remove(a)}
                              className="ml-1 inline-flex items-center gap-1 text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> 删除
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm">
                  <span className="text-gray-500">
                    第 {page} / {totalPages} 页
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ---------- 系统状态 ---------- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>系统状态</CardTitle>
          <Button variant="outline" size="sm" onClick={loadStatus} loading={loading}>
            <RefreshCw className="w-4 h-4 mr-1" /> 刷新
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            这些配置都来自服务器环境变量，只能在服务器上修改 <code className="text-xs">.env.production</code> 后重新
            <code className="text-xs"> docker compose up -d</code> 生效，无法在网页上改动。此处只做运行时自检，不显示任何密钥内容。
          </p>

          {loading && !data ? (
            <div className="text-center py-10 text-gray-400">加载中...</div>
          ) : !data ? (
            <div className="text-center py-10 text-gray-400">获取失败</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.features.map((f) => (
                  <div
                    key={f.key}
                    className={`rounded-xl border p-3 ${
                      f.configured ? 'border-green-100 bg-green-50/60' : 'border-amber-200 bg-amber-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {f.configured ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <span className="text-sm font-medium text-gray-800">{f.label}</span>
                      <span
                        className={`ml-auto text-xs font-medium ${f.configured ? 'text-green-700' : 'text-amber-700'}`}
                      >
                        {f.configured ? '已配置' : '未配置'}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{f.note}</p>
                    {f.key === 'wecom' && f.configured && (
                      <div className="mt-2 flex items-center gap-2">
                        <Button variant="outline" size="sm" loading={testing} onClick={testNotify}>
                          发送测试消息
                        </Button>
                        {testMsg && (
                          <span className={`text-xs ${testOk ? 'text-green-700' : 'text-red-600'}`}>{testMsg}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">数据概览</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {COUNT_LABELS.map(([k, label]) => (
                    <div key={k} className="rounded-xl border border-gray-100 p-3">
                      <div className="text-xs text-gray-500">{label}</div>
                      <div className="text-xl font-bold text-gray-800">{data.counts[k]}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600 space-y-1">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">站点地址</span>
                  <span className="font-mono text-xs break-all text-right">{data.app.appUrl}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">运行环境</span>
                  <span className="font-mono text-xs">{data.app.nodeEnv}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">服务器时区</span>
                  <span className="font-mono text-xs">{data.app.timeZone}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">服务器时间</span>
                  <span className="font-mono text-xs">
                    {new Date(data.app.serverTime).toLocaleString('zh-CN', { hour12: false })}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {editing && (
        <AnnouncementEditor
          value={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null)
            setPage(1)
            loadList()
          }}
        />
      )}
    </div>
  )
}

// ---------------- 发布 / 编辑弹窗 ----------------

function AnnouncementEditor({
  value,
  onClose,
  onDone,
}: {
  value: Announcement | null
  onClose: () => void
  onDone: () => void
}) {
  const [title, setTitle] = useState(value?.title || '')
  const [content, setContent] = useState(value?.content || '')
  const [level, setLevel] = useState(value?.level || 'INFO')
  const [enabled, setEnabled] = useState(value?.enabled ?? true)
  const [pinned, setPinned] = useState(value?.pinned ?? false)
  const [startAt, setStartAt] = useState(toLocalInput(value?.startAt ?? null))
  const [endAt, setEndAt] = useState(toLocalInput(value?.endAt ?? null))
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const submit = async () => {
    if (!title.trim()) return setMsg('请填写公告标题')
    if (!content.trim()) return setMsg('请填写公告内容')
    setSaving(true)
    setMsg('')
    try {
      const body = {
        title: title.trim(),
        content: content.trim(),
        level,
        enabled,
        pinned,
        startAt: startAt || null,
        endAt: endAt || null,
      }
      const res = await fetch(value ? `/api/admin/announcements/${value.id}` : '/api/admin/announcements', {
        method: value ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json()
      if (d.success) onDone()
      else setMsg(d.error || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-8 rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{value ? '编辑公告' : '发布公告'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标题<span className="text-red-500 ml-0.5">*</span>
            </label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：国庆期间发货说明" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              内容<span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={7}
              placeholder="支持换行。粘贴的网址会自动变成可点击链接。"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <p className="mt-1 text-xs text-gray-400">{content.length} / 5000 字</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="INFO">通知（紫）</option>
                <option value="WARN">重要提醒（橙）</option>
                <option value="SUCCESS">好消息（绿）</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">生效时间</label>
              <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">失效时间</label>
              <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-gray-400 -mt-2">生效/失效时间留空表示「立即生效、长期有效」。</p>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              立即启用（不勾选则先存为草稿，前台不展示）
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
              强提醒：每次进站都弹，忽略买家的「已读」记录
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          {msg && <span className="mr-auto text-sm text-red-600">{msg}</span>}
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={submit} loading={saving}>
            {value ? '保存' : '发布'}
          </Button>
        </div>
      </div>
    </div>
  )
}
