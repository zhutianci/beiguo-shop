export const dynamic = 'force-dynamic'

import { createHash, randomInt } from 'crypto'
import { NextRequest } from 'next/server'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { prisma } from '@/lib/db'
import { rateLimited } from '@/lib/news/rate-limit'
import { auditStrict, currentActor, parseId } from '@/app/api/admin/bot/_lib/common'
import type { ClaimCodeDTO } from '@/app/admin/bot/types'

/** 去掉容易混淆的 0 O 1 I L，剩 31 个字符；8 位 ≈ 40 位熵，10 分钟有效、只能用一次 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8
const TTL_MINUTES = 10

function genCode(): string {
  let s = ''
  for (let i = 0; i < CODE_LENGTH; i++) s += ALPHABET.charAt(randomInt(0, ALPHABET.length))
  return s
}

/** 与 lib/bot/inbound.ts 的 tryClaim 同一个算法：对大写明文取 SHA-256（hex） */
function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex')
}

/**
 * 生成认领码（docs/微信机器人-设计.md §7.1）：管理员用自己的微信**私聊小号**发「认领 <码>」，
 * 中枢把那条私聊的发送人 wxid 登记为这个管理员的微信身份（也可以给已有管理员再绑第二个微信、或停用后重新认领）。
 *
 * 【只存哈希】库里只有 SHA-256（bot_admins.claim_code_hash）和过期时间；明文只在**这一次响应**里出现，
 * 不写日志、不写审计（审计只记「谁给哪个管理员生成了认领码、几点过期」）。再次生成会覆盖上一个还没用的码。
 * 审计写不进去时不放行：撤销刚存的哈希，不把明文交出去。
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const id = parseId(params.id)
    if (!id) return error('管理员编号不对')
    if (rateLimited('botclaim:all', { windowMs: 60_000, max: 10 })) return error('操作太频繁，请 1 分钟后再试', 429)
    const admin = await prisma.botAdmin.findUnique({ where: { id } })
    if (!admin) return error('找不到这个管理员', 404)
    if (!admin.enabled) return error('这个管理员已停用，请先启用再生成认领码', 409)

    const now = new Date()
    const expiresAt = new Date(now.getTime() + TTL_MINUTES * 60_000)
    // 认领时是拿码去比对所有「有效码」的哈希，两个管理员的码相撞会认错人：几乎不可能，但这里几行代码就能杜绝
    let code = ''
    let hash = ''
    for (let i = 0; i < 5; i++) {
      code = genCode()
      hash = sha256(code)
      const clash = await prisma.botAdmin.findFirst({ where: { claimCodeHash: hash, claimExpiresAt: { gt: now }, id: { not: id } }, select: { id: true } })
      if (!clash) break
      code = ''
    }
    if (!code) return error('生成认领码失败，请重试', 500)

    await prisma.botAdmin.update({ where: { id }, data: { claimCodeHash: hash, claimExpiresAt: expiresAt } })
    const actor = await currentActor()
    try {
      await auditStrict(request, actor, 'bot.admin.claim_code', { type: 'bot_admin', id: String(id) }, { adminId: id, name: admin.name, expiresAt: expiresAt.toISOString() })
    } catch (e) {
      console.error('[bot-admin] 认领码审计写入失败，已撤销认领码', (e as Error)?.message)
      await prisma.botAdmin.updateMany({ where: { id, claimCodeHash: hash }, data: { claimCodeHash: null, claimExpiresAt: null } }).catch(() => {})
      return error('写审计失败，认领码已作废，请重试', 500)
    }
    const dto: ClaimCodeDTO = { code, expiresAt: expiresAt.toISOString(), ttlMinutes: TTL_MINUTES }
    const res = success(dto, `认领码已生成，${TTL_MINUTES} 分钟内有效，只能用一次`)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (e) {
    console.error('[bot-admin] 生成认领码失败', e)
    return error('生成认领码失败', 500)
  }
}
