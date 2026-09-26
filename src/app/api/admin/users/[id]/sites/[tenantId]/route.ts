export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { writeAudit } from '@/lib/audit'
import { adminOrResponse } from '@/lib/admin/source-site'

/**
 * 超管改用户在某个渠道的站点关系（设计 6.2「本站拉黑 / 解除」「平台备注」、12.2；契约见实施分包 7.4）：
 *  · block：平台拉黑（blockedByKind='PLATFORM'），可以覆盖渠道自己的拉黑；渠道不能解除平台设的拉黑；
 *  · unblock：解除（可以推翻渠道的拉黑）；
 *  · platformNote：只有超管可读写的平台备注（不进任何渠道 DTO，不覆盖渠道备注）；
 *  · tags：渠道也看得见的标签（≤ 10 个、每个 ≤ 12 字）。
 * 只改**已有**的客户关系行：没有行 = 这个用户不是该渠道的客户，平台也不能凭空建一行（建行就等于把他的邮箱给了渠道，设计 5.5）。
 * 审计 actorKind=PLATFORM、tenantId=该渠道；publicDiff 只含 { blocked }——平台拉黑原因、平台备注都不给渠道（设计 5.8、6.4.2）。
 * 例外：平台备注的审计 tenantId=null（连「改过备注」这件事都不进渠道操作日志，见下）。
 */
const schema = z
  .object({
    block: z.object({ reason: z.string().trim().min(2, '请填写拉黑原因').max(200) }).optional(),
    unblock: z.literal(true).optional(),
    platformNote: z.string().trim().max(500).optional().nullable(),
    tags: z.array(z.string().trim().min(1).max(12, '每个标签最多 12 个字')).max(10, '标签最多 10 个').optional(),
  })
  .refine((v) => !(v.block && v.unblock), { message: '不能同时拉黑与解除' })
  .refine((v) => v.block !== undefined || v.unblock !== undefined || v.platformNote !== undefined || v.tags !== undefined, {
    message: '没有要修改的内容',
  })

export async function PATCH(request: NextRequest, { params }: { params: { id: string; tenantId: string } }) {
  const auth = await adminOrResponse()
  if ('res' in auth) return auth.res
  try {
    const userId = parseInt(params.id)
    const tenantId = parseInt(params.tenantId)
    if (!Number.isSafeInteger(userId) || userId <= 0) return notFound('用户不存在')
    // 主站没有「站点客户关系」（设计 5.5：只给 CHANNEL 建行）
    if (!Number.isSafeInteger(tenantId) || tenantId < 2) return error('只能修改渠道站的客户关系')
    const parsed = schema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return error(parsed.error.errors[0].message)
    const d = parsed.data

    const cur = await prisma.tenantCustomer.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
      select: { id: true, publicNo: true, blockedAt: true, blockedByKind: true, blockReason: true, platformNote: true, tags: true },
    })
    if (!cur) return notFound('该用户不是这个渠道的客户')

    const tags = d.tags ? Array.from(new Set(d.tags.map((t) => t.trim()).filter(Boolean))) : undefined
    const now = new Date()
    const result = await prisma.$transaction(async (tx) => {
      const data: Record<string, unknown> = {}
      if (d.block) Object.assign(data, { blockedAt: now, blockedBy: auth.user.id, blockedByKind: 'PLATFORM', blockReason: d.block.reason })
      if (d.unblock) Object.assign(data, { blockedAt: null, blockedBy: null, blockedByKind: null, blockReason: null })
      if (d.platformNote !== undefined) data.platformNote = d.platformNote?.trim() || null
      if (tags !== undefined) data.tags = tags
      const row = await tx.tenantCustomer.update({
        where: { id: cur.id },
        data,
        select: { publicNo: true, blockedAt: true, blockedByKind: true, blockReason: true, platformNote: true, tags: true, note: true },
      })
      const base = { actorUserId: auth.user.id, actorKind: 'PLATFORM' as const, tenantId, targetType: 'customer', targetId: cur.publicNo, req: request }
      if (d.block || d.unblock) {
        await writeAudit(tx, {
          ...base,
          action: d.block ? 'customer.block' : 'customer.unblock',
          reason: d.block?.reason,
          diff: { from: { blocked: cur.blockedAt != null, by: cur.blockedByKind, reason: cur.blockReason }, to: { blocked: !!d.block, by: d.block ? 'PLATFORM' : null } },
          publicDiff: { blocked: !!d.block },
        })
      }
      if (d.platformNote !== undefined) {
        /*
         * 平台备注的审计**不挂在渠道名下**（tenantId=null，渠道 id 记进仅超管可见的 diff）：渠道操作日志按 tenantId=本渠道
         * 列出平台行，即使不给 diff，一行「平台 · customer.platform_note · CUxxxx」也等于告诉渠道「平台对这个客户做了标注」
         * （常见是风险标记）。设计 6.4.2 第 8 条：platformNote 不出现在任何渠道响应里，包括它存在这件事。
         * 超管仍可按 targetType/targetId（有索引）查到这条。
         */
        await writeAudit(tx, {
          ...base,
          tenantId: null,
          action: 'customer.platform_note',
          diff: { channelTenantId: tenantId, from: cur.platformNote, to: row.platformNote },
        })
      }
      if (tags !== undefined) {
        await writeAudit(tx, { ...base, action: 'customer.tags', diff: { from: cur.tags, to: tags } })
      }
      return row
    })
    return success(
      {
        customerNo: result.publicNo,
        blocked: result.blockedAt != null,
        blockedByKind: result.blockedByKind,
        blockReason: result.blockReason,
        platformNote: result.platformNote,
        note: result.note,
        tags: result.tags,
      },
      d.block ? '已在该站限制下单' : d.unblock ? '已解除该站的下单限制' : '已保存',
    )
  } catch (err) {
    console.error('Admin update user site error:', err)
    return error('保存失败')
  }
}
