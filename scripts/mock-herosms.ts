/**
 * 本地假 hero-sms（短信接码 S0，docs/短信接码-设计.md §11 S0、§12.2「加假上游」）。**不调用真实 hero-sms，不 import src/**。
 *
 * 同时模拟两套协议：
 *  - 兼容协议 `…/handler_api.php?action=…&api_key=…`：getBalance、getNumber、getNumberV2、getStatus、getStatusV2、setStatus、
 *    getActiveActivations、getAllSms、getPrices、getServicesList、getCountries、getOperators、finishActivation、cancelActivation；
 *  - v1 REST `/api/v1/…`（`Authorization: ApiKey …`）：GET /activations、/activations/history、/activations/stats、
 *    /activations/offers/{sms|call}、/classifiers/activations/custom-durations。
 * 返回形态照规格与实测（调研 §1.2、§1.3、§1.6、§3.2–3.3；scratchpad 的 probe2.out）：取号 JSON 里 id 是字符串、canGetAnotherSms 布尔；
 * 活跃列表 id / 状态 / 国家是字符串、canGetAnotherSms 是 "1"/"0"、activationTime 没有时区；空列表带 `activeActivations.rows`；
 * history 的 createDate 带时区、已取消的行 cost 也有值；缺 key 422、错 key 401 BAD_KEY、v1 错 key 403 BAD_API_KEY。
 *
 * 行为（状态有一个可拨的虚拟时钟）：
 *  - 取号先扣上游余额（不够 402 NO_BALANCE）、没库存 200 NO_NUMBERS、maxPrice 低于价 400 WRONG_MAX_PRICE（info.min）；
 *  - 取号后 `minActivationSec`（默认 120）秒内取消 → 409 EARLY_CANCEL_DENIED；收过码后取消 → 409 OTP_RECEIVED；
 *    收到了客户端还没「看到」的码时取消 / 完成 → 409 NEW_OTP_RECEIVED（info.data 带那几条）；已结束的号 → 409 ACTIVATION_NOT_ACTIVE；
 *  - 有效期（默认 20 分钟，`customDurations` 可改）到了：没码 → 状态 10、退回余额；有码 → 状态 6；
 *  - 有效期 > 20 分钟的号在 20 分钟后取消 → 409 FREE_CANCELLATION_EXPIRED（规则页说法，调研 §3.4 第 7 条）。
 *
 * 故障注入（`faults`，按 action 匹配，默认生效 1 次）：没号、超时（可选「其实已经买到」）、晚到的码、EARLY_CANCEL_DENIED、
 * FREE_CANCELLATION_EXPIRED、NEW_OTP_RECEIVED、取消时已收码、402 / 403 / 404 / 429 / 1020、5xx、格式乱码、币种不是 840 等，见 FaultKind。
 *
 * 用法
 *   A) 命令行起一个：  npx tsx scripts/mock-herosms.ts [--port 18555] [--key mock-key] [--scenario 名字 …] [--list] [--quiet]
 *      然后 HEROSMS_BASE=http://127.0.0.1:18555/stubs/handler_api.php  HEROSMS_V1_BASE=http://127.0.0.1:18555/api/v1  HEROSMS_API_KEY=mock-key
 *      控制接口（只绑 127.0.0.1）：GET /__mock/state、POST /__mock/{reset,config,faults,sms,end,buy,clock,scenario,stats/reset}（JSON 体）
 *   B) 测试脚本里嵌入：  const m = await startMockHeroSms({ key }); … m.setFaults([...]); m.pushSms(id); m.advance(121); await m.close()
 *
 * 日志与状态里的请求路径一律把 api_key 换成 ***，key 不出现在任何输出里。
 */
import http from 'http'
import type { AddressInfo } from 'net'

// ───────────────────────── 配置与状态 ─────────────────────────

export interface PriceEntry {
  usd: number
  stock: number
  /** offers 的 counts.defaultPrice（缺省 = stock 的 90%） */
  defaultCount?: number
  /** offers 的 map 档位 [美元, 数量]（缺省按 usd ×1、×1.25、×2 生成） */
  tiers?: Array<[number, number]>
}

export interface MockConfig {
  balanceMicro: number
  minActivationSec: number
  durationSec: number
  /** 服务 → 国家 → 分钟（例外时长；也是 custom-durations 接口的返回） */
  customDurations: Record<string, Record<string, number>>
  /** 取号多少秒后仍没码就不能免费取消（FREE_CANCELLATION_EXPIRED）；null = 只对有效期 > 20 分钟的号在 20 分钟后生效 */
  freeCancelSec: number | null
  /** 新号在 N 秒后自动收到一条码（「晚到的码」）；null = 不自动 */
  codeAfterSec: number | null
  currency: number
  /** getNumberV2 的 activationId 用数字（规格 schema）还是字符串（规格示例，默认） */
  idAsNumber: boolean
  /** setStatus 成功时回文本（ACCESS_CANCEL / ACCESS_ACTIVATION）还是 204 */
  cancelStyle: 'text' | '204'
  finishStyle: 'text' | '204'
  /** getActiveActivations 的形状：data 数组（默认），或把记录放进 activeActivations.rows */
  activeShape: 'data' | 'rows'
  /** '服务:国家' → 价格与库存 */
  prices: Record<string, PriceEntry>
  /** 国家 → 运营商 */
  operators: Record<string, string[]>
}

export type FaultKind =
  | 'no_numbers'
  | 'wrong_max_price'
  | 'wrong_max_price_text'
  | 'no_balance'
  | 'banned_global'
  | 'banned_specific'
  | 'banned_text'
  | 'channels_limit'
  | 'service_na'
  | 'account_inactive'
  | 'bad_key'
  | 'html403'
  | 'cf1020'
  | 'http400'
  | 'not_found'
  | 'bad_action'
  | 'rate_limit'
  | 'http500'
  | 'html502'
  | 'http503'
  | 'garbled'
  | 'empty'
  | 'missing_id'
  | 'text_number'
  | 'quoted'
  | 'currency'
  | 'hang'
  | 'reset'
  | 'early_cancel_denied'
  | 'free_cancel_expired'
  | 'otp_on_release'
  | 'otp_received'
  | 'not_active'
  | 'echo_key'
  | 'custom'

export interface Fault {
  /** 兼容协议的 action 名（getNumberV2、setStatus …）、'v1:activations' | 'v1:history' | 'v1:stats' | 'v1:offers' | 'v1:custom-durations'，或 '*' */
  action: string
  kind: FaultKind
  /** 生效次数，默认 1；0 = 一直生效 */
  times?: number
  /** 先放过前 N 次匹配的请求 */
  skip?: number
  /** hang 的延迟（默认 20000ms） */
  delayMs?: number
  /** 取号类故障（hang / reset / garbled / missing_id / empty / text_number / http500 …）：号码其实买到了没有。缺省见 BOUGHT_DEFAULT */
  bought?: boolean
  /** setStatus 类故障只对这个 status 生效（6 / 8） */
  status?: number
  /** kind='custom' 时的返回 */
  http?: number
  body?: string
}

interface MockSms {
  id: string
  code: string | null
  text: string | null
  from: string
  at: number
  seen: boolean
}

export interface MockActivation {
  id: string
  service: string
  country: number
  operator: string
  phone: string
  dial: number
  costMicro: number
  currency: number
  createdAt: number
  endsAt: number
  /** ACTIVE 进行中；FINISHED=6；CANCELLED=8；REFUNDED=10 */
  status: 'ACTIVE' | 'FINISHED' | 'CANCELLED' | 'REFUNDED'
  endedAt: number | null
  sms: MockSms[]
  retry: boolean
  /** FREE_CANCELLATION_EXPIRED 之后：到期也不退费 */
  noRefund: boolean
  canGetAnotherSms: boolean
  autoCodeAt: number | null
  external: boolean
}

interface LogEntry {
  at: number
  vt: number
  method: string
  path: string
  action: string
  http: number | null
  fault?: string
}

const DIAL: Record<number, number> = { 3: 86, 4: 63, 6: 62, 16: 44, 36: 1, 48: 31, 52: 66, 187: 1 }
const COUNTRY_NAMES: Record<number, { eng: string; rus: string; chn: string }> = {
  3: { eng: 'China', rus: 'Китай', chn: '中国' },
  4: { eng: 'Philippines', rus: 'Филиппины', chn: '菲律宾' },
  6: { eng: 'Indonesia', rus: 'Индонезия', chn: '印度尼西亚' },
  16: { eng: 'United Kingdom', rus: 'Великобритания', chn: '英国' },
  36: { eng: 'Canada', rus: 'Канада', chn: '加拿大' },
  48: { eng: 'Netherlands', rus: 'Нидерланды', chn: '荷兰' },
  52: { eng: 'Thailand', rus: 'Таиланд', chn: '泰国' },
  187: { eng: 'USA', rus: 'США', chn: '美国' },
}
const SERVICES = [
  { code: 'full', name: 'Full rent' },
  { code: 'go', name: 'Google,youtube,Gmail' },
  { code: 'ig', name: 'Instagram+Threads' },
  { code: 'lf', name: 'TikTok/Douyin' },
  { code: 'wa', name: 'Whatsapp' },
  { code: 'wb', name: 'WeChat' },
  { code: 'tg', name: 'Telegram' },
  { code: 'ot', name: 'Any other' },
  { code: 'dr', name: 'OpenAI' },
  { code: 'wx', name: 'Apple' },
  { code: 'acz', name: 'Claude ' },
]

export function defaultMockConfig(): MockConfig {
  return {
    balanceMicro: 12_442_200,
    minActivationSec: 120,
    durationSec: 1200,
    customDurations: { ig: { '0': 60, '6': 60 }, tg: { '6': 45, '151': 45 }, wx: { '6': 60 } },
    freeCancelSec: null,
    codeAfterSec: null,
    currency: 840,
    idAsNumber: false,
    cancelStyle: 'text',
    finishStyle: 'text',
    activeShape: 'data',
    prices: {
      'ot:187': { usd: 0.6, stock: 1000 },
      'ot:6': { usd: 0.024, stock: 1000 },
      'ot:52': { usd: 0.24, stock: 1000 },
      'dr:187': { usd: 0.66, stock: 1000 },
      'dr:52': { usd: 0.12, stock: 1000 },
      'dr:16': { usd: 0.045, stock: 1000, defaultCount: 63 },
      'acz:187': { usd: 0.3, stock: 1000 },
      'acz:48': { usd: 0.06, stock: 1000 },
      'tg:6': { usd: 0.15, stock: 1000 },
      'tg:48': { usd: 0.9, stock: 1000, defaultCount: 0, tiers: [[1.0483, 204], [1.1593, 793], [2.4831, 46024]] },
      'wa:6': { usd: 0.21, stock: 1000 },
      'ig:6': { usd: 0.0334, stock: 1000 },
      'wb:3': { usd: 0.5, stock: 1000 },
    },
    operators: {
      '6': ['axis', 'byu', 'indosat', 'smartfren', 'telkomsel', 'three'],
      '187': ['at_t', 'tmobile', 'verizon', 'textnow', 'mint_mobile'],
      '3': ['china_mobile', 'china_unicom', 'china_telecom', 'cmcc'],
    },
  }
}

/** 取号类故障缺省「其实已经买到」吗：结果未知类（超时、断连、乱码、缺 id、空体、文本形态、币种）默认买到；明确拒绝类默认没买到 */
const BOUGHT_DEFAULT: Partial<Record<FaultKind, boolean>> = {
  hang: true,
  reset: true,
  garbled: true,
  missing_id: true,
  empty: true,
  text_number: true,
  currency: true,
  quoted: true,
  http500: false,
  html502: false,
  http503: false,
}

// ───────────────────────── 预置场景（命令行 --scenario / POST /__mock/scenario） ─────────────────────────

export const SCENARIOS: Record<string, { note: string; faults?: Fault[]; config?: Partial<MockConfig> }> = {
  normal: { note: '正常：取号成功、等码，码要用 POST /__mock/sms 推' },
  'no-numbers': { note: '取号一直 200 NO_NUMBERS（E1）', faults: [{ action: 'getNumberV2', kind: 'no_numbers', times: 0 }] },
  timeout: { note: '下一次取号：号码其实买到了，但 20 秒后才回（客户端 15 秒超时 → UNKNOWN，v1 活跃列表里能看到它，E9 / §2.4）', faults: [{ action: 'getNumberV2', kind: 'hang', delayMs: 20_000, bought: true }] },
  'late-code': { note: '新号 30 秒后自动收到一条码（晚到的码）', config: { codeAfterSec: 30 } },
  'early-cancel-denied': { note: '取消一直 409 EARLY_CANCEL_DENIED（E15；不注入时 120 秒内取消本来也会这样）', faults: [{ action: 'setStatus', kind: 'early_cancel_denied', status: 8, times: 0 }] },
  'free-cancel-expired': { note: '取消一直 409 FREE_CANCELLATION_EXPIRED，号码到期也不退费（E55）', faults: [{ action: 'setStatus', kind: 'free_cancel_expired', status: 8, times: 0 }] },
  'new-otp': { note: '下一次放号 / 完成的瞬间来了一条新码 → 409 NEW_OTP_RECEIVED（info.data 带短信，E14 ③、T14）', faults: [{ action: 'setStatus', kind: 'otp_on_release' }] },
  'otp-on-cancel': { note: '下一次取消时号码已经收过码 → 409 OTP_RECEIVED（T11）', faults: [{ action: 'setStatus', kind: 'otp_received', status: 8 }] },
  http402: { note: '所有需要 key 的调用 402 NO_BALANCE（E3）', faults: [{ action: '*', kind: 'no_balance', times: 0 }] },
  http403: { note: '所有需要 key 的调用 403 BANNED（全局，E4）', faults: [{ action: '*', kind: 'banned_global', times: 0 }] },
  http404: { note: '所有需要 key 的调用 404 NOT_FOUND', faults: [{ action: '*', kind: 'not_found', times: 0 }] },
  http429: { note: 'v1 offers 一直 429 RATE_LIMIT（按服务退避）', faults: [{ action: 'v1:offers', kind: 'rate_limit', times: 0 }] },
  http1020: { note: '所有需要 key 的调用 403「error code: 1020」（E58）', faults: [{ action: '*', kind: 'cf1020', times: 0 }] },
  http5xx: { note: '所有需要 key 的调用 500 SERVER_ERROR（E20）', faults: [{ action: '*', kind: 'http500', times: 0 }] },
  garbled: { note: '所有需要 key 的调用 200 但响应体是乱码（取号：号码其实买到了，E24）', faults: [{ action: '*', kind: 'garbled', times: 0 }] },
  currency: { note: '取号成功但 currency=978（E56）', faults: [{ action: 'getNumberV2', kind: 'currency', times: 0 }] },
}

// ───────────────────────── 实现 ─────────────────────────

export interface StartOptions {
  port?: number
  host?: string
  key?: string
  config?: Partial<MockConfig>
  faults?: Fault[]
  /** 每个请求打一行（不含 key） */
  verbose?: boolean
}

export interface MockHandle {
  port: number
  /** 兼容协议地址（给 HEROSMS_BASE） */
  baseUrl: string
  /** v1 地址（给 HEROSMS_V1_BASE） */
  v1Url: string
  key: string
  config: MockConfig
  readonly activations: MockActivation[]
  readonly log: LogEntry[]
  /** 并发峰值（按 action、总计），给车道测试用 */
  stats: { inflight: Record<string, number>; maxInflight: Record<string, number>; inflightTotal: number; maxInflightTotal: number }
  now(): number
  advance(sec: number): void
  setFaults(faults: Fault[], replace?: boolean): void
  clearFaults(): void
  pendingFaults(): Fault[]
  pushSms(id: string, sms?: { code?: string | null; text?: string | null; from?: string; seen?: boolean }): string
  endActivation(id: string, status: 6 | 8 | 10): void
  buy(p: { service: string; country: number; operator?: string; count?: number; currency?: number }): MockActivation[]
  get(id: string): MockActivation | undefined
  setBalanceUsd(usd: number): void
  balanceMicro(): number
  resetStats(): void
  reset(config?: Partial<MockConfig>): void
  scenario(name: string): void
  close(): Promise<void>
}

interface ActiveFault extends Fault {
  left: number // 剩余次数；Infinity = 一直
  skipLeft: number
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function usd4(micro: number): string {
  return `${Math.floor(micro / 1e6)}.${String(Math.floor((micro % 1e6) / 100)).padStart(4, '0')}`
}
const microOf = (usd: number) => Math.round(usd * 1e6)
const rfc3339 = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, '+00:00')
const isoMicro = (ms: number) => new Date(ms).toISOString().replace(/\.(\d{3})Z$/, '.$1000Z')
/** 活跃列表的 activationTime：没有时区（照规格示例；按 UTC+3 写，故意和 UTC 差 3 小时，暴露误用） */
function noTz(ms: number): string {
  const d = new Date(ms + 3 * 3600_000).toISOString()
  return `${d.slice(0, 10)} ${d.slice(11, 19)}`
}
function redactPath(p: string): string {
  return p.replace(/(api[_-]?key=)[^&]*/gi, '$1***')
}

export async function startMockHeroSms(opts: StartOptions = {}): Promise<MockHandle> {
  const key = opts.key ?? 'mock-key'
  let config: MockConfig = { ...defaultMockConfig(), ...(opts.config ?? {}) }
  let offsetMs = 0
  let balance = config.balanceMicro
  let nextId = 900_000_001
  let nextSms = 3_416_690_001
  let phoneSeq = 0
  let acts: MockActivation[] = []
  let byId: Record<string, MockActivation> = {}
  let faults: ActiveFault[] = []
  const log: LogEntry[] = []
  const stats = { inflight: {} as Record<string, number>, maxInflight: {} as Record<string, number>, inflightTotal: 0, maxInflightTotal: 0 }

  const now = () => Date.now() + offsetMs

  function addFaults(list: Fault[], replace = false) {
    if (replace) faults = []
    for (const f of list) {
      const times = f.times ?? 1
      faults.push({ ...f, left: times === 0 ? Infinity : times, skipLeft: f.skip ?? 0 })
    }
  }
  addFaults(opts.faults ?? [])

  function takeFault(action: string, status?: number): ActiveFault | null {
    for (const f of faults) {
      if (f.left <= 0) continue
      if (f.action !== '*' && f.action !== action) continue
      if (f.status !== undefined && status !== undefined && f.status !== status) continue
      if (f.status !== undefined && status === undefined) continue
      if (f.skipLeft > 0) {
        f.skipLeft--
        continue
      }
      f.left--
      faults = faults.filter((x) => x.left > 0)
      return f
    }
    return null
  }

  function durationSecOf(service: string, country: number): number {
    const byC = config.customDurations[service]
    const min = byC ? (byC[String(country)] ?? byC['0']) : undefined
    return min ? min * 60 : config.durationSec
  }

  function createActivation(p: { service: string; country: number; operator?: string; costMicro: number; currency?: number; external?: boolean }): MockActivation {
    const t = now()
    const dial = DIAL[p.country] ?? 7
    phoneSeq++
    const a: MockActivation = {
      id: String(nextId++),
      service: p.service,
      country: p.country,
      operator: p.operator || 'any',
      phone: `${dial}${String(8_120_000_000 + phoneSeq)}`,
      dial,
      costMicro: p.costMicro,
      currency: p.currency ?? config.currency,
      createdAt: t,
      endsAt: t + durationSecOf(p.service, p.country) * 1000,
      status: 'ACTIVE',
      endedAt: null,
      sms: [],
      retry: false,
      noRefund: false,
      canGetAnotherSms: true,
      autoCodeAt: config.codeAfterSec != null ? t + config.codeAfterSec * 1000 : null,
      external: !!p.external,
    }
    acts.push(a)
    byId[a.id] = a
    return a
  }

  function pushSms(id: string, s: { code?: string | null; text?: string | null; from?: string; seen?: boolean } = {}): string {
    const a = byId[id]
    if (!a) throw new Error(`mock: 没有激活 ${id}`)
    const code = s.code === undefined ? String(100000 + ((Number(a.id) * 7 + a.sms.length * 13) % 900000)) : s.code
    const sid = String(nextSms++)
    a.sms.push({ id: sid, code, text: s.text === undefined ? (code ? `Your verification code is ${code}` : null) : s.text, from: s.from ?? 'Service', at: now(), seen: !!s.seen })
    a.retry = false
    return sid
  }

  function endActivation(a: MockActivation, status: 6 | 8 | 10) {
    if (a.status !== 'ACTIVE') return
    a.status = status === 6 ? 'FINISHED' : status === 8 ? 'CANCELLED' : 'REFUNDED'
    a.endedAt = now()
    if (status !== 6 && !a.noRefund && a.sms.length === 0) balance += a.costMicro
  }

  /** 推进虚拟时间里该发生的事：自动来码、到期 */
  function sweep() {
    const t = now()
    for (const a of acts) {
      if (a.status !== 'ACTIVE') continue
      if (a.autoCodeAt != null && t >= a.autoCodeAt) {
        a.autoCodeAt = null
        pushSms(a.id)
      }
      if (t >= a.endsAt) {
        if (a.sms.length) endActivation(a, 6)
        else if (a.noRefund) endActivation(a, 8)
        else endActivation(a, 10)
      }
    }
  }

  const priceOf = (service: string, country: number) => config.prices[`${service}:${country}`]
  const charged = (a: MockActivation) => a.sms.length > 0 || a.noRefund
  const markSeen = (a: MockActivation) => a.sms.forEach((s) => (s.seen = true))
  const lastSms = (a: MockActivation) => (a.sms.length ? a.sms[a.sms.length - 1] : null)
  const otpJson = (s: MockSms, a: MockActivation) => ({ id: s.id, phoneFrom: s.from, code: s.code, text: s.text, service: a.service, date: rfc3339(s.at), type: 'sms' })

  // ── 响应 ──
  type Resp = { http: number; body: string; headers?: Record<string, string> } | { destroy: true }
  const text = (s: string, httpCode = 200): Resp => ({ http: httpCode, body: s, headers: { 'content-type': 'text/plain; charset=utf-8' } })
  const json = (v: unknown, httpCode = 200): Resp => ({ http: httpCode, body: JSON.stringify(v), headers: { 'content-type': 'application/json' } })
  const errJson = (httpCode: number, title: string, details: string, info?: Record<string, unknown>): Resp => json(info ? { title, details, info } : { title, details }, httpCode)
  const HTML = (title: string) => `<!DOCTYPE html><html><head><title>${title}</title></head><body><h1>${title}</h1></body></html>`

  function faultResponse(f: ActiveFault, ctx: { url: URL; action: string }): Resp | null {
    switch (f.kind) {
      case 'no_numbers':
        return text('NO_NUMBERS')
      case 'wrong_max_price':
        return errJson(400, 'WRONG_MAX_PRICE', 'The maximum price is less than the permitted price', { min: 0.1234 })
      case 'wrong_max_price_text':
        return text('WRONG_MAX_PRICE:0.025')
      case 'no_balance':
        return errJson(402, 'NO_BALANCE', 'Payment Required')
      case 'banned_global': {
        const until = Math.floor(now() / 1000) + 3600
        return errJson(403, 'BANNED', 'Your account is temporarily suspended from making any purchases.', { scope: 'global', banned_until: until, retry_after_seconds: 3600, readable_date: new Date(until * 1000).toISOString().replace(/\.\d{3}Z$/, '+00:00') })
      }
      case 'banned_specific': {
        const until = Math.floor(now() / 1000) + 1800
        return errJson(403, 'BANNED', 'Account temporarily suspended for this specific country/service pair.', { scope: 'specific', banned_until: until, retry_after_seconds: 1800, readable_date: new Date(until * 1000).toISOString().replace(/\.\d{3}Z$/, '+00:00') })
      }
      case 'banned_text':
        return text("BANNED:'2026-2-13 12-00-00'")
      case 'channels_limit':
        return errJson(403, 'CHANNELS_LIMIT', 'You have reached the maximum number of concurrent threads (purchases) allowed for your account. Contact the technical support.', { current_threads: 10, max_allowed: 10 })
      case 'service_na':
        return errJson(403, 'SERVICE_NOT_AVAILABLE', 'Service not available for sale. Contact the technical support.')
      case 'account_inactive':
        return errJson(403, 'ACCOUNT_INACTIVE', 'Activate your account')
      case 'bad_key':
        return errJson(401, 'BAD_KEY', 'Unauthorized')
      case 'html403':
        return { http: 403, body: HTML('403 Forbidden'), headers: { 'content-type': 'text/html' } }
      case 'cf1020':
        return text('error code: 1020', 403)
      case 'http400':
        return text('Bad Request', 400)
      case 'not_found':
        return errJson(404, 'NOT_FOUND', 'Activation Not Found')
      case 'bad_action':
        return errJson(404, 'BAD_ACTION', 'Method Not Found')
      case 'rate_limit':
        return errJson(429, 'RATE_LIMIT', 'Too many requests')
      case 'http500':
        return errJson(500, 'SERVER_ERROR', 'Server Gone')
      case 'html502':
        return { http: 502, body: HTML('502 Bad Gateway'), headers: { 'content-type': 'text/html' } }
      case 'http503':
        return text('Service Unavailable', 503)
      case 'garbled':
        return text('\u0000\u0001ACC�SS_NUMBÿ{"activ')
      case 'empty':
        return text('')
      case 'not_active':
        return errJson(409, 'ACTIVATION_NOT_ACTIVE', 'Activation is terminated/refunded and Otp cannot be retrieved')
      case 'early_cancel_denied':
        return errJson(409, 'EARLY_CANCEL_DENIED', 'Activation cannot be cancelled at this time. Minimum activation period must pass.', { minActivationTime: 120 })
      case 'echo_key':
        return { http: 400, body: HTML(`Bad request: GET ${ctx.url.pathname}${ctx.url.search}`), headers: { 'content-type': 'text/html' } }
      case 'custom':
        return { http: f.http ?? 200, body: f.body ?? '' }
      case 'reset':
        return { destroy: true }
      default:
        return null // hang / quoted / currency / missing_id / text_number / free_cancel_expired / otp_*：在正常处理里生效
    }
  }

  // ── 兼容协议 ──
  function numberV2Json(a: MockActivation, drop?: 'id') {
    const o: Record<string, unknown> = {
      activationId: config.idAsNumber ? Number(a.id) : a.id,
      phoneNumber: a.phone,
      activationCost: a.costMicro / 1e6,
      currency: a.currency,
      countryCode: a.country,
      countryPhoneCode: a.dial,
      canGetAnotherSms: a.canGetAnotherSms,
      activationTime: rfc3339(a.createdAt),
      activationEndTime: rfc3339(a.endsAt),
      activationOperator: a.operator,
      verificationType: 'sms',
      subtype: 1,
      serviceCode: a.service,
      status: 4,
    }
    if (drop === 'id') delete o.activationId
    return o
  }

  /** 真正「买」一个号：返回激活或拒绝的响应 */
  function purchase(q: URLSearchParams, currency?: number): MockActivation | Resp {
    const service = q.get('service') || ''
    const countryStr = q.get('country') || ''
    if (!service) return errJson(422, 'UNPROCESSABLE_ENTITY', 'Validation failed', { field: 'service', code: 'REQUIRED', message: "Param 'service' is required." })
    if (!/^\d+$/.test(countryStr)) return errJson(422, 'UNPROCESSABLE_ENTITY', 'Validation failed', { field: 'country', code: 'REQUIRED', message: "Param 'country' is required." })
    const country = Number(countryStr)
    const pe = priceOf(service, country)
    if (!pe || pe.stock <= 0) return text('NO_NUMBERS')
    const costMicro = microOf(pe.usd)
    const maxPrice = q.get('maxPrice')
    if (maxPrice != null && maxPrice !== '' && microOf(Number(maxPrice)) < costMicro) return errJson(400, 'WRONG_MAX_PRICE', 'The maximum price is less than the permitted price', { min: pe.usd })
    if (balance < costMicro) return errJson(402, 'NO_BALANCE', 'Payment Required')
    const operator = q.get('operator') || 'any'
    if (operator !== 'any') {
      const ops = config.operators[String(country)] ?? []
      if (!operator.split(',').every((o) => ops.includes(o))) return text('NO_NUMBERS')
    }
    balance -= costMicro
    pe.stock--
    return createActivation({ service, country, operator, costMicro, currency })
  }

  function statusText(a: MockActivation): string {
    const last = lastSms(a)
    if (a.status === 'CANCELLED' || a.status === 'REFUNDED') return 'STATUS_CANCEL'
    if (a.status === 'FINISHED') return last && last.code ? `STATUS_OK:${last.code}` : 'STATUS_CANCEL'
    if (!last) return 'STATUS_WAIT_CODE'
    markSeen(a)
    if (a.retry) return `STATUS_WAIT_RETRY:${last.code ?? ''}`
    return `STATUS_OK:${last.code ?? ''}`
  }

  function setStatusResp(a: MockActivation | undefined, status: number, f: ActiveFault | null, style: 'text' | '204'): Resp {
    if (!a) return errJson(404, 'NOT_FOUND', 'Activation Not Found')
    if (f?.kind === 'otp_on_release') pushSms(a.id)
    if (f?.kind === 'otp_received' && a.sms.length === 0) pushSms(a.id, { seen: true })
    if (a.status !== 'ACTIVE') return errJson(409, 'ACTIVATION_NOT_ACTIVE', 'Activation is terminated/refunded and Otp cannot be retrieved')
    const unseen = a.sms.filter((s) => !s.seen)
    if (status === 8) {
      if (unseen.length) {
        markSeen(a)
        return errJson(409, 'NEW_OTP_RECEIVED', 'Otp was received on this number. Please confirm termination.', { data: unseen.map((s) => otpJson(s, a)) })
      }
      if (a.sms.length) return errJson(409, 'OTP_RECEIVED', 'Cannot terminate activation - OTP has been received on this number')
      const age = (now() - a.createdAt) / 1000
      if (age < config.minActivationSec) return errJson(409, 'EARLY_CANCEL_DENIED', 'Activation cannot be cancelled at this time. Minimum activation period must pass.', { minActivationTime: config.minActivationSec })
      const longNumber = a.endsAt - a.createdAt > 20 * 60_000
      const freeLimit = config.freeCancelSec ?? (longNumber ? 20 * 60 : null)
      if (f?.kind === 'free_cancel_expired' || (freeLimit != null && age > freeLimit)) {
        a.noRefund = true
        return errJson(409, 'FREE_CANCELLATION_EXPIRED', 'Cannot terminate activation - time limit exceeded (20 minutes)')
      }
      endActivation(a, 8)
      return style === '204' ? { http: 204, body: '' } : text('ACCESS_CANCEL')
    }
    if (status === 6) {
      if (unseen.length) {
        markSeen(a)
        return errJson(409, 'NEW_OTP_RECEIVED', 'Otp was received on this number. Please confirm termination.', { data: unseen.map((s) => otpJson(s, a)) })
      }
      endActivation(a, 6)
      return style === '204' ? { http: 204, body: '' } : text('ACCESS_ACTIVATION')
    }
    if (status === 3) {
      a.retry = true
      return text('ACCESS_RETRY_GET')
    }
    return errJson(400, 'BAD_STATUS', 'Wrong status code')
  }

  function activeListItem(a: MockActivation) {
    const last = lastSms(a)
    return {
      activationId: a.id,
      serviceCode: a.service,
      phoneNumber: a.phone,
      activationCost: a.costMicro / 1e6,
      currency: a.currency,
      activationStatus: last ? '2' : '4',
      smsCode: last ? last.code : null,
      smsText: last ? last.text : null,
      activationTime: noTz(a.createdAt),
      countryCode: String(a.country),
      countryName: COUNTRY_NAMES[a.country]?.eng ?? 'Country',
      canGetAnotherSms: a.canGetAnotherSms ? '1' : '0',
      verificationType: 'sms',
      subtype: 1,
    }
  }

  function offersEntry(pe: PriceEntry) {
    const tiers = pe.tiers ?? [
      [pe.usd, Math.floor(pe.stock * 0.9)],
      [Number((pe.usd * 1.25).toFixed(4)), Math.floor(pe.stock * 0.95)],
      [Number((pe.usd * 2).toFixed(4)), pe.stock],
    ]
    const map: Record<string, number> = {}
    for (const [p, n] of tiers) map[p.toFixed(4)] = n
    const def = Number((pe.usd / 1.2).toFixed(4))
    return {
      prices: { default: def, retail: pe.usd, min: pe.usd },
      counts: { total: pe.stock, physical: Math.floor(pe.stock / 3), defaultPrice: pe.defaultCount ?? Math.floor(pe.stock * 0.9) },
      map,
    }
  }

  async function handleCompat(url: URL, action: string, keyOk: boolean | null, entry: LogEntry): Promise<Resp> {
    const q = url.searchParams
    const noKeyActions = ['getServicesList', 'getCountries', 'getOperators']
    if (!noKeyActions.includes(action)) {
      if (keyOk === null) return errJson(422, 'UNPROCESSABLE_ENTITY', 'Validation failed', { field: 'api_key', code: 'REQUIRED', message: '' })
      if (!keyOk) return errJson(401, 'BAD_KEY', 'Unauthorized')
    }
    const statusParam = action === 'setStatus' ? Number(q.get('status')) : action === 'cancelActivation' ? 8 : action === 'finishActivation' ? 6 : undefined
    const f = noKeyActions.includes(action) ? null : takeFault(action, statusParam)
    if (f) {
      entry.fault = f.kind
      const bought = f.bought ?? BOUGHT_DEFAULT[f.kind] ?? false
      const isBuy = action === 'getNumberV2' || action === 'getNumber'
      if (isBuy && bought && !['hang', 'currency', 'missing_id', 'text_number', 'quoted'].includes(f.kind)) purchase(q) // 结果未知类：号码其实买到了
      const r = faultResponse(f, { url, action })
      if (r) return r
      if (f.kind === 'hang') {
        let bought1: MockActivation | Resp | null = null
        if (isBuy && bought) bought1 = purchase(q)
        await sleep(f.delayMs ?? 20_000)
        if (isBuy) {
          if (!bought) return text('NO_NUMBERS')
          if (bought1 && 'id' in bought1) return json(numberV2Json(bought1))
          return bought1 as Resp
        }
      }
    }
    sweep()
    const id = q.get('id') || ''
    const a = byId[id]
    switch (action) {
      case 'getBalance': {
        const body = `ACCESS_BALANCE:${usd4(balance)}`
        return f?.kind === 'quoted' ? json(body) : text(body)
      }
      case 'getNumber':
      case 'getNumberV2': {
        const r = purchase(q, f?.kind === 'currency' ? 978 : undefined)
        if (!('id' in r)) return r
        if (action === 'getNumber' || f?.kind === 'text_number') return text(`ACCESS_NUMBER:${r.id}:${r.phone}`)
        if (f?.kind === 'missing_id') return json(numberV2Json(r, 'id'))
        return json(numberV2Json(r))
      }
      case 'getStatus': {
        if (!a) return errJson(404, 'NOT_FOUND', 'Activation Not Found')
        const body = statusText(a)
        return f?.kind === 'quoted' ? json(body) : text(body)
      }
      case 'getStatusV2': {
        if (!a) return errJson(404, 'NOT_FOUND', 'Activation Not Found')
        if (a.status === 'CANCELLED' || a.status === 'REFUNDED') return text('STATUS_CANCEL')
        const last = lastSms(a)
        markSeen(a)
        // 等码时的真实形态未文档化（调研 U5），这里给一个认不出的形态
        return json({ verificationType: 'sms', data: last ? otpJson(last, a) : null })
      }
      case 'setStatus':
      case 'cancelActivation':
      case 'finishActivation': {
        if (action === 'setStatus' && !['3', '6', '8'].includes(q.get('status') || '')) return errJson(400, 'BAD_STATUS', 'Wrong status code')
        const style = action === 'setStatus' ? (statusParam === 8 ? config.cancelStyle : config.finishStyle) : '204'
        const r = setStatusResp(a, statusParam as number, f, style)
        if (f?.kind === 'quoted' && 'body' in r && r.http === 200) return json(r.body)
        return r
      }
      case 'getActiveActivations': {
        const start = Math.max(0, Number(q.get('start') || 0))
        const limit = Math.min(100, Math.max(1, Number(q.get('limit') || 100)))
        const active = acts.filter((x) => x.status === 'ACTIVE').sort((x, y) => Number(y.id) - Number(x.id))
        const page = active.slice(start, start + limit)
        page.forEach(markSeen)
        const items = page.map(activeListItem)
        if (config.activeShape === 'rows') return json({ status: 'success', data: [], activeActivations: { affected_rows: 0, num_rows: items.length, row: items[0] ?? [], rows: items } })
        return json(items.length ? { status: 'success', data: items } : { status: 'success', data: [], activeActivations: { affected_rows: 0, num_rows: 0, row: [], rows: [] } })
      }
      case 'getAllSms': {
        if (!a) return errJson(404, 'NOT_FOUND', 'Activation Not Found')
        if (a.status !== 'ACTIVE') return errJson(409, 'ACTIVATION_NOT_ACTIVE', 'Activation is terminated/refunded and Otp cannot be retrieved')
        markSeen(a)
        return json({ data: a.sms.map((s) => otpJson(s, a)), meta: { total: a.sms.length, service: a.service } })
      }
      case 'getPrices': {
        const svc = q.get('service')
        const cty = q.get('country')
        if (svc && !SERVICES.some((s) => s.code === svc)) return json({ status: 'false', msg: 'service is incorrect' })
        const out: Record<string, Record<string, unknown>> = {}
        for (const [k, pe] of Object.entries(config.prices)) {
          const [s, c] = k.split(':')
          if ((svc && s !== svc) || (cty && c !== cty)) continue
          ;(out[c] ??= {})[s] = { cost: pe.usd, count: pe.stock, physicalCount: Math.floor(pe.stock / 3) }
        }
        return json(out)
      }
      case 'getServicesList':
        return json({ status: 'success', services: SERVICES })
      case 'getCountries': {
        const out: Record<string, unknown> = {}
        for (const [id, n] of Object.entries(COUNTRY_NAMES)) out[id] = { id: Number(id), rus: n.rus, eng: n.eng, chn: n.chn, visible: 1, retry: 1, rent: 0 }
        return json(out)
      }
      case 'getOperators': {
        const c = q.get('country')
        if (c) {
          const ops = config.operators[c]
          return ops ? json({ status: 'success', countryOperators: { [c]: ops } }) : text('OPERATORS_NOT_FOUND')
        }
        return json({ status: 'success', countryOperators: config.operators })
      }
      default:
        return errJson(404, 'BAD_ACTION', 'Method Not Found')
    }
  }

  // ── v1 ──
  function v1Activation(a: MockActivation) {
    return {
      id: Number(a.id),
      status: a.sms.length ? 2 : 4,
      phone: a.phone,
      service: a.service,
      country: a.country,
      countryPhoneCode: a.dial,
      operator: a.operator,
      price: a.costMicro / 1e6,
      otpList: a.sms.map((s) => ({ id: s.id, smsCode: s.code, smsText: s.text, receivedAt: isoMicro(s.at), type: 'sms', phoneFrom: s.from, service: a.service })),
      createdAt: isoMicro(a.createdAt),
      expiredAt: isoMicro(a.endsAt),
      verificationType: 'sms',
      subtype: 1,
    }
  }

  function histStatus(a: MockActivation): number {
    return a.status === 'FINISHED' ? 6 : a.status === 'CANCELLED' ? 8 : 10
  }

  async function handleV1(url: URL, path: string, keyOk: boolean | null, entry: LogEntry): Promise<Resp> {
    const q = url.searchParams
    const route =
      path === '/activations'
        ? 'v1:activations'
        : path === '/activations/history'
          ? 'v1:history'
          : path === '/activations/stats'
            ? 'v1:stats'
            : /^\/activations\/offers\/(sms|call)$/.test(path)
              ? 'v1:offers'
              : path === '/classifiers/activations/custom-durations'
                ? 'v1:custom-durations'
                : 'v1:unknown'
    if (route !== 'v1:custom-durations') {
      if (keyOk === null) return json({ title: 'Unauthenticated.', details: 'Unauthenticated.' }, 401)
      if (!keyOk) return json({ title: 'BAD_API_KEY', details: 'Invalid API key' }, 403)
    }
    const f = route === 'v1:custom-durations' ? null : takeFault(route)
    if (f) {
      entry.fault = f.kind
      const r = faultResponse(f, { url, action: route })
      if (r) return r
      if (f.kind === 'hang') await sleep(f.delayMs ?? 20_000)
    }
    sweep()
    const page = Math.max(1, Number(q.get('page') || 1))
    const size = Math.min(25, Math.max(1, Number(q.get('size') || 25)))
    switch (route) {
      case 'v1:activations': {
        const active = acts.filter((x) => x.status === 'ACTIVE').sort((x, y) => Number(y.id) - Number(x.id))
        const items = active.slice((page - 1) * size, page * size).map(v1Activation)
        return json({ data: items, meta: { page, size, sort: { id: 'desc' }, total: active.length, filters: { countries: [], services: [] } } })
      }
      case 'v1:history': {
        const from = Date.parse(q.get('from') || '')
        const to = Date.parse(q.get('to') || '')
        if (Number.isNaN(from) || Number.isNaN(to)) return json({ title: 'UNPROCESSABLE_ENTITY', details: 'Validation failed', errors: { from: ['The from field is required.'] } }, 422)
        const services = q.getAll('services[]')
        const countries = q.getAll('countries[]').map(Number)
        const statuses = q.getAll('statuses[]').map(Number)
        const ended = acts
          .filter((x) => x.status !== 'ACTIVE' && x.createdAt >= from && x.createdAt <= to)
          .filter((x) => (!services.length || services.includes(x.service)) && (!countries.length || countries.includes(x.country)) && (!statuses.length || statuses.includes(histStatus(x))))
          .sort((x, y) => Number(y.id) - Number(x.id))
        const rows = ended.slice((page - 1) * size, page * size).map((x) => ({
          id: Number(x.id),
          createDate: isoMicro(x.createdAt),
          service: x.service,
          country: x.country,
          phone: Number(x.phone),
          moreCodes: x.sms.length ? x.sms.map((s) => s.code ?? '').filter(Boolean).join(' ') || null : null,
          cost: x.costMicro / 1e6, // 已取消的行也有值（就是标价），不代表扣费（调研 §3.4 第 6 条）
          status: histStatus(x),
          phoneCode: x.dial,
          currency: x.currency,
          subtype: 1,
        }))
        const success = ended.filter(charged)
        return json({
          data: rows,
          totals: { sum: Number((success.reduce((s, x) => s + x.costMicro, 0) / 1e6).toFixed(4)), successCount: success.filter((x) => x.sms.length > 0).length },
          meta: { page, size, sort: { id: 'desc' }, total: ended.length },
        })
      }
      case 'v1:stats': {
        const date = q.get('date') || ''
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ title: 'UNPROCESSABLE_ENTITY', details: 'Validation failed', errors: { date: ['The date field is required.'] } }, 422)
        const out: Record<string, Record<string, { count: number; success: number; percent: number }>> = {}
        for (const x of acts) {
          if (new Date(x.createdAt).toISOString().slice(0, 10) !== date) continue
          const cell = ((out[String(x.country)] ??= {})[x.service] ??= { count: 0, success: 0, percent: 0 })
          cell.count++
          if (x.sms.length) cell.success++
          cell.percent = Math.round((cell.success / cell.count) * 10000) / 100
        }
        return json({ data: out })
      }
      case 'v1:offers': {
        const services = (q.get('services') || '').split(',').filter(Boolean)
        const countries = (q.get('countries') || '').split(',').filter(Boolean)
        const data: Record<string, Record<string, unknown>> = {}
        for (const [k, pe] of Object.entries(config.prices)) {
          const [s, c] = k.split(':')
          if ((services.length && !services.includes(s)) || (countries.length && !countries.includes(c)) || pe.stock <= 0) continue
          ;(data[s] ??= {})[c] = offersEntry(pe)
        }
        if (!Object.keys(data).length) return json({ title: 'OFFER_NOT_FOUND', details: 'Offer not found' }, 404)
        const rateCountries: Record<string, number[]> = {}
        const deliv: Record<string, string[]> = {}
        for (const s of Object.keys(data)) {
          const cs = Object.keys(data[s])
          rateCountries[s] = cs.map(Number)
          deliv[s] = [...cs].reverse()
        }
        return json({
          data,
          meta: { page: null, size: null, sort: { rate: 'asc', deliverability: 'desc' }, total: null, hasMore: false, order: { rate: { services: Object.keys(data), countries: rateCountries }, deliverability: { countries: deliv } }, filters: { countries, services } },
        })
      }
      case 'v1:custom-durations':
        return json({ data: config.customDurations })
      default:
        return json({ title: 'NOT_FOUND', details: 'Not Found' }, 404)
    }
  }

  // ── 控制接口 ──
  async function readJson(req: http.IncomingMessage): Promise<Record<string, unknown>> {
    const chunks: Buffer[] = []
    for await (const c of req) chunks.push(c as Buffer)
    const s = Buffer.concat(chunks).toString('utf8').trim()
    if (!s) return {}
    const v = JSON.parse(s)
    return typeof v === 'object' && v ? v : {}
  }

  function snapshot() {
    return {
      now: now(),
      balanceUsd: balance / 1e6,
      activations: acts.map((a) => ({ ...a, sms: a.sms.map((s) => ({ ...s })) })),
      faults: pendingFaults(),
      stats,
      log: log.slice(-200),
    }
  }

  function pendingFaults(): Fault[] {
    return faults.map(({ left, skipLeft, ...f }) => ({ ...f, times: left === Infinity ? 0 : left, skip: skipLeft }))
  }

  function resetAll(cfg?: Partial<MockConfig>) {
    config = { ...defaultMockConfig(), ...(opts.config ?? {}), ...(cfg ?? {}) }
    offsetMs = 0
    balance = config.balanceMicro
    acts = []
    byId = {}
    faults = []
    log.length = 0
    resetStats()
  }

  function resetStats() {
    stats.inflight = {}
    stats.maxInflight = {}
    stats.inflightTotal = 0
    stats.maxInflightTotal = 0
  }

  function applyScenario(name: string) {
    const sc = SCENARIOS[name]
    if (!sc) throw new Error(`mock: 没有场景 ${name}（可用：${Object.keys(SCENARIOS).join(', ')}）`)
    if (sc.config) config = { ...config, ...sc.config }
    if (sc.faults) addFaults(sc.faults)
  }

  async function handleControl(req: http.IncomingMessage, path: string): Promise<Resp> {
    if (req.method === 'GET' && path === '/__mock/state') return json(snapshot())
    const body = req.method === 'POST' ? await readJson(req) : {}
    switch (path) {
      case '/__mock/reset':
        resetAll(body.config as Partial<MockConfig> | undefined)
        return json({ ok: true })
      case '/__mock/config':
        config = { ...config, ...(body as Partial<MockConfig>) }
        if (typeof body.balanceMicro === 'number') balance = body.balanceMicro
        return json({ ok: true, config })
      case '/__mock/faults':
        if (req.method === 'DELETE') faults = []
        else addFaults((body.faults as Fault[]) ?? [], !!body.replace)
        return json({ ok: true, faults: pendingFaults() })
      case '/__mock/sms':
        return json({ ok: true, smsId: pushSms(String(body.id), body as { code?: string; text?: string; from?: string }) })
      case '/__mock/end': {
        const a = byId[String(body.id)]
        if (!a) return json({ ok: false, error: 'no such activation' }, 404)
        endActivation(a, Number(body.status) as 6 | 8 | 10)
        return json({ ok: true })
      }
      case '/__mock/buy':
        return json({ ok: true, ids: buy(body as { service: string; country: number; operator?: string; count?: number }).map((a) => a.id) })
      case '/__mock/clock':
        offsetMs += Number(body.advanceSec || 0) * 1000
        sweep()
        return json({ ok: true, now: now() })
      case '/__mock/scenario':
        applyScenario(String(body.name))
        return json({ ok: true, faults: pendingFaults() })
      case '/__mock/stats/reset':
        resetStats()
        return json({ ok: true })
      default:
        return json({ ok: false, error: 'unknown control path' }, 404)
    }
  }

  function buy(p: { service: string; country: number; operator?: string; count?: number; currency?: number }): MockActivation[] {
    const out: MockActivation[] = []
    const pe = priceOf(p.service, p.country)
    const costMicro = pe ? microOf(pe.usd) : 100_000
    for (let i = 0; i < (p.count ?? 1); i++) out.push(createActivation({ service: p.service, country: p.country, operator: p.operator, costMicro, currency: p.currency, external: true }))
    return out
  }

  // ── HTTP ──
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1')
    const path = url.pathname
    const entry: LogEntry = { at: Date.now(), vt: now(), method: req.method || 'GET', path: redactPath(path + url.search), action: '', http: null }
    let action = ''
    if (path.startsWith('/__mock/')) {
      action = 'control'
    } else if (path.endsWith('/handler_api.php')) {
      action = url.searchParams.get('action') || ''
    } else if (path.startsWith('/api/v1/')) {
      action = `v1:${path.slice('/api/v1'.length)}`
    }
    entry.action = action
    const track = action !== 'control'
    if (track) {
      stats.inflight[action] = (stats.inflight[action] ?? 0) + 1
      stats.maxInflight[action] = Math.max(stats.maxInflight[action] ?? 0, stats.inflight[action])
      stats.inflightTotal++
      stats.maxInflightTotal = Math.max(stats.maxInflightTotal, stats.inflightTotal)
      // 收到就记（http 等回完再补）：挂起的请求也算「发过一次」
      log.push(entry)
      if (log.length > 2000) log.splice(0, log.length - 2000)
    }
    let r: Resp
    try {
      if (action === 'control') r = await handleControl(req, path)
      else if (path.endsWith('/handler_api.php')) {
        const k = url.searchParams.get('api_key')
        r = await handleCompat(url, action, k == null || k === '' ? null : k === key, entry)
      } else if (path.startsWith('/api/v1/')) {
        const auth = req.headers.authorization || ''
        const m = auth.match(/^ApiKey\s+(.+)$/)
        r = await handleV1(url, path.slice('/api/v1'.length), m ? m[1] === key : null, entry)
      } else r = json({ title: 'NOT_FOUND', details: 'Not Found' }, 404)
    } catch (e) {
      r = json({ title: 'SERVER_ERROR', details: `mock: ${(e as Error).message}` }, 500)
    }
    if (track) {
      stats.inflight[action]--
      stats.inflightTotal--
    }
    if ('destroy' in r) {
      req.socket.destroy()
      return
    }
    entry.http = r.http
    if (opts.verbose && track) console.log(`[mock-herosms] ${entry.method} ${action || path} → ${r.http}${entry.fault ? `（故障 ${entry.fault}）` : ''}`)
    try {
      res.writeHead(r.http, r.headers ?? {})
      res.end(r.body)
    } catch {
      /* 客户端已经超时断开 */
    }
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(opts.port ?? 0, opts.host ?? '127.0.0.1', () => resolve())
  })
  const port = (server.address() as AddressInfo).port
  const host = opts.host ?? '127.0.0.1'

  return {
    port,
    baseUrl: `http://${host}:${port}/stubs/handler_api.php`,
    v1Url: `http://${host}:${port}/api/v1`,
    key,
    get config() {
      return config
    },
    set config(c: MockConfig) {
      config = c
    },
    get activations() {
      return acts
    },
    log,
    stats,
    now,
    advance(sec: number) {
      offsetMs += sec * 1000
      sweep()
    },
    setFaults: (list, replace) => addFaults(list, replace),
    clearFaults: () => {
      faults = []
    },
    pendingFaults,
    pushSms,
    endActivation(id, status) {
      const a = byId[id]
      if (!a) throw new Error(`mock: 没有激活 ${id}`)
      endActivation(a, status)
    },
    buy,
    get: (id) => byId[id],
    setBalanceUsd(usd: number) {
      balance = microOf(usd)
    },
    balanceMicro: () => balance,
    resetStats,
    reset: resetAll,
    scenario: applyScenario,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections?.()
        server.close(() => resolve())
      }),
  }
}

// ───────────────────────── 命令行 ─────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const get = (name: string) => {
    const i = args.indexOf(name)
    return i >= 0 ? args[i + 1] : undefined
  }
  if (args.includes('--list') || args.includes('--help')) {
    console.log('可用场景（--scenario 可以给多个）：')
    for (const [k, v] of Object.entries(SCENARIOS)) console.log(`  ${k.padEnd(22)} ${v.note}`)
    return
  }
  const port = Number(get('--port') ?? 18555)
  const key = get('--key') ?? process.env.HEROSMS_API_KEY ?? 'mock-key'
  const m = await startMockHeroSms({ port, key, verbose: !args.includes('--quiet') })
  args.forEach((a, i) => {
    if (a === '--scenario' && args[i + 1]) m.scenario(args[i + 1])
  })
  console.log(`[mock-herosms] 已启动（只绑 127.0.0.1）。把应用的环境变量指过来：`)
  console.log(`  HEROSMS_BASE=${m.baseUrl}`)
  console.log(`  HEROSMS_V1_BASE=${m.v1Url}`)
  console.log(`  HEROSMS_API_KEY=<启动时给的 --key；默认 mock-key>`)
  console.log(`[mock-herosms] 控制：GET http://127.0.0.1:${m.port}/__mock/state ；POST /__mock/{reset,config,faults,sms,end,buy,clock,scenario}`)
  const pending = m.pendingFaults()
  if (pending.length) console.log(`[mock-herosms] 已装的故障：${pending.map((f) => `${f.action}:${f.kind}`).join('、')}`)
  const stop = () => m.close().then(() => process.exit(0))
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
}

if (process.argv[1] && /mock-herosms\.ts$/.test(process.argv[1].replace(/\\/g, '/'))) {
  main().catch((e) => {
    console.error('[mock-herosms] 启动失败：', (e as Error).message)
    process.exit(1)
  })
}
