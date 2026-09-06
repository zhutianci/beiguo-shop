'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, ExternalLink, Plus, RefreshCw, RotateCcw, X, Zap } from 'lucide-react'

/**
 * 信源管理（SKILL.md §2、§9）。
 *
 * 「立即测试该源」是这页最要紧的功能：新增信源前必须先实测可达性，
 * 凭印象加源的下场是抓取任务里多一个每小时超时 8 秒的死源。测试只拉不入库。
 */

interface SourceRow {
  id: number
  key: string
  name: string
  homepage: string | null
  feedUrl: string
  kind: string
  lang: string
  tier: number
  role: string
  weight: number
  viaRelay: boolean
  enabled: boolean
  lastFetchAt: string | null
  lastOkAt: string | null
  failCount: number
  lastError: string | null
  itemCount: number
  itemsInDb: number
  autoDisabled: boolean
  relayMissing: boolean
}

interface Stats {
  total: number
  enabled: number
  failing: number
  autoDisabled: number
  relayConfigured: boolean
  relayPending: number
  autoDisableAt: number
}

interface TestResult {
  ok: boolean
  status: number
  ms: number
  bytes: number
  count: number
  titles: string[]
  format?: string
  target: string
  latest?: string | null
  message: string
}

const KINDS = ['RSS', 'ATOM', 'JSON', 'HN', 'GITHUB', 'X']

function fmt(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleString('zh-CN', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function AdminNewsSourcesPage() {
  const [list, setList] = useState<SourceRow[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ title: string; result: TestResult } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/news/sources')
      const d = await res.json()
      if (d.success) {
        setList(d.data.list)
        setStats(d.data.stats)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const patch = async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/admin/news/sources', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const d = await res.json()
    if (!d.success) {
      alert(d.error || '保存失败')
      return
    }
    load()
  }

  // busy 是按钮转圈用的唯一标识（信源 key 或 'new'），label 只用于结果标题
  const runTest = async (busy: string, label: string, body: Record<string, unknown>) => {
    setTesting(busy)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/news/sources/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await res.json()
      if (!d.success) {
        alert(d.error || '测试失败')
        return
      }
      setTestResult({ title: label, result: d.data as TestResult })
    } finally {
      setTesting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* 概览 */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="py-4">
              <div className="text-xs text-gray-500">信源总数</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</div>
              <div className="mt-1 text-xs text-gray-400">启用中 {stats.enabled}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="text-xs text-gray-500">抓取失败中</div>
              <div className={`mt-1 text-2xl font-semibold ${stats.failing ? 'text-amber-600' : 'text-gray-900'}`}>
                {stats.failing}
              </div>
              <div className="mt-1 text-xs text-gray-400">连续失败 {stats.autoDisableAt} 次自动禁用</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="text-xs text-gray-500">已被自动禁用</div>
              <div className={`mt-1 text-2xl font-semibold ${stats.autoDisabled ? 'text-red-600' : 'text-gray-900'}`}>
                {stats.autoDisabled}
              </div>
              <div className="mt-1 text-xs text-gray-400">修好后点「重置失败」恢复</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="text-xs text-gray-500">境外中继</div>
              <div
                className={`mt-1 text-2xl font-semibold ${
                  stats.relayConfigured ? 'text-green-600' : stats.relayPending ? 'text-red-600' : 'text-gray-400'
                }`}
              >
                {stats.relayConfigured ? '已配置' : '未配置'}
              </div>
              <div className="mt-1 text-xs text-gray-400">
                {stats.relayPending > 0
                  ? `${stats.relayPending} 个源需要中继但拿不到数据`
                  : 'NEWS_RELAY_URL（Cloudflare Worker）'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {stats && !stats.relayConfigured && stats.relayPending > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            有 {stats.relayPending} 个启用中的信源需要经 Cloudflare Worker 中继，但 NEWS_RELAY_URL 未配置。
            这些一手境外源当前全部失联，tier1 与 HN 热度信号会计 0，中文源不受影响。
          </span>
        </div>
      )}

      {/* 测试结果 */}
      {testResult && (
        <Card className={testResult.result.ok ? 'border-green-300' : 'border-red-300'}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              试抓结果 · {testResult.title}
              <span className={`ml-2 text-sm ${testResult.result.ok ? 'text-green-600' : 'text-red-600'}`}>
                {testResult.result.ok ? '可用' : '不可用'}
              </span>
            </CardTitle>
            <button onClick={() => setTestResult(null)} className="rounded p-1 text-gray-400 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-4 text-gray-600">
              <span>
                HTTP <span className="font-mono font-semibold text-gray-900">{testResult.result.status || '连接失败'}</span>
              </span>
              <span>
                耗时 <span className="font-mono font-semibold text-gray-900">{testResult.result.ms}ms</span>
              </span>
              <span>
                响应 <span className="font-mono">{(testResult.result.bytes / 1024).toFixed(1)}KB</span>
              </span>
              <span>
                解析 <span className="font-mono font-semibold text-gray-900">{testResult.result.count}</span> 条
              </span>
              {testResult.result.format && <span>格式 {testResult.result.format}</span>}
              {testResult.result.latest && <span>最新 {fmt(testResult.result.latest)}</span>}
            </div>
            <div className={testResult.result.ok ? 'text-gray-600' : 'text-red-600'}>{testResult.result.message}</div>
            {testResult.result.titles.length > 0 && (
              <ul className="list-inside list-decimal space-y-1 rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                {testResult.result.titles.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            )}
            <div className="font-mono text-xs text-gray-400 break-all">请求地址：{testResult.result.target}</div>
            <div className="text-xs text-gray-400">本次测试不入库，也不会改动该源的抓取状态。</div>
          </CardContent>
        </Card>
      )}

      {/* 新增 */}
      {showAdd && <AddSourceForm onDone={() => { setShowAdd(false); load() }} onTest={runTest} testing={testing} />}

      {/* 列表 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>信源管理</CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              tier 1 一手官方 / 2 专业媒体 / 3 从业者社区；role：feed 产条目、signal 只加热度、both 两者都做。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="mr-1 h-4 w-4" />
              刷新
            </Button>
            <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
              <Plus className="mr-1 h-4 w-4" />
              新增信源
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-400">加载中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2 pr-3">信源</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">tier</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">role</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">权重</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">条目数</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">最近抓取</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">最近成功</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">失败</th>
                    <th className="pb-2 whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => (
                    <tr
                      key={s.id}
                      className={
                        s.autoDisabled || s.relayMissing
                          ? 'border-b border-l-4 border-l-red-400 bg-red-50/60 align-top'
                          : s.failCount > 0
                          ? 'border-b border-l-4 border-l-amber-400 bg-amber-50/60 align-top'
                          : 'border-b align-top hover:bg-gray-50/60'
                      }
                    >
                      <td className="max-w-[360px] py-2 pr-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-gray-900">{s.name}</span>
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-500">{s.key}</span>
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">{s.kind}</span>
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">{s.lang}</span>
                          {s.viaRelay && (
                            <span
                              className={`rounded px-1.5 py-0.5 text-xs ${
                                s.relayMissing ? 'bg-red-100 text-red-700' : 'bg-purple-50 text-purple-700'
                              }`}
                            >
                              中继{s.relayMissing ? '未配置' : ''}
                            </span>
                          )}
                          {s.autoDisabled && (
                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700">
                              连续失败已自动禁用
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 font-mono text-xs text-gray-400 break-all">
                          {s.feedUrl}
                          {s.homepage && (
                            <a
                              href={s.homepage}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="shrink-0 text-primary-600"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                        {s.lastError && <div className="mt-1 text-xs text-red-600">最近错误：{s.lastError}</div>}
                      </td>
                      <td className="py-2 pr-3">
                        <select
                          value={s.tier}
                          onChange={(e) => patch({ id: s.id, tier: Number(e.target.value) })}
                          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                        >
                          <option value={1}>1 一手</option>
                          <option value={2}>2 媒体</option>
                          <option value={3}>3 社区</option>
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <select
                          value={s.role}
                          onChange={(e) => patch({ id: s.id, role: e.target.value })}
                          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                        >
                          <option value="feed">feed</option>
                          <option value="signal">signal</option>
                          <option value="both">both</option>
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="9.99"
                          defaultValue={s.weight}
                          onBlur={(e) => {
                            const v = Number(e.target.value)
                            if (Number.isFinite(v) && v !== s.weight) patch({ id: s.id, weight: v })
                          }}
                          className="w-16 rounded border border-gray-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap text-xs text-gray-600">
                        {s.itemsInDb}
                        {s.itemCount !== s.itemsInDb && <span className="text-gray-400"> / 计 {s.itemCount}</span>}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap text-xs text-gray-500">{fmt(s.lastFetchAt)}</td>
                      <td className="py-2 pr-3 whitespace-nowrap text-xs text-gray-500">{fmt(s.lastOkAt)}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <span className={s.failCount > 0 ? 'font-semibold text-amber-700' : 'text-gray-400'}>
                          {s.failCount}
                        </span>
                      </td>
                      <td className="py-2 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            loading={testing === s.key}
                            onClick={() => runTest(s.key, s.name, { id: s.id })}
                            title="立即测试（只拉取，不入库）"
                          >
                            <Zap className="h-4 w-4 text-amber-500" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => patch({ id: s.id, enabled: !s.enabled })}
                          >
                            {s.enabled ? '停用' : '启用'}
                          </Button>
                          {s.failCount > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => patch({ id: s.id, resetFail: true, enabled: true })}
                              title="清空失败计数并重新启用"
                            >
                              <RotateCcw className="h-4 w-4 text-gray-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-gray-400">
                        还没有信源。可以到「管线与成本」页跑一次 seed 段导入种子清单，或在这里手工新增。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------- 新增信源 ----------------

function AddSourceForm({
  onDone,
  onTest,
  testing,
}: {
  onDone: () => void
  onTest: (busy: string, label: string, body: Record<string, unknown>) => void
  testing: string | null
}) {
  const [form, setForm] = useState({
    key: '',
    name: '',
    feedUrl: '',
    homepage: '',
    kind: 'RSS',
    lang: 'zh',
    tier: 2,
    role: 'feed',
    weight: '',
    viaRelay: false,
  })
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof form, v: string | number | boolean) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.key.trim() || !form.name.trim() || !form.feedUrl.trim()) return alert('key / 展示名 / feed 地址都要填')
    setSaving(true)
    try {
      const res = await fetch('/api/admin/news/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          homepage: form.homepage.trim() || null,
          ...(form.weight ? { weight: Number(form.weight) } : {}),
        }),
      })
      const d = await res.json()
      if (!d.success) return alert(d.error || '新增失败')
      alert(d.message || '已新增')
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">新增信源</CardTitle>
        <p className="mt-1 text-sm text-gray-500">
          先点「试抓」确认可达再保存。境内直连不通的源（X / Reddit / HuggingFace / DeepMind 等）必须勾「经中继」。
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="key（小写字母数字连字符）" value={form.key} onChange={(e) => set('key', e.target.value)} placeholder="qbitai" />
          <Input label="展示名" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="量子位" />
          <Input label="主页（可选）" value={form.homepage} onChange={(e) => set('homepage', e.target.value)} placeholder="https://..." />
        </div>
        <Input
          label="feed 地址（X 账号用 x:handle）"
          value={form.feedUrl}
          onChange={(e) => set('feedUrl', e.target.value)}
          placeholder="https://www.qbitai.com/feed"
        />
        <div className="grid gap-4 md:grid-cols-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">类型</label>
            <select value={form.kind} onChange={(e) => set('kind', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">语言</label>
            <select value={form.lang} onChange={(e) => set('lang', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
              <option value="zh">zh</option>
              <option value="en">en</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">tier</label>
            <select value={form.tier} onChange={(e) => set('tier', Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
              <option value={1}>1 一手官方</option>
              <option value={2}>2 专业媒体</option>
              <option value={3}>3 从业者社区</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">role</label>
            <select value={form.role} onChange={(e) => set('role', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
              <option value="feed">feed 产条目</option>
              <option value="signal">signal 只加热度</option>
              <option value="both">both</option>
            </select>
          </div>
          <Input label="权重（留空按 tier 取默认）" value={form.weight} onChange={(e) => set('weight', e.target.value)} placeholder="1.0" />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.viaRelay} onChange={(e) => set('viaRelay', e.target.checked)} className="h-4 w-4" />
          经 Cloudflare Worker 中继（境内直连不通的源）
        </label>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            loading={testing === 'new'}
            onClick={() => {
              if (!form.feedUrl.trim()) return alert('请先填 feed 地址')
              onTest('new', form.name.trim() || '新增源', {
                feedUrl: form.feedUrl.trim(),
                viaRelay: form.viaRelay,
                kind: form.kind,
              })
            }}
          >
            <Zap className="mr-1 h-4 w-4" />
            试抓
          </Button>
          <Button size="sm" loading={saving} onClick={submit}>
            保存
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
