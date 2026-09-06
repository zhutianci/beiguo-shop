/**
 * 【AI圈大事记】境外信源中继 —— Cloudflare Worker
 *
 * 为什么需要它：阿里云北京 ECS 实测无法直连 Reddit、HuggingFace（含 hf-mirror）、
 * DeepMind、Meta AI、Mistral、Google News、RSSHub 公共实例。这些源的内容本身是公开的，
 * 缺的只是一条境外出口。Worker 免费档 10 万请求/天，纯转发是 I/O 等待、不吃 CPU 配额。
 *
 * ⚠️ 安全：必须保留 ALLOW 白名单。不做白名单 = 在自己域名下开了一个公开 SSRF 代理，
 * 任何人都能拿它扫你的内网和云元数据接口（169.254.169.254）。
 *
 * 部署：
 *   1. Cloudflare 控制台 → Workers & Pages → Create Worker，粘贴本文件
 *   2. Settings → Variables → 添加 Secret：RELAY_TOKEN（随机 32 位以上字符串）
 *   3. 部署后拿到 https://<name>.<account>.workers.dev
 *   4. 服务器 .env.production 加：
 *        NEWS_RELAY_URL=https://<name>.<account>.workers.dev
 *        NEWS_RELAY_TOKEN=<与 RELAY_TOKEN 相同>
 *   5. 后台「AI大事记 → 信源管理」把 viaRelay 的源启用
 *
 * 用法：GET /fetch?url=<encodeURIComponent(原始URL)>，请求头 X-Relay-Token: <token>
 */

const ALLOW = [
  // 一手官方
  'deepmind.google',
  'ai.meta.com',
  'mistral.ai',
  'openai.com',
  'www.anthropic.com',
  'blog.google',
  // 论文与模型社区
  'huggingface.co',
  'export.arxiv.org',
  'paperswithcode.com',
  // 社区讨论（热度信号）
  'www.reddit.com',
  'oauth.reddit.com',
  'hnrss.org',
  'hacker-news.firebaseio.com',
  'lobste.rs',
  // X / Twitter：仅当你自建了 RSSHub 或使用官方 API 时才用得上，
  // 直接抓 x.com 会被反爬拦截（见 docs/新闻中继与X信源.md）
  'api.twitter.com',
  'api.x.com',
]

const MAX_BYTES = 2 * 1024 * 1024
const TIMEOUT_MS = 12000

function deny(msg, status = 403) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true, allow: ALLOW.length }), {
        headers: { 'content-type': 'application/json; charset=utf-8' },
      })
    }

    if (url.pathname !== '/fetch') return deny('not found', 404)

    // 鉴权：没有它，白名单内的源也会被别人白嫖你的配额
    const token = request.headers.get('x-relay-token') || url.searchParams.get('token') || ''
    if (!env.RELAY_TOKEN || token !== env.RELAY_TOKEN) return deny('bad token', 401)

    const target = url.searchParams.get('url')
    if (!target) return deny('missing url', 400)

    let parsed
    try {
      parsed = new URL(target)
    } catch {
      return deny('bad url', 400)
    }

    // 只允许 https/http，且必须是白名单内的域名（含子域）
    if (!/^https?:$/.test(parsed.protocol)) return deny('protocol not allowed')
    const host = parsed.hostname.toLowerCase()
    const allowed = ALLOW.some((d) => host === d || host.endsWith('.' + d))
    if (!allowed) return deny(`host not in allowlist: ${host}`)

    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS)
    try {
      const upstream = await fetch(parsed.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BigoLabBot/1.0; +https://bigolab.com)',
          Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, application/json;q=0.9, */*;q=0.8',
        },
        signal: ac.signal,
        redirect: 'follow',
        cf: { cacheTtl: 300, cacheEverything: true },
      })

      const body = await upstream.text()
      const clipped = body.length > MAX_BYTES ? body.slice(0, MAX_BYTES) : body

      return new Response(clipped, {
        status: upstream.status,
        headers: {
          'content-type': upstream.headers.get('content-type') || 'text/plain; charset=utf-8',
          'x-relay-origin-status': String(upstream.status),
          'cache-control': 'public, max-age=300',
        },
      })
    } catch (e) {
      return deny(`upstream error: ${e && e.message ? e.message : 'unknown'}`, 502)
    } finally {
      clearTimeout(timer)
    }
  },
}
