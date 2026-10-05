/**
 * T3（动钱、动库存）的全局串行锁（docs/微信机器人-设计.md §7.6「不冲突」）：提卡、改价、上架、开补货链接都经这把锁，
 * **非阻塞**——拿不到就回「正在处理其他操作，请稍后再试」，不排队。每日上限的检查与扣减都在锁内，两条并发的提卡绕不过上限。
 * 锁存在 vmq_locks（lock.ts，前缀 bot:），进程崩溃时 60 秒后自然过期。
 */
import { acquireBotLock, releaseBotLock } from '../lock'

const T3_LOCK_TTL_MS = 60_000

export class T3BusyError extends Error {
  constructor() {
    super('正在处理其他提卡 / 补货操作，请稍后再试')
    this.name = 'T3BusyError'
  }
}

export async function withT3Lock<T>(fn: () => Promise<T>): Promise<T> {
  const token = await acquireBotLock('t3', T3_LOCK_TTL_MS)
  if (!token) throw new T3BusyError()
  try {
    return await fn()
  } finally {
    await releaseBotLock('t3', token).catch((e) => console.error('[bot] 释放 T3 锁失败', (e as Error)?.message))
  }
}
