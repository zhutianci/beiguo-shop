/**
 * 注册邮箱分级（2026-10-15 攻防加固，docs/安全-攻防加固设计-1015.md 3.2；站长定：分级，不做严格白名单）。
 *
 * 【为什么】10-05 起同一个人用 maxxspace.com、guerrillamailblock.com 这类一次性邮箱开了 6 个号刷单、探测；
 * 封一个号几分钟后就换域名再注册。
 *
 * 【为什么不是严格白名单】10-15 用生产库核对：924 个账号里有 42 个用的不是主流邮箱，其中 27 个付过款——
 * 大多是企业邮箱（transwarp.io、anker-in.com、pdlaser.cn…），还有 mail.com、华为邮箱、proton。
 * 严格白名单会在注册口挡掉约 3.5% 的付费买家。所以分三档：
 *
 *  · TRUSTED：国内主流（能绑手机实名的）与海外主流邮箱、教育 / 科研 / 政府域名、后台「信任的邮箱域名」→ 照常；
 *  · BLOCKED：一次性邮箱（内置清单约 9900 个，社区维护、CC0）、后台「拦截的邮箱域名」→ 不让注册（发码与注册两处拦）；
 *  · OTHER：其余（企业邮箱、小众邮箱）→ 能注册，但新号头 24 小时内同时只能有 1 笔待付订单（lib/order/create-guard.ts）。
 *
 * 判定顺序：后台信任 > 内置信任 > 后台拦截 > 内置清单 > OTHER。内置信任的域名后台拦不掉（防手滑把 qq.com 填进拦截框）。
 * 都按「域名及其上级域」匹配：a.b.maxxspace.com 也算 maxxspace.com。
 * 只影响新注册与新号下单；老用户、登录、找回密码、绑定一律不受影响。
 */
import { prisma } from '../db'
import { DISPOSABLE_DOMAINS_TEXT } from './disposable-domains.data'

export const TRUSTED_EMAIL_DOMAINS_KEY = 'security_trusted_email_domains'
export const BLOCKED_EMAIL_DOMAINS_KEY = 'security_blocked_email_domains'
export const EMAIL_DOMAIN_BLOCKED_MSG = '该邮箱暂不支持注册，请使用 QQ、163、Gmail、Outlook 等常用邮箱'

export type EmailTier = 'TRUSTED' | 'OTHER' | 'BLOCKED'

/**
 * 主流邮箱（精确匹配域名）。国内的都要求绑定手机号（实名），海外的是注册门槛较高、滥用少的几家。
 * 刻意不放：proton / tuta（匿名邮箱）、mail.com / gmx / yandex / mail.ru（批量注册门槛低）——它们落在 OTHER，能注册但新号受限。
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
}

const LISTS_TTL_MS = 60_000
let listsCache: { at: number; lists: DomainLists } | null = null

async function adminLists(): Promise<DomainLists> {
  if (listsCache && Date.now() - listsCache.at < LISTS_TTL_MS) return listsCache.lists
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: [TRUSTED_EMAIL_DOMAINS_KEY, BLOCKED_EMAIL_DOMAINS_KEY] } },
      select: { key: true, value: true },
    })
    const get = (k: string) => rows.find((r) => r.key === k)?.value ?? ''
    const lists = { trusted: new Set(parseDomainList(get(TRUSTED_EMAIL_DOMAINS_KEY))), blocked: new Set(parseDomainList(get(BLOCKED_EMAIL_DOMAINS_KEY))) }
    listsCache = { at: Date.now(), lists }
    return lists
  } catch (e) {
    // 读不到后台名单不挡注册（内置口径照样生效）；下次请求再试
    console.error('[email-domain] 读取后台名单失败', (e as Error)?.message)
    return listsCache?.lists ?? { trusted: new Set(), blocked: new Set() }
  }
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

/** 纯函数（不查库），自测与后台预览用 */
export function classifyDomain(domain: string, lists: DomainLists): { tier: EmailTier; source: 'ADMIN' | 'BUILTIN' | null } {
  if (!domain || !domain.includes('.')) return { tier: 'OTHER', source: null }
  const chain = domainChain(domain)
  if (chain.some((d) => lists.trusted.has(d))) return { tier: 'TRUSTED', source: 'ADMIN' }
  if (TRUSTED_PROVIDERS.has(domain) || TRUSTED_SUFFIXES.some((s) => domain.endsWith(s))) return { tier: 'TRUSTED', source: 'BUILTIN' }
  if (chain.some((d) => lists.blocked.has(d))) return { tier: 'BLOCKED', source: 'ADMIN' }
  const b = builtinBlockedSet()
  if (chain.some((d) => b.has(d))) return { tier: 'BLOCKED', source: 'BUILTIN' }
  return { tier: 'OTHER', source: null }
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
