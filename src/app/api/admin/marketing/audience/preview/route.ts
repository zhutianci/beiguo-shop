export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { requireAdmin } from '@/lib/auth'
import { rateLimited } from '@/lib/news/rate-limit'
import { TOPICS, audienceSpecSchema } from '@/lib/marketing/types'
import { previewAudience } from '@/lib/marketing/audience'
import { readJsonBody } from '@/lib/marketing/campaign-repo'

/**
 * 受众预估：命中、可发、按原因排除、频控估算、样本 20 人。
 *
 * 【为什么限流】每次预估都是对全体用户的一组集合查询（付款统计 groupBy、点击、抑制名单…），
 * 受众面板改一次条件就会调一次；前端有防抖，这里再兜一层，防止一个卡住的循环把库压垮。
 */

const bodySchema = z
  .object({
    audience: audienceSpecSchema,
    topic: z.enum(TOPICS, { errorMap: () => ({ message: '主题分类不正确' }) }),
  })
  .strip()

export async function POST(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  let me: { id: number }
  try {
    me = await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }
  try {
    if (rateLimited(`mkt-audience:${me.id}`, { windowMs: 60_000, max: 40 })) {
      return error('预估太频繁了，请稍等几秒', 429)
    }
    const body = await readJsonBody(request, 256 * 1024)
    if (!body.ok) return error(body.message, body.status)
    const parsed = bodySchema.safeParse(body.body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const result = await previewAudience(parsed.data.audience, parsed.data.topic)
    return success(result)
  } catch (err) {
    console.error('[admin/marketing] 受众预估失败:', err)
    return error('受众预估失败')
  }
}
