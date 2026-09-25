/**
 * 「已付款后取消 / 退款」的回滚闸门 + 接码 CAS + 报表返现口径 —— 数据库集成测试（会建数据、会删数据）。
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-order-void.ts
 *
 * ⚠️ 只能对一次性的本地库跑：库名不含 dev / test 时直接拒绝执行（与 seed-local-demo.ts 同一道门禁）。
 * 不访问外网：接码上游地址指到本机一个不监听的端口，放号请求会立刻失败并只记日志（与线上失败时同一条路）。
 *
 * 覆盖（2026-09-26 A2 包）：
 *   · 站内兑换：所属订单「已付款 + 已取消」或「已退款」→ ORDER_VOID；撤回取消后恢复；外部站卡不受影响
 *   · 开票 / 收据闸门：assertShopOrderBillable、settlePrepaid（已取消必须抛错，不能 return null）、submitReceipt
 *   · 取消已付单时作废未开出的发票（SUBMITTED / AWAIT_PAY → CANNOT，ISSUED 只报票号）
 *   · 接码：订单已取消时轮询放号、不再翻回已交付；超时分支并发只追加一次【待退款】；cancelActivationForOrder 幂等
 *   · 报表：settledReferralCents 只算 SETTLED
 */
const url = process.env.DATABASE_URL || ''
const dbName = url.split('/').pop()?.split('?')[0] || ''
if (!/dev|test/i.test(dbName)) {
  console.error(`拒绝执行：数据库「${dbName}」看起来不是一次性开发库（库名须含 dev 或 test）`)
  process.exit(2)
}
// 必须在 import 业务模块之前设好：cardkey / herosms 在模块顶层读环境变量
if (!process.env.CARDKEY_SECRET) process.env.CARDKEY_SECRET = 'itest-cardkey-secret'
process.env.HEROSMS_BASE = 'http://127.0.0.1:9/handler_api.php'
process.env.HEROSMS_API_KEY = process.env.HEROSMS_API_KEY || 'itest'

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
const TAG = `ivoid${Date.now().toString(36)}`

async function main() {
  const { Prisma } = await import('@prisma/client')
  const { prisma } = await import('../src/lib/db')
  const { cardContentHash, encryptCardContent } = await import('../src/lib/cardkey')
  const { resolveCard } = await import('../src/lib/redeem/service')
  const { assertShopOrderBillable, settlePrepaidOrderInvoice, BillingError } = await import('../src/lib/order-invoice')
  const { submitReceiptForExternalOrder } = await import('../src/lib/order-billing')
  const { voidOpenInvoicesForOrder } = await import('../src/lib/order-link')
  const { pollActivation, cancelActivationForOrder } = await import('../src/lib/sms')
  const { settledReferralCents } = await import('../src/lib/referral-report')
  const D = (n: number) => new Prisma.Decimal(n.toFixed(2))

  const cat = (await prisma.category.findFirst()) ?? (await prisma.category.create({ data: { name: `${TAG}-cat` } }))
  const buyer = await prisma.user.create({ data: { email: `${TAG}@itest.local`, passwordHash: 'x', nickname: TAG } })
  const product = await prisma.product.create({
    data: { categoryId: cat.id, name: `${TAG}-auto`, price: D(10), status: 0, deliveryType: 'AUTO' },
  })
  const smsProduct = await prisma.product.create({
    data: { categoryId: cat.id, name: `${TAG}-sms`, price: D(5), status: 0, deliveryType: 'SMS' },
  })
  const orderIds: number[] = []
  const mkOrder = async (p: { productId: number; pay: 'UNPAID' | 'PAID' | 'REFUNDED'; del: 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'CANCELLED'; tax?: number }) => {
    const o = await prisma.order.create({
      data: {
        orderNo: `${TAG}${orderIds.length}`.slice(0, 32),
        userId: buyer.id,
        productId: p.productId,
        productName: TAG,
        productPrice: D(10),
        amount: D(10),
        payStatus: p.pay,
        deliveryStatus: p.del,
        paidAt: p.pay === 'UNPAID' ? null : new Date(),
        invoiceTaxFee: p.tax != null ? D(p.tax) : null,
        invoiceInfo: p.tax != null ? JSON.stringify({ title: '测试抬头', taxNumber: '91110000000000000X', email: `${TAG}@itest.local`, showAiWording: false, taxFee: p.tax }) : null,
      },
    })
    orderIds.push(o.id)
    return o
  }
  const setOrder = (id: number, data: { payStatus?: 'UNPAID' | 'PAID' | 'REFUNDED'; deliveryStatus?: 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'CANCELLED' }) =>
    prisma.order.update({ where: { id }, data })
  const extIds: number[] = []

  try {
    // ============ 站内兑换 ============
    console.log('\n[站内兑换：所属订单作废后拒绝]')
    const o1 = await mkOrder({ productId: product.id, pay: 'PAID', del: 'DELIVERED' })
    const secret = `${TAG}-CDK-1`
    await prisma.cardKey.create({
      data: { productId: product.id, content: encryptCardContent(secret), contentHash: cardContentHash(secret), status: 'USED', orderId: o1.id, usedAt: new Date() },
    })
    const ext = `${TAG}-CDK-EXT`
    await prisma.cardKey.create({
      data: { productId: product.id, content: encryptCardContent(ext), contentHash: cardContentHash(ext), status: 'USED', externalRef: `${TAG}:x`, usedAt: new Date() },
    })
    let r = await resolveCard('sysa', secret)
    ok('正常已交付订单的卡可兑换', r.ok)
    await setOrder(o1.id, { deliveryStatus: 'CANCELLED' })
    r = await resolveCard('sysa', secret)
    ok('已付款 + 已取消 → ORDER_VOID', !r.ok && r.reason === 'ORDER_VOID')
    await setOrder(o1.id, { deliveryStatus: 'DELIVERED' })
    r = await resolveCard('sysa', secret)
    ok('撤回取消后自动恢复可兑换', r.ok)
    await setOrder(o1.id, { payStatus: 'REFUNDED' })
    r = await resolveCard('sysa', secret)
    ok('已退款 → ORDER_VOID', !r.ok && r.reason === 'ORDER_VOID')
    r = await resolveCard('sysa', ext)
    ok('外部站发的卡（无 orderId）不受影响', r.ok)

    // ============ 开票 / 收据闸门 ============
    console.log('\n[开票 / 收据闸门]')
    const o2 = await mkOrder({ productId: product.id, pay: 'PAID', del: 'DELIVERED', tax: 0.6 })
    const code = async (fn: () => Promise<unknown>) => {
      try {
        await fn()
        return 'ok'
      } catch (e) {
        return e instanceof BillingError ? `BillingError:${e.status}` : `other:${(e as Error).message}`
      }
    }
    ok('已交付订单可开票', (await code(() => assertShopOrderBillable(o2.id))) === 'ok')
    await setOrder(o2.id, { deliveryStatus: 'CANCELLED' })
    ok('已付款 + 已取消 → 409', (await code(() => assertShopOrderBillable(o2.id))) === 'BillingError:409')
    ok('settlePrepaid 对已取消订单抛 409（不能 return null 让调用方再建一张待付税费发票）',
      (await code(() => settlePrepaidOrderInvoice(o2.id))) === 'BillingError:409')
    const invCountBefore = await prisma.invoice.count({ where: { sourceKey: `order:${o2.id}` } })
    ok('被拒时没有补落地发票', invCountBefore === 0)
    await setOrder(o2.id, { payStatus: 'REFUNDED' })
    ok('已退款 → 409', (await code(() => assertShopOrderBillable(o2.id))) === 'BillingError:409')
    const o3 = await mkOrder({ productId: product.id, pay: 'UNPAID', del: 'CANCELLED' })
    ok('超时取消（UNPAID + CANCELLED）不在这道闸管辖内', (await code(() => assertShopOrderBillable(o3.id))) === 'ok')
    ok('没有关联站内订单时放行', (await code(() => assertShopOrderBillable(null))) === 'ok')

    // 收据：外部订单行指回已取消的站内订单
    const e1 = await prisma.externalOrder.create({
      data: {
        shopOrderId: o2.id, startDate: new Date(), expireDate: new Date(), subscriptionType: TAG,
        claudeAccount: `${TAG}@itest.local`, sourceKey: `${TAG}-e1`, quote: D(10),
      },
    })
    extIds.push(e1.id)
    ok('submitReceiptForExternalOrder 对已作废订单抛 409',
      (await code(() => submitReceiptForExternalOrder(e1.id, '测试抬头', { showAiWording: false }))) === 'BillingError:409')
    ok('被拒时没有建收据', (await prisma.receipt.count({ where: { externalOrderId: e1.id } })) === 0)

    // ============ 作废未开出的发票 ============
    console.log('\n[取消已付单：作废未开出的发票]')
    const o4 = await mkOrder({ productId: product.id, pay: 'PAID', del: 'DELIVERED' })
    const eBack = await prisma.externalOrder.create({
      data: { startDate: new Date(), expireDate: new Date(), subscriptionType: TAG, claudeAccount: `${TAG}@itest.local`, sourceKey: `order:${o4.id}`, quote: D(10) },
    })
    const eWeb = await prisma.externalOrder.create({
      data: { shopOrderId: o4.id, startDate: new Date(), expireDate: new Date(), subscriptionType: TAG, claudeAccount: `${TAG}@itest.local`, sourceKey: `${TAG}-web`, quote: D(10) },
    })
    extIds.push(eBack.id, eWeb.id)
    const iv1 = await prisma.invoice.create({
      data: { invoiceNo: `${TAG}i1`.slice(0, 32), externalOrderId: eBack.id, sourceKey: eBack.sourceKey, claudeAccount: eBack.claudeAccount, subscriptionType: TAG, status: 'SUBMITTED', payStatus: 'PAID' },
    })
    const iv2 = await prisma.invoice.create({
      data: { invoiceNo: `${TAG}i2`.slice(0, 32), externalOrderId: eWeb.id, sourceKey: eWeb.sourceKey, claudeAccount: eWeb.claudeAccount, subscriptionType: TAG, status: 'ISSUED', payStatus: 'PAID' },
    })
    const vr = await voidOpenInvoicesForOrder(o4.id)
    const iv1After = await prisma.invoice.findUnique({ where: { id: iv1.id } })
    const iv2After = await prisma.invoice.findUnique({ where: { id: iv2.id } })
    ok('SUBMITTED → CANNOT', iv1After?.status === 'CANNOT' && vr.voided === 1, JSON.stringify(vr))
    ok('ISSUED 不改，只返回票号提示红冲', iv2After?.status === 'ISSUED' && vr.issuedNos.includes(iv2.invoiceNo))
    const vr2 = await voidOpenInvoicesForOrder(o4.id)
    ok('重复调用幂等（没有可作废的了）', vr2.voided === 0)

    // ============ 接码 ============
    console.log('\n[接码：已取消订单放号、超时并发只记一次]')
    const o5 = await mkOrder({ productId: smsProduct.id, pay: 'PAID', del: 'CANCELLED' })
    await prisma.smsActivation.create({
      data: { orderId: o5.id, activationId: `${TAG}a5`, phone: '+10000000000', service: 'x', country: '0', status: 'WAITING', expireAt: new Date(Date.now() + 10 * 60_000), numberAt: new Date() },
    })
    const a5 = await pollActivation(o5.id)
    const o5After = await prisma.order.findUnique({ where: { id: o5.id } })
    ok('已付款 + 已取消：轮询把 WAITING 放掉', a5?.status === 'CANCELLED', a5?.status)
    ok('订单仍是已取消、不追加【待退款】', o5After?.deliveryStatus === 'CANCELLED' && !(o5After?.remark || '').includes('待退款'))

    const o6 = await mkOrder({ productId: smsProduct.id, pay: 'PAID', del: 'PROCESSING' })
    await prisma.smsActivation.create({
      data: { orderId: o6.id, activationId: `${TAG}a6`, phone: '+10000000001', service: 'x', country: '0', status: 'WAITING', expireAt: new Date(Date.now() - 1000), numberAt: new Date() },
    })
    await Promise.all([pollActivation(o6.id), pollActivation(o6.id), pollActivation(o6.id)])
    const a6 = await prisma.smsActivation.findUnique({ where: { orderId: o6.id } })
    const o6After = await prisma.order.findUnique({ where: { id: o6.id } })
    const times = ((o6After?.remark || '').match(/接码超时/g) || []).length
    ok('超时：状态 TIMEOUT', a6?.status === 'TIMEOUT', a6?.status)
    ok('三路并发轮询只追加一次【待退款】', times === 1, `出现 ${times} 次：${o6After?.remark}`)

    const o7 = await mkOrder({ productId: smsProduct.id, pay: 'PAID', del: 'PROCESSING' })
    await prisma.smsActivation.create({
      data: { orderId: o7.id, activationId: `${TAG}a7`, phone: '+10000000002', service: 'x', country: '0', status: 'WAITING', expireAt: new Date(Date.now() + 10 * 60_000), numberAt: new Date() },
    })
    await cancelActivationForOrder(o7.id)
    await cancelActivationForOrder(o7.id)
    const a7 = await prisma.smsActivation.findUnique({ where: { orderId: o7.id } })
    ok('cancelActivationForOrder：WAITING → CANCELLED，重复调用无副作用', a7?.status === 'CANCELLED')

    // ============ 报表返现口径 ============
    console.log('\n[报表：只扣已结算返现]')
    const o8 = await mkOrder({ productId: product.id, pay: 'PAID', del: 'DELIVERED' })
    const o9 = await mkOrder({ productId: product.id, pay: 'PAID', del: 'DELIVERED' })
    await prisma.referralReward.create({ data: { orderId: o8.id, referrerId: buyer.id, buyerId: buyer.id, productId: product.id, amount: D(1.23), status: 'SETTLED', settledAt: new Date() } })
    await prisma.referralReward.create({ data: { orderId: o9.id, referrerId: buyer.id, buyerId: buyer.id, productId: product.id, amount: D(4), status: 'CANCELLED' } })
    const m = await settledReferralCents([o8.id, o9.id, o8.id])
    ok('SETTLED 计入（按分）', m.get(o8.id) === 123, String(m.get(o8.id)))
    ok('CANCELLED 不计入', !m.has(o9.id))
  } finally {
    // ---------- 清理 ----------
    await prisma.receipt.deleteMany({ where: { externalOrderId: { in: extIds } } })
    await prisma.invoice.deleteMany({ where: { OR: [{ externalOrderId: { in: extIds } }, { invoiceNo: { startsWith: TAG } }, { sourceKey: { in: orderIds.map((i) => `order:${i}`) } }] } })
    await prisma.externalOrder.deleteMany({ where: { OR: [{ id: { in: extIds } }, { sourceKey: { in: orderIds.map((i) => `order:${i}`) } }, { shopOrderId: { in: orderIds } }] } })
    await prisma.referralReward.deleteMany({ where: { orderId: { in: orderIds } } })
    await prisma.smsActivation.deleteMany({ where: { orderId: { in: orderIds } } })
    await prisma.cardKey.deleteMany({ where: { productId: { in: [product.id, smsProduct.id] } } })
    await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } })
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } })
    await prisma.product.deleteMany({ where: { id: { in: [product.id, smsProduct.id] } } })
    await prisma.user.delete({ where: { id: buyer.id } })
    if (cat.name === `${TAG}-cat`) await prisma.category.delete({ where: { id: cat.id } })
    await prisma.$disconnect()
  }

  console.log(`\n通过 ${pass} 条，失败 ${fail} 条`)
  if (fail) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})

// 让本文件成为模块：顶层没有静态 import 时 TS 把它当全局脚本，main / ok 会和 scripts 下其他脚本撞名
export {}
