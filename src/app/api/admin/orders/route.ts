export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma, DeliveryStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { decryptCardContent } from '@/lib/cardkey'
import { round2 } from '@/lib/money'

// 获取所有订单（服务端检索 + 筛选 + 分页）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const keyword = (searchParams.get('keyword') || '').trim()
    const unreplied = ['1', 'true'].includes((searchParams.get('unreplied') || '').toLowerCase())
    const page = Math.max(parseInt(searchParams.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20') || 20, 1), 100)
    const from = (searchParams.get('from') || '').trim() // YYYY-MM-DD，按下单时间
    const to = (searchParams.get('to') || '').trim()
    const categoryId = parseInt(searchParams.get('categoryId') || '0') || 0

    const where: Prisma.OrderWhereInput = {}
    if (status && ['PENDING', 'PROCESSING', 'DELIVERED', 'CANCELLED'].includes(status)) {
      where.deliveryStatus = status as DeliveryStatus
    }
    // 日期区间：to 取当天 23:59:59.999，保证「同一天」也能查到
    if (from || to) {
      const createdAt: Prisma.DateTimeFilter = {}
      if (from) {
        const d = new Date(`${from}T00:00:00`)
        if (!isNaN(d.getTime())) createdAt.gte = d
      }
      if (to) {
        const d = new Date(`${to}T23:59:59.999`)
        if (!isNaN(d.getTime())) createdAt.lte = d
      }
      if (createdAt.gte || createdAt.lte) where.createdAt = createdAt
    }
    // 商品分类：走 Order → Product → categoryId 关系，无需在订单上冗余列。
    // 注意分类不是快照，商品事后改分类会让历史订单的归类跟着变。
    if (categoryId) where.product = { categoryId }
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
              categoryId: true,
              category: { select: { id: true, name: true } },
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
    // 本页每张订单的成本/利润：直接汇总卡密上已落库的 cost/profit，不在这里现算
    const moneyMap = new Map<number, { cost: number; profit: number; hasUnknownProfit: boolean }>()
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
        const oid = c.orderId as number
        const arr = cardMap.get(oid) || []
        arr.push(plain)
        cardMap.set(oid, arr)

        const m = moneyMap.get(oid) || { cost: 0, profit: 0, hasUnknownProfit: false }
        m.cost = round2(m.cost + Number(c.cost ?? 0))
        if (c.profit == null) m.hasUnknownProfit = true
        else m.profit = round2(m.profit + Number(c.profit))
        moneyMap.set(oid, m)
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

    const list = orders.map((o) => {
      const m = moneyMap.get(o.id)
      return {
        ...o,
        cards: cardMap.get(o.id) || [],
        unreadCount: unreadMap.get(o.id) || 0,
        // 卡密维度的成本/利润；非自动发货订单没有卡密，profit 为 null 表示「无卡密可核算」
        cardCost: m ? m.cost : null,
        cardProfit: m && !m.hasUnknownProfit ? m.profit : null,
        cardProfitUnknown: m ? m.hasUnknownProfit : false,
      }
    })

    // 筛选范围的汇总。成本/利润要按 orderId 汇总卡密，CardKey 与 Order 没有 Prisma 关系，
    // 只能先取 id 集合再聚合；范围过大时如实返回 truncated 而不是给个错数字。
    const TOTALS_ID_CAP = 10000
    const amountAgg = await prisma.order.aggregate({
      where,
      _sum: { amount: true },
      _count: { _all: true },
    })
    let totalsCost: number | null = null
    let totalsProfit: number | null = null
    let totalsTruncated = false
    if (total <= TOTALS_ID_CAP) {
      const ids = await prisma.order.findMany({ where, select: { id: true } })
      if (ids.length) {
        const agg = await prisma.cardKey.aggregate({
          where: { orderId: { in: ids.map((x) => x.id) }, status: 'USED' },
          _sum: { cost: true, profit: true },
        })
        totalsCost = round2(Number(agg._sum.cost ?? 0))
        totalsProfit = round2(Number(agg._sum.profit ?? 0))
      } else {
        totalsCost = 0
        totalsProfit = 0
      }
    } else {
      totalsTruncated = true
    }

    return success({
      list,
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      totals: {
        orders: amountAgg._count._all,
        amount: round2(Number(amountAgg._sum.amount ?? 0)),
        cost: totalsCost,
        profit: totalsProfit,
        truncated: totalsTruncated, // true = 结果集过大，未统计成本/利润，请缩小筛选范围
      },
    })
  } catch (err) {
    console.error('Get orders error:', err)
    return error('获取订单列表失败')
  }
}
