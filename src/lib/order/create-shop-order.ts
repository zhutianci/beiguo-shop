/**
 * 全仓唯一允许 `order.create` 的地方（设计 5.4、8.1 第 6.7 步；边界检查规则 7 只放行本文件）。
 *
 * 【为什么收口成一个函数】渠道单的账全靠建单那一刻的快照：进货价、两个费率、冻结期、主站价。
 * 散在各处建单，迟早有一处漏写快照——付款时计提就只能置 MISSING（设计 8.3），等人工补记。
 * 所以 TS 类型里 tenantId 必填，渠道单的快照在这里**断言完整**，任何一条不满足就抛错（调用方回滚并告警），
 * 于是「付款时快照缺失」只可能是 bug。
 *
 * 【主站单】tenantId=1、channel 必须为空、快照列全部留 NULL，其余字段与改造前 tx.order.create 的 data 逐项相同
 * （主站回归 M2：订单 tenant_id=1、快照列为空、无分录）。
 *
 * 【备注双写过渡】（设计 5.4）买家备注对**所有订单**同时写 remark 与 buyerRemark：
 * remark 之后会被 sms.ts / vmq.ts 追加内部说明，从此视为内部字段；渠道 DTO 只读 buyerRemark。
 *
 * 【订单号撞号】orderNo 是全局唯一键（由 generateOrderNo 生成：日期 + 8 位随机）。P2002 撞在 order_no 上时换号重试，最多 3 次。
 * MySQL 里单条语句的唯一键冲突只回滚这一条语句、不中止事务（itest W2-10 实测 Prisma 交互式事务里重试可用）。
 */
import { Prisma } from '@prisma/client'
import { generateOrderNo } from '../utils'
import { toCents } from '../money'
import { LIMITS } from '../tenant/types'

const PLATFORM_TENANT_ID = 1

/** 渠道单快照（设计 5.4）。全部是下单那一刻的值，之后改渠道配置不追溯 */
export interface ChannelOrderSnapshot {
  listingId: number
  /** 进货价（分 / 件） */
  supplyUnitCents: number
  /** 进货款（分）= supplyUnitCents × quantity */
  supplyCents: number
  feeRateBp: number
  invoiceShareRateBp: number
  settleHoldDays: number
  /** 下单时主站定价（分 / 件），仅超管事后核对价差 */
  mainPriceCents: number
  /** 成员自买（设计 7.7）：SELF → 付款时 settleState=EXCLUDED、不写任何分录、不可开票 */
  settleExcludeReason: 'SELF' | null
}

export interface CreateShopOrderInput {
  /** 必填：来源站 = 店面 id（主站 1） */
  tenantId: number
  userId: number
  productId: number
  productName: string
  /** 单价（元）。渠道单 = 售价 */
  productPrice: number
  quantity: number
  /** 货款（元），**永远不含税** */
  amount: number
  invoiceTaxFee: number | null
  invoiceInfo: string | null
  /** 买家备注原文（同时写 remark 与 buyerRemark） */
  remark: string | null
  referrerId?: number | null
  referralReward?: number | null
  couponGrantId?: number | null
  couponDiscount?: number | null
  originalAmount?: number | null
  channel?: ChannelOrderSnapshot | null
}

/** 建单返回的最小字段（响应与通知够用；不含任何快照列） */
export interface CreatedShopOrder {
  id: number
  orderNo: string
  createdAt: Date
  payStatus: string
  deliveryStatus: string
}

/** 快照不完整 / 不自洽：只可能是调用方 bug。调用方回滚整单并告警平台（设计 5.4「拒单并告警」） */
export class ShopOrderSnapshotError extends Error {
  constructor(message: string) {
    super(`[create-shop-order] ${message}`)
    this.name = 'ShopOrderSnapshotError'
  }
}

const isNonNegInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
const isPosInt = (v: unknown): v is number => isNonNegInt(v) && v > 0

/**
 * 快照断言（设计 5.4），纯函数、可单测：
 *   tenantId≥2 ⇒ channel 全部非空；toCents(amount) ≥ supplyCents > 0；0 ≤ feeRateBp ≤ 2000；0 ≤ invoiceShareRateBp ≤ 600；
 *   另加三条自洽性：supplyCents = 进货价 × 件数、amount = 单价 × 件数（按分）、渠道单不带内推与券。
 *   tenantId=1 ⇒ channel 必须为空。
 */
export function assertShopOrderInput(input: CreateShopOrderInput): void {
  if (!Number.isInteger(input.tenantId) || input.tenantId < 1) throw new ShopOrderSnapshotError(`tenantId 非法：${input.tenantId}`)
  if (!isPosInt(input.userId) || !isPosInt(input.productId)) throw new ShopOrderSnapshotError('userId / productId 非法')
  if (!isPosInt(input.quantity)) throw new ShopOrderSnapshotError(`quantity 非法：${input.quantity}`)
  // 这里只拦 NaN / 负数。「> 0」只对渠道单要求（见下方 amountCents ≥ supplyCents > 0）：
  // 主站后台允许把商品价设成 0（admin/products 的 z.number().min(0)），改造前 0 元商品能正常建单（amount=0），
  // 休眠期主站行为必须逐字不变（设计 4.10 没把「拒 0 元单」列为可感知变化），所以主站保持原来的 ≥ 0 口径。
  if (!(typeof input.amount === 'number' && Number.isFinite(input.amount) && input.amount >= 0)) throw new ShopOrderSnapshotError('amount 非法')

  if (input.tenantId === PLATFORM_TENANT_ID) {
    if (input.channel) throw new ShopOrderSnapshotError('主站单不得带渠道快照')
    return
  }

  const c = input.channel
  if (!c) throw new ShopOrderSnapshotError(`渠道单（tenant ${input.tenantId}）缺少快照`)
  if (!isPosInt(c.listingId)) throw new ShopOrderSnapshotError('listingId 缺失')
  if (!isPosInt(c.supplyUnitCents)) throw new ShopOrderSnapshotError('进货价缺失或为 0')
  if (!isPosInt(c.supplyCents)) throw new ShopOrderSnapshotError('进货款缺失或为 0')
  if (c.supplyCents !== c.supplyUnitCents * input.quantity) throw new ShopOrderSnapshotError('进货款 ≠ 进货价 × 件数')
  if (!isNonNegInt(c.feeRateBp) || c.feeRateBp > LIMITS.maxFeeBp) throw new ShopOrderSnapshotError(`手续费率越界：${c.feeRateBp}`)
  if (!isNonNegInt(c.invoiceShareRateBp) || c.invoiceShareRateBp > LIMITS.maxInvShareBp) {
    throw new ShopOrderSnapshotError(`发票分成率越界：${c.invoiceShareRateBp}`)
  }
  if (!isNonNegInt(c.settleHoldDays)) throw new ShopOrderSnapshotError('冻结期缺失')
  if (!isNonNegInt(c.mainPriceCents)) throw new ShopOrderSnapshotError('主站价快照缺失')
  if (c.settleExcludeReason !== null && c.settleExcludeReason !== 'SELF') throw new ShopOrderSnapshotError('settleExcludeReason 非法')

  const amountCents = toCents(input.amount)
  const unitCents = toCents(input.productPrice)
  if (!isPosInt(unitCents) || amountCents !== unitCents * input.quantity) throw new ShopOrderSnapshotError('货款 ≠ 售价 × 件数')
  if (amountCents < c.supplyCents) throw new ShopOrderSnapshotError(`货款 ${amountCents} 低于进货款 ${c.supplyCents}`)
  // 渠道站营销硬关（设计 7.6）：这几列恒为空，否则计提与返现都会算错
  if (input.referrerId != null || input.referralReward != null || input.couponGrantId != null || input.couponDiscount != null || input.originalAmount != null) {
    throw new ShopOrderSnapshotError('渠道单不得带内推或优惠券字段')
  }
}

// 仅供 itest：注入固定订单号，覆盖「撞号换号重试」分支（真实概率极低，无法自然触发）
let orderNoGen: () => string = generateOrderNo
export function setOrderNoGenForTest(fn: (() => string) | null): void {
  orderNoGen = fn ?? generateOrderNo
}

function isOrderNoConflict(e: unknown): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== 'P2002') return false
  const target = (e.meta as { target?: unknown } | undefined)?.target
  const s = Array.isArray(target) ? target.join(',') : String(target ?? '')
  return /order_?no/i.test(s)
}

const yuan = (cents: number) => new Prisma.Decimal((cents / 100).toFixed(2))

export async function createShopOrder(tx: Prisma.TransactionClient, input: CreateShopOrderInput): Promise<CreatedShopOrder> {
  assertShopOrderInput(input)
  const remark = input.remark ?? null
  const c = input.channel ?? null

  const data: Omit<Prisma.OrderUncheckedCreateInput, 'orderNo'> = {
    tenantId: input.tenantId,
    userId: input.userId,
    productId: input.productId,
    productName: input.productName,
    productPrice: input.productPrice,
    quantity: input.quantity,
    // amount 永远是不含税货款。税费单独一列，收银台收 amount + invoiceTaxFee
    amount: input.amount,
    invoiceTaxFee: input.invoiceTaxFee,
    invoiceInfo: input.invoiceInfo,
    remark,
    buyerRemark: remark,
    referrerId: input.referrerId ?? null,
    referralReward: input.referralReward ?? null,
    couponGrantId: input.couponGrantId ?? null,
    couponDiscount: input.couponDiscount ?? null,
    originalAmount: input.originalAmount ?? null,
    ...(c
      ? {
          listingId: c.listingId,
          supplyUnitPrice: yuan(c.supplyUnitCents),
          supplyCents: c.supplyCents,
          feeRateBp: c.feeRateBp,
          invoiceShareRateBp: c.invoiceShareRateBp,
          settleHoldDays: c.settleHoldDays,
          mainPriceAtOrder: yuan(c.mainPriceCents),
          settleExcludeReason: c.settleExcludeReason,
        }
      : {}),
  }

  for (let attempt = 0; ; attempt++) {
    try {
      return await tx.order.create({
        data: { ...data, orderNo: orderNoGen() },
        select: { id: true, orderNo: true, createdAt: true, payStatus: true, deliveryStatus: true },
      })
    } catch (e) {
      if (attempt < 2 && isOrderNoConflict(e)) {
        console.warn(`[create-shop-order] 订单号撞号，换号重试（第 ${attempt + 1} 次）`)
        continue
      }
      throw e
    }
  }
}

// ---------------------------------------------------------------------------
// 渠道单快照里的「店面配置」部分（设计 8.1 第 6.5 步）：必须经下单事务的 tx 读
// ---------------------------------------------------------------------------

export interface ChannelOrderConfig {
  feeRateBp: number
  invoiceShareRateBp: number
  holdDays: number
}

// 仅供 itest W2-7：让「事务内读 tenant」失败，验证整单回滚、无半条订单
let configFault: (() => never) | null = null
export function setChannelConfigFaultForTest(fn: (() => never) | null): void {
  configFault = fn
}

/** 事务内读渠道当前费率与冻结期。读不到 → 抛（整单回滚），绝不用默认值顶上（没配置 = 不可售） */
export async function readChannelOrderConfig(tx: Prisma.TransactionClient, tenantId: number): Promise<ChannelOrderConfig> {
  if (!Number.isInteger(tenantId) || tenantId < 2) throw new ShopOrderSnapshotError(`渠道 id 非法：${tenantId}`)
  if (configFault) configFault()
  const t = await tx.tenant.findUnique({
    where: { id: tenantId },
    select: { feeRateBp: true, invoiceShareRateBp: true, holdDays: true },
  })
  if (!t) throw new ShopOrderSnapshotError(`渠道 ${tenantId} 不存在`)
  return { feeRateBp: t.feeRateBp, invoiceShareRateBp: t.invoiceShareRateBp, holdDays: t.holdDays }
}
