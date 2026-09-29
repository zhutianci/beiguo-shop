/**
 * 接码单付款翻 PAID 时 SmsOrder 推进到哪（docs/短信接码-设计.md T2、T3、§1.10 READY、§12.2 第 17 条）——零依赖纯函数。
 *
 * 【为什么在 lib 根下】vmq.ts 的 fulfillCarrierOrder 在翻 PAID 的同一事务里写 SmsOrder 的状态（§6.6 第 24 条），
 * 而构建前检查规则 17 不许 vmq.ts 静态 import lib/jiema/**；放在这里 vmq 与 jiema/machine.ts 共用同一份判定，不会各写一套。
 *
 * READY 只在同时满足两条时写：① now > quoteExpiresAt + 20 分钟；② 余额付清（T19 补推进），或 now − 收款单 payDate ≥ 3 分钟
 * （reconcilePaidVmq 宽限期后的补履约；到账路径当场履约时这个差值只有几秒）。其余一律 ACQUIRING（价格风险由快照 cap 兜住）。
 */
export const LATE_READY_AFTER_QUOTE_SEC = 20 * 60
export const LATE_READY_RECON_SEC = 3 * 60

export function paidTarget(p: { now: Date; quoteExpiresAt: Date; via: 'VMQ' | 'BALANCE'; payDate: Date | null }): 'READY' | 'ACQUIRING' {
  const n = p.now.getTime()
  if (n <= p.quoteExpiresAt.getTime() + LATE_READY_AFTER_QUOTE_SEC * 1000) return 'ACQUIRING'
  if (p.via === 'BALANCE') return 'READY'
  if (p.payDate && n - p.payDate.getTime() >= LATE_READY_RECON_SEC * 1000) return 'READY'
  return 'ACQUIRING'
}
