export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { prisma } from '@/lib/db'
import { rateLimited } from '@/lib/news/rate-limit'
import { adapterName } from '@/lib/bot/adapters'
import { botConfigForDelivery, botEnabledByEnv } from '@/lib/bot/config'
import { oneLine, tenantBlacklistHit } from '@/lib/bot/mask'
import { enqueueReply } from '@/lib/bot/outbox'
import { bjMinute } from '@/lib/bot/render'
import { kickSender } from '@/lib/bot/sender'
import { inNewAccountQuiet, readBotState } from '@/lib/bot/state'
import { auditSoft, currentActor, intIn, parseId, readBody } from '@/app/api/admin/bot/_lib/common'
import type { TestMessageDTO, TestMessageStatusDTO } from '@/app/admin/bot/types'

/** 自定义测试文字的上限（字） */
const MAX_TEXT = 200
/** 测试消息的去重键前缀：GET 只认这类行，不能拿来翻看别的出队消息 */
const TEST_PREFIX = 'test:'
const STATUS_TEXT: Record<string, string> = { PAUSED: '已暂停', UNREACHABLE: '发不出去', REVOKED: '已解绑' }

/**
 * 发一条测试消息（docs/微信机器人-设计.md §14「概览」）：body { conversationId, text? }。
 * 用来核对「机器人到某个群的推送通不通」——绑定之后、换小号之后、群被标成发不出去又恢复之后都用得上。
 *  · 只能发给推送中（ACTIVE）、且属于当前适配器的会话；
 *  · 文字缺省为「🤖 测试消息：机器人到本群的推送正常（北京时间）」；自定义文字压成一行、最多 200 字；
 *    发往分站群的文字先过一遍分站群黑名单（发送器出队前还会再扫一次，命中会被拦下并在管理群告警，这里提前拦，免得白白告警）；
 *  · 新号保护期内（小号登录未满 N 小时）只给管理群和私聊发（§5.6）；
 *  · 走正常出队（指令回复的优先级、10 分钟过期），dedupe_key = test:<毫秒时间戳>，再唤醒发送器。返回出队行的 id，页面拿它轮询状态。
 * 小号每多发一条都多一分风控风险：全局每分钟最多 3 条（只有真正入队的才计数）。审计只记长度、不记文字。
 */
export async function POST(request: NextRequest) {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const body = await readBody(request)
    if (!body) return error('请求体不是 JSON 对象')
    const id = intIn(body.conversationId, 1, 2_000_000_000)
    if (!id) return error('请选择要发测试消息的会话')
    if (body.text !== undefined && body.text !== null && typeof body.text !== 'string') return error('测试消息必须是文字')
    const custom = typeof body.text === 'string' ? oneLine(body.text, 10_000) : ''
    if (Array.from(custom).length > MAX_TEXT) return error(`测试消息最多 ${MAX_TEXT} 字`)
    const text = custom || `🤖 测试消息：机器人到本群的推送正常（${bjMinute(new Date())}）`

    if (!botEnabledByEnv()) return error('机器人没有启用（环境变量 BOT_ENABLED 不是 1），发送器不工作，测试消息发不出去', 409)
    const conv = await prisma.botConversation.findUnique({ where: { id } })
    if (!conv) return error('找不到这个会话', 404)
    if (conv.status !== 'ACTIVE') return error(`这个会话现在是「${STATUS_TEXT[conv.status] ?? conv.status}」，只能给推送中的会话发测试消息`, 409)
    const adapter = adapterName()
    if (conv.adapter !== adapter) return error(`这个会话属于 ${conv.adapter} 适配器，当前用的是 ${adapter}，发不出去`, 409)
    const [state, cfg] = await Promise.all([readBotState(), botConfigForDelivery()])
    if (conv.kind === 'TENANT') {
      const hit = tenantBlacklistHit(text)
      if (hit) return error(`这段文字含不能进分站群的内容（${hit}）：分站群里不能出现后台链接、核销链接、平台快速回复链接与明文邮箱`, 400)
      if (inNewAccountQuiet(state, cfg.newAccountQuietHours)) {
        return error(`小号登录未满 ${cfg.newAccountQuietHours} 小时（新号保护期），这段时间只给管理群和私聊发消息；分站群请保护期过后再测`, 409)
      }
    }
    if (rateLimited('bottest:all', { windowMs: 60_000, max: 3 })) return error('测试消息发得太频繁，请 1 分钟后再试', 429)

    const now = new Date()
    const dedupeKey = `${TEST_PREFIX}${now.getTime()}`
    await enqueueReply(conv.id, text, dedupeKey, now)
    const row = await prisma.botOutbox.findFirst({ where: { conversationId: conv.id, dedupeKey }, select: { id: true, status: true } })
    kickSender()
    const actor = await currentActor()
    await auditSoft(request, actor, 'bot.admin.test_message', { type: 'bot_conversation', id: String(conv.id) }, {
      conversationId: conv.id,
      kind: conv.kind,
      tenantId: conv.tenantId,
      outboxId: row?.id ?? null,
      custom: !!custom,
      length: Array.from(text).length,
    })
    const offline = adapter === 'wxpad' && !state.online
    const dto: TestMessageDTO = { outboxId: row?.id ?? null, status: row?.status ?? null }
    return success(
      dto,
      offline ? '已放进发送队列；但最近一次检查小号不在线，发送器会等小号恢复在线再发（10 分钟内发不出去就作废）' : '已放进发送队列'
    )
  } catch (e) {
    console.error('[bot-admin] 发测试消息失败', e)
    return error('发测试消息失败', 500)
  }
}

/** 查一条测试消息的发送状态：?id=<出队 id>。只认 dedupe_key 以 test: 开头的行 */
export async function GET(request: NextRequest) {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const id = parseId(request.nextUrl.searchParams.get('id'))
    if (!id) return error('测试消息编号不对')
    const row = await prisma.botOutbox.findUnique({
      where: { id },
      select: { id: true, status: true, attempts: true, lastError: true, sentAt: true, dedupeKey: true },
    })
    if (!row || !row.dedupeKey.startsWith(TEST_PREFIX)) return error('找不到这条测试消息', 404)
    const dto: TestMessageStatusDTO = {
      id: row.id,
      status: row.status,
      attempts: row.attempts,
      lastError: row.lastError,
      sentAt: row.sentAt ? row.sentAt.toISOString() : null,
    }
    const res = success(dto)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (e) {
    console.error('[bot-admin] 查询测试消息状态失败', e)
    return error('查询测试消息状态失败', 500)
  }
}
