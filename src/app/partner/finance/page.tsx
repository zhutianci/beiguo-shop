import { requirePartnerPage } from '@/lib/tenant/partner-page'
import { PartnerShell } from '@/components/partner/shell/partner-shell'
import { FinanceView } from '@/components/partner/finance/finance-view'

/** 结算中心（finance.read，仅店主；申请结算按 finance.apply 另行鉴权，店铺暂停时不可申请）。 */
export const dynamic = 'force-dynamic'

export default async function Page() {
  // 页面守卫（边界检查规则 5）：非成员 / 越权 → 404，未登录 → /partner/login；不包进 try
  const ctx = await requirePartnerPage('finance.read')
  return (
    <PartnerShell readOnly={ctx.readOnly} role={ctx.role}>
      <FinanceView canApply={ctx.role === 'OWNER' && ctx.perms.has('finance.apply') && !ctx.readOnly} />
    </PartnerShell>
  )
}
