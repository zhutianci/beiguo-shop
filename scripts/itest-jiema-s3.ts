/**
 * 短信接码 · S3（记录、客服、售后）—— 数据库集成测试（会建数据、会删数据）。docs/短信接码-设计.md E17、§1.4、§1.11、§6.4、§7.5、§8.2、§8.3、§11 S3 验收：
 *
 *   set -a; . ./.env.local; set +a; VMQ_KEY=itest npx tsx scripts/itest-jiema-s3.ts
 *
 * ⚠️ 只能对一次性的本地库跑（库名须含 dev / test）。**不调用真实 hero-sms**：上游一律是本地假服务（scripts/mock-herosms.ts，只绑 127.0.0.1），
 * 企业微信推送打到本地假 webhook。sms_* 目录与停售表、相关 settings 在开始时存档、结束时原样恢复；本测试建的订单、流水、预扣、收款单、售后申请全部删掉。
 *
 * 覆盖：
 *   · GET /api/jiema/orders（我的接码记录）：五个 tab 与计数、CLOSED 不混进「已退回」、预扣已退回、退回金额、验证码、号码搜索（完整号 / 后 4 位 / 不到 4 位 400）、
 *     日期筛选（进行中的单不受日期限制）、只看本人、分页、白名单（不出成本字段）、未登录 401、渠道 Host 404；
 *   · 售后申请（买家）：只在 RECEIVED / FINISHED 且收码后 complaintWindowH 小时内（窗口按配置）、每单 1 次、原因必选、说明 ≤500、别人的单 404、渠道 404、
 *     sms.complaint 推送、号码页 actions.complain / complainUntil / complaint；
 *   · 后台售后：列表（待处理在前、pendingTotal、30 天内已通过次数不计号码不支持再次收码的）、详情（写 ADMIN_VIEW）、权限 403、
 *     驳回（必填回复、同一事务写订单留言、审计）、通过（T16：整单原路退回余额、成本照计、利润 = −成本、留言带两格退回金额与备注、审计）、
 *     通过 / 驳回互斥（APPROVING 可以再点通过、不能驳回）、退款没做成 → 回到待处理、订单详情里直接售后退款也把售后申请收成「已通过」并写留言；
 *   · 后台接码订单详情带售后申请、概览「N 条售后申请待处理」；
 *   · 客服页 #jiema 分区与 FAQPage：只在主站、对全部用户开放时进结构化数据；灰度期管理员预览（不进结构化数据）、普通访客没有；渠道站没有；
 *   · /jiema 页 FAQ 与结构化数据；记录页渠道 Host 404；
 *   · 评审修复（S3 第二个提交）：售后申请的收尾与 T16 **同一个事务**（注入「写留言失败」→ 钱也不退、记录不动；直接调 T16 也会收尾）、
 *     已驳回而钱已退的申请在售后里「通过」= 补记（不再动钱）、列表下发当前售后窗口与次数上限、/jiema 维护中 / 即将开放也挂进行中提示条、
 *     个人中心「我的接码记录」入口的开关（profile/layout 的 JiemaOpenProvider）、FAQ 5「即将开放」版的退回去向；
 *   · 最后 W 系列对账不新增问题。
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

;(globalThis as unknown as { React: typeof React }).React = React
// React.cache 只在 Next 自带的 React 里有（客服页 layout 经 landing-ui 引到它）；tsx 直接跑时补一个直通实现（与 itest-tenant/mods-p1、wp2 同法）
{
  const ReactMut = React as unknown as { cache?: unknown }
  if (typeof ReactMut.cache !== 'function') ReactMut.cache = <F,>(fn: F): F => fn
}

const MAIN = 'bigolab.com'
const KEY = `itest-jiema-s3-${crypto.randomUUID()}`
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
  'tg:6': { usd: 0.15, stock: 100_000 },
  'dr:16': { usd: 0.045, stock: 100_000 },
}
const SMS_TABLES = ['sms_services', 'sms_countries', 'sms_offer_cache', 'sms_price_rules', 'sms_holds'] as const
const KEEP_SETTINGS = ['sms_config', 'sms_catalog_at', 'sms_operator_names', 'sms_runtime', 'wallet_config', 'vmq_lastpay', 'vmq_lastunmatched', 'vmq_recentraw', 'vmq_lastheart']

/** 把一棵 React 元素树里的文字（含 props 里的数据）收集起来（服务端组件的渲染结果断言用） */
function textOf(el: unknown, out: string[] = [], depth = 0): string[] {
  if (depth > 60 || el == null || typeof el === 'boolean') return out
  if (typeof el === 'string' || typeof el === 'number') {
    out.push(String(el))
    return out
  }
  if (Array.isArray(el)) {
    for (const x of el) textOf(x, out, depth + 1)
    return out
  }
  if (typeof el === 'object') {
    const p = (el as { props?: Record<string, unknown> }).props
    if (p) for (const v of Object.values(p)) textOf(v, out, depth + 1)
    else for (const v of Object.values(el as Record<string, unknown>)) textOf(v, out, depth + 1)
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
  process.env.CRON_SECRET = process.env.CRON_SECRET || 'itest-cron-secret-jiema-s3'

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
  const view = await import('../src/lib/jiema/view')
  const complaint = await import('../src/lib/jiema/complaint')
  const ledger = await import('../src/lib/wallet/ledger')
  const walletCfg = await import('../src/lib/wallet/config')
  const reconcile = await import('../src/lib/wallet/reconcile')
  const { FACTORY_SMS_CONFIG } = await import('../src/lib/jiema-config-schema')
  const { FORBIDDEN_BUYER_KEYS, collectKeyNames } = await import('../src/lib/jiema/dto')
  const { JIEMA_TERMS_VERSION, WALLET_TERMS_VERSION } = await import('../src/lib/terms/jiema-wallet')
  const routeRecords = (await import('../src/app/api/jiema/orders/route')) as unknown as { GET: RouteFn }
  const routeView = (await import('../src/app/api/jiema/orders/[orderNo]/route')) as unknown as { GET: RouteFn }
  const routeComplain = (await import('../src/app/api/jiema/orders/[orderNo]/complaint/route')) as unknown as { POST: RouteFn }
  const routeCList = (await import('../src/app/api/admin/jiema/complaints/route')) as unknown as { GET: RouteFn }
  const routeCDetail = (await import('../src/app/api/admin/jiema/complaints/[id]/route')) as unknown as { GET: RouteFn; POST: RouteFn }
  const routeADetail = (await import('../src/app/api/admin/jiema/orders/[id]/route')) as unknown as { GET: RouteFn; POST: RouteFn }
  const routeOverview = (await import('../src/app/api/admin/jiema/overview/route')) as unknown as { GET: RouteFn }
  const routeMsgs = (await import('../src/app/api/orders/[id]/messages/route')) as unknown as { GET: RouteFn }
  const SupportLayout = (await import('../src/app/(shop)/support/layout')).default as (p: { children: React.ReactNode }) => Promise<unknown>
  const JiemaPage = (await import('../src/app/(shop)/jiema/page')).default as () => Promise<unknown>
  const RecordsPage = (await import('../src/app/(shop)/jiema/records/page')).default as () => Promise<unknown>
  const ProfileLayout = (await import('../src/app/(shop)/profile/layout')).default as (p: { children: React.ReactNode }) => Promise<unknown>
  // 故障注入（评审修复用）：应用自己的 Prisma 客户端（src/lib/db，与 harness 的不是同一个）上挂中间件，只在 failMsgOrderId 指定的单写订单留言时抛错；
  // 中间件对交互式事务里的查询同样生效，用来证明「售后收尾」与 T16 同成同败
  let failMsgOrderId: number | null = null
  let injectedHits = 0
  {
    const appDb = (await import('../src/lib/db')).prisma
    appDb.$use(async (params, next) => {
      if (failMsgOrderId != null && params.model === 'OrderMessage' && params.action === 'create' && (params.args as { data?: { orderId?: number } })?.data?.orderId === failMsgOrderId) {
        injectedHits++
        throw new Error('itest injected failure: order_messages insert')
      }
      return next(params)
    })
  }
  const { JiemaActiveBanner } = await import('../src/app/(shop)/jiema/active-banner')
  /** 在一棵 React 元素树里找某个组件的元素（客户端组件在服务端渲染结果里只是 { type, props }） */
  const findEl = (el: unknown, type: unknown, depth = 0): { props: Record<string, unknown> } | null => {
    if (depth > 60 || el == null || typeof el !== 'object') return null
    if (Array.isArray(el)) {
      for (const x of el) {
        const f = findEl(x, type, depth + 1)
        if (f) return f
      }
      return null
    }
    const e = el as { type?: unknown; props?: Record<string, unknown> }
    if (e.type === type && e.props) return e as { props: Record<string, unknown> }
    if (e.props) {
      for (const v of Object.values(e.props)) {
        const f = findEl(v, type, depth + 1)
        if (f) return f
      }
    }
    return null
  }

  const saved: Record<string, unknown[]> = {}
  for (const t of SMS_TABLES) saved[t] = await prisma.$queryRawUnsafe(`SELECT * FROM ${t}`)
  const savedSettings = await prisma.setting.findMany({ where: { key: { in: KEEP_SETTINGS } } })
  const unmatchedBefore = new Set((await prisma.setting.findMany({ where: { key: { startsWith: 'vmq_unmatched:' } }, select: { key: true } })).map((s) => s.key))
  const baseline = await reconcile.runWalletReconcile({ full: true, alert: false, save: false })
  const baseSamples = (code: string) => new Set(baseline.items.find((i) => i.code === code)?.samples ?? [])
  const userIds: number[] = []
  const seeded: Array<{ productId: number; categoryId: number | null }> = []

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

    const mkUser = async (name: string, role: 'USER' | 'ADMIN' = 'ADMIN'): Promise<WorldUser & { token: string }> => {
      const u = await createUser(`s3-${name}-${uuid().slice(0, 6)}`, { role })
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
    /** 余额付清一单（ot:6 ¥1.70）→ 取到号 → WAITING */
    const waiting = async (u: { id: number; role: string }) => {
      const r = await place(u, 'ot', 6, { payWith: 'BALANCE', expectBalance: 170 })
      await settle(r.orderId)
      return r
    }
    /** WAITING → 收码 → RECEIVED（成本预估已写） */
    const received = async (u: { id: number; role: string }, code = '482917') => {
      const r = await waiting(u)
      const so = await soOf(r.orderId)
      const a = (await attsOf(so.id))[0]
      mock.pushSms(a.activationId as string, { code, text: `Your code is ${code}` })
      await tick()
      await engine.lazyAdvance(so.id).catch(() => undefined)
      return r
    }
    const finished = async (u: { id: number; role: string }, code = '615243') => {
      const r = await received(u, code)
      const so = await soOf(r.orderId)
      await engine.buyerFinish(so, so.version)
      await tick()
      return r
    }
    const admin = await mkUser('admin')
    const asAdmin = { host: MAIN, token: admin.token }
    const lulu = await createTenant('l')

    // =====================================================================================
    section('GET /api/jiema/orders 我的接码记录：五个 tab、计数、每行的内容（§1.11）')
    const ru = await mkUser('records')
    const asRu = { host: MAIN, token: ru.token }
    await fund(ru.id, 5000, 0)
    const rWait = await waiting(ru)
    const rFin = await finished(ru, '771234')
    const rCan = await waiting(ru)
    {
      adv(130)
      const so = await soOf(rCan.orderId)
      await engine.buyerCancel(so, so.version)
      await tick(2)
    }
    const rClosedAli = await place(ru, 'tg', 6)
    await engine.buyerClose(await soOf(rClosedAli.orderId), (await soOf(rClosedAli.orderId)).version)
    // 组合单关单（预扣退回）：先让可用余额只剩 ¥0.20，再下一张 ¥1.70 的单（余额 0.20 + 支付宝 1.50）
    const u2 = await mkUser('records-mix')
    await fund(u2.id, 20, 0)
    const rMix = await place(u2, 'ot', 6, { payWith: 'BALANCE', expectBalance: 20 })
    await engine.buyerClose(await soOf(rMix.orderId), (await soOf(rMix.orderId)).version)
    check('前置：等码 / 已完成 / 已取消 / 已关闭 四种单', (await soOf(rWait.orderId)).state === 'WAITING' && (await soOf(rFin.orderId)).state === 'FINISHED' && (await soOf(rCan.orderId)).state === 'CANCELLED' && (await soOf(rClosedAli.orderId)).state === 'CLOSED' && (await soOf(rMix.orderId)).state === 'CLOSED', `${(await soOf(rFin.orderId)).state} ${(await soOf(rCan.orderId)).state}`)
    {
      const all = await callRoute(routeRecords.GET, { ...asRu, path: '/api/jiema/orders' })
      const d = all.json?.data
      check('全部：200、no-store、4 张单、counts = { all 4, active 1, done 1, cancelled 1, closed 1 }', all.status === 200 && d?.total === 4 && JSON.stringify(d.counts) === JSON.stringify({ all: 4, active: 1, done: 1, cancelled: 1, closed: 1 }), JSON.stringify(d?.counts))
      check('按下单时间倒序（最后下的关闭单在最前）', d?.items?.[0]?.orderNo === rClosedAli.orderNo)
      const keys = collectKeyNames(d)
      check('白名单：响应里没有成本、cap、两个系数、activationId、流水备注', FORBIDDEN_BUYER_KEYS.every((k) => !keys.has(k)) && !/capMicro|costCents|saleCoef4|activationId|bizKey/.test(all.text))
      const act = await callRoute(routeRecords.GET, { ...asRu, path: '/api/jiema/orders?tab=active' })
      const w = act.json?.data?.items?.[0]
      const wa = (await attsOf((await soOf(rWait.orderId)).id))[0]
      check('进行中：只有等码那张；号码拆分（区号 + 本地号）、倒计时终点 = 主动取消时刻、付款方式 BALANCE', act.json?.data?.items?.length === 1 && w?.orderNo === rWait.orderNo && w?.state === 'WAITING' && `${w?.number?.dial}${w?.number?.national}` === wa.phone && w?.deadline === wa.waitUntil?.toISOString() && w?.payMode === 'BALANCE', JSON.stringify(w))
      const done = await callRoute(routeRecords.GET, { ...asRu, path: '/api/jiema/orders?tab=done' })
      check('已完成：验证码 771234、smsCount ≥ 1', done.json?.data?.items?.[0]?.code === '771234' && done.json.data.items[0].smsCount >= 1)
      const can = await callRoute(routeRecords.GET, { ...asRu, path: '/api/jiema/orders?tab=cancelled' })
      check('已退回：已取消的单，refundCents = ¥1.70', can.json?.data?.items?.[0]?.state === 'CANCELLED' && can.json.data.items[0].refundCents === 170)
      const cl = await callRoute(routeRecords.GET, { ...asRu, path: '/api/jiema/orders?tab=closed' })
      check('未支付：纯支付宝关闭单 releasedCents=null（什么都没退，不写「已退回」）、不在「已退回」tab', cl.json?.data?.items?.[0]?.state === 'CLOSED' && cl.json.data.items[0].releasedCents === null && !(can.json.data.items as any[]).some((x) => x.orderNo === rClosedAli.orderNo))
      const mixCl = await callRoute(routeRecords.GET, { host: MAIN, token: u2.token, path: '/api/jiema/orders?tab=closed' })
      check('组合单关单：releasedCents = 预扣 ¥0.20（「预扣已退回」）、payMode MIXED', mixCl.json?.data?.items?.[0]?.releasedCents === 20 && mixCl.json.data.items[0].payMode === 'MIXED', JSON.stringify(mixCl.json?.data?.items?.[0]))
      check('只看本人：另一个用户看不到这 4 张单', !(mixCl.json?.data?.items as any[]).some((x) => x.orderNo === rWait.orderNo) && mixCl.json?.data?.counts?.all === 1)
      // 号码搜索
      const tail = (wa.phone as string).slice(-4)
      const s4 = await callRoute(routeRecords.GET, { ...asRu, path: `/api/jiema/orders?q=${tail}` })
      check('号码后 4 位 → 找到等码那张', (s4.json?.data?.items as any[] | undefined)?.some((x) => x.orderNo === rWait.orderNo) === true)
      const pretty = `+${wa.dialCode ?? ''} ${(wa.phone as string).slice((wa.dialCode ?? '').length)}`
      const sFull = await callRoute(routeRecords.GET, { ...asRu, path: `/api/jiema/orders?q=${encodeURIComponent(pretty)}` })
      check('完整号（带 + 与空格）→ 恰好这一张', sFull.json?.data?.items?.length === 1 && sFull.json.data.items[0].orderNo === rWait.orderNo, `${pretty} ${sFull.text.slice(0, 120)}`)
      const sShort = await callRoute(routeRecords.GET, { ...asRu, path: '/api/jiema/orders?q=12' })
      check('不到 4 位 → 400 BAD_QUERY', sShort.status === 400 && sShort.json?.code === 'BAD_QUERY')
      const sNone = await callRoute(routeRecords.GET, { ...asRu, path: '/api/jiema/orders?q=00000000' })
      check('搜不到 → 空列表、counts 全 0', sNone.json?.data?.items?.length === 0 && sNone.json?.data?.counts?.all === 0)
      // 日期筛选：已完成那张挪到 40 天前 → 近 30 天看不到、近 90 天看得到；等码那张挪到 40 天前 → 仍然在（进行中不受日期限制）
      await prisma.smsOrder.update({ where: { orderId: rFin.orderId }, data: { createdAt: new Date(Date.now() - 40 * 86400_000) } })
      await prisma.smsOrder.update({ where: { orderId: rWait.orderId }, data: { createdAt: new Date(Date.now() - 40 * 86400_000) } })
      const d30 = await callRoute(routeRecords.GET, { ...asRu, path: '/api/jiema/orders?days=30' })
      const d90 = await callRoute(routeRecords.GET, { ...asRu, path: '/api/jiema/orders?days=90' })
      const d30n = (d30.json?.data?.items as any[]).map((x) => x.orderNo)
      check('近 30 天：40 天前的已完成单不在；40 天前的进行中单仍在', !d30n.includes(rFin.orderNo) && d30n.includes(rWait.orderNo) && d30.json.data.counts.done === 0 && d30.json.data.counts.active === 1)
      check('近 90 天：都在', (d90.json?.data?.items as any[]).some((x) => x.orderNo === rFin.orderNo) && d90.json.data.counts.all === 4)
      const pg = await callRoute(routeRecords.GET, { ...asRu, path: '/api/jiema/orders?days=90&page=2' })
      check('分页：第 2 页为空、hasMore=false（每页 20）', pg.json?.data?.items?.length === 0 && pg.json?.data?.hasMore === false && d90.json.data.pageSize === 20)
      const anon = await callRoute(routeRecords.GET, { host: MAIN, path: '/api/jiema/orders' })
      check('未登录 → 401', anon.status === 401)
      const ch = await callRoute(routeRecords.GET, { host: lulu.host, token: ru.token, path: '/api/jiema/orders' })
      check('渠道 Host → 404', ch.status === 404)
      const pgCh = await withRequest({ host: lulu.host }, () => catchNext(() => RecordsPage()))
      const pgMain = await withRequest({ host: MAIN }, () => catchNext(() => RecordsPage()))
      check('记录页：渠道 Host notFound、主站正常', pgCh.kind === 'notFound' && pgMain.kind === 'ok')
    }

    // =====================================================================================
    section('售后申请（买家，E17、§6.4）：只在收到短信的单、收码后 24 小时内、每单 1 次')
    const cu = await mkUser('complain')
    const asCu = { host: MAIN, token: cu.token }
    await fund(cu.id, 5000, 0)
    const post = (orderNo: string, body: unknown, as = asCu) => callRoute(routeComplain.POST, { ...as, method: 'POST', path: `/api/jiema/orders/${orderNo}/complaint`, params: { orderNo }, body })
    const c1 = await received(cu)
    let cid1 = 0
    {
      const w = await waiting(cu)
      const pw = await post(w.orderNo, { reason: 'CODE_INVALID' })
      check('等码中（还没收到短信）→ 409 STATE', pw.status === 409 && pw.json?.code === 'STATE')
      const pc = await post(rCan.orderNo, { reason: 'CODE_INVALID' }, asRu)
      check('已取消（没收到码、已自动退回）→ 409 NO_CODE「不需要申请售后」', pc.status === 409 && pc.json?.code === 'NO_CODE' && String(pc.json?.error).includes('不需要申请售后'))
      const so1 = await soOf(c1.orderId)
      const v0 = await callRoute(routeView.GET, { ...asCu, path: `/api/jiema/orders/${c1.orderNo}`, params: { orderNo: c1.orderNo } })
      check('号码页：RECEIVED → actions.complain=true、complainUntil = 首次收码 + 24 小时、complaint=null', v0.json?.data?.actions?.complain === true && v0.json?.data?.complainUntil === new Date((so1.firstCodeAt as Date).getTime() + 24 * 3600_000).toISOString() && v0.json?.data?.complaint === null, JSON.stringify({ a: v0.json?.data?.actions, u: v0.json?.data?.complainUntil }))
      const bad = await post(c1.orderNo, { reason: 'WHATEVER' })
      check('原因不认识 → 400', bad.status === 400)
      const tooLong = await post(c1.orderNo, { reason: 'OTHER', detail: 'x'.repeat(501) })
      check('说明超过 500 字 → 400', tooLong.status === 400)
      const other = await mkUser('complain-other', 'USER')
      const po = await post(c1.orderNo, { reason: 'OTHER' }, { host: MAIN, token: other.token })
      check('别人的单 → 404', po.status === 404)
      const pch = await post(c1.orderNo, { reason: 'OTHER' }, { host: lulu.host, token: cu.token })
      check('渠道 Host → 404', pch.status === 404)
      bodies.length = 0
      const ok1 = await post(c1.orderNo, { reason: 'CODE_INVALID', detail: '  提示验证码错误，重新发送后没有新短信  ' })
      const row = await prisma.smsComplaint.findUnique({ where: { orderId: c1.orderId } })
      cid1 = row?.id ?? 0
      check('提交 → 200、返回最新视图：complaint.state=OPEN、actions.complain=false、complainUntil=null', ok1.status === 200 && ok1.json?.data?.complaint?.state === 'OPEN' && ok1.json?.data?.actions?.complain === false && ok1.json?.data?.complainUntil === null, ok1.text.slice(0, 200))
      check('sms_complaints 一行：OPEN、原因、说明去掉首尾空白、userId / smsOrderId 对得上', !!row && row.state === 'OPEN' && row.reason === 'CODE_INVALID' && row.detail === '提示验证码错误，重新发送后没有新短信' && row.userId === cu.id && row.smsOrderId === so1.id)
      check('事件流水一条 COMPLAINT（BUYER）', (await prisma.smsEvent.count({ where: { smsOrderId: so1.id, type: 'COMPLAINT', actor: 'BUYER' } })) === 1)
      await sleep(300)
      const push = bodies.find((b) => b.includes('接码售后申请')) ?? ''
      check('企业微信 sms.complaint：带订单号、原因、说明、30 天内已通过、后台链接 ?tab=complaints&id=', push.includes(c1.orderNo) && push.includes('验证码无效或提示错误') && push.includes('30 天内已通过') && push.includes(`tab=complaints&id=${cid1}`), push.slice(0, 500))
      const again = await post(c1.orderNo, { reason: 'OTHER' })
      check('再提交一次 → 409 EXISTS（每单 1 次），仍然只有一行', again.status === 409 && again.json?.code === 'EXISTS' && (await prisma.smsComplaint.count({ where: { orderId: c1.orderId } })) === 1 && again.json?.view?.complaint?.state === 'OPEN')
      // 收码窗口：firstCodeAt 挪到 25 小时前 → 过期；把 complaintWindowH 调成 48 → 又可以
      const c2 = await finished(cu, '334455')
      await prisma.smsOrder.update({ where: { orderId: c2.orderId }, data: { firstCodeAt: new Date(runtime.jnow().getTime() - 25 * 3600_000) } })
      const vx = await callRoute(routeView.GET, { ...asCu, path: `/api/jiema/orders/${c2.orderNo}`, params: { orderNo: c2.orderNo } })
      const px = await post(c2.orderNo, { reason: 'OTHER' })
      check('收码 25 小时后（窗口 24）：号码页 actions.complain=false；提交 409 EXPIRED', vx.json?.data?.actions?.complain === false && px.status === 409 && px.json?.code === 'EXPIRED', px.text.slice(0, 160))
      await setCfg({ complaintWindowH: 48 })
      const p48 = await post(c2.orderNo, { reason: 'ALREADY_USED' })
      check('后台把 complaintWindowH 调成 48 → 同一张单可以提交（窗口按配置）', p48.status === 200 && p48.json?.data?.complaint?.state === 'OPEN', p48.text.slice(0, 160))
      // sms_config 读不到也不挡售后（按最后有效值）
      await prisma.setting.update({ where: { key: 'sms_config' }, data: { value: '{"broken":true' } })
      jcfg.invalidateSmsConfigCache()
      const c3 = await received(cu, '909090').catch(() => null)
      check('前置说明：配置坏了新单停售（这里的 c3 下单失败是预期）', c3 === null)
      await setCfg()
    }

    // =====================================================================================
    section('后台售后（§7.5）：列表、详情、权限、驳回（写订单留言）')
    {
      const plain = await mkUser('plain', 'USER')
      const f403 = await callRoute(routeCList.GET, { host: MAIN, token: plain.token, path: '/api/admin/jiema/complaints' })
      check('普通用户 → 403', f403.status === 403)
      const fch = await callRoute(routeCList.GET, { host: lulu.host, token: admin.token, path: '/api/admin/jiema/complaints' })
      check('渠道 Host → 404', fch.status === 404)
      const l = await callRoute(routeCList.GET, { ...asAdmin, path: '/api/admin/jiema/complaints?state=PENDING' })
      const list = (l.json?.data?.list ?? []) as any[]
      const mine = list.find((x) => x.id === cid1)
      check('待处理列表：有这一条、pendingTotal ≥ 2、先到先处理（按提交时间升序）', l.status === 200 && !!mine && l.json.data.pendingTotal >= 2 && list.every((x, i) => i === 0 || Date.parse(list[i - 1].createdAt) <= Date.parse(x.createdAt)))
      check('每条带 30 天内已通过次数（0）、号码能不能再次收码、原因中文', mine?.passed30d === 0 && typeof mine?.noResend === 'boolean' && mine?.reasonText === '验证码无效或提示错误')
      check('评审修复：列表下发当前售后窗口 complaintWindowH（24）与次数上限 passLimit（2），规则提示不写死', l.json?.data?.complaintWindowH === 24 && l.json?.data?.passLimit === 2, JSON.stringify({ w: l.json?.data?.complaintWindowH, p: l.json?.data?.passLimit }))
      await setCfg({ complaintWindowH: 36 })
      const l36 = await callRoute(routeCList.GET, { ...asAdmin, path: '/api/admin/jiema/complaints?state=PENDING&pageSize=1' })
      const d36 = await callRoute(routeCDetail.GET, { ...asAdmin, path: `/api/admin/jiema/complaints/${cid1}`, params: { id: String(cid1) } })
      check('  …后台把窗口改成 36 小时 → 列表与详情都跟着变', l36.json?.data?.complaintWindowH === 36 && d36.json?.data?.complaintWindowH === 36)
      await setCfg()
      const d = await callRoute(routeCDetail.GET, { ...asAdmin, path: `/api/admin/jiema/complaints/${cid1}`, params: { id: String(cid1) } })
      const so1 = await soOf(c1.orderId)
      check('详情：短信内容、每个号能不能再次收码、上游申诉截止（取号 + 7 天）、可通过可驳回', d.status === 200 && d.json.data.messages.some((m: any) => m.code === '482917') && d.json.data.attempts.length >= 1 && !!d.json.data.appealDeadline && d.json.data.actions.approve && d.json.data.actions.reject)
      check('打开详情写一条 ADMIN_VIEW（§10.2：管理员查看短信内容留痕）', (await prisma.smsEvent.count({ where: { smsOrderId: so1.id, type: 'ADMIN_VIEW', actorId: admin.id } })) >= 1)
      const act = (id: number, body: unknown, as = asAdmin) => callRoute(routeCDetail.POST, { ...as, method: 'POST', path: `/api/admin/jiema/complaints/${id}`, params: { id: String(id) }, body })
      const noReply = await act(cid1, { action: 'reject', reply: '' })
      check('驳回不填回复 → 400', noReply.status === 400)
      const p403 = await act(cid1, { action: 'reject', reply: '不属于售后' }, { host: MAIN, token: plain.token })
      check('普通用户处理 → 403', p403.status === 403)
      const rj = await act(cid1, { action: 'reject', reply: '号码已经注册成功，不属于售后范围' })
      const row = await prisma.smsComplaint.findUniqueOrThrow({ where: { id: cid1 } })
      const msgs = await prisma.orderMessage.findMany({ where: { orderId: c1.orderId }, orderBy: { id: 'asc' } })
      check('驳回 → 200：REJECTED、回复与处理人记下', rj.status === 200 && row.state === 'REJECTED' && row.adminNote === '号码已经注册成功，不属于售后范围' && row.handledBy === admin.id && !!row.handledAt)
      check('驳回的回复同一事务写进订单留言（客服、买家未读）', msgs.length === 1 && msgs[0].sender === 'ADMIN' && !msgs[0].readByBuyer && msgs[0].content.startsWith('售后申请未通过：号码已经注册成功，不属于售后范围'), msgs[0]?.content)
      check('审计 jiema.complaint.reject OK', (await prisma.auditEvent.count({ where: { action: 'jiema.complaint.reject', result: 'OK', actorUserId: admin.id } })) === 1)
      const v = await callRoute(routeView.GET, { ...asCu, path: `/api/jiema/orders/${c1.orderNo}`, params: { orderNo: c1.orderNo } })
      check('号码页：complaint.state=REJECTED、reply 是回复原文；订单仍是已收码（没退款）', v.json?.data?.complaint?.state === 'REJECTED' && v.json?.data?.complaint?.reply === '号码已经注册成功，不属于售后范围' && v.json?.data?.state === 'RECEIVED')
      const gm = await callRoute(routeMsgs.GET, { ...asCu, path: `/api/orders/${c1.orderId}/messages`, params: { id: String(c1.orderId) } })
      check('买家在订单留言里看得到这条回复', (gm.json?.data?.messages ?? []).some((m: any) => String(m.content).startsWith('售后申请未通过')))
      const ap = await act(cid1, { action: 'approve' })
      const rj2 = await act(cid1, { action: 'reject', reply: '再驳回一次' })
      check('已驳回的再点通过 / 驳回 → 409，钱没动', ap.status === 409 && rj2.status === 409 && (await prisma.balanceLog.count({ where: { orderId: c1.orderId, type: 'REFUND' } })) === 0)
    }

    // =====================================================================================
    section('后台售后：通过并退款到余额（T16：整单原路退回余额，成本照计、利润 = −成本；结果写订单留言）')
    let passedUser: (WorldUser & { token: string }) | null = null
    {
      const u = await mkUser('approve')
      passedUser = u
      await fund(u.id, 1000, 100)
      const r = await finished(u, '246810')
      const so0 = await soOf(r.orderId)
      check('前置：已完成、成本已定稿', so0.state === 'FINISHED' && so0.costCents != null)
      const p = await callRoute(routeComplain.POST, { host: MAIN, token: u.token, method: 'POST', path: `/api/jiema/orders/${r.orderNo}/complaint`, params: { orderNo: r.orderNo }, body: { reason: 'ALREADY_USED', detail: '号码已被注册' } })
      const c = await prisma.smsComplaint.findUniqueOrThrow({ where: { orderId: r.orderId } })
      check('前置：FINISHED 的单提交售后 → 200', p.status === 200)
      const before = await prisma.user.findUniqueOrThrow({ where: { id: u.id }, select: { topupCents: true, balance: true } })
      const ap = await callRoute(routeCDetail.POST, { ...asAdmin, method: 'POST', path: `/api/admin/jiema/complaints/${c.id}`, params: { id: String(c.id) }, body: { action: 'approve', note: '已核实，给你退回' } })
      const so = await soOf(r.orderId)
      const after = await prisma.user.findUniqueOrThrow({ where: { id: u.id }, select: { topupCents: true, balance: true } })
      const row = await prisma.smsComplaint.findUniqueOrThrow({ where: { id: c.id } })
      check('通过 → 200：订单 REFUNDED、refundState DONE、refundBy = 管理员', ap.status === 200 && so.state === 'REFUNDED' && so.refundState === 'DONE' && so.refundBy === admin.id, ap.text.slice(0, 200))
      check('成本照计、利润 = −成本（附录 B 第 18 条）', so.costCents != null && so.profitCents === -(so.costCents as number))
      check('钱：REFUND 流水一条，余额部分原路（这单全从充值格扣的 → 退回充值格 ¥1.70）', (await prisma.balanceLog.count({ where: { orderId: r.orderId, type: 'REFUND' } })) === 1 && after.topupCents - before.topupCents === 170 && Number(after.balance) === Number(before.balance))
      check('售后申请 → REFUNDED、处理人与备注记下', row.state === 'REFUNDED' && row.handledBy === admin.id && row.adminNote === '已核实，给你退回')
      const msgs = await prisma.orderMessage.findMany({ where: { orderId: r.orderId } })
      check('订单留言一条：「售后审核通过：本单实付 ¥1.70 已整单退回你的余额（充值余额 +¥1.70）…」+ 客服备注', msgs.length === 1 && msgs[0].content.startsWith('售后审核通过：本单实付 ¥1.70 已整单退回你的余额（充值余额 +¥1.70）') && msgs[0].content.endsWith('客服备注：已核实，给你退回'), msgs[0]?.content)
      check('审计 jiema.complaint.approve OK', (await prisma.auditEvent.count({ where: { action: 'jiema.complaint.approve', result: 'OK', actorUserId: admin.id } })) === 1)
      const v = await callRoute(routeView.GET, { host: MAIN, token: u.token, path: `/api/jiema/orders/${r.orderNo}`, params: { orderNo: r.orderNo } })
      check('号码页：REFUNDED、refund.reason「售后审核通过」、complaint.state=REFUNDED', v.json?.data?.state === 'REFUNDED' && v.json?.data?.refund?.reason === '售后审核通过' && v.json?.data?.complaint?.state === 'REFUNDED')
      const again = await callRoute(routeCDetail.POST, { ...asAdmin, method: 'POST', path: `/api/admin/jiema/complaints/${c.id}`, params: { id: String(c.id) }, body: { action: 'approve' } })
      check('再点通过 → 409，不会退两次、不会多写留言', again.status === 409 && (await prisma.balanceLog.count({ where: { orderId: r.orderId, type: 'REFUND' } })) === 1 && (await prisma.orderMessage.count({ where: { orderId: r.orderId } })) === 1)
      const rec = await callRoute(routeRecords.GET, { host: MAIN, token: u.token, path: '/api/jiema/orders?tab=cancelled' })
      check('记录页：售后退款的单在「已退回」tab，complaint=REFUNDED、refundCents=170', rec.json?.data?.items?.[0]?.state === 'REFUNDED' && rec.json.data.items[0].complaint === 'REFUNDED' && rec.json.data.items[0].refundCents === 170)
    }

    // =====================================================================================
    section('30 天内已通过次数：号码不支持再次收码（canGetAnotherSms=false）的不计入（E17）')
    {
      const u = passedUser!
      const r = await received(u, '135790')
      const so = await soOf(r.orderId)
      await prisma.smsAttempt.updateMany({ where: { smsOrderId: so.id }, data: { canGetAnotherSms: false } })
      await callRoute(routeComplain.POST, { host: MAIN, token: u.token, method: 'POST', path: `/api/jiema/orders/${r.orderNo}/complaint`, params: { orderNo: r.orderNo }, body: { reason: 'CODE_INVALID' } })
      const c = await prisma.smsComplaint.findUniqueOrThrow({ where: { orderId: r.orderId } })
      const d = await callRoute(routeCDetail.GET, { ...asAdmin, path: `/api/admin/jiema/complaints/${c.id}`, params: { id: String(c.id) } })
      check('详情：noResend=true（放宽受理）、30 天内已通过 1 次（上一节那张）', d.json?.data?.noResend === true && d.json?.data?.passed30d === 1, JSON.stringify({ n: d.json?.data?.noResend, p: d.json?.data?.passed30d }))
      const ap = await callRoute(routeCDetail.POST, { ...asAdmin, method: 'POST', path: `/api/admin/jiema/complaints/${c.id}`, params: { id: String(c.id) }, body: { action: 'approve' } })
      check('RECEIVED 的单直接通过（号码还开着：先完成号码再退款）→ REFUNDED', ap.status === 200 && (await soOf(r.orderId)).state === 'REFUNDED', ap.text.slice(0, 200))
      const l = await callRoute(routeCList.GET, { ...asAdmin, path: '/api/admin/jiema/complaints?state=DONE' })
      const rowL = (l.json?.data?.list as any[]).find((x) => x.id === c.id)
      check('再看：30 天内已通过仍是 1 次（这一次号码不支持再次收码，不计入）', rowL?.passed30d === 1, JSON.stringify(rowL))
    }

    // =====================================================================================
    section('通过 / 驳回互斥；退款没做成回到待处理；订单详情里直接售后退款也收尾售后申请')
    {
      const u = await mkUser('mutex')
      await fund(u.id, 3000, 0)
      const asU = { host: MAIN, token: u.token }
      const cpost = (orderNo: string) => callRoute(routeComplain.POST, { ...asU, method: 'POST', path: `/api/jiema/orders/${orderNo}/complaint`, params: { orderNo }, body: { reason: 'OTHER', detail: 'x' } })
      const act = (id: number, body: unknown) => callRoute(routeCDetail.POST, { ...asAdmin, method: 'POST', path: `/api/admin/jiema/complaints/${id}`, params: { id: String(id) }, body })
      // ① APPROVING（点了通过、进程中途崩溃）：驳回被拒，再点通过把退款做完
      const r1 = await received(u, '112233')
      await cpost(r1.orderNo)
      const k1 = await prisma.smsComplaint.findUniqueOrThrow({ where: { orderId: r1.orderId } })
      await prisma.smsComplaint.update({ where: { id: k1.id }, data: { state: 'APPROVING', handledBy: admin.id } })
      const rj = await act(k1.id, { action: 'reject', reply: '驳回试试' })
      check('APPROVING 时驳回 → 409「正在退款中」', rj.status === 409 && String(rj.json?.error).includes('正在退款中'))
      const ap = await act(k1.id, { action: 'approve' })
      check('APPROVING 再点通过 → 退款做完、REFUNDED', ap.status === 200 && (await soOf(r1.orderId)).state === 'REFUNDED' && (await prisma.smsComplaint.findUniqueOrThrow({ where: { id: k1.id } })).state === 'REFUNDED')
      // ② 退款前提不满足（预扣被人工改过）→ 没退、售后回到 OPEN；订单转人工；改回后再通过 → MANUAL（收过码）同事务 REFUNDED
      const r2 = await received(u, '445566')
      await cpost(r2.orderNo)
      const k2 = await prisma.smsComplaint.findUniqueOrThrow({ where: { orderId: r2.orderId } })
      await prisma.$executeRawUnsafe(`UPDATE balance_holds SET state = 'RELEASED' WHERE order_id = ${r2.orderId}`)
      const f1 = await act(k2.id, { action: 'approve' })
      const k2a = await prisma.smsComplaint.findUniqueOrThrow({ where: { id: k2.id } })
      check('预扣不是 CAPTURED → 409「没有退款」、售后回到 OPEN（可以驳回或稍后再试）、没有 REFUND 流水', f1.status === 409 && String(f1.json?.error).includes('没有退款') && k2a.state === 'OPEN' && k2a.handledBy === null && (await prisma.balanceLog.count({ where: { orderId: r2.orderId, type: 'REFUND' } })) === 0, f1.text.slice(0, 200))
      check(
        '  …号码先被完成、订单是已完成（FINISHED 是终态，冻结不了）：钱没动、记一条 REFUND_ERR、提示写「前提不满足」而不是「另一个操作处理了」、审计 DENIED',
        (await soOf(r2.orderId)).state === 'FINISHED' && (await prisma.smsEvent.count({ where: { smsOrderId: (await soOf(r2.orderId)).id, type: 'REFUND_ERR' } })) >= 1 && String(f1.json?.error).includes('前提不满足') && (await prisma.auditEvent.count({ where: { action: 'jiema.complaint.approve', result: 'DENIED', actorUserId: admin.id } })) >= 1,
        `${(await soOf(r2.orderId)).state} ${f1.json?.error}`,
      )
      await prisma.$executeRawUnsafe(`UPDATE balance_holds SET state = 'CAPTURED' WHERE order_id = ${r2.orderId}`)
      const f2 = await act(k2.id, { action: 'approve' })
      check('核实改回后再通过 → 已完成的单 REFUNDED、售后 REFUNDED', f2.status === 200 && (await soOf(r2.orderId)).state === 'REFUNDED' && (await prisma.smsComplaint.findUniqueOrThrow({ where: { id: k2.id } })).state === 'REFUNDED', f2.text.slice(0, 200))
      // ③ 订单详情里直接「售后退款到余额」：这张单的待处理售后一并收成 REFUNDED，写一条留言
      const r3 = await received(u, '778899')
      await cpost(r3.orderNo)
      const k3 = await prisma.smsComplaint.findUniqueOrThrow({ where: { orderId: r3.orderId } })
      const so3 = await soOf(r3.orderId)
      const dd = await callRoute(routeADetail.GET, { ...asAdmin, path: `/api/admin/jiema/orders/${so3.id}`, params: { id: String(so3.id) } })
      check('后台接码订单详情带售后申请（§7.2）', dd.json?.data?.complaint?.id === k3.id && dd.json.data.complaint.state === 'OPEN')
      check('打开后台接码订单详情也写一条 ADMIN_VIEW（§10.2）', (await prisma.smsEvent.count({ where: { smsOrderId: so3.id, type: 'ADMIN_VIEW', actorId: admin.id } })) === 1)
      const rf = await callRoute(routeADetail.POST, { ...asAdmin, method: 'POST', path: `/api/admin/jiema/orders/${so3.id}`, params: { id: String(so3.id) }, body: { action: 'refund', reason: '直接在订单里退' } })
      const k3a = await prisma.smsComplaint.findUniqueOrThrow({ where: { id: k3.id } })
      check('订单详情售后退款 → 售后申请一并 REFUNDED、留言一条「售后审核通过」、提示里说明', rf.status === 200 && k3a.state === 'REFUNDED' && (await prisma.orderMessage.count({ where: { orderId: r3.orderId, content: { startsWith: '售后审核通过' } } })) === 1 && String(rf.json?.message).includes('售后申请已记为通过'), rf.text.slice(0, 200))
      // ④ 驳回之后站长改主意，在订单详情里退款 → 记录与钱对得上（REJECTED → REFUNDED）
      const r4 = await received(u, '990011')
      await cpost(r4.orderNo)
      const k4 = await prisma.smsComplaint.findUniqueOrThrow({ where: { orderId: r4.orderId } })
      await act(k4.id, { action: 'reject', reply: '先驳回' })
      const so4 = await soOf(r4.orderId)
      await callRoute(routeADetail.POST, { ...asAdmin, method: 'POST', path: `/api/admin/jiema/orders/${so4.id}`, params: { id: String(so4.id) }, body: { action: 'refund', reason: '改主意了' } })
      check('驳回后又在订单详情里退款 → 售后申请改成 REFUNDED（与钱一致）', (await prisma.smsComplaint.findUniqueOrThrow({ where: { id: k4.id } })).state === 'REFUNDED' && (await soOf(r4.orderId)).state === 'REFUNDED')
      const pNo = await cpost(r4.orderNo)
      check('已退款的单再提交售后 → 409（EXISTS）', pNo.status === 409)
      check('  …留言：驳回一条 + 「售后审核通过」一条（带两格金额）', (await prisma.orderMessage.count({ where: { orderId: r4.orderId, content: { startsWith: '售后审核通过' } } })) === 1 && (await prisma.orderMessage.count({ where: { orderId: r4.orderId, content: { startsWith: '售后申请未通过' } } })) === 1)

      // ⑤ 评审修复：售后收尾与 T16 同一个事务——注入「写留言失败」（应用的 Prisma 客户端上挂一个测试中间件，只拦这张单的留言），
      //    钱也不退、售后记录不动；去掉注入后再退，两者一起完成
      const r5 = await received(u, '551234')
      await cpost(r5.orderNo)
      const k5 = await prisma.smsComplaint.findUniqueOrThrow({ where: { orderId: r5.orderId } })
      await act(k5.id, { action: 'reject', reply: '先驳回' })
      const so5 = await soOf(r5.orderId)
      const bal5 = await prisma.user.findUniqueOrThrow({ where: { id: u.id }, select: { topupCents: true, balance: true } })
      failMsgOrderId = r5.orderId
      injectedHits = 0
      let f5: Awaited<ReturnType<typeof callRoute>> | null = null
      try {
        f5 = await callRoute(routeADetail.POST, { ...asAdmin, method: 'POST', path: `/api/admin/jiema/orders/${so5.id}`, params: { id: String(so5.id) }, body: { action: 'refund', reason: '改主意了' } })
      } finally {
        failMsgOrderId = null
      }
      check('  （注入生效：拦下了事务里的那条留言）', injectedHits >= 1, String(injectedHits))
      const so5a = await soOf(r5.orderId)
      const bal5a = await prisma.user.findUniqueOrThrow({ where: { id: u.id }, select: { topupCents: true, balance: true } })
      check(
        '写「售后审核通过」留言失败 → 整个 T16 回滚：订单没退款（refundState NONE、没有 REFUND 流水、余额没变）、售后仍是已驳回',
        f5?.status === 500 &&
          so5a.state !== 'REFUNDED' &&
          so5a.refundState === 'NONE' &&
          (await prisma.balanceLog.count({ where: { orderId: r5.orderId, type: 'REFUND' } })) === 0 &&
          bal5a.topupCents === bal5.topupCents &&
          Number(bal5a.balance) === Number(bal5.balance) &&
          (await prisma.smsComplaint.findUniqueOrThrow({ where: { id: k5.id } })).state === 'REJECTED',
        `${f5?.status} ${so5a.state}/${so5a.refundState}`,
      )
      const g5 = await callRoute(routeADetail.POST, { ...asAdmin, method: 'POST', path: `/api/admin/jiema/orders/${so5.id}`, params: { id: String(so5.id) }, body: { action: 'refund', reason: '改主意了' } })
      const k5a = await prisma.smsComplaint.findUniqueOrThrow({ where: { id: k5.id } })
      check(
        '  …去掉注入后再点「售后退款到余额」→ 钱与售后记录一起完成：REFUNDED + 售后 REFUNDED + 一条「售后审核通过」留言 + 一条 REFUND 流水',
        g5.status === 200 &&
          (await soOf(r5.orderId)).state === 'REFUNDED' &&
          k5a.state === 'REFUNDED' &&
          (await prisma.orderMessage.count({ where: { orderId: r5.orderId, content: { startsWith: '售后审核通过' } } })) === 1 &&
          (await prisma.balanceLog.count({ where: { orderId: r5.orderId, type: 'REFUND' } })) === 1 &&
          String(g5.json?.message).includes('售后申请已记为通过'),
        g5.text.slice(0, 200),
      )

      // ⑥ 直接调 T16（engine.adminRefund，不经过任何「退款后再收尾」的步骤）也会在同一个事务里收尾售后申请
      const r6 = await received(u, '661234')
      await cpost(r6.orderNo)
      const k6 = await prisma.smsComplaint.findUniqueOrThrow({ where: { orderId: r6.orderId } })
      const so6 = await soOf(r6.orderId)
      const t6 = await engine.adminRefund(so6.id, admin.id, 'COMPLAINT')
      const ev6 = await prisma.smsEvent.findFirst({ where: { smsOrderId: so6.id, type: 'COMPLAINT_OK' } })
      check(
        '直接调 T16 → ok、complaintClosed=true；售后 REFUNDED、留言一条、事件 COMPLAINT_OK（via ORDER）——收尾是 T16 事务的一部分',
        t6.ok &&
          t6.complaintClosed === true &&
          (await prisma.smsComplaint.findUniqueOrThrow({ where: { id: k6.id } })).state === 'REFUNDED' &&
          (await prisma.orderMessage.count({ where: { orderId: r6.orderId, content: { startsWith: '售后审核通过' } } })) === 1 &&
          !!ev6 &&
          String(ev6.detail).includes('"via":"ORDER"'),
        JSON.stringify({ t6, ev: ev6?.detail }),
      )

      // ⑦ 补记：已驳回、钱却已经退了（早先的数据 / 异常留下的中间态）→ 售后详情给「通过」（moneyDone），点了只补记状态与留言、不再动钱
      await prisma.smsComplaint.update({ where: { id: k6.id }, data: { state: 'REJECTED', adminNote: '模拟：驳回后钱在订单里退了、收尾没成' } })
      await prisma.orderMessage.deleteMany({ where: { orderId: r6.orderId, content: { startsWith: '售后审核通过' } } })
      const d7 = await callRoute(routeCDetail.GET, { ...asAdmin, path: `/api/admin/jiema/complaints/${k6.id}`, params: { id: String(k6.id) } })
      check('已驳回 + 订单已售后退款：详情 actions.approve=true、moneyDone=true、不能再驳回', d7.json?.data?.actions?.approve === true && d7.json?.data?.moneyDone === true && d7.json?.data?.actions?.reject === false, JSON.stringify(d7.json?.data?.actions))
      const a7 = await act(k6.id, { action: 'approve', note: '补记' })
      check(
        '  …点「通过」→ 200「补记为通过」：售后 REFUNDED、留言一条（带备注）、REFUND 流水仍只有一条（不再动钱）',
        a7.status === 200 &&
          String(a7.json?.message).includes('补记') &&
          (await prisma.smsComplaint.findUniqueOrThrow({ where: { id: k6.id } })).state === 'REFUNDED' &&
          (await prisma.orderMessage.count({ where: { orderId: r6.orderId, content: { startsWith: '售后审核通过' }, AND: [{ content: { endsWith: '客服备注：补记' } }] } })) === 1 &&
          (await prisma.balanceLog.count({ where: { orderId: r6.orderId, type: 'REFUND' } })) === 1,
        a7.text.slice(0, 200),
      )
      const a7b = await act(k6.id, { action: 'approve' })
      check('  …再点一次 → 409，不会写第二条留言', a7b.status === 409 && (await prisma.orderMessage.count({ where: { orderId: r6.orderId, content: { startsWith: '售后审核通过' } } })) === 1)
      const w8 = await mkUser('reject-only')
      await fund(w8.id, 1000, 0)
      const r8 = await received(w8, '881234')
      await callRoute(routeComplain.POST, { host: MAIN, token: w8.token, method: 'POST', path: `/api/jiema/orders/${r8.orderNo}/complaint`, params: { orderNo: r8.orderNo }, body: { reason: 'OTHER' } })
      const k8 = await prisma.smsComplaint.findUniqueOrThrow({ where: { orderId: r8.orderId } })
      await act(k8.id, { action: 'reject', reply: '不属于售后' })
      const a8 = await act(k8.id, { action: 'approve' })
      check('已驳回、钱没退的单点「通过」仍 409（要退款请到「订单」里），钱没动', a8.status === 409 && (await prisma.balanceLog.count({ where: { orderId: r8.orderId, type: 'REFUND' } })) === 0)
    }

    // =====================================================================================
    section('概览「N 条售后申请待处理」、侧栏 / tab 红点的数据源')
    {
      const pending = await prisma.smsComplaint.count({ where: { state: { in: ['OPEN', 'APPROVING'] } } })
      const ov = await callRoute(routeOverview.GET, { ...asAdmin, path: '/api/admin/jiema/overview' })
      const l = await callRoute(routeCList.GET, { ...asAdmin, path: '/api/admin/jiema/complaints?state=PENDING&pageSize=1' })
      check('概览 s2.attention.complaintsOpen = 待处理条数 = 列表 pendingTotal', ov.json?.data?.s2?.attention?.complaintsOpen === pending && l.json?.data?.pendingTotal === pending && pending >= 1, `${ov.json?.data?.s2?.attention?.complaintsOpen} / ${l.json?.data?.pendingTotal} / ${pending}`)
    }

    // =====================================================================================
    section('客服页 #jiema 分区与 FAQPage（§8.3、§6.6 第 33 条）；/jiema 页 FAQ（§1.3）')
    {
      const faq13 = '能开发票或收据吗？'
      const render = async (host: string, token?: string) => {
        const r = await withRequest({ host, token }, () => catchNext(() => SupportLayout({ children: 'x' })))
        if (r.kind !== 'ok') return { kind: r.kind, text: '', ld: '' }
        const all = textOf(r.value).join('\n')
        // JSON-LD 在 <JsonLd data={…}> 的 props 里：单独取一次，区分「进了结构化数据」与「只在 context 里」
        const ld = textOf((r.value as any)?.props?.children?.[0]).join('\n')
        return { kind: r.kind, text: all, ld }
      }
      await setCfg({ audience: 'ADMIN_ONLY' })
      const anonGray = await render(MAIN)
      check('灰度期（仅管理员）普通访客：没有接码分区、结构化数据里没有接码问答', anonGray.kind === 'ok' && !anonGray.text.includes(faq13) && !anonGray.ld.includes(faq13))
      const adminGray = await render(MAIN, admin.token)
      check('灰度期管理员：分区数据有（预览），但结构化数据里没有接码问答', adminGray.text.includes(faq13) && adminGray.text.includes('PREVIEW') && !adminGray.ld.includes(faq13))
      await setCfg({ audience: 'ALL' })
      const open = await render(MAIN)
      check('对全部用户开放：分区数据有、结构化数据里有 13 条接码问答（与页面同一份）', open.text.includes(faq13) && open.ld.includes(faq13) && open.ld.includes('刚刚下单了，为什么查询不到订单？'))
      check('  …FAQ 11 用当前 complaintWindowH（24）、FAQ 5 充值没对全部用户开放 → 「即将开放」', open.ld.includes('收到短信后 24 小时内') && open.ld.includes('余额充值即将开放'))
      check(
        '  …评审修复：FAQ 5「即将开放」版的退回去向与 FAQ 2 一致（余额抵扣回原来那一格、支付宝付的进充值余额），不再说「全部进充值余额」',
        open.ld.includes('余额抵扣的部分退回原来那一格（充值余额或返现余额），支付宝付的部分退进充值余额，下次下单可以直接抵扣') && !open.ld.includes('退回的钱会进入你的充值余额'),
      )
      const pfOpen = await withRequest({ host: MAIN, token: ru.token }, () => catchNext(() => ProfileLayout({ children: 'x' })))
      const pfCh = await withRequest({ host: lulu.host, token: ru.token }, () => catchNext(() => ProfileLayout({ children: 'x' })))
      check(
        '个人中心「我的接码记录」入口开关（§1.2）：对全部用户开放时 profile/layout 下发 true；渠道站 false',
        pfOpen.kind === 'ok' && (pfOpen.value as any)?.props?.value === true && pfCh.kind === 'ok' && (pfCh.value as any)?.props?.value === false,
        `${pfOpen.kind} ${pfCh.kind}`,
      )
      const ch = await render(lulu.host)
      check('渠道站：没有接码分区、结构化数据没有接码问答', ch.kind === 'ok' && !ch.text.includes(faq13) && !ch.ld.includes(faq13))
      const jp = await withRequest({ host: MAIN }, () => catchNext(() => JiemaPage()))
      const jt = jp.kind === 'ok' ? textOf(jp.value).join('\n') : ''
      check('/jiema（对全部用户开放）：页尾 FAQ 13 条、FAQPage 结构化数据、「我的接码记录」入口组件', jp.kind === 'ok' && jt.includes(faq13) && jt.includes('FAQPage'), jp.kind)
      await setCfg({ audience: 'ADMIN_ONLY' })
      const jp2 = await withRequest({ host: MAIN, token: admin.token }, () => catchNext(() => JiemaPage()))
      const jt2 = jp2.kind === 'ok' ? textOf(jp2.value).join('\n') : ''
      check('/jiema 管理员预览：FAQ 看得到，但不输出 FAQPage', jt2.includes(faq13) && !jt2.includes('FAQPage'))
      const pfGray = await withRequest({ host: MAIN, token: admin.token }, () => catchNext(() => ProfileLayout({ children: 'x' })))
      check('个人中心入口开关：灰度期（仅管理员）连管理员也是 false（与导航、页脚同一个判定）', pfGray.kind === 'ok' && (pfGray.value as any)?.props?.value === false)
      // 评审修复：即将开放 / 维护中（在途单照常推进，E59）也挂进行中提示条与「我的接码记录」入口（E18）
      const viewer = await mkUser('viewer', 'USER')
      const soon = await withRequest({ host: MAIN, token: viewer.token }, () => catchNext(() => JiemaPage()))
      const soonBanner = soon.kind === 'ok' ? findEl(soon.value, JiemaActiveBanner) : null
      check(
        '/jiema 即将开放（普通用户、受众仅管理员）：说明卡片里有进行中提示条（onlyWithOrders：只对有过接码单的人显示记录入口）',
        soon.kind === 'ok' && textOf(soon.value).join('\n').includes('短信接码即将开放') && soonBanner?.props?.onlyWithOrders === true,
        soon.kind,
      )
      await setCfg({ enabled: false, audience: 'ALL' })
      const mt = await withRequest({ host: MAIN, token: viewer.token }, () => catchNext(() => JiemaPage()))
      check(
        '/jiema 维护中（开放后总开关关了）：说明卡片里同样有进行中提示条',
        mt.kind === 'ok' && textOf(mt.value).join('\n').includes('接码服务维护中') && findEl(mt.value, JiemaActiveBanner)?.props?.onlyWithOrders === true,
        mt.kind,
      )
      const recMt = await callRoute(routeRecords.GET, { ...asRu, path: '/api/jiema/orders?tab=active&days=90' })
      check('  …提示条的数据源（记录接口）在维护中照常可用：进行中的单列得出来', recMt.status === 200 && (recMt.json?.data?.counts?.active ?? 0) >= 1 && (recMt.json?.data?.counts?.all ?? 0) >= 1)
      await setCfg({ audience: 'ADMIN_ONLY' })
    }

    // =====================================================================================
    section('对账：W 系列不新增问题（售后退款走的是同一条 T16 资金路径）')
    {
      const rep = await reconcile.runWalletReconcile({ full: true, alert: false, save: false })
      for (const code of ['W1', 'W2', 'W3', 'W4', 'W5', 'W9']) {
        const it = rep.items.find((i) => i.code === code)!
        const base = baseSamples(code)
        const fresh = it.samples.filter((s) => !base.has(s))
        check(`${code} 没有新增问题（${it.title}）`, fresh.length === 0, fresh.join('；').slice(0, 400))
      }
    }
    void view
    void complaint
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
