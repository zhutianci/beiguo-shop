/**
 * 登录 / 注册 / 发验证码 / 找回密码的限流闸门，集中在一处。
 *
 * 【为什么要有】2026-09-25 审计：这四个接口此前**没有任何限流**，验证码也不限错误次数——
 * 6 位验证码可以无限次猜，找回密码只需要知道邮箱（后台唯一的管理员账号也一样），
 * 登录可以撞库并用 bcryptjs（纯 JS）把这台 1.8G 机器的 CPU 打满，发码接口可以拿来邮件轰炸、
 * 把和订单发货邮件共用的阿里云发信额度与信誉烧光。
 *
 * 【实现】全部是 lib/news/rate-limit.ts 的进程内同步计数：检查与计数在同一个同步调用里完成，
 * Node 单线程下并发请求之间没有「先查后写」的竞态（这正是原来 DB 冷却 tooFrequent 的漏洞）。
 * 单容器部署下是准的；容器重启清零，属于放行方向，DB 里的 60 秒冷却仍然兜底。
 *
 * 【key 约定】前缀写死（rate-limit 按前缀分桶），可变部分放冒号后面。
 * 同一个 key 只配一种窗口：rateLimited 每次按本次传入的 windowMs 过滤，两种窗口共用一个 key 会互相干扰。
 *
 * 【IP】clientIp() 取的是 nginx 核实过的地址（nginx.conf 顶部）。拿不到（'unknown'）时跳过 IP 维度，
 * 否则所有人共用一个桶、被一个人打满。IPv6 按 /64 聚合：一户通常分到整段 /64，按单地址限流等于随手绕过。
 */
import { clientIp, rateLimited, rateClear, type RateRule } from './news/rate-limit'

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

export type CodePurposeKey = 'REGISTER' | 'RESET' | 'LOOKUP'

/** IPv6 按 /64 聚合；IPv4 与 IPv4-mapped 原样取 IPv4 */
export function ipKey(ip: string): string {
  if (!ip.includes(':')) return ip
  if (ip.includes('.')) return ip.slice(ip.lastIndexOf(':') + 1) // ::ffff:1.2.3.4
  const [head, tail] = ip.toLowerCase().split('::')
  const h = head ? head.split(':') : []
  const t = tail ? tail.split(':') : []
  const groups = tail === undefined ? h : [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t]
  return groups.slice(0, 4).map((x) => x.replace(/^0+(?=.)/, '')).join(':') + '::/64'
}

function ipOf(headers: Headers): string | null {
  const ip = clientIp(headers)
  return ip && ip !== 'unknown' ? ipKey(ip) : null
}

/** 邮箱归一：库的排序规则大小写不敏感，大小写不同的写法是同一个账号，计数必须合并；截断防超长 key */
function mailKey(email: string): string {
  return email.trim().toLowerCase().slice(0, 120)
}

// ---------------- 发验证码 ----------------

// 10 分钟 10 次：上线后老用户要给几个历史绑定逐个收码验证，5 次会误伤
const SEND_IP_SHORT: RateRule = { windowMs: 10 * MIN, max: 10 }
const SEND_IP_DAY: RateRule = { windowMs: DAY, max: 20 }
const SEND_MAIL_COOLDOWN: RateRule = { windowMs: MIN, max: 1 } // 与前端 60 秒倒计时一致
// 每邮箱每天的发信上限拆两层（终审 2026-09-26）：
//  · 邮箱 + IP：8 次——同一来源对同一邮箱的正常重发足够
//  · 纯邮箱：30 次——只兜「多 IP 轰炸同一个邮箱」。以前单层 8 次且不分来源，
//    知道邮箱的人先刷满 8 次，受害者（含站长）当天就收不到找回密码的码，配合登录限流能把人整天锁在门外
const SEND_MAIL_DAY_PER_IP: RateRule = { windowMs: DAY, max: 8 }
const SEND_MAIL_DAY: RateRule = { windowMs: DAY, max: 30 }
// 全站熔断按用途分桶：刷 REGISTER 不能连带挡住老客户找回密码。阈值远高于真实量，只兜被刷的场景
const SEND_GLOBAL: Record<CodePurposeKey, RateRule> = {
  REGISTER: { windowMs: HOUR, max: 120 },
  RESET: { windowMs: HOUR, max: 60 },
  LOOKUP: { windowMs: HOUR, max: 120 },
}

export interface SendGate {
  message: string
  /** 全站熔断首次触发（每小时一次）：调用方据此打一条告警 */
  alarm?: boolean
}

/**
 * 发码闸门：返回拒绝原因，null 表示放行。**必须在查用户之前调用**，
 * 这样「已注册 / 未注册」两类邮箱被同样计数、同样冷却，冷却本身不再是枚举口。
 * 顺序 IP → 邮箱 → 全站：rateLimited 只在放行时计数，前一层拒掉的请求不消耗后一层的额度。
 */
export function sendCodeGate(headers: Headers, email: string, purpose: CodePurposeKey): SendGate | null {
  const ip = ipOf(headers)
  if (ip && (rateLimited(`vcs-ip:${ip}`, SEND_IP_SHORT) || rateLimited(`vcs-ipd:${ip}`, SEND_IP_DAY))) {
    return { message: '获取验证码过于频繁，请稍后再试' }
  }
  const m = mailKey(email)
  if (rateLimited(`vcs-mail:${purpose}:${m}`, SEND_MAIL_COOLDOWN)) {
    return { message: '验证码发送过于频繁，请 60 秒后再试' }
  }
  if (
    (ip && rateLimited(`vcs-mailipd:${ip}|${m}`, SEND_MAIL_DAY_PER_IP)) ||
    rateLimited(`vcs-maild:${m}`, SEND_MAIL_DAY)
  ) {
    return { message: '该邮箱今日获取验证码次数过多，请明天再试' }
  }
  if (rateLimited(`vcs-all:${purpose}`, SEND_GLOBAL[purpose])) {
    const alarm = !rateLimited(`vcs-alarm:${purpose}`, { windowMs: HOUR, max: 1 })
    return { message: '当前获取验证码的人较多，请几分钟后再试', alarm }
  }
  return null
}

// ---------------- 校验验证码（注册 / 找回密码提交） ----------------

const VERIFY_IP: RateRule = { windowMs: 10 * MIN, max: 30 }

/** 按 IP 限制提交验证码的次数（每张码另有 5 次上限，见 lib/verify-code.ts） */
export function verifyIpLimited(headers: Headers): boolean {
  const ip = ipOf(headers)
  return !!ip && rateLimited(`vcv-ip:${ip}`, VERIFY_IP)
}

// ---------------- 登录 ----------------

// 按 IP：挡单一来源撞库与用 bcrypt 打满 CPU；公司/校园 NAT 共用出口时所有人合计 30 次/10 分钟，正常用不完
const LOGIN_IP: RateRule = { windowMs: 10 * MIN, max: 30 }
// 按「邮箱 + IP」：真人忘记密码一般试不到 10 次
const LOGIN_MAIL_IP: RateRule = { windowMs: 15 * MIN, max: 10 }
// 按纯邮箱只设高阈值，挡「换很多 IP 猜同一个账号」。
// 【为什么不再是纯邮箱 10 次】终审 2026-09-26：那样知道邮箱的人每 90 秒打一次错误登录就能让该账号
// 持续 429（包括站长），而站长的后台账号正好是公开的 admin@example.com 这种形态。
// 分两层后，攻击者只能锁住「他自己那个 IP 上的该邮箱」，真实用户从自己的网络照常登录
const LOGIN_MAIL: RateRule = { windowMs: 15 * MIN, max: 100 }

/**
 * 登录闸门：返回拒绝文案，null 表示放行。必须在查库与 bcrypt 之前调用。
 * 所有尝试都计数（不只失败）：只数失败就得「先看后记」，中间隔着 bcrypt 的 await，并发下会超发。
 * 正常用户成功一次就停，用不到 10 次。
 */
export function loginThrottle(headers: Headers, email: string): string | null {
  const ip = ipOf(headers)
  if (ip && rateLimited(`login-ip:${ip}`, LOGIN_IP)) return '登录尝试过于频繁，请 10 分钟后再试'
  const m = mailKey(email)
  if ((ip && rateLimited(`login-mailip:${ip}|${m}`, LOGIN_MAIL_IP)) || rateLimited(`login-mail:${m}`, LOGIN_MAIL)) {
    return '该账号登录尝试次数过多，请 15 分钟后再试，或通过「忘记密码」重置后立即登录'
  }
  return null
}

/** 重置密码成功 = 证明了邮箱归属：解除该邮箱的登录冷却（防止被别人故意输错锁死） */
export function clearLoginThrottle(email: string, headers?: Headers): void {
  const m = mailKey(email)
  rateClear(`login-mail:${m}`)
  const ip = headers ? ipOf(headers) : null
  if (ip) rateClear(`login-mailip:${ip}|${m}`)
}
