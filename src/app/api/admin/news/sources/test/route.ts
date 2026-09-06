export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { fetchText, parseFeed, FetchFeedError } from '@/lib/news/feed'
import { relayConfigured, relayUrl } from '@/lib/news/sources'

/**
 * 「立即测试该源」：拉一次 feed，返回 HTTP 状态、耗时、解析出的条目数与前 3 条标题。
 * **不入库**，也不改信源的 lastFetchAt / failCount —— 这是验证工具，不是抓取任务。
 *
 * SKILL.md §2.2 要求新增信源前必须先实测，这个按钮就是把那条 curl 搬进后台。
 */

const bodySchema = z.object({
  /** 传 id 测已有源；传 feedUrl 测还没入库的新源 */
  id: z.coerce.number().int().positive().optional(),
  feedUrl: z.string().trim().max(500).optional(),
  viaRelay: z.boolean().optional(),
  kind: z.enum(['RSS', 'ATOM', 'JSON', 'HN', 'GITHUB', 'X']).optional(),
})

const TEST_TIMEOUT_MS = 10_000

/**
 * 禁止把内网地址填进 feed。后台虽然只有管理员能进，但这个接口的能力是
 * 「以服务端身份发任意 GET」，指向 169.254/100.100.100.200 就能读到云厂商实例元数据。
 * 注意：只挡住字面量内网地址，挡不住解析到内网的域名与跳转，所以中继 Worker 那边的
 * 域名白名单不能省（§2.3）。
 */
function blockedHost(rawUrl: string): string | null {
  let host = ''
  try {
    const u = new URL(rawUrl)
    if (!/^https?:$/i.test(u.protocol)) return '只支持 http / https'
    host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  } catch {
    return '地址格式不正确'
  }

  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return '不允许访问内网地址'
  }
  if (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:')) {
    return '不允许访问内网地址'
  }
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])]
    const isPrivate =
      a === 0 ||
      a === 127 ||
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      // 100.64/10 里有阿里云实例元数据 100.100.100.200
      (a === 100 && b >= 64 && b <= 127)
    if (isPrivate) return '不允许访问内网地址'
  }
  return null
}

/** JSON 源（HuggingFace / Reddit / GitHub API）没有统一结构，尽量捞出条数与标题 */
function peekJson(text: string): { count: number; titles: string[] } | null {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return null
  }
  const pickArray = (v: unknown): unknown[] => {
    if (Array.isArray(v)) return v
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>
      for (const k of ['items', 'data', 'results', 'children', 'papers']) {
        const inner = o[k]
        if (Array.isArray(inner)) return inner
        if (inner && typeof inner === 'object') {
          const deep = (inner as Record<string, unknown>).children
          if (Array.isArray(deep)) return deep
        }
      }
    }
    return []
  }
  const arr = pickArray(data)
  const titles = arr
    .slice(0, 3)
    .map((row) => {
      if (!row || typeof row !== 'object') return ''
      const o = row as Record<string, unknown>
      const inner = (o.data && typeof o.data === 'object' ? (o.data as Record<string, unknown>) : o) as Record<string, unknown>
      const t = inner.title ?? inner.name ?? inner.headline ?? (inner.paper as Record<string, unknown> | undefined)?.title
      return typeof t === 'string' ? t.slice(0, 120) : ''
    })
    .filter(Boolean)
  return { count: arr.length, titles }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) return error(parsed.error.errors[0].message)
    let { feedUrl, viaRelay, kind } = parsed.data

    if (parsed.data.id) {
      const src = await prisma.newsSource.findUnique({
        where: { id: parsed.data.id },
        select: { feedUrl: true, viaRelay: true, kind: true },
      })
      if (!src) return error('信源不存在')
      feedUrl = src.feedUrl
      viaRelay = src.viaRelay
      kind = src.kind as typeof kind
    }

    if (!feedUrl) return error('请提供 feed 地址或信源 id')

    let target = feedUrl
    if (viaRelay) {
      if (!relayConfigured()) {
        return error('该源需要经 Cloudflare Worker 中继，但 NEWS_RELAY_URL 未配置')
      }
      // 中继地址来自环境变量，域名白名单在 Worker 侧做
      target = relayUrl(feedUrl)
    } else {
      const bad = blockedHost(feedUrl)
      if (bad) return error(bad)
    }

    const started = Date.now()
    let text = ''
    try {
      text = await fetchText(target, TEST_TIMEOUT_MS)
    } catch (e) {
      const ms = Date.now() - started
      const status = e instanceof FetchFeedError ? e.status : 0
      return success({
        ok: false,
        status,
        ms,
        bytes: 0,
        count: 0,
        titles: [],
        target,
        message: e instanceof Error ? e.message : String(e),
      })
    }
    const ms = Date.now() - started

    // JSON 源单独看：parseFeed 只认 RSS / Atom
    const looksJson = kind === 'JSON' || /^\s*[[{]/.test(text)
    const jsonPeek = looksJson ? peekJson(text) : null

    const entries = jsonPeek ? [] : parseFeed(text, 40)
    const titles = jsonPeek ? jsonPeek.titles : entries.slice(0, 3).map((e) => e.title)
    const count = jsonPeek ? jsonPeek.count : entries.length

    return success({
      ok: count > 0,
      status: 200,
      ms,
      bytes: text.length,
      count,
      titles,
      format: jsonPeek ? 'JSON' : 'RSS/Atom',
      target,
      // 前 3 条的时间，用来判断这个 feed 是不是长期不更新
      latest: entries[0]?.publishedAt ?? null,
      message:
        count > 0
          ? `解析出 ${count} 条`
          : '连接成功但没解析出条目——检查这个地址是否真的是 RSS/Atom/JSON feed',
    })
  } catch (err) {
    console.error('Test news source error:', err)
    return error('测试失败')
  }
}
