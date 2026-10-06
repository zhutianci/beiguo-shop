/**
 * 积分与等级（内容平台 P2，设计 §8.2）。
 *
 * 积分只由 point_logs 累加：唯一约束 (userId, reason, refId, actorId) 保证同一件事只记一次
 * （同一篇被精选只 +50 一次；同一个人收藏同一篇只 +2 一次，取消再收藏不重复加）。
 * 不按浏览、点赞给分：那会招来刷量（设计 §8.3「不做」）。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { ensureHandle } from './creator'

export const POINTS = {
  APPROVED: 5, // 内容过审公开
  FEATURED: 50, // 被精选
  FAVORITED: 2, // 被收藏（每个收藏者一次）
  REMIXED: 10, // 被别人「同款」二创
  ACCEPTED: 20, // 回答被采纳
  VIOLATION: -50, // 举报核实
} as const
export type PointReason = keyof typeof POINTS | 'ADJUST'

/** 记一笔积分。重复的同一件事静默忽略（返回 false）。失败不抛：积分是附加奖励，不能拖垮主流程 */
export async function award(userId: number | null | undefined, reason: PointReason, refId = 0, actorId = 0, delta?: number): Promise<boolean> {
  if (!userId) return false
  const d = delta ?? (reason === 'ADJUST' ? 0 : POINTS[reason])
  if (!d) return false
  try {
    await prisma.pointLog.create({ data: { userId, delta: d, reason, refId, actorId } })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return false
    console.error('[points award]', e)
    return false
  }
  try {
    await ensureHandle(userId)
    await prisma.creatorProfile.update({ where: { userId }, data: { points: { increment: d } } })
  } catch (e) {
    console.error('[points profile]', e)
  }
  return true
}

/** 等级：按累计积分分档（只用于展示与 L2 判定；违规扣分会让积分下降，等级随之下降） */
export const LEVELS = [
  { min: 0, name: '新人' },
  { min: 50, name: '学徒' },
  { min: 200, name: '创作者' },
  { min: 500, name: '资深创作者' },
  { min: 1500, name: '大师' },
] as const

export function levelOf(points: number): { lv: number; name: string; next: number | null } {
  let i = 0
  for (let k = 0; k < LEVELS.length; k++) if (points >= LEVELS[k].min) i = k
  return { lv: i + 1, name: LEVELS[i].name, next: LEVELS[i + 1]?.min ?? null }
}

/** 积分达到这个数即视为 L2 创作者（设计 §8.1：3 篇精选，或积分 ≥300） */
export const L2_MIN_POINTS = 300
