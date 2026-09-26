import { requirePartnerPage } from '@/lib/tenant/partner-page'
import { PartnerShell } from '@/components/partner/shell/partner-shell'
import { OrderDetailView } from '@/components/partner/orders/order-detail-view'

/** 订单详情（order.read；交付凭据、留言、售后申请由各自接口按 order.cards / order.message / aftersale.request 鉴权）。 */
export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: { orderNo: string } }) {
  // 页面守卫（边界检查规则 5）：非成员 / 越权 → 404，未登录 → /partner/login；不包进 try
  const ctx = await requirePartnerPage('order.read')
  return (
    <PartnerShell readOnly={ctx.readOnly} role={ctx.role}>
      <OrderDetailView orderNo={params.orderNo} readOnly={ctx.readOnly} />
    </PartnerShell>
  )
}
