/**
 * 渠道后台：内容模块（docs/多渠道分销-内容模块下放.md）。settings.write（仅 OWNER），暂停营业时只读（路由层 partnerRoute）。
 *
 * 【读】三个模块的授权、上架、前台是否生效。没授权的模块渠道也看得到（灰着，写「待平台开通」）。
 * 【写】已授权模块的上架 / 下架（站长 10-10：授权后默认上架，渠道可自己下架）。
 * 【审计】action = settings.module，diff = { module, on }；与写入同一事务。
 * 【边界】经 tenant/partner-facade.ts（边界检查规则 3）。
 */
import { writeAudit } from '../audit'
import { listTenantModules, setTenantModuleOn, TenantModuleError } from '../tenant/partner-facade'
import type { PartnerModuleDTO } from '../tenant/types'
import { assertTenantId } from './_scope'
import { PartnerServiceError } from './orders'

type ModuleKey = PartnerModuleDTO['module']

function mapError(e: unknown): never {
  if (e instanceof TenantModuleError || (e as { name?: unknown })?.name === 'TenantModuleError') {
    const me = e as TenantModuleError
    throw new PartnerServiceError(me.status === 409 ? 409 : me.status === 404 ? 404 : 400, me.detail)
  }
  throw e
}

export async function partnerListModules(tenantId: number): Promise<PartnerModuleDTO[]> {
  assertTenantId(tenantId)
  try {
    return await listTenantModules(tenantId)
  } catch (e) {
    mapError(e)
  }
}

export async function partnerSetModuleOn(tenantId: number, userId: number, module: ModuleKey, on: boolean, req?: Request): Promise<PartnerModuleDTO[]> {
  assertTenantId(tenantId)
  try {
    const r = await setTenantModuleOn(tenantId, module, on, async (tx) => {
      await writeAudit(tx, { actorKind: 'TENANT', actorUserId: userId, tenantId, action: 'settings.module', targetType: 'settings', targetId: 'modules', diff: { module, on }, req })
    })
    return r.modules
  } catch (e) {
    mapError(e)
  }
}
