/**
 * AIHOT（aihot.virxact.com）线索接入。
 *
 * 【授权】商业使用授权号 AIHOTAPI20260907001，2026-09-07 取得。
 * 授权范围与逐条对照见 docs/AIHOT线索接入.md，改这个文件前先读那份。
 *
 * 【只取「去哪儿看」，不取「他们怎么写」】
 * 授权申请时刻意把范围收窄到**选题发现信号**：标题 / 原文链接 / 原发布者名 / 发布时间。
 * 他们写的 summary 与 reason 一个字都不取 —— 那既超出授权范围，
 * 也违反 SKILL.md §1.1「只能自写摘要」。摘要仍然由我们自己抓原文来写。
 *
 * 【这条边界靠类型系统守，不靠注释提醒】
 * 下面的 zod shape 只声明了我们要的字段，zod 默认会剥掉未声明的键；
 * 导出的 AihotLead 类型里根本没有 summary / reason 这两个字段名，
 * 任何想把它们往下游传的写法都过不了 tsc。这是刻意的：
 * 半年后有人「顺手把空摘要补一下」，编译器会先拦住他。
 *
 * 【抓不到原文的线索直接丢弃】
 * 2026-09-07 从生产 ECS 实测 91 条线索的域名分布：
 *   36% 指向 x.com / mp.weixin.qq.com / huggingface.co —— 这台机器抓不到正文
 *   32% 指向我们自己已有信源的域名 —— urlHash 会去重，价值只是「比我们早发现」
 *   32% 是我们覆盖不到的新域名（claude.com、blog.google、blogs.nvidia.com、
 *       cursor.com、runwayml.com、dev.to、arcprize.org 等），实测正文可抓
 * 抓不到正文就没有素材，没有素材就写不出自写摘要 —— 那种线索留在库里只会变成空壳条目。
 * 所以：先按域名黑名单挡掉已知抓不到的，剩下的在 triage 段真去抓一次，抓不到就判 SKIP。
 */
import { z } from 'zod'

/** 授权号。放在请求头里便于对方识别我们是已授权方；**不上公开页面**（对读者零信息量，却可被冒用） */
export const AIHOT_LICENSE = 'AIHOTAPI20260907001'

/** 线索中介标识，落在 news_items.lead_via 上 */
export const AIHOT_LEAD_VIA = 'AIHOT'

/** 对方域名。回链落库前必须校验 host 以它结尾，防止把任意站点的地址当成回链存进来 */
export const AIHOT_HOST = 'aihot.virxact.com'

/** 取数用的请求头。带上授权号与联系方式，出问题对方能直接找到我们 */
export const AIHOT_HEADERS: Record<string, string> = {
  'User-Agent': `Mozilla/5.0 (compatible; BigoLabBot/1.0; +https://bigolab.com)`,
  'X-License': AIHOT_LICENSE,
  Accept: 'application/json',
}

/**
 * 一次取多少条。
 *
 * 对方 nginx 限流 60r/m，我们每小时 1 次、不翻页，用量是 1r/h，余量极大 ——
 * 所以这个数字不是被限流卡住的，而是被**下游兜得住多少**决定的：
 * 每条留下来的线索都要在 triage 段真抓一次原文（9s 超时），取多了会把 triage 段拖长。
 */
export const AIHOT_LIMIT = 30

/**
 * 已知抓不到正文的域名，取数时直接丢弃，不浪费下游的一次抓取。
 *
 * 【这不是内容偏好，是可达性事实】全部在 2026-09-07 从生产 ECS 实测：
 *   x.com            未登录看不到时间线，数据中心 IP 全段封禁
 *   mp.weixin.qq.com 返回 17KB 空壳页，js_content 为空（实测 3 篇均如此）
 *   huggingface.co   含 hf-mirror 在内直连不通
 * 名单要按实测维护，不要凭印象增删。
 */
const LEAD_HOST_DENY = [
  'x.com',
  'twitter.com',
  'mobile.twitter.com',
  'mp.weixin.qq.com',
  'reddit.com',
  'www.reddit.com',
  'huggingface.co',
  'hf-mirror.com',
]

/**
 * 对方响应的**白名单** shape。
 *
 * 刻意逐字段声明而不是 z.record(z.any())：zod 会把没声明的键剥掉，
 * 于是 summary / reason / score / selected / category 在解析出口就不存在了。
 * 顺带说明为什么连 score 和 category 也不取：
 *   score    是他们的重要性判断。用了等于让第三方的编辑判断决定我们的排序，
 *            超出「选题发现信号」的范围。我们自己的 aiScore 由 compose 现算。
 *   category 他们的分类体系（tip / news / ...）与我们固定的六分类不同，
 *            映射过来只会引入语义误差。分类交给我们自己的 triage 判。
 */
const aihotItemSchema = z.object({
  id: z.string().min(1).max(120),
  title: z.string().min(1),
  source: z.object({ name: z.string().min(1) }).nullish(),
  links: z.object({
    aihot: z.string().url().nullish(),
    original: z.string().url(),
  }),
  publishedAt: z.string().nullish(),
  attribution: z.object({ name: z.string().nullish(), url: z.string().url().nullish() }).nullish(),
})

const aihotResponseSchema = z.object({
  items: z.array(aihotItemSchema).nullish(),
})

/**
 * 一条线索。**没有 summary、没有 reason** —— 见文件头，这是靠类型守边界。
 * 形状刻意贴近 feed.ts 的 FeedEntry，好让 collect 那边少一层转换。
 */
export interface AihotLead {
  /** 对方的条目 id，做 guid 用（同一条线索重复出现时靠 [sourceId, urlHash] 去重，这里只是可读标识） */
  guid: string
  /** 原文地址。这是我们真正要去抓正文的地方 */
  url: string
  /** 原文标题 */
  title: string
  /** 原发布者名，如「公众号：数字生命卡兹克」「X：Rohan Paul (@rohanpaul_ai)」 */
  originSourceName: string
  /** 回链地址（授权条件），已校验 host */
  leadUrl: string | null
  publishedAt: Date
}

function hostOf(url: string): string {
  try {
    return new URL(url).host.toLowerCase()
  } catch {
    return ''
  }
}

/** 回链必须真的指向对方站点。不校验就等于把任意 URL 存进库、再原样渲染成 <a href> */
function safeLeadUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  const h = hostOf(raw)
  if (h !== AIHOT_HOST && !h.endsWith(`.${AIHOT_HOST}`)) return null
  return raw.slice(0, 300)
}

/**
 * 解析线索列表。
 *
 * 【解析不出来返回空数组，不抛错】对方改了响应形状（schemaVersion 涨版本、字段改名）时，
 * 我们会静默拿到 0 条。这是刻意的：抛错会让 collect 把这个源熔断禁用，
 * 而对方只是升了个兼容版本；0 条会被 collect 记进抓取日志的 skipped，后台看得到。
 */
export function parseAihotLeads(text: string, limit = AIHOT_LIMIT): AihotLead[] {
  let root: unknown
  try {
    root = JSON.parse(text)
  } catch {
    return []
  }
  const parsed = aihotResponseSchema.safeParse(root)
  if (!parsed.success) return []

  const out: AihotLead[] = []
  for (const it of parsed.data.items ?? []) {
    const url = it.links.original
    const host = hostOf(url)
    if (!host) continue
    // 已知抓不到正文的直接丢：留下来也写不出自写摘要
    if (LEAD_HOST_DENY.some((d) => host === d || host.endsWith(`.${d}`))) continue

    const t = Date.parse(it.publishedAt || '')
    out.push({
      guid: it.id.slice(0, 255),
      url: url.slice(0, 1000),
      title: it.title.slice(0, 500),
      originSourceName: (it.source?.name || '').slice(0, 120),
      leadUrl: safeLeadUrl(it.attribution?.url || it.links.aihot),
      publishedAt: isNaN(t) ? new Date() : new Date(t),
    })
    if (out.length >= limit) break
  }
  return out
}

/** 取数地址。window 只接受 '24h' | '7d'，传别的对方直接 400 */
export function aihotFetchUrl(feedUrl: string, limit = AIHOT_LIMIT): string {
  try {
    const u = new URL(feedUrl)
    if (!u.searchParams.get('limit')) u.searchParams.set('limit', String(limit))
    return u.toString()
  } catch {
    return `https://${AIHOT_HOST}/api/v1/items?limit=${limit}`
  }
}
