/**
 * iLink 适配器：微信官方 ClawBot 通道（docs/微信机器人-设计.md 附录 E；BOT_ADAPTER=ilink）。
 *
 * 与 wxpad（一个小号进很多群）完全不同的模型：
 *  - 没有小号、没有群。每个人用**自己的微信**扫后台给的二维码，绑定成一个一对一的会话（bot_conversations 一行，
 *    external_id = ilink_bot_id）：站长 / 管理员绑成 MGMT（收全站动态、能发指令），分站代理绑成 TENANT（只收本站动态）。
 *  - 只有扫码的那个微信能和它说话（收消息循环按 ilink_user_id 过滤），身份比群里的 @ 更可靠。
 *  - 发消息必须带对方最近一条消息的 context_token，约 24 小时内有效：对方超过一天没说话，推送就发不出去。
 *    这时不算失败，sendText 返回 defer，发送器把这个会话的待发消息往后挪；对方一发消息（收消息循环）就提前补发。
 *    窗口快到期时在消息末尾提醒一句「回复任意内容即可继续」。
 * 收消息不走回调：每个绑定一个长轮询循环（ilink-loop.ts），由每分钟的 tick 保活。
 */
import { prisma } from '../../db'
import type { Inbound } from '../types'
import { DEFER_NO_CONTEXT } from '../outbox'
import { ilinkBase, sendTextIlink } from './ilink-api'
import { ilinkLoopSnapshot } from './ilink-loop'
import { CONTEXT_TTL_MS, isDeadContext, KEEPALIVE_HINT, KEEPALIVE_HINT_AFTER_MS, markDeadContext } from './ilink-shared'
import { readBinding } from './ilink-store'
import type { AdapterCapability, AdapterStatus, BotAdapter, ChatInfo, SendResult } from './types'

/** 窗口关着时多久再看一次（对方发消息会立刻提前，这只是兜底） */
const RECHECK_MS = 30 * 60_000
/** context_token 超过这个年龄还发失败，就当窗口已经关了（服务端没写明错误码） */
const LIKELY_EXPIRED_AFTER_MS = 12 * 3600_000

export class IlinkAdapter implements BotAdapter {
  readonly name = 'ilink' as const
  readonly capabilities: ReadonlySet<AdapterCapability> = new Set<AdapterCapability>(['sender_id'])

  async status(): Promise<AdapterStatus> {
    const convs = await prisma.botConversation.findMany({ where: { adapter: 'ilink', status: { not: 'REVOKED' } }, select: { id: true, status: true } })
    const running = ilinkLoopSnapshot().filter((l) => l.running)
    const active = convs.filter((c) => c.status === 'ACTIVE').length
    const stale = convs.filter((c) => c.status === 'UNREACHABLE').length
    // 有循环在跑、但最近 3 分钟一轮都没成功：腾讯那边连不上
    const healthy = !running.length || running.some((l) => l.lastOkAt !== null && Date.now() - l.lastOkAt < 180_000)
    const detail = convs.length
      ? `${active} 个微信绑定在用${stale ? `，${stale} 个已失效需要重新扫码` : ''}${healthy ? '' : '；最近 3 分钟连不上微信 iLink 服务'}`
      : '还没有绑定任何微信：到后台「微信机器人 → 概览 → 微信绑定」扫码'
    // 没有「小号在线」这回事：online 恒为 true，免得走 wxpad 的掉线告警；单个绑定失效由收消息循环自己告警
    return { reachable: healthy, online: true, detail }
  }

  async loginQr(): Promise<{ qr: string | null; error?: string }> {
    return { qr: null, error: 'iLink 不用登录小号：请在「微信绑定」里为管理员或分站生成二维码，用各自的微信扫码' }
  }

  async loginProgress() {
    return { state: 'ERROR' as const, error: 'iLink 没有小号登录' }
  }

  async wakeLogin(): Promise<{ ok: boolean; error?: string }> {
    return { ok: false, error: 'iLink 没有小号登录，不需要唤醒' }
  }

  async listChats(): Promise<ChatInfo[]> {
    return [] // 没有群
  }

  async sendText(externalId: string, text: string): Promise<SendResult> {
    const conv = await prisma.botConversation.findUnique({ where: { adapter_externalId: { adapter: 'ilink', externalId } }, select: { id: true } })
    if (!conv) return { ok: false, error: '没有这个微信绑定' }
    const b = await readBinding(conv.id)
    if (!b) return { ok: false, error: '绑定凭据丢失或解不开（CARDKEY_SECRET 换了？），需要重新扫码' }
    if (b.staleAt) return { ok: false, error: '绑定已失效（对方解除了绑定或过期），需要重新扫码' }
    const now = Date.now()
    const age = b.ctxAt ? now - Date.parse(b.ctxAt) : Number.POSITIVE_INFINITY
    const defer = { until: new Date(now + RECHECK_MS), reason: DEFER_NO_CONTEXT }
    if (!b.ctxToken || !(age < CONTEXT_TTL_MS) || isDeadContext(conv.id, b.ctxToken)) return { ok: false, error: DEFER_NO_CONTEXT, defer }
    const body = age > KEEPALIVE_HINT_AFTER_MS ? `${text}\n\n${KEEPALIVE_HINT}` : text
    const r = await sendTextIlink(ilinkBase(b.baseUrl), b.token, b.userId, b.ctxToken, body)
    if (r.ok) return { ok: true }
    if (r.stale) return { ok: false, error: '绑定已失效（-14），需要重新扫码' } // 收消息循环下一轮也会发现并告警
    if (age > LIKELY_EXPIRED_AFTER_MS) {
      markDeadContext(conv.id, b.ctxToken)
      return { ok: false, error: DEFER_NO_CONTEXT, defer }
    }
    return { ok: false, error: r.error || '发送失败' }
  }

  parseCallback(): Inbound[] {
    return [] // iLink 没有回调，收消息走长轮询（ilink-loop.ts）
  }
}
