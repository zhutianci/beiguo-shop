/**
 * 短信接码 · S3（记录、客服、售后）的纯函数检查（不连库）。docs/短信接码-设计.md E17、§1.4、§1.11、§7.5、§8.2、§8.3、§12.3 第 73、126 条里能写成纯函数断言的部分：
 *
 *   npx tsx scripts/check-jiema-s3.ts
 *
 * 覆盖：售后申请能不能提交（complaintBlock：状态、退款、收码窗口边界、每单一次）、买家看到的售后状态、号码不支持再次收码（不计入 30 天 2 次）、
 * 30 天通过次数、通过 / 驳回写给买家的留言、上游申诉截止；记录页的 tab 划分（CLOSED 不混进「已退回」）、日期与号码搜索的解析、每行状态文字
 * （纯支付宝的关闭单不写「已退回」）、进行中提示条；客服页 / /jiema 的 13 条 FAQ 与规则一览（数字取配置、开票一句的范围、
 * 「不能提现、不退回支付宝」、不出现上游名称）；原来 8 条客服 FAQ 不变；两个买家 DTO 不泄露成本字段。
 */
import {
  COMPLAINT_REASONS,
  COMPLAINT_DETAIL_MAX,
  COMPLAINT_PASS_LIMIT,
  complaintBlock,
  complaintDeadline,
  buyerComplaintState,
  complaintNoResend,
  passedCount30d,
  approveMessageText,
  rejectMessageText,
  upstreamAppealDeadline,
  isComplaintReason,
  complaintReasonText,
  COMPLAINT_PENDING_STATES,
} from '../src/lib/jiema/complaint-rules'
import {
  RECORD_TABS,
  RECORD_ACTIVE_STATES,
  recordTabOf,
  recordStatesOf,
  parseRecordTab,
  parseRecordDays,
  phoneQuery,
  payModeShort,
  recordStatusText,
  bannerText,
  type RecordLike,
} from '../src/lib/jiema/ui'
import { jiemaFaqs, jiemaSupportRules, supportFaqs } from '../src/lib/support-faq'
import { PLATFORM_CONTACT } from '../src/lib/contact-base'
import { COMPLAINT_AVAILABLE, FORBIDDEN_BUYER_KEYS, collectKeyNames, toJiemaOrderView, toJiemaRecordItem, type JiemaOrderView, type JiemaRecordItem } from '../src/lib/jiema/dto'

let pass = 0
let fail = 0
function ok(cond: boolean, name: string, extra = ''): void {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.log(`  ✗ ${name}${extra ? `  —— ${extra}` : ''}`)
  }
}
function eq<T>(a: T, b: T, name: string): void {
  const sa = JSON.stringify(a)
  const sb = JSON.stringify(b)
  ok(sa === sb, name, `实际 ${sa}，期望 ${sb}`)
}
const H = 3600_000
const T0 = new Date('2026-09-30T06:00:00.000Z')

console.log('\n— 售后申请：能不能提交（E17、§6.4 complaint「只在 RECEIVED/FINISHED，且收码 24 小时内可用」、每单 1 次）')
{
  const base = { state: 'RECEIVED', refundState: 'NONE', firstCodeAt: T0, now: new Date(T0.getTime() + H), windowH: 24, hasComplaint: false, orderPaid: true }
  ok(complaintBlock(base) === null, 'RECEIVED、收码 1 小时后 → 可以申请')
  ok(complaintBlock({ ...base, state: 'FINISHED' }) === null, 'FINISHED → 可以申请')
  ok(complaintBlock({ ...base, now: new Date(T0.getTime() + 24 * H) }) === null, '恰好收码后 24 小时（边界）→ 还可以')
  eq(complaintBlock({ ...base, now: new Date(T0.getTime() + 24 * H + 1) })?.code, 'EXPIRED', '收码后 24 小时 + 1 毫秒 → EXPIRED')
  ok(!!complaintBlock({ ...base, now: new Date(T0.getTime() + 24 * H + 1) })?.message.includes('24 小时'), '  …文案按窗口小时数写')
  ok(complaintBlock({ ...base, windowH: 48, now: new Date(T0.getTime() + 30 * H) }) === null, 'complaintWindowH=48（后台可配 1–168）→ 收码 30 小时后仍可以')
  eq(complaintBlock({ ...base, hasComplaint: true })?.code, 'EXISTS', '已经申请过 → EXISTS（每单 1 次）')
  eq(complaintBlock({ ...base, state: 'CANCELLED', refundState: 'DONE' })?.code, 'NO_CODE', '已取消（没收到码、已自动退回）→ NO_CODE「不需要申请售后」')
  eq(complaintBlock({ ...base, state: 'REFUNDING' })?.code, 'NO_CODE', 'REFUNDING → NO_CODE')
  eq(complaintBlock({ ...base, state: 'REFUNDED', refundState: 'DONE' })?.code, 'STATE', '已售后退款 → STATE')
  eq(complaintBlock({ ...base, refundState: 'DONE' })?.code, 'STATE', 'RECEIVED 但 refundState 已是 DONE → STATE')
  for (const s of ['PENDING_PAY', 'CLOSED', 'READY', 'ACQUIRING', 'WAITING', 'REPLACING', 'MANUAL']) eq(complaintBlock({ ...base, state: s })?.code, 'STATE', `${s} → STATE（只有收到短信的单能申请）`)
  eq(complaintBlock({ ...base, firstCodeAt: null })?.code, 'NO_CODE', '没有 firstCodeAt → NO_CODE')
  eq(complaintBlock({ ...base, orderPaid: false })?.code, 'NOT_PAID', '订单不是已付款 → NOT_PAID')
  eq(complaintDeadline(T0, 24).toISOString(), '2026-10-01T06:00:00.000Z', '截止 = 首次收码 + 24 小时')
  ok(!JSON.stringify(COMPLAINT_REASONS).match(/hero/i), '原因文案不出现上游名称')
  eq(COMPLAINT_REASONS.map(([k]) => k), ['CODE_INVALID', 'ALREADY_USED', 'NO_SMS', 'OTHER'], '原因四个值与 §5.2 sms_complaints.reason 一致')
  ok(isComplaintReason('CODE_INVALID') && !isComplaintReason('code_invalid') && !isComplaintReason(null), 'isComplaintReason 只认四个大写值')
  eq(complaintReasonText('ALREADY_USED'), '号码已被注册 / 要求二次验证', '原因中文')
  eq(COMPLAINT_DETAIL_MAX, 500, '说明上限 500（sms_complaints.detail VARCHAR(500)）')
  eq(COMPLAINT_AVAILABLE, true, 'S3 起 COMPLAINT_AVAILABLE=true（号码页出现「申请售后」）')
}

console.log('\n— 买家看到的售后状态、放宽受理（不计入次数）、30 天通过次数（E17、§7.5）')
{
  eq([buyerComplaintState('OPEN'), buyerComplaintState('APPROVING'), buyerComplaintState('REFUNDED'), buyerComplaintState('REJECTED')], ['OPEN', 'OPEN', 'REFUNDED', 'REJECTED'], 'APPROVING（管理员正在退款）对买家就是「处理中」')
  eq([...COMPLAINT_PENDING_STATES], ['OPEN', 'APPROVING'], '后台「待处理」含 APPROVING')
  const got = { smsCount: 1, state: 'FINISHED', codeAt: T0 }
  ok(complaintNoResend([{ ...got, canGetAnotherSms: false }]), '收过码的号 canGetAnotherSms=false → 不支持再次收码（放宽受理）')
  ok(!complaintNoResend([{ ...got, canGetAnotherSms: null }]), 'canGetAnotherSms=null（上游没给）→ 照常计数')
  ok(!complaintNoResend([{ ...got, canGetAnotherSms: true }, { smsCount: 0, state: 'CANCELLED', codeAt: null, canGetAnotherSms: false }]), '没收过码的旧号是 false 不算')
  const now = new Date(T0.getTime() + 40 * 86400_000)
  const d = (days: number) => new Date(now.getTime() - days * 86400_000)
  eq(
    passedCount30d(
      [
        { state: 'REFUNDED', handledAt: d(1), noResend: false },
        { state: 'REFUNDED', handledAt: d(29), noResend: false },
        { state: 'REFUNDED', handledAt: d(2), noResend: true },
        { state: 'REFUNDED', handledAt: d(31), noResend: false },
        { state: 'REJECTED', handledAt: d(1), noResend: false },
        { state: 'OPEN', handledAt: null, noResend: false },
      ],
      now,
    ),
    2,
    '30 天内通过 2 次（不支持再次收码的、31 天前的、驳回的、待处理的都不计）',
  )
  eq(COMPLAINT_PASS_LIMIT, 2, '正常受理上限 2 次（只提示，不拦）')
  eq(upstreamAppealDeadline(T0).toISOString(), '2026-10-07T06:00:00.000Z', '上游申诉截止 = 取号时刻 + 7 天')
}

console.log('\n— 通过 / 驳回写给买家的订单留言')
{
  const a = approveMessageText(122, 50, null)
  ok(a.startsWith('售后审核通过：本单实付 ¥1.72 已整单退回你的余额（充值余额 +¥1.22 · 返现余额 +¥0.50）'), '通过：实付总额与两格拆分', a)
  ok(a.includes('不能提现、不退回支付宝') && a.includes('下次购买可直接抵扣'), '通过：写明不能提现、不退回支付宝、下次可抵扣')
  ok(!approveMessageText(170, 0, null).includes('返现余额'), '只有充值格时不写返现余额')
  ok(approveMessageText(170, 0, '  已核实  ').endsWith('\n客服备注：已核实'), '通过备注附在最后（去空白）')
  const r = rejectMessageText('  号码已用于注册成功，不属于售后范围  ')
  ok(r.startsWith('售后申请未通过：号码已用于注册成功，不属于售后范围') && r.includes('截图请用微信发送'), '驳回：回复 + 可以继续留言 / 微信', r)
  ok(!/hero/i.test(a + r), '留言不出现上游名称')
}

console.log('\n— 记录页：tab、日期、号码搜索（§1.11）')
{
  eq(RECORD_TABS.map(([k]) => k), ['all', 'active', 'done', 'cancelled', 'closed'], '五个 tab')
  eq(RECORD_TABS.map(([, l]) => l), ['全部', '进行中', '已完成', '已退回', '未支付'], 'tab 名称')
  const all = ['PENDING_PAY', 'CLOSED', 'READY', 'ACQUIRING', 'WAITING', 'REPLACING', 'CANCELLING', 'RECEIVED', 'FINISHED', 'REFUNDING', 'CANCELLED', 'REFUNDED', 'MANUAL']
  eq(all.map(recordTabOf), ['active', 'closed', 'active', 'active', 'active', 'active', 'active', 'active', 'done', 'active', 'cancelled', 'cancelled', 'active'], '13 个状态各归一个 tab：CLOSED 进「未支付」，不混进「已退回」')
  ok(all.every((s) => (recordStatesOf(recordTabOf(s)) ?? []).includes(s)), 'recordStatesOf 与 recordTabOf 互为一致')
  eq(recordStatesOf('all'), null, '全部 = 不按状态筛')
  ok(RECORD_ACTIVE_STATES.includes('PENDING_PAY') && RECORD_ACTIVE_STATES.includes('RECEIVED') && !RECORD_ACTIVE_STATES.includes('FINISHED'), '「进行中」含待支付（含余额已预扣）与已收码，不含已完成')
  eq([parseRecordTab('done'), parseRecordTab('xx'), parseRecordTab(null)], ['done', 'all', 'all'], 'tab 参数：认不出按全部')
  eq([parseRecordDays('7'), parseRecordDays('90'), parseRecordDays('365'), parseRecordDays(null)], [7, 90, 30, 30], '日期：只收 7 / 30 / 90，默认 30')
  eq(phoneQuery('+62 812 3456 7890'), { digits: '6281234567890', like: '%6281234567890%' }, '完整号（带 + 与空格）→ 只取数字，包含匹配')
  eq(phoneQuery('7890'), { digits: '7890', like: '%7890' }, '后 4 位 → 以它结尾')
  eq(phoneQuery('812-3456'), { digits: '8123456', like: '%8123456%' }, '本地号片段 → 包含')
  eq(phoneQuery('789'), 'SHORT', '不到 4 位 → SHORT（接口 400）')
  eq(phoneQuery('  '), null, '空 → 不筛')
  eq(phoneQuery("7890%' OR 1=1 --"), { digits: '789011', like: '%789011%' }, '非数字一律丢掉（LIKE 里不会出现 % 以外的通配或引号）')
  eq([payModeShort('BALANCE'), payModeShort('MIXED'), payModeShort('ALIPAY')], ['余额', '余额 + 支付宝', '支付宝'], '付款方式小字')
}

console.log('\n— 记录页每行的状态文字、/jiema 进行中提示条（§1.11、§1.4）')
{
  const now = Date.parse('2026-09-30T06:00:00.000Z')
  const r = (o: Partial<RecordLike>): RecordLike => ({ state: 'WAITING', payMode: 'ALIPAY', priceCents: 170, code: null, deadline: null, refundCents: null, releasedCents: null, lateCents: 0, complaint: null, ...o })
  eq(recordStatusText(r({ state: 'CLOSED' }), now), { label: '未支付 · 已关闭', tone: 'gray', extra: null }, '纯支付宝的关闭单：「未支付 · 已关闭」，不写「已退回」')
  eq(recordStatusText(r({ state: 'CLOSED', payMode: 'MIXED', releasedCents: 120 }), now).label, '未支付 · 已关闭 · 预扣已退回', '用过余额的关闭单：加「预扣已退回」')
  eq(recordStatusText(r({ state: 'CLOSED', lateCents: 52 }), now).label, '未支付 · 已关闭 · 付款已退回余额', '关单后有到账退入：加「付款已退回余额」')
  eq(recordStatusText(r({ state: 'CANCELLED', priceCents: 225, refundCents: 225 }), now), { label: '已取消', tone: 'gray', extra: '¥2.25 已退回余额' }, '已取消：「¥2.25 已退回余额」')
  eq(recordStatusText(r({ state: 'REFUNDED', refundCents: 172 }), now).extra, '¥1.72 已退回余额', '售后退款：按实际退回（含识别尾差）')
  eq(recordStatusText(r({ deadline: new Date(now + 751_000).toISOString() }), now), { label: '等待短信', tone: 'amber', extra: '12:31' }, '等码：倒计时 12:31')
  eq(recordStatusText(r({ state: 'PENDING_PAY', payMode: 'BALANCE' }), now).label, '正在确认付款', '余额付清单停在待支付：「正在确认付款」')
  eq(recordStatusText(r({ state: 'PENDING_PAY', payMode: 'MIXED', deadline: new Date(now + 60_000).toISOString() }), now).extra, '1:00 内完成付款', '组合单待支付：收银台倒计时')
  eq(recordStatusText(r({ state: 'FINISHED', code: '482917' }), now).extra, '482917', '已完成：显示验证码')
  eq(recordStatusText(r({ state: 'WAITING', deadline: new Date(now - 1000).toISOString() }), now).extra, null, '倒计时已过 → 不显示负数')
  const b = (o: Partial<RecordLike>) => bannerText({ ...r(o), serviceName: 'Telegram', countryName: '印度尼西亚' }, now)
  eq(b({ deadline: new Date(now + 751_000).toISOString() }), 'Telegram · 印度尼西亚 · 剩余 12:31', '提示条：等码带倒计时')
  eq(b({ state: 'RECEIVED', code: '482917' }), 'Telegram · 印度尼西亚 · 验证码 482917', '提示条：收码带验证码')
  eq(b({ state: 'PENDING_PAY', payMode: 'MIXED', deadline: new Date(now + 1_122_000).toISOString() }), 'Telegram · 印度尼西亚 · 18:42 内完成付款', '提示条：待支付带收银台倒计时')
  eq(b({ state: 'PENDING_PAY', payMode: 'BALANCE', deadline: new Date(now + 60_000).toISOString() }), 'Telegram · 印度尼西亚', '余额付清单不催付款')
  ok(b({ state: 'READY' }).includes('开始接码'), 'READY：提示去点「开始接码」或取消退回余额')
}

console.log('\n— 客服页 #jiema 与 /jiema 的 FAQ、规则一览（§8.3；§12.3 第 73、126 条）')
{
  const p = { maxReplace: 5, complaintWindowH: 24, topup: { tiersCents: [500, 1000, 1500, 2000, 5000], minCents: 100, maxCents: 100_000 }, hours: PLATFORM_CONTACT.hours }
  const f = jiemaFaqs(p)
  eq(f.length, 13, '13 条问答')
  const all = JSON.stringify(f)
  ok(!/hero|herosms/i.test(all), '不出现上游名称')
  ok(f[12].q === '能开发票或收据吗？' && f[12].a.startsWith('余额充值与短信接码订单（不论用余额还是支付宝付款）暂不支持自助开票，可联系客服开票处理'), 'FAQ 13：开票范围是「余额充值与短信接码订单（不论用余额还是支付宝付款）」')
  ok(!all.includes('充值与用余额支付的订单') && !all.includes('充值与余额消费'), '没有只覆盖一部分的旧说法（§12.3 第 73 条）')
  ok(f[12].a.includes('充值请加微信客服') && f[12].a.includes('号码页「联系客服」'), 'FAQ 13：接码单在线留言、充值走微信（充值单没有订单留言）')
  ok(f[1].a.includes('不能提现、不退回支付宝') && f[5].a.includes('不能提现、不退回支付宝'), 'FAQ 2 与 FAQ 6 都写了「不能提现、不退回支付宝」')
  ok(f[1].a.includes('约 1 小时内到账') && f[1].a.includes('通常 1 分钟内到账'), 'FAQ 2：到账时限与 D3 / E20 一致')
  ok(f[4].a.includes('档位 ¥5 / 10 / 15 / 20 / 50') && f[4].a.includes('目前 ¥1–1,000'), 'FAQ 5：档位与单笔上下限取 wallet_config')
  ok(jiemaFaqs({ ...p, topup: { tiersCents: [1000, 3000], minCents: 500, maxCents: 50_000 } })[4].a.includes('档位 ¥10 / 30') && jiemaFaqs({ ...p, topup: { tiersCents: [1000], minCents: 500, maxCents: 50_000 } })[4].a.includes('目前 ¥5–500'), 'FAQ 5：后台改了档位 / 上下限，文案跟着变')
  ok(jiemaFaqs({ ...p, topup: null })[4].a.startsWith('余额充值即将开放'), 'FAQ 5：充值没开放 → 「即将开放」（不说一件还不存在的事）')
  ok(f[0].a.includes('免费换 5 次') && jiemaFaqs({ ...p, maxReplace: 3 })[0].a.includes('免费换 3 次'), 'FAQ 1：换号次数取 sms_config.maxReplace')
  ok(f[10].a.includes('收到短信后 24 小时内') && jiemaFaqs({ ...p, complaintWindowH: 48 })[10].a.includes('收到短信后 48 小时内'), 'FAQ 11：售后窗口取 complaintWindowH')
  ok(f[10].a.includes('截图请发微信客服') && f[10].a.includes('结果会写在订单留言里'), 'FAQ 11：截图走微信、结果在订单留言')
  ok(f[11].a.includes('9:00–22:00') && f[11].a.includes('能自动确认的，通常到账后几分钟内'), 'FAQ 12：迟到到账的说法与号码页 CLOSED 卡片一致（§12.3 第 119 条）')
  const rules = jiemaSupportRules(p)
  ok(rules.includes('暂不支持开票，可联系客服开票处理') && rules.some((x) => x.includes('免费换号 5 次')) && rules.some((x) => x.includes('收码后 24 小时内')), '规则一览：开票一句、换号次数、售后窗口')
  ok(rules.some((x) => x.includes('不能提现、不退回支付宝')), '规则一览：退回的余额不能提现、不退回支付宝')
  eq(supportFaqs(PLATFORM_CONTACT).length, 8, '原来的 8 条客服 FAQ 不变（接码问答另起一组，不塞进 supportFaqs）')
}

console.log('\n— 买家 DTO 不泄露成本字段（附录 B 第 7 条）')
{
  const rec: JiemaRecordItem = {
    orderNo: '2026093000000001',
    state: 'FINISHED',
    service: { code: 'tg', name: 'Telegram' },
    country: { id: 6, name: '印度尼西亚', iso2: 'ID' },
    operator: null,
    priceCents: 170,
    payMode: 'ALIPAY',
    number: { dial: '62', national: '81234567890', seq: 1 },
    code: '482917',
    smsCount: 1,
    createdAt: T0.toISOString(),
    deadline: null,
    refundCents: null,
    releasedCents: null,
    lateCents: 0,
    complaint: 'OPEN',
  }
  const keys = collectKeyNames(toJiemaRecordItem({ ...rec, ...({ costCents: 12, capMicro: 1, note: 'x' } as object) } as JiemaRecordItem))
  ok(FORBIDDEN_BUYER_KEYS.every((k) => !keys.has(k)), '记录行白名单：多塞的 costCents / capMicro / note 不出')
  const v = {
    complaint: { state: 'REJECTED', reason: 'OTHER', reasonText: '其他', detail: 'x', reply: '不属于售后范围', createdAt: T0.toISOString(), handledAt: null, adminNote: '内部', handledBy: 9 },
    complainUntil: null,
  } as unknown as Partial<JiemaOrderView>
  const vv = toJiemaOrderView({ ...(minimalView() as JiemaOrderView), ...v })
  const vk = collectKeyNames(vv)
  ok(FORBIDDEN_BUYER_KEYS.every((k) => !vk.has(k)) && !vk.has('adminNote') && !vk.has('handledBy'), '号码页视图的 complaint：只有白名单字段（没有 adminNote / handledBy / note）')
  eq(vv.complaint?.reply, '不属于售后范围', '驳回的回复给买家（reply）')
}

function minimalView(): JiemaOrderView {
  return {
    orderNo: 'x',
    orderId: 1,
    state: 'FINISHED',
    version: 0,
    service: { code: 'tg', name: 'T' },
    country: { id: 6, name: 'I', iso2: null, dial: null },
    operator: null,
    priceCents: 1,
    pay: { mode: 'ALIPAY', balanceCents: 0, balanceTopupCents: 0, balanceCashCents: 0, alipayCents: 1, alipayPaidCents: 1, holdState: null },
    quoteExpiresAt: null,
    cashierUrl: null,
    cashierExpiresAt: null,
    createdAt: T0.toISOString(),
    progress: null,
    number: null,
    replace: { used: 0, left: 5 },
    messages: [],
    history: [],
    refund: null,
    lateCredits: [],
    replaceBlocked: null,
    actions: { pay: false, close: false, replace: false, cancel: false, finish: false, start: false, refundReady: false, complain: false, message: true },
    complaint: null,
    complainUntil: null,
    notice: null,
    serverNow: T0.toISOString(),
    pollMs: 0,
  }
}

console.log(`\n通过 ${pass} 条，失败 ${fail} 条`)
if (fail) {
  console.log('有失败 ❌')
  process.exit(1)
}
console.log('全部通过 ✅')
