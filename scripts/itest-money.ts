/**
 * 收款 / 券 / 返现 / 后台改单 —— 数据库集成测试（会建数据、会删数据）。
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" VMQ_KEY=itest npx tsx scripts/itest-money.ts
 *   （可选）ITEST_BASE_URL=http://localhost:3000 ITEST_ADMIN_TOKEN=<本地管理员会话令牌> —— 额外跑后台改单接口的 HTTP 用例
 *
 * ⚠️ 只能对一次性的本地库跑：库名不含 dev / test 时直接拒绝执行。
 *
 * 覆盖 2026-09-24 这一轮在钱的路径上修的几处（纯函数的部分在 check-coupon / check-money 里）：
 *   · 券在付款前被放回（后台取消 / 兜底清扫），钱照样到账 → 付款核销要把放回去的券补核销，不能让它再用一次
 *   · 兜底清扫不放回「买家正在付款」（有活着的收款单）的券
 *   · 过期关单只关真正翻成 -1 的收款单
 *   · 同一推广人并发结算多笔返现：余额与每条流水的「变动后余额」都要对
 *   · 付款履约幂等：重复进入不重复记账、不重复记销量
 *   · 后台改单的销量规则：已交付 ↔ 处理中来回改不动销量；已付款的单取消 −1、恢复 +1
 *
 * 2026-09-26 收款链路加固追加：
 *   · 到账对账（钱已记到收款单、订单卡在待支付 → cron 补履约；已取消的只告警一次）
 *   · 自动发货并发履约不超发、不同订单并发不误判缺货（订单行锁 + READ COMMITTED）
 *   · 金额锁：在途锁不被当陈旧锁删、陈旧锁回收、并发同价唯一、改价迁移 / 失败 fail closed、同额多命中转人工
 *   · 同一业务单并发发起支付只建一张；付款后作废其余收款单；已付款订单再到账记「重复付款」
 *   · 金额冷却 + 重复推送归档；未匹配到账逐条留存、可标记已处理
 *   · 每人同时挂着的待付款收款单计数
 */
import { PrismaClient, Prisma } from '@prisma/client'

const url = process.env.DATABASE_URL || ''
const dbName = url.split('/').pop()?.split('?')[0] || ''
if (!/dev|test/i.test(dbName)) {
  console.error(`拒绝执行：数据库「${dbName}」看起来不是一次性测试库（库名须含 dev 或 test）`)
  process.exit(2)
}
if (!process.env.VMQ_KEY) process.env.VMQ_KEY = 'itest'

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
const TAG = `imoney${Date.now().toString(36)}`
const D = (n: number) => new Prisma.Decimal(n.toFixed(2))

async function main() {
  const coupon = await import('../src/lib/coupon')
  const vmq = await import('../src/lib/vmq')
  const referral = await import('../src/lib/referral')

  const cat = await prisma.category.create({ data: { name: `${TAG}-cat` } })
  const product = await prisma.product.create({
    data: { categoryId: cat.id, name: `${TAG}-manual`, price: D(100), stock: -1, deliveryType: 'MANUAL', sales: 10 },
  })
  const buyer = await prisma.user.create({ data: { email: `${TAG}-buyer@test.local`, passwordHash: 'x' } })
  const promoter = await prisma.user.create({ data: { email: `${TAG}-promo@test.local`, passwordHash: 'x', balance: D(0) } })
  const batch = await prisma.coupon.create({
    data: { code: `${TAG}-c`, name: `${TAG}`, kind: 'THRESHOLD', minAmount: D(0), discount: D(5), total: 100, claimed: 0, status: 'ACTIVE' },
  })

  let seq = 0
  async function order(extra: Partial<Prisma.OrderUncheckedCreateInput> = {}) {
    seq++
    return prisma.order.create({
      data: {
        orderNo: `${TAG.toUpperCase().replace(/[^0-9A-Z]/g, '')}${String(seq).padStart(3, '0')}`.slice(0, 32),
        userId: buyer.id,
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        quantity: 1,
        amount: D(95),
        ...extra,
      },
    })
  }
  async function grant(state = 'AVAILABLE', orderId: number | null = null, lockedAt: Date | null = null) {
    const u = await prisma.user.create({ data: { email: `${TAG}-g${seq++}@test.local`, passwordHash: 'x' } })
    // 每个用户每批次一张（@@unique），所以给 buyer 用的券要换批次；这里简单起见每张券建一个批次
    const b = await prisma.coupon.create({
      data: { code: `${TAG}-b${seq}`, name: `${TAG}`, kind: 'THRESHOLD', minAmount: D(0), discount: D(5), total: 1, claimed: 1, status: 'ACTIVE' },
    })
    await prisma.user.delete({ where: { id: u.id } })
    return prisma.couponGrant.create({ data: { couponId: b.id, userId: buyer.id, state, orderId, lockedAt } })
  }

  // 新增用例建的东西，finally 里统一清
  const startMs = Date.now()
  const createdVmqIds: number[] = []
  const createdInvoiceIds: number[] = []
  const extraUserIds: number[] = []
  let autoProductId: number | null = null

  try {
    console.log('\n【券被放回后钱才到账：付款核销补上，券不能再用一次】')
    {
      const o = await order({ couponDiscount: D(5), originalAmount: D(100) })
      const g = await grant('AVAILABLE') // 已被取消/清扫放回
      await prisma.order.update({ where: { id: o.id }, data: { couponGrantId: g.id } })
      const r = await coupon.consumeCouponForOrder(o.id)
      const g2 = await prisma.couponGrant.findUnique({ where: { id: g.id } })
      ok('兜底核销返回 true', r === true)
      ok('券变成 USED 且挂在这一单上', g2?.state === 'USED' && g2.orderId === o.id)
      ok('再调一次：幂等（不报错、不重复）', (await coupon.consumeCouponForOrder(o.id)) === false)
    }
    {
      const o = await order({ couponDiscount: D(5), originalAmount: D(100) })
      const other = await order()
      const g = await grant('LOCKED', other.id, new Date())
      await prisma.order.update({ where: { id: o.id }, data: { couponGrantId: g.id } })
      const r = await coupon.consumeCouponForOrder(o.id)
      const g2 = await prisma.couponGrant.findUnique({ where: { id: g.id } })
      ok('券已锁在另一单上：不抢过来（返回 false，留给人工对账）', r === false && g2?.state === 'LOCKED' && g2.orderId === other.id)
    }

    console.log('\n【兜底清扫不放回正在付款的券】')
    {
      const old = new Date(Date.now() - 5 * 3600_000)
      const paying = await order()
      const gPaying = await grant('LOCKED', paying.id, old)
      await prisma.order.update({ where: { id: paying.id }, data: { couponGrantId: gPaying.id } })
      await prisma.vmqOrder.create({
        data: { orderId: `${TAG}vp${seq}`, bizType: 'order', bizId: paying.id, outTradeNo: paying.orderNo, price: D(95), reallyPrice: D(95.37), state: 0 },
      })
      const idle = await order()
      const gIdle = await grant('LOCKED', idle.id, old)
      await prisma.order.update({ where: { id: idle.id }, data: { couponGrantId: gIdle.id } })
      await coupon.sweepStuckCoupons()
      ok('有活着的收款单：券仍锁着', (await prisma.couponGrant.findUnique({ where: { id: gPaying.id } }))?.state === 'LOCKED')
      ok('没有收款单、超时：券放回', (await prisma.couponGrant.findUnique({ where: { id: gIdle.id } }))?.state === 'AVAILABLE')
      await prisma.vmqOrder.deleteMany({ where: { bizId: paying.id } })
    }

    console.log('\n【过期关单：只关真正过期的】')
    {
      const o = await order()
      const g = await grant('LOCKED', o.id, new Date())
      await prisma.order.update({ where: { id: o.id }, data: { couponGrantId: g.id } })
      const vid = `${TAG}ve${seq}`
      await prisma.vmqOrder.create({
        data: { orderId: vid, bizType: 'order', bizId: o.id, outTradeNo: o.orderNo, price: D(95), reallyPrice: D(95.71), state: 0, createdAt: new Date(Date.now() - 3 * 3600_000) },
      })
      await prisma.vmqLock.create({ data: { lockKey: `${TAG}-9571-2`.slice(0, 40), orderId: vid } })
      const fresh = await order()
      const vid2 = `${TAG}vf${seq}`
      await prisma.vmqOrder.create({ data: { orderId: vid2, bizType: 'order', bizId: fresh.id, outTradeNo: fresh.orderNo, price: D(95), reallyPrice: D(95.72), state: 0 } })
      await vmq.closeExpired()
      ok('过期收款单 → -1', (await prisma.vmqOrder.findUnique({ where: { orderId: vid } }))?.state === -1)
      ok('对应订单 → 已取消', (await prisma.order.findUnique({ where: { id: o.id } }))?.deliveryStatus === 'CANCELLED')
      ok('金额锁被释放', !(await prisma.vmqLock.findFirst({ where: { orderId: vid } })))
      ok('券被放回', (await prisma.couponGrant.findUnique({ where: { id: g.id } }))?.state === 'AVAILABLE')
      ok('未过期的收款单不受影响', (await prisma.vmqOrder.findUnique({ where: { orderId: vid2 } }))?.state === 0)
      await prisma.vmqOrder.deleteMany({ where: { orderId: { in: [vid, vid2] } } })
    }

    console.log('\n【付款履约幂等（人工服务商品）】')
    {
      const o = await order()
      const salesBefore = (await prisma.product.findUnique({ where: { id: product.id } }))!.sales
      await Promise.all([vmq.fulfillOrder(o.id), vmq.fulfillOrder(o.id), vmq.fulfillOrder(o.id)])
      const after = await prisma.order.findUnique({ where: { id: o.id } })
      ok('订单 → 已付款 + 处理中', after?.payStatus === 'PAID' && after.deliveryStatus === 'PROCESSING')
      ok('并发 3 次只记 1 条支付流水', (await prisma.payment.count({ where: { orderId: o.id } })) === 1)
      ok('销量只 +1', (await prisma.product.findUnique({ where: { id: product.id } }))!.sales === salesBefore + 1)
      const refunded = await order({ payStatus: 'REFUNDED' })
      await vmq.fulfillOrder(refunded.id)
      ok('已退款的订单再被履约：不改状态', (await prisma.order.findUnique({ where: { id: refunded.id } }))?.deliveryStatus === 'PENDING')
    }

    console.log('\n【同一推广人并发结算 5 笔返现】')
    {
      const rewards = [1.1, 2.2, 3.3, 4.4, 5.5]
      const orders: { id: number }[] = []
      for (const r of rewards) {
        orders.push(
          await order({ payStatus: 'PAID', deliveryStatus: 'DELIVERED', referrerId: promoter.id, referralReward: D(r) })
        )
      }
      await Promise.all(orders.map((o) => referral.settleReferral(o.id)))
      await Promise.all(orders.map((o) => referral.settleReferral(o.id))) // 再来一遍：幂等
      const u = await prisma.user.findUnique({ where: { id: promoter.id } })
      ok('余额 = 16.50（不多不少）', Number(u?.balance) === 16.5, String(u?.balance))
      const logs = await prisma.balanceLog.findMany({ where: { userId: promoter.id }, orderBy: { id: 'asc' } })
      ok('恰好 5 条流水', logs.length === 5)
      ok('每条流水都带 orderId', logs.every((l) => l.orderId != null && orders.some((o) => o.id === l.orderId)))
      const afters = logs.map((l) => Number(l.balanceAfter)).sort((a, b) => a - b)
      ok('「变动后余额」互不相同且最大值 = 最终余额', new Set(afters).size === 5 && afters[4] === 16.5, JSON.stringify(afters))
      const unpaid = await order({ payStatus: 'UNPAID', deliveryStatus: 'DELIVERED', referrerId: promoter.id, referralReward: D(9) })
      await referral.settleReferral(unpaid.id)
      ok('未付款的单即使标了已交付也不结算', !(await prisma.referralReward.findUnique({ where: { orderId: unpaid.id } })))
    }


    // ================= 2026-09-26 收款链路加固（G16 / G23 / G36 / G38 / G39 / G40） =================
    // 金额都挑一个不常见的基数，免得和开发库里现成的待支付单撞上（到账匹配是按金额全表找的）
    const B = 600 + (Date.now() % 97) + 0.37
    const P = (n: number) => Math.round(n * 100) / 100

    console.log('\n【到账对账：收款单已到账、订单卡在待支付 → cron 补履约】')
    {
      const o = await order()
      const salesBefore = (await prisma.product.findUnique({ where: { id: product.id } }))!.sales
      const paid = await prisma.vmqOrder.create({
        data: { orderId: `${TAG}r1${seq}`, bizType: 'order', bizId: o.id, outTradeNo: o.orderNo, price: D(95), reallyPrice: D(95.11), state: 1, payDate: new Date(Date.now() - 5 * 60_000) },
      })
      createdVmqIds.push(paid.id)
      // 卡住期间买家又发起的那张待支付收款单
      const second = await prisma.vmqOrder.create({
        data: { orderId: `${TAG}r2${seq}`, bizType: 'order', bizId: o.id, outTradeNo: o.orderNo, price: D(95), reallyPrice: D(95.12), state: 0 },
      })
      const fresh = await order()
      const young = await prisma.vmqOrder.create({
        data: { orderId: `${TAG}r3${seq}`, bizType: 'order', bizId: fresh.id, outTradeNo: fresh.orderNo, price: D(95), reallyPrice: D(95.13), state: 1, payDate: new Date(Date.now() - 60_000) },
      })
      createdVmqIds.push(young.id)
      await vmq.reconcilePaidVmq()
      const after = await prisma.order.findUnique({ where: { id: o.id } })
      ok('卡住的订单 → 已付款', after?.payStatus === 'PAID')
      ok('  …支付流水 1 条、销量 +1', (await prisma.payment.count({ where: { orderId: o.id } })) === 1 &&
        (await prisma.product.findUnique({ where: { id: product.id } }))!.sales === salesBefore + 1)
      ok('  …同单另一张待支付收款单被作废', (await prisma.vmqOrder.findUnique({ where: { id: second.id } }))?.state === -1)
      await vmq.reconcilePaidVmq()
      ok('再跑一次：仍只有 1 条支付流水', (await prisma.payment.count({ where: { orderId: o.id } })) === 1)
      ok('到账不足 3 分钟的不碰（留给到账那一次履约）', (await prisma.order.findUnique({ where: { id: fresh.id } }))?.payStatus === 'UNPAID')

      const cancelled = await order({ deliveryStatus: 'CANCELLED' })
      const cv = await prisma.vmqOrder.create({
        data: { orderId: `${TAG}r4${seq}`, bizType: 'order', bizId: cancelled.id, outTradeNo: cancelled.orderNo, price: D(95), reallyPrice: D(95.14), state: 1, payDate: new Date(Date.now() - 5 * 60_000) },
      })
      createdVmqIds.push(cv.id)
      await vmq.reconcilePaidVmq()
      await vmq.reconcilePaidVmq()
      const c2 = await prisma.order.findUnique({ where: { id: cancelled.id } })
      ok('待支付 + 已取消：不自动发货', c2?.payStatus === 'UNPAID' && c2.deliveryStatus === 'CANCELLED')
      ok('  …告警去重行只有 1 行', (await prisma.setting.count({ where: { key: `vmqrec:${cv.id}` } })) === 1)

      const inv = await prisma.invoice.create({
        data: { invoiceNo: `${TAG}I${seq}`.slice(0, 32), claudeAccount: `${TAG}@test.local`, subscriptionType: 'itest', status: 'AWAIT_PAY', payStatus: 'UNPAID', taxFee: D(6) },
      })
      createdInvoiceIds.push(inv.id)
      const iv = await prisma.vmqOrder.create({
        data: { orderId: `${TAG}r5${seq}`, bizType: 'invoice', bizId: inv.id, outTradeNo: inv.invoiceNo, price: D(6), reallyPrice: D(6.15), state: 1, payDate: new Date(Date.now() - 5 * 60_000) },
      })
      createdVmqIds.push(iv.id)
      await vmq.reconcilePaidVmq()
      const inv2 = await prisma.invoice.findUnique({ where: { id: inv.id } })
      ok('发票税费卡住 → 已付款 + 已提交', inv2?.payStatus === 'PAID' && inv2.status === 'SUBMITTED')
    }

    console.log('\n【自动发货：并发履约不超发（订单行锁 + READ COMMITTED）】')
    {
      const autoP = await prisma.product.create({
        data: { categoryId: cat.id, name: `${TAG}-auto`, price: D(10), stock: 0, deliveryType: 'AUTO' },
      })
      autoProductId = autoP.id
      for (let i = 0; i < 8; i++) {
        await prisma.cardKey.create({ data: { productId: autoP.id, content: `itest-${i}`, contentHash: `${TAG}-h${i}` } })
      }
      const aorder = (extra: Partial<Prisma.OrderUncheckedCreateInput>) =>
        order({ productId: autoP.id, productName: autoP.name, productPrice: D(10), quantity: 2, amount: D(20), ...extra })

      const o1 = await aorder({ payStatus: 'PAID', deliveryStatus: 'PROCESSING', paidAt: new Date() })
      await Promise.all([vmq.fulfillOrder(o1.id), vmq.fulfillOrder(o1.id), vmq.fulfillOrder(o1.id)])
      const cards1 = await prisma.cardKey.findMany({ where: { orderId: o1.id, status: 'USED' } })
      ok('并发 3 次补发：恰好 2 张卡', cards1.length === 2, String(cards1.length))
      ok('  …Σ 单卡售价 = 订单金额 20', P(cards1.reduce((a, c) => a + Number(c.soldPrice), 0)) === 20)
      ok('  …库存同步为 6', (await prisma.product.findUnique({ where: { id: autoP.id } }))?.stock === 6)

      const o2 = await aorder({})
      await Promise.all([vmq.fulfillOrder(o2.id), vmq.fulfillOrder(o2.id)])
      ok('未付款单并发履约 2 次：恰好 2 张卡、1 条流水',
        (await prisma.cardKey.count({ where: { orderId: o2.id, status: 'USED' } })) === 2 &&
          (await prisma.payment.count({ where: { orderId: o2.id } })) === 1)

      const o3 = await aorder({})
      const o4 = await aorder({})
      await Promise.all([vmq.fulfillOrder(o3.id), vmq.fulfillOrder(o4.id)])
      const [d3, d4] = await Promise.all([
        prisma.order.findUnique({ where: { id: o3.id } }),
        prisma.order.findUnique({ where: { id: o4.id } }),
      ])
      ok('两张不同订单并发抢同一池子：都已交付（不误判缺货）', d3?.deliveryStatus === 'DELIVERED' && d4?.deliveryStatus === 'DELIVERED')
      ok('  …各 2 张', (await prisma.cardKey.count({ where: { orderId: o3.id } })) === 2 && (await prisma.cardKey.count({ where: { orderId: o4.id } })) === 2)
      ok('  …库存归零', (await prisma.product.findUnique({ where: { id: autoP.id } }))?.stock === 0)
    }

    console.log('\n【金额锁：在途锁不被当陈旧锁删、陈旧锁按 id 精确回收】')
    {
      const base1 = P(B)
      const o = await order({ amount: D(base1) })
      const ghost = `${TAG}ghost`
      await prisma.vmqLock.create({ data: { lockKey: `${Math.round(base1 * 100)}-2`, orderId: ghost, createdAt: new Date() } })
      const v1 = await vmq.createOrGetVmqOrder({ bizType: 'order', bizId: o.id, outTradeNo: o.orderNo, price: base1 })
      ok('在途锁（刚建、收款单还没落库）：让位 +0.01', P(v1.reallyPrice) === P(base1 + 0.01), String(v1.reallyPrice))
      ok('  …在途锁仍在', !!(await prisma.vmqLock.findFirst({ where: { orderId: ghost } })))
      await prisma.vmqLock.deleteMany({ where: { orderId: ghost } })

      const base2 = P(B + 1)
      const o2 = await order({ amount: D(base2) })
      await prisma.vmqLock.create({ data: { lockKey: `${Math.round(base2 * 100)}-2`, orderId: ghost, createdAt: new Date(Date.now() - 10 * 60_000) } })
      const v2 = await vmq.createOrGetVmqOrder({ bizType: 'order', bizId: o2.id, outTradeNo: o2.orderNo, price: base2 })
      ok('陈旧锁（10 分钟前、名下无收款单）：回收复用原价', P(v2.reallyPrice) === base2, String(v2.reallyPrice))
      ok('  …陈旧锁已删', !(await prisma.vmqLock.findFirst({ where: { orderId: ghost } })))

      const base3 = P(B + 2)
      const many = await Promise.all(Array.from({ length: 12 }, () => order({ amount: D(base3) })))
      const vs = await Promise.all(many.map((x) => vmq.createOrGetVmqOrder({ bizType: 'order', bizId: x.id, outTradeNo: x.orderNo, price: base3 })))
      ok('并发 12 张同价单：唯一金额两两不同', new Set(vs.map((v) => Math.round(v.reallyPrice * 100))).size === 12)

      // 改价：迁移到新金额，名下只剩 1 把锁
      const v2row = (await prisma.vmqOrder.findUnique({ where: { orderId: v2.orderId } }))!
      const moved = await vmq.updatePendingVmqAmount('order', o2.id, P(B + 3))
      const locks = await prisma.vmqLock.findMany({ where: { orderId: v2row.orderId } })
      ok('改价：金额迁移、名下只剩 1 把锁且等于新金额',
        !!moved && locks.length === 1 && locks[0].lockKey === `${Math.round(moved.reallyPrice * 100)}-2`, JSON.stringify(locks.map((l) => l.lockKey)))
      // 改回本单当前持有的金额（新价 = 当前 reallyPrice）
      const same = await vmq.updatePendingVmqAmount('order', o2.id, moved!.reallyPrice)
      const locks2 = await prisma.vmqLock.findMany({ where: { orderId: v2row.orderId } })
      ok('改价成本单手里的金额：复用、仍只有 1 把锁', !!same && P(same.reallyPrice) === P(moved!.reallyPrice) && locks2.length === 1)

      // 构造分配失败：新价起的 50 格全被占（在途锁），改价应 fail closed
      const base4 = P(B + 5)
      for (let i = 0; i < 50; i++) {
        await prisma.vmqLock.create({ data: { lockKey: `${Math.round(base4 * 100) + i}-2`, orderId: `${TAG}full`, createdAt: new Date() } })
      }
      let threw = false
      try {
        await vmq.updatePendingVmqAmount('order', o2.id, base4)
      } catch {
        threw = true
      }
      const v2after = await prisma.vmqOrder.findUnique({ where: { orderId: v2.orderId } })
      ok('改价分配失败：抛错 + 收款单作废 + 名下无锁',
        threw && v2after?.state === -1 && (await prisma.vmqLock.count({ where: { orderId: v2.orderId } })) === 0)
      await prisma.vmqLock.deleteMany({ where: { orderId: `${TAG}full` } })

      // 两张同金额的待支付单同时存在（锁出过岔子）：不猜，转人工
      const base5 = P(B + 7)
      const x1 = await order()
      const x2 = await order()
      for (const x of [x1, x2]) {
        await prisma.vmqOrder.create({
          data: { orderId: `${TAG}am${x.id}`, bizType: 'order', bizId: x.id, outTradeNo: x.orderNo, price: D(base5), reallyPrice: D(base5), state: 0 },
        })
      }
      const m = await vmq.markPaidByAmount(base5.toFixed(2), 2)
      ok('同金额命中两张待支付单：不自动履约', m === false &&
        (await prisma.vmqOrder.count({ where: { bizId: { in: [x1.id, x2.id] }, bizType: 'order', state: 0 } })) === 2)
      const un = await vmq.listUnmatched(20)
      ok('  …进「待人工核实」：ambiguous_match', un.some((u) => u.reason === 'ambiguous_match' && u.price === base5.toFixed(2)))
    }

    console.log('\n【同一业务单并发发起支付 / 付款后作废其余收款单 / 重复付款告警】')
    {
      const base = P(B + 9)
      const o = await order({ amount: D(base) })
      const rs = await Promise.all(Array.from({ length: 5 }, () => vmq.createOrGetVmqOrder({ bizType: 'order', bizId: o.id, outTradeNo: o.orderNo, price: base })))
      ok('并发 5 次发起：同一张收款单', new Set(rs.map((r) => r.orderId)).size === 1)
      ok('  …该单只有 1 张待支付收款单', (await prisma.vmqOrder.count({ where: { bizType: 'order', bizId: o.id, state: 0 } })) === 1)
      await new Promise((r) => setTimeout(r, 50))
      ok('  …抢输方的金额锁已释放（名下没有收款单的锁不残留）',
        (await prisma.vmqLock.count({ where: { lockKey: { in: Array.from({ length: 6 }, (_, i) => `${Math.round(base * 100) + i}-2`) } } })) === 1)

      // 两张待支付 A / B，A 到账 → 订单付款、B 被作废
      const o2 = await order()
      const A = await prisma.vmqOrder.create({ data: { orderId: `${TAG}dA${seq}`, bizType: 'order', bizId: o2.id, outTradeNo: o2.orderNo, price: D(95), reallyPrice: D(P(B + 11)), state: 0 } })
      const Bv = await prisma.vmqOrder.create({ data: { orderId: `${TAG}dB${seq}`, bizType: 'order', bizId: o2.id, outTradeNo: o2.orderNo, price: D(95), reallyPrice: D(P(B + 11.01)), state: 0 } })
      await prisma.vmqLock.create({ data: { lockKey: `${Math.round(P(B + 11.01) * 100)}-2`, orderId: Bv.orderId, createdAt: new Date() } })
      ok('A 到账：匹配成功', (await vmq.markPaidByAmount(P(B + 11).toFixed(2), 2)) === true)
      ok('  …订单已付款', (await prisma.order.findUnique({ where: { id: o2.id } }))?.payStatus === 'PAID')
      ok('  …B 被作废、锁被删', (await prisma.vmqOrder.findUnique({ where: { id: Bv.id } }))?.state === -1 &&
        (await prisma.vmqLock.count({ where: { orderId: Bv.orderId } })) === 0)
      void A

      // 订单已付款，又有一张待支付收款单被付了 → 疑似重复付款
      const o3 = await order({ payStatus: 'PAID', deliveryStatus: 'PROCESSING', paidAt: new Date() })
      const dupPrice = P(B + 13)
      await prisma.vmqOrder.create({ data: { orderId: `${TAG}dp${seq}`, bizType: 'order', bizId: o3.id, outTradeNo: o3.orderNo, price: D(95), reallyPrice: D(dupPrice), state: 0 } })
      ok('已付款订单再到账：仍返回 true（收款单确实匹配到了）', (await vmq.markPaidByAmount(dupPrice.toFixed(2), 2)) === true)
      const un = await vmq.listUnmatched(20)
      ok('  …进「待人工核实」：duplicate_payment', un.some((u) => u.reason === 'duplicate_payment' && u.price === dupPrice.toFixed(2) && !u.handledAt))
    }

    console.log('\n【金额冷却 + 重复推送 / 未匹配逐条留存】')
    {
      const base = P(B + 15)
      const o = await order({ amount: D(base) })
      const v = await vmq.createOrGetVmqOrder({ bizType: 'order', bizId: o.id, outTradeNo: o.orderNo, price: base })
      ok('首单拿到原价', P(v.reallyPrice) === base)
      // 原文带 seq，避免与上一次跑 itest 留下的「最近原文」撞上
      const rawOnce = `你已成功收款${base.toFixed(2)}元（${TAG} ${seq}）`
      ok('到账匹配成功', (await vmq.markPaidByAmount(base.toFixed(2), 2, rawOnce)) === true)
      const o2 = await order({ amount: D(base) })
      const v2 = await vmq.createOrGetVmqOrder({ bizType: 'order', bizId: o2.id, outTradeNo: o2.orderNo, price: base })
      ok('同价下一单：原价在冷却期，改分 +0.01', P(v2.reallyPrice) === P(base + 0.01), String(v2.reallyPrice))
      ok('同一条通知重推：不会误中下一单', (await vmq.markPaidByAmount(base.toFixed(2), 2, rawOnce)) === false &&
        (await prisma.vmqOrder.findUnique({ where: { orderId: v2.orderId } }))?.state === 0)
      const un = await vmq.listUnmatched(30)
      ok('  …原文一字不差 → 判定重复转发：不推送、但仍待处理（不自动归档）', un.some((u) => u.reason === 'maybe_duplicate' && u.price === base.toFixed(2) && !u.handledAt && u.repeatForward === true))
      // 同金额、原文不同（买家扫同一个码又付了一次）→ 不能静默，必须待处理
      await vmq.markPaidByAmount(base.toFixed(2), 2, `${rawOnce} 第二笔`)
      const unB = await vmq.listUnmatched(30)
      ok('  …同金额但原文不同 → 疑似重复付款、待处理', unB.some((u) => u.reason === 'maybe_duplicate' && u.price === base.toFixed(2) && !u.handledAt && !u.repeatForward))

      const lone = P(B + 17.77)
      await vmq.markPaidByAmount(lone.toFixed(2), 2)
      await vmq.markPaidByAmount(P(lone + 1).toFixed(2), 2)
      const un2 = await vmq.listUnmatched(30)
      const hit = un2.filter((u) => u.reason === 'no_pending_match' && (u.price === lone.toFixed(2) || u.price === P(lone + 1).toFixed(2)))
      ok('连推两笔没人认领的到账：两条都留着、都待处理', hit.length === 2 && hit.every((u) => !u.handledAt))
      await vmq.markUnmatchedHandled(hit[0].key, 'itest')
      ok('标记已处理', !!(await vmq.listUnmatched(30)).find((u) => u.key === hit[0].key)?.handledAt)
    }

    console.log('\n【每人同时挂着的待付款收款单计数】')
    {
      const u = await prisma.user.create({ data: { email: `${TAG}-cap@test.local`, passwordHash: 'x' } })
      extraUserIds.push(u.id)
      ok('没有待付款收款单：0', (await vmq.countOpenOrderPayments(u.id)) === 0)
      for (let i = 0; i < 2; i++) {
        const o = await order({ userId: u.id, amount: D(P(B + 20 + i)) })
        await vmq.createOrGetVmqOrder({ bizType: 'order', bizId: o.id, outTradeNo: o.orderNo, price: P(B + 20 + i) })
      }
      const old = await order({ userId: u.id })
      await prisma.vmqOrder.create({
        data: { orderId: `${TAG}old${seq}`, bizType: 'order', bizId: old.id, outTradeNo: old.orderNo, price: D(95), reallyPrice: D(P(B + 25)), state: 0, createdAt: new Date(Date.now() - 3 * 3600_000) },
      })
      ok('2 张有效 + 1 张已过期（还没被关）：计 2', (await vmq.countOpenOrderPayments(u.id)) === 2)
    }

    const base = process.env.ITEST_BASE_URL
    const token = process.env.ITEST_ADMIN_TOKEN
    if (base && token) {
      console.log('\n【后台改单接口（HTTP）：销量规则与改价限制】')
      const put = (id: number, body: unknown) =>
        fetch(`${base}/api/admin/orders/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Cookie: `token=${token}` },
          body: JSON.stringify(body),
        }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }))
      const sales = async () => (await prisma.product.findUnique({ where: { id: product.id } }))!.sales
      const o = await order({ payStatus: 'PAID', deliveryStatus: 'PROCESSING', paidAt: new Date() })
      const s0 = await sales()
      await put(o.id, { deliveryStatus: 'DELIVERED' })
      ok('已付款 → 已交付：销量不变（付款时已记过）', (await sales()) === s0)
      await put(o.id, { deliveryStatus: 'PROCESSING' })
      await put(o.id, { deliveryStatus: 'DELIVERED' })
      ok('已交付 ↔ 处理中来回改：销量不漂移', (await sales()) === s0)
      await put(o.id, { deliveryStatus: 'CANCELLED' })
      ok('已付款的单取消：销量 −1', (await sales()) === s0 - 1)
      await put(o.id, { deliveryStatus: 'PROCESSING' })
      ok('取消后恢复：销量 +1', (await sales()) === s0)
      const u = await order()
      const r1 = await put(u.id, { deliveryStatus: 'CANCELLED', amount: 50 })
      ok('取消的同时改价：拒绝', r1.status === 400 && r1.body?.success === false)
      const noAuth = await fetch(`${base}/api/admin/orders/${u.id}`, { method: 'PUT', body: '{}', headers: { 'Content-Type': 'application/json' } })
      ok('不带管理员会话：401/403', noAuth.status === 401 || noAuth.status === 403)
      const s1 = await sales()
      const up = await order()
      await prisma.vmqOrder.create({ data: { orderId: `${TAG}vm${seq}`, bizType: 'order', bizId: up.id, outTradeNo: up.orderNo, price: D(95), reallyPrice: D(95.99), state: 0 } })
      await put(up.id, { deliveryStatus: 'DELIVERED' })
      const upAfter = await prisma.order.findUnique({ where: { id: up.id } })
      ok('待付款的单被标已交付：自动置已付款', upAfter?.payStatus === 'PAID')
      ok('  …销量 +1', (await sales()) === s1 + 1)
      ok('  …收银台那张待支付收款单被关掉（防二次付款）', (await prisma.vmqOrder.findFirst({ where: { bizId: up.id } }))?.state === -1)
      await prisma.vmqOrder.deleteMany({ where: { bizId: up.id } })
    } else {
      console.log('\n（未设置 ITEST_BASE_URL / ITEST_ADMIN_TOKEN，跳过后台改单接口的 HTTP 用例）')
    }
  } finally {
    const productIds = autoProductId ? [product.id, autoProductId] : [product.id]
    const orders = await prisma.order.findMany({ where: { productId: { in: productIds } }, select: { id: true } })
    const ids = orders.map((o) => o.id)
    await prisma.referralReward.deleteMany({ where: { orderId: { in: ids } } })
    await prisma.balanceLog.deleteMany({ where: { userId: promoter.id } })
    await prisma.payment.deleteMany({ where: { orderId: { in: ids } } })
    const vrows = await prisma.vmqOrder.findMany({
      where: {
        OR: [
          { bizId: { in: ids }, bizType: 'order' },
          { bizId: { in: createdInvoiceIds }, bizType: 'invoice' },
          { id: { in: createdVmqIds } },
        ],
      },
      select: { id: true, orderId: true },
    })
    await prisma.vmqLock.deleteMany({
      where: { OR: [{ orderId: { in: vrows.map((v) => v.orderId) } }, { orderId: { startsWith: TAG } }] },
    })
    await prisma.setting.deleteMany({ where: { key: { in: vrows.map((v) => `vmqrec:${v.id}`) } } })
    await prisma.setting.deleteMany({ where: { key: { startsWith: 'vmq_unmatched:', gte: `vmq_unmatched:${startMs}` } } })
    await prisma.vmqOrder.deleteMany({ where: { id: { in: vrows.map((v) => v.id) } } })
    await prisma.invoice.deleteMany({ where: { id: { in: createdInvoiceIds } } })
    if (autoProductId) await prisma.cardKey.deleteMany({ where: { productId: autoProductId } })
    const grants = await prisma.couponGrant.findMany({ where: { userId: buyer.id }, select: { couponId: true } })
    await prisma.couponGrant.deleteMany({ where: { userId: buyer.id } })
    await prisma.coupon.deleteMany({ where: { OR: [{ id: { in: grants.map((g) => g.couponId) } }, { id: batch.id }] } })
    await prisma.lotteryEntry.deleteMany({ where: { orderId: { in: ids } } })
    await prisma.order.deleteMany({ where: { id: { in: ids } } })
    await prisma.product.deleteMany({ where: { id: { in: productIds } } })
    await prisma.category.delete({ where: { id: cat.id } })
    await prisma.user.deleteMany({ where: { id: { in: [buyer.id, promoter.id, ...extraUserIds] } } })
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
