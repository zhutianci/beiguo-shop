/**
 * 买家钱包 DTO（docs/短信接码-设计.md §1.15、§6.4、附录 B 第 7 条）。
 *
 * 【白名单】逐字段构造，不做 `{...row}` 展开：流水的 note（管理员写的内部备注）与 bizKey 一律不出；
 * 反查订单只查本人（REFERRAL 带 referrerId = 本人，其余带 userId = 本人）。
 *
 * 【四个累计数按流水类型算】（Q16）现有「收入 = Σ delta>0」在 B0 之后会把 RELEASE、退回返现格的 REFUND 也算进收入，
 * 必须按类型改写：
 *   累计充值 topupIn = Σ TOPUP
 *   累计消费 spent   = Σ|HOLD| − Σ RELEASE − 仍 HELD 的预扣（= 已确认的余额付款，只算余额部分）
 *   累计退回 refunded = Σ REFUND（全额，含支付宝付的那部分）+ Σ LATEPAY
 *   返现 referral    = Σ REFERRAL − Σ|CLAWBACK|（推荐面板用，主卡不显示）
 *   已提现 withdrawn = Σ|WITHDRAW|
 *   RELEASE 不进任何累计（只是解冻，钱从没被花掉）
 * 恒等式（每个买家都成立）：可用余额 + 预扣中 = 累计充值 − 累计消费 + 累计退回 + 返现 − 已提现 ± 后台调整 − 充值退还
 */
import { prisma } from '../db'
import { maskOrderNo } from '../mask'
import { BALANCE_TYPE_LABELS, WALLET_LOG_CATEGORIES, referralOrderIdOf, ledgerOrderIdOf, type WalletLogCategory } from '../balance'
import { centsOf } from './buckets'
import { canUseForJiema, readWalletConfig, topupOpenFor } from './config'

/** 按类型汇总的两格变动（分）：groupBy 的结果或测试手写 */
export interface TypeSum {
  type: string
  cashCents: number
  topupCents: number
}

export interface WalletTotals {
  topupIn: number
  spent: number
  refunded: number
  referral: number
  withdrawn: number
  /** 后台调整（ADJUST，带符号；含历史对齐流水） */
  adjust: number
  /** 充值退还（正数） */
  topupRefund: number
}

/** 纯函数：四个累计数（§1.15、§12.1 第 115 条）。heldCents = 当前仍 HELD 的预扣两格合计 */
export function walletTotals(sums: TypeSum[], heldCents: number): WalletTotals {
  const by = (t: string) => sums.filter((s) => s.type === t).reduce((a, s) => a + s.cashCents + s.topupCents, 0)
  const holdAbs = Math.abs(by('HOLD'))
  return {
    topupIn: by('TOPUP'),
    spent: holdAbs - by('RELEASE') - heldCents,
    refunded: by('REFUND') + by('LATEPAY'),
    referral: by('REFERRAL') - Math.abs(by('CLAWBACK')),
    withdrawn: Math.abs(by('WITHDRAW')),
    adjust: by('ADJUST'),
    topupRefund: Math.abs(by('TOPUP_REFUND')),
  }
}

/** 纯函数：恒等式的右边（测试与对账用） */
export function totalsIdentity(t: WalletTotals): number {
  return t.topupIn - t.spent + t.refunded + t.referral - t.withdrawn + t.adjust - t.topupRefund
}

export interface WalletLogRef {
  kind: 'SMS' | 'TOPUP' | 'REFERRAL'
  orderNoMasked: string
  title: string
}

export interface WalletLogItem {
  id: number
  type: string
  typeLabel: string
  /** 两格之和（分） */
  deltaCents: number
  topupDeltaCents: number
  cashDeltaCents: number
  /** 变动后两格之和（分）；历史行（topup_after_cents 为空）= 返现格 + 0 */
  afterCents: number
  createdAt: string
  ref: WalletLogRef | null
}

export interface WalletHoldItem {
  orderNo: string
  cents: number
  topupCents: number
  cashCents: number
  heldAt: string
  href: string
}

/** 流水行 → 白名单 DTO（纯函数；note / bizKey 不出）。refs 由调用方按本人反查好 */
export function toWalletLogItem(
  l: { id: number; type: string; delta: unknown; balanceAfter: unknown; topupDeltaCents: number; topupAfterCents: number | null; createdAt: Date },
  ref: WalletLogRef | null,
): WalletLogItem {
  const cash = centsOf(l.delta)
  return {
    id: l.id,
    type: l.type,
    typeLabel: BALANCE_TYPE_LABELS[l.type] || '余额变动',
    deltaCents: cash + l.topupDeltaCents,
    topupDeltaCents: l.topupDeltaCents,
    cashDeltaCents: cash,
    afterCents: centsOf(l.balanceAfter) + (l.topupAfterCents ?? 0),
    createdAt: l.createdAt.toISOString(),
    ref,
  }
}

/** 接码载体单的快照商品名是「短信接码 · 服务 · 国家/地区」，流水里只显示后两段（§1.15） */
function smsTitle(productName: string): string {
  return productName.replace(/^短信接码\s*·\s*/, '') || '短信接码'
}

/** 本页流水的 ref 批量反查（只查本人：REFERRAL 带 referrerId、其余带 userId） */
async function refsFor(
  userId: number,
  logs: { id: number; type: string; orderId: number | null; note: string | null }[],
): Promise<Map<number, WalletLogRef>> {
  const refIds = new Map<number, number>()
  const ownIds = new Map<number, number>()
  for (const l of logs) {
    const r = referralOrderIdOf(l)
    if (r) refIds.set(l.id, r)
    const o = ledgerOrderIdOf(l)
    if (o) ownIds.set(l.id, o)
  }
  const [refOrders, ownOrders] = await Promise.all([
    refIds.size
      ? prisma.order.findMany({
          where: { id: { in: Array.from(new Set(refIds.values())) }, referrerId: userId },
          select: { id: true, orderNo: true, productName: true },
        })
      : Promise.resolve([]),
    ownIds.size
      ? prisma.order.findMany({
          where: { id: { in: Array.from(new Set(ownIds.values())) }, userId },
          select: { id: true, orderNo: true, productName: true, product: { select: { deliveryType: true } } },
        })
      : Promise.resolve([]),
  ])
  const rm = new Map(refOrders.map((o) => [o.id, o]))
  const om = new Map(ownOrders.map((o) => [o.id, o]))
  const out = new Map<number, WalletLogRef>()
  for (const [logId, oid] of Array.from(refIds)) {
    const o = rm.get(oid)
    if (o) out.set(logId, { kind: 'REFERRAL', orderNoMasked: maskOrderNo(o.orderNo), title: o.productName })
  }
  for (const [logId, oid] of Array.from(ownIds)) {
    const o = om.get(oid)
    if (!o) continue
    const topup = o.product?.deliveryType === 'TOPUP'
    out.set(logId, { kind: topup ? 'TOPUP' : 'SMS', orderNoMasked: maskOrderNo(o.orderNo), title: topup ? '余额充值' : smsTitle(o.productName) })
  }
  return out
}

/** 待结算返现：与 /api/account/referral/orders 的「待结算」同一口径（改一处要同步另一处） */
async function pendingRewardCents(userId: number): Promise<number> {
  const settledRows = await prisma.referralReward.findMany({ where: { referrerId: userId, status: 'SETTLED' }, select: { orderId: true } })
  const settledIds = settledRows.map((r) => r.orderId)
  const agg = await prisma.order.aggregate({
    where: {
      referrerId: userId,
      payStatus: 'PAID',
      deliveryStatus: { not: 'CANCELLED' },
      referralReward: { gt: 0 },
      ...(settledIds.length ? { id: { notIn: settledIds } } : {}),
    },
    _sum: { referralReward: true },
  })
  return centsOf(agg._sum.referralReward ?? 0)
}

export interface WalletView {
  /** 两格合计（分）= 可用余额；预扣中的钱不在里面（已从格里扣走） */
  balanceCents: number
  topupCents: number
  cashCents: number
  holdingCents: number
  withdrawableCents: number
  holds: WalletHoldItem[]
  /**
   * 累计数（按流水类型算，要读全部流水的 groupBy）。brief=1 时为 null：brief 不查流水，
   * 拿空流水套公式会得出「累计消费 = −预扣中」这种负数（spent = 0 − 0 − heldCents），不如不给
   */
  totals: WalletTotals | null
  canUseForJiema: boolean
  /** [充值] 按钮：充值对本人开放时才显示 */
  topupOpen: boolean
  /** 「暂不支持开票」一行：充值对本人开放或 canUseForJiema 时才下发（B0 两者都没开，不显示，§1.15） */
  showInvoiceNotice: boolean
  recentLateCredits: { cents: number; at: string; ref: WalletLogRef | null }[]
  /** 待结算返现（元，与改造前同一字段、同一口径） */
  pendingReward: number
  pendingRewardCents: number
  logs: WalletLogItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  /** 兼容旧前端：总额（元） */
  balance: number
}

/**
 * 组装买家钱包（GET /api/account/wallet）。brief=true 只算余额（个人中心 / 确认面板用），totals 为 null。
 * 调用方负责 denyOnChannel 与登录校验；这里只按 userId 查。
 */
export async function buildWalletView(
  user: { id: number; role?: string },
  opts: { page?: number; pageSize?: number; cat?: WalletLogCategory; brief?: boolean } = {},
): Promise<WalletView> {
  const userId = user.id
  const page = Math.max(opts.page ?? 1, 1)
  const pageSize = Math.min(Math.max(opts.pageSize ?? 20, 1), 50)
  const cat: WalletLogCategory = opts.cat && (opts.cat === 'all' || opts.cat in WALLET_LOG_CATEGORIES) ? opts.cat : 'all'
  const typeFilter = cat === 'all' ? undefined : { in: [...WALLET_LOG_CATEGORIES[cat]] as string[] }

  const cfg = await readWalletConfig()
  const [u, heldRows, jiema] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { balance: true, topupCents: true } }),
    prisma.balanceHold.findMany({
      where: { userId, state: 'HELD' },
      orderBy: { heldAt: 'desc' },
      select: { orderId: true, topupCents: true, cashCents: true, heldAt: true },
    }),
    canUseForJiema(cfg),
  ])
  const topupCents = u?.topupCents ?? 0
  const cashCents = centsOf(u?.balance ?? 0)
  const holdingCents = heldRows.reduce((a, h) => a + h.topupCents + h.cashCents, 0)
  const topupOpen = topupOpenFor(cfg.ok ? cfg.config : null, user.role === 'ADMIN')

  const holdOrders = heldRows.length
    ? await prisma.order.findMany({ where: { id: { in: heldRows.map((h) => h.orderId) }, userId }, select: { id: true, orderNo: true } })
    : []
  const orderNoOf = new Map(holdOrders.map((o) => [o.id, o.orderNo]))
  const holds: WalletHoldItem[] = heldRows.flatMap((h) => {
    const no = orderNoOf.get(h.orderId)
    if (!no) return []
    return [{ orderNo: no, cents: h.topupCents + h.cashCents, topupCents: h.topupCents, cashCents: h.cashCents, heldAt: h.heldAt.toISOString(), href: `/jiema/order/${no}` }]
  })

  const base = {
    balanceCents: topupCents + cashCents,
    topupCents,
    cashCents,
    holdingCents,
    withdrawableCents: cashCents,
    holds,
    canUseForJiema: jiema,
    topupOpen,
    showInvoiceNotice: topupOpen || jiema,
    balance: (topupCents + cashCents) / 100,
  }
  if (opts.brief) {
    return {
      ...base,
      totals: null,
      recentLateCredits: [],
      pendingReward: 0,
      pendingRewardCents: 0,
      logs: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 1,
    }
  }

  const since = new Date(Date.now() - 7 * 86400_000)
  const [sums, pending, total, rows, late] = await Promise.all([
    prisma.balanceLog.groupBy({ by: ['type'], where: { userId }, _sum: { delta: true, topupDeltaCents: true } }),
    pendingRewardCents(userId),
    prisma.balanceLog.count({ where: { userId, ...(typeFilter ? { type: typeFilter } : {}) } }),
    prisma.balanceLog.findMany({
      where: { userId, ...(typeFilter ? { type: typeFilter } : {}) },
      // id 兜底：同一毫秒写入的两条也有确定顺序，翻页不重不漏
      orderBy: { id: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, type: true, delta: true, balanceAfter: true, topupDeltaCents: true, topupAfterCents: true, note: true, orderId: true, createdAt: true },
    }),
    prisma.balanceLog.findMany({
      where: { userId, type: 'LATEPAY', createdAt: { gte: since } },
      orderBy: { id: 'desc' },
      take: 10,
      select: { id: true, type: true, delta: true, topupDeltaCents: true, orderId: true, note: true, createdAt: true },
    }),
  ])
  const refs = await refsFor(userId, [...rows, ...late])
  const typeSums: TypeSum[] = sums.map((s) => ({ type: s.type, cashCents: centsOf(s._sum.delta ?? 0), topupCents: s._sum.topupDeltaCents ?? 0 }))
  return {
    ...base,
    totals: walletTotals(typeSums, holdingCents),
    recentLateCredits: late.map((l) => ({ cents: centsOf(l.delta) + l.topupDeltaCents, at: l.createdAt.toISOString(), ref: refs.get(l.id) ?? null })),
    pendingReward: pending / 100,
    pendingRewardCents: pending,
    logs: rows.map((l) => toWalletLogItem(l, refs.get(l.id) ?? null)),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  }
}
