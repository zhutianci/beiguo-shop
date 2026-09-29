export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { walletTopups, type TopupState } from '@/lib/wallet/admin-query'

const STATES: TopupState[] = ['all', 'pending', 'credited', 'closed']

/** 充值单（TOPUP 载体订单）：?state=pending|credited|closed|all。B1 上线前恒为空，tab 在有数据后自然出现 */
export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const sp = request.nextUrl.searchParams
    const s = (sp.get('state') || 'all') as TopupState
    return success(await walletTopups({ state: STATES.includes(s) ? s : 'all', page: parseInt(sp.get('page') || '1') || 1 }))
  } catch (e) {
    console.error('[wallet] topups 失败', e)
    return error('获取充值单失败', 500)
  }
}
