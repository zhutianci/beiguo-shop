/**
 * 短信接码 · 下单时的条款同意留痕（docs/短信接码-设计.md §1.8、§8.6、§10.4、§10.5；站长 2026-09-30 需求）。
 *
 * 每一单在下单事务里写一条 sms_events（type = TERMS_AGREED，actor = BUYER），detail 是本函数拼的 JSON：
 *   { terms, walletTerms, ip, ua }
 *   · terms / walletTerms：买家这一单同意的《短信接码服务条款》《余额与充值规则》版本（与 SmsOrder.termsVersion / walletTermsVersion 相同）；
 *   · ip：下单请求的客户端 IP（lib/news/rate-limit.clientIp，nginx 覆盖过的头；拿不到为 null），截到 64 个字符；
 *   · ua：User-Agent 截到 200 个字符（「摘要」：够认出浏览器与设备，又不让一条事件超过列宽 1000）。
 * 同意时间就是事件的 created_at（应用写的时刻）。
 *
 * 【为什么放 sms_events、不加列】刚上线一批表，不再为留痕加 DDL；sms_events 本来就是只追加的审计流水（后台详情可见）。
 * 【保存期】普通接码事件 180 天后清理（api/cron/cleanup），TERMS_AGREED 不清理、随订单记录保存（KEEP_EVENT_TYPES；隐私政策第四节同步写明）。
 *
 * 纯函数，零依赖（check-jiema-terms.ts 直接断言；cleanup 路由与后台详情共用）。
 */

export const TERMS_AGREED_EVENT = 'TERMS_AGREED'

/** 不按 180 天清理的事件类型（随订单记录保存） */
export const KEEP_EVENT_TYPES: readonly string[] = Object.freeze([TERMS_AGREED_EVENT])

export interface ConsentMeta {
  ip?: string | null
  ua?: string | null
}

export interface ConsentDetail {
  terms: string
  walletTerms: string
  ip: string | null
  ua: string | null
}

const IP_MAX = 64
const UA_MAX = 200

function clean(v: string | null | undefined, max: number): string | null {
  if (typeof v !== 'string') return null
  // 控制字符换成空格（UA 是客户端给的，不让它在后台详情里换行或夹带不可见字符）
  // eslint-disable-next-line no-control-regex
  const s = v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim()
  if (!s || s === 'unknown') return null
  return s.length > max ? `${s.slice(0, max - 1)}…` : s
}

/** 拼 TERMS_AGREED 事件的 detail（对象；logEvent 负责 JSON.stringify 与列宽截断） */
export function consentDetail(versions: { terms: string; walletTerms: string }, meta: ConsentMeta | null | undefined): ConsentDetail {
  return { terms: versions.terms, walletTerms: versions.walletTerms, ip: clean(meta?.ip, IP_MAX), ua: clean(meta?.ua, UA_MAX) }
}

/** 解析 TERMS_AGREED 事件的 detail（后台详情用；解析不了返回 null，不抛） */
export function parseConsentDetail(detail: string | null | undefined): ConsentDetail | null {
  if (!detail) return null
  try {
    const d = JSON.parse(detail) as Record<string, unknown>
    if (!d || typeof d !== 'object' || typeof d.terms !== 'string') return null
    return {
      terms: d.terms,
      walletTerms: typeof d.walletTerms === 'string' ? d.walletTerms : '',
      ip: typeof d.ip === 'string' ? d.ip : null,
      ua: typeof d.ua === 'string' ? d.ua : null,
    }
  } catch {
    return null
  }
}
