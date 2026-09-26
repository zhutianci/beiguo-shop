export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, ledgerAdmin, parseIdParam } from '@/lib/tenant/admin-tenants'
import { LEDGER_COMPONENTS, LEDGER_TYPES, type LedgerComponent, type LedgerType } from '@/lib/tenant/types'

/** 渠道流水（超管完整版：含 eventKey、内部 memo、操作人）。筛选参数只接受枚举值，不透传到 where */

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  const u = new URL(req.url)
  const page = Math.max(1, Number.parseInt(u.searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(u.searchParams.get('pageSize') || '50', 10) || 50))
  const type = u.searchParams.get('type') || ''
  const component = u.searchParams.get('component') || ''
  const from = u.searchParams.get('from') ? new Date(u.searchParams.get('from') as string) : undefined
  const to = u.searchParams.get('to') ? new Date(u.searchParams.get('to') as string) : undefined
  try {
    return success(
      await ledgerAdmin(id, {
        page,
        pageSize,
        type: (LEDGER_TYPES as readonly string[]).includes(type) ? (type as LedgerType) : undefined,
        component: (LEDGER_COMPONENTS as readonly string[]).includes(component) ? (component as LedgerComponent) : undefined,
        from: from && !Number.isNaN(from.getTime()) ? from : undefined,
        to: to && !Number.isNaN(to.getTime()) ? to : undefined,
      }),
    )
  } catch (e) {
    return adminFail(e, '渠道流水')
  }
}
