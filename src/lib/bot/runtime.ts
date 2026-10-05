/**
 * 运行时入口：新事件 → 合并 500 毫秒内的多次唤醒 → 路由 → 唤醒发送器。不抛。
 * 旁路 sink 不 import 这里（静态、动态都不行，见 sink.ts 文件头），而是调本模块加载时注册在 globalThis 上的钩子；
 * 每分钟的 tick 会 import 本模块，所以进程起来后一分钟内钩子就在了。
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

;(globalThis as unknown as { __botOnNewEvents?: () => void }).__botOnNewEvents = onNewEvents
