export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
// 脱敏函数与「推荐有奖」页共用一份，见 lib/mask.ts 顶部说明
import { maskEmail, maskNickname } from '@/lib/mask'

const FAKE_CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '苏州', '重庆', '天津']

export async function GET() {
  try {
    // 取最近 20 条已支付订单（不包含取消的）
    const orders = await prisma.order.findMany({
      where: {
        payStatus: { in: ['PAID'] },
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        productName: true,
        amount: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            nickname: true,
          },
        },
      },
    })

    const list = orders.map((order, i) => ({
      id: order.id,
      productName: order.productName,
      amount: Number(order.amount),
      // 优先用昵称（脱敏），没有就用邮箱（脱敏）
      displayName: order.user.nickname
        ? maskNickname(order.user.nickname)
        : maskEmail(order.user.email),
      city: FAKE_CITIES[i % FAKE_CITIES.length],
      createdAt: order.createdAt,
    }))

    return success(list)
  } catch (err) {
    console.error('Get recent orders error:', err)
    return error('获取最近订单失败')
  }
}
