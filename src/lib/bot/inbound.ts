/**
 * 入站处理（docs/微信机器人-设计.md §7.1、§3.4）：协议服务回调的消息 → 过滤 → 三道闸 → 去重 → 执行指令 → 回复进出队。
 *
 * - 要处理的只有三种：@了机器人的群消息（atuserlist 里有机器人 wxid，且不是 @所有人）、私聊、管理群的系统提示。
 *   其余**直接丢弃、不落库**（不保存群里的普通聊天，§1.2）。
 * - 三道闸：① 会话已登记且合适（未登记的群只认「创建」「设为管理群」「绑定」）② 真 @ ③ 发送人 wxid 是登记过的管理员。
 *   任何一道不过：不回复、不产生任何出队消息，只记一行 IGNORED（不记消息内容）。
 * - 认领管理员：后台生成认领码，管理员私聊小号发「认领 <码>」，这是唯一在第 ③ 道闸之前处理的指令。
 * - 同一条消息（协议给的消息 ID）只执行一次：bot_commands (adapter, msg_id) 唯一。
 */
import { createHash, timingSafeEqual } from 'crypto'
import { prisma } from '../db'
import { notify } from '../notify'
import { writeAudit } from '../audit'
import { rateLimited } from '../news/rate-limit'
import { adapterName, getAdapter } from './adapters'
import { DEFAULT_BOT_CONFIG, readBotConfig } from './config'
import { enqueueMany, enqueueReply, sealOutboxText } from './outbox'
import { kickSender } from './sender'
import { readBotState } from './state'
import { AGENT_COMMANDS, AGENT_PSEUDO_ADMIN, findCommand } from './commands'
import { parseCommandText } from './commands/parse'
import type { BotContext, BotReply, CmdConversation } from './commands/types'
import type { Inbound } from './types'

const INBOUND_PER_MINUTE = 10
/** iLink 分站绑定里代理的查询：每个会话每分钟最多几次（日报类要查十几张表） */
const AGENT_QUERIES_PER_MINUTE = 4

/** iLink 分站绑定里，代理发来不认识的话时的说明（附录 E.5；同一会话 6 小时一次） */
export const ILINK_TENANT_HINT =
  '👋 收到。这个对话会推送本分站的动态（新订单、留言、开票等）和每天的日报；也可以直接发「动态」「待办」「日报」查本站（发「帮助」看全部）。\n' +
  '微信规定：超过 24 小时没有回复，推送会暂停；平时回复任意一个字即可继续接收。'

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex')
}

async function recordCommand(data: {
  adapter: string
  msgId: string
  conversationId: number | null
  convExternalId: string
  kind: string
  senderWxid: string | null
  senderName?: string | null
  adminId?: number | null
  name?: string | null
  argsText?: string | null
  decision: string
  reasonCode?: string | null
  resultSummary?: string | null
}): Promise<number | null> {
  const msgId = data.msgId.slice(0, 64)
  // INSERT IGNORE：协议服务重复回调同一条消息时撞 (adapter, msg_id) 唯一键，按影响行数判断「已处理过」，
  // 不用 create + 捕获 P2002（生产的 PrismaClient 开着 log: ['error']，会在日志里刷 prisma:error）
  const r = await prisma.botCommand.createMany({
    data: [
      {
        adapter: data.adapter,
        msgId,
        conversationId: data.conversationId,
        convExternalId: data.convExternalId.slice(0, 191),
        kind: data.kind,
        senderWxid: data.senderWxid ? data.senderWxid.slice(0, 64) : null,
        senderName: data.senderName ? data.senderName.slice(0, 64) : null,
        adminId: data.adminId ?? null,
        name: data.name ? data.name.slice(0, 16) : null,
        argsText: data.argsText ? data.argsText.slice(0, 255) : null,
        decision: data.decision,
        reasonCode: data.reasonCode ? data.reasonCode.slice(0, 24) : null,
        resultSummary: data.resultSummary ? data.resultSummary.slice(0, 255) : null,
      },
    ],
    skipDuplicates: true,
  })
  if (r.count !== 1) return null // 重复回调：已处理过
  const row = await prisma.botCommand.findUnique({ where: { adapter_msgId: { adapter: data.adapter, msgId } }, select: { id: true } })
  return row?.id ?? null
}

async function finish(id: number, decision: string, reasonCode: string | null, summary: string | null): Promise<void> {
  await prisma.botCommand
    .update({ where: { id }, data: { decision, reasonCode: reasonCode?.slice(0, 24) ?? null, resultSummary: summary?.slice(0, 255) ?? null } })
    .catch(() => {})
}

/** 认领：管理员私聊「认领 <码>」。码与后台生成的哈希比对（常量时间），过期或用过即无效 */
async function tryClaim(m: Inbound, adapter: string): Promise<boolean> {
  if (m.isGroup) return false
  const parsed = parseCommandText(m.text)
  if (!parsed || (parsed.name !== '认领' && parsed.name !== 'claim') || parsed.args.length !== 1) return false
  const code = parsed.args[0].toUpperCase()
  if (!/^[A-Z0-9]{6,12}$/.test(code)) return false
  const cmdId = await recordCommand({ adapter, msgId: m.msgId, conversationId: null, convExternalId: m.convExternalId, kind: 'MESSAGE', senderWxid: m.senderWxid, name: '认领', decision: 'REJECTED' })
  if (!cmdId) return true
  const now = new Date()
  const h = sha256(code)
  const admins = await prisma.botAdmin.findMany({ where: { enabled: true, claimCodeHash: { not: null }, claimExpiresAt: { gt: now } } })
  const hit = admins.find((a) => {
    const x = Buffer.from(a.claimCodeHash!, 'hex')
    const y = Buffer.from(h, 'hex')
    return x.length === y.length && timingSafeEqual(x, y)
  })
  if (!hit) {
    await finish(cmdId, 'IGNORED', 'CLAIM_BAD', null) // 不回复：不给试探者反馈
    return true
  }
  const taken = await prisma.botAdminIdentity.findUnique({ where: { adapter_wxid: { adapter, wxid: m.senderWxid } } })
  if (taken && taken.adminId !== hit.id) {
    await finish(cmdId, 'REJECTED', 'CLAIM_TAKEN', null)
    return true
  }
  // 用条件更新消费认领码（只成功一次）
  const r = await prisma.botAdmin.updateMany({ where: { id: hit.id, claimCodeHash: hit.claimCodeHash }, data: { claimCodeHash: null, claimExpiresAt: null } })
  if (r.count !== 1) {
    await finish(cmdId, 'IGNORED', 'CLAIM_RACE', null)
    return true
  }
  await prisma.botAdminIdentity.upsert({
    where: { adapter_wxid: { adapter, wxid: m.senderWxid } },
    create: { adminId: hit.id, adapter, wxid: m.senderWxid, nickname: m.senderName?.slice(0, 64) ?? null },
    update: { adminId: hit.id, enabled: true, nickname: m.senderName?.slice(0, 64) ?? null },
  })
  // 私聊会话随认领一起登记。iLink 的绑定会话（附录 E）本来就有 kind（MGMT / TENANT），原样保留、只在里面回复
  const existing = await prisma.botConversation.findUnique({ where: { adapter_externalId: { adapter, externalId: m.convExternalId } } })
  const conv =
    existing && existing.kind !== 'DM'
      ? existing
      : await prisma.botConversation.upsert({
          where: { adapter_externalId: { adapter, externalId: m.convExternalId } },
          create: { adapter, externalId: m.convExternalId, kind: 'DM', status: 'ACTIVE', allowT3: true, boundBy: hit.id, boundAt: now, name: (m.senderName || hit.name).slice(0, 100) },
          update: { kind: 'DM', status: 'ACTIVE', boundBy: hit.id, boundAt: now },
        })
  await finish(cmdId, 'OK', null, `认领管理员 #${hit.id}`)
  await prisma.botCommand.update({ where: { id: cmdId }, data: { adminId: hit.id, conversationId: conv.id } }).catch(() => {})
  await writeAudit(null, { actorUserId: hit.siteUserId, actorKind: 'PLATFORM', action: 'bot.admin.claim', targetType: 'bot_admin', targetId: String(hit.id), diff: { wxid: m.senderWxid } }).catch((e) =>
    console.error('[bot] 写审计失败', (e as Error)?.message)
  )
  notify('bot.sensitive', [
    { label: '操作', value: '管理员认领了微信身份' },
    { label: '管理员', value: hit.name },
    { label: '微信昵称', value: m.senderName || '—' },
  ])
  await enqueueReply(conv.id, `✅ 已认领：你（${m.senderName || '这个微信号'}）现在是机器人管理员「${hit.name}」。发送「帮助」查看指令。`, `r:${cmdId}`)
  return true
}

async function directSend(externalId: string, text: string): Promise<void> {
  const r = await getAdapter()
    .sendText(externalId, text)
    .catch((e) => ({ ok: false, error: (e as Error)?.message }))
  if (!r.ok) console.error('[bot] 直接回复失败', r.error)
}

async function handleSystem(m: Inbound, adapter: string): Promise<void> {
  const conv = await prisma.botConversation.findUnique({ where: { adapter_externalId: { adapter, externalId: m.convExternalId } } })
  if (!conv || conv.status === 'REVOKED') return
  const joined = /加入了群聊|加入群聊/.test(m.text)
  const removedBot = /你被.*移出|移出了群聊.*你|你已被移出/.test(m.text)
  if (!joined && !removedBot) return
  const cmdId = await recordCommand({ adapter, msgId: m.msgId, conversationId: conv.id, convExternalId: m.convExternalId, kind: 'SYSTEM', senderWxid: null, decision: 'OK', resultSummary: m.text.slice(0, 120) })
  if (!cmdId) return
  if (removedBot) {
    await prisma.botConversation.update({ where: { id: conv.id }, data: { status: 'UNREACHABLE' } })
  }
  if (conv.kind === 'MGMT' && joined) {
    // 陌生人进了管理群会看到之后的提卡核销链接：管理群与企业微信各告警一条（§7.1）
    notify('bot.sensitive', [
      { label: '操作', value: '有人加入了主站管理群' },
      { label: '群', value: `${conv.name || '管理群'}（#${conv.id}）` },
      { label: '提示', value: m.text.slice(0, 120) },
      { label: '处理', value: '不认识的人请立刻移出；必要时 @贝果助手 锁定' },
    ])
    await enqueueMany([{ conversationId: conv.id, kind: 'ALERT', text: `⚠️ 有人加入了管理群：${m.text.slice(0, 120)}\n管理群里会出现提卡核销链接，不认识的人请立刻移出；必要时发送「@贝果助手 锁定」。`, dedupeKey: `sys:${cmdId}` }])
  } else if (removedBot) {
    notify('bot.sensitive', [
      { label: '操作', value: '小号被移出了群' },
      { label: '群', value: `${conv.name || '未命名群'}（#${conv.id}）` },
    ])
  }
}

/**
 * iLink 分站绑定里代理发来的消息（附录 E.5）。发送人就是扫码绑定这个分站会话的代理（收消息循环按 ilink_user_id 过滤过）。
 *  · 只认 AGENT_COMMANDS（只读、T0 / T1，注册表加载时校验），ctx.actor = agent、范围恒为本站；每个会话每分钟最多 4 次；
 *  · 别的指令回「只有站长能用」；不认识的话 6 小时内第一次回说明（可查什么 + 24 小时规则），之后回「没看懂」；
 *  · 指令日志照记（admin_id 为空，便于后台看代理查了什么）；回复照常进出队，发送器对分站会话再过一遍黑名单。
 * 返回是否往出队写了东西
 */
async function handleAgent(m: Inbound, adapter: string, conv: { id: number; tenantId: number | null; name: string | null }): Promise<boolean> {
  const parsed = parseCommandText(m.text)
  const def = parsed ? findCommand(parsed.name) : undefined
  const allowed = !!def && AGENT_COMMANDS.includes(def.name) && def.scopes.includes('TENANT')
  const cmdId = await recordCommand({
    adapter,
    msgId: m.msgId,
    conversationId: conv.id,
    convExternalId: m.convExternalId,
    kind: 'MESSAGE',
    senderWxid: m.senderWxid,
    adminId: null,
    name: def?.name ?? parsed?.name ?? null,
    argsText: allowed && parsed ? parsed.args.join(' ') : null,
    decision: 'REJECTED',
  })
  if (!cmdId) return false // 重复投递：已处理过
  const say = (text: string) => enqueueReply(conv.id, text, `r:${cmdId}`)
  if (!def) {
    const bucket = Math.floor(Date.now() / (6 * 3600_000))
    const n = await enqueueReply(conv.id, ILINK_TENANT_HINT, `hint:${conv.id}:${bucket}`)
    if (!n) await say('没看懂，发送「帮助」查看可以查什么')
    await finish(cmdId, 'IGNORED', parsed ? 'UNKNOWN' : 'EMPTY', null)
    return true
  }
  if (!allowed) {
    await say(`「${def.name}」只有站长能用。这里可以查：${AGENT_COMMANDS.filter((n) => n !== '帮助').join('、')}（发「帮助」看说明）`)
    await finish(cmdId, 'REJECTED', 'AGENT_SCOPE', null)
    return true
  }
  if (rateLimited(`botag:${conv.id}`, { windowMs: 60_000, max: AGENT_QUERIES_PER_MINUTE })) {
    await say('查得太频繁了，请 1 分钟后再试')
    await finish(cmdId, 'REJECTED', 'RATE', null)
    return true
  }
  const cfgRead = await readBotConfig()
  const config = cfgRead.ok ? cfgRead.config : DEFAULT_BOT_CONFIG
  if (config.disabledCommands.includes(def.name)) {
    await say(`「${def.name}」已在后台临时关闭`)
    await finish(cmdId, 'REJECTED', 'DISABLED', null)
    return true
  }
  const p = def.parse(parsed!.args)
  if (!p.ok) {
    await say(p.usage.replace(/@贝果助手\s*/g, ''))
    await finish(cmdId, 'REJECTED', 'USAGE', null)
    return true
  }
  const ctx: BotContext = {
    adapter: adapter as BotContext['adapter'],
    conv: { id: conv.id, kind: 'TENANT', tenantId: conv.tenantId, allowT3: false, externalId: m.convExternalId, isGroup: false, name: conv.name },
    admin: { ...AGENT_PSEUDO_ADMIN },
    actor: 'agent',
    commandId: cmdId,
    msgId: m.msgId,
    senderWxid: m.senderWxid,
    now: new Date(),
    config,
    scopeTenantId: conv.tenantId,
  }
  let reply: BotReply
  try {
    reply = await def.run(ctx, p.value)
  } catch (e) {
    console.error(`[bot] 代理指令「${def.name}」执行出错`, e)
    await say(`❌「${def.name}」查询出错，请稍后再试`)
    await finish(cmdId, 'ERROR', 'EXCEPTION', (e as Error)?.message ?? null)
    return true
  }
  // 只读指令不该有这些：有就是名单配错了——不发，记 ERROR
  if (reply.sensitive || reply.conversationId || reply.extraSendTo || reply.notifyMgmt) {
    console.error(`[bot] 代理指令「${def.name}」的回复带了敏感内容或别的投递目标，已丢弃`)
    await finish(cmdId, 'ERROR', 'AGENT_REPLY', null)
    return true
  }
  await say(reply.text)
  await finish(cmdId, reply.rejected ? 'REJECTED' : 'OK', reply.rejected ?? null, reply.summary ?? null)
  return true
}

/** 处理一批入站消息（回调路由与 itest 调用）。不抛 */
export async function handleInbound(list: Inbound[]): Promise<void> {
  const adapter = adapterName()
  const state = await readBotState()
  const selfWxid = state.botWxid || process.env.BOT_CONSOLE_WXID || null
  let touched = false
  for (const m of list) {
    try {
      if (m.kind === 'SYSTEM') {
        await handleSystem(m, adapter)
        touched = true
        continue
      }
      if (!m.senderWxid || (selfWxid && m.senderWxid === selfWxid)) continue
      // 第 ② 道闸：群消息必须真的 @ 了机器人（协议给的被 @ 列表），且不是 @所有人；私聊不需要 @
      if (m.isGroup) {
        if (!selfWxid || m.atAll || !m.atWxids.includes(selfWxid)) continue
      }
      if (rateLimited(`botin:${m.convExternalId}`, { windowMs: 60_000, max: INBOUND_PER_MINUTE })) continue

      if (await tryClaim(m, adapter)) {
        touched = true
        continue
      }

      const identity = await prisma.botAdminIdentity.findUnique({ where: { adapter_wxid: { adapter, wxid: m.senderWxid } } })
      const admin = identity?.enabled ? await prisma.botAdmin.findUnique({ where: { id: identity.adminId } }) : null
      const conv = await prisma.botConversation.findUnique({ where: { adapter_externalId: { adapter, externalId: m.convExternalId } } })
      const convActive = conv && conv.status !== 'REVOKED' ? conv : null

      // 第 ③ 道闸：发送人是管理员。不是 → 只记一行，不记内容、不回复
      if (!admin || !admin.enabled) {
        // 例外：iLink 的分站绑定（附录 E.5）。收消息循环只放扫码的那个代理的消息进来——他能用只读的查询指令（AGENT_COMMANDS），
        // 范围恒为这个会话绑定的分站
        if (adapter === 'ilink' && convActive?.kind === 'TENANT' && convActive.status === 'ACTIVE' && convActive.tenantId) {
          if (await handleAgent(m, adapter, convActive)) touched = true
          continue
        }
        await recordCommand({ adapter, msgId: m.msgId, conversationId: convActive?.id ?? null, convExternalId: m.convExternalId, kind: 'MESSAGE', senderWxid: m.senderWxid, decision: 'IGNORED', reasonCode: 'NOT_ADMIN' })
        continue
      }

      const parsed = parseCommandText(m.text)
      const def = parsed ? findCommand(parsed.name) : undefined
      const cmdId = await recordCommand({
        adapter,
        msgId: m.msgId,
        conversationId: convActive?.id ?? null,
        convExternalId: m.convExternalId,
        kind: 'MESSAGE',
        senderWxid: m.senderWxid,
        senderName: m.senderName ?? null,
        adminId: admin.id,
        name: def?.name ?? parsed?.name ?? null,
        argsText: parsed?.args.join(' ') ?? null,
        decision: 'REJECTED',
      })
      if (!cmdId) continue // 重复回调

      // 私聊会话：管理员第一次私聊时自动登记
      let convRow = convActive
      if (!convRow && !m.isGroup) {
        convRow = await prisma.botConversation.upsert({
          where: { adapter_externalId: { adapter, externalId: m.convExternalId } },
          create: { adapter, externalId: m.convExternalId, kind: 'DM', status: 'ACTIVE', allowT3: true, boundBy: admin.id, boundAt: new Date(), name: (m.senderName || admin.name).slice(0, 100) },
          update: { kind: 'DM', status: 'ACTIVE' },
        })
      }

      const replyTo = convRow?.id ?? null
      // 未登记的群没有会话行、进不了出队：管理员在那里发的指令，回复直接发（量极少，只有「创建」「设为管理群」的失败提示）
      const say = async (text: string) => {
        if (replyTo) await enqueueReply(replyTo, text, `r:${cmdId}`)
        else await directSend(m.convExternalId, text)
        touched = true
      }

      // 第 ① 道闸：会话
      const scope = convRow ? (convRow.kind as 'MGMT' | 'TENANT' | 'DM') : 'UNBOUND'
      if (!def) {
        if (scope !== 'UNBOUND') await say(adapter === 'ilink' ? '没看懂，发送「帮助」查看可用指令' : '没看懂，发送「@贝果助手 帮助」查看可用指令')
        await finish(cmdId, 'REJECTED', parsed ? 'UNKNOWN' : 'EMPTY', null)
        continue
      }
      if (!def.scopes.includes(scope)) {
        if (scope !== 'UNBOUND') await say(def.scopes.includes('MGMT') ? `「${def.name}」只能在主站管理群使用` : `「${def.name}」在这里不能用`)
        await finish(cmdId, 'REJECTED', 'SCOPE', null)
        continue
      }
      if (def.tier > admin.maxTier) {
        await say(`你没有使用「${def.name}」的权限`)
        await finish(cmdId, 'REJECTED', 'TIER', null)
        continue
      }
      const cfgRead = await readBotConfig()
      if (!cfgRead.ok && def.tier >= 2) {
        await say('机器人配置读取失败，改设置与提卡类指令暂停；请到后台「微信机器人」检查')
        await finish(cmdId, 'REJECTED', 'CONFIG', null)
        continue
      }
      const config = cfgRead.ok ? cfgRead.config : DEFAULT_BOT_CONFIG
      if (config.disabledCommands.includes(def.name)) {
        await say(`「${def.name}」已在后台临时关闭`)
        await finish(cmdId, 'REJECTED', 'DISABLED', null)
        continue
      }
      if (config.locked && def.tier >= 2 && !def.allowWhenLocked) {
        await say('🔒 机器人已锁定：提卡、补货与改设置的指令暂停，只能在后台解锁')
        await finish(cmdId, 'REJECTED', 'LOCKED', null)
        continue
      }
      if (def.tier >= 3 && scope === 'MGMT' && !convRow?.allowT3) {
        await say('本群没有开通提卡、补货；请到后台「微信机器人 → 会话」勾选「允许提卡补货」')
        await finish(cmdId, 'REJECTED', 'NO_T3', null)
        continue
      }
      const p = def.parse(parsed!.args)
      if (!p.ok) {
        // iLink 一对一不用 @：用法里的「@贝果助手」去掉
        await say(adapter === 'ilink' ? p.usage.replace(/@贝果助手\s*/g, '') : p.usage)
        await finish(cmdId, 'REJECTED', 'USAGE', null)
        continue
      }

      const convCtx: CmdConversation = {
        id: convRow?.id ?? null,
        kind: convRow ? (convRow.kind as 'MGMT' | 'TENANT' | 'DM') : null,
        tenantId: convRow?.tenantId ?? null,
        allowT3: !!convRow?.allowT3,
        externalId: m.convExternalId,
        isGroup: m.isGroup,
        name: convRow?.name ?? null,
      }
      const ctx: BotContext = {
        adapter,
        conv: convCtx,
        admin: { id: admin.id, name: admin.name, siteUserId: admin.siteUserId, maxTier: admin.maxTier },
        commandId: cmdId,
        msgId: m.msgId,
        senderWxid: m.senderWxid,
        now: new Date(),
        config,
        scopeTenantId: convCtx.kind === 'TENANT' ? convCtx.tenantId : null,
      }
      let reply: BotReply
      try {
        reply = await def.run(ctx, p.value)
      } catch (e) {
        console.error(`[bot] 指令「${def.name}」执行出错`, e)
        await say(`❌「${def.name}」执行出错，请稍后再试或到后台处理`)
        await finish(cmdId, 'ERROR', 'EXCEPTION', (e as Error)?.message ?? null)
        continue
      }
      const target = reply.conversationId ?? replyTo
      try {
        // 含卡密 / 一次性链接的回复只回发起会话（不跟 conversationId 改投），出队里加密存放
        if (reply.sensitive) {
          if (replyTo) await enqueueReply(replyTo, sealOutboxText(reply.text), `r:${cmdId}`)
          else console.error(`[bot] 指令「${def.name}」的敏感回复没有可投递的会话，已丢弃`)
        } else if (target) await enqueueReply(target, reply.text, `r:${cmdId}`)
        else await directSend(m.convExternalId, reply.text)
        if (reply.extraSendTo) await enqueueReply(reply.extraSendTo.id, reply.extraSendTo.text, `rx:${cmdId}`)
        if (reply.notifyMgmt) {
          const mgmt = await prisma.botConversation.findMany({ where: { kind: 'MGMT', status: 'ACTIVE' }, select: { id: true } })
          await enqueueMany(mgmt.filter((c) => c.id !== target).map((c) => ({ conversationId: c.id, kind: 'ALERT' as const, text: reply.notifyMgmt!, dedupeKey: `rm:${cmdId}` })))
        }
      } catch (e) {
        // 指令已经执行了、回复没能入队（例如加密回执时密钥不可用）：记 ERROR 并说明，别留下一行没有原因的「拒绝」
        console.error(`[bot] 指令「${def.name}」的回复入队失败`, (e as Error)?.message)
        await finish(cmdId, 'ERROR', 'REPLY_FAIL', `已执行但回复没发出：${(e as Error)?.message ?? ''}`)
        touched = true
        continue
      }
      touched = true
      if (reply.rejected) {
        await finish(cmdId, 'REJECTED', reply.rejected, reply.summary ?? null)
        continue
      }
      await finish(cmdId, 'OK', null, reply.summary ?? null)
      if (def.tier >= 2 && def.auditAction && !def.selfAudited) {
        // 不写 tenantId：渠道后台的操作日志按 tenant_id 列行，机器人指令是平台侧的操作，不该出现在渠道能看到的列表里；
        // 分站群里发的指令把分站 id 记在 diff 里（与后台「微信机器人」接口的审计同一做法）
        await writeAudit(null, {
          actorUserId: admin.siteUserId,
          actorKind: 'PLATFORM',
          action: def.auditAction,
          targetType: reply.auditTarget?.type ?? 'bot_command',
          targetId: reply.auditTarget?.id ?? String(cmdId),
          diff: {
            via: 'wechat-bot',
            commandId: cmdId,
            admin: admin.name,
            conversationId: convCtx.id,
            ...(convCtx.tenantId ? { tenantId: convCtx.tenantId } : {}),
            ...(reply.auditDiff && typeof reply.auditDiff === 'object' ? reply.auditDiff : {}),
          },
        }).catch((e) => console.error('[bot] 写审计失败', (e as Error)?.message))
      }
    } catch (e) {
      console.error('[bot] 处理入站消息失败', (e as Error)?.message)
    }
  }
  if (touched) kickSender()
}
