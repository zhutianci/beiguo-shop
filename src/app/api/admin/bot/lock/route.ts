export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { prisma } from '@/lib/db'
import { notify } from '@/lib/notify'
import { BotConfigConflict, readBotConfig, updateBotConfig, type BotConfig } from '@/lib/bot/config'
import { enqueueMany } from '@/lib/bot/outbox'
import { kickSender } from '@/lib/bot/sender'
import { auditSoft, currentActor } from '@/app/api/admin/bot/_lib/common'
import type { LockResultDTO } from '@/app/admin/bot/types'

/** 并发下别的请求（或群里的「锁定」）先锁上了：放弃这次写入，不再把版本号白白 +1 */
class AlreadyLocked extends Error {}

const TARGET = { type: 'bot', id: 'config' }

/** 作废全部还没用的补货链接（与群里「锁定」同一个条件） */
async function revokeRestockTokens(now: Date): Promise<number> {
  const r = await prisma.botActionToken.updateMany({ where: { usedAt: null, revokedAt: null, expiresAt: { gt: now } }, data: { revokedAt: now } })
  return r.count
}

/** 管理群里留一条知会（群外锁定时 lockCmd 也这么做）；入队失败只记日志，不影响已经生效的锁定 */
async function noticeMgmt(text: string, dedupeKey: string, now: Date): Promise<void> {
  try {
    const mgmt = await prisma.botConversation.findMany({ where: { kind: 'MGMT', status: 'ACTIVE' }, select: { id: true } })
    if (!mgmt.length) return
    await enqueueMany(mgmt.map((m) => ({ conversationId: m.id, kind: 'ALERT' as const, text, dedupeKey })), now)
    kickSender()
  } catch (e) {
    console.error('[bot-admin] 锁定知会入队失败', (e as Error)?.message)
  }
}

/**
 * 后台锁定（docs/微信机器人-设计.md §10）。效果与群里「@贝果助手 锁定」（lib/bot/commands/core.ts 的 lockCmd）相同：
 *  · bot_config.locked = true，lockedBy 记「后台（昵称）」；T2 / T3 指令全部拒绝（「锁定」除外），T0 / T1 与推送照常；
 *  · 作废全部还没用的补货链接（bot_action_tokens）；
 *  · 抄送企业微信（bot.sensitive，独立通道、不经小号），管理群里也留一条（同 lockCmd 在群外锁定时的 notifyMgmt）。
 * 已经锁定 → already=true，不重复写配置、不重复作废与抄送。
 *
 * 锁定是「往安全方向」的操作：审计在生效之后补写（auditSoft），写不进去也不把已经生效的锁定报成失败。
 * 补货链接**先于**写配置作废：它与配置无关，万一下面写配置失败，至少补货链接已经失效（报错里写明，让站长重试）。
 * 写配置撞上并发修改（BotConfigConflict）就重读重试——锁定不依赖页面看到的是哪个版本，结果只有「锁上」一种。
 * 配置读不出来时写不了锁定状态（updateBotConfig 拒绝在坏配置上改），但补货链接照样作废；读失败期间 T2 / T3 本来就一律拒绝（lib/bot/config.ts）。
 */
export async function POST(request: NextRequest) {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const actor = await currentActor()
    const now = new Date()
    const cur = await readBotConfig({ fresh: true })
    if (!cur.ok) {
      const revoked = await revokeRestockTokens(now)
      await auditSoft(request, actor, 'bot.admin.lock', TARGET, { revokedTokens: revoked }, { result: 'ERROR', reason: `配置读取失败：${cur.reason}`.slice(0, 200) })
      return error(
        `机器人配置读取失败（${cur.reason}），没能写入锁定状态；配置读不出来期间提卡、补货与改设置本来就一律拒绝。已作废 ${revoked} 个未使用的补货链接，请尽快排查 settings.bot_config`,
        500
      )
    }
    if (cur.config.locked) {
      const dto: LockResultDTO = { locked: true, already: true, lockedAt: cur.config.lockedAt, lockedBy: cur.config.lockedBy }
      return success(dto, '机器人已经是锁定状态')
    }

    const revoked = await revokeRestockTokens(now)
    let next: BotConfig | null = null
    let raced = false
    try {
      for (let i = 0; i < 3 && !next && !raced; i++) {
        try {
          next = await updateBotConfig((c) => {
            if (c.locked) throw new AlreadyLocked()
            return { ...c, locked: true, lockedAt: now.toISOString(), lockedBy: actor.label }
          })
        } catch (e) {
          if (e instanceof AlreadyLocked) raced = true
          else if (!(e instanceof BotConfigConflict) || i === 2) throw e
        }
      }
    } catch (e) {
      console.error('[bot-admin] 写入锁定状态失败', e)
      await auditSoft(request, actor, 'bot.admin.lock', TARGET, { revokedTokens: revoked }, { result: 'ERROR', reason: `写入锁定状态失败：${(e as Error)?.message || '未知原因'}`.slice(0, 200) })
      return error(`没能写入锁定状态（已作废 ${revoked} 个未使用的补货链接），请重试；紧急时也可以在管理群里发「@贝果助手 锁定」`, 500)
    }
    if (raced || !next) {
      // 并发下别处（群里或另一个后台页面）刚锁上：那边已经抄送过，这里不重复
      const fresh = await readBotConfig({ fresh: true })
      const c = fresh.ok ? fresh.config : null
      const dto: LockResultDTO = { locked: true, already: true, lockedAt: c?.lockedAt ?? null, lockedBy: c?.lockedBy ?? null, revokedTokens: revoked }
      return success(dto, '机器人刚刚已被锁定')
    }

    notify(
      'bot.sensitive',
      [
        { label: '操作', value: '机器人已锁定（提卡、补货、改设置全部暂停）' },
        { label: '操作人', value: actor.label },
        { label: '作废的补货链接', value: String(revoked) },
        { label: '解锁', value: '只能在后台「微信机器人」解锁' },
      ],
      { link: '/admin/bot', linkText: '前往后台' }
    )
    await noticeMgmt(
      `🔒 机器人已被锁定（${actor.label}）：提卡、补货与所有改设置的指令都暂停了，推送照常。解锁只能在后台「微信机器人」里操作。`,
      `lock:${now.getTime()}`,
      now
    )
    await auditSoft(request, actor, 'bot.admin.lock', TARGET, { version: next.version, lockedAt: next.lockedAt, revokedTokens: revoked })
    const dto: LockResultDTO = { locked: true, already: false, lockedAt: next.lockedAt, lockedBy: next.lockedBy, revokedTokens: revoked }
    return success(dto, revoked ? `已锁定，作废了 ${revoked} 个未使用的补货链接` : '已锁定')
  } catch (e) {
    console.error('[bot-admin] 锁定失败', e)
    return error('锁定失败，请重试；紧急时也可以在管理群里发「@贝果助手 锁定」', 500)
  }
}
