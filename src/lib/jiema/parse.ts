/**
 * 短信接码 · 上游（hero-sms）响应解析与结果判定 —— 纯函数、零依赖，只在服务端用（docs/短信接码-设计.md §6.1、§6.2、§3、§3.1）。
 *
 * 【三层】
 *  1. 结果归一：每个接口的原始响应（HTTP 状态码 + 响应体）→ `Up<T>`（ok / err / unknown / noinfo，§6.2）。
 *     解析顺序：先看 HTTP 状态码 → 响应体以 `{` / `[` / `"` 开头按 JSON 解析（`title` 是错误码；JSON 字符串去掉引号当文本）→
 *     否则按文本匹配 `ACCESS_*`、`STATUS_*`、`NO_NUMBERS`、`WRONG_MAX_PRICE:x`、`BANNED:'…'` 等（调研 §1.2、§1.6）。
 *     数字字段同时兼容字符串和数字；美元一律换成整数「微美元」（1 USD = 1,000,000，不经过浮点乘法）。
 *  2. 取号结果分类 `classifyAcquire`：把 getNumberV2 的 `Up` 映射到 §3 的 E1–E9、E56、E58。
 *     **只有明确列出的错误码才走 E2–E7**；认不出的 4xx、1020、HTML 403 是 REJECTED（请求被拒、上游没成交）；
 *     超时、5xx、200 却缺 activationId / 号码、认不出的 200 一律 UNKNOWN（可能已经买到，绝不重取，附录 B 第 1 条）。
 *  3. 查询 / 放号 / 完成类调用的判定（§3.1 的判定表，附录 B 第 22 条）：只有表里「会改状态」的结果能推进状态机，
 *     其余一律 NOINFO（没有信息）；列表接口出错绝不当作空列表；号码是怎么结束的以 v1 history 为准。
 *
 * 【边界】这里不发请求、不读环境变量、不碰库（HTTP 客户端在 upstream.ts）。`raw` 一律先脱敏再截断到 2000 字
 * （`sanitizeRaw`），上游 `details` 原文只进 raw，绝不给买家看（附录 B 第 7 条）。
 */

// ───────────────────────── 结果归一（§6.2） ─────────────────────────

export type UnknownReason = 'timeout' | 'network' | 'http5xx' | 'parse'

/**
 * `sentAt`：请求**真正离开本进程**的时刻（毫秒，`Date.now()`），由 upstream.ts 在 fetch 之前一刻写入；解析器不写。
 * 本进程没发出去的（NOT_SENT、NO_KEY）没有它。取号的 UNKNOWN 认领时间窗以它为锚（见 upstream.acquireClaimWindow，§2.4）。
 */
export interface UpOk<T> {
  kind: 'ok'
  data: T
  raw: string
  sentAt?: number
}
/**
 * 上游明确给出的错误（或本进程明确「没有发出去」的 NOT_SENT / NO_KEY，http=0）。
 * `data` 只在 code=CURRENCY 时有：币种不是 840 的成功响应照样把解析结果带出来——取号时号码其实已经买到，
 * 引擎要把它记下来（E56「已取到的号照常服务」），不能因为返回了 err 就把号丢成孤儿。
 */
export interface UpErr<T = never> {
  kind: 'err'
  code: string
  http: number
  info?: Record<string, unknown>
  retryAfterSec?: number
  raw: string
  data?: T
  sentAt?: number
}
export interface UpUnknown {
  kind: 'unknown'
  reason: UnknownReason
  raw: string
  http?: number
  sentAt?: number
}
/** 只读调用拿到 2xx、但形态认不出（例如 getStatusV2 未文档化的等码形态）。按「无变化」处理，**不计入熔断** */
export interface UpNoinfo {
  kind: 'noinfo'
  raw: string
  http?: number
  sentAt?: number
}
export type Up<T> = UpOk<T> | UpErr<T> | UpUnknown | UpNoinfo

/** 解析函数的输入：HTTP 状态码、响应体原文、Retry-After 头（可空） */
export interface HttpIn {
  http: number
  body: string
  retryAfter?: string | null
}

// ───────────────────────── 脱敏与截断（§6.2、§10.2） ─────────────────────────

export const RAW_MAX = 2000

/**
 * 去掉 key：`api_key=…`（兼容协议的 URL 参数）、`ApiKey …`（v1 请求头）、JSON 里的 `"api_key":"…"`，
 * 以及调用方给出的密钥原文（upstream.ts 传入 HEROSMS_API_KEY，上游万一把 URL 回显进报错页也挡得住）。
 */
export function redact(s: string, secrets: readonly string[] = []): string {
  let out = s
  for (const k of secrets) {
    if (k) out = out.split(k).join('***')
  }
  return out
    .replace(/(api[_-]?key=)[^&\s"'<>#]*/gi, '$1***')
    .replace(/("api[_-]?key"\s*:\s*")[^"]*/gi, '$1***')
    .replace(/(\bApiKey\s+)[^\s"'<>,;]+/gi, '$1***')
}

/** 存进 `attempt.raw` / 日志之前：先脱敏、再截断到 2000 字（先截断会留下半截 key）；去掉 NUL 与被截断的半个代理对 */
export function sanitizeRaw(s: string, secrets: readonly string[] = []): string {
  // 目录接口的响应有几 MB：先粗截到 RAW_MAX + 512（任何一个从前 2000 字里开始的 key 都完整落在这一段里），再脱敏、再精截
  const cut = s.length > RAW_MAX + 512
  let out = redact(cut ? s.slice(0, RAW_MAX + 512) : s, secrets).replace(/\u0000/g, '')
  if (cut || out.length > RAW_MAX) {
    out = out.slice(0, RAW_MAX - 1)
    const last = out.charCodeAt(out.length - 1)
    if (last >= 0xd800 && last <= 0xdbff) out = out.slice(0, -1)
    out += '…'
  }
  return out
}

// ───────────────────────── 基础换算 ─────────────────────────

/** 微美元上界（$1,000,000）：再大就不是价格或余额了，按「认不出」处理 */
const MICRO_MAX = 1_000_000_000_000

/**
 * 美元（数字或数字字符串，例如 0.1195、"0.0480"、"12.4422"）→ 整数微美元；负数、非数字、超界返回 null。
 * 按十进制字符串逐位换算，不做浮点乘法（0.1195 × 1e6 在浮点里是 119499.99…）；第 7 位小数起四舍五入。
 */
export function usdToMicro(v: unknown): number | null {
  let s: string
  if (typeof v === 'number') {
    if (!Number.isFinite(v) || v < 0) return null
    s = String(v)
    if (/e/i.test(s)) s = v.toFixed(10)
  } else if (typeof v === 'string') {
    s = v.trim()
  } else {
    return null
  }
  const m = s.match(/^\+?(\d{1,13})(?:\.(\d*))?$/) || s.match(/^\+?()\.(\d+)$/)
  if (!m) return null
  const intPart = m[1] ? Number(m[1]) : 0
  const frac = (m[2] || '').padEnd(7, '0')
  let micro = intPart * 1_000_000 + Number(frac.slice(0, 6))
  if (Number(frac[6]) >= 5) micro += 1
  if (!Number.isSafeInteger(micro) || micro > MICRO_MAX) return null
  return micro
}

/** 微美元 → 上游要的 4 位小数美元字符串（maxPrice）。向下取到 0.0001，不经过浮点 */
export function microToUsd4(micro: number): string {
  if (!Number.isSafeInteger(micro) || micro < 0) throw new RangeError('microToUsd4: 需要非负整数微美元')
  const unit = Math.floor(micro / 100) // 0.0001 美元
  return `${Math.floor(unit / 10000)}.${String(unit % 10000).padStart(4, '0')}`
}

/** 整数（数字或数字字符串）；否则 null */
export function toInt(v: unknown): number | null {
  if (typeof v === 'number') return Number.isSafeInteger(v) ? v : null
  if (typeof v === 'string' && /^-?\d{1,15}$/.test(v.trim())) return Number(v.trim())
  return null
}

/** 布尔：true / false、1 / 0、"1" / "0"、"true" / "false"（canGetAnotherSms 两种写法都有，调研 §1.6 第 4 条）；否则 null */
export function toBool(v: unknown): boolean | null {
  if (v === true || v === 1 || v === '1' || v === 'true') return true
  if (v === false || v === 0 || v === '0' || v === 'false') return false
  return null
}

/**
 * 只认**带时区**的时间（结尾 Z 或 ±hh:mm / ±hhmm），例如 "2026-09-28T11:41:10.000000Z"、"2026-02-18T18:11:23+00:00"。
 * 没有时区的（getActiveActivations 的 "2022-06-01 16:59:16"、规格示例里 history 的 "2025-03-18 10:40:37"）返回 null：
 * 不能拿来算截止时间或认领时间窗（调研 §1.6 第 9 条、附录 B 第 12 条）。
 * **日历字段逐项校验**：月 1–12、日不超过当月天数（闰年照算）、时 0–23、分 / 秒 0–59、时区偏移 ≤ ±14:59、年份 1970–9999；
 * 任何一项不合法返回 null（`new Date()` 会把 2 月 30 日、24:00 悄悄进位成别的时刻，拿去当截止或认领时间就错了）。
 */
export function parseTzDate(v: unknown): Date | null {
  if (typeof v !== 'string') return null
  const m = v.trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d+))?\s*(Z|([+-])(\d{2}):?(\d{2}))$/i)
  if (!m) return null
  const [y, mo, d, h, mi] = [m[1], m[2], m[3], m[4], m[5]].map(Number)
  const s = m[6] ? Number(m[6]) : 0
  const ms = Number((m[7] || '').padEnd(3, '0').slice(0, 3))
  if (y < 1970 || mo < 1 || mo > 12 || d < 1 || h > 23 || mi > 59 || s > 59) return null
  const daysInMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate()
  if (d > daysInMonth) return null
  let offsetMin = 0
  if (m[8].toUpperCase() !== 'Z') {
    const oh = Number(m[10])
    const om = Number(m[11])
    if (oh > 14 || om > 59) return null
    offsetMin = (m[9] === '-' ? -1 : 1) * (oh * 60 + om)
  }
  const t = Date.UTC(y, mo - 1, d, h, mi, s, ms) - offsetMin * 60_000
  return Number.isFinite(t) ? new Date(t) : null
}

/** 激活 id：数字或数字字符串（1–20 位）；否则 null */
export function toActivationId(v: unknown): string | null {
  if (typeof v === 'number' && Number.isSafeInteger(v) && v > 0) return String(v)
  if (typeof v === 'string' && /^\d{1,20}$/.test(v.trim())) return v.trim()
  return null
}

/** 号码：只留数字（不带 +），6–20 位；打码的（`79584******`）或太短返回 null */
export function toPhone(v: unknown): string | null {
  if (typeof v !== 'string' && typeof v !== 'number') return null
  if (typeof v === 'number' && !Number.isSafeInteger(v)) return null
  const s = String(v).trim()
  if (/[*xX]/.test(s)) return null
  const d = s.replace(/\D/g, '')
  return d.length >= 6 && d.length <= 20 ? d : null
}

/** 国家 / 地区 id：0–999 的整数 */
function toCountry(v: unknown): number | null {
  const n = toInt(v)
  return n != null && n >= 0 && n <= 999 ? n : null
}

function str(v: unknown): string | null {
  return typeof v === 'string' ? v : typeof v === 'number' && Number.isFinite(v) ? String(v) : null
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

// ───────────────────────── 响应体分类 ─────────────────────────

export type Body =
  | { t: 'json'; v: unknown } // 对象 / 数组 / 数字 / 布尔 / null
  | { t: 'text'; s: string } // 纯文本（JSON 字符串去掉引号后也算），已 trim
  | { t: 'empty' }
  | { t: 'html' }
  | { t: 'bad' } // 以 { [ " 开头却不是合法 JSON（被截断、乱码）

export function readBody(body: string): Body {
  const s = body.replace(/^﻿/, '').trim()
  if (!s) return { t: 'empty' }
  const c = s[0]
  if (c === '{' || c === '[' || c === '"') {
    try {
      const v: unknown = JSON.parse(s)
      if (typeof v === 'string') return v.trim() ? { t: 'text', s: v.trim() } : { t: 'empty' }
      return { t: 'json', v }
    } catch {
      return { t: 'bad' }
    }
  }
  if (c === '<' || /<(html|body|head|title)[\s>]/i.test(s.slice(0, 1000))) return { t: 'html' }
  if (s.length >= 2 && c === "'" && s.endsWith("'")) {
    const inner = s.slice(1, -1).trim()
    return inner ? { t: 'text', s: inner } : { t: 'empty' }
  }
  return { t: 'text', s }
}

/** 错误码的形状：大写字母开头的 UPPER_SNAKE */
const CODE_RE = /^[A-Z][A-Z0-9_]{1,63}$/

/** JSON 错误体里的错误码：`title`（hero 的规范写法）；v1 的 "Unauthenticated." 归一成 UNAUTHENTICATED；旧式 `{"status":"error","error":"X"}` 取 X */
export function jsonErrCode(v: unknown): string | null {
  if (!isObj(v)) return null
  const norm = (t: string): string | null => {
    const x = t.trim().replace(/\.$/, '').trim()
    if (!x || x.length > 64 || !/^[A-Za-z][A-Za-z0-9_ ]*$/.test(x)) return null
    return x.toUpperCase().replace(/ +/g, '_')
  }
  if (typeof v.title === 'string') return norm(v.title)
  if (v.status === 'error' && typeof v.error === 'string') return norm(v.error)
  if (typeof v.message === 'string' && /^unauthenticated\.?$/i.test(v.message.trim())) return 'UNAUTHENTICATED'
  return null
}

function jsonInfo(v: unknown): Record<string, unknown> | undefined {
  if (!isObj(v) || !isObj(v.info)) return undefined
  return { ...v.info }
}

function retryAfterOf(info: Record<string, unknown> | undefined, header?: string | null): number | undefined {
  const fromInfo = info ? toInt(info.retry_after_seconds) : null
  if (fromInfo != null && fromInfo >= 0) return fromInfo
  if (header && /^\d{1,7}$/.test(header.trim())) return Number(header.trim())
  return undefined
}

function mkErr<T = never>(code: string, http: number, raw: string, info?: Record<string, unknown>, retryAfterSec?: number): UpErr<T> {
  const e: UpErr<T> = { kind: 'err', code, http, raw }
  if (info && Object.keys(info).length) e.info = info
  if (retryAfterSec != null) e.retryAfterSec = retryAfterSec
  return e
}

/**
 * 文本形态的错误：`CODE` 或 `CODE:参数`（`WRONG_MAX_PRICE:0.025`、`BANNED:'2026-2-13 12-00-00'`）。
 * 参数进 info：WRONG_MAX_PRICE → `{ min }`；BANNED → `{ readable }`。NO_ACTIVATION（SMS-Activate 旧写法）归一成 NOT_FOUND。
 */
function textErr(s: string, http: number, raw: string, retryAfter?: string | null): UpErr | null {
  const m = s.match(/^([A-Z][A-Z0-9_]{1,63})(?::\s*'?(.*?)'?)?$/)
  if (!m) return null
  let code = m[1]
  const arg = m[2]
  let info: Record<string, unknown> | undefined
  if (code === 'NO_ACTIVATION') code = 'NOT_FOUND'
  if (code === 'WRONG_MAX_PRICE' && arg) info = { min: arg }
  if (code === 'BANNED' && arg) info = { readable: arg }
  return mkErr(code, http, raw, info, retryAfterOf(info, retryAfter))
}

/**
 * HTTP 层的统一判定（每个接口先过这里）：
 *  - 5xx → unknown(http5xx)，不管响应体（E9、E20、E57）；
 *  - 4xx：JSON 带错误码 → err(该码)；文本是错误码 → err(该码)；带 1020 的、HTML 页、认不出的 → err(REJECTED)（E58），info.cause 记原因；
 *    429 认不出码时归一成 RATE_LIMIT；
 *  - 1xx / 3xx 等 → unknown(parse)（客户端不跟随跳转）；
 *  - 2xx → 交给各接口自己解析。
 */
function httpLayer(inp: HttpIn, raw: string): { done: UpErr | UpUnknown } | { body: Body } {
  const { http } = inp
  if (http >= 500 && http <= 599) return { done: { kind: 'unknown', reason: 'http5xx', raw, http } }
  if (http >= 400 && http <= 499) {
    const b = readBody(inp.body)
    if (b.t === 'json') {
      const code = jsonErrCode(b.v)
      if (code) {
        const info = jsonInfo(b.v)
        return { done: mkErr(code, http, raw, info, retryAfterOf(info, inp.retryAfter)) }
      }
    }
    if (b.t === 'text') {
      const e = textErr(b.s, http, raw, inp.retryAfter)
      if (e) return { done: e }
      if (/\b1020\b/.test(b.s)) return { done: mkErr('REJECTED', http, raw, { cause: '1020' }, retryAfterOf(undefined, inp.retryAfter)) }
    }
    if (http === 429) return { done: mkErr('RATE_LIMIT', http, raw, { cause: 'unrecognized' }, retryAfterOf(undefined, inp.retryAfter)) }
    const cause = b.t === 'html' ? (/\b1020\b/.test(inp.body) ? '1020' : http === 403 ? 'html403' : 'html') : 'unrecognized'
    return { done: mkErr('REJECTED', http, raw, { cause }, retryAfterOf(undefined, inp.retryAfter)) }
  }
  if (http < 200 || http > 299) return { done: { kind: 'unknown', reason: 'parse', raw, http } }
  return { body: readBody(inp.body) }
}

const noinfo = (raw: string, http: number): UpNoinfo => ({ kind: 'noinfo', raw, http })

/** 2xx 的 JSON 里带了错误码（规格外，但兼容）→ err；否则 null */
function jsonErrIn2xx(b: Body, http: number, raw: string, retryAfter?: string | null): UpErr | null {
  if (b.t !== 'json') return null
  const code = jsonErrCode(b.v)
  if (!code) return null
  const info = jsonInfo(b.v)
  return mkErr(code, http, raw, info, retryAfterOf(info, retryAfter))
}

/**
 * 带金额的成功响应必须是美元（currency == 840，E56）。字段缺省（undefined / null / 空串）按规格默认 840；
 * 存在但不是 840 → 返回那个值；**认不出的（"RUB"、"USD"、小数、对象…）→ −1，同样是币种异常**。
 * 取号、活跃列表、history 三处共用这一个口径（定价与对账只接受 840）。
 */
export const USD = 840
export function badCurrency(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null
  const n = toInt(v)
  return n === USD ? null : n ?? -1
}

// ───────────────────────── 通用类型 ─────────────────────────

/** 一条短信（getAllSms、getStatusV2、NEW_OTP_RECEIVED 的 info.data、v1 otpList 统一成这个形状） */
export interface OtpItem {
  id: string | null
  from: string | null
  code: string | null
  text: string | null
  service: string | null
  /** 带时区才有值 */
  date: Date | null
  type: string // sms | call
}

export function parseOtpItem(v: unknown): OtpItem | null {
  if (!isObj(v)) return null
  const code = str(v.code ?? v.smsCode)
  const text = str(v.text ?? v.smsText)
  const id = str(v.id)
  if (id == null && code == null && text == null) return null
  return {
    id,
    from: str(v.phoneFrom ?? v.from),
    code: code != null && code.trim() ? code.trim() : null,
    text: text != null && text.trim() ? text : null,
    service: str(v.service),
    date: parseTzDate(v.date ?? v.receivedAt),
    type: typeof v.type === 'string' && v.type ? v.type : 'sms',
  }
}

function parseOtpList(v: unknown): OtpItem[] {
  if (!Array.isArray(v)) return []
  const out: OtpItem[] = []
  for (const x of v) {
    const o = parseOtpItem(x)
    if (o) out.push(o)
  }
  return out
}

// ───────────────────────── getBalance ─────────────────────────

export interface BalanceData {
  balanceMicro: number
}

/** `ACCESS_BALANCE:12.4422`（美元） */
export function parseBalance(inp: HttpIn): Up<BalanceData> {
  const raw = sanitizeRaw(inp.body)
  const h = httpLayer(inp, raw)
  if ('done' in h) return h.done
  const b = h.body
  if (b.t === 'text') {
    const m = b.s.match(/^ACCESS_BALANCE[:|]\s*(\S+)$/)
    if (m) {
      const micro = usdToMicro(m[1])
      return micro == null ? noinfo(raw, inp.http) : { kind: 'ok', data: { balanceMicro: micro }, raw }
    }
    return textErr(b.s, inp.http, raw, inp.retryAfter) ?? noinfo(raw, inp.http)
  }
  return jsonErrIn2xx(b, inp.http, raw, inp.retryAfter) ?? noinfo(raw, inp.http)
}

// ───────────────────────── getNumberV2（取号，写调用） ─────────────────────────

export interface NumberData {
  activationId: string
  /** 不带 + */
  phone: string
  /** 上游实扣价（activationCost）；文本形态 ACCESS_NUMBER 拿不到 → null */
  costMicro: number | null
  currency: number | null
  countryCode: number | null
  /** 区号，不带 + */
  dialCode: string | null
  canGetAnotherSms: boolean | null
  activationTime: Date | null
  /** 有效期截止（带时区）；无效时引擎按「响应时刻 + 20 分钟 − 30 秒」兜底（E16） */
  activationEndTime: Date | null
  operator: string | null
  verificationType: string | null
  status: number | null
  /** 文本形态 `ACCESS_NUMBER:<id>:<phone>`（没有成本、币种、有效期） */
  textForm: boolean
}

/** 取号返回 2xx 文本时，这些码说明请求被明确拒绝、没有成交（文档 + 官网前端处理的码）；其余认不出的 2xx 文本一律 unknown */
const ACQUIRE_TEXT_ERRORS = new Set([
  'NO_NUMBERS',
  'NO_BALANCE',
  'BAD_BALANCE',
  'BAD_KEY',
  'NO_KEY',
  'BAD_ACTION',
  'BAD_SERVICE',
  'BAD_COUNTRY',
  'SERVICE_NOT_AVAILABLE',
  'CHANNELS_LIMIT',
  'ACCOUNT_INACTIVE',
  'WRONG_MAX_PRICE',
  'BANNED',
  'WRONG_EXCEPTION_PHONE',
  'NOT_AVAILABLE',
  'WHATSAPP_NOT_AVAILABLE',
])

function numberFromJson(v: Record<string, unknown>): NumberData | null {
  const activationId = toActivationId(v.activationId ?? v.id)
  const phone = toPhone(v.phoneNumber ?? v.phone ?? v.number)
  if (!activationId || !phone) return null
  const dial = toInt(v.countryPhoneCode)
  const cur = toInt(v.currency)
  return {
    activationId,
    phone,
    costMicro: usdToMicro(v.activationCost ?? v.cost ?? v.price),
    currency: cur,
    countryCode: toCountry(v.countryCode ?? v.country),
    dialCode: dial != null && dial > 0 ? String(dial) : null,
    canGetAnotherSms: toBool(v.canGetAnotherSms),
    activationTime: parseTzDate(v.activationTime),
    activationEndTime: parseTzDate(v.activationEndTime),
    operator: typeof v.activationOperator === 'string' ? v.activationOperator : typeof v.operator === 'string' ? v.operator : null,
    verificationType: typeof v.verificationType === 'string' ? v.verificationType : null,
    status: toInt(v.status),
    textForm: false,
  }
}

/**
 * 取号（getNumberV2）。**取号的 unknown 就是 UNKNOWN**：超时、5xx、200 却缺 activationId 或号码、认不出的 200、空响应体。
 * 认不出的 4xx、1020、HTML 403 → err(REJECTED)（请求被拒、上游没成交，E58）。币种不是 840 → err(CURRENCY) 且带 data（号码已买到）。
 */
export function parseGetNumberV2(inp: HttpIn): Up<NumberData> {
  const raw = sanitizeRaw(inp.body)
  const h = httpLayer(inp, raw)
  if ('done' in h) return h.done
  const b = h.body
  if (b.t === 'json' && isObj(b.v)) {
    const data = numberFromJson(b.v)
    if (data) {
      const bad = badCurrency(b.v.currency)
      if (bad != null) return { ...mkErr<NumberData>('CURRENCY', inp.http, raw, { currency: bad }), data }
      return { kind: 'ok', data, raw }
    }
    const code = jsonErrCode(b.v)
    if (code && ACQUIRE_TEXT_ERRORS.has(code)) {
      const info = jsonInfo(b.v)
      return mkErr(code, inp.http, raw, info, retryAfterOf(info, inp.retryAfter))
    }
    return { kind: 'unknown', reason: 'parse', raw, http: inp.http }
  }
  if (b.t === 'text') {
    const m = b.s.match(/^ACCESS_NUMBER[:|](\d{1,20})[:|]\+?(\d{6,20})$/)
    if (m) {
      return {
        kind: 'ok',
        raw,
        data: {
          activationId: m[1],
          phone: m[2],
          costMicro: null,
          currency: null,
          countryCode: null,
          dialCode: null,
          canGetAnotherSms: null,
          activationTime: null,
          activationEndTime: null,
          operator: null,
          verificationType: null,
          status: null,
          textForm: true,
        },
      }
    }
    const e = textErr(b.s, inp.http, raw, inp.retryAfter)
    if (e && ACQUIRE_TEXT_ERRORS.has(e.code)) return e
  }
  return { kind: 'unknown', reason: 'parse', raw, http: inp.http }
}

// ───────────────────────── getStatus / getStatusV2 ─────────────────────────

export type StatusData =
  | { s: 'WAIT_CODE' }
  | { s: 'WAIT_RESEND' }
  | { s: 'WAIT_RETRY'; code: string }
  | { s: 'OK'; code: string }
  | { s: 'CANCEL' }

/** getStatus（单查；状态枚举有完整文档）：`STATUS_WAIT_CODE / WAIT_RETRY:x / WAIT_RESEND / CANCEL / OK:x` */
export function parseGetStatus(inp: HttpIn): Up<StatusData> {
  const raw = sanitizeRaw(inp.body)
  const h = httpLayer(inp, raw)
  if ('done' in h) return h.done
  const b = h.body
  if (b.t === 'text') {
    const s = b.s
    if (s === 'STATUS_WAIT_CODE') return { kind: 'ok', data: { s: 'WAIT_CODE' }, raw }
    if (s === 'STATUS_WAIT_RESEND') return { kind: 'ok', data: { s: 'WAIT_RESEND' }, raw }
    if (s === 'STATUS_CANCEL') return { kind: 'ok', data: { s: 'CANCEL' }, raw }
    let m = s.match(/^STATUS_WAIT_RETRY[:|]([\s\S]+)$/)
    if (m && m[1].trim()) return { kind: 'ok', data: { s: 'WAIT_RETRY', code: m[1].trim() }, raw }
    m = s.match(/^STATUS_OK[:|]([\s\S]+)$/)
    if (m && m[1].trim()) return { kind: 'ok', data: { s: 'OK', code: m[1].trim() }, raw }
    if (/^STATUS_/.test(s)) return noinfo(raw, inp.http) // STATUS_OK 不带码、没见过的 STATUS_*：认不出
    return textErr(s, inp.http, raw, inp.retryAfter) ?? noinfo(raw, inp.http)
  }
  return jsonErrIn2xx(b, inp.http, raw, inp.retryAfter) ?? noinfo(raw, inp.http)
}

export type StatusV2Data = { s: 'SMS'; sms: OtpItem; verificationType: string | null } | { s: 'CANCEL' }

/**
 * getStatusV2（只作补充，不据它判状态，D10、D17）：JSON `{verificationType, data:{…}}` 有短信 → SMS；纯文本 `STATUS_CANCEL` → CANCEL；
 * 其余（包括还在等码时未文档化的形态，调研 U5）一律 noinfo。
 */
export function parseGetStatusV2(inp: HttpIn): Up<StatusV2Data> {
  const raw = sanitizeRaw(inp.body)
  const h = httpLayer(inp, raw)
  if ('done' in h) return h.done
  const b = h.body
  if (b.t === 'text') {
    if (b.s === 'STATUS_CANCEL') return { kind: 'ok', data: { s: 'CANCEL' }, raw }
    if (/^STATUS_/.test(b.s)) return noinfo(raw, inp.http)
    return textErr(b.s, inp.http, raw, inp.retryAfter) ?? noinfo(raw, inp.http)
  }
  if (b.t === 'json' && isObj(b.v)) {
    const sms = parseOtpItem(b.v.data)
    if (sms && (sms.code != null || sms.text != null)) {
      return { kind: 'ok', data: { s: 'SMS', sms, verificationType: typeof b.v.verificationType === 'string' ? b.v.verificationType : null }, raw }
    }
  }
  return jsonErrIn2xx(b, inp.http, raw, inp.retryAfter) ?? noinfo(raw, inp.http)
}

// ───────────────────────── setStatus / cancelActivation / finishActivation ─────────────────────────

export type SetStatusResult = 'ACCESS_CANCEL' | 'ACCESS_ACTIVATION' | 'ACCESS_RETRY_GET' | 'ACCESS_READY' | 'NO_CONTENT'
export interface SetStatusData {
  result: SetStatusResult
}

/** 放号 / 完成的 409 码（规格）；文本形态出现也按错误认（SMS-Activate 的老写法） */
const RELEASE_TEXT_ERRORS = new Set([
  'EARLY_CANCEL_DENIED',
  'OTP_RECEIVED',
  'FREE_CANCELLATION_EXPIRED',
  'NEW_OTP_RECEIVED',
  'ACTIVATION_NOT_ACTIVE',
  'NOT_FOUND',
  'BAD_STATUS',
  'BAD_KEY',
  'NO_KEY',
  'BAD_ACTION',
  'NO_BALANCE',
  'ACCOUNT_INACTIVE',
  'BANNED',
])

/**
 * setStatus（3 / 6 / 8）与 finishActivation / cancelActivation：`ACCESS_CANCEL` / `ACCESS_ACTIVATION` / `ACCESS_RETRY_GET`，或 **HTTP 204**（NO_CONTENT）。
 * 200 空响应体不算 204（写调用的空 200 语义不明，按 noinfo，下一轮重试会拿到确定结果）。
 */
export function parseSetStatus(inp: HttpIn): Up<SetStatusData> {
  const raw = sanitizeRaw(inp.body)
  const h = httpLayer(inp, raw)
  if ('done' in h) return h.done
  const b = h.body
  if (inp.http === 204) return { kind: 'ok', data: { result: 'NO_CONTENT' }, raw }
  if (b.t === 'text') {
    const s = b.s
    if (s === 'ACCESS_CANCEL' || s === 'ACCESS_ACTIVATION' || s === 'ACCESS_RETRY_GET' || s === 'ACCESS_READY') {
      return { kind: 'ok', data: { result: s }, raw }
    }
    const e = textErr(s, inp.http, raw, inp.retryAfter)
    if (e && RELEASE_TEXT_ERRORS.has(e.code)) return e
    return noinfo(raw, inp.http)
  }
  return jsonErrIn2xx(b, inp.http, raw, inp.retryAfter) ?? noinfo(raw, inp.http)
}

// ───────────────────────── getActiveActivations（批量查码主力） ─────────────────────────

export interface ActiveItem {
  activationId: string
  service: string | null
  phone: string | null
  costMicro: number | null
  currency: number | null
  /** activationStatus（"4" 等码、"2" 已收码…，调研 §1.5；只作参考） */
  status: number | null
  smsCode: string | null
  smsText: string | null
  /** 原文。**没有时区**，不能用来算截止时间（调研 §1.6 第 9 条），所以不给 Date */
  activationTimeText: string | null
  countryCode: number | null
  canGetAnotherSms: boolean | null
  verificationType: string | null
}

export interface ActivePage {
  items: ActiveItem[]
  /** 这一页上游给了几条（翻页终止条件：某页少于 limit 条才算拉全） */
  count: number
}

function activeItem(v: unknown): ActiveItem | null {
  if (!isObj(v)) return null
  const activationId = toActivationId(v.activationId ?? v.id)
  if (!activationId) return null
  const code = str(v.smsCode)
  const text = str(v.smsText)
  return {
    activationId,
    service: str(v.serviceCode ?? v.service),
    phone: toPhone(v.phoneNumber ?? v.phone),
    costMicro: usdToMicro(v.activationCost),
    currency: toInt(v.currency),
    status: toInt(v.activationStatus),
    smsCode: code != null && code.trim() ? code.trim() : null,
    smsText: text != null && text.trim() ? text : null,
    activationTimeText: str(v.activationTime),
    countryCode: toCountry(v.countryCode),
    canGetAnotherSms: toBool(v.canGetAnotherSms),
    verificationType: str(v.verificationType),
  }
}

/**
 * getActiveActivations 的两种形状都兼容（调研 §1.2）：`{"status":"success","data":[…]}`，以及实测空列表时的
 * `{"status":"success","data":[],"activeActivations":{…,"rows":[]}}`（`activeActivations` 本身是数组的旧写法也认）。
 * **列表出错绝不当作空列表**：status 有值却不是 success、哪条记录缺 activationId、既没有 data 数组也没有 rows → noinfo
 * （旧式 `{"status":"error","error":"NO_ACTIVATIONS"}` → err，同样不是「空」）。没有 status 字段、但 data 是数组的，按规格 schema 认。
 */
export function parseActiveActivations(inp: HttpIn): Up<ActivePage> {
  const raw = sanitizeRaw(inp.body)
  const h = httpLayer(inp, raw)
  if ('done' in h) return h.done
  const b = h.body
  if (b.t === 'json' && isObj(b.v)) {
    const o = b.v
    const errCode = jsonErrCode(o)
    if (errCode) return mkErr(errCode, inp.http, raw, jsonInfo(o))
    if (o.status !== undefined && o.status !== 'success') return noinfo(raw, inp.http)
    const aa = o.activeActivations
    const rows = Array.isArray(aa) ? aa : isObj(aa) && Array.isArray(aa.rows) ? aa.rows : null
    let arr: unknown[] | null = null
    if (Array.isArray(o.data) && o.data.length > 0) arr = o.data
    else if (rows && rows.length > 0) arr = rows
    else if (Array.isArray(o.data)) arr = o.data
    else if (rows) arr = rows
    if (!arr) return noinfo(raw, inp.http)
    const items: ActiveItem[] = []
    let bad: { currency: number; activationId: string } | null = null
    for (const x of arr) {
      const it = activeItem(x)
      if (!it) return noinfo(raw, inp.http)
      items.push(it)
      const bc = badCurrency((x as Record<string, unknown>).currency) // 与取号同一口径：认不出的币种（"RUB"）也是异常
      if (bc != null && !bad) bad = { currency: bc, activationId: it.activationId }
    }
    const page: ActivePage = { items, count: arr.length }
    if (bad) return { ...mkErr<ActivePage>('CURRENCY', inp.http, raw, { currency: bad.currency, activationId: bad.activationId }), data: page }
    return { kind: 'ok', data: page, raw }
  }
  if (b.t === 'text') return textErr(b.s, inp.http, raw, inp.retryAfter) ?? noinfo(raw, inp.http)
  return noinfo(raw, inp.http)
}

// ───────────────────────── getAllSms ─────────────────────────

export interface AllSmsData {
  items: OtpItem[]
  total: number | null
}

/** getAllSms：`{"data":[…],"meta":{"total":n}}`；取消或退款后是 409 ACTIVATION_NOT_ACTIVE（err，交给 §3.1 查 history） */
export function parseAllSms(inp: HttpIn): Up<AllSmsData> {
  const raw = sanitizeRaw(inp.body)
  const h = httpLayer(inp, raw)
  if ('done' in h) return h.done
  const b = h.body
  if (b.t === 'json' && isObj(b.v) && Array.isArray(b.v.data)) {
    const items: OtpItem[] = []
    for (const x of b.v.data) {
      const o = parseOtpItem(x)
      if (!o) return noinfo(raw, inp.http)
      items.push(o)
    }
    const total = isObj(b.v.meta) ? toInt(b.v.meta.total) : null
    return { kind: 'ok', data: { items, total }, raw }
  }
  if (b.t === 'text') return textErr(b.s, inp.http, raw, inp.retryAfter) ?? noinfo(raw, inp.http)
  return jsonErrIn2xx(b, inp.http, raw, inp.retryAfter) ?? noinfo(raw, inp.http)
}

// ───────────────────────── 目录：getPrices / getServicesList / getCountries / getOperators ─────────────────────────

export interface PriceCell {
  costMicro: number
  count: number
  physicalCount: number | null
}
/** `{国家id: {服务: {cost, count, physicalCount}}}`（cost = retail，count = 任意价库存，调研 §3.2） */
export type PricesData = Record<number, Record<string, PriceCell>>

export function parsePrices(inp: HttpIn): Up<PricesData> {
  const raw = sanitizeRaw(inp.body)
  const h = httpLayer(inp, raw)
  if ('done' in h) return h.done
  const b = h.body
  if (b.t === 'json' && isObj(b.v)) {
    const o = b.v
    if (o.status === 'false' || o.status === false) {
      const msg = typeof o.msg === 'string' ? o.msg : ''
      const code = /country/i.test(msg) ? 'BAD_COUNTRY' : /service/i.test(msg) ? 'BAD_SERVICE' : 'REJECTED'
      return mkErr(code, inp.http, raw)
    }
    const errCode = jsonErrCode(o)
    if (errCode) return mkErr(errCode, inp.http, raw, jsonInfo(o))
    const out: PricesData = {}
    for (const [cid, svcs] of Object.entries(o)) {
      const c = toCountry(cid)
      if (c == null || !isObj(svcs)) return noinfo(raw, inp.http)
      const row: Record<string, PriceCell> = {}
      for (const [svc, cell] of Object.entries(svcs)) {
        if (!isObj(cell)) return noinfo(raw, inp.http)
        const costMicro = usdToMicro(cell.cost)
        const count = toInt(cell.count)
        if (costMicro == null || count == null) return noinfo(raw, inp.http)
        row[svc] = { costMicro, count, physicalCount: toInt(cell.physicalCount) }
      }
      out[c] = row
    }
    return { kind: 'ok', data: out, raw }
  }
  if (b.t === 'text') return textErr(b.s, inp.http, raw, inp.retryAfter) ?? noinfo(raw, inp.http)
  return noinfo(raw, inp.http)
}

export interface ServiceRow {
  code: string
  /** 去掉首尾空格（`acz` 实测是 "Claude "） */
  name: string
}

export function parseServicesList(inp: HttpIn): Up<ServiceRow[]> {
  const raw = sanitizeRaw(inp.body)
  const h = httpLayer(inp, raw)
  if ('done' in h) return h.done
  const b = h.body
  if (b.t === 'json' && isObj(b.v) && Array.isArray(b.v.services)) {
    const out: ServiceRow[] = []
    for (const x of b.v.services) {
      if (!isObj(x) || typeof x.code !== 'string' || !x.code.trim()) return noinfo(raw, inp.http)
      out.push({ code: x.code.trim(), name: typeof x.name === 'string' ? x.name.trim() : x.code.trim() })
    }
    return { kind: 'ok', data: out, raw }
  }
  if (b.t === 'text') return textErr(b.s, inp.http, raw, inp.retryAfter) ?? noinfo(raw, inp.http)
  return jsonErrIn2xx(b, inp.http, raw, inp.retryAfter) ?? noinfo(raw, inp.http)
}

export interface CountryRow {
  id: number
  eng: string | null
  rus: string | null
  chn: string | null
  visible: boolean | null
  retry: boolean | null
  rent: boolean | null
}

/** getCountries：文档写数组，**实测是以 id 为键的对象**（调研 §1.2、§1.6 第 7 条），两种都认 */
export function parseCountries(inp: HttpIn): Up<CountryRow[]> {
  const raw = sanitizeRaw(inp.body)
  const h = httpLayer(inp, raw)
  if ('done' in h) return h.done
  const b = h.body
  if (b.t === 'json' && (Array.isArray(b.v) || isObj(b.v))) {
    if (!Array.isArray(b.v) && jsonErrCode(b.v)) return mkErr(jsonErrCode(b.v) as string, inp.http, raw)
    const list = Array.isArray(b.v) ? b.v : Object.values(b.v)
    const out: CountryRow[] = []
    for (const x of list) {
      if (!isObj(x)) return noinfo(raw, inp.http)
      const id = toCountry(x.id)
      if (id == null) return noinfo(raw, inp.http)
      out.push({ id, eng: str(x.eng), rus: str(x.rus), chn: str(x.chn), visible: toBool(x.visible), retry: toBool(x.retry), rent: toBool(x.rent) })
    }
    return { kind: 'ok', data: out, raw }
  }
  if (b.t === 'text') return textErr(b.s, inp.http, raw, inp.retryAfter) ?? noinfo(raw, inp.http)
  return noinfo(raw, inp.http)
}

export interface OperatorsData {
  byCountry: Record<number, string[]>
  /** 上游答「这个国家没有运营商列表」（OPERATORS_NOT_FOUND） */
  notFound: boolean
}

/** getOperators：`{"status":"success","countryOperators":{"6":["axis",…]}}`；文本 OPERATORS_NOT_FOUND → ok（空、notFound） */
export function parseOperators(inp: HttpIn): Up<OperatorsData> {
  const raw = sanitizeRaw(inp.body)
  const h = httpLayer(inp, raw)
  if ('done' in h) return h.done
  const b = h.body
  if (b.t === 'text' && b.s === 'OPERATORS_NOT_FOUND') return { kind: 'ok', data: { byCountry: {}, notFound: true }, raw }
  if (b.t === 'json' && isObj(b.v) && isObj(b.v.countryOperators)) {
    const out: Record<number, string[]> = {}
    for (const [cid, ops] of Object.entries(b.v.countryOperators)) {
      const c = toCountry(cid)
      if (c == null || !Array.isArray(ops) || ops.some((x) => typeof x !== 'string')) return noinfo(raw, inp.http)
      out[c] = (ops as string[]).map((x) => x.trim()).filter(Boolean)
    }
    return { kind: 'ok', data: { byCountry: out, notFound: false }, raw }
  }
  if (b.t === 'text') return textErr(b.s, inp.http, raw, inp.retryAfter) ?? noinfo(raw, inp.http)
  return jsonErrIn2xx(b, inp.http, raw, inp.retryAfter) ?? noinfo(raw, inp.http)
}

// ───────────────────────── v1：活跃列表 / history / stats / offers / custom-durations ─────────────────────────

export interface V1PageMeta {
  page: number | null
  size: number | null
  total: number | null
  hasMore: boolean | null
}

function pageMeta(v: unknown): V1PageMeta {
  if (!isObj(v)) return { page: null, size: null, total: null, hasMore: null }
  return { page: toInt(v.page), size: toInt(v.size), total: toInt(v.total), hasMore: typeof v.hasMore === 'boolean' ? v.hasMore : null }
}

export interface V1Activation {
  id: string
  status: number | null
  phone: string | null
  service: string | null
  country: number | null
  dialCode: string | null
  /** 规格默认 any */
  operator: string | null
  priceMicro: number | null
  /** 带时区的创建时间（认领时间窗与时钟校准用，§2.4）；不带时区 → null */
  createdAt: Date | null
  expiredAt: Date | null
  verificationType: string | null
  otpList: OtpItem[]
}

export interface V1ActivationsPage {
  items: V1Activation[]
  count: number
  meta: V1PageMeta
}

function v1Activation(v: unknown): V1Activation | null {
  if (!isObj(v)) return null
  const id = toActivationId(v.id)
  if (!id) return null
  const dial = toInt(v.countryPhoneCode)
  return {
    id,
    status: toInt(v.status),
    phone: toPhone(v.phone),
    service: str(v.service),
    country: toCountry(v.country),
    dialCode: dial != null && dial > 0 ? String(dial) : null,
    operator: typeof v.operator === 'string' && v.operator ? v.operator : null,
    priceMicro: usdToMicro(v.price),
    createdAt: parseTzDate(v.createdAt),
    expiredAt: parseTzDate(v.expiredAt),
    verificationType: str(v.verificationType),
    otpList: parseOtpList(v.otpList),
  }
}

/** v1 `GET /activations`（UNKNOWN 认领的候选来源，每页 ≤25）：`{"data":[…],"meta":{…}}`；任何一条认不出 → noinfo（这一轮作废，§2.4） */
export function parseV1Activations(inp: HttpIn): Up<V1ActivationsPage> {
  const raw = sanitizeRaw(inp.body)
  const h = httpLayer(inp, raw)
  if ('done' in h) return h.done
  const b = h.body
  if (b.t === 'json' && isObj(b.v) && Array.isArray(b.v.data)) {
    const items: V1Activation[] = []
    for (const x of b.v.data) {
      const a = v1Activation(x)
      if (!a) return noinfo(raw, inp.http)
      items.push(a)
    }
    return { kind: 'ok', data: { items, count: b.v.data.length, meta: pageMeta(b.v.meta) }, raw }
  }
  return jsonErrIn2xx(b, inp.http, raw, inp.retryAfter) ?? noinfo(raw, inp.http)
}

export interface HistoryRow {
  id: string
  /** createDate：实测带时区（"2026-09-28T11:41:10.000000Z"），规格示例不带（→ null） */
  createdAt: Date | null
  service: string | null
  country: number | null
  phone: string | null
  /** 收到的验证码（实测是 "490838"；规格示例是整句；数组形态按空格拼起来），没有 → null */
  moreCodes: string | null
  /** 注意：已取消（8）的行 cost 也有值（就是标价），**不代表扣了费**（调研 §3.4 第 6 条） */
  costMicro: number | null
  /** 6 已完成、8 已取消、10 已退款 */
  status: number | null
  dialCode: string | null
  currency: number | null
}

export interface HistoryData {
  rows: HistoryRow[]
  count: number
  totals: { sumMicro: number | null; successCount: number | null } | null
  meta: V1PageMeta
}

/**
 * history 的 moreCodes：字符串 / 数字原样；数组按空格拼起来（每一项都得是字符串或数字）；缺省 / null / 空 → 没有码（null）；
 * **其余形态（对象、布尔、数组里夹着对象）→ undefined = 认不出**，整页按 noinfo 处理——
 * 认不出的形态绝不能当成「没有码」，否则状态 8 / 10 的行会被判成 CANCELLED、把收过码的单整单退掉（fail-open）。
 */
function moreCodesOf(v: unknown): string | null | undefined {
  if (v === undefined || v === null) return null
  if (typeof v === 'string') return v.trim() || null
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : undefined
  if (Array.isArray(v)) {
    const parts: string[] = []
    for (const x of v) {
      if (typeof x === 'string') {
        if (x.trim()) parts.push(x.trim())
      } else if (typeof x === 'number' && Number.isFinite(x)) parts.push(String(x))
      else return undefined
    }
    return parts.length ? parts.join(' ') : null
  }
  return undefined
}

function historyRow(v: unknown): HistoryRow | null {
  if (!isObj(v)) return null
  const id = toActivationId(v.id)
  if (!id) return null
  const codes = moreCodesOf(v.moreCodes)
  if (codes === undefined) return null
  const pc = str(v.phoneCode)
  const dial = pc != null ? pc.replace(/\D/g, '') : ''
  return {
    id,
    createdAt: parseTzDate(v.createDate ?? v.createdAt),
    service: str(v.service),
    country: toCountry(v.country),
    phone: toPhone(v.phone),
    moreCodes: codes,
    costMicro: usdToMicro(v.cost),
    status: toInt(v.status),
    dialCode: dial || null,
    currency: toInt(v.currency),
  }
}

/** v1 `GET /activations/history`（结束状态确认与对账）。币种不是 840 → err(CURRENCY) 带 data（状态照样可用，金额不可信，E56） */
export function parseHistory(inp: HttpIn): Up<HistoryData> {
  const raw = sanitizeRaw(inp.body)
  const h = httpLayer(inp, raw)
  if ('done' in h) return h.done
  const b = h.body
  if (b.t === 'json' && isObj(b.v) && Array.isArray(b.v.data)) {
    const rows: HistoryRow[] = []
    let bad: { currency: number; activationId: string } | null = null
    for (const x of b.v.data) {
      const r = historyRow(x)
      if (!r) return noinfo(raw, inp.http)
      rows.push(r)
      const bc = badCurrency((x as Record<string, unknown>).currency) // 与取号同一口径：认不出的币种（"RUB"）也是异常
      if (bc != null && !bad) bad = { currency: bc, activationId: r.id }
    }
    const t = b.v.totals
    const data: HistoryData = {
      rows,
      count: b.v.data.length,
      totals: isObj(t) ? { sumMicro: usdToMicro(t.sum), successCount: toInt(t.successCount) } : null,
      meta: pageMeta(b.v.meta),
    }
    if (bad) return { ...mkErr<HistoryData>('CURRENCY', inp.http, raw, { currency: bad.currency, activationId: bad.activationId }), data }
    return { kind: 'ok', data, raw }
  }
  return jsonErrIn2xx(b, inp.http, raw, inp.retryAfter) ?? noinfo(raw, inp.http)
}

export interface StatCell {
  count: number
  success: number
  percent: number | null
}
/** `{国家: {服务: {count, success, percent}}}`（包含旧单品与站长手动购买，D43） */
export type StatsData = Record<number, Record<string, StatCell>>

export function parseStats(inp: HttpIn): Up<StatsData> {
  const raw = sanitizeRaw(inp.body)
  const h = httpLayer(inp, raw)
  if ('done' in h) return h.done
  const b = h.body
  if (b.t === 'json' && isObj(b.v) && (isObj(b.v.data) || (Array.isArray(b.v.data) && b.v.data.length === 0))) {
    const out: StatsData = {}
    const d = isObj(b.v.data) ? b.v.data : {}
    for (const [cid, svcs] of Object.entries(d)) {
      const c = toCountry(cid)
      if (c == null || !isObj(svcs)) return noinfo(raw, inp.http)
      const row: Record<string, StatCell> = {}
      for (const [svc, cell] of Object.entries(svcs)) {
        if (!isObj(cell)) return noinfo(raw, inp.http)
        const count = toInt(cell.count)
        const success = toInt(cell.success)
        if (count == null || success == null) return noinfo(raw, inp.http)
        const pct = typeof cell.percent === 'number' ? cell.percent : typeof cell.percent === 'string' && cell.percent.trim() !== '' ? Number(cell.percent) : null
        row[svc] = { count, success, percent: pct != null && Number.isFinite(pct) ? pct : null }
      }
      out[c] = row
    }
    return { kind: 'ok', data: out, raw }
  }
  return jsonErrIn2xx(b, inp.http, raw, inp.retryAfter) ?? noinfo(raw, inp.http)
}

export interface OfferEntry {
  defaultMicro: number | null
  retailMicro: number | null
  minMicro: number | null
  total: number | null
  physical: number | null
  /** counts.defaultPrice：起价档库存（语义未确认，调研 U1） */
  defaultCount: number | null
  /** map 的档位，按价格升序：[价格微美元, 数量]（数量是否累计未确认，调研 §3.4 第 1 条） */
  tiers: Array<[number, number]>
}

export interface OffersData {
  /** 服务 → 国家 id → 报价 */
  offers: Record<string, Record<number, OfferEntry>>
  /** meta.order.rate：按评分排序的服务、每个服务的国家 */
  rateServices: string[]
  rateCountries: Record<string, number[]>
  /** meta.order.deliverability.countries：每个服务按到达率排序的国家（「推荐」标签，D26） */
  deliverability: Record<string, number[]>
}

function countryList(v: unknown): number[] {
  if (!Array.isArray(v)) return []
  const out: number[] = []
  for (const x of v) {
    const c = toCountry(x)
    if (c != null) out.push(c)
  }
  return out
}

function countryListMap(v: unknown): Record<string, number[]> {
  const out: Record<string, number[]> = {}
  if (!isObj(v)) return out
  for (const [svc, list] of Object.entries(v)) out[svc] = countryList(list)
  return out
}

function offerEntry(v: unknown): OfferEntry | null {
  if (!isObj(v)) return null
  const p = isObj(v.prices) ? v.prices : {}
  const c = isObj(v.counts) ? v.counts : {}
  const tiers: Array<[number, number]> = []
  if (isObj(v.map)) {
    for (const [price, n] of Object.entries(v.map)) {
      const pm = usdToMicro(price)
      const cnt = toInt(n)
      if (pm == null || cnt == null) return null
      tiers.push([pm, cnt])
    }
  } else if (v.map !== undefined && !(Array.isArray(v.map) && v.map.length === 0)) {
    return null
  }
  tiers.sort((a, b) => a[0] - b[0])
  return {
    defaultMicro: usdToMicro(p.default),
    retailMicro: usdToMicro(p.retail),
    minMicro: usdToMicro(p.min),
    total: toInt(c.total),
    physical: toInt(c.physical),
    defaultCount: toInt(c.defaultPrice),
    tiers,
  }
}

/** v1 `GET /activations/offers/sms`：`{data:{服务:{国家:{prices, counts, map}}}, meta:{order:{rate, deliverability}}}`；没货 404 OFFER_NOT_FOUND、限流 429 RATE_LIMIT（err） */
export function parseOffers(inp: HttpIn): Up<OffersData> {
  const raw = sanitizeRaw(inp.body)
  const h = httpLayer(inp, raw)
  if ('done' in h) return h.done
  const b = h.body
  if (b.t === 'json' && isObj(b.v) && (isObj(b.v.data) || (Array.isArray(b.v.data) && b.v.data.length === 0))) {
    const offers: Record<string, Record<number, OfferEntry>> = {}
    const d = isObj(b.v.data) ? b.v.data : {}
    for (const [svc, byCountry] of Object.entries(d)) {
      if (!isObj(byCountry)) return noinfo(raw, inp.http)
      const row: Record<number, OfferEntry> = {}
      for (const [cid, e] of Object.entries(byCountry)) {
        const c = toCountry(cid)
        const entry = offerEntry(e)
        if (c == null || !entry) return noinfo(raw, inp.http)
        row[c] = entry
      }
      offers[svc] = row
    }
    const meta = isObj(b.v.meta) ? b.v.meta : {}
    const order = isObj(meta.order) ? meta.order : {}
    const rate = isObj(order.rate) ? order.rate : {}
    const deliv = isObj(order.deliverability) ? order.deliverability : {}
    return {
      kind: 'ok',
      raw,
      data: {
        offers,
        rateServices: Array.isArray(rate.services) ? rate.services.filter((x): x is string => typeof x === 'string') : [],
        rateCountries: countryListMap(rate.countries),
        deliverability: countryListMap(deliv.countries),
      },
    }
  }
  return jsonErrIn2xx(b, inp.http, raw, inp.retryAfter) ?? noinfo(raw, inp.http)
}

/** v1 `GET /classifiers/activations/custom-durations`（免鉴权）：`{data:{服务:{国家:分钟}}}` */
export type CustomDurations = Record<string, Record<number, number>>

export function parseCustomDurations(inp: HttpIn): Up<CustomDurations> {
  const raw = sanitizeRaw(inp.body)
  const h = httpLayer(inp, raw)
  if ('done' in h) return h.done
  const b = h.body
  if (b.t === 'json' && isObj(b.v) && isObj(b.v.data)) {
    const out: CustomDurations = {}
    for (const [svc, byCountry] of Object.entries(b.v.data)) {
      if (!isObj(byCountry)) return noinfo(raw, inp.http)
      const row: Record<number, number> = {}
      for (const [cid, min] of Object.entries(byCountry)) {
        const c = toCountry(cid)
        const m = toInt(min)
        if (c == null || m == null || m <= 0) return noinfo(raw, inp.http)
        row[c] = m
      }
      out[svc] = row
    }
    return { kind: 'ok', data: out, raw }
  }
  return jsonErrIn2xx(b, inp.http, raw, inp.retryAfter) ?? noinfo(raw, inp.http)
}

// ───────────────────────── err 的 info 取值（统一 JSON 与文本两种写法） ─────────────────────────

/** WRONG_MAX_PRICE 的 `info.min`（JSON）或 `:x`（文本）→ 微美元 */
export function errMinPriceMicro(e: UpErr<unknown>): number | null {
  return e.info ? usdToMicro(e.info.min) : null
}

/** BANNED：scope（global / specific；文本形态 `BANNED:'…'` 没有 scope，按 global）、解封时刻（`banned_until` unix 秒 → ms；只有文本时刻的 → null，引擎按 30 分钟兜底，E4） */
export function errBan(e: UpErr<unknown>): { scope: 'global' | 'specific'; untilMs: number | null; retryAfterSec: number | null } {
  const i = e.info ?? {}
  const scope = i.scope === 'specific' || e.code === 'BANNED_SPECIFIC' ? 'specific' : 'global'
  const until = toInt(i.banned_until)
  const readable = parseTzDate(i.readable_date)
  return {
    scope,
    untilMs: until != null && until > 0 ? until * 1000 : readable ? readable.getTime() : null,
    retryAfterSec: e.retryAfterSec ?? null,
  }
}

/** CHANNELS_LIMIT 的 `info.current_threads` / `info.max_allowed`（规格示例 max_allowed = −1，原样给出，引擎判断） */
export function errThreads(e: UpErr<unknown>): { currentThreads: number | null; maxAllowed: number | null } {
  const i = e.info ?? {}
  return { currentThreads: toInt(i.current_threads), maxAllowed: toInt(i.max_allowed) }
}

/** EARLY_CANCEL_DENIED 的 `info.minActivationTime`（秒，缺省 120） */
export function errMinActivationSec(e: UpErr<unknown>): number {
  const n = e.info ? toInt(e.info.minActivationTime) : null
  return n != null && n > 0 ? n : 120
}

/** NEW_OTP_RECEIVED 的 `info.data`（短信列表） */
export function errOtpList(e: UpErr<unknown>): OtpItem[] {
  return e.info ? parseOtpList(e.info.data) : []
}

// ───────────────────────── 取号结果分类（§3 E1–E9、E56、E58） ─────────────────────────

export type AcquireClass =
  | { c: 'ACTIVE'; data: NumberData }
  /** E56：号码已买到、币种不是 840 → 照常服务、标异常、全局停售 */
  | { c: 'CURRENCY'; data: NumberData | null; currency: number | null }
  /** E1 */
  | { c: 'NO_NUMBERS' }
  /** E2：带 `info.min` */
  | { c: 'WRONG_MAX_PRICE'; minMicro: number | null }
  /** E3 */
  | { c: 'NO_BALANCE' }
  /** E4 */
  | { c: 'BANNED'; scope: 'global' | 'specific'; untilMs: number | null; retryAfterSec: number | null }
  /** E5 */
  | { c: 'CHANNELS_LIMIT'; currentThreads: number | null; maxAllowed: number | null }
  /** E6：SERVICE_NOT_AVAILABLE / BAD_SERVICE / BAD_COUNTRY（及官网前端处理的 NOT_AVAILABLE、WHATSAPP_NOT_AVAILABLE） */
  | { c: 'UNAVAILABLE'; code: string }
  /**
   * E7：BAD_KEY、401 / 403 BAD_API_KEY、ACCOUNT_INACTIVE（熔断打开、不自动恢复）；
   * **本进程没配 key 的 `err(NO_KEY)`（http 0，请求没发）同样归这里**——它和 NOT_SENT 都是 http 0，但不是 REJECTED：
   * 没 key 什么都做不了，得停售新单等站长修配置，而不是每单重试 90 秒再退款（S2 的 gate 另用 upstream.upstreamConfigured() 先挡新单）
   */
  | { c: 'KEY_INVALID'; code: string }
  /** E58：请求被拒、上游没成交（认不出的 4xx、1020、HTML 403、429、本进程没发出去的 NOT_SENT）——不占首次取号的 3 次机会 */
  | { c: 'REJECTED'; code: string; cause: string | null; retryAfterSec: number | null }
  /** E8 / E9：结果未知，**绝不重取**，交给扫描器（§2.4） */
  | { c: 'UNKNOWN'; reason: UnknownReason | 'noinfo' }

const KEY_CODES = new Set(['BAD_KEY', 'NO_KEY', 'BAD_API_KEY', 'UNAUTHENTICATED', 'ACCOUNT_INACTIVE'])
const UNAVAILABLE_CODES = new Set(['SERVICE_NOT_AVAILABLE', 'BAD_SERVICE', 'BAD_COUNTRY', 'NOT_AVAILABLE', 'WHATSAPP_NOT_AVAILABLE'])

export function classifyAcquire(r: Up<NumberData>): AcquireClass {
  switch (r.kind) {
    case 'ok':
      return { c: 'ACTIVE', data: r.data }
    case 'unknown':
      return { c: 'UNKNOWN', reason: r.reason }
    case 'noinfo':
      return { c: 'UNKNOWN', reason: 'noinfo' } // 取号解析不会产生 noinfo；万一出现，按「可能已买到」处理
    case 'err': {
      const code = r.code
      if (code === 'CURRENCY') return { c: 'CURRENCY', data: r.data ?? null, currency: r.info ? toInt(r.info.currency) : null }
      if (code === 'NO_NUMBERS') return { c: 'NO_NUMBERS' }
      if (code === 'WRONG_MAX_PRICE') return { c: 'WRONG_MAX_PRICE', minMicro: errMinPriceMicro(r) }
      if (code === 'NO_BALANCE' || code === 'BAD_BALANCE') return { c: 'NO_BALANCE' }
      if (code === 'BANNED' || code === 'BANNED_GLOBAL' || code === 'BANNED_SPECIFIC') return { c: 'BANNED', ...errBan(r) }
      if (code === 'CHANNELS_LIMIT') return { c: 'CHANNELS_LIMIT', ...errThreads(r) }
      if (UNAVAILABLE_CODES.has(code)) return { c: 'UNAVAILABLE', code }
      if (KEY_CODES.has(code) || r.http === 401) return { c: 'KEY_INVALID', code }
      const cause = r.info && typeof r.info.cause === 'string' ? r.info.cause : null
      return { c: 'REJECTED', code, cause, retryAfterSec: r.retryAfterSec ?? null }
    }
  }
}

// ───────────────────────── 查询 / 放号 / 完成类调用的判定（§3.1） ─────────────────────────

export type NoinfoStop = 'KEY' | 'BANNED_GLOBAL'

export type Verdict =
  /** ACCESS_CANCEL、setStatus 8 的 204、history 8 / 10 且无码 → 尝试 CANCELLED */
  | { v: 'CANCELLED'; ended?: boolean }
  /** ACCESS_ACTIVATION、setStatus 6 的 204 → 尝试 FINISHED */
  | { v: 'FINISHED' }
  /**
   * 收到码 → T13。`sms` 是响应里直接带的短信（NEW_OTP_RECEIVED 的 info.data、getStatusV2）；`code` / `text` 是单个码；
   * `needAllSms` = 要再用 getAllSms 补全文；`again` = 完成时遇到 NEW_OTP_RECEIVED，下一轮再调 finish；
   * `ended` = 来自 history 且状态是终态 6 / 8 / 10（上游已结束；这时 getAllSms 返回 409，码取 moreCodes）；`upstreamRefunded` = history 10 且有码（R6）
   */
  | {
      v: 'RECEIVED'
      code: string | null
      text: string | null
      sms: OtpItem[]
      needAllSms: boolean
      again?: boolean
      ended?: boolean
      upstreamRefunded?: boolean
    }
  /** EARLY_CANCEL_DENIED：买家操作回到 WAITING；系统放号 nextCheckAt = canCancelAt + 5 秒 */
  | { v: 'EARLY_DENIED'; minSec: number }
  /** FREE_CANCELLATION_EXPIRED：没码但过了免费取消期（E55，charged，chargeSource=EXPIRED） */
  | { v: 'EXPIRED_CHARGE' }
  /** 等码中，无变化 */
  | { v: 'WAIT' }
  /** STATUS_CANCEL、ACTIVATION_NOT_ACTIVE、404 NOT_FOUND、不在（拉全了的）活跃列表里 → 查 v1 history 定终态 */
  | { v: 'CHECK_HISTORY' }
  /**
   * 没有信息：状态不动。`backoffSec` 退避秒数（retry_after_seconds，至少 10 秒；没给或给 0：403 / 429 / 1020 / HTML 403 按 60 秒，其余 10 秒）；
   * `breaker` = 计入熔断（只有 timeout / network / http5xx）；`recheckBalance` = 402 触发一次 getBalance 复核；
   * `stopNew` = 同时按 E7（KEY）/ E4（全局 BANNED）停售新单——**不据此把在途号码判成取消**
   */
  | { v: 'NOINFO'; backoffSec: number; breaker: boolean; recheckBalance?: boolean; stopNew?: NoinfoStop }

const RECEIVED = (x: Partial<Extract<Verdict, { v: 'RECEIVED' }>> = {}): Verdict => ({
  v: 'RECEIVED',
  code: x.code ?? null,
  text: x.text ?? null,
  sms: x.sms ?? [],
  needAllSms: x.needAllSms ?? true,
  ...(x.again ? { again: true } : {}),
  ...(x.ended ? { ended: true } : {}),
  ...(x.upstreamRefunded ? { upstreamRefunded: true } : {}),
})

/** 「没有信息」时的最短退避（秒） */
export const MIN_BACKOFF_SEC = 10

/** 「没有信息」的细节（E57、§3.1 最后三行） */
export function noinfoVerdict(r: UpErr<unknown> | UpUnknown | UpNoinfo): Extract<Verdict, { v: 'NOINFO' }> {
  if (r.kind === 'unknown') {
    return { v: 'NOINFO', backoffSec: 10, breaker: r.reason === 'timeout' || r.reason === 'network' || r.reason === 'http5xx' }
  }
  if (r.kind === 'noinfo') return { v: 'NOINFO', backoffSec: 10, breaker: false }
  const out: Extract<Verdict, { v: 'NOINFO' }> = { v: 'NOINFO', backoffSec: 10, breaker: false }
  const throttled = r.http === 403 || r.http === 429 || r.code === 'REJECTED' || r.code === 'RATE_LIMIT'
  // retry_after_seconds / Retry-After 为 0（或没给）：限流类按 60 秒，其余 10 秒；给了正数也至少 10 秒（上游超限封账户 10 秒，调研 §1.1），
  // 绝不出现 0 秒退避——那等于立刻重查，限流时只会越查越封
  const ra = r.retryAfterSec != null && r.retryAfterSec > 0 ? r.retryAfterSec : null
  out.backoffSec = ra != null ? Math.max(ra, MIN_BACKOFF_SEC) : throttled ? 60 : MIN_BACKOFF_SEC
  if (r.code === 'NO_BALANCE' || r.http === 402) out.recheckBalance = true
  if (KEY_CODES.has(r.code) || r.http === 401) out.stopNew = 'KEY'
  else if ((r.code === 'BANNED' || r.code === 'BANNED_GLOBAL') && errBan(r).scope === 'global') out.stopNew = 'BANNED_GLOBAL'
  return out
}

const ENDED_CODES = new Set(['ACTIVATION_NOT_ACTIVE', 'NOT_FOUND'])

/**
 * getStatus（单查）：WAIT_CODE / WAIT_RESEND → 无变化；OK:x → 收到码；CANCEL → 查 history；
 * WAIT_RETRY:x —— 协议含义是「已经收到过一条、在等下一条」，我方这个尝试**还没有短信**（漏记了）→ 按收到码走（code = 冒号后，补 getAllSms）；已经有短信 → 无变化。
 */
export function judgeGetStatus(r: Up<StatusData>, ctx: { hasSms: boolean }): Verdict {
  if (r.kind === 'ok') {
    const d = r.data
    switch (d.s) {
      case 'WAIT_CODE':
      case 'WAIT_RESEND':
        return { v: 'WAIT' }
      case 'WAIT_RETRY':
        return ctx.hasSms ? { v: 'WAIT' } : RECEIVED({ code: d.code, needAllSms: true })
      case 'OK':
        return RECEIVED({ code: d.code, needAllSms: true })
      case 'CANCEL':
        return { v: 'CHECK_HISTORY' }
    }
  }
  if (r.kind === 'err' && ENDED_CODES.has(r.code)) return { v: 'CHECK_HISTORY' }
  return noinfoVerdict(r as UpErr<unknown> | UpUnknown | UpNoinfo)
}

/**
 * getStatusV2（只作补充，**不据它判状态**，D10、D17、§6.2）：§3.1 判定表里只有它的纯文本 `STATUS_CANCEL`（→ 查 history）；
 * 带短信的 JSON 不在表里，按「没有信息」——收码一律由 getStatus / 活跃列表 / 放号返回值 / history 推进，解析出的短信只作展示与排查参考。
 */
export function judgeGetStatusV2(r: Up<StatusV2Data>): Verdict {
  if (r.kind === 'ok') {
    if (r.data.s === 'CANCEL') return { v: 'CHECK_HISTORY' }
    return { v: 'NOINFO', backoffSec: 10, breaker: false }
  }
  if (r.kind === 'err' && ENDED_CODES.has(r.code)) return { v: 'CHECK_HISTORY' }
  return noinfoVerdict(r as UpErr<unknown> | UpUnknown | UpNoinfo)
}

/**
 * 放号（setStatus 8 / cancelActivation）：ACCESS_CANCEL、204 → CANCELLED；OTP_RECEIVED → 收到码；NEW_OTP_RECEIVED → 收到码（info.data 入库）；
 * EARLY_CANCEL_DENIED → 还没满 120 秒；FREE_CANCELLATION_EXPIRED → E55；ACTIVATION_NOT_ACTIVE / NOT_FOUND → 查 history；其余没有信息。
 */
export function judgeRelease(r: Up<SetStatusData>): Verdict {
  if (r.kind === 'ok') {
    if (r.data.result === 'ACCESS_CANCEL' || r.data.result === 'NO_CONTENT') return { v: 'CANCELLED' }
    return noinfoVerdict({ kind: 'noinfo', raw: r.raw })
  }
  if (r.kind === 'err') {
    if (r.code === 'OTP_RECEIVED') return RECEIVED({ needAllSms: true })
    if (r.code === 'NEW_OTP_RECEIVED') {
      const sms = errOtpList(r)
      return RECEIVED({ sms, code: sms.length ? sms[sms.length - 1].code : null, text: sms.length ? sms[sms.length - 1].text : null, needAllSms: sms.length === 0 })
    }
    if (r.code === 'EARLY_CANCEL_DENIED') return { v: 'EARLY_DENIED', minSec: errMinActivationSec(r) }
    if (r.code === 'FREE_CANCELLATION_EXPIRED') return { v: 'EXPIRED_CHARGE' }
    if (ENDED_CODES.has(r.code)) return { v: 'CHECK_HISTORY' }
  }
  return noinfoVerdict(r as UpErr<unknown> | UpUnknown | UpNoinfo)
}

/**
 * 完成（setStatus 6 / finishActivation）：ACCESS_ACTIVATION、204 → FINISHED；NEW_OTP_RECEIVED → info.data 入库、尝试保持 RECEIVED、
 * 下一轮再调 finish（again）；ACTIVATION_NOT_ACTIVE / NOT_FOUND → 查 history；其余没有信息（T14）。
 */
export function judgeFinish(r: Up<SetStatusData>): Verdict {
  if (r.kind === 'ok') {
    if (r.data.result === 'ACCESS_ACTIVATION' || r.data.result === 'NO_CONTENT') return { v: 'FINISHED' }
    return noinfoVerdict({ kind: 'noinfo', raw: r.raw })
  }
  if (r.kind === 'err') {
    if (r.code === 'NEW_OTP_RECEIVED') {
      const sms = errOtpList(r)
      return RECEIVED({ sms, code: sms.length ? sms[sms.length - 1].code : null, text: sms.length ? sms[sms.length - 1].text : null, needAllSms: sms.length === 0, again: true })
    }
    if (r.code === 'OTP_RECEIVED') return RECEIVED({ needAllSms: true, again: true })
    if (ENDED_CODES.has(r.code)) return { v: 'CHECK_HISTORY' }
  }
  return noinfoVerdict(r as UpErr<unknown> | UpUnknown | UpNoinfo)
}

/**
 * 批量列表（getActiveActivations，**必须是拉全了的**，见 upstream.getAllActiveActivations）：
 *  - 列表出错（任何一页）→ 没有信息（绝不当作空列表，不能据此判「不在列表里」）；
 *  - 在列表里、smsCode / smsText 跟我方记下的不一样 → 收到码（补 getAllSms）；有码但没变 / 没有码 → 无变化；
 *  - 不在列表里 → 查 history。
 * 币种异常（err CURRENCY 带 data）照样按列表判定：状态与短信不受币种影响（E56「已取到的号照常服务」），引擎另行停售与告警。
 */
export function judgeFromActiveList(
  r: Up<{ items: ActiveItem[] }>,
  activationId: string,
  ctx: { lastCode?: string | null; lastText?: string | null } = {},
): Verdict {
  const list = r.kind === 'ok' ? r.data : r.kind === 'err' && r.code === 'CURRENCY' && r.data ? r.data : null
  if (!list) return noinfoVerdict(r as UpErr<unknown> | UpUnknown | UpNoinfo)
  const it = list.items.find((x) => x.activationId === activationId)
  if (!it) return { v: 'CHECK_HISTORY' }
  if (it.smsCode == null && it.smsText == null) return { v: 'WAIT' }
  if (it.smsCode === (ctx.lastCode ?? null) && it.smsText === (ctx.lastText ?? null)) return { v: 'WAIT' }
  return RECEIVED({ code: it.smsCode, text: it.smsText, needAllSms: true })
}

/** history 的 moreCodes → 验证码：纯码（≤32 字、没有空白）原样；整句里取第一段 4–8 位数字；都没有 → null（全文照样在 text 里） */
export function codeFromMoreCodes(s: string | null): string | null {
  if (!s) return null
  const t = s.trim()
  if (t && t.length <= 32 && !/\s/.test(t)) return t
  const m = t.match(/\b(\d{4,8})\b/)
  return m ? m[1] : null
}

/**
 * v1 history 定终态（§3.1：ACTIVATION_NOT_ACTIVE / NOT_FOUND / STATUS_CANCEL / 不在活跃列表之后查它）：
 *  - 终态（6 / 8 / 10）：状态 6、或 moreCodes 非空 → 收到码（ended，码取 moreCodes；10 且有码 → upstreamRefunded，R6）；
 *    状态 8 / 10 且 moreCodes 为空 → CANCELLED（ended）；
 *  - **不是终态**（2、4 等，或状态认不出）却带 moreCodes → 收到码，但**不标 ended**、`needAllSms=true`：号在上游还活着，
 *    getAllSms 取得到全文，之后照常由我方完成（T14）——绝不能当成「上游已结束」而跳过 finish；
 *  - 找不到这一行、不是终态又没有码、查询出错 → 没有信息，下一轮再查。
 * moreCodes 形态认不出（对象等）的行在 parseHistory 里已经让整页变成 noinfo，到不了这里。
 */
export function judgeHistory(r: Up<{ rows: HistoryRow[] }>, activationId: string): Verdict {
  const data = r.kind === 'ok' ? r.data : r.kind === 'err' && r.code === 'CURRENCY' && r.data ? r.data : null
  if (!data) return noinfoVerdict(r as UpErr<unknown> | UpUnknown | UpNoinfo)
  const row = data.rows.find((x) => x.id === activationId)
  if (!row) return { v: 'NOINFO', backoffSec: MIN_BACKOFF_SEC, breaker: false }
  const ended = row.status === 6 || row.status === 8 || row.status === 10
  if (ended && (row.status === 6 || row.moreCodes)) {
    return RECEIVED({ code: codeFromMoreCodes(row.moreCodes), text: row.moreCodes, needAllSms: false, ended: true, upstreamRefunded: row.status === 10 })
  }
  if (ended) return { v: 'CANCELLED', ended: true }
  if (row.moreCodes) return RECEIVED({ code: codeFromMoreCodes(row.moreCodes), text: row.moreCodes, needAllSms: true })
  return { v: 'NOINFO', backoffSec: MIN_BACKOFF_SEC, breaker: false }
}
