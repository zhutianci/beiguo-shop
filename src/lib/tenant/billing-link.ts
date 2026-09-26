/**
 * 票据（发票 / 收据）↔ 站内订单 ↔ 店面 的归属判定（设计 5.5、8.3、9.3；WP3）。
 *
 * 两个方向、全仓只此一处实现：
 *  · findShopOrderForInvoice(invoiceId)：发票 → 站内订单（计提发票分成、RELEASE_INV、补偿扫描、对账共用同一个口径）；
 *  · billingTenantFields(externalOrderId)：建 Invoice / Receipt 时 tenantId、shopOrderId 两列的唯一取值来源
 *    （materializeOrderInvoice、submitInvoiceForExternalOrder、收据两处、超管 by-order 都经它，边界检查第 12 条）。
 *
 * 【为什么不 import lib/order-link】order-link → order-invoice → 本文件，反向引用就成环（webpack 打包顺序一变，
 * 先加载的模块拿到 undefined，线上偶发「x is not a function」，见 order-invoice.ts 顶部说明）。
 * 本文件只依赖 db，`order:<id>` 的解析在这里自己写一份（与 order-link.orderIdFromSourceKey 同一口径）。
 *
 * 【跨站合并一律拒绝】外部订单行的 tenantId 与它指回的站内订单的 tenantId 不一致 = 有人（或 bug）把 A 站的订单
 * 挂到了 B 站的行上。这时抛 CrossTenantBillingError，调用方转成 404 / 409，**绝不**按其中任何一边建票（设计 9.3、对账 A12）。
 */
import type { Prisma } from '@prisma/client'
import { prisma } from '../db'

type Db = Prisma.TransactionClient | typeof prisma

const PLATFORM_TENANT_ID = 1

/** 外部订单行与站内订单不属于同一个店面（或渠道行找不到站内订单）：建票、开票一律拒绝 */
export class CrossTenantBillingError extends Error {
  constructor(message = '该订单不属于本站，不能合并开具票据') {
    super(message)
    this.name = 'CrossTenantBillingError'
  }
}

/** 'order:123' → 123；其他格式 → null（与 order-link.orderIdFromSourceKey 同一口径） */
function orderIdFromKey(key: string | null | undefined): number | null {
  if (!key) return null
  const m = /^order:(\d+)$/.exec(key)
  if (!m) return null
  const id = Number(m[1])
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

/**
 * 发票 → 站内订单。先按 Invoice.shopOrderId（新建票据都写了它）；没有则经外部订单行（shopOrderId 列 / 背书键
 * `order:<id>`）反查；再没有则用发票上的 sourceKey 快照兜底（外部订单行被改键或删除之后唯一剩下的线索）。
 * 找不到站内订单 = 纯站外票据（手工录入、闲鱼导入），返回 null。
 */
export async function findShopOrderForInvoice(
  invoiceId: number,
  db: Db = prisma,
): Promise<{ orderId: number; tenantId: number } | null> {
  if (!Number.isSafeInteger(invoiceId) || invoiceId <= 0) return null
  const inv = await db.invoice.findUnique({
    where: { id: invoiceId },
    select: { shopOrderId: true, externalOrderId: true, sourceKey: true },
  })
  if (!inv) return null
  let orderId: number | null = inv.shopOrderId ?? null
  if (!orderId && inv.externalOrderId) {
    const ext = await db.externalOrder.findUnique({
      where: { id: inv.externalOrderId },
      select: { shopOrderId: true, sourceKey: true },
    })
    orderId = ext?.shopOrderId ?? orderIdFromKey(ext?.sourceKey) ?? null
  }
  if (!orderId) orderId = orderIdFromKey(inv.sourceKey)
  if (!orderId) return null
  const o = await db.order.findUnique({ where: { id: orderId }, select: { id: true, tenantId: true } })
  return o ? { orderId: o.id, tenantId: o.tenantId } : null
}

/**
 * 建 Invoice / Receipt 时 tenantId、shopOrderId 的取值：ExternalOrder 指回的站内订单的 tenantId；
 * 没有站内订单的行（闲鱼 / 腾讯文档导入）= 主站 { 1, null }。
 *
 * 拒绝（抛 CrossTenantBillingError）：
 *  · 外部订单行的 tenantId ≠ 站内订单的 tenantId（跨站合并）；
 *  · 渠道外部订单行（tenantId ≥ 2）却找不到站内订单（渠道行只可能由站内订单派生，找不到只可能是数据被改坏）。
 * 外部订单行不存在时抛普通 Error（调用方此前已查过这一行，走到这里只可能是并发删除）。
 */
export async function billingTenantFields(
  externalOrderId: number,
  db: Db = prisma,
): Promise<{ tenantId: number; shopOrderId: number | null }> {
  const ext = await db.externalOrder.findUnique({
    where: { id: externalOrderId },
    select: { tenantId: true, shopOrderId: true, sourceKey: true },
  })
  if (!ext) throw new Error(`[billing-link] 外部订单 ${externalOrderId} 不存在`)
  const orderId = ext.shopOrderId ?? orderIdFromKey(ext.sourceKey)
  if (!orderId) {
    if (ext.tenantId !== PLATFORM_TENANT_ID) throw new CrossTenantBillingError('该订单记录缺少本站订单关联，暂不能开具票据，请联系客服')
    return { tenantId: PLATFORM_TENANT_ID, shopOrderId: null }
  }
  const o = await db.order.findUnique({ where: { id: orderId }, select: { tenantId: true } })
  if (!o) {
    // 指回的站内订单已不存在（全仓没有删订单的代码，只可能是人工改库）：主站行按旧口径照开，渠道行拒绝
    if (ext.tenantId !== PLATFORM_TENANT_ID) throw new CrossTenantBillingError('该订单记录缺少本站订单关联，暂不能开具票据，请联系客服')
    return { tenantId: PLATFORM_TENANT_ID, shopOrderId: null }
  }
  if (o.tenantId !== ext.tenantId) throw new CrossTenantBillingError()
  return { tenantId: o.tenantId, shopOrderId: orderId }
}
