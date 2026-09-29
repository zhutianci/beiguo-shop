/**
 * 可售判定（docs/短信接码-设计.md §6.1 gate、§1.5「起价只在可售组合里算」、附录 B 第 26 条）。
 *
 * S1 交付「列表层」的 ①–④（目录列表、「¥x 起」、国家列表的「暂停销售」都只用这四项，§1.5）：
 *   ① sms_holds 的 global 有效（熔断、封禁、币种异常…，until 为空或未到）→ MAINTENANCE；
 *   ② svc:<服务>、country:<国家>、combo:<服务>:<国家> 任一有效（自动停售或站长手动停售）→ HOLD；
 *   ③ 服务或国家 status=OFF（手动下架）→ HOLD；
 *   ④ 按 §4.3 优先级解析出的覆盖规则 disabled=true → HOLD。
 * 「手动停售」的三种机制（status=OFF、规则 disabled、sms_holds 的 ADMIN 来源）出厂都为空（D25、Q2）；这里三处都查。
 * S2 在 checkSellable 里接着加 ⑤ 线程与在途号码数、⑥ 上游余额够付本单（E26）——**只在下单时做，不参与列表**。
 *
 * `threads` 这个 key 不是停售（线程受限时按剩余线程收单，E5），列表层不看它。
 * 纯函数部分（comboBlock、isHoldActive）不连库，scripts/check-jiema-pricing.ts 覆盖。
 */
import { prisma } from '../db'
import { resolveRule, HOLD_KEY_RE, canonicalHoldKey, type PriceRuleLike } from './pricing'

export interface HoldLike {
  key: string
  until: Date | null
  reason: string
  source: string
  note?: string | null
}

export interface GateData {
  holds: ReadonlyMap<string, HoldLike>
  offServices: ReadonlySet<string>
  offCountries: ReadonlySet<number>
  rules: ReadonlyMap<string, PriceRuleLike>
}

export type BlockKind = 'global' | 'svc' | 'country' | 'combo' | 'svcOff' | 'countryOff' | 'disabled'
export interface ComboBlock {
  code: 'MAINTENANCE' | 'HOLD'
  kind: BlockKind
  hold: HoldLike | null
}

/** 停售记录现在有效吗：until 为空（需要手动解除）或还没到 */
export function isHoldActive(h: Pick<HoldLike, 'until'> | undefined | null, now: Date): boolean {
  if (!h) return false
  return h.until == null || h.until.getTime() > now.getTime()
}

/** 纯函数：一个组合在列表层可售吗（null = 可售） */
export function comboBlock(g: GateData, service: string, country: number, now: Date, global: { markupCents: number; tolerancePct: number }): ComboBlock | null {
  const gh = g.holds.get('global')
  if (isHoldActive(gh, now)) return { code: 'MAINTENANCE', kind: 'global', hold: gh ?? null }
  for (const [kind, key] of [
    ['combo', `combo:${service}:${country}`],
    ['svc', `svc:${service}`],
    ['country', `country:${country}`],
  ] as const) {
    const h = g.holds.get(key)
    if (isHoldActive(h, now)) return { code: 'HOLD', kind, hold: h ?? null }
  }
  if (g.offServices.has(service)) return { code: 'HOLD', kind: 'svcOff', hold: null }
  if (g.offCountries.has(country)) return { code: 'HOLD', kind: 'countryOff', hold: null }
  if (resolveRule(g.rules, service, country, global).disabled) return { code: 'HOLD', kind: 'disabled', hold: null }
  return null
}

export { HOLD_KEY_RE, canonicalHoldKey }

/**
 * 纯函数：「+ 手动停售」能不能写到这个范围上（S1 评审修复：原来直接 upsert，会把自动停售改成会自己到期的手动停售）。
 *  · 没有记录、或原记录已过期 → 可以（覆盖）；
 *  · 原记录生效中、而且是自动停售（source≠ADMIN：熔断、封禁、币种异常…）→ 拒绝：原因与「需要手动解除」不能被手动停售改掉，要先「解除」；
 *  · 原记录生效中、是手动停售 → 只能延长或改成手动解除，不能缩短（null 比任何时间都严，晚的比早的严）。
 * 返回 null = 可以写；否则是给后台看的拒绝原因。
 */
export function adminHoldConflict(existing: Pick<HoldLike, 'until' | 'reason' | 'source'> | null | undefined, nextUntil: Date | null, now: Date): string | null {
  if (!existing || !isHoldActive(existing, now)) return null
  if (existing.source !== 'ADMIN') {
    return `这个范围有生效中的自动停售（原因 ${existing.reason}${existing.until ? `，到期 ${existing.until.toISOString()}` : '，需要手动解除'}），手动停售不能覆盖它；确认要改请先「解除」`
  }
  if (existing.until == null && nextUntil != null) return '这个范围已经是「手动解除」的停售，不能改成会自己到期的；要提前恢复请点「解除」'
  if (existing.until != null && nextUntil != null && nextUntil.getTime() < existing.until.getTime()) {
    return `这个范围的停售到 ${existing.until.toISOString()}，新截止时间更早（不能缩短）；要提前恢复请点「解除」`
  }
  return null
}

/** 纯函数：全局停售（熔断等）现在有效吗 */
export function globalHold(g: GateData, now: Date): HoldLike | null {
  const h = g.holds.get('global')
  return isHoldActive(h, now) ? (h ?? null) : null
}

/**
 * 给买家看的「暂停销售」原因（不出现上游名称、不回显 note 原文，§1.13 品牌红线）。
 * 自动停售按原因说人话；手动停售（ADMIN）、手动下架、disabled 规则一律「这个组合暂停销售」（§1.14）。
 */
export function holdReasonText(b: ComboBlock, now: Date): string {
  if (b.code === 'MAINTENANCE') return '接码服务维护中，预计很快恢复'
  const until = b.hold?.until && b.hold.until.getTime() > now.getTime() ? b.hold.until : null
  const hhmm = until
    ? new Date(until.getTime() + 8 * 3600_000).toISOString().slice(11, 16) // 北京时间
    : null
  const base =
    b.hold && b.hold.source !== 'ADMIN' && (b.hold.reason === 'LOW_SUCCESS' || b.hold.reason === 'UPSTREAM_STATS')
      ? '近期成功率低'
      : '暂停销售'
  return hhmm ? `${base}，暂停到 ${hhmm}` : base
}

/** 从库里拉列表层判定要的数据（几条小查询；目录快照每 60 秒最多一次） */
export async function loadGateData(): Promise<GateData> {
  const [holds, offS, offC, rules] = await Promise.all([
    prisma.smsHold.findMany({ select: { key: true, until: true, reason: true, source: true, note: true } }),
    prisma.smsService.findMany({ where: { status: 'OFF' }, select: { code: true } }),
    prisma.smsCountry.findMany({ where: { status: 'OFF' }, select: { id: true } }),
    prisma.smsPriceRule.findMany({ select: { scopeKey: true, markupCents: true, tolerancePct: true, disabled: true } }),
  ])
  return {
    holds: new Map(holds.map((h) => [h.key, h])),
    offServices: new Set(offS.map((s) => s.code)),
    offCountries: new Set(offC.map((c) => c.id)),
    rules: new Map(rules.map((r) => [r.scopeKey, r])),
  }
}
