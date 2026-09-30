/**
 * 短信接码 · 下单（T1，含预扣；要走收银台的在同一请求里发起收款单）（docs/短信接码-设计.md §1.8、§1.9、§2.4 T1、§2.5、§6.4、§9.1、D27、D32–D34、E26、E36、E62）。
 *
 * 顺序（事务之前没有任何副作用）：
 *   1. sms_config 读得到且 enabled、受众允许（ADMIN_ONLY 时只有管理员）→ 否则 503 MAINTENANCE（fail-closed，E59：只挡新单）；
 *   2. 同意标记 agree === true 且两份条款版本等于代码常量（JIEMA_TERMS_VERSION、WALLET_TERMS_VERSION，不读配置）→ 否则 409 TERMS
 *      （缺字段也是 409，不是 400：前端据此重新弹「下单须知与免责声明」；带上当前两个版本号，前端版本对不上时提示刷新页面，§1.8、§8.6）；
 *   3. (userId, clientToken) 已有订单 → 原样返回（待支付的照样返回 payUrl）；
 *   4. SMS_POOL 载体商品恰好 1 行且下架；payWith=BALANCE 时余额支付开关打开（wallet_config 读不到按关，E52、E53）；
 *      指定了运营商：这个国家的运营商列表拿得到、里面却没有它 → 400（列表拿不到——服务 / 国家下架或不在目录——先交给 5、6 给 404 / 409 HOLD，
 *      §10.2、第 122 条；过了 5、6 再核一次）；
 *   5. 实时报价（catalog.quote，第 ③ 层 60 秒缓存）→ NOT_FOUND 404 / HOLD 409 / MAINTENANCE 503 / SOLD_OUT 409 / QUOTE_FAILED 503；
 *   6. gate.checkSellable（①–⑥，含 E26 上游余额够付本单：不够 503 UNAVAILABLE、不建单、不预扣）；
 *   7. 会走收银台的（组合、支付宝）先查每人待付款收款单 < 3（D27 预检）→ 否则 429 OPEN_PAYMENTS{items}（各笔的链接），不建单、不预扣；
 *   8. 事务（READ COMMITTED）：锁用户行 → 再查幂等 → 计数（同时进行中 ≤3 含待支付、每小时 ≤10、每天 ≤30）→ 价格等于 expect（否则 409
 *      PRICE_CHANGED，带在锁住用户行之后按新价重算的拆分）→ 余额拆分等于 expect（否则 409 BALANCE_CHANGED；可用余额为 0 带 suggestPayWith）
 *      → createShopOrder（remark=null，productName「短信接码 · 服务 · 国家/地区」）→ smsOrder.create（定价快照）→ 预扣（holdInTx，只调一次 postInTx）
 *      → 同一事务写 TERMS_AGREED 事件（条款版本、IP、UA 摘要；每一单一条，幂等重放不重写，§8.6）；
 *   9. 余额付清：同一请求 fulfillOrder(via BALANCE)（T3，失败由 T19 兜底）→ next=NUMBER；
 *      组合 / 支付宝：同一请求 createOrGetVmqOrder（金额 = payableCents）→ 事后复核每人 ≤3 → next=CASHIER + payUrl；
 *      发起失败或复核超限 → 同一请求走 T18（作废本次新建的收款单 → 关单 → 释放预扣），503 PAY_BUSY / 429 OPEN_PAYMENTS{released}。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { createShopOrder } from '../order/create-shop-order'
import { createOrGetVmqOrder, countOpenOrderPayments, discardVmqOrder, fulfillOrder, VmqError, VMQ_MAX_OPEN_PER_USER, VMQ_TIMEOUT_MIN } from '../vmq'
import { payableCents } from '../order-payable'
import { inMoneyTx } from '../wallet/ledger'
import { holdInTx } from '../wallet/hold'
import { splitDebit, centsOf } from '../wallet/buckets'
import { readWalletConfig } from '../wallet/config'
import { JIEMA_TERMS_VERSION, WALLET_TERMS_VERSION } from '../terms/jiema-wallet'
import { readSmsConfig } from './config'
import { quote, catalogOperators } from './catalog'
import type { CatalogOperator } from './dto'
import { checkSellable } from './sellable'
import { closePending } from './engine'
import { logEvent } from './events'
import { smsAlert } from './alert'
import { jnow, tightenReplace } from './runtime'
import { ORDER_ACTIVE_FOR_LIMIT, TIGHT_MAX_REPLACE, payModeOf } from './machine'
import { TERMS_AGREED_EVENT, consentDetail, type ConsentMeta } from './consent'

export interface JiemaOrderInput {
  service: string
  country: number
  operator: string | null
  operatorFallback: boolean
  expectPriceCents: number
  payWith: 'ALIPAY' | 'BALANCE'
  expectBalanceCents?: number | null
  clientToken: string
  /** 付款前弹窗里勾选同意（必须是 true；缺失 / false → 409 TERMS） */
  agree?: boolean | null
  /** 同意的《短信接码服务条款》版本（必须等于 JIEMA_TERMS_VERSION） */
  termsVersion?: string | null
  /** 同意的《余额与充值规则》版本（必须等于 WALLET_TERMS_VERSION） */
  walletTermsVersion?: string | null
  /** 同意留痕：下单请求的 IP 与 User-Agent（路由层取；脚本直接调用可以不带，照样留一条版本记录） */
  consent?: ConsentMeta | null
}

export interface JiemaOrderCreated {
  orderNo: string
  orderId: number
  priceCents: number
  payMode: 'ALIPAY' | 'BALANCE' | 'MIXED'
  balanceCents: number
  alipayCents: number
  quoteExpiresAt: string
  next: 'NUMBER' | 'CASHIER'
  payUrl?: string
  reused?: boolean
}

export type JiemaOrderResult = { ok: true; data: JiemaOrderCreated } | { ok: false; status: number; code: string; message: string; extra?: Record<string, unknown> }

const bad = (status: number, code: string, message: string, extra?: Record<string, unknown>): JiemaOrderResult => ({ ok: false, status, code, message, extra })
const OPERATOR_MSG = '运营商不在这个国家/地区的列表里，请重新选择'

// ───────────────────────── 载体商品 ─────────────────────────

let carrierCache: { id: number; at: number } | null = null
let lastCarrierAlertAt = 0

/** SMS_POOL 载体商品的 id：要求 deliveryType='SMS_POOL' **恰好 1 行**且下架；否则 null（接码停售并告警，§5.4、D14） */
export async function smsCarrierId(): Promise<number | null> {
  const now = Date.now()
  if (carrierCache && now - carrierCache.at < 5 * 60_000) return carrierCache.id
  const rows = await prisma.product.findMany({ where: { deliveryType: 'SMS_POOL' }, select: { id: true, status: true }, take: 3 })
  if (rows.length === 1 && rows[0].status === 0) {
    carrierCache = { id: rows[0].id, at: now }
    return rows[0].id
  }
  carrierCache = null
  if (now - lastCarrierAlertAt > 3600_000) {
    lastCarrierAlertAt = now
    smsAlert('CARRIER', rows.length === 1 ? '「短信接码」载体商品被上架了' : `SMS_POOL 载体商品有 ${rows.length} 行（应恰好 1 行）`, [
      { label: '影响', value: '接码新单已按停售处理（在途单照常推进）' },
      { label: '处理', value: rows.length === 0 ? '执行种子 scripts/ops/jiema-s2-seed.sql' : '核对 products 里 delivery_type=SMS_POOL 的行，保持恰好 1 行、下架' },
    ])
  }
  return null
}

export function resetSmsCarrierCacheForTest(): void {
  carrierCache = null
}

// ───────────────────────── 已有订单的返回（幂等） ─────────────────────────

async function payUrlOf(orderId: number): Promise<string | null> {
  const v = await prisma.vmqOrder.findFirst({
    where: { bizType: 'order', bizId: orderId, state: 0, createdAt: { gte: new Date(Date.now() - VMQ_TIMEOUT_MIN * 60_000) } },
    orderBy: { createdAt: 'desc' },
    select: { orderId: true },
  })
  return v ? `/pay/${v.orderId}` : null
}

async function existingResult(so: { orderId: number; priceCents: number; payMode: string; balanceCents: number; alipayCents: number; quoteExpiresAt: Date; state: string }): Promise<JiemaOrderResult> {
  const o = await prisma.order.findUnique({ where: { id: so.orderId }, select: { orderNo: true } })
  if (!o) return bad(500, 'ERROR', '订单不存在')
  const pending = so.state === 'PENDING_PAY' && so.payMode !== 'BALANCE'
  const payUrl = pending ? await payUrlOf(so.orderId) : null
  return {
    ok: true,
    data: {
      orderNo: o.orderNo,
      orderId: so.orderId,
      priceCents: so.priceCents,
      payMode: so.payMode as JiemaOrderCreated['payMode'],
      balanceCents: so.balanceCents,
      alipayCents: so.alipayCents,
      quoteExpiresAt: so.quoteExpiresAt.toISOString(),
      next: pending ? 'CASHIER' : 'NUMBER',
      ...(payUrl ? { payUrl } : {}),
      reused: true,
    },
  }
}

// ───────────────────────── 事务里的「前提变了」 ─────────────────────────

class OrderTxAbort extends Error {
  constructor(public readonly result: JiemaOrderResult) {
    super('jiema order tx abort')
  }
}

/** 429 OPEN_PAYMENTS 里的一笔待付款（§6.4 `OPEN_PAYMENTS{ items, released? }`、§1.8：接码单去号码页、充值单去充值页、普通商品去「我的订单」） */
export interface OpenPaymentItem {
  kind: 'SMS' | 'TOPUP' | 'ORDER'
  orderNo: string
  /** 去完成它的页面 */
  href: string
  /** 继续付款的收银台 */
  payUrl: string
  amountCents: number
  expiresAt: string
}

/**
 * 本人有效期内的待付款收款单（与 countOpenOrderPayments 同一口径：bizType=order、state=0、未超时），逐字段白名单拼成列表。
 * 只查 userId = 本人的订单；不带收款单备注、金额池之类的内部字段。
 */
export async function openPaymentItems(userId: number): Promise<OpenPaymentItem[]> {
  const live = await prisma.vmqOrder.findMany({
    where: { bizType: 'order', state: 0, createdAt: { gte: new Date(Date.now() - VMQ_TIMEOUT_MIN * 60_000) } },
    select: { orderId: true, bizId: true, reallyPrice: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
    take: 500,
  })
  if (!live.length) return []
  const mine = await prisma.order.findMany({
    where: { id: { in: Array.from(new Set(live.map((v) => v.bizId))) }, userId },
    select: { id: true, orderNo: true, product: { select: { deliveryType: true } } },
  })
  const byId = new Map(mine.map((o) => [o.id, o]))
  const out: OpenPaymentItem[] = []
  for (const v of live) {
    const o = byId.get(v.bizId)
    if (!o) continue
    const t = o.product?.deliveryType
    const kind: OpenPaymentItem['kind'] = t === 'SMS_POOL' ? 'SMS' : t === 'TOPUP' ? 'TOPUP' : 'ORDER'
    out.push({
      kind,
      orderNo: o.orderNo,
      href: kind === 'SMS' ? `/jiema/order/${o.orderNo}` : kind === 'TOPUP' ? '/wallet/topup' : '/orders',
      payUrl: `/pay/${v.orderId}`,
      amountCents: centsOf(v.reallyPrice),
      expiresAt: new Date(v.createdAt.getTime() + VMQ_TIMEOUT_MIN * 60_000).toISOString(),
    })
  }
  return out
}

const openPaymentsMsg = (released: boolean, withHold: boolean) =>
  `你有 ${VMQ_MAX_OPEN_PER_USER} 笔付款还没完成（含充值），请先完成或等它们超时关闭（约 ${VMQ_TIMEOUT_MIN} 分钟）${released ? `；本单已取消${withHold ? '，预扣的余额已退回' : ''}` : ''}`

// ───────────────────────── 下单 ─────────────────────────

export async function createJiemaOrder(user: { id: number; role?: string | null }, input: JiemaOrderInput): Promise<JiemaOrderResult> {
  const isAdmin = user.role === 'ADMIN'
  // 1. 总开关与受众（读不到 = 维护中；在途单不受影响）
  const cfgRead = await readSmsConfig()
  if (!cfgRead.ok) return bad(503, 'MAINTENANCE', '接码服务维护中，预计很快恢复')
  const cfg = cfgRead.config
  if (!cfg.enabled || (cfg.audience !== 'ALL' && !isAdmin)) {
    // 与目录接口同一口径（S1 实施偏差）：从没对全部用户开放过的普通用户看到「即将开放」，其余「维护中」
    const soon = cfg.audience !== 'ALL' && !isAdmin
    return bad(503, 'MAINTENANCE', soon ? '短信接码即将开放' : '接码服务维护中，预计很快恢复', { soon })
  }
  // 2. 同意标记与条款版本（代码常量）。缺字段也按 409 TERMS（前端重新弹窗）；带上当前版本，前端据此判断是不是自己的页面旧了
  const termsNow = { termsVersion: JIEMA_TERMS_VERSION, walletTermsVersion: WALLET_TERMS_VERSION }
  if (input.agree !== true || input.termsVersion == null || input.walletTermsVersion == null) {
    return bad(409, 'TERMS', '请先阅读「下单须知与免责声明」，勾选同意后再下单', termsNow)
  }
  if (input.termsVersion !== JIEMA_TERMS_VERSION || input.walletTermsVersion !== WALLET_TERMS_VERSION) {
    return bad(409, 'TERMS', '《短信接码服务条款》或《余额与充值规则》已更新，请刷新页面后重新阅读并同意', termsNow)
  }
  // 3. 幂等
  const same = await prisma.smsOrder.findUnique({ where: { userId_clientToken: { userId: user.id, clientToken: input.clientToken } } })
  if (same) return existingResult(same)
  // 4. 载体商品、余额支付开关
  const carrierId = await smsCarrierId()
  if (carrierId == null) return bad(503, 'MAINTENANCE', '接码服务维护中，预计很快恢复')
  if (input.payWith === 'BALANCE') {
    const w = await readWalletConfig()
    if (!w.ok || !w.config.balancePayEnabled) return bad(503, 'BALANCE_PAY_OFF', '余额支付暂时维护中，请选择支付宝')
  }
  // 运营商：列表拿得到、里面没有它 → 400；拿不到（服务 / 国家手动下架、不在目录）先不判，交给报价与闸门给 404 / 409 HOLD（§10.2、第 122 条）
  const opMissing = (list: CatalogOperator[]) => !list.some((o) => o.code === input.operator)
  let ops = input.operator ? await catalogOperators(input.service, input.country) : null
  if (input.operator && ops && opMissing(ops)) return bad(400, 'BAD_REQUEST', OPERATOR_MSG)
  // 5. 实时报价（锁价）
  const q = await quote(input.service, input.country, cfg, jnow())
  if (!q.ok) {
    switch (q.code) {
      case 'NOT_FOUND':
        return bad(404, 'NOT_FOUND', '这个组合不存在，请重新选择')
      case 'HOLD':
        return bad(409, 'HOLD', '这个组合暂停销售，换一个试试')
      case 'MAINTENANCE':
        return bad(503, 'MAINTENANCE', '接码服务维护中，预计很快恢复')
      case 'SOLD_OUT':
        return bad(409, 'SOLD_OUT', '这个国家/地区刚刚卖完，换一个试试')
      default:
        return bad(503, 'QUOTE_FAILED', '暂时拿不到实时价格，请稍后再试')
    }
  }
  // 6. 可售判定（①–⑥）
  const sell = await checkSellable({ service: input.service, country: input.country, capMicro: q.capMicro, selfSmsOrderId: null })
  if (!sell.ok) {
    const status = sell.code === 'HOLD' ? 409 : sell.code === 'BUSY' ? 429 : 503
    return bad(status, sell.code, sell.message)
  }
  if (input.operator && !ops) {
    // 报价与闸门都过了、前面却拿不到运营商列表（两次读之间刚恢复上架之类）：再核一次
    ops = await catalogOperators(input.service, input.country)
    if (!ops || opMissing(ops)) return bad(400, 'BAD_REQUEST', OPERATOR_MSG)
  }
  // 7. 会走收银台的先查每人待付款收款单（D27 预检；不建单、不预扣）
  const buckets = await prisma.user.findUnique({ where: { id: user.id }, select: { topupCents: true, balance: true } })
  const availPre = buckets ? buckets.topupCents + centsOf(buckets.balance) : 0
  const cashierPre = input.payWith === 'ALIPAY' || availPre < q.priceCents
  if (cashierPre && (await countOpenOrderPayments(user.id)) >= VMQ_MAX_OPEN_PER_USER) return bad(429, 'OPEN_PAYMENTS', openPaymentsMsg(false, false), { items: await openPaymentItems(user.id) })

  // 名称快照
  const [svc, cty] = await Promise.all([
    prisma.smsService.findUnique({ where: { code: input.service }, select: { nameEn: true, nameCn: true } }),
    prisma.smsCountry.findUnique({ where: { id: input.country }, select: { nameEn: true, nameCn: true } }),
  ])
  const serviceName = (svc?.nameCn || svc?.nameEn || input.service).trim().slice(0, 80)
  const countryName = (cty?.nameCn || cty?.nameEn || String(input.country)).trim().slice(0, 60)
  const productName = `短信接码 · ${serviceName} · ${countryName}`.slice(0, 100)
  const now = jnow()
  const quoteExpiresAt = new Date(now.getTime() + cfg.quoteTtlSec * 1000)
  const maxReplace = tightenReplace(now.getTime()) ? Math.min(cfg.maxReplace, TIGHT_MAX_REPLACE) : cfg.maxReplace

  // 8. 下单事务
  let made: { smsOrderId: number; orderId: number; orderNo: string; payMode: 'ALIPAY' | 'BALANCE' | 'MIXED'; balanceCents: number; alipayCents: number }
  try {
    made = await inMoneyTx(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM users WHERE id = ${user.id} FOR UPDATE`
        const dup = await tx.smsOrder.findUnique({ where: { userId_clientToken: { userId: user.id, clientToken: input.clientToken } } })
        if (dup) throw new OrderTxAbort(await existingResult(dup))
        const hourAgo = new Date(now.getTime() - 3600_000)
        const dayAgo = new Date(now.getTime() - 86400_000)
        const [active, perHour, perDay] = await Promise.all([
          tx.smsOrder.count({ where: { userId: user.id, state: { in: [...ORDER_ACTIVE_FOR_LIMIT] } } }),
          tx.smsOrder.count({ where: { userId: user.id, createdAt: { gte: hourAgo } } }),
          tx.smsOrder.count({ where: { userId: user.id, createdAt: { gte: dayAgo } } }),
        ])
        if (active >= cfg.limits.activePerUser) throw new OrderTxAbort(bad(429, 'LIMIT', `同时进行中的接码单最多 ${cfg.limits.activePerUser} 张（含待支付），请先完成或取消`))
        if (perHour >= cfg.limits.perHour) throw new OrderTxAbort(bad(429, 'LIMIT', `每小时最多下 ${cfg.limits.perHour} 单，请稍后再试`))
        if (perDay >= cfg.limits.perDay) throw new OrderTxAbort(bad(429, 'LIMIT', `每天最多下 ${cfg.limits.perDay} 单，请明天再来`))
        // 锁住用户行之后的两格（锁定读 = 最新值）
        const u = await tx.$queryRaw<{ balance: unknown; topup_cents: number }[]>`SELECT balance, topup_cents FROM users WHERE id = ${user.id} FOR UPDATE`
        const topup = Number(u[0]?.topup_cents ?? 0)
        const cash = centsOf(u[0]?.balance ?? 0)
        const split = splitDebit(topup, cash, q.priceCents)
        const holdCents = split.topupCents + split.cashCents
        if (q.priceCents !== input.expectPriceCents) {
          const bal = input.payWith === 'BALANCE' ? holdCents : 0
          throw new OrderTxAbort(bad(409, 'PRICE_CHANGED', '价格已更新，请确认后继续', { priceCents: q.priceCents, balanceCents: bal, alipayCents: q.priceCents - bal }))
        }
        let useHold = 0
        if (input.payWith === 'BALANCE') {
          if (holdCents <= 0) throw new OrderTxAbort(bad(409, 'BALANCE_CHANGED', '你的余额已用完，本单改用支付宝支付？', { balanceCents: 0, alipayCents: q.priceCents, suggestPayWith: 'ALIPAY' }))
          if (input.expectBalanceCents == null || input.expectBalanceCents !== holdCents) {
            throw new OrderTxAbort(bad(409, 'BALANCE_CHANGED', '你的可用余额刚刚变化，请确认新的抵扣金额', { balanceCents: holdCents, alipayCents: q.priceCents - holdCents }))
          }
          useHold = holdCents
        }
        const payMode = payModeOf(input.payWith, useHold, q.priceCents)
        const created = await createShopOrder(tx, {
          tenantId: 1,
          userId: user.id,
          productId: carrierId,
          productName,
          productPrice: q.priceCents / 100,
          quantity: 1,
          amount: q.priceCents / 100,
          invoiceTaxFee: null,
          invoiceInfo: null,
          remark: null,
        })
        const so = await tx.smsOrder.create({
          data: {
            orderId: created.id,
            userId: user.id,
            clientToken: input.clientToken,
            service: input.service,
            serviceName,
            country: input.country,
            countryName,
            operator: input.operator,
            operatorFallback: input.operatorFallback,
            costMicro: q.costMicro,
            capMicro: q.capMicro,
            saleCoef4: q.saleCoef4,
            costFx4: q.costFx4,
            markupCents: q.markupCents,
            priceCents: q.priceCents,
            ruleKey: q.ruleKey,
            configVersion: q.configVersion,
            quotedAt: now,
            quoteExpiresAt,
            durationMin: 20,
            maxReplace,
            acquireTries: cfg.acquireTries,
            longWaitOk: cfg.longDurationVerified,
            termsVersion: JIEMA_TERMS_VERSION,
            walletTermsVersion: WALLET_TERMS_VERSION,
            payMode,
            balanceCents: useHold,
            alipayCents: q.priceCents - useHold,
            state: 'PENDING_PAY',
          },
        })
        if (useHold > 0) {
          const h = await holdInTx(tx, { orderId: created.id, userId: user.id, orderCents: q.priceCents, maxCents: q.priceCents, now })
          if (h.topupCents + h.cashCents !== useHold) throw new Error('[jiema] 预扣额与拆分不一致')
          await logEvent(tx, { smsOrderId: so.id, type: 'HOLD', actor: 'BUYER', actorId: user.id, detail: { topupCents: h.topupCents, cashCents: h.cashCents } })
        }
        await logEvent(tx, { smsOrderId: so.id, type: 'CREATED', actor: 'BUYER', actorId: user.id, detail: { priceCents: q.priceCents, payMode, capMicro: q.capMicro, configVersion: q.configVersion } })
        // 同意留痕（§8.6）：与订单同成同败；三种付款方式都走这里（余额付清、组合、支付宝）
        await logEvent(tx, {
          smsOrderId: so.id,
          type: TERMS_AGREED_EVENT,
          actor: 'BUYER',
          actorId: user.id,
          detail: { ...consentDetail({ terms: JIEMA_TERMS_VERSION, walletTerms: WALLET_TERMS_VERSION }, input.consent) },
        })
        return { smsOrderId: so.id, orderId: created.id, orderNo: created.orderNo, payMode, balanceCents: useHold, alipayCents: q.priceCents - useHold }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    )
  } catch (e) {
    if (e instanceof OrderTxAbort) return e.result
    if ((e as { code?: string })?.code === 'P2002') {
      const dup = await prisma.smsOrder.findUnique({ where: { userId_clientToken: { userId: user.id, clientToken: input.clientToken } } })
      if (dup) return existingResult(dup)
    }
    throw e
  }

  if (crashAfterTxForTest) return { ok: true, data: { orderNo: made.orderNo, orderId: made.orderId, priceCents: q.priceCents, payMode: made.payMode, balanceCents: made.balanceCents, alipayCents: made.alipayCents, quoteExpiresAt: quoteExpiresAt.toISOString(), next: 'NUMBER' } }
  const base = { orderNo: made.orderNo, orderId: made.orderId, priceCents: q.priceCents, payMode: made.payMode, balanceCents: made.balanceCents, alipayCents: made.alipayCents, quoteExpiresAt: quoteExpiresAt.toISOString() }

  // 9a. 余额付清：同一请求确认（T3）；失败由 tick 的 T19 在 30 秒后补推进
  if (made.payMode === 'BALANCE') {
    try {
      await fulfillOrder(made.orderId, { via: 'BALANCE' })
    } catch (e) {
      console.error('[jiema] 余额付清单确认失败（T19 兜底）', made.orderId, (e as Error)?.message)
    }
    return { ok: true, data: { ...base, next: 'NUMBER' } }
  }

  // 9b. 组合 / 支付宝：同一请求发起收款单 + 事后复核；失败走 T18
  const withHold = made.balanceCents > 0
  const closeNow = async (why: string) => {
    try {
      const r = await closePending({ id: made.smsOrderId, orderId: made.orderId }, { reason: 'PAY_FAIL', actor: 'SYSTEM', invalidate: true })
      if (r !== 'CLOSED') console.warn(`[jiema] 下单请求里关单未关（${r}），${why}`, made.orderId)
    } catch (e) {
      console.error(`[jiema] 下单请求里关单失败（T4 ① 兜底），${why}`, made.orderId, (e as Error)?.message)
    }
  }
  let vmq: Awaited<ReturnType<typeof createOrGetVmqOrder>>
  try {
    if (payFaultForTest) payFaultForTest()
    const due = await payableCents(prisma, made.orderId)
    if (due == null || due <= 0) throw new VmqError('订单金额不正确')
    vmq = await createOrGetVmqOrder({ bizType: 'order', bizId: made.orderId, outTradeNo: made.orderNo, price: due / 100 })
  } catch (e) {
    if (!(e instanceof VmqError)) console.error('[jiema] 下单请求里发起收款失败', made.orderId, e)
    await closeNow('发起收款失败')
    return bad(503, 'PAY_BUSY', `当前付款人数较多，本单已取消${withHold ? '，预扣的余额已退回' : ''}，请稍后再试`)
  }
  if (vmq.created && (await countOpenOrderPayments(user.id)) > VMQ_MAX_OPEN_PER_USER) {
    await discardVmqOrder(vmq.orderId).catch((err) => console.error('[jiema] 超额收款单回滚失败', vmq.orderId, err))
    await closeNow('事后复核超过每人上限')
    return bad(429, 'OPEN_PAYMENTS', openPaymentsMsg(true, withHold), { released: true, items: await openPaymentItems(user.id).catch(() => []) })
  }
  return { ok: true, data: { ...base, next: 'CASHIER', payUrl: `/pay/${vmq.orderId}` } }
}

// 仅供 itest（§12.2 第 106 条）：注入「发起收款失败」
let payFaultForTest: (() => void) | null = null
export function setJiemaPayFaultForTest(fn: (() => void) | null): void {
  payFaultForTest = fn
}

// 仅供 itest（§12.2 第 53、102、108 条）：模拟「下单事务提交之后、确认 / 发起收款之前进程崩溃」
let crashAfterTxForTest = false
export function setJiemaCrashAfterTxForTest(v: boolean): void {
  crashAfterTxForTest = v
}
