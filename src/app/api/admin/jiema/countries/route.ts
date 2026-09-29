export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { listCountriesAdmin } from '@/lib/jiema/admin'

/**
 * 国家/地区目录（docs/短信接码-设计.md §7.4、D44）：id、英文名、中文名（可改；55 / 14 / 20 固定为「中国台湾 / 中国香港 / 中国澳门」只读）、
 * ISO2、区号、状态（ON / OFF 手动下架，出厂全部 ON，含中国 +86，D25）、排序加权。GET ?search=&status=
 */
export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const sp = request.nextUrl.searchParams
    return success({ list: await listCountriesAdmin({ search: sp.get('search') ?? undefined, status: sp.get('status') ?? undefined }) })
  } catch (e) {
    console.error('[jiema] countries GET 失败', e)
    return error('读取国家/地区目录失败', 500)
  }
}
