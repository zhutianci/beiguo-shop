/**
 * 短信接码 · S2a 服务端核心 —— 数据库集成测试（会建数据、会删数据）。docs/短信接码-设计.md §12.2 中 S2a 能覆盖的部分。
 *
 *   set -a; . ./.env.local; set +a; VMQ_KEY=itest npx tsx scripts/itest-jiema.ts
 *
 * ⚠️ 只能对一次性的本地库跑（库名须含 dev / test）。**不调用真实 hero-sms**：上游一律是本地假服务（scripts/mock-herosms.ts，只绑 127.0.0.1），
 * 企业微信推送打到本地假 webhook。引擎的时钟与假服务的虚拟时钟一起拨（adv），不用真等 20 分钟。
 * sms_* 目录与停售表、sms_config / sms_catalog_at / sms_runtime / wallet_config 等设置在开始时存档、结束时原样恢复；本测试建的订单、流水、预扣、收款单全部删掉。
 *
 * 覆盖（编号是 §12.2 的条目）：
 *   正常流 10 支付宝全额（预估 → 定稿）、11 余额付清、12 组合、13 两条短信 + 我已用完、14 换号、15 到期退回（两格原路、一条 REFUND、销量不变、成本利润为空）、
 *   16 满 2 分钟后买家取消、17 READY（对账补履约 + 晚于锁价 20 分钟；开始 / 退回 / 停售 409 / 24 小时自动退；反例：到账路径当场履约 → ACQUIRING）；
 *   接码异常 19 NO_NUMBERS ×3 + 第 2 次改任意运营商、20 WRONG_MAX_PRICE（不按更高价、标脏）、21 NO_BALANCE（不写停售、刷新余额、推送）、
 *   22 BANNED specific / global（换号时保留旧号）、23 CHANNELS_LIMIT（threads 记录、换号 409 THREADS、90 秒退）、24 超时 → 认领、
 *   25 NOT_BOUGHT（两轮有效扫描；失败的一轮不计）、26 两个候选 → MANUAL、27 落库失败 → UNKNOWN → 认领、28 未关联激活不取消、
 *   29 重复到账只取一次号、30–32 换号瞬间来码（E14 ①②③）、33 EARLY_CANCEL_DENIED、34 / 110 上游先结束（history 10 → T21；history 6 → T22 不调 finish）、
 *   35 上游宕机：熔断开 / 关、endsAt + 60 分钟推定取消、36 并发换号一个 409、37 并发下单超限只成一单、38 同一 clientToken、39 退款并发只一条 REFUND、
 *   40 快照（改配置不追溯）、41 报价过期后发起支付 → 关单释放、42 渠道 Host 404、44 REPLACING 崩溃恢复三分支、45 cron 停了惰性推进照常 + 心跳告警、
 *   47 本站 / 上游口径自动停售；余额与组合支付 48 / 112 余额在两次提交之间变化、49 组合单锁价 + 20 分钟 tick 关单、50 closeExpired 同一事务释放（注入失败整体回滚）、
 *   51 到账与关单同时（关单赢 → 自动退入；到账赢 → 不释放）、52 买家取消时已到账 → PAID_PROCESSING、53 余额付清崩溃 → T19、54 预扣后取号失败、
 *   58 余额支付急停、60 退款时预扣不是 CAPTURED → MANUAL；v1.0：78 T19 与管理员关单并发、79 取号意图唯一、80 下单与退款并发不死锁、
 *   81 配置坏了在途照常 + 告警线不失明、82 FREE_CANCELLATION_EXPIRED、83 finish NEW_OTP_RECEIVED、84 币种 978、86 SOLD_OUT 不写停售、88 晚到的扣费、
 *   89 已有 3 张待付收款单、102 发起支付前的停售闸门、104 E44、105 计数与计时落库、106 下单即发起收银台（PAY_BUSY / OPEN_PAYMENTS / PAYING）、
 *   108 T4 ①、109 付款事实不依赖状态 CAS、111 换号失败总则、113 getStatus 的两种返回、122 三种手动停售、123 E26 上游余额核对、124 低余额只告警。
 */
import http from 'http'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { Prisma } from '@prisma/client'
import {
  prisma,
  check,
  section,
  summary,
  setChannelsMode,
  signTestToken,
  callRoute,
  ensurePlatformTenant,
  createTenant,
  createUser,
  cleanupAll,
  type RouteFn,
  type WorldUser,
} from './itest-tenant/_harness'
import { startMockHeroSms, type MockHandle } from './mock-herosms'

const MAIN = 'bigolab.com'
const KEY = `itest-jiema-s2-${crypto.randomUUID()}`
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const uuid = () => crypto.randomUUID()
const D = (cents: number) => new Prisma.Decimal((cents / 100).toFixed(2))

if (!process.env.VMQ_KEY) process.env.VMQ_KEY = 'itest'
for (const k of ['ALIYUN_ACCESS_KEY_ID', 'ALIYUN_ACCESS_KEY_SECRET', 'ALIYUN_DM_ACCOUNT', 'ALIYUN_DM_NOREPLY', 'ORDER_MSG_WEBHOOK_URL', 'NOTIFY_EVENTS']) delete process.env[k]

const PRICES: Record<string, { usd: number; stock: number; defaultCount?: number; tiers?: Array<[number, number]> }> = {
  'ot:6': { usd: 0.024, stock: 100_000 },
  'ot:187': { usd: 0.6, stock: 100_000 },
  'dr:52': { usd: 0.12, stock: 100_000 },
  'dr:16': { usd: 0.045, stock: 100_000 },
  'dr:187': { usd: 0.66, stock: 100_000 },
  'tg:6': { usd: 0.15, stock: 100_000 },
  'wa:6': { usd: 0.21, stock: 100_000 },
  'acz:48': { usd: 0.06, stock: 100_000 },
  'go:4': { usd: 0.08, stock: 100_000 },
  'wb:3': { usd: 0.5, stock: 100_000 },
}

const SMS_TABLES = ['sms_services', 'sms_countries', 'sms_offer_cache', 'sms_price_rules', 'sms_holds'] as const
const KEEP_SETTINGS = ['sms_config', 'sms_catalog_at', 'sms_operator_names', 'sms_runtime', 'wallet_config', 'vmq_lastpay', 'vmq_lastunmatched', 'vmq_recentraw', 'vmq_lastheart']

async function main() {
  // ---- 假企业微信 webhook ----
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
  process.env.CRON_SECRET = process.env.CRON_SECRET || 'itest-cron-secret-jiema-s2'

  // ---- 假 hero-sms ----
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
  const holds = await import('../src/lib/jiema/holds')
  const sellable = await import('../src/lib/jiema/sellable')
  const claim = await import('../src/lib/jiema/claim')
  const view = await import('../src/lib/jiema/view')
  const upbalance = await import('../src/lib/jiema/upbalance')
  const payGate = await import('../src/lib/jiema/pay-gate')
  const dto = await import('../src/lib/jiema/dto')
  const vmq = await import('../src/lib/vmq')
  const ledger = await import('../src/lib/wallet/ledger')
  const walletCfg = await import('../src/lib/wallet/config')
  const reconcile = await import('../src/lib/wallet/reconcile')
  const { centsOf } = await import('../src/lib/wallet/buckets')
  const { FACTORY_SMS_CONFIG } = await import('../src/lib/jiema-config-schema')
  const { JIEMA_TERMS_VERSION, WALLET_TERMS_VERSION } = await import('../src/lib/terms/jiema-wallet')
  const routeOrders = (await import('../src/app/api/jiema/orders/route')) as unknown as { POST: RouteFn }
  const routeView = (await import('../src/app/api/jiema/orders/[orderNo]/route')) as unknown as { GET: RouteFn }
  const routeCancel = (await import('../src/app/api/jiema/orders/[orderNo]/cancel/route')) as unknown as { POST: RouteFn }
  const routePay = (await import('../src/app/api/pay/vmq/create/route')) as unknown as { POST: RouteFn }
  const routeTick = (await import('../src/app/api/cron/jiema-tick/route')) as unknown as { GET: RouteFn }

  // ---- 存档 ----
  const saved: Record<string, unknown[]> = {}
  for (const t of SMS_TABLES) saved[t] = await prisma.$queryRawUnsafe(`SELECT * FROM ${t}`)
  const savedSettings = await prisma.setting.findMany({ where: { key: { in: KEEP_SETTINGS } } })
  const unmatchedBefore = new Set((await prisma.setting.findMany({ where: { key: { startsWith: 'vmq_unmatched:' } }, select: { key: true } })).map((s) => s.key))
  const baseline = await reconcile.runWalletReconcile({ full: true, alert: false, save: false })
  const baseSamples = (code: string) => new Set(baseline.items.find((i) => i.code === code)?.samples ?? [])
  const userIds: number[] = []
  let seededCarrier: { productId: number; categoryId: number | null } | null = null
  let e44Hold: number | null = null

  const resetCaches = () => {
    catalog.resetCatalogCachesForTest()
    jcfg.invalidateSmsConfigCache()
  }
  const cfgBase = { ...FACTORY_SMS_CONFIG, enabled: true, audience: 'ADMIN_ONLY' as const, limits: { activePerUser: 10, perHour: 100, perDay: 500, maxActiveNumbers: 400 } }
  const setCfg = async (over: Record<string, unknown> | string = {}) => {
    const value = typeof over === 'string' ? over : JSON.stringify({ ...cfgBase, ...over })
    await prisma.setting.upsert({ where: { key: 'sms_config' }, create: { key: 'sms_config', value }, update: { value } })
    resetCaches()
    await jcfg.readSmsConfig()
  }
  const setWallet = async (over: Record<string, unknown> = {}) => {
    const value = JSON.stringify({ ...walletCfg.FACTORY_WALLET_CONFIG, ...over })
    await prisma.setting.upsert({ where: { key: 'wallet_config' }, create: { key: 'wallet_config', value }, update: { value } })
  }
  const adv = (sec: number) => {
    mock.advance(sec)
    runtime.advanceClockForTest(sec)
  }
  const pushes = async (needle: string) => {
    await sleep(150)
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

    section('准备：SMS_POOL 载体种子（可重复执行、恰好 1 行）、目录同步、配置')
    {
      const runSql = async (file: string) => {
        const sql = fs.readFileSync(path.join(__dirname, 'ops', file), 'utf8')
        const stmts = sql.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n').split(/;\s*(?:\n|$)/).map((x) => x.trim()).filter(Boolean)
        for (const st of stmts) {
          if (/^SELECT\b/i.test(st)) await prisma.$queryRawUnsafe(st)
          else await prisma.$executeRawUnsafe(st)
        }
      }
      const before = await prisma.product.findMany({ where: { deliveryType: 'SMS_POOL' }, select: { id: true } })
      const catBefore = await prisma.category.findFirst({ where: { name: '系统（勿删）' }, select: { id: true } })
      if (before.length === 0) {
        await runSql('jiema-s2-seed.sql')
        await runSql('jiema-s2-seed.sql')
        const after = await prisma.product.findMany({ where: { deliveryType: 'SMS_POOL' } })
        seededCarrier = { productId: after[0]?.id ?? 0, categoryId: catBefore ? null : (await prisma.category.findFirst({ where: { name: '系统（勿删）' } }))?.id ?? null }
        check('种子执行两次：恰好 1 行 SMS_POOL 载体（下架、价格 0）', after.length === 1 && after[0].status === 0 && centsOf(after[0].price) === 0)
      } else check(`库里已有 ${before.length} 行 SMS_POOL 载体（沿用）`, before.length === 1)
      await setCfg()
      await setWallet()
      const job = await catalog.runCatalogJob({ forceStatic: true })
      check('目录同步成功（假上游）', !!job.static?.ok && !!job.prices?.ok)
    }
    const carrierId = (await order.smsCarrierId())!
    check('smsCarrierId 找到载体', !!carrierId)
    const carrierSales0 = (await prisma.product.findUniqueOrThrow({ where: { id: carrierId } })).sales

    // ---- 工具 ----
    const mkUser = async (name: string, role: 'USER' | 'ADMIN' = 'ADMIN'): Promise<WorldUser & { token: string }> => {
      const u = await createUser(`jm2-${name}-${uuid().slice(0, 6)}`, { role })
      userIds.push(u.id)
      return { ...u, token: signTestToken(u as never, 'main') }
    }
    const fund = async (userId: number, topupCents: number, cashCents: number) => {
      await ledger.inMoneyTx(async (tx) => {
        if (topupCents) await ledger.postInTx(tx, { userId, topupDeltaCents: topupCents, type: 'ADJUST', bizKey: `adj:it-${uuid()}` })
        if (cashCents) await ledger.postInTx(tx, { userId, cashDeltaCents: cashCents, type: 'ADJUST', bizKey: `adj:it-${uuid()}` })
      })
    }
    const buckets = async (userId: number) => {
      const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { balance: true, topupCents: true } })
      return { topup: u.topupCents, cash: centsOf(u.balance) }
    }
    const cfgNow = async () => {
      const r = await jcfg.readSmsConfig()
      if (!r.ok) throw new Error('sms_config 读不到')
      return r.config
    }
    const priceOf = async (service: string, country: number) => {
      const q = await catalog.quote(service, country, await cfgNow(), runtime.jnow())
      if (!q.ok) throw new Error(`报价失败 ${service}:${country} ${q.code}`)
      return q
    }
    type Opts = { payWith?: 'ALIPAY' | 'BALANCE'; operator?: string | null; fallback?: boolean; expectBalance?: number | null; expectPrice?: number; token?: string; agree?: boolean }
    const place = async (u: { id: number; role: string }, service: string, country: number, o: Opts = {}) => {
      let q: { priceCents: number }
      if (o.expectPrice != null) q = { priceCents: o.expectPrice }
      else {
        const qq = await catalog.quote(service, country, await cfgNow(), runtime.jnow())
        q = { priceCents: qq.ok ? qq.priceCents : 1 }
      }
      return order.createJiemaOrder(
        { id: u.id, role: u.role },
        {
          service,
          country,
          operator: o.operator ?? null,
          operatorFallback: o.fallback ?? true,
          expectPriceCents: o.expectPrice ?? q.priceCents,
          payWith: o.payWith ?? 'ALIPAY',
          expectBalanceCents: o.expectBalance ?? null,
          clientToken: o.token ?? uuid(),
          agree: o.agree ?? true,
          termsVersion: JIEMA_TERMS_VERSION,
          walletTermsVersion: WALLET_TERMS_VERSION,
        },
      )
    }
    const placeOk = async (u: { id: number; role: string }, service: string, country: number, o: Opts = {}) => {
      const r = await place(u, service, country, o)
      if (!r.ok) throw new Error(`下单失败 ${service}:${country} ${r.code} ${r.message}`)
      return r.data
    }
    const soOf = (orderId: number) => prisma.smsOrder.findUniqueOrThrow({ where: { orderId } })
    const attsOf = (smsOrderId: number) => prisma.smsAttempt.findMany({ where: { smsOrderId }, orderBy: { seq: 'asc' } })
    const curOf = async (orderId: number) => {
      const so = await soOf(orderId)
      return so.currentAttemptId ? prisma.smsAttempt.findUniqueOrThrow({ where: { id: so.currentAttemptId } }) : null
    }
    const vmqOf = (orderId: number, state = 0) => prisma.vmqOrder.findFirst({ where: { bizType: 'order', bizId: orderId, state }, orderBy: { id: 'desc' } })
    let rawSeq = 0
    const pay = async (orderId: number) => {
      const v = await vmqOf(orderId)
      if (!v) throw new Error(`订单 ${orderId} 没有待支付收款单`)
      await vmq.markPaidByAmount(Number(v.reallyPrice).toFixed(2), 2, `你已成功收款${Number(v.reallyPrice).toFixed(2)}元（itest-${++rawSeq}-${uuid()}）`)
      return v
    }
    /** 取号在后台挂着（付款后踢取号最多等 8 秒就返回、超时 15 秒）：等这张单没有 REQUESTING 的尝试 */
    const settle = async (orderId: number) => {
      const so = await soOf(orderId)
      for (let i = 0; i < 50; i++) {
        if (!(await prisma.smsAttempt.count({ where: { smsOrderId: so.id, state: 'REQUESTING' } }))) return
        await sleep(400)
      }
    }
    // tick 里的成功率监控（每 5 / 10 分钟）会按测试造出来的大量「没收到码」的号自动停售组合：这里让它们一直不到点，第 47 条单独直接调
    const tick = async (n = 1) => {
      for (let i = 0; i < n; i++) {
        const t = runtime.jnow().getTime()
        runtime.rt().periodic.localSuccess = t
        runtime.rt().periodic.upstreamStats = t
        await engine.tickRound()
      }
    }
    const logsOf = (orderId: number) => prisma.balanceLog.findMany({ where: { orderId }, orderBy: { id: 'asc' } })
    const mockCalls = (action: string, id?: string) => mock.log.filter((e) => e.action === action && (!id || e.path.includes(`id=${id}`))).length

    // =====================================================================================
    section('T1 下单校验：受众、条款、改价、没货、不在目录（§6.4、E6、第 86 条）')
    {
      const plain = await mkUser('plain', 'USER')
      const r0 = await place(plain, 'ot', 6)
      check('受众仅管理员：普通用户 503 MAINTENANCE（「即将开放」）', !r0.ok && r0.status === 503 && r0.code === 'MAINTENANCE' && r0.message.includes('即将开放'))
      const a = await mkUser('t1')
      const rt = await place(a, 'ot', 6, { agree: false })
      check('没勾条款 → 409 TERMS', !rt.ok && rt.code === 'TERMS')
      const q = await priceOf('ot', 6)
      check('ot:6 报价 = ⌈0.024 × 8 × 100⌉ + 150 = 170 分（§4.7）', q.priceCents === 170 && q.capMicro === 30_000)
      const rp = await place(a, 'ot', 6, { expectPrice: 150 })
      check('期望价不等 → 409 PRICE_CHANGED（带新价与拆分）', !rp.ok && rp.code === 'PRICE_CHANGED' && (rp.extra as { priceCents: number }).priceCents === 170)
      const holds0 = await prisma.smsHold.count()
      const rs = await place(a, 'wa', 187, { expectPrice: 100 })
      check('offers 404（这个组合没货）→ 409 SOLD_OUT，sms_holds 没有新行（第 86 条）', !rs.ok && rs.code === 'SOLD_OUT' && (await prisma.smsHold.count()) === holds0)
      const rf = await order.createJiemaOrder({ id: a.id, role: 'ADMIN' }, { service: 'full', country: 6, operator: null, operatorFallback: true, expectPriceCents: 100, payWith: 'ALIPAY', clientToken: uuid(), agree: true, termsVersion: JIEMA_TERMS_VERSION, walletTermsVersion: WALLET_TERMS_VERSION })
      check('full（租号，不在目录）→ 404 NOT_FOUND，不打上游', !rf.ok && rf.status === 404)
      const ro = await place(a, 'ot', 6, { operator: 'nope' })
      check('运营商不在这个国家的列表里 → 400', !ro.ok && ro.status === 400)
      check('上面这些都没有建单', (await prisma.smsOrder.count({ where: { userId: a.id } })) === 0 && (await prisma.order.count({ where: { userId: a.id } })) === 0)
    }

    // =====================================================================================
    section('第 10 条 支付宝全额：下单即收银台 → 到账 → 取号 → 收码（预估）→ 到期前 30 秒完成 → 定稿')
    let firstOrderId = 0
    {
      const u = await mkUser('alipay')
      const r = await placeOk(u, 'dr', 52)
      firstOrderId = r.orderId
      check('下单：next=CASHIER、带 payUrl、payMode=ALIPAY、price 246', r.next === 'CASHIER' && !!r.payUrl && r.payMode === 'ALIPAY' && r.priceCents === 246)
      const o = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } })
      check('Order：SMS_POOL 载体、amount = 售价（不含税）、invoiceTaxFee 空、remark / buyerRemark 空、productName「短信接码 · 服务 · 国家/地区」', o.productId === carrierId && centsOf(o.amount) === 246 && o.invoiceTaxFee == null && o.remark == null && o.buyerRemark == null && o.productName.startsWith('短信接码 · '))
      const v = await vmqOf(r.orderId)
      check('收款单金额 = 应付 2.46（纯支付宝）', !!v && centsOf(v.price) === 246)
      const so0 = await soOf(r.orderId)
      check('SmsOrder：PENDING_PAY、快照 saleCoef4=80000 / costFx4=72000 / cap / acquireTries=3 / longWaitOk=false / 两份条款版本', so0.state === 'PENDING_PAY' && so0.saleCoef4 === 80000 && so0.costFx4 === 72000 && so0.capMicro === 150_000 && so0.acquireTries === 3 && !so0.longWaitOk && so0.termsVersion === JIEMA_TERMS_VERSION && so0.walletTermsVersion === WALLET_TERMS_VERSION)
      const paid = await pay(r.orderId)
      const so1 = await soOf(r.orderId)
      const cur = await curOf(r.orderId)
      check('到账 → 同一事务翻 PAID、alipayPaidCents = 收款单实付、SmsOrder → 付款后马上取号 → WAITING', so1.state === 'WAITING' && so1.alipayPaidCents === centsOf(paid.reallyPrice) && !!cur && cur.state === 'ACTIVE' && !!cur.activationId)
      const pays = await prisma.payment.findMany({ where: { orderId: r.orderId } })
      check('Payment 只有一行 ALIPAY，tradeNo = 收款单号；Order PROCESSING', pays.length === 1 && pays[0].payMethod === 'ALIPAY' && pays[0].tradeNo === paid.orderId && (await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } })).deliveryStatus === 'PROCESSING')
      check('号码：canCancelAt = 响应 + 123 秒、waitUntil = endsAt − 45 秒', !!cur && cur.canCancelAt!.getTime() - cur.respondedAt!.getTime() === 123_000 && cur.endsAt!.getTime() - cur.waitUntil!.getTime() === 45_000)
      mock.pushSms(cur!.activationId!)
      await tick()
      const so2 = await soOf(r.orderId)
      const msgs = await prisma.smsMessage.findMany({ where: { smsOrderId: so2.id } })
      check('收码：批量查码 → RECEIVED、Order DELIVERED、短信入库（getAllSms 全文）', so2.state === 'RECEIVED' && msgs.length === 1 && !!msgs[0].text && (await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } })).deliveryStatus === 'DELIVERED')
      check('成本利润预估：实扣 $0.12 → ⌈86.4⌉ = 87 分、利润 159、costFinal=false', so2.chargedMicro === 120_000 && so2.costCents === 87 && so2.profitCents === 159 && !so2.costFinal)
      // 第 13 条：第二条短信
      adv(60)
      mock.pushSms(cur!.activationId!, { code: '999111' })
      await tick()
      check('第二条短信也显示（两条）', (await prisma.smsMessage.count({ where: { smsOrderId: so2.id } })) === 2)
      adv(20 * 60)
      await tick()
      const so3 = await soOf(r.orderId)
      check('到期前 30 秒系统完成 → FINISHED、所有尝试终态 → 定稿（costFinal、costAt）', so3.state === 'FINISHED' && so3.costFinal && !!so3.costAt && so3.profitCents === 159)
      check('载体销量不变', (await prisma.product.findUniqueOrThrow({ where: { id: carrierId } })).sales === carrierSales0)
      const v2 = await view.buildOrderView((await view.findBuyerOrder(u.id, r.orderNo))!)
      const names = dto.collectKeyNames(JSON.parse(JSON.stringify(v2)))
      check('号码页视图：两条短信、终态 pollMs=0、没有成本 / 上限 / 系数 / activationId', v2.messages.length === 2 && v2.pollMs === 0 && dto.FORBIDDEN_BUYER_KEYS.every((k) => !names.has(k)))
    }

    // =====================================================================================
    section('第 11 条 余额付清：下单请求里就翻 PAID → 秒开号；第 15 条 到期没码 → 整单原路退回（REFUND 一条、成本利润为空）')
    {
      const u = await mkUser('bal')
      await fund(u.id, 1000, 0)
      const q = await priceOf('ot', 6)
      const r = await placeOk(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: q.priceCents })
      check('余额付清：next=NUMBER、payMode=BALANCE', r.next === 'NUMBER' && r.payMode === 'BALANCE' && r.balanceCents === 170)
      const o = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } })
      const pays = await prisma.payment.findMany({ where: { orderId: r.orderId } })
      const h = await prisma.balanceHold.findUniqueOrThrow({ where: { orderId: r.orderId } })
      check('Order PAID、payMethod=BALANCE、Payment 只有一行 BALANCE、预扣 CAPTURED', o.payStatus === 'PAID' && o.payMethod === 'BALANCE' && pays.length === 1 && pays[0].payMethod === 'BALANCE' && h.state === 'CAPTURED')
      check('没有收款单', (await prisma.vmqOrder.count({ where: { bizType: 'order', bizId: r.orderId } })) === 0)
      const so = await soOf(r.orderId)
      check('已取号（WAITING）', so.state === 'WAITING' && so.alipayPaidCents === 0)
      check('余额：充值格 1000 − 170', (await buckets(u.id)).topup === 830)
      adv(20 * 60 - 40)
      await tick(2)
      const so2 = await soOf(r.orderId)
      const logs = await logsOf(r.orderId)
      const refunds = logs.filter((l) => l.type === 'REFUND')
      check('到期前 45 秒主动取消 → CANCELLED、refundReason=EXPIRED', so2.state === 'CANCELLED' && so2.refundReason === 'EXPIRED')
      check('一条 REFUND（refund:<orderId>）、充值格原路 +170、两格回到 1000', refunds.length === 1 && refunds[0].bizKey === `refund:${r.orderId}` && refunds[0].topupDeltaCents === 170 && (await buckets(u.id)).topup === 1000)
      const o2 = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } })
      check('Order REFUNDED / CANCELLED、成本利润为空、销量不变', o2.payStatus === 'REFUNDED' && o2.deliveryStatus === 'CANCELLED' && so2.costCents == null && so2.profitCents == null && so2.chargedMicro == null && (await prisma.product.findUniqueOrThrow({ where: { id: carrierId } })).sales === carrierSales0)
      const v = await view.buildOrderView((await view.findBuyerOrder(u.id, r.orderNo))!)
      check('号码页：refund = 170（充值格 170）、原因「号码到期，没有收到短信」', !!v.refund && v.refund.cents === 170 && v.refund.topupCents === 170 && v.refund.reason === '号码到期，没有收到短信')
    }

    // =====================================================================================
    section('第 12 / 15 条 组合：预扣全部可用余额 → 收银台只收差额 → 到账两行 Payment → 没码退回（两格原路 + 支付宝实收进充值格）')
    {
      const u = await mkUser('mix')
      await fund(u.id, 70, 50)
      const r = await placeOk(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 120 })
      check('组合：next=CASHIER、payMode=MIXED、余额 120 + 支付宝 50', r.next === 'CASHIER' && r.payMode === 'MIXED' && r.balanceCents === 120 && r.alipayCents === 50)
      const h = await prisma.balanceHold.findUniqueOrThrow({ where: { orderId: r.orderId } })
      check('预扣 HELD：充值格 70 + 返现格 50（先充值格，D32）、两格都扣到 0', h.state === 'HELD' && h.topupCents === 70 && h.cashCents === 50 && (await buckets(u.id)).topup === 0 && (await buckets(u.id)).cash === 0)
      const v = await vmqOf(r.orderId)
      check('收款单只收差额 0.50', !!v && centsOf(v.price) === 50)
      const paid = await pay(r.orderId)
      const tail = centsOf(paid.reallyPrice)
      const pays = await prisma.payment.findMany({ where: { orderId: r.orderId }, orderBy: { id: 'asc' } })
      const h2 = await prisma.balanceHold.findUniqueOrThrow({ where: { orderId: r.orderId } })
      check('到账：预扣 CAPTURED、Payment 两行（BALANCE 120 + ALIPAY 50，tradeNo = 收款单号）、和 = amount', h2.state === 'CAPTURED' && pays.length === 2 && pays.some((p) => p.payMethod === 'BALANCE' && centsOf(p.amount) === 120) && pays.some((p) => p.payMethod === 'ALIPAY' && centsOf(p.amount) === 50 && p.tradeNo === paid.orderId))
      const o = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } })
      check('Order.payMethod = ALIPAY（有支付宝部分）', o.payMethod === 'ALIPAY')
      adv(20 * 60)
      await tick(2)
      const so = await soOf(r.orderId)
      const b = await buckets(u.id)
      check(`没码退回：充值格 +70 + ${tail}（支付宝实收，含尾差）、返现格 +50、一条 REFUND`, so.state === 'CANCELLED' && b.topup === 70 + tail && b.cash === 50 && (await logsOf(r.orderId)).filter((l) => l.type === 'REFUND').length === 1)
      check('SmsOrder 记下两格退款额', so.refundTopupCents === 70 + tail && so.refundCashCents === 50)
    }

    // =====================================================================================
    section('第 14 条 换号 → 旧号被取消 → 新号收码（成本只计新号）；第 36 条 并发换号一个 409')
    {
      const u = await mkUser('repl')
      const r = await placeOk(u, 'dr', 16)
      await pay(r.orderId)
      let so = await soOf(r.orderId)
      const old = (await curOf(r.orderId))!
      const early = await engine.buyerReplace(so, so.version)
      check('未满 2 分钟换号 → 409 TOO_EARLY（带剩余秒数）', !early.ok && early.code === 'TOO_EARLY' && typeof early.extra?.sec === 'number')
      adv(125)
      so = await soOf(r.orderId)
      const [a1, a2] = await Promise.all([engine.buyerReplace(so, so.version), engine.buyerReplace(so, so.version)])
      check('两个请求同时换号（version 相同）→ 一个成功、一个 409 VERSION', [a1, a2].filter((x) => x.ok).length === 1 && [a1, a2].some((x) => !x.ok && x.code === 'VERSION'))
      so = await soOf(r.orderId)
      const cur = (await curOf(r.orderId))!
      const oldNow = await prisma.smsAttempt.findUniqueOrThrow({ where: { id: old.id } })
      check('换号成功：WAITING、replaceCount=1、当前号换了、旧号 CANCELLED（上游已退）', so.state === 'WAITING' && so.replaceCount === 1 && cur.id !== old.id && oldNow.state === 'CANCELLED' && !oldNow.charged)
      check('旧号在上游已取消', mock.get(old.activationId!)?.status === 'CANCELLED')
      mock.pushSms(cur.activationId!)
      await tick()
      so = await soOf(r.orderId)
      check('新号收码：RECEIVED、成本只计新号（$0.045 → ⌈32.4⌉ = 33 分）', so.state === 'RECEIVED' && so.chargedMicro === 45_000 && so.costCents === 33)
      const fin = await engine.buyerFinish(so, so.version)
      so = await soOf(r.orderId)
      check('我已用完 → finish → FINISHED、定稿', fin.ok && so.state === 'FINISHED' && so.costFinal)
      check('上游收到 setStatus 6', mockCalls('setStatus', cur.activationId!) >= 1 && mock.get(cur.activationId!)?.status === 'FINISHED')
    }

    // =====================================================================================
    section('第 16 / 33 条 买家取消：上游 EARLY_CANCEL_DENIED → 回到 WAITING 并返回剩余秒数；满 2 分钟后取消 → 立即退回')
    {
      const u = await mkUser('cancel')
      await fund(u.id, 500, 0)
      const r = await placeOk(u, 'dr', 16, { payWith: 'BALANCE', expectBalance: (await priceOf('dr', 16)).priceCents })
      let so = await soOf(r.orderId)
      // 只拨引擎的时钟（假上游还没过 120 秒）→ 我方认为可以取消，上游拒绝
      runtime.advanceClockForTest(125)
      const c1 = await engine.buyerCancel(so, so.version)
      so = await soOf(r.orderId)
      const cur = (await curOf(r.orderId))!
      check('上游 EARLY_CANCEL_DENIED → 409 TOO_EARLY、订单回 WAITING、号码回 ACTIVE', !c1.ok && c1.code === 'TOO_EARLY' && so.state === 'WAITING' && cur.state === 'ACTIVE')
      mock.advance(125)
      so = await soOf(r.orderId)
      const c2 = await engine.buyerCancel(so, so.version)
      so = await soOf(r.orderId)
      check('满 2 分钟后取消 → 同一请求里退回（CANCELLED、refundReason=BUYER_CANCEL）', c2.ok && so.state === 'CANCELLED' && so.refundReason === 'BUYER_CANCEL' && (await buckets(u.id)).topup === 500)
    }

    // =====================================================================================
    section('第 17 条 READY：对账补履约 + 晚于锁价 20 分钟 → READY；开始 / 退回 / 停售 409 / 24 小时自动退；反例：到账路径当场履约 → ACQUIRING')
    {
      const u = await mkUser('ready')
      const mkReady = async () => {
        const r = await placeOk(u, 'ot', 6)
        const v = (await vmqOf(r.orderId))!
        // 钱到了、当场履约失败（收款单已 1、订单还是待支付）；3 分钟后对账补履约，这时已晚于锁价到期 + 20 分钟
        await prisma.vmqOrder.update({ where: { id: v.id }, data: { state: 1, payDate: new Date(Date.now() - 4 * 60_000) } })
        await prisma.vmqLock.deleteMany({ where: { orderId: v.orderId } })
        await prisma.smsOrder.update({ where: { orderId: r.orderId }, data: { quoteExpiresAt: new Date(Date.now() - 25 * 60_000) } })
        await vmq.reconcilePaidVmq()
        return r
      }
      const r1 = await mkReady()
      let so = await soOf(r1.orderId)
      check('对账补履约且晚于锁价 + 20 分钟 → READY（不取号）', so.state === 'READY' && (await attsOf(so.id)).length === 0)
      const st = await engine.buyerStart(so, so.version)
      so = await soOf(r1.orderId)
      check('开始接码 → ACQUIRING → 取号 → WAITING', st.ok && so.state === 'WAITING')
      const r2 = await mkReady()
      so = await soOf(r2.orderId)
      const rr = await engine.buyerRefundReady(so, so.version)
      so = await soOf(r2.orderId)
      check('取消并退回余额 → CANCELLED（LATE_START_REFUND），支付宝实收进充值格', rr.ok && so.state === 'CANCELLED' && so.refundReason === 'LATE_START_REFUND' && (so.refundTopupCents ?? 0) >= 170)
      const r3 = await mkReady()
      await prisma.smsHold.create({ data: { key: 'combo:ot:6', until: null, reason: 'ADMIN', source: 'ADMIN', note: 'itest' } })
      so = await soOf(r3.orderId)
      const blocked = await engine.buyerStart(so, so.version)
      check('组合停售时「开始接码」→ 409 HOLD', !blocked.ok && blocked.code === 'HOLD')
      await prisma.smsHold.delete({ where: { key: 'combo:ot:6' } })
      adv(24 * 3600 + 60)
      await engine.advanceOrder(so.id)
      so = await soOf(r3.orderId)
      check('24 小时不操作 → 自动退回余额', so.state === 'CANCELLED' && so.refundReason === 'LATE_START_REFUND')
      // 反例：到账通知晚到、但由到账路径当场履约（payDate 就是现在）→ ACQUIRING
      const r4 = await placeOk(u, 'ot', 6)
      await prisma.smsOrder.update({ where: { orderId: r4.orderId }, data: { quoteExpiresAt: new Date(Date.now() - 25 * 60_000) } })
      await pay(r4.orderId)
      so = await soOf(r4.orderId)
      check('反例：锁价 + 20 分钟之后到账、到账路径当场履约 → ACQUIRING → WAITING（不是 READY）', so.state === 'WAITING')
      adv(21 * 60)
      await tick(2)
    }

    // =====================================================================================
    section('第 19 条 NO_NUMBERS ×3 → 退回；第 2 次起改任意运营商')
    {
      const u = await mkUser('nonum')
      mock.setFaults([{ action: 'getNumberV2', kind: 'no_numbers', times: 3 }])
      const r = await placeOk(u, 'ot', 6, { operator: 'telkomsel', fallback: true })
      await pay(r.orderId)
      let so = await soOf(r.orderId)
      check('第 1 次 NO_NUMBERS：仍 ACQUIRING、提示「号码紧张，正在重试」', so.state === 'ACQUIRING' && so.notice === '号码紧张，正在重试')
      adv(21)
      await engine.advanceOrder(so.id)
      adv(25)
      await engine.advanceOrder(so.id)
      so = await soOf(r.orderId)
      const atts = await attsOf(so.id)
      check('3 次都失败 → CANCELLED（ACQUIRE_FAILED）', so.state === 'CANCELLED' && so.refundReason === 'ACQUIRE_FAILED' && atts.length === 3 && atts.every((a) => a.state === 'FAILED'))
      check('第 1 次按指定运营商、第 2 次起改任意', atts[0].operator === 'telkomsel' && atts[1].operator === null && atts[2].operator === null)
      mock.clearFaults()
    }

    // =====================================================================================
    section('第 20 / 85 条 WRONG_MAX_PRICE：指定运营商 + 允许改任意 → 先按任意重试；否则不按更高价取号 → 退回、报价缓存标脏')
    {
      const u = await mkUser('wmp')
      mock.setFaults([{ action: 'getNumberV2', kind: 'wrong_max_price' }])
      const r = await placeOk(u, 'ot', 6, { operator: 'axis', fallback: true })
      await pay(r.orderId)
      let so = await soOf(r.orderId)
      let atts = await attsOf(so.id)
      check('第 1 次（指定 axis）WRONG_MAX_PRICE → 仍 ACQUIRING', so.state === 'ACQUIRING' && atts[0].errorCode === 'WRONG_MAX_PRICE')
      await engine.advanceOrder(so.id)
      so = await soOf(r.orderId)
      atts = await attsOf(so.id)
      check('随后按任意运营商重试一次 → 取到号', so.state === 'WAITING' && atts[1].operator === null)
      mock.setFaults([{ action: 'getNumberV2', kind: 'wrong_max_price' }])
      await prisma.smsOfferCache.updateMany({ where: { service: 'ot', kind: 'OFFERS' }, data: { fetchedAt: new Date() } })
      const r2 = await placeOk(u, 'ot', 6)
      await pay(r2.orderId)
      so = await soOf(r2.orderId)
      const oc = await prisma.smsOfferCache.findFirst({ where: { service: 'ot', kind: 'OFFERS' } })
      check('没指定运营商、info.min（$0.1234）> cap → 不按更高价取号 → CANCELLED（PRICE_UP）', so.state === 'CANCELLED' && so.refundReason === 'PRICE_UP')
      check('这个服务的第 ② 层报价缓存被标脏', !oc || oc.fetchedAt.getTime() === 0)
      mock.clearFaults()
      adv(21 * 60)
      await tick(2)
    }

    // =====================================================================================
    section('第 21 条 付款后取号 NO_BALANCE → 本单退回、刷新余额缓存、推送（1 小时一次）、不写停售')
    {
      const u = await mkUser('nobal')
      const r = await placeOk(u, 'ot', 6)
      const before = mock.balanceMicro()
      mock.setBalanceUsd(0.001)
      bodies.length = 0
      const holds0 = await prisma.smsHold.count()
      await pay(r.orderId)
      const so = await soOf(r.orderId)
      check('NO_BALANCE → CANCELLED（SERVICE_NA）', so.state === 'CANCELLED' && so.refundReason === 'SERVICE_NA')
      check('sms_holds 没有新行（不设停售，Q4）', (await prisma.smsHold.count()) === holds0)
      const c = runtime.balanceCache()
      check('余额缓存立即刷新（= 假上游当前余额）', !!c && c !== 'UNKNOWN' && c.balanceMicro === mock.balanceMicro())
      check('推送 UPSTREAM_NO_BALANCE', (await pushes('UPSTREAM_NO_BALANCE')) === 1)
      mock.setBalanceUsd(before / 1e6)
      runtime.resetBalanceForTest(null)
    }

    // =====================================================================================
    section('第 22 条 BANNED：specific 停这个组合、global 全局停售；换号时遇到 → 保留旧号、回 WAITING')
    {
      const u = await mkUser('ban')
      mock.setFaults([{ action: 'getNumberV2', kind: 'banned_specific' }])
      const r = await placeOk(u, 'acz', 48)
      await pay(r.orderId)
      let so = await soOf(r.orderId)
      const h = await prisma.smsHold.findUnique({ where: { key: 'combo:acz:48' } })
      check('BANNED specific → combo:acz:48 停售到 banned_until、本单 CANCELLED（COMBO_NA）', !!h && h.reason === 'BANNED' && !!h.until && so.state === 'CANCELLED' && so.refundReason === 'COMBO_NA')
      await prisma.smsHold.deleteMany({ where: { key: 'combo:acz:48' } })
      const r2 = await placeOk(u, 'dr', 16)
      await pay(r2.orderId)
      adv(125)
      mock.setFaults([{ action: 'getNumberV2', kind: 'banned_global' }])
      so = await soOf(r2.orderId)
      const old = (await curOf(r2.orderId))!
      await engine.buyerReplace(so, so.version)
      so = await soOf(r2.orderId)
      const g = await prisma.smsHold.findUnique({ where: { key: 'global' } })
      check('换号时 BANNED global → 全局停售、订单回 WAITING、旧号保留、replaceCount 不变', !!g && g.reason === 'BANNED' && so.state === 'WAITING' && so.currentAttemptId === old.id && so.replaceCount === 0 && so.notice === '暂时没有新号码，原号码继续有效，可以稍后再换，或者取消（整单退回余额）')
      const rn = await place(u, 'ot', 6)
      check('全局停售期间新单 → 503 MAINTENANCE', !rn.ok && rn.code === 'MAINTENANCE')
      await prisma.smsHold.deleteMany({ where: { key: 'global' } })
      adv(21 * 60)
      await tick(2)
    }

    // =====================================================================================
    section('第 23 条 CHANNELS_LIMIT：threads 记录（上限、21:00 UTC）→ 换号 409 THREADS → 已付款的单 90 秒内不成就退回')
    {
      const u = await mkUser('thr')
      const w = await placeOk(u, 'dr', 16)
      await pay(w.orderId)
      mock.setFaults([{ action: 'getNumberV2', kind: 'channels_limit' }])
      const r = await placeOk(u, 'ot', 6)
      await pay(r.orderId)
      let so = await soOf(r.orderId)
      const th = await prisma.smsHold.findUnique({ where: { key: 'threads' } })
      const note = th?.note ? JSON.parse(th.note) : null
      check('threads 记录：note 记上限、until = 下一个 21:00 UTC、订单仍 ACQUIRING（记 blockedSince）', !!th && note?.maxAllowed === 10 && th.until!.getUTCHours() === 21 && so.state === 'ACQUIRING' && !!so.blockedSince)
      adv(125)
      const wso = await soOf(w.orderId)
      const rep = await engine.buyerReplace(wso, wso.version)
      check('线程受限期间换号 → 409 THREADS（号码页 replaceBlocked=THREADS）', !rep.ok && rep.code === 'THREADS')
      const vv = await view.buildOrderView((await view.findBuyerOrder(u.id, w.orderNo))!)
      check('  …号码页 actions.replace=false、replaceBlocked=THREADS', !vv.actions.replace && vv.replaceBlocked === 'THREADS')
      await prisma.smsHold.update({ where: { key: 'threads' }, data: { note: JSON.stringify({ maxAllowed: 1, currentThreads: 1 }) } })
      const busy = await place(u, 'ot', 6)
      check('剩余线程为 0 → 新单 429 BUSY', !busy.ok && busy.code === 'BUSY' && busy.status === 429)
      adv(95)
      await engine.advanceOrder(so.id)
      so = await soOf(r.orderId)
      check('被线程受限挡住满 90 秒 → CANCELLED（HOLD）', so.state === 'CANCELLED' && so.refundReason === 'HOLD')
      await prisma.smsHold.deleteMany({ where: { key: 'threads' } })
      mock.clearFaults()
      adv(21 * 60)
      await tick(2)
    }

    // =====================================================================================
    section('第 79 条 取号意图唯一：onPaid、tick、买家 GET 三方同时推进 → 只插一个尝试、只调一次 getNumberV2')
    {
      const u = await mkUser('intent')
      const crashRes = order.setJiemaCrashAfterTxForTest
      const r = await placeOk(u, 'ot', 6)
      // 用对账路径付款但不当场取号：直接把 SmsOrder 推到 ACQUIRING（等价于 fulfill 事务提交、onPaid 还没跑）
      const v = (await vmqOf(r.orderId))!
      await prisma.vmqOrder.update({ where: { id: v.id }, data: { state: 1, payDate: new Date() } })
      await prisma.vmqLock.deleteMany({ where: { orderId: v.orderId } })
      const origOnPaid = engine.onPaid
      void origOnPaid
      void crashRes
      const n0 = mockCalls('getNumberV2')
      await prisma.order.update({ where: { id: r.orderId }, data: { payStatus: 'PAID', payMethod: 'ALIPAY', paidAt: new Date(), deliveryStatus: 'PROCESSING' } })
      await prisma.payment.create({ data: { orderId: r.orderId, payMethod: 'ALIPAY', amount: D(170), status: 1, tradeNo: v.orderId } })
      await prisma.smsOrder.update({ where: { orderId: r.orderId }, data: { state: 'ACQUIRING', alipayPaidCents: centsOf(v.reallyPrice), paidAt: new Date() } })
      const so = await soOf(r.orderId)
      await Promise.all([engine.onPaid(r.orderId), engine.advanceOrder(so.id), engine.lazyAdvance(so.id), engine.advanceOrder(so.id)])
      const atts = await attsOf(so.id)
      check('只插入一个尝试、只调一次 getNumberV2', atts.length === 1 && mockCalls('getNumberV2') - n0 === 1)
      adv(21 * 60)
      await tick(2)
    }

    // =====================================================================================
    section('第 24 / 27 条 取号超时 → UNKNOWN（绝不重取）→ 扫描器认领（校准样本、时间窗、候选恰好 1 个）；落库失败 → 60 秒后 UNKNOWN → 认领')
    {
      const u = await mkUser('unk')
      // 先有校准样本：一张正常取到号的单，扫描器补写 upstreamCreatedAt
      const s = await placeOk(u, 'dr', 16)
      await pay(s.orderId)
      await claim.scanUnknown({ fillCalibration: true })
      const sample = (await curOf(s.orderId))!
      check('校准样本：扫描器给正常取到的号补写 upstreamCreatedAt', !!sample.upstreamCreatedAt)
      mock.setFaults([{ action: 'getNumberV2', kind: 'hang', delayMs: 16_500, bought: true }])
      const r = await placeOk(u, 'ot', 6)
      const n0 = mockCalls('getNumberV2')
      await pay(r.orderId) // 取号 15 秒超时
      await settle(r.orderId)
      let so = await soOf(r.orderId)
      let atts = await attsOf(so.id)
      check('取号超时 → 尝试 UNKNOWN、订单仍 ACQUIRING', atts.length === 1 && atts[0].state === 'UNKNOWN' && so.state === 'ACQUIRING')
      await engine.advanceOrder(so.id)
      await tick()
      atts = await attsOf(so.id)
      so = await soOf(r.orderId)
      check('UNKNOWN 期间绝不重取（getNumberV2 只调了 1 次）', mockCalls('getNumberV2') - n0 === 1)
      check('扫描器认领：ACTIVE、订单 WAITING、endsAt = 上游 expiredAt、canCancelAt = 认领 + 123 秒', atts[0].state === 'ACTIVE' && !!atts[0].activationId && so.state === 'WAITING' && !!atts[0].endsAt && atts[0].respondedAt == null)
      const ev = await prisma.smsEvent.count({ where: { smsOrderId: so.id, type: 'ADOPT' } })
      check('事件 ADOPT', ev === 1)
      mock.clearFaults()
      // 第 27 条：取号成功、落库失败
      engine.setWriteActiveFaultForTest(() => {
        throw new Error('injected')
      })
      const r2 = await placeOk(u, 'ot', 6)
      await pay(r2.orderId)
      engine.setWriteActiveFaultForTest(null)
      let so2 = await soOf(r2.orderId)
      let at2 = await attsOf(so2.id)
      check('落库失败：尝试停在 REQUESTING（号码其实买到了）', at2[0].state === 'REQUESTING')
      adv(61)
      await claim.scanUnknown({})
      at2 = await attsOf(so2.id)
      so2 = await soOf(r2.orderId)
      check('60 秒后 → UNKNOWN → 被认领 → WAITING', at2[0].state === 'ACTIVE' && so2.state === 'WAITING')
      adv(21 * 60)
      await tick(2)
    }

    // =====================================================================================
    section('第 25 条 超时且其实没买到 → 两轮有效扫描都没有候选、距请求超过 180 秒 → NOT_BOUGHT → 继续取号；失败的一轮不计')
    {
      const u = await mkUser('nb')
      mock.setFaults([{ action: 'getNumberV2', kind: 'hang', delayMs: 16_500, bought: false }])
      const r = await placeOk(u, 'ot', 6)
      await pay(r.orderId)
      await settle(r.orderId)
      let so = await soOf(r.orderId)
      let atts = await attsOf(so.id)
      check('UNKNOWN', atts[0].state === 'UNKNOWN')
      adv(100)
      await claim.scanUnknown({})
      mock.setFaults([{ action: 'v1:activations', kind: 'http500' }], true)
      await claim.scanUnknown({})
      atts = await attsOf(so.id)
      check('第 1 轮有效扫描计 1；拉列表失败的一轮不计', atts[0].emptyScans === 1 && atts[0].state === 'UNKNOWN')
      mock.clearFaults()
      adv(90)
      await claim.scanUnknown({})
      atts = await attsOf(so.id)
      check('第 2 轮有效扫描、距请求 > 180 秒 → FAILED（NOT_BOUGHT）', atts[0].state === 'FAILED' && atts[0].errorCode === 'NOT_BOUGHT')
      await engine.advanceOrder(so.id)
      so = await soOf(r.orderId)
      check('首次取号按重试规则继续 → 取到号', so.state === 'WAITING')
      adv(21 * 60)
      await tick(2)
    }

    // =====================================================================================
    section('第 26 / 28 条 两个候选 → MANUAL（不自动取消、不认领）；未关联激活永远不自动取消')
    {
      const u = await mkUser('amb')
      mock.setFaults([{ action: 'getNumberV2', kind: 'hang', delayMs: 16_500, bought: true }])
      const r = await placeOk(u, 'wa', 6)
      const payP = pay(r.orderId)
      await sleep(300)
      const ext = mock.buy({ service: 'wa', country: 6 }) // 窗口里另一个同组合的激活（站长手动买的）
      await payP
      await settle(r.orderId)
      mock.clearFaults()
      bodies.length = 0
      await claim.scanUnknown({})
      const so = await soOf(r.orderId)
      const atts = await attsOf(so.id)
      check('候选 2 个 → 订单 MANUAL、尝试仍 UNKNOWN（不认领）', so.state === 'MANUAL' && atts[0].state === 'UNKNOWN' && !!so.manualAt && !!so.alertedAt)
      check('两个激活在上游都没被取消', mock.activations.filter((a) => a.service === 'wa' && a.country === 6).every((a) => a.status === 'ACTIVE'))
      check('推送 MANUAL', (await pushes('MANUAL')) >= 1)
      void ext
      // 未关联：纯外部激活
      const e2 = mock.buy({ service: 'go', country: 4 })[0]
      await tick()
      await claim.scanUnknown({})
      check('外部激活不会被取消', mock.get(e2.id)?.status === 'ACTIVE')
      // 把这张 MANUAL 单交给管理员：取消并退回余额不适用（没有号）→ 用 E20 的收尾：直接让上游结束，保留 MANUAL 的记录
      await prisma.smsAttempt.updateMany({ where: { smsOrderId: so.id, state: 'UNKNOWN' }, data: { state: 'FAILED', errorCode: 'ITEST' } })
      await engine.adminCancelRefund(so.id, userIds[0])
      check('管理员「取消并退回余额」→ CANCELLED', (await soOf(r.orderId)).state === 'CANCELLED')
    }

    // =====================================================================================
    section('第 29 条 重复到账推送 → 只取一次号、预扣只确认一次')
    {
      const u = await mkUser('dup')
      await fund(u.id, 100, 0)
      const r = await placeOk(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 100 })
      const v = (await vmqOf(r.orderId))!
      const raw = `你已成功收款${Number(v.reallyPrice).toFixed(2)}元（itest-dup-${uuid()}）`
      const n0 = mockCalls('getNumberV2')
      await Promise.all([vmq.markPaidByAmount(Number(v.reallyPrice).toFixed(2), 2, raw), vmq.markPaidByAmount(Number(v.reallyPrice).toFixed(2), 2, raw)])
      const won = await vmq.fulfillOrder(r.orderId, { via: 'VMQ', vmqId: v.id })
      const so = await soOf(r.orderId)
      check('只取一次号、预扣 CAPTURED、Payment 两行（不重复）、再调 fulfillOrder 返回 false', mockCalls('getNumberV2') - n0 === 1 && (await attsOf(so.id)).length === 1 && (await prisma.payment.count({ where: { orderId: r.orderId } })) === 2 && !won)
      adv(21 * 60)
      await tick(2)
    }

    // =====================================================================================
    section('第 30 / 31 / 32 条 换号瞬间来码（E14 ①②③）')
    {
      const u = await mkUser('e14')
      // ① 换号前先查旧号，已经有码 → 放弃换号 → RECEIVED
      const r1 = await placeOk(u, 'dr', 16)
      await pay(r1.orderId)
      adv(125)
      const c1 = (await curOf(r1.orderId))!
      mock.pushSms(c1.activationId!)
      let so = await soOf(r1.orderId)
      await engine.buyerReplace(so, so.version)
      so = await soOf(r1.orderId)
      check('① 换号前单查旧号已有码 → RECEIVED，没有新取号', so.state === 'RECEIVED' && (await attsOf(so.id)).length === 1)
      // ② 取新号期间旧号来码 → 新号 RELEASING，120 秒后放掉
      const r2 = await placeOk(u, 'dr', 16)
      await pay(r2.orderId)
      adv(125)
      const c2 = (await curOf(r2.orderId))!
      mock.setFaults([{ action: 'getNumberV2', kind: 'hang', delayMs: 3_000, bought: true }])
      so = await soOf(r2.orderId)
      const repP = engine.buyerReplace(so, so.version)
      await sleep(800)
      mock.pushSms(c2.activationId!)
      await engine.pollActive()
      await repP
      mock.clearFaults()
      so = await soOf(r2.orderId)
      let atts = await attsOf(so.id)
      const newer = atts.find((a) => a.seq === 2)
      check('② 旧号收码 → 订单 RECEIVED；新号取到后 CAS 落空 → RELEASING', so.state === 'RECEIVED' && so.currentAttemptId === c2.id && newer?.state === 'RELEASING')
      adv(125)
      await tick()
      atts = await attsOf(so.id)
      check('  …120 秒后新号被放掉（CANCELLED）', atts.find((a) => a.seq === 2)?.state === 'CANCELLED')
      // ③ 已切到新号、放旧号时返回 NEW_OTP_RECEIVED → 旧号 RECEIVED（charged）、短信来自 info.data、新号 RELEASING；定稿包含两个号
      const r3 = await placeOk(u, 'dr', 16)
      await pay(r3.orderId)
      adv(125)
      const c3 = (await curOf(r3.orderId))!
      mock.setFaults([{ action: 'setStatus', kind: 'otp_on_release', status: 8 }])
      so = await soOf(r3.orderId)
      await engine.buyerReplace(so, so.version)
      mock.clearFaults()
      so = await soOf(r3.orderId)
      atts = await attsOf(so.id)
      const oldA = atts.find((a) => a.id === c3.id)!
      const newA = atts.find((a) => a.id !== c3.id)!
      const v3 = await view.buildOrderView((await view.findBuyerOrder(u.id, r3.orderNo))!)
      check('③ 放旧号 NEW_OTP_RECEIVED → 旧号 RECEIVED（charged）、订单 RECEIVED、新号 RELEASING', oldA.state === 'RECEIVED' && oldA.charged && so.state === 'RECEIVED' && newA.state === 'RELEASING')
      check('  …短信标「发往之前的号码」（toOldNumber）', v3.messages.length === 1 && v3.messages[0].toOldNumber === true)
      // 新号放掉时也收到了码（买家可能已经在平台上填了它）→ 同样 charged、成本重算
      mock.pushSms(newA.activationId!)
      await tick()
      so = await soOf(r3.orderId)
      check('  …新号也收码 → 两个号都 charged，成本 = 两个号之和（E14 ③ 不漏算）', so.chargedMicro === 90_000 && so.costCents === 65)
      await engine.buyerFinish(so, so.version)
      so = await soOf(r3.orderId)
      check('  …我已用完 → FINISHED、全部终态 → 定稿', so.state === 'FINISHED' && so.costFinal)
    }

    // =====================================================================================
    section('第 34 / 110 条 上游先结束：history 10 且无码 → T21（UPSTREAM_ENDED）；history 6 + moreCodes → T22 不调 finish')
    {
      const u = await mkUser('up-end')
      const r = await placeOk(u, 'dr', 16)
      await pay(r.orderId)
      const c = (await curOf(r.orderId))!
      mock.endActivation(c.activationId!, 10)
      await tick()
      let so = await soOf(r.orderId)
      check('不在活跃列表 → history 状态 10 且无码 → 尝试 CANCELLED → T21 → CANCELLED（UPSTREAM_ENDED）', so.state === 'CANCELLED' && so.refundReason === 'UPSTREAM_ENDED')
      const v = await view.buildOrderView((await view.findBuyerOrder(u.id, r.orderNo))!)
      check('  …号码页原因「号码已失效，未收到短信，已退回余额」', v.refund?.reason === '号码已失效，未收到短信，已退回余额')
      const r2 = await placeOk(u, 'dr', 16)
      await pay(r2.orderId)
      const c2 = (await curOf(r2.orderId))!
      mock.pushSms(c2.activationId!)
      await tick()
      mock.endActivation(c2.activationId!, 6)
      const n6 = mock.log.filter((e) => e.action === 'setStatus' && e.path.includes(`id=${c2.activationId}`) && e.path.includes('status=6')).length
      await tick()
      so = await soOf(r2.orderId)
      check('收码的号被上游完成（history 6）→ T22 FINISHED、没有调 setStatus 6、成本定稿', so.state === 'FINISHED' && so.costFinal && mock.log.filter((e) => e.action === 'setStatus' && e.path.includes(`id=${c2.activationId}`) && e.path.includes('status=6')).length === n6)
      // 第 34 条 到期取消返回 ACTIVATION_NOT_ACTIVE → history 定终态
      const r3 = await placeOk(u, 'dr', 16)
      await pay(r3.orderId)
      const c3 = (await curOf(r3.orderId))!
      mock.setFaults([{ action: 'setStatus', kind: 'not_active', status: 8 }])
      mock.endActivation(c3.activationId!, 8)
      adv(20 * 60)
      await tick(2)
      mock.clearFaults()
      so = await soOf(r3.orderId)
      check('到期取消返回 ACTIVATION_NOT_ACTIVE → 按 history（8）收尾 → CANCELLED', so.state === 'CANCELLED')
    }

    // =====================================================================================
    section('第 82 / 83 / 84 条 FREE_CANCELLATION_EXPIRED、finish NEW_OTP_RECEIVED、币种 978')
    {
      const u = await mkUser('e55')
      bodies.length = 0
      const r = await placeOk(u, 'dr', 16)
      await pay(r.orderId)
      mock.setFaults([{ action: 'setStatus', kind: 'free_cancel_expired', status: 8 }])
      adv(20 * 60 - 40)
      await tick(2)
      mock.clearFaults()
      const so = await soOf(r.orderId)
      const att = (await attsOf(so.id))[0]
      check('FREE_CANCELLATION_EXPIRED → 尝试 CANCELLED + charged（EXPIRED）、订单照样已取消整单退回、lossCents = ⌈45,000 × 7.2 ÷ 100⌉ = 33、成本利润为空', so.state === 'CANCELLED' && att.charged && att.chargeSource === 'EXPIRED' && so.lossCents === 33 && so.costCents == null && so.profitCents == null)
      check('  …推送 EXPIRED_CHARGE', (await pushes('EXPIRED_CHARGE')) >= 1)
      // 第 83 条
      const r2 = await placeOk(u, 'dr', 16)
      await pay(r2.orderId)
      const c2 = (await curOf(r2.orderId))!
      mock.pushSms(c2.activationId!)
      await tick()
      mock.setFaults([{ action: 'setStatus', kind: 'otp_on_release', status: 6 }])
      let s2 = await soOf(r2.orderId)
      await engine.buyerFinish(s2, s2.version)
      s2 = await soOf(r2.orderId)
      check('finish 返回 NEW_OTP_RECEIVED → 新短信入库、仍 RECEIVED', s2.state === 'RECEIVED' && (await prisma.smsMessage.count({ where: { smsOrderId: s2.id } })) === 2)
      mock.clearFaults()
      await engine.buyerFinish(s2, s2.version)
      s2 = await soOf(r2.orderId)
      check('  …下一次再 finish → FINISHED', s2.state === 'FINISHED')
      // 第 84 条
      bodies.length = 0
      mock.setFaults([{ action: 'getNumberV2', kind: 'currency' }])
      const r3 = await placeOk(u, 'dr', 16)
      await pay(r3.orderId)
      mock.clearFaults()
      const s3 = await soOf(r3.orderId)
      const a3 = (await attsOf(s3.id))[0]
      const g = await prisma.smsHold.findUnique({ where: { key: 'global' } })
      check('取号返回 currency 978 → 号码照常服务（ACTIVE、标 CURRENCY）、全局停售（需手动解除）、紧急推送', a3.state === 'ACTIVE' && a3.errorCode === 'CURRENCY' && !!g && g.reason === 'CURRENCY' && g.until == null && (await pushes('CURRENCY')) >= 1)
      // 这个号在上游结束之前，每轮查码看到 978 都会重新确认全局停售；站长核实后先让号结束再解除
      mock.endActivation(a3.activationId!, 8)
      adv(21 * 60)
      await tick(2)
      await prisma.smsHold.deleteMany({ where: { key: 'global' } })
    }

    // =====================================================================================
    section('第 35 条 上游宕机：熔断打开 → 新单维护、ACQUIRING 90 秒内退回；恢复 3 分钟后关闭；endsAt + 60 分钟推定取消（assumed）')
    {
      const u = await mkUser('brk')
      const r0 = await placeOk(u, 'dr', 16)
      await pay(r0.orderId)
      up.resetUpstreamStateForTest() // 熔断按最近 2 分钟（真实时间）的调用计数；前面的用例刚打过几百次正常调用
      mock.setFaults([{ action: '*', kind: 'http500', times: 0 }])
      for (let i = 0; i < 6; i++) await up.getActiveActivations().catch(() => null)
      await holds.evaluateBreaker()
      const g = await prisma.smsHold.findUnique({ where: { key: 'global' } })
      check('≥5 次 5xx 且占比 ≥50% → 熔断打开（global / BREAKER）', !!g && g.reason === 'BREAKER')
      const rn = await place(u, 'ot', 6)
      check('新单 → 503 MAINTENANCE', !rn.ok && rn.code === 'MAINTENANCE')
      mock.clearFaults()
      await holds.evaluateBreaker()
      adv(181)
      await holds.evaluateBreaker()
      check('探活连续成功 3 分钟 → 熔断关闭（只删 BREAKER 那一行）', !(await prisma.smsHold.findUnique({ where: { key: 'global' } })))
      // assumed：上游一直联系不上，过了 endsAt 60 分钟
      mock.setFaults([{ action: '*', kind: 'http500', times: 0 }])
      adv(20 * 60 + 61 * 60)
      await tick()
      mock.clearFaults()
      const so = await soOf(r0.orderId)
      const a = (await attsOf(so.id))[0]
      check('过了 endsAt 60 分钟仍确认不了 → 尝试 CANCELLED（assumed）→ 订单已取消、整单退回', a.state === 'CANCELLED' && a.assumed && so.state === 'CANCELLED')
      runtime.rt().breaker.open = false
      await prisma.smsHold.deleteMany({ where: { key: 'global', reason: 'BREAKER' } })
    }

    // =====================================================================================
    section('第 37 / 38 条 并发下单超限只成一单（用户行锁）；同一 clientToken 两次 → 同一张单、只预扣一次')
    {
      await setCfg({ limits: { activePerUser: 3, perHour: 100, perDay: 500, maxActiveNumbers: 400 } })
      const u = await mkUser('lim')
      await fund(u.id, 5000, 0)
      await placeOk(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 170 })
      await placeOk(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 170 })
      const rs = await Promise.all([1, 2, 3].map(() => place(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 170 })))
      check('已有 2 张进行中、并发 3 个请求 → 只成功 1 个，其余 429 LIMIT', rs.filter((x) => x.ok).length === 1 && rs.filter((x) => !x.ok && x.code === 'LIMIT').length === 2, JSON.stringify(rs.map((x) => (x.ok ? 'ok' : x.code))))
      await setCfg()
      const u2 = await mkUser('ct')
      await fund(u2.id, 1000, 0)
      const token = uuid()
      const [x1, x2] = await Promise.all([place(u2, 'ot', 6, { payWith: 'BALANCE', expectBalance: 170, token }), place(u2, 'ot', 6, { payWith: 'BALANCE', expectBalance: 170, token })])
      check('同一 clientToken 两次 → 同一张单', x1.ok && x2.ok && x1.data.orderId === x2.data.orderId)
      check('  …只预扣一次（余额 1000 − 170）', (await buckets(u2.id)).topup === 830 && (await prisma.balanceLog.count({ where: { userId: u2.id, type: 'HOLD' } })) === 1)
      adv(21 * 60)
      await tick(2)
    }

    // =====================================================================================
    section('第 39 条 退款并发（tick 与买家 GET 同时推进）→ 只有一条 REFUND、两格只加一次')
    {
      const u = await mkUser('rfc')
      await fund(u.id, 200, 0)
      const r = await placeOk(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 170 })
      const so = await soOf(r.orderId)
      adv(125)
      await engine.buyerCancel(so, so.version).catch(() => null)
      // 把它拨回 REFUNDING（模拟退款事务之前崩溃），再并发推进
      await prisma.smsOrder.update({ where: { id: so.id }, data: { state: 'REFUNDING', refundState: 'NONE' } })
      const fresh = await soOf(r.orderId)
      if (fresh.state === 'REFUNDING' && (await prisma.balanceLog.count({ where: { orderId: r.orderId, type: 'REFUND' } })) === 1) {
        check('（取消已退过一次：用新单重做并发退款）', true)
      }
      const u2 = await mkUser('rfc2')
      await fund(u2.id, 200, 0)
      const r2 = await placeOk(u2, 'ot', 6, { payWith: 'BALANCE', expectBalance: 170 })
      const s2 = await soOf(r2.orderId)
      const c2 = (await curOf(r2.orderId))!
      mock.endActivation(c2.activationId!, 8)
      await prisma.smsAttempt.update({ where: { id: c2.id }, data: { state: 'CANCELLED', closedAt: new Date() } })
      await prisma.smsOrder.update({ where: { id: s2.id }, data: { state: 'REFUNDING', refundReason: 'EXPIRED' } })
      await Promise.all([refund.refundCancelled(s2.id), refund.refundCancelled(s2.id), engine.advanceOrder(s2.id), engine.lazyAdvance(s2.id)])
      check('只有一条 REFUND、充值格只加一次（回到 200）', (await prisma.balanceLog.count({ where: { orderId: r2.orderId, type: 'REFUND' } })) === 1 && (await buckets(u2.id)).topup === 200 && (await soOf(r2.orderId)).state === 'CANCELLED')
      await prisma.smsOrder.update({ where: { id: so.id }, data: { state: 'CANCELLED', refundState: 'DONE' } })
    }

    // =====================================================================================
    section('第 40 条 下单后改售价系数和成本汇率 → 这张单按快照付款、取号、核算')
    {
      const u = await mkUser('snap')
      const r = await placeOk(u, 'dr', 52)
      await setCfg({ saleCoef4: 100000, costFx4: 80000 })
      await pay(r.orderId)
      const c = (await curOf(r.orderId))!
      mock.pushSms(c.activationId!)
      await tick()
      const so = await soOf(r.orderId)
      check('付款按快照价（246）、成本按快照汇率 7.20（87 分，不是 96）', so.priceCents === 246 && so.costFx4 === 72000 && so.costCents === 87)
      await setCfg()
      await engine.buyerFinish(so, so.version)
    }

    // =====================================================================================
    section('第 41 / 102 / 123 条 发起支付前复核：报价过期 → 关单释放；停售 / 线程 → 409 HOLD；已有有效收款单的原样复用；E26 纯支付宝与组合的文案')
    {
      const u = await mkUser('pay-gate')
      await fund(u.id, 100, 0)
      // 模拟「下单请求在发起收款前崩溃」：只有订单与预扣，没有收款单
      order.setJiemaCrashAfterTxForTest(true)
      const r = await placeOk(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 100 })
      order.setJiemaCrashAfterTxForTest(false)
      check('崩溃模拟：MIXED、预扣 HELD、没有收款单', (await prisma.vmqOrder.count({ where: { bizType: 'order', bizId: r.orderId } })) === 0 && (await prisma.balanceHold.findUniqueOrThrow({ where: { orderId: r.orderId } })).state === 'HELD')
      await prisma.smsOrder.update({ where: { orderId: r.orderId }, data: { quoteExpiresAt: new Date(runtime.jnow().getTime() - 1000) } })
      const res = await callRoute(routePay.POST, { host: MAIN, token: u.token, method: 'POST', path: '/api/pay/vmq/create', body: { orderNo: r.orderNo } })
      const so = await soOf(r.orderId)
      check('锁价过期后发起支付 → 409 QUOTE_EXPIRED「…预扣的余额已退回」、订单 CLOSED、预扣 RELEASED、一条 RELEASE', res.status === 409 && res.json?.code === 'QUOTE_EXPIRED' && String(res.json?.error).includes('预扣的余额已退回') && so.state === 'CLOSED' && (await prisma.balanceHold.findUniqueOrThrow({ where: { orderId: r.orderId } })).state === 'RELEASED' && (await prisma.balanceLog.count({ where: { orderId: r.orderId, type: 'RELEASE' } })) === 1)
      check('  …余额回到 100', (await buckets(u.id)).topup === 100)
      // 第 102 条：线程已满 → 409 HOLD、关单
      order.setJiemaCrashAfterTxForTest(true)
      const r2 = await placeOk(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 100 })
      order.setJiemaCrashAfterTxForTest(false)
      await prisma.smsHold.create({ data: { key: 'threads', until: new Date(runtime.jnow().getTime() + 3600_000), reason: 'CHANNELS_LIMIT', source: 'UPSTREAM', note: JSON.stringify({ maxAllowed: 1, currentThreads: 1 }) } })
      const res2 = await callRoute(routePay.POST, { host: MAIN, token: u.token, method: 'POST', path: '/api/pay/vmq/create', body: { orderNo: r2.orderNo } })
      check('线程已满（剩余 0）→ 409 HOLD「该组合暂停销售，订单已关闭，预扣的余额已退回」、CLOSED、RELEASED', res2.status === 409 && res2.json?.code === 'HOLD' && String(res2.json?.error).includes('预扣的余额已退回') && (await soOf(r2.orderId)).state === 'CLOSED' && (await prisma.balanceHold.findUniqueOrThrow({ where: { orderId: r2.orderId } })).state === 'RELEASED')
      // 另一张已有有效收款单的单 → 原样复用、不拦
      await prisma.smsHold.delete({ where: { key: 'threads' } })
      const r3 = await placeOk(u, 'ot', 6)
      await prisma.smsHold.create({ data: { key: 'combo:ot:6', until: null, reason: 'ADMIN', source: 'ADMIN', note: 'itest' } })
      const res3 = await callRoute(routePay.POST, { host: MAIN, token: u.token, method: 'POST', path: '/api/pay/vmq/create', body: { orderNo: r3.orderNo } })
      check('已有有效收款单的单 → 原样复用（200、同一个 payUrl），不拦', res3.status === 200 && res3.json?.data?.payUrl === r3.payUrl)
      await prisma.smsHold.delete({ where: { key: 'combo:ot:6' } })
      // E26：纯支付宝单 → 余额不够 → 文案只有「该服务暂不可购买，订单已关闭」
      order.setJiemaCrashAfterTxForTest(true)
      const r4 = await placeOk(u, 'ot', 6)
      order.setJiemaCrashAfterTxForTest(false)
      const bal = mock.balanceMicro()
      mock.setBalanceUsd(0.001)
      runtime.resetBalanceForTest(null)
      const res4 = await callRoute(routePay.POST, { host: MAIN, token: u.token, method: 'POST', path: '/api/pay/vmq/create', body: { orderNo: r4.orderNo } })
      check('E26 纯支付宝单：409 UNAVAILABLE「该服务暂不可购买，订单已关闭」（没有「预扣」）', res4.status === 409 && res4.json?.code === 'UNAVAILABLE' && res4.json?.error === '该服务暂不可购买，订单已关闭' && (await soOf(r4.orderId)).state === 'CLOSED')
      mock.setBalanceUsd(bal / 1e6)
      runtime.resetBalanceForTest(null)
      // 余额够一部分的组合单：收银台不付 → 买家取消（收款单作废、预扣退回）
      const r5 = await placeOk(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 100 })
      const s5 = await soOf(r5.orderId)
      const c5 = await engine.buyerClose(s5, s5.version)
      check('组合单不付、买家取消 → CLOSED、预扣退回', c5.ok && (await soOf(r5.orderId)).state === 'CLOSED' && (await buckets(u.id)).topup === 100)
      adv(21 * 60)
      await tick(2)
    }

    // =====================================================================================
    section('第 123 条 E26 上游余额核对：余额 − 在途占用 == eff(cap) → 通过；差 1 微美元 → 503 UNAVAILABLE（不建单、推一次）；锁价过期但收银台有效的单照样占额度；缓存为空且刷新失败 → 不能卖')
    {
      const u = await mkUser('e26')
      // 清掉在途：前面的单都已到期收尾
      adv(21 * 60)
      await tick(3)
      const snap0 = await sellable.loadInflightSnapshot(runtime.jnow())
      const occ0 = (await import('../src/lib/jiema/gate')).inflightMicro(snap0, runtime.jnow(), null, runtime.jnow()).total
      const q = await priceOf('ot', 6) // cap 30,000
      mock.setBalanceUsd((occ0 + 30_000) / 1e6)
      runtime.resetBalanceForTest(null)
      alert.resetSmsAlertThrottleForTest()
      bodies.length = 0
      const okR = await place(u, 'ot', 6)
      check('余额 − 占用 == eff(cap) → 下单成功（没有安全垫）', okR.ok)
      // 这张单还能付款（锁价有效）→ 在 C 里占 30,000
      mock.setBalanceUsd((occ0 + 30_000 + 29_999) / 1e6)
      runtime.resetBalanceForTest(null)
      const n0 = await prisma.smsOrder.count({ where: { userId: u.id } })
      const bad1 = await place(u, 'ot', 6)
      check('已有一张可付款的单占 30,000，余额只差 1 微美元 → 503 UNAVAILABLE、不建单、不预扣', !bad1.ok && bad1.code === 'UNAVAILABLE' && bad1.status === 503 && (await prisma.smsOrder.count({ where: { userId: u.id } })) === n0)
      check('  …推一次 UPSTREAM_INSUFFICIENT，1 小时内再被拒不重复推', (await pushes('UPSTREAM_INSUFFICIENT')) === 1 && !(await place(u, 'ot', 6)).ok && (await pushes('UPSTREAM_INSUFFICIENT')) === 1)
      // 锁价过期、收银台仍有效（state=0 未过期）→ 照样占额度
      await prisma.smsOrder.update({ where: { orderId: okR.ok ? okR.data.orderId : 0 }, data: { quoteExpiresAt: new Date(runtime.jnow().getTime() - 60_000) } })
      runtime.resetBalanceForTest(null)
      check('锁价已过期、收银台仍有效的单照样占额度 → 仍 503', !(await place(u, 'ot', 6)).ok)
      // 收银台关了（收款单作废、订单关闭）→ 不再占 → 能下
      if (okR.ok) {
        const v = await vmqOf(okR.data.orderId)
        if (v) await vmq.discardVmqOrder(v.orderId)
        const so = await soOf(okR.data.orderId)
        await engine.closePending(so, { reason: 'ITEST', actor: 'SYSTEM', invalidate: true })
      }
      runtime.resetBalanceForTest(null)
      check('那张单关了之后 → 下单成功', (await place(u, 'ot', 6)).ok)
      // 进程重启：缓存为空、getBalance 失败 → 不能卖
      runtime.resetBalanceForTest(null)
      runtime.rt().low = { below: false, lastAt: null }
      bodies.length = 0
      mock.setFaults([{ action: 'getBalance', kind: 'http500', times: 0 }])
      const bad2 = await place(u, 'ot', 6)
      mock.clearFaults()
      check('进程重启后缓存为空、getBalance 失败 → 503 UNAVAILABLE（按不够处理）', !bad2.ok && bad2.code === 'UNAVAILABLE')
      check('  …没有推 UPSTREAM_LOW（余额未知不告警）', (await pushes('UPSTREAM_LOW')) === 0)
      mock.setBalanceUsd(12.44)
      runtime.resetBalanceForTest(null)
      void q
    }

    // =====================================================================================
    section('第 124 / 81 条 低余额只告警不停售；sms_config 写坏：新单停售、在途照常取号、告警线不失明')
    {
      bodies.length = 0
      runtime.rt().low = { below: false, lastAt: null }
      mock.setBalanceUsd(1.9)
      await upbalance.refreshBalance()
      check('余额 $1.90 → 推一次 UPSTREAM_LOW、没有 global 停售', (await pushes('UPSTREAM_LOW')) === 1 && !(await prisma.smsHold.findUnique({ where: { key: 'global' } })))
      await upbalance.refreshBalance()
      check('  …马上再刷新不重复推', (await pushes('UPSTREAM_LOW')) === 1)
      adv(6 * 3600)
      await upbalance.refreshBalance()
      check('  …6 小时后再推一次', (await pushes('UPSTREAM_LOW')) === 2)
      mock.setBalanceUsd(3)
      await upbalance.refreshBalance()
      mock.setBalanceUsd(1.5)
      await upbalance.refreshBalance()
      check('  …升到 $3 再降到 $1.50 → 立即推', (await pushes('UPSTREAM_LOW')) === 3)
      const u = await mkUser('cfgbad')
      mock.setBalanceUsd(12.44)
      runtime.resetBalanceForTest(null)
      const r = await placeOk(u, 'ot', 6)
      await setCfg('{"version":3,"enabled":true}')
      const rn = await place(u, 'ot', 6, { expectPrice: 170 })
      check('sms_config 写坏 → 新单 503 MAINTENANCE', !rn.ok && (rn as { code: string }).code === 'MAINTENANCE')
      await pay(r.orderId)
      const so = await soOf(r.orderId)
      check('已付款的单照常取号（runtimeParams 用最后有效值）', so.state === 'WAITING')
      bodies.length = 0
      runtime.rt().low = { below: false, lastAt: null }
      mock.setBalanceUsd(1.5)
      await upbalance.refreshBalance()
      check('配置坏着，余额 $1.50 → 照样推 UPSTREAM_LOW（告警线取最后有效值）', (await pushes('UPSTREAM_LOW')) === 1)
      mock.setBalanceUsd(12.44)
      await setCfg()
      adv(21 * 60)
      await tick(2)
    }

    // =====================================================================================
    section('第 122 条 三种手动停售都生效（下单 409 HOLD、不是 400）：服务 OFF、disabled 规则、sms_holds 的 ADMIN 停售')
    {
      const u = await mkUser('manual-hold')
      await prisma.smsService.update({ where: { code: 'wb' }, data: { status: 'OFF', offNote: 'itest' } })
      resetCaches()
      const a = await order.createJiemaOrder({ id: u.id, role: 'ADMIN' }, { service: 'wb', country: 3, operator: null, operatorFallback: true, expectPriceCents: 550, payWith: 'ALIPAY', clientToken: uuid(), agree: true, termsVersion: JIEMA_TERMS_VERSION, walletTermsVersion: WALLET_TERMS_VERSION })
      check('服务手动下架 → 409 HOLD', !a.ok && a.code === 'HOLD' && a.status === 409)
      await prisma.smsService.update({ where: { code: 'wb' }, data: { status: 'ON', offNote: null } })
      await prisma.smsPriceRule.create({ data: { scopeKey: 'wb:*', disabled: true, note: 'itest' } })
      resetCaches()
      const b = await order.createJiemaOrder({ id: u.id, role: 'ADMIN' }, { service: 'wb', country: 3, operator: null, operatorFallback: true, expectPriceCents: 550, payWith: 'ALIPAY', clientToken: uuid(), agree: true, termsVersion: JIEMA_TERMS_VERSION, walletTermsVersion: WALLET_TERMS_VERSION })
      check('覆盖规则 wb:* disabled → 409 HOLD', !b.ok && b.code === 'HOLD')
      await prisma.smsPriceRule.deleteMany({ where: { scopeKey: 'wb:*' } })
      await prisma.smsHold.create({ data: { key: 'country:3', until: null, reason: 'ADMIN', source: 'ADMIN', note: 'itest' } })
      resetCaches()
      const c = await place(u, 'wb', 3)
      check('sms_holds 的 ADMIN 停售 country:3 → 409 HOLD', !c.ok && c.code === 'HOLD')
      await prisma.smsHold.delete({ where: { key: 'country:3' } })
      resetCaches()
      const d = await place(u, 'wb', 3)
      check('三者都删掉后恢复', d.ok)
    }

    // =====================================================================================
    section('第 47 条 自动停售：本站组合 8 个号 0 收码 / 20 个号 2 个收码 → 停 6 小时；上游 stats 组合 70 个号 <8% → 停售并预警')
    {
      const u = await mkUser('auto')
      const r = await placeOk(u, 'ot', 6)
      const so = await soOf(r.orderId)
      const mkAtt = async (service: string, country: number, n: number, withCode: number) => {
        for (let i = 0; i < n; i++) {
          await prisma.smsAttempt.create({
            data: { smsOrderId: so.id, seq: 100 + (await prisma.smsAttempt.count({ where: { smsOrderId: so.id } })), reason: 'FIRST', state: i < withCode ? 'FINISHED' : 'CANCELLED', service, country, maxPriceMicro: 1, activationId: `itest-${uuid().slice(0, 20)}`, requestedAt: runtime.jnow(), smsCount: i < withCode ? 1 : 0 },
          })
        }
      }
      await mkAtt('ig', 6, 8, 0)
      await mkAtt('go', 4, 20, 2)
      await holds.checkLocalSuccess()
      const h1 = await prisma.smsHold.findUnique({ where: { key: 'combo:ig:6' } })
      const h2 = await prisma.smsHold.findUnique({ where: { key: 'combo:go:4' } })
      check('8 个号 0 收码 → combo:ig:6 停售 6 小时（LOW_SUCCESS）', !!h1 && h1.reason === 'LOW_SUCCESS' && Math.abs(h1.until!.getTime() - runtime.jnow().getTime() - 6 * 3600_000) < 5000)
      check('20 个号 2 个收码（10%）→ combo:go:4 停售', !!h2 && h2.reason === 'LOW_SUCCESS')
      await prisma.smsAttempt.deleteMany({ where: { smsOrderId: so.id, seq: { gte: 100 } } })
      await prisma.smsHold.deleteMany({ where: { key: { in: ['combo:ig:6', 'combo:go:4'] } } })
      bodies.length = 0
      const bought = mock.buy({ service: 'tg', country: 6, count: 70 })
      for (let i = 0; i < 5; i++) mock.pushSms(bought[i].id)
      const st = await holds.checkUpstreamStats()
      const h3 = await prisma.smsHold.findUnique({ where: { key: 'combo:tg:6' } })
      check('上游 stats：tg:6 有 70 个号、成功 5 个（7.1%）→ 停售并预警（UPSTREAM_STATS）', st.ok && !!h3 && h3.reason === 'UPSTREAM_STATS' && (await pushes('UPSTREAM_STATS')) >= 1)
      // 上游 stats 也把测试里大量「到期没码」的其他组合（ot:6 等）判成了低成功率：一起清掉，免得挡住后面的用例
      await prisma.smsHold.deleteMany({ where: { reason: { in: ['LOW_SUCCESS', 'UPSTREAM_STATS'] } } })
      for (const b of bought) mock.endActivation(b.id, 8)
    }

    // =====================================================================================
    section('第 48 / 112 条 两个标签页同时用余额下单（只够一单）→ 第二单 409 BALANCE_CHANGED（余额用完带 suggestPayWith）→ 改支付宝成功、没有预扣')
    {
      const u = await mkUser('tabs')
      await fund(u.id, 170, 0)
      const [a, b] = await Promise.all([place(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 170 }), place(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 170 })])
      const loser = [a, b].find((x) => !x.ok)
      check('只有一单成功，另一单 409 BALANCE_CHANGED 带 suggestPayWith=ALIPAY', [a, b].filter((x) => x.ok).length === 1 && !!loser && !loser.ok && loser.code === 'BALANCE_CHANGED' && loser.extra?.suggestPayWith === 'ALIPAY')
      const b2 = await buckets(u.id)
      check('两格都不为负（都是 0）', b2.topup === 0 && b2.cash === 0)
      const c = await place(u, 'ot', 6, { payWith: 'ALIPAY' })
      check('以 payWith=ALIPAY 重新提交 → 成功、没有预扣行', c.ok && !(await prisma.balanceHold.findUnique({ where: { orderId: c.ok ? c.data.orderId : 0 } })))
      const u2 = await mkUser('tabs2')
      await fund(u2.id, 300, 0)
      const d = await place(u2, 'ot', 6, { payWith: 'BALANCE', expectBalance: 300 })
      check('期望抵扣与实际拆分不同（余额 300、应付 170）→ 409 BALANCE_CHANGED 带新拆分（170 + 0）', !d.ok && d.code === 'BALANCE_CHANGED' && d.extra?.balanceCents === 170 && d.extra?.alipayCents === 0)
    }

    // =====================================================================================
    section('第 49 / 50 条 组合单不付：tick 在锁价 + 20 分钟关单释放；closeExpired 同一事务释放（注入失败 → 整个小事务回滚、收款单仍是 0）')
    {
      const u = await mkUser('unpaid')
      await fund(u.id, 100, 0)
      const r = await placeOk(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 100 })
      const v = (await vmqOf(r.orderId))!
      await prisma.vmqOrder.update({ where: { id: v.id }, data: { createdAt: new Date(Date.now() - 21 * 60_000) } })
      vmq.setCloseExpiredReleaseFaultForTest(() => {
        throw new Error('injected release failure')
      })
      await vmq.closeExpired()
      vmq.setCloseExpiredReleaseFaultForTest(null)
      const v1 = await prisma.vmqOrder.findUniqueOrThrow({ where: { id: v.id } })
      const o1 = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } })
      check('注入释放失败 → 整个小事务回滚：收款单仍是 0、订单未取消、预扣仍 HELD', v1.state === 0 && o1.deliveryStatus !== 'CANCELLED' && (await prisma.balanceHold.findUniqueOrThrow({ where: { orderId: r.orderId } })).state === 'HELD')
      await vmq.closeExpired()
      const v2 = await prisma.vmqOrder.findUniqueOrThrow({ where: { id: v.id } })
      check('下一分钟重试：收款单 −1、订单取消、预扣 RELEASED、一条 RELEASE、余额回到 100', v2.state === -1 && (await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } })).deliveryStatus === 'CANCELLED' && (await prisma.balanceHold.findUniqueOrThrow({ where: { orderId: r.orderId } })).state === 'RELEASED' && (await prisma.balanceLog.count({ where: { orderId: r.orderId, type: 'RELEASE' } })) === 1 && (await buckets(u.id)).topup === 100)
      await tick()
      check('随后 tick 把 SmsOrder 改成 CLOSED（不再释放第二次）', (await soOf(r.orderId)).state === 'CLOSED' && (await prisma.balanceLog.count({ where: { orderId: r.orderId, type: 'RELEASE' } })) === 1)
      // 第 49 条：收款单被作废（买家另一个页面取消了收银台之类），锁价 + 20 分钟之后 tick 兜底关单
      const r2 = await placeOk(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 100 })
      const v3 = (await vmqOf(r2.orderId))!
      await vmq.discardVmqOrder(v3.orderId)
      adv(10 * 60 + 21 * 60)
      await tick()
      check('有过收款单、锁价到期 + 20 分钟、没有 0/1 收款单 → tick 关单（T4 ②）、预扣 RELEASED、一条 RELEASE', (await soOf(r2.orderId)).state === 'CLOSED' && (await prisma.balanceHold.findUniqueOrThrow({ where: { orderId: r2.orderId } })).state === 'RELEASED' && (await buckets(u.id)).topup === 100)
    }

    // =====================================================================================
    section('第 51 / 52 条 到账与关单：关单赢 → 到账记待核实并自动退入、预扣只退一次；买家取消时已到账 → 409 PAID_PROCESSING')
    {
      const u = await mkUser('race')
      await fund(u.id, 100, 0)
      const r = await placeOk(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 100 })
      const v = (await vmqOf(r.orderId))!
      const so = await soOf(r.orderId)
      const c = await engine.buyerClose(so, so.version)
      check('买家取消（T18）→ CLOSED、预扣 RELEASED', c.ok && (await soOf(r.orderId)).state === 'CLOSED' && (await buckets(u.id)).topup === 100)
      await vmq.markPaidByAmount(Number(v.reallyPrice).toFixed(2), 2, `你已成功收款${Number(v.reallyPrice).toFixed(2)}元（itest-late-${uuid()}）`)
      const late = await prisma.balanceLog.findMany({ where: { orderId: r.orderId, type: 'LATEPAY' } })
      check('付完马上取消 → no_pending_match → 数据验证唯一 → 自动退入（LATEPAY 一条 = 实收）、订单保持 CLOSED、预扣没再扣', late.length === 1 && late[0].topupDeltaCents === centsOf(v.reallyPrice) && (await soOf(r.orderId)).state === 'CLOSED' && (await buckets(u.id)).topup === 100 + centsOf(v.reallyPrice))
      const vv = await view.buildOrderView((await view.findBuyerOrder(u.id, r.orderNo))!)
      check('  …号码页 lateCredits 一笔（kind=LATE）', vv.lateCredits.length === 1 && vv.lateCredits[0].kind === 'LATE')
      // 第 52 条
      const u52 = await mkUser('race52')
      await fund(u52.id, 100, 0)
      const r2 = await placeOk(u52, 'ot', 6, { payWith: 'BALANCE', expectBalance: 100 })
      const v2 = (await vmqOf(r2.orderId))!
      await prisma.vmqOrder.update({ where: { id: v2.id }, data: { state: 1, payDate: new Date(Date.now() - 4 * 60_000) } })
      const s2 = await soOf(r2.orderId)
      const c2 = await engine.buyerClose(s2, s2.version)
      check('买家取消时收款单已到账 → 409 PAID_PROCESSING、预扣不动（HELD）', !c2.ok && c2.code === 'PAID_PROCESSING' && (await prisma.balanceHold.findUniqueOrThrow({ where: { orderId: r2.orderId } })).state === 'HELD')
      await vmq.reconcilePaidVmq()
      check('  …随后对账补履约：PAID、预扣 CAPTURED', (await prisma.order.findUniqueOrThrow({ where: { id: r2.orderId } })).payStatus === 'PAID' && (await prisma.balanceHold.findUniqueOrThrow({ where: { orderId: r2.orderId } })).state === 'CAPTURED')
      adv(21 * 60)
      await tick(2)
    }

    // =====================================================================================
    section('第 53 / 78 / 105 条 余额付清崩溃 → 30 秒后 T19 补推进（只翻一次）；T19 与管理员关单并发只一方成功；T19 连续失败 5 次 → MANUAL')
    {
      const u = await mkUser('t19')
      await fund(u.id, 1000, 0)
      order.setJiemaCrashAfterTxForTest(true)
      const r = await placeOk(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 170 })
      order.setJiemaCrashAfterTxForTest(false)
      let so = await soOf(r.orderId)
      check('崩溃模拟：PENDING_PAY + 预扣 HELD 覆盖全额', so.state === 'PENDING_PAY' && so.payMode === 'BALANCE')
      await engine.advanceOrder(so.id)
      check('建单不到 30 秒 → 不补推进', (await soOf(r.orderId)).state === 'PENDING_PAY')
      adv(31)
      await Promise.all([engine.advanceOrder(so.id), engine.advanceOrder(so.id)])
      so = await soOf(r.orderId)
      check('30 秒后 T19 → PAID、只有一行 BALANCE Payment、取到号', so.state === 'WAITING' && (await prisma.payment.count({ where: { orderId: r.orderId } })) === 1)
      // 第 78 条
      order.setJiemaCrashAfterTxForTest(true)
      const r2 = await placeOk(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 170 })
      order.setJiemaCrashAfterTxForTest(false)
      adv(31)
      const s2 = await soOf(r2.orderId)
      await prisma.smsOrder.update({ where: { id: s2.id }, data: { state: 'MANUAL' } })
      const [x] = await Promise.all([engine.adminCloseAndRelease(s2.id, u.id), vmq.fulfillOrder(r2.orderId, { via: 'BALANCE' }).catch(() => false)])
      const o2 = await prisma.order.findUniqueOrThrow({ where: { id: r2.orderId } })
      const h2 = await prisma.balanceHold.findUniqueOrThrow({ where: { orderId: r2.orderId } })
      const oneWinner = (o2.payStatus === 'PAID' && h2.state === 'CAPTURED') !== (x === 'CLOSED' && o2.deliveryStatus === 'CANCELLED' && h2.state === 'RELEASED')
      check('T19 与「关单并退回预扣」并发 → 只有一方成功（不会关了又付、余额只退一次）', oneWinner && (await prisma.balanceLog.count({ where: { orderId: r2.orderId, type: 'RELEASE' } })) <= 1)
      // 第 105 条：T19 连续失败
      order.setJiemaCrashAfterTxForTest(true)
      const r3 = await placeOk(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 170 })
      order.setJiemaCrashAfterTxForTest(false)
      await prisma.$executeRawUnsafe(`UPDATE balance_holds SET state = 'CAPTURED' WHERE order_id = ${r3.orderId}`)
      adv(31)
      bodies.length = 0
      const s3 = await soOf(r3.orderId)
      for (let i = 0; i < 5; i++) await engine.advanceOrder(s3.id)
      const f3 = await soOf(r3.orderId)
      check('T19 连续失败 5 次 → MANUAL，manualAt / alertedAt 写入、推送', f3.state === 'MANUAL' && !!f3.manualAt && !!f3.alertedAt && f3.failCount === 0 && (await pushes('MANUAL')) >= 1)
      await prisma.smsOrder.update({ where: { id: s3.id }, data: { notice: 'itest touch' } })
      adv(24 * 3600 + 5)
      bodies.length = 0
      await engine.advanceOrder(s3.id)
      const g3 = await soOf(r3.orderId)
      check('MANUAL 超过 24 小时 → 再推一次并更新 alertedAt（别的字段被写不影响计时）', (await pushes('MANUAL_AGAIN')) === 1 && g3.alertedAt!.getTime() > f3.alertedAt!.getTime())
      await prisma.$executeRawUnsafe(`UPDATE balance_holds SET state = 'HELD' WHERE order_id = ${r3.orderId}`)
      await engine.adminCloseAndRelease(s3.id, u.id)
      adv(21 * 60)
      await tick(2)
    }

    // =====================================================================================
    section('第 60 / 109 条 退款时预扣不是 CAPTURED → 不退、转 MANUAL；冻结成 MANUAL 后到账 → 付款事实照样写、管理员取消并退回 = 余额部分 + 支付宝实收；实收对不上 → MANUAL、不退')
    {
      const u = await mkUser('manual')
      await fund(u.id, 100, 0)
      const r = await placeOk(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 100 })
      const so = await soOf(r.orderId)
      await prisma.smsOrder.update({ where: { id: so.id }, data: { state: 'MANUAL' } })
      const paid = await pay(r.orderId)
      let s = await soOf(r.orderId)
      check('MANUAL 期间到账：alipayPaidCents / paidAt 照样写、预扣 CAPTURED、订单仍 MANUAL', s.state === 'MANUAL' && s.alipayPaidCents === centsOf(paid.reallyPrice) && !!s.paidAt && (await prisma.balanceHold.findUniqueOrThrow({ where: { orderId: r.orderId } })).state === 'CAPTURED')
      await engine.adminCancelRefund(s.id, u.id)
      s = await soOf(r.orderId)
      check('管理员「取消并退回余额」→ 退款 = 余额部分 100 + 支付宝实收', s.state === 'CANCELLED' && s.refundTopupCents === 100 + centsOf(paid.reallyPrice))
      // 实收对不上
      const ub = await mkUser('manual-b')
      await fund(ub.id, 100, 0)
      const r2 = await placeOk(ub, 'ot', 6, { payWith: 'BALANCE', expectBalance: 100 })
      await pay(r2.orderId)
      const s2 = await soOf(r2.orderId)
      await prisma.smsAttempt.updateMany({ where: { smsOrderId: s2.id }, data: { state: 'CANCELLED', closedAt: new Date() } })
      await prisma.smsOrder.update({ where: { id: s2.id }, data: { state: 'REFUNDING', alipayPaidCents: 1 } })
      await refund.refundCancelled(s2.id)
      check('alipayPaidCents 被改成错值 → 核对不上 → MANUAL、不退', (await soOf(r2.orderId)).state === 'MANUAL' && (await prisma.balanceLog.count({ where: { orderId: r2.orderId, type: 'REFUND' } })) === 0)
      // 第 60 条：预扣不是 CAPTURED
      const uc = await mkUser('manual-c')
      await fund(uc.id, 170, 0)
      const r3 = await placeOk(uc, 'ot', 6, { payWith: 'BALANCE', expectBalance: 170 }).catch(() => null)
      if (r3) {
        const s3 = await soOf(r3.orderId)
        await prisma.smsAttempt.updateMany({ where: { smsOrderId: s3.id }, data: { state: 'CANCELLED', closedAt: new Date() } })
        await prisma.$executeRawUnsafe(`UPDATE balance_holds SET state = 'RELEASED' WHERE order_id = ${r3.orderId}`)
        await prisma.smsOrder.update({ where: { id: s3.id }, data: { state: 'REFUNDING' } })
        bodies.length = 0
        await refund.refundCancelled(s3.id)
        check('退款时预扣不是 CAPTURED（人工改过库）→ 不退、转 MANUAL、推 wallet.alert', (await soOf(r3.orderId)).state === 'MANUAL' && (await prisma.balanceLog.count({ where: { orderId: r3.orderId, type: 'REFUND' } })) === 0 && (await pushes('接码退款转人工')) >= 1)
        // 站长核实后把预扣改回真实状态（CAPTURED），再「取消并退回余额」→ 正常退款（对账不留尾巴）
        await prisma.$executeRawUnsafe(`UPDATE balance_holds SET state = 'CAPTURED' WHERE order_id = ${r3.orderId}`)
        await engine.adminCancelRefund(s3.id, uc.id)
        check('  …核实改回后「取消并退回余额」→ CANCELLED、余额回到 170', (await soOf(r3.orderId)).state === 'CANCELLED' && (await buckets(uc.id)).topup === 170)
      } else check('（余额不够第 3 单，跳过第 60 条）', true)
      // 让 mock 上的号结束
      adv(21 * 60)
      await tick(2)
    }

    // =====================================================================================
    section('第 104 条 E44：组合单待支付时预扣被改库成 RELEASED → 到账 → fulfill 抛 HoldStateError → 对账转 MANUAL + wallet.alert、之后不再重调 → 管理员「关单并把到账退入余额」')
    {
      const u = await mkUser('e44')
      await fund(u.id, 100, 0)
      const r = await placeOk(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 100 })
      await prisma.$executeRawUnsafe(`UPDATE balance_holds SET state = 'RELEASED' WHERE order_id = ${r.orderId}`)
      e44Hold = (await prisma.balanceHold.findUniqueOrThrow({ where: { orderId: r.orderId } })).id
      const v = (await vmqOf(r.orderId))!
      await pay(r.orderId)
      check('到账：fulfill 抛错回滚（订单仍待支付、收款单已 1）', (await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } })).payStatus === 'UNPAID' && (await prisma.vmqOrder.findUniqueOrThrow({ where: { id: v.id } })).state === 1)
      await prisma.vmqOrder.update({ where: { id: v.id }, data: { payDate: new Date(Date.now() - 4 * 60_000) } })
      bodies.length = 0
      await vmq.reconcilePaidVmq()
      check('对账：SmsOrder → MANUAL、推一次 wallet.alert', (await soOf(r.orderId)).state === 'MANUAL' && (await pushes('接码单到账后预扣状态异常')) === 1)
      const n1 = (await prisma.smsEvent.count({ where: { smsOrderId: (await soOf(r.orderId)).id } }))
      await vmq.reconcilePaidVmq()
      check('  …下一分钟不再重调 fulfillOrder（不再推、状态不变）', (await pushes('接码单到账后预扣状态异常')) === 1 && (await soOf(r.orderId)).state === 'MANUAL' && (await prisma.smsEvent.count({ where: { smsOrderId: (await soOf(r.orderId)).id } })) === n1)
      const so = await soOf(r.orderId)
      const res = await engine.adminCloseWithLatepay(so.id, u.id)
      const late = await prisma.balanceLog.findMany({ where: { orderId: r.orderId, type: 'LATEPAY' } })
      check('管理员「关单并把到账退入余额」→ 订单 UNPAID + CANCELLED、SmsOrder CLOSED、补记 duplicate_payment 并自动退入一次', res.ok && res.keys.length === 1 && (await soOf(r.orderId)).state === 'CLOSED' && (await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } })).deliveryStatus === 'CANCELLED' && late.length === 1 && late[0].bizKey === `latepay:${res.keys[0]}`)
      await vmq.reconcilePaidVmq()
      check('  …之后对账不再补记（仍只有一笔 LATEPAY）', (await prisma.balanceLog.count({ where: { orderId: r.orderId, type: 'LATEPAY' } })) === 1)
    }

    // =====================================================================================
    section('第 106 / 89 / 108 条 下单即发起收银台：注入发起失败 → 503 PAY_BUSY（本单已取消、预扣已退回）；已有 3 张待付 → 429 OPEN_PAYMENTS 不建单；T4 ① 锁价 + 60 秒关单')
    {
      const u = await mkUser('cashier')
      await fund(u.id, 100, 0)
      order.setJiemaPayFaultForTest(() => {
        throw new Error('injected pay failure')
      })
      const r = await place(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 100 })
      order.setJiemaPayFaultForTest(null)
      const so = await prisma.smsOrder.findFirst({ where: { userId: u.id }, orderBy: { id: 'desc' } })
      check('发起收款失败 → 503 PAY_BUSY「本单已取消，预扣的余额已退回」、订单 CLOSED、预扣 RELEASED', !r.ok && r.code === 'PAY_BUSY' && r.message.includes('预扣的余额已退回') && so?.state === 'CLOSED' && (await buckets(u.id)).topup === 100)
      await placeOk(u, 'ot', 6)
      await placeOk(u, 'ot', 6)
      await placeOk(u, 'ot', 6)
      const n0 = await prisma.smsOrder.count({ where: { userId: u.id } })
      const r4 = await place(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 100 })
      check('已有 3 张待付收款单 → 429 OPEN_PAYMENTS、不建单、不预扣', !r4.ok && r4.code === 'OPEN_PAYMENTS' && (await prisma.smsOrder.count({ where: { userId: u.id } })) === n0 && (await buckets(u.id)).topup === 100)
      // T4 ①
      const u2 = await mkUser('t4a')
      await fund(u2.id, 100, 0)
      order.setJiemaCrashAfterTxForTest(true)
      const r5 = await placeOk(u2, 'ot', 6, { payWith: 'BALANCE', expectBalance: 100 })
      order.setJiemaCrashAfterTxForTest(false)
      adv(9 * 60)
      await tick()
      check('锁价还没过 → 不关', (await soOf(r5.orderId)).state === 'PENDING_PAY')
      adv(62 + 60)
      await tick()
      check('一张收款单都没有过、锁价到期 + 60 秒 → tick 关单（T4 ①）、预扣退回', (await soOf(r5.orderId)).state === 'CLOSED' && (await buckets(u2.id)).topup === 100)
      for (const o of await prisma.smsOrder.findMany({ where: { userId: u.id, state: 'PENDING_PAY' } })) await engine.buyerClose(o, o.version)
    }

    // =====================================================================================
    section('第 111 条 换号失败总则：NO_BALANCE、1020、币种 978、UNKNOWN 后 NOT_BOUGHT → 每次都回 WAITING、旧号保留、replaceCount 不变；换号 UNKNOWN 期间旧号到期 → CANCELLING → 新号认领后放掉 → 只退一次')
    {
      const u = await mkUser('r111')
      const r = await placeOk(u, 'dr', 16)
      await pay(r.orderId)
      adv(125)
      const old = (await curOf(r.orderId))!
      for (const kind of ['no_balance', 'cf1020'] as const) {
        mock.setFaults([{ action: 'getNumberV2', kind }])
        const so = await soOf(r.orderId)
        await engine.buyerReplace(so, so.version)
        const s2 = await soOf(r.orderId)
        check(`换号遇到 ${kind} → 回 WAITING、旧号保留、replaceCount=0`, s2.state === 'WAITING' && s2.currentAttemptId === old.id && s2.replaceCount === 0)
      }
      mock.setFaults([{ action: 'getNumberV2', kind: 'currency' }])
      {
        const so = await soOf(r.orderId)
        await engine.buyerReplace(so, so.version)
        const s2 = await soOf(r.orderId)
        const g = await prisma.smsHold.findUnique({ where: { key: 'global' } })
        check('换号遇到币种 978 → 号码照常切换（已买到）、全局停售照常发生', !!g && g.reason === 'CURRENCY' && s2.state === 'WAITING')
        await prisma.smsHold.deleteMany({ where: { key: 'global' } })
      }
      mock.clearFaults()
      adv(125)
      // UNKNOWN 期间旧号到期（先补一个校准样本：近 24 小时（虚拟时钟）没有样本就不做自动认领）
      await claim.scanUnknown({ fillCalibration: true })
      const cur = (await curOf(r.orderId))!
      mock.setFaults([{ action: 'getNumberV2', kind: 'hang', delayMs: 16_500, bought: true }])
      let so = await soOf(r.orderId)
      await engine.buyerReplace(so, so.version)
      mock.clearFaults()
      so = await soOf(r.orderId)
      check('换号结果未知 → 订单保持 REPLACING', so.state === 'REPLACING')
      await prisma.smsAttempt.update({ where: { id: cur.id }, data: { waitUntil: runtime.jnow() } })
      await engine.advanceOrder(so.id)
      so = await soOf(r.orderId)
      check('旧号到了 waitUntil → 先放旧号、订单 REPLACING → CANCELLING', so.state === 'CANCELLING' || so.state === 'REFUNDING')
      await claim.scanUnknown({})
      const atts = await attsOf(so.id)
      const unk = atts[atts.length - 1]
      check('新号随后被认领 → 因为订单已不是 REPLACING → RELEASING', unk.state === 'RELEASING' || unk.state === 'CANCELLED')
      adv(125)
      await tick(2)
      so = await soOf(r.orderId)
      check('全部终态 → CANCELLED、整单只退一次', so.state === 'CANCELLED' && (await prisma.balanceLog.count({ where: { orderId: r.orderId, type: 'REFUND' } })) === 1)
    }

    // =====================================================================================
    section('第 113 条 getStatus 的两种返回：STATUS_WAIT_RETRY:482917 且我方没记短信 → RECEIVED（code 入库）；STATUS_CANCEL → 查 history')
    {
      const u = await mkUser('s113')
      const r = await placeOk(u, 'dr', 16)
      await pay(r.orderId)
      const so = await soOf(r.orderId)
      mock.setFaults([{ action: 'getStatus', kind: 'custom', http: 200, body: 'STATUS_WAIT_RETRY:482917' }])
      await engine.lazyAdvance(so.id)
      mock.clearFaults()
      const s1 = await soOf(r.orderId)
      const m = await prisma.smsMessage.findMany({ where: { smsOrderId: so.id } })
      check('买家页单查拿到 STATUS_WAIT_RETRY:482917、没记短信 → RECEIVED、code=482917 入库', s1.state === 'RECEIVED' && m.some((x) => x.code === '482917'))
      await engine.buyerFinish(s1, s1.version).catch(() => null)
      const r2 = await placeOk(u, 'dr', 16)
      await pay(r2.orderId)
      const s2 = await soOf(r2.orderId)
      mock.setFaults([{ action: 'getStatus', kind: 'custom', http: 200, body: 'STATUS_CANCEL' }])
      adv(5)
      await engine.lazyAdvance(s2.id)
      mock.clearFaults()
      check('STATUS_CANCEL、history 里还找不到（号还活着）→ 状态不动', (await soOf(r2.orderId)).state === 'WAITING')
      adv(21 * 60)
      await tick(2)
    }

    // =====================================================================================
    section('第 44 条 REPLACING 崩溃恢复：有更新的 ACTIVE → 做完切换；有在途取号 → 等；都没有且超过 60 秒 → 回 WAITING')
    {
      const u = await mkUser('r44')
      const r = await placeOk(u, 'dr', 16)
      await pay(r.orderId)
      adv(125)
      let so = await soOf(r.orderId)
      // 分支 3：都没有
      await prisma.smsOrder.update({ where: { id: so.id }, data: { state: 'REPLACING' } })
      await prisma.smsEvent.create({ data: { smsOrderId: so.id, type: 'REPLACE_REQ', actor: 'SYSTEM', createdAt: new Date(Date.now() - 70_000) } })
      await engine.advanceOrder(so.id)
      so = await soOf(r.orderId)
      check('没有新号也没有在途取号、超过 60 秒 → CAS 回 WAITING', so.state === 'WAITING')
      // 分支 1：有更新的 ACTIVE 换号尝试
      const bought = mock.buy({ service: 'dr', country: 16 })[0]
      const now = runtime.jnow()
      await prisma.smsOrder.update({ where: { id: so.id }, data: { state: 'REPLACING', attemptCount: so.attemptCount + 1 } })
      await prisma.smsAttempt.create({ data: { smsOrderId: so.id, seq: so.attemptCount + 1, reason: 'REPLACE', state: 'ACTIVE', service: 'dr', country: 16, maxPriceMicro: so.capMicro, activationId: bought.id, phone: bought.phone, costMicro: bought.costMicro, requestedAt: now, respondedAt: now, canCancelAt: new Date(now.getTime() + 123_000), endsAt: new Date(bought.endsAt), waitUntil: new Date(bought.endsAt - 45_000) } })
      const old = so.currentAttemptId
      await engine.advanceOrder(so.id)
      so = await soOf(r.orderId)
      check('有比当前号更新的 ACTIVE → 把切换做完（WAITING、当前号换了、旧号放掉）', so.state === 'WAITING' && so.currentAttemptId !== old && (await prisma.smsAttempt.findUniqueOrThrow({ where: { id: old! } })).state === 'CANCELLED')
      // 分支 2：有在途取号 → 等
      await prisma.smsOrder.update({ where: { id: so.id }, data: { state: 'REPLACING', attemptCount: so.attemptCount + 1 } })
      await prisma.smsAttempt.create({ data: { smsOrderId: so.id, seq: so.attemptCount + 1, reason: 'REPLACE', state: 'UNKNOWN', service: 'dr', country: 16, maxPriceMicro: so.capMicro, requestedAt: runtime.jnow() } })
      await engine.advanceOrder(so.id)
      check('有 UNKNOWN 的换号尝试 → 保持 REPLACING，等扫描器', (await soOf(r.orderId)).state === 'REPLACING')
      await prisma.smsAttempt.updateMany({ where: { smsOrderId: so.id, state: 'UNKNOWN' }, data: { state: 'FAILED', errorCode: 'NOT_BOUGHT' } })
      await engine.afterNotBought(so.id, { reason: 'REPLACE' })
      check('  …NOT_BOUGHT 之后回 WAITING', (await soOf(r.orderId)).state === 'WAITING')
      adv(21 * 60)
      await tick(2)
    }

    // =====================================================================================
    section('第 88 条 晚到的扣费：换号后被换下的旧号在 RELEASING 期间收码、买家已点「我已用完」→ 成本包含两个号、定稿等两个号都终态')
    {
      const u = await mkUser('r88')
      const r = await placeOk(u, 'dr', 16)
      await pay(r.orderId)
      adv(125)
      const old = (await curOf(r.orderId))!
      // 旧号放不掉（上游拒绝），先挂在 RELEASING
      mock.setFaults([{ action: 'setStatus', kind: 'early_cancel_denied', status: 8, times: 0 }])
      let so = await soOf(r.orderId)
      await engine.buyerReplace(so, so.version)
      so = await soOf(r.orderId)
      const cur = (await curOf(r.orderId))!
      check('换号成功、旧号挂在 RELEASING', so.state === 'WAITING' && (await prisma.smsAttempt.findUniqueOrThrow({ where: { id: old.id } })).state === 'RELEASING')
      mock.pushSms(cur.activationId!)
      await tick()
      so = await soOf(r.orderId)
      await engine.buyerFinish(so, so.version)
      so = await soOf(r.orderId)
      check('买家已完成：FINISHED、但旧号未终态 → costFinal=false', so.state === 'FINISHED' && !so.costFinal)
      mock.pushSms(old.activationId!)
      mock.clearFaults()
      adv(20)
      await tick(2)
      so = await soOf(r.orderId)
      const oldNow = await prisma.smsAttempt.findUniqueOrThrow({ where: { id: old.id } })
      check('旧号收码（charged）→ 成本重算包含两个号（$0.09 → 65 分）', oldNow.charged && so.chargedMicro === 90_000 && so.costCents === 65)
      adv(20 * 60)
      await tick(2)
      so = await soOf(r.orderId)
      check('两个号都终态 → 定稿', so.costFinal && !!so.costAt)
    }

    // =====================================================================================
    section('第 45 条 cron 停了：买家 GET 惰性推进照常收码与取消退回；心跳超过 3 分钟 → 告警')
    {
      const u = await mkUser('lazy')
      const r = await placeOk(u, 'dr', 16)
      await pay(r.orderId)
      const c = (await curOf(r.orderId))!
      mock.pushSms(c.activationId!)
      await prisma.setting.upsert({ where: { key: engine.SMS_RUNTIME_KEY }, create: { key: engine.SMS_RUNTIME_KEY, value: JSON.stringify({ tickAt: new Date(Date.now() - 10 * 60_000).toISOString() }) }, update: { value: JSON.stringify({ tickAt: new Date(Date.now() - 10 * 60_000).toISOString() }) } })
      bodies.length = 0
      alert.resetSmsAlertThrottleForTest()
      adv(5)
      const res = await callRoute(routeView.GET, { host: MAIN, token: u.token, method: 'GET', path: `/api/jiema/orders/${r.orderNo}`, params: { orderNo: r.orderNo } })
      check('GET 号码页 → 惰性推进 getStatus 收码、返回 RECEIVED 与短信、no-store', res.status === 200 && res.json?.data?.state === 'RECEIVED' && res.json?.data?.messages?.length === 1)
      check('  …心跳超过 3 分钟 → 推 TICK_STALE', (await pushes('TICK_STALE')) === 1)
      const other = await mkUser('lazy-other')
      const res2 = await callRoute(routeView.GET, { host: MAIN, token: other.token, method: 'GET', path: `/api/jiema/orders/${r.orderNo}`, params: { orderNo: r.orderNo } })
      check('别人的订单号 → 404（E34）', res2.status === 404)
      const tickRes = await callRoute(routeTick.GET, { host: MAIN, method: 'GET', path: '/api/cron/jiema-tick' })
      check('cron 路由：没有密钥 → 拒绝', tickRes.status >= 400)
      adv(21 * 60)
      await tick(2)
    }

    // =====================================================================================
    section('第 42 条 渠道 Host 下 /api/jiema/orders/* 一律 404')
    {
      const lulu = await createTenant('l')
      const u = await mkUser('chan')
      const p1 = await callRoute(routeOrders.POST, { host: lulu.host, token: u.token, method: 'POST', path: '/api/jiema/orders', body: {} })
      const p2 = await callRoute(routeView.GET, { host: lulu.host, token: u.token, method: 'GET', path: '/api/jiema/orders/X', params: { orderNo: 'XXXXXXXXXX' } })
      const p3 = await callRoute(routeCancel.POST, { host: lulu.host, token: u.token, method: 'POST', path: '/api/jiema/orders/X/cancel', params: { orderNo: 'XXXXXXXXXX' }, body: { version: 0 } })
      check('下单、号码页、取消在渠道 Host 都是 404', p1.status === 404 && p2.status === 404 && p3.status === 404)
      const p4 = await callRoute(routeOrders.POST, { host: MAIN, token: u.token, method: 'POST', path: '/api/jiema/orders', body: { service: 'OT' } })
      check('主站：格式不对 → 400（zod 只校验格式）', p4.status === 400)
    }

    // =====================================================================================
    section('第 80 条 锁顺序：同一用户「下新单」与「旧单到期退款」并发 → 没有死锁；载体商品销量始终不变')
    {
      const u = await mkUser('locks')
      await fund(u.id, 5000, 0)
      const olds = []
      const p80 = (await priceOf('dr', 16)).priceCents
      for (let i = 0; i < 4; i++) olds.push(await placeOk(u, 'dr', 16, { payWith: 'BALANCE', expectBalance: p80 }))
      for (const o of olds) {
        const c = (await curOf(o.orderId))!
        mock.endActivation(c.activationId!, 8)
        await prisma.smsAttempt.update({ where: { id: c.id }, data: { state: 'CANCELLED', closedAt: new Date() } })
        await prisma.smsOrder.update({ where: { orderId: o.orderId }, data: { state: 'REFUNDING', refundReason: 'EXPIRED' } })
      }
      const tasks: Promise<unknown>[] = []
      for (const o of olds) tasks.push((async () => refund.refundCancelled((await soOf(o.orderId)).id))())
      for (let i = 0; i < 4; i++) tasks.push(place(u, 'dr', 16, { payWith: 'BALANCE', expectBalance: p80 }).catch((e) => ({ err: String(e) })))
      const out = await Promise.all(tasks)
      const errs = out.filter((x) => x && typeof x === 'object' && 'err' in (x as object))
      check('并发 8 个资金事务：没有抛错（1213 统一重试一次）', errs.length === 0, JSON.stringify(errs).slice(0, 300))
      check('旧单全部退回（每单一条 REFUND）', (await prisma.balanceLog.count({ where: { orderId: { in: olds.map((o) => o.orderId) }, type: 'REFUND' } })) === 4)
      check('载体商品销量始终不变', (await prisma.product.findUniqueOrThrow({ where: { id: carrierId } })).sales === carrierSales0)
      adv(21 * 60)
      await tick(3)
    }

    // =====================================================================================
    section('第 58 条 余额支付急停：新单不能选余额（503）；已预扣的单照常确认')
    {
      const u = await mkUser('bpoff')
      await fund(u.id, 100, 0)
      const held = await placeOk(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 100 })
      await setWallet({ balancePayEnabled: false })
      const r = await place(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 0 })
      check('急停 → 503 BALANCE_PAY_OFF', !r.ok && r.code === 'BALANCE_PAY_OFF')
      await pay(held.orderId)
      check('  …已预扣的单照常确认（CAPTURED）', (await prisma.balanceHold.findUniqueOrThrow({ where: { orderId: held.orderId } })).state === 'CAPTURED')
      await setWallet()
      adv(21 * 60)
      await tick(2)
    }

    // =====================================================================================
    section('T16 售后退款（管理员）：收过码的单整单原路退回余额、成本照计、利润 = −成本；D42 例外时长 19 分钟；E55 同组合第二次 → 停售；D43 账户收紧换号')
    {
      const u = await mkUser('t16')
      await fund(u.id, 100, 0)
      const r = await placeOk(u, 'dr', 16, { payWith: 'BALANCE', expectBalance: 100 })
      const paid = await pay(r.orderId)
      const c = (await curOf(r.orderId))!
      mock.pushSms(c.activationId!)
      await tick()
      let so = await soOf(r.orderId)
      const res = await engine.adminRefund(so.id, u.id, 'COMPLAINT')
      so = await soOf(r.orderId)
      const b = await buckets(u.id)
      check('售后退款 → REFUNDED、refundBy、一条 REFUND：余额 100 原路 + 支付宝实收进充值格', res.ok && so.state === 'REFUNDED' && so.refundBy === u.id && b.topup === 100 + centsOf(paid.reallyPrice) && (await prisma.balanceLog.count({ where: { orderId: r.orderId, type: 'REFUND' } })) === 1)
      check('  …成本照计（33 分）、利润 = −成本、号码已完成 → 定稿', so.costCents === 33 && so.profitCents === -33 && so.costFinal && mock.get(c.activationId!)?.status === 'FINISHED')
      const o = await prisma.order.findUniqueOrThrow({ where: { id: r.orderId } })
      check('  …Order REFUNDED / CANCELLED', o.payStatus === 'REFUNDED' && o.deliveryStatus === 'CANCELLED')
      // D42：tg:6 在假上游是 45 分钟号 → longWaitOk=false 时取号后 19 分钟主动取消
      const u2 = await mkUser('long')
      const r2 = await placeOk(u2, 'tg', 6)
      await pay(r2.orderId)
      const c2 = (await curOf(r2.orderId))!
      check('例外时长（45 分钟号）：waitUntil = 取号 + 19 分钟（不按 endsAt）', Math.abs(c2.endsAt!.getTime() - c2.respondedAt!.getTime() - 45 * 60_000) < 5_000 && c2.waitUntil!.getTime() - c2.respondedAt!.getTime() === 19 * 60_000, `endsAt-resp=${c2.endsAt!.getTime() - c2.respondedAt!.getTime()} wait-resp=${c2.waitUntil!.getTime() - c2.respondedAt!.getTime()}`)
      adv(19 * 60 + 5)
      await tick(2)
      check('  …第 19 分钟主动取消 → 整单退回（上游 20 分钟内取消照常退费）', (await soOf(r2.orderId)).state === 'CANCELLED' && mock.get(c2.activationId!)?.status === 'CANCELLED')
      // E55：同组合 24 小时内第二次 FREE_CANCELLATION_EXPIRED → 自动停售这个组合
      for (let i = 0; i < 2; i++) {
        const r3 = await placeOk(u2, 'dr', 52)
        await pay(r3.orderId)
        mock.setFaults([{ action: 'setStatus', kind: 'free_cancel_expired', status: 8 }])
        adv(20 * 60 - 40)
        await tick(2)
        mock.clearFaults()
      }
      const h = await prisma.smsHold.findUnique({ where: { key: 'combo:dr:52' } })
      check('E55 同组合第二次没码被扣费 → combo:dr:52 自动停售（EXPIRED_CHARGE）', !!h && h.reason === 'EXPIRED_CHARGE')
      await prisma.smsHold.deleteMany({ where: { key: 'combo:dr:52' } })
      // D43：账户整体接近限线程线 → 新单的免费换号收紧到 2 次
      runtime.setTightenUntil(runtime.jnow().getTime() + 600_000)
      const r4 = await placeOk(u2, 'ot', 6)
      check('账户收紧期间新单 maxReplace = 2（出厂 5）', (await soOf(r4.orderId)).maxReplace === 2)
      runtime.setTightenUntil(null)
      const r5 = await placeOk(u2, 'ot', 6)
      check('  …解除后恢复 5', (await soOf(r5.orderId)).maxReplace === 5)
      for (const x of [r4, r5]) {
        const sx = await soOf(x.orderId)
        await engine.buyerClose(sx, sx.version)
      }
      adv(21 * 60)
      await tick(2)
    }

    // =====================================================================================
    section('号码页视图（§6.4）与对账 W9 / W3 / W4 / W1：本测试的数据不新增问题')
    {
      const u = await mkUser('view')
      await fund(u.id, 70, 50)
      const r = await placeOk(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 120 })
      const v = await view.buildOrderView((await view.findBuyerOrder(u.id, r.orderNo))!)
      check('待支付：pay.holdState=HELD、两格拆分、cashierUrl 复用有效收款单、actions.pay / close', v.state === 'PENDING_PAY' && v.pay.holdState === 'HELD' && v.pay.balanceTopupCents === 70 && v.pay.balanceCashCents === 50 && v.cashierUrl === r.payUrl && v.actions.pay && v.actions.close && !!v.quoteExpiresAt)
      const so = await soOf(r.orderId)
      await engine.buyerClose(so, so.version)
      const v2 = await view.buildOrderView((await view.findBuyerOrder(u.id, r.orderNo))!)
      check('关单后：CLOSED、holdState=RELEASED、pollMs=0、没有 cashierUrl', v2.state === 'CLOSED' && v2.pay.holdState === 'RELEASED' && v2.pollMs === 0 && v2.cashierUrl === null)
      adv(21 * 60)
      await tick(3)
      const stillHeld = await prisma.balanceHold.findMany({ where: { userId: { in: userIds }, state: 'HELD' }, select: { id: true, orderId: true } })
      for (const h of stillHeld) {
        const so = await prisma.smsOrder.findUnique({ where: { orderId: h.orderId }, select: { state: true, payMode: true } })
        console.log(`    （诊断）仍 HELD 的预扣 #${h.id} 订单 #${h.orderId}：${so?.state} / ${so?.payMode}`)
      }
      check('本测试的用户没有留下 HELD 预扣（第 104 条故意改库成 RELEASED 的那一张除外）', stillHeld.length === 0)
      const rep = await reconcile.runWalletReconcile({ full: true, alert: false, save: false })
      for (const code of ['W1', 'W2', 'W3', 'W4', 'W5', 'W9']) {
        const it = rep.items.find((i) => i.code === code)!
        const base = baseSamples(code)
        // 第 104 条（E44）故意把一张单的预扣改库成 RELEASED、设计上留给站长人工核实（§7.2「预扣保持原样」）：它在 W3 与预扣等式里本来就该报
        const fresh = it.samples.filter((s) => !base.has(s) && !(e44Hold && (s.includes(`#${e44Hold}`) || s.startsWith('预扣等式'))))
        check(`${code} 没有新增问题（${it.title}）`, fresh.length === 0, fresh.join('；').slice(0, 400))
      }
    }
  } finally {
    order.setJiemaCrashAfterTxForTest(false)
    order.setJiemaPayFaultForTest(null)
    engine.setWriteActiveFaultForTest(null)
    vmq.setCloseExpiredReleaseFaultForTest(null)
    // ---- 清理：本测试用户的全部接码数据、流水、预扣、收款单、订单 ----
    const orders = await prisma.order.findMany({ where: { userId: { in: userIds } }, select: { id: true, orderNo: true } })
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
    const fresh = (await prisma.setting.findMany({ where: { key: { startsWith: 'vmq_unmatched:' } }, select: { key: true } })).map((s) => s.key).filter((k) => !unmatchedBefore.has(k))
    await prisma.setting.deleteMany({ where: { key: { in: [...fresh, ...vmqs.map((v) => `vmqrec:${v.id}`), ...vmqs.map((v) => `latepay_auto:${v.orderId}`)] } } })
    await prisma.setting.deleteMany({ where: { key: { startsWith: 'latepay_' }, value: { in: fresh } } })
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
    if (seededCarrier) {
      await prisma.product.deleteMany({ where: { id: seededCarrier.productId } })
      if (seededCarrier.categoryId && (await prisma.product.count({ where: { categoryId: seededCarrier.categoryId } })) === 0) await prisma.category.deleteMany({ where: { id: seededCarrier.categoryId } })
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
