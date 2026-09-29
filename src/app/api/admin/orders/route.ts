export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma, DeliveryStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { success, error } from '@/lib/api'
import { decryptCardContent } from '@/lib/cardkey'
import { round2, toCents } from '@/lib/money'
import { adminGuard } from '@/lib/admin-guard'
import { excludeTopup, isCarrierType } from '@/lib/order-scope'
import { describeTopupRemark } from '@/lib/wallet/topup'
import { settledReferralCents } from '@/lib/referral-report'
import { parseTenantFilter, INVALID_TENANT_FILTER, siteOptions, sourceMap, sourceOf } from '@/lib/admin/source-site'
import { channelProfit, smsChargedCost, type ChannelProfit } from '@/lib/admin/channel-profit'
import { listFooter } from '@/lib/jiema/report'

const PLATFORM_TENANT_ID = 1

/** 渠道单算利润要的订单列（二期 M2；口径见 lib/admin/channel-profit.ts） */
const CHANNEL_PROFIT_ORDER_SELECT = {
  id: true,
  amount: true,
  quantity: true,
  supplyCents: true,
  settleState: true,
  refundedGoodsCents: true,
  settleRefundedCents: true,
  settleLossCents: true,
  refundedQty: true,
  product: { select: { deliveryType: true } },
} as const satisfies Prisma.OrderSelect

type ChannelProfitOrderRow = Prisma.OrderGetPayload<{ select: typeof CHANNEL_PROFIT_ORDER_SELECT }>

/**
 * 一批渠道单（已付 / 已退款）的站长利润。卡密成本与接码成本都按 orderId 批量取，一批两次查询。
 * 只数 status=USED 的卡：已退件但已发出的卡成本照样计入（卡已经送出去了）。
 */
async function channelProfitMap(rows: ChannelProfitOrderRow[]): Promise<Map<number, ChannelProfit | null>> {
  const out = new Map<number, ChannelProfit | null>()
  if (!rows.length) return out
  const ids = rows.map((r) => r.id)
  const [cards, sms] = await Promise.all([
    prisma.cardKey.findMany({ where: { orderId: { in: ids }, status: 'USED' }, select: { orderId: true, cost: true } }),
    // orderId 在 sms_activations 上唯一，一单最多一条（与详情 channelSection 同口径）
    prisma.smsActivation.findMany({ where: { orderId: { in: ids } }, select: { orderId: true, cost: true, status: true } }),
  ])
  const costsOf = new Map<number, unknown[]>()
  for (const c of cards) {
    const arr = costsOf.get(c.orderId as number) ?? []
    arr.push(c.cost)
    costsOf.set(c.orderId as number, arr)
  }
  const smsOf = new Map(sms.map((x) => [x.orderId, smsChargedCost(x.cost, x.status)]))
  for (const r of rows) {
    out.set(
      r.id,
      channelProfit(
        {
          amountCents: toCents(Number(r.amount)),
          supplyCents: r.supplyCents,
          settleState: r.settleState,
          refundedGoodsCents: r.refundedGoodsCents,
          settleRefundedCents: r.settleRefundedCents,
          settleLossCents: r.settleLossCents,
        },
        {
          cardCosts: costsOf.get(r.id) ?? [],
          smsCost: smsOf.get(r.id),
          deliveryType: r.product?.deliveryType ?? null,
          expectQty: r.quantity - (r.refundedQty ?? 0),
        },
      ),
    )
  }
  return out
}

// 获取所有订单（服务端检索 + 筛选 + 分页）
export async function GET(request: NextRequest) {
  const denied = await adminGuard()
  if (denied) return denied
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const keyword = (searchParams.get('keyword') || '').trim()
    const unreplied = ['1', 'true'].includes((searchParams.get('unreplied') || '').toLowerCase())
    const page = Math.max(parseInt(searchParams.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20') || 20, 1), 100)
    const from = (searchParams.get('from') || '').trim() // YYYY-MM-DD，按下单时间
    const to = (searchParams.get('to') || '').trim()
    const categoryId = parseInt(searchParams.get('categoryId') || '0') || 0
    // 来源站（设计 12.2）：tenantId=<id>|all，默认全部；传坏了 400，不静默退化成全站
    const site = parseTenantFilter(searchParams)
    if (site === 'invalid') return error(INVALID_TENANT_FILTER)

    const where: Prisma.OrderWhereInput = {}
    if (site != null) where.tenantId = site
    if (status && ['PENDING', 'PROCESSING', 'DELIVERED', 'CANCELLED'].includes(status)) {
      where.deliveryStatus = status as DeliveryStatus
    }
    // 日期区间：to 取当天 23:59:59.999，保证「同一天」也能查到
    if (from || to) {
      const createdAt: Prisma.DateTimeFilter = {}
      if (from) {
        const d = new Date(`${from}T00:00:00`)
        if (!isNaN(d.getTime())) createdAt.gte = d
      }
      if (to) {
        const d = new Date(`${to}T23:59:59.999`)
        if (!isNaN(d.getTime())) createdAt.lte = d
      }
      if (createdAt.gte || createdAt.lte) where.createdAt = createdAt
    }
    // 商品分类：走 Order → Product → categoryId 关系，无需在订单上冗余列。
    // 注意分类不是快照，商品事后改分类会让历史订单的归类跟着变。
    if (categoryId) where.product = { categoryId }
    // 关键词跨全表检索：订单号 / 商品名 / 用户邮箱 / 用户昵称（MySQL 默认排序规则大小写不敏感）
    if (keyword) {
      where.OR = [
        { orderNo: { contains: keyword } },
        { productName: { contains: keyword } },
        { user: { email: { contains: keyword } } },
        { user: { nickname: { contains: keyword } } },
      ]
    }
    // 只看「未回复」：存在买家发来且商家未读的留言
    if (unreplied) {
      where.messages = { some: { sender: 'BUYER', readByAdmin: false } }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nickname: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              categoryId: true,
              category: { select: { id: true, name: true } },
              deliveryType: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ])

    // 附带每张订单实际发出的卡密（自动发货），便于核对「发了哪个卡密 / 是否误发多张」
    const paidIds = orders.filter((o) => o.payStatus === 'PAID').map((o) => o.id)
    const cardMap = new Map<number, string[]>()
    // 本页每张订单的成本/利润：直接汇总卡密上已落库的 cost/profit，不在这里现算
    const moneyMap = new Map<number, { cost: number; profit: number; hasUnknownProfit: boolean }>()
    if (paidIds.length) {
      const cards = await prisma.cardKey.findMany({
        where: { orderId: { in: paidIds }, status: 'USED' },
        orderBy: { id: 'asc' },
      })
      for (const c of cards) {
        let plain = ''
        try {
          plain = decryptCardContent(c.content)
        } catch {
          plain = '(卡密解密失败)'
        }
        const oid = c.orderId as number
        const arr = cardMap.get(oid) || []
        arr.push(plain)
        cardMap.set(oid, arr)

        const m = moneyMap.get(oid) || { cost: 0, profit: 0, hasUnknownProfit: false }
        m.cost = round2(m.cost + Number(c.cost ?? 0))
        if (c.profit == null) m.hasUnknownProfit = true
        else m.profit = round2(m.profit + Number(c.profit))
        moneyMap.set(oid, m)
      }
    }
    // 已结算的内推返现（分）。「利润」列要扣掉它：返现是已经进了推广人余额、可以提现的真钱，
    // CardKey.profit 只是卡差价（口径说明见 lib/referral-report.ts）
    const rewardMap = paidIds.length ? await settledReferralCents(paidIds) : new Map<number, number>()

    // 统计每张订单「买家发来、商家未读」的留言数，用于列表红点提醒
    const allIds = orders.map((o) => o.id)
    const unreadMap = new Map<number, number>()
    if (allIds.length) {
      const grouped = await prisma.orderMessage.groupBy({
        by: ['orderId'],
        where: { orderId: { in: allIds }, sender: 'BUYER', readByAdmin: false },
        _count: { _all: true },
      })
      for (const g of grouped) unreadMap.set(g.orderId, g._count._all)
    }

    // 渠道单的站长利润（二期 M2）：已付与已退款的都算（已退款单的利润可能是负的，正是要看的）；未付单没有利润
    const chRows = orders.filter((o) => o.tenantId !== PLATFORM_TENANT_ID && (o.payStatus === 'PAID' || o.payStatus === 'REFUNDED'))
    const rowProfit = await channelProfitMap(
      chRows.length
        ? await prisma.order.findMany({ where: { id: { in: chRows.map((o) => o.id) } }, select: CHANNEL_PROFIT_ORDER_SELECT })
        : [],
    )

    const srcMap = await sourceMap(orders.map((o) => o.tenantId))
    /*
     * 短信接码单（SMS_POOL）的成本利润（docs/短信接码-设计.md §6.6 第 28 条、§9.5）：联查 sms_orders，给 costCents / profitCents / costFinal / lossCents
     * （未定稿 = 预估，页面灰字；已取消单成本利润落空 = 「不计」）。接码单没有卡密，不与上面的卡密口径重复。
     */
    const smsIds = orders.filter((o) => o.product.deliveryType === 'SMS_POOL').map((o) => o.id)
    const smsMap = new Map(
      (smsIds.length
        ? await prisma.smsOrder.findMany({ where: { orderId: { in: smsIds } }, select: { orderId: true, state: true, chargedMicro: true, costCents: true, profitCents: true, costFinal: true, lossCents: true } })
        : []
      ).map((r) => [r.orderId, r]),
    )
    const list = orders.map((o) => {
      const m = moneyMap.get(o.id)
      // 只对有卡的单扣返现：人工发货单本来就没有卡密利润（显示 —），扣了会凭空冒出负数
      const refC = m ? rewardMap.get(o.id) ?? 0 : 0
      return {
        ...o,
        cards: cardMap.get(o.id) || [],
        unreadCount: unreadMap.get(o.id) || 0,
        // 卡密维度的成本/利润；非自动发货订单没有卡密，profit 为 null 表示「无卡密可核算」
        cardCost: m ? m.cost : null,
        cardProfit: m && !m.hasUnknownProfit ? round2(m.profit - refC / 100) : null,
        /** 该单已扣的内推返现（元）。无卡密的单为 null */
        cardReferral: m ? refC / 100 : null,
        cardProfitUnknown: m ? m.hasUnknownProfit : false,
        // 渠道单：站长利润 = 进货净额 − 成本（分，口径见 lib/admin/channel-profit.ts）。主站单恒为 null，
        // 页面据此分叉：主站单仍用上面的 cardCost / cardProfit，逐字不变
        channelProfit: o.tenantId !== PLATFORM_TENANT_ID ? rowProfit.get(o.id) ?? null : null,
        // 来源站 = 下单时的店面（设计 5.5）
        source: sourceOf(srcMap, o.tenantId),
        // 买家备注：新订单双写 buyerRemark，历史订单只有 remark（设计 5.4 双写过渡）；remark 之后可能被系统追加内部说明。
        // 载体单（充值 / 接码）的 remark 是内部字段（topup|ct:…），不回退成「买家备注」，另给 internalRemarkText（B1 评审修复）
        buyerRemarkText: isCarrierType(o.product.deliveryType) ? o.buyerRemark : o.buyerRemark ?? o.remark,
        carrier: isCarrierType(o.product.deliveryType),
        jiema: (() => {
          const j = smsMap.get(o.id)
          return j ? { state: j.state, chargedMicro: j.chargedMicro, costCents: j.costCents, profitCents: j.profitCents, costFinal: j.costFinal, lossCents: j.lossCents } : null
        })(),
        internalRemarkText: isCarrierType(o.product.deliveryType)
          ? o.product.deliveryType === 'TOPUP'
            ? describeTopupRemark(o.remark)
            : o.remark
          : null,
      }
    })

    // 筛选范围的汇总。成本/利润要按 orderId 汇总卡密，CardKey 与 Order 没有 Prisma 关系，
    // 只能先取 id 集合再聚合；范围过大时如实返回 truncated 而不是给个错数字。
    const TOTALS_ID_CAP = 10000
    // 流水合计不含充值单（充值是预收款、不计营收，docs/短信接码-设计.md D40、§6.6 第 17 条）；列表本身仍列出充值单（后台只读）
    const amountAgg = await prisma.order.aggregate({
      where: { AND: [where, excludeTopup()] },
      _sum: { amount: true },
      _count: { _all: true },
    })
    // 渠道流水（渠道售价之和）：与上面的「流水合计」同一筛选、同一口径（含未付单），是它的子集。
    // 用 aggregate 算，不受 TOTALS_ID_CAP 限制；筛主站时 where.tenantId=1，这里恒为 0
    const channelAmountAgg = await prisma.order.aggregate({
      where: { AND: [where, { tenantId: { not: PLATFORM_TENANT_ID } }] },
      _sum: { amount: true },
      _count: { _all: true },
    })
    let totalsCost: number | null = null
    let totalsProfit: number | null = null
    let totalsReferral: number | null = null
    let totalsTruncated = false
    // 短信接码单的合计（元；已含在 cost / profit 里）。没有接码单时为 null
    let jiemaTotals: { orders: number; cost: number; profit: number; loss: number; estimating: number; notCounted: number } | null = null
    // 渠道单拆分（分）：进货净额、已知成本、利润（只加有成本数据的单），以及成本未登记的单数。truncated 时整体为 null
    let ch: { supplyNet: number; cost: number; profit: number; unknown: number } | null = null
    if (total <= TOTALS_ID_CAP) {
      const ids = await prisma.order.findMany({ where, select: { id: true, tenantId: true } })
      /*
       * 主站单仍按卡密汇总（口径逐字不变）；渠道单改按 channel-profit 公式（二期 M2）。
       * 筛「主站」时 ids 全是主站单，结果与改动前完全相同；筛「全部」时渠道卡密不再按卡上的 profit 计入，
       * 改由下面的渠道公式计入 —— 否则退款后的渠道单会按整份进货价虚增利润。
       */
      const mainIds = ids.filter((x) => x.tenantId === PLATFORM_TENANT_ID)
      const chAll = ids.filter((x) => x.tenantId !== PLATFORM_TENANT_ID).map((x) => x.id)
      const acc = { supplyNet: 0, cost: 0, profit: 0, unknown: 0 }
      if (chAll.length) {
        const chOrders = await prisma.order.findMany({
          where: { id: { in: chAll }, payStatus: { in: ['PAID', 'REFUNDED'] } },
          select: CHANNEL_PROFIT_ORDER_SELECT,
        })
        const pm = await channelProfitMap(chOrders)
        pm.forEach((p) => {
          // 缺快照（历史脏数据）算不出进货净额：计作「未计入」，不编数
          if (!p) {
            acc.unknown += 1
            return
          }
          acc.supplyNet += p.supplyNetCents
          if (p.profitCents == null || p.costCents == null) acc.unknown += 1
          else {
            acc.cost += p.costCents
            acc.profit += p.profitCents
          }
        })
      }
      ch = acc
      if (mainIds.length) {
        const idList = mainIds.map((x) => x.id)
        const [agg, cardOrders] = await Promise.all([
          prisma.cardKey.aggregate({
            where: { orderId: { in: idList }, status: 'USED' },
            _sum: { cost: true, profit: true },
          }),
          // 与每单口径一致：只扣「有卡密」的订单的返现
          prisma.cardKey.findMany({
            where: { orderId: { in: idList }, status: 'USED' },
            select: { orderId: true },
            distinct: ['orderId'],
          }),
        ])
        const cardOrderIds = cardOrders.map((c) => c.orderId).filter((x): x is number => x != null)
        const refMap = cardOrderIds.length ? await settledReferralCents(cardOrderIds) : new Map<number, number>()
        let refCents = 0
        refMap.forEach((v) => (refCents += v))
        totalsReferral = refCents / 100
        totalsCost = round2(Number(agg._sum.cost ?? 0))
        totalsProfit = round2(Number(agg._sum.profit ?? 0) - totalsReferral)
      } else {
        totalsCost = 0
        totalsProfit = 0
        totalsReferral = 0
      }
      // 成本 / 利润合计 = 主站（卡密）+ 渠道（公式，只含有成本数据的单）。没有渠道单时加 0，主站数字不变
      totalsCost = round2(totalsCost + acc.cost / 100)
      totalsProfit = round2(totalsProfit + acc.profit / 100)
      // 短信接码单（§6.6 第 28 条）：按 sms_orders 的 Σ costCents / Σ profitCents 并进合计（已取消单落空 = 不计；未定稿的是预估，单独给个数）
      if (mainIds.length) {
        const smsRows = await prisma.smsOrder.findMany({
          where: { orderId: { in: mainIds.map((x) => x.id) } },
          select: { state: true, priceCents: true, costCents: true, profitCents: true, lossCents: true, costFinal: true },
        })
        if (smsRows.length) {
          const f = listFooter(smsRows)
          jiemaTotals = { orders: f.orders, cost: f.costCents / 100, profit: f.profitCents / 100, loss: f.lossCents / 100, estimating: f.estimating, notCounted: f.notCounted }
          totalsCost = round2(totalsCost + f.costCents / 100)
          totalsProfit = round2(totalsProfit + f.profitCents / 100)
        }
      }
    } else {
      totalsTruncated = true
    }

    return success({
      list,
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      totals: {
        orders: amountAgg._count._all,
        amount: round2(Number(amountAgg._sum.amount ?? 0)),
        cost: totalsCost,
        profit: totalsProfit, // 已扣内推返现
        referral: totalsReferral, // 已扣掉的内推返现合计（truncated 时为 null）
        truncated: totalsTruncated, // true = 结果集过大，未统计成本/利润，请缩小筛选范围
        // 渠道单拆分（二期 M2，元）。channelOrders / channelAmount 不受 truncated 影响；其余 truncated 时为 null
        channelOrders: channelAmountAgg._count._all,
        channelAmount: round2(Number(channelAmountAgg._sum.amount ?? 0)), // 渠道流水 = 渠道售价之和（已含在 amount 里）
        channelSupplyNet: ch ? ch.supplyNet / 100 : null, // 渠道进货净额（已付 / 已退款单，扣除退款）
        channelCost: ch ? ch.cost / 100 : null, // 渠道单已知成本（已含在 cost 里）
        channelProfit: ch ? ch.profit / 100 : null, // 渠道利润 = 进货净额 − 成本（已含在 profit 里）
        channelProfitUnknown: ch ? ch.unknown : null, // 成本未登记、未计入渠道利润的单数
        jiema: jiemaTotals, // 短信接码单：计成本的单数、真实成本、毛利、亏损（已含在 cost / profit 里）、预估中、不计（已取消）
      },
      sites: await siteOptions(),
    })
  } catch (err) {
    console.error('Get orders error:', err)
    return error('获取订单列表失败')
  }
}
