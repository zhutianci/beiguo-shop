/**
 * 下单有奖 / 会员等级 / 脱敏 / 余额流水 —— 纯函数自测。**不连数据库**。
 *   npx tsx scripts/check-lottery.ts
 *
 * 抽奖概率不靠抽样统计来验：ROLL_SPACE 只有 10000 个取值，直接穷举，
 * 断言每个奖项被选中的次数**恰好**等于它的万分比。抽样测试只能说明「大概对」，
 * 而这里算错万分之一就是实打实多发出去的券。
 */
import {
  ROLL_SPACE,
  bpToPercentText,
  buyerLotteryView,
  canDraw,
  couponExpiresAt,
  isEligibleAtCreation,
  parseRateToBp,
  pickPrize,
  prizeCouponRule,
  prizeInputSchema,
  prizeLabel,
  rateSumAfterEdit,
  sumEnabledBp,
  ORDER_NO_RE,
} from '../src/lib/lottery'
import { maskBuyer, maskEmail, maskNickname, maskOrderNo } from '../src/lib/mask'
import { DEFAULT_VIP_TIERS, normalizeTiers, vipStatusOf, vipTiersSchema } from '../src/lib/vip'
import { referralOrderIdOf } from '../src/lib/balance'

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

console.log('\n【概率解析：百分比文本 → 万分比整数】')
eq('12.5 → 1250', parseRateToBp('12.5'), 1250)
eq('0.01 → 1', parseRateToBp('0.01'), 1)
eq('100 → 10000', parseRateToBp('100'), 10000)
eq('1.05 → 105（不受浮点影响）', parseRateToBp('1.05'), 105)
eq('33.33 → 3333', parseRateToBp('33.33'), 3333)
eq('数字 7 → 700', parseRateToBp(7), 700)
eq('0 → 拒绝', parseRateToBp('0'), null)
eq('0.00 → 拒绝', parseRateToBp('0.00'), null)
eq('100.01 → 拒绝', parseRateToBp('100.01'), null)
eq('1.234 → 拒绝（超过两位小数）', parseRateToBp('1.234'), null)
eq('-5 → 拒绝', parseRateToBp('-5'), null)
eq('abc → 拒绝', parseRateToBp('abc'), null)
eq('1e2 → 拒绝', parseRateToBp('1e2'), null)
eq('空串 → 拒绝', parseRateToBp(''), null)
eq('1250 → 12.5', bpToPercentText(1250), '12.5')
eq('1 → 0.01', bpToPercentText(1), '0.01')
eq('10 → 0.1', bpToPercentText(10), '0.1')
eq('10000 → 100', bpToPercentText(10000), '100')
eq('0 → 0', bpToPercentText(0), '0')

console.log('\n【合计校验】')
const P = (id: number, rateBp: number, enabled = true, sortOrder = 0) => ({ id, rateBp, enabled, sortOrder })
eq('只算启用的', sumEnabledBp([P(1, 3000), P(2, 5000, false), P(3, 2000)]), 5000)
eq('编辑某项后的合计', rateSumAfterEdit([P(1, 3000), P(2, 5000)], 2, { rateBp: 7000, enabled: true }), 10000)
eq('新增一项后的合计', rateSumAfterEdit([P(1, 3000), P(2, 5000)], null, { rateBp: 2001, enabled: true }), 10001)
eq('停用的新项不占概率', rateSumAfterEdit([P(1, 9000)], null, { rateBp: 5000, enabled: false }), 9000)

console.log('\n【选奖：穷举全部 10000 个随机数】')
{
  const prizes = [P(1, 1250, true, 1), P(2, 50, true, 0), P(3, 3000, false, 0), P(4, 700, true, 2)]
  const hits = new Map<number | null, number>()
  for (let r = 0; r < ROLL_SPACE; r++) {
    const p = pickPrize(prizes, r)
    const k = p ? p.id : null
    hits.set(k, (hits.get(k) || 0) + 1)
  }
  eq('奖项 1（12.5%）恰好 1250 次', hits.get(1), 1250)
  eq('奖项 2（0.5%）恰好 50 次', hits.get(2), 50)
  eq('停用奖项 3 一次都不中', hits.get(3) ?? 0, 0)
  eq('奖项 4（7%）恰好 700 次', hits.get(4), 700)
  eq('未中奖恰好 8000 次', hits.get(null), 8000)
  // sortOrder 决定数轴顺序：奖项 2（sortOrder 0）排在最前
  eq('roll=0 落在排序第一的奖项 2', pickPrize(prizes, 0)?.id, 2)
  eq('roll=49 仍是奖项 2', pickPrize(prizes, 49)?.id, 2)
  eq('roll=50 进入奖项 1', pickPrize(prizes, 50)?.id, 1)
  eq('roll=1999 是奖项 4 的最后一格', pickPrize(prizes, 1999)?.id, 4)
  eq('roll=2000 未中奖', pickPrize(prizes, 2000), null)
}
{
  const hits = new Map<number | null, number>()
  const prizes = [P(1, 10000)]
  for (let r = 0; r < ROLL_SPACE; r++) {
    const p = pickPrize(prizes, r)
    hits.set(p ? p.id : null, (hits.get(p ? p.id : null) || 0) + 1)
  }
  eq('100% 的奖项：必中', hits.get(1), ROLL_SPACE)
}
{
  // 配置被改坏、合计 120%：超出部分抽不到，不越界、不报错
  const prizes = [P(1, 7000, true, 0), P(2, 5000, true, 1)]
  let a = 0
  let b = 0
  let none = 0
  for (let r = 0; r < ROLL_SPACE; r++) {
    const p = pickPrize(prizes, r)
    if (!p) none++
    else if (p.id === 1) a++
    else b++
  }
  eq('合计超 100% 时：前一项 7000', a, 7000)
  eq('合计超 100% 时：后一项被截断成 3000', b, 3000)
  eq('合计超 100% 时：未中奖 0', none, 0)
}
eq('空奖池：永远未中奖', pickPrize([], 0), null)
eq('非法随机数 -1', pickPrize([P(1, 10000)], -1), null)
eq('非法随机数 10000', pickPrize([P(1, 10000)], 10000), null)
eq('非法随机数 1.5', pickPrize([P(1, 10000)], 1.5), null)
eq('rateBp=0 的奖项不参与', pickPrize([P(1, 0), P(2, 100)], 0)?.id, 2)

console.log('\n【资格：建单那一刻】')
const cfg = (enabled: boolean, min = 0) => ({ enabled, minOrderAmount: min, rules: '' })
ok('活动关闭：无资格', !isEligibleAtCreation(cfg(false), 100))
ok('活动开启、无门槛：有资格', isEligibleAtCreation(cfg(true), 0.01))
ok('门槛 99.99、订单 99.99：有资格（按分比较）', isEligibleAtCreation(cfg(true, 99.99), 99.99))
ok('门槛 100、订单 99.99：无资格', !isEligibleAtCreation(cfg(true, 100), 99.99))
ok('0 元订单：无资格', !isEligibleAtCreation(cfg(true), 0))
ok('NaN：无资格', !isEligibleAtCreation(cfg(true), NaN))

console.log('\n【能不能抽：订单号 + 本人 + 已付款】')
const order = (userId: number, payStatus = 'PAID', deliveryStatus = 'DELIVERED') => ({ userId, payStatus, deliveryStatus })
const entry = (userId: number, state = 'PENDING') => ({ userId, state })
ok('本人、已付款、有资格：可以抽', canDraw(7, order(7), entry(7)).ok)
{
  const a = canDraw(7, null, null)
  const b = canDraw(7, order(8), entry(8))
  ok('订单不存在与别人的订单：同一句话', !a.ok && !b.ok && a.reason === b.reason && a.status === b.status)
  ok('  …且状态码都是 404', !a.ok && a.status === 404)
}
ok('没有资格行（活动关闭期间下的单）：不能抽', !canDraw(7, order(7), null).ok)
ok('资格行属于别人（数据异常）：不能抽', !canDraw(7, order(7), entry(8)).ok)
ok('未付款：不能抽', !canDraw(7, order(7, 'UNPAID', 'PENDING'), entry(7)).ok)
ok('已退款：不能抽', !canDraw(7, order(7, 'REFUNDED', 'DELIVERED'), entry(7)).ok)
ok('已付款但被取消：不能抽', !canDraw(7, order(7, 'PAID', 'CANCELLED'), entry(7)).ok)
ok('资格已作废：不能抽', !canDraw(7, order(7), entry(7, 'VOID')).ok)
ok('已抽过：放行（由调用方返回上次结果，不重复发奖）', canDraw(7, order(7), entry(7, 'DRAWN')).ok)

console.log('\n【订单号格式】')
ok('标准订单号', ORDER_NO_RE.test('20260911E59909C5'))
ok('短随机段（Math.random 偶尔不足 8 位）', ORDER_NO_RE.test('202609113FA2'))
ok('拒绝小写', !ORDER_NO_RE.test('20260911e59909c5'))
ok('拒绝 SQL 片段', !ORDER_NO_RE.test("2026' OR 1=1"))
ok('拒绝超长', !ORDER_NO_RE.test('2'.repeat(33)))

console.log('\n【奖项录入校验】')
{
  const base = { name: '无门槛 5 元', type: 'COUPON', rate: '10', couponKind: 'THRESHOLD', couponMinAmount: 0, couponDiscount: 5 }
  ok('合法的满减券奖项', prizeInputSchema.safeParse(base).success)
  ok('概率 0：拒绝', !prizeInputSchema.safeParse({ ...base, rate: '0' }).success)
  ok('概率 100.5：拒绝', !prizeInputSchema.safeParse({ ...base, rate: '100.5' }).success)
  ok('券奖项缺面额：拒绝', !prizeInputSchema.safeParse({ ...base, couponDiscount: null }).success)
  ok('券奖项面额为负：拒绝', !prizeInputSchema.safeParse({ ...base, couponDiscount: -1 }).success)
  ok('商品券不指定商品：拒绝', !prizeInputSchema.safeParse({ ...base, couponKind: 'PRODUCT', couponProductIds: '' }).success)
  ok('商品券指定商品：通过', prizeInputSchema.safeParse({ ...base, couponKind: 'PRODUCT', couponProductIds: '3,16' }).success)
  ok('自定义奖品没写兑奖方式：拒绝', !prizeInputSchema.safeParse({ name: '月卡', type: 'CUSTOM', rate: '1' }).success)
  ok(
    '自定义奖品写了说明：通过',
    prizeInputSchema.safeParse({ name: '月卡', type: 'CUSTOM', rate: '1', description: '联系客服兑换' }).success
  )
  ok('未知类型：拒绝', !prizeInputSchema.safeParse({ ...base, type: 'CASH' }).success)
  ok('有效天数 0：拒绝', !prizeInputSchema.safeParse({ ...base, couponValidDays: 0 }).success)
}

console.log('\n【奖项 → 券规则 / 文案】')
eq(
  '满减券规则',
  prizeCouponRule({ couponKind: 'THRESHOLD', couponMinAmount: 100, couponDiscount: 10, couponProductIds: null }),
  { kind: 'THRESHOLD', minAmount: 100, discount: 10, productIds: [] }
)
eq(
  '商品券规则（门槛恒为 0）',
  prizeCouponRule({ couponKind: 'PRODUCT', couponMinAmount: 999, couponDiscount: 20, couponProductIds: '3, 16,x' }),
  { kind: 'PRODUCT', minAmount: 0, discount: 20, productIds: [3, 16] }
)
eq('缺券类型：null（不发参数不明的券）', prizeCouponRule({ couponKind: null, couponMinAmount: 0, couponDiscount: 5, couponProductIds: null }), null)
eq('面额 0：null', prizeCouponRule({ couponKind: 'THRESHOLD', couponMinAmount: 0, couponDiscount: 0, couponProductIds: null }), null)
eq(
  '文案：无门槛 + 有效期',
  prizeLabel({ type: 'COUPON', name: 'x', couponKind: 'THRESHOLD', couponMinAmount: 0, couponDiscount: 5, couponProductIds: null, couponValidDays: 30 }),
  '无门槛减 ¥5.00（30 天有效）'
)
eq(
  '文案：自定义奖品用名称',
  prizeLabel({ type: 'CUSTOM', name: 'Claude Pro 月卡', couponKind: null, couponMinAmount: null, couponDiscount: null, couponProductIds: null }),
  'Claude Pro 月卡'
)
{
  const now = new Date('2026-09-24T00:00:00.000Z')
  eq('有效期 30 天', couponExpiresAt(now, 30)?.toISOString(), '2026-10-24T00:00:00.000Z')
  eq('不设有效期 = 长期', couponExpiresAt(now, null), null)
}

console.log('\n【买家视图：没抽之前不透露任何结果】')
{
  const v = buyerLotteryView({ state: 'PENDING', won: null, prizeName: null, prizeType: null, prizeDetail: null, fulfillState: null, drawnAt: null })
  eq('PENDING：won 为 null', v.won, null)
  eq('PENDING：没有奖项名', v.prizeName, null)
  const lost = buyerLotteryView({ state: 'DRAWN', won: false, prizeName: null, prizeType: null, prizeDetail: null, fulfillState: null, drawnAt: new Date() })
  eq('未中奖：won=false', lost.won, false)
  const won = buyerLotteryView({
    state: 'DRAWN',
    won: true,
    prizeName: '5 元券',
    prizeType: 'COUPON',
    prizeDetail: JSON.stringify({ label: '无门槛减 ¥5.00', description: null, coupon: { kind: 'THRESHOLD', minAmount: 0, discount: 5, productIds: [], validDays: 7, expiresAt: '2026-10-01T00:00:00.000Z' } }),
    fulfillState: null,
    drawnAt: new Date(),
  })
  eq('中奖：文案取快照', won.prizeLabel, '无门槛减 ¥5.00')
  eq('中奖：到期时间取快照', won.expiresAt, '2026-10-01T00:00:00.000Z')
  const broken = buyerLotteryView({ state: 'DRAWN', won: true, prizeName: '奖', prizeType: 'CUSTOM', prizeDetail: '{坏 JSON', fulfillState: 'PENDING', drawnAt: new Date() })
  eq('快照是坏 JSON：退回奖项名，不抛异常', broken.prizeLabel, '奖')
}

console.log('\n【脱敏】')
eq('邮箱', maskEmail('zhutiancy@gmail.com'), 'zh***@gmail.com')
eq('短用户名邮箱只露 1 位', maskEmail('ab@qq.com'), 'a***@qq.com')
eq('坏邮箱', maskEmail('not-an-email'), '匿名用户')
eq('空邮箱', maskEmail(null), '匿名用户')
eq('昵称三字', maskNickname('张小三'), '张*三')
eq('昵称两字', maskNickname('小明'), '小*')
eq('昵称一字', maskNickname('明'), '明*')
eq('长昵称最多 3 个星', maskNickname('abcdefgh'), 'a***h')
eq('emoji 昵称不劈开代理对', maskNickname('😀ab😀'), '😀**😀')
eq('昵称就是邮箱：按邮箱打码', maskBuyer({ nickname: 'hello@qq.com', email: 'x@y.com' }), 'he***@qq.com')
eq('没有昵称：用邮箱', maskBuyer({ nickname: null, email: 'buyer@163.com' }), 'bu***@163.com')
eq('订单号', maskOrderNo('20260911E59909C5'), '20260911****09C5')
eq('短订单号整体打码', maskOrderNo('202609113FA2'), '2026****')
ok('打码后的订单号不能用来抽奖', !ORDER_NO_RE.test(maskOrderNo('20260911E59909C5')))

console.log('\n【余额流水 → 订单】')
eq('新行直接读 orderId', referralOrderIdOf({ type: 'REFERRAL', orderId: 12, note: '订单#99 内推返现' }), 12)
eq('历史行解析 note', referralOrderIdOf({ type: 'REFERRAL', orderId: null, note: '订单#1775 内推返现' }), 1775)
eq('提现流水没有订单', referralOrderIdOf({ type: 'WITHDRAW', orderId: null, note: '订单#1775 内推返现' }), null)
eq('改过的 note 不硬猜', referralOrderIdOf({ type: 'REFERRAL', orderId: null, note: '手工补 订单#12' }), null)

console.log('\n【会员等级】')
{
  const tiers = normalizeTiers(DEFAULT_VIP_TIERS)
  eq('默认 4 档', tiers.length, 4)
  const s0 = vipStatusOf(tiers, 0)
  eq('0 元：普通会员', s0.current.name, '普通会员')
  eq('0 元：下一档白银', s0.next?.name, '白银会员')
  eq('0 元：还差 500', s0.remaining, 500)
  eq('499.99：仍是普通', vipStatusOf(tiers, 499.99).current.level, 0)
  eq('500：白银（按分比较）', vipStatusOf(tiers, 500).current.level, 1)
  eq('1250：白银，进度 50%', vipStatusOf(tiers, 1250).progress, 50)
  const top = vipStatusOf(tiers, 999999)
  eq('最高档：没有下一档', top.next, null)
  eq('最高档：进度 100', top.progress, 100)
  const byAdmin = vipStatusOf(tiers, 0, 2)
  eq('后台手工等级 2：黄金', byAdmin.current.name, '黄金会员')
  ok('  …标记为后台调整', byAdmin.byAdmin)
  eq('后台等级低于消费等级：取高者', vipStatusOf(tiers, 6000, 1).current.level, 3)
  eq('后台等级 99：封顶到最高档', vipStatusOf(tiers, 0, 99).current.level, 3)
  eq('乱序输入会按门槛重排', normalizeTiers([
    { name: 'B', minSpend: 100, benefits: [] },
    { name: 'A', minSpend: 0, benefits: [] },
  ]).map((t) => t.name), ['A', 'B'])
  ok('没有 0 门槛档：拒绝', !vipTiersSchema.safeParse([{ name: 'A', minSpend: 10, benefits: [] }]).success)
  ok('门槛重复：拒绝', !vipTiersSchema.safeParse([{ name: 'A', minSpend: 0, benefits: [] }, { name: 'B', minSpend: 0, benefits: [] }]).success)
  eq('坏配置：回落默认 4 档', normalizeTiers('garbage').length, 4)
}

console.log(`\n通过 ${pass} 条，失败 ${fail} 条`)
process.exit(fail === 0 ? 0 : 1)
