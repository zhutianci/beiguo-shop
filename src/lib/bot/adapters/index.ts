/**
 * 当前使用的适配器：BOT_ADAPTER=wxpad（默认）| ilink（微信官方 ClawBot，附录 E）| console。进程内单例。
 */
import { ConsoleAdapter } from './console'
import { IlinkAdapter } from './ilink'
import type { AdapterName, BotAdapter } from './types'
import { WxpadAdapter } from './wxpad'

export { wxpadEnvStatus } from './wxpad'
export { ensureWxpadSocket, wxpadReceiveMode, wxpadSocketState } from './wxpad-ws'
export { ensureIlinkLoops, ilinkLoopSnapshot, stopIlinkLoop } from './ilink-loop'
export type { AdapterName } from './types'

let instance: BotAdapter | null = null

export function adapterName(): AdapterName {
  const v = (process.env.BOT_ADAPTER || '').trim()
  return v === 'console' ? 'console' : v === 'ilink' ? 'ilink' : 'wxpad'
}

export function getAdapter(): BotAdapter {
  if (instance && instance.name === adapterName()) return instance
  const n = adapterName()
  instance = n === 'console' ? new ConsoleAdapter() : n === 'ilink' ? new IlinkAdapter() : new WxpadAdapter()
  return instance
}

/** 测试用：换一个适配器实例（null 恢复默认） */
export function setAdapterForTest(a: BotAdapter | null): void {
  instance = a
}
