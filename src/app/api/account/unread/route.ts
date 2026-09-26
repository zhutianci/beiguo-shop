export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { success } from '@/lib/api'
import { getStorefront } from '@/lib/storefront/resolve'

/**
 * 当前买家有多少条「客服发来但还没看」的留言。
 *
 * 【为什么需要这个接口】订单页每张卡片上早就有「客服新回复 N」的红点了，
 * 但它只在买家**主动打开订单页**时才看得到：买家在首页、商品页、或者干脆没开网站时，
 * 客服说了什么他一无所知。页头挂一个红点，是唯一能覆盖「买家在站内但不在订单页」这一段的办法。
 *
 * 【只数客服发的】sender='ADMIN' 且 readByBuyer=false。买家自己发的消息
 * 建行时就写了 readByBuyer=true（见 api/orders/[id]/messages），不会自己给自己报未读。
 * 渠道成员的回复同样写 sender='ADMIN'（买家看到的都是「客服」，设计 5.6），所以这里不用区分。
 *
 * 【只数本店订单】同一账号两站通用（设计 D4），但订单按交易发生站隔离：在 lulu 看到的红点只能来自 lulu 的订单（T11）。
 *
 * 【未登录返回 0 而不是 401】页头对所有人渲染，用 401 会让未登录访客的控制台里
 * 每分钟刷一条红色报错。这个接口没有任何敏感信息，返回 0 是最干净的。没有店面的 Host 同理返回 0。
 */
export async function GET() {
  // 店面解析不进 try（设计 4.4 第 7 条）
  const sf = await getStorefront()
  if (!sf) return success({ messages: 0 })
  try {
    const user = await getCurrentUser()
    if (!user) return success({ messages: 0 })

    const messages = await prisma.orderMessage.count({
      where: {
        sender: 'ADMIN',
        readByBuyer: false,
        order: { userId: user.id, tenantId: sf.id },
      },
    })

    return success({ messages })
  } catch (err) {
    // 这是个装饰性的数字，挂了就当没有未读，绝不能因此让页头报错
    console.error('Get unread count error:', err)
    return success({ messages: 0 })
  }
}
