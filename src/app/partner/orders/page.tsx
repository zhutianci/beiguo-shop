import { requirePartnerPage } from '@/lib/tenant/partner-page'
import { PartnerShell } from '@/components/partner/shell/partner-shell'
import { OrdersView } from '@/components/partner/orders/orders-view'

/** 订单列表（order.read；导出按钮只给店主，接口按 order.export 另行鉴权）。 */
export const dynamic = 'force-dynamic'

export default async function Page({ searchParams }: { searchParams: { unread?: string | string[] } }) {
  // 页面守卫（边界检查规则 5）：非成员 / 越权 → 404，未登录 → /partner/login；不包进 try
  const ctx = await requirePartnerPage('order.read')
  // 看板「未读买家留言」待办跳过来带 ?unread=1：列表直接只看有未读留言的订单
  const unread = searchParams.unread === '1'
  return (
    <PartnerShell readOnly={ctx.readOnly} role={ctx.role}>
      <OrdersView
        canExport={ctx.role === 'OWNER' && ctx.perms.has('order.export')}
        canCatalog={ctx.perms.has('catalog.read')}
        initialUnread={unread}
      />
    </PartnerShell>
  )
}
