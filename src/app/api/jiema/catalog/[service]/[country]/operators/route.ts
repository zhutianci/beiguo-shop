export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { error } from '@/lib/api'
import { denyOnChannel } from '@/lib/storefront/resolve'
import { rateLimited, clientIp } from '@/lib/news/rate-limit'
import { jiemaViewer, closedMessage } from '@/lib/jiema/access'
import { catalogOperators } from '@/lib/jiema/catalog'

/**
 * 一个国家/地区的运营商（§1.7）：来自每天同步一次的 getOperators 全量缓存，**不触发上游**。
 * 不显示运营商库存（公开 API 没有，调研 U12）；这个国家没有运营商数据时返回空数组，页面就不出现「运营商」。
 * 显示名：后台映射 > 出厂映射 > 代码首字母大写。
 */
const SERVICE_RE = /^[a-z0-9]{2,4}$/

export async function GET(request: NextRequest, { params }: { params: { service: string; country: string } }) {
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    if (rateLimited(`jm-cat:${clientIp(request.headers)}`, { windowMs: 60_000, max: 60 })) return error('请求太频繁，请稍后再试', 429)
    const service = String(params?.service ?? '')
    const countryRaw = String(params?.country ?? '')
    if (!SERVICE_RE.test(service) || !/^\d{1,3}$/.test(countryRaw)) return error('没有这个国家/地区', 404)
    const country = Number(countryRaw)
    if (country < 1 || country > 999) return error('没有这个国家/地区', 404)
    const v = await jiemaViewer()
    if ((v.access !== 'OPEN' && v.access !== 'ADMIN_PREVIEW') || !v.cfg) {
      const res = NextResponse.json({ success: false, error: closedMessage(v.access), code: 'MAINTENANCE', soon: v.access === 'SOON' }, { status: 503 })
      res.headers.set('Cache-Control', 'no-store')
      return res
    }
    const ops = await catalogOperators(service, country)
    if (!ops) return error('没有这个国家/地区', 404)
    const res = NextResponse.json({ success: true, data: { operators: ops } })
    res.headers.set('Cache-Control', v.access === 'OPEN' ? 'public, max-age=300' : 'private, no-store')
    return res
  } catch (e) {
    console.error('[jiema] GET operators 失败', e)
    return error('运营商列表加载失败', 500)
  }
}
