export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import type { Prisma } from '@prisma/client'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { prisma } from '@/lib/db'
import { cleanText, pageOf } from '@/app/api/admin/bot/_lib/common'
import type { CommandListDTO } from '@/app/admin/bot/types'

const DECISIONS = new Set(['IGNORED', 'REJECTED', 'OK', 'ERROR'])

/**
 * 指令日志（docs/微信机器人-设计.md §7.1、§14）：bot_commands 分页，**含被忽略的**（发送人不是管理员、重复回调等）。
 * 只记 @机器人 的消息、管理员私聊与管理群系统提示——普通聊天从来不落库，所以这里没有消息正文，被忽略的行只有发送人 wxid 与原因码。
 * 过滤：?decision=IGNORED|REJECTED|OK|ERROR；?q=（指令名 / 发送人 wxid / 昵称 / 原因码 / 参数里包含）；?conversationId=；?adminId=。
 */
export async function GET(request: NextRequest) {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const sp = request.nextUrl.searchParams
    const { page, pageSize, skip } = pageOf(sp, 30, 100)
    const where: Prisma.BotCommandWhereInput = {}
    const decision = sp.get('decision')
    if (decision && DECISIONS.has(decision)) where.decision = decision
    const q = cleanText(sp.get('q'), 50)
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { senderWxid: { contains: q } },
        { senderName: { contains: q } },
        { reasonCode: { contains: q } },
        { argsText: { contains: q } },
        { resultSummary: { contains: q } },
      ]
    }
    const convId = parseInt(sp.get('conversationId') || '', 10)
    if (Number.isInteger(convId) && convId > 0) where.conversationId = convId
    const adminId = parseInt(sp.get('adminId') || '', 10)
    if (Number.isInteger(adminId) && adminId > 0) where.adminId = adminId

    const [total, rows] = await Promise.all([
      prisma.botCommand.count({ where }),
      prisma.botCommand.findMany({ where, orderBy: { id: 'desc' }, skip, take: pageSize }),
    ])
    const adminIds = Array.from(new Set(rows.map((r) => r.adminId).filter((x): x is number => !!x)))
    const convIds = Array.from(new Set(rows.map((r) => r.conversationId).filter((x): x is number => !!x)))
    const [admins, convs] = await Promise.all([
      prisma.botAdmin.findMany({ where: { id: { in: adminIds } }, select: { id: true, name: true } }),
      prisma.botConversation.findMany({ where: { id: { in: convIds } }, select: { id: true, name: true, kind: true } }),
    ])
    const adminName = new Map(admins.map((a) => [a.id, a.name]))
    const convMap = new Map(convs.map((c) => [c.id, c]))
    const dto: CommandListDTO = {
      page,
      pageSize,
      total,
      list: rows.map((r) => {
        const c = r.conversationId ? convMap.get(r.conversationId) : undefined
        return {
          id: r.id,
          createdAt: r.createdAt.toISOString(),
          adapter: r.adapter,
          kind: r.kind,
          conversationId: r.conversationId,
          conversationName: c?.name ?? null,
          conversationKind: c?.kind ?? null,
          convExternalId: r.convExternalId,
          senderWxid: r.senderWxid,
          senderName: r.senderName,
          adminName: r.adminId ? adminName.get(r.adminId) ?? `#${r.adminId}` : null,
          name: r.name,
          argsText: r.argsText,
          decision: r.decision,
          reasonCode: r.reasonCode,
          resultSummary: r.resultSummary,
        }
      }),
    }
    return success(dto)
  } catch (e) {
    console.error('[bot-admin] 指令日志失败', e)
    return error('读取指令日志失败', 500)
  }
}
