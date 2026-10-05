/**
 * 指令文本解析（docs/微信机器人-设计.md §7.4）：去掉开头的 @、全角转半角、去括号、切分。
 * 身份与「是否真的 @ 了机器人」不在这里判断（那是协议给的 atuserlist，见 inbound.ts）。
 */

/** 全角 ASCII（！到～）与全角空格转半角 */
export function toHalfWidth(s: string): string {
  return s.replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/\u3000/g, ' ')
}

/** 去掉开头的一个或多个「@某人」：微信从成员列表选人时插入「@昵称」+ U+2005 */
export function stripLeadingMentions(s: string): string {
  let t = s.trim()
  for (let i = 0; i < 5; i++) {
    const m = t.match(/^@[^\s\u2005]{1,40}[\u2005\s]+/)
    if (!m) break
    t = t.slice(m[0].length).trimStart()
  }
  // 只有「@昵称」本身、没有后续文本
  if (/^@[^\s\u2005]{1,40}$/.test(t)) return ''
  return t
}

export interface ParsedCommand {
  name: string
  args: string[]
}

/** 把一条消息拆成「指令名 + 参数」；空消息返回 null */
export function parseCommandText(raw: string): ParsedCommand | null {
  let t = toHalfWidth(String(raw ?? ''))
  t = stripLeadingMentions(t)
  t = t.replace(/[【】「」『』《》]/g, ' ').replace(/\u2005/g, ' ')
  const tokens = t.split(/\s+/).map((x) => x.trim()).filter(Boolean)
  if (!tokens.length) return null
  return { name: tokens[0].toLowerCase(), args: tokens.slice(1, 20) }
}

/** 价格：150、150.5、¥150、150元、150.00 → 数字；非法返回 null */
export function parsePrice(s: string): number | null {
  const t = toHalfWidth(s).replace(/^[¥￥]/, '').replace(/元$/, '').trim()
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(t)) return null
  const v = Number(t)
  return Number.isFinite(v) && v > 0 ? v : null
}

/** 正整数（数量、群编号） */
export function parsePositiveInt(s: string, max = 1_000_000): number | null {
  const t = toHalfWidth(s).replace(/^#/, '').trim()
  if (!/^\d{1,9}$/.test(t)) return null
  const v = Number(t)
  return v >= 1 && v <= max ? v : null
}

/** 免打扰「23-8」「23:00-08:00」→ 分钟区间；「关」→ null */
export function parseQuietRange(s: string): { from: number; to: number } | 'off' | 'bad' {
  const t = toHalfWidth(s).trim()
  if (/^(关|关闭|off|无)$/i.test(t)) return 'off'
  const m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*[-~至到]\s*(\d{1,2})(?::(\d{2}))?$/)
  if (!m) return 'bad'
  const h1 = Number(m[1])
  const m1 = Number(m[2] ?? 0)
  const h2 = Number(m[3])
  const m2 = Number(m[4] ?? 0)
  if (h1 > 23 || h2 > 24 || m1 > 59 || m2 > 59) return 'bad'
  const from = h1 * 60 + m1
  const to = (h2 % 24) * 60 + m2
  if (from === to) return 'bad'
  return { from, to }
}

export function fmtMinuteOfDay(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}
