import { requirePartnerPage } from '@/lib/tenant/partner-page'
import { PartnerShell } from '@/components/partner/shell/partner-shell'
import { CustomerDetailView } from '@/components/partner/customers/customer-detail-view'

/** 客户详情（customer.read；备注、标签、限制下单、申请全局封禁由接口按 customer.write 鉴权）。 */
export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: { customerNo: string } }) {
  // 页面守卫（边界检查规则 5）：非成员 / 越权 → 404，未登录 → /partner/login；不包进 try
  const ctx = await requirePartnerPage('customer.read')
  return (
    <PartnerShell readOnly={ctx.readOnly} role={ctx.role}>
      <CustomerDetailView customerNo={params.customerNo} canWrite={ctx.perms.has('customer.write')} readOnly={ctx.readOnly} />
    </PartnerShell>
  )
}
