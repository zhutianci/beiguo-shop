/**
 * 运行时入口：旁路 sink 用动态 import 调到这里（不进模块初始化的依赖图）。
 * 新事件 → 合并 500 毫秒内的多次唤醒 → 路由 → 唤醒发送器。不抛。
 */
import { botEnabledByEnv } from './config'
import { routePendingEvents } from './route'
import { kickSender } from './sender'

const g = globalThis as unknown as { __botRouteTimer?: ReturnType<typeof setTimeout> | null; __botRouting?: boolean; __botRouteAgain?: boolean }

export function onNewEvents(): void {
  if (!botEnabledByEnv()) return
  if (g.__botRouteTimer) return
  g.__botRouteTimer = setTimeout(() => {
    g.__botRouteTimer = null
    void routeNow()
  }, 500)
  g.__botRouteTimer.unref?.()
}

export async function routeNow(): Promise<void> {
  if (g.__botRouting) {
    g.__botRouteAgain = true
    return
  }
  g.__botRouting = true
  try {
    await routePendingEvents()
    kickSender()
  } catch (e) {
    console.error('[bot] 路由失败', (e as Error)?.message)
  } finally {
    g.__botRouting = false
    if (g.__botRouteAgain) {
      g.__botRouteAgain = false
      void routeNow()
    }
  }
}

export { kickSender }
