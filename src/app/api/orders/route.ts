export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { hasProvider } from '@/lib/redeem/registry'
import { getCurrentUser } from '@/lib/auth'
import { success, error, unauthorized } from '@/lib/api'
import { decryptCardContent } from '@/lib/cardkey'
import { countOpenOrderPayments, VMQ_MAX_OPEN_PER_USER, VMQ_TIMEOUT_MIN } from '@/lib/vmq'
import { rateLimited } from '@/lib/news/rate-limit'
import { calcInvoiceAmounts } from '@/lib/invoice'
import { shopOrderSourceKey } from '@/lib/order-billing'
import { BillingError } from '@/lib/order-invoice'
import {
  invoiceFieldsSchema,
  normalizeInvoiceFields,
  saveInvoiceTitle,
  touchInvoiceTitle,
} from '@/lib/invoice-input'
import { notifyOrderCreated } from '@/lib/notify'
import { quoteOrder, grantUsable, parseProductIds, rejectReason, type GrantState } from '@/lib/coupon'
import { invoicesByOrderIds, orderIdFromSourceKey, type InvoiceBrief } from '@/lib/order-link'
import { createEntryIfEligible, getLotteryConfig, lotteryViewsByOrderIds } from '@/lib/lottery-server'
import type { BuyerLotteryView } from '@/lib/lottery'
import { getStorefront, type Storefront } from '@/lib/storefront/resolve'
import { resolveUnitPrice, siteTag } from '@/lib/pricing'
import {
  createShopOrder,
  readChannelOrderConfig,
  ShopOrderSnapshotError,
  type CreatedShopOrder,
} from '@/lib/order/create-shop-order'
import { ensureTenantCustomer, isBlockedInTenant } from '@/lib/tenant/customer'
import { alertPlatform } from '@/lib/tenant/platform-alert'
import type { NotSellableReason } from '@/lib/tenant/types'

const createOrderSchema = z.object({
  // 必须是正整数：小数/负数原本要一路走到 prisma.order.create（Int 列）才炸，
  // 买家只能看到一句笼统的「创建订单失败」
  productId: z
    .number({ required_error: '缺少商品', invalid_type_error: '商品参数不正确' })
    .int('商品参数不正确')
    .positive('商品参数不正确'),
  quantity: z
    .number({ invalid_type_error: '购买数量必须是数字' })
    .int('购买数量必须是整数')
    .min(1, '购买数量至少为 1')
    // 以前是 999：改数量就能二分出精确库存（「库存不足」在建单前返回）。前台固定只买 1 件（purchase-modal.tsx）
    .max(10, '单次最多购买 10 件，更多请联系客服')
    .default(1),
  // Order.remark 是 VarChar(255)，而履约、接码会往后追加运维备注（lib/sms.ts appendRemark 会截断）。
  // 前台只发「支付方式: 支付宝」十来个字；这里给 200 字上限，自己构造超长备注的请求直接拦下
  remark: z.string().max(200, '备注最多 200 字').optional(),
  ref: z.string().trim().optional().nullable(), // 内推码
  /** 要使用的券实例 id（CouponGrant.id）。只对本人有效，服务端会校验归属 */
  couponGrantId: z.number().int().positive().optional().nullable(),
  /**
   * 下单时勾选「同时开具增值税发票」。给了这一块就按 货款+6%税费 一次收清，
   * 付款成功后发货与提交开票同时发生（见 lib/vmq.ts 的 fulfillOrder）。
   * 不给 = 不开票，买家日后仍可从订单页按老流程单独申请。
   */
  invoice: invoiceFieldsSchema
    .extend({
      /** 本次用的已保存抬头 id（仅用于刷新使用时间，归属会校验） */
      titleId: z.number().int().positive().optional().nullable(),
      /** 把这次填的抬头存进个人中心 */
      saveTitle: z.boolean().optional().default(false),
    })
    .optional()
    .nullable(),
})

// 获取用户订单列表（分页 + 服务端筛选/检索）
export async function GET(request: NextRequest) {
  // 店面解析不进 try（设计 4.4 第 7 条）：渠道 Host 查库报错必须是 500，不能被 catch 吞掉后按主站继续
  const sf = await getStorefront()
  if (!sf) return error('资源不存在', 404)
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1') || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10') || 10, 1), 50)
    const filter = (searchParams.get('filter') || '').trim() // all | UNPAID | PROCESSING | DELIVERED
    const keyword = (searchParams.get('keyword') || '').trim()

    // 「处理中」是复合条件（已付款但尚未交付），没法用单个字段表达，这里集中定义一次，
    // 列表筛选与顶部徽标计数共用，避免两处口径漂移。
    const FILTERS: Record<string, Prisma.OrderWhereInput> = {
      UNPAID: { payStatus: 'UNPAID' },
      PROCESSING: { payStatus: 'PAID', deliveryStatus: { in: ['PENDING', 'PROCESSING'] } },
      DELIVERED: { deliveryStatus: 'DELIVERED' },
    }

    // 【只看本店订单】账号两站通用，但订单按交易发生站隔离（设计 8.1、T11）：在 lulu 只见 lulu 的单，主站只见主站的单
    const base: Prisma.OrderWhereInput = { userId: user.id, tenantId: sf.id }
    const where: Prisma.OrderWhereInput = { ...base }
    if (FILTERS[filter]) Object.assign(where, FILTERS[filter])
    if (keyword) {
      where.OR = [{ orderNo: { contains: keyword } }, { productName: { contains: keyword } }]
    }

    // 顶部徽标计数：必须是「全部订单」的口径，不能随分页变成本页计数
    const [total, cAll, cUnpaid, cProcessing, cDelivered] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.count({ where: base }),
      prisma.order.count({ where: { ...base, ...FILTERS.UNPAID } }),
      prisma.order.count({ where: { ...base, ...FILTERS.PROCESSING } }),
      prisma.order.count({ where: { ...base, ...FILTERS.DELIVERED } }),
    ])

    // 显式 select：不要用 include + {...o} 整行外泄。Order 上的 referrerId / referralReward
    // 属于内部成本口径，将来若再加成本/利润列，整行序列化会直接把毛利发给买家。
    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNo: true,
        productId: true,
        productName: true,
        productPrice: true,
        quantity: true,
        amount: true,
        // 下单时勾了开发票的未支付订单，收银台会收 amount + invoiceTaxFee。
        // 不把这个数发给前台，订单页会显示一个比实际扣款少 6% 的金额
        invoiceTaxFee: true,
        payStatus: true,
        deliveryStatus: true,
        deliveryInfo: true,
        remark: true,
        createdAt: true,
        paidAt: true,
        deliveredAt: true,
        // 只用于算 billing.canInvoice（成员自买单不可开票，设计 7.7），下面组装响应时剔除，不下发给买家
        settleExcludeReason: true,
        product: {
          select: {
            id: true,
            name: true,
            image: true,
            deliveryType: true,
            cardUsage: true,
            cardRedeemUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // 自动发货：把已发给本人订单的卡密解密返回（仅本人、已支付订单可见）
    // cards 保持 string[]（旧字段，前端沿用）；cardItems 额外带上兑换入口。
    //
    // 【兑换入口的优先级，服务端在这里就定好，前端不要再判一遍】
    //   1. redeemProvider 非空 → 站内兑换页 /redeem/<provider>?cdk=...
    //   2. 否则 redeemUrl（本批专属外链）
    //   3. 否则 product.cardRedeemUrl（商品默认外链，前端兜底）
    // 之所以把卡密拼进 URL：买家从订单页点过去就已经填好了，少一次复制粘贴。
    // 这个链接本身不构成泄漏 —— 能看到这个页面的人本来就已经看到卡密明文了。
    const paidIds = orders.filter((o) => o.payStatus === 'PAID').map((o) => o.id)
    // 卡密只随「已付款且未取消」的订单下发。已付款又被取消 = 线下退款的惯例做法，
    // 钱退了卡就不该再展示（站内兑换也会拒，见 lib/redeem/service.ts）。
    // 发票 / 收据查询仍用 paidIds：已经开出去的票买家还要能看到
    const cardOrderIds = orders
      .filter((o) => o.payStatus === 'PAID' && o.deliveryStatus !== 'CANCELLED')
      .map((o) => o.id)
    const cardMap = new Map<number, { secret: string; redeemUrl: string | null; inSite: boolean }[]>()
    if (cardOrderIds.length) {
      const cards = await prisma.cardKey.findMany({
        where: { orderId: { in: cardOrderIds }, status: 'USED' },
        orderBy: { id: 'asc' },
      })
      for (const c of cards) {
        let plain = ''
        try {
          plain = decryptCardContent(c.content)
        } catch {
          plain = '(卡密解密失败，请联系客服)'
        }
        const arr = cardMap.get(c.orderId as number) || []
        const inSite = !!c.redeemProvider && hasProvider(c.redeemProvider)
        arr.push({
          secret: plain,
          redeemUrl: inSite
            ? `/redeem/${c.redeemProvider}?cdk=${encodeURIComponent(plain)}`
            : c.redeemUrl || null,
          inSite,
        })
        cardMap.set(c.orderId as number, arr)
      }
    }

    // 统计每张订单「客服发来、买家未读」的留言数，用于订单列表红点提醒
    const allIds = orders.map((o) => o.id)
    const unreadMap = new Map<number, number>()
    if (allIds.length) {
      const grouped = await prisma.orderMessage.groupBy({
        by: ['orderId'],
        where: { orderId: { in: allIds }, sender: 'ADMIN', readByBuyer: false },
        _count: { _all: true },
      })
      for (const g of grouped) unreadMap.set(g.orderId, g._count._all)
    }

    /*
     * 发票/收据状态。
     *
     * 【发票两根线索都要查】一张站内订单可能挂两条外部订单：买家申请时造的背书行
     * （sourceKey=`order:<id>`），以及管理员「标记已完成」导入的 WEB 行（只有 shopOrderId）。
     * 原来只按 sourceKey 查，WEB 行上的发票（买家从「邮箱查订阅」申请的）在这里看不见，
     * 订单页就再给一个「申请发票」—— 点下去就是第二次付 6%。
     * 统一走 lib/order-link.invoicesByOrderIds，列表第一张 = 推进得最靠后的那张。
     *
     * 查不到发票时**不能吞错**：吞掉就会显示「可开发票」，正是上面那个重复收税的入口。
     */
    const receiptByOrderId = new Map<number, string>()
    /** 订单 → 背书行（sourceKey=`order:<id>`）的 ext id。收据计费只认这一行，见下方 receiptAmount */
    const backingExtByOrderId = new Map<number, number>()
    const [invMap, lotteryMap] = await Promise.all([
      paidIds.length ? invoicesByOrderIds(paidIds) : Promise.resolve(new Map<number, InvoiceBrief[]>()),
      // 抽奖状态查不到只影响红包按钮显示，不能把整张订单列表带挂。渠道站抽奖硬关（设计 7.6），不查
      (sf.kind === 'PLATFORM' ? lotteryViewsByOrderIds(allIds) : Promise.resolve(new Map<number, BuyerLotteryView>())).catch((e) => {
        console.error('[lottery] 订单列表读取抽奖状态失败（不影响订单列表）', e)
        return new Map<number, BuyerLotteryView>()
      }),
    ])
    if (paidIds.length) {
      // 收据是按外部订单行挂的：背书行与 WEB 行上的收据都算这张订单的
      const exts = await prisma.externalOrder.findMany({
        where: {
          OR: [{ shopOrderId: { in: paidIds } }, { sourceKey: { in: paidIds.map((id) => shopOrderSourceKey(id)) } }],
        },
        select: { id: true, shopOrderId: true, sourceKey: true },
      })
      if (exts.length) {
        const extIdToOrderId = new Map<number, number>()
        for (const e of exts) {
          const oid = e.shopOrderId ?? orderIdFromSourceKey(e.sourceKey)
          // 只收本页、本人的订单（查询条件本身已限定，这里再收一道口）
          if (!oid || !paidIds.includes(oid)) continue
          extIdToOrderId.set(e.id, oid)
          if (e.sourceKey === shopOrderSourceKey(oid)) backingExtByOrderId.set(oid, e.id)
        }
        const extIds = Array.from(extIdToOrderId.keys())
        const recs = extIds.length
          ? await prisma.receipt.findMany({
              where: { externalOrderId: { in: extIds } },
              select: { externalOrderId: true, token: true },
            })
          : []
        for (const r of recs) {
          const oid = r.externalOrderId != null ? extIdToOrderId.get(r.externalOrderId) : undefined
          if (!oid || !r.token) continue
          // 背书行上的收据优先（订单页「申请收据」开在这一行）；其余行的收据只在没有时补上，
          // 这样从「邮箱查订阅」开过收据的订单也显示「已开具」，不会再开第二张
          if (backingExtByOrderId.get(oid) === r.externalOrderId || !receiptByOrderId.has(oid)) {
            receiptByOrderId.set(oid, r.token)
          }
        }
      }
    }

    const withCards = orders.map(({ settleExcludeReason, ...o }) => {
      const paid = o.payStatus === 'PAID'
      // 渠道成员在自己店里下的单不计余额、也不可开票（设计 7.7）；主站单恒为 null，行为不变
      const selfBuy = settleExcludeReason != null
      const price = Number(o.amount)
      const pendingTax = o.invoiceTaxFee == null ? 0 : Number(o.invoiceTaxFee)
      const invs = invMap.get(o.id) || []
      // 主发票：推进得最靠后的那张（ISSUED > SUBMITTED > AWAIT_PAY > CANNOT > UNAPPLIED）。
      // 跳过「孤儿且待付税费」的：它的外部订单行已经没了，付款接口走不通，
      // 当主发票的话订单页会卡在一个付不了的「去支付税费」上、也不再给「申请发票」。
      // 跳过之后订单回到可申请状态，服务端（api/orders/[id]/invoice）对这种情况本来就允许重新申请
      const inv = invs.find((iv) => !(iv.orphan && iv.status === 'AWAIT_PAY' && iv.payStatus !== 'PAID'))
      const amt = paid ? calcInvoiceAmounts(price) : null
      // 收据金额：买家已付发票税费(payStatus=PAID) → 含税开票金额；否则售价。
      // 须与 submitReceiptForExternalOrder 中的服务端计费口径保持一致：先看**背书行**上的发票
      // （订单页申请收据走 ensureExternalOrderForShopOrder 的那一行），背书行没有已付发票时
      // 再看其他关联行上的已付发票。预览与实际开出的收据金额必须是同一个数
      // （收据只能开一次，开错了改不回来）。
      //
      // 【预收过税费的订单，即使 Invoice 行还没落地也算「已提交」】
      // 履约里的落地是 try 住的，失败时会出现「税费已到账、invoices 表却没有行」的状态。
      // 只看有没有 Invoice 行的话这里会返回 UNAPPLIED，订单页就会再显示一次「申请发票」，
      // 买家点下去就是第二次付 6%。服务端那道闸（settlePrepaidOrderInvoice）会挡住，
      // 但不该让这个按钮出现在买家眼前。
      const prepaidTax = pendingTax > 0 && paid
      const backingExtId = backingExtByOrderId.get(o.id)
      const backingInv = backingExtId != null ? invs.find((iv) => iv.externalOrderId === backingExtId) : undefined
      // 背书行上的已付发票优先；背书行没有、但 WEB 行上有一张已付税费的发票（买家从「邮箱查订阅」
      // 付过 6%）时，收据同样按含税额出具 —— 与 api/orders/[id]/receipt 传给
      // submitReceiptForExternalOrder 的 paidInvoiceAmount 同一口径
      const paidInv = backingInv?.payStatus === 'PAID' ? backingInv : invs.find((iv) => iv.payStatus === 'PAID')
      const invoicePaid = !!paidInv || prepaidTax
      const items = cardMap.get(o.id) || []
      const lottery = lotteryMap.get(o.id) ?? null
      /*
       * 【cardUsage / cardRedeemUrl 只随已发出的卡下发】这两个字段是发货说明和兑换外链，
       * 里面有上游货源站（见 lib/product-select.ts 的注释），公开商品接口早就不给了。
       * 这里原来对未付款、已取消的订单也原样下发，等于注册个号、下一单不付钱就能拿到货源站。
       * 前台只在「有卡密」时才用这两个值（orders/page.tsx 的 hasCards 分支），
       * 所以按 items 是否非空来判断，买家可见的行为不变。
       */
      const delivered = items.length > 0
      // 已付款又被取消（线下退款）：不能再申请发票 / 收据（服务端 lib/order-invoice 另有闸门兜底）
      const voided = o.deliveryStatus === 'CANCELLED'
      return {
        ...o,
        product: delivered ? o.product : { ...o.product, cardUsage: null, cardRedeemUrl: null },
        invoiceTaxFee: pendingTax || null,
        /** 未支付订单的实际应付 = 货款 + 下单时勾选的开票税费 */
        payable: Math.round((price + pendingTax) * 100) / 100,
        cards: items.map((c) => c.secret),
        cardItems: items, // [{ secret, redeemUrl, inSite }]：redeemUrl 为空才回落 product.cardRedeemUrl
        unreadCount: unreadMap.get(o.id) || 0,
        /** 下单有奖：有资格的订单才有这一块（活动外的订单为 null） */
        lottery,
        /** 此刻能不能抽。最终以 /api/lottery/draw 的服务端复核为准，这里只决定按钮样式 */
        lotteryCanDraw: lottery?.state === 'PENDING' && paid && o.deliveryStatus !== 'CANCELLED',
        // 票据信息（仅已支付订单可申请）
        billing: paid
          ? {
              canInvoice: price > 0 && !voided && !selfBuy,
              canReceipt: price > 0 && !voided,
              sellingPrice: price,
              invoiceAmount: amt!.invoiceAmount,
              taxFee: amt!.taxFee,
              receiptAmount: paidInv?.invoiceAmount ?? (invoicePaid ? amt!.invoiceAmount : price),
              invoiceStatus: inv ? inv.status : prepaidTax ? 'SUBMITTED' : 'UNAPPLIED',
              /** 结账时已随货款付清 6%，事后不需要也不允许再交一次税费 */
              invoicePrepaid: prepaidTax,
              invoiceId: inv?.id ?? null,
              receiptToken: receiptByOrderId.get(o.id) ?? null,
              /**
               * 主发票的明细（买家自己填的抬头、自己付的税费，本来就该让他看见）。
               * 金额取发票上的快照而不是按 Order.amount 现算：开出去的票以快照为准。
               */
              invoice: inv
                ? {
                    invoiceNo: inv.invoiceNo,
                    status: inv.status,
                    payStatus: inv.payStatus,
                    title: inv.title,
                    taxNumber: inv.taxNumber,
                    email: inv.email,
                    invoiceAmount: inv.invoiceAmount,
                    taxFee: inv.taxFee,
                    submittedAt: inv.submittedAt,
                    issuedAt: inv.issuedAt,
                  }
                : null,
            }
          : null,
      }
    })
    return success({
      list: withCards,
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      counts: { all: cAll, UNPAID: cUnpaid, PROCESSING: cProcessing, DELIVERED: cDelivered },
    })
  } catch (err) {
    console.error('Get orders error:', err)
    return error('获取订单列表失败')
  }
}

/**
 * 把刚 CAS 锁上、但订单还没建成的券放回去。
 *
 * 建单流程里「锁券」与「建单」不在同一个事务（建单还要发通知、算内推），
 * 中间任何一条 return / throw 都必须经过这里，否则买家的券会停在 LOCKED、
 * 他自己解不开，只能等 sweepStuckCoupons 的 120 分钟兜底或者来找客服。
 * 条件里带 orderId: null，确保只回滚「还没挂上订单」的那把锁。
 */
async function releaseLockedCoupon(couponGrantId: number | null) {
  if (!couponGrantId) return
  await prisma.couponGrant
    .updateMany({
      where: { id: couponGrantId, state: 'LOCKED', orderId: null },
      data: { state: 'AVAILABLE', lockedAt: null },
    })
    .catch(() => {})
}

/**
 * 建单过程中「拒绝这一单」的信号。事务里抛它 → 事务回滚（无半条订单）→ 外层转成对应的 HTTP 响应。
 * 只在本文件内部用（route.ts 只导出 HTTP handler）。
 */
class OrderReject extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message)
  }
}

/** 渠道单可售判定失败时给买家的话：不区分原因（进货价、授权、上下架都是站内配置，不该透给买家） */
const CHANNEL_NOT_SELLABLE = '商品不存在或已下架'
/** 「售价低于进货价」类原因：正常流程下不该出现（保存售价与调进货价都会拦 / 自动下架），出现即告警平台（设计 8.1 第 6.1 步） */
const ALERT_REASONS: ReadonlySet<NotSellableReason> = new Set<NotSellableReason>(['BELOW_SUPPLY', 'OUT_OF_RANGE', 'NO_SUPPLY'])
/** 渠道「本店未付单并发上限」的统计窗口（设计 8.1 第 3 步：createdAt > now − 20min） */
const PENDING_WINDOW_MS = 20 * 60_000

// 创建订单
export async function POST(request: NextRequest) {
  // 店面解析不进 try（设计 4.4 第 7 条）。null = 该 Host 没有店面（严格期未知 Host、域名停用）→ 404
  const sf = await getStorefront()
  if (!sf) return error('资源不存在', 404)
  try {
    const user = await getCurrentUser()
    if (!user) {
      return unauthorized()
    }
    // 渠道站上 ADMIN 视为未登录（设计 4.7）。getCurrentUser 已按店面拦截（WP1），这里再挡一道：超管邮箱永不进渠道客户列表
    if (sf.kind === 'CHANNEL' && user.role === 'ADMIN') {
      return unauthorized()
    }

    const body = await request.json()
    const result = createOrderSchema.safeParse(body)

    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    if (sf.kind === 'CHANNEL') return await createChannelOrder(sf, user, result.data)

    const { productId, quantity, remark, ref } = result.data

    // 获取商品信息
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product || product.status !== 1) {
      return error('商品不存在或已下架')
    }

    // 检查库存
    if (product.stock !== -1 && product.stock < quantity) {
      return error('库存不足')
    }

    /*
     * 【每人同时挂着的待付款有上限 + 下单频率】收款靠「唯一金额」区分是谁付的，同一价位附近只有 50 格、
     * 全站共用（lib/vmq.ts allocateAmount）。一个账号建几十单并各自发起支付，就能把真实买家挤到
     * 「当前下单人数较多」。发起支付那一步（api/pay/vmq/create）有同样的上限和事后复核；
     * 这里先挡一次，免得建出一张付不了的单、还把券锁上。
     * 两道 return 都必须排在下面优惠券 CAS 抢锁之前（锁券之后不能再有 return）。
     * 数的是「有效期内的待支付收款单」而不是 UNPAID 订单：没发起过支付的订单永远不会被自动取消，
     * 数订单的话放弃过订单的正常买家会被永久锁住。
     */
    if ((await countOpenOrderPayments(user.id)) >= VMQ_MAX_OPEN_PER_USER) {
      return error(
        `你已有 ${VMQ_MAX_OPEN_PER_USER} 笔订单在等待付款，请先在「我的订单」完成支付，或等其超时（约 ${VMQ_TIMEOUT_MIN} 分钟）后再下单`,
        429
      )
    }
    // 防刷单、防企业微信「新订单」刷屏；正常买家 10 分钟不可能下 20 单
    if (rateLimited(`order-create:${user.id}`, { windowMs: 10 * 60_000, max: 20 })) {
      return error('下单过于频繁，请稍后再试', 429)
    }

    /*
     * 内推：通过推广人链接下单，使用其「专属价」，差额作为返现归推广人。
     * 逻辑原样搬进了 lib/pricing.ts 的 resolveUnitPrice（主站分支，全站统一定价入口，设计 7.4），这里只取结果。
     * 放在同一个位置调用（限流之后、锁券之前），与改造前的查询时机一致；主站下单仍在事务外定价，
     * 因为券必须在建单前 CAS 锁定，而券后价依赖这里的单价。
     */
    const base = Number(product.price)
    let unitPrice = base
    let referrerId: number | null = null
    let referralReward: number | null = null
    const q = await resolveUnitPrice(sf, productId, { ref, buyerId: user.id })
    // 上面刚确认过商品在售；两次读之间被下架时按下架处理（与改造前「商品不存在或已下架」同一句话）
    if (!q.sellable || q.kind !== 'PLATFORM') return error('商品不存在或已下架')
    if (q.referral) {
      unitPrice = q.unitCents / 100
      referrerId = q.referral.referrerId
      // 按分相乘：0.1 × 3 这类浮点乘法会得到 0.30000000000000004，写进 Decimal(10,2) 虽然会被截断，
      // 但同一个数在内存里（通知、返回值）和库里对不上
      referralReward = (q.referral.rewardUnitCents * quantity) / 100
    }

    /*
     * 开票字段的**纯字段校验**必须赶在优惠券 CAS 抢锁之前做。
     *
     * 券一旦被 updateMany 置成 LOCKED（下面那段），到建单之间
     * 任何一条 return 都会把券永久留在「占用中」—— 只有建单的 catch 里
     * 有回滚逻辑，兜底则要等 sweepStuckCoupons 的 120 分钟。
     * 而这条路极易触发：税号超过 20 位在前台不一定拦得住，服务端一 return，
     * 买家的券就凭空卡死两小时，他自己解不开，只能来找客服。
     *
     * 金额相关的那半（calcInvoiceAmounts）依赖最终 amount，仍留在券结算之后。
     */
    const invoiceIn = result.data.invoice
    let invoiceFields = null
    if (invoiceIn) {
      try {
        invoiceFields = normalizeInvoiceFields(invoiceIn)
      } catch (e) {
        if (e instanceof BillingError) return error(e.message, e.status)
        throw e
      }
    }

    const referralAmount = Math.round(unitPrice * quantity * 100) / 100
    let amount = referralAmount

    /*
     * 下单有奖的活动配置，必须在下面的优惠券 CAS 抢锁**之前**读好。
     * 券一旦锁上，到建单之间不能再多出任何可能失败的步骤（理由同上面开票校验那段）。
     * getLotteryConfig 自己不会抛错（读失败按「活动关闭」处理，只会少发、不会多发）。
     */
    const lotteryCfg = await getLotteryConfig()

    /*
     * ============ 优惠券 ============
     * 落点选在建单这一步，而不是站长说的「提交收款监控前」，原因是站长同时要求
     * 「订单记录为优惠后的价格」—— order.amount 在建单时就必须是优惠价，
     * 否则收款监控拿到的是原价，买家付了优惠价永远匹配不上到账。
     * 提交收款监控那一步会再复验一次（见 /api/pay/vmq/create），两道都在。
     *
     * 锁定用 updateMany 的条件更新做 CAS：条件里带 userId 与 state='AVAILABLE'，
     * 抢不到就说明这张券已经被另一笔订单占用。**绝不能先 findFirst 再 update** ——
     * 买家开两个标签同时下单，两个请求都会查到「可用」，然后各自用掉同一张券。
     */
    let couponGrantId: number | null = null
    let couponDiscount: number | null = null
    let originalAmount: number | null = null
    /** 券没用上时给前台的说明，随响应返回 */
    let couponNote: string | null = null

    if (result.data.couponGrantId) {
      const grant = await prisma.couponGrant.findFirst({
        where: { id: result.data.couponGrantId, userId: user.id },
        include: {
          coupon: { select: { kind: true, minAmount: true, discount: true, productIds: true, status: true } },
        },
      })
      if (!grant) return error('优惠券不存在')
      if (grant.coupon.status === 'ENDED') return error('该券所属活动已结束')

      const ok = grantUsable({ state: grant.state as GrantState, expiresAt: grant.expiresAt })
      if (!ok.ok) return error(ok.reason)

      const quote = quoteOrder({
        productId: product.id,
        listPrice: base,
        quantity,
        referralUnitPrice: referrerId ? unitPrice : null,
        rule: {
          kind: grant.coupon.kind as 'THRESHOLD' | 'PRODUCT',
          minAmount: Number(grant.coupon.minAmount),
          discount: Number(grant.coupon.discount),
          productIds: parseProductIds(grant.coupon.productIds),
        },
      })

      /*
       * 【券没用上不等于下单失败】券用不上就按 baseline 成交，
       * 券原样留在账户里**不锁定**，把原因随响应返回、前台提示一句。少赚一点也好过丢一单。
       *
       * 内推单走的就是这条路：quoteOrder 对内推单一律返回 applied='referral'，
       * 于是这里按专属价成交、券完好无损地留着，下次普通下单还能用。
       * 前台在内推场景下本来就不展示券，能走到这里的只有手工构造的请求。
       */
      if (quote.applied !== 'coupon') {
        amount = quote.baseline
        couponNote = quote.reject ? rejectReason(quote.reject) : '本单未使用优惠券'
      } else {
        // CAS 抢锁。orderId 先留空，建单成功后回填 —— 订单号这时还没有
        const locked = await prisma.couponGrant.updateMany({
          where: { id: grant.id, userId: user.id, state: 'AVAILABLE' },
          data: { state: 'LOCKED', lockedAt: new Date() },
        })
        if (locked.count !== 1) return error('该券正被另一笔待支付订单占用')

        couponGrantId = grant.id
        couponDiscount = quote.discount
        originalAmount = quote.baseline
        amount = quote.amount
      }
    }

    /*
     * ============ 下单时勾选开发票 ============
     * 必须放在券结算**之后**：税费的基准是这一单最终实际成交的 amount，
     * 而 amount 到这里才定下来（内推专属价 → 券优惠价）。
     *
     * 【内推单天然按专属价算税】amount 对内推单就是推广人的专属价，
     * 所以 amount*1.06 即「按内推价格的 1.06 收款」，不需要单独分支。
     *
     * 【只存草稿，不建 Invoice 行】理由写在 schema 的 Order.invoiceInfo 注释里：
     * 建 Invoice 要先建 ExternalOrder，而未付款的订单混进 external_orders
     * 会被到期提醒扫到，给没付过钱的人发续费提醒。
     */
    let invoiceTaxFee: number | null = null
    let invoiceInfo: string | null = null
    if (invoiceFields) {
      const { taxFee } = calcInvoiceAmounts(amount)
      if (taxFee <= 0) {
        // 走到这里券可能已经 LOCKED 了，先放回去再报错，别把买家的券卡死两小时
        await releaseLockedCoupon(couponGrantId)
        return error('该订单金额无法开具发票')
      }
      invoiceTaxFee = taxFee
      invoiceInfo = JSON.stringify({ ...invoiceFields, taxFee })
    }

    // 创建待支付订单（默认 payStatus: UNPAID, deliveryStatus: PENDING）
    //
    // 【订单与抽奖资格同一个事务】资格行只在建单这一刻判定（活动开关之后怎么变都不影响
    // 已下的单）。分两步写的话，「订单建好、资格行没建上」这张单就永远没有抽奖按钮，
    // 而买家是看到活动才下的单。同一事务里要么都有、要么都没有；
    // 资格行建失败 → 订单一起回滚 → 走下面的 catch 把券放回去，买家重新下单即可。
    //
    // 【建单只经 createShopOrder】全仓唯一允许 order.create 的地方（设计 5.4）。主站单 tenantId=1、不带渠道快照，
    // 写入的列与改造前逐项相同，另外把买家备注同时写进 buyerRemark（双写过渡）。
    let order: CreatedShopOrder
    let lotteryEligible = false
    try {
      const created = await prisma.$transaction(async (tx) => {
        const o = await createShopOrder(tx, {
          tenantId: sf.id,
          userId: user.id,
          productId: product.id,
          productName: product.name,
          productPrice: Number(product.price),
          quantity,
          // amount 永远是不含税货款。税费单独一列，收银台收 amount + invoiceTaxFee
          amount,
          invoiceTaxFee,
          invoiceInfo,
          remark: remark ?? null,
          referrerId,
          // 券胜出时内推返现不再计入：站长定的是「不叠加，取更优的一个」
          referralReward: couponGrantId === null && referralReward && referralReward > 0 ? referralReward : null,
          couponGrantId,
          couponDiscount,
          originalAmount,
        })
        // 门槛按不含税货款（amount）算：6% 税费是代收的，不是买家在本站的消费
        const eligible = await createEntryIfEligible(tx, lotteryCfg, {
          id: o.id,
          orderNo: o.orderNo,
          userId: user.id,
          amount,
        })
        return { o, eligible }
      })
      order = created.o
      lotteryEligible = created.eligible
    } catch (e) {
      // 建单失败要把刚锁上的券放回去，否则买家的券会凭空变成「被占用」且永远不释放
      if (couponGrantId) {
        await prisma.couponGrant
          .updateMany({
            where: { id: couponGrantId, state: 'LOCKED', orderId: null },
            data: { state: 'AVAILABLE', lockedAt: null },
          })
          .catch(() => {})
      }
      throw e
    }

    // 回填订单关联：券锁定与建单不在同一个事务里（建单还要发通知、算内推），
    // 所以用「先锁后填」的两步。中间窗口内券是 LOCKED 且 orderId 为空，
    // 释放逻辑对这种状态是认的（见 releaseCouponForOrder）
    if (couponGrantId) {
      await prisma.couponGrant
        .updateMany({ where: { id: couponGrantId, state: 'LOCKED' }, data: { orderId: order.id } })
        .catch(() => {})
    }

    await saveTitleSideEffects(user.id, invoiceIn, invoiceFields)

    // 企业微信通知（fire-and-forget，不 await，通知挂了不能影响下单）
    notifyOrderCreated({
      orderNo: order.orderNo,
      buyer: user.nickname || user.email || `用户#${user.id}`,
      productName: product.name,
      quantity,
      amount,
      createdAt: order.createdAt,
      stock: product.stock,
    })

    // 销量在支付完成后再增加。
    // payable 是收银台真正会收的数（货款 + 开票税费），前台据此显示「应付」
    return orderCreatedResponse(order, {
      productId: product.id,
      productName: product.name,
      quantity,
      amount,
      invoiceTaxFee,
      couponNote,
      lotteryEligible,
    })
  } catch (err) {
    if (err instanceof OrderReject) return error(err.message, err.status)
    console.error('Create order error:', err)
    return error('创建订单失败')
  }
}

/**
 * 抬头档案的副作用。建单已经成功了，这里出任何问题都只记日志：
 * 「抬头没存上」远不如「下单失败」严重，不能让它把订单一起带走。
 */
async function saveTitleSideEffects(
  userId: number,
  invoiceIn: z.infer<typeof createOrderSchema>['invoice'],
  invoiceFields: ReturnType<typeof normalizeInvoiceFields> | null,
): Promise<void> {
  if (!invoiceIn || !invoiceFields) return
  try {
    await touchInvoiceTitle(userId, invoiceIn.titleId)
    if (invoiceIn.saveTitle) await saveInvoiceTitle(userId, invoiceFields)
  } catch (e) {
    console.error('[invoice-title] 下单时保存抬头失败（不影响订单）', e)
  }
}

/**
 * 【order 只回白名单字段，不要改回整行】整行里有 referrerId / referralReward 这类内部成本口径，
 * 渠道单还有进货价、费率快照（设计 6.3「买家响应一律不含 tenantId、shopOrderId 等新列」）。
 * 目前唯一的消费方 purchase-modal 只读 order.orderNo。两站响应形状相同。
 */
function orderCreatedResponse(
  order: CreatedShopOrder,
  a: {
    productId: number
    productName: string
    quantity: number
    amount: number
    invoiceTaxFee: number | null
    couponNote: string | null
    lotteryEligible: boolean
  },
) {
  return success(
    {
      order: {
        id: order.id,
        orderNo: order.orderNo,
        productId: a.productId,
        productName: a.productName,
        quantity: a.quantity,
        amount: a.amount,
        invoiceTaxFee: a.invoiceTaxFee,
        payStatus: order.payStatus,
        deliveryStatus: order.deliveryStatus,
        createdAt: order.createdAt,
      },
      couponNote: a.couponNote,
      invoiceTaxFee: a.invoiceTaxFee,
      payable: Math.round((a.amount + (a.invoiceTaxFee ?? 0)) * 100) / 100,
      /** 这一单有没有「下单有奖」资格（付款后在订单页抽） */
      lotteryEligible: a.lotteryEligible,
    },
    a.couponNote || '订单创建成功'
  )
}

type Buyer = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>

/**
 * 渠道站下单（设计 8.1 步骤 1–7）。与主站分支完全分开写：主站那条的每一行都没动。
 *
 * 顺序（所有可能失败的检查都在事务前；渠道单没有券，所以没有「锁券之后不能 return」的约束）：
 *   1. 店面状态：DRAFT 只放行预览账号（其余 404）；SUSPENDED / TERMINATED 拒绝新下单（已下单的收银台照常可付）
 *   3. 数量 ≤ Tenant.maxOrderQty；本店 20 分钟内未付单 < pendingOrderCap；另沿用主站的每人待付上限与下单频率
 *   4. 本站拉黑 → 中性文案
 *   5. 带券 → 400；ref 忽略；其余未知字段已被 zod 丢弃（没有余额支付字段，也就无从「选择余额支付」）
 *   6. 事务（全程只用 tx，Dujiao #271）：定价与可售 → 库存预检 → 成员自买判定 → 金额 → 读费率与冻结期
 *      → 快照断言（createShopOrder 内）→ 建单 → 客户关系（via ORDER）
 *   7. 平台企业微信照发并打「[code]」标签；渠道站内通知不在建单时发（付款时由 WP3 发 ORDER_PAID）
 * 不建抽奖资格；不存券；内推字段恒空。
 */
async function createChannelOrder(sf: Storefront, user: Buyer, input: z.infer<typeof createOrderSchema>): Promise<Response> {
  const { productId, quantity, remark } = input

  // 1. 店面状态（sf.status 是本请求开始时按主键查库的值；事务里 resolveUnitPrice 会再按最新状态判一次）
  const t = await prisma.tenant.findUnique({
    where: { id: sf.id },
    select: { status: true, previewUserIds: true, maxOrderQty: true, pendingOrderCap: true },
  })
  if (!t) return error('资源不存在', 404)
  if (t.status === 'DRAFT') {
    const preview = Array.isArray(t.previewUserIds) && t.previewUserIds.some((x) => x === user.id)
    // DRAFT 店面对非预览账号「不存在」（与前台外壳的 404 同一口径，设计 4.4、T16）
    if (!preview) return error('资源不存在', 404)
  } else if (t.status !== 'ACTIVE') {
    return error('本店暂停营业，暂不接受新订单', 403)
  }

  // 3. 风控：单笔数量与本店未付单并发上限（防一个店把全站共用的唯一金额槽占满，设计 5.1）
  if (quantity > t.maxOrderQty) return error(`本店单次最多购买 ${t.maxOrderQty} 件`)
  const pending = await prisma.order.count({
    where: { tenantId: sf.id, payStatus: 'UNPAID', createdAt: { gt: new Date(Date.now() - PENDING_WINDOW_MS) } },
  })
  if (pending >= t.pendingOrderCap) return error('当前下单人数较多，请稍后再试', 429)
  if ((await countOpenOrderPayments(user.id)) >= VMQ_MAX_OPEN_PER_USER) {
    return error(
      `你已有 ${VMQ_MAX_OPEN_PER_USER} 笔订单在等待付款，请先在「我的订单」完成支付，或等其超时（约 ${VMQ_TIMEOUT_MIN} 分钟）后再下单`,
      429
    )
  }
  if (rateLimited(`order-create:${user.id}`, { windowMs: 10 * 60_000, max: 20 })) {
    return error('下单过于频繁，请稍后再试', 429)
  }

  // 4. 本站拉黑（渠道或平台设的都算；只影响本店新下单，取卡、留言照常，T14）。文案中性，不说「被拉黑」
  if (await isBlockedInTenant(prisma, sf.id, user.id)) {
    return error('该账号暂无法在本站下单，请联系客服', 403)
  }

  // 5. 渠道站营销硬关：带券明确拒绝（400，不静默忽略，便于发现客户端 bug）；ref 不读
  if (input.couponGrantId) return error('本站不支持优惠券')

  // 开票字段的纯字段校验（与主站同一套规则）
  const invoiceIn = input.invoice
  let invoiceFields: ReturnType<typeof normalizeInvoiceFields> | null = null
  if (invoiceIn) {
    try {
      invoiceFields = normalizeInvoiceFields(invoiceIn)
    } catch (e) {
      if (e instanceof BillingError) return error(e.message, e.status)
      throw e
    }
  }

  let alert = null as string | null
  let created: { order: CreatedShopOrder; productName: string; stock: number; amount: number; invoiceTaxFee: number | null }
  try {
    created = await prisma.$transaction(async (tx) => {
      // 6.1 定价与可售（同一个 tx 读 listing / product / tenant）
      const q = await resolveUnitPrice(sf, productId, { buyerId: user.id, db: tx, previewUserId: user.id })
      if (!q.sellable) {
        if (ALERT_REASONS.has(q.reason)) alert = `[渠道下单] ${sf.code} 商品 ${productId} 不可售：${q.reason}（上架行配置异常，请核对进货价与售价）`
        throw new OrderReject(q.reason === 'TENANT_INACTIVE' ? '本店暂停营业，暂不接受新订单' : CHANNEL_NOT_SELLABLE, q.reason === 'TENANT_INACTIVE' ? 403 : 400)
      }
      if (q.kind !== 'CHANNEL') throw new Error('[orders] 渠道店面得到了主站报价')

      // 6.2 库存预检（现有逻辑：只预检不预占，设计 7.5）
      const product = await tx.product.findUnique({ where: { id: productId }, select: { name: true, stock: true } })
      if (!product) throw new OrderReject(CHANNEL_NOT_SELLABLE)
      if (product.stock !== -1 && product.stock < quantity) throw new OrderReject('库存不足')

      // 6.3 成员自买（设计 7.7）：不计余额（付款时 EXCLUDED），且不可开票
      const member = await tx.tenantMember.findUnique({
        where: { tenantId_userId: { tenantId: sf.id, userId: user.id } },
        select: { status: true },
      })
      const selfBuy = member?.status === 1
      if (selfBuy && invoiceFields) throw new OrderReject('本店成员在本店下单不支持开具发票')

      // 6.4 金额：按售价成交，券与内推都不参与（quoteOrder 渠道分支，与结算弹窗同一口径）
      const quote = quoteOrder({ productId, listPrice: 0, quantity, referralUnitPrice: null, rule: null, channelUnitCents: q.unitCents })
      const amount = quote.amount
      let invoiceTaxFee: number | null = null
      let invoiceInfo: string | null = null
      if (invoiceFields) {
        const { taxFee } = calcInvoiceAmounts(amount)
        if (taxFee <= 0) throw new OrderReject('该订单金额无法开具发票')
        invoiceTaxFee = taxFee
        invoiceInfo = JSON.stringify({ ...invoiceFields, taxFee })
      }

      // 6.5 此刻的费率与冻结期（同一个 tx；读不到整单回滚）
      const cfg = await readChannelOrderConfig(tx, sf.id)

      // 6.6 + 6.7 快照断言在 createShopOrder 里做，任何一条不满足抛 ShopOrderSnapshotError
      const order = await createShopOrder(tx, {
        tenantId: sf.id,
        userId: user.id,
        productId,
        productName: product.name,
        productPrice: q.unitCents / 100,
        quantity,
        amount,
        invoiceTaxFee,
        invoiceInfo,
        remark: remark ?? null,
        channel: {
          listingId: q.listingId,
          supplyUnitCents: q.supplyUnitCents,
          supplyCents: q.supplyUnitCents * quantity,
          feeRateBp: cfg.feeRateBp,
          invoiceShareRateBp: cfg.invoiceShareRateBp,
          settleHoldDays: cfg.holdDays,
          mainPriceCents: q.mainPriceCents,
          settleExcludeReason: selfBuy ? 'SELF' : null,
        },
      })

      // 6.8 站点客户关系（设计 5.5：渠道 Host 建单时写，同一事务）
      await ensureTenantCustomer(tx, { tenantId: sf.id, userId: user.id, via: 'ORDER' })
      return { order, productName: product.name, stock: product.stock, amount, invoiceTaxFee }
    })
  } catch (e) {
    if (alert) void alertPlatform(alert)
    if (e instanceof OrderReject) return error(e.message, e.status)
    if (e instanceof ShopOrderSnapshotError) {
      // 快照不完整只可能是 bug：拒单 + 告警（设计 5.4）
      void alertPlatform(`[渠道下单] ${sf.code} 快照断言失败，已拒单：${e.message}`)
      console.error(e)
      return error('创建订单失败，请稍后再试')
    }
    throw e
  }

  await saveTitleSideEffects(user.id, invoiceIn, invoiceFields)

  // 7. 平台企业微信照发，打「[code]」标签（通知挂了不影响下单）
  notifyOrderCreated({
    orderNo: created.order.orderNo,
    buyer: user.nickname || user.email || `用户#${user.id}`,
    productName: `${siteTag(sf)}${created.productName}`,
    quantity,
    amount: created.amount,
    createdAt: created.order.createdAt,
    stock: created.stock,
  })

  return orderCreatedResponse(created.order, {
    productId,
    productName: created.productName,
    quantity,
    amount: created.amount,
    invoiceTaxFee: created.invoiceTaxFee,
    couponNote: null,
    lotteryEligible: false,
  })
}
