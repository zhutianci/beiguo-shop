/**
 * 注册邮箱的「别名」识别（2026-10-25 第三轮加固，docs/安全-第三轮加固-1025.md）。
 *
 * 【为什么】注册是严格白名单（只收 QQ / 163 / Gmail / Outlook 等主流邮箱），但主流邮箱自带「无限别名」：
 *   · 几乎所有邮箱都支持「加号别名」：abc+1@gmail.com、abc+2@gmail.com … 全部投递到 abc@gmail.com；
 *   · Gmail 还忽略本地部分的点：a.b.c@gmail.com = abc@gmail.com；googlemail.com = gmail.com。
 * 10-24 / 10-25 线上的恶意注册全是这一类（irontmp+…、sisatmp+…、wipetmp+…、dueltmp+…@gmail.com）：
 * 一个邮箱就能开任意多个号，绕过「每人一号」的所有风控（新号下单闸门、封号）。
 *
 * 【规则】只管新注册（发注册码、注册）；老账号照常登录、找回密码。
 *   · 本地部分带「+」的一律不收（提示用邮箱本身的地址）；
 *   · Gmail 归一化后（去点、googlemail→gmail）与已有账号相同的，按「该邮箱已注册」处理——
 *     收信的是同一个人，这样不会多出一个号，也不泄露任何信息（发码时照样只给这个邮箱发「已注册」说明信）。
 * 纯函数，不查库；查库的 findCanonicalTwin 在 lib/security/email-twin.ts（避免这里依赖 prisma，方便自测）。
 */

const GMAIL_DOMAINS = new Set(['gmail.com', 'googlemail.com'])

function split(email: string): { local: string; domain: string } | null {
  const s = String(email || '').trim().toLowerCase()
  const at = s.lastIndexOf('@')
  if (at <= 0 || at === s.length - 1) return null
  return { local: s.slice(0, at), domain: s.slice(at + 1).replace(/\.+$/, '') }
}

/** 本地部分带「+」子地址（abc+tag@x.com） */
export function hasSubAddress(email: string): boolean {
  const p = split(email)
  return !!p && p.local.includes('+')
}

/** 是不是 Gmail（含 googlemail.com） */
export function isGmail(email: string): boolean {
  const p = split(email)
  return !!p && GMAIL_DOMAINS.has(p.domain)
}

/**
 * 「同一个收件箱」的归一化形式：小写；去掉 +tag；Gmail 再去掉本地部分的点、域名统一成 gmail.com。
 * 只用于判重，不改变账号实际保存的邮箱。
 */
export function canonicalEmail(email: string): string {
  const p = split(email)
  if (!p) return String(email || '').trim().toLowerCase()
  let local = p.local
  const plus = local.indexOf('+')
  if (plus >= 0) local = local.slice(0, plus)
  let domain = p.domain
  if (GMAIL_DOMAINS.has(domain)) {
    local = local.replace(/\./g, '')
    domain = 'gmail.com'
  }
  return `${local}@${domain}`
}

export const SUB_ADDRESS_MSG = '暂不支持带「+」的别名邮箱，请使用邮箱本身的地址注册'
