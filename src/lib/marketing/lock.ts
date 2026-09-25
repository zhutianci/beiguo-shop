/**
 * 基于 VmqLock 唯一约束的租约锁（照抄 lib/news/pipeline.ts 的抢锁/释放，前缀 mkt:）。
 * 陈旧判断用 Math.abs（交接文档：改 TZ 后 createdAt 可能落在未来）。
 *
 * 【实现方：发送引擎】签名是契约。
 *
 * lockKey 命名空间 "mkt:<key>"：与 vmq 的 "<分>-<type>"（纯数字开头）、新闻管线的 "news:<stage>" 都不会撞；
 * vmq 的 closeExpired() 只按 orderId 删自己的锁，也不会误删这里的行。
 *
 * 时间不变量（设计文档第 3 节）：SENDING 回收阈值 5 分钟 > 锁 TTL 3 分钟 > 单趟最长 60 秒。
 * worker 每发一封就 renewLock 一次，所以锁只会在进程真的死掉之后才过期。
 */
import { prisma } from '@/lib/db'

const LOCK_PREFIX = 'mkt:'

function lockKeyOf(key: string): string {
  // lock_key 列宽 40
  return `${LOCK_PREFIX}${key}`.slice(0, 40)
}

/** 抢锁；抢不到返回 null。key 形如 'send' / 'sync'，实际 lockKey = `mkt:${key}` */
export async function acquireLock(key: string, ttlMs: number): Promise<string | null> {
  const lockKey = lockKeyOf(key)
  const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  for (let i = 0; i < 2; i++) {
    try {
      // createdAt 显式写应用时间：陈旧判断拿它和 Date.now() 比，不能依赖库里的 DEFAULT CURRENT_TIMESTAMP
      await prisma.vmqLock.create({ data: { lockKey, orderId: token, createdAt: new Date() } })
      return token
    } catch (e) {
      if ((e as { code?: string })?.code !== 'P2002') throw e
      const existing = await prisma.vmqLock.findUnique({ where: { lockKey } })
      if (!existing) continue // 刚被别人释放，再抢一次

      // 用绝对值判「陈旧」：createdAt 落在未来（TZ 被改过）本身就说明这行不可信，按陈旧处理。
      // 详见 lib/news/pipeline.ts acquireStageLock 的注释（线上出过 27 分钟不释放的锁）
      const age = Math.abs(Date.now() - existing.createdAt.getTime())
      if (age < ttlMs) return null // 有人正在跑
      // 陈旧锁（上一趟进程被杀）→ 精确按 id + token 清理后重试，避免误删别人刚续上的锁
      await prisma.vmqLock.deleteMany({ where: { id: existing.id, orderId: existing.orderId } }).catch(() => {})
    }
  }
  return null
}

/** 续租：把自己那把锁的 createdAt 刷成现在；锁已丢失返回 false */
export async function renewLock(key: string, token: string): Promise<boolean> {
  try {
    const r = await prisma.vmqLock.updateMany({
      where: { lockKey: lockKeyOf(key), orderId: token },
      data: { createdAt: new Date() },
    })
    return r.count === 1
  } catch (err) {
    // 续租失败（库抖了）按「锁可能已丢」处理：调用方会停止开始新的发送，宁停不双发
    console.error('[marketing] 续锁失败', key, (err as Error)?.message)
    return false
  }
}

export async function releaseLock(key: string, token: string): Promise<void> {
  await prisma.vmqLock.deleteMany({ where: { lockKey: lockKeyOf(key), orderId: token } }).catch(() => {})
}
