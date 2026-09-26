import { requirePartnerPage } from '@/lib/tenant/partner-page'
import { PartnerShell } from '@/components/partner/shell/partner-shell'
import { AuditView } from '@/components/partner/audit/audit-view'

/** 本店操作日志（audit.read；平台操作显示为「平台」，只给变更摘要）。 */
export const dynamic = 'force-dynamic'

export default async function Page() {
  // 页面守卫（边界检查规则 5）：非成员 / 越权 → 404，未登录 → /partner/login；不包进 try
  const ctx = await requirePartnerPage('audit.read')
  return (
    <PartnerShell readOnly={ctx.readOnly} role={ctx.role}>
      <AuditView />
    </PartnerShell>
  )
}
