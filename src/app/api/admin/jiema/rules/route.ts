export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import { AdminInputError, createRule, listRules } from '@/lib/jiema/admin'

/**
 * 定价覆盖规则（docs/短信接码-设计.md §4.3、§7.3）。scopeKey：服务:国家 > 服务:* > *:国家；可覆盖加价 y、容差、停售（disabled，要写备注）。
 * 售价系数与成本汇率只有全局一个值，不在规则里。出厂一条规则都没有（D25）；dr、acz 的 0.8 规则由站长上线前配。改动写审计。
 */
export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    return success({ rules: await listRules() })
  } catch (e) {
    console.error('[jiema] rules GET 失败', e)
    return error('读取规则失败', 500)
  }
}

export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return error('缺少内容')
    const admin = await getCurrentUser()
    const r = await createRule(body, admin?.id ?? null)
    await writeAudit(null, {
      actorUserId: admin?.id ?? null,
      actorKind: 'PLATFORM',
      action: 'jiema.rule.create',
      targetType: 'sms_price_rule',
      targetId: r.scopeKey,
      diff: { after: { scopeKey: r.scopeKey, markupCents: r.markupCents, tolerancePct: r.tolerancePct, disabled: r.disabled, note: r.note } },
      req: request,
    })
    return success({ rule: r }, '已新增')
  } catch (e) {
    if (e instanceof AdminInputError) return Response.json({ success: false, error: e.message, field: e.field ?? null }, { status: 400 })
    console.error('[jiema] rules POST 失败', e)
    return error('保存规则失败', 500)
  }
}
