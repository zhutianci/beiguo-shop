/**
 * 店面的「可以给浏览器看」的那一部分（设计 11.1）。
 *
 * 【无 server 依赖，客户端可 import】不 import prisma、next/headers，也不 import resolve.ts 的值
 * （只 import 类型，编译后不留任何引用）。根布局用 toPublicStorefront(sf) 把**只含 code / kind / origin / features / contact**
 * 的 DTO 放进 StorefrontProvider；费率、进货价、成员信息、tenantId 一律不放——它们会进 HTML 与 RSC payload。
 * contact（二期改动 4.1）是店面客服信息，本来就要展示给买家；只 import contact-base（零依赖），不把校验代码带进客户端包。
 *
 * 【features 只控制显示，不是权限】渠道站营销与内容模块的真正拦截全在服务端（denyOnChannel / notFoundOnChannel /
 * 下单接口拒券、忽略 ref），这里关掉的只是入口（acg「券开关只有前台在看」的教训，T12 遍历验证）。
 * CHANNEL 恒为全关、PLATFORM 恒为全开，**不读任何 JSON 配置**（设计 7.6：不存在 Tenant.features）。
 */
import type { Storefront, StorefrontKind } from './resolve'
import { PLATFORM_CONTACT, type StoreContact } from '../contact-base'

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
  /** 客服信息（主站 = PLATFORM_CONTACT；渠道按回退规则）。客户端组件用 useStorefront().contact，不要再写死微信号 */
  contact: StoreContact
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
 * contact 也逐字段显式构造：StoreContact 将来加字段不会顺带进 HTML。
 * 缺 contact（类型上不可能；防旧测试夹具 / 手写字面量）按主站客服处理：根布局每个页面都调这里，宁可显示主站客服也不能整站 500。
 */
function publicContact(c: StoreContact | undefined): StoreContact {
  const x = c ?? PLATFORM_CONTACT
  return { wechat: x.wechat, qrUrl: x.qrUrl, email: x.email, hours: x.hours }
}

/**
 * 服务端 → 客户端的店面 DTO。只挑 code / kind / origin / contact（显式构造，不展开 sf：
 * 将来 Storefront 加字段也不会顺带进 HTML）。sf 为 null 时给一个全关的空店面（该请求本应已 404），
 * 客服信息给主站的（与二期之前一样：没有店面的 404 页上仍是主站客服入口）。
 */
export function toPublicStorefront(sf: Storefront | null): PublicStorefront {
  if (!sf) return { code: '', kind: 'CHANNEL', origin: '', features: storefrontFeatures(null), contact: publicContact(PLATFORM_CONTACT) }
  return { code: sf.code, kind: sf.kind, origin: sf.origin, features: storefrontFeatures(sf), contact: publicContact(sf.contact) }
}
