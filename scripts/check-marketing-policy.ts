/**
 * 营销推广 · 发送策略纯函数自测（lib/marketing/policy.ts）。**不连数据库**。
 *   npx tsx scripts/check-marketing-policy.ts
 *
 * 钉住设计文档第 5 节的口径：资格判定顺序、频控（跳过 vs 延后）、发送结果分类全表、退避、
 * 预热等级（45 天归零、不达标保持）、熔断阈值与样本下限、今日额度（缺额度按 500、绝不 NaN）、
 * 收件人排序（层级 + 域名交错）、ETA 模拟（时段 / 额度 / 预热 / 排队）、北京时间跨日边界。
 */
import {
  ASSUMED_QUOTA,
  BREAKER_MIN_SAMPLE,
  BREAKER_SENDER_FAIL_RATE,
  CONNECT_ERROR_CODE,
  MAX_CONNECT_ATTEMPTS,
  NO_ACTIVITY,
  REQUEUEABLE_FAILED_CODES,
  SPAM_REJECT_CODE,
  TIER_STRIDE,
  assignSortKeys,
  backoffMs,
  bindingLimit,
  bjDayDiff,
  classifySend,
  computeDailyLimit,
  eligibility,
  evaluateBreaker,
  freqDecision,
  isGoodSendDay,
  simulateEta,
  warmupCap,
  warmupLevel,
  type EligibilityInput,
  type SendAction,
  type SendDayStat,
} from '../src/lib/marketing/policy'
import {
  bjDateKey,
  bjDayStart,
  inSendWindow,
  nextDayWindowStart,
  nextWindowStart,
} from '../src/lib/marketing/time'
import { DEFAULT_CONFIG, SENDER_SIDE_CLASSES, type MarketingConfig } from '../src/lib/marketing/types'
import type { RpcOutcome } from '../src/lib/aliyun'

let pass = 0
let fail = 0
function ok(name: string, cond: boolean, extra = '') {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.error(`  ✗ ${name}${extra ? ` —— ${extra}` : ''}`)
  }
}
function eq(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  ok(name, a === e, `期望 ${e}，实际 ${a}`)
}

const H = 3600_000
const D = 86400_000

/* ============================== 北京时间边界 ============================== */
console.log('\n[time] 北京时间跨日 / 发送时段')
{
  eq('UTC 16:00 = 北京次日 0 点', bjDateKey(new Date('2026-09-24T16:00:00Z')), '2026-09-25')
  eq('UTC 15:59:59 仍是北京当天', bjDateKey(new Date('2026-09-24T15:59:59Z')), '2026-09-24')
  eq('bjDayStart 返回 UTC 16:00', bjDayStart(new Date('2026-09-25T02:00:00Z')).toISOString(), '2026-09-24T16:00:00.000Z')
  const win = { start: 9, end: 21 }
  ok('08:59 不在时段', !inSendWindow(win, new Date('2026-09-25T00:59:00Z')))
  ok('09:00 在时段', inSendWindow(win, new Date('2026-09-25T01:00:00Z')))
  ok('20:59 在时段', inSendWindow(win, new Date('2026-09-25T12:59:00Z')))
  ok('21:00 不在时段（右开）', !inSendWindow(win, new Date('2026-09-25T13:00:00Z')))
  eq('23:30 的次日窗口 = 次日 09:00', nextDayWindowStart(win, new Date('2026-09-25T15:30:00Z')).toISOString(), '2026-09-26T01:00:00.000Z')
  eq('22:00 的下一窗口 = 次日 09:00', nextWindowStart(win, new Date('2026-09-25T14:00:00Z')).toISOString(), '2026-09-26T01:00:00.000Z')
  eq('07:00 的下一窗口 = 当天 09:00', nextWindowStart(win, new Date('2026-09-24T23:00:00Z')).toISOString(), '2026-09-25T01:00:00.000Z')
  eq('bjDayDiff 跨月', bjDayDiff('2026-09-01', '2026-10-01'), 30)
}

/* ============================== 资格判定 ============================== */
console.log('\n[eligibility] 顺序即设计表格顺序')
{
  const now = new Date('2026-09-25T04:00:00Z')
  const base = (): EligibilityInput => ({
    user: { status: 1, email: 'alice@qq.com', createdAt: new Date(now.getTime() - 10 * D) },
    consent: null,
    suppressed: null,
    topic: 'PROMO',
    config: { defaultEligible: true, sunset: { enabled: true } },
    excludeInactive: true,
    activity: { ...NO_ACTIVITY },
    now,
  })
  const withx = (patch: (i: EligibilityInput) => void) => {
    const i = base()
    patch(i)
    return eligibility(i)
  }
  eq('正常用户可发', eligibility(base()), null)
  eq('用户不存在 → DISABLED', withx((i) => (i.user = null)), 'DISABLED')
  eq('status=0 → DISABLED', withx((i) => (i.user!.status = 0)), 'DISABLED')
  eq('禁用且无邮箱 → DISABLED 优先', withx((i) => ((i.user!.status = 0), (i.user!.email = null))), 'DISABLED')
  eq('无邮箱 → NO_EMAIL', withx((i) => (i.user!.email = null)), 'NO_EMAIL')
  eq('格式不对 → NO_EMAIL', withx((i) => (i.user!.email = 'not-an-email')), 'NO_EMAIL')
  eq('.test 域 → TEST_ADDRESS', withx((i) => (i.user!.email = 'x@itest.test')), 'TEST_ADDRESS')
  eq('example.com → TEST_ADDRESS', withx((i) => (i.user!.email = 'x@example.com')), 'TEST_ADDRESS')
  eq('测试域优先于抑制', withx((i) => ((i.user!.email = 'x@a.local'), (i.suppressed = 'MANUAL'))), 'TEST_ADDRESS')
  eq('抑制 → SUPPRESSED', withx((i) => (i.suppressed = 'HARD_BOUNCE')), 'SUPPRESSED')
  eq('抑制优先于退订', withx((i) => ((i.suppressed = 'COMPLAINT'), (i.consent = { status: 'UNSUBSCRIBED', topicsOff: [], pausedUntil: null }))), 'SUPPRESSED')
  eq('退订 → UNSUBSCRIBED', withx((i) => (i.consent = { status: 'UNSUBSCRIBED', topicsOff: [], pausedUntil: null })), 'UNSUBSCRIBED')
  eq(
    '退订优先于暂停',
    withx((i) => (i.consent = { status: 'UNSUBSCRIBED', topicsOff: [], pausedUntil: new Date(now.getTime() + D) })),
    'UNSUBSCRIBED'
  )
  eq('暂停中 → PAUSED', withx((i) => (i.consent = { status: 'DEFAULT', topicsOff: [], pausedUntil: new Date(now.getTime() + D) })), 'PAUSED')
  eq('暂停已过期 → 可发', withx((i) => (i.consent = { status: 'DEFAULT', topicsOff: [], pausedUntil: new Date(now.getTime() - 1) })), null)
  eq(
    '暂停优先于主题关闭',
    withx((i) => (i.consent = { status: 'DEFAULT', topicsOff: ['PROMO'], pausedUntil: new Date(now.getTime() + D) })),
    'PAUSED'
  )
  eq('关闭本主题 → TOPIC_OFF', withx((i) => (i.consent = { status: 'SUBSCRIBED', topicsOff: ['PROMO'], pausedUntil: null })), 'TOPIC_OFF')
  eq('关闭其他主题 → 可发', withx((i) => (i.consent = { status: 'DEFAULT', topicsOff: ['NEWS'], pausedUntil: null })), null)
  eq('opt-in 模式下 DEFAULT → NO_CONSENT', withx((i) => (i.config = { defaultEligible: false, sunset: { enabled: true } })), 'NO_CONSENT')
  eq(
    '主题关闭优先于 NO_CONSENT',
    withx((i) => {
      i.config = { defaultEligible: false, sunset: { enabled: true } }
      i.consent = { status: 'DEFAULT', topicsOff: ['PROMO'], pausedUntil: null }
    }),
    'TOPIC_OFF'
  )
  eq(
    'opt-in 模式下 SUBSCRIBED 可发',
    withx((i) => {
      i.config = { defaultEligible: false, sunset: { enabled: true } }
      i.consent = { status: 'SUBSCRIBED', topicsOff: [], pausedUntil: null }
    }),
    null
  )
  eq('已收 3 封无互动 → SUNSET', withx((i) => (i.activity.marketingReceived = 3)), 'SUNSET')
  eq('已收 2 封 → 不 SUNSET', withx((i) => (i.activity.marketingReceived = 2)), null)
  eq('90 天内点过 → 不 SUNSET', withx((i) => ((i.activity.marketingReceived = 5), (i.activity.clickedWithin90d = true))), null)
  eq('90 天内付过款 → 不 SUNSET', withx((i) => ((i.activity.marketingReceived = 5), (i.activity.paidWithin90d = true))), null)
  eq(
    '明确订阅者不 SUNSET',
    withx((i) => ((i.activity.marketingReceived = 9), (i.consent = { status: 'SUBSCRIBED', topicsOff: [], pausedUntil: null }))),
    null
  )
  eq('sunset 关闭 → 不 SUNSET', withx((i) => ((i.activity.marketingReceived = 9), (i.config = { defaultEligible: true, sunset: { enabled: false } }))), null)
  const old = new Date(now.getTime() - 200 * D)
  eq('注册 200 天、无付款无点击 → INACTIVE', withx((i) => (i.user!.createdAt = old)), 'INACTIVE')
  eq('365 天内付过款 → 不 INACTIVE', withx((i) => ((i.user!.createdAt = old), (i.activity.paidWithin365d = true))), null)
  eq('180 天内点过 → 不 INACTIVE', withx((i) => ((i.user!.createdAt = old), (i.activity.clickedWithin180d = true))), null)
  eq('受众不排除不活跃 → 可发', withx((i) => ((i.user!.createdAt = old), (i.excludeInactive = false))), null)
  eq('注册 170 天 → 不 INACTIVE', withx((i) => (i.user!.createdAt = new Date(now.getTime() - 170 * D))), null)
  eq('SUNSET 优先于 INACTIVE', withx((i) => ((i.user!.createdAt = old), (i.activity.marketingReceived = 4))), 'SUNSET')
  eq('大写邮箱照样判测试域', withx((i) => (i.user!.email = 'X@EXAMPLE.COM')), 'TEST_ADDRESS')
}

/* ============================== 频控 ============================== */
console.log('\n[freqDecision] 7d/30d 跳过、minHours 延后')
{
  const now = new Date('2026-09-25T04:00:00Z')
  const f = { minHours: 24, max7d: 2, max30d: 4 }
  const ago = (ms: number) => new Date(now.getTime() - ms)
  eq('没发过 → ok', freqDecision({ times: [] }, f, now), { kind: 'ok' })
  eq('25 小时前一封 → ok', freqDecision({ times: [ago(25 * H)] }, f, now), { kind: 'ok' })
  const d = freqDecision({ times: [ago(10 * H)] }, f, now)
  ok('10 小时前一封 → 延后（不跳过）', d.kind === 'delay')
  ok('延后到上一封 + 24h', d.kind === 'delay' && d.until.getTime() === ago(10 * H).getTime() + 24 * H)
  eq('7 天内 2 封 → 跳过', freqDecision({ times: [ago(2 * D), ago(3 * D)] }, f, now), { kind: 'skip' })
  eq('30 天内 4 封（7 天内 0 封）→ 跳过', freqDecision({ times: [ago(8 * D), ago(10 * D), ago(15 * D), ago(20 * D)] }, f, now), { kind: 'skip' })
  eq('30 天内 3 封 → ok', freqDecision({ times: [ago(8 * D), ago(10 * D), ago(15 * D)] }, f, now), { kind: 'ok' })
  eq('跳过优先于延后', freqDecision({ times: [ago(2 * H), ago(3 * D)] }, f, now), { kind: 'skip' })
  eq('恰好 7 天前不计入 7 天窗口', freqDecision({ times: [ago(7 * D), ago(1 * D - 1)] }, { ...f, minHours: 0 }, now), { kind: 'ok' })
  eq('31 天前不计入', freqDecision({ times: [ago(31 * D), ago(32 * D), ago(33 * D), ago(34 * D)] }, f, now), { kind: 'ok' })
  eq('minHours=0 不延后', freqDecision({ times: [ago(1 * H)] }, { ...f, minHours: 0 }, now), { kind: 'ok' })
  eq('坏时间被忽略', freqDecision({ times: [new Date('x')] }, f, now), { kind: 'ok' })
  const d2 = freqDecision({ times: [ago(30 * H), ago(5 * H)] }, { ...f, max7d: 5 }, now)
  ok('多封时按最近一封延后', d2.kind === 'delay' && d2.until.getTime() === ago(5 * H).getTime() + 24 * H)
}

/* ============================== 发送结果分类 ============================== */
console.log('\n[classifySend] 设计 5.5 全表')
{
  const api = (code: string, message = 'x'): RpcOutcome => ({ kind: 'api_error', code, message, httpStatus: 400 })
  const act = (o: RpcOutcome) => classifySend(o).action
  const table: [string, RpcOutcome, SendAction][] = [
    ['成功', { kind: 'ok', httpStatus: 200 }, 'SENT'],
    ['超时 → UNKNOWN', { kind: 'unknown_error', errName: 'TimeoutError' }, 'UNKNOWN'],
    ['5xx 无 Code → UNKNOWN', { kind: 'unknown_error', httpStatus: 502, errName: 'Http5xx' }, 'UNKNOWN'],
    ['非 JSON 5xx → UNKNOWN', { kind: 'unknown_error', httpStatus: 504, errName: 'NonJson5xx' }, 'UNKNOWN'],
    ['DNS 失败 → RETRY', { kind: 'connect_error', errName: 'ENOTFOUND' }, 'RETRY'],
    ['连接超时 → RETRY', { kind: 'connect_error', errName: 'UND_ERR_CONNECT_TIMEOUT' }, 'RETRY'],
    ['Throttling → 限流', api('Throttling'), 'RETRY_THROTTLE'],
    ['Throttling.User → 限流', api('Throttling.User'), 'RETRY_THROTTLE'],
    ['ServiceUnavailable → RETRY', api('ServiceUnavailable'), 'RETRY'],
    ['InternalError → RETRY', api('InternalError'), 'RETRY'],
    ['InternalServiceError → RETRY', api('InternalServiceError'), 'RETRY'],
    ['InvalidToAddress → 抑制', api('InvalidToAddress'), 'FAIL_SUPPRESS'],
    ['InvalidToAddress.Spam → 抑制', api('InvalidToAddress.Spam'), 'FAIL_SUPPRESS'],
    ['InvalidReceiverName.Malformed → 抑制', api('InvalidReceiverName.Malformed'), 'FAIL_SUPPRESS'],
    ['EmailFormatError → 抑制', api('EmailFormatError'), 'FAIL_SUPPRESS'],
    ['InvalidQuota → 额度急停', api('InvalidQuota'), 'HALT_QUOTA'],
    ['InvalidSendMail.Spam → 反垃圾', api('InvalidSendMail.Spam'), 'FAIL_SPAM'],
    ['InvalidMailAddress.NotFound → 配置', api('InvalidMailAddress.NotFound'), 'HALT_CONFIG'],
    ['InvalidUserStatus → 配置', api('InvalidUserStatus'), 'HALT_CONFIG'],
    ['InvalidUser.NotFound → 配置', api('InvalidUser.NotFound'), 'HALT_CONFIG'],
    ['Forbidden.RAM → 配置', api('Forbidden.RAM'), 'HALT_CONFIG'],
    ['Forbidden → 配置', api('Forbidden'), 'HALT_CONFIG'],
    ['InvalidIP.NotFound → 配置', api('InvalidIP.NotFound'), 'HALT_CONFIG'],
    ['SignatureDoesNotMatch → 配置', api('SignatureDoesNotMatch'), 'HALT_CONFIG'],
    ['InvalidAccessKeyId.NotFound → 配置', api('InvalidAccessKeyId.NotFound'), 'HALT_CONFIG'],
    ['MissingParameter.AccountName → 配置', api('MissingParameter.AccountName'), 'HALT_CONFIG'],
    ['User.Frozen → 配置', api('User.Frozen'), 'HALT_CONFIG'],
    ['LocalConfigMissing（本地未配置）→ 配置', api('LocalConfigMissing'), 'HALT_CONFIG'],
    ['InvalidSubject.Malformed → 内容', api('InvalidSubject.Malformed'), 'PAUSE_CONTENT'],
    ['InvalidBody → 内容', api('InvalidBody'), 'PAUSE_CONTENT'],
    ['InvalidHtmlBody.Malformed → 内容', api('InvalidHtmlBody.Malformed'), 'PAUSE_CONTENT'],
    ['InvalidTextBody → 内容', api('InvalidTextBody'), 'PAUSE_CONTENT'],
    ['InvalidFromAlias.Malformed → 内容', api('InvalidFromAlias.Malformed'), 'PAUSE_CONTENT'],
    ['InvalidReplyAddress.Malformed → 内容', api('InvalidReplyAddress.Malformed'), 'PAUSE_CONTENT'],
    ['其他 Code → FAIL', api('SomethingNew'), 'FAIL'],
    ['HTTP404（无 Code）→ FAIL', api('HTTP404'), 'FAIL'],
    ['api_error 缺 Code → FAIL', { kind: 'api_error', httpStatus: 400 }, 'FAIL'],
  ]
  for (const [name, o, want] of table) eq(name, act(o), want)
  eq('成功 errorCode 为 null', classifySend({ kind: 'ok' }).errorCode, null)
  eq('连接失败 errorCode=CONNECT', classifySend({ kind: 'connect_error', errName: 'ECONNREFUSED' }).errorCode, CONNECT_ERROR_CODE)
  eq('反垃圾 errorCode=SPAM_REJECT', classifySend(api('InvalidSendMail.Spam')).errorCode, SPAM_REJECT_CODE)
  eq('其他 errorCode 保留原 Code', classifySend(api('Weird.Code')).errorCode, 'Weird.Code')
  ok('超长 Code 截到 64', (classifySend(api('X'.repeat(200))).errorCode || '').length === 64)
  ok('note 截到 500', (classifySend(api('Y', 'm'.repeat(2000))).note || '').length <= 500)
  ok('可重排：CONNECT', REQUEUEABLE_FAILED_CODES.includes(CONNECT_ERROR_CODE))
  ok('可重排：ServiceUnavailable', REQUEUEABLE_FAILED_CODES.includes('ServiceUnavailable'))
  ok('不可重排：SPAM_REJECT', !REQUEUEABLE_FAILED_CODES.includes(SPAM_REJECT_CODE))
  ok('不可重排：InvalidToAddress', !REQUEUEABLE_FAILED_CODES.includes('InvalidToAddress'))
}

/* ============================== 退避 ============================== */
console.log('\n[backoffMs] 1m / 5m / 30m / 2h')
{
  eq('第 1 次 1 分钟', backoffMs(1), 60_000)
  eq('第 2 次 5 分钟', backoffMs(2), 300_000)
  eq('第 3 次 30 分钟', backoffMs(3), 1_800_000)
  eq('第 4 次 2 小时', backoffMs(4), 7_200_000)
  eq('第 9 次仍 2 小时', backoffMs(9), 7_200_000)
  eq('0 次按第 1 次', backoffMs(0), 60_000)
  eq('NaN 按第 1 次', backoffMs(NaN), 60_000)
  eq('最多 5 次', MAX_CONNECT_ATTEMPTS, 5)
}

/* ============================== 预热 ============================== */
console.log('\n[warmupLevel] 达标升级、不达标保持、45 天归零')
{
  const today = '2026-09-25'
  const day = (date: string, p: Partial<SendDayStat> = {}): SendDayStat => ({
    date,
    sent: 100,
    results: 100,
    invalid: 0,
    spam: 0,
    complaints: 0,
    spamRejects: 0,
    ...p,
  })
  eq('没发过 → 0', warmupLevel([], today), 0)
  eq('3 个达标日 → 3', warmupLevel([day('2026-09-22'), day('2026-09-23'), day('2026-09-24')], today), 3)
  eq('乱序输入同样结果', warmupLevel([day('2026-09-24'), day('2026-09-22'), day('2026-09-23')], today), 3)
  eq(
    '达标、不达标（无效 5%）、达标 → 2（保持不降）',
    warmupLevel([day('2026-09-22'), day('2026-09-23', { invalid: 5 }), day('2026-09-24')], today),
    2
  )
  eq('垃圾率 1% 不达标', warmupLevel([day('2026-09-24', { spam: 1 })], today), 0)
  eq('无效 2%、垃圾 0.9% 达标', warmupLevel([day('2026-09-24', { results: 1000, invalid: 20, spam: 9 })], today), 1)
  eq('回执不足 20 视为达标（比率不判）', warmupLevel([day('2026-09-24', { results: 10, invalid: 5 })], today), 1)
  eq('有投诉即不达标（即使回执不足 20）', warmupLevel([day('2026-09-24', { results: 10, complaints: 1 })], today), 0)
  eq('有反垃圾拒发即不达标', warmupLevel([day('2026-09-24', { spamRejects: 1 })], today), 0)
  eq('只有被拒发的日子也算发送日（不达标）', warmupLevel([day('2026-09-23'), day('2026-09-24', { sent: 0, results: 0, spamRejects: 2 })], today), 1)
  eq('今天不计入', warmupLevel([day('2026-09-24'), day(today)], today), 1)
  eq('未来日期不计入', warmupLevel([day('2026-09-30')], today), 0)
  eq('60 天前以外不计入', warmupLevel([day('2026-07-26')], today), 0)
  eq('sent=0 的日子不是发送日', warmupLevel([day('2026-09-24', { sent: 0, results: 0 })], today), 0)
  eq('发送日间隔 >45 天 → 从头算', warmupLevel([day('2026-08-05'), day('2026-08-06'), day('2026-09-22')], today), 1)
  eq('间隔恰好 45 天 → 不归零', warmupLevel([day('2026-08-08'), day('2026-09-22')], today), 2)
  eq('上一个发送日距今天 46 天 → 0', warmupLevel([day('2026-08-09'), day('2026-08-10')], today), 0)
  eq('上一个发送日距今天 45 天 → 保留', warmupLevel([day('2026-08-10'), day('2026-08-11')], today), 2)
  eq('同日多行合并', warmupLevel([day('2026-09-24', { results: 50, invalid: 1 }), day('2026-09-24', { results: 50, invalid: 1 })], today), 1)
  ok('isGoodSendDay：无效恰好 3% 不达标', !isGoodSendDay(day('x', { results: 100, invalid: 3 })))
  eq('warmupCap(0)', warmupCap(0, [200, 500, 1000, 2000]), 200)
  eq('warmupCap(3)', warmupCap(3, [200, 500, 1000, 2000]), 2000)
  eq('warmupCap 超出 → 不限（null）', warmupCap(4, [200, 500, 1000, 2000]), null)
  eq('warmupCap 负数按 0', warmupCap(-1, [200, 500]), 200)
  eq('warmupCap 空表 → null', warmupCap(0, []), null)
}

/* ============================== 熔断 ============================== */
console.log('\n[evaluateBreaker] 阈值与样本下限')
{
  const b = (results: number, invalid = 0, spam = 0, complaints = 0) => evaluateBreaker({ results, invalid, spam, complaints }).trip
  eq('样本下限 30', BREAKER_MIN_SAMPLE, 30)
  eq('29 个样本全无效也不判', b(29, 29), false)
  eq('30 个样本、无效 2（6.7%）→ 熔断', b(30, 2), true)
  eq('无效恰好 5% 不熔断', b(100, 5), false)
  eq('无效 6% 熔断', b(100, 6), true)
  eq('垃圾 2% 不熔断', b(100, 0, 2), false)
  eq('垃圾 3% 熔断', b(100, 0, 3), true)
  eq('垃圾恰好 2.5% 不熔断', b(1000, 0, 25), false)
  eq('垃圾 2.6% 熔断', b(1000, 0, 26), true)
  eq('小样本投诉 1 次不熔断', b(100, 0, 0, 1), false)
  eq('小样本投诉 2 次熔断', b(100, 0, 0, 2), true)
  eq('样本 700 起按比率：2 次（0.29%）不熔断', b(700, 0, 0, 2), false)
  eq('样本 700、投诉 3 次（0.43%）熔断', b(700, 0, 0, 3), true)
  eq('样本 1000、投诉 3 次（0.3%）不熔断', b(1000, 0, 0, 3), false)
  eq('样本 1000、投诉 4 次熔断', b(1000, 0, 0, 4), true)
  ok('熔断带原因', (() => {
    const v = evaluateBreaker({ results: 100, invalid: 10, spam: 0, complaints: 0 })
    return v.trip && v.reason.includes('无效')
  })())
  eq('NaN 样本不判', b(NaN, 5), false)
}

console.log('\n[evaluateBreaker] 发信方问题失败率（审查 C19）')
{
  const s = (results: number, senderFail: number) => evaluateBreaker({ results, invalid: 0, spam: 0, complaints: 0, senderFail }).trip
  eq('阈值 10%', BREAKER_SENDER_FAIL_RATE, 0.1)
  eq('发信方失败恰好 10% 不熔断', s(100, 10), false)
  eq('发信方失败 11% 熔断', s(100, 11), true)
  eq('30 个样本里 4 个（13%）熔断', s(30, 4), true)
  eq('样本 29 全是发信方失败也不判（样本下限照旧）', s(29, 29), false)
  eq('没有 senderFail 字段（旧调用方）→ 按 0', evaluateBreaker({ results: 100, invalid: 0, spam: 0, complaints: 0 }).trip, false)
  eq('senderFail 为 NaN → 按 0', s(100, NaN), false)
  ok('熔断原因写明是发信方问题', (() => {
    const v = evaluateBreaker({ results: 100, invalid: 0, spam: 0, complaints: 0, senderFail: 20 })
    return v.trip && v.reason.includes('发信方')
  })())
  ok('发信方分类：SPF/DKIM/DMARC/发信人或域名被拉黑', ['SmtpAuthFail', 'SmtpSpfFail', 'SmtpDmaFail', 'SmtpMfBad', 'SmtpDbl'].every((c) => (SENDER_SIDE_CLASSES as readonly string[]).includes(c)))
  ok('收件方连接失败不算发信方问题（仍按软退信）', !(SENDER_SIDE_CLASSES as readonly string[]).includes('SysOutConnError'))
}

async function couponNames() {
  console.log('\n[couponBatchName] 券名去掉变量（审查 C8）')
  const { couponBatchName } = await import('../src/lib/marketing/coupon')
  eq('变量整段去掉', couponBatchName('{{nickname|朋友}}的回归券'), '的回归券')
  eq('多个变量、多余空白', couponBatchName('  {{nickname}} 专享 {{coupon_expires}} 券 '), '专享 券')
  eq('只有变量 → 回落「邮件专享券」', couponBatchName('{{nickname|朋友}}'), '邮件专享券')
  eq('普通标题原样保留', couponBatchName('回归专享券'), '回归专享券')
  eq('空标题 → 回落', couponBatchName(''), '邮件专享券')
  eq('截到 80 字', couponBatchName('券'.repeat(100)).length, 80)
}

/* ============================== 今日额度 ============================== */
console.log('\n[computeDailyLimit] 缺额度按 500、绝不 NaN')
{
  const cfg = { dailyCap: 2000, maxQuotaShare: 0.6, warmup: { enabled: true, schedule: [200, 500, 1000, 2000] } }
  const r0 = computeDailyLimit({ config: cfg, dailyQuota: null, warmupLevel: 0 })
  eq('缺额度 → 按 500', r0.parts.quota, ASSUMED_QUOTA)
  eq('缺额度标记 quotaAssumed', r0.parts.quotaAssumed, true)
  eq('quotaCap = floor(500×0.6)=300', r0.parts.quotaCap, 300)
  eq('第 0 级预热 200 卡住', r0.limit, 200)
  eq('卡在预热', bindingLimit(r0), 'warmup')
  const r1 = computeDailyLimit({ config: cfg, dailyQuota: null, warmupLevel: 1 })
  eq('第 1 级：额度 300 卡住', r1.limit, 300)
  eq('卡在额度', bindingLimit(r1), 'quota')
  const r2 = computeDailyLimit({ config: cfg, dailyQuota: 10000, warmupLevel: 4 })
  eq('预热毕业、额度充足：dailyCap 卡住', r2.limit, 2000)
  eq('预热毕业 warmupCap=null', r2.parts.warmupCap, null)
  eq('卡在 dailyCap', bindingLimit(r2), 'dailyCap')
  eq('额度 NaN → 按 500', computeDailyLimit({ config: cfg, dailyQuota: NaN, warmupLevel: 9 }).parts.quota, 500)
  eq('额度 0 → 按 500', computeDailyLimit({ config: cfg, dailyQuota: 0, warmupLevel: 9 }).parts.quotaAssumed, true)
  eq('1000×0.7 = 700（浮点不丢一封）', computeDailyLimit({ config: { ...cfg, maxQuotaShare: 0.7 }, dailyQuota: 1000, warmupLevel: 9 }).parts.quotaCap, 700)
  const bad = computeDailyLimit({
    config: { dailyCap: NaN, maxQuotaShare: undefined as unknown as number, warmup: { enabled: true, schedule: [NaN as unknown as number, 300] } },
    dailyQuota: 'x' as unknown as number,
    warmupLevel: NaN,
  })
  ok('坏配置也得到有限数', Number.isFinite(bad.limit) && Number.isFinite(bad.parts.quotaCap) && Number.isFinite(bad.parts.dailyCap))
  eq('关闭预热 → warmupCap=null', computeDailyLimit({ config: { ...cfg, warmup: { enabled: false, schedule: [10] } }, dailyQuota: 10000, warmupLevel: 0 }).parts.warmupCap, null)
  ok('limit 永不为负', computeDailyLimit({ config: { ...cfg, dailyCap: -5 }, dailyQuota: 100, warmupLevel: 0 }).limit >= 0)
}

/* ============================== 收件人排序 ============================== */
console.log('\n[assignSortKeys] 层级顺序 + 层内域名交错')
{
  const rows = [
    { email: 'a@qq.com', domain: 'qq.com', tier: 2 },
    { email: 'b@qq.com', domain: 'qq.com', tier: 0 },
    { email: 'c@163.com', domain: '163.com', tier: 1 },
    { email: 'd@gmail.com', domain: 'gmail.com', tier: 0 },
    { email: 'e@x.com', domain: 'x.com', tier: 4 },
  ]
  const k = assignSortKeys(rows)
  eq('长度一致', k.length, rows.length)
  ok('层 0 < 层 1 < 层 2 < 层 4', Math.max(k[1], k[3]) < k[2] && k[2] < k[0] && k[0] < k[4])
  ok('sortKey 落在本层区间', rows.every((r, i) => k[i] >= r.tier * TIER_STRIDE && k[i] < (r.tier + 1) * TIER_STRIDE))
  eq('空输入', assignSortKeys([]), [])

  const same = ['qq', 'qq', 'qq', 'qq', 'gmail', 'gmail', 'gmail', 'gmail'].map((d, i) => ({ email: `u${i}@${d}.com`, domain: `${d}.com`, tier: 3 }))
  const ks = assignSortKeys(same)
  const order = same.map((r, i) => ({ d: r.domain, k: ks[i], i })).sort((a, b) => a.k - b.k)
  ok('等量两域名严格交替', order.every((o, j) => j === 0 || o.d !== order[j - 1].d), order.map((o) => o.d).join(','))
  ok('同域名内保持输入顺序', (() => {
    const qq = order.filter((o) => o.d === 'qq.com').map((o) => o.i)
    return qq.join(',') === '0,1,2,3'
  })())
  ok('层内序号唯一', new Set(ks).size === ks.length)

  const skew = [...Array(8)].map((_, i) => ({ email: `q${i}@qq.com`, domain: 'qq.com', tier: 1 }))
  skew.push({ email: 'g0@gmail.com', domain: 'gmail.com', tier: 1 }, { email: 'g1@gmail.com', domain: 'gmail.com', tier: 1 })
  const kk = assignSortKeys(skew)
  const seq = skew.map((r, i) => ({ d: r.domain, k: kk[i] })).sort((a, b) => a.k - b.k).map((o) => o.d)
  const gPos = seq.map((d, i) => (d === 'gmail.com' ? i : -1)).filter((i) => i >= 0)
  ok('小域名均匀铺开（不挤在一起）', gPos.length === 2 && gPos[1] - gPos[0] >= 4, seq.join(','))
  let run = 0
  let maxRun = 0
  for (const d of seq) {
    run = d === 'qq.com' ? run + 1 : 0
    maxRun = Math.max(maxRun, run)
  }
  ok('大域名最长连续段 ≤ 4', maxRun <= 4, `maxRun=${maxRun}`)
  ok('域名大小写视为同一个', (() => {
    const kx = assignSortKeys([
      { email: 'a@QQ.com', domain: 'QQ.com', tier: 0 },
      { email: 'b@qq.com', domain: 'qq.com', tier: 0 },
      { email: 'c@163.com', domain: '163.com', tier: 0 },
    ])
    // qq 两封 (0.25, 0.75) 与 163 一封 (0.5) → qq,163,qq
    return kx[0] < kx[2] && kx[2] < kx[1]
  })())
}

/* ============================== ETA 模拟 ============================== */
console.log('\n[simulateEta] 时段 / 额度 / 预热 / 排队')
{
  const cfg: Pick<MarketingConfig, 'dailyCap' | 'maxQuotaShare' | 'warmup' | 'sendWindow' | 'ratePerSec' | 'canarySize'> = {
    dailyCap: 2000,
    maxQuotaShare: 0.6,
    warmup: { enabled: true, schedule: [200, 500, 1000, 2000] },
    sendWindow: { start: 9, end: 21 },
    ratePerSec: 1,
    canarySize: 50,
  }
  const at10 = new Date('2026-09-25T02:00:00Z') // 北京 10:00
  const base = { now: at10, startAt: at10, config: cfg, dailyQuota: null, warmupLevel: 0, usedToday: 0, aheadCount: 0 }
  const sum = (r: { perDay: { count: number }[] }) => r.perDay.reduce((s, d) => s + d.count, 0)

  const empty = simulateEta({ ...base, count: 0 })
  eq('0 封 → 全空', [empty.startAt, empty.finishAt, empty.perDay.length], [null, null, 0])

  const small = simulateEta({ ...base, count: 100 })
  eq('100 封当天发完', small.perDay, [{ date: '2026-09-25', count: 100 }])
  eq('立即开始', small.startAt, at10.toISOString())
  ok('含试探等待（完成 ≥ 开始 + 30 分钟）', !!small.finishAt && Date.parse(small.finishAt) >= at10.getTime() + 30 * 60_000)
  ok('当天 21 点前发完', !!small.finishAt && bjDateKey(new Date(small.finishAt)) === '2026-09-25' && Date.parse(small.finishAt) < Date.parse('2026-09-25T13:00:00Z'))

  const noCanary = simulateEta({ ...base, count: 40 })
  ok('不足一个试探批次不等待', !!noCanary.finishAt && Date.parse(noCanary.finishAt) < at10.getTime() + 5 * 60_000)

  const five = simulateEta({ ...base, count: 500 })
  eq('500 封：第 1 天预热 200、第 2 天额度 300', five.perDay, [
    { date: '2026-09-25', count: 200 },
    { date: '2026-09-26', count: 300 },
  ])
  ok('被预热卡住', five.blockedBy.includes('warmup'), five.blockedBy.join(','))
  ok('第 2 天 9 点后完成', !!five.finishAt && Date.parse(five.finishAt) > Date.parse('2026-09-26T01:00:00Z'))

  const night = simulateEta({ ...base, now: new Date('2026-09-25T14:00:00Z'), startAt: new Date('2026-09-25T14:00:00Z'), count: 10 })
  eq('22 点提交 → 次日 9 点开始', night.startAt, '2026-09-26T01:00:00.000Z')
  ok('原因含 window', night.blockedBy.includes('window'))
  eq('次日发完', night.perDay, [{ date: '2026-09-26', count: 10 }])

  const used = simulateEta({ ...base, count: 100, usedToday: 150 })
  eq('今天已用 150 → 今天只剩 50', used.perDay[0], { date: '2026-09-25', count: 50 })
  eq('明天发完余下 50', used.perDay[1], { date: '2026-09-26', count: 50 })

  const queued = simulateEta({ ...base, count: 100, aheadCount: 180 })
  eq('前面排着 180 → 今天只剩 20', queued.perDay[0], { date: '2026-09-25', count: 20 })
  ok('原因含 queue', queued.blockedBy.includes('queue'))
  ok('排队时开始时间晚于现在', !!queued.startAt && Date.parse(queued.startAt) > at10.getTime())

  const later = simulateEta({ ...base, count: 100, usedToday: 200, startAt: new Date('2026-09-27T07:00:00Z') })
  eq('定时到后天 15:00：今天的用量不影响那天', later.perDay, [{ date: '2026-09-27', count: 100 }])
  eq('从定时时刻开始', later.startAt, '2026-09-27T07:00:00.000Z')

  const quota = simulateEta({
    ...base,
    count: 1000,
    dailyQuota: 1000,
    config: { ...cfg, warmup: { enabled: false, schedule: [200] } },
  })
  eq('额度 1000×0.6 → 每天 600', quota.perDay.map((d) => d.count), [600, 400])
  ok('原因含 quota', quota.blockedBy.includes('quota'))

  const slow = simulateEta({
    ...base,
    count: 1000,
    dailyQuota: 100000,
    config: { ...cfg, ratePerSec: 0.2, sendWindow: { start: 10, end: 11 }, warmup: { enabled: false, schedule: [200] } },
  })
  ok('速率/时段卡住 → 多天', slow.perDay.length > 1)
  ok('原因含 window（时段内发不完）', slow.blockedBy.includes('window'))
  ok('每天不超过时段容量（1 小时 × 0.2/s × 35/60 = 420）', slow.perDay.every((d) => d.count <= 420))
  eq('分天合计 = 总数', sum(slow), 1000)

  const bad = simulateEta({ ...base, count: 10, config: { ...cfg, sendWindow: { start: 10, end: 9 } } })
  eq('时段配置坏了 → 估不出', [bad.finishAt, bad.blockedBy], [null, ['window']])
  const never = simulateEta({ ...base, count: 10, config: { ...cfg, dailyCap: 0 } })
  eq('每天额度 0 → 估不出完成时间', never.finishAt, null)
  eq('合计 = 总数（500）', sum(five), 500)
  ok('预热逐日升级（第 3 天 1000）', (() => {
    const r = simulateEta({ ...base, count: 3000, dailyQuota: 100000 })
    return r.perDay[0].count === 200 && r.perDay[1].count === 500 && r.perDay[2].count === 1000
  })())
}

/* ============================== 时间不变量 ============================== */
console.log('\n[invariants] SENDING 回收 5 分钟 > 锁 TTL 3 分钟 > 单趟最长 60 秒')
async function invariants() {
  const w = await import('../src/lib/marketing/worker')
  const t = await import('../src/lib/marketing/transport')
  ok('SENDING 回收 > 锁 TTL', w.SENDING_STALE_MS > w.SEND_LOCK_TTL_MS)
  ok('锁 TTL > 60 秒', w.SEND_LOCK_TTL_MS > 60_000)
  ok('单趟截止 + 单封超时 + 最大间隔 < 58 秒（crontab --max-time）', w.TICK_DEADLINE_MS + t.SEND_TIMEOUT_MS + 5_000 < 58_000)
  ok('CLAIMED 回收 < SENDING 回收', w.CLAIM_STALE_MS < w.SENDING_STALE_MS)
  ok('默认配置本身合法（ratePerSec 0.2–2）', DEFAULT_CONFIG.ratePerSec >= 0.2 && DEFAULT_CONFIG.ratePerSec <= 2)
}

invariants()
  .then(couponNames)
  .catch((e) => {
    fail++
    console.error('  ✗ 读取 worker 常量 / 券名测试失败', e)
  })
  .finally(() => {
    console.log(`\n通过 ${pass}，失败 ${fail}`)
    process.exit(fail ? 1 : 0)
  })
