/**
 * 打开像素与点击跳转的记录逻辑（公开端点调用）。规则见设计文档 10.1：
 * 事件条数按消息封顶（OPEN 每 10 分钟 1 条、总计 ≤20；CLICK ≤50）、机器点击不计、
 * 响应永远照常返回（限的只是记录）。
 *
 * 【实现方：同步与公开端】签名是契约。
 *
 * 【三条硬规矩】
 *  1. 跳转只认 marketing_links 里存的 URL（按 campaignId+idx 取），请求里给什么都不信 —— 没有开放重定向
 *  2. 记录失败绝不影响响应：像素照样回 GIF、点击照样 302（调用方 try/catch，这里也不向外抛业务错）
 *  3. 不打印 token / 邮箱 / URL（日志只有 id 与计数）
 *
 * 【这里用 trackToken，不用 token】（审查 C5）点击链接和像素地址会被收件人复制、转发、贴进群里；
 * 退订/偏好页的凭证 token 若也在这些链接里，拿到商品链接的人把路径换成 /unsubscribe/<token> 就能替人家改订阅。
 * 所以两枚凭证分开：token 只出现在退订链接与 List-Unsubscribe 头里（prefs.ts 用它），
 * 这里只认 trackToken（Prisma 建行时生成的 UUID）。拿 token 来访问 /api/mkt/c、/api/mkt/o 一律当无效。
 *
 * 【为什么事件要封顶】这两个端点免登录、可被任意重放。不封顶的话，一个脚本对着同一个 token
 * 循环请求就能把 marketing_events 刷到磁盘写满（这台机器只有十几 G 余量，满了挂的是整站）。
 * 计数列（openCount/clickCount/link.clicks）照加 —— 它们只是同一行上的整数，不占空间。
 */
import { prisma } from '@/lib/db'
import { siteOrigin } from '@/lib/news/format'
import { rateLimited } from '@/lib/news/rate-limit'
import { clip } from './types'

/**
 * 1×1 透明 GIF（43 字节）。像素路由直接回它。
 * 用独立的 ArrayBuffer 而不是 Buffer：Buffer 可能是共享内存池里的一段，直接当响应体会把整块池子带出去；
 * Response 构造时会复制这段字节，所以多个请求共用同一个 ArrayBuffer 是安全的。
 */
export const TRANSPARENT_GIF: ArrayBuffer = (() => {
  const bin = Buffer.from('R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64')
  const ab = new ArrayBuffer(bin.length)
  new Uint8Array(ab).set(bin)
  return ab
})()

/** 消息 token（退订/偏好凭证，prefs.ts 用）：randomBytes(16).hex → 32 位小写十六进制 */
export const MESSAGE_TOKEN_RE = /^[0-9a-f]{32}$/
/**
 * 追踪凭证 trackToken：Prisma @default(uuid()) → 36 位带连字符的 UUID（审查 C5）。
 * 格式不对直接当无效，不查库 —— 这两个端点免登录、可被任意重放，乱写的路径不该每次都打到数据库。
 * 大小写不敏感（有的客户端/网关会改写 URL 大小写），查库前转小写
 */
export const TRACK_TOKEN_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** 路径里的追踪凭证 → 规范化的 trackToken；格式不对返回 null */
export function normalizeTrackToken(raw: string): string | null {
  const t = (raw || '').trim()
  return t.length === 36 && TRACK_TOKEN_RE.test(t) ? t.toLowerCase() : null
}

export const OPEN_EVENT_CAP = 20
export const OPEN_EVENT_GAP_MS = 10 * 60_000
export const CLICK_EVENT_CAP = 50
/** 距发送不到这么久的点击/打开视为安全网关预取（真人不可能 10 秒内收信、打开、点链接） */
export const BOT_MIN_DELAY_MS = 10_000

/**
 * 已知的扫描器 / 预取器 UA 特征（设计 10.1 列举）。
 * proofpoint / mimecast / barracuda 是企业邮件安全网关，会在投递时把邮件里所有链接点一遍；
 * preview 覆盖各家「链接预览」抓取；headless 覆盖无头浏览器沙箱。
 */
const BOT_UA_RE = /bot|spider|crawl|preview|scanner|curl|wget|python|headless|proofpoint|mimecast|barracuda/i

/** 机器点击/打开判定：UA 命中已知扫描器，或距发送不到 10 秒 */
export function isBotHit(ua: string | null, sentAt: Date | null, now: Date): boolean {
  if (ua && BOT_UA_RE.test(ua)) return true
  if (sentAt) {
    const delta = now.getTime() - sentAt.getTime()
    // delta < 0（发送时间在「未来」，时钟不可信）同样按机器处理：宁可少算一次点击，也不把噪声记成真人
    if (delta < BOT_MIN_DELAY_MS) return true
  }
  return false
}

/**
 * 同一封信的写入节流（进程内）。只有「trackToken 查得到」之后才会走到这里，
 * 所以 Map 的键空间 = 真实发出去的消息数，不会被随机 token 撑大。
 * 超出只是不再记录，响应不受影响。
 */
function writeThrottled(kind: 'o' | 'c', messageId: number): boolean {
  return kind === 'o'
    ? rateLimited(`mkt-o:${messageId}`, { windowMs: 10 * 60_000, max: 30 })
    : rateLimited(`mkt-c:${messageId}`, { windowMs: 10 * 60_000, max: 60 })
}

function uaForDb(ua: string | null): string | null {
  if (!ua) return null
  const s = ua.replace(/[\u0000-\u001f\u007f]/g, ' ').trim()
  return s ? clip(s, 255) : null
}

/** 记录一次打开；trackToken 无效静默忽略（审查 C5：按 trackToken 查，退订 token 在这里无效） */
export async function recordOpen(token: string, ua: string | null): Promise<void> {
  const trackToken = normalizeTrackToken(token)
  if (!trackToken) return
  const now = new Date()
  const msg = await prisma.marketingMessage.findUnique({
    where: { trackToken },
    select: { id: true, campaignId: true, sentAt: true },
  })
  // 没发出去的行（排队中/跳过）不可能有人真的打开 —— 追踪凭证只存在于发出的邮件里
  if (!msg || !msg.sentAt) return
  if (writeThrottled('o', msg.id)) return

  const bot = isBotHit(ua, msg.sentAt, now)

  if (!bot) {
    await prisma.marketingMessage.updateMany({ where: { id: msg.id }, data: { openCount: { increment: 1 } } })
    // 首次打开时间只写一次（条件更新，并发两次请求也只有一个生效）
    await prisma.marketingMessage.updateMany({ where: { id: msg.id, openedAt: null }, data: { openedAt: now } })
  }

  // 事件行：每消息 10 分钟至多 1 条、总计 ≤20 条（含机器事件）。
  // 并发下可能多写一两条 —— 封顶是为了防刷盘，不是精确计数，接受这点超出
  const [total, last] = await Promise.all([
    prisma.marketingEvent.count({ where: { messageId: msg.id, type: 'OPEN' } }),
    prisma.marketingEvent.findFirst({
      where: { messageId: msg.id, type: 'OPEN' },
      orderBy: { id: 'desc' },
      select: { createdAt: true },
    }),
  ])
  if (total >= OPEN_EVENT_CAP) return
  if (last && Math.abs(now.getTime() - last.createdAt.getTime()) < OPEN_EVENT_GAP_MS) return
  await prisma.marketingEvent.create({
    data: { campaignId: msg.campaignId, messageId: msg.id, type: 'OPEN', bot, ua: uaForDb(ua), createdAt: now },
  })
}

/**
 * 库里存的链接 → 可以 302 的绝对地址。
 * 快照写进去的都是绝对 https（带 UTM 与 via=mail）；这里再兜一层：
 * 站内相对路径补成绝对，其余协议（javascript: 之类）一律回首页。
 */
export function safeRedirectTarget(stored: string | null | undefined, origin: string): string {
  const home = `${origin}/`
  const raw = (stored || '').trim()
  if (!raw) return home
  // 协议相对地址 //evil.com 会被浏览器当成外站，按无效处理
  if (raw.startsWith('/') && !raw.startsWith('//')) return `${origin}${raw}`
  try {
    const u = new URL(raw)
    if (u.protocol === 'https:' || u.protocol === 'http:' || u.protocol === 'mailto:') return u.toString()
  } catch {
    // fallthrough
  }
  return home
}

async function lookupLinkUrl(token: string, idx: number) {
  const trackToken = normalizeTrackToken(token)
  if (!trackToken || !Number.isInteger(idx) || idx < 0 || idx > 9999) return null
  // 审查 C5：按 trackToken 查；退订 token 拼进点击路径查不到任何东西
  const msg = await prisma.marketingMessage.findUnique({
    where: { trackToken },
    select: { id: true, campaignId: true, sentAt: true },
  })
  if (!msg) return null
  const link = await prisma.marketingLink.findUnique({
    where: { campaignId_idx: { campaignId: msg.campaignId, idx } },
    select: { url: true },
  })
  if (!link) return null
  return { msg, url: link.url }
}

/** HEAD 请求用：只解析跳转目标，不记录任何东西（扫描器常先发 HEAD） */
export async function peekClickTarget(token: string, idx: number): Promise<string> {
  const origin = siteOrigin()
  const hit = await lookupLinkUrl(token, idx)
  return hit ? safeRedirectTarget(hit.url, origin) : `${origin}/`
}

/** 解析点击：返回要 302 去的绝对 URL（无效 → 站点首页），并按规则记录 */
export async function resolveClick(token: string, idx: number, ua: string | null): Promise<string> {
  const origin = siteOrigin()
  const hit = await lookupLinkUrl(token, idx)
  if (!hit) return `${origin}/`
  const target = safeRedirectTarget(hit.url, origin)

  // 记录失败不能影响跳转：买家点了邮件里的按钮，最要紧的是把他带到页面上
  try {
    await recordClick(hit.msg, idx, ua)
  } catch (e) {
    console.error('[mkt/click] 记录失败 message=%d:', hit.msg.id, (e as Error)?.message)
  }
  return target
}

async function recordClick(msg: { id: number; campaignId: number; sentAt: Date | null }, idx: number, ua: string | null) {
  if (!msg.sentAt) return
  if (writeThrottled('c', msg.id)) return
  const now = new Date()
  const bot = isBotHit(ua, msg.sentAt, now)

  if (!bot) {
    // 有效点击：首次/末次点击时间、次数、链接排行。归因（stats.ts）靠的就是这些时间点
    await prisma.marketingMessage.updateMany({
      where: { id: msg.id },
      data: { clickCount: { increment: 1 }, lastClickAt: now },
    })
    await prisma.marketingMessage.updateMany({ where: { id: msg.id, clickedAt: null }, data: { clickedAt: now } })
    await prisma.marketingLink.updateMany({
      where: { campaignId: msg.campaignId, idx },
      data: { clicks: { increment: 1 } },
    })
  }

  const total = await prisma.marketingEvent.count({ where: { messageId: msg.id, type: 'CLICK' } })
  if (total >= CLICK_EVENT_CAP) return
  await prisma.marketingEvent.create({
    data: { campaignId: msg.campaignId, messageId: msg.id, type: 'CLICK', linkIdx: idx, bot, ua: uaForDb(ua), createdAt: now },
  })
}
