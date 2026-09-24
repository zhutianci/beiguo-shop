/**
 * 下单有奖 —— 数据库集成测试（会建表数据、会删数据）。
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-lottery.ts
 *
 * ⚠️ 只能对一次性的本地库跑。库名不含 dev / test 时直接拒绝执行 —— 这个脚本会
 * 建用户、建订单、改奖项配置，最后清掉自己建的数据；对生产库跑就是往真实账本里写假单。
 *
 * 纯函数（概率、资格判定）在 scripts/check-lottery.ts 里穷举过了；这里验证的是
 * 只有真数据库才能验证的东西：并发下的「一单一抽」、事务回滚、发券落库、退款作废。
 */
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

const TAG = `itest${Date.now().toString(36)}`

async function main() {
  // 业务模块要在设置好 DATABASE_URL 之后再加载（它们各自 new 一个 PrismaClient）
  const srv = await import('../src/lib/lottery-server')
  const { drawForOrder, createEntryIfEligible, voidLotteryForOrder, LotteryError, saveLotteryConfig, getLotteryConfig } = srv

  // ---------- 准备数据 ----------
  const cat = await prisma.category.create({ data: { name: `${TAG}-cat` } })
  const product = await prisma.product.create({
    data: { categoryId: cat.id, name: `${TAG}-prod`, price: new Prisma.Decimal('100.00'), stock: -1 },
  })
  const alice = await prisma.user.create({ data: { email: `${TAG}-a@test.local`, passwordHash: 'x' } })
  const bob = await prisma.user.create({ data: { email: `${TAG}-b@test.local`, passwordHash: 'x' } })
  const banned = await prisma.user.create({ data: { email: `${TAG}-c@test.local`, passwordHash: 'x', status: 0 } })

  const prevCfg = await getLotteryConfig()
  const prevPrizes = await prisma.lotteryPrize.findMany()
  // 奖池：一个 100% 必中的券奖项（让「中奖 → 发券」这条路径必然被走到）
  await prisma.lotteryPrize.updateMany({ data: { enabled: false } })
  const prize = await prisma.lotteryPrize.create({
    data: {
      name: `${TAG}-5元券`,
      type: 'COUPON',
      rateBp: 10000,
      couponKind: 'THRESHOLD',
      couponMinAmount: new Prisma.Decimal('0'),
      couponDiscount: new Prisma.Decimal('5.00'),
      couponValidDays: 7,
    },
  })

  let seq = 0
  async function makeOrder(
    userId: number,
    opts: { eligible?: boolean; pay?: 'UNPAID' | 'PAID' | 'REFUNDED'; delivery?: 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'CANCELLED' } = {}
  ) {
    seq++
    const orderNo = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${TAG.toUpperCase().slice(-6)}${String(seq).padStart(2, '0')}`
      .replace(/[^0-9A-Z]/g, '')
      .slice(0, 32)
    const cfg = { enabled: opts.eligible !== false, minOrderAmount: 0, rules: '' }
    return prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          orderNo,
          userId,
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          quantity: 1,
          amount: new Prisma.Decimal('100.00'),
          payStatus: opts.pay ?? 'PAID',
          deliveryStatus: opts.delivery ?? 'DELIVERED',
        },
      })
      await createEntryIfEligible(tx, cfg, { id: o.id, orderNo: o.orderNo, userId, amount: 100 })
      return o
    })
  }

  async function expectError(name: string, fn: () => Promise<unknown>, status?: number) {
    try {
      await fn()
      ok(name, false, '没有抛错')
    } catch (e) {
      const isLottery = e instanceof LotteryError
      ok(name, isLottery && (status == null || (e as InstanceType<typeof LotteryError>).status === status), String(e))
      return e
    }
  }

  try {
    console.log('\n【资格落库：与建单同一事务】')
    const off = await makeOrder(alice.id, { eligible: false })
    ok('活动关闭时下的单：没有资格行', !(await prisma.lotteryEntry.findUnique({ where: { orderId: off.id } })))
    await expectError('活动关闭时下的单：不能抽', () => drawForOrder(alice.id, off.orderNo), 400)

    console.log('\n【越权与状态】')
    const a1 = await makeOrder(alice.id)
    ok('活动开启时下的单：有 PENDING 资格', (await prisma.lotteryEntry.findUnique({ where: { orderId: a1.id } }))?.state === 'PENDING')
    const e404 = await expectError('别人（bob）拿 alice 的订单号抽：拒绝', () => drawForOrder(bob.id, a1.orderNo), 404)
    const e404b = await expectError('不存在的订单号：拒绝', () => drawForOrder(bob.id, '20260101ZZZZZZZZ'), 404)
    ok('两种拒绝说的是同一句话', (e404 as Error)?.message === (e404b as Error)?.message)
    await expectError('非法订单号格式：拒绝', () => drawForOrder(alice.id, "x' OR 1=1 --"), 404)
    ok('被拒之后 alice 的资格仍是 PENDING', (await prisma.lotteryEntry.findUnique({ where: { orderId: a1.id } }))?.state === 'PENDING')

    const unpaid = await makeOrder(alice.id, { pay: 'UNPAID', delivery: 'PENDING' })
    await expectError('未付款：拒绝', () => drawForOrder(alice.id, unpaid.orderNo), 400)
    const cancelled = await makeOrder(alice.id, { pay: 'PAID', delivery: 'CANCELLED' })
    await expectError('已付款但已取消：拒绝', () => drawForOrder(alice.id, cancelled.orderNo), 400)
    const refunded = await makeOrder(alice.id, { pay: 'REFUNDED' })
    await expectError('已退款：拒绝', () => drawForOrder(alice.id, refunded.orderNo), 400)
    const bannedOrder = await makeOrder(banned.id)
    await expectError('被禁用的账户：拒绝', () => drawForOrder(banned.id, bannedOrder.orderNo), 403)

    console.log('\n【并发：同一订单同时点 12 次】')
    const couponsBefore = await prisma.coupon.count({ where: { source: 'LOTTERY' } })
    const results = await Promise.allSettled(Array.from({ length: 12 }, () => drawForOrder(alice.id, a1.orderNo)))
    const fulfilled = results.filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<Awaited<ReturnType<typeof drawForOrder>>>[]
    const firstDraws = fulfilled.filter((r) => !r.value.alreadyDrawn)
    ok('恰好 1 次是真正的抽奖', firstDraws.length === 1, `真正抽奖 ${firstDraws.length} 次，失败 ${results.length - fulfilled.length} 次`)
    ok('其余全部拿到同一份结果（不报错）', fulfilled.length === 12, `成功 ${fulfilled.length}/12`)
    ok('每一次返回的都是中奖', fulfilled.every((r) => r.value.view.won === true))
    const couponsAfter = await prisma.coupon.count({ where: { source: 'LOTTERY' } })
    ok('只发出 1 个抽奖券批次', couponsAfter - couponsBefore === 1, `新增 ${couponsAfter - couponsBefore}`)
    const entry = await prisma.lotteryEntry.findUnique({ where: { orderId: a1.id } })
    ok('资格行变成 DRAWN', entry?.state === 'DRAWN')
    const grant = entry?.couponGrantId ? await prisma.couponGrant.findUnique({ where: { id: entry.couponGrantId }, include: { coupon: true } }) : null
    ok('券发给了 alice 本人', grant?.userId === alice.id)
    ok('券是 AVAILABLE', grant?.state === 'AVAILABLE')
    ok('批次 source=LOTTERY、total=1、claimed=1', grant?.coupon.source === 'LOTTERY' && grant.coupon.total === 1 && grant.coupon.claimed === 1)
    ok('券面额 5 元、无门槛', Number(grant?.coupon.discount) === 5 && Number(grant?.coupon.minAmount) === 0)
    ok('到期时间约为 7 天后', !!grant?.expiresAt && Math.abs(grant.expiresAt.getTime() - Date.now() - 7 * 86400_000) < 120_000)
    ok('奖项中出次数 +1', (await prisma.lotteryPrize.findUnique({ where: { id: prize.id } }))?.wonCount === 1)

    console.log('\n【同一个人第二单再中同一奖项（验证不撞 @@unique([couponId,userId])）】')
    const a2 = await makeOrder(alice.id)
    const r2 = await drawForOrder(alice.id, a2.orderNo)
    ok('第二单也能中奖发券', r2.view.won === true && !r2.alreadyDrawn)
    ok('alice 名下现在有 2 张抽奖券', (await prisma.couponGrant.count({ where: { userId: alice.id, coupon: { source: 'LOTTERY' } } })) === 2)

    console.log('\n【奖池为空：拒绝抽奖、保留机会】')
    await prisma.lotteryPrize.update({ where: { id: prize.id }, data: { enabled: false } })
    const a3 = await makeOrder(alice.id)
    await expectError('奖池为空：拒绝（409），不替买家把机会用掉', () => drawForOrder(alice.id, a3.orderNo), 409)
    ok('奖池为空：资格仍是 PENDING', (await prisma.lotteryEntry.findUnique({ where: { orderId: a3.id } }))?.state === 'PENDING')

    console.log('\n【未中奖路径】')
    // 奖池非空但中奖率只有 0.01%：结果不确定，所以只断言「落库与返回一致、未中奖不发券、重复点击返回同一结果」
    const tiny = await prisma.lotteryPrize.create({
      data: { name: `${TAG}-tiny`, type: 'CUSTOM', rateBp: 1, description: 'x' },
    })
    const r3 = await drawForOrder(alice.id, a3.orderNo)
    const e3 = await prisma.lotteryEntry.findUnique({ where: { orderId: a3.id } })
    ok('抽奖落库与返回一致', e3?.state === 'DRAWN' && e3.won === r3.view.won)
    if (!r3.view.won) ok('未中奖不发券', !e3?.couponGrantId)
    const r3b = await drawForOrder(alice.id, a3.orderNo)
    ok('再点一次：返回同一结果，不重抽', r3b.alreadyDrawn && r3b.view.won === r3.view.won)
    await prisma.lotteryPrize.delete({ where: { id: tiny.id } })
    await prisma.lotteryPrize.update({ where: { id: prize.id }, data: { enabled: true } })

    console.log('\n【事务回滚：发券失败时资格回到 PENDING】')
    const a4 = await makeOrder(alice.id)
    // 把奖项改成一个会让建券失败的状态：名称超长会被 slice，所以改用把 coupons 表的 code 撞车不现实；
    // 这里用「奖项在抽奖前被删掉」来制造 wonCount 更新失败（update 找不到行 → 抛错 → 整个事务回滚）
    const doomed = await prisma.lotteryPrize.create({
      data: { name: `${TAG}-doomed`, type: 'CUSTOM', rateBp: 10000, description: 'x', sortOrder: -100 },
    })
    await prisma.lotteryPrize.update({ where: { id: prize.id }, data: { enabled: false } })
    // 读奖池之后、事务里 update 之前删掉它：用 Prisma 中间件不可行，这里直接模拟 ——
    // 先把 doomed 设为唯一启用奖项，然后在抽奖进行中删除（并发触发）
    const drawing = drawForOrder(alice.id, a4.orderNo).then(
      (v) => ({ ok: true as const, v }),
      (e) => ({ ok: false as const, e })
    )
    await prisma.lotteryPrize.delete({ where: { id: doomed.id } }).catch(() => {})
    const outcome = await drawing
    const e4 = await prisma.lotteryEntry.findUnique({ where: { orderId: a4.id } })
    if (outcome.ok) {
      // 两种合法的时序：删除先于读奖池（奖池为空 → 未中奖），或事务提交后才删（抽中 doomed）。
      // 要验证的只是「落库状态与返回给买家的结果一致」
      ok('（删除没有打在事务中间）正常完成且落库与返回一致', e4?.state === 'DRAWN' && e4.won === outcome.v.view.won)
    } else {
      ok('（删除发生在事务中）抽奖失败时资格仍是 PENDING，可重试', e4?.state === 'PENDING', String(outcome.e))
    }
    await prisma.lotteryPrize.update({ where: { id: prize.id }, data: { enabled: true } })

    // 确定性的回滚验证：临时把 coupons 表改名，让事务里的发券必然失败
    // （只在一次性测试库上做；finally 里无论如何都会改回来）
    {
      const a6 = await makeOrder(alice.id)
      await prisma.$executeRawUnsafe('RENAME TABLE coupons TO coupons_itest_hidden')
      let threw = false
      try {
        await drawForOrder(alice.id, a6.orderNo)
      } catch {
        threw = true
      } finally {
        await prisma.$executeRawUnsafe('RENAME TABLE coupons_itest_hidden TO coupons')
      }
      const e6 = await prisma.lotteryEntry.findUnique({ where: { orderId: a6.id } })
      ok('发券失败：抽奖请求报错', threw)
      ok('发券失败：资格回滚为 PENDING（买家可以重试）', e6?.state === 'PENDING' && e6.won == null && !e6.couponGrantId)
      const retry = await drawForOrder(alice.id, a6.orderNo)
      ok('恢复后重试：正常中奖发券', retry.view.won === true && !retry.alreadyDrawn)
    }

    console.log('\n【退款作废】')
    const a5 = await makeOrder(alice.id)
    const v1 = await voidLotteryForOrder(a5.id)
    ok('未抽的资格 → VOID', v1.voided && (await prisma.lotteryEntry.findUnique({ where: { orderId: a5.id } }))?.state === 'VOID')
    await expectError('作废后不能再抽', () => drawForOrder(alice.id, a5.orderNo), 400)
    const v2 = await voidLotteryForOrder(a1.id)
    ok('已中奖且券未使用 → 券作废', v2.couponVoided)
    ok('券状态变成 VOID', (await prisma.couponGrant.findUnique({ where: { id: entry!.couponGrantId! } }))?.state === 'VOID')
    const v3 = await voidLotteryForOrder(a1.id)
    ok('重复作废是幂等的', !v3.voided && !v3.couponVoided)

    // 复核发现的漏洞（C1）：奖券正挂在另一张待付款订单上（LOCKED）时退款，
    // 之后那张订单超时放券 → 券不能因此「复活」
    {
      const src = await makeOrder(alice.id)
      const won = await drawForOrder(alice.id, src.orderNo)
      const srcEntry = await prisma.lotteryEntry.findUnique({ where: { orderId: src.id } })
      ok('（C1 准备）抽中券', won.view.won === true && !!srcEntry?.couponGrantId)
      const other = await makeOrder(alice.id, { eligible: false, pay: 'UNPAID', delivery: 'PENDING' })
      await prisma.couponGrant.update({
        where: { id: srcEntry!.couponGrantId! },
        data: { state: 'LOCKED', orderId: other.id, lockedAt: new Date() },
      })
      await voidLotteryForOrder(src.id)
      const g1 = await prisma.couponGrant.findUnique({ where: { id: srcEntry!.couponGrantId! }, include: { coupon: true } })
      ok('退款时券 LOCKED：券本身不动（那张订单若付款仍能正常核销）', g1?.state === 'LOCKED')
      ok('退款时券 LOCKED：所在单张批次被结束（ENDED）', g1?.coupon.status === 'ENDED')
      const { releaseCouponForOrder } = await import('../src/lib/coupon')
      await releaseCouponForOrder(other.id)
      const g2 = await prisma.couponGrant.findUnique({ where: { id: srcEntry!.couponGrantId! }, include: { coupon: true } })
      ok('那张订单放券后：批次仍是 ENDED —— 建单会以「该券所属活动已结束」拒绝', g2?.coupon.status === 'ENDED')
    }

    console.log('\n【活动配置读写】')
    await saveLotteryConfig({ enabled: true, minOrderAmount: 99.999, rules: '规则' })
    const cfg = await getLotteryConfig()
    ok('门槛按分存储', cfg.minOrderAmount === 100)
    await prisma.setting.update({ where: { key: 'lottery_config' }, data: { value: '{坏 JSON' } })
    ok('配置被改坏：按「活动关闭」处理而不是抛错', (await getLotteryConfig()).enabled === false)
  } finally {
    // ---------- 清理：只删自己建的 ----------
    const orders = await prisma.order.findMany({ where: { productId: product.id }, select: { id: true } })
    const orderIds = orders.map((o) => o.id)
    const entries = await prisma.lotteryEntry.findMany({ where: { orderId: { in: orderIds } } })
    const grantIds = entries.map((e) => e.couponGrantId).filter((v): v is number => v != null)
    const grants = await prisma.couponGrant.findMany({ where: { id: { in: grantIds } }, select: { couponId: true } })
    await prisma.lotteryEntry.deleteMany({ where: { orderId: { in: orderIds } } })
    await prisma.couponGrant.deleteMany({ where: { id: { in: grantIds } } })
    await prisma.coupon.deleteMany({ where: { id: { in: grants.map((g) => g.couponId) } } })
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } })
    await prisma.product.delete({ where: { id: product.id } })
    await prisma.category.delete({ where: { id: cat.id } })
    await prisma.user.deleteMany({ where: { id: { in: [alice.id, bob.id, banned.id] } } })
    await prisma.lotteryPrize.deleteMany({ where: { name: { startsWith: TAG } } })
    for (const p of prevPrizes) await prisma.lotteryPrize.update({ where: { id: p.id }, data: { enabled: p.enabled } }).catch(() => {})
    await saveLotteryConfig(prevCfg)
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
