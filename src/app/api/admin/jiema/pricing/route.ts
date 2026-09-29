export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { pricingPreviewData, listRules } from '@/lib/jiema/admin'

/**
 * 定价页的预览数据（docs/短信接码-设计.md §7.3、D13、Q1）：热门组合（或 ?service=X 的全部国家/地区）的报价成本、
 * 旧单品对照价（0.8 规则一列），以及全部覆盖规则。前端用 lib/jiema/pricing.ts 的纯函数现算「当前 → 新」——
 * 与目录列表价、下单报价是同一个 salePriceCents（§6.3）。成本只在后台出现（adminGuard）。
 */
export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const service = request.nextUrl.searchParams.get('service') || undefined
    if (service && !/^[a-z0-9]{2,4}$/.test(service)) return error('服务代码不合法')
    const [data, rules] = await Promise.all([pricingPreviewData({ service }), listRules()])
    return success({ ...data, rules })
  } catch (e) {
    console.error('[jiema] pricing GET 失败', e)
    return error('读取预览数据失败', 500)
  }
}
