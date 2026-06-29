import { prisma } from './db'
import { calcInvoiceAmounts, genInvoiceNo } from './invoice'
import { PAYEE, genReceiptNo, genReceiptToken } from './receipt'
import { createOrGetVmqOrder } from './vmq'

// 发票/收据业务错误（带可选 HTTP 状态）
export class BillingError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = 'BillingError'
    this.status = status
  }
}

export interface BuyerInvoiceFields {
  title: string
  taxNumber: string
  address?: string | null
  phone?: string | null
  bankName?: string | null
  bankAccount?: string | null
  email: string
}

// 以「订单（外部订单）」为基准创建/更新发票并发起税费收款。
// 邮箱查询路径与买家订单路径共用此逻辑，避免分叉。
export async function submitInvoiceForExternalOrder(externalOrderId: number, d: BuyerInvoiceFields) {
  const order = await prisma.externalOrder.findUnique({ where: { id: externalOrderId } })
  if (!order) throw new BillingError('订单不存在')

  // 计费基准 = 报价(quote)
  const price = order.quote == null ? null : Number(order.quote)
  if (price == null) throw new BillingError('该订单暂不可开具发票')
  const { invoiceAmount, taxFee } = calcInvoiceAmounts(price)

  const email = d.email.trim().toLowerCase()
  const buyerFields = {
    title: d.title,
    taxNumber: d.taxNumber,
    address: d.address || null,
    phone: d.phone || null,
    bankName: d.bankName || null,
    bankAccount: d.bankAccount || null,
    email,
    sellingPrice: price,
    invoiceAmount,
    taxFee,
  }

  // 一笔订单一张发票
  const existing = await prisma.invoice.findUnique({ where: { externalOrderId: order.id } })
  let invoice
  if (existing) {
    if (existing.status === 'ISSUED' || existing.status === 'SUBMITTED') {
      throw new BillingError('该订单已申请发票，请勿重复提交')
    }
    if (existing.status === 'CANNOT') {
      throw new BillingError('该订单暂不可开具发票，请联系客服')
    }
    invoice = await prisma.invoice.update({
      where: { id: existing.id },
      data: { ...buyerFields, status: 'AWAIT_PAY' },
    })
  } else {
    invoice = await prisma.invoice.create({
      data: {
        invoiceNo: genInvoiceNo(),
        externalOrderId: order.id,
        sourceKey: order.sourceKey,
        claudeAccount: order.claudeAccount,
        subscriptionType: order.subscriptionType,
        orderStartDate: order.startDate,
        orderExpireDate: order.expireDate,
        ...buyerFields,
        status: 'AWAIT_PAY',
        payStatus: 'UNPAID',
      },
    })
  }

  // 发起 V免签 收款（支付税费）
  const vmq = await createOrGetVmqOrder({
    bizType: 'invoice',
    bizId: invoice.id,
    outTradeNo: invoice.invoiceNo,
    price: Number(invoice.taxFee),
  })

  return {
    payUrl: `/pay/${vmq.orderId}`,
    invoiceId: invoice.id,
    taxFee: Number(invoice.taxFee),
    reallyPrice: vmq.reallyPrice,
  }
}

// 以「订单（外部订单）」为基准生成收据。
export async function submitReceiptForExternalOrder(externalOrderId: number, payerTitle: string) {
  const order = await prisma.externalOrder.findUnique({ where: { id: externalOrderId } })
  if (!order) throw new BillingError('订单不存在')

  // 一笔订单仅一张收据
  const existing = await prisma.receipt.findFirst({ where: { externalOrderId: order.id } })
  if (existing) throw new BillingError('该订单已开具收据，如需重开请联系客服', 409)

  // 计费基准 = 报价(quote, 即售价)。
  // 若买家已支付发票税费（invoice.payStatus=PAID，对应状态 SUBMITTED/ISSUED），
  // 则其实付总额 = 售价 + 6%税费 = 含税开票金额，收据应按含税金额出具；
  // 仅申请未付税费(AWAIT_PAY)时仍按售价。
  const quote = order.quote == null ? null : Number(order.quote)
  if (quote == null) throw new BillingError('该订单暂不可开具收据')

  const invoice = await prisma.invoice.findUnique({ where: { externalOrderId: order.id } })
  const amount = invoice && invoice.payStatus === 'PAID' ? Number(invoice.invoiceAmount) : quote

  const receipt = await prisma.receipt.create({
    data: {
      receiptNo: genReceiptNo(),
      token: genReceiptToken(),
      externalOrderId: order.id,
      sourceKey: order.sourceKey,
      claudeAccount: order.claudeAccount,
      subscriptionType: order.subscriptionType,
      orderStartDate: order.startDate,
      orderExpireDate: order.expireDate,
      payerTitle,
      payee: PAYEE,
      amount,
    },
  })

  return { token: receipt.token }
}

// 买家从「我的订单」申请发票/收据时，为该订单生成/复用一条背书 ExternalOrder，
// 使其复用现有发票/收据/开票/管理员后台体系。sourceKey 固定为 `order:<id>`，幂等。
interface ShopOrderForBilling {
  id: number
  productName: string
  amount: unknown // Prisma.Decimal | number
  paidAt: Date | null
  createdAt: Date
  user: { email: string | null; nickname: string | null }
}

export function shopOrderSourceKey(orderId: number): string {
  return `order:${orderId}`
}

export async function ensureExternalOrderForShopOrder(o: ShopOrderForBilling) {
  const sourceKey = shopOrderSourceKey(o.id)
  const claudeAccount = (o.user.email || `order-${o.id}@bigolab.local`).toLowerCase()
  const subscriptionType = o.productName
  const xianyuNickname = o.user.nickname || o.user.email || null

  // 开通时间取支付时间（无则下单时间），到期时间默认 +1 个月，仅用于票据展示
  const base = o.paidAt ?? o.createdAt
  const startDate = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  const expireDate = new Date(base.getFullYear(), base.getMonth() + 1, base.getDate())

  return prisma.externalOrder.upsert({
    where: { sourceKey },
    create: {
      startDate,
      expireDate,
      subscriptionType,
      xianyuNickname,
      claudeAccount,
      quote: o.amount as never, // 报价 = 订单金额
      sourceKey,
      importBatch: 'SHOP',
    },
    // 复用时只刷新报价/类型/昵称，保持开通-到期日期稳定（避免已开票据的周期变动）
    update: {
      quote: o.amount as never,
      subscriptionType,
      xianyuNickname,
    },
  })
}
