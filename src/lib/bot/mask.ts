/**
 * 推送内容的脱敏与清洗（docs/微信机器人-设计.md §5.4）。纯函数，scripts/check-bot-core.ts 覆盖。
 *
 * 微信是纯文本，不渲染 Markdown，所以不需要像企业微信那样转义 []<>；要防的是：
 *  - 换行伪造字段行 → oneLine
 *  - 买家可控文本里的网址变成可点链接（以机器人名义钓鱼）→ neutralizeUrls
 *  - 邮箱、手机号、疑似卡密进群 → maskEmails / dropEmails、maskPhones、maskCardLike
 */

// eslint-disable-next-line no-control-regex
const CTRL_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u2028\u2029\u202a-\u202e\u2060-\u2064\ufeff]/g

/** 去控制字符与零宽 / 方向控制字符，换行与制表压成空格，连续空白合一 */
export function oneLine(v: unknown, max = 500): string {
  const s = String(v ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(CTRL_RE, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return truncate(s, max)
}

/** 多行文本（raw 行，如待开清单）：保留换行，每行单独清洗 */
export function multiLine(v: unknown, maxLines = 20, maxPerLine = 200): string {
  return String(v ?? '')
    .split(/\r?\n/)
    .map((l) => oneLine(l, maxPerLine))
    .filter(Boolean)
    .slice(0, maxLines)
    .join('\n')
}

export function truncate(s: string, max: number): string {
  const arr = Array.from(s)
  return arr.length > max ? arr.slice(0, max).join('') + '…' : s
}

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g

/** 邮箱打码：保留前两位与域名，ab***@qq.com */
export function maskEmails(s: string): string {
  return s.replace(EMAIL_RE, (m) => {
    const at = m.lastIndexOf('@')
    const local = m.slice(0, at)
    const domain = m.slice(at + 1)
    const keep = Array.from(local).slice(0, Math.min(2, Math.max(1, local.length - 1))).join('')
    return `${keep}***@${domain}`
  })
}

/** 邮箱直接去掉（分站群不出现买家邮箱，D9） */
export function dropEmails(s: string): string {
  return s.replace(EMAIL_RE, '[邮箱已隐藏]')
}

/** 11 位大陆手机号：138****1234（前后不能紧挨数字，避免误伤订单号、金额） */
export function maskPhones(s: string): string {
  return s.replace(/(?<!\d)(1[3-9]\d)(\d{4})(\d{4})(?!\d)/g, '$1****$3')
}

/**
 * 疑似卡密：连续 ≥ 12 位的字母数字（可含 -），且同时含字母与数字 → 只留首尾各 4 位。
 * 只对买家可控的文本用（留言、昵称），不对订单号等系统字段用。
 */
export function maskCardLike(s: string): string {
  return s.replace(/[A-Za-z0-9][A-Za-z0-9-]{10,}[A-Za-z0-9]/g, (m) => {
    const bare = m.replace(/-/g, '')
    if (bare.length < 12 || !/[A-Za-z]/.test(bare) || !/\d/.test(bare)) return m
    return `${m.slice(0, 4)}…${m.slice(-4)}`
  })
}

/**
 * 买家可控文本里的网址中性化：http(s):// 后插零宽空格、域名里的点换成 [.]，微信就不会把它识别成可点的链接。
 * 只处理「像网址」的片段（带协议，或 www. 开头，或 xx.xx/ 形式），普通句子里的点不动。
 */
export function neutralizeUrls(s: string): string {
  return s.replace(
    /\b(?:(https?):\/\/)?((?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,})(\/[^\s]*)?/gi,
    (m, proto: string | undefined, host: string, path: string | undefined) => {
      const looksUrl = !!proto || /^www\./i.test(host) || !!path
      if (!looksUrl) return m
      const safeHost = host.replace(/\./g, '[.]')
      return `${proto ? `${proto}:\u200b//` : ''}${safeHost}${path ?? ''}`
    }
  )
}

/** 先在整段上打码、最后才截断的上限：再长的输入先压到这里（推送里没有这么长的字段） */
const SANITIZE_SCAN_MAX = 4000

/**
 * 系统字段（订单号、商品名、金额……）的默认清洗：单行 + 邮箱打码 + 手机号打码，**最后**才截断。
 * 先截断的话，截在邮箱中间的半截「someone@exam…」认不出来，本地部分就原样漏出去了（分站群黑名单也认不出）
 */
export function sanitizeSystemValue(v: unknown, opts?: { dropEmail?: boolean; max?: number }): string {
  let s = oneLine(v, SANITIZE_SCAN_MAX)
  s = opts?.dropEmail ? dropEmails(s) : maskEmails(s)
  s = maskPhones(s)
  return truncate(s, opts?.max ?? 300)
}

/** 买家可控文本（留言、昵称、友链申请内容）：再加疑似卡密打码与网址中性化；同样先整段处理、最后截断（截在网址中间的半截认不出来） */
export function sanitizeUserText(v: unknown, opts?: { dropEmail?: boolean; max?: number }): string {
  let s = oneLine(v, SANITIZE_SCAN_MAX)
  s = opts?.dropEmail ? dropEmails(s) : maskEmails(s)
  s = maskPhones(s)
  s = maskCardLike(s)
  s = neutralizeUrls(s)
  return truncate(s, opts?.max ?? 100)
}

/** 分站群出队前的黑名单扫描（§5.4）：命中任何一条返回原因，调用方丢弃这条并告警 */
export function tenantBlacklistHit(text: string): string | null {
  if (/[?&]cdk=/i.test(text)) return 'cdk'
  if (/\/finance\//i.test(text)) return 'finance-link'
  // 主站快速回复是 <域名>/reply/<令牌>；渠道快速回复是 /partner-reply/<令牌>，不含「/reply/」，不会误伤
  if (/\/reply\//i.test(text)) return 'platform-reply-link'
  if (/\/admin(?:\/|\b)/i.test(text)) return 'admin-link'
  // 打过码的 ab***@qq.com 匹配不上 EMAIL_RE（* 不在本地部分的字符集里），能匹配上的就是明文邮箱
  if ((text.match(EMAIL_RE) || []).length > 0) return 'email'
  return null
}
