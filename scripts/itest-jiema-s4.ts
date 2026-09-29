/**
 * 短信接码 · S4（对账与监控）—— 数据库集成测试（会建数据、会删数据）。docs/短信接码-设计.md §9.4、§7.1、§7.7、§11 S4 验收、§12.2 第 28、35、94 条：
 *
 *   set -a; . ./.env.local; set +a; VMQ_KEY=itest npx tsx scripts/itest-jiema-s4.ts
 *
 * ⚠️ 只能对一次性的本地库跑（库名须含 dev / test）。**不调用真实 hero-sms**：上游一律是本地假服务（scripts/mock-herosms.ts，只绑 127.0.0.1），
 * 企业微信推送打到本地假 webhook。sms_* 目录与停售表、相关 settings 在开始时存档、结束时原样恢复；本测试建的订单、流水、预扣、收款单、旧单品商品全部删掉。
 *
 * 覆盖：
 *   · 正常流程（余额付清完成、买家取消退回、支付宝全额完成）：I1–I8、R0–R6 没有误报，R5 当天「上游实扣 = 我方扣费」；
 *   · §11 S4 验收 ①：假服务注入上游宕机 → 熔断打开 → 恢复 3 分钟后关闭；endsAt + 60 分钟推定退款（assumed）→ 对账：
 *     上游确认退了 → R2 清掉 assumed；上游事后说扣了（history 6）→ R1 亏损分支：只写 lossCents、订单仍是已取消、成本利润仍为空、
 *     不跑 T20（没有 COST 事件）、余额不动、推一条「接码对账发现不一致」；再跑一次不重复（第 35 条）；
 *   · R6：上游事后退了收过码的号 → 冲回、重跑 T20（利润 = 售价 − 0）、costAt 不变；R1：上游实扣与我方成本不一致 → 以上游为准；
 *   · R3 与未关联激活的实时监控（第 28 条）：外部激活推一次、旧链路遗留（旧单品付款后 30 分钟内、同服务）只列出、旧表 sms_activations 里的算本站，
 *     都不取消；history 里新出现的外部激活 R3 报一次，下一次不再报；R5 的旧链路一列；
 *   · R4：我方计了扣费的号在上游 history 里找不到；
 *   · §11 S4 验收 ②：改一条流水金额（I2 + W1 / W8）、造一条卡住的预扣（W5 + 实时 wallet.alert 30 分钟一次）、载体单多一行 BALANCE 支付流水（W4 反向）、
 *     I4（过期没结束的尝试）、I8（没定稿 → 补算）；
 *   · 日报：cron 那一趟生成「昨天」的日报，北京 09:00 之前不推、09:00 推一次 sms.daily、再调不重复、同一天再生成不重新排队、过期不推；
 *     知会（同一用户 24 小时内支付宝付款后取消退回 > ¥50 → wallet.alert 知会）；
 *   · cron 路由（没有密钥拒绝、有密钥 200、同一时刻只跑一趟）、后台接口（adminGuard、审计、渠道 404）、概览 s4、jiema-tick 入口带上 S4 监控；
 *   · 最后 W、I 系列与开头相比不新增问题（第 94 条「排空后对账 W、I 系列无误」的对账部分）；
 *   · S4 评审修复：history 里认不出的币种（"RUB"）不当美元改成本；订单退款中时不修正（下一次再核）；后台手动对账的修正带操作人与前后值；
 *     R0 失败时保留上一次的未关联激活清单（进程重启后也不重复报）；报告按 utf8 字节量瘦身后存；锁续租、锁丢了中止；
 *     cron 等锁、等不到推「没有执行」并照样排日报；整趟出错存「执行失败」报告并推告警、后台出错也写审计；
 *     日报单列当天的「对账修正」；后台用户列表与接码订单列表的可疑用户标记（§10.1）。
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
  ensurePlatformTenant,
  createTenant,
  createUser,
  cleanupAll,
  type RouteFn,
  type WorldUser,
} from './itest-tenant/_harness'
import { startMockHeroSms, type MockHandle } from './mock-herosms'

const MAIN = 'bigolab.com'
const KEY = `itest-jiema-s4-${crypto.randomUUID()}`
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const uuid = () => crypto.randomUUID()
const MIN = 60_000
const H = 3600_000

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
  'tg:6': { usd: 0.15, stock: 100_000 },
  'dr:16': { usd: 0.045, stock: 100_000 },
  'wa:6': { usd: 0.21, stock: 100_000 },
  'ig:6': { usd: 0.0334, stock: 100_000 },
  'tg:48': { usd: 0.9, stock: 100_000 },
}
const SMS_TABLES = ['sms_services', 'sms_countries', 'sms_offer_cache', 'sms_price_rules', 'sms_holds'] as const
const KEEP_SETTINGS = [
  'sms_config',
  'sms_catalog_at',
  'sms_operator_names',
  'sms_runtime',
  'wallet_config',
  'vmq_lastpay',
  'vmq_lastunmatched',
  'vmq_recentraw',
  'vmq_lastheart',
  'sms_reconcile_last',
  'sms_unlinked_last',
  'sms_daily_pending',
  'wallet_reconcile_last',
]

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
  process.env.CRON_SECRET = process.env.CRON_SECRET || 'itest-cron-secret-jiema-s4'
  const pushes = async (needle: string) => {
    await sleep(200)
    return bodies.filter((b) => b.includes(needle)).length
  }

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
  const holds = await import('../src/lib/jiema/holds')
  const order = await import('../src/lib/jiema/order')
  const recon = await import('../src/lib/jiema/reconcile')
  const unlinked = await import('../src/lib/jiema/unlinked')
  const monitor = await import('../src/lib/jiema/monitor')
  const rules = await import('../src/lib/jiema/recon-rules')
  const { realCostCents } = await import('../src/lib/jiema/pricing')
  const ledger = await import('../src/lib/wallet/ledger')
  const walletCfg = await import('../src/lib/wallet/config')
  const wrec = await import('../src/lib/wallet/reconcile')
  const { centsOf } = await import('../src/lib/wallet/buckets')
  const vmq = await import('../src/lib/vmq')
  const lock = await import('../src/lib/marketing/lock')
  const { FACTORY_SMS_CONFIG } = await import('../src/lib/jiema-config-schema')
  const { JIEMA_TERMS_VERSION, WALLET_TERMS_VERSION } = await import('../src/lib/terms/jiema-wallet')
  const routeCron = (await import('../src/app/api/cron/jiema-reconcile/route')) as unknown as { GET: RouteFn }
  const routeAdmin = (await import('../src/app/api/admin/jiema/reconcile/route')) as unknown as { GET: RouteFn; POST: RouteFn }
  const routeOverview = (await import('../src/app/api/admin/jiema/overview/route')) as unknown as { GET: RouteFn }
  const routeOrders = (await import('../src/app/api/admin/jiema/orders/route')) as unknown as { GET: RouteFn }
  const routeUsers = (await import('../src/app/api/admin/users/route')) as unknown as { GET: RouteFn }

  const saved: Record<string, unknown[]> = {}
  for (const t of SMS_TABLES) saved[t] = await prisma.$queryRawUnsafe(`SELECT * FROM ${t}`)
  const savedSettings = await prisma.setting.findMany({ where: { key: { in: KEEP_SETTINGS } } })
  const unmatchedBefore = new Set((await prisma.setting.findMany({ where: { key: { startsWith: 'vmq_unmatched:' } }, select: { key: true } })).map((s) => s.key))
  const userIds: number[] = []
  const seeded: Array<{ productId: number; categoryId: number | null }> = []
  const legacyIds: { categoryId: number | null; productId: number | null; orderIds: number[]; activationIds: string[] } = { categoryId: null, productId: null, orderIds: [], activationIds: [] }

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

  try {
    await cleanupAll()
    await ensurePlatformTenant()
    setChannelsMode('observe')
    runtime.resetRuntimeForTest()
    up.resetUpstreamStateForTest()
    alert.resetSmsAlertThrottleForTest()
    order.resetSmsCarrierCacheForTest()
    monitor.resetHeldAlertThrottleForTest()
    for (const t of SMS_TABLES) await prisma.$executeRawUnsafe(`DELETE FROM ${t}`)
    await prisma.setting.deleteMany({ where: { key: { in: ['sms_catalog_at', 'sms_operator_names', 'sms_runtime', 'sms_reconcile_last', 'sms_unlinked_last', 'sms_daily_pending'] } } })

    section('准备：SMS_POOL / TOPUP 载体种子、目录同步、配置（总开关开 + 仅管理员）、对账基线')
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
    // 对账基线（开发库里别的测试留下的数据不算本测试的误报；只比「新增」的问题）
    const wBase = await wrec.runWalletReconcile({ full: true, alert: false, save: false, now: runtime.jnow() })
    const iBase = (await recon.runJiemaReconcile({ upstream: false, alert: false, save: false, full: true }))!
    const baseSamples = (rep: { items: Array<{ code: string; samples: string[] }> }, code: string) => new Set(rep.items.find((i) => i.code === code)?.samples ?? [])
    const freshIssues = (rep: { items: Array<{ code: string; samples: string[] }> }, base: { items: Array<{ code: string; samples: string[] }> }, code: string) => {
      const b = baseSamples(base, code)
      return (rep.items.find((i) => i.code === code)?.samples ?? []).filter((s) => !b.has(s))
    }
    check('基线：I 系列跑得起来（upstream=false 时没有 R 项）', iBase.items.length === 8 && iBase.items.every((i) => i.code.startsWith('I')))

    const mkUser = async (name: string, role: 'USER' | 'ADMIN' = 'ADMIN'): Promise<WorldUser & { token: string }> => {
      const u = await createUser(`s4-${name}-${uuid().slice(0, 6)}`, { role })
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
    const firstAtt = async (orderId: number) => (await attsOf((await soOf(orderId)).id))[0]
    const settle = async (orderId: number) => {
      const so = await soOf(orderId)
      for (let i = 0; i < 60; i++) {
        if (!(await prisma.smsAttempt.count({ where: { smsOrderId: so.id, state: 'REQUESTING' } }))) return
        await sleep(300)
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
    let rawSeq = 0
    const pay = async (orderId: number) => {
      const v = await prisma.vmqOrder.findFirst({ where: { bizType: 'order', bizId: orderId, state: 0 }, orderBy: { id: 'desc' } })
      if (!v) throw new Error(`订单 ${orderId} 没有待支付收款单`)
      await vmq.markPaidByAmount(Number(v.reallyPrice).toFixed(2), 2, `你已成功收款${Number(v.reallyPrice).toFixed(2)}元（itest-s4-${++rawSeq}-${uuid()}）`)
      return v
    }
    /** 余额付清一单 → 取到号 → WAITING */
    const waiting = async (u: { id: number; role: string }, service = 'ot', country = 6) => {
      const q = await catalog.quote(service, country, await cfgNow(), runtime.jnow())
      const r = await place(u, service, country, { payWith: 'BALANCE', expectBalance: q.ok ? q.priceCents : 0 })
      await settle(r.orderId)
      return r
    }
    const receiveAndFinish = async (orderId: number, code: string) => {
      const a = await firstAtt(orderId)
      mock.pushSms(a.activationId as string, { code, text: `Your code is ${code}` })
      await tick()
      const so = await soOf(orderId)
      await engine.lazyAdvance(so.id).catch(() => undefined)
      const so2 = await soOf(orderId)
      await engine.buyerFinish(so2, so2.version)
      await tick()
    }
    const run = async (o: Parameters<typeof recon.runJiemaReconcile>[0] = {}) => {
      const r = await recon.runJiemaReconcile({ alert: false, save: false, ...o })
      if (!r) throw new Error('对账被锁挡住')
      return r
    }
    const itemOf = (r: { items: Array<{ code: string; title: string; ok: boolean; count: number; samples: string[]; note?: string }> }, code: string) => r.items.find((i) => i.code === code)!
    const admin = await mkUser('admin')
    const asAdmin = { host: MAIN, token: admin.token }

    // =====================================================================================
    section('正常流程：余额付清完成、买家取消退回、支付宝全额完成 → I1–I8、R0–R6 没有误报，R5「上游实扣 = 我方扣费」')
    const u1 = await mkUser('u1')
    await fund(u1.id, 5000, 0)
    const f1 = await waiting(u1)
    await receiveAndFinish(f1.orderId, '615243')
    const c1 = await waiting(u1)
    adv(130)
    {
      const so = await soOf(c1.orderId)
      await engine.buyerCancel(so, so.version)
      await tick(2)
    }
    const u2 = await mkUser('u2')
    const aliF = await place(u2, 'tg', 6)
    await pay(aliF.orderId)
    await settle(aliF.orderId)
    await tick()
    await receiveAndFinish(aliF.orderId, '771234')
    check(
      '前置：余额单 FINISHED（已定稿）、取消单 CANCELLED、支付宝单 FINISHED（实收 = 收款单实付）',
      (await soOf(f1.orderId)).state === 'FINISHED' && (await soOf(f1.orderId)).costFinal && (await soOf(c1.orderId)).state === 'CANCELLED' && (await soOf(aliF.orderId)).state === 'FINISHED' && (await soOf(aliF.orderId)).alipayPaidCents != null,
      `${(await soOf(f1.orderId)).state} ${(await soOf(c1.orderId)).state} ${(await soOf(aliF.orderId)).state}`,
    )
    adv(40 * 60)
    {
      const rep = await run()
      for (const code of ['I1', 'I2', 'I3', 'I4', 'I5', 'I6', 'I7', 'I8']) {
        const fresh = freshIssues(rep, iBase, code)
        check(`${code} 没有新增问题（${itemOf(rep, code).title.slice(0, 40)}…）`, fresh.length === 0, fresh.join('；').slice(0, 300))
      }
      for (const code of ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6']) check(`${code} 通过`, itemOf(rep, code)?.ok === true, JSON.stringify(itemOf(rep, code)).slice(0, 300))
      check('上游 history 拉到了 3 行（6 / 8 / 6），没有做任何修正', rep.upstream.ok && rep.upstream.rows === 3 && rep.fixes.r1 === 0 && rep.fixes.r6 === 0 && rep.fixes.r2Cleared === 0 && rep.fixes.i8 === 0, JSON.stringify(rep.fixes))
      const f1a = await firstAtt(f1.orderId)
      const alia = await firstAtt(aliF.orderId)
      const upSum = rep.r5.reduce((a, d) => a + d.upstreamMicro, 0)
      const ourSum = rep.r5.reduce((a, d) => a + d.oursMicro, 0)
      check('R5：上游实扣 = 我方扣费 = 两张完成单的成本（取消单的标价不算）', rep.r5.every((d) => d.ok) && upSum === ourSum && upSum === (f1a.costMicro ?? 0) + (alia.costMicro ?? 0) && rep.r5.reduce((a, d) => a + d.rows, 0) === 2, JSON.stringify(rep.r5))
    }

    // =====================================================================================
    section('§11 S4 验收 ①：上游宕机 → 熔断打开 → 恢复 3 分钟后关闭；推定退款（assumed）→ 对账核实：退了清 assumed、扣了只记亏损（第 35 条）')
    {
      up.resetUpstreamStateForTest()
      mock.setFaults([{ action: '*', kind: 'http500', times: 0 }])
      for (let i = 0; i < 6; i++) await up.getActiveActivations().catch(() => null)
      await holds.evaluateBreaker()
      const g = await prisma.smsHold.findUnique({ where: { key: 'global' } })
      check('≥5 次 5xx 且占比 ≥50% → 熔断打开（global / BREAKER）', !!g && g.reason === 'BREAKER' && runtime.rt().breaker.open)
      mock.clearFaults()
      await holds.evaluateBreaker()
      adv(181)
      await holds.evaluateBreaker()
      check('探活连续成功 3 分钟 → 熔断关闭（BREAKER 那一行删掉）', !(await prisma.smsHold.findUnique({ where: { key: 'global' } })) && !runtime.rt().breaker.open)
    }
    const u3 = await mkUser('u3')
    await fund(u3.id, 5000, 0)
    const a1 = await waiting(u3, 'ot', 6)
    const a2 = await waiting(u3, 'dr', 16)
    const a1act = (await firstAtt(a1.orderId)).activationId as string
    const a2act = (await firstAtt(a2.orderId)).activationId as string
    {
      mock.setFaults([{ action: '*', kind: 'http500', times: 0 }])
      adv(20 * 60 + 61 * 60)
      await tick()
      mock.clearFaults()
      runtime.rt().breaker.open = false
      await prisma.smsHold.deleteMany({ where: { key: 'global', reason: 'BREAKER' } })
      const s1 = await soOf(a1.orderId)
      const s2 = await soOf(a2.orderId)
      const t1 = await firstAtt(a1.orderId)
      const t2 = await firstAtt(a2.orderId)
      check('上游一直联系不上、过了 endsAt 60 分钟 → 两张单的号都按推定退款 CANCELLED（assumed）、订单已取消、整单退回', s1.state === 'CANCELLED' && s2.state === 'CANCELLED' && t1.assumed && t2.assumed && !t1.charged && !t2.charged, `${s1.state} ${s2.state} ${t1.assumed} ${t2.assumed}`)
    }
    // 上游那边：a1 确实退了（假服务到期无码 → 10）；a2 事后翻案——history 显示状态 6（扣了费）
    {
      const m2 = mock.get(a2act)!
      m2.status = 'FINISHED'
      m2.endedAt = mock.now()
    }
    adv(40 * 60)
    const before3 = await buckets(u3.id)
    const s2before = await soOf(a2.orderId)
    bodies.length = 0
    alert.resetSmsAlertThrottleForTest()
    {
      const rep = await run({ alert: true, save: true })
      const t1 = await firstAtt(a1.orderId)
      const t2 = await firstAtt(a2.orderId)
      const s2 = await soOf(a2.orderId)
      const o2 = await prisma.order.findUniqueOrThrow({ where: { id: a2.orderId } })
      const expLoss = realCostCents(t2.costMicro ?? t2.maxPriceMicro, s2.costFx4)
      check('R2：上游确认退了（状态 10、没码）→ 推定退款核实、assumed 清掉、仍不计扣费', !t1.assumed && !t1.charged && t1.state === 'CANCELLED' && rep.fixes.r2Cleared >= 1)
      check('R1 亏损分支：翻案的号 charged=true、chargeSource=RECON、assumed 清掉', t2.charged && t2.chargeSource === 'RECON' && !t2.assumed, `${t2.charged} ${t2.chargeSource} ${t2.assumed}`)
      check('  …订单仍是已取消（REFUNDED / CANCELLED）、成本利润仍为空、只写 lossCents = realCostCents(实扣, 快照汇率)', s2.state === 'CANCELLED' && s2.costCents == null && s2.profitCents == null && s2.chargedMicro == null && !s2.costFinal && s2.lossCents === expLoss && o2.payStatus === 'REFUNDED' && o2.deliveryStatus === 'CANCELLED', `loss ${s2.lossCents} / ${expLoss}`)
      check('  …退款不动：两格余额与退款额和对账前一样', JSON.stringify(await buckets(u3.id)) === JSON.stringify(before3) && s2.refundTopupCents === s2before.refundTopupCents && s2.refundCashCents === s2before.refundCashCents)
      const evs = await prisma.smsEvent.findMany({ where: { smsOrderId: s2.id, createdAt: { gte: new Date(Date.now() - 5 * MIN) } }, select: { type: true, detail: true } })
      check('  …事件：RECON + LOSS，没有 COST（不跑 T20）', evs.some((e) => e.type === 'RECON') && evs.some((e) => e.type === 'LOSS') && !evs.some((e) => e.type === 'COST'), evs.map((e) => e.type).join(','))
      check('  …报告：R1 不通过、亏损单列出来', !itemOf(rep, 'R1').ok && rep.fixes.r1 >= 1 && rep.fixes.lossOrders.some((x) => x.smsOrderId === s2.id && x.lossCents === expLoss))
      check('  …推一条「接码对账发现不一致」（带亏损）', (await pushes('接码对账发现不一致')) === 1 && bodies.some((b) => b.includes('接码对账发现不一致') && b.includes('只记亏损')))
      check('  …报告写进 settings.sms_reconcile_last', (await recon.lastJiemaReconcile())?.at === rep.at)
      const again = await run()
      const s2b = await soOf(a2.orderId)
      check('再跑一次：R1 / R2 通过、不再修正（幂等）、lossCents 不变', itemOf(again, 'R1').ok && itemOf(again, 'R2').ok && again.fixes.r1 === 0 && again.fixes.r2Cleared === 0 && s2b.lossCents === expLoss)
      check('  …I7：翻案后的亏损与重算一致（不误报）', freshIssues(again, iBase, 'I7').length === 0, freshIssues(again, iBase, 'I7').join('；'))
    }

    // =====================================================================================
    section('R6 冲回 与 R1 成本以上游为准（订单已定稿：costAt 不变）')
    {
      const f1so = await soOf(f1.orderId)
      const f1a = await firstAtt(f1.orderId)
      const m = mock.get(f1a.activationId as string)!
      m.status = 'REFUNDED' // 上游事后把收过码的号退了（站长申诉成功，§7.5）
      const alia = await firstAtt(aliF.orderId)
      const ma = mock.get(alia.activationId as string)!
      ma.costMicro = (alia.costMicro ?? 0) + 5000 // 上游实扣比我方记的多 $0.005
      const aliSo = await soOf(aliF.orderId)
      const rep = await run()
      const f1b = await soOf(f1.orderId)
      const f1ab = await firstAtt(f1.orderId)
      check('R6：upstreamRefundMicro = 这个号的扣费、扣费 0、成本 0、利润 = 售价', f1ab.upstreamRefundMicro === f1a.costMicro && f1b.chargedMicro === 0 && f1b.costCents === 0 && f1b.profitCents === f1so.priceCents, `${f1ab.upstreamRefundMicro} ${f1b.chargedMicro} ${f1b.costCents} ${f1b.profitCents}`)
      check('  …仍是已定稿、costAt 不变（已定稿的不改 costAt）', f1b.costFinal && f1b.costAt?.getTime() === f1so.costAt?.getTime())
      check('  …报告 R6 不通过（已冲回 1 条）', !itemOf(rep, 'R6').ok && rep.fixes.r6 === 1)
      const alib = await soOf(aliF.orderId)
      const aliab = await firstAtt(aliF.orderId)
      const newCost = realCostCents((alia.costMicro ?? 0) + 5000, aliSo.costFx4)
      check('R1：成本以上游为准（+ $0.005）→ 重算成本利润', aliab.costMicro === (alia.costMicro ?? 0) + 5000 && alib.costCents === newCost && alib.profitCents === aliSo.priceCents - newCost && alib.costFinal && alib.costAt?.getTime() === aliSo.costAt?.getTime(), `${aliab.costMicro} ${alib.costCents}/${newCost}`)
      const ev = await prisma.smsEvent.findFirst({ where: { smsOrderId: alib.id, type: 'COST' }, orderBy: { id: 'desc' } })
      check('  …记 COST 事件（why = RECON:R1）', !!ev?.detail?.includes('RECON:R1'))
      const today = rep.r5.find((d) => d.rows > 0)
      check('R5 用修正后的值：当天仍然「上游实扣 = 我方扣费」', !!today && rep.r5.every((d) => d.ok), JSON.stringify(rep.r5))
      const again = await run()
      check('再跑一次：R1 / R6 通过、不再修正', itemOf(again, 'R1').ok && itemOf(again, 'R6').ok && again.fixes.r1 === 0 && again.fixes.r6 === 0)
    }

    // =====================================================================================
    section('S4 评审修复：认不出的币种不当美元；订单退款中时不修正；后台手动对账的修正带操作人与前后值')
    {
      // ① history 里 currency="RUB"、cost 25.5：原来 toInt("RUB") = null → 当成美元，R1 把成本改成 $25.5、T20 重算出巨额亏损
      const alia = await firstAtt(aliF.orderId)
      const ma = mock.get(alia.activationId as string)! as unknown as { currency: unknown; costMicro: number }
      const saveCur = ma.currency
      const saveCost = ma.costMicro
      ma.currency = 'RUB'
      ma.costMicro = 25_500_000
      const aliSo = await soOf(aliF.orderId)
      const rep = await run()
      const aliab = await firstAtt(aliF.orderId)
      const alib = await soOf(aliF.orderId)
      check('history 里 currency="RUB"、cost 25.5 → 不当成 $25.5 改成本（尝试成本、订单成本利润都不变）', rep.upstream.ok && rep.fixes.r1 === 0 && aliab.costMicro === alia.costMicro && alib.costCents === aliSo.costCents && alib.profitCents === aliSo.profitCents, `${aliab.costMicro} ${alib.costCents}`)
      check('  …R0 注明有币种不是美元的行（E56）、R1 / R5 通过', !!itemOf(rep, 'R0').note?.includes('E56') && rep.upstream.currency === true && itemOf(rep, 'R1').ok && itemOf(rep, 'R5').ok, JSON.stringify(itemOf(rep, 'R0')))
      ma.currency = saveCur
      ma.costMicro = saveCost
    }
    {
      // ② 订单退款中（T15 在锁接码单行之前读尝试）：上游说扣了也不在这时修正，下一次再核
      const s1 = await soOf(a1.orderId)
      const m1 = mock.get(a1act)!
      const saveSt = m1.status
      m1.status = 'FINISHED'
      await prisma.smsOrder.update({ where: { id: s1.id }, data: { state: 'REFUNDING' } })
      const rep = await run()
      const t1b = await firstAtt(a1.orderId)
      const s1b = await soOf(a1.orderId)
      check('订单 REFUNDING 时 history 说扣了 → 这次不修正（尝试仍没计扣费、没写亏损）、R0 注明还在推进中、R1 不报', !t1b.charged && s1b.lossCents === s1.lossCents && rep.fixes.r1 === 0 && itemOf(rep, 'R1').ok && !!itemOf(rep, 'R0').note?.includes('还在推进中'), JSON.stringify(itemOf(rep, 'R0')))
      await prisma.smsOrder.update({ where: { id: s1.id }, data: { state: 'CANCELLED' } })
      m1.status = saveSt
    }
    {
      // ③ 后台「立即对账」做的修正：RECON 事件 actor=ADMIN、actorId；带修正前后的成本（日报按修正发生的那天汇总）
      const alia = await firstAtt(aliF.orderId)
      const ma = mock.get(alia.activationId as string)!
      ma.costMicro = (alia.costMicro ?? 0) + 3000 // 上游实扣再多 $0.003（之后不改回：我方已按上游修正）
      const aliSo = await soOf(aliF.orderId)
      const p = await callRoute(routeAdmin.POST, { ...asAdmin, method: 'POST', path: '/api/admin/jiema/reconcile', body: {} })
      const ev = await prisma.smsEvent.findFirst({ where: { smsOrderId: aliSo.id, type: 'RECON' }, orderBy: { id: 'desc' } })
      check('后台手动对账的 R1 修正：RECON 事件 actor=ADMIN、actorId = 管理员', p.status === 200 && p.json?.data?.report?.fixes?.r1 === 1 && ev?.actor === 'ADMIN' && ev.actorId === admin.id, `${p.status} ${JSON.stringify(p.json?.data?.report?.fixes)} ${ev?.actor} ${ev?.actorId}`)
      const det = JSON.parse(ev?.detail ?? '{}') as { before?: { costCents: number | null }; after?: { costCents: number | null } }
      const alib = await soOf(aliF.orderId)
      check('  …事件带修正前后的成本（before = 修正前、after = 修正后）', det.before?.costCents === aliSo.costCents && det.after?.costCents === alib.costCents && alib.costCents !== aliSo.costCents, JSON.stringify(det))
      const au = await prisma.auditEvent.findFirst({ where: { actorUserId: admin.id, action: 'jiema.reconcile' }, orderBy: { id: 'desc' } })
      check('  …写审计（结果 OK、带修正条数）', !!au && au.result === 'OK' && JSON.stringify(au.diff).includes('"r1":1'))
    }

    // =====================================================================================
    section('第 28 条 未关联激活：外部激活推一次、旧链路遗留只列出、旧表里的算本站；都不取消；history 里新出现的 R3 报一次')
    {
      const lsv = new Set((await prisma.product.findMany({ where: { deliveryType: 'SMS', smsService: { not: null } }, select: { smsService: true } })).map((p) => (p.smsService ?? '').toLowerCase()))
      const extSvc = ['tg', 'ig'].filter((s) => !lsv.has(s))
      check('前置：tg、ig 不是旧单品卖的服务（开发库）', extSvc.length === 2, Array.from(lsv).join(','))
      const cat = await prisma.category.create({ data: { name: `ITEST-S4-legacy-${uuid().slice(0, 6)}`, sortOrder: 99, status: 0 } })
      legacyIds.categoryId = cat.id
      const lp = await prisma.product.create({ data: { categoryId: cat.id, name: 'ITEST-S4 旧单品 WhatsApp', price: '9.00', stock: -1, status: 0, deliveryType: 'SMS', smsService: 'wa', smsCountry: '6' } })
      legacyIds.productId = lp.id
      const lu = await mkUser('legacy', 'USER')
      const mkLegacyOrder = async (paidAt: Date) => {
        const o = await prisma.order.create({ data: { orderNo: `L${Date.now()}${Math.floor(Math.random() * 1000)}`, userId: lu.id, productId: lp.id, productName: 'ITEST-S4 旧单品 WhatsApp', productPrice: 9, amount: 9, payStatus: 'PAID', paidAt } })
        legacyIds.orderIds.push(o.id)
        return o
      }
      await mkLegacyOrder(new Date(runtime.jnow().getTime() - 5 * MIN))
      const [legacyAct] = mock.buy({ service: 'wa', country: 6 }) // 旧单品付款后 5 分钟内出现的同服务激活 → 旧链路遗留
      const [extAct] = mock.buy({ service: 'tg', country: 48 }) // 外部激活（站长手动买的）
      const [knownAct] = mock.buy({ service: 'wa', country: 6 }) // 旧表 sms_activations 里有 → 本站
      const lo2 = await mkLegacyOrder(new Date(runtime.jnow().getTime() - 2 * MIN))
      await prisma.smsActivation.create({ data: { orderId: lo2.id, activationId: knownAct.id, phone: knownAct.phone, service: 'wa', country: '6', status: 'WAITING', expireAt: new Date(Date.now() + 20 * MIN) } })
      legacyIds.activationIds.push(knownAct.id)
      bodies.length = 0
      runtime.rt().externalAlerted.clear()
      alert.resetSmsAlertThrottleForTest()
      const snap = await unlinked.scanUnlinked(runtime.jnow())
      const extIds = snap.external.map((x) => x.id)
      const legIds = snap.legacy.map((x) => x.id)
      check('实时监控：外部激活 1 个（tg · 48）、旧链路遗留 1 个（wa · 6）、旧表里的不算', snap.ok && extIds.includes(extAct.id) && legIds.includes(legacyAct.id) && !extIds.includes(knownAct.id) && !legIds.includes(knownAct.id) && snap.externalCount === 1 && snap.legacyCount === 1, JSON.stringify({ extIds, legIds }))
      check('  …外部激活推一次企业微信、旧链路遗留不推', (await pushes(extAct.id)) === 1 && (await pushes(legacyAct.id)) === 0)
      check('  …都没有被取消（假上游里仍是进行中）', mock.get(extAct.id)?.status === 'ACTIVE' && mock.get(legacyAct.id)?.status === 'ACTIVE' && !mock.log.some((l) => l.path.includes(extAct.id)))
      const snap2 = await unlinked.scanUnlinked(runtime.jnow())
      check('  …再扫一次不重复推', snap2.externalCount === 1 && (await pushes(extAct.id)) === 1)
      check('  …快照写进 settings.sms_unlinked_last', (await unlinked.lastUnlinked())?.externalCount === 1)
      const ov = await callRoute(routeOverview.GET, { ...asAdmin, path: '/api/admin/jiema/overview' })
      check('后台概览 s4：未关联激活（外部 1 · 旧链路遗留 1）与最近一次对账的摘要', ov.status === 200 && ov.json?.data?.s4?.unlinked?.externalCount === 1 && ov.json.data.s4.unlinked.legacyCount === 1 && !!ov.json.data.s4.recon, JSON.stringify(ov.json?.data?.s4))
      // 结束它们：外部 / 遗留没收码（8），旧表里的收了码（6，旧链路扣费）；另买一个外部激活、实时监控还没扫到就结束了（R3 新出现）
      mock.endActivation(extAct.id, 8)
      mock.endActivation(legacyAct.id, 8)
      mock.pushSms(knownAct.id, { code: '303030' })
      mock.endActivation(knownAct.id, 6)
      const [ext2] = mock.buy({ service: 'ig', country: 6 })
      mock.pushSms(ext2.id, { code: '404040' })
      mock.endActivation(ext2.id, 6)
      adv(60) // history 的 to 按秒截断：刚在这一秒创建的激活要等下一秒才查得到
      bodies.length = 0
      const rep = await run({ alert: true, save: true })
      const r3 = itemOf(rep, 'R3')
      check('R3：history 里新出现的外部激活（ig，实时监控没见过）报 1 个；实时监控推过的 tg 不重复报', !r3.ok && r3.count === 1 && r3.samples[0].includes(ext2.id) && rep.unlinked.externalCount === 2 && rep.unlinked.external.some((x) => x.id === extAct.id), JSON.stringify(r3))
      check('  …旧链路遗留（wa）只列出；旧表里的（knownAct）不在未关联清单', rep.unlinked.legacy.some((x) => x.id === legacyAct.id) && !rep.unlinked.external.some((x) => x.id === knownAct.id) && !rep.unlinked.legacy.some((x) => x.id === knownAct.id))
      const d = rep.r5.find((x) => x.legacyRows > 0)
      check('R5：旧链路一列 = 旧表里那个号的实扣 $0.21（只列出）；外部一列 = ig 的 $0.0334', !!d && d.legacyMicro === 210_000 && rep.r5.some((x) => x.externalMicro === 33_400 && x.externalRows === 1) && rep.r5.every((x) => x.ok), JSON.stringify(rep.r5))
      check('  …推送「接码对账发现不一致」里带 R3', (await pushes('接码对账发现不一致')) === 1 && bodies.some((b) => b.includes('R3')))
      const again = await run({ save: true })
      check('再跑一次：R3 不再报（上一次报告里已有）', itemOf(again, 'R3').ok && again.unlinked.externalCount === 2)
    }

    // =====================================================================================
    section('S4 评审修复：上游 history 拉取失败（R0）时保留上一次的未关联激活清单，进程重启后也不把报过的外部激活当新的再报')
    {
      const before = await recon.lastJiemaReconcile()
      check('前置：上一次报告里有 2 个外部激活（id 清单也存了）', before?.unlinked.externalCount === 2 && (before.unlinked.externalIds ?? []).length === 2, JSON.stringify(before?.unlinked).slice(0, 300))
      mock.setFaults([{ action: 'v1:history', kind: 'http500', times: 0 }])
      const failRep = await run({ save: true })
      mock.clearFaults()
      up.resetUpstreamStateForTest()
      const saved = await recon.lastJiemaReconcile()
      check('R0 失败：报告 upstream.ok=false、R0 不通过，存下的未关联激活清单沿用上一次（外部 2 个、清单与 id 都在）', !failRep.upstream.ok && !itemOf(failRep, 'R0').ok && saved?.at === failRep.at && saved.unlinked.externalCount === 2 && saved.unlinked.external.length === 2 && (saved.unlinked.externalIds ?? []).length === 2, JSON.stringify(saved?.unlinked).slice(0, 300))
      runtime.rt().externalAlerted.clear() // 模拟进程重启：去重只能靠存下的报告
      bodies.length = 0
      const again = await run({ save: true, alert: true })
      check('上游恢复后再跑（进程重启过）：R3 不把上一次报过的外部激活当新的再报、不推送', itemOf(again, 'R3').ok && again.unlinked.externalCount === 2 && (await pushes('接码对账发现不一致')) === 0, JSON.stringify(itemOf(again, 'R3')))
    }

    // =====================================================================================
    section('R4：我方计了扣费的号在上游 history 里找不到')
    {
      const alia = await firstAtt(aliF.orderId)
      const acts = mock.activations as unknown as Array<{ id: string }>
      const idx = acts.findIndex((x) => x.id === alia.activationId)
      const [removed] = acts.splice(idx, 1)
      const rep = await run()
      const r4 = itemOf(rep, 'R4')
      check('R4 报出这个号（计了扣费、已结束 ≥10 分钟、上游 history 没有）', !r4.ok && r4.samples.some((s) => s.includes(alia.activationId as string)), JSON.stringify(r4))
      check('  …R5 当天我方扣费 > 上游实扣 → 不通过', !itemOf(rep, 'R5').ok)
      acts.splice(idx, 0, removed as never)
      const back = await run()
      check('号回到 history → R4 / R5 通过', itemOf(back, 'R4').ok && itemOf(back, 'R5').ok)
    }

    // =====================================================================================
    section('§11 S4 验收 ②：注入的不一致都能被发现（改一条流水金额、卡住的预扣、多一行 BALANCE 支付流水、I4、I8）')
    const now = () => runtime.jnow()
    {
      // 改一条流水金额：取消单 c1 的 refund 流水充值格 +1 分
      const lg = await prisma.balanceLog.findFirstOrThrow({ where: { bizKey: `refund:${c1.orderId}` } })
      await prisma.balanceLog.update({ where: { id: lg.id }, data: { topupDeltaCents: lg.topupDeltaCents + 1 } })
      const ri = await run({ upstream: false })
      check('改一条 refund 流水金额 → I2 报出（流水两格 ≠ 接码单记的退回额 / 合计 ≠ 余额部分 + 支付宝实收）', freshIssues(ri, iBase, 'I2').some((s) => s.includes(`订单 #${c1.orderId}`)), freshIssues(ri, iBase, 'I2').join('；'))
      const rw = await wrec.runWalletReconcile({ full: true, alert: false, save: false, now: now() })
      check('  …W1（用户两格 ≠ 流水之和）、W8（全站）也报出', freshIssues(rw, wBase, 'W1').some((s) => s.includes(`用户#${u1.id}`)) && freshIssues(rw, wBase, 'W8').length > 0)
      await prisma.balanceLog.update({ where: { id: lg.id }, data: { topupDeltaCents: lg.topupDeltaCents } })
    }
    {
      // 卡住的预扣：组合单待支付（余额只够 ¥0.20）→ 预扣 HELD；把 heldAt 拨回 2 小时
      const u4 = await mkUser('u4')
      await fund(u4.id, 20, 0)
      const mix = await place(u4, 'ot', 6, { payWith: 'BALANCE', expectBalance: 20 })
      const h = await prisma.balanceHold.findUniqueOrThrow({ where: { orderId: mix.orderId } })
      check('前置：组合单待支付、预扣 HELD ¥0.20', h.state === 'HELD' && h.topupCents + h.cashCents === 20 && (await soOf(mix.orderId)).payMode === 'MIXED')
      await prisma.balanceHold.update({ where: { id: h.id }, data: { heldAt: new Date(now().getTime() - 2 * H) } })
      const rw = await wrec.runWalletReconcile({ alert: false, save: false, now: now() })
      check('卡住的预扣 → W5 报出（已持续 120 分钟）', freshIssues(rw, wBase, 'W5').some((s) => s.includes(`订单 #${mix.orderId}`) && s.includes('卡住')), freshIssues(rw, wBase, 'W5').join('；'))
      bodies.length = 0
      monitor.resetHeldAlertThrottleForTest()
      check('实时监控 checkStuckHolds → 1 条、推 wallet.alert「预扣卡住」', (await monitor.checkStuckHolds(now())) === 1 && (await pushes('预扣卡住')) === 1)
      await monitor.checkStuckHolds(now())
      check('  …30 分钟内不重复推', (await pushes('预扣卡住')) === 1)
      const ri = await run({ upstream: false })
      check('  …I3 不误报（待支付的组合单预扣本来就该是 HELD）', freshIssues(ri, iBase, 'I3').length === 0, freshIssues(ri, iBase, 'I3').join('；'))
      const so = await soOf(mix.orderId)
      await engine.buyerClose(so, so.version)
      const rw2 = await wrec.runWalletReconcile({ alert: false, save: false, now: now() })
      check('关单退回预扣 → W5 恢复', freshIssues(rw2, wBase, 'W5').length === 0 && (await prisma.balanceHold.findUniqueOrThrow({ where: { orderId: mix.orderId } })).state === 'RELEASED')
    }
    {
      // 载体单多一行 BALANCE 支付流水（没有预扣）→ W4 反向
      const bogus = await prisma.payment.create({ data: { orderId: aliF.orderId, payMethod: 'BALANCE', amount: '0.10', status: 1 } })
      const rw = await wrec.runWalletReconcile({ alert: false, save: false, now: now() })
      check('支付宝全额的接码单多一行 BALANCE 支付流水 → W4 反向报出（没有已确认的预扣）', freshIssues(rw, wBase, 'W4').some((s) => s.includes(`#${bogus.id}`)), freshIssues(rw, wBase, 'W4').join('；'))
      await prisma.payment.delete({ where: { id: bogus.id } })
      const rw2 = await wrec.runWalletReconcile({ alert: false, save: false, now: now() })
      check('  …删掉后 W4 恢复', freshIssues(rw2, wBase, 'W4').length === 0)
    }
    {
      // I4：一张等码单的号被改成「已过有效期末 100 分钟」
      const u5 = await mkUser('u5')
      await fund(u5.id, 1000, 0)
      const w = await waiting(u5)
      const a = await firstAtt(w.orderId)
      await prisma.smsAttempt.update({ where: { id: a.id }, data: { endsAt: new Date(now().getTime() - 100 * MIN) } })
      const ri = await run({ upstream: false })
      check('I4：ACTIVE 的号过了有效期末 100 分钟 → 报出', freshIssues(ri, iBase, 'I4').some((s) => s.includes(`尝试 #${a.id}`)))
      await prisma.smsAttempt.update({ where: { id: a.id }, data: { endsAt: a.endsAt } })
      // I8：已完成的单被改成「没定稿」→ 对账补算
      await prisma.smsOrder.update({ where: { orderId: f1.orderId }, data: { costFinal: false } })
      const ri2 = await run({ upstream: false })
      const f1b = await soOf(f1.orderId)
      check('I8：已完成、号码全部终态超过 10 分钟仍没定稿 → 报出并补算（costFinal=true）', freshIssues(ri2, iBase, 'I8').some((s) => s.includes(`订单 #${f1.orderId}`)) && ri2.fixes.i8 === 1 && f1b.costFinal)
      const ri3 = await run({ upstream: false })
      check('  …再跑一次 I8 通过', freshIssues(ri3, iBase, 'I8').length === 0 && ri3.fixes.i8 === 0)
      // 收尾：这张等码单按正常路径跑完
      adv(21 * 60)
      await tick(2)
    }

    // =====================================================================================
    section('日报（§7.7、§9.5）：cron 那一趟生成「昨天」的日报，北京 09:00 推一次；知会（支付宝付款后取消退回 > ¥50）')
    {
      // 知会：把一张已取消单的「支付宝实收」临时改成 ¥60（只为造出知会；之后恢复）。知会按「现在」往前 24 小时算
      const c1so = await soOf(c1.orderId)
      await prisma.smsOrder.update({ where: { id: c1so.id }, data: { alipayPaidCents: 6000 } })
      bodies.length = 0
      const repN = (await recon.runJiemaReconcile({ upstream: false, alert: false, save: false, daily: true }))!
      check('知会：该用户近 24 小时「支付宝付款后取消、退回充值余额」合计 ¥60.00（只标记、不限制）', repN.notices.some((n) => n.includes(`用户 #${u1.id}`) && n.includes('¥60.00')), JSON.stringify(repN.notices))
      check('  …进了日报的「知会」行', !!(await recon.lastDaily())?.lines.some((l) => l.startsWith('知会：') && l.includes('¥60.00')))
      {
        // §10.1「在后台用户页和订单列表上标出来」（S4 评审修复：原来只进了日报）
        const lo = await callRoute(routeOrders.GET, { ...asAdmin, path: `/api/admin/jiema/orders?user=${u1.id}&pageSize=100` })
        const row = (lo.json?.data?.list ?? []).find((r: { orderId: number }) => r.orderId === c1.orderId) as { user?: { flag?: string | null } } | undefined
        check('后台接码订单列表：该用户的行带可疑用户标记（支付宝付款后取消 ¥60.00）', lo.status === 200 && !!row?.user?.flag?.includes('支付宝付款后取消 ¥60.00'), JSON.stringify(row?.user))
        const lu = await callRoute(routeUsers.GET, { ...asAdmin, path: `/api/admin/users?keyword=${encodeURIComponent(u1.email ?? String(u1.id))}` })
        const urow = (lu.json?.data?.list ?? []).find((x: { id: number }) => x.id === u1.id) as { jiemaFlag?: string | null } | undefined
        check('后台用户列表：该用户带接码可疑用户标记', lu.status === 200 && !!urow?.jiemaFlag?.includes('¥60.00'), JSON.stringify(urow?.jiemaFlag))
        const other = (lu.json?.data?.list ?? []).filter((x: { id: number; jiemaFlag?: string | null }) => x.id !== u1.id && x.jiemaFlag)
        check('  …没到标记线的用户没有标记', other.length === 0, JSON.stringify(other).slice(0, 200))
      }
      await prisma.smsOrder.update({ where: { id: c1so.id }, data: { alipayPaidCents: c1so.alipayPaidCents } })
      {
        const lo = await callRoute(routeOrders.GET, { ...asAdmin, path: `/api/admin/jiema/orders?user=${u1.id}&pageSize=100` })
        const row = (lo.json?.data?.list ?? []).find((r: { orderId: number }) => r.orderId === c1.orderId) as { user?: { flag?: string | null } } | undefined
        check('  …恢复之后标记消失', !!row && !row.user?.flag, JSON.stringify(row?.user))
      }
      bodies.length = 0
      await recon.runJiemaReconcile({ upstream: false, alert: true, save: false, daily: true })
      check('  …恢复之后不再知会', (await pushes('接码支付宝付款后取消退回余额（知会）')) === 0)
      await prisma.smsOrder.update({ where: { id: c1so.id }, data: { alipayPaidCents: 6000 } })
      bodies.length = 0
      await recon.runJiemaReconcile({ upstream: false, alert: true, save: false, daily: true })
      check('  …cron 那一趟推一条 wallet.alert 知会', (await pushes('接码支付宝付款后取消退回余额（知会）')) === 1)
      await prisma.smsOrder.update({ where: { id: c1so.id }, data: { alipayPaidCents: c1so.alipayPaidCents } })

      // 「明天」北京 03:20 跑 → 日报是今天（付款时刻 paidAt 是真实时钟写的，按真实时钟取「今天」）
      const genAt = new Date(rules.bjDayStart(new Date()).getTime() + 24 * H + 200 * MIN)
      bodies.length = 0
      await prisma.setting.deleteMany({ where: { key: recon.SMS_DAILY_KEY } })
      await recon.runJiemaReconcile({ upstream: false, alert: false, save: false, daily: true, now: genAt })
      const d = await recon.lastDaily()
      const day = rules.bjDate(new Date(genAt.getTime() - 24 * H))
      check('生成了昨天的日报：待推、标题「MM-DD 接码日报」、付款 / 完成 / 已取消 / 售后 / 异常各一行、不出现乘号', !!d && d.day === day && d.sentAt === null && d.lines[0] === `${day.slice(5)} 接码日报` && d.lines.length >= 6 && d.lines.every((l) => !l.includes('×')), JSON.stringify(d?.lines))
      {
        // 当天对账写下的修正（R6 冲回 f1、R1 翻案 a2 的亏损、R1 成本 aliF）按修正发生的那天单列（§9.5「上游事后退款冲回」）
        const rl = d?.lines.find((l) => l.startsWith('对账修正'))
        const f1so = await soOf(f1.orderId)
        const f1a = await firstAtt(f1.orderId)
        const back = realCostCents(f1a.upstreamRefundMicro ?? 0, f1so.costFx4)
        check('  …日报单列「对账修正」：R6 1 条、冲回 = 那个号的成本、亏损 +（翻案的已取消单）', !!rl && rl.includes('R6 1') && rl.includes(`上游事后退款冲回 ¥${(back / 100).toFixed(2)}`) && /亏损 \+¥/.test(rl), rl)
      }
      {
        const start = new Date(genAt.getTime() - 200 * MIN - 24 * H)
        const end = new Date(start.getTime() + 24 * H)
        const paidN = await prisma.smsOrder.count({ where: { paidAt: { gte: start, lt: end } } })
        const cancN = await prisma.smsOrder.count({ where: { state: 'CANCELLED', refundedAt: { gte: start, lt: end } } })
        check('  …当天的单进了日报（付款单数、已取消单数与库里按北京日子数的一致；付款 ≥ 1）', !!d && paidN >= 1 && d.lines[1].startsWith(`付款 ${paidN} 单`) && d.lines[3].startsWith(`已取消 ${cancN} 单`), `${paidN} ${cancN} ${JSON.stringify(d?.lines)}`)
      }
      const bj = (s: string) => new Date(`${s}+08:00`)
      const next = new Date(Date.parse(`${day}T00:00:00Z`) + 86400_000).toISOString().slice(0, 10)
      check('次日 08:59 → 不推（WAIT）', (await recon.maybeSendDaily(bj(`${next}T08:59:00`))) === 'WAIT' && (await pushes('接码日报')) === 0)
      check('次日 09:00 → 推一次 sms.daily（SEND）', (await recon.maybeSendDaily(bj(`${next}T09:00:05`))) === 'SEND' && (await pushes('接码日报')) === 1 && bodies.some((b) => b.includes(`${day.slice(5)} 接码日报`)))
      check('  …再调 → DONE，不重复推', (await recon.maybeSendDaily(bj(`${next}T09:01:00`))) === 'DONE' && (await pushes('接码日报')) === 1)
      await recon.runJiemaReconcile({ upstream: false, alert: false, save: false, daily: true, now: genAt })
      check('同一天再跑一次 cron 对账 → 已推的日报不重新排队', !!(await recon.lastDaily())?.sentAt && (await recon.maybeSendDaily(bj(`${next}T10:00:00`))) === 'DONE' && (await pushes('接码日报')) === 1)
      const stale = { day: '2026-01-01', lines: ['01-01 接码日报', 'x'], createdAt: new Date().toISOString(), sentAt: null, skipped: null }
      await prisma.setting.update({ where: { key: recon.SMS_DAILY_KEY }, data: { value: JSON.stringify(stale) } })
      check('过期的日报（tick 停了一整天以上）→ STALE、不推、标记跳过', (await recon.maybeSendDaily(runtime.jnow())) === 'STALE' && (await pushes('01-01 接码日报')) === 0 && !!(await recon.lastDaily())?.skipped)
    }

    // =====================================================================================
    section('cron 路由 / 后台接口 / jiema-tick 入口（§6.6 第 34 条、§7）')
    {
      const noAuth = await callRoute(routeCron.GET, { host: MAIN, path: '/api/cron/jiema-reconcile' })
      check('cron：没有密钥 → 拒绝', noAuth.status >= 400)
      const okRes = await callRoute(routeCron.GET, { host: MAIN, path: '/api/cron/jiema-reconcile', headers: { 'x-cron-secret': process.env.CRON_SECRET as string } })
      check('cron：有密钥 → 200、回摘要（不回金额明细）、上游拉到了', okRes.status === 200 && okRes.json?.data?.upstreamOk === true && typeof okRes.json?.data?.orders === 'number' && !okRes.text.includes('Micro'), okRes.text.slice(0, 300))
      check('  …顺带生成了日报', !!(await recon.lastDaily()) && (await recon.lastDaily())!.day !== '2026-01-01')
      recon.setReconLockTimingForTest({ cronWaitMs: 300, pollMs: 50 })
      const tok = await lock.acquireLock('jiema:reconcile', 60_000)
      bodies.length = 0
      await prisma.setting.deleteMany({ where: { key: recon.SMS_DAILY_KEY } })
      const t0 = Date.now()
      const busy = await callRoute(routeCron.GET, { host: MAIN, path: '/api/cron/jiema-reconcile', headers: { 'x-cron-secret': process.env.CRON_SECRET as string } })
      check('同一时刻只跑一趟：锁被占（cron 先等了一会儿，还是被占）→ busy', busy.status === 200 && busy.json?.data?.busy === true && Date.now() - t0 >= 250)
      check('  …推「接码定时对账没有执行」、日报照样生成（不因为锁被占丢掉一天）', (await pushes('接码定时对账没有执行')) === 1 && !!(await recon.lastDaily()))
      const t1 = Date.now()
      const adminBusy = await callRoute(routeAdmin.POST, { ...asAdmin, method: 'POST', path: '/api/admin/jiema/reconcile', body: {} })
      check('  …后台手动对账 → 409（不等）', adminBusy.status === 409 && Date.now() - t1 < 250)
      recon.setReconLockTimingForTest({ cronWaitMs: 10_000, pollMs: 50 })
      const rel = setTimeout(() => void (tok ? lock.releaseLock('jiema:reconcile', tok) : undefined), 200)
      const waited = await callRoute(routeCron.GET, { host: MAIN, path: '/api/cron/jiema-reconcile', headers: { 'x-cron-secret': process.env.CRON_SECRET as string } })
      clearTimeout(rel)
      check('锁在等待期间放开 → cron 等到锁、照常对账（不是 busy）', waited.status === 200 && waited.json?.data?.busy !== true && typeof waited.json?.data?.orders === 'number', waited.text.slice(0, 200))
      if (tok) await lock.releaseLock('jiema:reconcile', tok)
      recon.setReconLockTimingForTest(null)

      const g = await callRoute(routeAdmin.GET, { ...asAdmin, path: '/api/admin/jiema/reconcile' })
      check('后台 GET：报告、未关联激活快照、日报', g.status === 200 && !!g.json?.data?.report && !!g.json?.data?.unlinked && !!g.json?.data?.daily)
      const plain = await mkUser('plain', 'USER')
      const g403 = await callRoute(routeAdmin.GET, { host: MAIN, token: plain.token, path: '/api/admin/jiema/reconcile' })
      check('普通用户 → 403', g403.status === 403)
      const lulu = await createTenant('l')
      const gch = await callRoute(routeAdmin.GET, { host: lulu.host, token: admin.token, path: '/api/admin/jiema/reconcile' })
      check('渠道 Host → 404', gch.status === 404)
      const p = await callRoute(routeAdmin.POST, { ...asAdmin, method: 'POST', path: '/api/admin/jiema/reconcile', body: { full: true } })
      check('后台 POST {full:true} → 200、I 系列全量、R 系列照跑', p.status === 200 && p.json?.data?.report?.full === true && p.json.data.report.items.some((i: { code: string }) => i.code === 'R0'))
      const au = await prisma.auditEvent.findFirst({ where: { actorUserId: admin.id, action: 'jiema.reconcile' }, orderBy: { id: 'desc' } })
      check('  …写审计 jiema.reconcile', !!au)

      // jiema-tick 的 cron 入口每趟带上 S4 监控（未关联激活每 10 分钟、卡住的预扣、到点推日报）
      delete runtime.rt().periodic.unlinked
      delete runtime.rt().periodic.heldStuck
      const t = runtime.jnow().getTime()
      runtime.rt().periodic.localSuccess = t
      runtime.rt().periodic.upstreamStats = t
      await prisma.setting.deleteMany({ where: { key: unlinked.UNLINKED_KEY } })
      const st = await engine.runTick({ budgetMs: 1, intervalMs: 1 })
      check('runTick 跑一轮，并做了未关联激活扫描（快照重新写入）与卡住预扣检查', st.ran && st.rounds === 1 && runtime.rt().periodic.unlinked != null && runtime.rt().periodic.heldStuck != null && !!(await unlinked.lastUnlinked()))
    }

    // =====================================================================================
    section('S4 评审修复：对账锁续租；锁丢了这一趟中止、不存报告、推告警')
    {
      recon.setReconLockTimingForTest({ renewMs: 40 })
      mock.setFaults([{ action: 'v1:history', kind: 'hang', delayMs: 700 }])
      const before = await recon.lastJiemaReconcile()
      bodies.length = 0
      const pr = recon.runJiemaReconcile({ save: true, alert: true })
      await sleep(100)
      const l1 = await prisma.vmqLock.findUnique({ where: { lockKey: 'mkt:jiema:reconcile' } })
      await sleep(250)
      const l2 = await prisma.vmqLock.findUnique({ where: { lockKey: 'mkt:jiema:reconcile' } })
      check('跑着的时候锁在续租（createdAt 往前走，不会过了 TTL 被当成陈旧锁接管）', !!l1 && !!l2 && l2.orderId === l1.orderId && l2.createdAt.getTime() > l1.createdAt.getTime(), `${l1?.createdAt.toISOString()} ${l2?.createdAt.toISOString()}`)
      await prisma.vmqLock.deleteMany({ where: { lockKey: 'mkt:jiema:reconcile' } }) // 模拟锁丢失 / 被接管
      const rep = await pr
      mock.clearFaults()
      recon.setReconLockTimingForTest(null)
      check('锁丢了 → 这一趟中止：报告是「执行失败」（ERR、带原因）、没有存（sms_reconcile_last 还是上一次的）', !!rep && !rep.ok && !!rep.error?.includes('锁') && !!itemOf(rep, 'ERR') && (await recon.lastJiemaReconcile())?.at === before?.at, rep?.error)
      check('  …推一条「接码对账执行失败」', (await pushes('接码对账执行失败')) === 1)
    }

    // =====================================================================================
    section('S4 评审修复：对账整趟出错 → 存「执行失败」报告（沿用上一次的未关联激活清单）、推告警、cron 照样排日报；后台出错也写审计')
    {
      const prevRep = await recon.lastJiemaReconcile()
      recon.setReconFaultForTest((st) => {
        if (st === 'R') throw new Error('itest 注入：R 系列之后库挂了')
      })
      bodies.length = 0
      await prisma.setting.deleteMany({ where: { key: recon.SMS_DAILY_KEY } })
      const cr = await callRoute(routeCron.GET, { host: MAIN, path: '/api/cron/jiema-reconcile', headers: { 'x-cron-secret': process.env.CRON_SECRET as string } })
      const saved = await recon.lastJiemaReconcile()
      check('cron 那一趟出错：仍回 200（failed 里有 ERR）、报告存成「执行失败」、未关联激活清单沿用上一次', cr.status === 200 && (cr.json?.data?.failed ?? []).some((f: { code: string }) => f.code === 'ERR') && !!saved?.error?.includes('itest 注入') && !saved.ok && saved.unlinked.externalCount === (prevRep?.unlinked.externalCount ?? 0), cr.text.slice(0, 300))
      check('  …推「接码对账执行失败」、日报照样生成', (await pushes('接码对账执行失败')) === 1 && !!(await recon.lastDaily()))
      const ov = await callRoute(routeOverview.GET, { ...asAdmin, path: '/api/admin/jiema/overview' })
      check('  …后台概览的对账摘要是「执行失败」（不再停在上一次的 ✓）', ov.json?.data?.s4?.recon?.error === true && ov.json.data.s4.recon.ok === false, JSON.stringify(ov.json?.data?.s4?.recon))
      const p = await callRoute(routeAdmin.POST, { ...asAdmin, method: 'POST', path: '/api/admin/jiema/reconcile', body: {} })
      const au = await prisma.auditEvent.findFirst({ where: { actorUserId: admin.id, action: 'jiema.reconcile' }, orderBy: { id: 'desc' } })
      check('后台手动对账出错：返回「执行失败」的报告，审计照写（结果 ERROR、带原因）', p.status === 200 && !!p.json?.data?.report?.error && !!au && au.result === 'ERROR' && JSON.stringify(au.diff).includes('itest 注入'), `${p.status} ${au?.result}`)
      recon.setReconFaultForTest(null)
      const ok2 = await run({ save: true })
      check('  …故障撤掉后再跑：报告恢复正常（没有 ERR）', !ok2.error && !ok2.items.some((i) => i.code === 'ERR'))
    }

    // =====================================================================================
    section('S4 评审修复：报告按 utf8 字节量瘦身后再存（settings.value 是 TEXT、库是严格模式）')
    {
      const base = await run({ upstream: false })
      const zh = '接码单尝试上游状态已取消我方计了扣费但是上游历史里找不到这一条需要人工核对一下'
      const huge = {
        ...base,
        at: new Date(Date.now() + 1000).toISOString(),
        items: base.items.map((i) => ({ ...i, ok: false, count: 12, samples: Array.from({ length: 10 }, (_, j) => `${zh.repeat(5)}#${j}`) })),
        notices: Array.from({ length: 60 }, (_, i) => `用户 #${i} 近 24 小时「支付宝付款后取消、退回充值余额」合计 ¥60.00（3 单）`),
        fixes: { ...base.fixes, lossOrders: Array.from({ length: 300 }, (_, i) => ({ smsOrderId: i, orderNo: `SMS20260929000${i}`, lossCents: 476 })) },
      }
      const raw = JSON.stringify(huge)
      check('前置：这份报告字符数 < 60,000、utf8 字节 > 65,535（原来按字符数的判断会放过去）', raw.length < 60_000 && Buffer.byteLength(raw, 'utf8') > 65_535, `${raw.length} 字符 / ${Buffer.byteLength(raw, 'utf8')} 字节`)
      let rawFailed = false
      try {
        await prisma.setting.upsert({ where: { key: 'itest_s4_raw' }, create: { key: 'itest_s4_raw', value: raw }, update: { value: raw } })
      } catch {
        rawFailed = true
      }
      await prisma.setting.deleteMany({ where: { key: 'itest_s4_raw' } })
      check('  …原样写进 settings 确实写不进去（原来的 bug：页面停在上一次的结论）', rawFailed)
      const okSave = await recon.saveReport(huge, { alert: true })
      const got = await recon.lastJiemaReconcile()
      check('saveReport：瘦身后存进去了（truncated ≥ 1）、各项计数与亏损单总数照旧', okSave && got?.at === huge.at && (got.truncated ?? 0) >= 1 && got.items.every((i) => i.count === 12) && got.fixes.lossOrdersTotal === 300 && got.fixes.lossOrders.length <= 20, `${got?.truncated} ${got?.fixes.lossOrdersTotal}`)
      await run({ upstream: false, save: true })
    }

    // =====================================================================================
    section('最后：W、I 系列与开头相比不新增问题（§12.2 第 94 条的对账部分）')
    {
      adv(30 * 60)
      await tick(2)
      const rw = await wrec.runWalletReconcile({ full: true, alert: false, save: false, now: runtime.jnow() })
      for (const code of ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9']) {
        const fresh = freshIssues(rw, wBase, code)
        check(`${code} 没有新增问题`, fresh.length === 0, fresh.join('；').slice(0, 300))
      }
      const ri = await run({ upstream: false, full: true })
      for (const code of ['I1', 'I2', 'I3', 'I4', 'I5', 'I6', 'I7', 'I8']) {
        const fresh = freshIssues(ri, iBase, code)
        check(`${code} 没有新增问题`, fresh.length === 0, fresh.join('；').slice(0, 300))
      }
    }
  } finally {
    const orders = await prisma.order.findMany({ where: { userId: { in: userIds } }, select: { id: true } })
    const oids = orders.map((o) => o.id)
    const sos = await prisma.smsOrder.findMany({ where: { OR: [{ userId: { in: userIds } }, { orderId: { in: oids } }] }, select: { id: true } })
    const soIds = sos.map((s) => s.id)
    const vmqs = await prisma.vmqOrder.findMany({ where: { bizType: 'order', bizId: { in: oids } }, select: { id: true, orderId: true } })
    await prisma.smsComplaint.deleteMany({ where: { OR: [{ userId: { in: userIds } }, { orderId: { in: oids } }] } })
    await prisma.smsMessage.deleteMany({ where: { smsOrderId: { in: soIds } } })
    await prisma.smsEvent.deleteMany({ where: { smsOrderId: { in: soIds } } })
    await prisma.smsAttempt.deleteMany({ where: { smsOrderId: { in: soIds } } })
    await prisma.smsOrder.deleteMany({ where: { id: { in: soIds } } })
    await prisma.smsActivation.deleteMany({ where: { activationId: { in: legacyIds.activationIds } } })
    await prisma.balanceLog.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.balanceHold.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.vmqLock.deleteMany({ where: { orderId: { in: vmqs.map((v) => v.orderId) } } })
    await prisma.vmqOrder.deleteMany({ where: { id: { in: vmqs.map((v) => v.id) } } })
    await prisma.payment.deleteMany({ where: { orderId: { in: oids } } })
    await prisma.orderMessage.deleteMany({ where: { orderId: { in: oids } } })
    await prisma.auditEvent.deleteMany({ where: { actorUserId: { in: userIds } } })
    const fresh = (await prisma.setting.findMany({ where: { key: { startsWith: 'vmq_unmatched:' } }, select: { key: true } })).map((s) => s.key).filter((k) => !unmatchedBefore.has(k))
    await prisma.setting.deleteMany({ where: { key: { in: [...fresh, ...vmqs.map((v) => `vmqrec:${v.id}`), ...vmqs.map((v) => `latepay_auto:${v.orderId}`)] } } })
    await prisma.order.deleteMany({ where: { id: { in: oids } } })
    if (legacyIds.productId) await prisma.product.deleteMany({ where: { id: legacyIds.productId } })
    if (legacyIds.categoryId) await prisma.category.deleteMany({ where: { id: legacyIds.categoryId } })
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
