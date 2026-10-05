/**
 * 改价（docs/微信机器人-设计.md §8.9）：`改价 <订单号> <单价>`，只限提卡账号的、7 天内的订单——提卡时价格打错了用它改。
 * 同一事务里改订单 amount、按 splitAmount 重算该单每张卡的 soldPrice 与 profit、同步 bot_card_issues 的单价与金额；
 * 审计（事务内，写不进去整单回滚）+ 抄送企业微信。经 T3 锁串行。
 * 不改 productPrice（那是下单时的站价快照）；已取消的单不改。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../../db'
import { fromCents, round2, splitAmount, toCents } from '../../money'
import { writeAudit } from '../../audit'
import { notify } from '../../notify'
import type { BotConfig } from '../config'
import { yuan } from '../render'
import { MAX_UNIT_PRICE } from './issue'
import { withT3Lock } from './t3-lock'

const WINDOW_MS = 7 * 86400_000

export class RepriceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RepriceError'
  }
}

export interface RepriceInput {
  commandId: number
  admin: { id: number; name: string; siteUserId: number | null }
  conversationId: number
  orderNo: string
  unitPrice: number
  config: BotConfig
}

export interface RepriceResult {
  orderNo: string
  productName: string
  quantity: number
  fromAmount: number
  toAmount: number
  unitPrice: number
  profit: number | null
}

export async function repriceIssuedOrder(input: RepriceInput): Promise<RepriceResult> {
  return withT3Lock(() => repriceLocked(input))
}

async function repriceLocked(input: RepriceInput): Promise<RepriceResult> {
  const unitCents = toCents(input.unitPrice)
  if (!(unitCents > 0) || unitCents > toCents(MAX_UNIT_PRICE)) throw new RepriceError(`单价要在 ¥0.01 到 ${yuan(MAX_UNIT_PRICE)} 之间`)
  const issueUserId = input.config.issueUserId
  if (!issueUserId) throw new RepriceError('还没有提卡专用账号，没有可改价的提卡单')

  const order = await prisma.order.findUnique({
    where: { orderNo: input.orderNo },
    select: { id: true, orderNo: true, userId: true, tenantId: true, productName: true, quantity: true, amount: true, payStatus: true, deliveryStatus: true, createdAt: true },
  })
  // 不是提卡单一律说「找不到」：不借这个指令确认别的订单存不存在
  if (!order || order.userId !== issueUserId || order.tenantId !== 1) throw new RepriceError(`找不到提卡单 ${input.orderNo}（改价只限机器人提的卡）`)
  if (Date.now() - order.createdAt.getTime() > WINDOW_MS) throw new RepriceError('只能改 7 天内的提卡单；更早的请在后台处理')
  if (order.payStatus !== 'PAID' || order.deliveryStatus === 'CANCELLED') throw new RepriceError('这张提卡单已取消或已退款，不能改价')

  const fromAmount = Number(order.amount)
  const toCentsTotal = unitCents * order.quantity
  const toAmount = fromCents(toCentsTotal)
  if (toCents(fromAmount) === toCentsTotal) throw new RepriceError(`价格没有变化（现在就是 ${yuan(toAmount)}）`)

  const profitCents = await prisma.$transaction(
    async (tx) => {
      // 条件更新：金额仍是读到的旧值才改（并发改价时只有一个成功）
      const r = await tx.order.updateMany({ where: { id: order.id, amount: order.amount }, data: { amount: new Prisma.Decimal(toAmount.toFixed(2)) } })
      if (r.count !== 1) throw new RepriceError('这张单刚被改过，请重新查看后再改')
      const cards = await tx.cardKey.findMany({ where: { orderId: order.id, status: 'USED' }, orderBy: { id: 'asc' }, select: { id: true, cost: true } })
      const prices = splitAmount(toAmount, Math.max(order.quantity, cards.length))
      let profitSum = 0
      let costKnown = true
      for (let i = 0; i < cards.length; i++) {
        const sold = prices[i] ?? 0
        const cost = cards[i].cost == null ? null : Number(cards[i].cost)
        if (cost === null) costKnown = false
        const profit = round2(sold - (cost ?? 0))
        profitSum += toCents(profit)
        await tx.cardKey.update({
          where: { id: cards[i].id },
          data: { soldPrice: new Prisma.Decimal(sold.toFixed(2)), profit: new Prisma.Decimal(profit.toFixed(2)) },
        })
      }
      await tx.botCardIssue.updateMany({
        where: { orderId: order.id },
        data: { unitPrice: new Prisma.Decimal(fromCents(unitCents).toFixed(2)), amount: new Prisma.Decimal(toAmount.toFixed(2)) },
      })
      await writeAudit(tx, {
        actorUserId: input.admin.siteUserId,
        actorKind: 'PLATFORM',
        action: 'bot.order.reprice',
        targetType: 'order',
        targetId: order.orderNo,
        diff: { via: 'wechat-bot', commandId: input.commandId, admin: input.admin.name, conversationId: input.conversationId, from: fromAmount, to: toAmount, quantity: order.quantity, cardIds: cards.map((c) => c.id) },
      })
      return costKnown ? profitSum : null
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 10_000, timeout: 20_000 }
  )

  notify(
    'bot.sensitive',
    [
      { label: '操作', value: '机器人改价（提卡单）' },
      { label: '订单号', value: order.orderNo },
      { label: '商品', value: `${order.productName} ×${order.quantity}` },
      { label: '金额', value: `${yuan(fromAmount)} → ${yuan(toAmount)}` },
      { label: '操作人', value: input.admin.name },
    ],
    { link: '/admin/bot', linkText: '前往后台核对' }
  )

  return {
    orderNo: order.orderNo,
    productName: order.productName,
    quantity: order.quantity,
    fromAmount,
    toAmount,
    unitPrice: fromCents(unitCents),
    profit: profitCents === null ? null : fromCents(profitCents),
  }
}
