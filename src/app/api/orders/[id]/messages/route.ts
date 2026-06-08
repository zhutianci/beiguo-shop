export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized, notFound } from '@/lib/api'

async function ownedPaidOrder(orderId: number, userId: number) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, userId: true, payStatus: true } })
  if (!order || order.userId !== userId) return null
  return order
}

// 买家拉取本订单聊天
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    const orderId = parseInt(params.id)
    if (!orderId) return error('订单无效')

    const order = await ownedPaidOrder(orderId, user.id)
    if (!order) return notFound('订单不存在')
    if (order.payStatus !== 'PAID') return error('订单支付后才能咨询')

    const messages = await prisma.orderMessage.findMany({ where: { orderId }, orderBy: { id: 'asc' } })
    // 标记买家已读（管理员发来的）
    await prisma.orderMessage.updateMany({
      where: { orderId, sender: 'ADMIN', readByBuyer: false },
      data: { readByBuyer: true },
    })

    return success({ messages })
  } catch (err) {
    console.error('Get order messages error:', err)
    return error('获取失败')
  }
}

const sendSchema = z.object({ content: z.string().trim().min(1, '请输入内容').max(2000) })

// 买家发送消息
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    const orderId = parseInt(params.id)
    if (!orderId) return error('订单无效')

    const order = await ownedPaidOrder(orderId, user.id)
    if (!order) return notFound('订单不存在')
    if (order.payStatus !== 'PAID') return error('订单支付后才能咨询')

    const body = await request.json()
    const parsed = sendSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const msg = await prisma.orderMessage.create({
      data: { orderId, sender: 'BUYER', content: parsed.data.content, readByBuyer: true, readByAdmin: false },
    })
    return success({ message: msg })
  } catch (err) {
    console.error('Send order message error:', err)
    return error('发送失败')
  }
}
