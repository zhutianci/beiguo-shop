export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import { SMS_OPERATOR_NAMES_KEY } from '@/lib/jiema/config'
import { operatorDisplayName, readOperatorNames } from '@/lib/jiema/catalog'
import { AdminInputError, validateOperatorNames } from '@/lib/jiema/admin'

/**
 * 运营商显示名（docs/短信接码-设计.md §1.7、§7.4）：代码 → 显示名的映射，存 settings.sms_operator_names。
 * GET：全部已知运营商代码（每天同步的 getOperators）+ 当前显示名 + 后台自定义了哪些；PUT { names }：整份覆盖（写审计）。
 */
export async function GET() {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const [custom, ops] = await Promise.all([readOperatorNames(), prisma.smsOfferCache.findUnique({ where: { service_kind: { service: '*', kind: 'OPS' } }, select: { data: true, fetchedAt: true } })])
    let byCountry: Record<string, string[]> = {}
    try {
      byCountry = ops?.data ? (JSON.parse(ops.data) as Record<string, string[]>) : {}
    } catch {
      byCountry = {}
    }
    const counts = new Map<string, number>()
    for (const list of Object.values(byCountry)) for (const c of Array.isArray(list) ? list : []) counts.set(c, (counts.get(c) ?? 0) + 1)
    const codes = Array.from(new Set([...Array.from(counts.keys()), ...Object.keys(custom)])).sort()
    return success({
      list: codes.map((code) => ({ code, name: operatorDisplayName(code, custom), custom: custom[code] ?? null, countries: counts.get(code) ?? 0 })),
      fetchedAt: ops?.fetchedAt?.toISOString() ?? null,
    })
  } catch (e) {
    console.error('[jiema] operators GET 失败', e)
    return error('读取运营商失败', 500)
  }
}

export async function PUT(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const body = (await request.json().catch(() => null)) as { names?: unknown } | null
    const names = validateOperatorNames(body?.names)
    const before = await readOperatorNames()
    const value = JSON.stringify(names)
    await prisma.setting.upsert({ where: { key: SMS_OPERATOR_NAMES_KEY }, create: { key: SMS_OPERATOR_NAMES_KEY, value }, update: { value } })
    const admin = await getCurrentUser()
    await writeAudit(null, { actorUserId: admin?.id ?? null, actorKind: 'PLATFORM', action: 'jiema.operators', targetType: 'setting', targetId: SMS_OPERATOR_NAMES_KEY, diff: { before, after: names }, req: request })
    return success({ names }, '已保存')
  } catch (e) {
    if (e instanceof AdminInputError) return error(e.message)
    console.error('[jiema] operators PUT 失败', e)
    return error('保存失败', 500)
  }
}
