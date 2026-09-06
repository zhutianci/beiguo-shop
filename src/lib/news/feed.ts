/**
 * 零依赖 RSS / Atom 解析 + 带超时与体积上限的抓取。
 *
 * 刻意不引 npm 解析库：项目有手搓阿里云签名的先例，且 1.8G 内存的机器上
 * 每一个运行时依赖都要算账。解析只需要覆盖 RSS 2.0 与 Atom 两种主流格式。
 */
import crypto from 'crypto'

export interface FeedEntry {
  guid: string
  url: string
  title: string
  summary: string
  author: string | null
  publishedAt: Date
}

const MAX_BYTES = 2 * 1024 * 1024 // 2MB：更大的 XML 同步解析会阻塞事件循环几百毫秒
const UA = 'Mozilla/5.0 (compatible; BigoLabBot/1.0; +https://bigolab.com)'

export class FetchFeedError extends Error {
  status: number
  constructor(message: string, status = 0) {
    super(message)
    this.name = 'FetchFeedError'
    this.status = status
  }
}

/** 抓取文本，带超时、体积上限与 UA。境外源应传入中继后的 URL。 */
export async function fetchText(url: string, timeoutMs = 8000): Promise<string> {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, application/json;q=0.9, */*;q=0.8' },
      signal: ac.signal,
      redirect: 'follow',
    })
    if (!res.ok) throw new FetchFeedError(`HTTP ${res.status}`, res.status)

    const len = Number(res.headers.get('content-length') || 0)
    if (len && len > MAX_BYTES) throw new FetchFeedError(`响应过大 ${len} 字节`, res.status)

    const text = await res.text()
    if (text.length > MAX_BYTES) return text.slice(0, MAX_BYTES)
    return text
  } catch (e) {
    if (e instanceof FetchFeedError) throw e
    const msg = e instanceof Error ? e.message : String(e)
    throw new FetchFeedError(msg.includes('abort') ? `超时 ${timeoutMs}ms` : msg)
  } finally {
    clearTimeout(timer)
  }
}

// ---- XML 小工具 ----

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, '&') // 必须最后，避免把 &amp;lt; 解成 <
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
}

/** 取第一个 <tag>...</tag> 的内容（不含属性匹配） */
function pick(block: string, ...tags: string[]): string {
  for (const tag of tags) {
    const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'))
    if (m) return decodeEntities(m[1]).trim()
  }
  return ''
}

/** Atom 的 <link href="..."/>；优先 rel="alternate" */
function pickLink(block: string): string {
  const alt = block.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)
  if (alt) return decodeEntities(alt[1])
  const href = block.match(/<link[^>]*href=["']([^"']+)["']/i)
  if (href) return decodeEntities(href[1])
  const plain = pick(block, 'link')
  return plain
}

function parseDate(s: string): Date | null {
  if (!s) return null
  const t = Date.parse(s.trim())
  if (!isNaN(t)) return new Date(t)
  return null
}

/**
 * 解析 RSS 2.0 / Atom。返回按发布时间倒序、已去掉无标题或无链接的条目。
 */
export function parseFeed(xml: string, limit = 40): FeedEntry[] {
  const isAtom = /<feed[\s>]/i.test(xml) && /<entry[\s>]/i.test(xml)
  const blocks = isAtom
    ? xml.match(/<entry(?:\s[^>]*)?>[\s\S]*?<\/entry>/gi) || []
    : xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) || []

  const out: FeedEntry[] = []
  for (const b of blocks.slice(0, limit * 2)) {
    const title = stripTags(pick(b, 'title'))
    const url = isAtom ? pickLink(b) : pick(b, 'link', 'guid')
    if (!title || !url || !/^https?:\/\//i.test(url)) continue

    const rawSummary = pick(b, 'description', 'summary', 'content:encoded', 'content')
    const summary = stripTags(rawSummary).slice(0, 1200)

    const dateStr = pick(b, 'pubDate', 'published', 'updated', 'dc:date')
    const publishedAt = parseDate(dateStr) || new Date()

    const author = stripTags(pick(b, 'dc:creator', 'author')).slice(0, 120) || null

    out.push({
      guid: (pick(b, 'guid', 'id') || url).slice(0, 255),
      url: url.slice(0, 1000),
      title: title.slice(0, 500),
      summary,
      author,
      publishedAt,
    })
    if (out.length >= limit) break
  }

  return out.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
}

/**
 * URL 规范化 + 指纹。用于跨源识别同一篇原文：
 * 去掉协议差异、www、末尾斜杠、以及所有营销参数。
 */
export function urlHash(rawUrl: string): string {
  let u = rawUrl.trim()
  try {
    const parsed = new URL(u)
    parsed.hash = ''
    const drop: string[] = []
    parsed.searchParams.forEach((_, k) => {
      if (/^(utm_|ref|referrer|from|source|spm|share|s|fbclid|gclid)/i.test(k)) drop.push(k)
    })
    drop.forEach((k) => parsed.searchParams.delete(k))
    const host = parsed.host.replace(/^www\./i, '')
    const path = parsed.pathname.replace(/\/+$/, '')
    const qs = parsed.searchParams.toString()
    u = `${host}${path}${qs ? '?' + qs : ''}`.toLowerCase()
  } catch {
    u = u.toLowerCase()
  }
  return crypto.createHash('sha256').update(u).digest('hex')
}

/** 生成事件 slug：日期 + 标题音译不现实，用日期 + 短哈希，稳定且不泄露内部 id */
export function eventSlug(headline: string, happenedAt: Date): string {
  const d = happenedAt.toISOString().slice(0, 10)
  const h = crypto.createHash('sha1').update(headline).digest('hex').slice(0, 10)
  return `${d}-${h}`
}
