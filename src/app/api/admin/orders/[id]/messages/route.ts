export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'

// 管理员拉取订单聊天
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = parseInt(params.id)
    if (!orderId) return error('订单无效')
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } })
    if (!order) return notFound('订单不存在')

    const messages = await prisma.orderMessage.findMany({ where: { orderId }, orderBy: { id: 'asc' } })
    await prisma.orderMessage.updateMany({
      where: { orderId, sender: 'BUYER', readByAdmin: false },
      data: { readByAdmin: true },
    })
    return success({ messages })
  } catch (err) {
    console.error('Admin get order messages error:', err)
    return error('获取失败')
  }
}

const sendSchema = z.object({ content: z.string().trim().min(1, '请输入内容').max(2000) })

// 管理员回复
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = parseInt(params.id)
    if (!orderId) return error('订单无效')
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } })
    if (!order) return notFound('订单不存在')

    const body = await request.json()
    const parsed = sendSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const msg = await prisma.orderMessage.create({
      data: { orderId, sender: 'ADMIN', content: parsed.data.content, readByAdmin: true, readByBuyer: false },
    })
    return success({ message: msg })
  } catch (err) {
    console.error('Admin send order message error:', err)
    return error('发送失败')
  }
}
