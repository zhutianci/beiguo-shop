/**
 * 短信接码 S0 纯函数自测（不连库、不发请求）：
 *   npx tsx scripts/check-jiema-parse.ts
 *
 * 对应 docs/短信接码-设计.md：§12.1 第 4 条（解析器的每一种形态与 §3.1 的判定）、§11 S0 验收「解析器覆盖调研 §1.6 列出的每一种形态
 * 与 §3.1 的判定表」；另加 §3 E1–E9 / E56 / E58 的取号分类、脱敏与截断、微美元换算、熔断计数、客户端参数校验，
 * 以及 2026-09-29 带 key 只读实测的真实返回（调研 §3.2、scratchpad/probe2.out，号码已换成假号）。
 */
import {
  usdToMicro,
  microToUsd4,
  parseTzDate,
  toBool,
  toPhone,
  toActivationId,
  redact,
  sanitizeRaw,
  RAW_MAX,
  readBody,
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
  classifyAcquire,
  judgeGetStatus,
  judgeGetStatusV2,
  judgeRelease,
  judgeFinish,
  judgeFromActiveList,
  judgeHistory,
  noinfoVerdict,
  codeFromMoreCodes,
  errBan,
  errThreads,
  errMinPriceMicro,
  errOtpList,
  type Up,
  type Verdict,
  type HttpIn,
} from '../src/lib/jiema/parse'
import {
  countBreaker,
  setStatus,
  getNumberV2,
  getStatus,
  v1History,
  v1Stats,
  getActiveActivations,
  v1ListActivations,
  acquireClaimWindow,
  pagingShortfall,
  resetUpstreamStateForTest,
  ACQUIRE_TIMEOUT_MS,
  LIMITS,
  type CallEvent,
} from '../src/lib/jiema/upstream'

let failed = 0
let passed = 0
function ok(cond: boolean, name: string, detail = '') {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.log(`  ✗ ${name} ${detail}`)
  }
}
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
function throws(fn: () => unknown): boolean {
  try {
    fn()
    return false
  } catch {
    return true
  }
}
const H = (http: number, body: string, retryAfter?: string): HttpIn => ({ http, body, retryAfter })
const J = (http: number, v: unknown) => H(http, JSON.stringify(v))
const kindOf = (r: Up<unknown>) => (r.kind === 'err' ? `err:${r.code}` : r.kind === 'unknown' ? `unknown:${r.reason}` : r.kind)
const v = (x: Verdict) => x.v

// 规格原文的错误体（compact_en.txt）
const E = {
  badKey: { title: 'BAD_KEY', details: 'Unauthorized' },
  noBalance: { title: 'NO_BALANCE', details: 'Payment Required' },
  channels: { title: 'CHANNELS_LIMIT', details: 'You have reached the maximum number of concurrent threads (purchases) allowed for your account. Contact the technical support.', info: { current_threads: 0, max_allowed: -1 } },
  serviceNa: { title: 'SERVICE_NOT_AVAILABLE', details: 'Service not available for sale. Contact the technical support.' },
  banGlobal: { title: 'BANNED', details: 'Your account is temporarily suspended from making any purchases.', info: { scope: 'global', banned_until: 1739448000, retry_after_seconds: 3600, readable_date: '2026-02-13T12:00:00+00:00' } },
  banSpecific: { title: 'BANNED', details: 'Account temporarily suspended for this specific country/service pair.', info: { scope: 'specific', banned_until: 1739448000, retry_after_seconds: 3600, readable_date: '2026-02-20T15:00:00+00:00' } },
  inactive: { title: 'ACCOUNT_INACTIVE', details: 'Activate your account' },
  wrongMax: { title: 'WRONG_MAX_PRICE', details: 'The maximum price is less than the permitted price', info: { min: 0.1234 } },
  notFound: { title: 'NOT_FOUND', details: 'Activation Not Found' },
  badAction: { title: 'BAD_ACTION', details: 'Method Not Found' },
  server: { title: 'SERVER_ERROR', details: 'Server Gone' },
  newOtp: {
    title: 'NEW_OTP_RECEIVED',
    details: 'Otp was received on this number. Please confirm termination.',
    info: {
      data: [
        { id: '3416693217', phoneFrom: 'Telegram', code: '123456', text: 'Telegram code 123456', service: 'tg', date: '2026-02-16T12:36:59+03:00', type: 'sms' },
        { id: '3416693218', phoneFrom: '213421421431', code: null, text: null, service: 'tg', date: '2026-02-16T12:36:59+03:00', type: 'call' },
      ],
    },
  },
  freeExpired: { title: 'FREE_CANCELLATION_EXPIRED', details: 'Cannot terminate activation - time limit exceeded (20 minutes)' },
  otpReceived: { title: 'OTP_RECEIVED', details: 'Cannot terminate activation - OTP has been received on this number' },
  notActive: { title: 'ACTIVATION_NOT_ACTIVE', details: 'Activation is terminated/refunded and Otp cannot be retrieved' },
  early: { title: 'EARLY_CANCEL_DENIED', details: 'Activation cannot be cancelled at this time. Minimum activation period must pass.', info: { minActivationTime: 120 } },
}
const V2_OK = { activationId: '635468024', phoneNumber: '79584123456', activationCost: 12.5, currency: 840, countryCode: 6, countryPhoneCode: 62, canGetAnotherSms: true, activationTime: '2026-02-18T16:11:33+00:00', activationEndTime: '2026-02-18T18:11:23+00:00', activationOperator: 'any', verificationType: 'sms', subtype: 1, serviceCode: 'vk', status: 4 }

console.log('\n[换算] 美元 → 微美元（十进制逐位，不做浮点乘法）')
ok(usdToMicro(0.1195) === 119500 && usdToMicro('0.0480') === 48000 && usdToMicro(12.4422) === 12442200, '0.1195 → 119500、"0.0480" → 48000、12.4422 → 12442200（浮点乘法会得到 119499.99…）')
ok(usdToMicro(0.6) === 600000 && usdToMicro(0.66) === 660000 && usdToMicro(25) === 25_000_000 && usdToMicro('3.0000') === 3_000_000, '0.6 / 0.66 / 25 / "3.0000"')
ok(usdToMicro('.5') === 500000 && usdToMicro('0.12345678') === 123457 && usdToMicro(0.0000005) === 1 && usdToMicro(1e-7) === 0, '".5"、第 7 位小数四舍五入、科学计数法的小数')
ok(usdToMicro(-1) === null && usdToMicro(NaN) === null && usdToMicro('abc') === null && usdToMicro('') === null && usdToMicro(null) === null && usdToMicro('1e-7') === null && usdToMicro(1e21) === null, '负数、NaN、非数字、空、字符串科学计数法、超界 → null')
ok(microToUsd4(825000) === '0.8250' && microToUsd4(6700) === '0.0067' && microToUsd4(25_000_000) === '25.0000' && microToUsd4(123456) === '0.1234', 'maxPrice 4 位小数（向下取到 0.0001）')
ok(throws(() => microToUsd4(-1)) && throws(() => microToUsd4(1.5)), '负数、非整数微美元：抛错')

console.log('\n[换算] 时间只认带时区的（调研 §1.6 第 9 条、附录 B 第 12 条）')
ok(parseTzDate('2026-09-28T11:41:10.000000Z')?.toISOString() === '2026-09-28T11:41:10.000Z', 'history 实测 createDate（6 位小数 + Z）')
ok(parseTzDate('2026-02-18T18:11:23+00:00')?.toISOString() === '2026-02-18T18:11:23.000Z' && parseTzDate('2026-02-16T12:36:59+03:00')?.toISOString() === '2026-02-16T09:36:59.000Z', 'RFC3339 +00:00 / +03:00 换成 UTC')
ok(parseTzDate('2026-02-16T12:36:59+0300')?.toISOString() === '2026-02-16T09:36:59.000Z', '±hhmm 写法')
ok(parseTzDate('2022-06-01 16:59:16') === null && parseTzDate('2025-03-18 10:40:37') === null && parseTzDate('2025-12-16T10:30:00') === null, '没有时区 → null（getActiveActivations 的 activationTime、规格示例的 history）')
ok(parseTzDate('yesterday') === null && parseTzDate(1739448000) === null && parseTzDate('2026-13-45T99:99:99Z') === null, '乱写、数字、不存在的日期 → null')
ok(parseTzDate('2026-02-30T00:00:00Z') === null && parseTzDate('2026-02-29T00:00:00Z') === null && parseTzDate('2026-04-31T08:00:00+08:00') === null, '日历上不存在的日子（2 月 30 日、平年 2 月 29 日、4 月 31 日）→ null，不进位成下个月')
ok(parseTzDate('2026-02-01T24:00:00Z') === null && parseTzDate('2026-02-01T23:60:00Z') === null && parseTzDate('2026-02-01T23:59:60Z') === null, '24 点、60 分、60 秒 → null，不进位成第二天')
ok(parseTzDate('2026-02-01T10:00:00+15:00') === null && parseTzDate('2026-02-01T10:00:00+03:60') === null && parseTzDate('1969-12-31T23:59:59Z') === null, '时区偏移超过 ±14:59、1970 年以前 → null')
ok(parseTzDate('2024-02-29T23:59:59.999-05:00')?.toISOString() === '2024-03-01T04:59:59.999Z' && parseTzDate('2026-12-31T23:30:00-01:00')?.toISOString() === '2027-01-01T00:30:00.000Z', '闰年 2 月 29 日合法；换成 UTC 跨日、跨年照常')

console.log('\n[换算] 字段两种写法都认（调研 §1.6 第 4 条）')
ok(toBool(true) === true && toBool('1') === true && toBool(1) === true && toBool('true') === true, 'canGetAnotherSms：true / "1" / 1 / "true"')
ok(toBool(false) === false && toBool('0') === false && toBool(0) === false && toBool('x') === null && toBool(undefined) === null, 'false / "0" / 0；认不出 → null')
ok(toActivationId('635468024') === '635468024' && toActivationId(635468024) === '635468024' && toActivationId('abc') === null && toActivationId(1.5) === null, 'activationId：字符串或数字')
ok(toPhone('+62 812-3456-7890') === '6281234567890' && toPhone(79991234567) === '79991234567' && toPhone('79584******') === null && toPhone('123') === null, '号码：去掉 + 与分隔符；打码的、太短的 → null')

console.log('\n[脱敏] key 绝不进 raw（§6.2、§10.2）')
{
  const key = 'a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6'
  const url = `https://hero-sms.com/stubs/handler_api.php?api_key=${key}&action=getStatus&id=1`
  ok(!redact(url).includes(key) && redact(url).includes('api_key=***&action=getStatus'), 'URL 里的 api_key=… → ***（其余参数保留）')
  ok(!redact(`Authorization: ApiKey ${key}`).includes(key) && !redact(`{"api_key":"${key}"}`).includes(key), 'ApiKey 头、JSON 里的 "api_key"')
  ok(!redact(`echo ${key} back`, [key]).includes(key) && redact(`echo ${key} back`, [key]) === 'echo *** back', '调用方给出的 key 原文（上游把 URL 回显进报错页也挡得住）')
  const long = 'x'.repeat(1990) + key + 'y'.repeat(5000)
  const s = sanitizeRaw(long, [key])
  ok(s.length === RAW_MAX && s.endsWith('…') && !s.includes(key.slice(0, 8)), '截断到 2000 字；跨截断边界的 key 先脱敏再截（不留半截）')
  ok(sanitizeRaw('ab\u0000cd') === 'abcd' && sanitizeRaw('短') === '短', '去掉 NUL；短文本原样')
  const sur = 'a'.repeat(RAW_MAX - 2) + '😀' + 'b'.repeat(10)
  const ss = sanitizeRaw(sur)
  ok(!/[\ud800-\udbff]…$/.test(ss) && ss.endsWith('…'), '截断不留半个代理对（写库不报 Incorrect string value）')
}

console.log('\n[调研 §1.6 第 1 条] 先看 HTTP 状态码，再看 JSON / 文本，去掉引号')
ok(kindOf(parseGetNumberV2(H(500, 'ACCESS_NUMBER:1:79991234567'))) === 'unknown:http5xx', '5xx 不看响应体：取号 → unknown(http5xx)')
ok(kindOf(parseGetNumberV2(J(500, E.server))) === 'unknown:http5xx' && kindOf(parseGetStatus(J(500, E.server))) === 'unknown:http5xx', '500 SERVER_ERROR（JSON）→ unknown(http5xx)')
{
  const q = parseGetStatus(H(200, '"STATUS_WAIT_CODE"'))
  ok(q.kind === 'ok' && q.data.s === 'WAIT_CODE', '被 JSON 引号包住的文本（"STATUS_WAIT_CODE"）照样认')
  ok(eq(readBody("'STATUS_CANCEL'"), { t: 'text', s: 'STATUS_CANCEL' }) && eq(readBody('  ﻿STATUS_OK:1 '), { t: 'text', s: 'STATUS_OK:1' }), '单引号包裹、BOM 与首尾空白')
  ok(readBody('{"a":').t === 'bad' && readBody('<html><body>x</body></html>').t === 'html' && readBody('').t === 'empty', '截断的 JSON → bad；HTML → html；空 → empty')
}

console.log('\n[调研 §1.6 第 2 条] NO_NUMBERS 的几种形态')
{
  const a = parseGetNumberV2(H(200, 'NO_NUMBERS'))
  ok(kindOf(a) === 'err:NO_NUMBERS' && classifyAcquire(a).c === 'NO_NUMBERS', 'getNumberV2 没号：200 纯文本 NO_NUMBERS → E1')
  const b = parseGetNumberV2(J(404, { title: 'NO_NUMBERS', details: 'No numbers' }))
  ok(kindOf(b) === 'err:NO_NUMBERS' && classifyAcquire(b).c === 'NO_NUMBERS', '404 JSON NO_NUMBERS（getRentNumber 的写法）→ 同样 E1，不是 REJECTED')
  ok(kindOf(parseGetNumberV2(J(200, { title: 'NO_NUMBERS' }))) === 'err:NO_NUMBERS', '200 JSON 带 title NO_NUMBERS → E1')
}

console.log('\n[§12.1 第 4 条] 取号：ACCESS_NUMBER 文本；getNumberV2 JSON（id 字符串或数字；canGetAnotherSms 布尔与 "1"/"0"）')
{
  const t = parseGetNumberV2(H(200, 'ACCESS_NUMBER:123456789:79991234567'))
  ok(t.kind === 'ok' && t.data.activationId === '123456789' && t.data.phone === '79991234567' && t.data.textForm && t.data.costMicro === null && t.data.activationEndTime === null, '文本形态：有 id 和号码，没有成本与有效期（textForm）')
  ok(classifyAcquire(t).c === 'ACTIVE', '文本形态照样是取到号（号码已买到，不能丢）')
  const j = parseGetNumberV2(J(200, V2_OK))
  ok(
    j.kind === 'ok' &&
      j.data.activationId === '635468024' &&
      j.data.phone === '79584123456' &&
      j.data.costMicro === 12_500_000 &&
      j.data.currency === 840 &&
      j.data.countryCode === 6 &&
      j.data.dialCode === '62' &&
      j.data.canGetAnotherSms === true &&
      j.data.operator === 'any' &&
      j.data.status === 4 &&
      !j.data.textForm,
    'getNumberV2 JSON：id 字符串、成本 12.5 → 12,500,000 微美元、区号、运营商',
  )
  ok(j.kind === 'ok' && j.data.activationTime?.toISOString() === '2026-02-18T16:11:33.000Z' && j.data.activationEndTime?.toISOString() === '2026-02-18T18:11:23.000Z', '调研 §1.6 第 8 条：示例里的 2 小时有效期原样给出（是否可信由引擎按 E16 判断，解析器不改）')
  const n = parseGetNumberV2(J(200, { ...V2_OK, activationId: 635468024, canGetAnotherSms: '0', countryCode: '6', activationCost: '0.0480' }))
  ok(n.kind === 'ok' && n.data.activationId === '635468024' && n.data.canGetAnotherSms === false && n.data.countryCode === 6 && n.data.costMicro === 48000, 'id 是数字、canGetAnotherSms "0"、国家与成本是字符串')
  const noCur = { ...V2_OK } as Record<string, unknown>
  delete noCur.currency
  ok(parseGetNumberV2(J(200, noCur)).kind === 'ok', '没有 currency 字段 → 按规格默认 840')
  ok(parseGetNumberV2(J(200, { ...V2_OK, currency: '840' })).kind === 'ok', 'currency 是字符串 "840" 也认')
}

console.log('\n[§12.1 第 4 条] 取号的明确错误：WRONG_MAX_PRICE（JSON 与 :x）、BANNED（JSON 与 :\'时间\'）、402、403 CHANNELS_LIMIT')
{
  const w1 = parseGetNumberV2(J(400, E.wrongMax))
  const c1 = classifyAcquire(w1)
  ok(c1.c === 'WRONG_MAX_PRICE' && c1.minMicro === 123400, 'WRONG_MAX_PRICE JSON：info.min 0.1234 → 123,400 微美元（E2）')
  const w2 = parseGetNumberV2(H(200, 'WRONG_MAX_PRICE:0.025'))
  const c2 = classifyAcquire(w2)
  ok(c2.c === 'WRONG_MAX_PRICE' && c2.minMicro === 25000 && w2.kind === 'err' && errMinPriceMicro(w2) === 25000, 'WRONG_MAX_PRICE:0.025 文本 → 25,000 微美元')
  const b1 = parseGetNumberV2(J(403, E.banGlobal))
  const cb1 = classifyAcquire(b1)
  ok(cb1.c === 'BANNED' && cb1.scope === 'global' && cb1.untilMs === 1739448000_000 && cb1.retryAfterSec === 3600, 'BANNED JSON：scope global、banned_until（unix 秒 → ms）、retry_after_seconds（E4）')
  const b2 = parseGetNumberV2(J(403, E.banSpecific))
  const cb2 = classifyAcquire(b2)
  ok(cb2.c === 'BANNED' && cb2.scope === 'specific', 'BANNED specific（停售这个组合）')
  const b3 = parseGetNumberV2(H(200, "BANNED:'2026-2-13 12-00-00'"))
  const cb3 = classifyAcquire(b3)
  ok(cb3.c === 'BANNED' && cb3.scope === 'global' && cb3.untilMs === null && b3.kind === 'err' && b3.info?.readable === '2026-2-13 12-00-00', "BANNED:'时间' 文本：按 global、解封时刻未知（引擎按 30 分钟兜底）")
  const p = parseGetNumberV2(J(402, E.noBalance))
  ok(kindOf(p) === 'err:NO_BALANCE' && classifyAcquire(p).c === 'NO_BALANCE', '402 NO_BALANCE → E3')
  ok(classifyAcquire(parseGetNumberV2(H(200, 'BAD_BALANCE'))).c === 'NO_BALANCE', '官网处理的 BAD_BALANCE 文本 → E3')
  const ch = parseGetNumberV2(J(403, { ...E.channels, info: { current_threads: 10, max_allowed: 10 } }))
  const cch = classifyAcquire(ch)
  ok(cch.c === 'CHANNELS_LIMIT' && cch.currentThreads === 10 && cch.maxAllowed === 10, '403 CHANNELS_LIMIT：current_threads / max_allowed（E5）')
  const ch2 = parseGetNumberV2(J(403, E.channels))
  ok(ch2.kind === 'err' && eq(errThreads(ch2), { currentThreads: 0, maxAllowed: -1 }), '规格示例 max_allowed = −1 原样给出（引擎判断）')
}

console.log('\n[§3 E6 / E7] 组合不可售、key 失效')
{
  ok(classifyAcquire(parseGetNumberV2(J(403, E.serviceNa))).c === 'UNAVAILABLE', '403 SERVICE_NOT_AVAILABLE → E6')
  ok(classifyAcquire(parseGetNumberV2(H(200, 'BAD_SERVICE'))).c === 'UNAVAILABLE' && classifyAcquire(parseGetNumberV2(H(200, 'BAD_COUNTRY'))).c === 'UNAVAILABLE', 'BAD_SERVICE / BAD_COUNTRY 文本 → E6')
  ok(classifyAcquire(parseGetNumberV2(H(200, 'NOT_AVAILABLE'))).c === 'UNAVAILABLE' && classifyAcquire(parseGetNumberV2(H(200, 'WHATSAPP_NOT_AVAILABLE'))).c === 'UNAVAILABLE', '官网处理的 NOT_AVAILABLE / WHATSAPP_NOT_AVAILABLE → E6')
  ok(classifyAcquire(parseGetNumberV2(J(401, E.badKey))).c === 'KEY_INVALID', '401 BAD_KEY → E7')
  ok(classifyAcquire(parseGetNumberV2(J(403, { title: 'BAD_API_KEY', details: 'x' }))).c === 'KEY_INVALID', '调研 §1.6 第 6 条：v1 实测 403 BAD_API_KEY → E7')
  ok(classifyAcquire(parseGetNumberV2(J(401, { title: 'Unauthenticated.', details: 'x' }))).c === 'KEY_INVALID', '调研 §1.6 第 6 条：v1 文档 401 "Unauthenticated." → UNAUTHENTICATED → E7')
  ok(classifyAcquire(parseGetNumberV2(J(401, { message: 'Unauthenticated.' }))).c === 'KEY_INVALID', '401 只有 message 的写法 → E7')
  ok(classifyAcquire(parseGetNumberV2(J(403, E.inactive))).c === 'KEY_INVALID', '403 ACCOUNT_INACTIVE → E7')
  ok(classifyAcquire(parseGetNumberV2(H(200, 'NO_KEY'))).c === 'KEY_INVALID' && classifyAcquire(parseGetNumberV2(H(200, 'BAD_KEY'))).c === 'KEY_INVALID', 'NO_KEY / BAD_KEY 文本 → E7')
  ok(classifyAcquire({ kind: 'err', code: 'NO_KEY', http: 0, raw: '' }).c === 'KEY_INVALID', '本进程没配 key（NO_KEY，http 0）→ E7')
}

console.log('\n[§12.1 第 4 条 / E58] 取号：认不出的 4xx、1020、HTML 403 → REJECTED（请求被拒、没成交）')
{
  const r1 = classifyAcquire(parseGetNumberV2(J(409, { title: 'SOMETHING_NEW', details: 'x' })))
  ok(r1.c === 'REJECTED' && r1.code === 'SOMETHING_NEW', '认不出的 4xx 错误码 → REJECTED（只有明确列出的码才走 E2–E7）')
  const r2 = classifyAcquire(parseGetNumberV2(H(400, 'Bad Request')))
  ok(r2.c === 'REJECTED' && r2.cause === 'unrecognized', '400 认不出的文本 → REJECTED')
  const r3 = classifyAcquire(parseGetNumberV2(H(403, 'error code: 1020')))
  ok(r3.c === 'REJECTED' && r3.cause === '1020', '403「error code: 1020」（Cloudflare 限流）→ REJECTED(1020)')
  const r4 = classifyAcquire(parseGetNumberV2(H(403, '<!DOCTYPE html><html><head><title>Attention Required! | Cloudflare</title></head><body>Error 1020</body></html>')))
  ok(r4.c === 'REJECTED' && r4.cause === '1020', 'HTML 形式的 1020 页 → REJECTED(1020)')
  const r5 = classifyAcquire(parseGetNumberV2(H(403, '<html><body>Forbidden</body></html>')))
  ok(r5.c === 'REJECTED' && r5.cause === 'html403', 'HTML 403 → REJECTED(html403)')
  const r6 = classifyAcquire(parseGetNumberV2(H(429, '{"message":"Too Many Attempts."}', '12')))
  ok(r6.c === 'REJECTED' && r6.code === 'RATE_LIMIT' && r6.retryAfterSec === 12, '429 认不出码 → RATE_LIMIT，Retry-After 头 → retryAfterSec')
  ok(classifyAcquire(parseGetNumberV2(J(404, E.badAction))).c === 'REJECTED', '404 BAD_ACTION → REJECTED')
  ok(classifyAcquire({ kind: 'err', code: 'NOT_SENT', http: 0, raw: '' }).c === 'REJECTED', '本进程没发出去（NOT_SENT）→ REJECTED（上游一定没成交）')
  ok(classifyAcquire(parseGetNumberV2(H(200, 'WRONG_EXCEPTION_PHONE'))).c === 'REJECTED', '官网处理的 WRONG_EXCEPTION_PHONE → REJECTED')
}

console.log('\n[§12.1 第 4 条 / E8 E9 E24] 取号：结果未知一律 UNKNOWN（可能已经买到，绝不重取）')
{
  ok(classifyAcquire(parseGetNumberV2(H(502, '<html><head><title>502 Bad Gateway</title></head></html>'))).c === 'UNKNOWN', 'HTML 5xx 页面 → UNKNOWN')
  ok(classifyAcquire(parseGetNumberV2(H(503, 'Service Unavailable'))).c === 'UNKNOWN', '503 文本 → UNKNOWN')
  ok(kindOf(parseGetNumberV2(H(200, ''))) === 'unknown:parse', '200 空响应体 → unknown(parse)')
  const noId = { ...V2_OK } as Record<string, unknown>
  delete noId.activationId
  ok(kindOf(parseGetNumberV2(J(200, noId))) === 'unknown:parse', '200 但缺 activationId → unknown')
  ok(kindOf(parseGetNumberV2(J(200, { ...V2_OK, phoneNumber: '79584******' }))) === 'unknown:parse', '200 但号码是打码的（规格示例写法）→ unknown')
  ok(kindOf(parseGetNumberV2(H(200, '{"activationId":"1","phoneN'))) === 'unknown:parse', '截断的 JSON → unknown')
  ok(kindOf(parseGetNumberV2(H(200, '\u0000\u0001ACC�SS_NUMB'))) === 'unknown:parse', '乱码 → unknown')
  ok(kindOf(parseGetNumberV2(H(200, 'ERROR_SQL'))) === 'unknown:parse' && kindOf(parseGetNumberV2(H(200, 'FOO_BAR'))) === 'unknown:parse', 'ERROR_SQL、没见过的大写码（200）→ unknown（不知道买没买到）')
  ok(kindOf(parseGetNumberV2(H(200, '<html><body>ok</body></html>'))) === 'unknown:parse', '200 HTML → unknown')
  ok(kindOf(parseGetNumberV2(H(302, ''))) === 'unknown:parse', '3xx（客户端不跟随跳转）→ unknown')
  ok(classifyAcquire({ kind: 'unknown', reason: 'timeout', raw: '' }).c === 'UNKNOWN' && classifyAcquire({ kind: 'unknown', reason: 'network', raw: '' }).c === 'UNKNOWN', '超时、网络错误 → UNKNOWN')
}

console.log('\n[§12.1 第 4 条 / E56] 币种不是 840 → err(CURRENCY)，但号码照样带出来（已买到，不能丢成孤儿）')
{
  const c = parseGetNumberV2(J(200, { ...V2_OK, currency: 978 }))
  ok(c.kind === 'err' && c.code === 'CURRENCY' && c.info?.currency === 978 && c.data?.activationId === '635468024', '978 → err(CURRENCY)，info.currency=978，data 里有 activationId')
  const cc = classifyAcquire(c)
  ok(cc.c === 'CURRENCY' && cc.currency === 978 && cc.data?.phone === '79584123456', 'classifyAcquire → CURRENCY（带号码，引擎照常服务、全局停售）')
  ok(kindOf(parseGetNumberV2(J(200, { ...V2_OK, currency: 'USD' }))) === 'err:CURRENCY', 'currency 不是数字 → 同样 CURRENCY')
  const list = parseActiveActivations(J(200, { status: 'success', data: [{ activationId: '1', serviceCode: 'dr', phoneNumber: '1555', activationCost: 0.66, currency: 156, activationStatus: '4', smsCode: null, smsText: null, activationTime: '2026-09-28 10:00:00', countryCode: '187', canGetAnotherSms: '1' }] }))
  ok(list.kind === 'err' && list.code === 'CURRENCY' && list.data?.items.length === 1, '活跃列表里有一条 156 → err(CURRENCY) 且带整页数据')
  ok(v(judgeFromActiveList(list, '1')) === 'WAIT', '币种异常的列表照样能判状态（E56「已取到的号照常服务」）')
  // 三处同一口径：认不出的币种（"RUB"、"USD"）也是异常（评审：活跃列表 / history 以前把它当 null 放过去了）
  const listRub = parseActiveActivations(J(200, { status: 'success', data: [{ activationId: '1', activationCost: 0.66, currency: 840 }, { activationId: '2', activationCost: 1, currency: 'RUB' }] }))
  ok(listRub.kind === 'err' && listRub.code === 'CURRENCY' && listRub.info?.currency === -1 && listRub.info?.activationId === '2' && listRub.data?.items.length === 2, '活跃列表里 currency="RUB" → err(CURRENCY)（info.currency=−1、指明是哪一条），整页数据照样带出')
  ok(parseActiveActivations(J(200, { status: 'success', data: [{ activationId: '1', currency: '840' }, { activationId: '2' }] })).kind === 'ok', '活跃列表 currency 是字符串 "840" 或缺省 → 照常 ok')
  const hRub = parseHistory(J(200, { data: [{ id: 5, status: 6, currency: 'RUB', cost: '1.2', moreCodes: '123' }] }))
  ok(hRub.kind === 'err' && hRub.code === 'CURRENCY' && hRub.info?.currency === -1 && hRub.data?.rows[0].costMicro === 1_200_000, 'history 里 currency="RUB" → err(CURRENCY)（不再把外币金额当美元记成本，E56）')
  ok(kindOf(parseHistory(J(200, { data: [{ id: 5, status: 6, currency: { code: 840 } }] }))) === 'err:CURRENCY' && kindOf(parseHistory(J(200, { data: [{ id: 5, status: 6, currency: 840.5 }] }))) === 'err:CURRENCY', 'history currency 是对象、小数 → 同样 CURRENCY')
  ok(parseHistory(J(200, { data: [{ id: 5, status: 6, currency: '840' }, { id: 6, status: 8, currency: null }] })).kind === 'ok', 'history currency 是 "840" 或 null → 照常 ok')
}

console.log('\n[§12.1 第 4 条] 409 的五种、204 空响应体（放号 / 完成）')
{
  const e = parseSetStatus(J(409, E.early))
  ok(kindOf(e) === 'err:EARLY_CANCEL_DENIED' && eq(judgeRelease(e), { v: 'EARLY_DENIED', minSec: 120 }), 'EARLY_CANCEL_DENIED（info.minActivationTime=120）→ EARLY_DENIED')
  ok(eq(judgeRelease(parseSetStatus(J(409, { title: 'EARLY_CANCEL_DENIED', details: 'x' }))), { v: 'EARLY_DENIED', minSec: 120 }), '没带 minActivationTime → 按 120 秒')
  const o = parseSetStatus(J(409, E.otpReceived))
  ok(kindOf(o) === 'err:OTP_RECEIVED' && v(judgeRelease(o)) === 'RECEIVED', 'OTP_RECEIVED → 收到码（T11、E14 ③）')
  const f = parseSetStatus(J(409, E.freeExpired))
  ok(v(judgeRelease(f)) === 'EXPIRED_CHARGE', 'FREE_CANCELLATION_EXPIRED → E55（没码但被扣费）')
  const n = parseSetStatus(J(409, E.newOtp))
  const nr = judgeRelease(n)
  ok(n.kind === 'err' && errOtpList(n).length === 2 && errOtpList(n)[1].type === 'call' && errOtpList(n)[1].code === null, 'NEW_OTP_RECEIVED：info.data 两条（一条 call、code 为 null）')
  ok(nr.v === 'RECEIVED' && nr.sms.length === 2 && nr.sms[0].id === '3416693217' && nr.sms[0].code === '123456' && nr.needAllSms === false, '放号遇到 NEW_OTP_RECEIVED → 收到码，短信直接用 info.data（带 OTP id 去重）')
  ok(nr.v === 'RECEIVED' && nr.sms[0].date?.toISOString() === '2026-02-16T09:36:59.000Z', 'OTP 的 date 按时区换算')
  const nf = judgeFinish(n)
  ok(nf.v === 'RECEIVED' && nf.again === true && nf.sms.length === 2, '完成遇到 NEW_OTP_RECEIVED → 入库、保持 RECEIVED、下一轮再调 finish（T14）')
  const nEmpty = judgeRelease(parseSetStatus(J(409, { title: 'NEW_OTP_RECEIVED', details: 'x' })))
  ok(nEmpty.v === 'RECEIVED' && nEmpty.needAllSms === true, 'NEW_OTP_RECEIVED 没带 info.data → 收到码、补 getAllSms')
  ok(v(judgeRelease(parseSetStatus(J(409, E.notActive)))) === 'CHECK_HISTORY' && v(judgeFinish(parseSetStatus(J(409, E.notActive)))) === 'CHECK_HISTORY', 'ACTIVATION_NOT_ACTIVE → 查 history（放号、完成都是）')
  const z = parseSetStatus(H(204, ''))
  ok(z.kind === 'ok' && z.data.result === 'NO_CONTENT' && v(judgeRelease(z)) === 'CANCELLED' && v(judgeFinish(z)) === 'FINISHED', '204 空响应体 → 放号 CANCELLED、完成 FINISHED')
  ok(v(judgeRelease(parseSetStatus(H(200, 'ACCESS_CANCEL')))) === 'CANCELLED' && v(judgeFinish(parseSetStatus(H(200, 'ACCESS_ACTIVATION')))) === 'FINISHED', 'ACCESS_CANCEL / ACCESS_ACTIVATION 文本')
  ok(kindOf(parseSetStatus(H(200, ''))) === 'noinfo', '写调用 200 空体不当 204（语义不明 → 没有信息，下一轮拿确定结果）')
  ok(v(judgeRelease(parseSetStatus(H(200, 'ACCESS_ACTIVATION')))) === 'NOINFO' && v(judgeFinish(parseSetStatus(H(200, 'ACCESS_CANCEL')))) === 'NOINFO', '放号却回 ACCESS_ACTIVATION（反之亦然）→ 没有信息，不乱改状态')
  ok(v(judgeRelease(parseSetStatus(H(200, 'EARLY_CANCEL_DENIED')))) === 'EARLY_DENIED' && v(judgeRelease(parseSetStatus(H(200, 'NO_ACTIVATION')))) === 'CHECK_HISTORY', 'SMS-Activate 老写法（200 文本错误码）；NO_ACTIVATION 归一成 NOT_FOUND')
  ok(parseSetStatus(H(200, 'ACCESS_RETRY_GET')).kind === 'ok' && v(judgeRelease(parseSetStatus(H(400, JSON.stringify({ title: 'BAD_STATUS', details: 'Wrong status code' }))))) === 'NOINFO', 'ACCESS_RETRY_GET 能解析；400 BAD_STATUS → 没有信息')
}

console.log('\n[§12.1 第 4 条] getStatus 的五种、getStatusV2 的纯文本 STATUS_CANCEL')
{
  const s = (b: string) => parseGetStatus(H(200, b))
  const a = s('STATUS_WAIT_CODE')
  const b = s('STATUS_WAIT_RETRY:482917')
  const c = s('STATUS_WAIT_RESEND')
  const d = s('STATUS_CANCEL')
  const e = s('STATUS_OK:100001')
  ok(a.kind === 'ok' && a.data.s === 'WAIT_CODE' && b.kind === 'ok' && eq(b.data, { s: 'WAIT_RETRY', code: '482917' }) && c.kind === 'ok' && c.data.s === 'WAIT_RESEND', 'WAIT_CODE / WAIT_RETRY:482917 / WAIT_RESEND')
  ok(d.kind === 'ok' && d.data.s === 'CANCEL' && e.kind === 'ok' && eq(e.data, { s: 'OK', code: '100001' }), 'CANCEL / OK:100001')
  ok(eq(s('STATUS_OK:12:34').kind === 'ok' ? (s('STATUS_OK:12:34') as { data: unknown }).data : null, { s: 'OK', code: '12:34' }), '码里带冒号：取第一个冒号之后的全部')
  ok(kindOf(s('STATUS_OK:')) === 'noinfo' && kindOf(s('STATUS_WAIT_RETRY')) === 'noinfo' && kindOf(s('STATUS_SOMETHING')) === 'noinfo', 'STATUS_OK 不带码、WAIT_RETRY 不带码、没见过的 STATUS_* → noinfo')
  ok(kindOf(parseGetStatus(J(404, E.notFound))) === 'err:NOT_FOUND' && kindOf(parseGetStatus(J(402, E.noBalance))) === 'err:NO_BALANCE', '404 NOT_FOUND、402 NO_BALANCE')
  ok(kindOf(parseGetStatus(J(200, { status: 'STATUS_OK', code: '1' }))) === 'noinfo', 'getStatus 的 JSON（未文档化）→ noinfo，不猜')
  const v2c = parseGetStatusV2(H(200, 'STATUS_CANCEL'))
  ok(v2c.kind === 'ok' && v2c.data.s === 'CANCEL' && v(judgeGetStatusV2(v2c)) === 'CHECK_HISTORY', '调研 §1.6 第 3 条：getStatusV2 已取消返回纯文本 STATUS_CANCEL → 查 history')
  const v2 = parseGetStatusV2(J(200, { verificationType: 'sms', data: { id: '3416693217', phoneFrom: 'Telegram', code: '123456', text: 'Telegram code 123456', service: 'tg', date: '2026-02-16T12:36:59+03:00', type: 'sms' } }))
  ok(v2.kind === 'ok' && v2.data.s === 'SMS' && v2.data.sms.code === '123456' && v(judgeGetStatusV2(v2)) === 'NOINFO', 'getStatusV2 带短信：解析得出，但不在 §3.1 判定表里 → 不据它推进状态（D10、D17）')
  ok(kindOf(parseGetStatusV2(J(200, { verificationType: 'sms', data: null }))) === 'noinfo' && v(judgeGetStatusV2(parseGetStatusV2(J(200, { verificationType: 'sms', data: null })))) === 'NOINFO', '等码时未文档化的形态（调研 U5；S2 真钱验收后补真实样本）→ noinfo')
  ok(kindOf(parseGetStatusV2(H(200, 'STATUS_WAIT_CODE'))) === 'noinfo', 'getStatusV2 回 STATUS_WAIT_CODE（不据它判状态）→ noinfo')
}

console.log('\n[§12.1 第 4 条] getActiveActivations 的两种形状（调研 §1.2）；列表出错绝不当作空列表')
{
  const item = { activationId: '635468021', serviceCode: 'vk', phoneNumber: '79000000001', activationCost: 12.5, activationStatus: '4', smsCode: '12345', smsText: 'Your code is 12345', activationTime: '2022-06-01 16:59:16', countryCode: '2', countryName: 'Kazakhstan', canGetAnotherSms: '1', currency: 840, verificationType: 'sms', subtype: 1 }
  const a = parseActiveActivations(J(200, { status: 'success', data: [item] }))
  ok(
    a.kind === 'ok' &&
      a.data.count === 1 &&
      a.data.items[0].activationId === '635468021' &&
      a.data.items[0].status === 4 &&
      a.data.items[0].countryCode === 2 &&
      a.data.items[0].canGetAnotherSms === true &&
      a.data.items[0].costMicro === 12_500_000 &&
      a.data.items[0].smsCode === '12345',
    '规格形状 data[]（字段是字符串：id / 状态 / 国家 / "1"）',
  )
  ok(a.kind === 'ok' && a.data.items[0].activationTimeText === '2022-06-01 16:59:16' && !('activationTime' in a.data.items[0]), 'activationTime 没时区：只留原文，不给 Date（调研 §1.6 第 9 条）')
  const emptyReal = '{"status":"success","data":[],"activeActivations":{"affected_rows":0,"num_rows":0,"row":[],"rows":[]}}'
  const b = parseActiveActivations(H(200, emptyReal))
  ok(b.kind === 'ok' && b.data.count === 0 && b.data.items.length === 0, '实测空列表形状（带 activeActivations.rows）→ ok、0 条')
  const c = parseActiveActivations(J(200, { status: 'success', data: [], activeActivations: { rows: [item] } }))
  ok(c.kind === 'ok' && c.data.items.length === 1, '记录在 activeActivations.rows 里 → 照样认')
  const d = parseActiveActivations(J(200, { status: 'success', activeActivations: [item] }))
  ok(d.kind === 'ok' && d.data.items.length === 1, 'activeActivations 本身是数组（旧写法）→ 照样认')
  ok(kindOf(parseActiveActivations(J(200, { status: 'error', error: 'NO_ACTIVATIONS' }))) === 'err:NO_ACTIVATIONS', '旧式 {"status":"error","error":"NO_ACTIVATIONS"} → err（不当空列表）')
  ok(kindOf(parseActiveActivations(J(200, { status: 'success' }))) === 'noinfo' && kindOf(parseActiveActivations(J(200, { status: 'fail', data: [] }))) === 'noinfo', '没有 data / rows、status 有值却不是 success → noinfo（不当空列表）')
  ok(parseActiveActivations(J(200, { data: [] })).kind === 'ok', '没有 status 字段、data 是数组 → 按规格 schema 认')
  ok(kindOf(parseActiveActivations(J(200, [item]))) === 'noinfo' && kindOf(parseActiveActivations(H(200, 'gibberish'))) === 'noinfo', '顶层是数组、纯文本 → noinfo')
  ok(kindOf(parseActiveActivations(J(200, { status: 'success', data: [item, { serviceCode: 'x' }] }))) === 'noinfo', '有一条缺 activationId → 整页 noinfo（不能据此判「不在列表里」）')
  ok(v(judgeFromActiveList({ kind: 'noinfo', raw: '' }, '1')) === 'NOINFO' && v(judgeFromActiveList({ kind: 'unknown', reason: 'timeout', raw: '' }, '1')) === 'NOINFO', '列表出错（任何一页）→ 没有信息，不是 CHECK_HISTORY')
  const full = parseActiveActivations(J(200, { status: 'success', data: [item, { ...item, activationId: '635468022', smsCode: null, smsText: null }] }))
  ok(v(judgeFromActiveList(full, '999')) === 'CHECK_HISTORY', '拉全的列表里没有它 → 查 history')
  ok(v(judgeFromActiveList(full, '635468022')) === 'WAIT', '在列表里、没有码 → 无变化')
  ok(v(judgeFromActiveList(full, '635468021')) === 'RECEIVED', '在列表里、有码、我方还没记 → 收到码（补 getAllSms）')
  ok(v(judgeFromActiveList(full, '635468021', { lastCode: '12345', lastText: 'Your code is 12345' })) === 'WAIT', '码没变 → 无变化（不重复拉全文）')
  ok(v(judgeFromActiveList(full, '635468021', { lastCode: '11111', lastText: 'old' })) === 'RECEIVED', '码变了（新短信）→ 收到码')
}

console.log('\n[§3.1] STATUS_CANCEL → 查 history；history 找不到 → 没有信息；WAIT_RETRY 按「我方有没有短信」分')
{
  const st = (b: string, hasSms: boolean) => judgeGetStatus(parseGetStatus(H(200, b)), { hasSms })
  ok(v(st('STATUS_CANCEL', false)) === 'CHECK_HISTORY', 'STATUS_CANCEL（getStatus）→ 视同 ACTIVATION_NOT_ACTIVE，查 history')
  ok(v(judgeHistory(parseHistory(J(200, { data: [], totals: { sum: 0, successCount: 0 }, meta: {} })), '123')) === 'NOINFO', 'history 里查不到 → 没有信息，不改状态')
  const r = st('STATUS_WAIT_RETRY:482917', false)
  ok(r.v === 'RECEIVED' && r.code === '482917' && r.needAllSms === true, 'WAIT_RETRY:482917 且尝试还没有短信 → 收到码，code=482917、用 getAllSms 补全文')
  ok(v(st('STATUS_WAIT_RETRY:482917', true)) === 'WAIT', '同一返回但尝试已有短信 → 无变化')
  ok(v(st('STATUS_WAIT_CODE', false)) === 'WAIT' && v(st('STATUS_WAIT_RESEND', false)) === 'WAIT', 'WAIT_CODE / WAIT_RESEND → 无变化')
  const ok1 = st('STATUS_OK:100001', true)
  ok(ok1.v === 'RECEIVED' && ok1.code === '100001', 'STATUS_OK:x → 收到码')
  ok(v(judgeGetStatus(parseGetStatus(J(404, E.notFound)), { hasSms: false })) === 'CHECK_HISTORY', '404 NOT_FOUND → 查 history')
  ok(v(judgeGetStatus(parseGetStatus(J(409, E.notActive)), { hasSms: false })) === 'CHECK_HISTORY', 'ACTIVATION_NOT_ACTIVE → 查 history')
}

console.log('\n[§3.1] history 定终态（以 history 为准，附录 B 第 22 条）')
{
  const hist = (rows: unknown[]) => parseHistory(J(200, { data: rows, totals: { sum: 0.12, successCount: 1 }, meta: { page: 1, size: 25, total: rows.length } }))
  const row = (o: Record<string, unknown>) => ({ id: 909794275, createDate: '2026-09-28T11:19:30.000000Z', service: 'dr', country: 52, phone: 66900000001, moreCodes: null, cost: 0.12, status: 8, phoneCode: 66, currency: 840, subtype: 1, ...o })
  const r6 = judgeHistory(hist([row({ status: 6, moreCodes: '490838' })]), '909794275')
  ok(r6.v === 'RECEIVED' && r6.code === '490838' && r6.ended === true && r6.needAllSms === false && !r6.upstreamRefunded, '状态 6 + moreCodes → 收到码（ended；码取 moreCodes，getAllSms 这时 409）')
  const r6n = judgeHistory(hist([row({ status: 6 })]), '909794275')
  ok(r6n.v === 'RECEIVED' && r6n.code === null, '状态 6、moreCodes 为空 → 仍按收到码（已完成就是扣了费）')
  ok(v(judgeHistory(hist([row({ status: 8, moreCodes: '111222' })]), '909794275')) === 'RECEIVED', '状态 8 但 moreCodes 非空 → 收到码（§3.1：6 或 moreCodes 非空）')
  const r10 = judgeHistory(hist([row({ status: 10, moreCodes: '333444' })]), '909794275')
  ok(r10.v === 'RECEIVED' && r10.upstreamRefunded === true, '状态 10 + moreCodes → 收到码 + upstreamRefunded（R6：上游事后退了收过码的号）')
  ok(eq(judgeHistory(hist([row({ status: 8 })]), '909794275'), { v: 'CANCELLED', ended: true }) && eq(judgeHistory(hist([row({ status: 10 })]), '909794275'), { v: 'CANCELLED', ended: true }), '状态 8 / 10 且无码 → CANCELLED')
  ok(v(judgeHistory(hist([row({ status: 4 })]), '909794275')) === 'NOINFO', '状态 4（还没结束）→ 没有信息')
  // 评审：不是终态却带码的行，不能标 ended（号在上游还活着，得照常 finish）
  for (const st of [2, 4, null]) {
    const r = judgeHistory(hist([row({ status: st, moreCodes: '123456' })]), '909794275')
    ok(r.v === 'RECEIVED' && r.code === '123456' && !r.ended && r.needAllSms === true && !r.upstreamRefunded, `状态 ${st}（不是终态）+ moreCodes → 收到码，但不标 ended、要补 getAllSms（之后照常 T14 完成）`)
  }
  // 评审：moreCodes 形态认不出绝不能当成「没有码」（否则状态 8 / 10 → CANCELLED → 收过码的单被整单退掉）
  const arr10 = judgeHistory(hist([row({ status: 10, moreCodes: ['490838'] })]), '909794275')
  ok(arr10.v === 'RECEIVED' && arr10.code === '490838' && arr10.ended === true && arr10.upstreamRefunded === true, 'moreCodes 是数组 ["490838"]、状态 10 → 收到码（R6），**不是 CANCELLED**')
  const arr8 = hist([row({ status: 8, moreCodes: ['111', 222] })])
  ok(arr8.kind === 'ok' && arr8.data.rows[0].moreCodes === '111 222' && v(judgeHistory(arr8, '909794275')) === 'RECEIVED', 'moreCodes 数组（字符串 / 数字混合）按空格拼起来')
  ok(eq(judgeHistory(hist([row({ status: 8, moreCodes: [] })]), '909794275'), { v: 'CANCELLED', ended: true }) && eq(judgeHistory(hist([row({ status: 8, moreCodes: '  ' })]), '909794275'), { v: 'CANCELLED', ended: true }), 'moreCodes 是空数组、空白串 → 没有码（与 null 相同）')
  const num = judgeHistory(hist([row({ status: 6, moreCodes: 490838 })]), '909794275')
  ok(num.v === 'RECEIVED' && num.code === '490838', 'moreCodes 是数字 → 照样当码')
  const objRow = hist([row({ status: 10, moreCodes: { a: '123456' } })])
  ok(objRow.kind === 'noinfo' && v(judgeHistory(objRow, '909794275')) === 'NOINFO', 'moreCodes 是对象、状态 10 → 整页 noinfo → 没有信息（**不是 CANCELLED**）')
  ok(hist([row({ status: 8, moreCodes: true })]).kind === 'noinfo' && hist([row({ status: 8, moreCodes: [{ code: '1' }] })]).kind === 'noinfo', 'moreCodes 是布尔、数组里夹对象 → noinfo')
  ok(v(judgeHistory(hist([row({ status: 8 })]), '1')) === 'NOINFO', '找不到这一行 → 没有信息')
  ok(v(judgeHistory({ kind: 'unknown', reason: 'timeout', raw: '' }, '1')) === 'NOINFO' && v(judgeHistory({ kind: 'err', code: 'REJECTED', http: 403, raw: '' }, '1')) === 'NOINFO', 'history 查询出错 → 没有信息')
  const cur = hist([row({ status: 8, currency: 978 })])
  ok(cur.kind === 'err' && cur.code === 'CURRENCY' && v(judgeHistory(cur, '909794275')) === 'CANCELLED', 'history 币种异常：err(CURRENCY) 带 data，状态照样能判')
  ok(codeFromMoreCodes('490838') === '490838' && codeFromMoreCodes('637881 is your verification code') === '637881' && codeFromMoreCodes(null) === null && codeFromMoreCodes('no digits here at all') === null, 'moreCodes → 验证码（纯码原样；整句取第一段数字）')
}

console.log('\n[§3.1 / E57] 402 / 403 / 404 / 429 / 1020 / 5xx / 超时 / 认不出的 200：一律「没有信息」，不据此判取消')
{
  const st = (r: Up<never> | ReturnType<typeof parseGetStatus>) => judgeGetStatus(r as ReturnType<typeof parseGetStatus>, { hasSms: false })
  const n402 = st(parseGetStatus(J(402, E.noBalance)))
  ok(n402.v === 'NOINFO' && n402.recheckBalance === true && !n402.stopNew && n402.breaker === false, '402 NO_BALANCE → 没有信息，只触发一次 getBalance 复核（不停售，Q4）')
  const nb = st(parseGetStatus(J(403, E.banGlobal)))
  ok(nb.v === 'NOINFO' && nb.stopNew === 'BANNED_GLOBAL' && nb.backoffSec === 3600, '403 BANNED（全局）→ 没有信息、按 retry_after_seconds 退避、停售新单（E4），**不判在途号码取消**')
  const nbs = st(parseGetStatus(J(403, E.banSpecific)))
  ok(nbs.v === 'NOINFO' && !nbs.stopNew, '403 BANNED specific → 没有信息（组合停售在取号路径上判）')
  const nc = st(parseGetStatus(J(403, E.channels)))
  ok(nc.v === 'NOINFO' && nc.backoffSec === 60, '403 CHANNELS_LIMIT → 没有信息，没给 retry_after 就退避 60 秒')
  ok(v(st(parseGetStatus(J(403, E.serviceNa)))) === 'NOINFO', '403 SERVICE_NOT_AVAILABLE → 没有信息')
  const ni = st(parseGetStatus(J(403, E.inactive)))
  ok(ni.v === 'NOINFO' && ni.stopNew === 'KEY', '403 ACCOUNT_INACTIVE → 没有信息 + 停售新单（E7）')
  ok(eq(st(parseGetStatus(J(401, E.badKey))), { v: 'NOINFO', backoffSec: 10, breaker: false, stopNew: 'KEY' }), '401 BAD_KEY → 没有信息 + 停售新单（E7）')
  const n429 = st(parseGetStatus(H(429, '', '30')))
  ok(n429.v === 'NOINFO' && n429.backoffSec === 30, '429 → 没有信息，按 Retry-After 退避')
  // 评审：Retry-After / retry_after_seconds 为 0 不能变成 0 秒退避（立刻重查，限流时越查越封）
  const bo = (r: Verdict) => (r.v === 'NOINFO' ? r.backoffSec : -1)
  ok(bo(st(parseGetStatus(H(429, '', '0')))) === 60 && bo(st(parseGetStatus(H(429, '{"title":"RATE_LIMIT","info":{"retry_after_seconds":0}}')))) === 60, '429 带 Retry-After: 0 / retry_after_seconds: 0 → 按「没给」退避 60 秒')
  ok(bo(st(parseGetStatus(H(403, 'error code: 1020', '0')))) === 60 && bo(st(parseGetStatus(H(429, '', '7')))) === 10, '1020 带 Retry-After: 0 → 60 秒；给了 7 秒 → 至少 10 秒（上游超限封 10 秒）')
  ok(bo(st(parseGetStatus(H(402, '{"title":"NO_BALANCE","info":{"retry_after_seconds":0}}')))) === 10 && bo(st(parseGetStatus(H(409, '{"title":"SOMETHING","info":{"retry_after_seconds":3}}')))) === 10, '非限流类给 0 或 3 秒 → 至少 10 秒')
  ok(eq(st(parseGetStatus(H(403, 'error code: 1020'))), { v: 'NOINFO', backoffSec: 60, breaker: false }), '1020 → 没有信息、退避 60 秒、不计熔断')
  ok(eq(st(parseGetStatus(H(403, '<html><body>denied</body></html>'))), { v: 'NOINFO', backoffSec: 60, breaker: false }), 'HTML 403 → 没有信息、退避 60 秒')
  ok(eq(st(parseGetStatus(J(500, E.server))), { v: 'NOINFO', backoffSec: 10, breaker: true }), '5xx → 没有信息，计入熔断')
  ok(eq(st({ kind: 'unknown', reason: 'timeout', raw: '' } as never), { v: 'NOINFO', backoffSec: 10, breaker: true }) && eq(st({ kind: 'unknown', reason: 'network', raw: '' } as never), { v: 'NOINFO', backoffSec: 10, breaker: true }), '超时、网络错误 → 没有信息，计入熔断')
  ok(eq(st(parseGetStatus(H(200, 'gibberish'))), { v: 'NOINFO', backoffSec: 10, breaker: false }), '认不出的 200（noinfo）→ 没有信息，**不计入熔断**')
  ok(eq(noinfoVerdict({ kind: 'unknown', reason: 'parse', raw: '' }), { v: 'NOINFO', backoffSec: 10, breaker: false }), '只读调用的 unknown(parse)（3xx、响应过大）不计熔断')
  const all403 = [judgeRelease, judgeFinish].map((fn) => fn(parseSetStatus(J(403, E.banGlobal))))
  ok(all403.every((x) => x.v === 'NOINFO'), '放号 / 完成遇到 403 BANNED → 没有信息（不是 CANCELLED）')
  ok([judgeRelease, judgeFinish].every((fn) => v(fn(parseSetStatus(J(402, E.noBalance)))) === 'NOINFO'), '放号 / 完成遇到 402 → 没有信息')
  ok([judgeRelease, judgeFinish].every((fn) => v(fn({ kind: 'unknown', reason: 'timeout', raw: '' })) === 'NOINFO'), '放号 / 完成超时 → 没有信息（写调用不重试，下一轮再调；重复放号只会拿到 NOT_ACTIVE → 查 history）')
  ok(kindOf(parseAllSms(J(409, E.notActive))) === 'err:ACTIVATION_NOT_ACTIVE', 'getAllSms 在取消或退款后 409 ACTIVATION_NOT_ACTIVE')
}

console.log('\n[实测样本] 2026-09-29 带 key 只读实测（调研 §3.2；号码换成假号）')
{
  const bal = parseBalance(H(200, 'ACCESS_BALANCE:12.4422'))
  ok(bal.kind === 'ok' && bal.data.balanceMicro === 12_442_200, 'getBalance：ACCESS_BALANCE:12.4422 → 12,442,200 微美元')
  ok(kindOf(parseBalance(J(401, E.badKey))) === 'err:BAD_KEY' && kindOf(parseBalance(H(200, 'ACCESS_BALANCE:abc'))) === 'noinfo' && kindOf(parseBalance(H(200, '"ACCESS_BALANCE:1.5"'))) === 'ok', 'getBalance：401、认不出、带引号')
  const missKey = parseBalance(J(422, { title: 'UNPROCESSABLE_ENTITY', details: 'Validation failed', info: { field: 'api_key', code: 'REQUIRED', message: '' } }))
  ok(kindOf(missKey) === 'err:UNPROCESSABLE_ENTITY', '实测缺 key：422 UNPROCESSABLE_ENTITY')
  const pr = parsePrices(H(200, '{"187":{"ot":{"cost":0.6,"count":592116,"physicalCount":8317}}}'))
  ok(pr.kind === 'ok' && eq(pr.data[187].ot, { costMicro: 600000, count: 592116, physicalCount: 8317 }), 'getPrices：cost 0.6（= retail）→ 600,000、count = 任意价库存')
  ok(kindOf(parsePrices(J(200, { status: 'false', msg: 'service is incorrect' }))) === 'err:BAD_SERVICE' && kindOf(parsePrices(J(200, { status: 'false', msg: 'country is incorrect' }))) === 'err:BAD_COUNTRY', 'getPrices 的 {"status":"false","msg":…} → BAD_SERVICE / BAD_COUNTRY')
  ok(kindOf(parsePrices(J(200, [{ baa: { cost: 0.08, count: 25370, physicalCount: 14528 } }]))) === 'noinfo', '规格示例的数组形态（没有国家键）→ noinfo，不瞎猜国家')
  const v1e = parseV1Activations(H(200, '{"data":[],"meta":{"page":1,"size":5,"sort":{"id":"desc"},"total":0,"filters":{"countries":[],"services":[]}}}'))
  ok(v1e.kind === 'ok' && v1e.data.count === 0 && v1e.data.meta.total === 0, 'v1 活跃列表实测空列表')
  const v1a = parseV1Activations(J(200, { data: [{ id: 1, status: 4, phone: '440959999999', service: 'fb', country: 44, countryPhoneCode: 7, operator: 'axis', price: 1.05, otpList: [{ id: '12345643242', smsCode: '123456', smsText: 'Your verification code is 123456', receivedAt: '2025-12-16T10:30:00.000000Z', type: 'sms', phoneFrom: '89854', service: 'tg' }], createdAt: '2025-12-16T10:30:00.000000Z', expiredAt: '2025-12-16T10:50:00.000000Z', verificationType: 'sms', subtype: 1 }] }))
  ok(
    v1a.kind === 'ok' &&
      v1a.data.items[0].id === '1' &&
      v1a.data.items[0].operator === 'axis' &&
      v1a.data.items[0].priceMicro === 1_050_000 &&
      v1a.data.items[0].createdAt?.toISOString() === '2025-12-16T10:30:00.000Z' &&
      v1a.data.items[0].expiredAt?.toISOString() === '2025-12-16T10:50:00.000Z' &&
      v1a.data.items[0].otpList[0].code === '123456',
    'v1 活跃列表（规格示例）：运营商、价格、带时区的 createdAt / expiredAt（认领用，§2.4）、otpList',
  )
  ok(kindOf(parseV1Activations(J(200, { data: [{ status: 4 }] }))) === 'noinfo', 'v1 列表有一条缺 id → 这一轮作废（noinfo）')
  ok(kindOf(parseV1Activations(J(422, { title: 'UNPROCESSABLE_ENTITY', details: 'x', errors: { size: ['The size must not be greater than 25.'] } }))) === 'err:UNPROCESSABLE_ENTITY', 'v1 422 带 errors')
  const hist = parseHistory(
    J(200, {
      data: [
        { id: 909862579, createDate: '2026-09-28T11:41:10.000000Z', service: 'ot', country: 187, phone: 15550000001, moreCodes: null, cost: 0.6, status: 8, phoneCode: 1, currency: 840, subtype: 1 },
        { id: 909794275, createDate: '2026-09-28T11:19:30.000000Z', service: 'dr', country: 52, phone: 66900000002, moreCodes: '490838', cost: 0.12, status: 6, phoneCode: 66, currency: 840, subtype: 1 },
        { id: 884343475, createDate: '2026-09-22T06:02:58.000000Z', service: 'dr', country: 52, phone: 66900000003, moreCodes: '476961', cost: 0.1195, status: 6, phoneCode: 66, currency: 840, subtype: 1 },
      ],
      totals: { sum: 7.5494, successCount: 23 },
      meta: { page: 1, size: 25, sort: { id: 'desc' }, total: 73 },
    }),
  )
  ok(hist.kind === 'ok' && hist.data.rows.length === 3 && hist.data.rows[0].createdAt?.toISOString() === '2026-09-28T11:41:10.000Z' && hist.data.rows[0].dialCode === '1', 'history 实测：createDate 带时区、phoneCode 是数字')
  ok(hist.kind === 'ok' && hist.data.rows[0].costMicro === 600000 && hist.data.rows[0].status === 8 && hist.data.rows[2].costMicro === 119500, '已取消（8）的行 cost 也有值（标价，不代表扣费，调研 §3.4 第 6 条）；0.1195 → 119,500')
  ok(hist.kind === 'ok' && hist.data.totals?.sumMicro === 7_549_400 && hist.data.totals.successCount === 23 && hist.data.meta.total === 73, 'totals.sum 7.5494（只是成功单实扣）、successCount 23、共 73 行')
  ok(parseHistory(J(200, { data: [{ id: 1, createDate: '2025-03-18 10:40:37', service: 'tg', country: 2, phone: 79991234567, moreCodes: '637881 is your verification code', cost: 0.4321, status: 4, phoneCode: '+55', currency: 840 }] })).kind === 'ok', '规格示例（createDate 无时区、phoneCode "+55"）也能解析')
  const hs = parseHistory(J(200, { data: [{ id: 1, createDate: '2025-03-18 10:40:37', phoneCode: '+55', status: 6 }] }))
  ok(hs.kind === 'ok' && hs.data.rows[0].createdAt === null && hs.data.rows[0].dialCode === '55', '无时区的 createDate → null；"+55" → 55')
  const off = parseOffers(
    J(200, {
      data: {
        ot: { '52': { prices: { default: 0.2, retail: 0.24, min: 0.24 }, counts: { total: 2898, physical: 2287, defaultPrice: 1039 }, map: { '0.4236': 1902, '0.2400': 1091, '0.3280': 1159, '3.0000': 2898 } } },
        tg: { '48': { prices: { default: 0.9, retail: 0.9, min: 0.9 }, counts: { total: 4076, physical: 896, defaultPrice: 0 }, map: { '1.0483': 204, '1.1593': 793, '2.4831': 46024 } } },
      },
      meta: { page: null, size: null, sort: { rate: 'asc', deliverability: 'desc' }, total: null, hasMore: false, order: { rate: { countries: { ot: [16, 52, 4], tg: ['48'] }, services: ['ot', 'tg'] }, deliverability: { countries: { ot: ['6', '4', '52'], tg: ['48'] } } }, filters: { countries: [], services: [] } },
    }),
  )
  ok(off.kind === 'ok' && off.data.offers.ot[52].retailMicro === 240000 && off.data.offers.ot[52].defaultMicro === 200000 && off.data.offers.ot[52].defaultCount === 1039, 'offers 实测 ot/52：retail 0.24 → 240,000、default、counts.defaultPrice')
  ok(off.kind === 'ok' && eq(off.data.offers.ot[52].tiers, [[240000, 1091], [328000, 1159], [423600, 1902], [3000000, 2898]]), 'map 档位按价格升序、价格换成微美元')
  ok(off.kind === 'ok' && off.data.offers.tg[48].defaultCount === 0 && off.data.offers.tg[48].tiers[0][0] === 1_048_300 && off.data.offers.tg[48].tiers[0][0] > (off.data.offers.tg[48].retailMicro ?? 0), '规格示例 tg/48：起价档为 0、map 第一档高于 retail（§4.2 报价成本改取 map 最小键）')
  ok(off.kind === 'ok' && eq(off.data.rateServices, ['ot', 'tg']) && eq(off.data.rateCountries.ot, [16, 52, 4]) && eq(off.data.deliverability.ot, [6, 4, 52]) && eq(off.data.rateCountries.tg, [48]), 'meta.order：评分与到达率排序（国家 id 数字、字符串都认）')
  ok(kindOf(parseOffers(J(404, { title: 'OFFER_NOT_FOUND', details: 'x' }))) === 'err:OFFER_NOT_FOUND' && kindOf(parseOffers(J(429, { title: 'RATE_LIMIT', details: 'x' }))) === 'err:RATE_LIMIT', 'offers 404 OFFER_NOT_FOUND（E6：只对本单 SOLD_OUT）、429 RATE_LIMIT')
  ok(parseOffers(J(200, { data: [], meta: {} })).kind === 'ok', 'PHP 的空对象写成 [] 也认')
  const svc = parseServicesList(H(200, '{"status":"success","services":[{"code":"full","name":"Full rent"},{"code":"dr","name":"OpenAI"},{"code":"acz","name":"Claude "}]}'))
  ok(svc.kind === 'ok' && svc.data.length === 3 && svc.data[2].name === 'Claude', 'getServicesList：名字去掉尾部空格（acz 实测 "Claude "）')
  const ctyObj = parseCountries(H(200, '{"1":{"id":1,"rus":"Украина","eng":"Ukraine","chn":"乌克兰","visible":1,"retry":1,"rent":1},"187":{"id":187,"rus":"США","eng":"USA","chn":"美国","visible":1,"retry":1,"rent":0}}'))
  const ctyArr = parseCountries(J(200, [{ id: 2, rus: 'Казахстан', eng: 'Kazakhstan', chn: '哈萨克斯坦', visible: 1, retry: 1 }]))
  ok(ctyObj.kind === 'ok' && ctyObj.data.length === 2 && ctyObj.data[1].id === 187 && ctyObj.data[1].rent === false && ctyArr.kind === 'ok' && ctyArr.data[0].id === 2 && ctyArr.data[0].rent === null, '调研 §1.6 第 7 条：getCountries 实测是对象（多一个 rent）、文档是数组，两种都认')
  const ops = parseOperators(H(200, '{"status":"success","countryOperators":{"6":["axis","byu","indosat","smartfren","telkomsel","three"]}}'))
  ok(ops.kind === 'ok' && ops.data.byCountry[6].length === 6 && !ops.data.notFound, 'getOperators 实测')
  const opsNf = parseOperators(H(200, 'OPERATORS_NOT_FOUND'))
  ok(opsNf.kind === 'ok' && opsNf.data.notFound && eq(opsNf.data.byCountry, {}), 'OPERATORS_NOT_FOUND → ok（这个国家没有运营商列表）')
  const cd = parseCustomDurations(H(200, '{"data":{"cy":{"0":60},"md":{"0":40},"tg":{"6":45,"151":45}}}'))
  ok(cd.kind === 'ok' && cd.data.tg[6] === 45 && cd.data.cy[0] === 60 && cd.data.md[0] === 40, 'custom-durations 实测（tg 只在 6、151 是 45 分钟）')
  const stats = parseStats(J(200, { data: { '187': { dr: { count: 10, success: 5, percent: 50 } }, '52': { dr: { count: '3', success: '1', percent: '33.33' } } } }))
  ok(stats.kind === 'ok' && eq(stats.data[187].dr, { count: 10, success: 5, percent: 50 }) && stats.data[52].dr.percent === 33.33, 'stats：{国家:{服务:{count, success, percent}}}，数字字段兼容字符串')
  ok(parseStats(J(200, { data: [] })).kind === 'ok' && kindOf(parseStats(J(200, { data: { '187': { dr: { success: 1 } } } }))) === 'noinfo', 'stats 空（[]）→ ok；缺 count → noinfo')
  const sms = parseAllSms(J(200, { data: [{ id: '3416693217', phoneFrom: 'Telegram', code: '123456', text: 'Telegram code 123456', service: 'tg', date: '2026-02-19T10:37:46+00:00', type: 'sms' }], meta: { total: 42, service: 'full' } }))
  ok(sms.kind === 'ok' && sms.data.items[0].id === '3416693217' && sms.data.items[0].from === 'Telegram' && sms.data.total === 42, 'getAllSms：短信列表与 meta.total')
  ok(parseAllSms(J(200, { data: [], meta: { total: 0 } })).kind === 'ok', 'getAllSms 空（规格：May be empty）')
}

console.log('\n[熔断计数] 只数 timeout / network / http5xx 与取号路径上的 unknown（E20）')
{
  const now = 1_000_000
  const ev = (o: Partial<CallEvent>): CallEvent => ({ at: now - 1000, action: 'getStatus', lane: 'poll', kind: 'ok', acquire: false, ...o })
  const events: CallEvent[] = [
    ev({}),
    ev({ kind: 'noinfo' }),
    ev({ kind: 'err', code: 'NO_NUMBERS', acquire: true }),
    ev({ kind: 'unknown', reason: 'timeout' }),
    ev({ kind: 'unknown', reason: 'network' }),
    ev({ kind: 'unknown', reason: 'http5xx' }),
    ev({ kind: 'unknown', reason: 'parse' }),
    ev({ kind: 'unknown', reason: 'parse', acquire: true, action: 'getNumberV2' }),
    ev({ kind: 'unknown', reason: 'timeout', at: now - 130_000 }),
  ]
  ok(eq(countBreaker(events, now), { total: 6, bad: 4 }), '坏的 4 次（timeout / network / http5xx + 取号的 unknown(parse)）；分母再加上游正常作答的 ok 与 NO_NUMBERS 共 6；noinfo、只读的 unknown(parse)、2 分钟外的都不计')
  ok(eq(countBreaker(events, now, 500), { total: 0, bad: 0 }), '窗口外的全部不算')
  // 评审：noinfo、限流 / 拦截不进分母（E20「noinfo 不计入」；否则「一边超时一边被 1020」稀释到 50% 以下、熔断打不开）
  const t5 = Array.from({ length: 5 }, () => ev({ kind: 'unknown', reason: 'timeout' }))
  const cf = Array.from({ length: 6 }, () => ev({ kind: 'err', code: 'REJECTED', http: 403 }))
  ok(eq(countBreaker([...t5, ...cf], now), { total: 5, bad: 5 }), '5 次超时 + 6 次 403 1020（REJECTED）→ 5 / 5 = 100%，熔断能打开（以前是 5 / 11 = 45%）')
  const rl = [ev({ kind: 'err', code: 'RATE_LIMIT', http: 429 }), ev({ kind: 'err', code: 'SOMETHING', http: 429 }), ev({ kind: 'noinfo' }), ev({ kind: 'noinfo' }), ev({ kind: 'unknown', reason: 'parse' })]
  ok(eq(countBreaker([...t5, ...rl], now), { total: 5, bad: 5 }), '429（不管错误码）、noinfo、只读的 unknown(parse) 分子分母都不计')
  const healthy = [ev({}), ev({ kind: 'err', code: 'ACTIVATION_NOT_ACTIVE', http: 409 }), ev({ kind: 'err', code: 'NOT_FOUND', http: 404 }), ev({ kind: 'err', code: 'NO_BALANCE', http: 402 }), ev({ kind: 'err', code: 'BANNED', http: 403 }), ev({ kind: 'ok' })]
  const mix = countBreaker([...t5, ...healthy], now)
  ok(eq(mix, { total: 11, bad: 5 }) && mix.bad / mix.total < 0.5, '上游正常作答的（ok、409、404、402、403 BANNED）算分母：5 / 11 < 50%，熔断不开（上游是好的）')
}

console.log('\n[客户端参数] 程序错误当场抛（不发请求）；maxPrice 至少 0.0067')
{
  ok(throws(() => setStatus('123', 1 as unknown as 8)), '调研 §1.6 第 5 条：setStatus 的 1 不在枚举里 → 抛错')
  ok(throws(() => setStatus('12a', 8)) && throws(() => getStatus('')), 'activationId 不是数字 → 抛错')
  ok(throws(() => getNumberV2({ service: 'd r', country: 187, maxPriceMicro: 10000 })) && throws(() => getNumberV2({ service: 'dr', country: 1000, maxPriceMicro: 10000 })), '服务代码、国家 id 不合法 → 抛错')
  ok(throws(() => getNumberV2({ service: 'dr', country: 187, maxPriceMicro: 0 })) && throws(() => getNumberV2({ service: 'dr', country: 187, maxPriceMicro: 1.5 })), 'maxPriceMicro 不是正整数 → 抛错')
  ok(throws(() => getNumberV2({ service: 'dr', country: 187, operator: 'at&t', maxPriceMicro: 10000 })), '运营商代码不合法 → 抛错')
  ok(throws(() => v1History({ from: new Date('x'), to: new Date() })) && throws(() => v1History({ from: new Date(), to: new Date(), statuses: [7 as 6] })), 'history：时间不合法、状态不是 6 / 8 / 10 → 抛错')
  ok(throws(() => v1Stats('2026/09/29')) && throws(() => getActiveActivations({ limit: 101 })) && throws(() => getActiveActivations({ limit: 0 })) && throws(() => v1ListActivations({ size: 26 })), 'stats 日期格式、活跃列表 limit 1–100、v1 size ≤25')
}

console.log('\n[§2.4 认领时间窗] 以真正发出的时刻为锚；不知道发出时刻时把「发出前最多等 3 秒」算进去')
{
  const req = 1_000_000_000
  ok(LIMITS.acquireQueueMs <= 3000, `取号从调用到发出最多等 ${LIMITS.acquireQueueMs}ms（过了就 NOT_SENT，不发）`)
  ok(eq(acquireClaimWindow({ requestedAtMs: req, sentAtMs: req }), { fromMs: req - 3000, toMs: req + ACQUIRE_TIMEOUT_MS + 3000 }), '马上发出：窗 = [requestedAt − 3 秒, requestedAt + 15 秒 + 3 秒]（与设计原文一致）')
  const w = acquireClaimWindow({ requestedAtMs: req, sentAtMs: req + 2500 })
  ok(w.fromMs === req - 3000 && w.toMs === req + 2500 + ACQUIRE_TIMEOUT_MS + 3000, '排队 2.5 秒才发出：窗的右端跟着发出时刻走（右端 = 发出 + 18 秒）')
  // 评审复现：发出晚了 20 秒、上游 createdAt = requestedAt + 20 秒 —— 以前的窗 [−3, +18] 漏掉它 → NOT_BOUGHT → 再买一次
  const late = req + 20_000
  const w2 = acquireClaimWindow({ requestedAtMs: req, sentAtMs: late - 100 })
  ok(late >= w2.fromMs && late <= w2.toMs, '即使（旧逻辑下）排队 20 秒才发出：以发出时刻为锚，真买到的号仍在窗里')
  const w3 = acquireClaimWindow({ requestedAtMs: req })
  ok(w3.fromMs === req - 3000 && w3.toMs === req + LIMITS.acquireQueueMs + ACQUIRE_TIMEOUT_MS + 3000, '不知道发出时刻（进程途中崩溃）：右端再加 3 秒的发出前等待上限')
  const w4 = acquireClaimWindow({ requestedAtMs: req, sentAtMs: req - 500 })
  ok(w4.fromMs === req - 3500, 'sentAt 比 requestedAt 还早（两处时钟不同源）：左端取两者较早的，窗只会变宽')
}

console.log('\n[分页核对] 第一页的 total 对不上（翻页途中有行消失、可能漏行）→ 这一轮作废')
{
  ok(pagingShortfall(30, 30) === null && pagingShortfall(30, 31) === null, '去重后条数 ≥ 第一页 total → 拉全了（新增的行只会重复，不会漏）')
  ok(typeof pagingShortfall(30, 29) === 'string', '去重后条数 < 第一页 total → 可能漏了一行 → 作废')
  ok(pagingShortfall(null, 0) === null && pagingShortfall(undefined, 3) === null, '上游没给 total → 无从核对，照旧按「某页不满」收尾')
}

/** 用替身 fetch 截下客户端真正拼出来的请求（不联网：地址是 .invalid，fetch 被换掉） */
async function checkBuiltRequests() {
  console.log('\n[客户端拼请求] 用替身 fetch 截下 getNumberV2 真正发出的 URL（不联网）')
  const saved = { fetch: globalThis.fetch, base: process.env.HEROSMS_BASE, v1: process.env.HEROSMS_V1_BASE, key: process.env.HEROSMS_API_KEY }
  const urls: string[] = []
  const stubKey = 'stub-key-not-real'
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    urls.push(String(input))
    return new Response('NO_NUMBERS', { status: 200 })
  }) as typeof fetch
  process.env.HEROSMS_BASE = 'http://stub.invalid/stubs/handler_api.php'
  process.env.HEROSMS_V1_BASE = 'http://stub.invalid/api/v1'
  process.env.HEROSMS_API_KEY = stubKey
  resetUpstreamStateForTest()
  try {
    const t0 = Date.now()
    const r1 = await getNumberV2({ service: 'dr', country: 187, maxPriceMicro: 5000 })
    const u1 = new URL(urls[0] ?? 'http://x/')
    ok(u1.searchParams.get('maxPrice') === '0.0067' && u1.searchParams.get('action') === 'getNumberV2', 'cap 5,000 微美元 → 真正发出的 URL 里 maxPrice=0.0067（eff，§4.1；删掉 getNumberV2 里的 max(…, 6700) 这条就会失败）')
    ok(u1.searchParams.get('service') === 'dr' && u1.searchParams.get('country') === '187' && !u1.searchParams.has('fixedPrice') && !u1.searchParams.has('operator'), 'service / country 照传；不传 fixedPrice（D6）；没指定运营商就不传 operator')
    ok(r1.kind === 'err' && r1.code === 'NO_NUMBERS' && typeof r1.sentAt === 'number' && r1.sentAt >= t0 && r1.sentAt <= Date.now(), '结果带 sentAt（请求真正发出的时刻）')
    await getNumberV2({ service: 'dr', country: 187, maxPriceMicro: 825_000, operator: 'verizon' })
    const u2 = new URL(urls[1] ?? 'http://x/')
    ok(u2.searchParams.get('maxPrice') === '0.8250' && u2.searchParams.get('operator') === 'verizon', 'cap 825,000 → maxPrice=0.8250；指定运营商照传')
    ok(u1.searchParams.get('api_key') === stubKey && urls.length === 2, 'key 只在 api_key 参数里（兼容协议）')
    process.env.HEROSMS_API_KEY = ''
    const r3 = await getNumberV2({ service: 'dr', country: 187, maxPriceMicro: 825_000 })
    ok(r3.kind === 'err' && r3.code === 'NO_KEY' && r3.http === 0 && r3.sentAt === undefined && urls.length === 2 && classifyAcquire(r3).c === 'KEY_INVALID', '没配 key → err(NO_KEY)、没有 sentAt、一个请求都不发；取号分类 E7（与部署说明一致）')
  } finally {
    globalThis.fetch = saved.fetch
    for (const [k, val] of [['HEROSMS_BASE', saved.base], ['HEROSMS_V1_BASE', saved.v1], ['HEROSMS_API_KEY', saved.key]] as const) {
      if (val === undefined) delete process.env[k]
      else process.env[k] = val
    }
    resetUpstreamStateForTest()
  }
}

checkBuiltRequests()
  .catch((e) => {
    failed++
    console.log(`  ✗ 替身 fetch 检查异常：${(e as Error).message}`)
  })
  .finally(() => {
    console.log(`\n通过 ${passed} 条，失败 ${failed} 条`)
    if (failed) {
      console.log('❌ 有失败')
      process.exit(1)
    }
    console.log('全部通过 ✅')
    process.exit(0)
  })
