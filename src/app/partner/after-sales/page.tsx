import { requirePartnerPage } from '@/lib/tenant/partner-page'
import { PartnerShell } from '@/components/partner/shell/partner-shell'
import { AfterSalesView } from '@/components/partner/after-sales/after-sales-view'

/** 售后申请列表（order.read；撤回由接口按 aftersale.request 鉴权）。 */
export const dynamic = 'force-dynamic'

export default async function Page({ searchParams }: { searchParams: { status?: string | string[] } }) {
  // 页面守卫（边界检查规则 5）：非成员 / 越权 → 404，未登录 → /partner/login；不包进 try
  const ctx = await requirePartnerPage('order.read')
  const status = typeof searchParams.status === 'string' ? searchParams.status : undefined
  return (
    <PartnerShell readOnly={ctx.readOnly} role={ctx.role}>
      <AfterSalesView readOnly={ctx.readOnly} initialStatus={status} />
    </PartnerShell>
  )
}
