/**
 * 论坛发帖 / 评论 / 点赞与浏览计数的限流闸门（2026-09-26 审计 G44）。
 *
 * 【为什么要有】/forum 已经挂进顶部导航和 sitemap，但发帖、评论、点赞此前零限流：
 * 匿名即发即公开，一个 IP 写个循环就能不停插入几十 KB 一行的数据，把磁盘写满、
 * 连带打挂同机 MySQL（整站下单都会停）；点赞靠客户端自填的 x-anon-id 去重，
 * 每次换一个随机值就能 +1，直接刷穿 sort=hot；浏览数每次 GET 都 +1。
 *
 * 【身份】登录用户按 userId 计；匿名一律按 IP（auth-throttle.ipKey，IPv6 按 /64 聚合）。
 * x-anon-id 是客户端自己填的，只能用来显示「我赞过没有」，**不能**做限流键或去重依据。
 * 管理员不限。IP 取的是 nginx 核实过的地址（lib/news/rate-limit.clientIp 的注释），
 * 前提是工作区那份 nginx 真实 IP 修复已上线；拿不到 IP（'unknown'）时跳过 IP 维度，
 * 否则所有人共用一个桶、被一个人打满（口径同 auth-throttle）。
 *
 * 【实现】全部是 lib/news/rate-limit 的进程内同步计数：检查与计数在同一个同步调用里完成，
 * Node 单线程下并发请求之间没有「先查后写」的竞态。容器重启清零，属于放行方向。
 *
 * 【key 约定】前缀写死（rate-limit 按前缀分桶），可变部分放冒号后面；
 * 同一个 key 只配一种窗口（rateLimited 每次按本次传入的 windowMs 过滤，混用会互相干扰）。
 *
 * 只在服务端用；从 './forum' 只引类型，不形成运行时循环依赖。
 */
import { clientIp, rateLimited, rateClear, type RateRule } from './news/rate-limit'
import { ipKey } from './auth-throttle'
import type { Actor } from './forum'

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

function ipOf(h: Headers): string | null {
  const ip = clientIp(h)
  return ip && ip !== 'unknown' ? ipKey(ip) : null
}

// ---------------- 发帖 / 评论 ----------------

type WriteKind = 'post' | 'comment'

interface WriteRules {
  p: string // key 前缀（写死）
  what: string
  user: RateRule
  userDay: RateRule
  ip: RateRule
  ipDay: RateRule
  anonAll: RateRule // 全站匿名熔断
}

// 阈值远高于真人发帖频率；被拒的人登录后按 userId 计，不再受 IP 额度影响
const WRITE: Record<WriteKind, WriteRules> = {
  post: {
    p: 'fp',
    what: '发帖',
    user: { windowMs: HOUR, max: 5 },
    userDay: { windowMs: DAY, max: 20 },
    ip: { windowMs: HOUR, max: 3 },
    ipDay: { windowMs: DAY, max: 10 },
    anonAll: { windowMs: HOUR, max: 30 },
  },
  comment: {
    p: 'fc',
    what: '评论',
    user: { windowMs: 10 * MIN, max: 10 },
    userDay: { windowMs: DAY, max: 100 },
    ip: { windowMs: 10 * MIN, max: 10 },
    ipDay: { windowMs: DAY, max: 50 },
    anonAll: { windowMs: HOUR, max: 120 },
  },
}

/**
 * 返回拒绝文案，null 放行。放在参数校验通过之后、create 之前（校验失败不消耗额度）。
 */
export function forumWriteGate(h: Headers, actor: Actor, kind: WriteKind): string | null {
  if (actor.isAdmin) return null
  const r = WRITE[kind]
  if (actor.userId) {
    return rateLimited(`${r.p}-u:${actor.userId}`, r.user) || rateLimited(`${r.p}-ud:${actor.userId}`, r.userDay)
      ? `${r.what}过于频繁，请稍后再试`
      : null
  }
  const ip = ipOf(h)
  if (ip && (rateLimited(`${r.p}-ip:${ip}`, r.ip) || rateLimited(`${r.p}-ipd:${ip}`, r.ipDay))) {
    return `${r.what}过于频繁，请稍后再试，或登录后继续`
  }
  // 全站匿名熔断：挡「换 IP 分布式刷库」。被打满时只影响匿名，登录用户不受影响
  if (rateLimited(`${r.p}-anon:all`, r.anonAll)) return `当前匿名${r.what}的人较多，请登录后再${r.what}`
  return null
}

// ---------------- 点赞 ----------------

const LIKE_USER: RateRule = { windowMs: 10 * MIN, max: 60 }
const LIKE_IP: RateRule = { windowMs: 10 * MIN, max: 120 }
// 3 次而不是 1 次：国内移动网络普遍 CGNAT，一个出口 IP 后面是大量真实用户（终审 2026-09-26）
const LIKE_ONCE: RateRule = { windowMs: DAY, max: 3 }

/** 点赞切换频率（赞和取消都计数） */
export function forumLikeGate(h: Headers, actor: Actor): string | null {
  if (actor.isAdmin) return null
  if (actor.userId) return rateLimited(`fl-u:${actor.userId}`, LIKE_USER) ? '操作过于频繁，请稍后再试' : null
  const ip = ipOf(h)
  return ip && rateLimited(`fl-ip:${ip}`, LIKE_IP) ? '操作过于频繁，请稍后再试' : null
}

/**
 * 匿名新增一个赞：同一 IP 对同一目标（p123 / c456）24h 只能新增 1 次。true = 拒绝。
 * 这是同步调用、紧挨在 create 前面，同一 IP 并发换 anonId 也只能放进去一个。
 */
export function anonLikeBlocked(h: Headers, target: string): boolean {
  const ip = ipOf(h)
  return !!ip && rateLimited(`fl-once:${ip}:${target}`, LIKE_ONCE)
}

/** 匿名取消赞（或新增失败）后归还名额。每次归还都伴随一次 -1（或根本没 +1），所以净增仍然 ≤ 1 */
export function anonLikeRelease(h: Headers, target: string): void {
  const ip = ipOf(h)
  if (ip) rateClear(`fl-once:${ip}:${target}`)
}

/**
 * 同一身份对同一目标的点赞切换串行化。ForumLike 表没有唯一约束（本轮不改表），
 * 「findFirst → create」在并发双击下会插进两行、likeCount +2；登录用户同样有这个口子。
 * 单进程部署下进程内的 Set 就够：拿不到锁的请求直接拒绝，前端会提示稍后再试。
 * 必须在 finally 里 release。
 */
const likeInflight = new Set<string>()

export function likeLockKey(actor: Actor, target: string): string {
  return `${target}:${actor.userId ? 'u' + actor.userId : 'a' + actor.anonId}`
}

export function acquireLikeLock(key: string): boolean {
  if (likeInflight.has(key)) return false
  likeInflight.add(key)
  return true
}

export function releaseLikeLock(key: string): void {
  likeInflight.delete(key)
}

// ---------------- 浏览计数 ----------------

const VIEW_ONCE: RateRule = { windowMs: HOUR, max: 1 }

/** 浏览计数：同一读者（登录用 userId / 匿名用 IP）对同一帖 1 小时只计 1 次。true = 这次要计数 */
export function forumViewCounted(h: Headers, actor: Actor, postId: number): boolean {
  const viewer = actor.userId ? `u${actor.userId}` : ipOf(h)
  return !!viewer && !rateLimited(`fv:${viewer}:${postId}`, VIEW_ONCE)
}
