/**
 * 到账通知（SmsForwarder 转发的手机通知）的解析：判渠道、取金额、核对系统通知格式。纯函数，不碰数据库。
 * 改这里之后必跑 `npx tsx scripts/check-notice-parse.ts`（含线上真实样本）与 `scripts/check-amount-parse.ts`。
 *
 * 【渠道只看来源 App，不看文字】（2026-10-18 事故）支付宝到账通知的标题里出现过推广语「开启收款助手，首页就能查账」，
 * 原来按文字里有没有「收款助手」判微信，这笔 ¥5.40 的支付宝到账被当成微信、只去匹配微信的待支付单，没对上。
 * 现在只按 SmsForwarder 的 [from]（应用包名）判：com.eg.android.AlipayGphone = 支付宝，com.tencent.mm = 微信；
 * 认不出来源的一律不自动取用。
 *
 * 【系统通知格式（防伪造）】有人会在支付宝 / 微信里给收款账号发一条聊天消息「你已成功收款5.40元」，
 * 手机照样弹通知、SmsForwarder 照样转发，来源包名也一样。所以金额必须出现在系统到账通知固定的位置上才自动取用：
 * SmsForwarder 的 [content] 是「[from]\n[title]\n[text]\n…」，标题行就是发消息的人（聊天的话是对方昵称）：
 *  · 支付宝：标题以「已转入余额」开头（线上所有到账都是，如「已转入余额 开启收款助手，首页就能查账>>」），
 *    正文「你已成功收款X元（新顾客消费）」；
 *  · 微信：标题是「微信收款助手」，正文「微信支付收款X元(朋友到店)」或合并后的「[3条]微信收款助手: 微信支付收款X元(…)」。
 * 金额对、格式不对 → bad_template：不自动取用，进「待人工核实的到账」并推送（真到账的话站长核对账单后补单，不会丢钱）。
 */
import type { PayChannel } from './pay-channel'

export type NoticeReject =
  | 'empty'
  | 'broadcast_rejected'
  | 'no_strong_signal'
  | 'ambiguous'
  | 'untrusted_source'
  | 'bad_template'

export type NoticeParse =
  | { ok: true; channel: PayChannel; amount: string }
  | {
      ok: false
      channel: PayChannel | null
      reason: NoticeReject
      /** 通知里能认出的金额（只用于进人工队列 / 告警，绝不用来匹配订单）；ambiguous 时是多个 */
      amounts?: string[]
    }

export const NOTICE_REJECT_LABELS: Record<NoticeReject, string> = {
  empty: '空内容',
  broadcast_rejected: '播报类通知（上一笔金额），已按规则拒绝',
  no_strong_signal: '不是到账通知（没有「你已成功收款X元」/「微信支付收款X元」），未取用',
  ambiguous: '同一条通知出现多个不同的到账金额，未自动取用（请核实后补单）',
  untrusted_source: '通知来源不是支付宝 / 微信 App，未取用',
  bad_template: '金额不在系统到账通知的固定位置上（可能是聊天消息伪造），未自动取用',
}

// ---------------------------------------------------------------------------------------------
// 来源
// ---------------------------------------------------------------------------------------------

const SOURCE_CHANNEL: Record<string, PayChannel> = {
  'com.eg.android.alipaygphone': 'alipay',
  'com.tencent.mm': 'wechat',
}

/** SmsForwarder 的 [from]；没带、或占位符没被替换（字面量 [from]）→ null */
export function normalizeFrom(v?: string | null): string | null {
  const s = (v || '').trim()
  return !s || s === '[from]' ? null : s
}

export function channelOfSource(from: string | null): PayChannel | null {
  if (!from) return null
  return SOURCE_CHANNEL[from.toLowerCase()] ?? null
}

// ---------------------------------------------------------------------------------------------
// 支付宝
// ---------------------------------------------------------------------------------------------

// 支付宝收钱码会发两类通知，只有第二类代表「这一笔钱到账了」：
//   ①「上一笔播报：支付宝到账 1430.00 元。收钱提醒助手正在为您服务」—— 上一笔的金额，必须拒绝；
//   ②「已转入余额 可兑1000收款免费额度>> 你已成功收款1430.00元（老顾客消费）」—— 本次实收金额。
// SmsForwarder 会把 content / org_content / from 拼成一长串，同一金额会出现 2~3 次，只能做「强信号词 + 紧邻金额」的匹配。
const ALIPAY_SIGNAL = /(?:你已成功收款|已成功收款|成功收款)\s*[¥￥]?\s*(\d+(?:\.\d{1,2})?)\s*元/g
// 强信号词前 24 字内出现这些词 → 播报回顾，不是本次到账
const BROADCAST_HINT = /上一笔|上笔播报|历史播报|最近一笔/
// 系统到账通知：**通知文本开头**是包名一行、标题「已转入余额…」一行、紧接着正文「你已成功收款X元」。
// 必须锚在开头：聊天消息的正文可以是多行，不锚的话对方在消息里自己写一遍「包名 / 已转入余额 / 你已成功收款」就能冒充
const ALIPAY_TEMPLATE = /^\s*com\.eg\.android\.alipaygphone[ \t]*\r?\n[ \t]*已转入余额[^\n]*\r?\n[ \t]*你已成功收款\s*[¥￥]?\s*(\d+(?:\.\d{1,2})?)\s*元/i

export type LooseParse = { ok: true; amount: string } | { ok: false; reason: 'empty' | 'broadcast_rejected' | 'no_strong_signal' | 'ambiguous'; amounts?: string[] }

/** 支付宝的「强信号」金额（不看格式）。导出给 scripts/check-amount-parse.ts */
export function parseAlipayLoose(text: string): LooseParse {
  if (!text || !text.trim()) return { ok: false, reason: 'empty' }
  const t = text.replace(/,/g, '')
  ALIPAY_SIGNAL.lastIndex = 0
  let m: RegExpExecArray | null
  let sawStrong = false
  let first: string | null = null
  const seen = new Map<number, string>()
  while ((m = ALIPAY_SIGNAL.exec(t)) !== null) {
    sawStrong = true
    if (BROADCAST_HINT.test(t.slice(Math.max(0, m.index - 24), m.index))) continue
    if (first === null) first = m[1]
    const c = Math.round(Number(m[1]) * 100)
    if (!seen.has(c)) seen.set(c, m[1])
  }
  // 两个不同的「本次到账」金额：备注 / 昵称夹带，或两笔合并成一条 → 转人工。同额不同写法（1430 / 1430.00）照常取用
  if (seen.size > 1) return { ok: false, reason: 'ambiguous', amounts: Array.from(seen.values()) }
  if (first !== null) return { ok: true, amount: first }
  if (sawStrong) return { ok: false, reason: 'broadcast_rejected' }
  if (BROADCAST_HINT.test(t) || /到账|收钱提醒/.test(t)) return { ok: false, reason: 'broadcast_rejected' }
  return { ok: false, reason: 'no_strong_signal' }
}

// ---------------------------------------------------------------------------------------------
// 微信
// ---------------------------------------------------------------------------------------------

// 线上样本（2026-10-18 站长推送）：「[3条]微信收款助手: 微信支付收款0.01元(朋友到店)」
const WECHAT_SIGNAL = /微信支付收款\s*[¥￥]?\s*(\d+(?:\.\d{1,2})?)\s*元/g
// 同样锚在开头：包名一行、标题「微信收款助手」一行、正文「微信支付收款X元」（合并通知前面带「[N条]微信收款助手: 」）
const WECHAT_TEMPLATE =
  /^\s*com\.tencent\.mm[ \t]*\r?\n[ \t]*微信收款助手[ \t]*\r?\n[ \t]*(?:\[\d+条\][ \t]*)?(?:微信收款助手[ \t]*[:：][ \t]*)?微信支付收款\s*[¥￥]?\s*(\d+(?:\.\d{1,2})?)\s*元/i

export function parseWechatLoose(text: string): LooseParse {
  if (!text || !text.trim()) return { ok: false, reason: 'empty' }
  const t = text.replace(/,/g, '')
  WECHAT_SIGNAL.lastIndex = 0
  let m: RegExpExecArray | null
  let first: string | null = null
  const seen = new Map<number, string>()
  while ((m = WECHAT_SIGNAL.exec(t)) !== null) {
    if (first === null) first = m[1]
    const c = Math.round(Number(m[1]) * 100)
    if (!seen.has(c)) seen.set(c, m[1])
  }
  if (seen.size > 1) return { ok: false, reason: 'ambiguous', amounts: Array.from(seen.values()) }
  if (first !== null) return { ok: true, amount: first }
  return { ok: false, reason: 'no_strong_signal' }
}

// ---------------------------------------------------------------------------------------------
// 总入口
// ---------------------------------------------------------------------------------------------

/** 系统到账通知格式（锚在通知文本开头）里的金额（分）；格式不对返回 null */
function templateCents(text: string, channel: PayChannel): number | null {
  const m = (channel === 'alipay' ? ALIPAY_TEMPLATE : WECHAT_TEMPLATE).exec(text.replace(/,/g, ''))
  return m ? Math.round(Number(m[1]) * 100) : null
}

/**
 * content：路由拼好的通知文本（content / org / from 按空格拼接）；from：SmsForwarder 的 [from]（包名）。
 * 只有 ok=true 的金额可以拿去匹配订单。
 */
export function parseNotice(content: string, fromRaw?: string | null): NoticeParse {
  const from = normalizeFrom(fromRaw)
  const channel = channelOfSource(from)
  if (!content || !content.trim()) return { ok: false, channel, reason: 'empty' }
  if (!channel) {
    // 认不出来源：两种写法都试一下，只为告警里能写上金额（真到账的话站长要知道）
    const a = parseAlipayLoose(content)
    const w = parseWechatLoose(content)
    const amounts = [a, w].flatMap((r) => (r.ok ? [r.amount] : r.reason === 'ambiguous' ? r.amounts ?? [] : []))
    return { ok: false, channel: null, reason: 'untrusted_source', ...(amounts.length ? { amounts } : {}) }
  }
  const loose = channel === 'alipay' ? parseAlipayLoose(content) : parseWechatLoose(content)
  if (!loose.ok) return { ok: false, channel, reason: loose.reason, ...(loose.amounts ? { amounts: loose.amounts } : {}) }
  const cents = Math.round(Number(loose.amount) * 100)
  if (templateCents(content, channel) !== cents) return { ok: false, channel, reason: 'bad_template', amounts: [loose.amount] }
  return { ok: true, channel, amount: loose.amount }
}
