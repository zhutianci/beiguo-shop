export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { rateLimited, clientIp } from '@/lib/news/rate-limit'
import { classifyDevice, classifyReferrer, normalizePath, shouldSkipPath } from '@/lib/analytics/classify'

/**
 * 站级浏览上报。前端停留 3 秒后用 sendBeacon 打过来。
 *
 * 【整体照搬 /api/news/view 的范式】那一套是对的，理由也一样：
 * 爬虫不执行 JS，所以「前端停留 + beacon」天然把它们排除在外。
 * 如果改成在 middleware 里数请求，记下来的一大半会是 Googlebot 和各种扫描器——
 * 数字更好看，但没有任何一个决策能建立在那种数字上。
 *
 * 【三层防刷，和新闻那边同构】
 *   1. 前端 3 秒停留：挡掉预取与秒退
 *   2. 本接口限流：挡掉脚本连打
 *   3. (path, viewerKey, hourBucket) 唯一约束：同一人同一页同一小时只算一次
 * 第三层是唯一一道不依赖客户端诚实的。
 *
 * 【失败一律静默】这是埋点，不是业务。任何异常都不能让前台看到报错，
 * 也不该让 sendBeacon 那一侧重试——丢几条统计数据完全可以接受，
 * 因为这个接口出问题而影响买家是不可接受的。
 */

const TZ_OFFSET_MIN = 8 * 60

function hourBucketKey(d: Date): string {
  return new Date(d.getTime() + TZ_OFFSET_MIN * 60000).toISOString().slice(0, 13)
}
function dayKeyOf(d: Date): string {
  return new Date(d.getTime() + TZ_OFFSET_MIN * 60000).toISOString().slice(0, 10)
}

const bodySchema = z.object({
  p: z.string().min(1).max(300), // 路径
  r: z.string().max(500).optional(), // document.referrer
  k: z.string().min(8).max(64).optional(), // 前端 localStorage 里的匿名 id
})

/** 匿名 id 不原样入库：哈希成定长 64 位十六进制。拿不到匿名 id 时退回 IP 维度 */
function viewerKeyOf(anonId: string | undefined, ip: string): string {
  const seed = anonId ? `a:${anonId}` : `i:${ip}`
  return crypto.createHash('sha256').update(seed).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    // sendBeacon 发的是 Blob，Content-Type 可能是 text/plain，不能依赖 request.json()
    const raw = await request.text()
    let json: unknown
    try {
      json = JSON.parse(raw || '{}')
    } catch {
      return success({ counted: false })
    }
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) return success({ counted: false })

    const path = normalizePath(parsed.data.p)
    if (shouldSkipPath(path)) return success({ counted: false })

    const ip = clientIp(request.headers)
    const viewerKey = viewerKeyOf(parsed.data.k, ip)

    // 双维度限流，口径与 /api/news/view 一致：
    // 单读者 10 分钟 40 条（正常人翻不了这么快），单 IP 300 条
    //（公司/学校出口 NAT 后面可能有几十个真人共用一个 IP，IP 维度必须放宽）
    if (rateLimited(`pv:${viewerKey}`, { windowMs: 10 * 60_000, max: 40 })) {
      return success({ counted: false })
    }
    if (rateLimited(`pv-ip:${ip}`, { windowMs: 10 * 60_000, max: 300 })) {
      return success({ counted: false })
    }

    const now = new Date()
    const { source, engine, refHost } = classifyReferrer(parsed.data.r)
    const device = classifyDevice(request.headers.get('user-agent'))

    try {
      await prisma.pageView.create({
        data: {
          path,
          viewerKey,
          hourBucket: hourBucketKey(now),
          dayKey: dayKeyOf(now),
          source,
          engine,
          refHost,
          device,
        },
      })
    } catch (e) {
      // P2002 = 唯一约束冲突，即「这个人这小时看过这一页了」。不是错误，是去重生效。
      // 这时 visitor 的 lastSeen 也不必更新——他本来就在同一小时内活跃着。
      if ((e as { code?: string })?.code === 'P2002') return success({ counted: false })
      throw e
    }

    /*
     * 访客维度。
     * 【为什么用 upsert 而不是先查后写】并发下「查不到就插入」会撞唯一键；
     * upsert 由数据库保证原子性，而且只打一次库。
     * landing / source 只在 create 时写：它们表达的是「这个人第一次是从哪来的」，
     * 后续访问不能覆盖，否则「入口页」统计会全变成最后一次访问的页面。
     */
    await prisma.visitor.upsert({
      where: { key: viewerKey },
      create: { key: viewerKey, views: 1, landing: path, source },
      update: { views: { increment: 1 } },
    })

    return success({ counted: true })
  } catch (err) {
    // 埋点失败不能影响任何人。记日志，对外仍然返回成功。
    console.error('[track/view]', err)
    return success({ counted: false })
  }
}
