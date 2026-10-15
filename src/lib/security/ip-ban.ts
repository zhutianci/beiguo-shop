/**
 * 进程内的 IP 临时封禁（2026-10-15 攻防加固，docs/安全-攻防加固设计-1015.md 3.3）。
 *
 * 【谁来封】只由 lib/security/probe.ts 在零误报信号上触发：盲猜支付回调、短时间探测大量不存在的接口、
 * 已登录的普通用户反复试后台接口。真人浏览器永远不会产生这些请求。
 *
 * 【封了管什么】只挡「登录 / 注册 / 发码 / 下单 / 发起付款 / 上传」这几个写入口（各路由开头调 ipBlocked），
 * 浏览照常。公司、校园、手机运营商共用出口时，误封的代价被限制在「1 小时内不能登录 / 下单」，
 * 不会让同一出口的其他人整站打不开。
 *
 * 【局限】单容器进程内计数，准；容器重启（每次发版）清零，属于放行方向。条目有上限，满了淘汰最早的。
 */
import { ipKey } from '../auth-throttle'
import { clientIp } from '../news/rate-limit'

const MAX_ENTRIES = 5000
const bans = new Map<string, { until: number; reason: string }>()

export const IP_BLOCKED_MSG = '当前网络操作过于频繁，请稍后再试'

/** 请求的 IP 键（IPv6 按 /64 聚合，与全站限流同一口径）；拿不到真实 IP 时 null（不能让所有人共用一个桶） */
export function ipKeyOf(headers: Headers): string | null {
  const ip = clientIp(headers)
  return ip && ip !== 'unknown' ? ipKey(ip) : null
}

export function banIp(key: string, ms: number, reason: string): void {
  const now = Date.now()
  const prev = bans.get(key)
  if (prev) bans.delete(key) // 挪到队尾
  while (bans.size >= MAX_ENTRIES) {
    const oldest = bans.keys().next()
    if (oldest.done) break
    bans.delete(oldest.value)
  }
  bans.set(key, { until: Math.max(prev?.until ?? 0, now + ms), reason: reason.slice(0, 80) })
}

export function unbanIp(key: string): void {
  bans.delete(key)
}

/** 这个 IP 键现在是否处于封禁中（过期的顺手删掉） */
export function ipKeyBanned(key: string | null): boolean {
  if (!key) return false
  const b = bans.get(key)
  if (!b) return false
  if (b.until <= Date.now()) {
    bans.delete(key)
    return false
  }
  return true
}

/** 写入口开头调用：true = 应以 429 + IP_BLOCKED_MSG 拒绝 */
export function ipBlocked(headers: Headers): boolean {
  return ipKeyBanned(ipKeyOf(headers))
}

/** 后台 / 自测查看当前封禁（只读快照） */
export function listIpBans(): { key: string; until: number; reason: string }[] {
  const now = Date.now()
  const out: { key: string; until: number; reason: string }[] = []
  bans.forEach((v, k) => {
    if (v.until > now) out.push({ key: k, until: v.until, reason: v.reason })
  })
  return out
}
