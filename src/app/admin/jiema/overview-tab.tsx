'use client'

/**
 * 短信接码后台 ·「概览」（docs/短信接码-设计.md §7.1 的 S2 部分）。数据来自 GET /api/admin/jiema/overview 的 s2（adminGuard）。
 *
 * 【上游余额一行】余额 · 告警线 $2（不停售，Q4）· 在途占用（口径A / 口径B 取大 + 未取号订单 C，§3.2，与 E26 判定逐字相同）· 可售余量 ·
 * 今日因上游余额不足拒单次数（进程内计数，重启清零）。余额「未知」时写「余额未知（正在重试），新单暂不可购买」。
 * 【钱的口径】营收 / 真实成本 / 毛利一律 Σ 逐单（report.summarizeFinance），页面不出现「扣费 × 汇率」的乘号；已取消单只计单数、退回金额与亏损。
 */
import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'

export interface OverviewS2 {
  upstream: {
    balanceMicro: number | null
    balanceAt: string | null
    unknown: boolean
    alertLineUsd: number
    inflight: { aMicro: number; bMicro: number; cMicro: number; totalMicro: number } | null
    sellableMicro: number | null
    insufficientRejectsToday: number
    stats: { at: string; total: number; success: number; worst: { key: string; count: number; success: number } | null } | null
  }
  heartbeat: { tickAt: string | null; stale: boolean }
  breaker: { open: boolean }
  threads: { note: string | null; until: string | null } | null
  today: {
    created: number
    paid: Record<string, number>
    received: number
    inProgress: number
    cancelledReasons: Record<string, number>
    closed: number
    releasedCents: number
    avgCodeSec: number | null
    avgReplace: number | null
    finance: {
      finalized: number
      revenueCents: number
      chargedMicro: number
      costCents: number
      refundOffsetCents: number
      profitCents: number
      cancelled: { count: number; topupCents: number; cashCents: number }
      lossCents: number
      estimating: number
    }
  }
  attention: { manual: Array<{ id: number; orderNo: string | null; notice: string | null; manualAt: string | null }>; latepayOpen: number; complaintsOpen?: number }
  combos: Array<{
    service: string
    country: number
    serviceName: string
    countryName: string
    orders: number
    numbers: number
    received: number
    ratePct: number | null
    cancelled: number
    avgCodeSec: number | null
    revenueCents: number
    costCents: number
    profitCents: number
  }>
}

/** S4：未关联激活快照（jiema-tick 每 10 分钟）与最近一次每日对账的摘要（overview 接口的 s4） */
export interface OverviewS4 {
  unlinked: { at: string; ok: boolean; reason: string | null; total: number; externalCount: number; legacyCount: number } | null
  recon: { at: string; ok: boolean; failed: string[]; lossOrders: number; upstreamOk: boolean } | null
}

const usd = (m: number | null | undefined) => (m == null ? '—' : `$${(m / 1e6).toFixed(2)}`)
const usd4 = (m: number | null | undefined) => (m == null ? '—' : `$${(m / 1e6).toFixed(4)}`)
const yuan = (c: number | null | undefined) => (c == null ? '—' : `${c < 0 ? '-' : ''}¥${(Math.abs(c) / 100).toFixed(2)}`)
const dur = (s: number | null) => (s == null ? '—' : s >= 60 ? `${Math.floor(s / 60)} 分 ${s % 60} 秒` : `${s} 秒`)
function ago(iso: string | null): string {
  if (!iso) return '从未'
  const s = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000))
  if (s < 60) return `${s} 秒前`
  if (s < 3600) return `${Math.floor(s / 60)} 分钟前`
  return `${Math.floor(s / 3600)} 小时前`
}

const REASON_TEXT: Record<string, string> = {
  EXPIRED: '到期',
  BUYER_CANCEL: '买家取消',
  ACQUIRE_FAILED: '取号失败',
  PRICE_UP: '涨价',
  SERVICE_NA: '服务不可用',
  COMBO_NA: '组合不可用',
  LATE_START_REFUND: '迟到付款选择退回',
  HOLD: '停售',
  MAINTENANCE: '维护',
  UPSTREAM_ENDED: '上游先结束',
  ADMIN_CANCEL: '客服取消',
  OTHER: '其他',
}

export function OverviewTab({
  s2,
  s4,
  s2Error,
  holds,
  onOpenOrder,
  onUnhold,
  onOpenComplaints,
  onOpenReconcile,
}: {
  s2: OverviewS2 | null
  /** S4：未关联激活与对账摘要（读失败为 null） */
  s4?: OverviewS4 | null
  s2Error: string | null
  holds: Array<{ key: string; until: string | null; source: string }>
  onOpenOrder: (id: number) => void
  onUnhold: (key: string) => void
  /** S3：「● N 条售后申请待处理 → 查看」跳到「售后」tab */
  onOpenComplaints?: () => void
  /** S4：「上游有 N 个不属于本站记录的进行中号码 → 查看」、对账不一致 → 跳到「对账」tab */
  onOpenReconcile?: () => void
}) {
  const csv = useMemo(() => {
    if (!s2) return ''
    const head = ['服务', '国家/地区', '单数', '号码数', '收码', '收码率%', '已取消', '平均到码秒', '营收', '真实成本', '毛利']
    const rows = s2.combos.map((c) => [`${c.serviceName}(${c.service})`, `${c.countryName}(${c.country})`, c.orders, c.numbers, c.received, c.ratePct ?? '', c.cancelled, c.avgCodeSec ?? '', (c.revenueCents / 100).toFixed(2), (c.costCents / 100).toFixed(2), (c.profitCents / 100).toFixed(2)])
    return [head, ...rows].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n')
  }, [s2])
  if (!s2) return <Card><CardContent className="py-6 text-sm text-red-600">{s2Error ? `概览读取失败：${s2Error}` : '加载中...'}</CardContent></Card>
  const u = s2.upstream
  const f = s2.today.finance
  const paid = s2.today.paid
  const paidTotal = Object.values(paid).reduce((a, b) => a + b, 0)
  const low = u.balanceMicro != null && u.balanceMicro < u.alertLineUsd * 1e6
  const unlinkedN = s4?.unlinked ? s4.unlinked.externalCount + s4.unlinked.legacyCount : 0
  const reconBad = !!s4?.recon && !s4.recon.ok
  const exportCsv = () => {
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `jiema-combos-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-1.5 py-4 text-sm text-gray-700">
          <div>
            推进心跳 {ago(s2.heartbeat.tickAt)} {s2.heartbeat.stale ? <span className="font-medium text-red-600">✗ 超过 3 分钟没有心跳（核对 cron 里的 jiema-tick）</span> : <span className="text-green-700">✓</span>}
            <span className="ml-3">熔断：{s2.breaker.open ? <span className="font-medium text-red-600">开（新单停售）</span> : '关'}</span>
            <span className="ml-3">线程：{s2.threads ? <span className="text-amber-700">受限（{s2.threads.note ?? ''}，至 {s2.threads.until ? new Date(s2.threads.until).toLocaleString('zh-CN', { hour12: false }) : '—'}，换号暂停）</span> : '未受限'}</span>
          </div>
          <div>
            {u.unknown || u.balanceMicro == null ? (
              <span className="font-medium text-red-600">上游余额未知（正在重试），新单暂不可购买</span>
            ) : (
              <>
                上游余额 <b className={low ? 'text-red-600' : ''}>{usd(u.balanceMicro)}</b>
                <span className="text-gray-500">（告警线 ${u.alertLineUsd}，不停售{low ? ' · 已低于告警线，请尽快充值' : ''}）</span>
                <span className="ml-2 text-xs text-gray-400">读数 {ago(u.balanceAt)}</span>
              </>
            )}
            <span className="ml-3">今日定稿扣费 {usd4(f.chargedMicro)}</span>
          </div>
          {u.inflight && (
            <div>
              在途占用 <b>{usd4(u.inflight.totalMicro)}</b>
              <span className="text-gray-500">
                （口径A {usd4(u.inflight.aMicro)} / 口径B {usd4(u.inflight.bMicro)} 取大 + 未取号订单 {usd4(u.inflight.cMicro)}）
              </span>
              · 可售余量 <b>{usd4(u.sellableMicro)}</b> · 今日因上游余额不足拒单 <b>{u.insufficientRejectsToday}</b> 次
              <span className="text-xs text-gray-400">（自进程启动，E26）</span>
            </div>
          )}
          <div>
            上游口径成功率（/activations/stats，今天 + 昨天，含旧单品）：
            {u.stats ? (
              <>
                账户 {u.stats.total ? Math.round((u.stats.success / u.stats.total) * 100) : 0}%（{u.stats.success}/{u.stats.total}）
                {u.stats.worst && (
                  <> · 最差组合 {u.stats.worst.key} {Math.round((u.stats.worst.success / u.stats.worst.count) * 100)}%（{u.stats.worst.count} 个）</>
                )}
                <span className="ml-1 text-xs text-gray-400">{ago(u.stats.at)}</span>
              </>
            ) : (
              <span className="text-gray-400">进程启动后还没拉到（每 10 分钟一次）</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-1.5 py-4 text-sm text-gray-700">
          <div className="font-medium text-gray-900">今日（北京时间）</div>
          <div>
            下单 {s2.today.created} · 付款 {paidTotal}（支付宝 {paid.ALIPAY ?? 0} · 余额付清 {paid.BALANCE ?? 0} · 组合 {paid.MIXED ?? 0}）· 收码 {s2.today.received} · 进行中 {s2.today.inProgress}
          </div>
          <div>
            已取消 {f.cancelled.count} 单
            {f.cancelled.count > 0 && (
              <>（{Object.entries(s2.today.cancelledReasons).map(([k, n]) => `${REASON_TEXT[k] ?? k} ${n}`).join(' · ')}）</>
            )}
            ：退回余额 {yuan(f.cancelled.topupCents + f.cancelled.cashCents)}（充值格 {yuan(f.cancelled.topupCents)} · 返现格 {yuan(f.cancelled.cashCents)}），不计成本利润
          </div>
          <div>
            未付款关闭 {s2.today.closed} 单：预扣退回 {yuan(s2.today.releasedCents)}
          </div>
          <div>
            营收 <b>{yuan(f.revenueCents)}</b>（定稿 {f.finalized} 单）· 实际扣费 {usd4(f.chargedMicro)} · 真实成本 <b>{yuan(f.costCents)}</b>
            <span className="text-xs text-gray-400">（逐单按下单时的成本汇率向上取整）</span>
            {f.refundOffsetCents > 0 && <> · 售后冲减 −{yuan(f.refundOffsetCents)}</>} · 毛利 <b className={f.profitCents >= 0 ? 'text-green-700' : 'text-red-600'}>{yuan(f.profitCents)}</b>
          </div>
          <div>
            预估中 {f.estimating} 单 · 平均到码 {dur(s2.today.avgCodeSec)} · 平均换号 {s2.today.avgReplace ?? '—'} 次 · 亏损（已取消单事后扣费）<b className={f.lossCents > 0 ? 'text-red-600' : ''}>{yuan(f.lossCents)}</b>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-1.5 py-4 text-sm text-gray-700">
          <div className="font-medium text-gray-900">需要处理</div>
          {s2.attention.manual.length === 0 && s2.attention.latepayOpen === 0 && !s2.attention.complaintsOpen && !unlinkedN && !reconBad && <div className="text-gray-400">暂无</div>}
          {!!s2.attention.complaintsOpen && (
            <div className="font-medium text-red-700">
              ● {s2.attention.complaintsOpen} 条售后申请待处理
              <button onClick={() => onOpenComplaints?.()} className="ml-2 text-primary-600 hover:underline">
                查看 →
              </button>
            </div>
          )}
          {s2.attention.manual.map((m) => (
            <div key={m.id} className="text-amber-800">
              ⚠ MANUAL · 订单 {m.orderNo ?? `#${m.id}`} · {m.notice ?? '—'}
              <button onClick={() => onOpenOrder(m.id)} className="ml-2 text-primary-600 hover:underline">
                查看 →
              </button>
            </div>
          ))}
          {s2.attention.latepayOpen > 0 && (
            <div className="text-amber-800">
              ⚠ {s2.attention.latepayOpen} 条待核实到账可退入买家余额（接码 / 充值单关闭后才付款）
              <a href="/admin/vmq" className="ml-2 text-primary-600 hover:underline">
                去处理 →
              </a>
            </div>
          )}
          {!!unlinkedN && s4?.unlinked && (
            <div className="text-amber-800">
              ⚠ 上游有 {unlinkedN} 个不属于本站记录的进行中号码（外部激活 {s4.unlinked.externalCount} · 旧链路遗留 {s4.unlinked.legacyCount}，不会自动处理）
              <button onClick={() => onOpenReconcile?.()} className="ml-2 text-primary-600 hover:underline">
                查看 →
              </button>
            </div>
          )}
          {reconBad && s4?.recon && (
            <div className="text-amber-800">
              ⚠ 最近一次对账（{new Date(s4.recon.at).toLocaleString('zh-CN', { hour12: false })}）{s4.recon.failed.length ? `${s4.recon.failed.length} 项不一致（${s4.recon.failed.join('、')}）` : ''}
              {!s4.recon.upstreamOk && '，上游 history 没拉到'}
              {s4.recon.lossOrders > 0 && `，${s4.recon.lossOrders} 张已取消单事后被扣费（只记亏损）`}
              <button onClick={() => onOpenReconcile?.()} className="ml-2 text-primary-600 hover:underline">
                查看 →
              </button>
            </div>
          )}
          <div className="text-xs text-gray-400">
            未关联激活：{s4?.unlinked ? `${ago(s4.unlinked.at)}扫描${s4.unlinked.ok ? '' : `（${s4.unlinked.reason ?? '没拉全，沿用上一次'}）`}，上游进行中 ${s4.unlinked.total} 个` : '进程启动后还没扫描（jiema-tick 每 10 分钟）'} · 对账：
            {s4?.recon ? `${ago(s4.recon.at)}${s4.recon.ok ? ' ✓' : ' ✗'}` : '还没有（每天 03:20）'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-1.5 py-4 text-sm text-gray-700">
          <div className="font-medium text-gray-900">停售规则（生效中）</div>
          {holds.length === 0 ? (
            <div className="text-gray-400">没有生效中的停售（手动停售在「目录 → 停售」里加）</div>
          ) : (
            holds.map((h) => (
              <div key={h.key} className="flex flex-wrap items-center gap-2">
                <span className="font-mono">{h.key}</span>
                <span className="text-xs text-gray-500">{h.source === 'ADMIN' ? '手动' : h.source === 'UPSTREAM' ? '上游' : '自动'}</span>
                <span className="text-xs text-gray-500">至 {h.until ? new Date(h.until).toLocaleString('zh-CN', { hour12: false }) : '手动解除'}</span>
                <button onClick={() => onUnhold(h.key)} className="text-xs text-primary-600 hover:underline">
                  解除
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 text-sm text-gray-700">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-medium text-gray-900">组合成功率与毛利（近 7 天，≥5 单）</span>
            <button onClick={exportCsv} disabled={!s2.combos.length} className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-40">
              导出 CSV
            </button>
          </div>
          {s2.combos.length === 0 ? (
            <div className="text-gray-400">近 7 天还没有 ≥5 单的组合</div>
          ) : (
            <div className="w-full overflow-x-auto [contain:inline-size]">
              <table className="w-full min-w-[760px] text-xs">
                <thead className="text-left text-gray-500">
                  <tr>
                    {['服务', '国家/地区', '单数', '号码数', '收码', '收码率', '已取消', '平均到码', '营收', '真实成本', '毛利'].map((h) => (
                      <th key={h} className="py-1.5 pr-3 font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s2.combos.map((c) => (
                    <tr key={`${c.service}:${c.country}`} className="border-t border-gray-100">
                      <td className="py-1.5 pr-3">{c.serviceName}</td>
                      <td className="py-1.5 pr-3">{c.countryName}</td>
                      <td className="py-1.5 pr-3">{c.orders}</td>
                      <td className="py-1.5 pr-3">{c.numbers}</td>
                      <td className="py-1.5 pr-3">{c.received}</td>
                      <td className={`py-1.5 pr-3 ${c.ratePct != null && c.ratePct < 20 ? 'text-red-600' : ''}`}>{c.ratePct == null ? '—' : `${c.ratePct}%`}</td>
                      <td className="py-1.5 pr-3">{c.cancelled}</td>
                      <td className="py-1.5 pr-3">{dur(c.avgCodeSec)}</td>
                      <td className="py-1.5 pr-3">{yuan(c.revenueCents)}</td>
                      <td className="py-1.5 pr-3">{yuan(c.costCents)}</td>
                      <td className={`py-1.5 pr-3 ${c.profitCents < 0 ? 'text-red-600' : 'text-green-700'}`}>{yuan(c.profitCents)}</td>
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
