export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { prisma } from '@/lib/db'
import { auditSoft, cleanText, currentActor, intIn, parseId, readBody } from '@/app/api/admin/bot/_lib/common'
import { toAdminDTO } from '@/app/api/admin/bot/_lib/dto'

/**
 * 改管理员（docs/微信机器人-设计.md §7.1、§10、§14）：body 里给哪项改哪项——
 *  · enabled：false = **停用**。三道闸的第三道认 bot_admins.enabled，停用立即生效（该管理员的微信身份全部失效）；
 *    停用时顺手清掉没用完的认领码、作废该管理员名下还没用的补货链接（手机丢了 / 微信被盗的处置，§11.7）；
 *    true = 重新启用（该管理员的微信身份原样恢复；怀疑微信被盗的，请先在「微信身份」里停用旧身份，再重新认领）；
 *  · maxTier：该管理员最高能用的指令级别 0–3；
 *  · name：名称。
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const id = parseId(params.id)
    if (!id) return error('管理员编号不对')
    const body = await readBody(request)
    if (!body) return error('请求体不是 JSON 对象')
    const cur = await prisma.botAdmin.findUnique({ where: { id } })
    if (!cur) return error('找不到这个管理员', 404)

    const data: { name?: string; maxTier?: number; enabled?: boolean; claimCodeHash?: null; claimExpiresAt?: null } = {}
    const changes: Record<string, { from: unknown; to: unknown }> = {}

    if (body.name !== undefined) {
      const name = cleanText(body.name, 40)
      if (!name) return error('管理员名称不能为空')
      if (name !== cur.name) {
        if (await prisma.botAdmin.findFirst({ where: { name, id: { not: id } }, select: { id: true } })) return error('已经有同名的管理员了，请换一个名称', 409)
        data.name = name
        changes.name = { from: cur.name, to: name }
      }
    }
    if (body.maxTier !== undefined) {
      const t = intIn(body.maxTier, 0, 3)
      if (t === null) return error('最高级别只能是 0–3（T0–T3）')
      if (t !== cur.maxTier) {
        data.maxTier = t
        changes.maxTier = { from: cur.maxTier, to: t }
      }
    }
    if (body.enabled !== undefined) {
      if (typeof body.enabled !== 'boolean') return error('启用状态必须是开 / 关')
      if (body.enabled !== cur.enabled) {
        data.enabled = body.enabled
        changes.enabled = { from: cur.enabled, to: body.enabled }
        if (!body.enabled) {
          data.claimCodeHash = null
          data.claimExpiresAt = null
        }
      }
    }
    if (!Object.keys(data).length) return success({ admin: await toAdminDTO(cur) }, '没有变化')

    const row = await prisma.botAdmin.update({ where: { id }, data })
    let revokedTokens = 0
    if (data.enabled === false) {
      const now = new Date()
      revokedTokens = (await prisma.botActionToken.updateMany({ where: { adminId: id, usedAt: null, revokedAt: null, expiresAt: { gt: now } }, data: { revokedAt: now } })).count
    }
    const actor = await currentActor()
    await auditSoft(request, actor, 'bot.admin.admin_update', { type: 'bot_admin', id: String(id) }, { adminId: id, name: cur.name, changes, revokedTokens })
    return success({ admin: await toAdminDTO(row), revokedTokens }, data.enabled === false ? `已停用「${cur.name}」，该管理员的微信现在发指令不会再被执行` : '已保存')
  } catch (e) {
    console.error('[bot-admin] 修改管理员失败', e)
    return error('修改管理员失败', 500)
  }
}
