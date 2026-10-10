/**
 * 正文里的站内内容链接（[标题](/guides/123-slug)、/prompts/…、/apps/…）在渲染前过一遍：
 * 目标还没公开（定时放量队列里、待审、已隐藏或已删除）的，只留文字、不出链接；目标公开后自动恢复成链接。
 *
 * 【为什么】种子内容互相引用得很多，而它们是每天分批公开的（定时放量）：先公开的文章会指向还在排队的文章，
 * 匿名访客点过去是 404，搜索引擎也会记下一批站内死链（2026-10-11 上线内容扩容时发现）。
 * 只改渲染、不改库里的正文：放出顺序怎么变都不用回头改文章。
 */
import { prisma } from '../db'
import { PUBLIC_WHERE } from './queries'
import { linkedContentIds, stripLinksExcept } from './link-strip'

export async function dropUnpublishedLinks(content: string): Promise<string> {
  const ids = linkedContentIds(content)
  if (!ids.length) return content
  const rows = await prisma.forumPost.findMany({ where: { ...PUBLIC_WHERE, id: { in: ids } }, select: { id: true } })
  return stripLinksExcept(content, new Set(rows.map((r) => r.id)))
}
