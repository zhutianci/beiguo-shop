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
 * 【保存期】（与隐私政策「四、保存多久」一致，改之前先改那一页）普通接码事件按 api/cron/cleanup 的 SMS_EVENT_RETENTION_DAYS 清理；
 * TERMS_AGREED 不按它清理（KEEP_EVENT_TYPES），条款版本与同意时间随订单记录保存；其中的 IP 与浏览器标识自下单之日起保存 3 年
 * （CONSENT_META_RETENTION_DAYS，民法典第一百八十八条的普通诉讼时效），到期由 cleanup 调 ./consent-purge.ts 清成 null
 * （个人信息保护法第十九条：保存期限为实现处理目的所必要的最短时间）。
 *
 * 纯函数，零依赖（check-jiema-terms.ts 直接断言；cleanup、后台详情与 ./consent-purge.ts 共用）。
 */

export const TERMS_AGREED_EVENT = 'TERMS_AGREED'

/** 不按接码事件保存期清理的事件类型（条款版本与同意时间随订单记录保存） */
export const KEEP_EVENT_TYPES: readonly string[] = Object.freeze([TERMS_AGREED_EVENT])

/** 同意记录里 IP 与浏览器标识的保存期：自下单之日起 3 年（按 1096 天算，含一个闰日）；到期清成 null，版本与同意时间留着 */
export const CONSENT_META_RETENTION_DAYS = 1096

/** detail 里还带着 IP 或浏览器标识的特征（cleanup 按它圈定要清的行；清过的是 "ip":null / "ua":null，不会再命中） */
export const CONSENT_META_MARKERS: readonly string[] = Object.freeze(['"ip":"', '"ua":"'])

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

/** detail 里是否还带着 IP 或浏览器标识 */
export function hasConsentMeta(detail: string | null | undefined): boolean {
  return !!detail && CONSENT_META_MARKERS.some((m) => detail.includes(m))
}

/**
 * 到期清除：把 detail 里的 ip / ua 清成 null，其余字段（条款版本）原样保留。
 * 解析不了的（理论上没有：detail 由 consentDetail 生成、远小于列宽）按正则把两个值换成 null；换完仍带特征的返回 null（整条清空），
 * 保证 cleanup 下一批不会再圈到同一行。
 */
export function stripConsentMeta(detail: string | null | undefined): string | null {
  if (!detail) return null
  let out: string
  try {
    const d = JSON.parse(detail) as Record<string, unknown>
    out = d && typeof d === 'object' && !Array.isArray(d) ? JSON.stringify({ ...d, ip: null, ua: null }) : detail
  } catch {
    out = detail.replace(/"(ip|ua)":"(?:[^"\\]|\\.)*"?/g, '"$1":null')
  }
  return hasConsentMeta(out) ? null : out
}
