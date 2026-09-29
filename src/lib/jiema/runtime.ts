/**
 * 短信接码 · 进程内运行态（docs/短信接码-设计.md §5.3 末两段、E3、E19、E20、E26、E65、D43）。
 *
 * 【为什么放进程内存、不放 settings】应用只有一个容器，tick 与买家 GET 的惰性推进在同一个进程；这些状态有多个写入方
 * （tick 每 5 分钟、每次取号结果回来、下单与发起支付时同步刷新…），放进 settings 的同一行并发「读—改—写」会互相覆盖。
 * 进程重启后：余额缓存为空（第一次 E26 核对时同步刷新，失败按不够处理）、熔断从「关」开始、告警可能多推一次——都可以接受。
 * 挂在 globalThis 上：Next 的不同路由 bundle 与测试里的重复 import 拿到的是同一份（与 upstream.ts 的车道状态同一做法）。
 *
 * 内容：上游余额缓存（`{ balanceMicro, balanceAt } | 'UNKNOWN' | null`，只接受比当前更新的读数）、低余额告警节流（E65）、
 * 当天 E26 拒单计数、熔断状态、账户整体成功率收紧换号（D43）、最近一次拉全的上游活跃列表条数（线程受限的余量，E5）、
 * 已推过的外部激活、测试用的时钟偏移。
 *
 * 纯函数 `shouldAlertLow` 不连库，scripts/check-jiema-engine.ts 断言（§12.1 第 121 条）。
 */

export type BalanceCache = { balanceMicro: number; balanceAt: number } | 'UNKNOWN' | null

export interface LowAlertState {
  /** 当前是不是在告警线以下（上一次读数） */
  below: boolean
  /** 最近一次推送的时刻（毫秒） */
  lastAt: number | null
}

interface RuntimeState {
  balance: BalanceCache
  low: LowAlertState
  e26: { day: string; count: number; lastAt: number | null }
  breaker: { open: boolean; openedAt: number | null; okSince: number | null }
  tightenUntil: number | null
  lastActive: { count: number; at: number } | null
  externalAlerted: Set<string>
  clockOffsetMs: number
  periodic: Record<string, number>
}

const G = globalThis as unknown as { __jiemaRuntime?: RuntimeState }

function fresh(): RuntimeState {
  return {
    balance: null,
    low: { below: false, lastAt: null },
    e26: { day: '', count: 0, lastAt: null },
    breaker: { open: false, openedAt: null, okSince: null },
    tightenUntil: null,
    lastActive: null,
    externalAlerted: new Set(),
    clockOffsetMs: 0,
    periodic: {},
  }
}

export function rt(): RuntimeState {
  if (!G.__jiemaRuntime) G.__jiemaRuntime = fresh()
  return G.__jiemaRuntime
}

/** 只给测试用：清空进程内运行态（保留时钟偏移由调用方自己设） */
export function resetRuntimeForTest(): void {
  G.__jiemaRuntime = fresh()
}

// ───────────────────────── 时钟（测试可以拨） ─────────────────────────

/** 引擎的「现在」。生产偏移恒为 0；集成测试用 setClockOffsetForTest 与假上游的虚拟时钟一起拨 */
export function jnow(): Date {
  return new Date(Date.now() + rt().clockOffsetMs)
}

export function setClockOffsetForTest(ms: number): void {
  rt().clockOffsetMs = ms
}

export function advanceClockForTest(sec: number): void {
  rt().clockOffsetMs += sec * 1000
}

// ───────────────────────── 上游余额缓存（§5.3、E26） ─────────────────────────

export function balanceCache(): BalanceCache {
  return rt().balance
}

/**
 * 写入一次余额读数。**只接受比当前 balanceAt 更新的读数**（并发的两次刷新，晚发起的赢）；balanceAt 记 getBalance 请求发出的时刻
 * （上游在「发出」与「响应」之间某一刻读余额，按发出时刻比较，§3.2 的时间界只会偏保守）。UNKNOWN 总会被任何读数覆盖。
 */
export function setBalanceReading(balanceMicro: number, sentAtMs: number): boolean {
  const cur = rt().balance
  if (cur && cur !== 'UNKNOWN' && cur.balanceAt > sentAtMs) return false
  rt().balance = { balanceMicro, balanceAt: sentAtMs }
  return true
}

/** E3：取号拿到 NO_BALANCE、刷新又失败 → 标「未知」（不是记成 0：E26 遇到未知先同步刷新、仍失败按不够处理；E65 对未知不告警） */
export function markBalanceUnknown(): void {
  rt().balance = 'UNKNOWN'
}

export function resetBalanceForTest(v: BalanceCache): void {
  rt().balance = v
}

// ───────────────────────── 低余额告警节流（E65） ─────────────────────────

export const LOW_REALERT_MS = 6 * 3600_000

/**
 * 纯函数（E65）：第一次跌破告警线立即推；之后仍低于告警线时 6 小时最多一次；回到告警线以上就重置（下次跌破再立即推）。
 * 余额「未知」不判断、不推（那是 E3 的 UPSTREAM_NO_BALANCE 已经推过的情况）。**没有任何停售输出**（Q4）。
 */
export function shouldAlertLow(state: LowAlertState, balance: number | 'UNKNOWN' | null, nowMs: number, lineUsd = 2): { alert: boolean; next: LowAlertState } {
  if (balance == null || balance === 'UNKNOWN') return { alert: false, next: state }
  const line = Math.round(lineUsd * 1_000_000)
  if (balance >= line) return { alert: false, next: { below: false, lastAt: state.lastAt } }
  if (!state.below) return { alert: true, next: { below: true, lastAt: nowMs } }
  if (state.lastAt == null || nowMs - state.lastAt >= LOW_REALERT_MS) return { alert: true, next: { below: true, lastAt: nowMs } }
  return { alert: false, next: state }
}

// ───────────────────────── E26 拒单计数（后台概览「今日拒单」） ─────────────────────────

function bjDay(ms: number): string {
  return new Date(ms + 8 * 3600_000).toISOString().slice(0, 10)
}

export function countE26Reject(nowMs: number): number {
  const s = rt().e26
  const d = bjDay(nowMs)
  if (s.day !== d) {
    s.day = d
    s.count = 0
  }
  s.count++
  s.lastAt = nowMs
  return s.count
}

export function e26Rejects(nowMs: number): number {
  const s = rt().e26
  return s.day === bjDay(nowMs) ? s.count : 0
}

// ───────────────────────── 账户整体成功率收紧换号（D43） ─────────────────────────

export function tightenReplace(nowMs: number): boolean {
  const u = rt().tightenUntil
  return u != null && u > nowMs
}

export function setTightenUntil(ms: number | null): void {
  rt().tightenUntil = ms
}

// ───────────────────────── 上游活跃列表条数（E5 线程余量） ─────────────────────────

export function noteActiveCount(count: number, nowMs: number): void {
  rt().lastActive = { count, at: nowMs }
}

/** 2 分钟内拉全过的上游活跃列表条数（没有就 null） */
export function recentActiveCount(nowMs: number): number | null {
  const a = rt().lastActive
  return a && nowMs - a.at <= 120_000 ? a.count : null
}

// ───────────────────────── 周期任务的上次执行时刻 ─────────────────────────

/** 距上次执行 ≥ everyMs 才返回 true，并记下这次（tick 的「每 5 分钟 / 每 10 分钟」） */
export function periodicDue(name: string, everyMs: number, nowMs: number): boolean {
  const p = rt().periodic
  const last = p[name]
  if (last != null && nowMs - last < everyMs && nowMs >= last) return false
  p[name] = nowMs
  return true
}
