/**
 * 钱包两格的纯函数（docs/短信接码-设计.md D29–D32、D4；零依赖，客户端也能 import）。
 *
 *   充值格 topup：users.topup_cents（Int 分），不可提现
 *   返现格 cash ：users.balance（Decimal(10,2) 元），可提现，含义永远不变
 *
 * 【金额一律整数分】本文件只收、只出整数分；Decimal / 字符串 → 分 用 centsOf（按字符串解析，不经过浮点乘法）。
 */

export type Bucket = 'TOPUP' | 'CASH'

/** 抛出而不是返回 NaN：金额算错必须当场炸，不能静默写进账里 */
function assertCents(n: number, name: string): void {
  if (!Number.isSafeInteger(n)) throw new Error(`[wallet] ${name} 不是整数分：${n}`)
}

/**
 * 扣款拆分（D32：先扣充值格，再扣返现格）。
 *   topup = min(充值格, 应付)；cash = min(返现格, 应付 − topup)；rest = 应付 − topup − cash（交给支付宝的差额）
 * 两格余额为负（不该出现，W2 会报）按 0 算，绝不会拆出负数。
 */
export function splitDebit(
  topupCents: number,
  cashCents: number,
  amountCents: number,
): { topupCents: number; cashCents: number; restCents: number } {
  assertCents(topupCents, 'topupCents')
  assertCents(cashCents, 'cashCents')
  assertCents(amountCents, 'amountCents')
  if (amountCents < 0) throw new Error(`[wallet] 应付不能为负：${amountCents}`)
  const t = Math.min(Math.max(topupCents, 0), amountCents)
  const c = Math.min(Math.max(cashCents, 0), amountCents - t)
  return { topupCents: t, cashCents: c, restCents: amountCents - t - c }
}

/**
 * 退款拆分（D4：退实收全额，按格原路）。
 *   余额部分按预扣时的拆分原路回去（充值格回充值格、返现格回返现格）；
 *   支付宝付的部分（含识别尾差）**只进充值格** —— 进返现格就是「支付宝付款 → 取消 → 提现」的套现通道（附录 B 第 15 条）。
 * hold 为 null = 纯支付宝单（没有预扣行）。
 */
export function splitRefund(
  hold: { topupCents: number; cashCents: number } | null,
  alipayPaidCents: number | null,
): { topupCents: number; cashCents: number; totalCents: number } {
  const ht = hold?.topupCents ?? 0
  const hc = hold?.cashCents ?? 0
  const ap = alipayPaidCents ?? 0
  assertCents(ht, 'hold.topupCents')
  assertCents(hc, 'hold.cashCents')
  assertCents(ap, 'alipayPaidCents')
  if (ht < 0 || hc < 0 || ap < 0) throw new Error('[wallet] 退款拆分的输入不能为负')
  return { topupCents: ht + ap, cashCents: hc, totalCents: ht + hc + ap }
}

/**
 * 元（Decimal / 字符串 / 数字）→ 整数分。按字符串解析，不做浮点乘法（0.29 * 100 = 28.999999999999996）。
 * 超过两位小数的按四舍五入（Decimal(10,2) 列本来就不会出现），无法解析的抛错。
 */
export function centsOf(v: unknown): number {
  if (v == null) return 0
  const s = typeof v === 'string' ? v.trim() : typeof v === 'number' ? v.toFixed(6) : String(v)
  const m = /^(-)?(\d+)(?:\.(\d+))?$/.exec(s)
  if (!m) throw new Error(`[wallet] 不是金额：${s}`)
  const neg = m[1] === '-'
  const int = Number(m[2])
  const frac = (m[3] ?? '').padEnd(3, '0')
  let cents = int * 100 + Number(frac.slice(0, 2))
  if (Number(frac[2]) >= 5) cents += 1
  if (!Number.isSafeInteger(cents)) throw new Error(`[wallet] 金额超出范围：${s}`)
  return neg ? -cents : cents
}

/** 整数分 → 「12.34」（不带 ¥；负数带 -）。显示与写 Decimal 列都用它，不经过浮点 */
export function yuanStr(cents: number): string {
  assertCents(cents, 'cents')
  const neg = cents < 0
  const a = Math.abs(cents)
  return `${neg ? '-' : ''}${Math.floor(a / 100)}.${String(a % 100).padStart(2, '0')}`
}

/** 整数分 → 「¥12.34」；负数「-¥12.34」 */
export function fmtCents(cents: number): string {
  const s = yuanStr(cents)
  return s.startsWith('-') ? `-¥${s.slice(1)}` : `¥${s}`
}
