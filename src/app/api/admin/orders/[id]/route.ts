export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { success, error, notFound } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { settleReferral } from '@/lib/referral'
import { consumeCouponForOrder, releaseCouponForOrder } from '@/lib/coupon'
import { updatePendingVmqAmount, submitInvoiceForPaidOrder, invalidatePendingVmq } from '@/lib/vmq'
import { voidLotteryForOrder } from '@/lib/lottery-server'
import { sendOrderDeliveredEmail } from '@/lib/mail'
import { calcInvoiceAmounts } from '@/lib/invoice'
import { parseOrderInvoiceDraft } from '@/lib/order-invoice'
import { invoicesForOrder, voidOpenInvoicesForOrder } from '@/lib/order-link'
import { cancelActivationForOrder } from '@/lib/sms'

/**
 * 改价的条件更新没抢到：开头读到的「待支付、未取消」在写入前已经变了（买家刚好付款、或超时关单）。
 * 抛出来让整个事务回滚 —— 不能「剥掉改价、照常保存其他字段」，管理员会以为新价生效了。
 * 不导出：route.ts 只能导出 HTTP handler
 */
class OrderStateChangedError extends Error {}

const updateOrderSchema = z.object({
  payStatus: z.enum(['UNPAID', 'PAID', 'REFUNDED']).optional(),
  deliveryStatus: z.enum(['PENDING', 'PROCESSING', 'DELIVERED', 'CANCELLED']).optional(),
  deliveryInfo: z.string().optional().nullable(),
  amount: z.number().positive('金额必须大于0').optional(), // 改价（仅待支付订单）
  // 交付完成时同步导入到「订单（外部订单）」所需的信息
  external: z
    .object({
      subscriptionType: z.string().optional().nullable(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
      xianyuNickname: z.string().optional().nullable(),
      claudeAccount: z.string().email('Claude 账户邮箱格式不正确').optional().nullable(),
    })
    .optional(),
})

function hashKey(claudeAccount: string, startDate: string, subscriptionType: string): string {
  return crypto
    .createHash('sha1')
    .update(`${claudeAccount.toLowerCase()}|${startDate}|${subscriptionType}`)
    .digest('hex')
}

function addOneMonthIso(iso: string): string {
  const [y, m, d] = iso.split('-').map((n) => parseInt(n))
  const dt = new Date(y, m - 1, d)
  dt.setMonth(dt.getMonth() + 1)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

// 更新订单
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 路由内再验一次管理员：这个接口能改价、标已支付、取消、退款，直接动钱，
  // 不能只靠 middleware（CVE-2025-29927，见交接文档第二十三节）
  try {
    await requireAdmin()
  } catch {
    return error('无管理员权限', 403)
  }

  try {
    const { id } = await params
    const orderId = parseInt(id)

    if (isNaN(orderId)) {
      return notFound('订单不存在')
    }

    const body = await request.json()
    const result = updateOrderSchema.safeParse(body)

    if (!result.success) {
      return error(result.error.errors[0].message)
    }

    // 获取当前订单信息，用于判断状态变化
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true, user: true },
    })

    if (!currentOrder) {
      return notFound('订单不存在')
    }

    const { external, amount, ...orderFields } = result.data
    const data: {
      payStatus?: 'UNPAID' | 'PAID' | 'REFUNDED'
      deliveryStatus?: 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'CANCELLED'
      deliveryInfo?: string | null
      deliveredAt?: Date | null
      paidAt?: Date | null
    } = { ...orderFields }

    /*
     * 改价：仅待支付订单可改。
     *
     * 【改价必须同时重算开票税费】买家下单时勾了「同时开发票」的订单，
     * 税费单独记在 order.invoiceTaxFee 上、收银台收的是 amount + invoiceTaxFee。
     * 只改 amount 不改税费的话，下面 updatePendingVmqAmount 会把收款金额刷成纯货款，
     * 买家付了不含税的钱，付款到账后 materializeOrderInvoice 照样开出一张含税发票 ——
     * 等于白送 6%。
     */
    /*
     * 【改价单独放进 priceData，在事务里第一件事用 CAS 写】原来和其他字段一起无条件 update：
     * 开头读到「待支付」、写之前买家恰好按旧价付款（fulfillOrder 已翻成 PAID、流水和发票都按旧价记了），
     * 这里再把 amount / 税费改成新价 —— 一张已付款订单被改了价，订单、流水、发票三边对不上。
     */
    let priceData: { amount: number; invoiceTaxFee?: number; invoiceInfo?: string } | null = null
    if (amount != null) {
      if (currentOrder.payStatus !== 'UNPAID') {
        return error('只有待支付订单可以改价')
      }
      // 已取消（或这次保存就要一并取消）的订单买家已经不能再发起付款，改价没有意义，
      // 只会凭空改动一张作废订单的金额（以及它的开票税费）
      if (currentOrder.deliveryStatus === 'CANCELLED' || result.data.deliveryStatus === 'CANCELLED') {
        return error('已取消的订单不能改价')
      }
      priceData = { amount }
      const draft = parseOrderInvoiceDraft(currentOrder.invoiceInfo)
      if (draft) {
        const { taxFee } = calcInvoiceAmounts(amount)
        priceData.invoiceTaxFee = taxFee
        // 草稿里的 taxFee 只是排查时的对照值，一并刷新避免两个数字打架
        priceData.invoiceInfo = JSON.stringify({ ...draft, taxFee })
      }
    }

    const wasDelivered = currentOrder.deliveryStatus === 'DELIVERED'
    const willBeDelivered = result.data.deliveryStatus === 'DELIVERED'

    // 状态从未交付变为已交付：标记交付时间 + 自动标记支付（销量 / 库存见下方统一规则）
    if (!wasDelivered && willBeDelivered) {
      data.deliveredAt = new Date()
      if (currentOrder.payStatus !== 'PAID') {
        data.payStatus = 'PAID'
        data.paidAt = new Date()
      }
    }

    // 从已交付撤回：清除交付时间（销量 / 库存见下方统一规则）
    if (
      wasDelivered &&
      result.data.deliveryStatus &&
      result.data.deliveryStatus !== 'DELIVERED'
    ) {
      data.deliveredAt = null
    }

    // 手动标记支付状态变更（独立于交付状态）。
    // 判 data.payStatus 而非请求体：上面「标成已交付 → 自动置已支付」那一步写的是 data
    if (data.payStatus === 'PAID' && currentOrder.payStatus !== 'PAID' && !data.paidAt) {
      data.paidAt = new Date()
    }

    /*
     * 【标已支付必须是 CAS】原来是开头读一次 currentOrder.payStatus、隔了好几步才写，
     * 这期间买家的钱恰好到账，fulfillOrder 也把它翻成 PAID 并 sales++，这里再加一次 ——
     * 销量翻倍，券核销、发票落地也各跑两遍。现在「→ PAID」单独用条件更新
     * （where payStatus = 开头读到的值）抢一次，只有抢到的那一方记销量、跑付款副作用；
     * 没抢到（钱已经从支付那条路进来了）就把 payStatus / paidAt 从本次写入里拿掉，
     * 其余字段（交付状态、交付信息等）照常保存。
     */
    const markPaid = data.payStatus === 'PAID' && currentOrder.payStatus !== 'PAID'
    const paidAt = data.paidAt ?? new Date()
    if (markPaid) {
      delete data.payStatus
      delete data.paidAt
    }

    const prevDelivery = currentOrder.deliveryStatus
    const nextDelivery = data.deliveryStatus ?? prevDelivery
    const enteringCancelled = nextDelivery === 'CANCELLED' && prevDelivery !== 'CANCELLED'
    const leavingCancelled = prevDelivery === 'CANCELLED' && nextDelivery !== 'CANCELLED'
    const refunding = data.payStatus === 'REFUNDED' && currentOrder.payStatus !== 'REFUNDED'

    /*
     * 【先关收款通道，再写订单、再放券】取消一张待支付订单时，买家的收银台可能还开着。
     * 原来只放券不关收款单：他照样按优惠价付款 → 到账匹配 → fulfillOrder 把这张
     * 「已取消」的订单翻成已支付并发货，而券已经放回去了，可以再用一次。
     * 作废待支付收款单之后，到账再也匹配不上这一单。退款同理：退了款的订单不该还能收钱。
     * 放在所有写入之前：它失败就整个请求失败（管理员重试即可），不会出现「订单已取消、
     * 收款单却还活着」的半截状态。
     */
    /*
     * 【人工标已支付同样要关收款通道】买家第一次付错了金额（后台「未匹配」能看到）、管理员核实后
     * 手工标成已完成 —— 收银台那张待支付收款单还开着，买家看它还在等，按正确金额又付一次：
     * 到账匹配成功、fulfillOrder 发现订单早已付款就静默返回，第二笔钱没有任何人知道。
     * 作废只动 state=0 的行：恰好正在到账、已翻成 1 的那一张不受影响，走下面 wonPaid=false 的分支。
     */
    if ((enteringCancelled && currentOrder.payStatus === 'UNPAID') || refunding || markPaid) {
      await invalidatePendingVmq('order', orderId)
    }

    /*
     * 销量 / 库存的统一规则（公开展示的销量是真实数字，必须守恒）：
     *
     *  · 销量在「付款」时记一次：付款履约 fulfillOrder 的 UNPAID→PAID 事务里，
     *    或本路由标已支付抢到 CAS 的那一次（从 UNPAID 起算；从 REFUNDED 改回 PAID 不再加，
     *    退款时本来也没减）
     *  · 已交付 ↔ 待处理 / 处理中 来回改：销量、库存都不动。原来撤回「已交付」就减销量，
     *    而再标回已交付时因为已经 PAID 不会加回来 —— 来回点一次销量就永久少一单
     *  · 已付款的订单进入「已取消」（从任何未取消状态）：销量 −数量（条件更新，不减成负数）；
     *    有限库存的非自动发货商品，只有从「已交付」取消时才加回库存（与原逻辑恢复库存的唯一场景一致）
     *  · 已付款且已取消的订单被改出「已取消」：销量 +数量（取消时减掉的加回来）
     *  · 自动发货（AUTO）商品的库存 = 未使用卡密数（lib/cardkey 的 syncAutoStock 维护），
     *    这里一律不碰。原来撤回已交付时对它 stock++，而卡密并没有回到未使用，库存是虚的
     */
    const qty = currentOrder.quantity
    const manualFiniteStock = currentOrder.product.deliveryType !== 'AUTO' && currentOrder.product.stock !== -1
    const paidBefore = currentOrder.payStatus === 'PAID'

    const { order, wonPaid } = await prisma.$transaction(async (tx) => {
      /*
       * 改价 CAS 必须排在「标已支付」那次 CAS 之前：同一次保存可能既改价又标已交付，
       * 「标已交付 → 自动标已支付」先把 payStatus 翻成 PAID 的话，这里就永远抢不到
       */
      if (priceData) {
        const c = await tx.order.updateMany({
          where: { id: orderId, payStatus: 'UNPAID', deliveryStatus: { not: 'CANCELLED' } },
          data: priceData,
        })
        if (c.count !== 1) {
          throw new OrderStateChangedError('订单状态已变化（买家可能刚付款，或订单已超时取消），本次改动未保存，请刷新后重试')
        }
      }

      let wonPaid = false
      if (markPaid) {
        const c = await tx.order.updateMany({
          where: { id: orderId, payStatus: currentOrder.payStatus },
          data: { payStatus: 'PAID', paidAt },
        })
        wonPaid = c.count === 1
      }

      const order = await tx.order.update({ where: { id: orderId }, data })

      let salesDelta = 0
      let stockDelta = 0
      if (wonPaid && currentOrder.payStatus === 'UNPAID') {
        salesDelta += qty
        // 与原逻辑一致：只有「标已交付顺带标已支付」这一步扣有限库存
        if (!wasDelivered && willBeDelivered && manualFiniteStock) stockDelta -= qty
      }
      // 「已付款」同时看写入前后：写入后的 order.payStatus 是本事务写完那一刻的真实状态，
      // 能兜住「开头读到还是 UNPAID、写之前买家的钱刚好到账」—— 那一单 fulfillOrder 已经记过销量
      if (enteringCancelled && (paidBefore || order.payStatus === 'PAID')) {
        salesDelta -= qty
        if (wasDelivered && manualFiniteStock) stockDelta += qty
      }
      if (leavingCancelled && paidBefore && order.payStatus === 'PAID') {
        salesDelta += qty
      }

      if (salesDelta > 0) {
        await tx.product.update({ where: { id: currentOrder.productId }, data: { sales: { increment: salesDelta } } })
      } else if (salesDelta < 0) {
        const dec = await tx.product.updateMany({
          where: { id: currentOrder.productId, sales: { gte: -salesDelta } },
          data: { sales: { decrement: -salesDelta } },
        })
        if (dec.count !== 1) console.warn('[order] 销量不足以扣减，已跳过（历史数据有漂移）', orderId, salesDelta)
      }
      if (stockDelta > 0) {
        await tx.product.update({ where: { id: currentOrder.productId }, data: { stock: { increment: stockDelta } } })
      } else if (stockDelta < 0) {
        // stock = -1 是「不限库存」的哨兵值，扣成负数会让有限库存的商品变成不限量。
        // 不够扣时直接清零（与原来无条件 decrement 的区别只在这一种情况）
        const dec = await tx.product.updateMany({
          where: { id: currentOrder.productId, stock: { gte: -stockDelta } },
          data: { stock: { decrement: -stockDelta } },
        })
        if (dec.count !== 1) {
          await tx.product.updateMany({ where: { id: currentOrder.productId, stock: { gt: 0 } }, data: { stock: 0 } })
        }
      }

      return { order, wonPaid }
    })

    /*
     * 管理员把订单改成已取消 → 把它占用的优惠券放回去。
     *
     * 这是券释放的第三条路径（另两条：超时取消、建单失败回滚）。三条都要有，
     * 少一条的表现是买家的券永远卡在「占用中」，他自己解不开、只能来找客服。
     * releaseCouponForOrder 是幂等的，重复调用不会出错。
     * 待支付收款单已在上面写订单之前作废，这里放券不会再被一笔迟到的付款钻空子；
     * 万一钱在作废之前就已到账，consumeCouponForOrder 的兜底会把放回去的券补核销。
     */
    if (result.data.deliveryStatus === 'CANCELLED' && currentOrder.deliveryStatus !== 'CANCELLED') {
      await releaseCouponForOrder(orderId).catch((e) => console.error('[coupon] 后台取消释放失败', orderId, e))
    }
    /*
     * 人工确认到账的路径（不走 vmq 那条）要核销券、要落地发票。
     *
     * 【判据是本次是否抢到了 → PAID 的 CAS（wonPaid），不是请求体里的 payStatus】
     * 后台订单页的保存按钮只发 deliveryStatus / deliveryInfo / amount / external，
     * **从不发 payStatus**（全仓库没有任何前端发过 payStatus:'PAID'）。
     * 「标成已交付时自动置为已支付」是本路由在上面自己补上的，写在 data 里。
     * 按请求体判的话这个分支在后台 UI 上是死代码 —— 券不核销（旧有问题），
     * 而且买家结账时预付的 6% 永远开不出票：invoices 表没有行、财务台看不到、
     * 买家订单页却因为 invoiceTaxFee 已写入而显示「已提交开票」并隐藏申请入口，
     * 没有任何一方能发现，也没有任何一条路能补救。
     * 没抢到 CAS 通常是钱已经从支付那条路进来了，那边的 fulfillOrder 会做这两件事。
     */
    if (wonPaid) {
      await consumeCouponForOrder(orderId).catch((e) => console.error('[coupon] 后台核销失败', orderId, e))
      // 这条路不经过 fulfillOrder，下单时勾的开票草稿得在这里补一次落地，
      // 否则买家勾了开发票、被后台手工标成已支付，发票就凭空消失了。函数自身幂等
      await submitInvoiceForPaidOrder(orderId).catch((e) =>
        console.error('[invoice] 后台标记已支付后落地发票失败', orderId, e)
      )
    } else if (order.payStatus === 'PAID' && order.invoiceTaxFee != null && order.deliveryStatus !== 'CANCELLED') {
      // 已取消的不补：线下退款后把订单改成「已取消」是常规操作，那时再落地一张「可开具」的发票
      // 并推给财务，等于给退了款的订单开票
      /*
       * 【重新保存 = 重试发票落地】结账时预收了 6%、但履约时发票没能落地的订单
       * （企业微信会推「发票落地失败」，订单详情里也有琥珀色提示），管理员打开订单点一次保存就补上。
       * submitInvoiceForPaidOrder → materializeOrderInvoice 在发票已存在时什么都不做、
       * 并发撞唯一约束也按无事发生处理，所以每次保存都调用是安全的
       */
      await submitInvoiceForPaidOrder(orderId).catch((e) =>
        console.error('[invoice] 重新保存时补落地发票失败', orderId, e)
      )
    }

    /*
     * 已付款的订单被取消（后台没有「退款」按钮，线下退款后通常就是这么操作的）：
     * 这一单抽中的、还没用掉的券作废，未兑现的自定义奖品作废，未抽的资格作废。
     * 买家已经拿回了钱，不该还留着这一单换来的奖。已用掉的券不动（那是另一笔订单的账）。
     * 注意：之后再把订单改回未取消，作废的资格不会恢复 —— 需要的话请人工补发。
     */
    if (enteringCancelled && paidBefore) {
      await voidLotteryForOrder(orderId).catch((e) => console.error('[lottery] 取消已付款订单时作废抽奖失败', orderId, e))
    }

    /*
     * 标成已退款（目前只有直接调接口能做到，后台页面不发 payStatus）：
     * 收回「下单有奖」的资格与未使用的奖品（幂等）。放在写订单之后：之后开始的抽奖会在事务内
     * 复核订单状态而被拒；恰好与这次保存并发、复核读在提交之前的那一次抽奖，
     * 由 voidLotteryForOrder 在 CAS 没抢到时重读、按已抽的路径收回（见该函数注释）。
     * 待支付收款单已在写订单之前作废。
     *
     * 【内推返现此处刻意不冲回】已入推广人余额的返现要不要扣回、怎么扣（余额可能已线下提走），
     * 是待站长拍板的业务问题，不在代码里擅自决定。退款后请人工核对该单的 ReferralReward。
     */
    if (refunding) {
      await voidLotteryForOrder(orderId).catch((e) => console.error('[lottery] 退款作废抽奖失败', orderId, e))
    }

    /** 保存成功后要让管理员知道的事（前端逐条弹出）。任何一条都不影响本次保存本身 */
    const warnings: string[] = []

    /*
     * 【已付款订单被取消 / 标退款 → 状态与权限层面的回滚】（不自动退钱：退款是站长线下操作）
     *  - 卡密：订单页不再显示、站内兑换被拒（读时判断，lib/redeem/service.ts 与 api/orders GET），
     *    撤回取消后自动恢复；这里只提示「上游兑换站是公开的」
     *  - 接码：还在等码的号立刻放掉，迟到的验证码也不会再把订单翻回已交付（lib/sms.ts）
     *  - 发票 / 收据：未开出的发票转「不可开据」，买家侧不能再申请（lib/order-invoice.ts 的闸门）
     *  - 营收统计：仪表盘、最近成交、用户累计付款都排除「已付款 + 已取消」
     *  - 返现：是否扣回待站长拍板（见上面 refunding 那段注释），这里只提示金额
     * 都放在事务之外、各自 try 住：联动失败只记日志加提示，订单本身已经保存成功。
     */
    const voidingPaid = (enteringCancelled && (paidBefore || order.payStatus === 'PAID')) || refunding
    if (voidingPaid) {
      try {
        // 先关税费收款单、再改 CANNOT：fulfillInvoice 只看 payStatus，收款单还开着的话买家一付就被翻回 SUBMITTED
        for (const iv of await invoicesForOrder(orderId)) {
          if (iv.status === 'AWAIT_PAY' && iv.payStatus !== 'PAID') await invalidatePendingVmq('invoice', iv.id)
        }
        const r = await voidOpenInvoicesForOrder(orderId)
        if (r.voided) warnings.push(`已把 ${r.voided} 张未开出的发票改为「不可开据」；如需恢复请到发票管理撤回`)
        if (r.issuedNos.length) warnings.push(`发票 ${r.issuedNos.join('、')} 已开具，需人工红冲`)
      } catch (e) {
        console.error('[invoice] 取消已付订单时作废发票失败', orderId, e)
        warnings.push('作废本单发票失败，请到发票管理手动改为「不可开据」')
      }
      if (currentOrder.product.deliveryType === 'SMS') {
        await cancelActivationForOrder(orderId).catch((e) => console.error('[sms] 取消已付订单时停止接码失败', orderId, e))
      }
      const cards = await prisma.cardKey.count({ where: { orderId, status: 'USED' } }).catch(() => 0)
      if (cards) warnings.push(`本单已发出 ${cards} 张卡密：站内兑换已停用，但上游兑换站是公开的，请核对兑换记录`)
      const rw = await prisma.referralReward.findUnique({ where: { orderId } }).catch(() => null)
      if (rw?.status === 'SETTLED') {
        warnings.push(`本单内推返现 ¥${Number(rw.amount).toFixed(2)} 已入推广人余额，未自动扣回，请人工处理`)
      }
    }
    if (leavingCancelled && order.payStatus === 'PAID') {
      const n = (await invoicesForOrder(orderId).catch(() => [])).filter((iv) => iv.status === 'CANNOT').length
      if (n) warnings.push(`本单有 ${n} 张发票为「不可开据」，若是取消时自动转的，请到发票管理撤回为「已提交」`)
    }

    /*
     * 【收款单金额与订单应收对齐】待支付、未取消订单的收款单金额本来就该等于 amount + invoiceTaxFee
     * （与 api/pay/vmq/create 同一口径）。改价时原地迁移同一张收款单（保持付款链接，收银台轮询自动刷新）。
     * 用事务返回的 order（写入后的真实值）算，并且只在收款单标价与应收不一致时才迁移：
     *  - 普通保存（价格没变）什么都不动 —— reallyPrice 可能带着让位的几分钱，无谓迁移会让买家正在扫的码失效；
     *  - 上次改价时同步失败的，管理员再点一次「保存」就会重试。
     * 同步失败不再吞掉：updatePendingVmqAmount 失败时会作废这张收款单（fail closed），这里提示管理员。
     */
    if (order.payStatus === 'UNPAID' && order.deliveryStatus !== 'CANCELLED') {
      const payable = Math.round((Number(order.amount) + Number(order.invoiceTaxFee ?? 0)) * 100) / 100
      const cents = (v: unknown) => Math.round(Number(v) * 100)
      try {
        const pend = await prisma.vmqOrder.findFirst({
          where: { bizType: 'order', bizId: orderId, state: 0 },
          orderBy: { createdAt: 'desc' },
          select: { price: true },
        })
        let migrated = true
        if (pend && cents(pend.price) !== cents(payable)) {
          migrated = !!(await updatePendingVmqAmount('order', orderId, payable))
        }
        if ((!pend || !migrated) && priceData) {
          // 迁移时已经没有待支付收款单：多半是改价的同一刻买家按旧价付了款
          const paidVmq = await prisma.vmqOrder.findFirst({
            where: { bizType: 'order', bizId: orderId, state: 1 },
            orderBy: { id: 'desc' },
            select: { reallyPrice: true },
          })
          if (paidVmq && cents(paidVmq.reallyPrice) !== cents(payable)) {
            warnings.push(
              `改价保存的同一刻，买家已按收款单金额 ¥${Number(paidVmq.reallyPrice).toFixed(2)} 付款，与新应收 ¥${payable.toFixed(2)} 不一致，请核对差额`
            )
          }
        }
      } catch (e) {
        console.error('[order] 同步收款单金额失败', orderId, e)
        try {
          // updatePendingVmqAmount 失败时自己已经作废过；这里再作废一次兜底（幂等，只动 state=0）
          await invalidatePendingVmq('order', orderId)
          warnings.push('订单已保存，但买家已打开的付款页没能同步成新金额，已将其作废：请让买家回到订单页重新点「去支付」')
        } catch (e2) {
          console.error('[order] 作废旧金额收款单也失败', orderId, e2)
          warnings.push('订单已保存，但买家付款页仍是旧金额且未能作废（数据库异常）。请稍后打开本订单再点一次「保存」，会自动重试同步')
        }
      }
    }

    // 交付状态变为「已完成」时，自动导入到「订单（外部订单）」
    let imported: { externalOrderId: number } | null = null
    if (!wasDelivered && willBeDelivered) {
      const claudeAccount = external?.claudeAccount?.trim().toLowerCase()
      if (claudeAccount) {
        const subscriptionType = (external?.subscriptionType?.trim() || currentOrder.productName).trim()
        const today = new Date()
        const startDate =
          external?.startDate ||
          `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        const expireDate = addOneMonthIso(startDate)
        const xianyuNickname =
          external?.xianyuNickname?.trim() ||
          currentOrder.user.nickname ||
          currentOrder.user.email ||
          null
        const sourceKey = hashKey(claudeAccount, startDate, subscriptionType)
        try {
          const ext = await prisma.externalOrder.upsert({
            where: { sourceKey },
            create: {
              // 指回站内订单：没有它，买家从「邮箱查订阅」点进这一条时
              // 「这单的 6% 结账时已收过」这个事实就查不到，会被收第二次税
              shopOrderId: orderId,
              startDate: new Date(startDate),
              expireDate: new Date(expireDate),
              subscriptionType,
              xianyuNickname,
              claudeAccount,
              // 用改价后的值：currentOrder 是 update 之前读的，同一次保存里既改价又标已完成时它是旧价
              quote: order.amount, // 报价 = 订单金额
              sourceKey,
              importBatch: 'WEB',
            },
            update: {
              startDate: new Date(startDate),
              expireDate: new Date(expireDate),
              subscriptionType,
              xianyuNickname,
              claudeAccount,
              // 用改价后的值：currentOrder 是 update 之前读的，同一次保存里既改价又标已完成时它是旧价
              quote: order.amount,
              shopOrderId: orderId,
              importBatch: 'WEB',
            },
          })
          imported = { externalOrderId: ext.id }
        } catch (e) {
          console.error('Auto-import external order failed:', e)
        }
      }
    }

    // 交付完成 → 结算内推返现（自动进推广人余额，幂等）+ 交付通知邮件
    if (!wasDelivered && willBeDelivered) {
      try {
        await settleReferral(orderId)
      } catch (e) {
        console.error('Settle referral failed:', e)
      }
      if (currentOrder.user.email) {
        try {
          await sendOrderDeliveredEmail(currentOrder.user.email, {
            orderNo: currentOrder.orderNo,
            productName: currentOrder.productName,
            // 用改价后的值：currentOrder 是 update 之前读的
            amount: Number(order.amount),
            invoiceTaxFee: order.invoiceTaxFee == null ? null : Number(order.invoiceTaxFee),
            deliveryInfo: data.deliveryInfo ?? currentOrder.deliveryInfo,
          })
        } catch (e) {
          console.error('Order delivered email failed:', e)
        }
      }
    }

    return success({ ...order, imported, warnings }, '订单更新成功')
  } catch (err) {
    if (err instanceof OrderStateChangedError) return error(err.message, 409)
    console.error('Update order error:', err)
    return error('更新订单失败')
  }
}
