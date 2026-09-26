'use client'

/**
 * 商品授权与进货价：逐个与批量（WP5，设计 7.1）。
 * 后台页面都是客户端组件（admin/layout.tsx 为 'use client'）；数据全部经 adminGuard 的 /api/admin/* 取，页面本身不是闸门。
 */
import View from '@/components/admin/tenants/tenant-listings'

export default function Page({ params }: { params: { id: string } }) {
  return <View id={params.id} />
}
