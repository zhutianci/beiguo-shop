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

    /*
     * 【背书行不发提醒】即使前端传了它们的 id 也不发 —— 这是最后一道闸。
     * 那些行（sourceKey = order:<id>）的到期日是「付款日 + 1 个月」硬写的假日期，
     * 按它发出去的就是给买了一次性卡密的客户发「你的订阅即将到期」。
     * 列表接口已经把它们过滤掉了，这里再挡一次，防的是旧页面缓存与手工构造的请求。
     */
    const orders = await prisma.externalOrder.findMany({
      where: { id: { in: parsed.data.orderIds }, NOT: { sourceKey: { startsWith: 'order:' } } },
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
