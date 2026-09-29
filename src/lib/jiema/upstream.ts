/**
 * 短信接码 · 上游 hero-sms 的 HTTP 客户端（新写，D18；docs/短信接码-设计.md §6.2）。
 *
 * **不 import、也不改 `lib/herosms.ts`**：旧 Codex / Claude 单品继续走旧客户端，行为零变化（附录 B 第 6 条）。
 * 给旧客户端加超时会制造「不知道买没买到」再被自愈重取一次（调研 §6.9 第 4 条），所以新板块单独一个客户端。
 *
 * 【地址与 key】兼容协议 `HEROSMS_BASE`（沿用，默认 https://hero-sms.com/stubs/handler_api.php）；
 * v1 REST `HEROSMS_V1_BASE`（新，默认 https://hero-sms.com/api/v1，请求头 `Authorization: ApiKey …`）；key 沿用 `HEROSMS_API_KEY`。
 * 每次调用时读环境变量（集成测试把两个地址指向 scripts/mock-herosms.ts）。空字符串按没设处理（compose 里 `=${X}` 未定义时是空串）。
 *
 * 【超时】取号 15 秒，其余 8 秒（AbortController，连响应体一起算）；`cache: 'no-store'`；不跟随跳转（3xx 按认不出）。
 *
 * 【限流分车道】（上游每账户 50 RPS，超了 1020 / 400 并封账户 10 秒，调研 §1.1；旧链路另有自己的调用）进程内共 6 个并发槽、15 RPS：
 *  - 写与查码车道 `poll`（取号、放号、完成、getStatus、getStatusV2、getActiveActivations、v1 活跃列表、getAllSms、history，另加 getBalance）：
 *    优先级最高，目录车道最多占 3 个槽、7 RPS，所以它至少保留 3 个槽、8 RPS；**getNumberV2 另外串行化**（同一时刻只取一个号，避免撞线程上限）。
 *  - 目录车道 `catalog`（offers、getPrices、getServicesList、getCountries、getOperators、stats、custom-durations）：最多 3 个槽；**offers 全局 ≤1 RPS**；
 *    offers 返回 429 时按服务退避（60 秒起、翻倍、上限 10 分钟），退避期间本进程不发、直接返回 err(NOT_SENT)。
 *  排队超时（一直没轮到）同样返回 err(NOT_SENT)——请求根本没发出去，上游一定没成交（取号按 E58 的 REJECTED 处理，不占首次取号的次数）。
 *
 * 【重试】只读调用（状态、列表、价格）遇到网络错误重试 1 次；写调用（取号、放号、完成）**永不自动重试**。超时不重试。
 *
 * 【脱敏】永远不记 URL（兼容协议的 URL 带 api_key）；日志只打动作名、activationId、HTTP 状态、结果类别与错误码、耗时，
 * **不打响应原文**（里面有号码和短信）；`raw` 先把 key 原文换成 *** 再解析，解析器再按模式脱敏并截断到 2000 字（parse.sanitizeRaw）。
 *
 * 【调用计数】每次真正发出去的请求记一条事件，`breakerCounts()` 给熔断用（S2 的 holds.ts）：只数 timeout / network / http5xx，
 * 以及取号路径上的 unknown；只读调用的 noinfo 不计（E20）。
 *
 * 只在服务端用。
 */
import {
  parseBalance,
  parseGetNumberV2,
  parseGetStatus,
  parseGetStatusV2,
  parseSetStatus,
  parseActiveActivations,
  parseAllSms,
  parsePrices,
  parseServicesList,
  parseCountries,
  parseOperators,
  parseV1Activations,
  parseHistory,
  parseStats,
  parseOffers,
  parseCustomDurations,
  microToUsd4,
  type Up,
  type UpErr,
  type HttpIn,
  type BalanceData,
  type NumberData,
  type StatusData,
  type StatusV2Data,
  type SetStatusData,
  type ActivePage,
  type ActiveItem,
  type AllSmsData,
  type PricesData,
  type ServiceRow,
  type CountryRow,
  type OperatorsData,
  type V1ActivationsPage,
  type V1Activation,
  type HistoryData,
  type HistoryRow,
  type StatsData,
  type OffersData,
  type CustomDurations,
} from './parse'

// ───────────────────────── 常量 ─────────────────────────

export const DEFAULT_HEROSMS_BASE = 'https://hero-sms.com/stubs/handler_api.php'
export const DEFAULT_HEROSMS_V1_BASE = 'https://hero-sms.com/api/v1'

export const ACQUIRE_TIMEOUT_MS = 15_000
export const CALL_TIMEOUT_MS = 8_000
/** 传给上游的 maxPrice 至少 $0.0067（v1 文档的最小值，§4.1 的 eff） */
export const MIN_MAX_PRICE_MICRO = 6700
export const ACTIVE_PAGE_SIZE = 100
export const V1_PAGE_SIZE = 25
/** 分页上限：拉不全就是 noinfo（绝不把半截列表当成全部） */
export const MAX_PAGES = 40

export const LIMITS = {
  slots: 6,
  catalogSlots: 3,
  rps: 15,
  catalogRps: 7,
  offersRps: 1,
  pollQueueMs: 10_000,
  catalogQueueMs: 15_000,
  /** 取号：串行锁 + 车道排队合计的上限。15 秒超时加上它仍远小于 REQUESTING → UNKNOWN 的 60 秒（§2.4） */
  acquireQueueMs: 25_000,
  offersBackoffStartMs: 60_000,
  offersBackoffMaxMs: 600_000,
} as const

const POLL_MAX_BYTES = 2 * 1024 * 1024
const CATALOG_MAX_BYTES = 8 * 1024 * 1024

export type Lane = 'poll' | 'catalog'

interface Env {
  base: string
  v1: string
  key: string
}

function env(): Env {
  return {
    base: process.env.HEROSMS_BASE || DEFAULT_HEROSMS_BASE,
    v1: (process.env.HEROSMS_V1_BASE || DEFAULT_HEROSMS_V1_BASE).replace(/\/+$/, ''),
    key: process.env.HEROSMS_API_KEY || '',
  }
}

/** 配了 key 才能取号 / 查码 */
export function upstreamConfigured(): boolean {
  return !!env().key
}

// ───────────────────────── 车道调度（并发槽 + 1 秒滑动窗口限速） ─────────────────────────

interface Waiter {
  lane: Lane
  offers: boolean
  resolve: (ok: boolean) => void
  timer: ReturnType<typeof setTimeout> | null
}

class LaneScheduler {
  inflight: Record<Lane, number> = { poll: 0, catalog: 0 }
  private sent: { at: number; lane: Lane; offers: boolean }[] = []
  private queue: Waiter[] = []
  private wake: ReturnType<typeof setTimeout> | null = null

  /** 等一个槽；`waitMs` 内没轮到返回 false（请求不发） */
  acquire(lane: Lane, offers: boolean, waitMs: number): Promise<boolean> {
    return new Promise((resolve) => {
      const w: Waiter = { lane, offers, resolve, timer: null }
      w.timer = setTimeout(() => {
        const i = this.queue.indexOf(w)
        if (i >= 0) {
          this.queue.splice(i, 1)
          resolve(false)
        }
      }, Math.max(0, waitMs))
      this.queue.push(w)
      this.pump()
    })
  }

  release(lane: Lane): void {
    this.inflight[lane] = Math.max(0, this.inflight[lane] - 1)
    this.pump()
  }

  snapshot() {
    this.prune(Date.now())
    return {
      inflight: { ...this.inflight },
      queued: { poll: this.queue.filter((w) => w.lane === 'poll').length, catalog: this.queue.filter((w) => w.lane === 'catalog').length },
      sentLastSecond: this.sent.length,
    }
  }

  private prune(now: number) {
    while (this.sent.length && now - this.sent[0].at >= 1000) this.sent.shift()
  }

  private canDispatch(w: Waiter): boolean {
    if (this.inflight.poll + this.inflight.catalog >= LIMITS.slots) return false
    if (this.sent.length >= LIMITS.rps) return false
    if (w.lane === 'catalog') {
      if (this.inflight.catalog >= LIMITS.catalogSlots) return false
      if (this.sent.filter((s) => s.lane === 'catalog').length >= LIMITS.catalogRps) return false
      if (w.offers && this.sent.some((s) => s.offers)) return false
    }
    return true
  }

  private dispatch(w: Waiter, now: number) {
    this.queue.splice(this.queue.indexOf(w), 1)
    if (w.timer) clearTimeout(w.timer)
    this.inflight[w.lane]++
    this.sent.push({ at: now, lane: w.lane, offers: w.offers })
    w.resolve(true)
  }

  private pump() {
    const now = Date.now()
    this.prune(now)
    // 写与查码车道优先：它的队头放不出去（槽满或总速率满），目录车道一定也放不出去
    for (;;) {
      const head = this.queue.find((w) => w.lane === 'poll')
      if (!head || !this.canDispatch(head)) break
      this.dispatch(head, now)
    }
    if (!this.queue.some((w) => w.lane === 'poll')) {
      for (const w of this.queue.filter((x) => x.lane === 'catalog')) {
        if (this.canDispatch(w)) this.dispatch(w, now)
      }
    }
    // 还有人在等、而且是被速率窗口挡住的：到最早那条出窗时再试
    if (this.queue.length && this.sent.length && !this.wake) {
      const delay = Math.max(5, this.sent[0].at + 1000 - now + 1)
      this.wake = setTimeout(() => {
        this.wake = null
        this.pump()
      }, delay)
    }
  }
}

/** 取号串行锁（带等待上限） */
class Mutex {
  private locked = false
  private waiters: { resolve: (ok: boolean) => void; timer: ReturnType<typeof setTimeout> }[] = []

  lock(waitMs: number): Promise<boolean> {
    if (!this.locked) {
      this.locked = true
      return Promise.resolve(true)
    }
    return new Promise((resolve) => {
      const entry = {
        resolve,
        timer: setTimeout(() => {
          const i = this.waiters.indexOf(entry)
          if (i >= 0) {
            this.waiters.splice(i, 1)
            resolve(false)
          }
        }, Math.max(0, waitMs)),
      }
      this.waiters.push(entry)
    })
  }

  unlock(): void {
    const next = this.waiters.shift()
    if (next) {
      clearTimeout(next.timer)
      next.resolve(true) // 锁直接交给下一位
    } else {
      this.locked = false
    }
  }
}

// ───────────────────────── 调用事件（喂熔断）与日志节流 ─────────────────────────

export interface CallEvent {
  at: number
  action: string
  lane: Lane
  kind: 'ok' | 'err' | 'unknown' | 'noinfo'
  reason?: string
  code?: string
  acquire: boolean
}

/**
 * 熔断计数（纯函数）：窗口内真正发出去的调用数 `total`，以及「坏」的次数 `bad`：
 * timeout / network / http5xx，加上取号路径上的任何 unknown（E20）。只读调用的 noinfo、上游明确的 err 都不算坏。
 */
export function countBreaker(events: readonly CallEvent[], now: number, windowMs = 120_000): { total: number; bad: number } {
  let total = 0
  let bad = 0
  for (const e of events) {
    if (now - e.at > windowMs || e.at > now) continue
    total++
    if (e.kind === 'unknown' && (e.acquire || e.reason === 'timeout' || e.reason === 'network' || e.reason === 'http5xx')) bad++
  }
  return { total, bad }
}

interface UpstreamState {
  sched: LaneScheduler
  acquireLock: Mutex
  events: CallEvent[]
  offersBackoff: Map<string, { until: number; nextMs: number }>
  logThrottle: Map<string, { at: number; suppressed: number }>
}

const G = globalThis as unknown as { __jiemaUpstream?: UpstreamState }

function newState(): UpstreamState {
  return { sched: new LaneScheduler(), acquireLock: new Mutex(), events: [], offersBackoff: new Map(), logThrottle: new Map() }
}

function state(): UpstreamState {
  if (!G.__jiemaUpstream) G.__jiemaUpstream = newState()
  return G.__jiemaUpstream
}

const EVENTS_KEEP_MS = 10 * 60_000
const EVENTS_MAX = 5000

function recordEvent(e: CallEvent) {
  const st = state()
  st.events.push(e)
  const cutoff = e.at - EVENTS_KEEP_MS
  let drop = 0
  while (drop < st.events.length && (st.events[drop].at < cutoff || st.events.length - drop > EVENTS_MAX)) drop++
  if (drop) st.events.splice(0, drop)
}

/** 最近 `windowMs`（默认 2 分钟）的熔断计数（E20：≥5 次且占比 ≥50% 时打开，判定在 S2 的 holds.ts） */
export function breakerCounts(windowMs = 120_000): { total: number; bad: number } {
  return countBreaker(state().events, Date.now(), windowMs)
}

/** 调试 / 测试用：车道占用、排队、offers 退避 */
export function upstreamSnapshot() {
  const st = state()
  const now = Date.now()
  return {
    ...st.sched.snapshot(),
    offersBackoff: Array.from(st.offersBackoff.entries()).filter(([, v]) => v.until > now).map(([k, v]) => ({ key: k, retryAfterSec: Math.ceil((v.until - now) / 1000) })),
    events: st.events.length,
  }
}

/** 只给测试脚本用：清空进程内状态（车道、串行锁、事件、退避） */
export function resetUpstreamStateForTest(): void {
  G.__jiemaUpstream = newState()
}

const LOG_EVERY_MS = 10_000

function logOutcome(action: string, r: Up<unknown>, ms: number, id?: string) {
  if (r.kind === 'ok') return
  const what = r.kind === 'err' ? `err ${r.code}` : r.kind === 'unknown' ? `unknown ${r.reason}` : 'noinfo'
  const st = state()
  const k = `${action}|${what}`
  const now = Date.now()
  const t = st.logThrottle.get(k)
  if (t && now - t.at < LOG_EVERY_MS) {
    t.suppressed++
    return
  }
  st.logThrottle.set(k, { at: now, suppressed: 0 })
  if (st.logThrottle.size > 500) st.logThrottle.clear()
  const http = 'http' in r && r.http ? ` http=${r.http}` : ''
  const more = t && t.suppressed ? `（此前 10 秒内同类 ${t.suppressed} 条已省略）` : ''
  console.warn(`[jiema] upstream ${action}${id ? ` id=${id}` : ''} → ${what}${http} ${ms}ms${more}`)
}

// ───────────────────────── 发请求 ─────────────────────────

type RawResp =
  | { t: 'resp'; http: number; body: string; retryAfter: string | null }
  | { t: 'timeout'; ms: number }
  | { t: 'network'; code: string }
  | { t: 'toolarge'; http: number }

class TooLarge extends Error {}

async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const len = Number(res.headers.get('content-length') || '')
  if (Number.isFinite(len) && len > maxBytes) {
    await res.body?.cancel().catch(() => undefined)
    throw new TooLarge()
  }
  if (!res.body) return ''
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let n = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    n += value.byteLength
    if (n > maxBytes) {
      await reader.cancel().catch(() => undefined)
      throw new TooLarge()
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c.buffer, c.byteOffset, c.byteLength))).toString('utf8')
}

/** 网络错误只留一个错误码（不留 message：个别错误的 message 里会带 URL） */
function netCode(e: unknown): string {
  const any = e as { code?: unknown; cause?: { code?: unknown }; name?: unknown }
  const c = any?.cause?.code ?? any?.code ?? any?.name ?? 'Error'
  return String(c).replace(/[^A-Za-z0-9_]/g, '').slice(0, 40) || 'Error'
}

async function doFetch(url: string, headers: Record<string, string>, method: string, timeoutMs: number, maxBytes: number): Promise<RawResp> {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), timeoutMs)
  let http = 0
  try {
    const res = await fetch(url, { method, headers, signal: ac.signal, cache: 'no-store', redirect: 'manual' })
    http = res.status
    const body = await readCapped(res, maxBytes)
    return { t: 'resp', http, body, retryAfter: res.headers.get('retry-after') }
  } catch (e) {
    if (e instanceof TooLarge) return { t: 'toolarge', http }
    if (ac.signal.aborted) return { t: 'timeout', ms: timeoutMs }
    return { t: 'network', code: netCode(e) }
  } finally {
    clearTimeout(timer)
  }
}

interface Spec<T> {
  /** 日志与计数用的动作名（getNumberV2、setStatus、v1:offers …） */
  action: string
  lane: Lane
  /** 写调用：永不自动重试 */
  write: boolean
  /** 取号：串行化、15 秒超时、unknown 计入熔断 */
  acquire?: boolean
  /** offers 的按服务退避键；有它就受「offers 全局 ≤1 RPS」约束 */
  offersKey?: string
  /** 必须有 key 才发（没配 key 直接返回 err(NO_KEY)，不发请求） */
  needsKey: boolean
  url: (e: Env) => string
  v1Auth?: boolean
  method?: string
  maxBytes: number
  parse: (inp: HttpIn) => Up<T>
  /** 日志里带的 activationId */
  id?: string
}

function notSent<T>(why: string, retryAfterSec?: number): UpErr<T> {
  const e: UpErr<T> = { kind: 'err', code: 'NOT_SENT', http: 0, info: { reason: why }, raw: `本进程没有发出请求（${why}）` }
  if (retryAfterSec != null) e.retryAfterSec = retryAfterSec
  return e
}

function toUp<T>(r: RawResp, spec: Spec<T>, key: string): Up<T> {
  switch (r.t) {
    case 'timeout':
      return { kind: 'unknown', reason: 'timeout', raw: `timeout after ${r.ms}ms` }
    case 'network':
      return { kind: 'unknown', reason: 'network', raw: `network error ${r.code}` }
    case 'toolarge':
      return { kind: 'unknown', reason: 'parse', raw: `response too large (> ${spec.maxBytes} bytes)`, http: r.http || undefined }
    case 'resp': {
      const body = key && r.body.includes(key) ? r.body.split(key).join('***') : r.body
      return spec.parse({ http: r.http, body, retryAfter: r.retryAfter })
    }
  }
}

async function once<T>(spec: Spec<T>, e: Env, deadline: number): Promise<Up<T>> {
  const st = state()
  let url: string
  try {
    url = spec.url(e)
  } catch {
    return notSent('上游地址配置不合法')
  }
  const headers: Record<string, string> = { Accept: 'application/json, text/plain, */*' }
  if (spec.v1Auth && e.key) headers.Authorization = `ApiKey ${e.key}`
  const got = await st.sched.acquire(spec.lane, !!spec.offersKey, deadline - Date.now())
  if (!got) {
    const r = notSent<T>('排队超时')
    logOutcome(spec.action, r, 0, spec.id)
    return r
  }
  const t0 = Date.now()
  let r: Up<T>
  try {
    const raw = await doFetch(url, headers, spec.method ?? 'GET', spec.acquire ? ACQUIRE_TIMEOUT_MS : CALL_TIMEOUT_MS, spec.maxBytes)
    r = toUp(raw, spec, e.key)
  } finally {
    st.sched.release(spec.lane)
  }
  const ms = Date.now() - t0
  recordEvent({
    at: Date.now(),
    action: spec.action,
    lane: spec.lane,
    kind: r.kind,
    reason: r.kind === 'unknown' ? r.reason : undefined,
    code: r.kind === 'err' ? r.code : undefined,
    acquire: !!spec.acquire,
  })
  if (spec.offersKey) {
    if (r.kind === 'err' && (r.code === 'RATE_LIMIT' || r.http === 429)) {
      const prev = st.offersBackoff.get(spec.offersKey)
      const now = Date.now()
      const base = prev && prev.until > now - LIMITS.offersBackoffMaxMs ? prev.nextMs : LIMITS.offersBackoffStartMs
      const waitMs = Math.max(Math.min(base, LIMITS.offersBackoffMaxMs), (r.retryAfterSec ?? 0) * 1000)
      st.offersBackoff.set(spec.offersKey, { until: now + waitMs, nextMs: Math.min(waitMs * 2, LIMITS.offersBackoffMaxMs) })
    } else if (r.kind === 'ok') {
      st.offersBackoff.delete(spec.offersKey)
    }
  }
  logOutcome(spec.action, r, ms, spec.id)
  return r
}

async function call<T>(spec: Spec<T>): Promise<Up<T>> {
  const e = env()
  if (spec.needsKey && !e.key) return { kind: 'err', code: 'NO_KEY', http: 0, raw: 'HEROSMS_API_KEY 未配置，本进程没有发出请求' }
  const st = state()
  if (spec.offersKey) {
    const b = st.offersBackoff.get(spec.offersKey)
    const now = Date.now()
    if (b && b.until > now) return notSent('offers 限流退避中', Math.ceil((b.until - now) / 1000))
  }
  const deadline = Date.now() + (spec.acquire ? LIMITS.acquireQueueMs : spec.lane === 'catalog' ? LIMITS.catalogQueueMs : LIMITS.pollQueueMs)
  if (spec.acquire) {
    const ok = await st.acquireLock.lock(deadline - Date.now())
    if (!ok) {
      const r = notSent<T>('取号排队超时')
      logOutcome(spec.action, r, 0, spec.id)
      return r
    }
  }
  try {
    let r = await once(spec, e, deadline)
    // 只读调用：网络错误重试 1 次（超时不重试）；写调用永不自动重试
    if (!spec.write && r.kind === 'unknown' && r.reason === 'network') r = await once(spec, e, Date.now() + LIMITS.pollQueueMs)
    return r
  } finally {
    if (spec.acquire) st.acquireLock.unlock()
  }
}

// ───────────────────────── 参数校验（程序错误直接抛，不发请求） ─────────────────────────

const SERVICE_RE = /^[a-z0-9]{2,4}$/i
const OPERATOR_RE = /^[a-z0-9_]{2,40}$/i

function checkService(s: string): string {
  if (typeof s !== 'string' || !SERVICE_RE.test(s)) throw new TypeError('jiema upstream: 服务代码不合法')
  return s
}
function checkCountry(c: number): number {
  if (!Number.isInteger(c) || c < 0 || c > 999) throw new TypeError('jiema upstream: 国家 / 地区 id 不合法')
  return c
}
function checkId(id: string): string {
  if (typeof id !== 'string' || !/^\d{1,20}$/.test(id)) throw new TypeError('jiema upstream: activationId 不合法')
  return id
}
function checkPage(n: number, max: number, name: string): number {
  if (!Number.isInteger(n) || n < 0 || n > max) throw new TypeError(`jiema upstream: ${name} 不合法`)
  return n
}

/** 兼容协议的 URL（key 在 URL 里，所以这个字符串绝不能进日志） */
function compatUrl(e: Env, action: string, params: Record<string, string | number | undefined>, withKey = true): string {
  const u = new URL(e.base)
  if (withKey && e.key) u.searchParams.set('api_key', e.key)
  u.searchParams.set('action', action)
  for (const [k, v] of Object.entries(params)) if (v !== undefined) u.searchParams.set(k, String(v))
  return u.toString()
}

function v1Url(e: Env, path: string, params: [string, string | number][] = []): string {
  const u = new URL(`${e.v1}${path}`)
  for (const [k, v] of params) u.searchParams.append(k, String(v))
  return u.toString()
}

/** 失败结果换个数据类型往外传（CURRENCY 的 data 丢掉：分页汇总时单独处理） */
function failAs<T>(r: Exclude<Up<unknown>, { kind: 'ok' }>): Up<T> {
  if (r.kind === 'err') {
    const { data: _drop, ...rest } = r
    void _drop
    return rest as UpErr<T>
  }
  return r
}

// ───────────────────────── 兼容协议 ─────────────────────────

/** 余额（E26 的缓存刷新、E65 告警、熔断探活） */
export function getBalance(): Promise<Up<BalanceData>> {
  return call({ action: 'getBalance', lane: 'poll', write: false, needsKey: true, maxBytes: POLL_MAX_BYTES, parse: parseBalance, url: (e) => compatUrl(e, 'getBalance', {}) })
}

export interface AcquireParams {
  service: string
  country: number
  /** 指定运营商；空或 any = 任意 */
  operator?: string | null
  /** 取号上限 cap（微美元）；实际传给上游的是 max(cap, 6700)，4 位小数（§4.1） */
  maxPriceMicro: number
}

/**
 * 取号（getNumberV2，写调用）。**永不自动重试**；超时 15 秒 → unknown（结果未知，绝不重取，交给扫描器，D19）。
 * 结果用 parse.classifyAcquire 映射到 §3 的 E1–E9、E56、E58。不传 fixedPrice（D6）。
 */
export function getNumberV2(p: AcquireParams): Promise<Up<NumberData>> {
  const service = checkService(p.service)
  const country = checkCountry(p.country)
  if (!Number.isSafeInteger(p.maxPriceMicro) || p.maxPriceMicro <= 0) throw new TypeError('jiema upstream: maxPriceMicro 不合法')
  let operator: string | undefined
  if (p.operator && p.operator !== 'any') {
    if (!OPERATOR_RE.test(p.operator)) throw new TypeError('jiema upstream: 运营商代码不合法')
    operator = p.operator
  }
  const maxPrice = microToUsd4(Math.max(p.maxPriceMicro, MIN_MAX_PRICE_MICRO))
  return call({
    action: 'getNumberV2',
    lane: 'poll',
    write: true,
    acquire: true,
    needsKey: true,
    maxBytes: POLL_MAX_BYTES,
    parse: parseGetNumberV2,
    url: (e) => compatUrl(e, 'getNumberV2', { service, country, operator, maxPrice }),
  })
}

/** 单查（getStatus；状态枚举有完整文档，D10）。判定用 parse.judgeGetStatus */
export function getStatus(activationId: string): Promise<Up<StatusData>> {
  const id = checkId(activationId)
  return call({ action: 'getStatus', lane: 'poll', write: false, needsKey: true, maxBytes: POLL_MAX_BYTES, parse: parseGetStatus, id, url: (e) => compatUrl(e, 'getStatus', { id }) })
}

/** getStatusV2（只作补充，不据它判状态，D17） */
export function getStatusV2(activationId: string): Promise<Up<StatusV2Data>> {
  const id = checkId(activationId)
  return call({ action: 'getStatusV2', lane: 'poll', write: false, needsKey: true, maxBytes: POLL_MAX_BYTES, parse: parseGetStatusV2, id, url: (e) => compatUrl(e, 'getStatusV2', { id }) })
}

/**
 * setStatus（写调用，永不自动重试）：只收 3 / 6 / 8（规格示例里的 1 不在枚举里，调研 §1.6 第 5 条）。
 * 8 = 取消（放号，判定用 judgeRelease），6 = 完成（judgeFinish）。本期不用 3（D9 不提供「再收一条」按钮）。
 */
export function setStatus(activationId: string, status: 3 | 6 | 8): Promise<Up<SetStatusData>> {
  const id = checkId(activationId)
  if (status !== 3 && status !== 6 && status !== 8) throw new TypeError('jiema upstream: setStatus 只收 3 / 6 / 8')
  return call({ action: `setStatus${status}`, lane: 'poll', write: true, needsKey: true, maxBytes: POLL_MAX_BYTES, parse: parseSetStatus, id, url: (e) => compatUrl(e, 'setStatus', { id, status }) })
}

/** 放号：setStatus 8（D17、D42） */
export const cancelActivation = (activationId: string) => setStatus(activationId, 8)
/** 完成：setStatus 6（D17、D42） */
export const finishActivation = (activationId: string) => setStatus(activationId, 6)

/** getActiveActivations 的一页（start 偏移、limit ≤ 100） */
export function getActiveActivations(p: { start?: number; limit?: number } = {}): Promise<Up<ActivePage>> {
  const start = checkPage(p.start ?? 0, 1_000_000, 'start')
  const limit = checkPage(p.limit ?? ACTIVE_PAGE_SIZE, ACTIVE_PAGE_SIZE, 'limit')
  if (limit < 1) throw new TypeError('jiema upstream: limit 从 1 开始')
  return call({
    action: 'getActiveActivations',
    lane: 'poll',
    write: false,
    needsKey: true,
    maxBytes: POLL_MAX_BYTES,
    parse: parseActiveActivations,
    url: (e) => compatUrl(e, 'getActiveActivations', { start, limit }),
  })
}

export interface ActiveList {
  items: ActiveItem[]
  pages: number
}

/**
 * 拉全活跃列表：一页 100 条，一直翻到某页少于 100 条才算拉全（§6.5 第 1 步）。
 * **任何一页失败 → 整个结果就是那个失败**（绝不返回半截列表当 ok，§3.1「列表接口出错绝不当作空列表」）。
 * 有一页币种异常：返回 err(CURRENCY) 且 data 是拉全的列表（状态照样可判，E56）。
 */
export async function getAllActiveActivations(): Promise<Up<ActiveList>> {
  const seen = new Map<string, ActiveItem>()
  let currency: UpErr<ActivePage> | null = null
  for (let p = 0; p < MAX_PAGES; p++) {
    const r = await getActiveActivations({ start: p * ACTIVE_PAGE_SIZE, limit: ACTIVE_PAGE_SIZE })
    let page: ActivePage
    if (r.kind === 'ok') page = r.data
    else if (r.kind === 'err' && r.code === 'CURRENCY' && r.data) {
      page = r.data
      if (!currency) currency = r
    } else return failAs<ActiveList>(r)
    for (const it of page.items) if (!seen.has(it.activationId)) seen.set(it.activationId, it)
    if (page.count < ACTIVE_PAGE_SIZE) {
      const data: ActiveList = { items: Array.from(seen.values()), pages: p + 1 }
      if (currency) {
        const { data: _d, ...rest } = currency
        void _d
        return { ...rest, data }
      }
      return { kind: 'ok', data, raw: r.raw }
    }
  }
  return { kind: 'noinfo', raw: `活跃列表超过 ${MAX_PAGES} 页仍未拉全` }
}

/** getAllSms（取全文；激活取消或退款后 409 ACTIVATION_NOT_ACTIVE） */
export function getAllSms(activationId: string, p: { size?: number; page?: number } = {}): Promise<Up<AllSmsData>> {
  const id = checkId(activationId)
  const size = p.size === undefined ? undefined : checkPage(p.size, 100, 'size')
  const page = p.page === undefined ? undefined : checkPage(p.page, 10_000, 'page')
  return call({ action: 'getAllSms', lane: 'poll', write: false, needsKey: true, maxBytes: POLL_MAX_BYTES, parse: parseAllSms, id, url: (e) => compatUrl(e, 'getAllSms', { id, size, page }) })
}

/** getPrices（全量约 1.1MB；规格已标废弃，连续失败的降级在 S1 的 catalog，E28） */
export function getPrices(p: { service?: string; country?: number } = {}): Promise<Up<PricesData>> {
  const service = p.service === undefined ? undefined : checkService(p.service)
  const country = p.country === undefined ? undefined : checkCountry(p.country)
  return call({ action: 'getPrices', lane: 'catalog', write: false, needsKey: true, maxBytes: CATALOG_MAX_BYTES, parse: parsePrices, url: (e) => compatUrl(e, 'getPrices', { service, country }) })
}

/** getServicesList（实测免 key；配了 key 照样带上，上游改成要 key 时不至于断） */
export function getServicesList(p: { country?: number; lang?: string } = {}): Promise<Up<ServiceRow[]>> {
  const country = p.country === undefined ? undefined : checkCountry(p.country)
  if (p.lang !== undefined && !/^[a-z]{2}$/.test(p.lang)) throw new TypeError('jiema upstream: lang 不合法')
  const lang = p.lang
  return call({ action: 'getServicesList', lane: 'catalog', write: false, needsKey: false, maxBytes: CATALOG_MAX_BYTES, parse: parseServicesList, url: (e) => compatUrl(e, 'getServicesList', { country, lang }) })
}

/** getCountries（实测是以 id 为键的对象） */
export function getCountries(): Promise<Up<CountryRow[]>> {
  return call({ action: 'getCountries', lane: 'catalog', write: false, needsKey: false, maxBytes: CATALOG_MAX_BYTES, parse: parseCountries, url: (e) => compatUrl(e, 'getCountries', {}) })
}

/** getOperators（全量或单个国家；没有运营商列表的国家 → ok 空、notFound） */
export function getOperators(p: { country?: number } = {}): Promise<Up<OperatorsData>> {
  const country = p.country === undefined ? undefined : checkCountry(p.country)
  return call({ action: 'getOperators', lane: 'catalog', write: false, needsKey: false, maxBytes: CATALOG_MAX_BYTES, parse: parseOperators, url: (e) => compatUrl(e, 'getOperators', { country }) })
}

// ───────────────────────── v1 REST ─────────────────────────

/** v1 活跃列表的一页（每页 ≤25；带运营商、价格、带时区的 createdAt，UNKNOWN 认领用，§2.4） */
export function v1ListActivations(p: { page?: number; size?: number } = {}): Promise<Up<V1ActivationsPage>> {
  const page = checkPage(p.page ?? 1, 10_000, 'page')
  const size = checkPage(p.size ?? V1_PAGE_SIZE, V1_PAGE_SIZE, 'size')
  if (page < 1 || size < 1) throw new TypeError('jiema upstream: page / size 从 1 开始')
  return call({
    action: 'v1:activations',
    lane: 'poll',
    write: false,
    needsKey: true,
    v1Auth: true,
    maxBytes: POLL_MAX_BYTES,
    parse: parseV1Activations,
    url: (e) => v1Url(e, '/activations', [['page', page], ['size', size]]),
  })
}

export interface V1ActivationList {
  items: V1Activation[]
  pages: number
}

/** 拉全 v1 活跃列表：一直翻到某页少于 25 条。**任何一页失败、超时或认不出 → 这一轮作废**（返回那个失败，§2.4） */
export async function v1AllActivations(): Promise<Up<V1ActivationList>> {
  const seen = new Map<string, V1Activation>()
  for (let page = 1; page <= MAX_PAGES; page++) {
    const r = await v1ListActivations({ page, size: V1_PAGE_SIZE })
    if (r.kind !== 'ok') return failAs<V1ActivationList>(r)
    for (const it of r.data.items) if (!seen.has(it.id)) seen.set(it.id, it)
    if (r.data.count < V1_PAGE_SIZE) return { kind: 'ok', data: { items: Array.from(seen.values()), pages: page }, raw: r.raw }
  }
  return { kind: 'noinfo', raw: `v1 活跃列表超过 ${MAX_PAGES} 页仍未拉全` }
}

export interface HistoryQuery {
  from: Date
  to: Date
  services?: string[]
  countries?: number[]
  statuses?: Array<6 | 8 | 10>
}

/** ISO 8601、到秒、UTC（规格格式 YYYY-MM-DDTHH:MM:SSZ） */
function isoSec(d: Date): string {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) throw new TypeError('jiema upstream: 时间不合法')
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/** v1 history 的一页（结束状态确认与对账；每页 ≤25） */
export function v1History(q: HistoryQuery & { page?: number; size?: number }): Promise<Up<HistoryData>> {
  const params: [string, string | number][] = [
    ['from', isoSec(q.from)],
    ['to', isoSec(q.to)],
  ]
  for (const s of q.services ?? []) params.push(['services[]', checkService(s)])
  for (const c of q.countries ?? []) params.push(['countries[]', checkCountry(c)])
  for (const st of q.statuses ?? []) {
    if (st !== 6 && st !== 8 && st !== 10) throw new TypeError('jiema upstream: history 状态只收 6 / 8 / 10')
    params.push(['statuses[]', st])
  }
  const page = checkPage(q.page ?? 1, 10_000, 'page')
  const size = checkPage(q.size ?? V1_PAGE_SIZE, V1_PAGE_SIZE, 'size')
  if (page < 1 || size < 1) throw new TypeError('jiema upstream: page / size 从 1 开始')
  params.push(['page', page], ['size', size])
  return call({ action: 'v1:history', lane: 'poll', write: false, needsKey: true, v1Auth: true, maxBytes: POLL_MAX_BYTES, parse: parseHistory, url: (e) => v1Url(e, '/activations/history', params) })
}

export interface HistoryAll {
  rows: HistoryRow[]
  pages: number
  totals: HistoryData['totals']
}

/** 拉全一段时间的 history（翻到某页少于 25 条或 hasMore=false）；任何一页失败 → 返回那个失败 */
export async function v1HistoryAll(q: HistoryQuery): Promise<Up<HistoryAll>> {
  const seen = new Map<string, HistoryRow>()
  let currency: UpErr<HistoryData> | null = null
  let totals: HistoryData['totals'] = null
  for (let page = 1; page <= MAX_PAGES; page++) {
    const r = await v1History({ ...q, page, size: V1_PAGE_SIZE })
    let d: HistoryData
    if (r.kind === 'ok') d = r.data
    else if (r.kind === 'err' && r.code === 'CURRENCY' && r.data) {
      d = r.data
      if (!currency) currency = r
    } else return failAs<HistoryAll>(r)
    if (page === 1) totals = d.totals
    for (const row of d.rows) if (!seen.has(row.id)) seen.set(row.id, row)
    if (d.count < V1_PAGE_SIZE || d.meta.hasMore === false) {
      const data: HistoryAll = { rows: Array.from(seen.values()), pages: page, totals }
      if (currency) {
        const { data: _d, ...rest } = currency
        void _d
        return { ...rest, data }
      }
      return { kind: 'ok', data, raw: r.raw }
    }
  }
  return { kind: 'noinfo', raw: `history 超过 ${MAX_PAGES} 页仍未拉全` }
}

/** v1 `/activations/stats?date=YYYY-MM-DD`（组合与账户成功率监控，D43；目录车道） */
export function v1Stats(date: string): Promise<Up<StatsData>> {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new TypeError('jiema upstream: date 需要 YYYY-MM-DD')
  return call({ action: 'v1:stats', lane: 'catalog', write: false, needsKey: true, v1Auth: true, maxBytes: CATALOG_MAX_BYTES, parse: parseStats, url: (e) => v1Url(e, '/activations/stats', [['date', date]]) })
}

/**
 * v1 offers（报价与库存档位，D21、D22）。目录车道、**全局 ≤1 RPS**；429 → 按服务退避（60 秒起翻倍，上限 10 分钟），
 * 退避期间直接返回 err(NOT_SENT)（带 retryAfterSec）。services 为空 = 全量（约 3.4MB，§6.3 不建议定时拉）。
 */
export function v1Offers(p: { services?: string[]; countries?: number[] } = {}): Promise<Up<OffersData>> {
  const services = (p.services ?? []).map(checkService)
  const countries = (p.countries ?? []).map(checkCountry)
  const params: [string, string | number][] = []
  if (services.length) params.push(['services', services.join(',')])
  if (countries.length) params.push(['countries', countries.join(',')])
  const offersKey = services.length ? [...services].sort().join(',') : '*'
  return call({
    action: 'v1:offers',
    lane: 'catalog',
    write: false,
    needsKey: true,
    v1Auth: true,
    offersKey,
    maxBytes: CATALOG_MAX_BYTES,
    parse: parseOffers,
    url: (e) => v1Url(e, '/activations/offers/sms', params),
  })
}

/** v1 custom-durations（免鉴权；D42 不据它判定例外时长，只给目录展示与后台参考） */
export function v1CustomDurations(): Promise<Up<CustomDurations>> {
  return call({
    action: 'v1:custom-durations',
    lane: 'catalog',
    write: false,
    needsKey: false,
    maxBytes: CATALOG_MAX_BYTES,
    parse: parseCustomDurations,
    url: (e) => v1Url(e, '/classifiers/activations/custom-durations'),
  })
}
