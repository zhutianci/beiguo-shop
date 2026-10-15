/**
 * 注册邮箱口径（2026-10-15 攻防加固，docs/安全-攻防加固设计-1015.md 3.2 / 7.5）。
 *
 * 【为什么】10-05 起同一个人用 maxxspace.com、guerrillamailblock.com 这类一次性邮箱开了 6 个号刷单、探测；
 * 封一个号几分钟后就换域名再注册——一次性邮箱几秒一个，黑名单永远追不上。
 *
 * 【两种模式，后台「系统设置 → 安全」切换（Setting `security_email_policy`），不用重新构建】
 *  · STRICT 严格白名单（默认，站长 10-15 下午定）：只有 TRUSTED 能注册，其余一律「该邮箱类型暂不支持注册」。
 *    TRUSTED = 内置主流邮箱 + 教育 / 科研 / 政府后缀 + 后台「信任的邮箱域名」（上线时预置了老客户在用的企业邮箱域名）。
 *  · TIERED 分级（10-15 上午的口径）：TRUSTED 照常；一次性邮箱（内置清单约 9900 个，社区维护、CC0）与后台「拦截的邮箱域名」拒绝；
 *    其余 OTHER 能注册，但新号头 24 小时内同时只能有 1 笔待付订单（lib/order/create-guard.ts）。
 *    当时用生产库核对过：924 个账号里有 42 个不是主流邮箱、其中 27 个付过款，严格白名单会把这类新客挡在门外——
 *    站长权衡后仍选严格，企业客户由后台加信任域名放行。
 *
 * 判定顺序：后台信任 > 内置信任 > （分级模式下）后台拦截 > 内置一次性清单 > OTHER；严格模式下非 TRUSTED 一律 BLOCKED。
 * 内置主流域名后台拦不掉（防手滑把 qq.com 填进拦截框）；一次性域名后台信任不进去（保存时剔除，见 api/admin/security）。
 * 都按「域名及其上级域」匹配：a.b.maxxspace.com 也算 maxxspace.com。
 * 只影响新注册与新号下单；老用户、登录、找回密码、绑定一律不受影响。
 */
import { prisma } from '../db'
import { DISPOSABLE_DOMAINS_TEXT } from './disposable-domains.data'

export const TRUSTED_EMAIL_DOMAINS_KEY = 'security_trusted_email_domains'
export const BLOCKED_EMAIL_DOMAINS_KEY = 'security_blocked_email_domains'
export const EMAIL_POLICY_KEY = 'security_email_policy'
export const EMAIL_DOMAIN_BLOCKED_MSG = '该邮箱类型暂不支持注册，请使用 QQ、163、126、Gmail、Outlook、iCloud 等常用邮箱；企业邮箱请联系客服开通'

export type EmailTier = 'TRUSTED' | 'OTHER' | 'BLOCKED'
export type EmailPolicy = 'STRICT' | 'TIERED'

/** Setting 里的值 → 模式。没设或写坏一律按严格（fail closed） */
export function parseEmailPolicy(v: string | null | undefined): EmailPolicy {
  return String(v ?? '').trim().toUpperCase() === 'TIERED' ? 'TIERED' : 'STRICT'
}

/**
 * 主流邮箱（精确匹配域名）。国内的都要求绑定手机号（实名），海外的是注册门槛较高、滥用少的几家。
 * 刻意不放：proton / tuta（匿名邮箱）、mail.com / gmx / yandex / mail.ru（批量注册门槛低）——严格模式下不能注册，分级模式下落在 OTHER。
 * 改这份名单要构建；临时放行某个域名用后台「信任的邮箱域名」。
 */
export const TRUSTED_PROVIDERS: ReadonlySet<string> = new Set([
  // 腾讯
  'qq.com', 'vip.qq.com', 'foxmail.com',
  // 网易
  '163.com', '126.com', 'yeah.net', 'vip.163.com', 'vip.126.com', '188.com',
  // 三大运营商
  '139.com', '189.cn', 'wo.cn', '21cn.com',
  // 门户 / 云 / 手机厂商
  'sina.com', 'sina.cn', 'vip.sina.com', 'sohu.com', 'aliyun.com', 'petalmail.com',
  // 海外主流
  'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'mac.com',
  'yahoo.com',
])
// 教育、科研、政府按后缀信任。只认真正的后缀，不认「edu」子串：清单里有 haida-edu.cn、edu.979786.xyz 这类仿冒
const TRUSTED_SUFFIXES = ['.edu.cn', '.ac.cn', '.gov.cn', '.edu', '.edu.hk', '.edu.tw', '.edu.mo', '.ac.uk']

// 清单里没有、但已在本站出现过的一次性域名（10-15 生产核对）
const BUILTIN_EXTRA_BLOCKED = ['linshiyouxiang.com', 'linshiyou.com', 'maxxspace.com', 'guerrillamailblock.com']

let builtinBlocked: Set<string> | null = null
function builtinBlockedSet(): Set<string> {
  if (!builtinBlocked) {
    builtinBlocked = new Set(
      DISPOSABLE_DOMAINS_TEXT.split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .concat(BUILTIN_EXTRA_BLOCKED),
    )
  }
  return builtinBlocked
}

/** 后台名单：规范化成「小写、去 @、去空白」的域名数组。非法行丢弃，最多 500 个 */
export function parseDomainList(raw: string): string[] {
  const out = new Set<string>()
  for (const part of String(raw ?? '').split(/[\s,，;；]+/)) {
    const d = part.trim().toLowerCase().replace(/^@+/, '').replace(/\.+$/, '')
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d) && d.length <= 120) out.add(d)
    if (out.size >= 500) break
  }
  return Array.from(out)
}

export interface DomainLists {
  trusted: ReadonlySet<string>
  blocked: ReadonlySet<string>
  /** 不传 = 严格 */
  mode?: EmailPolicy
}

const LISTS_TTL_MS = 60_000
let listsCache: { at: number; lists: DomainLists } | null = null

async function adminLists(): Promise<DomainLists> {
  if (listsCache && Date.now() - listsCache.at < LISTS_TTL_MS) return listsCache.lists
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: [TRUSTED_EMAIL_DOMAINS_KEY, BLOCKED_EMAIL_DOMAINS_KEY, EMAIL_POLICY_KEY] } },
      select: { key: true, value: true },
    })
    const get = (k: string) => rows.find((r) => r.key === k)?.value ?? ''
    const lists: DomainLists = {
      trusted: new Set(parseDomainList(get(TRUSTED_EMAIL_DOMAINS_KEY))),
      blocked: new Set(parseDomainList(get(BLOCKED_EMAIL_DOMAINS_KEY))),
      mode: parseEmailPolicy(get(EMAIL_POLICY_KEY)),
    }
    listsCache = { at: Date.now(), lists }
    return lists
  } catch (e) {
    // 读不到后台名单时沿用上一份；从没读到过就按「严格 + 只有内置主流」——宁可暂时挡住企业邮箱，也不放一次性邮箱进来
    console.error('[email-domain] 读取后台名单失败', (e as Error)?.message)
    return listsCache?.lists ?? { trusted: new Set(), blocked: new Set(), mode: 'STRICT' }
  }
}

/** 是否在内置一次性邮箱清单里（后台保存「信任的邮箱域名」时用来剔除） */
export function isKnownDisposable(domain: string): boolean {
  const b = builtinBlockedSet()
  return domainChain(domain).some((d) => b.has(d))
}

export function isBuiltinTrusted(domain: string): boolean {
  return TRUSTED_PROVIDERS.has(domain) || TRUSTED_SUFFIXES.some((s) => domain.endsWith(s))
}

/** 后台保存名单后调用，立即生效（不用等 60 秒缓存） */
export function resetEmailDomainCache(): void {
  listsCache = null
}

/** 域名本身与它的各级上级域（至少两段）：a.b.c.com → [a.b.c.com, b.c.com, c.com] */
function domainChain(domain: string): string[] {
  const parts = domain.split('.')
  const out: string[] = []
  for (let i = 0; i <= parts.length - 2; i++) out.push(parts.slice(i).join('.'))
  return out
}

export function domainOf(email: string | null | undefined): string {
  const s = String(email ?? '').trim().toLowerCase()
  const at = s.lastIndexOf('@')
  return at >= 0 ? s.slice(at + 1).replace(/\.+$/, '') : ''
}

/** 纯函数（不查库），自测与后台预览用。lists.mode 不传按严格 */
export function classifyDomain(
  domain: string,
  lists: DomainLists,
): { tier: EmailTier; source: 'ADMIN' | 'BUILTIN' | 'POLICY' | null } {
  const strict = (lists.mode ?? 'STRICT') === 'STRICT'
  const chain = domain && domain.includes('.') ? domainChain(domain) : []
  if (chain.some((d) => lists.trusted.has(d))) return { tier: 'TRUSTED', source: 'ADMIN' }
  if (chain.length && isBuiltinTrusted(domain)) return { tier: 'TRUSTED', source: 'BUILTIN' }
  if (!strict && chain.some((d) => lists.blocked.has(d))) return { tier: 'BLOCKED', source: 'ADMIN' }
  const b = builtinBlockedSet()
  if (chain.some((d) => b.has(d))) return { tier: 'BLOCKED', source: 'BUILTIN' }
  return strict ? { tier: 'BLOCKED', source: 'POLICY' } : { tier: 'OTHER', source: null }
}

/** 当前生效的模式（后台展示用） */
export async function currentEmailPolicy(): Promise<EmailPolicy> {
  return (await adminLists()).mode ?? 'STRICT'
}

export async function emailTier(email: string | null | undefined): Promise<EmailTier> {
  return classifyDomain(domainOf(email), await adminLists()).tier
}

/** true = 该邮箱的域名不允许注册 */
export async function emailDomainBlocked(email: string): Promise<boolean> {
  return (await emailTier(email)) === 'BLOCKED'
}

/** 内置口径的规模（后台展示用） */
export function builtinCounts(): { trusted: number; blocked: number } {
  return { trusted: TRUSTED_PROVIDERS.size, blocked: builtinBlockedSet().size }
}
