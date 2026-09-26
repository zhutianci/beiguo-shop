'use client'

/**
 * 操作日志（设计 5.8、12.1）：本店成员的操作，以及平台对本店的操作（显示为「平台」）。
 * 变更内容只有摘要（publicDiff）：平台改进货价只显示新旧进货价、暂停打款只显示开关、调账只显示金额与对外说明。
 */
import { useCallback, useEffect, useState } from 'react'
import type { PartnerAuditRow } from '@/lib/tenant/types'
import { gotoLogin, partnerApi, qs } from '../common/api'
import { BEARER_TEXT, cnTime } from '../common/format'
import { Badge, Button, Card, Empty, ErrorBox, Field, inputCls, Loading, PageTitle, Pager } from '../common/ui'

export const ACTION_TEXT: Record<string, string> = {
  'listing.price': '改售价',
  'listing.status': '上下架',
  'listing.batch': '批量改价',
  'listing.batch_status': '批量上下架',
  'listing.supply': '平台改进货价',
  'listing.batch_supply': '平台批量改进货价',
  'listing.grant': '平台授权商品',
  'listing.revoke': '平台撤销授权',
  'order.view': '查看订单',
  'card.view': '查看交付凭据',
  'order.export': '导出订单',
  'order.message': '回复留言',
  'aftersale.request': '发起售后申请',
  'aftersale.cancel': '撤回售后申请',
  'aftersale.handle': '平台处理售后',
  'customer.update': '修改客户备注',
  'customer.block': '限制客户下单',
  'customer.unblock': '解除客户限制',
  'customer.export': '导出客户',
  'statement.apply': '申请结算',
  'statement.generate': '生成结算单',
  'statement.paying': '开始打款',
  'statement.unpaying': '放弃打款认领',
  'statement.payout': '登记打款',
  'statement.return': '退回结算单',
  'statement.bounce': '登记退票',
  'statement.export': '下载对账单',
  'ledger.adjust': '平台调账',
  'deposit.in': '保证金转入',
  'deposit.apply': '保证金抵扣',
  'deposit.refund': '保证金退还',
  writeoff: '负余额核销',
  'tenant.rates': '平台调整费率',
  'tenant.payout_hold': '平台暂停 / 恢复打款',
  'tenant.status': '店铺状态变更',
  'settings.notice': '修改通知偏好',
  'settings.webhook': '修改企业微信 webhook',
  'settings.webhook_test': '发送 webhook 测试',
  'member.join': '成员加入',
  // 终审第 2 轮补齐：凡以本渠道 tenantId 写审计的 action 都要有中文名（wp7「操作日志文案全覆盖」静态检查兜底），
  // 否则页面回退成英文代码
  'listing.sort': '调整排序',
  'listing.range': '平台调整售价范围',
  'order.refund': '平台退款',
  'order.cancel': '平台取消订单',
  'order.refill': '平台补发',
  'order.deliver': '平台修改交付',
  'order.escalation_clear': '平台清除升级',
  'order.mark_paid': '平台标记已付款',
  'order.price': '平台改价',
  'order.resettle': '平台重算结算',
  'ledger.repay': '渠道回款',
  'reconcile.run': '平台对账自检',
  'invoice.tax_refund': '平台退开票税费',
  'invoice.tax_kept': '平台保留开票税费',
  'statement.proof': '平台上传打款凭证',
  'statement.proof_view': '平台查看打款凭证',
  'statement.payee_reveal': '平台查看结算单收款账号',
  'tenant.create': '平台开通店铺',
  'tenant.config': '平台修改店铺配置',
  'tenant.domain': '平台修改域名',
  'tenant.payee': '平台修改收款账号',
  'tenant.payee_reveal': '平台查看收款账号',
  'customer.tags': '平台修改客户标签',
  'member.invite': '成员邀请',
  'member.invite_revoke': '撤销成员邀请',
  'member.status': '成员状态变更',
}

const ACTION_GROUPS: { value: string; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'listing', label: '商品与价格' },
  { value: 'order', label: '订单' },
  { value: 'card', label: '交付凭据' },
  { value: 'aftersale', label: '售后' },
  { value: 'customer', label: '客户' },
  { value: 'statement', label: '结算单' },
  { value: 'ledger', label: '调账' },
  { value: 'tenant', label: '店铺配置' },
  { value: 'member', label: '成员' },
  { value: 'invoice', label: '发票' },
  { value: 'deposit', label: '保证金' },
  { value: 'reconcile', label: '对账' },
  { value: 'settings', label: '设置' },
]

const RESULT_TONE: Record<string, 'green' | 'red' | 'amber'> = { OK: 'green', DENIED: 'amber', ERROR: 'red' }

function diffText(v: unknown): string {
  if (v === null || v === undefined) return ''
  try {
    const s = JSON.stringify(v)
    return s.length > 300 ? s.slice(0, 300) + '…' : s
  } catch {
    return ''
  }
}

const PAGE_SIZE = 30

export function AuditView() {
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ total: number; rows: PartnerAuditRow[] } | null>(null)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setErr('')
    const r = await partnerApi<{ total: number; rows: PartnerAuditRow[] }>(`/api/partner/audit${qs({ action, from, to, page, pageSize: PAGE_SIZE })}`)
    if (r.ok) setData(r.data)
    else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }, [action, from, to, page])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-4">
      <PageTitle title="操作日志" desc="本店成员与平台对本店的操作记录。平台的操作统一显示为「平台」，变更内容只显示摘要。" />
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Field label="操作类型">
            <select
              className={inputCls}
              value={action}
              onChange={(e) => {
                setPage(1)
                setAction(e.target.value)
              }}
            >
              {ACTION_GROUPS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="起始日期">
            <input
              type="date"
              className={inputCls}
              value={from}
              onChange={(e) => {
                setPage(1)
                setFrom(e.target.value)
              }}
            />
          </Field>
          <Field label="截止日期">
            <input
              type="date"
              className={inputCls}
              value={to}
              onChange={(e) => {
                setPage(1)
                setTo(e.target.value)
              }}
            />
          </Field>
          <div className="flex items-end">
            <Button onClick={load}>刷新</Button>
          </div>
        </div>
      </Card>
      {err ? (
        <ErrorBox message={err} onRetry={load} />
      ) : !data ? (
        <Loading />
      ) : data.rows.length === 0 ? (
        <Card>
          <Empty text="暂无记录" />
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                <th className="px-3 py-2 font-medium">时间</th>
                <th className="px-3 py-2 font-medium">操作者</th>
                <th className="px-3 py-2 font-medium">操作</th>
                <th className="px-3 py-2 font-medium">对象</th>
                <th className="px-3 py-2 font-medium">结果</th>
                <th className="px-3 py-2 font-medium">变更摘要</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.rows.map((r, i) => (
                <tr key={`${r.at}-${i}`}>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-500">{cnTime(r.at, true)}</td>
                  <td className="px-3 py-2">{r.actor === '平台' ? <Badge tone="purple">平台</Badge> : r.actor}</td>
                  <td className="px-3 py-2">{ACTION_TEXT[r.action] ?? r.action}</td>
                  <td className="px-3 py-2 font-mono text-xs text-gray-600">{r.targetId ?? '—'}</td>
                  <td className="px-3 py-2">
                    <Badge tone={RESULT_TONE[r.result] ?? 'gray'}>{r.result}</Badge>
                    {r.reasonCode && <span className="ml-1 text-xs text-gray-400">{BEARER_TEXT[r.reasonCode] ?? r.reasonCode}</span>}
                  </td>
                  <td className="max-w-md break-all px-3 py-2 font-mono text-xs text-gray-500">{diffText(r.publicDiff)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-3 pb-3">
            <Pager page={page} pageSize={PAGE_SIZE} total={data.total} onChange={setPage} />
          </div>
        </div>
      )}
    </div>
  )
}
