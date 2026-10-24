/**
 * 探测识别与自动处置（2026-10-15 攻防加固，docs/安全-攻防加固设计-1015.md 3.3）。
 *
 * 10-15 那个人在 20 分钟里盲猜了 30 多个支付回调路径、用登录态打了几十个后台接口、试了上百个不存在的 API。
 * 这三类请求真人浏览器永远不会发，可以零误报地识别：
 *
 * | 信号 | 入口 | 阈值（10 分钟） | 处置 |
 * |---|---|---|---|
 * | PAY_CALLBACK 盲猜支付回调 | api/pay/[...probe]（真实回调 sms-notify / vmq/* 优先匹配，到不了这里） | 同一 IP 或同一账号 3 次 | 封 IP 1 小时；登录了就封号 |
 * | ADMIN_DENIED 普通用户试后台 | middleware 拒绝时改写到 api/sec-probe/admin-denied | 同一账号 5 个不同路径 | 封号 + 封 IP |
 * | API_404 探测不存在的接口 | api/[...notfound] | 同一 IP 10 个不同路径 | 只封 IP 1 小时（不封号：前端万一调了已删掉的接口，代价可控） |
 *
 * 【防栽赃】按 IP 封禁的信号都能被第三方网页伪造：恶意页面放 10 个 <img src="bigolab.com/api/xxx">，访客自己的 IP 就会被封。
 * 所以 Sec-Fetch-Site 为 cross-site / same-site 的请求一律不计数（浏览器自动带、页面脚本改不了）；
 * 脚本、curl、地址栏直接输入（none）、本站页面（same-origin）照常计数。same-site 也排除，是因为渠道子域由第三方运营。
 * 未登录访客打后台接口（401）也不计数：站长登录过期后，还开着的后台页面会连着请求好几个不同的后台接口。
 *
 * 【处置的副作用都可控】IP 封禁只挡登录、注册、下单、付款、上传（lib/security/ip-ban.ts），浏览照常；
 * 封号走 lib/security/ban-user.ts（永不封 ADMIN，自动封号不封渠道成员——改为只告警）。每次处置都写 audit_events、推安全告警。
 */
import type { NextRequest } from 'next/server'
import { verifyToken } from '../auth'
import { prisma } from '../db'
import { writeAudit, writeAuditThrottled } from '../audit'
import { notify } from '../notify'
import { rateLimited } from '../news/rate-limit'
import { banIp, ipKeyBanned, ipKeyOf } from './ip-ban'
import { banUser } from './ban-user'

export type ProbeKind = 'PAY_CALLBACK' | 'ADMIN_DENIED' | 'API_404' | 'IDOR'

const MIN = 60_000
const WINDOW_MS = 10 * MIN
export const IP_BAN_MS = 60 * MIN

/** 每种信号：按 IP / 按账号的阈值；distinct = 数不同路径（否则数次数）。0 = 这个维度不处置 */
export const PROBE_RULES: Record<ProbeKind, { ip: number; user: number; distinct: boolean; banUser: boolean; label: string }> = {
  PAY_CALLBACK: { ip: 3, user: 3, distinct: false, banUser: true, label: '盲猜支付回调' },
  ADMIN_DENIED: { ip: 0, user: 5, distinct: true, banUser: true, label: '普通用户反复试后台接口' },
  API_404: { ip: 10, user: 0, distinct: true, banUser: false, label: '大量探测不存在的接口' },
  // 2026-10-24 第二轮加固：登录的买家去取「存在、但属于别人」的订单（改 URL 里的订单号 / id 遍历）。
  // 真人只会打开自己的订单，不可能碰到别人的单号；10 分钟 5 张不同的别人订单 → 封号 + 封 IP
  IDOR: { ip: 0, user: 5, distinct: true, banUser: true, label: '反复访问别人的订单（越权尝试）' },
}

/**
 * 买家按 id 取订单没取到时调用（只在 404 分支，正常用户几乎不会走到）：订单确实存在但属于别人 → 记一次 IDOR。
 * 绝不抛错、不改变调用方的响应（照样回 404，不暴露「这个订单号存在」）。
 */
export async function noteForeignOrder(req: NextRequest, userId: number, orderId: number): Promise<void> {
  try {
    if (!Number.isSafeInteger(orderId) || orderId <= 0) return
    const o = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true } })
    if (o && o.userId !== userId) await recordProbe(req, 'IDOR', { path: `order:${orderId}` })
  } catch (e) {
    console.error('[security] noteForeignOrder 失败', (e as Error)?.message)
  }
}

interface Track {
  first: number
  hits: number
  paths: Set<string>
  acted: boolean
}
const MAX_TRACKS = 5000
const tracks = new Map<string, Track>()

function bump(key: string, path: string, now: number): Track {
  let t = tracks.get(key)
  if (t && now - t.first >= WINDOW_MS) t = undefined
  if (!t) {
    while (tracks.size >= MAX_TRACKS) {
      const oldest = tracks.keys().next()
      if (oldest.done) break
      tracks.delete(oldest.value)
    }
    t = { first: now, hits: 0, paths: new Set(), acted: false }
  } else {
    tracks.delete(key) // 挪到队尾
  }
  t.hits++
  if (t.paths.size < 50) t.paths.add(path)
  tracks.set(key, t)
  return t
}

function score(t: Track, distinct: boolean): number {
  return distinct ? t.paths.size : t.hits
}

/** 跨站 / 兄弟子域发起的请求不计数（见文件头「防栽赃」） */
export function countable(headers: Headers): boolean {
  const s = (headers.get('sec-fetch-site') || '').toLowerCase()
  return s !== 'cross-site' && s !== 'same-site'
}

/** 只验签名、不查库：拿到 token 里的 userId / role（处置前 banUser 会再查库） */
function tokenUser(req: NextRequest): { userId: number; role: string } | null {
  let token = req.cookies.get('token')?.value
  if (!token) {
    const auth = req.headers.get('authorization')
    if (auth && auth.startsWith('Bearer ')) token = auth.slice(7).trim()
  }
  if (!token) return null
  const p = verifyToken(token)
  return p ? { userId: p.userId, role: p.role } : null
}

function samplePaths(t: Track): string {
  return Array.from(t.paths).slice(0, 4).join('  ')
}

/** 安全告警：同一对象每小时 1 条、全站每小时最多 30 条（被大规模扫描时不刷屏） */
function alert(subject: string, rows: { label: string; value: string }[]): void {
  if (rateLimited(`sec-alert:${subject}`, { windowMs: 60 * MIN, max: 1 })) return
  if (rateLimited('sec-alert-all', { windowMs: 60 * MIN, max: 30 })) return
  notify('security.alert', rows, { link: '/admin/settings', linkText: '后台查看安全记录' })
}

/**
 * 记一次探测并在越过阈值时处置。调用方随后照常返回 404 / 401 / 403（响应与没有蜜罐时一致）。
 * 绝不抛错：任何异常只记日志，不能让蜜罐自己变成 500。
 */
export async function recordProbe(req: NextRequest, kind: ProbeKind, opts?: { path?: string }): Promise<void> {
  try {
    if (!countable(req.headers)) return
    const rule = PROBE_RULES[kind]
    const now = Date.now()
    // ADMIN_DENIED 是 middleware 改写过来的，原路径由调用方传入
    const path = (opts?.path || req.nextUrl.pathname).slice(0, 120)
    const ip = ipKeyOf(req.headers)
    const who = tokenUser(req)
    // ADMIN_DENIED 只认「登录了的普通用户」；管理员本人不计
    if (kind === 'ADMIN_DENIED' && (!who || who.role === 'ADMIN')) return
    if (who?.role === 'ADMIN') return

    // 留痕：同一来源同一类 10 分钟一条（扫描器一分钟上百个 404，不能一条一行）
    void writeAuditThrottled(`probe:${kind}:${who ? 'u' + who.userId : ip}`, WINDOW_MS, {
      actorKind: who ? 'BUYER' : 'SYSTEM',
      actorUserId: who?.userId ?? null,
      action: `sec.probe.${kind.toLowerCase()}`,
      result: 'DENIED',
      reason: `${req.method} ${path}`,
      req,
    }).catch(() => {})

    const ipTrack = ip && rule.ip > 0 ? bump(`${kind}|ip:${ip}`, path, now) : null
    const userTrack = who && rule.user > 0 ? bump(`${kind}|u:${who.userId}`, path, now) : null
    const ipHit = !!ipTrack && !ipTrack.acted && score(ipTrack, rule.distinct) >= rule.ip
    const userHit = !!userTrack && !userTrack.acted && score(userTrack, rule.distinct) >= rule.user
    if (!ipHit && !userHit) return
    if (ipTrack && ipHit) ipTrack.acted = true
    if (userTrack && userHit) userTrack.acted = true
    const t = (userHit ? userTrack : ipTrack) as Track

    const actions: string[] = []
    if (ip && !ipKeyBanned(ip)) {
      banIp(ip, IP_BAN_MS, kind)
      actions.push('IP 已封 1 小时（只挡登录 / 注册 / 下单 / 付款 / 上传）')
    }
    let account = who ? `#${who.userId}` : '未登录'
    if (who && rule.banUser && (userHit || ipHit)) {
      const r = await banUser(who.userId, { reason: `自动封禁：${rule.label}（${samplePaths(t).slice(0, 180)}）`, actor: 'SYSTEM', req })
      if (r.ok) {
        account = `#${who.userId} ${r.email ?? ''}`
        actions.push(
          r.alreadyDisabled
            ? '账号此前已禁用'
            : `账号已禁用、登录态已失效；取消未付单 ${r.summary.cancelledOrders} 笔，释放收款金额 ${r.summary.closedSlips} 个`,
        )
      } else if (r.why === 'MEMBER') {
        actions.push('该账号是渠道成员，未自动封禁，请人工判断')
      }
    }
    if (ip) {
      void writeAudit(null, {
        actorKind: 'SYSTEM',
        action: 'sec.ipban',
        targetType: 'ip',
        targetId: ip.slice(0, 40),
        reason: `${rule.label}：${samplePaths(t)}`.slice(0, 255),
        req,
      }).catch(() => {})
    }
    console.warn('[security] 探测处置', kind, ip, account, actions.join('；'))
    alert(`${kind}:${who ? who.userId : ip}`, [
      { label: '类型', value: rule.label },
      { label: '来源 IP', value: ip ?? '未知' },
      { label: '账号', value: account },
      { label: '10 分钟内', value: `${t.hits} 次、${t.paths.size} 个不同路径` },
      { label: '路径样例', value: samplePaths(t) },
      { label: '处置', value: actions.join('；') || '仅记录' },
    ])
  } catch (e) {
    console.error('[security] recordProbe 失败', (e as Error)?.message)
  }
}

/** 仅供自测：清空计数 */
export function resetProbeTracksForTest(): void {
  tracks.clear()
}
