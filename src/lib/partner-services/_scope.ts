/**
 * 渠道服务函数层的公共约束（设计 6.5.3）。partner-services 里每个函数：
 *  · 第一个参数 tenantId（来自 partnerRoute 查库的结果），先 assertTenantId，再放在 where 顶层；
 *  · 按公开编号寻址，查到后 tenantId 不符按不存在处理（这里直接把 tenantId 写进 where，不存在「先查后比」的窗口）；
 *  · 只用 selects.ts 的白名单；不 include；不接受调用方的 where / orderBy 对象。
 */
import type { Prisma } from '@prisma/client'
import { prisma } from '../db'

/** tenantId 必须是 ≥ 2 的整数（渠道）。主站 id=1、非整数、字符串一律抛——这只可能是 bug，不能静默查成主站数据 */
export function assertTenantId(tenantId: unknown): asserts tenantId is number {
  if (typeof tenantId !== 'number' || !Number.isInteger(tenantId) || tenantId < 2) {
    throw new Error(`[partner-services] tenantId 非法：${String(tenantId)}`)
  }
}

/** orderNo 形状：现有单号是字母数字（schema VarChar(32)）。形状不对直接当不存在，不去查库 */
const ORDER_NO_RE = /^[A-Za-z0-9_-]{1,32}$/

/**
 * 按 orderNo 取本渠道的订单：where { orderNo, tenantId }。不存在与「是别的站的单」同样返回 null（调用方统一 404）。
 * select 由调用方传 selects.ts 里的常量（或 PARTNER_INTERNAL_* 内部键选择器）。
 */
export async function findTenantOrder<S extends Prisma.OrderSelect>(
  tenantId: number,
  orderNo: string,
  select: S,
): Promise<Prisma.OrderGetPayload<{ select: S }> | null> {
  assertTenantId(tenantId)
  if (typeof orderNo !== 'string' || !ORDER_NO_RE.test(orderNo)) return null
  const row = await prisma.order.findFirst({ where: { orderNo, tenantId }, select })
  return row as Prisma.OrderGetPayload<{ select: S }> | null
}
