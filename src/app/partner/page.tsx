import { requirePartnerPage } from '@/lib/tenant/partner-page'
import { PartnerShell } from '@/components/partner/shell/partner-shell'
import { DashboardView } from '@/components/partner/dashboard/dashboard-view'

/** 渠道后台看板（dashboard.read）。数据经 GET /api/partner/dashboard 在客户端加载，页面本身不渲染数据。 */
export const dynamic = 'force-dynamic'

export default async function Page() {
  // 页面守卫（边界检查规则 5）：非成员 / 越权 → 404，未登录 → /partner/login；不包进 try
  const ctx = await requirePartnerPage('dashboard.read')
  return (
    <PartnerShell readOnly={ctx.readOnly} role={ctx.role}>
      <DashboardView />
    </PartnerShell>
  )
}
