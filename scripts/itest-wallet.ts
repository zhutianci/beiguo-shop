/**
 * 钱包 B0 余额底座 —— 数据库集成测试（会建数据、会删数据）。docs/短信接码-设计.md §12.2 中 B0 能覆盖的部分。
 *
 *   set -a; . ./.env.local; set +a; npx tsx scripts/itest-wallet.ts
 *
 * ⚠️ 只能对一次性的本地库跑：库名不含 dev / test 时直接拒绝执行。
 *
 * 覆盖：
 *   · ledger.postInTx：两格一条条件更新（原子、不扣成负数）、变动后余额在事务里读回、bizKey 幂等、并发扣减不超扣
 *   · hold：H1 预扣 → H2 确认 → H4 退款（组合，支付宝部分只进充值格）；H1 → H3 释放（三个前提逐条违反）；纯支付宝退款
 *   · 第 59 条 wallet_config 损坏：fail-closed 的只有充值 / 新单选余额 / 自动退入，释放与退款照常
 *   · 第 61 条 预扣期间提现：只能提返现格剩余部分
 *   · 第 62 条 旧账兼容：历史流水的钱包总额、变动后余额、W1
 *   · 第 63 条 后台调余额同一请求号重放（含部署前 vmq_locks 的 bal:）只记一次；审计记两格前后
 *   · 第 66 条 推荐返现结算：金额、note 格式、orderId 与改造前相同，流水多出 topup_after_cents
 *   · 第 95 条 返现扣回（先返现格、不够再充值格、扣到 0 记差额）；第 96 条 充值退还同一流水号只扣一次
 *   · 第 114 条 钱包接口：canUseForJiema、totals、白名单、分类筛选、预扣、迟到退入横幅
 *   · W1–W9 对账：干净数据不新增问题；逐条注入不一致都能被发现
 *   · §5.6 运维 SQL：旧账核对（只读）、「历史对齐」流水（可重复执行）、wallet_config 种子
 *
 * B0 评审修复（fe184ab 之后）追加：
 *   · wallet_config 行不存在也推 wallet.alert（本地起一个假 webhook 收）
 *   · 校验不过但带 version 的配置：storedVersion 给出库里的版本号，按它保存能修好；409 区分「版本不一致」与「已损坏」
 *   · 充值开关（B0 时 TOPUP_AVAILABLE=false：topupOpen 恒 false、保存拒绝打开；B1 起改为 true：按受众开放、可保存打开）
 *   · lockHoldInTx 不对不存在的预扣行加间隙锁：纯支付宝单退款与同一买家下单并发，不死锁
 *   · releaseInTx 前提不满足（订单没关、有在途收款单、预扣已确认）抛错，关单一起回滚
 *   · 对账：同一快照（与记账并发时不误报）、按时间窗逐行（窗外的旧记录只在全量里核）、W2 认豁免名单
 *   · 旧入口「内推管理 → 提现/调整」备注仍收 255 字；brief=1 不给 totals；CSV 负数不加 '、时间是北京时间；
 *     返现扣回合计（累计返现按「已结算 − 扣回」）；旧账核对 SQL 列出负余额
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
const TAG = `iwal${Date.now().toString(36)}`
const D = (n: number) => new Prisma.Decimal(n.toFixed(2))
const uuid = () => crypto.randomUUID()

async function main() {
  const ledger = await import('../src/lib/wallet/ledger')
  const hold = await import('../src/lib/wallet/hold')
  const adjust = await import('../src/lib/wallet/adjust')
  const dto = await import('../src/lib/wallet/dto')
  const config = await import('../src/lib/wallet/config')
  const reconcile = await import('../src/lib/wallet/reconcile')
  const aq = await import('../src/lib/wallet/admin-query')
  const referral = await import('../src/lib/referral')
  const { centsOf } = await import('../src/lib/wallet/buckets')

  const clawback = await import('../src/lib/wallet/clawback')

  // ---- 备份会被本测试改动的 settings 行，finally 里原样恢复 ----
  const SETTING_KEYS = ['wallet_config', 'sms_config', reconcile.RECONCILE_EXEMPT_KEY, reconcile.RECONCILE_LAST_KEY]
  const savedSettings = await prisma.setting.findMany({ where: { key: { in: SETTING_KEYS } } })

  // ---- 评审修复：行不存在也推 wallet.alert。必须是本进程第一次读 wallet_config（告警有 1 小时进程内节流） ----
  {
    console.log('\n【wallet_config 行不存在：推 wallet.alert（假 webhook）】')
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
    const port = (srv.address() as { port: number }).port
    const savedHook = { w: process.env.WECOM_WEBHOOK_URL, e: process.env.NOTIFY_EVENTS }
    process.env.WECOM_WEBHOOK_URL = `http://127.0.0.1:${port}/cgi-bin/webhook/send?key=itest`
    delete process.env.NOTIFY_EVENTS
    try {
      await prisma.setting.deleteMany({ where: { key: 'wallet_config' } })
      const r = await config.readWalletConfig()
      for (let i = 0; i < 40 && bodies.length === 0; i++) await new Promise((x) => setTimeout(x, 50))
      ok('行不存在：MISSING、storedVersion=0', !r.ok && r.reason === 'MISSING' && r.storedVersion === 0)
      ok('  …推了一条 wallet.alert（「wallet_config 行不存在」）', bodies.length === 1 && bodies[0].includes('行不存在'), bodies.join(' | ').slice(0, 200))
      await config.readWalletConfig()
      await new Promise((x) => setTimeout(x, 200))
      ok('  …1 小时节流：再读一次不再推', bodies.length === 1)
    } finally {
      if (savedHook.w === undefined) delete process.env.WECOM_WEBHOOK_URL
      else process.env.WECOM_WEBHOOK_URL = savedHook.w
      if (savedHook.e !== undefined) process.env.NOTIFY_EVENTS = savedHook.e
      srv.close()
    }
  }

  const cat = await prisma.category.create({ data: { name: `${TAG}-cat` } })
  const product = await prisma.product.create({ data: { categoryId: cat.id, name: `${TAG}-p`, price: D(0), stock: -1, deliveryType: 'MANUAL', status: 0 } })
  const topupProduct = await prisma.product.create({ data: { categoryId: cat.id, name: `${TAG}-topup`, price: D(0), stock: -1, deliveryType: 'TOPUP', status: 0 } })
  const userIds: number[] = []
  async function mkUser(name: string, role: 'USER' | 'ADMIN' = 'USER') {
    const u = await prisma.user.create({ data: { email: `${TAG}-${name}@test.local`, passwordHash: 'x', nickname: `${TAG}-${name}`, role } })
    userIds.push(u.id)
    return u
  }
  let seq = 0
  async function mkOrder(userId: number, amount: number, extra: Partial<Prisma.OrderUncheckedCreateInput> = {}) {
    seq++
    return prisma.order.create({
      data: {
        orderNo: `${TAG.toUpperCase().replace(/[^0-9A-Z]/g, '')}W${String(seq).padStart(3, '0')}`.slice(0, 32),
        userId,
        productId: extra.productId ?? product.id,
        productName: `短信接码 · Telegram · 印尼`,
        productPrice: D(amount),
        quantity: 1,
        amount: D(amount),
        ...extra,
      },
    })
  }
  const buckets = async (userId: number) => {
    const u = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { balance: true, topupCents: true } })
    return { topup: u.topupCents, cash: centsOf(u.balance) }
  }
  /** 用后台调整给测试用户加余额（ADJUST，一次一格） */
  async function seed(userId: number, topup: number, cash: number) {
    if (topup) await ledger.inMoneyTx((tx) => ledger.postInTx(tx, { userId, topupDeltaCents: topup, type: 'ADJUST', bizKey: `adj:${uuid()}`, note: 'itest 充值格' }))
    if (cash) await ledger.inMoneyTx((tx) => ledger.postInTx(tx, { userId, cashDeltaCents: cash, type: 'ADJUST', bizKey: `adj:${uuid()}`, note: 'itest 返现格' }))
  }
  const identityOk = async (userId: number) => {
    const b = await buckets(userId)
    const s = await prisma.balanceLog.aggregate({ where: { userId }, _sum: { delta: true, topupDeltaCents: true } })
    return b.cash === centsOf(s._sum.delta ?? 0) && b.topup === (s._sum.topupDeltaCents ?? 0)
  }
  const countOf = (r: Awaited<ReturnType<typeof reconcile.runWalletReconcile>>, code: string) => r.items.find((i) => i.code === code)?.count ?? -1
  const recon = () => reconcile.runWalletReconcile({ full: true, save: false, alert: false })

  const createdSettingKeys: string[] = []
  const createdVmqIds: number[] = []
  const createdLockKeys: string[] = []

  try {
    // 基线：测试数据建立之前，全库的 W 系列各项计数
    const baseline = await recon()
    console.log(`\n（对账基线：${baseline.items.map((i) => `${i.code}=${i.count}`).join(' ')}）`)

    console.log('\n【ledger.postInTx：两格、条件扣减、变动后余额、bizKey 幂等】')
    const a = await mkUser('a')
    {
      await seed(a.id, 500, 300)
      const b = await buckets(a.id)
      ok('两格各自入账：充值 5.00 · 返现 3.00', b.topup === 500 && b.cash === 300, JSON.stringify(b))
      const logs = await prisma.balanceLog.findMany({ where: { userId: a.id }, orderBy: { id: 'asc' } })
      ok('流水：充值格那条 topupDelta=500、topupAfter=500、delta=0', logs[0].topupDeltaCents === 500 && logs[0].topupAfterCents === 500 && centsOf(logs[0].delta) === 0)
      ok('流水：返现格那条 delta=3.00、balanceAfter=3.00、topupAfter=500（读回的是本次改完的两格）', centsOf(logs[1].delta) === 300 && centsOf(logs[1].balanceAfter) === 300 && logs[1].topupAfterCents === 500)
      ok('bizKey 形如 adj:<requestId>', !!logs[0].bizKey?.startsWith('adj:'))

      let insufficient = false
      try {
        await ledger.inMoneyTx((tx) => ledger.postInTx(tx, { userId: a.id, cashDeltaCents: -301, type: 'WITHDRAW', bizKey: `adj:${uuid()}` }))
      } catch (e) {
        insufficient = e instanceof ledger.InsufficientBalance
      }
      ok('返现格扣 3.01（只有 3.00）：InsufficientBalance', insufficient)
      ok('  …两格不变、没有新流水', JSON.stringify(await buckets(a.id)) === JSON.stringify({ topup: 500, cash: 300 }) && (await prisma.balanceLog.count({ where: { userId: a.id } })) === 2)

      // 一条更新同时扣两格：充值格够、返现格不够 → 整条不生效（原子）
      const o = await mkOrder(a.id, 9)
      let atomic = false
      try {
        await ledger.inMoneyTx((tx) => ledger.postInTx(tx, { userId: a.id, topupDeltaCents: -100, cashDeltaCents: -400, type: 'HOLD', bizKey: `hold:${o.id}`, orderId: o.id }))
      } catch (e) {
        atomic = e instanceof ledger.InsufficientBalance
      }
      ok('两格一条条件更新：返现格不够时充值格也不扣（原子）', atomic && (await buckets(a.id)).topup === 500)

      const key = `adj:${uuid()}`
      await ledger.inMoneyTx((tx) => ledger.postInTx(tx, { userId: a.id, cashDeltaCents: 10, type: 'ADJUST', bizKey: key }))
      let dup = false
      try {
        await ledger.inMoneyTx((tx) => ledger.postInTx(tx, { userId: a.id, cashDeltaCents: 10, type: 'ADJUST', bizKey: key }))
      } catch (e) {
        dup = ledger.isBizKeyConflict(e)
      }
      ok('同一 bizKey 第二次：撞唯一键（isBizKeyConflict）、整笔回滚', dup && (await buckets(a.id)).cash === 310)

      let bad = false
      try {
        await ledger.inMoneyTx((tx) => ledger.postInTx(tx, { userId: a.id, cashDeltaCents: 10, type: 'TOPUP', bizKey: `topup:${o.id}`, orderId: o.id }))
      } catch (e) {
        bad = e instanceof ledger.LedgerError
      }
      ok('TOPUP 进返现格：LedgerError（方向写反是程序错误）', bad)
      ok('恒等式：返现格 = Σdelta、充值格 = Σtopup_delta', await identityOk(a.id))
    }

    console.log('\n【并发扣减：20 个请求抢 10 份，不超扣、不为负】')
    {
      const c = await mkUser('conc')
      await seed(c.id, 0, 1000)
      const rs = await Promise.allSettled(
        Array.from({ length: 20 }, () => ledger.inMoneyTx((tx) => ledger.postInTx(tx, { userId: c.id, cashDeltaCents: -100, type: 'WITHDRAW', bizKey: `adj:${uuid()}` }))),
      )
      const okN = rs.filter((r) => r.status === 'fulfilled').length
      const insuf = rs.filter((r) => r.status === 'rejected' && r.reason instanceof ledger.InsufficientBalance).length
      ok('恰好 10 个成功、10 个余额不足', okN === 10 && insuf === 10, `${okN}/${insuf}`)
      ok('返现格 = 0（不为负）', (await buckets(c.id)).cash === 0)
      const afters = (await prisma.balanceLog.findMany({ where: { userId: c.id, type: 'WITHDRAW' }, select: { balanceAfter: true } })).map((l) => centsOf(l.balanceAfter)).sort((x, y) => x - y)
      ok('10 条流水的「变动后余额」互不相同（0 … 9.00）', new Set(afters).size === 10 && afters[0] === 0 && afters[9] === 900, JSON.stringify(afters))
      ok('恒等式成立', await identityOk(c.id))
    }

    console.log('\n【预扣 H1 → H2 → H4：组合单，退款时支付宝部分只进充值格（D4）】')
    const h = await mkUser('hold')
    {
      await seed(h.id, 70, 50)
      const o = await mkOrder(h.id, 1.72)
      const r = await ledger.inMoneyTx((tx) => hold.holdInTx(tx, { orderId: o.id, userId: h.id, orderCents: 172 }))
      ok('H1：预扣充值 0.70 · 返现 0.50，差额 0.52 给支付宝', r.topupCents === 70 && r.cashCents === 50 && r.restCents === 52 && r.state === 'HELD')
      ok('  …两格被扣空', JSON.stringify(await buckets(h.id)) === JSON.stringify({ topup: 0, cash: 0 }))
      const hl = await prisma.balanceLog.findUnique({ where: { bizKey: `hold:${o.id}` } })
      ok('  …一条 HOLD 流水（hold:<orderId>，两格同一行）', !!hl && hl.type === 'HOLD' && hl.topupDeltaCents === -70 && centsOf(hl.delta) === -50 && hl.orderId === o.id)
      let twice = false
      try {
        await ledger.inMoneyTx((tx) => hold.holdInTx(tx, { orderId: o.id, userId: h.id, orderCents: 172 }))
      } catch (e) {
        twice = (e as { code?: string }).code === 'P2002' || e instanceof hold.NothingToHold
      }
      ok('同一订单第二次预扣：被拒（order_id 唯一 / 余额已空）', twice)

      // H2：翻 PAID 的同一事务（模拟 S2 的 fulfillOrder：订单 CAS → 确认预扣 → 按预扣拆两行 Payment）
      await ledger.inMoneyTx(async (tx) => {
        await tx.order.update({ where: { id: o.id }, data: { payStatus: 'PAID', paidAt: new Date(), deliveryStatus: 'PROCESSING', payMethod: 'ALIPAY' } })
        const c = await hold.captureInTx(tx, o.id)
        await tx.payment.create({ data: { orderId: o.id, payMethod: 'BALANCE', amount: D(((c?.topupCents ?? 0) + (c?.cashCents ?? 0)) / 100), status: 1 } })
        await tx.payment.create({ data: { orderId: o.id, payMethod: 'ALIPAY', amount: D(0.52), status: 1, tradeNo: `${TAG}v1` } })
      })
      ok('H2：CAPTURED', (await prisma.balanceHold.findUnique({ where: { orderId: o.id } }))?.state === 'CAPTURED')
      let again = false
      try {
        await ledger.inMoneyTx((tx) => hold.captureInTx(tx, o.id))
      } catch (e) {
        again = e instanceof hold.HoldStateError
      }
      ok('再确认一次：HoldStateError（不是 HELD 就抛错，绝不补扣）', again)
      let noCover = false
      const o2 = await mkOrder(h.id, 1)
      try {
        await ledger.inMoneyTx((tx) => hold.captureInTx(tx, o2.id, { mustCoverCents: 100 }))
      } catch (e) {
        noCover = e instanceof hold.HoldStateError
      }
      ok('余额付清（via=BALANCE）却没有预扣行：抛错（fail closed）', noCover)
      ok('没有预扣的订单确认：返回 null（纯支付宝，按原逻辑）', (await ledger.inMoneyTx((tx) => hold.captureInTx(tx, o2.id))) === null)

      // H4：取消退款，支付宝实收含尾差 0.52
      const rf = await ledger.inMoneyTx((tx) => hold.refundInTx(tx, { orderId: o.id, userId: h.id, alipayPaidCents: 52, reason: 'SMS_CANCEL' }))
      ok('H4：退款 充值 +1.22 · 返现 +0.50（支付宝 0.52 进充值格，不进返现格）', rf.topupCents === 122 && rf.cashCents === 50 && rf.totalCents === 172)
      ok('  …两格', JSON.stringify(await buckets(h.id)) === JSON.stringify({ topup: 122, cash: 50 }))
      ok('  …预扣 REFUNDED、reason 写上', (await prisma.balanceHold.findUnique({ where: { orderId: o.id } }))?.reason === 'SMS_CANCEL')
      let reref = false
      try {
        await ledger.inMoneyTx((tx) => hold.refundInTx(tx, { orderId: o.id, userId: h.id, alipayPaidCents: 52, reason: 'SMS_CANCEL' }))
      } catch (e) {
        reref = e instanceof hold.HoldStateError
      }
      ok('并发 / 重放第二次退款：HoldStateError，两格只加一次', reref && (await buckets(h.id)).topup === 122)
      await prisma.order.update({ where: { id: o.id }, data: { payStatus: 'REFUNDED', deliveryStatus: 'CANCELLED' } })

      // 纯支付宝单（没有预扣行）取消：整笔进充值格
      const o3 = await mkOrder(h.id, 1.7, { payStatus: 'PAID', deliveryStatus: 'PROCESSING', paidAt: new Date() })
      await prisma.payment.create({ data: { orderId: o3.id, payMethod: 'ALIPAY', amount: D(1.7), status: 1, tradeNo: `${TAG}v2` } })
      const rf3 = await ledger.inMoneyTx((tx) => hold.refundInTx(tx, { orderId: o3.id, userId: h.id, alipayPaidCents: 173, reason: 'SMS_CANCEL' }))
      ok('纯支付宝单退款：实收 1.73 全进充值格', rf3.topupCents === 173 && rf3.cashCents === 0 && rf3.hold === null)
      await prisma.order.update({ where: { id: o3.id }, data: { payStatus: 'REFUNDED', deliveryStatus: 'CANCELLED' } })
      ok('恒等式成立', await identityOk(h.id))
    }

    console.log('\n【预扣 H1 → H3 释放：前提不满足一律抛错，关单一起回滚】')
    {
      const r = await mkUser('rel')
      await seed(r.id, 300, 0)
      const o = await mkOrder(r.id, 2)
      await ledger.inMoneyTx((tx) => hold.holdInTx(tx, { orderId: o.id, userId: r.id, orderCents: 200 }))
      const rel = (reason = 'BUYER_CLOSE') => ledger.inMoneyTx((tx) => hold.releaseInTx(tx, o.id, { reason }))
      const blockedWhy = async (fn: () => Promise<unknown>) => {
        try {
          await fn()
          return null
        } catch (e) {
          return e instanceof hold.HoldReleaseBlocked ? e.why : e instanceof hold.HoldStateError ? 'STATE' : String(e)
        }
      }
      ok('订单还没取消就调释放：抛 HoldReleaseBlocked(ORDER_NOT_CLOSED)', (await blockedWhy(() => rel())) === 'ORDER_NOT_CLOSED')
      // 调用方的真实写法：同一事务里先关单、再释放。还有在途收款单时整笔回滚，订单不会停在「已取消 + 预扣还 HELD」（D33、R9）
      const closeAndRelease = () =>
        ledger.inMoneyTx(async (tx) => {
          await tx.order.updateMany({ where: { id: o.id, payStatus: 'UNPAID', deliveryStatus: { not: 'CANCELLED' } }, data: { deliveryStatus: 'CANCELLED' } })
          return hold.releaseInTx(tx, o.id, { reason: 'VMQ_EXPIRED' })
        })
      const untouched = async () =>
        (await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).deliveryStatus !== 'CANCELLED' &&
        (await prisma.balanceHold.findUniqueOrThrow({ where: { orderId: o.id } })).state === 'HELD' &&
        (await buckets(r.id)).topup === 100
      const v = await prisma.vmqOrder.create({ data: { orderId: `${TAG}vr${seq}`, bizType: 'order', bizId: o.id, outTradeNo: o.orderNo, price: D(0.01), reallyPrice: D(0.01), state: 0 } })
      createdVmqIds.push(v.id)
      ok('关单事务里还有 state=0 的收款单：抛 HoldReleaseBlocked(HAS_PAYMENT)', (await blockedWhy(closeAndRelease)) === 'HAS_PAYMENT')
      ok('  …关单一起回滚：订单仍待支付、预扣仍 HELD、充值格没加回', await untouched())
      await prisma.vmqOrder.update({ where: { id: v.id }, data: { state: 1 } })
      ok('收款单 state=1（钱到了、履约还没做）：同样抛 HAS_PAYMENT、整笔回滚', (await blockedWhy(closeAndRelease)) === 'HAS_PAYMENT' && (await untouched()))
      await prisma.vmqOrder.update({ where: { id: v.id }, data: { state: -1 } })
      const done = await closeAndRelease()
      ok('收款单 −1：关单 + 释放在同一事务里成功', done.released === true && (await prisma.order.findUniqueOrThrow({ where: { id: o.id } })).deliveryStatus === 'CANCELLED')
      ok('  …充值格原路加回 3.00→（扣 2.00 后 1.00）→ 3.00', (await buckets(r.id)).topup === 300)
      const rl = await prisma.balanceLog.findUnique({ where: { bizKey: `release:${o.id}` } })
      ok('  …一条 RELEASE 流水（release:<orderId>）', !!rl && rl.topupDeltaCents === 200 && rl.type === 'RELEASE')
      ok('再释放一次：ALREADY_RELEASED（RELEASED 是终态、空操作），不重复加', eq((await rel()) as unknown, { released: false, why: 'ALREADY_RELEASED' }) && (await buckets(r.id)).topup === 300)
      // 预扣已确认（CAPTURED）的订单被当成未付款关单：抛 HoldStateError，不释放
      const oc = await mkOrder(r.id, 1)
      await ledger.inMoneyTx((tx) => hold.holdInTx(tx, { orderId: oc.id, userId: r.id, orderCents: 100 }))
      await ledger.inMoneyTx(async (tx) => {
        await tx.order.update({ where: { id: oc.id }, data: { payStatus: 'PAID', paidAt: new Date(), deliveryStatus: 'PROCESSING', payMethod: 'BALANCE' } })
        await hold.captureInTx(tx, oc.id, { mustCoverCents: 100 })
        await tx.payment.create({ data: { orderId: oc.id, payMethod: 'BALANCE', amount: D(1), status: 1 } })
      })
      ok('预扣已 CAPTURED 却调释放：抛 HoldStateError、预扣不变', (await blockedWhy(() => ledger.inMoneyTx((tx) => hold.releaseInTx(tx, oc.id, { reason: 'ADMIN_CLOSE' })))) === 'STATE' && (await prisma.balanceHold.findUniqueOrThrow({ where: { orderId: oc.id } })).state === 'CAPTURED')
      await ledger.inMoneyTx(async (tx) => {
        await tx.order.update({ where: { id: oc.id }, data: { payStatus: 'REFUNDED', deliveryStatus: 'CANCELLED' } })
        await hold.refundInTx(tx, { orderId: oc.id, userId: r.id, alipayPaidCents: null, reason: 'SMS_CANCEL' })
      })
      const o2 = await mkOrder(r.id, 1, { deliveryStatus: 'CANCELLED' })
      ok('没有预扣的订单：NO_HOLD（空操作）', eq((await ledger.inMoneyTx((tx) => hold.releaseInTx(tx, o2.id, { reason: 'VMQ_EXPIRED' }))) as unknown, { released: false, why: 'NO_HOLD' }))
      const z = await mkUser('zero')
      const oz = await mkOrder(z.id, 1)
      let nothing = false
      try {
        await ledger.inMoneyTx((tx) => hold.holdInTx(tx, { orderId: oz.id, userId: z.id, orderCents: 100 }))
      } catch (e) {
        nothing = e instanceof hold.NothingToHold
      }
      ok('两格都是 0：NothingToHold、不建预扣行', nothing && !(await prisma.balanceHold.findUnique({ where: { orderId: oz.id } })))
      ok('恒等式成立', await identityOk(r.id))
    }

    console.log('\n【lockHoldInTx 不对不存在的预扣行加锁：纯支付宝单退款 与 同一买家下单 并发不死锁】')
    {
      const g = await mkUser('gap')
      await seed(g.id, 500, 0)
      // A：一张纯支付宝单（没有预扣行）要退款；B：同一买家刚下的新单（id 更大，落在唯一索引的同一个间隙里）
      const oA = await mkOrder(g.id, 1, { payStatus: 'PAID', deliveryStatus: 'PROCESSING', paidAt: new Date(), payMethod: 'ALIPAY' })
      await prisma.payment.create({ data: { orderId: oA.id, payMethod: 'ALIPAY', amount: D(1), status: 1, tradeNo: `${TAG}gA` } })
      const oB = await mkOrder(g.id, 1)
      const sleep = (ms: number) => new Promise((x) => setTimeout(x, ms))
      let signalB!: () => void
      const bLocked = new Promise<void>((x) => (signalB = x))
      // 不走 inMoneyTx（它遇到死锁会重试一次，会把问题藏起来）
      const txB = prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM users WHERE id = ${g.id} FOR UPDATE` // 下单事务第一步：锁用户行
          signalB()
          await sleep(800) // 等 A 走到「锁预扣行 → 等用户行」
          await hold.holdInTx(tx, { orderId: oB.id, userId: g.id, orderCents: 100 })
        },
        { timeout: 30_000, maxWait: 5_000 },
      )
      await bLocked
      const txA = prisma.$transaction((tx) => hold.refundInTx(tx, { orderId: oA.id, userId: g.id, alipayPaidCents: 100, reason: 'SMS_CANCEL' }), { timeout: 30_000, maxWait: 5_000 })
      const [ra, rb] = await Promise.allSettled([txA, txB])
      const why = [ra, rb].map((x) => (x.status === 'rejected' ? String((x.reason as Error)?.message ?? x.reason).slice(0, 160) : 'ok')).join(' | ')
      ok('两个事务都提交（没有死锁 / 写冲突 P2034）', ra.status === 'fulfilled' && rb.status === 'fulfilled', why)
      ok('  …B 的预扣建好（HELD）、A 的退款入账（充值格 5.00 − 1.00 + 1.00）', (await prisma.balanceHold.findUnique({ where: { orderId: oB.id } }))?.state === 'HELD' && (await buckets(g.id)).topup === 500)
      // 收尾：A 置已退款；B 关单释放（让后面的对账保持干净）
      await prisma.order.update({ where: { id: oA.id }, data: { payStatus: 'REFUNDED', deliveryStatus: 'CANCELLED' } })
      await ledger.inMoneyTx(async (tx) => {
        await tx.order.update({ where: { id: oB.id }, data: { deliveryStatus: 'CANCELLED' } })
        await hold.releaseInTx(tx, oB.id, { reason: 'BUYER_CLOSE' })
      })
      ok('  …恒等式成立', await identityOk(g.id))
    }

    console.log('\n【第 61 条 预扣期间提现：只能提返现格剩余部分】')
    {
      const w = await mkUser('wd')
      await seed(w.id, 0, 500)
      const o = await mkOrder(w.id, 3)
      await ledger.inMoneyTx((tx) => hold.holdInTx(tx, { orderId: o.id, userId: w.id, orderCents: 300 }))
      const r1 = await adjust.adminAdjust({ actorUserId: null, kind: 'CASH_SUB', userId: w.id, amountCents: 300, reason: '提现', requestId: uuid() })
      ok('返现格还剩 2.00 时提 3.00：余额不足', !r1.ok && r1.status === 400)
      const r2 = await adjust.adminAdjust({ actorUserId: null, kind: 'CASH_SUB', userId: w.id, amountCents: 200, reason: '提现', requestId: uuid() })
      ok('提 2.00：成功，返现格 0', r2.ok && (await buckets(w.id)).cash === 0)
      ok('预扣不受影响：仍 HELD、3.00', (await prisma.balanceHold.findUnique({ where: { orderId: o.id } }))?.state === 'HELD')
      await prisma.order.update({ where: { id: o.id }, data: { deliveryStatus: 'CANCELLED' } })
      await ledger.inMoneyTx((tx) => hold.releaseInTx(tx, o.id, { reason: 'BUYER_CLOSE' }))
      ok('关单释放：预扣的 3.00 原路回返现格', (await buckets(w.id)).cash === 300)
    }

    console.log('\n【第 66 条 推荐返现结算：语义不变，流水多出 topup_after_cents】')
    const promoter = await mkUser('promo')
    const buyer = await mkUser('buyer')
    let refOrderId = 0
    {
      const o = await mkOrder(buyer.id, 100, { payStatus: 'PAID', deliveryStatus: 'DELIVERED', paidAt: new Date(), referrerId: promoter.id, referralReward: D(3.3) })
      refOrderId = o.id
      await referral.settleReferral(o.id)
      await referral.settleReferral(o.id) // 幂等
      const logs = await prisma.balanceLog.findMany({ where: { userId: promoter.id } })
      ok('恰好一条 REFERRAL 流水', logs.length === 1 && logs[0].type === 'REFERRAL')
      ok('note 一字不改：「订单#<id> 内推返现」', logs[0].note === `订单#${o.id} 内推返现`)
      ok('orderId = 产生返现的订单；bizKey 为空（幂等靠 ReferralReward）', logs[0].orderId === o.id && logs[0].bizKey === null)
      ok('只动返现格：delta 3.30、topup_delta 0、topup_after_cents = 0（不是 NULL）', centsOf(logs[0].delta) === 330 && logs[0].topupDeltaCents === 0 && logs[0].topupAfterCents === 0)
      ok('ReferralReward 金额与状态不变', (await prisma.referralReward.findUnique({ where: { orderId: o.id } }))?.status === 'SETTLED')
      ok('推广人充值格不动', (await buckets(promoter.id)).topup === 0 && (await buckets(promoter.id)).cash === 330)
    }

    console.log('\n【第 63 条 后台调余额：同一请求号重放只记一次（含部署前 vmq_locks 的 bal:）】')
    {
      const u = await mkUser('adj')
      const rid = uuid()
      const r1 = await adjust.adminAdjust({ actorUserId: null, kind: 'CASH_ADD', userId: u.id, amountCents: 500, reason: '补偿', requestId: rid })
      const r2 = await adjust.adminAdjust({ actorUserId: null, kind: 'CASH_ADD', userId: u.id, amountCents: 500, reason: '补偿', requestId: rid })
      ok('第一次记账、第二次 duplicate', r1.ok && !r1.duplicate && r2.ok && r2.duplicate)
      ok('  …只一条流水、余额 5.00', (await prisma.balanceLog.count({ where: { userId: u.id } })) === 1 && (await buckets(u.id)).cash === 500)
      const r3 = await adjust.adminAdjust({ actorUserId: null, kind: 'CASH_ADD', userId: u.id, amountCents: 600, reason: '补偿', requestId: rid })
      ok('同一请求号换了金额：409', !r3.ok && r3.status === 409)
      const rid2 = uuid()
      await prisma.vmqLock.create({ data: { lockKey: `bal:${rid2}`, orderId: `bal:${u.id}:-200` } })
      createdLockKeys.push(`bal:${rid2}`)
      const r4 = await adjust.adminAdjust({ actorUserId: null, kind: 'CASH_SUB', userId: u.id, amountCents: 200, reason: null, requestId: rid2, source: 'referrals' })
      ok('部署前旧版本已记过（vmq_locks 有 bal:<requestId>）：duplicate、不再记账', r4.ok && r4.duplicate && (await prisma.balanceLog.count({ where: { userId: u.id } })) === 1)
      const r5 = await adjust.adminAdjust({ actorUserId: null, kind: 'CASH_SUB', userId: u.id, amountCents: 300, reason: null, requestId: rid2, source: 'referrals' })
      ok('  …同一个旧请求号换了金额：409', !r5.ok && r5.status === 409)
      await prisma.vmqLock.delete({ where: { lockKey: `bal:${rid2}` } })
      const r6 = await adjust.adminAdjust({ actorUserId: null, kind: 'CASH_SUB', userId: u.id, amountCents: 100, reason: null, source: 'referrals' })
      const r7 = await adjust.adminAdjust({ actorUserId: null, kind: 'CASH_SUB', userId: u.id, amountCents: 100, reason: null, source: 'referrals' })
      ok('旧后台页面不带请求号：与原来一样不去重（两条 WITHDRAW）', r6.ok && r7.ok && (await buckets(u.id)).cash === 300)
      const legacyNote = await prisma.balanceLog.findFirst({ where: { userId: u.id, type: 'WITHDRAW' } })
      ok('  …旧入口不填备注时 note = 「提现/扣减」（与改造前一致）', legacyNote?.note === '提现/扣减' && legacyNote?.bizKey === null)
      // 扣减类重放：第一次已把余额扣光，第二次的条件更新必然失败 —— 必须认出是重放（duplicate），不能报「余额不足」
      const e1 = await mkUser('exact')
      await seed(e1.id, 0, 150)
      const rid3 = uuid()
      const x1 = await adjust.adminAdjust({ actorUserId: null, kind: 'CASH_SUB', userId: e1.id, amountCents: 150, reason: '提现', requestId: rid3 })
      const x2 = await adjust.adminAdjust({ actorUserId: null, kind: 'CASH_SUB', userId: e1.id, amountCents: 150, reason: '提现', requestId: rid3 })
      ok('提光余额后同一请求号重放：duplicate（不是「余额不足」），只扣一次', x1.ok && !x1.duplicate && x2.ok && x2.duplicate && (await buckets(e1.id)).cash === 0)
      await seed(e1.id, 0, 150)
      const rid4 = uuid()
      const [c1, c2] = await Promise.all([
        adjust.adminAdjust({ actorUserId: null, kind: 'CASH_SUB', userId: e1.id, amountCents: 150, reason: '提现', requestId: rid4 }),
        adjust.adminAdjust({ actorUserId: null, kind: 'CASH_SUB', userId: e1.id, amountCents: 150, reason: '提现', requestId: rid4 }),
      ])
      ok('同一请求号并发两次（余额只够一次）：一次记账、一次 duplicate', c1.ok && c2.ok && [c1.duplicate, c2.duplicate].filter(Boolean).length === 1 && (await buckets(e1.id)).cash === 0, JSON.stringify([c1, c2]))
      ok('  …恒等式成立', await identityOk(e1.id))
      const noReason = await adjust.adminAdjust({ actorUserId: null, kind: 'CASH_ADD', userId: u.id, amountCents: 1, reason: '  ', requestId: uuid() })
      ok('新入口不填原因：400', !noReason.ok && noReason.status === 400)
      // 旧入口「内推管理 → 提现/调整」入参不变：改造前备注 max(255)，照旧收 201–255 字；新入口仍限 200
      const long230 = '线下打款说明'.repeat(38) + '12' // 230 字
      const lg1 = await adjust.adminAdjust({ actorUserId: null, kind: 'CASH_ADD', userId: u.id, amountCents: 1, reason: long230, requestId: uuid(), source: 'referrals' })
      ok('旧入口 230 字备注：照常记账（note 原样存下）', lg1.ok && (await prisma.balanceLog.findUnique({ where: { id: lg1.ok ? (lg1.logId ?? 0) : 0 } }))?.note === long230)
      const lg2 = await adjust.adminAdjust({ actorUserId: null, kind: 'CASH_ADD', userId: u.id, amountCents: 1, reason: long230 + 'x'.repeat(26), requestId: uuid(), source: 'referrals' })
      ok('旧入口 256 字：400（与改造前 zod max(255) 一致）', !lg2.ok && lg2.status === 400)
      const lg3 = await adjust.adminAdjust({ actorUserId: null, kind: 'CASH_ADD', userId: u.id, amountCents: 1, reason: long230, requestId: uuid() })
      ok('新入口 230 字：400「原因最多 200 字」', !lg3.ok && lg3.status === 400 && lg3.message === '原因最多 200 字')
      await adjust.adminAdjust({ actorUserId: null, kind: 'CASH_SUB', userId: u.id, amountCents: 1, reason: '冲回上面那 1 分', requestId: uuid(), source: 'referrals' })
      const audit = await prisma.auditEvent.findFirst({ where: { action: 'wallet.adjust', targetType: 'user', targetId: String(u.id) }, orderBy: { id: 'asc' } })
      const diff = audit?.diff as { before?: { cashCents: number }; after?: { cashCents: number }; bizKey?: string } | null
      ok('审计：记了调整前后两格与 bizKey', !!diff && diff.before?.cashCents === 0 && diff.after?.cashCents === 500 && diff.bizKey === `adj:${rid}`)
      ok('旧入口的审计 action = wallet.adjust_legacy（不带请求号两次 + 长备注两次）', (await prisma.auditEvent.count({ where: { action: 'wallet.adjust_legacy', targetId: String(u.id) } })) === 4)
      ok('恒等式成立', await identityOk(u.id))
    }

    console.log('\n【第 95 条 返现扣回：先返现格、不够再充值格、扣到 0 记差额；同一订单只扣一次】')
    {
      const mk = async (name: string, topup: number, cash: number, reward: number) => {
        const p = await mkUser(name)
        await seed(p.id, topup, cash)
        const o = await mkOrder(buyer.id, 50, { payStatus: 'PAID', deliveryStatus: 'DELIVERED', referrerId: p.id, referralReward: D(reward / 100) })
        await prisma.referralReward.create({ data: { orderId: o.id, referrerId: p.id, buyerId: buyer.id, productId: product.id, amount: D(reward / 100), status: 'SETTLED', settledAt: new Date() } })
        return { p, o }
      }
      const x = await mk('cb1', 500, 100, 300)
      const r1 = await adjust.adminAdjust({ actorUserId: null, kind: 'CLAWBACK', referralOrderId: x.o.id, reason: '推荐订单退款', requestId: uuid() })
      ok('返现格 1.00、充值格 5.00 时扣回 3.00 → 返现格 0、充值格 3.00', r1.ok && JSON.stringify(await buckets(x.p.id)) === JSON.stringify({ topup: 300, cash: 0 }))
      const cl = await prisma.balanceLog.findUnique({ where: { bizKey: `clawback:${x.o.id}` } })
      ok('  …一条 CLAWBACK（两格同一行：返现 −1.00 · 充值 −2.00）', !!cl && centsOf(cl.delta) === -100 && cl.topupDeltaCents === -200 && cl.orderId === x.o.id)
      const r2 = await adjust.adminAdjust({ actorUserId: null, kind: 'CLAWBACK', referralOrderId: x.o.id, reason: '再点一次', requestId: uuid() })
      ok('同一张订单再点一次：duplicate，只扣一次', r2.ok && r2.duplicate && (await buckets(x.p.id)).topup === 300)
      const y = await mk('cb2', 100, 0, 300)
      const r3 = await adjust.adminAdjust({ actorUserId: null, kind: 'CLAWBACK', referralOrderId: y.o.id, reason: '推荐订单退款', requestId: uuid() })
      ok('两格合计 1.00 不够扣 3.00：扣到 0、差额 2.00', r3.ok && r3.shortfallCents === 200 && JSON.stringify(await buckets(y.p.id)) === JSON.stringify({ topup: 0, cash: 0 }))
      const au = await prisma.auditEvent.findFirst({ where: { action: 'wallet.adjust', targetId: String(y.p.id) }, orderBy: { id: 'desc' } })
      ok('  …差额写进审计（shortfallCents）与内部备注', (au?.diff as { shortfallCents?: number } | null)?.shortfallCents === 200 && !!(await prisma.balanceLog.findUnique({ where: { bizKey: `clawback:${y.o.id}` } }))?.note?.includes('不足'))
      const z = await mk('cb3', 0, 0, 100)
      const r4 = await adjust.adminAdjust({ actorUserId: null, kind: 'CLAWBACK', referralOrderId: z.o.id, reason: '推荐订单退款', requestId: uuid() })
      const r5 = await adjust.adminAdjust({ actorUserId: null, kind: 'CLAWBACK', referralOrderId: z.o.id, reason: '推荐订单退款', requestId: uuid() })
      ok('两格都是 0：记一条 0 元扣回占住 bizKey、差额 1.00；再点也不会以后再扣', r4.ok && r4.shortfallCents === 100 && r5.ok && r5.duplicate)
      // 累计返现口径：Σ 已结算返现 − Σ 扣回（实际扣到的部分）；ReferralReward 不改
      const cbs = await clawback.clawbackCentsByUser([x.p.id, y.p.id, z.p.id])
      ok('返现扣回合计：全额扣回 3.00、扣回不足只算实际扣到的 1.00、两格为 0 的记 0', cbs.get(x.p.id) === 300 && cbs.get(y.p.id) === 100 && (cbs.get(z.p.id) ?? 0) === 0, JSON.stringify(Array.from(cbs)))
      ok('  …ReferralReward 保持 SETTLED、金额不变（待结算口径不受影响）', (await prisma.referralReward.findUnique({ where: { orderId: x.o.id } }))?.status === 'SETTLED')
      const xv = await dto.buildWalletView({ id: x.p.id })
      ok('  …与钱包页 totals.referral 同一口径（这里没有 REFERRAL 流水：0 − 3.00）', xv.totals!.referral === -300 && (await clawback.clawbackCentsOf(x.p.id)) === 300)
      const nf = await adjust.adminAdjust({ actorUserId: null, kind: 'CLAWBACK', referralOrderId: 999999999, reason: 'x', requestId: uuid() })
      ok('没有已入账返现的订单：404', !nf.ok && nf.status === 404)
      ok('恒等式成立', (await identityOk(x.p.id)) && (await identityOk(y.p.id)) && (await identityOk(z.p.id)))
    }

    console.log('\n【第 96 条 充值退还：同一支付宝流水号只扣一次】')
    {
      const t = await mkUser('tr')
      await seed(t.id, 1000, 0)
      const no = `2026092922${String(Date.now()).slice(-10)}0001`
      const r1 = await adjust.adminAdjust({ actorUserId: null, kind: 'TOPUP_SUB', userId: t.id, amountCents: 300, reason: '误付线下原路退回', requestId: uuid(), alipayNo: no })
      const r2 = await adjust.adminAdjust({ actorUserId: null, kind: 'TOPUP_SUB', userId: t.id, amountCents: 300, reason: '刷新后又记一次', requestId: uuid(), alipayNo: no })
      ok('同一流水号记两次（请求号不同）：第二次 duplicate，充值格只扣一次', r1.ok && r2.ok && r2.duplicate && (await buckets(t.id)).topup === 700)
      const full = `${no.slice(0, -1)}7`
      const f1 = await adjust.adminAdjust({ actorUserId: null, kind: 'TOPUP_SUB', userId: t.id, amountCents: 700, reason: '全额退还', requestId: uuid(), alipayNo: full })
      const f2 = await adjust.adminAdjust({ actorUserId: null, kind: 'TOPUP_SUB', userId: t.id, amountCents: 700, reason: '全额退还', requestId: uuid(), alipayNo: full })
      ok('全额退还后同一流水号再记：duplicate（不是「充值余额不足」）', f1.ok && f2.ok && f2.duplicate && (await buckets(t.id)).topup === 0)
      await seed(t.id, 700, 0)
      const r3 = await adjust.adminAdjust({ actorUserId: null, kind: 'TOPUP_SUB', userId: t.id, amountCents: 400, reason: 'x', requestId: uuid(), alipayNo: no })
      ok('同一流水号换了金额：409', !r3.ok && r3.status === 409)
      const r4 = await adjust.adminAdjust({ actorUserId: null, kind: 'TOPUP_SUB', userId: t.id, amountCents: 100, reason: 'x', requestId: uuid() })
      ok('不填流水号：400', !r4.ok && r4.status === 400)
      const r5 = await adjust.adminAdjust({ actorUserId: null, kind: 'TOPUP_SUB', userId: t.id, amountCents: 800, reason: 'x', requestId: uuid(), alipayNo: `${no.slice(0, -1)}9` })
      ok('充值格不够：400、不扣成负数', !r5.ok && r5.status === 400 && (await buckets(t.id)).topup === 700)
      ok('流水类型 TOPUP_REFUND、bizKey topup_refund:<流水号>', (await prisma.balanceLog.findUnique({ where: { bizKey: `topup_refund:${no}` } }))?.type === 'TOPUP_REFUND')
    }

    console.log('\n【第 62 条 旧账兼容：历史流水（topup_after_cents 为空）】')
    const legacy = await mkUser('legacy')
    {
      // 旧镜像写的流水：只有原来的几列（新列取默认值）
      await prisma.balanceLog.create({ data: { userId: legacy.id, delta: D(16.5), balanceAfter: D(16.5), type: 'REFERRAL', note: `订单#${refOrderId} 内推返现` } })
      await prisma.balanceLog.create({ data: { userId: legacy.id, delta: D(-4), balanceAfter: D(12.5), type: 'WITHDRAW', note: '提现到支付宝（线下）' } })
      await prisma.user.update({ where: { id: legacy.id }, data: { balance: D(12.5) } })
      const v = await dto.buildWalletView({ id: legacy.id })
      ok('钱包总额 = 改造前余额 12.50（充值格 0）', v.balanceCents === 1250 && v.topupCents === 0 && v.cashCents === 1250 && v.balance === 12.5)
      ok('历史流水的变动后总余额按「返现格 + 0」显示', v.logs[0].afterCents === 1250 && v.logs[1].afterCents === 1650)
      ok('累计数：返现 16.50、已提现 4.00、充值 / 消费 / 退回为 0', v.totals!.referral === 1650 && v.totals!.withdrawn === 400 && v.totals!.topupIn === 0 && v.totals!.spent === 0 && v.totals!.refunded === 0)
      ok('REFERRAL 流水的 ref：反查只认 referrerId = 本人（别人推广的订单不给）', v.logs[1].ref === null)
      ok('users.balance = Σ delta', await identityOk(legacy.id))
    }

    console.log('\n【第 114 条 钱包接口：canUseForJiema、累计数、白名单、分类、预扣、迟到退入】')
    {
      await prisma.setting.deleteMany({ where: { key: { in: ['sms_config', 'wallet_config'] } } })
      const pv = await dto.buildWalletView({ id: promoter.id })
      ok('B0 环境（sms_config 不存在）：canUseForJiema=false、topupOpen=false、不显示开票一句', !pv.canUseForJiema && !pv.topupOpen && !pv.showInvoiceNotice)
      ok('REFERRAL 流水 ref = 推广的订单（打码单号 + 商品名）', pv.logs[0].ref?.kind === 'REFERRAL' && pv.logs[0].ref?.orderNoMasked.includes('*') === true)
      const keys = JSON.stringify(pv)
      ok('响应里没有 note / bizKey', !/"note"|"bizKey"|"biz_key"/.test(keys))
      ok('pendingReward（元）与 pendingRewardCents 同口径', pv.pendingReward * 100 === pv.pendingRewardCents)
      const hv = await dto.buildWalletView({ id: h.id })
      ok('totals 恒等式对真实流水成立（h：预扣 → 确认 → 退款 + 纯支付宝退款）', hv.balanceCents + hv.holdingCents === dto.totalsIdentity(hv.totals!), `${hv.balanceCents} ${JSON.stringify(hv.totals)}`)
      ok('累计消费 = 已确认的余额付款 1.20；累计退回 = 1.72 + 1.73', hv.totals!.spent === 120 && hv.totals!.refunded === 345)
      const back = await dto.buildWalletView({ id: h.id }, { cat: 'back' })
      ok('分类「退回」只有 RELEASE / REFUND / LATEPAY', back.logs.length === 2 && back.logs.every((l) => ['RELEASE', 'REFUND', 'LATEPAY'].includes(l.type)))
      ok('接码流水 ref：「服务 · 国家/地区」+ 打码单号', back.logs[0].ref?.kind === 'SMS' && back.logs[0].ref.title === 'Telegram · 印尼')
      // 预扣中
      const q = await mkUser('q')
      await seed(q.id, 200, 0)
      const oq = await mkOrder(q.id, 5)
      await ledger.inMoneyTx((tx) => hold.holdInTx(tx, { orderId: oq.id, userId: q.id, orderCents: 500 }))
      const qv = await dto.buildWalletView({ id: q.id })
      ok('有 HELD 预扣：可用余额不含它、单独 holdingCents，列出号码页链接', qv.balanceCents === 0 && qv.holdingCents === 200 && qv.holds[0]?.href === `/jiema/order/${oq.orderNo}`)
      ok('恒等式：可用 + 预扣中 = 累计数右边', qv.balanceCents + qv.holdingCents === dto.totalsIdentity(qv.totals!))
      const brief = await dto.buildWalletView({ id: q.id }, { brief: true })
      ok('brief=1 只给余额（不查流水）', brief.logs.length === 0 && brief.balanceCents === 0 && brief.holdingCents === 200)
      ok('  …brief 不给 totals（null，不再拿空流水算出「累计消费 −2.00」）', brief.totals === null && qv.totals!.spent >= 0)
      await prisma.order.update({ where: { id: oq.id }, data: { deliveryStatus: 'CANCELLED' } })
      await ledger.inMoneyTx((tx) => hold.releaseInTx(tx, oq.id, { reason: 'BUYER_CLOSE' }))
      const qv2 = await dto.buildWalletView({ id: q.id })
      ok('释放之后：累计数一个都不变（RELEASE 不进累计）', JSON.stringify(qv2.totals) === JSON.stringify(qv.totals) && qv2.balanceCents === 200)
      // 迟到退入（B1 才有写入方；这里用 ledger 直接记一条，并配一条已处理的待核实条目，W7 才对得上）
      const lateOrder = await mkOrder(q.id, 5, { deliveryStatus: 'CANCELLED' })
      const ekey = `vmq_unmatched:${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
      const tradeNo = `20260929${String(Date.now()).slice(-10)}77`
      await prisma.setting.create({
        data: { key: ekey, value: JSON.stringify({ reason: 'no_pending_match', price: '5.03', type: 2, at: Date.now(), handledAt: Date.now(), handledBy: 'itest', handledAs: 'LATEPAY', orderId: lateOrder.id, tradeNo }) },
      })
      await prisma.setting.create({ data: { key: `latepay_trade:${tradeNo}`, value: JSON.stringify({ entryKey: ekey }) } })
      createdSettingKeys.push(ekey, `latepay_trade:${tradeNo}`)
      await ledger.inMoneyTx((tx) => ledger.postInTx(tx, { userId: q.id, topupDeltaCents: 503, type: 'LATEPAY', bizKey: `latepay:${ekey}`, orderId: lateOrder.id }))
      const qv3 = await dto.buildWalletView({ id: q.id })
      ok('近 7 天的 LATEPAY 进 recentLateCredits（钱包页横幅）', qv3.recentLateCredits.length === 1 && qv3.recentLateCredits[0].cents === 503 && qv3.recentLateCredits[0].ref?.orderNoMasked.includes('*') === true)
      ok('累计退回含 LATEPAY', qv3.totals!.refunded === 503)
      // 打开接码与余额支付（S4 全量开放那一刻）→ canUseForJiema=true
      await prisma.setting.create({ data: { key: 'wallet_config', value: JSON.stringify(config.FACTORY_WALLET_CONFIG) } })
      // S1 起 sms_config 按整份 zod 校验（lib/jiema-config-schema.ts）；接码下单（S2）交付前 JIEMA_ORDER_AVAILABLE=false，
      // 「对全部用户开放」不成立，canUseForJiema 恒为 false（S2 把常量改成 true 后这里自动变成 true 的断言）
      const { FACTORY_SMS_CONFIG, JIEMA_ORDER_AVAILABLE } = await import('../src/lib/jiema-config-schema')
      const smsOpen = JSON.stringify({ ...FACTORY_SMS_CONFIG, enabled: true, audience: 'ALL' })
      await prisma.setting.create({ data: { key: 'sms_config', value: smsOpen } })
      ok(`sms_config 全部用户 + 余额支付开：canUseForJiema=${JIEMA_ORDER_AVAILABLE}（= 接码下单已交付），开票一句同步`, (await dto.buildWalletView({ id: q.id }, { brief: true })).showInvoiceNotice === JIEMA_ORDER_AVAILABLE && (await config.canUseForJiema()) === JIEMA_ORDER_AVAILABLE)
      await prisma.setting.update({ where: { key: 'sms_config' }, data: { value: JSON.stringify({ enabled: true, audience: 'ALL' }) } })
      ok('S1 收口 B0 的已知限制：sms_config 只有 enabled / audience 两个字段（整份校验不过）→ false', (await config.canUseForJiema()) === false)
      await prisma.setting.update({ where: { key: 'sms_config' }, data: { value: JSON.stringify({ ...FACTORY_SMS_CONFIG, enabled: true, audience: 'ADMIN_ONLY' }) } })
      ok('受众仅管理员：false（管理员灰度期看到的与普通用户一致）', (await config.canUseForJiema()) === false)
      await prisma.setting.update({ where: { key: 'sms_config' }, data: { value: smsOpen } })
      await prisma.setting.update({ where: { key: 'wallet_config' }, data: { value: JSON.stringify({ ...config.FACTORY_WALLET_CONFIG, balancePayEnabled: false }) } })
      ok('余额支付急停：false', (await config.canUseForJiema()) === false)
      await prisma.setting.update({ where: { key: 'wallet_config' }, data: { value: JSON.stringify({ ...config.FACTORY_WALLET_CONFIG, topupEnabled: true }) } })
      const admin = await mkUser('adm', 'ADMIN')
      const cfgTopupOn = await config.readWalletConfig()
      // B1 起 TOPUP_AVAILABLE=true（充值已交付）：库里 topupEnabled=true + 仅管理员 → 管理员开、普通用户关；保存打开充值开关照常写库
      ok('B1（TOPUP_AVAILABLE=true）库里 topupEnabled=true：读取照常成功', config.TOPUP_AVAILABLE === true && cfgTopupOn.ok)
      ok('  …仅管理员：管理员 topupOpen=true、普通用户 false（出厂受众 ADMIN_ONLY）', (await dto.buildWalletView({ id: admin.id, role: 'ADMIN' }, { brief: true })).topupOpen && !(await dto.buildWalletView({ id: q.id, role: 'USER' }, { brief: true })).topupOpen)
      const sOn = await config.saveWalletConfig({ ...config.FACTORY_WALLET_CONFIG, topupEnabled: true }, cfgTopupOn.storedVersion)
      ok('  …保存时打开充值开关：B1 起照常保存（版本 +1）', sOn.ok && (await config.readWalletConfig()).storedVersion === cfgTopupOn.storedVersion + 1)
    }

    console.log('\n【第 59 条 wallet_config 损坏：只关充值 / 新单选余额 / 自动退入；释放、退款照常】')
    {
      await prisma.setting.upsert({ where: { key: 'wallet_config' }, create: { key: 'wallet_config', value: '{bad json' }, update: { value: '{bad json' } })
      const r = await config.readWalletConfig()
      ok('读到坏 JSON：ok=false（INVALID），不回落出厂值', !r.ok && r.reason === 'INVALID')
      await prisma.setting.update({ where: { key: 'wallet_config' }, data: { value: JSON.stringify({ ...config.FACTORY_WALLET_CONFIG, maxCents: 100100 }) } })
      const r2 = await config.readWalletConfig()
      ok('校验不过（maxCents 超过 MAX_TOPUP_CENTS）：同样 fail-closed', !r2.ok && r2.reason === 'INVALID')
      ok('  …canUseForJiema=false、topupOpen=false', (await config.canUseForJiema()) === false && !(await dto.buildWalletView({ id: legacy.id, role: 'ADMIN' }, { brief: true })).topupOpen)
      const f = await mkUser('cfg')
      await seed(f.id, 100, 100)
      const o = await mkOrder(f.id, 2)
      await ledger.inMoneyTx((tx) => hold.holdInTx(tx, { orderId: o.id, userId: f.id, orderCents: 200 }))
      await prisma.order.update({ where: { id: o.id }, data: { deliveryStatus: 'CANCELLED' } })
      const rel = await ledger.inMoneyTx((tx) => hold.releaseInTx(tx, o.id, { reason: 'VMQ_EXPIRED' }))
      ok('配置坏着：释放照常（两格原路加回）', rel.released && JSON.stringify(await buckets(f.id)) === JSON.stringify({ topup: 100, cash: 100 }))
      const r3 = await adjust.adminAdjust({ actorUserId: null, kind: 'CASH_SUB', userId: f.id, amountCents: 100, reason: '提现', requestId: uuid() })
      ok('配置坏着：提现照常', r3.ok && (await buckets(f.id)).cash === 0)
      await prisma.setting.delete({ where: { key: 'wallet_config' } })
      ok('行不存在：MISSING（同样按关闭）', (await config.readWalletConfig()).ok === false)
      // 保存：校验、乐观并发
      const s1 = await config.saveWalletConfig({ ...config.FACTORY_WALLET_CONFIG, tiersCents: [550] }, 0)
      ok('保存不合法的档位 ¥5.5：拒绝、不写库', !s1.ok && !(await prisma.setting.findUnique({ where: { key: 'wallet_config' } })))
      const s2 = await config.saveWalletConfig({ ...config.FACTORY_WALLET_CONFIG }, 0)
      ok('保存出厂值：版本 1', s2.ok && s2.config.version === 1)
      let conflict = false
      try {
        await config.saveWalletConfig({ ...config.FACTORY_WALLET_CONFIG, maxCents: 50000 }, 0)
      } catch (e) {
        conflict = e instanceof config.WalletConfigConflict
      }
      ok('拿旧版本号再保存：WalletConfigConflict（409）', conflict)
      const s3 = await config.saveWalletConfig({ ...config.FACTORY_WALLET_CONFIG, maxCents: 50000 }, 1)
      ok('按当前版本保存：版本 2、上限 ¥500，文案随之变成 1–500', s3.ok && s3.config.version === 2 && config.validateTopupAmount(50100, s3.config) === '请输入 1–500 之间的整数金额')

      // 评审修复：合法 JSON、带 version、但校验不过的行（手改库 / 以后给 zod 加了必填字段）必须能从后台保存修好
      await prisma.setting.update({ where: { key: 'wallet_config' }, data: { value: JSON.stringify({ ...config.FACTORY_WALLET_CONFIG, version: 3, maxCents: 200000 }) } })
      const broken = await config.readWalletConfig()
      ok('校验不过但带 version=3：INVALID，storedVersion=3（后台 GET 把它给页面）', !broken.ok && broken.reason === 'INVALID' && broken.storedVersion === 3)
      let brokenConflict: unknown = null
      try {
        await config.saveWalletConfig({ ...config.FACTORY_WALLET_CONFIG }, 0)
      } catch (e) {
        brokenConflict = e
      }
      ok('  …按旧页面的 expectVersion=0 保存：409，文案说「库里的配置已损坏」', brokenConflict instanceof config.WalletConfigConflict && brokenConflict.storedBroken && brokenConflict.message.includes('已损坏'))
      const fixed = await config.saveWalletConfig({ ...config.FACTORY_WALLET_CONFIG }, broken.storedVersion)
      ok('  …按 storedVersion 保存：修好，版本 4、读取恢复 ok', fixed.ok && fixed.config.version === 4 && (await config.readWalletConfig()).ok)
      ok('  …审计的 before 是 null（坏配置没有合法的旧值）', fixed.ok && fixed.before === null)
      await prisma.setting.update({ where: { key: 'wallet_config' }, data: { value: '{"version":7,' } })
      const badJson = await config.readWalletConfig()
      ok('JSON 坏掉的行：storedVersion=0，按 0 保存能修好（版本 1）', !badJson.ok && badJson.storedVersion === 0 && (await config.saveWalletConfig({ ...config.FACTORY_WALLET_CONFIG }, 0)).ok)
      await prisma.setting.update({ where: { key: 'wallet_config' }, data: { value: JSON.stringify({ ...config.FACTORY_WALLET_CONFIG, version: -2 }) } })
      ok('version 不是 ≥0 的整数：storedVersion 按 0（页面能发得出来）', (await config.readWalletConfig()).storedVersion === 0 && (await config.saveWalletConfig({ ...config.FACTORY_WALLET_CONFIG }, 0)).ok)
      const fresh = await config.readWalletConfig()
      ok('  …读取恢复 ok', fresh.ok && fresh.storedVersion === 1)
    }

    console.log('\n【W 系列对账：干净数据不新增问题】')
    {
      // W4 / W6 / W9：造一张已付款的充值单（B1 的形状），与它的 TOPUP 流水、让它付款的收款单
      const tu = await mkUser('topup')
      const to = await mkOrder(tu.id, 10, { productId: topupProduct.id, productName: '余额充值 ¥10.00', payStatus: 'PAID', deliveryStatus: 'DELIVERED', paidAt: new Date(), payMethod: 'ALIPAY' })
      const tv = await prisma.vmqOrder.create({ data: { orderId: `${TAG}vt`, bizType: 'order', bizId: to.id, outTradeNo: to.orderNo, price: D(10), reallyPrice: D(10.03), state: 1, payDate: new Date() } })
      createdVmqIds.push(tv.id)
      await prisma.payment.create({ data: { orderId: to.id, payMethod: 'ALIPAY', amount: D(10), status: 1, tradeNo: tv.orderId } })
      await ledger.inMoneyTx((tx) => ledger.postInTx(tx, { userId: tu.id, topupDeltaCents: 1003, type: 'TOPUP', bizKey: `topup:${to.id}`, orderId: to.id }))
      const clean = await recon()
      const grew = clean.items.filter((i) => i.count > countOf(baseline, i.code)).map((i) => `${i.code}:${i.samples.join('|')}`)
      ok('本测试的全部操作之后，W1–W9 没有新增任何问题', grew.length === 0, grew.join(' ; '))
      ok('负债 = 两格合计 + HELD 合计', clean.liability.totalCents === clean.liability.topupCents + clean.liability.cashCents + clean.liability.heldCents)

      console.log('\n【W 系列对账：逐条注入不一致，都能被发现】')
      const inject = async (name: string, code: string, doIt: () => Promise<unknown>, undo: () => Promise<unknown>) => {
        await doIt()
        const r = await recon()
        ok(`${name} → ${code} 报出`, countOf(r, code) > countOf(clean, code), `${code}: ${countOf(clean, code)} → ${countOf(r, code)}`)
        await undo()
      }
      await inject(
        '改库：用户返现格多 0.01（没有流水）',
        'W1',
        () => prisma.user.update({ where: { id: a.id }, data: { balance: { increment: D(0.01) } } }),
        () => prisma.user.update({ where: { id: a.id }, data: { balance: { decrement: D(0.01) } } }),
      )
      await inject(
        '改库：全站 Σ 充值格 ≠ Σ 流水',
        'W8',
        () => prisma.user.update({ where: { id: a.id }, data: { topupCents: { increment: 1 } } }),
        () => prisma.user.update({ where: { id: a.id }, data: { topupCents: { decrement: 1 } } }),
      )
      await inject(
        '改库：充值格为负',
        'W2',
        () => prisma.$executeRaw`UPDATE users SET topup_cents = -1 WHERE id = ${legacy.id}`,
        () => prisma.$executeRaw`UPDATE users SET topup_cents = 0 WHERE id = ${legacy.id}`,
      )
      const holdLog = await prisma.balanceLog.findFirstOrThrow({ where: { userId: h.id, type: 'HOLD' } })
      await inject(
        '改一条 HOLD 流水的金额',
        'W3',
        () => prisma.balanceLog.update({ where: { id: holdLog.id }, data: { topupDeltaCents: holdLog.topupDeltaCents - 1 } }),
        () => prisma.balanceLog.update({ where: { id: holdLog.id }, data: { topupDeltaCents: holdLog.topupDeltaCents } }),
      )
      const hOrder = await prisma.balanceHold.findFirstOrThrow({ where: { userId: h.id, state: 'REFUNDED' } })
      const balPay = await prisma.payment.findFirstOrThrow({ where: { orderId: hOrder.orderId, payMethod: 'BALANCE' } })
      await inject(
        '改库：已确认预扣的 BALANCE 支付行金额不对',
        'W4',
        () => prisma.payment.update({ where: { id: balPay.id }, data: { amount: D(1.19) } }),
        () => prisma.payment.update({ where: { id: balPay.id }, data: { amount: balPay.amount } }),
      )
      // 卡住的预扣：60 分钟前建立、订单还在待支付
      const s = await mkUser('stuck')
      await seed(s.id, 100, 0)
      const so = await mkOrder(s.id, 1)
      await ledger.inMoneyTx((tx) => hold.holdInTx(tx, { orderId: so.id, userId: s.id, orderCents: 100, now: new Date(Date.now() - 2 * 3600_000) }))
      const r5 = await recon()
      ok('造一条卡住的预扣（2 小时前、订单待支付）→ W5 报出', countOf(r5, 'W5') > countOf(clean, 'W5'))
      await prisma.order.update({ where: { id: so.id }, data: { deliveryStatus: 'CANCELLED' } })
      await ledger.inMoneyTx((tx) => hold.releaseInTx(tx, so.id, { reason: 'ADMIN_CLOSE' }))
      ok('  …关单释放后 W5 恢复', countOf(await recon(), 'W5') === countOf(clean, 'W5'))
      const tlog = await prisma.balanceLog.findUniqueOrThrow({ where: { bizKey: `topup:${to.id}` } })
      await inject(
        '改库：充值入账额 ≠ 收款单实付',
        'W6',
        () => prisma.balanceLog.update({ where: { id: tlog.id }, data: { topupDeltaCents: 1000 } }),
        () => prisma.balanceLog.update({ where: { id: tlog.id }, data: { topupDeltaCents: 1003 } }),
      )
      const lateEntry = await prisma.setting.findUniqueOrThrow({ where: { key: createdSettingKeys[0] } })
      await inject(
        '改库：迟到退入条目的实收 ≠ LATEPAY 流水',
        'W7',
        () => prisma.setting.update({ where: { key: lateEntry.key }, data: { value: lateEntry.value.replace('"price":"5.03"', '"price":"5.04"') } }),
        () => prisma.setting.update({ where: { key: lateEntry.key }, data: { value: lateEntry.value } }),
      )
      await inject(
        '改库：已付款的充值单被改回「处理中」',
        'W9',
        () => prisma.order.update({ where: { id: to.id }, data: { deliveryStatus: 'PROCESSING' } }),
        () => prisma.order.update({ where: { id: to.id }, data: { deliveryStatus: 'DELIVERED' } }),
      )
      const back = await recon()
      ok('注入全部撤回后：与干净时一致', back.items.every((i) => i.count === countOf(clean, i.code)))
      // 豁免名单：W1 / W8 跳过豁免用户
      await prisma.user.update({ where: { id: legacy.id }, data: { balance: { increment: D(0.05) } } })
      await prisma.setting.upsert({ where: { key: reconcile.RECONCILE_EXEMPT_KEY }, create: { key: reconcile.RECONCILE_EXEMPT_KEY, value: JSON.stringify({ userIds: [legacy.id] }) }, update: { value: JSON.stringify({ userIds: [legacy.id] }) } })
      const ex = await recon()
      ok('豁免名单里的用户（§5.6 站长剔除的）：W1 / W8 不报、报告列出', countOf(ex, 'W1') === countOf(clean, 'W1') && countOf(ex, 'W8') === countOf(clean, 'W8') && ex.exemptUserIds.includes(legacy.id))
      // W2 也认豁免名单：上线前就存在的历史负余额（旧代码并发提现扣成负数），站长决定不处理的，不再天天告警
      await prisma.$executeRaw`UPDATE users SET balance = -1.00 WHERE id = ${legacy.id}`
      const exNeg = await recon()
      const w2 = exNeg.items.find((i) => i.code === 'W2')
      ok('豁免用户的历史负余额：W2 不报，报告里注明豁免人数', countOf(exNeg, 'W2') === countOf(clean, 'W2') && !!w2?.note?.includes('豁免'))
      await prisma.setting.delete({ where: { key: reconcile.RECONCILE_EXEMPT_KEY } })
      ok('  …不在豁免名单里：W2 照报', countOf(await recon(), 'W2') > countOf(clean, 'W2'))
      await prisma.$executeRaw`UPDATE users SET balance = 12.50 WHERE id = ${legacy.id}`
      ok('  …恢复后 legacy 恒等式成立', await identityOk(legacy.id))

      // 按时间窗逐行（§9.4「覆盖前两天」）：窗外的旧预扣只在全量里逐行核
      const oldHold = await prisma.balanceHold.findFirstOrThrow({ where: { userId: h.id, state: 'REFUNDED' } })
      const oldPay = await prisma.payment.findFirstOrThrow({ where: { orderId: oldHold.orderId, payMethod: 'BALANCE' } })
      const fiveDaysAgo = new Date(Date.now() - 5 * 86400_000)
      await prisma.$executeRaw`UPDATE balance_holds SET created_at = ${fiveDaysAgo}, updated_at = ${fiveDaysAgo} WHERE id = ${oldHold.id}`
      await prisma.$executeRaw`UPDATE orders SET updated_at = ${fiveDaysAgo} WHERE id = ${oldHold.orderId}`
      await prisma.$executeRaw`UPDATE payments SET amount = 1.19 WHERE id = ${oldPay.id}`
      const winClean = await reconcile.runWalletReconcile({ full: false, save: false, alert: false })
      const fullDirty = await recon()
      ok('5 天前的已退款预扣支付行不对：全量 W4 报出，日常（近 48 小时）不逐行看它', countOf(fullDirty, 'W4') > countOf(clean, 'W4') && !winClean.items.find((i) => i.code === 'W4')?.samples.some((s) => s.includes(`#${oldHold.orderId} `)))
      ok('  …日常报告注明逐行范围（近 48 小时；全量在每周日）', !!winClean.items.find((i) => i.code === 'W3')?.note?.includes('48'))
      await prisma.payment.update({ where: { id: oldPay.id }, data: { amount: oldPay.amount } })

      // 一致性快照：对账与记账并发时不误报（旧实现分几次读，中间提交一笔预扣 / 释放就会报 W3、W8）
      // （修复前的实现在同样的负载下 20 次里误报约 3 次：W3「预扣是 HELD，却有 release 流水」、W5「HELD 但订单已取消」）
      const churners = [await mkUser('recon-c1'), await mkUser('recon-c2')]
      for (const c of churners) await seed(c.id, 10_000, 0)
      let stop = false
      const churn = (uid: number) =>
        (async () => {
          let k = 0
          while (!stop && k < 500) {
            const oc = await mkOrder(uid, 1)
            await ledger.inMoneyTx((tx) => hold.holdInTx(tx, { orderId: oc.id, userId: uid, orderCents: 100 }))
            await ledger.inMoneyTx(async (tx) => {
              await tx.order.update({ where: { id: oc.id }, data: { deliveryStatus: 'CANCELLED' } })
              await hold.releaseInTx(tx, oc.id, { reason: 'BUYER_CLOSE' })
            })
            k++
          }
          return k
        })()
      const workers = churners.map((c) => churn(c.id))
      const during: Awaited<ReturnType<typeof recon>>[] = []
      await new Promise((x) => setTimeout(x, 100))
      for (let i = 0; i < 20; i++) during.push(await recon())
      stop = true
      const cycles = (await Promise.all(workers)).reduce((a, k) => a + k, 0)
      const noisy = during.flatMap((r) => r.items.filter((i) => i.count > countOf(clean, i.code)).map((i) => `${i.code}:${i.samples[0]}`))
      ok(`对账期间并发记账（两个买家共 ${cycles} 轮预扣 → 关单释放）：20 次全量对账都不误报`, cycles > 0 && noisy.length === 0, noisy.join(' ; '))
      ok('  …恒等式成立', (await identityOk(churners[0].id)) && (await identityOk(churners[1].id)))
      // 写 settings.wallet_reconcile_last（save 默认开）
      const saved = await reconcile.runWalletReconcile({ full: false, alert: false })
      ok('runWalletReconcile 写 wallet_reconcile_last，lastReconcileReport 读得回', (await reconcile.lastReconcileReport())?.at === saved.at)
    }

    console.log('\n【后台只读查询（/admin/wallet）】')
    {
      const users = await aq.walletUsers({ q: TAG, sort: 'total', pageSize: 100 })
      ok('用户余额列表：按关键词找到本测试的用户，两格与总额正确', users.list.some((u) => u.id === h.id && u.topupCents === 122 + 173 && u.cashCents === 50 && u.totalCents === 345))
      ok('  …按总余额降序', users.list.every((u, i, arr) => i === 0 || arr[i - 1].totalCents >= u.totalCents))
      const logs = await aq.walletLogs({ bizKey: 'clawback:*', pageSize: 200 })
      ok('流水按 bizKey 前缀筛选', logs.list.length >= 3 && logs.list.every((l) => l.bizKey?.startsWith('clawback:')))
      const byUser = await aq.walletLogs({ userId: h.id })
      const hHold = await prisma.balanceHold.findFirstOrThrow({ where: { userId: h.id } })
      ok('后台流水可见 bizKey 与内部备注', byUser.list.some((l) => l.bizKey === `hold:${hHold.orderId}`) && byUser.list.some((l) => l.note === 'itest 充值格'))
      const csv = aq.logsToCsv([{ ...byUser.list[0], note: '=HYPERLINK("x")', email: 'a,b@x' }])
      ok('CSV：UTF-8 BOM、表头含两格、公式注入加引号、逗号转义', csv.startsWith('﻿流水ID') && csv.includes('充值格变动') && csv.includes(`"'=HYPERLINK(""x"")"`) && csv.includes('"a,b@x"'))
      const wd = await aq.walletLogs({ userId: h.id, type: 'HOLD' })
      const csv2 = aq.logsToCsv([{ ...wd.list[0], createdAt: new Date('2026-09-29T23:30:05Z'), note: '-1+1', email: '-x@y' }])
      const row2 = csv2.split('\r\n')[1].split(',')
      const neg = (wd.list[0].topupDeltaCents / 100).toFixed(2)
      ok(`CSV：负数金额原样输出（${neg} 不加 '，Excel 能求和）`, wd.list[0].topupDeltaCents < 0 && row2[7] === neg && !csv2.includes(`'${neg}`), row2.join(','))
      ok('  …以 - 开头的非数字文本仍加 \'（-1+1、-x@y 防公式注入）', csv2.includes("'-1+1") && csv2.includes("'-x@y"))
      ok('  …时间按北京时间（UTC 23:30 → 次日 07:30），表头注明', row2[1] === '2026-09-30 07:30:05' && csv2.includes('时间（北京）'))
      const holds = await aq.walletHolds()
      ok('预扣列表：最近确认 / 释放 / 退款里有本测试的预扣', holds.recent.some((x) => userIds.includes(x.userId) && x.state !== 'HELD'))
      const ov = await aq.walletOverview()
      const liab = await reconcile.liabilityNow()
      ok('看板负债 = liabilityNow（W8 同一个函数）', ov.liability.totalCents === liab.totalCents)
      const det = await aq.walletUserDetail(h.id)
      ok('用户详情：两格、预扣、流水、关联订单（本人）', !!det && det.wallet.totalCents === 345 && det.holds.length === 1 && det.orders.every((o) => o.own))
      const tops = await aq.walletTopups({ state: 'credited' })
      ok('充值单列表：已入账的显示入账额（含尾差）', tops.list.some((t) => t.creditedCents === 1003))
      ok('北京时间当天 0 点', aq.shanghaiDayStart(new Date('2026-09-29T15:59:00Z')).toISOString() === '2026-09-28T16:00:00.000Z' && aq.shanghaiDayStart(new Date('2026-09-29T16:00:00Z')).toISOString() === '2026-09-29T16:00:00.000Z')
    }

    console.log('\n【§5.6 运维 SQL：旧账核对（只读）、「历史对齐」流水（可重复执行）、wallet_config 种子】')
    {
      const m = await mkUser('mig')
      await prisma.balanceLog.create({ data: { userId: m.id, delta: D(3), balanceAfter: D(3), type: 'REFERRAL', note: '订单#1 内推返现' } })
      await prisma.user.update({ where: { id: m.id }, data: { balance: D(5) } }) // 历史上直接改库：余额 5.00、流水只有 3.00
      const run = async (file: string, replace?: [string, string]) => {
        let sql = fs.readFileSync(path.join(__dirname, 'ops', file), 'utf8')
        if (replace) {
          if (!sql.includes(replace[0])) throw new Error(`${file} 里没有 ${replace[0]}`)
          sql = sql.replace(replace[0], replace[1])
        }
        const stmts = sql
          .split('\n')
          .filter((l) => !/^\s*--/.test(l))
          .join('\n')
          .split(/;\s*(?:\n|$)/)
          .map((x) => x.trim())
          .filter(Boolean)
        const results: unknown[][] = []
        // 同一条连接上执行（@ids 是会话变量）；START TRANSACTION / COMMIT 交给外层事务
        await prisma.$transaction(async (tx) => {
          for (const st of stmts) {
            if (/^(START TRANSACTION|COMMIT)$/i.test(st)) continue
            if (/^SELECT\b/i.test(st)) results.push((await tx.$queryRawUnsafe(st)) as unknown[])
            else await tx.$executeRawUnsafe(st)
          }
        })
        return results
      }
      // 历史负余额：余额 −5.00、流水也是 −5.00（① 查不出来，⑤ 要列出来）
      const ng = await mkUser('neg')
      await prisma.balanceLog.create({ data: { userId: ng.id, delta: D(-5), balanceAfter: D(-5), type: 'WITHDRAW', note: '提现到支付宝（线下）' } })
      await prisma.$executeRaw`UPDATE users SET balance = -5.00 WHERE id = ${ng.id}`
      const before = await buckets(m.id)
      const chk = await run('wallet-b0-legacy-check.sql')
      const rows = chk[0] as { id: number; diff: unknown }[]
      ok('旧账核对 ①：列出「返现格 ≠ 流水之和」的用户与差额', rows.some((r) => Number(r.id) === m.id && centsOf(r.diff) === 200))
      const negRows = chk.find((set) => (set as Record<string, unknown>[])[0] && 'negative_user_id' in (set as Record<string, unknown>[])[0]) as { negative_user_id: number; balance: unknown }[] | undefined
      ok('旧账核对 ⑤：列出负余额的用户（① 查不出的「余额 = 流水 = −5.00」）', !!negRows?.some((r) => Number(r.negative_user_id) === ng.id && centsOf(r.balance) === -500) && !rows.some((r) => Number(r.id) === ng.id))
      await prisma.$executeRaw`UPDATE users SET balance = 0 WHERE id = ${ng.id}`
      await prisma.balanceLog.deleteMany({ where: { userId: ng.id } })
      ok('  …只读：两格与流水都没变', JSON.stringify(await buckets(m.id)) === JSON.stringify(before) && (await prisma.balanceLog.count({ where: { userId: m.id } })) === 1)
      await run('wallet-b0-align.sql')
      ok('对齐脚本 @ids 留空：什么都不写', (await prisma.balanceLog.count({ where: { userId: m.id } })) === 1)
      await run('wallet-b0-align.sql', ["SET @ids = '';", `SET @ids = '${m.id}';`])
      const mig = await prisma.balanceLog.findUnique({ where: { bizKey: `migrate:u${m.id}` } })
      ok('对齐脚本：补一条 ADJUST（delta = 2.00、balance_after = 5.00、topup 0、migrate:u<id>）', !!mig && mig.type === 'ADJUST' && centsOf(mig.delta) === 200 && centsOf(mig.balanceAfter) === 500 && mig.topupDeltaCents === 0 && mig.topupAfterCents === 0 && mig.note === '历史余额对齐（B0 上线）')
      ok('  …只写流水、不改 users.balance', JSON.stringify(await buckets(m.id)) === JSON.stringify(before))
      ok('  …created_at 是 UTC（与 Prisma 写入口径一致，误差 < 5 分钟）', !!mig && Math.abs(mig.createdAt.getTime() - Date.now()) < 5 * 60_000)
      await run('wallet-b0-align.sql', ["SET @ids = '';", `SET @ids = '${m.id},${a.id}';`])
      ok('再跑一次（含已经一致的用户）：不重复补、不给一致的用户补', (await prisma.balanceLog.count({ where: { userId: m.id } })) === 2 && !(await prisma.balanceLog.findUnique({ where: { bizKey: `migrate:u${a.id}` } })))
      ok('补过之后 users.balance = Σ delta（W1 对它生效）', await identityOk(m.id))
      // 种子：行不存在时写入出厂值、存在时不动
      await prisma.setting.deleteMany({ where: { key: 'wallet_config' } })
      await run('wallet-b0-seed.sql')
      const seeded = await config.readWalletConfig()
      ok('种子：写入出厂值，读回来通过 zod 且等于 FACTORY_WALLET_CONFIG', seeded.ok && JSON.stringify(seeded.config) === JSON.stringify(config.FACTORY_WALLET_CONFIG))
      await prisma.setting.update({ where: { key: 'wallet_config' }, data: { value: JSON.stringify({ ...config.FACTORY_WALLET_CONFIG, version: 5, maxCents: 50000 }) } })
      await run('wallet-b0-seed.sql')
      const kept = await config.readWalletConfig()
      ok('种子再跑一次：已存在就不动（不会把后台改过的配置冲回出厂值）', kept.ok && kept.config.version === 5 && kept.config.maxCents === 50000)
    }
  } finally {
    // ---- 清理：本测试建的一切 ----
    const orders = await prisma.order.findMany({ where: { userId: { in: userIds } }, select: { id: true } })
    const oids = orders.map((o) => o.id)
    await prisma.referralReward.deleteMany({ where: { OR: [{ orderId: { in: oids } }, { referrerId: { in: userIds } }] } })
    await prisma.balanceLog.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.balanceHold.deleteMany({ where: { userId: { in: userIds } } })
    await prisma.payment.deleteMany({ where: { orderId: { in: oids } } })
    await prisma.vmqOrder.deleteMany({ where: { OR: [{ id: { in: createdVmqIds } }, { bizType: 'order', bizId: { in: oids } }] } })
    await prisma.vmqLock.deleteMany({ where: { lockKey: { in: createdLockKeys } } })
    await prisma.auditEvent.deleteMany({ where: { targetType: 'user', targetId: { in: userIds.map(String) }, action: { startsWith: 'wallet.' } } })
    await prisma.order.deleteMany({ where: { id: { in: oids } } })
    await prisma.product.deleteMany({ where: { id: { in: [product.id, topupProduct.id] } } })
    await prisma.category.delete({ where: { id: cat.id } })
    await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    await prisma.setting.deleteMany({ where: { key: { in: [...createdSettingKeys, ...SETTING_KEYS] } } })
    for (const s of savedSettings) await prisma.setting.create({ data: { key: s.key, value: s.value } })
  }
  console.log(`\n通过 ${pass} 条，失败 ${fail} 条`)
}

function eq(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b)
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
