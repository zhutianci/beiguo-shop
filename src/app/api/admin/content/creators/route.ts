export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { award } from '@/lib/content/points'

/**
 * 后台：设置 L3 共建者（设计 §8.1，站长邀请制）与手工调整积分。按作者主页短码操作。
 * 调整积分走 point_logs 的 ADJUST（refId 用时间戳，保证每次调整都是一条独立流水）。
 */
const schema = z.object({
  handle: z.string().regex(/^[a-z0-9]{8}$/),
  coBuilder: z.boolean().optional(),
  adjust: z.number().int().min(-10000).max(10000).optional(),
})

export async function PATCH(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return error('参数无效')
    const pf = await prisma.creatorProfile.findUnique({ where: { handle: parsed.data.handle } })
    if (!pf) return error('作者不存在', 404)
    if (parsed.data.coBuilder !== undefined) await prisma.creatorProfile.update({ where: { userId: pf.userId }, data: { coBuilder: parsed.data.coBuilder } })
    if (parsed.data.adjust) await award(pf.userId, 'ADJUST', Math.floor(Date.now() / 1000), 0, parsed.data.adjust)
    return success({ ok: true }, '已保存')
  } catch (err) {
    console.error('Admin creator error:', err)
    return error('保存失败')
  }
}
