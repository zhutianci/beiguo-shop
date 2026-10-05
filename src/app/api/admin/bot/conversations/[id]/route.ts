export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { prisma } from '@/lib/db'
import { cancelPendingForConversation } from '@/lib/bot/outbox'
import { CATEGORY_LABELS, LOCKED_CATEGORIES, MGMT_CATEGORIES, TENANT_CATEGORIES, type BotCategory } from '@/lib/bot/types'
import { auditSoft, currentActor, intIn, parseId, readBody } from '@/app/api/admin/bot/_lib/common'
import { WALLET_TOPUP_KEY, effectiveSubs, toConvDTO } from '@/app/api/admin/bot/_lib/dto'

/**
 * 改会话（docs/微信机器人-设计.md §4.4、§14）。body 里给哪项改哪项：
 *  · status：'ACTIVE'（恢复推送，失败计数清零）| 'PAUSED'（暂停，未发出的消息作废）；
 *  · allowT3：允许提卡 / 补货——**只在这里能改**（群里指令改不了），只有主站管理群有这个开关；
 *  · subs：{ 类别: boolean }（管理群另可带 'ev:wallet.topup'）；「安全」类不能关，分站群不能订平台类别；
 *  · quiet：{ from, to }（一天中的分钟，北京时间）或 null（关闭）；只有分站群有免打扰。
 * 已解绑（REVOKED）与私聊会话不能在这里改。所有改动写审计（bot.admin.conv_update）。
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const id = parseId(params.id)
    if (!id) return error('会话编号不对')
    const body = await readBody(request)
    if (!body) return error('请求体不是 JSON 对象')
    const conv = await prisma.botConversation.findUnique({ where: { id } })
    if (!conv) return error('找不到这个会话', 404)
    if (conv.status === 'REVOKED') return error('这个会话已经解绑，不能修改；要重新使用请在「新建绑定」里再绑一次', 409)
    if (conv.kind === 'DM') return error('私聊会话不能在这里修改（它只回复指令、不接收推送）', 400)

    const data: Prisma.BotConversationUpdateManyMutationInput = {}
    const changes: Record<string, { from: unknown; to: unknown }> = {}

    if (body.status !== undefined) {
      if (body.status !== 'ACTIVE' && body.status !== 'PAUSED') return error('状态只能设为「推送中」或「已暂停」')
      if (body.status !== conv.status) {
        data.status = body.status
        if (body.status === 'ACTIVE') data.failStreak = 0
        changes.status = { from: conv.status, to: body.status }
      }
    }

    if (body.allowT3 !== undefined) {
      if (typeof body.allowT3 !== 'boolean') return error('「允许提卡补货」必须是开 / 关')
      if (conv.kind !== 'MGMT') return error('只有主站管理群可以开通提卡、补货', 400)
      if (body.allowT3 !== conv.allowT3) {
        data.allowT3 = body.allowT3
        changes.allowT3 = { from: conv.allowT3, to: body.allowT3 }
      }
    }

    if (body.subs !== undefined) {
      if (!body.subs || typeof body.subs !== 'object' || Array.isArray(body.subs)) return error('订阅必须是 { 类别: 开 / 关 } 的对象')
      const allowed = new Set<string>((conv.kind === 'MGMT' ? MGMT_CATEGORIES : TENANT_CATEGORIES) as readonly string[])
      const cur = (conv.subs && typeof conv.subs === 'object' && !Array.isArray(conv.subs) ? conv.subs : {}) as Record<string, unknown>
      const next: Record<string, unknown> = { ...cur }
      const entries = Object.entries(body.subs as Record<string, unknown>)
      for (let i = 0; i < entries.length; i++) {
        const [k, v] = entries[i]
        if (typeof v !== 'boolean') return error(`订阅项「${k}」必须是开 / 关`)
        const isTopup = k === WALLET_TOPUP_KEY && conv.kind === 'MGMT'
        if (!isTopup && !allowed.has(k)) return error(`${conv.kind === 'MGMT' ? '主站管理群' : '分站群'}没有「${k}」这个类别`)
        if (!v && LOCKED_CATEGORIES.has(k as BotCategory)) return error(`「${CATEGORY_LABELS[k as BotCategory]}」类不能关闭`)
        next[k] = v
      }
      const before = effectiveSubs(conv.kind, conv.subs)
      const after = effectiveSubs(conv.kind, next)
      Object.keys(after).forEach((k) => {
        if (before[k] !== after[k]) changes[`subs.${k}`] = { from: before[k], to: after[k] }
      })
      // 只在确有变化时写（没变化就不动 subs，免得把「缺省」写成「显式」）
      if (Object.keys(changes).some((k) => k.indexOf('subs.') === 0)) data.subs = next as Prisma.InputJsonObject
    }

    if (body.quiet !== undefined) {
      if (conv.kind !== 'TENANT') return error('只有分站群可以设置免打扰（主站管理群不设）', 400)
      let from: number | null = null
      let to: number | null = null
      if (body.quiet !== null) {
        const q = body.quiet as { from?: unknown; to?: unknown } | undefined
        from = q && typeof q === 'object' ? intIn(q.from, 0, 1439) : null
        to = q && typeof q === 'object' ? intIn(q.to, 0, 1439) : null
        if (from === null || to === null) return error('免打扰时间不对（从 / 到都要是 00:00–23:59）')
        if (from === to) return error('免打扰的开始与结束不能相同')
      }
      if (from !== conv.quietFrom || to !== conv.quietTo) {
        data.quietFrom = from
        data.quietTo = to
        changes.quiet = { from: conv.quietFrom === null ? null : [conv.quietFrom, conv.quietTo], to: from === null ? null : [from, to] }
      }
    }

    if (!Object.keys(data).length) return success({ conversation: await toConvDTO(conv), cancelled: 0 }, '没有变化')

    // 条件更新：并发时（例如刚在群里被解绑）不能把已解绑的行改回来
    const r = await prisma.botConversation.updateMany({ where: { id, status: { not: 'REVOKED' } }, data })
    if (r.count !== 1) return error('这个会话刚刚被解绑了，请刷新后查看', 409)
    const cancelled = data.status === 'PAUSED' ? await cancelPendingForConversation(id) : 0
    const actor = await currentActor()
    await auditSoft(request, actor, 'bot.admin.conv_update', { type: 'bot_conversation', id: String(id) }, {
      conversationId: id,
      kind: conv.kind,
      tenantId: conv.tenantId,
      changes,
      cancelled,
    })
    const fresh = await prisma.botConversation.findUnique({ where: { id } })
    return success({ conversation: await toConvDTO(fresh ?? conv), cancelled }, cancelled ? `已保存，作废了 ${cancelled} 条未发出的消息` : '已保存')
  } catch (e) {
    console.error('[bot-admin] 修改会话失败', e)
    return error('修改会话失败', 500)
  }
}

/**
 * 解绑（docs/微信机器人-设计.md §4.4）：会话置 REVOKED，**该群未发出的消息立即作废**，
 * 并作废这个群发起的、还没用的补货链接（补货链接是管理群里发的，群都不要了，链接不该继续有效）。
 * 同一个群以后可以在「新建绑定」里重新绑。私聊不能解绑：管理员再私聊时会自动重新登记，要停掉某个人请到「管理员」页停用。
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const id = parseId(params.id)
    if (!id) return error('会话编号不对')
    const conv = await prisma.botConversation.findUnique({ where: { id } })
    if (!conv) return error('找不到这个会话', 404)
    if (conv.status === 'REVOKED') return error('这个会话已经解绑了', 409)
    if (conv.kind === 'DM') return error('私聊会话不能解绑：要停用某个人，请到「管理员」页停用对应的管理员', 400)
    const r = await prisma.botConversation.updateMany({ where: { id, status: { not: 'REVOKED' } }, data: { status: 'REVOKED' } })
    if (r.count !== 1) return error('这个会话已经解绑了', 409)
    const now = new Date()
    const cancelled = await cancelPendingForConversation(id)
    const tokens = await prisma.botActionToken.updateMany({ where: { conversationId: id, usedAt: null, revokedAt: null, expiresAt: { gt: now } }, data: { revokedAt: now } })
    const actor = await currentActor()
    await auditSoft(request, actor, 'bot.admin.conv_unbind', { type: 'bot_conversation', id: String(id) }, {
      conversationId: id,
      kind: conv.kind,
      tenantId: conv.tenantId,
      externalId: conv.externalId,
      name: conv.name,
      cancelled,
      revokedTokens: tokens.count,
    })
    return success({ cancelled, revokedTokens: tokens.count }, cancelled ? `已解绑，作废了 ${cancelled} 条未发出的消息` : '已解绑')
  } catch (e) {
    console.error('[bot-admin] 解绑失败', e)
    return error('解绑失败', 500)
  }
}
