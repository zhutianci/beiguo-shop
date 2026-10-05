/**
 * 超管：渠道品牌与公告的查看与兜底（docs/多渠道分销-渠道品牌与公告.md 第 6 节）。站长 10-05 拍板：渠道改品牌立即生效，
 * 站长随时能一键恢复默认、禁止该渠道再改；渠道公告站长能看、能下架。
 *
 *  · adminBrandDetail(tenantId)                  品牌原值 + 锁定状态 + 公告列表
 *  · adminResetBrand(tenantId, adminId)          恢复默认：七个品牌字段全部清空（前台回到主站原样），旧 logo 按引用计数删除
 *  · adminSetBrandLock(tenantId, locked, adminId) 锁定 / 解锁（锁定后渠道设置页只读，已有值保留）
 *  · adminSetAnnouncementBlocked(...)             下架 / 恢复一条渠道公告
 * 每个动作写审计（tenant.brand_reset / tenant.brand_lock / tenant.announcement_block，渠道操作日志可见「平台做了什么」，不含内部原因），
 * 并给渠道发站内通知（TENANT_STATUS）。
 */
import { prisma } from '../db'
import { writeAudit } from '../audit'
import { releaseBrandUpload } from '../upload-store'
import { emitTenantNotice } from './notice'
import { invalidateTenantBrand } from './brand'
import { listTenantAnnouncements, setTenantAnnouncementBlocked, TenantAnnouncementError, type TenantAnnouncementDTO } from './announcements'
import { TenantAdminError } from './admin-tenants'
import type { PartnerBrandDTO } from './types'

export interface AdminBrandDetail {
  brand: PartnerBrandDTO
  announcements: TenantAnnouncementDTO[]
}

const COLS = {
  kind: true,
  brandName: true,
  brandLogoUrl: true,
  brandIntro: true,
  heroTitle: true,
  heroSubtitle: true,
  seoTitle: true,
  seoDescription: true,
  brandLocked: true,
} as const

async function channelRow(tenantId: number) {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: COLS })
  if (!t || t.kind !== 'CHANNEL') throw new TenantAdminError(404, '渠道不存在')
  return t
}

export async function adminBrandDetail(tenantId: number): Promise<AdminBrandDetail> {
  const t = await channelRow(tenantId)
  return {
    brand: {
      brandName: t.brandName,
      brandLogoUrl: t.brandLogoUrl,
      brandIntro: t.brandIntro,
      heroTitle: t.heroTitle,
      heroSubtitle: t.heroSubtitle,
      seoTitle: t.seoTitle,
      seoDescription: t.seoDescription,
      locked: t.brandLocked,
    },
    announcements: await listTenantAnnouncements(tenantId),
  }
}

export async function adminResetBrand(tenantId: number, adminId: number): Promise<{ changed: boolean }> {
  await channelRow(tenantId)
  const old = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM tenants WHERE id = ${tenantId} FOR UPDATE`
    const t = await tx.tenant.findUnique({ where: { id: tenantId }, select: COLS })
    if (!t) throw new TenantAdminError(404, '渠道不存在')
    const had = [t.brandName, t.brandLogoUrl, t.brandIntro, t.heroTitle, t.heroSubtitle, t.seoTitle, t.seoDescription].some((v) => v !== null)
    if (!had) return { changed: false, logo: null as string | null }
    await tx.tenant.update({
      where: { id: tenantId },
      data: { brandName: null, brandLogoUrl: null, brandIntro: null, heroTitle: null, heroSubtitle: null, seoTitle: null, seoDescription: null },
    })
    await writeAudit(tx, {
      actorKind: 'PLATFORM',
      actorUserId: adminId,
      tenantId,
      action: 'tenant.brand_reset',
      targetType: 'tenant',
      targetId: String(tenantId),
      diff: { from: { brandName: t.brandName, brandLogoUrl: t.brandLogoUrl } },
      publicDiff: { reset: true },
    })
    await emitTenantNotice(tx, { tenantId, kind: 'TENANT_STATUS', title: '平台已将店铺品牌恢复为默认', body: '网站名称、logo、简介与首页标题已恢复为平台默认；如有疑问请联系平台' })
    return { changed: true, logo: t.brandLogoUrl }
  })
  invalidateTenantBrand(tenantId)
  if (old.logo) await releaseBrandUpload(old.logo).catch((e) => console.error('[admin-brand] 删除旧站标失败（已恢复默认）', e))
  return { changed: old.changed }
}

export async function adminSetBrandLock(tenantId: number, locked: boolean, adminId: number): Promise<{ changed: boolean }> {
  await channelRow(tenantId)
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM tenants WHERE id = ${tenantId} FOR UPDATE`
    const t = await tx.tenant.findUnique({ where: { id: tenantId }, select: { brandLocked: true } })
    if (!t) throw new TenantAdminError(404, '渠道不存在')
    if (t.brandLocked === locked) return { changed: false }
    await tx.tenant.update({ where: { id: tenantId }, data: { brandLocked: locked } })
    await writeAudit(tx, {
      actorKind: 'PLATFORM',
      actorUserId: adminId,
      tenantId,
      action: 'tenant.brand_lock',
      targetType: 'tenant',
      targetId: String(tenantId),
      diff: { locked },
      publicDiff: { locked },
    })
    await emitTenantNotice(tx, {
      tenantId,
      kind: 'TENANT_STATUS',
      title: locked ? '平台已锁定店铺品牌设置' : '平台已解除店铺品牌设置的锁定',
      body: locked ? '网站名称、logo、简介等暂时不能修改，现有设置保留；如需修改请联系平台' : '现在可以在「设置 → 店铺品牌」里修改网站名称、logo 与简介',
    })
    return { changed: true }
  })
}

export async function adminSetAnnouncementBlocked(tenantId: number, rawNo: string, blocked: boolean, adminId: number): Promise<TenantAnnouncementDTO> {
  await channelRow(tenantId)
  let row: TenantAnnouncementDTO
  try {
    row = await setTenantAnnouncementBlocked(tenantId, rawNo, blocked)
  } catch (e) {
    if (e instanceof TenantAnnouncementError) throw new TenantAdminError(e.status, e.message)
    throw e
  }
  await writeAudit(null, {
    actorKind: 'PLATFORM',
    actorUserId: adminId,
    tenantId,
    action: 'tenant.announcement_block',
    targetType: 'announcement',
    targetId: row.announcementNo,
    diff: { blocked },
    publicDiff: { blocked, announcementNo: row.announcementNo },
  })
  await emitTenantNotice(null, {
    tenantId,
    kind: 'TENANT_STATUS',
    title: blocked ? `平台已下架公告「${row.title.slice(0, 30)}」` : `平台已恢复公告「${row.title.slice(0, 30)}」`,
    body: blocked ? '该公告不再在店铺前台展示；可以修改内容后联系平台恢复，或删除后重新发布' : '恢复后默认不启用，需要时请在「店铺公告」里重新启用',
  })
  return row
}
