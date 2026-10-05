export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { prisma } from '@/lib/db'
import { auditSoft, cleanText, currentActor, intIn, readBody } from '@/app/api/admin/bot/_lib/common'
import { toAdminDTO, toAdminDTOs } from '@/app/api/admin/bot/_lib/dto'

/**
 * 管理员列表（docs/微信机器人-设计.md §14「管理员」）：名称、关联的站内账号、最高级别、启用状态、
 * 已绑定的微信（昵称 + wxid + 是否启用）、认领码有没有生效。认领码哈希永远不返回。
 */
export async function GET() {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const rows = await prisma.botAdmin.findMany({ orderBy: { id: 'asc' }, take: 200 })
    return success({ list: await toAdminDTOs(rows) })
  } catch (e) {
    console.error('[bot-admin] 管理员列表失败', e)
    return error('读取管理员列表失败', 500)
  }
}

/**
 * 添加管理员：body { name, maxTier?: 0–3（默认 3）, linkSelf?: boolean }。
 * linkSelf=true 把这个机器人管理员关联到当前登录的站内账号——机器人里该管理员的操作，审计的操作人就记成这个账号；不关联则审计里只有名字。
 * 这里只建「人」；微信身份要用认领码登记：创建后再调 POST /api/admin/bot/admins/<id>/claim 生成认领码。
 */
export async function POST(request: NextRequest) {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const body = await readBody(request)
    if (!body) return error('请求体不是 JSON 对象')
    const name = cleanText(body.name, 40)
    if (!name) return error('请填写管理员名称')
    const maxTier = body.maxTier === undefined ? 3 : intIn(body.maxTier, 0, 3)
    if (maxTier === null) return error('最高级别只能是 0–3（T0–T3）')
    if (await prisma.botAdmin.findFirst({ where: { name }, select: { id: true } })) return error('已经有同名的管理员了，请换一个名称', 409)
    const actor = await currentActor()
    const row = await prisma.botAdmin.create({ data: { name, maxTier, siteUserId: body.linkSelf === true ? actor.userId : null, enabled: true } })
    await auditSoft(request, actor, 'bot.admin.admin_create', { type: 'bot_admin', id: String(row.id) }, { adminId: row.id, name, maxTier, siteUserId: row.siteUserId })
    return success({ admin: await toAdminDTO(row) }, `已添加管理员「${name}」，请生成认领码，再让对方用自己的微信私聊小号认领`)
  } catch (e) {
    console.error('[bot-admin] 添加管理员失败', e)
    return error('添加管理员失败', 500)
  }
}
