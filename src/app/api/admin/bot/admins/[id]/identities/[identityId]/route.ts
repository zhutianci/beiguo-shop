export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { prisma } from '@/lib/db'
import { auditSoft, currentActor, parseId, readBody } from '@/app/api/admin/bot/_lib/common'
import { toAdminDTO } from '@/app/api/admin/bot/_lib/dto'

/**
 * 停用 / 启用某个管理员的一个微信身份（docs/微信机器人-设计.md §10、§11.7）：body { enabled: boolean }。
 * 管理员手机丢了、微信被盗：先在这里停用那个 wxid（管理员本人的其它微信不受影响），找回微信后让该管理员重新「认领」——
 * 认领时中枢会把这个身份重新启用（lib/bot/inbound.ts 的 tryClaim）。停用后三道闸的第三道立即不认这个 wxid。
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string; identityId: string } }) {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const adminId = parseId(params.id)
    const identityId = parseId(params.identityId)
    if (!adminId || !identityId) return error('编号不对')
    const body = await readBody(request)
    if (!body || typeof body.enabled !== 'boolean') return error('请给出 enabled（开 / 关）')
    const identity = await prisma.botAdminIdentity.findUnique({ where: { id: identityId } })
    if (!identity || identity.adminId !== adminId) return error('找不到这个微信身份', 404)
    const admin = await prisma.botAdmin.findUnique({ where: { id: adminId } })
    if (!admin) return error('找不到这个管理员', 404)
    if (identity.enabled === body.enabled) return success({ admin: await toAdminDTO(admin) }, '没有变化')
    await prisma.botAdminIdentity.update({ where: { id: identityId }, data: { enabled: body.enabled } })
    const actor = await currentActor()
    await auditSoft(request, actor, 'bot.admin.identity', { type: 'bot_admin', id: String(adminId) }, {
      adminId,
      adminName: admin.name,
      identityId,
      wxid: identity.wxid,
      nickname: identity.nickname,
      enabled: body.enabled,
    })
    return success({ admin: await toAdminDTO(admin) }, body.enabled ? '已启用这个微信身份' : '已停用这个微信身份，它发的指令不会再被执行')
  } catch (e) {
    console.error('[bot-admin] 修改微信身份失败', e)
    return error('修改微信身份失败', 500)
  }
}
