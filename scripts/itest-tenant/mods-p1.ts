/**
 * 渠道分站二期 · P1 销量与利润集成测试（进程内，不起 Next 服务；连一次性开发库）：
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-tenant/mods-p1.ts
 *
 * 覆盖 docs/多渠道分销-二期改动.md 第 1、2 节：
 *   P1-1 渠道前台销量 = Product.sales（listStorefrontProducts / getStorefrontProduct / /api/products / /api/products/[id]），主站不变
 *   P1-2 渠道单付款后 Product.sales 与 TenantListing.sales 都 +qty，前台随之变
 *   P1-3 首页「累计销量」：渠道首页与主站首页同一个合计（全站在售商品 Product.sales 之和），不是只加本店上架的
 *   P1-4 渠道后台商品页：sales = 本店销量、globalSales = 全站销量，键都在白名单里
 *   P2-1 channel-profit 纯函数：无退款 / 渠道分担退款 + LOSS / 站长承担退款 / 成员自买 / 人工 / 接码 / 未录入成本 / 未发卡 / 缺快照
 *   P2-2 进货净额 P 与账本 remainingByComponent().PURCHASE 逐分一致（随机 2000 组）
 *   P2-3 后台订单列表：渠道单 channelProfit、REFUNDED 单也算、未付单 null；主站单 channelProfit=null、cardProfit 口径不变；
 *        汇总拆分 channelAmount / channelSupplyNet / channelProfit / channelProfitUnknown，筛主站时渠道拆分为 0
 *   P2-4 后台订单详情：渠道单 ownerProfit 与列表同值、costRefYuan 不变；主站单 channel=null；未付渠道单 ownerProfit=null
 *
 * 【测试数据】租户名 ITEST-TENANT-p1*、用户 @itest-tenant.local、商品 ITEST-TENANT 前缀、订单号 IP1 前缀；
 * 结束时**只删本脚本建的行**（二期多包并行跑 itest，不调 cleanupAll，免得误删别的包的夹具）。
 */
for (const k of ['ALIYUN_ACCESS_KEY_ID', 'ALIYUN_ACCESS_KEY_SECRET', 'DM_ACCOUNT', 'DM_NOREPLY', 'ALIYUN_DM_ACCOUNT', 'ALIYUN_DM_NOREPLY', 'WECOM_WEBHOOK_URL', 'ORDER_MSG_WEBHOOK_URL']) {
  delete process.env[k]
}

import { Prisma } from '@prisma/client'
import { prisma, check, section, summary, setChannelsMode, createUser, ensurePlatformTenant, signTestToken, callRoute, withRequest, NAME_PREFIX, RUN, type RouteFn, type WorldTenant, type WorldUser } from './_harness'

// React.cache 只在 Next 自带的 React 里有（服务端组件用）；tsx 直接跑时补一个直通实现，页面模块才能加载（与 wp2 同法）
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ReactMod = require('react') as { cache?: unknown }
if (typeof ReactMod.cache !== 'function') ReactMod.cache = <F>(fn: F): F => fn
// tsx 按经典 JSX 运行时编译 .tsx（React.createElement），页面模块里没有 import React，补一个全局
;(globalThis as { React?: unknown }).React = ReactMod

type Json = any // eslint-disable-line @typescript-eslint/no-explicit-any
const R = (fn: unknown) => fn as RouteFn
const MAIN_HOST = 'bigolab.com'

// 本脚本建的行（结束时逐类删除）
const made = { tenants: [] as number[], users: [] as number[], products: [] as number[], orders: [] as number[], categoryId: 0 }

let oSeq = 0
async function mkOrder(a: {
  tenantId: number
  user: WorldUser
  productId: number
  listingId?: number | null
  qty?: number
  retail?: number
  supplyUnit?: number | null
  pay?: 'UNPAID' | 'PAID' | 'REFUNDED'
  extra?: Partial<Prisma.OrderUncheckedCreateInput>
}): Promise<{ id: number; orderNo: string }> {
  oSeq++
  const qty = a.qty ?? 1
  const retail = a.retail ?? 14000
  const channel = a.tenantId !== 1
  const pay = a.pay ?? 'UNPAID'
  const o = await prisma.order.create({
    data: {
      orderNo: `IP1${RUN.toUpperCase()}${String(oSeq).padStart(3, '0')}`.slice(0, 32),
      userId: a.user.id,
      productId: a.productId,
      productName: `${NAME_PREFIX} P1 商品 ${oSeq}`,
      productPrice: new Prisma.Decimal((retail / 100).toFixed(2)),
      quantity: qty,
      amount: new Prisma.Decimal(((retail * qty) / 100).toFixed(2)),
      tenantId: a.tenantId,
      payStatus: pay,
      payMethod: pay === 'UNPAID' ? null : 'ALIPAY',
      paidAt: pay === 'UNPAID' ? null : new Date(),
      ...(channel
        ? {
            listingId: a.listingId ?? null,
            supplyUnitPrice: a.supplyUnit === null ? null : new Prisma.Decimal(((a.supplyUnit ?? 11000) / 100).toFixed(2)),
            supplyCents: a.supplyUnit === null ? null : (a.supplyUnit ?? 11000) * qty,
            feeRateBp: 150,
            invoiceShareRateBp: 200,
            settleHoldDays: 7,
            mainPriceAtOrder: new Prisma.Decimal('129.00'),
          }
        : {}),
      ...(a.extra ?? {}),
    },
    select: { id: true, orderNo: true },
  })
  made.orders.push(o.id)
  return o
}

async function main() {
  setChannelsMode('observe')
  const pricing = await import('../../src/lib/pricing')
  const landing = await import('../../src/lib/landing/products')
  const catalog = await import('../../src/lib/partner-services/catalog')
  const selects = await import('../../src/lib/partner-services/selects')
  const cp = await import('../../src/lib/admin/channel-profit')
  const ledger = await import('../../src/lib/tenant/ledger')
  const resolve = await import('../../src/lib/storefront/resolve')
  const vmq = await import('../../src/lib/vmq')
  const notice = await import('../../src/lib/tenant/notice')
  const cardkey = await import('../../src/lib/cardkey')
  const productsRoute = await import('../../src/app/api/products/route')
  const productRoute = await import('../../src/app/api/products/[id]/route')
  const ordersRoute = await import('../../src/app/api/admin/orders/route')
  const detailRoute = await import('../../src/app/api/admin/orders/[id]/detail/route')
  const homePage = (await import('../../src/app/(shop)/page')).default
  notice.setTenantNoticeTransportForTest(async () => true)

  let cardSeq = 0
  const addCard = async (productId: number, cost: string | null, orderId?: number, sold?: { soldPrice: string; profit: string | null }) => {
    cardSeq++
    const plain = `ITEST-P1-CARD-${RUN}-${cardSeq}`
    await prisma.cardKey.create({
      data: {
        productId,
        content: cardkey.encryptCardContent(plain),
        contentHash: cardkey.cardContentHash(plain),
        status: orderId ? 'USED' : 'UNUSED',
        cost: cost == null ? null : new Prisma.Decimal(cost),
        batch: `IT-P1-${RUN}`,
        ...(orderId ? { orderId, usedAt: new Date(), soldPrice: sold ? new Prisma.Decimal(sold.soldPrice) : null, profit: sold?.profit == null ? null : new Prisma.Decimal(sold.profit) } : {}),
      },
    })
  }

  try {
    await ensurePlatformTenant()
    // ------------------------------------------------------------------ 夹具
    made.categoryId = (await prisma.category.create({ data: { name: `${NAME_PREFIX}-P1-${RUN}`, sortOrder: 999 } })).id
    const mkProduct = async (name: string, deliveryType: 'AUTO' | 'MANUAL' | 'SMS', sales: number) => {
      const p = await prisma.product.create({
        data: { categoryId: made.categoryId, name: `${NAME_PREFIX} P1${name} ${RUN}`, price: new Prisma.Decimal('129.00'), deliveryType, stock: -1, status: 1, sales },
      })
      made.products.push(p.id)
      return p.id
    }
    const PA = await mkProduct('卡密', 'AUTO', 1000)
    const PM = await mkProduct('人工', 'MANUAL', 7)
    const PS = await mkProduct('接码', 'SMS', 0)
    const code = `itp1${RUN}`.slice(0, 20)
    const t = await prisma.tenant.create({
      data: { code, kind: 'CHANNEL', name: `${NAME_PREFIX}-p1`, status: 'ACTIVE', origin: `https://${code}.bigolab.com`, holdDays: 7, minPayoutCents: 2000 },
    })
    made.tenants.push(t.id)
    await prisma.tenantDomain.create({ data: { tenantId: t.id, host: `${code}.bigolab.com`, isPrimary: true, status: 1 } })
    const T: WorldTenant = { id: t.id, code, host: `${code}.bigolab.com`, origin: `https://${code}.bigolab.com` }
    let lp = 0
    const mkListing = async (productId: number, sales: number) => {
      lp++
      const l = await prisma.tenantListing.create({
        data: {
          publicNo: `P1${RUN.toUpperCase()}${String(lp).padStart(4, '0')}`.replace(/[ILOU]/g, 'X').slice(0, 16),
          tenantId: t.id,
          productId,
          granted: true,
          supplyCents: 11000,
          retailCents: 14000,
          status: 1,
          sales,
        },
        select: { id: true },
      })
      return l.id
    }
    const lA = await mkListing(PA, 5)
    const lM = await mkListing(PM, 0)
    const lS = await mkListing(PS, 0)
    const buyer = await createUser('p1-buyer', { registeredTenantId: t.id })
    const admin = await createUser('p1-sa', { role: 'ADMIN' })
    made.users.push(buyer.id, admin.id)
    await prisma.tenantCustomer.create({ data: { publicNo: `P1C${RUN.toUpperCase()}`.replace(/[ILOU]/g, 'X').slice(0, 12), tenantId: t.id, userId: buyer.id, joinedVia: 'ORDER' } })
    resolve.invalidateStorefrontCache()
    const sf = await resolve.storefrontById(t.id)
    if (!sf) throw new Error('渠道店面解析失败')
    const platform = resolve.platformStorefront()

    // =======================================================================
    section('P1-1 渠道前台销量 = 全站 Product.sales')
    {
      const list = await pricing.listStorefrontProducts(sf)
      const a = list.find((p) => p.id === PA)
      check('listStorefrontProducts：渠道卡片 sales = Product.sales（1000），不是本店 5', a?.sales === 1000, `sales=${a?.sales}`)
      const d = await pricing.getStorefrontProduct(sf, PA)
      check('getStorefrontProduct：渠道详情 sales = Product.sales', d?.sales === 1000, `sales=${d?.sales}`)
      const pm = (await pricing.listStorefrontProducts(platform)).find((p) => p.id === PA)
      check('主站卡片 sales 仍是 Product.sales（不变）', pm?.sales === 1000)
      check('渠道卡片售价仍是本店售价 140（只改了销量）', a?.price === 140 && a?.priceCents === 14000)
      const r = await callRoute(R(productsRoute.GET), { host: T.host, path: '/api/products' })
      const row = (r.json?.data ?? []).find((p: Json) => p.id === PA)
      check('渠道 /api/products 的 sales = Product.sales', r.status === 200 && row?.sales === 1000, `status=${r.status} sales=${row?.sales}`)
      const r2 = await callRoute(R(productRoute.GET), { host: T.host, path: `/api/products/${PA}`, params: { id: String(PA) } })
      check('渠道 /api/products/[id] 的 sales = Product.sales', r2.status === 200 && r2.json?.data?.sales === 1000, `status=${r2.status} sales=${r2.json?.data?.sales}`)
      const keys = Object.keys(a ?? {}).sort().join(',')
      check('渠道卡片键不变（不因改销量多出进货价等字段）', keys === Object.keys(pm ?? {}).sort().join(','), keys)
    }

    // =======================================================================
    section('P1-2 渠道单付款：Product.sales 与 TenantListing.sales 都 +qty')
    const OA = await mkOrder({ tenantId: t.id, user: buyer, productId: PA, listingId: lA, qty: 2 })
    {
      await addCard(PA, '107.13')
      await addCard(PA, '107.13')
      const won = await vmq.fulfillOrder(OA.id)
      check('渠道单付款成功', won === true)
      const p = await prisma.product.findUniqueOrThrow({ where: { id: PA }, select: { sales: true } })
      const l = await prisma.tenantListing.findUniqueOrThrow({ where: { id: lA }, select: { sales: true } })
      check('Product.sales +2（1000 → 1002）', p.sales === 1002, `sales=${p.sales}`)
      check('TenantListing.sales +2（5 → 7）', l.sales === 7, `sales=${l.sales}`)
      const again = await vmq.fulfillOrder(OA.id)
      const p2 = await prisma.product.findUniqueOrThrow({ where: { id: PA }, select: { sales: true } })
      check('重复回调不重复累加（CAS 输家）', again === false && p2.sales === 1002)
      const r = await callRoute(R(productsRoute.GET), { host: T.host, path: '/api/products' })
      check('渠道 /api/products 随之显示 1002', (r.json?.data ?? []).find((x: Json) => x.id === PA)?.sales === 1002)
    }

    // =======================================================================
    section('P1-3 首页累计销量：两站同一个合计')
    {
      const total = await landing.getPlatformTotalSales()
      const n = await prisma.product.count({ where: { status: 1 } })
      if (n <= 200) {
        const agg = await prisma.product.aggregate({ where: { status: 1 }, _sum: { sales: true } })
        check('getPlatformTotalSales = 全站在售商品 Product.sales 之和', total === (agg._sum.sales ?? 0), `${total} vs ${agg._sum.sales}`)
      } else {
        console.log(`  · 在售商品 ${n} 个 > 200，跳过与 aggregate 的比对（首页快照 take 200）`)
      }
      const findStats = (node: unknown): { totalSales: number; skuCount: number } | null => {
        if (!node || typeof node !== 'object') return null
        if (Array.isArray(node)) {
          for (const x of node) {
            const s = findStats(x)
            if (s) return s
          }
          return null
        }
        const el = node as { props?: { stats?: { totalSales: number; skuCount: number }; children?: unknown } }
        if (el.props?.stats && typeof el.props.stats.totalSales === 'number') return el.props.stats
        return findStats(el.props?.children)
      }
      const chEl = await withRequest({ host: T.host }, () => homePage())
      const mainEl = await withRequest({ host: MAIN_HOST }, () => homePage())
      const chStats = findStats(chEl)
      const mainStats = findStats(mainEl)
      check('渠道首页 totalSales = 主站首页 totalSales', !!chStats && !!mainStats && chStats.totalSales === mainStats.totalSales, `${chStats?.totalSales} vs ${mainStats?.totalSales}`)
      check('渠道首页 totalSales = getPlatformTotalSales（不是只加本店 3 个商品）', chStats?.totalSales === total)
      check('渠道首页 skuCount 仍是本店可售商品数（3）', chStats?.skuCount === 3, `sku=${chStats?.skuCount}`)
      const chLanding = await withRequest({ host: T.host }, () => landing.getLandingProducts())
      check('渠道 getLandingProducts 的 sales = Product.sales（商品详情「同系列」等用）', chLanding.find((p) => p.id === PA)?.sales === 1002)
    }

    // =======================================================================
    section('P1-4 渠道后台商品页：本店销量 + 全站销量')
    {
      const rows = await catalog.partnerCatalog(t.id)
      const a = rows.find((r) => r.productId === PA)
      check('sales = 本店销量 TenantListing.sales（7）', a?.sales === 7)
      check('globalSales = 全站销量 Product.sales（1002）', a?.globalSales === 1002)
      check('PartnerListingDTO 的键都在白名单里', !!a && Object.keys(a).every((k) => selects.PARTNER_ALLOWED_KEYS.has(k)), Object.keys(a ?? {}).filter((k) => !selects.PARTNER_ALLOWED_KEYS.has(k)).join(','))
      check('人工商品 globalSales = 7', rows.find((r) => r.productId === PM)?.globalSales === 7)
    }

    // =======================================================================
    section('P2-1 channel-profit 纯函数')
    {
      const base = { amountCents: 14000, supplyCents: 11000, settleState: 'ACCRUED', refundedGoodsCents: null, settleRefundedCents: null, settleLossCents: null }
      const p0 = cp.channelProfit(base, { cardCosts: ['107.13'], deliveryType: 'AUTO', expectQty: 1 })
      check('无退款：G = 进货价 11000、利润 = 11000 − 10713 = 287', p0?.supplyNetCents === 11000 && p0.ownerGoodsCents === 11000 && p0.costCents === 10713 && p0.profitCents === 287 && !p0.costUnknown)
      const p1 = cp.channelProfit({ ...base, refundedGoodsCents: 7000, settleRefundedCents: 7000, settleLossCents: 500 }, { cardCosts: [new Prisma.Decimal('107.13')], deliveryType: 'AUTO', expectQty: 1 })
      check('渠道分担退一半 + LOSS 5 元：P = 5500、G = 6000、利润 = 6000 − 10713', p1?.supplyNetCents === 5500 && p1.lossCents === 500 && p1.platformRefundCents === 0 && p1.ownerGoodsCents === 6000 && p1.profitCents === 6000 - 10713)
      const p2 = cp.channelProfit({ ...base, refundedGoodsCents: 7000, settleRefundedCents: 0 }, { cardCosts: ['107.13'], deliveryType: 'AUTO', expectQty: 1 })
      check('站长承担退 70 元：P = 11000、G = 11000 − 7000 = 4000', p2?.supplyNetCents === 11000 && p2.platformRefundCents === 7000 && p2.ownerGoodsCents === 4000 && p2.profitCents === 4000 - 10713)
      const p3 = cp.channelProfit({ ...base, refundedGoodsCents: 14000, settleRefundedCents: 14000, settleState: 'REVERSED' }, { cardCosts: ['107.13'], deliveryType: 'AUTO', expectQty: 0 })
      check('渠道分担全额退：P = 0、利润 = −成本', p3?.supplyNetCents === 0 && p3.profitCents === -10713)
      const p4 = cp.channelProfit({ ...base, settleState: 'EXCLUDED' }, { cardCosts: ['107.13'], deliveryType: 'AUTO', expectQty: 1 })
      check('成员自买（EXCLUDED）：站长全收 G = A = 14000', p4?.supplyNetCents === 14000 && p4.ownerGoodsCents === 14000 && p4.profitCents === 14000 - 10713)
      const p5 = cp.channelProfit({ ...base, settleState: 'EXCLUDED', refundedGoodsCents: 4000, settleRefundedCents: 0, settleLossCents: 300 }, { cardCosts: ['107.13'], deliveryType: 'AUTO', expectQty: 1 })
      check('EXCLUDED + 站长承担退 40 元：G = 14000 − 4000 = 10000（不重复扣、不加 LOSS）', p5?.ownerGoodsCents === 10000 && p5.lossCents === 0 && p5.platformRefundCents === 0)
      // 终审：成员自买的 P 是站长全收，悬停文案不能说成「扣除渠道分担的退款后的进货净额」
      check(
        'EXCLUDED 标记 excluded=true、提示写「站长全收」不写「进货净额」；普通单 excluded=false',
        p4?.excluded === true && p5?.excluded === true && !!p5 && cp.channelProfitHint(p5).includes('站长全收 ¥100.00') && !cp.channelProfitHint(p5).includes('进货净额 ¥') && p0?.excluded === false,
      )
      const p6 = cp.channelProfit(base, { cardCosts: [], deliveryType: 'MANUAL', expectQty: 1 })
      check('人工交付：成本 null → 利润 null，进货净额照给', p6?.costCents === null && p6.profitCents === null && p6.supplyNetCents === 11000 && p6.pendingCards === 0)
      check('人工交付的提示写「成本未登记」', !!p6 && cp.channelProfitHint(p6).includes('成本未登记'))
      const p7 = cp.channelProfit(base, { cardCosts: [], smsCost: new Prisma.Decimal('3.17'), deliveryType: 'SMS', expectQty: 1 })
      check('接码：成本 = SmsActivation.cost 317、利润 = 10683', p7?.costCents === 317 && p7.costSource === 'SMS' && p7.profitCents === 10683)
      const p8 = cp.channelProfit(base, { cardCosts: [], smsCost: null, deliveryType: 'SMS', expectQty: 1 })
      check('接码没回成本：利润 null', p8?.costCents === null && p8.profitCents === null)
      const p9 = cp.channelProfit({ ...base, amountCents: 28000, supplyCents: 22000 }, { cardCosts: ['107.13', null], deliveryType: 'AUTO', expectQty: 2 })
      check('有卡 cost 为 null：按 0 计、标 costUnknown、提示「部分卡密成本未录入」', p9?.costCents === 10713 && p9.costUnknown && cp.channelProfitHint(p9).includes('部分卡密成本未录入'))
      const p10 = cp.channelProfit({ ...base, amountCents: 28000, supplyCents: 22000 }, { cardCosts: ['107.13'], deliveryType: 'AUTO', expectQty: 2 })
      check('2 件只发了 1 张卡：pendingCards = 1，成本只含已发的卡', p10?.pendingCards === 1 && p10.costCents === 10713 && cp.channelProfitHint(p10).includes('未发卡'))
      const p11 = cp.channelProfit(base, { cardCosts: [], deliveryType: 'AUTO', expectQty: 1 })
      check('自动发货但一张卡都没发（待补发）：成本 null，不当成 0', p11?.costCents === null && p11.profitCents === null && p11.pendingCards === 1)
      check('缺进货快照（supplyCents=null）→ null，不编数', cp.channelProfit({ ...base, supplyCents: null }, { cardCosts: [] }) === null)
      check('金额 0 → null（不除以 0）', cp.channelProfit({ ...base, amountCents: 0 }, { cardCosts: [] }) === null)
      const p12 = cp.channelProfit({ ...base, amountCents: 28000, supplyCents: 22000, refundedGoodsCents: 14000, settleRefundedCents: 14000 }, { cardCosts: ['107.13', '107.13'], deliveryType: 'AUTO', expectQty: 1 })
      check('2 件按件退 1 件（渠道分担）：P = 剩余 1 件 × 进货价 = 11000；已发的 2 张卡成本照计', p12?.supplyNetCents === 11000 && p12.costCents === 21426)
      // 审查意见：AUTO 单没发卡就全额退了，成本确定是 0，不能当「未登记」把站长承担的退款亏损藏掉
      const p13 = cp.channelProfit({ ...base, amountCents: 10000, supplyCents: 8000, refundedGoodsCents: 10000, settleRefundedCents: 0 }, { cardCosts: [], deliveryType: 'AUTO', expectQty: 0 })
      check('AUTO 未发卡、站长承担全额退：C = 0、利润 = G = −2000', p13?.costCents === 0 && p13.ownerGoodsCents === -2000 && p13.profitCents === -2000 && p13.pendingCards === 0)
      const p14 = cp.channelProfit({ ...base, amountCents: 10000, supplyCents: 8000, refundedGoodsCents: 10000, settleRefundedCents: 0 }, { cardCosts: [], deliveryType: 'AUTO', expectQty: 1 })
      check('同上但 refundedQty 没回填（expectQty 仍 = 1）：按货款全退归零，利润 = −2000、不提示「尚未发卡」', p14?.costCents === 0 && p14.profitCents === -2000 && p14.pendingCards === 0 && !cp.channelProfitHint(p14).includes('未发卡'))
      const p15 = cp.channelProfit({ ...base, refundedGoodsCents: 14000, settleRefundedCents: 14000 }, { cardCosts: [], deliveryType: 'MANUAL', expectQty: 0 })
      check('人工单全额退：成本仍未登记（人工交付的成本本来就没数据）', p15?.costCents === null && p15.profitCents === null)
      const p16 = cp.channelProfit(base, { cardCosts: [], deliveryType: 'AUTO' })
      check('AUTO 没传 expectQty：不猜，仍按未登记', p16?.costCents === null && p16.profitCents === null)
      check('提示第一行写明口径「进货净额（扣除退款）− 成本」', !!p0 && cp.channelProfitHint(p0).startsWith('渠道单利润 = 进货净额（扣除退款）− 成本'))
    }

    // =======================================================================
    section('P2-2 进货净额 P 与账本 PURCHASE 逐分一致')
    {
      let bad = 0
      let seed = 20260926
      const rnd = (n: number) => {
        seed = (seed * 1103515245 + 12345) % 2147483648
        return seed % n
      }
      for (let i = 0; i < 2000; i++) {
        const A = 1 + rnd(500000)
        const S = rnd(A + 1)
        const RG = rnd(A + 1)
        const Rg = rnd(RG + 1)
        const L = rnd(S + 1)
        const mine = cp.channelGoods({ amountCents: A, supplyCents: S, settleState: 'ACCRUED', refundedGoodsCents: RG, settleRefundedCents: Rg, settleLossCents: L })
        const led = ledger.remainingByComponent({
          amountCents: A,
          supplyCents: S,
          feeRateBp: 150,
          invoiceShareRateBp: 200,
          settleRefundedCents: Rg,
          shortChargedCents: 0,
          settleLossCents: L,
          inv: null,
          settleReversed: false,
          invReversed: false,
        })
        if (!mine || mine.supplyNetCents !== led.PURCHASE || mine.lossCents !== led.LOSS || mine.ownerGoodsCents !== led.PURCHASE + led.LOSS - (RG - Rg)) bad++
      }
      check('2000 组随机输入：P = PURCHASE、L = LOSS、G = P + L − (RG − Rg)', bad === 0, `不一致 ${bad} 组`)
    }

    // =======================================================================
    section('P2-3 后台订单列表：渠道单利润列与汇总拆分')
    // 渠道单：OA（fulfillOrder 付款，2 件、2 张卡）已有；再造退款、人工、接码、未付、成员自买
    const OR = await mkOrder({ tenantId: t.id, user: buyer, productId: PA, listingId: lA, pay: 'REFUNDED', extra: { refundedGoodsCents: 7000, settleRefundedCents: 7000, settleLossCents: 500, refundedQty: 0, settleState: 'ACCRUED' } })
    await addCard(PA, '107.13', OR.id, { soldPrice: '110.00', profit: '2.87' })
    const OM = await mkOrder({ tenantId: t.id, user: buyer, productId: PM, listingId: lM, pay: 'PAID' })
    const OS = await mkOrder({ tenantId: t.id, user: buyer, productId: PS, listingId: lS, pay: 'PAID' })
    await prisma.smsActivation.create({ data: { orderId: OS.id, activationId: `it-p1-${RUN}`, phone: '+10000000000', service: 'ot', country: 'us', status: 'CODE', cost: new Prisma.Decimal('3.17'), expireAt: new Date(Date.now() + 600_000) } })
    const OU = await mkOrder({ tenantId: t.id, user: buyer, productId: PA, listingId: lA, pay: 'UNPAID' })
    const OX = await mkOrder({ tenantId: t.id, user: buyer, productId: PA, listingId: lA, pay: 'PAID', extra: { settleState: 'EXCLUDED', settleExcludeReason: 'SELF', refundedGoodsCents: 4000, settleRefundedCents: 0 } })
    await addCard(PA, '107.13', OX.id, { soldPrice: '110.00', profit: '2.87' })
    // 主站单：卡上落库的 soldPrice / profit（口径不变）
    const O1 = await mkOrder({ tenantId: 1, user: buyer, productId: PA, retail: 12900, pay: 'PAID' })
    await addCard(PA, '100.00', O1.id, { soldPrice: '129.00', profit: '29.00' })

    const expect: Record<number, { P: number; G: number; C: number | null; profit: number | null }> = {
      [OA.id]: { P: 22000, G: 22000, C: 21426, profit: 574 },
      [OR.id]: { P: 5500, G: 6000, C: 10713, profit: 6000 - 10713 },
      [OM.id]: { P: 11000, G: 11000, C: null, profit: null },
      [OS.id]: { P: 11000, G: 11000, C: 317, profit: 10683 },
      [OX.id]: { P: 10000, G: 10000, C: 10713, profit: 10000 - 10713 },
    }
    const sa = { host: MAIN_HOST, token: signTestToken(admin) }
    const list = async (q: Record<string, string | number>) =>
      callRoute(R(ordersRoute.GET), { ...sa, path: `/api/admin/orders?${new URLSearchParams(Object.entries(q).map(([k, v]) => [k, String(v)])).toString()}`, headers: { 'cf-connecting-ip': '10.9.1.1' } })
    {
      const r = await list({ tenantId: t.id, pageSize: 100 })
      check('列表 200', r.status === 200, `status=${r.status} ${r.text.slice(0, 200)}`)
      const rows: Json[] = r.json?.data?.list ?? []
      const by = new Map(rows.map((x) => [x.id, x]))
      let ok = true
      const why: string[] = []
      for (const [id, e] of Object.entries(expect)) {
        const cpv = by.get(Number(id))?.channelProfit
        if (!cpv || cpv.supplyNetCents !== e.P || cpv.ownerGoodsCents !== e.G || cpv.costCents !== e.C || cpv.profitCents !== e.profit) {
          ok = false
          why.push(`${id}:${JSON.stringify(cpv)}`)
        }
      }
      check('渠道单 channelProfit 逐单符合口径（已付 / 已退款 / 人工 / 接码 / 成员自买）', ok, why.join(' | '))
      check('已退款（REFUNDED）渠道单也有利润（不再是 —）', by.get(OR.id)?.channelProfit?.profitCents === 6000 - 10713)
      check('未付渠道单 channelProfit = null', by.has(OU.id) && by.get(OU.id).channelProfit === null)
      const T0 = r.json?.data?.totals ?? {}
      const paidLike = [OA, OR, OM, OS, OX].map((o) => expect[o.id])
      const sumP = paidLike.reduce((n, e) => n + e.P, 0)
      const sumC = paidLike.reduce((n, e) => n + (e.C ?? 0), 0)
      const sumProfit = paidLike.reduce((n, e) => n + (e.profit ?? 0), 0)
      const amt = (28000 + 14000 * 5) / 100
      check('汇总：channelOrders = 6（含未付）', T0.channelOrders === 6, `${T0.channelOrders}`)
      check('汇总：channelAmount = 渠道售价之和 = amount（筛的是本渠道）', T0.channelAmount === amt && T0.amount === amt, `${T0.channelAmount} / ${T0.amount}`)
      check('汇总：channelSupplyNet = Σ 进货净额', T0.channelSupplyNet === sumP / 100, `${T0.channelSupplyNet} vs ${sumP / 100}`)
      check('汇总：channelProfit = Σ 已知利润、channelProfitUnknown = 1（人工单）', T0.channelProfit === sumProfit / 100 && T0.channelProfitUnknown === 1, `${T0.channelProfit} vs ${sumProfit / 100}, unknown=${T0.channelProfitUnknown}`)
      check('汇总：只筛渠道时 cost / profit 合计 = 渠道拆分（不再按卡上的 profit）', T0.cost === sumC / 100 && T0.profit === sumProfit / 100, `${T0.cost}/${T0.profit}`)
    }
    {
      const r = await list({ tenantId: 1, keyword: O1.orderNo })
      const row = (r.json?.data?.list ?? [])[0]
      check('主站单：channelProfit = null，cardCost / cardProfit 口径不变（100 / 29）', !!row && row.channelProfit === null && row.cardCost === 100 && row.cardProfit === 29, JSON.stringify({ cc: row?.cardCost, cp: row?.cardProfit }))
      const T1 = r.json?.data?.totals ?? {}
      check('筛主站：渠道拆分全为 0，cost / profit 与改动前同口径', T1.channelOrders === 0 && T1.channelAmount === 0 && T1.channelSupplyNet === 0 && T1.channelProfit === 0 && T1.cost === 100 && T1.profit === 29, JSON.stringify(T1))
    }
    {
      const r = await list({ keyword: `IP1${RUN.toUpperCase()}`, pageSize: 100 })
      const T2 = r.json?.data?.totals ?? {}
      const sumProfit = Object.values(expect).reduce((n, e) => n + (e.profit ?? 0), 0)
      check('不筛来源站：profit 合计 = 主站卡密 29 + 渠道公式', T2.profit === Math.round(2900 + sumProfit) / 100 && T2.channelOrders === 6, `${T2.profit} vs ${(2900 + sumProfit) / 100}`)
    }

    // =======================================================================
    section('P2-4 后台订单详情：渠道结算区的站长利润')
    {
      const det = async (id: number) => callRoute(R(detailRoute.GET), { ...sa, path: `/api/admin/orders/${id}/detail`, params: { id: String(id) } })
      const dR = await det(OR.id)
      const op = dR.json?.data?.channel?.ownerProfit
      check('详情 200、ownerProfit 与列表同值', dR.status === 200 && op?.profitCents === 6000 - 10713 && op?.supplyNetCents === 5500 && op?.lossCents === 500, JSON.stringify(op))
      check('详情带悬停文案、手续费 / 发票利润两项参考值', typeof op?.hint === 'string' && op.hint.includes('进货净额') && typeof op?.feeIncomeCents === 'number' && typeof op?.invoiceProfitCents === 'number')
      check('退款弹窗的 costRefYuan 不变（AUTO 单 = Σ 卡 cost）', dR.json?.data?.channel?.refundContext?.costRefYuan === 107.13)
      const dA = await det(OA.id)
      const opA = dA.json?.data?.channel?.ownerProfit
      check('付款单：利润 574；已计提单的手续费收入 = 账本 FEE（28000 × 1.5% = 420）', opA?.profitCents === 574 && opA?.feeIncomeCents === 420, JSON.stringify({ p: opA?.profitCents, f: opA?.feeIncomeCents }))
      const dM = await det(OM.id)
      check('人工单：ownerProfit.profitCents = null（成本未登记）', dM.json?.data?.channel?.ownerProfit?.profitCents === null && dM.json?.data?.channel?.ownerProfit?.supplyNetCents === 11000)
      const dU = await det(OU.id)
      check('未付渠道单：ownerProfit = null', dU.status === 200 && dU.json?.data?.channel?.ownerProfit === null)
      const d1 = await det(O1.id)
      check('主站单：channel = null（详情不变）', d1.status === 200 && d1.json?.data?.channel === null)
      const chan = await callRoute(R(detailRoute.GET), { host: T.host, token: signTestToken(admin, code, t.id), path: `/api/admin/orders/${OR.id}/detail`, params: { id: String(OR.id) } })
      check('渠道 Host 上访问详情 → 不是 200（成本只给超管）', chan.status !== 200, `status=${chan.status}`)
    }
  } catch (e) {
    console.error(e)
    check('未捕获异常', false, String((e as Error)?.stack || e))
  } finally {
    await notice.waitTenantNoticePushesForTest().catch(() => undefined)
    await cleanup()
  }
}

/** 只删本脚本建的行（顺序：先子表后父表） */
async function cleanup(): Promise<void> {
  const tIds = made.tenants
  const oIds = (await prisma.order.findMany({ where: { OR: [{ id: { in: made.orders } }, { tenantId: { in: tIds } }, { productId: { in: made.products } }] }, select: { id: true } })).map((o) => o.id)
  const cIds = (await prisma.cardKey.findMany({ where: { productId: { in: made.products } }, select: { id: true } })).map((c) => c.id)
  const sIds = (await prisma.tenantStatement.findMany({ where: { tenantId: { in: tIds } }, select: { id: true } })).map((s) => s.id)
  const steps: [string, () => Promise<unknown>][] = [
    ['audit', () => prisma.auditEvent.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { actorUserId: { in: made.users } }] } })],
    ['notice', () => prisma.tenantNotice.deleteMany({ where: { tenantId: { in: tIds } } })],
    ['afterSale', () => prisma.tenantAfterSale.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { orderId: { in: oIds } }] } })],
    ['stmtLine', () => prisma.tenantStatementLine.deleteMany({ where: { statementId: { in: sIds } } })],
    ['payout', () => prisma.tenantPayout.deleteMany({ where: { tenantId: { in: tIds } } })],
    ['stmt', () => prisma.tenantStatement.deleteMany({ where: { id: { in: sIds } } })],
    ['ledger', () => prisma.tenantLedgerEntry.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { orderId: { in: oIds } }] } })],
    ['customer', () => prisma.tenantCustomer.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { userId: { in: made.users } }] } })],
    ['member', () => prisma.tenantMember.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { userId: { in: made.users } }] } })],
    ['listing', () => prisma.tenantListing.deleteMany({ where: { OR: [{ tenantId: { in: tIds } }, { productId: { in: made.products } }] } })],
    ['domain', () => prisma.tenantDomain.deleteMany({ where: { tenantId: { in: tIds } } })],
    ['redeem', () => prisma.redeemLog.deleteMany({ where: { cardKeyId: { in: cIds } } })],
    ['card', () => prisma.cardKey.deleteMany({ where: { id: { in: cIds } } })],
    ['sms', () => prisma.smsActivation.deleteMany({ where: { orderId: { in: oIds } } })],
    ['msg', () => prisma.orderMessage.deleteMany({ where: { orderId: { in: oIds } } })],
    ['payment', () => prisma.payment.deleteMany({ where: { orderId: { in: oIds } } })],
    ['receipt', () => prisma.receipt.deleteMany({ where: { shopOrderId: { in: oIds } } })],
    ['invoice', () => prisma.invoice.deleteMany({ where: { shopOrderId: { in: oIds } } })],
    ['extOrder', () => prisma.externalOrder.deleteMany({ where: { OR: [{ shopOrderId: { in: oIds } }, { sourceKey: { in: oIds.map((id) => `order:${id}`) } }] } })],
    ['lottery', () => prisma.lotteryEntry.deleteMany({ where: { orderId: { in: oIds } } })],
    ['order', () => prisma.order.deleteMany({ where: { id: { in: oIds } } })],
    ['product', () => prisma.product.deleteMany({ where: { id: { in: made.products } } })],
    ['category', () => (made.categoryId ? prisma.category.deleteMany({ where: { id: made.categoryId } }) : Promise.resolve())],
    ['user', () => prisma.user.deleteMany({ where: { id: { in: made.users } } })],
    ['tenant', () => prisma.tenant.deleteMany({ where: { id: { in: tIds } } })],
  ]
  for (const [name, fn] of steps) {
    try {
      await fn()
    } catch (e) {
      console.warn(`[mods-p1] 清理 ${name} 失败：`, (e as Error).message)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    check('未捕获异常', false, String((e as Error)?.stack || e))
  })
  .finally(async () => {
    const { fail } = summary()
    await prisma.$disconnect()
    process.exit(fail === 0 ? 0 : 1)
  })
