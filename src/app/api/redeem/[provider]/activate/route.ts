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
  claimForIrreversibleRedeem,
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

/**
 * 单个字段的长度上限。
 *
 * 【这个数字踩过坑，别再往回调】原来是 8000，理由是「GPT 的 session JSON 很长」——
 * 但 8000 根本不够。线上实测一份真实的 ChatGPT AuthSession 是 **6213 字符**，
 * 其中 sessionToken（JWE）就占 3635、accessToken（JWT）占 1692，
 * 而这两个都是**变长**的：账号信息越多越长。于是体积稍大的账号就会被挡在门外，
 * 买家看到的还是一句「提交内容不完整」，他越是重新复制越是过不去。
 *
 * 现在给到 100KB：比实测值大 16 倍，任何正常 session 都装得下；
 * 同时仍然有界 —— 上游对整个请求体的上限是 256KB，真超了那边会回 PAYLOAD_TOO_LARGE，
 * 而 nginx 的 client_max_body_size 是 20m，不会在更外层先被截断。
 */
const MAX_FIELD_LEN = 100_000

const schema = z.object({
  cdk: z.string().min(1).max(200),
  /** 键是适配器 check() 返回的 fields[].name */
  values: z.record(z.string().max(MAX_FIELD_LEN)).default({}),
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
    if (!parsed.success) {
      /*
       * 【文案必须说对方向】「太长」和「不完整」是相反的两件事。
       * 之前一律回「提交内容不完整，请检查后重试」，买家于是回去一遍遍重新复制 ——
       * 而内容其实是超长，他怎么复制都不可能过。这一条把两者分开。
       *
       * 【只看长度，绝不碰内容】values 里装的是等同账号密码的凭据，
       * 这里只读 issue 的类型与 maximum，不读、不记、不回显任何值。
       */
      const tooBig = parsed.error.issues.find((i) => i.code === 'too_big')
      return error(
        tooBig
          ? '粘贴的内容过长，请确认只粘贴了 session 页面上的那一段 JSON，不要把整个网页一起复制进来'
          : '提交内容不完整，请检查后重试'
      )
    }

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
              /*
               * 卡付走 V1 时上游没有幂等键，防重复扣卡全靠这一次原子占位。
               * 见 lib/redeem/service.ts 的 claimForIrreversibleRedeem。
               */
              claimIrreversible: () => claimForIrreversibleRedeem(resolved.card.id),
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
