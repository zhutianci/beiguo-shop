export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { success, error } from '@/lib/api'
import { RATE_SCALE, lotteryConfigSchema, sumEnabledBp } from '@/lib/lottery'
import { getLotteryConfig, saveLotteryConfig } from '@/lib/lottery-server'

/**
 * 下单有奖 · 活动配置（开关 / 参与门槛 / 规则说明）+ 后台概览数字。
 *
 * 【为什么 handler 里还要再验一次管理员】middleware 是唯一的门，而 Next 14.2.3 有
 * CVE-2025-29927（带 x-middleware-subrequest 头即可绕过 middleware）。目前只靠
 * nginx 清掉那个头兜着。这个接口改的是「新订单有没有抽奖资格」，属于会影响发奖的配置，
 * 所以照 cardkeys/export 的写法在 handler 里独立鉴权。
 *
 * 静态段 /config 优先于同级的动态段，不会被 prizes/[id] 之类吃掉。
 */

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }

  try {
    const [config, prizes, entryTotal, drawn, pending, won, customPending, voided] = await Promise.all([
      getLotteryConfig(),
      prisma.lotteryPrize.findMany({ select: { id: true, rateBp: true, enabled: true } }),
      prisma.lotteryEntry.count(),
      prisma.lotteryEntry.count({ where: { state: 'DRAWN' } }),
      prisma.lotteryEntry.count({ where: { state: 'PENDING' } }),
      prisma.lotteryEntry.count({ where: { state: 'DRAWN', won: true } }),
      prisma.lotteryEntry.count({ where: { state: 'DRAWN', prizeType: 'CUSTOM', fulfillState: 'PENDING' } }),
      prisma.lotteryEntry.count({ where: { state: 'VOID' } }),
    ])

    const enabledRateBp = sumEnabledBp(prizes)
    return success({
      config,
      stats: {
        prizeCount: prizes.length,
        // 概率为 0 的启用奖项抽不到，不算「可中的奖项」—— 与 lib/lottery.ts 的 orderPrizes 同口径
        enabledPrizeCount: prizes.filter((p) => p.enabled && p.rateBp > 0).length,
        enabledRateBp,
        overLimit: enabledRateBp > RATE_SCALE,
        entryTotal,
        drawn,
        pending,
        won,
        customPending,
        voided,
      },
    })
  } catch (err) {
    console.error('Get lottery config error:', err)
    return error('获取活动配置失败')
  }
}

export async function PUT(request: NextRequest) {
  let operator: { id: number; email: string | null }
  try {
    const me = await requireAdmin()
    operator = { id: me.id, email: me.email }
  } catch {
    return error('无管理员权限', 403)
  }

  try {
    const body = await request.json().catch(() => ({}))
    const parsed = lotteryConfigSchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    await saveLotteryConfig(parsed.data)
    // 回读一次：返回的是库里真正生效的那份（saveLotteryConfig 会对金额取两位），而不是请求体
    const config = await getLotteryConfig()
    // 开关直接决定新订单有没有资格，出了争议要能查到是谁、什么时候改的
    console.info('[lottery] 活动配置已更新', {
      by: operator.email || operator.id,
      enabled: config.enabled,
      minOrderAmount: config.minOrderAmount,
    })
    return success(config, '已保存')
  } catch (err) {
    console.error('Save lottery config error:', err)
    return error('保存失败')
  }
}
