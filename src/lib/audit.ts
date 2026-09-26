/**
 * 审计（设计 5.8、13.2）。audit_events 只追加：应用代码只允许 create，本文件是唯一写入口。
 *
 * 【diff 与 publicDiff】平台对某渠道的操作以 tenantId=该渠道 写审计，而完整 diff 可能带出成本规则
 * （批量进货价按成本加价时 base=COST + 百分比，一除就能倒推成本）、payoutHoldReason、调账内部 memo（S20）。所以：
 *  · 渠道侧（PARTNER_AUDIT_SELECT）只读 publicDiff，永远读不到 diff；
 *  · actorKind='TENANT'（渠道自己的操作）未给 publicDiff 时 = diff——内容本来就是渠道自己提交的；
 *  · actorKind='PLATFORM' 时 publicDiff 必须由调用方按设计 5.8 的 action 白名单**显式构造**，没给就是 NULL
 *    （宁可渠道看到「平台改了进货价」但没有明细，也不能默认把 diff 抄过去）；
 *  · SYSTEM / BUYER 同 PLATFORM：不给就是 NULL。
 * targetId 对渠道相关对象一律写公开编号（orderNo / listingNo / customerNo / requestNo / statementNo），不写自增 id。
 *
 * 【写失败】写入异常原样抛给调用方：业务事务里传 tx 时随事务回滚；card.view 这类「看了就必须留痕」的读操作，
 * 审计写不进去就不该把明文给出去（审计失败不得放行）。守卫里的 authz.denied 由守卫自己 catch（拒绝本身不受影响）。
 */
import { Prisma } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import { prisma } from './db'
import { clientIp } from './news/rate-limit'

export interface AuditInput {
  actorUserId?: number | null
  actorKind: 'PLATFORM' | 'TENANT' | 'SYSTEM' | 'BUYER'
  tenantId?: number | null
  action: string
  targetType?: string
  targetId?: string
  result?: 'OK' | 'DENIED' | 'ERROR'
  reasonCode?: string
  reason?: string
  diff?: unknown
  publicDiff?: unknown
  req?: Request
  /** 委托会话（P1 view-as）标识；没有就不写 */
  viaSessionId?: string
}

type Db = Prisma.TransactionClient | PrismaClient

function clip(s: string | null | undefined, max: number): string | null {
  if (s == null) return null
  const t = String(s)
  return t.length > max ? t.slice(0, max) : t
}

/**
 * 把任意值转成可以安全写进 Json 列的普通 JSON：Date → ISO、BigInt / Decimal → 字符串、undefined 与函数丢掉、循环引用截断。
 * 返回 undefined 表示「没有值」（列写 NULL）。
 */
function toJsonValue(v: unknown): Prisma.InputJsonValue | undefined {
  if (v === undefined) return undefined
  const seen = new WeakSet<object>()
  const text = JSON.stringify(v, (_k, val) => {
    if (typeof val === 'bigint') return val.toString()
    if (typeof val === 'function' || typeof val === 'symbol') return undefined
    if (val && typeof val === 'object') {
      if (seen.has(val)) return '[circular]'
      seen.add(val)
    }
    return val
  })
  if (text === undefined) return undefined
  const parsed = JSON.parse(text) as unknown
  return parsed === null ? undefined : (parsed as Prisma.InputJsonValue)
}

/** 纯函数：按 actorKind 决定写进库的 publicDiff（W0-10）。导出给 scripts/check-* 测 */
export function resolvePublicDiff(e: Pick<AuditInput, 'actorKind' | 'diff' | 'publicDiff'>): unknown {
  if (e.publicDiff !== undefined) return e.publicDiff
  if (e.actorKind === 'TENANT') return e.diff
  return undefined
}

export async function writeAudit(tx: Prisma.TransactionClient | null, e: AuditInput): Promise<void> {
  const db: Db = tx ?? prisma
  let ip: string | null = null
  let ua: string | null = null
  if (e.req) {
    const got = clientIp(e.req.headers)
    ip = got && got !== 'unknown' ? clip(got, 45) : null
    ua = clip(e.req.headers.get('user-agent'), 255)
  }
  const diff = toJsonValue(e.diff)
  const publicDiff = toJsonValue(resolvePublicDiff(e))
  await db.auditEvent.create({
    data: {
      actorUserId: e.actorUserId ?? null,
      actorKind: e.actorKind,
      tenantId: e.tenantId ?? null,
      viaSessionId: clip(e.viaSessionId, 40),
      action: clip(e.action, 48) || 'unknown',
      targetType: clip(e.targetType, 24),
      targetId: clip(e.targetId, 40),
      result: e.result ?? 'OK',
      reasonCode: clip(e.reasonCode, 24),
      reason: clip(e.reason, 255),
      // 没有值时显式写数据库 NULL（Prisma.DbNull），而不是 JSON 字面量 null：对账与 W0-10 按 IS NULL 判断
      diff: diff === undefined ? Prisma.DbNull : diff,
      publicDiff: publicDiff === undefined ? Prisma.DbNull : publicDiff,
      ip,
      ua,
    },
  })
}

// ---------------------------------------------------------------------------
// 聚合写：同一个 key 在窗口内只写一条（order.view：同一成员同一订单 10 分钟一条，设计 6.4.1）。
// 进程内记忆，容量有上限；写成功之后才记时间，写失败下次还会再写。
// ---------------------------------------------------------------------------
const THROTTLE_MAX = 10_000
const lastWritten = new Map<string, number>()

export async function writeAuditThrottled(key: string, windowMs: number, e: AuditInput): Promise<void> {
  const now = Date.now()
  const last = lastWritten.get(key)
  if (last !== undefined && now - last < windowMs) return
  await writeAudit(null, e)
  if (lastWritten.has(key)) lastWritten.delete(key)
  while (lastWritten.size >= THROTTLE_MAX) {
    const oldest = lastWritten.keys().next()
    if (oldest.done) break
    lastWritten.delete(oldest.value)
  }
  lastWritten.set(key, now)
}
