/**
 * 营销推广 · 同步与公开端自测。
 *
 *   npx tsx scripts/check-marketing-public.ts            只跑纯函数（不连数据库）
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/check-marketing-public.ts --db
 *                                                       再跑一轮数据库集成（会建数据、跑完删掉）
 *
 * ⚠️ --db 只能对一次性的本地库跑：库名不含 dev / test 时直接拒绝执行。
 *
 * 钉住的口径（docs/营销推广-设计.md 10.1 / 10.4 / 11.1）：
 *   · 机器点击判定（UA 特征 + 距发送 <10 秒）、点击跳转只认库里的 URL
 *   · 回执匹配：邮箱 + 主题 + utc ≥ claimedAt−60s 取最早、一条回执只配一封；UtcLastUpdateTime 数字/字符串都收
 *   · 查询窗口切分（窗口太密就缩小放宽量）与执行顺序（最新窗口优先、其余轮转）
 *   · 末次点击归因（跨活动、窗口外不回退找更早的点击）与「影响」口径
 *   · 退订页：减少来信永远可用、增加来信只在 30 天内、每 token 每天 10 次、token=test 空转
 *   · 打开/点击事件封顶、一键退订幂等
 *   · 审查修复：C0 试探计数从恢复时刻起算、C5 追踪用 trackToken、C14 回执窗口正对照/缺 data 不信/打开点过的 UNKNOWN 对账、
 *     C15 按每封信的发信地址查回执/屏蔽名单整账户拉、C16 预拦截的投诉/退订不记到这封信、C17 回执匹配带锚点、
 *     C18 「为什么还没发」覆盖 no_contact / no_sender / 同步状态读坏、C19 发信方问题不算软退信
 *
 *   同步集成（假阿里云）：见文件末尾 syncSuite 的说明；--db 与 --sync 可以一起给
 */
import { randomBytes } from 'crypto'
import {
  BOT_MIN_DELAY_MS,
  CLICK_EVENT_CAP,
  MESSAGE_TOKEN_RE,
  OPEN_EVENT_CAP,
  TRACK_TOKEN_RE,
  TRANSPARENT_GIF,
  isBotHit,
  normalizeTrackToken,
  safeRedirectTarget,
} from '../src/lib/marketing/tracking'
import {
  classifyDeliveryError,
  deliveryFromStatus,
  deliveryKey,
  isSoftBounceStreak,
  looksMasked,
  matchDelivery,
  orderWindows,
  parseDeliveryRow,
  parseUtcSeconds,
  planDeliveryWindows,
  toArray,
  windowCompleteness,
  type AcceptedSend,
  type DeliveryRow,
  type MatchableMessage,
} from '../src/lib/marketing/sync'
import { SENDER_SIDE_CLASSES } from '../src/lib/marketing/types'
import { attributeOrders, csvCell, influencedOrders, ratio, type ClickPoint, type OrderLite } from '../src/lib/marketing/stats'
import { canIncreaseBy, prefsActionIncreases } from '../src/lib/marketing/prefs'
import type { ConsentView } from '../src/lib/marketing/consent'

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
function eq(name: string, got: unknown, want: unknown) {
  const a = JSON.stringify(got)
  const b = JSON.stringify(want)
  ok(name, a === b, `got=${a} want=${b}`)
}

const H = 3600_000
const D = 86400_000
const T0 = Date.UTC(2026, 8, 25, 2, 0, 0) // 北京 10:00

/* ================================================================================================ */
console.log('机器点击判定：')
const CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 MicroMessenger/8.0'
const sent = new Date(T0)
ok('真人 UA、发送 1 分钟后 → 不是机器', !isBotHit(CHROME, sent, new Date(T0 + 60_000)))
ok('距发送 9.9 秒 → 机器（安全网关投递时预取）', isBotHit(CHROME, sent, new Date(T0 + 9_900)))
ok('距发送正好 10 秒 → 不是机器', !isBotHit(CHROME, sent, new Date(T0 + BOT_MIN_DELAY_MS)))
ok('发送时间在未来（时钟不可信）→ 机器', isBotHit(CHROME, sent, new Date(T0 - 5_000)))
ok('没有发送时间只看 UA', !isBotHit(CHROME, null, new Date(T0)))
for (const ua of [
  'Mozilla/5.0 (compatible; Googlebot/2.1)',
  'curl/8.4.0',
  'Wget/1.21',
  'python-requests/2.31',
  'Mozilla/5.0 HeadlessChrome/120.0',
  'Proofpoint URL Defense',
  'Mimecast Security Scanner',
  'Barracuda Sentinel',
  'Slackbot-LinkExpanding 1.0',
  'TelegramBot (like TwitterBot)',
  'Mozilla/5.0 (compatible; bingpreview/2.0)',
  'Some Spider 1.0',
  'Mozilla/5.0 (compatible; YandexCrawler)',
]) {
  ok(`UA 命中扫描器：${ua.slice(0, 32)}`, isBotHit(ua, sent, new Date(T0 + H)))
}
ok('空 UA 不单凭 UA 判机器（交给时间规则）', !isBotHit(null, sent, new Date(T0 + H)))
ok('事件封顶常量：OPEN 20 / CLICK 50', OPEN_EVENT_CAP === 20 && CLICK_EVENT_CAP === 50)
ok('像素是 43 字节的 GIF', TRANSPARENT_GIF.byteLength === 43 && Buffer.from(TRANSPARENT_GIF).subarray(0, 6).toString() === 'GIF89a')
ok('token 格式：32 位小写十六进制', MESSAGE_TOKEN_RE.test('0123456789abcdef0123456789abcdef') && !MESSAGE_TOKEN_RE.test('test') && !MESSAGE_TOKEN_RE.test('0123456789ABCDEF0123456789ABCDEF'))

console.log('\n追踪凭证 trackToken（审查 C5：点击/像素不再用退订 token）：')
const UUID = '3f2b8c1e-9a4d-4e6f-8b7a-1c2d3e4f5a6b'
ok('TRACK_TOKEN_RE 认 UUID', TRACK_TOKEN_RE.test(UUID))
eq('UUID 原样', normalizeTrackToken(UUID), UUID)
eq('大写 UUID 转小写', normalizeTrackToken(UUID.toUpperCase()), UUID)
eq('32 位十六进制的退订 token 不认', normalizeTrackToken('0123456789abcdef0123456789abcdef'), null)
eq('test 不认', normalizeTrackToken('test'), null)
eq('路径穿越乱码不认', normalizeTrackToken('../../etc/passwd'), null)
eq('多一位不认', normalizeTrackToken(UUID + '0'), null)
eq('去掉连字符不认', normalizeTrackToken(UUID.replace(/-/g, '')), null)
eq('非十六进制字符不认', normalizeTrackToken(UUID.replace('3f', 'zz')), null)
eq('空串不认', normalizeTrackToken(''), null)

console.log('\n点击跳转目标（只认库里存的 URL）：')
const O = 'https://bigolab.com'
eq('https 原样', safeRedirectTarget('https://bigolab.com/products/1?utm_medium=email&via=mail', O), 'https://bigolab.com/products/1?utm_medium=email&via=mail')
eq('http 原样', safeRedirectTarget('http://example.org/a', O), 'http://example.org/a')
eq('mailto 放行', safeRedirectTarget('mailto:hi@bigolab.com', O), 'mailto:hi@bigolab.com')
eq('站内相对路径补成绝对', safeRedirectTarget('/coupons', O), 'https://bigolab.com/coupons')
eq('javascript: 回首页', safeRedirectTarget('javascript:alert(1)', O), 'https://bigolab.com/')
eq('data: 回首页', safeRedirectTarget('data:text/html,hi', O), 'https://bigolab.com/')
eq('协议相对 //evil.com 回首页', safeRedirectTarget('//evil.com/x', O), 'https://bigolab.com/')
eq('空 → 首页', safeRedirectTarget('', O), 'https://bigolab.com/')
eq('null → 首页', safeRedirectTarget(null, O), 'https://bigolab.com/')
eq('乱码 → 首页', safeRedirectTarget('not a url', O), 'https://bigolab.com/')

/* ================================================================================================ */
console.log('\nUtcLastUpdateTime 解析（数字或字符串，单位秒）：')
eq('数字秒', parseUtcSeconds(1619601108), 1619601108)
eq('字符串秒', parseUtcSeconds('1619601108'), 1619601108)
eq('带空格的字符串', parseUtcSeconds(' 1619601108 '), 1619601108)
eq('毫秒兜住', parseUtcSeconds('1619601108123'), 1619601108)
eq('小数秒取整', parseUtcSeconds('1619601108.9'), 1619601108)
eq('ISO 字符串不认', parseUtcSeconds('2021-04-28T17:11Z'), null)
eq('空串不认', parseUtcSeconds(''), null)
eq('null 不认', parseUtcSeconds(null), null)
eq('负数不认', parseUtcSeconds(-5), null)
eq('NaN 不认', parseUtcSeconds(NaN), null)

console.log('\n回执行解析：')
const pr = parseDeliveryRow({
  Status: '4',
  ToAddress: ' Foo@QQ.com ',
  Subject: '(AD)小明，新品上架',
  UtcLastUpdateTime: '1619601108',
  ErrorClassification: 'SmtpNxBox',
  Message: '550 no such user',
  AccountName: 'Marketing@mail.bigolab.com',
})
eq('地址小写去空格', pr?.toAddress, 'foo@qq.com')
eq('Status 字符串转数字', pr?.status, 4)
eq('utc 秒', pr?.utcSec, 1619601108)
eq('发信地址小写', pr?.accountName, 'marketing@mail.bigolab.com')
eq('Status 数字', parseDeliveryRow({ Status: 0, ToAddress: 'a@b.cn', UtcLastUpdateTime: 1 * 1619601108 })?.status, 0)
eq('缺收件地址丢弃', parseDeliveryRow({ Status: 0 }), null)
eq('非对象丢弃', parseDeliveryRow('x'), null)
eq('Status 缺失 → null', parseDeliveryRow({ ToAddress: 'a@b.cn' })?.status, null)

console.log('\n投递状态与错误分类：')
eq('0 → DELIVERED', deliveryFromStatus(0), 'DELIVERED')
eq('2 → INVALID', deliveryFromStatus(2), 'INVALID')
eq('3 → SPAM', deliveryFromStatus(3), 'SPAM')
eq('4 → FAILED', deliveryFromStatus(4), 'FAILED')
eq('1（投递中）不认', deliveryFromStatus(1), null)
eq('null 不认', deliveryFromStatus(null), null)
for (const c of ['SmtpNxBox', 'SysOutRcptOnAccountLevelBounceList', 'SysOutInvRcpt', 'SysIncomingInvRcpt', 'SmtpZPermErr', 'SysOutDnsResolveFail']) {
  eq(`${c} → 硬退信`, classifyDeliveryError(c), 'hard_bounce')
}
eq('SysOutRecipientReportedSpam → 投诉', classifyDeliveryError('SysOutRecipientReportedSpam'), 'complaint')
eq('SysOutRecipientUnsubscribed → 退订', classifyDeliveryError('SysOutRecipientUnsubscribed'), 'unsubscribed')
for (const c of ['SmtpMfFreq', 'SmtpMfdFreq', 'SmtpIPFreq', 'SmtpRcptFreq', 'SmtpMfLimit']) {
  eq(`${c} → 频率类（域名退避）`, classifyDeliveryError(c), 'rate')
}
eq('SendOk → other', classifyDeliveryError('SendOk'), 'other')
eq('SysOutConnError → other（不抑制；连不上收件方仍按软退信算）', classifyDeliveryError('SysOutConnError'), 'other')
for (const c of SENDER_SIDE_CLASSES) {
  eq(`${c} → sender（我方问题：不抑制、不退避、不算软退信）`, classifyDeliveryError(c), 'sender')
}
eq('空 → other', classifyDeliveryError(''), 'other')
eq('打码地址识别', looksMasked('b***@example.net'), true)
eq('正常地址不算打码', looksMasked('bob@example.net'), false)
eq('toArray：数组', toArray([1, 2]), [1, 2])
eq('toArray：包了一层对象', toArray({ mailDetail: [1] }), [1])
eq('toArray：空', toArray(undefined), [])

console.log('\n软退信连击（审查 C19）：')
const FAIL = (cls: string) => ({ delivery: 'FAILED', deliveryDetail: `${cls} x` })
ok('连续 3 次连接失败 → 软退信', isSoftBounceStreak([FAIL('SysOutConnError'), FAIL('SysOutConnError'), FAIL('SysOutConnError')]))
ok('其中一次是 DKIM/DMARC 失败（我方问题）→ 不算', !isSoftBounceStreak([FAIL('SmtpDmaFail'), FAIL('SysOutConnError'), FAIL('SysOutConnError')]))
ok('其中一次是发信人被拉黑（SmtpMfBad）→ 不算', !isSoftBounceStreak([FAIL('SysOutConnError'), FAIL('SmtpMfBad'), FAIL('SysOutConnError')]))
ok('三次全是 SPF 失败 → 不算', !isSoftBounceStreak([FAIL('SmtpSpfFail'), FAIL('SmtpSpfFail'), FAIL('SmtpSpfFail')]))
ok('其中一次是频率类 → 不算', !isSoftBounceStreak([FAIL('SysOutConnError'), FAIL('SmtpMfFreq'), FAIL('SysOutConnError')]))
ok('只有 2 条 → 不算', !isSoftBounceStreak([FAIL('SysOutConnError'), FAIL('SysOutConnError')]))
ok('其中一次送达 → 不算', !isSoftBounceStreak([FAIL('SysOutConnError'), { delivery: 'DELIVERED', deliveryDetail: 'SendOk' }, FAIL('SysOutConnError')]))

/* ================================================================================================ */
console.log('\n回执匹配（邮箱 + 主题 + 时间）：')
const S = '(AD)小明，新品上架'
function row(email: string, subject: string, utcMs: number | null, status = 0, extra: Partial<DeliveryRow> = {}): DeliveryRow {
  return {
    toAddress: email,
    subject,
    utcSec: utcMs == null ? null : Math.floor(utcMs / 1000),
    status,
    errorClassification: '',
    message: '',
    accountName: 'marketing@mail.bigolab.com',
    ...extra,
  }
}
function msg(id: number, email: string, subject: string | null, claimedMs: number | null): MatchableMessage {
  return { id, email, subjectSent: subject, claimedAt: claimedMs == null ? null : new Date(claimedMs) }
}
{
  const m = matchDelivery([row('a@qq.com', S, T0 + 5_000)], [msg(1, 'a@qq.com', S, T0)])
  ok('同邮箱同主题、领取后 5 秒 → 匹配', m.get(1)?.utcSec === Math.floor((T0 + 5_000) / 1000))
}
eq('主题不同 → 不匹配', matchDelivery([row('a@qq.com', '(AD)别的', T0 + 5_000)], [msg(1, 'a@qq.com', S, T0)]).size, 0)
eq('邮箱不同 → 不匹配', matchDelivery([row('b@qq.com', S, T0 + 5_000)], [msg(1, 'a@qq.com', S, T0)]).size, 0)
eq('邮箱大小写不敏感', matchDelivery([row('a@qq.com', S, T0 + 5_000)], [msg(1, 'A@QQ.com', S, T0)]).size, 1)
eq('早于领取 59 秒（时钟误差）仍匹配', matchDelivery([row('a@qq.com', S, T0 - 59_000)], [msg(1, 'a@qq.com', S, T0)]).size, 1)
eq('早于领取 61 秒 → 是上一封的回执，不匹配', matchDelivery([row('a@qq.com', S, T0 - 61_000)], [msg(1, 'a@qq.com', S, T0)]).size, 0)
eq('utc 缺失的行不参与', matchDelivery([row('a@qq.com', S, null)], [msg(1, 'a@qq.com', S, T0)]).size, 0)
eq('没有 subjectSent 的消息不参与', matchDelivery([row('a@qq.com', S, T0 + 1000)], [msg(1, 'a@qq.com', null, T0)]).size, 0)
eq('没有 claimedAt 的消息不参与', matchDelivery([row('a@qq.com', S, T0 + 1000)], [msg(1, 'a@qq.com', S, null)]).size, 0)
eq(
  '别的发信地址的行（传了 sender 时）不参与',
  matchDelivery([row('a@qq.com', S, T0 + 1000, 0, { accountName: 'no-reply@mail.bigolab.com' })], [msg(1, 'a@qq.com', S, T0)], 'Marketing@mail.bigolab.com').size,
  0
)
eq(
  '行上没有发信地址时不据此排除',
  matchDelivery([row('a@qq.com', S, T0 + 1000, 0, { accountName: null })], [msg(1, 'a@qq.com', S, T0)], 'marketing@mail.bigolab.com').size,
  1
)
{
  const m = matchDelivery(
    [row('a@qq.com', S, T0 + 90_000, 4), row('a@qq.com', S, T0 + 30_000, 0)],
    [msg(1, 'a@qq.com', S, T0)]
  )
  eq('多条候选取最早（与返回顺序无关）', m.get(1)?.status, 0)
}
{
  // 两场主题相同的活动先后发给同一个人：A 在 T0，B 在 T0+2 天
  const rA = row('a@qq.com', S, T0 + 10_000, 0)
  const rB = row('a@qq.com', S, T0 + 2 * D + 10_000, 2)
  const m = matchDelivery([rB, rA], [msg(2, 'a@qq.com', S, T0 + 2 * D), msg(1, 'a@qq.com', S, T0)])
  ok('同主题两封：A 拿到自己的回执', m.get(1) === rA)
  ok('同主题两封：B 拿到更晚的那条，不会被 A 抢走', m.get(2) === rB)
}
{
  // B 的回执还没回来：A 只能配自己的，B 不会去拿 A 的
  const rA = row('a@qq.com', S, T0 + 10_000)
  const m = matchDelivery([rA], [msg(1, 'a@qq.com', S, T0), msg(2, 'a@qq.com', S, T0 + 2 * D)])
  ok('一条回执只配一封', m.get(1) === rA && !m.has(2))
}
{
  // 更早那封（A）的回执没拿到时，B 仍按自己的时间下限匹配，不会误拿「A 之前」的行
  const old = row('a@qq.com', S, T0 - D)
  const m = matchDelivery([old], [msg(2, 'a@qq.com', S, T0)])
  eq('更早的旧回执不配给新消息', m.size, 0)
}
{
  // 旧信自己的回执不在这批数据里（72 小时复查的失败信 / 根本没发出去的 UNKNOWN），
  // 它不能把后面那封同主题新信的回执抢走 —— 否则 UNKNOWN 被误判成「已发出」，新信反而没回执
  const rNew = row('a@qq.com', S, T0 + 2 * D + 10_000)
  const m = matchDelivery([rNew], [msg(1, 'a@qq.com', S, T0), msg(2, 'a@qq.com', S, T0 + 2 * D)])
  ok('旧信不抢新信的回执', m.get(2) === rNew && !m.has(1))
}
{
  // 旧信的回执很晚才更新（重试到新信发出之后），两封都要配对正确
  const rA = row('a@qq.com', S, T0 + 2 * D + H, 0)
  const rB = row('a@qq.com', S, T0 + 2 * D + 5_000, 0)
  const m = matchDelivery([rA, rB], [msg(1, 'a@qq.com', S, T0), msg(2, 'a@qq.com', S, T0 + 2 * D)])
  ok('旧信回执晚到：新信拿自己的、旧信拿晚到的那条', m.get(2) === rB && m.get(1) === rA)
}

console.log('\n回执匹配：锚点（审查 C17）：')
{
  // A 从没发出去（UNKNOWN，还在待查），B 同主题、一天后发给同一个人、已经有回执（不再待查）。
  // 下一趟 B 的那条回执又被别的窗口查回来：
  const rB = row('a@qq.com', S, T0 + D + 5_000)
  const bare = matchDelivery([rB], [msg(1, 'a@qq.com', S, T0)])
  ok('（对照）候选里只有待查的 A：A 抢走了 B 的回执 —— 这就是要修的问题', bare.get(1) === rB)
  const anchored = matchDelivery([rB], [msg(1, 'a@qq.com', S, T0), msg(2, 'a@qq.com', S, T0 + D)])
  ok('带上锚点 B：回执归 B，A 配不上（UNKNOWN 不会被误判成已发出）', anchored.get(2) === rB && !anchored.has(1))
  const rA = row('a@qq.com', S, T0 + 5_000)
  const both = matchDelivery([rB, rA], [msg(1, 'a@qq.com', S, T0), msg(2, 'a@qq.com', S, T0 + D)])
  ok('A 自己的回执在时照样配给 A', both.get(1) === rA && both.get(2) === rB)
}

console.log('\n回执匹配：发信地址（审查 C15）：')
{
  const OLD = 'marketing@mail.bigolab.com'
  const NEW = 'marketing@edm.bigolab.com'
  const rOld = row('a@qq.com', S, T0 + 5_000, 0, { accountName: OLD })
  eq('已知地址集合（新+旧）：旧地址的回执照样匹配', matchDelivery([rOld], [msg(1, 'a@qq.com', S, T0)], [NEW, OLD]).size, 1)
  eq('（对照）只认当前地址：旧地址的回执被丢掉', matchDelivery([rOld], [msg(1, 'a@qq.com', S, T0)], NEW).size, 0)
  eq(
    '不在已知集合里的地址（交易邮件 no-reply@）不参与',
    matchDelivery([row('a@qq.com', S, T0 + 5_000, 0, { accountName: 'no-reply@mail.bigolab.com' })], [msg(1, 'a@qq.com', S, T0)], new Set([NEW, OLD])).size,
    0
  )
  eq('地址大小写不敏感', matchDelivery([row('a@qq.com', S, T0 + 5_000, 0, { accountName: OLD })], [msg(1, 'a@qq.com', S, T0)], ['Marketing@MAIL.bigolab.com']).size, 1)
  // 旧地址发的 A、新地址发的 B（后发）；一条旧地址的回执晚到：不能记到 B 头上，要往前找旧地址的 A
  const mOld: MatchableMessage = { ...msg(1, 'a@qq.com', S, T0), sender: OLD }
  const mNew: MatchableMessage = { ...msg(2, 'a@qq.com', S, T0 + H), sender: NEW }
  const late = row('a@qq.com', S, T0 + 2 * H, 0, { accountName: OLD })
  const m1 = matchDelivery([late], [mOld, mNew], [OLD, NEW])
  ok('发信地址不同的信不抢回执（往前找同地址的那封）', m1.get(1) === late && !m1.has(2))
  const m2 = matchDelivery([row('a@qq.com', S, T0 + 2 * H, 0, { accountName: NEW })], [mOld, mNew], [OLD, NEW])
  ok('同地址的最近一封照常拿到', m2.has(2) && !m2.has(1))
  const m3 = matchDelivery([row('a@qq.com', S, T0 + 2 * H, 0, { accountName: null })], [mOld, mNew], [OLD, NEW])
  ok('行上没有发信地址 → 不据此排除（按时间给最近那封）', m3.has(2))
}

console.log('\n回执窗口完整性（正对照，审查 C14）：')
{
  const NOWC = T0 + 10 * D
  // 一封孤零零的 UNKNOWN（领取于 T），邻居早都有回执、不在待查里：它自己一个窗口，核心范围只有一个时刻
  const T = T0 + 5 * D
  const w = { start: T - 2 * H, end: T + 2 * H, coreStart: T }
  const acc: AcceptedSend[] = Array.from({ length: 40 }, (_, i) => ({ at: T - H + i * 60_000, key: deliveryKey(`u${i}@qq.com`, S) }))
  const all = acc.map((_, i) => ({ toAddress: `u${i}@qq.com`, subject: S }))
  const c1 = windowCompleteness(w, acc, all, NOWC)
  ok('受理的 40 封都查得到 → 可信', c1.trusted && c1.accepted === 40 && c1.matched === 40, JSON.stringify(c1))
  // 告警只看「之前见过回执」的对照（known）：见过的这次不在 = 数据真被截断
  const accK: AcceptedSend[] = acc.map((a) => ({ ...a, known: true }))
  const c2 = windowCompleteness(w, accK, [], NOWC)
  ok('空页（见过回执的 40 封一封都没返回）→ 不可信、告警', !c2.trusted && c2.alarm, JSON.stringify(c2))
  eq('对照数是整个窗口的受理数（旧检查在这里是 0，恒通过）', c2.accepted, 40)
  const c3 = windowCompleteness(w, accK, all.slice(0, 39).concat([{ toAddress: 'x@y.cn', subject: S }]), NOWC)
  ok('40 封缺 1 封（97.5%）→ 仍可信', c3.trusted, JSON.stringify(c3))
  const c4 = windowCompleteness(w, accK, all.slice(0, 35), NOWC)
  ok('缺 5 封（87.5%）→ 不可信、但不告警（零星晚到不让整个同步算失败）', !c4.trusted && !c4.alarm, JSON.stringify(c4))
  const c5 = windowCompleteness(w, accK, all.slice(0, 10), NOWC)
  ok('见过回执的只查到 1/4 → 告警', !c5.trusted && c5.alarm)
  // 代码审查 C14 复核：阿里云记录晚到（20~30 分钟）时，还没出过回执的新信本来就查不到 ——
  // 不可信（不判 NOT_FOUND）但**不告警**，否则每趟记错、lastOkAt 冻住，一小时后急停全部营销
  const cLag = windowCompleteness(w, acc, [], NOWC)
  ok('没见过回执的 40 封全查不到（阿里云晚到）→ 不可信、不告警', !cLag.trusted && !cLag.alarm && cLag.knownAccepted === 0, JSON.stringify(cLag))
  const mixed: AcceptedSend[] = acc.map((a, i) => ({ ...a, known: i < 20 }))
  const cMix = windowCompleteness(w, mixed, all.slice(0, 20), NOWC)
  ok('见过回执的 20 封都在、新的 20 封还没出记录 → 不可信、不告警', !cMix.trusted && !cMix.alarm && cMix.knownMatched === 20, JSON.stringify(cMix))
  const cFew = windowCompleteness(w, acc.map((a, i) => ({ ...a, known: i < 3 })), [], NOWC)
  ok('见过回执的对照不足 5 封 → 样本太少不告警', !cFew.alarm, JSON.stringify(cFew))
  const others = acc.map((_, i) => ({ toAddress: `z${i}@qq.com`, subject: S }))
  ok('条数够、但都是别人的信 → 不可信', !windowCompleteness(w, acc, others, NOWC).trusted)
  const subj = acc.map((_, i) => ({ toAddress: `u${i}@qq.com`, subject: '(AD)别的主题' }))
  ok('地址对、主题对不上 → 不可信', !windowCompleteness(w, acc, subj, NOWC).trusted)
  // 刚发出去的信阿里云可能还没有记录：不拿来当对照，否则每批刚发完都会误报
  const wr = { start: NOWC - 2 * H, end: NOWC + 2 * H, coreStart: NOWC - 60_000 }
  const recent = [{ at: NOWC - 60_000, key: deliveryKey('r@qq.com', S) }]
  const c6 = windowCompleteness(wr, recent, [], NOWC)
  ok('领取 1 分钟的信不算对照 → 不告警', c6.accepted === 0 && !c6.alarm && c6.trusted, JSON.stringify(c6))
  const older = [{ at: NOWC - 20 * 60_000, key: deliveryKey('r@qq.com', S) }]
  ok('领取 20 分钟还查不到 → 计入对照、不可信', !windowCompleteness(wr, older, [], NOWC).trusted)
  // 贴着窗口边缘的：UtcLastUpdateTime 晚于领取时间，可能被切到窗口外，不计入
  eq('贴窗口起点 1 分钟的信不计入对照', windowCompleteness(w, [{ at: T - 2 * H + 60_000, key: 'k' }], [], NOWC).accepted, 0)
  eq('离起点 11 分钟的信计入对照', windowCompleteness(w, [{ at: T - 2 * H + 11 * 60_000, key: 'k' }], [], NOWC).accepted, 1)
  const dup = acc.concat(acc).sort((a, b) => a.at - b.at)
  ok('返回条数少于受理数 → 不可信（即使键碰巧都在）', !windowCompleteness(w, dup, all, NOWC).trusted)
}

console.log('\n回执查询窗口切分：')
{
  const w = planDeliveryWindows([{ id: 1, at: T0 }], [T0], { padMs: 2 * H, minPadMs: 10 * 60_000, maxRows: 2200 })
  eq('单封：一个窗口，前后各放宽 2 小时', w.map((x) => [x.start, x.end, x.ids]), [[T0 - 2 * H, T0 + 2 * H, [1]]])
}
{
  const w = planDeliveryWindows(
    [{ id: 1, at: T0 }, { id: 2, at: T0 + 30 * 60_000 }, { id: 3, at: T0 + 2 * D }],
    [T0, T0 + 30 * 60_000, T0 + 2 * D],
    { padMs: 2 * H, minPadMs: 10 * 60_000, maxRows: 2200 }
  )
  eq('稀疏时两天前后自然合并成一个窗口（条数没超）', w.length, 1)
}
{
  // 72 小时里每天发 2000 封（一个 35 分钟的突发），外加一封三天前的失败待复查
  const sends: number[] = []
  for (let day = 0; day < 3; day++) for (let i = 0; i < 2000; i++) sends.push(T0 + day * D + i * 1000)
  const pending = [{ id: 1, at: T0 + 100 * 1000 }, { id: 2, at: T0 + 2 * D + 1500 * 1000 }, { id: 3, at: T0 + 2 * D + 1999 * 1000 }]
  const w = planDeliveryWindows(pending, sends, { padMs: 2 * H, minPadMs: 10 * 60_000, maxRows: 2200 })
  ok('老的失败信与新发的信分成两个窗口（不会把三天全塞进一个）', w.length === 2, JSON.stringify(w.map((x) => x.ids)))
  ok('每个窗口的预计条数不超过上限', w.every((x) => x.estRows <= 2200), JSON.stringify(w.map((x) => x.estRows)))
  ok('新发的两封在同一个窗口', w.some((x) => x.ids.length === 2 && x.ids.includes(2) && x.ids.includes(3)))
}
{
  // 1 小时内发了 5000 封：放宽 2 小时的窗口必然超上限 → 缩小放宽量
  const sends: number[] = []
  for (let i = 0; i < 5000; i++) sends.push(T0 + i * 700)
  const w = planDeliveryWindows([{ id: 9, at: T0 + 1750 * 1000 }], sends, { padMs: 2 * H, minPadMs: 10 * 60_000, maxRows: 2200 })
  ok('太密时缩小放宽量，窗口条数回到上限以内', w.length === 1 && w[0].estRows <= 2200 && w[0].end - w[0].start < 4 * H, JSON.stringify(w))
  ok('放宽量不低于 10 分钟', w[0].end - w[0].start >= 20 * 60_000)
}
eq('没有待查消息 → 没有窗口', planDeliveryWindows([], [T0], { padMs: 2 * H, minPadMs: 600_000, maxRows: 10 }), [])
{
  const ws = [0, 1, 2, 3].map((i) => ({ start: T0 + i * D, end: T0 + i * D + H, ids: [i], coreStart: 0, coreEnd: 0, estRows: 0 }))
  const a = orderWindows(ws, new Date(0))
  const b = orderWindows(ws, new Date(300_000))
  ok('最新的窗口永远第一个', a[0].ids[0] === 3 && b[0].ids[0] === 3)
  ok('其余窗口随时钟轮转', a[1].ids[0] !== b[1].ids[0])
  ok('轮转不丢窗口', a.length === 4 && new Set(b.map((x) => x.ids[0])).size === 4)
}

/* ================================================================================================ */
console.log('\n末次点击归因：')
function click(userId: number, campaignId: number, messageId: number, atMs: number): ClickPoint {
  return { userId, campaignId, messageId, at: new Date(atMs) }
}
function order(id: number, userId: number, paidMs: number): OrderLite {
  return { id, userId, paidAt: new Date(paidMs) }
}
{
  const a = attributeOrders([click(1, 10, 100, T0)], [order(1, 1, T0 + 2 * D)], 5)
  eq('点击后 2 天付款 → 记给该活动', a.map((x) => [x.orderId, x.campaignId]), [[1, 10]])
}
eq('点击后 5 天整 → 仍在窗口内', attributeOrders([click(1, 10, 100, T0)], [order(1, 1, T0 + 5 * D)], 5).length, 1)
eq('点击后 5 天零 1 秒 → 超窗', attributeOrders([click(1, 10, 100, T0)], [order(1, 1, T0 + 5 * D + 1000)], 5).length, 0)
eq('付款在点击之前 → 不归因', attributeOrders([click(1, 10, 100, T0)], [order(1, 1, T0 - 1000)], 5).length, 0)
eq('别人的点击不归因', attributeOrders([click(2, 10, 100, T0)], [order(1, 1, T0 + H)], 5).length, 0)
{
  const a = attributeOrders([click(1, 10, 100, T0), click(1, 20, 200, T0 + D)], [order(1, 1, T0 + 2 * D)], 5)
  eq('跨活动取末次点击：A 先点、B 后点 → 记给 B', a.map((x) => x.campaignId), [20])
}
{
  // 最近那次点击超窗了，不能退回去找更早的（更早的只会更远）
  const a = attributeOrders([click(1, 10, 100, T0), click(1, 20, 200, T0 + D)], [order(1, 1, T0 + 7 * D)], 5)
  eq('最近的点击超窗 → 不归因，也不回退', a.length, 0)
}
{
  const a = attributeOrders([click(1, 10, 100, T0 + D), click(1, 20, 200, T0 + 3 * D)], [order(1, 1, T0 + 2 * D)], 5)
  eq('付款之后的点击不算', a.map((x) => x.campaignId), [10])
}
{
  const a = attributeOrders([click(1, 20, 200, T0), click(1, 10, 100, T0)], [order(1, 1, T0 + H)], 5)
  eq('同一时刻两次点击 → 取 messageId 大的（确定性）', a.map((x) => x.messageId), [200])
}
{
  const a = attributeOrders([click(1, 10, 100, T0)], [order(1, 1, T0 + H), order(2, 1, T0 + 2 * H)], 5)
  eq('一次点击后的多笔订单都记给它', a.map((x) => x.orderId).sort(), [1, 2])
}
eq('点击时间非法的点被忽略', attributeOrders([{ userId: 1, campaignId: 1, messageId: 1, at: new Date(NaN) }], [order(1, 1, T0)], 5).length, 0)

console.log('\n「影响」口径（已送达、未点击、送达后 N 天内付款、没被点击归因走）：')
eq('送达后 1 天付款 → 算影响', influencedOrders([{ userId: 1, at: new Date(T0) }], [order(1, 1, T0 + D)], 5, new Set()), [1])
eq('送达前付款 → 不算', influencedOrders([{ userId: 1, at: new Date(T0) }], [order(1, 1, T0 - 1)], 5, new Set()), [])
eq('超 5 天 → 不算', influencedOrders([{ userId: 1, at: new Date(T0) }], [order(1, 1, T0 + 6 * D)], 5, new Set()), [])
eq('已被点击归因的订单不重复算', influencedOrders([{ userId: 1, at: new Date(T0) }], [order(1, 1, T0 + D)], 5, new Set([1])), [])
eq(
  '收到多封也只算一次',
  influencedOrders([{ userId: 1, at: new Date(T0) }, { userId: 1, at: new Date(T0 + H) }], [order(1, 1, T0 + D)], 5, new Set()),
  [1]
)

console.log('\n比率与 CSV：')
eq('比率保留 4 位', ratio(1, 3), 0.3333)
eq('分母 0 → null', ratio(5, 0), null)
eq('普通单元格原样', csvCell('abc@qq.com'), 'abc@qq.com')
eq('含逗号加引号', csvCell('a,b'), '"a,b"')
eq('含引号转义', csvCell('a"b'), '"a""b"')
eq('含换行加引号', csvCell('a\nb'), '"a\nb"')
eq('= 开头防公式注入', csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"')
eq('+ 开头防公式注入', csvCell('+1'), "'+1")
eq('- 开头防公式注入', csvCell('-1'), "'-1")
eq('@ 开头防公式注入', csvCell('@SUM(A1)'), "'@SUM(A1)")
eq('null → 空', csvCell(null), '')
eq('数字转字符串', csvCell(12), '12')

/* ================================================================================================ */
console.log('\n退订页权限（增加来信只在 30 天内）：')
const NOW = new Date(T0)
const base: ConsentView = { status: 'DEFAULT', topicsOff: [], pausedUntil: null }
ok('退订永远不算增加', !prefsActionIncreases({ action: 'unsubscribe' }, base, NOW))
ok('暂停永远不算增加（暂停只延长不缩短）', !prefsActionIncreases({ action: 'pause', days: 30 }, { ...base, pausedUntil: new Date(T0 + 60 * D) }, NOW))
ok('已退订的人恢复订阅 → 增加', prefsActionIncreases({ action: 'resubscribe' }, { ...base, status: 'UNSUBSCRIBED' }, NOW))
ok('没退订的人点恢复 → 空操作，不算增加', !prefsActionIncreases({ action: 'resubscribe' }, base, NOW))
ok('关掉一个主题 → 不算增加', !prefsActionIncreases({ action: 'topics', topicsOff: ['PROMO'] }, base, NOW))
ok('重新打开关着的主题 → 增加', prefsActionIncreases({ action: 'topics', topicsOff: [] }, { ...base, topicsOff: ['PROMO'] }, NOW))
ok('开一个关一个 → 算增加（有打开的动作）', prefsActionIncreases({ action: 'topics', topicsOff: ['NEWS'] }, { ...base, topicsOff: ['PROMO'] }, NOW))
ok('暂停中点恢复 → 增加', prefsActionIncreases({ action: 'resume' }, { ...base, pausedUntil: new Date(T0 + D) }, NOW))
ok('暂停已过期点恢复 → 空操作，不算增加', !prefsActionIncreases({ action: 'resume' }, { ...base, pausedUntil: new Date(T0 - D) }, NOW))
ok('发送 29 天 → 可以增加', canIncreaseBy(new Date(T0 - 29 * D), NOW))
ok('发送 30 天整 → 可以增加', canIncreaseBy(new Date(T0 - 30 * D), NOW))
ok('发送 31 天 → 不可以', !canIncreaseBy(new Date(T0 - 31 * D), NOW))
ok('没有发送时间 → 不可以', !canIncreaseBy(null, NOW))

/* ================================================================================================
 * 数据库集成（--db）
 * ================================================================================================ */

type Prisma = (typeof import('../src/lib/db'))['prisma']

/** 临时改几个运行时设置（null = 删掉），fn 跑完原样恢复。别的测试可能同时在用这个库，所以改动窗口尽量短 */
async function withSettings<T>(prisma: Prisma, values: Record<string, string | null>, fn: () => Promise<T>): Promise<T> {
  const keys = Object.keys(values)
  const saved = await prisma.setting.findMany({ where: { key: { in: keys } } })
  try {
    for (const [k, v] of Object.entries(values)) {
      await prisma.setting.deleteMany({ where: { key: k } })
      if (v != null) await prisma.setting.create({ data: { key: k, value: v } })
    }
    return await fn()
  } finally {
    await prisma.setting.deleteMany({ where: { key: { in: keys } } })
    for (const x of saved) await prisma.setting.create({ data: { key: x.key, value: x.value } })
  }
}

/** 临时改环境变量（undefined = 删掉），fn 跑完恢复。marketingSender / isDryRun 每次调用都现读 env */
async function withEnv<T>(vars: Record<string, string | undefined>, fn: () => Promise<T>): Promise<T> {
  const saved: Record<string, string | undefined> = {}
  for (const k of Object.keys(vars)) saved[k] = process.env[k]
  const put = (k: string, v: string | undefined) => {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  try {
    for (const [k, v] of Object.entries(vars)) put(k, v)
    return await fn()
  } finally {
    for (const [k, v] of Object.entries(saved)) put(k, v)
  }
}

/** 「为什么还没发」测试用的发送设置：全天可发、试探 10 封、额度充足、不预热 */
async function waitingConfig(over: Record<string, unknown> = {}): Promise<string> {
  const { DEFAULT_CONFIG } = await import('../src/lib/marketing/types')
  return JSON.stringify({
    ...DEFAULT_CONFIG,
    enabled: true,
    contactEmail: 'hi@bigolab.com',
    sendWindow: { start: 0, end: 24 },
    canarySize: 10,
    warmup: { enabled: false, schedule: [50] },
    dailyCap: 100000,
    maxQuotaShare: 0.9,
    ...over,
  })
}
function freshAccount(): string {
  return JSON.stringify({ dailyQuota: 100000, monthQuota: null, quotaLevel: 1, maxQuotaLevel: null, userStatus: 0, ipChannelType: null, remainFreeQuota: null, fetchedAt: new Date().toISOString() })
}

/** 一个发送中的活动：今天已发 sent 封（领取/发送于 sentAtMs）+ 3 封 CLAIMED 待发（CLAIMED 不会被并发跑的 worker 选走） */
async function mkWaitingCampaign(prisma: Prisma, tag: string, sent: number, sentAtMs: number) {
  const c = await prisma.marketingCampaign.create({
    data: { name: `${tag}-wait`, subject: 'w', doc: '{}', audience: '{}', status: 'SENDING', startedAt: new Date(sentAtMs) },
  })
  await addSent(prisma, tag, c.id, sent, sentAtMs, 0)
  await prisma.marketingMessage.createMany({
    data: Array.from({ length: 3 }, (_, i) => ({
      campaignId: c.id,
      email: `${tag}-q${i}@mkt-itest.dev`,
      domain: 'mkt-itest.dev',
      token: randomBytes(16).toString('hex'),
      status: 'CLAIMED',
      claimedAt: new Date(),
    })),
  })
  return c
}
async function addSent(prisma: Prisma, tag: string, campaignId: number, n: number, atMs: number, offset: number) {
  if (n <= 0) return
  await prisma.marketingMessage.createMany({
    data: Array.from({ length: n }, (_, i) => ({
      campaignId,
      email: `${tag}-w${offset + i}@mkt-itest.dev`,
      domain: 'mkt-itest.dev',
      token: randomBytes(16).toString('hex'),
      status: 'SENT',
      claimedAt: new Date(atMs),
      sentAt: new Date(atMs),
      subjectSent: '(AD)w',
    })),
  })
}

async function dbSuite() {
  const url = process.env.DATABASE_URL || ''
  const dbName = url.split('/').pop()?.split('?')[0] || ''
  if (!/dev|test/i.test(dbName)) {
    console.error(`拒绝执行：数据库「${dbName}」看起来不是一次性测试库（库名须含 dev 或 test）`)
    process.exit(2)
  }
  const { prisma } = await import('../src/lib/db')
  const tracking = await import('../src/lib/marketing/tracking')
  const prefs = await import('../src/lib/marketing/prefs')
  const stats = await import('../src/lib/marketing/stats')
  const sync = await import('../src/lib/marketing/sync')

  const TAG = `imktpub${Date.now().toString(36)}`
  const now = Date.now()
  const created = { userIds: [] as number[], campaignIds: [] as number[], orderIds: [] as number[], productId: 0, categoryId: 0 }

  try {
    console.log('\n[db] 准备数据')
    const cat = await prisma.category.create({ data: { name: `${TAG}-cat` } })
    created.categoryId = cat.id
    const product = await prisma.product.create({
      data: { categoryId: cat.id, name: `${TAG}-p`, price: '88.00', stock: -1, deliveryType: 'MANUAL' },
    })
    created.productId = product.id
    const user = await prisma.user.create({ data: { email: `${TAG}@mkt-itest.dev`, passwordHash: 'x', nickname: `${TAG}` } })
    created.userIds.push(user.id)
    const campaign = await prisma.marketingCampaign.create({
      data: { name: `${TAG}-c`, subject: '新品上架', doc: '{}', audience: '{"type":"ALL","excludeInactive":true}', status: 'COMPLETED' },
    })
    created.campaignIds.push(campaign.id)
    await prisma.marketingLink.create({
      data: { campaignId: campaign.id, idx: 0, url: 'https://bigolab.com/products/1?utm_medium=email&via=mail', label: '看看' },
    })
    const token = randomBytes(16).toString('hex')
    const sentAt = new Date(now - H)
    const message = await prisma.marketingMessage.create({
      data: {
        campaignId: campaign.id,
        userId: user.id,
        email: user.email as string,
        domain: 'mkt-itest.dev',
        token,
        status: 'SENT',
        claimedAt: sentAt,
        sentAt,
        subjectSent: '(AD)新品上架',
      },
    })
    const reload = () => prisma.marketingMessage.findUniqueOrThrow({ where: { id: message.id } })
    // 审查 C5：建行时没给 trackToken，Prisma 自动生成 UUID
    const track = message.trackToken
    ok('trackToken 自动生成（UUID）且与退订 token 不同', normalizeTrackToken(track) === track && track !== token, track)

    console.log('[db] 打开像素')
    await tracking.recordOpen(track, CHROME)
    await tracking.recordOpen(track, CHROME)
    let m = await reload()
    ok('打开两次：openCount=2、openedAt 已写', m.openCount === 2 && !!m.openedAt)
    ok('10 分钟内只记一条 OPEN 事件', (await prisma.marketingEvent.count({ where: { messageId: message.id, type: 'OPEN' } })) === 1)
    await tracking.recordOpen(token, CHROME)
    ok('用退订 token 打像素 → 不记录（审查 C5）', (await reload()).openCount === 2)
    await tracking.recordOpen(track.toUpperCase(), CHROME)
    ok('trackToken 大写也认', (await reload()).openCount === 3)
    await tracking.recordOpen('0'.repeat(32), CHROME)
    await tracking.recordOpen('00000000-0000-4000-8000-000000000000', CHROME)
    await tracking.recordOpen('not-a-token', CHROME)
    ok('无效 token 静默忽略', (await reload()).openCount === 3)

    console.log('[db] 点击跳转')
    const target = await tracking.resolveClick(track, 0, CHROME)
    eq('跳到库里存的 URL', target, 'https://bigolab.com/products/1?utm_medium=email&via=mail')
    m = await reload()
    ok('有效点击：clickCount=1、clickedAt=lastClickAt', m.clickCount === 1 && !!m.clickedAt && m.lastClickAt?.getTime() === m.clickedAt?.getTime())
    const viaOldToken = await tracking.resolveClick(token, 0, CHROME)
    ok('用退订 token 点链接 → 回首页（审查 C5）', viaOldToken !== target && viaOldToken.endsWith('/'), viaOldToken)
    ok('用退订 token 点链接：点击数不变', (await reload()).clickCount === 1)
    ok('用退订 token 探测（HEAD）→ 首页', (await tracking.peekClickTarget(token, 0)) !== target)
    const botTarget = await tracking.resolveClick(track, 0, 'curl/8.4.0')
    eq('机器点击照样跳转', botTarget, target)
    m = await reload()
    ok('机器点击不计数', m.clickCount === 1)
    ok('机器点击记一条 bot 事件', (await prisma.marketingEvent.count({ where: { messageId: message.id, type: 'CLICK', bot: true } })) === 1)
    ok('链接点击数 +1（只算有效点击）', (await prisma.marketingLink.findFirst({ where: { campaignId: campaign.id, idx: 0 } }))?.clicks === 1)
    ok('不存在的 idx → 首页', (await tracking.resolveClick(track, 7, CHROME)).endsWith('/'))
    ok('无效 token → 首页', (await tracking.resolveClick('f'.repeat(32), 0, CHROME)).endsWith('/'))
    ok('HEAD 只解析不记录', (await tracking.peekClickTarget(track, 0)) === target && (await reload()).clickCount === 1)

    console.log('[db] 退订页')
    const st0 = await prefs.getPrefsByToken(token)
    ok('GET 状态：默认、可增加、邮箱打码', st0?.status === 'DEFAULT' && st0.canIncrease === true && st0.emailMasked.includes('***'))
    eq('无效 token → null', await prefs.getPrefsByToken('a'.repeat(32)), null)
    eq('trackToken 不是偏好页凭证 → null（审查 C5：分享出去的商品链接改不了订阅）', await prefs.getPrefsByToken(track), null)
    ok('trackToken 也不能一键退订', (await prefs.oneClickUnsubscribe(track, { ip: '127.0.0.1', ua: CHROME })) === false)
    const logsBefore = await prisma.marketingConsentLog.count({ where: { userId: user.id } })
    await prefs.getPrefsByToken(token)
    ok('GET 不改状态、不写留痕', (await prisma.marketingConsentLog.count({ where: { userId: user.id } })) === logsBefore)

    const meta = { ip: '127.0.0.1', ua: CHROME }
    const r1 = await prefs.applyPrefsByToken(token, { action: 'topics', topicsOff: ['PROMO'] }, meta)
    ok('关掉「优惠活动」', r1.ok && r1.state.topicsOff.join() === 'PROMO')
    const r2 = await prefs.applyPrefsByToken(token, { action: 'unsubscribe' }, meta)
    ok('退订', r2.ok && r2.state.status === 'UNSUBSCRIBED')
    m = await reload()
    ok('这封信记下 unsubscribedAt', !!m.unsubscribedAt)
    ok('UNSUB 事件一条', (await prisma.marketingEvent.count({ where: { messageId: message.id, type: 'UNSUB' } })) === 1)
    ok('一键退订幂等', (await prefs.oneClickUnsubscribe(token, meta)) === true)
    ok('重复退订不加事件', (await prisma.marketingEvent.count({ where: { messageId: message.id, type: 'UNSUB' } })) === 1)
    ok('一键退订：无效 token 返回 false', (await prefs.oneClickUnsubscribe('b'.repeat(32), meta)) === false)
    ok('一键退订：test 空转', (await prefs.oneClickUnsubscribe('test', meta)) === true)

    // 30 天外的旧信：只能减少来信
    await prisma.marketingMessage.update({ where: { id: message.id }, data: { sentAt: new Date(now - 40 * D) } })
    const r3 = await prefs.applyPrefsByToken(token, { action: 'resubscribe' }, meta)
    ok('40 天前的信不能恢复订阅 → 403', !r3.ok && r3.status === 403)
    const r4 = await prefs.applyPrefsByToken(token, { action: 'topics', topicsOff: [] }, meta)
    ok('40 天前的信不能重新打开主题 → 403', !r4.ok && r4.status === 403)
    const r5 = await prefs.applyPrefsByToken(token, { action: 'pause', days: 30 }, meta)
    ok('40 天前的信仍可暂停（减少来信）', r5.ok)
    ok('GET 显示 canIncrease=false', (await prefs.getPrefsByToken(token))?.canIncrease === false)

    // 每 token 每天 10 次变更
    await prisma.marketingMessage.update({ where: { id: message.id }, data: { sentAt: new Date(now - H) } })
    const r6 = await prefs.applyPrefsByToken(token, { action: 'resubscribe' }, meta)
    ok('30 天内可以恢复订阅（回到默认，不是明确订阅）', r6.ok && r6.state.status === 'DEFAULT')
    let blocked: { ok: boolean; status?: number } | null = null
    for (let i = 0; i < 12; i++) {
      const r = await prefs.applyPrefsByToken(token, { action: 'topics', topicsOff: i % 2 ? [] : ['NEWS'] }, meta)
      if (!r.ok) {
        blocked = { ok: false, status: r.status }
        break
      }
    }
    ok('同一 token 当天超过 10 次变更 → 429', blocked?.status === 429, JSON.stringify(blocked))
    const r7 = await prefs.applyPrefsByToken(token, { action: 'unsubscribe' }, meta)
    ok('超限后退订仍然可用（法定义务）', r7.ok && r7.state.status === 'UNSUBSCRIBED')

    const demo = await prefs.applyPrefsByToken('test', { action: 'unsubscribe' }, meta)
    ok('test token：演示状态、带 test 标记', demo.ok && demo.state.test === true && demo.state.status === 'UNSUBSCRIBED')

    console.log('[db] 个人中心')
    const acct = await prefs.applyAccountMarketing(user.id, { action: 'subscribe' }, meta)
    ok('本人可以直接确认订阅（包括从已退订恢复）', acct.status === 'SUBSCRIBED' && acct.email === user.email)
    const acct2 = await prefs.applyAccountMarketing(user.id, { action: 'pause', days: 30 }, meta)
    ok('暂停 30 天', !!acct2.pausedUntil && acct2.status === 'SUBSCRIBED')
    const acct3 = await prefs.applyAccountMarketing(user.id, { action: 'resume' }, meta)
    ok('恢复', acct3.pausedUntil === null)

    console.log('[db] 报表与归因')
    const clicked = (await reload()).clickedAt as Date
    const o = await prisma.order.create({
      data: {
        orderNo: `${TAG}-1`.slice(0, 32),
        userId: user.id,
        productId: product.id,
        productName: product.name,
        productPrice: '88.00',
        amount: '88.00',
        payStatus: 'PAID',
        deliveryStatus: 'DELIVERED',
        paidAt: new Date(clicked.getTime() + H),
      },
    })
    created.orderIds.push(o.id)
    const rep = await stats.campaignReport(campaign.id)
    ok('报表：归因 1 单、货款 88.00', rep?.funnel.orders === 1 && rep.funnel.revenue === '88.00', JSON.stringify(rep?.funnel))
    ok('报表：唯一点击 1、机器点击 1、退订 1', rep?.funnel.uniqueClicks === 1 && rep.funnel.botClicks === 1 && rep.funnel.unsubscribes === 1)
    ok('报表：订单列表带订单号', rep?.orders[0]?.orderNo === o.orderNo)
    ok('报表：已完成活动没有等待原因', rep?.waiting.code === 'none')
    ok('报表：链接排行', rep?.links[0]?.clicks === 1)
    const list = await stats.listCampaigns({ page: 1, pageSize: 20, keyword: TAG })
    ok('活动列表：同一口径的订单与货款', list.total === 1 && list.list[0].orders === 1 && list.list[0].revenue === '88.00' && list.list[0].counts.sent === 1)
    const noOrder = await stats.listMessages(campaign.id, { page: 1, pageSize: 20, filter: 'clicked_no_order' })
    ok('「点了没买」：买了的人不在里面', noOrder.total === 0)
    const all = await stats.listMessages(campaign.id, { page: 1, pageSize: 20, keyword: TAG })
    ok('收件人明细按邮箱搜索', all.total === 1 && all.list[0].nickname === TAG)
    const csv = await stats.messagesCsv(campaign.id, {})
    ok('CSV：UTF-8 BOM + 中文表头 + 1 行数据', csv.startsWith('﻿邮箱,') && csv.trim().split('\r\n').length === 2)
    const subs = await stats.listSubscribers({ page: 1, pageSize: 20, keyword: TAG })
    ok('订阅列表：找到这个用户、发送数 1', subs.total === 1 && subs.list[0].status === 'SUBSCRIBED' && subs.list[0].sentCount === 1)
    const subsS = await stats.listSubscribers({ page: 1, pageSize: 20, keyword: TAG, status: 'UNSUBSCRIBED' })
    ok('订阅列表：按状态筛选', subsS.total === 0)
    const ss = await stats.subscriberStats()
    ok('订阅统计：数字合理', ss.totalUsers >= 1 && ss.byStatus.SUBSCRIBED >= 1 && ss.eligibleNow >= 0)
    const sup = await stats.listSuppressions({ page: 1, pageSize: 5 })
    ok('抑制名单查询可用', Array.isArray(sup.list))
    const sum = await stats.userMarketingSummary(user.id)
    ok('用户营销记录：1 封信、有留痕', sum?.messages.length === 1 && (sum?.logs.length || 0) >= 3 && sum?.status === 'SUBSCRIBED')

    console.log('[db] 公开路由（直接调用 route handler）')
    {
      const { NextRequest } = await import('next/server')
      const unsubRoute = await import('../src/app/api/mkt/unsubscribe/[token]/route')
      const pixelRoute = await import('../src/app/api/mkt/o/[token]/route')
      const clickRoute = await import('../src/app/api/mkt/c/[token]/[idx]/route')
      const prefsRoute = await import('../src/app/api/mkt/prefs/[token]/route')

      // 第二场活动、同一个人：用来测一键退订的全新状态
      await prefs.applyAccountMarketing(user.id, { action: 'subscribe' }, meta)
      const c2 = await prisma.marketingCampaign.create({
        data: { name: `${TAG}-c2`, subject: 'x', doc: '{}', audience: '{}', status: 'COMPLETED' },
      })
      created.campaignIds.push(c2.id)
      const t2 = randomBytes(16).toString('hex')
      const m2 = await prisma.marketingMessage.create({
        data: {
          campaignId: c2.id,
          userId: user.id,
          email: user.email as string,
          domain: 'mkt-itest.dev',
          token: t2,
          status: 'SENT',
          claimedAt: new Date(now - H),
          sentAt: new Date(now - H),
          subjectSent: '(AD)x',
        },
      })
      const base = 'http://localhost:3000'
      const post = (tok: string, body: BodyInit | null, ct?: string) =>
        unsubRoute.POST(
          new NextRequest(`${base}/api/mkt/unsubscribe/${tok}`, {
            method: 'POST',
            body,
            headers: ct ? { 'content-type': ct, 'user-agent': 'Google-OneClick' } : { 'user-agent': 'Google-OneClick' },
          }),
          { params: { token: tok } }
        )

      const fd = new FormData()
      fd.append('List-Unsubscribe', 'One-Click')
      const rMultipart = await post(t2, fd)
      ok('RFC 8058：multipart 一键退订 → 200 ok', rMultipart.status === 200 && (await rMultipart.text()) === 'ok')
      ok('RFC 8058：不设 cookie、不跳转', !rMultipart.headers.get('set-cookie') && !rMultipart.headers.get('location'))
      const c = await prisma.marketingConsent.findUnique({ where: { userId: user.id } })
      ok('RFC 8058：偏好变成已退订', c?.status === 'UNSUBSCRIBED')
      const log = await prisma.marketingConsentLog.findFirst({ where: { messageId: m2.id }, orderBy: { id: 'desc' } })
      ok('RFC 8058：留痕 source=one_click、带隐私政策版本', log?.source === 'one_click' && !!log.policyVersion)
      ok('RFC 8058：这封信记下退订时间', !!(await prisma.marketingMessage.findUnique({ where: { id: m2.id } }))?.unsubscribedAt)
      ok('RFC 8058：UNSUB 事件一条', (await prisma.marketingEvent.count({ where: { messageId: m2.id, type: 'UNSUB' } })) === 1)

      const rUrlenc = await post(t2, 'List-Unsubscribe=One-Click', 'application/x-www-form-urlencoded')
      ok('RFC 8058：urlencoded 重复提交 → 200 ok（幂等）', rUrlenc.status === 200 && (await rUrlenc.text()) === 'ok')
      ok('RFC 8058：重复提交不加事件', (await prisma.marketingEvent.count({ where: { messageId: m2.id, type: 'UNSUB' } })) === 1)
      const rNoCt = await post(t2, 'x'.repeat(5000))
      ok('RFC 8058：没有 Content-Type、5KB 包体 → 仍 200', rNoCt.status === 200)
      const rJson = await post(t2, '{"a":1}', 'application/json')
      ok('RFC 8058：不看 Content-Type（JSON 也照收）', rJson.status === 200)
      const rBad = await post('c'.repeat(32), 'List-Unsubscribe=One-Click', 'application/x-www-form-urlencoded')
      ok('RFC 8058：无效 token 也回 200 ok（不泄露）', rBad.status === 200 && (await rBad.text()) === 'ok')
      const rJunk = await post('../../etc', null)
      ok('RFC 8058：乱写的 token 回 200 ok', rJunk.status === 200)
      const rTest = await post('test', 'List-Unsubscribe=One-Click', 'application/x-www-form-urlencoded')
      ok('RFC 8058：test 空操作 200', rTest.status === 200)

      const rGet = await unsubRoute.GET(new NextRequest(`${base}/api/mkt/unsubscribe/${t2}`), { params: { token: t2 } })
      ok('GET → 302 到退订页', rGet.status === 302 && (rGet.headers.get('location') || '').endsWith(`/unsubscribe/${t2}`))

      const tr2 = m2.trackToken
      const pixOld = await pixelRoute.GET(new NextRequest(`${base}/api/mkt/o/${t2}`, { headers: { 'user-agent': CHROME } }), {
        params: { token: t2 },
      })
      ok('像素：用退订 token 访问照样回 GIF、但不记录（审查 C5）', pixOld.headers.get('content-type') === 'image/gif' && (await prisma.marketingMessage.findUnique({ where: { id: m2.id } }))?.openCount === 0)
      const pix = await pixelRoute.GET(new NextRequest(`${base}/api/mkt/o/${tr2}`, { headers: { 'user-agent': CHROME } }), {
        params: { token: tr2 },
      })
      const pixBody = new Uint8Array(await pix.arrayBuffer())
      ok('像素：image/gif、43 字节', pix.headers.get('content-type') === 'image/gif' && pixBody.byteLength === 43)
      ok('像素：no-store, private', /no-store/.test(pix.headers.get('cache-control') || '') && /private/.test(pix.headers.get('cache-control') || ''))
      ok('像素：记了一次打开', (await prisma.marketingMessage.findUnique({ where: { id: m2.id } }))?.openCount === 1)
      const head = await pixelRoute.HEAD()
      ok('像素 HEAD：没有包体、不记录', (await head.arrayBuffer()).byteLength === 0 && (await prisma.marketingMessage.findUnique({ where: { id: m2.id } }))?.openCount === 1)
      const pixBad = await pixelRoute.GET(new NextRequest(`${base}/api/mkt/o/zzz`), { params: { token: 'zzz' } })
      ok('像素：无效 token 照样回 GIF', pixBad.status === 200 && pixBad.headers.get('content-type') === 'image/gif')

      const clk = await clickRoute.GET(new NextRequest(`${base}/api/mkt/c/${track}/0`, { headers: { 'user-agent': CHROME } }), {
        params: { token: track, idx: '0' },
      })
      ok('点击：302 到库里的 URL', clk.status === 302 && clk.headers.get('location') === 'https://bigolab.com/products/1?utm_medium=email&via=mail')
      const clkOld = await clickRoute.GET(new NextRequest(`${base}/api/mkt/c/${token}/0`, { headers: { 'user-agent': CHROME } }), {
        params: { token, idx: '0' },
      })
      ok('点击：用退订 token → 302 首页（审查 C5）', clkOld.status === 302 && clkOld.headers.get('location') !== clk.headers.get('location') && (clkOld.headers.get('location') || '').endsWith('/'))
      const clkBad = await clickRoute.GET(new NextRequest(`${base}/api/mkt/c/${track}/abc`), { params: { token: track, idx: 'abc' } })
      ok('点击：idx 非数字 → 302 首页', clkBad.status === 302 && (clkBad.headers.get('location') || '').endsWith('/'))
      const clkHead = await clickRoute.HEAD(new NextRequest(`${base}/api/mkt/c/${track}/0`, { method: 'HEAD' }), { params: { token: track, idx: '0' } })
      ok('点击 HEAD：给跳转头', clkHead.status === 302 && clkHead.headers.get('location') === clk.headers.get('location'))
      const clkHeadOld = await clickRoute.HEAD(new NextRequest(`${base}/api/mkt/c/${token}/0`, { method: 'HEAD' }), { params: { token, idx: '0' } })
      ok('点击 HEAD：退订 token → 首页', clkHeadOld.status === 302 && clkHeadOld.headers.get('location') !== clk.headers.get('location'))

      const pForm = await prefsRoute.POST(
        new NextRequest(`${base}/api/mkt/prefs/${t2}`, {
          method: 'POST',
          body: 'action=resubscribe',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
        }),
        { params: { token: t2 } }
      )
      ok('prefs POST：非 JSON → 415（防跨站表单替人恢复订阅）', pForm.status === 415)
      const pBad = await prefsRoute.POST(
        new NextRequest(`${base}/api/mkt/prefs/${t2}`, {
          method: 'POST',
          body: JSON.stringify({ action: 'nuke' }),
          headers: { 'content-type': 'application/json' },
        }),
        { params: { token: t2 } }
      )
      const pBadJson = await pBad.json()
      ok('prefs POST：未知动作 → 400 中文提示', pBad.status === 400 && pBadJson.error === '不支持的操作', JSON.stringify(pBadJson))
      const pOk = await prefsRoute.POST(
        new NextRequest(`${base}/api/mkt/prefs/${t2}`, {
          method: 'POST',
          body: JSON.stringify({ action: 'resubscribe' }),
          headers: { 'content-type': 'application/json; charset=utf-8' },
        }),
        { params: { token: t2 } }
      )
      const pOkJson = await pOk.json()
      ok('prefs POST：30 天内恢复订阅 → 200', pOk.status === 200 && pOkJson.data?.status === 'DEFAULT', JSON.stringify(pOkJson))
      const pGet = await prefsRoute.GET(new NextRequest(`${base}/api/mkt/prefs/${'d'.repeat(32)}`), { params: { token: 'd'.repeat(32) } })
      ok('prefs GET：无效 token → 404', pGet.status === 404)
    }


    console.log('[db] 为什么还没发：试探从恢复时刻起算（审查 C0）、联系邮箱/发信地址（审查 C18）')
    {
      const { bjDayStart, bjDateKey } = await import('../src/lib/marketing/time')
      const nowMs = Date.now()
      const dayStart = bjDayStart(new Date(nowMs)).getTime()
      // 今天早些时候（北京时间）发的一批；恢复时刻与恢复后那批依次排在它和「现在」之间
      const early = Math.max(dayStart + 1000, nowMs - 5 * 60_000)
      const resetAt = early + Math.floor((nowMs - early) / 3)
      const afterReset = early + Math.floor(((nowMs - early) * 2) / 3)
      const wc = await mkWaitingCampaign(prisma, TAG, 12, early)
      created.campaignIds.push(wc.id)
      const setReset = (at: Date | null) => prisma.marketingCampaign.update({ where: { id: wc.id }, data: { breakerResetAt: at, canaryDay: null } })
      try {
        await withSettings(
          prisma,
          { marketing_config: await waitingConfig(), mkt_halt: null, mkt_account: freshAccount() },
          async () => {
            // dry-run：senderReady 为真、跳过同步健康（那一块在 --sync 里测）
            await withEnv({ MARKETING_DRY_RUN: '1' }, async () => {
              const w1 = await stats.waitingReason(wc.id)
              ok('今天已发 12 封（≥ 试探 10）、没有恢复过 → 等回执', w1.code === 'canary' && w1.text.includes('今天先发出的 12 封'), JSON.stringify(w1))
              await setReset(new Date(dayStart - H))
              const w2 = await stats.waitingReason(wc.id)
              ok('breakerResetAt 在昨天 → 仍从今天 0 点数', w2.code === 'canary' && w2.text.includes('12 封'), JSON.stringify(w2))
              await setReset(new Date(resetAt))
              const w3 = await stats.waitingReason(wc.id)
              ok('今天暂停后恢复：恢复之后还没发 → 不说在等回执（worker 正在发新的试探批）', w3.code !== 'canary', JSON.stringify(w3))
              await addSent(prisma, TAG, wc.id, 10, afterReset, 100)
              const w4 = await stats.waitingReason(wc.id)
              ok('恢复后又发满 10 封 → 等这批的回执', w4.code === 'canary' && w4.text.includes('恢复发送后先发出的 10 封'), JSON.stringify(w4))
              await prisma.marketingCampaign.update({ where: { id: wc.id }, data: { canaryDay: bjDateKey(new Date()) } })
              const w5 = await stats.waitingReason(wc.id)
              ok('今天已放行 → 不再等', w5.code !== 'canary', JSON.stringify(w5))
              await setReset(null)
            })
            // 审查 C18：联系邮箱清空 → worker 的 gateReason 返回 no_contact、不发；这里要说出来（且 code 不是 none）
            await withSettings(prisma, { marketing_config: await waitingConfig({ contactEmail: '' }) }, async () => {
              await withEnv({ MARKETING_DRY_RUN: '1' }, async () => {
                const w = await stats.waitingReason(wc.id)
                ok('联系邮箱没填 → disabled + 说明原因', w.code === 'disabled' && w.text.includes('联系邮箱'), JSON.stringify(w))
              })
            })
            // 发信地址没配（也不是 dry-run）→ worker 的 no_sender
            await withEnv({ MARKETING_DRY_RUN: undefined, ALIYUN_DM_MARKETING: '' }, async () => {
              const w = await stats.waitingReason(wc.id)
              ok('营销发信地址没配 → disabled + 提 ALIYUN_DM_MARKETING（不是 60 分钟后的「同步超时」）', w.code === 'disabled' && w.text.includes('ALIYUN_DM_MARKETING'), JSON.stringify(w))
            })
            await withEnv({ MARKETING_DRY_RUN: undefined, ALIYUN_DM_MARKETING: 'not-an-email' }, async () => {
              const w = await stats.waitingReason(wc.id)
              ok('发信地址格式不对 = 没配 → disabled', w.code === 'disabled', JSON.stringify(w))
            })
          }
        )
      } finally {
        // 别让并发跑的 worker 看到一个发送中的测试活动
        await prisma.marketingCampaign.update({ where: { id: wc.id }, data: { status: 'COMPLETED' } })
      }
    }

    // 只在「确实没配置」时跑：配了（哪怕是 --sync 用的假值）就会真的发请求出去，那是 --sync 那一组的事
    if (!process.env.ALIYUN_DM_MARKETING || process.env.MARKETING_DRY_RUN === '1') {
      console.log('[db] 同步（未配置发信地址 / dry-run 时跳过）')
      const s = await sync.runSyncTick()
      ok('没有 ALIYUN_DM_MARKETING 或 dry-run → skipped，不碰阿里云', !!s.skipped, JSON.stringify(s))
    }
  } finally {
    // 清理：按本轮建的 id 删，不碰别的数据
    const cids = created.campaignIds
    const uids = created.userIds
    await prisma.marketingEvent.deleteMany({ where: { campaignId: { in: cids } } })
    await prisma.marketingMessage.deleteMany({ where: { campaignId: { in: cids } } })
    await prisma.marketingLink.deleteMany({ where: { campaignId: { in: cids } } })
    await prisma.marketingAudit.deleteMany({ where: { campaignId: { in: cids } } })
    await prisma.marketingCampaign.deleteMany({ where: { id: { in: cids } } })
    await prisma.marketingConsentLog.deleteMany({ where: { userId: { in: uids } } })
    await prisma.marketingConsent.deleteMany({ where: { userId: { in: uids } } })
    await prisma.order.deleteMany({ where: { id: { in: created.orderIds } } })
    if (created.productId) await prisma.product.delete({ where: { id: created.productId } }).catch(() => {})
    if (created.categoryId) await prisma.category.delete({ where: { id: created.categoryId } }).catch(() => {})
    await prisma.user.deleteMany({ where: { id: { in: uids } } })
    await prisma.$disconnect()
  }
}

/* ================================================================================================
 * 同步集成（--sync）：用假的阿里云（替换全局 fetch）跑一趟完整的 runSyncTick，核对落库。
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" ALIYUN_ACCESS_KEY_ID=fake \
 *   ALIYUN_ACCESS_KEY_SECRET=fake ALIYUN_DM_MARKETING=marketing@mail.itest.dev \
 *   npx tsx scripts/check-marketing-public.ts --sync          （也可以 --db --sync 两组一起跑）
 *
 * 任何不是 dm.aliyuncs.com 的请求都会直接抛错；mkt_sync / mkt_account / mkt_halt（以及「为什么还没发」临时改的
 * marketing_config）跑完原样恢复。
 *
 * 场景里有两个营销发信地址（当前 ALIYUN_DM_MARKETING + 换地址前的旧地址）和一个交易地址，
 * 假阿里云按 AccountName 分别返回各自的回执；还有两趟「预备趟」：回执接口 200 却没有 data、返回的数据里一封我们的信都没有。
 * ================================================================================================ */

async function syncSuite() {
  const url = process.env.DATABASE_URL || ''
  const dbName = url.split('/').pop()?.split('?')[0] || ''
  if (!/dev|test/i.test(dbName)) {
    console.error(`拒绝执行：数据库「${dbName}」看起来不是一次性测试库（库名须含 dev 或 test）`)
    process.exit(2)
  }
  const sender = process.env.ALIYUN_DM_MARKETING || ''
  if (!process.env.ALIYUN_ACCESS_KEY_ID || !process.env.ALIYUN_ACCESS_KEY_SECRET || !sender || process.env.MARKETING_DRY_RUN === '1') {
    console.error('--sync 需要 ALIYUN_ACCESS_KEY_ID / ALIYUN_ACCESS_KEY_SECRET / ALIYUN_DM_MARKETING（假值即可），且不能开 MARKETING_DRY_RUN')
    process.exit(2)
  }
  const { prisma } = await import('../src/lib/db')
  const sync = await import('../src/lib/marketing/sync')
  const stats = await import('../src/lib/marketing/stats')
  const { bjDateKey } = await import('../src/lib/marketing/time')
  const { EMPTY_SYNC } = await import('../src/lib/marketing/types')

  const TAG = `imktsync${Date.now().toString(36)}`
  const now = Date.now()
  const B = now - 50 * H // 待查消息集中放在 50 小时前：避开别人测试刚造的数据
  // 审查 C15：换地址前的营销发信地址（信上记着它）与一个交易邮件地址（不是营销地址）
  const OLD = `oldmkt-${TAG}@old-itest.dev`
  const TX = `no-reply@tx-${TAG}.dev`
  const SETTING_KEYS = ['mkt_sync', 'mkt_account', 'mkt_halt']
  const saved = await prisma.setting.findMany({ where: { key: { in: SETTING_KEYS } } })
  const created = { userIds: [] as number[], campaignIds: [] as number[] }
  const realFetch = globalThis.fetch
  const calls: { action: string; params: Record<string, string> }[] = []

  try {
    if (await prisma.vmqLock.findUnique({ where: { lockKey: 'mkt:sync' } })) {
      console.log('[sync] 另一趟同步正持有锁，跳过本组（别的测试可能在跑）')
      return
    }
    console.log('\n[sync] 准备数据')
    // 进这一组之前先把账户状态标成「刚取过」，第一趟就不会去碰 UserStatus
    const mkUser = async (name: string, domain = 'mkt-itest.dev') => {
      const u = await prisma.user.create({ data: { email: `${TAG}-${name}@${domain}`, passwordHash: 'x' } })
      created.userIds.push(u.id)
      return u
    }
    const mkCampaign = async (n: number) => {
      const c = await prisma.marketingCampaign.create({
        data: { name: `${TAG}-c${n}`, subject: 's', doc: '{}', audience: '{}', status: 'COMPLETED' },
      })
      created.campaignIds.push(c.id)
      return c
    }
    const [C1, C2, C3] = [await mkCampaign(1), await mkCampaign(2), await mkCampaign(3)]
    const SUBJ = '(AD)同步测试'
    let seq = 0
    const mkMsg = async (
      campaignId: number,
      u: { id: number | null; email: string | null },
      status: 'SENT' | 'UNKNOWN',
      claimedMs: number,
      extra: Record<string, unknown> = {}
    ) => {
      seq++
      return prisma.marketingMessage.create({
        data: {
          campaignId,
          userId: u.id,
          email: u.email as string,
          domain: (u.email as string).split('@')[1],
          token: randomBytes(16).toString('hex'),
          status,
          claimedAt: new Date(claimedMs),
          sentAt: new Date(claimedMs),
          subjectSent: SUBJ,
          envId: status === 'SENT' ? `fake-env-${TAG}-${seq}` : null,
          errorCode: status === 'UNKNOWN' ? 'TIMEOUT' : null,
          ...extra,
        },
      })
    }
    const delivered = (atMs: number) => ({ delivery: 'DELIVERED', deliveryDetail: 'SendOk 250', deliveryAt: new Date(atMs) })

    const uOk = await mkUser('ok')
    const uHard = await mkUser('hard')
    const uSpam = await mkUser('spam')
    const uRate = await mkUser('rate', `rl-${TAG}.dev`)
    const uUnkFound = await mkUser('unkfound')
    const uUnkLost = await mkUser('unklost')
    const uSoft = await mkUser('soft')
    const uBlockUnsub = await mkUser('blockunsub')
    const uBlockReport = await mkUser('blockreport')
    const uInvalid = await mkUser('invalid')
    const uPreUnsub = await mkUser('preunsub')
    const uSide = await mkUser('side', `sd-${TAG}.dev`)
    const uSide2 = await mkUser('side2')
    const uUnkClicked = await mkUser('unkclicked')
    const uUnkOpened = await mkUser('unkopened')
    const uAnchor = await mkUser('anchor')
    const uTx = await mkUser('txreport')
    const uOldReport = await mkUser('oldreport')

    const mOk = await mkMsg(C1.id, uOk, 'SENT', B)
    const mHard = await mkMsg(C1.id, uHard, 'SENT', B + 1000)
    const mSpam = await mkMsg(C1.id, uSpam, 'SENT', B + 2000)
    const mRate = await mkMsg(C1.id, uRate, 'SENT', B + 3000)
    const mUnkFound = await mkMsg(C1.id, uUnkFound, 'UNKNOWN', B + 4000)
    const mUnkLost = await mkMsg(C1.id, uUnkLost, 'UNKNOWN', B + 5000)
    // 软退信：更早两封已是投递失败（非频率类），这一封再失败 → 连续 3 次
    await mkMsg(C2.id, uSoft, 'SENT', B - 30 * H, { delivery: 'FAILED', deliveryDetail: 'SysOutConnError x', deliveryAt: new Date(B - 30 * H) })
    await mkMsg(C3.id, uSoft, 'SENT', B - 20 * H, { delivery: 'FAILED', deliveryDetail: 'SysOutConnError x', deliveryAt: new Date(B - 20 * H) })
    const mSoft = await mkMsg(C1.id, uSoft, 'SENT', B + 6000)
    const mBlockUnsub = await mkMsg(C1.id, uBlockUnsub, 'SENT', B + 7000, delivered(B + 8000))
    const mBlockReport = await mkMsg(C1.id, uBlockReport, 'SENT', B + 8000, delivered(B + 9000))
    // 审查 C16：阿里云因「此前已退订」拦下的这一封
    const mPreUnsub = await mkMsg(C1.id, uPreUnsub, 'SENT', B + 9000)
    // 审查 C19：前两封连不上（算软退信），这一封 DMARC 失败（我方问题）→ 不构成连击；发信地址显式记成当前地址
    await mkMsg(C2.id, uSide, 'SENT', B - 30 * H, { delivery: 'FAILED', deliveryDetail: 'SysOutConnError x', deliveryAt: new Date(B - 30 * H) })
    await mkMsg(C3.id, uSide, 'SENT', B - 20 * H, { delivery: 'FAILED', deliveryDetail: 'SysOutConnError x', deliveryAt: new Date(B - 20 * H) })
    const mSide = await mkMsg(C1.id, uSide, 'SENT', B + 10000, { sender })
    // 反过来：前两封是我方问题，这一封连不上 → 也不构成连击
    await mkMsg(C2.id, uSide2, 'SENT', B - 30 * H, { delivery: 'FAILED', deliveryDetail: 'SmtpDmaFail x', deliveryAt: new Date(B - 30 * H) })
    await mkMsg(C3.id, uSide2, 'SENT', B - 20 * H, { delivery: 'FAILED', deliveryDetail: 'SmtpMfBad x', deliveryAt: new Date(B - 20 * H) })
    const mSide2 = await mkMsg(C1.id, uSide2, 'SENT', B + 10500)
    // 审查 C14：阿里云查不到、但收件人点过 / 打开过（已经被标了 NOT_FOUND 的也算）
    const mUnkClicked = await mkMsg(C1.id, uUnkClicked, 'UNKNOWN', B + 11000, { clickedAt: new Date(B + H), lastClickAt: new Date(B + H), clickCount: 1 })
    const mUnkOpened = await mkMsg(C1.id, uUnkOpened, 'UNKNOWN', B + 12000, {
      openedAt: new Date(B + H),
      openCount: 1,
      errorCode: 'UNKNOWN_NOT_FOUND',
    })
    // 审查 C17：A 从没发出去（UNKNOWN、待查），B 同主题、1 小时后发、已经有回执（锚点）
    const mAnchorA = await mkMsg(C2.id, uAnchor, 'UNKNOWN', B + 13000)
    const mAnchorB = await mkMsg(C3.id, uAnchor, 'SENT', B + H, delivered(B + H + 5000))
    // 审查 C15：交易地址上的投诉（离它最近的营销信是这一封）
    const mTxNear = await mkMsg(C1.id, uTx, 'SENT', B + 14000, delivered(B + 15000))
    // 审查 C15：旧发信地址发的信（换地址之后回执、投诉还在陆续来）
    const OB = B + 3 * H
    const mOldUnkFound = await mkMsg(C1.id, { id: null, email: `${TAG}-oldfound@mkt-itest.dev` }, 'UNKNOWN', OB, { sender: OLD })
    const mOldUnkLost = await mkMsg(C1.id, { id: null, email: `${TAG}-oldlost@mkt-itest.dev` }, 'UNKNOWN', OB + 1000, { sender: OLD })
    const mOldSent: { id: number; email: string }[] = []
    for (let i = 0; i < 10; i++) {
      mOldSent.push(await mkMsg(C1.id, { id: null, email: `${TAG}-old${i}@mkt-itest.dev` }, 'SENT', OB + 2000 + i * 1000, { sender: OLD }))
    }
    const mOldReport = await mkMsg(C1.id, uOldReport, 'SENT', OB + 20000, { sender: OLD, ...delivered(OB + 21000) })

    const sec = (ms: number) => Math.floor(ms / 1000)
    const ok0 = (email: string | null, atMs: number) => ({ Status: 0, ToAddress: email, Subject: SUBJ, UtcLastUpdateTime: sec(atMs), ErrorClassification: 'SendOk', Message: '250 OK' })
    const myRows = [
      { Status: 0, ToAddress: uOk.email, Subject: SUBJ, UtcLastUpdateTime: String(sec(B + 5000)), ErrorClassification: 'SendOk', Message: '250 OK' },
      { Status: 2, ToAddress: uHard.email, Subject: SUBJ, UtcLastUpdateTime: sec(B + 6000), ErrorClassification: 'SmtpNxBox', Message: '550 no such user' },
      { Status: 3, ToAddress: uSpam.email, Subject: SUBJ, UtcLastUpdateTime: sec(B + 7000), ErrorClassification: 'SysOutRecipientReportedSpam', Message: 'spam' },
      { Status: 4, ToAddress: uRate.email, Subject: SUBJ, UtcLastUpdateTime: sec(B + 8000), ErrorClassification: 'SmtpMfFreq', Message: '421 too fast' },
      { Status: 0, ToAddress: uUnkFound.email, Subject: SUBJ, UtcLastUpdateTime: sec(B + 9000), ErrorClassification: 'SendOk', Message: '250 OK' },
      { Status: 4, ToAddress: uSoft.email, Subject: SUBJ, UtcLastUpdateTime: sec(B + 10000), ErrorClassification: 'SysOutConnError', Message: 'conn' },
      ok0(uBlockUnsub.email, B + 8000),
      ok0(uBlockReport.email, B + 9000),
      { Status: 4, ToAddress: uPreUnsub.email, Subject: SUBJ, UtcLastUpdateTime: sec(B + 10000), ErrorClassification: 'SysOutRecipientUnsubscribed', Message: '562 unsubscribed' },
      { Status: 4, ToAddress: uSide.email, Subject: SUBJ, UtcLastUpdateTime: sec(B + 11000), ErrorClassification: 'SmtpDmaFail', Message: 'dmarc fail' },
      { Status: 4, ToAddress: uSide2.email, Subject: SUBJ, UtcLastUpdateTime: sec(B + 11500), ErrorClassification: 'SysOutConnError', Message: 'conn' },
      // 只有 B 的回执（A 从没发出去）
      ok0(uAnchor.email, B + H + 5000),
      ok0(uTx.email, B + 15000),
    ].map((r) => ({ ...r, AccountName: sender, LastUpdateTime: '2026-09-23T10:00Z' }))
    // 150 条别人的回执，逼出翻页
    const filler = Array.from({ length: 150 }, (_, i) => ({
      Status: 0,
      ToAddress: `filler${i}@filler-${TAG}.dev`,
      Subject: SUBJ,
      UtcLastUpdateTime: String(sec(B + i * 1000)),
      ErrorClassification: 'SendOk',
      Message: '250 OK',
      AccountName: sender,
    }))
    const detailRows = [...filler.slice(0, 70), ...myRows, ...filler.slice(70)]
    // 旧地址：受理的 11 封（10 封 + mOldReport）里返回 10 封（缺 old9）+ 找回来的那封 UNKNOWN。
    // 10/11 < 95% → 旧地址的窗口「不完整」，它的 UNKNOWN 不能判 NOT_FOUND；但 ≥ 80%，不告警
    const oldRows = [
      ok0(`${TAG}-oldfound@mkt-itest.dev`, OB + 3000),
      ...mOldSent.slice(0, 9).map((m, i) => ok0(m.email, OB + 2000 + i * 1000 + 4000)),
      ok0(uOldReport.email, OB + 21000),
    ].map((r) => ({ ...r, AccountName: OLD }))

    // normal：正常；nodata：200 但没有 data；partial：只返回别人的信（我们受理的一封都没有）
    let mode: 'normal' | 'nodata' | 'partial' = 'normal'
    let userStatus = 0
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const u = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      if (!u.startsWith('https://dm.aliyuncs.com')) throw new Error(`测试里出现了意外的外部请求：${u}`)
      const params = Object.fromEntries(new URLSearchParams(String(init?.body || '')))
      const action = params.Action
      calls.push({ action, params })
      let body: unknown = {}
      if (action === 'DescAccountSummary') {
        body = { DailyQuota: 2000, MonthQuota: 60000, QuotaLevel: 2, MaxQuotaLevel: 10, UserStatus: userStatus, IpChannelType: 'normal', RemainFreeQuota: 1910, RequestId: 'r' }
      } else if (action === 'ListBlockSending') {
        // 按整个账户返回：营销地址、旧营销地址、交易地址上的记录都有
        const data =
          params.BlockType === 'REPORT'
            ? [
                { SenderEmail: sender, BlockEmail: uBlockReport.email, SendTime: sec(B + 8000), BlockTime: sec(B + 3 * H), Reason: 1 },
                { SenderEmail: OLD, BlockEmail: uOldReport.email, SendTime: sec(OB + 20000), BlockTime: sec(OB + H), Reason: 1 },
                { SenderEmail: TX, BlockEmail: uTx.email, SendTime: sec(B + 20000), BlockTime: sec(B + H), Reason: 1 },
              ]
            : [{ SenderEmail: sender, BlockEmail: uBlockUnsub.email, SendTime: sec(B + 8000), BlockTime: sec(B + 3 * H), Reason: 1 }]
        body = { RequestId: 'r', NextToken: '', Data: data }
      } else if (action === 'SenderStatisticsDetailByParam') {
        if (mode === 'nodata') {
          body = { RequestId: 'r' }
        } else {
          const all = params.AccountName === sender ? (mode === 'partial' ? filler : detailRows) : params.AccountName === OLD && mode === 'normal' ? oldRows : []
          const off = Number(params.NextStart || '0')
          const page = all.slice(off, off + Number(params.Length || 100))
          const next = off + page.length < all.length ? String(off + page.length) : ''
          body = { RequestId: 'r', NextStart: next, data: { mailDetail: page } }
        }
      } else if (action === 'QueryInvalidAddress') {
        body = {
          RequestId: 'r',
          NextStart: '',
          TotalCount: 2,
          data: { mailDetail: [{ ToAddress: uInvalid.email, UtcLastUpdateTime: sec(now - D) }, { ToAddress: `stranger@nowhere-${TAG}.dev`, UtcLastUpdateTime: sec(now - D) }] },
        }
      } else {
        body = { Code: 'InvalidAction', Message: 'unknown' }
      }
      return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
    }) as typeof fetch

    // 清掉 invalidCursor 等，从「首次运行」开始；账户状态标成 5 分钟前刚取过
    await prisma.setting.deleteMany({ where: { key: { in: SETTING_KEYS } } })
    await prisma.setting.create({
      data: {
        key: 'mkt_account',
        value: JSON.stringify({ dailyQuota: 500, monthQuota: null, quotaLevel: 1, maxQuotaLevel: null, userStatus: 0, ipChannelType: null, remainFreeQuota: null, fetchedAt: new Date(now - 5 * 60_000).toISOString() }),
      },
    })

    const get = (id: number) => prisma.marketingMessage.findUniqueOrThrow({ where: { id } })
    const sup = async (email: string | null) => (await prisma.marketingSuppression.findUnique({ where: { email: email as string } }))?.reason
    const consent = async (userId: number) => prisma.marketingConsent.findUnique({ where: { userId } })
    const lastLog = async (userId: number) => prisma.marketingConsentLog.findFirst({ where: { userId }, orderBy: { id: 'desc' } })
    const syncStateNow = async () => JSON.parse((await prisma.setting.findUnique({ where: { key: 'mkt_sync' } }))?.value || '{}')

    console.log('[sync] 预备趟 A：回执接口 200 但没有 data（审查 C14）')
    mode = 'nodata'
    const s0a = await sync.runSyncTick()
    // 代码审查 C14 复核：缺 data 分不清「确实没有」还是「没拿到」—— 这个窗口不下 NOT_FOUND 的结论，
    // 但对照里没有「之前见过回执」的信时不当整趟失败（否则每 5 分钟记一次错，一小时后急停全部营销）
    ok('缺 data（对照都没出过回执）→ 不当整趟失败、不记错', !s0a.errors.some((e) => e.includes('缺少 data')), JSON.stringify(s0a.errors))
    ok('缺 data：超 2 小时的 UNKNOWN 不判 NOT_FOUND', (await get(mUnkLost.id)).errorCode === 'TIMEOUT')
    {
      const st = await syncStateNow()
      ok('缺 data：lastError 里没有这条（不会因此触发「同步中断」急停）', !/缺少 data/.test(st.lastError || ''), JSON.stringify(st))
    }
    {
      const a = await get(mUnkClicked.id)
      const b = await get(mUnkOpened.id)
      ok('点过的 UNKNOWN → 对账成 SENT（查不到回执也不判 NOT_FOUND）', a.status === 'SENT' && a.errorCode === null && a.sentAt?.getTime() === B + 11000, `${a.status}/${a.errorCode}`)
      ok('打开过、已被标 NOT_FOUND 的 → 也改回 SENT（不能再被重排）', b.status === 'SENT' && b.errorCode === null, `${b.status}/${b.errorCode}`)
      ok('对账计数', s0a.unknownResolved >= 2)
    }

    console.log('[sync] 预备趟 B：返回的数据里一封我们受理的信都没有（审查 C14 正对照）')
    mode = 'partial'
    const s0b = await sync.runSyncTick()
    // 受理的信都还没出过回执（阿里云晚到）：查不到不告警；「见过回执的对照大面积消失才告警」由纯函数断言钉住
    ok('对照都没出过回执时对不上 → 不记错（阿里云晚到不停发）', !s0b.errors.some((e) => e.includes('回执数据不完整')), JSON.stringify(s0b.errors))
    ok('数据不完整：超 2 小时的 UNKNOWN 不判 NOT_FOUND', (await get(mUnkLost.id)).errorCode === 'TIMEOUT')
    ok('数据不完整：旧地址的 UNKNOWN 也不判', (await get(mOldUnkLost.id)).errorCode === 'TIMEOUT')

    // 预备趟写过游标：清掉，下面按「首次运行」核对
    await prisma.setting.deleteMany({ where: { key: 'mkt_sync' } })
    calls.length = 0
    mode = 'normal'

    // 这是共享的本地库：别的测试留下的待查信（别的发信地址、或时间在别处）也会被这趟同步查到，
    // 假阿里云没有它们的回执 → 那些窗口会报「回执数据不完整」。只有出现了本组以外的待查信时才容忍这一种报错
    const myPendingMax = await prisma.marketingMessage.count({
      where: {
        campaignId: { in: created.campaignIds },
        status: { in: ['SENT', 'UNKNOWN'] },
        claimedAt: { gte: new Date(Date.now() - 72 * H) },
        OR: [{ delivery: null }, { delivery: 'FAILED' }],
      },
    })
    const foreignErrOk = (s: { deliveries: { checked: number } }) => (e: string) => s.deliveries.checked > myPendingMax && e.includes('回执数据不完整')

    console.log('[sync] 第一趟')
    const s1 = await sync.runSyncTick()
    ok('第一趟：没有报错', s1.errors.filter((e) => !foreignErrOk(s1)(e)).length === 0 && !s1.skipped, JSON.stringify(s1))
    ok('账户状态 1 小时内取过 → 不调 DescAccountSummary', s1.account === 'fresh' && !calls.some((c) => c.action === 'DescAccountSummary'))

    const det = calls.filter((c) => c.action === 'SenderStatisticsDetailByParam')
    ok('回执查询：只传 AccountName（三选一规则）', det.length > 0 && det.every((c) => !!c.params.AccountName && !c.params.ToAddress && !c.params.TagName))
    ok(
      '回执查询：按每封信自己的发信地址查 —— 当前地址与旧地址各查（审查 C15）',
      // 库里别的测试留下的、记了别的发信地址的信也会各查各的，这里只核对本组的两个地址都查了、交易地址没查
      det.some((c) => c.params.AccountName === sender) && det.some((c) => c.params.AccountName === OLD) && !det.some((c) => c.params.AccountName === TX),
      JSON.stringify(det.map((c) => c.params.AccountName))
    )
    ok('回执查询：北京时间 yyyy-MM-dd HH:mm', det.every((c) => /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(c.params.StartTime) && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(c.params.EndTime)))
    ok('回执查询：翻页用 NextStart、每页 100', det.some((c) => c.params.NextStart === '100') && det.every((c) => c.params.Length === '100'))
    const blk = calls.filter((c) => c.action === 'ListBlockSending')
    ok('屏蔽名单：REPORT 与 UNSUB 各查一次', blk.map((c) => c.params.BlockType).sort().join() === 'REPORT,UNSUB')
    ok(
      '屏蔽名单：按整个账户拉（不带 SenderEmail，审查 C15）、Unix 秒、首次从 30 天前、MaxResults 500',
      blk.every(
        (c) =>
          !('SenderEmail' in c.params) &&
          /^\d{10}$/.test(c.params.BeginTime) &&
          Math.abs(Number(c.params.EndTime) - Number(c.params.BeginTime) - 30 * 86400) < 5 &&
          c.params.MaxResults === '500'
      ),
      JSON.stringify(blk.map((c) => c.params))
    )
    const inv = calls.filter((c) => c.action === 'QueryInvalidAddress')
    ok('无效地址库：yyyy-MM-dd、结束于北京今天', inv.length === 1 && /^\d{4}-\d{2}-\d{2}$/.test(inv[0].params.StartTime) && inv[0].params.EndTime === bjDateKey(new Date()))

    const r1 = await get(mOk.id)
    ok('送达：delivery=DELIVERED、送达时间取阿里云 UTC', r1.delivery === 'DELIVERED' && r1.deliveryAt?.getTime() === sec(B + 5000) * 1000)
    ok('无效地址：delivery=INVALID + 抑制 HARD_BOUNCE', (await get(mHard.id)).delivery === 'INVALID' && (await sup(uHard.email)) === 'HARD_BOUNCE')
    {
      // 审查 C16：SysOutRecipientReportedSpam = 此前投诉过、这一封被阿里云拦下 —— 地址照样抑制、退订，但这封信不记投诉
      const r3 = await get(mSpam.id)
      ok('预拦截的投诉：SPAM + 抑制 COMPLAINT', r3.delivery === 'SPAM' && (await sup(uSpam.email)) === 'COMPLAINT')
      ok('预拦截的投诉：这封信不记 complainedAt（不算这场活动的投诉、不触发熔断）', r3.complainedAt === null)
      ok('预拦截的投诉：偏好退订、source=complaint', (await consent(uSpam.id))?.status === 'UNSUBSCRIBED' && (await consent(uSpam.id))?.source === 'complaint')
      const lg = await lastLog(uSpam.id)
      ok('预拦截的投诉：留痕不挂这封信 / 这场活动', lg?.messageId === null && lg?.campaignId === null, JSON.stringify(lg))
    }
    {
      const rp = await get(mPreUnsub.id)
      ok('预拦截的退订：FAILED、这封信不记 unsubscribedAt', rp.delivery === 'FAILED' && rp.unsubscribedAt === null)
      ok('预拦截的退订：偏好照样退订、source=aliyun_sync', (await consent(uPreUnsub.id))?.status === 'UNSUBSCRIBED' && (await consent(uPreUnsub.id))?.source === 'aliyun_sync')
      const lg = await lastLog(uPreUnsub.id)
      ok('预拦截的退订：留痕 messageId 为空、不产生 UNSUB 事件', lg?.messageId === null && (await prisma.marketingEvent.count({ where: { messageId: mPreUnsub.id } })) === 0)
    }
    ok('频率类：FAILED、不抑制', (await get(mRate.id)).delivery === 'FAILED' && !(await sup(uRate.email)))
    const syncState = await syncStateNow()
    ok('频率类：该收件域名退避 1 小时', !!syncState.domainBackoff?.[`rl-${TAG}.dev`], JSON.stringify(syncState.domainBackoff))
    const r5 = await get(mUnkFound.id)
    ok('UNKNOWN 查到了 → SENT、sentAt=claimedAt、错误码清空', r5.status === 'SENT' && r5.sentAt?.getTime() === B + 4000 && r5.errorCode === null && r5.delivery === 'DELIVERED')
    ok('UNKNOWN 对账计数', s1.unknownResolved >= 2)
    const r6 = await get(mUnkLost.id)
    ok('UNKNOWN 超 2 小时仍查不到、窗口完整 → UNKNOWN_NOT_FOUND（此后才可重排）', r6.status === 'UNKNOWN' && r6.errorCode === 'UNKNOWN_NOT_FOUND', `${r6.status}/${r6.errorCode}`)
    {
      const ms = await get(mSoft.id)
      ok('连续 3 次投递失败（非频率类）→ 抑制 SOFT_BOUNCE', ms.delivery === 'FAILED' && (await sup(uSoft.email)) === 'SOFT_BOUNCE')
    }
    {
      // 审查 C19
      const a = await get(mSide.id)
      ok('DMARC 失败（我方问题）：FAILED 照记', a.delivery === 'FAILED' && (a.deliveryDetail || '').startsWith('SmtpDmaFail'))
      ok('前两次连不上 + 这次 DMARC 失败 → 不算软退信、不抑制', !(await sup(uSide.email)))
      ok('DMARC 失败不退避收件域名', !syncState.domainBackoff?.[`sd-${TAG}.dev`], JSON.stringify(syncState.domainBackoff))
      ok('前两次是我方问题 + 这次连不上 → 也不构成连击', (await get(mSide2.id)).delivery === 'FAILED' && !(await sup(uSide2.email)))
    }
    {
      const a = await get(mUnkClicked.id)
      ok('点过的那封：同步查不到也不会被判 NOT_FOUND', a.status === 'SENT' && a.errorCode === null)
    }
    {
      // 审查 C17：B 的回执又被查回来时不能记到 A 头上
      const a = await get(mAnchorA.id)
      const b = await get(mAnchorB.id)
      ok('锚点：从没发出去的 A 没有抢走 B 的回执（仍是 UNKNOWN、没有回执）', a.status === 'UNKNOWN' && a.delivery === null, `${a.status}/${a.delivery}/${a.errorCode}`)
      ok('锚点：B 不在待查里、原样不动', b.delivery === 'DELIVERED' && b.deliveryAt?.getTime() === B + H + 5000)
    }
    {
      // 审查 C15：换了发信地址，旧地址那些信
      const f = await get(mOldUnkFound.id)
      ok('旧地址的 UNKNOWN：按旧地址查到了 → SENT + DELIVERED（换地址前会被判 NOT_FOUND、重排、重复发）', f.status === 'SENT' && f.delivery === 'DELIVERED' && f.errorCode === null, `${f.status}/${f.delivery}/${f.errorCode}`)
      ok('旧地址已发的信拿到回执', (await get(mOldSent[0].id)).delivery === 'DELIVERED')
      const l = await get(mOldUnkLost.id)
      ok('旧地址的窗口不完整（缺 1/11）→ 它的 UNKNOWN 不判 NOT_FOUND（当前地址的窗口完整不算数）', l.status === 'UNKNOWN' && l.errorCode === 'TIMEOUT', `${l.status}/${l.errorCode}`)
      ok('旧地址缺的那封仍待查', (await get(mOldSent[9].id)).delivery === null)
      const rep = await get(mOldReport.id)
      ok('旧地址那封信的投诉照样导入：抑制 COMPLAINT + 记到那封信上', (await sup(uOldReport.email)) === 'COMPLAINT' && !!rep.complainedAt)
      const tx = await get(mTxNear.id)
      ok('交易地址上的投诉：抑制 COMPLAINT + 退订营销', (await sup(uTx.email)) === 'COMPLAINT' && (await consent(uTx.id))?.status === 'UNSUBSCRIBED')
      ok('交易地址上的投诉：不记到就近那封营销信上（那场活动没招来这次投诉）', tx.complainedAt === null)
      const lg = await lastLog(uTx.id)
      ok('交易地址上的投诉：留痕不挂活动/信', lg?.messageId === null && lg?.campaignId === null)
    }
    ok('屏蔽名单 UNSUB：偏好退订、source=aliyun_sync', (await consent(uBlockUnsub.id))?.status === 'UNSUBSCRIBED' && (await consent(uBlockUnsub.id))?.source === 'aliyun_sync')
    ok('屏蔽名单 UNSUB：记到就近那封信', !!(await get(mBlockUnsub.id)).unsubscribedAt)
    ok('屏蔽名单 REPORT：抑制 COMPLAINT + 退订 + complainedAt', (await sup(uBlockReport.email)) === 'COMPLAINT' && (await consent(uBlockReport.id))?.status === 'UNSUBSCRIBED' && !!(await get(mBlockReport.id)).complainedAt)
    ok('无效地址库：注册用户的地址抑制 INVALID', (await sup(uInvalid.email)) === 'INVALID')
    ok('无效地址库：非本站用户的地址不入库（少存个人信息）', !(await sup(`stranger@nowhere-${TAG}.dev`)))
    ok('mkt_sync：lastOkAt / lastRunAt 已写、没有 lastError', !!syncState.lastOkAt && !!syncState.lastRunAt && !syncState.lastError)
    ok('mkt_sync：屏蔽名单游标 = 本趟结束 − 1 小时', Math.abs(Number(syncState.blockCursor) - (Math.floor(now / 1000) - 3600)) < 60, String(syncState.blockCursor))
    ok('mkt_sync：无效地址游标 = 北京今天', syncState.invalidCursor === bjDateKey(new Date()))

    console.log('[sync] 第二趟（幂等 + 账户异常）')
    calls.length = 0
    userStatus = 4
    await prisma.setting.update({
      where: { key: 'mkt_account' },
      data: { value: JSON.stringify({ dailyQuota: 500, userStatus: 0, fetchedAt: new Date(now - 2 * H).toISOString() }) },
    })
    const s2 = await sync.runSyncTick()
    ok('第二趟：没有报错', s2.errors.filter((e) => !foreignErrOk(s2)(e)).length === 0, JSON.stringify(s2.errors))
    ok('账户状态过期 → 重新取并保存', s2.account === 'updated' && calls.some((c) => c.action === 'DescAccountSummary'))
    const acct = JSON.parse((await prisma.setting.findUniqueOrThrow({ where: { key: 'mkt_account' } })).value)
    ok('mkt_account：日额度 2000、状态 4', acct.dailyQuota === 2000 && acct.userStatus === 4)
    const halt = JSON.parse((await prisma.setting.findUnique({ where: { key: 'mkt_halt' } }))?.value || '{}')
    ok('UserStatus≠0 → 急停约 24 小时', !!halt.until && Math.abs(Date.parse(halt.until) - (Date.now() + 24 * H)) < 5 * 60_000 && /UserStatus=4/.test(halt.reason || ''), JSON.stringify(halt))
    ok('无效地址库一天只查一次', !calls.some((c) => c.action === 'QueryInvalidAddress'))
    const blk2 = calls.filter((c) => c.action === 'ListBlockSending')
    ok('屏蔽名单第二趟从游标开始', blk2.length === 2 && Number(blk2[0].params.BeginTime) === Number(syncState.blockCursor))
    ok('已有回执的不再重复处理（送达的不是待查）', s2.deliveries.checked < s1.deliveries.checked || s2.deliveries.matched <= s1.deliveries.matched)
    ok('投诉抑制幂等（仍是一行 COMPLAINT）', (await prisma.marketingSuppression.count({ where: { email: uBlockReport.email as string } })) === 1)
    ok('第二趟：旧地址的 UNKNOWN 仍不判 NOT_FOUND', (await get(mOldUnkLost.id)).errorCode === 'TIMEOUT')
    ok('第二趟：锚点 A 仍没有回执', (await get(mAnchorA.id)).delivery === null)

    console.log('[sync] 锁')
    await prisma.vmqLock.create({ data: { lockKey: 'mkt:sync', orderId: `${TAG}-held`, createdAt: new Date() } })
    const s3 = await sync.runSyncTick()
    ok('锁被占 → skipped: locked', s3.skipped === 'locked')
    await prisma.vmqLock.deleteMany({ where: { lockKey: 'mkt:sync', orderId: `${TAG}-held` } })

    console.log('[sync] 为什么还没发：同步状态读坏 / 发信地址（审查 C18）')
    {
      const wc = await mkWaitingCampaign(prisma, TAG, 0, now - 60_000)
      created.campaignIds.push(wc.id)
      try {
        await withSettings(
          prisma,
          { marketing_config: await waitingConfig(), mkt_halt: null, mkt_account: freshAccount(), mkt_sync: '{not json' },
          async () => {
            const w1 = await stats.waitingReason(wc.id)
            ok('mkt_sync 读坏 → sync + 读取失败（worker 此时 sync_unreadable、不发）', w1.code === 'sync' && w1.text.includes('读取失败'), JSON.stringify(w1))
            await prisma.setting.update({ where: { key: 'mkt_sync' }, data: { value: JSON.stringify({ ...EMPTY_SYNC, lastOkAt: new Date().toISOString() }) } })
            const w2 = await stats.waitingReason(wc.id)
            ok('mkt_sync 正常且刚成功 → 不报 sync', w2.code !== 'sync', JSON.stringify(w2))
            await prisma.setting.update({ where: { key: 'mkt_sync' }, data: { value: '[1,2]' } })
            await prisma.marketingCampaign.update({ where: { id: wc.id }, data: { status: 'SCHEDULED', scheduledAt: new Date(now - 60_000) } })
            const w3 = await stats.waitingReason(wc.id)
            ok('定时已到、同步状态读坏 → 也报 sync（不是「正在准备名单」）', w3.code === 'sync', JSON.stringify(w3))
            await prisma.setting.update({ where: { key: 'mkt_sync' }, data: { value: JSON.stringify({ ...EMPTY_SYNC, lastOkAt: new Date().toISOString() }) } })
            const w4 = await stats.waitingReason(wc.id)
            ok('定时已到、一切正常 → 正在准备名单', w4.code === 'queue', JSON.stringify(w4))
            await prisma.marketingCampaign.update({ where: { id: wc.id }, data: { status: 'SENDING' } })
            await withEnv({ ALIYUN_DM_MARKETING: '' }, async () => {
              const w = await stats.waitingReason(wc.id)
              ok('发信地址被清空（重新部署丢了环境变量）→ disabled，而不是先显示在发、60 分钟后说同步超时', w.code === 'disabled' && w.text.includes('ALIYUN_DM_MARKETING'), JSON.stringify(w))
            })
            await withSettings(prisma, { marketing_config: await waitingConfig({ contactEmail: '' }) }, async () => {
              const w = await stats.waitingReason(wc.id)
              ok('联系邮箱清空 → disabled', w.code === 'disabled' && w.text.includes('联系邮箱'), JSON.stringify(w))
            })
          }
        )
      } finally {
        await prisma.marketingCampaign.update({ where: { id: wc.id }, data: { status: 'COMPLETED' } })
      }
    }
  } finally {
    globalThis.fetch = realFetch
    const cids = created.campaignIds
    const uids = created.userIds
    const emails = (await prisma.user.findMany({ where: { id: { in: uids } }, select: { email: true } })).map((u) => u.email as string)
    await prisma.marketingEvent.deleteMany({ where: { campaignId: { in: cids } } })
    await prisma.marketingMessage.deleteMany({ where: { campaignId: { in: cids } } })
    await prisma.marketingAudit.deleteMany({ where: { OR: [{ campaignId: { in: cids } }, { action: 'HALT', detail: { contains: 'UserStatus=4' }, createdAt: { gte: new Date(now) } }] } })
    await prisma.marketingCampaign.deleteMany({ where: { id: { in: cids } } })
    await prisma.marketingSuppression.deleteMany({ where: { email: { in: emails } } })
    await prisma.marketingConsentLog.deleteMany({ where: { userId: { in: uids } } })
    await prisma.marketingConsent.deleteMany({ where: { userId: { in: uids } } })
    await prisma.user.deleteMany({ where: { id: { in: uids } } })
    // 三个运行时设置恢复原样
    await prisma.setting.deleteMany({ where: { key: { in: SETTING_KEYS } } })
    for (const s of saved) await prisma.setting.create({ data: { key: s.key, value: s.value } })
    await prisma.$disconnect()
  }
}

async function main() {
  if (process.argv.includes('--db')) await dbSuite()
  if (process.argv.includes('--sync')) await syncSuite()
  console.log(`\n${fail === 0 ? '全部通过' : '有失败'}：通过 ${pass}，失败 ${fail}`)
  process.exit(fail === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
