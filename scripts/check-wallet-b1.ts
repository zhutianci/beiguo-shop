/**
 * 短信接码 · B1 充值与载体订单框架 —— 纯函数检查（不连库）。docs/短信接码-设计.md §12.1 第 116、117 条，外加 B1 自己的纯函数：
 *
 *   npx tsx scripts/check-wallet-b1.ts
 *
 *   · 第 116 条 充值金额校验与 wallet_config 保存校验（按配置拼文案，不写死 1–1000）
 *   · 第 117 条 迟到付款「数据验证唯一」：六个条件逐条单独违反都「不自动」，全部满足返回 C；冷却关 → 不自动；
 *     窗口里有别的 bizType（发票税费）同额收款单 → 不自动；C 的冷却期已过（到账 > createdAt + 35 分钟）→ 不自动
 *   · 收银台 next 白名单（safeNext）、充值单内部 remark 的拼 / 解、returnTo 白名单、clientToken
 *   · 应付统一函数（payableFrom）、订单口径帮手（excludeTopup / excludeCarriers / isCarrierType）
 *   · 迟到退入的金额上界（¥1,000.49）、支付宝交易号格式、条目金额解析、条目里的订单 id
 *   · 《余额与充值规则》正文（开票范围、上下限写「以充值页为准」、不承诺原路退回）
 *   · ledger.validatePost 对 TOPUP / LATEPAY 的 bizKey 口径（latepay:<条目 key> 不超过 64）
 */
import { validateTopupAmount, checkWalletConfig, FACTORY_WALLET_CONFIG, MAX_TOPUP_CENTS, topupOpenFor } from '../src/lib/wallet/config'
import {
  decideUniqueClosed,
  entryCents,
  amountInRange,
  LATEPAY_MAX_CENTS,
  TRADE_NO_RE,
  ENTRY_KEY_RE,
  orderIdsInEntry,
  type VmqRowLite,
} from '../src/lib/wallet/latepay'
import {
  buildTopupRemark,
  parseTopupRemark,
  normalizeReturnTo,
  normalizeClientToken,
  topupProductName,
  TOPUP_REMARK_PREFIX,
} from '../src/lib/wallet/topup'
import { validatePost } from '../src/lib/wallet/ledger'
import { safeNext } from '../src/lib/pay-next'
import { payableFrom } from '../src/lib/order-payable'
import { excludeTopup, excludeCarriers, isCarrierType, CARRIER_NO_INVOICE_MSG } from '../src/lib/order-scope'
import { WALLET_TERMS, WALLET_TERMS_VERSION } from '../src/lib/terms/jiema-wallet'

let pass = 0
let fail = 0
function ok(cond: boolean, name: string) {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.error(`  ✗ ${name}`)
  }
}

console.log('\n[第 116 条] 充值金额校验（整数元、在 [minCents, maxCents] 内；与充值格现有余额无关）')
{
  const f = FACTORY_WALLET_CONFIG
  for (const t of [500, 1000, 1500, 2000, 5000]) ok(validateTopupAmount(t, f) === null, `档位 ${t / 100} 元通过`)
  ok(validateTopupAmount(100, f) === null && validateTopupAmount(100000, f) === null && validateTopupAmount(1200, f) === null, '自定义 ¥1、¥1,000、¥12 通过')
  for (const [v, why] of [
    [0, '0'],
    [50, '¥0.5'],
    [99, '99 分'],
    [1250, '¥12.5（不是整数元）'],
    [100100, '¥1,001'],
    [-500, '负数'],
    [12.5, '非整数分'],
    ['500', '字符串'],
    [null, 'null'],
    [Number.NaN, 'NaN'],
  ] as [unknown, string][]) {
    ok(validateTopupAmount(v, f) === '请输入 1–1000 之间的整数金额', `${why} 拒绝，文案「请输入 1–1000 之间的整数金额」`)
  }
  ok(MAX_TOPUP_CENTS === 100000, 'MAX_TOPUP_CENTS = ¥1,000（代码常量）')
  const low = { ...f, maxCents: 50000 }
  ok(checkWalletConfig({ ...low, tiersCents: [500, 1000, 1500, 2000, 5000] }).ok, '调低上限到 ¥500：配置通过')
  ok(validateTopupAmount(50100, low) === '请输入 1–500 之间的整数金额', 'maxCents=50000：¥501 拒绝，文案「请输入 1–500 之间的整数金额」')
  ok(validateTopupAmount(50000, low) === null, 'maxCents=50000：¥500 通过')
  ok(!checkWalletConfig({ ...f, tiersCents: [550, 1000] }).ok, '档位 ¥5.5：拒绝保存')
  ok(!checkWalletConfig({ ...f, maxCents: 100100 }).ok, 'maxCents=100100（超过 MAX_TOPUP_CENTS）：拒绝保存')
  ok(!checkWalletConfig({ ...f, minCents: 150 }).ok, 'minCents=150（不是整数元）：拒绝保存')
  ok(!checkWalletConfig({ ...f, minCents: 5000, maxCents: 2000, tiersCents: [2000] }).ok, 'minCents > maxCents：拒绝保存')
  ok(!checkWalletConfig({ ...f, maxCents: 2000 }).ok, '档位 ¥50 而 maxCents=¥20：拒绝保存')
  ok(!checkWalletConfig({ ...f, minCents: 0 }).ok, 'minCents=0：拒绝保存')
  ok(!checkWalletConfig({ ...f, pendingTopupPerUser: 4 }).ok, 'pendingTopupPerUser=4：拒绝保存')
  ok(checkWalletConfig(f).ok, '出厂配置通过')
  ok(topupOpenFor({ ...f, topupEnabled: true }, true) && !topupOpenFor({ ...f, topupEnabled: true }, false), 'B1：充值打开 + 仅管理员 → 管理员开、普通用户关')
  ok(!topupOpenFor(f, true), '出厂 topupEnabled=false：管理员也关')
}

console.log('\n[第 117 条] 迟到付款「数据验证唯一」（六个条件）')
{
  const MIN = 60_000
  const T = 20
  const CD = 15
  const ctx = { timeoutMin: T, cooldownMin: CD }
  const created = new Date('2026-09-29T06:00:00Z')
  const at = created.getTime() + 21 * MIN // 收银台 20 分钟超时关单后 1 分钟才付
  const closedCarrier = { carrier: true, tenantId: 1, payStatus: 'UNPAID', deliveryStatus: 'CANCELLED' }
  const C: VmqRowLite = { id: 10, orderId: 'VC', bizType: 'order', bizId: 100, type: 2, state: -1, reallyCents: 1203, createdAt: created, order: closedCarrier }
  const entry = { cents: 1203, type: 2, at, repeatForward: false }
  const all = decideUniqueClosed(entry, [C], ctx)
  ok(all.ok && all.vmq.id === 10, '六个条件都满足：返回 C')
  // ① C 不满足（逐项）
  ok(!decideUniqueClosed(entry, [{ ...C, state: 0 }], ctx).ok, '① C 不是 −1（还在待支付）：不自动')
  ok(!decideUniqueClosed(entry, [{ ...C, order: { ...closedCarrier, carrier: false } }], ctx).ok, '① C 的订单不是载体单（普通商品）：不自动')
  ok(!decideUniqueClosed(entry, [{ ...C, order: { ...closedCarrier, tenantId: 2 } }], ctx).ok, '① C 的订单不在主站：不自动')
  ok(!decideUniqueClosed(entry, [{ ...C, order: { ...closedCarrier, deliveryStatus: 'PENDING' } }], ctx).ok, '① C 的订单没关（UNPAID 未取消）：不自动')
  ok(!decideUniqueClosed(entry, [{ ...C, order: { ...closedCarrier, payStatus: 'PAID', deliveryStatus: 'DELIVERED' } }], ctx).ok, '① C 的订单已付款：不自动')
  ok(!decideUniqueClosed(entry, [{ ...C, bizType: 'invoice', order: null }], ctx).ok, '① C 是发票税费收款单：不自动')
  ok(!decideUniqueClosed(entry, [{ ...C, type: 1 }], ctx).ok, '① C 的渠道 type 不同：不自动')
  ok(!decideUniqueClosed(entry, [{ ...C, reallyCents: 1204 }], ctx).ok, '① C 的金额不同：不自动')
  // ② 冷却
  const offCd = decideUniqueClosed({ ...entry, at: created.getTime() + 5 * MIN }, [C], { timeoutMin: T, cooldownMin: 0 })
  ok(!offCd.ok && offCd.why === 'COOLDOWN_OFF', '② VMQ_REUSE_COOLDOWN_MIN=0（付完马上取消、5 分钟到账）：不自动（COOLDOWN_OFF）')
  ok(!decideUniqueClosed(entry, [C], { timeoutMin: T, cooldownMin: 0 }).ok, '② VMQ_REUSE_COOLDOWN_MIN=0（超时后 1 分钟到账）：不自动')
  const late = decideUniqueClosed({ ...entry, at: created.getTime() + 35 * MIN + 1000 }, [C], ctx)
  ok(!late.ok, '② C 的冷却期已过（到账 > createdAt + 35 分钟）：不自动')
  ok(decideUniqueClosed({ ...entry, at: created.getTime() + 35 * MIN }, [C], ctx).ok, '② 恰好 createdAt + 35 分钟：仍在冷却期内，自动')
  // ③ 窗口里别的同额收款单（任何 bizType、任何状态）
  const other = (p: Partial<VmqRowLite>): VmqRowLite => ({ id: 11, orderId: 'VO', bizType: 'order', bizId: 101, type: 2, state: 1, reallyCents: 1203, createdAt: new Date(created.getTime() - 10 * MIN), order: { carrier: false, tenantId: 1, payStatus: 'PAID', deliveryStatus: 'DELIVERED' }, ...p })
  ok(!decideUniqueClosed(entry, [C, other({})], ctx).ok, '③ C 活着之前 10 分钟有一张已付的同额收款单（冷却被回退绕过）：不自动')
  ok(!decideUniqueClosed(entry, [C, other({ bizType: 'invoice', order: null, state: 0 })], ctx).ok, '③ 窗口里有一张发票税费的同额收款单：不自动')
  ok(!decideUniqueClosed(entry, [C, other({ createdAt: new Date(at - MIN), state: 0 })], ctx).ok, '③ 关单之后、到账之前又新建了同额收款单：不自动')
  ok(decideUniqueClosed(entry, [C, other({ createdAt: new Date(at + MIN) })], ctx).ok, '③ 到账之后才建的同额收款单不算（不在窗口里）')
  ok(decideUniqueClosed(entry, [C, other({ createdAt: new Date(created.getTime() - 36 * MIN), state: 1 })], ctx).ok, '③ 窗口之外（C 之前 36 分钟）的已付同额收款单不影响③')
  // ④ 近 24 小时别的已关闭同额收款单
  const closed2 = other({ state: -1, createdAt: new Date(created.getTime() - 5 * 3600_000), order: { carrier: false, tenantId: 1, payStatus: 'UNPAID', deliveryStatus: 'CANCELLED' } })
  ok(!decideUniqueClosed(entry, [C, closed2], ctx).ok, '④ 近 24 小时有别的同额、已关闭的收款单（它也可能是主人）：不自动')
  ok(decideUniqueClosed(entry, [C, { ...closed2, createdAt: new Date(at - 25 * 3600_000) }], ctx).ok, '④ 25 小时前的已关闭同额收款单不算')
  ok(!decideUniqueClosed(entry, [C, { ...C, id: 12, orderId: 'VC2', bizId: 102 }], ctx).ok, '① 两张都像 C（多个候选）：不自动')
  // ⑤ 重复转发
  const rf = decideUniqueClosed({ ...entry, repeatForward: true }, [C], ctx)
  ok(!rf.ok && rf.why === 'REPEAT_FORWARD', '⑤ repeatForward：不自动')
  // 没有候选
  const none = decideUniqueClosed(entry, [], ctx)
  ok(!none.ok && none.why === 'NO_CANDIDATE', '没有任何收款单：NO_CANDIDATE（普通到账，与载体单无关）')
  ok(!decideUniqueClosed({ ...entry, at: created.getTime() - MIN }, [C], ctx).ok, 'C 在到账之后才建：不是候选')
}

console.log('\n[收银台 next 白名单]')
{
  ok(safeNext('/wallet?topup=20260929ABCDEFGH') === '/wallet?topup=20260929ABCDEFGH', '钱包充值结果页：放行')
  ok(safeNext('/jiema/order/2026092914035521') === '/jiema/order/2026092914035521', '号码页：放行')
  for (const bad of ['//evil.com', 'https://evil.com/wallet?topup=1234567890', '/wallet?topup=abc', '/wallet?topup=1234567890&x=1', '/orders', '/jiema/order/../admin', 'javascript:alert(1)', '/jiema/order/2026092914035521/x', null, 1])
    ok(safeNext(bad) === null, `拒绝 ${String(bad)}`)
}

console.log('\n[充值单内部 remark / returnTo / clientToken / 商品名]')
{
  const tok = '0f8fad5b-d9cb-469f-a165-70867728950e'
  ok(normalizeClientToken(tok) === tok && normalizeClientToken(tok.toUpperCase()) === tok, 'UUID 通过（统一小写）')
  ok(normalizeClientToken('abc') === null && normalizeClientToken('0f8fad5b-d9cb-469f-a165-70867728950e|x') === null && normalizeClientToken(null) === null, '不是 UUID：拒绝')
  ok(normalizeReturnTo('/jiema?s=tg&c=6&op=any&confirm=1') === '/jiema?s=tg&c=6&op=any&confirm=1', 'returnTo /jiema?…：放行')
  ok(normalizeReturnTo('/jiema') === '/jiema', 'returnTo /jiema：放行')
  for (const bad of ['//evil.com/jiema', '/wallet', 'https://bigolab.com/jiema', '/jiema?a=' + 'x'.repeat(120), '/jiema?x=1|return:/evil', '/jiemax', '/\\evil'])
    ok(normalizeReturnTo(bad) === null, `returnTo 拒绝 ${bad.slice(0, 40)}`)
  const r = buildTopupRemark({ clientToken: tok, termsVersion: WALLET_TERMS_VERSION, returnTo: '/jiema?s=tg&c=6' })
  ok(r === `topup|ct:${tok}|terms:${WALLET_TERMS_VERSION}|return:/jiema?s=tg&c=6`, 'remark 形如 topup|ct:<token>|terms:<版本>|return:<回跳>')
  ok(r.startsWith(TOPUP_REMARK_PREFIX), 'remark 以 topup|ct: 开头（幂等查找按前缀）')
  const p = parseTopupRemark(r)
  ok(!!p && p.clientToken === tok && p.termsVersion === WALLET_TERMS_VERSION && p.returnTo === '/jiema?s=tg&c=6', '拼了再解：三项都回来')
  const p2 = parseTopupRemark(buildTopupRemark({ clientToken: tok, termsVersion: WALLET_TERMS_VERSION, returnTo: null }))
  ok(!!p2 && p2.returnTo === null, '没有 returnTo：解出 null')
  ok(parseTopupRemark('支付方式: 支付宝') === null && parseTopupRemark(null) === null, '不是充值单的 remark：null')
  const longest = buildTopupRemark({ clientToken: tok, termsVersion: WALLET_TERMS_VERSION, returnTo: '/jiema?' + 'a'.repeat(113) })
  ok(longest.length <= 255, `最长的 remark ${longest.length} 字 ≤ 255`)
  ok(topupProductName(5000) === '余额充值 ¥50.00' && topupProductName(100) === '余额充值 ¥1.00', '商品名快照「余额充值 ¥50.00」')
}

console.log('\n[应付统一函数 payableFrom = amount + invoiceTaxFee − HELD 预扣]')
{
  ok(payableFrom({ amount: '10.00', invoiceTaxFee: null }, 0) === 1000, '没有税费、没有预扣：= amount')
  ok(payableFrom({ amount: '100.00', invoiceTaxFee: '6.00' }, 0) === 10600, '有税费：货款 + 税费（与改造前逐分相同）')
  ok(payableFrom({ amount: '1.70', invoiceTaxFee: null }, 120) === 50, '组合单：¥1.70 − 预扣 ¥1.20 = ¥0.50')
  ok(payableFrom({ amount: '1.70', invoiceTaxFee: null }, 170) === 0, '余额付清：0（收银台不收 0 元）')
  ok(payableFrom({ amount: '0.29', invoiceTaxFee: null }, 0) === 29, '0.29 不因浮点变成 28')
}

console.log('\n[订单口径帮手]')
{
  ok(JSON.stringify(excludeTopup()) === JSON.stringify({ product: { deliveryType: { not: 'TOPUP' } } }), 'excludeTopup：product.deliveryType ≠ TOPUP')
  ok(JSON.stringify(excludeCarriers()) === JSON.stringify({ product: { deliveryType: { notIn: ['SMS_POOL', 'TOPUP'] } } }), 'excludeCarriers：两种载体都排除（首页实时成交）')
  ok(excludeTopup() !== excludeTopup(), '每次返回新对象（调用方改了不影响别处）')
  ok(isCarrierType('TOPUP') && isCarrierType('SMS_POOL') && !isCarrierType('SMS') && !isCarrierType('AUTO') && !isCarrierType(null), 'isCarrierType：只认 SMS_POOL / TOPUP（旧单品 SMS 不是）')
  ok(CARRIER_NO_INVOICE_MSG === '暂不支持开票，可联系客服开票处理', '开票 / 收据拒绝文案逐字（D37）')
}

console.log('\n[迟到退入：金额上界、交易号、条目]')
{
  ok(LATEPAY_MAX_CENTS === 100049, '上界 = MAX_TOPUP_CENTS + 49 = ¥1,000.49（不读配置）')
  ok(amountInRange(100049) && !amountInRange(100050) && !amountInRange(0) && !amountInRange(null) && amountInRange(1), '0 < 金额 ≤ ¥1,000.49')
  ok(entryCents({ price: '12.03' }) === 1203 && entryCents({ price: '1000.49' }) === 100049, '条目金额按字符串解析到分')
  ok(entryCents({ price: '1.00 / 2.00' }) === null && entryCents({ price: '' }) === null, '多金额（ambiguous_amount）、空金额解析不出单个金额')
  ok(TRADE_NO_RE.test('2026092922001400001234567890') && TRADE_NO_RE.test('1234567890123456') && !TRADE_NO_RE.test('123456789012345') && !TRADE_NO_RE.test('1'.repeat(33)) && !TRADE_NO_RE.test('20260929 2200140000') && !TRADE_NO_RE.test('2026092922001400001234567890a'), '支付宝交易号：16–32 位数字')
  ok(ENTRY_KEY_RE.test('vmq_unmatched:1727590000000-0a1b2c3d') && !ENTRY_KEY_RE.test('vmq_unmatched:1-x'), '条目 key 形如 vmq_unmatched:<13 位毫秒>-<8 hex>')
  ok(`latepay_trade:${'1'.repeat(32)}`.length <= 50 && `latepay:vmq_unmatched:1727590000000-0a1b2c3d`.length <= 64, '占位行 key ≤ 50（settings.key）、流水 bizKey ≤ 64')
  ok(JSON.stringify(orderIdsInEntry({ biz: 'order#12', candidates: ['V1(order#13)', 'V2(invoice#9)', 'V3(order#12)'] }).sort()) === JSON.stringify([12, 13]), '条目里的订单 id：biz 与 candidates 去重、只认 order#')
}

console.log('\n[ledger：TOPUP / LATEPAY 的记账口径]')
{
  const key = 'vmq_unmatched:1727590000000-0a1b2c3d'
  ok(validatePost({ userId: 1, topupDeltaCents: 1003, type: 'TOPUP', bizKey: 'topup:5', orderId: 5 }) === null, 'TOPUP：充值格 +、bizKey topup:<orderId>')
  ok(validatePost({ userId: 1, topupDeltaCents: 1003, type: 'TOPUP', bizKey: 'topup:6', orderId: 5 }) !== null, 'TOPUP：bizKey 与 orderId 不一致拒绝')
  ok(validatePost({ userId: 1, cashDeltaCents: 1003, type: 'TOPUP', bizKey: 'topup:5', orderId: 5 }) !== null, 'TOPUP：不能进返现格（套现通道）')
  ok(validatePost({ userId: 1, topupDeltaCents: 52, type: 'LATEPAY', bizKey: `latepay:${key}`, orderId: 5 }) === null, 'LATEPAY：充值格 +、bizKey latepay:<条目 key>')
  ok(validatePost({ userId: 1, cashDeltaCents: 52, type: 'LATEPAY', bizKey: `latepay:${key}`, orderId: 5 }) !== null, 'LATEPAY：不能进返现格')
  ok(validatePost({ userId: 1, topupDeltaCents: 52, type: 'LATEPAY', bizKey: null, orderId: 5 }) !== null, 'LATEPAY：必须带 bizKey')
}

console.log('\n[《余额与充值规则》正文（§8.4）]')
{
  const all = WALLET_TERMS.join('\n')
  ok(WALLET_TERMS.length === 5, '五条')
  ok(/^\d{4}-\d{2}-\d{2}$/.test(WALLET_TERMS_VERSION), `版本号是日期 ${WALLET_TERMS_VERSION}`)
  ok(all.includes('余额充值与短信接码订单（不论用余额还是支付宝付款）暂不支持自助开票，可联系客服开票处理'), '开票一句覆盖全部接码单（不是只限「充值与余额消费」）')
  ok(!all.includes('充值与用余额支付的订单'), '没有只覆盖一部分的说法')
  ok(all.includes('以充值页为准（目前 ¥1–1,000，整数元）') && all.includes('不设充值余额总额上限'), '上下限写「以充值页为准」、不设总额上限')
  ok(!all.includes('原路退回'), '不承诺「原路退回」（Q9）')
  ok(all.includes('充值余额不可提现'), '充值余额不可提现')
}

console.log(`\n通过 ${pass} 条，失败 ${fail} 条`)
if (fail) process.exit(1)
