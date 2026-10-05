export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error } from '@/lib/api'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { clientIp, rateLimited } from '@/lib/news/rate-limit'
import { crossSiteReason } from '@/lib/same-origin'
import { CardImportError } from '@/lib/cardkey-import'
import { botEnabledByEnv } from '@/lib/bot/config'
import { RESTOCK_MAX_BYTES, RestockError, submitRestock } from '@/lib/bot/ops/restock'

const bodySchema = z.object({
  token: z.string().min(1).max(64),
  productId: z.number().int().positive('请选择商品'),
  content: z.string().min(1, '请粘贴卡密，每行一张').max(RESTOCK_MAX_BYTES + 1024, '一次最多 200 KB，请分批提交'),
  cost: z.number().min(0, '成本不能为负').max(999999).optional(),
  batch: z.string().trim().max(40).optional().nullable(),
  redeemProvider: z.string().trim().max(20).optional().nullable(),
  redeemUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === '' || /^https?:\/\//i.test(v), '兑换地址需以 http:// 或 https:// 开头')
    .optional()
    .nullable(),
})

/**
 * 一次性补货页的提交（docs/微信机器人-设计.md §9.2）。令牌放在 body 里，不进 URL、不进访问日志。
 *  · 第一句 denyOnChannel()：平台内部工具，渠道 Host 一律 404（nginx 渠道 /api 白名单里本来也没有 bot）；
 *  · BOT_ENABLED 未开 → 404（机器人休眠时这个入口不存在）；
 *  · 按 IP 限频；同源校验只作加固（微信内置浏览器的 fetch 一般带 Origin，缺头的非浏览器请求照常放行，凭证是令牌）；
 *  · 校验、导入、作废令牌都在 submitRestock 的事务里：导进去了才作废，导入 0 张（全是重复）链接仍有效。
 */
export async function POST(request: NextRequest) {
  const denied = await denyOnChannel()
  if (denied) return denied
  try {
    if (!botEnabledByEnv()) return error('资源不存在', 404)
    const ip = clientIp(request.headers)
    if (rateLimited(`botrestock:${ip}`, { windowMs: 10 * 60_000, max: 20 })) return error('提交太频繁，请稍后再试', 429)
    const cross = crossSiteReason(request.headers)
    if (cross) {
      console.warn('[bot] 补货提交被同源校验拦下：', cross)
      return error('请求来源不对', 403)
    }
    const body = await request.json().catch(() => null)
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const r = await submitRestock(parsed.data, ip && ip !== 'unknown' ? ip : null)
    const res = success(r, r.consumed ? '补货完成' : '没有导入新卡')
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (e) {
    if (e instanceof RestockError) return error(e.message, e.status)
    if (e instanceof CardImportError) return error(e.message, e.status)
    console.error('[bot] 补货提交失败', (e as Error)?.message)
    return error('补货失败，请稍后再试（链接没有作废）', 500)
  }
}
