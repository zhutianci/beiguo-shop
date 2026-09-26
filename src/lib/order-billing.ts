import { prisma } from './db'
import { calcInvoiceAmounts, genInvoiceNo, normalizeTaxNumber } from './invoice'
import { PAYEE, genReceiptNo, genReceiptToken } from './receipt'
import { createOrGetVmqOrder } from './vmq'
import { notifyReceiptCreated } from './notify'
import { BillingError, assertShopOrderBillable, billingFieldsOrThrow, shopOrderIdOfExt, type BuyerInvoiceFields } from './order-invoice'
import { hasAccountAccess } from './email-proof'

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
// /api/invoices、/api/receipts、/api/invoices/[id]/pay 服务于「邮箱查订阅」的匿名流程
// （买家多来自闲鱼、未注册），因此不能简单要求登录；但 externalOrderId 是自增整数，必须证明归属。
//
// 【2026-09-26 起的规则（审计 G12）】
//  A. 背后有站内订单的行（背书行 order:<id>，或 shopOrderId 指向站内订单的 WEB 行）：
//     **只认下单本人登录**。站内订单有唯一确定的下单人（Order.userId 非空），
//     而这类行的账户邮箱就是买家的登录邮箱——谁都可能知道，不能再当凭证。
//  B. 纯外部行（闲鱼导入）：邮箱归属证明（lib/email-proof.ts 的 hasAccountAccess）——
//     刚验过 LOOKUP 验证码 / 登录邮箱已验证且就是它 / 已验证的绑定。
//     以前只要「说出账户邮箱」就放行，任何知道邮箱的人都能改别人的发票抬头、抢开盖章收据。
//
// order.shopOrderId：调用方查外部订单时顺手带上就传；不传（undefined）则这里按 id 自己补查，
// 传 null 表示「确认没有」、不再查。
export async function assertExternalOrderAccess(
  order: { id: number; sourceKey: string; claudeAccount: string; shopOrderId?: number | null; tenantId?: number },
  opts: { user?: { id: number; email?: string | null } | null; proofDigests?: Set<string> }
): Promise<void> {
  const user = opts.user ?? null

  // A) 站内订单：只认下单本人
  const m = /^order:(\d+)$/.exec(order.sourceKey || '')
  const keyOrderId = m ? parseInt(m[1]) : null
  let shopOrderId = order.shopOrderId
  let extTenantId = order.tenantId
  if (shopOrderId === undefined || extTenantId === undefined) {
    const row = await prisma.externalOrder.findUnique({ where: { id: order.id }, select: { shopOrderId: true, tenantId: true } })
    if (shopOrderId === undefined) shopOrderId = row?.shopOrderId ?? null
    if (extTenantId === undefined) extTenantId = row?.tenantId ?? 1
  }
  const linkedIds = Array.from(new Set([keyOrderId, shopOrderId].filter((v): v is number => !!v)))
  if (linkedIds.length) {
    const owners = await prisma.order.findMany({ where: { id: { in: linkedIds } }, select: { userId: true, tenantId: true } })
    /*
     * 【跨站合并一律拒绝】（设计 9.3）外部订单行的来源站必须与它指回的每一张站内订单相同。
     * 不一致只可能是数据被改坏（或有人把 A 站订单挂到 B 站的行上），此时谁都不能拿这一行开票 / 开收据。
     * 主站存量行 tenantId 全是 1、订单也全是 1，这道闸不改变主站行为。
     */
    if (owners.some((o) => o.tenantId !== extTenantId)) {
      throw new BillingError('该订单不属于本站，不能开具票据', 404)
    }
    if (owners.length) {
      if (user && owners.some((o) => o.userId === user.id)) return
      throw new BillingError('该订单为本站账号下单，请登录下单账号后操作（或在「我的订单」中开具）', 403)
    }
  }

  // B) 纯外部行：邮箱归属证明
  if (await hasAccountAccess(order.claudeAccount, user, opts.proofDigests ?? new Set())) return

  throw new BillingError('请先验证账户邮箱（在「邮箱查询」页获取验证码），或登录后重试', 403)
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
  // 关联的站内订单已取消（线下退款）/ 已退款：不再开票。订单页和「邮箱查订阅」两条路都经过这里
  await assertShopOrderBillable(shopOrderIdOfExt(order))

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

  // 来源站两列（渠道分站）：取自外部订单行指回的站内订单；跨站不一致抛 409
  const tf = await billingFieldsOrThrow(order.id)

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
      data: { ...buyerFields, status: 'AWAIT_PAY', userId: existing.userId ?? opts.userId ?? null, tenantId: tf.tenantId, shopOrderId: tf.shopOrderId },
    })
  } else {
    invoice = await prisma.invoice.create({
      data: {
        invoiceNo: genInvoiceNo(),
        externalOrderId: order.id,
        tenantId: tf.tenantId,
        shopOrderId: tf.shopOrderId,
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
//
// opts.paidInvoiceAmount：同一张站内订单挂在**另一条**外部订单行上的已付税费发票的含税金额。
// 一张站内订单可能有两条外部订单行（背书行 + 管理员「标记已完成」的 WEB 行），买家可能是在
// WEB 行上（从「邮箱查订阅」）付的 6%。只看本行发票的话，这种订单会开出一张不含税的收据，
// 比买家实付少 6%，而收据开出去改不回来。由调用方（api/orders/[id]/receipt）查全关联行后传入。
export async function submitReceiptForExternalOrder(
  externalOrderId: number,
  payerTitle: string,
  opts: {
    paidInvoiceAmount?: number | null
    /** 收据上是否展示 ChatGPT/Claude 字眼（买家申请时必选，与发票同一口径）。不展示 → 项目印「技术咨询服务」 */
    showAiWording?: boolean | null
  } = {}
) {
  const order = await prisma.externalOrder.findUnique({ where: { id: externalOrderId } })
  if (!order) throw new BillingError('订单不存在')
  // 同发票：关联的站内订单已作废就不再开收据（收据盖章开出去就收不回来）
  await assertShopOrderBillable(shopOrderIdOfExt(order))

  // 来源站两列（渠道分站）：取自外部订单行指回的站内订单；跨站不一致抛 409
  const tf = await billingFieldsOrThrow(order.id)

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
  const amount =
    invoice && invoice.payStatus === 'PAID'
      ? Number(invoice.invoiceAmount)
      : opts.paidInvoiceAmount != null && opts.paidInvoiceAmount > 0
        ? opts.paidInvoiceAmount
        : quote

  const receipt = await prisma.receipt.create({
    data: {
      receiptNo: genReceiptNo(),
      token: genReceiptToken(),
      externalOrderId: order.id,
      tenantId: tf.tenantId,
      shopOrderId: tf.shopOrderId,
      sourceKey: order.sourceKey,
      claudeAccount: order.claudeAccount,
      subscriptionType: order.subscriptionType,
      orderStartDate: order.startDate,
      orderExpireDate: order.expireDate,
      payerTitle,
      payee: PAYEE,
      amount,
      source: 'BUYER',
      showAiWording: opts.showAiWording ?? null,
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

  /*
   * 买家自助开收据是纯通知、站长无须处理：只推主站单（docs/多渠道分销-二期改动.md 3.1）。
   * 渠道单不再推站长群（原来带「[lulu]」标签照推）；主站单 site 为 null，推送内容与原来逐字相同。
   */
  if (tf.tenantId === 1) {
    notifyReceiptCreated({
      receiptNo: receipt.receiptNo,
      payerTitle: receipt.payerTitle,
      amount: receipt.amount,
      source: 'BUYER',
      account: receipt.claudeAccount,
      createdAt: receipt.createdAt,
      site: null,
    })
  }

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
      // 手工收据没有站内订单，来源站固定主站（设计 9.3）
      tenantId: 1,
      shopOrderId: null,
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
