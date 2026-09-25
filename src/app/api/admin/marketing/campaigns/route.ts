export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { success, error } from '@/lib/api'
import { adminGuard } from '@/lib/admin-guard'
import { requireAdmin } from '@/lib/auth'
import { CAMPAIGN_STATUSES, EMPTY_HALT, audienceSpecSchema, type CampaignStatus, type HaltState } from '@/lib/marketing/types'
import { listCampaigns } from '@/lib/marketing/stats'
import { getConfig, getHalt, isHalted, isDryRun } from '@/lib/marketing/config'
import { createDraft, knownErrorResponse, parsePaging, readJsonBody, totalPages } from '@/lib/marketing/campaign-repo'

/**
 * 营销活动列表 / 新建草稿。
 *
 * 鉴权：middleware 之外每个 handler 第一行 adminGuard（CVE-2025-29927 可绕过 middleware，理由见 lib/admin-guard.ts）。
 * 列表顺带返回全局开关、急停、dry-run —— 列表页顶部的横幅要用，省一次请求。
 */

export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const { searchParams } = new URL(request.url)
    const { page, pageSize } = parsePaging(searchParams, 20, 100)
    const rawStatus = (searchParams.get('status') || '').trim()
    const status = (CAMPAIGN_STATUSES as readonly string[]).includes(rawStatus) ? (rawStatus as CampaignStatus) : null
    const keyword = (searchParams.get('keyword') || '').trim().slice(0, 100) || null

    const [{ list, total }, config, halt] = await Promise.all([
      listCampaigns({ page, pageSize, status, keyword }),
      getConfig(),
      // 横幅是展示用的：急停状态读失败时不让整个列表打不开
      getHalt().catch((e): HaltState => {
        console.error('[admin/marketing] 读取急停状态失败:', (e as Error)?.message || e)
        return EMPTY_HALT
      }),
    ])

    return success({
      list,
      total,
      page,
      pageSize,
      totalPages: totalPages(total, pageSize),
      enabled: config.enabled,
      halt: { ...halt, active: isHalted(halt) },
      dryRun: isDryRun(),
    })
  } catch (err) {
    console.error('[admin/marketing] 获取活动列表失败:', err)
    return error('获取活动列表失败')
  }
}

const createSchema = z
  .object({
    name: z.string().max(100, '活动名称最多 100 字').optional(),
    preset: z.string().trim().max(64).optional(),
    templateId: z.number().int().positive().optional(),
    fromCampaignId: z.number().int().positive().optional(),
    audience: audienceSpecSchema.optional(),
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
    // 手工受众最多 5000 个 id，远小于 256KB
    const body = await readJsonBody(request, 256 * 1024)
    if (!body.ok) return error(body.message, body.status)
    const parsed = createSchema.safeParse(body.body)
    if (!parsed.success) return error(parsed.error.errors[0].message)

    const detail = await createDraft(parsed.data, me.id)
    return success(detail, '已新建草稿')
  } catch (err) {
    const known = knownErrorResponse(err)
    if (known) return known
    console.error('[admin/marketing] 新建活动失败:', err)
    return error('新建活动失败')
  }
}
