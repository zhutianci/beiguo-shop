export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized, notFound } from '@/lib/api'
import { notifyBuyerMessage } from '@/lib/notify'
import { getStorefront } from '@/lib/storefront/resolve'
import { emitTenantNotice } from '@/lib/tenant/notice'
import { jiemaMessageRows } from '@/lib/jiema/support'
import { rateLimited } from '@/lib/news/rate-limit'

/**
 * 本人、本店的订单（设计 8.1「归属一律写进 where」）。别人的单、别的站的单与不存在的单同样返回 null → 404。
 * 账号两站通用，但 lulu 的会话碰不到主站订单的留言，反之亦然（T11）。
 */
async function ownedPaidOrder(orderId: number, userId: number, tenantId: number) {
  return prisma.order.findFirst({
    where: { id: orderId, userId, tenantId },
    select: { id: true, payStatus: true, tenantId: true, orderNo: true, productName: true, product: { select: { deliveryType: true } } },
  })
}

/**
 * 能不能读写留言（docs/短信接码-设计.md §6.6 第 29 条、§8.2）：普通订单与充值单沿用「支付后才能咨询」；
 * **只对短信接码单（SMS_POOL 载体）放开付款状态**——接码单最需要客服的时候恰恰是待支付、已关闭（UNPAID）或已取消（REFUNDED）。
 * 本人、本站的校验不变（上面的 where）；充值单（TOPUP）不放开（迟到退入也不写留言，§2.7）。
 * 发送另有频控（S2b 评审修复：原来这个接口根本没有频控，放开之后不付钱也能刷留言与企业微信推送），见 sendLimited。
 */
function canChat(order: { payStatus: string; product: { deliveryType: string } | null }): boolean {
  return order.payStatus === 'PAID' || order.product?.deliveryType === 'SMS_POOL'
}

/**
 * 发送频控（§6.6 第 29 条「保留频控」）：
 *  · 每个账号每分钟最多 10 条（跨订单；正常人打字远到不了）；
 *  · 每张订单每天：已付款的单 200 条；**没付款的接码单（待支付 / 已关闭）30 条**——放开付款状态之后，这是唯一不花钱就能写留言的入口。
 * 返回 null = 放行，否则是 429 的提示。进程内计数（lib/news/rate-limit，单 app 容器下是准的）。
 */
const MSG_USER_PER_MIN = 10
const MSG_ORDER_PER_DAY_PAID = 200
const MSG_ORDER_PER_DAY_UNPAID = 30
function sendLimited(userId: number, order: { id: number; payStatus: string }): string | null {
  if (rateLimited(`omsg-u:${userId}`, { windowMs: 60_000, max: MSG_USER_PER_MIN })) return '发送太频繁，请稍后再试'
  const unpaid = order.payStatus !== 'PAID'
  if (rateLimited(`${unpaid ? 'omsg-ou' : 'omsg-op'}:${order.id}`, { windowMs: 24 * 3600_000, max: unpaid ? MSG_ORDER_PER_DAY_UNPAID : MSG_ORDER_PER_DAY_PAID })) {
    return '这张订单今天的留言已经很多了，客服会尽快回复；急事请加微信客服'
  }
  return null
}

/**
 * 接码单留言的企业微信推送节流：同一张单 60 秒内只推第一条（后面几条照样入库、后台红点照样亮，客服打开能看到全部），
 * 同一个账号 60 秒内最多推 3 条。推送和运维告警共用一个机器人（每分钟 20 条上限），不能让一个买家刷满它把真告警挤掉。
 * 普通订单（要先付款才能留言）的推送行为不变。
 */
function jiemaPushAllowed(userId: number, orderId: number): boolean {
  if (rateLimited(`omsg-push:${orderId}`, { windowMs: 60_000, max: 1 })) return false
  return !rateLimited(`omsg-pushu:${userId}`, { windowMs: 60_000, max: 3 })
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
    if (!canChat(order)) return error('订单支付后才能咨询')

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
    if (!canChat(order)) return error('订单支付后才能咨询')

    const body = await request.json()
    const parsed = sendSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const limited = sendLimited(user.id, order)
    if (limited) return error(limited, 429)

    const msg = await prisma.orderMessage.create({
      data: { orderId, sender: 'BUYER', content: parsed.data.content, readByBuyer: true, readByAdmin: false },
      select: BUYER_MESSAGE_SELECT,
    })

    /*
     * 外推通知商家：买家有新留言（fire-and-forget，失败不影响发送）。
     * 【只推主站单】（docs/多渠道分销-二期改动.md 3.1）渠道单的留言是纯通知、由渠道自己在 /partner/orders/[orderNo] 回复，
     * 不再推站长群；渠道站长经下面的 BUYER_MESSAGE 渠道通知（按渠道自选的企业微信 / 邮箱）收到。
     * 站长后台的未读红点靠 readByAdmin，不受影响。主站单的推送内容逐字不变（主站店面的 siteTag 本来就是空串）。
     */
    // 接码单（只在主站）：推送里带上服务、国家/地区、状态、号码后 4 位、付款方式与后台链接（§6.6 第 29 条、§8.2），买家不用自己描述订单
    // 接码单的推送另有节流（jiemaPushAllowed：同一张单 60 秒只推第一条）；普通订单照旧每条都推
    const isJiema = order.product?.deliveryType === 'SMS_POOL'
    const pushOk = order.tenantId === 1 && (!isJiema || jiemaPushAllowed(user.id, orderId))
    if (order.tenantId === 1) {
      try {
        const full = pushOk ? await prisma.order.findUnique({
          where: { id: orderId },
          select: { orderNo: true, productName: true, user: { select: { nickname: true, email: true } } },
        }) : null
        if (full) {
          const extraRows = isJiema ? await jiemaMessageRows(orderId).catch(() => []) : undefined
          notifyBuyerMessage({
            orderId,
            orderNo: full.orderNo,
            productName: full.productName,
            buyer: full.user?.nickname || full.user?.email || `用户#${user.id}`,
            content: parsed.data.content,
            extraRows,
          })
        }
      } catch (e) {
        console.error('[notify] 组装买家留言通知失败', e)
      }
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
