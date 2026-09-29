/**
 * 短信接码 · 上游余额：刷新进程内缓存、低余额告警（E65）、取号余额不足（E3）（docs/短信接码-设计.md §5.3、§3.2、E3、E26、E65、Q4）。
 *
 * **不设停售线、不设每日扣费上限、不写 sms_holds**（站长 09-29 决定 Q4，附录 B 第 26 条）：低于告警线（默认 $2，取 runtimeParams，
 * sms_config 读不到时照样有值）只推 sms.alert（首次立即、之后 6 小时一次、回升重置）。唯一的物理约束是 gate 的 E26 逐单核对。
 */
import * as up from './upstream'
import { runtimeParams } from './config'
import { smsAlert } from './alert'
import { rt, jnow, balanceCache, setBalanceReading, markBalanceUnknown, shouldAlertLow, type BalanceCache } from './runtime'

/** 缓存超过 5 分钟就在请求里同步刷新（E26） */
export const BALANCE_MAX_AGE_MS = 5 * 60_000

const usd = (micro: number) => `$${(micro / 1_000_000).toFixed(2)}`

/** 按当前缓存判断要不要推低余额告警（E65）；UNKNOWN 不推 */
export function checkLowBalance(nowMs: number = jnow().getTime()): boolean {
  const c = balanceCache()
  const line = runtimeParams().upstream.balanceAlertUsd
  const bal = c == null ? null : c === 'UNKNOWN' ? 'UNKNOWN' : c.balanceMicro
  const r = shouldAlertLow(rt().low, bal, nowMs, line)
  rt().low = r.next
  if (r.alert && typeof bal === 'number') {
    // 节流由 shouldAlertLow 负责（首次立即、6 小时一次、回升重置），smsAlert 本身不再节流
    smsAlert('UPSTREAM_LOW', `上游余额低于告警线 $${line}（不停售）`, [
      { label: '当前余额', value: usd(bal) },
      { label: '告警线', value: `$${line}` },
      { label: '影响', value: '只告警、不停售；下单时仍逐单核对余额够不够付本单（E26）。请及时给上游充值' },
    ], { throttleMs: 0 })
    return true
  }
  return false
}

/**
 * 同步刷新一次上游余额（getBalance 走写与查码车道）。成功写缓存（按请求发出时刻，只接受更新的读数）并判断 E65；
 * 失败返回 false、缓存不动（调用方决定是沿用旧值还是标未知）。
 */
export async function refreshBalance(): Promise<boolean> {
  if (!up.upstreamConfigured()) return false
  const sent = Date.now()
  let r: Awaited<ReturnType<typeof up.getBalance>>
  try {
    r = await up.getBalance()
  } catch (e) {
    console.error('[jiema] getBalance 抛错', (e as Error)?.message)
    return false
  }
  if (r.kind !== 'ok') return false
  setBalanceReading(r.data.balanceMicro, (r.sentAt ?? sent) + rt().clockOffsetMs)
  checkLowBalance()
  return true
}

/**
 * E26 用：缓存超过 5 分钟、为空或「未知」就同步刷新一次；刷新失败时——有旧值沿用旧值（真的不够时付款后按 E3 退回余额），
 * 为空或未知返回 null（调用方按「不够」处理，§3.2）。
 */
export async function ensureFreshBalance(maxAgeMs = BALANCE_MAX_AGE_MS): Promise<Exclude<BalanceCache, 'UNKNOWN' | null> | null> {
  const c = balanceCache()
  const now = jnow().getTime()
  if (c && c !== 'UNKNOWN' && now - c.balanceAt <= maxAgeMs) return c
  await refreshBalance()
  const after = balanceCache()
  if (after && after !== 'UNKNOWN') return after
  return null
}

/** E3：取号拿到 NO_BALANCE → 立即刷新；刷新失败就标「未知」；紧急推送（1 小时最多一次）。不写停售 */
export async function onUpstreamNoBalance(ctx: { service: string; country: number; orderNo?: string }): Promise<void> {
  const ok = await refreshBalance()
  if (!ok) markBalanceUnknown()
  const c = balanceCache()
  smsAlert('UPSTREAM_NO_BALANCE', '上游余额不足，付款后取号失败（已整单退回余额）', [
    { label: '组合', value: `${ctx.service} · ${ctx.country}` },
    { label: '订单', value: ctx.orderNo ?? '—' },
    { label: '上游余额', value: c == null ? '未知' : c === 'UNKNOWN' ? '未知（刷新失败）' : usd(c.balanceMicro) },
    { label: '处理', value: '请尽快给上游充值；新单按刷新后的余额逐单核对（不设停售线）' },
  ], { throttleMs: 3600_000 })
}

/** 查询类调用拿到 402：只触发一次复核刷新（不改任何状态，§3.1） */
export async function recheckBalanceQuiet(): Promise<void> {
  await refreshBalance().catch(() => false)
}
