/**
 * 渠道自定义域名的连通校验（docs/多渠道分销-自定义域名.md 第 9 节）：证明「https://<自定义域名>/ 此刻确实接到本站、而且是这个渠道」。
 *
 * 【威胁】自定义域名的注册商账号在客户手里（接入教程写明域名仍在客户自己的西部数码账号里）。客户让域名过期、把 DNS 服务器改回去、
 * 或者指到自己的服务器，平台这边没有任何感知；而主域名（Tenant.origin）决定了交易邮件、收据 / 邀请 / 开票这些带令牌的链接、
 * 收银台回跳与旧域名页面的跳转目标。买家账号两站通用，假登录页收走的密码在 bigolab.com 上也能用。
 * 改造前渠道 Host 全是站长 DNS 下的 *.bigolab.com，渠道方不可能在店铺的正式地址上放自己的页面；自定义域名打破了这一点，
 * 所以要把「域名还在我们手里」变成一个持续被验证的事实：
 *  · 设为主域名之前当场校验（admin-tenants.setPrimaryDomain 调 verifyCustomDomain，不通过 400、什么都不改）；
 *  · cron 每 10 分钟复验一次（runDomainHealthCheck，/api/cron/tenant-domains），结果写进 settings（口径见 storefront/domain-health.ts）；
 *  · 连续两趟失败（或 40 分钟没有成功记录）→ 店面解析自动改用子域名：邮件与链接走子域名、旧子域名不再跳走；
 *    同时推平台企业微信告警 + 给渠道一条站内通知；连续两趟成功后自动切回并再推一条（站长群告警各自 6 小时最多一次；
 *    渠道通知不节流、只在状态与渠道上次听到的不一致时发，保证渠道最新一条通知永远是真实状态，见 domain-health.ts 文件头）。
 *
 * 【防什么、防不住什么】这套校验防的是**意外失联**：域名过期、客户改了 NS、解析被指到别处——这些都会让签名对不上或连不上。
 * 它**防不住有意作恶的 DNS 控制者**：域名的 DNS 在客户手里，客户可以在自己的 Cloudflare 边缘按路径 / 来源选择性转发
 * （/api/domain-check 原样转给本站，其余页面给自己的服务器），HTTP 层面无法区分。后者靠合作约定（接入教程第 9.5 节那条）
 * 与站长随时可以把主域名设回子域名、停用该域名兜底。
 *
 * 【怎么证明】平台生成随机 nonce，走公网请求 https://<host>/api/domain-check?n=<nonce>（与买家同一条路：公网 DNS → Cloudflare →
 * 隧道 → nginx 容器 80 口 → 应用；nginx 的公网 IP 直连入口 8080 对这个路径一律 404，见 nginx.conf），
 * 应答里的 proof 必须等于 HMAC(domain-verify 密钥, host | 渠道代号 | nonce)。
 *  · 密钥从 JWT_SECRET 派生（tenant/crypto 用途 domain-verify），外人算不出来：自己搭的服务器拿不出正确的 proof；
 *  · proof 绑定 host 与渠道代号：把请求转给我们、却换成别的 Host（比如 lulu.bigolab.com），算出来的 proof 对不上；
 *  · 原样反代到我们（Host 不变）能通过——那等于流量仍然由本站处理，属于接受的残余风险（写在契约第 9 节）。
 * 响应只有 proof，不回渠道代号、状态或任何配置。
 *
 * 【探测本身不能成为攻击面】（2026-10-01 加固）请求目标由客户控制的 DNS 决定，所以把对方当成恶意服务器：
 *  · 先解析域名（dns.lookup all），任一地址是私网 / 回环 / 链路本地 / CGNAT / 保留段（IPv4 与 IPv6）→ 判失败、**不发请求**
 *    （否则客户把域名解析到 10.x / 127.0.0.1，就能让本站进程去敲容器网络里的内部服务）；连接时只用这次检查过的地址
 *    （自带 lookup，不再二次解析），杜绝「检查时是公网、连接时换成内网」的 DNS rebinding；
 *  · 用 node:https 而不是 fetch：fetch 会按 Content-Encoding 自动解压 br / gzip，对方回一个几 KB 的解压炸弹就能把
 *    主站进程（mem_limit 1024m）撑爆。这里请求头声明 accept-encoding: identity，响应带非 identity 的 content-encoding
 *    → 判失败；content-type 必须是 application/json；content-length > 4096 → 判失败；body 流式读取，累计超过 4096 字节
 *    立即断开判失败；全程（解析 + 连接 + TLS + 读 body）8 秒总超时，慢速滴灌同样判失败。node:https 本身从不解压。
 *
 * 【不做什么】不跟随跳转（3xx 算失败）；不把对方响应体回显给任何人。失败原因分两层：归类原因（解析不到 / 指向了非公网地址 /
 * 连接失败 / 证书错误 / 返回内容不符，外加本站自己算不出期望值时的「本站校验出错」）进渠道站内通知与站长群告警；
 * 技术细节（HTTP 状态码、错误码）只给超管看。
 */
import { createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { lookup as dnsLookup } from 'dns'
import { request as httpRequest, type IncomingMessage } from 'http'
import { request as httpsRequest } from 'https'
import { isIP, type LookupFunction } from 'net'
import { prisma } from '../db'
import { channelHostSuffix, normalizeHost } from '../storefront/hosts'
import { invalidateStorefrontCache } from '../storefront/resolve'
import {
  domainHealthKey,
  isDomainHealthy,
  manualVerifiedHealth,
  nextDomainHealth,
  parseDomainHealth,
  serializeDomainHealth,
  type DomainHealth,
  type DomainHealthEvent,
  type DomainTenantNotice,
} from '../storefront/domain-health'
import { deriveKey } from './crypto'
import { emitTenantNotice } from './notice'
import { alertPlatform } from './platform-alert'

export const DOMAIN_CHECK_PATH = '/api/domain-check'
/** nonce 形状：base64url，16–64 字符（平台生成的是 24 字符） */
export const DOMAIN_CHECK_NONCE_RE = /^[A-Za-z0-9_-]{16,64}$/

const PROBE_TIMEOUT_MS = 8_000
const PROBE_RETRY_GAP_MS = 3_000
/** 应答体上限（字节）。真应答不到 100 字节，4 KB 足够宽裕 */
export const PROBE_MAX_BODY_BYTES = 4_096

/** 应答签名。host 必须是规范化主机名；code 是渠道代号 */
export function domainProof(host: string, code: string, nonce: string): string {
  return createHmac('sha256', deriveKey('domain-verify')).update(`v1|${host}|${code}|${nonce}`, 'utf8').digest('base64url')
}

// ---------------------------------------------------------------------------
// 失败归类：渠道与告警群只看类别，超管额外看细节
// ---------------------------------------------------------------------------
export type ProbeFailCategory = 'dns' | 'private' | 'connect' | 'tls' | 'content' | 'local'
export const PROBE_FAIL_LABEL: Readonly<Record<ProbeFailCategory, string>> = {
  dns: '解析不到',
  private: '指向了非公网地址',
  connect: '连接失败',
  tls: '证书错误',
  content: '返回内容不符',
  // 本站自己的问题（例如 JWT_SECRET 缺失算不出期望值）：fail closed 判失败，但不冤枉客户的域名。
  // 能走到这一类，靠 probeOnce 在发请求**之前**先算期望值（缺密钥时应答端也回 503，先发请求就会被记成「返回内容不符」）
  local: '本站校验出错',
}

/** 探测过程中的归类错误：category 决定对外口径，detail 只给超管 */
export class ProbeError extends Error {
  constructor(
    readonly category: ProbeFailCategory,
    readonly detail: string,
  ) {
    super(`${PROBE_FAIL_LABEL[category]}（${detail}）`)
    this.name = 'ProbeError'
  }
}

const DNS_CODES = new Set(['ENOTFOUND', 'EAI_AGAIN', 'EAI_NODATA', 'EAI_NONAME', 'ENODATA', 'ESERVFAIL', 'ENONAME'])

/** 任意错误 → 类别 + 细节（细节只截错误码，不带对方返回的任何内容） */
export function classifyProbeError(e: unknown): { category: ProbeFailCategory; detail: string } {
  if (e instanceof ProbeError) return { category: e.category, detail: e.detail }
  const err = e as { name?: string; code?: string; cause?: { code?: string } }
  if (err?.name === 'TimeoutError' || err?.name === 'AbortError') return { category: 'connect', detail: '超时' }
  const code = String(err?.cause?.code || err?.code || err?.name || 'unknown').slice(0, 40)
  if (DNS_CODES.has(code)) return { category: 'dns', detail: code }
  if (/CERT|TLS|SSL|EPROTO/i.test(code)) return { category: 'tls', detail: code }
  return { category: 'connect', detail: code }
}

// ---------------------------------------------------------------------------
// 地址判定：只有公网单播地址才允许连接
// ---------------------------------------------------------------------------
function v4ToInt(ip: string): number | null {
  const p = ip.split('.')
  if (p.length !== 4) return null
  let n = 0
  for (const s of p) {
    if (!/^\d{1,3}$/.test(s)) return null
    const v = Number(s)
    if (v > 255) return null
    n = n * 256 + v
  }
  return n
}
const V4_BLOCKED: [string, number][] = [
  ['0.0.0.0', 8], // 本网络
  ['10.0.0.0', 8], // 私网
  ['100.64.0.0', 10], // CGNAT
  ['127.0.0.0', 8], // 回环
  ['169.254.0.0', 16], // 链路本地（含云厂商元数据 169.254.169.254）
  ['172.16.0.0', 12], // 私网（docker 默认网段在这里）
  ['192.0.0.0', 24], // IETF 协议分配
  ['192.0.2.0', 24], // 文档 TEST-NET-1
  ['192.88.99.0', 24], // 6to4 中继（已废弃）
  ['192.168.0.0', 16], // 私网
  ['198.18.0.0', 15], // 基准测试
  ['198.51.100.0', 24], // 文档 TEST-NET-2
  ['203.0.113.0', 24], // 文档 TEST-NET-3
  ['224.0.0.0', 4], // 组播
  ['240.0.0.0', 4], // 保留 + 广播
]
const V4_BLOCKED_INT = V4_BLOCKED.map(([base, bits]) => {
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0
  return { net: (v4ToInt(base)! & mask) >>> 0, mask }
})
function isPublicV4(ip: string): boolean {
  const n = v4ToInt(ip)
  if (n === null) return false
  return !V4_BLOCKED_INT.some(({ net, mask }) => ((n & mask) >>> 0) === net)
}

/** IPv6 → 8 个 16 位段（支持 :: 缩写、末尾内嵌 IPv4、%zone）；不合法返回 null */
function v6Groups(ip: string): number[] | null {
  let s = ip.split('%')[0].toLowerCase()
  let tail: number[] = []
  const m = /^(.*:)(\d{1,3}(?:\.\d{1,3}){3})$/.exec(s)
  if (m) {
    const n = v4ToInt(m[2])
    if (n === null) return null
    tail = [(n >>> 16) & 0xffff, n & 0xffff]
    s = m[1].endsWith('::') ? m[1] : m[1].slice(0, -1)
  }
  const halves = s.split('::')
  if (halves.length > 2) return null
  const parse = (part: string) => (part ? part.split(':') : []).map((x) => (/^[0-9a-f]{1,4}$/.test(x) ? parseInt(x, 16) : NaN))
  const head = parse(halves[0])
  const rest = halves.length === 2 ? parse(halves[1]) : []
  if ([...head, ...rest].some((x) => Number.isNaN(x))) return null
  const known = head.length + rest.length + tail.length
  if (halves.length === 1) return known === 8 ? [...head, ...tail] : null
  if (known > 7) return null
  return [...head, ...new Array(8 - known).fill(0), ...rest, ...tail]
}
function isPublicV6(ip: string): boolean {
  const g = v6Groups(ip)
  if (!g) return false
  // 内嵌 IPv4 的几种形式按内嵌地址判：::ffff:a.b.c.d（映射）、64:ff9b::/96（NAT64 知名前缀）、::a.b.c.d（兼容，已废弃）
  const embedded = () => `${g[6] >>> 8}.${g[6] & 255}.${g[7] >>> 8}.${g[7] & 255}`
  if (g.slice(0, 5).every((x) => x === 0) && (g[5] === 0xffff || g[5] === 0)) {
    if (g[5] === 0 && g[6] === 0 && (g[7] === 0 || g[7] === 1)) return false // :: 与 ::1
    return isPublicV4(embedded())
  }
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) return isPublicV4(embedded())
  // 只有全球单播 2000::/3 才可能是公网
  if ((g[0] & 0xe000) !== 0x2000) return false // 挡掉 fc00::/7（ULA）、fe80::/10（链路本地）、fec0::/10、ff00::/8（组播）、100::/64、64:ff9b:1::/48 等
  if (g[0] === 0x2001 && g[1] < 0x200) return false // 2001::/23 IETF 协议分配（含 Teredo 2001::/32）
  if (g[0] === 0x2001 && g[1] === 0x0db8) return false // 2001:db8::/32 文档
  if (g[0] === 0x2002) return isPublicV4(`${g[1] >>> 8}.${g[1] & 255}.${g[2] >>> 8}.${g[2] & 255}`) // 6to4：按内嵌 IPv4 判
  if (g[0] === 0x3fff && g[1] < 0x1000) return false // 3fff::/20 文档（RFC 9637）
  return true
}

/** 是否公网单播地址（IPv4 / IPv6）。不是合法 IP 字面量一律 false */
export function isPublicAddress(ip: string): boolean {
  const v = isIP(ip.split('%')[0])
  if (v === 4) return isPublicV4(ip)
  if (v === 6) return isPublicV6(ip)
  return false
}

// ---------------------------------------------------------------------------
// 传输层：生产走公网 HTTPS（probeViaNetwork）；itest 注入进程内桩（直接调 /api/domain-check 的 route handler），签名核对不替换
// ---------------------------------------------------------------------------
export type ProbeTransport = (host: string, pathAndQuery: string) => Promise<{ status: number; body: string }>
type Addr = { address: string; family: number }

export interface NetworkProbeOptions {
  /** 默认 https / 443；单测用本地 http 桩 */
  protocol?: 'https' | 'http'
  port?: number
  /** 总超时（解析 + 连接 + TLS + 读 body），默认 8 秒 */
  timeoutMs?: number
  /** 解析函数，默认 dns.lookup(all)；单测注入 */
  resolveAll?: (host: string) => Promise<Addr[]>
  /** 地址是否允许连接，默认 isPublicAddress；单测连本地桩时放宽 */
  isAllowedAddress?: (ip: string) => boolean
}

const defaultResolveAll = (host: string): Promise<Addr[]> =>
  new Promise((res, rej) => dnsLookup(host, { all: true, verbatim: true }, (err, addrs) => (err ? rej(err) : res(addrs as Addr[]))))

function checkResponseHeaders(res: IncomingMessage): void {
  // 声明了 identity 仍返回压缩体：不解压、不读，直接判失败（node:http 本来也不会自动解压，这里明确拒绝）
  const ce = String(res.headers['content-encoding'] ?? '').trim().toLowerCase()
  if (ce && ce !== 'identity') throw new ProbeError('content', `content-encoding: ${ce.slice(0, 20)}`)
  const ct = String(res.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase()
  if (ct !== 'application/json') throw new ProbeError('content', `content-type: ${ct.slice(0, 40) || '无'}`)
  const cl = res.headers['content-length']
  if (cl !== undefined && (!/^\d+$/.test(String(cl)) || Number(cl) > PROBE_MAX_BODY_BYTES)) throw new ProbeError('content', `content-length: ${String(cl).slice(0, 20)}`)
}

/**
 * 真正走网络的一次请求。非 200 → { status, body: '' }（不读 body）；200 → 头部检查通过后流式读 ≤ 4096 字节。
 * 所有失败都抛 ProbeError（已归类）。永不跟随跳转、永不解压。
 */
export function probeViaNetwork(host: string, pathAndQuery: string, opts: NetworkProbeOptions = {}): Promise<{ status: number; body: string }> {
  const protocol = opts.protocol ?? 'https'
  const port = opts.port ?? (protocol === 'https' ? 443 : 80)
  const timeoutMs = opts.timeoutMs ?? PROBE_TIMEOUT_MS
  const resolveAll = opts.resolveAll ?? defaultResolveAll
  const allowed = opts.isAllowedAddress ?? isPublicAddress

  return new Promise((resolve, reject) => {
    let settled = false
    let req: ReturnType<typeof httpsRequest> | null = null
    const finish = (err: unknown, val?: { status: number; body: string }) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (req) req.destroy()
      if (!err) return resolve(val!)
      const c = classifyProbeError(err)
      reject(err instanceof ProbeError ? err : new ProbeError(c.category, c.detail))
    }
    const timer = setTimeout(() => finish(new ProbeError('connect', '超时')), timeoutMs)

    resolveAll(host)
      .then((addrs) => {
        if (settled) return
        if (!addrs.length) throw new ProbeError('dns', '没有地址')
        const bad = addrs.find((a) => !allowed(a.address))
        if (bad) throw new ProbeError('private', bad.address.slice(0, 45))
        // IPv4 优先（容器网络未必有 IPv6 出口）；连接只用这批检查过的地址，不再二次解析
        const list = [...addrs].sort((a, b) => a.family - b.family)
        const pinned = ((_h: string, o: unknown, cb: (...a: unknown[]) => void) => {
          const oo = (typeof o === 'object' && o ? o : {}) as { all?: boolean; family?: number | string }
          const fam = oo.family === 4 || oo.family === 'IPv4' ? 4 : oo.family === 6 || oo.family === 'IPv6' ? 6 : 0
          const pick = fam ? list.filter((a) => a.family === fam) : list
          if (!pick.length) return cb(Object.assign(new Error('没有该族地址'), { code: 'ENOTFOUND' }), '', 4)
          if (oo.all) cb(null, pick)
          else cb(null, pick[0].address, pick[0].family)
        }) as unknown as LookupFunction
        const make = protocol === 'https' ? httpsRequest : httpRequest
        req = make({
          host,
          port,
          path: pathAndQuery,
          method: 'GET',
          lookup: pinned,
          agent: false, // 不复用连接：每次都经上面的地址检查
          ...(protocol === 'https' ? { servername: host } : {}),
          headers: {
            host: port === (protocol === 'https' ? 443 : 80) ? host : `${host}:${port}`,
            accept: 'application/json',
            'accept-encoding': 'identity',
            'user-agent': 'bigolab-domain-check/1',
            connection: 'close',
          },
        })
        req.on('error', (e) => finish(e))
        req.on('response', (res) => {
          const status = res.statusCode || 0
          if (status !== 200) return finish(null, { status, body: '' })
          try {
            checkResponseHeaders(res)
          } catch (e) {
            return finish(e)
          }
          const chunks: Buffer[] = []
          let total = 0
          res.on('data', (c: Buffer) => {
            total += c.length
            if (total > PROBE_MAX_BODY_BYTES) return finish(new ProbeError('content', `body > ${PROBE_MAX_BODY_BYTES} 字节`))
            chunks.push(c)
          })
          res.on('end', () => finish(null, { status, body: Buffer.concat(chunks).toString('utf8') }))
          // 对方中途断开（没有正常结束）：按连接失败处理；正常结束时 'end' 先到，finish 已置 settled，这里不再生效
          res.on('close', () => finish(new ProbeError('connect', '连接中断')))
          res.on('error', (e) => finish(e))
        })
        req.end()
      })
      .catch((e) => finish(e))
  })
}

const networkTransport: ProbeTransport = (host, pathAndQuery) => probeViaNetwork(host, pathAndQuery)
let transport: ProbeTransport = networkTransport

/** 仅供 scripts/itest-tenant 使用：替换传输层（传 null 恢复公网 HTTPS） */
export function setDomainProbeTransportForTest(t: ProbeTransport | null): void {
  transport = t ?? networkTransport
}

export type VerifyResult = { ok: true } | { ok: false; category: ProbeFailCategory; reason: string; detail: string }

const fail = (category: ProbeFailCategory, detail: string): VerifyResult => ({ ok: false, category, reason: PROBE_FAIL_LABEL[category], detail })

async function probeOnce(host: string, code: string): Promise<VerifyResult> {
  const nonce = randomBytes(18).toString('base64url')
  // 期望值必须在发请求**之前**算：本站算不出（JWT_SECRET 缺失，deriveKey 抛）时，应答端与 middleware 同样因为缺密钥回 503，
  // 先发请求就会落到下面的「返回内容不符（HTTP 503）」，把我们自己的配置问题记成客户域名的错。先算、算不出直接归 local，也不白发一次请求
  let want: Buffer
  try {
    want = Buffer.from(domainProof(host, code, nonce))
  } catch (e) {
    return fail('local', (e as Error)?.message?.slice(0, 60) || 'unknown')
  }
  let r: { status: number; body: string }
  try {
    r = await transport(host, `${DOMAIN_CHECK_PATH}?n=${nonce}`)
  } catch (e) {
    const c = classifyProbeError(e)
    return fail(c.category, c.detail)
  }
  if (r.status !== 200) return fail('content', `HTTP ${r.status}`)
  let proof: unknown
  try {
    proof = (JSON.parse(r.body) as { data?: { proof?: unknown } })?.data?.proof
  } catch {
    return fail('content', '应答不是 JSON')
  }
  if (typeof proof !== 'string') return fail('content', '应答不是本站格式')
  const got = Buffer.from(proof)
  if (want.length !== got.length || !timingSafeEqual(want, got)) return fail('content', '校验值不符（不是本站该渠道的应答）')
  return { ok: true }
}

/**
 * 校验 host 是否接到本站的这个渠道。attempts 次里任一次通过即通过（两次之间隔 3 秒，滤掉 Cloudflare 的瞬时抖动）。
 * 永不抛：本地错误也按失败返回（fail closed）。「指向了非公网地址」不重试（结果不会在 3 秒内变好，也不该再解析一次去碰运气）；
 * 「本站校验出错」也不重试（本站配置问题，3 秒后照样算不出）。
 */
export async function verifyCustomDomain(rawHost: string, code: string, attempts = 2): Promise<VerifyResult> {
  const host = normalizeHost(rawHost)
  if (!host) return fail('dns', '域名格式不对')
  let last: VerifyResult = fail('local', '未校验')
  for (let i = 0; i < Math.max(1, attempts); i++) {
    if (i > 0) await new Promise((res) => setTimeout(res, PROBE_RETRY_GAP_MS))
    try {
      last = await probeOnce(host, code)
    } catch (e) {
      last = fail('local', (e as Error)?.message?.slice(0, 60) || 'unknown')
    }
    if (last.ok || last.category === 'private' || last.category === 'local') return last
  }
  return last
}

/** 给超管看的一行原因：归类原因（细节） */
export function verifyFailText(v: VerifyResult): string {
  return v.ok ? '' : `${v.reason}（${v.detail}）`
}

/** 一条「刚手动校验通过」的新鲜记录（没有旧记录可继承时用；itest 也用它造记录） */
export function freshHealth(host: string, at = new Date()): DomainHealth {
  return manualVerifiedHealth(null, host, at.getTime()).next
}

/** 在事务里写一条校验记录（settings 表，一个渠道一行） */
export async function writeDomainHealth(db: Pick<typeof prisma, 'setting'>, tenantId: number, h: DomainHealth): Promise<void> {
  const key = domainHealthKey(tenantId)
  const value = serializeDomainHealth(h)
  await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
}

export async function readDomainHealthRaw(db: Pick<typeof prisma, 'setting'>, tenantId: number): Promise<string | null> {
  const row = await db.setting.findUnique({ where: { key: domainHealthKey(tenantId) }, select: { value: true } })
  return row?.value ?? null
}

export async function readDomainHealth(tenantId: number): Promise<DomainHealth | null> {
  return parseDomainHealth(await readDomainHealthRaw(prisma, tenantId))
}

function hostOfOrigin(origin: string): string | null {
  try {
    return normalizeHost(new URL(origin).host)
  } catch {
    return null
  }
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

/**
 * 条件写入（CAS）：锁渠道行（与 setPrimaryDomain / upsertDomain 同一把锁，串行），确认①渠道没停业、主域名仍是这个 host、
 * ②校验记录仍是开跑前读到的那一份（逐字相同），才写入。任一不符 → 不写、返回 false。
 * 为什么：一趟探测最长十几秒，期间站长可能点了「重新校验」或换了主域名；cron 拿旧 host / 旧计数覆盖掉新结果，
 * 会把刚恢复的域名又打回降级，或者把新主域名的记录写成旧域名的。被覆盖的一方（cron）放弃本次写入，下一趟再来。
 */
async function commitIfUnchanged(tenantId: number, host: string, prevRaw: string | null, next: DomainHealth): Promise<boolean> {
  return prisma.$transaction(async (tx: Tx) => {
    const rows = await tx.$queryRaw<{ origin: string; status: string }[]>`SELECT origin, status FROM tenants WHERE id = ${tenantId} FOR UPDATE`
    const t = rows[0]
    if (!t || t.status === 'TERMINATED' || hostOfOrigin(t.origin) !== host) return false
    if ((await readDomainHealthRaw(tx, tenantId)) !== prevRaw) return false
    await writeDomainHealth(tx, tenantId, next)
    return true
  })
}

export interface DomainHealthRunItem {
  tenantId: number
  code: string
  host: string
  ok: boolean
  healthy: boolean
  /** 站长群告警：degraded = 刚降级，recovered = 刚恢复，realert = 仍降级且本趟仍失败、6 小时再提醒；被节流时为 null */
  event: DomainHealthEvent | null
  /** 渠道站内通知：down =「暂时无法访问」，up =「已恢复」；与渠道上次听到的一致时为 null（不节流） */
  notice: DomainTenantNotice | null
  /** 归类原因（通过时为 null） */
  reason: string | null
  /** 本趟结果因并发改动（站长重新校验 / 换主域名）而放弃写入 */
  skipped?: boolean
}

/**
 * cron 复验（/api/cron/tenant-domains，每 10 分钟）：主域名是自定义域名、且没有停业（TERMINATED）的每个渠道校验一次、
 * 条件写入记录、按状态变化告警。已停业的渠道不再复验也不告警（店面已是停业页，没有要保护的链接）。
 * 子域名渠道（lulu、shop）不在范围内：一次请求都不发。有状态变化时立刻 invalidateStorefrontCache()，店面立刻改用 / 切回。
 */
export async function runDomainHealthCheck(): Promise<{ at: string; items: DomainHealthRunItem[] }> {
  const suffix = channelHostSuffix()
  const tenants = await prisma.tenant.findMany({
    where: { kind: 'CHANNEL', id: { gte: 2 }, status: { not: 'TERMINATED' } },
    orderBy: { id: 'asc' },
    select: { id: true, code: true, origin: true },
  })
  const items: DomainHealthRunItem[] = []
  for (const t of tenants) {
    const host = hostOfOrigin(t.origin)
    if (!host || host.endsWith(suffix)) continue
    const prevRaw = await readDomainHealthRaw(prisma, t.id)
    const prev = parseDomainHealth(prevRaw)
    const r = await verifyCustomDomain(host, t.code)
    const now = Date.now()
    const { next, event, notice } = nextDomainHealth(prev, host, r.ok ? { ok: true } : { ok: false, reason: r.reason, detail: r.detail }, now)
    const healthy = isDomainHealthy(next, host, now)
    const reason = r.ok ? null : r.reason
    if (!(await commitIfUnchanged(t.id, host, prevRaw, next))) {
      console.warn(`[domain-verify] 渠道 ${t.code} 的校验记录在本趟探测期间被改动（站长重新校验 / 换主域名 / 停业），放弃本次写入`)
      items.push({ tenantId: t.id, code: t.code, host, ok: r.ok, healthy: isDomainHealthy(await readDomainHealth(t.id), host, now), event: null, notice: null, reason, skipped: true })
      continue
    }
    // 状态变了就**先**清店面缓存、再告警：渠道通知的推送按钮取的是 storefrontById（带 30 秒缓存），
    // 先告警会让「暂时无法访问」那条推送里的「前往渠道后台」仍指向失联的自定义域名
    if (event || notice || isDomainHealthy(prev, host, now) !== healthy) invalidateStorefrontCache()
    items.push({ tenantId: t.id, code: t.code, host, ok: r.ok, healthy, event, notice, reason })
    // 告警里的原因取记录里的（降级中保留的是最近一次失败的归类原因）：「暂时无法访问」可能在一趟成功之后才补发
    // （例如渠道还没听到过降级），用本趟结果会写成「未知」
    if (event || notice) await announceDomainEvent(t.id, t.code, host, event, notice, next.down ? next.reason : null)
  }
  return { at: new Date().toISOString(), items }
}

/**
 * 平台群告警（event，已按 6 小时节流）+ 渠道站内通知（notice，只跟状态走）。两者各自独立：抖动时常常只有其中一个。
 * 永不抛（alertPlatform 与 tx=null 的 emitTenantNotice 都只记日志）。
 * reason 只能是归类原因（PROBE_FAIL_LABEL 里的中文类别）：渠道通知与告警群都不写 HTTP 状态码、错误码等原始细节。
 */
export async function announceDomainEvent(
  tenantId: number,
  code: string,
  host: string,
  event: DomainHealthEvent | null,
  notice: DomainTenantNotice | null,
  reason: string | null,
): Promise<void> {
  if (!event && !notice) return
  const sub = await prisma.tenantDomain
    .findFirst({ where: { tenantId, status: 1, host: { endsWith: channelHostSuffix() } }, orderBy: { id: 'asc' }, select: { host: true } })
    .catch(() => null)
  const fallback = sub ? `https://${sub.host}` : '（没有启用中的子域名：只停止跳转，链接仍指向自定义域名，请尽快处理）'
  if (event === 'recovered') {
    await alertPlatform(`渠道 ${code} 的自定义主域名 https://${host} 连通校验已恢复，邮件、链接与跳转已切回该域名`)
  } else if (event) {
    await alertPlatform(
      `渠道 ${code} 的自定义主域名 https://${host} 连续校验失败（${reason ?? '未知'}）${event === 'realert' ? '，仍未恢复（距上次告警已满 6 小时）' : ''}。` +
        `已自动改用 ${fallback} 生成邮件与链接、停止向该域名跳转；连续两趟校验通过后自动切回。请确认客户的域名未过期、DNS 服务器仍指向站长的 Cloudflare、隧道路由仍在。`,
    )
  }
  if (notice === 'up') {
    await emitTenantNotice(null, { tenantId, kind: 'TENANT_STATUS', title: `自定义域名 ${host} 已恢复`, body: `系统邮件、邀请链接与跳转已切回 https://${host}` })
  } else if (notice === 'down') {
    await emitTenantNotice(null, {
      tenantId,
      kind: 'TENANT_STATUS',
      title: `自定义域名 ${host} 暂时无法访问`,
      body: `系统检测到 https://${host} 没有接到本店（${reason ?? '未知'}），已临时改用 ${sub ? sub.host : '原地址'}。请确认域名没有过期、DNS 服务器仍是站长提供的 Cloudflare 地址；恢复后自动切回`,
    })
  }
}

/**
 * 站长手动校验通过后（setPrimaryDomain 同一事务里、已持渠道行锁）写记录：立即解除降级。
 * 返回要在提交后发的站长群事件（原本降级且不在节流内 → recovered）与渠道通知（渠道上次听到「暂时无法访问」→ up）。
 * 不做 CAS：这是刚刚当场验证过的成功，而且与 cron 的条件写入持同一把锁串行，cron 看到记录变了会自己放弃。
 */
export async function writeManualVerifiedHealth(
  tx: Tx,
  tenantId: number,
  host: string,
  at: Date,
): Promise<{ event: 'recovered' | null; notice: DomainTenantNotice | null }> {
  const prev = parseDomainHealth(await readDomainHealthRaw(tx, tenantId))
  const { next, event, notice } = manualVerifiedHealth(prev, host, at.getTime())
  await writeDomainHealth(tx, tenantId, next)
  return { event, notice }
}
