'use client'

/**
 * 订单详情（设计 6.4.1、12.1）：订单全字段、买家、结算快照与各成分金额、接码号码、发票与收据全字段、留言、售后申请。
 * 交付凭据（卡密明文、交付信息、验证码）与卡密使用情况**不随详情下发**：点「查看交付凭据」才请求 /cards，每次查看服务端留痕。
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, KeyRound } from 'lucide-react'
import type { PartnerDeliveryDTO, PartnerOrderDetail } from '@/lib/tenant/types'
import { gotoLogin, partnerApi } from '../common/api'
import {
  afterSaleKindText,
  afterSaleStatusText,
  BEARER_TEXT,
  bpText,
  cnTime,
  deduct,
  deliveryText,
  invoiceStatusText,
  invShareText,
  payText,
  settleText,
  smsStatusText,
  yuan,
} from '../common/format'
import { Badge, Button, Card, ErrorBox, Loading, Notice } from '../common/ui'
import { deliveryTone, payTone } from './orders-view'
import { MessagesPanel } from './messages-panel'
import { AfterSaleForm } from './after-sale-form'

const BUCKET_TEXT: Record<string, string> = {
  PENDING: '冻结中',
  AVAILABLE: '可结算',
  SETTLED: '已结算',
  RETURNED: '所在结算单已退回，金额已转回可结算',
  MIXED: '部分冲销',
  NONE: '—',
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="shrink-0 text-gray-500">{k}</span>
      <span className="text-right text-gray-900">{v}</span>
    </div>
  )
}

export function OrderDetailView({ orderNo, readOnly }: { orderNo: string; readOnly?: boolean }) {
  const [d, setD] = useState<PartnerOrderDetail | null>(null)
  const [err, setErr] = useState('')
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    setErr('')
    const r = await partnerApi<PartnerOrderDetail>(`/api/partner/orders/${encodeURIComponent(orderNo)}`)
    if (r.ok) setD(r.data)
    else if (r.needLogin) gotoLogin()
    else if (r.status === 404) setNotFound(true)
    else setErr(r.error)
  }, [orderNo])

  useEffect(() => {
    load()
  }, [load])

  if (notFound) return <Notice tone="amber">订单不存在或不属于本店。</Notice>
  if (err) return <ErrorBox message={err} onRetry={load} />
  if (!d) return <Loading />
  const s = d.settlement

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/partner/orders" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-200" aria-label="返回订单列表">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">订单 {d.orderNo}</h1>
            <p className="text-sm text-gray-500">下单于 {cnTime(d.createdAt)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={payTone(d.payStatus)}>{payText(d.payStatus)}</Badge>
          <Badge tone={deliveryTone(d.deliveryStatus)}>{deliveryText(d.deliveryStatus)}</Badge>
          {d.escalatedAt && <Badge tone="purple">已升级给站长（{cnTime(d.escalatedAt)}）</Badge>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="订单信息">
          <Row k="商品" v={d.productName} />
          <Row k="数量" v={d.quantity} />
          <Row k="售价（单件）" v={yuan(d.unitPriceCents)} />
          <Row k="货款" v={yuan(d.amountCents)} />
          {d.invoiceTaxCents > 0 && <Row k="开票税费" v={yuan(d.invoiceTaxCents)} />}
          <Row k="支付时间" v={cnTime(d.paidAt)} />
          <Row k="交付时间" v={cnTime(d.deliveredAt)} />
          {/*
           * 买家实付 = 货款 + 结账时一并收的开票税费：与「订单已支付」通知的「实收」、客户列表的「本站实付」同一口径。
           * 不拿收款流水（Payment.amount）的金额当「实付」：到账路径记的是不含税货款（Order.amount 永远不含税），
           * 后台「标已付」记的是实收总额，两条路径口径不同——流水这里只列支付方式与时间（终审第 2 轮）。
           */}
          {d.payStatus !== 'UNPAID' && <Row k="买家实付" v={yuan(d.amountCents + d.invoiceTaxCents)} />}
          {d.payments.map((p, i) => (
            <Row key={i} k={`支付记录 #${i + 1}`} v={`${p.payMethod === 'ALIPAY' ? '支付宝' : p.payMethod === 'WECHAT' ? '微信' : p.payMethod} · ${cnTime(p.createdAt)}`} />
          ))}
          {(d.refundedGoodsCents > 0 || d.refundedTaxCents > 0) && (
            <Row k="已退款" v={`货款 ${yuan(d.refundedGoodsCents)} · 税费 ${yuan(d.refundedTaxCents)}${d.refundedQty ? ` · ${d.refundedQty} 件` : ''}`} />
          )}
          <Row k="买家备注" v={d.buyerRemark || '—'} />
        </Card>

        <Card title="买家">
          <Row k="邮箱" v={d.buyer.email} />
          <Row k="昵称" v={d.buyer.nickname || '—'} />
          {d.sms && (
            <>
              <div className="mt-2 border-t border-gray-100 pt-2 text-xs font-semibold text-gray-500">接码</div>
              <Row k="号码" v={d.sms.phone || '—'} />
              <Row k="状态" v={smsStatusText(d.sms.status)} />
              <Row k="取号 / 收码" v={`${cnTime(d.sms.numberAt)} / ${cnTime(d.sms.codeAt)}`} />
              <Row k="到期" v={cnTime(d.sms.expireAt)} />
            </>
          )}
        </Card>

        <Card title="结算快照">
          <Row k="进货价（单件）" v={yuan(d.supplyUnitCents)} />
          <Row k="进货款" v={yuan(d.supplyCents)} />
          <Row k="手续费率 / 发票分成率" v={`${bpText(d.feeRateBp)} / ${bpText(d.invoiceShareRateBp)}`} />
          <Row k="冻结期" v={`${d.settleHoldDays} 天`} />
          <Row k="结算状态" v={d.payStatus === 'UNPAID' ? '—' : settleText(d.settleState)} />
          <Row k="发票分成状态" v={invShareText(d.invShareState)} />
          {d.settleBearer && <Row k="最近一次退款承担方" v={BEARER_TEXT[d.settleBearer] ?? d.settleBearer} />}
          {s && (
            <>
              <div className="mt-2 border-t border-gray-100 pt-2 text-xs font-semibold text-gray-500">本单当前金额（冲销后）</div>
              <Row k="货款" v={yuan(s.goodsCents)} />
              <Row k="进货款" v={deduct(s.purchaseCents)} />
              <Row k="发票分成" v={yuan(s.invShareCents)} />
              {s.feeCents != null && <Row k="手续费" v={deduct(s.feeCents)} />}
              {s.otherCents !== 0 && <Row k="售后与调整" v={yuan(s.otherCents)} />}
              {/* 没有「查看财务」权限的成员：服务端不给余额 / 预计打款 / 手续费 / 所在 / 结算单（D5），这里整段不画 */}
              {s.balanceCents != null && <Row k="余额" v={yuan(s.balanceCents)} />}
              {s.payoutCents != null && <Row k="预计打款" v={<span className="font-semibold">{yuan(s.payoutCents)}</span>} />}
              {s.bucket != null && <Row k="所在" v={BUCKET_TEXT[s.bucket] ?? s.bucket} />}
              {s.releaseEta && <Row k="预计可结算日" v={cnTime(s.releaseEta)} />}
              {s.statementNo && <Row k="结算单" v={s.statementNo} />}
            </>
          )}
        </Card>

        <DeliveryCard orderNo={d.orderNo} />
      </div>

      {(d.invoices.length > 0 || d.receipts.length > 0 || d.invoiceInfo != null) && (
        <Card title="发票与收据">
          {d.invoiceInfo != null && d.invoices.length === 0 && (
            <p className="mb-2 text-sm text-gray-500">买家下单时勾选了开票，发票将在付款后生成。</p>
          )}
          <div className="space-y-3">
            {d.invoices.map((i) => (
              <div key={i.invoiceNo} className="rounded-lg border border-gray-100 p-3 text-sm">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-medium">发票 {i.invoiceNo}</span>
                  <Badge tone={i.status === 'ISSUED' ? 'green' : i.status === 'CANNOT' ? 'red' : 'amber'}>{invoiceStatusText(i.status)}</Badge>
                  <span className="text-xs text-gray-400">税费{i.payStatus === 'PAID' ? '已付' : '未付'}</span>
                </div>
                <div className="grid gap-x-6 sm:grid-cols-2">
                  <Row k="抬头" v={i.title || '—'} />
                  <Row k="税号" v={i.taxNumber || '—'} />
                  <Row k="地址" v={i.address || '—'} />
                  <Row k="电话" v={i.phone || '—'} />
                  <Row k="开户行" v={i.bankName || '—'} />
                  <Row k="账号" v={i.bankAccount || '—'} />
                  <Row k="接收邮箱" v={i.email || '—'} />
                  <Row k="金额 / 开票额 / 税费" v={`${yuan(i.sellingPriceCents)} / ${yuan(i.invoiceAmountCents)} / ${yuan(i.taxFeeCents)}`} />
                  <Row k="提交 / 开具" v={`${cnTime(i.submittedAt)} / ${cnTime(i.issuedAt)}`} />
                </div>
              </div>
            ))}
            {d.receipts.map((r) => (
              <div key={r.receiptNo} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 p-3 text-sm">
                <span>
                  收据 {r.receiptNo} · {r.payerTitle} · {yuan(r.amountCents)} · {cnTime(r.issuedAt)}
                </span>
                {r.previewUrl && (
                  <a href={r.previewUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                    预览
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <MessagesPanel orderNo={d.orderNo} readOnly={readOnly} />
        <Card title="售后">
          {d.afterSales.length > 0 && (
            <ul className="mb-3 space-y-2 text-sm">
              {d.afterSales.map((a) => (
                <li key={a.requestNo} className="rounded-lg border border-gray-100 p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{afterSaleKindText(a.kind)}</span>
                    <Badge tone={a.status === 'PENDING' ? 'amber' : a.status === 'DONE' ? 'green' : 'gray'}>{afterSaleStatusText(a.status)}</Badge>
                    <span className="text-xs text-gray-400">
                      {a.requestNo} · {cnTime(a.createdAt)}
                    </span>
                  </div>
                  {a.resultNote && <p className="mt-1 text-gray-600">站长说明：{a.resultNote}</p>}
                </li>
              ))}
            </ul>
          )}
          {readOnly ? (
            <p className="text-sm text-gray-400">店铺暂停期间不能发起售后申请。</p>
          ) : (
            <AfterSaleForm orderNo={d.orderNo} paid={d.payStatus !== 'UNPAID'} amountCents={d.amountCents} onDone={load} />
          )}
        </Card>
      </div>
    </div>
  )
}

/** 交付凭据：点击才加载，每次加载服务端写一条 card.view 审计 */
function DeliveryCard({ orderNo }: { orderNo: string }) {
  const [data, setData] = useState<PartnerDeliveryDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const show = async () => {
    setLoading(true)
    setErr('')
    const r = await partnerApi<PartnerDeliveryDTO>(`/api/partner/orders/${encodeURIComponent(orderNo)}/cards`)
    setLoading(false)
    if (r.ok) setData(r.data)
    else if (r.needLogin) gotoLogin()
    else setErr(r.error)
  }

  return (
    <Card
      title={
        <span className="flex items-center gap-1.5">
          <KeyRound className="h-4 w-4" />
          交付凭据
        </span>
      }
      extra={
        <Button size="sm" onClick={show} loading={loading}>
          <Eye className="h-3.5 w-3.5" />
          {data ? '刷新' : '查看交付凭据'}
        </Button>
      }
    >
      {!data ? (
        <p className="text-sm text-gray-500">卡密、交付信息与验证码默认隐藏；每次查看都会记入操作日志。{err && <span className="block text-red-600">{err}</span>}</p>
      ) : (
        <div className="space-y-3 text-sm">
          {data.cards.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-semibold text-gray-500">卡密（{data.cards.length} 张）</div>
              <ol className="space-y-1">
                {data.cards.map((c, i) => (
                  <li key={i} className="rounded bg-gray-50 px-2 py-1 font-mono text-xs">
                    <span className="mr-2 text-gray-400">#{i + 1}</span>
                    <span className="select-all break-all">{c.cardText}</span>
                    <span className="ml-2 text-gray-400">{cnTime(c.usedAt)}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {data.deliveryInfo && (
            <div>
              <div className="mb-1 text-xs font-semibold text-gray-500">交付信息</div>
              <pre className="whitespace-pre-wrap break-all rounded bg-gray-50 p-2 text-xs">{data.deliveryInfo}</pre>
            </div>
          )}
          {data.smsCode && (
            <div>
              <div className="mb-1 text-xs font-semibold text-gray-500">验证码</div>
              <span className="select-all rounded bg-gray-50 px-2 py-1 font-mono">{data.smsCode}</span>
            </div>
          )}
          {data.cards.length === 0 && !data.deliveryInfo && !data.smsCode && <p className="text-gray-400">暂无交付内容</p>}
          {data.redeemLogs.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-semibold text-gray-500">卡密使用情况</div>
              <ul className="space-y-1 text-xs text-gray-600">
                {data.redeemLogs.map((l, i) => (
                  <li key={i}>
                    {cnTime(l.createdAt, true)} · 第 {l.cardIndex} 张 · {l.action} · {l.state}
                    {l.message ? ` · ${l.message}` : ''} · {l.provider}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
