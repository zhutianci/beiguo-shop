/**
 * 微信机器人 · 日报与日报类指令的纯函数自测（docs/微信机器人-设计.md §6、附录 A「主站日报」「分站日报」、附录 B 第 13 条）。**不连数据库**。
 *   npx tsx scripts/check-bot-report.ts
 *
 * 覆盖：
 *  - report/text.ts：用固定的指标对象逐字比对一份主站日报（两条）与一份分站日报（一条）；百分比、对比箭头（含前值为 0）、
 *    「）」后的分隔符、可选项为 0 不显示、超长按行切分（续）、指令回复截断与补看说明、分站文本不含站长利润 / 成本、过黑名单扫描。
 *  - report/window.ts：日 / 昨日 / 今日 / 本周 / 本月窗口，跨月、跨年、北京时间零点边界；「日报 <日期>」的日期解析。
 *  - state.ts 的离线分钟累加（日报「机器人运行情况」）。
 * 特殊字符一律用 String.fromCharCode 拼，源码里不出现不可见字符。
 */
import {
  count,
  joinItems,
  mainCoreLines,
  money,
  packMessages,
  pctText,
  renderMainDaily,
  renderMainReply,
  renderTenantDaily,
  renderTenantReply,
  trendText,
  MAIN_HISTORY_NOTE,
  TENANT_HISTORY_NOTE,
  type ChannelSummaryRow,
  type MainReport,
  type TenantReport,
} from '../src/lib/bot/report/text'
import { cnDay, dayWindow, isReportDateSyntax, monthWindow, parseReportDate, todayWindow, weekWindow, windowForDay, yesterdayWindow } from '../src/lib/bot/report/window'
import { MAX_MESSAGE_CHARS } from '../src/lib/bot/render'
import { tenantBlacklistHit } from '../src/lib/bot/mask'
import { addOfflineMinutes, offlineStepMinutes } from '../src/lib/bot/state'

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
  ok(name, g === w, `\n得到 ${g}\n应为 ${w}`)
}
const len = (s: string) => Array.from(s).length
const iso = (d: Date) => d.toISOString()

// 2026-10-05 00:01（北京）= 2026-10-04T16:01Z：零点日报跑的时刻
const NOW = new Date('2026-10-04T16:01:00.000Z')
const W = dayWindow('2026-10-04', NOW)

function mainFixture(): MainReport {
  return {
    siteLabel: '贝果科技',
    window: W,
    historical: false,
    traffic: {
      pv: 1234,
      uv: 456,
      newVisitors: 321,
      sources: [
        { source: 'search', pv: 494 },
        { source: 'ai', pv: 309 },
        { source: 'direct', pv: 247 },
        { source: 'referral', pv: 184 },
      ],
      mobilePv: 777,
    },
    users: { registered: 23, total: 3456 },
    orders: { created: 34, createdUsers: 29, createdPaid: 21, cancelled: 9, unpaid: 2, refunded: 1, paid: 21, paidUsers: 19, amountCents: 345000, taxCents: 1800 },
    profit: { cardCents: 62000, cardUnknownOrders: 2, jiemaCents: 3520, channelCents: 9600, channelUnknownOrders: 0 },
    top: [
      { name: 'ChatGPT Plus 月卡', qty: 12, amountCents: 180000 },
      { name: 'Claude Pro 月卡', qty: 5, amountCents: 84000 },
      { name: 'Claude MAX 5x', qty: 1, amountCents: 52000 },
    ],
    todo: { processing: 2, invoices: 1, unreadOrders: 3, afterSales: 0 },
    lowStock: [{ name: 'Claude MAX 5x', stock: 2 }],
    expiring: {
      count: 6,
      items: [
        { date: '10-05', account: 'ab***@gmail.com', type: 'ChatGPT Plus' },
        { date: '10-06', account: 'zh***@qq.com', type: 'Claude Pro' },
      ],
    },
    others: { topupCount: 3, topupCents: 6000, jiemaOrders: 7, couponsUsed: 4, invoices: 0, receipts: 0, lotteryWins: 0 },
    channels: {
      rows: [
        { name: 'Tibo AI 商店', code: 'mysticboy', created: 6, paid: 4, amountCents: 65200, ownerGoodsCents: 56000, profitCents: 4800, profitUnknown: 0, newCustomers: 5 },
        { name: 'lulu', code: 'lulu', created: 2, paid: 1, amountCents: 15800, ownerGoodsCents: 14000, profitCents: 1200, profitUnknown: 1, newCustomers: 0 },
      ],
      idle: 3,
    },
    compares: [
      { label: '较前日', paid: 20, amountCents: 308036, uv: 470 },
      { label: '较上周同日', paid: 21, amountCents: 363158, uv: 380 },
    ],
    robot: { sent: 86, failed: 0, offlineMinutes: 0 },
  }
}

function tenantFixture(): TenantReport {
  return {
    siteName: 'Tibo AI 商店',
    window: W,
    historical: false,
    traffic: {
      pv: 210,
      uv: 88,
      newVisitors: 61,
      sources: [
        { source: 'search', pv: 84 },
        { source: 'direct', pv: 74 },
        { source: 'referral', pv: 52 },
      ],
      mobilePv: 147,
    },
    trafficSince: '2026-09-20',
    registered: 5,
    orders: { created: 6, createdUsers: 5, createdPaid: 4, cancelled: 2, unpaid: 0, refunded: 0, paid: 4, paidUsers: 4, amountCents: 65200, taxCents: 0 },
    income: { goodsCents: 65200, purchaseCents: 56000, invShareCents: 320, feeCents: 978, otherCents: 0, balanceCents: 9520, payoutCents: 8542 },
    balances: { availableCents: 120350, availablePayoutCents: 108315, pendingCents: 38010 },
    top: [
      { name: 'Claude Pro 月卡', qty: 3 },
      { name: 'ChatGPT Plus 月卡', qty: 1 },
    ],
    todo: { unreadMessages: 1, afterSales: 0, autoDelisted: 0 },
    compares: [{ label: '较前日', paid: 3, amountCents: 50154, uv: null }],
  }
}

console.log('\n格式化：')
{
  eq('件数千分位', count(3456), '3,456')
  eq('金额', money(345000), '¥3,450.00')
  eq('金额（负数）', money(-1200), '-¥12.00')
  eq('金额（0）', money(0), '¥0.00')
  eq('百分比：分母 0', pctText(0, 0), '—')
  eq('百分比：≥ 10% 取整', pctText(21, 34), '62%')
  eq('百分比：< 10% 一位小数', pctText(29, 456), '6.4%')
  eq('百分比：0', pctText(0, 5), '0%')
  eq('百分比：整数不带 .0', pctText(1, 20), '5%')
  eq('百分比：千分之一', pctText(1, 1000), '0.1%')
  eq('对比：相等 → 持平', trendText(100, 100), '持平')
  eq('对比：都为 0 → 持平', trendText(0, 0), '持平')
  eq('对比：前值为 0', trendText(5, 0), '↑（前值为 0）')
  eq('对比：降到 0', trendText(0, 5), '↓100%')
  eq('对比：上升取整', trendText(345000, 308036), '↑12%')
  eq('对比：下降取整', trendText(345000, 363158), '↓5%')
  eq('对比：不足 1% 记 1%', trendText(1001, 1000), '↑1%')
  eq('分隔：普通项「 · 」', joinItems(['a', 'b']), 'a · b')
  eq('分隔：「）」后只用「· 」', joinItems(['卡密 ¥1.00（另 2 单利润未知）', '接码']), '卡密 ¥1.00（另 2 单利润未知）· 接码')
  eq('分隔：斜杠', joinItems(['下单 1', '成交 2'], '/'), '下单 1 / 成交 2')
}

console.log('\n主站日报（附录 A 的数字，两条，逐字）：')
{
  const msgs = renderMainDaily(mainFixture())
  eq('两条', msgs.length, 2)
  eq(
    '第一条：核心数据',
    msgs[0],
    [
      '📊 贝果科技 · 10月4日 日报',
      '【流量】浏览 1,234 · 访客 456（新 321）· 手机 63%',
      '来源：搜索 40% · AI 25% · 直接 20%',
      '【用户】新注册 23 人（累计 3,456）',
      '【订单】下单 34 单 / 29 人（含未付款）· 访客下单率 6.4%',
      '成交 21 单 / 19 人 · 支付转化 62%',
      '成交额 ¥3,450.00 · 客单价 ¥164.29 · 发票税费 ¥18.00',
      '取消/过期 9 单 · 仍未付款 2 单 · 退款 1 单',
      '【利润】卡密 ¥620.00（另 2 单利润未知）· 接码 ¥35.20（预估）· 渠道带来 ¥96.00',
      '【对比】成交额 较前日 ↑12% · 较上周同日 ↓5%',
      '成交单 较前日 ↑5% · 较上周同日 持平',
      '访客 较前日 ↓3% · 较上周同日 ↑20%',
    ].join('\n')
  )
  eq(
    '第二条：明细与待办',
    msgs[1],
    [
      '📊 10月4日 明细',
      '【热销】1. ChatGPT Plus 月卡 ×12 ¥1,800.00',
      '2. Claude Pro 月卡 ×5 ¥840.00',
      '3. Claude MAX 5x ×1 ¥520.00',
      '【待办】待人工发货 2 · 待开票 1 · 未读留言 3 · 售后 0',
      '【库存告警】Claude MAX 5x 剩 2 张',
      '【到期】未来 3 天到期的订阅 6 个',
      '· 10-05 ab***@gmail.com ChatGPT Plus',
      '· 10-06 zh***@qq.com Claude Pro',
      '【其它】充值 3 笔 ¥60.00 · 接码 7 单 · 用券 4 张',
      '【分站】Tibo AI 商店（mysticboy）：下单 6 / 成交 4 / ¥652.00 / 所得货款 ¥560.00 / 利润 ¥48.00 / 新客户 5',
      'lulu（lulu）：下单 2 / 成交 1 / ¥158.00 / 所得货款 ¥140.00 / 利润 ¥12.00（另 1 单未知）/ 新客户 0',
      '其余 3 个分站无动态',
      '【机器人】昨日发送 86 条 · 失败 0 · 离线 0 分钟',
    ].join('\n')
  )
  ok('每条 ≤ 900 字', msgs.every((m) => len(m) <= MAX_MESSAGE_CHARS))

  // 可选项为 0 不显示；全为 0 的【其它】写「无」；没有热销写「无」；没有流量不写来源与手机
  const z = mainFixture()
  z.traffic = { pv: 0, uv: 0, newVisitors: 0, sources: [], mobilePv: 0 }
  z.orders = { created: 0, createdUsers: 0, createdPaid: 0, cancelled: 0, unpaid: 0, refunded: 0, paid: 0, paidUsers: 0, amountCents: 0, taxCents: 0 }
  z.profit = { cardCents: 0, cardUnknownOrders: 0, jiemaCents: 0, channelCents: 0, channelUnknownOrders: 0 }
  z.top = []
  z.lowStock = []
  z.expiring = { count: 0, items: [] }
  z.others = { topupCount: 0, topupCents: 0, jiemaOrders: 0, couponsUsed: 0, invoices: 0, receipts: 0, lotteryWins: 0 }
  z.channels = { rows: [], idle: 2 }
  z.compares = [
    { label: '较前日', paid: 0, amountCents: 0, uv: 0 },
    { label: '较上周同日', paid: 3, amountCents: 500, uv: 9 },
  ]
  z.robot = { sent: 0, failed: 1, offlineMinutes: null }
  const [c0, d0] = renderMainDaily(z)
  eq(
    '空的一天：核心',
    c0,
    [
      '📊 贝果科技 · 10月4日 日报',
      '【流量】浏览 0 · 访客 0（新 0）',
      '【用户】新注册 23 人（累计 3,456）',
      '【订单】下单 0 单 / 0 人（含未付款）',
      '成交 0 单 / 0 人 · 支付转化 —',
      '成交额 ¥0.00 · 客单价 —',
      '取消/过期 0 单',
      '【利润】卡密 ¥0.00 · 接码 ¥0.00（预估）· 渠道带来 ¥0.00',
      '【对比】成交额 较前日 持平 · 较上周同日 ↓100%',
      '成交单 较前日 持平 · 较上周同日 ↓100%',
      '访客 较前日 持平 · 较上周同日 ↓100%',
    ].join('\n')
  )
  eq(
    '空的一天：明细',
    d0,
    [
      '📊 10月4日 明细',
      '【热销】无',
      '【待办】待人工发货 2 · 待开票 1 · 未读留言 3 · 售后 0',
      '【库存告警】无',
      '【到期】未来 3 天没有到期的订阅',
      '【其它】无',
      '【分站】2 个分站均无动态',
      '【机器人】昨日发送 0 条 · 失败 1',
    ].join('\n')
  )

  // 库存告警超过 5 个：只列 5 个 + 「等 N 个」；其它项非 0 时都列
  const s = mainFixture()
  s.lowStock = Array.from({ length: 7 }, (_, i) => ({ name: `商品${i + 1}`, stock: i % 4 }))
  s.others = { topupCount: 1, topupCents: 1000, jiemaOrders: 2, couponsUsed: 3, invoices: 4, receipts: 5, lotteryWins: 6 }
  const d1 = renderMainDaily(s)[1].split('\n')
  ok('库存告警只列 5 个 + 等 7 个', d1.includes('【库存告警】商品1 剩 0 张 · 商品2 剩 1 张 · 商品3 剩 2 张 · 商品4 剩 3 张 · 商品5 剩 0 张 等 7 个'), d1.join(' | '))
  ok('其它各项都列', d1.includes('【其它】充值 1 笔 ¥10.00 · 接码 2 单 · 用券 3 张 · 开票 4 张 · 收据 5 张 · 中奖 6 次'), d1.join(' | '))

  // 分站很多：明细按行切成多条，标题带「（续）」，不丢行，每条 ≤ 900 字
  const many = mainFixture()
  const rows: ChannelSummaryRow[] = Array.from({ length: 40 }, (_, i) => ({
    name: `分站测试名称${i + 1}`,
    code: `ch${i + 1}`,
    created: 10 + i,
    paid: 5 + i,
    amountCents: 123456 + i,
    ownerGoodsCents: 100000 + i,
    profitCents: 20000 + i,
    profitUnknown: i % 3 === 0 ? 1 : 0,
    newCustomers: i,
  }))
  many.channels = { rows, idle: 0 }
  const parts = renderMainDaily(many)
  ok('40 个分站：切成 3 条以上', parts.length >= 3, String(parts.length))
  ok('40 个分站：每条 ≤ 900 字', parts.every((m) => len(m) <= MAX_MESSAGE_CHARS), parts.map(len).join(','))
  ok('40 个分站：续条标题', parts.slice(2).every((m) => m.startsWith('📊 10月4日 明细（续）\n')), parts.map((m) => m.split('\n')[0]).join(' | '))
  ok('40 个分站：一行不丢', rows.every((r) => parts.some((m) => m.includes(`（${r.code}）：`))) && parts.some((m) => m.includes('【机器人】')))
  eq('packMessages：正好装下不切', packMessages('头', ['a'.repeat(10)], '续', 13).length, 1)
  eq('packMessages：多一个字就切', packMessages('头', ['a'.repeat(10), 'b'], '续', 13), ['头\n' + 'a'.repeat(10), '续\nb'])

  // 指令回复：一条，≤ 900 字，补看历史的说明永远保留
  const h = mainFixture()
  h.historical = true
  h.channels = { rows, idle: 0 }
  const reply = renderMainReply(h)
  ok('指令回复 ≤ 900 字', len(reply) <= MAX_MESSAGE_CHARS, String(len(reply)))
  ok('指令回复超长截断并注明', reply.includes('……（其余见后台）'))
  ok('补看历史的说明在最后一行', reply.endsWith(MAIN_HISTORY_NOTE))
  ok('不是补看就没有说明', !renderMainReply(mainFixture()).includes('补看历史'))
  // 截断落在不同位置也不超 900 字（fitLines 追加的「……（其余见后台）」不在它自己的预算里，回复先让出了 10 个字）
  let worst = 0
  for (let k = 0; k <= 40; k++) {
    for (const extra of [0, 3, 6]) {
      const x = mainFixture()
      x.historical = (k + extra) % 2 === 0
      x.channels = { rows: rows.slice(0, k).map((c, i) => ({ ...c, name: `${c.name}${'长'.repeat((i + extra) % 7)}` })), idle: 0 }
      worst = Math.max(worst, len(renderMainReply(x)))
    }
  }
  ok('各种截断位置都 ≤ 900 字', worst <= MAX_MESSAGE_CHARS, String(worst))

  // 今日：标题带截至时刻；访客不比（流量按整天存）；对比标签是同时段
  const t = mainFixture()
  t.window = todayWindow(new Date('2026-10-05T06:32:00.000Z'))
  t.compares = [
    { label: '较昨日同时段', paid: 20, amountCents: 308036, uv: null },
    { label: '较上周同日同时段', paid: 21, amountCents: 363158, uv: null },
  ]
  const tc = mainCoreLines(t)
  ok('今日：对比是同时段、没有访客行', tc.includes('【对比】成交额 较昨日同时段 ↑12% · 较上周同日同时段 ↓5%') && !tc.some((l) => l.startsWith('访客 ')), tc.join(' | '))
  ok('今日：标题', renderMainReply(t).startsWith('📊 贝果科技 · 今日（10月5日 截至 14:32）\n'))
}

console.log('\n分站日报（渠道视角，逐字）：')
{
  const msgs = renderTenantDaily(tenantFixture())
  eq('一条', msgs.length, 1)
  eq(
    '分站日报',
    msgs[0],
    [
      '📊 Tibo AI 商店 · 10月4日 日报',
      '【流量】浏览 210 · 访客 88（新 61）· 手机 70%',
      '来源：搜索 40% · 直接 35% · 外链 25%',
      '【客户】新注册 5 人',
      '【订单】下单 6 单 / 5 人（含未付款）',
      '成交 4 单 / 4 人 · 成交额 ¥652.00 · 客单价 ¥163.00',
      '支付转化 67% · 取消/过期 2 单',
      '【收益】货款 ¥652.00 · 进货 ¥560.00 · 发票分成 ¥3.20',
      '本日收益 ¥95.20 · 手续费 ¥9.78 · 预计打款 ¥85.42',
      '【余额】可结算 ¥1,203.50（预计打款 ¥1,083.15）· 冻结中 ¥380.10',
      '【热销】Claude Pro 月卡 ×3 · ChatGPT Plus 月卡 ×1',
      '【待办】未读留言 1 · 售后 0',
      '【对比】成交额 较前日 ↑30%',
      '成交单 较前日 ↑33%',
    ].join('\n')
  )
  ok('≤ 900 字', len(msgs[0]) <= MAX_MESSAGE_CHARS)
  ok('不含站长利润、成本、卡差价', !/利润|成本|差价|渠道带来|所得货款/.test(msgs[0]))
  ok('过分站群黑名单扫描', tenantBlacklistHit(msgs[0]) === null, String(tenantBlacklistHit(msgs[0])))

  // 埋点还没开：流量写「暂无数据」；统计第一天：注明「自 X 起统计」
  const n0 = tenantFixture()
  n0.traffic = null
  n0.trafficSince = null
  ok('没有任何流量数据', renderTenantDaily(n0)[0].split('\n')[1] === '【流量】暂无数据（本站流量自开启统计起才有数据）')
  const n1 = tenantFixture()
  n1.trafficSince = '2026-10-04'
  eq('统计第一天注明起始日', renderTenantDaily(n1)[0].split('\n')[1], '【流量】浏览 210 · 访客 88（新 61）· 手机 70% · 自 10月4日 起统计')
  const n2 = tenantFixture()
  n2.trafficSince = '2026-10-03'
  ok('统计第二天起不再注明', !renderTenantDaily(n2)[0].includes('起统计'))

  // 可选项：退款、仍未付款、售后与调整、自动下架、余额读失败、没有热销、前值为 0
  const o = tenantFixture()
  o.orders = { ...o.orders, unpaid: 1, refunded: 2 }
  o.income = { ...o.income, otherCents: -500 }
  o.todo = { unreadMessages: 0, afterSales: 2, autoDelisted: 1 }
  o.balances = null
  o.top = []
  o.compares = [{ label: '较前日', paid: 0, amountCents: 0, uv: null }]
  const lines = renderTenantDaily(o)[0].split('\n')
  ok('仍未付款、退款', lines.includes('支付转化 67% · 取消/过期 2 单 · 仍未付款 1 单 · 退款 2 单'), lines.join(' | '))
  ok('售后与调整（负数）', lines.includes('【收益】货款 ¥652.00 · 进货 ¥560.00 · 发票分成 ¥3.20 · 售后与调整 -¥5.00'), lines.join(' | '))
  ok('余额读失败不显示', !lines.some((l) => l.startsWith('【余额】')))
  ok('没有热销', lines.includes('【热销】无'))
  ok('自动下架', lines.includes('【待办】未读留言 0 · 售后 2 · 自动下架 1'))
  ok('前值为 0', lines.includes('【对比】成交额 较前日 ↑（前值为 0）') && lines.includes('成交单 较前日 ↑（前值为 0）'), lines.join(' | '))

  // 指令回复（补看历史）
  const hr = tenantFixture()
  hr.historical = true
  const r = renderTenantReply(hr)
  ok('分站回复带补看说明', r.endsWith(TENANT_HISTORY_NOTE) && len(r) <= MAX_MESSAGE_CHARS)
  ok('分站回复过黑名单扫描', tenantBlacklistHit(r) === null)
}

console.log('\n统计窗口（北京时间，与容器时区无关）：')
{
  // 零点边界：北京 10-05 00:00:00.000 已是新的一天；23:59:59.999 还是前一天
  const y0 = yesterdayWindow(new Date('2026-10-04T16:00:00.000Z'))
  eq('零点整：昨日 = 10-04', [y0.dayFrom, y0.dayTo, iso(y0.start), iso(y0.end)], ['2026-10-04', '2026-10-04', '2026-10-03T16:00:00.000Z', '2026-10-04T16:00:00.000Z'])
  const y1 = yesterdayWindow(new Date('2026-10-04T15:59:59.999Z'))
  eq('零点前 1 毫秒：昨日 = 10-03', [y1.dayFrom, iso(y1.start), iso(y1.end)], ['2026-10-03', '2026-10-02T16:00:00.000Z', '2026-10-03T16:00:00.000Z'])
  eq('标题与用词', [W.title, W.word, W.relWord, W.kind], ['10月4日', '本日', '昨日', 'day'])
  eq('对比窗口：前一日、上周同日', W.compares.map((c) => [c.label, c.dayFrom, c.dayTo, iso(c.start), iso(c.end)]), [
    ['较前日', '2026-10-03', '2026-10-03', '2026-10-02T16:00:00.000Z', '2026-10-03T16:00:00.000Z'],
    ['较上周同日', '2026-09-27', '2026-09-27', '2026-09-26T16:00:00.000Z', '2026-09-27T16:00:00.000Z'],
  ])
  eq('补看更早的一天写「当日」', dayWindow('2026-10-01', NOW).relWord, '当日')

  // 跨月：北京 11-01 00:01
  const m1 = new Date('2026-10-31T16:01:00.000Z')
  const ym = yesterdayWindow(m1)
  eq('跨月：昨日 = 10-31', [ym.dayFrom, ym.title, ym.compares[0].dayFrom, ym.compares[1].dayFrom], ['2026-10-31', '10月31日', '2026-10-30', '2026-10-24'])
  const mm = monthWindow(m1)
  eq('跨月：本月从 11-01 起', [mm.dayFrom, mm.dayTo, iso(mm.start), iso(mm.end), mm.title], ['2026-11-01', '2026-11-01', '2026-10-31T16:00:00.000Z', '2026-10-31T16:01:00.000Z', '本月（11月1日–11月1日）'])
  eq('跨月：上月同期 = 10-01 起同样长', [mm.compares[0].label, iso(mm.compares[0].start), iso(mm.compares[0].end)], ['较上月同期', '2026-09-30T16:00:00.000Z', '2026-09-30T16:01:00.000Z'])
  // 3 月 31 日比 2 月：上月同期最长到 2 月底
  const mar31 = monthWindow(new Date('2027-03-31T04:00:00.000Z'))
  eq('上月同期不超过上月月底', [iso(mar31.compares[0].start), iso(mar31.compares[0].end), mar31.compares[0].dayTo], ['2027-01-31T16:00:00.000Z', '2027-02-28T16:00:00.000Z', '2027-02-28'])
  const wk = weekWindow(m1) // 11-01 是周日
  eq('本周：周日算在周一开始的那周', [wk.dayFrom, wk.dayTo, wk.title, wk.compares[0].dayFrom], ['2026-10-26', '2026-11-01', '本周（10月26日–11月1日）', '2026-10-19'])

  // 跨年：北京 2027-01-01 00:01
  const n = new Date('2026-12-31T16:01:00.000Z')
  const yy = yesterdayWindow(n)
  eq('跨年：昨日 = 2026-12-31，标题带年份', [yy.dayFrom, yy.title, iso(yy.start), iso(yy.end)], ['2026-12-31', '2026年12月31日', '2026-12-30T16:00:00.000Z', '2026-12-31T16:00:00.000Z'])
  const wy = weekWindow(n) // 2027-01-01 是周五
  eq('跨年：本周从 2026-12-28（周一）起', [wy.dayFrom, wy.dayTo, iso(wy.start), wy.title], ['2026-12-28', '2027-01-01', '2026-12-27T16:00:00.000Z', '本周（12月28日–1月1日）'])
  const my = monthWindow(n)
  eq('跨年：本月 2027-01，上月同期从 2026-12-01 起', [my.dayFrom, iso(my.compares[0].start), my.compares[0].dayFrom], ['2027-01-01', '2026-11-30T16:00:00.000Z', '2026-12-01'])

  // 今日
  const td = todayWindow(new Date('2026-10-05T06:32:00.000Z'))
  eq('今日：[今天 0 点, 现在)', [td.dayFrom, td.dayTo, iso(td.start), iso(td.end), td.title, td.word], ['2026-10-05', '2026-10-05', '2026-10-04T16:00:00.000Z', '2026-10-05T06:32:00.000Z', '今日（10月5日 截至 14:32）', '今日'])
  eq('今日：对比昨日同时段、上周同日同时段', td.compares.map((c) => [c.label, iso(c.start), iso(c.end), c.dayFrom, c.dayTo]), [
    ['较昨日同时段', '2026-10-03T16:00:00.000Z', '2026-10-04T06:32:00.000Z', '2026-10-04', '2026-10-04'],
    ['较上周同日同时段', '2026-09-27T16:00:00.000Z', '2026-09-28T06:32:00.000Z', '2026-09-28', '2026-09-28'],
  ])
  const t0 = todayWindow(new Date('2026-10-04T16:00:00.000Z'))
  eq('今日：零点整是空窗口但日期对', [t0.dayFrom, t0.dayTo, t0.start.getTime() === t0.end.getTime()], ['2026-10-05', '2026-10-05', true])
  const mon = weekWindow(new Date('2026-10-04T16:00:00.000Z')) // 10-05 周一 00:00
  eq('本周：周一零点整从当天起', [mon.dayFrom, iso(mon.start)], ['2026-10-05', '2026-10-04T16:00:00.000Z'])
  eq('补看今天 = 今日窗口', windowForDay('2026-10-05', new Date('2026-10-05T06:32:00.000Z')).kind, 'today')
  eq('cnDay', [cnDay('2026-01-09'), cnDay('2026-12-31', true)], ['1月9日', '2026年12月31日'])
}

console.log('\n「日报 <日期>」的日期：')
{
  const now = new Date('2026-10-05T06:32:00.000Z') // 北京 10-05
  const p = (s: string, at = now) => {
    const r = parseReportDate(s, at)
    return r.ok ? r.key : `ERR:${r.error}`
  }
  eq('10-03', p('10-03'), '2026-10-03')
  eq('10/3', p('10/3'), '2026-10-03')
  eq('10月3日', p('10月3日'), '2026-10-03')
  eq('2026-10-03', p('2026-10-03'), '2026-10-03')
  eq('2026年10月3日', p('2026年10月3日'), '2026-10-03')
  eq('20261003', p('20261003'), '2026-10-03')
  eq('1003', p('1003'), '2026-10-03')
  eq('昨天 / 前天 / 今天', [p('昨天'), p('前天'), p('今天')], ['2026-10-04', '2026-10-03', '2026-10-05'])
  eq('不写年份、比今天晚 = 去年的', p('10-06'), '2025-10-06')
  ok('写了年份的未来日期拒绝', p('2026-10-06').startsWith('ERR:'))
  ok('不存在的日期拒绝', p('02-30').startsWith('ERR:') && p('2026-13-01').startsWith('ERR:'))
  ok('太早拒绝', p('2019-12-31').startsWith('ERR:'))
  ok('格式不对拒绝', p('abc').startsWith('ERR:') && p('10-03-x').startsWith('ERR:'))
  const ny = new Date('2026-12-31T16:30:00.000Z') // 北京 2027-01-01 00:30
  eq('跨年：12-31 = 去年最后一天', p('12-31', ny), '2026-12-31')
  eq('跨年：01-01 = 今天', p('01-01', ny), '2027-01-01')
  ok('形状检查', isReportDateSyntax('10-03') && isReportDateSyntax('昨天') && !isReportDateSyntax('GPT1') && !isReportDateSyntax('10-03-01'))
}

console.log('\n离线分钟（日报「机器人运行情况」）：')
{
  eq('按北京日期累加', addOfflineMinutes({ '2026-10-04': 2 }, '2026-10-04', 1.5), { '2026-10-04': 3.5 })
  eq('只留最近 7 天、坏数据丢掉', addOfflineMinutes({ '2026-09-27': 9, '2026-09-28': 1, bad: 3, '2026-10-01': -1 }, '2026-10-04', 1), { '2026-09-28': 1, '2026-10-04': 1 })
  eq('非对象当成空', addOfflineMinutes('x', '2026-10-04', 1), { '2026-10-04': 1 })
  eq('步长：上次检查时间缺失记 1 分钟', offlineStepMinutes(null, NOW), 1)
  eq('步长：间隔 1 分钟', offlineStepMinutes('2026-10-04T16:00:00.000Z', NOW), 1)
  eq('步长：最多 5 分钟', offlineStepMinutes('2026-10-04T10:00:00.000Z', NOW), 5)
}

console.log(`\n${fail ? '❌' : '✅'} 通过 ${pass}，失败 ${fail}`)
process.exit(fail ? 1 : 0)
