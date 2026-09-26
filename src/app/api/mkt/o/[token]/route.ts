export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { TRANSPARENT_GIF, recordOpen } from '@/lib/marketing/tracking'
import { denyOnChannel } from '@/lib/storefront/resolve'

/**
 * 营销邮件打开像素：GET /api/mkt/o/<trackToken>。永远回 1×1 透明 GIF。
 * 路径里是 trackToken（marketing_messages.track_token），不是退订 token（审查 C5）。
 *
 * 【路径不带 .gif】Cloudflare 默认按扩展名缓存静态资源，带 .gif 会被边缘缓存 ——
 * 之后同一封信的每次打开都打不到源站。再加 Cache-Control: no-store, private 双保险。
 *
 * 【显式 HEAD】Next 对没导出 HEAD 的路由会拿 GET 去应答 HEAD，
 * 邮件安全网关常先发 HEAD 探测，那样会被当成一次「打开」记下来。
 *
 * 打开数本来就不可靠（QQ/Gmail 图片代理、Apple 隐私保护会预取），报表上标注「仅供参考」；
 * 这里的记录失败绝不影响响应。
 */

function gifHeaders(): Record<string, string> {
  return {
    'Content-Type': 'image/gif',
    'Content-Length': String(TRANSPARENT_GIF.byteLength),
    'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
    Pragma: 'no-cache',
    Expires: '0',
    'X-Robots-Tag': 'noindex, nofollow',
    'Referrer-Policy': 'no-referrer',
  }
}

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  try {
    await recordOpen(String(params.token || ''), request.headers.get('user-agent'))
  } catch (err) {
    console.error('[mkt/open] 记录失败:', (err as Error)?.message)
  }
  return new NextResponse(TRANSPARENT_GIF, { status: 200, headers: gifHeaders() })
}

export async function HEAD() {
  // 渠道分站：本模块在渠道站关闭（设计 7.6 / 11.2，实施分包 WP1）。第一行、不包进 try；主站（含休眠期任何 Host）放行
  const channelDenied = await denyOnChannel()
  if (channelDenied) return channelDenied
  return new NextResponse(null, { status: 200, headers: gifHeaders() })
}
