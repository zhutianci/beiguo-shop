export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { excludeTopup } from '@/lib/order-scope'
import { pendingComplaintCount } from '@/lib/jiema/complaint'

/**
 * 后台「待办」计数（控制台改版 2026-10-13）：顶栏待办中心与侧栏红点共用这一个接口。
 *
 * 原来侧栏红点各拉一个列表接口（售后申请、接码售后，各自是好几条查询外加一页列表），只为了里面的 pendingTotal。
 * 这里只做 5 个 count，全部走索引 / 小表，页面每 60 秒拉一次。任何一项读失败都按 0 给，不让整个顶栏因此没数。
 *
 *  · processing   已付款、还在「处理中」的订单（等人工发货 / 补发），不含余额充值单
 *  · unreplied    有买家留言还没读的订单数（与订单列表「只看未回复」同一条件）
 *  · invoices     已提交、等开具的发票
 *  · afterSales   渠道售后申请待处理
 *  · jiemaComplaints 短信接码售后待处理
 */
export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const safe = (p: Promise<number>) => p.catch(() => 0)
    const [processing, unreplied, invoices, afterSales, jiemaComplaints] = await Promise.all([
      safe(prisma.order.count({ where: { payStatus: 'PAID', deliveryStatus: 'PROCESSING', ...excludeTopup() } })),
      safe(prisma.order.count({ where: { messages: { some: { sender: 'BUYER', readByAdmin: false } } } })),
      safe(prisma.invoice.count({ where: { status: 'SUBMITTED' } })),
      safe(prisma.tenantAfterSale.count({ where: { status: 'PENDING' } })),
      safe(pendingComplaintCount()),
    ])
    return success({ processing, unreplied, invoices, afterSales, jiemaComplaints })
  } catch (err) {
    console.error('Get admin todo error:', err)
    return error('获取待办失败')
  }
}
