export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import { AdminInputError, exportServicesCsv, importServicesCsv, listServicesAdmin } from '@/lib/jiema/admin'

/**
 * 服务目录（docs/短信接码-设计.md §7.4）：代码、英文名、中文名、别名、热门序号、状态（ON / OFF 手动下架，出厂全部 ON，D25）、
 * 有货国家/地区数、最低报价成本。GET ?search=&status=&hot=1&page= ；?format=csv 导出。
 * POST { csv }：批量导入中文名 / 别名 / 热门序号（下架要逐个填原因，不走批量）；每个改动写审计。
 */
export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const sp = request.nextUrl.searchParams
    if (sp.get('format') === 'csv') {
      const csv = await exportServicesCsv()
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="jiema-services-${new Date().toISOString().slice(0, 10)}.csv"`,
          'Cache-Control': 'no-store',
        },
      })
    }
    const r = await listServicesAdmin({
      search: sp.get('search') ?? undefined,
      status: sp.get('status') ?? undefined,
      hot: sp.get('hot') === '1',
      page: Number(sp.get('page')) || 1,
      pageSize: Number(sp.get('pageSize')) || 50,
    })
    return success(r)
  } catch (e) {
    console.error('[jiema] services GET 失败', e)
    return error('读取服务目录失败', 500)
  }
}

export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const body = (await request.json().catch(() => null)) as { csv?: unknown } | null
    if (!body || typeof body.csv !== 'string') return error('缺少 CSV 内容')
    const r = await importServicesCsv(body.csv)
    const admin = await getCurrentUser()
    for (const c of r.changes.slice(0, 500)) {
      await writeAudit(null, { actorUserId: admin?.id ?? null, actorKind: 'PLATFORM', action: 'jiema.service.csv', targetType: 'sms_service', targetId: c.code, diff: { before: c.before, after: c.after }, req: request })
    }
    return success({ updated: r.updated, skipped: r.skipped }, `已导入 ${r.updated} 个服务`)
  } catch (e) {
    if (e instanceof AdminInputError) return error(e.message)
    console.error('[jiema] services POST 失败', e)
    return error('导入失败', 500)
  }
}
