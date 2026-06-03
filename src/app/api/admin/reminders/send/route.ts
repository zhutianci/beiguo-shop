export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { resolveContact, sendReminderForOrder } from '@/lib/reminder'

const bodySchema = z.object({
  orderIds: z.array(z.number().int().positive()).min(1, '请选择要提醒的订单'),
})

// 后台手动提醒：对指定订单立即发送，忽略“已提醒”状态（始终发送）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const orders = await prisma.externalOrder.findMany({
      where: { id: { in: parsed.data.orderIds } },
    })
    if (orders.length === 0) return error('未找到对应订单')

    const accounts = Array.from(new Set(orders.map((o) => o.claudeAccount)))
    const contacts = await prisma.accountContact.findMany({
      where: { claudeAccount: { in: accounts } },
    })
    const contactMap = new Map(contacts.map((c) => [c.claudeAccount, c]))

    let sent = 0
    let failed = 0
    let skipped = 0
    const outcomes = []

    for (const order of orders) {
      const contact = resolveContact(order.claudeAccount, contactMap.get(order.claudeAccount) || null)
      const outcome = await sendReminderForOrder(order, contact, 'manual')
      outcomes.push(outcome)
      if (outcome.skippedReason) skipped++
      else if (outcome.emailResult?.ok || outcome.smsResult?.ok) sent++
      else failed++
    }

    return success(
      { sent, failed, skipped, outcomes },
      `提醒完成：成功 ${sent}，失败 ${failed}，跳过 ${skipped}`
    )
  } catch (err) {
    console.error('Manual remind error:', err)
    return error('发送失败')
  }
}
