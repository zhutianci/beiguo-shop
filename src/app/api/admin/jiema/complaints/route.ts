export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { listComplaintsAdmin, type ComplaintListState } from '@/lib/jiema/complaint'

/**
 * 后台「售后申请」列表（docs/短信接码-设计.md §7.5）：待处理（OPEN / APPROVING）在前、先到先处理；每条带「该用户 30 天内已通过 N 次」
 * （号码不支持再次收码的不计入，E17）与这张单的号码能不能再次收码。第一行 adminGuard。
 * GET `?state=PENDING|DONE|ALL&page=&pageSize=` → `{ list, total, pendingTotal, page, totalPages }`（pendingTotal 给侧栏与 tab 的红点）。
 */
export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const sp = request.nextUrl.searchParams
    const s = (sp.get('state') || 'PENDING').toUpperCase()
    const state: ComplaintListState = s === 'DONE' || s === 'ALL' ? s : 'PENDING'
    const page = Math.max(parseInt(sp.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(sp.get('pageSize') || '20') || 20, 1), 100)
    const res = success(await listComplaintsAdmin({ state, page, pageSize }))
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (e) {
    console.error('[jiema] admin complaints GET 失败', e)
    return error('读取售后申请失败', 500)
  }
}
