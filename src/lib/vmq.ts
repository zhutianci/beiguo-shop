import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { prisma } from './db'
import { syncAutoStock, decryptCardContent } from './cardkey'
import { round2, splitAmount } from './money'
import { notifyOrderPaid, notifyInvoiceReady, notifyLowStock } from './notify'
import { financeInvoiceUrl } from './action-token'
import { settleReferral } from './referral'
import { acquireForOrder } from './sms'
import { sendOrderPaidEmail } from './mail'

// ============ V免签式个人收款（监控收款码到账，按唯一金额匹配） ============

export const VMQ_KEY = process.env.VMQ_KEY || ''
export const VMQ_TIMEOUT_MIN = parseInt(process.env.VMQ_PAY_TIMEOUT || '20') // 订单有效期（分钟）
export const VMQ_TYPE_ALIPAY = 2

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
  if (expired.length === 0) return 0

  const orderBizIds = expired.filter((e) => e.bizType === 'order').map((e) => e.bizId)

  await prisma.$transaction([
    prisma.vmqOrder.updateMany({ where: { id: { in: expired.map((e) => e.id) } }, data: { state: -1 } }),
    prisma.vmqLock.deleteMany({ where: { orderId: { in: expired.map((e) => e.orderId) } } }),
    // 商品订单：仅取消仍未支付的，避免误伤已付款订单
    ...(orderBizIds.length
      ? [
          prisma.order.updateMany({
            where: { id: { in: orderBizIds }, payStatus: 'UNPAID', deliveryStatus: { in: ['PENDING', 'PROCESSING'] } },
            data: { deliveryStatus: 'CANCELLED' },
          }),
        ]
      : []),
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

  // 注意：这里曾有「监控端离线则禁止下单」的拦截。SmsForwarder 没有心跳，
  // touchHeartbeat() 只在真实到账时被调用，而在线窗口只有 60 秒 —— 一分钟没进账就会把
  // 下单 / 再支付 / 发票税费 / 开票四条链路全部拦死。已随 VmqApk 一并移除，不要靠 env 兜。

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

// 作废某业务单已存在的「待支付」收款单（如改价后，强制下次按新价重建）
export async function invalidatePendingVmq(bizType: 'order' | 'invoice', bizId: number): Promise<number> {
  const pendings = await prisma.vmqOrder.findMany({
    where: { bizType, bizId, state: 0 },
    select: { id: true, orderId: true },
  })
  if (pendings.length === 0) return 0
  await prisma.$transaction([
    prisma.vmqOrder.updateMany({ where: { id: { in: pendings.map((p) => p.id) } }, data: { state: -1 } }),
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
      prisma.vmqOrder.updateMany({ where: { id: { in: stale.map((p) => p.id) } }, data: { state: -1 } }),
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

  // 释放本单旧金额锁，再为新价分配唯一金额（仍挂在同一 orderId 上）
  await prisma.vmqLock.deleteMany({ where: { orderId: target.orderId } })
  const cents = await allocateAmount(newPrice, target.type, target.orderId)
  const reallyPrice = cents / 100

  const updated = await prisma.vmqOrder.update({
    where: { id: target.id },
    data: {
      price: new Prisma.Decimal(newPrice.toFixed(2)),
      reallyPrice: new Prisma.Decimal(reallyPrice.toFixed(2)),
    },
  })

  return {
    orderId: updated.orderId,
    reallyPrice: Number(updated.reallyPrice),
    price: Number(updated.price),
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
  // 原子翻转：state 0→1。并发下（同一笔到账被重复推送）只有一次能成功，
  // 其余 count===0 直接跳过履约，从入口处就避免重复发货。
  const flip = await prisma.vmqOrder.updateMany({
    where: { id, state: 0 },
    data: { state: 1, payDate: new Date() },
  })
  await prisma.vmqLock.deleteMany({ where: { orderId } })
  if (flip.count !== 1) return // 已被并发的另一次到账处理，跳过
  try {
    if (bizType === 'order') await fulfillOrder(bizId)
    else if (bizType === 'invoice') await fulfillInvoice(bizId)
  } catch (e) {
    console.error('[vmq] 履约失败', bizType, bizId, e)
    throw e
  }
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

export type AmountReject = 'empty' | 'broadcast_rejected' | 'no_strong_signal'
export type AmountParse = { ok: true; amount: string } | { ok: false; reason: AmountReject }

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
  while ((m = STRONG_SIGNAL.exec(t)) !== null) {
    sawStrong = true
    // 强信号词前 24 字内出现「上一笔」之类 → 这一处是播报回顾，跳过继续找下一处
    if (BROADCAST_HINT.test(t.slice(Math.max(0, m.index - 24), m.index))) continue
    return { ok: true, amount: m[1] }
  }

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
}

export async function handleWebhookNotify(
  content: string
): Promise<{ matched: boolean; amount: string | null; type: number; reason?: AmountReject }> {
  const type = detectChannel(content)
  const parsed = parseAmountDetailed(content)
  // 原文保留 1000 字（Setting.value 是 Text，长度不是瓶颈），便于上线初期核对文案
  await setSetting(
    'vmq_lastwebhook',
    JSON.stringify({
      raw: content.slice(0, 1000),
      amount: parsed.ok ? parsed.amount : null,
      reason: parsed.ok ? null : parsed.reason,
      type,
      at: Date.now(),
    })
  )
  await touchHeartbeat() // 收到转发即视为监控端仍在工作
  if (!parsed.ok) {
    await setSetting(
      'vmq_lastunmatched',
      JSON.stringify({ raw: content.slice(0, 1000), reason: parsed.reason, at: Date.now() })
    )
    console.warn(`[vmq] 通知未取用 reason=${parsed.reason} raw=${content.slice(0, 200)}`)
    return { matched: false, amount: null, type, reason: parsed.reason }
  }
  const matched = await markPaidByAmount(parsed.amount, type)
  return { matched, amount: parsed.amount, type }
}

// 原子领取未使用卡密（条件更新 where status=UNUSED 防并发重复发放）
// unitPrices：本次要发的每张卡的售价快照（已按「分」整数分摊，长度 = 本次待发数量）。
// 发卡的同时把 soldPrice / profit 落库，列表与报表不再现算。
async function allocateCards(
  productId: number,
  orderId: number,
  quantity: number,
  unitPrices: number[]
): Promise<number> {
  let claimed = 0
  for (let attempt = 0; claimed < quantity && attempt < quantity + 10; attempt++) {
    const card = await prisma.cardKey.findFirst({
      where: { productId, status: 'UNUSED' },
      orderBy: { id: 'asc' },
      select: { id: true, cost: true },
    })
    if (!card) break
    const soldPrice = unitPrices[claimed] ?? 0
    const cost = Number(card.cost ?? 0)
    const r = await prisma.cardKey.updateMany({
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

// 导出供后台「补发卡密」使用：本函数幂等（原子占单 + 只补缺口），
// 对已 PAID 的订单重复调用不会重复记账、不会超发。
export async function fulfillOrder(orderId: number) {
  const order0 = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order0) return

  // ① 原子占单 + 记账：在一个事务内把订单 UNPAID→PAID，并创建支付流水、增加销量。
  // 只有把状态翻转成功（count===1）的那一次调用是「赢家」，会执行首次记账。
  // 这是根除「重复到账通知 → 并发重复发卡/重复记账」的关键：竞态中其余调用 count===0。
  const won = await prisma.$transaction(async (tx) => {
    const c = await tx.order.updateMany({
      where: { id: orderId, payStatus: 'UNPAID' },
      data: { payStatus: 'PAID', payMethod: 'ALIPAY', paidAt: new Date() },
    })
    if (c.count !== 1) return false
    await tx.payment.create({
      data: { orderId, payMethod: 'ALIPAY', amount: order0.amount, status: 1 },
    })
    await tx.product.update({ where: { id: order0.productId }, data: { sales: { increment: order0.quantity } } })
    return true
  })

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { product: true, user: true } })
  if (!order) return
  // 非赢家且订单已完整交付 → 直接返回，杜绝重复发卡
  if (!won && order.deliveryStatus === 'DELIVERED') return

  const auto = order.product.deliveryType === 'AUTO'
  const sms = order.product.deliveryType === 'SMS'

  // ② 自动发货：幂等发卡——只补足该订单「尚缺」的数量（已发 = 该订单已占用的卡密数）。
  // 即使本函数被重复进入，也绝不会让一张订单的卡密总数超过其 quantity。
  let delivered = false
  if (auto) {
    const already = await prisma.cardKey.count({ where: { orderId: order.id, status: 'USED' } })
    let owned = already
    if (already < order.quantity) {
      // 单卡售价 = 订单总额按张数整数分摊；补发时只取「尚缺」的那几份，保证 Σ 单卡售价 === order.amount
      const unitPrices = splitAmount(Number(order.amount), order.quantity).slice(already)
      owned += await allocateCards(order.productId, order.id, order.quantity - already, unitPrices)
    }
    delivered = owned >= order.quantity
    if (delivered) {
      await prisma.order.update({
        where: { id: order.id },
        data: { deliveryStatus: 'DELIVERED', deliveredAt: new Date() },
      })
    } else {
      const remark = `${order.remark ? order.remark + ' | ' : ''}卡密库存不足(已发${owned}/${order.quantity})，待人工补发`
      await prisma.order.update({ where: { id: order.id }, data: { deliveryStatus: 'PROCESSING', remark } })
    }
    await syncAutoStock(order.productId)
  } else if (won) {
    // 非自动发货（人工/短信）：付款后置为处理中，等待人工/短信流程
    await prisma.order.update({ where: { id: order.id }, data: { deliveryStatus: 'PROCESSING' } })
  }

  // ②.5 企业微信通知。只在 won（首次把订单翻成 PAID）时推送——
  // 重复到账通知会让本函数被多次进入，但老板的手机不该被重复打扰。
  if (won) {
    const fresh = await prisma.product.findUnique({
      where: { id: order.productId },
      select: { name: true, stock: true },
    })
    notifyOrderPaid({
      orderNo: order.orderNo,
      buyer: order.user.nickname || order.user.email || `用户#${order.userId}`,
      productName: order.productName,
      quantity: order.quantity,
      amount: order.amount,
      paidAt: order.paidAt ?? new Date(),
      stock: fresh?.stock ?? null,
      delivered,
    })
    // 自动发货商品的库存 = 未使用卡密数，见底就要补货
    const threshold = Number(process.env.LOW_STOCK_THRESHOLD || 3)
    if (auto && fresh && fresh.stock >= 0 && fresh.stock <= threshold) {
      notifyLowStock({ productName: fresh.name, stock: fresh.stock, threshold })
    }
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
      await sendOrderPaidEmail(order.user.email, {
        orderNo: order.orderNo,
        productName: order.productName,
        amount: Number(order.amount),
        deliveryType: order.product.deliveryType,
        cards,
        cardUsage: order.product.cardUsage,
      })
    } catch (e) {
      console.error('[vmq] order paid email failed', e)
    }
  }
}

async function fulfillInvoice(invoiceId: number) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
  if (!invoice || invoice.payStatus === 'PAID') return
  const paidAt = new Date()
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { payStatus: 'PAID', status: 'SUBMITTED', paidAt, submittedAt: paidAt },
  })

  // 税费到账 = 这张票真的要开了。此时才推送，且一次给全：
  // 本单完整信息 + 当前全部待开清单 + 财务可直接操作的链接。
  try {
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
      paidAt,
      pending: pending.map((x) => ({
        invoiceNo: x.invoiceNo,
        title: x.title || '—',
        subscriptionType: x.subscriptionType,
        invoiceAmount: x.invoiceAmount == null ? null : Number(x.invoiceAmount),
      })),
      financeUrl: financeInvoiceUrl(),
    })
  } catch (e) {
    // 通知失败绝不能影响「税费已到账」这个既成事实
    console.error('[notify] 发票可开具通知组装失败', e)
  }
}

// 说明：VmqApk 的 /appHeart、/appPush 协议与其签名校验（checkHeartSign / checkPushSign）
// 已随 VmqApk 一并移除。到账通知统一走 SmsForwarder → POST /api/pay/sms-notify（token 鉴权）。
