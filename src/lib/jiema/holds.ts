/**
 * 短信接码 · 停售、熔断、组合成功率监控（docs/短信接码-设计.md D43、E4–E7、E20、E55、E56、§10.1、§5.3 末段）。
 * 与余额预扣（balance_holds，lib/wallet/hold.ts）无关，名字相近而已。sms_holds 的写入方只有本文件与后台「目录 → 停售」。
 *
 * 【自动停售不放宽更严的停售】（S1 评审修复第 11 条的另一半）同一范围已有生效中的停售、而且比这次更严（需要手动解除，或截止更晚）时，
 * 原样保留（原因、来源都不动）；站长的手动停售（ADMIN）同样不被自动停售覆盖成会自己到期的。线程受限（key='threads'）只更新 note 与更晚的截止。
 *
 * 【熔断】（E20）最近 2 分钟「超时、网络、5xx + 取号路径上的 unknown」≥5 次且占比 ≥50% → 打开（写 sms_holds global / BREAKER，新单停售，
 * 已付款的 ACQUIRING 单按 E59 在 90 秒内退回余额）；打开后每轮用 getBalance 探活，连续成功 3 分钟关闭（只删 reason=BREAKER 的那一行，
 * 不碰封禁、币种异常、key 失效这些需要手动解除的全局停售）。计数与状态在进程内存，库里那一行只是让「停售」这个结论可见。
 *
 * 【上游余额不停售】（Q4）这里没有任何「余额低于 X 停售」的逻辑，也没有每日扣费上限。
 */
import { prisma } from '../db'
import * as up from './upstream'
import { runtimeParams } from './config'
import { smsAlert } from './alert'
import { isHoldActive } from './gate'
import { rt, jnow, periodicDue, setTightenUntil } from './runtime'
import { localComboVerdict, upstreamComboVerdict, upstreamAccountVerdict, nextThreadsReset } from './machine'

export type HoldSource = 'AUTO' | 'UPSTREAM'

/**
 * 写一条自动停售（不放宽更严的已有停售）。返回 SET（写了）/ KEPT（已有更严的，原样保留）。
 * 读—判—写在一个事务里锁住这一行（与后台手动停售同一做法）；行不存在时并发插入撞主键就重来一次。
 */
export async function putAutoHold(key: string, until: Date | null, reason: string, source: HoldSource = 'AUTO', note?: string | null): Promise<'SET' | 'KEPT'> {
  const now = jnow()
  for (let i = 0; i < 2; i++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const rows = await tx.$queryRaw<{ key: string; until: Date | null; reason: string; source: string }[]>`SELECT \`key\`, until, reason, source FROM sms_holds WHERE \`key\` = ${key} FOR UPDATE`
        const ex = rows[0]
        if (ex && isHoldActive(ex, now)) {
          if (key === 'threads') {
            const u = ex.until == null || (until != null && ex.until.getTime() >= until.getTime()) ? ex.until : until
            await tx.smsHold.update({ where: { key }, data: { until: u, note: note ?? null } })
            return 'SET' as const
          }
          const stricter = ex.until == null || (until != null && ex.until.getTime() >= until.getTime())
          if (stricter) return 'KEPT' as const
          if (ex.source === 'ADMIN' && until != null) return 'KEPT' as const
        }
        const data = { until, reason: reason.slice(0, 24), source, note: note ? note.slice(0, 200) : null }
        if (ex) await tx.smsHold.update({ where: { key }, data })
        else await tx.smsHold.create({ data: { key, ...data } })
        return 'SET' as const
      })
    } catch (e) {
      if ((e as { code?: string })?.code === 'P2002' && i === 0) continue
      throw e
    }
  }
  return 'KEPT'
}

const hoursLater = (h: number) => new Date(jnow().getTime() + h * 3600_000)

// ───────────────────────── 取号错误的全局副作用（E4、E5、E6、E7、E56） ─────────────────────────

/** E4 封禁：scope=specific 停这个组合、global 全局停售，都到 banned_until（没有就 30 分钟） */
export async function holdForBan(p: { scope: 'global' | 'specific'; untilMs: number | null; service: string; country: number }): Promise<void> {
  const until = new Date(p.untilMs && p.untilMs > jnow().getTime() ? p.untilMs : jnow().getTime() + 30 * 60_000)
  const key = p.scope === 'global' ? 'global' : `combo:${p.service}:${p.country}`
  await putAutoHold(key, until, 'BANNED', 'UPSTREAM')
  smsAlert(`BANNED:${key}`, p.scope === 'global' ? '上游封禁（全局）：新单停售' : '上游封禁（组合）：该组合停售', [
    { label: '范围', value: key },
    { label: '截止', value: until.toISOString() },
    { label: '影响', value: p.scope === 'global' ? '全部新单停售；已付款的在途单按 E59 在 90 秒内退回余额；旧单品同样受影响' : '该组合停售；其余组合照常' },
  ])
}

/** E5 线程受限：写 threads（note 记上限，截止下一个 21:00 UTC）。不整体停售，按剩余线程收单、暂停换号 */
export async function holdForThreads(p: { maxAllowed: number | null; currentThreads: number | null }): Promise<void> {
  const until = nextThreadsReset(jnow())
  await putAutoHold('threads', until, 'CHANNELS_LIMIT', 'UPSTREAM', JSON.stringify({ maxAllowed: p.maxAllowed, currentThreads: p.currentThreads }))
  smsAlert('CHANNELS_LIMIT', '上游线程受限：按剩余线程收单，暂停换号', [
    { label: '上限', value: String(p.maxAllowed ?? '—') },
    { label: '当前线程', value: String(p.currentThreads ?? '—') },
    { label: '重置', value: `${until.toISOString()}（每天 21:00 UTC）` },
    { label: '注意', value: '旧 Codex / Claude 单品共用上游线程，同样会受影响' },
  ])
}

/** E6 服务 / 国家不可用：停这个组合 6 小时 */
export async function holdForUnavailable(p: { service: string; country: number; code: string }): Promise<void> {
  await putAutoHold(`combo:${p.service}:${p.country}`, hoursLater(6), 'SERVICE_NA', 'UPSTREAM', p.code)
  smsAlert(`SERVICE_NA:${p.service}:${p.country}`, '上游说这个组合不可用：停售 6 小时', [
    { label: '组合', value: `${p.service} · ${p.country}` },
    { label: '错误码', value: p.code },
  ])
}

/** E7 key 失效或账户异常：全局停售，**不自动恢复**（需要站长修好配置后在后台「目录 → 停售」手动解除） */
export async function holdForKey(code: string): Promise<void> {
  await putAutoHold('global', null, 'KEY', 'UPSTREAM', code)
  smsAlert('KEY_INVALID', '上游 key 失效或账户异常：全局停售（不自动恢复）', [
    { label: '错误码', value: code },
    { label: '处理', value: '核对 HEROSMS_API_KEY 与上游账户状态，修好后到后台「短信接码 → 目录 → 停售」解除 global' },
  ])
}

/** E56 币种不是美元：全局停售并紧急推送（已取到的号照常服务、成本先按原值记，由站长核实） */
export async function holdForCurrency(p: { currency: number | null; where: string }): Promise<void> {
  await putAutoHold('global', null, 'CURRENCY', 'UPSTREAM', `currency=${p.currency ?? '?'} @${p.where}`)
  smsAlert('CURRENCY', '上游返回的币种不是美元：全局停售（需手动解除）', [
    { label: '币种', value: String(p.currency ?? '认不出') },
    { label: '来源', value: p.where },
    { label: '处理', value: '已取到的号照常服务、成本先按原值记并标「币种异常」；核实后到后台解除 global' },
  ])
}

/** E55：同一组合 24 小时内第二次 FREE_CANCELLATION_EXPIRED → 自动停售这个组合（holdH 小时），推送 */
export async function checkExpiredChargeCombo(service: string, country: number): Promise<void> {
  const since = new Date(jnow().getTime() - 24 * 3600_000)
  const n = await prisma.smsAttempt.count({ where: { service, country, chargeSource: 'EXPIRED', closedAt: { gte: since } } })
  smsAlert(`EXPIRED_CHARGE:${service}:${country}`, '放号时上游返回「免费取消期已过」：没码却被扣费（订单照样整单退回余额）', [
    { label: '组合', value: `${service} · ${country}` },
    { label: '近 24 小时次数', value: String(n) },
    { label: '提示', value: '这个组合可能不是 20 分钟免费取消；连续出现 2 次自动停售' },
  ])
  if (n >= 2) await putAutoHold(`combo:${service}:${country}`, hoursLater(runtimeParams().autoHold.holdH), 'EXPIRED_CHARGE', 'AUTO', `${n} 次/24h`)
}

// ───────────────────────── 熔断（E20） ─────────────────────────

/** 每轮 tick 调：按最近 2 分钟的调用计数开 / 关熔断；打开期间用 getBalance 探活 */
export async function evaluateBreaker(): Promise<{ open: boolean; changed: boolean }> {
  const cfg = runtimeParams().breaker
  const st = rt().breaker
  const now = jnow().getTime()
  if (!st.open) {
    // 进程重启后从库里接上：global 停售的原因是 BREAKER，说明上一个进程打开过、还没关
    const g = await prisma.smsHold.findUnique({ where: { key: 'global' } })
    if (g && g.reason === 'BREAKER' && isHoldActive(g, jnow())) {
      st.open = true
      st.openedAt = g.createdAt.getTime()
      st.okSince = null
    }
  }
  if (!st.open) {
    const c = up.breakerCounts(cfg.windowSec * 1000)
    if (c.bad >= cfg.minFails && c.total > 0 && c.bad / c.total >= cfg.minRatio) {
      st.open = true
      st.openedAt = now
      st.okSince = null
      await putAutoHold('global', null, 'BREAKER', 'AUTO', `bad=${c.bad}/${c.total}`)
      smsAlert('BREAKER_OPEN', '上游异常，熔断打开：新单停售', [
        { label: '最近 2 分钟', value: `超时 / 网络 / 5xx ${c.bad} 次，共 ${c.total} 次` },
        { label: '影响', value: '新单「接码服务维护中」；已付款的 ACQUIRING 单按 E59 在 90 秒内退回余额；连续探活成功 3 分钟后自动关闭' },
      ])
      return { open: true, changed: true }
    }
    return { open: false, changed: false }
  }
  // 打开中：探活
  const r = await up.getBalance().catch(() => null)
  if (r && r.kind === 'ok') {
    if (st.okSince == null) st.okSince = now
  } else {
    st.okSince = null
  }
  if (st.okSince != null && now - st.okSince >= cfg.closeAfterSec * 1000) {
    st.open = false
    st.openedAt = null
    st.okSince = null
    await prisma.smsHold.deleteMany({ where: { key: 'global', reason: 'BREAKER' } })
    smsAlert('BREAKER_CLOSE', '上游恢复，熔断已关闭', [{ label: '说明', value: `连续探活成功 ${cfg.closeAfterSec} 秒` }], { throttleMs: 0 })
    return { open: false, changed: true }
  }
  return { open: true, changed: false }
}

// ───────────────────────── 本站口径的组合成功率（D43，每 5 分钟） ─────────────────────────

/**
 * 近 windowH 小时同一组合「取到号且已有结论」的号码（有 activationId，并且已收码或已结束）：
 * ≥8 个号 0 收码、或 ≥20 个号收码率 <12% → 停售 holdH 小时（LOW_SUCCESS）。还在等码的号不算失败。
 */
export async function checkLocalSuccess(): Promise<number> {
  const p = runtimeParams().autoHold
  const windowH = Math.max(p.zero.windowH, p.ratio.windowH)
  const since = new Date(jnow().getTime() - windowH * 3600_000)
  const rows = await prisma.$queryRaw<{ service: string; country: number; cnt: bigint | number; ok: bigint | number | null }[]>`
    SELECT service, country, COUNT(*) AS cnt,
           SUM(CASE WHEN sms_count > 0 OR state IN ('RECEIVED', 'FINISHED') THEN 1 ELSE 0 END) AS ok
      FROM sms_attempts
     WHERE activation_id IS NOT NULL AND requested_at >= ${since}
       AND (sms_count > 0 OR state IN ('RECEIVED', 'FINISHED', 'CANCELLED'))
     GROUP BY service, country`
  let held = 0
  for (const r of rows) {
    const v = localComboVerdict(Number(r.cnt), Number(r.ok ?? 0), p)
    if (!v) continue
    const key = `combo:${r.service}:${Number(r.country)}`
    const done = await putAutoHold(key, hoursLater(p.holdH), 'LOW_SUCCESS', 'AUTO', `${v} ${Number(r.ok ?? 0)}/${Number(r.cnt)}`)
    if (done === 'SET') {
      held++
      smsAlert(`LOW_SUCCESS:${key}`, '本站组合成功率过低，自动停售', [
        { label: '组合', value: `${r.service} · ${Number(r.country)}` },
        { label: '近 24 小时', value: `${Number(r.cnt)} 个号，收码 ${Number(r.ok ?? 0)} 个` },
        { label: '停售', value: `${p.holdH} 小时` },
      ])
    }
  }
  return held
}

// ───────────────────────── 上游口径（/activations/stats，每 10 分钟，D43） ─────────────────────────

const utcDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/**
 * 拉上游 stats（当天与前一天，含旧单品与站长手动购买）：组合 ≥70 个号且 <8% → 停售该组合 holdH 小时并预警；
 * 账户整体 ≥350 个号且 <5% → 新单的免费换号收紧到 2 次、推送；同时被自动停售的组合达到 3 个 → 加推一次紧急告警。
 * 任何一天拉取失败 → 这一轮不下结论（不当成 0）。
 */
export async function checkUpstreamStats(): Promise<{ ok: boolean; held: number; tighten: boolean }> {
  const p = runtimeParams().autoHold
  const now = jnow().getTime()
  const days = [utcDay(now), utcDay(now - 86400_000)]
  const agg = new Map<string, { count: number; success: number }>()
  for (const d of days) {
    const r = await up.v1Stats(d).catch(() => null)
    if (!r || r.kind !== 'ok') return { ok: false, held: 0, tighten: false }
    for (const [cid, svcs] of Object.entries(r.data)) {
      for (const [svc, cell] of Object.entries(svcs)) {
        const k = `${svc}:${cid}`
        const cur = agg.get(k) ?? { count: 0, success: 0 }
        cur.count += cell.count
        cur.success += cell.success
        agg.set(k, cur)
      }
    }
  }
  let held = 0
  let total = 0
  let success = 0
  for (const [k, v] of Array.from(agg.entries())) {
    total += v.count
    success += v.success
    if (!upstreamComboVerdict(v.count, v.success, p)) continue
    const key = `combo:${k}`
    if (!/^combo:[a-z0-9]{2,4}:\d{1,3}$/.test(key)) continue
    const done = await putAutoHold(key, hoursLater(p.holdH), 'UPSTREAM_STATS', 'AUTO', `${v.success}/${v.count}`)
    if (done === 'SET') {
      held++
      smsAlert(`UPSTREAM_STATS:${key}`, '上游口径：组合成功率接近封禁线，已停售并预警', [
        { label: '组合', value: k },
        { label: '上游统计（今天 + 昨天）', value: `${v.count} 个号，成功 ${v.success} 个` },
        { label: '说明', value: '上游封禁线是同组合 ≥100 个号且成功率 <6%；统计包含旧单品与手动购买' },
      ])
    }
  }
  const tighten = upstreamAccountVerdict(total, success, p)
  setTightenUntil(tighten ? now + 20 * 60_000 : null)
  if (tighten) {
    smsAlert('UPSTREAM_ACCOUNT', '上游口径：账户整体成功率接近限线程线，新单换号次数已收紧到 2 次', [
      { label: '账户（今天 + 昨天）', value: `${total} 个号，成功 ${success} 个` },
      { label: '说明', value: '上游限线程线是 ≥500 个号且 <3%' },
    ], { throttleMs: 6 * 3600_000 })
  }
  const activeCombos = await prisma.smsHold.count({
    where: { key: { startsWith: 'combo:' }, source: { not: 'ADMIN' }, reason: { in: ['LOW_SUCCESS', 'UPSTREAM_STATS', 'BANNED', 'EXPIRED_CHARGE'] }, OR: [{ until: null }, { until: { gt: jnow() } }] },
  })
  if (activeCombos >= 3) {
    smsAlert('MANY_COMBO_HOLDS', `紧急：同时被自动停售的组合已有 ${activeCombos} 个`, [
      { label: '风险', value: '上游封 5 个以上组合就封整个账户，旧 Codex / Claude 单品会一起停摆' },
    ], { throttleMs: 6 * 3600_000 })
  }
  return { ok: true, held, tighten }
}

/** tick 的周期任务（每 5 分钟本站成功率；每 10 分钟上游 stats） */
export async function periodicMonitors(): Promise<void> {
  const now = jnow().getTime()
  if (periodicDue('localSuccess', 5 * 60_000, now)) await checkLocalSuccess().catch((e) => console.error('[jiema] 本站成功率检查失败', (e as Error)?.message))
  if (periodicDue('upstreamStats', 10 * 60_000, now)) await checkUpstreamStats().catch((e) => console.error('[jiema] 上游 stats 检查失败', (e as Error)?.message))
}

/** 线程受限记录（没有、或已过期 → null） */
export async function activeThreadsHold(now: Date = jnow()): Promise<{ note: string | null; until: Date | null } | null> {
  const h = await prisma.smsHold.findUnique({ where: { key: 'threads' }, select: { note: true, until: true } })
  return h && isHoldActive(h, now) ? h : null
}

