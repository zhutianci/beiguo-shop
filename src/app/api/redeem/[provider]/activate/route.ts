export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error } from '@/lib/api'
import { clientIp } from '@/lib/news/rate-limit'
import {
  getProvider,
  logRedeem,
  normalizeCdk,
  redeemRateLimited,
  loadOrderRef,
  resolveCard,
  saveOrderRef,
  toActivateFailure,
  validCdkShape,
} from '@/lib/redeem/service'

/**
 * 提交激活 / 售后重绑。
 *
 * ============ 这个文件里流过买家的账号凭据 ============
 * values 里装的是 Claude sessionKey 或 ChatGPT 的完整 session（含 accessToken），
 * 等价于账号密码。本文件对它做且只做一件事：**转发给适配器，然后忘掉**。
 *   · 不落库（logRedeem 的签名里根本没有能装它的参数）
 *   · 不打日志（下面任何一处 console 都只输出卡密 id 与状态码）
 *   · 不回显（响应体里只有状态、文案、账号展示名）
 * 改这个文件时，任何「顺手把 values 记一下方便排查」的念头都要打住 ——
 * 那就是在给自己攒一个等着被拖走的密码库。
 */

const schema = z.object({
  cdk: z.string().min(1).max(200),
  /** 键是适配器 check() 返回的 fields[].name。放宽长度是因为 GPT 的 session JSON 很长 */
  values: z.record(z.string().max(8000)).default({}),
  /** 买家选中的充值渠道（适配器返回了 variants 时必填） */
  variant: z.string().trim().max(40).optional(),
  /** true = 走售后重绑通道而不是首次激活 */
  rebind: z.boolean().optional(),
})

export async function POST(request: NextRequest, { params }: { params: { provider: string } }) {
  try {
    const provider = getProvider(params.provider)
    if (!provider) return error('充值系统不存在', 404)

    const body = await request.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (!parsed.success) return error('提交内容不完整，请检查后重试')

    const { values, rebind, variant } = parsed.data
    const cdk = normalizeCdk(parsed.data.cdk)
    if (!validCdkShape(cdk)) return error('卡密格式不正确，请检查是否复制完整')

    if (rebind && typeof provider.rebind !== 'function') {
      return error('该充值系统不支持自助重绑，请联系客服')
    }

    const ip = clientIp(request.headers)

    const resolved = await resolveCard(provider.key, cdk)
    if (!resolved.ok) {
      await logRedeem({
        cardKeyId: null,
        provider: provider.key,
        action: rebind ? 'REBIND' : 'ACTIVATE',
        state: resolved.reason,
        message: resolved.message,
        ip,
      })
      return error(resolved.message)
    }

    /*
     * 激活比查询限得更紧：查询是幂等的，激活会真的消耗卡密。
     * 单卡 1 分钟 3 次足够覆盖「填错了改一下重提交」，又挡得住脚本。
     */
    const limited = redeemRateLimited(rebind ? 'rebind' : 'activate', resolved.card.id, ip)
    if (limited) return error(limited, 429)

    let result
    try {
      result =
        rebind && provider.rebind
          ? await provider.rebind({ cdk, values })
          : await provider.activate({
              cdk,
              values,
              variant,
              cardKeyId: resolved.card.id,
              /*
               * 异步下单的平台靠这两个回调实现幂等：下单前先读回原订单号去查，
               * 已有未结订单就绝不重新下单。少了它，买家多点一次提交可能被扣两张卡。
               */
              loadOrderRef: () => loadOrderRef(resolved.card.id, provider.key),
              saveOrderRef: (ref) => saveOrderRef(resolved.card.id, provider.key, ref, ip),
            })
    } catch (e) {
      result = toActivateFailure(e)
    }

    await logRedeem({
      cardKeyId: resolved.card.id,
      provider: provider.key,
      action: rebind ? 'REBIND' : 'ACTIVATE',
      state: result.state,
      message: result.message,
      requestId: result.requestId,
      orderRef: result.orderRef,
      ip,
    })

    const { requestId: _omitReq, orderRef: _omitRef, ...pub } = result
    return success(pub)
  } catch (err) {
    // 【注意】这里绝不能打印 request body —— 里面有凭据
    console.error('Redeem activate error:', err)
    return error('提交失败，请稍后再试')
  }
}
