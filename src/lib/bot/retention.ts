/**
 * 机器人表的保留期清理（docs/微信机器人-设计.md §13 末尾）：挂在每天 03:40 的 /api/cron/cleanup 里。
 *   · bot_outbox 终态行（已发 / 失败 / 过期 / 已合并 / 作废 / 拦下）30 天
 *   · bot_events 30 天（回扫只看 15 分钟水位、出队去重键用自增 id，删掉不会重推）
 *   · bot_commands 180 天（入站去重靠它；微信消息 ID 不会隔半年重发）
 *   · bot_action_tokens 过期 7 天后
 * 不删：bot_card_issues（发卡记录，跟订单走）、会话、管理员与身份；审计在 audit_events，永久。
 * 分批删（每批 5000、最多 20 批），理由同 cleanup 里 page_views 那段。
 */
import { prisma } from '../db'

const DAY = 86400_000
const OUTBOX_DAYS = 30
const EVENT_DAYS = 30
const COMMAND_DAYS = 180
const TOKEN_AFTER_EXPIRY_DAYS = 7
const BATCH = 5000
const MAX_BATCHES = 20
const TERMINAL = ['SENT', 'FAILED', 'EXPIRED', 'MERGED', 'CANCELLED', 'BLOCKED']

async function inBatches(find: () => Promise<{ id: number }[]>, del: (ids: number[]) => Promise<{ count: number }>): Promise<number> {
  let total = 0
  for (let i = 0; i < MAX_BATCHES; i++) {
    const batch = await find()
    if (!batch.length) break
    const { count } = await del(batch.map((r) => r.id))
    total += count
    if (batch.length < BATCH) break
  }
  return total
}

export async function purgeBotTables(now: number = Date.now()) {
  const outboxCutoff = new Date(now - OUTBOX_DAYS * DAY)
  const eventCutoff = new Date(now - EVENT_DAYS * DAY)
  const commandCutoff = new Date(now - COMMAND_DAYS * DAY)
  const tokenCutoff = new Date(now - TOKEN_AFTER_EXPIRY_DAYS * DAY)

  const outbox = await inBatches(
    () => prisma.botOutbox.findMany({ where: { status: { in: TERMINAL }, createdAt: { lt: outboxCutoff } }, select: { id: true }, take: BATCH }),
    (ids) => prisma.botOutbox.deleteMany({ where: { id: { in: ids } } })
  )
  const events = await inBatches(
    () => prisma.botEvent.findMany({ where: { createdAt: { lt: eventCutoff } }, select: { id: true }, take: BATCH }),
    (ids) => prisma.botEvent.deleteMany({ where: { id: { in: ids } } })
  )
  const commands = await inBatches(
    () => prisma.botCommand.findMany({ where: { createdAt: { lt: commandCutoff } }, select: { id: true }, take: BATCH }),
    (ids) => prisma.botCommand.deleteMany({ where: { id: { in: ids } } })
  )
  const tokens = await inBatches(
    () => prisma.botActionToken.findMany({ where: { expiresAt: { lt: tokenCutoff } }, select: { id: true }, take: BATCH }),
    (ids) => prisma.botActionToken.deleteMany({ where: { id: { in: ids } } })
  )
  return { outbox, events, commands, tokens }
}
