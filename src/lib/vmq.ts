import crypto from 'crypto'
import { Prisma, type VmqOrder } from '@prisma/client'
import { prisma } from './db'
import { syncAutoStock, decryptCardContent } from './cardkey'
import { round2, splitAmount } from './money'
import {
  notify,
  money,
  notifyOrderPaid,
  notifyInvoiceReady,
  notifyInvoiceFailed,
  notifyLowStock,
  notifyFulfillFailed,
  notifyVmqUnmatched,
} from './notify'
// 叶子模块，绝不能换成 './order-billing' —— 那个文件 import 了本文件，会形成循环依赖
import { materializeOrderInvoice } from './order-invoice'
import { consumeCouponForOrder, releaseCouponForOrder, sweepStuckCoupons } from './coupon'
import { financeInvoiceUrl } from './action-token'
import { settleReferral } from './referral'
// sms.ts 不反向 import 本文件，没有循环依赖；appendRemark 在那边按 Order.remark 的 255 字截断
import { acquireForOrder, appendRemark } from './sms'
import { sendOrderPaidEmail } from './mail'
// 渠道分站（WP3）：计提、事后开票分成、渠道通知、按订单 tenantId 取链接 origin。平台单（tenantId=1）全部第一行返回
import { accrueOnPaid, accrueInvoiceShare, isTxAbortingError } from './tenant/ledger'
import { emitTenantNotice } from './tenant/notice'
import { storefrontById } from './storefront/resolve'
import { tenantMailOpts } from './storefront/origin'

// ============ V免签式个人收款（监控收款码到账，按唯一金额匹配） ============

export const VMQ_KEY = process.env.VMQ_KEY || ''
export const VMQ_TIMEOUT_MIN = parseInt(process.env.VMQ_PAY_TIMEOUT || '20') // 订单有效期（分钟）
export const VMQ_TYPE_ALIPAY = 2

/**
 * 渠道单的平台群标签用租户 code（「[lulu]」）；主站返回 null（消息逐字不变）。
 * 查不到租户行时退回 `t<id>`，宁可标签难看也不能把渠道单当主站单推。
 */
async function siteCodeOf(tenantId: number): Promise<string | null> {
  if (tenantId === 1) return null
  const sf = await storefrontById(tenantId).catch(() => null)
  return sf?.code ?? `t${tenantId}`
}

/**
 * 履约失败告警用的站点标签（二期改动第 0 节「到账或履约异常照推站长，并标明来自哪个渠道」）：
 * 按业务单查 tenantId 再走 siteCodeOf，主站单 null（消息逐字不变）。
 * 这条路径本身就是出错之后：查询失败绝不能把告警吞掉，所以 catch 成 null —— 少一个标签，告警照发。
 */
async function siteCodeOfBiz(bizType: string, bizId: number): Promise<string | null> {
  try {
    const row =
      bizType === 'order'
        ? await prisma.order.findUnique({ where: { id: bizId }, select: { tenantId: true } })
        : bizType === 'invoice'
          ? await prisma.invoice.findUnique({ where: { id: bizId }, select: { tenantId: true } })
          : null
    return row ? await siteCodeOf(row.tenantId) : null
  } catch (e) {
    console.error('[vmq] 查业务单所属站点失败，告警不带站点标签', bizType, bizId, e)
    return null
  }
}

/**
 * 渠道单付款后是否要推站长「待人工发货 / 待补发」（二期改动 3.1 唯一例外：`!delivered && deliveryType !== 'SMS'`）。
 * 自动发货只在确有缺口时推（全部件已按件退掉、应发为 0 的不推）。返回 null = 不推。导出给 itest 断言。
 */
export function channelPendingDelivery(
  deliveryType: string,
  delivered: boolean,
  shortage: { owned: number; need: number } | null,
): { title: string; reason: string } | null {
  if (delivered || deliveryType === 'SMS') return null
  if (deliveryType === 'AUTO') {
    if (!shortage) return null
    return { title: '渠道单待补发', reason: `卡密库存不足（已发 ${shortage.owned}/${shortage.need}），补货后在订单页点「补发卡密」` }
  }
  return { title: '渠道单待人工发货', reason: '人工发货商品，请在订单页填写交付内容并标记已交付' }
}

/*
 * 金额冷却：一个金额刚被付款 / 超时 / 作废后，不马上分给下一张单。
 * 同一笔到账被重复推送（SmsForwarder 重试、通知被重新投递），或买家在收款单超时后才付款，
 * 这类「迟到的同额到账」只按金额匹配 —— 金额要是已经分给了新订单，就会把别人的待付单标成已付并自动发货。
 * 冷却期内它们一律落进「待人工核实的到账」，由站长核实后补单。设为 0 即关闭（回滚开关）。
 */
export const VMQ_REUSE_COOLDOWN_MIN = Math.max(0, parseInt(process.env.VMQ_REUSE_COOLDOWN_MIN || '15') || 0)

/**
 * 同一买家同时最多挂几张「待支付」商品收款单。每张都占一个唯一金额，而 allocateAmount 只有 50 格
 * 且全站共用：不设上限的话，一个账号建 50 张单各点一次付款，同价位的真实买家就全部「下单人数较多」。
 */
export const VMQ_MAX_OPEN_PER_USER = Math.max(1, parseInt(process.env.VMQ_MAX_OPEN_PER_USER || '3') || 3)

/*
 * 金额锁的宽限期：allocateAmount 建锁 → vmqOrder.create 之间有几毫秒，这时锁名下还没有收款单。
 * 原来只看「名下有没有待支付收款单」，另一个并发请求会把这把刚建的锁当陈旧锁删掉、拿走同一个金额。
 * 只有「超过宽限期、且名下没有待支付收款单」的锁才算陈旧。
 */
const LOCK_GRACE_MS = 2 * 60_000

export function vmqConfigured(): boolean {
  return !!VMQ_KEY
}

export function genOrderId(): string {
  // 时间 + 随机，保证不可枚举
  return Date.now().toString() + crypto.randomBytes(4).toString('hex')
}

function centsOf(price: number | string | Prisma.Decimal): number {
  return Math.round(Number(price) * 100)
}

// ---- 监控端心跳状态（存 Setting 表）----
async function getSetting(key: string): Promise<string | null> {
  const r = await prisma.setting.findUnique({ where: { key } })
  return r?.value ?? null
}
async function setSetting(key: string, value: string) {
  await prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } })
}

// SmsForwarder 没有心跳接口，这个时间戳现在由「收到一次通知转发」刷新，
// 语义是「最近一次收到转发的时间」，仅用于后台展示，不再作为下单门禁。
export async function touchHeartbeat() {
  await setSetting('vmq_lastheart', String(Date.now()))
}

/** 最近一次收到通知转发的时间（后台展示用；null 表示从未收到过） */
export async function lastNotifyAt(): Promise<number | null> {
  const last = await getSetting('vmq_lastheart')
  return last ? Number(last) : null
}

// ---- 过期订单清理 + 释放金额锁 ----
// 超时未支付：vmq 单置 -1、释放金额锁；对应商品订单标记「已取消」(防止价格冲突/重复占用)
export async function closeExpired(): Promise<number> {
  const cutoff = new Date(Date.now() - VMQ_TIMEOUT_MIN * 60_000)
  const expired = await prisma.vmqOrder.findMany({
    where: { state: 0, createdAt: { lt: cutoff } },
    select: { id: true, orderId: true, bizType: true, bizId: true },
  })
  // 【注意这个提前 return】没有过期收款单时也必须先跑一遍券的兜底清扫 ——
  // 恰恰是「买家下单后从未提交收款监控」这种情况根本不会产生 VmqOrder，
  // 也就永远不会有 expired，如果在这里直接返回，那类卡死的券就永远清不掉
  if (expired.length === 0) {
    await sweepStuckCoupons().catch((e) => console.error('[coupon] 兜底清扫失败', e))
    return 0
  }

  /*
   * 【逐条 CAS，只处理真的由本次翻成 -1 的那几条】
   * 原来是一条 updateMany 按 id 列表无条件写 -1。上面 findMany 与这里之间若恰好到账
   * （markPaidVmqOrder 已把某条 0→1），那条会被覆盖成 -1，它的订单（那一刻还没来得及
   * 翻成 PAID）被取消、券被放回；随后 fulfillOrder 照样把订单翻成 PAID ——
   * 结果是「已支付 + 已取消」的订单，券还能再用一次。
   * 现在条件带 state:0，没翻成功（已被到账抢先）的那条什么都不做：不删锁（到账那边自己删）、
   * 不取消订单、不释放券。
   *
   * 每条一个小事务：翻状态、删金额锁、取消订单三件事同进同退。某一条失败只记日志、
   * 下一分钟重试，不连累其它条 —— 金额锁卡住影响所有人（见下方释放券的注释）。
   */
  let closed = 0
  for (const e of expired) {
    try {
      const outcome = await prisma.$transaction(async (tx) => {
        const flip = await tx.vmqOrder.updateMany({ where: { id: e.id, state: 0 }, data: { state: -1 } })
        if (flip.count !== 1) return { flipped: false, releaseCoupon: false }
        await tx.vmqLock.deleteMany({ where: { orderId: e.orderId } })
        if (e.bizType !== 'order') return { flipped: true, releaseCoupon: false }
        // 商品订单：仅取消仍未支付的，避免误伤已付款订单
        await tx.order.updateMany({
          where: { id: e.bizId, payStatus: 'UNPAID', deliveryStatus: { in: ['PENDING', 'PROCESSING'] } },
          data: { deliveryStatus: 'CANCELLED' },
        })
        // 只有订单确实没付款才放券。已付款的单（例如后台手工标了已支付、核销那步又失败了）
        // 券若还是 LOCKED，交给 sweepStuckCoupons 按「已付款 → 补核销」自愈，不能在这里放回可用
        const o = await tx.order.findUnique({ where: { id: e.bizId }, select: { payStatus: true } })
        return { flipped: true, releaseCoupon: o?.payStatus === 'UNPAID' }
      })
      if (!outcome.flipped) continue
      closed++

      // 订单超时取消 → 把它占用的券放回去。
      // 放在事务之后单独做：券释放失败不该让「关闭过期收款单」这件事整个回滚，
      // 那会导致金额锁一直占着、后面的订单分配不到金额。券卡住只影响一个买家，
      // 金额锁卡住影响所有人 —— 两害相权。
      if (outcome.releaseCoupon) {
        await releaseCouponForOrder(e.bizId).catch((err) => console.error('[coupon] 超时释放失败', e.bizId, err))
      }
    } catch (err) {
      console.error('[vmq] 关闭过期收款单失败（下一轮重试）', e.orderId, err)
    }
  }

  // 兜底清扫卡死的券。放在这里是因为这个函数已经由 cron 每分钟调用，
  // 不必再为它单开一条定时任务。它按时间判定、不依赖订单关联，
  // 能救回「下单后从未提交收款监控」和「锁券后回填 orderId 失败」这两类
  // 靠上面那个循环永远够不着的券
  await sweepStuckCoupons().catch((e) => console.error('[coupon] 兜底清扫失败', e))

  // 真正由本次关掉的条数（被到账抢先的不算）
  return closed
}

// 冷却中的金额（分）。按 createdAt 取窗口，一个条件覆盖三种结束方式：付款（payDate ≤ createdAt+超时）、
// 超时关闭（≈ createdAt+超时）、后台作废（更早）—— 每种结束后都至少冷却 COOLDOWN 分钟。
async function coolingCents(type: number, selfOrderId: string): Promise<Set<number>> {
  if (VMQ_REUSE_COOLDOWN_MIN <= 0) return new Set()
  const since = new Date(Date.now() - (VMQ_TIMEOUT_MIN + VMQ_REUSE_COOLDOWN_MIN) * 60_000)
  const rows = await prisma.vmqOrder.findMany({
    // 排除自己：改价（updatePendingVmqAmount）时不能被自己的旧金额挡住
    where: { type, createdAt: { gte: since }, orderId: { not: selfOrderId } },
    select: { reallyPrice: true },
  })
  return new Set(rows.map((r) => centsOf(r.reallyPrice)))
}

// ---- 分配唯一金额并加锁 ----
// 先预查占用情况避免无谓的唯一约束冲突日志；遇到陈旧锁（占用者已支付/过期、且过了宽限期）自动清理复用
async function allocateAmount(basePrice: number, type: number, orderId: string): Promise<number> {
  // 冷却查询失败不能挡下单，退回旧规则（只看待支付锁）
  const cooling = await coolingCents(type, orderId).catch((e) => {
    console.error('[vmq] 冷却金额查询失败，本次只按待支付锁分配', e)
    return new Set<number>()
  })
  // 第一轮避开冷却中的金额；极端高峰下 50 个候选全在冷却时，第二轮退回旧规则 —— 冷却绝不能让买家下不了单
  for (const avoidCooling of cooling.size ? [true, false] : [false]) {
    let cents = centsOf(basePrice)
    for (let i = 0; i < 50; i++) {
      if (avoidCooling && cooling.has(cents)) {
        cents += 1
        continue
      }
      const lockKey = `${cents}-${type}`
      const existing = await prisma.vmqLock.findUnique({ where: { lockKey } })
      if (existing) {
        // 本单已持有这把锁（改价迁移时新金额恰好是本单手里的金额）→ 直接复用
        if (existing.orderId === orderId) return cents
        const live = await prisma.vmqOrder.findFirst({
          where: { orderId: existing.orderId, state: 0 },
          select: { id: true },
        })
        // Math.abs 同 marketing/lock.ts：createdAt 落在未来说明这行不可信，按陈旧处理
        const age = Math.abs(Date.now() - existing.createdAt.getTime())
        if (live || age < LOCK_GRACE_MS) {
          cents += 1 // 真有待支付订单占用，或是别人刚建、收款单还没落库的在途锁 → 换金额
          continue
        }
        // 陈旧锁按 id + orderId 精确删：并发的另一方可能已经删掉它、建了自己的新锁（同一个 lockKey），
        // 原来 delete where lockKey 会把别人刚建的锁一起删掉
        await prisma.vmqLock.deleteMany({ where: { id: existing.id, orderId: existing.orderId } }).catch(() => {})
      }
      try {
        // createdAt 显式写应用时间（同 marketing/lock.ts）：宽限期拿它和 Date.now() 比，不依赖库默认值 / 库时区
        await prisma.vmqLock.create({ data: { lockKey, orderId, createdAt: new Date() } })
        return cents
      } catch (e) {
        // 并发兜底：用 code 判定（避免跨模块实例导致 instanceof 失效）
        if ((e as { code?: string })?.code === 'P2002') {
          cents += 1
          continue
        }
        throw e
      }
    }
    if (avoidCooling) console.warn('[vmq] 50 个候选金额都在冷却期，退回只看待支付锁', basePrice, type)
  }
  throw new VmqError('当前下单人数较多，请稍后重试')
}

export class VmqError extends Error {}

function vmqResult(o: VmqOrder) {
  return {
    orderId: o.orderId,
    reallyPrice: Number(o.reallyPrice),
    price: Number(o.price),
    state: o.state,
    createdAt: o.createdAt,
  }
}

// ---- 创建或复用 V免签订单 ----
// 同一业务单已有「待支付」订单则复用，避免重复占用金额
export async function createOrGetVmqOrder(params: {
  bizType: 'order' | 'invoice'
  bizId: number
  outTradeNo: string
  price: number
  type?: number
}): Promise<{ orderId: string; reallyPrice: number; price: number; state: number; createdAt: Date; created: boolean }> {
  const type = params.type ?? VMQ_TYPE_ALIPAY
  if (!vmqConfigured()) throw new VmqError('收款未配置（缺少 VMQ_KEY）')
  if (params.price <= 0) throw new VmqError('金额必须大于 0')

  await closeExpired()

  // 注意：这里曾有「监控端离线则禁止下单」的拦截。SmsForwarder 没有心跳，
  // touchHeartbeat() 只在真实到账时被调用，而在线窗口只有 60 秒 —— 一分钟没进账就会把
  // 下单 / 再支付 / 发票税费 / 开票四条链路全部拦死。已随 VmqApk 一并移除，不要靠 env 兜。

  // 复用未过期的待支付订单（快路径，不加锁）
  const existing = await prisma.vmqOrder.findFirst({
    where: { bizType: params.bizType, bizId: params.bizId, state: 0 },
    orderBy: { createdAt: 'desc' },
  })
  // created：本次调用是否新建了这张收款单。复用的（包括下面锁内重查到别的标签页刚建的）都是 false ——
  // 调用方据此判断能不能回滚作废它：别人的那张可能已经在另一个标签页显示成二维码了
  if (existing) return { ...vmqResult(existing), created: false }

  const orderId = genOrderId()
  const cents = await allocateAmount(params.price, type, orderId) // 先占金额（锁有宽限期，不会被当陈旧锁删）
  const reallyPrice = cents / 100

  /*
   * 【按业务单串行化建单】原来「查有没有待支付单」和「建单」之间隔着 allocateAmount 的好几次往返，
   * 两个标签页并发发起支付会各建一张（140.00 和 140.01）。买家付完第一张，另一张还在要钱；
   * 他再付第二张，fulfillOrder 发现订单早已付款就静默返回 —— 第二笔钱没有任何人知道。
   * 这里锁住 orders / invoices 的那一行，在锁内重查一次再建。只有本函数会新建收款单，锁这里就够了。
   * 【READ COMMITTED】等到锁之后的重查必须看到对方刚提交的那行；RR 下会读到事务开始时的旧快照。
   * （需要 binlog_format=ROW/MIXED，mysql:8.0 默认 ROW。）
   * 不要改成对 vmq_orders 加 FOR UPDATE：RR 下那会加间隙锁，两个不同订单并发插入会互相死锁。
   */
  const r = await prisma.$transaction(
    async (tx) => {
      if (params.bizType === 'order') await tx.$queryRaw`SELECT id FROM orders WHERE id = ${params.bizId} FOR UPDATE`
      else await tx.$queryRaw`SELECT id FROM invoices WHERE id = ${params.bizId} FOR UPDATE`
      const again = await tx.vmqOrder.findFirst({
        where: { bizType: params.bizType, bizId: params.bizId, state: 0 },
        orderBy: { createdAt: 'desc' },
      })
      if (again) return { row: again, mine: false, stale: false, paidPending: false }
      // 已有一张到账的收款单、业务单却还没翻成已付款（履约失败，等 reconcilePaidVmq 补）：
      // 此时再建一张就是让买家付第二遍。商品订单在 pay/vmq/create 路由里已有同样的闸，
      // 发票税费的两条路径（invoices/[id]/pay、order-billing）靠这里（终审 2026-09-26）
      const paid = await tx.vmqOrder.findFirst({
        where: { bizType: params.bizType, bizId: params.bizId, state: 1 },
        select: { id: true },
      })
      if (paid) return { row: null, mine: false, stale: false, paidPending: true }
      /*
       * 【锁内复核业务单】调用方的标价来自事务外的一次读取。拿到锁之前，后台可能已经改了价、
       * closeExpired 可能把订单关成了已取消、或者站长手工标了已付款 —— 这时按旧价新建收款单，
       * 买家付的是旧价、订单按新价记账，而且没有任何告警（终审 2026-09-26）。复核不过就不建。
       */
      const cents = (v: unknown) => Math.round(Number(v ?? 0) * 100)
      let fresh = false
      if (params.bizType === 'order') {
        const o = await tx.order.findUnique({
          where: { id: params.bizId },
          select: { payStatus: true, deliveryStatus: true, amount: true, invoiceTaxFee: true },
        })
        fresh = !!o && o.payStatus === 'UNPAID' && o.deliveryStatus !== 'CANCELLED' &&
          cents(o.amount) + cents(o.invoiceTaxFee) === Math.round(params.price * 100)
      } else {
        const iv = await tx.invoice.findUnique({
          where: { id: params.bizId },
          select: { payStatus: true, status: true, taxFee: true },
        })
        fresh = !!iv && iv.payStatus !== 'PAID' && iv.status === 'AWAIT_PAY' && cents(iv.taxFee) === Math.round(params.price * 100)
      }
      if (!fresh) return { row: null, mine: false, stale: true, paidPending: false }
      const row = await tx.vmqOrder.create({
        data: {
          orderId,
          bizType: params.bizType,
          bizId: params.bizId,
          outTradeNo: params.outTradeNo,
          type,
          price: new Prisma.Decimal(params.price.toFixed(2)),
          reallyPrice: new Prisma.Decimal(reallyPrice.toFixed(2)),
          state: 0,
        },
      })
      return { row, mine: true, stale: false, paidPending: false }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 5_000, timeout: 10_000 }
  )
  // 抢输的一方 / 复核不过的一方：它占的金额锁没有任何收款单对应，立即释放（失败也无妨，过了宽限期会被当陈旧锁回收）。
  // 事务抛异常时刻意不删锁：万一事务其实已提交，删掉的就是一张活单的锁，会出现两张单同金额
  if (!r.mine) await prisma.vmqLock.deleteMany({ where: { orderId } }).catch(() => {})
  if (r.paidPending) throw new VmqError('这笔款项已收到，系统正在处理，请稍后刷新页面；长时间未更新请联系客服')
  if (r.stale || !r.row) throw new VmqError('订单状态或金额刚刚有变化，请刷新页面后重新发起支付')
  return { ...vmqResult(r.row), created: r.mine }
}

function openCutoff() {
  return new Date(Date.now() - VMQ_TIMEOUT_MIN * 60_000)
}

/**
 * 该买家名下仍在有效期内的待支付「商品」收款单张数（发票税费不计）。
 * 按收款单行数算、不按订单去重：同一订单并发发起两次会各占一个金额，也要各算一张。
 * 全站 state=0 的行受金额池限制、量很小，先取全站再按归属过滤（走 [state,type] 索引）。
 * 【数收款单、不数 UNPAID 订单】没发起过支付的订单永远不会被自动取消，数订单的话
 * 放弃过订单的正常用户会被永久锁住。
 */
export async function countOpenOrderPayments(userId: number): Promise<number> {
  const live = await prisma.vmqOrder.findMany({
    where: { bizType: 'order', state: 0, createdAt: { gte: openCutoff() } },
    select: { bizId: true },
  })
  if (!live.length) return 0
  const mine = await prisma.order.findMany({
    where: { id: { in: Array.from(new Set(live.map((v) => v.bizId))) }, userId },
    select: { id: true },
  })
  const ids = new Set(mine.map((o) => o.id))
  return live.filter((v) => ids.has(v.bizId)).length
}

/** 已有有效期内的待支付收款单 → createOrGetVmqOrder 会原样复用，不占新金额 */
export async function hasOpenPayment(bizType: 'order' | 'invoice', bizId: number): Promise<boolean> {
  return !!(await prisma.vmqOrder.findFirst({
    where: { bizType, bizId, state: 0, createdAt: { gte: openCutoff() } },
    select: { id: true },
  }))
}

/** 作废一张刚分配、还没交给买家的收款单（超过每人上限时回滚用）。CAS 带 state:0，只删它自己的锁 */
export async function discardVmqOrder(vmqOrderId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const r = await tx.vmqOrder.updateMany({ where: { orderId: vmqOrderId, state: 0 }, data: { state: -1 } })
    if (r.count === 1) await tx.vmqLock.deleteMany({ where: { orderId: vmqOrderId } })
  })
}

// 作废某业务单已存在的「待支付」收款单（如改价后，强制下次按新价重建）。
// 后台取消 / 退款订单时也会调它，让买家还开着的收银台再也匹配不上到账。
export async function invalidatePendingVmq(bizType: 'order' | 'invoice', bizId: number): Promise<number> {
  const pendings = await prisma.vmqOrder.findMany({
    where: { bizType, bizId, state: 0 },
    select: { id: true, orderId: true },
  })
  if (pendings.length === 0) return 0
  await prisma.$transaction([
    // 条件带 state:0：查完到这里之间恰好到账（已翻成 1）的那条不能被改写成「已过期」，
    // 否则收款单列表上一笔真实到账会显示成过期，对账时对不上（与 closeExpired 同一个坑）
    prisma.vmqOrder.updateMany({ where: { id: { in: pendings.map((p) => p.id) }, state: 0 }, data: { state: -1 } }),
    prisma.vmqLock.deleteMany({ where: { orderId: { in: pendings.map((p) => p.orderId) } } }),
  ])
  return pendings.length
}

// 改价：原地更新某业务单「待支付」收款单的金额，保持同一张收款单（同 orderId / 同付款链接），
// 并把金额锁从旧金额迁移到新分配的唯一金额。收银台轮询会自动刷新成新价、倒计时不重置。
// 返回更新后的收款单信息；若当前无待支付收款单则返回 null（下次发起支付时按新价创建）。
export async function updatePendingVmqAmount(
  bizType: 'order' | 'invoice',
  bizId: number,
  newPrice: number
): Promise<{ orderId: string; reallyPrice: number; price: number } | null> {
  if (newPrice <= 0) throw new VmqError('金额必须大于 0')

  const pendings = await prisma.vmqOrder.findMany({
    where: { bizType, bizId, state: 0 },
    orderBy: { createdAt: 'desc' },
  })
  if (pendings.length === 0) return null

  const target = pendings[0]
  const stale = pendings.slice(1)

  // 极端并发兜底：同业务存在多张待支付单时，只保留最新一张，其余作废
  if (stale.length) {
    await prisma.$transaction([
      // 同 closeExpired：条件里带 state:0，查出来之后才到账的那一张不能被覆盖成「已过期」
      prisma.vmqOrder.updateMany({ where: { id: { in: stale.map((p) => p.id) }, state: 0 }, data: { state: -1 } }),
      prisma.vmqLock.deleteMany({ where: { orderId: { in: stale.map((p) => p.orderId) } } }),
    ])
  }

  // 价格未变（精确到分）→ 无需迁移金额锁，直接返回现状
  if (centsOf(target.reallyPrice) === centsOf(newPrice) && centsOf(target.price) === centsOf(newPrice)) {
    return {
      orderId: target.orderId,
      reallyPrice: Number(target.reallyPrice),
      price: Number(target.price),
    }
  }

  /*
   * 【先占新锁，再原子地「改金额 + 放旧锁」】原来是先删旧锁再分配：分配失败（50 格占满 / 库抖动）
   * 或后面的 update 失败时，这张收款单仍是待支付、带着旧金额，旧金额却已经没有锁 ——
   * 新订单会拿到同一个金额，一笔到账同时对上两张单。现在旧锁一直留到新金额落库那一刻；
   * 任何一步失败都 fail closed：作废这张收款单（锁一并删），收银台显示已过期，买家重新发起即按新价。
   */
  let cents: number
  try {
    cents = await allocateAmount(newPrice, target.type, target.orderId)
  } catch (e) {
    // 订单金额已经改了，不能让买家继续按旧价付
    await invalidatePendingVmq(bizType, bizId).catch(() => {})
    throw e
  }
  const newKey = `${cents}-${target.type}`
  const reallyPrice = cents / 100

  let updated: VmqOrder | null
  try {
    updated = await prisma.$transaction(async (tx) => {
      const r = await tx.vmqOrder.updateMany({
        where: { id: target.id, state: 0 }, // CAS：期间已到账或已关闭的不改
        data: {
          price: new Prisma.Decimal(newPrice.toFixed(2)),
          reallyPrice: new Prisma.Decimal(reallyPrice.toFixed(2)),
        },
      })
      if (r.count !== 1) {
        // 已不是待支付：它名下的锁（含刚占的新锁）都没用了
        await tx.vmqLock.deleteMany({ where: { orderId: target.orderId } })
        return null
      }
      await tx.vmqLock.deleteMany({ where: { orderId: target.orderId, lockKey: { not: newKey } } })
      return tx.vmqOrder.findUnique({ where: { id: target.id } })
    })
  } catch (e) {
    // 事务已回滚：旧锁仍在、新锁归属活着的收款单；作废它，买家重新发起即按新价
    await invalidatePendingVmq(bizType, bizId).catch(() => {})
    throw e
  }
  if (!updated) return null

  return {
    orderId: updated.orderId,
    reallyPrice: Number(updated.reallyPrice),
    price: Number(updated.price),
  }
}

// ---- 到账：按金额匹配并标记业务已支付 ----
// 返回是否匹配到订单。raw 是通知原文，只用于「待人工核实的到账」留痕
export async function markPaidByAmount(price: string, type: number, raw?: string): Promise<boolean> {
  const cents = centsOf(price)
  const rawShort = raw ? raw.slice(0, 500) : undefined
  // 记录最近一次到账推送（用于后台诊断「监控端确实在推送」）
  await setSetting('vmq_lastpay', JSON.stringify({ price, type, cents, at: Date.now() }))
  // 必须在匹配之前查并登记：重复转发往往在第一次还在履约时就到了
  const repeatForward = await seenRawRecently(raw)

  // 取该渠道所有待支付单，按 cents 精确匹配（避免浮点误差）
  const pendings = await prisma.vmqOrder.findMany({ where: { state: 0, type } })
  const hits = pendings.filter((o) => centsOf(o.reallyPrice) === cents)
  if (hits.length > 1) {
    /*
     * 【同一金额同时命中多张待支付单】金额锁本该保证不会出现，但锁一旦出过岔子（历史数据、人工改库），
     * 原来按 findMany 的顺序取第一张 —— X 付的钱可能给 Y 发了货。宁可转人工，不猜。
     */
    console.error(`[vmq] 到账 ${price} 同时命中 ${hits.length} 张待支付收款单，不自动履约，转人工`, hits.map((h) => h.orderId))
    await recordUnmatched({
      reason: 'ambiguous_match',
      price,
      type,
      cents,
      candidates: hits.map((h) => `${h.orderId}(${h.bizType}#${h.bizId})`),
      raw: rawShort,
    })
    return false
  }
  const target = hits[0]
  if (!target) {
    const pendingList = pendings.map((o) => Number(o.reallyPrice))
    console.warn(`[vmq] 到账 ${price}(${cents}分) type=${type} 未匹配到待支付订单；当前待支付金额=`, pendingList)
    /*
     * 10 分钟内同金额刚到过账：可能是同一条通知被重复转发（第二次到达时收款单已是 1、锁已释放），
     * 也可能是买家扫同一个码付了两次 —— 后者是真钱、要退款，绝不能静默。
     * 只有「原文一字不差、且 REPEAT_FORWARD_MS 内出现过」才认定是重复转发、自动归档不推送；
     * 其余一律进待处理并推送（宁可多吵醒一次站长，不漏一笔要退的钱）。
     */
    const recentPaid = await prisma.vmqOrder.findFirst({
      where: {
        type,
        state: 1,
        payDate: { gte: new Date(Date.now() - 10 * 60_000) },
        reallyPrice: new Prisma.Decimal((cents / 100).toFixed(2)),
      },
      orderBy: { payDate: 'desc' },
      select: { orderId: true, bizType: true, bizId: true },
    })
    await recordUnmatched(
      recentPaid
        ? {
            reason: 'maybe_duplicate',
            price,
            type,
            cents,
            vmqOrderId: recentPaid.orderId,
            biz: `${recentPaid.bizType}#${recentPaid.bizId}`,
            raw: rawShort,
            repeatForward,
          }
        : { reason: 'no_pending_match', price, type, cents, pending: pendingList.slice(0, 30), raw: rawShort }
    )
    return false
  }

  const settled = await markPaidVmqOrder(target)
  if (settled === 'closed') {
    /*
     * 【到账了、但这张收款单在匹配的一瞬间被关掉了】findMany 时它还是待支付，
     * 翻转时已被超时清理（closeExpired）或后台取消/改价作废成 -1。钱是真收到了，
     * 而这一单已经取消、券可能已放回 —— 不能自动替它履约（同金额可能已分配给新订单）。
     * 原来这里照样打「匹配成功」的日志并返回 true，这笔钱就在所有地方都看不见了。
     * 现在进「待人工核实的到账」并推送企业微信，由管理员核实后手动补单。
     */
    console.warn(`[vmq] 到账 ${price} 匹配到的收款单 ${target.orderId} 已在同一时刻被关闭，转人工核实`)
    await recordUnmatched({
      reason: 'closed_while_matching',
      price,
      type,
      cents,
      vmqOrderId: target.orderId,
      biz: `${target.bizType}#${target.bizId}`,
      raw: rawShort,
    })
    return false
  }
  if (settled === 'duplicate') {
    /*
     * 【钱记到了这张收款单上，但业务单此前已付款 / 已退款】两个标签页各开了一张收银台、
     * 买家两张都付了，或后台先手工标了已付款。fulfillOrder 原来会静默返回，这里打「匹配成功」，
     * 第二笔钱没有任何人知道。现在转人工退款。返回 true：收款单确实被匹配到了。
     */
    console.warn(`[vmq] 到账 ${price} 记到收款单 ${target.orderId}，但 ${target.bizType}#${target.bizId} 此前已付款/已退款 —— 疑似重复付款`)
    await recordUnmatched({
      reason: 'duplicate_payment',
      price,
      type,
      cents,
      vmqOrderId: target.orderId,
      biz: `${target.bizType}#${target.bizId}`,
      outTradeNo: target.outTradeNo,
      raw: rawShort,
    })
    return true
  }
  console.log(`[vmq] 到账匹配成功 ${price} -> ${target.bizType}#${target.bizId} (orderId=${target.orderId})`)
  return true
}

/*
 * 【重复转发识别】SmsForwarder 重试 / 通知被系统重新投递时，同一条通知原文会在几秒内再到一次。
 * 最近收到的原文摘要存在一行 setting 里（最多 50 条、只留 REPEAT_FORWARD_MS 内的）。
 * 窗口刻意很短：买家扫同一个码再付一次至少要十几秒到几十秒，而同额两笔的通知原文可能一模一样，
 * 窗口放长就会把真实的重复付款当成重复转发吞掉。读写失败 / 并发覆盖只会让它认不出 → 进人工并推送，方向是安全的。
 */
const RECENT_RAW_KEY = 'vmq_recentraw'
const REPEAT_FORWARD_MS = 60_000

async function seenRawRecently(raw?: string): Promise<boolean> {
  if (!raw) return false
  const h = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16)
  const now = Date.now()
  try {
    let list: Array<{ h: string; at: number }> = []
    try {
      const v = JSON.parse((await getSetting(RECENT_RAW_KEY)) || '[]')
      if (Array.isArray(v)) list = v.filter((e) => e && typeof e.h === 'string' && typeof e.at === 'number')
    } catch {
      list = []
    }
    list = list.filter((e) => now - e.at >= 0 && now - e.at < REPEAT_FORWARD_MS)
    const seen = list.some((e) => e.h === h)
    await setSetting(RECENT_RAW_KEY, JSON.stringify([...list.filter((e) => e.h !== h), { h, at: now }].slice(-50)))
    return seen
  } catch (e) {
    console.error('[vmq] 重复转发登记失败（本次按非重复处理）', e)
    return false
  }
}

/**
 * 标记某条 vmq 订单已支付并履约（仅到账匹配使用）。
 *  - 'settled'   正常：本次或此前（重复推送）已记到这张收款单并履约
 *  - 'closed'    这张收款单在翻转前已被关闭成 -1，这笔钱没有着落，调用方要转人工
 *  - 'duplicate' 翻转成功，但业务单此前已不是待付款（被另一张收款单付过 / 人工标过已付 / 已退款）
 */
async function markPaidVmqOrder(
  v: Pick<VmqOrder, 'id' | 'bizType' | 'bizId' | 'orderId' | 'outTradeNo' | 'reallyPrice'>
): Promise<'settled' | 'closed' | 'duplicate'> {
  // 原子翻转：state 0→1。并发下（同一笔到账被重复推送）只有一次能成功，
  // 其余 count===0 直接跳过履约，从入口处就避免重复发货。
  const flip = await prisma.vmqOrder.updateMany({
    // 连同匹配时看到的金额一起钉住：读 pendings 与翻转之间后台改价迁移了这张收款单的话，
    // 买家付的是旧价、单子已是新价，不能照记（终审 2026-09-26）。落空后 state 仍为 0 → 'closed' → 转人工
    where: { id: v.id, state: 0, reallyPrice: v.reallyPrice },
    data: { state: 1, payDate: new Date() },
  })
  if (flip.count !== 1) {
    // 没抢到有两种情况，必须分开：同一笔到账被重复推送（已经是 1，正常，算匹配成功）；
    // 或者它刚被关闭成 -1（这笔钱没有着落，让调用方转人工）
    const now = await prisma.vmqOrder.findUnique({ where: { id: v.id }, select: { state: true } })
    return now?.state === 1 ? 'settled' : 'closed'
  }
  // 释放金额锁失败不要紧：收款单已是 1，allocateAmount 过了宽限期会按陈旧锁回收。
  // 但绝不能让它抛出去 —— 这时钱已经记在收款单上了（见下面 catch 的注释）
  await prisma.vmqLock
    .deleteMany({ where: { orderId: v.orderId } })
    .catch((e) => console.error('[vmq] 释放金额锁失败（allocateAmount 会按陈旧锁回收）', v.orderId, e))
  try {
    let won = true
    if (v.bizType === 'order') won = await fulfillOrder(v.bizId)
    else if (v.bizType === 'invoice') won = await fulfillInvoice(v.bizId)
    return won ? 'settled' : 'duplicate'
  } catch (e) {
    /*
     * 【不再 throw】这笔钱已经记在这张收款单上（state=1、金额锁已释放）。原来 rethrow → webhook 回 500
     * → SmsForwarder 重推，而同一金额这时可能已分给了新订单，会把别人的单标成已支付；
     * 同时订单永远停在「待支付」、没人发货。现在推告警，由 cron 的 reconcilePaidVmq 在宽限期后补做。
     * 注意 flip 之前的失败（库挂了）仍会抛出去回 500，让 SmsForwarder 重试 —— 那时什么都还没提交。
     */
    console.error('[vmq] 到账后履约失败，交给对账任务', v.bizType, v.bizId, e)
    notifyFulfillFailed({
      site: await siteCodeOfBiz(v.bizType, v.bizId),
      biz: `${v.bizType}#${v.bizId}`,
      outTradeNo: v.outTradeNo,
      amount: v.reallyPrice,
      stage: '到账履约',
      reason: e instanceof Error ? e.message : String(e),
      action:
        '订单若仍是「待支付」，系统约 3 分钟后自动补履约；若已是「已付款」，请到订单管理核对发货（自动发货商品点「补发卡密」）',
    })
    return 'settled'
  }
}

// ---- 待人工核实的到账（每条一行，只插不改；不改 schema，复用 settings 表）----
// Setting.key 是 VarChar(50)：'vmq_unmatched:'(14) + 13 位毫秒 + '-' + 8 hex = 36。
// 毫秒数到 2286 年都是 13 位，按 key 字典序排序就是按时间排序，还能走 key 的唯一索引。
// 【为什么不再只写一个 vmq_lastunmatched】那是按 key 覆盖的一行，而支付宝每笔到账都跟着一条
// 「上一笔播报」、还有营销通知，一条真实的未匹配到账往往几秒后就被冲掉，后台看不到、也没推送。
const UNMATCHED_PREFIX = 'vmq_unmatched:'
export const UNMATCHED_KEY_RE = /^vmq_unmatched:\d{13}-[0-9a-f]{8}$/

export type UnmatchedReason =
  | 'no_pending_match' // 到账金额没有对应的待支付单（买家付错金额 / 收款单已过期后才付）
  | 'closed_while_matching' // 匹配到的收款单在同一瞬间被关闭
  | 'maybe_duplicate' // 10 分钟内同金额刚到过账：原文相同且 1 分钟内的算重复转发（自动归档），其余可能是买家付了两次（待处理 + 推送）
  | 'ambiguous_match' // 同一金额同时命中多张待支付单
  | 'duplicate_payment' // 记到了收款单，但业务单此前已付款 / 已退款
  | 'ambiguous_amount' // 同一条通知里出现多个不同的到账金额
  | 'untrusted_source' // 通知带着「成功收款X元」，但来源 App 不是支付宝

export interface UnmatchedEntry {
  reason: UnmatchedReason
  price: string
  type: number
  cents?: number
  pending?: number[]
  candidates?: string[]
  vmqOrderId?: string
  biz?: string
  outTradeNo?: string
  from?: string | null
  raw?: string
  /** 仅 maybe_duplicate：原文与 1 分钟内的某条通知一字不差 → 认定为重复转发、自动归档 */
  repeatForward?: boolean
  at: number
  handledAt?: number | null
  handledBy?: string | number | null
}

async function recordUnmatched(e: Omit<UnmatchedEntry, 'at' | 'handledAt' | 'handledBy'>) {
  const at = Date.now()
  // 认定为重复转发（原文相同且 1 分钟内）：不推送、不写「最近一次」，但**仍留在待处理队列**等站长对一眼账。
  // 【为什么不自动归档】终审 2026-09-26：后台下发的 SmsForwarder 模板里没有时间戳，
  // 老顾客 1 分钟内对同一个码真付两次同样的金额，两条通知原文一字不差 —— 自动归档就是一笔要退的钱没人知道。
  // 同金额但原文不同 / 超过 1 分钟的 maybe_duplicate 可能是买家付了两次，照常待处理 + 推送
  const auto = e.reason === 'maybe_duplicate' && e.repeatForward === true
  const entry: UnmatchedEntry = { ...e, at, handledAt: null, handledBy: null }
  try {
    // 兼容旧前端和回滚：继续写「最近一次」，但现在只有需要人工处理的才写它
    if (!auto) await setSetting('vmq_lastunmatched', JSON.stringify(entry))
    const key = `${UNMATCHED_PREFIX}${at}-${crypto.randomBytes(4).toString('hex')}`
    await prisma.setting.create({ data: { key, value: JSON.stringify(entry) } })
  } catch (err) {
    // 落库失败也不能让 webhook 500，也不能改变匹配结果；把完整数据留在日志里
    console.error('[vmq] 未匹配到账留存失败', JSON.stringify(entry), err)
  }
  if (!auto) notifyVmqUnmatched(entry) // fire-and-forget
}

/*
 * 【待处理与已处理分开取】原来只取最新 100 行（含已处理、自动归档的），再由前端筛未处理 ——
 * 行只插不删，100 行之后的未处理记录会从后台静默消失，页面显示「没有待处理」而真钱还在等人看。
 * 现在：未处理的全部取出（按 value 里的 "handledAt":null 过滤，JSON.stringify 的写法固定；
 * 量很小，上限 OPEN_CAP 只防异常），已处理的只取最新 limit 条做历史。
 * 两组合并后按 key 倒序（= 按时间倒序），前端 filter(!handledAt) 的用法不变。
 */
const OPEN_CAP = 500
const OPEN_MARK = '"handledAt":null'

export async function listUnmatched(limit = 100): Promise<Array<UnmatchedEntry & { key: string }>> {
  const [open, handled] = await Promise.all([
    prisma.setting.findMany({
      where: { key: { startsWith: UNMATCHED_PREFIX }, value: { contains: OPEN_MARK } },
      orderBy: { key: 'desc' },
      take: OPEN_CAP,
    }),
    prisma.setting.findMany({
      where: { key: { startsWith: UNMATCHED_PREFIX }, NOT: { value: { contains: OPEN_MARK } } },
      orderBy: { key: 'desc' },
      take: limit,
    }),
  ])
  if (open.length >= OPEN_CAP) console.error(`[vmq] 待人工核实的到账超过 ${OPEN_CAP} 条，后台只显示最新 ${OPEN_CAP} 条`)
  const rows = [...open, ...handled].sort((a, b) => (a.key < b.key ? 1 : a.key > b.key ? -1 : 0))
  return rows.flatMap((r) => {
    try {
      return [{ ...(JSON.parse(r.value) as UnmatchedEntry), key: r.key }]
    } catch {
      return []
    }
  })
}

export async function markUnmatchedHandled(key: string, by: string | number): Promise<void> {
  if (!UNMATCHED_KEY_RE.test(key)) throw new VmqError('记录不存在')
  const row = await prisma.setting.findUnique({ where: { key } })
  if (!row) throw new VmqError('记录不存在')
  let v: UnmatchedEntry
  try {
    v = JSON.parse(row.value) as UnmatchedEntry
  } catch {
    throw new VmqError('记录已损坏')
  }
  if (v.handledAt) return // 幂等
  await prisma.setting.update({
    where: { key },
    data: { value: JSON.stringify({ ...v, handledAt: Date.now(), handledBy: by }) },
  })
}

// ---- 到账对账：收款单已到账、业务单却还没付款的，由 cron 补做履约 ----
// 只能挂在每分钟一次的 cron 路由上，绝不能挂进 closeExpired：closeExpired 每次收银台轮询 / 发起支付都会跑，
// 那样会和到账那一次履约并发执行。宽限 3 分钟远大于事务 5s / 连接池 10s 的超时，到账那一次早已结束。
const RECONCILE_GRACE_MS = 3 * 60_000
const RECONCILE_LOOKBACK_MS = 24 * 3600_000

/** 同一张收款单的对账告警只推一次（settings 表按 key 唯一）。记不下来宁可重复推，也不漏推 */
async function firstAlert(vmqId: number): Promise<boolean> {
  try {
    await prisma.setting.create({ data: { key: `vmqrec:${vmqId}`, value: String(Date.now()) } })
    return true
  } catch (e) {
    return (e as { code?: string })?.code !== 'P2002'
  }
}

export async function reconcilePaidVmq(): Promise<{ fixed: number; pending: number }> {
  const now = Date.now()
  const since = new Date(now - RECONCILE_LOOKBACK_MS)
  const until = new Date(now - RECONCILE_GRACE_MS)
  /*
   * 【先在库里筛出「卡住」的，再取 200 条】原来先取窗口内最早的 200 张已到账收款单、再在内存里筛卡住的：
   * 生意好的一天 24h 内超过 200 笔到账，刚卡住的那张根本进不了这一批，要等更早的滑出窗口（可能好几个小时），
   * 期间买家的单一直是待支付、收银台一直说「已收到付款，处理中」。
   * 现在 JOIN 业务单，只取「收款单已到账、业务单还没付」的；按到账时间倒序，新卡住的优先 ——
   * 转人工的那几类（已取消 / 有流水）在 24h 窗口里会一直被筛出来，不能让它们把新卡住的挤掉。
   * 下面对 orders / invoices 的二次查询保留：拿 deliveryStatus，且以 Prisma 的读法为准再确认一遍。
   */
  const stuckIds = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id, pay_date FROM (
      SELECT v.id, v.pay_date FROM vmq_orders v JOIN orders o ON o.id = v.biz_id
       WHERE v.biz_type = 'order' AND v.state = 1 AND v.pay_date >= ${since} AND v.pay_date <= ${until}
         AND o.pay_status = 'UNPAID'
      UNION ALL
      SELECT v.id, v.pay_date FROM vmq_orders v JOIN invoices i ON i.id = v.biz_id
       WHERE v.biz_type = 'invoice' AND v.state = 1 AND v.pay_date >= ${since} AND v.pay_date <= ${until}
         AND i.pay_status <> 'PAID'
    ) t
    ORDER BY pay_date DESC
    LIMIT 200`
  if (!stuckIds.length) return { fixed: 0, pending: 0 }
  const rows = await prisma.vmqOrder.findMany({
    where: { id: { in: stuckIds.map((r) => Number(r.id)) } },
    select: { id: true, orderId: true, bizType: true, bizId: true, outTradeNo: true, reallyPrice: true },
    orderBy: { payDate: 'desc' },
  })
  const oIds = rows.filter((r) => r.bizType === 'order').map((r) => r.bizId)
  const iIds = rows.filter((r) => r.bizType === 'invoice').map((r) => r.bizId)
  const orders = oIds.length
    ? await prisma.order.findMany({ where: { id: { in: oIds }, payStatus: 'UNPAID' }, select: { id: true, deliveryStatus: true } })
    : []
  const invoices = iIds.length
    ? await prisma.invoice.findMany({ where: { id: { in: iIds }, payStatus: { not: 'PAID' } }, select: { id: true } })
    : []
  const stuckO = new Map(orders.map((o) => [o.id, o]))
  const stuckI = new Set(invoices.map((i) => i.id))
  // 真正「卡住」的订单一定没有支付流水（fulfillOrder 的翻 PAID 事务连同流水一起没提交）。
  // 有流水却是待支付，说明是被人工改回待支付的（后台接口允许传 payStatus），不能自动再翻一次、再记一次流水和销量
  const hasPayment = new Set(
    stuckO.size
      ? (
          await prisma.payment.findMany({
            where: { orderId: { in: Array.from(stuckO.keys()) } },
            select: { orderId: true },
          })
        ).map((p) => p.orderId)
      : []
  )
  let fixed = 0
  let pending = 0
  for (const v of rows) {
    const o = v.bizType === 'order' ? stuckO.get(v.bizId) : undefined
    if (v.bizType === 'order' ? !o : !stuckI.has(v.bizId)) continue
    const base = { biz: `${v.bizType}#${v.bizId}`, outTradeNo: v.outTradeNo, amount: v.reallyPrice, stage: '到账对账' }
    // 只在真要发告警时才查站点（firstAlert 之后），免得每分钟对账为每行多一次查询
    if (o && (o.deliveryStatus === 'CANCELLED' || hasPayment.has(o.id))) {
      // 已取消：可能是线下退了款后取消的；有流水：被人工改回过待支付。都不自动发货，转人工
      pending++
      if (await firstAlert(v.id)) {
        notifyFulfillFailed({
          ...base,
          site: await siteCodeOfBiz(v.bizType, v.bizId),
          reason:
            o.deliveryStatus === 'CANCELLED'
              ? '收款单已到账，但订单是「待支付 + 已取消」'
              : '收款单已到账，订单有支付流水却是「待支付」（疑似被人工改回）',
          action: '核实到账后，在订单管理把订单改回正确状态，或联系买家退款',
        })
      }
      continue
    }
    try {
      if (v.bizType === 'order') {
        // 先关掉卡住期间买家可能又发起的那张待支付收款单，防止二次付款无人知晓（只动 state=0）
        await invalidatePendingVmq('order', v.bizId)
        await fulfillOrder(v.bizId) // CAS 赢家会照常推「订单已支付」、发邮件
      } else {
        await fulfillInvoice(v.bizId) // CAS，赢家会推「可开具」
      }
      fixed++
      console.warn('[vmq] 对账补履约完成', v.orderId, base.biz)
    } catch (e) {
      pending++
      console.error('[vmq] 对账补履约失败（下一分钟重试）', v.orderId, e)
      if (await firstAlert(v.id)) {
        notifyFulfillFailed({
          ...base,
          site: await siteCodeOfBiz(v.bizType, v.bizId),
          reason: e instanceof Error ? e.message : String(e),
          action: '系统每分钟重试；长时间未恢复请人工处理',
        })
      }
    }
  }
  return { fixed, pending }
}

// 后台手动补单（确认到账）：无视金额/状态，强制标记该 vmq 订单已支付并履约
export async function manualComplete(vmqOrderId: number): Promise<void> {
  const o = await prisma.vmqOrder.findUnique({ where: { id: vmqOrderId } })
  if (!o) throw new VmqError('收款单不存在')
  // 管理员强制确认：无条件标记已支付 + 释放金额锁（即使已过期 state=-1 也能补单）
  await prisma.$transaction([
    prisma.vmqOrder.update({ where: { id: o.id }, data: { state: 1, payDate: o.payDate ?? new Date() } }),
    prisma.vmqLock.deleteMany({ where: { orderId: o.orderId } }),
  ])
  try {
    // fulfillOrder 自身幂等（原子占单 + 只补缺口），重复调用不会重复发卡/记账
    if (o.bizType === 'order') await fulfillOrder(o.bizId)
    else if (o.bizType === 'invoice') await fulfillInvoice(o.bizId)
  } catch (e) {
    console.error('[vmq] 补履约失败', e)
    throw e
  }
}

// 最近收款单（后台诊断用）
export async function recentVmqOrders(limit = 15) {
  const list = await prisma.vmqOrder.findMany({ orderBy: { createdAt: 'desc' }, take: limit })
  return list.map((o) => ({
    id: o.id,
    orderId: o.orderId,
    bizType: o.bizType,
    bizId: o.bizId,
    outTradeNo: o.outTradeNo,
    price: Number(o.price),
    reallyPrice: Number(o.reallyPrice),
    state: o.state,
    createdAt: o.createdAt,
    payDate: o.payDate,
  }))
}

export async function getDiag() {
  const [lastpay, lastunmatched, lastwebhook] = await Promise.all([
    getSetting('vmq_lastpay'),
    getSetting('vmq_lastunmatched'),
    getSetting('vmq_lastwebhook'),
  ])
  const safe = (s: string | null) => {
    if (!s) return null
    try {
      return JSON.parse(s)
    } catch {
      return null
    }
  }
  return {
    lastPush: safe(lastpay),
    lastUnmatched: safe(lastunmatched),
    lastWebhook: safe(lastwebhook),
  }
}

// ============ SmsForwarder 等「通知转发」Webhook 模式 ============
// 服务端解析通知文案中的金额（比监控端 App 死文案宽松），按金额匹配订单

export function detectChannel(text: string): number {
  if (/微信|wechat|weixin|tenpay|com\.tencent\.mm|收款助手/i.test(text)) return 1
  return 2 // 默认支付宝
}

export type AmountReject = 'empty' | 'broadcast_rejected' | 'no_strong_signal' | 'ambiguous' | 'untrusted_source'
/** amounts 仅 reason=ambiguous 时带：通知里出现的各个不同金额 */
export type AmountParse = { ok: true; amount: string } | { ok: false; reason: AmountReject; amounts?: string[] }

// 支付宝收钱码会发两类通知，只有第二类代表「这一笔钱到账了」：
//   ①「上一笔播报：支付宝到账 1430.00 元。收钱提醒助手正在为您服务」
//      —— 这是上一笔订单的金额，拿来匹配会把别人的订单标记成已支付，必须拒绝。
//   ②「已转入余额 可兑1000收款免费额度>> 你已成功收款1430.00元（老顾客消费）」
//      —— 这才是本次实收金额。
// 又因为 SmsForwarder 会把 content / org_content / title / from 拼成一长串，同一金额会出现 2~3 次、
// 且不同来源的文本混在一起，所以只能做「强信号词 + 紧邻金额」的匹配，不能对整串跑宽松正则。
const STRONG_SIGNAL = /(?:你已成功收款|已成功收款|成功收款)\s*[¥￥]?\s*(\d+(?:\.\d{1,2})?)\s*元/g
// 播报类关键词：出现在强信号词之前的近距离窗口内，说明这是「上一笔」的回顾而非本次到账
const BROADCAST_HINT = /上一笔|上笔播报|历史播报|最近一笔/

export function parseAmountDetailed(text: string): AmountParse {
  if (!text || !text.trim()) return { ok: false, reason: 'empty' }
  const t = text.replace(/,/g, '')

  STRONG_SIGNAL.lastIndex = 0
  let m: RegExpExecArray | null
  let sawStrong = false
  let first: string | null = null
  // 不在第一个命中处返回：收集全部非播报命中，再看它们是不是同一个金额
  const seen = new Map<number, string>()
  while ((m = STRONG_SIGNAL.exec(t)) !== null) {
    sawStrong = true
    // 强信号词前 24 字内出现「上一笔」之类 → 这一处是播报回顾，跳过继续找下一处
    if (BROADCAST_HINT.test(t.slice(Math.max(0, m.index - 24), m.index))) continue
    if (first === null) first = m[1]
    const c = Math.round(Number(m[1]) * 100)
    if (!seen.has(c)) seen.set(c, m[1])
  }
  // 同一条通知出现两个不同的「本次到账」金额：不是到账模板该有的样子（可能是备注 / 昵称夹带，
  // 或两笔合并成一条），取第一个可能把钱记到别人的单上 → 转人工。同额不同写法（1430 / 1430.00）照常取用
  if (seen.size > 1) return { ok: false, reason: 'ambiguous', amounts: Array.from(seen.values()) }
  if (first !== null) return { ok: true, amount: first }

  // 有强信号但全被播报前缀否掉
  if (sawStrong) return { ok: false, reason: 'broadcast_rejected' }
  // 没有强信号，但明显是播报/到账类文案（如「上一笔播报：支付宝到账 1430.00 元」）→ 明确标注原因，
  // 便于后台区分「被新规则拒了」和「文案没覆盖到」
  if (BROADCAST_HINT.test(t) || /到账|收钱提醒/.test(t)) return { ok: false, reason: 'broadcast_rejected' }
  return { ok: false, reason: 'no_strong_signal' }
}

/** 兼容旧调用：只要金额字符串 */
export function parseAmount(text: string): string | null {
  const r = parseAmountDetailed(text)
  return r.ok ? r.amount : null
}

export const AMOUNT_REJECT_LABELS: Record<AmountReject, string> = {
  empty: '空内容',
  broadcast_rejected: '播报类通知（上一笔金额），已按规则拒绝',
  no_strong_signal: '未出现「你已成功收款X元」强信号，未取用',
  ambiguous: '同一条通知出现多个不同的到账金额，未自动取用（请核实后补单）',
  untrusted_source: '通知来源不是支付宝 App，未取用',
}

// SmsForwarder 应用通知的 [from] 是包名；2026-06-08 线上原文末尾就是 com.eg.android.AlipayGphone。
// 比较时统一转小写
const TRUSTED_NOTIFY_FROM = new Set(['com.eg.android.alipaygphone', '支付宝'])
function normalizeFrom(v?: string | null): string | null {
  const s = (v || '').trim()
  return !s || s === '[from]' ? null : s // 没带、或占位符没被替换 → 视为未知
}

export async function handleWebhookNotify(
  content: string,
  meta: { from?: string | null } = {}
): Promise<{ matched: boolean; amount: string | null; type: number; reason?: AmountReject }> {
  const type = detectChannel(content) // content 不变 → 渠道判定不变
  /*
   * 【来源白名单】一旦转发规则放宽（同一 Webhook 通道也挂了短信 / 别的 App），任何人发一条
   * 「你已成功收款140.00元」的短信就能命中待支付单。from 明确不是支付宝的一律不自动取用。
   * from 缺失（手机端模板没带 [from]）时按旧行为放行：不能因为模板少一个字段就拦掉全部真实到账。
   */
  const from = normalizeFrom(meta.from)
  const untrusted = from !== null && !TRUSTED_NOTIFY_FROM.has(from.toLowerCase())
  const inner = parseAmountDetailed(content)
  const parsed: AmountParse = untrusted ? { ok: false, reason: 'untrusted_source' } : inner
  if (from === null) console.warn('[vmq] sms-notify 未带 from，本次跳过来源校验')
  // 原文保留 1000 字（Setting.value 是 Text，长度不是瓶颈），便于上线初期核对文案
  await setSetting(
    'vmq_lastwebhook',
    JSON.stringify({
      raw: content.slice(0, 1000),
      amount: parsed.ok ? parsed.amount : null,
      reason: parsed.ok ? null : parsed.reason,
      from: from ? from.slice(0, 100) : null,
      type,
      at: Date.now(),
    })
  )
  await touchHeartbeat() // 收到转发即视为监控端仍在工作
  if (!parsed.ok) {
    /*
     * 播报类 / 营销类通知（每笔到账都会伴随一条「上一笔播报」）不再写进人工队列 —— 原来它们会把
     * 真正没匹配上的到账记录冲掉。原文和原因已经在上面的 vmq_lastwebhook 里。
     * 只有「其实带着成功收款X元」的两类（多金额、来源不对）可能是真金白银，进人工队列并推送：
     * 尤其是来源不对 —— 万一手机端 [from] 换了写法，每一笔真实到账都会落到这里，不能静默。
     */
    if (parsed.reason === 'ambiguous' || (parsed.reason === 'untrusted_source' && inner.ok)) {
      const price = inner.ok ? inner.amount : (inner.amounts || []).join(' / ')
      await recordUnmatched({
        reason: parsed.reason === 'ambiguous' ? 'ambiguous_amount' : 'untrusted_source',
        price,
        type,
        cents: inner.ok ? centsOf(inner.amount) : undefined,
        from,
        raw: content.slice(0, 500),
      })
    }
    console.warn(`[vmq] 通知未取用 reason=${parsed.reason} raw=${content.slice(0, 200)}`)
    return { matched: false, amount: null, type, reason: parsed.reason }
  }
  const matched = await markPaidByAmount(parsed.amount, type, content)
  return { matched, amount: parsed.amount, type }
}

// 原子领取未使用卡密（条件更新 where status=UNUSED 防并发重复发放）
// unitPrices：本次要发的每张卡的售价快照（已按「分」整数分摊，长度 = 本次待发数量）。
// 发卡的同时把 soldPrice / profit 落库，列表与报表不再现算。
// db：调用方的事务客户端（fulfillOrder 在订单行锁里调用，见那里的注释）
async function allocateCards(
  db: Prisma.TransactionClient,
  productId: number,
  orderId: number,
  quantity: number,
  unitPrices: number[]
): Promise<number> {
  let claimed = 0
  for (let attempt = 0; claimed < quantity && attempt < quantity + 10; attempt++) {
    const card = await db.cardKey.findFirst({
      where: { productId, status: 'UNUSED' },
      orderBy: { id: 'asc' },
      select: { id: true, cost: true },
    })
    if (!card) break
    const soldPrice = unitPrices[claimed] ?? 0
    const cost = Number(card.cost ?? 0)
    const r = await db.cardKey.updateMany({
      where: { id: card.id, status: 'UNUSED' },
      data: {
        status: 'USED',
        orderId,
        usedAt: new Date(),
        soldPrice: new Prisma.Decimal(soldPrice.toFixed(2)),
        profit: new Prisma.Decimal(round2(soldPrice - cost).toFixed(2)),
      },
    })
    if (r.count === 1) claimed++ // 抢到；否则被并发领走，继续下一张
  }
  return claimed
}

// 导出供后台「补发卡密」使用：本函数幂等（原子占单 + 订单行锁内只补缺口），
// 对已 PAID 的订单重复 / 并发调用不会重复记账、不会超发。
// 返回 won：本次是否把订单从「待付款」翻成「已付款」（到账匹配据此判断是否重复付款；其它调用方可忽略）
export async function fulfillOrder(orderId: number): Promise<boolean> {
  const order0 = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } })
  if (!order0) return false

  // ① 原子占单 + 记账：在一个事务内把订单 UNPAID→PAID，并创建支付流水、增加销量。
  // 只有把状态翻转成功（count===1）的那一次调用是「赢家」，会执行首次记账。
  // 这是根除「重复到账通知 → 并发重复发卡/重复记账」的关键：竞态中其余调用 count===0。
  const won = await prisma.$transaction(async (tx) => {
    const c = await tx.order.updateMany({
      where: { id: orderId, payStatus: 'UNPAID' },
      data: { payStatus: 'PAID', payMethod: 'ALIPAY', paidAt: new Date() },
    })
    if (c.count !== 1) return false
    // 【CAS 成功后在事务内重读】不用事务外读的订单：那次读和翻 PAID 之间若恰好提交了后台改价，
    // 流水会记旧金额，而下面发卡的单卡售价（splitAmount(order.amount)）用的是新金额，对账对不上。
    // 翻转那一刻起行已被本事务锁住，这里读到的就是最终成交的金额 / 数量
    const cur = await tx.order.findUnique({
      where: { id: orderId },
      select: { amount: true, productId: true, quantity: true, tenantId: true, listingId: true },
    })
    if (!cur) throw new Error(`订单 ${orderId} 在翻转后不见了`)
    await tx.payment.create({
      data: { orderId, payMethod: 'ALIPAY', amount: cur.amount, status: 1 },
    })
    await tx.product.update({ where: { id: cur.productId }, data: { sales: { increment: cur.quantity } } })
    /*
     * 【渠道单：本渠道销量 + 计提，与翻 PAID 同一事务】（设计 8.3、10.5）
     * 付款 CAS 是唯一「恰好一次」的点，计提放在这里就不会漏、不会重。accrueOnPaid 对普通异常不抛（→ settleState=MISSING + 告警），
     * 所以不会把「钱到了」这件事回滚掉；listing 销量只是展示数，出错也只记日志（MySQL 单条语句失败不中止事务，itest W3-3 实测）。
     * 【例外：死锁 / 锁等待超时 / 事务已失效必须 rethrow】这类错误数据库已把整个事务回滚（翻 PAID、Payment、销量全没了），
     * 吞掉继续跑会让下面按「赢家」发卡、发邮件，而订单其实还是待支付（itest W3-3b 实测）。rethrow 后整个付款事务失败，
     * 到账路径由 markPaidVmqOrder 的 catch 告警、reconcilePaidVmq 宽限期后补做 fulfillOrder。
     * 平台单 tenantId=1，整段跳过。
     */
    if (cur.tenantId !== 1) {
      if (cur.listingId != null) {
        await tx.tenantListing
          .updateMany({ where: { id: cur.listingId, tenantId: cur.tenantId }, data: { sales: { increment: cur.quantity } } })
          .catch((e) => {
            if (isTxAbortingError(e)) throw e
            console.error('[vmq] 渠道销量累加失败（不影响付款）', orderId, e)
          })
      }
      await accrueOnPaid(tx, orderId)
    }
    return true
  })

  // 【赢家立刻关掉同一订单其余的待支付收款单】否则另一个标签页的收银台还会在 20 分钟内继续要钱。
  // invalidatePendingVmq 只动 state=0，刚翻成 1 的那张不受影响
  if (won) {
    await invalidatePendingVmq('order', orderId).catch((e) => console.error('[vmq] 作废同单其余收款单失败', orderId, e))
  }

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { product: true, user: true } })
  if (!order) return won
  // 渠道单：租户 code（平台群「[lulu]」标签）；主站单为 null
  const site = await siteCodeOf(order.tenantId)
  if (won && order.tenantId !== 1) {
    // 渠道站内通知 + 渠道企业微信（载荷不含买家邮箱与卡密）。独立写入、不抛，失败不影响履约
    await emitTenantNotice(null, {
      tenantId: order.tenantId,
      kind: 'ORDER_PAID',
      title: `订单已支付：${order.productName}${order.quantity > 1 ? ` × ${order.quantity}` : ''}`,
      body: `实收 ¥${(Number(order.amount) + Number(order.invoiceTaxFee ?? 0)).toFixed(2)}`,
      refType: 'order',
      refKey: order.orderNo,
      dedupeKey: `paid:${order.orderNo}`,
    })
  }

  /*
   * ①.5 下单时勾了「同时开发票」的，此刻税费已随货款一并到账 → 发票申请正式成立。
   *
   * 【必须放在下面那条「已交付就返回」之前】自动发货商品在本次调用里就会被置成
   * DELIVERED，之后任何一次重入（重复到账推送、后台补发卡密、手动补单）都会在那一行
   * 提前返回。开票要是排在它后面，首次调用只要抛一次异常（网络抖动、连接池耗尽），
   * 这张买家已经付过税费的发票就**再也没有任何一条路能补出来**。
   *
   * 放在前面是安全的：submitInvoiceForPaidOrder 只读订单、只写 invoices/external_orders，
   * 不碰发货，且靠 Invoice.externalOrderId 的唯一约束做幂等，重复进入只会返回 null。
   *
   * 【整块 try 住】开票失败绝不能影响发货 —— 买家的货不该为一张发票买单。
   *
   * 【只给「本次赢家」或「已付款且未取消」的订单补开票】已付款后又被取消（多半是线下退了款）的单，
   * 后台补发卡密 / 手动补单会以非赢家身份走到这里，原来照样生成一张「已提交 + 已付税费」的发票推给财务 ——
   * 与后台订单接口「已取消的不补开票」的口径冲突。条件与下面「非赢家跳过发货」那条互补。
   * 赢家必须照开：超时取消后才迟到付款的单，本次刚收到钱（含税费）。
   */
  const invoiceEligible = won || (order.payStatus === 'PAID' && order.deliveryStatus !== 'CANCELLED')
  if (invoiceEligible) await submitInvoiceForPaidOrder(order.id).catch((e) => {
    console.error('[vmq] 下单开票落地失败（发货不受影响）', order.id, e)
    // 【必须告警】失败是静默的：钱已到账、invoices 表没有行、财务台看不到，
    // 而买家订单页因为 invoiceTaxFee 已写入仍显示「已提交开票」。不推送就没人会发现
    notifyInvoiceFailed({
      orderNo: order.orderNo,
      taxFee: order.invoiceTaxFee ?? 0,
      reason: e instanceof Error ? e.message : String(e),
      site,
    })
  })

  /*
   * 非赢家、而订单眼下并不是「已付款且未取消」→ 什么都不发。
   * 非赢家的来路是后台补单（manualComplete）和补发卡密：订单若已被标成退款（REFUNDED），
   * 或已付款后又被管理员取消，原来自动发货分支没有任何闸门，照样领卡、把订单改回已交付。
   * 已取消的已付款单要重新发货，应先在订单页把状态改回来（那条路会把销量加回去），
   * 而不是从这里绕过去 —— 否则销量会少算一单（取消时已减过）。
   * 赢家不受影响：本次调用刚收到钱，哪怕订单之前是「超时取消」，也照常发货。
   */
  if (!won && (order.payStatus !== 'PAID' || order.deliveryStatus === 'CANCELLED')) {
    console.warn('[vmq] 订单非「已付款且未取消」，跳过发货', order.id, order.payStatus, order.deliveryStatus)
    return won
  }

  // 非赢家且订单已完整交付 → 直接返回，杜绝重复发卡。
  // 返回前补一次内推结算：首次交付时结算若抛过异常（网络抖动 / 连接池耗尽），
  // 之后每次重入都会在这里返回，返现就永远补不上了。settleReferral 靠
  // ReferralReward.orderId 唯一约束幂等，重复调用不会重复入账。
  if (!won && order.deliveryStatus === 'DELIVERED') {
    try {
      await settleReferral(order.id)
    } catch (e) {
      console.error('[vmq] settle referral retry failed', order.id, e)
    }
    return won
  }

  const auto = order.product.deliveryType === 'AUTO'
  const sms = order.product.deliveryType === 'SMS'

  // ② 自动发货：幂等发卡——只补足该订单「尚缺」的数量（已发 = 该订单已占用的卡密数）。
  // 靠下面的订单行锁串行化：重复 / 并发进入都不会让一张订单的卡密总数超过其 quantity。
  let delivered = false
  // 自动发货缺口（已发 / 应发）：仅「应发 > 0 且没发够」时有值；渠道单待补发的站长推送要写明原因
  let cardShortage: { owned: number; need: number } | null = null
  // 本次调用把订单翻成 DELIVERED 的时刻（条件更新抢到才有值）：渠道单「补发完成」通知的去重键用它
  let deliveredFlipAt: Date | null = null
  if (auto) {
    /*
     * 【整单互斥】计数和领卡必须在同一把订单行锁里。卡级 CAS 只保证一张卡不发两次，保证不了整单总数：
     * 到账履约、补发卡密、收款监控补单并发时，原来各自数到 already=0、各领 quantity 张，会超发。
     * 事务第一句 SELECT … FOR UPDATE 锁住订单行：后到的调用排队等前一个提交，再数时看到的是已发张数，只补真实缺口。
     * 【隔离级别必须 READ COMMITTED】RR 下整个事务共用一个快照，allocateCards 的 findFirst
     * 会反复拿到「已被别的订单领走」的同一张卡，把重试耗光，把有货误判成库存不足。
     * 进程崩溃时事务自动回滚、锁自动释放，不需要过期接管；领卡中途出错也整体回滚，不会留下半截。
     */
    const alloc = await prisma.$transaction(
      async (tx) => {
        // 行锁同时读出按件退款数与渠道快照：READ COMMITTED 下锁定读拿到的是最新提交值（并发的按件退款已排在锁后面）
        const locked = await tx.$queryRaw<{ refunded_qty: number | null; supply_cents: number | null; tenant_id: number }[]>`
          SELECT refunded_qty, supply_cents, tenant_id FROM orders WHERE id = ${order.id} FOR UPDATE`
        const lk = locked[0]
        /*
         * 【缺口 = quantity − 已按件退掉的件数 − 已发】（设计 8.3、8.4）：按件部分退款后再点「补发卡密」不得为已退的件补卡。
         * 主站单 refundedQty 恒为空（→ 0），need === quantity，行为与改造前逐字相同。
         */
        const need = order.quantity - Number(lk?.refunded_qty ?? 0)
        const already = await tx.cardKey.count({ where: { orderId: order.id, status: 'USED' } })
        if (already >= need) return { owned: already, need }
        /*
         * 单卡售价快照：主站单 = 订单总额按张数整数分摊（Σ 单卡售价 === order.amount，不变）；
         * 渠道单 = 进货款按张数分摊（Σ === supplyCents），于是 CardKey.profit = 进货价分摊 − cost 是站长真实的卡差价，
         * 手续费与发票利润另在报表里加（设计 8.3，money.ts 注释同步改了口径）。补发时只取「尚缺」的那几份。
         */
        const channel = Number(lk?.tenant_id ?? 1) !== 1 && lk?.supply_cents != null
        const total = channel ? Number(lk!.supply_cents) / 100 : Number(order.amount)
        const unitPrices = splitAmount(total, order.quantity).slice(already)
        return { owned: already + (await allocateCards(tx, order.productId, order.id, need - already, unitPrices)), need }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 10_000, timeout: 20_000 }
    )
    const owned = alloc.owned
    delivered = alloc.need > 0 && owned >= alloc.need
    if (alloc.need <= 0) {
      // 全部件都已按件退掉：不发卡、不改交付状态（订单的取消 / 退款状态由退款弹窗决定）
    } else if (delivered) {
      // 条件带 not DELIVERED：排队的后到者不再把 deliveredAt 改晚几毫秒
      const at = new Date()
      const flipped = await prisma.order.updateMany({
        where: { id: order.id, deliveryStatus: { not: 'DELIVERED' } },
        data: { deliveryStatus: 'DELIVERED', deliveredAt: at },
      })
      if (flipped.count === 1) deliveredFlipAt = at
    } else {
      cardShortage = { owned, need: alloc.need }
      // appendRemark 按 255 字截断（保留最新内容）：原来每次补发仍缺货都追加一段，十几次后超长报错「补发失败」
      const remark = appendRemark(order.remark, `卡密库存不足(已发${owned}/${alloc.need})，待人工补发`)
      await prisma.order.update({ where: { id: order.id }, data: { deliveryStatus: 'PROCESSING', remark } })
    }
    await syncAutoStock(order.productId)
  } else if (won) {
    // 非自动发货（人工/短信）：付款后置为处理中，等待人工/短信流程
    await prisma.order.update({ where: { id: order.id }, data: { deliveryStatus: 'PROCESSING' } })
  }

  // ②.4 券核销。CAS 保证只核销一次，重复到账回调不会重复计数。
  // 放在发货之后、通知之前：核销失败不影响买家拿到货，但要留下日志
  if (won) {
    await consumeCouponForOrder(order.id).catch((e) => console.error('[coupon] 核销失败', order.id, e))
  }

  // ②.45 下单时勾了「同时开发票」的，此刻税费已随货款一并到账 → 发票申请正式成立。
  // 【整块 try 住】开票失败绝不能影响已经完成的发货 —— 买家的货不该为一张发票买单。
  // ②.5 企业微信通知。只在 won（首次把订单翻成 PAID）时推送——
  // （下单勾选开票的落地在 ①.5，已挪到「已交付就返回」那道短路之前）
  // 重复到账通知会让本函数被多次进入，但老板的手机不该被重复打扰。
  if (won) {
    const fresh = await prisma.product.findUnique({
      where: { id: order.productId },
      select: { name: true, stock: true },
    })
    if (order.tenantId === 1) {
      // 主站单：与原来逐字相同（site 为 null）
      notifyOrderPaid({
        orderNo: order.orderNo,
        buyer: order.user.nickname || order.user.email || `用户#${order.userId}`,
        productName: order.productName,
        quantity: order.quantity,
        amount: order.amount,
        // 勾了开票的单支付宝到账的是 货款+6%，推送要和银行流水对得上
        invoiceTaxFee: order.invoiceTaxFee == null ? null : Number(order.invoiceTaxFee),
        paidAt: order.paidAt ?? new Date(),
        stock: fresh?.stock ?? null,
        delivered,
        site,
      })
    } else {
      /*
       * 渠道单（docs/多渠道分销-二期改动.md 3.1）：付款是纯通知，不再推站长群（渠道站长已由上面的 ORDER_PAID 渠道通知收到）。
       * 唯一例外是**站长必须动手**的两种：人工发货商品（MANUAL），或自动发货但卡密不够、停在「待人工补发」。
       * 渠道没有发货权限，不推站长就没人发货。SMS 接码付款后自动取号，属正常流程，不推。
       */
      const pending = channelPendingDelivery(order.product.deliveryType, delivered, cardShortage)
      if (pending) {
        notify(
          'order.paid',
          [
            { label: '订单号', value: order.orderNo },
            { label: '商品', value: order.productName },
            { label: '件数', value: String(order.quantity) },
            { label: '金额', value: money(order.amount), color: 'warning' },
            { label: '原因', value: pending.reason, color: 'warning' },
          ],
          { link: '/admin/orders', extraTitle: pending.title, site },
        )
      }
    }
    // 自动发货商品的库存 = 未使用卡密数，见底就要补货
    const threshold = Number(process.env.LOW_STOCK_THRESHOLD || 3)
    if (auto && fresh && fresh.stock >= 0 && fresh.stock <= threshold) {
      notifyLowStock({ productName: fresh.name, stock: fresh.stock, threshold })
    }
  }

  /*
   * 渠道单「补发完成」（二期改动 3.2 ORDER_DELIVERED）：非赢家调用（后台「补发卡密」、收款监控补单）把一张待补发的渠道单
   * 补齐、翻成已交付时，告诉渠道站长。赢家当场自动发货的不发（ORDER_PAID 已经通知过，买家也已拿到卡）。
   * 去重键带交付时刻：同一次翻转只通知一次；站长撤回交付后再补齐会是新的一次。正文不含卡密。
   * 【必须要求翻转前是 PROCESSING】非赢家也可能只是首次自动发货的并发者（重复到账推送 / 监控补单 / 后台补单
   * 与赢家同时进入）：赢家还在等 ORDER_PAID、开票时，非赢家先抢到订单行锁把卡发了，这时它读到的是 PENDING——
   * 订单从没缺过卡，发「平台已补发完成」是误报，还白占渠道一封邮件名额。真正待补发的单，缺卡那次已被置成 PROCESSING。
   */
  if (!won && deliveredFlipAt && order.deliveryStatus === 'PROCESSING' && order.tenantId !== 1) {
    await emitTenantNotice(null, {
      tenantId: order.tenantId,
      kind: 'ORDER_DELIVERED',
      title: `订单已交付：${order.productName}${order.quantity > 1 ? ` × ${order.quantity}` : ''}`,
      body: '平台已补发完成，买家可在订单页查看',
      refType: 'order',
      refKey: order.orderNo,
      dedupeKey: `dlv:${order.orderNo}:${deliveredFlipAt.getTime().toString(36)}`,
    })
  }

  // SMS 接码：付款成功后自动取号（仅首次付款时取号，避免重复取号）
  if (sms && won) {
    try {
      await acquireForOrder(
        order.id,
        order.product.smsService || '',
        order.product.smsCountry || '',
        order.product.smsMaxPrice != null ? Number(order.product.smsMaxPrice) : null
      )
    } catch (e) {
      console.error('[vmq] sms acquire failed', e)
    }
  }

  // 自动发货已交付 → 结算内推返现
  if (delivered) {
    try {
      await settleReferral(order.id)
    } catch (e) {
      console.error('[vmq] settle referral failed', e)
    }
  }

  // 交易通知邮件（仅首次付款发送，避免重复到账时重复发信）
  if (won && order.user.email) {
    try {
      let cards: string[] | undefined
      if (auto && delivered) {
        const cks = await prisma.cardKey.findMany({ where: { orderId: order.id, status: 'USED' }, orderBy: { id: 'asc' } })
        cards = cks.map((c) => {
          try {
            return decryptCardContent(c.content)
          } catch {
            return '(卡密解密失败，请在订单查看或联系客服)'
          }
        })
      }
      // 链接按订单所属店面（设计 4.5）：主站单不传 → mail.ts 用原常量，邮件逐字不变；渠道租户查不到时抛进下面的 catch。
      // 二期改动 4.5：渠道单页脚带店面客服邮箱（tenantMailOpts，主站返回 undefined）
      const mailOpts = await tenantMailOpts(order.tenantId)
      await sendOrderPaidEmail(
        order.user.email,
        {
          orderNo: order.orderNo,
          productName: order.productName,
          amount: Number(order.amount),
          // 勾了开票的订单实收的是 货款 + 6%，邮件要和支付宝账单对得上
          invoiceTaxFee: order.invoiceTaxFee == null ? null : Number(order.invoiceTaxFee),
          deliveryType: order.product.deliveryType,
          cards,
          cardUsage: order.product.cardUsage,
        },
        mailOpts
      )
    } catch (e) {
      console.error('[vmq] order paid email failed', e)
    }
  }
  return won
}

/**
 * 订单已付款 → 把下单时勾的「同时开发票」草稿落成一张已成立的发票，并推送财务。
 *
 * **幂等，可以随便重复调用。** 三条路会进来：
 *   · 正常到账履约（fulfillOrder）
 *   · 后台「补发卡密」/「确认到账补单」（同样经 fulfillOrder）
 *   · 后台手工把订单标成已支付（api/admin/orders/[id]，那条路不走 fulfillOrder）
 *
 * 【不依赖 fulfillOrder 里的 won 标记】补单场景下 won 是 false，靠它兜的话补单
 * 进来的订单永远不会开票。幂等由 Invoice.externalOrderId 的唯一约束保证。
 */
export async function submitInvoiceForPaidOrder(orderId: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      productName: true,
      amount: true,
      paidAt: true,
      createdAt: true,
      payStatus: true,
      invoiceInfo: true,
      tenantId: true,
      user: { select: { email: true, nickname: true } },
    },
  })
  // 没付款就不该有发票：税费是跟货款一笔收的，钱没到账这张票不成立
  if (!order || order.payStatus !== 'PAID' || !order.invoiceInfo) return
  const created = await materializeOrderInvoice(order)
  if (created) await pushInvoiceReady(created.id)
}

// 返回是否由本次把发票翻成已付款（语义同 fulfillOrder 的 won）
async function fulfillInvoice(invoiceId: number): Promise<boolean> {
  // 【条件更新，不是「先查后写」】原来是 findUnique → 判 payStatus → update。
  // 重复到账推送、后台补单（manualComplete 没有入口处的 CAS 闸门）、两个管理员同时点，
  // 都可能让两次调用同时通过那个判断，于是企业微信收到两条一模一样的「可开具」推送，
  // 每条还各带一个新的免登录财务台链接。改成 updateMany 由数据库定胜负。
  const paidAt = new Date()
  const flip = await prisma.invoice.updateMany({
    where: { id: invoiceId, payStatus: { not: 'PAID' } },
    data: { payStatus: 'PAID', status: 'SUBMITTED', paidAt, submittedAt: paidAt },
  })
  if (flip.count !== 1) return false // 已被并发的另一次履约处理

  // 同 fulfillOrder：关掉同一张发票其余还开着的收银台，防止被付第二次
  await invalidatePendingVmq('invoice', invoiceId).catch((e) => console.error('[vmq] 作废同票其余收款单失败', invoiceId, e))
  /*
   * 【渠道单事后开票：税费到账 → 发票分成】（设计 9.2、10.5）flip 成功后单独事务计提，永不抛。
   * flip 与计提之间崩溃、计提失败、当时前置不满足而跳过的，由解冻 cron 的补偿扫描补上，对账 L11 兜底。
   * 是不是渠道单以 accrueInvoiceShare 内部 findShopOrderForInvoice 找到的**订单**的 tenantId 为准，不看 Invoice.tenantId：
   * 票据上的来源站列一旦写错（对账 A12 会报），按它判断就会直接漏掉这次计提。主站票据在那里读一两次后返回 SKIPPED，
   * 不写任何东西、永不抛，主站行为不变。
   */
  await accrueInvoiceShare(invoiceId)
  await pushInvoiceReady(invoiceId)
  return true
}

/**
 * 「这张票可以开了」的企业微信推送：本单完整信息 + 当前全部待开清单 + 财务台链接。
 *
 * 两条路进来：单独支付税费（fulfillInvoice）、下单时勾开票随货款一起付清
 * （fulfillOrder → materializeOrderInvoice）。两条路的终态一样，推送也该一样。
 *
 * 调用方必须已经赢得幂等竞争，本函数不再自查 —— 它只负责推送。
 */
async function pushInvoiceReady(invoiceId: number) {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
    if (!invoice) return
    const pending = await prisma.invoice.findMany({
      where: { status: 'SUBMITTED', payStatus: 'PAID' },
      orderBy: { paidAt: 'asc' },
      take: 50,
      select: { invoiceNo: true, title: true, subscriptionType: true, invoiceAmount: true },
    })
    notifyInvoiceReady({
      invoiceNo: invoice.invoiceNo,
      title: invoice.title || '—',
      taxNumber: invoice.taxNumber,
      showAiWording: invoice.showAiWording,
      subscriptionType: invoice.subscriptionType,
      invoiceAmount: invoice.invoiceAmount,
      taxFee: invoice.taxFee,
      email: invoice.email,
      paidAt: invoice.paidAt ?? new Date(),
      pending: pending.map((x) => ({
        invoiceNo: x.invoiceNo,
        title: x.title || '—',
        subscriptionType: x.subscriptionType,
        invoiceAmount: x.invoiceAmount == null ? null : Number(x.invoiceAmount),
      })),
      financeUrl: financeInvoiceUrl(),
      site: await siteCodeOf(invoice.tenantId),
    })
  } catch (e) {
    // 通知失败绝不能影响「税费已到账」这个既成事实
    console.error('[notify] 发票可开具通知组装失败', e)
  }
}

// 说明：VmqApk 的 /appHeart、/appPush 协议与其签名校验（checkHeartSign / checkPushSign）
// 已随 VmqApk 一并移除。到账通知统一走 SmsForwarder → POST /api/pay/sms-notify（token 鉴权）。
