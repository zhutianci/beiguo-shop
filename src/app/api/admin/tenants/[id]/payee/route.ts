export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, currentAdminId, parseIdParam, readJson, revealPayee, setPayee, tenantDetail } from '@/lib/tenant/admin-tenants'

/**
 * 渠道收款信息（设计 5.1、10.10）。GET 只给掩码；PUT 录入 / 变更（加密存储、进入 72 小时冷静期、平台群留痕）；
 * POST { action:'reveal' } 查看明文（每次写审计）——用 POST 而不是 GET：查看明文是有意的动作，不该被预取或地址栏误触发。
 */

const putSchema = z.object({
  name: z.string().trim().min(1).max(80),
  method: z.enum(['ALIPAY', 'BANK', 'WECHAT']),
  account: z.string().trim().min(3).max(64),
})
const postSchema = z.object({ action: z.literal('reveal') })

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  try {
    const { tenant: t } = await tenantDetail(id)
    return success({
      payeeName: t.payeeName,
      payeeMethod: t.payeeMethod,
      payeeAccountMasked: t.payeeAccountMasked,
      hasPayeeAccount: t.hasPayeeAccount,
      payeeChangedAt: t.payeeChangedAt,
      payeeCooldownUntil: t.payeeCooldownUntil,
    })
  } catch (e) {
    return adminFail(e, '收款信息')
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  const body = await readJson(req, putSchema)
  if (body instanceof Response) return body
  try {
    const adminId = await currentAdminId()
    await setPayee(id, body, adminId)
    return success(null, '收款信息已保存，72 小时冷静期内不能出结算单')
  } catch (e) {
    return adminFail(e, '保存收款信息')
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  const body = await readJson(req, postSchema)
  if (body instanceof Response) return body
  try {
    const adminId = await currentAdminId()
    return success({ account: await revealPayee(id, adminId) })
  } catch (e) {
    return adminFail(e, '查看收款账号')
  }
}
