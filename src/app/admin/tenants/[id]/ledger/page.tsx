'use client'

/**
 * 渠道账本：三个数、流水、调账、保证金与回款、核销（WP5，设计 10）。
 * 后台页面都是客户端组件（admin/layout.tsx 为 'use client'）；数据全部经 adminGuard 的 /api/admin/* 取，页面本身不是闸门。
 */
import View from '@/components/admin/tenants/tenant-ledger'

export default function Page({ params }: { params: { id: string } }) {
  return <View id={params.id} />
}
