export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { listJiemaOrdersAdmin } from '@/lib/jiema/admin-orders'
import { shanghaiDay } from '@/lib/wallet/admin-query'

/**
 * 后台「接码订单」列表（docs/短信接码-设计.md §7.2）：按状态（含 MANUAL / REFUNDING / CANCELLED 快捷筛选、ACTIVE = 进行中）、付款方式、
 * 服务、国家、日期（北京时间 YYYY-MM-DD）、用户（邮箱或 id）、订单号或号码筛选；每行带付款拆分、尝试数、实际扣费、真实成本、毛利
 * （已取消单成本利润落空 = 「不计」；未定稿 = 「预估」）；页脚合计当前筛选的营收、真实成本、毛利（report.listFooter）。第一行 adminGuard。
 */
export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const sp = request.nextUrl.searchParams
    const page = Math.max(parseInt(sp.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(sp.get('pageSize') || '20') || 20, 1), 100)
    const country = sp.get('country')
    const from = sp.get('from')
    const to = sp.get('to')
    const data = await listJiemaOrdersAdmin({
      state: sp.get('state'),
      payMode: sp.get('payMode'),
      service: (sp.get('service') || '').toLowerCase() || null,
      country: country && /^\d{1,3}$/.test(country) ? Number(country) : null,
      from: shanghaiDay(from, false) ?? null,
      to: shanghaiDay(to, true) ?? null,
      user: sp.get('user'),
      q: sp.get('q'),
      page,
      pageSize,
    })
    const res = success(data)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (e) {
    console.error('[jiema] admin orders GET 失败', e)
    return error('读取接码订单失败', 500)
  }
}
