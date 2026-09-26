/**
 * 渠道后台：客服信息（二期改动 4.3、4.4；docs/多渠道分销-二期改动.md）。settings.write 仅 OWNER，暂停营业时只读（路由层 partnerRoute）。
 *
 * 【可改】微信号或昵称、客服邮箱、服务时间（JSON）；客服二维码（multipart 上传 / 清除）。
 * 【读】渠道自己填的原值（PartnerContactDTO，**不做回退**）：设置页要让店主看清哪些项自己没填、前台正在显示主站的；
 *       回退只发生在前台展示（src/lib/contact-base.ts resolveStoreContact）。
 *
 * 【边界】本层不能 import upload-store / mail / crypto（边界检查规则 3）：字段校验、写库、落盘、删旧图都经
 * tenant/partner-facade.ts 的 setTenantContact / saveTenantContactQr / clearTenantContactQr；二维码地址只由服务端写入，
 * 客户端提交的 URL 一律不收（PUT 的 schema 是 strict，没有 qrUrl 字段）。
 *
 * 【审计】action = settings.contact，diff（渠道自己的行 publicDiff = diff）只写**哪些字段变了**（{ changed: [...] }），
 * 不写新旧值：值本来就公开在前台，但操作日志里只需要「谁在什么时候改了哪几项」。保存与审计同一事务：审计写不进去就一起回滚。
 * 什么都没变（提交的值与库里相同）不写审计。
 */
import { prisma } from '../db'
import { writeAudit } from '../audit'
import type { ContactField } from '../contact'
import { clearTenantContactQr, PartnerFacadeError, saveTenantContactQr, setTenantContact } from '../tenant/partner-facade'
import type { PartnerContactDTO } from '../tenant/types'
import { assertTenantId } from './_scope'
import { PartnerServiceError } from './orders'
import { PARTNER_TENANT_SELECT } from './selects'

/** 客服四列（引用 selects.ts 白名单，规则 15：本层不手写 select） */
const CONTACT_SELECT = {
  supportWechat: PARTNER_TENANT_SELECT.supportWechat,
  supportQrUrl: PARTNER_TENANT_SELECT.supportQrUrl,
  supportEmail: PARTNER_TENANT_SELECT.supportEmail,
  supportHours: PARTNER_TENANT_SELECT.supportHours,
}

function toDTO(t: { supportWechat: string | null; supportQrUrl: string | null; supportEmail: string | null; supportHours: string | null }): PartnerContactDTO {
  return { supportWechat: t.supportWechat, supportQrUrl: t.supportQrUrl, supportEmail: t.supportEmail, supportHours: t.supportHours }
}

export async function partnerGetContact(tenantId: number): Promise<PartnerContactDTO> {
  assertTenantId(tenantId)
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: CONTACT_SELECT })
  if (!t) throw new Error(`[partner-contact] 渠道 ${tenantId} 不存在`)
  return toDTO(t)
}

function auditInput(tenantId: number, userId: number, changed: ContactField[], req?: Request) {
  return {
    actorKind: 'TENANT' as const,
    actorUserId: userId,
    tenantId,
    action: 'settings.contact',
    targetType: 'settings',
    targetId: 'contact',
    diff: { changed },
    req,
  }
}

/**
 * 保存微信号 / 客服邮箱 / 服务时间。每项缺省 = 不改；null / 空串 = 清空（该项前台回退主站）。
 * 不合规 → 400（facade 抛 BAD_CONTACT，detail 是给用户看的中文提示，原样返回）。
 */
export async function partnerSetContact(
  tenantId: number,
  userId: number,
  input: { wechat?: string | null; email?: string | null; hours?: string | null },
  req?: Request,
): Promise<PartnerContactDTO> {
  assertTenantId(tenantId)
  try {
    return await prisma.$transaction(async (tx) => {
      // facade 在同一事务里先锁 tenants 行、读旧值、写新值；并发的两次保存串行，changed 按锁内读到的旧值算
      const r = await setTenantContact(tenantId, input, tx)
      if (r.changed.length) await writeAudit(tx, auditInput(tenantId, userId, r.changed, req))
      return r.contact
    })
  } catch (e) {
    if (e instanceof PartnerFacadeError || (e as { name?: unknown })?.name === 'PartnerFacadeError') {
      const fe = e as PartnerFacadeError
      throw new PartnerServiceError(400, fe.detail || '客服信息格式不正确')
    }
    throw e
  }
}

export type ContactQrUploadResult =
  | { ok: true; contact: PartnerContactDTO }
  | { ok: false; status: 400 | 429 | 507; error: string }

const QR_FAIL: Record<'TOO_FREQUENT' | 'TOO_LARGE' | 'BAD_TYPE' | 'NO_SPACE', { status: 400 | 429 | 507; error: string }> = {
  TOO_FREQUENT: { status: 429, error: '二维码上传过于频繁（每小时最多 10 次），请稍后再试' },
  TOO_LARGE: { status: 400, error: '二维码图片不能超过 2MB' },
  BAD_TYPE: { status: 400, error: '只支持 PNG / JPG / WebP 格式的二维码图片' },
  NO_SPACE: { status: 507, error: '图片存储空间已满，请联系平台' },
}

/**
 * 上传客服二维码：字节交给 facade（≤2MB、按文件头只收 png/jpg/webp、文件名随机、每渠道每小时 10 次、换图后删旧图）。
 * 写库与审计同一事务（facade 的 audit 回调）；失败原因带 HTTP 状态返回（507 不在 PartnerServiceError 的状态集合里，由 handler 直接回）。
 */
export async function partnerUploadContactQr(tenantId: number, userId: number, bytes: Buffer, req?: Request): Promise<ContactQrUploadResult> {
  assertTenantId(tenantId)
  const r = await saveTenantContactQr(tenantId, bytes, async (tx) => {
    await writeAudit(tx, auditInput(tenantId, userId, ['supportQrUrl'], req))
  })
  if (!r.ok) return { ok: false, ...QR_FAIL[r.reason] }
  return { ok: true, contact: await partnerGetContact(tenantId) }
}

/** 清除客服二维码（原来就没有 → 不写审计，照常返回当前值）。清除后前台：微信号也没填则整组回退主站客服 */
export async function partnerClearContactQr(tenantId: number, userId: number, req?: Request): Promise<PartnerContactDTO> {
  assertTenantId(tenantId)
  await clearTenantContactQr(tenantId, async (tx) => {
    await writeAudit(tx, auditInput(tenantId, userId, ['supportQrUrl'], req))
  })
  return partnerGetContact(tenantId)
}
