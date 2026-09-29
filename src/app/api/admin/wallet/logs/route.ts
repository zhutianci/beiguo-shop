export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { walletLogs, logsToCsv, shanghaiDay } from '@/lib/wallet/admin-query'

/**
 * 余额流水：?userId &type &from=YYYY-MM-DD &to=YYYY-MM-DD（北京时间，含当天）&orderNo &bizKey（结尾 * = 前缀）&page
 * ?format=csv 导出（最多 5000 行，含两格变动与变动后余额）。后台可见备注与 bizKey。
 */
export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const sp = request.nextUrl.searchParams
    const f = {
      userId: parseInt(sp.get('userId') || '0') || undefined,
      type: (sp.get('type') || '').trim().toUpperCase().slice(0, 20) || undefined,
      from: shanghaiDay(sp.get('from'), false),
      to: shanghaiDay(sp.get('to'), true),
      orderNo: (sp.get('orderNo') || '').trim().slice(0, 40) || undefined,
      bizKey: (sp.get('bizKey') || '').trim().slice(0, 65) || undefined,
      page: parseInt(sp.get('page') || '1') || 1,
      pageSize: parseInt(sp.get('pageSize') || '50') || 50,
    }
    if (sp.get('format') === 'csv') {
      const r = await walletLogs(f, { all: true })
      return new Response(logsToCsv(r.list), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="wallet-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 'no-store',
        },
      })
    }
    return success(await walletLogs(f))
  } catch (e) {
    console.error('[wallet] logs 失败', e)
    return error('获取余额流水失败', 500)
  }
}
