export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { submitIlinkBindCode } from '@/lib/bot/ilink-bind'
import { readBody } from '@/app/api/admin/bot/_lib/common'

/** 微信要求「配对码」时（附录 E）：提交手机微信上显示的数字，下一轮轮询带上 */
export async function POST(request: NextRequest) {
  const deny = await adminGuard()
  if (deny) return deny
  const body = await readBody(request)
  const id = typeof body?.id === 'string' ? body.id : ''
  const code = typeof body?.code === 'string' ? body.code.trim() : ''
  if (!/^[0-9a-f]{24}$/.test(id)) return error('参数不对')
  const r = submitIlinkBindCode(id, code)
  if (!r.ok) return error(r.error, 409)
  return success({ ok: true })
}
