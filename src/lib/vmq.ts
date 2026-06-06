import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { prisma } from './db'

// ============ V免签式个人收款（监控收款码到账，按唯一金额匹配） ============

export const VMQ_KEY = process.env.VMQ_KEY || ''
export const VMQ_TIMEOUT_MIN = parseInt(process.env.VMQ_PAY_TIMEOUT || '5') // 订单有效期（分钟）
export const VMQ_REQUIRE_MONITOR = process.env.VMQ_REQUIRE_MONITOR !== '0'   // 是否要求监控端在线才能下单
export const VMQ_TYPE_ALIPAY = 2

export function vmqConfigured(): boolean {
  return !!VMQ_KEY
}

export function md5(s: string): string {
  return crypto.createHash('md5').update(s, 'utf8').digest('hex')
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

export async function touchHeartbeat() {
  await setSetting('vmq_lastheart', String(Date.now()))
}

export async function monitorAlive(): Promise<boolean> {
  const last = await getSetting('vmq_lastheart')
  if (!last) return false
  return Date.now() - Number(last) < 60_000 // 60s 内有心跳视为在线
}

// ---- 过期订单清理 + 释放金额锁 ----
export async function closeExpired(): Promise<number> {
  const cutoff = new Date(Date.now() - VMQ_TIMEOUT_MIN * 60_000)
  const expired = await prisma.vmqOrder.findMany({
    where: { state: 0, createdAt: { lt: cutoff } },
    select: { id: true, orderId: true },
  })
  if (expired.length === 0) return 0
  await prisma.$transaction([
    prisma.vmqOrder.updateMany({ where: { id: { in: expired.map((e) => e.id) } }, data: { state: -1 } }),
    prisma.vmqLock.deleteMany({ where: { orderId: { in: expired.map((e) => e.orderId) } } }),
  ])
  return expired.length
}

// ---- 分配唯一金额并加锁 ----
// 先预查占用情况避免无谓的唯一约束冲突日志；遇到陈旧锁（占用者已支付/过期）自动清理复用
async function allocateAmount(basePrice: number, type: number, orderId: string): Promise<number> {
  let cents = centsOf(basePrice)
  for (let i = 0; i < 50; i++) {
    const lockKey = `${cents}-${type}`
    const existing = await prisma.vmqLock.findUnique({ where: { lockKey } })
    if (existing) {
      const live = await prisma.vmqOrder.findFirst({ where: { orderId: existing.orderId, state: 0 } })
      if (live) {
        cents += 1 // 真有待支付订单占用该金额 → 换金额
        continue
      }
      // 陈旧锁（订单已支付/过期/不存在）→ 清理后复用该金额
      await prisma.vmqLock.delete({ where: { lockKey } }).catch(() => {})
    }
    try {
      await prisma.vmqLock.create({ data: { lockKey, orderId } })
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
  throw new VmqError('当前下单人数较多，请稍后重试')
}

export class VmqError extends Error {}

// ---- 创建或复用 V免签订单 ----
// 同一业务单已有「待支付」订单则复用，避免重复占用金额
export async function createOrGetVmqOrder(params: {
  bizType: 'order' | 'invoice'
  bizId: number
  outTradeNo: string
  price: number
  type?: number
}): Promise<{ orderId: string; reallyPrice: number; price: number; state: number; createdAt: Date }> {
  const type = params.type ?? VMQ_TYPE_ALIPAY
  if (!vmqConfigured()) throw new VmqError('收款未配置（缺少 VMQ_KEY）')
  if (params.price <= 0) throw new VmqError('金额必须大于 0')

  await closeExpired()

  if (VMQ_REQUIRE_MONITOR && !(await monitorAlive())) {
    throw new VmqError('收款监控端当前离线，暂时无法发起支付，请稍后再试或联系客服')
  }

  // 复用未过期的待支付订单
  const existing = await prisma.vmqOrder.findFirst({
    where: { bizType: params.bizType, bizId: params.bizId, state: 0 },
    orderBy: { createdAt: 'desc' },
  })
  if (existing) {
    return {
      orderId: existing.orderId,
      reallyPrice: Number(existing.reallyPrice),
      price: Number(existing.price),
      state: existing.state,
      createdAt: existing.createdAt,
    }
  }

  const orderId = genOrderId()
  const cents = await allocateAmount(params.price, type, orderId)
  const reallyPrice = cents / 100

  const created = await prisma.vmqOrder.create({
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

  return {
    orderId: created.orderId,
    reallyPrice: Number(created.reallyPrice),
    price: Number(created.price),
    state: created.state,
    createdAt: created.createdAt,
  }
}

// ---- 到账：按金额匹配并标记业务已支付 ----
// 返回是否匹配到订单
export async function markPaidByAmount(price: string, type: number): Promise<boolean> {
  const cents = centsOf(price)
  // 记录最近一次到账推送（用于后台诊断「监控端确实在推送」）
  await setSetting('vmq_lastpay', JSON.stringify({ price, type, cents, at: Date.now() }))

  // 取该渠道所有待支付单，按 cents 精确匹配（避免浮点误差）
  const pendings = await prisma.vmqOrder.findMany({ where: { state: 0, type } })
  const target = pendings.find((o) => centsOf(o.reallyPrice) === cents)
  if (!target) {
    const pendingList = pendings.map((o) => Number(o.reallyPrice))
    console.warn(`[vmq] 到账 ${price}(${cents}分) type=${type} 未匹配到待支付订单；当前待支付金额=`, pendingList)
    await setSetting(
      'vmq_lastunmatched',
      JSON.stringify({ price, type, cents, pending: pendingList, at: Date.now() })
    )
    return false
  }

  await markPaidVmqOrder(target.id, target.bizType, target.bizId, target.orderId)
  console.log(`[vmq] 到账匹配成功 ${price} -> ${target.bizType}#${target.bizId} (orderId=${target.orderId})`)
  return true
}

// 标记某条 vmq 订单已支付并履约（金额匹配 / 后台补单共用）
async function markPaidVmqOrder(id: number, bizType: string, bizId: number, orderId: string) {
  await prisma.$transaction([
    prisma.vmqOrder.update({ where: { id }, data: { state: 1, payDate: new Date() } }),
    prisma.vmqLock.deleteMany({ where: { orderId } }),
  ])
  try {
    if (bizType === 'order') await fulfillOrder(bizId)
    else if (bizType === 'invoice') await fulfillInvoice(bizId)
  } catch (e) {
    console.error('[vmq] 履约失败', bizType, bizId, e)
    throw e
  }
}

// 后台手动补单（确认到账）：无视金额，强制标记该 vmq 订单已支付并履约
export async function manualComplete(vmqOrderId: number): Promise<void> {
  const o = await prisma.vmqOrder.findUnique({ where: { id: vmqOrderId } })
  if (!o) throw new VmqError('收款单不存在')
  if (o.state === 1) {
    // 已是已支付，仅补履约（防止之前履约失败）
    try {
      if (o.bizType === 'order') await fulfillOrder(o.bizId)
      else if (o.bizType === 'invoice') await fulfillInvoice(o.bizId)
    } catch (e) {
      console.error('[vmq] 补履约失败', e)
      throw e
    }
    return
  }
  await markPaidVmqOrder(o.id, o.bizType, o.bizId, o.orderId)
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
  const [lastpay, lastunmatched] = await Promise.all([getSetting('vmq_lastpay'), getSetting('vmq_lastunmatched')])
  return {
    lastPush: lastpay ? JSON.parse(lastpay) : null,
    lastUnmatched: lastunmatched ? JSON.parse(lastunmatched) : null,
  }
}

async function fulfillOrder(orderId: number) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || order.payStatus === 'PAID') return
  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { payStatus: 'PAID', payMethod: 'ALIPAY', deliveryStatus: 'PROCESSING', paidAt: new Date() },
    }),
    prisma.payment.create({
      data: { orderId: order.id, payMethod: 'ALIPAY', amount: order.amount, status: 1 },
    }),
    prisma.product.update({ where: { id: order.productId }, data: { sales: { increment: order.quantity } } }),
  ])
}

async function fulfillInvoice(invoiceId: number) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
  if (!invoice || invoice.payStatus === 'PAID') return
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { payStatus: 'PAID', status: 'SUBMITTED', paidAt: new Date() },
  })
}

// ---- 签名校验 ----
export function checkHeartSign(t: string, sign: string): boolean {
  return md5(t + VMQ_KEY) === sign
}
export function checkPushSign(type: string, price: string, t: string, sign: string): boolean {
  return md5(type + price + t + VMQ_KEY) === sign
}
