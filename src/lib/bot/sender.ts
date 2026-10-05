/**
 * 发送器（docs/微信机器人-设计.md §12.1）：网站进程里的一个异步循环，按节奏把出队消息交给协议服务。
 *
 * - 唤醒：入队后立即唤醒（同进程）；每分钟 tick 兜底；进程内同一时刻只跑一个循环，数据库层再加一把锁（bot:send），
 *   防止进程重启交接时两个循环同时发。
 * - 节奏：同一会话两条至少间隔 perConvSeconds（另加 0–jitter 秒随机）；全局每分钟 ≤ perMinute、每小时 ≤ perHour。
 * - 小号离线时整个循环停下（不计失败），等 tick 发现恢复再唤醒，免得把所有会话都标成发不出去。
 * - 单趟最多跑 50 秒；还有没到点的消息就用定时器在到点时再唤醒（不超过 60 秒，再远交给 tick）。
 */
import { prisma } from '../db'
import { storefrontById } from '../storefront/resolve'
import { getAdapter } from './adapters'
import { botConfigForDelivery, botEnabledByEnv } from './config'
import { acquireBotLock, releaseBotLock, renewBotLock } from './lock'
import { notify } from '../notify'
import { tenantBlacklistHit } from './mask'
import { enqueueMany, leaseNext, markFailed, markSent, mergeDigest, MAX_ATTEMPTS, openOutboxText } from './outbox'
import { PLATFORM_SITE_LABEL } from './route'
import { readBotState } from './state'

const RUN_BUDGET_MS = 50_000
const LOCK_TTL_MS = 60_000
/** 连续失败多少条后把会话标成发不出去（UNREACHABLE）并告警 */
const UNREACHABLE_AFTER = 5

const g = globalThis as unknown as {
  __botSender?: { running: boolean; again: boolean; timer: ReturnType<typeof setTimeout> | null; sentTimes: number[] }
}
const S = (g.__botSender ||= { running: false, again: false, timer: null, sentTimes: [] })

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** 唤醒发送器（不 await、不抛） */
export function kickSender(): void {
  if (!botEnabledByEnv()) return
  if (S.running) {
    S.again = true
    return
  }
  S.running = true
  void runLoop()
    .catch((e) => console.error('[bot] 发送循环异常', (e as Error)?.message))
    .finally(() => {
      S.running = false
      if (S.again) {
        S.again = false
        kickSender()
      }
    })
}

function scheduleAt(when: Date): void {
  const delay = when.getTime() - Date.now()
  if (delay > 60_000) return // 交给每分钟的 tick
  if (S.timer) clearTimeout(S.timer)
  S.timer = setTimeout(() => {
    S.timer = null
    kickSender()
  }, Math.max(500, delay))
  S.timer.unref?.()
}

async function siteLabelOf(conv: { kind: string; tenantId: number | null }, cache: Map<number, string>): Promise<string> {
  if (conv.kind !== 'TENANT' || !conv.tenantId) return PLATFORM_SITE_LABEL
  if (cache.has(conv.tenantId)) return cache.get(conv.tenantId)!
  const sf = await storefrontById(conv.tenantId).catch(() => null)
  const label = sf?.brand?.name || sf?.code || '分站'
  cache.set(conv.tenantId, label)
  return label
}

/**
 * 分站群的最后一道闸（§5.4）：路由时只扫了事件，这里对发往分站群的每一条（指令回复、合并消息、日报）再扫一遍。
 * 命中就不发（BLOCKED，原文留在库里供核对），管理群收一条不含原文的告警
 */
async function blockTenantItem(itemId: number, conv: { id: number; name: string | null }, hit: string): Promise<void> {
  await prisma.botOutbox.update({ where: { id: itemId }, data: { status: 'BLOCKED', leaseUntil: null, lastError: `blocked:${hit}` } })
  console.error(`[bot] 发往分站群 #${conv.id} 的消息 #${itemId} 命中黑名单（${hit}），已拦下`)
  const mgmt = await prisma.botConversation.findMany({ where: { kind: 'MGMT', status: 'ACTIVE' }, select: { id: true } })
  await enqueueMany(
    mgmt.map((m) => ({
      conversationId: m.id,
      kind: 'ALERT' as const,
      text: `🚨 机器人拦下了一条发往分站群的消息｜${PLATFORM_SITE_LABEL}\n原因：内容含不该进分站群的信息（${hit}）\n群：#${conv.id} ${conv.name || ''}\n消息：#${itemId}（原文没有发出，留在后台核对）`,
      dedupeKey: `blks:${itemId}`,
    }))
  )
}

/** 某个群连续发不出去、刚被标成 UNREACHABLE：告诉站长（管理群自己发不出去时走企业微信） */
async function alertUnreachable(conv: { id: number; kind: string; name: string | null }): Promise<void> {
  const what = `#${conv.id} ${conv.name || ''}`.trim()
  const others = await prisma.botConversation.findMany({ where: { kind: 'MGMT', status: 'ACTIVE', id: { not: conv.id } }, select: { id: true } })
  if (conv.kind === 'MGMT' || !others.length) {
    notify('bot.offline', [
      { label: '情况', value: `群「${what}」连续 ${UNREACHABLE_AFTER} 次发送失败，已停止向它推送` },
      { label: '可能原因', value: '机器人被移出群、群已解散，或小号被限制发言' },
      { label: '处理', value: '确认机器人还在群里后，到后台「微信机器人 → 群」把它改回「推送中」' },
    ], { link: '/admin/bot', linkText: '前往后台' })
    return
  }
  await enqueueMany(
    others.map((m) => ({
      conversationId: m.id,
      kind: 'ALERT' as const,
      text: `⚠️ 有个群发不出去了｜${PLATFORM_SITE_LABEL}\n群：${what}\n情况：连续 ${UNREACHABLE_AFTER} 次发送失败，已停止向它推送（可能机器人被移出群或群已解散）\n处理：确认机器人还在群里后，到后台「微信机器人 → 群」把它改回「推送中」`,
      dedupeKey: `unr:${conv.id}:${Date.now().toString(36)}`,
    }))
  )
}

async function runLoop(): Promise<void> {
  const token = await acquireBotLock('send', LOCK_TTL_MS)
  if (!token) return // 另一个循环（或刚重启前的旧循环）在跑；tick 会再唤醒
  const started = Date.now()
  try {
    const state = await readBotState()
    const adapter = getAdapter()
    if (adapter.name === 'wxpad' && !state.online) return // 小号离线：不发、不计失败
    const cfg = await botConfigForDelivery()
    // 后台「推送运行开关」关着：只发指令回复（管理员还要能查状态、锁定），动态、合并、日报、告警都留在队里等过期
    const onlyKinds = cfg.enabled ? undefined : (['REPLY'] as const)
    const { perConvSeconds, jitterSeconds, perMinute, perHour } = cfg.pacing
    // 全局限速窗口：进程内记录，启动时用库里最近一小时的发送补齐
    if (!S.sentTimes.length) {
      const since = new Date(Date.now() - 3600_000)
      const recent = await prisma.botOutbox.findMany({ where: { status: 'SENT', sentAt: { gte: since } }, select: { sentAt: true }, take: 2000 })
      S.sentTimes = recent.map((r) => r.sentAt!.getTime()).sort((a, b) => a - b)
    }
    const labels = new Map<number, string>()
    let nextWake: Date | null = null

    while (Date.now() - started < RUN_BUDGET_MS) {
      const now = new Date()
      S.sentTimes = S.sentTimes.filter((t) => t > now.getTime() - 3600_000)
      const lastMinute = S.sentTimes.filter((t) => t > now.getTime() - 60_000)
      if (lastMinute.length >= perMinute || S.sentTimes.length >= perHour) {
        const oldest = lastMinute.length >= perMinute ? lastMinute[0] + 60_000 : S.sentTimes[0] + 3600_000
        nextWake = new Date(oldest + 500)
        break
      }

      // 有待发消息的会话，按最高优先级排
      const groups = await prisma.botOutbox.groupBy({
        by: ['conversationId'],
        where: { status: 'PENDING', notBefore: { lte: now }, expiresAt: { gt: now }, ...(onlyKinds ? { kind: { in: [...onlyKinds] } } : {}) },
        _max: { priority: true },
      })
      if (!groups.length) {
        const upcoming = await prisma.botOutbox.findFirst({
          where: { status: 'PENDING', notBefore: { gt: now }, ...(onlyKinds ? { kind: { in: [...onlyKinds] } } : {}) },
          orderBy: { notBefore: 'asc' },
          select: { notBefore: true },
        })
        if (upcoming) nextWake = upcoming.notBefore
        break
      }
      groups.sort((a, b) => (b._max.priority ?? 0) - (a._max.priority ?? 0))
      const convs = await prisma.botConversation.findMany({
        where: { id: { in: groups.map((x) => x.conversationId) } },
        select: { id: true, adapter: true, externalId: true, name: true, kind: true, tenantId: true, status: true, lastSentAt: true, failStreak: true },
      })
      const byId = new Map(convs.map((c) => [c.id, c]))

      let sentThisRound = false
      let earliest: number | null = null
      for (const grp of groups) {
        const conv = byId.get(grp.conversationId)
        if (!conv || conv.status !== 'ACTIVE' || conv.adapter !== adapter.name) {
          // 会话已解绑 / 暂停 / 换了适配器：这些待发消息作废（日报与回复也一样，没有地方可发）
          await prisma.botOutbox.updateMany({ where: { conversationId: grp.conversationId, status: 'PENDING' }, data: { status: 'CANCELLED' } })
          continue
        }
        const gap = (perConvSeconds + Math.random() * jitterSeconds) * 1000
        const readyAt = conv.lastSentAt ? conv.lastSentAt.getTime() + gap : 0
        if (readyAt > Date.now()) {
          earliest = earliest === null ? readyAt : Math.min(earliest, readyAt)
          continue
        }
        if (!onlyKinds) await mergeDigest(conv.id, await siteLabelOf(conv, labels))
        const item = await leaseNext(conv.id, new Date(), onlyKinds)
        if (!item) continue
        let text: string
        try {
          text = openOutboxText(item.text)
        } catch {
          // 加密存放的消息解不开（CARDKEY_SECRET 变了）：不发、直接终结，不计会话失败
          await markFailed({ id: item.id, attempts: MAX_ATTEMPTS - 1 }, '加密消息无法解开（CARDKEY_SECRET 变了？）')
          continue
        }
        if (conv.kind === 'TENANT') {
          const hit = tenantBlacklistHit(text)
          if (hit) {
            await blockTenantItem(item.id, conv, hit)
            continue
          }
        }
        const res = await adapter.sendText(conv.externalId, text)
        const at = new Date()
        if (res.ok) {
          await markSent(item.id, at)
          await prisma.botConversation.update({ where: { id: conv.id }, data: { lastSentAt: at, failStreak: 0 } })
          S.sentTimes.push(at.getTime())
          sentThisRound = true
        } else {
          await markFailed(item, res.error || '发送失败', at)
          const streak = conv.failStreak + 1
          await prisma.botConversation.update({
            where: { id: conv.id },
            data: { failStreak: streak, lastSentAt: at, ...(streak >= UNREACHABLE_AFTER ? { status: 'UNREACHABLE' } : {}) },
          })
          if (streak === UNREACHABLE_AFTER) {
            console.error(`[bot] 会话 #${conv.id} 连续 ${streak} 次发送失败，已标为发不出去`)
            await alertUnreachable(conv).catch((e) => console.error('[bot] 发不出去告警失败', (e as Error)?.message))
          }
          // 协议服务整体出问题时别继续轰炸：一轮里出现失败就先停，30 秒后再试（tick 也会查在线状态）
          scheduleAt(new Date(Date.now() + 30_000))
          return
        }
        if (!(await renewBotLock('send', token))) return
        await sleep(300 + Math.random() * 900)
        if (Date.now() - started >= RUN_BUDGET_MS) break
        // 全局限速：发完一条重新检查
        if (S.sentTimes.filter((t) => t > Date.now() - 60_000).length >= perMinute) break
      }
      if (!sentThisRound) {
        if (earliest !== null) nextWake = new Date(earliest)
        break
      }
    }
    if (nextWake) scheduleAt(nextWake)
  } finally {
    await releaseBotLock('send', token)
  }
}
