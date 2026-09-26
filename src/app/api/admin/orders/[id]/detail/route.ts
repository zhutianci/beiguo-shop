export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { toCents, fromCents } from '@/lib/money'
import { couponLabel } from '@/lib/coupon'
import { parseOrderInvoiceDraft, shopOrderSourceKey } from '@/lib/order-invoice'
import { invoicesForOrder } from '@/lib/order-link'
import { parsePrizeSnapshot } from '@/lib/lottery'
import { adminOrResponse, sourceMap, sourceOf } from '@/lib/admin/source-site'
import { getOrderSettlementViews } from '@/lib/tenant/balances'
import { channelProfit, channelProfitHint, smsChargedCost } from '@/lib/admin/channel-profit'

function num(v: unknown): number | null {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * 后台订单详情（只读）：一张订单牵出去的所有东西 —— 付款、券、内推、发票、收据、抽奖、收款单。
 *
 * 【为什么单独一个 GET，而不是继续靠列表行】
 *  · 列表行只有订单本身；发票要经 ExternalOrder 两根线索手工连（lib/order-link.ts），
 *    券 / 内推 / 抽奖也各在各的表，不值得给整页 20 行都查一遍
 *  · 深链 /admin/orders?orderId=… 要能打开**不在当前页**的订单（从发票详情、余额流水点过来）
 *
 * 只读，不做任何修复性写入：发现「税费已收、发票没落地」这类异常只负责如实展示。
 * 修改仍走同目录的 PUT（../route.ts）。
 *
 * 本文件在新建的子目录里，动态参数用 Next 14 原生的 { params: { id: string } } 写法。
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  // 中间件之外再验一次（CVE-2025-29927：带特定请求头可整个跳过 middleware）；渠道 Host → 404
  const auth = await adminOrResponse()
  if ('res' in auth) return auth.res

  try {
    const id = parseInt(params.id)
    if (!Number.isSafeInteger(id) || id <= 0) return notFound('订单不存在')

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, nickname: true, phone: true } },
        product: { select: { id: true, name: true, deliveryType: true } },
        payments: {
          select: { id: true, tradeNo: true, payMethod: true, amount: true, status: true, createdAt: true },
          orderBy: { id: 'desc' },
        },
      },
    })
    if (!order) return notFound('订单不存在')

    const key = shopOrderSourceKey(id)
    const [invoices, exts, grant, referrer, rewardRow, entry, vmqOrders, cardCount] = await Promise.all([
      invoicesForOrder(id),
      // 与发票同一套线索：shopOrderId（WEB 导入行也有）+ 'order:<id>'（背书行）
      prisma.externalOrder.findMany({
        where: { OR: [{ shopOrderId: id }, { sourceKey: key }] },
        select: {
          id: true,
          sourceKey: true,
          importBatch: true,
          claudeAccount: true,
          subscriptionType: true,
          startDate: true,
          expireDate: true,
        },
        orderBy: { id: 'asc' },
      }),
      order.couponGrantId
        ? prisma.couponGrant.findUnique({
            where: { id: order.couponGrantId },
            select: {
              id: true,
              state: true,
              orderId: true,
              lockedAt: true,
              usedAt: true,
              expiresAt: true,
              coupon: {
                select: { id: true, name: true, code: true, source: true, kind: true, minAmount: true, discount: true },
              },
            },
          })
        : Promise.resolve(null),
      order.referrerId
        ? prisma.user.findUnique({
            where: { id: order.referrerId },
            select: { id: true, email: true, nickname: true },
          })
        : Promise.resolve(null),
      order.referrerId
        ? prisma.referralReward.findUnique({
            where: { orderId: id },
            select: { id: true, referrerId: true, amount: true, status: true, createdAt: true, settledAt: true },
          })
        : Promise.resolve(null),
      prisma.lotteryEntry.findUnique({ where: { orderId: id } }),
      prisma.vmqOrder.findMany({
        where: { bizType: 'order', bizId: id },
        // 不回传 VmqOrder.orderId：它是买家付款链接 /pay/<orderId> 里的不可枚举令牌，这里用不上
        select: {
          id: true,
          state: true,
          price: true,
          reallyPrice: true,
          createdAt: true,
          payDate: true,
        },
        orderBy: { id: 'desc' },
      }),
      prisma.cardKey.count({ where: { orderId: id, status: 'USED' } }),
    ])

    // 收据：挂在这张订单的外部订单行上；外部订单行被改 key / 删掉后，收据上的 sourceKey 快照兜底
    const extIds = exts.map((e) => e.id)
    const receipts = await prisma.receipt.findMany({
      where: {
        OR: [...(extIds.length ? [{ externalOrderId: { in: extIds } }] : []), { sourceKey: key }],
      },
      select: {
        id: true,
        receiptNo: true,
        token: true,
        amount: true,
        payerTitle: true,
        source: true,
        issuedAt: true,
        createdAt: true,
      },
      orderBy: { id: 'desc' },
    })

    // 抽奖中的券：看得到它现在是否已用 / 被作废（退款时 voidLotteryForOrder 会作废未用的券）
    const lotteryGrant =
      entry?.couponGrantId != null
        ? await prisma.couponGrant.findUnique({
            where: { id: entry.couponGrantId },
            select: { id: true, state: true, expiresAt: true, usedAt: true, orderId: true },
          })
        : null

    const { user, product, payments, ...o } = order
    const amount = Number(o.amount)
    const src = sourceOf(await sourceMap([o.tenantId]), o.tenantId)
    const channel = o.tenantId !== 1 ? await channelSection(o, product.deliveryType, cardCount, invoices) : null
    const invoiceTaxFee = num(o.invoiceTaxFee)
    const draft = parseOrderInvoiceDraft(o.invoiceInfo)

    return success({
      order: {
        ...o,
        productPrice: Number(o.productPrice),
        amount,
        invoiceTaxFee,
        // 实付 = 货款 + 随单税费（amount 永远不含税，见 schema 注释），按分相加避免浮点尾差
        payable: fromCents(toCents(amount) + toCents(invoiceTaxFee ?? 0)),
        referralReward: num(o.referralReward),
        couponDiscount: num(o.couponDiscount),
        originalAmount: num(o.originalAmount),
        supplyUnitPrice: num(o.supplyUnitPrice),
        mainPriceAtOrder: num(o.mainPriceAtOrder),
        // 买家备注：优先 buyerRemark（双写过渡，设计 5.4）；remark 可能被系统追加过内部说明
        buyerRemarkText: o.buyerRemark ?? o.remark,
      },
      source: src,
      // 渠道单：结算快照、各成分分录、售后申请、退款弹窗要用的上下文（主站单为 null）
      channel,
      user,
      product,
      payments: payments.map((p) => ({ ...p, amount: Number(p.amount) })),
      coupon: grant
        ? {
            grantId: grant.id,
            state: grant.state,
            // 券当前锁在 / 用在哪张订单（正常情况就是本单；不是本单说明被释放后又用到了别处）
            grantOrderId: grant.orderId,
            lockedAt: grant.lockedAt,
            usedAt: grant.usedAt,
            expiresAt: grant.expiresAt,
            couponId: grant.coupon.id,
            name: grant.coupon.name,
            code: grant.coupon.code,
            source: grant.coupon.source,
            label: couponLabel({
              kind: grant.coupon.kind,
              minAmount: Number(grant.coupon.minAmount),
              discount: Number(grant.coupon.discount),
            }),
          }
        : null,
      referral: o.referrerId
        ? {
            referrer: referrer ?? { id: o.referrerId, email: null, nickname: null },
            referrerMissing: !referrer,
            // 下单那一刻算好的返现快照；为空 = 这单通过链接下单但返现为 0（或用了券，两者互斥）
            rewardSnapshot: num(o.referralReward),
            // 真正入账的记录：交付完成时由 settleReferral 写入，没有 = 尚未结算
            rewardRow: rewardRow
              ? {
                  id: rewardRow.id,
                  referrerId: rewardRow.referrerId,
                  amount: Number(rewardRow.amount),
                  status: rewardRow.status,
                  createdAt: rewardRow.createdAt,
                  settledAt: rewardRow.settledAt,
                }
              : null,
          }
        : null,
      invoices,
      invoiceDraft: draft,
      externalOrders: exts,
      receipts: receipts.map((r) => ({
        id: r.id,
        receiptNo: r.receiptNo,
        amount: Number(r.amount),
        payerTitle: r.payerTitle,
        source: r.source,
        issuedAt: r.issuedAt,
        createdAt: r.createdAt,
        // 收据页是公开的 token 链接（不可枚举），没有 token 的历史收据没有可访问的页面
        link: r.token ? `/receipt/${r.token}` : null,
      })),
      lottery: entry
        ? {
            id: entry.id,
            state: entry.state,
            won: entry.won,
            prizeId: entry.prizeId,
            prizeName: entry.prizeName,
            prizeType: entry.prizeType,
            prizeLabel: parsePrizeSnapshot(entry.prizeDetail)?.label ?? entry.prizeName,
            fulfillState: entry.fulfillState,
            fulfilledAt: entry.fulfilledAt,
            fulfillNote: entry.fulfillNote,
            drawnAt: entry.drawnAt,
            createdAt: entry.createdAt,
            couponGrantId: entry.couponGrantId,
            couponGrant: lotteryGrant,
          }
        : null,
      vmqOrders: vmqOrders.map((v) => ({
        ...v,
        price: Number(v.price),
        reallyPrice: Number(v.reallyPrice),
      })),
      cardCount,
    })
  } catch (err) {
    console.error('Admin order detail error:', err)
    return error('获取订单详情失败')
  }
}

/**
 * 渠道单的超管视图（设计 12.2「渠道单详情显示结算快照、各成分分录、售后申请、escalatedAt、卡密使用情况面板」）。
 * 这里是超管侧：分录带 eventKey / memo / 操作人，成本只作「参考：真实成本」给退款弹窗显示、**不预填** loss（设计 8.4）。
 */
async function channelSection(
  o: {
    id: number
    tenantId: number
    quantity: number
    amount: unknown
    invoiceTaxFee: unknown
    supplyCents: number | null
    deliveryStatus: string
    refundedGoodsCents: number | null
    refundedTaxCents: number | null
    refundedQty: number | null
    shortCents: number | null
    payStatus: string
    settleState: string | null
    settleRefundedCents: number | null
    settleLossCents: number | null
  },
  deliveryType: string,
  cardCount: number,
  invoices: { payStatus: string; taxFee: number | null }[],
) {
  const [views, ledger, afterSales, partnerReplies, costAgg, sms, pendingAfterSales, cardCosts, smsAny] = await Promise.all([
    getOrderSettlementViews(o.tenantId, [o.id]).catch(() => new Map()),
    prisma.tenantLedgerEntry.findMany({
      where: { orderId: o.id, tenantId: o.tenantId },
      orderBy: { id: 'asc' },
      take: 200,
      select: { id: true, eventKey: true, leg: true, type: true, component: true, bucket: true, amountCents: true, memo: true, publicMemo: true, operatorId: true, statementId: true, createdAt: true },
    }),
    prisma.tenantAfterSale.findMany({
      where: { orderId: o.id, tenantId: o.tenantId },
      orderBy: { id: 'desc' },
      take: 50,
      select: {
        id: true,
        requestNo: true,
        kind: true,
        status: true,
        reason: true,
        suggestedBearer: true,
        suggestedGoodsCents: true,
        resultNote: true,
        bearer: true,
        refundGoodsCents: true,
        refundTaxCents: true,
        lossCents: true,
        createdAt: true,
        handledAt: true,
      },
    }),
    prisma.orderMessage.count({ where: { orderId: o.id, senderRole: 'PARTNER' } }),
    deliveryType === 'AUTO' ? prisma.cardKey.aggregate({ where: { orderId: o.id, status: 'USED' }, _sum: { cost: true } }) : Promise.resolve(null),
    deliveryType === 'SMS' ? prisma.smsActivation.findFirst({ where: { orderId: o.id }, orderBy: { id: 'desc' }, select: { cost: true } }) : Promise.resolve(null),
    prisma.tenantAfterSale.count({ where: { orderId: o.id, tenantId: o.tenantId, status: 'PENDING' } }),
    // 站长利润（二期 M2）按与列表同一口径取成本：逐张卡的 cost（要知道有没有未录入的）+ 接码记录，不看 deliveryType，
    // 理由见 lib/admin/channel-profit.ts 的 channelCost。上面的 costAgg / sms 仍只喂退款弹窗的 costRefYuan，不动
    prisma.cardKey.findMany({ where: { orderId: o.id, status: 'USED' }, select: { cost: true } }),
    prisma.smsActivation.findUnique({ where: { orderId: o.id }, select: { cost: true, status: true } }),
  ])
  const A = toCents(Number(o.amount))
  const T = o.invoiceTaxFee == null ? 0 : toCents(Number(o.invoiceTaxFee))
  const RG = o.refundedGoodsCents ?? 0
  const Rt = o.refundedTaxCents ?? 0
  const x = Math.max(0, o.shortCents ?? 0)
  // 真实成本仅供参考（设计 8.4：弹窗显示「参考：真实成本 ¥x」，不预填 loss）
  const costRef = costAgg ? Number(costAgg._sum.cost ?? 0) : sms?.cost != null ? Number(sms.cost) : null
  const settlement = views.get(o.id) ?? null

  /*
   * 站长利润（二期 M2）：进货净额（扣除退款）− 成本，与列表、汇总同一个纯函数。未付单没有利润（null）。
   * 另附两项「仅供参考、不计入利润」：
   *  · 手续费收入 = 账本里这单的 FEE + INVOICE_FEE（只有已计提的单有分录；未计提 / 成员自买为 0）；
   *  · 发票利润 = 实收税费 − 已退税费 − 发票分成，与运营概览 invoiceProfitCents 同口径
   *    （结账随单税费优先；没有时取已付税费的关联发票，同 overview 的「事后开票」口径）。
   */
  const paidLike = o.payStatus === 'PAID' || o.payStatus === 'REFUNDED'
  const profit = paidLike
    ? channelProfit(
        {
          amountCents: A,
          supplyCents: o.supplyCents,
          settleState: o.settleState,
          refundedGoodsCents: o.refundedGoodsCents,
          settleRefundedCents: o.settleRefundedCents,
          settleLossCents: o.settleLossCents,
        },
        { cardCosts: cardCosts.map((c) => c.cost), smsCost: smsAny ? smsChargedCost(smsAny.cost, smsAny.status) : undefined, deliveryType, expectQty: o.quantity - (o.refundedQty ?? 0) },
      )
    : null
  const taxIn = T > 0 ? T : invoices.filter((iv) => iv.payStatus === 'PAID').reduce((n, iv) => n + toCents(iv.taxFee ?? 0), 0)
  const ownerProfit = profit
    ? {
        ...profit,
        hint: channelProfitHint(profit),
        feeIncomeCents: settlement ? settlement.feeCents : 0,
        invoiceProfitCents: paidLike ? taxIn - Rt - (settlement?.invShareCents ?? 0) : 0,
      }
    : null
  return {
    settlement,
    ownerProfit,
    ledger,
    afterSales,
    pendingAfterSales,
    partnerReplies,
    refundContext: {
      amountCents: A,
      /** 结账随单税费；事后开票的税费见发票区（由服务端 applyRefund 按关联发票取基数） */
      checkoutTaxCents: T,
      refundedGoodsCents: RG,
      refundedTaxCents: Rt,
      refundedQty: o.refundedQty ?? 0,
      quantity: o.quantity,
      supplyCents: o.supplyCents,
      shortCents: x,
      /** 尚未抵扣的少付额 = x − min(x, RG + Rt)（设计 8.4 ②） */
      shortUnappliedCents: x - Math.min(x, RG + Rt),
      deliveredQty: deliveryType === 'AUTO' ? cardCount : o.deliveryStatus === 'DELIVERED' ? o.quantity : 0,
      deliveryType,
      costRefYuan: costRef,
    },
  }
}
