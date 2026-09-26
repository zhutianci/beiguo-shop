/**
 * 渠道后台：售后申请（WP6，设计 5.8、6.5.3、8.4）。
 *
 * 渠道**只能发起申请**（退款 / 补发 / 升级给站长 / 申请全局封禁），审批与执行全在站长后台（WP4）。
 * 本文件只写 TenantAfterSale 一张表，外加 ESCALATE 时 CAS 订单的 escalatedAt——订单其他字段一律不碰。
 *
 * 【同类只能有一个待处理】activeKey 唯一：订单类 `o:{orderId}:{kind}`，封禁 `c:{customerId}:BAN`；处理 / 取消后置 NULL。
 * 并发两次同类申请由唯一约束兜底，后到的 409（W6-10）。
 * 【为什么 create 放在事务第一句、P2002 在事务外判断】Prisma 交互式事务里一条语句报错之后事务还能不能继续，
 * 在 MySQL 上没有验证过（设计 17）；所以唯一冲突让整个事务回滚，在外面按冲突的索引区分「重复申请」与「编号撞车重试」。
 * 【通知站长】提交后推平台企业微信群（alertPlatform，只带渠道 code、订单号、申请号、类型与原因，不带买家邮箱与卡密）。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { writeAudit } from '../audit'
import { alertPlatform } from '../tenant/platform-alert'
import { newRequestNo, parsePublicNo, REQUEST_NO_PATTERN } from '../tenant/public-no'
import type { AfterSaleKind, AfterSaleStatus, Bearer, PartnerAfterSaleRow } from '../tenant/types'
import { assertTenantId, findTenantOrder } from './_scope'
import {
  PARTNER_AFTER_SALE_SELECT,
  PARTNER_INTERNAL_AFTER_SALE_KEY_SELECT,
  PARTNER_INTERNAL_CUSTOMER_NO_SELECT,
  PARTNER_INTERNAL_CUSTOMER_KEY_SELECT,
  PARTNER_INTERNAL_ORDER_KEY_SELECT,
  PARTNER_ORDER_LIST_SELECT,
  PARTNER_TENANT_SELECT,
} from './selects'
import { centsOf, notFoundError, PartnerServiceError } from './orders'

export const ORDER_AFTER_SALE_KINDS = ['REFUND', 'REISSUE', 'ESCALATE'] as const
export type OrderAfterSaleKind = (typeof ORDER_AFTER_SALE_KINDS)[number]
export const BEARERS = ['PROPORTIONAL', 'CHANNEL', 'PLATFORM'] as const
export const AFTER_SALE_STATUSES = ['PENDING', 'REJECTED', 'DONE', 'CANCELLED'] as const
export const AFTER_SALE_KINDS = ['REFUND', 'REISSUE', 'ESCALATE', 'BAN_REQUEST'] as const
export const REASON_MIN = 5
export const REASON_MAX = 500

const KIND_LABEL: Record<AfterSaleKind, string> = {
  REFUND: '申请退款',
  REISSUE: '申请补发',
  ESCALATE: '升级给站长',
  BAN_REQUEST: '申请全局封禁',
}

/** 售后行的内部键：列表要把 orderId 换成 orderNo（selects.ts 的 PARTNER_INTERNAL_AFTER_SALE_KEY_SELECT，D15）。只用于关联，不进 DTO */
const AFTER_SALE_ORDER_KEY_SELECT = PARTNER_INTERNAL_AFTER_SALE_KEY_SELECT

const ORDER_FOR_AFTER_SALE = { ...PARTNER_INTERNAL_ORDER_KEY_SELECT, ...PARTNER_ORDER_LIST_SELECT } as const

function isUniqueConflict(e: unknown): { hit: boolean; target: string } {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
    const t = (e.meta as { target?: unknown } | undefined)?.target
    return { hit: true, target: Array.isArray(t) ? t.join(',') : String(t ?? '') }
  }
  return { hit: false, target: '' }
}

async function tenantCode(tenantId: number): Promise<string> {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: PARTNER_TENANT_SELECT })
  return t?.code ?? `#${tenantId}`
}

function checkReason(reason: string): string {
  const r = String(reason ?? '').trim()
  if (r.length < REASON_MIN || r.length > REASON_MAX) throw new PartnerServiceError(400, `原因需 ${REASON_MIN}–${REASON_MAX} 个字`)
  return r
}

/**
 * 建申请（订单类与封禁共用）。写入与附带动作在同一事务；requestNo 撞车（60 bit 随机，极小概率）换号重试最多 3 次；
 * activeKey 冲突 = 已有同类待处理申请 → 409。
 */
async function createRequest(a: {
  tenantId: number
  userId: number
  kind: AfterSaleKind
  orderId: number | null
  customerId: number | null
  activeKey: string
  reason: string
  suggestedBearer: Bearer | null
  suggestedGoodsCents: number | null
  targetType: 'order' | 'customer'
  targetId: string
  inTx?: (tx: Prisma.TransactionClient) => Promise<void>
  req?: Request
}): Promise<string> {
  // 先查一次：常见的「重复点提交」直接 409，不必让唯一约束报错（Prisma 会把 P2002 打成 prisma:error 日志）。
  // 这只是快速路径，并发时仍以下面的唯一约束为准
  if ((await prisma.tenantAfterSale.count({ where: { activeKey: a.activeKey } })) > 0) {
    throw new PartnerServiceError(409, '该类型已有待处理的申请，请等待站长处理或先取消')
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const requestNo = newRequestNo()
    try {
      await prisma.$transaction(async (tx) => {
        await tx.tenantAfterSale.create({
          data: {
            requestNo,
            tenantId: a.tenantId,
            orderId: a.orderId,
            customerId: a.customerId,
            kind: a.kind,
            activeKey: a.activeKey,
            reason: a.reason,
            suggestedBearer: a.suggestedBearer,
            suggestedGoodsCents: a.suggestedGoodsCents,
            status: 'PENDING',
            requestedBy: a.userId,
          },
        })
        if (a.inTx) await a.inTx(tx)
        await writeAudit(tx, {
          actorKind: 'TENANT',
          actorUserId: a.userId,
          tenantId: a.tenantId,
          action: 'aftersale.request',
          targetType: a.targetType,
          targetId: a.targetId,
          diff: {
            requestNo,
            kind: a.kind,
            reason: a.reason,
            ...(a.suggestedBearer ? { suggestedBearer: a.suggestedBearer } : {}),
            ...(a.suggestedGoodsCents != null ? { suggestedGoodsCents: a.suggestedGoodsCents } : {}),
          },
          req: a.req,
        })
      })
      return requestNo
    } catch (e) {
      const u = isUniqueConflict(e)
      if (u.hit && /active_key|activeKey/.test(u.target)) throw new PartnerServiceError(409, '该类型已有待处理的申请，请等待站长处理或先取消')
      if (u.hit && /request_no|requestNo/.test(u.target)) continue
      throw e
    }
  }
  throw new Error('[partner] 售后申请编号连续冲突')
}

export interface AfterSaleRequestInput {
  kind: OrderAfterSaleKind
  reason: string
  suggestedBearer?: Bearer | null
  /** 建议退多少货款（分）；handler 已把「元」严格解析成分 */
  suggestedGoodsCents?: number | null
}

/** 订单类申请：退款 / 补发 / 升级。不存在 / 不是本渠道 → 404；同类待处理 → 409 */
export async function partnerRequestAfterSale(
  tenantId: number,
  orderNo: string,
  userId: number,
  input: AfterSaleRequestInput,
  req?: Request,
): Promise<{ requestNo: string }> {
  const o = await findTenantOrder(tenantId, orderNo, ORDER_FOR_AFTER_SALE)
  if (!o) throw notFoundError()
  const reason = checkReason(input.reason)
  const kind = input.kind
  if (!(ORDER_AFTER_SALE_KINDS as readonly string[]).includes(kind)) throw new PartnerServiceError(400, '申请类型不正确')
  if ((kind === 'REFUND' || kind === 'REISSUE') && o.payStatus === 'UNPAID') {
    throw new PartnerServiceError(400, '订单尚未付款，无需申请退款或补发')
  }
  const bearer = kind === 'REFUND' && input.suggestedBearer ? input.suggestedBearer : null
  let goods: number | null = null
  if (kind === 'REFUND') {
    // 上限是「还能退的货款」而不是订单全额：部分退款过的单，建议值若按全额校验会超出剩余可退额，
    // 站长后台（WP4）退款弹窗拿它做默认值时就有多退风险。refundedGoodsCents 为 null = 从未退过。
    // payStatus=REFUNDED 只在账本判定「全额退完」时才置（ledger 退款），此时无论字段为何都不再接受退款申请。
    const remaining = centsOf(o.amount) - (o.refundedGoodsCents ?? 0)
    if (o.payStatus === 'REFUNDED' || remaining <= 0) throw new PartnerServiceError(400, '该订单货款已全部退款，无需再申请退款')
    if (input.suggestedGoodsCents != null) {
      goods = input.suggestedGoodsCents
      if (!Number.isSafeInteger(goods) || goods <= 0 || goods > remaining) {
        throw new PartnerServiceError(400, `建议退款金额需大于 0 且不超过剩余可退货款 ${(remaining / 100).toFixed(2)} 元`)
      }
    }
  }

  const requestNo = await createRequest({
    tenantId,
    userId,
    kind,
    orderId: o.id,
    customerId: null,
    activeKey: `o:${o.id}:${kind}`,
    reason,
    suggestedBearer: bearer,
    suggestedGoodsCents: goods,
    targetType: 'order',
    targetId: o.orderNo,
    req,
    // 升级：订单上置 escalatedAt（已置位则不动——站长清除后再升级才会重新置位）；订单其他字段一律不改
    inTx:
      kind === 'ESCALATE'
        ? async (tx) => {
            await tx.order.updateMany({ where: { id: o.id, tenantId, escalatedAt: null }, data: { escalatedAt: new Date() } })
          }
        : undefined,
  })

  const code = await tenantCode(tenantId)
  alertPlatform(`[${code}] ${KIND_LABEL[kind]}：订单 ${o.orderNo}，申请号 ${requestNo}，原因：${reason.slice(0, 200)}`).catch(() => {})
  return { requestNo }
}

/**
 * 申请全局封禁（WP7 客户详情调用；设计 6.2「用户」表）。零订单的本站客户也能申请：orderId=null、customerId 必填，
 * activeKey = c:{customerId}:BAN，不占用任何订单的 ESCALATE 名额。
 * customerNo 不存在 / 不是本渠道的客户 → 抛 PartnerServiceError(404)；已有待处理的封禁申请 → 409。
 */
export async function partnerRequestBan(tenantId: number, customerNo: string, userId: number, reason: string, req?: Request): Promise<{ requestNo: string }> {
  assertTenantId(tenantId)
  const no = parsePublicNo(customerNo)
  if (!no) throw notFoundError()
  const c = await prisma.tenantCustomer.findFirst({ where: { tenantId, publicNo: no }, select: PARTNER_INTERNAL_CUSTOMER_KEY_SELECT })
  if (!c) throw notFoundError()
  const r = checkReason(reason)
  const requestNo = await createRequest({
    tenantId,
    userId,
    kind: 'BAN_REQUEST',
    orderId: null,
    customerId: c.id,
    activeKey: `c:${c.id}:BAN`,
    reason: r,
    suggestedBearer: null,
    suggestedGoodsCents: null,
    targetType: 'customer',
    targetId: no,
    req,
  })
  const code = await tenantCode(tenantId)
  alertPlatform(`[${code}] ${KIND_LABEL.BAN_REQUEST}：客户 ${no}，申请号 ${requestNo}，原因：${r.slice(0, 200)}`).catch(() => {})
  return { requestNo }
}

/** 本渠道售后申请列表（最近 200 条）。筛选只接受枚举值 */
export async function partnerListAfterSales(
  tenantId: number,
  q: { status?: AfterSaleStatus; kind?: AfterSaleKind },
): Promise<PartnerAfterSaleRow[]> {
  assertTenantId(tenantId)
  const rows = await prisma.tenantAfterSale.findMany({
    where: { tenantId, ...(q.status ? { status: q.status } : {}), ...(q.kind ? { kind: q.kind } : {}) },
    select: { ...PARTNER_AFTER_SALE_SELECT, ...AFTER_SALE_ORDER_KEY_SELECT },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
  const orderIds = Array.from(new Set(rows.map((r) => r.orderId).filter((x): x is number => typeof x === 'number')))
  const orders = orderIds.length
    ? await prisma.order.findMany({ where: { tenantId, id: { in: orderIds } }, select: ORDER_FOR_AFTER_SALE })
    : []
  const noById = new Map<number, string>()
  orders.forEach((o) => noById.set(o.id, o.orderNo))
  // 客户编号：只查本渠道的客户行（tenantId 条件），别的渠道的 customerId 即使混进来也换不出编号
  const customerIds = Array.from(new Set(rows.map((r) => r.customerId).filter((x): x is number => typeof x === 'number')))
  const customers = customerIds.length
    ? await prisma.tenantCustomer.findMany({ where: { tenantId, id: { in: customerIds } }, select: PARTNER_INTERNAL_CUSTOMER_NO_SELECT })
    : []
  const cnoById = new Map(customers.map((c) => [c.id, c.publicNo]))
  return rows.map((r) => ({
    requestNo: r.requestNo,
    orderNo: r.orderId != null ? noById.get(r.orderId) ?? null : null,
    customerNo: r.customerId != null ? cnoById.get(r.customerId) ?? null : null,
    kind: r.kind as AfterSaleKind,
    status: r.status as AfterSaleStatus,
    reason: r.reason,
    resultNote: r.resultNote ?? null,
    createdAt: r.createdAt.toISOString(),
    handledAt: r.handledAt ? r.handledAt.toISOString() : null,
  }))
}

/**
 * 取消申请：只对 PENDING 有效（CAS），取消后 activeKey 置 NULL（可以再申请同类）。
 * 不存在 / 他站的 requestNo → 404；存在但已处理 → 409。
 */
export async function partnerCancelAfterSale(tenantId: number, requestNo: string, userId: number, req?: Request): Promise<void> {
  assertTenantId(tenantId)
  const no = String(requestNo ?? '').trim().toUpperCase()
  if (!REQUEST_NO_PATTERN.test(no)) throw notFoundError()
  const done = await prisma.$transaction(async (tx) => {
    const r = await tx.tenantAfterSale.updateMany({
      where: { requestNo: no, tenantId, status: 'PENDING' },
      data: { status: 'CANCELLED', activeKey: null, handledAt: new Date() },
    })
    if (r.count !== 1) return false
    await writeAudit(tx, {
      actorKind: 'TENANT',
      actorUserId: userId,
      tenantId,
      action: 'aftersale.cancel',
      targetType: 'after_sale',
      targetId: no,
      diff: { requestNo: no, from: 'PENDING', to: 'CANCELLED' },
      req,
    })
    return true
  })
  if (done) return
  const exists = await prisma.tenantAfterSale.count({ where: { requestNo: no, tenantId } })
  if (exists === 0) throw notFoundError()
  throw new PartnerServiceError(409, '只能取消待处理的申请')
}
