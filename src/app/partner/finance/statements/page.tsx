import { requirePartnerPage } from '@/lib/tenant/partner-page'
import { PartnerShell } from '@/components/partner/shell/partner-shell'
import { StatementsView } from '@/components/partner/finance/statements-view'

/** 结算单列表（finance.read，仅店主）。 */
export const dynamic = 'force-dynamic'

export default async function Page() {
  // 页面守卫（边界检查规则 5）：非成员 / 越权 → 404，未登录 → /partner/login；不包进 try
  const ctx = await requirePartnerPage('finance.read')
  return (
    <PartnerShell readOnly={ctx.readOnly} role={ctx.role}>
      <StatementsView />
    </PartnerShell>
  )
}
