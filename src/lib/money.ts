// 金额工具：统一按「分」做整数运算，避免浮点误差与对不上账。

/** 四舍五入到两位小数（与 api/admin/external-orders/[id] 的 round2 语义一致） */
export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** 元 → 分（整数） */
export function toCents(n: number | string): number {
  return Math.round(Number(n) * 100)
}

/** 分 → 元 */
export function fromCents(cents: number): number {
  return cents / 100
}

/**
 * 把一笔总额按「分」整数分摊成 parts 份，最后一份吃掉余数。
 * 保证 Σ 结果 === total（精确到分），例如 splitAmount(100, 3) => [33.33, 33.33, 33.34]。
 * 这是单卡售价/利润的唯一分摊口径：一单多卡时，各卡售价之和必须等于订单金额，
 * 否则日流水表和订单表对不上。
 */
export function splitAmount(total: number, parts: number): number[] {
  if (parts <= 0) return []
  const totalCents = toCents(total)
  const base = Math.trunc(totalCents / parts)
  const out: number[] = []
  let assigned = 0
  for (let i = 0; i < parts - 1; i++) {
    out.push(fromCents(base))
    assigned += base
  }
  out.push(fromCents(totalCents - assigned))
  return out
}
