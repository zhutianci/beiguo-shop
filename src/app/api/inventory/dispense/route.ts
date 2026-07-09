export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error } from '@/lib/api'
import { cardKeyConfigured } from '@/lib/cardkey'
import { dispense, DispenseError, requireDispenseAuth } from '@/lib/dispense'

// 对外发卡：外部站点付款成功后调用，从共用卡密池原子领卡。
// 幂等：同一 (client, orderNo) 只发一次，重试返回同一批卡密。
const schema = z
  .object({
    client: z
      .string()
      .trim()
      .min(1)
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/, 'client 仅允许字母、数字和 _ -'),
    orderNo: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .regex(/^[A-Za-z0-9_.:-]+$/, 'orderNo 含非法字符'),
    sku: z.string().trim().min(1).max(64).optional(),
    productId: z.number().int().positive().optional(),
    quantity: z.number().int().min(1).max(50).default(1),
  })
  .refine((d) => !!d.sku || !!d.productId, { message: '需提供 sku 或 productId' })

export async function POST(request: NextRequest) {
  const authErr = requireDispenseAuth(request)
  if (authErr) return authErr

  if (!cardKeyConfigured()) return error('服务端未配置卡密密钥（CARDKEY_SECRET）', 500)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return error('请求体需为 JSON')
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return error(parsed.error.errors[0].message)

  try {
    const result = await dispense(parsed.data)
    // 一张都没发出（纯库存不足）→ 409，让外部站点挂起订单/退款，不要标记已发货。
    if (result.delivered === 0) {
      return error('库存不足，无可用卡密', 409)
    }
    return success(result)
  } catch (e) {
    if (e instanceof DispenseError) return error(e.message, e.status)
    console.error('[inventory/dispense] error', e)
    return error('发货失败', 500)
  }
}
