export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error } from '@/lib/api'
import { clientIp } from '@/lib/news/rate-limit'
import {
  getProvider,
  loadOrderRef,
  logRedeem,
  normalizeCdk,
  redeemRateLimited,
  resolveCard,
  toCheckFailure,
  validCdkShape,
} from '@/lib/redeem/service'

/**
 * 查询卡密状态。公开接口（不需要登录）。
 *
 * 【为什么不要求登录】买家常常是换台设备、或者把卡转给别人去充。
 * 强制登录挡不住坏人（注册一个号就行），只会挡住真买家。
 * 真正的闸门是 resolveCard —— 卡不是本站发出的就直接拒，
 * 这比登录有效得多，也让我们不会变成上游的公开撞库跳板。
 *
 * 路由是 [provider] 动态段：/api/redeem/sysa/check、以后 /api/redeem/sysb/check
 * 自动可用，加平台不用加路由。
 */

const schema = z.object({ cdk: z.string().min(1).max(200) })

export async function POST(request: NextRequest, { params }: { params: { provider: string } }) {
  try {
    const provider = getProvider(params.provider)
    if (!provider) return error('充值系统不存在', 404)

    const body = await request.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error('请输入卡密')

    const cdk = normalizeCdk(parsed.data.cdk)
    if (!validCdkShape(cdk)) return error('卡密格式不正确，请检查是否复制完整')

    const ip = clientIp(request.headers)

    // 先限流再查库：没通过限流的请求不该产生任何数据库查询
    const limited = redeemRateLimited('check', null, ip)
    if (limited) return error(limited, 429)

    const resolved = await resolveCard(provider.key, cdk)
    if (!resolved.ok) {
      await logRedeem({
        cardKeyId: null,
        provider: provider.key,
        action: 'CHECK',
        state: resolved.reason,
        message: resolved.message,
        ip,
      })
      return error(resolved.message)
    }

    const perCard = redeemRateLimited('check', resolved.card.id, ip)
    if (perCard) return error(perCard, 429)

    let result
    try {
      result = await provider.check(cdk, {
        cardKeyId: resolved.card.id,
        productName: resolved.card.productName,
        /*
         * 【这就是「已充过的卡不该再显示表单」的依据】
         * sysb 的上游没有验卡接口，我们唯一知道这张卡充过没有的途径，
         * 就是本站记下的上游订单号 —— 有它就能查出真实状态。
         */
        loadOrderRef: () => loadOrderRef(resolved.card.id, provider.key),
      })
    } catch (e) {
      result = toCheckFailure(e)
    }

    await logRedeem({
      cardKeyId: resolved.card.id,
      provider: provider.key,
      action: 'CHECK',
      state: result.state,
      message: result.message,
      requestId: result.requestId,
      ip,
    })

    /*
     * requestId 不回给前端：它是排查用的内部线索，展示出去只会让买家困惑。
     * 需要时从 redeem_logs 里按卡密 id 查。
     */
    const { requestId: _omit, ...pub } = result
    return success(pub)
  } catch (err) {
    console.error('Redeem check error:', err)
    return error('查询失败，请稍后再试')
  }
}
