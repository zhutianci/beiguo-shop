/**
 * 钱包唯一的记账函数（docs/短信接码-设计.md D31、§5.2、附录 B 第 13、14 条）。
 *
 * 【所有写余额的代码都走 postInTx】返现结算、后台调余额 / 提现、预扣 / 确认 / 释放 / 退款、充值入账、迟到付款退入、
 * 返现扣回、充值退还——调用方**绝不**另写 `UPDATE users`（那是双扣）。构建前检查（check-tenant-boundary 规则 16）
 * 拦 src/ 里别处出现的 `topupCents: {`、`balance: { increment/decrement`、写 users / balance_logs 的原生 SQL、
 * 以及 balanceLog 的任何写调用。
 *
 * 一次调用 = 一次业务事件 = 一条流水 = 一个 bizKey：
 *   ① **一条**带两个条件的更新同时改两格（扣减时 `topup_cents >= a AND balance >= b`），count≠1 抛 InsufficientBalance；
 *   ② 同一事务里读回两格（行已被本事务的更新锁住，读到的就是本次改完的值）；
 *   ③ 写一行流水：delta / balanceAfter = 返现格（含义不变），topupDeltaCents / topupAfterCents = 充值格，bizKey 唯一。
 * 恒等式 users.balance = Σ delta、users.topup_cents = Σ topup_delta_cents 因此对每个用户永远成立（W1 每天核）。
 *
 * 【幂等】bizKey 唯一约束是最后一道防线：同一事件重放时第二次插流水撞 P2002，整个事务回滚（余额的改动一起回滚）。
 * 调用方用 isBizKeyConflict(e) 识别「这件事已经记过」。
 *
 * 本文件是叶子：只依赖 @prisma/client、db、./buckets；不 import lib/vmq、lib/jiema（规则 17）。
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { yuanStr, centsOf } from './buckets'

export const LEDGER_TYPES = [
  'REFERRAL',
  'ADJUST',
  'WITHDRAW',
  'TOPUP',
  'HOLD',
  'RELEASE',
  'REFUND',
  'LATEPAY',
  'TOPUP_REFUND',
  'CLAWBACK',
] as const
export type LedgerType = (typeof LEDGER_TYPES)[number]

/** 扣不够：一条带条件的更新没命中（count≠1）。在事务里抛出，让同一事务里已写的东西一起回滚 */
export class InsufficientBalance extends Error {
  constructor(message = '余额不足') {
    super(message)
    this.name = 'InsufficientBalance'
  }
}

/**
 * 这件事已经记过账（bizKey 已存在）。扣减类重放时，余额早已被第一次扣走，条件更新会先失败——
 * 如果照实抛 InsufficientBalance，调用方就把「重放」误判成「余额不足」（幂等失效，后台会提示余额不足而不是「已记过」）。
 * 所以条件更新失败时先核对 bizKey，存在就抛这个；isBizKeyConflict 对它同样返回 true。
 */
export class DuplicateBizKey extends Error {
  constructor(public readonly bizKey: string) {
    super(`[wallet] bizKey 已记过账：${bizKey}`)
    this.name = 'DuplicateBizKey'
  }
}

/** 记账参数不合法（程序错误，不是业务失败）：方向、bizKey 前缀、orderId 缺失等 */
export class LedgerError extends Error {
  constructor(message: string) {
    super(`[wallet] ${message}`)
    this.name = 'LedgerError'
  }
}

export interface PostInput {
  userId: number
  /** 返现格（users.balance）变动，整数分 */
  cashDeltaCents?: number
  /** 充值格（users.topup_cents）变动，整数分 */
  topupDeltaCents?: number
  type: LedgerType
  /**
   * 业务幂等键（≤64）。REFERRAL 为 null（幂等靠 ReferralReward.orderId 唯一，设计 §6.6 第 2 条）；
   * ADJUST / WITHDRAW 在旧后台页面不带请求号时为 null（兼容），其余类型必填。
   */
  bizKey: string | null
  orderId?: number | null
  /** 内部备注（≤255），买家侧一律不回显 */
  note?: string | null
  /** 只给 CLAWBACK：两格都为 0 时仍写一条 0 元流水占住 bizKey（扣回不足的差额写审计） */
  allowZero?: boolean
}

export interface PostResult {
  logId: number
  cashAfterCents: number
  topupAfterCents: number
}

/** bizKey 前缀约定（设计 §5.2 流水类型表）。ADJUST / WITHDRAW 共用 adj:，历史对齐的 migrate: 只由运维 SQL 写 */
const KEY_PREFIX: Record<LedgerType, string | null> = {
  REFERRAL: null,
  ADJUST: 'adj:',
  WITHDRAW: 'adj:',
  TOPUP: 'topup:',
  HOLD: 'hold:',
  RELEASE: 'release:',
  REFUND: 'refund:',
  LATEPAY: 'latepay:',
  TOPUP_REFUND: 'topup_refund:',
  CLAWBACK: 'clawback:',
}

/** 本人自己的订单（接码单 / 充值单）上的流水：bizKey 必须恰好是「前缀 + orderId」 */
const ORDER_KEYED: ReadonlySet<LedgerType> = new Set<LedgerType>(['TOPUP', 'HOLD', 'RELEASE', 'REFUND'])

type Sign = '+' | '-' | '0' | '±' | '+0' | '-0'
/** 每种类型两格各自允许的方向（[充值格, 返现格]）。写反方向是程序错误，直接拒绝 */
const DIRECTION: Record<LedgerType, [Sign, Sign]> = {
  TOPUP: ['+', '0'],
  LATEPAY: ['+', '0'],
  HOLD: ['-0', '-0'],
  RELEASE: ['+0', '+0'],
  REFUND: ['+0', '+0'],
  REFERRAL: ['0', '+'],
  WITHDRAW: ['0', '-'],
  TOPUP_REFUND: ['-', '0'],
  CLAWBACK: ['-0', '-0'],
  ADJUST: ['+0', '+0'],
}

function signOk(v: number, s: Sign): boolean {
  switch (s) {
    case '+':
      return v > 0
    case '-':
      return v < 0
    case '0':
      return v === 0
    case '+0':
      return v >= 0
    case '-0':
      return v <= 0
    default:
      return true
  }
}

/** 纯函数：校验一次记账的参数。导出给 scripts/check-wallet-*.ts 断言 */
export function validatePost(input: PostInput): string | null {
  const t = input.topupDeltaCents ?? 0
  const c = input.cashDeltaCents ?? 0
  if (!(LEDGER_TYPES as readonly string[]).includes(input.type)) return `未知流水类型 ${input.type}`
  if (!Number.isSafeInteger(input.userId) || input.userId <= 0) return 'userId 不合法'
  if (!Number.isSafeInteger(t) || !Number.isSafeInteger(c)) return '金额必须是整数分'
  // 单笔变动上限：两格各 ±¥9,999,999.99（balance 列是 Decimal(10,2)），超出多半是元 / 分弄反了
  if (Math.abs(t) > 999_999_999 || Math.abs(c) > 999_999_999) return '单笔变动额超出范围'
  const [ts, cs] = DIRECTION[input.type]
  if (!signOk(t, ts) || !signOk(c, cs)) return `${input.type} 的变动方向不对（充值格 ${t}，返现格 ${c}）`
  if (t === 0 && c === 0 && !(input.allowZero && input.type === 'CLAWBACK')) return '两格变动都为 0'
  if (input.type === 'ADJUST' && t !== 0 && c !== 0) return 'ADJUST 一次只能调一格'
  const prefix = KEY_PREFIX[input.type]
  const key = input.bizKey
  if (key != null) {
    if (typeof key !== 'string' || key.length === 0 || key.length > 64) return 'bizKey 长度不合法'
    if (prefix == null) return `${input.type} 不写 bizKey`
    if (!key.startsWith(prefix)) return `${input.type} 的 bizKey 必须以 ${prefix} 开头`
  } else if (!['REFERRAL', 'ADJUST', 'WITHDRAW'].includes(input.type)) {
    return `${input.type} 必须带 bizKey`
  }
  if (ORDER_KEYED.has(input.type) || input.type === 'LATEPAY' || input.type === 'REFERRAL' || input.type === 'CLAWBACK') {
    if (!input.orderId || !Number.isSafeInteger(input.orderId) || input.orderId <= 0) return `${input.type} 必须带 orderId`
  }
  if (ORDER_KEYED.has(input.type) && key !== `${prefix}${input.orderId}`) return `${input.type} 的 bizKey 必须是 ${prefix}<orderId>`
  if (input.note != null && input.note.length > 255) return 'note 超过 255 字'
  return null
}

const dec = (cents: number) => new Prisma.Decimal(yuanStr(cents))

/**
 * 记一笔账（必须在调用方的事务里）。返回流水 id 与两格变动后余额（分）。
 * 扣不够抛 InsufficientBalance；bizKey 重复由数据库抛 P2002（isBizKeyConflict 识别）。
 */
export async function postInTx(tx: Prisma.TransactionClient, input: PostInput): Promise<PostResult> {
  const bad = validatePost(input)
  if (bad) throw new LedgerError(bad)
  const t = input.topupDeltaCents ?? 0
  const c = input.cashDeltaCents ?? 0

  if (t !== 0 || c !== 0) {
    // 【一条更新、两个条件】扣减的条件与增减写在同一条语句里，由数据库定胜负；不先读后写（附录 B 第 14 条）
    const where: Prisma.UserWhereInput = { id: input.userId }
    const data: Prisma.UserUpdateManyMutationInput = {}
    if (t < 0) where.topupCents = { gte: -t }
    if (c < 0) where.balance = { gte: dec(-c) }
    if (t !== 0) data.topupCents = { increment: t }
    if (c !== 0) data.balance = { increment: dec(c) }
    const r = await tx.user.updateMany({ where, data })
    if (r.count !== 1) {
      const exists = await tx.user.findUnique({ where: { id: input.userId }, select: { id: true } })
      if (!exists) throw new LedgerError(`用户 #${input.userId} 不存在`)
      // 重放的扣减：先认 bizKey（锁定读，看得见刚提交的第一次；反正马上回滚，间隙锁不会留下）
      if (input.bizKey) {
        const dup = await tx.$queryRaw<{ id: number }[]>`SELECT id FROM balance_logs WHERE biz_key = ${input.bizKey} LOCK IN SHARE MODE`
        if (dup.length) throw new DuplicateBizKey(input.bizKey)
      }
      throw new InsufficientBalance()
    }
  }

  // 读回两格用**锁定读**：行已被本事务的更新锁住（0 元流水在这里才加锁），锁定读总是读最新版本 + 本事务的改动；
  // 普通 SELECT 在 REPEATABLE READ 下可能读到本事务更早建立的快照（调用方在同一事务里先读过这一行时）
  const rows = await tx.$queryRaw<{ balance: unknown; topup_cents: number }[]>`SELECT balance, topup_cents FROM users WHERE id = ${input.userId} FOR UPDATE`
  const u = rows[0]
  if (!u) throw new LedgerError(`用户 #${input.userId} 不存在`)
  const cashAfterCents = centsOf(u.balance)
  const topupAfterCents = Number(u.topup_cents)
  const log = await tx.balanceLog.create({
    data: {
      userId: input.userId,
      delta: dec(c),
      balanceAfter: dec(cashAfterCents),
      topupDeltaCents: t,
      topupAfterCents,
      type: input.type,
      note: input.note ?? null,
      orderId: input.orderId ?? null,
      bizKey: input.bizKey,
    },
    select: { id: true },
  })
  return { logId: log.id, cashAfterCents, topupAfterCents }
}

/** 这个错误是不是「bizKey 已存在」（同一事件已经记过账） */
export function isBizKeyConflict(e: unknown): boolean {
  if (e instanceof DuplicateBizKey) return true
  const err = e as { code?: string; meta?: { target?: unknown } }
  if (err?.code !== 'P2002') return false
  const target = err.meta?.target
  const s = Array.isArray(target) ? target.join(',') : String(target ?? '')
  return s.includes('biz_key') || s.includes('bizKey')
}

/** 死锁（MySQL 1213）或写冲突（Prisma P2034）：资金事务统一重试一次（设计 §2.3 第 5 条、§2.7 第 4 条） */
export function isRetryableTxError(e: unknown): boolean {
  const err = e as { code?: string; message?: string }
  if (err?.code === 'P2034') return true
  const msg = String(err?.message ?? '')
  return /\b1213\b|Deadlock found/i.test(msg)
}

/**
 * 跑一个资金事务，遇到死锁 / 写冲突重试一次。fn 必须是幂等的整段事务（重试时整段重来）。
 * 默认隔离级别（REPEATABLE READ），与现有返现结算、后台调余额一致；充值下单 / 关单这类「先锁一行、锁内再查最新提交」
 * 的事务传 READ COMMITTED（B1）。
 */
export async function inMoneyTx<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  opts?: { timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel },
): Promise<T> {
  const run = () =>
    prisma.$transaction(fn, {
      maxWait: 5_000,
      timeout: opts?.timeout ?? 10_000,
      ...(opts?.isolationLevel ? { isolationLevel: opts.isolationLevel } : {}),
    })
  try {
    return await run()
  } catch (e) {
    if (!isRetryableTxError(e)) throw e
    console.warn('[wallet] 资金事务遇到死锁 / 写冲突，重试一次', (e as Error)?.message)
    return run()
  }
}

/** 读一个用户的两格（分）。只读，不加锁 */
export async function bucketsOf(userId: number, db: Prisma.TransactionClient | typeof prisma = prisma): Promise<{ topupCents: number; cashCents: number } | null> {
  const u = await db.user.findUnique({ where: { id: userId }, select: { balance: true, topupCents: true } })
  return u ? { topupCents: u.topupCents, cashCents: centsOf(u.balance) } : null
}
