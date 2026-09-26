/**
 * WP3 集成测试（履约、账本核心与票据归属）：连开发库、进程内直接调函数，不起 Next 服务。
 *
 *   DATABASE_URL="mysql://root:123456@localhost:3306/beiguo_dev" npx tsx scripts/itest-tenant/wp3.ts
 *
 * 覆盖实施分包 6.5：W3-2（重复到账 / 到账与标付并发 / 到账与改价并发）、W3-3（计提注入异常 → MISSING，W3-3b 真实死锁 → 付款事务整体失败，
 * 同时实测「MySQL 交互式事务里单条语句失败不中止事务」）、W3-4（解冻条件）、W3-5（发票分成两条路径、补偿扫描）、
 * W3-6 / 6a / 6b / 6c（冲销、并发、少付、按件退后补发）、W3-7（结算单全流程）、W3-8（设计 10.11 ② 逐时点三个数）、
 * W3-9（篡改分录 → 对账报错并置 hold）、W3-10（票据来源站、跨站合并拒绝）、W3-11（链接 origin）、W3-12（facade 键集合）。
 * 以及主站回归：平台单经 fulfillOrder 不写任何账本、快照列为空、单卡售价口径不变。
 *
 * 【隔离】所有账本操作都带 tenantId 范围（releaseDue / runReconcile 的 tenantId 参数），不碰开发库里别的包的数据。
 * 【外部副作用】开跑前删掉企业微信 / 阿里云 / 收款相关环境变量：通知只打日志、邮件不发、收款单不建（VMQ_KEY 为空时
 * submitInvoiceForExternalOrder 在建好发票之后才抛「收款未配置」，正好只测建票字段）。
 * 【清理】测试数据用 @itest-tenant.local 邮箱、ITEST 前缀；收款单用 ITV 前缀；结束时先删本包额外产生的外部订单 / 票据 / 收款单，再 cleanupAll()。
 */
for (const k of ['VMQ_KEY', 'WECOM_WEBHOOK_URL', 'ORDER_MSG_WEBHOOK_URL', 'ALIYUN_ACCESS_KEY_ID', 'ALIYUN_ACCESS_KEY_SECRET', 'DM_ACCOUNT', 'DM_NOREPLY']) delete process.env[k]

import { randomUUID } from 'crypto'
import { Prisma } from '@prisma/client'
import { prisma, check, section, summary, cleanupAll, createUser, ensurePlatformTenant, MAIL_DOMAIN, NAME_PREFIX, RUN, collectKeys } from './_harness'
import type { WorldTenant, WorldUser } from './_harness'

type Ledger = typeof import('../../src/lib/tenant/ledger')
type Stmt = typeof import('../../src/lib/tenant/statement')
type Bal = typeof import('../../src/lib/tenant/balances')
type Rec = typeof import('../../src/lib/tenant/reconcile')
type Facade = typeof import('../../src/lib/tenant/partner-facade')
type Vmq = typeof import('../../src/lib/vmq')
type Billing = typeof import('../../src/lib/order-billing')
type OrderLink = typeof import('../../src/lib/order-link')
type BLink = typeof import('../../src/lib/tenant/billing-link')

let L: Ledger, S: Stmt, B: Bal, R: Rec, F: Facade, V: Vmq, OB: Billing, OL: OrderLink, BL: BLink
let cardkey: typeof import('../../src/lib/cardkey')
let notice: typeof import('../../src/lib/tenant/notice')
let origin: typeof import('../../src/lib/storefront/origin')
let selects: typeof import('../../src/lib/partner-services/selects')

const DAY = 86400_000
const t0 = Date.now()
const at = (days: number, extraMs = 3600_000) => new Date(t0 + days * DAY + extraMs)

// ---------------------------------------------------------------------------
// 夹具
// ---------------------------------------------------------------------------
async function mkTenant(letter: string, opt: { requirePartnerInvoice?: boolean; payee?: boolean } = {}): Promise<WorldTenant> {
  const code = `it3${letter}${RUN}`.slice(0, 20)
  const host = `${code}.bigolab.com`
  const origin = `https://${host}`
  const t = await prisma.tenant.create({
    data: {
      code,
      kind: 'CHANNEL',
      name: `${NAME_PREFIX}-w3${letter}`,
      status: 'ACTIVE',
      origin,
      holdDays: 7,
      minPayoutCents: 2000,
      requirePartnerInvoice: opt.requirePartnerInvoice ?? false,
      ...(opt.payee === false
        ? {}
        : { payeeName: 'ITEST 收款人', payeeMethod: 'ALIPAY', payeeAccountMasked: 'it***@x.com', payeeAccountEnc: 'enc', payeeChangedAt: new Date(t0 - 10 * DAY) }),
    },
  })
  await prisma.tenantDomain.create({ data: { tenantId: t.id, host, isPrimary: true, status: 1 } })
  return { id: t.id, code, host, origin }
}

let catId = 0
async function mkProduct(name: string, deliveryType: 'AUTO' | 'MANUAL', price: string): Promise<number> {
  const p = await prisma.product.create({
    data: { categoryId: catId, name: `${NAME_PREFIX} ${name} ${RUN}`, price: new Prisma.Decimal(price), deliveryType, stock: -1, status: 1 },
  })
  return p.id
}
let cardSeq = 0
async function addCards(productId: number, n: number): Promise<void> {
  for (let i = 0; i < n; i++) {
    cardSeq++
    const plain = `ITEST-W3-CARD-${RUN}-${cardSeq}`
    await prisma.cardKey.create({
      data: { productId, content: cardkey.encryptCardContent(plain), contentHash: cardkey.cardContentHash(plain), status: 'UNUSED', cost: new Prisma.Decimal('107.13'), batch: `IT-${RUN}` },
    })
  }
}
let pubSeq = 0
async function mkListing(tenantId: number, productId: number, supply: number, retail: number): Promise<number> {
  pubSeq++
  const l = await prisma.tenantListing.create({
    data: { publicNo: `W3${RUN.toUpperCase()}${String(pubSeq).padStart(4, '0')}`.replace(/[ILOU]/g, 'X').slice(0, 16), tenantId, productId, granted: true, supplyCents: supply, retailCents: retail, status: 1 },
    select: { id: true },
  })
  return l.id
}
let orderSeq = 0
interface Ord {
  id: number
  orderNo: string
}
async function mkOrder(a: {
  tenant: WorldTenant | { id: 1 }
  user: WorldUser
  productId: number
  listingId?: number
  qty?: number
  retail?: number
  supplyUnit?: number
  invoice?: boolean
  excluded?: boolean
  incomplete?: boolean
}): Promise<Ord> {
  orderSeq++
  const qty = a.qty ?? 1
  const retail = a.retail ?? 14000
  const A = retail * qty
  const channel = a.tenant.id !== 1
  const tax = a.invoice ? Math.round(A * 1.06) - A : 0
  const o = await prisma.order.create({
    data: {
      orderNo: `IW3${RUN.toUpperCase()}${String(orderSeq).padStart(3, '0')}`.slice(0, 32),
      userId: a.user.id,
      productId: a.productId,
      productName: `${NAME_PREFIX} 商品 ${orderSeq}`,
      productPrice: new Prisma.Decimal((retail / 100).toFixed(2)),
      quantity: qty,
      amount: new Prisma.Decimal((A / 100).toFixed(2)),
      tenantId: a.tenant.id,
      remark: '买家备注 itest',
      buyerRemark: '买家备注 itest',
      ...(a.invoice
        ? {
            invoiceTaxFee: new Prisma.Decimal((tax / 100).toFixed(2)),
            invoiceInfo: JSON.stringify({ title: 'ITEST 抬头', taxNumber: '91110000ITEST', email: a.user.email, showAiWording: false, taxFee: tax / 100 }),
          }
        : {}),
      ...(channel
        ? {
            listingId: a.incomplete ? null : a.listingId ?? null,
            supplyUnitPrice: new Prisma.Decimal(((a.supplyUnit ?? 11000) / 100).toFixed(2)),
            supplyCents: (a.supplyUnit ?? 11000) * qty,
            feeRateBp: 150,
            invoiceShareRateBp: 200,
            settleHoldDays: 7,
            mainPriceAtOrder: new Prisma.Decimal('129.00'),
            settleExcludeReason: a.excluded ? 'SELF' : null,
          }
        : {}),
    },
    select: { id: true, orderNo: true },
  })
  return o
}

async function ord(id: number) {
  return prisma.order.findUniqueOrThrow({ where: { id } })
}
async function compSums(orderId: number, bucket?: string): Promise<Record<string, number>> {
  const rows = await prisma.tenantLedgerEntry.groupBy({ by: ['component'], where: { orderId, ...(bucket ? { bucket } : {}) }, _sum: { amountCents: true } })
  const out: Record<string, number> = {}
  for (const r of rows) if (r._sum.amountCents) out[r.component] = r._sum.amountCents
  return out
}
async function eventLegs(eventKey: string): Promise<Record<string, number>> {
  const rows = await prisma.tenantLedgerEntry.findMany({ where: { eventKey }, select: { component: true, amountCents: true } })
  const out: Record<string, number> = {}
  for (const r of rows) out[r.component] = (out[r.component] ?? 0) + r.amountCents
  for (const k of Object.keys(out)) if (out[k] === 0) delete out[k]
  return out
}
async function revLegs(orderId: number, version?: number): Promise<Record<string, number>> {
  const rows = await prisma.tenantLedgerEntry.findMany({
    where: { orderId, type: 'REVERSE', ...(version != null ? { eventKey: `rev:${orderId}:v${version}` } : {}) },
    select: { component: true, amountCents: true },
  })
  const out: Record<string, number> = {}
  for (const r of rows) out[r.component] = (out[r.component] ?? 0) + r.amountCents
  return out
}
const same = (a: unknown, b: unknown) => JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b))
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys)
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]))
  return v
}
function eqc(name: string, got: unknown, want: unknown) {
  check(name, same(got, want), `得到 ${JSON.stringify(sortKeys(got))}，期望 ${JSON.stringify(sortKeys(want))}`)
}
async function triples(tenantId: number) {
  const b = await B.computeBalances(tenantId)
  return { avail: [b.available.balanceCents, b.available.feeCents, b.available.payoutCents], pend: [b.pending.balanceCents, b.pending.feeCents, b.pending.payoutCents], b }
}
async function moneyFails(tenantId: number, applyHold = false): Promise<string[]> {
  const r = await R.runReconcile({ tenantId, applyHold })
  return r.items.filter((i) => i.level === 'MONEY' && !i.ok).map((i) => `${i.code}[${i.samples.slice(0, 2).join(',')}]`)
}
async function alertFails(tenantId: number): Promise<string[]> {
  const r = await R.runReconcile({ tenantId })
  return r.items.filter((i) => i.level === 'ALERT' && !i.ok).map((i) => i.code)
}
async function refund(orderId: number, p: Partial<import('../../src/lib/tenant/ledger').RefundInput> & { refundGoodsCents: number }) {
  const cur = await ord(orderId)
  return prisma.$transaction((tx) =>
    L.applyRefund(tx, {
      orderId,
      refundGoodsCents: p.refundGoodsCents,
      refundTaxCents: p.refundTaxCents ?? 0,
      refundQty: p.refundQty,
      bearer: p.bearer ?? 'PROPORTIONAL',
      lossCents: p.lossCents,
      requestId: p.requestId ?? randomUUID(),
      operatorId: 1,
      expectedVersion: p.expectedVersion ?? cur.settleVersion,
      fullStatus: p.fullStatus,
      confirmTaxKept: p.confirmTaxKept,
    }),
  )
}
/** 模拟 WP4 后台「标已付」：CAS UNPAID→PAID + 同一事务写少付字段、补建 Payment、调 accrueOnPaid */
async function markPaidAdmin(orderId: number, received?: number, bearer?: 'CHANNEL' | 'PLATFORM'): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const r = await tx.order.updateMany({ where: { id: orderId, payStatus: 'UNPAID' }, data: { payStatus: 'PAID', paidAt: new Date(), payMethod: 'ALIPAY' } })
    if (r.count !== 1) return false
    const o = await tx.order.findUniqueOrThrow({ where: { id: orderId } })
    const A = Math.round(Number(o.amount) * 100)
    const T = Math.round(Number(o.invoiceTaxFee ?? 0) * 100)
    if (received != null && bearer) {
      const sf = L.shortFields({ amountCents: A, taxCents: T, supplyCents: o.supplyCents ?? 0 }, received, bearer)
      await tx.order.update({ where: { id: orderId }, data: { shortCents: sf.shortCents, shortChargedCents: sf.shortChargedCents } })
    }
    await tx.payment.create({ data: { orderId, payMethod: 'ALIPAY', amount: new Prisma.Decimal(((received ?? A + T) / 100).toFixed(2)), status: 1 } })
    await L.accrueOnPaid(tx, orderId)
    return true
  })
}
let vmqSeq = 0
/** 模拟税费收款到账：建一张 ITV 前缀的收款单，走 manualComplete → fulfillInvoice（flip + 发票分成计提） */
async function payInvoiceViaVmq(invoiceId: number): Promise<void> {
  vmqSeq++
  const iv = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } })
  const v = await prisma.vmqOrder.create({
    data: { orderId: `ITV${RUN}${vmqSeq}`, bizType: 'invoice', bizId: invoiceId, outTradeNo: iv.invoiceNo, type: 2, price: iv.taxFee ?? new Prisma.Decimal(0), reallyPrice: iv.taxFee ?? new Prisma.Decimal(0), state: 0 },
  })
  await V.manualComplete(v.id)
}
async function postHocInvoice(o: Ord): Promise<number> {
  const full = await prisma.order.findUniqueOrThrow({ where: { id: o.id }, include: { user: true } })
  const ext = await OB.ensureExternalOrderForShopOrder({ id: full.id, productName: full.productName, amount: full.amount, paidAt: full.paidAt, createdAt: full.createdAt, user: { email: full.user.email, nickname: full.user.nickname } })
  try {
    await OB.submitInvoiceForExternalOrder(ext.id, { title: 'ITEST 事后抬头', taxNumber: '91110000ITEST', email: full.user.email as string, showAiWording: false }, { userId: full.userId })
  } catch (e) {
    // VMQ_KEY 为空：发票已建好（AWAIT_PAY），收款单这一步抛「收款未配置」——预期内
    if (!String((e as Error)?.message).includes('收款未配置')) throw e
  }
  const iv = await prisma.invoice.findUniqueOrThrow({ where: { externalOrderId: ext.id } })
  return iv.id
}

/**
 * 在事务 tx 里制造一次**真实**死锁（W3-3b）。前提：tx 已持有订单 holdId 的行锁。
 * 另开一个事务 t2：先把订单 otherId 更新 40 次（拿到它的行锁，同时攒 40 条 undo 记录——InnoDB 回滚「更小」的事务，
 * 这样牺牲者必定是 tx），再去锁 holdId（被 tx 挡住）；tx 随后更新 otherId → 成环 → InnoDB 回滚 tx。
 * t2 等到锁之后自己抛错回滚，不留任何改动。返回 tx 那一句的异常（没死锁则为 null）与 t2 的 Promise（调用方 await 它收尾）。
 */
async function makeDeadlock(tx: Prisma.TransactionClient, holdId: number, otherId: number): Promise<{ err: unknown; other: Promise<unknown> }> {
  let ready!: () => void
  const readyP = new Promise<void>((r) => (ready = r))
  const other = prisma
    .$transaction(
      async (t2) => {
        for (let i = 0; i < 40; i++) await t2.order.update({ where: { id: otherId }, data: { remark: `itest-dl-${i}` } })
        ready()
        await t2.$queryRaw`SELECT id FROM orders WHERE id = ${holdId} FOR UPDATE`
        throw new Error('itest-rollback-other')
      },
      { timeout: 20000, maxWait: 10000 },
    )
    .catch((e: unknown) => e)
  await readyP
  await new Promise((r) => setTimeout(r, 150)) // 让 t2 先进入锁等待（两种先后都会成环，这里只为结果稳定）
  let err: unknown = null
  try {
    await tx.order.update({ where: { id: otherId }, data: { remark: 'itest-dl-victim' } })
  } catch (e) {
    err = e
  }
  return { err, other }
}

// ---------------------------------------------------------------------------
async function extraCleanup(): Promise<void> {
  await prisma.vmqLock.deleteMany({ where: { orderId: { startsWith: 'ITV' } } })
  await prisma.vmqOrder.deleteMany({ where: { orderId: { startsWith: 'ITV' } } })
  await prisma.invoice.deleteMany({ where: { claudeAccount: { endsWith: MAIL_DOMAIN } } })
  await prisma.receipt.deleteMany({ where: { claudeAccount: { endsWith: MAIL_DOMAIN } } })
  await prisma.externalOrder.deleteMany({ where: { claudeAccount: { endsWith: MAIL_DOMAIN } } })
  await prisma.auditEvent.deleteMany({ where: { tenantId: { in: (await prisma.tenant.findMany({ where: { name: { startsWith: 'ITEST' } }, select: { id: true } })).map((t) => t.id) } } })
}

async function main() {
  L = await import('../../src/lib/tenant/ledger')
  S = await import('../../src/lib/tenant/statement')
  B = await import('../../src/lib/tenant/balances')
  R = await import('../../src/lib/tenant/reconcile')
  F = await import('../../src/lib/tenant/partner-facade')
  V = await import('../../src/lib/vmq')
  OB = await import('../../src/lib/order-billing')
  OL = await import('../../src/lib/order-link')
  BL = await import('../../src/lib/tenant/billing-link')
  cardkey = await import('../../src/lib/cardkey')
  notice = await import('../../src/lib/tenant/notice')
  origin = await import('../../src/lib/storefront/origin')
  selects = await import('../../src/lib/partner-services/selects')
  notice.setTenantNoticeTransportForTest(async () => true)

  // 平台告警只打日志（没有 webhook）：拦截 console.warn 计数「计提异常」
  const warns: string[] = []
  const origWarn = console.warn
  console.warn = (...a: unknown[]) => {
    warns.push(a.map(String).join(' '))
    origWarn(...a)
  }

  await extraCleanup()
  await cleanupAll()
  await ensurePlatformTenant()
  catId = (await prisma.category.create({ data: { name: `${NAME_PREFIX}-W3-${RUN}`, sortOrder: 999 } })).id
  const P = await mkProduct('W3卡密', 'AUTO', '129.00')
  const P3 = await mkProduct('W3卡密少', 'AUTO', '129.00')
  const P6 = await mkProduct('W3补发', 'AUTO', '129.00')
  const M = await mkProduct('W3人工', 'MANUAL', '129.00')
  const MS = await mkProduct('W3小额人工', 'MANUAL', '15.00')
  await addCards(P, 60)
  await addCards(P3, 1)
  await addCards(P6, 1)

  const TL = await mkTenant('a')
  const TR = await mkTenant('b')
  const TS = await mkTenant('c', { requirePartnerInvoice: true, payee: false })
  const T9 = await mkTenant('d')
  const TZ = await mkTenant('e')
  const buyer = await createUser('w3-buyer')
  const buyer2 = await createUser('w3-buyer2')
  const owner = await createUser('w3-owner')
  await prisma.tenantMember.create({ data: { tenantId: TL.id, userId: owner.id, role: 'OWNER', status: 1 } })
  for (const t of [TL, TR, TS, T9, TZ]) {
    for (const u of [buyer, buyer2]) await prisma.tenantCustomer.create({ data: { publicNo: randomUUID().replace(/-/g, '').toUpperCase().replace(/[ILOU]/g, 'X').slice(0, 12), tenantId: t.id, userId: u.id, joinedVia: 'ORDER' } })
  }
  const lTL = await mkListing(TL.id, P, 11000, 14000)
  const lTL3 = await mkListing(TL.id, P3, 11000, 14000)
  const lTR = await mkListing(TR.id, P, 11000, 14000)
  const lTR6 = await mkListing(TR.id, P6, 11000, 14000)
  const lTRM = await mkListing(TR.id, M, 11000, 14000)
  const lTRS = await mkListing(TR.id, MS, 1000, 1500)
  const lTS = await mkListing(TS.id, P, 11000, 14000)
  const lTSS = await mkListing(TS.id, MS, 1000, 1500)
  const lT9 = await mkListing(T9.id, P, 11000, 14000)
  const lTZ = await mkListing(TZ.id, P, 11000, 14000)

  // =========================================================================
  section('主站回归：平台单经 fulfillOrder')
  {
    const o = await mkOrder({ tenant: { id: 1 }, user: buyer, productId: P, retail: 12900 })
    const won = await V.fulfillOrder(o.id)
    const x = await ord(o.id)
    check('平台单付款成功、已交付', won && x.payStatus === 'PAID' && x.deliveryStatus === 'DELIVERED')
    check('平台单 settleState / invShareState 为空、settleVersion 不变', x.settleState == null && x.invShareState == null && x.settleVersion === 0)
    check('平台单无任何分录', (await prisma.tenantLedgerEntry.count({ where: { orderId: o.id } })) === 0)
    const cards = await prisma.cardKey.findMany({ where: { orderId: o.id }, select: { soldPrice: true } })
    check('平台单单卡售价 = 订单金额分摊（口径不变）', cards.length === 1 && Number(cards[0].soldPrice) === 129)
    check('平台单无渠道通知', (await prisma.tenantNotice.count({ where: { refKey: o.orderNo } })) === 0)
  }

  // =========================================================================
  section('W3-8 / W3-1（落库）：设计 10.11 ② 完整周期')
  const O1 = await mkOrder({ tenant: TL, user: buyer, productId: P, listingId: lTL })
  const O2 = await mkOrder({ tenant: TL, user: buyer, productId: P, listingId: lTL, invoice: true })
  check('O1 付款', await V.fulfillOrder(O1.id))
  check('O2 付款（结账开票）', await V.fulfillOrder(O2.id))
  eqc('O1 sale 组分录', await eventLegs(`sale:${O1.id}`), { SALE: 14000, PURCHASE: -11000, FEE: -210 })
  eqc('O2 inv 组分录', await eventLegs(`inv:${O2.id}`), { INVOICE_SHARE: 280, INVOICE_FEE: -4 })
  {
    const o2 = await ord(O2.id)
    check('O2 状态 ACCRUED / ACCRUED、版本 1', o2.settleState === 'ACCRUED' && o2.invShareState === 'ACCRUED' && o2.settleVersion === 1)
    const iv = await prisma.invoice.findFirst({ where: { shopOrderId: O2.id } })
    check('W3-10 结账开票：Invoice.tenantId = 渠道、shopOrderId = 订单', !!iv && iv.tenantId === TL.id && iv.status === 'SUBMITTED' && iv.payStatus === 'PAID')
    const ext = await prisma.externalOrder.findFirst({ where: { shopOrderId: O2.id } })
    check('背书外部订单 tenantId = 渠道', !!ext && ext.tenantId === TL.id)
    const cards = await prisma.cardKey.findMany({ where: { orderId: O1.id }, select: { soldPrice: true, profit: true } })
    check('渠道单单卡售价 = 进货价分摊 110.00、利润 = 110 − 107.13', cards.length === 1 && Number(cards[0].soldPrice) === 110 && Number(cards[0].profit) === 2.87)
    const lst = await prisma.tenantListing.findUniqueOrThrow({ where: { id: lTL } })
    check('本渠道销量 +2', lst.sales === 2)
    // 二期 M1：全站销量 Product.sales 对渠道单同样按件累加（前台两站都显示它）。P 是本脚本新建的商品（sales 从 0 起），
    // 此前付过：主站回归 1 件 + O1 1 件 + O2 1 件
    const prodP = await prisma.product.findUniqueOrThrow({ where: { id: P }, select: { sales: true } })
    check('二期 M1：全站销量 Product.sales 同步累加渠道单（主站 1 + 渠道 2 = 3）', prodP.sales === 3, `sales=${prodP.sales}`)
    check('ORDER_PAID 渠道通知 1 条', (await prisma.tenantNotice.count({ where: { tenantId: TL.id, kind: 'ORDER_PAID', refKey: O1.orderNo } })) === 1)
  }
  let tr = await triples(TL.id)
  eqc('D1 可结算 0/0/0、冻结中 6280/424/5856', [tr.avail, tr.pend], [[0, 0, 0], [6280, 424, 5856]])
  const O3 = await mkOrder({ tenant: TL, user: buyer, productId: P3, listingId: lTL3, qty: 2, invoice: true })
  check('O3 付款（2 件、只有 1 张卡）', await V.fulfillOrder(O3.id))
  check('O3 PROCESSING（缺货）', (await ord(O3.id)).deliveryStatus === 'PROCESSING')
  eqc('O3 计提', { ...(await eventLegs(`sale:${O3.id}`)), ...(await eventLegs(`inv:${O3.id}`)) }, { SALE: 28000, PURCHASE: -22000, FEE: -420, INVOICE_SHARE: 560, INVOICE_FEE: -8 })
  tr = await triples(TL.id)
  eqc('D2 冻结中 12840/852/11988', tr.pend, [12840, 852, 11988])
  {
    const v = (await ord(O3.id)).settleVersion
    const r = await refund(O3.id, { refundGoodsCents: 14000, refundTaxCents: 840, refundQty: 1 })
    check('D4 按件退 O3 的 1 件', r.ok === true, JSON.stringify(r))
    eqc('D4 冲销差额（PENDING）', await revLegs(O3.id, v + 1), { SALE: -14000, PURCHASE: 11000, FEE: 210, INVOICE_SHARE: -280, INVOICE_FEE: 4 })
    const o3 = await ord(O3.id)
    check('剩余 1 件已交付 → DELIVERED、refundedQty=1', o3.deliveryStatus === 'DELIVERED' && o3.refundedQty === 1 && o3.refundedGoodsCents === 14000 && o3.settleRefundedCents === 14000)
    const view = (await B.getOrderSettlementViews(TL.id, [O3.id])).get(O3.id)!
    eqc('O3 剩余：余额 3280、手续费 214、打款 3066', [view.balanceCents, view.feeCents, view.payoutCents, view.bucket], [3280, 214, 3066, 'PENDING'])
    await prisma.order.update({ where: { id: O3.id }, data: { deliveredAt: at(3, 0) } }) // 模拟 D4 交付
    // 缺口 = 2 − 1 − 1 = 0：补发卡密不超发
    await addCards(P3, 2)
    await V.fulfillOrder(O3.id)
    check('W3-6c O3 补发不超发（仍 1 张卡）', (await prisma.cardKey.count({ where: { orderId: O3.id } })) === 1)
  }
  await prisma.invoice.updateMany({ where: { shopOrderId: O2.id }, data: { status: 'ISSUED', issuedAt: new Date() } })
  let rel = await L.releaseDue(at(7), { tenantId: TL.id })
  check('D8 解冻 O1、O2 与 O2 的发票分成', rel.released === 2 && rel.releasedInv === 1, JSON.stringify(rel))
  tr = await triples(TL.id)
  eqc('D8 可结算 6280/424/5856', tr.avail, [6280, 424, 5856])
  await prisma.invoice.updateMany({ where: { shopOrderId: O3.id }, data: { status: 'ISSUED', issuedAt: new Date() } })
  rel = await L.releaseDue(at(10), { tenantId: TL.id })
  check('D11 解冻 O3 与其发票分成', rel.released === 1 && rel.releasedInv === 1, JSON.stringify(rel))
  tr = await triples(TL.id)
  eqc('D11 可结算 9560/638/8922、冻结中归零', [tr.avail, tr.pend], [[9560, 638, 8922], [0, 0, 0]])
  check('TL 钱类对账全过（出单前）', (await moneyFails(TL.id)).length === 0, (await moneyFails(TL.id)).join(' '))
  const g1 = await S.generateStatement({ tenantId: TL.id, origin: 'SCHEDULE', periodEnd: new Date(Date.now() + 2000), actorUserId: 1, requestId: `it-${RUN}-g1` })
  check('D12 结算单 #1 出单 8922', g1.ok === true && g1.netCents === 8922, JSON.stringify(g1))
  const st1 = await prisma.tenantStatement.findUniqueOrThrow({ where: { statementNo: (g1 as { statementNo: string }).statementNo } })
  eqc('#1 成分', [st1.goodsCents, st1.purchaseCents, st1.invShareCents, st1.feeCents, st1.otherCents, st1.grossCents, st1.netCents], [42000, -33000, 560, -638, 0, 9560, 8922])
  tr = await triples(TL.id)
  eqc('#1 出单后可结算归零、结算中 8922', [tr.avail, tr.b.inPayoutCents], [[0, 0, 0], 8922])
  check('D12 开始打款', (await S.markPaying(st1.id, 1)) === 'OK')
  check('D13 登记打款 8922', (await S.registerPayout(st1.id, 1, { amountCents: 8922, withholdCents: 0, method: 'ALIPAY', externalTradeNo: `ITX1-${RUN}`, paidAt: new Date(), voucherType: 'SMALL_RECEIPT' })) === 'OK')
  tr = await triples(TL.id)
  eqc('累计已打款 8922、结算中 0', [tr.b.paidTotalCents, tr.b.inPayoutCents], [8922, 0])
  {
    const r = await refund(O1.id, { refundGoodsCents: 14000, refundQty: 1, fullStatus: 'REFUNDED' })
    check('D20 O1 全额退（已打款）', r.ok === true, JSON.stringify(r))
    const rl = await revLegs(O1.id)
    eqc('D20 冲销腿', rl, { SALE: -14000, PURCHASE: 11000, FEE: 210 })
    tr = await triples(TL.id)
    eqc('D20 可结算 −3000/−210/−2790、negative', [tr.avail, tr.b.negative], [[-3000, -210, -2790], true])
    const o1 = await ord(O1.id)
    check('O1 REVERSED、REFUNDED', o1.settleState === 'REVERSED' && o1.payStatus === 'REFUNDED')
  }
  const O4 = await mkOrder({ tenant: TL, user: buyer, productId: P, listingId: lTL, qty: 2 })
  check('D20 O4 付款即交付', await V.fulfillOrder(O4.id))
  tr = await triples(TL.id)
  eqc('D20 冻结中 6000/420/5580', tr.pend, [6000, 420, 5580])
  rel = await L.releaseDue(at(7), { tenantId: TL.id })
  check('D27 解冻 O4', rel.released === 1, JSON.stringify(rel))
  tr = await triples(TL.id)
  eqc('D27 可结算 3000/210/2790', tr.avail, [3000, 210, 2790])
  const g2 = await S.generateStatement({ tenantId: TL.id, origin: 'SCHEDULE', periodEnd: new Date(Date.now() + 2000), actorUserId: 1, requestId: `it-${RUN}-g2` })
  check('D28 结算单 #2 = 2790', g2.ok === true && g2.netCents === 2790, JSON.stringify(g2))
  const st2 = await prisma.tenantStatement.findUniqueOrThrow({ where: { statementNo: (g2 as { statementNo: string }).statementNo } })
  eqc('#2 成分：货款 14000、进货款 −11000、手续费 −210、余额 3000', [st2.goodsCents, st2.purchaseCents, st2.feeCents, st2.grossCents, st2.seq], [14000, -11000, -210, 3000, 2])
  await S.markPaying(st2.id, 1)
  check('#2 登记打款', (await S.registerPayout(st2.id, 1, { amountCents: 2790, withholdCents: 0, method: 'BANK', externalTradeNo: `ITX2-${RUN}`, paidAt: new Date(), voucherType: 'SMALL_RECEIPT' })) === 'OK')
  tr = await triples(TL.id)
  check('两期共打款 11712', tr.b.paidTotalCents === 11712)
  check('W3-8 周期结束后 TL 钱类对账全过', (await moneyFails(TL.id)).length === 0, (await moneyFails(TL.id)).join(' '))
  {
    const af = await alertFails(TL.id)
    check('TL 告警类无 A1 / A4 / A11 / A12 / A13', !af.some((c) => ['A1', 'A4', 'A11', 'A12', 'A13'].includes(c)), af.join(','))
  }

  // =========================================================================
  section('W3-2 重复到账 / 到账与标付并发 / 到账与改价并发')
  {
    const o = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
    const [a, b] = await Promise.all([V.fulfillOrder(o.id), V.fulfillOrder(o.id)])
    check('两次到账推送只有一个赢家', Number(a) + Number(b) === 1)
    check('只有一组 sale（3 条分录）', (await prisma.tenantLedgerEntry.count({ where: { eventKey: `sale:${o.id}` } })) === 3)
    check('只有一条 Payment、一张卡', (await prisma.payment.count({ where: { orderId: o.id } })) === 1 && (await prisma.cardKey.count({ where: { orderId: o.id } })) === 1)
    for (let i = 0; i < 3; i++) {
      const x = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
      const [w1, w2] = await Promise.all([V.fulfillOrder(x.id), markPaidAdmin(x.id)])
      check(`到账与后台标付并发 #${i + 1}：恰好一方赢`, Number(w1) + Number(w2) === 1)
      check(`到账与后台标付并发 #${i + 1}：一组 sale`, (await prisma.tenantLedgerEntry.count({ where: { eventKey: `sale:${x.id}`, component: 'SALE' } })) === 1)
    }
    for (let i = 0; i < 3; i++) {
      const x = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
      const price = prisma.order.updateMany({
        where: { id: x.id, payStatus: 'UNPAID', settleState: null, deliveryStatus: { not: 'CANCELLED' } },
        data: { amount: new Prisma.Decimal('150.00'), productPrice: new Prisma.Decimal('150.00') },
      })
      const [pr, won] = await Promise.all([price, V.fulfillOrder(x.id)])
      const xo = await ord(x.id)
      const sale = await eventLegs(`sale:${x.id}`)
      const pay = await prisma.payment.findFirst({ where: { orderId: x.id } })
      check(`到账与改价并发 #${i + 1}：计提金额 = 最终订单金额 = 流水金额`, won && sale.SALE === Math.round(Number(xo.amount) * 100) && Number(pay?.amount) === Number(xo.amount), `price=${pr.count} amount=${xo.amount} sale=${sale.SALE}`)
      check(`到账与改价并发 #${i + 1}：付款之后改价 CAS 失败`, pr.count === 0 || Number(xo.amount) === 150)
    }
  }

  // =========================================================================
  section('W3-3 注入 accrueOnPaid 内部异常')
  let missingOrder: Ord
  {
    const o = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
    const before = warns.length
    L.setLedgerFaultForTest('accrue.sql', true)
    let won = false
    try {
      won = await V.fulfillOrder(o.id)
    } finally {
      L.setLedgerFaultForTest('accrue.sql', false)
    }
    const x = await ord(o.id)
    check('事务里一条 SQL 失败：订单仍 PAID（单条语句失败不中止事务）', won && x.payStatus === 'PAID')
    check('仍然已发卡', x.deliveryStatus === 'DELIVERED' && (await prisma.cardKey.count({ where: { orderId: o.id } })) === 1)
    check('settleState = MISSING、零分录', x.settleState === 'MISSING' && (await prisma.tenantLedgerEntry.count({ where: { orderId: o.id } })) === 0)
    check('Payment 照常写入', (await prisma.payment.count({ where: { orderId: o.id } })) === 1)
    check('平台告警 1 条', warns.slice(before).filter((w) => w.includes('计提异常') && w.includes(o.orderNo)).length === 1)
    missingOrder = o

    const o2 = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR, invoice: true })
    L.setLedgerFaultForTest('accrue.afterCas', true)
    try {
      await V.fulfillOrder(o2.id)
    } finally {
      L.setLedgerFaultForTest('accrue.afterCas', false)
    }
    const y = await ord(o2.id)
    check('CAS 之后抛 JS 异常：PAID + MISSING + invShareState 清空', y.payStatus === 'PAID' && y.settleState === 'MISSING' && y.invShareState == null)
    const rs = await L.resettleFromSnapshot(o2.id, 1)
    check('按快照补记', rs.ok === true, JSON.stringify(rs))
    eqc('补记分录 = 计提分录', { ...(await eventLegs(`sale:${o2.id}`)), ...(await eventLegs(`inv:${o2.id}`)) }, { SALE: 14000, PURCHASE: -11000, FEE: -210, INVOICE_SHARE: 280, INVOICE_FEE: -4 })
    check('补记后 ACCRUED / ACCRUED', (await ord(o2.id)).settleState === 'ACCRUED' && (await ord(o2.id)).invShareState === 'ACCRUED')
    check('重复补记拒绝', (await L.resettleFromSnapshot(o2.id, 1)).ok === false)
    const inc = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR, incomplete: true })
    await V.fulfillOrder(inc.id)
    check('快照不完整 → MISSING', (await ord(inc.id)).settleState === 'MISSING')
    check('快照不完整拒绝补记', (await L.resettleFromSnapshot(inc.id, 1)).reason === 'SNAPSHOT_INCOMPLETE')
    await prisma.order.update({ where: { id: inc.id }, data: { listingId: lTR } }) // 修好以免影响后面的对账
    await L.resettleFromSnapshot(inc.id, 1)
  }

  // =========================================================================
  section('W3-3b 付款事务里真实死锁：整个事务回滚 → 计提必须 rethrow')
  {
    // 先实测 MySQL 语义：死锁回滚的是**整个**事务，不只是那一句（审查意见 3 的前提）
    const a = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
    const c = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
    let semErr: unknown = null
    let afterWrite = 'n/a'
    let other: Promise<unknown> = Promise.resolve()
    try {
      await prisma.$transaction(
        async (tx) => {
          await tx.order.update({ where: { id: a.id }, data: { remark: 'itest-dl-first' } }) // 本事务第一次写，同时拿到 a 的行锁
          const d = await makeDeadlock(tx, a.id, c.id)
          other = d.other
          semErr = d.err
          // 死锁之后再写一句，看它落到哪里（事务已不存在时会以 autocommit 单独提交，或被 Prisma 拒绝）
          try {
            await tx.order.update({ where: { id: a.id }, data: { remark: 'itest-dl-after' } })
            afterWrite = 'executed'
          } catch (e) {
            afterWrite = `rejected(${(e as { code?: string }).code ?? 'err'})`
          }
        },
        { timeout: 20000 },
      )
    } catch {
      /* 提交阶段报错也可以：这里只看落库结果 */
    }
    await other
    check('实测：真实死锁被识别为事务级致命错误', semErr != null && L.isTxAbortingError(semErr), String((semErr as Error)?.message ?? semErr).slice(-200))
    const aRow = await ord(a.id)
    check('实测：死锁回滚了整个事务（死锁之前那次写也没了）', aRow.remark !== 'itest-dl-first', `remark=${aRow.remark} 死锁后的写：${afterWrite}`)
    console.log(`  · 死锁之后同一事务里再执行的写：${afterWrite}，落库 remark=${aRow.remark}`)
    check('实测：对方事务自己回滚，c 未被改动', (await ord(c.id)).remark === '买家备注 itest')

    // 付款赢家事务：accrueOnPaid 里撞上死锁 → rethrow → fulfillOrder 失败，订单保持待支付、零副作用
    const o = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
    const sentinel = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
    let pending: Promise<unknown> = Promise.resolve()
    L.setAccrueHookForTest(async (tx) => {
      const d = await makeDeadlock(tx, o.id, sentinel.id)
      pending = d.other
      if (d.err) throw d.err
    })
    let thrown: unknown = null
    try {
      await V.fulfillOrder(o.id)
    } catch (e) {
      thrown = e
    } finally {
      L.setAccrueHookForTest(null)
    }
    await pending
    check('死锁 → fulfillOrder 抛出（不再当作赢家继续发卡）', thrown != null && L.isTxAbortingError(thrown), String((thrown as Error)?.message ?? thrown).slice(-200))
    const x = await ord(o.id)
    check('订单仍 UNPAID、settleState 为空（没有以 autocommit 写上 MISSING）', x.payStatus === 'UNPAID' && x.settleState == null && x.settleVersion === 0, `${x.payStatus}/${x.settleState}/v${x.settleVersion}`)
    check(
      '零 Payment、零发卡、零分录',
      (await prisma.payment.count({ where: { orderId: o.id } })) === 0 &&
        (await prisma.cardKey.count({ where: { orderId: o.id } })) === 0 &&
        (await prisma.tenantLedgerEntry.count({ where: { orderId: o.id } })) === 0,
    )
    // 模拟 reconcilePaidVmq 宽限期后补做：正常付款、正常计提
    check('补做 fulfillOrder 成功', await V.fulfillOrder(o.id))
    const y = await ord(o.id)
    check('补做后 PAID + ACCRUED + 发卡 1 张', y.payStatus === 'PAID' && y.settleState === 'ACCRUED' && (await prisma.cardKey.count({ where: { orderId: o.id } })) === 1)
    eqc('补做后分录正确', await eventLegs(`sale:${o.id}`), { SALE: 14000, PURCHASE: -11000, FEE: -210 })
  }

  // =========================================================================
  section('W3-4 解冻条件')
  {
    const r1 = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
    await V.fulfillOrder(r1.id)
    await L.releaseDue(at(6), { tenantId: TR.id })
    check('交付未满期不解冻', (await ord(r1.id)).settleState === 'ACCRUED')
    const r2 = await mkOrder({ tenant: TR, user: buyer, productId: M, listingId: lTRM })
    await V.fulfillOrder(r2.id)
    const r3 = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
    await V.fulfillOrder(r3.id)
    await prisma.tenantAfterSale.create({ data: { requestNo: `AS${RUN}W3`.toUpperCase().slice(0, 24), tenantId: TR.id, orderId: r3.id, kind: 'REFUND', activeKey: `o:${r3.id}:REFUND`, reason: 'itest', status: 'PENDING' } })
    const r4 = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
    await V.fulfillOrder(r4.id)
    await prisma.order.update({ where: { id: r4.id }, data: { deliveryStatus: 'PROCESSING', deliveredAt: null } }) // 撤回交付
    await L.releaseDue(at(8), { tenantId: TR.id })
    check('满期解冻', (await ord(r1.id)).settleState === 'RELEASED')
    eqc('rel 组：每成分一对、合计 0', await eventLegs(`rel:${r1.id}`), {})
    eqc('解冻后 PENDING 归零、AVAILABLE = 计提值', [await compSums(r1.id, 'PENDING'), await compSums(r1.id, 'AVAILABLE')], [{}, { SALE: 14000, PURCHASE: -11000, FEE: -210 }])
    check('未交付不解冻', (await ord(r2.id)).settleState === 'ACCRUED')
    check('有 PENDING 退款申请不解冻', (await ord(r3.id)).settleState === 'ACCRUED')
    check('撤回交付后不解冻', (await ord(r4.id)).settleState === 'ACCRUED')
    await prisma.tenantAfterSale.updateMany({ where: { orderId: r3.id }, data: { status: 'DONE', activeKey: null } })
    await prisma.order.update({ where: { id: r4.id }, data: { deliveryStatus: 'DELIVERED', deliveredAt: at(3, 0) } }) // 重交付
    await L.releaseDue(at(8), { tenantId: TR.id })
    check('退款申请处理完后解冻', (await ord(r3.id)).settleState === 'RELEASED')
    check('重交付按新时间：D3 + 7 前不解冻', (await ord(r4.id)).settleState === 'ACCRUED')
    await L.releaseDue(at(10), { tenantId: TR.id })
    check('重交付按新时间：D10 解冻', (await ord(r4.id)).settleState === 'RELEASED')
  }

  // =========================================================================
  section('W3-5 发票分成：结账开票、事后开票、补偿扫描')
  {
    const i5 = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
    await V.fulfillOrder(i5.id)
    const inv5 = await postHocInvoice(i5)
    const iv = await prisma.invoice.findUniqueOrThrow({ where: { id: inv5 } })
    check('W3-10 事后开票：Invoice.tenantId = 渠道、shopOrderId = 订单', iv.tenantId === TR.id && iv.shopOrderId === i5.id && iv.status === 'AWAIT_PAY')
    await payInvoiceViaVmq(inv5)
    eqc('税费到账后计提分成（PENDING）', await eventLegs(`inv:${i5.id}`), { INVOICE_SHARE: 280, INVOICE_FEE: -4 })
    const o = await ord(i5.id)
    check('invShareState ACCRUED、版本 2', o.invShareState === 'ACCRUED' && o.settleVersion === 2)
    const dup = await prisma.invoice.create({
      data: { invoiceNo: `ITI${RUN}D`.toUpperCase(), claudeAccount: buyer.email, subscriptionType: 'x', sellingPrice: new Prisma.Decimal('140.00'), taxFee: new Prisma.Decimal('8.40'), invoiceAmount: new Prisma.Decimal('148.40'), status: 'SUBMITTED', payStatus: 'PAID', tenantId: TR.id, shopOrderId: i5.id },
    })
    check('同一订单第二张发票 → DUPLICATE、只计一次', (await L.accrueInvoiceShare(dup.id)) === 'DUPLICATE' && (await prisma.tenantLedgerEntry.count({ where: { eventKey: `inv:${i5.id}` } })) === 2)
    await prisma.invoice.delete({ where: { id: dup.id } })
    await L.releaseDue(at(8), { tenantId: TR.id })
    check('货款解冻、发票未开 → 分成仍冻结', (await ord(i5.id)).settleState === 'RELEASED' && (await ord(i5.id)).invShareState === 'ACCRUED')
    await prisma.invoice.update({ where: { id: inv5 }, data: { status: 'ISSUED', issuedAt: new Date() } })
    await L.releaseDue(at(8), { tenantId: TR.id })
    check('发票 ISSUED 且货款已解冻 → 分成解冻', (await ord(i5.id)).invShareState === 'RELEASED')
    eqc('分成解冻后 AVAILABLE', await compSums(i5.id, 'AVAILABLE'), { SALE: 14000, PURCHASE: -11000, FEE: -210, INVOICE_SHARE: 280, INVOICE_FEE: -4 })
    const rc = await OB.submitReceiptForExternalOrder((await prisma.invoice.findUniqueOrThrow({ where: { id: inv5 } })).externalOrderId as number, 'ITEST 收据抬头')
    const rcRow = await prisma.receipt.findFirst({ where: { token: rc.token } })
    check('W3-10 收据：tenantId = 渠道、shopOrderId = 订单、金额含税', !!rcRow && rcRow.tenantId === TR.id && rcRow.shopOrderId === i5.id && Number(rcRow.amount) === 148.4)

    // 注入：flip 成功、计提失败 → 补偿扫描补上
    const i7 = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
    await V.fulfillOrder(i7.id)
    const inv7 = await postHocInvoice(i7)
    L.setLedgerFaultForTest('accrueInv.afterCas', true)
    try {
      await payInvoiceViaVmq(inv7)
    } finally {
      L.setLedgerFaultForTest('accrueInv.afterCas', false)
    }
    check('计提失败：发票已付、分成未计提', (await prisma.invoice.findUniqueOrThrow({ where: { id: inv7 } })).payStatus === 'PAID' && (await ord(i7.id)).invShareState == null)
    check('此时对账 L11 报出', (await moneyFails(TR.id)).some((c) => c.startsWith('L11')))
    // flip 之后进程被杀（完全没调计提）
    const i8 = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
    await V.fulfillOrder(i8.id)
    const inv8 = await postHocInvoice(i8)
    await prisma.invoice.update({ where: { id: inv8 }, data: { payStatus: 'PAID', status: 'SUBMITTED', paidAt: new Date() } })
    const rr = await L.releaseDue(new Date(), { tenantId: TR.id })
    check('下一轮解冻 cron 的补偿扫描补上 2 单', rr.compensated === 2, JSON.stringify(rr))
    eqc('补偿后分录正确', [await eventLegs(`inv:${i7.id}`), await eventLegs(`inv:${i8.id}`)], [{ INVOICE_SHARE: 280, INVOICE_FEE: -4 }, { INVOICE_SHARE: 280, INVOICE_FEE: -4 }])
    check('补偿后 L11 通过', !(await moneyFails(TR.id)).some((c) => c.startsWith('L11')))

    // 票据来源站写错（Invoice.tenantId=1）且 shopOrderId 为空：到账时仍按订单归属计提（不看 Invoice.tenantId）
    const i9 = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
    await V.fulfillOrder(i9.id)
    const inv9 = await postHocInvoice(i9)
    await prisma.invoice.update({ where: { id: inv9 }, data: { tenantId: 1, shopOrderId: null } })
    await payInvoiceViaVmq(inv9)
    eqc('Invoice.tenantId 写错、shopOrderId 为空：税费到账仍计提分成', await eventLegs(`inv:${i9.id}`), { INVOICE_SHARE: 280, INVOICE_FEE: -4 })
    await prisma.invoice.update({ where: { id: inv9 }, data: { tenantId: TR.id, shopOrderId: i9.id } })
    // 补偿扫描不止认 invoices.shop_order_id：经外部订单行、只剩发票 sourceKey 快照的也要补
    const i10 = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
    await V.fulfillOrder(i10.id)
    const inv10 = await postHocInvoice(i10)
    await prisma.invoice.update({ where: { id: inv10 }, data: { shopOrderId: null, payStatus: 'PAID', status: 'SUBMITTED', paidAt: new Date() } })
    const i11 = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
    await V.fulfillOrder(i11.id)
    const inv11 = await postHocInvoice(i11)
    const iv11 = await prisma.invoice.findUniqueOrThrow({ where: { id: inv11 } })
    check('夹具：发票 sourceKey 快照 = order:<id>', iv11.sourceKey === `order:${i11.id}`, String(iv11.sourceKey))
    await prisma.invoice.update({ where: { id: inv11 }, data: { shopOrderId: null, externalOrderId: null, payStatus: 'PAID', status: 'SUBMITTED', paidAt: new Date() } })
    check('补偿前 L11 报出（直连为空的两单）', (await moneyFails(TR.id)).some((c) => c.startsWith('L11')))
    const rr2 = await L.releaseDue(new Date(), { tenantId: TR.id })
    check('补偿扫描经外部订单行 / sourceKey 快照补上 2 单', rr2.compensated === 2, JSON.stringify(rr2))
    eqc('补偿后分录正确（i10 / i11）', [await eventLegs(`inv:${i10.id}`), await eventLegs(`inv:${i11.id}`)], [{ INVOICE_SHARE: 280, INVOICE_FEE: -4 }, { INVOICE_SHARE: 280, INVOICE_FEE: -4 }])
    check('补偿后 L11 通过（i9–i11）', !(await moneyFails(TR.id)).some((c) => c.startsWith('L11')))

    // CANNOT 退税费后冲销
    const i6 = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR, invoice: true })
    await V.fulfillOrder(i6.id)
    await prisma.invoice.updateMany({ where: { shopOrderId: i6.id }, data: { status: 'CANNOT' } })
    check('A13：发票 CANNOT、分成未冲、未退税费 → 告警', (await alertFails(TR.id)).includes('A13'))
    const v6 = (await ord(i6.id)).settleVersion
    const r6 = await refund(i6.id, { refundGoodsCents: 0, refundTaxCents: 840 })
    check('只退税费 840', r6.ok === true, JSON.stringify(r6))
    eqc('只退税费冲销：分成 −280、INVOICE_FEE +4（PENDING）', await revLegs(i6.id, v6 + 1), { INVOICE_SHARE: -280, INVOICE_FEE: 4 })
    check('退税费后 A13 不再报', !(await alertFails(TR.id)).includes('A13'))
  }

  // =========================================================================
  section('W3-6 冲销（T20）')
  {
    // a 全额 PROPORTIONAL（解冻前）
    const a = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
    await V.fulfillOrder(a.id)
    const va = (await ord(a.id)).settleVersion
    const ra = await refund(a.id, { refundGoodsCents: 14000, refundQty: 1, fullStatus: 'CANCELLED' })
    check('全额 PROPORTIONAL（解冻前）', ra.ok === true && ra.settleState === 'REVERSED', JSON.stringify(ra))
    eqc('全额冲销（PENDING），该单 PENDING 归零', [await revLegs(a.id, va + 1), await compSums(a.id)], [{ SALE: -14000, PURCHASE: 11000, FEE: 210 }, {}])
    check('全额取消：deliveryStatus CANCELLED', (await ord(a.id)).deliveryStatus === 'CANCELLED')

    // b 按件两次
    const b = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR, qty: 2 })
    await V.fulfillOrder(b.id)
    check('按件第 1 次', (await refund(b.id, { refundGoodsCents: 14000, refundQty: 1 })).ok === true)
    eqc('按件 1 件后剩余', await compSums(b.id), { SALE: 14000, PURCHASE: -11000, FEE: -210 })
    const rb2 = await refund(b.id, { refundGoodsCents: 14000, refundQty: 1, fullStatus: 'REFUNDED' })
    check('按件第 2 次 → REVERSED、refundedQty 累计 2', rb2.ok === true && rb2.settleState === 'REVERSED' && (await ord(b.id)).refundedQty === 2)
    eqc('两次累计 = 一次全退（剩余全 0）', await compSums(b.id), {})

    // c 按比例让利
    const c = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
    await V.fulfillOrder(c.id)
    const vc = (await ord(c.id)).settleVersion
    check('让利 5000', (await refund(c.id, { refundGoodsCents: 5000 })).ok === true)
    eqc('让利冲销：SALE −5000、PURCHASE +3929、FEE +75', await revLegs(c.id, vc + 1), { SALE: -5000, PURCHASE: 3929, FEE: 75 })

    // d CHANNEL + loss（已发卡）
    const d = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
    await V.fulfillOrder(d.id)
    const loss = L.defaultLossCents({ supplyCents: 11000, quantity: 1, refundedQty: 0, deliveredQty: 1 }, 1, 11000)
    const vd = (await ord(d.id)).settleVersion
    check('CHANNEL loss 超过冲回的进货款 → LOSS_TOO_HIGH', (await refund(d.id, { refundGoodsCents: 14000, refundQty: 1, bearer: 'CHANNEL', lossCents: 11001, fullStatus: 'REFUNDED' })).ok === false)
    check('LOSS_TOO_HIGH 不推进版本号', (await ord(d.id)).settleVersion === vd)
    check('CHANNEL + loss 11000', (await refund(d.id, { refundGoodsCents: 14000, refundQty: 1, bearer: 'CHANNEL', lossCents: loss, fullStatus: 'REFUNDED' })).ok === true)
    eqc('CHANNEL 冲销：… + LOSS −11000', await revLegs(d.id, vd + 1), { SALE: -14000, PURCHASE: 11000, FEE: 210, LOSS: -11000 })
    check('LOSS 记在 AVAILABLE（不随货款组冻结）', (await compSums(d.id, 'AVAILABLE')).LOSS === -11000 && (await ord(d.id)).settleLossCents === 11000)

    // e 接码类（人工交付代替）CHANNEL：loss 默认 = 进货价分摊 1000
    const e = await mkOrder({ tenant: TR, user: buyer, productId: MS, listingId: lTRS, retail: 1500, supplyUnit: 1000 })
    await V.fulfillOrder(e.id)
    await prisma.order.update({ where: { id: e.id }, data: { deliveryStatus: 'DELIVERED', deliveredAt: new Date() } })
    const le = L.defaultLossCents({ supplyCents: 1000, quantity: 1, refundedQty: 0, deliveredQty: 1 }, 1, 1000)
    const ve = (await ord(e.id)).settleVersion
    check('接码类 CHANNEL 退款', (await refund(e.id, { refundGoodsCents: 1500, refundQty: 1, bearer: 'CHANNEL', lossCents: le, fullStatus: 'REFUNDED' })).ok === true)
    eqc('接码类冲销：SALE −1500、PURCHASE +1000、FEE +23、LOSS −1000', await revLegs(e.id, ve + 1), { SALE: -1500, PURCHASE: 1000, FEE: 23, LOSS: -1000 })

    // f PLATFORM 全额（未交付、无发票）→ 渠道保留、立即解冻
    const f = await mkOrder({ tenant: TR, user: buyer, productId: M, listingId: lTRM })
    await V.fulfillOrder(f.id)
    const rf = await refund(f.id, { refundGoodsCents: 14000, bearer: 'PLATFORM', fullStatus: 'REFUNDED' })
    check('PLATFORM 全额：不写冲销、立即解冻 → RELEASED', rf.ok === true && rf.settleState === 'RELEASED' && Object.keys(await revLegs(f.id)).length === 0)
    eqc('PLATFORM：渠道保留 2790（AVAILABLE）', await compSums(f.id, 'AVAILABLE'), { SALE: 14000, PURCHASE: -11000, FEE: -210 })
    check('PLATFORM：Rg 不变、RG = A', (await ord(f.id)).settleRefundedCents === 0 && (await ord(f.id)).refundedGoodsCents === 14000)

    // g PLATFORM 全额（结账开票、发票未开）→ 必须确认税费不退；发票组冲为 0；再只退税费
    const g = await mkOrder({ tenant: TR, user: buyer, productId: M, listingId: lTRM, invoice: true })
    await V.fulfillOrder(g.id)
    check('全额退货款但税费不退、未确认 → TAX_KEPT_UNCONFIRMED', (await refund(g.id, { refundGoodsCents: 14000, bearer: 'PLATFORM', fullStatus: 'REFUNDED' })).ok === false)
    const vg = (await ord(g.id)).settleVersion
    const rg = await refund(g.id, { refundGoodsCents: 14000, bearer: 'PLATFORM', fullStatus: 'REFUNDED', confirmTaxKept: true })
    check('确认后：货款组立即解冻、发票组 REVERSED', rg.ok === true && (await ord(g.id)).settleState === 'RELEASED' && (await ord(g.id)).invShareState === 'REVERSED')
    eqc('发票未开 → 发票组冲为 0', await revLegs(g.id, vg + 1), { INVOICE_SHARE: -280, INVOICE_FEE: 4 })
    const rg2 = await refund(g.id, { refundGoodsCents: 0, refundTaxCents: 840 })
    check('先全额 PLATFORM 退、再只退税费：接受（REFUNDED 仍可记）、不写分录', rg2.ok === true && rg2.entries === 0 && (await ord(g.id)).refundedTaxCents === 840)

    // i 解冻后退款
    const i = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
    await V.fulfillOrder(i.id)
    await L.releaseDue(at(8), { tenantId: TR.id })
    const vi = (await ord(i.id)).settleVersion
    check('解冻后全额退', (await refund(i.id, { refundGoodsCents: 14000, refundQty: 1, fullStatus: 'REFUNDED' })).ok === true)
    const ri = await prisma.tenantLedgerEntry.findMany({ where: { eventKey: `rev:${i.id}:v${vi + 1}` }, select: { bucket: true, amountCents: true } })
    check('解冻后冲销写 AVAILABLE、合计 −2790', ri.every((x) => x.bucket === 'AVAILABLE') && ri.reduce((s, x) => s + x.amountCents, 0) === -2790)

    // j MISSING：退款只改累计值；补记一步写剩余值
    const vj = (await ord(missingOrder.id)).settleVersion
    const rj = await refund(missingOrder.id, { refundGoodsCents: 5000, bearer: 'CHANNEL', lossCents: 3929 })
    check('MISSING 退款：只改累计值、不写分录', rj.ok === true && rj.entries === 0 && (await prisma.tenantLedgerEntry.count({ where: { orderId: missingOrder.id } })) === 0 && (await ord(missingOrder.id)).settleVersion === vj + 1)
    check('补记（已有退款累计值）', (await L.resettleFromSnapshot(missingOrder.id, 1)).ok === true)
    eqc('补记 = 先计提再冲销的结果', await compSums(missingOrder.id), { SALE: 9000, PURCHASE: -7071, FEE: -135, LOSS: -3929 })

    // k EXCLUDED
    const k = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR, excluded: true })
    await V.fulfillOrder(k.id)
    check('成员自买 → EXCLUDED、零分录', (await ord(k.id)).settleState === 'EXCLUDED' && (await prisma.tenantLedgerEntry.count({ where: { orderId: k.id } })) === 0)
    const rk = await refund(k.id, { refundGoodsCents: 3000 })
    check('EXCLUDED 退款只改累计值', rk.ok === true && rk.entries === 0 && (await ord(k.id)).refundedGoodsCents === 3000)

    // l 拒绝分支
    const l = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
    check('未付款 → NOT_PAID', (await refund(l.id, { refundGoodsCents: 100 })).ok === false && ((await refund(l.id, { refundGoodsCents: 100 })) as { reason: string }).reason === 'NOT_PAID')
    await V.fulfillOrder(l.id)
    const reason = async (p: Parameters<typeof refund>[1]) => {
      const r = await refund(l.id, p)
      return r.ok ? 'OK' : r.reason
    }
    check('超过 A → OVER_REFUND', (await reason({ refundGoodsCents: 14001 })) === 'OVER_REFUND')
    check('没有税费却退税费 → OVER_REFUND', (await reason({ refundGoodsCents: 0, refundTaxCents: 1 })) === 'OVER_REFUND')
    check('件数超过 → OVER_REFUND', (await reason({ refundGoodsCents: 100, refundQty: 2 })) === 'OVER_REFUND')
    check('fullStatus 但未退满 → NOT_FULL', (await reason({ refundGoodsCents: 100, fullStatus: 'REFUNDED' })) === 'NOT_FULL')
    check('货款税费都为 0 → EMPTY', (await reason({ refundGoodsCents: 0 })) === 'EMPTY')
    check('版本号不符 → CONFLICT', (await reason({ refundGoodsCents: 100, expectedVersion: 99 })) === 'CONFLICT')
    check('拒绝分支都不推进版本号', (await ord(l.id)).settleVersion === 1)
  }

  // =========================================================================
  section('W3-6a 并发（T28）：退款 × 解冻、退款 × 事后开票计提、两次退款')
  {
    for (let n = 0; n < 3; n++) {
      const o = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
      await V.fulfillOrder(o.id)
      const v = (await ord(o.id)).settleVersion
      const [rel2, rr] = await Promise.all([L.releaseDue(at(8), { tenantId: TR.id }), refund(o.id, { refundGoodsCents: 5000, expectedVersion: v })])
      void rel2
      let ok = rr.ok
      if (!rr.ok && rr.reason === 'CONFLICT') ok = (await refund(o.id, { refundGoodsCents: 5000 })).ok
      check(`退款 × 解冻 #${n + 1}：恰好串行（冲突方刷新后重试成功）`, ok)
      const oo = await ord(o.id)
      const pend = await compSums(o.id, 'PENDING')
      check(`退款 × 解冻 #${n + 1}：无 PENDING 负数残留`, oo.settleState !== 'RELEASED' || Object.keys(pend).length === 0, JSON.stringify(pend))
    }
    for (let n = 0; n < 3; n++) {
      const o = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
      await V.fulfillOrder(o.id)
      const inv = await postHocInvoice(o)
      await prisma.invoice.update({ where: { id: inv }, data: { payStatus: 'PAID', status: 'SUBMITTED', paidAt: new Date() } })
      const v = (await ord(o.id)).settleVersion
      const [acc, rr] = await Promise.all([L.accrueInvoiceShare(inv), refund(o.id, { refundGoodsCents: 7000, expectedVersion: v })])
      if (!rr.ok) await refund(o.id, { refundGoodsCents: 7000 })
      if (acc !== 'OK') await L.accrueInvoiceShare(inv)
      check(`退款 × 事后开票计提 #${n + 1}：两边最终都落账`, (await ord(o.id)).refundedGoodsCents === 7000 && (await ord(o.id)).invShareState === 'ACCRUED')
    }
    const o = await mkOrder({ tenant: TR, user: buyer, productId: P, listingId: lTR })
    await V.fulfillOrder(o.id)
    const v = (await ord(o.id)).settleVersion
    const both = await Promise.all([refund(o.id, { refundGoodsCents: 3000, expectedVersion: v }), refund(o.id, { refundGoodsCents: 4000, expectedVersion: v })])
    check('两次退款同版本并发：恰好一个成功', both.filter((x) => x.ok).length === 1 && both.filter((x) => !x.ok && x.reason === 'CONFLICT').length === 1)
    check('并发后 TR 的 L5 / L6 通过', !(await moneyFails(TR.id)).some((c) => c.startsWith('L5') || c.startsWith('L6')), (await moneyFails(TR.id)).join(' '))
  }

  // =========================================================================
  section('W3-6b 少付（设计 10.11 ③ 三例）')
  {
    const s1 = await mkOrder({ tenant: TR, user: buyer, productId: M, listingId: lTRM })
    check('标已付实收 13900、CHANNEL 承担', await markPaidAdmin(s1.id, 13900, 'CHANNEL'))
    eqc('计提含 SHORT −100', { ...(await eventLegs(`sale:${s1.id}`)), ...(await eventLegs(`short:${s1.id}`)) }, { SALE: 14000, PURCHASE: -11000, FEE: -210, SHORT: -100 })
    const v1 = (await B.getOrderSettlementViews(TR.id, [s1.id])).get(s1.id)!
    eqc('余额 2900、手续费 210、打款 2690', [v1.balanceCents, v1.feeCents, v1.payoutCents], [2900, 210, 2690])
    const r1 = await refund(s1.id, { refundGoodsCents: 14000, fullStatus: 'REFUNDED' })
    check('少付后全额退：退给买家现金 = 实收 13900', r1.ok === true && r1.cashRefundCents === 13900, JSON.stringify(r1))
    eqc('少付后全额退冲销：SHORT +100', await revLegs(s1.id), { SALE: -14000, PURCHASE: 11000, FEE: 210, SHORT: 100 })
    const s2 = await mkOrder({ tenant: TR, user: buyer, productId: M, listingId: lTRM, invoice: true })
    check('开票单实收 14740、PLATFORM 承担', await markPaidAdmin(s2.id, 14740, 'PLATFORM'))
    eqc('分成按实收税费：247、INVOICE_FEE −4、无 SHORT', { ...(await eventLegs(`sale:${s2.id}`)), ...(await eventLegs(`inv:${s2.id}`)) }, { SALE: 14000, PURCHASE: -11000, FEE: -210, INVOICE_SHARE: 247, INVOICE_FEE: -4 })
    const v2 = (await B.getOrderSettlementViews(TR.id, [s2.id])).get(s2.id)!
    eqc('余额 3247、手续费 214、打款 3033', [v2.balanceCents, v2.feeCents, v2.payoutCents], [3247, 214, 3033])
    const s3 = await mkOrder({ tenant: TR, user: buyer, productId: M, listingId: lTRM, invoice: true })
    check('开票单实收 14740、CHANNEL 承担', await markPaidAdmin(s3.id, 14740, 'CHANNEL'))
    eqc('渠道补足少付：SHORT −100、分成 280', { ...(await eventLegs(`short:${s3.id}`)), ...(await eventLegs(`inv:${s3.id}`)) }, { SHORT: -100, INVOICE_SHARE: 280, INVOICE_FEE: -4 })
    check('少付退款上限：累计退现金不超过实收', (await refund(s2.id, { refundGoodsCents: 14000, refundTaxCents: 840, fullStatus: 'REFUNDED' })).ok === true)
  }

  // =========================================================================
  section('W3-6c 按件部分退款后补发不超发')
  {
    const o = await mkOrder({ tenant: TR, user: buyer, productId: P6, listingId: lTR6, qty: 2 })
    await V.fulfillOrder(o.id)
    check('只发出 1 张 → PROCESSING', (await ord(o.id)).deliveryStatus === 'PROCESSING' && (await prisma.cardKey.count({ where: { orderId: o.id } })) === 1)
    check('按件退 1 件', (await refund(o.id, { refundGoodsCents: 14000, refundQty: 1 })).ok === true)
    check('剩余 1 件已交付 → DELIVERED', (await ord(o.id)).deliveryStatus === 'DELIVERED')
    await addCards(P6, 3)
    await prisma.order.update({ where: { id: o.id }, data: { deliveryStatus: 'PROCESSING' } }) // 强制走补发分支
    await V.fulfillOrder(o.id)
    check('补发缺口 = 2 − 1 − 1 = 0：不为已退的件补卡', (await prisma.cardKey.count({ where: { orderId: o.id } })) === 1 && (await ord(o.id)).deliveryStatus === 'DELIVERED')
  }

  // =========================================================================
  section('W3-7 结算单（T21）')
  {
    const gen = (origin: 'SCHEDULE' | 'REQUEST' | 'MANUAL', rid?: string, periodEnd?: Date) =>
      S.generateStatement({ tenantId: TS.id, origin, periodEnd: periodEnd ?? new Date(Date.now() + 2000), actorUserId: 1, requestId: rid ?? `it-${randomUUID().slice(0, 30)}` })
    const why = (r: Awaited<ReturnType<typeof gen>>) => (r.ok ? 'OK' : r.reason)
    check('收款信息未设置 → PAYEE_MISSING', why(await gen('SCHEDULE')) === 'PAYEE_MISSING')
    await prisma.tenant.update({ where: { id: TS.id }, data: { payeeName: 'ITEST', payeeMethod: 'ALIPAY', payeeAccountMasked: 'a***', payeeChangedAt: new Date() } })
    check('收款信息冷静期内 → PAYEE_COOLDOWN', why(await gen('SCHEDULE')) === 'PAYEE_COOLDOWN')
    await prisma.tenant.update({ where: { id: TS.id }, data: { payeeChangedAt: new Date(Date.now() - 73 * 3600_000) } })
    check('没有可结算余额 → NEGATIVE', why(await gen('MANUAL')) === 'NEGATIVE')
    await prisma.tenant.update({ where: { id: TS.id }, data: { payoutHold: true } })
    check('payoutHold → HOLD', why(await gen('MANUAL')) === 'HOLD')
    await prisma.tenant.update({ where: { id: TS.id }, data: { payoutHold: false } })

    const small = await mkOrder({ tenant: TS, user: buyer, productId: MS, listingId: lTSS, retail: 1500, supplyUnit: 1000 })
    await V.fulfillOrder(small.id)
    await prisma.order.update({ where: { id: small.id }, data: { deliveryStatus: 'DELIVERED', deliveredAt: new Date() } })
    await L.releaseDue(at(8), { tenantId: TS.id })
    check('477 < 最低 2000：SCHEDULE → BELOW_MIN', why(await gen('SCHEDULE')) === 'BELOW_MIN')
    check('477 < 最低 2000：REQUEST → BELOW_MIN', why(await gen('REQUEST')) === 'BELOW_MIN')
    const m1 = await gen('MANUAL', `it-${RUN}-m1`)
    check('MANUAL 低于最低额仍出单 477', m1.ok === true && m1.netCents === 477)
    const m1r = await gen('MANUAL', `it-${RUN}-m1`)
    check('同一 requestId 重复提交 → 同一张结算单', m1r.ok === true && m1.ok === true && m1r.statementNo === m1.statementNo)
    check('已有未完结单 → OPEN_EXISTS', why(await gen('MANUAL')) === 'OPEN_EXISTS')
    const sm1 = await prisma.tenantStatement.findUniqueOrThrow({ where: { statementNo: (m1 as { statementNo: string }).statementNo } })
    await prisma.tenant.update({ where: { id: TS.id }, data: { payoutHold: true } })
    check('出单后才置 payoutHold：认领打款 → CONFLICT、单子仍 GENERATED', (await S.markPaying(sm1.id, 1)) === 'CONFLICT' && (await prisma.tenantStatement.findUniqueOrThrow({ where: { id: sm1.id } })).state === 'GENERATED')
    await prisma.tenant.update({ where: { id: TS.id }, data: { payoutHold: false } })
    check('开始打款', (await S.markPaying(sm1.id, 1)) === 'OK')
    check('重复认领 → CONFLICT', (await S.markPaying(sm1.id, 1)) === 'CONFLICT')
    check('放弃认领（确认未转出）', (await S.cancelPaying(sm1.id, 1, true)) === 'OK')
    check('未认领直接登记打款 → CONFLICT', (await S.registerPayout(sm1.id, 1, { amountCents: 477, withholdCents: 0, method: 'ALIPAY', externalTradeNo: `ITT1-${RUN}`, paidAt: new Date(), voucherType: 'INVOICE' })) === 'CONFLICT')
    await S.markPaying(sm1.id, 1)
    check('amount + withhold ≠ net → AMOUNT_MISMATCH', (await S.registerPayout(sm1.id, 1, { amountCents: 400, withholdCents: 0, method: 'ALIPAY', externalTradeNo: `ITT1-${RUN}`, paidAt: new Date(), voucherType: 'INVOICE' })) === 'AMOUNT_MISMATCH')
    check('要求发票未填 → INVOICE_REQUIRED', (await S.registerPayout(sm1.id, 1, { amountCents: 400, withholdCents: 77, method: 'ALIPAY', externalTradeNo: `ITT1-${RUN}`, paidAt: new Date(), voucherType: 'INVOICE' })) === 'INVOICE_REQUIRED')
    await prisma.tenant.update({ where: { id: TS.id }, data: { payoutHold: true } }) // 认领之后才置 hold：钱可能已转出，登记照记
    check('登记打款（含代扣 77；认领后才置的 hold 不拦登记）', (await S.registerPayout(sm1.id, 1, { amountCents: 400, withholdCents: 77, method: 'ALIPAY', externalTradeNo: `ITT1-${RUN}`, paidAt: new Date(), voucherType: 'INVOICE', partnerInvoiceNo: 'FP001', partnerInvoiceAmountCents: 477 })) === 'OK')
    await prisma.tenant.update({ where: { id: TS.id }, data: { payoutHold: false } })
    check('退票超过实际打款额 400 → OVER_AMOUNT', (await S.registerBounce(sm1.id, 1, { amountCents: 401, externalNo: `ITB1-${RUN}` })) === 'OVER_AMOUNT')
    check('退票 250', (await S.registerBounce(sm1.id, 1, { amountCents: 250, externalNo: `ITB1-${RUN}` })) === 'OK')
    check('同一退票流水号 → DUPLICATE', (await S.registerBounce(sm1.id, 1, { amountCents: 100, externalNo: `ITB1-${RUN}` })) === 'DUPLICATE')
    check('累计退票超额 → OVER_AMOUNT', (await S.registerBounce(sm1.id, 1, { amountCents: 151, externalNo: `ITB2-${RUN}` })) === 'OVER_AMOUNT')

    // 多成分：结账开票（已开）、少付 CHANNEL、CHANNEL loss 部分退、调账、退票
    const x1 = await mkOrder({ tenant: TS, user: buyer, productId: P, listingId: lTS, invoice: true })
    await V.fulfillOrder(x1.id)
    await prisma.invoice.updateMany({ where: { shopOrderId: x1.id }, data: { status: 'ISSUED' } })
    const x2 = await mkOrder({ tenant: TS, user: buyer, productId: P, listingId: lTS })
    await markPaidAdmin(x2.id, 13900, 'CHANNEL')
    await prisma.order.update({ where: { id: x2.id }, data: { deliveryStatus: 'DELIVERED', deliveredAt: new Date() } })
    const x3 = await mkOrder({ tenant: TS, user: buyer, productId: P, listingId: lTS })
    await V.fulfillOrder(x3.id)
    await L.releaseDue(at(8), { tenantId: TS.id })
    check('x3 CHANNEL 让利 5000（loss 1000）', (await refund(x3.id, { refundGoodsCents: 5000, bearer: 'CHANNEL', lossCents: 1000 })).ok === true)
    check('调账 +300', (await L.adjust({ tenantId: TS.id, amountCents: 300, reasonCode: 'COMP', reason: '补偿', publicMemo: '活动补贴', requestId: `adj-${RUN}`, operatorId: 1 })) === 'OK')
    check('调账重复提交 → DUPLICATE', (await L.adjust({ tenantId: TS.id, amountCents: 300, reasonCode: 'COMP', reason: '补偿', requestId: `adj-${RUN}`, operatorId: 1 })) === 'DUPLICATE')
    const before = await triples(TS.id)
    const q1 = await gen('REQUEST', `it-${RUN}-q1`)
    check('渠道申请出单', q1.ok === true && q1.netCents === before.avail[2], JSON.stringify(q1))
    const sq1 = await prisma.tenantStatement.findUniqueOrThrow({ where: { statementNo: (q1 as { statementNo: string }).statementNo } })
    const q1Comps = [sq1.goodsCents, sq1.purchaseCents, sq1.invShareCents, sq1.feeCents, sq1.otherCents, sq1.netCents]
    check('结算单含 FEE 与 INVOICE_FEE、LOSS / SHORT / MANUAL', sq1.invShareCents > 0 && sq1.otherCents !== 0)
    check('从 PAYING 退回未确认 → CONFLICT', (await S.markPaying(sq1.id, 1)) === 'OK' && (await S.returnStatement(sq1.id, 1, '测试', false)) === 'CONFLICT')
    check('退回（确认未转出）', (await S.returnStatement(sq1.id, 1, '测试退回', true)) === 'OK')
    const ret = await prisma.tenantLedgerEntry.findMany({ where: { eventKey: `ret:${sq1.id}` }, select: { leg: true, component: true, amountCents: true, bucket: true, orderId: true } })
    const legs = new Set(ret.map((r) => r.leg))
    check('退回按成分拆回：rg / rp / rs / rf / rsf / rsh / rl / rm 都在', ['a', 'rg', 'rp', 'rs', 'rf', 'rsf', 'rsh', 'rl', 'rm'].every((l) => legs.has(l)), Array.from(legs).join(','))
    check('拆回腿不带 orderId、合计 0', ret.every((r) => r.orderId == null) && ret.reduce((s, r) => s + r.amountCents, 0) === 0)
    const after = await triples(TS.id)
    eqc('退回后可结算三个数回到出单前', after.avail, before.avail)
    check('REQUEST 间隔内再申请 → INTERVAL', why(await gen('REQUEST')) === 'INTERVAL')
    const s3 = await gen('SCHEDULE', `it-${RUN}-s3`)
    const ss3 = await prisma.tenantStatement.findUniqueOrThrow({ where: { statementNo: (s3 as { statementNo: string }).statementNo } })
    eqc('退回后下期重出：逐成分与原单相同', [ss3.goodsCents, ss3.purchaseCents, ss3.invShareCents, ss3.feeCents, ss3.otherCents, ss3.netCents], q1Comps)
    await S.markPaying(ss3.id, 1)
    check('同一流水号登记第二张单 → DUP_TRADE_NO', (await S.registerPayout(ss3.id, 1, { amountCents: ss3.netCents, withholdCents: 0, method: 'ALIPAY', externalTradeNo: `ITT1-${RUN}`, paidAt: new Date(), voucherType: 'INVOICE', partnerInvoiceNo: 'FP2', partnerInvoiceAmountCents: ss3.netCents })) === 'DUP_TRADE_NO')
    check('退回状态不符（已 RETURNED 再退回）→ CONFLICT', (await S.returnStatement(sq1.id, 1, 'x', true)) === 'CONFLICT')
    check('未打款的单登记退票 → BAD_STATE', (await S.registerBounce(ss3.id, 1, { amountCents: 1, externalNo: `ITB3-${RUN}` })) === 'BAD_STATE')
    await S.returnStatement(ss3.id, 1, '准备并发测试', true)
    const conc = await Promise.all([gen('SCHEDULE'), gen('SCHEDULE')])
    check('并发两次出单只成一张', conc.filter((r) => r.ok).length === 1 && conc.filter((r) => !r.ok && r.reason === 'OPEN_EXISTS').length === 1, JSON.stringify(conc))
    const open = await prisma.tenantStatement.findFirstOrThrow({ where: { tenantId: TS.id, openKey: TS.id } })
    await S.returnStatement(open.id, 1, '准备跨 periodEnd 测试', false)
    // 一个事件的两条腿跨 periodEnd：整组不收
    const T = new Date(Date.now() + 30_000) // 之前写入的分录都早于 T；e2 晚于 T
    const e1 = await prisma.tenantLedgerEntry.create({ data: { tenantId: TS.id, eventKey: `adj:span-${RUN}`, leg: 'a', type: 'ADJUST', component: 'MANUAL', bucket: 'AVAILABLE', amountCents: 500, createdAt: new Date(T.getTime() - 3600_000) } })
    const e2 = await prisma.tenantLedgerEntry.create({ data: { tenantId: TS.id, eventKey: `adj:span-${RUN}`, leg: 'b', type: 'ADJUST', component: 'MANUAL', bucket: 'AVAILABLE', amountCents: 500, createdAt: new Date(T.getTime() + 3600_000) } })
    const sp = await gen('MANUAL', undefined, T)
    const spRow = sp.ok ? await prisma.tenantStatement.findUniqueOrThrow({ where: { statementNo: sp.statementNo } }) : null
    const inLines = spRow ? await prisma.tenantStatementLine.count({ where: { statementId: spRow.id, entryId: { in: [e1.id, e2.id] } } }) : -1
    check('跨 periodEnd 的事件整组不收（两条腿都不在结算单里）', sp.ok === true && inLines === 0, JSON.stringify(sp))
    check('TS 钱类对账全过', (await moneyFails(TS.id)).length === 0, (await moneyFails(TS.id)).join(' '))
  }

  // =========================================================================
  section('W3-9 篡改分录 → 对账报错并置 payoutHold')
  {
    const a = await mkOrder({ tenant: T9, user: buyer, productId: P, listingId: lT9, invoice: true })
    await V.fulfillOrder(a.id)
    const b = await mkOrder({ tenant: T9, user: buyer, productId: P, listingId: lT9 })
    await V.fulfillOrder(b.id)
    const c = await mkOrder({ tenant: T9, user: buyer, productId: P, listingId: lT9 })
    await V.fulfillOrder(c.id)
    const invC = await postHocInvoice(c)
    await payInvoiceViaVmq(invC)
    const d = await mkOrder({ tenant: T9, user: buyer, productId: P, listingId: lT9 })
    await V.fulfillOrder(d.id)
    check('篡改前 T9 钱类对账全过', (await moneyFails(T9.id)).length === 0, (await moneyFails(T9.id)).join(' '))
    const expect = async (name: string, code: string) => {
      const f = await moneyFails(T9.id, true)
      const hold = (await prisma.tenant.findUniqueOrThrow({ where: { id: T9.id } })).payoutHold
      check(`${name} → ${code}，并置 payoutHold`, f.some((x) => x.startsWith(code + '[')) && hold, f.join(' '))
      await prisma.tenant.update({ where: { id: T9.id }, data: { payoutHold: false, payoutHoldReason: null } })
    }
    const fee = await prisma.tenantLedgerEntry.findFirstOrThrow({ where: { eventKey: `sale:${b.id}`, component: 'FEE' } })
    await prisma.tenantLedgerEntry.delete({ where: { id: fee.id } })
    await expect('删一条 FEE', 'L5')
    const { id: _id, ...feeData } = fee
    void _id
    await prisma.tenantLedgerEntry.create({ data: feeData })
    const sale = await prisma.tenantLedgerEntry.findFirstOrThrow({ where: { eventKey: `sale:${b.id}`, component: 'SALE' } })
    await prisma.tenantLedgerEntry.update({ where: { id: sale.id }, data: { amountCents: sale.amountCents + 1 } })
    await expect('改一条金额', 'L5')
    await prisma.tenantLedgerEntry.update({ where: { id: sale.id }, data: { amountCents: sale.amountCents } })
    const dupInv = await prisma.tenantLedgerEntry.create({ data: { tenantId: T9.id, eventKey: `inv:${a.id}`, leg: 's2', type: 'ACCRUE_INV', component: 'INVOICE_SHARE', bucket: 'PENDING', amountCents: 280, orderId: a.id } })
    await expect('重复一条 inv:', 'L7')
    await prisma.tenantLedgerEntry.delete({ where: { id: dupInv.id } })
    const m1 = await prisma.tenantLedgerEntry.create({ data: { tenantId: T9.id, eventKey: `itest-shift:${b.id}`, leg: 'x1', type: 'ADJUST', component: 'SALE', bucket: 'AVAILABLE', amountCents: 500, orderId: b.id } })
    const m2 = await prisma.tenantLedgerEntry.create({ data: { tenantId: T9.id, eventKey: `itest-shift:${b.id}`, leg: 'x2', type: 'ADJUST', component: 'SALE', bucket: 'PENDING', amountCents: -500, orderId: b.id } })
    {
      const f = await moneyFails(T9.id, true)
      check('SALE 在两桶间挪 x（总额不变）→ L6（逐成分校验桶，L5 不报）', f.some((x) => x.startsWith('L6[')) && !f.some((x) => x.startsWith('L5[')), f.join(' '))
      await prisma.tenant.update({ where: { id: T9.id }, data: { payoutHold: false, payoutHoldReason: null } })
    }
    await prisma.tenantLedgerEntry.deleteMany({ where: { id: { in: [m1.id, m2.id] } } })
    await prisma.order.update({ where: { id: d.id }, data: { payStatus: 'UNPAID' } })
    await expect('已付渠道单改回 UNPAID', 'L12')
    await prisma.order.update({ where: { id: d.id }, data: { payStatus: 'PAID' } })
    const cInv = await prisma.tenantLedgerEntry.findMany({ where: { eventKey: `inv:${c.id}` } })
    await prisma.tenantLedgerEntry.deleteMany({ where: { eventKey: `inv:${c.id}` } })
    await prisma.order.update({ where: { id: c.id }, data: { invShareState: null } })
    await expect('删一组事后开票分成', 'L11')
    check('补偿：accrueInvoiceShare 重新计提', (await L.accrueInvoiceShare(invC)) === 'OK' && (await prisma.tenantLedgerEntry.count({ where: { eventKey: `inv:${c.id}` } })) === cInv.length)
    check('恢复后 T9 钱类对账全过', (await moneyFails(T9.id)).length === 0, (await moneyFails(T9.id)).join(' '))
    const t9 = await prisma.tenant.findUniqueOrThrow({ where: { id: T9.id } })
    check('payoutHold 已复位', !t9.payoutHold)
    // 置 hold 后出单被拒
    await prisma.tenantLedgerEntry.update({ where: { id: sale.id }, data: { amountCents: sale.amountCents + 1 } })
    const g = await S.generateStatement({ tenantId: T9.id, origin: 'MANUAL', periodEnd: new Date(Date.now() + 2000), actorUserId: 1, requestId: `it-${RUN}-t9` })
    check('对账失败时出单 → RECONCILE_FAILED 且置 hold', !g.ok && g.reason === 'RECONCILE_FAILED' && (await prisma.tenant.findUniqueOrThrow({ where: { id: T9.id } })).payoutHold)
    await prisma.tenantLedgerEntry.update({ where: { id: sale.id }, data: { amountCents: sale.amountCents } })
    await prisma.tenant.update({ where: { id: T9.id }, data: { payoutHold: false, payoutHoldReason: null } })
  }

  // =========================================================================
  section('W3-10 票据来源站：跨站合并拒绝（A12）')
  {
    const z = await mkOrder({ tenant: TZ, user: buyer2, productId: P, listingId: lTZ })
    await V.fulfillOrder(z.id)
    const full = await prisma.order.findUniqueOrThrow({ where: { id: z.id }, include: { user: true } })
    const extZ = await OB.ensureExternalOrderForShopOrder({ id: full.id, productName: full.productName, amount: full.amount, paidAt: full.paidAt, createdAt: full.createdAt, user: { email: full.user.email, nickname: full.user.nickname } })
    check('zz 订单的背书行 tenantId = zz', extZ.tenantId === TZ.id)
    // 把 zz 的订单挂到 lulu 的行上（篡改 / bug）
    const forged = await prisma.externalOrder.create({
      data: { startDate: new Date(), expireDate: new Date(), subscriptionType: 'x', claudeAccount: buyer2.email, quote: new Prisma.Decimal('140.00'), sourceKey: `itest-forged-${RUN}`, shopOrderId: z.id, tenantId: TR.id },
    })
    let status = 0
    try {
      await OB.submitInvoiceForExternalOrder(forged.id, { title: 't', taxNumber: '91110000X', email: buyer2.email, showAiWording: false })
    } catch (e) {
      status = (e as { status?: number }).status ?? -1
    }
    check('跨站合并开票 → 拒绝（409）', status === 409)
    status = 0
    try {
      await OB.submitReceiptForExternalOrder(forged.id, 'x')
    } catch (e) {
      status = (e as { status?: number }).status ?? -1
    }
    check('跨站合并开收据 → 拒绝（409）', status === 409)
    status = 0
    try {
      await OB.assertExternalOrderAccess(forged, { user: { id: buyer2.id } })
    } catch (e) {
      status = (e as { status?: number }).status ?? -1
    }
    check('assertExternalOrderAccess 跨站 → 404', status === 404)
    check('order-link 跨行查重给出拒绝文案', !!(await OL.crossRowInvoiceBlock(z.id, forged.id)))
    check('零写入：该行没有发票 / 收据', (await prisma.invoice.count({ where: { externalOrderId: forged.id } })) === 0 && (await prisma.receipt.count({ where: { externalOrderId: forged.id } })) === 0)
    let threw = false
    try {
      await BL.billingTenantFields(forged.id)
    } catch (e) {
      threw = e instanceof BL.CrossTenantBillingError
    }
    check('billingTenantFields 抛 CrossTenantBillingError', threw)
    const mainOrder = await mkOrder({ tenant: { id: 1 }, user: buyer2, productId: M, retail: 12900 })
    const mainExt = await prisma.externalOrder.create({ data: { startDate: new Date(), expireDate: new Date(), subscriptionType: 'x', claudeAccount: buyer2.email, sourceKey: `order:${mainOrder.id}`, shopOrderId: mainOrder.id } })
    eqc('主站行：{ tenantId: 1, shopOrderId: 订单 }', await BL.billingTenantFields(mainExt.id), { tenantId: 1, shopOrderId: mainOrder.id })
    const pureExt = await prisma.externalOrder.create({ data: { startDate: new Date(), expireDate: new Date(), subscriptionType: 'x', claudeAccount: buyer2.email, sourceKey: `itest-pure-${RUN}` } })
    eqc('纯外部行：{ 1, null }', await BL.billingTenantFields(pureExt.id), { tenantId: 1, shopOrderId: null })
    eqc('findShopOrderForInvoice（结账开票单）', await BL.findShopOrderForInvoice((await prisma.invoice.findFirstOrThrow({ where: { shopOrderId: O2.id } })).id), { orderId: O2.id, tenantId: TL.id })
    // 对账 A12：发票来源站被改坏
    const ivO2 = await prisma.invoice.findFirstOrThrow({ where: { shopOrderId: O2.id } })
    await prisma.invoice.update({ where: { id: ivO2.id }, data: { tenantId: TZ.id } })
    check('Invoice.tenantId ≠ 订单 tenantId → A12', (await alertFails(TL.id)).includes('A12'))
    await prisma.invoice.update({ where: { id: ivO2.id }, data: { tenantId: TL.id } })
    await prisma.externalOrder.deleteMany({ where: { id: { in: [forged.id, mainExt.id, pureExt.id] } } })
  }

  // =========================================================================
  section('W3-11 链接 origin')
  {
    check('tenantOrigin(渠道) = 租户 origin', (await origin.tenantOrigin(TL.id)) === TL.origin)
    const { renderOrderPaidEmail } = await import('../../src/lib/mail')
    const html = renderOrderPaidEmail({ orderNo: O1.orderNo, productName: 'x', amount: 140 }, { origin: await origin.tenantOrigin(TL.id) }).html
    const hrefs = Array.from(html.matchAll(/href="([^"]+)"/g)).map((m) => m[1])
    check('渠道单已支付邮件的链接全是渠道 origin', hrefs.length > 0 && hrefs.every((h) => h.startsWith(TL.origin)))
  }

  // =========================================================================
  section('W3-12 partner-facade 返回值键集合 ⊆ PARTNER_ALLOWED_KEYS')
  {
    const outs: [string, unknown][] = []
    outs.push(['balancesForPartner', await F.balancesForPartner(TL.id)])
    outs.push(['listLedgerForPartner', await F.listLedgerForPartner(TL.id, { page: 1, pageSize: 100 })])
    outs.push(['statementListForPartner', await F.statementListForPartner(TL.id, 1)])
    outs.push(['statementDetailForPartner', await F.statementDetailForPartner(TL.id, st1.statementNo)])
    outs.push(['orderSettlementViewsForPartner', Array.from((await F.orderSettlementViewsForPartner(TL.id, [O1.orderNo, O2.orderNo, O3.orderNo, O4.orderNo])).values())])
    for (const [name, v] of outs) {
      const keys = collectKeys(v).map((k) => k.key)
      const notAllowed = keys.filter((k) => !selects.PARTNER_ALLOWED_KEYS.has(k))
      const forbidden = keys.filter((k) => selects.PARTNER_FORBIDDEN_KEYS.has(k))
      check(`${name}：键全在允许表、无禁用键`, keys.length > 0 && notAllowed.length === 0 && forbidden.length === 0, `越界 ${notAllowed.join(',')} 禁用 ${forbidden.join(',')}`)
    }
    const detail = (await F.statementDetailForPartner(TL.id, st1.statementNo))!
    check('结算单明细行数 = lineCount、流水号只给后四位', detail.lines.length === st1.lineCount && detail.tradeNoLast4 === `ITX1-${RUN}`.slice(-4))
    check('别的渠道查这张结算单 → null', (await F.statementDetailForPartner(TZ.id, st1.statementNo)) === null)
    check('别的渠道查这些订单的结算视图 → 空', (await F.orderSettlementViewsForPartner(TZ.id, [O1.orderNo, O2.orderNo])).size === 0)
    const views = await F.orderSettlementViewsForPartner(TL.id, [O2.orderNo, O4.orderNo])
    check('订单视图：O2 已结算、O4 已结算', views.get(O2.orderNo)?.bucket === 'SETTLED' && views.get(O4.orderNo)?.bucket === 'SETTLED')
    let bad = false
    try {
      await F.balancesForPartner(1)
    } catch {
      bad = true
    }
    check('facade 拒绝 tenantId=1', bad)
    const results: string[] = []
    for (let i = 0; i < 4; i++) {
      const r = await F.applySettlementForPartner(TL.id, owner.id, `apply-${RUN}-${i}`)
      results.push(r.ok ? 'OK' : r.reason)
    }
    check('渠道申请结算：余额 0 → NEGATIVE ×3，第 4 次超过每日 3 次 → INTERVAL', same(results, ['NEGATIVE', 'NEGATIVE', 'NEGATIVE', 'INTERVAL']), results.join(','))
    let webhookBad = false
    try {
      await F.setTenantWebhook(TL.id, 'https://evil.example.com/hook')
    } catch (e) {
      webhookBad = e instanceof F.PartnerFacadeError
    }
    check('webhook 非企业微信前缀 → 拒绝', webhookBad)
    await F.setTenantWebhook(TL.id, 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=itest')
    const enc = (await prisma.tenant.findUniqueOrThrow({ where: { id: TL.id } })).wecomWebhookEnc
    check('webhook 加密存储（不含明文）', !!enc && !enc.includes('itest'))
    await F.setTenantWebhook(TL.id, null)
    check('lastRequestAt：没有 REQUEST 出单 → null', (await F.lastRequestAt(TL.id)) === null)
  }

  // =========================================================================
  section('收尾：全部测试渠道钱类对账')
  for (const t of [TL, TR, TS, T9, TZ]) {
    const f = await moneyFails(t.id)
    check(`${t.code} 钱类不变式全过`, f.length === 0, f.join(' '))
  }
  await notice.waitTenantNoticePushesForTest()
  console.warn = origWarn
}

main()
  .catch((e) => {
    console.error(e)
    check('未捕获异常', false, String((e as Error)?.stack || e))
  })
  .finally(async () => {
    try {
      await extraCleanup()
      await cleanupAll()
      await prisma.category.deleteMany({ where: { name: { startsWith: `${NAME_PREFIX}-W3-` } } })
    } catch (e) {
      console.error('清理失败', e)
    }
    const { fail } = summary()
    await prisma.$disconnect()
    const { prisma: appPrisma } = await import('../../src/lib/db')
    await appPrisma.$disconnect()
    process.exit(fail === 0 ? 0 : 1)
  })
