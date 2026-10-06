/**
 * 内容平台的防刷规则（2026-10-07 安全加固）。积分规则本身（设计 §8.2 的分值、L2 = 积分 ≥300）不动，
 * 这里只收紧「哪些行为算数」，挡的是小号互刷：
 *
 *  · 采纳：同一个问题只给一次 +20。以前按评论记一次，提问者在 15 条回答之间轮流点「采纳」就是 +300 = 直接 L2
 *    （L2 发帖免审、可发作者自荐、积分还能兑券）。
 *  · 被收藏：收藏者账号满 3 天才给作者 +2；每位作者每天最多 20 笔（+40）。注册只要邮箱验证码，
 *    10 个小号 × 15 篇就是 300 分。真实读者的收藏照常计数、照常显示，只是不再给新号刷分。
 *  · 举报：只有账号满 3 天的举报人计入「3 人举报自动隐藏」；管理员 / 认证 / 共建者的内容与精选内容不自动隐藏
 *    （仍进举报队列等人工处理）。以前 3 个当天注册的小号就能把任何帖子下线。
 * 账号年龄只读 users.created_at（不改表）。
 */
import { prisma } from '../db'

export const ANTI_FARM_MIN_AGE_MS = 3 * 86_400_000
export const FAVORITE_AWARDS_PER_AUTHOR_DAY = 20

/** 账号注册满 3 天（查不到账号按「不满」处理） */
export async function accountSeasoned(userId: number, now = Date.now()): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } })
  return !!u && now - u.createdAt.getTime() >= ANTI_FARM_MIN_AGE_MS
}

/** 被收藏给作者加分前的闸门：收藏者满 3 天、作者今天得到的收藏分未满上限 */
export async function favoriteAwardAllowed(authorId: number, favoriterId: number): Promise<boolean> {
  if (!(await accountSeasoned(favoriterId))) return false
  const since = new Date(Date.now() - 86_400_000)
  const today = await prisma.pointLog.count({ where: { userId: authorId, reason: 'FAVORITED', createdAt: { gte: since } } })
  return today < FAVORITE_AWARDS_PER_AUTHOR_DAY
}

/** 这个问题是否已经给过一次「回答被采纳」积分（积分记录的 refId 是评论 id，按本帖的评论 id 反查） */
export async function acceptAlreadyAwarded(postId: number): Promise<boolean> {
  const comments = await prisma.forumComment.findMany({ where: { postId, parentId: null }, select: { id: true } })
  if (!comments.length) return false
  const hit = await prisma.pointLog.findFirst({
    where: { reason: 'ACCEPTED', refId: { in: comments.map((c) => c.id) } },
    select: { id: true },
  })
  return !!hit
}

/** 作者是否受保护（不因举报数自动隐藏）：管理员、认证创作者、共建者 */
export async function authorProtectedFromAutoHide(userId: number | null): Promise<boolean> {
  if (!userId) return false
  const [u, p] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    prisma.creatorProfile.findUnique({ where: { userId }, select: { certifiedAt: true, coBuilder: true } }),
  ])
  return u?.role === 'ADMIN' || !!p?.certifiedAt || !!p?.coBuilder
}

/** 某个举报目标上「计数有效」的未处理举报数：举报人账号满 3 天 */
export async function seasonedOpenReports(targetKey: string): Promise<number> {
  const rows = await prisma.contentReport.findMany({ where: { targetKey, status: 'OPEN' }, select: { reporterId: true }, take: 50 })
  if (!rows.length) return 0
  const cutoff = new Date(Date.now() - ANTI_FARM_MIN_AGE_MS)
  return prisma.user.count({ where: { id: { in: rows.map((r) => r.reporterId) }, createdAt: { lte: cutoff } } })
}
