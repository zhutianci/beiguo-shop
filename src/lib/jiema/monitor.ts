/**
 * 短信接码 · S4 的周期监控（docs/短信接码-设计.md §7.1、§7.7、§10.3）。只由 jiema-tick 的 cron 入口（engine.runTick）每趟调一次，
 * **不在 tickRound 里**（集成测试直接调 tickRound，不应被这些额外的上游调用打乱）：
 *  · 每 10 分钟：未关联激活的分类监控（unlinked.scanUnlinked：外部激活推送、旧链路遗留只列出，不取消任何激活）；
 *  · 每 10 分钟：HELD 预扣超过 60 分钟 → wallet.alert（同一原因 30 分钟一次；每日 W5 之外的实时兜底，§7.7）；
 *  · 每趟：昨天的日报到点（北京 09:00）就推一次 sms.daily（reconcile.maybeSendDaily，CAS 只推一次）。
 * 任何一步失败只记日志，不影响推进。
 */
import { prisma } from '../db'
import { notify } from '../notify'
import { fmtCents } from '../wallet/buckets'
import { jnow, periodicDue } from './runtime'
import { scanUnlinked } from './unlinked'
import { maybeSendDaily } from './reconcile'

/** 与 wallet/reconcile.ts 的 W5 同一个阈值：正常最长约 21 分钟，留足余量 */
export const HELD_STUCK_MIN = 60
const HELD_ALERT_THROTTLE_MS = 30 * 60_000
const G = globalThis as unknown as { __jiemaHeldAlertAt?: number }

/** HELD 预扣超过 60 分钟（卡住）→ wallet.alert（进程内 30 分钟一次）。返回卡住的条数 */
export async function checkStuckHolds(now: Date = jnow()): Promise<number> {
  const cutoff = new Date(now.getTime() - HELD_STUCK_MIN * 60_000)
  const rows = await prisma.balanceHold.findMany({ where: { state: 'HELD', heldAt: { lt: cutoff } }, orderBy: { heldAt: 'asc' }, take: 20, select: { orderId: true, topupCents: true, cashCents: true, heldAt: true } })
  if (!rows.length) return 0
  const last = G.__jiemaHeldAlertAt
  if (last != null && Date.now() - last < HELD_ALERT_THROTTLE_MS) return rows.length
  G.__jiemaHeldAlertAt = Date.now()
  const ords = await prisma.order.findMany({ where: { id: { in: rows.map((r) => r.orderId) } }, select: { id: true, orderNo: true } })
  const on = new Map(ords.map((o) => [o.id, o.orderNo]))
  notify(
    'wallet.alert',
    [
      { label: '问题', value: `${rows.length} 条余额预扣 HELD 超过 ${HELD_STUCK_MIN} 分钟（卡住的预扣）`, color: 'warning' },
      ...rows.slice(0, 5).map((r) => ({ label: on.get(r.orderId) ?? `#${r.orderId}`, value: `${fmtCents(r.topupCents + r.cashCents)}，已 ${Math.round((now.getTime() - r.heldAt.getTime()) / 60_000)} 分钟` })),
      { label: '处理', value: '到「短信接码 → 订单」对这张单用「关单并退回预扣」（后台不提供手工释放）' },
    ],
    { link: '/admin/wallet?tab=holds', extraTitle: '预扣卡住' },
  )
  return rows.length
}

/** 测试用：清掉卡住预扣告警的节流 */
export function resetHeldAlertThrottleForTest(): void {
  G.__jiemaHeldAlertAt = undefined
}

/** jiema-tick 的 cron 入口每趟调一次（engine.runTick） */
export async function tickExtras(now: Date = jnow()): Promise<void> {
  const t = now.getTime()
  if (periodicDue('unlinked', 10 * 60_000, t)) await scanUnlinked(now).catch((e) => console.error('[jiema] 未关联激活监控失败', (e as Error)?.message))
  if (periodicDue('heldStuck', 10 * 60_000, t)) await checkStuckHolds(now).catch((e) => console.error('[jiema] 卡住预扣检查失败', (e as Error)?.message))
  await maybeSendDaily(now).catch((e) => console.error('[jiema] 推日报失败', (e as Error)?.message))
}
