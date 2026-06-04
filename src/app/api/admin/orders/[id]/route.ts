export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'

const updateOrderSchema = z.object({
  payStatus: z.enum(['UNPAID', 'PAID', 'REFUNDED']).optional(),
  deliveryStatus: z.enum(['PENDING', 'PROCESSING', 'DELIVERED', 'CANCELLED']).optional(),
  deliveryInfo: z.string().optional().nullable(),
  // 交付完成时同步导入到「订单（外部订单）」所需的信息
  external: z
    .object({
      subscriptionType: z.string().optional().nullable(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
      xianyuNickname: z.string().optional().nullable(),
      claudeAccount: z.string().email('Claude 账户邮箱格式不正确').optional().nullable(),
    })
    .optional(),
})

function hashKey(claudeAccount: string, startDate: string, subscriptionType: string): string {
  return crypto
    .createHash('sha1')
    .update(`${claudeAccount.toLowerCase()}|${startDate}|${subscriptionType}`)
    .digest('hex')
}

function addOneMonthIso(iso: string): string {
  const [y, m, d] = iso.split('-').map((n) => parseInt(n))
  const dt = new Date(y, m - 1, d)
  dt.setMonth(dt.getMonth() + 1)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

// 更新订单
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const orderId = parseInt(id)

    if (isNaN(orderId)) {
      return notFound('订单不存在')
    }

    const body = await request.json()
    const result = updateOrderSchema.safeParse(body)

    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    // 获取当前订单信息，用于判断状态变化
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true, user: true },
    })

    if (!currentOrder) {
      return notFound('订单不存在')
    }

    const { external, ...orderFields } = result.data
    const data: {
      payStatus?: 'UNPAID' | 'PAID' | 'REFUNDED'
      deliveryStatus?: 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'CANCELLED'
      deliveryInfo?: string | null
      deliveredAt?: Date | null
      paidAt?: Date | null
    } = { ...orderFields }

    const wasDelivered = currentOrder.deliveryStatus === 'DELIVERED'
    const willBeDelivered = result.data.deliveryStatus === 'DELIVERED'

    // 状态从未交付变为已交付：标记交付时间 + 自动标记支付 + 增加销量 / 扣减库存
    if (!wasDelivered && willBeDelivered) {
      data.deliveredAt = new Date()
      if (currentOrder.payStatus !== 'PAID') {
        data.payStatus = 'PAID'
        data.paidAt = new Date()
      }

      await prisma.product.update({
        where: { id: currentOrder.productId },
        data: {
          sales: { increment: currentOrder.quantity },
          ...(currentOrder.product.stock !== -1
            ? { stock: { decrement: currentOrder.quantity } }
            : {}),
        },
      })
    }

    // 从已交付撤回：减销量 + 恢复库存 + 清除交付时间
    if (
      wasDelivered &&
      result.data.deliveryStatus &&
      result.data.deliveryStatus !== 'DELIVERED'
    ) {
      data.deliveredAt = null

      await prisma.product.update({
        where: { id: currentOrder.productId },
        data: {
          sales: { decrement: currentOrder.quantity },
          ...(currentOrder.product.stock !== -1
            ? { stock: { increment: currentOrder.quantity } }
            : {}),
        },
      })
    }

    // 手动标记支付状态变更（独立于交付状态）
    if (result.data.payStatus === 'PAID' && currentOrder.payStatus !== 'PAID') {
      data.paidAt = new Date()
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data,
    })

    // 交付状态变为「已完成」时，自动导入到「订单（外部订单）」
    let imported: { externalOrderId: number } | null = null
    if (!wasDelivered && willBeDelivered) {
      const claudeAccount = external?.claudeAccount?.trim().toLowerCase()
      if (claudeAccount) {
        const subscriptionType = (external?.subscriptionType?.trim() || currentOrder.productName).trim()
        const today = new Date()
        const startDate =
          external?.startDate ||
          `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        const expireDate = addOneMonthIso(startDate)
        const xianyuNickname =
          external?.xianyuNickname?.trim() ||
          currentOrder.user.nickname ||
          currentOrder.user.email ||
          null
        const sourceKey = hashKey(claudeAccount, startDate, subscriptionType)
        try {
          const ext = await prisma.externalOrder.upsert({
            where: { sourceKey },
            create: {
              startDate: new Date(startDate),
              expireDate: new Date(expireDate),
              subscriptionType,
              xianyuNickname,
              claudeAccount,
              quote: currentOrder.amount, // 报价 = 订单金额
              sourceKey,
              importBatch: 'WEB',
            },
            update: {
              startDate: new Date(startDate),
              expireDate: new Date(expireDate),
              subscriptionType,
              xianyuNickname,
              claudeAccount,
              quote: currentOrder.amount,
              importBatch: 'WEB',
            },
          })
          imported = { externalOrderId: ext.id }
        } catch (e) {
          console.error('Auto-import external order failed:', e)
        }
      }
    }

    return success({ ...order, imported }, '订单更新成功')
  } catch (err) {
    console.error('Update order error:', err)
    return error('更新订单失败')
  }
}
