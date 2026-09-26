/**
 * Host 规范化与休眠 / 严格期开关（设计 4.4、4.10）。
 *
 * 【为什么单独一个文件】这里的函数全是纯函数、不 import 任何 Node 模块与 prisma：
 *  · middleware（Edge 运行时，WP1）要用同一份 `PLATFORM_HOSTS` 解析与 Host 规范化做粗分流，
 *    它不能 import resolve.ts（会把 prisma 带进 Edge）；
 *  · scripts/check-* 可以直接测。
 * 解析口径只有这一份，middleware 与路由内的店面解析不会各写一套而漂移。
 *
 * 【环境变量，每次调用时现读】（不在模块加载时缓存布尔值：itest 需要在同一进程里切换休眠 / 开启）
 *  · CHANNELS_ENABLED  = '1' 才开启渠道；未设置 = 休眠：任何 Host 都是主站、不查租户表（设计 4.10）
 *  · HOST_STRICT       = '1' 进入严格期：未知 Host 一律 404；其余（含未设置）为观察期：未知 Host 当主站 + 记日志
 *  · PLATFORM_HOSTS    逗号分隔的主站 Host 白名单；未设置或解析为空 → 默认值（并打一次日志）
 *  · CHANNEL_HOST_SUFFIX  只有这个后缀的 Host 才会查库（默认 .bigolab.com），防随机 Host 刷库
 */

/** 与设计 4.4 表格第一行一致；经 IP / localhost / 容器名 app 进后台照常可用 */
export const DEFAULT_PLATFORM_HOSTS: readonly string[] = ['bigolab.com', 'www.bigolab.com', 'app', 'localhost', '127.0.0.1']

/** 只有这个后缀的 Host 才可能是渠道域名（才查库） */
export const DEFAULT_CHANNEL_HOST_SUFFIX = '.bigolab.com'

/**
 * Host 头规范化：去端口、转小写、去尾点。
 * 返回 null 的情况（一律按「未知 / 无 Host」处理，不查库）：
 *  · 空值；含逗号（多值头，代理链拼接或伪造）；非 ASCII；IPv6 字面量（`[::1]:3000` 或裸 `::1`）；
 *  · 含主机名合法字符以外的任何东西（空格、斜杠、@ 等）；过长（> 253）；标签为空（`a..b`）。
 * 不做 punycode 转换：国际化域名进不了白名单，也不会是渠道域名，直接视为未知最安全。
 */
export function normalizeHost(raw: string | null | undefined): string | null {
  if (raw == null) return null
  let h = String(raw).trim()
  if (!h || h.includes(',')) return null
  // 非 ASCII 一律拒绝（含全角字符、零宽字符）
  if (!/^[\x21-\x7e]+$/.test(h)) return null
  if (h.startsWith('[')) return null // IPv6 字面量
  const colon = h.indexOf(':')
  if (colon !== -1) {
    if (h.indexOf(':', colon + 1) !== -1) return null // 裸 IPv6
    const port = h.slice(colon + 1)
    if (!/^\d{1,5}$/.test(port)) return null
    h = h.slice(0, colon)
  }
  h = h.toLowerCase()
  if (h.endsWith('.')) h = h.slice(0, -1)
  if (!h || h.length > 253) return null
  if (!/^[a-z0-9.-]+$/.test(h)) return null
  if (h.split('.').some((label) => label.length === 0 || label.length > 63)) return null
  return h
}

let warnedBadPlatformHosts = ''

/** 解析 PLATFORM_HOSTS。漏配 / 写错成空时退回默认值并打日志（设计 4.4），绝不变成「没有主站 Host」 */
export function parsePlatformHosts(raw: string | null | undefined): Set<string> {
  const list = (raw || '')
    .split(',')
    .map((s) => normalizeHost(s))
    .filter((s): s is string => !!s)
  if (list.length === 0) {
    if (raw && warnedBadPlatformHosts !== raw) {
      warnedBadPlatformHosts = raw
      console.error('[storefront] PLATFORM_HOSTS 解析为空，退回默认值：', DEFAULT_PLATFORM_HOSTS.join(','))
    }
    return new Set(DEFAULT_PLATFORM_HOSTS)
  }
  return new Set(list)
}

let cachedHostsRaw: string | undefined
let cachedHosts: Set<string> = new Set(DEFAULT_PLATFORM_HOSTS)

/** 当前生效的主站 Host 白名单（按环境变量原文缓存；环境变量变了会重新解析） */
export function platformHosts(): Set<string> {
  const raw = process.env.PLATFORM_HOSTS
  if (raw !== cachedHostsRaw) {
    cachedHostsRaw = raw
    cachedHosts = parsePlatformHosts(raw)
  }
  return cachedHosts
}

/** 渠道总开关。只认字面量 '1'：'true'、'yes'、空格等一律视为关闭（休眠是默认安全态） */
export function channelsEnabled(): boolean {
  return process.env.CHANNELS_ENABLED === '1'
}

/** 严格期：未知 Host 404。默认观察期（开业初期先观察现网 Host，再切严格，设计 4.4 / 15.4） */
export function hostStrict(): boolean {
  return process.env.HOST_STRICT === '1'
}

/** 可能是渠道域名的后缀（带前导点）。配置非法时退回默认值 */
export function channelHostSuffix(): string {
  const raw = (process.env.CHANNEL_HOST_SUFFIX || '').trim().toLowerCase()
  if (!raw) return DEFAULT_CHANNEL_HOST_SUFFIX
  const s = raw.startsWith('.') ? raw : '.' + raw
  return /^(\.[a-z0-9-]+){2,}$/.test(s) ? s : DEFAULT_CHANNEL_HOST_SUFFIX
}

/** Host 是否形如 `xxx.bigolab.com`（恰好一级子域；主站 Host 已在白名单里先被拦下） */
export function isChannelCandidateHost(host: string): boolean {
  const suffix = channelHostSuffix()
  if (!host.endsWith(suffix)) return false
  const sub = host.slice(0, -suffix.length)
  // 只接受一级子域：Universal SSL 只覆盖一级子域（设计 4.2），多级子域不可能是合法渠道
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(sub)
}
