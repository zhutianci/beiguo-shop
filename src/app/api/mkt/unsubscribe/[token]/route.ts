export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { siteOrigin } from '@/lib/news/format'
import { clientIp, rateLimited } from '@/lib/news/rate-limit'
import { oneClickUnsubscribe, TEST_TOKEN } from '@/lib/marketing/prefs'

/**
 * 邮件头 List-Unsubscribe 指向的地址。
 *
 *   GET  → 302 到退订页 /unsubscribe/<token>（不支持 RFC 8058 的客户端会直接打开头里的地址）。
 *          GET 绝不改状态：邮件安全网关会预取邮件里的每一个链接。
 *   POST → RFC 8058 一键退订（Gmail / Yahoo / Apple Mail 的「退订」按钮由它们的服务器发起）。
 *
 * POST 的几条规矩（设计 10.1 / 第 12 节第 4 条，改之前先读）：
 *  - **不看 Content-Type**：RFC 规定是 application/x-www-form-urlencoded 或 multipart/form-data，
 *    实际各家实现五花八门；只要 token 有效就退订，body 内容一律不解析
 *  - body 最多读 1KB 就丢（防止被人拿大包体占内存），读失败也照常退订
 *  - **有效 token 永不限流**：Gmail 的退订请求都从同一批出口 IP 发出，按 IP 限流会把真人的退订吞掉
 *  - 无效 token 也回 200「ok」（不给枚举者任何信号），按 IP 计数只用来在日志里发现扫描行为
 *  - 不重定向、不设 cookie、不需要登录
 *  - token = test（测试邮件）空操作
 */

const MAX_BODY_BYTES = 1024
/** 无效 token 计数的桶数：IP 是请求头里来的、可以随便伪造，直接当 Map 的键会被撑爆 */
const IP_BUCKETS = 4096

function okText(status = 200, body = 'ok'): NextResponse {
  return new NextResponse(body, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}

/** 读走至多 1KB 的请求体后取消流：不解析、不在乎内容，只是不让连接挂着 */
async function drainBody(request: NextRequest): Promise<void> {
  const body = request.body
  if (!body) return
  const reader = body.getReader()
  let total = 0
  try {
    while (total < MAX_BODY_BYTES) {
      const { done, value } = await reader.read()
      if (done) return
      total += value?.byteLength || 0
    }
  } finally {
    reader.cancel().catch(() => {})
  }
}

/** FNV-1a → 固定数量的桶。碰撞只是让两个 IP 共用一个计数，无所谓 */
function ipBucket(ip: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < ip.length && i < 128; i++) {
    h ^= ip.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h % IP_BUCKETS
}

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  const token = String(params.token || '').slice(0, 64)
  const res = NextResponse.redirect(`${siteOrigin()}/unsubscribe/${encodeURIComponent(token)}`, 302)
  res.headers.set('Cache-Control', 'no-store')
  res.headers.set('Referrer-Policy', 'no-referrer')
  return res
}

export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  const token = String(params.token || '')
  try {
    await drainBody(request)
  } catch {
    // 读体失败不影响退订
  }
  if (token === TEST_TOKEN) return okText()

  let valid = false
  try {
    valid = await oneClickUnsubscribe(token, {
      ip: clientIp(request.headers),
      ua: request.headers.get('user-agent'),
    })
  } catch (err) {
    // 真出错（库挂了）时不能谎称「ok」：退订是法定义务，让对方知道这次没成功
    console.error('[mkt/unsubscribe] 一键退订失败:', (err as Error)?.message)
    return okText(503, 'temporarily unavailable')
  }

  if (!valid) {
    const bucket = ipBucket(clientIp(request.headers))
    // 返回 true = 这个桶 10 分钟内的无效 token 已超 30 次：像在扫，打一条日志（不含 IP 与 token）。
    // 日志本身也限流（每桶每 10 分钟一条），否则被扫的时候日志会先被刷爆
    if (
      rateLimited(`mku:${bucket}`, { windowMs: 10 * 60_000, max: 30 }) &&
      !rateLimited(`mku-log:${bucket}`, { windowMs: 10 * 60_000, max: 1 })
    ) {
      console.warn('[mkt/unsubscribe] 无效 token 请求过多，bucket=%d', bucket)
    }
  }
  return okText()
}
