export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma, DeliveryStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { decryptCardContent } from '@/lib/cardkey'

// 获取所有订单（服务端检索 + 筛选 + 分页）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const keyword = (searchParams.get('keyword') || '').trim()
    const unreplied = ['1', 'true'].includes((searchParams.get('unreplied') || '').toLowerCase())
    const page = Math.max(parseInt(searchParams.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20') || 20, 1), 100)

    const where: Prisma.OrderWhereInput = {}
    if (status && ['PENDING', 'PROCESSING', 'DELIVERED', 'CANCELLED'].includes(status)) {
      where.deliveryStatus = status as DeliveryStatus
    }
    // 关键词跨全表检索：订单号 / 商品名 / 用户邮箱 / 用户昵称（MySQL 默认排序规则大小写不敏感）
    if (keyword) {
      where.OR = [
        { orderNo: { contains: keyword } },
        { productName: { contains: keyword } },
        { user: { email: { contains: keyword } } },
        { user: { nickname: { contains: keyword } } },
      ]
    }
    // 只看「未回复」：存在买家发来且商家未读的留言
    if (unreplied) {
      where.messages = { some: { sender: 'BUYER', readByAdmin: false } }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nickname: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ])

    // 附带每张订单实际发出的卡密（自动发货），便于核对「发了哪个卡密 / 是否误发多张」
    const paidIds = orders.filter((o) => o.payStatus === 'PAID').map((o) => o.id)
    const cardMap = new Map<number, string[]>()
    if (paidIds.length) {
      const cards = await prisma.cardKey.findMany({
        where: { orderId: { in: paidIds }, status: 'USED' },
        orderBy: { id: 'asc' },
      })
      for (const c of cards) {
        let plain = ''
        try {
          plain = decryptCardContent(c.content)
        } catch {
          plain = '(卡密解密失败)'
        }
        const arr = cardMap.get(c.orderId as number) || []
        arr.push(plain)
        cardMap.set(c.orderId as number, arr)
      }
    }
    // 统计每张订单「买家发来、商家未读」的留言数，用于列表红点提醒
    const allIds = orders.map((o) => o.id)
    const unreadMap = new Map<number, number>()
    if (allIds.length) {
      const grouped = await prisma.orderMessage.groupBy({
        by: ['orderId'],
        where: { orderId: { in: allIds }, sender: 'BUYER', readByAdmin: false },
        _count: { _all: true },
      })
      for (const g of grouped) unreadMap.set(g.orderId, g._count._all)
    }

    const list = orders.map((o) => ({
      ...o,
      cards: cardMap.get(o.id) || [],
      unreadCount: unreadMap.get(o.id) || 0,
    }))

    return success({
      list,
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    })
  } catch (err) {
    console.error('Get orders error:', err)
    return error('获取订单列表失败')
  }
}
