/**
 * 优惠券金额逻辑自测。**不连数据库**，照 scripts/check-money.ts 的形式。
 *   npx tsx scripts/check-coupon.ts
 *
 * 这是全站唯一一处「买家付多少」由代码决定的地方，算错一分钱就是真实的资金差错，
 * 而这类错误 tsc 和 next build 一个都拦不住。
 */
import {
  MIN_PAYABLE,
  calcCoupon,
  couponClaimable,
  couponLabel,
  grantUsable,
  parseProductIds,
  quoteOrder,
  type CouponRule,
} from '../src/lib/coupon'

let pass = 0
let fail = 0
function ok(name: string, cond: boolean, extra = '') {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.error(`  ✗ ${name}${extra ? ` —— ${extra}` : ''}`)
  }
}
function eq(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  ok(name, a === e, `实际 ${a}，期望 ${e}`)
}

const threshold = (min: number, cut: number): CouponRule => ({
  kind: 'THRESHOLD',
  minAmount: min,
  discount: cut,
  productIds: [],
})
const productCoupon = (cut: number, ids: number[]): CouponRule => ({
  kind: 'PRODUCT',
  minAmount: 0,
  discount: cut,
  productIds: ids,
})
const plain = (productId: number, amount: number) => ({ productId, baseAmount: amount })

console.log('\n【满减券】')
{
  const r = calcCoupon(threshold(99, 20), plain(1, 199))
  ok('满99减20：可用', r.usable)
  eq('  实付', r.amount, 179)
  eq('  减免', r.discount, 20)
  eq('  采用', r.applied, 'coupon')
}
{
  const r = calcCoupon(threshold(99, 20), plain(1, 98))
  ok('未达门槛：不可用', !r.usable)
  eq('  原因', r.reject, 'BELOW_THRESHOLD')
  eq('  金额不变', r.amount, 98)
}
{
  const r = calcCoupon(threshold(99, 20), plain(1, 99))
  ok('刚好等于门槛：可用（边界取等号）', r.usable)
  eq('  实付', r.amount, 79)
}

console.log('\n【无门槛券 X1=0】')
{
  const r = calcCoupon(threshold(0, 10), plain(1, 10.5))
  ok('无门槛减10：可用', r.usable)
  eq('  实付', r.amount, 0.5)
}
{
  const r = calcCoupon(threshold(0, 5), plain(1, 5))
  ok('券面额等于订单金额：仍可用，但要留下最低实付', r.usable)
  eq('  实付触底', r.amount, MIN_PAYABLE)
  eq('  实际减免小于券面额', r.discount, 4.99)
}
{
  const r = calcCoupon(threshold(0, 100), plain(1, 3))
  ok('券面额远大于订单金额：不会算出负数', r.usable)
  eq('  实付', r.amount, MIN_PAYABLE)
  ok('  实付恒为正（收款靠唯一金额匹配，0 元付不了款）', r.amount > 0)
}
{
  const r = calcCoupon(threshold(0, 10), plain(1, MIN_PAYABLE))
  ok('订单本身就等于最低实付：抵扣不动，判不可用', !r.usable)
  eq('  原因', r.reject, 'NO_DISCOUNT')
}

console.log('\n【商品券】')
{
  const r = calcCoupon(productCoupon(30, [7, 8]), plain(7, 200))
  ok('命中指定商品：可用', r.usable)
  eq('  实付', r.amount, 170)
}
{
  const r = calcCoupon(productCoupon(30, [7, 8]), plain(9, 200))
  ok('不是指定商品：不可用', !r.usable)
  eq('  原因', r.reject, 'KIND_PRODUCT_MISMATCH')
}
{
  const r = calcCoupon(productCoupon(30, []), plain(9, 200))
  ok('商品券未限定商品：视为不限，可用', r.usable)
}

console.log('\n【内推与券互斥】—— 2026-09-11 起的新规则')
{
  // calcCoupon 已经不认识内推了：它只回答「这张券用在这个金额上能减多少」
  const r = calcCoupon(threshold(100, 50), { productId: 1, baseAmount: 200 })
  ok('普通单：券正常生效', r.usable && r.applied === 'coupon')
  eq('  实付', r.amount, 150)
}

console.log('\n【浮点与取整】—— 金额必须按分算，不能出现 0.1+0.2 那种尾数')
{
  const r = calcCoupon(threshold(0, 0.1), plain(1, 0.3))
  eq('0.30 减 0.10', r.amount, 0.2)
}
{
  const r = calcCoupon(threshold(19.9, 5.55), plain(1, 19.9))
  ok('小数门槛刚好达到：可用', r.usable)
  eq('  实付', r.amount, 14.35)
}
{
  const r = calcCoupon(threshold(0, 33.33), plain(1, 99.99))
  eq('99.99 减 33.33', r.amount, 66.66)
}

console.log('\n【券实例状态】')
const future = new Date(Date.now() + 86400000)
const past = new Date(Date.now() - 86400000)
ok('AVAILABLE + 未过期 → 可用', grantUsable({ state: 'AVAILABLE', expiresAt: future }).ok)
ok('AVAILABLE + 无到期时间（长期有效）→ 可用', grantUsable({ state: 'AVAILABLE', expiresAt: null }).ok)
ok('AVAILABLE 但已过期 → 不可用', !grantUsable({ state: 'AVAILABLE', expiresAt: past }).ok)
ok('LOCKED → 不可用（正被另一单占用）', !grantUsable({ state: 'LOCKED', expiresAt: future }).ok)
ok('USED → 不可用', !grantUsable({ state: 'USED', expiresAt: future }).ok)
ok('VOID → 不可用', !grantUsable({ state: 'VOID', expiresAt: future }).ok)

console.log('\n【批次可领性】')
const base = { status: 'ACTIVE', total: 100, claimed: 0, startAt: null, endAt: null }
ok('正常批次可领', couponClaimable(base).ok)
ok('领完了不可领', !couponClaimable({ ...base, claimed: 100 }).ok)
ok('超发也不可领（claimed > total 的脏数据）', !couponClaimable({ ...base, claimed: 101 }).ok)
ok('PAUSED 不可领', !couponClaimable({ ...base, status: 'PAUSED' }).ok)
ok('ENDED 不可领', !couponClaimable({ ...base, status: 'ENDED' }).ok)
ok('未到开始时间不可领', !couponClaimable({ ...base, startAt: future }).ok)
ok('已过结束时间不可领', !couponClaimable({ ...base, endAt: past }).ok)
ok('在有效期内可领', couponClaimable({ ...base, startAt: past, endAt: future }).ok)

console.log('\n【商品 id 解析】')
eq('正常解析', parseProductIds('1,2,3'), [1, 2, 3])
eq('带空格', parseProductIds(' 1 , 2 '), [1, 2])
eq('空值', parseProductIds(null), [])
eq('剔除非法值', parseProductIds('1,abc,-2,0,3'), [1, 3])

console.log('\n【文案】—— 前后台共用一套，避免两处写得不一样')
eq('满减', couponLabel({ kind: 'THRESHOLD', minAmount: 99, discount: 20 }), '满 ¥99.00 减 ¥20.00')
eq('无门槛', couponLabel({ kind: 'THRESHOLD', minAmount: 0, discount: 10 }), '无门槛减 ¥10.00')
eq('商品券', couponLabel({ kind: 'PRODUCT', minAmount: 0, discount: 30 }), '指定商品减 ¥30.00')


console.log('\n【quoteOrder：全站唯一定价口径】')
/*
 * 规则只有两条（2026-09-11 起）：
 *   ① 走内推 → 按专属价，券不可用
 *   ② 不走内推 → 按定价，券可选
 * 这一组钉死这两条。以前那版「取更优」已废，原因见下面的回归用例。
 */
const T: CouponRule = { kind: 'THRESHOLD', minAmount: 0, discount: 100, productIds: [] }
const q = (rp: number | null, rule: CouponRule | null, qty = 1) =>
  quoteOrder({ productId: 1, listPrice: 1450, quantity: qty, referralUnitPrice: rp, rule })

console.log('  — 普通单（没走内推）')
eq('不选券：就是定价', q(null, null).amount, 1450)
eq('选了券：定价 − 券', q(null, T).amount, 1350)
ok('选了券：标记为 coupon', q(null, T).applied === 'coupon')
eq('不选券时 baseline 也是定价', q(null, null).baseline, 1450)
eq('选券后 discount = 券面额', q(null, T).discount, 100)

console.log('  — 内推单：专属价说了算，券一律不可用')
eq('内推不选券：按专属价', q(1400, null).amount, 1400)
eq('内推选了券：仍按专属价，券不生效', q(1400, T).amount, 1400)
eq('内推：不产生任何减免', q(1400, T).discount, 0)
ok('内推：标记为 referral', q(1400, T).applied === 'referral')
ok('内推 + 传了券：给出可解释的 reject', q(1400, T).reject === 'REFERRAL_ORDER')
ok('内推 + 没传券：不算被拒', q(1400, null).reject === null)
eq('内推：baseline 就是专属价', q(1400, T).baseline, 1400)

/*
 * 【回归用例：站长 2026-09-11 报的那一单】
 * 定价 1700、专属价 1800（推广人加价，差额是他的返现）。
 * 旧代码 `baseline = Math.min(定价, 专属价)` 会取 1700，于是：
 *   商品页 1800 → 结算页 1700 → 收银台 1800，同一单三个价。
 * 现在专属价高于定价也照样按专属价，三处必须都是 1800。
 */
console.log('  — 回归：专属价【高于】定价（旧的 min 逻辑就是死在这里）')
const hi = (rule: CouponRule | null) =>
  quoteOrder({ productId: 1, listPrice: 1700, quantity: 1, referralUnitPrice: 1800, rule })
eq('专属价高于定价：按专属价 1800，不是 min 取的 1700', hi(null).amount, 1800)
eq('专属价高于定价：baseline 同样是 1800', hi(null).baseline, 1800)
eq('专属价高于定价 + 带券：还是 1800', hi(T).amount, 1800)
ok('专属价高于定价：不会被误判成 coupon', hi(T).applied === 'referral')

console.log('  — 专属价等于定价（推广人没单独设价）')
eq('仍按专属价', q(1450, null).amount, 1450)
ok('仍视为内推单，券不可用', q(1450, T).applied === 'referral')
eq('券不生效', q(1450, T).amount, 1450)

console.log('  — 多件')
eq('普通单买 2 件', q(null, null, 2).amount, 2900)
eq('券按整单只减一次，不随数量翻倍', q(null, T, 2).amount, 2800)
eq('内推单买 2 件 = 专属价 × 2', q(1400, null, 2).amount, 2800)
eq('内推单买 2 件带券仍不减', q(1400, T, 2).amount, 2800)

console.log('  — 触底与边界')
const huge: CouponRule = { ...T, discount: 99999 }
eq('券大于应付：兜底到最低可支付金额', q(null, huge).amount, MIN_PAYABLE)
ok('券大于应付：仍算作用了券', q(null, huge).applied === 'coupon')
eq('券大于应付：减免 = 定价 − 兜底价', q(null, huge).discount, Math.round((1450 - MIN_PAYABLE) * 100) / 100)
ok('实付恒为正（V免签靠唯一金额对账，0 元付不了款）', q(null, huge).amount > 0)

console.log('  — 商品券 / 门槛（只在普通单里判）')
const pOnly: CouponRule = { kind: 'PRODUCT', minAmount: 0, discount: 100, productIds: [2] }
const qp = (pid: number) =>
  quoteOrder({ productId: pid, listPrice: 1450, quantity: 1, referralUnitPrice: null, rule: pOnly })
ok('商品券不匹配：不生效', qp(1).applied !== 'coupon')
eq('商品券不匹配：按定价', qp(1).amount, 1450)
ok('商品券不匹配：reject 可解释', qp(1).reject === 'KIND_PRODUCT_MISMATCH')
eq('商品券匹配：正常抵扣', qp(2).amount, 1350)

const gate: CouponRule = { kind: 'THRESHOLD', minAmount: 2000, discount: 100, productIds: [] }
ok('未达门槛：不生效', q(null, gate).applied !== 'coupon')
eq('未达门槛：按定价收，不报错', q(null, gate).amount, 1450)
ok('未达门槛：reject 是 BELOW_THRESHOLD', q(null, gate).reject === 'BELOW_THRESHOLD')

/*
 * 这条恒等式是给订单详情、发票、结算页三处共用的：
 * 它们都会显示「原价 / 优惠 / 实付」，对不上就是客服工单。
 */
console.log('  — 恒等式')
const cases: Array<[number | null, CouponRule | null, number]> = [
  [null, null, 1], [null, T, 1], [1400, null, 1], [1400, T, 1],
  [1800, T, 1], [null, huge, 1], [null, gate, 1], [1400, T, 3], [null, T, 2],
]
ok(
  'baseline − discount === amount（所有分支）',
  cases.every(([rp, rule, qty]) => {
    const r = q(rp, rule, qty)
    return Math.abs(r.baseline - r.discount - r.amount) < 1e-9
  })
)
ok(
  '内推单的 discount 恒为 0',
  cases.filter(([rp]) => rp != null).every(([rp, rule, qty]) => q(rp, rule, qty).discount === 0)
)
ok(
  '任何分支都不会算出负数或 0',
  cases.every(([rp, rule, qty]) => q(rp, rule, qty).amount > 0)
)

/*
 * 【渠道站分支（设计 7.4、7.6，WP2）】渠道站营销全关：按售价成交、discount 恒 0、任何券都拒绝、内推被忽略。
 * 放在 quoteOrder 最前面短路，上面主站的全部断言因此一字不动（主站调用方从不传 channelUnitCents）。
 */
console.log('\n【quoteOrder：渠道站分支】')
const qc = (unitCents: number, rule: CouponRule | null, qty = 1, rp: number | null = null) =>
  quoteOrder({ productId: 1, listPrice: 1450, quantity: qty, referralUnitPrice: rp, rule, channelUnitCents: unitCents })
eq('渠道售价 140.00：按售价成交', qc(14000, null).amount, 140)
ok('渠道单：标记为 channel', qc(14000, null).applied === 'channel')
eq('渠道单：discount 恒为 0', qc(14000, T).discount, 0)
eq('渠道单带券：券不生效，仍按售价', qc(14000, T).amount, 140)
ok('渠道单带券：reject = CHANNEL_ORDER', qc(14000, T).reject === 'CHANNEL_ORDER')
ok('渠道单不带券：不算被拒', qc(14000, null).reject === null)
eq('渠道单忽略内推专属价', qc(14000, null, 1, 1400).amount, 140)
eq('渠道单多件 = 售价 × 件数（按分）', qc(12345, null, 3).amount, 370.35)
ok('渠道单：baseline − discount === amount', [qc(14000, T), qc(1, null, 7), qc(99999, T, 10)].every((r) => Math.abs(r.baseline - r.discount - r.amount) < 1e-9))
let threw = 0
for (const bad of [0, -1, 1.5, Number.NaN]) {
  try {
    qc(bad, null)
  } catch {
    threw++
  }
}
eq('渠道售价非正整数分：一律抛错（不静默算出 0 元单）', threw, 4)
ok('主站调用（不传 channelUnitCents）：行为不变', q(null, T).applied === 'coupon' && q(1400, T).applied === 'referral')
eq('channelUnitCents 显式传 null 等同主站', quoteOrder({ productId: 1, listPrice: 1450, quantity: 1, referralUnitPrice: null, rule: T, channelUnitCents: null }).amount, 1350)

console.log(`\n${'='.repeat(46)}`)
console.log(`通过 ${pass} 条，失败 ${fail} 条`)
console.log('='.repeat(46))
process.exit(fail === 0 ? 0 : 1)
