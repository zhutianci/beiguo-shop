/**
 * 短信接码 S2a 纯函数自测（不连库、不发请求）：
 *   npx tsx scripts/check-jiema-engine.ts
 *
 * 对应 docs/短信接码-设计.md：
 *   · §12.1 第 9 条 成本核算 settleCost（一个 charged；换号后第二个 charged；两个都 charged（E14 ③）；全部未 charged；CANCELLED 返回 null、
 *     EXPIRED / RECON 只算 lossCents；售后退款利润 = −成本；upstreamRefundMicro 冲回；还有尝试未终态 → costFinal=false）；
 *   · 第 99 条 的 S2 部分：waitUntil（普通 20 分钟号 = max(canCancelAt, endsAt − 45 秒)；有效期 > 21 分钟的号 longWaitOk=false → 取号 + 19 分钟、
 *     true → endsAt − 45 秒；activationEndTime 无效按 20 分钟号；判定只看取号返回）；
 *   · 第 121 条 上游余额：affordable（== 通过、差 1 微美元不通过、cap < 6700 按 6700、UNKNOWN / 空不通过）；inflightMicro 逐项（本单不计；口径A 的
 *     respondedAt 界线、REQUESTING / UNKNOWN 按 eff(maxPrice)、「请求早于缓存、响应晚于缓存」计入、FAILED 与未扣费 CANCELLED 不计；口径B 未扣费四态都计、
 *     缓存之前已收码的不计、之后的计、EXPIRED 按 closedAt；A、B 取较大不相加（$0.41 / $0.66 / $0.27 → $0.93）；ACQUIRING 单与它自己的 REQUESTING
 *     只计一次；C 的 READY / ACQUIRING / PENDING_PAY 四种情况与「锁价已过期、收银台仍有效」计入、锁价过期且没有 0/1 收款单与已取消的不计；
 *     旧单品 WAITING 在 B 里计、numberAt ≤ balanceAt 时不进 A）；shouldAlertLow（$2.00 不推、$1.99 首推、5 分钟后不推、6 小时后再推、回升重置、
 *     UNKNOWN 不推、没有任何停售输出）；
 *   · T2 的 READY 判定（对账补履约且晚于锁价 + 20 分钟 → READY；到账路径当场履约晚到也 ACQUIRING）；E16 截止时间；E5 线程重置与余量；
 *     E1 重试间隔与运营商降级；D43 本站 / 上游口径的停售判定；§2.4 时钟校准、候选（宽口径 / 严口径）、旧单品备注里的旧号；号码拆分；
 *   · 第 7 条 DTO：号码页视图序列化后遍历键名，被禁止的字段一个都没有；退款原因文案不出现上游名称。
 */
import {
  settleCost,
  waitUntilFor,
  endsAtFrom,
  canCancelAtFrom,
  isLongNumber,
  finishDueAt,
  paidTarget,
  nextThreadsReset,
  acquireDelaySec,
  operatorForTry,
  localComboVerdict,
  upstreamComboVerdict,
  upstreamAccountVerdict,
  threadsLimitOf,
  threadsRoom,
  parseThreadsNote,
  calibrationOffsetMs,
  claimCandidates,
  legacyOldPhones,
  phoneParts,
  payModeOf,
  isAttemptTerminal,
  isOrderTerminal,
  FALLBACK_DURATION_SEC,
  type CostAttemptLike,
} from '../src/lib/jiema/machine'
import { inflightMicro, affordable, eff, type InflightSnapshot, type InflightAttempt, type InflightOrder } from '../src/lib/jiema/gate'
import { shouldAlertLow, LOW_REALERT_MS } from '../src/lib/jiema/runtime'
import { toJiemaOrderView, FORBIDDEN_BUYER_KEYS, collectKeyNames, refundReasonText, REFUND_REASON_TEXT, pollMsFor, type JiemaOrderView } from '../src/lib/jiema/dto'
import { FACTORY_SMS_CONFIG } from '../src/lib/jiema-config-schema'
import { acquireClaimWindow } from '../src/lib/jiema/upstream'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failed++
    console.log(`  ✗ ${name}`)
  }
}
const T = (iso: string) => new Date(iso)
const S = 1000
const M = 60_000

console.log('\n【§12.1 第 9 条 成本核算 settleCost（成本汇率 7.20 → costFx4=72000，售价 ¥2.46）】')
{
  const order = (state: string) => ({ state, priceCents: 246, costFx4: 72000 })
  const a = (x: Partial<CostAttemptLike>): CostAttemptLike => ({ state: 'FINISHED', charged: false, costMicro: 120_000, maxPriceMicro: 150_000, upstreamRefundMicro: null, ...x })
  // §4.7「完成后自动核算的例子」：第 1 个号 $0.12 被换掉（上游退费，不计），第 2 个号实扣 $0.13 收码 → 94 分、利润 ¥1.52
  let r = settleCost(order('FINISHED'), [a({ state: 'CANCELLED', costMicro: 120_000 }), a({ state: 'FINISHED', charged: true, costMicro: 130_000 })])
  ok(r.chargedMicro === 130_000 && r.costCents === 94 && r.profitCents === 152 && r.costFinal === true && r.lossCents === null, '换号后第二个 charged：只计新号 ⌈93.6⌉=94 分、利润 152、全部终态 → 定稿')
  r = settleCost(order('FINISHED'), [a({ charged: true, costMicro: 120_000 })])
  ok(r.chargedMicro === 120_000 && r.costCents === 87 && r.profitCents === 159, '一个 charged：⌈86.4⌉=87 分、利润 159')
  r = settleCost(order('FINISHED'), [a({ state: 'CANCELLED', charged: true, costMicro: 120_000 }), a({ charged: true, costMicro: 130_000 })])
  ok(r.chargedMicro === 250_000 && r.costCents === 180 && r.profitCents === 66, '两个都 charged（E14 ③）：两个号都计，⌈180⌉=180 分')
  r = settleCost(order('FINISHED'), [a({ state: 'CANCELLED' }), a({ state: 'CANCELLED' })])
  ok(r.chargedMicro === 0 && r.costCents === 0 && r.profitCents === 246, '全部未 charged：成本 0、利润 = 售价')
  r = settleCost(order('CANCELLED'), [a({ state: 'CANCELLED', charged: true, costMicro: 600_000 })])
  ok(r.chargedMicro === null && r.costCents === null && r.profitCents === null && r.lossCents === 432 && r.costFinal === false, '已取消：成本利润扣费一律 null；EXPIRED 扣费只写 lossCents = ⌈600,000 × 72,000 ÷ 10⁸⌉ = 432')
  r = settleCost(order('CANCELLED'), [a({ state: 'CANCELLED' }), a({ state: 'FAILED', costMicro: null })])
  ok(r.lossCents === null && r.costCents === null, '已取消且没有扣费：lossCents 也是 null（不是 0）')
  r = settleCost(order('REFUNDED'), [a({ charged: true, costMicro: 130_000 })])
  ok(r.costCents === 94 && r.profitCents === -94 && r.costFinal === true, '售后退款：成本照计、利润 = −成本')
  r = settleCost(order('REFUNDED'), [a({ charged: true, costMicro: 130_000, upstreamRefundMicro: 130_000 })])
  ok(r.chargedMicro === 0 && r.costCents === 0 && r.profitCents === 0, 'upstreamRefundMicro 冲回（R6）：利润 = −成本 + 冲回')
  r = settleCost(order('FINISHED'), [a({ charged: true, costMicro: 130_000 }), a({ state: 'RELEASING', charged: false })])
  ok(r.costFinal === false && r.costCents === 94, '还有尝试未终态（被换下的号还在 RELEASING）→ costFinal=false（预估）')
  r = settleCost(order('RECEIVED'), [a({ state: 'RECEIVED', charged: true, costMicro: 130_000 })])
  ok(r.costFinal === false && r.profitCents === 152, 'RECEIVED 写预估（costFinal=false）')
  r = settleCost(order('FINISHED'), [a({ charged: true, costMicro: null, maxPriceMicro: 150_000 })])
  ok(r.chargedMicro === 150_000 && r.costCents === 108, 'charged 却没有 costMicro（文本形态取号）→ 按上限计，利润宁低勿高')
}

console.log('\n【§12.1 第 99 条 waitUntil 与截止时间（D42、T12、E16）】')
{
  const resp = T('2026-09-29T10:00:00Z')
  const cc = canCancelAtFrom(resp)
  ok(cc.getTime() === resp.getTime() + 123 * S, '可取消 = 响应 + 123 秒（120 + 3 秒余量）')
  const end20 = endsAtFrom(T('2026-09-29T10:20:00Z'), resp)
  ok(end20.getTime() === T('2026-09-29T10:20:00Z').getTime(), 'activationEndTime 在 [响应 + 5 分钟, 响应 + 3 小时] → 采用')
  ok(endsAtFrom(null, resp).getTime() === resp.getTime() + FALLBACK_DURATION_SEC * S && endsAtFrom(T('2026-09-29T10:03:00Z'), resp).getTime() === resp.getTime() + (20 * 60 - 30) * S && endsAtFrom(T('2026-09-29T14:00:00Z'), resp).getTime() === resp.getTime() + (20 * 60 - 30) * S, '无效 / 太近 / 太远 → 响应 + 20 分钟 − 30 秒')
  ok(waitUntilFor({ startAt: resp, canCancelAt: cc, endsAt: end20, longWaitOk: false }).getTime() === end20.getTime() - 45 * S, '普通 20 分钟号：endsAt − 45 秒')
  const end60 = new Date(resp.getTime() + 60 * M)
  ok(isLongNumber(resp, end60) && !isLongNumber(resp, end20) && !isLongNumber(resp, new Date(resp.getTime() + 21 * M)), '有效期 > 21 分钟才算例外时长（= 21 分钟不算）')
  ok(waitUntilFor({ startAt: resp, canCancelAt: cc, endsAt: end60, longWaitOk: false }).getTime() === resp.getTime() + 19 * M, '60 分钟号、longWaitOk=false → 取号 + 19 分钟（不会等到第 59 分钟）')
  ok(waitUntilFor({ startAt: resp, canCancelAt: cc, endsAt: end60, longWaitOk: true }).getTime() === end60.getTime() - 45 * S, '60 分钟号、longWaitOk=true → endsAt − 45 秒')
  const endShort = new Date(resp.getTime() + 150 * S)
  ok(waitUntilFor({ startAt: resp, canCancelAt: cc, endsAt: endShort, longWaitOk: false }).getTime() === cc.getTime(), '截止很近时不早于可取消时刻（max(canCancelAt, …)）')
  ok(finishDueAt(end20).getTime() === end20.getTime() - 30 * S, '收码的号到期前 30 秒完成')
}

console.log('\n【T2：READY 只在对账补履约且晚于锁价 + 20 分钟时写（§12.2 第 17 条）】')
{
  const q = T('2026-09-29T10:00:00Z')
  const late = new Date(q.getTime() + 21 * M)
  ok(paidTarget({ now: late, quoteExpiresAt: q, via: 'VMQ', payDate: new Date(late.getTime() - 4 * M) }) === 'READY', '对账补履约（距到账 ≥3 分钟）且晚于锁价 + 20 分钟 → READY')
  ok(paidTarget({ now: late, quoteExpiresAt: q, via: 'VMQ', payDate: new Date(late.getTime() - 10 * S) }) === 'ACQUIRING', '反例：到账路径当场履约（距到账几秒），哪怕晚于锁价 + 20 分钟 → ACQUIRING')
  ok(paidTarget({ now: new Date(q.getTime() + 19 * M), quoteExpiresAt: q, via: 'VMQ', payDate: new Date(q.getTime()) }) === 'ACQUIRING', '锁价 + 20 分钟以内 → ACQUIRING')
  ok(paidTarget({ now: late, quoteExpiresAt: q, via: 'BALANCE', payDate: null }) === 'READY' && paidTarget({ now: q, quoteExpiresAt: q, via: 'BALANCE', payDate: null }) === 'ACQUIRING', '余额付清：T19 迟于锁价 + 20 分钟才补推进 → READY，否则 ACQUIRING')
}

console.log('\n【E1 / E2 / E5：重试间隔、运营商降级、线程受限】')
{
  ok(acquireDelaySec(0) === 0 && acquireDelaySec(1) === 20 && acquireDelaySec(2) === 45 && acquireDelaySec(3) === 70, '首次取号间隔 0、20、45 秒（之后每 25 秒）')
  ok(operatorForTry({ operator: 'tmobile', fallback: true, countedTries: 0, hadPriceMissWithOperator: false }) === 'tmobile', '第 1 次按指定运营商')
  ok(operatorForTry({ operator: 'tmobile', fallback: true, countedTries: 1, hadPriceMissWithOperator: false }) === null, '允许改任意的，第 2 次起改任意（E1）')
  ok(operatorForTry({ operator: 'tmobile', fallback: true, countedTries: 0, hadPriceMissWithOperator: true }) === null, 'WRONG_MAX_PRICE 之后先按任意运营商重试（E2）')
  ok(operatorForTry({ operator: 'tmobile', fallback: false, countedTries: 2, hadPriceMissWithOperator: true }) === 'tmobile', '不允许改任意的一直按指定运营商')
  const r = nextThreadsReset(T('2026-09-29T20:59:00Z'))
  ok(r.toISOString() === '2026-09-29T21:00:00.000Z' && nextThreadsReset(T('2026-09-29T21:00:00Z')).toISOString() === '2026-09-30T21:00:00.000Z', '线程受限到下一个 21:00 UTC（恰好 21:00 → 第二天）')
  ok(threadsLimitOf({ maxAllowed: 10, currentThreads: 10 }) === 10 && threadsLimitOf({ maxAllowed: -1, currentThreads: 8 }) === 8 && threadsLimitOf({ maxAllowed: null, currentThreads: null }) === 0 && threadsLimitOf(null) === 0, '上限：max_allowed > 0 用它；−1（规格示例）用 current_threads；都没有 = 0')
  ok(threadsRoom({ limit: 10, upstreamInUse: 7, ourAcquiring: 1, legacyReserve: 1 }) && !threadsRoom({ limit: 10, upstreamInUse: 8, ourAcquiring: 1, legacyReserve: 1 }), '上游在用 + 我方在途 < 上限 − 1（给旧单品留 1 个）')
  const n = parseThreadsNote(JSON.stringify({ maxAllowed: 10, currentThreads: 9 }))
  ok(n?.maxAllowed === 10 && n.currentThreads === 9 && parseThreadsNote('坏的') === null, 'threads 记录的 note 是 JSON')
}

console.log('\n【D43：本站口径（≥8 个号 0 收码、≥20 个号 <12%）与上游口径（组合 ≥70 且 <8%、账户 ≥350 且 <5%）】')
{
  const p = FACTORY_SMS_CONFIG.autoHold
  ok(localComboVerdict(8, 0, p) === 'ZERO' && localComboVerdict(7, 0, p) === null, '8 个号 0 收码 → 停售；7 个不停')
  ok(localComboVerdict(20, 2, p) === 'RATIO' && localComboVerdict(20, 3, p) === null && localComboVerdict(19, 1, p) === null, '20 个号 2 个收码（10%）→ 停售；3 个（15%）不停；19 个不看比率')
  ok(upstreamComboVerdict(70, 5, p) && !upstreamComboVerdict(70, 6, p) && !upstreamComboVerdict(69, 0, p), '上游组合 70 个号 5 个成功（7.1%）→ 停售；6 个（8.6%）不停；69 个不看')
  ok(upstreamAccountVerdict(350, 17, p) && !upstreamAccountVerdict(350, 18, p) && !upstreamAccountVerdict(349, 0, p), '账户 350 个号 17 个成功（4.9%）→ 收紧换号；18 个不收紧')
}

console.log('\n【§2.4 认领：时钟校准、候选（宽 / 严口径）、旧单品备注里的旧号】')
{
  const base = T('2026-09-29T10:00:00Z').getTime()
  const samples = [5, 1, 3].map((sec) => ({ respondedAt: new Date(base), upstreamCreatedAt: new Date(base + sec * S) }))
  ok(calibrationOffsetMs(samples) === 3000 && calibrationOffsetMs([]) === null, '中位数偏差 3 秒；没有样本 → null（不做自动认领）')
  ok(calibrationOffsetMs(samples.slice(0, 2)) === 3000, '偶数个样本取中间两个的平均')
  const win = acquireClaimWindow({ requestedAtMs: base, sentAtMs: base + 500 })
  const u = { service: 'tg', country: 6, operator: 'telkomsel', maxPriceMicro: 187_500, window: win }
  const list = [
    { id: '1', service: 'tg', country: 6, operator: 'telkomsel', priceMicro: 150_000, createdAt: new Date(base + 2 * S + 3 * S) },
    { id: '2', service: 'tg', country: 6, operator: 'axis', priceMicro: 150_000, createdAt: new Date(base + 2 * S + 3 * S) },
    { id: '3', service: 'tg', country: 6, operator: 'telkomsel', priceMicro: 200_000, createdAt: new Date(base + 5 * S) },
    { id: '4', service: 'tg', country: 6, operator: 'telkomsel', priceMicro: 150_000, createdAt: new Date(base + 60 * S) },
    { id: '5', service: 'wa', country: 6, operator: 'telkomsel', priceMicro: 150_000, createdAt: new Date(base + 2 * S) },
  ]
  const c = claimCandidates(u, list, 3000)
  ok(c.broad.map((x) => x.id).join(',') === '1,2,3' && c.strict.map((x) => x.id).join(',') === '1', '宽口径只按服务 / 国家 / 时间窗（1、2、3）；严口径再加运营商与价格（只剩 1）；窗外的 4、别的服务 5 不算')
  const noOp = claimCandidates({ ...u, operator: null }, list, 3000)
  ok(noOp.strict.map((x) => x.id).join(',') === '1,2', '没指定运营商：严口径不比运营商')
  ok(legacyOldPhones('接码换号 1/3（旧号 6281234567890 已取消）\n接码换号 2/3（旧号 +16175550000 已取消）').join(',') === '6281234567890,16175550000' && legacyOldPhones(null).length === 0, '旧单品备注里换下的号码（旧表只保存当前号）')
}

console.log('\n【§3.2 在途占用 inflightMicro 与 affordable（§12.1 第 121 条）】')
{
  const bt = T('2026-09-29T10:00:00Z')
  const now = new Date(bt.getTime() + 60 * S)
  const before = new Date(bt.getTime() - 30 * S)
  const after = new Date(bt.getTime() + 30 * S)
  const at = (x: Partial<InflightAttempt>): InflightAttempt => ({ smsOrderId: 9, state: 'ACTIVE', costMicro: 100_000, maxPriceMicro: 125_000, respondedAt: before, charged: false, chargeSource: null, codeAt: null, closedAt: null, ...x })
  const ord = (x: Partial<InflightOrder>): InflightOrder => ({ smsOrderId: 50, state: 'PENDING_PAY', capMicro: 200_000, quoteExpiresAt: new Date(now.getTime() + 5 * M), payMode: 'ALIPAY', orderCancelled: false, openVmq: false, paidVmq: false, ...x })
  const snap = (attempts: InflightAttempt[], orders: InflightOrder[] = [], legacy: InflightSnapshot['legacy'] = []): InflightSnapshot => ({ attempts, orders, legacy })

  let r = inflightMicro(snap([at({ respondedAt: before })]), bt, null, now)
  ok(r.a === 0 && r.b === 100_000, '口径A：respondedAt ≤ balanceAt 的 ACTIVE 不计；口径B：未扣费的 ACTIVE 计')
  r = inflightMicro(snap([at({ respondedAt: after })]), bt, null, now)
  ok(r.a === 100_000, '口径A：respondedAt > balanceAt 的计实扣价')
  r = inflightMicro(snap([at({ state: 'REQUESTING', respondedAt: null, costMicro: null, maxPriceMicro: 5_000 })]), bt, null, now)
  ok(r.a === 6_700 && r.b === 6_700, 'REQUESTING / UNKNOWN 按 eff(maxPriceMicro) 计（5,000 → 6,700），两种口径都计')
  r = inflightMicro(snap([at({ state: 'UNKNOWN', respondedAt: null, costMicro: null })]), bt, null, now)
  ok(r.a === 125_000 && r.b === 125_000, 'UNKNOWN 同样按上限计')
  r = inflightMicro(snap([at({ respondedAt: after, codeAt: null })]), new Date(bt.getTime()), null, now)
  ok(r.a === 100_000, '请求早于缓存、响应晚于缓存的号计入口径A（按 respondedAt 而不是 requestedAt）')
  r = inflightMicro(snap([at({ state: 'FAILED', respondedAt: after }), at({ state: 'CANCELLED', respondedAt: after, charged: false })]), bt, null, now)
  ok(r.a === 0 && r.b === 0, 'FAILED 与未扣费的 CANCELLED 都不计')
  r = inflightMicro(snap([at({ state: 'RELEASING' }), at({ state: 'REQUESTING', respondedAt: null, costMicro: null })]), bt, null, now)
  ok(r.b === 100_000 + 125_000, '口径B：未扣费的 RELEASING / REQUESTING 都计')
  r = inflightMicro(snap([at({ state: 'RECEIVED', charged: true, chargeSource: 'SMS', codeAt: before })]), bt, null, now)
  ok(r.b === 0 && r.a === 0, '口径B：缓存之前已收码（codeAt ≤ balanceAt）的 RECEIVED 不计')
  r = inflightMicro(snap([at({ state: 'RECEIVED', charged: true, chargeSource: 'SMS', codeAt: after })]), bt, null, now)
  ok(r.b === 100_000, '口径B：codeAt > balanceAt 的计')
  r = inflightMicro(snap([at({ state: 'CANCELLED', charged: true, chargeSource: 'EXPIRED', closedAt: after }), at({ state: 'CANCELLED', charged: true, chargeSource: 'EXPIRED', closedAt: before })]), bt, null, now)
  ok(r.b === 100_000, 'EXPIRED 扣费按 closedAt 判（晚于缓存的计、早于的不计）')
  r = inflightMicro(snap([at({ state: 'CANCELLED', charged: true, chargeSource: 'RECON', codeAt: after, closedAt: after })]), bt, null, now)
  ok(r.b === 0, 'RECON 对账翻案的不计（早已反映在缓存里）')
  // A=$0.41、B=$0.66、C=$0.27 → $0.93（不是 $1.34）
  const s1 = snap(
    [
      at({ smsOrderId: 1, state: 'ACTIVE', costMicro: 410_000, respondedAt: after }),
      at({ smsOrderId: 2, state: 'ACTIVE', costMicro: 250_000, respondedAt: before }),
    ],
    [ord({ smsOrderId: 3, state: 'READY', capMicro: 270_000 })],
  )
  r = inflightMicro(s1, bt, null, now)
  ok(r.a === 410_000 && r.b === 660_000 && r.c === 270_000 && r.total === 930_000, 'A=$0.41、B=$0.66、C=$0.27 → 占用 $0.93（两种口径取较大者，不相加）')
  r = inflightMicro(snap([at({ smsOrderId: 7, state: 'REQUESTING', respondedAt: null, costMicro: null, maxPriceMicro: 200_000 })], [ord({ smsOrderId: 7, state: 'ACQUIRING', capMicro: 200_000 })]), bt, null, now)
  ok(r.total === 200_000 && r.c === 0, 'ACQUIRING 单与它自己那条 REQUESTING 尝试只计一次（在尝试里，不在 C 里）')
  r = inflightMicro(snap([at({ smsOrderId: 7 })], [ord({ smsOrderId: 7, state: 'ACQUIRING' }), ord({ smsOrderId: 8, state: 'READY', capMicro: 5_000 })]), bt, 7, now)
  ok(r.total === 6_700 && r.a === 0 && r.b === 0, '本单（selfSmsOrderId）的订单与尝试都不计；READY 按 eff(cap)')
  const pend = (x: Partial<InflightOrder>) => inflightMicro(snap([], [ord(x)]), bt, null, now).c
  ok(pend({}) === 200_000, 'PENDING_PAY 锁价有效 → 计')
  ok(pend({ quoteExpiresAt: new Date(now.getTime() - M), openVmq: true }) === 200_000, 'PENDING_PAY 锁价已过期、收银台仍有效（state=0 未过期）→ 计')
  ok(pend({ quoteExpiresAt: new Date(now.getTime() - M), paidVmq: true }) === 200_000, 'PENDING_PAY 有 state=1 收款单（等履约）→ 计')
  ok(pend({ quoteExpiresAt: new Date(now.getTime() - M), payMode: 'BALANCE' }) === 200_000, 'PENDING_PAY 余额付清（等 T19）→ 计')
  ok(pend({ quoteExpiresAt: new Date(now.getTime() - M) }) === 0, '锁价已过期、没有 0 / 1 收款单 → 不计')
  ok(pend({ orderCancelled: true, openVmq: true }) === 0, '订单已取消 → 不计')
  ok(inflightMicro(snap([], [ord({ state: 'ACQUIRING', capMicro: 100_000 })]), bt, null, now).c === 100_000, '没有非终态尝试的 ACQUIRING 计 eff(cap)')
  r = inflightMicro(snap([], [], [{ status: 'WAITING', numberAt: before, codeAt: null, estMicro: 500_000 }, { status: 'WAITING', numberAt: after, codeAt: null, estMicro: 300_000 }, { status: 'CODE', numberAt: after, codeAt: before, estMicro: 200_000 }]), bt, null, now)
  ok(r.b === 800_000 && r.a === 500_000, '旧单品：WAITING 全部进 B；numberAt ≤ balanceAt 的不进 A；缓存之前收码的 CODE 不进 B')

  ok(affordable({ balanceMicro: 500_000 }, 400_000, 100_000), '余额 − 占用 == eff(cap) → 通过（没有安全垫）')
  ok(!affordable({ balanceMicro: 500_000 }, 400_001, 100_000), '差 1 微美元 → 不通过')
  ok(affordable({ balanceMicro: 10_000 }, 3_300, 5_000) && !affordable({ balanceMicro: 10_000 }, 3_301, 5_000), 'cap = 5,000 时按 6,700 判')
  ok(!affordable('UNKNOWN', 0, 100) && !affordable(null, 0, 100), '缓存 UNKNOWN 或空 → 不通过')
  ok(eff(5_000) === 6_700 && eff(700_000) === 700_000, 'eff(x) = max(x, 6700)')
}

console.log('\n【E65 低余额告警节流 shouldAlertLow（§12.1 第 121 条）】')
{
  const t0 = T('2026-09-29T10:00:00Z').getTime()
  let st = { below: false, lastAt: null as number | null }
  let r = shouldAlertLow(st, 2_000_000, t0)
  ok(!r.alert, '$2.00 不推')
  r = shouldAlertLow(st, 1_990_000, t0)
  ok(r.alert && r.next.below, '$1.99 首次立即推')
  st = r.next
  r = shouldAlertLow(st, 1_500_000, t0 + 5 * M)
  ok(!r.alert, '5 分钟后仍 $1.5 → 不推')
  r = shouldAlertLow(st, 1_500_000, t0 + LOW_REALERT_MS)
  ok(r.alert, '6 小时后再推一次')
  st = r.next
  r = shouldAlertLow(st, 2_500_000, t0 + LOW_REALERT_MS + M)
  ok(!r.alert && !r.next.below, '回到 $2.5 → 重置')
  r = shouldAlertLow(r.next, 1_800_000, t0 + LOW_REALERT_MS + 2 * M)
  ok(r.alert, '再跌到 $1.8 → 立即推')
  ok(!shouldAlertLow({ below: false, lastAt: null }, 'UNKNOWN', t0).alert && !shouldAlertLow({ below: false, lastAt: null }, null, t0).alert, '余额 UNKNOWN / 空 → 不推')
  const keys = Object.keys(shouldAlertLow({ below: false, lastAt: null }, 1, t0))
  ok(keys.join(',') === 'alert,next', '输出只有 alert / next，没有任何「停售」')
  ok(shouldAlertLow({ below: false, lastAt: null }, 4_000_000, t0, 5).alert, '告警线取参数（runtimeParams 的 balanceAlertUsd）')
}

console.log('\n【§12.1 第 7 条 号码页 DTO：遍历键名，被禁止的字段一个都没有】')
{
  const leak: Record<string, unknown> = {
    orderNo: '2026092912345678',
    orderId: 1,
    state: 'WAITING',
    version: 3,
    service: { code: 'tg', name: '电报', costMicro: 1 },
    country: { id: 6, name: '印度尼西亚', iso2: 'ID', dial: '62', capMicro: 1 },
    operator: null,
    priceCents: 170,
    pay: { mode: 'MIXED', balanceCents: 120, balanceTopupCents: 70, balanceCashCents: 50, alipayCents: 50, alipayPaidCents: 52, holdState: 'CAPTURED', bizKey: 'x' },
    quoteExpiresAt: null,
    cashierUrl: null,
    number: { dial: '62', national: '81234567890', full: '+6281234567890', endsAt: 'x', waitUntil: 'x', canActAt: 'x', seq: 1, canGetAnotherSms: true, activationId: '999' },
    replace: { used: 0, left: 5 },
    messages: [{ id: 1, code: '482917', text: 'x', sender: null, at: 'x', seq: 1, toOldNumber: false, raw: 'x' }],
    history: [],
    refund: null,
    lateCredits: [],
    replaceBlocked: null,
    actions: { pay: false, close: false, replace: true, cancel: true, finish: false, start: false, refundReady: false, complain: false, message: true },
    notice: null,
    serverNow: 'x',
    pollMs: 3000,
    costCents: 94,
    profitCents: 76,
    saleCoef4: 80000,
    costFx4: 72000,
    markupCents: 150,
    ruleKey: 'tg:*',
    chargedMicro: 1,
    lossCents: 1,
  }
  const v = toJiemaOrderView(leak as unknown as JiemaOrderView)
  const names = collectKeyNames(JSON.parse(JSON.stringify(v)))
  const hit = FORBIDDEN_BUYER_KEYS.filter((k) => names.has(k))
  ok(hit.length === 0, `序列化结果里搜不到成本、上限、两个系数、activationId、raw、成本利润、bizKey（命中：${hit.join(',') || '无'}）`)
  ok(!names.has('errorCode') && names.has('actions') && names.has('pollMs'), '白名单字段都在')
  const texts = Object.values(REFUND_REASON_TEXT).join('|')
  ok(!/hero|上游|HeroSMS|sms-activate/i.test(texts), '退款原因文案不出现上游名称')
  ok(refundReasonText('EXPIRED') === '号码到期，没有收到短信' && refundReasonText('UPSTREAM_ENDED') === '号码已失效，未收到短信，已退回余额' && refundReasonText('???') === '已退回余额', '附录 A 的几条原因文案')
  ok(pollMsFor('FINISHED') === 0 && pollMsFor('CLOSED') === 0 && pollMsFor('WAITING') === 3000, '终态 pollMs=0（前端停止轮询）')
}

console.log('\n【其他纯函数：号码拆分、付款方式、终态集合】')
{
  const p = phoneParts('6281234567890', '62')
  ok(p.dial === '62' && p.national === '81234567890' && p.full === '+6281234567890', '以区号开头 → 拆成 +62 与本地号，复制文本不带空格')
  const q = phoneParts('81234567890', '62')
  ok(q.dial === null && q.national === '81234567890', '不以区号开头 → 整串')
  ok(payModeOf('BALANCE', 170, 170) === 'BALANCE' && payModeOf('BALANCE', 120, 170) === 'MIXED' && payModeOf('ALIPAY', 0, 170) === 'ALIPAY' && payModeOf('BALANCE', 0, 170) === 'ALIPAY', '付款方式：余额付清 / 组合 / 支付宝')
  ok(['FAILED', 'CANCELLED', 'FINISHED'].every(isAttemptTerminal) && !isAttemptTerminal('RECEIVED') && !isAttemptTerminal('RELEASING'), '尝试终态：FAILED / CANCELLED / FINISHED（RECEIVED 不是）')
  ok(['CLOSED', 'FINISHED', 'CANCELLED', 'REFUNDED'].every(isOrderTerminal) && !isOrderTerminal('MANUAL') && !isOrderTerminal('REFUNDING'), '订单终态：CLOSED / FINISHED / CANCELLED / REFUNDED（MANUAL 不是）')
}

console.log(`\n通过 ${passed} 条，失败 ${failed} 条`)
if (failed) {
  console.log('❌ 有失败')
  process.exit(1)
}
console.log('全部通过 ✅')
process.exit(0)
