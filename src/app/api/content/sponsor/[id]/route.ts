export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { denyUnlessModule } from '@/lib/storefront/resolve'
import { ipKey } from '@/lib/auth-throttle'
import { clientIp, rateLimited } from '@/lib/news/rate-limit'

// 赞助位点击：计数后 302 到后台登记的地址。只认在投期内的；过期或下架的回到学习平台首页
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  // 内容平台只在主站开放
  const channelDenied = await denyUnlessModule('learn')
  if (channelDenied) return channelDenied
  const id = parseInt(params.id)
  const now = new Date()
  const row = Number.isInteger(id) && id > 0 ? await prisma.sponsorSlot.findFirst({ where: { id, active: true, startAt: { lte: now }, endAt: { gt: now } }, select: { id: true, url: true } }) : null
  if (!row) return NextResponse.redirect(new URL('/learn', request.url), 302)
  // 同一 IP 对同一赞助位每天只计一次（2026-10-07：以前每个 GET 都 +1，curl 循环或链接预取就能刷高给赞助方看的点击数）。
  // 跳转本身不受影响
  const ip = clientIp(request.headers)
  if (ip !== 'unknown' && !rateLimited(`sp-click:${row.id}|${ipKey(ip)}`, { windowMs: 86_400_000, max: 1 })) {
    prisma.sponsorSlot.update({ where: { id: row.id }, data: { clicks: { increment: 1 } } }).catch(() => {})
  }
  const res = NextResponse.redirect(row.url, 302)
  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return res
}
