export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { walletUsers, type UserSort } from '@/lib/wallet/admin-query'

const SORTS: UserSort[] = ['total', 'topup', 'cash', 'held', 'recent']

/** 用户余额列表：?q=邮箱/昵称/ID &sort=total|topup|cash|held|recent &page */
export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const sp = request.nextUrl.searchParams
    const sortRaw = (sp.get('sort') || 'total') as UserSort
    return success(
      await walletUsers({
        q: sp.get('q') || '',
        sort: SORTS.includes(sortRaw) ? sortRaw : 'total',
        page: parseInt(sp.get('page') || '1') || 1,
        pageSize: parseInt(sp.get('pageSize') || '20') || 20,
      }),
    )
  } catch (e) {
    console.error('[wallet] users 失败', e)
    return error('获取用户余额失败', 500)
  }
}
