/**
 * 接码买家接口 / 页面的「对这个访客开放吗」（docs/短信接码-设计.md §6.4、D28、§1.14）。
 *
 * 规则（纯函数在 lib/jiema-config-schema.ts 的 jiemaAccessFor）：
 *  · 对全部用户开放（S2 交付后 && enabled && audience=ALL）→ OPEN；
 *  · 管理员在灰度期 / 总开关关着时 → ADMIN_PREVIEW（可以预览全部交互，但「去支付」不可用）；
 *  · 其余普通用户 → 503（「短信接码即将开放」或「接码服务维护中」）；配置读不到一律维护中（fail-closed）。
 * 渠道站在这之前就被 denyOnChannel / notFoundOnChannel 挡掉（D11），这里不再判 Host。
 */
import { getCurrentUser } from '../auth'
import { jiemaAccessFor, type JiemaAccess, type SmsConfig } from '../jiema-config-schema'
import { readSmsConfigCached } from './config'

export interface JiemaViewer {
  cfg: SmsConfig | null
  userId: number | null
  isAdmin: boolean
  access: JiemaAccess
}

export async function jiemaViewer(): Promise<JiemaViewer> {
  const [cfg, user] = await Promise.all([readSmsConfigCached(), getCurrentUser()])
  const isAdmin = user?.role === 'ADMIN'
  return { cfg, userId: user?.id ?? null, isAdmin, access: jiemaAccessFor(cfg, isAdmin) }
}

/** 503 的文案（§1.14）：即将开放 / 维护中 */
export function closedMessage(access: JiemaAccess): string {
  return access === 'SOON' ? '短信接码即将开放' : '接码服务维护中，预计很快恢复'
}
