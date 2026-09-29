export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import { AdminInputError, createAdminHold, deleteHold, listHolds } from '@/lib/jiema/admin'

/**
 * 停售（sms_holds，docs/短信接码-设计.md §5.2、§6.1、§7.1「停售规则」）。与余额预扣 balance_holds 无关。
 * GET 全部（含自动停售，S2 起才会有）；POST { key, note, until? }「+ 手动停售」（reason=ADMIN、source=ADMIN、必须写原因）；
 * DELETE ?key= 「解除」。出厂一条都没有（附录 B 第 26 条）；上游余额不设停售（Q4），这里也不提供那类原因。改动写审计。
 */
export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    return success({ list: await listHolds() })
  } catch (e) {
    console.error('[jiema] holds GET 失败', e)
    return error('读取停售失败', 500)
  }
}

export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return error('缺少内容')
    const r = await createAdminHold(body)
    const admin = await getCurrentUser()
    await writeAudit(null, {
      actorUserId: admin?.id ?? null,
      actorKind: 'PLATFORM',
      action: 'jiema.hold.create',
      targetType: 'sms_hold',
      targetId: r.after.key,
      reason: r.after.note ?? undefined,
      diff: { before: r.before, after: r.after },
      req: request,
    })
    return success({ hold: { key: r.after.key, until: r.after.until?.toISOString() ?? null } }, '已停售')
  } catch (e) {
    if (e instanceof AdminInputError) return Response.json({ success: false, error: e.message, field: e.field ?? null }, { status: 400 })
    console.error('[jiema] holds POST 失败', e)
    return error('保存失败', 500)
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const key = request.nextUrl.searchParams.get('key') ?? ''
    if (!key || key.length > 32) return error('缺少停售范围')
    const cur = await deleteHold(key)
    const admin = await getCurrentUser()
    await writeAudit(null, { actorUserId: admin?.id ?? null, actorKind: 'PLATFORM', action: 'jiema.hold.delete', targetType: 'sms_hold', targetId: key, diff: { before: cur }, req: request })
    return success({ ok: true }, '已解除')
  } catch (e) {
    if (e instanceof AdminInputError) return error(e.message)
    console.error('[jiema] holds DELETE 失败', e)
    return error('解除失败', 500)
  }
}
