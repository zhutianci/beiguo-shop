/**
 * 内容模块下放（docs/多渠道分销-内容模块下放.md）：AI学习 / AI圈大事记 / IP工具 的「超管授权」与「渠道上架」。
 *
 *  · listTenantModules(tenantId)                                  三个模块的授权、上架、前台是否生效
 *  · adminSetModuleGrant(tenantId, module, granted, adminId)      超管授权 / 收回（站长 10-10：默认不授权，逐个开）
 *  · setTenantModuleOn(tenantId, module, on, audit)               渠道上架 / 下架（只能动已授权的；默认上架）
 *
 * 状态存在 tenants 的 6 个布尔列上（modules.ts MODULE_COLUMNS）。店面每个请求按主键查 tenants 行（resolve.ts findTenant），
 * 改完下一个请求就生效，不需要清缓存。收回授权不改渠道的上架列：再次授权时恢复渠道上次的选择（第一次授权是默认的上架）。
 * 写入一律锁渠道行（SELECT … FOR UPDATE），与审计同一事务。
 */
import { prisma } from '../db'
import { writeAudit } from '../audit'
import { emitTenantNotice } from './notice'
import { CONTENT_MODULES, MODULE_COLUMNS, MODULE_LABEL, type ContentModule } from '../storefront/modules'
import type { Prisma } from '@prisma/client'
import type { PartnerModuleDTO } from './types'

const COLS = {
  kind: true,
  status: true,
  modLearnGranted: true,
  modLearnOn: true,
  modNewsGranted: true,
  modNewsOn: true,
  modIptoolsGranted: true,
  modIptoolsOn: true,
} as const
type ModuleRow = Prisma.TenantGetPayload<{ select: typeof COLS }>

function toDTO(t: ModuleRow): PartnerModuleDTO[] {
  const openStatus = t.status === 'ACTIVE' || t.status === 'SUSPENDED'
  return CONTENT_MODULES.map((m) => {
    const [g, on] = MODULE_COLUMNS[m]
    const granted = t[g] === true
    const isOn = t[on] !== false
    return { module: m, label: MODULE_LABEL[m], granted, on: isOn, live: openStatus && granted && isOn }
  })
}

export class TenantModuleError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail)
    this.name = 'TenantModuleError'
  }
}

export async function listTenantModules(tenantId: number): Promise<PartnerModuleDTO[]> {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: COLS })
  if (!t || t.kind !== 'CHANNEL') throw new TenantModuleError(404, '渠道不存在')
  return toDTO(t)
}

export async function adminSetModuleGrant(tenantId: number, module: ContentModule, granted: boolean, adminId: number): Promise<{ changed: boolean; modules: PartnerModuleDTO[] }> {
  const [g] = MODULE_COLUMNS[module]
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM tenants WHERE id = ${tenantId} FOR UPDATE`
    const t = await tx.tenant.findUnique({ where: { id: tenantId }, select: COLS })
    if (!t || t.kind !== 'CHANNEL') throw new TenantModuleError(404, '渠道不存在')
    if (t[g] === granted) return { changed: false, modules: toDTO(t) }
    const after = await tx.tenant.update({ where: { id: tenantId }, data: { [g]: granted }, select: COLS })
    await writeAudit(tx, {
      actorKind: 'PLATFORM',
      actorUserId: adminId,
      tenantId,
      action: 'tenant.module_grant',
      targetType: 'tenant',
      targetId: String(tenantId),
      diff: { module, granted },
      publicDiff: { module, granted },
    })
    const label = MODULE_LABEL[module]
    await emitTenantNotice(tx, {
      tenantId,
      kind: 'TENANT_STATUS',
      title: granted ? `平台已为本店开通「${label}」` : `平台已收回本店的「${label}」`,
      body: granted
        ? `「${label}」已在你的店铺前台上架（导航栏可见）。不想展示可以在「设置 → 内容模块」里下架`
        : `「${label}」已从你的店铺前台撤下；如有疑问请联系平台`,
    })
    return { changed: true, modules: toDTO(after) }
  })
}

/**
 * 渠道上架 / 下架。没授权的模块 409（前台本来就不显示，开关没有意义）。onChanged 在同一事务里写审计（partner-services 传入）。
 */
export async function setTenantModuleOn(
  tenantId: number,
  module: ContentModule,
  on: boolean,
  onChanged: (tx: Prisma.TransactionClient) => Promise<void>,
): Promise<{ changed: boolean; modules: PartnerModuleDTO[] }> {
  const [g, col] = MODULE_COLUMNS[module]
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM tenants WHERE id = ${tenantId} FOR UPDATE`
    const t = await tx.tenant.findUnique({ where: { id: tenantId }, select: COLS })
    if (!t || t.kind !== 'CHANNEL') throw new TenantModuleError(404, '渠道不存在')
    if (t[g] !== true) throw new TenantModuleError(409, `平台还没有为本店开通「${MODULE_LABEL[module]}」`)
    if ((t[col] !== false) === on) return { changed: false, modules: toDTO(t) }
    const after = await tx.tenant.update({ where: { id: tenantId }, data: { [col]: on }, select: COLS })
    await onChanged(tx)
    return { changed: true, modules: toDTO(after) }
  })
}
