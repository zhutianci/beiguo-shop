export const dynamic = 'force-dynamic'

import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { prisma } from '@/lib/db'
import { getAdapter } from '@/lib/bot/adapters'
import { loadSites } from '@/app/api/admin/bot/_lib/dto'
import type { ChatDTO, ChatListDTO, ConvKind, ConvStatus, LiveStatusDTO } from '@/app/admin/bot/types'

/**
 * 协议服务给出的群列表（后台「新建绑定」从这里选群，docs/微信机器人-设计.md §4.2）。
 * 每个群标出它是否已经登记（登记过的不能再选，要先解绑）。
 * 注意：wxpad 的群列表来自通讯录——没有「保存到通讯录」的群不会出现，页面另给「手动填写群 ID」的入口。
 * 列表为空时附上协议服务当前状态，方便判断是「小号没有群」还是「连不上 / 掉线了」。
 */
export async function GET() {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const adapter = getAdapter()
    const raw = (await adapter.listChats().catch(() => [])).slice(0, 500)
    const reg = raw.length
      ? await prisma.botConversation.findMany({
          where: { adapter: adapter.name, externalId: { in: raw.map((c) => c.externalId) } },
          select: { id: true, externalId: true, kind: true, status: true, tenantId: true },
        })
      : []
    const sites = await loadSites(reg.map((r) => r.tenantId))
    const byExt = new Map(reg.map((r) => [r.externalId, r]))
    const chats: ChatDTO[] = raw.map((c) => {
      const r = byExt.get(c.externalId)
      return {
        externalId: c.externalId,
        name: c.name,
        memberCount: typeof c.memberCount === 'number' ? c.memberCount : null,
        // 已解绑（REVOKED）的群可以重新绑定，不算「已登记」
        registered:
          r && r.status !== 'REVOKED'
            ? { id: r.id, kind: r.kind as ConvKind, status: r.status as ConvStatus, siteCode: r.tenantId ? sites.get(r.tenantId)?.code ?? null : null }
            : null,
      }
    })
    let status: LiveStatusDTO | null = null
    if (!chats.length) {
      const st = await adapter.status().catch(() => null)
      if (st) status = { reachable: st.reachable, online: st.online, detail: st.detail ?? null, botWxid: st.botWxid ?? null, nickname: st.nickname ?? null }
    }
    const dto: ChatListDTO = { adapter: adapter.name, chats, status }
    return success(dto)
  } catch (e) {
    console.error('[bot-admin] 读取群列表失败', e)
    return error('读取群列表失败', 500)
  }
}
