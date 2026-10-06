export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { meOrDeny } from '@/lib/content/session'

// 标记已读：传 ids 只标这些，不传 = 全部已读
export async function POST(request: NextRequest) {
  const { user, denied } = await meOrDeny(request, true)
  if (denied) return denied
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = z.object({ ids: z.array(z.number().int().positive()).max(200).optional() }).safeParse(body)
    const ids = parsed.success ? parsed.data.ids : undefined
    await prisma.notification.updateMany({
      where: { userId: user!.id, readAt: null, ...(ids ? { id: { in: ids } } : {}) },
      data: { readAt: new Date() },
    })
    return success({ ok: true })
  } catch (err) {
    console.error('Notifications read error:', err)
    return error('操作失败')
  }
}
