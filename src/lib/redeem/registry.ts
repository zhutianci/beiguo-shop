/**
 * 充值平台注册表。
 *
 * 【接一家新平台的完整步骤】
 *   1. 复制 providers/sysa.ts 改成 providers/sysb.ts，实现 RedeemProvider
 *   2. 在下面 PROVIDERS 里加一行
 * 完事。路由 /redeem/sysb、接口 /api/redeem/sysb/*、后台导入时的下拉选项
 * 全都自动出现，前端与数据库结构一行都不用改。
 *
 * 【key 一旦用了就不能改】它会写进 card_keys.redeem_provider。
 * 改 key 等于让所有历史卡密指向一个不存在的适配器，兑换页直接报「未知充值系统」。
 * 要换名字请改 adminLabel —— 那个只是给站长看的标签，随便改。
 */
import type { RedeemProvider } from './types'
import { sysa } from './providers/sysa'

const PROVIDERS: RedeemProvider[] = [sysa]

const BY_KEY = new Map<string, RedeemProvider>(PROVIDERS.map((p) => [p.key, p]))

export function getProvider(key: string | null | undefined): RedeemProvider | null {
  if (!key) return null
  return BY_KEY.get(key.trim().toLowerCase()) ?? null
}

export function hasProvider(key: string | null | undefined): boolean {
  return getProvider(key) !== null
}

/**
 * 给后台下拉用的清单。**只有这里会吐出 adminLabel**——
 * 买家侧的任何接口都不要返回它，那是货源信息。
 */
export function listProvidersForAdmin(): { key: string; label: string; supportsRebind: boolean }[] {
  return PROVIDERS.map((p) => ({
    key: p.key,
    label: p.adminLabel,
    supportsRebind: typeof p.rebind === 'function',
  }))
}

/** 兑换页对外统一的名字。买家只看得到这个，永远不出现上游是谁 */
export const PUBLIC_SYSTEM_NAME = '贝果科技 · AI会员自助充值系统'
