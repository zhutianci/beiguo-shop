/**
 * iLink 收消息：每个在用的绑定一个长轮询循环（docs/微信机器人-设计.md 附录 E）。
 *
 * - 每分钟的 tick 调 ensureIlinkLoops：给新绑定起循环、停掉已暂停 / 解绑 / 失效的。进程内用 globalThis 记着，
 *   同一个绑定只会有一个循环（开发环境热重载也不会重复）。绑定刚完成时绑定流程也会立刻调一次。
 * - 一轮：POST getupdates（游标 get_updates_buf，服务端最多压约 35 秒）→ 存新游标 → 只留扫码人发来的用户消息 →
 *   记下最新的 context_token（回复、推送都靠它）→ 把因为窗口关着而搁置的消息提前；窗口之前关过的话说明期间过期了几条 →
 *   交给入站处理（指令、提示）。
 * - 服务端回 -14：token 失效（对方在微信里解除了绑定或过期）——标记失效、会话改成发不出去、企业微信告警，循环结束，只能重新扫码。
 * - 网络错误：2 秒后重试；连续 3 次失败歇 30 秒（与腾讯插件同一节奏）。
 * - 日志不打印 token、context_token 与消息正文。
 */
import { prisma } from '../../db'
import { notify } from '../../notify'
import { botEnabledByEnv } from '../config'
import { enqueueMany, flushDeferred } from '../outbox'
import type { Inbound } from '../types'
import { getUpdates, ilinkBase, notifyStart } from './ilink-api'
import { CONTEXT_TTL_MS, clearDeadContext, ilinkToInbound } from './ilink-shared'
import { ILINK_KEY_PREFIX, patchBinding, readBinding, type IlinkBinding } from './ilink-store'

/** 入站处理由调用方（tick / 绑定流程）传进来：这里不 import 入站，免得协议适配器连带整个指令系统 */
export type InboundHandler = (list: Inbound[]) => Promise<void>

interface LoopState {
  convId: number
  abort: AbortController
  running: boolean
  startedAt: number
  lastOkAt: number | null
  failures: number
  lastError: string | null
}

const g = globalThis as unknown as { __botIlinkLoops?: Map<number, LoopState> }
const loops = (g.__botIlinkLoops ||= new Map<number, LoopState>())

export interface IlinkLoopInfo {
  convId: number
  running: boolean
  startedAt: number
  lastOkAt: number | null
  lastError: string | null
}

export function ilinkLoopSnapshot(): IlinkLoopInfo[] {
  return Array.from(loops.values()).map(({ convId, running, startedAt, lastOkAt, lastError }) => ({ convId, running, startedAt, lastOkAt, lastError }))
}

export function stopIlinkLoop(convId: number): void {
  const st = loops.get(convId)
  if (!st) return
  st.abort.abort()
  loops.delete(convId)
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(t)
      signal.removeEventListener('abort', done)
      resolve()
    }
    const t = setTimeout(done, ms)
    t.unref?.()
    signal.addEventListener('abort', done, { once: true })
  })
}

/** 每分钟 tick 调（绑定完成后也会立刻调一次）：返回在跑的循环数。不是 iLink 适配器或机器人休眠时全部停掉 */
export async function ensureIlinkLoops(handle: InboundHandler): Promise<number> {
  if ((process.env.BOT_ADAPTER || '').trim() !== 'ilink' || !botEnabledByEnv()) {
    Array.from(loops.keys()).forEach((id) => stopIlinkLoop(id))
    return 0
  }
  const convs = await prisma.botConversation.findMany({ where: { adapter: 'ilink', status: 'ACTIVE' }, select: { id: true } })
  const want = new Set(convs.map((c) => c.id))
  // 已解绑的（后台或群指令「解绑」）：删掉还留着的凭据，不在库里留可用的 bot_token
  const revoked = await prisma.botConversation.findMany({ where: { adapter: 'ilink', status: 'REVOKED' }, select: { id: true }, take: 500 })
  if (revoked.length) await prisma.setting.deleteMany({ where: { key: { in: revoked.map((c) => `${ILINK_KEY_PREFIX}${c.id}`) } } })
  Array.from(loops.keys()).forEach((id) => {
    if (!want.has(id)) stopIlinkLoop(id)
  })
  convs.forEach(({ id }) => {
    const cur = loops.get(id)
    if (cur?.running) return
    if (cur) loops.delete(id)
    start(id, handle)
  })
  return Array.from(loops.values()).filter((l) => l.running).length
}

function start(convId: number, handle: InboundHandler): void {
  const st: LoopState = { convId, abort: new AbortController(), running: true, startedAt: Date.now(), lastOkAt: null, failures: 0, lastError: null }
  loops.set(convId, st)
  void run(st, handle)
    .catch((e) => {
      st.lastError = (e as Error)?.message ?? 'error'
      console.error(`[bot] iLink 绑定 #${convId} 收消息循环异常`, st.lastError)
    })
    .finally(() => {
      st.running = false // 下一次 ensure 发现它停了、会话还在用，就重起
    })
}

/** 绑定废了（-14 或凭据解不开）：会话改成发不出去（发送器会作废它的待发消息），企业微信告警一次 */
async function markUnusable(convId: number, why: string, binding: IlinkBinding | null): Promise<void> {
  if (binding && !binding.staleAt) await patchBinding(convId, { staleAt: new Date().toISOString() }).catch(() => null)
  const conv = await prisma.botConversation.findUnique({ where: { id: convId }, select: { name: true, kind: true, tenantId: true, status: true } })
  const r = await prisma.botConversation.updateMany({ where: { id: convId, status: 'ACTIVE' }, data: { status: 'UNREACHABLE' } })
  if (r.count !== 1) return // 已经不是在用状态（并发解绑等），不重复告警
  console.error(`[bot] iLink 绑定 #${convId} 不可用：${why}`)
  notify(
    'bot.offline',
    [
      { label: '情况', value: `微信绑定「${conv?.name || `#${convId}`}」已失效，已停止向它推送` },
      { label: '原因', value: why },
      { label: '处理', value: '到后台「微信机器人 → 概览 → 微信绑定」重新扫码绑定，旧的这条在「会话」里解绑即可' },
    ],
    { link: '/admin/bot', linkText: '前往后台' }
  )
}

/** 推送窗口关过又重新打开：告诉对方期间有几条因为过期没送到（没有就不说） */
async function noticeReopened(convId: number, closedAt: Date, now: Date): Promise<void> {
  const expired = await prisma.botOutbox.count({ where: { conversationId: convId, status: 'EXPIRED', updatedAt: { gte: closedAt } } })
  if (!expired) return
  const hours = Math.max(1, Math.round((now.getTime() - closedAt.getTime()) / 3600_000))
  await enqueueMany(
    [
      {
        conversationId: convId,
        kind: 'ALERT',
        text: `ℹ️ 推送已恢复。之前超过 24 小时没有回复，推送暂停了约 ${hours} 小时，期间有 ${expired} 条动态过期没有送达，可到后台查看。`,
        dedupeKey: `reopen:${convId}:${closedAt.getTime().toString(36)}`,
      },
    ],
    now
  )
}

async function run(st: LoopState, handle: InboundHandler): Promise<void> {
  const { convId, abort } = st
  let b = await readBinding(convId)
  if (!b || b.staleAt) {
    await markUnusable(convId, b ? '绑定已被标记为失效（-14）' : '绑定凭据丢失或解不开（CARDKEY_SECRET 换了？）', b)
    return
  }
  const base = ilinkBase(b.baseUrl)
  void notifyStart(base, b.token).catch(() => {})
  let timeoutMs = 35_000
  while (!abort.signal.aborted) {
    const r = await getUpdates(base, b.token, b.cursor, timeoutMs, abort.signal)
    if (abort.signal.aborted) break
    if (r.stale) {
      await markUnusable(convId, '对方在微信里解除了 ClawBot 绑定，或绑定已过期（iLink 返回 -14）', b)
      return
    }
    if (!r.ok) {
      st.failures++
      st.lastError = r.error ?? '收消息失败'
      const wait = st.failures >= 3 ? 30_000 : 2_000
      if (st.failures >= 3) st.failures = 0
      await sleep(wait, abort.signal)
      continue
    }
    st.failures = 0
    st.lastOkAt = Date.now()
    st.lastError = null
    if (r.nextTimeoutMs && r.nextTimeoutMs >= 5_000 && r.nextTimeoutMs <= 120_000) timeoutMs = r.nextTimeoutMs

    const userId = b.userId
    // 只认扫码人自己发来的用户消息（message_type 1）；机器人自己的消息（2）、别人的、群里的一律不要
    const mine = r.msgs.filter((m) => m.message_type === 1 && m.from_user_id === userId && !m.group_id)
    const latestCtx = [...mine].reverse().find((m) => typeof m.context_token === 'string' && !!m.context_token)
    const now = new Date()
    if (mine.length) {
      // 有消息时以库里为准算「上一次对方说话的时间」（只有本循环写它，但别把内存里的副本当真；游标仍以本循环为准）
      const fresh = await readBinding(convId)
      if (fresh) b = { ...fresh, cursor: b.cursor }
    }
    const patch: Partial<IlinkBinding> = {}
    if (r.cursor && r.cursor !== b.cursor) patch.cursor = r.cursor
    const prevCtxAt = b.ctxAt ? new Date(b.ctxAt) : null
    if (latestCtx) {
      patch.ctxToken = latestCtx.context_token!
      patch.ctxAt = now.toISOString()
    }
    if (mine.length) patch.lastInboundAt = now.toISOString()
    if (Object.keys(patch).length) b = (await patchBinding(convId, patch)) ?? { ...b, ...patch }

    if (latestCtx) {
      clearDeadContext(convId)
      const flushed = await flushDeferred(convId, now)
      if (prevCtxAt && now.getTime() - prevCtxAt.getTime() >= CONTEXT_TTL_MS) {
        await noticeReopened(convId, new Date(prevCtxAt.getTime() + CONTEXT_TTL_MS), now).catch((e) => console.error('[bot] 推送恢复提示失败', (e as Error)?.message))
      }
      // 提前了搁置的消息：立刻唤醒发送器（发送器加载时注册的钩子；入站处理有回复时也会唤醒，这里管「只是一张图片」这类没有指令的消息）
      if (flushed) (globalThis as unknown as { __botKickSender?: () => void }).__botKickSender?.()
    }
    const list = mine.map((m) => ilinkToInbound(b!.botId, m)).filter((x): x is Inbound => !!x)
    if (list.length) await handle(list)
  }
}
