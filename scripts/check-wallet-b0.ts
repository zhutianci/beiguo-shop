/**
 * 钱包 B0 纯函数自测（不连库）：
 *   npx tsx scripts/check-wallet-b0.ts
 *
 * 对应 docs/短信接码-设计.md §12.1：第 7 条（钱包 DTO 不出 note / bizKey）、第 8 条（两格拆分）、
 * 第 115 条（钱包累计数与恒等式）、第 116 条（充值金额校验与 wallet_config 保存校验）；
 * 另加 ledger 的参数校验（方向、bizKey 前缀、orderId）、后台调整的类型映射、流水 orderId 口径、金额换算。
 */
import { splitDebit, splitRefund, centsOf, yuanStr, fmtCents } from '../src/lib/wallet/buckets'
import { validatePost, LEDGER_TYPES, isBizKeyConflict, isRetryableTxError, type PostInput } from '../src/lib/wallet/ledger'
import { walletTotals, totalsIdentity, toWalletLogItem, type TypeSum } from '../src/lib/wallet/dto'
import { checkWalletConfig, validateTopupAmount, FACTORY_WALLET_CONFIG, MAX_TOPUP_CENTS, topupOpenFor } from '../src/lib/wallet/config'
import { planAdjust, isAdjustKind } from '../src/lib/wallet/adjust'
import { BALANCE_TYPE_LABELS, referralOrderIdOf, ledgerOrderIdOf, WALLET_LOG_CATEGORIES } from '../src/lib/balance'

let failed = 0
let passed = 0
function ok(cond: boolean, name: string, detail = '') {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.log(`  ✗ ${name} ${detail}`)
  }
}
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
function throws(fn: () => unknown): boolean {
  try {
    fn()
    return false
  } catch {
    return true
  }
}

console.log('\n[§12.1 第 8 条] splitDebit：先扣充值格，再扣返现格（D32）')
ok(eq(splitDebit(500, 300, 170), { topupCents: 170, cashCents: 0, restCents: 0 }), '充值格够：只扣充值格')
ok(eq(splitDebit(70, 50, 170), { topupCents: 70, cashCents: 50, restCents: 50 }), '两格都不够：扣光，差额 50 分给支付宝')
ok(eq(splitDebit(70, 300, 170), { topupCents: 70, cashCents: 100, restCents: 0 }), '充值不够：扣光充值再扣返现')
ok(eq(splitDebit(0, 0, 170), { topupCents: 0, cashCents: 0, restCents: 170 }), '两格都是 0：全部给支付宝')
ok(eq(splitDebit(500, 300, 0), { topupCents: 0, cashCents: 0, restCents: 0 }), '金额为 0：什么都不扣')
ok(eq(splitDebit(-5, 20, 10), { topupCents: 0, cashCents: 10, restCents: 0 }), '负余额（不该出现）按 0 算，不拆出负数')
ok(throws(() => splitDebit(1.5, 0, 10)), '非整数分：抛错')
ok(throws(() => splitDebit(1, 0, -1)), '应付为负：抛错')

console.log('\n[§12.1 第 8 条] splitRefund：余额部分原路，支付宝部分（含尾差）只进充值格（D4）')
ok(eq(splitRefund(null, 172), { topupCents: 172, cashCents: 0, totalCents: 172 }), '纯支付宝：实收 1.72 全进充值格')
ok(eq(splitRefund({ topupCents: 170, cashCents: 0 }, null), { topupCents: 170, cashCents: 0, totalCents: 170 }), '余额付清：原路回充值格')
ok(eq(splitRefund({ topupCents: 70, cashCents: 50 }, 52), { topupCents: 122, cashCents: 50, totalCents: 172 }), '组合（§4.7：充值 −0.70 · 返现 −0.50 · 支付宝 0.52）：充值 +1.22 · 返现 +0.50')
ok(eq(splitRefund({ topupCents: 0, cashCents: 120 }, 53), { topupCents: 53, cashCents: 120, totalCents: 173 }), '返现格付的原路回返现格；支付宝尾差进充值格，绝不进返现格')
ok(throws(() => splitRefund({ topupCents: -1, cashCents: 0 }, 0)), '负数输入：抛错')

console.log('\n[金额换算] centsOf / yuanStr 不经过浮点乘法')
ok(centsOf('0.29') === 29 && centsOf('16.5') === 1650 && centsOf('-4.00') === -400 && centsOf(0.29) === 29, "centsOf('0.29')=29、'16.5'=1650、'-4.00'=-400、0.29=29")
ok(centsOf({ toString: () => '1234.56' }) === 123456, 'Decimal 形态（toString）按字符串解析')
ok(centsOf(null) === 0 && centsOf(undefined) === 0, '空值 → 0')
ok(throws(() => centsOf('abc')), '不是金额：抛错')
ok(yuanStr(5) === '0.05' && yuanStr(-1234) === '-12.34' && yuanStr(100000) === '1000.00', 'yuanStr')
ok(fmtCents(-50) === '-¥0.50' && fmtCents(2288) === '¥22.88', 'fmtCents')

console.log('\n[ledger.validatePost] 方向、bizKey、orderId（写反方向是程序错误，直接拒绝）')
const base = { userId: 1 }
const P = (x: Partial<PostInput> & Pick<PostInput, 'type'>): PostInput => ({ bizKey: null, ...base, ...x }) as PostInput
ok(validatePost(P({ type: 'REFERRAL', cashDeltaCents: 300, orderId: 9 })) === null, 'REFERRAL：返现格 +、bizKey 为空、带 orderId')
ok(validatePost(P({ type: 'REFERRAL', cashDeltaCents: 300, topupDeltaCents: 1, orderId: 9 })) !== null, 'REFERRAL 动充值格：拒绝')
ok(validatePost(P({ type: 'REFERRAL', cashDeltaCents: 300, orderId: 9, bizKey: 'adj:x' })) !== null, 'REFERRAL 带 bizKey：拒绝')
ok(validatePost(P({ type: 'HOLD', topupDeltaCents: -70, cashDeltaCents: -50, orderId: 12, bizKey: 'hold:12' })) === null, 'HOLD：两格负、hold:<orderId>')
ok(validatePost(P({ type: 'HOLD', topupDeltaCents: -70, orderId: 12, bizKey: 'hold:13' })) !== null, 'HOLD 的 bizKey 与 orderId 对不上：拒绝')
ok(validatePost(P({ type: 'HOLD', topupDeltaCents: 70, orderId: 12, bizKey: 'hold:12' })) !== null, 'HOLD 方向写反：拒绝')
ok(validatePost(P({ type: 'HOLD', topupDeltaCents: -70, orderId: 12 })) !== null, 'HOLD 没有 bizKey：拒绝')
ok(validatePost(P({ type: 'RELEASE', topupDeltaCents: 70, cashDeltaCents: 50, orderId: 12, bizKey: 'release:12' })) === null, 'RELEASE：两格正')
ok(validatePost(P({ type: 'REFUND', topupDeltaCents: 122, cashDeltaCents: 50, orderId: 12, bizKey: 'refund:12' })) === null, 'REFUND：两格正')
ok(validatePost(P({ type: 'TOPUP', topupDeltaCents: 1003, orderId: 5, bizKey: 'topup:5' })) === null, 'TOPUP：只进充值格')
ok(validatePost(P({ type: 'TOPUP', cashDeltaCents: 1003, orderId: 5, bizKey: 'topup:5' })) !== null, 'TOPUP 进返现格：拒绝（套现通道）')
ok(validatePost(P({ type: 'LATEPAY', topupDeltaCents: 52, orderId: 5, bizKey: 'latepay:vmq_unmatched:1-a' })) === null, 'LATEPAY：只进充值格')
ok(validatePost(P({ type: 'LATEPAY', cashDeltaCents: 52, orderId: 5, bizKey: 'latepay:k' })) !== null, 'LATEPAY 进返现格：拒绝')
ok(validatePost(P({ type: 'WITHDRAW', cashDeltaCents: -500, bizKey: 'adj:abc' })) === null, 'WITHDRAW：返现格 −、adj:')
ok(validatePost(P({ type: 'WITHDRAW', topupDeltaCents: -500, bizKey: 'adj:abc' })) !== null, '从充值格提现：拒绝')
ok(validatePost(P({ type: 'WITHDRAW', cashDeltaCents: -500 })) === null, 'WITHDRAW 不带请求号（旧后台页面）：兼容放行')
ok(validatePost(P({ type: 'TOPUP_REFUND', topupDeltaCents: -500, bizKey: 'topup_refund:2026092922001400000000001' })) === null, 'TOPUP_REFUND：充值格 −、topup_refund:<流水号>')
ok(validatePost(P({ type: 'TOPUP_REFUND', topupDeltaCents: -500 })) !== null, 'TOPUP_REFUND 没有流水号：拒绝')
ok(validatePost(P({ type: 'ADJUST', topupDeltaCents: 100, cashDeltaCents: 100, bizKey: 'adj:x' })) !== null, 'ADJUST 一次调两格：拒绝')
ok(validatePost(P({ type: 'CLAWBACK', cashDeltaCents: -100, topupDeltaCents: -200, orderId: 3, bizKey: 'clawback:3' })) === null, 'CLAWBACK：两格负')
ok(validatePost(P({ type: 'CLAWBACK', orderId: 3, bizKey: 'clawback:3', allowZero: true })) === null, 'CLAWBACK 扣回 0（两格都空）：allowZero 放行，占住 bizKey')
ok(validatePost(P({ type: 'ADJUST', bizKey: 'adj:x', allowZero: true })) !== null, '其它类型 0 元流水：拒绝')
ok(validatePost(P({ type: 'ADJUST', cashDeltaCents: 1.5, bizKey: 'adj:x' } as never)) !== null, '非整数分：拒绝')
ok(validatePost(P({ type: 'ADJUST', cashDeltaCents: 100, bizKey: 'x'.repeat(65) })) !== null, 'bizKey 超过 64：拒绝')
ok(validatePost(P({ type: 'ADJUST', cashDeltaCents: 100, bizKey: 'hold:1' })) !== null, 'ADJUST 用 hold: 前缀：拒绝')
ok(validatePost({ ...P({ type: 'ADJUST', cashDeltaCents: 1 }), type: 'LATE' as never }) !== null, '未知类型：拒绝')
ok(isBizKeyConflict({ code: 'P2002', meta: { target: 'balance_logs_biz_key_key' } }) && !isBizKeyConflict({ code: 'P2002', meta: { target: ['order_id'] } }), 'isBizKeyConflict 只认 biz_key 的唯一冲突')
ok(isRetryableTxError({ code: 'P2034' }) && isRetryableTxError({ message: 'Deadlock found when trying to get lock (1213)' }) && !isRetryableTxError({ code: 'P2002' }), 'isRetryableTxError：P2034 / 1213 重试，其余不重试')

console.log('\n[balance.ts] 流水类型标签与 orderId 口径（§5.2、§6.6 第 1 条）')
ok(LEDGER_TYPES.every((t) => !!BALANCE_TYPE_LABELS[t]), '10 种流水类型都有中文标签')
ok(
  BALANCE_TYPE_LABELS.TOPUP === '充值' &&
    BALANCE_TYPE_LABELS.HOLD === '接码付款（余额部分）' &&
    BALANCE_TYPE_LABELS.RELEASE === '订单关闭 · 预扣退回' &&
    BALANCE_TYPE_LABELS.REFUND === '接码退款' &&
    BALANCE_TYPE_LABELS.LATEPAY === '付款退回余额' &&
    BALANCE_TYPE_LABELS.CLAWBACK === '返现扣回' &&
    BALANCE_TYPE_LABELS.TOPUP_REFUND === '充值退还',
  '标签与 §1.15 逐字一致',
)
ok(referralOrderIdOf({ type: 'REFERRAL', orderId: 7 }) === 7, 'REFERRAL 读 orderId 列')
ok(referralOrderIdOf({ type: 'REFERRAL', orderId: null, note: '订单#123 内推返现' }) === 123, 'REFERRAL 历史行从 note 解析')
ok(referralOrderIdOf({ type: 'HOLD', orderId: 55 }) === null, 'HOLD 流水的 orderId 不是返现订单（原来只要 orderId>0 就原样返回）')
ok(referralOrderIdOf({ type: 'ADJUST', orderId: null, note: '订单#123 内推返现' }) === null, '非 REFERRAL 的备注不解析')
ok(ledgerOrderIdOf({ type: 'HOLD', orderId: 55 }) === 55 && ledgerOrderIdOf({ type: 'TOPUP', orderId: 8 }) === 8 && ledgerOrderIdOf({ type: 'LATEPAY', orderId: 9 }) === 9, 'ledgerOrderIdOf：接码与充值流水给本人订单')
ok(ledgerOrderIdOf({ type: 'REFERRAL', orderId: 7 }) === null && ledgerOrderIdOf({ type: 'CLAWBACK', orderId: 7 }) === null && ledgerOrderIdOf({ type: 'ADJUST', orderId: null }) === null, 'ledgerOrderIdOf：返现 / 扣回 / 调整不给')
const catTypes = Object.values(WALLET_LOG_CATEGORIES).flat() as string[]
ok(LEDGER_TYPES.every((t) => catTypes.filter((c) => c === t).length === 1), '钱包分类筛选：每种类型恰好属于一类')

console.log('\n[§12.1 第 115 条] 钱包累计数（lib/wallet/dto.ts 的 walletTotals）')
{
  // 一组流水：充值 50.04（两笔）；两张接码单预扣（一张 CAPTURED 16.68+16.68，一张 RELEASED 2.00）；一张仍 HELD 1.20；
  // 一张组合单退款 1.70（含支付宝部分）；迟到付款 0.52；推荐返现 6.00；扣回 1.50；提现 1.00；历史只动返现格的调整 0.30
  const sums: TypeSum[] = [
    { type: 'TOPUP', cashCents: 0, topupCents: 5004 },
    { type: 'HOLD', cashCents: -300, topupCents: -3336 - 200 - 120 + 300 }, // 预扣合计 |HOLD| = 3336 + 200 + 120
    { type: 'RELEASE', cashCents: 0, topupCents: 200 },
    { type: 'REFUND', cashCents: 50, topupCents: 120 },
    { type: 'LATEPAY', cashCents: 0, topupCents: 52 },
    { type: 'REFERRAL', cashCents: 600, topupCents: 0 },
    { type: 'CLAWBACK', cashCents: -150, topupCents: 0 },
    { type: 'WITHDRAW', cashCents: -100, topupCents: 0 },
    { type: 'ADJUST', cashCents: 30, topupCents: 0 },
  ]
  const held = 120
  const t = walletTotals(sums, held)
  ok(t.topupIn === 5004, '累计充值 = Σ TOPUP', String(t.topupIn))
  ok(t.spent === 3336, '累计消费 = Σ|HOLD| − Σ RELEASE − 仍 HELD（只算余额部分）', String(t.spent))
  ok(t.refunded === 170 + 52, '累计退回 = Σ REFUND（全额）+ Σ LATEPAY', String(t.refunded))
  ok(t.referral === 450, '返现 = Σ REFERRAL − Σ|CLAWBACK|', String(t.referral))
  ok(t.withdrawn === 100, '已提现 = −Σ WITHDRAW', String(t.withdrawn))
  const available = sums.reduce((a, s) => a + s.cashCents + s.topupCents, 0)
  ok(available + held === totalsIdentity(t), '恒等式：可用余额 + 预扣中 = 累计充值 − 累计消费 + 累计退回 + 返现 − 已提现 ± 调整 − 充值退还', `${available + held} vs ${totalsIdentity(t)}`)
  // RELEASE 不进任何累计：再来一笔「预扣 → 释放」，累计数一个都不变
  const t2 = walletTotals(
    sums.map((s) => (s.type === 'HOLD' ? { ...s, topupCents: s.topupCents - 999 } : s.type === 'RELEASE' ? { ...s, topupCents: s.topupCents + 999 } : s)),
    held,
  )
  ok(eq(t, t2), 'RELEASE 不进任何累计数（预扣后释放，累计数不变）')
  // §1.15 的示意：累计充值 ¥50.04 − 累计消费 ¥33.36 + 累计退回 ¥1.70 = 充值格 ¥18.38
  const ex = walletTotals(
    [
      { type: 'TOPUP', cashCents: 0, topupCents: 5004 },
      { type: 'HOLD', cashCents: 0, topupCents: -3336 },
      { type: 'REFUND', cashCents: 0, topupCents: 170 },
    ],
    0,
  )
  ok(ex.topupIn - ex.spent + ex.refunded === 1838, '§1.15 示意数字：¥50.04 − ¥33.36 + ¥1.70 = ¥18.38')
  ok(eq(walletTotals([], 0), { topupIn: 0, spent: 0, refunded: 0, referral: 0, withdrawn: 0, adjust: 0, topupRefund: 0 }), '没有流水：全 0')
  const legacy = walletTotals(
    [
      { type: 'REFERRAL', cashCents: 1650, topupCents: 0 },
      { type: 'WITHDRAW', cashCents: -400, topupCents: 0 },
    ],
    0,
  )
  ok(legacy.referral === 1650 && legacy.withdrawn === 400 && totalsIdentity(legacy) === 1250, 'B0 之前的历史只有返现与提现两项：恒等式同样成立')
}

console.log('\n[§12.1 第 7 条] 钱包 DTO 白名单：不出 note、bizKey')
{
  const row = {
    id: 1,
    type: 'HOLD',
    delta: '-0.50',
    balanceAfter: '4.00',
    topupDeltaCents: -70,
    topupAfterCents: 1868,
    createdAt: new Date('2026-09-29T06:00:00Z'),
    note: '内部备注：别的买家的订单 #999',
    bizKey: 'hold:12',
    orderId: 12,
    userId: 3,
  }
  const item = toWalletLogItem(row, { kind: 'SMS', orderNoMasked: '2026****5521', title: 'Telegram · 印尼' })
  const keys: string[] = []
  const walk = (v: unknown) => {
    if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) {
      keys.push(k)
      walk(x)
    }
  }
  walk(item)
  const forbidden = ['note', 'bizKey', 'biz_key', 'userId', 'orderId', 'cost', 'costCents', 'cap', 'saleCoef4', 'costFx4', 'activationId', 'raw']
  ok(!keys.some((k) => forbidden.includes(k)), `序列化结果里没有被禁止的字段名（${forbidden.join(' / ')}）`, keys.join(','))
  ok(!JSON.stringify(item).includes('内部备注') && !JSON.stringify(item).includes('hold:12'), '备注与 bizKey 的内容也不出现')
  ok(item.deltaCents === -120 && item.cashDeltaCents === -50 && item.topupDeltaCents === -70 && item.afterCents === 2268, '两格之和与拆分正确（−¥1.20 = 充值 −0.70 · 返现 −0.50；余额 ¥22.68）')
  const legacyItem = toWalletLogItem({ ...row, type: 'REFERRAL', delta: '3.30', balanceAfter: '16.50', topupDeltaCents: 0, topupAfterCents: null }, null)
  ok(legacyItem.afterCents === 1650 && legacyItem.typeLabel === '推荐返现', '历史流水（topup_after_cents 为空）变动后总余额按「返现格 + 0」')
}

console.log('\n[§12.1 第 116 条] 充值金额校验（整数元、在 [minCents, maxCents] 内、与充值格余额无关）')
{
  const cfg = FACTORY_WALLET_CONFIG
  for (const c of [500, 1000, 1500, 2000, 5000]) ok(validateTopupAmount(c, cfg) === null, `档位 ${c / 100} 元通过`)
  for (const c of [100, 100000, 1200]) ok(validateTopupAmount(c, cfg) === null, `自定义 ${c} 分通过`)
  for (const c of [0, 50, 99, 1250, 100100, -500, 12.5, NaN, '1000' as unknown as number]) ok(validateTopupAmount(c, cfg) !== null, `${String(c)} 拒绝`)
  ok(validateTopupAmount(1250, cfg) === '请输入 1–1000 之间的整数金额', '出厂配置下的文案是「请输入 1–1000 之间的整数金额」')
  ok(validateTopupAmount(100000, { ...cfg }) === null, '与充值格现有余额无关（没有总额上限参数，充值格 ¥1,000,000 时充 ¥1,000 照样通过）')
  const low = { ...cfg, maxCents: 50000 }
  ok(validateTopupAmount(50100, low) === '请输入 1–500 之间的整数金额', 'maxCents=50000 时拒绝 50100，文案按配置拼「1–500」')
  ok(MAX_TOPUP_CENTS === 100000, 'MAX_TOPUP_CENTS 是代码常量 ¥1,000')
}

console.log('\n[§12.1 第 116 条] wallet_config 保存校验（zod）')
{
  const f = { ...FACTORY_WALLET_CONFIG, tiersCents: [...FACTORY_WALLET_CONFIG.tiersCents] }
  ok(checkWalletConfig(f).ok, '出厂配置通过')
  const bad = (patch: Record<string, unknown>, name: string, field: string) => {
    const r = checkWalletConfig({ ...f, ...patch })
    ok(!r.ok && Object.keys(r.errors).some((k) => k === field || k.startsWith(`${field}.`)), name, JSON.stringify(r))
  }
  bad({ tiersCents: [500, 550, 1000] }, '档位 550（¥5.5）拒绝', 'tiersCents')
  bad({ minCents: 150 }, 'minCents=150（不是整数元）拒绝', 'minCents')
  bad({ maxCents: 100100 }, 'maxCents=100100（超过 MAX_TOPUP_CENTS）拒绝', 'maxCents')
  bad({ minCents: 3000, maxCents: 2000, tiersCents: [2000] }, 'minCents > maxCents 拒绝', 'minCents')
  bad({ maxCents: 2000 }, '档位 5000 而 maxCents=2000（档位不在区间内）拒绝', 'tiersCents')
  bad({ minCents: 0 }, 'minCents=0 拒绝', 'minCents')
  bad({ pendingTopupPerUser: 4 }, 'pendingTopupPerUser=4 拒绝', 'pendingTopupPerUser')
  bad({ tiersCents: [1000, 500] }, '档位不是升序 拒绝', 'tiersCents')
  bad({ tiersCents: [500, 500] }, '档位重复 拒绝', 'tiersCents')
  bad({ tiersCents: [] }, '没有档位 拒绝', 'tiersCents')
  bad({ tiersCents: [100, 200, 300, 400, 500, 600, 700, 800, 900] }, '档位 9 个 拒绝', 'tiersCents')
  bad({ topupAudience: 'SOME' }, '受众不是 ADMIN_ONLY / ALL 拒绝', 'topupAudience')
  bad({ balancePayEnabled: 'yes' }, '开关不是布尔 拒绝', 'balancePayEnabled')
  ok(!checkWalletConfig(null).ok && !checkWalletConfig('x').ok, '不是对象：拒绝')
  ok(checkWalletConfig({ ...f, maxCents: 50000 }).ok, '调低上限到 ¥500：通过（D36：支付宝风控时只改配置不发版）')
  ok(!topupOpenFor(f, true) && !topupOpenFor(null, true), '出厂充值关闭；配置读不到按关闭')
  ok(topupOpenFor({ ...f, topupEnabled: true }, true) && !topupOpenFor({ ...f, topupEnabled: true }, false), '仅管理员：管理员开、普通用户关')
  ok(topupOpenFor({ ...f, topupEnabled: true, topupAudience: 'ALL' }, false), '全部用户：普通用户也开')
}

console.log('\n[§7.8] 后台调整的类型映射（不能记 LATEPAY）')
{
  const rid = '0f8fad5b-d9cb-469f-a165-70867728950e'
  ok(eq(planAdjust({ kind: 'CASH_ADD', amountCents: 500, requestId: rid }), { type: 'ADJUST', topupDeltaCents: 0, cashDeltaCents: 500, bizKey: `adj:${rid}` }), '返现格 + → ADJUST（adj:<requestId>）')
  ok(eq(planAdjust({ kind: 'CASH_SUB', amountCents: 500, requestId: rid }), { type: 'WITHDRAW', topupDeltaCents: 0, cashDeltaCents: -500, bizKey: `adj:${rid}` }), '返现格 − → WITHDRAW')
  ok(eq(planAdjust({ kind: 'TOPUP_ADD', amountCents: 500, requestId: rid }), { type: 'ADJUST', topupDeltaCents: 500, cashDeltaCents: 0, bizKey: `adj:${rid}` }), '充值格 + → ADJUST（补偿）')
  ok(eq(planAdjust({ kind: 'TOPUP_SUB', amountCents: 500, requestId: rid, alipayNo: '2026092922001411111111111111' }), { type: 'TOPUP_REFUND', topupDeltaCents: -500, cashDeltaCents: 0, bizKey: 'topup_refund:2026092922001411111111111111' }), '充值格 − → TOPUP_REFUND（topup_refund:<流水号>，与请求号无关）')
  ok(typeof planAdjust({ kind: 'TOPUP_SUB', amountCents: 500, requestId: rid }) === 'string', '充值退还不填流水号：拒绝')
  ok(typeof planAdjust({ kind: 'TOPUP_SUB', amountCents: 500, requestId: rid, alipayNo: 'abc123' }) === 'string', '流水号不是 16–32 位数字：拒绝')
  ok(eq(planAdjust({ kind: 'CLAWBACK', amountCents: 300, referralOrderId: 77 }), { type: 'CLAWBACK', topupDeltaCents: 0, cashDeltaCents: -300, bizKey: 'clawback:77' }), '返现扣回 → CLAWBACK（clawback:<订单 id>）')
  ok(typeof planAdjust({ kind: 'CASH_ADD', amountCents: 0, requestId: rid }) === 'string' && typeof planAdjust({ kind: 'CASH_ADD', amountCents: -5, requestId: rid }) === 'string', '金额 ≤ 0：拒绝')
  ok(typeof planAdjust({ kind: 'CASH_ADD', amountCents: 5, requestId: 'not-a-uuid' }) === 'string', '请求号格式不对：拒绝')
  ok(!isAdjustKind('LATEPAY') && !isAdjustKind('HOLD') && isAdjustKind('CLAWBACK'), '传 LATEPAY / HOLD 不是合法的调整类型（接口 400）')
}

console.log(`\n通过 ${passed} 条，失败 ${failed} 条`)
if (failed) {
  console.log('❌ 有失败')
  process.exit(1)
}
console.log('全部通过 ✅')
