import { requirePartnerPage } from '@/lib/tenant/partner-page'
import { PartnerShell } from '@/components/partner/shell/partner-shell'
import { StatementDetailView } from '@/components/partner/finance/statement-detail-view'

/** 结算单详情与对账单下载（finance.read，仅店主）。 */
export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: { statementNo: string } }) {
  // 页面守卫（边界检查规则 5）：非成员 / 越权 → 404，未登录 → /partner/login；不包进 try
  const ctx = await requirePartnerPage('finance.read')
  return (
    <PartnerShell readOnly={ctx.readOnly} role={ctx.role}>
      <StatementDetailView statementNo={params.statementNo} />
    </PartnerShell>
  )
}
