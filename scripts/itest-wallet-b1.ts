/**
 * 短信接码 · B1 充值与载体订单框架 —— 数据库集成测试（会建数据、会删数据）。docs/短信接码-设计.md §12.2 中 B1 能覆盖的部分。
 *
 *   set -a; . ./.env.local; set +a; VMQ_KEY=itest npx tsx scripts/itest-wallet-b1.ts
 *
 * ⚠️ 只能对一次性的本地库跑：库名不含 dev / test 时直接拒绝执行。不调用任何真实上游（本包没有上游），企业微信推送打到本地假 webhook。
 *
 * 覆盖：
 *   · 第 18 条 充值：下单 → 到账 → 充值格 + 实付（含尾差）→ TOPUP 流水 → 订单 DELIVERED（不是 PROCESSING）、Payment ALIPAY tradeNo = 收款单号、
 *     载体销量不变、没有「订单已支付」推送；productName「余额充值 ¥x.00」、buyerRemark 为空、remark 以 topup|ct: 开头带条款版本
 *   · 第 57 条 不设总额上限：充值格已有大额时照样能充；第三笔待支付 → TOO_MANY_PENDING；¥1,001 / ¥12.5 → AMOUNT
 *   · 第 107 条 充值并发：5 个不同金额并发 → 待支付 ≤2；2 个同金额并发 → 同一张单、一个唯一金额；同一 clientToken → 同一张单
 *   · 第 90 条 发起收款失败 → 同一请求里关单、可以立刻再充；关单也失败的孤儿充值单 10 分钟后被 vmq-close 的清扫关掉（有 state=1 的不关）
 *   · 第 55 / 56 条 迟到到账：过了冷却期的不自动、手动退入（必填交易号、同一条目 / 同一交易号不能退两次、金额以条目实收为准、手输错要二次确认）
 *   · 第 97 条 自动退入的边界：duplicate_payment 指向付款凭证不自动；latepayAuto=false 全部留给站长；同一收款单第二条不再自动
 *   · 第 100 条 同一个码真付两次（maybe_duplicate）：必须勾「已核对账单」、填交易号，已付款的订单也放行；改指要 confirmMismatch
 *   · 第 101 条 类（充值单版）：「付完马上取消」→ no_pending_match →「数据验证唯一」自动退入（latepay_auto 一行、条目 auto=true）
 *   · 第 103 条「标记已处理」与退入并发：条件更新，不覆盖退入写下的 handledAs / tradeNo
 *   · E45 充值到账后入账失败：对账 3 分钟宽限后按同一张收款单补做；「已到账 + 已关闭」的载体单补记 duplicate_payment 并自动退入（只补一次）
 *   · manualComplete 对载体单拒绝（收款单状态不被改动）；assertShopOrderBillable 对载体单拒绝（「暂不支持开票，可联系客服开票处理」）
 *   · 应付统一函数：有 HELD 预扣时 createOrGetVmqOrder 的锁内复核按「应付 − 预扣」收款，按全额发起的被拒
 *   · 第 92 条（库层）：会员累计消费不含充值单；钱包累计充值、迟到退入横幅、充值单状态接口
 *   · W6 / W7 / W9：本测试的数据不新增对账问题
 */
import http from 'http'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { PrismaClient, Prisma } from '@prisma/client'

const url = process.env.DATABASE_URL || ''
const dbName = url.split('/').pop()?.split('?')[0] || ''
if (!/dev|test/i.test(dbName)) {
  console.error(`拒绝执行：数据库「${dbName}」看起来不是一次性测试库（库名须含 dev 或 test）`)
  process.exit(2)
}
if (!process.env.VMQ_KEY) process.env.VMQ_KEY = 'itest'
for (const k of ['ALIYUN_ACCESS_KEY_ID', 'ALIYUN_ACCESS_KEY_SECRET', 'ALIYUN_DM_ACCOUNT', 'ALIYUN_DM_NOREPLY', 'ORDER_MSG_WEBHOOK_URL', 'NOTIFY_EVENTS']) delete process.env[k]

const prisma = new PrismaClient()
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
const TAG = `iwb1${Date.now().toString(36)}`
const D = (n: number) => new Prisma.Decimal(n.toFixed(2))
const uuid = () => crypto.randomUUID()
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function main() {
  // ---- 假企业微信 webhook：收推送，断言「没有订单已支付」「自动退入有知会」 ----
  const bodies: string[] = []
  const srv = http.createServer((req, res) => {
    let b = ''
    req.on('data', (c) => (b += c))
    req.on('end', () => {
      bodies.push(b)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end('{"errcode":0}')
    })
  })
  await new Promise<void>((r) => srv.listen(0, '127.0.0.1', () => r()))
  const savedHook = process.env.WECOM_WEBHOOK_URL
  process.env.WECOM_WEBHOOK_URL = `http://127.0.0.1:${(srv.address() as { port: number }).port}/cgi-bin/webhook/send?key=itest`

  const vmq = await import('../src/lib/vmq')
  const topup = await import('../src/lib/wallet/topup')
  const latepay = await import('../src/lib/wallet/latepay')
  const checkout = await import('../src/lib/topup-checkout')
  const config = await import('../src/lib/wallet/config')
  const reconcile = await import('../src/lib/wallet/reconcile')
  const dto = await import('../src/lib/wallet/dto')
  const hold = await import('../src/lib/wallet/hold')
  const ledger = await import('../src/lib/wallet/ledger')
  const vipServer = await import('../src/lib/vip-server')
  const orderInvoice = await import('../src/lib/order-invoice')
  const payable = await import('../src/lib/order-payable')
  const scope = await import('../src/lib/order-scope')
  const { centsOf } = await import('../src/lib/wallet/buckets')
  const { WALLET_TERMS_VERSION } = await import('../src/lib/terms/jiema-wallet')

  // ---- 备份会被改动的 settings ----
  const KEEP_KEYS = ['wallet_config', 'vmq_lastpay', 'vmq_lastunmatched', 'vmq_recentraw', 'vmq_lastheart', reconcile.RECONCILE_LAST_KEY]
  const savedSettings = await prisma.setting.findMany({ where: { key: { in: KEEP_KEYS } } })
  const unmatchedBefore = new Set((await prisma.setting.findMany({ where: { key: { startsWith: 'vmq_unmatched:' } }, select: { key: true } })).map((s) => s.key))
  const baseline = await reconcile.runWalletReconcile({ full: true, alert: false, save: false })
  const baseSamples = (code: string) => new Set(baseline.items.find((i) => i.code === code)?.samples ?? [])

  const userIds: number[] = []
  const createdSettingKeys: string[] = []
  let seededCarrier: { productId: number; categoryId: number | null } | null = null
  const extraProducts: number[] = []
  let extraCat: number | null = null

  try {
    // ---- 载体商品：库里没有就跑种子 SQL（第 5.4 节），结束时删掉；已有就用现成的 ----
    console.log('\n【TOPUP 载体商品：种子 SQL 可重复执行、恰好 1 行】')
    {
      const runSql = async (file: string) => {
        const sql = fs.readFileSync(path.join(__dirname, 'ops', file), 'utf8')
        const stmts = sql
          .split('\n')
          .filter((l) => !/^\s*--/.test(l))
          .join('\n')
          .split(/;\s*(?:\n|$)/)
          .map((x) => x.trim())
          .filter(Boolean)
        const out: unknown[][] = []
        for (const st of stmts) {
          if (/^SELECT\b/i.test(st)) out.push((await prisma.$queryRawUnsafe(st)) as unknown[])
          else await prisma.$executeRawUnsafe(st)
        }
        return out
      }
      const before = await prisma.product.findMany({ where: { deliveryType: 'TOPUP' }, select: { id: true } })
      const catBefore = await prisma.category.findFirst({ where: { name: '系统（勿删）' }, select: { id: true } })
      if (before.length === 0) {
        await runSql('wallet-b1-seed.sql')
        const after = await prisma.product.findMany({ where: { deliveryType: 'TOPUP' } })
        seededCarrier = { productId: after[0]?.id ?? 0, categoryId: catBefore ? null : (await prisma.category.findFirst({ where: { name: '系统（勿删）' } }))?.id ?? null }
        ok('种子：建出恰好 1 行 TOPUP 载体（下架、价格 0、库存无限）', after.length === 1 && after[0].status === 0 && centsOf(after[0].price) === 0 && after[0].stock === -1)
        await runSql('wallet-b1-seed.sql')
        ok('种子再跑一次：不重复建', (await prisma.product.count({ where: { deliveryType: 'TOPUP' } })) === 1 && (await prisma.category.count({ where: { name: '系统（勿删）' } })) === 1)
      } else {
        ok(`库里已有 ${before.length} 行 TOPUP 载体（沿用）`, before.length === 1)
      }
      topup.resetTopupCarrierCacheForTest()
    }
    const carrierId = (await topup.topupCarrierId())!
    ok('topupCarrierId 找到载体', !!carrierId)
    const carrierSales0 = (await prisma.product.findUniqueOrThrow({ where: { id: carrierId } })).sales

    // ---- 配置：打开充值（仅管理员） ----
    await prisma.setting.upsert({
      where: { key: 'wallet_config' },
      create: { key: 'wallet_config', value: JSON.stringify({ ...config.FACTORY_WALLET_CONFIG, topupEnabled: true }) },
      update: { value: JSON.stringify({ ...config.FACTORY_WALLET_CONFIG, topupEnabled: true }) },
    })

    const mkUser = async (name: string, role: 'USER' | 'ADMIN' = 'ADMIN') => {
      const u = await prisma.user.create({ data: { email: `${TAG}-${name}@test.local`, passwordHash: 'x', nickname: `${TAG}-${name}`, role } })
      userIds.push(u.id)
      return u
    }
    const buckets = async (userId: number) => {
      const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { balance: true, topupCents: true } })
      return { topup: u.topupCents, cash: centsOf(u.balance) }
    }
    /** 选一个「近期没人用过」的整数元金额：保证收款单实付 = 基础金额、与任何在途 / 已关闭的收款单都不同额（数据验证唯一要用） */
    const usedYuan = new Set<number>()
    const freeYuan = async (): Promise<number> => {
      for (let y = 101; y < 1000; y++) {
        if (usedYuan.has(y)) continue
        const n = await prisma.vmqOrder.count({ where: { reallyPrice: { gte: D(y), lt: D(y + 0.5) } } })
        if (n === 0) {
          usedYuan.add(y)
          return y
        }
      }
      throw new Error('找不到空闲金额')
    }
    const newEntries = async () =>
      (await prisma.setting.findMany({ where: { key: { startsWith: 'vmq_unmatched:' } }, orderBy: { key: 'asc' }, select: { key: true } }))
        .map((s) => s.key)
        .filter((k) => !unmatchedBefore.has(k) && !createdSettingKeys.includes(k))
    const takeNewEntry = async (): Promise<string | null> => {
      const ks = await newEntries()
      for (const k of ks) createdSettingKeys.push(k)
      return ks.length ? ks[ks.length - 1] : null
    }
    const raw = (x: string) => `你已成功收款${x}元（${TAG}-${uuid()}）`
    const vmqOf = async (orderId: number) => {
      return prisma.vmqOrder.findFirstOrThrow({ where: { bizType: 'order', bizId: orderId }, orderBy: { id: 'desc' } })
    }
    const start = async (user: { id: number; role: string }, amountCents: number, extra: { token?: string; returnTo?: string } = {}) => {
      return checkout.startTopup({ id: user.id, role: user.role }, { amountCents, clientToken: extra.token ?? uuid(), termsVersion: WALLET_TERMS_VERSION, returnTo: extra.returnTo })
    }
    /** 模拟「买家点了取消 / 收款单被作废」之后订单关闭：收款单 −1、充值单 UNPAID + CANCELLED */
    const closeNow = async (orderId: number) => {
      const v = await vmqOf(orderId)
      await vmq.discardVmqOrder(v.orderId)
      const r = await topup.closeUnpaidTopup(orderId)
      if (r !== 'CLOSED') throw new Error(`关单失败 ${r}`)
      return prisma.vmqOrder.findUniqueOrThrow({ where: { id: v.id } })
    }
    const ctx = { timeoutMin: vmq.VMQ_TIMEOUT_MIN, cooldownMin: vmq.VMQ_REUSE_COOLDOWN_MIN }

    const admin = await mkUser('adm')
    const plain = await mkUser('usr', 'USER')

    console.log('\n【开关与受众（仅管理员）、金额与条款校验】')
    {
      ok('普通用户：充值未开放（仅管理员）', (await checkout.topupAvailability(plain)) === null)
      const r0 = await start(plain, 1000)
      ok('  …普通用户发起：503 TOPUP_OFF', !r0.ok && r0.status === 503 && r0.code === 'TOPUP_OFF')
      ok('管理员：开放', !!(await checkout.topupAvailability(admin)))
      for (const [v, why] of [[1250, '¥12.5'], [100100, '¥1,001'], [50, '¥0.5'], [0, '0']] as [number, string][]) {
        const r = await start(admin, v)
        ok(`${why} → 400 AMOUNT「请输入 1–1000 之间的整数金额」`, !r.ok && r.status === 400 && r.code === 'AMOUNT' && r.message === '请输入 1–1000 之间的整数金额')
      }
      const rt = await checkout.startTopup(admin, { amountCents: 1000, clientToken: uuid(), termsVersion: '1999-01-01' })
      ok('条款版本不是代码常量 → 409 TERMS', !rt.ok && rt.code === 'TERMS')
      const rb = await checkout.startTopup(admin, { amountCents: 1000, clientToken: 'not-uuid', termsVersion: WALLET_TERMS_VERSION })
      ok('clientToken 不是 UUID → 400', !rb.ok && rb.status === 400)
      ok('这些都没有建任何充值单', (await prisma.order.count({ where: { userId: { in: [admin.id, plain.id] } } })) === 0)
      await prisma.setting.update({ where: { key: 'wallet_config' }, data: { value: JSON.stringify({ ...config.FACTORY_WALLET_CONFIG, topupEnabled: true, maxCents: 50000 }) } })
      const rl = await start(admin, 50100)
      ok('maxCents 调成 ¥500：¥501 → 400，文案「请输入 1–500 之间的整数金额」', !rl.ok && rl.code === 'AMOUNT' && rl.message === '请输入 1–500 之间的整数金额' && (rl as { maxCents?: number }).maxCents === 50000)
      await prisma.setting.update({ where: { key: 'wallet_config' }, data: { value: JSON.stringify({ ...config.FACTORY_WALLET_CONFIG, topupEnabled: true }) } })
      await prisma.setting.update({ where: { key: 'wallet_config' }, data: { value: '{bad json' } })
      const rc = await start(admin, 1000)
      ok('wallet_config 损坏：充值 fail-closed（503 TOPUP_OFF）', !rc.ok && rc.code === 'TOPUP_OFF')
      await prisma.setting.update({ where: { key: 'wallet_config' }, data: { value: JSON.stringify({ ...config.FACTORY_WALLET_CONFIG, topupEnabled: true }) } })
    }

    console.log('\n【第 18 条 充值：下单 → 到账 → 充值格 + 实付、订单 DELIVERED、无推送】')
    let paidOrderId = 0
    let paidVmq: Awaited<ReturnType<typeof vmqOf>> | null = null
    {
      const y = await freeYuan()
      const tok = uuid()
      const r = await start(admin, y * 100, { token: tok, returnTo: '/jiema?s=tg&c=6&confirm=1' })
      ok('发起成功：返回 orderNo 与 /pay/<收款单号>', r.ok && /^\/pay\/\w+$/.test(r.payUrl))
      if (!r.ok) throw new Error('无法继续')
      const o = await prisma.order.findUniqueOrThrow({ where: { orderNo: r.orderNo }, include: { product: true } })
      paidOrderId = o.id
      ok('订单挂在 TOPUP 载体上、主站、UNPAID/PENDING', o.productId === carrierId && o.tenantId === 1 && o.payStatus === 'UNPAID' && o.deliveryStatus === 'PENDING')
      ok(`productName「余额充值 ¥${y}.00」、amount = 充值额（整数元）`, o.productName === `余额充值 ¥${y}.00` && centsOf(o.amount) === y * 100 && centsOf(o.productPrice) === y * 100)
      ok('buyerRemark 为空（内部 remark 不当成买家备注）', o.buyerRemark === null)
      ok('remark 以 topup|ct: 开头、带条款版本与回跳', !!o.remark && o.remark.startsWith(`topup|ct:${tok}|terms:${WALLET_TERMS_VERSION}`) && o.remark.includes('|return:/jiema?s=tg&c=6&confirm=1'))
      ok('不写 referrer / coupon / 发票', o.referrerId === null && o.couponGrantId === null && o.invoiceTaxFee === null && o.invoiceInfo === null)
      const v = await vmqOf(o.id)
      ok('收款单：应付 = 充值额、实付 = 充值额（金额空闲）', centsOf(v.price) === y * 100 && centsOf(v.reallyPrice) === y * 100 && v.state === 0 && r.payUrl === `/pay/${v.orderId}`)
      ok('充值单状态接口：PENDING', (await topup.topupStatusFor(admin.id, o.orderNo))?.state === 'PENDING')
      const pd = await checkout.topupPageData(admin)
      ok('GET 数据：档位 / 上下限按配置、待支付列表里有它（带收银台地址）', pd.enabled && JSON.stringify(pd.tiersCents) === '[500,1000,1500,2000,5000]' && pd.minCents === 100 && pd.maxCents === 100000 && !!pd.pending?.some((p) => p.orderNo === o.orderNo && p.payUrl === r.payUrl))
      ok('  …条款已同意过（本单 remark 带当前版本）', pd.termsAgreed === true)
      const again = await start(admin, y * 100, { token: tok })
      ok('同一个 clientToken 再提交：同一张单、同一张收款单', again.ok && again.orderNo === o.orderNo && again.payUrl === r.payUrl)
      const same = await start(admin, y * 100)
      ok('同金额、不同 clientToken：复用同一张单（不占第二个唯一金额）', same.ok && same.orderNo === o.orderNo)
      ok('  …这张单只有一张待支付收款单', (await prisma.vmqOrder.count({ where: { bizType: 'order', bizId: o.id, state: 0 } })) === 1)

      const b0 = await buckets(admin.id)
      const nBefore = bodies.length
      const matched = await vmq.markPaidByAmount(`${y}.00`, 2, raw(`${y}.00`))
      await sleep(400)
      const o2 = await prisma.order.findUniqueOrThrow({ where: { id: o.id } })
      const b1 = await buckets(admin.id)
      ok('到账匹配成功', matched === true)
      ok('订单 PAID + DELIVERED（不是 PROCESSING）、有 deliveredAt、payMethod=ALIPAY', o2.payStatus === 'PAID' && o2.deliveryStatus === 'DELIVERED' && !!o2.deliveredAt && o2.payMethod === 'ALIPAY')
      ok('充值格 + 实付、返现格不动', b1.topup - b0.topup === centsOf(v.reallyPrice) && b1.cash === b0.cash)
      const log = await prisma.balanceLog.findUnique({ where: { bizKey: `topup:${o.id}` } })
      ok('一条 TOPUP 流水（topup:<orderId>、只动充值格、orderId 对）', !!log && log.type === 'TOPUP' && log.topupDeltaCents === centsOf(v.reallyPrice) && centsOf(log.delta) === 0 && log.orderId === o.id)
      const pays = await prisma.payment.findMany({ where: { orderId: o.id } })
      ok('Payment 一行 ALIPAY、金额 = 充值额、tradeNo = 收款单号', pays.length === 1 && pays[0].payMethod === 'ALIPAY' && centsOf(pays[0].amount) === y * 100 && pays[0].tradeNo === v.orderId && pays[0].status === 1)
      ok('载体商品销量不变（资金事务不写载体商品行）', (await prisma.product.findUniqueOrThrow({ where: { id: carrierId } })).sales === carrierSales0)
      ok('没有「订单已支付」推送、没有 wallet.topup（可选事件默认不推）', !bodies.slice(nBefore).some((b) => b.includes('订单已支付') || b.includes('余额充值到账')))
      const st = await topup.topupStatusFor(admin.id, o.orderNo)
      ok('充值单状态接口：CREDITED、入账额 = 实付、带回跳', st?.state === 'CREDITED' && st.creditedCents === centsOf(v.reallyPrice) && st.returnTo === '/jiema?s=tg&c=6&confirm=1')
      ok('别人查这张充值单：null（404）', (await topup.topupStatusFor(plain.id, o.orderNo)) === null)
      const again2 = await vmq.fulfillOrder(o.id, { via: 'VMQ', vmqId: v.id })
      ok('重复履约：不是赢家、余额不再加', again2 === false && (await buckets(admin.id)).topup === b1.topup)
      let threw = false
      try {
        await vmq.fulfillOrder(o.id)
      } catch {
        threw = true
      }
      ok('载体单不带 via 调 fulfillOrder：抛错（fail closed）', threw)
      ok('会员累计消费不含充值单（userPaidSpend）', (await vipServer.userPaidSpend(admin.id)).paidCount === 0)
      ok('excludeTopup：这个用户的已付款订单数为 0', (await prisma.order.count({ where: { userId: admin.id, payStatus: 'PAID', ...scope.excludeTopup() } })) === 0)
      let billErr: { status?: number; message?: string } | null = null
      try {
        await orderInvoice.assertShopOrderBillable(o.id)
      } catch (e) {
        billErr = e as { status: number; message: string }
      }
      ok('开票 / 收据的库层闸：载体单 409「暂不支持开票，可联系客服开票处理」', billErr?.status === 409 && billErr?.message === '暂不支持开票，可联系客服开票处理')
      const wv = await dto.buildWalletView({ id: admin.id, role: 'ADMIN' }, {})
      ok('钱包：累计充值 = 实付、[充值] 按钮出现（管理员）、开票一句出现', wv.totals?.topupIn === centsOf(v.reallyPrice) && wv.topupOpen && wv.showInvoiceNotice)
      ok('钱包流水：「充值」、ref 是「余额充值 · 打码单号」', wv.logs[0]?.type === 'TOPUP' && wv.logs[0]?.ref?.kind === 'TOPUP' && wv.logs[0]?.ref?.title === '余额充值')
      paidVmq = v

      // manualComplete 对载体单直接拒绝，收款单状态不动
      let mc = ''
      try {
        await vmq.manualComplete(v.id)
      } catch (e) {
        mc = (e as Error).message
      }
      ok('「确认到账补单」对充值单：拒绝（提示用「退入买家余额」）', mc.includes('退入买家余额'))
    }

    console.log('\n【第 57、107 条：不设总额上限；待支付 ≤2；并发】')
    {
      const u = await mkUser('pend')
      // 充值格已有很多钱（后台补偿）
      await ledger.inMoneyTx((tx) => ledger.postInTx(tx, { userId: u.id, topupDeltaCents: 500000, type: 'ADJUST', bizKey: `adj:${TAG}-big`, note: 'itest' }))
      const a = await start(u, (await freeYuan()) * 100)
      const b = await start(u, 100000)
      ok('充值格已有 ¥5,000：再充 ¥1,000 照样成功（不设总额上限）', a.ok && b.ok)
      const c = await start(u, (await freeYuan()) * 100)
      ok('第三笔待支付 → 409 TOO_MANY_PENDING', !c.ok && c.status === 409 && c.code === 'TOO_MANY_PENDING')
      // 并发：新用户 5 个不同金额
      const u2 = await mkUser('conc')
      const amounts = [await freeYuan(), await freeYuan(), await freeYuan(), await freeYuan(), await freeYuan()]
      const rs = await Promise.all(amounts.map((y) => start(u2, y * 100)))
      const pend = await prisma.order.count({ where: { userId: u2.id, payStatus: 'UNPAID', deliveryStatus: { not: 'CANCELLED' } } })
      ok('并发 5 个不同金额：成功 2 个、其余 TOO_MANY_PENDING，待支付 ≤2', rs.filter((r) => r.ok).length === 2 && pend === 2 && rs.filter((r) => !r.ok).every((r) => !r.ok && r.code === 'TOO_MANY_PENDING'), JSON.stringify(rs.map((r) => (r.ok ? 'ok' : r.code))))
      const u3 = await mkUser('conc2')
      const y3 = await freeYuan()
      const r3 = await Promise.all([start(u3, y3 * 100), start(u3, y3 * 100)])
      const o3 = await prisma.order.findMany({ where: { userId: u3.id } })
      ok('并发 2 个同金额：同一张单、一张收款单', r3.every((r) => r.ok) && o3.length === 1 && (await prisma.vmqOrder.count({ where: { bizType: 'order', bizId: o3[0].id } })) === 1 && r3[0].ok && r3[1].ok && r3[0].payUrl === r3[1].payUrl)
    }

    console.log('\n【第 90 条：发起收款失败 → 同一请求关单；孤儿充值单被 vmq-close 清扫】')
    {
      const u = await mkUser('fault')
      checkout.setTopupPayFaultForTest(() => {
        throw new vmq.VmqError('当前下单人数较多，请稍后重试')
      })
      const y = await freeYuan()
      const r = await start(u, y * 100)
      checkout.setTopupPayFaultForTest(null)
      const o = await prisma.order.findFirst({ where: { userId: u.id } })
      ok('注入「金额池满」：503 BUSY、文案「这笔充值没有生成」', !r.ok && r.status === 503 && r.code === 'BUSY' && r.message.includes('没有生成'))
      ok('  …充值单在同一请求里关掉（UNPAID + CANCELLED）、没有收款单', !!o && o.payStatus === 'UNPAID' && o.deliveryStatus === 'CANCELLED' && (await prisma.vmqOrder.count({ where: { bizType: 'order', bizId: o.id } })) === 0)
      const r2 = await start(u, y * 100)
      ok('  …买家可以立刻再充（关掉的不算待支付）', r2.ok)
      // 孤儿：建了单、没有收款单（请求中途崩溃）
      const orphan = await topup.createTopupOrder({ userId: u.id, carrierId, amountCents: (await freeYuan()) * 100, clientToken: uuid(), termsVersion: WALLET_TERMS_VERSION, returnTo: null, pendingLimit: 2 })
      const paidOrphan = await topup.createTopupOrder({ userId: (await mkUser('orph2')).id, carrierId, amountCents: (await freeYuan()) * 100, clientToken: uuid(), termsVersion: WALLET_TERMS_VERSION, returnTo: null, pendingLimit: 2 })
      if (!orphan.ok || !paidOrphan.ok) throw new Error('建孤儿单失败')
      // 第二张：有一张 state=1 的收款单（钱到了、履约还没做）→ 清扫不能关
      const vv = await prisma.vmqOrder.create({ data: { orderId: `${TAG}v${Date.now()}`, bizType: 'order', bizId: paidOrphan.orderId, outTradeNo: paidOrphan.orderNo, price: D(1), reallyPrice: D(1), state: 1, payDate: new Date() } })
      const s0 = await topup.sweepOrphans()
      ok('建单不到 10 分钟：清扫不动它', (await prisma.order.findUniqueOrThrow({ where: { id: orphan.orderId } })).deliveryStatus !== 'CANCELLED' && s0.closed === 0)
      await prisma.order.updateMany({ where: { id: { in: [orphan.orderId, paidOrphan.orderId] } }, data: { createdAt: new Date(Date.now() - 11 * 60_000) } })
      const s1 = await topup.sweepOrphans()
      ok('建单超过 10 分钟、没有收款单：清扫关掉', (await prisma.order.findUniqueOrThrow({ where: { id: orphan.orderId } })).deliveryStatus === 'CANCELLED' && s1.closed >= 1)
      ok('  …有 state=1 收款单的不关（等对账补履约）', (await prisma.order.findUniqueOrThrow({ where: { id: paidOrphan.orderId } })).deliveryStatus !== 'CANCELLED')
      await prisma.vmqOrder.delete({ where: { id: vv.id } })
      await topup.closeUnpaidTopup(paidOrphan.orderId)
    }

    console.log('\n【每人待付款收款单 ≤3（含普通商品）：超了不建收款单、充值单当场关】')
    {
      const u = await mkUser('open3')
      extraCat = (await prisma.category.create({ data: { name: `${TAG}-cat`, status: 0 } })).id
      const p = await prisma.product.create({ data: { categoryId: extraCat, name: `${TAG}-manual`, price: D(3), stock: -1, deliveryType: 'MANUAL', status: 1 } })
      extraProducts.push(p.id)
      for (let i = 0; i < 3; i++) {
        const o = await prisma.order.create({ data: { orderNo: `${TAG.toUpperCase()}O${i}`.slice(0, 32), userId: u.id, productId: p.id, productName: p.name, productPrice: D(3), quantity: 1, amount: D(3) } })
        await vmq.createOrGetVmqOrder({ bizType: 'order', bizId: o.id, outTradeNo: o.orderNo, price: 3 })
      }
      const r = await start(u, (await freeYuan()) * 100)
      ok('已有 3 张待付款收款单：429 OPEN_PAYMENTS（提示里有「余额充值」页）', !r.ok && r.status === 429 && r.code === 'OPEN_PAYMENTS' && r.message.includes('余额充值'))
      const t = await prisma.order.findFirst({ where: { userId: u.id, productId: carrierId } })
      ok('  …充值单当场关掉、没有收款单', !!t && t.deliveryStatus === 'CANCELLED' && (await prisma.vmqOrder.count({ where: { bizType: 'order', bizId: t.id } })) === 0)
    }

    console.log('\n【closeExpired：充值单收银台超时 → 关单、无流水】')
    {
      const u = await mkUser('exp')
      const r = await start(u, (await freeYuan()) * 100)
      if (!r.ok) throw new Error('建单失败')
      const o = await prisma.order.findUniqueOrThrow({ where: { orderNo: r.orderNo } })
      await prisma.vmqOrder.updateMany({ where: { bizType: 'order', bizId: o.id }, data: { createdAt: new Date(Date.now() - (vmq.VMQ_TIMEOUT_MIN + 1) * 60_000) } })
      await vmq.closeExpired()
      const o2 = await prisma.order.findUniqueOrThrow({ where: { id: o.id } })
      ok('收款单 −1、充值单 UNPAID + CANCELLED、没有任何流水', o2.payStatus === 'UNPAID' && o2.deliveryStatus === 'CANCELLED' && (await vmqOf(o.id)).state === -1 && (await prisma.balanceLog.count({ where: { userId: u.id } })) === 0)
      ok('充值单状态接口：CLOSED', (await topup.topupStatusFor(u.id, o.orderNo))?.state === 'CLOSED')
      const again = await start(u, centsOf(o.amount), { token: undefined })
      ok('关掉的单：同金额再充会建新单（不复用已关闭的）', again.ok && again.orderNo !== o.orderNo)
    }

    console.log('\n【第 101 条（充值单版）：付完马上取消 → no_pending_match → 数据验证唯一 → 自动退入】')
    let autoKey = ''
    let autoVmq: Awaited<ReturnType<typeof vmqOf>> | null = null
    {
      const u = await mkUser('late1')
      const r = await start(u, (await freeYuan()) * 100)
      if (!r.ok) throw new Error('建单失败')
      const o = await prisma.order.findUniqueOrThrow({ where: { orderNo: r.orderNo } })
      const C = await closeNow(o.id)
      const b0 = await buckets(u.id)
      const nBefore = bodies.length
      const price = centsOf(C.reallyPrice) / 100
      await vmq.markPaidByAmount(price.toFixed(2), 2, raw(price.toFixed(2)))
      await sleep(400)
      const key = (await takeNewEntry())!
      const e = await latepay.readEntry(key)
      const b1 = await buckets(u.id)
      ok('条目原因 no_pending_match', e?.reason === 'no_pending_match')
      ok('自动退入：充值格 + 条目实收、条目 LATEPAY + auto + orderId + 收款单号', b1.topup - b0.topup === centsOf(C.reallyPrice) && e?.handledAs === 'LATEPAY' && e.auto === true && e.orderId === o.id && e.latepayVmq === C.orderId && !!e.handledAt)
      const mark = await prisma.setting.findUnique({ where: { key: `latepay_auto:${C.orderId}` } })
      ok('  …latepay_auto:<收款单号> 一行、指向条目', mark?.value === key)
      createdSettingKeys.push(`latepay_auto:${C.orderId}`)
      const lg = await prisma.balanceLog.findUnique({ where: { bizKey: `latepay:${key}` } })
      ok('  …一条 LATEPAY 流水（只进充值格）', !!lg && lg.type === 'LATEPAY' && lg.topupDeltaCents === centsOf(C.reallyPrice) && centsOf(lg.delta) === 0 && lg.orderId === o.id)
      const o2 = await prisma.order.findUniqueOrThrow({ where: { id: o.id } })
      ok('  …订单保持关闭（不复活、没有 Payment）', o2.payStatus === 'UNPAID' && o2.deliveryStatus === 'CANCELLED' && (await prisma.payment.count({ where: { orderId: o.id } })) === 0)
      ok('  …充值单不写订单留言', (await prisma.orderMessage.count({ where: { orderId: o.id } })) === 0)
      ok('  …推了一条 wallet.alert「已自动处理」', bodies.slice(nBefore).some((b) => b.includes('迟到付款已自动退入')))
      const wv = await dto.buildWalletView({ id: u.id }, {})
      ok('  …钱包 recentLateCredits 有这一笔（充值单、打码单号）', wv.recentLateCredits.length === 1 && wv.recentLateCredits[0].cents === centsOf(C.reallyPrice) && wv.recentLateCredits[0].ref?.kind === 'TOPUP' && wv.recentLateCredits[0].ref?.orderNoMasked.includes('*') === true)
      ok('  …累计退回含它', wv.totals?.refunded === centsOf(C.reallyPrice))
      autoKey = key
      autoVmq = C
      // 同一张收款单的第二条通知（超过 1 分钟、原文不同）：latepay_auto 已占 → 不再自动退
      await vmq.markPaidByAmount(price.toFixed(2), 2, raw(price.toFixed(2)))
      const key2 = (await takeNewEntry())!
      const e2 = await latepay.readEntry(key2)
      ok('同一张收款单的第二条到账：不再自动退、条目留给站长', !e2?.handledAt && (await buckets(u.id)).topup === b1.topup)
      ok('  …它涉及载体单（「标记已处理」要选 OFFLINE / IGNORE）', await latepay.entryInvolvesCarrier(e2!))
      // B1 评审修复（§2.7「页面同时列出之前那几笔」）：候选带上这张订单之前的退入逐笔——自动退入的那一笔（金额、收款单号、条目）
      const cand = await latepay.latepayCandidates(e2!)
      const co = cand.list.find((c) => c.orderNo === o.orderNo)
      ok(
        '  …「退入买家余额」的候选列出之前那一笔自动退入（金额、自动、收款单号、条目 key）',
        !!co && co.priorLatepay === 1 && co.priorList.length === 1 && co.priorList[0].cents === centsOf(C.reallyPrice) && co.priorList[0].auto && co.priorList[0].vmqOrderNo === C.orderId && co.priorList[0].entryKey === key,
      )
    }

    console.log('\n【第 55 / 56 条：过了冷却期的迟到到账 → 不自动 → 手动退入（必填交易号、只退一次）】')
    {
      const u = await mkUser('late2')
      const r = await start(u, (await freeYuan()) * 100)
      if (!r.ok) throw new Error('建单失败')
      const o = await prisma.order.findUniqueOrThrow({ where: { orderNo: r.orderNo } })
      const C = await closeNow(o.id)
      // 收款单建单 36 分钟之后才付（超时 20 + 冷却 15 之后）
      await prisma.vmqOrder.update({ where: { id: C.id }, data: { createdAt: new Date(Date.now() - 36 * 60_000) } })
      const price = (centsOf(C.reallyPrice) / 100).toFixed(2)
      const b0 = await buckets(u.id)
      await vmq.markPaidByAmount(price, 2, raw(price))
      const key = (await takeNewEntry())!
      const e = await latepay.readEntry(key)
      ok('no_pending_match、没有自动退（冷却期已过）', e?.reason === 'no_pending_match' && !e.handledAt && (await buckets(u.id)).topup === b0.topup)
      const cand = await latepay.latepayCandidates(e!)
      ok('候选里有这张已关闭的充值单、恰好一个 → 建议它', cand.list.some((c) => c.orderNo === o.orderNo && c.closed) && cand.suggest === o.orderNo)
      let err = ''
      try {
        await latepay.manualCredit({ key, orderNo: o.orderNo, tradeNo: '', adminId: admin.id })
      } catch (x) {
        err = (x as InstanceType<typeof latepay.LatepayError>).code
      }
      ok('不填交易号 → 拒绝（TRADE_NO）', err === 'TRADE_NO')
      const tradeNo = `2026${Date.now()}${Math.floor(Math.random() * 1e6)}`.slice(0, 28)
      const res = await latepay.manualCredit({ key, orderNo: o.orderNo, tradeNo, adminId: admin.id })
      const e2 = await latepay.readEntry(key)
      ok('填交易号退入：充值格 + 条目实收、条目 LATEPAY + tradeNo + orderId', res.cents === centsOf(C.reallyPrice) && (await buckets(u.id)).topup - b0.topup === res.cents && e2?.handledAs === 'LATEPAY' && e2.tradeNo === tradeNo && e2.orderId === o.id && !e2.auto)
      createdSettingKeys.push(`latepay_trade:${tradeNo}`)
      ok('  …settings 多一行 latepay_trade:<交易号>', (await prisma.setting.findUnique({ where: { key: `latepay_trade:${tradeNo}` } }))?.value === key)
      ok('  …写了审计（wallet.latepay）', (await prisma.auditEvent.count({ where: { action: 'wallet.latepay', targetId: o.orderNo } })) === 1)
      err = ''
      try {
        await latepay.manualCredit({ key, orderNo: o.orderNo, tradeNo: `${tradeNo}1`, adminId: admin.id })
      } catch (x) {
        err = (x as InstanceType<typeof latepay.LatepayError>).code
      }
      ok('同一条目再退 → 拒绝（ALREADY_HANDLED）', err === 'ALREADY_HANDLED')
      // 同一笔真付第二次（原文不同）→ 新条目；拿同一个交易号 → 拒绝；换交易号但订单已退入过 → 要「已核对账单」
      await vmq.markPaidByAmount(price, 2, raw(price))
      const key2 = (await takeNewEntry())!
      err = ''
      try {
        await latepay.manualCredit({ key: key2, orderNo: o.orderNo, tradeNo, adminId: admin.id, confirmBillChecked: true })
      } catch (x) {
        err = (x as InstanceType<typeof latepay.LatepayError>).code
      }
      ok('换一条条目、用同一个交易号 → 拒绝（TRADE_USED）', err === 'TRADE_USED')
      const t2 = `${tradeNo.slice(0, 20)}9999`
      err = ''
      try {
        await latepay.manualCredit({ key: key2, orderNo: o.orderNo, tradeNo: t2, adminId: admin.id })
      } catch (x) {
        err = (x as InstanceType<typeof latepay.LatepayError>).code
      }
      ok('订单已退入过：不勾「已核对账单」→ 拒绝（NEED_BILL_CHECKED）', err === 'NEED_BILL_CHECKED')
      await latepay.manualCredit({ key: key2, orderNo: o.orderNo, tradeNo: t2, adminId: admin.id, confirmBillChecked: true })
      createdSettingKeys.push(`latepay_trade:${t2}`)
      ok('  …勾了之后退入（同一张单第二笔，三个不同交易号各一次）', (await prisma.balanceLog.count({ where: { type: 'LATEPAY', orderId: o.id } })) === 2)
      // repeatForward：同一原文 1 分钟内两次
      const rr = raw(price)
      await vmq.markPaidByAmount(price, 2, rr)
      await takeNewEntry()
      await vmq.markPaidByAmount(price, 2, rr)
      const key3 = (await takeNewEntry())!
      const e3 = await latepay.readEntry(key3)
      err = ''
      try {
        await latepay.manualCredit({ key: key3, orderNo: o.orderNo, tradeNo: `${tradeNo.slice(0, 20)}8888`, adminId: admin.id })
      } catch (x) {
        err = (x as InstanceType<typeof latepay.LatepayError>).code
      }
      ok('repeatForward 条目：不勾「已核对账单」→ 拒绝', e3?.repeatForward === true && err === 'NEED_BILL_CHECKED')
      // B1 评审修复：候选逐笔列出之前的两笔手动退入（交易号），手填订单号的查询给同样的明细
      const c3 = (await latepay.latepayCandidates(e3!)).list.find((c) => c.orderNo === o.orderNo)
      ok(
        '候选逐笔列出之前两笔手动退入（新的在前、带交易号与条目 key）',
        !!c3 && c3.priorLatepay === 2 && c3.priorList.map((p) => p.tradeNo).join(',') === `${t2},${tradeNo}` && c3.priorList.every((p) => !p.auto && p.cents === centsOf(C.reallyPrice)) && c3.priorList[1].entryKey === key,
      )
      const lk = await latepay.latepayOrderLookup(o.orderNo)
      ok('手填订单号查询：同样两笔明细、carrier=true', !!lk && lk.carrier && lk.priorLatepay === 2 && lk.priorList.length === 2 && lk.priorList[0].tradeNo === t2)
      ok('手填不存在的订单号：null', (await latepay.latepayOrderLookup(`${TAG}NOPE`)) === null)
      // 买家手输错金额：条目 ¥X.00 对应一张 ¥Y 的充值单 → 要 confirmMismatch，只入条目实收
      const u2 = await mkUser('late3')
      const big = await start(u2, (await freeYuan()) * 100)
      if (!big.ok) throw new Error('建单失败')
      const ob = await prisma.order.findUniqueOrThrow({ where: { orderNo: big.orderNo } })
      await closeNow(ob.id)
      const wrong = (await freeYuan()).toFixed(2)
      await vmq.markPaidByAmount(wrong, 2, raw(wrong))
      const key4 = (await takeNewEntry())!
      err = ''
      try {
        await latepay.manualCredit({ key: key4, orderNo: ob.orderNo, tradeNo: `${tradeNo.slice(0, 20)}7777`, adminId: admin.id })
      } catch (x) {
        err = (x as InstanceType<typeof latepay.LatepayError>).code
      }
      ok('金额与订单的任何收款单都对不上 → 要 confirmMismatch', err === 'NEED_MISMATCH')
      const bb = await buckets(u2.id)
      await latepay.manualCredit({ key: key4, orderNo: ob.orderNo, tradeNo: `${tradeNo.slice(0, 20)}7777`, adminId: admin.id, confirmMismatch: true })
      createdSettingKeys.push(`latepay_trade:${tradeNo.slice(0, 20)}7777`)
      ok('  …确认后只入条目实收（不是订单金额）', (await buckets(u2.id)).topup - bb.topup === Math.round(Number(wrong) * 100))
      err = ''
      try {
        await latepay.manualCredit({ key: key3, orderNo: `${TAG}NOPE`, tradeNo: `${tradeNo.slice(0, 20)}6666`, adminId: admin.id, confirmBillChecked: true })
      } catch (x) {
        err = (x as InstanceType<typeof latepay.LatepayError>).code
      }
      ok('目标订单不存在 → 404', err === 'ORDER_NOT_FOUND')
    }

    console.log('\n【第 97 条：自动退入的边界】')
    {
      if (!paidVmq || !autoVmq) throw new Error('前置数据缺失')
      const mkEntry = async (e: Record<string, unknown>) => {
        const key = `vmq_unmatched:${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
        await prisma.setting.create({ data: { key, value: JSON.stringify({ type: 2, at: Date.now(), handledAt: null, handledBy: null, ...e }) } })
        createdSettingKeys.push(key)
        return key
      }
      // duplicate_payment 指向的收款单恰好是订单的付款凭证 → 不自动
      const kv = await mkEntry({ reason: 'duplicate_payment', price: (centsOf(paidVmq.reallyPrice) / 100).toFixed(2), vmqOrderId: paidVmq.orderId, biz: `order#${paidVmq.bizId}` })
      const rv = await latepay.autoCreditIfCarrier(kv, ctx)
      ok('duplicate_payment 指向付款凭证 → 不自动退、条目留着', !rv.credited && rv.why === 'VOUCHER' && !(await latepay.readEntry(kv))?.handledAt)
      // closed_while_matching：钱确定属于这张（已关闭的）收款单 → 自动
      const u = await mkUser('cwm')
      const r = await start(u, (await freeYuan()) * 100)
      if (!r.ok) throw new Error('建单失败')
      const o = await prisma.order.findUniqueOrThrow({ where: { orderNo: r.orderNo } })
      const C = await closeNow(o.id)
      const kc = await mkEntry({ reason: 'closed_while_matching', price: (centsOf(C.reallyPrice) / 100).toFixed(2), vmqOrderId: C.orderId, biz: `order#${o.id}` })
      // latepayAuto=false：全部留给站长
      await prisma.setting.update({ where: { key: 'wallet_config' }, data: { value: JSON.stringify({ ...config.FACTORY_WALLET_CONFIG, topupEnabled: true, latepayAuto: false }) } })
      const off = await latepay.autoCreditIfCarrier(kc, ctx)
      ok('latepayAuto=false：不自动退', !off.credited && off.why === 'AUTO_OFF' && !(await latepay.readEntry(kc))?.handledAt)
      await prisma.setting.update({ where: { key: 'wallet_config' }, data: { value: JSON.stringify({ ...config.FACTORY_WALLET_CONFIG, topupEnabled: true }) } })
      const on = await latepay.autoCreditIfCarrier(kc, ctx)
      createdSettingKeys.push(`latepay_auto:${C.orderId}`)
      ok('closed_while_matching：自动退入（充值格 + 实收）', on.credited && (await buckets(u.id)).topup === centsOf(C.reallyPrice))
      const kc2 = await mkEntry({ reason: 'closed_while_matching', price: (centsOf(C.reallyPrice) / 100).toFixed(2), vmqOrderId: C.orderId, biz: `order#${o.id}` })
      const again = await latepay.autoCreditIfCarrier(kc2, ctx)
      ok('同一张收款单的第二条 closed_while_matching（重复转发）→ 不再自动退（AUTO_USED）', !again.credited && again.why === 'AUTO_USED' && !(await latepay.readEntry(kc2))?.handledAt)
      // 普通商品的条目：什么都不做
      const kn = await mkEntry({ reason: 'no_pending_match', price: '3.33' })
      const rn = await latepay.autoCreditIfCarrier(kn, ctx)
      ok('没有载体单候选的普通到账：什么都不做（NO_CANDIDATE）', !rn.credited && !(await latepay.readEntry(kn))?.handledAt)
      ok('  …它不涉及载体单（「标记已处理」照旧，不要求选方式）', !(await latepay.entryInvolvesCarrier((await latepay.readEntry(kn))!)))
      // B1 评审修复：/admin/vmq 轮询一批一起判（固定至多 3 条查询），结果与逐条判断一致
      const batch = await Promise.all([kc2, kn, kv, autoKey].map((k) => latepay.readEntry(k)))
      const flags = await latepay.carrierFlags(batch.map((x) => x!))
      const single = await Promise.all(batch.map((x) => latepay.entryInvolvesCarrier(x!)))
      ok('carrierFlags 批量：[closed_while_matching 载体, 普通 3.33, duplicate_payment 载体, no_pending_match 载体] = [true, false, true, true]', JSON.stringify(flags) === '[true,false,true,true]', JSON.stringify(flags))
      ok('  …与逐条 entryInvolvesCarrier 一致；空数组 → []', JSON.stringify(flags) === JSON.stringify(single) && (await latepay.carrierFlags([])).length === 0)
    }

    console.log('\n【第 100 条：对同一个码真付两次（maybe_duplicate）】')
    {
      if (!paidVmq) throw new Error('前置数据缺失')
      const price = (centsOf(paidVmq.reallyPrice) / 100).toFixed(2)
      const b0 = await buckets(admin.id)
      await vmq.markPaidByAmount(price, 2, raw(price))
      const key = (await takeNewEntry())!
      const e = await latepay.readEntry(key)
      ok('第二次付款 → maybe_duplicate（vmqOrderId = 这张单的付款凭证）、不自动退', e?.reason === 'maybe_duplicate' && e.vmqOrderId === paidVmq.orderId && !e.handledAt && (await buckets(admin.id)).topup === b0.topup)
      let err = ''
      try {
        await latepay.manualCredit({ key, orderNo: (await prisma.order.findUniqueOrThrow({ where: { id: paidOrderId } })).orderNo, tradeNo: '20260929220014000055556666', adminId: admin.id })
      } catch (x) {
        err = (x as InstanceType<typeof latepay.LatepayError>).code
      }
      ok('不勾「已核对账单」→ 拒绝', err === 'NEED_BILL_CHECKED')
      // 改指到另一张已关闭的载体单：要 confirmMismatch
      const closedOrder = await prisma.order.findFirstOrThrow({ where: { productId: carrierId, userId: { in: userIds }, payStatus: 'UNPAID', deliveryStatus: 'CANCELLED' } })
      err = ''
      try {
        await latepay.manualCredit({ key, orderNo: closedOrder.orderNo, tradeNo: '20260929220014000055556666', adminId: admin.id, confirmBillChecked: true })
      } catch (x) {
        err = (x as InstanceType<typeof latepay.LatepayError>).code
      }
      ok('改指到提示之外的订单：不勾 confirmMismatch → 拒绝', err === 'NEED_MISMATCH')
      const po = await prisma.order.findUniqueOrThrow({ where: { id: paidOrderId } })
      await latepay.manualCredit({ key, orderNo: po.orderNo, tradeNo: '20260929220014000055556666', adminId: admin.id, confirmBillChecked: true })
      createdSettingKeys.push('latepay_trade:20260929220014000055556666')
      ok('勾「已核对账单」+ 交易号 → 退到提示的那张（已付款、已交付也放行）', (await buckets(admin.id)).topup - b0.topup === centsOf(paidVmq.reallyPrice) && (await prisma.order.findUniqueOrThrow({ where: { id: paidOrderId } })).deliveryStatus === 'DELIVERED')
    }

    console.log('\n【第 103 条：「标记已处理」与退入并发 → 条件更新不覆盖】')
    {
      const u = await mkUser('race')
      const r = await start(u, (await freeYuan()) * 100)
      if (!r.ok) throw new Error('建单失败')
      const o = await prisma.order.findUniqueOrThrow({ where: { orderNo: r.orderNo } })
      const C = await closeNow(o.id)
      await prisma.vmqOrder.update({ where: { id: C.id }, data: { createdAt: new Date(Date.now() - 40 * 60_000) } })
      const price = (centsOf(C.reallyPrice) / 100).toFixed(2)
      await vmq.markPaidByAmount(price, 2, raw(price))
      const key = (await takeNewEntry())!
      let release: () => void = () => undefined
      const gate = new Promise<void>((res) => (release = res))
      let paused = false
      vmq.setMarkHandledPauseForTest(async () => {
        paused = true
        await gate
      })
      const markP = vmq.markUnmatchedHandled(key, admin.id, 'OFFLINE')
      for (let i = 0; i < 50 && !paused; i++) await sleep(20)
      const tradeNo = '20260929220014000077778888'
      await latepay.manualCredit({ key, orderNo: o.orderNo, tradeNo, adminId: admin.id })
      createdSettingKeys.push(`latepay_trade:${tradeNo}`)
      release()
      const wrote = await markP
      vmq.setMarkHandledPauseForTest(null)
      const e = await latepay.readEntry(key)
      ok('标记接口读完条目后暂停、退入先提交 → 标记返回「已被处理」', paused && wrote === false)
      ok('  …条目保留 handledAs=LATEPAY、orderId、tradeNo（没被旧 JSON 覆盖）', e?.handledAs === 'LATEPAY' && e.orderId === o.id && e.tradeNo === tradeNo)
      // 反过来：先标 OFFLINE，之后再退入被拒
      await vmq.markPaidByAmount(price, 2, raw(price))
      const key2 = (await takeNewEntry())!
      ok('载体单条目标 OFFLINE：写入', (await vmq.markUnmatchedHandled(key2, admin.id, 'OFFLINE')) === true && (await latepay.readEntry(key2))?.handledAs === 'OFFLINE')
      let err = ''
      try {
        await latepay.manualCredit({ key: key2, orderNo: o.orderNo, tradeNo: '20260929220014000099990000', adminId: admin.id, confirmBillChecked: true })
      } catch (x) {
        err = (x as InstanceType<typeof latepay.LatepayError>).code
      }
      ok('  …之后再退入被拒（ALREADY_HANDLED）', err === 'ALREADY_HANDLED')
    }

    console.log('\n【E45 与对账：已到账未入账 → 补做；已到账 + 已关闭 → 补记 duplicate_payment 并自动退入（只补一次）】')
    {
      const u = await mkUser('recon')
      const r = await start(u, (await freeYuan()) * 100)
      if (!r.ok) throw new Error('建单失败')
      const o = await prisma.order.findUniqueOrThrow({ where: { orderNo: r.orderNo } })
      const v = await vmqOf(o.id)
      // 模拟：收款单已翻 1（到账），履约那一下失败了
      await prisma.vmqOrder.update({ where: { id: v.id }, data: { state: 1, payDate: new Date(Date.now() - 4 * 60_000) } })
      await vmq.reconcilePaidVmq()
      const o2 = await prisma.order.findUniqueOrThrow({ where: { id: o.id } })
      ok('对账补履约：PAID + DELIVERED、充值格 + 这张收款单实付', o2.payStatus === 'PAID' && o2.deliveryStatus === 'DELIVERED' && (await buckets(u.id)).topup === centsOf(v.reallyPrice))
      // 已到账 + 充值单已关闭（人工改库之类）：补记一条 duplicate_payment、自动退入；再跑不重复
      const r2 = await start(u, (await freeYuan()) * 100)
      if (!r2.ok) throw new Error('建单失败')
      const oc = await prisma.order.findUniqueOrThrow({ where: { orderNo: r2.orderNo } })
      const vc = await vmqOf(oc.id)
      await prisma.vmqOrder.update({ where: { id: vc.id }, data: { state: 1, payDate: new Date(Date.now() - 4 * 60_000) } })
      await prisma.order.update({ where: { id: oc.id }, data: { deliveryStatus: 'CANCELLED' } })
      createdSettingKeys.push(`vmqrec:${vc.id}`, `latepay_auto:${vc.orderId}`)
      const b0 = await buckets(u.id)
      await vmq.reconcilePaidVmq()
      const k1 = await newEntries()
      const e = k1.length ? await latepay.readEntry(k1[k1.length - 1]) : null
      ok('补记一条 duplicate_payment（vmqOrderId = 这张收款单）', k1.length === 1 && e?.reason === 'duplicate_payment' && e.vmqOrderId === vc.orderId)
      ok('  …并自动退入（订单保持关闭、不复活）', e?.handledAs === 'LATEPAY' && e.auto === true && (await buckets(u.id)).topup - b0.topup === centsOf(vc.reallyPrice) && (await prisma.order.findUniqueOrThrow({ where: { id: oc.id } })).payStatus === 'UNPAID')
      await takeNewEntry()
      await vmq.reconcilePaidVmq()
      ok('再跑对账：不再补记、不再退', (await newEntries()).length === 0 && (await buckets(u.id)).topup - b0.topup === centsOf(vc.reallyPrice))
      // 关单后到账的正常路径：同一张收款单被 markPaidVmqOrder 翻 1 但订单已关 → duplicate_payment → 自动退入
      const r3 = await start(u, (await freeYuan()) * 100)
      if (!r3.ok) throw new Error('建单失败')
      const od = await prisma.order.findUniqueOrThrow({ where: { orderNo: r3.orderNo } })
      const vd = await vmqOf(od.id)
      await prisma.order.update({ where: { id: od.id }, data: { deliveryStatus: 'CANCELLED' } }) // 收款单还开着、订单已关（不一致）
      const b1 = await buckets(u.id)
      await vmq.markPaidByAmount((centsOf(vd.reallyPrice) / 100).toFixed(2), 2, raw('x'))
      const kd = (await takeNewEntry())!
      createdSettingKeys.push(`latepay_auto:${vd.orderId}`)
      const ed = await latepay.readEntry(kd)
      ok('收款单翻成 1、订单已关：fulfillOrder 不复活（付款 CAS 带「未取消」）→ duplicate_payment → 自动退入', ed?.reason === 'duplicate_payment' && ed.handledAs === 'LATEPAY' && (await buckets(u.id)).topup - b1.topup === centsOf(vd.reallyPrice) && (await prisma.order.findUniqueOrThrow({ where: { id: od.id } })).payStatus === 'UNPAID' && (await prisma.payment.count({ where: { orderId: od.id } })) === 0)
    }

    console.log('\n【B1 评审修复：补记不被 vmqrec:<id>（补履约失败的告警去重）卡住；只认这张收款单自己那笔钱的条目；补记失败下一分钟重试】')
    {
      const u = await mkUser('rcp')
      const staleAt = () => new Date(Date.now() - 4 * 60_000)
      // A：到账后补履约失败过一次（reconcile 的 catch 占了 vmqrec:<id>）→ 订单随后被关 → 对账仍要补记并自动退入
      const ra = await start(u, (await freeYuan()) * 100)
      if (!ra.ok) throw new Error('建单失败')
      const oa = await prisma.order.findUniqueOrThrow({ where: { orderNo: ra.orderNo } })
      const va = await vmqOf(oa.id)
      createdSettingKeys.push(`vmqrec:${va.id}`, `latepay_auto:${va.orderId}`)
      await prisma.vmqOrder.update({ where: { id: va.id }, data: { state: 1, payDate: staleAt() } })
      vmq.setCarrierPayFaultForTest(() => {
        throw new Error('itest：补履约失败（非死锁）')
      })
      await vmq.reconcilePaidVmq()
      vmq.setCarrierPayFaultForTest(null)
      ok('A 补履约失败：订单仍待支付、vmqrec:<id> 已被 catch 分支占掉', (await prisma.order.findUniqueOrThrow({ where: { id: oa.id } })).payStatus === 'UNPAID' && !!(await prisma.setting.findUnique({ where: { key: `vmqrec:${va.id}` } })))
      await prisma.order.update({ where: { id: oa.id }, data: { deliveryStatus: 'CANCELLED' } })
      const ba = await buckets(u.id)
      await vmq.reconcilePaidVmq()
      const ka = await newEntries()
      const ea = ka.length ? await latepay.readEntry(ka[ka.length - 1]) : null
      ok('  …订单关闭后对账照样补记 duplicate_payment（原来 firstAlert 抢不到就永远不补）', ka.length === 1 && ea?.reason === 'duplicate_payment' && ea.vmqOrderId === va.orderId)
      ok('  …并自动退入（充值格 + 实收、订单保持关闭）', ea?.handledAs === 'LATEPAY' && ea.auto === true && (await buckets(u.id)).topup - ba.topup === centsOf(va.reallyPrice) && (await prisma.order.findUniqueOrThrow({ where: { id: oa.id } })).payStatus === 'UNPAID')
      const keyA = (await takeNewEntry())!
      await vmq.reconcilePaidVmq()
      const again = await vmq.recordCarrierPaid(va.id)
      ok('  …再跑对账 / 再调 recordCarrierPaid：不重复补记、返回已有条目 key', (await newEntries()).length === 0 && !again.recorded && again.key === keyA && (await buckets(u.id)).topup - ba.topup === centsOf(va.reallyPrice))

      // B：补记事务失败（条目落库失败）→ 什么都不留；下一分钟重试成功
      const rb = await start(u, (await freeYuan()) * 100)
      if (!rb.ok) throw new Error('建单失败')
      const ob = await prisma.order.findUniqueOrThrow({ where: { orderNo: rb.orderNo } })
      const vb = await vmqOf(ob.id)
      createdSettingKeys.push(`vmqrec:${vb.id}`, `latepay_auto:${vb.orderId}`)
      await prisma.vmqOrder.update({ where: { id: vb.id }, data: { state: 1, payDate: staleAt() } })
      await prisma.order.update({ where: { id: ob.id }, data: { deliveryStatus: 'CANCELLED' } })
      const bb = await buckets(u.id)
      const nB = bodies.length
      vmq.setCarrierRecordFaultForTest(() => {
        throw new Error('itest：条目落库失败')
      })
      await vmq.reconcilePaidVmq()
      vmq.setCarrierRecordFaultForTest(null)
      await sleep(400)
      ok('B 补记事务失败：没有条目、没有退入', (await newEntries()).length === 0 && (await buckets(u.id)).topup === bb.topup)
      ok('  …推了一次告警（firstAlert 只用于推送、不再决定补不补记）', !!(await prisma.setting.findUnique({ where: { key: `vmqrec:${vb.id}` } })) && bodies.slice(nB).some((b) => b.includes('补记待核实条目失败')))
      await vmq.reconcilePaidVmq()
      const kb = await newEntries()
      const eb = kb.length ? await latepay.readEntry(kb[kb.length - 1]) : null
      ok('  …下一分钟重试：补记成功并自动退入', kb.length === 1 && eb?.reason === 'duplicate_payment' && eb.vmqOrderId === vb.orderId && eb.handledAs === 'LATEPAY' && (await buckets(u.id)).topup - bb.topup === centsOf(vb.reallyPrice))
      await takeNewEntry()

      // C：同额第二笔的 maybe_duplicate 提示指向这张收款单（记的是另一笔钱）、站长已标 IGNORE → 不算「已有条目」，照样补记
      const rc = await start(u, (await freeYuan()) * 100)
      if (!rc.ok) throw new Error('建单失败')
      const oc = await prisma.order.findUniqueOrThrow({ where: { orderNo: rc.orderNo } })
      const vc = await vmqOf(oc.id)
      createdSettingKeys.push(`vmqrec:${vc.id}`, `latepay_auto:${vc.orderId}`)
      await prisma.vmqOrder.update({ where: { id: vc.id }, data: { state: 1, payDate: staleAt() } })
      await prisma.order.update({ where: { id: oc.id }, data: { deliveryStatus: 'CANCELLED' } })
      const pc = (centsOf(vc.reallyPrice) / 100).toFixed(2)
      await vmq.markPaidByAmount(pc, 2, raw(pc))
      const km = (await takeNewEntry())!
      const em = await latepay.readEntry(km)
      ok('C 同额第二笔：maybe_duplicate，vmqOrderId 提示这张收款单', em?.reason === 'maybe_duplicate' && em.vmqOrderId === vc.orderId)
      ok('  …站长核实后标 IGNORE', (await vmq.markUnmatchedHandled(km, admin.id, 'IGNORE')) === true)
      const bc = await buckets(u.id)
      await vmq.reconcilePaidVmq()
      const kc = await newEntries()
      const ec = kc.length ? await latepay.readEntry(kc[kc.length - 1]) : null
      ok('  …对账仍为这张收款单自己的钱补记 duplicate_payment 并自动退入（提示条目不算）', kc.length === 1 && ec?.reason === 'duplicate_payment' && ec.vmqOrderId === vc.orderId && ec.handledAs === 'LATEPAY' && (await buckets(u.id)).topup - bc.topup === centsOf(vc.reallyPrice))
      await takeNewEntry()
    }

    console.log('\n【B1 评审修复：载体单付款事务走 inMoneyTx —— 写冲突 / 死锁重试一次、整段重来只入账一次】')
    {
      const u = await mkUser('retry')
      const r = await start(u, (await freeYuan()) * 100)
      if (!r.ok) throw new Error('建单失败')
      const o = await prisma.order.findUniqueOrThrow({ where: { orderNo: r.orderNo } })
      const v = await vmqOf(o.id)
      let calls = 0
      vmq.setCarrierPayFaultForTest(() => {
        calls++
        if (calls === 1) throw Object.assign(new Error('itest：Transaction failed due to a write conflict or a deadlock'), { code: 'P2034' })
      })
      const nR = bodies.length
      const price = (centsOf(v.reallyPrice) / 100).toFixed(2)
      await vmq.markPaidByAmount(price, 2, raw(price))
      vmq.setCarrierPayFaultForTest(null)
      await sleep(400)
      const o2 = await prisma.order.findUniqueOrThrow({ where: { id: o.id } })
      ok('第一次事务写冲突 → 重试一次成功：PAID + DELIVERED', calls === 2 && o2.payStatus === 'PAID' && o2.deliveryStatus === 'DELIVERED', `calls=${calls}`)
      ok(
        '  …充值格只入一次、TOPUP 流水一条、Payment 一行（tradeNo = 收款单号）',
        (await buckets(u.id)).topup === centsOf(v.reallyPrice) &&
          (await prisma.balanceLog.count({ where: { type: 'TOPUP', orderId: o.id } })) === 1 &&
          (await prisma.payment.count({ where: { orderId: o.id } })) === 1 &&
          (await prisma.payment.count({ where: { orderId: o.id, tradeNo: v.orderId } })) === 1,
      )
      ok('  …没有推「到账后履约失败」（不再等 3 分钟对账）', !bodies.slice(nR).some((b) => b.includes('到账后履约失败')))
    }

    console.log('\n【B1 评审修复：数据验证唯一不在残缺数据上判（同额收款单超过扫描上限 → 不自动、留给站长）】')
    {
      const u = await mkUser('many')
      const r = await start(u, (await freeYuan()) * 100)
      if (!r.ok) throw new Error('建单失败')
      const o = await prisma.order.findUniqueOrThrow({ where: { orderNo: r.orderNo } })
      const C = await closeNow(o.id)
      const N = latepay.UNIQUE_SCAN_LIMIT + 1
      const prefix = `${TAG}M`
      const at3h = new Date(Date.now() - 3 * 3600_000)
      await prisma.vmqOrder.createMany({
        data: Array.from({ length: N }, (_, i) => ({
          orderId: `${prefix}${i}`,
          bizType: 'invoice',
          bizId: 0,
          outTradeNo: `${prefix}${i}`,
          type: 2,
          price: C.reallyPrice,
          reallyPrice: C.reallyPrice,
          state: -1,
          createdAt: at3h,
        })),
      })
      try {
        const b0 = await buckets(u.id)
        const price = (centsOf(C.reallyPrice) / 100).toFixed(2)
        await vmq.markPaidByAmount(price, 2, raw(price))
        const key = (await takeNewEntry())!
        const e = await latepay.readEntry(key)
        ok(`24 小时内同额已关闭收款单 ${N} 张（> 上限 ${latepay.UNIQUE_SCAN_LIMIT}）：no_pending_match 不自动退`, e?.reason === 'no_pending_match' && !e.handledAt && (await buckets(u.id)).topup === b0.topup)
        const d1 = await latepay.autoCreditIfCarrier(key, ctx)
        ok('  …判定 TOO_MANY_ROWS（原来截到任意 500 行，可能漏掉违反 ④ 的行而误判「唯一」）', !d1.credited && d1.why === 'TOO_MANY_ROWS', d1.credited ? 'credited' : d1.why)
        await prisma.vmqOrder.deleteMany({ where: { orderId: { in: [`${prefix}0`, `${prefix}1`] } } })
        const d2 = await latepay.autoCreditIfCarrier(key, ctx)
        ok('  …降到上限以内：照常判出「24 小时内还有别的同额已关闭收款单」（OTHER_CLOSED_24H）', !d2.credited && d2.why === 'OTHER_CLOSED_24H', d2.credited ? 'credited' : d2.why)
        // 没有载体候选的普通到账（1 小时前、近窗里没有 C）：即使 24h 窗口装满，也安静返回 NO_CANDIDATE，不误报「涉及载体单」
        await prisma.vmqOrder.createMany({ data: [0, 1].map((i) => ({ orderId: `${prefix}x${i}`, bizType: 'invoice', bizId: 0, outTradeNo: `${prefix}x${i}`, type: 2, price: C.reallyPrice, reallyPrice: C.reallyPrice, state: -1, createdAt: at3h })) })
        const kq = `vmq_unmatched:${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
        await prisma.setting.create({ data: { key: kq, value: JSON.stringify({ reason: 'no_pending_match', price, type: 2, at: Date.now() - 3600_000, handledAt: null, handledBy: null }) } })
        createdSettingKeys.push(kq)
        const d3 = await latepay.autoCreditIfCarrier(kq, ctx)
        ok('  …近窗没有候选：NO_CANDIDATE（24h 窗口超限不影响）', !d3.credited && d3.why === 'NO_CANDIDATE', d3.credited ? 'credited' : d3.why)
      } finally {
        await prisma.vmqOrder.deleteMany({ where: { orderId: { startsWith: prefix } } })
      }
    }

    console.log('\n【应付统一函数：有 HELD 预扣时收款单按「应付 − 预扣」】')
    {
      const u = await mkUser('hold')
      await ledger.inMoneyTx((tx) => ledger.postInTx(tx, { userId: u.id, topupDeltaCents: 200, type: 'ADJUST', bizKey: `adj:${TAG}-h`, note: 'itest' }))
      const p = extraProducts[0]
      const o = await prisma.order.create({ data: { orderNo: `${TAG.toUpperCase()}H1`.slice(0, 32), userId: u.id, productId: p, productName: 'x', productPrice: D(5), quantity: 1, amount: D(5) } })
      await ledger.inMoneyTx((tx) => hold.holdInTx(tx, { orderId: o.id, userId: u.id, orderCents: 500 }))
      ok('payableCents = 5.00 − 预扣 2.00 = 3.00', (await payable.payableCents(prisma, o.id)) === 300)
      let stale = ''
      try {
        await vmq.createOrGetVmqOrder({ bizType: 'order', bizId: o.id, outTradeNo: o.orderNo, price: 5 })
      } catch (e) {
        stale = (e as Error).message
      }
      ok('按全额 ¥5 发起：锁内复核不过（不建收款单）', stale.includes('有变化') && (await prisma.vmqOrder.count({ where: { bizType: 'order', bizId: o.id } })) === 0)
      const v = await vmq.createOrGetVmqOrder({ bizType: 'order', bizId: o.id, outTradeNo: o.orderNo, price: 3 })
      ok('按差额 ¥3 发起：建出收款单', v.created && centsOf(v.price) === 300)
      // 收尾：作废收款单、关单并释放预扣（与 closeExpired 同一顺序），不留 HELD
      await vmq.discardVmqOrder(v.orderId)
      await ledger.inMoneyTx(async (tx) => {
        await tx.order.update({ where: { id: o.id }, data: { deliveryStatus: 'CANCELLED' } })
        await hold.releaseInTx(tx, o.id, { reason: 'ITEST' })
      })
    }

    console.log('\n【对账 W6 / W7 / W9：本测试的数据不新增问题】')
    {
      const rep = await reconcile.runWalletReconcile({ full: true, alert: false, save: false })
      for (const code of ['W6', 'W7', 'W9', 'W1', 'W3']) {
        const it = rep.items.find((i) => i.code === code)!
        const base = baseSamples(code)
        const fresh = it.samples.filter((s) => !base.has(s))
        ok(`${code} 没有新增问题（${it.title}）`, fresh.length === 0, fresh.join('；'))
      }
    }
  } finally {
    checkout.setTopupPayFaultForTest(null)
    vmq.setMarkHandledPauseForTest(null)
    const orders = await prisma.order.findMany({ where: { userId: { in: userIds } }, select: { id: true, orderNo: true } })
    const oids = orders.map((o) => o.id)
    const vmqs = await prisma.vmqOrder.findMany({ where: { bizType: 'order', bizId: { in: oids } }, select: { id: true, orderId: true } })
    await prisma.balanceLog.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.balanceHold.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.payment.deleteMany({ where: { orderId: { in: oids } } })
    await prisma.orderMessage.deleteMany({ where: { orderId: { in: oids } } })
    await prisma.vmqLock.deleteMany({ where: { orderId: { in: vmqs.map((v) => v.orderId) } } })
    await prisma.vmqOrder.deleteMany({ where: { id: { in: vmqs.map((v) => v.id) } } })
    await prisma.auditEvent.deleteMany({ where: { OR: [{ targetId: { in: orders.map((o) => o.orderNo) } }, { actorUserId: { in: userIds } }] } })
    await prisma.order.deleteMany({ where: { id: { in: oids } } })
    await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    if (extraProducts.length) await prisma.product.deleteMany({ where: { id: { in: extraProducts } } })
    if (extraCat) await prisma.category.deleteMany({ where: { id: extraCat } })
    // 本测试新增的待核实条目、占位行、对账告警去重行
    const fresh = (await prisma.setting.findMany({ where: { key: { startsWith: 'vmq_unmatched:' } }, select: { key: true } })).map((s) => s.key).filter((k) => !unmatchedBefore.has(k))
    await prisma.setting.deleteMany({ where: { key: { in: Array.from(new Set([...createdSettingKeys, ...fresh, ...vmqs.map((v) => `vmqrec:${v.id}`), ...vmqs.map((v) => `latepay_auto:${v.orderId}`)])) } } })
    await prisma.setting.deleteMany({ where: { key: { in: KEEP_KEYS } } })
    for (const s of savedSettings) await prisma.setting.create({ data: { key: s.key, value: s.value } })
    if (seededCarrier) {
      await prisma.product.deleteMany({ where: { id: seededCarrier.productId } })
      if (seededCarrier.categoryId) await prisma.category.deleteMany({ where: { id: seededCarrier.categoryId } })
    }
    if (savedHook === undefined) delete process.env.WECOM_WEBHOOK_URL
    else process.env.WECOM_WEBHOOK_URL = savedHook
    srv.close()
  }
  console.log(`\n通过 ${pass} 条，失败 ${fail} 条`)
}

main()
  .catch((e) => {
    console.error(e)
    fail++
  })
  .finally(async () => {
    await prisma.$disconnect()
    process.exit(fail === 0 ? 0 : 1)
  })
