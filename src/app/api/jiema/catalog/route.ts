export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { error } from '@/lib/api'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { rateLimited, clientIp } from '@/lib/news/rate-limit'
import { jiemaViewer, closedMessage } from '@/lib/jiema/access'
import { catalogSnapshot } from '@/lib/jiema/catalog'

/**
 * 服务目录（docs/短信接码-设计.md §1.5、§6.3、§6.4）。公开、只读缓存，**匿名访问绝不触发上游**（D22）。
 * 只在主站：第一行 denyOnChannel（不包进 try，D11、附录 B 第 11 条）。
 * 对全部用户开放前：普通用户 503（「即将开放」/「维护中」）；管理员照常拿到（预览），响应 private、no-store。
 * 响应只有白名单字段（lib/jiema/dto.ts）：没有成本、cap、两个系数、覆盖规则（§6.4 末尾清单）。上游服务全部可售（D25），
 * 没有 blocked 词表；只有后台手动下架（status=OFF，出厂为空）的不下发。
 */
export async function GET(request: NextRequest) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    // 三个目录接口各自一个限流桶（§6.4 逐个列的「同一 IP 每分钟 60 次」；共用一个桶时浏览国家列表会把服务目录也限住，S1 评审修复）
    if (rateLimited(`jm-cat:${clientIp(request.headers)}`, { windowMs: 60_000, max: 60 })) return error('请求太频繁，请稍后再试', 429)
    const v = await jiemaViewer()
    if ((v.access !== 'OPEN' && v.access !== 'ADMIN_PREVIEW') || !v.cfg) {
      const res = NextResponse.json({ success: false, error: closedMessage(v.access), code: 'MAINTENANCE', soon: v.access === 'SOON' }, { status: 503 })
      res.headers.set('Cache-Control', 'no-store')
      return res
    }
    const snap = await catalogSnapshot(v.cfg)
    const res = NextResponse.json({
      success: true,
      data: {
        services: snap.services,
        anyOther: snap.anyOther,
        updatedAt: snap.updatedAt,
        stale: snap.stale,
        degraded: snap.degraded,
        maintenance: snap.maintenance,
        preview: v.access === 'ADMIN_PREVIEW',
      },
    })
    res.headers.set('Cache-Control', v.access === 'OPEN' ? 'public, max-age=60' : 'private, no-store')
    return res
  } catch (e) {
    console.error('[jiema] GET catalog 失败', e)
    return error('服务列表加载失败', 500)
  }
}
