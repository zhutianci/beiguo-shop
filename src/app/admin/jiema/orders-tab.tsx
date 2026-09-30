'use client'

/**
 * 短信接码后台 ·「订单」（docs/短信接码-设计.md §7.2）：列表 + 详情抽屉 + 操作。数据全部经 adminGuard 的 /api/admin/jiema/orders/**；
 * 每个操作都要填原因，接口写审计（jiema.order.<动作>）。
 *
 * 【列表】按状态（含 MANUAL、REFUNDING、CANCELLED 快捷筛选）、付款方式、服务、国家、日期、用户（邮箱或 id）、订单号或号码筛选；
 * 每行：订单号、用户、服务·国家·运营商、售价、付款拆分、尝试数、状态、实际扣费（USD）、真实成本、毛利（已取消「不计」，未定稿灰字「预估」）；
 * 页脚合计当前筛选的营收、真实成本、毛利（营收 − 成本 = 毛利恒成立）。
 * 【详情】快照（报价成本、cap、x、成本汇率、加价、覆盖规则）、资金（付款拆分、预扣时间线、支付流水、收款单、本单余额流水、退款拆分）、
 * 成本利润、尝试时间线（含上游原文 raw，折叠）、短信、事件流水、订单留言（复用后台留言面板）。
 * 【操作】售后退款到余额 / 取消并退回余额 / 关单并原路退回预扣 / 关单并把到账退入余额 / 加赠换号 / 释放某个号码 / 解除 MANUAL /
 * 认领上游激活 / 重新核算成本。没有「手工释放预扣」「改成本汇率」的入口（预扣只能随关单释放，§7.8；成本只按快照重算）。
 */
import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import OrderChat from '@/components/order-chat'
import { X, RefreshCw } from 'lucide-react'

const STATES: Array<[string, string]> = [
  ['ALL', '全部状态'],
  ['ACTIVE', '进行中'],
  ['MANUAL', 'MANUAL（人工）'],
  ['REFUNDING', 'REFUNDING（退款中）'],
  ['CANCELLED', 'CANCELLED（已取消）'],
  ['PENDING_PAY', 'PENDING_PAY'],
  ['CLOSED', 'CLOSED'],
  ['READY', 'READY'],
  ['ACQUIRING', 'ACQUIRING'],
  ['WAITING', 'WAITING'],
  ['REPLACING', 'REPLACING'],
  ['CANCELLING', 'CANCELLING'],
  ['RECEIVED', 'RECEIVED'],
  ['FINISHED', 'FINISHED'],
  ['REFUNDED', 'REFUNDED'],
]
const STATE_ZH: Record<string, string> = {
  PENDING_PAY: '待支付',
  CLOSED: '已关闭',
  READY: '待开始',
  ACQUIRING: '取号中',
  WAITING: '等码',
  REPLACING: '换号中',
  CANCELLING: '取消中',
  RECEIVED: '已收码',
  FINISHED: '已完成',
  REFUNDING: '退款中',
  CANCELLED: '已取消',
  REFUNDED: '售后退款',
  MANUAL: '人工',
}

interface Row {
  id: number
  orderId: number
  orderNo: string | null
  payStatus: string | null
  user: { id: number; email: string | null; nickname: string | null; flag?: string | null }
  service: string
  serviceName: string
  country: number
  countryName: string
  operator: string | null
  priceCents: number
  payMode: string
  payText: string
  holdState: string | null
  attempts: number
  state: string
  notice: string | null
  chargedMicro: number | null
  costCents: number | null
  profitCents: number | null
  costFinal: boolean
  lossCents: number | null
  createdAt: string
}
interface ListResp {
  list: Row[]
  total: number
  page: number
  totalPages: number
  footer: { orders: number; revenueCents: number; costCents: number; profitCents: number; lossCents: number; estimating: number; notCounted: number; truncated: boolean }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Detail = any

const yuan = (c: number | null | undefined) => (c == null ? '—' : `${c < 0 ? '-' : ''}¥${(Math.abs(c) / 100).toFixed(2)}`)
const usd4 = (m: number | null | undefined) => (m == null ? '—' : `$${(m / 1e6).toFixed(4)}`)
const coef = (c4: number | null | undefined) => (c4 == null ? '—' : (c4 / 10000).toFixed(2))
const t = (s: string | null | undefined) => (s ? new Date(s).toLocaleString('zh-CN', { hour12: false }) : '—')
const inputCls = 'rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none'

async function send(method: string, url: string, body?: unknown): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
    const d = await res.json().catch(() => null)
    return { ok: !!d?.success, status: res.status, data: d }
  } catch {
    return { ok: false, status: 0, data: { error: '网络异常' } }
  }
}

export function OrdersTab({ openId, onOpened, initialQ }: { openId: number | null; onOpened: () => void; initialQ?: string | null }) {
  const [f, setF] = useState({ state: 'ALL', payMode: '', service: '', country: '', from: '', to: '', user: '', q: initialQ ?? '' })
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ListResp | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setErr(null)
    const qs = new URLSearchParams({ page: String(page), pageSize: '20' })
    for (const [k, v] of Object.entries(f)) if (v && v !== 'ALL') qs.set(k, v)
    const r = await send('GET', `/api/admin/jiema/orders?${qs}`)
    if (r.ok) setData(r.data.data as ListResp)
    else setErr(r.data?.error || '加载失败')
  }, [f, page])
  useEffect(() => {
    void load()
  }, [load])
  useEffect(() => {
    if (openId) {
      setDetailId(openId)
      onOpened()
    }
  }, [openId, onOpened])

  const quick = (state: string) => {
    setF((x) => ({ ...x, state }))
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-end gap-2 py-4 text-sm">
          <select value={f.state} onChange={(e) => quick(e.target.value)} className={inputCls}>
            {STATES.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
          <select value={f.payMode} onChange={(e) => setF({ ...f, payMode: e.target.value })} className={inputCls}>
            <option value="">全部付款方式</option>
            <option value="ALIPAY">支付宝</option>
            <option value="BALANCE">余额付清</option>
            <option value="MIXED">组合</option>
          </select>
          <input value={f.service} onChange={(e) => setF({ ...f, service: e.target.value })} placeholder="服务代码 dr" className={`${inputCls} w-24`} />
          <input value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} placeholder="国家 id" className={`${inputCls} w-20`} />
          <input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} className={inputCls} />
          <input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} className={inputCls} />
          <input value={f.user} onChange={(e) => setF({ ...f, user: e.target.value })} placeholder="用户邮箱 / id" className={`${inputCls} w-36`} />
          <input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="订单号 / 号码（后 4 位起）" className={`${inputCls} w-48`} />
          <Button size="sm" onClick={() => { setPage(1); void load() }}>
            查询
          </Button>
          <div className="ml-auto flex gap-1 text-xs">
            {['MANUAL', 'REFUNDING', 'CANCELLED'].map((s) => (
              <button key={s} onClick={() => quick(s)} className={`rounded-full border px-2 py-1 ${f.state === s ? 'border-primary-500 text-primary-700' : 'border-gray-300 text-gray-600'}`}>
                {s}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {err && <div className="text-sm text-red-600">{err}</div>}
      {data && (
        <Card>
          <CardContent className="py-4">
            <div className="w-full overflow-x-auto [contain:inline-size]">
              <table className="w-full min-w-[1100px] text-xs">
                <thead className="text-left text-gray-500">
                  <tr>
                    {['订单号', '用户', '服务 · 国家/地区 · 运营商', '售价', '付款', '尝试', '状态', '实际扣费', '真实成本', '毛利', '下单时间'].map((h) => (
                      <th key={h} className="py-2 pr-3 font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.list.map((r) => {
                    const notCounted = r.costCents == null || r.profitCents == null
                    return (
                      <tr key={r.id} onClick={() => setDetailId(r.id)} className="cursor-pointer border-t border-gray-100 hover:bg-gray-50">
                        <td className="py-2 pr-3 font-mono">{r.orderNo ?? `#${r.orderId}`}</td>
                        <td className="py-2 pr-3">
                          {r.user.email ?? r.user.nickname ?? `#${r.user.id}`}
                          {r.user.flag && (
                            <span className="ml-1 inline-flex rounded bg-amber-100 px-1 py-0.5 text-[11px] text-amber-800" title="可疑用户标记：只标记、不限制下单（§10.1）">
                              {r.user.flag}
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {r.serviceName} · {r.countryName} · {r.operator ?? '任意'}
                        </td>
                        <td className="py-2 pr-3">{yuan(r.priceCents)}</td>
                        <td className="py-2 pr-3">{r.payText}</td>
                        <td className="py-2 pr-3">{r.attempts}</td>
                        <td className={`py-2 pr-3 ${r.state === 'MANUAL' ? 'font-medium text-red-600' : ''}`} title={r.notice ?? undefined}>
                          {STATE_ZH[r.state] ?? r.state}
                        </td>
                        <td className="py-2 pr-3">{usd4(r.chargedMicro)}</td>
                        <td className={`py-2 pr-3 ${r.costFinal ? '' : 'text-gray-400'}`}>
                          {notCounted ? (r.state === 'CANCELLED' ? '不计' : '—') : yuan(r.costCents)}
                          {!notCounted && !r.costFinal && ' 预估'}
                          {r.lossCents ? <div className="text-red-500">亏损 {yuan(r.lossCents)}</div> : null}
                        </td>
                        <td className={`py-2 pr-3 ${notCounted ? 'text-gray-400' : (r.profitCents as number) >= 0 ? 'text-green-700' : 'text-red-600'} ${r.costFinal ? '' : 'opacity-70'}`}>
                          {notCounted ? (r.state === 'CANCELLED' ? '不计' : '—') : yuan(r.profitCents)}
                          {!notCounted && !r.costFinal && ' 预估'}
                        </td>
                        <td className="py-2 pr-3 text-gray-500">{t(r.createdAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
              <div>
                当前筛选 {data.total} 单 · 计成本 {data.footer.orders} 单：营收 <b>{yuan(data.footer.revenueCents)}</b> · 真实成本 <b>{yuan(data.footer.costCents)}</b> · 毛利{' '}
                <b className={data.footer.profitCents >= 0 ? 'text-green-700' : 'text-red-600'}>{yuan(data.footer.profitCents)}</b>
                {data.footer.estimating > 0 && `（含预估 ${data.footer.estimating} 单）`}
                {data.footer.lossCents > 0 && ` · 亏损 ${yuan(data.footer.lossCents)}`}
                {data.footer.notCounted > 0 && ` · 不计 ${data.footer.notCounted} 单（已取消 / 未付款）`}
                {data.footer.truncated && <span className="text-amber-600"> · 超过 20000 单，合计只含最近 20000 单</span>}
              </div>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border px-2 py-1 disabled:opacity-40">
                  上一页
                </button>
                <span>
                  {data.page} / {data.totalPages}
                </span>
                <button disabled={page >= data.totalPages} onClick={() => setPage(page + 1)} className="rounded border px-2 py-1 disabled:opacity-40">
                  下一页
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {detailId != null && <DetailDrawer id={detailId} onClose={() => setDetailId(null)} onChanged={() => void load()} />}
    </div>
  )
}

function DetailDrawer({ id, onClose, onChanged }: { id: number; onClose: () => void; onChanged: () => void }) {
  const [d, setD] = useState<Detail | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [claim, setClaim] = useState<{ attemptId: number; list: any[] | null; err: string | null; calibrated?: boolean } | null>(null)
  const [chatOpen, setChatOpen] = useState(false)

  const load = useCallback(async () => {
    const r = await send('GET', `/api/admin/jiema/orders/${id}`)
    if (r.ok) setD(r.data.data)
    else setErr(r.data?.error || '加载失败')
  }, [id])
  useEffect(() => {
    void load()
  }, [load])

  const run = async (action: string, extra: Record<string, unknown> = {}, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return
    const reason = window.prompt('请填写原因（写进审计，买家看不到）')
    if (!reason || reason.trim().length < 2) return
    setBusy(true)
    setMsg(null)
    const r = await send('POST', `/api/admin/jiema/orders/${id}`, { action, reason: reason.trim(), ...extra })
    setBusy(false)
    setMsg({ ok: r.ok, text: r.data?.message || r.data?.error || (r.ok ? '已完成' : '失败') })
    if (r.ok && r.data?.data?.detail) setD(r.data.data.detail)
    else if (r.data?.data) setD(r.data.data)
    else await load()
    onChanged()
  }

  const loadClaim = async (attemptId: number) => {
    setClaim({ attemptId, list: null, err: null })
    const r = await send('GET', `/api/admin/jiema/orders/${id}/claim?attemptId=${attemptId}`)
    setClaim({ attemptId, list: r.ok ? r.data.data.list : null, err: r.ok ? null : r.data?.error || '加载失败', calibrated: r.ok ? r.data.data.calibrated : undefined })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/30" aria-label="关闭" onClick={onClose} />
      <div className="relative h-full w-full max-w-3xl overflow-y-auto bg-white p-5 text-sm text-gray-700 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">接码订单详情</h2>
          <div className="flex gap-2">
            <button onClick={() => void load()} className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label="刷新">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label="关闭">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        {err && <div className="text-red-600">{err}</div>}
        {!d ? (
          !err && <div className="text-gray-400">加载中...</div>
        ) : (
          <div className="space-y-5">
            {msg && <div className={`rounded border px-3 py-2 ${msg.ok ? 'border-green-200 bg-green-50 text-green-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{msg.text}</div>}
            <section>
              <div className="font-mono text-base text-gray-900">{d.order?.orderNo}</div>
              <div className="text-gray-500">
                {d.so.serviceName}（{d.so.service}）· {d.so.countryName}（{d.so.country}）· 运营商 {d.so.operator ?? '任意'}
                {d.so.operator && !d.so.operatorFallback && '（不降级）'} · 状态 <b className="text-gray-900">{d.so.state}</b> v{d.so.version} · 订单 {d.order?.payStatus}/{d.order?.deliveryStatus}
              </div>
              <div className="text-gray-500">
                用户 {d.user?.email ?? d.user?.nickname ?? `#${d.so.userId}`}（充值格 {yuan(d.user?.topupCents)} · 返现格 {yuan(d.user?.cashCents)}）· 下单 {t(d.so.createdAt)}
              </div>
              {d.so.notice && <div className="text-amber-700">notice：{d.so.notice}</div>}
            </section>

            <section>
              <h3 className="mb-1 font-medium text-gray-900">操作</h3>
              <div className="flex flex-wrap gap-2">
                {d.actions.refund && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => void run('refund', {}, '售后退款：先放掉还开着的号，再整单原路退回余额（成本照计、利润 = −成本）。确定吗？')}>
                    售后退款到余额
                  </Button>
                )}
                {d.actions.cancelRefund && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => void run('cancel_refund', {}, '取消并退回余额：放掉还开着的号，全部终态后整单退回余额（不计成本；有扣费的号记亏损）。确定吗？')}>
                    取消并退回余额
                  </Button>
                )}
                {d.actions.closeRelease && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => void run('close_release', {}, '关单并原路退回预扣（与超时关单同一个事务）。确定吗？')}>
                    关单并原路退回预扣
                  </Button>
                )}
                {d.actions.closeLatepay && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => void run('close_latepay', {}, '关单并把到账退入买家余额（E44；预扣保持原样，另行核实）。确定吗？')}>
                    关单并把到账退入余额
                  </Button>
                )}
                {d.actions.bonusReplace && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      const n = Number(window.prompt('加赠几次换号（1–5）', '1'))
                      if (n >= 1 && n <= 5) void run('bonus_replace', { n })
                    }}
                  >
                    加赠换号
                  </Button>
                )}
                {d.actions.unmanual && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => {
                      const target = window.prompt('解除 MANUAL，回到哪个状态？PENDING_PAY / ACQUIRING / WAITING / REFUNDING（系统会先校验前提）', 'REFUNDING')
                      if (target && ['PENDING_PAY', 'ACQUIRING', 'WAITING', 'REFUNDING'].includes(target.trim().toUpperCase())) void run('unmanual', { target: target.trim().toUpperCase() })
                    }}
                  >
                    解除 MANUAL
                  </Button>
                )}
                {d.actions.recompute && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => void run('recompute')}>
                    重新核算成本
                  </Button>
                )}
                {d.releasable.map((aid: number) => (
                  <Button key={aid} size="sm" variant="outline" disabled={busy} onClick={() => void run('release_attempt', { attemptId: aid }, `释放尝试 #${aid} 的号码（向上游取消）。确定吗？`)}>
                    释放号码 #{aid}
                  </Button>
                ))}
                {d.unknownAttempts.map((aid: number) => (
                  <Button key={aid} size="sm" variant="outline" disabled={busy} onClick={() => void loadClaim(aid)}>
                    认领上游激活（尝试 #{aid}）
                  </Button>
                ))}
              </div>
              {d.so.state === 'MANUAL' && d.unknownAttempts.length > 0 && (
                <p className="mt-1 text-xs text-amber-700">还有结果未知的取号：先「认领上游激活」，或等扫描器判定没买到，之后才能「解除 MANUAL」「取消并退回余额」（否则扫描器会把单再转回人工）</p>
              )}
              {claim && (
                <div className="mt-2 rounded border border-gray-200 p-2 text-xs">
                  <div className="mb-1 font-medium">尝试 #{claim.attemptId} 的候选（同服务、同国家、本站不认识的上游激活）{claim.calibrated === false && <span className="text-amber-700">（近 24 小时没有时钟校准样本，时间窗按原始时间）</span>}</div>
                  {claim.err && <div className="text-red-600">{claim.err}</div>}
                  {claim.list == null && !claim.err && <div className="text-gray-400">拉取上游活跃列表…</div>}
                  {claim.list && claim.list.length === 0 && <div className="text-gray-400">没有候选：可能上游确实没买到（扫描器会判定），或号码已被上游结束</div>}
                  {claim.list?.map((c: any) => (
                    <div key={c.id} className={`flex flex-wrap items-center gap-2 border-t border-gray-100 py-1 ${c.legacyWindow ? 'bg-amber-50' : ''}`}>
                      <span className="font-mono">{c.id}</span>
                      <span>尾号 {c.phoneTail ?? '—'}</span>
                      <span>{c.operator ?? '—'}</span>
                      <span className={c.overCap ? 'text-red-600' : ''}>{usd4(c.priceMicro)}</span>
                      <span>{t(c.createdAt)}</span>
                      {c.strict ? <span className="text-green-700">时间窗 + 运营商 + 价格都对得上</span> : c.inWindow ? <span className="text-amber-700">只有时间窗对得上</span> : <span className="text-gray-400">时间窗外</span>}
                      {c.legacyWindow && <span className="font-medium text-amber-800">旧链路窗口内：可能是旧单品的号，别给错人</span>}
                      {c.blocked === 'OVER_CAP' && <span className="text-red-600">价格未知或高于本次上限 max(cap, $0.0067)：不可能是这次买到的</span>}
                      {c.blocked === 'OPERATOR' && <span className="text-red-600">运营商与这次取号指定的不同：不可能是这次买到的</span>}
                      <button
                        className="ml-auto text-primary-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-300 disabled:no-underline"
                        disabled={!!c.blocked}
                        onClick={() => void run('claim', { attemptId: claim.attemptId, activationId: c.id }, `把上游激活 ${c.id}（尾号 ${c.phoneTail ?? '—'}）认领给这一单？订单在等这个号时号码会显示给买家；订单已收码 / 在退款 / 冻结起因是别的时，只结束「结果未知」、号码按规则释放。`)}
                      >
                        认领
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {d.complaint && (
              <section className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                <b>售后申请</b>（{d.complaint.state === 'OPEN' ? '待处理' : d.complaint.state === 'APPROVING' ? '退款中' : d.complaint.state === 'REFUNDED' ? '已通过' : '已驳回'}，{t(d.complaint.createdAt)}）：{d.complaint.reasonText} · {d.complaint.detail ?? '（未填写说明）'}
                {d.complaint.adminNote && <div>回复 / 备注：{d.complaint.adminNote}</div>}
                <a href={`/admin/jiema?tab=complaints&id=${d.complaint.id}`} className="ml-2 text-primary-600 hover:underline">
                  到「售后」处理 →
                </a>
              </section>
            )}

            <section>
              <h3 className="mb-1 font-medium text-gray-900">下单快照</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 sm:grid-cols-3">
                <span>报价成本 {usd4(d.so.costMicro)}</span>
                <span>cap {usd4(d.so.capMicro)}</span>
                <span>售价 {yuan(d.so.priceCents)}</span>
                <span>售价系数 x {coef(d.so.saleCoef4)}</span>
                <span>成本汇率 {coef(d.so.costFx4)}</span>
                <span>加价 {yuan(d.so.markupCents)}</span>
                <span>覆盖规则 {d.so.ruleKey ?? '—'}</span>
                <span>配置版本 {d.so.configVersion}</span>
                <span>锁价到期 {t(d.so.quoteExpiresAt)}</span>
                <span>换号 {d.so.replaceCount} / {d.so.maxReplace} + 加赠 {d.so.replaceBonus}</span>
                <span>取号次数上限 {d.so.acquireTries}</span>
                <span>例外时长已验证 {d.so.longWaitOk ? '是' : '否'}</span>
                <span>条款 {d.so.termsVersion} / {d.so.walletTermsVersion ?? '—'}</span>
              </div>
              {/* 付款前弹窗的同意留痕（TERMS_AGREED 事件，§8.6）：条款版本、同意时间、IP、UA 摘要；2026-09-30 之前的单只有上面的版本号 */}
              <div className="mt-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600">
                <b className="text-gray-800">条款同意</b>{' '}
                {d.consent ? (
                  <>
                    《短信接码服务条款》{d.consent.terms} · 《余额与充值规则》{d.consent.walletTerms || '—'} · 同意于 {t(d.consent.at)} · IP {d.consent.ip ?? '—'}
                    <div className="break-all text-gray-500">UA {d.consent.ua ?? '—'}</div>
                  </>
                ) : (
                  <span className="text-gray-400">没有同意留痕（付款前免责弹窗上线之前的订单，只有上面的条款版本号）</span>
                )}
              </div>
            </section>

            <section>
              <h3 className="mb-1 font-medium text-gray-900">资金</h3>
              <div>
                付款方式 {d.so.payMode} · 余额 {yuan(d.so.balanceCents)} · 支付宝应付 {yuan(d.so.alipayCents)} · 实收 {yuan(d.so.alipayPaidCents)} · 付款 {t(d.so.paidAt)}
              </div>
              {d.hold ? (
                <div>
                  预扣 <b>{d.hold.state}</b>（充值格 {yuan(d.hold.topupCents)} · 返现格 {yuan(d.hold.cashCents)}）· HELD {t(d.hold.heldAt)}
                  {d.hold.capturedAt && ` → CAPTURED ${t(d.hold.capturedAt)}`}
                  {d.hold.releasedAt && ` → RELEASED ${t(d.hold.releasedAt)}`}
                  {d.hold.refundedAt && ` → REFUNDED ${t(d.hold.refundedAt)}`}
                  {d.hold.reason && `（${d.hold.reason}）`}
                </div>
              ) : (
                <div className="text-gray-400">没有预扣（纯支付宝）</div>
              )}
              {d.so.refundState === 'DONE' && (
                <div>
                  已退回余额：充值格 {yuan(d.so.refundTopupCents)} · 返现格 {yuan(d.so.refundCashCents)}（{d.so.refundReason}，{t(d.so.refundedAt)}）
                </div>
              )}
              <div className="mt-1 text-xs text-gray-500">支付流水：{d.payments.length ? d.payments.map((p: any) => `${p.payMethod} ¥${p.amount}${p.tradeNo ? `（${p.tradeNo}）` : ''}`).join(' · ') : '—'}</div>
              <div className="text-xs text-gray-500">
                收款单：
                {d.vmqs.length
                  ? d.vmqs.map((v: any) => (
                      <a key={v.id} href={`/admin/vmq?q=${encodeURIComponent(v.orderId)}`} className="mr-2 text-primary-600 hover:underline">
                        {v.orderId} ¥{v.reallyPrice} state={v.state}
                      </a>
                    ))
                  : '—'}
              </div>
              <div className="text-xs text-gray-500">
                余额流水：
                {d.logs.length
                  ? d.logs.map((l: any) => (
                      <span key={l.id} className="mr-2">
                        {l.type} 充值格 {yuan(l.topupDeltaCents)} · 返现格 {yuan(l.cashDeltaCents)}（{l.bizKey}）
                      </span>
                    ))
                  : '—'}
              </div>
            </section>

            <section>
              <h3 className="mb-1 font-medium text-gray-900">成本利润</h3>
              <div>
                已存：实际扣费 {usd4(d.so.chargedMicro)} · 真实成本 {yuan(d.so.costCents)} · 利润 {yuan(d.so.profitCents)} · {d.so.costFinal ? `已定稿（${t(d.so.costAt)}）` : '预估 / 未核算'}
                {d.so.lossCents ? ` · 亏损 ${yuan(d.so.lossCents)}` : ''}
                {d.so.state === 'CANCELLED' && '（已取消：不计成本利润）'}
              </div>
              <div className="text-xs text-gray-500">
                按快照重算预览：扣费 {usd4(d.cost.preview.chargedMicro)} · 成本 {yuan(d.cost.preview.costCents)} · 利润 {yuan(d.cost.preview.profitCents)} · 亏损 {yuan(d.cost.preview.lossCents)} · {d.cost.preview.costFinal ? '可定稿' : '还有号码未终态'}
              </div>
              <div className="text-xs text-gray-500">扣费的号：{d.cost.charged.length ? d.cost.charged.map((c: any) => `第 ${c.seq} 个 ${usd4(c.costMicro)}（${c.chargeSource ?? '—'}）${c.upstreamRefundMicro ? ` 冲回 ${usd4(c.upstreamRefundMicro)}` : ''}`).join(' · ') : '—'}</div>
            </section>

            <section>
              <h3 className="mb-1 font-medium text-gray-900">尝试时间线</h3>
              <div className="space-y-1.5">
                {d.attempts.map((a: any) => (
                  <details key={a.id} className="rounded border border-gray-200 px-2 py-1">
                    <summary className="cursor-pointer text-xs">
                      #{a.id} 第 {a.seq} 次（{a.reason}）<b>{a.state}</b> · 激活 {a.activationId ?? '—'} · 号码 {a.phone ?? '—'} · 成本 {usd4(a.costMicro)}（上限 {usd4(a.maxPriceMicro)}）
                      {a.charged ? ` · 已扣费 ${a.chargeSource ?? ''}` : ''} · 错误码 {a.errorCode ?? '—'}
                    </summary>
                    <div className="mt-1 grid grid-cols-2 gap-x-3 text-[11px] text-gray-500">
                      <span>请求 {t(a.requestedAt)}</span>
                      <span>响应 {t(a.respondedAt)}</span>
                      <span>可取消 {t(a.canCancelAt)}</span>
                      <span>到期 {t(a.endsAt)}</span>
                      <span>主动结束 {t(a.waitUntil)}</span>
                      <span>收码 {t(a.codeAt)}</span>
                      <span>结束 {t(a.closedAt)}</span>
                      <span>能再收码 {a.canGetAnotherSms == null ? '—' : a.canGetAnotherSms ? '是' : '否'}</span>
                      <span>运营商 {a.operator ?? '任意'} → {a.operatorActual ?? '—'}</span>
                      <span>短信 {a.smsCount} 条 · 放号重试 {a.releaseTries}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-gray-500">上游原文（已脱敏，截断 2000）：</div>
                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded bg-gray-50 p-2 text-[11px]">{a.raw ?? '—'}</pre>
                  </details>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-1 font-medium text-gray-900">短信（{d.messages.length}）</h3>
              {d.messages.map((m: any) => (
                <div key={m.id} className="border-t border-gray-100 py-1 text-xs">
                  <b className="font-mono">{m.code ?? '—'}</b> {m.text ?? (m.purgedAt ? '（已按保存期清除）' : '')} <span className="text-gray-400">· {m.sender ?? '—'} · {t(m.receivedAt)} · 尝试 #{m.attemptId}</span>
                </div>
              ))}
            </section>

            <section>
              <h3 className="mb-1 flex items-center gap-2 font-medium text-gray-900">
                订单留言
                {!chatOpen && d.order?.id && (
                  <button onClick={() => setChatOpen(true)} className="text-xs font-normal text-primary-600 hover:underline">
                    展开
                  </button>
                )}
              </h3>
              {/* 按需挂载：留言面板一挂载就把自己滚到最底，放在抽屉里会把整个抽屉带到底部 */}
              {chatOpen && d.order?.id ? <OrderChat apiBase={`/api/admin/orders/${d.order.id}/messages`} selfRole="ADMIN" theme="light" /> : !d.order?.id ? <div className="text-gray-400">—</div> : null}
            </section>

            <section>
              <h3 className="mb-1 font-medium text-gray-900">事件流水（最近 300 条）</h3>
              <div className="max-h-72 overflow-y-auto text-[11px]">
                {d.events.map((e: any) => (
                  <div key={e.id} className="border-t border-gray-100 py-0.5">
                    <span className="text-gray-400">{t(e.createdAt)}</span> <b>{e.type}</b> {e.actor}
                    {e.actorId ? `#${e.actorId}` : ''} {e.attemptId ? `尝试 #${e.attemptId}` : ''} <span className="break-all text-gray-500">{e.detail ?? ''}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
