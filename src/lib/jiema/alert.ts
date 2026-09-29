/**
 * 短信接码的企业微信告警（docs/短信接码-设计.md §7.7）：一律走 `sms.alert` 事件，同一个原因 30 分钟内只推一次。
 * 节流状态在**进程内存**里（§5.3：单容器，放进 settings 的同一行并发「读—改—写」会互相覆盖；进程重启后可能多推一次，可以接受）。
 * notify() 本身 fire-and-forget、绝不抛异常，调用方不需要 try。
 */
import { notify, type NotifyEvent, type NotifyRow } from '../notify'

type Row = Pick<NotifyRow, 'label' | 'value' | 'color'>

const lastAt = new Map<string, number>()
/** 同一原因默认 30 分钟一次（§7.7） */
export const ALERT_THROTTLE_MS = 30 * 60_000

/**
 * 推一条接码告警。reason 是节流键（如 'CATALOG_STALE'、'CONFIG_BROKEN'），同一个 reason 在 throttleMs 内只推一次。
 * 返回是否真的推了（测试用）。
 */
export function smsAlert(reason: string, title: string, rows: Row[], opts: { link?: string; throttleMs?: number; event?: Extract<NotifyEvent, `sms.${string}`> } = {}): boolean {
  const now = Date.now()
  const throttle = opts.throttleMs ?? ALERT_THROTTLE_MS
  const prev = lastAt.get(reason)
  if (prev != null && now - prev < throttle) return false
  lastAt.set(reason, now)
  if (lastAt.size > 500) {
    // 原因键是代码里写死的有限集合（带服务 / 国家的最多几百个），超过就清最旧的，防意外撑大
    const first = lastAt.keys().next()
    if (!first.done) lastAt.delete(first.value)
  }
  notify(opts.event ?? 'sms.alert', [{ label: '原因', value: reason, color: 'warning' }, ...rows], { link: opts.link ?? '/admin/jiema', extraTitle: title })
  return true
}

/** 测试用：清空节流状态 */
export function resetSmsAlertThrottleForTest(): void {
  lastAt.clear()
}
