export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { notFound } from '@/lib/api'
import { recordProbe } from '@/lib/security/probe'

/*
 * 支付回调蜜罐（2026-10-15 攻防加固，lib/security/probe.ts）。
 *
 * /api/pay 下真实存在的只有 sms-notify、vmq/create、vmq/status——Next 先匹配这些具体路由，只有不存在的路径才落到这里。
 * 真实的到账回调只有 SmsForwarder 打 sms-notify（且要令牌）；落到这里的全是在盲猜回调地址的人
 * （10-15 那个人猜了 /api/pay/notify、/api/pay/vmq/notify、/api/pay/callback 等 30 多个）。
 * 响应与普通 404 一样，不暴露这是蜜罐。
 */
async function handle(request: NextRequest) {
  await recordProbe(request, 'PAY_CALLBACK')
  return notFound()
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
