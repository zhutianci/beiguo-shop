/**
 * 短信接码 · S2b（页面与后台）—— 数据库集成测试（会建数据、会删数据）。docs/短信接码-设计.md §12.2 中 S2b 能覆盖的部分：
 *
 *   set -a; . ./.env.local; set +a; VMQ_KEY=itest npx tsx scripts/itest-jiema-s2b.ts
 *
 * ⚠️ 只能对一次性的本地库跑（库名须含 dev / test）。**不调用真实 hero-sms**：上游一律是本地假服务（scripts/mock-herosms.ts，只绑 127.0.0.1），
 * 企业微信推送打到本地假 webhook。sms_* 目录与停售表、相关 settings 在开始时存档、结束时原样恢复；本测试建的订单、流水、预扣、收款单全部删掉。
 *
 * 覆盖：
 *   第 91 条 订单留言对接码单放开（待支付、已关闭能读写、GET 清红点；充值单仍「支付后才能咨询」；别人的单 404）、留言推送带接码上下文；
 *   第 100 / 101 条的留言部分（迟到退入：接码单同一事务写一条客服留言、号码页横幅；充值单不写）；
 *   第 93 条「我的订单」接口（jiema 白名单字段、billing 为空、组合单 payable = 差额）；第 125 条 GET /api/orders 对接码单 billing 为 null；
 *   号码页视图的 S2b 增补字段（cashierExpiresAt、createdAt、progress、actions.message）；渠道 Host 404（号码页、后台接口）；
 *   §7.2 后台接码订单：列表筛选与页脚（营收 − 成本 = 毛利）、详情（尝试 raw、资金、成本）、权限 403、每个操作写审计：
 *     关单并原路退回预扣、加赠换号、释放号码、解除 MANUAL（前提校验）、售后退款（成本照计）、重新核算、认领上游激活（两个候选 → MANUAL → 认领）；
 *   §7.1 概览：在途占用与 E26 同一个 inflightMicro、告警线 $2（不停售）、今日计数与营收成本毛利；§6.6 第 28 条 后台订单列表与仪表盘的接码成本利润；
 *   §6.6 第 32 条 条款页第四节的《短信接码服务条款》第一节五条随「对全部用户开放」出现；最后 W 系列对账不新增问题。
 */
import http from 'http'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import {
  prisma,
  check,
  section,
  summary,
  setChannelsMode,
  signTestToken,
  callRoute,
  withRequest,
  catchNext,
  ensurePlatformTenant,
  createTenant,
  createUser,
  cleanupAll,
  type RouteFn,
  type WorldUser,
} from './itest-tenant/_harness'
import { startMockHeroSms, type MockHandle } from './mock-herosms'
import React from 'react'

// 仓库 tsconfig 是 jsx: preserve，tsx 按经典运行时编译 JSX（React.createElement），渲染服务端页面组件需要全局 React（同 itest-jiema-catalog.ts）
;(globalThis as unknown as { React: typeof React }).React = React

const MAIN = 'bigolab.com'
const KEY = `itest-jiema-s2b-${crypto.randomUUID()}`
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const uuid = () => crypto.randomUUID()

if (!process.env.VMQ_KEY) process.env.VMQ_KEY = 'itest'
for (const k of ['ALIYUN_ACCESS_KEY_ID', 'ALIYUN_ACCESS_KEY_SECRET', 'ALIYUN_DM_ACCOUNT', 'ALIYUN_DM_NOREPLY', 'ORDER_MSG_WEBHOOK_URL', 'NOTIFY_EVENTS']) delete process.env[k]
{
  const u = process.env.DATABASE_URL || ''
  const db = (/\/([^/?]+)(\?|$)/.exec(u)?.[1] || '').toLowerCase()
  if (!/dev|test/.test(db)) {
    console.error(`拒绝运行：DATABASE_URL 的库名「${db}」不含 dev / test`)
    process.exit(2)
  }
}

const PRICES: Record<string, { usd: number; stock: number }> = {
  'ot:6': { usd: 0.024, stock: 100_000 },
  'dr:16': { usd: 0.045, stock: 100_000 },
  'dr:52': { usd: 0.12, stock: 100_000 },
  'wa:6': { usd: 0.21, stock: 100_000 },
  'tg:6': { usd: 0.15, stock: 100_000 },
}
const SMS_TABLES = ['sms_services', 'sms_countries', 'sms_offer_cache', 'sms_price_rules', 'sms_holds'] as const
const KEEP_SETTINGS = ['sms_config', 'sms_catalog_at', 'sms_operator_names', 'sms_runtime', 'wallet_config', 'vmq_lastpay', 'vmq_lastunmatched', 'vmq_recentraw', 'vmq_lastheart']

/** 把一棵 React 元素树里的文字收集起来（服务端组件的渲染结果断言用） */
function textOf(el: unknown, out: string[] = []): string[] {
  if (el == null || typeof el === 'boolean') return out
  if (typeof el === 'string' || typeof el === 'number') {
    out.push(String(el))
    return out
  }
  if (Array.isArray(el)) {
    for (const x of el) textOf(x, out)
    return out
  }
  if (typeof el === 'object') {
    const p = (el as { props?: Record<string, unknown> }).props
    if (p) for (const v of Object.values(p)) textOf(v, out)
  }
  return out
}

async function main() {
  const bodies: string[] = []
  const hook = http.createServer((req, res) => {
    let b = ''
    req.on('data', (c) => (b += c))
    req.on('end', () => {
      bodies.push(b)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end('{"errcode":0}')
    })
  })
  await new Promise<void>((r) => hook.listen(0, '127.0.0.1', () => r()))
  process.env.WECOM_WEBHOOK_URL = `http://127.0.0.1:${(hook.address() as { port: number }).port}/cgi-bin/webhook/send?key=itest`
  process.env.CRON_SECRET = process.env.CRON_SECRET || 'itest-cron-secret-jiema-s2b'

  const mock: MockHandle = await startMockHeroSms({ key: KEY, config: { prices: PRICES } })
  process.env.HEROSMS_BASE = mock.baseUrl
  process.env.HEROSMS_V1_BASE = mock.v1Url
  process.env.HEROSMS_API_KEY = KEY
  if (!/^http:\/\/127\.0\.0\.1:\d+\//.test(mock.baseUrl)) throw new Error('只能指向本地假服务')

  const up = await import('../src/lib/jiema/upstream')
  const catalog = await import('../src/lib/jiema/catalog')
  const jcfg = await import('../src/lib/jiema/config')
  const alert = await import('../src/lib/jiema/alert')
  const runtime = await import('../src/lib/jiema/runtime')
  const engine = await import('../src/lib/jiema/engine')
  const order = await import('../src/lib/jiema/order')
  const refund = await import('../src/lib/jiema/refund')
  const sellable = await import('../src/lib/jiema/sellable')
  const gate = await import('../src/lib/jiema/gate')
  const claim = await import('../src/lib/jiema/claim')
  const view = await import('../src/lib/jiema/view')
  const vmq = await import('../src/lib/vmq')
  const ledger = await import('../src/lib/wallet/ledger')
  const latepay = await import('../src/lib/wallet/latepay')
  const walletCfg = await import('../src/lib/wallet/config')
  const reconcile = await import('../src/lib/wallet/reconcile')
  const { centsOf } = await import('../src/lib/wallet/buckets')
  const { FACTORY_SMS_CONFIG } = await import('../src/lib/jiema-config-schema')
  const { JIEMA_TERMS, JIEMA_TERMS_VERSION, WALLET_TERMS_VERSION } = await import('../src/lib/terms/jiema-wallet')
  const routeMsgs = (await import('../src/app/api/orders/[id]/messages/route')) as unknown as { GET: RouteFn; POST: RouteFn }
  const routeUnread = (await import('../src/app/api/account/unread/route')) as unknown as { GET: RouteFn }
  const routeMyOrders = (await import('../src/app/api/orders/route')) as unknown as { GET: RouteFn }
  const routeView = (await import('../src/app/api/jiema/orders/[orderNo]/route')) as unknown as { GET: RouteFn }
  const routeAList = (await import('../src/app/api/admin/jiema/orders/route')) as unknown as { GET: RouteFn }
  const routeADetail = (await import('../src/app/api/admin/jiema/orders/[id]/route')) as unknown as { GET: RouteFn; POST: RouteFn }
  const routeAClaim = (await import('../src/app/api/admin/jiema/orders/[id]/claim/route')) as unknown as { GET: RouteFn }
  const routeOverview = (await import('../src/app/api/admin/jiema/overview/route')) as unknown as { GET: RouteFn }
  const routeStats = (await import('../src/app/api/admin/stats/route')) as unknown as { GET: RouteFn }
  const routeAdminOrders = (await import('../src/app/api/admin/orders/route')) as unknown as { GET: RouteFn }
  const NumberPage = (await import('../src/app/(shop)/jiema/order/[orderNo]/page')).default as (p: { params: { orderNo: string } }) => Promise<unknown>
  const TermsPage = (await import('../src/app/(shop)/terms/page')).default as () => Promise<unknown>

  const saved: Record<string, unknown[]> = {}
  for (const t of SMS_TABLES) saved[t] = await prisma.$queryRawUnsafe(`SELECT * FROM ${t}`)
  const savedSettings = await prisma.setting.findMany({ where: { key: { in: KEEP_SETTINGS } } })
  const unmatchedBefore = new Set((await prisma.setting.findMany({ where: { key: { startsWith: 'vmq_unmatched:' } }, select: { key: true } })).map((s) => s.key))
  const baseline = await reconcile.runWalletReconcile({ full: true, alert: false, save: false })
  const baseSamples = (code: string) => new Set(baseline.items.find((i) => i.code === code)?.samples ?? [])
  const userIds: number[] = []
  const seeded: Array<{ productId: number; categoryId: number | null }> = []
  const createdKeys: string[] = []

  const resetCaches = () => {
    catalog.resetCatalogCachesForTest()
    jcfg.invalidateSmsConfigCache()
  }
  const cfgBase = { ...FACTORY_SMS_CONFIG, enabled: true, audience: 'ADMIN_ONLY' as const, limits: { activePerUser: 10, perHour: 100, perDay: 500, maxActiveNumbers: 400 } }
  const setCfg = async (over: Record<string, unknown> = {}) => {
    const value = JSON.stringify({ ...cfgBase, ...over })
    await prisma.setting.upsert({ where: { key: 'sms_config' }, create: { key: 'sms_config', value }, update: { value } })
    resetCaches()
    await jcfg.readSmsConfig()
  }
  const adv = (sec: number) => {
    mock.advance(sec)
    runtime.advanceClockForTest(sec)
  }
  const pushes = async (needle: string) => {
    await sleep(200)
    return bodies.filter((b) => b.includes(needle)).length
  }

  try {
    await cleanupAll()
    await ensurePlatformTenant()
    setChannelsMode('observe')
    runtime.resetRuntimeForTest()
    up.resetUpstreamStateForTest()
    alert.resetSmsAlertThrottleForTest()
    order.resetSmsCarrierCacheForTest()
    for (const t of SMS_TABLES) await prisma.$executeRawUnsafe(`DELETE FROM ${t}`)
    await prisma.setting.deleteMany({ where: { key: { in: ['sms_catalog_at', 'sms_operator_names', 'sms_runtime'] } } })

    section('准备：SMS_POOL / TOPUP 载体种子、目录同步、配置（总开关开 + 仅管理员）')
    const runSql = async (file: string) => {
      const sql = fs.readFileSync(path.join(__dirname, 'ops', file), 'utf8')
      const stmts = sql.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n').split(/;\s*(?:\n|$)/).map((x) => x.trim()).filter(Boolean)
      for (const st of stmts) {
        if (/^SELECT\b/i.test(st)) await prisma.$queryRawUnsafe(st)
        else await prisma.$executeRawUnsafe(st)
      }
    }
    for (const [type, file] of [['SMS_POOL', 'jiema-s2-seed.sql'], ['TOPUP', 'wallet-b1-seed.sql']] as const) {
      if ((await prisma.product.count({ where: { deliveryType: type } })) === 0) {
        const catBefore = await prisma.category.findFirst({ where: { name: '系统（勿删）' }, select: { id: true } })
        await runSql(file)
        const p = await prisma.product.findFirstOrThrow({ where: { deliveryType: type } })
        seeded.push({ productId: p.id, categoryId: catBefore ? null : ((await prisma.category.findFirst({ where: { name: '系统（勿删）' } }))?.id ?? null) })
      }
    }
    await setCfg()
    await prisma.setting.upsert({ where: { key: 'wallet_config' }, create: { key: 'wallet_config', value: JSON.stringify(walletCfg.FACTORY_WALLET_CONFIG) }, update: { value: JSON.stringify(walletCfg.FACTORY_WALLET_CONFIG) } })
    const job = await catalog.runCatalogJob({ forceStatic: true })
    check('目录同步成功（假上游）', !!job.static?.ok && !!job.prices?.ok)
    const topupCarrier = (await prisma.product.findFirstOrThrow({ where: { deliveryType: 'TOPUP' } })).id

    const mkUser = async (name: string, role: 'USER' | 'ADMIN' = 'ADMIN'): Promise<WorldUser & { token: string }> => {
      const u = await createUser(`s2b-${name}-${uuid().slice(0, 6)}`, { role })
      userIds.push(u.id)
      return { ...u, token: signTestToken(u as never, 'main') }
    }
    const fund = async (userId: number, topupCents: number, cashCents: number) => {
      await ledger.inMoneyTx(async (tx) => {
        if (topupCents) await ledger.postInTx(tx, { userId, topupDeltaCents: topupCents, type: 'ADJUST', bizKey: `adj:it-${uuid()}` })
        if (cashCents) await ledger.postInTx(tx, { userId, cashDeltaCents: cashCents, type: 'ADJUST', bizKey: `adj:it-${uuid()}` })
      })
    }
    const cfgNow = async () => {
      const r = await jcfg.readSmsConfig()
      if (!r.ok) throw new Error('sms_config 读不到')
      return r.config
    }
    const place = async (u: { id: number; role: string }, service: string, country: number, o: { payWith?: 'ALIPAY' | 'BALANCE'; expectBalance?: number | null } = {}) => {
      const q = await catalog.quote(service, country, await cfgNow(), runtime.jnow())
      const r = await order.createJiemaOrder(
        { id: u.id, role: u.role },
        {
          service,
          country,
          operator: null,
          operatorFallback: true,
          expectPriceCents: q.ok ? q.priceCents : 1,
          payWith: o.payWith ?? 'ALIPAY',
          expectBalanceCents: o.expectBalance ?? null,
          clientToken: uuid(),
          agree: true,
          termsVersion: JIEMA_TERMS_VERSION,
          walletTermsVersion: WALLET_TERMS_VERSION,
        },
      )
      if (!r.ok) throw new Error(`下单失败 ${service}:${country} ${r.code} ${r.message}`)
      return r.data
    }
    const soOf = (orderId: number) => prisma.smsOrder.findUniqueOrThrow({ where: { orderId } })
    const attsOf = (smsOrderId: number) => prisma.smsAttempt.findMany({ where: { smsOrderId }, orderBy: { seq: 'asc' } })
    const vmqOf = (orderId: number, state = 0) => prisma.vmqOrder.findFirst({ where: { bizType: 'order', bizId: orderId, state }, orderBy: { id: 'desc' } })
    let rawSeq = 0
    const pay = async (orderId: number) => {
      const v = await vmqOf(orderId)
      if (!v) throw new Error(`订单 ${orderId} 没有待支付收款单`)
      await vmq.markPaidByAmount(Number(v.reallyPrice).toFixed(2), 2, `你已成功收款${Number(v.reallyPrice).toFixed(2)}元（itest-s2b-${++rawSeq}-${uuid()}）`)
      return v
    }
    const settle = async (orderId: number) => {
      const so = await soOf(orderId)
      for (let i = 0; i < 60; i++) {
        if (!(await prisma.smsAttempt.count({ where: { smsOrderId: so.id, state: 'REQUESTING' } }))) return
        await sleep(400)
      }
    }
    const tick = async (n = 1) => {
      for (let i = 0; i < n; i++) {
        const t = runtime.jnow().getTime()
        runtime.rt().periodic.localSuccess = t
        runtime.rt().periodic.upstreamStats = t
        await engine.tickRound()
      }
    }
    const admin = await mkUser('admin')
    const asAdmin = { host: MAIN, token: admin.token }

    // =====================================================================================
    section('第 91 条 订单留言对接码单放开（§6.6 第 29 条）；充值单仍要付款后才能咨询')
    {
      const u = await mkUser('msg')
      const r = await place(u, 'ot', 6)
      const as = { host: MAIN, token: u.token }
      const g1 = await callRoute(routeMsgs.GET, { ...as, path: `/api/orders/${r.orderId}/messages`, params: { id: String(r.orderId) } })
      check('待支付（UNPAID）的接码单：GET 留言 200（原来是「订单支付后才能咨询」）', g1.status === 200 && g1.json?.success === true, g1.text.slice(0, 200))
      bodies.length = 0
      const p1 = await callRoute(routeMsgs.POST, { ...as, method: 'POST', path: `/api/orders/${r.orderId}/messages`, params: { id: String(r.orderId) }, body: { content: '我付了款没反应' } })
      check('待支付的接码单：POST 留言 200', p1.status === 200 && p1.json?.success === true)
      const push = bodies.find((b) => b.includes('我付了款没反应')) ?? ''
      await sleep(200)
      const push2 = bodies.find((b) => b.includes('我付了款没反应')) ?? push
      check('企业微信 message.buyer 推送带接码上下文（服务 / 国家、状态、付款方式、后台详情链接 ?tab=orders&q=订单号）', push2.includes('接码') && push2.includes('待支付') && push2.includes('支付宝') && push2.includes(`tab=orders&q=${r.orderNo}`), push2.slice(0, 400))
      await prisma.orderMessage.create({ data: { orderId: r.orderId, sender: 'ADMIN', content: '客服回复', readByAdmin: true, readByBuyer: false, senderRole: 'PLATFORM' } })
      const un1 = await callRoute(routeUnread.GET, { ...as, path: '/api/account/unread' })
      const g2 = await callRoute(routeMsgs.GET, { ...as, path: `/api/orders/${r.orderId}/messages`, params: { id: String(r.orderId) } })
      const un2 = await callRoute(routeUnread.GET, { ...as, path: '/api/account/unread' })
      check('客服回复 → 页头红点 1；GET 留言后标为已读 → 红点 0', Number(un1.json?.data?.messages) === 1 && g2.status === 200 && Number(un2.json?.data?.messages) === 0, `${un1.text} / ${un2.text}`)
      const so = await soOf(r.orderId)
      await engine.buyerClose(so, so.version)
      check('前置：买家取消 → CLOSED（UNPAID + CANCELLED）', (await soOf(r.orderId)).state === 'CLOSED')
      const g3 = await callRoute(routeMsgs.GET, { ...as, path: `/api/orders/${r.orderId}/messages`, params: { id: String(r.orderId) } })
      const p3 = await callRoute(routeMsgs.POST, { ...as, method: 'POST', path: `/api/orders/${r.orderId}/messages`, params: { id: String(r.orderId) }, body: { content: '关了还能问吗' } })
      check('已关闭的接码单：照样能读写留言，之前的对话还在', g3.status === 200 && (g3.json?.data?.messages ?? []).length >= 2 && p3.status === 200)
      const other = await mkUser('msg-other', 'USER')
      const g4 = await callRoute(routeMsgs.GET, { host: MAIN, token: other.token, path: `/api/orders/${r.orderId}/messages`, params: { id: String(r.orderId) } })
      check('别人的接码单 → 404（本人校验不变）', g4.status === 404)
      const tp = await prisma.order.create({ data: { orderNo: `T${Date.now()}${Math.floor(Math.random() * 1000)}`, userId: u.id, productId: topupCarrier, productName: '余额充值 ¥10.00', productPrice: 10, amount: 10 } })
      const g5 = await callRoute(routeMsgs.GET, { ...as, path: `/api/orders/${tp.id}/messages`, params: { id: String(tp.id) } })
      const p5 = await callRoute(routeMsgs.POST, { ...as, method: 'POST', path: `/api/orders/${tp.id}/messages`, params: { id: String(tp.id) }, body: { content: 'x' } })
      check('充值单（TOPUP）不放开：GET / POST 都是「订单支付后才能咨询」', g5.status === 400 && g5.json?.error === '订单支付后才能咨询' && p5.status === 400)
      const vv = await callRoute(routeView.GET, { ...as, path: `/api/jiema/orders/${r.orderNo}`, params: { orderNo: r.orderNo } })
      check('号码页视图：actions.message=true（CLOSED 也能留言）', vv.json?.data?.actions?.message === true)
    }

    // =====================================================================================
    section('第 101 条（留言部分）迟到退入：接码单同一事务写一条客服留言、号码页横幅；充值单不写（§1.9、§2.7）')
    {
      const u = await mkUser('late')
      const r = await place(u, 'ot', 6)
      const so = await soOf(r.orderId)
      await engine.buyerClose(so, so.version)
      const mkEntry = async (price: string) => {
        const key = `vmq_unmatched:${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
        await prisma.setting.create({ data: { key, value: JSON.stringify({ reason: 'no_pending_match', price, type: 2, at: Date.now(), handledAt: null }) } })
        createdKeys.push(key)
        return key
      }
      const tradeNo = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`.padEnd(20, '7').slice(0, 20)
      const k1 = await mkEntry('0.52')
      const c1 = await latepay.manualCredit({ key: k1, orderNo: r.orderNo, tradeNo: tradeNo(), confirmMismatch: true, adminId: admin.id })
      const msgs = await prisma.orderMessage.findMany({ where: { orderId: r.orderId } })
      check('手动退入 ¥0.52 到已关闭的接码单：一条 LATEPAY', c1.cents === 52 && (await prisma.balanceLog.count({ where: { orderId: r.orderId, type: 'LATEPAY' } })) === 1)
      check('同一事务写了一条客服留言「这张订单关闭后收到一笔 ¥0.52 付款，已退回你的余额，可用于下次购物抵扣」（买家未读）', msgs.length === 1 && msgs[0].sender === 'ADMIN' && !msgs[0].readByBuyer && msgs[0].content === '这张订单关闭后收到一笔 ¥0.52 付款，已退回你的余额，可用于下次购物抵扣。', msgs[0]?.content)
      const v = await view.buildOrderView((await view.findBuyerOrder(u.id, r.orderNo))!)
      check('号码页 lateCredits：kind=LATE、¥0.52（CLOSED 卡片横幅）', v.lateCredits.length === 1 && v.lateCredits[0].kind === 'LATE' && v.lateCredits[0].cents === 52)
      check('latepayMessageText：已付款的单 → 「重复付款」一句', latepay.latepayMessageText(52, false) === '这张订单收到一笔重复付款 ¥0.52，已退回你的余额，可用于下次购物抵扣。')
      const tp = await prisma.order.create({ data: { orderNo: `T${Date.now()}${Math.floor(Math.random() * 1000)}`, userId: u.id, productId: topupCarrier, productName: '余额充值 ¥10.00', productPrice: 10, amount: 10, deliveryStatus: 'CANCELLED' } })
      const k2 = await mkEntry('10.03')
      await latepay.manualCredit({ key: k2, orderNo: tp.orderNo, tradeNo: tradeNo(), confirmMismatch: true, adminId: admin.id })
      check('充值单迟到退入：LATEPAY 一条、不写订单留言（没有地方能读、红点清不掉）', (await prisma.balanceLog.count({ where: { orderId: tp.id, type: 'LATEPAY' } })) === 1 && (await prisma.orderMessage.count({ where: { orderId: tp.id } })) === 0)
    }

    // =====================================================================================
    section('第 93 / 125 条「我的订单」接口：接码单的白名单字段、billing 为空、组合单 payable = 差额（§6.6 第 27 条）')
    let mixOrder: { orderId: number; orderNo: string } | null = null
    {
      const u = await mkUser('myorders')
      await fund(u.id, 70, 50)
      const mix = await place(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 120 })
      mixOrder = mix
      const ali = await place(u, 'dr', 52)
      await pay(ali.orderId)
      await settle(ali.orderId)
      const res = await callRoute(routeMyOrders.GET, { host: MAIN, token: u.token, path: '/api/orders?page=1&pageSize=20' })
      const list = (res.json?.data?.list ?? []) as Array<Record<string, any>>
      const m = list.find((x) => x.id === mix.orderId)
      const a = list.find((x) => x.id === ali.orderId)
      check('组合单待支付：jiema={state PENDING_PAY, payMode MIXED, holdCents 120, holdState HELD}', !!m && m.jiema?.state === 'PENDING_PAY' && m.jiema?.payMode === 'MIXED' && m.jiema?.holdCents === 120 && m.jiema?.holdState === 'HELD', JSON.stringify(m?.jiema))
      check('组合单 payable = 应付 − 预扣 = ¥0.50（收银台只收差额）', !!m && m.payable === 0.5)
      check('已付款的接码单：billing 为 null（没有开票 / 收据入口，D37）、jiema.state 是接码单状态', !!a && a.billing === null && typeof a.jiema?.state === 'string')
      check('白名单：jiema 只有 4 个字段，不出成本、cap', !!m && Object.keys(m.jiema).sort().join(',') === 'holdCents,holdState,payMode,state' && !JSON.stringify(list).includes('capMicro') && !JSON.stringify(list).includes('costCents'))
    }

    // =====================================================================================
    section('号码页视图的 S2b 增补字段；渠道 Host 404（号码页、后台接口）')
    {
      const u = await mkUser('view2')
      const r = await place(u, 'tg', 6)
      const vr = await callRoute(routeView.GET, { host: MAIN, token: u.token, path: `/api/jiema/orders/${r.orderNo}`, params: { orderNo: r.orderNo } })
      const v = vr.json?.data
      const vq = await vmqOf(r.orderId)
      check('待支付：cashierExpiresAt = 收款单建单 + 20 分钟、createdAt 有、progress 为空', !!vq && v?.cashierExpiresAt === new Date(vq.createdAt.getTime() + vmq.VMQ_TIMEOUT_MIN * 60_000).toISOString() && typeof v?.createdAt === 'string' && v?.progress === null)
      check('响应里没有成本、cap、两个系数、activationId', !/costMicro|capMicro|saleCoef4|costFx4|activationId/.test(vr.text))
      const lulu = await createTenant('l')
      const page = await withRequest({ host: lulu.host }, () => catchNext(() => NumberPage({ params: { orderNo: r.orderNo } })))
      check('渠道 Host 打开号码页 → notFound', page.kind === 'notFound')
      const bad = await withRequest({ host: MAIN }, () => catchNext(() => NumberPage({ params: { orderNo: 'x' } })))
      check('订单号格式不对 → notFound（不渲染页面）', bad.kind === 'notFound')
      const al = await callRoute(routeAList.GET, { host: lulu.host, token: admin.token, path: '/api/admin/jiema/orders' })
      check('渠道 Host 调后台接码订单接口 → 404', al.status === 404)
    }

    // =====================================================================================
    section('§7.2 后台接码订单：权限、列表筛选、详情、页脚（营收 − 成本 = 毛利）')
    let waitingOrder: { orderId: number; orderNo: string } | null = null
    {
      const plain = await mkUser('plain', 'USER')
      const d403 = await callRoute(routeAList.GET, { host: MAIN, token: plain.token, path: '/api/admin/jiema/orders' })
      check('普通用户调后台接码订单 → 403', d403.status === 403)
      const u = await mkUser('adm-list')
      await fund(u.id, 2000, 0)
      waitingOrder = await place(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 170 })
      await settle(waitingOrder.orderId)
      check('前置：余额付清单 → WAITING', (await soOf(waitingOrder.orderId)).state === 'WAITING')
      const l1 = await callRoute(routeAList.GET, { ...asAdmin, path: `/api/admin/jiema/orders?q=${waitingOrder.orderNo}` })
      const rows = (l1.json?.data?.list ?? []) as Array<Record<string, any>>
      check('按订单号筛选 → 恰好这一单；付款一格「余额 ¥1.70（充值 1.70 / 返现 0.00）」、尝试 1', l1.status === 200 && rows.length === 1 && rows[0].payText === '余额 ¥1.70（充值 1.70 / 返现 0.00）' && rows[0].attempts === 1, JSON.stringify(rows[0] ?? {}).slice(0, 300))
      const phone = (await attsOf((await soOf(waitingOrder.orderId)).id))[0].phone as string
      const l2 = await callRoute(routeAList.GET, { ...asAdmin, path: `/api/admin/jiema/orders?q=${phone.slice(-6)}` })
      check('按号码后几位筛选 → 找得到这一单', (l2.json?.data?.list ?? []).some((x: any) => x.orderId === waitingOrder!.orderId))
      const l3 = await callRoute(routeAList.GET, { ...asAdmin, path: '/api/admin/jiema/orders?state=CLOSED&pageSize=100' })
      check('快捷筛选 CLOSED：只有已关闭的单', (l3.json?.data?.list ?? []).length > 0 && (l3.json.data.list as any[]).every((x) => x.state === 'CLOSED'))
      const lAll = await callRoute(routeAList.GET, { ...asAdmin, path: '/api/admin/jiema/orders?pageSize=100' })
      const f = lAll.json?.data?.footer
      check('页脚：营收 − 真实成本 = 毛利；已取消 / 未付款的单「不计」', !!f && f.revenueCents - f.costCents === f.profitCents && f.notCounted > 0, JSON.stringify(f))
      const so = await soOf(waitingOrder.orderId)
      const d = await callRoute(routeADetail.GET, { ...asAdmin, path: `/api/admin/jiema/orders/${so.id}`, params: { id: String(so.id) } })
      const dd = d.json?.data
      check('详情：快照里有报价成本 / cap / 两个系数（只给管理员）、尝试带 activationId 与上游原文 raw、预扣 CAPTURED、余额流水 HOLD', d.status === 200 && dd.so.capMicro === so.capMicro && dd.so.saleCoef4 === 80000 && dd.attempts[0].activationId && typeof dd.attempts[0].raw === 'string' && dd.hold.state === 'CAPTURED' && dd.logs.some((l: any) => l.type === 'HOLD'))
      check('详情：可用操作——WAITING 可加赠换号、可释放号码，不能售后退款 / 关单', dd.actions.bonusReplace && dd.releasable.length === 1 && !dd.actions.refund && !dd.actions.closeRelease)
      const noReason = await callRoute(routeADetail.POST, { ...asAdmin, method: 'POST', path: `/api/admin/jiema/orders/${so.id}`, params: { id: String(so.id) }, body: { action: 'bonus_replace', n: 2, reason: '' } })
      check('操作不填原因 → 400', noReason.status === 400)
      const plainPost = await callRoute(routeADetail.POST, { host: MAIN, token: plain.token, method: 'POST', path: `/api/admin/jiema/orders/${so.id}`, params: { id: String(so.id) }, body: { action: 'bonus_replace', n: 2, reason: '测试' } })
      check('普通用户调后台操作 → 403', plainPost.status === 403)
    }

    // =====================================================================================
    section('§7.2 后台操作：加赠换号、释放号码、解除 MANUAL、关单并原路退回预扣、售后退款、重新核算（每个都写审计）')
    {
      const act = async (smsOrderId: number, body: Record<string, unknown>) =>
        callRoute(routeADetail.POST, { ...asAdmin, method: 'POST', path: `/api/admin/jiema/orders/${smsOrderId}`, params: { id: String(smsOrderId) }, body: { reason: 'itest 操作', ...body } })
      const audits = (action: string) => prisma.auditEvent.count({ where: { action: `jiema.order.${action}`, actorUserId: admin.id } })
      // 加赠换号
      const so = await soOf(waitingOrder!.orderId)
      const b1 = await act(so.id, { action: 'bonus_replace', n: 2 })
      const so2 = await soOf(waitingOrder!.orderId)
      const u = await prisma.user.findUniqueOrThrow({ where: { id: so.userId } })
      const bv = await view.buildOrderView((await view.findBuyerOrder(u.id, waitingOrder!.orderNo))!)
      check('加赠换号 2 次：replaceBonus=2、买家视图 replace.left = 5 + 2、审计一条', b1.status === 200 && so2.replaceBonus === 2 && bv.replace.left === 7 && (await audits('bonus_replace')) === 1)
      // 解除 MANUAL 的前提校验
      await refund.toManual(so.id, 'itest：人工核实')
      const m1 = await act(so.id, { action: 'unmanual', target: 'ACQUIRING' })
      check('解除 MANUAL → ACQUIRING：还有活着的号 → 拒绝（409，审计 DENIED）', m1.status === 409 && (await soOf(waitingOrder!.orderId)).state === 'MANUAL' && (await prisma.auditEvent.count({ where: { action: 'jiema.order.unmanual', result: 'DENIED' } })) >= 1)
      const m2 = await act(so.id, { action: 'unmanual', target: 'WAITING' })
      check('解除 MANUAL → WAITING（当前号 ACTIVE、没收过码）→ 成功', m2.status === 200 && (await soOf(waitingOrder!.orderId)).state === 'WAITING')
      // 释放号码：满 2 分钟前 → EARLY；之后 → 上游确认取消 → 订单整单退回
      const cur = (await attsOf(so.id)).find((a) => a.state === 'ACTIVE')!
      const r1 = await act(so.id, { action: 'release_attempt', attemptId: cur.id })
      check('释放号码（未满 2 分钟）→ 已安排释放：提示「还没到可取消时间」、尝试转 RELEASING 由推进任务稍后再放、审计一条', r1.status === 200 && String(r1.json?.message).includes('还没到可取消时间') && (await prisma.smsAttempt.findUniqueOrThrow({ where: { id: cur.id } })).state === 'RELEASING' && (await audits('release_attempt')) === 1)
      adv(130)
      await tick(2)
      const soR = await soOf(waitingOrder!.orderId)
      check('推进任务放号成功 → 订单整单退回余额（CANCELLED、不计成本）', soR.state === 'CANCELLED' && soR.costCents == null && mock.get(cur.activationId as string)?.status !== 'ACTIVE', soR.state)
      // 关单并原路退回预扣：组合单待支付 → 强制 MANUAL → 买家手里还有二维码 → 拒绝（不替买家作废）→ 收款单过期后 → 成功
      const mixSo = await soOf(mixOrder!.orderId)
      await refund.toManual(mixSo.id, 'itest：余额付清补推进失败（模拟）')
      const c1 = await act(mixSo.id, { action: 'close_release' })
      check('关单并原路退回预扣：还有 state=0 收款单 → 拒绝（不替买家作废收款单）', c1.status === 409 && String(c1.json?.error).includes('二维码'))
      await prisma.vmqOrder.updateMany({ where: { bizType: 'order', bizId: mixOrder!.orderId, state: 0 }, data: { state: -1 } })
      const c2 = await act(mixSo.id, { action: 'close_release' })
      const h = await prisma.balanceHold.findUniqueOrThrow({ where: { orderId: mixOrder!.orderId } })
      check('收款单过期后 → 关单：CLOSED、预扣 RELEASED、RELEASE 流水一条、审计 OK', c2.status === 200 && (await soOf(mixOrder!.orderId)).state === 'CLOSED' && h.state === 'RELEASED' && (await prisma.balanceLog.count({ where: { orderId: mixOrder!.orderId, type: 'RELEASE' } })) === 1 && (await prisma.auditEvent.count({ where: { action: 'jiema.order.close_release', result: 'OK' } })) >= 1)
      // 售后退款：收码 → RECEIVED → 售后 → REFUNDED、成本照计、利润 = −成本
      const ru = await mkUser('aftersale')
      await fund(ru.id, 1000, 0)
      const rr = await place(ru, 'ot', 6, { payWith: 'BALANCE', expectBalance: 170 })
      await settle(rr.orderId)
      const rso = await soOf(rr.orderId)
      const ra = (await attsOf(rso.id))[0]
      mock.pushSms(ra.activationId as string, { code: '482917', text: 'Your code is 482917' })
      await tick()
      await engine.lazyAdvance(rso.id).catch(() => undefined)
      check('前置：收到码 → RECEIVED（成本预估已写）', (await soOf(rr.orderId)).state === 'RECEIVED' && (await soOf(rr.orderId)).costCents != null)
      const re = await act(rso.id, { action: 'recompute' })
      check('重新核算成本（按快照）→ 200', re.status === 200)
      const rf = await act(rso.id, { action: 'refund' })
      const rso2 = await soOf(rr.orderId)
      check('售后退款到余额：REFUNDED、利润 = −成本（成本照计）、两格原路退回、审计一条', rf.status === 200 && rso2.state === 'REFUNDED' && rso2.costCents != null && rso2.profitCents === -(rso2.costCents as number) && (await prisma.balanceLog.count({ where: { orderId: rr.orderId, type: 'REFUND' } })) === 1 && (await audits('refund')) === 1, `${rf.text.slice(0, 200)} ${rso2.state}`)
      const again = await act(rso.id, { action: 'refund' })
      check('再点一次售后退款 → 拒绝（不会退两次）', again.status === 409 && (await prisma.balanceLog.count({ where: { orderId: rr.orderId, type: 'REFUND' } })) === 1)
    }

    // =====================================================================================
    section('§7.2「认领上游激活」：取号超时 + 窗口里两个同组合激活 → MANUAL（不自动认领）→ 管理员从候选里认领一个 → WAITING；另一个不取消')
    {
      const u = await mkUser('claim')
      // 校准样本：先正常取一个号，扫描器补写 upstreamCreatedAt
      const s = await place(u, 'dr', 16)
      await pay(s.orderId)
      await settle(s.orderId)
      await claim.scanUnknown({ fillCalibration: true })
      mock.setFaults([{ action: 'getNumberV2', kind: 'hang', delayMs: 16_500, bought: true }])
      const r = await place(u, 'wa', 6)
      const payP = pay(r.orderId)
      await sleep(300)
      mock.buy({ service: 'wa', country: 6 })
      await payP
      await settle(r.orderId)
      mock.clearFaults()
      await claim.scanUnknown({})
      const so = await soOf(r.orderId)
      const att = (await attsOf(so.id))[0]
      check('前置：两个候选 → 订单 MANUAL、尝试仍 UNKNOWN', so.state === 'MANUAL' && att.state === 'UNKNOWN')
      const d = await callRoute(routeADetail.GET, { ...asAdmin, path: `/api/admin/jiema/orders/${so.id}`, params: { id: String(so.id) } })
      check('详情列出 UNKNOWN 尝试（可认领）', (d.json?.data?.unknownAttempts ?? []).includes(att.id))
      const c = await callRoute(routeAClaim.GET, { ...asAdmin, path: `/api/admin/jiema/orders/${so.id}/claim?attemptId=${att.id}`, params: { id: String(so.id) } })
      const list = (c.json?.data?.list ?? []) as Array<Record<string, any>>
      check('候选：同服务同国家、本站不认识的两个激活，都在时间窗内（strict）', c.status === 200 && list.length === 2 && list.every((x) => x.inWindow && x.strict), JSON.stringify(list).slice(0, 300))
      const pick = list[0].id as string
      const other = list[1].id as string
      const cl = await callRoute(routeADetail.POST, { ...asAdmin, method: 'POST', path: `/api/admin/jiema/orders/${so.id}`, params: { id: String(so.id) }, body: { action: 'claim', attemptId: att.id, activationId: pick, reason: 'itest 认领' } })
      const so2 = await soOf(r.orderId)
      const att2 = await prisma.smsAttempt.findUniqueOrThrow({ where: { id: att.id } })
      check('认领：尝试 ACTIVE、activationId = 选中的那个、订单 WAITING（号码给了买家）、审计一条', cl.status === 200 && att2.state === 'ACTIVE' && att2.activationId === pick && so2.state === 'WAITING' && (await prisma.auditEvent.count({ where: { action: 'jiema.order.claim', result: 'OK' } })) >= 1, cl.text.slice(0, 200))
      check('另一个激活没有被取消（绝不自动取消来历不明的激活）', mock.get(other)?.status === 'ACTIVE')
      const dup = await callRoute(routeADetail.POST, { ...asAdmin, method: 'POST', path: `/api/admin/jiema/orders/${so.id}`, params: { id: String(so.id) }, body: { action: 'claim', attemptId: att.id, activationId: other, reason: 'itest 再认领' } })
      check('同一个尝试再认领 → 拒绝（已经不是结果未知）', dup.status === 409)
      adv(21 * 60)
      await tick(2)
    }

    // =====================================================================================
    // S2b 评审修复：真实的「换号结果未知」进 MANUAL 之后，解除 MANUAL / 取消并退回余额都拒绝（扫描器会再冻回去、还会放掉买家的旧号）；
    // 认领的硬闸门（价格 > eff(cap)）；认领按冻结前的状态恢复（REPLACING → 完成换号）；先认领、再恢复订单
    const actS2 = async (smsOrderId: number, body: Record<string, unknown>) =>
      callRoute(routeADetail.POST, { ...asAdmin, method: 'POST', path: `/api/admin/jiema/orders/${smsOrderId}`, params: { id: String(smsOrderId) }, body: { reason: 'itest 评审修复', ...body } })
    const manualEv = async (smsOrderId: number) => {
      const ev = await prisma.smsEvent.findFirst({ where: { smsOrderId, type: 'MANUAL' }, orderBy: { id: 'desc' } })
      return { attemptId: ev?.attemptId ?? null, detail: ev?.detail ? (JSON.parse(ev.detail) as Record<string, unknown>) : null }
    }
    /** 换号取新号时上游挂住（号其实买到了）+ 时间窗里再来一个同组合激活 → 尝试 UNKNOWN；pushOldSms=true 时在取新号期间旧号收到码（订单 → RECEIVED） */
    const replaceUnknown = async (orderId: number, pushOldSms: boolean) => {
      const cur0 = (await attsOf((await soOf(orderId)).id)).find((a) => a.state === 'ACTIVE')!
      mock.setFaults([{ action: 'getNumberV2', kind: 'hang', delayMs: 16_500, bought: true }])
      const so0 = await soOf(orderId)
      const repP = engine.buyerReplace(so0, so0.version, null)
      await sleep(800)
      if (pushOldSms) {
        mock.pushSms(cur0.activationId as string, { code: '615243', text: 'Your code is 615243' })
        await engine.pollActive()
      }
      mock.buy({ service: 'wa', country: 6 })
      await repP
      mock.clearFaults()
      await claim.scanUnknown({})
      if ((await soOf(orderId)).state !== 'MANUAL') {
        adv(11 * 60)
        await claim.scanUnknown({})
      }
      return cur0
    }
    section('S2b 评审修复：换号结果未知 → MANUAL（真实 UNKNOWN）→ 解除 MANUAL / 取消并退回余额拒绝（409、旧号不放）→ 超上限的候选拒绝认领 → 认领恢复「换号中」完成换号')
    {
      const u = await mkUser('unk-rep')
      const r = await place(u, 'wa', 6)
      await pay(r.orderId)
      await settle(r.orderId)
      check('前置：支付宝单 → WAITING', (await soOf(r.orderId)).state === 'WAITING')
      adv(130)
      const old = await replaceUnknown(r.orderId, false)
      const so = await soOf(r.orderId)
      const atts = await attsOf(so.id)
      const unk = atts.find((a) => a.state === 'UNKNOWN')!
      const ev = await manualEv(so.id)
      check('前置：换号的新尝试 UNKNOWN、候选不唯一 → 订单 MANUAL；MANUAL 事件记下冻结前状态 REPLACING 与起因尝试', so.state === 'MANUAL' && !!unk && unk.reason === 'REPLACE' && ev.detail?.from === 'REPLACING' && ev.attemptId === unk.id, JSON.stringify({ state: so.state, ev }))
      const d = await callRoute(routeADetail.GET, { ...asAdmin, path: `/api/admin/jiema/orders/${so.id}`, params: { id: String(so.id) } })
      check('详情：有结果未知的取号时不给「解除 MANUAL」「取消并退回余额」', d.json?.data?.actions?.unmanual === false && d.json?.data?.actions?.cancelRefund === false && (d.json?.data?.unknownAttempts ?? []).includes(unk.id))
      const m1 = await actS2(so.id, { action: 'unmanual', target: 'WAITING' })
      const m2 = await actS2(so.id, { action: 'unmanual', target: 'REFUNDING' })
      const c1 = await actS2(so.id, { action: 'cancel_refund' })
      const oldNow = await prisma.smsAttempt.findUniqueOrThrow({ where: { id: old.id } })
      check(
        '解除 MANUAL → WAITING / REFUNDING、取消并退回余额：一律 409「还有结果未知的取号」，订单仍 MANUAL、旧号仍 ACTIVE（上游没被取消）',
        m1.status === 409 && String(m1.json?.error).includes('结果未知') && m2.status === 409 && c1.status === 409 && String(c1.json?.error).includes('结果未知') && (await soOf(r.orderId)).state === 'MANUAL' && oldNow.state === 'ACTIVE' && mock.get(old.activationId as string)?.status === 'ACTIVE',
        `${m1.text.slice(0, 120)} / ${c1.text.slice(0, 120)}`,
      )
      check('三次拒绝都写了审计（DENIED）', (await prisma.auditEvent.count({ where: { actorUserId: admin.id, result: 'DENIED', reason: 'itest 评审修复' } })) >= 3)
      // 候选里再放一个价格离谱的同组合激活（$5）：列表标出 blocked，服务端拒绝认领（OVER_CAP）
      const pricey = mock.buy({ service: 'wa', country: 6 })[0]
      pricey.costMicro = 5_000_000
      const c = await callRoute(routeAClaim.GET, { ...asAdmin, path: `/api/admin/jiema/orders/${so.id}/claim?attemptId=${unk.id}`, params: { id: String(so.id) } })
      const list = (c.json?.data?.list ?? []) as Array<Record<string, any>>
      const bad = list.find((x) => x.id === pricey.id)
      check('候选列表：$5 的激活 overCap、blocked=OVER_CAP；正常价格的 blocked=null', !!bad && bad.overCap === true && bad.blocked === 'OVER_CAP' && list.some((x) => x.id !== pricey.id && x.blocked === null), JSON.stringify(list).slice(0, 300))
      const over = await actS2(so.id, { action: 'claim', attemptId: unk.id, activationId: pricey.id })
      check('认领价格高于 eff(cap) 的激活 → 409 拒绝、尝试仍 UNKNOWN（不按 $5 记成本）', over.status === 409 && String(over.json?.error).includes('上限') && (await prisma.smsAttempt.findUniqueOrThrow({ where: { id: unk.id } })).state === 'UNKNOWN')
      const pick = list.find((x) => x.id !== pricey.id && x.strict)!.id as string
      const cl = await actS2(so.id, { action: 'claim', attemptId: unk.id, activationId: pick })
      const so2 = await soOf(r.orderId)
      const unk2 = await prisma.smsAttempt.findUniqueOrThrow({ where: { id: unk.id } })
      const old2 = await prisma.smsAttempt.findUniqueOrThrow({ where: { id: old.id } })
      check(
        '认领：按冻结前状态恢复 REPLACING → 完成换号：订单 WAITING、当前号 = 认领的新号、换号次数 +1、旧号转释放；提示「号码已给买家」',
        cl.status === 200 && so2.state === 'WAITING' && so2.currentAttemptId === unk.id && so2.replaceCount === 1 && unk2.state === 'ACTIVE' && unk2.activationId === pick && ['RELEASING', 'CANCELLED'].includes(old2.state) && String(cl.json?.message).includes('号码已给买家'),
        `${cl.text.slice(0, 200)} ${so2.state}`,
      )
      const evs = await prisma.smsEvent.findMany({ where: { smsOrderId: so.id, OR: [{ type: 'ADOPT' }, { type: 'STATE', detail: { contains: 'admin-claim' } }] }, orderBy: { id: 'asc' } })
      check('先认领（ADOPT）、再把订单从 MANUAL 恢复（STATE admin-claim）：两步之间尝试已不是 UNKNOWN，推进任务不会把单再冻回去', evs.length === 2 && evs[0].type === 'ADOPT' && evs[1].type === 'STATE', evs.map((e) => e.type).join(','))
    }

    section('S2b 评审修复（第 1 条）：换号结果未知期间旧号收到码（REPLACING → RECEIVED）→ 扫描器冻结 MANUAL → 认领新尝试：恢复 RECEIVED、新号放掉，不切换号码、不扣换号次数')
    {
      const u = await mkUser('unk-recv')
      const r = await place(u, 'wa', 6)
      await pay(r.orderId)
      await settle(r.orderId)
      adv(130)
      const old = await replaceUnknown(r.orderId, true)
      const so = await soOf(r.orderId)
      const unk = (await attsOf(so.id)).find((a) => a.state === 'UNKNOWN')!
      const ev = await manualEv(so.id)
      check('前置：旧号收码后订单 RECEIVED、新尝试仍 UNKNOWN → 扫描器冻结 MANUAL（事件 from=RECEIVED）', so.state === 'MANUAL' && !!unk && ev.detail?.from === 'RECEIVED' && ev.attemptId === unk.id, JSON.stringify({ state: so.state, ev }))
      const c = await callRoute(routeAClaim.GET, { ...asAdmin, path: `/api/admin/jiema/orders/${so.id}/claim?attemptId=${unk.id}`, params: { id: String(so.id) } })
      const pick = ((c.json?.data?.list ?? []) as Array<Record<string, any>>).find((x) => x.blocked === null)?.id as string
      const cl = await actS2(so.id, { action: 'claim', attemptId: unk.id, activationId: pick })
      const so2 = await soOf(r.orderId)
      const unk2 = await prisma.smsAttempt.findUniqueOrThrow({ where: { id: unk.id } })
      check(
        '认领后：订单恢复 RECEIVED（不是 REPLACING → WAITING）、当前号仍是收到码的旧号、换号次数 0、认领的新号转 RELEASING；提示「号码没有给买家」',
        cl.status === 200 && so2.state === 'RECEIVED' && so2.currentAttemptId === old.id && so2.replaceCount === 0 && unk2.state === 'RELEASING' && unk2.activationId === pick && String(cl.json?.message).includes('没有给买家'),
        `${cl.text.slice(0, 240)} state=${so2.state} cur=${so2.currentAttemptId} old=${old.id}`,
      )
      const v = await view.buildOrderView((await view.findBuyerOrder(u.id, r.orderNo))!)
      check('买家号码页：号码仍是第 1 个号、验证码不标成「发给旧号」', v.number?.seq === 1 && v.messages.length >= 1 && v.messages.every((m) => !m.toOldNumber))
      adv(130)
      await tick(2)
      check('满 2 分钟后认领来的新号被放掉（上游取消，不扣费）', (await prisma.smsAttempt.findUniqueOrThrow({ where: { id: unk.id } })).state === 'CANCELLED' && mock.get(pick)?.status !== 'ACTIVE')
    }

    section('S2b 评审修复：解除 MANUAL → PENDING_PAY 要核对收款单与预扣（E44：钱到了却回到待支付，之后再没人推进）')
    {
      const u = await mkUser('unm-pp')
      await fund(u.id, 70, 50)
      const m = await place(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 120 })
      const mso = await soOf(m.orderId)
      await refund.toManual(mso.id, 'itest：E44 模拟')
      const v = (await vmqOf(m.orderId))!
      await prisma.vmqOrder.update({ where: { id: v.id }, data: { state: 1 } })
      const p1 = await actS2(mso.id, { action: 'unmanual', target: 'PENDING_PAY' })
      check('有 state=1 的收款单 → 409（改用「关单并把到账退入余额」），仍 MANUAL', p1.status === 409 && String(p1.json?.error).includes('关单并把到账退入余额') && (await soOf(m.orderId)).state === 'MANUAL', p1.text.slice(0, 200))
      await prisma.vmqOrder.update({ where: { id: v.id }, data: { state: -1 } })
      await prisma.$executeRawUnsafe(`UPDATE balance_holds SET state = 'RELEASED' WHERE order_id = ${m.orderId}`)
      const p2 = await actS2(mso.id, { action: 'unmanual', target: 'PENDING_PAY' })
      check('组合单的预扣已不是 HELD → 409「预扣不是 HELD」', p2.status === 409 && String(p2.json?.error).includes('预扣不是 HELD'), p2.text.slice(0, 200))
      await prisma.$executeRawUnsafe(`UPDATE balance_holds SET state = 'HELD' WHERE order_id = ${m.orderId}`)
      const p3 = await actS2(mso.id, { action: 'unmanual', target: 'PENDING_PAY' })
      check('预扣 HELD、没有到账的收款单 → 回到 PENDING_PAY', p3.status === 200 && (await soOf(m.orderId)).state === 'PENDING_PAY', p3.text.slice(0, 200))
      const s3 = await soOf(m.orderId)
      await engine.buyerClose(s3, s3.version)
      check('收尾：买家取消 → CLOSED、预扣 RELEASED', (await soOf(m.orderId)).state === 'CLOSED' && (await prisma.balanceHold.findUniqueOrThrow({ where: { orderId: m.orderId } })).state === 'RELEASED')
    }

    section('S2b 评审修复：MANUAL（收过码）售后退款失败时留在 MANUAL（不再先改回 RECEIVED）；释放号码遇到「别人正在放」也算已安排')
    {
      const u = await mkUser('man-refund')
      await fund(u.id, 1000, 0)
      const r = await place(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 170 })
      await settle(r.orderId)
      const so = await soOf(r.orderId)
      const a = (await attsOf(so.id))[0]
      mock.pushSms(a.activationId as string, { code: '771234', text: 'Your code is 771234' })
      await tick()
      await engine.lazyAdvance(so.id).catch(() => undefined)
      check('前置：收到码 → RECEIVED', (await soOf(r.orderId)).state === 'RECEIVED')
      await refund.toManual(so.id, 'itest：售后核实')
      await prisma.$executeRawUnsafe(`UPDATE balance_holds SET state = 'RELEASED' WHERE order_id = ${r.orderId}`)
      const f1 = await actS2(so.id, { action: 'refund' })
      const s1 = await soOf(r.orderId)
      check(
        '预扣不是 CAPTURED（人工改过库）→ 售后退款 409、订单**仍是 MANUAL**（不会变成 RECEIVED / FINISHED 掉出人工队列）、没有 REFUND 流水、记一条 REFUND_ERR',
        f1.status === 409 && s1.state === 'MANUAL' && (await prisma.balanceLog.count({ where: { orderId: r.orderId, type: 'REFUND' } })) === 0 && (await prisma.smsEvent.count({ where: { smsOrderId: so.id, type: 'REFUND_ERR' } })) >= 1,
        `${f1.text.slice(0, 160)} ${s1.state}`,
      )
      await prisma.$executeRawUnsafe(`UPDATE balance_holds SET state = 'CAPTURED' WHERE order_id = ${r.orderId}`)
      const f2 = await actS2(so.id, { action: 'refund' })
      const s2 = await soOf(r.orderId)
      check('核实改回后再售后退款 → MANUAL 在同一个事务里直接 → REFUNDED（成本照计、利润 = −成本）', f2.status === 200 && s2.state === 'REFUNDED' && s2.costCents != null && s2.profitCents === -(s2.costCents as number), `${f2.text.slice(0, 160)} ${s2.state}`)
      // 释放号码：号已是 RELEASING 且推进任务正占着这次上游调用（nextCheckAt 在未来）→ releaseAttempt 返回 SKIP，也算已安排释放
      const u2 = await mkUser('rel-skip')
      await fund(u2.id, 1000, 0)
      const r2 = await place(u2, 'ot', 6, { payWith: 'BALANCE', expectBalance: 170 })
      await settle(r2.orderId)
      adv(130)
      const so2 = await soOf(r2.orderId)
      const a2 = (await attsOf(so2.id))[0]
      await prisma.smsAttempt.update({ where: { id: a2.id }, data: { state: 'RELEASING', nextCheckAt: new Date(runtime.jnow().getTime() + 60_000) } })
      const rl = await actS2(so2.id, { action: 'release_attempt', attemptId: a2.id })
      check('释放号码（别的推进任务正在放）→ 200「已安排释放」、审计 OK', rl.status === 200 && String(rl.json?.message).includes('已安排释放') && (await prisma.auditEvent.count({ where: { action: 'jiema.order.release_attempt', result: 'OK', actorUserId: admin.id } })) >= 2, rl.text.slice(0, 200))
      adv(70)
      await tick(2)
      check('  …推进任务随后把号放掉 → 订单整单退回（T21）', (await prisma.smsAttempt.findUniqueOrThrow({ where: { id: a2.id } })).state === 'CANCELLED')
    }

    section('S2b 评审修复（第 11 条）：订单留言的发送频控；接码单留言推送同一张单 60 秒只推第一条')
    {
      const u = await mkUser('flood')
      const r = await place(u, 'ot', 6)
      const as = { host: MAIN, token: u.token }
      bodies.length = 0
      const codes: number[] = []
      for (let i = 0; i < 11; i++) {
        const p = await callRoute(routeMsgs.POST, { ...as, method: 'POST', path: `/api/orders/${r.orderId}/messages`, params: { id: String(r.orderId) }, body: { content: `itest-flood-${i}` } })
        codes.push(p.status)
      }
      check('同一账号 1 分钟内第 11 条 → 429（前 10 条 200）', codes.slice(0, 10).every((c) => c === 200) && codes[10] === 429, codes.join(','))
      check('入库 10 条（被限的那条不入库）', (await prisma.orderMessage.count({ where: { orderId: r.orderId, sender: 'BUYER' } })) === 10)
      await sleep(300)
      check('企业微信推送只推了第一条（同一张单 60 秒节流；其余照样入库、后台红点照样亮）', bodies.filter((b) => b.includes('itest-flood-')).length === 1, String(bodies.filter((b) => b.includes('itest-flood-')).length))
      const so = await soOf(r.orderId)
      await engine.buyerClose(so, so.version)
    }

    // =====================================================================================
    section('§7.1 概览（S2 部分）：在途占用与 E26 同一个 inflightMicro、告警线 $2 不停售、今日计数与营收成本毛利')
    {
      const u = await mkUser('ov')
      const r = await place(u, 'ot', 6) // 一张待支付单：进在途占用 C
      const ov = await callRoute(routeOverview.GET, { ...asAdmin, path: '/api/admin/jiema/overview' })
      const s2 = ov.json?.data?.s2
      check('概览 200、s2 有值（上游余额读得到）', ov.status === 200 && !!s2 && s2.upstream.balanceMicro != null, ov.json?.data?.s2Error ?? '')
      const cache = runtime.balanceCache()
      if (s2 && cache && cache !== 'UNKNOWN') {
        const snap = await sellable.loadInflightSnapshot(new Date(cache.balanceAt))
        const inf = gate.inflightMicro(snap, new Date(cache.balanceAt), null, runtime.jnow())
        check('在途占用 = inflightMicro（口径A / 口径B / C 逐项相同、合计 = max(A,B)+C）', s2.upstream.inflight.aMicro === inf.a && s2.upstream.inflight.bMicro === inf.b && s2.upstream.inflight.cMicro === inf.c && s2.upstream.inflight.totalMicro === Math.max(inf.a, inf.b) + inf.c, JSON.stringify({ got: s2.upstream.inflight, exp: inf }))
        check('可售余量 = 余额 − 在途占用', s2.upstream.sellableMicro === cache.balanceMicro - s2.upstream.inflight.totalMicro)
      }
      check('告警线 $2（不停售）、推进心跳字段、今日下单 ≥ 1', s2?.upstream.alertLineUsd === 2 && 'tickAt' in (s2?.heartbeat ?? {}) && s2?.today.created >= 1)
      const f = s2?.today.finance
      check('今日营收 / 成本 / 毛利：毛利 = 营收 − 真实成本 − 售后冲减', !!f && f.profitCents === f.revenueCents - f.costCents - f.refundOffsetCents, JSON.stringify(f))
      check('今日有售后退款 → 冲减 > 0；有已取消单 → 计数 > 0、不进营收', !!f && f.refundOffsetCents > 0 && f.cancelled.count > 0)
      mock.setBalanceUsd(1.5)
      runtime.resetBalanceForTest(null)
      const ov2 = await callRoute(routeOverview.GET, { ...asAdmin, path: '/api/admin/jiema/overview' })
      check('上游余额 $1.50（低于告警线）：概览照常显示余额，sms_holds 里没有「余额停售」', ov2.json?.data?.s2?.upstream.balanceMicro === 1_500_000 && (await prisma.smsHold.count({ where: { reason: { contains: 'BALANCE' } } })) === 0)
      mock.setBalanceUsd(50)
      runtime.resetBalanceForTest(null)
      const so = await soOf(r.orderId)
      await engine.buyerClose(so, so.version)
    }

    // =====================================================================================
    section('§6.6 第 28 条 后台订单列表与仪表盘：接码单的成本利润（已取消「不计」、预估灰字、合计并进利润）')
    {
      const st = await callRoute(routeStats.GET, { ...asAdmin, path: '/api/admin/stats' })
      const j = st.json?.data?.jiema
      check('仪表盘 stats.jiema：今天与近 30 天，毛利 = 营收 − 成本 − 冲减', st.status === 200 && !!j && j.today.profitCents === j.today.revenueCents - j.today.costCents - j.today.refundOffsetCents && j.last30.finalized >= j.today.finalized)
      const refunded = await prisma.smsOrder.findFirstOrThrow({ where: { state: 'REFUNDED', userId: { in: userIds } } })
      const o = await prisma.order.findUniqueOrThrow({ where: { id: refunded.orderId }, select: { orderNo: true } })
      const ao = await callRoute(routeAdminOrders.GET, { ...asAdmin, path: `/api/admin/orders?keyword=${o.orderNo}` })
      const row = (ao.json?.data?.list ?? []).find((x: any) => x.orderNo === o.orderNo)
      check('后台订单列表：接码单行带 jiema { costCents, profitCents, costFinal, lossCents }', !!row && row.jiema?.costCents === refunded.costCents && row.jiema?.profitCents === refunded.profitCents, JSON.stringify(row?.jiema))
      check('页脚合计 totals.jiema：真实成本 / 毛利并进合计', !!ao.json?.data?.totals?.jiema && ao.json.data.totals.jiema.cost === (refunded.costCents as number) / 100)
    }

    // =====================================================================================
    section('§6.6 第 32 条 条款页第四节：《短信接码服务条款》第一节五条只在对全部用户开放时出现（正文是代码常量）')
    {
      const t1 = textOf(await withRequest({ host: MAIN }, () => TermsPage())).join('')
      check('受众仅管理员：条款页没有接码五条（灰度期付款前弹窗与 /jiema/terms 自带全文）', !t1.includes(JIEMA_TERMS[3]))
      await setCfg({ audience: 'ALL' })
      const t2 = textOf(await withRequest({ host: MAIN }, () => TermsPage())).join('')
      check('对全部用户开放：条款页第四节列出《短信接码服务条款》第一节五条', JIEMA_TERMS.every((x) => t2.includes(x)))
      await setCfg()
    }

    // =====================================================================================
    section('对账 W1–W5、W9：本测试的数据不新增问题；本测试的用户没有留下 HELD 预扣')
    {
      adv(21 * 60)
      await tick(3)
      const stillHeld = await prisma.balanceHold.count({ where: { userId: { in: userIds }, state: 'HELD' } })
      check('没有留下 HELD 预扣', stillHeld === 0)
      const rep = await reconcile.runWalletReconcile({ full: true, alert: false, save: false })
      for (const code of ['W1', 'W2', 'W3', 'W4', 'W5', 'W9']) {
        const it = rep.items.find((i) => i.code === code)!
        const base = baseSamples(code)
        const fresh = it.samples.filter((s) => !base.has(s))
        check(`${code} 没有新增问题（${it.title}）`, fresh.length === 0, fresh.join('；').slice(0, 400))
      }
      void pushes
    }
  } finally {
    const orders = await prisma.order.findMany({ where: { userId: { in: userIds } }, select: { id: true } })
    const oids = orders.map((o) => o.id)
    const sos = await prisma.smsOrder.findMany({ where: { OR: [{ userId: { in: userIds } }, { orderId: { in: oids } }] }, select: { id: true } })
    const soIds = sos.map((s) => s.id)
    const vmqs = await prisma.vmqOrder.findMany({ where: { bizType: 'order', bizId: { in: oids } }, select: { id: true, orderId: true } })
    await prisma.smsMessage.deleteMany({ where: { smsOrderId: { in: soIds } } })
    await prisma.smsEvent.deleteMany({ where: { smsOrderId: { in: soIds } } })
    await prisma.smsAttempt.deleteMany({ where: { smsOrderId: { in: soIds } } })
    await prisma.smsOrder.deleteMany({ where: { id: { in: soIds } } })
    await prisma.balanceLog.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.balanceHold.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.vmqLock.deleteMany({ where: { orderId: { in: vmqs.map((v) => v.orderId) } } })
    await prisma.vmqOrder.deleteMany({ where: { id: { in: vmqs.map((v) => v.id) } } })
    await prisma.payment.deleteMany({ where: { orderId: { in: oids } } })
    await prisma.orderMessage.deleteMany({ where: { orderId: { in: oids } } })
    await prisma.auditEvent.deleteMany({ where: { actorUserId: { in: userIds } } })
    const fresh = (await prisma.setting.findMany({ where: { key: { startsWith: 'vmq_unmatched:' } }, select: { key: true } })).map((s) => s.key).filter((k) => !unmatchedBefore.has(k))
    await prisma.setting.deleteMany({ where: { key: { in: [...fresh, ...createdKeys, ...vmqs.map((v) => `vmqrec:${v.id}`), ...vmqs.map((v) => `latepay_auto:${v.orderId}`)] } } })
    await prisma.setting.deleteMany({ where: { key: { startsWith: 'latepay_' }, value: { in: [...fresh, ...createdKeys] } } })
    await prisma.order.deleteMany({ where: { id: { in: oids } } })
    await cleanupAll()
    for (const t of SMS_TABLES) await prisma.$executeRawUnsafe(`DELETE FROM ${t}`)
    for (const t of SMS_TABLES) {
      for (const row of saved[t] as Record<string, unknown>[]) {
        const cols = Object.keys(row)
        await prisma.$executeRawUnsafe(`INSERT INTO ${t} (${cols.map((c) => `\`${c}\``).join(',')}) VALUES (${cols.map(() => '?').join(',')})`, ...cols.map((c) => row[c]))
      }
    }
    await prisma.setting.deleteMany({ where: { key: { in: KEEP_SETTINGS } } })
    for (const s of savedSettings) await prisma.setting.create({ data: { key: s.key, value: s.value } })
    for (const sd of seeded) {
      await prisma.product.deleteMany({ where: { id: sd.productId } })
      if (sd.categoryId && (await prisma.product.count({ where: { categoryId: sd.categoryId } })) === 0) await prisma.category.deleteMany({ where: { id: sd.categoryId } })
    }
    await mock.close()
    hook.close()
  }
  const s = summary()
  if (s.fail) process.exitCode = 1
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    setTimeout(() => process.exit(process.exitCode ?? 0), 200)
  })
