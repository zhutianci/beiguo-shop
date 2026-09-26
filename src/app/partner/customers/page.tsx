import { requirePartnerPage } from '@/lib/tenant/partner-page'
import { PartnerShell } from '@/components/partner/shell/partner-shell'
import { CustomersView } from '@/components/partner/customers/customers-view'

/** 本站用户列表（customer.read；导出按钮只给店主，接口按 customer.export 另行鉴权）。 */
export const dynamic = 'force-dynamic'

export default async function Page() {
  // 页面守卫（边界检查规则 5）：非成员 / 越权 → 404，未登录 → /partner/login；不包进 try
  const ctx = await requirePartnerPage('customer.read')
  return (
    <PartnerShell readOnly={ctx.readOnly} role={ctx.role}>
      <CustomersView canExport={ctx.role === 'OWNER' && ctx.perms.has('customer.export')} />
    </PartnerShell>
  )
}
