export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { rateLimited, clientIp } from '@/lib/news/rate-limit'

/**
 * 站内浏览上报。前端停留 3 秒后用 sendBeacon 打过来。
 *
 * 【为什么不能像论坛那样 GET 详情页就 +1】
 * 论坛现有的 `views: { increment: 1 }` 是裸自增：无去重、无限流，
 * 爬虫扫一遍就能把任意帖子刷到榜首。新闻的浏览数会进热度分（SKILL.md §3.5），
 * 直接决定首页排序，所以改成「前端停留 3 秒 + sendBeacon 上报」——
 * 爬虫不执行 JS，天然被排除在外，这是这个接口存在的全部理由。
 *
 * 【三层防刷，缺一层就漏】
 *   1. 前端 3 秒停留：挡掉预取与秒退
 *   2. 本接口限流：挡掉脚本连打
 *   3. (eventId, viewerKey, hourBucket) 唯一约束：同一人同一小时只算一次
 * 唯一约束是最后一道，也是唯一一道不依赖客户端诚实的。
 */

// 业务时区固定东八区，用固定偏移的 UTC 算术，不依赖进程 TZ
// （范式见 api/admin/analytics/cardkeys/route.ts 的 dayStartUtc / dayKey）
const TZ_OFFSET_MIN = 8 * 60

/** 把绝对时刻归到东八区的哪个小时桶，格式 YYYY-MM-DDTHH（13 字符，正好是列宽） */
function hourBucketKey(d: Date): string {
  return new Date(d.getTime() + TZ_OFFSET_MIN * 60000).toISOString().slice(0, 13)
}

const bodySchema = z.object({
  eventId: z.number().int().positive(),
  // 前端 localStorage 里的匿名 id（复用 forum_anon_id 范式）。允许缺省，缺省时退回 IP 维度
  k: z.string().min(8).max(64).optional(),
})

/** 匿名 id 不原样入库：哈希成定长 64 位十六进制，正好填满 viewer_key 列，也省得校验内容 */
function viewerKeyOf(anonId: string | undefined, ip: string): string {
  const seed = anonId ? `a:${anonId}` : `i:${ip}`
  return crypto.createHash('sha256').update(seed).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    // sendBeacon 发的是 Blob，Content-Type 可能是 text/plain，不能依赖 request.json() 的解析口径
    const raw = await request.text()
    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(raw || '{}')
    } catch {
      return error('请求体格式错误')
    }
    const parsed = bodySchema.safeParse(parsedJson)
    if (!parsed.success) return error(parsed.error.errors[0]?.message || '参数无效')

    const { eventId, k } = parsed.data
    const ip = clientIp(request.headers)
    const anonId = k || request.headers.get('x-anon-id') || undefined
    const viewerKey = viewerKeyOf(anonId, ip)

    // 双维度限流：单读者 10 分钟最多 40 条（正常人翻不了这么快），单 IP 10 分钟 300 条
    // （公司/学校出口 NAT 后面可能有几十个真人共用一个 IP，IP 维度必须放宽）
    if (rateLimited(`nv:${viewerKey}`, { windowMs: 10 * 60_000, max: 40 })) {
      return error('操作过于频繁', 429)
    }
    if (rateLimited(`nv-ip:${ip}`, { windowMs: 10 * 60_000, max: 300 })) {
      return error('操作过于频繁', 429)
    }

    // 只给已发布的事件计数：草稿与已下线（UNLISTED）的浏览不该影响热度
    const event = await prisma.newsEvent.findUnique({
      where: { id: eventId },
      select: { id: true, status: true },
    })
    if (!event) return error('内容不存在', 404)
    if (event.status !== 'PUBLISHED') return success({ counted: false })

    const hourBucket = hourBucketKey(new Date())

    try {
      await prisma.newsView.create({ data: { eventId, viewerKey, hourBucket } })
    } catch (e) {
      // P2002 = 唯一约束冲突，即「这个人这小时已经看过了」。不是错误，是去重生效
      if ((e as { code?: string })?.code === 'P2002') return success({ counted: false })
      throw e
    }

    await prisma.newsEvent.update({
      where: { id: eventId },
      data: { viewCount: { increment: 1 } },
    })

    return success({ counted: true })
  } catch (err) {
    console.error('News view error:', err)
    return error('上报失败')
  }
}
