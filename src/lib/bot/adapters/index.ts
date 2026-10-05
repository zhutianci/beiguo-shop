/**
 * 当前使用的适配器：BOT_ADAPTER=wxpad（默认）| console。进程内单例。
 */
import { ConsoleAdapter } from './console'
import type { BotAdapter } from './types'
import { WxpadAdapter } from './wxpad'

export { wxpadEnvStatus } from './wxpad'
export { ensureWxpadSocket, wxpadReceiveMode, wxpadSocketState } from './wxpad-ws'

let instance: BotAdapter | null = null

export function adapterName(): 'wxpad' | 'console' {
  return (process.env.BOT_ADAPTER || '').trim() === 'console' ? 'console' : 'wxpad'
}

export function getAdapter(): BotAdapter {
  if (instance && instance.name === adapterName()) return instance
  instance = adapterName() === 'console' ? new ConsoleAdapter() : new WxpadAdapter()
  return instance
}

/** 测试用：换一个适配器实例（null 恢复默认） */
export function setAdapterForTest(a: BotAdapter | null): void {
  instance = a
}
