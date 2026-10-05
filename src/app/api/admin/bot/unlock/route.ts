export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { prisma } from '@/lib/db'
import { notify } from '@/lib/notify'
import { BotConfigConflict, readBotConfig, updateBotConfig, type BotConfig } from '@/lib/bot/config'
import { enqueueMany } from '@/lib/bot/outbox'
import { bjMinute } from '@/lib/bot/render'
import { kickSender } from '@/lib/bot/sender'
import { auditSoft, auditStrict, currentActor, readBody } from '@/app/api/admin/bot/_lib/common'
import type { LockResultDTO } from '@/app/admin/bot/types'

/** 锁定状态在「读」与「写」之间变了（有人又锁了一次 / 别处已经解锁）：不能把别人刚加的锁顺手解掉 */
class LockChanged extends Error {}

const TARGET = { type: 'bot', id: 'config' }

/** 管理群里留一条知会；入队失败只记日志，不影响已经生效的解锁 */
async function noticeMgmt(text: string, dedupeKey: string, now: Date): Promise<void> {
  try {
    const mgmt = await prisma.botConversation.findMany({ where: { kind: 'MGMT', status: 'ACTIVE' }, select: { id: true } })
    if (!mgmt.length) return
    await enqueueMany(mgmt.map((m) => ({ conversationId: m.id, kind: 'ALERT' as const, text, dedupeKey })), now)
    kickSender()
  } catch (e) {
    console.error('[bot-admin] 解锁知会入队失败', (e as Error)?.message)
  }
}

/**
 * 解锁（docs/微信机器人-设计.md §10）：**只能在后台**。没有口令之后，能以管理员身份在群里发消息的「人」
 * （盗号者、被动了手脚的协议服务）同样能发「解锁」；后台登录是独立于微信的另一条认证。
 *
 * 【顺序：先写审计、再改配置】解锁必须留痕：auditStrict 写不进去就直接拒绝，配置一个字节都不动（fail closed）。
 * 审计写成功之后才改配置；改配置失败（锁定状态变了、数据库异常）时补一行 result=ERROR 的审计说明没解成（尽力而为）。
 * 这样「解锁生效了却没有审计」不可能出现；反过来「有一行解锁审计但没解成」只会出现在改配置失败时，并且后面跟着 ERROR 行。
 * 不取反过来的顺序（先解锁、后补审计、审计失败再锁回去）：两步之间有一段已经解锁的窗口，而且「锁回去」本身也可能失败。
 *
 * 【只解自己看到的那次锁定】body 可带页面上显示的 lockedAt：与库里的不一致（期间有人又锁了一次）→ 409，让站长刷新核对；
 * 写入时（updateBotConfig 的条件更新里）再核对一次锁定时间没变，撞上并发写就重读重试，锁定时间变了就放弃。
 * 解锁后抄送企业微信（bot.sensitive），管理群里留一条。本来就没锁 → already=true，不写审计。
 */
export async function POST(request: NextRequest) {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const body = (await readBody(request)) ?? {}
    const expectLockedAt = typeof body.lockedAt === 'string' || body.lockedAt === null ? (body.lockedAt as string | null) : undefined
    const cur = await readBotConfig({ fresh: true })
    if (!cur.ok) return error(`机器人配置读取失败（${cur.reason}），不能解锁；请先排查 settings.bot_config`, 500)
    const was = cur.config
    if (!was.locked) {
      const dto: LockResultDTO = { locked: false, already: true, lockedAt: null, lockedBy: null }
      return success(dto, '机器人本来就没有锁定')
    }
    if (expectLockedAt !== undefined && expectLockedAt !== was.lockedAt) {
      return error('锁定状态刚刚变了（期间又有人锁定了一次），请刷新页面、核对锁定人与时间后再解锁', 409)
    }

    const actor = await currentActor()
    const diff = { lockedAt: was.lockedAt, lockedBy: was.lockedBy, version: was.version }
    try {
      await auditStrict(request, actor, 'bot.admin.unlock', TARGET, diff)
    } catch (e) {
      console.error('[bot-admin] 解锁审计写入失败，没有解锁', (e as Error)?.message)
      return error('写审计失败，没有解锁（解锁必须留下审计记录），请稍后重试', 500)
    }

    let next: BotConfig | null = null
    try {
      for (let i = 0; i < 3 && !next; i++) {
        try {
          next = await updateBotConfig((c) => {
            if (!c.locked || c.lockedAt !== was.lockedAt) throw new LockChanged()
            return { ...c, locked: false, lockedAt: null, lockedBy: null }
          })
        } catch (e) {
          if (!(e instanceof BotConfigConflict) || i === 2) throw e
        }
      }
      if (!next) throw new Error('写入解锁状态失败')
    } catch (e) {
      const changed = e instanceof LockChanged || e instanceof BotConfigConflict
      await auditSoft(request, actor, 'bot.admin.unlock', TARGET, diff, {
        result: 'ERROR',
        reason: changed ? '锁定状态在解锁过程中变了，没有解锁' : `改配置失败：${(e as Error)?.message || '未知原因'}`.slice(0, 200),
      })
      if (changed) return error('锁定状态刚刚变了（有人又锁定了一次，或配置被别处修改），没有解锁；请刷新后核对再试', 409)
      throw e
    }

    const now = new Date()
    const lockedNote = `${was.lockedBy || '—'}${was.lockedAt ? `，${bjMinute(new Date(was.lockedAt))}` : ''}`
    notify(
      'bot.sensitive',
      [
        { label: '操作', value: '机器人已解锁（提卡、补货与改设置恢复可用）' },
        { label: '操作人', value: actor.label },
        { label: '原锁定', value: lockedNote },
      ],
      { link: '/admin/bot', linkText: '前往后台' }
    )
    await noticeMgmt(`🔓 机器人已在后台解锁（${actor.label}）：提卡、补货与改设置的指令恢复可用。原锁定：${lockedNote}`, `unlock:${now.getTime()}`, now)
    const dto: LockResultDTO = { locked: false, already: false, lockedAt: null, lockedBy: null }
    return success(dto, '已解锁')
  } catch (e) {
    console.error('[bot-admin] 解锁失败', e)
    return error('解锁失败，请重试', 500)
  }
}
