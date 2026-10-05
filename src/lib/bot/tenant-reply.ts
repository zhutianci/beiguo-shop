/**
 * 渠道快速回复令牌（docs/微信机器人-设计.md §5.5，站长 Q10）。
 *
 * 分站群的买家留言推送带一个免登录链接：代理点开就是渠道自己域名上的回复页，只能读这一单的留言、回一条。
 * 与平台的 quick-reply.ts 刻意分开：
 *  - 平台令牌「只发平台群，永不发渠道」（多渠道设计 11.4），这里另起一种；
 *  - 签名密钥用 deriveKey('tenant-reply')（tenant/crypto.ts 早已预留这个用途，从 JWT_SECRET 派生，随它轮换失效）；
 *  - 令牌里放**订单公开编号**（渠道侧一律用公开编号），外加分站 id 与过期时间；页面必须开在该分站自己的域名上。
 *
 * 格式：<orderNo>.<tenantId36>.<exp36>.<sig43>。验签任何一步不对都返回 null，不区分原因。
 * 回复页与接口（/partner-reply/<令牌>）在 P1b 落地；在那之前 BOT_TENANT_REPLY 不开，推送里给渠道后台订单链接。
 */
import { createHmac, timingSafeEqual } from 'crypto'
import { prisma } from '../db'
import { storefrontById } from '../storefront/resolve'
import { deriveKey } from '../tenant/crypto'
import { botConfigForDelivery } from './config'

const ORDER_NO_RE = /^[0-9A-Z]{8,32}$/

export function tenantReplyEnabled(): boolean {
  return (process.env.BOT_TENANT_REPLY || '').trim() === '1'
}

function sign(payload: string): string {
  return createHmac('sha256', deriveKey('tenant-reply')).update(payload).digest('base64url')
}

export function issueTenantReplyToken(orderNo: string, tenantId: number, ttlMs: number, now = Date.now()): string {
  if (!ORDER_NO_RE.test(orderNo)) throw new Error('订单编号形状不对')
  if (!Number.isSafeInteger(tenantId) || tenantId < 2) throw new Error('只给渠道单签发')
  const payload = `${orderNo}.${tenantId.toString(36)}.${(now + ttlMs).toString(36)}`
  return `${payload}.${sign(payload)}`
}

export interface TenantReplyClaim {
  orderNo: string
  tenantId: number
  expiresAt: Date
}

export function verifyTenantReplyToken(token: string, now = Date.now()): TenantReplyClaim | null {
  try {
    if (!token || token.length > 200) return null
    const parts = token.split('.')
    if (parts.length !== 4) return null
    const [orderNo, tid36, exp36, sig] = parts
    // 显式格式白名单：订单号大写字母数字、两段 36 进制小写、签名 43 位 base64url（登录 JWT 恒以 eyJ 开头，过不了第一段）
    if (!ORDER_NO_RE.test(orderNo) || !/^[0-9a-z]{1,8}$/.test(tid36) || !/^[0-9a-z]{1,12}$/.test(exp36) || !/^[A-Za-z0-9_-]{43}$/.test(sig)) {
      return null
    }
    const expected = sign(`${orderNo}.${tid36}.${exp36}`)
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    const exp = parseInt(exp36, 36)
    const tenantId = parseInt(tid36, 36)
    if (!Number.isFinite(exp) || exp <= now || !Number.isSafeInteger(tenantId) || tenantId < 2) return null
    return { orderNo, tenantId, expiresAt: new Date(exp) }
  } catch {
    return null
  }
}

/** 推送用：给渠道单生成快速回复链接；功能未开、订单不属于该分站、签不出来时返回 null（调用方回落到渠道后台链接） */
export async function tenantReplyLink(orderId: number, tenantId: number): Promise<string | null> {
  if (!tenantReplyEnabled() || tenantId < 2) return null
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { orderNo: true, tenantId: true } })
  if (!order || order.tenantId !== tenantId) return null
  const sf = await storefrontById(tenantId)
  // 筹备中 / 已停业的店面上回复页一律 404（与渠道后台留言接口同一口径）：不给链接，推送里回落到渠道后台
  if (!sf?.origin || sf.status === 'DRAFT' || sf.status === 'TERMINATED') return null
  const cfg = await botConfigForDelivery()
  const token = issueTenantReplyToken(order.orderNo, tenantId, cfg.tenantReplyTtlDays * 86400_000)
  return `${sf.origin}/partner-reply/${token}`
}
