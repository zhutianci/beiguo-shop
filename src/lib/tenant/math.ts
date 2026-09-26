/**
 * 账本与定价的整数运算（设计 10.2）。金额一律「分」（Int），比例一律「万分比 bp」（Int，150 = 1.5%）。
 * 全程不用浮点、不用 Decimal 运算；中间乘积用 BigInt，大额（远超 2^53 的中间值）不溢出。
 *
 * 【为什么只接受非负数】账本里所有「应剩余值」都是非负量，符号由调用方按成分方向加（设计 10.4「符号」列），
 * 所以不需要负数舍入规则，也就避开了 JS Math.round(-0.5) = -0 的不对称。负数、非整数、非安全整数一律抛错——
 * 这类输入只可能是 bug，静默算出一个数比报错危险得多。
 *
 * 【舍入规则只在 mulBps 一处】四舍五入（half-up）到分（Q1 推荐值）。站长若改成向下取整或银行家舍入，只改这里。
 * 纯函数，无 import：partner-handlers、客户端组件都可以 import。
 */

function assertNonNegInt(name: string, v: number): void {
  if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0) {
    throw new Error(`[tenant/math] ${name} 必须是非负安全整数，收到 ${String(v)}`)
  }
}

function toSafeNumber(b: bigint): number {
  if (b > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('[tenant/math] 结果超出安全整数范围')
  return Number(b)
}

/** x·bps/10000，四舍五入到分：floor((x·bps + 5000) / 10000)。x、bps 为非负整数，否则抛 */
export function mulBps(x: number, bps: number): number {
  assertNonNegInt('x', x)
  assertNonNegInt('bps', bps)
  return toSafeNumber((BigInt(x) * BigInt(bps) + BigInt(5000)) / BigInt(10000))
}

/** 按比例取剩余值 round(x·num/den)，half-up：floor((2·x·num + den) / (2·den))。x、num ≥ 0、den > 0，否则抛 */
export function mulDivRound(x: number, num: number, den: number): number {
  assertNonNegInt('x', x)
  assertNonNegInt('num', num)
  assertNonNegInt('den', den)
  if (den === 0) throw new Error('[tenant/math] den 必须 > 0')
  const d = BigInt(den)
  return toSafeNumber((BigInt(2) * BigInt(x) * BigInt(num) + d) / (BigInt(2) * d))
}

/**
 * 手续费差额法（设计 10.4）：合计 = mulBps(G + I, f)，与站长公式「(货款 + 发票分成) × 费率」逐单只舍入一次；
 * FEE（货款部分）= mulBps(G, f)；INVOICE_FEE = 合计 − FEE（恒 ≥ 0：mulBps 对 x 单调不减）。
 * 例：G=12900、I=258、f=150 → 合计 197、FEE 194、INVOICE_FEE 3（分开取整会是 194 + 4 = 198，多收 1 分）。
 */
export function feeSplit(goodsCents: number, invShareCents: number, feeRateBp: number): { fee: number; invoiceFee: number } {
  assertNonNegInt('goodsCents', goodsCents)
  assertNonNegInt('invShareCents', invShareCents)
  const total = mulBps(goodsCents + invShareCents, feeRateBp)
  const fee = mulBps(goodsCents, feeRateBp)
  return { fee, invoiceFee: total - fee }
}

/** 售价 / 进货价批量规则的取整（设计 7.1、7.2）：不取整 / 到角 / 到元（四舍五入）/ 到元（向上） */
export type RoundingMode = 'NONE' | 'JIAO' | 'YUAN' | 'YUAN_UP'

export function roundCents(cents: number, mode: RoundingMode): number {
  assertNonNegInt('cents', cents)
  switch (mode) {
    case 'NONE':
      return cents
    case 'JIAO':
      return Math.floor((cents + 5) / 10) * 10
    case 'YUAN':
      return Math.floor((cents + 50) / 100) * 100
    case 'YUAN_UP':
      return Math.ceil(cents / 100) * 100
    default:
      throw new Error(`[tenant/math] 未知取整方式 ${String(mode)}`)
  }
}

/**
 * 元 → 分，严格解析（渠道改价输入框、超管录入）：
 *  · 字符串：可带首尾空白；只接受 `123`、`123.4`、`123.45`；拒绝负号、正号、千分位、科学计数法、空串、`.5`、`5.`；
 *  · 数字：必须有限、非负、最多两位小数（用十进制字符串判定，不信 x*100 的浮点结果）。
 * 非法一律抛错（调用方转 400）。结果必须是安全整数。
 */
export function yuanToCents(input: string | number): number {
  let s: string
  if (typeof input === 'number') {
    if (!Number.isFinite(input) || input < 0) throw new Error(`[tenant/math] 金额非法：${String(input)}`)
    s = String(input)
    if (/e/i.test(s)) throw new Error(`[tenant/math] 金额非法：${s}`)
  } else if (typeof input === 'string') {
    s = input.trim()
  } else {
    throw new Error('[tenant/math] 金额必须是字符串或数字')
  }
  const m = /^(\d{1,13})(?:\.(\d{1,2}))?$/.exec(s)
  if (!m) throw new Error(`[tenant/math] 金额格式非法（最多两位小数）：${s.slice(0, 40)}`)
  const cents = Number(m[1]) * 100 + Number((m[2] || '').padEnd(2, '0'))
  if (!Number.isSafeInteger(cents)) throw new Error('[tenant/math] 金额超出范围')
  return cents
}
