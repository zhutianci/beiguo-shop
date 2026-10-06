/**
 * 内容事件（内容平台 P2）：一条内容「公开了 / 被精选了 / 被驳回了 / 有人评论了」之后的连带动作——
 * 积分、站内通知、二创计数。所有调用方 fire-and-forget（不 await 也行），这里自己吞异常。
 *
 * 为什么集中在这里：触发点很多（作者直接发布、管理员审核通过、批量导入……），
 * 分散写迟早漏一处，漏了的表现是「有的作者被精选了却没收到通知」这种没人会报的 bug。
 */
import { prisma } from '../db'
import { award } from './points'
import { notifyMany, notifyUser } from './inbox'
import { contentPath } from './policy'
import { NEAR_DUP_DISTANCE, hamming, simhash } from './simhash'

async function head(postId: number) {
  return prisma.forumPost.findUnique({
    where: { id: postId },
    select: { id: true, type: true, slug: true, title: true, userId: true, remixOfId: true },
  })
}

/**
 * 内容第一次公开（作者直接发布，或审核通过）。
 * reviewed=true 表示走过审核（给作者发「审核通过」通知）；直接发布的不发。
 */
export async function onPublished(postId: number, opts: { reviewed: boolean }): Promise<void> {
  try {
    const p = await head(postId)
    if (!p) return
    const link = contentPath(p.type, p.id, p.slug)
    await award(p.userId, 'APPROVED', p.id)
    if (opts.reviewed) notifyUser(p.userId, 'REVIEW_OK', `「${p.title}」已通过审核，现在所有人都能看到了`, { link })
    // 关注者：只通知提示词 / 教程 / 应用（讨论帖太碎，打扰）
    if (p.userId && p.type !== 'DISCUSSION') {
      const fans = await prisma.follow.findMany({ where: { followeeId: p.userId }, select: { followerId: true }, take: 2000 })
      notifyMany(fans.map((f) => f.followerId), 'NEW_FROM_FOLLOWEE', `你关注的作者发布了「${p.title}」`, link)
    }
    // 二创链：原作的同款数 +1、原作者 +10 积分并收到通知
    if (p.remixOfId) {
      const origin = await head(p.remixOfId)
      if (origin) {
        const n = await prisma.forumPost.count({ where: { remixOfId: origin.id, status: 1, reviewStatus: 'APPROVED', deletedAt: null } })
        await prisma.forumPost.update({ where: { id: origin.id }, data: { remixCount: n } })
        await award(origin.userId, 'REMIXED', p.id, p.userId ?? 0)
        notifyUser(origin.userId, 'REMIXED', `有人做了你的「${origin.title}」的同款`, { link, actorId: p.userId })
      }
    }
  } catch (e) {
    console.error('[content onPublished]', e)
  }
}

export async function onFeatured(postId: number): Promise<void> {
  try {
    const p = await head(postId)
    if (!p) return
    await award(p.userId, 'FEATURED', p.id)
    notifyUser(p.userId, 'FEATURED', `恭喜！「${p.title}」被选为精选`, { link: contentPath(p.type, p.id, p.slug) })
  } catch (e) {
    console.error('[content onFeatured]', e)
  }
}

export async function onRejected(postId: number, note: string | null): Promise<void> {
  try {
    const p = await head(postId)
    if (!p) return
    notifyUser(p.userId, 'REVIEW_REJECT', `「${p.title}」未通过审核`, { link: contentPath(p.type, p.id, p.slug), body: note ?? undefined })
  } catch (e) {
    console.error('[content onRejected]', e)
  }
}

/** 一条评论公开了：通知帖子作者；如果是回复某条评论，再通知那条评论的作者 */
export async function onCommentPublished(commentId: number): Promise<void> {
  try {
    const c = await prisma.forumComment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true, authorName: true, content: true, parentId: true, post: { select: { id: true, type: true, slug: true, title: true, userId: true } } },
    })
    if (!c) return
    const link = `${contentPath(c.post.type, c.post.id, c.post.slug)}#comments`
    const body = c.content.slice(0, 120)
    notifyUser(c.post.userId, 'REPLY', `${c.authorName} 评论了「${c.post.title}」`, { link, body, actorId: c.userId })
    if (c.parentId) {
      const parent = await prisma.forumComment.findUnique({ where: { id: c.parentId }, select: { userId: true } })
      if (parent?.userId && parent.userId !== c.post.userId) {
        notifyUser(parent.userId, 'REPLY', `${c.authorName} 回复了你的评论`, { link, body, actorId: c.userId })
      }
    }
  } catch (e) {
    console.error('[content onCommentPublished]', e)
  }
}

/**
 * 查重：同类型、未删除的内容里找海明距离最近的一条（≤ NEAR_DUP_DISTANCE 才返回）。
 * 量级：几千条以内逐条比较足够快（每条只是一次 64 位异或）；过万再改成分段索引（设计 §6.2）。
 */
export async function findNearDuplicate(type: string, text: string, excludeId?: number): Promise<{ id: number; title: string; distance: number } | null> {
  const h = simhash(text)
  if (!h) return null
  const rows = await prisma.forumPost.findMany({
    where: { type, deletedAt: null, simhash: { not: null }, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true, title: true, simhash: true },
    take: 20000,
  })
  let best: { id: number; title: string; distance: number } | null = null
  for (const r of rows) {
    const d = hamming(h, r.simhash!)
    if (d <= NEAR_DUP_DISTANCE && (!best || d < best.distance)) best = { id: r.id, title: r.title, distance: d }
  }
  return best
}

/** 查重用的文本：提示词以提示词本体为准（标题、心得改写不影响「是不是同一条提示词」），其他类型用正文 */
export function dedupText(p: { prompt?: string | null; content: string }): string {
  return p.prompt && p.prompt.trim() ? p.prompt : p.content
}

/**
 * 合集新增了一条内容（P3，设计 §7.5「关注合集的用户在更新时收到站内通知」）。
 * 每个合集每 20 小时最多通知一次：作者一口气往合集里加十几条时，关注者只收到一条。
 * 用 notifiedAt 做 CAS（updateMany 带条件），并发加条目也只有一个请求发得出通知。
 */
export async function onCollectionUpdated(collectionId: number): Promise<void> {
  try {
    const c = await prisma.collection.findUnique({ where: { id: collectionId }, select: { id: true, userId: true, title: true, isPublic: true } })
    if (!c?.isPublic) return
    const since = new Date(Date.now() - 20 * 3600_000)
    const flip = await prisma.collection.updateMany({
      where: { id: c.id, OR: [{ notifiedAt: null }, { notifiedAt: { lt: since } }] },
      data: { notifiedAt: new Date() },
    })
    if (flip.count !== 1) return
    const fans = await prisma.collectionFollow.findMany({ where: { collectionId: c.id }, select: { userId: true }, take: 2000 })
    notifyMany(fans.map((f) => f.userId).filter((id) => id !== c.userId), 'COLLECTION_UPDATED', `你关注的合集「${c.title}」更新了`, `/collections/${c.id}`)
  } catch (e) {
    console.error('[content onCollectionUpdated]', e)
  }
}

/**
 * 图片查重（设计 §6.2「上传时存 sha256，同一张图被不同账号重复发布时提示」）：
 * 帖子里的图，只要有一张与别的账号上传过的图字节完全相同（sha256 一致），或者直接引用了别人上传的地址，就返回那张图。
 * 调用方据此转人工、在审核备注里写明。只比字节完全相同；改过尺寸、重新压缩的图要靠感知哈希（pHash），留到以后。
 */
export async function findImageReuse(images: string[], userId: number | null): Promise<{ url: string; ownerId: number | null } | null> {
  if (!images.length || !userId) return null
  try {
    const mine = await prisma.mediaAsset.findMany({ where: { url: { in: images.slice(0, 9) } }, select: { url: true, sha256: true, userId: true } })
    const foreign = mine.find((m) => m.userId !== null && m.userId !== userId)
    if (foreign) return { url: foreign.url, ownerId: foreign.userId }
    if (!mine.length) return null
    const other = await prisma.mediaAsset.findFirst({
      where: { sha256: { in: mine.map((m) => m.sha256) }, AND: [{ userId: { not: null } }, { userId: { not: userId } }] },
      orderBy: { id: 'asc' },
      select: { url: true, userId: true },
    })
    return other ? { url: other.url, ownerId: other.userId } : null
  } catch (e) {
    console.error('[content findImageReuse]', e)
    return null
  }
}

export const IMAGE_REUSE_NOTE = '图片与其他账号上传过的图完全相同，请确认是否为本人出图'
