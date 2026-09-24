export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { drawForOrder, LotteryError } from '@/lib/lottery-server'
import { rateLimited } from '@/lib/news/rate-limit'

/*
 * 客户端只能给一个订单号。选哪个奖、有没有资格、是不是本人的单、付没付款，
 * 全部由 lib/lottery-server.drawForOrder 在服务端判定（安全口径写在那个函数的注释里）。
 * 这里不要再接收任何别的字段 —— 哪怕只是「前端算好的中奖结果用来展示」也不行。
 */
const schema = z.object({
  orderNo: z
    .string({ required_error: '缺少订单号', invalid_type_error: '订单号格式不正确' })
    .trim()
    .min(1, '缺少订单号')
    .max(32, '订单号格式不正确'),
})

// 买家在「我的订单」里拆红包（下单有奖）
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    // 按用户限流而不是按 IP：IP 在隧道后可伪造（见 lib/news/rate-limit 的说明）。
    // 正常人一分钟点不了 20 次，超了多半是脚本在拿订单号撞
    if (rateLimited(`lottery:${user.id}`, { windowMs: 60_000, max: 20 })) {
      return error('操作太频繁，请稍后再试', 429)
    }

    const parsed = schema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const { alreadyDrawn, view } = await drawForOrder(user.id, parsed.data.orderNo)
    return success({ alreadyDrawn, view })
  } catch (err) {
    // LotteryError 的文案是写给买家看的（「订单付款后才能抽奖」之类），原样返回
    if (err instanceof LotteryError) return error(err.message, err.status)
    console.error('Lottery draw error:', err)
    return error('抽奖失败，请稍后重试', 500)
  }
}
