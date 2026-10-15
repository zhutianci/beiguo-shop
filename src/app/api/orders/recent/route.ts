export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
// 脱敏函数与「推荐有奖」页共用一份，见 lib/mask.ts 顶部说明
import { maskEmail, maskNickname } from '@/lib/mask'
import { getStorefront } from '@/lib/storefront/resolve'
import { excludeCarriers } from '@/lib/order-scope'
import { readBotConfig } from '@/lib/bot/config'
import { rateLimited } from '@/lib/news/rate-limit'
import { ipKeyOf } from '@/lib/security/ip-ban'

const FAKE_CITIES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '西安', '苏州', '重庆', '天津']

export async function GET(request: Request) {
  // 店面解析不进 try（设计 4.4 第 7 条）
  const sf = await getStorefront()
  if (!sf) return error('资源不存在', 404)
  // 公开接口，每次翻页都会调一次（2026-10-15 安全复查：以前不限流，可以拿来压库）。同一出口每分钟 30 次，正常浏览用不完
  const ip = ipKeyOf(request.headers)
  if (ip && rateLimited(`orders-recent:${ip}`, { windowMs: 60_000, max: 30 })) return success([])
  try {
    // 微信机器人「提卡」单不进实时成交（docs/微信机器人-设计.md §8.7）：提卡专用账号的 id 在 bot_config.issueUserId。
    // 配置读不到时不排除（那时机器人也提不了卡），不让成交滚动因此报错
    const botCfg = await readBotConfig().catch(() => null)
    const issueUserId = botCfg?.ok ? botCfg.config.issueUserId : null
    // 取最近 20 条已支付订单（不包含取消的：已付款又取消 = 线下退款，不能再当成交展示）。
    // 只取本店的：主站的成交滚动不能把渠道单混进来，渠道站（P0 不挂载这个组件）直连接口也拿不到主站的成交（设计 11.1）
    const orders = await prisma.order.findMany({
      where: {
        tenantId: sf.id,
        payStatus: 'PAID',
        deliveryStatus: { not: 'CANCELLED' },
        // 两种系统载体（接码单、充值单）不进首页实时成交（docs/短信接码-设计.md D12、§6.6 第 17 条）
        ...excludeCarriers(),
        ...(issueUserId ? { userId: { not: issueUserId } } : {}),
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        productName: true,
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
      // 不下发成交价（站长 2026-10-13）：各人成交价不同（内推专属价 / 优惠券 / 改价），弹窗不再显示价格，接口也就不给
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
