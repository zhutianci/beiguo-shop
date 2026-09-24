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
    const orders = await prisma.order.findMany({ where: { productId: product.id }, select: { id: true } })
    const ids = orders.map((o) => o.id)
    await prisma.referralReward.deleteMany({ where: { orderId: { in: ids } } })
    await prisma.balanceLog.deleteMany({ where: { userId: promoter.id } })
    await prisma.payment.deleteMany({ where: { orderId: { in: ids } } })
    await prisma.vmqOrder.deleteMany({ where: { bizId: { in: ids }, bizType: 'order' } })
    const grants = await prisma.couponGrant.findMany({ where: { userId: buyer.id }, select: { couponId: true } })
    await prisma.couponGrant.deleteMany({ where: { userId: buyer.id } })
    await prisma.coupon.deleteMany({ where: { OR: [{ id: { in: grants.map((g) => g.couponId) } }, { id: batch.id }] } })
    await prisma.lotteryEntry.deleteMany({ where: { orderId: { in: ids } } })
    await prisma.order.deleteMany({ where: { id: { in: ids } } })
    await prisma.product.delete({ where: { id: product.id } })
    await prisma.category.delete({ where: { id: cat.id } })
    await prisma.user.deleteMany({ where: { id: { in: [buyer.id, promoter.id] } } })
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
