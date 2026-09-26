'use client'

/**
 * 审计日志（仅超管，WP5，设计 13.2）。
 * 后台页面都是客户端组件（admin/layout.tsx 为 'use client'）；数据全部经 adminGuard 的 /api/admin/* 取，页面本身不是闸门。
 */
import View from '@/components/admin/tenants/audit-view'

export default function Page() {
  return <View />
}
