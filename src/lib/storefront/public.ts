/**
 * 店面的「可以给浏览器看」的那一部分（设计 11.1）。
 *
 * 【无 server 依赖，客户端可 import】不 import prisma、next/headers，也不 import resolve.ts 的值
 * （只 import 类型，编译后不留任何引用）。根布局用 toPublicStorefront(sf) 把**只含 code / kind / origin / features**
 * 的 DTO 放进 StorefrontProvider；费率、进货价、成员信息、tenantId 一律不放——它们会进 HTML 与 RSC payload。
 *
 * 【features 只控制显示，不是权限】渠道站营销与内容模块的真正拦截全在服务端（denyOnChannel / notFoundOnChannel /
 * 下单接口拒券、忽略 ref），这里关掉的只是入口（acg「券开关只有前台在看」的教训，T12 遍历验证）。
 * CHANNEL 恒为全关、PLATFORM 恒为全开，**不读任何 JSON 配置**（设计 7.6：不存在 Tenant.features）。
 */
import type { Storefront, StorefrontKind } from './resolve'

export type { StorefrontKind } from './resolve'

export interface StorefrontFeatures {
  coupon: boolean
  lottery: boolean
  referral: boolean
  vip: boolean
  balancePay: boolean
  wallet: boolean
  news: boolean
  forum: boolean
  games: boolean
  iptools: boolean
  links: boolean
  landing: boolean
  lookup: boolean
  announcement: boolean
  liveOrders: boolean
  bindings: boolean
}

export interface PublicStorefront {
  code: string
  kind: StorefrontKind
  origin: string
  features: StorefrontFeatures
}

const ALL_ON: StorefrontFeatures = Object.freeze({
  coupon: true,
  lottery: true,
  referral: true,
  vip: true,
  balancePay: true,
  wallet: true,
  news: true,
  forum: true,
  games: true,
  iptools: true,
  links: true,
  landing: true,
  lookup: true,
  announcement: true,
  liveOrders: true,
  bindings: true,
})

const ALL_OFF: StorefrontFeatures = Object.freeze({
  coupon: false,
  lottery: false,
  referral: false,
  vip: false,
  balancePay: false,
  wallet: false,
  news: false,
  forum: false,
  games: false,
  iptools: false,
  links: false,
  landing: false,
  lookup: false,
  announcement: false,
  liveOrders: false,
  bindings: false,
})

/** PLATFORM 全开；CHANNEL 与 null（没有店面）全关。返回新对象，调用方改了也不影响常量 */
export function storefrontFeatures(sf: { kind: StorefrontKind } | null): StorefrontFeatures {
  return { ...(sf && sf.kind === 'PLATFORM' ? ALL_ON : ALL_OFF) }
}

/**
 * 服务端 → 客户端的店面 DTO。只挑 code / kind / origin 三个字段（显式构造，不展开 sf：
 * 将来 Storefront 加字段也不会顺带进 HTML）。sf 为 null 时给一个全关的空店面（该请求本应已 404）。
 */
export function toPublicStorefront(sf: Storefront | null): PublicStorefront {
  if (!sf) return { code: '', kind: 'CHANNEL', origin: '', features: storefrontFeatures(null) }
  return { code: sf.code, kind: sf.kind, origin: sf.origin, features: storefrontFeatures(sf) }
}
