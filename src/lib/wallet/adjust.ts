/**
 * 后台对余额的人工操作（docs/短信接码-设计.md §7.8、§5.6、附录 B 第 21 条）。两个入口共用这里：
 *   · 「余额与充值 → 调整」（POST /api/admin/wallet/adjust）：选格 + 方向 + 金额 + 原因（必填）+ 请求号；
 *   · 「内推管理 → 提现/调整」（POST /api/admin/referrals/balance，旧入口保留）：只作用于返现格，入参不变。
 *
 * 类型映射（§7.8）：
 *   返现格 + → ADJUST（adj:<requestId>）        返现格 − → WITHDRAW（adj:<requestId>，「提现：线下打款后记扣减」）
 *   充值格 + → ADJUST（adj:<requestId>，补偿）   充值格 − → TOPUP_REFUND（topup_refund:<支付宝流水号>，必填流水号）
 *   返现扣回 → CLAWBACK（clawback:<产生返现的订单 id>）：先扣返现格、不够再扣充值格，两格合计不够就扣到 0，差额写审计
 *   **不能记 LATEPAY**：迟到 / 重复付款只能从 /admin/vmq 待核实列表「退入买家余额」走（每条 LATEPAY 都对应一条条目）
 *
 * 【幂等】一律靠 balance_logs.biz_key 唯一：重放撞 P2002 → 对照已记的那条（同一用户、同一类型、同一金额）→ 当作重复、不再记账；
 * 对不上就 409（同一请求号换了金额或用户，不静默吞掉）。
 * 【部署窗口兼容】旧版本借用 vmq_locks 的 bal:<requestId> 做请求级幂等（§5.6）：新代码仍先查它，防止「部署前提交、
 * 部署后重试」被记两遍。过两周（旧锁行早已过了任何重试窗口）可删掉 legacyBalLock 这段。
 * 【审计】同一事务写 writeAudit：调整前后两格余额、原因、请求号 / 流水号（§10.2）。审计写不进去整笔回滚。
 * 【扣减用条件更新】postInTx 里 `balance >= b AND topup_cents >= a`，不会扣成负数；预扣中的钱不在格里，天然调不到。
 */
import { prisma } from '../db'
import { writeAudit } from '../audit'
import { postInTx, isBizKeyConflict, InsufficientBalance, type LedgerType } from './ledger'
import { centsOf, fmtCents } from './buckets'

export type AdjustKind = 'CASH_ADD' | 'CASH_SUB' | 'TOPUP_ADD' | 'TOPUP_SUB' | 'CLAWBACK'
export const ADJUST_KINDS: readonly AdjustKind[] = ['CASH_ADD', 'CASH_SUB', 'TOPUP_ADD', 'TOPUP_SUB', 'CLAWBACK']

/** 请求号：36 位 UUID 或 32 位 hex（与旧后台弹窗一致；adj: + 36 = 40 ≤ 64） */
export const REQUEST_ID_RE = /^[0-9a-fA-F-]{32,36}$/
/** 支付宝流水号 / 交易号：16–32 位数字（与迟到付款退入同一口径，§2.7） */
export const ALIPAY_NO_RE = /^\d{16,32}$/

export interface AdjustInput {
  actorUserId: number | null
  kind: AdjustKind
  /** 目标用户；CLAWBACK 不用给（取自返现记录的推广人），给了必须一致 */
  userId?: number
  /** 正整数分；CLAWBACK 不用给（= 那笔返现的金额） */
  amountCents?: number
  /** 内部原因（不回显给买家）。新入口必填；旧入口可空（按旧文案补默认值） */
  reason?: string | null
  /** 请求号。ADJUST / WITHDRAW 的幂等键；旧入口不带时为空（与原来一样不去重） */
  requestId?: string | null
  /** TOPUP_SUB 必填 */
  alipayNo?: string | null
  /** CLAWBACK 必填：产生返现的那张订单 */
  referralOrderId?: number | null
  /** 旧入口（内推管理）：审计 action 区分开 */
  source?: 'wallet' | 'referrals'
  req?: Request
}

export type AdjustResult =
  | {
      ok: true
      duplicate: boolean
      userId: number
      type: LedgerType
      logId: number | null
      before: { topupCents: number; cashCents: number } | null
      after: { topupCents: number; cashCents: number }
      shortfallCents: number
    }
  | { ok: false; status: number; message: string }

const fail = (status: number, message: string): AdjustResult => ({ ok: false, status, message })

class Fingerprint extends Error {}

/** 纯函数：把一次调整映射成流水类型、两格变动与 bizKey（金额、方向在这里定死，接口层只做格式校验） */
export function planAdjust(p: {
  kind: AdjustKind
  amountCents: number
  requestId?: string | null
  alipayNo?: string | null
  referralOrderId?: number | null
}): { type: LedgerType; topupDeltaCents: number; cashDeltaCents: number; bizKey: string | null } | string {
  const a = p.amountCents
  if (!Number.isSafeInteger(a) || a <= 0) return '金额必须是大于 0 的整数分'
  if (a > 99_999_999) return '金额过大'
  const adj = p.requestId ? `adj:${p.requestId}` : null
  if (p.requestId && !REQUEST_ID_RE.test(p.requestId)) return '请求号格式不正确'
  switch (p.kind) {
    case 'CASH_ADD':
      return { type: 'ADJUST', topupDeltaCents: 0, cashDeltaCents: a, bizKey: adj }
    case 'CASH_SUB':
      return { type: 'WITHDRAW', topupDeltaCents: 0, cashDeltaCents: -a, bizKey: adj }
    case 'TOPUP_ADD':
      if (!adj) return '缺少请求号'
      return { type: 'ADJUST', topupDeltaCents: a, cashDeltaCents: 0, bizKey: adj }
    case 'TOPUP_SUB':
      if (!p.alipayNo || !ALIPAY_NO_RE.test(p.alipayNo)) return '充值退还必须填支付宝流水号（16–32 位数字）'
      return { type: 'TOPUP_REFUND', topupDeltaCents: -a, cashDeltaCents: 0, bizKey: `topup_refund:${p.alipayNo}` }
    case 'CLAWBACK':
      if (!p.referralOrderId) return '缺少产生返现的订单'
      return { type: 'CLAWBACK', topupDeltaCents: 0, cashDeltaCents: -a, bizKey: `clawback:${p.referralOrderId}` }
    default:
      return '未知的调整类型'
  }
}

/** 部署前旧版本写下的 bal:<requestId> 请求锁（§5.6 兼容）：有就按旧指纹判重 */
async function legacyBalLock(requestId: string, userId: number, cashDeltaCents: number): Promise<'NONE' | 'SAME' | 'OTHER'> {
  const lock = await prisma.vmqLock.findUnique({ where: { lockKey: `bal:${requestId}` } })
  if (!lock) return 'NONE'
  return lock.orderId === `bal:${userId}:${cashDeltaCents}` ? 'SAME' : 'OTHER'
}

export async function adminAdjust(input: AdjustInput): Promise<AdjustResult> {
  const reason = (input.reason ?? '').trim()
  if (input.source !== 'referrals' && !reason) return fail(400, '请填写原因（内部，不回显给买家）')
  if (reason.length > 200) return fail(400, '原因最多 200 字')

  // ---- 确定用户与金额 ----
  let userId = input.userId ?? 0
  let amountCents = input.amountCents ?? 0
  if (input.kind === 'CLAWBACK') {
    const oid = Number(input.referralOrderId)
    if (!Number.isSafeInteger(oid) || oid <= 0) return fail(400, '缺少产生返现的订单')
    const rw = await prisma.referralReward.findUnique({ where: { orderId: oid }, select: { referrerId: true, amount: true, status: true } })
    if (!rw || rw.status !== 'SETTLED') return fail(404, '这张订单没有已入账的返现')
    if (input.userId && input.userId !== rw.referrerId) return fail(400, '这笔返现的推广人不是该用户')
    userId = rw.referrerId
    amountCents = centsOf(rw.amount)
  }
  if (!Number.isSafeInteger(userId) || userId <= 0) return fail(400, '缺少用户')
  const plan = planAdjust({ kind: input.kind, amountCents, requestId: input.requestId, alipayNo: input.alipayNo, referralOrderId: input.referralOrderId })
  if (typeof plan === 'string') return fail(400, plan)

  const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!exists) return fail(404, '用户不存在')

  // ---- 部署窗口兼容：旧版本的 bal:<requestId> ----
  if (input.requestId && plan.topupDeltaCents === 0 && plan.type !== 'CLAWBACK') {
    const legacy = await legacyBalLock(input.requestId, userId, plan.cashDeltaCents)
    if (legacy === 'SAME') {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true, topupCents: true } })
      return { ok: true, duplicate: true, userId, type: plan.type, logId: null, before: null, after: { topupCents: u?.topupCents ?? 0, cashCents: centsOf(u?.balance ?? 0) }, shortfallCents: 0 }
    }
    if (legacy === 'OTHER') return fail(409, '该次提交已按另一金额或另一用户处理过，请刷新流水核对后再操作')
  }

  const note =
    reason ||
    (plan.type === 'WITHDRAW' ? '提现/扣减' : plan.type === 'ADJUST' ? '余额调整' : plan.type === 'TOPUP_REFUND' ? '充值退还' : '返现扣回')

  try {
    const r = await prisma.$transaction(async (tx) => {
      let topupDelta = plan.topupDeltaCents
      let cashDelta = plan.cashDeltaCents
      let shortfall = 0
      if (plan.type === 'CLAWBACK') {
        // 先扣返现格、不够再扣充值格，两格合计不够就扣到 0（§7.8）；锁住用户行再算，拆分与扣减在同一把锁里
        const rows = await tx.$queryRaw<{ balance: unknown; topup_cents: number }[]>`SELECT balance, topup_cents FROM users WHERE id = ${userId} FOR UPDATE`
        const cash = Math.max(centsOf(rows[0]?.balance ?? 0), 0)
        const top = Math.max(Number(rows[0]?.topup_cents ?? 0), 0)
        const c = Math.min(cash, amountCents)
        const t = Math.min(top, amountCents - c)
        cashDelta = -c
        topupDelta = -t
        shortfall = amountCents - c - t
      }
      const res = await postInTx(tx, {
        userId,
        type: plan.type,
        topupDeltaCents: topupDelta,
        cashDeltaCents: cashDelta,
        bizKey: plan.bizKey,
        orderId: plan.type === 'CLAWBACK' ? input.referralOrderId ?? null : null,
        note: shortfall > 0 ? `${note}（返现扣回不足 ${fmtCents(shortfall)}）`.slice(0, 255) : note.slice(0, 255),
        allowZero: plan.type === 'CLAWBACK',
      })
      const after = { topupCents: res.topupAfterCents, cashCents: res.cashAfterCents }
      const before = { topupCents: after.topupCents - topupDelta, cashCents: after.cashCents - cashDelta }
      await writeAudit(tx, {
        actorUserId: input.actorUserId,
        actorKind: 'PLATFORM',
        action: input.source === 'referrals' ? 'wallet.adjust_legacy' : 'wallet.adjust',
        targetType: 'user',
        targetId: String(userId),
        reason: reason || undefined,
        diff: {
          kind: input.kind,
          type: plan.type,
          amountCents,
          topupDeltaCents: topupDelta,
          cashDeltaCents: cashDelta,
          before,
          after,
          bizKey: plan.bizKey,
          logId: res.logId,
          ...(input.alipayNo ? { alipayNo: input.alipayNo } : {}),
          ...(input.referralOrderId ? { referralOrderId: input.referralOrderId } : {}),
          ...(shortfall ? { shortfallCents: shortfall } : {}),
        },
        req: input.req,
      })
      return { logId: res.logId, before, after, shortfall, topupDelta, cashDelta }
    })
    return { ok: true, duplicate: false, userId, type: plan.type, logId: r.logId, before: r.before, after: r.after, shortfallCents: r.shortfall }
  } catch (e) {
    if (e instanceof InsufficientBalance) {
      return fail(400, plan.type === 'TOPUP_REFUND' ? '充值余额不足，扣减后不能为负' : '余额不足，扣减后不能为负')
    }
    if (isBizKeyConflict(e) && plan.bizKey) {
      // 重放：对照已记的那一条。同一用户、同一类型、同一金额 → 当作重复；否则 409
      const prev = await prisma.balanceLog.findUnique({ where: { bizKey: plan.bizKey }, select: { id: true, userId: true, type: true, delta: true, topupDeltaCents: true } })
      try {
        if (!prev || prev.userId !== userId || prev.type !== plan.type) throw new Fingerprint()
        if (plan.type !== 'CLAWBACK' && (prev.topupDeltaCents !== plan.topupDeltaCents || centsOf(prev.delta) !== plan.cashDeltaCents)) throw new Fingerprint()
      } catch {
        return fail(
          409,
          plan.type === 'TOPUP_REFUND'
            ? '这个支付宝流水号已经记过一笔充值退还（金额或用户不同），请核对后再操作'
            : '该次提交已按另一金额或另一用户处理过，请刷新流水核对后再操作',
        )
      }
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true, topupCents: true } })
      return { ok: true, duplicate: true, userId, type: plan.type, logId: prev.id, before: null, after: { topupCents: u?.topupCents ?? 0, cashCents: centsOf(u?.balance ?? 0) }, shortfallCents: 0 }
    }
    throw e
  }
}

/** 类型守卫：给接口层用（传 LATEPAY / 未知类型一律 400） */
export function isAdjustKind(v: unknown): v is AdjustKind {
  return typeof v === 'string' && (ADJUST_KINDS as readonly string[]).includes(v)
}

