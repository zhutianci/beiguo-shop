/**
 * 内容变动后推 IndexNow（内容平台 P1，设计 §11.5）。底层复用 lib/indexnow.ts（新闻流水线也在用）。
 *
 * 什么时候推：过审、精选、改 slug、实质编辑、删除之后——由调用方 fire-and-forget 调 notifyContentChanged。
 * 推什么：只推「现在可收录」的，或者「已删除」的（让必应尽快把它清掉）。待审、驳回这种从没公开过的不推。
 * 总开关 INDEXING_OPEN 关着时什么都不推：不收录的页面没有理由催搜索引擎来抓。
 *
 * 同一个 URL 5 分钟内只推一次（IndexNow 的建议），进程内去重——多副本 / 重启会多推一两次，无害。
 */
import { prisma } from '../db'
import { indexNowConfigured, submitUrls } from '../indexnow'
import { absUrl } from '../news/seo'
import { siteOrigin } from '../news/format'
import { INDEXING_OPEN, contentPath } from './policy'
import { contentIndexable } from './queries'

const recent = new Map<string, number>()
const GAP_MS = 5 * 60 * 1000

export function notifyContentChanged(postId: number): void {
  if (!INDEXING_OPEN || !indexNowConfigured()) return
  void (async () => {
    try {
      const p = await prisma.forumPost.findUnique({
        where: { id: postId },
        include: { prompt: { select: { prompt: true } }, postTags: { select: { tag: { select: { kind: true, status: true } } } } },
      })
      if (!p) return
      if (!p.deletedAt && !contentIndexable(p)) return
      const url = absUrl(contentPath(p.type, p.id, p.slug))
      const now = Date.now()
      if ((recent.get(url) ?? 0) > now - GAP_MS) return
      recent.set(url, now)
      if (recent.size > 2000) recent.clear()
      await submitUrls([url], siteOrigin())
    } catch (e) {
      console.warn('[content indexnow]', e)
    }
  })()
}
