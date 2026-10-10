/**
 * 内容模块下放（docs/多渠道分销-内容模块下放.md）：AI学习 / AI圈大事记 / IP工具 三个模块可以开到渠道分站。
 *
 * 站长 10-10 拍板：超管按渠道授权（默认不授权），授权后渠道默认上架、可自己下架；前台生效 = 授权 && 上架。
 * 主站恒为全开（常量，不查库）。tenants 行的 6 列与 status 同一次主键查询取出（resolve.ts findTenant），改完下一个请求就生效。
 *
 * 【零依赖，客户端可 import】只有常量与纯函数：渠道后台、超管后台的卡片也用这里的名字与说明。
 */
export const CONTENT_MODULES = ['learn', 'news', 'iptools'] as const
export type ContentModule = (typeof CONTENT_MODULES)[number]

export const MODULE_LABEL: Record<ContentModule, string> = { learn: 'AI学习', news: 'AI圈大事记', iptools: 'IP工具' }

export const MODULE_DESC: Record<ContentModule, string> = {
  learn: '提示词库、教程、AI 应用、作者主页与讨论区；顾客可以发帖、评论、收藏、关注',
  news: 'AI 圈每日动态、月度归档与周报 / 月报，首页显示热点',
  iptools: 'IP 纯净度、真实地址查询等常用工具的导航页',
}

export type StoreModules = Record<ContentModule, boolean>

export const ALL_MODULES: StoreModules = Object.freeze({ learn: true, news: true, iptools: true })
export const NO_MODULES: StoreModules = Object.freeze({ learn: false, news: false, iptools: false })

/** 每个模块在 tenants 上的两列：[超管授权, 渠道上架] */
export const MODULE_COLUMNS = {
  learn: ['modLearnGranted', 'modLearnOn'],
  news: ['modNewsGranted', 'modNewsOn'],
  iptools: ['modIptoolsGranted', 'modIptoolsOn'],
} as const satisfies Record<ContentModule, readonly [string, string]>

/** tenants 行里的模块列。全部可缺省：itest 注入的假库只 select 前几列，缺省按「未授权」 */
export interface TenantModuleRow {
  modLearnGranted?: boolean | null
  modLearnOn?: boolean | null
  modNewsGranted?: boolean | null
  modNewsOn?: boolean | null
  modIptoolsGranted?: boolean | null
  modIptoolsOn?: boolean | null
}

/** 授权必须是 true（缺省 / null 都算未授权，fail closed）；上架缺省算上架（库默认值就是 1） */
export function resolveStoreModules(t: TenantModuleRow): StoreModules {
  const out = { ...NO_MODULES }
  for (const m of CONTENT_MODULES) {
    const [g, on] = MODULE_COLUMNS[m]
    out[m] = t[g] === true && t[on] !== false
  }
  return out
}

export function isContentModule(v: unknown): v is ContentModule {
  return typeof v === 'string' && (CONTENT_MODULES as readonly string[]).includes(v)
}
