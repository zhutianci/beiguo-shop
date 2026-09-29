export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import { AdminInputError, updateServiceAdmin } from '@/lib/jiema/admin'

/**
 * 改一个服务（§7.4）：中文名、别名、热门序号、手动下架。改成 OFF 必须填原因、写审计；之后的目录同步不会改回（§5.4）。
 * 手动下架是运维开关，出厂一个都没有（D25：不屏蔽任何平台）。
 */
export async function PUT(request: NextRequest, { params }: { params: { code: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const code = String(params?.code ?? '')
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return error('缺少内容')
    const r = await updateServiceAdmin(code, body)
    const admin = await getCurrentUser()
    const offChanged = r.before.status !== r.after.status
    await writeAudit(null, {
      actorUserId: admin?.id ?? null,
      actorKind: 'PLATFORM',
      action: offChanged ? (r.after.status === 'OFF' ? 'jiema.service.off' : 'jiema.service.on') : 'jiema.service.update',
      targetType: 'sms_service',
      targetId: code,
      reason: typeof r.after.offNote === 'string' ? r.after.offNote : undefined,
      diff: r,
      req: request,
    })
    return success({ ok: true, after: r.after }, '已保存')
  } catch (e) {
    if (e instanceof AdminInputError) return Response.json({ success: false, error: e.message, field: e.field ?? null }, { status: 400 })
    console.error('[jiema] service PUT 失败', e)
    return error('保存失败', 500)
  }
}
