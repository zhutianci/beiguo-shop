/**
 * 短信接码 · 付款前免责弹窗与条款同意留痕（2026-09-30）—— 数据库集成测试（会建数据、会删数据）。docs/短信接码-设计.md §1.8、§8.6：
 *
 *   set -a; . ./.env.local; set +a; VMQ_KEY=itest npx tsx scripts/itest-jiema-terms.ts
 *
 * ⚠️ 只能对一次性的本地库跑（库名须含 dev / test）。**不调用真实 hero-sms**：上游一律是本地假服务（scripts/mock-herosms.ts，只绑 127.0.0.1），
 * 企业微信推送打到本地假 webhook。sms_* 目录与停售表、相关 settings 在开始时存档、结束时原样恢复；本测试建的订单、流水、预扣、收款单全部删掉。
 *
 * 覆盖（POST /api/jiema/orders 进程内调用，带 cf-connecting-ip / user-agent 头）：
 *   · 三种付款方式（余额付清 / 余额 + 支付宝 / 支付宝）各自：缺同意标记与版本号 → 409 TERMS（不是 400，带回当前两个版本号）、
 *     agree=false → 409、《短信接码服务条款》旧版本（2026-09-29）→ 409、《余额与充值规则》版本不对 → 409；这几次都不建单、不预扣、余额不动；
 *   · 同意后下单成功：payMode 与付款方式一致、SmsOrder.termsVersion / walletTermsVersion 是当前版、恰好一条 TERMS_AGREED 事件
 *     （actor BUYER、条款版本、IP 等于请求头、UA 截到 200 字符）；同一个 clientToken 重放原样返回、不重写留痕；
 *     组合 / 支付宝单再走一次「重新发起支付」（pay/vmq/create）：复用收银台、不新建订单、留痕仍只有一条；
 *   · 类型不对（agree: "yes"）→ 400；直接调下单函数不带 consent → 照样留一条（ip / ua 为 null）；
 *   · 后台详情 jiemaOrderDetailAdmin 带 consent（时间、IP、UA、版本）；没有留痕的旧单 consent = null；
 *   · 清理口径：180 天前的 TERMS_AGREED 不在 cleanup 的删除范围，其余事件照删（与 api/cron/cleanup 同一个 where）；
 *   · /jiema/terms 条款页：免责声明、五条、各节与全部法条原文都渲染出来；渠道 Host 404；/terms 在对全部用户开放时链到 /jiema/terms。
 */
import http from 'http'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import React from 'react'
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

// 仓库 tsconfig 是 jsx: preserve，tsx 按经典运行时编译 JSX（React.createElement），渲染服务端页面组件需要全局 React
;(globalThis as unknown as { React: typeof React }).React = React

const MAIN = 'bigolab.com'
const KEY = `itest-jiema-terms-${crypto.randomUUID()}`
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
  'tg:6': { usd: 0.15, stock: 100_000 },
  'ot:6': { usd: 0.024, stock: 100_000 },
}
const SMS_TABLES = ['sms_services', 'sms_countries', 'sms_offer_cache', 'sms_price_rules', 'sms_holds'] as const
const KEEP_SETTINGS = ['sms_config', 'sms_catalog_at', 'sms_operator_names', 'sms_runtime', 'wallet_config', 'vmq_lastpay', 'vmq_lastunmatched', 'vmq_recentraw', 'vmq_lastheart']

/** 把一棵 React 元素树里的文字收集起来（服务端组件的渲染结果断言用；同 itest-jiema-s2b.ts） */
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
  const hook = http.createServer((req, res) => {
    req.on('data', () => undefined)
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end('{"errcode":0}')
    })
  })
  await new Promise<void>((r) => hook.listen(0, '127.0.0.1', () => r()))
  process.env.WECOM_WEBHOOK_URL = `http://127.0.0.1:${(hook.address() as { port: number }).port}/cgi-bin/webhook/send?key=itest`

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
  const order = await import('../src/lib/jiema/order')
  const adminOrders = await import('../src/lib/jiema/admin-orders')
  const consent = await import('../src/lib/jiema/consent')
  const ledger = await import('../src/lib/wallet/ledger')
  const walletCfg = await import('../src/lib/wallet/config')
  const { rateClear } = await import('../src/lib/news/rate-limit')
  const { centsOf } = await import('../src/lib/wallet/buckets')
  const { FACTORY_SMS_CONFIG } = await import('../src/lib/jiema-config-schema')
  const { JIEMA_TERMS, JIEMA_TERMS_PATH, JIEMA_TERMS_VERSION, WALLET_TERMS_VERSION } = await import('../src/lib/terms/jiema-wallet')
  const { JIEMA_DISCLAIMER, JIEMA_TERMS_SECTIONS, LEGAL_ARTICLES } = await import('../src/lib/terms/jiema-legal')
  const routeOrders = (await import('../src/app/api/jiema/orders/route')) as unknown as { POST: RouteFn }
  const routePay = (await import('../src/app/api/pay/vmq/create/route')) as unknown as { POST: RouteFn }
  const JiemaTermsPage = (await import('../src/app/(shop)/jiema/terms/page')).default as () => Promise<unknown>
  const TermsPage = (await import('../src/app/(shop)/terms/page')).default as () => Promise<unknown>

  const saved: Record<string, unknown[]> = {}
  for (const t of SMS_TABLES) saved[t] = await prisma.$queryRawUnsafe(`SELECT * FROM ${t}`)
  const savedSettings = await prisma.setting.findMany({ where: { key: { in: KEEP_SETTINGS } } })
  const unmatchedBefore = new Set((await prisma.setting.findMany({ where: { key: { startsWith: 'vmq_unmatched:' } }, select: { key: true } })).map((s) => s.key))
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

    section('准备：SMS_POOL / TOPUP 载体种子、目录同步、配置（总开关开 + 仅管理员、余额支付开）')
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
    const cfgR = await jcfg.readSmsConfig()
    if (!cfgR.ok) throw new Error('sms_config 读不到')
    const q = await catalog.quote('tg', 6, cfgR.config, runtime.jnow())
    if (!q.ok) throw new Error(`报价失败 ${q.code}`)
    const price = q.priceCents
    check(`tg:6 报价 ${price} 分（> 100，组合单能拆出两段）`, price > 100)

    const mkUser = async (name: string): Promise<WorldUser & { token: string }> => {
      const u = await createUser(`terms-${name}-${uuid().slice(0, 6)}`, { role: 'ADMIN' })
      userIds.push(u.id)
      return { ...u, token: signTestToken(u as never, 'main') }
    }
    const fund = async (userId: number, topupCents: number) => {
      if (topupCents <= 0) return
      await ledger.inMoneyTx(async (tx) => {
        await ledger.postInTx(tx, { userId, topupDeltaCents: topupCents, type: 'ADJUST', bizKey: `adj:it-${uuid()}` })
      })
    }
    const IP = '203.0.113.77'
    const LONG_UA = `Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) itest-terms ${'x'.repeat(300)}`
    const post = (u: { id: number; token: string }, body: Record<string, unknown>) => {
      rateClear(`jiema-order:${u.id}`)
      return callRoute(routeOrders.POST, {
        host: MAIN,
        token: u.token,
        method: 'POST',
        path: '/api/jiema/orders',
        headers: { 'cf-connecting-ip': IP, 'user-agent': LONG_UA },
        body,
      })
    }
    const base = (payWith: 'ALIPAY' | 'BALANCE', expectBalanceCents: number | null) => ({
      service: 'tg',
      country: 6,
      operator: null,
      operatorFallback: true,
      expectPriceCents: price,
      payWith,
      expectBalanceCents,
      clientToken: uuid(),
    })
    const current = { agree: true, termsVersion: JIEMA_TERMS_VERSION, walletTermsVersion: WALLET_TERMS_VERSION }
    const eventsOf = async (orderId: number, type = consent.TERMS_AGREED_EVENT) => {
      const so = await prisma.smsOrder.findUniqueOrThrow({ where: { orderId } })
      return prisma.smsEvent.findMany({ where: { smsOrderId: so.id, type }, orderBy: { id: 'asc' } })
    }
    const settle = async (orderId: number) => {
      const so = await prisma.smsOrder.findUniqueOrThrow({ where: { orderId } })
      for (let i = 0; i < 60; i++) {
        if (!(await prisma.smsAttempt.count({ where: { smsOrderId: so.id, state: 'REQUESTING' } }))) return
        await sleep(400)
      }
    }

    // =====================================================================================
    const modes = [
      { name: '余额付清', payWith: 'BALANCE' as const, fundCents: price + 500, expectBalance: price, payMode: 'BALANCE' },
      { name: '余额 + 支付宝', payWith: 'BALANCE' as const, fundCents: price - 60, expectBalance: price - 60, payMode: 'MIXED' },
      { name: '支付宝', payWith: 'ALIPAY' as const, fundCents: 0, expectBalance: null, payMode: 'ALIPAY' },
    ]
    const placed: Array<{ orderId: number; orderNo: string; userId: number; token: string }> = []
    for (const m of modes) {
      section(`${m.name}：没同意 / 旧版本一律 409 TERMS，不建单不预扣；同意后下单成功并留痕`)
      const u = await mkUser(m.payMode.toLowerCase())
      await fund(u.id, m.fundCents)
      const before = await prisma.user.findUniqueOrThrow({ where: { id: u.id }, select: { topupCents: true, balance: true } })

      const r0 = await post(u, base(m.payWith, m.expectBalance))
      check(
        '缺 agree / termsVersion / walletTermsVersion → 409 TERMS（不是 400），带回当前两个版本号，提示先阅读弹窗并勾选',
        r0.status === 409 && r0.json?.code === 'TERMS' && r0.json?.termsVersion === JIEMA_TERMS_VERSION && r0.json?.walletTermsVersion === WALLET_TERMS_VERSION && /勾选同意/.test(r0.json?.error ?? ''),
        `${r0.status} ${r0.text.slice(0, 200)}`,
      )
      const r1 = await post(u, { ...base(m.payWith, m.expectBalance), ...current, agree: false })
      check('agree=false → 409 TERMS（提示先阅读弹窗并勾选）', r1.status === 409 && r1.json?.code === 'TERMS' && /勾选同意/.test(r1.json?.error ?? ''), r1.text.slice(0, 200))
      const r2 = await post(u, { ...base(m.payWith, m.expectBalance), ...current, termsVersion: '2026-09-29' })
      check('《短信接码服务条款》旧版本 2026-09-29 → 409 TERMS（提示刷新页面）', r2.status === 409 && r2.json?.code === 'TERMS' && /刷新页面/.test(r2.json?.error ?? ''), r2.text.slice(0, 200))
      const r3 = await post(u, { ...base(m.payWith, m.expectBalance), ...current, walletTermsVersion: '2000-01-01' })
      check('《余额与充值规则》版本不对 → 409 TERMS', r3.status === 409 && r3.json?.code === 'TERMS', r3.text.slice(0, 200))
      const r4 = await post(u, { ...base(m.payWith, m.expectBalance), ...current, agree: 'yes' })
      check('agree 类型不对（"yes"）→ 400 BAD_REQUEST（格式校验）', r4.status === 400 && r4.json?.code === 'BAD_REQUEST', r4.text.slice(0, 200))
      const mid = await prisma.user.findUniqueOrThrow({ where: { id: u.id }, select: { topupCents: true, balance: true } })
      check(
        '被拒的几次：没有建任何接码单、没有预扣、余额不动',
        (await prisma.smsOrder.count({ where: { userId: u.id } })) === 0 &&
          (await prisma.balanceHold.count({ where: { userId: u.id } })) === 0 &&
          mid.topupCents === before.topupCents &&
          centsOf(mid.balance) === centsOf(before.balance),
      )

      const body = { ...base(m.payWith, m.expectBalance), ...current }
      const ok = await post(u, body)
      check(`同意后下单成功（payMode=${m.payMode}）`, ok.status === 200 && ok.json?.data?.payMode === m.payMode, `${ok.status} ${ok.text.slice(0, 300)}`)
      if (ok.status !== 200) continue
      const orderId = ok.json.data.orderId as number
      placed.push({ orderId, orderNo: ok.json.data.orderNo, userId: u.id, token: u.token })
      if (m.payMode === 'BALANCE') check('余额付清：next=NUMBER（不经过收银台）', ok.json.data.next === 'NUMBER')
      else check('组合 / 支付宝：next=CASHIER + payUrl', ok.json.data.next === 'CASHIER' && /^\/pay\//.test(ok.json.data.payUrl ?? ''))
      const so = await prisma.smsOrder.findUniqueOrThrow({ where: { orderId } })
      check('SmsOrder 记下当前两份条款版本', so.termsVersion === JIEMA_TERMS_VERSION && so.walletTermsVersion === WALLET_TERMS_VERSION)
      const evs = await eventsOf(orderId)
      const d = consent.parseConsentDetail(evs[0]?.detail)
      check(
        '恰好一条 TERMS_AGREED（actor BUYER、actorId 本人），detail 带条款版本与请求 IP',
        evs.length === 1 && evs[0].actor === 'BUYER' && evs[0].actorId === u.id && !!d && d.terms === JIEMA_TERMS_VERSION && d.walletTerms === WALLET_TERMS_VERSION && d.ip === IP,
        JSON.stringify(evs.map((e) => e.detail)),
      )
      check('UA 摘要：截到 200 个字符（以省略号结尾），开头与请求头一致', !!d?.ua && d.ua.length === 200 && d.ua.endsWith('…') && LONG_UA.startsWith(d.ua.slice(0, 199)))
      const created = await prisma.smsEvent.findFirst({ where: { smsOrderId: so.id, type: 'CREATED' } })
      check('留痕与 CREATED 同一事务写入（都在、时间相差不到 5 秒）', !!created && Math.abs(created.createdAt.getTime() - evs[0].createdAt.getTime()) < 5000)

      const again = await post(u, body)
      check('同一个 clientToken 重放：原样返回（reused），不重写留痕', again.status === 200 && again.json?.data?.reused === true && again.json.data.orderId === orderId && (await eventsOf(orderId)).length === 1)
      if (m.payMode === 'BALANCE') await settle(orderId)
      else {
        // 号码页「去支付」= 重新发起支付：不新建订单、不再弹窗；同意已在建单事务里留痕（§8.6）
        const pay = await callRoute(routePay.POST, { host: MAIN, token: u.token, method: 'POST', path: '/api/pay/vmq/create', body: { orderNo: ok.json.data.orderNo } })
        check(
          '重新发起支付（pay/vmq/create）：原样复用收银台，不新建接码单，TERMS_AGREED 仍只有建单时那一条',
          pay.status === 200 && pay.json?.data?.payUrl === ok.json.data.payUrl && (await prisma.smsOrder.count({ where: { userId: u.id } })) === 1 && (await eventsOf(orderId)).length === 1,
          `${pay.status} ${pay.text.slice(0, 200)}`,
        )
      }
    }

    // =====================================================================================
    section('直接调下单函数（脚本绕过弹窗）：没有同意标记照样 409；带了也留一条（ip / ua 为 null）')
    {
      const u = await mkUser('lib')
      const input = { service: 'tg', country: 6, operator: null, operatorFallback: true, expectPriceCents: price, payWith: 'ALIPAY' as const, clientToken: uuid() }
      const bad = await order.createJiemaOrder({ id: u.id, role: 'ADMIN' }, input)
      check('不带 agree / 版本 → 409 TERMS', !bad.ok && bad.status === 409 && bad.code === 'TERMS')
      const good = await order.createJiemaOrder({ id: u.id, role: 'ADMIN' }, { ...input, ...current })
      check('带当前版本与 agree=true → 成功', good.ok)
      if (good.ok) {
        const evs = await eventsOf(good.data.orderId)
        const d = consent.parseConsentDetail(evs[0]?.detail)
        check('TERMS_AGREED 一条，ip / ua 为 null', evs.length === 1 && !!d && d.ip === null && d.ua === null && d.terms === JIEMA_TERMS_VERSION)
        placed.push({ orderId: good.data.orderId, orderNo: good.data.orderNo, userId: u.id, token: u.token })
      }
    }

    // =====================================================================================
    section('后台接码订单详情：带条款同意留痕（时间、IP、UA、版本）；没有留痕的旧单为 null')
    {
      const first = placed[0]
      const so = await prisma.smsOrder.findUniqueOrThrow({ where: { orderId: first.orderId } })
      const det = await adminOrders.jiemaOrderDetailAdmin(so.id)
      const c = (det as { consent?: { at: string; ip: string | null; ua: string | null; terms: string; walletTerms: string; actorId: number | null } | null } | null)?.consent
      check('detail.consent：版本、IP、UA、时间、下单人', !!c && c.terms === JIEMA_TERMS_VERSION && c.walletTerms === WALLET_TERMS_VERSION && c.ip === IP && !!c.ua && !!c.at && c.actorId === first.userId, JSON.stringify(c))
      const last = placed[placed.length - 1]
      const so2 = await prisma.smsOrder.findUniqueOrThrow({ where: { orderId: last.orderId } })
      await prisma.smsEvent.deleteMany({ where: { smsOrderId: so2.id, type: consent.TERMS_AGREED_EVENT } })
      const det2 = await adminOrders.jiemaOrderDetailAdmin(so2.id)
      check('模拟 2026-09-30 之前的旧单（没有 TERMS_AGREED）：detail.consent = null', (det2 as { consent?: unknown } | null)?.consent === null)
    }

    // =====================================================================================
    section('清理口径：180 天前的事件照删，TERMS_AGREED 不删（与 api/cron/cleanup 同一个 where）')
    {
      const so = await prisma.smsOrder.findUniqueOrThrow({ where: { orderId: placed[0].orderId } })
      const old = new Date(Date.now() - 200 * 86400_000)
      const cutoff = new Date(Date.now() - 180 * 86400_000)
      const a = await prisma.smsEvent.create({ data: { smsOrderId: so.id, type: consent.TERMS_AGREED_EVENT, actor: 'BUYER', detail: '{"terms":"x"}', createdAt: old } })
      const b = await prisma.smsEvent.create({ data: { smsOrderId: so.id, type: 'STATE', actor: 'SYSTEM', detail: null, createdAt: old } })
      const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'api', 'cron', 'cleanup', 'route.ts'), 'utf8')
      check('cleanup 路由的接码事件删除条件排除 KEEP_EVENT_TYPES', /smsEvent\.findMany\(\{ where: \{ createdAt: \{ lt: smsEventCutoff \}, type: \{ notIn: \[\.\.\.KEEP_EVENT_TYPES\] \} \}/.test(src))
      const hit = await prisma.smsEvent.findMany({ where: { smsOrderId: so.id, createdAt: { lt: cutoff }, type: { notIn: [...consent.KEEP_EVENT_TYPES] } }, select: { id: true } })
      check('同一个 where：只命中 STATE，不命中 TERMS_AGREED', hit.length === 1 && hit[0].id === b.id && !hit.some((h) => h.id === a.id))
      await prisma.smsEvent.deleteMany({ where: { id: { in: [a.id, b.id] } } })
    }

    // =====================================================================================
    section('条款页：/jiema/terms 渲染全文与全部法条；渠道 Host 404；/terms 对全部用户开放时链到 /jiema/terms')
    {
      const txt = textOf(await withRequest({ host: MAIN }, () => JiemaTermsPage())).join('')
      check('免责声明要点全部出现', JIEMA_DISCLAIMER.every((x) => txt.includes(x)))
      check('第一节五条全部出现', JIEMA_TERMS.every((x) => txt.includes(x)))
      check('第二到六节每一条都出现', JIEMA_TERMS_SECTIONS.every((s) => txt.includes(s.heading) && s.items.every((x) => txt.includes(x))))
      check(`${LEGAL_ARTICLES.length} 条法条的原文、条号、版本（现行状态）、来源与现行文本链接都出现`, LEGAL_ARTICLES.every((a) => a.text.every((x) => txt.includes(x)) && txt.includes(a.article) && txt.includes(a.version) && txt.includes(a.source.name) && (!a.current || txt.includes(a.current.name))))
      check('写明版本号', txt.includes(JIEMA_TERMS_VERSION))
      const lulu = await createTenant('l')
      const ch = await withRequest({ host: lulu.host }, () => catchNext(() => JiemaTermsPage()))
      check('渠道 Host：/jiema/terms 404', ch.kind === 'notFound', ch.kind)
      await setCfg({ audience: 'ALL' })
      const termsEl = await withRequest({ host: MAIN }, () => TermsPage())
      const hrefs: string[] = []
      const walk = (el: unknown) => {
        if (!el || typeof el !== 'object') return
        if (Array.isArray(el)) return el.forEach(walk)
        const p = (el as { props?: Record<string, unknown> }).props
        if (!p) return
        if (typeof p.href === 'string') hrefs.push(p.href)
        Object.values(p).forEach(walk)
      }
      walk(termsEl)
      check('对全部用户开放：/terms 第四、五节链到 /jiema/terms', hrefs.filter((h) => h === JIEMA_TERMS_PATH).length >= 2, JSON.stringify(hrefs))
      await setCfg()
    }
  } finally {
    const orders = await prisma.order.findMany({ where: { userId: { in: userIds } }, select: { id: true } })
    const oids = orders.map((o) => o.id)
    for (const o of oids) {
      // 余额付清单会在后台取号：等在途的取号落地再删
      const so = await prisma.smsOrder.findUnique({ where: { orderId: o } })
      if (so) {
        for (let i = 0; i < 30 && (await prisma.smsAttempt.count({ where: { smsOrderId: so.id, state: 'REQUESTING' } })); i++) await sleep(300)
      }
    }
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
