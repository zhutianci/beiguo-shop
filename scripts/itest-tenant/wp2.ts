/**
 * WP2（定价、下单与买家侧查询）集成测试。进程内跑法（不起 Next 服务），连开发库。
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-tenant/wp2.ts
 *
 * 覆盖实施分包 5.5：W2-1（主站定价对照旧算法）、W2-2（渠道快照）、W2-3（T13 拒绝矩阵）、W2-4（券 / ref / 未知字段）、
 * W2-5（T11 两站互不可见 + 跨站写接口 404）、W2-5a（跨站 ExternalOrder 开票 / 收据 404、零写入）、W2-5b（留言键集合）、
 * W2-5c（T27 成员自买）、W2-5d（SUSPENDED 可付、TERMINATED 照常查看）、W2-5e（T24 兑换统一文案）、
 * W2-6（渠道站商品接口与页面 props 值扫描）、W2-7（事务内读 tenant 失败整单回滚）、W2-8（数量与未付单上限）、
 * W2-9（收银台 / 收据跨店面跳转）、W2-10（createShopOrder 断言与撞号重试），以及休眠期主站回归（M2 / M3 口径）。
 *
 * 测试数据全部带 WP0 harness 的可识别前缀，finally 里清理（含本包额外产生的外部订单、收款单、内推价）。
 */
import { Prisma } from '@prisma/client'
import {
  prisma,
  RUN,
  MAIL_DOMAIN,
  NAME_PREFIX,
  check,
  section,
  summary,
  setChannelsMode,
  signTestToken,
  callRoute,
  catchNext,
  withRequest,
  collectKeys,
  createUser,
  createWorld,
  cleanupAll,
  type RouteFn,
  type World,
  type WorldTenant,
  type WorldUser,
} from './_harness'

// vmq 模块在加载时读 VMQ_KEY（vmqConfigured）；路由模块一律在设好之后动态加载
if (!process.env.VMQ_KEY) process.env.VMQ_KEY = 'itest-wp2-vmq-key'
delete process.env.WECOM_WEBHOOK_URL
// React.cache 只在 Next 自带的 React 里有（服务端组件用）；tsx 直接跑时补一个直通实现，页面模块才能加载
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ReactMod = require('react') as { cache?: unknown }
if (typeof ReactMod.cache !== 'function') ReactMod.cache = <F>(fn: F): F => fn
// tsx 按经典 JSX 运行时编译 .tsx（React.createElement），页面模块里没有 import React，补一个全局
;(globalThis as { React?: unknown }).React = ReactMod
/** 本文件用过的 IP（兑换日志 cardKeyId 为空的行按它清理） */
const REDEEM_IPS: string[] = []

type Json = any // eslint-disable-line @typescript-eslint/no-explicit-any

const FRONT_FORBIDDEN_KEYS = [
  'supplyCents',
  'supplyUnitPrice',
  'supplyUnitCents',
  'feeRateBp',
  'invoiceShareRateBp',
  'mainPriceAtOrder',
  'mainPriceCents',
  'tenantId',
  'shopOrderId',
  'senderRole',
  'senderUserId',
  'readByTenant',
  'settleExcludeReason',
  'listingId',
  'cost',
  'referrerBasePrice',
]

async function extraCleanup(): Promise<void> {
  const users = await prisma.user.findMany({ where: { email: { endsWith: MAIL_DOMAIN } }, select: { id: true } })
  const uIds = users.map((u) => u.id)
  const products = await prisma.product.findMany({ where: { name: { startsWith: NAME_PREFIX } }, select: { id: true } })
  const pIds = products.map((p) => p.id)
  const orders = await prisma.order.findMany({ where: { OR: [{ userId: { in: uIds } }, { productId: { in: pIds } }] }, select: { id: true } })
  const oIds = orders.map((o) => o.id)
  const exts = await prisma.externalOrder.findMany({
    where: { OR: [{ claudeAccount: { endsWith: MAIL_DOMAIN } }, { shopOrderId: { in: oIds } }, { sourceKey: { in: oIds.map((id) => `order:${id}`) } }] },
    select: { id: true },
  })
  const eIds = exts.map((e) => e.id)
  const invs = await prisma.invoice.findMany({ where: { OR: [{ externalOrderId: { in: eIds } }, { claudeAccount: { endsWith: MAIL_DOMAIN } }] }, select: { id: true } })
  const iIds = invs.map((i) => i.id)
  const vmqs = await prisma.vmqOrder.findMany({
    where: { OR: [{ bizType: 'order', bizId: { in: oIds } }, { bizType: 'invoice', bizId: { in: iIds } }, { outTradeNo: { startsWith: 'ITW2' } }] },
    select: { orderId: true },
  })
  const vIds = vmqs.map((v) => v.orderId)
  await prisma.vmqLock.deleteMany({ where: { orderId: { in: vIds } } })
  await prisma.vmqOrder.deleteMany({ where: { orderId: { in: vIds } } })
  await prisma.receipt.deleteMany({ where: { OR: [{ externalOrderId: { in: eIds } }, { claudeAccount: { endsWith: MAIL_DOMAIN } }] } })
  await prisma.invoice.deleteMany({ where: { id: { in: iIds } } })
  await prisma.externalOrder.deleteMany({ where: { id: { in: eIds } } })
  await prisma.referralPrice.deleteMany({ where: { OR: [{ userId: { in: uIds } }, { productId: { in: pIds } }] } })
  await prisma.referrerBasePrice.deleteMany({ where: { OR: [{ userId: { in: uIds } }, { productId: { in: pIds } }] } })
  await prisma.referralReward.deleteMany({ where: { orderId: { in: oIds } } }).catch(() => undefined)
  await prisma.invoiceTitle.deleteMany({ where: { userId: { in: uIds } } }).catch(() => undefined)
  if (REDEEM_IPS.length) await prisma.redeemLog.deleteMany({ where: { cardKeyId: null, ip: { in: REDEEM_IPS } } })
}

async function main(): Promise<void> {
  await extraCleanup()
  await cleanupAll()

  // ---- 动态加载被测模块（VMQ_KEY 已就位）----
  const ordersRoute = await import('../../src/app/api/orders/route')
  const recentRoute = await import('../../src/app/api/orders/recent/route')
  const msgRoute = await import('../../src/app/api/orders/[id]/messages/route')
  const invRoute = await import('../../src/app/api/orders/[id]/invoice/route')
  const rcptRoute = await import('../../src/app/api/orders/[id]/receipt/route')
  const smsRoute = await import('../../src/app/api/orders/[id]/sms/route')
  const smsRetryRoute = await import('../../src/app/api/orders/[id]/sms/retry/route')
  const vmqCreate = await import('../../src/app/api/pay/vmq/create/route')
  const vmqStatus = await import('../../src/app/api/pay/vmq/status/route')
  const unreadRoute = await import('../../src/app/api/account/unread/route')
  const overviewRoute = await import('../../src/app/api/account/overview/route')
  const receiptsRoute = await import('../../src/app/api/receipts/route')
  const receiptTokenRoute = await import('../../src/app/api/receipts/[token]/route')
  const invoicesRoute = await import('../../src/app/api/invoices/route')
  const invoicePayRoute = await import('../../src/app/api/invoices/[id]/pay/route')
  const productsRoute = await import('../../src/app/api/products/route')
  const productRoute = await import('../../src/app/api/products/[id]/route')
  const categoriesRoute = await import('../../src/app/api/categories/route')
  const redeemCheck = await import('../../src/app/api/redeem/[provider]/check/route')
  const pricing = await import('../../src/lib/pricing')
  const cso = await import('../../src/lib/order/create-shop-order')
  const referralLib = await import('../../src/lib/referral')
  const { platformStorefront } = await import('../../src/lib/storefront/resolve')

  const R = (fn: unknown) => fn as RouteFn

  setChannelsMode('observe')
  const w: World = await createWorld()
  const L = w.lulu
  const M = w.main
  const tok = (u: WorldUser, t: WorldTenant) => w.token(u, t)

  // 特征值：把三个商品的站长价改成可识别的值，W2-6 扫描它们
  const MAIN_PRICE_MARK = '131.47'
  await prisma.product.update({ where: { id: w.products.auto }, data: { price: new Prisma.Decimal(MAIN_PRICE_MARK) } })
  await prisma.product.update({ where: { id: w.products.manual }, data: { price: new Prisma.Decimal('132.58') } })
  await prisma.product.update({ where: { id: w.products.sms }, data: { price: new Prisma.Decimal('16.37') } })
  const luluAutoListing = await prisma.tenantListing.findUniqueOrThrow({ where: { publicNo: w.listings.luluAuto }, select: { id: true } })

  const cat = await prisma.product.findUniqueOrThrow({ where: { id: w.products.auto }, select: { categoryId: true } })
  let pseq = 0
  const mkProduct = async (price: string, status = 1) =>
    prisma.product.create({
      data: { categoryId: cat.categoryId, name: `${NAME_PREFIX} W2-${++pseq} ${RUN}`, price: new Prisma.Decimal(price), deliveryType: 'AUTO', stock: -1, status },
    })
  const mkListing = (tenantId: number, productId: number, extra: Partial<Prisma.TenantListingUncheckedCreateInput> = {}) =>
    prisma.tenantListing.create({
      data: { publicNo: `W2${RUN}${++pseq}`.toUpperCase().slice(0, 16), tenantId, productId, granted: true, supplyCents: 5000, retailCents: 6000, status: 1, ...extra },
    })

  // 本文件建的全部用户（订单计数只数它们与本次夹具租户的单：同库里别的包的 itest 可能同时在跑）
  const myUserIds = new Set<number>(Object.values(w.users).map((u) => u.id))
  const mkUser: typeof createUser = async (name, opt) => {
    const u = await createUser(name, opt)
    myUserIds.add(u.id)
    return u
  }
  let useq = 0
  const freshBuyer = (reg = L.id) => mkUser(`w2-buyer-${++useq}`, { registeredTenantId: reg })

  const postOrder = (host: string, token: string | null, body: unknown) =>
    callRoute(R(ordersRoute.POST), { host, token, method: 'POST', path: '/api/orders', body })
  const getOrders = (host: string, token: string | null) => callRoute(R(ordersRoute.GET), { host, token, path: '/api/orders?page=1&pageSize=50' })
  const orderByNo = (orderNo: string) => prisma.order.findUniqueOrThrow({ where: { orderNo } })
  const orderCount = () => prisma.order.count({ where: { OR: [{ tenantId: { in: [L.id, w.zz.id] } }, { userId: { in: Array.from(myUserIds) } }] } })

  // =====================================================================
  section('W2-2 渠道下单：快照 7 列、售价、无营销字段、客户关系')
  {
    const b = await freshBuyer(1) // 主站注册、第一次在 lulu 下单
    const r = await postOrder(L.host, tok(b, L), { productId: w.products.auto, quantity: 2, remark: 'W2 备注' })
    check('下单成功', r.status === 200 && r.json?.success === true, r.text.slice(0, 200))
    const o = await orderByNo(r.json.data.order.orderNo)
    check('tenantId = lulu', o.tenantId === L.id)
    check('listingId = 本店上架行', o.listingId === luluAutoListing.id)
    check('supplyUnitPrice = 110.37', o.supplyUnitPrice?.toFixed(2) === '110.37')
    check('supplyCents = 11037 × 2', o.supplyCents === 22074)
    check('feeRateBp = 渠道当前 150', o.feeRateBp === 150)
    check('invoiceShareRateBp = 200', o.invoiceShareRateBp === 200)
    check('settleHoldDays = 渠道 holdDays 7', o.settleHoldDays === 7)
    check('mainPriceAtOrder = 下单时站长价', o.mainPriceAtOrder?.toFixed(2) === MAIN_PRICE_MARK)
    check('productPrice = 售价 140.00', o.productPrice.toFixed(2) === '140.00')
    check('amount = 280.00（不含税）', o.amount.toFixed(2) === '280.00')
    check('referrer / coupon / originalAmount 全空', o.referrerId === null && o.referralReward === null && o.couponGrantId === null && o.couponDiscount === null && o.originalAmount === null)
    check('remark 与 buyerRemark 双写', o.remark === 'W2 备注' && o.buyerRemark === 'W2 备注')
    check('settleState / settleExcludeReason 为空（付款时才计提）', o.settleState === null && o.settleExcludeReason === null)
    check('无抽奖资格', (await prisma.lotteryEntry.count({ where: { orderId: o.id } })) === 0 && r.json.data.lotteryEligible === false)
    const c = await prisma.tenantCustomer.findUnique({ where: { tenantId_userId: { tenantId: L.id, userId: b.id } } })
    check('TenantCustomer(via=ORDER) 已建', c?.joinedVia === 'ORDER' && !!c.firstOrderAt && !!c.lastOrderAt)
    const keys = collectKeys(r.json).map((k) => k.key)
    check('下单响应不含任何前台禁用键', !keys.some((k) => FRONT_FORBIDDEN_KEYS.includes(k)), keys.join(','))
    check('payable = 280', r.json.data.payable === 280)

    // 开票：税费 = 货价 × 6%
    const r2 = await postOrder(L.host, tok(b, L), {
      productId: w.products.auto,
      quantity: 1,
      invoice: { title: 'ITEST 公司', taxNumber: '91110000ITEST0001X', email: b.email, showAiWording: false },
    })
    check('勾开票下单成功', r2.json?.success === true, r2.text.slice(0, 200))
    const o2 = await orderByNo(r2.json.data.order.orderNo)
    check('invoiceTaxFee = 8.40、amount 仍不含税 140', o2.invoiceTaxFee?.toFixed(2) === '8.40' && o2.amount.toFixed(2) === '140.00')

    // 费率快照：改渠道费率后新单用新值（事务内读）
    await prisma.tenant.update({ where: { id: L.id }, data: { feeRateBp: 180, invoiceShareRateBp: 300, holdDays: 15 } })
    const r3 = await postOrder(L.host, tok(b, L), { productId: w.products.auto, quantity: 1 })
    const o3 = await orderByNo(r3.json.data.order.orderNo)
    check('费率与冻结期按下单时快照（180 / 300 / 15）', o3.feeRateBp === 180 && o3.invoiceShareRateBp === 300 && o3.settleHoldDays === 15)
    const o1Again = await orderByNo(r.json.data.order.orderNo)
    check('历史单快照不变', o1Again.feeRateBp === 150)
    await prisma.tenant.update({ where: { id: L.id }, data: { feeRateBp: 150, invoiceShareRateBp: 200, holdDays: 7 } })
  }

  // =====================================================================
  section('W2-3 设计 T13：不可售一律拒绝（拉黑为中性文案），零写入')
  {
    const b = await freshBuyer()
    const pNotGranted = await mkProduct('50.00')
    await mkListing(L.id, pNotGranted.id, { granted: false })
    const pOff = await mkProduct('50.00')
    await mkListing(L.id, pOff.id, { status: 0 })
    const pNoSupply = await mkProduct('50.00')
    await mkListing(L.id, pNoSupply.id, { supplyCents: null })
    const pBelow = await mkProduct('50.00')
    await mkListing(L.id, pBelow.id, { supplyCents: 7000, retailCents: 6000 })
    const pProdOff = await mkProduct('50.00', 0)
    await mkListing(L.id, pProdOff.id)
    const pZzOnly = await mkProduct('97.31')
    await mkListing(w.zz.id, pZzOnly.id)
    const pNoPrice = await mkProduct('50.00')
    await mkListing(L.id, pNoPrice.id, { retailCents: null })
    const before = await orderCount()
    const cases: [string, number][] = [
      ['未授权', pNotGranted.id],
      ['未上架', pOff.id],
      ['进货价为空', pNoSupply.id],
      ['售价低于进货价', pBelow.id],
      ['Product.status≠1', pProdOff.id],
      ['zz 的商品', pZzOnly.id],
      ['未定售价', pNoPrice.id],
      ['不存在的商品 id', 999999999],
    ]
    for (const [name, pid] of cases) {
      const r = await postOrder(L.host, tok(b, L), { productId: pid, quantity: 1 })
      check(`${name} → 400「商品不存在或已下架」`, r.status === 400 && r.json?.error === '商品不存在或已下架', `${r.status} ${r.text.slice(0, 120)}`)
    }
    // 被本站拉黑
    const blocked = await freshBuyer()
    await prisma.tenantCustomer.create({
      data: { publicNo: `W2BLK${RUN}`.toUpperCase().slice(0, 16), tenantId: L.id, userId: blocked.id, joinedVia: 'REGISTER', blockedAt: new Date(), blockedByKind: 'TENANT' },
    })
    const rb = await postOrder(L.host, tok(blocked, L), { productId: w.products.auto, quantity: 1 })
    check('本站拉黑 → 403 中性文案', rb.status === 403 && rb.json?.error === '该账号暂无法在本站下单，请联系客服', rb.text.slice(0, 120))
    check('中性文案不含「拉黑」字样', !/拉黑|黑名单|封禁/.test(rb.text))
    const rbMain = await postOrder(M.host, tok(blocked, M), { productId: w.products.auto, quantity: 1 })
    check('渠道设的拉黑在主站不生效（T14）', rbMain.json?.success === true, rbMain.text.slice(0, 120))
    // SUSPENDED
    await prisma.tenant.update({ where: { id: L.id }, data: { status: 'SUSPENDED' } })
    const rs = await postOrder(L.host, tok(b, L), { productId: w.products.auto, quantity: 1 })
    check('SUSPENDED → 403「本店暂停营业」', rs.status === 403 && /暂停营业/.test(rs.json?.error || ''), rs.text.slice(0, 120))
    // TERMINATED
    await prisma.tenant.update({ where: { id: L.id }, data: { status: 'TERMINATED' } })
    const rt = await postOrder(L.host, tok(b, L), { productId: w.products.auto, quantity: 1 })
    check('TERMINATED → 403', rt.status === 403, rt.text.slice(0, 120))
    // DRAFT：非预览 404、预览账号放行
    await prisma.tenant.update({ where: { id: L.id }, data: { status: 'DRAFT', previewUserIds: [] } })
    const rd = await postOrder(L.host, tok(b, L), { productId: w.products.auto, quantity: 1 })
    check('DRAFT 非预览账号 → 404', rd.status === 404, rd.text.slice(0, 120))
    const after = await orderCount()
    check('以上拒绝全部零写入（主站那一单除外）', after - before === 1, `${before} → ${after}`)
    await prisma.tenant.update({ where: { id: L.id }, data: { previewUserIds: [b.id] } })
    const rp = await postOrder(L.host, tok(b, L), { productId: w.products.auto, quantity: 1 })
    check('DRAFT 预览账号可下单', rp.json?.success === true, rp.text.slice(0, 160))
    await prisma.tenant.update({ where: { id: L.id }, data: { status: 'ACTIVE', previewUserIds: Prisma.DbNull } })
  }

  // =====================================================================
  section('W2-4 渠道站营销硬关：券 400、ref 忽略、未知字段丢弃')
  {
    const b = await freshBuyer()
    const r1 = await postOrder(L.host, tok(b, L), { productId: w.products.auto, quantity: 1, couponGrantId: 12345 })
    check('带 couponGrantId → 400「本站不支持优惠券」', r1.status === 400 && r1.json?.error === '本站不支持优惠券', r1.text.slice(0, 120))
    const referrer = await mkUser('w2-referrer')
    await prisma.user.update({ where: { id: referrer.id }, data: { referralCode: `ITR${RUN}`.slice(0, 20) } })
    await prisma.referralPrice.create({ data: { userId: referrer.id, productId: w.products.auto, price: new Prisma.Decimal('125.00') } })
    const r2 = await postOrder(L.host, tok(b, L), { productId: w.products.auto, quantity: 1, ref: `ITR${RUN}`.slice(0, 20) })
    const o2 = await orderByNo(r2.json.data.order.orderNo)
    check('带 ref → 订单无推荐人、按本店售价', o2.referrerId === null && o2.referralReward === null && o2.amount.toFixed(2) === '140.00')
    const r3 = await postOrder(L.host, tok(b, L), { productId: w.products.auto, quantity: 1, payMethod: 'BALANCE', balance: 999, tenantId: 1, supplyCents: 1, amount: 0.01 })
    const o3 = await orderByNo(r3.json.data.order.orderNo)
    check('未知字段（payMethod:BALANCE、tenantId、supplyCents、amount）被忽略，订单正常', o3.tenantId === L.id && o3.supplyCents === 11037 && o3.amount.toFixed(2) === '140.00' && o3.payMethod === null)
  }

  // =====================================================================
  section('W2-5 设计 T11：同一买家两站互不可见；lulu 会话调主站订单的买家接口 → 404')
  {
    const cb = w.users.crossBuyer
    const lt = tok(cb, L)
    const mt = tok(cb, M)
    const gl = await getOrders(L.host, lt)
    const gm = await getOrders(M.host, mt)
    const lNos = (gl.json?.data?.list || []).map((o: Json) => o.orderNo)
    const mNos = (gm.json?.data?.list || []).map((o: Json) => o.orderNo)
    check('lulu 列表只有 lulu 的单', lNos.length === 1 && lNos[0] === w.orders.crossLulu.orderNo, lNos.join(','))
    check('主站列表只有主站的单', mNos.length === 1 && mNos[0] === w.orders.crossMain.orderNo, mNos.join(','))
    check('lulu 计数口径只算本店', gl.json?.data?.counts?.all === 1)
    const listKeys = collectKeys(gl.json).map((k) => k.key)
    check('订单列表响应不含前台禁用键', !listKeys.some((k) => FRONT_FORBIDDEN_KEYS.includes(k)), listKeys.filter((k) => FRONT_FORBIDDEN_KEYS.includes(k)).join(','))

    await prisma.orderMessage.create({ data: { orderId: w.orders.crossMain.id, sender: 'ADMIN', content: 'itest 主站客服', readByBuyer: false } })
    const ul = await callRoute(R(unreadRoute.GET), { host: L.host, token: lt, path: '/api/account/unread' })
    const um = await callRoute(R(unreadRoute.GET), { host: M.host, token: mt, path: '/api/account/unread' })
    check('未读数：lulu 0、主站 1', ul.json?.data?.messages === 0 && um.json?.data?.messages === 1, `${ul.text} / ${um.text}`)

    const ol = await callRoute(R(overviewRoute.GET), { host: L.host, token: lt, path: '/api/account/overview' })
    const om = await callRoute(R(overviewRoute.GET), { host: M.host, token: mt, path: '/api/account/overview' })
    const olKeys = collectKeys(ol.json?.data).map((k) => k.key)
    check('渠道概览只有本店统计（1 单 / 140）', ol.json?.data?.stats?.paidOrderCount === 1 && ol.json?.data?.stats?.totalSpent === 140, ol.text)
    check('渠道概览不含 balance / vip / availableCoupons / referral', !olKeys.some((k) => ['balance', 'vip', 'availableCoupons', 'referral'].includes(k)), olKeys.join(','))
    check('主站概览形状不变（balance、vip、availableCoupons）且只算主站（1 单 / 129）', om.json?.data?.vip != null && typeof om.json?.data?.balance === 'number' && typeof om.json?.data?.stats?.availableCoupons === 'number' && om.json?.data?.stats?.paidOrderCount === 1 && om.json?.data?.stats?.totalSpent === 129, om.text)

    const mid = String(w.orders.crossMain.id)
    const lid = String(w.orders.crossLulu.id)
    const probes: [string, RouteFn, string, string, unknown?][] = [
      ['GET messages', R(msgRoute.GET), 'GET', 'messages'],
      ['POST messages', R(msgRoute.POST), 'POST', 'messages', { content: 'x' }],
      ['GET sms', R(smsRoute.GET), 'GET', 'sms'],
      ['POST sms/retry', R(smsRetryRoute.POST), 'POST', 'sms/retry'],
      ['POST invoice', R(invRoute.POST), 'POST', 'invoice', { title: 'X', taxNumber: '91110000ITEST0002X', email: cb.email, showAiWording: false }],
      ['POST receipt', R(rcptRoute.POST), 'POST', 'receipt', { payerTitle: 'X', showAiWording: false }],
    ]
    const msgBefore = await prisma.orderMessage.count({ where: { orderId: { in: [w.orders.crossMain.id, w.orders.crossLulu.id] } } })
    for (const [name, fn, method, sub, body] of probes) {
      const a = await callRoute(fn, { host: L.host, token: lt, method, path: `/api/orders/${mid}/${sub}`, params: { id: mid }, body })
      check(`lulu 会话 ${name}（主站订单）→ 404`, a.status === 404, `${a.status} ${a.text.slice(0, 100)}`)
      const b2 = await callRoute(fn, { host: M.host, token: mt, method, path: `/api/orders/${lid}/${sub}`, params: { id: lid }, body })
      check(`主站会话 ${name}（lulu 订单）→ 404`, b2.status === 404, `${b2.status} ${b2.text.slice(0, 100)}`)
    }
    check('跨站写接口零写入（留言）', (await prisma.orderMessage.count({ where: { orderId: { in: [w.orders.crossMain.id, w.orders.crossLulu.id] } } })) === msgBefore)
    const unpaidMain = await postOrder(M.host, mt, { productId: w.products.auto, quantity: 1 })
    const vc = await callRoute(R(vmqCreate.POST), { host: L.host, token: lt, method: 'POST', path: '/api/pay/vmq/create', body: { orderNo: unpaidMain.json.data.order.orderNo } })
    check('lulu 会话对主站订单发起收款 → 404', vc.status === 404, vc.text.slice(0, 100))
    check('且没有建收款单', (await prisma.vmqOrder.count({ where: { bizType: 'order', bizId: unpaidMain.json.data.order.id } })) === 0)
    const unpaidLulu = await postOrder(L.host, lt, { productId: w.products.auto, quantity: 1 })
    const vc2 = await callRoute(R(vmqCreate.POST), { host: M.host, token: mt, method: 'POST', path: '/api/pay/vmq/create', body: { orderNo: unpaidLulu.json.data.order.orderNo } })
    check('主站会话对 lulu 订单发起收款 → 404', vc2.status === 404, vc2.text.slice(0, 100))

    // 税费支付：主站订单背后的待付发票，在 lulu 上付 → 404
    const extMain = await prisma.externalOrder.create({
      data: { startDate: new Date(), expireDate: new Date(), subscriptionType: 'itest', claudeAccount: cb.email, quote: new Prisma.Decimal('129.00'), sourceKey: `order:${w.orders.crossMain.id}`, shopOrderId: w.orders.crossMain.id, tenantId: 1 },
    })
    const ivMain = await prisma.invoice.create({
      data: { invoiceNo: `ITW2IV${RUN}`.toUpperCase().slice(0, 32), externalOrderId: extMain.id, claudeAccount: cb.email, subscriptionType: 'itest', sellingPrice: new Prisma.Decimal('129.00'), invoiceAmount: new Prisma.Decimal('136.74'), taxFee: new Prisma.Decimal('7.74'), title: 'T', status: 'AWAIT_PAY', payStatus: 'UNPAID', tenantId: 1, shopOrderId: w.orders.crossMain.id },
    })
    const ip = await callRoute(R(invoicePayRoute.POST), { host: L.host, token: lt, method: 'POST', path: `/api/invoices/${ivMain.id}/pay`, params: { id: String(ivMain.id) }, body: {} })
    check('lulu 会话支付主站发票税费 → 404', ip.status === 404, ip.text.slice(0, 100))
    const ipOk = await callRoute(R(invoicePayRoute.POST), { host: M.host, token: mt, method: 'POST', path: `/api/invoices/${ivMain.id}/pay`, params: { id: String(ivMain.id) }, body: {} })
    check('主站本人支付主站发票税费 → 200（主站路径不变）', ipOk.status === 200 && !!ipOk.json?.data?.payUrl, ipOk.text.slice(0, 160))
  }

  // =====================================================================
  section('W2-5a 跨站 ExternalOrder 开票 / 收据：一律 404、零写入')
  {
    const cb = w.users.crossBuyer
    const lt = tok(cb, L)
    const mt = tok(cb, M)
    const extMain = await prisma.externalOrder.findUniqueOrThrow({ where: { sourceKey: `order:${w.orders.crossMain.id}` } })
    const extLulu = await prisma.externalOrder.create({
      data: { startDate: new Date(), expireDate: new Date(), subscriptionType: 'itest', claudeAccount: cb.email, quote: new Prisma.Decimal('140.00'), sourceKey: `order:${w.orders.crossLulu.id}`, shopOrderId: w.orders.crossLulu.id, tenantId: L.id },
    })
    // 纯外部行（无站内订单）但挂在 lulu：渠道站不认邮箱类分支
    const extPure = await prisma.externalOrder.create({
      data: { startDate: new Date(), expireDate: new Date(), subscriptionType: 'itest', claudeAccount: cb.email, quote: new Prisma.Decimal('99.00'), sourceKey: `itw2-pure-${RUN}`, tenantId: L.id },
    })
    const extIds = [extMain.id, extLulu.id, extPure.id]
    const rc0 = await prisma.receipt.count({ where: { externalOrderId: { in: extIds } } })
    const iv0 = await prisma.invoice.count({ where: { externalOrderId: { in: extIds } } })
    const rBody = (id: number) => ({ externalOrderId: id, payerTitle: 'ITEST', showAiWording: false })
    const iBody = (id: number) => ({ externalOrderId: id, title: 'ITEST', taxNumber: '91110000ITEST0003X', email: cb.email, showAiWording: false })
    const tries: [string, string, string | null, number][] = [
      ['lulu 登录用主站 ext', L.host, lt, extMain.id],
      ['lulu 匿名用主站 ext', L.host, null, extMain.id],
      ['主站登录用 lulu ext', M.host, mt, extLulu.id],
      ['主站匿名用 lulu ext', M.host, null, extLulu.id],
      ['lulu 登录用纯外部行（邮箱分支）', L.host, lt, extPure.id],
      ['lulu 匿名用 lulu ext', L.host, null, extLulu.id],
    ]
    for (const [name, host, token, id] of tries) {
      const a = await callRoute(R(receiptsRoute.POST), { host, token, method: 'POST', path: '/api/receipts', body: rBody(id) })
      check(`POST /api/receipts：${name} → 404`, a.status === 404, `${a.status} ${a.text.slice(0, 100)}`)
      const b = await callRoute(R(invoicesRoute.POST), { host, token, method: 'POST', path: '/api/invoices', body: iBody(id) })
      check(`POST /api/invoices：${name} → 404`, b.status === 404, `${b.status} ${b.text.slice(0, 100)}`)
    }
    // 他人：lulu 另一买家用 crossBuyer 的 lulu ext
    const other = await freshBuyer()
    const ao = await callRoute(R(receiptsRoute.POST), { host: L.host, token: tok(other, L), method: 'POST', path: '/api/receipts', body: rBody(extLulu.id) })
    check('lulu 他人的 ext → 404', ao.status === 404, ao.text.slice(0, 100))
    check(
      '以上零写入（这三行上的收据、发票数不变）',
      (await prisma.receipt.count({ where: { externalOrderId: { in: extIds } } })) === rc0 &&
        (await prisma.invoice.count({ where: { externalOrderId: { in: extIds } } })) === iv0,
    )
    // 正向：本人本店
    const ok = await callRoute(R(receiptsRoute.POST), { host: L.host, token: lt, method: 'POST', path: '/api/receipts', body: rBody(extLulu.id) })
    check('lulu 本人本店订单开收据 → 200', ok.status === 200 && ok.json?.success === true, ok.text.slice(0, 160))
  }

  // =====================================================================
  section('W2-5b 买家留言：键集合白名单；渠道成员回复对买家仍是「客服」；渠道通知')
  {
    const b1 = w.users.luluBuyer1
    const oid = String(w.orders.luluAuto.id)
    await prisma.orderMessage.create({
      data: { orderId: w.orders.luluAuto.id, sender: 'ADMIN', content: 'itest 渠道回复', readByBuyer: false, senderRole: 'PARTNER', senderUserId: w.users.luluOwner.id },
    })
    const g = await callRoute(R(msgRoute.GET), { host: L.host, token: tok(b1, L), path: `/api/orders/${oid}/messages`, params: { id: oid } })
    const msgs: Json[] = g.json?.data?.messages || []
    const want = ['id', 'sender', 'content', 'createdAt', 'readByBuyer'].sort().join(',')
    check('GET 留言：每条的键恰为 { id, sender, content, createdAt, readByBuyer }', msgs.length >= 2 && msgs.every((m) => Object.keys(m).sort().join(',') === want), JSON.stringify(msgs[0]))
    const reply = msgs.find((m) => m.content === 'itest 渠道回复')
    check('渠道成员回复对买家显示 sender=ADMIN（客服）', reply?.sender === 'ADMIN')
    const p = await callRoute(R(msgRoute.POST), { host: L.host, token: tok(b1, L), method: 'POST', path: `/api/orders/${oid}/messages`, params: { id: oid }, body: { content: '卡密 SECRETW2XYZ 邮箱 w2probe@b.c' } })
    check('POST 留言：返回的 message 键集合同样是白名单', p.status === 200 && Object.keys(p.json?.data?.message || {}).sort().join(',') === want, p.text.slice(0, 160))
    const n = await prisma.tenantNotice.findFirst({ where: { tenantId: L.id, dedupeKey: `msg:${p.json.data.message.id}` } })
    check('渠道单留言 → TenantNotice(BUYER_MESSAGE, dedupeKey=msg:<id>)', n?.kind === 'BUYER_MESSAGE' && n.refKey === w.orders.luluAuto.orderNo)
    check('通知正文不含留言内容（可能含卡密 / 邮箱）', !!n && !/SECRETW2XYZ|w2probe/.test(`${n.title}${n.body}`))
    const pm = await callRoute(R(msgRoute.POST), { host: M.host, token: tok(w.users.crossBuyer, M), method: 'POST', path: `/api/orders/${w.orders.crossMain.id}/messages`, params: { id: String(w.orders.crossMain.id) }, body: { content: 'main' } })
    check('主站单留言不写渠道通知', pm.status === 200 && (await prisma.tenantNotice.count({ where: { dedupeKey: `msg:${pm.json.data.message.id}` } })) === 0)
  }

  // =====================================================================
  section('W2-5c 设计 T27：渠道 OWNER 在自己店下单 → SELF；勾开票 400；事后开票 400')
  {
    const owner = w.users.luluOwner
    const r = await postOrder(L.host, tok(owner, L), { productId: w.products.auto, quantity: 1 })
    check('OWNER 自买下单成功', r.json?.success === true, r.text.slice(0, 120))
    const o = await orderByNo(r.json.data.order.orderNo)
    check("settleExcludeReason = 'SELF'", o.settleExcludeReason === 'SELF')
    const r2 = await postOrder(L.host, tok(owner, L), {
      productId: w.products.auto,
      quantity: 1,
      invoice: { title: 'ITEST', taxNumber: '91110000ITEST0004X', email: owner.email, showAiWording: false },
    })
    check('OWNER 自买勾开票 → 400', r2.status === 400, r2.text.slice(0, 120))
    await prisma.order.update({ where: { id: o.id }, data: { payStatus: 'PAID', paidAt: new Date() } })
    const r3 = await callRoute(R(invRoute.POST), {
      host: L.host,
      token: tok(owner, L),
      method: 'POST',
      path: `/api/orders/${o.id}/invoice`,
      params: { id: String(o.id) },
      body: { title: 'ITEST', taxNumber: '91110000ITEST0005X', email: owner.email, showAiWording: false },
    })
    check('自买单事后申请开票 → 400', r3.status === 400 && /不支持开具发票/.test(r3.json?.error || ''), r3.text.slice(0, 120))
    const lst = await getOrders(L.host, tok(owner, L))
    const row = (lst.json?.data?.list || []).find((x: Json) => x.orderNo === o.orderNo)
    check('订单页 billing.canInvoice = false，且不下发 settleExcludeReason', row?.billing?.canInvoice === false && !('settleExcludeReason' in (row || {})))
  }

  // =====================================================================
  section('W2-5d SUSPENDED：已下单未付款可付；TERMINATED：我的订单、留言照常')
  {
    const b = await freshBuyer()
    const r = await postOrder(L.host, tok(b, L), { productId: w.products.auto, quantity: 1 })
    await prisma.tenant.update({ where: { id: L.id }, data: { status: 'SUSPENDED' } })
    const pay = await callRoute(R(vmqCreate.POST), { host: L.host, token: tok(b, L), method: 'POST', path: '/api/pay/vmq/create', body: { orderNo: r.json.data.order.orderNo } })
    check('SUSPENDED 时对已下单的渠道单发起收款 → 200', pay.status === 200 && !!pay.json?.data?.payUrl, pay.text.slice(0, 160))
    const vmqId = String(pay.json?.data?.orderId || '')
    const st = await callRoute(R(vmqStatus.GET), { host: L.host, path: `/api/pay/vmq/status?orderId=${vmqId}` })
    check('本店收银台状态照常返回金额', st.json?.data?.reallyPrice > 0 && st.json?.data?.redirectOrigin === undefined, st.text.slice(0, 160))
    await prisma.tenant.update({ where: { id: L.id }, data: { status: 'TERMINATED' } })
    const g = await getOrders(L.host, tok(w.users.luluBuyer1, L))
    check('TERMINATED：我的订单照常', g.status === 200 && (g.json?.data?.list || []).length >= 1)
    const m = await callRoute(R(msgRoute.GET), { host: L.host, token: tok(w.users.luluBuyer1, L), path: `/api/orders/${w.orders.luluAuto.id}/messages`, params: { id: String(w.orders.luluAuto.id) } })
    check('TERMINATED：留言照常', m.status === 200)
    const pl = await callRoute(R(productsRoute.GET), { host: L.host, path: '/api/products' })
    check('TERMINATED：商品接口返回空', Array.isArray(pl.json?.data) && pl.json.data.length === 0, pl.text.slice(0, 100))
    await prisma.tenant.update({ where: { id: L.id }, data: { status: 'ACTIVE' } })
  }

  // =====================================================================
  section('W2-5e 设计 T24：未售卡、停用卡与不存在的卡，/api/redeem/*/check 响应完全相同')
  {
    const disabledPlain = `ITEST-DISABLED-${RUN}`
    const { encryptCardContent, cardContentHash } = await import('../../src/lib/cardkey')
    await prisma.cardKey.create({
      data: { productId: w.products.auto, content: encryptCardContent(disabledPlain), contentHash: cardContentHash(disabledPlain), status: 'DISABLED', batch: `IT-${RUN}` },
    })
    const call = (cdk: string, ip: string) => {
      REDEEM_IPS.push(ip)
      return callRoute(R(redeemCheck.POST), { host: L.host, method: 'POST', path: '/api/redeem/sysa/check', params: { provider: 'sysa' }, body: { cdk }, headers: { 'x-real-ip': ip } })
    }
    const a = await call(`ITEST-UNSOLD-${RUN}`, `10.20.${RUN.length}.1`)
    const b = await call(`ITEST-NOPE-${RUN}`, `10.21.${RUN.length}.1`)
    const c = await call(disabledPlain, `10.22.${RUN.length}.1`)
    check('未售 vs 不存在：状态码相同', a.status === b.status, `${a.status} / ${b.status}`)
    check('未售 vs 不存在：响应体逐字相同', a.text === b.text, `${a.text} / ${b.text}`)
    check('停用 vs 不存在：状态码与响应体相同', c.status === b.status && c.text === b.text, c.text)
    // 同一 IP + 同一前缀的试探限频：每分钟 16 次，第 17 次 429（上线前复核由 8 放宽到 16；仍低于单 IP 每分钟 20 次）
    const ip = `10.23.${RUN.length}.9`
    const codes: number[] = []
    for (let i = 0; i < 17; i++) codes.push((await call(`ITEST-PFX-${i}-${RUN}`, ip)).status)
    check('同一 IP、同一卡密前缀连试 17 次：前 16 次放行、第 17 次 429', codes[16] === 429 && codes.slice(0, 16).every((s) => s !== 429), codes.join(','))
  }

  // =====================================================================
  section('W2-6 渠道站商品接口与页面 props 值扫描：无站长价、无进货价、无主站兄弟商品价')
  {
    const pSib = await mkProduct('88.66') // 主站在售、lulu 未上架的「兄弟商品」
    const banned = [MAIN_PRICE_MARK, '13147', '132.58', '13258', '16.37', '1637', '110.37', '11037', '107.13', '10713', '88.66', '8866', '97.31', '9731']
    const scan = (label: string, text: string) => {
      const hit = banned.filter((b) => text.includes(b))
      check(`${label}：零命中`, hit.length === 0, hit.join(','))
      check(`${label}：不含兄弟商品名`, !text.includes(pSib.name))
    }
    const l1 = await callRoute(R(productsRoute.GET), { host: L.host, path: '/api/products' })
    check('/api/products 只列本店可售（3 个上架行）', Array.isArray(l1.json?.data) && l1.json.data.length === 3, String(l1.json?.data?.length))
    check('/api/products price = 本店售价 140', l1.json?.data?.some((p: Json) => p.id === w.products.auto && Number(p.price) === 140))
    scan('/api/products', l1.text)
    const l2 = await callRoute(R(productsRoute.GET), { host: L.host, path: '/api/products?page=1&pageSize=2&ref=ANY' })
    check('/api/products 分页形状与主站相同', l2.json?.data?.total === 3 && l2.json?.data?.list?.length === 2 && l2.json?.data?.totalPages === 2)
    scan('/api/products?page', l2.text)
    const d1 = await callRoute(R(productRoute.GET), { host: L.host, path: `/api/products/${w.products.auto}?ref=ANY`, params: { id: String(w.products.auto) } })
    check('/api/products/[id] 渠道价 140', Number(d1.json?.data?.price) === 140, d1.text.slice(0, 160))
    scan('/api/products/[id]', d1.text)
    const d2 = await callRoute(R(productRoute.GET), { host: L.host, path: `/api/products/${pSib.id}`, params: { id: String(pSib.id) } })
    check('/api/products/[id] 未上架商品 → 404', d2.status === 404)
    const fk = collectKeys(l1.json).map((k) => k.key)
    check('商品接口不含前台禁用键', !fk.some((k) => FRONT_FORBIDDEN_KEYS.includes(k)), fk.filter((k) => FRONT_FORBIDDEN_KEYS.includes(k)).join(','))
    const cg = await callRoute(R(categoriesRoute.GET), { host: L.host, path: '/api/categories' })
    const cRow = (cg.json?.data || []).find((c: Json) => c.id === cat.categoryId)
    check('/api/categories：_count 按本店可售（3）', cRow?._count?.products === 3, JSON.stringify(cRow?._count))
    const mcg = await callRoute(R(categoriesRoute.GET), { host: M.host, path: '/api/categories' })
    const mRow = (mcg.json?.data || []).find((c: Json) => c.id === cat.categoryId)
    check('/api/categories：主站 _count 口径不变（全部商品）', (mRow?._count?.products ?? 0) > 3)
    const mp = await callRoute(R(productsRoute.GET), { host: M.host, path: '/api/products' })
    check('主站 /api/products 仍是站长价', mp.json?.data?.some((p: Json) => p.id === w.products.auto && Number(p.price) === Number(MAIN_PRICE_MARK)))

    // 页面：服务端组件直接调用，JSON 化元素树（含传给客户端组件的 props）后扫描
    const productsPage = (await import('../../src/app/(shop)/products/page')).default
    const detailPage = await import('../../src/app/(shop)/products/[id]/page')
    const homePage = (await import('../../src/app/(shop)/page')).default
    const listEl = await withRequest({ host: L.host }, () => productsPage())
    const listText = JSON.stringify(listEl)
    check('商品列表页 props 含本店商品', listText.includes('"price":140'))
    scan('商品列表页 RSC props', listText)
    check('商品列表页不输出 ItemList JSON-LD', !listText.includes('ItemList'))
    const detEl = await withRequest({ host: L.host }, () => detailPage.default({ params: { id: String(w.products.auto) } }))
    const detText = JSON.stringify(detEl)
    check('商品详情页 props 为本店售价', detText.includes('"price":140'))
    scan('商品详情页 RSC props（含同系列档位）', detText)
    check('商品详情页不输出 Product JSON-LD', !detText.includes('"@type":"Product"') && !detText.includes('"Offer"'))
    const meta = await withRequest({ host: L.host }, () => detailPage.generateMetadata({ params: { id: String(w.products.auto) } }))
    scan('商品详情页 metadata', JSON.stringify(meta))
    const nf = await catchNext(() => withRequest({ host: L.host }, () => detailPage.default({ params: { id: String(pSib.id) } })))
    check('渠道站打开未上架商品详情 → 404', nf.kind === 'notFound')
    const homeEl = await withRequest({ host: L.host }, () => homePage())
    const homeText = JSON.stringify(homeEl)
    scan('首页 RSC props', homeText)
    check('渠道站首页不渲染「按服务找」（链到已关闭的落地页）', !homeText.includes('/chongzhi'))
    const mainDet = JSON.stringify(await withRequest({ host: M.host }, () => detailPage.default({ params: { id: String(w.products.auto) } })))
    check('主站详情页照旧：站长价、Product JSON-LD', mainDet.includes(MAIN_PRICE_MARK) && mainDet.includes('"@type":"Product"'))
  }

  // =====================================================================
  section('W2-7 事务内读 tenant 失败：整单回滚，无半条订单、无客户关系')
  {
    const b = await freshBuyer(1)
    const before = await orderCount()
    cso.setChannelConfigFaultForTest(() => {
      throw new Error('itest 注入：读 tenant 失败')
    })
    const r = await postOrder(L.host, tok(b, L), { productId: w.products.auto, quantity: 1 })
    cso.setChannelConfigFaultForTest(null)
    check('下单失败（通用文案「创建订单失败」）', r.status === 400 && r.json?.error === '创建订单失败', `${r.status} ${r.text.slice(0, 120)}`)
    check('没有留下订单', (await orderCount()) === before)
    check('没有留下客户关系', (await prisma.tenantCustomer.count({ where: { tenantId: L.id, userId: b.id } })) === 0)
  }

  // =====================================================================
  section('W2-8 数量 > maxOrderQty、未付单达到 pendingOrderCap → 拒绝')
  {
    const b = await freshBuyer()
    await prisma.tenant.update({ where: { id: L.id }, data: { maxOrderQty: 2 } })
    const r1 = await postOrder(L.host, tok(b, L), { productId: w.products.auto, quantity: 3 })
    check('数量 3 > 上限 2 → 400', r1.status === 400 && /最多购买 2 件/.test(r1.json?.error || ''), r1.text.slice(0, 120))
    const r1b = await postOrder(L.host, tok(b, L), { productId: w.products.auto, quantity: 2 })
    check('数量 = 上限 → 成功', r1b.json?.success === true)
    await prisma.tenant.update({ where: { id: L.id }, data: { maxOrderQty: 10 } })
    const pending = await prisma.order.count({ where: { tenantId: L.id, payStatus: 'UNPAID', createdAt: { gt: new Date(Date.now() - 20 * 60_000) } } })
    await prisma.tenant.update({ where: { id: L.id }, data: { pendingOrderCap: pending } })
    const r2 = await postOrder(L.host, tok(b, L), { productId: w.products.auto, quantity: 1 })
    check(`未付单 ${pending} ≥ 上限 → 429`, r2.status === 429, r2.text.slice(0, 120))
    await prisma.tenant.update({ where: { id: L.id }, data: { pendingOrderCap: 30 } })
  }

  // =====================================================================
  section('W2-9 跨店面：收银台只给 redirectOrigin；收据页跳到所属站')
  {
    const mk = (bizId: number, bizType = 'order') =>
      prisma.vmqOrder.create({
        data: { orderId: `ITW2${RUN}${bizId}${bizType[0]}`.slice(0, 40), bizType, bizId, outTradeNo: `ITW2${bizId}`, price: new Prisma.Decimal('140.00'), reallyPrice: new Prisma.Decimal('140.01') },
      })
    const vL = await mk(w.orders.crossLulu.id)
    const vM = await mk(w.orders.crossMain.id)
    const s1 = await callRoute(R(vmqStatus.GET), { host: M.host, path: `/api/pay/vmq/status?orderId=${vL.orderId}` })
    check('主站打开 lulu 订单收银台 → 只回 redirectOrigin', s1.status === 200 && JSON.stringify(Object.keys(s1.json?.data || {})) === '["redirectOrigin"]' && s1.json.data.redirectOrigin === L.origin, s1.text)
    check('跨站响应不含金额 / 状态', !/reallyPrice|price|state/.test(s1.text))
    const s2 = await callRoute(R(vmqStatus.GET), { host: L.host, path: `/api/pay/vmq/status?orderId=${vL.orderId}` })
    check('lulu 打开自己的收银台 → 正常数据', s2.json?.data?.reallyPrice === 140.01)
    const s3 = await callRoute(R(vmqStatus.GET), { host: L.host, path: `/api/pay/vmq/status?orderId=${vM.orderId}` })
    check('lulu 打开主站收银台 → redirectOrigin=主站', s3.json?.data?.redirectOrigin === platformStorefront().origin, s3.text)
    const ivL = await prisma.invoice.findFirstOrThrow({ where: { tenantId: L.id, shopOrderId: w.orders.luluAuto.id } })
    const vI = await mk(ivL.id, 'invoice')
    const s4 = await callRoute(R(vmqStatus.GET), { host: M.host, path: `/api/pay/vmq/status?orderId=${vI.orderId}` })
    check('税费收款单同样按发票的站跳转', s4.json?.data?.redirectOrigin === L.origin, s4.text)

    const rc = await prisma.receipt.findFirstOrThrow({ where: { tenantId: L.id, shopOrderId: w.orders.luluAuto.id } })
    const token = rc.token as string
    const layout = (await import('../../src/app/receipt/[token]/layout')).default
    const jm = await catchNext(() => withRequest({ host: M.host }, () => layout({ children: null, params: { token } })))
    check('主站打开 lulu 收据 → 跳到 lulu origin', jm.kind === 'redirect' && jm.location === `${L.origin}/receipt/${encodeURIComponent(token)}`, JSON.stringify(jm))
    const jl = await catchNext(() => withRequest({ host: L.host }, () => layout({ children: null, params: { token } })))
    check('lulu 打开自己的收据 → 不跳', jl.kind === 'ok')
    const am = await callRoute(R(receiptTokenRoute.GET), { host: M.host, path: `/api/receipts/${token}`, params: { token } })
    const al = await callRoute(R(receiptTokenRoute.GET), { host: L.host, path: `/api/receipts/${token}`, params: { token } })
    check('收据接口：别的站 404、所属站 200', am.status === 404 && al.status === 200)
    check('收据接口不下发 tenantId / shopOrderId', !/tenantId|shopOrderId/.test(al.text))
  }

  // =====================================================================
  section('W2-10 createShopOrder：快照断言与订单号撞号重试（事务内 P2002 后可继续）')
  {
    const base = {
      userId: w.users.luluBuyer2.id,
      productId: w.products.auto,
      productName: 'itest',
      productPrice: 140,
      quantity: 1,
      amount: 140,
      invoiceTaxFee: null,
      invoiceInfo: null,
      remark: null,
    }
    const snap = { listingId: luluAutoListing.id, supplyUnitCents: 11037, supplyCents: 11037, feeRateBp: 150, invoiceShareRateBp: 200, settleHoldDays: 7, mainPriceCents: 13147, settleExcludeReason: null }
    const bad: [string, Parameters<typeof cso.assertShopOrderInput>[0]][] = [
      ['主站单带渠道快照', { ...base, tenantId: 1, channel: snap }],
      ['渠道单缺快照', { ...base, tenantId: L.id }],
      ['货款低于进货款', { ...base, tenantId: L.id, productPrice: 100, amount: 100, channel: snap }],
      ['手续费率越界 2001', { ...base, tenantId: L.id, channel: { ...snap, feeRateBp: 2001 } }],
      ['发票分成率越界 601', { ...base, tenantId: L.id, channel: { ...snap, invoiceShareRateBp: 601 } }],
      ['进货款 ≠ 进货价 × 件数', { ...base, tenantId: L.id, channel: { ...snap, supplyCents: 11036 } }],
      ['货款 ≠ 售价 × 件数', { ...base, tenantId: L.id, amount: 141, channel: snap }],
      ['渠道单带内推人', { ...base, tenantId: L.id, referrerId: 1, channel: snap }],
      ['渠道单带券', { ...base, tenantId: L.id, couponGrantId: 1, channel: snap }],
      ['进货价为 0', { ...base, tenantId: L.id, channel: { ...snap, supplyUnitCents: 0, supplyCents: 0 } }],
      ['渠道单 0 元', { ...base, tenantId: L.id, productPrice: 0, amount: 0, channel: snap }],
      ['主站单负金额', { ...base, tenantId: 1, amount: -1 }],
    ]
    for (const [name, input] of bad) {
      let threw = false
      try {
        cso.assertShopOrderInput(input)
      } catch (e) {
        threw = e instanceof cso.ShopOrderSnapshotError
      }
      check(`断言拒绝：${name}`, threw)
    }
    let ok = true
    try {
      cso.assertShopOrderInput({ ...base, tenantId: L.id, channel: snap })
      cso.assertShopOrderInput({ ...base, tenantId: 1 })
    } catch {
      ok = false
    }
    check('合规的主站单与渠道单通过断言', ok)
    // 休眠期主站回归：后台允许 0 元商品，改造前主站能建 amount=0 的单，断言不得收紧
    let zeroOk = true
    try {
      cso.assertShopOrderInput({ ...base, tenantId: 1, productPrice: 0, amount: 0 })
    } catch {
      zeroOk = false
    }
    check('主站 0 元单仍通过断言（与改造前一致）', zeroOk)

    const existing = w.orders.crossMain.orderNo
    const fresh = `ITW2NO${RUN}`.toUpperCase().slice(0, 32)
    const seq = [existing, fresh]
    cso.setOrderNoGenForTest(() => seq.shift() ?? `ITW2X${RUN}`.toUpperCase())
    let created: { id: number; orderNo: string } | null = null
    let after = -1
    try {
      await prisma.$transaction(async (tx) => {
        created = await cso.createShopOrder(tx, { ...base, tenantId: L.id, channel: snap })
        // 撞号那条语句失败后，同一事务里继续读写必须照常
        after = await tx.order.count({ where: { id: (created as { id: number }).id } })
      })
    } catch (e) {
      check('撞号重试不应抛错', false, String((e as Error).message).slice(0, 200))
    }
    cso.setOrderNoGenForTest(null)
    check('撞号一次后换号成功', (created as { orderNo: string } | null)?.orderNo === fresh)
    check('撞号之后事务仍可继续读写并提交', after === 1 && (await prisma.order.count({ where: { orderNo: fresh } })) === 1)
    cso.setOrderNoGenForTest(() => existing)
    let threwP2002 = false
    try {
      await prisma.$transaction((tx) => cso.createShopOrder(tx, { ...base, tenantId: 1 }))
    } catch (e) {
      threwP2002 = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
    }
    cso.setOrderNoGenForTest(null)
    check('连续撞号 3 次：抛 P2002（调用方回滚）', threwP2002)
  }

  // =====================================================================
  section('W2-1 主站定价回归：resolveUnitPrice 与改造前内推算法逐分相同')
  {
    // 改造前 api/orders/route.ts 的内推代码原样复制（对照组）
    const legacy = async (productId: number, ref: string | null, buyerId: number, quantity: number) => {
      const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } })
      const base = Number(product.price)
      let unitPrice = base
      let referrerId: number | null = null
      let referralReward: number | null = null
      if (ref) {
        const referrer = await prisma.user.findUnique({ where: { referralCode: ref }, select: { id: true, status: true } })
        if (referrer && referrer.status === 1 && referrer.id !== buyerId) {
          const rp = await prisma.referralPrice.findUnique({ where: { userId_productId: { userId: referrer.id, productId } } })
          const effBase = (await referralLib.effectiveBasePrice(referrer.id, productId)) ?? base
          const sellUnit = referralLib.referralSellUnit(rp ? Number(rp.price) : null, effBase, base)
          unitPrice = sellUnit
          referrerId = referrer.id
          const per = Math.max(0, Math.round((sellUnit - effBase) * 100) / 100)
          referralReward = (Math.round(per * 100) * quantity) / 100
        }
      }
      return { unitPrice, referrerId, referralReward, amount: Math.round(unitPrice * quantity * 100) / 100 }
    }
    const current = async (productId: number, ref: string | null, buyerId: number, quantity: number) => {
      const q = await pricing.resolveUnitPrice(platformStorefront(), productId, { ref, buyerId })
      if (!q.sellable || q.kind !== 'PLATFORM') return null
      const unitPrice = q.unitCents / 100
      return {
        unitPrice,
        referrerId: q.referral ? q.referral.referrerId : null,
        referralReward: q.referral ? (q.referral.rewardUnitCents * quantity) / 100 : null,
        amount: Math.round(unitPrice * quantity * 100) / 100,
      }
    }
    const buyer = await mkUser('w2-pricing-buyer')
    const mkRef = async (name: string, status = 1) => {
      const u = await mkUser(name)
      const code = `IT${name.slice(-6)}${RUN}`.slice(0, 20)
      await prisma.user.update({ where: { id: u.id }, data: { referralCode: code, status } })
      return { u, code }
    }
    const p1 = await mkProduct('129.90')
    const p2 = await mkProduct('0.10')
    const p3 = await mkProduct('1700.00')
    await prisma.product.update({ where: { id: p3.id }, data: { referrerBasePrice: new Prisma.Decimal('1650.00') } })
    const rA = await mkRef('refA') // 专属价高于定价
    await prisma.referralPrice.create({ data: { userId: rA.u.id, productId: p3.id, price: new Prisma.Decimal('1800.00') } })
    const rB = await mkRef('refB') // 专属价低于（覆盖后的）基础价 → 按基础价成交、返现 0
    await prisma.referrerBasePrice.create({ data: { userId: rB.u.id, productId: p1.id, price: new Prisma.Decimal('125.55') } })
    await prisma.referralPrice.create({ data: { userId: rB.u.id, productId: p1.id, price: new Prisma.Decimal('120.00') } })
    const rC = await mkRef('refC') // 没有专属价：按定价，返现 = 定价 − 基础价
    const rD = await mkRef('refD', 0) // 推广人被禁用
    await prisma.referralPrice.create({ data: { userId: rD.u.id, productId: p1.id, price: new Prisma.Decimal('100.00') } })
    await prisma.referralPrice.create({ data: { userId: rC.u.id, productId: p2.id, price: new Prisma.Decimal('0.30') } })
    const cases: [string, number, string | null, number][] = []
    for (const q of [1, 2, 3, 7, 10]) {
      cases.push(['无 ref', p1.id, null, q], ['专属价高于定价', p3.id, rA.code, q], ['专属价低于基础价', p1.id, rB.code, q], ['无专属价', p3.id, rC.code, q])
      cases.push(['推广人禁用', p1.id, rD.code, q], ['无效 ref', p1.id, 'NO-SUCH-REF', q], ['0.10 元 × 件数（浮点）', p2.id, rC.code, q], ['自己推自己', p1.id, rA.code, q])
    }
    let same = 0
    const diffs: string[] = []
    for (const [name, pid, ref, qty] of cases) {
      const buyerId = name === '自己推自己' ? rA.u.id : buyer.id
      const a = await legacy(pid, ref, buyerId, qty)
      const b = await current(pid, ref, buyerId, qty)
      if (JSON.stringify(a) === JSON.stringify(b)) same++
      else diffs.push(`${name}×${qty}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`)
    }
    check(`${cases.length} 组主站报价与旧算法逐分相同`, same === cases.length, diffs.slice(0, 3).join(' | '))
    const off = await mkProduct('10.00', 0)
    const q1 = await pricing.resolveUnitPrice(platformStorefront(), off.id, {})
    const q2 = await pricing.resolveUnitPrice(platformStorefront(), 999999999, {})
    check('主站：下架 → PRODUCT_OFF；不存在 → NOT_LISTED', !q1.sellable && q1.reason === 'PRODUCT_OFF' && !q2.sellable && q2.reason === 'NOT_LISTED')
  }

  // =====================================================================
  section('休眠期主站回归（CHANNELS_ENABLED 未设）：主站下单、渠道 Host 当主站')
  {
    setChannelsMode('dormant')
    const b = await mkUser('w2-dormant')
    const r = await postOrder(M.host, tok(b, M), { productId: w.products.auto, quantity: 1, remark: '支付方式: 支付宝' })
    check('主站下单成功', r.json?.success === true, r.text.slice(0, 160))
    const o = await orderByNo(r.json.data.order.orderNo)
    check('订单 tenant_id=1、快照列全为空（M2）', o.tenantId === 1 && o.listingId === null && o.supplyCents === null && o.feeRateBp === null && o.invoiceShareRateBp === null && o.settleHoldDays === null && o.mainPriceAtOrder === null && o.settleExcludeReason === null)
    check('按站长价成交、remark 与 buyerRemark 双写', o.amount.toFixed(2) === MAIN_PRICE_MARK && o.remark === '支付方式: 支付宝' && o.buyerRemark === '支付方式: 支付宝')
    check('响应形状不变（order / couponNote / invoiceTaxFee / payable / lotteryEligible）', JSON.stringify(Object.keys(r.json.data)) === '["order","couponNote","invoiceTaxFee","payable","lotteryEligible"]')
    check('没有客户关系行', (await prisma.tenantCustomer.count({ where: { userId: b.id } })) === 0)
    // 内推（M3）
    const ref = await mkUser('w2-dormant-ref')
    const code = `ITD${RUN}`.slice(0, 20)
    await prisma.user.update({ where: { id: ref.id }, data: { referralCode: code } })
    await prisma.referralPrice.create({ data: { userId: ref.id, productId: w.products.auto, price: new Prisma.Decimal('135.00') } })
    const rr = await postOrder(M.host, tok(b, M), { productId: w.products.auto, quantity: 2, ref: code })
    const or = await orderByNo(rr.json.data.order.orderNo)
    check('内推单：专属价成交、返现 = (135 − 131.47) × 2', or.referrerId === ref.id && or.amount.toFixed(2) === '270.00' && or.referralReward?.toFixed(2) === '7.06', `${or.amount} ${or.referralReward}`)
    // 休眠：lulu Host 就是主站
    const rl = await postOrder(L.host, tok(b, M), { productId: w.products.auto, quantity: 1 })
    const ol = await orderByNo(rl.json.data.order.orderNo)
    check('休眠时 lulu Host 下单 = 主站单（主站价、tenant 1）', ol.tenantId === 1 && ol.amount.toFixed(2) === MAIN_PRICE_MARK)
    const pl = await callRoute(R(productsRoute.GET), { host: L.host, path: '/api/products' })
    check('休眠时 lulu Host 的商品接口 = 主站', pl.json?.data?.some((p: Json) => p.id === w.products.auto && Number(p.price) === Number(MAIN_PRICE_MARK)))
    const vL = await prisma.vmqOrder.findFirstOrThrow({ where: { bizType: 'order', bizId: w.orders.crossLulu.id } })
    const st = await callRoute(R(vmqStatus.GET), { host: M.host, path: `/api/pay/vmq/status?orderId=${vL.orderId}` })
    check('休眠时收银台状态不做跨站跳转（逐字原行为）', st.json?.data?.reallyPrice === 140.01 && st.json?.data?.redirectOrigin === undefined)
    const recent = await callRoute(R(recentRoute.GET), { host: M.host, path: '/api/orders/recent' })
    check('成交滚动只含主站单', recent.status === 200 && !(recent.json?.data || []).some((x: Json) => Number(x.amount) === 140))
    setChannelsMode('observe')
  }
}

main()
  .catch((e) => {
    console.error(e)
    check('itest 未抛出异常', false, String((e as Error)?.stack || e).slice(0, 600))
  })
  .finally(async () => {
    try {
      await extraCleanup()
      await cleanupAll()
      const left = await prisma.user.count({ where: { email: { endsWith: MAIL_DOMAIN } } })
      check('清理后无测试用户残留', left === 0)
    } catch (e) {
      console.error('清理失败', e)
    }
    const s = summary()
    await prisma.$disconnect()
    process.exit(s.fail === 0 ? 0 : 1)
  })

// 让未使用的导入在类型层面保持引用（signTestToken 供手工调试）
void signTestToken
