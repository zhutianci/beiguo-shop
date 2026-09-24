/**
 * 站内订单 ↔ 发票 的双向查找（服务端）。
 *
 * 【为什么要单独一个文件】Order、ExternalOrder、Invoice 三张表之间没有任何 Prisma 关系，
 * 全靠两根「线索列」手工连：
 *
 *   Order.id ──┬── ExternalOrder.shopOrderId = id          （管理员「标记已完成」导入的 WEB 行也有）
 *              └── ExternalOrder.sourceKey   = 'order:<id>' （买家申请发票/收据时造的背书行）
 *                        │
 *                        └── Invoice.externalOrderId（唯一）
 *
 * 一张站内订单**可能对应两条** ExternalOrder（背书行 + WEB 行），因此可能挂两张发票。
 * 此前买家订单列表只按 sourceKey 查，WEB 行上的发票查不到，
 * 页面会再显示一次「申请发票」—— 点下去就是第二次付 6%（交接文档记录的缺陷）。
 * 两个方向的查找一律走这里，两根线索都查。
 *
 * 发票上还有一份 sourceKey **快照**（Invoice.sourceKey）：ExternalOrder 被后台编辑改了
 * sourceKey、甚至被删掉之后，它是唯一剩下的线索，反查订单时作为最后兜底。
 */
import { prisma } from './db'
import { shopOrderSourceKey } from './order-invoice'

/** 'order:123' → 123；其他格式 → null */
export function orderIdFromSourceKey(key: string | null | undefined): number | null {
  if (!key) return null
  const m = /^order:(\d+)$/.exec(key)
  if (!m) return null
  const id = Number(m[1])
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

/** 发票状态的「推进程度」：同一订单挂了两张发票时，展示最靠后的那张 */
const STATUS_RANK: Record<string, number> = { ISSUED: 5, SUBMITTED: 4, AWAIT_PAY: 3, CANNOT: 2, UNAPPLIED: 1 }

export function invoiceStatusRank(status: string | null | undefined): number {
  return STATUS_RANK[status || ''] ?? 0
}

/** 订单详情里展示用的发票字段（Decimal 已转 number、时间转 ISO） */
export interface InvoiceBrief {
  id: number
  invoiceNo: string
  externalOrderId: number | null
  status: string
  payStatus: string
  source: string | null
  title: string | null
  taxNumber: string | null
  address: string | null
  phone: string | null
  bankName: string | null
  bankAccount: string | null
  email: string | null
  showAiWording: boolean | null
  sellingPrice: number | null
  invoiceAmount: number | null
  taxFee: number | null
  paidAt: string | null
  submittedAt: string | null
  issuedAt: string | null
  createdAt: string
  /**
   * 只能靠发票上的 sourceKey 快照找回来的发票（它挂的外部订单行已被改键或删除）。
   * 这种发票上的「去支付税费」走不通（/api/invoices/[id]/pay 要经外部订单行鉴权），
   * 买家侧挑主发票时要跳过未付款的孤儿，否则订单页卡在一个付不了的状态上
   */
  orphan?: boolean
}

const INVOICE_SELECT = {
  id: true,
  invoiceNo: true,
  externalOrderId: true,
  status: true,
  payStatus: true,
  source: true,
  title: true,
  taxNumber: true,
  address: true,
  phone: true,
  bankName: true,
  bankAccount: true,
  email: true,
  showAiWording: true,
  sellingPrice: true,
  invoiceAmount: true,
  taxFee: true,
  paidAt: true,
  submittedAt: true,
  issuedAt: true,
  createdAt: true,
  sourceKey: true,
} as const

type InvoiceRow = {
  id: number
  invoiceNo: string
  externalOrderId: number | null
  status: string
  payStatus: string
  source: string | null
  title: string | null
  taxNumber: string | null
  address: string | null
  phone: string | null
  bankName: string | null
  bankAccount: string | null
  email: string | null
  showAiWording: boolean | null
  sellingPrice: unknown
  invoiceAmount: unknown
  taxFee: unknown
  paidAt: Date | null
  submittedAt: Date | null
  issuedAt: Date | null
  createdAt: Date
  sourceKey: string | null
}

function num(v: unknown): number | null {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null
}

function toBrief(r: InvoiceRow): InvoiceBrief {
  return {
    id: r.id,
    invoiceNo: r.invoiceNo,
    externalOrderId: r.externalOrderId,
    status: r.status,
    payStatus: r.payStatus,
    source: r.source,
    title: r.title,
    taxNumber: r.taxNumber,
    address: r.address,
    phone: r.phone,
    bankName: r.bankName,
    bankAccount: r.bankAccount,
    email: r.email,
    showAiWording: r.showAiWording,
    sellingPrice: num(r.sellingPrice),
    invoiceAmount: num(r.invoiceAmount),
    taxFee: num(r.taxFee),
    paidAt: iso(r.paidAt),
    submittedAt: iso(r.submittedAt),
    issuedAt: iso(r.issuedAt),
    createdAt: r.createdAt.toISOString(),
  }
}

/**
 * 一批站内订单各自挂着的发票（按推进程度降序，第一张就是该展示的那张）。
 * 没有发票的订单不在 Map 里。
 */
export async function invoicesByOrderIds(orderIds: number[]): Promise<Map<number, InvoiceBrief[]>> {
  const out = new Map<number, InvoiceBrief[]>()
  const ids = Array.from(new Set(orderIds.filter((n) => Number.isSafeInteger(n) && n > 0)))
  if (!ids.length) return out

  const exts = await prisma.externalOrder.findMany({
    where: { OR: [{ shopOrderId: { in: ids } }, { sourceKey: { in: ids.map(shopOrderSourceKey) } }] },
    select: { id: true, shopOrderId: true, sourceKey: true },
  })
  const extToOrder = new Map<number, number>()
  for (const e of exts) {
    const oid = e.shopOrderId ?? orderIdFromSourceKey(e.sourceKey)
    if (oid && ids.includes(oid)) extToOrder.set(e.id, oid)
  }
  const extIds = Array.from(extToOrder.keys())

  // 兜底线索：背书行被改了 sourceKey 或被删掉后，只剩发票上的 sourceKey 快照
  const invs = (await prisma.invoice.findMany({
    where: {
      OR: [
        ...(extIds.length ? [{ externalOrderId: { in: extIds } }] : []),
        { sourceKey: { in: ids.map(shopOrderSourceKey) } },
      ],
    },
    select: INVOICE_SELECT,
  })) as InvoiceRow[]

  // 只能靠 sourceKey 快照找回来的「孤儿」发票（外部订单行已被改键或删除）：
  // 它上面的待付税费链接已经走不通（/api/invoices/[id]/pay 要经外部订单行鉴权），
  // 同等状态下排在正常发票后面，免得订单页把一个付不了的「去支付税费」当成主发票
  const orphanIds = new Set<number>()
  for (const iv of invs) {
    const viaExt = iv.externalOrderId != null ? extToOrder.get(iv.externalOrderId) : undefined
    const oid = viaExt ?? orderIdFromSourceKey(iv.sourceKey) ?? undefined
    if (!oid) continue
    if (viaExt == null) orphanIds.add(iv.id)
    const list = out.get(oid) || []
    if (!list.some((x) => x.id === iv.id)) list.push({ ...toBrief(iv), orphan: viaExt == null })
    out.set(oid, list)
  }
  const rankOf = (x: InvoiceBrief) => invoiceStatusRank(x.status) * 2 - (orphanIds.has(x.id) ? 1 : 0)
  out.forEach((list) => {
    list.sort((a, b) => rankOf(b) - rankOf(a) || b.id - a.id)
  })
  return out
}

/** 单张订单的发票（订单详情用） */
export async function invoicesForOrder(orderId: number): Promise<InvoiceBrief[]> {
  return (await invoicesByOrderIds([orderId])).get(orderId) || []
}

/** 发票详情里展示的关联订单摘要 */
export interface ShopOrderBrief {
  id: number
  orderNo: string
  productId: number
  productName: string
  quantity: number
  amount: number
  invoiceTaxFee: number | null
  couponDiscount: number | null
  originalAmount: number | null
  payStatus: string
  deliveryStatus: string
  referrerId: number | null
  createdAt: string
  paidAt: string | null
  deliveredAt: string | null
  user: { id: number; email: string | null; nickname: string | null }
}

/**
 * 一批发票各自对应的站内订单（发票 id → 订单摘要）。
 *
 * 入参的 id 只被当作返回 Map 的键使用，不会拿去查发票表 ——
 * lib/admin-invoice-row.ts 对「还没有发票的外部订单行」传的是负数占位 id（-extId），依赖这一点。
 * 手动录入（MANUAL）的发票、以及纯外部导入（闲鱼/腾讯文档）订单上的发票没有站内订单，不在 Map 里。
 */
export async function shopOrdersForInvoices(
  invs: { id: number; externalOrderId: number | null; sourceKey?: string | null }[]
): Promise<Map<number, ShopOrderBrief>> {
  const out = new Map<number, ShopOrderBrief>()
  if (!invs.length) return out

  const extIds = Array.from(new Set(invs.map((i) => i.externalOrderId).filter((v): v is number => v != null)))
  const exts = extIds.length
    ? await prisma.externalOrder.findMany({
        where: { id: { in: extIds } },
        select: { id: true, shopOrderId: true, sourceKey: true },
      })
    : []
  const extMap = new Map(exts.map((e) => [e.id, e]))

  const invToOrder = new Map<number, number>()
  for (const iv of invs) {
    const ext = iv.externalOrderId != null ? extMap.get(iv.externalOrderId) : undefined
    const oid = ext?.shopOrderId ?? orderIdFromSourceKey(ext?.sourceKey) ?? orderIdFromSourceKey(iv.sourceKey)
    if (oid) invToOrder.set(iv.id, oid)
  }
  const orderIds = Array.from(new Set(Array.from(invToOrder.values())))
  if (!orderIds.length) return out

  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    select: {
      id: true,
      orderNo: true,
      productId: true,
      productName: true,
      quantity: true,
      amount: true,
      invoiceTaxFee: true,
      couponDiscount: true,
      originalAmount: true,
      payStatus: true,
      deliveryStatus: true,
      referrerId: true,
      createdAt: true,
      paidAt: true,
      deliveredAt: true,
      user: { select: { id: true, email: true, nickname: true } },
    },
  })
  const orderMap = new Map(orders.map((o) => [o.id, o]))
  invToOrder.forEach((oid, invId) => {
    const o = orderMap.get(oid)
    if (!o) return
    out.set(invId, {
      id: o.id,
      orderNo: o.orderNo,
      productId: o.productId,
      productName: o.productName,
      quantity: o.quantity,
      amount: Number(o.amount),
      invoiceTaxFee: num(o.invoiceTaxFee),
      couponDiscount: num(o.couponDiscount),
      originalAmount: num(o.originalAmount),
      payStatus: o.payStatus,
      deliveryStatus: o.deliveryStatus,
      referrerId: o.referrerId,
      createdAt: o.createdAt.toISOString(),
      paidAt: iso(o.paidAt),
      deliveredAt: iso(o.deliveredAt),
      user: o.user,
    })
  })
  return out
}

/**
 * 在某一条外部订单行上开发票之前的「跨行查重」。返回拦截文案；可以开则返回 null。
 *
 * 【为什么需要】一张站内订单可能有两条外部订单行（背书行 order:<id> + 管理员「标记已完成」
 * 导入的 WEB 行）。每条行各自最多一张发票（Invoice.externalOrderId 唯一），但**跨行**没有任何约束：
 * 买家在订单页对背书行申请并付了 6%，再从「邮箱查订阅」对 WEB 行申请，就会被收第二次税、
 * 同一笔货款开出两张票。所有「对外部订单行开票」的入口都要先过这一道。
 *
 * currentExtId：本次要开票的那一行。它自己身上的发票不算「别的」（AWAIT_PAY 的重新提交要能就地更新）。
 * 只能靠 sourceKey 快照找到的孤儿发票：待付税费的那种已经付不了，不拦；已付 / 已提交 / 已开具的照拦。
 */
export async function crossRowInvoiceBlock(shopOrderId: number, currentExtId: number | null): Promise<string | null> {
  const others = (await invoicesForOrder(shopOrderId)).filter((iv) => iv.externalOrderId == null || iv.externalOrderId !== currentExtId)
  if (others.some((iv) => iv.status === 'SUBMITTED' || iv.status === 'ISSUED')) return '该订单已提交过发票申请，请勿重复提交'
  if (others.some((iv) => iv.payStatus === 'PAID')) return '该订单的发票税费已支付，请勿重复提交；如需修改发票信息请联系客服'
  if (others.some((iv) => iv.status === 'CANNOT')) return '该订单暂不可开具发票，请联系客服'
  if (others.some((iv) => iv.status === 'AWAIT_PAY' && !iv.orphan)) {
    return '该订单已有一张待支付税费的发票申请，请在「我的订单」的「开具发票 / 收据」里继续支付那一张'
  }
  return null
}
