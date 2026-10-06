/**
 * 内容带单归因（内容平台 P3，设计 §13.2）：读者从内容页 CTA（?from=c{id}）进落地页、7 天内在主站下单 → 记一行。
 *
 * 只是统计口径，**不影响价格、券和返现**（返现只看内推码，lib/referral.ts）。
 * 建单接口在订单建好之后 fire-and-forget 调这里，自己吞异常：归因写失败绝不能让下单失败。
 * 内容必须是公开的；同一张订单只记一次（order_id 主键）。
 */
import { prisma } from '../db'
import { PUBLIC_WHERE } from './queries'

export async function recordContentAttribution(orderId: number, postId: number, userId: number): Promise<void> {
  try {
    const post = await prisma.forumPost.findFirst({ where: { id: postId, ...PUBLIC_WHERE }, select: { id: true } })
    if (!post) return
    await prisma.contentOrderAttribution.create({ data: { orderId, postId, userId } })
  } catch (e) {
    if ((e as { code?: string })?.code !== 'P2002') console.error('[content attribution]', e)
  }
}

/** 每条内容带来的**已付款**订单数（未付款、已取消的不算） */
export async function paidOrdersByPost(postIds: number[]): Promise<Map<number, number>> {
  const m = new Map<number, number>()
  if (!postIds.length) return m
  const rows = await prisma.contentOrderAttribution.findMany({ where: { postId: { in: postIds } }, select: { postId: true, orderId: true } })
  if (!rows.length) return m
  const paid = await prisma.order.findMany({ where: { id: { in: rows.map((r) => r.orderId) }, payStatus: 'PAID' }, select: { id: true } })
  const ok = new Set(paid.map((o) => o.id))
  for (const r of rows) if (ok.has(r.orderId)) m.set(r.postId, (m.get(r.postId) ?? 0) + 1)
  return m
}

/** 后台：近 N 天带单最多的内容（访问 = content_events 的 CTA，订单 = 已付款的归因订单） */
export async function topConverting(days = 30, limit = 20) {
  const since = new Date(Date.now() - days * 86_400_000)
  const attrs = await prisma.contentOrderAttribution.findMany({ where: { createdAt: { gte: since } }, select: { postId: true, orderId: true } })
  const paid = attrs.length
    ? await prisma.order.findMany({ where: { id: { in: attrs.map((a) => a.orderId) }, payStatus: 'PAID' }, select: { id: true, amount: true } })
    : []
  const paidMap = new Map(paid.map((o) => [o.id, Number(o.amount)]))
  const agg = new Map<number, { orders: number; amount: number }>()
  for (const a of attrs) {
    const amt = paidMap.get(a.orderId)
    if (amt === undefined) continue
    const g = agg.get(a.postId) ?? { orders: 0, amount: 0 }
    g.orders++
    g.amount += amt
    agg.set(a.postId, g)
  }
  const day = Number(new Date(since.getTime() + 8 * 3600_000).toISOString().slice(0, 10).replace(/-/g, ''))
  const visits = await prisma.contentEvent.groupBy({ by: ['postId'], where: { kind: 'CTA', day: { gte: day } }, _count: { _all: true } })
  const visitMap = new Map(visits.map((v) => [v.postId, v._count._all]))
  const ids = Array.from(new Set([...Array.from(agg.keys()), ...Array.from(visitMap.keys())]))
  const posts = ids.length ? await prisma.forumPost.findMany({ where: { id: { in: ids } }, select: { id: true, type: true, slug: true, title: true, authorName: true } }) : []
  return posts
    .map((p) => ({ ...p, visits: visitMap.get(p.id) ?? 0, orders: agg.get(p.id)?.orders ?? 0, amount: Math.round((agg.get(p.id)?.amount ?? 0) * 100) / 100 }))
    .sort((a, b) => b.orders - a.orders || b.amount - a.amount || b.visits - a.visits)
    .slice(0, limit)
}
