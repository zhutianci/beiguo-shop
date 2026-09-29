/**
 * 短信接码 · S4（对账与监控）的纯函数检查（不连库、不调上游）。docs/短信接码-设计.md §9.4（I、R 系列）、§9.5 日报、§12.1 第 98 条：
 *
 *   npx tsx scripts/check-jiema-s4.ts
 *
 * 覆盖：
 *   · 第 98 条「对账口径」：用 2026-09-29 带 key 只读实测 probe2.out 里 history 第一页的 25 行（号码本来就打了码，验证码换成假码）作样本——
 *     状态 8 的行即使 cost 有值也不算扣费；R5 只汇总状态 6 与 moreCodes 非空的行（状态 10 除外），结果等于这 25 行里成功那 7 行的 cost 之和；
 *     把 cost 当扣费会把 $1.9195 算成 $10.463；probe2 全量 73 行的 totals（sum 7.5494 / successCount 23）同一口径；
 *   · judgeReconRow：R1（没计扣费 → 补 charged/RECON、成本差 > $0.0001 → 以上游为准、已取消单只记亏损、推定退款在这里核实）、
 *     R2（没扣费 ⇔ 没 charged；EXPIRED 以我方为准；我方计了扣费 → 不一致只报告）、R6（冲回、已取消单只报告）、没终态的尝试交给引擎；
 *     §3.1 判定表里「402 只复核、403 BANNED 不判取消、列表出错不当空列表」由 check-jiema-parse 覆盖，这里断言对账不拿非终态行判；
 *   · 冲回之后 settleCost：REFUNDED 单利润 = −成本 + 冲回；
 *   · classifyUnlinked（R3 / 未关联激活：旧链路遗留 vs 外部激活）；
 *   · checkOrderI：I2–I8 的每一条（含 I8 补算标记、已取消单的 lossCents）；
 *   · 日报：§9.5 的示例数字逐行一致、不出现乘号；推送时间（北京 09:00、过期不推）；北京日期；
 *   · 运维只读脚本 scripts/ops/jiema-drain.sql 只有 SELECT；crontab 恰好一行 jiema-reconcile（03:20、--max-time 240、密钥走请求头）。
 */
import fs from 'fs'
import path from 'path'
import { parseHistory, type HistoryRow } from '../src/lib/jiema/parse'
import { settleCost } from '../src/lib/jiema/machine'
import { realCostCents } from '../src/lib/jiema/pricing'
import {
  RECON_COST_TOLERANCE_MICRO,
  upstreamChargedKept,
  upstreamRefundedAfterCode,
  upstreamNotCharged,
  sumUpstreamCharged,
  judgeReconRow,
  applyPatch,
  attemptNetChargedMicro,
  classifyUnlinked,
  checkOrderI,
  lossOf,
  bjDate,
  bjDayStart,
  dailyDue,
  dailyLines,
  usd4,
  usd2,
  dailyNotifyRows,
  type ReconAttempt,
  type IOrderInput,
  type DailyData,
} from '../src/lib/jiema/recon-rules'

let pass = 0
let fail = 0
function ok(cond: boolean, name: string, extra = ''): void {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.log(`  ✗ ${name}${extra ? `  —— ${extra}` : ''}`)
  }
}
function eq<T>(a: T, b: T, name: string): void {
  const sa = JSON.stringify(a)
  const sb = JSON.stringify(b)
  ok(sa === sb, name, `实际 ${sa}，期望 ${sb}`)
}
const MIN = 60_000
const J = (http: number, body: unknown) => ({ http, body: JSON.stringify(body) })

// ───────────────────────── probe2.out 样本（history 第一页 25 行；号码实测时已打码 "***"，验证码换成假码） ─────────────────────────
// [id, createDate, service, country, moreCodes, cost, status, phoneCode]
const PROBE2: Array<[number, string, string, number, string | null, number, number, number]> = [
  [909862579, '2026-09-28T11:41:10.000000Z', 'ot', 187, null, 0.6, 8, 1],
  [909824802, '2026-09-28T11:30:19.000000Z', 'ot', 36, null, 0.18, 8, 1],
  [909794275, '2026-09-28T11:19:30.000000Z', 'dr', 52, '100001', 0.12, 6, 66],
  [909788047, '2026-09-28T11:17:01.000000Z', 'dr', 52, null, 0.12, 8, 66],
  [909689802, '2026-09-28T10:42:03.000000Z', 'ot', 187, null, 0.6, 8, 1],
  [909683237, '2026-09-28T10:39:47.000000Z', 'ot', 6, null, 0.024, 8, 62],
  [909672208, '2026-09-28T10:36:03.000000Z', 'ot', 36, null, 0.18, 8, 1],
  [909218389, '2026-09-28T07:57:17.000000Z', 'dr', 187, null, 0.66, 8, 1],
  [909200897, '2026-09-28T07:50:34.000000Z', 'dr', 187, null, 0.66, 8, 1],
  [908296602, '2026-09-28T01:49:43.000000Z', 'dr', 52, '100002', 0.12, 6, 66],
  [906890583, '2026-09-27T17:07:42.000000Z', 'dr', 187, null, 0.66, 8, 1],
  [906881252, '2026-09-27T17:04:33.000000Z', 'dr', 187, null, 0.66, 8, 1],
  [905417293, '2026-09-27T08:46:14.000000Z', 'dr', 52, '100003', 0.12, 6, 66],
  [905415007, '2026-09-27T08:45:17.000000Z', 'dr', 52, null, 0.12, 8, 66],
  [902558982, '2026-09-26T13:41:59.000000Z', 'dr', 52, '100004', 0.12, 6, 66],
  [901530643, '2026-09-26T07:25:52.000000Z', 'dr', 187, '100005', 0.66, 6, 1],
  [901522987, '2026-09-26T07:22:51.000000Z', 'dr', 187, null, 0.66, 8, 1],
  [893371876, '2026-09-24T06:39:04.000000Z', 'dr', 187, null, 0.66, 8, 1],
  [893368760, '2026-09-24T06:37:47.000000Z', 'dr', 187, '100006', 0.66, 6, 1],
  [893362971, '2026-09-24T06:35:25.000000Z', 'dr', 187, null, 0.66, 8, 1],
  [893357144, '2026-09-24T06:33:18.000000Z', 'dr', 187, null, 0.66, 8, 1],
  [893343221, '2026-09-24T06:29:32.000000Z', 'dr', 187, null, 0.66, 8, 1],
  [888165419, '2026-09-23T02:09:03.000000Z', 'dr', 187, null, 0.66, 8, 1],
  [884343475, '2026-09-22T06:02:58.000000Z', 'dr', 52, '100007', 0.1195, 6, 66],
  [884343358, '2026-09-22T06:02:55.000000Z', 'dr', 52, null, 0.1195, 8, 66],
]
const probeJson = (rows: typeof PROBE2, totals: unknown) =>
  J(200, {
    data: rows.map(([id, createDate, service, country, moreCodes, cost, status, phoneCode]) => ({ id, createDate, service, country, phone: '***', moreCodes, cost, status, phoneCode, currency: 840, subtype: 1 })),
    totals,
    meta: { page: 1, size: 25, sort: { id: 'desc' }, total: 73 },
  })

console.log('\n— §12.1 第 98 条 对账口径（probe2.out 脱敏样本）')
let sampleRows: HistoryRow[] = []
{
  const r = parseHistory(probeJson(PROBE2, { sum: 7.5494, successCount: 23 }))
  ok(r.kind === 'ok' && r.data.rows.length === 25, 'probe2 第一页 25 行照常解析（号码打码 → phone 为空）', r.kind)
  if (r.kind === 'ok') {
    sampleRows = r.data.rows
    ok(r.data.totals?.sumMicro === 7_549_400 && r.data.totals?.successCount === 23, 'totals：sum $7.5494、successCount 23（全量 73 行，第一页只有 25 行）')
    ok(sampleRows.every((x) => x.phone === null), '号码没有进样本（phone 全是空）')
  }
  const status8WithCost = sampleRows.filter((x) => x.status === 8 && (x.costMicro ?? 0) > 0)
  ok(status8WithCost.length === 18, '实测：18 行状态 8 的 cost 都有值（0.6 / 0.18 / 0.66 …，就是号码标价）')
  ok(status8WithCost.every((x) => !upstreamChargedKept(x) && upstreamNotCharged(x)), '状态 8、没码 → 不算扣费（不管 cost 有没有值）')
  const s = sumUpstreamCharged(sampleRows)
  eq({ micro: s.micro, count: s.count, unknownCost: s.unknownCost }, { micro: 1_919_500, count: 7, unknownCost: 0 }, 'R5 汇总：只算状态 6 / 有码的 7 行 = $1.9195')
  const naive = sampleRows.reduce((a, x) => a + (x.costMicro ?? 0), 0)
  ok(naive === 10_463_000 && naive > 5 * s.micro, '反例：把 cost 当扣费会算成 $10.463（5 倍多）')
  ok(sampleRows.filter((x) => x.status === 6).every((x) => upstreamChargedKept(x)), '状态 6 → 扣费')
  // probe2 全量的口径：23 行成功 = totals.sum。把样本扩到「成功行」与 totals 同口径——同一批成功行的 cost 之和就是 totals.sum
  const succ = PROBE2.filter((x) => x[6] === 6)
  const r7 = parseHistory(probeJson(succ, { sum: 1.9195, successCount: succ.length }))
  ok(r7.kind === 'ok' && sumUpstreamCharged(r7.data.rows).micro === r7.data.totals?.sumMicro, '只取成功行（statuses[]=6 的查询）：汇总 = totals.sum（1.9195）')
  // 真实账单里 0.1195 与标价 0.12 不同：成本以 history 为准
  const cheap = sampleRows.find((x) => x.id === '884343475')
  ok(cheap?.costMicro === 119_500 && Math.abs(119_500 - 120_000) > RECON_COST_TOLERANCE_MICRO, '实测 dr/52 实扣 $0.1195（标价 0.12）：差 $0.0005 > 容差 $0.0001，R1 会以上游为准改成本')
  // 状态 8 但收过码（§3.1「6 或 moreCodes 非空」）、状态 10 + 码（R6）
  const mixed = parseHistory(J(200, { data: [{ id: 1, status: 8, moreCodes: '123456', cost: 0.3 }, { id: 2, status: 10, moreCodes: '654321', cost: 0.5 }, { id: 3, status: 10, moreCodes: null, cost: 0.7 }, { id: 4, status: 6, moreCodes: null, cost: 0.2 }] }))
  ok(mixed.kind === 'ok', '混合样本解析')
  if (mixed.kind === 'ok') {
    const [a, b, c, d] = mixed.data.rows
    ok(upstreamChargedKept(a) && !upstreamRefundedAfterCode(a), '状态 8 + moreCodes → 扣费（R1）')
    ok(!upstreamChargedKept(b) && upstreamRefundedAfterCode(b), '状态 10 + moreCodes → 上游事后退款（R6），不算实扣')
    ok(!upstreamChargedKept(c) && upstreamNotCharged(c), '状态 10、没码 → 没扣费（R2）')
    ok(upstreamChargedKept(d), '状态 6、moreCodes 为空 → 仍算扣费（完成就是扣了）')
    eq(sumUpstreamCharged(mixed.data.rows).micro, 500_000, 'R5 汇总 = 0.3 + 0.2（状态 10 的两行都不算）')
  }
  const notEnded = parseHistory(J(200, { data: [{ id: 5, status: 4, moreCodes: '111', cost: 0.3 }] }))
  ok(notEnded.kind === 'ok' && !upstreamChargedKept(notEnded.data.rows[0]) && !upstreamNotCharged(notEnded.data.rows[0]), '状态 4（没结束）不参与任何判定（对账只查 6 / 8 / 10）')
}

// ───────────────────────── judgeReconRow ─────────────────────────
console.log('\n— R1 / R2 / R6：一行 history 对我方一个尝试（§9.4）')
const att = (o: Partial<ReconAttempt> = {}): ReconAttempt => ({ id: 1, smsOrderId: 10, state: 'CANCELLED', charged: false, chargeSource: null, costMicro: 660_000, maxPriceMicro: 825_000, upstreamRefundMicro: null, assumed: false, ...o })
function hrow(o: Partial<HistoryRow>): HistoryRow {
  const base: HistoryRow = { id: '9', createdAt: null, service: 'dr', country: 187, phone: null, moreCodes: null, costMicro: 660_000, status: 6, dialCode: '1', currency: 840 }
  return { ...base, ...o }
}
{
  eq(judgeReconRow(hrow({ status: 6, moreCodes: '1' }), att({ state: 'FINISHED', charged: true, chargeSource: 'SMS' }), 'FINISHED'), { kind: 'NONE', rule: 'R1' }, 'R1：上游 6、我方 charged 且成本相等 → 一致')
  const a1 = judgeReconRow(hrow({ status: 6 }), att({ state: 'CANCELLED' }), 'FINISHED')
  ok(a1.kind === 'FIX' && a1.rule === 'R1' && a1.recompute === 'T20' && a1.patch.charged === true && a1.patch.chargeSource === 'RECON' && a1.patch.costMicro === undefined, 'R1：换号时被放掉的旧号上游却扣了（E14 ③）→ charged=true、RECON，订单没取消 → 重跑 T20', JSON.stringify(a1))
  const a2 = judgeReconRow(hrow({ status: 6 }), att({ state: 'CANCELLED', assumed: true }), 'CANCELLED')
  ok(a2.kind === 'FIX' && a2.recompute === 'LOSS' && a2.patch.charged === true && a2.patch.assumed === false, 'R1 亏损分支：推定退款后翻案（订单已取消）→ 只记亏损（LOSS）、推定退款标记清掉', JSON.stringify(a2))
  const a3 = judgeReconRow(hrow({ status: 6, costMicro: 119_500 }), att({ state: 'FINISHED', charged: true, chargeSource: 'SMS', costMicro: 120_000 }), 'FINISHED')
  ok(a3.kind === 'FIX' && a3.patch.costMicro === 119_500 && a3.patch.charged === undefined, 'R1：成本差 $0.0005 → 以上游为准改 costMicro（不重复标 charged）', JSON.stringify(a3))
  eq(judgeReconRow(hrow({ status: 6, costMicro: 120_050 }), att({ state: 'FINISHED', charged: true, costMicro: 120_000 }), 'FINISHED').kind, 'NONE', 'R1：差 $0.00005 ≤ 容差 → 一致')
  eq(judgeReconRow(hrow({ status: 6, moreCodes: '1' }), att({ state: 'FINISHED', charged: true, chargeSource: 'SMS', assumed: true }), 'FINISHED'), { kind: 'CLEAR_ASSUMED', rule: 'R1' }, 'R1：推定完成（RECEIVED 过了 endsAt + 60 分钟）被 history 6 核实、钱一致 → 只清 assumed，不算不一致')
  eq(judgeReconRow(hrow({ status: 10, moreCodes: '1' }), att({ state: 'FINISHED', charged: true, costMicro: 660_000, upstreamRefundMicro: 660_000, assumed: true }), 'REFUNDED'), { kind: 'CLEAR_ASSUMED', rule: 'R6' }, 'R6：已冲回过、只剩 assumed → 只清 assumed')
  eq(judgeReconRow(hrow({ status: 6, costMicro: null }), att({ state: 'FINISHED', charged: true, costMicro: 120_000 }), 'FINISHED').kind, 'NONE', 'R1：上游 cost 缺（或币种异常被置空）→ 不改成本')
  eq(judgeReconRow(hrow({ status: 6 }), att({ state: 'ACTIVE' }), 'WAITING'), { kind: 'PENDING', rule: 'R1' }, '尝试没到终态（引擎还在推进）→ 交给引擎，不判不改')
  eq(judgeReconRow(hrow({ status: 6 }), att({ state: 'RECEIVED', charged: true }), 'RECEIVED').kind, 'PENDING', 'RECEIVED 的尝试也交给引擎（history 已结束由 T22 收尾）')
  const a4 = judgeReconRow(hrow({ status: 8, moreCodes: '222333' }), att({ state: 'CANCELLED' }), 'CANCELLED')
  ok(a4.kind === 'FIX' && a4.recompute === 'LOSS', 'R1：状态 8 但收过码、订单已取消 → 亏损分支')

  eq(judgeReconRow(hrow({ status: 8 }), att({ state: 'CANCELLED' }), 'CANCELLED'), { kind: 'NONE', rule: 'R2' }, 'R2：上游 8 没码、我方 CANCELLED 没 charged → 一致（cost 有值也不算）')
  eq(judgeReconRow(hrow({ status: 10 }), att({ state: 'CANCELLED', assumed: true }), 'CANCELLED'), { kind: 'CLEAR_ASSUMED', rule: 'R2' }, 'R2：推定退款（assumed）的尝试核实了 → 清 assumed')
  eq(judgeReconRow(hrow({ status: 8 }), att({ state: 'CANCELLED', charged: true, chargeSource: 'EXPIRED' }), 'CANCELLED'), { kind: 'EXPIRED_KEPT', rule: 'R2' }, 'R2：我方按 FREE_CANCELLATION_EXPIRED 计了扣费 → 以我方为准，单列')
  const m = judgeReconRow(hrow({ status: 8 }), att({ state: 'FINISHED', charged: true, chargeSource: 'SMS' }), 'FINISHED')
  ok(m.kind === 'MISMATCH' && m.rule === 'R2', 'R2：我方记着收码扣费、上游说取消没码 → 不一致只报告（不自动改）')
  eq(judgeReconRow(hrow({ status: 8 }), att({ state: 'FAILED' }), 'CANCELLED').kind, 'NONE', 'R2：FAILED 且没 charged → 钱一致')
  eq(judgeReconRow(hrow({ status: 8 }), att({ state: 'RELEASING' }), 'CANCELLING').kind, 'PENDING', 'R2：放号中的尝试 → 交给引擎')

  const r6 = judgeReconRow(hrow({ status: 10, moreCodes: '999000' }), att({ state: 'FINISHED', charged: true, chargeSource: 'SMS', costMicro: 660_000 }), 'REFUNDED')
  ok(r6.kind === 'FIX' && r6.rule === 'R6' && r6.recompute === 'T20' && r6.patch.upstreamRefundMicro === 660_000, 'R6：上游事后退了收过码的号 → upstreamRefundMicro = 这个号的扣费、重跑 T20', JSON.stringify(r6))
  eq(judgeReconRow(hrow({ status: 10, moreCodes: '999000' }), att({ state: 'FINISHED', charged: true, costMicro: 660_000, upstreamRefundMicro: 660_000 }), 'REFUNDED').kind, 'NONE', 'R6：已经冲回过 → 一致（幂等）')
  const r6c = judgeReconRow(hrow({ status: 10, moreCodes: '999000' }), att({ state: 'CANCELLED' }), 'CANCELLED')
  ok(r6c.kind === 'MISMATCH' && r6c.rule === 'R6', 'R6：已取消的单却显示收过码 → 只报告（不改亏损）')
  const r6n = judgeReconRow(hrow({ status: 10, moreCodes: '999000', costMicro: 300_000 }), att({ state: 'FINISHED', charged: false, costMicro: null, maxPriceMicro: 400_000 }), 'FINISHED')
  ok(r6n.kind === 'FIX' && r6n.patch.charged === true && r6n.patch.costMicro === 300_000 && r6n.patch.upstreamRefundMicro === 300_000, 'R6：我方没记扣费 → 补 charged / 成本，冲回同额（净 0）', JSON.stringify(r6n))

  // 冲回之后的成本利润（REFUNDED：利润 = −成本 + 冲回）
  const refunded = { state: 'REFUNDED', priceCents: 968, costFx4: 72000 }
  const before = settleCost(refunded, [{ state: 'FINISHED', charged: true, costMicro: 660_000, maxPriceMicro: 825_000, upstreamRefundMicro: null }])
  const after = settleCost(refunded, [applyPatch(att({ state: 'FINISHED', charged: true, costMicro: 660_000 }), (r6 as { patch: object }).patch)])
  ok(before.costCents === 476 && before.profitCents === -476, '售后退款单：成本 ¥4.76、利润 −¥4.76')
  ok(after.chargedMicro === 0 && after.costCents === 0 && after.profitCents === 0, '  …R6 冲回后：扣费 0、成本 0、利润 = −4.76 + 4.76 = 0')
  eq(attemptNetChargedMicro(applyPatch(att({ state: 'FINISHED', charged: true, costMicro: 660_000 }), (r6 as { patch: object }).patch)), 0, 'R5 用的净扣费：冲回后为 0')
  eq(attemptNetChargedMicro(att({ charged: true, costMicro: null, maxPriceMicro: 825_000 })), 825_000, '没有 costMicro 的 charged 尝试按 cap 计（与 settleCost 同口径：利润宁低勿高）')
  eq(lossOf([{ charged: true, costMicro: 660_000, maxPriceMicro: 825_000 }], 72000), realCostCents(660_000, 72000), '亏损 = realCostCents(Σ charged cost, 成本汇率快照)')
  eq(lossOf([{ charged: false, costMicro: 660_000, maxPriceMicro: 825_000 }], 72000), null, '没有 charged 尝试 → 亏损为空')
}

// ───────────────────────── R3 分类 ─────────────────────────
console.log('\n— R3 / 未关联激活：旧链路遗留 vs 外部激活')
{
  const t = Date.parse('2026-09-30T02:00:00Z')
  const lsv = new Set(['dr', 'acz'])
  eq(classifyUnlinked({ service: 'dr', createdAt: new Date(t) }, lsv, [t - 29 * MIN]), 'LEGACY', '旧单品服务、旧单品订单付款后 29 分钟创建 → 旧链路遗留')
  eq(classifyUnlinked({ service: 'dr', createdAt: new Date(t) }, lsv, [t - 30 * MIN]), 'LEGACY', '  …恰好 30 分钟（边界）→ 旧链路遗留')
  eq(classifyUnlinked({ service: 'dr', createdAt: new Date(t) }, lsv, [t - 31 * MIN]), 'EXTERNAL', '  …31 分钟 → 外部激活')
  eq(classifyUnlinked({ service: 'dr', createdAt: new Date(t) }, lsv, [t + MIN]), 'EXTERNAL', '付款在激活之后 → 外部激活')
  eq(classifyUnlinked({ service: 'tg', createdAt: new Date(t) }, lsv, [t - MIN]), 'EXTERNAL', '不是旧单品卖的服务 → 外部激活')
  eq(classifyUnlinked({ service: 'DR', createdAt: new Date(t) }, lsv, [t - MIN]), 'LEGACY', '服务代码大小写不敏感')
  eq(classifyUnlinked({ service: 'dr', createdAt: null }, lsv, [t - MIN]), 'EXTERNAL', '创建时间未知 → 按外部（宁可推送）')
}

// ───────────────────────── I 系列 ─────────────────────────
console.log('\n— I2–I8：一张接码单（§9.4）')
{
  const NOW = new Date('2026-09-30T10:00:00Z')
  const ago = (min: number) => new Date(NOW.getTime() - min * MIN)
  const A = (o: Partial<IOrderInput['attempts'][number]> = {}) => ({ id: 1, state: 'FINISHED', charged: true, costMicro: 24_000, maxPriceMicro: 30_000, upstreamRefundMicro: null, requestedAt: ago(60), endsAt: ago(40), closedAt: ago(40), updatedAt: ago(40), ...o })
  // 出厂定价 ot/6 $0.024 → ¥1.70；成本 ⌈0.024 × 7.2 × 100⌉ = 18 分；利润 152
  const base = (o: Partial<IOrderInput> = {}): IOrderInput => ({
    smsOrderId: 5,
    orderId: 50,
    state: 'FINISHED',
    payMode: 'BALANCE',
    priceCents: 170,
    balanceCents: 170,
    alipayPaidCents: 0,
    costFx4: 72000,
    chargedMicro: 24_000,
    costCents: 18,
    profitCents: 152,
    lossCents: null,
    costFinal: true,
    refundTopupCents: null,
    refundCashCents: null,
    order: { payStatus: 'PAID', deliveryStatus: 'DELIVERED' },
    attempts: [A()],
    messages: 1,
    hold: { state: 'CAPTURED', topupCents: 120, cashCents: 50 },
    refundLog: null,
    alipayReallyCents: null,
    ...o,
  })
  const codes = (o: IOrderInput) => checkOrderI(o, NOW).issues.map((x) => x.code)
  eq(codes(base()), [], '余额付清、已完成、已定稿的单 → 没有问题')
  const cancelled = base({
    state: 'CANCELLED',
    order: { payStatus: 'REFUNDED', deliveryStatus: 'CANCELLED' },
    attempts: [A({ state: 'CANCELLED', charged: false })],
    messages: 0,
    chargedMicro: null,
    costCents: null,
    profitCents: null,
    costFinal: false,
    hold: { state: 'REFUNDED', topupCents: 120, cashCents: 50 },
    refundLog: { topupCents: 120, cashCents: 50 },
    refundTopupCents: 120,
    refundCashCents: 50,
  })
  eq(codes(cancelled), [], '已取消（整单原路退回）→ 没有问题')
  ok(codes({ ...cancelled, refundLog: null }).includes('I2'), 'I2：已取消却没有 refund 流水')
  ok(codes({ ...cancelled, refundLog: { topupCents: 121, cashCents: 50 } }).includes('I2'), 'I2：refund 流水两格与接码单记的退回额不一致（有人改了一条流水金额）')
  ok(codes({ ...cancelled, order: { payStatus: 'PAID', deliveryStatus: 'PROCESSING' } }).includes('I2'), 'I2：接码单已取消、订单还是 PAID')
  const ali = base({
    payMode: 'ALIPAY',
    balanceCents: 0,
    alipayPaidCents: 172,
    hold: null,
    alipayReallyCents: 172,
  })
  eq(codes(ali), [], '支付宝全额（实收含尾差 ¥1.72）→ 没有问题')
  ok(codes({ ...ali, alipayReallyCents: 171 }).includes('I2'), 'I2：alipayPaidCents ≠ 收款单实付')
  ok(codes({ ...ali, alipayReallyCents: 'MISMATCH' }).includes('I2'), 'I2：ALIPAY 流水的 tradeNo 对不上本单已到账的收款单')
  ok(codes({ ...ali, state: 'CANCELLED', order: { payStatus: 'REFUNDED', deliveryStatus: 'CANCELLED' }, attempts: [A({ state: 'CANCELLED', charged: false })], messages: 0, chargedMicro: null, costCents: null, profitCents: null, costFinal: false, refundLog: { topupCents: 170, cashCents: 0 }, refundTopupCents: 170, refundCashCents: 0 }).includes('I2'), 'I2：退回合计 ¥1.70 ≠ 支付宝实收 ¥1.72（尾差也要退）')
  ok(codes({ ...ali, hold: { state: 'CAPTURED', topupCents: 0, cashCents: 0 } }).includes('I3'), 'I3：支付宝全额的单却有预扣')
  ok(codes(base({ hold: null })).includes('I3'), 'I3：余额付清的单没有预扣行')
  ok(codes(base({ hold: { state: 'HELD', topupCents: 120, cashCents: 50 } })).includes('I3'), 'I3：已付款的单预扣还是 HELD')
  ok(codes(base({ hold: { state: 'CAPTURED', topupCents: 100, cashCents: 50 } })).includes('I3'), 'I3：预扣合计 ≠ 余额部分')
  eq(codes(base({ state: 'PENDING_PAY', order: { payStatus: 'UNPAID', deliveryStatus: 'PENDING' }, hold: { state: 'HELD', topupCents: 120, cashCents: 50 }, attempts: [], messages: 0, alipayPaidCents: null, costFinal: false, chargedMicro: null, costCents: null, profitCents: null })), [], '待支付的余额单：预扣 HELD → 没有问题')
  ok(codes(base({ state: 'CLOSED', order: { payStatus: 'UNPAID', deliveryStatus: 'CANCELLED' }, hold: { state: 'HELD', topupCents: 120, cashCents: 50 }, attempts: [], messages: 0, alipayPaidCents: null, costFinal: false, chargedMicro: null, costCents: null, profitCents: null })).includes('I3'), 'I3：已关闭的单预扣还是 HELD（没退回）')
  const waiting = base({ state: 'WAITING', order: { payStatus: 'PAID', deliveryStatus: 'PROCESSING' }, attempts: [A({ state: 'ACTIVE', charged: false, closedAt: null, endsAt: ago(91) })], messages: 0, costFinal: false, chargedMicro: null, costCents: null, profitCents: null })
  ok(codes(waiting).includes('I4'), 'I4：ACTIVE 的尝试已过有效期末 91 分钟')
  eq(codes({ ...waiting, attempts: [A({ state: 'ACTIVE', charged: false, closedAt: null, endsAt: ago(89) })] }), [], '  …89 分钟 → 还不报')
  ok(codes({ ...waiting, attempts: [A({ state: 'UNKNOWN', charged: false, closedAt: null, endsAt: null, requestedAt: ago(111) })] }).includes('I4'), 'I4：结果未知的尝试（没有 endsAt）按取号 + 20 分钟算，111 分钟前 → 报')
  ok(codes(base({ messages: 0 })).includes('I5'), 'I5：已完成却没有短信')
  ok(codes(base({ order: { payStatus: 'PAID', deliveryStatus: 'PROCESSING' } })).includes('I5'), 'I5：已完成的单订单不是 DELIVERED')
  ok(codes({ ...waiting, attempts: [A({ id: 1, state: 'UNKNOWN', charged: false, endsAt: null, requestedAt: ago(1) }), A({ id: 2, state: 'REQUESTING', charged: false, endsAt: null, requestedAt: ago(1) })] }).includes('I6'), 'I6：同时两个取号中 / 结果未知的尝试')
  ok(codes(base({ costCents: 17, profitCents: 153 })).includes('I7'), 'I7：已定稿的成本 ≠ T20 重算（18 分）')
  ok(codes({ ...cancelled, costCents: 18, profitCents: 152, chargedMicro: 24_000 }).includes('I7'), 'I7：已取消的单写了成本利润（应为空、不计）')
  ok(codes({ ...cancelled, attempts: [A({ state: 'CANCELLED', charged: true })] }).includes('I7'), 'I7：已取消单上有 charged 尝试、lossCents 却为空')
  eq(codes({ ...cancelled, attempts: [A({ state: 'CANCELLED', charged: true })], lossCents: 18 }), [], '  …lossCents = realCostCents(0.024 × 7.2) = 18 分 → 没有问题')
  const unfinal = base({ costFinal: false })
  const i8 = checkOrderI(unfinal, NOW)
  ok(i8.recompute && i8.issues.some((x) => x.code === 'I8'), 'I8：已完成、号码全部终态 40 分钟仍没定稿 → 补算并告警')
  const i8b = checkOrderI(base({ costFinal: false, attempts: [A({ closedAt: ago(5), updatedAt: ago(5) })] }), NOW)
  ok(!i8b.recompute && !i8b.issues.some((x) => x.code === 'I8'), '  …号码刚结束 5 分钟 → 还不补算（tick 的 T20-final 在做）')
  const i8c = checkOrderI(base({ costFinal: false, attempts: [A(), A({ id: 2, state: 'RELEASING', closedAt: null })] }), NOW)
  ok(!i8c.recompute, '  …还有号码没终态 → 不补算（过了 endsAt + 90 分钟的由 I4 报）')
}

// ───────────────────────── 日报 ─────────────────────────
console.log('\n— 日报（§9.5 示例、§7.7）')
{
  const d: DailyData = {
    day: '2026-09-29',
    paid: { ALIPAY: 8, BALANCE: 7, MIXED: 5 },
    received: 12,
    finance: { finalized: 12, revenueCents: 3460, chargedMicro: 1_460_000, costCents: 1058, refundOffsetCents: 0, profitCents: 2402, cancelled: { count: 8, topupCents: 1102, cashCents: 310 }, lossCents: 0 },
    afterSale: 0,
    upstreamBalanceMicro: 10_980_000,
    anomalies: { recon: 0, manual: 0, external: 0 },
    notices: [],
  }
  const L = dailyLines(d)
  eq(L[0], '09-29 接码日报', '标题 MM-DD 接码日报')
  eq(L[1], '付款 20 单（支付宝 8 · 余额付清 7 · 组合 5）· 收码 12 单（收码率 60%）', '付款与付款方式分布、收码率')
  eq(L[2], '完成 12 单：营收 ¥34.60；实际扣费 $1.46；真实成本 ¥10.58（逐单按下单时的成本汇率向上取整）；毛利 ¥24.02', '§9.5 示例第 3 行逐字一致')
  eq(L[3], '已取消 8 单：退回余额 ¥14.12（充值余额 ¥11.02 · 返现余额 ¥3.10），不计成本利润', '§9.5 示例第 4 行逐字一致')
  eq(L[4], '售后退款 0 单 · 亏损 ¥0.00 · 上游余额 $10.98', '§9.5 示例第 5 行逐字一致')
  ok(L.every((l) => !l.includes('×') && !/\*\s*\d/.test(l)), '真实成本是 Σ costCents：日报里不出现乘号（¥10.58 ≠ $1.46 × 7.20 = ¥10.512）')
  ok(d.finance.revenueCents - d.finance.costCents - d.finance.refundOffsetCents === d.finance.profitCents, '毛利 = 营收 − 真实成本 − 售后冲减')
  const withNotice = dailyLines({ ...d, finance: { ...d.finance, chargedMicro: 100_000_000 }, anomalies: { recon: 2, manual: 1, external: 3 }, notices: ['用户 #7 近 24 小时取消 12 单（只标记、不限制）'] })
  ok(withNotice[2].includes('实际扣费 $100.00'), '当日扣费 $100 照实显示（不设上限，Q4、§12.2 第 46 条）')
  ok(withNotice.includes('异常：对账不一致 2 项 · 转人工 1 单 · 外部激活 3 个') && withNotice[withNotice.length - 1] === '知会：用户 #7 近 24 小时取消 12 单（只标记、不限制）', '异常数与知会各一行')
  const rows = dailyNotifyRows(withNotice)
  ok(rows.length === withNotice.length - 1 && rows[0].label === '付款' && rows[rows.length - 1].label === '知会' && !rows[rows.length - 1].value.startsWith('知会：'), '推送行：标题单独、每行一条、知会行去掉前缀')
  ok(dailyLines({ ...d, paid: { ALIPAY: 0, BALANCE: 0, MIXED: 0 }, received: 0, upstreamBalanceMicro: null })[1].includes('收码率 —') && dailyLines({ ...d, upstreamBalanceMicro: null })[4].endsWith('上游余额 未知'), '没有付款单时收码率「—」；余额未知照实写')
  eq(usd2(1_455_000), '$1.46', 'usd2 四舍五入到美分')
  eq(usd4(119_500), '$0.1195', 'usd4')
  eq(usd4(-660_000), '-$0.6600', 'usd4 负数')
}

console.log('\n— 北京时间与推送时刻')
{
  eq(bjDate(new Date('2026-09-29T16:00:00Z')), '2026-09-30', 'UTC 16:00 = 北京次日 00:00')
  eq(bjDate(new Date('2026-09-29T15:59:59Z')), '2026-09-29', 'UTC 15:59:59 = 北京 23:59:59')
  eq(bjDayStart(new Date('2026-09-30T03:20:00+08:00')).toISOString(), '2026-09-29T16:00:00.000Z', '北京 09-30 的 00:00 = UTC 09-29 16:00')
  eq(dailyDue('2026-09-29', new Date('2026-09-30T03:20:00+08:00')), 'WAIT', '03:20 生成 → 等到 09:00')
  eq(dailyDue('2026-09-29', new Date('2026-09-30T08:59:59+08:00')), 'WAIT', '08:59:59 → 还不推')
  eq(dailyDue('2026-09-29', new Date('2026-09-30T09:00:00+08:00')), 'SEND', '09:00 → 推')
  eq(dailyDue('2026-09-29', new Date('2026-09-30T23:59:00+08:00')), 'SEND', '当天晚些时候（tick 停过）→ 仍推')
  eq(dailyDue('2026-09-29', new Date('2026-10-01T09:30:00+08:00')), 'STALE', '再晚一天 → 过期不推')
  eq(dailyDue('2026-09-29', new Date('2026-09-29T23:00:00+08:00')), 'WAIT', '报告那天本身 → 不推')
}

// ───────────────────────── 运维脚本与 crontab ─────────────────────────
console.log('\n— 运维只读脚本与 crontab（§11 第 10 步、§6.6 第 34 条）')
{
  const root = path.join(__dirname, '..')
  const sql = fs.readFileSync(path.join(root, 'scripts/ops/jiema-drain.sql'), 'utf8')
  const stmts = sql
    .split('\n')
    .filter((l) => !/^\s*--/.test(l))
    .join('\n')
    .split(/;\s*(?:\n|$)/)
    .map((x) => x.trim())
    .filter(Boolean)
  ok(stmts.length >= 7 && stmts.every((s) => /^SELECT\b/i.test(s)), `jiema-drain.sql 的 ${stmts.length} 条语句全是 SELECT`)
  ok(!/\b(INSERT|UPDATE|DELETE|REPLACE|ALTER|DROP|TRUNCATE|CREATE|GRANT)\b/i.test(stmts.join('\n')), '  …没有任何写语句（不写批量改库的 SQL）')
  ok(!/\bsrc\//.test(stmts.join('\n')) && !/\bimport\b/i.test(stmts.join('\n')), '  …语句里不引用 src/（纯 SQL，不 import 应用代码）')
  const cron = fs.readFileSync(path.join(root, 'cron/crontab'), 'utf8')
  const lines = cron.split('\n').filter((l) => l.includes('/api/cron/jiema-reconcile') && !l.trim().startsWith('#'))
  ok(lines.length === 1, 'crontab 恰好一行 jiema-reconcile')
  ok(lines.length === 1 && lines[0].startsWith('20 3 * * * ') && lines[0].includes('--max-time 240') && lines[0].includes('-H "x-cron-secret: $(cat /run/cron_secret)"') && !lines[0].includes('?') && !lines[0].includes('\\'), '  …每天 03:20、--max-time 240、密钥走请求头、不带 query、没有反斜杠', lines[0])
  ok(!cron.includes('\r'), 'crontab 没有 CR（crond 会把 \\r 当命令的一部分）')
}

console.log(`\n通过 ${pass} 条，失败 ${fail} 条`)
if (fail) {
  console.log('有失败 ❌')
  process.exit(1)
}
console.log('全部通过 ✅')
