export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { Prisma, type BotConversation } from '@prisma/client'
import { adminGuard } from '@/lib/admin-guard'
import { success, error } from '@/lib/api'
import { prisma } from '@/lib/db'
import { adapterName } from '@/lib/bot/adapters'
import { botConfigForDelivery } from '@/lib/bot/config'
import { resolveSite } from '@/lib/bot/resolve-site'
import { auditSoft, botAdminIdOfUser, cleanText, currentActor, readBody } from '@/app/api/admin/bot/_lib/common'
import { sortConvs, toConvDTO, toConvDTOs } from '@/app/api/admin/bot/_lib/dto'
import type { ConvListDTO, SiteResolveDTO } from '@/app/admin/bot/types'

const KIND_TEXT: Record<string, string> = { MGMT: '主站管理群', TENANT: '分站群', DM: '私聊' }

/**
 * 会话列表（docs/微信机器人-设计.md §14「会话」）：编号、群名、类型、分站、状态、订阅、免打扰、允许提卡补货、最后送达。
 * 默认不含已解绑（REVOKED）的；?all=1 带上；?kind=MGMT|TENANT|DM 过滤。订阅已按事件目录补好默认值。
 */
export async function GET(request: NextRequest) {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const sp = request.nextUrl.searchParams
    const kind = sp.get('kind')
    const where: Prisma.BotConversationWhereInput = {
      ...(sp.get('all') === '1' ? {} : { status: { not: 'REVOKED' } }),
      ...(kind === 'MGMT' || kind === 'TENANT' || kind === 'DM' ? { kind } : {}),
    }
    const [rows, groups] = await Promise.all([
      prisma.botConversation.findMany({ where, orderBy: { id: 'asc' }, take: 500 }),
      prisma.botConversation.groupBy({ by: ['kind', 'status'], _count: { _all: true } }),
    ])
    const summary = { mgmt: 0, tenant: 0, dm: 0, paused: 0, unreachable: 0, revoked: 0 }
    groups.forEach((g) => {
      const n = g._count._all
      if (g.status === 'REVOKED') {
        summary.revoked += n
        return
      }
      if (g.kind === 'MGMT') summary.mgmt += n
      else if (g.kind === 'TENANT') summary.tenant += n
      else if (g.kind === 'DM') summary.dm += n
      if (g.status === 'PAUSED') summary.paused += n
      if (g.status === 'UNREACHABLE') summary.unreachable += n
    })
    const dto: ConvListDTO = { currentAdapter: adapterName(), list: sortConvs(await toConvDTOs(rows)), summary }
    return success(dto)
  } catch (e) {
    console.error('[bot-admin] 会话列表失败', e)
    return error('读取会话列表失败', 500)
  }
}

/**
 * 新建绑定（后台选群，docs/微信机器人-设计.md §4.2）：
 *  body { externalId, name?, kind: 'MGMT' | 'TENANT', site?, dryRun? }
 *  · TENANT：site 是分站域名 / 渠道代码，经 resolveSite 解析（与群里「创建 <分站>」同一个函数）；dryRun=true 只解析、不写库，页面用它先给站长看「将绑定到哪个分站」；
 *  · MGMT：设为主站管理群；「允许提卡补货」默认只开第一个管理群，其余到会话列表里勾选（§4.1）；
 *  · 字段规则与群里指令一致：分站群套用「设置」里的默认免打扰，subs 留空（= 目录默认），bound_by 记当前账号对应的机器人管理员（没有则空）；
 *  · 同一个群已登记（非 REVOKED）→ 409，要改绑必须先解绑；REVOKED 的行重新启用并重置订阅。
 * 不会自动往群里发欢迎语——需要核对时用概览页的「测试消息」。
 */
export async function POST(request: NextRequest) {
  const deny = await adminGuard()
  if (deny) return deny
  try {
    const body = await readBody(request)
    if (!body) return error('请求体不是 JSON 对象')
    const kind = body.kind === 'MGMT' || body.kind === 'TENANT' ? body.kind : null
    if (!kind) return error('类型必须是「主站管理群」或「分站群」')
    const adapter = adapterName()
    const externalId = String(body.externalId ?? '').trim()
    if (!/^[A-Za-z0-9_@.:-]{1,191}$/.test(externalId)) return error('群 ID 格式不对（应形如 12345678@chatroom）')
    if (adapter === 'wxpad' && !externalId.endsWith('@chatroom')) return error('群 ID 必须以 @chatroom 结尾（私聊会话由管理员认领时自动登记）')
    const name = cleanText(body.name, 100) || null

    let site: Extract<Awaited<ReturnType<typeof resolveSite>>, { ok: true }> | null = null
    if (kind === 'TENANT') {
      const r = await resolveSite(String(body.site ?? ''))
      if (!r.ok) return error(r.error)
      site = r
      if (body.dryRun === true) {
        const dto: SiteResolveDTO = { site: { tenantId: r.tenantId, code: r.code, name: r.name, status: r.status, origin: r.origin } }
        return success(dto)
      }
    } else if (body.dryRun === true) {
      return success({ site: null })
    }

    const existing = await prisma.botConversation.findUnique({ where: { adapter_externalId: { adapter, externalId } } })
    if (existing && existing.status !== 'REVOKED') {
      return error(`这个群已经登记过了（#${existing.id}，${KIND_TEXT[existing.kind] ?? existing.kind}）。要改绑请先解绑，再重新绑定`, 409)
    }

    const actor = await currentActor()
    const now = new Date()
    const quiet = kind === 'TENANT' ? (await botConfigForDelivery()).quietDefault : null
    const hasT3 = kind === 'MGMT' ? await prisma.botConversation.count({ where: { kind: 'MGMT', status: { not: 'REVOKED' }, allowT3: true } }) : 1
    const data = {
      kind,
      tenantId: site ? site.tenantId : null,
      status: 'ACTIVE',
      allowT3: kind === 'MGMT' && hasT3 === 0,
      quietFrom: quiet?.from ?? null,
      quietTo: quiet?.to ?? null,
      boundBy: await botAdminIdOfUser(actor.userId),
      boundAt: now,
      name,
      failStreak: 0,
    }
    let row: BotConversation
    try {
      row = existing
        ? await prisma.botConversation.update({ where: { id: existing.id }, data: { ...data, subs: Prisma.DbNull } })
        : await prisma.botConversation.create({ data: { adapter, externalId, ...data } })
    } catch (e) {
      if ((e as { code?: string })?.code === 'P2002') return error('这个群刚刚被登记了，请刷新后查看', 409)
      throw e
    }
    await auditSoft(request, actor, 'bot.admin.conv_create', { type: 'bot_conversation', id: String(row.id) }, {
      conversationId: row.id,
      kind,
      externalId,
      name,
      tenantId: site?.tenantId ?? null,
      siteCode: site?.code ?? null,
      allowT3: row.allowT3,
      reactivated: !!existing,
    })
    return success({ conversation: await toConvDTO(row), reactivated: !!existing }, kind === 'TENANT' ? `已绑定到 ${site?.name}（${site?.code}）` : '已设为主站管理群')
  } catch (e) {
    console.error('[bot-admin] 新建绑定失败', e)
    return error('新建绑定失败', 500)
  }
}
