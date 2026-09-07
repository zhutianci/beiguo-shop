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
/** 没有内推时 referralAmount = baseAmount */
const plain = (productId: number, amount: number) => ({ productId, baseAmount: amount, referralAmount: amount })

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

console.log('\n【与内推不叠加，取更优的一个】')
{
  // 原价 200，内推专属价合计 180，券是满100减50 → 券后 150 更优
  const r = calcCoupon(threshold(100, 50), { productId: 1, baseAmount: 200, referralAmount: 180 })
  ok('券更优：采用券', r.usable && r.applied === 'coupon')
  eq('  实付', r.amount, 150)
}
{
  // 原价 200，内推价 120，券只减 10 → 内推更优，不用券
  const r = calcCoupon(threshold(100, 10), { productId: 1, baseAmount: 200, referralAmount: 120 })
  ok('内推更优：不采用券', !r.usable)
  eq('  实付走内推价', r.amount, 120)
  eq('  采用', r.applied, 'referral')
}
{
  // 两者相等时取券（<= 判定），因为券是买家主动选的，用掉才符合预期
  const r = calcCoupon(threshold(0, 20), { productId: 1, baseAmount: 100, referralAmount: 80 })
  ok('券后价与内推价相等：采用券', r.usable && r.applied === 'coupon')
  eq('  实付', r.amount, 80)
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


console.log('\n【quoteOrder：结算页与下单接口的唯一价格来源】')
/*
 * 这一组是在线上抓到真实缺陷之后补的。
 * 缺陷本身：/api/products?ref=CODE 会把返回给前端的 price **覆盖成推广专属价**，
 * 结算页于是拿「专属价 − 券面额」显示，而服务端拿「定价 − 券面额」建单 ——
 * 买家在弹窗看到 1300、实际被收 1350。两边现在都必须走 quoteOrder。
 */
const T: CouponRule = { kind: 'THRESHOLD', minAmount: 0, discount: 100, productIds: [] }
const q = (rp: number | null, rule: CouponRule | null, qty = 1) =>
  quoteOrder({ productId: 1, listPrice: 1450, quantity: qty, referralUnitPrice: rp, rule })

eq('无内推无券：按定价', q(null, null).amount, 1450)
eq('无内推有券：定价 − 券', q(null, T).amount, 1350)
ok('无内推有券：标记为用了券', q(null, T).applied === 'coupon')

// 专属价 1400、券减 100 → 应付 1350（定价 − 券），**不是** 1300（专属价 − 券）
eq('内推 + 券：不叠加，取更优的一个', q(1400, T).amount, 1350)
eq('内推 + 券：baseline 是专属价', q(1400, T).baseline, 1400)
eq('内推 + 券：减免以 baseline 为准', q(1400, T).discount, 50)
ok('内推 + 券：用券更优时判为 coupon', q(1400, T).applied === 'coupon')

// 券太小、专属价更划算 —— 必须走专属价，且不能因此把订单拒掉
const small: CouponRule = { ...T, discount: 5 }
eq('券不如专属价：按专属价收', q(1400, small).amount, 1400)
eq('券不如专属价：不产生减免', q(1400, small).discount, 0)
ok('券不如专属价：标记为 referral', q(1400, small).applied === 'referral')
ok('券不如专属价：给出可解释的 reject', q(1400, small).reject === 'NOT_BETTER_THAN_REFERRAL')

// 专属价 = 定价（推广人没单独设价）时，券照常生效
eq('专属价等于定价：券仍生效', q(1450, T).amount, 1350)

// 多件：券按整单抵扣一次，不随数量翻倍
eq('买 2 件：基准翻倍', q(null, null, 2).amount, 2900)
eq('买 2 件：券只减一次', q(null, T, 2).amount, 2800)
eq('买 2 件 + 内推：仍取更优', q(1400, T, 2).amount, 2800)

// 券面额大于应付时兜底到 MIN_PAYABLE —— V免签靠唯一金额对账，¥0 的单永远收不到款
const huge: CouponRule = { ...T, discount: 99999 }
eq('券大于应付：兜底到最低可支付金额', q(null, huge).amount, MIN_PAYABLE)
ok('券大于应付：仍算作用了券', q(null, huge).applied === 'coupon')
eq('券大于应付：减免 = 基准 − 兜底价', q(null, huge).discount, Math.round((1450 - MIN_PAYABLE) * 100) / 100)

// 商品券只对指定商品生效
const pOnly: CouponRule = { kind: 'PRODUCT', minAmount: 0, discount: 100, productIds: [2] }
const qp = (pid: number) =>
  quoteOrder({ productId: pid, listPrice: 1450, quantity: 1, referralUnitPrice: null, rule: pOnly })
ok('商品券不匹配：不生效', qp(1).applied !== 'coupon')
eq('商品券不匹配：按原价', qp(1).amount, 1450)
eq('商品券匹配：正常抵扣', qp(2).amount, 1350)

/*
 * 门槛按**商品定价**判定，不按专属价 —— 这是 calcCoupon 里写死的口径，这里钉住它。
 * 定价 1450 达到了 1420 的门槛，所以哪怕专属价 1400 低于门槛，券照样能用：
 * 「走了内推链接反而用不了满减券」买家无法理解，而两条优惠互相影响会让规则说不清。
 * 两者仍然不叠加 —— 1350 是「定价 − 券」，不是「专属价 − 券」的 1300。
 */
const gate: CouponRule = { kind: 'THRESHOLD', minAmount: 1420, discount: 100, productIds: [] }
ok('门槛按定价判：专属价低于门槛也不影响用券', q(1400, gate).applied === 'coupon')
eq('门槛按定价判：仍是定价减券，不是专属价减券', q(1400, gate).amount, 1350)
eq('门槛按定价判：减免相对专属价只有 50', q(1400, gate).discount, 50)

// 定价本身就没到门槛：券用不了，按 baseline 收，且不能因此拒单
const gate2: CouponRule = { kind: 'THRESHOLD', minAmount: 2000, discount: 100, productIds: [] }
ok('定价未达门槛：不生效', q(1400, gate2).applied !== 'coupon')
eq('定价未达门槛：按专属价收', q(1400, gate2).amount, 1400)
ok('定价未达门槛：reject 是 BELOW_THRESHOLD', q(1400, gate2).reject === 'BELOW_THRESHOLD')

// baseline − discount 必须恒等于 amount，否则订单详情三个数对不上
const consistency: Array<[number | null, CouponRule | null]> = [
  [null, null], [null, T], [1400, T], [1400, small], [1400, gate], [1400, gate2], [null, huge],
]
ok(
  'baseline − discount === amount（所有分支）',
  consistency.every(([rp, rule]) => {
    const r = q(rp, rule)
    return Math.abs(r.baseline - r.discount - r.amount) < 1e-9
  })
)
console.log(`\n${'='.repeat(46)}`)
console.log(`通过 ${pass} 条，失败 ${fail} 条`)
console.log('='.repeat(46))
process.exit(fail === 0 ? 0 : 1)
