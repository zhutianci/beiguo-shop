import { prisma } from './db'
import {
  calcInvoiceAmounts,
  genInvoiceNo,
  normalizeTaxNumber,
  TAX_RATE,
  TAX_NUMBER_MAX_LEN,
} from './invoice'

/**
 * 发票/票据的**叶子**模块：只依赖 db 与 invoice 这两个纯粹的底层，不引用 vmq / notify / mail。
 *
 * 【为什么要单独拆出来】lib/vmq.ts 的 fulfillOrder 需要在收款履约时落地发票
 * （下单勾了「同时开发票」的那条路），而 lib/order-billing.ts 为了发起税费收款
 * 又必须 import lib/vmq.ts。两边直接互相 import 就成了循环依赖 ——
 * webpack 打包顺序一变，先加载的那个模块拿到的会是 undefined，
 * 表现为线上偶发「x is not a function」而本地 dev 一切正常。
 *
 * 规则：**这个文件永远不要 import vmq / notify / mail 这类会反向依赖它的模块。**
 * 需要发通知就把决定权返回给调用方（materializeOrderInvoice 返回新建的发票或 null）。
 */

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
  /** 发票内容是否展示 ChatGPT/Claude 等字眼（买家申请时必选，无默认值） */
  showAiWording: boolean
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

  // 【报价一旦被已成立的发票用过就不再刷新】quote 是开票金额的计算基准，
  // 而管理员改单价（api/admin/orders/[id]）之后买家再来开一张收据，会走到这里把 quote 刷成新价。
  // 已经开出去的那张发票上的金额是改不了的，让基准跟着漂只会让后台数字对不上票面。
  //
  // 只查不写，然后仍旧走一次 upsert —— 不要拆成 findUnique + update：
  // 那样在「查到了、但中途被后台删掉」时会抛 P2025，而这个函数在付款履约路径上，
  // 抛出去就意味着买家付了钱却卡在履约里。
  const existing = await prisma.externalOrder.findUnique({
    where: { sourceKey },
    select: { id: true },
  })
  const locked = existing
    ? await prisma.invoice.findFirst({
        where: { externalOrderId: existing.id, status: { in: ['SUBMITTED', 'ISSUED'] } },
        select: { id: true },
      })
    : null

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
      shopOrderId: o.id,
      importBatch: 'SHOP',
      /*
       * 【出厂即视为「已提醒过」，不参与自动到期提醒】
       *
       * 这条 external_orders 是为了让发票/收据有开通-到期日期可印而造的背书行，
       * expireDate 是「付款日 + 1 个月」硬写的，跟买家真实的订阅周期没有关系。
       * 而 lib/reminder.ts 的自动提醒是全表扫 expireDate ∈ [今天, 今天+8天)，
       * 不区分这行是真订单还是背书行 —— 于是买了一次性商品（卡密、接码）的买家
       * 会在一个月后收到一封「你的订阅即将到期，请续费」。
       *
       * 改造前这条路要买家主动点「申请发票/收据」才会走到，现在结算页的复选框
       * 让它变成了常规路径，必须堵上。
       *
       * 手法：把 remindedExpireDate 预置成 expireDate —— runReminders 的
       * `!isSameUtcDate(remindedExpireDate, expireDate)` 过滤会直接跳过它
       * （lib/reminder.ts:331）。后台手动给某个客户发提醒不受影响。
       * 后台在订单交付时按真实周期导入的那些订单走的是另一条路
       * （api/admin/orders/[id] 的 hashKey sourceKey），照常提醒。
       */
      remindedExpireDate: expireDate,
    },
    // 复用时只刷新报价/类型/昵称，保持开通-到期日期稳定（避免已开票据的周期变动）；
    // 已有成立发票时连报价都不动
    // shopOrderId 只补不改：历史背书行是这次改造之前建的，那时还没有这一列
    update: locked
      ? { subscriptionType, xianyuNickname, shopOrderId: o.id }
      : { quote: o.amount as never, subscriptionType, xianyuNickname, shopOrderId: o.id },
  })
}

/** 下单时勾选开票所存的草稿（Order.invoiceInfo 里的 JSON 形状） */
export interface OrderInvoiceDraft extends BuyerInvoiceFields {
  /** 建单那一刻算出的税费，与 Order.invoiceTaxFee 同值，仅供排查时对照 */
  taxFee: number
}

/**
 * 安全解析 Order.invoiceInfo。坏数据一律当「没勾开票」处理 ——
 * 参考 parseReceiptItems 的做法：履约路径上绝不能因为一段 JSON 解析失败就抛出，
 * 那会把已经付过钱的买家的发货一起带走。
 */
export function parseOrderInvoiceDraft(raw: string | null | undefined): OrderInvoiceDraft | null {
  if (!raw) return null
  try {
    const d = JSON.parse(raw)
    if (!d || typeof d !== 'object') return null
    if (!d.title || !d.taxNumber || !d.email) return null
    if (typeof d.showAiWording !== 'boolean') return null
    return {
      title: String(d.title),
      taxNumber: normalizeTaxNumber(String(d.taxNumber)),
      address: d.address ? String(d.address) : null,
      phone: d.phone ? String(d.phone) : null,
      bankName: d.bankName ? String(d.bankName) : null,
      bankAccount: d.bankAccount ? String(d.bankAccount) : null,
      email: String(d.email),
      showAiWording: d.showAiWording,
      taxFee: Number(d.taxFee) || 0,
    }
  } catch {
    return null
  }
}

/** materializeOrderInvoice 需要的订单最小形状 */
interface PaidOrderForInvoice extends ShopOrderForBilling {
  userId: number
  invoiceInfo: string | null
}

/**
 * 把「下单时勾的开票草稿」落成一张**已成立**的发票（税费随货款一起收过了）。
 *
 * 只在订单确实已付款后调用（履约路径 lib/vmq.ts 的 fulfillOrder）。
 *
 * 【幂等性】fulfillOrder 会被重复进入：重复到账推送、后台「补发卡密」、
 * 后台手动补单 manualComplete 都会再跑一遍，而其中只有首次 payStatus 翻转有 CAS 保护。
 * 这里不依赖那个 won 标记（补单场景下它是 false，靠它就永远不开票了），
 * 改为靠 Invoice.externalOrderId 的唯一约束兜底：抢不到就说明已经建过，直接返回 null。
 *
 * 返回新建的发票（已存在则返回 null，调用方据此决定要不要推送通知）。
 */
export async function materializeOrderInvoice(o: PaidOrderForInvoice) {
  const draft = parseOrderInvoiceDraft(o.invoiceInfo)
  if (!draft) return null

  const ext = await ensureExternalOrderForShopOrder(o)

  // 快路：已经有了就不再动。并发时靠下面的 P2002 兜底
  const existing = await prisma.invoice.findUnique({
    where: { externalOrderId: ext.id },
    select: { id: true },
  })
  if (existing) return null

  // 金额以 ExternalOrder.quote（= 货款）为准重算，不信草稿里的数字：
  // 草稿是下单那一刻的快照，万一中途被管理员改过价，票面要跟着实际成交价走。
  const price = ext.quote == null ? null : Number(ext.quote)
  if (price == null) return null
  const { invoiceAmount, taxFee } = calcInvoiceAmounts(price)

  const paidAt = o.paidAt ?? new Date()
  try {
    return await prisma.invoice.create({
      data: {
        invoiceNo: genInvoiceNo(),
        externalOrderId: ext.id,
        sourceKey: ext.sourceKey,
        claudeAccount: ext.claudeAccount,
        subscriptionType: ext.subscriptionType,
        orderStartDate: ext.startDate,
        orderExpireDate: ext.expireDate,
        title: draft.title,
        taxNumber: draft.taxNumber,
        address: draft.address,
        phone: draft.phone,
        bankName: draft.bankName,
        bankAccount: draft.bankAccount,
        email: draft.email,
        showAiWording: draft.showAiWording,
        sellingPrice: price,
        invoiceAmount,
        taxFee,
        userId: o.userId,
        source: 'BUYER',
        // 税费是跟货款一笔收的，钱已经到账 —— 直接进「已提交开票」，
        // 与单独支付税费那条路（fulfillInvoice）落到的终态完全一致
        status: 'SUBMITTED',
        payStatus: 'PAID',
        paidAt,
        submittedAt: paidAt,
      },
    })
  } catch (e) {
    // 并发下另一次履约抢先建成了。externalOrderId 是 @unique，这里必然是 P2002
    if ((e as { code?: string })?.code === 'P2002') return null
    throw e
  }
}

/**
 * 「这笔订单的 6% 是不是已经在结账时收过了」——所有事后开票入口的第一道闸。
 *
 * 【为什么必须有它】Invoice 行不是判据。materializeOrderInvoice 在履约里是 try 住的，
 * 万一那一下失败（网络抖动、连接池耗尽），订单就处在「税费已到账、但 invoices 表里没有行」
 * 的状态。而 GET /api/orders 的 invoiceStatus 只看有没有 Invoice 行，此时会返回 UNAPPLIED，
 * 订单页照常显示「申请发票」——买家点下去就是**第二次**支付 6%。
 *
 * 所以事后开票入口一律先问 Order.invoiceTaxFee：不为空就说明钱早收过了，
 * 不该再开一张 AWAIT_PAY 收款单，而应该直接把当初的草稿补落成正式发票。
 *
 * 返回值：null = 这单没预收过税费，按原流程走；否则 = 已处理（发票已存在或刚补出来）。
 */
export async function settlePrepaidOrderInvoice(
  shopOrderId: number,
  fields?: BuyerInvoiceFields
): Promise<{ alreadyPaid: true } | null> {
  return settlePrepaid(shopOrderId, fields)
}

/**
 * 同上，但入口是一条 external_orders。
 *
 * 【为什么不能只解析 sourceKey】同一笔站内订单可能对应两条 external_orders：
 * 买家点「申请发票」时造的 `order:<id>` 背书行，和管理员把订单标成「已完成」时
 * 按真实订阅周期导入的 `hashKey(...)` 行。后者的 sourceKey 里没有订单号，
 * 买家从「邮箱查订阅」点进那一条，这道闸就会失灵、被收第二次税。
 * 所以优先读 shopOrderId 这一列，解析 sourceKey 只作为历史数据的兜底。
 */
export async function settlePrepaidInvoiceByExternalOrder(
  ext: { id: number; sourceKey: string | null; shopOrderId: number | null },
  fields?: BuyerInvoiceFields
): Promise<{ alreadyPaid: true } | null> {
  const fromKey = /^order:(\d+)$/.exec(ext.sourceKey || '')
  const orderId = ext.shopOrderId ?? (fromKey ? parseInt(fromKey[1]) : null)
  if (!orderId) return null
  return settlePrepaid(orderId, fields)
}

async function settlePrepaid(
  shopOrderId: number,
  fields?: BuyerInvoiceFields
): Promise<{ alreadyPaid: true } | null> {
  const order = await prisma.order.findUnique({
    where: { id: shopOrderId },
    select: {
      id: true,
      userId: true,
      productName: true,
      amount: true,
      paidAt: true,
      createdAt: true,
      payStatus: true,
      invoiceTaxFee: true,
      invoiceInfo: true,
      user: { select: { email: true, nickname: true } },
    },
  })
  if (!order) return null
  if (order.invoiceTaxFee == null || order.payStatus !== 'PAID') return null

  // 补落地（幂等：已有发票时返回 null，不会重复建）
  const created = await materializeOrderInvoice(order).catch((e) => {
    console.error('[invoice] 预收税费订单补落地失败', shopOrderId, e)
    return null
  })

  /*
   * 【买家刚填的抬头不能白填】他之所以点进来填一遍，往往正是因为页面上显示的还是
   * 「未开发票」。直接回一句「已提交」而把他填的内容丢掉，比报错更糟 ——
   * 他不会知道最终开出去的是下单时那个抬头。
   *
   * 所以在票还没真开出去（status 仍是 SUBMITTED）时，用这次提交的抬头就地覆盖。
   * 已开具(ISSUED)或不可开据(CANNOT)的不动：那时候票已经在税局那边了，
   * 改库里的字段只会让后台和票面对不上，得走人工重开。
   */
  if (fields && !created) {
    /*
     * 一笔站内订单可能挂着两条 external_orders（`order:<id>` 背书行 +
     * 管理员按真实订阅周期导入的 hashKey 行），findFirst 会随机命中其中一条。
     * 发票只可能在有发票的那一条上，所以把两条都取出来、按 id 集合更新。
     */
    const exts = await prisma.externalOrder.findMany({
      where: { shopOrderId },
      select: { id: true },
    })
    if (exts.length) {
      await prisma.invoice
        .updateMany({
          where: { externalOrderId: { in: exts.map((e) => e.id) }, status: 'SUBMITTED' },
          data: {
            title: fields.title,
            taxNumber: normalizeTaxNumber(fields.taxNumber),
            address: fields.address || null,
            phone: fields.phone || null,
            bankName: fields.bankName || null,
            bankAccount: fields.bankAccount || null,
            email: fields.email,
            showAiWording: fields.showAiWording,
          },
        })
        .catch((e) => console.error('[invoice] 更新已提交发票的抬头失败', shopOrderId, e))
    }
  }

  return { alreadyPaid: true }
}

export interface ManualInvoiceInput {
  /** 开票金额（含税）。站外客户线下实付多少就填多少 */
  invoiceAmount: number
  title: string
  taxNumber: string
  address?: string | null
  phone?: string | null
  bankName?: string | null
  bankAccount?: string | null
  email?: string | null
  /** 开票内容/项目，对应发票的「规格型号」列（仅在 showAiWording=true 时展示） */
  subscriptionType: string
  showAiWording: boolean
  /** 客户标识，展示在后台列表的「账户」列；留空则用邮箱兜底 */
  account?: string | null
  /** SUBMITTED 进待开清单（默认）/ ISSUED 只做存档 */
  status: 'SUBMITTED' | 'ISSUED'
}

/**
 * 管理员手动录入发票申请（站外客户，没有站内订单）。
 *
 * 与 createManualReceipt 同构：**不挂订单**（externalOrderId 保持 null）。
 * 刻意不给它造一条假的 ExternalOrder —— external_orders 会被到期提醒
 * （lib/reminder.ts 按 expireDate 扫）、账户绑定、订单分析一起读，
 * 往里塞不存在的订阅会给真实客户发出莫名其妙的续费提醒。
 *
 * 代价是后台列表要专门为「无订单」的发票开一个分支（见 api/admin/invoices）。
 * 批量导出与财务台本来就是直接查 invoices 表，不受影响。
 */
export async function createManualInvoice(input: ManualInvoiceInput) {
  const amount = Number(input.invoiceAmount)
  if (!isFinite(amount) || amount <= 0) throw new BillingError('开票金额必须大于 0')

  const title = input.title.trim()
  const taxNumber = normalizeTaxNumber(input.taxNumber)
  if (!title) throw new BillingError('抬头必填')
  // 【抬头与税号是硬性必填】导出的 xlsx 里这两列为空，税局会退回整批而不是只退这一行。
  // 旧的 by-order 接口能建出空壳记录，这里不重蹈覆辙。
  if (!taxNumber) throw new BillingError('税号必填')
  if (taxNumber.length > TAX_NUMBER_MAX_LEN) {
    throw new BillingError(`税号去掉空格后为 ${taxNumber.length} 位，超过税务系统允许的 ${TAX_NUMBER_MAX_LEN} 位`)
  }

  // 含税金额 → 不含税售价。税费由减法导出，保证 售价 + 税费 === 开票金额
  const invoiceCents = Math.round(amount * 100)
  const sellCents = Math.round(invoiceCents / (1 + TAX_RATE))
  const issuedAt = new Date()

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNo: genInvoiceNo(),
      externalOrderId: null,
      sourceKey: null,
      // claudeAccount 在 schema 上是 NOT NULL，站外客户没有订阅账户，用邮箱兜底
      claudeAccount: input.account?.trim() || input.email?.trim().toLowerCase() || '站外客户',
      subscriptionType: input.subscriptionType.trim() || '技术咨询服务',
      title,
      taxNumber,
      address: input.address?.trim() || null,
      phone: input.phone?.trim() || null,
      bankName: input.bankName?.trim() || null,
      bankAccount: input.bankAccount?.trim() || null,
      email: input.email?.trim().toLowerCase() || null,
      showAiWording: input.showAiWording,
      sellingPrice: sellCents / 100,
      invoiceAmount: invoiceCents / 100,
      taxFee: (invoiceCents - sellCents) / 100,
      source: 'MANUAL',
      status: input.status,
      // 站外客户的钱是线下收的，对系统而言税费就是已结清；
      // 不这样标的话它进不了批量导出与财务台（两处都要求 payStatus=PAID）
      payStatus: 'PAID',
      paidAt: issuedAt,
      submittedAt: issuedAt,
      issuedAt: input.status === 'ISSUED' ? issuedAt : null,
    },
  })

  return { id: invoice.id, invoiceNo: invoice.invoiceNo }
}
