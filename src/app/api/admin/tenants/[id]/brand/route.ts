export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { adminGuard } from '@/lib/admin-guard'
import { error, success } from '@/lib/api'
import { adminFail, currentAdminId, parseIdParam, readJson } from '@/lib/tenant/admin-tenants'
import { adminBrandDetail, adminResetBrand, adminSetBrandLock } from '@/lib/tenant/admin-brand'

/**
 * 渠道品牌与公告（docs/多渠道分销-渠道品牌与公告.md 第 6 节）。
 *  · GET                       → { brand, announcements }（品牌原值、锁定状态、公告列表）
 *  · POST { action: 'reset' }  恢复默认（七个品牌字段清空，旧 logo 按引用计数删除）
 *  · POST { action: 'lock' | 'unlock' } 锁定 / 解锁渠道的品牌设置
 * 授权：adminGuard（主站店面 + ADMIN 查库复核 + 同源）。
 */
const bodySchema = z.object({ action: z.enum(['reset', 'lock', 'unlock']) }).strict()

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  try {
    return success(await adminBrandDetail(id))
  } catch (e) {
    return adminFail(e, '渠道品牌')
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await adminGuard()
  if (denied) return denied
  const id = parseIdParam(params.id)
  if (!id) return error('渠道不存在', 404)
  const body = await readJson(req, bodySchema)
  if (body instanceof Response) return body
  try {
    const adminId = await currentAdminId()
    if (body.action === 'reset') {
      const r = await adminResetBrand(id, adminId)
      return success(r, r.changed ? '已恢复默认品牌' : '本来就是默认品牌')
    }
    const r = await adminSetBrandLock(id, body.action === 'lock', adminId)
    return success(r, body.action === 'lock' ? '已锁定' : '已解锁')
  } catch (e) {
    return adminFail(e, '修改渠道品牌')
  }
}
