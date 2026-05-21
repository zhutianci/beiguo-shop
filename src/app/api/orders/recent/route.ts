export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'

// 邮箱脱敏：u***@example.com
function maskEmail(email: string | null): string {
  if (!email) return '匿名用户'
  const [name, domain] = email.split('@')
  if (!name || !domain) return '匿名用户'
  const visible = name.slice(0, Math.min(2, name.length))
  return `${visible}***@${domain}`
}

// 昵称脱敏：保留首尾，中间打码
function maskNickname(nickname: string | null): string {
  if (!nickname) return ''
  if (nickname.length <= 2) return nickname[0] + '*'
  return nickname[0] + '*'.repeat(Math.min(nickname.length - 2, 3)) + nickname.slice(-1)
}

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
