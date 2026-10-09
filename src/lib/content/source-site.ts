/**
 * 内容模块下放（docs/多渠道分销-内容模块下放.md）：渠道站上发的帖子 / 评论在后台审核列表里标出来源站。
 * forum_posts / forum_comments.source_tenant_id：1 = 主站，其余是渠道 id。一页最多几十个不同的 id，一次查完。
 */
import { prisma } from '../db'

/** id → 渠道代号（主站与查不到的不在表里） */
export async function sourceSiteCodes(ids: number[]): Promise<Map<number, string>> {
  const uniq = Array.from(new Set(ids.filter((x) => Number.isInteger(x) && x > 1)))
  if (!uniq.length) return new Map()
  const rows = await prisma.tenant.findMany({ where: { id: { in: uniq } }, select: { id: true, code: true } })
  return new Map(rows.map((r) => [r.id, r.code]))
}
