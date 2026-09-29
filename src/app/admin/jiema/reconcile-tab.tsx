'use client'

/**
 * 短信接码后台 ·「对账」（docs/短信接码-设计.md §9.4、§7.1「未关联激活」、§7.7 日报、§10.3；S4）。
 * 数据来自 GET /api/admin/jiema/reconcile（adminGuard）：最近一次 jiema-reconcile 报告（I1–I8、R0–R6、修正、按天汇总、知会）、
 * jiema-tick 每 10 分钟的未关联激活快照、昨天的日报（待推 / 已推）。「立即对账」= POST（与 cron 同一个函数，不生成日报，写审计）。
 * 页面只展示，不提供任何取消激活、改账的按钮（附录 B 第 5、14 条）。
 */
import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ReconItem {
  code: string
  title: string
  ok: boolean
  count: number
  samples: string[]
  note?: string
}
interface R5Day {
  day: string
  upstreamMicro: number
  oursMicro: number
  rows: number
  expiredKeptMicro: number
  legacyMicro: number
  legacyRows: number
  externalMicro: number
  externalRows: number
  ok: boolean
}
interface UnlinkedLite {
  id: string
  service: string | null
  country: number | null
  createdAt: string | null
  status?: number | null
  costMicro?: number | null
  priceMicro?: number | null
  phoneTail?: string | null
  kind: 'LEGACY' | 'EXTERNAL'
  pendingClaim?: boolean
}
interface Report {
  at: string
  full: boolean
  sinceHours: number
  window: { from: string; to: string }
  orders: number
  items: ReconItem[]
  fixes: { r1: number; r6: number; r2Cleared: number; i8: number; race: number; lossOrders: Array<{ smsOrderId: number; orderNo: string | null; lossCents: number | null }>; lossOrdersTotal?: number }
  upstream: { ok: boolean; skipped?: boolean; reason?: string; rows: number; currency?: boolean }
  r5: R5Day[]
  unlinked: { external: UnlinkedLite[]; legacy: UnlinkedLite[]; externalCount: number; legacyCount: number }
  notices: string[]
  ok: boolean
  /** 整趟执行失败的原因 */
  error?: string
  /** 存盘时瘦身过（例子、清单只留了一部分；计数照旧） */
  truncated?: number
}
interface Snapshot {
  at: string
  ok: boolean
  reason?: string
  total: number
  external: UnlinkedLite[]
  legacy: UnlinkedLite[]
  externalCount: number
  legacyCount: number
}
interface Daily {
  day: string
  lines: string[]
  createdAt: string
  sentAt: string | null
  skipped?: string | null
}

const usd4 = (m: number | null | undefined) => (m == null ? '—' : `$${(m / 1e6).toFixed(4)}`)
const yuan = (c: number | null | undefined) => (c == null ? '—' : `¥${(c / 100).toFixed(2)}`)
const when = (s: string | null | undefined) => (s ? new Date(s).toLocaleString('zh-CN', { hour12: false }) : '—')

function UnlinkedTable({ rows, live }: { rows: UnlinkedLite[]; live?: boolean }) {
  if (!rows.length) return <div className="text-xs text-gray-400">没有</div>
  return (
    <div className="w-full overflow-x-auto [contain:inline-size]">
      <table className="w-full min-w-[520px] text-xs">
        <thead className="text-left text-gray-500">
          <tr>
            {['激活', '服务 · 国家', '创建时间', live ? '价格' : '状态 · 标价', live ? '号码尾号' : '', ''].map((h, i) => (
              <th key={i} className="py-1 pr-3 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-gray-100">
              <td className="py-1 pr-3 font-mono">{r.id}</td>
              <td className="py-1 pr-3">
                {r.service ?? '?'} · {r.country ?? '?'}
              </td>
              <td className="py-1 pr-3">{when(r.createdAt)}</td>
              <td className="py-1 pr-3">{live ? usd4(r.priceMicro) : `${r.status ?? '?'} · ${usd4(r.costMicro)}`}</td>
              <td className="py-1 pr-3">{live ? (r.phoneTail ?? '—') : ''}</td>
              <td className="py-1 pr-3 text-amber-700">{r.pendingClaim ? '可能正等着被认领（同组合有结果未知的取号）' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ReconcileTab() {
  const [data, setData] = useState<{ report: Report | null; unlinked: Snapshot | null; daily: Daily | null } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const load = useCallback(async () => {
    setErr(null)
    try {
      const res = await fetch('/api/admin/jiema/reconcile', { cache: 'no-store' })
      const d = await res.json().catch(() => null)
      if (d?.success) setData(d.data)
      else setErr(d?.error || `加载失败（HTTP ${res.status}）`)
    } catch {
      setErr('网络异常，加载失败')
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])
  const run = async (full: boolean) => {
    if (!window.confirm(full ? '全量核对 I 系列（全部历史接码单）并对上游近 48 小时的 history？' : '立即对账（近 48 小时）？R 系列会以上游为准修正扣费事实并重跑成本核算。')) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/jiema/reconcile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full }) })
      const d = await res.json().catch(() => null)
      if (!d?.success) window.alert(d?.error || `对账失败（HTTP ${res.status}）`)
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (err) return <Card><CardContent className="py-6 text-sm text-red-600">{err}</CardContent></Card>
  if (!data) return <Card><CardContent className="py-6 text-sm text-gray-400">加载中...</CardContent></Card>
  const r = data.report
  const snap = data.unlinked
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-2 py-4 text-sm text-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              {r ? (
                <>
                  最近一次对账 {when(r.at)}{' '}
                  {r.error ? (
                    <span className="font-medium text-red-600">✗ 执行失败</span>
                  ) : r.ok ? (
                    <span className="text-green-700">✓ 全部一致</span>
                  ) : (
                    <span className="font-medium text-red-600">✗ {r.items.filter((i) => !i.ok).length} 项不一致</span>
                  )}
                  <span className="ml-2 text-xs text-gray-400">
                    覆盖近 {r.sinceHours} 小时{r.full ? '（I 系列全量）' : ''} · 核了 {r.orders} 张接码单 · 上游 history {r.upstream.skipped ? '没拉' : r.upstream.ok ? `${r.upstream.rows} 行` : '拉取失败'}
                  </span>
                </>
              ) : (
                <span className="text-gray-400">还没有对账报告（cron 每天 03:20 跑一次，或点右边立即对账）</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void run(false)}>
                {busy ? '对账中...' : '立即对账'}
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void run(true)}>
                全量核 I 系列
              </Button>
            </div>
          </div>
          {r && (
            <div className="text-xs text-gray-500">
              以上游为准的修正：R1 {r.fixes.r1} 条 · R6 冲回 {r.fixes.r6} 条 · 推定结果（assumed）已核实 {r.fixes.r2Cleared} 条 · I8 补算 {r.fixes.i8} 张
              {r.fixes.race > 0 && <> · {r.fixes.race} 条对账时状态刚变、下一次再核</>}
              <span className="ml-1">（只改扣费事实并重跑成本核算，不改订单状态、不动余额；已取消单只记亏损）</span>
            </div>
          )}
          {r && r.fixes.lossOrders.length > 0 && (
            <div className="text-xs text-red-700">
              已取消单事后被扣费（只记亏损，订单仍是已取消）：{r.fixes.lossOrders.map((x) => `${x.orderNo ?? `#${x.smsOrderId}`} ${yuan(x.lossCents)}`).join('、')}
              {(r.fixes.lossOrdersTotal ?? 0) > r.fixes.lossOrders.length && <> 等共 {r.fixes.lossOrdersTotal} 张</>}
            </div>
          )}
          {r && r.error && <div className="text-xs text-red-600">执行失败：{r.error}</div>}
          {r && r.upstream.reason && <div className="text-xs text-red-600">上游：{r.upstream.reason}</div>}
          {r && !!r.truncated && <div className="text-xs text-amber-700">这份报告太大，存盘时只保留了部分例子与清单（各项计数照旧）；完整的不一致见接码单时间线与推送。</div>}
        </CardContent>
      </Card>

      {r && (
        <Card>
          <CardContent className="py-4 text-sm text-gray-700">
            <div className="mb-2 font-medium text-gray-900">I 系列（本站数据自洽）与 R 系列（与上游 history 对账）</div>
            <div className="space-y-1.5">
              {r.items.map((i) => (
                <div key={i.code} className="border-t border-gray-100 pt-1.5">
                  <div className="flex flex-wrap items-start gap-2">
                    <span className="w-8 shrink-0 font-mono text-xs text-gray-500">{i.code}</span>
                    <span className={i.ok ? 'text-green-700' : 'font-medium text-red-600'}>{i.ok ? '✓' : `✗ ${i.count}`}</span>
                    <span className="min-w-0 flex-1">{i.title}</span>
                    {i.samples.length > 0 && (
                      <button className="text-xs text-primary-600 hover:underline" onClick={() => setOpen((o) => ({ ...o, [i.code]: !o[i.code] }))}>
                        {open[i.code] ? '收起' : '明细'}
                      </button>
                    )}
                  </div>
                  {i.note && <div className="ml-10 text-xs text-gray-500">{i.note}</div>}
                  {open[i.code] && (
                    <ul className="ml-10 list-disc space-y-0.5 pl-4 text-xs text-gray-600">
                      {i.samples.map((s, k) => (
                        <li key={k} className="break-all">
                          {s}
                        </li>
                      ))}
                      {i.count > i.samples.length && <li className="list-none text-gray-400">…共 {i.count} 处，只列前 {i.samples.length} 处</li>}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {r && r.r5.length > 0 && (
        <Card>
          <CardContent className="py-4 text-sm text-gray-700">
            <div className="mb-2 font-medium text-gray-900">按天汇总（R5，北京时间；上游实扣只认状态 6 或收过码的行）</div>
            <div className="w-full overflow-x-auto [contain:inline-size]">
              <table className="w-full min-w-[640px] text-xs">
                <thead className="text-left text-gray-500">
                  <tr>
                    {['日期', '新链路上游实扣', '我方扣费', '号码数', '旧链路（只列出）', '外部激活（只列出）', 'EXPIRED（以我方为准）', ''].map((h) => (
                      <th key={h} className="py-1 pr-3 font-normal">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.r5.map((d) => (
                    <tr key={d.day} className="border-t border-gray-100">
                      <td className="py-1 pr-3">{d.day}</td>
                      <td className="py-1 pr-3">{usd4(d.upstreamMicro)}</td>
                      <td className="py-1 pr-3">{usd4(d.oursMicro)}</td>
                      <td className="py-1 pr-3">{d.rows}</td>
                      <td className="py-1 pr-3">
                        {usd4(d.legacyMicro)}（{d.legacyRows}）
                      </td>
                      <td className="py-1 pr-3">
                        {usd4(d.externalMicro)}（{d.externalRows}）
                      </td>
                      <td className="py-1 pr-3">{usd4(d.expiredKeptMicro)}</td>
                      <td className={`py-1 pr-3 ${d.ok ? 'text-green-700' : 'text-red-600'}`}>{d.ok ? '✓' : '✗'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-2 py-4 text-sm text-gray-700">
          <div className="font-medium text-gray-900">上游有、本站不认识的激活（都不会自动取消）</div>
          <div className="text-xs text-gray-500">
            「本站认识」= 接码尝试、旧单品 sms_activations、旧单品订单备注里换下的号码。旧单品会卖的服务、且在某张旧单品订单付款后 30 分钟内创建的算「旧链路遗留」（只列出）；
            其余算「外部激活」（站长在官网手动买的或孤儿号，推一次企业微信）。确认无用可到上游后台自行处理。
          </div>
          <div>
            进行中（jiema-tick 每 10 分钟）：
            {snap ? (
              <>
                {when(snap.at)} {snap.ok ? '' : <span className="text-amber-700">（{snap.reason ?? '这一次没拉全'}）</span>} · 上游进行中 {snap.total} 个 · 外部激活 <b>{snap.externalCount}</b> · 旧链路遗留 {snap.legacyCount}
              </>
            ) : (
              <span className="text-gray-400">进程启动后还没扫描</span>
            )}
          </div>
          {snap && snap.externalCount > 0 && <UnlinkedTable rows={snap.external} live />}
          {snap && snap.legacyCount > 0 && (
            <>
              <div className="text-xs text-gray-500">旧链路遗留（进行中）</div>
              <UnlinkedTable rows={snap.legacy} live />
            </>
          )}
          {r && (
            <>
              <div className="pt-1">
                已结束（最近一次对账的 history，R3）：外部激活 <b>{r.unlinked.externalCount}</b> · 旧链路遗留 {r.unlinked.legacyCount}
              </div>
              {r.unlinked.externalCount > 0 && <UnlinkedTable rows={r.unlinked.external} />}
              {r.unlinked.legacyCount > 0 && (
                <>
                  <div className="text-xs text-gray-500">旧链路遗留（已结束）</div>
                  <UnlinkedTable rows={r.unlinked.legacy} />
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-1.5 py-4 text-sm text-gray-700">
          <div className="font-medium text-gray-900">日报与知会</div>
          {data.daily ? (
            <>
              <div className="text-xs text-gray-500">
                {data.daily.day} 的日报 · 生成于 {when(data.daily.createdAt)} ·{' '}
                {data.daily.sentAt ? `已推送 ${when(data.daily.sentAt)}` : data.daily.skipped ? `过期未推（${when(data.daily.skipped)}）` : '待推送（北京 09:00 由 jiema-tick 推企业微信）'}
              </div>
              <pre className="whitespace-pre-wrap break-all rounded bg-gray-50 p-2 text-xs text-gray-700">{data.daily.lines.join('\n')}</pre>
            </>
          ) : (
            <div className="text-xs text-gray-400">还没有日报（cron 03:20 的对账顺带生成）</div>
          )}
          {r && r.notices.length > 0 && (
            <ul className="list-disc pl-5 text-xs text-amber-800">
              {r.notices.map((n, k) => (
                <li key={k}>知会：{n}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
