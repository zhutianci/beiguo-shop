export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { verifyQuickReplyToken } from '@/lib/quick-reply'

/**
 * 快捷回复接口。令牌即凭证，middleware 不拦这条路径，鉴权全在这里自查。
 * 能力被刻意限死：只读该订单的留言、只能以客服身份回一条。
 */

// 进程内限流：令牌泄露时限制爆破与刷屏
const hits = new Map<string, number[]>()
function limited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs)
  if (arr.length >= max) {
    hits.set(key, arr)
    return true
  }
  arr.push(now)
  hits.set(key, arr)
  if (hits.size > 2000) {
    const stale: string[] = []
    hits.forEach((v, k) => {
      if (!v.some((t: number) => now - t < windowMs)) stale.push(k)
    })
    stale.forEach((k) => hits.delete(k))
  }
  return false
}

function clientIp(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  )
}

/** 读取该订单的对话 */
export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  const claim = verifyQuickReplyToken(params.token)
  if (!claim) return error('链接无效或已过期，请到后台回复', 403)
  if (limited(`g:${clientIp(request)}`, 60, 60_000)) return error('请求过于频繁', 429)

  const order = await prisma.order.findUnique({
    where: { id: claim.orderId },
    select: {
      id: true,
      orderNo: true,
      productName: true,
      amount: true,
      payStatus: true,
      deliveryStatus: true,
      createdAt: true,
      user: { select: { nickname: true, email: true } },
    },
  })
  if (!order) return error('订单不存在', 404)

  const messages = await prisma.orderMessage.findMany({
    where: { orderId: claim.orderId },
    orderBy: { id: 'asc' },
    take: 100,
    select: { id: true, sender: true, content: true, createdAt: true },
  })

  return success({
    order: {
      orderNo: order.orderNo,
      productName: order.productName,
      amount: Number(order.amount),
      payStatus: order.payStatus,
      deliveryStatus: order.deliveryStatus,
      buyer: order.user?.nickname || order.user?.email || `用户#${order.id}`,
      createdAt: order.createdAt,
    },
    messages,
    expiresAt: claim.expiresAt,
  })
}

const replySchema = z.object({
  content: z.string().trim().min(1, '请输入回复内容').max(1000, '回复不能超过 1000 字'),
})

/** 以客服身份回一条 */
export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const claim = verifyQuickReplyToken(params.token)
  if (!claim) return error('链接无效或已过期，请到后台回复', 403)
  if (limited(`p:${params.token}`, 20, 600_000)) return error('回复过于频繁，请稍后再试', 429)

  const body = await request.json().catch(() => null)
  const parsed = replySchema.safeParse(body)
  if (!parsed.success) return error(parsed.error.errors[0].message)

  const order = await prisma.order.findUnique({ where: { id: claim.orderId }, select: { id: true } })
  if (!order) return error('订单不存在', 404)

  const msg = await prisma.orderMessage.create({
    data: {
      orderId: claim.orderId,
      sender: 'ADMIN',
      content: parsed.data.content,
      readByAdmin: true,
      readByBuyer: false, // 买家侧会出现未读红点
    },
  })

  // 顺手把该订单买家发来的留言标记为已读——你已经看过并回复了
  await prisma.orderMessage
    .updateMany({
      where: { orderId: claim.orderId, sender: 'BUYER', readByAdmin: false },
      data: { readByAdmin: true },
    })
    .catch(() => {})

  return success({ message: msg }, '已回复，客户在订单页即可看到')
}
