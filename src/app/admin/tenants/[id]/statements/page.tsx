'use client'

/**
 * 结算单与打款：生成、认领、登记、退回、退票、凭证（WP5，设计 10.9、10.10）。
 * 后台页面都是客户端组件（admin/layout.tsx 为 'use client'）；数据全部经 adminGuard 的 /api/admin/* 取，页面本身不是闸门。
 */
import View from '@/components/admin/tenants/tenant-statements'

export default function Page({ params }: { params: { id: string } }) {
  return <View id={params.id} />
}
