/**
 * 站内通知（内容平台 P2，设计 §7.6）。写库即可，前台从 /api/me/notifications 读。
 * 全部 fire-and-forget：通知失败不能影响评论、审核这些主流程。不给自己发通知。
 */
import { prisma } from '../db'

export type InboxKind =
  | 'REPLY' // 有人评论了你的内容 / 回复了你的评论
  | 'ACCEPTED' // 你的回答被采纳
  | 'FEATURED' // 你的内容被精选
  | 'REVIEW_OK' // 审核通过
  | 'REVIEW_REJECT' // 未通过审核
  | 'NEW_FROM_FOLLOWEE' // 关注的作者发布了新内容
  | 'REMIXED' // 有人做了你的提示词的同款
  | 'REPORT_HIDDEN' // 你的内容因多人举报被暂时隐藏

export function notifyUser(
  userId: number | null | undefined,
  kind: InboxKind,
  title: string,
  opts: { link?: string; body?: string; actorId?: number | null } = {},
): void {
  if (!userId || (opts.actorId && opts.actorId === userId)) return
  prisma.notification
    .create({ data: { userId, kind, title: title.slice(0, 200), body: opts.body?.slice(0, 500) ?? null, link: opts.link?.slice(0, 300) ?? null } })
    .catch((e) => console.error('[inbox]', e))
}

/** 批量通知（关注者）：一次 createMany，最多 2000 人，超出的不发（关注者这么多时应改成订阅流，P3 再说） */
export function notifyMany(userIds: number[], kind: InboxKind, title: string, link?: string): void {
  const ids = Array.from(new Set(userIds)).slice(0, 2000)
  if (!ids.length) return
  prisma.notification
    .createMany({ data: ids.map((userId) => ({ userId, kind, title: title.slice(0, 200), link: link?.slice(0, 300) ?? null })) })
    .catch((e) => console.error('[inbox many]', e))
}
