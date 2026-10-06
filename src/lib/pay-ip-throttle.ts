/**
 * 新建收款单的按 IP 限频（2026-10-07 安全加固）。
 *
 * 【为什么】每张收款单占一个唯一金额，而 allocateAmount 每个价位只有 50 格、全站共用（lib/vmq.ts）。
 * 每人上限 VMQ_MAX_OPEN_PER_USER（3）挡住了单个账号；可注册不要钱（一个 IP 每天能收 20 封注册码），
 * 17 个小号各挂 3 张就能把一个价位占满 20 分钟，真实买家一律「当前下单人数较多」，每 20 分钟重来一次，零成本。
 * 这里按 IP（IPv6 按 /64）再加一层：一个收款单有效期内，同一出口最多新建 VMQ_MAX_NEW_PER_IP 张（默认 8）。
 *
 * 【只数新建】复用本单已有的收款单（reusing）不计数、不受限；调用方只在「将要占新金额」时调用。
 * 【拿不到请求上下文 / IP 时放行】itest 直接调 lib、cron 补单都不在请求里；nginx 拿不到地址时是 'unknown'，
 *   不能让所有人共用一个桶。
 * 【误伤面】手机运营商 CGNAT 会让很多人共用一个出口 IPv4；本站一个出口 20 分钟内新建 8 张收款单的真实场景极少，
 *   超了的买家看到的是「请先完成已有订单的支付或稍后再试」，可以通过 VMQ_MAX_NEW_PER_IP 调大（0 = 关闭这一层）。
 */
import { headers } from 'next/headers'
import { ipKey } from './auth-throttle'
import { clientIp, rateLimited } from './news/rate-limit'
import { VMQ_TIMEOUT_MIN } from './vmq'

const raw = parseInt(process.env.VMQ_MAX_NEW_PER_IP || '8')
export const VMQ_MAX_NEW_PER_IP = Number.isFinite(raw) && raw >= 0 ? raw : 8

export const NEW_PAYMENT_IP_MSG = '当前网络下新发起的付款过多，请先完成已有订单的支付，或稍后再试'

/** true = 本次新建收款单应拒绝（429）。只在确定要占新金额时调用 */
export function newPaymentIpLimited(): boolean {
  if (VMQ_MAX_NEW_PER_IP === 0) return false
  let h: Headers
  try {
    h = headers() as unknown as Headers
  } catch {
    return false // 不在请求上下文里
  }
  const ip = clientIp(h)
  if (!ip || ip === 'unknown') return false
  return rateLimited(`vmq-new-ip:${ipKey(ip)}`, { windowMs: Math.max(1, VMQ_TIMEOUT_MIN) * 60_000, max: VMQ_MAX_NEW_PER_IP })
}
