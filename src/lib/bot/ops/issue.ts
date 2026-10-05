/**
 * 提卡（docs/微信机器人-设计.md §8、附录 B 第 5 条）：管理员在管理群 / 私聊 @机器人 提卡 <货号> <价格> [数量]
 * → 主站建一张「机器人提卡」订单、原子领卡 → 回执里直接给核销链接（站长 Q4：只认管理员身份，不要口令与确认页）。
 *
 * 【不能改错】
 *  · 全程在 T3 锁里（t3-lock.ts，非阻塞）：每日上限的检查与这次提卡串行，两条并发的提卡绕不过上限。
 *  · 一次 READ COMMITTED 事务（vmq.ts 发卡处的注释：可重复读下领卡循环会反复拿到同一张已被别人领走的卡）。
 *  · 建单只走 createShopOrder（全仓唯一建单入口）；**先加销量、后领卡**：syncAutoStock 那条 UPDATE 先锁 products 再读 card_keys，
 *    这里若先锁卡再锁商品，加锁顺序相反，会与并发的付款发卡死锁（§8.4 第 4 步）。
 *  · 领卡与 fulfillOrder 的 allocateCards、外部发卡 dispense 同一把 CAS：updateMany({ where: { id, status: 'UNUSED' } }) 且 count === 1 才算抢到；
 *    抢之前先试解密，解不开的条件更新成 DISABLED 并跳过（照 dispense.ts）；循环排除本次试过的 id；抢不够 → 抛错、整单回滚。
 *  · 售价按 splitAmount 分到每张（Σ = 订单金额），profit = 售价 − 成本，与付款发卡同口径。
 *  · 不写 payments、不调 fulfillOrder、不发买家邮件（账号没有邮箱）、不触发返现 / 抽奖 / 券 / 开票、不推 order.paid（§8.8）。
 *  · 同一条消息只成一次：bot_commands (adapter, msg_id) 唯一挡住重复回调；bot_card_issues.command_id 唯一是第二道。
 *  · 审计在事务里写（写不进去整单回滚）；审计、bot_commands、企业微信抄送里都**不写卡密**。核销链接只出现在回执里，
 *    回执在出队里加密存放（outbox.sealOutboxText）。
 *  · syncAutoStock、低库存告警、企业微信抄送都在提交之后。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../../db'
import { createShopOrder } from '../../order/create-shop-order'
import { cardKeyConfigured, decryptCardContent, syncAutoStock } from '../../cardkey'
import { hasProvider } from '../../redeem/registry'
import { fromCents, round2, splitAmount, toCents } from '../../money'
import { writeAudit } from '../../audit'
import { notify, notifyLowStock } from '../../notify'
import { bjDayStart } from '../../marketing/time'
import { linkOrigin, type BotConfig } from '../config'
import { yuan } from '../render'
import { findAutoProductByCode } from './products'
import { withT3Lock } from './t3-lock'

/** 单价上限（元），§8.3 */
export const MAX_UNIT_PRICE = 99_999.99

/** 业务性拒绝：message 直接回给管理员。alert = 值得抄送企业微信（例如撞上每日上限：可能是有人在盗用管理员微信） */
export class IssueError extends Error {
  alert: boolean
  constructor(message: string, opts?: { alert?: boolean }) {
    super(message)
    this.name = 'IssueError'
    this.alert = !!opts?.alert
  }
}

export interface IssueInput {
  commandId: number
  admin: { id: number; name: string; siteUserId: number | null }
  conversation: { id: number; kind: 'MGMT' | 'DM'; name: string | null }
  code: string
  /** 单价（元） */
  unitPrice: number
  quantity: number
  config: BotConfig
}

export interface IssuedCard {
  id: number
  /** 卡密明文：只进回执，不落库、不进日志 */
  plain: string
  /** 站内兑换页（卡上的兑换平台已注册时）；否则 null，回执给卡密明文 + redeemUrl */
  link: string | null
  redeemUrl: string | null
}

export interface IssueResult {
  issueId: number
  orderId: number
  orderNo: string
  productId: number
  productName: string
  botCode: string
  quantity: number
  unitPrice: number
  amount: number
  /** 这几张卡的成本合计；有卡没录成本时 null */
  costTotal: number | null
  profit: number | null
  stockAfter: number
  cards: IssuedCard[]
  warnings: string[]
}

const DELIVERED_TX_OPTIONS = { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, maxWait: 10_000, timeout: 20_000 }

export async function issueCards(input: IssueInput): Promise<IssueResult> {
  return withT3Lock(() => issueLocked(input))
}

async function issueLocked(input: IssueInput): Promise<IssueResult> {
  const { config, quantity: qty } = input
  if (!cardKeyConfigured()) throw new IssueError('服务器没有配置卡密密钥（CARDKEY_SECRET），不能提卡')
  const unitCents = toCents(input.unitPrice)
  if (!(unitCents > 0) || unitCents > toCents(MAX_UNIT_PRICE)) throw new IssueError(`单价要在 ¥0.01 到 ${yuan(MAX_UNIT_PRICE)} 之间`)
  if (!Number.isInteger(qty) || qty < 1) throw new IssueError('数量至少 1 张')
  if (qty > config.caps.issuePerCommand) throw new IssueError(`单次最多提 ${config.caps.issuePerCommand} 张（后台「微信机器人 → 设置」可改）`)

  const issueUserId = config.issueUserId
  if (!issueUserId) throw new IssueError('还没有提卡专用账号：请先执行部署说明里的种子 SQL（scripts/ops/bot-seed.sql）')
  if (!(await prisma.user.findUnique({ where: { id: issueUserId }, select: { id: true } }))) {
    throw new IssueError(`提卡专用账号（用户 #${issueUserId}）不存在，请检查 bot_config.issueUserId`)
  }

  const product = await findAutoProductByCode(input.code)
  const amountCents = unitCents * qty
  const amount = fromCents(amountCents)

  // 每日上限：北京时间自然日、按 bot_card_issues（§8.6）。在 T3 锁里，读到的已用量不会被并发的另一条提卡同时用掉
  const used = await prisma.botCardIssue.aggregate({ where: { createdAt: { gte: bjDayStart(new Date()) } }, _sum: { quantity: true, amount: true } })
  const usedQty = used._sum.quantity ?? 0
  const usedCents = toCents(Number(used._sum.amount ?? 0))
  if (usedQty + qty > config.caps.issuePerDay) {
    throw new IssueError(`超过今日提卡张数上限：今天已提 ${usedQty} 张，上限 ${config.caps.issuePerDay} 张`, { alert: true })
  }
  if (usedCents + amountCents > toCents(config.caps.issueAmountPerDay)) {
    throw new IssueError(`超过今日提卡金额上限：今天已提 ${yuan(fromCents(usedCents))}，上限 ${yuan(config.caps.issueAmountPerDay)}`, { alert: true })
  }
  // 预检（真正的判定是事务里的领卡循环）：明显不够就别建单再回滚
  const unused = await prisma.cardKey.count({ where: { productId: product.id, status: 'UNUSED' } })
  if (unused < qty) throw new IssueError(`库存不足：「${product.name}」未用卡 ${unused} 张，要提 ${qty} 张`)

  const now = new Date()
  const origin = linkOrigin(config)
  const unitPrices = splitAmount(amount, qty)

  const done = await prisma.$transaction(async (tx) => {
    const created = await createShopOrder(tx, {
      tenantId: 1,
      userId: issueUserId,
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      quantity: qty,
      amount,
      invoiceTaxFee: null,
      invoiceInfo: null,
      remark: `机器人提卡（指令 #${input.commandId}）`,
    })
    // 先加销量（锁 products），后领卡（锁 card_keys）：与 syncAutoStock 同一个加锁顺序
    await tx.product.update({ where: { id: product.id }, data: { sales: { increment: qty } } })
    const paid = await tx.order.updateMany({ where: { id: created.id, payStatus: 'UNPAID' }, data: { payStatus: 'PAID', paidAt: now } })
    if (paid.count !== 1) throw new Error(`提卡订单 ${created.orderNo} 翻成已付款失败`)

    const cards: (IssuedCard & { cost: number | null })[] = []
    const tried: number[] = []
    for (let attempt = 0; cards.length < qty && attempt < qty * 3 + 20; attempt++) {
      const card = await tx.cardKey.findFirst({
        where: { productId: product.id, status: 'UNUSED', ...(tried.length ? { id: { notIn: tried } } : {}) },
        orderBy: { id: 'asc' },
        select: { id: true, content: true, cost: true, redeemProvider: true, redeemUrl: true },
      })
      if (!card) break
      tried.push(card.id)
      let plain: string
      try {
        plain = decryptCardContent(card.content)
      } catch {
        // 坏卡隔离（照 dispense.ts）：不占用发不出去的卡。整单回滚时这条隔离也一起回滚，下次还会再试到它、再隔离
        await tx.cardKey.updateMany({ where: { id: card.id, status: 'UNUSED' }, data: { status: 'DISABLED', remark: '解密失败自动停用' } })
        continue
      }
      const soldPrice = unitPrices[cards.length]
      const cost = card.cost == null ? null : Number(card.cost)
      const r = await tx.cardKey.updateMany({
        where: { id: card.id, status: 'UNUSED' },
        data: {
          status: 'USED',
          orderId: created.id,
          usedAt: now,
          soldPrice: new Prisma.Decimal(soldPrice.toFixed(2)),
          // 同 allocateCards：成本缺失按 0 算利润
          profit: new Prisma.Decimal(round2(soldPrice - (cost ?? 0)).toFixed(2)),
        },
      })
      if (r.count !== 1) continue // 被并发领走（付款发卡 / 外部发卡），换下一张
      const inSite = !!card.redeemProvider && hasProvider(card.redeemProvider)
      cards.push({
        id: card.id,
        plain,
        cost,
        link: inSite ? `${origin}/redeem/${card.redeemProvider}?cdk=${encodeURIComponent(plain)}` : null,
        redeemUrl: inSite ? null : card.redeemUrl || product.cardRedeemUrl || null,
      })
    }
    if (cards.length < qty) throw new IssueError(`库存不足：只领到 ${cards.length} 张、要 ${qty} 张，已整单撤回（没有建单、没有动卡）`)

    await tx.order.update({ where: { id: created.id }, data: { deliveryStatus: 'DELIVERED', deliveredAt: now } })

    const costKnown = cards.every((c) => c.cost !== null)
    const costTotalCents = costKnown ? cards.reduce((s, c) => s + toCents(c.cost ?? 0), 0) : null
    const cardIds = cards.map((c) => c.id)
    const issue = await tx.botCardIssue.create({
      data: {
        commandId: input.commandId,
        adminId: input.admin.id,
        conversationId: input.conversation.id,
        orderId: created.id,
        orderNo: created.orderNo,
        productId: product.id,
        quantity: qty,
        unitPrice: new Prisma.Decimal(fromCents(unitCents).toFixed(2)),
        amount: new Prisma.Decimal(amount.toFixed(2)),
        costTotal: costTotalCents === null ? null : new Prisma.Decimal(fromCents(costTotalCents).toFixed(2)),
        cardIds,
      },
      select: { id: true },
    })
    // 审计写不进去 → 整单回滚（不留没有记录的提卡）。不写卡密，只写卡 id
    await writeAudit(tx, {
      actorUserId: input.admin.siteUserId,
      actorKind: 'PLATFORM',
      action: 'bot.card.issue',
      targetType: 'order',
      targetId: created.orderNo,
      diff: {
        via: 'wechat-bot',
        commandId: input.commandId,
        admin: input.admin.name,
        conversationId: input.conversation.id,
        productId: product.id,
        botCode: product.botCode,
        quantity: qty,
        unitPrice: fromCents(unitCents),
        amount,
        costTotal: costTotalCents === null ? null : fromCents(costTotalCents),
        cardIds,
      },
    })
    return { created, cards, issueId: issue.id, costTotalCents }
  }, DELIVERED_TX_OPTIONS)

  // ---- 提交之后 ----
  await syncAutoStock(product.id).catch((e) => console.error('[bot] 提卡后同步库存失败', product.id, (e as Error)?.message))
  const fresh = await prisma.product.findUnique({ where: { id: product.id }, select: { stock: true } }).catch(() => null)
  const stockAfter = fresh?.stock ?? Math.max(0, unused - qty)
  const threshold = Number(process.env.LOW_STOCK_THRESHOLD || 3)
  if (stockAfter >= 0 && stockAfter <= threshold) notifyLowStock({ productName: product.name, stock: stockAfter, threshold })

  const costTotal = done.costTotalCents === null ? null : fromCents(done.costTotalCents)
  const profit = done.costTotalCents === null ? null : fromCents(amountCents - done.costTotalCents)
  const warnings: string[] = []
  if (product.status !== 1) warnings.push('这个商品已下架（仍按指令提了卡）')
  if (done.costTotalCents !== null && amountCents < done.costTotalCents) warnings.push(`售价低于这几张卡的成本（${yuan(costTotal)}），打错了可以「改价」`)
  const siteCents = toCents(product.price)
  if (siteCents > 0 && unitCents < siteCents * config.priceWarn.belowRatio) {
    warnings.push(`单价不到站价 ${yuan(product.price)} 的 ${Math.round(config.priceWarn.belowRatio * 100)}%，打错了可以「改价」`)
  }
  if (siteCents > 0 && unitCents > siteCents * config.priceWarn.aboveRatio) {
    warnings.push(`单价超过站价 ${yuan(product.price)} 的 ${Math.round(config.priceWarn.aboveRatio * 100)}%，打错了可以「改价」`)
  }

  // 抄送企业微信（独立通道，不经过小号；§15）：不含卡密与核销链接
  notify(
    'bot.sensitive',
    [
      { label: '操作', value: '机器人提卡' },
      { label: '商品', value: `${product.name} ×${qty}` },
      { label: '金额', value: yuan(amount) },
      { label: '订单号', value: done.created.orderNo },
      { label: '操作人', value: input.admin.name },
      { label: '会话', value: `${input.conversation.kind === 'MGMT' ? '管理群' : '私聊'}${input.conversation.name ? `「${input.conversation.name}」` : ''}` },
    ],
    { link: '/admin/bot', linkText: '前往后台核对' }
  )

  return {
    issueId: done.issueId,
    orderId: done.created.id,
    orderNo: done.created.orderNo,
    productId: product.id,
    productName: product.name,
    botCode: product.botCode,
    quantity: qty,
    unitPrice: fromCents(unitCents),
    amount,
    costTotal,
    profit,
    stockAfter,
    cards: done.cards.map(({ id, plain, link, redeemUrl }) => ({ id, plain, link, redeemUrl })),
    warnings,
  }
}

/**
 * 回执文本（§8.5、附录 A）。纯函数，check 脚本逐字比对。核销链接 / 卡密只在这里出现，调用方把回复标 sensitive。
 *   ✅ 提卡成功｜ChatGPT Plus 月卡 ×1
 *   单价 ¥150.00 · 成本 ¥120.00 · 利润 ¥30.00
 *   订单号 20261005K3F9Q2AB · 剩余库存 17 张
 *   核销：https://bigolab.com/redeem/sysa?cdk=…
 */
export function renderIssueReceipt(r: Pick<IssueResult, 'productName' | 'quantity' | 'unitPrice' | 'amount' | 'costTotal' | 'profit' | 'orderNo' | 'stockAfter' | 'cards' | 'warnings'>): string {
  const lines: string[] = [`✅ 提卡成功｜${r.productName} ×${r.quantity}`]
  const price = r.quantity > 1 ? `单价 ${yuan(r.unitPrice)} × ${r.quantity} = ${yuan(r.amount)}` : `单价 ${yuan(r.unitPrice)}`
  lines.push(r.costTotal === null ? `${price} · 成本未知` : `${price} · 成本 ${yuan(r.costTotal)} · 利润 ${yuan(r.profit)}`)
  lines.push(`订单号 ${r.orderNo} · 剩余库存 ${r.stockAfter} 张`)
  r.cards.forEach((c, i) => {
    const n = r.cards.length > 1 ? ` ${i + 1}` : ''
    if (c.link) lines.push(`核销${n}：${c.link}`)
    else lines.push(`卡密${n}：${c.plain}${c.redeemUrl ? `\n兑换地址：${c.redeemUrl}` : ''}`)
  })
  for (const w of r.warnings) lines.push(`⚠️ ${w}`)
  return lines.join('\n')
}
