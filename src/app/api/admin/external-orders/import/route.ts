export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { sendRechargeForOrders } from '@/lib/reminder'
import type { ExternalOrder } from '@prisma/client'

const itemSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式错误'),
  expireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式错误'),
  subscriptionType: z.string().min(1),
  xianyuNickname: z.string().optional().nullable(),
  claudeAccount: z.string().email(),
  cost: z.number().optional().nullable(),
  quote: z.number().optional().nullable(),
  profit: z.number().optional().nullable(),
})

const importSchema = z.object({
  items: z.array(itemSchema).min(1),
  notify: z.boolean().optional().default(true), // 是否对新增订单发送充值成功邮件
})

function hashKey(claudeAccount: string, startDate: string, subscriptionType: string): string {
  return crypto
    .createHash('sha1')
    .update(`${claudeAccount.toLowerCase()}|${startDate}|${subscriptionType}`)
    .digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = importSchema.safeParse(body)
    if (!parsed.success) {
      return error(parsed.error.errors[0].message)
    }

    const batch = `B${Date.now().toString(36).toUpperCase()}`
    let created = 0
    let updated = 0
    let skipped = 0
    const createdOrders: ExternalOrder[] = [] // 新增的订单，用于发送充值成功邮件

    // 提前查出哪些 sourceKey 已存在
    const allKeys = parsed.data.items.map((it) =>
      hashKey(it.claudeAccount, it.startDate, it.subscriptionType)
    )
    const existing = await prisma.externalOrder.findMany({
      where: { sourceKey: { in: allKeys } },
      select: { sourceKey: true },
    })
    const existingSet = new Set(existing.map((e) => e.sourceKey))

    for (const item of parsed.data.items) {
      const sourceKey = hashKey(item.claudeAccount, item.startDate, item.subscriptionType)
      const isExisting = existingSet.has(sourceKey)
      // 利润：传了就用；否则报价、成本都有则自动计算
      const cost = item.cost ?? null
      const quote = item.quote ?? null
      let profit = item.profit ?? null
      if (profit == null && quote != null && cost != null) {
        profit = Math.round((quote - cost) * 100) / 100
      }
      try {
        const order = await prisma.externalOrder.upsert({
          where: { sourceKey },
          create: {
            startDate: new Date(item.startDate),
            expireDate: new Date(item.expireDate),
            subscriptionType: item.subscriptionType.trim(),
            xianyuNickname: item.xianyuNickname?.trim() || null,
            claudeAccount: item.claudeAccount.trim().toLowerCase(),
            cost,
            quote,
            profit,
            sourceKey,
            importBatch: batch,
          },
          update: {
            startDate: new Date(item.startDate),
            expireDate: new Date(item.expireDate),
            subscriptionType: item.subscriptionType.trim(),
            xianyuNickname: item.xianyuNickname?.trim() || null,
            claudeAccount: item.claudeAccount.trim().toLowerCase(),
            cost,
            quote,
            profit,
            importBatch: batch,
          },
        })
        if (isExisting) {
          updated++
        } else {
          created++
          createdOrders.push(order)
        }
      } catch (e) {
        console.error('Import item failed:', item, e)
        skipped++
      }
    }

    // 对新增订单发送“充值成功”邮件（默认开启，可在导入页关闭）
    let notified = { total: 0, sent: 0, failed: 0 }
    if (parsed.data.notify && createdOrders.length > 0) {
      try {
        notified = await sendRechargeForOrders(createdOrders)
      } catch (e) {
        console.error('Send recharge emails failed:', e)
      }
    }

    return success(
      { batch, created, updated, skipped, total: parsed.data.items.length, notified },
      '导入完成'
    )
  } catch (err) {
    console.error('Import error:', err)
    return error('导入失败')
  }
}
