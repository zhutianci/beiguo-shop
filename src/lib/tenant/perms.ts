/**
 * 渠道权限点（设计 6.1）。字符串字面量联合类型；OWNER 自动拥有全部，STAFF 为 P2（按 TenantMember.perms 授予）。
 *
 * 【一个机制】「仅 OWNER」「DRAFT 期可用」只由这里的两个常量决定（设计 6.1 表格两列直接翻译），
 * partnerRoute / requirePartnerPage 不接受 ownerOnly / draftSafe 之类的路由级选项——两处各写一份迟早不一致。
 * 纯常量，无 import：partner-handlers、客户端组件都可以 import。
 */

export type PartnerPerm =
  | 'dashboard.read'
  | 'catalog.read'
  | 'listing.write'
  | 'order.read'
  | 'order.cards'
  | 'order.export'
  | 'order.message'
  | 'aftersale.request'
  | 'customer.read'
  | 'customer.write'
  | 'customer.export'
  | 'finance.read'
  | 'finance.apply'
  | 'notice.read'
  | 'settings.write'
  | 'audit.read'
  | 'member.manage'

const ALL_LIST = [
  'dashboard.read',
  'catalog.read',
  'listing.write',
  'order.read',
  'order.cards',
  'order.export',
  'order.message',
  'aftersale.request',
  'customer.read',
  'customer.write',
  'customer.export',
  'finance.read',
  'finance.apply',
  'notice.read',
  'settings.write',
  'audit.read',
  'member.manage',
] as const satisfies readonly PartnerPerm[]

// 编译期保证 ALL_LIST 恰好覆盖联合类型（新增权限点忘了加进列表会编译失败）
type _Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never
const _allPermsComplete: _Exact<(typeof ALL_LIST)[number], PartnerPerm> = true
void _allPermsComplete

/** 冻结的只读集合：Set 本身没有 freeze 语义，这里把写方法换成抛错，防止某处 `.add()` 悄悄给全体扩权 */
function frozenSet<T>(items: readonly T[]): ReadonlySet<T> {
  const s = new Set<T>(items)
  const deny = () => {
    throw new Error('[perms] 权限集合是只读的')
  }
  Object.defineProperty(s, 'add', { value: deny })
  Object.defineProperty(s, 'delete', { value: deny })
  Object.defineProperty(s, 'clear', { value: deny })
  return s
}

export const ALL_PARTNER_PERMS: ReadonlySet<PartnerPerm> = frozenSet<PartnerPerm>(ALL_LIST)

/** 设计 6.1「可授予 STAFF」为 ✗ 的点：partnerRoute 唯一的「仅 OWNER」机制 */
export const OWNER_ONLY_PERMS: ReadonlySet<PartnerPerm> = frozenSet<PartnerPerm>([
  'order.export',
  'customer.export',
  'finance.read',
  'finance.apply',
  'settings.write',
  'member.manage',
])

/** 设计 6.1「DRAFT 期可用」为 ✔ 的点：partnerRoute 唯一的「DRAFT 可用」机制（开业前渠道主能看板、选品定价上架、看客户与设置） */
export const DRAFT_SAFE_PERMS: ReadonlySet<PartnerPerm> = frozenSet<PartnerPerm>([
  'dashboard.read',
  'catalog.read',
  'listing.write',
  'order.read',
  'customer.read',
  'finance.read',
  'notice.read',
  'settings.write',
  'audit.read',
  'member.manage',
])

export function isPartnerPerm(x: unknown): x is PartnerPerm {
  return typeof x === 'string' && (ALL_PARTNER_PERMS as ReadonlySet<string>).has(x)
}

/**
 * 解析 TenantMember.perms（Json）。只接受字符串数组；未知权限点丢弃；任何解析失败 → 空集合（fail closed）。
 * 注意：OWNER 不走这里（守卫里 OWNER 直接给 ALL_PARTNER_PERMS）；STAFF 即使 perms 里写了 OWNER_ONLY 的点，
 * 守卫也会按 OWNER_ONLY_PERMS 再拒一次。
 */
export function parsePerms(raw: unknown): ReadonlySet<PartnerPerm> {
  let v = raw
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v)
    } catch {
      return frozenSet<PartnerPerm>([])
    }
  }
  if (!Array.isArray(v)) return frozenSet<PartnerPerm>([])
  return frozenSet<PartnerPerm>(v.filter(isPartnerPerm))
}
