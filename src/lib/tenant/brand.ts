/**
 * 按 tenantId 取店面品牌（给没有请求上下文的后台流程用：邮件、cron、微信机器人推送等）。
 * 有请求上下文的页面与接口直接用 getStorefront() 的 sf.brand，不要再查一次。
 *
 * 【主站】tenantId=1 永远返回 PLATFORM_BRAND（不查库）。
 * 【渠道】经 storefrontById 读 tenants 行，按 brand-base 的回退规则算出；进程内缓存 60 秒（渠道改完最多 1 分钟后生效）。
 * 【渠道行不存在或不合规】返回 PLATFORM_BRAND 并记日志——取站名只用于展示，不能因此让推送 / 邮件整体失败。
 */
import { PLATFORM_BRAND, type StoreBrand } from '../brand-base'
import { PLATFORM_TENANT_ID, storefrontById } from '../storefront/resolve'

const TTL_MS = 60_000
const MAX_ENTRIES = 500
const cache = new Map<number, { brand: StoreBrand; exp: number }>()

export async function getTenantBrand(tenantId: number): Promise<StoreBrand> {
  if (!Number.isInteger(tenantId) || tenantId === PLATFORM_TENANT_ID) return { ...PLATFORM_BRAND }
  const hit = cache.get(tenantId)
  if (hit && hit.exp > Date.now()) return { ...hit.brand }
  let brand: StoreBrand = { ...PLATFORM_BRAND }
  try {
    const sf = await storefrontById(tenantId)
    if (sf) brand = sf.brand
    else console.warn(`[tenant-brand] 渠道 ${tenantId} 不存在或不合规，按主站品牌展示`)
  } catch (e) {
    console.error(`[tenant-brand] 读取渠道 ${tenantId} 品牌失败，按主站品牌展示`, e)
    return brand // 出错不进缓存：下一次再试
  }
  if (cache.size >= MAX_ENTRIES) cache.clear()
  cache.set(tenantId, { brand, exp: Date.now() + TTL_MS })
  return { ...brand }
}

/** 渠道改完品牌后立刻失效（同一进程内）；仅供 partner-facade / admin-tenants 调用 */
export function invalidateTenantBrand(tenantId: number): void {
  cache.delete(tenantId)
}
