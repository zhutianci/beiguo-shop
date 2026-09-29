export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import { AdminInputError, deleteRule, updateRule } from '@/lib/jiema/admin'

/** 改 / 删一条定价覆盖规则（§4.3、§7.3）。写审计（前后值） */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const id = Number(params?.id)
    if (!Number.isSafeInteger(id) || id < 1) return error('规则不存在', 404)
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return error('缺少内容')
    const admin = await getCurrentUser()
    const r = await updateRule(id, body, admin?.id ?? null)
    await writeAudit(null, {
      actorUserId: admin?.id ?? null,
      actorKind: 'PLATFORM',
      action: 'jiema.rule.update',
      targetType: 'sms_price_rule',
      targetId: r.after.scopeKey,
      diff: {
        before: { scopeKey: r.before.scopeKey, markupCents: r.before.markupCents, tolerancePct: r.before.tolerancePct, disabled: r.before.disabled, note: r.before.note },
        after: { scopeKey: r.after.scopeKey, markupCents: r.after.markupCents, tolerancePct: r.after.tolerancePct, disabled: r.after.disabled, note: r.after.note },
      },
      req: request,
    })
    return success({ rule: r.after }, '已保存')
  } catch (e) {
    if (e instanceof AdminInputError) return Response.json({ success: false, error: e.message, field: e.field ?? null }, { status: 400 })
    console.error('[jiema] rules PUT 失败', e)
    return error('保存规则失败', 500)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const id = Number(params?.id)
    if (!Number.isSafeInteger(id) || id < 1) return error('规则不存在', 404)
    const cur = await deleteRule(id)
    const admin = await getCurrentUser()
    await writeAudit(null, {
      actorUserId: admin?.id ?? null,
      actorKind: 'PLATFORM',
      action: 'jiema.rule.delete',
      targetType: 'sms_price_rule',
      targetId: cur.scopeKey,
      diff: { before: { scopeKey: cur.scopeKey, markupCents: cur.markupCents, tolerancePct: cur.tolerancePct, disabled: cur.disabled, note: cur.note } },
      req: request,
    })
    return success({ ok: true }, '已删除')
  } catch (e) {
    if (e instanceof AdminInputError) return Response.json({ success: false, error: e.message }, { status: 400 })
    console.error('[jiema] rules DELETE 失败', e)
    return error('删除规则失败', 500)
  }
}
