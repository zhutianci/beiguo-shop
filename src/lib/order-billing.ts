import { prisma } from './db'
import { calcInvoiceAmounts, genInvoiceNo, normalizeTaxNumber } from './invoice'
import { PAYEE, genReceiptNo, genReceiptToken } from './receipt'
import { createOrGetVmqOrder } from './vmq'
import { notifyReceiptCreated } from './notify'
import { BillingError, type BuyerInvoiceFields } from './order-invoice'

// BillingError / BuyerInvoiceFields / ensureExternalOrderForShopOrder 等已迁到 ./order-invoice
// （见那个文件顶部的说明：为了不让 lib/vmq.ts 与本文件形成循环依赖）。
// 这里原样再导出一遍，调用方不用改 import 路径。
export {
  BillingError,
  shopOrderSourceKey,
  ensureExternalOrderForShopOrder,
  parseOrderInvoiceDraft,
  materializeOrderInvoice,
  createManualInvoice,
} from './order-invoice'
export type { BuyerInvoiceFields, OrderInvoiceDraft, ManualInvoiceInput } from './order-invoice'

// ---- 订单归属校验 ----
// /api/invoices 与 /api/receipts 服务于「邮箱查订阅」的匿名流程（买家多来自闲鱼，未注册），
// 因此不能简单要求登录。但 externalOrderId 是自增整数，只凭 ID 就能给别人的订单开票据
// （返回的 token 打开即可看到对方邮箱、订阅类型、金额）。
// 折中：要求调用方证明「知道该订单的账户邮箱」——这正是邮箱查询流程本就具备的信息；
// 已登录用户则按本人订单 / 本人邮箱 / 已绑定账户放行。
export async function assertExternalOrderAccess(
  order: { id: number; sourceKey: string; claudeAccount: string },
  opts: { userId?: number | null; userEmail?: string | null; claimedEmail?: string | null }
): Promise<void> {
  const account = (order.claudeAccount || '').trim().toLowerCase()

  // 1) 本站订单背书：sourceKey = order:<id>，校验该订单确实属于当前登录用户
  const m = /^order:(\d+)$/.exec(order.sourceKey || '')
  if (m && opts.userId) {
    const shopOrder = await prisma.order.findUnique({
      where: { id: parseInt(m[1]) },
      select: { userId: true },
    })
    if (shopOrder && shopOrder.userId === opts.userId) return
  }

  // 2) 登录用户本人邮箱即该订阅账户
  if (opts.userEmail && opts.userEmail.trim().toLowerCase() === account) return

  // 3) 登录用户已在个人中心绑定该订阅账户
  if (opts.userId && account) {
    const bound = await prisma.userAccount.findFirst({
      where: { userId: opts.userId, accountEmail: account },
      select: { id: true },
    })
    if (bound) return
  }

  // 4) 匿名流程：调用方提供了正确的账户邮箱
  if (opts.claimedEmail && opts.claimedEmail.trim().toLowerCase() === account) return

  throw new BillingError('无权操作该订单，请通过「邮箱查询」进入或登录后重试', 403)
}

// 以「订单（外部订单）」为基准创建/更新发票并发起税费收款。
// 邮箱查询路径与买家订单路径共用此逻辑，避免分叉。
export async function submitInvoiceForExternalOrder(
  externalOrderId: number,
  d: BuyerInvoiceFields,
  opts: { userId?: number | null } = {}
) {
  const order = await prisma.externalOrder.findUnique({ where: { id: externalOrderId } })
  if (!order) throw new BillingError('订单不存在')

  // 计费基准 = 报价(quote)。
  // 【内推单天然按专属价开票】本站订单的 quote 由 ensureExternalOrderForShopOrder
  // 写成 order.amount，而内推单的 amount 建单时就已经是推广人的专属价
  // （见 api/orders/route.ts 的 unitPrice），所以开票金额 = 专属价*1.06，无需额外分支。
  const price = order.quote == null ? null : Number(order.quote)
  if (price == null) throw new BillingError('该订单暂不可开具发票')
  const { invoiceAmount, taxFee } = calcInvoiceAmounts(price)

  const email = d.email.trim().toLowerCase()
  const buyerFields = {
    title: d.title,
    // 兜底再归一化一次：这个函数是所有买家开票路径的唯一出口，
    // 将来多出一个调用方忘了走 invoice-input，税号也不会带着空格进库
    taxNumber: normalizeTaxNumber(d.taxNumber),
    address: d.address || null,
    phone: d.phone || null,
    bankName: d.bankName || null,
    bankAccount: d.bankAccount || null,
    email,
    showAiWording: d.showAiWording,
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
      // userId 只补不覆盖：历史匿名单第一次被登录用户接手时记上归属，
      // 但已有归属的不能被后来的调用改掉
      data: { ...buyerFields, status: 'AWAIT_PAY', userId: existing.userId ?? opts.userId ?? null },
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
        userId: opts.userId ?? null,
        source: 'BUYER',
        status: 'AWAIT_PAY',
        payStatus: 'UNPAID',
      },
    })
  }

  // 这里刻意不推企业微信：此刻税费还没付，申请不一定成立，推了只会制造
  // 需要人工判断「这单到底付没付」的噪音。推送统一放在税费到账时（见 vmq.ts 的 fulfillInvoice）。

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
      source: 'BUYER',
    },
  })

  // 上面的「查重 findFirst → create」不是原子的，Receipt.externalOrderId 也没有唯一约束
  // （线上历史数据可能已存在重复行，贸然加 unique 会让 db push 直接失败）。
  // 这里做一次创建后对账：同一订单若出现多张买家收据，只保留最早的一张，把本次多建的删掉。
  const siblings = await prisma.receipt.findMany({
    where: { externalOrderId: order.id, source: 'BUYER' },
    select: { id: true },
    orderBy: { id: 'asc' },
  })
  if (siblings.length > 1 && siblings[0].id !== receipt.id) {
    await prisma.receipt.delete({ where: { id: receipt.id } }).catch(() => {})
    throw new BillingError('该订单已开具收据，如需重开请联系客服', 409)
  }

  notifyReceiptCreated({
    receiptNo: receipt.receiptNo,
    payerTitle: receipt.payerTitle,
    amount: receipt.amount,
    source: 'BUYER',
    account: receipt.claudeAccount,
    createdAt: receipt.createdAt,
  })

  return { token: receipt.token }
}

export interface ManualReceiptItem {
  label: string
  value: string
}

export interface ManualReceiptInput {
  receiptNo?: string | null
  payerTitle: string
  account?: string | null // 展示在「账户」行，对应 claudeAccount，可留空
  amount: number
  issuedAt?: Date | null
  items?: ManualReceiptItem[] // DIY 追加条目，按数组顺序展示
  remark?: string | null
}

// 管理员手动开具（DIY）收据：不挂订单（externalOrderId 保持 null），
// 因此不受「一笔订单仅一张收据」的限制，也不会影响买家自助开具的查重语义。
export async function createManualReceipt(input: ManualReceiptInput) {
  const amount = Number(input.amount)
  if (!isFinite(amount) || amount <= 0) throw new BillingError('金额必须大于 0')

  const items = (input.items || [])
    .map((it) => ({ label: String(it.label || '').trim(), value: String(it.value ?? '').trim() }))
    .filter((it) => it.label)

  const receipt = await prisma.receipt.create({
    data: {
      receiptNo: (input.receiptNo || '').trim() || genReceiptNo(),
      token: genReceiptToken(),
      externalOrderId: null,
      sourceKey: null,
      claudeAccount: input.account?.trim() || null,
      subscriptionType: null,
      payerTitle: input.payerTitle,
      payee: PAYEE,
      amount,
      source: 'MANUAL',
      items: items.length ? JSON.stringify(items) : null,
      remark: input.remark?.trim() || null,
      issuedAt: input.issuedAt ?? new Date(),
    },
  })

  return { id: receipt.id, token: receipt.token, receiptNo: receipt.receiptNo }
}

/** 安全解析 Receipt.items（JSON Text），坏数据一律当空数组，参考 ForumPost.images 的用法 */
export function parseReceiptItems(raw: string | null | undefined): ManualReceiptItem[] {
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr
      .filter((x) => x && typeof x === 'object')
      .map((x) => ({ label: String(x.label ?? ''), value: String(x.value ?? '') }))
      .filter((x) => x.label)
  } catch {
    return []
  }
}
