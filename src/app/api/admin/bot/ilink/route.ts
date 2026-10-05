export const dynamic = 'force-dynamic'

import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { prisma } from '@/lib/db'
import { cardKeyConfigured } from '@/lib/cardkey'
import { adapterName, ilinkLoopSnapshot } from '@/lib/bot/adapters'
import { readBinding } from '@/lib/bot/adapters/ilink-store'
import { CONTEXT_TTL_MS } from '@/lib/bot/adapters/ilink-shared'
import { botEnabledByEnv } from '@/lib/bot/config'
import { DEFER_NO_CONTEXT } from '@/lib/bot/outbox'
import type { IlinkBindingDTO, IlinkOverviewDTO } from '@/app/admin/bot/types'

/**
 * 微信绑定（iLink，docs/微信机器人-设计.md 附录 E）的概况：每个绑定的状态、推送窗口还剩多久、收消息循环在不在跑、
 * 有多少消息因为窗口关着而搁置；外加新建绑定要选的管理员与分站。
 * bot_token / context_token / 对方的 ilink_user_id 都不出现在响应里。
 */
export async function GET() {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const now = Date.now()
    const [convs, admins, tenants, identities] = await Promise.all([
      prisma.botConversation.findMany({ where: { adapter: 'ilink', status: { not: 'REVOKED' } }, orderBy: { id: 'asc' }, take: 200 }),
      prisma.botAdmin.findMany({ orderBy: { id: 'asc' }, select: { id: true, name: true, enabled: true, maxTier: true } }),
      prisma.tenant.findMany({ where: { id: { not: 1 }, status: { in: ['ACTIVE', 'SUSPENDED', 'DRAFT'] } }, orderBy: { id: 'asc' }, select: { id: true, code: true, name: true, status: true } }),
      prisma.botAdminIdentity.findMany({ where: { adapter: 'ilink', enabled: true }, select: { adminId: true, wxid: true } }),
    ])
    const loops = new Map(ilinkLoopSnapshot().map((l) => [l.convId, l]))
    const adminName = new Map(admins.map((a) => [a.id, a.name]))
    const tenantCode = new Map(tenants.map((t) => [t.id, t.code]))
    const pendingRows = convs.length
      ? await prisma.botOutbox.groupBy({ by: ['conversationId', 'lastError'], where: { conversationId: { in: convs.map((c) => c.id) }, status: 'PENDING' }, _count: { _all: true } })
      : []
    const bindings: IlinkBindingDTO[] = []
    for (const c of convs) {
      const b = await readBinding(c.id)
      const ctxAt = b?.ctxAt ? Date.parse(b.ctxAt) : null
      const windowOpen = ctxAt !== null && now - ctxAt < CONTEXT_TTL_MS
      const idn = b ? identities.find((i) => i.wxid === b.userId) : undefined
      const loop = loops.get(c.id)
      const rows = pendingRows.filter((r) => r.conversationId === c.id)
      bindings.push({
        id: c.id,
        kind: c.kind === 'TENANT' ? 'TENANT' : 'MGMT',
        name: c.name,
        tenantId: c.tenantId,
        tenantCode: c.tenantId ? tenantCode.get(c.tenantId) ?? null : null,
        status: c.status,
        allowT3: c.allowT3,
        boundAt: c.boundAt ? c.boundAt.toISOString() : null,
        adminName: idn ? adminName.get(idn.adminId) ?? null : null,
        credsOk: !!b,
        stale: !!b?.staleAt,
        ctxAt: b?.ctxAt ?? null,
        windowOpen,
        windowEndsAt: ctxAt !== null ? new Date(ctxAt + CONTEXT_TTL_MS).toISOString() : null,
        lastInboundAt: b?.lastInboundAt ?? null,
        loop: loop ? { running: loop.running, lastOkAt: loop.lastOkAt ? new Date(loop.lastOkAt).toISOString() : null, lastError: loop.lastError } : null,
        pending: rows.reduce((n, r) => n + r._count._all, 0),
        deferred: rows.filter((r) => r.lastError === DEFER_NO_CONTEXT).reduce((n, r) => n + r._count._all, 0),
      })
    }
    const dto: IlinkOverviewDTO = {
      adapterIsIlink: adapterName() === 'ilink',
      botEnabled: botEnabledByEnv(),
      cardKeyConfigured: cardKeyConfigured(),
      bindings,
      admins,
      tenants,
    }
    return success(dto)
  } catch (e) {
    console.error('[bot-admin] 读取微信绑定失败', e)
    return error('读取微信绑定失败', 500)
  }
}
