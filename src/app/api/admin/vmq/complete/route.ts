export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { manualComplete, VmqError } from '@/lib/vmq'
import { adminOrResponse, sourceMap, sourceOf } from '@/lib/admin/source-site'

const schema = z.object({ id: z.number().int().positive() })

/**
 * 补单确认弹窗要显示的「这张收款单对应哪个站的哪张单」（设计 12.2：补单确认弹窗显示对应订单的来源站）。
 * 渠道单补单同样走 manualComplete → fulfillOrder → accrueOnPaid（WP3 已覆盖），这里只是让站长点之前看清楚。
 * 不回传 VmqOrder.orderId（买家付款链接里的不可枚举令牌）。
 */
export async function GET(request: NextRequest) {
  const auth = await adminOrResponse()
  if ('res' in auth) return auth.res
  try {
    const id = parseInt(new URL(request.url).searchParams.get('id') || '0')
    if (!Number.isSafeInteger(id) || id <= 0) return error('参数错误')
    const v = await prisma.vmqOrder.findUnique({ where: { id }, select: { id: true, bizType: true, bizId: true, price: true, reallyPrice: true, state: true } })
    if (!v) return notFound('收款单不存在')
    let tenantId = 1
    let orderNo: string | null = null
    let invoiceNo: string | null = null
    if (v.bizType === 'order') {
      const o = await prisma.order.findUnique({ where: { id: v.bizId }, select: { orderNo: true, tenantId: true } })
      if (o) {
        tenantId = o.tenantId
        orderNo = o.orderNo
      }
    } else if (v.bizType === 'invoice') {
      const iv = await prisma.invoice.findUnique({ where: { id: v.bizId }, select: { invoiceNo: true, tenantId: true } })
      if (iv) {
        tenantId = iv.tenantId
        invoiceNo = iv.invoiceNo
      }
    }
    return success({
      id: v.id,
      bizType: v.bizType,
      orderNo,
      invoiceNo,
      price: Number(v.price),
      reallyPrice: Number(v.reallyPrice),
      state: v.state,
      source: sourceOf(await sourceMap([tenantId]), tenantId),
    })
  } catch (err) {
    console.error('Vmq complete preview error:', err)
    return error('查询失败')
  }
}

// 后台手动补单：强制确认某条收款单已到账并履约
export async function POST(request: NextRequest) {
  // 路由内再验一次管理员（CVE-2025-29927）：这个接口能凭空把一张收款单记成「已到账」并发货；渠道 Host → 404
  const auth = await adminOrResponse()
  if ('res' in auth) return auth.res
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error('参数错误')
    await manualComplete(parsed.data.id)
    return success({ id: parsed.data.id }, '已确认到账并完成履约')
  } catch (err) {
    if (err instanceof VmqError) return error(err.message)
    console.error('Vmq manual complete error:', err)
    return error('补单失败')
  }
}
