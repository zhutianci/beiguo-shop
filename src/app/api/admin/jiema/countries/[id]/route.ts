export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import { AdminInputError, updateCountryAdmin } from '@/lib/jiema/admin'

/** 改一个国家/地区（§7.4）：中文名（55 / 14 / 20 只读，D44）、ISO2、区号、排序加权、手动下架（要填原因、写审计） */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const id = Number(params?.id)
    if (!Number.isSafeInteger(id)) return error('国家/地区不存在', 404)
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return error('缺少内容')
    const r = await updateCountryAdmin(id, body)
    // 提交的值与现在的一样：没有写库，也不写审计
    if (!r.changed) return success({ ok: true, after: r.after, changed: false }, '没有改动')
    const admin = await getCurrentUser()
    const offChanged = r.before.status !== r.after.status
    await writeAudit(null, {
      actorUserId: admin?.id ?? null,
      actorKind: 'PLATFORM',
      action: offChanged ? (r.after.status === 'OFF' ? 'jiema.country.off' : 'jiema.country.on') : 'jiema.country.update',
      targetType: 'sms_country',
      targetId: String(id),
      reason: typeof r.after.offNote === 'string' ? r.after.offNote : undefined,
      diff: { before: r.before, after: r.after },
      req: request,
    })
    return success({ ok: true, after: r.after }, '已保存')
  } catch (e) {
    if (e instanceof AdminInputError) return Response.json({ success: false, error: e.message, field: e.field ?? null }, { status: 400 })
    console.error('[jiema] country PUT 失败', e)
    return error('保存失败', 500)
  }
}
