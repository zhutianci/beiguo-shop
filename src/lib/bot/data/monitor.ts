/**
 * 「状态」指令里的收款监控一行（docs/微信机器人-设计.md §7.3）：最近一次收到支付宝到账通知转发的时间。
 * 只读、只给管理群与私聊（分站群的「状态」不显示这一行）；指令层不能 import vmq（边界规则 B3），经这里包一层，动态 import 同 unmatched.ts。
 */
import { requirePlatformScope, type BotScope } from './scope'

export async function paymentMonitorLastForward(scope: BotScope): Promise<Date | null> {
  requirePlatformScope(scope, '收款监控')
  const { lastNotifyAt } = await import('../../vmq')
  const t = await lastNotifyAt().catch(() => null)
  return t && Number.isFinite(t) ? new Date(t) : null
}
