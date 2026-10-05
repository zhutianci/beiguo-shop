/**
 * 「待办」指令的取数（docs/微信机器人-设计.md §7.3，口径参照 §6.2「待办」行与后台对应页面）：每类的数量 + 前 N 条。
 * 只读、只给管理群与私聊（范围 = 主站与全部分站）。全部是 count + take，不把整表取回来。
 *
 * 口径：
 *  · 待人工发货：PAID 且 PROCESSING（后台订单页「处理中」，§6.2 待人工发货），排除接码（SMS / SMS_POOL）与充值（TOPUP）商品——
 *    它们的「处理中」由接码流程自己推进，不是等人发货（同 vmq.ts channelPendingDelivery 对「待人工发货」的判定）。付款最早的在前。
 *  · 待开票：发票 SUBMITTED 且税费已付（财务台待开清单同口径，§6.2）。付款最早的在前。
 *  · 未读留言：有买家发来、站长未读留言的订单（后台订单页「未回复」与列表红点同口径；渠道回复不改站长未读，W6-9）。最近来的在前。
 *  · 待退款：§6.2 没有这一行，这里取「站长要动手退钱、且不在售后申请里」的两类——
 *      接码售后：sms_complaints 待审核（OPEN / APPROVING；通过即整单退回余额，后台「短信接码 → 售后」）；
 *      旧单品接码：接码已超时 / 被取消（lib/sms.ts 给订单挂「【待退款】」备注）或取号失败（挂「待客服处理」），
 *      订单仍是已付款且没交付、没取消——这几种单不在「待人工发货」里（接码商品被排除了），只能在这里看到。等得最久的在前。
 *    渠道发起的退款申请在「售后申请」里（与 §6.2「售后待处理」同一个数，不重复计）。
 *  · 售后申请：渠道发起、站长还没处理的售后（tenant_after_sales PENDING：退款 / 补发 / 升级 / 封禁，后台「售后申请」）。先到的在前。
 * 留言预览是买家写的字：整段先过 sanitizeUserText（邮箱、手机号、疑似卡密打码，网址中性化）再截断。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../../db'
import { sanitizeUserText, truncate } from '../mask'
import { siteNames } from './sites'
import { centsOrNull, countOf, requirePlatformScope, type BotScope } from './scope'

/** 这些发货方式的「处理中」不是等人发货 */
export const NOT_MANUAL_DELIVERY = ['SMS', 'SMS_POOL', 'TOPUP']

export interface TodoOrderItem {
  orderNo: string
  productName: string
  quantity: number
  amountCents: number
  at: Date | null
  /** 渠道单的来源站代码；主站单为 null */
  siteCode: string | null
}

export interface TodoInvoiceItem {
  invoiceNo: string
  amountCents: number | null
  at: Date | null
  siteCode: string | null
}

export interface TodoMessageItem {
  orderNo: string
  productName: string
  /** 这一单买家发来、站长未读的条数 */
  unread: number
  at: Date | null
  /** 最近一条未读留言的预览（已脱敏、已截断） */
  preview: string
  siteCode: string | null
}

export interface TodoRefundItem {
  /** COMPLAINT 接码售后 | LEGACY_SMS 旧单品接码超时 / 被取消 */
  kind: 'COMPLAINT' | 'LEGACY_SMS'
  orderNo: string | null
  /** 接码售后的原因代码（CODE_INVALID / ALREADY_USED / NO_SMS / OTHER）；旧单品接码是接码记录状态（TIMEOUT / CANCELLED / FAILED） */
  reason: string
  amountCents: number | null
  at: Date | null
  siteCode: string | null
}

export interface TodoAfterSaleItem {
  requestNo: string
  /** REFUND / REISSUE / ESCALATE / BAN_REQUEST */
  kind: string
  orderNo: string | null
  at: Date
  siteCode: string | null
}

export interface TodoSnapshot {
  manual: { total: number; items: TodoOrderItem[] }
  invoice: { total: number; items: TodoInvoiceItem[] }
  message: { total: number; items: TodoMessageItem[] }
  refund: { total: number; complaints: number; legacySms: number; items: TodoRefundItem[] }
  afterSale: { total: number; items: TodoAfterSaleItem[] }
}

export async function todoSnapshot(scope: BotScope, limit = 5): Promise<TodoSnapshot> {
  requirePlatformScope(scope, '待办')
  const take = Math.min(Math.max(1, Math.trunc(limit)), 10)
  const manualWhere: Prisma.OrderWhereInput = {
    AND: [{ payStatus: 'PAID', deliveryStatus: 'PROCESSING' }, { product: { deliveryType: { notIn: NOT_MANUAL_DELIVERY } } }],
  }
  const invoiceWhere: Prisma.InvoiceWhereInput = { status: 'SUBMITTED', payStatus: 'PAID' }
  const unreadWhere: Prisma.OrderMessageWhereInput = { sender: 'BUYER', readByAdmin: false }
  const complaintWhere: Prisma.SmsComplaintWhereInput = { state: { in: ['OPEN', 'APPROVING'] } }
  const afterSaleWhere: Prisma.TenantAfterSaleWhereInput = { status: 'PENDING' }

  const [
    manualTotal,
    manualRows,
    invoiceTotal,
    invoiceRows,
    unreadTotalRows,
    unreadGroups,
    complaintTotal,
    complaintRows,
    legacyTotalRows,
    legacyRows,
    afterSaleTotal,
    afterSaleRows,
  ] = await Promise.all([
    prisma.order.count({ where: manualWhere }),
    prisma.order.findMany({
      where: manualWhere,
      orderBy: { paidAt: 'asc' },
      take,
      select: { orderNo: true, tenantId: true, productName: true, quantity: true, amount: true, paidAt: true },
    }),
    prisma.invoice.count({ where: invoiceWhere }),
    prisma.invoice.findMany({ where: invoiceWhere, orderBy: { paidAt: 'asc' }, take, select: { invoiceNo: true, tenantId: true, invoiceAmount: true, paidAt: true } }),
    prisma.$queryRaw<Array<{ n: unknown }>>`
      SELECT COUNT(DISTINCT order_id) AS n FROM order_messages WHERE sender = 'BUYER' AND read_by_admin = 0`,
    prisma.orderMessage.groupBy({
      by: ['orderId'],
      where: unreadWhere,
      _count: { _all: true },
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: 'desc' } },
      take,
    }),
    prisma.smsComplaint.count({ where: complaintWhere }),
    prisma.smsComplaint.findMany({ where: complaintWhere, orderBy: { createdAt: 'asc' }, take, select: { orderId: true, reason: true, createdAt: true } }),
    // 旧单品接码：接码记录（sms_activations.status 有索引）超时 / 被取消 / 取号失败，订单仍已付款、没交付也没取消
    prisma.$queryRaw<Array<{ n: unknown }>>`
      SELECT COUNT(*) AS n
        FROM sms_activations a
        JOIN orders o ON o.id = a.order_id
       WHERE a.status IN ('TIMEOUT', 'CANCELLED', 'FAILED')
         AND o.pay_status = 'PAID' AND o.delivery_status IN ('PENDING', 'PROCESSING')`,
    prisma.$queryRaw<Array<{ order_no: string; tenant_id: number; amount: unknown; paid_at: Date | null; status: string }>>`
      SELECT o.order_no, o.tenant_id, o.amount, o.paid_at, a.status
        FROM sms_activations a
        JOIN orders o ON o.id = a.order_id
       WHERE a.status IN ('TIMEOUT', 'CANCELLED', 'FAILED')
         AND o.pay_status = 'PAID' AND o.delivery_status IN ('PENDING', 'PROCESSING')
       ORDER BY o.paid_at ASC
       LIMIT ${take}`,
    prisma.tenantAfterSale.count({ where: afterSaleWhere }),
    prisma.tenantAfterSale.findMany({ where: afterSaleWhere, orderBy: { createdAt: 'asc' }, take, select: { requestNo: true, tenantId: true, kind: true, orderId: true, createdAt: true } }),
  ])

  // 未读留言的订单、接码售后与售后申请的订单号；最近一条未读留言的内容
  const msgOrderIds = unreadGroups.map((g) => g.orderId)
  const refOrderIds = Array.from(new Set([...complaintRows.map((c) => c.orderId), ...afterSaleRows.map((a) => a.orderId).filter((x): x is number => x != null), ...msgOrderIds]))
  const refOrdersP: Promise<Array<{ id: number; orderNo: string; tenantId: number; productName: string; amount: Prisma.Decimal }>> = refOrderIds.length
    ? prisma.order.findMany({ where: { id: { in: refOrderIds } }, select: { id: true, orderNo: true, tenantId: true, productName: true, amount: true } })
    : Promise.resolve([])
  const lastMsgsP: Promise<Array<{ orderId: number; content: string }>> = msgOrderIds.length
    ? prisma.orderMessage.findMany({ where: { ...unreadWhere, orderId: { in: msgOrderIds } }, orderBy: { id: 'desc' }, take: 50, select: { orderId: true, content: true } })
    : Promise.resolve([])
  const [refOrders, lastMsgs] = await Promise.all([refOrdersP, lastMsgsP])
  const orderOf = new Map(refOrders.map((o) => [o.id, o]))
  const lastMsgOf = new Map<number, string>()
  lastMsgs.forEach((m) => {
    if (!lastMsgOf.has(m.orderId)) lastMsgOf.set(m.orderId, m.content)
  })

  const tenantIds = [
    ...manualRows.map((r) => r.tenantId),
    ...invoiceRows.map((r) => r.tenantId),
    ...afterSaleRows.map((r) => r.tenantId),
    ...legacyRows.map((r) => Number(r.tenant_id)),
    ...refOrders.map((o) => o.tenantId),
  ]
  const names = await siteNames(scope, tenantIds)
  const codeOf = (tenantId: number): string | null => names.get(tenantId)?.code ?? null

  const complaintTotalN = complaintTotal
  const legacyTotalN = countOf(legacyTotalRows[0]?.n)
  const refundItems: TodoRefundItem[] = [
    ...complaintRows.map((c): TodoRefundItem => {
      const o = orderOf.get(c.orderId)
      return { kind: 'COMPLAINT', orderNo: o?.orderNo ?? null, reason: c.reason, amountCents: o ? centsOrNull(o.amount) : null, at: c.createdAt, siteCode: o ? codeOf(o.tenantId) : null }
    }),
    ...legacyRows.map((r): TodoRefundItem => ({
      kind: 'LEGACY_SMS',
      orderNo: r.order_no,
      reason: r.status,
      amountCents: centsOrNull(r.amount),
      at: r.paid_at ? new Date(r.paid_at) : null,
      siteCode: codeOf(Number(r.tenant_id)),
    })),
  ]
  // 两类合起来按时间排，取前 take 条
  refundItems.sort((a, b) => (a.at?.getTime() ?? 0) - (b.at?.getTime() ?? 0))

  return {
    manual: {
      total: manualTotal,
      items: manualRows.map((r) => ({
        orderNo: r.orderNo,
        productName: r.productName,
        quantity: r.quantity,
        amountCents: centsOrNull(r.amount) ?? 0,
        at: r.paidAt,
        siteCode: codeOf(r.tenantId),
      })),
    },
    invoice: {
      total: invoiceTotal,
      items: invoiceRows.map((r) => ({ invoiceNo: r.invoiceNo, amountCents: centsOrNull(r.invoiceAmount), at: r.paidAt, siteCode: codeOf(r.tenantId) })),
    },
    message: {
      total: countOf(unreadTotalRows[0]?.n),
      items: unreadGroups.map((g) => {
        const o = orderOf.get(g.orderId)
        const raw = lastMsgOf.get(g.orderId)
        return {
          orderNo: o?.orderNo ?? `#${g.orderId}`,
          productName: o?.productName ?? '',
          unread: g._count._all,
          at: g._max.createdAt,
          // 先在整段上脱敏、中性化网址，再截断：反过来的话，截在网址中间残留的「https://xxx…」认不出来
          preview: raw ? truncate(sanitizeUserText(raw, { max: 500 }), 24) : '',
          siteCode: o ? codeOf(o.tenantId) : null,
        }
      }),
    },
    refund: { total: complaintTotalN + legacyTotalN, complaints: complaintTotalN, legacySms: legacyTotalN, items: refundItems.slice(0, take) },
    afterSale: {
      total: afterSaleTotal,
      items: afterSaleRows.map((r) => {
        const o = r.orderId != null ? orderOf.get(r.orderId) : undefined
        return { requestNo: r.requestNo, kind: r.kind, orderNo: o?.orderNo ?? null, at: r.createdAt, siteCode: codeOf(r.tenantId) }
      }),
    },
  }
}
