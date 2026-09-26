'use client'

/**
 * /admin/tenants：渠道列表 + 新建渠道（设计 12.2）。
 * 列：状态、可结算 / 冻结中 / 结算中（预计打款口径）、负余额、本月 GMV、待处理售后、未读留言、payoutHold 标记。
 * 新渠道一律从「筹备中」开始：加域名、授权商品设进货价、邀请渠道主、预览账号走一单全流程之后再开业（设计 6.7）。
 */
import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge, Field, Modal, Notice, StatusBadge, SubmitRow, api, inputCls, pct, useApi, yuan } from './common'

interface Row {
  id: number
  code: string
  name: string
  status: string
  origin: string
  feeRateBp: number
  invoiceShareRateBp: number
  holdDays: number
  payoutHold: boolean
  balances: { available: { payoutCents: number }; pending: { payoutCents: number }; inPayoutCents: number; depositCents: number; negative: boolean }
  monthGmvCents: number
  monthOrders: number
  pendingAfterSales: number
  unreadMessages: number
}

export default function TenantList() {
  const { data, error, loading, reload } = useApi<Row[]>('/api/admin/tenants')
  const [open, setOpen] = useState(false)
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>渠道分站</CardTitle>
          <div className="flex gap-2">
            <Link href="/admin/tenants/overview">
              <Button variant="outline">运营概览</Button>
            </Link>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              新建渠道
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && <Notice kind="error">{error}</Notice>}
          {loading && !data ? (
            <div className="py-12 text-center text-gray-400">加载中...</div>
          ) : !data || data.length === 0 ? (
            <div className="py-12 text-center text-gray-400">还没有渠道。渠道功能未开启（CHANNELS_ENABLED）时这里是空的，属于正常。</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="pb-3 font-medium">渠道</th>
                    <th className="pb-3 font-medium">状态</th>
                    <th className="pb-3 font-medium">费率 / 分成 / 冻结</th>
                    <th className="pb-3 text-right font-medium">可结算</th>
                    <th className="pb-3 text-right font-medium">冻结中</th>
                    <th className="pb-3 text-right font-medium">结算中</th>
                    <th className="pb-3 text-right font-medium">本月 GMV</th>
                    <th className="pb-3 font-medium">待办</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((t) => (
                    <tr key={t.id} className="border-b border-gray-50 align-top">
                      <td className="py-3">
                        <Link href={`/admin/tenants/${t.id}`} className="font-medium text-primary-700 hover:underline">
                          {t.name}
                        </Link>
                        <div className="text-xs text-gray-400">
                          {t.code} · {t.origin.replace(/^https:\/\//, '')}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={t.status} />
                          {t.payoutHold && <Badge tone="bg-red-100 text-red-700">暂停打款</Badge>}
                        </div>
                      </td>
                      <td className="py-3 text-gray-600">
                        {pct(t.feeRateBp)} / {pct(t.invoiceShareRateBp)} / {t.holdDays} 天
                      </td>
                      <td className={`py-3 text-right ${t.balances.negative ? 'font-semibold text-red-600' : ''}`}>
                        {yuan(t.balances.available.payoutCents)}
                        {t.balances.negative && <div className="text-xs">待抵扣</div>}
                      </td>
                      <td className="py-3 text-right">{yuan(t.balances.pending.payoutCents)}</td>
                      <td className="py-3 text-right">{yuan(t.balances.inPayoutCents)}</td>
                      <td className="py-3 text-right">
                        {yuan(t.monthGmvCents)}
                        <div className="text-xs text-gray-400">{t.monthOrders} 单</div>
                      </td>
                      <td className="py-3 text-xs text-gray-600">
                        {t.pendingAfterSales > 0 && <div>售后待处理 {t.pendingAfterSales}</div>}
                        {t.unreadMessages > 0 && <div>未读留言 {t.unreadMessages}</div>}
                        {t.pendingAfterSales === 0 && t.unreadMessages === 0 && <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      {open && (
        <CreateDialog
          onClose={() => setOpen(false)}
          onDone={() => {
            setOpen(false)
            reload()
          }}
        />
      )}
    </div>
  )
}

function CreateDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ code: '', name: '', origin: 'https://', feeRate: '1.5', shareRate: '2', holdDays: '15' })
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const bp = (s: string) => Math.round(Number(s) * 100)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    const feeRateBp = bp(f.feeRate)
    const invoiceShareRateBp = bp(f.shareRate)
    if (!Number.isInteger(feeRateBp) || !Number.isInteger(invoiceShareRateBp)) return setErr('费率请填数字，最多两位小数')
    setBusy(true)
    const r = await api<{ id: number }>('/api/admin/tenants', {
      body: { code: f.code.trim(), name: f.name.trim(), origin: f.origin.trim(), feeRateBp, invoiceShareRateBp, holdDays: Number(f.holdDays) },
    })
    setBusy(false)
    if (!r.success) return setErr(r.error)
    onDone()
    window.location.href = `/admin/tenants/${r.data.id}`
  }
  return (
    <Modal title="新建渠道" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Notice>新渠道从「筹备中」开始，站点地址的域名会同时登记为主域名。开业前还要：授权商品并设进货价、录入收款信息、邀请渠道主。</Notice>
        <Field label="渠道代号" hint="小写字母、数字与连字符，2–20 位，字母开头；同时是登录令牌的 aud，建后不可改">
          <input className={inputCls} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="lulu" required />
        </Field>
        <Field label="内部名称" hint="只在后台显示，不出现在前台">
          <input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        </Field>
        <Field label="站点地址" hint="https://<子域名>.bigolab.com，只填协议与域名">
          <input className={inputCls} value={f.origin} onChange={(e) => setF({ ...f, origin: e.target.value })} required />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="手续费率 %" hint="0–20">
            <input className={inputCls} value={f.feeRate} onChange={(e) => setF({ ...f, feeRate: e.target.value })} />
          </Field>
          <Field label="发票分成率 %" hint="0–6">
            <input className={inputCls} value={f.shareRate} onChange={(e) => setF({ ...f, shareRate: e.target.value })} />
          </Field>
          <Field label="冻结期（天）" hint="首月建议 15">
            <input className={inputCls} value={f.holdDays} onChange={(e) => setF({ ...f, holdDays: e.target.value })} />
          </Field>
        </div>
        {err && <Notice kind="error">{err}</Notice>}
        <SubmitRow onCancel={onClose} loading={busy} label="创建" />
      </form>
    </Modal>
  )
}
