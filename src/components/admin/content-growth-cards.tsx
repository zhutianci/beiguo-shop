'use client'

/**
 * 后台：内容平台 P3「增长与变现」四张卡片（设计 §8.3、§9.3、§14 P3）：
 *   · 创作者认证申请    —— /api/admin/content/applications
 *   · 月度精选奖        —— /api/admin/content/awards（发充值余额，不可提现）
 *   · 积分兑换档位      —— /api/admin/content/points-shop
 *   · 赞助位            —— /api/admin/content/sponsors
 * 默认收起，展开时才请求；与举报队列、标签管理同一种写法。
 */
import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

async function api(url: string, method = 'GET', body?: unknown) {
  const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
  return res.json()
}

function Shell({ title, badge, children, onOpen }: { title: string; badge?: number; children: React.ReactNode; onOpen?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {title}
          {!!badge && <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">{badge}</span>}
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (!open) onOpen?.()
            setOpen((v) => !v)
          }}
        >
          {open ? '收起' : '展开'}
        </Button>
      </CardHeader>
      {open && <CardContent>{children}</CardContent>}
    </Card>
  )
}

const yuan = (cents: number) => (cents / 100).toFixed(2).replace(/\.00$/, '')

// ─────────────────────────────── 创作者认证申请 ───────────────────────────────

interface Application {
  id: number
  field: string
  works: string
  intro: string
  status: string
  reviewNote: string | null
  createdAt: string
  user: { email: string | null; nickname: string | null }
  handle: string | null
  points: number
  publicWorks: number
}

export function CreatorApplicationsCard() {
  const [status, setStatus] = useState('PENDING')
  const [data, setData] = useState<{ list: Application[]; pending: number } | null>(null)
  const load = useCallback(async () => {
    const d = await api(`/api/admin/content/applications?status=${status}`)
    if (d.success) setData(d.data)
  }, [status])
  // 待审数要在收起时也能看到（标题上的角标），所以挂载就拉一次
  useEffect(() => {
    load()
  }, [load])
  const act = async (id: number, action: 'approve' | 'reject', field: string) => {
    let body: Record<string, unknown> = { id, action }
    if (action === 'approve') {
      const title = prompt('认证头衔：', `${field}创作者`)
      if (title === null) return
      body = { ...body, title: title.trim() || undefined }
    } else {
      const note = prompt('驳回原因（作者能看到）：', '')
      if (note === null) return
      body = { ...body, note: note.trim() || undefined }
    }
    const d = await api('/api/admin/content/applications', 'PATCH', body)
    if (d.success) load()
    else alert(d.error || '操作失败')
  }
  return (
    <Shell title="创作者认证申请" badge={data?.pending}>
      <div className="mb-3 flex gap-2 text-xs">
        {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
          <button key={s} type="button" onClick={() => setStatus(s)} className={`rounded-full px-3 py-1 ${status === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {s === 'PENDING' ? '待审' : s === 'APPROVED' ? '已通过' : '已驳回'}
          </button>
        ))}
      </div>
      {!data ? (
        <div className="py-6 text-center text-sm text-gray-400">加载中…</div>
      ) : !data.list.length ? (
        <div className="py-6 text-center text-sm text-gray-400">没有申请</div>
      ) : (
        <div className="space-y-3">
          {data.list.map((a) => (
            <div key={a.id} className="rounded-lg border p-3 text-sm text-gray-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-medium">{a.field}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {a.user.nickname || a.user.email || '会员'} · {a.points} 积分 · 公开作品 {a.publicWorks} 条
                  </span>
                  {a.handle && (
                    <a href={`/u/${a.handle}`} target="_blank" rel="noreferrer" className="ml-2 text-xs text-blue-600 hover:underline">
                      作者页
                    </a>
                  )}
                </div>
                {a.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => act(a.id, 'approve', a.field)} className="rounded px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50">
                      通过
                    </button>
                    <button type="button" onClick={() => act(a.id, 'reject', a.field)} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">
                      驳回
                    </button>
                  </div>
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-xs text-gray-600">{a.intro}</p>
              <p className="mt-1 whitespace-pre-wrap break-all text-xs text-gray-500">代表作：{a.works}</p>
              {a.reviewNote && <p className="mt-1 text-xs text-gray-400">备注：{a.reviewNote}</p>}
            </div>
          ))}
        </div>
      )}
    </Shell>
  )
}

// ─────────────────────────────── 月度精选奖 ───────────────────────────────

interface Candidate {
  id: number
  type: string
  title: string
  path: string
  authorName: string
  score: number
  copyCount: number
  favoriteCount: number
  remixCount: number
  awardedCents: number | null
}

function shMonth(offset = 0): number {
  const d = new Date(Date.now() + 8 * 3600_000)
  const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 1))
  return m.getUTCFullYear() * 100 + m.getUTCMonth() + 1
}

export function MonthlyAwardsCard() {
  // 默认看上个月：月度奖一般在月初评上个月
  const [month, setMonth] = useState(shMonth(-1))
  const [data, setData] = useState<{ candidates: Candidate[]; defaultCents: number; perMonthHint: number; given: { count: number; cents: number } } | null>(null)
  const [amount, setAmount] = useState('30')
  const [opened, setOpened] = useState(false)
  const load = useCallback(async () => {
    const d = await api(`/api/admin/content/awards?month=${month}`)
    if (d.success) setData(d.data)
  }, [month])
  // 展开后切换月份要重新拉；收起时不请求
  useEffect(() => {
    if (opened) load()
  }, [opened, load])
  const grant = async (c: Candidate) => {
    const cents = Math.round(Number(amount) * 100)
    if (!cents) return alert('请填写金额')
    const note = prompt(`给「${c.title}」发 ${amount} 元月度精选奖（进作者充值余额，不可提现）。\n\n颁奖语（作者能看到，可空）：`, '')
    if (note === null) return
    const d = await api('/api/admin/content/awards', 'POST', { month, postId: c.id, amountCents: cents, note: note.trim() || undefined })
    if (d.success) load()
    else alert(d.error || '发放失败')
  }
  return (
    <Shell title="月度精选奖" onOpen={() => setOpened(true)}>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
          {[0, -1, -2, -3].map((o) => (
            <option key={o} value={shMonth(o)}>
              {Math.floor(shMonth(o) / 100)} 年 {shMonth(o) % 100} 月
            </option>
          ))}
        </select>
        <span className="text-gray-500">每篇</span>
        <Input value={amount} onChange={(e) => setAmount(e.target.value)} className="h-8 w-20" inputMode="decimal" />
        <span className="text-gray-500">元</span>
        <Button size="sm" variant="outline" onClick={load}>
          刷新
        </Button>
        {data && (
          <span className="ml-auto text-xs text-gray-500">
            本月已发 {data.given.count} 篇 · {yuan(data.given.cents)} 元（建议每月 3~{data.perMonthHint} 篇）
          </span>
        )}
      </div>
      {!data ? (
        <div className="py-6 text-center text-sm text-gray-400">加载中…</div>
      ) : !data.candidates.length ? (
        <div className="py-6 text-center text-sm text-gray-400">这个月没有被精选的内容</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-gray-500">
              <th className="py-2">内容</th>
              <th className="py-2">作者</th>
              <th className="py-2">互动分</th>
              <th className="py-2 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {data.candidates.map((c) => (
              <tr key={c.id} className="border-b border-gray-100">
                <td className="py-2 pr-2">
                  <a href={c.path} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {c.title}
                  </a>
                </td>
                <td className="py-2 pr-2 text-gray-600">{c.authorName}</td>
                <td className="py-2 pr-2 text-xs tabular-nums text-gray-500" title={`复制 ${c.copyCount} · 收藏 ${c.favoriteCount} · 同款 ${c.remixCount}`}>
                  {c.score}
                </td>
                <td className="py-2 text-right">
                  {c.awardedCents !== null ? (
                    <span className="text-xs text-emerald-700">已发 {yuan(c.awardedCents)} 元</span>
                  ) : (
                    <button type="button" onClick={() => grant(c)} className="rounded px-2 py-1 text-xs text-amber-700 hover:bg-amber-50">
                      发奖
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Shell>
  )
}

// ─────────────────────────────── 积分兑换档位 ───────────────────────────────

interface ShopOption {
  key: string
  label: string
  cost: number
  discount: number
  minAmount: number
  days: number
  enabled: boolean
}

export function PointsShopCard() {
  const [data, setData] = useState<{ options: ShopOption[]; monthlyLimit: number; month: { count: number; points: number } } | null>(null)
  const [opts, setOpts] = useState<ShopOption[]>([])
  const load = async () => {
    const d = await api('/api/admin/content/points-shop')
    if (d.success) {
      setData(d.data)
      setOpts(d.data.options)
    }
  }
  const save = async () => {
    const d = await api('/api/admin/content/points-shop', 'PUT', { options: opts })
    if (d.success) load()
    else alert(d.error || '保存失败')
  }
  const set = (i: number, k: keyof ShopOption, v: string | boolean) =>
    setOpts((o) => o.map((x, j) => (j === i ? { ...x, [k]: typeof v === 'boolean' || k === 'key' || k === 'label' ? v : Number(v) } : x)))
  return (
    <Shell title="积分兑换优惠券" onOpen={load}>
      {!data ? (
        <div className="py-6 text-center text-sm text-gray-400">加载中…</div>
      ) : (
        <div>
          <p className="mb-3 text-xs text-gray-500">
            作者在学习空间用「可用积分」兑换，每人每月最多 {data.monthlyLimit} 次；兑换不影响等级。本月已兑换 {data.month.count} 次、{data.month.points} 积分。发出的券在「优惠券 → 积分兑换」里能看到。
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500">
                  <th className="py-2">编号</th>
                  <th className="py-2">名称</th>
                  <th className="py-2">积分</th>
                  <th className="py-2">面额</th>
                  <th className="py-2">门槛</th>
                  <th className="py-2">有效天数</th>
                  <th className="py-2">上架</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {opts.map((o, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-1.5 pr-1"><Input value={o.key} onChange={(e) => set(i, 'key', e.target.value)} className="h-8 w-16" /></td>
                    <td className="py-1.5 pr-1"><Input value={o.label} onChange={(e) => set(i, 'label', e.target.value)} className="h-8 w-36" /></td>
                    <td className="py-1.5 pr-1"><Input value={o.cost} onChange={(e) => set(i, 'cost', e.target.value)} className="h-8 w-20" /></td>
                    <td className="py-1.5 pr-1"><Input value={o.discount} onChange={(e) => set(i, 'discount', e.target.value)} className="h-8 w-16" /></td>
                    <td className="py-1.5 pr-1"><Input value={o.minAmount} onChange={(e) => set(i, 'minAmount', e.target.value)} className="h-8 w-16" /></td>
                    <td className="py-1.5 pr-1"><Input value={o.days} onChange={(e) => set(i, 'days', e.target.value)} className="h-8 w-16" /></td>
                    <td className="py-1.5 pr-1"><input type="checkbox" checked={o.enabled} onChange={(e) => set(i, 'enabled', e.target.checked)} /></td>
                    <td className="py-1.5 text-right">
                      <button type="button" onClick={() => setOpts((x) => x.filter((_, j) => j !== i))} className="text-xs text-red-600">删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" disabled={opts.length >= 8} onClick={() => setOpts((x) => [...x, { key: `c${x.length + 1}x`, label: '新档位', cost: 200, discount: 5, minAmount: 0, days: 30, enabled: false }])}>
              加一档
            </Button>
            <Button size="sm" onClick={save}>保存</Button>
          </div>
        </div>
      )}
    </Shell>
  )
}

// ─────────────────────────────── 赞助位 ───────────────────────────────

interface Sponsor {
  id: number
  title: string
  blurb: string | null
  url: string
  image: string | null
  placement: string
  startAt: string
  endAt: string
  active: boolean
  clicks: number
}

const PLACEMENT_LABELS: Record<string, string> = { ALL: '全部列表页', LEARN: '学习首页', PROMPTS: '提示词库', GUIDES: '教程', APPS: 'AI 应用' }
const day = (iso: string) => iso.slice(0, 10)

export function SponsorsCard() {
  const [list, setList] = useState<Sponsor[] | null>(null)
  const empty = { title: '', blurb: '', url: '', image: '', placement: 'ALL', startAt: day(new Date().toISOString()), endAt: day(new Date(Date.now() + 7 * 86_400_000).toISOString()) }
  const [form, setForm] = useState(empty)
  const load = async () => {
    const d = await api('/api/admin/content/sponsors')
    if (d.success) setList(d.data.list)
  }
  const create = async () => {
    // 起止按上海时间的整天：开始日 0 点到结束日 24 点
    const d = await api('/api/admin/content/sponsors', 'POST', {
      ...form,
      startAt: `${form.startAt}T00:00:00+08:00`,
      endAt: `${form.endAt}T23:59:59+08:00`,
    })
    if (d.success) {
      setForm(empty)
      load()
    } else alert(d.error || '保存失败')
  }
  const toggle = async (s: Sponsor) => {
    const d = await api('/api/admin/content/sponsors', 'PATCH', { id: s.id, active: !s.active })
    if (d.success) load()
    else alert(d.error || '操作失败')
  }
  const now = Date.now()
  return (
    <Shell title="赞助位" onOpen={load}>
      <p className="mb-3 text-xs text-gray-500">
        列表页筛选条下方的一条横幅，明确标「赞助」、链接 sponsored，不影响排序与精选。线下谈好、收款后在这里录入起止日期，到期自动下架。图片请先在论坛上传后把地址贴进来（/uploads/forum/…）。
      </p>
      <div className="mb-4 grid gap-2 rounded-lg border border-dashed p-3 sm:grid-cols-2">
        <Input placeholder="标题（≤60 字）" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input placeholder="链接 https://…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        <Input placeholder="一句话介绍（可空）" value={form.blurb} onChange={(e) => setForm({ ...form, blurb: e.target.value })} />
        <Input placeholder="图片地址 /uploads/forum/…（可空）" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
        <select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })} className="rounded-md border border-gray-300 px-2 py-2 text-sm">
          {Object.entries(PLACEMENT_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2 text-sm">
          <Input type="date" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
          <span>至</span>
          <Input type="date" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <Button size="sm" onClick={create}>添加</Button>
        </div>
      </div>
      {!list ? (
        <div className="py-6 text-center text-sm text-gray-400">加载中…</div>
      ) : !list.length ? (
        <div className="py-6 text-center text-sm text-gray-400">还没有赞助</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-gray-500">
              <th className="py-2">赞助</th>
              <th className="py-2">位置</th>
              <th className="py-2">时间</th>
              <th className="py-2">点击</th>
              <th className="py-2 text-right">状态</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => {
              const live = s.active && new Date(s.startAt).getTime() <= now && new Date(s.endAt).getTime() > now
              return (
                <tr key={s.id} className="border-b border-gray-100">
                  <td className="py-2 pr-2">
                    <div className="font-medium">{s.title}</div>
                    <div className="max-w-[260px] truncate text-xs text-gray-400">{s.url}</div>
                  </td>
                  <td className="py-2 pr-2 text-gray-600">{PLACEMENT_LABELS[s.placement] ?? s.placement}</td>
                  <td className="py-2 pr-2 text-xs text-gray-500">
                    {new Date(s.startAt).toLocaleDateString('zh-CN')} – {new Date(s.endAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="py-2 pr-2 tabular-nums text-gray-600">{s.clicks}</td>
                  <td className="py-2 text-right">
                    <span className={`mr-2 text-xs ${live ? 'text-emerald-700' : 'text-gray-400'}`}>{live ? '投放中' : s.active ? '未在投期' : '已下架'}</span>
                    <button type="button" onClick={() => toggle(s)} className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">
                      {s.active ? '下架' : '上架'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </Shell>
  )
}

// ─────────────────────────────── 内容带单 ───────────────────────────────

interface Conversion {
  id: number
  title: string
  path: string
  authorName: string
  visits: number
  orders: number
  amount: number
}

/** 哪些内容把读者带到了落地页、带来了付款订单（设计 §13.2）。访问按访客每天去重；订单是 7 天内付款的 */
export function ContentConversionCard() {
  const [days, setDays] = useState(30)
  const [list, setList] = useState<Conversion[] | null>(null)
  const [opened, setOpened] = useState(false)
  const load = useCallback(async () => {
    const d = await api(`/api/admin/content/conversion?days=${days}`)
    if (d.success) setList(d.data.list)
  }, [days])
  useEffect(() => {
    if (opened) load()
  }, [opened, load])
  return (
    <Shell title="内容带单" onOpen={() => setOpened(true)}>
      <div className="mb-3 flex items-center gap-2 text-xs">
        {[7, 30, 90].map((d) => (
          <button key={d} type="button" onClick={() => setDays(d)} className={`rounded-full px-3 py-1 ${days === d ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
            近 {d} 天
          </button>
        ))}
        <span className="ml-auto text-gray-400">访问 = 从内容页「开通」入口进落地页的人次；订单 = 之后 7 天内付款的</span>
      </div>
      {!list ? (
        <div className="py-6 text-center text-sm text-gray-400">加载中…</div>
      ) : !list.length ? (
        <div className="py-6 text-center text-sm text-gray-400">这段时间还没有内容带来访问</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-gray-500">
              <th className="py-2">内容</th>
              <th className="py-2">作者</th>
              <th className="py-2 text-right">访问</th>
              <th className="py-2 text-right">订单</th>
              <th className="py-2 text-right">金额</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="border-b border-gray-100">
                <td className="py-2 pr-2">
                  <a href={c.path} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    {c.title}
                  </a>
                </td>
                <td className="py-2 pr-2 text-gray-600">{c.authorName}</td>
                <td className="py-2 text-right tabular-nums">{c.visits}</td>
                <td className="py-2 text-right tabular-nums">{c.orders}</td>
                <td className="py-2 text-right tabular-nums">¥{c.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Shell>
  )
}
