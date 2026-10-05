/**
 * 机器人用的租约锁：照抄 lib/marketing/lock.ts（基于 vmq_locks.lock_key 唯一约束），前缀 bot:。
 * 不复用营销那份是因为它把前缀写死成 mkt:；三家前缀（数字开头的 vmq、news:、mkt:、bot:）互不相撞。
 * 陈旧判断用 Math.abs（交接文档：改 TZ 后 createdAt 可能落在未来）。
 * 抢锁用 createMany({ skipDuplicates })（INSERT IGNORE）而不是 create + 捕获 P2002：生产的 PrismaClient 开着 log: ['error']，
 * 每次撞锁都会在日志里刷一大段 prisma:error，机器人的锁（每分钟的 tick、发送器、T3）撞得比营销频繁，不能让它淹掉真错误。
 */
import { prisma } from '../db'

const LOCK_PREFIX = 'bot:'

function lockKeyOf(key: string): string {
  return `${LOCK_PREFIX}${key}`.slice(0, 40) // lock_key 列宽 40
}

/** 抢锁；抢不到返回 null（非阻塞） */
export async function acquireBotLock(key: string, ttlMs: number): Promise<string | null> {
  const lockKey = lockKeyOf(key)
  const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  for (let i = 0; i < 2; i++) {
    const r = await prisma.vmqLock.createMany({ data: [{ lockKey, orderId: token, createdAt: new Date() }], skipDuplicates: true })
    if (r.count === 1) return token
    const existing = await prisma.vmqLock.findUnique({ where: { lockKey } })
    if (!existing) continue // 刚被别人释放，再抢一次
    const age = Math.abs(Date.now() - existing.createdAt.getTime())
    if (age < ttlMs) return null // 有人正在跑
    // 陈旧锁（上一趟进程被杀）→ 精确按 id + token 清理后重试，避免误删别人刚续上的锁
    await prisma.vmqLock.deleteMany({ where: { id: existing.id, orderId: existing.orderId } }).catch(() => {})
  }
  return null
}

/** 续租；锁已丢返回 false */
export async function renewBotLock(key: string, token: string): Promise<boolean> {
  try {
    const r = await prisma.vmqLock.updateMany({ where: { lockKey: lockKeyOf(key), orderId: token }, data: { createdAt: new Date() } })
    return r.count === 1
  } catch (err) {
    console.error('[bot] 续锁失败', key, (err as Error)?.message)
    return false
  }
}

export async function releaseBotLock(key: string, token: string): Promise<void> {
  await prisma.vmqLock.deleteMany({ where: { lockKey: lockKeyOf(key), orderId: token } }).catch(() => {})
}
