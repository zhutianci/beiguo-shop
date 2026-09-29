/**
 * 迟到付款退入余额（docs/短信接码-设计.md D41、§2.7「迟到付款与重复付款」、§6.6 第 15 条、附录 B 第 21 条）。
 *
 * 【载体单关了就不复活】接码单（SMS_POOL）与充值单（TOPUP）一旦「未付款 + 已取消」就永远不再翻成已付款：
 * fulfillOrder 对它们的付款 CAS 带「未取消」，manualComplete 对它们直接拒绝。关单之后才到、关单瞬间才到、重复付的钱，
 * 一律按**待核实条目里的实收金额**退进买家的**充值格**（流水 LATEPAY，幂等键 latepay:<条目 key>）。
 *
 * 【钱的来路只有「待人工核实的到账」条目】settings 里 vmq_unmatched:* 的一行，每条对应一次到账通知，price 是实收金额。
 * 退入一律以条目为单位（一笔钱一条条目）：同一张收款单被付了三次就是三条条目、三次退入。
 *   · 手动退入：必填支付宝交易号（16–32 位数字），同一事务占 settings(latepay_trade:<交易号>)——挡住「同一笔支付宝交易经两条条目各入一次」；
 *   · 自动退入：同一事务占 settings(latepay_auto:<收款单号>)——同一张收款单只自动退一次（多半是同一笔钱的第二条通知）。
 * 【一次退入的事务】锁条目行 → 条目未处理 → 校验目标订单 → 占位行 → ledger.postInTx(LATEPAY) → 把条目标成已处理
 *   （handledAt / handledBy / handledAs='LATEPAY' / orderId，手动加 tradeNo，自动加 auto:true 与 latepayVmq），同进同退。
 * 【LATEPAY 只有本文件一个写入方】后台「调整」不能记 LATEPAY（adjust.ts 已拒）；W7 每晚核「LATEPAY 流水 ⇔ 已处理条目」。
 * 【读不读 wallet_config】只有自动退入读（latepayAuto；读不到按关闭，fail-closed）；手动退入绝不读——欠买家的钱在任何配置状态下都要能退。
 *
 * 本文件在 lib/wallet 里：不 import lib/vmq（规则 17）。收款单只按表查（vmq_orders），超时与冷却分钟数由调用方（vmq.ts）传入。
 * 新增待核实条目（reconcilePaidVmq 的补记）由 vmq.ts 的 recordCarrierPaid 写（它是 recordUnmatched 的唯一写入口所在），再调这里自动退入。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { notify } from '../notify'
import { writeAudit } from '../audit'
import { postInTx, inMoneyTx, isBizKeyConflict } from './ledger'
import { centsOf, fmtCents } from './buckets'
import { MAX_TOPUP_CENTS, readWalletConfig } from './config'

/** 迟到退入金额上界：单笔充值硬上界 ¥1,000 + 最大识别尾差 49 分（代码常量，不读配置；§2.7） */
export const LATEPAY_MAX_CENTS = MAX_TOPUP_CENTS + 49
/** 支付宝交易号：16–32 位数字（Q15；站长从支付宝账单详情复制「订单号」） */
export const TRADE_NO_RE = /^\d{16,32}$/
export const ENTRY_KEY_RE = /^vmq_unmatched:\d{13}-[0-9a-f]{8}$/
export const TRADE_MARK_PREFIX = 'latepay_trade:'
export const AUTO_MARK_PREFIX = 'latepay_auto:'
const OPEN_MARK = '"handledAt":null'
const CARRIERS = ['SMS_POOL', 'TOPUP']

/** 条目（与 vmq.ts 的 UnmatchedEntry 同形；这里单独声明，免得 lib/wallet 引用 vmq） */
export interface LatepayEntry {
  reason: string
  price: string
  type: number
  cents?: number
  pending?: number[]
  candidates?: string[]
  vmqOrderId?: string
  biz?: string
  outTradeNo?: string
  raw?: string
  repeatForward?: boolean
  at: number
  handledAt?: number | null
  handledBy?: string | number | null
  /** 已处理的方式：LATEPAY（退入余额，只由本文件写）/ OFFLINE（线下已原路退回）/ IGNORE（核实不是新到账） */
  handledAs?: 'LATEPAY' | 'OFFLINE' | 'IGNORE'
  orderId?: number
  tradeNo?: string
  auto?: boolean
  /** 自动退入时归属的收款单号（W7 核 latepay_auto:<它> 恰好一行） */
  latepayVmq?: string
}

export class LatepayError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message)
    this.name = 'LatepayError'
  }
}

// ---------------------------------------------------------------------------
// 纯函数
// ---------------------------------------------------------------------------

/** 条目的实收（分）；不是单个合法金额（如 ambiguous_amount 的「1.00 / 2.00」）返回 null */
export function entryCents(e: Pick<LatepayEntry, 'price'>): number | null {
  try {
    const c = centsOf(String(e.price ?? '').trim())
    return Number.isSafeInteger(c) ? c : null
  } catch {
    return null
  }
}

export function amountInRange(cents: number | null): cents is number {
  return cents != null && cents > 0 && cents <= LATEPAY_MAX_CENTS
}

/** 「biz」「candidates」里带的站内订单 id（order#123） */
export function orderIdsInEntry(e: Pick<LatepayEntry, 'biz' | 'candidates'>): number[] {
  const out = new Set<number>()
  const grab = (s: string | undefined) => {
    for (const m of Array.from(String(s ?? '').matchAll(/order#(\d+)/g))) {
      const id = Number(m[1])
      if (Number.isSafeInteger(id) && id > 0) out.add(id)
    }
  }
  grab(e.biz)
  for (const c of e.candidates ?? []) grab(c)
  return Array.from(out)
}

export interface VmqRowLite {
  id: number
  orderId: string
  bizType: string
  bizId: number
  type: number
  state: number
  reallyCents: number
  createdAt: Date
  /** bizType=order 时该订单的载体信息（没有就 null） */
  order: { carrier: boolean; tenantId: number; payStatus: string; deliveryStatus: string } | null
}

export type UniqueDecision = { ok: true; vmq: VmqRowLite } | { ok: false; why: string }

/**
 * `no_pending_match` 的「数据验证唯一」（§2.7 六个条件，Q14 自动退）。纯函数：rows 是同 type、同金额、
 * createdAt ≤ 到账时刻、且 ≥ 到账时刻 − 24 小时 − 2×(超时+冷却) 的全部收款单（任何 bizType、任何状态）。
 *   ① C：state=−1、同 type、reallyPrice=条目金额，C 的订单是主站 SMS_POOL / TOPUP 且 UNPAID + CANCELLED；
 *   ② 冷却开着（cooldownMin>0），且 到账时刻 ≤ C.createdAt + 超时 + 冷却；
 *   ③ [C.createdAt − (超时+冷却), 到账时刻] 内同 type 同金额的收款单（任何 bizType、任何状态）恰好只有 C；
 *   ④ 近 24 小时内没有**别的**同额、已关闭（−1）的收款单；
 *   ⑤ 条目不是 repeatForward；
 *   ⑥ latepay_auto:<C 的收款单号> 抢占成功（在退入事务里做，不在这里）。
 */
export function decideUniqueClosed(
  entry: { cents: number; type: number; at: number; repeatForward?: boolean },
  rows: VmqRowLite[],
  ctx: { timeoutMin: number; cooldownMin: number },
): UniqueDecision {
  // 先认候选 C（①②）：没有候选 = 这笔钱和任何关闭的载体单都对不上（普通到账，与本模块无关）
  const W = (ctx.timeoutMin + Math.max(0, ctx.cooldownMin)) * 60_000
  const same = rows.filter((r) => r.type === entry.type && r.reallyCents === entry.cents && r.createdAt.getTime() <= entry.at)
  const cands = same.filter(
    (r) =>
      r.state === -1 &&
      r.bizType === 'order' &&
      r.order != null &&
      r.order.carrier &&
      r.order.tenantId === 1 &&
      r.order.payStatus === 'UNPAID' &&
      r.order.deliveryStatus === 'CANCELLED' &&
      entry.at <= r.createdAt.getTime() + W,
  )
  if (cands.length === 0) return { ok: false, why: 'NO_CANDIDATE' }
  // ② 冷却是回滚开关：关着时同金额可能被马上分给别人，「只分给过 C」无从验证
  if (!(ctx.cooldownMin > 0)) return { ok: false, why: 'COOLDOWN_OFF' }
  // ⑤ 重复转发不自动退
  if (entry.repeatForward) return { ok: false, why: 'REPEAT_FORWARD' }
  if (cands.length > 1) return { ok: false, why: 'MULTIPLE_CANDIDATES' }
  const c = cands[0]
  const inWindow = same.filter((r) => r.createdAt.getTime() >= c.createdAt.getTime() - W && r.createdAt.getTime() <= entry.at)
  if (inWindow.length !== 1 || inWindow[0].id !== c.id) return { ok: false, why: 'WINDOW_NOT_UNIQUE' }
  const since24 = entry.at - 24 * 3600_000
  const otherClosed = same.filter((r) => r.id !== c.id && r.state === -1 && r.createdAt.getTime() >= since24)
  if (otherClosed.length) return { ok: false, why: 'OTHER_CLOSED_24H' }
  return { ok: true, vmq: c }
}

// ---------------------------------------------------------------------------
// 读库帮手
// ---------------------------------------------------------------------------

type Db = Prisma.TransactionClient | typeof prisma

export async function readEntry(key: string, db: Db = prisma): Promise<LatepayEntry | null> {
  if (!ENTRY_KEY_RE.test(key)) return null
  const row = await db.setting.findUnique({ where: { key } })
  if (!row) return null
  try {
    return JSON.parse(row.value) as LatepayEntry
  } catch {
    return null
  }
}

interface CarrierOrder {
  id: number
  orderNo: string
  userId: number
  tenantId: number
  payStatus: string
  deliveryStatus: string
  deliveryType: string
  amountCents: number
  carrier: boolean
}

async function orderInfo(db: Db, where: { id: number } | { orderNo: string }): Promise<CarrierOrder | null> {
  const o = await db.order.findUnique({
    where,
    select: { id: true, orderNo: true, userId: true, tenantId: true, payStatus: true, deliveryStatus: true, amount: true, product: { select: { deliveryType: true } } },
  })
  if (!o) return null
  return {
    id: o.id,
    orderNo: o.orderNo,
    userId: o.userId,
    tenantId: o.tenantId,
    payStatus: o.payStatus,
    deliveryStatus: o.deliveryStatus,
    deliveryType: o.product.deliveryType,
    amountCents: centsOf(o.amount),
    carrier: CARRIERS.includes(o.product.deliveryType),
  }
}

/** 这张收款单是不是该订单的付款凭证（订单的 ALIPAY 支付流水 tradeNo = 收款单号） */
async function isVoucher(db: Db, orderId: number, vmqOrderNo: string): Promise<boolean> {
  return (await db.payment.count({ where: { orderId, payMethod: 'ALIPAY', tradeNo: vmqOrderNo } })) > 0
}

async function vmqByNo(db: Db, vmqOrderNo: string | undefined) {
  if (!vmqOrderNo) return null
  return db.vmqOrder.findUnique({ where: { orderId: vmqOrderNo }, select: { id: true, orderId: true, bizType: true, bizId: true, state: true, reallyPrice: true, type: true } })
}

// ---------------------------------------------------------------------------
// 一次退入的事务
// ---------------------------------------------------------------------------

export interface CreditInput {
  key: string
  orderId: number
  mode: 'AUTO' | 'MANUAL'
  /** MANUAL 必填 */
  tradeNo?: string
  /** AUTO 必填：归属的收款单号 */
  autoVmqOrderNo?: string
  handledBy: string | number
  now?: Date
}

/**
 * 锁条目行 → 未处理 → 金额 → 目标是主站载体单 → 占位行 → postInTx(LATEPAY) → 条目标已处理（同一事务）。
 * 目标订单的「按原因」校验由调用方在同一事务里、调本函数之前做（autoCreditIfCarrier / manualCredit）。
 */
export async function creditInTx(tx: Prisma.TransactionClient, p: CreditInput): Promise<{ cents: number; logId: number; userId: number; entry: LatepayEntry; order: CarrierOrder }> {
  if (!ENTRY_KEY_RE.test(p.key)) throw new LatepayError('ENTRY_NOT_FOUND', '待核实条目不存在', 404)
  const rows = await tx.$queryRaw<{ value: string }[]>`SELECT value FROM settings WHERE \`key\` = ${p.key} FOR UPDATE`
  if (!rows[0]) throw new LatepayError('ENTRY_NOT_FOUND', '待核实条目不存在', 404)
  let entry: LatepayEntry
  try {
    entry = JSON.parse(rows[0].value) as LatepayEntry
  } catch {
    throw new LatepayError('ENTRY_BROKEN', '待核实条目已损坏', 409)
  }
  if (entry.handledAt) throw new LatepayError('ALREADY_HANDLED', '这条到账已经处理过了', 409)
  const cents = entryCents(entry)
  if (!amountInRange(cents)) throw new LatepayError('BAD_AMOUNT', `条目金额不合法（须大于 0 且不超过 ${fmtCents(LATEPAY_MAX_CENTS)}）`)
  // 【锁顺序：订单 → 用户】（S2b 评审修复）先共享锁住订单行，再由 postInTx 锁用户行。下面接码单的客服留言（order_messages 外键指向 orders）
  // 会给订单行加共享锁：放在 postInTx（已持有 users 行 X 锁）之后才拿，就成了「用户 → 订单」，与 T15 / T16 的「订单 X → 预扣 → 用户」
  // 反向，同一张单并发退款与迟到退入时会死锁（MySQL 回滚其中一个：自动退入转人工告警、或 T15 重试）。
  await tx.$queryRaw`SELECT id FROM orders WHERE id = ${p.orderId} LOCK IN SHARE MODE`
  const order = await orderInfo(tx, { id: p.orderId })
  if (!order) throw new LatepayError('ORDER_NOT_FOUND', '订单不存在', 404)
  if (!order.carrier || order.tenantId !== 1) throw new LatepayError('NOT_CARRIER', '只能退入主站的短信接码单或余额充值单')

  if (p.mode === 'MANUAL') {
    if (!p.tradeNo || !TRADE_NO_RE.test(p.tradeNo)) throw new LatepayError('TRADE_NO', '请填写支付宝交易号（16–32 位数字）')
    try {
      await tx.setting.create({ data: { key: `${TRADE_MARK_PREFIX}${p.tradeNo}`, value: p.key } })
    } catch (e) {
      if ((e as { code?: string })?.code === 'P2002') throw new LatepayError('TRADE_USED', '这个支付宝交易号已经退入过', 409)
      throw e
    }
  } else {
    const mark = `${AUTO_MARK_PREFIX}${p.autoVmqOrderNo ?? ''}`
    if (!p.autoVmqOrderNo || mark.length > 50) throw new LatepayError('AUTO_MARK', '自动退入缺少收款单号')
    try {
      await tx.setting.create({ data: { key: mark, value: p.key } })
    } catch (e) {
      if ((e as { code?: string })?.code === 'P2002') throw new LatepayError('AUTO_USED', '这张收款单的钱已经自动退过一次', 409)
      throw e
    }
  }

  const note = p.mode === 'MANUAL' ? `迟到付款退入（手动，交易号 ${p.tradeNo}，条目 ${p.key}）` : `迟到付款退入（自动，收款单 ${p.autoVmqOrderNo}，条目 ${p.key}）`
  let logId: number
  try {
    logId = (
      await postInTx(tx, {
        userId: order.userId,
        topupDeltaCents: cents,
        type: 'LATEPAY',
        bizKey: `latepay:${p.key}`,
        orderId: order.id,
        note: note.slice(0, 255),
      })
    ).logId
  } catch (e) {
    if (isBizKeyConflict(e)) throw new LatepayError('ALREADY_HANDLED', '这条到账已经退入过了', 409)
    throw e
  }
  const next: LatepayEntry = {
    ...entry,
    handledAt: (p.now ?? new Date()).getTime(),
    handledBy: p.handledBy,
    handledAs: 'LATEPAY',
    orderId: order.id,
    ...(p.mode === 'MANUAL' ? { tradeNo: p.tradeNo } : { auto: true, latepayVmq: p.autoVmqOrderNo }),
  }
  await tx.setting.update({ where: { key: p.key }, data: { value: JSON.stringify(next) } })
  // 接码单：同一事务写一条客服留言（§1.9、§2.7、§6.6 第 15、29 条；号码页横幅之外，订单留言里也能看到、红点提醒）。
  // 充值单不写：充值单不进「我的订单」，没有地方能读那条留言，只会在页头留下一个清不掉的红点（改在钱包页横幅告诉买家）。
  // 与退入同一事务：退入回滚则留言不在，退入成功则恰好一条（入账键 latepay:<条目> 唯一，重放走不到这里）。
  if (order.deliveryType === 'SMS_POOL') {
    await tx.orderMessage.create({
      data: {
        orderId: order.id,
        sender: 'ADMIN',
        content: latepayMessageText(cents, order.payStatus === 'UNPAID' && order.deliveryStatus === 'CANCELLED'),
        readByAdmin: true,
        readByBuyer: false,
        senderRole: 'PLATFORM',
      },
    })
  }
  return { cents, logId, userId: order.userId, entry: next, order }
}

/**
 * 迟到付款退入后写给接码单买家的留言（附录 A 的 LATEPAY 两行）。纯函数：
 *  · 订单已关闭（未付款 + 已取消）→「这张订单关闭后收到一笔 ¥x 付款，已退回你的余额，可用于下次购物抵扣」；
 *  · 其余（已付款的单又收到一笔）→「这张订单收到一笔重复付款 ¥x，已退回你的余额，可用于下次购物抵扣」。
 * 与号码页 lateCredits 的 LATE / DUPLICATE 判定同一口径（view.ts：UNPAID + CANCELLED = LATE）。
 */
export function latepayMessageText(cents: number, closed: boolean): string {
  return closed
    ? `这张订单关闭后收到一笔 ${fmtCents(cents)} 付款，已退回你的余额，可用于下次购物抵扣。`
    : `这张订单收到一笔重复付款 ${fmtCents(cents)}，已退回你的余额，可用于下次购物抵扣。`
}

// ---------------------------------------------------------------------------
// 自动退入（到账路径 markPaidByAmount、对账补记之后调；任何一步失败只告警，条目原样留给站长）
// ---------------------------------------------------------------------------

export type AutoOutcome = { credited: true; cents: number; orderNo: string } | { credited: false; why: string }

const AUTO_REASONS = new Set(['closed_while_matching', 'duplicate_payment', 'no_pending_match'])

function alertLatepay(title: string, rows: { label: string; value: string; color?: 'warning' | 'info' | 'comment' }[]) {
  notify('wallet.alert', rows, { link: '/admin/vmq', extraTitle: title })
}

/**
 * 条目涉及主站载体单、而且满足自动条件时，自动退进买家的充值格。不是载体单的条目什么都不做（返回 NOT_CARRIER）。
 * 永不抛异常（到账 webhook 路径不能因为它 500）。
 */
export async function autoCreditIfCarrier(key: string | null, ctx: { timeoutMin: number; cooldownMin: number; now?: Date }): Promise<AutoOutcome> {
  if (!key) return { credited: false, why: 'NO_KEY' }
  try {
    const entry = await readEntry(key)
    if (!entry || entry.handledAt) return { credited: false, why: 'NOT_OPEN' }
    if (!AUTO_REASONS.has(entry.reason)) return { credited: false, why: 'REASON' }
    const cents = entryCents(entry)
    if (!amountInRange(cents)) return { credited: false, why: 'BAD_AMOUNT' }

    // 先认出归属（不是载体单就直接返回，不读配置）
    const leave = (why: string, text: string): AutoOutcome => {
      console.warn(`[wallet] 迟到到账 ${key} 涉及载体单但不自动退（${why}），留给站长`)
      alertLatepay('迟到付款待核实', [
        { label: '到账', value: `${fmtCents(cents)}（${text}）`, color: 'warning' },
        { label: '处理', value: '核对支付宝账单后，在「收款监控 → 待核实」用「退入买家余额」（填支付宝交易号）' },
      ])
      return { credited: false, why }
    }

    let vmqNo: string
    let orderId: number
    if (entry.reason === 'no_pending_match') {
      const decision = await uniqueClosedFor(entry, cents, ctx)
      if (!decision.ok) {
        // 没有候选 = 普通到账（不涉及载体单），照旧只留给站长（recordUnmatched 已推过「待核实」）
        if (decision.why === 'NO_CANDIDATE') return { credited: false, why: decision.why }
        return leave(
          decision.why,
          decision.why === 'REPEAT_FORWARD' ? '疑似重复转发' : decision.why === 'TOO_MANY_ROWS' ? '同金额收款单过多，无法验证唯一归属' : '按收款单表不能确定唯一归属',
        )
      }
      vmqNo = decision.vmq.orderId
      orderId = decision.vmq.bizId
    } else {
      const v = await vmqByNo(prisma, entry.vmqOrderId)
      if (!v || v.bizType !== 'order') return { credited: false, why: 'NO_VMQ' }
      const o = await orderInfo(prisma, { id: v.bizId })
      if (!o || !o.carrier || o.tenantId !== 1) return { credited: false, why: 'NOT_CARRIER' }
      vmqNo = v.orderId
      orderId = o.id
      if (entry.repeatForward) return leave('REPEAT_FORWARD', '疑似重复转发')
    }

    const cfg = await readWalletConfig()
    if (!cfg.ok || !cfg.config.latepayAuto) return leave(cfg.ok ? 'AUTO_OFF' : 'CONFIG_BROKEN', cfg.ok ? '自动退入已关闭' : '余额配置读取失败，自动退入按关闭处理')

    const r = await inMoneyTx(async (tx) => {
      // closed_while_matching / duplicate_payment：这张收款单不能是订单的付款凭证（否则多半是同一笔钱的重复通知）
      if (entry.reason !== 'no_pending_match' && (await isVoucher(tx, orderId!, vmqNo!))) {
        throw new LatepayError('VOUCHER', '这张收款单正是订单的付款凭证，不自动退')
      }
      return creditInTx(tx, { key, orderId: orderId!, mode: 'AUTO', autoVmqOrderNo: vmqNo!, handledBy: 'auto', now: ctx.now })
    })
    alertLatepay('迟到付款已自动退入', [
      { label: '级别', value: '已自动处理（只做知会）', color: 'info' },
      { label: '订单', value: `${r.order.orderNo}（${r.order.deliveryType === 'TOPUP' ? '余额充值' : '短信接码'}）` },
      { label: '退入充值余额', value: fmtCents(r.cents) },
      { label: '原因', value: entry.reason },
    ])
    return { credited: true, cents: r.cents, orderNo: r.order.orderNo }
  } catch (e) {
    const why = e instanceof LatepayError ? e.code : 'ERROR'
    if (why !== 'ALREADY_HANDLED') {
      console.error('[wallet] 迟到付款自动退入失败，条目留给站长', key, e)
      alertLatepay('迟到付款自动退入未完成', [
        { label: '条目', value: key, color: 'warning' },
        { label: '原因', value: e instanceof Error ? e.message.slice(0, 160) : String(e) },
        { label: '处理', value: '到「收款监控 → 待核实」核对支付宝账单后用「退入买家余额」' },
      ])
    }
    return { credited: false, why }
  }
}

/**
 * 「数据验证唯一」一次最多看多少张收款单（每个时间窗）。超过就不判、留给站长（宁可人工，§2.7）。
 * 【B1 评审修复】原来是一个 24h+2W 的窗口 take:500 且不排序：同额收款单超过 500 张时截到的是任意 500 行，
 * 可能恰好漏掉违反 ③ / ④ 的那几行，把别人的钱判成「唯一」自动退掉。
 */
export const UNIQUE_SCAN_LIMIT = 500

/**
 * 读出做「数据验证唯一」需要的收款单与它们的订单。分两个窗口、各自按时间倒序取、超过上限就返回 TOO_MANY_ROWS（不在残缺数据上判）：
 *   · 近窗 [到账 − 2W, 到账]，任何状态：① 候选 C（C.createdAt ≥ 到账 − W）与 ③（[C.createdAt − W, 到账] ⊂ 近窗）只看这里；
 *   · 24 小时内已关闭（−1）的：④ 只看这里。
 * decideUniqueClosed 用到的每一行都在两个窗口之一里，所以两窗之并对它来说是完整的。
 */
async function uniqueClosedFor(entry: LatepayEntry, cents: number, ctx: { timeoutMin: number; cooldownMin: number }): Promise<UniqueDecision> {
  const W = (ctx.timeoutMin + Math.max(0, ctx.cooldownMin)) * 60_000
  const at = new Date(entry.at)
  const price = new Prisma.Decimal((cents / 100).toFixed(2))
  const select = { id: true, orderId: true, bizType: true, bizId: true, type: true, state: true, reallyPrice: true, createdAt: true } as const
  const [near, closed24] = await Promise.all([
    prisma.vmqOrder.findMany({
      where: { type: entry.type, reallyPrice: price, createdAt: { gte: new Date(entry.at - 2 * W), lte: at } },
      select,
      orderBy: { createdAt: 'desc' },
      take: UNIQUE_SCAN_LIMIT + 1,
    }),
    prisma.vmqOrder.findMany({
      where: { type: entry.type, reallyPrice: price, state: -1, createdAt: { gte: new Date(entry.at - 24 * 3600_000), lte: at } },
      select,
      orderBy: { createdAt: 'desc' },
      take: UNIQUE_SCAN_LIMIT + 1,
    }),
  ])
  // 近窗都装不下：连候选都认不全，不判
  if (near.length > UNIQUE_SCAN_LIMIT) return { ok: false, why: 'TOO_MANY_ROWS' }
  const byId = new Map<number, (typeof near)[number]>()
  for (const v of [...near, ...closed24]) byId.set(v.id, v)
  const vs = Array.from(byId.values())
  const oids = Array.from(new Set(vs.filter((v) => v.bizType === 'order').map((v) => v.bizId)))
  const os = oids.length
    ? await prisma.order.findMany({ where: { id: { in: oids } }, select: { id: true, tenantId: true, payStatus: true, deliveryStatus: true, product: { select: { deliveryType: true } } } })
    : []
  const om = new Map(os.map((o) => [o.id, o]))
  const rows: VmqRowLite[] = vs.map((v) => {
    const o = v.bizType === 'order' ? om.get(v.bizId) : undefined
    return {
      id: v.id,
      orderId: v.orderId,
      bizType: v.bizType,
      bizId: v.bizId,
      type: v.type,
      state: v.state,
      reallyCents: centsOf(v.reallyPrice),
      createdAt: v.createdAt,
      order: o ? { carrier: CARRIERS.includes(o.product.deliveryType), tenantId: o.tenantId, payStatus: o.payStatus, deliveryStatus: o.deliveryStatus } : null,
    }
  })
  const arg = { cents, type: entry.type, at: entry.at, repeatForward: entry.repeatForward }
  // 候选只可能在近窗里：近窗认不出候选 = 普通到账（NO_CANDIDATE，安静返回），不因为 24h 窗口装不下而误报「涉及载体单」
  const nearIds = new Set(near.map((v) => v.id))
  const first = decideUniqueClosed(arg, rows.filter((r) => nearIds.has(r.id)), ctx)
  if (!first.ok && first.why === 'NO_CANDIDATE') return first
  // ④ 要完整的 24h 已关闭列表：装不下就不判
  if (closed24.length > UNIQUE_SCAN_LIMIT) return { ok: false, why: 'TOO_MANY_ROWS' }
  return decideUniqueClosed(arg, rows, ctx)
}

// ---------------------------------------------------------------------------
// 手动退入（后台 /admin/vmq 待核实列表的「退入买家余额」）
// ---------------------------------------------------------------------------

export interface ManualInput {
  key: string
  orderNo: string
  tradeNo: string
  confirmMismatch?: boolean
  confirmBillChecked?: boolean
  adminId: number | null
  req?: Request
}

/**
 * 按条目原因校验目标订单（§2.7「目标订单的校验」），通过后同一事务退入并写审计。
 *   · 共同：主站 SMS_POOL / TOPUP；金额 0 < x ≤ ¥1,000.49；条目金额与目标订单任何一张收款单都对不上 → 要 confirmMismatch；
 *     目标订单已有过 LATEPAY → 要 confirmBillChecked；
 *   · closed_while_matching / duplicate_payment：目标只能是条目上那张收款单的订单（不能改指）；订单 UNPAID+CANCELLED 或这张收款单不是它的付款凭证；
 *   · maybe_duplicate：提示的订单任何付款状态都行；改指到别的载体单要 confirmMismatch；一律要 confirmBillChecked；
 *   · repeatForward：在上面之外一律要 confirmBillChecked；
 *   · 其余（no_pending_match、ambiguous_* 等）：任一主站载体单。
 * 手动退入一律必填交易号（Q15），同一事务占 latepay_trade:<交易号>。不读 wallet_config。
 */
export async function manualCredit(p: ManualInput): Promise<{ cents: number; orderNo: string; logId: number }> {
  const tradeNo = String(p.tradeNo ?? '').trim()
  if (!TRADE_NO_RE.test(tradeNo)) throw new LatepayError('TRADE_NO', '请填写支付宝交易号（16–32 位数字，支付宝账单详情里的「订单号」）')
  if (!ENTRY_KEY_RE.test(p.key)) throw new LatepayError('ENTRY_NOT_FOUND', '待核实条目不存在', 404)
  const target0 = await orderInfo(prisma, { orderNo: String(p.orderNo ?? '').trim() })
  if (!target0) throw new LatepayError('ORDER_NOT_FOUND', '订单不存在', 404)

  return inMoneyTx(async (tx) => {
    // 条目行先锁住（creditInTx 里会再锁一次，是重入），校验与退入在同一把锁里
    const locked = await tx.$queryRaw<{ value: string }[]>`SELECT value FROM settings WHERE \`key\` = ${p.key} FOR UPDATE`
    if (!locked[0]) throw new LatepayError('ENTRY_NOT_FOUND', '待核实条目不存在', 404)
    let entry: LatepayEntry
    try {
      entry = JSON.parse(locked[0].value) as LatepayEntry
    } catch {
      throw new LatepayError('ENTRY_BROKEN', '待核实条目已损坏', 409)
    }
    if (entry.handledAt) throw new LatepayError('ALREADY_HANDLED', '这条到账已经处理过了', 409)
    const cents = entryCents(entry)
    if (!amountInRange(cents)) throw new LatepayError('BAD_AMOUNT', `条目金额不合法（须大于 0 且不超过 ${fmtCents(LATEPAY_MAX_CENTS)}）`)
    const target = await orderInfo(tx, { id: target0.id })
    if (!target || !target.carrier || target.tenantId !== 1) throw new LatepayError('NOT_CARRIER', '只能退入主站的短信接码单或余额充值单')

    const hintVmq = await vmqByNo(tx, entry.vmqOrderId)
    const hintOrderId = hintVmq && hintVmq.bizType === 'order' ? hintVmq.bizId : null
    if (entry.reason === 'closed_while_matching' || entry.reason === 'duplicate_payment') {
      if (!hintVmq || hintOrderId !== target.id) throw new LatepayError('CANNOT_RETARGET', '这类条目的钱确定属于条目上那张收款单的订单，不能改指到别的订单')
      const closed = target.payStatus === 'UNPAID' && target.deliveryStatus === 'CANCELLED'
      if (!closed && (await isVoucher(tx, target.id, hintVmq.orderId))) {
        throw new LatepayError('VOUCHER', '这张收款单正是订单的付款凭证（钱已经让订单付过款），不能再退入')
      }
    } else if (entry.reason === 'maybe_duplicate') {
      if (!p.confirmBillChecked) throw new LatepayError('NEED_BILL_CHECKED', '可能重复的到账：请先核对支付宝账单，确实收到这一笔再勾「已核对账单」')
      if (hintOrderId !== target.id && !p.confirmMismatch) throw new LatepayError('NEED_MISMATCH', '目标订单不是条目提示的那张，改指需要勾「金额 / 订单不一致，确认是该买家付的」')
    }
    if (entry.repeatForward && !p.confirmBillChecked) throw new LatepayError('NEED_BILL_CHECKED', '这条疑似重复转发：请核对支付宝账单确有两笔，再勾「已核对账单」')

    // 金额与目标订单任何一张收款单都对不上（买家手输错）→ 要二次确认
    const vs = await tx.vmqOrder.findMany({ where: { bizType: 'order', bizId: target.id }, select: { reallyPrice: true } })
    const matches = vs.some((v) => centsOf(v.reallyPrice) === cents)
    if (!matches && !p.confirmMismatch) throw new LatepayError('NEED_MISMATCH', `条目金额 ${fmtCents(cents)} 与这张订单的任何一张收款单都对不上，确认是该买家付的请勾「金额不一致」`)
    // 目标订单已退入过 → 要核对账单（防止把已自动退过的那笔钱的第二条通知再退一次）
    const prior = await tx.balanceLog.count({ where: { type: 'LATEPAY', orderId: target.id } })
    if (prior > 0 && !p.confirmBillChecked) throw new LatepayError('NEED_BILL_CHECKED', `这张订单已经退入过 ${prior} 笔，请核对支付宝账单后勾「已核对账单」`)

    const r = await creditInTx(tx, { key: p.key, orderId: target.id, mode: 'MANUAL', tradeNo, handledBy: p.adminId ?? 'admin' })
    await writeAudit(tx, {
      actorUserId: p.adminId,
      actorKind: 'PLATFORM',
      action: 'wallet.latepay',
      targetType: 'order',
      targetId: target.orderNo,
      diff: {
        key: p.key,
        reason: entry.reason,
        cents,
        tradeNo,
        userId: target.userId,
        orderType: target.deliveryType,
        confirmMismatch: !!p.confirmMismatch,
        confirmBillChecked: !!p.confirmBillChecked,
        repeatForward: !!entry.repeatForward,
        logId: r.logId,
      },
      req: p.req,
    })
    return { cents: r.cents, orderNo: target.orderNo, logId: r.logId }
  })
}

// ---------------------------------------------------------------------------
// 后台：候选订单、条目是否涉及载体单、迟到付款看板
// ---------------------------------------------------------------------------

/** 目标订单此前的一笔 LATEPAY 退入（「退入买家余额」弹窗逐笔列出，§2.7「再退一笔必须勾 confirmBillChecked，页面同时列出之前那几笔」） */
export interface PriorLatepay {
  logId: number
  cents: number
  at: string
  entryKey: string
  reason: string | null
  auto: boolean
  tradeNo: string | null
  vmqOrderNo: string | null
}

export interface LatepayCandidate {
  orderNo: string
  orderId: number
  deliveryType: string
  payStatus: string
  deliveryStatus: string
  closed: boolean
  amountCents: number
  vmqOrderNo: string
  vmqState: number
  vmqCreatedAt: string
  userId: number
  userEmail: string | null
  priorLatepay: number
  /** 之前那几笔（新的在前，每单最多 PRIOR_LIST_MAX 笔；条数以 priorLatepay 为准） */
  priorList: PriorLatepay[]
  /** 条目上提示的那张（closed_while_matching / duplicate_payment / maybe_duplicate 的 vmqOrderId） */
  hinted: boolean
}

const PRIOR_LIST_MAX = 20

/** 这些订单已有的 LATEPAY 退入：条数（精确）与逐笔明细（金额、时间、条目、自动 / 手动与交易号） */
async function priorLatepayOf(orderIds: number[]): Promise<{ count: Map<number, number>; list: Map<number, PriorLatepay[]> }> {
  const count = new Map<number, number>()
  const list = new Map<number, PriorLatepay[]>()
  if (!orderIds.length) return { count, list }
  const [groups, logs] = await Promise.all([
    prisma.balanceLog.groupBy({ by: ['orderId'], where: { type: 'LATEPAY', orderId: { in: orderIds } }, _count: { _all: true } }),
    prisma.balanceLog.findMany({
      where: { type: 'LATEPAY', orderId: { in: orderIds } },
      orderBy: { id: 'desc' },
      take: PRIOR_LIST_MAX * orderIds.length,
      select: { id: true, orderId: true, topupDeltaCents: true, bizKey: true, createdAt: true },
    }),
  ])
  for (const g of groups) if (g.orderId != null) count.set(g.orderId, g._count._all)
  const keyOf = (bizKey: string | null) => (bizKey ?? '').replace(/^latepay:/, '')
  const keys = logs.map((l) => keyOf(l.bizKey)).filter((k) => ENTRY_KEY_RE.test(k))
  const rows = keys.length ? await prisma.setting.findMany({ where: { key: { in: keys } }, select: { key: true, value: true } }) : []
  const em = new Map<string, LatepayEntry | null>()
  for (const r of rows) {
    try {
      em.set(r.key, JSON.parse(r.value) as LatepayEntry)
    } catch {
      em.set(r.key, null)
    }
  }
  for (const l of logs) {
    if (l.orderId == null) continue
    const arr = list.get(l.orderId) ?? []
    if (arr.length >= PRIOR_LIST_MAX) continue
    const key = keyOf(l.bizKey)
    const e = em.get(key) ?? null
    arr.push({
      logId: l.id,
      cents: l.topupDeltaCents,
      at: l.createdAt.toISOString(),
      entryKey: key,
      reason: e?.reason ?? null,
      auto: !!e?.auto,
      tradeNo: e?.tradeNo ?? null,
      vmqOrderNo: e?.latepayVmq ?? e?.vmqOrderId ?? null,
    })
    list.set(l.orderId, arr)
  }
  return { count, list }
}

/** 近 24 小时内（到 at + 1 分钟）、同 type、同额、属于主站载体单的收款单（SQL 里直接连订单与商品过滤，不先取同额再筛） */
async function carrierVmqsNear(type: number, cents: number, at: number, limit: number) {
  const rows = await prisma.$queryRaw<{ id: number; orderId: string; bizId: number; state: number; createdAt: Date }[]>`
    SELECT v.id AS id, v.order_id AS orderId, v.biz_id AS bizId, v.state AS state, v.created_at AS createdAt
      FROM vmq_orders v JOIN orders o ON o.id = v.biz_id JOIN products p ON p.id = o.product_id
     WHERE v.biz_type = 'order' AND o.tenant_id = 1 AND p.delivery_type IN ('SMS_POOL', 'TOPUP')
       AND v.type = ${type} AND v.really_price = ${new Prisma.Decimal((cents / 100).toFixed(2))}
       AND v.created_at >= ${new Date(at - 24 * 3600_000)} AND v.created_at <= ${new Date(at + 60_000)}
     ORDER BY v.created_at DESC
     LIMIT ${limit}`
  return rows.map((r) => ({ id: Number(r.id), orderId: String(r.orderId), bizType: 'order', bizId: Number(r.bizId), state: Number(r.state), createdAt: new Date(r.createdAt) }))
}

/**
 * 候选订单（§2.7）：近 24 小时内、reallyPrice 等于条目金额的 SMS_POOL / TOPUP 收款单对应的订单（已关闭的排在前面），
 * 外加条目上提示的那张收款单的订单。已关闭的恰好 1 个时 suggest 指向它（后台高亮「建议」）。每个候选带上之前的 LATEPAY 逐笔明细。
 * （原来先取「同额的任何收款单」最新 50 张再筛载体单：同额普通订单多时候选会被挤掉；现在 SQL 里只取主站载体单的。）
 */
export async function latepayCandidates(entry: LatepayEntry): Promise<{ list: LatepayCandidate[]; suggest: string | null }> {
  const cents = entryCents(entry)
  const vmqs: { id: number; orderId: string; bizType: string; bizId: number; state: number; createdAt: Date }[] = []
  if (amountInRange(cents)) vmqs.push(...(await carrierVmqsNear(entry.type, cents, entry.at, 50)))
  const hint = await vmqByNo(prisma, entry.vmqOrderId)
  if (hint && hint.bizType === 'order' && !vmqs.some((v) => v.orderId === hint.orderId)) {
    const full = await prisma.vmqOrder.findUnique({ where: { id: hint.id }, select: { id: true, orderId: true, bizType: true, bizId: true, state: true, createdAt: true } })
    if (full) vmqs.unshift(full)
  }
  if (!vmqs.length) return { list: [], suggest: null }
  const orders = await prisma.order.findMany({
    where: { id: { in: Array.from(new Set(vmqs.map((v) => v.bizId))) }, tenantId: 1, product: { deliveryType: { in: CARRIERS } } },
    select: { id: true, orderNo: true, userId: true, payStatus: true, deliveryStatus: true, amount: true, product: { select: { deliveryType: true } }, user: { select: { email: true } } },
  })
  const om = new Map(orders.map((o) => [o.id, o]))
  const prior = await priorLatepayOf(orders.map((o) => o.id))
  const seen = new Set<number>()
  const list: LatepayCandidate[] = []
  for (const v of vmqs) {
    const o = om.get(v.bizId)
    if (!o || seen.has(o.id)) continue
    seen.add(o.id)
    list.push({
      orderNo: o.orderNo,
      orderId: o.id,
      deliveryType: o.product.deliveryType,
      payStatus: o.payStatus,
      deliveryStatus: o.deliveryStatus,
      closed: o.payStatus === 'UNPAID' && o.deliveryStatus === 'CANCELLED',
      amountCents: centsOf(o.amount),
      vmqOrderNo: v.orderId,
      vmqState: v.state,
      vmqCreatedAt: v.createdAt.toISOString(),
      userId: o.userId,
      userEmail: o.user.email,
      priorLatepay: prior.count.get(o.id) ?? 0,
      priorList: prior.list.get(o.id) ?? [],
      hinted: !!hint && hint.orderId === v.orderId,
    })
  }
  list.sort((a, b) => Number(b.hinted) - Number(a.hinted) || Number(b.closed) - Number(a.closed) || (a.vmqCreatedAt < b.vmqCreatedAt ? 1 : -1))
  const closed = list.filter((c) => c.closed)
  return { list, suggest: closed.length === 1 ? closed[0].orderNo : null }
}

export type LatepayOrderLookup = Omit<LatepayCandidate, 'vmqOrderNo' | 'vmqState' | 'vmqCreatedAt' | 'hinted'> & { carrier: boolean; tenantId: number }

/**
 * 站长在弹窗里手填、不在候选里的订单号：查出订单概况与之前的 LATEPAY 逐笔明细。
 * 找不到返回 null；不是主站载体单也照样返回（carrier=false，页面提示「只能退入主站接码 / 充值单」，提交时服务端还会再拒）。
 */
export async function latepayOrderLookup(orderNo: string): Promise<LatepayOrderLookup | null> {
  const no = String(orderNo ?? '').trim()
  if (!no || no.length > 32) return null
  const o = await prisma.order.findUnique({
    where: { orderNo: no },
    select: { id: true, orderNo: true, userId: true, tenantId: true, payStatus: true, deliveryStatus: true, amount: true, product: { select: { deliveryType: true } }, user: { select: { email: true } } },
  })
  if (!o) return null
  const prior = await priorLatepayOf([o.id])
  return {
    orderNo: o.orderNo,
    orderId: o.id,
    deliveryType: o.product.deliveryType,
    payStatus: o.payStatus,
    deliveryStatus: o.deliveryStatus,
    closed: o.payStatus === 'UNPAID' && o.deliveryStatus === 'CANCELLED',
    amountCents: centsOf(o.amount),
    userId: o.userId,
    userEmail: o.user.email,
    priorLatepay: prior.count.get(o.id) ?? 0,
    priorList: prior.list.get(o.id) ?? [],
    carrier: CARRIERS.includes(o.product.deliveryType) && o.tenantId === 1,
    tenantId: o.tenantId,
  }
}

/**
 * 一批条目各自是否涉及载体单（「标记已处理」必须选 OFFLINE / IGNORE、后台显示「退入买家余额」按钮）：
 * biz / candidates 里的订单、vmqOrderId 那张收款单的订单是 SMS_POOL / TOPUP，或有候选订单（latepayCandidates 同口径）。
 *
 * 【B1 评审修复：批量】/admin/vmq 每 10 秒轮询一次，原来对每条待处理条目各查 5–7 次（候选那一步还是 vmq_orders 按金额 + 时间扫表），
 * 几百条待处理时一次轮询就是几千条查询，和到账 webhook、收银台抢生产机的连接池。现在不论多少条都是固定的至多 3 条查询：
 * 提示收款单一次、订单是否载体一次、候选一次（SQL 里连订单与商品只取主站载体单的收款单，按全部条目的金额集合与时间范围一次取回，内存里逐条比对）。
 */
export async function carrierFlags(entries: LatepayEntry[]): Promise<boolean[]> {
  const flags = entries.map(() => false)
  if (!entries.length) return flags
  // ① 条目上写着的订单 + 提示收款单的订单：是不是载体商品（不限主站，与原单条判断同口径）
  const hintNos = Array.from(new Set(entries.map((e) => e.vmqOrderId).filter((x): x is string => !!x)))
  const hints = hintNos.length
    ? await prisma.vmqOrder.findMany({ where: { orderId: { in: hintNos } }, select: { orderId: true, bizType: true, bizId: true } })
    : []
  const hintOrder = new Map(hints.filter((h) => h.bizType === 'order').map((h) => [h.orderId, h.bizId]))
  const idsPer = entries.map((e) => {
    const ids = orderIdsInEntry(e)
    const h = e.vmqOrderId ? hintOrder.get(e.vmqOrderId) : undefined
    if (h != null) ids.push(h)
    return ids
  })
  const allIds = Array.from(new Set(idsPer.flat()))
  if (allIds.length) {
    const carrierIds = new Set(
      (await prisma.order.findMany({ where: { id: { in: allIds }, product: { deliveryType: { in: CARRIERS } } }, select: { id: true } })).map((o) => o.id),
    )
    idsPer.forEach((ids, i) => {
      if (ids.some((id) => carrierIds.has(id))) flags[i] = true
    })
  }
  // ② 其余：有没有候选（近 24 小时内同 type 同额的主站载体单收款单）
  const rest = entries.flatMap((e, i) => {
    const cents = entryCents(e)
    return !flags[i] && amountInRange(cents) ? [{ e, i, cents }] : []
  })
  if (rest.length) {
    const from = new Date(Math.min(...rest.map((x) => x.e.at)) - 24 * 3600_000)
    const to = new Date(Math.max(...rest.map((x) => x.e.at)) + 60_000)
    const decs = Array.from(new Set(rest.map((x) => x.cents))).map((c) => new Prisma.Decimal((c / 100).toFixed(2)))
    const rows = await prisma.$queryRaw<{ type: number; reallyPrice: Prisma.Decimal | string; createdAt: Date }[]>`
      SELECT v.type AS type, v.really_price AS reallyPrice, v.created_at AS createdAt
        FROM vmq_orders v JOIN orders o ON o.id = v.biz_id JOIN products p ON p.id = o.product_id
       WHERE v.biz_type = 'order' AND o.tenant_id = 1 AND p.delivery_type IN ('SMS_POOL', 'TOPUP')
         AND v.created_at >= ${from} AND v.created_at <= ${to}
         AND v.really_price IN (${Prisma.join(decs)})`
    const pts = rows.map((r) => ({ type: Number(r.type), cents: centsOf(String(r.reallyPrice)), t: new Date(r.createdAt).getTime() }))
    for (const x of rest) {
      if (pts.some((p) => p.type === x.e.type && p.cents === x.cents && p.t >= x.e.at - 24 * 3600_000 && p.t <= x.e.at + 60_000)) flags[x.i] = true
    }
  }
  return flags
}

/** 单条（「标记已处理」接口）：与 carrierFlags 同一套判断 */
export async function entryInvolvesCarrier(entry: LatepayEntry): Promise<boolean> {
  return (await carrierFlags([entry]))[0]
}

/** 「标记已处理」的条件更新（不再读—改—写覆盖）：只在条目仍未处理时写入。返回 false = 已被处理（原样返回） */
export async function markEntryHandled(key: string, by: string | number, handledAs?: 'OFFLINE' | 'IGNORE'): Promise<boolean> {
  const entry = await readEntry(key)
  if (!entry) throw new LatepayError('ENTRY_NOT_FOUND', '记录不存在', 404)
  if (entry.handledAt) return false
  const next = { ...entry, handledAt: Date.now(), handledBy: by, ...(handledAs ? { handledAs } : {}) }
  const r = await prisma.setting.updateMany({ where: { key, value: { contains: OPEN_MARK } }, data: { value: JSON.stringify(next) } })
  return r.count === 1
}

/** 后台「余额与充值 → 迟到付款」：最近的 LATEPAY 流水（带条目信息）与 OFFLINE / IGNORE 的条目 */
export async function latepayOverview(limit = 50) {
  const logs = await prisma.balanceLog.findMany({
    where: { type: 'LATEPAY' },
    orderBy: { id: 'desc' },
    take: limit,
    select: { id: true, userId: true, orderId: true, topupDeltaCents: true, bizKey: true, createdAt: true },
  })
  const keys = logs.map((l) => (l.bizKey ?? '').replace(/^latepay:/, '')).filter((k) => ENTRY_KEY_RE.test(k))
  const [entries, orders, users] = await Promise.all([
    keys.length ? prisma.setting.findMany({ where: { key: { in: keys } }, select: { key: true, value: true } }) : Promise.resolve([]),
    prisma.order.findMany({ where: { id: { in: logs.map((l) => l.orderId).filter((x): x is number => x != null) } }, select: { id: true, orderNo: true, product: { select: { deliveryType: true } } } }),
    prisma.user.findMany({ where: { id: { in: logs.map((l) => l.userId) } }, select: { id: true, email: true } }),
  ])
  const em = new Map(entries.map((e) => [e.key, (() => { try { return JSON.parse(e.value) as LatepayEntry } catch { return null } })()]))
  const om = new Map(orders.map((o) => [o.id, o]))
  const um = new Map(users.map((u) => [u.id, u.email]))
  const handledOther = await prisma.setting.findMany({
    where: { key: { startsWith: 'vmq_unmatched:' }, OR: [{ value: { contains: '"handledAs":"OFFLINE"' } }, { value: { contains: '"handledAs":"IGNORE"' } }] },
    orderBy: { key: 'desc' },
    take: limit,
    select: { key: true, value: true },
  })
  return {
    logs: logs.map((l) => {
      const key = (l.bizKey ?? '').replace(/^latepay:/, '')
      const e = em.get(key) ?? null
      const o = l.orderId ? om.get(l.orderId) : undefined
      return {
        logId: l.id,
        at: l.createdAt.toISOString(),
        cents: l.topupDeltaCents,
        userId: l.userId,
        userEmail: um.get(l.userId) ?? null,
        orderNo: o?.orderNo ?? null,
        orderType: o?.product.deliveryType ?? null,
        entryKey: key,
        reason: e?.reason ?? null,
        auto: !!e?.auto,
        tradeNo: e?.tradeNo ?? null,
        vmqOrderNo: e?.latepayVmq ?? e?.vmqOrderId ?? null,
      }
    }),
    handledOther: handledOther.flatMap((r) => {
      try {
        const e = JSON.parse(r.value) as LatepayEntry
        return [{ key: r.key, price: e.price, reason: e.reason, handledAs: e.handledAs ?? null, handledAt: e.handledAt ?? null, handledBy: e.handledBy ?? null }]
      } catch {
        return []
      }
    }),
  }
}
