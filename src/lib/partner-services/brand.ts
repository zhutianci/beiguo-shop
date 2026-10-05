/**
 * 渠道后台：店铺品牌与公告（docs/多渠道分销-渠道品牌与公告.md）。settings.write（仅 OWNER），暂停营业时只读（路由层 partnerRoute）。
 *
 * 【可改】网站名称、logo、页脚简介、首页大标题与副标题、浏览器标题与分享摘要（站长 10-05 拍板：立即生效、站长可改回 / 锁定）。
 * 【读】渠道自己填的原值（PartnerBrandDTO，不做回退）：设置页要让店主看清哪些项没填、前台正在显示主站的。
 * 【公告】本渠道的公告增删改查；只在本渠道前台弹窗展示。
 *
 * 【边界】本层不能 import upload-store / brand（marketing/lint）/ prisma 的写入细节（边界检查规则 3）：一律经 tenant/partner-facade.ts。
 * 【审计】品牌：action = settings.brand，diff 只写哪些字段变了（{ changed: [...] }）；公告：action = settings.announcement，
 *  diff 写操作与公告编号（{ op, announcementNo }），不写正文。保存与审计同一事务（品牌）；公告写入成功后再写审计（单行操作，审计失败只记日志）。
 */
import { writeAudit } from '../audit'
import {
  clearTenantBrandLogo,
  createTenantAnnouncement,
  deleteTenantAnnouncement,
  getTenantBrandSettings,
  listTenantAnnouncements,
  PartnerFacadeError,
  saveTenantBrandLogo,
  setTenantBrand,
  TenantAnnouncementError,
  updateTenantAnnouncement,
  type TenantAnnouncementDTO,
} from '../tenant/partner-facade'
import type { PartnerBrandDTO } from '../tenant/types'
import { assertTenantId } from './_scope'
import { PartnerServiceError } from './orders'

function brandAudit(tenantId: number, userId: number, changed: string[], req?: Request) {
  return { actorKind: 'TENANT' as const, actorUserId: userId, tenantId, action: 'settings.brand', targetType: 'settings', targetId: 'brand', diff: { changed }, req }
}

function mapFacadeError(e: unknown): never {
  if (e instanceof PartnerFacadeError || (e as { name?: unknown })?.name === 'PartnerFacadeError') {
    const fe = e as PartnerFacadeError
    if (fe.code === 'BRAND_LOCKED') throw new PartnerServiceError(409, fe.detail || '平台已锁定本店品牌设置')
    throw new PartnerServiceError(400, fe.detail || '品牌设置格式不正确')
  }
  throw e
}

export async function partnerGetBrand(tenantId: number): Promise<PartnerBrandDTO> {
  assertTenantId(tenantId)
  return getTenantBrandSettings(tenantId)
}

/** 保存文字字段。每项缺省 = 不改；null / 空串 = 清空（恢复主站原样）。不合规 400，锁定 409 */
export async function partnerSetBrand(tenantId: number, userId: number, input: Record<string, unknown>, req?: Request): Promise<PartnerBrandDTO> {
  assertTenantId(tenantId)
  try {
    const r = await setTenantBrand(tenantId, input, async (tx, changed) => {
      await writeAudit(tx, brandAudit(tenantId, userId, changed, req))
    })
    return r.brand
  } catch (e) {
    mapFacadeError(e)
  }
}

export type BrandLogoUploadResult = { ok: true; brand: PartnerBrandDTO } | { ok: false; status: 400 | 409 | 429 | 507; error: string }

const LOGO_FAIL: Record<'TOO_FREQUENT' | 'TOO_LARGE' | 'BAD_TYPE' | 'NO_SPACE' | 'LOCKED', { status: 400 | 409 | 429 | 507; error: string }> = {
  TOO_FREQUENT: { status: 429, error: 'logo 上传过于频繁（每小时最多 10 次），请稍后再试' },
  TOO_LARGE: { status: 400, error: 'logo 图片不能超过 1MB' },
  BAD_TYPE: { status: 400, error: '只支持 PNG / JPG / WebP 格式的 logo 图片' },
  NO_SPACE: { status: 507, error: '图片存储空间已满，请联系平台' },
  LOCKED: { status: 409, error: '平台已锁定本店品牌设置，如需修改请联系平台' },
}

export async function partnerUploadBrandLogo(tenantId: number, userId: number, bytes: Buffer, req?: Request): Promise<BrandLogoUploadResult> {
  assertTenantId(tenantId)
  const r = await saveTenantBrandLogo(tenantId, bytes, async (tx) => {
    await writeAudit(tx, brandAudit(tenantId, userId, ['brandLogoUrl'], req))
  })
  if (!r.ok) return { ok: false, ...LOGO_FAIL[r.reason] }
  return { ok: true, brand: await getTenantBrandSettings(tenantId) }
}

export async function partnerClearBrandLogo(tenantId: number, userId: number, req?: Request): Promise<PartnerBrandDTO> {
  assertTenantId(tenantId)
  try {
    await clearTenantBrandLogo(tenantId, async (tx) => {
      await writeAudit(tx, brandAudit(tenantId, userId, ['brandLogoUrl'], req))
    })
  } catch (e) {
    mapFacadeError(e)
  }
  return getTenantBrandSettings(tenantId)
}

// ------------------------------ 公告 ------------------------------

function mapAnnError(e: unknown): never {
  if (e instanceof TenantAnnouncementError || (e as { name?: unknown })?.name === 'TenantAnnouncementError') {
    const ae = e as TenantAnnouncementError
    throw new PartnerServiceError(ae.status, ae.message)
  }
  throw e
}

async function annAudit(tenantId: number, userId: number, op: 'create' | 'update' | 'delete', announcementNo: string, req?: Request): Promise<void> {
  // 审计写不进去不影响公告本身（单行操作已经生效），只记日志
  await writeAudit(null, { actorKind: 'TENANT', actorUserId: userId, tenantId, action: 'settings.announcement', targetType: 'announcement', targetId: announcementNo, diff: { op, announcementNo }, req }).catch((e) =>
    console.error('[partner-announcement] 写审计失败', e),
  )
}

export async function partnerListAnnouncements(tenantId: number): Promise<TenantAnnouncementDTO[]> {
  assertTenantId(tenantId)
  return listTenantAnnouncements(tenantId)
}

export async function partnerCreateAnnouncement(tenantId: number, userId: number, input: unknown, req?: Request): Promise<TenantAnnouncementDTO> {
  assertTenantId(tenantId)
  try {
    const a = await createTenantAnnouncement(tenantId, userId, input)
    await annAudit(tenantId, userId, 'create', a.announcementNo, req)
    return a
  } catch (e) {
    mapAnnError(e)
  }
}

export async function partnerUpdateAnnouncement(tenantId: number, userId: number, announcementNo: string, input: unknown, req?: Request): Promise<TenantAnnouncementDTO> {
  assertTenantId(tenantId)
  try {
    const a = await updateTenantAnnouncement(tenantId, announcementNo, input)
    await annAudit(tenantId, userId, 'update', a.announcementNo, req)
    return a
  } catch (e) {
    mapAnnError(e)
  }
}

export async function partnerDeleteAnnouncement(tenantId: number, userId: number, announcementNo: string, req?: Request): Promise<void> {
  assertTenantId(tenantId)
  try {
    await deleteTenantAnnouncement(tenantId, announcementNo)
    await annAudit(tenantId, userId, 'delete', announcementNo.toUpperCase(), req)
  } catch (e) {
    mapAnnError(e)
  }
}
