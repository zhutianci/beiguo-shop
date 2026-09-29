export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { error } from '@/lib/api'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { rateLimited, clientIp } from '@/lib/news/rate-limit'
import { jiemaViewer, closedMessage } from '@/lib/jiema/access'
import { catalogCountries, refreshOffers, refreshTriggerAllowed } from '@/lib/jiema/catalog'

/**
 * 一个服务的国家/地区列表（§1.6、§6.3、§6.4）：价格、库存三档（只用第 ② 层 offers）、推荐排序、「暂停销售」原因。
 * 第 ② 层过期或还没有时先返回旧数据 / 第 ① 层数据；**只有登录用户**才触发后台刷新（不等上游，refreshingAt 单飞），
 * 匿名访问不触发上游（防爬虫占满目录车道，D22）。service 必须是 ^[a-z0-9]{2,4}$ 且可售（手动下架的 404）。
 */
const SERVICE_RE = /^[a-z0-9]{2,4}$/

export async function GET(request: NextRequest, { params }: { params: { service: string } }) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    if (rateLimited(`jm-cat:${clientIp(request.headers)}`, { windowMs: 60_000, max: 60 })) return error('请求太频繁，请稍后再试', 429)
    const service = String(params?.service ?? '')
    if (!SERVICE_RE.test(service)) return error('没有这个服务', 404)
    const v = await jiemaViewer()
    if ((v.access !== 'OPEN' && v.access !== 'ADMIN_PREVIEW') || !v.cfg) {
      const res = NextResponse.json({ success: false, error: closedMessage(v.access), code: 'MAINTENANCE', soon: v.access === 'SOON' }, { status: 503 })
      res.headers.set('Cache-Control', 'no-store')
      return res
    }
    const r = await catalogCountries(service, v.cfg)
    if (!r) return error('没有这个服务', 404)
    if (refreshTriggerAllowed(r.needsRefresh, v.userId)) {
      // 不 await：用户拿到的是现有数据，刷新在后台跑（失败只记日志，下次再来）
      void refreshOffers(service).catch((e) => console.error('[jiema] 后台刷新 offers 失败', service, (e as Error)?.message))
    }
    const res = NextResponse.json({
      success: true,
      data: {
        service: r.service,
        durationMin: r.durationMin,
        countries: r.countries,
        sort: r.sort,
        /** 有第 ② 层数据（库存等级、「库存多」排序可用） */
        stockKnown: r.source === 'OFFERS',
        maintenance: r.maintenance,
        preview: v.access === 'ADMIN_PREVIEW',
      },
    })
    res.headers.set('Cache-Control', v.access === 'OPEN' ? 'public, max-age=30' : 'private, no-store')
    return res
  } catch (e) {
    console.error('[jiema] GET catalog/[service] 失败', e)
    return error('国家/地区列表加载失败', 500)
  }
}
