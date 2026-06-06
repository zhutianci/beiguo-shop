export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { closeExpired, VMQ_TIMEOUT_MIN } from '@/lib/vmq'

// 收银台轮询 / 初始化：返回订单展示信息与支付状态
export async function GET(request: NextRequest) {
  try {
    // 顺带清理过期单（即使监控端离线也能让收银台正确显示过期）
    await closeExpired()

    const orderId = new URL(request.url).searchParams.get('orderId')?.trim()
    if (!orderId) return error('缺少订单号')

    const o = await prisma.vmqOrder.findUnique({ where: { orderId } })
    if (!o) return error('订单不存在', 404)

    return success({
      orderId: o.orderId,
      bizType: o.bizType,
      price: Number(o.price),
      reallyPrice: Number(o.reallyPrice),
      type: o.type,
      state: o.state, // 0 待支付 1 已支付 -1 已过期
      createdAt: o.createdAt,
      timeoutMin: VMQ_TIMEOUT_MIN,
      payDate: o.payDate,
    })
  } catch (err) {
    console.error('Vmq status error:', err)
    return error('查询失败')
  }
}
