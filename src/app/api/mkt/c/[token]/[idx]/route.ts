export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { siteOrigin } from '@/lib/news/format'
import { peekClickTarget, resolveClick } from '@/lib/marketing/tracking'

/**
 * 营销邮件点击跳转：GET /api/mkt/c/<trackToken>/<idx> → 302 到库里存的那条链接。
 *
 * 【路径里是 trackToken，不是退订 token】（审查 C5）这条链接会被收件人复制、分享；
 * 它若带着退订凭证，拿到链接的人就能替收件人改订阅。目录名还叫 [token]，值是 marketing_messages.track_token。
 *
 * 【没有开放重定向】目标只从 marketing_links(campaignId, idx) 取，请求里任何参数都不参与；
 * token / idx 无效一律回首页。记录（机器判定、事件封顶）在 lib/marketing/tracking.ts。
 *
 * 【显式 HEAD】安全网关常先 HEAD 一下链接：只回跳转头，不记点击。
 */

function redirect(url: string): NextResponse {
  const res = NextResponse.redirect(url, 302)
  res.headers.set('Cache-Control', 'no-store, private, max-age=0')
  res.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return res
}

function parseIdx(raw: string | undefined): number {
  return /^\d{1,4}$/.test(raw || '') ? Number(raw) : -1
}

export async function GET(request: NextRequest, { params }: { params: { token: string; idx: string } }) {
  let target = `${siteOrigin()}/`
  try {
    target = await resolveClick(String(params.token || ''), parseIdx(params.idx), request.headers.get('user-agent'))
  } catch (err) {
    // 查库失败也要把人带到站上：买家点的是邮件里的按钮，最要紧的是别让他看到报错页
    console.error('[mkt/click] 解析失败:', (err as Error)?.message)
  }
  return redirect(target)
}

export async function HEAD(_request: NextRequest, { params }: { params: { token: string; idx: string } }) {
  let target = `${siteOrigin()}/`
  try {
    target = await peekClickTarget(String(params.token || ''), parseIdx(params.idx))
  } catch {
    // 同 GET：失败回首页
  }
  return redirect(target)
}
