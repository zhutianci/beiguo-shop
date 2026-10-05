/**
 * 会话与推送设置类指令（T2，docs/微信机器人-设计.md §4、§7.3）：设为管理群、创建 / 绑定、解绑、推送暂停 / 恢复、订阅 / 退订、免打扰。
 * 身份已由 inbound 的三道闸确认（协议给的 wxid），这里只管业务规则。
 */
import type { Prisma } from '@prisma/client'
import { prisma } from '../../db'
import { getAdapter } from '../adapters'
import { cancelPendingForConversation } from '../outbox'
import { resolveSite, TENANT_STATUS_LABEL } from '../resolve-site'
import { CATEGORY_LABELS, LOCKED_CATEGORIES, MGMT_CATEGORIES, TENANT_CATEGORIES, type BotCategory } from '../types'
import { fmtMinuteOfDay, parsePositiveInt, parseQuietRange } from './parse'
import type { BotCommandDef, BotContext, BotReply } from './types'

function convLabel(c: { id: number; name: string | null }): string {
  return `「${c.name || '未命名群'}」（#${c.id}）`
}

function welcomeText(siteName: string, host: string, quiet: { from: number; to: number } | null): string {
  const q = quiet ? `${fmtMinuteOfDay(quiet.from)}–${fmtMinuteOfDay(quiet.to)} 只推紧急消息。` : ''
  return (
    `✅ 本群已绑定 ${siteName}（${host}）。\n` +
    `之后本站的注册、下单、付款、留言、开票、收据等动态会推送到这里，每天 0 点后发日报；${q}\n` +
    `机器人只发 bigolab.com 与本站域名的链接，从不索要密码和付款。`
  )
}

/** 群名快照：协议服务的群列表里找一下（找不到用已有快照） */
async function chatName(externalId: string, fallback: string | null): Promise<string | null> {
  try {
    const chats = await getAdapter().listChats()
    return chats.find((c) => c.externalId === externalId)?.name || fallback
  } catch {
    return fallback
  }
}

async function bindTenant(ctx: BotContext, externalId: string, siteInput: string, existingName: string | null): Promise<BotReply> {
  const site = await resolveSite(siteInput)
  if (!site.ok) return { text: `❌ ${site.error}`, summary: site.error }
  const existing = await prisma.botConversation.findUnique({ where: { adapter_externalId: { adapter: ctx.adapter, externalId } } })
  if (existing && existing.status !== 'REVOKED') {
    if (existing.kind === 'MGMT') return { text: '❌ 这是管理群，不能绑定分站', summary: 'MGMT' }
    if (existing.kind === 'TENANT' && existing.tenantId === site.tenantId) {
      return { text: `本群已经绑定 ${site.name}，无需重复绑定`, summary: 'already' }
    }
    if (existing.kind === 'TENANT') {
      const cur = existing.tenantId ? await prisma.tenant.findUnique({ where: { id: existing.tenantId }, select: { code: true } }) : null
      return { text: `❌ 本群已绑定其他分站（${cur?.code ?? '未知'}），请先发送「@贝果助手 解绑」再绑定`, summary: 'bound-other' }
    }
  }
  const name = await chatName(externalId, existingName)
  const quiet = ctx.config.quietDefault
  const data = {
    kind: 'TENANT',
    tenantId: site.tenantId,
    status: 'ACTIVE',
    allowT3: false,
    subs: undefined,
    quietFrom: quiet?.from ?? null,
    quietTo: quiet?.to ?? null,
    boundBy: ctx.admin.id,
    boundAt: ctx.now,
    name: name?.slice(0, 100) ?? null,
    failStreak: 0,
  }
  const conv = existing
    ? await prisma.botConversation.update({ where: { id: existing.id }, data: { ...data, subs: undefined } })
    : await prisma.botConversation.create({ data: { adapter: ctx.adapter, externalId, ...data } })
  const host = (() => {
    try {
      return new URL(site.origin).host
    } catch {
      return site.code
    }
  })()
  return {
    text: welcomeText(site.name, host, quiet),
    conversationId: conv.id,
    notifyMgmt: `🔗 群${convLabel(conv)}已绑定 ${site.name}（${site.code}，${TENANT_STATUS_LABEL[site.status] ?? site.status}）`,
    summary: `绑定 ${site.code}`,
    auditDiff: { conversationId: conv.id, tenantId: site.tenantId, code: site.code },
    auditTarget: { type: 'bot_conversation', id: String(conv.id) },
  }
}

export const createCmd: BotCommandDef<{ site: string }> = {
  name: '创建',
  aliases: ['绑定分站'],
  scopes: ['UNBOUND', 'TENANT'],
  tier: 2,
  auditAction: 'bot.conv.bind',
  parse: (args) => (args.length === 1 ? { ok: true, value: { site: args[0] } } : { ok: false, usage: '用法：@贝果助手 创建 <分站域名或渠道代码>，例如：创建 tibo.pw' }),
  run: (ctx, a) => bindTenant(ctx, ctx.conv.externalId, a.site, ctx.conv.name),
  help: { summary: '把本群绑定到一个分站', usage: '创建 <分站域名>', example: '创建 tibo.pw' },
}

/** 在管理群里替别的群绑定：回复留在管理群，欢迎语另发到被绑定的群 */
function relayBind(r: BotReply): BotReply {
  if (!r.conversationId) return r
  return { ...r, conversationId: undefined, text: `已绑定：${r.notifyMgmt ?? ''}`, notifyMgmt: undefined, extraSendTo: { id: r.conversationId, text: r.text } }
}

export const bindCmd: BotCommandDef<{ target: string; site: string }> = {
  name: '绑定',
  scopes: ['MGMT', 'DM', 'UNBOUND', 'TENANT'],
  tier: 2,
  auditAction: 'bot.conv.bind',
  parse: (args) =>
    args.length === 1
      ? { ok: true, value: { target: '', site: args[0] } }
      : args.length === 2
        ? { ok: true, value: { target: args[0], site: args[1] } }
        : { ok: false, usage: '用法：在要绑定的群里发「绑定 <分站>」，或在管理群里发「绑定 <群编号或群名> <分站>」' },
  async run(ctx, a) {
    if (!a.target) {
      if (ctx.conv.kind === 'MGMT' || ctx.conv.kind === 'DM') return { text: '❌ 请在管理群里写明要绑定哪个群：绑定 <群编号或群名> <分站>', summary: 'no-target' }
      return bindTenant(ctx, ctx.conv.externalId, a.site, ctx.conv.name)
    }
    if (ctx.conv.kind !== 'MGMT' && ctx.conv.kind !== 'DM') return { text: '❌ 指定群的绑定只能在管理群里做', summary: 'scope' }
    // 群编号：已登记过的会话；群名：小号的群列表里恰好一个同名群
    const id = parsePositiveInt(a.target)
    if (id) {
      const c = await prisma.botConversation.findUnique({ where: { id } })
      if (!c || c.adapter !== ctx.adapter) return { text: `❌ 找不到群 #${id}`, summary: 'not-found' }
      const r = await bindTenant(ctx, c.externalId, a.site, c.name)
      return relayBind(r)
    }
    const chats = await getAdapter().listChats()
    const same = chats.filter((c) => c.name === a.target)
    if (same.length !== 1) return { text: same.length ? `❌ 有 ${same.length} 个同名群，请先在后台「微信机器人 → 会话」里选群绑定` : `❌ 小号的群列表里没有「${a.target}」`, summary: 'name' }
    const r = await bindTenant(ctx, same[0].externalId, a.site, same[0].name)
    return relayBind(r)
  },
  help: { summary: '在管理群里替某个群绑定分站', usage: '绑定 <群编号或群名> <分站>', example: '绑定 7 tibo.pw' },
}

export const setMgmtCmd: BotCommandDef<null> = {
  name: '设为管理群',
  aliases: ['设为主站群'],
  scopes: ['UNBOUND'],
  tier: 2,
  auditAction: 'bot.conv.mgmt',
  parse: (args) => (args.length ? { ok: false, usage: '用法：在新建的管理群里发「@贝果助手 设为管理群」' } : { ok: true, value: null }),
  async run(ctx) {
    if (!ctx.conv.isGroup) return { text: '❌ 只能在群里设置', summary: 'not-group' }
    const existing = await prisma.botConversation.findUnique({ where: { adapter_externalId: { adapter: ctx.adapter, externalId: ctx.conv.externalId } } })
    if (existing && existing.status !== 'REVOKED') return { text: '本群已经登记过了', summary: 'exists' }
    // 允许提卡、补货（T3）默认只开第一个管理群，其余到后台勾选
    const hasT3 = await prisma.botConversation.count({ where: { kind: 'MGMT', status: { not: 'REVOKED' }, allowT3: true } })
    const name = await chatName(ctx.conv.externalId, ctx.conv.name)
    const data = { kind: 'MGMT', tenantId: null, status: 'ACTIVE', allowT3: hasT3 === 0, quietFrom: null, quietTo: null, boundBy: ctx.admin.id, boundAt: ctx.now, name: name?.slice(0, 100) ?? null, failStreak: 0 }
    const conv = existing
      ? await prisma.botConversation.update({ where: { id: existing.id }, data })
      : await prisma.botConversation.create({ data: { adapter: ctx.adapter, externalId: ctx.conv.externalId, ...data } })
    return {
      text: `✅ 本群已设为主站管理群（#${conv.id}）。主站动态、渠道告警、每日日报会推到这里${conv.allowT3 ? '，可以在这里提卡、补货' : '；要在这里提卡、补货请到后台勾选'}。发送「@贝果助手 帮助」查看指令。`,
      conversationId: conv.id,
      summary: `设为管理群 #${conv.id}`,
      auditDiff: { conversationId: conv.id, allowT3: conv.allowT3 },
      auditTarget: { type: 'bot_conversation', id: String(conv.id) },
    }
  },
  help: { summary: '把本群设为主站管理群', usage: '设为管理群' },
}

/** 目标会话：TENANT 里只能是本群；MGMT / DM 里给群编号 */
async function targetConvs(ctx: BotContext, arg: string | undefined, allowAll: boolean) {
  if (ctx.conv.kind === 'TENANT') {
    if (arg) return { error: '分站群里只能设置本群，不用写群编号' }
    return { list: await prisma.botConversation.findMany({ where: { id: ctx.conv.id! } }) }
  }
  if (!arg) return { error: '请写群编号（发送「@贝果助手 群列表」查看）' }
  if (allowAll && arg === '全部') return { list: await prisma.botConversation.findMany({ where: { kind: 'TENANT', status: { in: ['ACTIVE', 'PAUSED'] } } }) }
  const id = parsePositiveInt(arg)
  if (!id) return { error: '群编号格式不对' }
  const c = await prisma.botConversation.findUnique({ where: { id } })
  if (!c || c.adapter !== ctx.adapter || c.status === 'REVOKED') return { error: `找不到群 #${id}` }
  return { list: [c] }
}

export const unbindCmd: BotCommandDef<{ target?: string }> = {
  name: '解绑',
  scopes: ['TENANT', 'MGMT', 'DM'],
  tier: 2,
  auditAction: 'bot.conv.unbind',
  parse: (args) => (args.length <= 1 ? { ok: true, value: { target: args[0] } } : { ok: false, usage: '用法：分站群里发「解绑」；管理群里发「解绑 <群编号>」' }),
  async run(ctx, a) {
    const t = await targetConvs(ctx, a.target, false)
    if ('error' in t) return { text: `❌ ${t.error}`, summary: 'target' }
    const c = t.list[0]
    if (!c) return { text: '❌ 找不到群', summary: 'target' }
    await prisma.botConversation.update({ where: { id: c.id }, data: { status: 'REVOKED' } })
    const cancelled = await cancelPendingForConversation(c.id)
    return {
      text: `已解绑群${convLabel(c)}${cancelled ? `，作废了 ${cancelled} 条未发出的消息` : ''}。`,
      notifyMgmt: ctx.conv.kind === 'TENANT' ? `🔕 群${convLabel(c)}已解绑（在分站群里操作）` : undefined,
      summary: `解绑 #${c.id}`,
      auditDiff: { conversationId: c.id, kind: c.kind, tenantId: c.tenantId, cancelled },
      auditTarget: { type: 'bot_conversation', id: String(c.id) },
    }
  },
  help: { summary: '解绑群（不再推送）', usage: '解绑 [群编号]' },
}

export const pushCmd: BotCommandDef<{ on: boolean; target?: string }> = {
  name: '推送',
  scopes: ['TENANT', 'MGMT', 'DM'],
  tier: 2,
  auditAction: 'bot.conv.push',
  parse: (args) => {
    const op = args[0]
    if ((op === '暂停' || op === '恢复') && args.length <= 2) return { ok: true, value: { on: op === '恢复', target: args[1] } }
    return { ok: false, usage: '用法：推送 暂停 [群编号/全部] 或 推送 恢复 [群编号/全部]' }
  },
  async run(ctx, a) {
    const t = await targetConvs(ctx, a.target, true)
    if ('error' in t) return { text: `❌ ${t.error}`, summary: 'target' }
    const ids = t.list.filter((c) => c.kind !== 'DM').map((c) => c.id)
    if (!ids.length) return { text: '没有可操作的群', summary: 'none' }
    await prisma.botConversation.updateMany({ where: { id: { in: ids } }, data: { status: a.on ? 'ACTIVE' : 'PAUSED', ...(a.on ? { failStreak: 0 } : {}) } })
    if (!a.on) for (const id of ids) await cancelPendingForConversation(id)
    const names = t.list.map(convLabel).join('、')
    return {
      text: `${a.on ? '▶️ 已恢复推送' : '⏸️ 已暂停推送'}：${names}`,
      notifyMgmt: !a.on && ctx.conv.kind === 'TENANT' ? `⏸️ 群${names}暂停了推送（在分站群里操作）` : undefined,
      summary: `${a.on ? '恢复' : '暂停'} ${ids.join(',')}`,
      auditDiff: { ids, on: a.on },
    }
  },
  help: { summary: '暂停 / 恢复推送', usage: '推送 暂停|恢复 [群编号/全部]', example: '推送 暂停 7' },
}

const CATEGORY_BY_LABEL = new Map<string, BotCategory>(Object.entries(CATEGORY_LABELS).map(([k, v]) => [v, k as BotCategory]))

function subsToggle(on: boolean): BotCommandDef<{ category: BotCategory; target?: string }> {
  return {
    name: on ? '订阅' : '退订',
    scopes: ['TENANT', 'MGMT', 'DM'],
    tier: 2,
    auditAction: on ? 'bot.conv.subscribe' : 'bot.conv.unsubscribe',
    parse: (args) => {
      const cat = args[0] ? CATEGORY_BY_LABEL.get(args[0]) : undefined
      if (!cat || args.length > 2) return { ok: false, usage: `用法：${on ? '订阅' : '退订'} <类别> [群编号]。类别：${Object.values(CATEGORY_LABELS).join('、')}` }
      return { ok: true, value: { category: cat, target: args[1] } }
    },
    async run(ctx, a) {
      const t = await targetConvs(ctx, a.target ?? (ctx.conv.kind === 'MGMT' && !a.target ? String(ctx.conv.id) : undefined), false)
      if ('error' in t) return { text: `❌ ${t.error}`, summary: 'target' }
      const c = t.list[0]
      const allowed = c.kind === 'TENANT' ? TENANT_CATEGORIES : MGMT_CATEGORIES
      if (!allowed.includes(a.category)) return { text: `❌ ${c.kind === 'TENANT' ? '分站群' : '管理群'}没有「${CATEGORY_LABELS[a.category]}」这个类别`, summary: 'category' }
      if (!on && LOCKED_CATEGORIES.has(a.category)) return { text: `❌「${CATEGORY_LABELS[a.category]}」类不能退订`, summary: 'locked' }
      const subs = { ...((c.subs && typeof c.subs === 'object' && !Array.isArray(c.subs) ? c.subs : {}) as Record<string, unknown>), [a.category]: on }
      await prisma.botConversation.update({ where: { id: c.id }, data: { subs: subs as Prisma.InputJsonObject } })
      return {
        text: `已${on ? '订阅' : '退订'}「${CATEGORY_LABELS[a.category]}」：群${convLabel(c)}`,
        notifyMgmt: !on && ctx.conv.kind === 'TENANT' ? `🔕 群${convLabel(c)}退订了「${CATEGORY_LABELS[a.category]}」` : undefined,
        summary: `${on ? '订阅' : '退订'} ${a.category} #${c.id}`,
        auditDiff: { conversationId: c.id, category: a.category, on },
      }
    },
    help: { summary: on ? '订阅一类动态' : '退订一类动态', usage: `${on ? '订阅' : '退订'} <类别> [群编号]`, example: `${on ? '订阅' : '退订'} 下单` },
  }
}

export const subscribeCmd = subsToggle(true)
export const unsubscribeCmd = subsToggle(false)

export const quietCmd: BotCommandDef<{ target?: string; range: string }> = {
  name: '免打扰',
  scopes: ['TENANT', 'MGMT', 'DM'],
  tier: 2,
  auditAction: 'bot.conv.quiet',
  parse: (args) =>
    args.length === 1 ? { ok: true, value: { range: args[0] } } : args.length === 2 ? { ok: true, value: { target: args[0], range: args[1] } } : { ok: false, usage: '用法：免打扰 [群编号] 23-8，或 免打扰 [群编号] 关' },
  async run(ctx, a) {
    const t = await targetConvs(ctx, a.target ?? (ctx.conv.kind === 'MGMT' ? String(ctx.conv.id) : undefined), false)
    if ('error' in t) return { text: `❌ ${t.error}`, summary: 'target' }
    const c = t.list[0]
    // 路由只对分站群套免打扰（§5.6）：管理群的告警、提卡回执要及时到，设了也不生效，干脆不让设
    if (c.kind !== 'TENANT') return { text: '❌ 只有分站群能设免打扰；管理群的消息都要及时送达', summary: 'not-tenant' }
    const r = parseQuietRange(a.range)
    if (r === 'bad') return { text: '❌ 时间段格式不对，例如：免打扰 23-8', summary: 'range' }
    const data = r === 'off' ? { quietFrom: null, quietTo: null } : { quietFrom: r.from, quietTo: r.to }
    await prisma.botConversation.update({ where: { id: c.id }, data })
    return {
      text: r === 'off' ? `已关闭免打扰：群${convLabel(c)}` : `已设置免打扰 ${fmtMinuteOfDay(r.from)}–${fmtMinuteOfDay(r.to)}（紧急消息与日报不受影响）：群${convLabel(c)}`,
      summary: `免打扰 #${c.id}`,
      auditDiff: { conversationId: c.id, ...data },
    }
  },
  help: { summary: '设置分站群的免打扰时段（管理群里要写群编号）', usage: '免打扰 [群编号] <起-止|关>', example: '免打扰 23-8' },
}
