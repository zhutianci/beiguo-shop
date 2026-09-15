export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { clientIp, rateLimited } from '@/lib/news/rate-limit'

/**
 * 点击打点。前台卡片点击时以 keepalive 的方式打一枪，不等返回。
 *
 * 【为什么不做成 /go/[id] 的 302 中转】友链的意义就是把真实的出站链接挂出去：
 * 换成站内跳转地址，对方拿不到我们给的权重，搜索引擎看到的也只是一堆指向自己的内链，
 * 互挂就失去了意义。所以 href 必须是对方的真实地址，统计只能另走一条旁路。
 *
 * 【计数不准是可以接受的】拦截插件、预渲染、离开页面太快都会丢点击。
 * 这个数只用来回答「哪家在真的给我们带流量」，不是计费依据。
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id)
    if (!id) return error('ID 无效')

    // 同一 IP 一分钟内对同一条最多计 3 次，挡住按住回车刷计数的玩法
    const ip = clientIp(request.headers)
    if (rateLimited(`link-click:${ip}:${id}`, { windowMs: 60 * 1000, max: 3 })) {
      return success({ counted: false })
    }

    // updateMany 而不是 update：id 不存在时 update 会抛 P2025，
    // 而这条路由本来就允许「打到一条已删除的记录上」，不该往日志里刷错误
    await prisma.friendLink.updateMany({
      where: { id, status: 'APPROVED' },
      data: { clicks: { increment: 1 } },
    })
    return success({ counted: true })
  } catch (err) {
    console.error('Friend link click error:', err)
    return error('打点失败')
  }
}
