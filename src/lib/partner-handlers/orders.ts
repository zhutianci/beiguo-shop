/**
 * 渠道后台 handler：订单（列表 / 导出 / 详情 / 交付凭据 / 留言 / 已读 / 发起售后）。WP6，实施分包 9.4。
 *
 * route.ts 只做 `export const GET = partnerRoute('order.read', listOrders)`，授权全在 partnerRoute；这里只：
 *  1. 把 query / body 解析成**枚举化、写死字段**的入参（zod 默认丢弃未知键：body 里塞 tenantId、supplyCents 也到不了服务层，T8）；
 *  2. 调 partner-services 里有名字的函数，tenantId 只取 ctx.tenantId（partnerRoute 查库得到），绝不从请求里读；
 *  3. 统一出口：成功 { success:true, data }；业务错误 { success:false, error }；不存在与无权同一个 404 响应体。
 * 本目录只能 import 自身、partner-services、tenant/{types,perms,math}、src/lib/api、next/server、zod（边界检查规则 2）。
 */
import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { yuanToCents } from '../tenant/math'
import { OWNER_ONLY_PERMS, type PartnerPerm } from '../tenant/perms'
import { notFound404, pageParams, parseBody, toCsv } from './_http'
import {
  cnDayStart,
  DELIVERY_STATUSES,
  PAY_STATUSES,
  PartnerServiceError,
  partnerExportOrders,
  partnerListOrders,
  partnerOrderDetail,
  SETTLE_FILTERS,
  type PartnerOrderFilter,
} from '../partner-services/orders'
import { partnerOrderDelivery } from '../partner-services/order-cards'
import { MESSAGE_MAX_LEN, partnerListMessages, partnerMarkRead, partnerPostMessage } from '../partner-services/messages'
import { BEARERS, ORDER_AFTER_SALE_KINDS, partnerRequestAfterSale, REASON_MAX, REASON_MIN } from '../partner-services/after-sales'

/**
 * partnerRoute 传进来的上下文（结构与 tenant/partner-route 的 PartnerCtx 一致；本目录不 import partner-route，
 * 所以只声明用得到的字段，TypeScript 按结构兼容）。
 */
export interface HandlerCtx {
  tenantId: number
  userId: number
  role: 'OWNER' | 'STAFF'
  /** 本次请求成员的有效权限点（OWNER = 全部）。看板要按它决定给不给财务数字（finance.read） */
  perms: ReadonlySet<PartnerPerm>
  readOnly: boolean
  requestId: string
}

/**
 * 本次请求能不能看账户级 / 逐单的财务数字（余额、预计打款、手续费、所属结算单）。口径与 partnerRoute 完全相同：
 * 持有 finance.read，且该点不在 OWNER_ONLY_PERMS 或本人是 OWNER（D5）。看板与订单详情共用，免得两处口径漂移——
 * 只裁看板不裁订单详情的话，STAFF 逐单加总就能还原被 D5 隐藏的时段数字（终审隔离 #3）。
 */
export function hasFinanceRead(ctx: HandlerCtx): boolean {
  return ctx.perms.has('finance.read') && (ctx.role === 'OWNER' || !OWNER_ONLY_PERMS.has('finance.read'))
}

// ============================================================================
// 统一出口
// ============================================================================

export function ok(data: unknown, status = 200): Response {
  return NextResponse.json({ success: true, data }, { status })
}
export function noContent(): Response {
  return new NextResponse(null, { status: 204 })
}
export function fail(message: string, status = 400, extra?: Record<string, unknown>): Response {
  return NextResponse.json({ success: false, error: message, ...(extra ?? {}) }, { status })
}

/** 服务层异常 → 响应。未知异常 500（不回显细节，只记日志） */
export async function run(tag: string, fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn()
  } catch (e) {
    // 按名字与形状识别（不只靠 instanceof）：同一模块在不同路由包里可能各有一份类定义
    if (e instanceof PartnerServiceError || (e as { name?: unknown })?.name === 'PartnerServiceError') {
      const se = e as PartnerServiceError
      if (se.status === 404) return notFound404()
      return fail(se.message, se.status, se.extra)
    }
    console.error(`[partner] ${tag} 失败`, e)
    return fail('服务暂时不可用，请稍后重试', 500)
  }
}

// ============================================================================
// 查询参数
// ============================================================================

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** 'YYYY-MM-DD'（东八区日期）→ 当天 00:00 的 UTC 时刻；endOfDay=true 给当天 23:59:59.999 */
export function parseCnDate(raw: string | null, endOfDay = false): Date | undefined | 'BAD' {
  if (!raw) return undefined
  const m = DATE_RE.exec(raw.trim())
  if (!m) return 'BAD'
  const utc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
  if (Number.isNaN(utc)) return 'BAD'
  const start = cnDayStart(new Date(utc))
  return endOfDay ? new Date(start.getTime() + 24 * 3600_000 - 1) : start
}

function pick<T extends string>(raw: string | null, allowed: readonly T[]): T | undefined | 'BAD' {
  if (raw === null || raw === '') return undefined
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : 'BAD'
}

/** 订单列表与导出共用的筛选解析；返回字符串 = 400 文案 */
export function parseOrderFilter(url: URL): PartnerOrderFilter | string {
  const sp = url.searchParams
  const f: PartnerOrderFilter = {}
  const s = (k: string) => {
    const v = sp.get(k)
    return v === null || v.trim() === '' ? undefined : v.trim()
  }
  f.orderNo = s('orderNo')
  f.email = s('email')
  f.card = s('card')
  const pid = s('productId')
  if (pid !== undefined) {
    if (!/^\d{1,9}$/.test(pid)) return '商品参数不正确'
    f.productId = Number(pid)
  }
  // 商品筛选：渠道侧用上架编号（listingNo），服务端换算成 productId（设计 12.1「按商品搜索」）
  const lno = s('listingNo')
  if (lno !== undefined) {
    if (!/^[A-Za-z0-9]{1,32}$/.test(lno)) return '商品参数不正确'
    f.listingNo = lno
  }
  const unread = s('unread')
  if (unread !== undefined) {
    if (unread !== '1') return '未读参数不正确'
    f.unread = true
  }
  const pay = pick(sp.get('payStatus'), PAY_STATUSES)
  if (pay === 'BAD') return '支付状态参数不正确'
  f.payStatus = pay
  const del = pick(sp.get('deliveryStatus'), DELIVERY_STATUSES)
  if (del === 'BAD') return '交付状态参数不正确'
  f.deliveryStatus = del
  const settle = pick(sp.get('settle'), SETTLE_FILTERS)
  if (settle === 'BAD') return '结算状态参数不正确'
  f.settle = settle
  const inv = pick(sp.get('invoice'), ['yes', 'no'] as const)
  if (inv === 'BAD') return '开票参数不正确'
  f.invoice = inv
  const as = pick(sp.get('afterSale'), ['pending', 'any', 'none'] as const)
  if (as === 'BAD') return '售后参数不正确'
  f.afterSale = as
  const from = parseCnDate(sp.get('from'))
  const to = parseCnDate(sp.get('to'), true)
  if (from === 'BAD' || to === 'BAD') return '日期格式应为 YYYY-MM-DD'
  f.from = from
  f.to = to
  return f
}

// ============================================================================
// handlers
// ============================================================================

/** GET /api/partner/orders */
export async function listOrders(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('订单列表', async () => {
    const url = new URL(req.url)
    const f = parseOrderFilter(url)
    if (typeof f === 'string') return fail(f)
    const { page, pageSize } = pageParams(url)
    const r = await partnerListOrders(ctx.tenantId, { ...f, page, pageSize })
    return ok({ total: r.total, rows: r.rows, page, pageSize })
  })
}

/** GET /api/partner/orders/export（OWNER；每日 10 次；≤ 5000 行；水印；不含任何交付凭据） */
export async function exportOrders(req: NextRequest, ctx: HandlerCtx): Promise<Response> {
  return run('订单导出', async () => {
    const f = parseOrderFilter(new URL(req.url))
    if (typeof f === 'string') return fail(f)
    const r = await partnerExportOrders(ctx.tenantId, ctx.userId, f, req)
    const csv = toCsv(r.rows, r.header, r.watermark)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${r.filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  })
}

/** GET /api/partner/orders/[orderNo] */
export async function orderDetail(req: NextRequest, ctx: HandlerCtx, params: Record<string, string>): Promise<Response> {
  return run('订单详情', async () => {
    const d = await partnerOrderDetail(ctx.tenantId, params.orderNo ?? '', ctx.userId, req, { withFinance: hasFinanceRead(ctx) })
    return d ? ok(d) : notFound404()
  })
}

/** GET /api/partner/orders/[orderNo]/cards（交付凭据；每次 card.view 审计） */
export async function orderCards(req: NextRequest, ctx: HandlerCtx, params: Record<string, string>): Promise<Response> {
  return run('交付凭据', async () => {
    const d = await partnerOrderDelivery(ctx.tenantId, params.orderNo ?? '', ctx.userId, req)
    if (!d) return notFound404()
    const res = ok(d)
    res.headers.set('Cache-Control', 'no-store')
    return res
  })
}

/** GET /api/partner/orders/[orderNo]/messages */
export async function listMessages(_req: NextRequest, ctx: HandlerCtx, params: Record<string, string>): Promise<Response> {
  return run('留言列表', async () => {
    const rows = await partnerListMessages(ctx.tenantId, params.orderNo ?? '', ctx.userId)
    return rows ? ok({ rows }) : notFound404()
  })
}

const messageSchema = z.object({ messageText: z.string().trim().min(1, '请输入回复内容').max(MESSAGE_MAX_LEN, `最多 ${MESSAGE_MAX_LEN} 个字`) })

/** POST /api/partner/orders/[orderNo]/messages → 201 */
export async function postMessage(req: NextRequest, ctx: HandlerCtx, params: Record<string, string>): Promise<Response> {
  return run('回复留言', async () => {
    const b = await parseBody(req, messageSchema)
    if (b instanceof Response) return b
    const done = await partnerPostMessage(ctx.tenantId, params.orderNo ?? '', ctx.userId, b.messageText, req)
    return done ? ok(null, 201) : notFound404()
  })
}

/** POST /api/partner/orders/[orderNo]/read → 204 */
export async function markRead(_req: NextRequest, ctx: HandlerCtx, params: Record<string, string>): Promise<Response> {
  return run('留言已读', async () => {
    const done = await partnerMarkRead(ctx.tenantId, params.orderNo ?? '')
    return done ? noContent() : notFound404()
  })
}

const afterSaleSchema = z.object({
  kind: z.enum(ORDER_AFTER_SALE_KINDS),
  reason: z.string().trim().min(REASON_MIN, `原因至少 ${REASON_MIN} 个字`).max(REASON_MAX, `原因最多 ${REASON_MAX} 个字`),
  suggestedBearer: z.enum(BEARERS).optional().nullable(),
  suggestedGoodsYuan: z.union([z.string(), z.number()]).optional().nullable(),
})

/** POST /api/partner/orders/[orderNo]/after-sales → { requestNo } | 409 */
export async function requestAfterSale(req: NextRequest, ctx: HandlerCtx, params: Record<string, string>): Promise<Response> {
  return run('发起售后', async () => {
    const b = await parseBody(req, afterSaleSchema)
    if (b instanceof Response) return b
    let goods: number | null = null
    if (b.suggestedGoodsYuan !== undefined && b.suggestedGoodsYuan !== null && String(b.suggestedGoodsYuan).trim() !== '') {
      try {
        goods = yuanToCents(b.suggestedGoodsYuan)
      } catch {
        return fail('建议退款金额格式不正确（最多两位小数）')
      }
    }
    const r = await partnerRequestAfterSale(
      ctx.tenantId,
      params.orderNo ?? '',
      ctx.userId,
      { kind: b.kind, reason: b.reason, suggestedBearer: b.suggestedBearer ?? null, suggestedGoodsCents: goods },
      req,
    )
    return ok(r)
  })
}
