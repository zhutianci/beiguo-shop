/**
 * 营销模块的审计日志。fire-and-forget 语义：写失败只打日志，不影响主流程。
 *
 * 【实现方：发送引擎】签名是契约。detail 不写收件人邮箱等 PII（批量操作只写计数）。
 */
import { prisma } from '@/lib/db'
import type { AuditAction } from './types'

/** detail 列是 TEXT（≤65535 字节）。按 3 字节/字估算留足余量，超长截断而不是让整条审计写失败 */
const DETAIL_MAX_CHARS = 20000

export async function audit(
  action: AuditAction,
  opts: { actorId?: number | null; campaignId?: number | null; detail?: string | Record<string, unknown> | null } = {}
): Promise<void> {
  try {
    let detail: string | null = null
    if (opts.detail != null) {
      detail = typeof opts.detail === 'string' ? opts.detail : JSON.stringify(opts.detail)
      if (detail.length > DETAIL_MAX_CHARS) detail = detail.slice(0, DETAIL_MAX_CHARS)
    }
    await prisma.marketingAudit.create({
      data: {
        action,
        actorId: opts.actorId ?? null,
        campaignId: opts.campaignId ?? null,
        detail,
        // 「今天测试发了几封」按 createdAt 统计 —— 用于比较的时间一律由应用写（交接文档：改 TZ 引发的事故）
        createdAt: new Date(),
      },
    })
  } catch (err) {
    // 只记动作名与活动号：detail 里可能有管理员填的备注，不往日志里抄
    console.error('[marketing] 写审计失败', action, opts.campaignId ?? '-', (err as Error)?.message)
  }
}
