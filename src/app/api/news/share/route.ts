export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { rateLimited, clientIp } from '@/lib/news/rate-limit'
import { SHARE_CHANNEL_CODES } from '@/lib/news/share'

/**
 * 分享计数上报。shareCount 的权重是 1.0（SKILL.md §3.5），是全部信号里
 * 单次贡献最大的一项——1 次分享抵 1 个额外信源——所以这里比浏览上报更需要收紧。
 *
 * 【无法验证真实分享】点了「分享到微博」之后用户有没有真的发出去，网页端不可能知道
 * （微信自 JS-SDK 1.4.0 起取消了 H5 程序化调起分享，也就没有成功回调；
 * QQ/微博 是跳转到第三方页面，同样没有回调）。所以这个数只能是「分享意图数」。
 * 既然无法验证，就必须靠去重把它压成「有多少不同的人想分享过」：
 * 同一读者对同一条事件 24 小时内只计 1 次，换渠道再点也不重复计。
 *
 * 【为什么去重放在内存而不是建表】分享是低频行为，为它再开一张表 + 一条唯一约束，
 * 换来的是每天几十行的写入和一份需要跟着清理的数据。当前单容器部署下，
 * 进程内 24 小时窗口已经能挡住绝大多数重复；真要刷榜的人绕得过这一层，
 * 但也绕不过下面的 IP 限流，收益不足以支撑一张新表。这是刻意的取舍，不是遗漏。
 */

const bodySchema = z.object({
  eventId: z.number().int().positive(),
  // 渠道单字符编码，见 lib/news/share.ts。只用于日志与限流分桶，不入库
  channel: z.string().max(2).optional(),
  k: z.string().min(8).max(64).optional(),
})

function viewerKeyOf(anonId: string | undefined, ip: string): string {
  const seed = anonId ? `a:${anonId}` : `i:${ip}`
  return crypto.createHash('sha256').update(seed).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text()
    let parsedJson: unknown
    try {
      parsedJson = JSON.parse(raw || '{}')
    } catch {
      return error('请求体格式错误')
    }
    const parsed = bodySchema.safeParse(parsedJson)
    if (!parsed.success) return error(parsed.error.errors[0]?.message || '参数无效')

    const { eventId, channel } = parsed.data
    if (channel && SHARE_CHANNEL_CODES.indexOf(channel) < 0) return error('渠道无效')

    const ip = clientIp(request.headers)
    const anonId = parsed.data.k || request.headers.get('x-anon-id') || undefined
    const viewerKey = viewerKeyOf(anonId, ip)

    // 同一读者对同一条事件 24 小时内只计 1 次（换渠道也不重复计）
    if (rateLimited(`ns:${viewerKey}:${eventId}`, { windowMs: 24 * 3600_000, max: 1 })) {
      return success({ counted: false })
    }
    // 单读者 1 小时最多 20 条不同事件；单 IP 1 小时 120 条
    if (rateLimited(`ns-u:${viewerKey}`, { windowMs: 3600_000, max: 20 })) {
      return error('操作过于频繁', 429)
    }
    if (rateLimited(`ns-ip:${ip}`, { windowMs: 3600_000, max: 120 })) {
      return error('操作过于频繁', 429)
    }

    const event = await prisma.newsEvent.findUnique({
      where: { id: eventId },
      select: { id: true, status: true },
    })
    if (!event) return error('内容不存在', 404)
    if (event.status !== 'PUBLISHED') return success({ counted: false })

    await prisma.newsEvent.update({
      where: { id: eventId },
      data: { shareCount: { increment: 1 } },
    })

    return success({ counted: true })
  } catch (err) {
    console.error('News share error:', err)
    return error('上报失败')
  }
}
