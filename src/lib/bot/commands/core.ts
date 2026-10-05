/**
 * 基础指令：状态、群列表、锁定（docs/微信机器人-设计.md §7.3、§10）。「帮助」在 index.ts（要读注册表）。
 */
import { prisma } from '../../db'
import { notify } from '../../notify'
import { updateBotConfig } from '../config'
import { bjDayStart } from '../../marketing/time'
import { bjMinute } from '../render'
import { readBotState } from '../state'
import { CATEGORY_LABELS, MGMT_CATEGORIES, TENANT_CATEGORIES } from '../types'
import { isSubscribed } from '../events/catalog'
import { paymentMonitorLastForward } from '../data/monitor'
import { fmtMinuteOfDay } from './parse'
import { noArgs, type BotCommandDef } from './types'

const KIND_LABEL: Record<string, string> = { MGMT: '管理群', TENANT: '分站群', DM: '私聊' }
const STATUS_LABEL: Record<string, string> = { ACTIVE: '推送中', PAUSED: '已暂停', UNREACHABLE: '发不出去', REVOKED: '已解绑' }

export const statusCmd: BotCommandDef<null> = {
  name: '状态',
  aliases: ['status'],
  scopes: ['MGMT', 'DM', 'TENANT'],
  tier: 0,
  parse: noArgs('用法：状态'),
  async run(ctx) {
    if (ctx.conv.kind === 'TENANT' && ctx.conv.id) {
      const c = await prisma.botConversation.findUnique({ where: { id: ctx.conv.id } })
      const t = c?.tenantId ? await prisma.tenant.findUnique({ where: { id: c.tenantId }, select: { code: true, name: true, status: true } }) : null
      const subs = TENANT_CATEGORIES.map((k) => `${CATEGORY_LABELS[k]}${isSubscribed(c?.subs, k) ? '✓' : '✗'}`).join(' ')
      const quiet = c?.quietFrom != null && c?.quietTo != null ? `${fmtMinuteOfDay(c.quietFrom)}–${fmtMinuteOfDay(c.quietTo)}` : '未设置'
      return {
        text: `📌 本群状态（#${c?.id}）\n绑定分站：${t ? `${t.name}（${t.code}）` : '—'}\n推送：${STATUS_LABEL[c?.status ?? ''] ?? c?.status}\n订阅：${subs}\n免打扰：${quiet}`,
        summary: 'status',
      }
    }
    const st = await readBotState()
    const dayStart = bjDayStart(ctx.now)
    const [pending, sentToday, failedToday, lastReport, lastForward] = await Promise.all([
      prisma.botOutbox.count({ where: { status: { in: ['PENDING', 'SENDING'] } } }),
      prisma.botOutbox.count({ where: { status: 'SENT', sentAt: { gte: dayStart } } }),
      prisma.botOutbox.count({ where: { status: 'FAILED', updatedAt: { gte: dayStart } } }),
      prisma.botOutbox.findFirst({ where: { kind: 'REPORT', status: 'SENT' }, orderBy: { sentAt: 'desc' }, select: { sentAt: true } }),
      paymentMonitorLastForward({ tenantId: null }),
    ])
    const fwdAgo = lastForward ? Math.max(0, Math.round((ctx.now.getTime() - lastForward.getTime()) / 60_000)) : null
    const convs = await prisma.botConversation.groupBy({ by: ['kind', 'status'], _count: { _all: true } })
    const convLine = convs
      .filter((g) => g.status !== 'REVOKED')
      .map((g) => `${KIND_LABEL[g.kind] ?? g.kind}${STATUS_LABEL[g.status] ?? g.status} ${g._count._all}`)
      .join('、')
    return {
      text:
        `📌 机器人状态\n` +
        `小号：${st.nickname || '—'}（${st.online ? '在线' : '离线'}${st.checkedAt ? `，${bjMinute(new Date(st.checkedAt))} 检查` : ''}）\n` +
        `锁定：${ctx.config.locked ? `已锁定（${ctx.config.lockedBy ?? ''}）` : '未锁定'}\n` +
        `待发 ${pending} 条 · 今日已发 ${sentToday} 条 · 今日失败 ${failedToday} 条\n` +
        `会话：${convLine || '还没有'}\n` +
        `上次日报：${lastReport?.sentAt ? bjMinute(lastReport.sentAt) : '—'}\n` +
        `收款监控：${lastForward ? `最近一次转发 ${bjMinute(lastForward)}（${fwdAgo! < 60 ? `${fwdAgo} 分钟前` : `${Math.floor(fwdAgo! / 60)} 小时前`}）` : '从未收到转发'}`,
      summary: 'status',
    }
  },
  help: { summary: '查看机器人与本群状态', usage: '状态' },
}

export const listCmd: BotCommandDef<null> = {
  name: '群列表',
  aliases: ['绑定列表'],
  scopes: ['MGMT', 'DM'],
  tier: 1,
  parse: noArgs('用法：群列表'),
  async run() {
    const convs = await prisma.botConversation.findMany({ where: { status: { not: 'REVOKED' }, kind: { in: ['MGMT', 'TENANT'] } }, orderBy: { id: 'asc' }, take: 60 })
    if (!convs.length) return { text: '还没有登记任何群。在群里 @贝果助手 发「设为管理群」或「创建 <分站>」即可登记。', summary: 'empty' }
    const tenantIds = Array.from(new Set(convs.map((c) => c.tenantId).filter((x): x is number => !!x)))
    const tenants = tenantIds.length ? await prisma.tenant.findMany({ where: { id: { in: tenantIds } }, select: { id: true, code: true } }) : []
    const code = new Map(tenants.map((t) => [t.id, t.code]))
    const lines = convs.map(
      (c) =>
        `#${c.id} ${c.name || '未命名'}｜${KIND_LABEL[c.kind]}${c.tenantId ? `·${code.get(c.tenantId) ?? c.tenantId}` : ''}｜${STATUS_LABEL[c.status] ?? c.status}${c.kind === 'MGMT' && c.allowT3 ? '｜可提卡' : ''}｜${c.lastSentAt ? bjMinute(c.lastSentAt) : '未发过'}`
    )
    return { text: `📋 已登记的群（${convs.length}）\n${lines.join('\n')}`, summary: `list ${convs.length}` }
  },
  help: { summary: '列出所有已登记的群与编号', usage: '群列表' },
}

export const lockCmd: BotCommandDef<null> = {
  name: '锁定',
  aliases: ['紧急锁定'],
  scopes: ['MGMT', 'DM', 'TENANT'],
  tier: 2,
  allowWhenLocked: true,
  auditAction: 'bot.lock',
  parse: noArgs('用法：锁定'),
  async run(ctx) {
    const who = `${ctx.admin.name}（${KIND_LABEL[ctx.conv.kind ?? ''] ?? '群'}）`
    await updateBotConfig((c) => ({ ...c, locked: true, lockedAt: ctx.now.toISOString(), lockedBy: who }))
    // 作废所有未使用的补货链接
    const revoked = await prisma.botActionToken.updateMany({ where: { usedAt: null, revokedAt: null, expiresAt: { gt: ctx.now } }, data: { revokedAt: ctx.now } })
    notify('bot.sensitive', [
      { label: '操作', value: '机器人已锁定（提卡、补货、改设置全部暂停）' },
      { label: '操作人', value: who },
      { label: '作废的补货链接', value: String(revoked.count) },
      { label: '解锁', value: '只能在后台「微信机器人」解锁' },
    ], { link: '/admin/bot', linkText: '前往后台' })
    return {
      text: `🔒 机器人已锁定：提卡、补货与所有改设置的指令都暂停了，推送照常。解锁只能在后台「微信机器人」里操作。`,
      notifyMgmt: ctx.conv.kind !== 'MGMT' ? `🔒 机器人已被锁定（${who}）` : undefined,
      summary: 'locked',
      auditDiff: { revokedTokens: revoked.count },
    }
  },
  help: { summary: '紧急锁定：暂停提卡、补货与改设置（解锁只能在后台）', usage: '锁定' },
}

/** 管理群的订阅一览（状态里没有，单独给「订阅」不带参数时用不到，留给后台） */
export function mgmtSubsLine(subs: unknown): string {
  return MGMT_CATEGORIES.map((k) => `${CATEGORY_LABELS[k]}${isSubscribed(subs, k) ? '✓' : '✗'}`).join(' ')
}
