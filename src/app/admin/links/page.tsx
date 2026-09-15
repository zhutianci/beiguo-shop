'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  MousePointerClick,
  Pencil,
  Plus,
  RadioTower,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react'
import { LinkEditModal, type AdminLink, type AdminLinkDraft } from '@/components/admin/link-edit-modal'
import { STATUS_LABELS } from '@/lib/friend-link-client'
import type { LinksPageConfig } from '@/lib/friend-link'

const PAGE_SIZE = 20

const STATUS_TABS: { key: string; label: string }[] = [
  { key: 'PENDING', label: '待审核' },
  { key: 'APPROVED', label: '展示中' },
  { key: 'OFFLINE', label: '已下线' },
  { key: 'REJECTED', label: '已拒绝' },
  { key: '', label: '全部' },
]

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-600',
  OFFLINE: 'bg-gray-100 text-gray-500',
}
function fmt(s: string | null | undefined) {
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

const CFG_INPUT = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900'

export default function AdminLinksPage() {
  const [list, setList] = useState<AdminLink[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [status, setStatus] = useState('PENDING')
  const [slot, setSlot] = useState('')
  const [keyword, setKeyword] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<AdminLinkDraft | null>(null)
  const [checkingId, setCheckingId] = useState<number | null>(null)
  const [sweeping, setSweeping] = useState(false)
  const [sweepAt, setSweepAt] = useState<[number, number] | null>(null) // [已完成, 总数]
  const abortRef = useRef<AbortController | null>(null)

  // 页面配置
  const [cfg, setCfg] = useState<LinksPageConfig | null>(null)
  const [cfgOpen, setCfgOpen] = useState(false)
  const [cfgSaving, setCfgSaving] = useState(false)
  const [cfgMsg, setCfgMsg] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), 350)
    return () => clearTimeout(t)
  }, [keyword])

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    try {
      const q = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
      if (status) q.set('status', status)
      if (slot) q.set('slot', slot)
      if (debounced) q.set('keyword', debounced)
      const res = await fetch(`/api/admin/links?${q}`, { signal: controller.signal })
      const data = await res.json()
      if (data.success && abortRef.current === controller) {
        setList(data.data.list)
        setTotal(data.data.total || 0)
        setTotalPages(data.data.totalPages || 1)
        setCounts(data.data.counts || {})
      }
    } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }, [page, status, slot, debounced])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    fetch('/api/admin/links/config')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCfg(d.data.config)
      })
      .catch(() => {})
  }, [])

  const patch = async (id: number, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/links/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.success) load()
    else alert(data.error || '操作失败')
  }

  const remove = async (row: AdminLink) => {
    if (!confirm(`彻底删除「${row.name}」？\n\n对方撤链、赞助到期请改成「下线」——删除之后同域名可以重新申请，历史也就查不到了。`)) return
    const res = await fetch(`/api/admin/links/${row.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) load()
    else alert(data.error || '删除失败')
  }

  /** 单条回链检测 */
  const check = async (id: number): Promise<boolean> => {
    setCheckingId(id)
    try {
      const res = await fetch(`/api/admin/links/${id}/check`, { method: 'POST' })
      const data = await res.json()
      return !!data.success
    } catch {
      return false
    } finally {
      setCheckingId(null)
    }
  }

  /**
   * 一键巡检：在浏览器里串行调单条接口。
   * 【为什么不做成服务端批量】nginx 的 proxy_read_timeout 只有 90s，
   * 一次抓几十个外站必然超时，前端拿到 504 而服务端还在空跑。
   */
  const sweep = async () => {
    const targets = list.filter((r) => r.status === 'APPROVED')
    if (targets.length === 0) return alert('当前这一页里没有「展示中」的友链')
    // 说清楚只覆盖当前这一页。静默地少检一半比不检更糟：
    // 管理员会以为全站都巡过了，没标红的就默认是好的
    if (
      !confirm(
        `只检测当前这一页筛选出的 ${targets.length} 个「展示中」站点（该筛选下共 ${total} 条，其余请翻页后再跑一次）。\n` +
          `逐个访问对方页面找本站链接，每个最多等 10 秒，期间请不要关闭页面。`
      )
    )
      return
    setSweeping(true)
    setSweepAt([0, targets.length])
    try {
      for (let i = 0; i < targets.length; i++) {
        await check(targets[i].id)
        setSweepAt([i + 1, targets.length])
      }
      await load()
    } finally {
      setSweeping(false)
      setSweepAt(null)
    }
  }

  const saveCfg = async () => {
    if (!cfg) return
    setCfgSaving(true)
    setCfgMsg(null)
    try {
      const res = await fetch('/api/admin/links/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      })
      const data = await res.json()
      setCfgMsg(data.success ? '已保存，前台刷新即可看到' : data.error || '保存失败')
    } catch {
      setCfgMsg('保存失败')
    } finally {
      setCfgSaving(false)
    }
  }

  const expired = (row: AdminLink) => !!row.endAt && new Date(row.endAt).getTime() < Date.now()

  return (
    <div className="space-y-6">
      {/* ---------------- 列表 ---------------- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            友链与招商位
            {counts.PENDING > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {counts.PENDING} 条待审核
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" loading={sweeping} onClick={sweep}>
              <RadioTower className="mr-1 h-4 w-4" />
              {sweepAt ? `巡检中 ${sweepAt[0]}/${sweepAt[1]}` : '巡检本页回链'}
            </Button>
            <Button size="sm" onClick={() => setEditing({})}>
              <Plus className="mr-1 h-4 w-4" /> 新增
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 筛选 */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.key || 'all'}
                  onClick={() => {
                    setStatus(t.key)
                    setPage(1)
                  }}
                  className={`rounded px-3 py-1.5 text-sm transition-colors ${
                    status === t.key ? 'bg-white font-medium text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {t.label}
                  {t.key && counts[t.key] ? <span className="ml-1 text-xs text-gray-400">{counts[t.key]}</span> : null}
                </button>
              ))}
            </div>
            <select
              value={slot}
              onChange={(e) => {
                setSlot(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900"
            >
              <option value="">全部位置</option>
              <option value="FRIEND">友情链接</option>
              <option value="SPONSOR">招商位</option>
            </select>
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索站名 / 域名 / 联系方式..."
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setPage(1)
                }}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400">加载中...</div>
          ) : list.length === 0 ? (
            <div className="py-12 text-center text-gray-400">这里还没有记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-800">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2 pr-3">排序</th>
                    <th className="pb-2 pr-3">站点</th>
                    <th className="pb-2 pr-3">位置</th>
                    <th className="pb-2 pr-3">状态</th>
                    <th className="pb-2 pr-3">回链</th>
                    <th className="pb-2 pr-3">点击</th>
                    <th className="pb-2 pr-3">联系方式</th>
                    <th className="pb-2 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row) => (
                    <tr key={row.id} className="border-b align-top hover:bg-gray-50/60">
                      <td className="py-2.5 pr-3 text-gray-400">{row.sortOrder}</td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-start gap-2">
                          {row.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.logo}
                              alt=""
                              className="mt-0.5 h-8 w-8 shrink-0 rounded border border-gray-200 bg-gray-50 object-contain p-0.5"
                            />
                          ) : (
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                              {row.name.slice(0, 1)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium">{row.name}</div>
                            <div className="truncate text-xs text-gray-400">{row.description || '—'}</div>
                            <a
                              href={row.url}
                              target="_blank"
                              rel="noopener noreferrer nofollow"
                              className="font-mono text-[11px] text-blue-600 hover:underline"
                            >
                              {row.host}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        {row.slot === 'SPONSOR' ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">招商位</span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">友链</span>
                        )}
                        <div className="mt-1 text-[11px] text-gray-400">
                          {row.slot === 'SPONSOR' ? 'sponsored nofollow' : row.nofollow ? 'nofollow' : 'dofollow'}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[row.status] || 'bg-gray-100 text-gray-500'}`}
                        >
                          {STATUS_LABELS[row.status] || row.status}
                        </span>
                        {expired(row) && (
                          <div className="mt-1 text-[11px] text-red-500">已过期 {fmt(row.endAt)}</div>
                        )}
                        <div className="mt-1 text-[11px] text-gray-400">
                          {row.source === 'APPLY' ? '前台申请' : '后台添加'}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        {row.checkedAt ? (
                          <div title={row.backlinkNote || ''}>
                            {row.backlinkOk ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle2 className="h-3.5 w-3.5" /> 已回链
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-red-500">
                                <AlertTriangle className="h-3.5 w-3.5" /> 未找到
                              </span>
                            )}
                            <div className="mt-0.5 max-w-[150px] truncate text-[11px] text-gray-400">
                              {row.backlinkNote}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">未检测</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <MousePointerClick className="h-3 w-3" />
                          {row.clicks}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-gray-500">
                        <div className="max-w-[140px] truncate">{row.contact || '—'}</div>
                        {row.remark && <div className="max-w-[140px] truncate text-[11px] text-gray-400">{row.remark}</div>}
                        <div className="text-[11px] text-gray-300">{fmt(row.createdAt)}</div>
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        {row.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => patch(row.id, { status: 'APPROVED' })}
                              className="rounded px-2 py-1 text-xs text-green-600 hover:bg-green-50"
                            >
                              通过
                            </button>
                            <button
                              onClick={() => patch(row.id, { status: 'REJECTED' })}
                              className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                            >
                              拒绝
                            </button>
                          </>
                        )}
                        {row.status === 'APPROVED' && (
                          <button
                            onClick={() => patch(row.id, { status: 'OFFLINE' })}
                            title="下线"
                            className="rounded px-1.5 py-1 text-gray-500 hover:bg-gray-100"
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {(row.status === 'OFFLINE' || row.status === 'REJECTED') && (
                          <button
                            onClick={() => patch(row.id, { status: 'APPROVED' })}
                            title="上线"
                            className="rounded px-1.5 py-1 text-gray-500 hover:bg-gray-100"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            await check(row.id)
                            load()
                          }}
                          disabled={checkingId === row.id || sweeping}
                          title="检测对方是否还挂着本站链接"
                          className="rounded px-1.5 py-1 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
                        >
                          <RadioTower className={`h-3.5 w-3.5 ${checkingId === row.id ? 'animate-pulse' : ''}`} />
                        </button>
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          title="打开对方站点"
                          className="inline-flex rounded px-1.5 py-1 text-gray-500 hover:bg-gray-100"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <button
                          onClick={() => setEditing(row)}
                          title="编辑"
                          className="rounded px-1.5 py-1 text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => remove(row)}
                          title="删除"
                          className="rounded px-1.5 py-1 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-sm text-gray-500">
                共 {total} 条 · 第 {page} / {totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------------- 页面配置 ---------------- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>友链页文案与招商设置</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setCfgOpen((v) => !v)}>
            {cfgOpen ? '收起' : '展开编辑'}
          </Button>
        </CardHeader>
        {cfgOpen && (
          <CardContent>
            {!cfg ? (
              <div className="py-6 text-center text-gray-400">加载中...</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-600">页面导语</label>
                  <textarea
                    rows={2}
                    value={cfg.intro}
                    onChange={(e) => setCfg({ ...cfg, intro: e.target.value })}
                    className={CFG_INPUT}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">收录标准（一行一条）</label>
                    <textarea
                      rows={5}
                      value={cfg.requirements.join('\n')}
                      onChange={(e) => setCfg({ ...cfg, requirements: e.target.value.split('\n') })}
                      className={CFG_INPUT}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">招商位权益（一行一条）</label>
                    <textarea
                      rows={5}
                      value={cfg.sponsorBenefits.join('\n')}
                      onChange={(e) => setCfg({ ...cfg, sponsorBenefits: e.target.value.split('\n') })}
                      className={CFG_INPUT}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">招商区标题</label>
                    <input
                      value={cfg.sponsorTitle}
                      onChange={(e) => setCfg({ ...cfg, sponsorTitle: e.target.value })}
                      className={CFG_INPUT}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">招商位总数（决定前台「虚位以待 N 席」）</label>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      value={cfg.sponsorSlots}
                      onChange={(e) => setCfg({ ...cfg, sponsorSlots: parseInt(e.target.value) || 0 })}
                      className={CFG_INPUT}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">前台在线申请</label>
                    <select
                      value={cfg.applyOpen ? '1' : '0'}
                      onChange={(e) => setCfg({ ...cfg, applyOpen: e.target.value === '1' })}
                      className={CFG_INPUT}
                    >
                      <option value="1">开放</option>
                      <option value="0">关闭（只留联系方式）</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-600">招商区说明</label>
                  <textarea
                    rows={2}
                    value={cfg.sponsorIntro}
                    onChange={(e) => setCfg({ ...cfg, sponsorIntro: e.target.value })}
                    className={CFG_INPUT}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">公开联系方式（微信号 / 邮箱）</label>
                    <input
                      value={cfg.contact}
                      onChange={(e) => setCfg({ ...cfg, contact: e.target.value })}
                      className={CFG_INPUT}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">联系方式补充说明</label>
                    <input
                      value={cfg.contactNote}
                      onChange={(e) => setCfg({ ...cfg, contactNote: e.target.value })}
                      className={CFG_INPUT}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-3 text-sm font-medium text-gray-700">本站信息（前台提供给对方一键复制）</div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-gray-600">站点名称</label>
                      <input
                        value={cfg.siteName}
                        onChange={(e) => setCfg({ ...cfg, siteName: e.target.value })}
                        className={CFG_INPUT}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-600">站点地址</label>
                      <input
                        value={cfg.siteUrl}
                        onChange={(e) => setCfg({ ...cfg, siteUrl: e.target.value })}
                        className={CFG_INPUT}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-600">Logo 地址</label>
                      <input
                        value={cfg.siteLogo}
                        onChange={(e) => setCfg({ ...cfg, siteLogo: e.target.value })}
                        className={CFG_INPUT}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-600">站点简介</label>
                      <input
                        value={cfg.siteDescription}
                        onChange={(e) => setCfg({ ...cfg, siteDescription: e.target.value })}
                        className={CFG_INPUT}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button onClick={saveCfg} loading={cfgSaving}>
                    保存配置
                  </Button>
                  {cfgMsg && (
                    <span
                      className={`inline-flex items-center gap-1 text-sm ${cfgMsg.includes('已保存') ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {cfgMsg.includes('已保存') ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      {cfgMsg}
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {editing && (
        <LinkEditModal
          value={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
    </div>
  )
}
