'use client'

/**
 * 渠道详情：状态机、payoutHold、结算参数、域名、成员与邀请、收款信息（WP5）。
 * 后台页面都是客户端组件（admin/layout.tsx 为 'use client'）；数据全部经 adminGuard 的 /api/admin/* 取，页面本身不是闸门。
 */
import View from '@/components/admin/tenants/tenant-detail'

export default function Page({ params }: { params: { id: string } }) {
  return <View id={params.id} />
}
