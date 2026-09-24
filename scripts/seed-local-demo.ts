/**
 * 本地演示数据：给一次性的开发库灌一套能把本轮功能都点一遍的数据。
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/seed-local-demo.ts
 *
 * ⚠️ 库名不含 dev / test 时拒绝执行（这个脚本会清空并重建演示账号与订单）。
 *
 * 账号（密码都是 Test123456）：
 *   admin@demo.local     管理员
 *   buyer@demo.local     普通买家：有已付款可抽奖订单、待付款订单、随单开票订单
 *   promoter@demo.local  推广人：有通过其链接下的订单、返现流水（含一条旧格式 note）、一笔提现
 */
import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

const url = process.env.DATABASE_URL || ''
const dbName = url.split('/').pop()?.split('?')[0] || ''
if (!/dev|test/i.test(dbName)) {
  console.error(`拒绝执行：数据库「${dbName}」看起来不是一次性开发库（库名须含 dev 或 test）`)
  process.exit(2)
}

const prisma = new PrismaClient()
const D = (n: number | string) => new Prisma.Decimal(Number(n).toFixed(2))
const DEMO = '@demo.local'

async function main() {
  // ---------- 清掉上一轮的演示数据 ----------
  const olds = await prisma.user.findMany({ where: { email: { endsWith: DEMO } }, select: { id: true } })
  const oldIds = olds.map((u) => u.id)
  if (oldIds.length) {
    const orders = await prisma.order.findMany({ where: { userId: { in: oldIds } }, select: { id: true } })
    const oids = orders.map((o) => o.id)
    const exts = await prisma.externalOrder.findMany({
      where: { OR: [{ shopOrderId: { in: oids } }, { sourceKey: { in: oids.map((i) => `order:${i}`) } }] },
      select: { id: true },
    })
    await prisma.invoice.deleteMany({ where: { externalOrderId: { in: exts.map((e) => e.id) } } })
    await prisma.receipt.deleteMany({ where: { externalOrderId: { in: exts.map((e) => e.id) } } })
    await prisma.externalOrder.deleteMany({ where: { id: { in: exts.map((e) => e.id) } } })
    await prisma.lotteryEntry.deleteMany({ where: { orderId: { in: oids } } })
    await prisma.referralReward.deleteMany({ where: { orderId: { in: oids } } })
    await prisma.payment.deleteMany({ where: { orderId: { in: oids } } })
    await prisma.orderMessage.deleteMany({ where: { orderId: { in: oids } } })
    await prisma.order.deleteMany({ where: { id: { in: oids } } })
    const grants = await prisma.couponGrant.findMany({ where: { userId: { in: oldIds } }, select: { couponId: true } })
    await prisma.couponGrant.deleteMany({ where: { userId: { in: oldIds } } })
    await prisma.coupon.deleteMany({ where: { id: { in: grants.map((g) => g.couponId) }, source: 'LOTTERY' } })
    await prisma.balanceLog.deleteMany({ where: { userId: { in: oldIds } } })
    await prisma.referralPrice.deleteMany({ where: { userId: { in: oldIds } } })
    await prisma.invoiceTitle.deleteMany({ where: { userId: { in: oldIds } } })
    await prisma.user.deleteMany({ where: { id: { in: oldIds } } })
  }

  const hash = await bcrypt.hash('Test123456', 10)
  const admin = await prisma.user.create({ data: { email: `admin${DEMO}`, passwordHash: hash, nickname: '站长', role: 'ADMIN' } })
  const buyer = await prisma.user.create({ data: { email: `buyer${DEMO}`, passwordHash: hash, nickname: '张小三' } })
  const buyer2 = await prisma.user.create({ data: { email: `lisi${DEMO}`, passwordHash: hash, nickname: 'lisi@qq.com' } })
  const promoter = await prisma.user.create({
    data: { email: `promoter${DEMO}`, passwordHash: hash, nickname: '推广达人', referralCode: 'demo123456', balance: D(0) },
  })

  // ---------- 分类与商品（名称照线上格式，让落地页匹配规则能命中） ----------
  async function cat(name: string, sortOrder: number) {
    return (await prisma.category.findFirst({ where: { name } })) || prisma.category.create({ data: { name, sortOrder } })
  }
  const cClaude = await cat('Claude', 1)
  const cGpt = await cat('ChatGPT', 2)
  const cSms = await cat('短信接码', 4)
  async function prod(categoryId: number, name: string, price: number, deliveryType: string, extra: Partial<Prisma.ProductUncheckedCreateInput> = {}) {
    const found = await prisma.product.findFirst({ where: { name } })
    if (found) return found
    return prisma.product.create({ data: { categoryId, name, price: D(price), deliveryType, stock: -1, sales: 0, ...extra } })
  }
  const pClaudePro = await prod(cClaude.id, 'Claude pro 自助充值 | iOS订阅充值', 150, 'AUTO', {
    originalPrice: D(180),
    description: '自助充值',
    referrerBasePrice: D(140),
    sales: 222,
  })
  const pMax20 = await prod(cClaude.id, 'Claude Max20x自助充值', 1900, 'AUTO', { sales: 26 })
  await prod(cClaude.id, 'Claude Max5x自助充值', 950, 'AUTO', { sales: 40 })
  const pPlus = await prod(cGpt.id, 'ChatGPT Plus 信用卡充值', 135, 'AUTO', { sales: 117, referrerBasePrice: D(132) })
  await prod(cGpt.id, 'ChatGPT Pro 5x iOS充值', 750, 'AUTO', { sales: 12 })
  await prod(cSms.id, 'Codex 接码（美国实体卡）', 20, 'SMS', { sales: 30 })
  await prod(cClaude.id, 'Claude KYC 认证代办', 180, 'MANUAL', { sales: 9 })

  // ---------- 抽奖配置与奖项 ----------
  await prisma.setting.upsert({
    where: { key: 'lottery_config' },
    create: { key: 'lottery_config', value: JSON.stringify({ enabled: true, minOrderAmount: 0, rules: '活动期间每笔已付款订单可抽一次红包。券奖自动发放到「我的优惠券」；实物/自定义奖品请在对应订单内联系客服兑奖，中奖后 30 天内有效。' }) },
    update: { value: JSON.stringify({ enabled: true, minOrderAmount: 0, rules: '活动期间每笔已付款订单可抽一次红包。券奖自动发放到「我的优惠券」；实物/自定义奖品请在对应订单内联系客服兑奖，中奖后 30 天内有效。' }) },
  })
  if ((await prisma.lotteryPrize.count()) === 0) {
    await prisma.lotteryPrize.createMany({
      data: [
        { name: '无门槛 5 元券', type: 'COUPON', rateBp: 3000, couponKind: 'THRESHOLD', couponMinAmount: D(0), couponDiscount: D(5), couponValidDays: 30, sortOrder: 1 },
        { name: '满 100 减 10', type: 'COUPON', rateBp: 2000, couponKind: 'THRESHOLD', couponMinAmount: D(100), couponDiscount: D(10), couponValidDays: 14, sortOrder: 2 },
        { name: 'Claude Pro 月卡', type: 'CUSTOM', rateBp: 100, description: '请在该订单内「与客服在线沟通」兑奖，中奖后 30 天内有效', sortOrder: 3 },
      ],
    })
  }

  // ---------- 订单 ----------
  let n = 0
  const now = Date.now()
  async function order(userId: number, p: { id: number; name: string; price: Prisma.Decimal }, o: Partial<Prisma.OrderUncheckedCreateInput> & { lottery?: boolean; minutesAgo?: number } = {}) {
    n++
    const { lottery, minutesAgo = n * 30, ...rest } = o
    const createdAt = new Date(now - minutesAgo * 60_000)
    const orderNo = `${new Date(createdAt).toISOString().slice(0, 10).replace(/-/g, '')}DEMO${String(n).padStart(4, '0')}`
    const created = await prisma.order.create({
      data: {
        orderNo,
        userId,
        productId: p.id,
        productName: p.name,
        productPrice: p.price,
        quantity: 1,
        amount: p.price,
        createdAt,
        ...rest,
      },
    })
    if (lottery) await prisma.lotteryEntry.create({ data: { orderId: created.id, orderNo, userId, state: 'PENDING', createdAt } })
    if (created.payStatus === 'PAID') {
      await prisma.payment.create({ data: { orderId: created.id, payMethod: 'ALIPAY', amount: created.amount, status: 1 } })
    }
    return created
  }
  const paidAt = new Date(now - 20 * 60_000)
  // 买家：已完成 + 可抽奖
  await order(buyer.id, pClaudePro, { payStatus: 'PAID', payMethod: 'ALIPAY', deliveryStatus: 'DELIVERED', paidAt, deliveredAt: paidAt, lottery: true })
  // 买家：已付款处理中 + 可抽奖
  await order(buyer.id, pMax20, { payStatus: 'PAID', payMethod: 'ALIPAY', deliveryStatus: 'PROCESSING', paidAt, lottery: true })
  // 买家：待付款 + 有资格（付款后才能抽）
  await order(buyer.id, pPlus, { lottery: true, minutesAgo: 5 })
  // 买家：活动关闭期间的已付款单（没有资格行 → 没有红包按钮）
  await order(buyer.id, pPlus, { payStatus: 'PAID', payMethod: 'ALIPAY', deliveryStatus: 'DELIVERED', paidAt, deliveredAt: paidAt, minutesAgo: 60 * 24 * 3 })
  // 买家：随单开票（税费已随货款付清）→ 发票已提交
  const tax = D(9) // 150 × 6%
  const invOrder = await order(buyer.id, pClaudePro, {
    payStatus: 'PAID',
    payMethod: 'ALIPAY',
    deliveryStatus: 'DELIVERED',
    paidAt,
    deliveredAt: paidAt,
    invoiceTaxFee: tax,
    invoiceInfo: JSON.stringify({ title: '益阳示例科技有限公司', taxNumber: '91430900MA4TEST01X', email: `buyer${DEMO}`, showAiWording: false, taxFee: 9 }),
  })
  const ext = await prisma.externalOrder.create({
    data: {
      sourceKey: `order:${invOrder.id}`,
      shopOrderId: invOrder.id,
      startDate: paidAt,
      expireDate: new Date(paidAt.getTime() + 30 * 86400_000),
      remindedExpireDate: new Date(paidAt.getTime() + 30 * 86400_000),
      subscriptionType: invOrder.productName,
      claudeAccount: `buyer${DEMO}`,
      quote: invOrder.amount,
      importBatch: 'SHOP',
    },
  })
  await prisma.invoice.create({
    data: {
      invoiceNo: `INVDEMO${invOrder.id}`,
      externalOrderId: ext.id,
      userId: buyer.id,
      source: 'BUYER',
      sourceKey: ext.sourceKey,
      claudeAccount: ext.claudeAccount,
      subscriptionType: ext.subscriptionType,
      sellingPrice: D(150),
      invoiceAmount: D(159),
      taxFee: tax,
      title: '益阳示例科技有限公司',
      taxNumber: '91430900MA4TEST01X',
      email: `buyer${DEMO}`,
      showAiWording: false,
      status: 'SUBMITTED',
      payStatus: 'PAID',
      paidAt,
      submittedAt: paidAt,
    },
  })

  // 推广人：两单通过其链接下单（一单已结算、一单待结算），一单待付款
  const refDone = await order(buyer2.id, pClaudePro, {
    payStatus: 'PAID',
    payMethod: 'ALIPAY',
    deliveryStatus: 'DELIVERED',
    paidAt,
    deliveredAt: paidAt,
    referrerId: promoter.id,
    referralReward: D(10),
  })
  await order(buyer.id, pMax20, { payStatus: 'PAID', payMethod: 'ALIPAY', deliveryStatus: 'PROCESSING', paidAt, referrerId: promoter.id, referralReward: D(60) })
  await order(buyer2.id, pPlus, { referrerId: promoter.id, referralReward: D(3), minutesAgo: 3 })
  await prisma.referralReward.create({
    data: { orderId: refDone.id, referrerId: promoter.id, buyerId: buyer2.id, productId: pClaudePro.id, amount: D(10), status: 'SETTLED', settledAt: paidAt },
  })
  // 旧格式流水：order_id 为 NULL，只能从 note 解析（验证 referralOrderIdOf 的回退路径）
  await prisma.balanceLog.create({ data: { userId: promoter.id, delta: D(10), balanceAfter: D(10), type: 'REFERRAL', note: `订单#${refDone.id} 内推返现`, createdAt: paidAt } })
  await prisma.balanceLog.create({ data: { userId: promoter.id, delta: D(-4), balanceAfter: D(6), type: 'WITHDRAW', note: '提现到支付宝（线下）' } })
  await prisma.user.update({ where: { id: promoter.id }, data: { balance: D(6) } })

  console.log('演示数据已就绪：admin / buyer / promoter @demo.local，密码 Test123456')
  console.log({ admin: admin.id, buyer: buyer.id, buyer2: buyer2.id, promoter: promoter.id })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
