/**
 * 渠道结算账本纯函数自测（WP3，不连库、不起服务）：
 *
 *   npx tsx scripts/check-tenant-ledger.ts
 *
 * 覆盖实施分包 W3-1：
 *  · 设计 10.11 ① 两个核对数、② D4 按件退款的逐成分差额、③ 其他冲销情形（让利、CHANNEL + loss、接码类 loss 默认值、
 *    PLATFORM、只退税费、少付 CHANNEL / PLATFORM、少付后全额退、舍入边界、小额）——逐分对齐表格；
 *  · remainingByComponent 对「一次全退」与「多次部分退累计到全退」结果完全相同（随机 1000 组），
 *    且任一时点 Σ(FEE + INVOICE_FEE) = mulBps(G + I, f)、各成分非负、剩余值随累计退款单调不增；
 *  · defaultLossCents、shortFields 的口径；externalOrderSourceKey 平台行与旧公式逐字相同；
 *  · 邮件 origin：不传 origin 与改造前逐字相同的链接；传渠道 origin 后所有链接都是渠道域名；新模板过禁发词表。
 * 任何一条失败即以非 0 退出。
 */
process.env.JWT_SECRET = process.env.JWT_SECRET || 'check-tenant-ledger-secret-0123456789abcdef'

import crypto from 'crypto'
import { mulBps } from '../src/lib/tenant/math'
import {
  COMPONENT_SIGN,
  ORDER_COMPONENTS,
  defaultLossCents,
  remainingByComponent,
  shortFields,
  taxActualFromShort,
  type OrderComponent,
  type Remaining,
  type RemainingInput,
} from '../src/lib/tenant/ledger'
import { tripleOf } from '../src/lib/tenant/balances'
import { externalOrderSourceKey } from '../src/lib/external-order-key'
import { scheduledPeriodEnd } from '../src/lib/tenant/statement'
import {
  renderOrderPaidEmail,
  renderOrderDeliveredEmail,
  renderInvoiceIssuedEmail,
  renderVerifyCodeEmail,
  renderAccountExistsEmail,
  renderNoAccountEmail,
  renderNoSubscriptionEmail,
  renderOrderReplyEmail,
  renderTenantInviteEmail,
} from '../src/lib/mail'
import { findBannedWord, visibleTextOf } from '../src/lib/marketing/lint'

let pass = 0
let fail = 0
function ok(name: string, cond: boolean, extra = '') {
  if (cond) pass++
  else {
    fail++
    console.log(`  ✗ ${name}${extra ? ` —— ${extra}` : ''}`)
  }
}
function eq(name: string, got: unknown, want: unknown) {
  const g = JSON.stringify(got)
  const w = JSON.stringify(want)
  ok(name, g === w, `得到 ${g}，期望 ${w}`)
}

// ---------------------------------------------------------------------------
// 辅助：一张订单的输入、计提分录、冲销差额
// ---------------------------------------------------------------------------
type Inv = RemainingInput['inv']
function input(o: { A: number; S: number; f?: number; s?: number; Rg?: number; SHc?: number; L?: number; inv?: Inv; sr?: boolean; ir?: boolean }): RemainingInput {
  return {
    amountCents: o.A,
    supplyCents: o.S,
    feeRateBp: o.f ?? 150,
    invoiceShareRateBp: o.s ?? 200,
    settleRefundedCents: o.Rg ?? 0,
    shortChargedCents: o.SHc ?? 0,
    settleLossCents: o.L ?? 0,
    inv: o.inv ?? null,
    settleReversed: o.sr ?? false,
    invReversed: o.ir ?? false,
  }
}
/** 分录金额（方向 × 剩余值），只保留非零 */
function entries(r: Remaining): Partial<Record<OrderComponent, number>> {
  const out: Partial<Record<OrderComponent, number>> = {}
  for (const c of ORDER_COMPONENTS) {
    const v = COMPONENT_SIGN[c] * r[c]
    if (v) out[c] = v
  }
  return out
}
function delta(a: Remaining, b: Remaining): Partial<Record<OrderComponent, number>> {
  const out: Partial<Record<OrderComponent, number>> = {}
  for (const c of ORDER_COMPONENTS) {
    const v = COMPONENT_SIGN[c] * (b[c] - a[c])
    if (v) out[c] = v
  }
  return out
}
const sumVals = (x: Partial<Record<string, number>>) => Object.values(x).reduce((s: number, v) => s + (v ?? 0), 0)
function triple(r: Remaining) {
  return tripleOf(entries(r) as Record<string, number>)
}

// ---------------------------------------------------------------------------
console.log('· 10.11 ① 站长给的两个核对数')
{
  const o1 = remainingByComponent(input({ A: 14000, S: 11000 }))
  eq('O1 分录', entries(o1), { SALE: 14000, PURCHASE: -11000, FEE: -210 })
  eq('O1 三个数', triple(o1), { balanceCents: 3000, feeCents: 210, payoutCents: 2790 })
  const o2 = remainingByComponent(input({ A: 14000, S: 11000, inv: { baseCents: 14000, taxCents: 840, taxActualCents: 840, refundedTaxCents: 0 } }))
  eq('O2 分录', entries(o2), { SALE: 14000, PURCHASE: -11000, FEE: -210, INVOICE_SHARE: 280, INVOICE_FEE: -4 })
  eq('O2 三个数', triple(o2), { balanceCents: 3280, feeCents: 214, payoutCents: 3066 })
  ok('O2 手续费合计 = mulBps(14280,150) = 214', o2.FEE + o2.INVOICE_FEE === 214 && mulBps(14280, 150) === 214)
}

console.log('· 10.11 ② O3 按件退 1 件（PROPORTIONAL，退税费 840）')
{
  const inv = (Rt: number): Inv => ({ baseCents: 28000, taxCents: 1680, taxActualCents: 1680, refundedTaxCents: Rt })
  const before = remainingByComponent(input({ A: 28000, S: 22000, inv: inv(0) }))
  eq('O3 计提', entries(before), { SALE: 28000, PURCHASE: -22000, FEE: -420, INVOICE_SHARE: 560, INVOICE_FEE: -8 })
  const after = remainingByComponent(input({ A: 28000, S: 22000, Rg: 14000, inv: inv(840) }))
  eq('O3 冲销差额', delta(before, after), { SALE: -14000, PURCHASE: 11000, FEE: 210, INVOICE_SHARE: -280, INVOICE_FEE: 4 })
  eq('O3 剩余三个数 = O2', triple(after), { balanceCents: 3280, feeCents: 214, payoutCents: 3066 })
  // 冻结中合计（D2 之后）：O1 + O2 + O3
  const o1 = remainingByComponent(input({ A: 14000, S: 11000 }))
  const o2 = remainingByComponent(input({ A: 14000, S: 11000, inv: { baseCents: 14000, taxCents: 840, taxActualCents: 840, refundedTaxCents: 0 } }))
  const all = [o1, o2, before].map((r) => entries(r) as Record<string, number>)
  const merged: Record<string, number> = {}
  for (const e of all) for (const [k, v] of Object.entries(e)) merged[k] = (merged[k] ?? 0) + v
  eq('D2 冻结中合计', tripleOf(merged), { balanceCents: 12840, feeCents: 852, payoutCents: 11988 })
  // 结算单 #1 = O1 + O2 + O3（退后）
  const m1: Record<string, number> = {}
  for (const e of [o1, o2, after].map((r) => entries(r) as Record<string, number>)) for (const [k, v] of Object.entries(e)) m1[k] = (m1[k] ?? 0) + v
  eq('结算单 #1 成分', { goods: m1.SALE, purchase: m1.PURCHASE, invShare: m1.INVOICE_SHARE, fee: m1.FEE + m1.INVOICE_FEE }, { goods: 42000, purchase: -33000, invShare: 560, fee: -638 })
  eq('结算单 #1 三个数', tripleOf(m1), { balanceCents: 9560, feeCents: 638, payoutCents: 8922 })
  // D20：O1 全额退（已打款）→ −2790；O4 → 5580；#2 = 2790
  const o1full = remainingByComponent(input({ A: 14000, S: 11000, Rg: 14000, sr: true }))
  eq('D20 O1 全额退冲销', delta(o1, o1full), { SALE: -14000, PURCHASE: 11000, FEE: 210 })
  eq('D20 O1 冲销合计 = 当初打款额', sumVals(delta(o1, o1full)), -2790)
  const o4 = remainingByComponent(input({ A: 28000, S: 22000 }))
  eq('O4 三个数', triple(o4), { balanceCents: 6000, feeCents: 420, payoutCents: 5580 })
  eq('两期合计打款 = 11712', 8922 + (sumVals(delta(o1, o1full)) + sumVals(entries(o4))), 11712)
}

console.log('· 10.11 ③ 其他冲销情形')
{
  const base = remainingByComponent(input({ A: 14000, S: 11000 }))
  const rp = remainingByComponent(input({ A: 14000, S: 11000, Rg: 5000 }))
  eq('让利 5000 差额', delta(base, rp), { SALE: -5000, PURCHASE: 3929, FEE: 75 })
  eq('让利净影响 −996、剩余 1794', [sumVals(delta(base, rp)), sumVals(entries(rp))], [-996, 1794])

  const loss = defaultLossCents({ supplyCents: 11000, quantity: 1, refundedQty: 0, deliveredQty: 1 }, 1, 11000)
  eq('CHANNEL 已发卡 loss 默认 = 进货价分摊 11000', loss, 11000)
  const rc = remainingByComponent(input({ A: 14000, S: 11000, Rg: 14000, L: loss, sr: true }))
  eq('CHANNEL 全额退差额', delta(base, rc), { SALE: -14000, PURCHASE: 11000, FEE: 210, LOSS: -11000 })
  eq('CHANNEL 净影响 −13790', sumVals(delta(base, rc)), -13790)

  const sb = remainingByComponent(input({ A: 1500, S: 1000 }))
  const sl = defaultLossCents({ supplyCents: 1000, quantity: 1, refundedQty: 0, deliveredQty: 1 }, 1, 1000)
  eq('接码类 loss 默认 = 1000（不是成本 317）', sl, 1000)
  const sr = remainingByComponent(input({ A: 1500, S: 1000, Rg: 1500, L: sl, sr: true }))
  eq('接码类 CHANNEL 差额', delta(sb, sr), { SALE: -1500, PURCHASE: 1000, FEE: 23, LOSS: -1000 })
  eq('接码类 退前 477、净影响 −1477', [sumVals(entries(sb)), sumVals(delta(sb, sr))], [477, -1477])

  eq('未交付 loss = 0', defaultLossCents({ supplyCents: 22000, quantity: 2, refundedQty: 0, deliveredQty: 1 }, 1, 11000), 0)
  eq('两件已交付 1 件、退 2 件 → loss = 一半', defaultLossCents({ supplyCents: 22000, quantity: 2, refundedQty: 0, deliveredQty: 1 }, 2, 22000), 11000)
  eq('按金额让利（refundQty=0）全交付 → 全额', defaultLossCents({ supplyCents: 11000, quantity: 1, refundedQty: 0, deliveredQty: 1 }, 0, 3929), 3929)

  const pr = remainingByComponent(input({ A: 14000, S: 11000, Rg: 0 }))
  eq('PLATFORM 承担：Rg 不变 → 无差额', delta(base, pr), {})

  const invA = (Rt: number): Inv => ({ baseCents: 14000, taxCents: 840, taxActualCents: 840, refundedTaxCents: Rt })
  const i0 = remainingByComponent(input({ A: 14000, S: 11000, inv: invA(0) }))
  const i1 = remainingByComponent(input({ A: 14000, S: 11000, inv: invA(840) }))
  eq('只退税费 840：分成 280→0、INVOICE_FEE 4→0', delta(i0, i1), { INVOICE_SHARE: -280, INVOICE_FEE: 4 })
  eq('只退税费净影响 −276', sumVals(delta(i0, i1)), -276)
  const iRev = remainingByComponent(input({ A: 14000, S: 11000, inv: invA(0), ir: true }))
  eq('发票未开、货款全额退（PLATFORM）→ 发票组冲为 0', delta(i0, iRev), { INVOICE_SHARE: -280, INVOICE_FEE: 4 })

  const sf = shortFields({ amountCents: 14000, taxCents: 0, supplyCents: 11000 }, 13900, 'CHANNEL')
  eq('少付 CHANNEL：x=100、承担 100', sf, { shortCents: 100, shortChargedCents: 100, taxActualCents: 0 })
  const sh = remainingByComponent(input({ A: 14000, S: 11000, SHc: 100 }))
  eq('少付 CHANNEL 计提', entries(sh), { SALE: 14000, PURCHASE: -11000, FEE: -210, SHORT: -100 })
  eq('少付 CHANNEL 三个数', triple(sh), { balanceCents: 2900, feeCents: 210, payoutCents: 2690 })
  ok('少付 CHANNEL 站长所得不变 13900 − 2690 = 11210', 13900 - 2690 === 11000 + 210)
  const shFull = remainingByComponent(input({ A: 14000, S: 11000, SHc: 100, Rg: 14000, sr: true }))
  eq('少付后全额退差额', delta(sh, shFull), { SALE: -14000, PURCHASE: 11000, FEE: 210, SHORT: 100 })
  eq('少付后全额退净影响 −2690', sumVals(delta(sh, shFull)), -2690)

  const sp = shortFields({ amountCents: 14000, taxCents: 840, supplyCents: 11000 }, 14740, 'PLATFORM')
  eq('少付 PLATFORM（开票单）', sp, { shortCents: 100, shortChargedCents: 0, taxActualCents: 740 })
  eq('taxActualFromShort 与 shortFields 一致', taxActualFromShort(840, sp.shortCents, sp.shortChargedCents), 740)
  const spR = remainingByComponent(input({ A: 14000, S: 11000, inv: { baseCents: 14000, taxCents: 840, taxActualCents: 740, refundedTaxCents: 0 } }))
  eq('少付 PLATFORM 分录', entries(spR), { SALE: 14000, PURCHASE: -11000, FEE: -210, INVOICE_SHARE: 247, INVOICE_FEE: -4 })
  eq('少付 PLATFORM 三个数', triple(spR), { balanceCents: 3247, feeCents: 214, payoutCents: 3033 })
  const sc = shortFields({ amountCents: 14000, taxCents: 840, supplyCents: 11000 }, 14740, 'CHANNEL')
  eq('少付 CHANNEL（开票单）：渠道补足 → 税费视为全额到账', sc, { shortCents: 100, shortChargedCents: 100, taxActualCents: 840 })
  eq('足额 / 多付 → 全 0', shortFields({ amountCents: 14000, taxCents: 840, supplyCents: 11000 }, 15000, 'CHANNEL'), { shortCents: 0, shortChargedCents: 0, taxActualCents: 840 })
  eq('少付超过货款余额 → 最多扣到 A − S', shortFields({ amountCents: 14000, taxCents: 0, supplyCents: 11000 }, 9000, 'CHANNEL').shortChargedCents, 3000)

  eq('舍入边界（货款）FEE = 194', remainingByComponent(input({ A: 12900, S: 10000 })).FEE, 194)
  const rb = remainingByComponent(input({ A: 12900, S: 10000, inv: { baseCents: 12900, taxCents: 774, taxActualCents: 774, refundedTaxCents: 0 } }))
  eq('舍入边界（合算）I₀ 258、FEE 194、INVOICE_FEE 3、合计 197', [rb.INVOICE_SHARE, rb.FEE, rb.INVOICE_FEE, rb.FEE + rb.INVOICE_FEE], [258, 194, 3, 197])
  eq('小额 A=10：FEE = 0，不写行', entries(remainingByComponent(input({ A: 10, S: 5 }))), { SALE: 10, PURCHASE: -5 })
}

console.log('· remainingByComponent 随机 1000 组：多次部分退 = 一次全退；手续费合计恒等于 mulBps(G+I, f)')
{
  const rnd = (n: number) => crypto.randomInt(0, n)
  let diffs = 0
  let feeBad = 0
  let neg = 0
  let mono = 0
  for (let i = 0; i < 1000; i++) {
    const A = 100 + rnd(2_000_000)
    const S = 1 + rnd(A)
    const f = rnd(2001)
    const s = rnd(601)
    const hasInv = rnd(2) === 1
    const T = hasInv ? 1 + rnd(Math.max(1, Math.floor(A * 0.06))) : 0
    const tAct = hasInv ? rnd(T + 1) : 0
    const SHc = rnd(2) ? rnd(A - S + 1) : 0
    const mk = (Rg: number, Rt: number, sr = false) =>
      remainingByComponent({
        amountCents: A,
        supplyCents: S,
        feeRateBp: f,
        invoiceShareRateBp: s,
        settleRefundedCents: Rg,
        shortChargedCents: SHc,
        settleLossCents: 0,
        inv: hasInv ? { baseCents: A, taxCents: T, taxActualCents: tAct, refundedTaxCents: Rt } : null,
        settleReversed: sr,
        invReversed: false,
      })
    // 多次部分退款（货款与税费各自随机切成 1–5 段），逐步累计差额
    const start = mk(0, 0)
    let prev = start
    const acc: Record<string, number> = { ...(entries(start) as Record<string, number>) }
    let Rg = 0
    let Rt = 0
    const steps = 1 + rnd(5)
    for (let k = 0; k < steps; k++) {
      const last = k === steps - 1
      Rg = last ? A : Math.min(A, Rg + rnd(A - Rg + 1))
      Rt = last ? T : Math.min(T, Rt + rnd(T - Rt + 1))
      const cur = mk(Rg, Rt, last)
      for (const c of ORDER_COMPONENTS) if (cur[c] < 0) neg++
      for (const c of ['SALE', 'PURCHASE', 'SHORT', 'INVOICE_SHARE'] as OrderComponent[]) if (cur[c] > prev[c]) mono++
      const d = delta(prev, cur) as Record<string, number>
      for (const [kk, v] of Object.entries(d)) acc[kk] = (acc[kk] ?? 0) + v
      if (cur.FEE + cur.INVOICE_FEE !== mulBps(cur.SALE + cur.INVOICE_SHARE, f) || cur.INVOICE_FEE < 0) feeBad++
      prev = cur
    }
    const once = entries(mk(A, T, true)) as Record<string, number>
    for (const c of ORDER_COMPONENTS) if ((acc[c] ?? 0) !== (once[c] ?? 0)) diffs++
    // 中途任一累计值直接算 = 逐步累加（差额法的根本性质）
    const mid = mk(Math.floor(A / 3), Math.floor(T / 2))
    if (mid.FEE + mid.INVOICE_FEE !== mulBps(mid.SALE + mid.INVOICE_SHARE, f)) feeBad++
  }
  eq('多次部分退累计 ≡ 一次全退（逐成分）', diffs, 0)
  eq('Σ(FEE + INVOICE_FEE) = mulBps(G + I, f) 且 INVOICE_FEE ≥ 0', feeBad, 0)
  eq('剩余值恒非负', neg, 0)
  eq('剩余值随累计退款单调不增', mono, 0)
}

console.log('· 非法输入')
{
  let threw = false
  try {
    remainingByComponent(input({ A: 0, S: 0 }))
  } catch {
    threw = true
  }
  ok('A = 0 抛错', threw)
  threw = false
  try {
    remainingByComponent(input({ A: 100, S: -1 }))
  } catch {
    threw = true
  }
  ok('S 为负抛错（mulDivRound 只接受非负）', threw)
}

console.log('· scheduledPeriodEnd（东八区本周一 00:00）')
{
  // 2026-09-30 是周三；东八区周一 2026-09-28 00:00 = UTC 2026-09-27 16:00
  eq('周三 → 本周一', scheduledPeriodEnd(new Date('2026-09-30T05:00:00Z')).toISOString(), '2026-09-27T16:00:00.000Z')
  eq('周一 00:30（东八区）→ 当天', scheduledPeriodEnd(new Date('2026-09-27T16:30:00Z')).toISOString(), '2026-09-27T16:00:00.000Z')
  eq('周日 23:59（东八区）→ 上周一', scheduledPeriodEnd(new Date('2026-09-27T15:59:00Z')).toISOString(), '2026-09-20T16:00:00.000Z')
}

console.log('· externalOrderSourceKey')
{
  const old = crypto.createHash('sha1').update('buyer@x.com|2026-09-01|Claude Pro').digest('hex')
  eq('平台行 = 旧公式', externalOrderSourceKey({ tenantId: 1, claudeAccount: 'Buyer@X.com', startDate: '2026-09-01', subscriptionType: 'Claude Pro' }), old)
  const k2 = externalOrderSourceKey({ tenantId: 2, claudeAccount: 'buyer@x.com', startDate: '2026-09-01', subscriptionType: 'Claude Pro' })
  const k3 = externalOrderSourceKey({ tenantId: 3, claudeAccount: 'buyer@x.com', startDate: '2026-09-01', subscriptionType: 'Claude Pro' })
  ok('渠道行带 t<id>: 前缀', k2.startsWith('t2:') && k3.startsWith('t3:'))
  ok('两站同邮箱同开通日不撞键', k2 !== k3 && k2 !== old && k2.length <= 128)
  let threw = false
  try {
    externalOrderSourceKey({ tenantId: 0, claudeAccount: 'a@b.c', startDate: '2026-01-01', subscriptionType: 'x' })
  } catch {
    threw = true
  }
  ok('tenantId 非法抛错', threw)
}

console.log('· 邮件 origin（W3-11 渲染层）')
{
  const APP = (process.env.NEXT_PUBLIC_APP_URL || 'https://bigolab.com').replace(/\/+$/, '')
  const LULU = 'https://lulu.bigolab.com'
  const order = { orderNo: 'O123', productName: 'Claude Pro', amount: 140, invoiceTaxFee: 8.4, deliveryType: 'MANUAL' }
  const inv = { invoiceNo: 'INV1', title: '某公司', taxNumber: '91110000', subscriptionType: 'Claude Pro', invoiceAmount: 148.4, issuedAt: new Date('2026-09-01T00:00:00Z') }
  const renders: [string, (o?: { origin?: string }) => { subject: string; html: string }][] = [
    ['已支付', (o) => renderOrderPaidEmail(order, o)],
    ['已交付', (o) => renderOrderDeliveredEmail({ ...order, deliveryInfo: 'x' }, o)],
    ['发票已开', (o) => renderInvoiceIssuedEmail(inv, o)],
    ['验证码', (o) => renderVerifyCodeEmail('123456', 'RESET', o)],
    ['已注册提醒', (o) => renderAccountExistsEmail(o)],
    ['找回提醒', (o) => renderNoAccountEmail(o)],
    ['查订阅提醒', (o) => renderNoSubscriptionEmail(o)],
    ['客服回复', (o) => renderOrderReplyEmail({ orderNo: 'O123', productName: 'Claude Pro' }, o)],
  ]
  const hrefs = (html: string) => Array.from(html.matchAll(/href="([^"]+)"/g)).map((m) => m[1])
  for (const [name, r] of renders) {
    const a = r()
    const b = r({})
    ok(`${name}：不传 origin 与传空对象逐字相同`, a.html === b.html && a.subject === b.subject)
    ok(`${name}：默认链接全是原常量域名`, hrefs(a.html).every((h) => h.startsWith(APP)), hrefs(a.html).join(' '))
    const c = r({ origin: LULU + '/' })
    const hs = hrefs(c.html)
    ok(`${name}：渠道 origin 下所有链接都是 lulu`, hs.length > 0 && hs.every((h) => h.startsWith(LULU)), hs.join(' '))
    ok(`${name}：渠道 origin 下不出现主站链接`, !c.html.includes(APP + '/') || APP === LULU)
    const bad = r({ origin: 'javascript:alert(1)' })
    ok(`${name}：非法 origin 回落原常量`, hrefs(bad.html).every((h) => h.startsWith(APP)))
  }
  const invite = renderTenantInviteEmail({ link: `${LULU}/partner/invite/abc`, expiresHours: 24 }, { origin: LULU })
  ok('邀请邮件链接是渠道域名', hrefs(invite.html).every((h) => h.startsWith(LULU)))
  // 没有账号的被邀请人：提示先到主站注册（终审完整性 #21）。主站地址只写成文字，信里的链接仍全部指向渠道
  const invite2 = renderTenantInviteEmail({ link: `${LULU}/partner/invite/abc`, expiresHours: 24, registerUrl: `${APP}/register` }, { origin: LULU })
  ok('邀请邮件带主站注册提示（文字），链接仍全是渠道域名', invite2.html.includes(`${APP}/register`) && hrefs(invite2.html).every((h) => h.startsWith(LULU)))
  const invite3 = renderTenantInviteEmail({ link: `${LULU}/partner/invite/abc`, expiresHours: 24, registerUrl: 'javascript:alert(1)//register' }, { origin: LULU })
  ok('邀请邮件：注册地址不合规就不输出提示', !invite3.html.includes('javascript:') && !invite3.html.includes('还没有'))
  for (const m of [renderOrderReplyEmail({ orderNo: 'O1', productName: 'x' }), invite]) {
    const hit = findBannedWord(m.subject) || findBannedWord(m.html) || findBannedWord(visibleTextOf(m.html))
    ok(`新模板过禁发词表：${m.subject}`, !hit, String(hit))
  }
}

console.log(`\n${fail === 0 ? '✅' : '❌'} 通过 ${pass}，失败 ${fail}`)
process.exit(fail === 0 ? 0 : 1)
