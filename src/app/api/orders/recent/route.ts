export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
// 脱敏函数与「推荐有奖」页共用一份，见 lib/mask.ts 顶部说明
import { maskEmail, maskNickname } from '@/lib/mask'
import { getStorefront } from '@/lib/storefront/resolve'

const FAKE_CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '苏州', '重庆', '天津']

export async function GET() {
  // 店面解析不进 try（设计 4.4 第 7 条）
  const sf = await getStorefront()
  if (!sf) return error('资源不存在', 404)
  try {
    // 取最近 20 条已支付订单（不包含取消的：已付款又取消 = 线下退款，不能再当成交展示）。
    // 只取本店的：主站的成交滚动不能把渠道单混进来，渠道站（P0 不挂载这个组件）直连接口也拿不到主站的成交（设计 11.1）
    const orders = await prisma.order.findMany({
      where: {
        tenantId: sf.id,
        payStatus: 'PAID',
        deliveryStatus: { not: 'CANCELLED' },
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        productName: true,
        amount: true,
        user: {
          select: {
            email: true,
            nickname: true,
          },
        },
      },
    })

    const list = orders.map((order, i) => ({
      // 不下发订单自增 id：相邻两次拉取的差值就是全站建单量。前端只拿它当 key / 取色，给序号即可
      id: i + 1,
      productName: order.productName,
      amount: Number(order.amount),
      // 优先用昵称（脱敏），没有就用邮箱（脱敏）
      displayName: order.user.nickname
        ? maskNickname(order.user.nickname)
        : maskEmail(order.user.email),
      city: FAKE_CITIES[i % FAKE_CITIES.length],
      // createdAt 不再下发：前端不用它（相对时间是随机生成的），只会暴露精确成交时刻
    }))

    return success(list)
  } catch (err) {
    console.error('Get recent orders error:', err)
    return error('获取最近订单失败')
  }
}
