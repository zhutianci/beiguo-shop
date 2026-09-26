'use client'

/**
 * 客户详情（设计 12.1）：本站汇总、渠道备注与标签、本站限制下单 / 解除、申请全局封禁、本站订单列表（可跳订单详情）。
 * 不显示任何他站数据；平台设的限制只显示「平台限制」，不显示原因，也不能在这里解除。
 * 渠道不能改用户密码、邮箱、余额（密码全局共用，改了就能登录主站看到他站数据）：客服话术引导买家自助「找回密码」。
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { PartnerCustomerDetail } from '@/lib/tenant/types'
import { gotoLogin, partnerApi } from '../common/api'
import { cnTime, deliveryText, payText, settleText, yuan } from '../common/format'
import { Badge, Button, Card, Empty, ErrorBox, Field, inputCls, Loading, Modal, Notice, PageTitle, Stat } from '../common/ui'

export const BLOCK_REASON_TEXT: Record<string, string> = {
  FRAUD: '欺诈 / 盗刷',
  ABUSE: '恶意售后 / 滥用',
  CHARGEBACK: '付款后拒付',
  OTHER: '其他',
}

function blockReasonText(raw: string | null): string {
  if (!raw) return ''
  const [code, ...rest] = raw.split('：')
  const label = BLOCK_REASON_TEXT[code] ?? code
  return rest.length ? `${label}：${rest.join('：')}` : label
}

export function CustomerDetailView({ customerNo, canWrite, readOnly }: { customerNo: string; canWrite?: boolean; readOnly?: boolean }) {
  const [d, setD] = useState<PartnerCustomerDetail | null>(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState<{ tone: 'green' | 'red'; text: string } | null>(null)
  const [note, setNote] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [saving, setSaving] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const [blockReason, setBlockReason] = useState('FRAUD')
  const [blockNote, setBlockNote] = useState('')
  const [banOpen, setBanOpen] = useState(false)
  const [banReason, setBanReason] = useState('')
  const [busy, setBusy] = useState(false)
  const writable = canWrite && !readOnly
  const base = `/api/partner/customers/${encodeURIComponent(customerNo)}`

  const load = useCallback(async () => {
    setErr('')
    const r = await partnerApi<PartnerCustomerDetail>(base)
    if (r.ok) {
      setD(r.data)
      setNote(r.data.note ?? '')
      setTagsText(r.data.tags.join('，'))
    } else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }, [base])

  useEffect(() => {
    load()
  }, [load])

  const done = (r: { ok: boolean; needLogin?: boolean; error?: string }, okText: string) => {
    if (r.ok) {
      setMsg({ tone: 'green', text: okText })
      load()
      return true
    }
    if (r.needLogin) gotoLogin()
    else setMsg({ tone: 'red', text: r.error || '操作失败' })
    return false
  }

  const save = async () => {
    setSaving(true)
    setMsg(null)
    const tags = tagsText
      .split(/[,，、\s]+/)
      .map((t) => t.trim())
      .filter(Boolean)
    const r = await partnerApi(base, { method: 'PATCH', body: { note, tags } })
    setSaving(false)
    done(r, '备注与标签已保存')
  }

  const block = async () => {
    setBusy(true)
    const r = await partnerApi(`${base}/block`, { method: 'POST', body: { reason: blockReason, note: blockNote.trim() || null } })
    setBusy(false)
    if (done(r, '已限制该用户在本店下单（不影响他查看已购订单、取卡与留言）')) setBlockOpen(false)
  }

  const unblock = async () => {
    if (!window.confirm('确定解除本店下单限制？')) return
    setBusy(true)
    const r = await partnerApi(`${base}/unblock`, { method: 'POST' })
    setBusy(false)
    done(r, '已解除本店下单限制')
  }

  const ban = async () => {
    setBusy(true)
    const r = await partnerApi<{ requestNo: string }>(`${base}/ban-request`, { method: 'POST', body: { reason: banReason.trim() } })
    setBusy(false)
    if (done(r, r.ok ? `已提交全局封禁申请 ${r.data.requestNo}，由站长处理` : '')) {
      setBanOpen(false)
      setBanReason('')
    }
  }

  if (err) return <ErrorBox message={err} onRetry={load} />
  if (!d) return <Loading />

  return (
    <div className="space-y-4">
      <Link href="/partner/customers" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4" />
        返回客户列表
      </Link>
      <PageTitle
        title={d.email}
        desc={`${d.nickname || '未设置昵称'} · 客户编号 ${d.customerNo} · 首次到店 ${cnTime(d.firstSeenAt)}`}
        extra={
          d.blocked ? (
            <Badge tone="red">{d.blockedByPlatform ? '平台已限制本店下单' : '本店已限制下单'}</Badge>
          ) : (
            <Badge tone="green">正常</Badge>
          )
        }
      />
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="本店订单" value={d.orderCount} />
        <Stat label="本店实付" value={yuan(d.paidCents)} />
        <Stat label="退款单数" value={d.refundCount} />
        <Stat label="开票数" value={d.invoiceCount} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="渠道备注与标签">
          <div className="space-y-3">
            <Field label="备注" hint="只有本店成员与站长能看到，买家看不到（最多 500 字）">
              <textarea className={inputCls} rows={3} value={note} maxLength={500} disabled={!writable} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <Field label="标签" hint="用逗号分隔；最多 10 个，每个最多 12 字">
              <input className={inputCls} value={tagsText} disabled={!writable} onChange={(e) => setTagsText(e.target.value)} />
            </Field>
            {writable && (
              <Button variant="primary" onClick={save} loading={saving}>
                保存
              </Button>
            )}
          </div>
        </Card>
        <Card title="风控">
          <div className="space-y-3 text-sm text-gray-600">
            <p>「限制本店下单」只影响该用户在本店的新订单；他仍可登录查看已购订单、取卡、留言、开票和申请售后。主站与其他店不受影响。</p>
            {d.blocked && !d.blockedByPlatform && d.blockReason && <p>限制原因：{blockReasonText(d.blockReason)}</p>}
            {d.blockedByPlatform && <p>该限制由平台设置，如有疑问请联系站长。</p>}
            {writable && (
              <div className="flex flex-wrap gap-2">
                {!d.blocked && (
                  <Button variant="danger" onClick={() => setBlockOpen(true)}>
                    限制本店下单
                  </Button>
                )}
                {d.blocked && !d.blockedByPlatform && (
                  <Button onClick={unblock} loading={busy}>
                    解除限制
                  </Button>
                )}
                <Button onClick={() => setBanOpen(true)}>申请全局封禁</Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card title={`本店订单（最近 ${d.orders.length} 笔）`}>
        {d.orders.length === 0 ? (
          <Empty text="该用户还没有在本店下过单" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs text-gray-500">
                <tr>
                  <th className="px-2 py-2 font-medium">订单号</th>
                  <th className="px-2 py-2 font-medium">商品</th>
                  <th className="px-2 py-2 text-right font-medium">金额</th>
                  <th className="px-2 py-2 font-medium">支付</th>
                  <th className="px-2 py-2 font-medium">交付</th>
                  <th className="px-2 py-2 font-medium">结算</th>
                  <th className="px-2 py-2 font-medium">下单时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {d.orders.map((o) => (
                  <tr key={o.orderNo}>
                    <td className="px-2 py-2">
                      <Link href={`/partner/orders/${encodeURIComponent(o.orderNo)}`} className="font-mono text-primary-700 hover:underline">
                        {o.orderNo}
                      </Link>
                    </td>
                    <td className="px-2 py-2">
                      {o.productName} × {o.quantity}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">{yuan(o.amountCents)}</td>
                    <td className="px-2 py-2">{payText(o.payStatus)}</td>
                    <td className="px-2 py-2">{deliveryText(o.deliveryStatus)}</td>
                    <td className="px-2 py-2">{settleText(o.settleState)}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-gray-500">{cnTime(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={blockOpen}
        title="限制本店下单"
        onClose={() => setBlockOpen(false)}
        footer={
          <>
            <Button onClick={() => setBlockOpen(false)}>取消</Button>
            <Button variant="danger" onClick={block} loading={busy}>
              确认限制
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="原因（必选）">
            <select className={inputCls} value={blockReason} onChange={(e) => setBlockReason(e.target.value)}>
              {Object.keys(BLOCK_REASON_TEXT).map((k) => (
                <option key={k} value={k}>
                  {BLOCK_REASON_TEXT[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="补充说明（选填，最多 100 字）">
            <input className={inputCls} value={blockNote} maxLength={100} onChange={(e) => setBlockNote(e.target.value)} />
          </Field>
          <p className="text-xs text-gray-500">买家下单时只会看到「该账号暂无法在本站下单，请联系客服」，不会看到原因。</p>
        </div>
      </Modal>

      <Modal
        open={banOpen}
        title="申请全局封禁"
        onClose={() => setBanOpen(false)}
        footer={
          <>
            <Button onClick={() => setBanOpen(false)}>取消</Button>
            <Button variant="primary" onClick={ban} loading={busy} disabled={banReason.trim().length < 5}>
              提交申请
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">全局封禁会影响该用户在所有站点的账号，只能由站长审核执行。请写清原因与证据线索（订单号等），至少 5 个字。</p>
          <textarea className={inputCls} rows={4} maxLength={500} value={banReason} onChange={(e) => setBanReason(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
