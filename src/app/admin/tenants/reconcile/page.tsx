'use client'

/**
 * 对账自检：L1–L13、A1–A13（WP5，设计 10.12）。
 * 后台页面都是客户端组件（admin/layout.tsx 为 'use client'）；数据全部经 adminGuard 的 /api/admin/* 取，页面本身不是闸门。
 */
import View from '@/components/admin/tenants/reconcile-view'

export default function Page() {
  return <View />
}
