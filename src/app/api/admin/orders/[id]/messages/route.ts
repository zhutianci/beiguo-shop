export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'

// 聊天分段加载参数
const DEFAULT_PAGE_SIZE = 100  // 首屏 / 「加载更早」每次取的条数
const MAX_PAGE_SIZE = 200
const MAX_INCREMENT = 200      // 增量轮询单次最多补多少条（不够会在下次轮询继续补）

// after 允许为 0（表示「取比 0 大的」= 从头开始的增量），before 必须为正
function parseCursor(v: string | null, min: number): number | null {
  if (v === null) return null
  const n = parseInt(v)
  return Number.isFinite(n) && n >= min ? n : null
}

// 管理员拉取订单聊天
// - 不带参数：取最近 DEFAULT_PAGE_SIZE 条（升序返回）+ hasMore 标记是否还有更早的消息
// - ?after=<id>：增量轮询，只返回比该 id 新的消息
// - ?before=<id>：加载更早的消息（向上翻页）
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = parseInt(params.id)
    if (!orderId) return error('订单无效')
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } })
    if (!order) return notFound('订单不存在')

    const sp = new URL(request.url).searchParams
    const after = parseCursor(sp.get('after'), 0)
    const before = parseCursor(sp.get('before'), 1)
    const rawPageSize = parseInt(sp.get('pageSize') || String(DEFAULT_PAGE_SIZE))
    const pageSize = Math.min(
      Math.max(Number.isFinite(rawPageSize) ? rawPageSize : DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE
    )

    let messages
    let hasMore = false

    if (after !== null) {
      // 增量：只取比 after 新的消息，升序直接追加到末尾
      messages = await prisma.orderMessage.findMany({
        where: { orderId, id: { gt: after } },
        orderBy: { id: 'asc' },
        take: MAX_INCREMENT,
      })
    } else {
      // 首屏 / 向上翻页：倒序取 pageSize + 1 条判断是否还有更早的，再反转成升序
      const rows = await prisma.orderMessage.findMany({
        where: before !== null ? { orderId, id: { lt: before } } : { orderId },
        orderBy: { id: 'desc' },
        take: pageSize + 1,
      })
      hasMore = rows.length > pageSize
      messages = rows.slice(0, pageSize).reverse()
    }

    // 标记商家已读（买家发来的）：
    // 首屏/翻页时无条件执行（保持旧行为，能清掉比首屏更早的未读）；
    // 增量轮询时只在真的收到买家新消息时执行，避免每 4 秒一次空写。
    if (after === null || messages.some((m) => m.sender === 'BUYER')) {
      await prisma.orderMessage.updateMany({
        where: { orderId, sender: 'BUYER', readByAdmin: false },
        data: { readByAdmin: true },
      })
    }

    return success({ messages, hasMore })
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
