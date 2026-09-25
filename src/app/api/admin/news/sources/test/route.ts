export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { fetchText, parseFeed, FetchFeedError } from '@/lib/news/feed'
import { relayConfigured, relayUrl } from '@/lib/news/sources'
import { AIHOT_HEADERS, aihotFetchUrl, parseAihotLeads } from '@/lib/news/aihot'
import { adminGuard } from '@/lib/admin-guard'
import { publicUrlProblem } from '@/lib/net-guard'

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
  kind: z.enum(['RSS', 'ATOM', 'JSON', 'HN', 'GITHUB', 'X', 'AIHOT']).optional(),
})

const TEST_TIMEOUT_MS = 10_000

/*
 * 【内网防护】这个接口的能力是「以服务端身份发任意 GET」，指向 169.254 / 100.100.100.200
 * 就能读到云厂商实例元数据。以前这里自带一份只查字面量的 blockedHost：挡不住解析到内网的域名与跳转，
 * 还用 startsWith('fc'/'fd') 把 fc2.com、fdroid.org 误判成内网（2026-09-26 审计 G33）。
 * 现在字面量预检用 lib/net-guard（给出更早、更友好的报错），真正的防线是 fetchText 的 publicOnly：
 * 建连时校验 DNS 解析结果、逐跳校验跳转。中继地址来自环境变量，保持与 collect 相同的抓取方式。
 */

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
  const denied = await adminGuard()
  if (denied) return denied
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
      const bad = publicUrlProblem(feedUrl)
      if (bad) return error(bad)
    }

    const isAihot = kind === 'AIHOT'
    if (isAihot) {
      target = aihotFetchUrl(feedUrl)
      // AIHOT 不走中继，地址由 feedUrl 推出，上面 viaRelay 分支没做的预检这里补上
      const bad = publicUrlProblem(target)
      if (bad) return error(bad)
    }
    // 只有真正发往中继的请求保持 collect 的抓取方式；其余地址都是后台手填的，走防 SSRF 抓取
    const publicOnly = !(viaRelay && !isAihot)

    const started = Date.now()
    let text = ''
    try {
      text = await fetchText(target, TEST_TIMEOUT_MS, isAihot ? AIHOT_HEADERS : undefined, { publicOnly })
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

    // 线索源单独看：走 aihot.ts 的白名单解析器，顺带把「域名过滤掉了多少」显示出来。
    // 这个差值是判断「对方这阵子是不是全在推 x.com」的唯一入口——
    // 过滤后为 0 不代表接入坏了，而是这批线索我们都抓不到正文。
    if (isAihot) {
      const leads = parseAihotLeads(text, 40)
      return success({
        ok: leads.length > 0,
        status: 200,
        ms,
        bytes: text.length,
        count: leads.length,
        titles: leads.slice(0, 3).map((l) => `${l.originSourceName}｜${l.title}`),
        format: 'AIHOT 线索',
        target,
        latest: leads[0]?.publishedAt ?? null,
        message:
          leads.length > 0
            ? `域名过滤后剩 ${leads.length} 条可用线索（只取标题/原文链接/原发布者/时间，不取对方摘要）`
            : '连接成功但过滤后为 0 条——多半是这批线索都指向 x.com / 微信公众号，本机抓不到正文，已按设计丢弃',
      })
    }

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
