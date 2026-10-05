/**
 * 微信机器人 · 查询类指令的纯函数自测（docs/微信机器人-设计.md §7.2、§7.3、§7.5，附录 B 第 2、3、15 条）。**不连数据库**。
 *   npx tsx scripts/check-bot-query.ts
 *
 * 覆盖：参数解析（订单号 / 邮箱 / 尾号的判别、利润的期间与货号、提卡记录的日期、统计窗口的北京时间边界）、会话 → 数据范围、
 * 卡密打码（首尾最多 4 位、至少藏一半）、回复文本（首行写明指令、≤ 900 字、分站群不出邮箱与平台后台链接、不出兑换链接）、
 * 指令表约束（名字与别名不撞、只有「订单」进分站群、都是 T1、参数不对回用法）。
 * 特殊字符一律用 String.fromCharCode 拼，源码里不出现不可见字符。
 */
import {
  classifyOrderArg,
  fitBest,
  parseDateArg,
  parseProfitArgs,
  periodWindow,
  QUERY_COMMANDS,
  renderCardsReply,
  renderIssuesReply,
  renderOrderReply,
  renderProductsReply,
  renderProfitReply,
  renderSettleReply,
  renderSiteDetailReply,
  renderSiteListReply,
  renderStockDetailReply,
  renderTodoReply,
  renderUnmatchedReply,
  scopeOf,
  usageOf,
  type OrderRenderOpts,
} from '../src/lib/bot/commands/query'
import { maskCardSecret, type OrderCards } from '../src/lib/bot/data/cards'
import { tenantBlacklistHit } from '../src/lib/bot/mask'
import { MAX_MESSAGE_CHARS } from '../src/lib/bot/render'
import type { BotCommandDef, CmdConversation } from '../src/lib/bot/commands/types'
import type { OrderBrief, OrderLookupResult } from '../src/lib/bot/data/orders'
import type { TodoSnapshot } from '../src/lib/bot/data/todo'
import type { ProfitResult, ProductProfit } from '../src/lib/bot/data/profit'
import type { SiteInfo } from '../src/lib/bot/data/sites'

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
  const g = JSON.stringify(got)
  const w = JSON.stringify(want)
  ok(name, g === w, `得到 ${g}，应为 ${w}`)
}

const IDSP = String.fromCharCode(0x3000) // 全角空格
const FW = (s: string) => Array.from(s).map((c) => (c >= '!' && c <= '~' ? String.fromCharCode(c.charCodeAt(0) + 0xfee0) : c)).join('') // 半角 → 全角
const len = (s: string) => Array.from(s).length
const firstLine = (s: string) => s.split('\n')[0]

async function main() {
  console.log('\n订单参数的判别：')
  {
    eq('完整订单号', classifyOrderArg('20261005K3F9Q2AB'), { kind: 'no', orderNo: '20261005K3F9Q2AB' })
    eq('小写订单号转大写', classifyOrderArg('20261005k3f9q2ab'), { kind: 'no', orderNo: '20261005K3F9Q2AB' })
    eq('全角订单号转半角', classifyOrderArg(FW('20261005K3F9Q2AB')), { kind: 'no', orderNo: '20261005K3F9Q2AB' })
    eq('照抄用法带了尖括号', classifyOrderArg('<20261005K3F9Q2AB>'), { kind: 'no', orderNo: '20261005K3F9Q2AB' })
    eq('随机部分不足 8 位的老订单号', classifyOrderArg('20261005K3F9'), { kind: 'no', orderNo: '20261005K3F9' })
    eq('后 6 位', classifyOrderArg('k3f9q2'), { kind: 'suffix', suffix: 'K3F9Q2' })
    eq('6 位纯数字也按尾号', classifyOrderArg('123456'), { kind: 'suffix', suffix: '123456' })
    eq('邮箱（保留原样，库里按不区分大小写比对）', classifyOrderArg('Abc.D@QQ.com'), { kind: 'email', email: 'Abc.D@QQ.com' })
    eq('邮箱缺域名后缀 → 不认', classifyOrderArg('abc@qq'), null)
    eq('5 位 → 不认', classifyOrderArg('K3F9Q'), null)
    eq('7 位 → 不认（既不是尾号也不是完整单号）', classifyOrderArg('K3F9Q2A'), null)
    eq('日期写法 → 不认', classifyOrderArg('2026-10-05'), null)
    eq('太长 → 不认', classifyOrderArg('20261005K3F9Q2ABC'), null)
    eq('带符号 → 不认', classifyOrderArg('20261005K3F9;--'), null)
    eq('空 → 不认', classifyOrderArg(''), null)
  }

  console.log('\n利润的参数：')
  {
    eq('不带参数 = 今日、全部商品', parseProfitArgs([]), { code: null, period: 'today' })
    eq('只带货号（转大写）', parseProfitArgs(['gpt1']), { code: 'GPT1', period: 'today' })
    eq('只带期间', parseProfitArgs(['本周']), { code: null, period: 'week' })
    eq('货号 + 期间', parseProfitArgs(['GPT1', '本月']), { code: 'GPT1', period: 'month' })
    eq('期间 + 货号（顺序不限）', parseProfitArgs(['昨天', 'GPT1']), { code: 'GPT1', period: 'yesterday' })
    eq('今天 = 今日', parseProfitArgs(['今天']), { code: null, period: 'today' })
    eq('两个期间 → 用法', parseProfitArgs(['本周', '本月']), null)
    eq('两个货号 → 用法', parseProfitArgs(['A1', 'B2']), null)
    eq('三个参数 → 用法', parseProfitArgs(['A1', '本周', 'x']), null)
    eq('货号格式不对 → 用法', parseProfitArgs(['G!']), null)
    eq('货号超过 16 位 → 用法', parseProfitArgs(['A'.repeat(17)]), null)
    eq('原型链上的名字不会被当成期间', parseProfitArgs(['constructor']), { code: 'CONSTRUCTOR', period: 'today' })
    eq('货号带方括号、期间带全角括号', parseProfitArgs(['[gpt1]', '（本周）']), { code: 'GPT1', period: 'week' })
  }

  console.log('\n统计窗口（北京时间）：')
  {
    // 2026-10-05 是周一。北京时间 10-05 11:00 = UTC 03:00
    const mon = new Date('2026-10-05T03:00:00Z')
    const t = periodWindow('today', mon)
    eq('今日：从北京 0 点（UTC 前一天 16:00）到现在', [t.from.toISOString(), t.to.toISOString(), t.label], ['2026-10-04T16:00:00.000Z', '2026-10-05T03:00:00.000Z', '今日（10-05）'])
    const y = periodWindow('yesterday', mon)
    eq('昨日：昨天整天', [y.from.toISOString(), y.to.toISOString(), y.label], ['2026-10-03T16:00:00.000Z', '2026-10-04T16:00:00.000Z', '昨日（10-04）'])
    const wk = periodWindow('week', mon)
    eq('本周（周一当天）从当天 0 点起', [wk.from.toISOString(), wk.label], ['2026-10-04T16:00:00.000Z', '本周（10-05 起）'])
    // 北京时间 10-04 23:30（周日）= UTC 15:30
    const sun = new Date('2026-10-04T15:30:00Z')
    eq('本周（周日）从上周一起', periodWindow('week', sun).from.toISOString(), '2026-09-27T16:00:00.000Z')
    // UTC 还是 10-04、北京已是 10-05 01:00：按北京算是周一
    const early = new Date('2026-10-04T17:00:00Z')
    eq('UTC 与北京跨日时按北京日历', [periodWindow('today', early).label, periodWindow('week', early).from.toISOString()], ['今日（10-05）', '2026-10-04T16:00:00.000Z'])
    const m = periodWindow('month', mon)
    eq('本月从 1 日 0 点起', [m.from.toISOString(), m.label], ['2026-09-30T16:00:00.000Z', '本月（10-01 起）'])
    eq('1 日当天的本月', periodWindow('month', new Date('2026-09-30T16:30:00Z')).from.toISOString(), '2026-09-30T16:00:00.000Z')
  }

  console.log('\n提卡记录的日期：')
  {
    const now = new Date('2026-10-05T03:00:00Z')
    eq('缺省今天', parseDateArg(undefined, now), '2026-10-05')
    eq('月-日', parseDateArg('10-05', now), '2026-10-05')
    eq('不补零的月/日', parseDateArg('9/8', now), '2026-09-08')
    eq('年-月-日', parseDateArg('2026-10-05', now), '2026-10-05')
    eq('全角写法', parseDateArg(FW('2026-10-05'), now), '2026-10-05')
    eq('昨天', parseDateArg('昨天', now), '2026-10-04')
    eq('今日', parseDateArg('今日', now), '2026-10-05')
    eq('1 月初查「12-30」= 去年', parseDateArg('12-30', new Date('2027-01-02T01:00:00Z')), '2026-12-30')
    eq('北京已跨年、UTC 还没跨：按北京算', parseDateArg('12-31', new Date('2026-12-31T17:00:00Z')), '2026-12-31')
    eq('不存在的日期', parseDateArg('2-30', now), null)
    eq('平年 2-29', parseDateArg('2026-02-29', now), null)
    eq('月份越界', parseDateArg('13-01', now), null)
    eq('乱写', parseDateArg('abc', now), null)
    eq('带时间', parseDateArg('10-05 12:00', now), null)
  }

  console.log('\n会话 → 数据范围：')
  {
    const conv = (kind: CmdConversation['kind']): CmdConversation => ({ id: 1, kind, tenantId: null, allowT3: false, externalId: 'x', isGroup: true, name: null })
    eq('分站群 = 本站', scopeOf({ conv: conv('TENANT'), scopeTenantId: 5 }), { tenantId: 5 })
    eq('分站群没有分站 → 拒绝（不退化成全站）', scopeOf({ conv: conv('TENANT'), scopeTenantId: null }), null)
    eq('分站群的分站是主站 id → 拒绝', scopeOf({ conv: conv('TENANT'), scopeTenantId: 1 }), null)
    eq('管理群 = 全部', scopeOf({ conv: conv('MGMT'), scopeTenantId: null }), { tenantId: null })
    eq('私聊 = 全部', scopeOf({ conv: conv('DM'), scopeTenantId: null }), { tenantId: null })
    eq('管理群却带分站范围 → 拒绝', scopeOf({ conv: conv('MGMT'), scopeTenantId: 5 }), null)
    eq('未登记的群 → 拒绝', scopeOf({ conv: conv(null), scopeTenantId: null }), null)
  }

  console.log('\n卡密打码：')
  {
    eq('17 位：首尾各 4 位（与推送里疑似卡密的打码一致）', maskCardSecret('9D8WA-AVOBY-PJ5P5'), '9D8W…J5P5')
    eq('16 位：首尾各 4 位', maskCardSecret('ABCDEFGHIJKLMNOP'), 'ABCD…MNOP')
    eq('12 位：首尾各 3 位（至少藏一半）', maskCardSecret('ABCDEFGHIJKL'), 'ABC…JKL')
    eq('8 位：首尾各 2 位', maskCardSecret('ABCDEFGH'), 'AB…GH')
    eq('不到 8 位：一个都不露', maskCardSecret('ABCDEFG'), '…')
    eq('空', maskCardSecret(''), '…')
    eq('多行卡（账号 / 密码）先压成一行', maskCardSecret('user@x.com\npassword123'), 'user…d123')
    let allOk = true
    let sample = ''
    for (let n = 1; n <= 80; n++) {
      const plain = Array.from({ length: n }, (_, i) => String.fromCharCode(65 + ((i * 7 + n) % 26))).join('')
      const m = maskCardSecret(plain)
      const shown = len(m) - 1 // 去掉「…」
      if (!m.includes('…') || shown > Math.min(8, Math.floor(n / 2)) || (n >= 16 && shown !== 8) || m === plain) {
        allOk = false
        sample = `${n} 位 → ${m}`
        break
      }
    }
    ok('任意长度：露出的字符不超过一半、不超过 8 个，16 位以上恰好首尾各 4', allOk, sample)
    ok('露出部分不含完整原文', !maskCardSecret('9D8WA-AVOBY-PJ5P5').includes('AVOBY'))
  }

  // ---------------------------------------------------------------------------------------------
  // 回复文本
  // ---------------------------------------------------------------------------------------------
  const T0 = new Date('2026-10-05T06:32:00Z') // 北京 14:32
  const brief = (over: Partial<OrderBrief> = {}): OrderBrief => ({
    id: 123,
    orderNo: '20261005K3F9Q2AB',
    tenantId: 1,
    productName: 'ChatGPT Plus 月卡',
    botCode: 'GPT1',
    deliveryType: 'AUTO',
    quantity: 1,
    amountCents: 15000,
    invoiceTaxCents: null,
    payStatus: 'PAID',
    deliveryStatus: 'DELIVERED',
    createdAt: T0,
    paidAt: T0,
    deliveredAt: T0,
    cardsSent: 1,
    userEmail: 'abcdef@qq.com',
    remark: '支付方式: 支付宝 联系 13812345678',
    unreadForAdmin: 2,
    ...over,
  })
  const mgmtOpt: OrderRenderOpts = { platform: true, adminOrigin: 'https://bigolab.com', channelOrigin: null, sites: new Map([[5, { code: 'mysticboy', name: 'Tibo AI 商店' }]]) }
  const tenantOpt: OrderRenderOpts = { platform: false, adminOrigin: 'https://bigolab.com', channelOrigin: 'https://tibo.pw', sites: new Map() }

  console.log('\n订单的回复：')
  {
    const one: OrderLookupResult = { total: 1, list: [brief()] }
    const m = renderOrderReply(one, { kind: 'no', orderNo: '20261005K3F9Q2AB' }, mgmtOpt)
    ok('管理群：首行写明「订单」', firstLine(m) === '🔎 订单｜20261005K3F9Q2AB', firstLine(m))
    ok('管理群：邮箱打码', m.includes('ab***@qq.com') && !m.includes('abcdef@qq.com'), m)
    ok('管理群：备注里的手机号打码', m.includes('138****5678') && !m.includes('13812345678'), m)
    ok('管理群：平台后台深链（/admin/orders?orderId=）', m.endsWith('后台：https://bigolab.com/admin/orders?orderId=123'), m)
    ok('管理群：金额与时间格式', m.includes('金额：¥150.00') && m.includes('下单 10-05 14:32'), m)
    ok('管理群：不给卡密，只提示用「查卡」', m.includes('卡密已发 1/1 张') && m.includes('@贝果助手 查卡 20261005K3F9Q2AB'), m)
    ok('管理群：渠道单标「站名（代码）」', renderOrderReply({ total: 1, list: [brief({ tenantId: 5 })] }, { kind: 'no', orderNo: '20261005K3F9Q2AB' }, mgmtOpt).includes('站点：Tibo AI 商店（mysticboy）'))
    // 备注里的网址正好跨过截断点：先中性化再截断，残留的半截网址也点不了
    const longUrl = renderOrderReply({ total: 1, list: [brief({ remark: `${'备'.repeat(70)} https://evil-phishing-site.com/login 卡 9D8WA-AVOBY-PJ5P5` })] }, { kind: 'no', orderNo: '20261005K3F9Q2AB' }, mgmtOpt)
    ok('管理群：备注截断处落在网址中间也不留可点的网址', !/https?:\/\//.test(longUrl.split('\n').filter((l) => l.startsWith('备注')).join('')), longUrl)

    // 分站群：即使数据层哪天多给了邮箱 / 备注，文本里也不能出现
    const leak = brief({ tenantId: 5, productName: '月卡 owner@corp.com', userEmail: 'abcdef@qq.com', remark: '找 abcdef@qq.com' })
    const t = renderOrderReply({ total: 1, list: [leak] }, { kind: 'no', orderNo: '20261005K3F9Q2AB' }, tenantOpt)
    ok('分站群：首行写明「订单」', firstLine(t) === '🔎 订单｜20261005K3F9Q2AB', firstLine(t))
    ok('分站群：不出现任何邮箱', !/@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(t) && !t.includes('***@'), t)
    ok('分站群：不出现平台后台链接，只给渠道后台', !t.includes('/admin') && t.endsWith('渠道后台：https://tibo.pw/partner/orders/20261005K3F9Q2AB'), t)
    ok('分站群：不出现备注、站点、货号', !t.includes('备注') && !t.includes('站点') && !t.includes('GPT1'), t)
    ok('分站群：过得了出队前的黑名单扫描', tenantBlacklistHit(t) === null, String(tenantBlacklistHit(t)))
    ok('分站群：取不到渠道域名就不带链接', !renderOrderReply({ total: 1, list: [leak] }, { kind: 'no', orderNo: '20261005K3F9Q2AB' }, { ...tenantOpt, channelOrigin: null }).includes('http'))
    eq('分站群：查不到时不区分「别站的单」与「不存在」', renderOrderReply({ total: 0, list: [] }, { kind: 'no', orderNo: '20261005K3F9Q2AB' }, tenantOpt), '🔎 订单｜本站没有订单 20261005K3F9Q2AB')

    const many: OrderLookupResult = { total: 7, list: [1, 2, 3, 4, 5].map((i) => brief({ id: 100 + i, orderNo: `2026100${i}AAAAAAAA`, tenantId: i === 2 ? 5 : 1 })), userFound: true }
    const l = renderOrderReply(many, { kind: 'email', email: 'abcdef@qq.com' }, mgmtOpt)
    ok('多条：首行写明查询方式与总数（邮箱打码）', firstLine(l) === '🔎 订单｜邮箱 ab***@qq.com：共 7 单，列最近 5 单', firstLine(l))
    ok('多条：最多 5 条、每条带后台链接', (l.match(/^· /gm) || []).length === 5 && (l.match(/\/admin\/orders\?orderId=/g) || []).length === 5, l)
    ok('多条：渠道单标代码', l.includes('［mysticboy］'), l)
    ok('多条：≤ 900 字', len(l) <= MAX_MESSAGE_CHARS, String(len(l)))
    eq('邮箱没有注册', renderOrderReply({ total: 0, list: [], userFound: false }, { kind: 'email', email: 'abcdef@qq.com' }, mgmtOpt), '🔎 订单｜没有用 ab***@qq.com 注册的用户')
    eq('尾号查不到', renderOrderReply({ total: 0, list: [] }, { kind: 'suffix', suffix: 'K3F9Q2' }, mgmtOpt), '🔎 订单｜最近 90 天没有订单号以 K3F9Q2 结尾的订单')
  }

  console.log('\n查卡的回复：')
  {
    const cards = (n: number, logs: number, msgLen: number): OrderCards => ({
      order: { id: 123, orderNo: '20261005K3F9Q2AB', tenantId: 1, productName: 'ChatGPT Plus 月卡', quantity: n, payStatus: 'PAID', deliveryStatus: 'DELIVERED', deliveryType: 'AUTO' },
      totalCards: n + 2,
      cards: Array.from({ length: n }, (_, i) => ({
        masked: maskCardSecret(`CARD${i}-AVOBY-PJ5P5-XYZ`),
        status: 'USED',
        usedAt: T0,
        batch: 'bot-20261005-1432',
        redeemProvider: 'sysa',
        redeem: Array.from({ length: logs }, () => ({ at: T0, action: 'ACTIVATE', state: 'COMPLETED', provider: 'sysa', message: '说'.repeat(msgLen) })),
        redeemTotal: logs + 4,
      })),
    })
    const s = renderCardsReply(cards(2, 3, 10), '20261005K3F9Q2AB', { adminOrigin: 'https://bigolab.com', site: null })
    ok('首行写明「查卡」', firstLine(s) === '🎫 查卡｜20261005K3F9Q2AB', firstLine(s))
    ok('只出打码后的卡', s.includes('卡 1：CARD…-XYZ') && !s.includes('AVOBY'), s)
    ok('兑换记录有动作与结果', s.includes('兑换 已完成（sysa）') && s.includes('另有'), s)
    ok('不出兑换链接', !s.includes('cdk=') && !s.includes('/redeem/'), s)
    const big = renderCardsReply(cards(10, 3, 40), '20261005K3F9Q2AB', { adminOrigin: 'https://bigolab.com', site: null })
    ok('10 张卡 × 3 条记录也 ≤ 900 字（换更简略的写法）', len(big) <= MAX_MESSAGE_CHARS + 20 && big.includes('卡 10：'), String(len(big)))
    ok('列不全时注明总张数', big.includes('（共 12 张，只列前 10 张）'), big)
    eq('订单不存在', renderCardsReply(null, '20261005K3F9Q2AB', { adminOrigin: 'https://bigolab.com', site: null }), '🎫 查卡｜没有找到订单 20261005K3F9Q2AB')
  }

  console.log('\n待办的回复：')
  {
    const n5 = <T>(f: (i: number) => T) => Array.from({ length: 5 }, (_, i) => f(i))
    const full: TodoSnapshot = {
      manual: { total: 12, items: n5((i) => ({ orderNo: `2026100${i}MANUAL01`, productName: '很长很长的商品名字'.repeat(3), quantity: 1, amountCents: 15000, at: T0, siteCode: i ? null : 'mysticboy' })) },
      invoice: { total: 6, items: n5((i) => ({ invoiceNo: `INV2026100500${i}`, amountCents: 15900, at: T0, siteCode: null })) },
      message: { total: 9, items: n5((i) => ({ orderNo: `2026100${i}MSG00001`, productName: '商品', unread: 2, at: T0, preview: '说'.repeat(24), siteCode: null })) },
      refund: { total: 7, complaints: 4, legacySms: 3, items: n5((i) => ({ kind: i % 2 ? 'LEGACY_SMS' : 'COMPLAINT', orderNo: `2026100${i}REFUND01`, reason: i % 2 ? 'TIMEOUT' : 'NO_SMS', amountCents: 500, at: T0, siteCode: null })) },
      afterSale: { total: 5, items: n5((i) => ({ requestNo: `AS2610050000000${i}`, kind: 'REFUND', orderNo: `2026100${i}AFTER001`, at: T0, siteCode: 'mysticboy' })) },
    }
    const s = renderTodoReply(full)
    ok('首行写明「待办」与五类数量', firstLine(s) === '📝 待办｜待人工发货 12 · 待开票 6 · 未读留言 9 · 待退款 7 · 售后申请 5', firstLine(s))
    ok('五类都很满也 ≤ 900 字（每类少列几条）', len(s) <= MAX_MESSAGE_CHARS + 20, String(len(s)))
    ok('五类的小标题都在', ['【待人工发货 12】', '【待开票 6】', '【未读留言 9】', '【待退款 7】', '【售后申请 5】'].every((h) => s.includes(h)), s)
    ok('列不全时写「另有」', s.includes('· 另有'), s)
    const few: TodoSnapshot = { ...full, manual: { total: 1, items: full.manual.items.slice(0, 1) }, invoice: { total: 0, items: [] }, message: { total: 0, items: [] }, refund: { total: 0, complaints: 0, legacySms: 0, items: [] }, afterSale: { total: 0, items: [] } }
    const f = renderTodoReply(few)
    ok('只有一类时只列那一类', f.includes('【待人工发货 1】') && !f.includes('【待开票'), f)
    const none: TodoSnapshot = { manual: { total: 0, items: [] }, invoice: { total: 0, items: [] }, message: { total: 0, items: [] }, refund: { total: 0, complaints: 0, legacySms: 0, items: [] }, afterSale: { total: 0, items: [] } }
    ok('全部为 0', renderTodoReply(none).endsWith('都处理完了'))
  }

  console.log('\n其余回复：')
  {
    const prods = renderProductsReply([
      { id: 1, name: 'ChatGPT Plus 月卡', botCode: 'GPT1', deliveryType: 'AUTO', status: 1, priceCents: 15800, unused: 17, avgCostCents: 12000, costMissing: 2 },
      { id: 2, name: 'Claude Pro 月卡', botCode: 'P12', deliveryType: 'AUTO', status: 0, priceCents: 16800, unused: 0, avgCostCents: null, costMissing: 0 },
    ])
    ok('货号：首行与每行字段', firstLine(prods) === '🔖 货号｜可提卡商品 2 个' && prods.includes('GPT1 ChatGPT Plus 月卡｜站价 ¥158.00｜未用 17 张｜均成本 ¥120.00（2 张没录成本）'), prods)
    ok('货号：下架的标出来', prods.includes('P12 Claude Pro 月卡｜站价 ¥168.00｜未用 0 张｜均成本 —｜已下架'), prods)
    const manyProds = renderProductsReply(
      Array.from({ length: 18 }, (_, i) => ({ id: i, name: `很长的商品名字第${i}号`.repeat(2), botCode: `P${i}`, deliveryType: 'AUTO', status: 1, priceCents: 15800, unused: 17, avgCostCents: 12000, costMissing: 3 }))
    )
    ok('货号：商品多时换短写法，18 个都列得下、≤ 900 字', len(manyProds) <= MAX_MESSAGE_CHARS && manyProds.includes('· P17 ') && !manyProds.includes('其余见后台'), String(len(manyProds)))

    const stock = renderStockDetailReply(
      { id: 1, name: 'ChatGPT Plus 月卡', botCode: 'GPT1', deliveryType: 'AUTO', status: 1, priceCents: 15800 },
      { unused: 17, used: 230, disabled: 2, costBuckets: [{ costCents: null, count: 1 }, { costCents: 11800, count: 7 }, { costCents: 12000, count: 9 }], avgCostCents: 11913, lastImport: { at: T0, batch: 'bot-20261005-1432', batchCount: 20 } }
    )
    ok('库存：首行写明商品与货号', firstLine(stock) === '📦 库存｜ChatGPT Plus 月卡（GPT1）', firstLine(stock))
    ok('库存：卡池、成本分布、最近导入', stock.includes('卡池：未用 17 张 · 已用 230 张 · 停用 2 张') && stock.includes('没录成本×1 · ¥118.00×7 · ¥120.00×9（均价 ¥119.13）') && stock.includes('最近一次导入：10-05 14:32 · 批次 bot-20261005-1432（这批 20 张）'), stock)

    const pp = (i: number, over: Partial<ProductProfit> = {}): ProductProfit => ({
      productId: i,
      name: `商品${i}`,
      botCode: i === 1 ? 'GPT1' : null,
      deliveryType: 'AUTO',
      orders: 2,
      quantity: 3,
      amountCents: 10000 - i,
      mainProfitCents: 1000,
      channelProfitCents: null,
      profitCents: 1000,
      unknownOrders: 0,
      ...over,
    })
    const pr: ProfitResult = { rows: Array.from({ length: 12 }, (_, i) => pp(i + 1, i === 2 ? { profitCents: null, mainProfitCents: null, unknownOrders: 1 } : {})), channelTruncated: false }
    const p = renderProfitReply(pr, '今日（10-05）', null)
    ok('利润：首行写明期间', firstLine(p) === '💹 利润｜今日（10-05）', firstLine(p))
    ok('利润：只列前 10 个商品，合计按全部', (p.match(/^· /gm) || []).length === 10 && p.includes('另有 2 个商品没有列出') && p.includes('合计：36 件 / 24 单 · ¥1,199.22 · 利润 ¥110.00（另 1 单利润未知）'), p)
    ok('利润：算不出的写「—」并附口径', p.includes('利润 —') && p.includes('口径：'), p)
    const single = renderProfitReply({ rows: [pp(1, { channelProfitCents: 500, profitCents: 1500 })], channelTruncated: true }, '本周（10-05 起）', { id: 1, name: 'ChatGPT Plus 月卡', botCode: 'GPT1', deliveryType: 'AUTO', status: 1, priceCents: 15800 })
    ok('利润（单个商品）：主站 / 渠道拆分、渠道太多的提示', single.includes('利润：¥15.00（主站 ¥10.00 · 渠道 ¥5.00）') && single.includes('没有计算渠道利润'), single)

    const site = (id: number, status = 'ACTIVE'): SiteInfo => ({ id, code: `s${id}`, name: `站${id}`, internalName: `内部${id}`, customName: true, status, statusLabel: status === 'TERMINATED' ? '已停业' : '营业中', payoutHold: id === 3 })
    const money = { availableCents: 120350, payoutCents: 118545, pendingCents: 38010, inPayoutCents: 0, negative: false, open: [{ statementNo: 'ST2610058F3K9Q2A', state: 'PAYING', netCents: 100000, createdAt: T0, payingOverdue: true }] }
    const st = renderSettleReply([{ site: site(2), money }, { site: site(3), money: { ...money, open: [], negative: true } }], 'https://bigolab.com')
    ok('结算：首行、每站余额、待打款与合计', firstLine(st) === '💳 结算｜2 个分站的余额与待打款' && st.includes('站2（s2）：可结算 ¥1,203.50（预计打款 ¥1,185.45）· 冻结中 ¥380.10') && st.includes('待打款：ST2610058F3K9Q2A 打款中 ¥1,000.00') && st.includes('超过 24 小时') && st.includes('合计：可结算 ¥2,407.00 · 冻结中 ¥760.20 · 待打款 1 张 ¥1,000.00'), st)
    ok('结算：可结算为负、暂停出单', st.includes('可结算为负｜已暂停出结算单'), st)

    const groups = new Map([[2, [{ id: 7, name: '张三代理群 https://evil.com/x', status: 'ACTIVE' }, { id: 9, name: null, status: 'PAUSED' }]]])
    const list = renderSiteListReply([site(2), site(4, 'TERMINATED')], new Map([[2, { created: 6, paid: 4, paidCents: 65200 }]]), groups, '今日（10-05）')
    ok('分站：首行、今日数据、绑定的群', firstLine(list) === '🏪 分站｜1 个分站 · 今日（10-05）' && list.includes('站2（s2） 营业中：下单 6 · 成交 4 · ¥652.00') && list.includes('#9 未命名群（已暂停）'), list)
    ok('分站：群名里的网址中性化（截断落在网址中间也一样）', !list.includes('https://') && !list.includes('evil.com'), list)
    ok('分站：已停业且没绑群的不列', list.includes('另有 1 个已停业的分站没有列出') && !list.includes('站4'), list)
    const manySites = Array.from({ length: 16 }, (_, i) => site(10 + i))
    const manyGroups = new Map(manySites.map((s) => [s.id, [{ id: s.id, name: '某某代理的客户交流群（官方）', status: 'ACTIVE' }]]))
    const ml = renderSiteListReply(manySites, new Map(), manyGroups, '今日（10-05）')
    ok('分站：分站多时群只写编号，16 个都列得下、≤ 900 字', len(ml) <= MAX_MESSAGE_CHARS && ml.includes('站25（s25）') && ml.includes('｜群 #25') && !ml.includes('其余见后台'), `${len(ml)}\n${ml}`)
    const detail = renderSiteDetailReply(site(3), { origin: 'https://tibo.pw', domains: [{ host: 'tibo.pw', primary: true, enabled: true }, { host: 'old.tibo.pw', primary: false, enabled: false }] }, undefined, money, undefined, '今日（10-05）', 'https://bigolab.com')
    ok('分站详情：状态、域名、余额、群、后台链接', detail.includes('状态：营业中（已暂停出结算单与打款）') && detail.includes('域名：tibo.pw（主）、old.tibo.pw（已停用）') && detail.includes('今日（10-05）：下单 0 · 成交 0') && detail.includes('群：未绑定') && detail.endsWith('后台：https://bigolab.com/admin/tenants/3'), detail)

    const um = renderUnmatchedReply(
      {
        total: 3,
        totalCents: 34902,
        items: [
          { at: T0, cents: 15001, reason: 'no_pending_match', repeatForward: false, outTradeNo: null, from: null },
          { at: T0, cents: 9900, reason: 'duplicate_payment', repeatForward: false, outTradeNo: '20261005K3F9Q2AB', from: null },
        ],
      },
      'https://bigolab.com'
    )
    ok('未匹配：首行、原因、单号、另有、后台', firstLine(um) === '💸 未匹配到账｜待核实 3 笔，合计 ¥349.02' && um.includes('¥150.01｜没有对应的待支付单') && um.includes('疑似重复付款（要退款，别补单）｜单号 20261005K3F9Q2AB') && um.includes('另有 1 笔') && um.endsWith('/admin/vmq'), um)

    const iss = renderIssuesReply(
      {
        total: 2,
        list: [{ at: T0, orderNo: '20261005K3F9Q2AB', productName: 'ChatGPT Plus 月卡', botCode: 'GPT1', quantity: 1, unitPriceCents: 15000, amountCents: 15000, costCents: 12000, profitCents: 3000, adminName: '站长' }],
        sum: { quantity: 3, amountCents: 45000, profitCents: 9000, costUnknown: 1 },
      },
      '2026-10-05',
      new Date('2026-10-05T08:00:00Z'),
      'https://bigolab.com'
    )
    ok('提卡记录：首行合计', firstLine(iss) === '🧾 提卡记录｜10-05：2 次 · 3 张 · ¥450.00 · 利润 ¥90.00（1 次成本未知）', firstLine(iss))
    ok('提卡记录：每条时间、货号、数量、单价、金额、利润、管理员、订单号；没有卡与核销链接', iss.includes('· 14:32 GPT1 ChatGPT Plus 月卡 ×1 单价 ¥150.00 金额 ¥150.00 利润 ¥30.00｜站长｜20261005K3F9Q2AB') && !iss.includes('cdk=') && iss.includes('另有 1 次'), iss)
    ok('提卡记录：往年的日期写全', firstLine(renderIssuesReply({ total: 0, list: [], sum: { quantity: 0, amountCents: 0, profitCents: 0, costUnknown: 0 } }, '2025-10-05', new Date('2026-10-05T08:00:00Z'), 'https://bigolab.com')) === '🧾 提卡记录｜2025-10-05 没有提卡')

    const lines = Array.from({ length: 60 }, (_, i) => `第${i}行 ${'内容'.repeat(10)}`)
    const fb = fitBest([lines, lines.slice(0, 10)], '尾行')
    ok('fitBest：详的装不下就换略的', fb.split('\n').length === 11 && fb.endsWith('尾行'), String(fb.split('\n').length))
    ok('fitBest：都装不下就按行截断', fitBest([lines], null).includes('……（其余见后台）'))
  }

  console.log('\n指令表：')
  {
    const names = new Map<string, string>()
    let dup = ''
    QUERY_COMMANDS.forEach((c) => {
      ;[c.name].concat(c.aliases ?? []).forEach((n) => {
        const k = n.toLowerCase()
        if (names.has(k)) dup = `${n}（${names.get(k)} 与 ${c.name}）`
        names.set(k, c.name)
      })
    })
    ok('查询指令之间名字与别名不撞', !dup, dup)
    eq(
      '十条指令都在',
      QUERY_COMMANDS.map((c) => c.name),
      ['分站', '订单', '查卡', '待办', '货号', '库存', '利润', '结算', '未匹配', '提卡记录']
    )
    // 其它会话登记的指令名（core / binding 已有；日报与提卡两包在并行写）
    const others = ['帮助', 'help', '菜单', '?', '？', '状态', 'status', '群列表', '绑定列表', '锁定', '紧急锁定', '设为管理群', '设为主站群', '创建', '绑定分站', '绑定', '解绑', '推送', '订阅', '退订', '免打扰', '今日', 'today', '昨日', 'yesterday', '日报', '本周', '本月', '提卡', '发卡', '补货', '导卡', '上架', '下架', '补发', '改价', '认领', 'claim']
    const clash = others.filter((n) => names.has(n.toLowerCase()))
    ok('不与其它指令（含日报、提卡两包的名字）重名', !clash.length, clash.join('、'))
    ok('都是 T1', QUERY_COMMANDS.every((c) => c.tier === 1))
    ok('只有「订单」能进分站群', QUERY_COMMANDS.filter((c) => c.scopes.includes('TENANT')).map((c) => c.name).join() === '订单')
    ok('都不进未登记的群', QUERY_COMMANDS.every((c) => !c.scopes.includes('UNBOUND')))
    ok('都在管理群与私聊可用', QUERY_COMMANDS.every((c) => c.scopes.includes('MGMT') && c.scopes.includes('DM')))
    ok('帮助齐全（summary / usage）', QUERY_COMMANDS.every((c) => !!c.help.summary && !!c.help.usage && !c.help.usage.startsWith('@')))
    const tooMany = Array.from({ length: 8 }, (_, i) => `x${i}`)
    QUERY_COMMANDS.forEach((c) => {
      const r = c.parse(tooMany)
      ok(`「${c.name}」参数太多回用法（以「用法：@贝果助手」开头）`, !r.ok && r.usage.startsWith(`用法：@贝果助手 ${c.name}`), JSON.stringify(r))
    })
    const byName = (n: string) => QUERY_COMMANDS.find((c) => c.name === n) as BotCommandDef<any>
    ok('「订单」没有参数回用法', !byName('订单').parse([]).ok)
    ok('「订单」一个合法参数可用', byName('订单').parse(['20261005K3F9Q2AB']).ok)
    ok('「查卡」只认完整订单号（不认尾号与邮箱）', !byName('查卡').parse(['K3F9Q2']).ok && !byName('查卡').parse(['a@b.com']).ok && byName('查卡').parse(['20261005K3F9Q2AB']).ok)
    ok('「待办」「结算」「未匹配」「货号」不收参数', ['待办', '结算', '未匹配', '货号'].every((n) => !byName(n).parse(['x']).ok && byName(n).parse([]).ok))
    ok('「库存」货号格式不对回用法', !byName('库存').parse(['G!']).ok && byName('库存').parse(['gpt1']).ok && byName('库存').parse([]).ok)
    eq('「库存」货号去括号、转大写', byName('库存').parse(['<gpt1>']), { ok: true, value: { code: 'GPT1' } })
    ok('「提卡记录」日期不对回用法', !byName('提卡记录').parse(['13-40']).ok && byName('提卡记录').parse(['10-05']).ok && byName('提卡记录').parse([]).ok)
    ok('「分站」站名带空格拼回去', JSON.stringify(byName('分站').parse(['Tibo', 'AI', '商店'])) === JSON.stringify({ ok: true, value: { q: 'Tibo AI 商店' } }))
    eq('usageOf 与「帮助 <指令>」同一种写法', usageOf({ summary: 's', usage: '订单 <订单号>', example: '订单 1' }), '用法：@贝果助手 订单 <订单号>\n例：@贝果助手 订单 1')
    ok('全角空格分隔的参数（解析层已转半角）不影响', byName('利润').parse(['GPT1']).ok && IDSP.length === 1)

    // 与整张注册表一起校验（主会话把 QUERY_COMMANDS 登记进 index.ts 之后，这一项保证不撞名、满足注册表约束）
    try {
      const idx = await import('../src/lib/bot/commands/index')
      const rest = idx.COMMANDS.filter((c) => QUERY_COMMANDS.indexOf(c) < 0)
      let err = ''
      try {
        idx.assertRegistry(rest.concat(QUERY_COMMANDS))
      } catch (e) {
        err = (e as Error).message
      }
      ok('与现有注册表合在一起通过 assertRegistry', !err, err)
    } catch (e) {
      ok('加载 commands/index.ts（注册表）', false, (e as Error).message)
    }
  }

  console.log(`\n${fail ? '❌' : '✅'} 通过 ${pass}，失败 ${fail}`)
  process.exit(fail ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
