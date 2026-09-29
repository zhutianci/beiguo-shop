/**
 * 短信接码 · 未关联激活的分类监控（docs/短信接码-设计.md §7.1「上游有 N 个不属于本站记录的进行中号码（外部激活 · 旧链路遗留）」、
 * §9.4 R3、§10.3、附录 B 第 5 条；S4）。
 *
 * 「本站认识」的激活 = sms_attempts.activationId ∪ 旧表 sms_activations.activationId ∪ 旧单品订单备注里「旧号 xxx 已取消」的号码
 * （旧表只保存当前号，旧链路换下的号只在备注里，§2.4）。其余的按 recon-rules.classifyUnlinked 分两类：
 *   · 旧链路遗留：落在旧单品会卖的服务、且在某张旧单品订单付款后 30 分钟内创建 —— 只列出，不推送；
 *   · 外部激活：站长在官网手动买的、或孤儿号 —— 推一次 sms.alert（与扫描器同一个节流键 EXTERNAL:<id>、同一个进程内去重集合）。
 * **任何情况下都不取消来历不明的激活**（附录 B 第 5 条）；同服务同国家还有结果未知 / 取号中的尝试时，这些激活可能正等着被认领，
 * 标 pendingClaim、不推送（由扫描器按 §2.4 处理）。
 *
 * jiema-tick 每 10 分钟拉一次 v1 活跃列表（拉不全就作废，不给半截），结果写 settings.sms_unlinked_last（单一写入方：tick），
 * 后台概览「需要处理」与「对账」tab 读它。R3（history 里的已结束激活）在每日对账里用同一套判定。
 */
import { prisma } from '../db'
import * as up from './upstream'
import { legacyOldPhones } from './machine'
import { classifyUnlinked, type UnlinkedKind } from './recon-rules'
import { smsAlert } from './alert'
import { jnow, rt } from './runtime'

export const UNLINKED_KEY = 'sms_unlinked_last'
/** 快照里每类最多列多少条（settings.value 是 TEXT） */
const LIST_MAX = 50
const S = 1000

export interface UnlinkedItem {
  id: string
  service: string | null
  country: number | null
  createdAt: string | null
  priceMicro: number | null
  phoneTail: string | null
  kind: UnlinkedKind
  /** 同服务同国家还有取号中 / 结果未知的尝试：可能正等着被认领（不推送） */
  pendingClaim: boolean
}

export interface UnlinkedSnapshot {
  at: string
  ok: boolean
  reason?: string
  /** 上游进行中的激活总数（拉全了的） */
  total: number
  external: UnlinkedItem[]
  legacy: UnlinkedItem[]
  externalCount: number
  legacyCount: number
}

/** 近 since 以来旧单品订单备注里换下的号码（旧表只保存当前号，§2.4） */
export async function legacyOldPhoneSet(since: Date): Promise<Set<string>> {
  const rows = await prisma.order.findMany({
    where: { updatedAt: { gte: since }, remark: { contains: '旧号' }, product: { deliveryType: 'SMS' } },
    select: { remark: true },
    take: 5000,
  })
  const out = new Set<string>()
  for (const r of rows) for (const p of legacyOldPhones(r.remark)) out.add(p)
  return out
}

/** 旧单品会卖的服务（products 里 deliveryType=SMS 的 smsService，小写）与 [from, to] 里旧单品订单的付款时刻 */
export async function legacyContext(from: Date, to: Date): Promise<{ services: Set<string>; paidMs: number[] }> {
  const [prods, paid] = await Promise.all([
    prisma.product.findMany({ where: { deliveryType: 'SMS', smsService: { not: null } }, select: { smsService: true } }),
    prisma.order.findMany({ where: { product: { deliveryType: 'SMS' }, paidAt: { gte: from, lte: to } }, select: { paidAt: true }, take: 20_000 }),
  ])
  return {
    services: new Set(prods.map((p) => (p.smsService ?? '').toLowerCase()).filter(Boolean)),
    paidMs: paid.map((p) => (p.paidAt as Date).getTime()).sort((a, b) => a - b),
  }
}

/** 这批激活 id 里本站认识的（sms_attempts / sms_activations），分批查 */
export async function knownActivationIds(ids: readonly string[]): Promise<{ attempts: Set<string>; legacy: Set<string> }> {
  const attempts = new Set<string>()
  const legacy = new Set<string>()
  for (let i = 0; i < ids.length; i += 1000) {
    const part = ids.slice(i, i + 1000)
    const [a, l] = await Promise.all([
      prisma.smsAttempt.findMany({ where: { activationId: { in: part } }, select: { activationId: true } }),
      prisma.smsActivation.findMany({ where: { activationId: { in: part } }, select: { activationId: true } }),
    ])
    for (const x of a) if (x.activationId) attempts.add(x.activationId)
    for (const x of l) legacy.add(x.activationId)
  }
  return { attempts, legacy }
}

function snapshotOf(at: Date, total: number, items: UnlinkedItem[]): UnlinkedSnapshot {
  const external = items.filter((i) => i.kind === 'EXTERNAL')
  const legacy = items.filter((i) => i.kind === 'LEGACY')
  return { at: at.toISOString(), ok: true, total, external: external.slice(0, LIST_MAX), legacy: legacy.slice(0, LIST_MAX), externalCount: external.length, legacyCount: legacy.length }
}

async function save(s: UnlinkedSnapshot): Promise<void> {
  const value = JSON.stringify(s)
  await prisma.setting.upsert({ where: { key: UNLINKED_KEY }, create: { key: UNLINKED_KEY, value }, update: { value } }).catch((e) => console.error('[jiema] 写 sms_unlinked_last 失败', (e as Error)?.message))
}

/**
 * 拉一次 v1 活跃列表、分类、写快照；新出现的外部激活推一次 sms.alert（不取消任何激活）。
 * 列表拉不全（任何一页失败）→ 快照标 ok=false、保留上一次的清单（不把「没拉到」当成「没有」）。
 */
export async function scanUnlinked(now: Date = jnow(), opts: { alert?: boolean } = {}): Promise<UnlinkedSnapshot> {
  if (!up.upstreamConfigured()) return { at: now.toISOString(), ok: false, reason: '上游 key 没配置', total: 0, external: [], legacy: [], externalCount: 0, legacyCount: 0 }
  const list = await up.v1AllActivations().catch(() => null)
  if (!list || list.kind !== 'ok') {
    const prev = await lastUnlinked()
    const s: UnlinkedSnapshot = {
      ...(prev ?? { total: 0, external: [], legacy: [], externalCount: 0, legacyCount: 0 }),
      at: now.toISOString(),
      ok: false,
      reason: `上游活跃列表没拉全（${list ? list.kind : 'error'}），保留上一次的清单`,
    }
    await save(s)
    return s
  }
  const items = list.data.items
  // 【先查取号中 / 结果未知的尝试，再查本站认识的 id】（S4 评审修复）：顺序反过来时，一个取号中的尝试若在两次查询之间
  // 写下 activationId（REQUESTING → ACTIVE），它既不在「认识的 id」里、也不再算「取号中」，本站刚给买家取的号就被当成外部激活推送。
  // 先查取号中：那一刻还是 REQUESTING 的 → pendingClaim；已经写下 activationId 的 → 之后的 knownActivationIds 一定看得到。
  const inflight = await prisma.smsAttempt.findMany({ where: { state: { in: ['REQUESTING', 'UNKNOWN'] } }, select: { service: true, country: true } })
  const pendingKeys = new Set(inflight.map((a) => `${a.service}:${a.country}`))
  const { attempts, legacy } = await knownActivationIds(items.map((i) => i.id))
  const oldPhones = await legacyOldPhoneSet(new Date(now.getTime() - 48 * 3600 * S))
  const free = items.filter((i) => !attempts.has(i.id) && !legacy.has(i.id) && !(i.phone && oldPhones.has(i.phone)))
  if (!free.length) {
    const s = snapshotOf(now, items.length, [])
    await save(s)
    return s
  }
  const oldest = Math.min(...free.map((f) => (f.createdAt ? f.createdAt.getTime() : now.getTime())))
  const ctx = await legacyContext(new Date(oldest - 60 * 60 * S), now)
  const pre: UnlinkedItem[] = free.map((f) => ({
    id: f.id,
    service: f.service,
    country: f.country,
    createdAt: f.createdAt ? f.createdAt.toISOString() : null,
    priceMicro: f.priceMicro,
    phoneTail: f.phone ? f.phone.slice(-4) : null,
    kind: classifyUnlinked({ service: f.service, createdAt: f.createdAt }, ctx.services, ctx.paidMs),
    pendingClaim: pendingKeys.has(`${f.service}:${f.country}`),
  }))
  // 推送前对外部激活再核一次：这期间被本站的尝试（取号写回、后台认领）或旧表认下的，不算外部激活
  const extIds = pre.filter((f) => f.kind === 'EXTERNAL').map((f) => f.id)
  const late = extIds.length ? await knownActivationIds(extIds) : { attempts: new Set<string>(), legacy: new Set<string>() }
  const out = pre.filter((f) => !late.attempts.has(f.id) && !late.legacy.has(f.id))
  if (opts.alert !== false) {
    for (const f of out) {
      if (f.kind !== 'EXTERNAL' || f.pendingClaim || rt().externalAlerted.has(f.id)) continue
      rt().externalAlerted.add(f.id)
      if (rt().externalAlerted.size > 5000) rt().externalAlerted.clear()
      smsAlert(`EXTERNAL:${f.id}`, '上游有一个本站不认识的激活（外部激活，不会自动取消）', [
        { label: '激活', value: f.id },
        { label: '组合', value: `${f.service ?? '?'} · ${f.country ?? '?'}` },
        { label: '创建', value: f.createdAt ?? '—' },
        { label: '说明', value: '站长在官网手动买的，或历史遗留；确认无用可到上游后台自行处理' },
      ], { link: '/admin/jiema?tab=reconcile', throttleMs: 0 })
    }
  }
  const s = snapshotOf(now, items.length, out)
  await save(s)
  return s
}

export async function lastUnlinked(): Promise<UnlinkedSnapshot | null> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: UNLINKED_KEY } })
    return row?.value ? (JSON.parse(row.value) as UnlinkedSnapshot) : null
  } catch {
    return null
  }
}
