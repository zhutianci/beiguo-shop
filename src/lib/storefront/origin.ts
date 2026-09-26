/**
 * 绝对链接的唯一来源（设计 4.5）：主站 = siteOrigin()，渠道 = tenants.origin（库里配置）。
 *
 * 【绝不从 Host 拼链接】8080 入口接受任意 Host，Host 头投毒能把邮件里的「查看订单」换成钓鱼域名。
 * 按订单 tenantId 生成的链接（交易邮件、收据、兑换、收银台回跳）一律经这里（Dujiao #254 的教训）。
 *
 * 【主站不查库】tenantId=1 直接返回 siteOrigin()，租户表出问题不影响主站邮件。
 * 渠道租户不存在时抛错而不是回落主站：回落会把渠道买家带到主站（价格不同），宁可这封邮件发失败被告警发现。
 */
import { siteOrigin } from '../news/format'
import { PLATFORM_TENANT_ID, storefrontById } from './resolve'

export async function tenantOrigin(tenantId: number): Promise<string> {
  if (tenantId === PLATFORM_TENANT_ID) return siteOrigin()
  const sf = await storefrontById(tenantId)
  if (!sf) throw new Error(`[storefront] 租户 ${tenantId} 不存在或配置不合规，无法生成绝对链接`)
  return sf.origin
}

/**
 * origin + path。path 必须是以单个 `/` 开头的站内路径：拒绝 `//evil.com`、`/\evil.com`、绝对 URL，
 * 防调用方把外部输入拼成开放重定向。
 */
export async function tenantAbsUrl(tenantId: number, path: string): Promise<string> {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\') || /[\r\n]/.test(path)) {
    throw new Error(`[storefront] tenantAbsUrl 只接受站内路径：${String(path).slice(0, 80)}`)
  }
  return (await tenantOrigin(tenantId)) + path
}
