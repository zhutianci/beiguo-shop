'use client'

/**
 * /admin/tenants/reconcile：对账自检（设计 10.12）。逐项显示 L1–L13（钱类）、A1–A13（告警类）的通过 / 失败与失败样例（订单号 / 结算单号）。
 * 钱类失败默认置涉事渠道 payoutHold（与每日 03:00 的 cron 同口径）；只想看结果不想停打款时取消勾选。
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, Notice, api, fmtTime, useApi } from './common'

interface Item {
  code: string
  level: 'MONEY' | 'ALERT'
  ok: boolean
  count: number
  samples: string[]
}
interface Result {
  at: string
  tenantId: number | null
  applyHold: boolean
  items: Item[]
}

const DESC: Record<string, string> = {
  L1: '桶间转移每个事件各腿之和为 0',
  L2: '已付渠道单都有结算状态，且恰有一组计提',
  L3: '主站订单快照列全空、无分录',
  L4: '渠道单快照完整且在范围内',
  L5: '逐单逐成分金额与累计值一致（含手续费差额法）',
  L6: '成分所在桶与结算状态一致',
  L7: '发票分成有据可依、每单至多一次',
  L8: '结算单金额 = 纳入分录合计',
  L9: '已打款 ⇔ 恰有一条打款登记且金额守恒；退票不超额',
  L10: '每渠道至多一张未完结结算单；结算中 = 未完结单合计',
  L11: '已收税费的渠道单都计了发票分成',
  L12: '未付款的渠道单没有任何分录',
  L13: '订单状态与退款累计值一致',
  A1: '卡差价口径：单卡售价合计 = 进货款',
  A2: '上架中的商品都满足可售判定',
  A3: '超管不是渠道成员；营业中的渠道至少一位渠道主',
  A4: '渠道单的商品有同渠道上架行',
  A5: '解冻 cron 正常（交付超期仍冻结）',
  A6: '没有计提异常（MISSING）的订单',
  A7: '没有认领超过 24 小时的打款',
  A8: '发票分成冻结超过 30 天（票一直没开）',
  A9: '可结算为负',
  A10: '费率变更都有审计',
  A11: '渠道单都有客户关系',
  A12: '票据来源站与订单一致',
  A13: '发票分成状态与发票状态一致',
}

export default function ReconcileView() {
  const last = useApi<Result | null>('/api/admin/tenants/reconcile')
  const tenants = useApi<{ id: number; code: string; name: string }[]>('/api/admin/tenants')
  const [tenantId, setTenantId] = useState('')
  const [applyHold, setApplyHold] = useState(true)
  const [res, setRes] = useState<Result | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const run = async () => {
    setErr(null)
    setBusy(true)
    const r = await api<Result>('/api/admin/tenants/reconcile', { body: { ...(tenantId ? { tenantId: Number(tenantId) } : {}), applyHold } })
    setBusy(false)
    if (!r.success) return setErr(r.error)
    setRes(r.data)
  }
  const shown = res ?? last.data ?? null
  const failed = shown?.items.filter((i) => !i.ok) ?? []
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>对账自检</CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <select className="rounded-lg border border-gray-300 px-2 py-1.5" value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
              <option value="">全部渠道</option>
              {(tenants.data ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}（{t.code}）
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={applyHold} onChange={(e) => setApplyHold(e.target.checked)} />
              钱类失败时暂停该渠道打款
            </label>
            <Button onClick={run} loading={busy}>
              立即自检
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {err && <Notice kind="error">{err}</Notice>}
          {!shown ? (
            <div className="py-8 text-center text-gray-400">本进程还没有跑过自检（每日 03:00 的 cron 结果见平台群告警）</div>
          ) : (
            <>
              <div className="text-sm text-gray-500">
                {fmtTime(shown.at)} · {shown.tenantId ? `渠道 #${shown.tenantId}` : '全部渠道'} · {failed.length ? <span className="text-red-600">{failed.length} 项未通过</span> : <span className="text-green-700">全部通过</span>}
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {shown.items.map((i) => (
                    <tr key={i.code} className="border-b border-gray-50 align-top">
                      <td className="w-14 py-2 font-mono">{i.code}</td>
                      <td className="w-20 py-2">{i.level === 'MONEY' ? <Badge tone="bg-red-50 text-red-700">钱类</Badge> : <Badge>告警</Badge>}</td>
                      <td className="py-2">{DESC[i.code] ?? ''}</td>
                      <td className="w-24 py-2">{i.ok ? <Badge tone="bg-green-100 text-green-700">通过</Badge> : <Badge tone="bg-red-100 text-red-700">失败 {i.count}</Badge>}</td>
                      <td className="py-2 font-mono text-xs text-gray-600">
                        {i.samples.map((s) => (
                          <a key={s} className="mr-2 hover:underline" href={s.startsWith('ST') ? '#' : `/admin/orders?q=${encodeURIComponent(s)}`}>
                            {s}
                          </a>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
