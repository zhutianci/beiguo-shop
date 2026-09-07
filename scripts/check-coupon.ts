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

console.log(`\n${'='.repeat(46)}`)
console.log(`通过 ${pass} 条，失败 ${fail} 条`)
console.log('='.repeat(46))
process.exit(fail === 0 ? 0 : 1)
