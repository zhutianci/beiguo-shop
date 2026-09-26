export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized, notFound } from '@/lib/api'
import { notifyBuyerMessage } from '@/lib/notify'
import { getStorefront } from '@/lib/storefront/resolve'
import { emitTenantNotice } from '@/lib/tenant/notice'
import { siteTag } from '@/lib/pricing'

/**
 * 本人、本店的订单（设计 8.1「归属一律写进 where」）。别人的单、别的站的单与不存在的单同样返回 null → 404。
 * 账号两站通用，但 lulu 的会话碰不到主站订单的留言，反之亦然（T11）。
 */
async function ownedPaidOrder(orderId: number, userId: number, tenantId: number) {
  return prisma.order.findFirst({
    where: { id: orderId, userId, tenantId },
    select: { id: true, payStatus: true, tenantId: true, orderNo: true, productName: true },
  })
}

/**
 * 买家侧留言的返回字段白名单（设计 5.6、6.3）。
 * 【不能用整行】OrderMessage 新增了 senderRole / senderUserId / readByTenant（渠道后台用），整行返回会把
 * 「是平台还是渠道成员回复的、是谁」带给买家；readByAdmin 也是内部状态。买家只需要知道「我」还是「客服」。
 */
const BUYER_MESSAGE_SELECT = { id: true, sender: true, content: true, createdAt: true, readByBuyer: true } as const

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

// 买家拉取本订单聊天
// - 不带参数：取最近 DEFAULT_PAGE_SIZE 条（升序返回）+ hasMore 标记是否还有更早的消息
// - ?after=<id>：增量轮询，只返回比该 id 新的消息
// - ?before=<id>：加载更早的消息（向上翻页）
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // 店面解析不进 try（设计 4.4 第 7 条）
  const sf = await getStorefront()
  if (!sf) return notFound('订单不存在')
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    const orderId = parseInt(params.id)
    if (!orderId) return error('订单无效')

    const order = await ownedPaidOrder(orderId, user.id, sf.id)
    if (!order) return notFound('订单不存在')
    if (order.payStatus !== 'PAID') return error('订单支付后才能咨询')

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
        select: BUYER_MESSAGE_SELECT,
        orderBy: { id: 'asc' },
        take: MAX_INCREMENT,
      })
    } else {
      // 首屏 / 向上翻页：倒序取 pageSize + 1 条判断是否还有更早的，再反转成升序
      const rows = await prisma.orderMessage.findMany({
        where: before !== null ? { orderId, id: { lt: before } } : { orderId },
        select: BUYER_MESSAGE_SELECT,
        orderBy: { id: 'desc' },
        take: pageSize + 1,
      })
      hasMore = rows.length > pageSize
      messages = rows.slice(0, pageSize).reverse()
    }

    // 标记买家已读（管理员发来的）：
    // 首屏/翻页时无条件执行（保持旧行为，能清掉比首屏更早的未读）；
    // 增量轮询时只在真的收到客服新消息时执行，避免每 4 秒一次空写。
    if (after === null || messages.some((m) => m.sender === 'ADMIN')) {
      await prisma.orderMessage.updateMany({
        where: { orderId, sender: 'ADMIN', readByBuyer: false },
        data: { readByBuyer: true },
      })
    }

    return success({ messages, hasMore })
  } catch (err) {
    console.error('Get order messages error:', err)
    return error('获取失败')
  }
}

const sendSchema = z.object({ content: z.string().trim().min(1, '请输入内容').max(2000) })

// 买家发送消息
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // 店面解析不进 try（设计 4.4 第 7 条）
  const sf = await getStorefront()
  if (!sf) return notFound('订单不存在')
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()
    const orderId = parseInt(params.id)
    if (!orderId) return error('订单无效')

    const order = await ownedPaidOrder(orderId, user.id, sf.id)
    if (!order) return notFound('订单不存在')
    if (order.payStatus !== 'PAID') return error('订单支付后才能咨询')

    const body = await request.json()
    const parsed = sendSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const msg = await prisma.orderMessage.create({
      data: { orderId, sender: 'BUYER', content: parsed.data.content, readByBuyer: true, readByAdmin: false },
      select: BUYER_MESSAGE_SELECT,
    })

    // 外推通知商家：买家有新留言（fire-and-forget，失败不影响发送）。平台群照推，渠道单打「[code]」标签（设计 11.4）
    try {
      const full = await prisma.order.findUnique({
        where: { id: orderId },
        select: { orderNo: true, productName: true, user: { select: { nickname: true, email: true } } },
      })
      if (full) {
        notifyBuyerMessage({
          orderId,
          orderNo: full.orderNo,
          productName: `${siteTag(sf)}${full.productName}`,
          buyer: full.user?.nickname || full.user?.email || `用户#${user.id}`,
          content: parsed.data.content,
        })
      }
    } catch (e) {
      console.error('[notify] 组装买家留言通知失败', e)
    }

    /*
     * 渠道单：同时推渠道通知中心（红点 + 渠道自己的企业微信群，设计 11.4）。dedupeKey=msg:<id>，同一条留言只通知一次。
     * 【载荷不放留言正文】webhook 地址一旦泄露就是第三方可读，而买家留言里可能贴了卡密、邮箱、账号；
     * 渠道要看正文就进后台订单详情（有审计）。tx 传 null：通知写失败只记日志，不影响买家发送。
     */
    if (order.tenantId !== 1) {
      await emitTenantNotice(null, {
        tenantId: order.tenantId,
        kind: 'BUYER_MESSAGE',
        title: `买家留言：订单 ${order.orderNo}`,
        body: `商品：${order.productName}`,
        refType: 'order',
        refKey: order.orderNo,
        dedupeKey: `msg:${msg.id}`,
      })
    }

    return success({ message: msg })
  } catch (err) {
    console.error('Send order message error:', err)
    return error('发送失败')
  }
}
