/**
 * 边缘封禁：把确认恶意的 IP 推到 Cloudflare，整站（主站、渠道子域、所有接口）在 Cloudflare 边缘就拒绝
 * （2026-10-25 第三轮加固 · 站长要求「发现恶意 IP 直接封禁、不准访问网站的任何内容」，docs/安全-第三轮加固-1025.md 七）。
 *
 * 【为什么是 Cloudflare 不是阿里云安全组】网站流量走 Cloudflare 隧道：访客连的是 Cloudflare、服务器主动出站取请求，
 *   安全组只管直连服务器 IP 的流量（现在只开着 RDViewer 的 8443），在安全组里封访客 IP 对网站没有任何作用。
 *
 * 【什么时候升级到边缘封禁】只认高置信度的恶意行为，两层：
 *   · 快层（10 分钟，沿用站内现有的识别：lib/security/probe.ts、abuse.ts）一触发站内封禁，同时推到边缘：
 *       盲猜支付回调 3 次 / 回调签名错 5 次（**只封境外 IP**，见下）/ 越权取别人订单 5 张 / 普通用户试后台 5 个路径 /
 *       探测不存在的接口 10 个 / 扫描器路径（.env、.git、wp-login…）5 次（nginx 安全日志，见 scanSecurityLog）。
 *   · 慢层（24 小时累计，防「每 10 分钟只试两下」的慢速探测）：盲猜回调 10 次 / 不存在的接口 30 个 / 越权或试后台 10 次 /
 *       扫描器路径 10 次 / 被站内封过 2 次。
 *   · 惯犯：7 天内被边缘封过又再犯 → 封更久。
 *   普通的限流（输错密码、验证码发太快）不会升级到边缘。
 *
 * 【封多久】境外 IP：首次 24 小时、惯犯 7 天；国内 IP（CF-IPCountry=CN，运营商大量共用出口）：首次 2 小时、惯犯 24 小时。
 *   到期由定时任务自动解封（expireEdgeBans，挂在每分钟的 vmq-close 定时任务里、每 5 分钟真正跑一次）。
 *   时长可配：EDGE_BAN_HOURS / EDGE_BAN_CN_HOURS / EDGE_BAN_REPEAT_HOURS / EDGE_BAN_CN_REPEAT_HOURS。
 *
 * 【永不封】收款手机近 60 天用过的 IP（签名回调成功时记下，vmq_phone_ips）、管理员登录 / 使用后台的 IP、
 *   后台手动白名单（security_edge_whitelist）、内网与回环地址、Cloudflare 自己的地址段。
 *   回调签名错误只封境外 IP：收款手机都在国内，换了网络（新 IPv6 前缀还没记进白名单）又恰好配错时，不能被封在门外。
 *
 * 【实现】Cloudflare「IP 访问规则」（zone 级，mode=block，IPv6 按 /64）；每条规则的 id、到期时间、原因记在 settings 的
 *   edgeban:<IP 键> 行里（到期删规则后行保留 7 天用来认惯犯）。CF_API_TOKEN / CF_ZONE_ID 没配 = 整个功能关闭；
 *   EDGE_BAN=0 应急关闭（已有的封禁到期照常解除）。任何异常只记日志，绝不影响请求本身。
 */
import { promises as fs } from 'fs'
import path from 'path'
import { prisma } from '../db'
import { notify } from '../notify'
import { writeAudit } from '../audit'
import { rateLimited } from '../news/rate-limit'
import { ipKey } from '../ip-key'

// CF_API_BASE 只给自测指向本地假接口用（scripts/itest-edge-ban.ts）
const CF = process.env.CF_API_BASE || 'https://api.cloudflare.com/client/v4'
const KEY_PREFIX = 'edgeban:'
const PHONE_IPS_KEY = 'vmq_phone_ips'
export const EDGE_WHITELIST_KEY = 'security_edge_whitelist'
const ADMIN_IPS_KEY = 'security_admin_login_ips'
const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

export type EdgeSignal = 'PAY_CALLBACK' | 'API_404' | 'IDOR' | 'ADMIN_DENIED' | 'WEBHOOK_AUTH' | 'SCANNER' | 'APP_BAN'

export const EDGE_LABELS: Record<EdgeSignal, string> = {
  PAY_CALLBACK: '盲猜支付回调',
  API_404: '探测不存在的接口',
  IDOR: '越权访问别人的订单',
  ADMIN_DENIED: '普通用户试后台接口',
  WEBHOOK_AUTH: '支付回调签名 / 密钥错误',
  SCANNER: '扫描敏感文件路径（.env、.git、wp-login…）',
  APP_BAN: '一天内被站内封禁多次',
}

/** 慢层：24 小时累计阈值（distinct = 数不同路径） */
export const SLOW_RULES: Partial<Record<EdgeSignal, { max: number; distinct: boolean }>> = {
  PAY_CALLBACK: { max: 10, distinct: false },
  API_404: { max: 30, distinct: true },
  IDOR: { max: 10, distinct: true },
  ADMIN_DENIED: { max: 10, distinct: true },
  SCANNER: { max: 10, distinct: false },
  APP_BAN: { max: 2, distinct: false },
}

function envHours(name: string, def: number): number {
  const n = Number(process.env[name])
  return Number.isFinite(n) && n > 0 && n <= 24 * 90 ? n : def
}

export function edgeBanEnabled(): boolean {
  return !!(process.env.CF_API_TOKEN && process.env.CF_ZONE_ID) && process.env.EDGE_BAN !== '0'
}

/** 封多久（毫秒） */
export function edgeBanDuration(country: string | null | undefined, repeat: boolean): number {
  const cn = (country || '').toUpperCase() === 'CN'
  if (cn) return (repeat ? envHours('EDGE_BAN_CN_REPEAT_HOURS', 24) : envHours('EDGE_BAN_CN_HOURS', 2)) * HOUR
  return (repeat ? envHours('EDGE_BAN_REPEAT_HOURS', 24 * 7) : envHours('EDGE_BAN_HOURS', 24)) * HOUR
}

// ---------------------------------------------------------------------------------------------
// 永不封的地址
// ---------------------------------------------------------------------------------------------

const CF_V4 = [
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18', '108.162.192.0/18',
  '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
  '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
]
const PRIVATE_V4 = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '127.0.0.0/8', '169.254.0.0/16', '100.64.0.0/10', '0.0.0.0/8']

function v4num(ip: string): number | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip)
  if (!m) return null
  const p = m.slice(1).map(Number)
  if (p.some((x) => x > 255)) return null
  return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0
}
function inV4(ip: string, cidr: string): boolean {
  const [base, bits] = cidr.split('/')
  const a = v4num(ip)
  const b = v4num(base)
  if (a === null || b === null) return false
  const n = Number(bits)
  const mask = n === 0 ? 0 : (0xffffffff << (32 - n)) >>> 0
  return ((a & mask) >>> 0) === ((b & mask) >>> 0)
}

/** 内网、回环、Cloudflare 自己的地址：一律不封（key 是 ipKey 的结果：IPv4 原样、IPv6 是 /64 前缀） */
export function neverBanAddress(key: string): boolean {
  if (!key) return true
  if (!key.includes(':')) return CF_V4.concat(PRIVATE_V4).some((c) => inV4(key, c))
  const g = key.toLowerCase().split(':')
  const g0 = parseInt(g[0] || '0', 16)
  const g1 = parseInt(g[1] || '0', 16)
  if (key === '::/64' || key.startsWith('::')) return true // ::1 等
  if ((g0 & 0xfe00) === 0xfc00) return true // fc00::/7
  if ((g0 & 0xffc0) === 0xfe80) return true // fe80::/10
  if (g0 === 0x2a06 && (g1 & 0xfff8) === 0x98c0) return true // 2a06:98c0::/29
  return [0x2400cb00, 0x26064700, 0x2803f800, 0x2405b500, 0x24058100, 0x2c0ff248].includes(((g0 << 16) | g1) >>> 0)
}

let wlCache: { at: number; keys: Set<string> } | null = null
async function whitelist(): Promise<Set<string>> {
  if (wlCache && Date.now() - wlCache.at < 2 * MIN) return wlCache.keys
  const rows = await prisma.setting.findMany({ where: { key: { in: [PHONE_IPS_KEY, ADMIN_IPS_KEY, EDGE_WHITELIST_KEY] } }, select: { key: true, value: true } })
  const keys = new Set<string>()
  for (const r of rows) {
    if (r.key === EDGE_WHITELIST_KEY) {
      for (const line of r.value.split(/[\s,，;；]+/)) if (line.trim()) keys.add(ipKey(line.trim().replace(/\/64$/, '').replace(/::$/, '::1')))
      continue
    }
    try {
      const v = JSON.parse(r.value)
      if (Array.isArray(v)) for (const x of v) {
        const ip = typeof x === 'string' ? x : x && typeof x.ip === 'string' ? x.ip : null
        if (ip) keys.add(ip.includes('/') ? ip : ipKey(ip))
      }
    } catch {
      /* 坏数据跳过 */
    }
  }
  wlCache = { at: Date.now(), keys }
  return keys
}
export function resetEdgeWhitelistCache(): void {
  wlCache = null
}

/**
 * 收款手机签名回调成功时调用（api/pay/sms-notify）：记下这个 IP，60 天内永不边缘封禁。同一 IP 10 分钟最多写一次库。
 */
export function notePhoneIp(ip: string | null): void {
  if (!ip || ip === 'unknown') return
  const key = ipKey(ip)
  if (rateLimited(`edge-phone:${key}`, { windowMs: 10 * MIN, max: 1 })) return
  void (async () => {
    const row = await prisma.setting.findUnique({ where: { key: PHONE_IPS_KEY }, select: { value: true } })
    let list: { ip: string; at: number }[] = []
    try {
      const v = JSON.parse(row?.value || '[]')
      if (Array.isArray(v)) list = v.filter((x) => x && typeof x.ip === 'string' && typeof x.at === 'number')
    } catch {
      list = []
    }
    const now = Date.now()
    list = [{ ip: key, at: now }, ...list.filter((x) => x.ip !== key && now - x.at < 60 * DAY)].slice(0, 30)
    await prisma.setting.upsert({ where: { key: PHONE_IPS_KEY }, create: { key: PHONE_IPS_KEY, value: JSON.stringify(list) }, update: { value: JSON.stringify(list) } })
    wlCache = null
  })().catch((e) => console.error('[edge-ban] 记录收款手机 IP 失败', (e as Error)?.message))
}

// ---------------------------------------------------------------------------------------------
// Cloudflare
// ---------------------------------------------------------------------------------------------

async function cf(method: string, p: string, body?: unknown): Promise<{ ok: boolean; status: number; result: any; errors: string }> {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), 10_000)
  try {
    const r = await fetch(`${CF}${p}`, {
      method,
      headers: { Authorization: `Bearer ${process.env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ac.signal,
    })
    const j: any = await r.json().catch(() => ({}))
    return { ok: !!j.success, status: r.status, result: j.result, errors: (j.errors || []).map((e: any) => `${e.code} ${e.message}`).join('; ') }
  } finally {
    clearTimeout(t)
  }
}

function cfTarget(key: string): { target: 'ip' | 'ip_range'; value: string } {
  return key.endsWith('/64') ? { target: 'ip_range', value: key } : { target: 'ip', value: key }
}

async function cfCreate(key: string, note: string): Promise<string | null> {
  const r = await cf('POST', `/zones/${process.env.CF_ZONE_ID}/firewall/access_rules/rules`, { mode: 'block', configuration: cfTarget(key), notes: note.slice(0, 200) })
  if (r.ok && r.result?.id) return r.result.id
  // 已经有一条（手工封过 / 上次没记下）：查出来接管
  const q = await cf('GET', `/zones/${process.env.CF_ZONE_ID}/firewall/access_rules/rules?configuration.value=${encodeURIComponent(key)}&per_page=5`)
  const hit = Array.isArray(q.result) ? q.result.find((x: any) => x?.configuration?.value === key) : null
  if (hit?.id) return hit.id
  console.error('[edge-ban] Cloudflare 建封禁规则失败', key, r.status, r.errors)
  return null
}

async function cfDelete(ruleId: string): Promise<boolean> {
  const r = await cf('DELETE', `/zones/${process.env.CF_ZONE_ID}/firewall/access_rules/rules/${ruleId}`)
  // 404 = 规则已经不在了（站长在 Cloudflare 后台手工删过），也算解除
  if (!r.ok && r.status !== 404) console.error('[edge-ban] Cloudflare 删封禁规则失败', ruleId, r.status, r.errors)
  return r.ok || r.status === 404
}

// ---------------------------------------------------------------------------------------------
// 封禁 / 解封
// ---------------------------------------------------------------------------------------------

interface EdgeRow {
  ruleId: string | null
  until: number
  reason: string
  country: string | null
  count: number
  lastBanAt: number
}

async function readRow(key: string): Promise<EdgeRow | null> {
  const row = await prisma.setting.findUnique({ where: { key: KEY_PREFIX + key }, select: { value: true } })
  if (!row) return null
  try {
    return JSON.parse(row.value) as EdgeRow
  } catch {
    return null
  }
}

async function writeRow(key: string, v: EdgeRow): Promise<void> {
  const value = JSON.stringify(v)
  await prisma.setting.upsert({ where: { key: KEY_PREFIX + key }, create: { key: KEY_PREFIX + key, value }, update: { value } })
}

const inflight = new Set<string>()

/**
 * 把一个 IP（ipKey 形式）推到 Cloudflare 封禁。fire-and-forget 调用即可：绝不抛错。
 * 返回值只给自测用：'BANNED' | 'ACTIVE'（已在封）| 'SKIP_*'
 */
export async function edgeBan(
  rawOrKey: string | null,
  signal: EdgeSignal,
  detail: string,
  country?: string | null,
): Promise<string> {
  try {
    if (!rawOrKey || rawOrKey === 'unknown') return 'SKIP_NOIP'
    if (!edgeBanEnabled()) return 'SKIP_OFF'
    const key = rawOrKey.includes('/') ? rawOrKey : ipKey(rawOrKey)
    if (neverBanAddress(key)) return 'SKIP_RESERVED'
    const cn = (country || '').toUpperCase() === 'CN'
    // 回调签名错误只封境外：收款手机都在国内（见文件头）
    if (signal === 'WEBHOOK_AUTH' && (cn || !country)) return 'SKIP_CN_WEBHOOK'
    if ((await whitelist()).has(key)) return 'SKIP_WHITELIST'
    if (inflight.has(key)) return 'ACTIVE'
    inflight.add(key)
    try {
      const now = Date.now()
      const prev = await readRow(key)
      if (prev?.ruleId && prev.until > now) return 'ACTIVE'
      const repeat = !!prev && now - prev.lastBanAt < 7 * DAY
      const ms = edgeBanDuration(country, repeat)
      const until = now + ms
      const reason = `${EDGE_LABELS[signal]}${repeat ? '（7 天内再犯）' : ''}：${detail}`.slice(0, 180)
      const ruleId = await cfCreate(key, `bigolab 自动封禁 至 ${new Date(until).toISOString().slice(0, 16)}Z · ${reason}`)
      if (!ruleId) return 'SKIP_CF_ERROR'
      await writeRow(key, { ruleId, until, reason, country: country || null, count: (prev?.count ?? 0) + 1, lastBanAt: now })
      void writeAudit(null, {
        actorKind: 'SYSTEM',
        action: 'sec.edgeban',
        targetType: 'ip',
        targetId: key.slice(0, 40),
        reasonCode: signal.slice(0, 24),
        reason: `${reason}；${Math.round(ms / HOUR)} 小时`.slice(0, 255),
      }).catch(() => {})
      if (!rateLimited('edge-alert-all', { windowMs: HOUR, max: 20 })) {
        notify(
          'security.alert',
          [
            { label: '类型', value: '⛔ 已在 Cloudflare 边缘封禁（整站不可访问）' },
            { label: 'IP', value: `${key}${country ? `（${country}）` : ''}` },
            { label: '原因', value: reason },
            { label: '时长', value: `${Math.round(ms / HOUR)} 小时，到期自动解封` },
            { label: '误封', value: '后台「设置 → 安全」里可一键解封、加白名单' },
          ],
          { link: '/admin/settings', linkText: '后台查看 / 解封' },
        )
      }
      console.warn('[edge-ban] 已封禁', key, country || '-', signal, `${Math.round(ms / HOUR)}h`)
      return 'BANNED'
    } finally {
      inflight.delete(key)
    }
  } catch (e) {
    console.error('[edge-ban] 封禁失败', (e as Error)?.message)
    return 'SKIP_ERROR'
  }
}

/** 后台手动解封（也用于到期解封） */
export async function edgeUnban(key: string, why: string): Promise<boolean> {
  const row = await readRow(key)
  if (!row?.ruleId) return false
  if (edgeBanEnabled() || process.env.CF_API_TOKEN) {
    if (!(await cfDelete(row.ruleId))) return false
  }
  await writeRow(key, { ...row, ruleId: null, until: Date.now() })
  void writeAudit(null, { actorKind: why === 'expired' ? 'SYSTEM' : 'PLATFORM', action: 'sec.edgeunban', targetType: 'ip', targetId: key.slice(0, 40), reason: why.slice(0, 255) }).catch(() => {})
  return true
}

/** 当前在封的（后台展示） */
export async function listEdgeBans(): Promise<{ key: string; until: number; reason: string; country: string | null; count: number }[]> {
  const rows = await prisma.setting.findMany({ where: { key: { startsWith: KEY_PREFIX } }, select: { key: true, value: true } })
  const now = Date.now()
  const out: { key: string; until: number; reason: string; country: string | null; count: number }[] = []
  for (const r of rows) {
    try {
      const v = JSON.parse(r.value) as EdgeRow
      if (v.ruleId && v.until > now) out.push({ key: r.key.slice(KEY_PREFIX.length), until: v.until, reason: v.reason, country: v.country, count: v.count })
    } catch {
      /* 跳过 */
    }
  }
  return out.sort((a, b) => b.until - a.until)
}

let lastExpireAt = 0
/** 到期解封 + 清理 7 天前的历史行。挂在每分钟的定时任务里，进程内每 5 分钟真正跑一次 */
export async function expireEdgeBans(force = false): Promise<{ released: number; scanned: number }> {
  if (!force && Date.now() - lastExpireAt < 5 * MIN) return { released: 0, scanned: 0 }
  lastExpireAt = Date.now()
  let released = 0
  let scanned = 0
  try {
    const rows = await prisma.setting.findMany({ where: { key: { startsWith: KEY_PREFIX } }, select: { key: true, value: true } })
    const now = Date.now()
    for (const r of rows) {
      let v: EdgeRow
      try {
        v = JSON.parse(r.value)
      } catch {
        continue
      }
      const key = r.key.slice(KEY_PREFIX.length)
      if (v.ruleId && v.until <= now) {
        if (await edgeUnban(key, 'expired')) released++
      } else if (!v.ruleId && now - v.lastBanAt > 7 * DAY) {
        await prisma.setting.deleteMany({ where: { key: r.key } })
      }
    }
    scanned = await scanSecurityLog()
  } catch (e) {
    console.error('[edge-ban] 到期解封失败', (e as Error)?.message)
  }
  return { released, scanned }
}

// ---------------------------------------------------------------------------------------------
// 慢层（24 小时累计）
// ---------------------------------------------------------------------------------------------

interface SlowTrack {
  first: number
  hits: number
  paths: Set<string>
  acted: boolean
}
const slow = new Map<string, SlowTrack>()
const SLOW_MAX = 20000

/** 记一次信号（站内识别到、且算数的请求）；24 小时累计到阈值就边缘封禁 */
export function noteEdgeSignal(rawOrKey: string | null, signal: EdgeSignal, pathOrDetail: string, country?: string | null): void {
  try {
    const rule = SLOW_RULES[signal]
    if (!rule || !rawOrKey || rawOrKey === 'unknown') return
    const key = rawOrKey.includes('/') ? rawOrKey : ipKey(rawOrKey)
    const k = `${signal}|${key}`
    const now = Date.now()
    let t = slow.get(k)
    if (t && now - t.first >= DAY) t = undefined
    if (!t) {
      while (slow.size >= SLOW_MAX) {
        const o = slow.keys().next()
        if (o.done) break
        slow.delete(o.value)
      }
      t = { first: now, hits: 0, paths: new Set(), acted: false }
    } else {
      slow.delete(k)
    }
    t.hits++
    if (t.paths.size < 60) t.paths.add(pathOrDetail.slice(0, 80))
    slow.set(k, t)
    const score = rule.distinct ? t.paths.size : t.hits
    if (t.acted || score < rule.max) return
    t.acted = true
    void edgeBan(key, signal, `24 小时内累计 ${score} ${rule.distinct ? '个不同路径' : '次'}（${Array.from(t.paths).slice(0, 3).join('  ')}）`, country)
  } catch (e) {
    console.error('[edge-ban] 慢层计数失败', (e as Error)?.message)
  }
}

export function resetEdgeForTest(): void {
  slow.clear()
  wlCache = null
  scanState = null
}

// ---------------------------------------------------------------------------------------------
// 扫描器路径：读 nginx 安全日志（nginx 直接 404、不进应用，所以要从日志里数）
// ---------------------------------------------------------------------------------------------

// 与 nginx.conf 的 $scan_path 同一口径（只看非 /api 路径）
export const SCANNER_PATH_RE = [
  /^\/(?!api\/).*\.(php\d?|phtml|asp|aspx|jsp|jspx|cgi|pl|env|ini|sql|bak|old|swp|sh|ya?ml|git|svn)$/i,
  /^\/\.(env|git|svn|hg|aws|ssh|docker|vscode|idea|ds_store|htaccess|htpasswd|npmrc|config)(\/|$|\.)/i,
  /^\/(wp-admin|wp-login|wp-content|wp-includes|wordpress|xmlrpc|phpmyadmin|pma|myadmin|cgi-bin|actuator|vendor\/phpunit|server-status|boaform|hnap1|owa|solr|manager\/html|jenkins|druid|nacos|geoserver|telescope|_ignition)(\/|$|\.)/i,
]
export function isScannerPath(p: string): boolean {
  const pathOnly = p.split('?')[0]
  return SCANNER_PATH_RE.some((re) => re.test(pathOnly))
}

const LOG_DIR = process.env.NGINX_SEC_LOG_DIR || '/app/nginx-sec'
let scanState: { file: string; offset: number } | null = null
const fastScan = new Map<string, { first: number; hits: number; acted: boolean }>()

/** 一行安全日志：`<iso时间> <ip> <状态> <方法> "<路径>" ... country="XX" ...` */
export function parseSecLine(line: string): { ip: string; status: number; path: string; country: string | null } | null {
  const m = /^\S+ (\S+) (\d{3}) [A-Z]+ "([^"]*)"/.exec(line)
  if (!m) return null
  const c = /country="([A-Z0-9-]{2,3})"/.exec(line)
  return { ip: m[1], status: Number(m[2]), path: m[3], country: c ? c[1] : null }
}

/** 处理一行（自测也用）：扫描器路径 → 快层 10 分钟 5 次 / 慢层 24 小时 10 次 */
export function noteSecLine(line: string): void {
  const e = parseSecLine(line)
  if (!e || !isScannerPath(e.path)) return
  const key = ipKey(e.ip)
  const now = Date.now()
  let t = fastScan.get(key)
  if (t && now - t.first >= 10 * MIN) t = undefined
  if (!t) {
    if (fastScan.size > 5000) fastScan.clear()
    t = { first: now, hits: 0, acted: false }
  }
  t.hits++
  fastScan.set(key, t)
  if (!t.acted && t.hits >= 5) {
    t.acted = true
    void edgeBan(key, 'SCANNER', `10 分钟内 ${t.hits} 次（${e.path.slice(0, 60)}）`, e.country)
  }
  noteEdgeSignal(key, 'SCANNER', e.path, e.country)
}

/** 从上次读到的位置接着读当天的安全日志（文件名按 UTC 日期，与 nginx 的 $time_iso8601 一致） */
async function scanSecurityLog(): Promise<number> {
  if (!edgeBanEnabled()) return 0
  const file = path.join(LOG_DIR, `security-${new Date().toISOString().slice(0, 10)}.log`)
  let size: number
  try {
    size = (await fs.stat(file)).size
  } catch {
    return 0 // 没挂载 / 当天还没有日志
  }
  // 进程刚启动：从文件末尾开始（不回头补算，计数窗口按「现在」算，补算会把几小时前的零散命中挤进 10 分钟）；
  // 换了一天的新文件 / 文件被截断：从头读
  if (!scanState) scanState = { file, offset: size }
  else if (scanState.file !== file || size < scanState.offset) scanState = { file, offset: 0 }
  if (size <= scanState.offset) return 0
  const len = Math.min(size - scanState.offset, 4 * 1024 * 1024)
  const fh = await fs.open(file, 'r')
  try {
    const buf = Buffer.alloc(len)
    await fh.read(buf, 0, len, scanState.offset)
    const text = buf.toString('utf8')
    const lastNl = text.lastIndexOf('\n')
    if (lastNl < 0) return 0
    scanState.offset += Buffer.byteLength(text.slice(0, lastNl + 1), 'utf8')
    let n = 0
    for (const line of text.slice(0, lastNl).split('\n')) {
      noteSecLine(line)
      n++
    }
    return n
  } finally {
    await fh.close()
  }
}
